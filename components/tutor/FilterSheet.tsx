/**
 * Tutor app — advanced search filters.
 *
 * Ported from `tutor/tutor-filters.jsx`. The web source uses pointer events for
 * the draggable sliders; here they're rebuilt with React Native's PanResponder
 * (no extra native dependency). Filter logic (DEF_FILTERS / activeCount /
 * passFilters) is exported for the Search screen.
 */
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BOUNDS, C, GENDERS, parseK, type FullTutor, type Gender } from "./tutorData";
import { DistrictPicker } from "../onboarding/DistrictPicker";

export type Filters = {
  price: [number, number];
  age: [number, number];
  rating: number;
  years: number;
  sessions: number;
  followers: number;
  mode: "either" | "f2f" | "online";
  locations: string[];
  genders: Gender[];
};

export const DEF_FILTERS = (): Filters => ({
  price: [...BOUNDS.price],
  age: [...BOUNDS.age],
  rating: 0,
  years: 0,
  sessions: 0,
  followers: 0,
  mode: "either",
  locations: [],
  genders: [],
});

/** Count of filters that differ from default — drives the badge. */
export function activeCount(f: Filters): number {
  const d = DEF_FILTERS();
  let n = 0;
  if (f.price[0] !== d.price[0] || f.price[1] !== d.price[1]) n++;
  if (f.age[0] !== d.age[0] || f.age[1] !== d.age[1]) n++;
  if (f.rating > 0) n++;
  if (f.years > 0) n++;
  if (f.sessions > 0) n++;
  if (f.followers > 0) n++;
  if (f.mode !== "either") n++;
  if (f.locations.length) n++;
  if (f.genders.length) n++;
  return n;
}

/** Does a directory record pass the filter set? */
export function passFilters(t: FullTutor, f: Filters): boolean {
  if (t.price < f.price[0] || t.price > f.price[1]) return false;
  if (t.age < f.age[0] || t.age > f.age[1]) return false;
  if (t.stats.rating < f.rating) return false;
  if (t.stats.years < f.years) return false;
  if (t.stats.sessions < f.sessions) return false;
  if (parseK(t.stats.followers) < f.followers) return false;
  if (f.genders.length && !f.genders.includes(t.gender)) return false;
  if (f.locations.length && !f.locations.includes(t.loc)) return false;
  if (f.mode !== "either" && t.mode !== "both" && t.mode !== f.mode) return false;
  return true;
}

/* ===== draggable slider (single or dual thumb) ===== */
const THUMB = 26;

function Slider({
  min,
  max,
  step = 1,
  dual = false,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step?: number;
  dual?: boolean;
  value: number | [number, number];
  onChange: (v: number | [number, number]) => void;
}) {
  const geom = useRef({ x: 0, w: 0 });
  const trackRef = useRef<View>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const measure = () => trackRef.current?.measureInWindow((x, _y, w) => (geom.current = { x, w }));

  const valFromX = (pageX: number): number => {
    const { x, w } = geom.current;
    if (!w) return min;
    let p = (pageX - x) / w;
    p = Math.max(0, Math.min(1, p));
    return Math.round((min + p * (max - min)) / step) * step;
  };

  const handle = (which: "a" | "b" | "single", pageX: number) => {
    let v = valFromX(pageX);
    if (!dual) {
      onChangeRef.current(v);
      return;
    }
    const [a, b] = valueRef.current as [number, number];
    if (which === "a") {
      v = Math.min(v, b);
      onChangeRef.current([v, b]);
    } else {
      v = Math.max(v, a);
      onChangeRef.current([a, v]);
    }
  };

  const make = (which: "a" | "b" | "single") =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        measure();
        handle(which, e.nativeEvent.pageX);
      },
      onPanResponderMove: (e) => handle(which, e.nativeEvent.pageX),
    });

  const respA = useRef(make("a")).current;
  const respB = useRef(make("b")).current;
  const respS = useRef(make("single")).current;

  const a = dual ? (value as [number, number])[0] : min;
  const b = dual ? (value as [number, number])[1] : (value as number);
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <View style={{ paddingHorizontal: 13 }}>
      <View ref={trackRef} onLayout={measure} style={styles.track}>
        <View style={styles.trackBase} />
        <View
          style={[
            styles.trackFill,
            dual ? { left: `${pct(a)}%`, width: `${pct(b) - pct(a)}%` } : { left: 0, width: `${pct(b)}%` },
          ]}
        />
        {dual && (
          <View style={[styles.thumb, { left: `${pct(a)}%` }]} {...respA.panHandlers}>
            <View style={styles.thumbDot} />
          </View>
        )}
        <View style={[styles.thumb, { left: `${pct(b)}%` }]} {...(dual ? respB : respS).panHandlers}>
          <View style={styles.thumbDot} />
        </View>
      </View>
    </View>
  );
}

/* ===== building blocks ===== */
function FRow({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <View style={styles.frow}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <Text style={{ fontSize: 14.5, fontWeight: "700", letterSpacing: -0.2, color: C.ink }}>{label}</Text>
        <Text style={{ fontSize: 13, fontWeight: "700", color: C.greenD }}>{value}</Text>
      </View>
      {children}
    </View>
  );
}

function Chip({ on, onPress, children }: { on: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: on ? C.green : C.hairline,
        backgroundColor: on ? C.green : "#fff",
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "600", color: on ? "#fff" : C.ink }}>{children}</Text>
    </Pressable>
  );
}

const MODE_OPTS: { v: Filters["mode"]; l: string; ic: keyof typeof Ionicons.glyphMap }[] = [
  { v: "either", l: "Any", ic: "options-outline" },
  { v: "f2f", l: "In person", ic: "people-outline" },
  { v: "online", l: "Online", ic: "videocam-outline" },
];

/* ===== the sheet ===== */
export function FilterSheet({
  visible,
  init,
  onApply,
  onClose,
  count,
  hideUnsupported = false,
}: {
  visible: boolean;
  init: Filters;
  onApply: (f: Filters) => void;
  onClose: () => void;
  count: (f: Filters) => number;
  /** Hide the rating / years / sessions / followers sliders — the seeker search
   *  runs against the real backend, which doesn't support those filters yet. */
  hideUnsupported?: boolean;
}) {
  const [f, setF] = useState<Filters>(init);
  useEffect(() => {
    if (visible) setF(init);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggleArr = (k: "locations" | "genders", v: string) =>
    setF((p) => ({
      ...p,
      [k]: (p[k] as string[]).includes(v) ? (p[k] as string[]).filter((x) => x !== v) : [...(p[k] as string[]), v],
    }));

  const n = count(f);
  const modeLabel = { either: "Any", f2f: "In person", online: "Online" }[f.mode];

  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <Pressable style={{ flex: 1 }} onPress={onClose} />
      <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <View style={styles.grabber} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Pressable onPress={() => setF(DEF_FILTERS())} hitSlop={8}>
                <Text style={{ fontSize: 13.5, fontWeight: "700", color: C.muted }}>Reset</Text>
              </Pressable>
              <Text style={{ fontSize: 16, fontWeight: "800", letterSpacing: -0.3, color: C.ink }}>Advanced filters</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={22} color={C.ink} />
              </Pressable>
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8 }}>
            <FRow label="Price per hour" value={`$${f.price[0]} – $${f.price[1]}${f.price[1] >= BOUNDS.price[1] ? "+" : ""}`}>
              <Slider min={BOUNDS.price[0]} max={BOUNDS.price[1]} step={10} dual value={f.price} onChange={(v) => set("price", v as [number, number])} />
            </FRow>

            <FRow label="Tutor age" value={`${f.age[0]} – ${f.age[1]}${f.age[1] >= BOUNDS.age[1] ? "+" : ""}`}>
              <Slider min={BOUNDS.age[0]} max={BOUNDS.age[1]} step={1} dual value={f.age} onChange={(v) => set("age", v as [number, number])} />
            </FRow>

            <FRow label="Lesson mode" value={modeLabel}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {MODE_OPTS.map((m) => {
                  const on = f.mode === m.v;
                  return (
                    <Pressable
                      key={m.v}
                      onPress={() => set("mode", m.v)}
                      style={[styles.modeBtn, { borderColor: on ? C.green : C.hairline, backgroundColor: on ? C.green : "#fff" }]}
                    >
                      <Ionicons name={m.ic} size={17} color={on ? "#fff" : C.muted} />
                      <Text style={{ fontSize: 13, fontWeight: "600", color: on ? "#fff" : C.ink }}>{m.l}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </FRow>

            <FRow label="Location" value={f.locations.length ? `${f.locations.length} selected` : "Anywhere"}>
              <DistrictPicker value={f.locations} onChange={(next) => set("locations", next)} />
            </FRow>

            <FRow label="Tutor gender" value={f.genders.length ? `${f.genders.length} selected` : "Any"}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {GENDERS.map((g) => (
                  <Chip key={g.v} on={f.genders.includes(g.v)} onPress={() => toggleArr("genders", g.v)}>
                    {g.label}
                  </Chip>
                ))}
              </View>
            </FRow>

            {!hideUnsupported && (
              <>
                <FRow label="Minimum rating" value={f.rating ? `${f.rating.toFixed(1)}★ & up` : "Any"}>
                  <Slider min={0} max={5} step={0.5} value={f.rating} onChange={(v) => set("rating", v as number)} />
                </FRow>

                <FRow label="Years of teaching experience" value={f.years ? `${f.years}+ yrs` : "Any"}>
                  <Slider min={0} max={10} step={1} value={f.years} onChange={(v) => set("years", v as number)} />
                </FRow>

                <FRow label="Successful sessions" value={f.sessions ? `${f.sessions}+` : "Any"}>
                  <Slider min={0} max={300} step={10} value={f.sessions} onChange={(v) => set("sessions", v as number)} />
                </FRow>

                <FRow label="Followers" value={f.followers ? `${f.followers >= 1000 ? f.followers / 1000 + "k" : f.followers}+` : "Any"}>
                  <Slider min={0} max={3000} step={100} value={f.followers} onChange={(v) => set("followers", v as number)} />
                </FRow>
              </>
            )}
          </ScrollView>

          <View style={styles.sheetFoot}>
            <Pressable onPress={() => onApply(f)} style={styles.applyBtn}>
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
                Show {n} tutor{n === 1 ? "" : "s"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(22,32,28,0.32)",
    justifyContent: "flex-end",
  },
  // A definite height (not maxHeight) so the inner ScrollView gets real space —
  // a flex:1 ScrollView inside a content-sized sheet collapses to zero.
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, height: "90%" },
  sheetHead: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.hairline },
  grabber: { width: 38, height: 4, borderRadius: 2, backgroundColor: C.unselBg, alignSelf: "center", marginBottom: 10 },
  sheetFoot: { paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.hairline },
  applyBtn: { height: 50, borderRadius: 25, backgroundColor: C.green, alignItems: "center", justifyContent: "center" },
  frow: { paddingVertical: 16, paddingHorizontal: 3, borderBottomWidth: 1, borderBottomColor: C.hairline },
  track: { height: 30, justifyContent: "center" },
  trackBase: { position: "absolute", left: 0, right: 0, height: 5, borderRadius: 3, backgroundColor: C.unselBg },
  trackFill: { position: "absolute", height: 5, borderRadius: 3, backgroundColor: C.green },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    marginLeft: -THUMB / 2,
    borderRadius: THUMB / 2,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  thumbDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: C.green },
  modeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  regionBtn: { flex: 1, height: 36, borderRadius: 11, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  regionBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  locGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 16, marginTop: 14 },
  locDisc: { width: "20%", alignItems: "center", gap: 7 },
  locCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: "center", justifyContent: "center" },
});
