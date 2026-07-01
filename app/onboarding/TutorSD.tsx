import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
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
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { selectionTick } from "../../components/ui/feedback";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { KeyboardAvoider } from "../../components/ui/KeyboardAvoider";
import { SelectableCircle } from "../../components/ui/SelectableCircle";
import { DistrictPicker } from "../../components/onboarding/DistrictPicker";
import { subName } from "../../components/onboarding/hkDistricts";
import { getStored, usePersistentState } from "../../components/onboarding/onboardingStore";
import { type FormatId } from "../../components/onboarding/PreferencesScreen";
import { onStepContinue, onStepSkip } from "../../components/onboarding/tutorOnboarding";
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
 * time (first open by default). Each card collects years of teaching experience,
 * pay, lesson format, achievements, relevant experience and qualifications. The
 * qualification type → detail logic lives in components/onboarding/tutorQuals.ts.
 * Lesson format is collected here (per subject) rather than on TutorPrefs, since
 * a tutor may teach some subjects in person and others online. Everything is
 * local state, handed FORWARD on Continue — no backend (CLAUDE.md).
 *
 * Web-spec adaptations (no web `<select>`, no Material Symbols font): dropdowns
 * are custom pop-up sheets; the years wheel uses RN scroll; the pay slider is a
 * Reanimated + gesture-handler slider (UI-thread thumb — see ValueSlider); icons
 * use @expo/vector-icons. The pay slider is non-linear (small $10 steps near the
 * bottom, bigger $100 steps near the top) so the common $200–$500 range is easy
 * to land on.
 */

type Subject = { id: string; label: string; catId: string; color: string };
type LevelKey = "kindergarten" | "primary" | "middle" | "high" | "university" | "adult";
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
/** Per-subject student capacity: how many the tutor teaches now vs the most
 *  they want to take on (rendered as "current / capacity", e.g. 0/1). */
type Slots = { current: number; capacity: number };
type Detail = {
  years: string;
  pay: number;
  format: FormatId;
  levels: string[];
  /** Chosen subdistrict slugs (e.g. "causeway_bay"); only used for in-person / both. */
  districts: string[];
  /** Student slots — how many students the tutor currently has vs wants. */
  slots: Slots;
  achievements: string[];
  experiences: Experience[];
  quals: Qualification[];
};

/** Whether a lesson format involves meeting in person (so a location is asked). */
const needsLocation = (f: FormatId) => f === "in_person" || f === "both";

const PROGRESS = 0.9;
const YEARS_VALUES = Array.from({ length: 30 }, (_, i) => String(i)).concat("30+");
const DUR_VALUES = Array.from({ length: 10 }, (_, i) => String(i)).concat("10+");
const UNIT_VALUES = ["months", "years"];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_VALUES = Array.from({ length: 57 }, (_, i) => String(CURRENT_YEAR - i));
const PAY_MAX = 3000;

// Non-linear pay scale: small steps at the bottom, larger steps near the top, so
// the common $200–$500 range gets ~a third of the slider instead of ~10%. Each
// entry is one stop on the slider (equal pixel spacing), so the tiers with the
// smallest steps take up the most width. See ValueSlider.
const PAY_TIERS: [from: number, to: number, step: number][] = [
  [100, 600, 10],
  [600, 1000, 25],
  [1000, 2000, 50],
  [2000, PAY_MAX, 100],
];
const PAY_VALUES: number[] = (() => {
  const out: number[] = [];
  for (const [from, to, step] of PAY_TIERS) {
    for (let v = from; v < to; v += step) out.push(v);
  }
  out.push(PAY_MAX); // final "$3000+" stop
  return out;
})();

// Student-slots picker: the most students a tutor can take on (the right-hand
// number). The left-hand "currently teaching" number is bounded by whatever
// capacity is chosen, so its value list is built per-card.
const SLOT_CAPACITY_MAX = 20;
const SLOT_CAPACITY_VALUES = Array.from({ length: SLOT_CAPACITY_MAX }, (_, i) => String(i + 1));

// Handwriting display font (loaded in app/_layout.tsx); used for the slot guide text.
const HAND_FONT = "PatrickHand";

const DEFAULT_DETAIL: Detail = {
  years: "0",
  pay: 300,
  format: "both",
  levels: [],
  districts: [],
  slots: { current: 0, capacity: 1 },
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
const LEVEL_OPTIONS: { key: LevelKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "kindergarten", icon: "happy" },
  { key: "primary", icon: "pencil" },
  { key: "middle", icon: "book" },
  { key: "high", icon: "school" },
  { key: "university", icon: "library" },
  { key: "adult", icon: "briefcase" },
];

const FORMAT_KEYS: Record<FormatId, TranslationKey> = {
  in_person: "format.in_person",
  online: "format.online",
  both: "format.both",
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

function LevelPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (levels: string[]) => void;
}) {
  const t = useT();
  const selected = new Set(value ?? []);
  const toggle = (key: LevelKey) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(LEVEL_OPTIONS.filter((level) => next.has(level.key)).map((level) => level.key));
  };

  return (
    <View style={styles.levelPickGrid}>
      {LEVEL_OPTIONS.map((level) => {
        const label = t(LEVEL_KEYS[level.key]);
        const on = selected.has(level.key);
        return (
          <SelectableCircle
            key={level.key}
            style={styles.levelPickItem}
            label={label}
            selected={on}
            color="#2D6A4F"
            size={58}
            iconSize={24}
            labelStyle={styles.levelPickLabel}
            onPress={() => toggle(level.key)}
            accessibilityLabel={`${label}${on ? ", selected" : ""}`}
            renderIcon={({ size, color }) => (
              <Ionicons name={level.icon} size={size} color={color} />
            )}
          />
        );
      })}
    </View>
  );
}

const ROW_H = 46;
const WHEEL_VISIBLE = 5;

/** iOS-style snap scroll picker (years + student slots). `visible` is the number
 *  of rows shown (odd); the slots picker uses a shorter wheel than years. */
function ScrollWheel({
  values,
  value,
  onChange,
  width = 120,
  visible = WHEEL_VISIBLE,
}: {
  values: string[];
  value: string;
  onChange: (v: string) => void;
  width?: number;
  visible?: number;
}) {
  const ref = useRef<ScrollView>(null);
  const pad = ROW_H * Math.floor(visible / 2);
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
    <View style={[styles.wheelWrap, { width, height: ROW_H * visible }]}>
      <View pointerEvents="none" style={[styles.wheelSelBox, { top: (ROW_H * visible - ROW_H) / 2 }]} />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW_H}
        decelerationRate="fast"
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
        contentContainerStyle={{ paddingVertical: pad }}
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
const TIP_W = 72; // pay tooltip width (matches styles.tip)
const SNAP_SPRING = { damping: 20, stiffness: 260, mass: 0.5 };

/**
 * Drag slider with a tooltip above the thumb (pay). Walks a fixed list of allowed
 * `values` by INDEX (each gets equal pixel width), so the scale can be non-linear:
 * tiers with smaller money-steps contribute more entries and claim more track.
 * See PAY_VALUES.
 *
 * Built on Reanimated + gesture-handler: the thumb / fill / tooltip are driven by
 * a shared value on the UI THREAD, so the thumb stays glued to the finger at full
 * frame rate even when JS is busy (the old PanResponder version updated React
 * state per move and lagged ~0.5s behind a fast drag). The discrete value is only
 * pushed to React — with a subtle haptic tick — when the step actually changes.
 */
function ValueSlider({
  values,
  value,
  onChange,
  format,
  topStop,
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  topStop: string;
}) {
  const [w, setW] = useState(0);
  const last = values.length - 1;

  // Current value → its stop index (snap to nearest if not an exact entry, e.g. a
  // default carried over from an older scale).
  const idx = useMemo(() => {
    const exact = values.indexOf(value);
    if (exact !== -1) return exact;
    let best = 0;
    let bestDist = Infinity;
    values.forEach((v, i) => {
      const d = Math.abs(v - value);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }, [values, value]);

  // UI-thread state, so the thumb never waits on a React render.
  const pos = useSharedValue(0); // thumb x in px (0..usable)
  const usable = useSharedValue(1); // track width minus the thumb
  const trackW = useSharedValue(0); // full track width (tooltip clamp)
  const dragging = useSharedValue(false);
  const liveIdx = useSharedValue(idx); // last index the UI thread pushed

  const posForIdx = (i: number, u: number) => (last > 0 ? (i / last) * u : 0);

  // Push a step to React + a subtle haptic tick (JS thread). Behind a stable
  // wrapper so the memoized gesture never captures a stale value/onChange.
  const commitRef = useRef<(i: number) => void>(() => {});
  commitRef.current = (i: number) => {
    selectionTick();
    const v = values[i];
    if (v !== value) onChange(v);
  };
  const commitStable = useRef((i: number) => commitRef.current(i)).current;

  // Sync the thumb when the value changes from OUTSIDE a drag (mount, hydrate,
  // "Same as previous"); skipped while the finger owns it.
  useEffect(() => {
    if (dragging.value) return;
    liveIdx.value = idx;
    pos.value = withSpring(posForIdx(idx, usable.value), SNAP_SPRING);
  }, [idx, w]); // eslint-disable-line react-hooks/exhaustive-deps

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
          "worklet";
          dragging.value = true;
          const u = usable.value;
          const p = Math.max(0, Math.min(u, e.x - THUMB / 2));
          pos.value = p;
          const i = u > 0 ? Math.round((p / u) * last) : 0;
          if (i !== liveIdx.value) {
            liveIdx.value = i;
            runOnJS(commitStable)(i);
          }
        })
        .onUpdate((e) => {
          "worklet";
          const u = usable.value;
          const p = Math.max(0, Math.min(u, e.x - THUMB / 2));
          pos.value = p;
          const i = u > 0 ? Math.round((p / u) * last) : 0;
          if (i !== liveIdx.value) {
            liveIdx.value = i;
            runOnJS(commitStable)(i);
          }
        })
        .onFinalize(() => {
          "worklet";
          dragging.value = false;
          const u = usable.value;
          // Settle exactly onto the chosen stop.
          pos.value = withSpring(last > 0 ? (liveIdx.value / last) * u : 0, SNAP_SPRING);
        }),
    [last], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pos.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: pos.value + THUMB / 2 }));
  const tipStyle = useAnimatedStyle(() => {
    const maxLeft = Math.max(0, trackW.value - TIP_W);
    const left = Math.max(0, Math.min(maxLeft, pos.value + THUMB / 2 - TIP_W / 2));
    return { transform: [{ translateX: left }] };
  });

  const tipText = value >= values[last] ? topStop : format(value);

  return (
    <View>
      <View style={styles.tipRow}>
        {w > 0 ? (
          <Reanimated.View style={[styles.tip, tipStyle]}>
            <Text style={styles.tipText}>{tipText}</Text>
          </Reanimated.View>
        ) : null}
      </View>
      <GestureDetector gesture={pan}>
        <View
          style={styles.track}
          onLayout={(e: LayoutChangeEvent) => {
            const width = e.nativeEvent.layout.width;
            setW(width);
            trackW.value = width;
            const u = Math.max(1, width - THUMB);
            usable.value = u;
            if (!dragging.value) pos.value = posForIdx(liveIdx.value, u);
          }}
        >
          <View style={styles.trackBg} />
          <Reanimated.View style={[styles.trackFill, fillStyle]} />
          <Reanimated.View style={[styles.thumb, thumbStyle]} />
        </View>
      </GestureDetector>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>{format(values[0])}</Text>
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

/**
 * Student-slots picker: two short scroll wheels reading "current / capacity"
 * (e.g. 0/1) with a big slash between them, and a handwritten guide line under
 * each. The left wheel ("currently teaching") can never exceed the right wheel
 * ("capacity") — its value list is rebuilt (and the wheel remounted via `key`)
 * whenever the capacity changes, and it's clamped down if capacity shrinks.
 */
function SlotPicker({ slots, onChange }: { slots: Slots; onChange: (next: Slots) => void }) {
  const capacity = Math.max(1, slots.capacity || 1);
  const current = Math.min(Math.max(0, slots.current || 0), capacity);
  const currentValues = useMemo(
    () => Array.from({ length: capacity + 1 }, (_, i) => String(i)),
    [capacity],
  );
  return (
    <View style={styles.slotCard}>
      <View style={styles.slotRow}>
        <View style={styles.slotCol}>
          <ScrollWheel
            key={`cur-${capacity}`}
            values={currentValues}
            value={String(current)}
            onChange={(v) => onChange({ current: Math.min(Number(v) || 0, capacity), capacity })}
            width={84}
            visible={3}
          />
          <Text style={styles.slotHand}>number of students{"\n"}currently teaching</Text>
        </View>
        <View style={styles.slotSlashBox}>
          <Text style={styles.slotSlash}>/</Text>
        </View>
        <View style={styles.slotCol}>
          <ScrollWheel
            values={SLOT_CAPACITY_VALUES}
            value={String(capacity)}
            onChange={(v) => {
              const cap = Math.max(1, Number(v) || 1);
              onChange({ current: Math.min(current, cap), capacity: cap });
            }}
            width={84}
            visible={3}
          />
          <Text style={styles.slotHand}>number of students{"\n"}you want to teach</Text>
        </View>
      </View>
    </View>
  );
}

// ---- subject card -----------------------------------------------------------

function DetailCard({
  subject,
  detail,
  prevDistricts,
  open,
  onToggle,
  onPatch,
}: {
  subject: Subject;
  detail: Detail;
  /** Districts from the nearest earlier in-person subject, for "Same as previous". */
  prevDistricts: string[] | null;
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
  const levelCount = (detail.levels ?? []).length;
  const summary = [
    levelCount ? `${levelCount} level${levelCount > 1 ? "s" : ""}` : "Choose levels",
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
          {/* Student slots — how many students the tutor takes for THIS subject
              (currently teaching / capacity). Per subject, like everything else
              on this card. */}
          <FieldLabel icon="groups">Student slots</FieldLabel>
          <SlotPicker slots={detail.slots} onChange={(slots) => onPatch({ slots })} />

          {/* Teaching levels are per subject: a tutor might teach primary
              Maths but only senior-secondary Physics. */}
          <FieldLabel icon="school">Teaching levels for this subject</FieldLabel>
          <Text style={styles.levelHelper}>
            Pick every student level you are comfortable teaching for {subject.label}.
          </Text>
          <LevelPicker
            value={detail.levels ?? []}
            onChange={(levels) => onPatch({ levels })}
          />

          {/* Years of teaching experience */}
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
            values={PAY_VALUES}
            value={detail.pay}
            onChange={(v) => onPatch({ pay: v })}
            format={(v) => `$${v}`}
            topStop="$3000+"
          />

          {/* Lesson format (per subject — a tutor may teach some subjects in
              person and others online) */}
          <FieldLabel icon="swap-horiz">{t("sd.field.format")}</FieldLabel>
          <Segmented
            options={[
              { key: "in_person", label: t("format.in_person") },
              { key: "online", label: t("format.online") },
              { key: "both", label: t("format.both") },
            ]}
            value={detail.format}
            onChange={(k) => onPatch({ format: k as FormatId })}
          />

          {/* Location — only when the lesson is (partly) in person. The "Same as
              previous" chip copies the districts from the nearest earlier
              in-person subject, so a tutor working one area doesn't re-pick it. */}
          {needsLocation(detail.format) ? (
            <>
              <View style={styles.locHeaderRow}>
                <View style={styles.fieldLabelInline}>
                  <MaterialIcons name="place" size={17} color="#2D6A4F" />
                  <Text style={styles.fieldLabelText}>{t("sd.field.location")}</Text>
                </View>
                {prevDistricts && prevDistricts.length > 0 ? (
                  <TouchableOpacity
                    style={styles.samePrevBtn}
                    onPress={() => onPatch({ districts: [...prevDistricts] })}
                    accessibilityRole="button"
                    accessibilityLabel={t("sd.location.samePrev")}
                  >
                    <MaterialIcons name="content-copy" size={14} color="#2D6A4F" />
                    <Text style={styles.samePrevText}>{t("sd.location.samePrev")}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <DistrictPicker
                value={detail.districts}
                onChange={(next) => onPatch({ districts: next })}
              />
            </>
          ) : null}

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
  // Subjects come from the shared store (saved by TutorCatSel), not route
  // params — so this screen also renders when
  // it's jumped into directly during a "resume the skipped steps" pass.
  const subjects = useMemo<Subject[]>(() => {
    const arr = getStored<Interest[]>("tutor:interests", []);
    return arr
      .filter((it) => it.catId && it.subId)
      .map((it) => ({
        id: it.subId,
        label: it.label ?? it.subId,
        catId: it.catId,
        color: it.color ?? "#2D6A4F",
      }));
  }, []);

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
  // Labels of subjects with no details at all, when the empty-subject warning is up.
  const [emptyWarn, setEmptyWarn] = useState<string[] | null>(null);
  const [view, setView] = useState<"details" | "review">("details");

  // One-time "Skip this step?" confirmation, shared across all onboarding Skips.
  const { requestSkip, skipModal } = useSkipGuard();
  const t = useT();

  const keyOf = (s: Subject) => `${s.catId}:${s.id}`;
  const getDetail = (key: string) => ({ ...DEFAULT_DETAIL, ...(details[key] ?? {}) });
  const patch = (key: string, partial: Partial<Detail>) =>
    setDetails((prev) => ({
      ...prev,
      [key]: { ...DEFAULT_DETAIL, ...(prev[key] ?? {}), ...partial },
    }));

  const academic = subjects.filter((s) => s.catId === "academics");
  const academicNeedingProof = academic.filter((s) => {
    const levels = getDetail(keyOf(s)).levels ?? [];
    return levels.includes("high") || levels.includes("university");
  });
  const completed = academicNeedingProof.filter((s) =>
    getDetail(keyOf(s)).quals.some((q) => !!q.type),
  ).length;
  const allDone = academicNeedingProof.length > 0 && completed === academicNeedingProof.length;
  const showBanner = academicNeedingProof.length > 0;
  const missing = academicNeedingProof.length > 0 && completed < academicNeedingProof.length;

  const openFirstIncompleteAcademic = () => {
    const target = academicNeedingProof.find(
      (s) => !getDetail(keyOf(s)).quals.some((q) => !!q.type),
    );
    if (target) setOpenKey(keyOf(target));
  };
  // A subject the tutor hasn't touched at all (defaults untouched — pay/format/
  // slots defaults don't count as "filled in").
  const isEmptyDetail = (d: Detail) =>
    (d.levels ?? []).length === 0 &&
    d.years === DEFAULT_DETAIL.years &&
    d.districts.length === 0 &&
    d.experiences.length === 0 &&
    d.achievements.every((a) => !a.trim()) &&
    d.quals.every((q) => !q.type && !q.detail && !q.subject && !q.grade && !q.test);

  const firstTimeNext = () => router.push("/onboarding/TutorPrefs");
  // Confirm on the review = completing this step; Skip advances without it.
  const proceed = () => onStepContinue("sd", firstTimeNext);
  const skipProceed = () => onStepSkip("sd", firstTimeNext);
  const goReview = () => setView("review");
  const editSubject = (key: string) => {
    setOpenKey(key);
    setView("details");
  };
  const onContinue = () => {
    // A subject the tutor has started filling still needs a teaching level
    // (silent block that opens the offending card — unchanged behaviour). Empty
    // subjects are handled by the soft warning below, not blocked here.
    const missingLevels = subjects.find((s) => {
      const d = getDetail(keyOf(s));
      return (d.levels ?? []).length === 0 && !isEmptyDetail(d);
    });
    if (missingLevels) {
      setOpenKey(keyOf(missingLevels));
      return;
    }
    // Completely-empty subject(s) → warn, but allow "Continue anyway".
    const empties = subjects.filter((s) => isEmptyDetail(getDetail(keyOf(s))));
    if (empties.length > 0) {
      setEmptyWarn(empties.map((s) => s.label));
      return;
    }
    if (missing) setModal(true);
    else goReview();
  };

  if (view === "review") {
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

          <View style={styles.cardsWrap}>
            {subjects.map((s) => {
              const key = keyOf(s);
              const d = getDetail(key);
              const achievements = d.achievements.filter((a) => a.trim().length > 0);
              const quals = d.quals.filter((q) => !!q.type);
              const payText = d.pay >= PAY_MAX ? "$3000+" : `$${d.pay}`;
              const levelLines = (d.levels ?? []).map((level) =>
                LEVEL_KEYS[level] ? t(LEVEL_KEYS[level]) : level,
              );
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
                    <RevSection label="Teaching levels" lines={levelLines} />
                    <RevSection
                      label={t("sd.field.years")}
                      lines={[
                        d.years === "1"
                          ? t("sd.years.one", { n: d.years })
                          : t("sd.years.other", { n: d.years }),
                      ]}
                    />
                    <RevSection label={t("sd.field.pay")} lines={[payText]} />
                    <RevSection
                      label="Student slots"
                      lines={[`${d.slots.current}/${d.slots.capacity}`]}
                    />
                    <RevSection label={t("sd.field.format")} lines={[t(FORMAT_KEYS[d.format])]} />
                    {needsLocation(d.format) ? (
                      <RevSection
                        label={t("sd.field.location")}
                        lines={d.districts.map(subName)}
                      />
                    ) : null}
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
      <KeyboardAvoider>
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
          onPress={() => requestSkip(skipProceed)}
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
        <Text style={styles.levelsNotice}>
          Choose teaching levels inside each subject before you review.
        </Text>

        {subjects.length > 1 ? (
          <View style={styles.reminderBanner}>
            <MaterialIcons name="info-outline" size={18} color="#D98E0A" />
            <Text style={styles.reminderText}>
              {t("sd.reminder.multi", { n: subjects.length })}
            </Text>
          </View>
        ) : null}

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
              {t("sd.banner.progress", { completed, total: academicNeedingProof.length })}
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
          {subjects.map((s, i) => {
            const key = keyOf(s);
            // "Same as previous": the districts of the nearest earlier subject
            // that is in person and actually has districts set (skips online /
            // empty ones). null for the first such subject (button hidden).
            let prevDistricts: string[] | null = null;
            for (let j = i - 1; j >= 0; j--) {
              const dj = getDetail(keyOf(subjects[j]));
              if (needsLocation(dj.format) && dj.districts.length > 0) {
                prevDistricts = dj.districts;
                break;
              }
            }
            return (
              <DetailCard
                key={key}
                subject={s}
                detail={getDetail(key)}
                prevDistricts={prevDistricts}
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
      </KeyboardAvoider>

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

      {/* Empty-subject warning — warns which subjects have no details, but lets
          the tutor continue anyway. */}
      <ConfirmModal
        visible={emptyWarn !== null}
        title={t("sd.empty.title")}
        message={t("sd.empty.text", { subjects: (emptyWarn ?? []).join(", ") })}
        confirmLabel={t("sd.modal.continueAnyway")}
        cancelLabel={t("sd.empty.goBack")}
        onConfirm={() => {
          setEmptyWarn(null);
          goReview();
        }}
        onCancel={() => {
          const first = subjects.find((s) => isEmptyDetail(getDetail(keyOf(s))));
          if (first) setOpenKey(keyOf(first));
          setEmptyWarn(null);
        }}
      />

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
  levelsNotice: { marginTop: 10, fontSize: 13.5, fontWeight: "700", color: "#2D6A4F", lineHeight: 19 },
  reminderBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FDF3DD",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reminderText: { flex: 1, fontSize: 13, fontWeight: "600", color: "#8A5A00", lineHeight: 18 },

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
  levelHelper: { marginTop: -2, marginBottom: 12, fontSize: 12.5, lineHeight: 18, color: "#6B7280" },
  levelPickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
    paddingVertical: 2,
  },
  levelPickItem: { width: "31%" },
  levelPickLabel: { marginTop: 7, fontSize: 11.5, lineHeight: 14 },

  // Location header: the field label on the left, "Same as previous" on the right.
  locHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 8,
  },
  fieldLabelInline: { flexDirection: "row", alignItems: "center", gap: 7 },
  samePrevBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#2D6A4F",
    backgroundColor: "#FFFFFF",
  },
  samePrevText: { color: "#2D6A4F", fontSize: 12.5, fontWeight: "700" },

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

  // Student-slots picker (two short wheels with a slash + handwritten guides).
  slotCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  slotRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "center" },
  slotCol: { flex: 1, alignItems: "center" },
  slotSlashBox: { height: ROW_H * 3, justifyContent: "center", paddingHorizontal: 2 },
  slotSlash: { fontSize: 36, fontWeight: "300", color: "#C4C4C4" },
  slotHand: {
    fontFamily: HAND_FONT,
    fontSize: 16,
    lineHeight: 18,
    color: "#2D6A4F",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 2,
  },

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
