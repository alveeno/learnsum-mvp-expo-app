import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRef, useState } from "react";
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

import { Button } from "../ui/Button";
import { SelectableCircle } from "../ui/SelectableCircle";

/**
 * Preferences — the shared onboarding screen used by all three roles.
 *
 * It is fully props-driven and router-free; each role gets a thin route file
 * (StudentPrefs / ParentPrefs / TutorPrefs) that supplies copy, progress and
 * the navigation callbacks. The screen never writes to a backend — it hands its
 * answers back through `onContinue` (see CLAUDE.md data rules).
 *
 * Two language behaviours via `languageMode`:
 *  - "select"      → on/off multi-select (student / parent).
 *  - "proficiency" → tap a language to raise its level (tutor): the circle
 *                    fills bottom-up a quarter at a time and shows a level word
 *                    (Beginner → Intermediate → Advanced → Fluent); a 5th tap
 *                    clears it.
 */

export type FormatId = "in_person" | "online" | "both";
type RegionId = "hk" | "kln" | "nt";
type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type Slot = { start: number; end: number };
type Avail = Record<DayKey, Slot[]>;

/** Everything this screen collects for one person / child. */
export type Prefs = {
  format: FormatId | null;
  region: RegionId | null;
  district: string | null;
  /** "select" mode: chosen main-language ids. */
  langs: string[];
  /** "select" mode: chosen extra-language labels. */
  moreLangs: string[];
  /** "proficiency" mode: language id → level 1..4. */
  langLevels: Record<string, number>;
  avail: Avail;
};

/** Flatten a Prefs into string route params for forwarding. */
export function prefsToParams(d: Prefs) {
  return {
    format: d.format ?? "",
    region: d.region ?? "",
    district: d.district ?? "",
    langs: JSON.stringify(d.langs),
    moreLangs: JSON.stringify(d.moreLangs),
    langLevels: JSON.stringify(d.langLevels),
    avail: JSON.stringify(d.avail),
  };
}

// ---- Section 1: lesson format ------------------------------------------------
const FORMATS: {
  id: FormatId;
  label: string;
  color: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { id: "in_person", label: "In Person", color: "#2D6A4F", icon: "person" },
  { id: "online", label: "Online", color: "#2D6A4F", icon: "videocam" },
  { id: "both", label: "Both", color: "#F4A923", icon: "swap-horiz" },
];

// ---- Section 2: location -----------------------------------------------------
const REGIONS: { id: RegionId; label: string; districts: string[] }[] = [
  {
    id: "hk",
    label: "HK Island",
    districts: ["Central & Western", "Eastern", "Southern", "Wan Chai"],
  },
  {
    id: "kln",
    label: "Kowloon",
    districts: [
      "Yau Tsim Mong",
      "Sham Shui Po",
      "Kowloon City",
      "Wong Tai Sin",
      "Kwun Tong",
    ],
  },
  {
    id: "nt",
    label: "New Terr.",
    districts: [
      "Kwai Tsing",
      "Tsuen Wan",
      "Tuen Mun",
      "Yuen Long",
      "North",
      "Tai Po",
      "Sha Tin",
      "Sai Kung",
      "Islands",
    ],
  },
];
const DISTRICT_ZH: Record<string, string> = {
  "Central & Western": "中",
  Eastern: "東",
  Southern: "南",
  "Wan Chai": "灣",
  "Yau Tsim Mong": "油",
  "Sham Shui Po": "深",
  "Kowloon City": "九",
  "Wong Tai Sin": "黃",
  "Kwun Tong": "觀",
  "Kwai Tsing": "葵",
  "Tsuen Wan": "荃",
  "Tuen Mun": "屯",
  "Yuen Long": "元",
  North: "北",
  "Tai Po": "大",
  "Sha Tin": "沙",
  "Sai Kung": "西",
  Islands: "離",
};

// ---- Section 3: language -----------------------------------------------------
const MAIN_LANGS: {
  id: string;
  label: string;
  color: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  abbr: string;
}[] = [
  { id: "cantonese", label: "Cantonese", color: "#2D6A4F", icon: "graphic-eq", abbr: "CA" },
  { id: "mandarin", label: "Mandarin", color: "#F4A923", icon: "translate", abbr: "MA" },
  { id: "english", label: "English", color: "#2D6A4F", icon: "abc", abbr: "EN" },
];
const MORE_LANGS: { id: string; label: string; abbr: string }[] = [
  { id: "japanese", label: "Japanese", abbr: "JP" },
  { id: "korean", label: "Korean", abbr: "KO" },
  { id: "french", label: "French", abbr: "FR" },
  { id: "spanish", label: "Spanish", abbr: "ES" },
  { id: "german", label: "German", abbr: "DE" },
  { id: "italian", label: "Italian", abbr: "IT" },
  { id: "portuguese", label: "Portuguese", abbr: "PT" },
  { id: "thai", label: "Thai", abbr: "TH" },
  { id: "hindi", label: "Hindi", abbr: "HI" },
  { id: "arabic", label: "Arabic", abbr: "AR" },
];

// Proficiency levels (tutor): index 1..4. Colours follow the design palette.
const LEVELS: { word: string; color: string; frac: number }[] = [
  { word: "", color: "transparent", frac: 0 }, // 0 = unset
  { word: "Beginner", color: "#2D6A4F", frac: 0.25 }, // green
  { word: "Intermediate", color: "#F4A923", frac: 0.5 }, // gold / yellow
  { word: "Advanced", color: "#E63946", frac: 0.75 }, // red
  { word: "Fluent", color: "#9B5DE5", frac: 1 }, // purple
];

// ---- Section 4: availability / timeline -------------------------------------
const DAYS: { key: DayKey; letter: string }[] = [
  { key: "mon", letter: "M" },
  { key: "tue", letter: "T" },
  { key: "wed", letter: "W" },
  { key: "thu", letter: "T" },
  { key: "fri", letter: "F" },
  { key: "sat", letter: "S" },
  { key: "sun", letter: "S" },
];
const EMPTY_AVAIL: Avail = {
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: [],
};

const STEP_MIN = 15;
const STEP_PX = 16;
const PX_PER_MIN = STEP_PX / STEP_MIN;
const DAY_MIN = 24 * 60;
const RULER_WIDTH = DAY_MIN * PX_PER_MIN;
const TIMELINE_H = 92;
const DEFAULT_MIN = 9 * 60;

const clampMin = (m: number) => Math.max(0, Math.min(DAY_MIN, m));
const snap = (m: number) => Math.round(m / STEP_MIN) * STEP_MIN;

function fmt(min: number): string {
  const total = clampMin(min);
  const h = Math.floor(total / 60);
  const m = total % 60;
  let hr12 = h % 12;
  if (hr12 === 0) hr12 = 12;
  const ampm = total >= 720 && total < 1440 ? "PM" : "AM";
  return `${hr12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
function shortHour(h: number): string {
  if (h === 0 || h === 24) return "12a";
  if (h === 12) return "12p";
  const ap = h < 12 ? "a" : "p";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${ap}`;
}
type Tick = { min: number; h: number; label: string | null };
const TICKS: Tick[] = [];
for (let m = 0; m <= DAY_MIN; m += STEP_MIN) {
  const isHour = m % 60 === 0;
  const is3h = m % 180 === 0;
  TICKS.push({ min: m, h: is3h ? 18 : isHour ? 12 : 7, label: is3h ? shortHour(m / 60) : null });
}
function mergeSlots(slots: Slot[]): Slot[] {
  const sorted = [...slots].sort((a, b) => a.start - b.start);
  const out: Slot[] = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last && s.start <= last.end) last.end = Math.max(last.end, s.end);
    else out.push({ ...s });
  }
  return out;
}

type SlotMode = "idle" | "start" | "end" | "review";

/** A tutor language: circle fills bottom-up by level, letters inside, word below. */
function LangFillCircle({
  abbr,
  label,
  level,
  onPress,
  size = 64,
  style,
}: {
  abbr: string;
  label: string;
  level: number;
  onPress: () => void;
  size?: number;
  style?: object;
}) {
  const lv = LEVELS[level] ?? LEVELS[0];
  const letterColor =
    level === 0 ? "#9CA3AF" : level >= 3 ? "#FFFFFF" : "#1A1A1A";
  return (
    <Pressable
      style={[styles.langItem, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}${level > 0 ? `, ${lv.word}` : ""}`}
    >
      <View
        style={[styles.fillCircle, { width: size, height: size, borderRadius: size / 2 }]}
      >
        {level > 0 ? (
          <View
            style={[
              styles.fillLayer,
              { height: lv.frac * size, backgroundColor: lv.color },
            ]}
          />
        ) : null}
        <Text style={[styles.fillLetters, { color: letterColor }]}>{abbr}</Text>
      </View>
      <Text style={styles.circleLabel}>{label}</Text>
      {/* Always rendered (transparent when unset) so rows don't jump. */}
      <Text style={[styles.levelWord, { color: level > 0 ? lv.color : "transparent" }]}>
        {level > 0 ? lv.word : "•"}
      </Text>
    </Pressable>
  );
}

/** The "Others" opener circle (magnifier + gold +N badge). */
function OthersOpener({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable
      style={styles.langItem}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add other languages"
    >
      <View style={styles.smallCircleBox}>
        <View
          style={[
            styles.smallCircle,
            count > 0 ? styles.smallCircleSelected : styles.smallCircleResting,
          ]}
        >
          <MaterialIcons
            name="search"
            size={24}
            color={count > 0 ? "#FFFFFF" : "#9CA3AF"}
          />
        </View>
        {count > 0 ? (
          <View style={styles.plusBadge}>
            <Text style={styles.plusBadgeText}>+{count}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.circleLabel}>Others</Text>
    </Pressable>
  );
}

export type PreferencesScreenProps = {
  heading?: string;
  subtitle?: string;
  /** Optional gold banner above the heading, e.g. "Child 2 of 3". */
  banner?: string;
  progress?: number;
  languageMode?: "select" | "proficiency";
  languageSectionLabel?: string;
  /** Seed the form (used to restore a parent's previously-entered child). */
  initialValue?: Prefs | null;
  continueLabel?: string;
  onContinue: (data: Prefs) => void;
  onSkip: () => void;
  /** Back chevron handler (defaults to nothing — supply per role). */
  onBack?: () => void;
};

export function PreferencesScreen({
  heading = "Your preferences",
  subtitle = "Help us find you the best matches.",
  banner,
  progress = 1,
  languageMode = "select",
  languageSectionLabel = "PREFERRED LANGUAGE",
  initialValue = null,
  continueLabel = "Continue",
  onContinue,
  onSkip,
  onBack,
}: PreferencesScreenProps) {
  const proficiency = languageMode === "proficiency";

  // Section 1
  const [format, setFormat] = useState<FormatId | null>(initialValue?.format ?? null);
  // Section 2
  const [region, setRegion] = useState<RegionId | null>(initialValue?.region ?? null);
  const [district, setDistrict] = useState<string | null>(initialValue?.district ?? null);
  // Section 3
  const [langs, setLangs] = useState<string[]>(initialValue?.langs ?? []);
  const [moreLangs, setMoreLangs] = useState<string[]>(initialValue?.moreLangs ?? []);
  const [langLevels, setLangLevels] = useState<Record<string, number>>(
    initialValue?.langLevels ?? {},
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lq, setLq] = useState("");
  // Section 4
  const [avail, setAvail] = useState<Avail>(initialValue?.avail ?? EMPTY_AVAIL);
  const [activeDay, setActiveDay] = useState<DayKey | null>(null);
  const [slotMode, setSlotMode] = useState<SlotMode>("idle");
  const [pendingStart, setPendingStart] = useState<number | null>(null);
  const [pendingEnd, setPendingEnd] = useState<number | null>(null);
  const [selectedChip, setSelectedChip] = useState<number | null>(null);
  const [scrollMin, setScrollMin] = useState(0);
  const [viewportW, setViewportW] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const needLoc = format === "in_person" || format === "both";
  const ready = !!format && (!needLoc || !!district);
  const regionObj = REGIONS.find((r) => r.id === region) ?? null;

  const locAnim = useRef(new Animated.Value(needLoc ? 1 : 0)).current;
  const animateLoc = () => {
    locAnim.setValue(0);
    Animated.timing(locAnim, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
  };
  const chooseFormat = (id: FormatId) => {
    const wasLoc = needLoc;
    setFormat(id);
    if ((id === "in_person" || id === "both") && !wasLoc) animateLoc();
  };

  // ---- language handlers ----
  const toggleLang = (id: string) =>
    setLangs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleMoreLang = (label: string) =>
    setMoreLangs((p) =>
      p.includes(label) ? p.filter((x) => x !== label) : [...p, label],
    );
  const cycleLevel = (id: string) =>
    setLangLevels((prev) => {
      const next = ((prev[id] ?? 0) + 1) % 5;
      const copy = { ...prev };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  const moreResults =
    lq.trim().length > 0
      ? MORE_LANGS.filter((l) =>
          l.label.toLowerCase().includes(lq.trim().toLowerCase()),
        )
      : MORE_LANGS;
  const othersCount = proficiency
    ? MORE_LANGS.filter((l) => (langLevels[l.id] ?? 0) > 0).length
    : moreLangs.length;

  // ---- availability handlers ----
  const onTimelineLayout = (e: LayoutChangeEvent) =>
    setViewportW(e.nativeEvent.layout.width);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setScrollMin(clampMin(snap(e.nativeEvent.contentOffset.x / PX_PER_MIN)));
  const scrollToMin = (min: number) => {
    const x = clampMin(min) * PX_PER_MIN;
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ x, animated: false }));
  };
  const selectDay = (day: DayKey) => {
    setActiveDay(day);
    setSlotMode("idle");
    setPendingStart(null);
    setPendingEnd(null);
    setSelectedChip(null);
  };
  const beginAddSlot = () => {
    setSelectedChip(null);
    setPendingStart(null);
    setPendingEnd(null);
    setSlotMode("start");
    setScrollMin(DEFAULT_MIN);
    scrollToMin(DEFAULT_MIN);
  };
  const setStart = () => {
    if (pendingEnd != null) {
      const a = Math.min(scrollMin, pendingEnd);
      let b = Math.max(scrollMin, pendingEnd);
      if (b <= a) b = clampMin(a + STEP_MIN);
      setPendingStart(a);
      setPendingEnd(b);
      setSlotMode("review");
      return;
    }
    setPendingStart(scrollMin);
    setSlotMode("end");
  };
  const setEnd = () => {
    const s = pendingStart ?? 0;
    const a = Math.min(s, scrollMin);
    let b = Math.max(s, scrollMin);
    if (b <= a) b = clampMin(a + STEP_MIN);
    setPendingStart(a);
    setPendingEnd(b);
    setSlotMode("review");
  };
  const cancelSlot = () => {
    setSlotMode("idle");
    setPendingStart(null);
    setPendingEnd(null);
  };
  const editStart = () => {
    const m = pendingStart ?? DEFAULT_MIN;
    setSlotMode("start");
    setScrollMin(m);
    scrollToMin(m);
  };
  const editEnd = () => {
    const m = pendingEnd ?? DEFAULT_MIN;
    setSlotMode("end");
    setScrollMin(m);
    scrollToMin(m);
  };
  const commitSlot = () => {
    if (!activeDay || pendingStart == null || pendingEnd == null) return;
    const merged = mergeSlots([
      ...avail[activeDay],
      { start: pendingStart, end: pendingEnd },
    ]);
    setAvail((prev) => ({ ...prev, [activeDay]: merged }));
    setSlotMode("idle");
    setPendingStart(null);
    setPendingEnd(null);
  };
  const deleteSlot = (i: number) => {
    if (!activeDay) return;
    setAvail((prev) => ({
      ...prev,
      [activeDay]: prev[activeDay].filter((_, idx) => idx !== i),
    }));
    setSelectedChip(null);
  };
  const applyToAll = () => {
    if (!activeDay) return;
    const slots = avail[activeDay];
    setAvail((prev) => {
      const next = { ...prev };
      DAYS.forEach((d) => {
        next[d.key] = slots.map((s) => ({ ...s }));
      });
      return next;
    });
  };
  const clearAll = () => {
    setAvail(EMPTY_AVAIL);
    setSlotMode("idle");
    setPendingStart(null);
    setPendingEnd(null);
    setSelectedChip(null);
  };

  const highlights: { start: number; end: number; dashed: boolean }[] = (() => {
    if (!activeDay) return [];
    const saved = avail[activeDay].map((s) => ({
      start: s.start,
      end: s.end,
      dashed: false,
    }));
    if (slotMode === "idle") return saved;
    let pending: { start: number; end: number; dashed: boolean } | null = null;
    if (slotMode === "start" && pendingEnd != null) {
      const a = Math.min(scrollMin, pendingEnd);
      const b = Math.max(scrollMin, pendingEnd);
      pending = { start: a, end: b, dashed: true };
    } else if (slotMode === "end" && pendingStart != null) {
      const a = Math.min(pendingStart, scrollMin);
      const b = Math.max(pendingStart, scrollMin);
      pending = { start: a, end: b, dashed: true };
    } else if (
      slotMode === "review" &&
      pendingStart != null &&
      pendingEnd != null
    ) {
      pending = { start: pendingStart, end: pendingEnd, dashed: true };
    }
    return pending ? [...saved, pending] : saved;
  })();

  const submit = () =>
    onContinue({ format, region, district, langs, moreLangs, langLevels, avail });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      <View style={styles.headerRow}>
        <Pressable
          hitSlop={8}
          onPress={onBack}
          disabled={!onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </Pressable>
        <Pressable
          hitSlop={8}
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {banner ? (
          <View style={styles.banner}>
            <MaterialCommunityIcons name="account-child" size={18} color="#8A6D1A" />
            <Text style={styles.bannerText}>{banner}</Text>
          </View>
        ) : null}

        <Text style={styles.title}>{heading}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* ---- Section 1: lesson format ---- */}
        <Text style={styles.sectionLabel}>LESSON FORMAT</Text>
        <View style={styles.formatRow}>
          {FORMATS.map((f) => (
            <SelectableCircle
              key={f.id}
              style={styles.formatItem}
              size={64}
              label={f.label}
              selected={format === f.id}
              color={f.color}
              onPress={() => chooseFormat(f.id)}
              renderIcon={({ size, color }) => (
                <MaterialIcons name={f.icon} size={size} color={color} />
              )}
            />
          ))}
        </View>

        {/* ---- Section 2: location (in-person / both) ---- */}
        {needLoc ? (
          <Animated.View
            style={{
              opacity: locAnim,
              transform: [
                {
                  translateY: locAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            }}
          >
            <Text style={styles.sectionLabel}>LOCATION</Text>
            <View style={styles.segment}>
              {REGIONS.map((r) => {
                const on = region === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.segmentTab, on && styles.segmentTabOn]}
                    onPress={() => {
                      setRegion(r.id);
                      setDistrict(null);
                    }}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {regionObj ? (
              <View style={styles.districtGrid}>
                {regionObj.districts.map((d) => {
                  const on = district === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={styles.districtItem}
                      onPress={() => setDistrict(d)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={d}
                      accessibilityState={{ selected: on }}
                    >
                      <View
                        style={[
                          styles.districtCircle,
                          on ? styles.districtCircleOn : styles.districtCircleOff,
                        ]}
                      >
                        <Text
                          style={[
                            styles.districtChar,
                            { color: on ? "#FFFFFF" : "#111827" },
                          ]}
                        >
                          {DISTRICT_ZH[d] ?? d[0]}
                        </Text>
                      </View>
                      <Text
                        style={[styles.districtLabel, on && styles.districtLabelOn]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </Animated.View>
        ) : null}

        {/* ---- Section 3: language ---- */}
        <Text style={styles.sectionLabel}>{languageSectionLabel}</Text>
        <View style={styles.langRowWrap}>
          {proficiency
            ? MAIN_LANGS.map((l) => (
                <LangFillCircle
                  key={l.id}
                  abbr={l.abbr}
                  label={l.label}
                  level={langLevels[l.id] ?? 0}
                  onPress={() => cycleLevel(l.id)}
                  size={56}
                />
              ))
            : MAIN_LANGS.map((l) => (
                <SelectableCircle
                  key={l.id}
                  style={styles.langItem}
                  size={56}
                  label={l.label}
                  selected={langs.includes(l.id)}
                  color={l.color}
                  onPress={() => toggleLang(l.id)}
                  renderIcon={({ size, color }) => (
                    <MaterialIcons name={l.icon} size={size} color={color} />
                  )}
                />
              ))}
          <OthersOpener count={othersCount} onPress={() => setSheetOpen(true)} />
        </View>

        {/* ---- Section 4: availability ---- */}
        <Text style={styles.sectionLabel}>WHEN ARE YOU AVAILABLE?</Text>
        <View style={styles.dayRow}>
          {DAYS.map((d) => {
            const on = activeDay === d.key;
            const hasSlots = avail[d.key].length > 0;
            return (
              <TouchableOpacity
                key={d.key}
                style={styles.dayItem}
                onPress={() => selectDay(d.key)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <View
                  style={[styles.dayCircle, on ? styles.dayCircleOn : styles.dayCircleOff]}
                >
                  <Text
                    style={[styles.dayLetter, { color: on ? "#FFFFFF" : "#111827" }]}
                  >
                    {d.letter}
                  </Text>
                </View>
                <View style={styles.dayDotSlot}>
                  {hasSlots ? <View style={styles.dayDot} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeDay ? (
          <View style={styles.timelineWrap}>
            {slotMode !== "idle" ? (
              <Text style={styles.timelinePrompt}>
                {slotMode === "start"
                  ? "Scroll to your start time"
                  : slotMode === "end"
                    ? "Scroll to your end time"
                    : "Review your time slot"}
              </Text>
            ) : null}

            <View style={styles.timelineBox} onLayout={onTimelineLayout}>
              <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={onScroll}
                snapToInterval={STEP_PX}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: viewportW / 2 }}
              >
                <View style={{ width: RULER_WIDTH, height: TIMELINE_H }}>
                  {highlights.map((h, i) => (
                    <View
                      key={i}
                      style={[
                        styles.highlight,
                        h.dashed ? styles.highlightDashed : styles.highlightSolid,
                        {
                          left: h.start * PX_PER_MIN,
                          width: Math.max(2, (h.end - h.start) * PX_PER_MIN),
                        },
                      ]}
                    />
                  ))}
                  {TICKS.map((t) => (
                    <View
                      key={t.min}
                      style={[styles.tick, { left: t.min * PX_PER_MIN, height: t.h }]}
                    />
                  ))}
                  {TICKS.filter((t) => t.label).map((t) => (
                    <Text
                      key={`l${t.min}`}
                      style={[styles.tickLabel, { left: t.min * PX_PER_MIN - 14 }]}
                    >
                      {t.label}
                    </Text>
                  ))}
                </View>
              </ScrollView>

              {slotMode !== "idle" && viewportW > 0 ? (
                <>
                  <View
                    pointerEvents="none"
                    style={[styles.redLine, { left: viewportW / 2 - 1 }]}
                  />
                  <View pointerEvents="none" style={styles.redPillRow}>
                    <View style={styles.redPill}>
                      <Text style={styles.redPillText}>{fmt(scrollMin)}</Text>
                    </View>
                  </View>
                </>
              ) : null}
            </View>

            {slotMode === "idle" ? (
              <>
                <Button
                  label="Add time slot"
                  variant="primary"
                  onPress={beginAddSlot}
                  style={styles.addSlotBtn}
                  icon={<MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />}
                />
                {avail[activeDay].map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.chip, selectedChip === i && styles.chipOn]}
                    onPress={() => setSelectedChip(selectedChip === i ? null : i)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="clock-outline" size={18} color="#2D6A4F" />
                    <Text style={styles.chipText}>
                      {fmt(s.start)} – {fmt(s.end)}
                    </Text>
                    {selectedChip === i ? (
                      <TouchableOpacity
                        onPress={() => deleteSlot(i)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Delete time slot"
                      >
                        <Text style={styles.chipDeleteText}>Delete</Text>
                      </TouchableOpacity>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </>
            ) : slotMode === "start" ? (
              <View style={styles.btnPair}>
                <Button label="Set Start" variant="primary" onPress={setStart} style={styles.pairBtn} />
                <Button
                  label="Cancel"
                  variant="ghost"
                  onPress={cancelSlot}
                  style={[styles.pairBtn, styles.outlineBtn]}
                />
              </View>
            ) : slotMode === "end" ? (
              <>
                <View style={styles.btnPair}>
                  <Button label="Set End" variant="primary" onPress={setEnd} style={styles.pairBtn} />
                  <Button
                    label="Edit Start"
                    variant="ghost"
                    onPress={editStart}
                    style={[styles.pairBtn, styles.outlineBtn]}
                  />
                </View>
                <Text style={styles.pendingText}>Start: {fmt(pendingStart ?? 0)}</Text>
              </>
            ) : (
              <>
                <View style={styles.reviewRow}>
                  <Button
                    label="Done"
                    variant="primary"
                    onPress={commitSlot}
                    style={styles.reviewBtn}
                    icon={<MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />}
                  />
                  <Button
                    label="Edit Start"
                    variant="ghost"
                    onPress={editStart}
                    style={[styles.reviewBtn, styles.outlineBtn]}
                  />
                  <Button
                    label="Edit End"
                    variant="ghost"
                    onPress={editEnd}
                    style={[styles.reviewBtn, styles.outlineBtn]}
                  />
                </View>
                <Text style={styles.rangeText}>
                  {fmt(pendingStart ?? 0)} – {fmt(pendingEnd ?? 0)}
                </Text>
              </>
            )}

            <View style={styles.applyRow}>
              <TouchableOpacity onPress={applyToAll} accessibilityRole="button">
                <Text style={styles.applyLink}>Apply to all days</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearAll} accessibilityRole="button">
                <Text style={styles.clearLink}>Clear all days</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={continueLabel}
          variant="primary"
          disabled={!ready}
          onPress={submit}
        />
      </View>

      {/* Language pop-up */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSheetOpen(false)}
            accessibilityLabel="Close"
          />
          <View style={styles.sheet}>
            <View style={styles.sheetGrabber} />
            <Text style={styles.sheetTitle}>
              {proficiency ? "Languages you teach" : "Add languages"}
            </Text>

            {proficiency ? (
              <ScrollView
                style={styles.sheetList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.sheetGrid}>
                  {MORE_LANGS.map((l) => (
                    <LangFillCircle
                      key={l.id}
                      style={styles.sheetGridItem}
                      abbr={l.abbr}
                      label={l.label}
                      level={langLevels[l.id] ?? 0}
                      onPress={() => cycleLevel(l.id)}
                    />
                  ))}
                </View>
              </ScrollView>
            ) : (
              <>
                <View style={styles.sheetSearch}>
                  <MaterialIcons name="search" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.sheetInput}
                    value={lq}
                    onChangeText={setLq}
                    placeholder="Search languages…"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                </View>
                <ScrollView
                  style={styles.sheetList}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {moreResults.map((l) => {
                    const on = moreLangs.includes(l.label);
                    return (
                      <TouchableOpacity
                        key={l.id}
                        style={[styles.langRow, on && styles.langRowOn]}
                        onPress={() => toggleMoreLang(l.label)}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                      >
                        <Text style={styles.langRowText}>{l.label}</Text>
                        {on ? (
                          <Ionicons name="checkmark-circle" size={22} color="#2D6A4F" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <Button
              label="Done"
              variant="primary"
              onPress={() => setSheetOpen(false)}
              style={styles.sheetDone}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  progressTrack: { height: 4, backgroundColor: "#E5E7EB", width: "100%" },
  progressFill: { height: 4, backgroundColor: "#2D6A4F" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    paddingHorizontal: 24,
  },
  skip: { fontSize: 17, fontWeight: "600", color: "#6B7280" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 28 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FDF3DC",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  bannerText: { color: "#8A6D1A", fontSize: 13.5, fontWeight: "700" },
  title: { marginTop: 6, fontSize: 30, fontWeight: "800", color: "#111827" },
  subtitle: { marginTop: 8, fontSize: 16, color: "#6B7280" },
  sectionLabel: {
    marginTop: 28,
    marginBottom: 14,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#6B7280",
  },

  formatRow: { flexDirection: "row" },
  formatItem: { width: "33.333%" },

  segment: {
    flexDirection: "row",
    backgroundColor: "#EFEFEF",
    borderRadius: 12,
    padding: 4,
  },
  segmentTab: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  segmentTabOn: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  segmentTextOn: { color: "#111827", fontWeight: "700" },
  districtGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 18,
    marginTop: 18,
  },
  districtItem: { width: "25%", alignItems: "center" },
  districtCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  districtCircleOff: { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" },
  districtCircleOn: {
    backgroundColor: "#2D6A4F",
    borderColor: "#2D6A4F",
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  districtChar: { fontSize: 21, fontWeight: "700", lineHeight: 24 },
  districtLabel: {
    marginTop: 7,
    fontSize: 10,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },
  districtLabelOn: { color: "#2D6A4F", fontWeight: "700" },

  langRowWrap: { flexDirection: "row" },
  langItem: { width: "25%", alignItems: "center" },
  smallCircleBox: { width: 56, height: 56 },
  smallCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  smallCircleResting: { backgroundColor: "#F0F1F3" },
  smallCircleSelected: {
    backgroundColor: "#2D6A4F",
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  circleLabel: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  plusBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: "#F4A923",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  plusBadgeText: { color: "#3A2C06", fontSize: 11, fontWeight: "700" },

  // Tutor fill-circle
  fillCircle: {
    backgroundColor: "#F0F1F3",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fillLayer: { position: "absolute", left: 0, right: 0, bottom: 0 },
  fillLetters: { fontSize: 20, fontWeight: "800" },
  levelWord: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  dayRow: { flexDirection: "row", justifyContent: "space-between" },
  dayItem: { alignItems: "center" },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleOff: { backgroundColor: "#F0F1F3" },
  dayCircleOn: { backgroundColor: "#2D6A4F" },
  dayLetter: { fontSize: 15, fontWeight: "700" },
  dayDotSlot: { height: 12, marginTop: 4, justifyContent: "center" },
  dayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2D6A4F" },

  timelineWrap: { marginTop: 8 },
  timelinePrompt: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  timelineBox: {
    height: TIMELINE_H,
    borderRadius: 16,
    backgroundColor: "#F7F7F5",
    overflow: "hidden",
    justifyContent: "center",
  },
  tick: { position: "absolute", top: 26, width: 1.5, backgroundColor: "#C9CDD3" },
  tickLabel: {
    position: "absolute",
    top: 52,
    width: 28,
    textAlign: "center",
    fontSize: 10,
    color: "#9CA3AF",
  },
  highlight: { position: "absolute", top: 20, height: 44, borderRadius: 8 },
  highlightSolid: {
    backgroundColor: "rgba(45,106,79,0.18)",
    borderWidth: 1.5,
    borderColor: "#2D6A4F",
  },
  highlightDashed: {
    backgroundColor: "rgba(45,106,79,0.12)",
    borderWidth: 2,
    borderColor: "#2D6A4F",
    borderStyle: "dashed",
  },
  redLine: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: "#E63946" },
  redPillRow: { position: "absolute", top: 4, left: 0, right: 0, alignItems: "center" },
  redPill: {
    backgroundColor: "#E63946",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  redPillText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },

  addSlotBtn: { alignSelf: "center", paddingHorizontal: 26, marginTop: 16 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F7F7F5",
    paddingHorizontal: 16,
    marginTop: 12,
  },
  chipOn: { borderWidth: 1.5, borderColor: "#2D6A4F" },
  chipText: { flex: 1, fontSize: 16, fontWeight: "700", color: "#111827" },
  chipDeleteText: { color: "#E63946", fontSize: 14, fontWeight: "700" },
  btnPair: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 16 },
  pairBtn: { minWidth: 124 },
  reviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
  },
  reviewBtn: { paddingHorizontal: 16, minWidth: 96 },
  outlineBtn: { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#D1D5DB" },
  pendingText: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  rangeText: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#2D6A4F",
  },
  applyRow: { flexDirection: "row", justifyContent: "center", gap: 28, marginTop: 18 },
  applyLink: { color: "#2D6A4F", fontSize: 15, fontWeight: "700" },
  clearLink: { color: "#E63946", fontSize: 15, fontWeight: "700" },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECECEC",
  },

  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: "80%",
  },
  sheetGrabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 14,
  },
  sheetSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F4F4F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  sheetInput: { flex: 1, fontSize: 16, color: "#111827", paddingVertical: 0 },
  sheetList: { maxHeight: 360 },
  sheetGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 18 },
  sheetGridItem: { width: "33.333%" },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: "#F9F9F7",
    marginBottom: 6,
  },
  langRowOn: { backgroundColor: "#E8F1EC" },
  langRowText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  sheetDone: { marginTop: 12 },
});
