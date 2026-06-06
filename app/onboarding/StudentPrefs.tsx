import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

import { Button } from "../../components/ui/Button";
import { SelectableCircle } from "../../components/ui/SelectableCircle";

/**
 * Preferences — the final screen of the student onboarding path (comes after
 * interest/category selection).
 *
 * Four sections: lesson format, location (conditional), preferred language and
 * availability. Everything is local component state and is handed FORWARD to the
 * next screen as route params when Continue is tapped — no backend write (see
 * CLAUDE.md data rules).
 *
 * Reuses the shared `Button` and `SelectableCircle`; the segmented control,
 * district / day circles, the scroll-under-a-fixed-redline timeline and the
 * language bottom sheet are built here because their shapes are one-off.
 */

type FormatId = "in_person" | "online" | "both";
type RegionId = "hk" | "kln" | "nt";
type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
/** Minutes-from-midnight range, 15-min granularity (0..1440). */
type Slot = { start: number; end: number };
type Avail = Record<DayKey, Slot[]>;

// ---- Section 1: lesson format ------------------------------------------------
// In Person / Online fill Forest Green; Both fills Gold (design tokens).
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

// First Traditional-Chinese character shown inside each district circle.
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

// ---- Section 3: preferred language ------------------------------------------
// Cantonese / English fill Forest Green; Mandarin fills Gold.
const LANGS: {
  id: string;
  label: string;
  color: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { id: "cantonese", label: "Cantonese", color: "#2D6A4F", icon: "graphic-eq" },
  { id: "mandarin", label: "Mandarin", color: "#F4A923", icon: "translate" },
  { id: "english", label: "English", color: "#2D6A4F", icon: "abc" },
];
const MORE_LANGS = [
  "Japanese",
  "Korean",
  "French",
  "Spanish",
  "German",
  "Italian",
  "Portuguese",
  "Thai",
  "Hindi",
  "Arabic",
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

const STEP_MIN = 15; // 15-minute granularity
const STEP_PX = 16; // pixels per 15-min step
const PX_PER_MIN = STEP_PX / STEP_MIN; // ~1.067 px per minute
const DAY_MIN = 24 * 60; // 1440
const RULER_WIDTH = DAY_MIN * PX_PER_MIN; // full 24h ruler width
const TIMELINE_H = 92;
const DEFAULT_MIN = 9 * 60; // timeline opens centred on 9:00 AM

const clampMin = (m: number) => Math.max(0, Math.min(DAY_MIN, m));
const snap = (m: number) => Math.round(m / STEP_MIN) * STEP_MIN;

/** 12-hour clock label, e.g. 945 -> "3:45 PM", 0 / 1440 -> "12:00 AM". */
function fmt(min: number): string {
  const total = clampMin(min);
  const h = Math.floor(total / 60);
  const m = total % 60;
  let hr12 = h % 12;
  if (hr12 === 0) hr12 = 12;
  const ampm = total >= 720 && total < 1440 ? "PM" : "AM";
  return `${hr12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Compact hour label under the ruler, e.g. 6 -> "6a", 15 -> "3p". */
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

/** Merge overlapping or touching slots into a clean, sorted list. */
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

export default function StudentPrefs() {
  // Section 1
  const [format, setFormat] = useState<FormatId | null>(null);
  // Section 2
  const [region, setRegion] = useState<RegionId | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  // Section 3
  const [langs, setLangs] = useState<string[]>([]);
  const [moreLangs, setMoreLangs] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lq, setLq] = useState("");
  // Section 4
  const [avail, setAvail] = useState<Avail>(EMPTY_AVAIL);
  const [activeDay, setActiveDay] = useState<DayKey | null>(null);
  const [slotMode, setSlotMode] = useState<SlotMode>("idle");
  const [pendingStart, setPendingStart] = useState<number | null>(null);
  const [pendingEnd, setPendingEnd] = useState<number | null>(null);
  const [selectedChip, setSelectedChip] = useState<number | null>(null);
  const [scrollMin, setScrollMin] = useState(0); // time under the red line
  const [viewportW, setViewportW] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const needLoc = format === "in_person" || format === "both";
  // Format is required; a district is required only when a format needs location.
  // Language and availability are optional.
  const ready = !!format && (!needLoc || !!district);
  const regionObj = REGIONS.find((r) => r.id === region) ?? null;

  // Location fades / slides in whenever it becomes visible.
  const locAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (needLoc) {
      locAnim.setValue(0);
      Animated.timing(locAnim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }).start();
    }
  }, [needLoc, locAnim]);

  const toggleLang = (id: string) =>
    setLangs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleMoreLang = (l: string) =>
    setMoreLangs((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]));
  const moreResults =
    lq.trim().length > 0
      ? MORE_LANGS.filter((l) => l.toLowerCase().includes(lq.trim().toLowerCase()))
      : MORE_LANGS;

  // ---- availability handlers ----
  const onTimelineLayout = (e: LayoutChangeEvent) =>
    setViewportW(e.nativeEvent.layout.width);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setScrollMin(clampMin(snap(e.nativeEvent.contentOffset.x / PX_PER_MIN)));

  // Centre the red line on a given minute (content offset == minute * px/min).
  const scrollToMin = (min: number) => {
    const x = clampMin(min) * PX_PER_MIN;
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ x, animated: false }),
    );
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
    setPendingStart(scrollMin);
    setSlotMode("end");
  };
  const setEnd = () => {
    const s = pendingStart ?? 0;
    const a = Math.min(s, scrollMin);
    let b = Math.max(s, scrollMin);
    if (b <= a) b = clampMin(a + STEP_MIN); // guarantee a positive duration
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

  // Highlight bars drawn on the ruler (move with it as the user scrolls).
  const highlights: { start: number; end: number; dashed: boolean }[] = (() => {
    if (!activeDay) return [];
    if (slotMode === "idle")
      return avail[activeDay].map((s) => ({ ...s, dashed: false }));
    if (slotMode === "end" && pendingStart != null) {
      const a = Math.min(pendingStart, scrollMin);
      const b = Math.max(pendingStart, scrollMin);
      return [{ start: a, end: b, dashed: true }];
    }
    if (slotMode === "review" && pendingStart != null && pendingEnd != null)
      return [{ start: pendingStart, end: pendingEnd, dashed: true }];
    return [];
  })();

  // ---- navigation ----
  // Both Continue and Skip land on /feed (not built yet — Expo Router will show
  // its not-found screen until /feed exists). Skip forwards nothing.
  const goFeed = (withData: boolean) => {
    if (!withData) {
      router.push("/feed");
      return;
    }
    router.push({
      pathname: "/feed",
      params: {
        format: format ?? "",
        region: region ?? "",
        district: district ?? "",
        langs: JSON.stringify(langs),
        moreLangs: JSON.stringify(moreLangs),
        avail: JSON.stringify(avail),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Progress bar — final onboarding step, so it reads full. */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: "100%" }]} />
      </View>

      {/* Top bar */}
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
          onPress={() => goFeed(false)}
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
        <Text style={styles.title}>Your preferences</Text>
        <Text style={styles.subtitle}>Help us find you the best matches.</Text>

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
              onPress={() => setFormat(f.id)}
              renderIcon={({ size, color }) => (
                <MaterialIcons name={f.icon} size={size} color={color} />
              )}
            />
          ))}
        </View>

        {/* ---- Section 2: location (only for in-person / both) ---- */}
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

            {/* Region segmented control */}
            <View style={styles.segment}>
              {REGIONS.map((r) => {
                const on = region === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.segmentTab, on && styles.segmentTabOn]}
                    onPress={() => {
                      setRegion(r.id);
                      setDistrict(null); // changing region clears the district
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

            {/* District circles for the chosen region */}
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

        {/* ---- Section 3: preferred language ---- */}
        <Text style={styles.sectionLabel}>PREFERRED LANGUAGE</Text>
        <View style={styles.langRowWrap}>
          {LANGS.map((l) => (
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

          {/* "Others" opens the bottom sheet; shows a gold +N badge. */}
          <Pressable
            style={styles.langItem}
            onPress={() => setSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Add other languages"
          >
            <View style={styles.smallCircleBox}>
              <View
                style={[
                  styles.smallCircle,
                  moreLangs.length > 0
                    ? styles.smallCircleSelected
                    : styles.smallCircleResting,
                ]}
              >
                <MaterialIcons
                  name="search"
                  size={24}
                  color={moreLangs.length > 0 ? "#FFFFFF" : "#9CA3AF"}
                />
              </View>
              {moreLangs.length > 0 ? (
                <View style={styles.plusBadge}>
                  <Text style={styles.plusBadgeText}>+{moreLangs.length}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.circleLabel}>Others</Text>
          </Pressable>
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
                  style={[
                    styles.dayCircle,
                    on ? styles.dayCircleOn : styles.dayCircleOff,
                  ]}
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

            {/* Ruler: a wide horizontal strip scrolled under a fixed red line. */}
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

              {/* Fixed red line + floating time pill (only while editing). */}
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

            {/* Controls swap with the editing stage. */}
            {slotMode === "idle" ? (
              <>
                <Button
                  label="Add time slot"
                  variant="primary"
                  onPress={beginAddSlot}
                  style={styles.addSlotBtn}
                  icon={
                    <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                  }
                />
                {avail[activeDay].map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.chip, selectedChip === i && styles.chipOn]}
                    onPress={() => setSelectedChip(selectedChip === i ? null : i)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={18}
                      color="#2D6A4F"
                    />
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
                <Button
                  label="Set Start"
                  variant="primary"
                  onPress={setStart}
                  style={styles.pairBtn}
                />
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
                  <Button
                    label="Set End"
                    variant="primary"
                    onPress={setEnd}
                    style={styles.pairBtn}
                  />
                  <Button
                    label="Edit Start"
                    variant="ghost"
                    onPress={editStart}
                    style={[styles.pairBtn, styles.outlineBtn]}
                  />
                </View>
                <Text style={styles.pendingText}>
                  Start: {fmt(pendingStart ?? 0)}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.reviewRow}>
                  <Button
                    label="Done"
                    variant="primary"
                    onPress={commitSlot}
                    style={styles.reviewBtn}
                    icon={
                      <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                    }
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

            {/* Bulk actions */}
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

      {/* Continue — pinned below the scroll view; greyed until ready. */}
      <View style={styles.footer}>
        <Button
          label="Continue"
          variant="primary"
          disabled={!ready}
          onPress={() => goFeed(true)}
        />
      </View>

      {/* "Add languages" bottom sheet */}
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
            <Text style={styles.sheetTitle}>Add languages</Text>

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
                const on = moreLangs.includes(l);
                return (
                  <TouchableOpacity
                    key={l}
                    style={[styles.langRow, on && styles.langRowOn]}
                    onPress={() => toggleMoreLang(l)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={styles.langRowText}>{l}</Text>
                    {on ? (
                      <Ionicons name="checkmark-circle" size={22} color="#2D6A4F" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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

  // Section 1
  formatRow: { flexDirection: "row" },
  formatItem: { width: "33.333%" },

  // Section 2
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

  // Section 3
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

  // Section 4 — day row
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
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

  // Section 4 — timeline
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
  tick: {
    position: "absolute",
    top: 26,
    width: 1.5,
    backgroundColor: "#C9CDD3",
  },
  tickLabel: {
    position: "absolute",
    top: 52,
    width: 28,
    textAlign: "center",
    fontSize: 10,
    color: "#9CA3AF",
  },
  highlight: {
    position: "absolute",
    top: 20,
    height: 44,
    borderRadius: 8,
  },
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
  redLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#E63946",
  },
  redPillRow: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  redPill: {
    backgroundColor: "#E63946",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  redPillText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },

  addSlotBtn: {
    alignSelf: "center",
    paddingHorizontal: 26,
    marginTop: 16,
  },
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
  btnPair: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  pairBtn: { minWidth: 124 },
  reviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
  },
  reviewBtn: { paddingHorizontal: 16, minWidth: 96 },
  outlineBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
  },
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
  applyRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 28,
    marginTop: 18,
  },
  applyLink: { color: "#2D6A4F", fontSize: 15, fontWeight: "700" },
  clearLink: { color: "#E63946", fontSize: 15, fontWeight: "700" },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECECEC",
  },

  // Bottom sheet
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
  sheetInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
  },
  sheetList: { maxHeight: 360 },
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
