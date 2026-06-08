import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { usePersistentState } from "../../components/onboarding/onboardingStore";
import { useSkipGuard } from "../../components/onboarding/useSkipGuard";
import { useT } from "../../components/i18n/LanguageProvider";
import { type TranslationKey } from "../../components/i18n/translations";
import {
  EXAM_GRADES,
  EXAM_SUBJECTS,
  QUAL_DETAIL_OPTS,
  QUAL_FREETEXT_PLACEHOLDERS,
  QUAL_IELTS_SCORES,
  QUAL_IELTS_TESTS,
  qualDetailKind,
  qualTypes,
} from "../../components/onboarding/tutorQuals";
import { subIconFor, type Interest } from "./StudentCatSel";

/**
 * Tutor onboarding — "Strengths & Details" (step 4).
 *
 * An accordion of the tutor's chosen subjects; exactly one card is expanded at a
 * time (first open by default). Each card collects years of experience, pay,
 * achievements, relevant experience and qualifications. The qualification
 * type → detail logic lives in components/onboarding/tutorQuals.ts. Everything
 * is local state, handed FORWARD on Continue — no backend (CLAUDE.md).
 *
 * Web-spec adaptations (no web `<select>`, no Material Symbols font): dropdowns
 * are custom pop-up sheets; the years wheel and pay slider are rebuilt with
 * React Native's built-in scroll + PanResponder; icons use @expo/vector-icons.
 */

type Subject = { id: string; label: string; catId: string; color: string };
type Qualification = {
  type?: string;
  detail?: string;
  test?: string;
  subject?: string;
  grade?: string;
};
type Experience = {
  text: string;
  kind: "duration" | "event";
  dur: string;
  unit: "months" | "years";
  ongoing: boolean;
  year: string;
};
type Detail = {
  years: string;
  pay: number;
  achievements: string[];
  experiences: Experience[];
  quals: Qualification[];
};

const PROGRESS = 0.9;
const YEARS_VALUES = Array.from({ length: 30 }, (_, i) => String(i)).concat("30+");
const DUR_VALUES = Array.from({ length: 10 }, (_, i) => String(i)).concat("10+");
const UNIT_VALUES = ["months", "years"];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_VALUES = Array.from({ length: 57 }, (_, i) => String(CURRENT_YEAR - i));
const PAY_MIN = 100;
const PAY_MAX = 3000;
const PAY_STEP = 50;
const DEFAULT_DETAIL: Detail = {
  years: "0",
  pay: 300,
  achievements: [],
  experiences: [],
  quals: [],
};

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72;
}

const LEVEL_KEYS: Record<string, TranslationKey> = {
  kindergarten: "level.kindergarten",
  primary: "level.primary",
  middle: "level.middle",
  high: "level.high",
  university: "level.university",
  adult: "level.adult",
};

type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

// One-line summaries used by the review view.
function formatExp(ex: Experience, t: TFn): string {
  const name = ex.text.trim() || t("sd.exp.unnamed");
  if (ex.kind === "event") return ex.year ? `${name} · ${ex.year}` : name;
  return `${name} · ${ex.dur} ${ex.unit} · ${ex.ongoing ? t("sd.seg.ongoing") : t("sd.seg.ended")}`;
}

function formatQual(q: Qualification): string {
  const kind = qualDetailKind(q.type);
  const parts: string[] = [];
  if (q.type) parts.push(q.type);
  if (kind === "exam" || kind === "degree") {
    if (q.subject) parts.push(q.subject);
    if (q.grade) parts.push(q.grade);
  } else if (kind === "ielts") {
    const s = [q.test, q.detail].filter(Boolean).join(" ");
    if (s) parts.push(s);
  } else if (q.detail) {
    parts.push(q.detail);
  }
  return parts.join(" — ");
}

/** A labelled block on the review view; shows "None added" when empty. */
function RevSection({ label, lines }: { label: string; lines: string[] }) {
  const t = useT();
  return (
    <View style={styles.revSection}>
      <Text style={styles.revLabel}>{label}</Text>
      {lines.length > 0 ? (
        lines.map((ln, i) => (
          <Text key={i} style={styles.revValue}>
            {ln}
          </Text>
        ))
      ) : (
        <Text style={styles.revMuted}>{t("sd.review.noneAdded")}</Text>
      )}
    </View>
  );
}

// ---- small building blocks --------------------------------------------------

function Disc({
  icon,
  color,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}) {
  return (
    <View style={[styles.disc, { backgroundColor: color }]}>
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color="#FFFFFF"
        style={isLightColor(color) ? styles.discIconShadow : undefined}
      />
    </View>
  );
}

function FieldLabel({
  icon,
  children,
}: {
  icon?: keyof typeof MaterialIcons.glyphMap;
  children: string;
}) {
  return (
    <View style={styles.fieldLabel}>
      {icon ? <MaterialIcons name={icon} size={17} color="#2D6A4F" /> : null}
      <Text style={styles.fieldLabelText}>{children}</Text>
    </View>
  );
}

function AddRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.addRow} onPress={onPress} accessibilityRole="button">
      <MaterialIcons name="add-circle" size={20} color="#2D6A4F" />
      <Text style={styles.addRowText}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Two-button segmented toggle (.ls-seg). */
function Segmented({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.seg}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <TouchableOpacity
            key={o.key}
            style={[styles.segBtn, on && styles.segBtnOn]}
            onPress={() => onChange(o.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.segText, on && styles.segTextOn]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Custom pop-up dropdown (replaces the web `<select>`). */
function Select({
  value,
  options,
  placeholder,
  onChange,
  triggerStyle,
  sheetTitle,
}: {
  value?: string;
  options: string[];
  placeholder: string;
  onChange: (v: string) => void;
  triggerStyle?: object;
  sheetTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        style={[styles.select, triggerStyle]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={value || placeholder}
      >
        <Text
          style={[styles.selectText, !value && styles.selectPlaceholder]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <MaterialIcons name="expand-more" size={20} color="#9CA3AF" />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={sheetTitle ?? placeholder}>
        <ScrollView style={styles.sheetList} keyboardShouldPersistTaps="handled">
          {options.map((o) => {
            const on = o === value;
            return (
              <TouchableOpacity
                key={o}
                style={[styles.optRow, on && styles.optRowOn]}
                onPress={() => {
                  onChange(o);
                  setOpen(false);
                }}
              >
                <Text style={[styles.optText, on && styles.optTextOn]}>{o}</Text>
                {on ? <Ionicons name="checkmark" size={20} color="#2D6A4F" /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </>
  );
}

const ROW_H = 46;
const WHEEL_VISIBLE = 5;

/** iOS-style snap scroll picker (years). */
function ScrollWheel({
  values,
  value,
  onChange,
  width = 120,
}: {
  values: string[];
  value: string;
  onChange: (v: string) => void;
  width?: number;
}) {
  const ref = useRef<ScrollView>(null);
  const mountIdx = useRef(Math.max(0, values.indexOf(value))).current;
  useEffect(() => {
    const t = setTimeout(
      () => ref.current?.scrollTo({ y: mountIdx * ROW_H, animated: false }),
      0,
    );
    return () => clearTimeout(t);
  }, [mountIdx]);
  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(
      0,
      Math.min(values.length - 1, Math.round(e.nativeEvent.contentOffset.y / ROW_H)),
    );
    if (values[i] !== value) onChange(values[i]);
  };
  return (
    <View style={[styles.wheelWrap, { width, height: ROW_H * WHEEL_VISIBLE }]}>
      <View pointerEvents="none" style={styles.wheelSelBox} />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW_H}
        decelerationRate="fast"
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
        contentContainerStyle={{ paddingVertical: ROW_H * 2 }}
      >
        {values.map((v) => (
          <View key={v} style={styles.wheelRow}>
            <Text style={[styles.wheelText, v === value && styles.wheelTextOn]}>{v}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const THUMB = 26;

/** Drag slider with a tooltip above the thumb (pay). */
function ValueSlider({
  min,
  max,
  step,
  value,
  onChange,
  format,
  topStop,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  topStop: string;
}) {
  const [w, setW] = useState(0);
  const usable = Math.max(1, w - THUMB);
  const ratio = (value - min) / (max - min);
  const thumbX = ratio * usable;

  // The track's left edge in screen coordinates. We map the finger's ABSOLUTE x
  // (pageX) against this — NOT the per-touch locationX, which React Native
  // reports relative to whichever child the finger is over (the thumb). That
  // relative reading was the cause of the price jumping to a low value and back
  // as the thumb caught up under the finger.
  const trackRef = useRef<View>(null);
  const trackLeftRef = useRef(0);
  const measureTrack = () =>
    trackRef.current?.measureInWindow((x) => {
      trackLeftRef.current = x;
    });

  // Reassigned every render so the (once-created) PanResponder always reads the
  // latest layout/value rather than a stale closure.
  const onXRef = useRef((_pageX: number) => {});
  onXRef.current = (pageX: number) => {
    const rel = pageX - trackLeftRef.current - THUMB / 2;
    const clamped = Math.max(0, Math.min(usable, rel));
    let v = min + (clamped / usable) * (max - min);
    v = Math.max(min, Math.min(max, Math.round(v / step) * step));
    if (v !== value) onChange(v);
  };

  const pan = useRef(
    PanResponder.create({
      // Claim the touch (including at the capture phase) so neither a child nor
      // a parent scroll view can steal the horizontal drag.
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      // Once dragging, never hand the gesture off mid-drag.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        measureTrack();
        onXRef.current(e.nativeEvent.pageX);
      },
      onPanResponderMove: (e) => onXRef.current(e.nativeEvent.pageX),
    }),
  ).current;

  const TIP_W = 72;
  const tipText = value >= max ? topStop : format(value);
  const tipLeft = Math.max(0, Math.min(Math.max(0, w - TIP_W), thumbX + THUMB / 2 - TIP_W / 2));

  return (
    <View>
      <View style={styles.tipRow}>
        {w > 0 ? (
          <View style={[styles.tip, { left: tipLeft }]}>
            <Text style={styles.tipText}>{tipText}</Text>
          </View>
        ) : null}
      </View>
      <View
        ref={trackRef}
        style={styles.track}
        onLayout={(e: LayoutChangeEvent) => {
          setW(e.nativeEvent.layout.width);
          measureTrack();
        }}
        {...pan.panHandlers}
      >
        <View style={styles.trackBg} />
        <View style={[styles.trackFill, { width: thumbX + THUMB / 2 }]} />
        <View style={[styles.thumb, { left: thumbX }]} />
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>{format(min)}</Text>
        <Text style={styles.sliderLabel}>{topStop}</Text>
      </View>
    </View>
  );
}

/** Field 2 (Detail) for one qualification — renders per the type. */
function QualResult({
  qual,
  onUpdate,
}: {
  qual: Qualification;
  onUpdate: (patch: Partial<Qualification>) => void;
}) {
  const t = useT();
  const kind = qualDetailKind(qual.type);
  if (kind === "none" || !qual.type) return null;

  if (kind === "exam") {
    return (
      <>
        <FieldLabel>{t("sd.field.subject")}</FieldLabel>
        <Select
          value={qual.subject}
          placeholder={t("sd.select.subject")}
          sheetTitle={t("sd.field.subject")}
          options={EXAM_SUBJECTS[qual.type] ?? []}
          onChange={(v) => onUpdate({ subject: v })}
        />
        <FieldLabel>{t("sd.field.grade")}</FieldLabel>
        <Select
          value={qual.grade}
          placeholder={t("sd.select.grade")}
          sheetTitle={t("sd.field.grade")}
          options={EXAM_GRADES[qual.type] ?? []}
          onChange={(v) => onUpdate({ grade: v })}
        />
      </>
    );
  }

  if (kind === "degree") {
    return (
      <>
        <FieldLabel>{t("sd.field.subject")}</FieldLabel>
        <TextInput
          style={styles.input}
          value={qual.subject ?? ""}
          onChangeText={(text) => onUpdate({ subject: text })}
          placeholder={t("sd.placeholder.degreeSubject")}
          placeholderTextColor="#9CA3AF"
        />
        <FieldLabel>{t("sd.field.grade")}</FieldLabel>
        <TextInput
          style={styles.input}
          value={qual.grade ?? ""}
          onChangeText={(text) => onUpdate({ grade: text })}
          placeholder={t("sd.placeholder.degreeGrade")}
          placeholderTextColor="#9CA3AF"
        />
      </>
    );
  }

  if (kind === "dropdown") {
    return (
      <>
        <FieldLabel>{t("sd.field.detail")}</FieldLabel>
        <Select
          value={qual.detail}
          placeholder={t("sd.select.generic")}
          options={QUAL_DETAIL_OPTS[qual.type] ?? []}
          onChange={(v) => onUpdate({ detail: v })}
        />
      </>
    );
  }

  if (kind === "ielts") {
    return (
      <>
        <FieldLabel>{t("sd.field.detail")}</FieldLabel>
        <Select
          value={qual.test}
          placeholder={t("sd.select.test")}
          sheetTitle={t("sd.select.test")}
          options={QUAL_IELTS_TESTS}
          onChange={(v) => onUpdate({ test: v, detail: undefined })}
        />
        {qual.test ? (
          <View style={{ marginTop: 10 }}>
            <Select
              value={qual.detail}
              placeholder={t("sd.select.generic")}
              sheetTitle={t("sd.select.generic")}
              options={QUAL_IELTS_SCORES[qual.test] ?? []}
              onChange={(v) => onUpdate({ detail: v })}
            />
          </View>
        ) : null}
      </>
    );
  }

  // free text
  return (
    <>
      <FieldLabel>Detail</FieldLabel>
      <TextInput
        style={styles.input}
        value={qual.detail ?? ""}
        onChangeText={(text) => onUpdate({ detail: text })}
        placeholder={QUAL_FREETEXT_PLACEHOLDERS[qual.type] ?? ""}
        placeholderTextColor="#9CA3AF"
      />
    </>
  );
}

// ---- subject card -----------------------------------------------------------

function DetailCard({
  subject,
  detail,
  open,
  onToggle,
  onPatch,
}: {
  subject: Subject;
  detail: Detail;
  open: boolean;
  onToggle: () => void;
  onPatch: (partial: Partial<Detail>) => void;
}) {
  const t = useT();
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (open) {
      rise.setValue(0);
      Animated.timing(rise, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    }
  }, [open, rise]);

  const n = detail.quals.length;
  const summary = [
    detail.years !== "0" ? `${detail.years} yr` : null,
    n ? `${n} qual${n > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const setQualType = (i: number, type: string) =>
    onPatch({ quals: detail.quals.map((x, j) => (j === i ? { type } : x)) });
  const updateQual = (i: number, patch: Partial<Qualification>) =>
    onPatch({ quals: detail.quals.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  return (
    <View style={styles.card}>
      <Pressable style={styles.cardHeader} onPress={onToggle} accessibilityRole="button">
        <Disc icon={subIconFor(subject.catId, subject.id)} color={subject.color} />
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{subject.label}</Text>
          {summary ? <Text style={styles.cardSummary}>{summary}</Text> : null}
        </View>
        <MaterialIcons
          name={open ? "expand-less" : "expand-more"}
          size={24}
          color="#9CA3AF"
        />
      </Pressable>

      {open ? (
        <Animated.View
          style={[
            styles.expanded,
            {
              opacity: rise,
              transform: [
                { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
              ],
            },
          ]}
        >
          {/* Years of experience */}
          <FieldLabel icon="schedule">{t("sd.field.years")}</FieldLabel>
          <View style={styles.wheelCard}>
            <ScrollWheel
              values={YEARS_VALUES}
              value={detail.years}
              onChange={(v) => onPatch({ years: v })}
            />
          </View>

          {/* Preferred pay */}
          <FieldLabel icon="payments">{t("sd.field.pay")}</FieldLabel>
          <ValueSlider
            min={PAY_MIN}
            max={PAY_MAX}
            step={PAY_STEP}
            value={detail.pay}
            onChange={(v) => onPatch({ pay: v })}
            format={(v) => `$${v}`}
            topStop="$3000+"
          />

          {/* Achievements */}
          <FieldLabel icon="emoji-events">{t("sd.field.achievements")}</FieldLabel>
          {detail.achievements.map((a, i) => (
            <TextInput
              key={i}
              style={[styles.input, styles.stackInput]}
              value={a}
              onChangeText={(text) =>
                onPatch({ achievements: detail.achievements.map((x, j) => (j === i ? text : x)) })
              }
              placeholder={t("sd.placeholder.achievement")}
              placeholderTextColor="#9CA3AF"
            />
          ))}
          <AddRow
            label={t("sd.add.achievement")}
            onPress={() => onPatch({ achievements: [...detail.achievements, ""] })}
          />

          {/* Relevant experience */}
          <FieldLabel icon="work-history">{t("sd.field.experience")}</FieldLabel>
          {detail.experiences.map((ex, i) => {
            const upd = (p: Partial<Experience>) =>
              onPatch({
                experiences: detail.experiences.map((x, j) => (j === i ? { ...x, ...p } : x)),
              });
            return (
              <View key={i} style={styles.expCard}>
                <TextInput
                  style={styles.input}
                  value={ex.text}
                  onChangeText={(text) => upd({ text: text })}
                  placeholder={t("sd.placeholder.experience")}
                  placeholderTextColor="#9CA3AF"
                />
                <Segmented
                  options={[
                    { key: "duration", label: t("sd.seg.duration") },
                    { key: "event", label: t("sd.seg.event") },
                  ]}
                  value={ex.kind}
                  onChange={(k) => upd({ kind: k as "duration" | "event" })}
                />
                {ex.kind === "duration" ? (
                  <>
                    <View style={styles.expDurRow}>
                      <Select
                        value={ex.dur}
                        options={DUR_VALUES}
                        placeholder="0"
                        sheetTitle="Duration"
                        triggerStyle={styles.expDurSelect}
                        onChange={(v) => upd({ dur: v })}
                      />
                      <Select
                        value={ex.unit}
                        options={UNIT_VALUES}
                        placeholder="years"
                        sheetTitle="Period"
                        triggerStyle={styles.expUnitSelect}
                        onChange={(v) => upd({ unit: v as "months" | "years" })}
                      />
                    </View>
                    <Segmented
                      options={[
                        { key: "ongoing", label: t("sd.seg.ongoing") },
                        { key: "ended", label: t("sd.seg.ended") },
                      ]}
                      value={ex.ongoing ? "ongoing" : "ended"}
                      onChange={(k) => upd({ ongoing: k === "ongoing" })}
                    />
                  </>
                ) : (
                  <Select
                    value={ex.year}
                    options={YEAR_VALUES}
                    placeholder={t("sd.select.year")}
                    sheetTitle={t("sd.select.year")}
                    onChange={(v) => upd({ year: v })}
                  />
                )}
              </View>
            );
          })}
          <AddRow
            label={t("sd.add.experience")}
            onPress={() =>
              onPatch({
                experiences: [
                  ...detail.experiences,
                  { text: "", kind: "duration", dur: "1", unit: "years", ongoing: true, year: "" },
                ],
              })
            }
          />

          {/* Qualifications */}
          <FieldLabel icon="workspace-premium">{t("sd.field.qualifications")}</FieldLabel>
          <Text style={styles.qualHelper}>{t("sd.qualHelper")}</Text>
          {detail.quals.map((qu, i) => (
            <View key={i} style={styles.qualCard}>
              <View style={styles.qualCardHead}>
                <Text style={styles.qualCardTitle}>{t("sd.qual.n", { n: i + 1 })}</Text>
                <TouchableOpacity
                  onPress={() =>
                    onPatch({ quals: detail.quals.filter((_, j) => j !== i) })
                  }
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove qualification ${i + 1}`}
                >
                  <MaterialIcons name="delete" size={18} color="#E63946" />
                </TouchableOpacity>
              </View>
              <Select
                value={qu.type}
                placeholder={t("sd.select.qualType")}
                options={qualTypes(subject.id, subject.catId)}
                onChange={(v) => setQualType(i, v)}
              />
              <QualResult qual={qu} onUpdate={(patch) => updateQual(i, patch)} />
            </View>
          ))}
          <AddRow
            label={t("sd.add.qualification")}
            onPress={() => onPatch({ quals: [...detail.quals, {}] })}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

// ---- screen -----------------------------------------------------------------

export default function TutorSD() {
  const params = useLocalSearchParams<{ levels?: string; interests?: string }>();

  const subjects = useMemo<Subject[]>(() => {
    if (!params.interests) return [];
    try {
      const arr = JSON.parse(params.interests) as Interest[];
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((it) => it.catId && it.subId)
        .map((it) => ({
          id: it.subId,
          label: it.label ?? it.subId,
          catId: it.catId,
          color: it.color ?? "#2D6A4F",
        }));
    } catch {
      return [];
    }
  }, [params.interests]);

  const levels = useMemo<string[]>(() => {
    if (!params.levels) return [];
    try {
      const a = JSON.parse(params.levels);
      return Array.isArray(a) ? (a as string[]) : [];
    } catch {
      return [];
    }
  }, [params.levels]);
  const hasHighUni = levels.includes("high") && levels.includes("university");

  // Per-subject details, keyed by "<catId>:<subId>". Persisted so leaving this
  // screen (e.g. to add a missing subject upstream) and returning keeps every
  // field. Keys are stable, so removing then re-adding a subject restores its
  // details (see onboardingStore).
  const [details, setDetails] = usePersistentState<Record<string, Detail>>(
    "tutor:sd:details",
    {},
  );
  const [openKey, setOpenKey] = useState<string>(
    subjects[0] ? `${subjects[0].catId}:${subjects[0].id}` : "",
  );
  const [modal, setModal] = useState(false);
  const [view, setView] = useState<"details" | "review">("details");

  // One-time "Skip this step?" confirmation, shared across all onboarding Skips.
  const { requestSkip, skipModal } = useSkipGuard();
  const t = useT();

  const keyOf = (s: Subject) => `${s.catId}:${s.id}`;
  const getDetail = (key: string) => details[key] ?? DEFAULT_DETAIL;
  const patch = (key: string, partial: Partial<Detail>) =>
    setDetails((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? DEFAULT_DETAIL), ...partial },
    }));

  const academic = subjects.filter((s) => s.catId === "academics");
  const completed = academic.filter((s) =>
    getDetail(keyOf(s)).quals.some((q) => !!q.type),
  ).length;
  const allDone = academic.length > 0 && completed === academic.length;
  const showBanner = hasHighUni && academic.length > 0;
  const missing = hasHighUni && academic.length > 0 && completed < academic.length;

  const openFirstIncompleteAcademic = () => {
    const target = academic.find(
      (s) => !getDetail(keyOf(s)).quals.some((q) => !!q.type),
    );
    if (target) setOpenKey(keyOf(target));
  };

  const proceed = () =>
    router.push({
      pathname: "/onboarding/TutorPrefs",
      params: {
        ...(params.levels ? { levels: params.levels } : {}),
        ...(params.interests ? { interests: params.interests } : {}),
        tutorDetails: JSON.stringify(details),
      },
    });
  const goReview = () => setView("review");
  const editSubject = (key: string) => {
    setOpenKey(key);
    setView("details");
  };
  const onContinue = () => {
    if (missing) setModal(true);
    else goReview();
  };

  if (view === "review") {
    const levelsText =
      levels.length > 0
        ? levels.map((k) => (LEVEL_KEYS[k] ? t(LEVEL_KEYS[k]) : k)).join(", ")
        : t("common.notSet");
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Disable the iOS swipe-from-edge "back" gesture on this screen so it
            can't hijack a rightward drag on the pay slider. The on-screen back
            arrow still works. */}
        <Stack.Screen options={{ gestureEnabled: false }} />
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>
        <View style={styles.headerRow}>
          <Pressable
            hitSlop={8}
            onPress={() => setView("details")}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={28} color="#111827" />
          </Pressable>
          <View />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.h1}>{t("sd.review.title")}</Text>
          <Text style={styles.sub}>{t("sd.review.subtitle")}</Text>
          <Text style={styles.levelsLine}>
            <Text style={styles.levelsLabel}>{t("sd.review.teaches")}</Text>
            {levelsText}
          </Text>

          <View style={styles.cardsWrap}>
            {subjects.map((s) => {
              const key = keyOf(s);
              const d = getDetail(key);
              const achievements = d.achievements.filter((a) => a.trim().length > 0);
              const quals = d.quals.filter((q) => !!q.type);
              const payText = d.pay >= PAY_MAX ? "$3000+" : `$${d.pay}`;
              return (
                <View key={key} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Disc icon={subIconFor(s.catId, s.id)} color={s.color} />
                    <Text style={[styles.cardTitle, styles.revName]}>{s.label}</Text>
                    <TouchableOpacity
                      style={styles.revEdit}
                      onPress={() => editSubject(key)}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${s.label}`}
                    >
                      <MaterialIcons name="edit" size={15} color="#2D6A4F" />
                      <Text style={styles.revEditText}>{t("common.edit")}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.revBody}>
                    <RevSection
                      label={t("sd.field.years")}
                      lines={[
                        d.years === "1"
                          ? t("sd.years.one", { n: d.years })
                          : t("sd.years.other", { n: d.years }),
                      ]}
                    />
                    <RevSection label={t("sd.field.pay")} lines={[payText]} />
                    <RevSection label={t("sd.field.achievements")} lines={achievements} />
                    <RevSection
                      label={t("sd.field.experience")}
                      lines={d.experiences.map((ex) => formatExp(ex, t))}
                    />
                    <RevSection label={t("sd.field.qualifications")} lines={quals.map(formatQual)} />
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button label={t("common.confirm")} variant="primary" onPress={proceed} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
      </View>
      <View style={styles.headerRow}>
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </Pressable>
        <Pressable
          hitSlop={8}
          onPress={() => requestSkip(proceed)}
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <Text style={styles.skip}>{t("common.skip")}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.h1}>{t("sd.title")}</Text>
        <Text style={styles.sub}>{t("sd.subtitle")}</Text>

        {showBanner ? (
          <View style={[styles.banner, allDone ? styles.bannerGreen : styles.bannerGold]}>
            <View style={styles.bannerRow}>
              <MaterialIcons
                name="verified"
                size={18}
                color={allDone ? "#235741" : "#D98E0A"}
              />
              <Text style={[styles.bannerTitle, { color: allDone ? "#235741" : "#D98E0A" }]}>
                {t("sd.banner.title")}
              </Text>
            </View>
            <Text style={styles.bannerProgress}>
              {t("sd.banner.progress", { completed, total: academic.length })}
            </Text>
            {!allDone ? (
              <TouchableOpacity
                style={styles.bannerChip}
                onPress={openFirstIncompleteAcademic}
                accessibilityRole="button"
              >
                <MaterialIcons name="bolt" size={18} color="#D98E0A" />
                <Text style={styles.bannerChipText}>{t("sd.banner.addMissing")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <View style={styles.cardsWrap}>
          {subjects.map((s) => {
            const key = keyOf(s);
            return (
              <DetailCard
                key={key}
                subject={s}
                detail={getDetail(key)}
                open={openKey === key}
                onToggle={() => setOpenKey(openKey === key ? "" : key)}
                onPatch={(partial) => patch(key, partial)}
              />
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t("common.continue")} variant="primary" onPress={onContinue} />
      </View>

      {/* Finish later? modal */}
      <Modal
        visible={modal}
        transparent
        animationType="fade"
        onRequestClose={() => setModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setModal(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <MaterialIcons name="bookmark" size={26} color="#2D6A4F" />
            </View>
            <Text style={styles.modalTitle}>{t("sd.modal.title")}</Text>
            <Text style={styles.modalText}>{t("sd.modal.text")}</Text>
            <Button
              label={t("sd.modal.addNow")}
              variant="primary"
              onPress={() => setModal(false)}
              style={styles.modalBtn}
            />
            <Button
              label={t("sd.modal.continueAnyway")}
              variant="ghost"
              onPress={() => {
                setModal(false);
                goReview();
              }}
              style={styles.modalBtn}
            />
          </View>
        </View>
      </Modal>

      {skipModal}
    </SafeAreaView>
  );
}

const HAIRLINE = "rgba(60,60,67,0.12)";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  progressTrack: { height: 4, backgroundColor: "#E5E7EB", width: "100%" },
  progressFill: { height: 4, backgroundColor: "#2D6A4F" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    paddingHorizontal: 18,
  },
  skip: { fontSize: 17, fontWeight: "600", color: "#6B7280" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 24 },
  h1: { marginTop: 6, fontSize: 28, fontWeight: "700", letterSpacing: -0.5, color: "#16201C" },
  sub: { marginTop: 6, fontSize: 15, color: "#6B7280", lineHeight: 21 },

  banner: { marginTop: 16, padding: 14, borderRadius: 18 },
  bannerGreen: { backgroundColor: "#E8F1ED" },
  bannerGold: { backgroundColor: "#FDF3DD" },
  bannerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bannerTitle: { flex: 1, fontSize: 13.5, fontWeight: "700" },
  bannerProgress: { fontSize: 13, color: "#16201C", marginTop: 6, marginBottom: 10 },
  bannerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F4A923",
  },
  bannerChipText: { color: "#D98E0A", fontSize: 13.5, fontWeight: "700" },

  cardsWrap: { gap: 12, marginTop: 18 },
  card: { backgroundColor: "#F9F9F7", borderRadius: 18, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  disc: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  discIconShadow: {
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 15.5, fontWeight: "700", color: "#16201C" },
  cardSummary: { fontSize: 12.5, color: "#6B7280", marginTop: 1 },
  expanded: { paddingHorizontal: 16, paddingBottom: 18 },

  levelsLine: { marginTop: 12, fontSize: 14, color: "#16201C" },
  levelsLabel: { fontWeight: "700" },
  revName: { flex: 1 },
  revEdit: { flexDirection: "row", alignItems: "center", gap: 3 },
  revEditText: { color: "#2D6A4F", fontSize: 13.5, fontWeight: "700" },
  revBody: { paddingHorizontal: 16, paddingBottom: 14 },
  revSection: { marginTop: 12 },
  revLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  revValue: { fontSize: 14, color: "#16201C", lineHeight: 20, marginBottom: 2 },
  revMuted: { fontSize: 14, color: "#9CA3AF", fontStyle: "italic" },

  fieldLabel: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 18, marginBottom: 8 },
  fieldLabelText: { fontSize: 13.5, fontWeight: "700", color: "#16201C" },

  wheelCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 6,
  },
  wheelWrap: { justifyContent: "center" },
  wheelSelBox: {
    position: "absolute",
    top: (ROW_H * WHEEL_VISIBLE - ROW_H) / 2,
    left: 8,
    right: 8,
    height: ROW_H,
    borderRadius: 10,
    backgroundColor: "#F0F1F3",
  },
  wheelRow: { height: ROW_H, alignItems: "center", justifyContent: "center" },
  wheelText: { fontSize: 22, color: "#9CA3AF" },
  wheelTextOn: { color: "#16201C", fontWeight: "700" },

  tipRow: { height: 30 },
  tip: {
    position: "absolute",
    top: 0,
    width: 72,
    backgroundColor: "#2D6A4F",
    borderRadius: 10,
    paddingVertical: 4,
    alignItems: "center",
  },
  tipText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  track: { height: 40, justifyContent: "center" },
  trackBg: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
  },
  trackFill: { position: "absolute", left: 0, height: 6, borderRadius: 3, backgroundColor: "#2D6A4F" },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: HAIRLINE,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  sliderLabel: { fontSize: 13, color: "#6B7280" },

  input: {
    height: 46,
    borderWidth: 1.5,
    borderColor: HAIRLINE,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#16201C",
    backgroundColor: "#F9F9F7",
  },
  stackInput: { marginBottom: 8 },
  expCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  expDurRow: { flexDirection: "row", gap: 8 },
  expDurSelect: { width: 110 },
  expUnitSelect: { flex: 1 },
  seg: { flexDirection: "row", backgroundColor: "#E5E7EB", borderRadius: 22, padding: 4, gap: 4 },
  segBtn: { flex: 1, height: 38, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  segBtnOn: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segText: { fontSize: 14.5, fontWeight: "600", color: "#6B7280" },
  segTextOn: { color: "#16201C" },

  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 14,
    marginTop: 2,
  },
  addRowText: { fontSize: 14.5, fontWeight: "600", color: "#2D6A4F" },

  qualHelper: { fontSize: 12.5, color: "#6B7280", lineHeight: 18, marginTop: -2, marginBottom: 12 },
  qualCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  qualCardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  qualCardTitle: { fontSize: 12.5, fontWeight: "700", color: "#6B7280" },

  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 46,
    borderWidth: 1.5,
    borderColor: HAIRLINE,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: "#F9F9F7",
  },
  selectText: { flex: 1, fontSize: 15.5, fontWeight: "600", color: "#16201C" },
  selectPlaceholder: { color: "#9CA3AF", fontWeight: "400" },

  sheetList: { maxHeight: 380 },
  optRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 50,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: "#F9F9F7",
  },
  optRowOn: { backgroundColor: "#E8F1ED" },
  optText: { flex: 1, fontSize: 16, color: "#16201C" },
  optTextOn: { fontWeight: "700", color: "#2D6A4F" },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECECEC",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E8F1ED",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },
  modalTitle: { textAlign: "center", fontSize: 19, fontWeight: "700", color: "#16201C" },
  modalText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14.5,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 18,
  },
  modalBtn: { marginTop: 8 },
});
