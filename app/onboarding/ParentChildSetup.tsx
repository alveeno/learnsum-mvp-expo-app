import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "../../components/ui/Button";
import {
  PreferencesScreen,
  type Prefs,
} from "../../components/onboarding/PreferencesScreen";
import { getStored, setStored } from "../../components/onboarding/onboardingStore";
import { CategorySelect, type Interest } from "./StudentCatSel";

/**
 * Parent flow controller — runs the per-child setup, ONE child at a time:
 *
 *   Child 1 categories → Child 1 preferences → Child 2 categories → … → Review
 *
 * The roster (names + education levels) arrives from ParentNumChild as a route
 * param. Every child's answers live together in this component's state, so the
 * final review reads them straight from memory — nothing is sent to a backend
 * (see CLAUDE.md). The category and preference screens are the same ones the
 * student path uses; here they are pointed at this controller's callbacks and
 * carry the child's name in a gold banner.
 */

type ChildInput = { name: string; level: string | null };
type Phase = "category" | "preferences";
type Step = { kind: "child"; index: number; phase: Phase } | { kind: "review" };

const LEVEL_LABELS: Record<string, string> = {
  kindergarten: "Kindergarten",
  primary: "Primary",
  middle: "Middle School",
  high: "High School",
  university: "University",
  adult: "Adult / Pro",
};
const FORMAT_LABELS: Record<string, string> = {
  in_person: "In person",
  online: "Online",
  both: "Both",
};
const REGION_LABELS: Record<string, string> = {
  hk: "HK Island",
  kln: "Kowloon",
  nt: "New Terr.",
};
const LANG_LABELS: Record<string, string> = {
  cantonese: "Cantonese",
  mandarin: "Mandarin",
  english: "English",
};
const DAY_LABELS: { key: string; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

function fmtTime(min: number): string {
  const total = Math.max(0, Math.min(1440, min));
  const h = Math.floor(total / 60);
  const m = total % 60;
  let hr = h % 12;
  if (hr === 0) hr = 12;
  const ampm = total >= 720 && total < 1440 ? "PM" : "AM";
  return `${hr}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function summariseLangs(pf: Prefs): string {
  const main = (pf.langs ?? []).map((id) => LANG_LABELS[id] ?? id);
  const all = [...main, ...(pf.moreLangs ?? [])];
  return all.length ? all.join(", ") : "Any";
}

function summariseAvail(avail: Prefs["avail"]): string {
  const days = avail as Record<string, { start: number; end: number }[]>;
  const parts = DAY_LABELS.filter((d) => (days[d.key]?.length ?? 0) > 0).map(
    (d) =>
      `${d.label} ${days[d.key]
        .map((s) => `${fmtTime(s.start)}–${fmtTime(s.end)}`)
        .join(", ")}`,
  );
  return parts.length ? parts.join("    ") : "Anytime";
}

export default function ParentChildSetup() {
  const params = useLocalSearchParams<{ children?: string }>();
  const roster = useMemo<ChildInput[]>(() => {
    try {
      const parsed = params.children ? JSON.parse(params.children) : [];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as ChildInput[];
    } catch {
      // fall through to default
    }
    return [{ name: "Child 1", level: null }];
  }, [params.children]);
  const n = roster.length;

  // Each child's answers live in the shared in-memory store, keyed by child
  // index, so they survive navigating away and back (and are read straight back
  // for the review). Keys are stable per slot — see onboardingStore.
  const catKey = (i: number) => `parent:child:${i}:interests`;
  const prefKey = (i: number) => `parent:child:${i}:prefs`;

  const [step, setStep] = useState<Step>({ kind: "child", index: 0, phase: "category" });
  // True when we jumped to a screen from the review (so Continue/Back/Skip
  // return to the review instead of walking the normal sequence).
  const [editing, setEditing] = useState(false);

  const nameOf = (i: number) => roster[i]?.name?.trim() || `Child ${i + 1}`;
  const bannerFor = (i: number) => `${nameOf(i)} · Child ${i + 1} of ${n}`;

  const totalSteps = n * 2;
  const stepNo =
    step.kind === "child"
      ? step.index * 2 + (step.phase === "category" ? 1 : 2)
      : totalSteps;
  const progress = stepNo / totalSteps;

  const nextOf = (s: Step): Step => {
    if (s.kind === "review") return s;
    if (s.phase === "category") return { kind: "child", index: s.index, phase: "preferences" };
    if (s.index + 1 < n) return { kind: "child", index: s.index + 1, phase: "category" };
    return { kind: "review" };
  };
  const prevOf = (s: Step): Step | null => {
    if (s.kind === "review") return { kind: "child", index: n - 1, phase: "preferences" };
    if (s.phase === "preferences") return { kind: "child", index: s.index, phase: "category" };
    if (s.index > 0) return { kind: "child", index: s.index - 1, phase: "preferences" };
    return null; // first step → leave the flow
  };

  const afterFill = () => {
    if (editing) {
      setEditing(false);
      setStep({ kind: "review" });
    } else {
      setStep(nextOf(step));
    }
  };

  const onCatContinue = (i: number) => (data: Interest[]) => {
    setStored<Interest[]>(catKey(i), data);
    afterFill();
  };
  const onPrefContinue = (i: number) => (data: Prefs) => {
    setStored<Prefs>(prefKey(i), data);
    afterFill();
  };
  const onSkipStep = () => afterFill(); // skip just this one screen
  const onBackStep = () => {
    if (editing) {
      setEditing(false);
      setStep({ kind: "review" });
      return;
    }
    const prev = prevOf(step);
    if (!prev) router.back();
    else setStep(prev);
  };

  const editCategory = (i: number) => {
    setEditing(true);
    setStep({ kind: "child", index: i, phase: "category" });
  };
  const editPrefs = (i: number) => {
    setEditing(true);
    setStep({ kind: "child", index: i, phase: "preferences" });
  };

  const confirm = () => router.push("/feed");

  // ---- per-child category step ----
  if (step.kind === "child" && step.phase === "category") {
    const i = step.index;
    return (
      <CategorySelect
        key={`cat-${i}`}
        banner={bannerFor(i)}
        progress={progress}
        persistKey={catKey(i)}
        onContinue={onCatContinue(i)}
        onSkip={onSkipStep}
        onBack={onBackStep}
      />
    );
  }

  // ---- per-child preferences step ----
  if (step.kind === "child" && step.phase === "preferences") {
    const i = step.index;
    return (
      <PreferencesScreen
        key={`pref-${i}`}
        banner={bannerFor(i)}
        progress={progress}
        languageMode="select"
        persistKey={prefKey(i)}
        onContinue={onPrefContinue(i)}
        onSkip={onSkipStep}
        onBack={onBackStep}
      />
    );
  }

  // ---- review ----
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: "100%" }]} />
      </View>
      <View style={styles.headerRow}>
        <Pressable
          hitSlop={8}
          onPress={onBackStep}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </Pressable>
        <View />
      </View>

      <ScrollView
        contentContainerStyle={styles.reviewContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Review</Text>
        <Text style={styles.subtitle}>
          Check everything looks right. Tap a section to edit it.
        </Text>

        {roster.map((child, i) => {
          const it = getStored<Interest[] | null>(catKey(i), null);
          const pf = getStored<Prefs | null>(prefKey(i), null);
          const needLoc = pf?.format === "in_person" || pf?.format === "both";
          return (
            <View key={i} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>{i + 1}</Text>
                </View>
                <Text style={styles.cardName}>{nameOf(i)}</Text>
                <Text style={styles.cardLevel}>
                  {child.level ? LEVEL_LABELS[child.level] ?? child.level : "No level"}
                </Text>
              </View>

              {/* Interests */}
              <Pressable
                style={styles.section}
                onPress={() => editCategory(i)}
                accessibilityRole="button"
                accessibilityLabel={`Edit interests for ${nameOf(i)}`}
              >
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Interests</Text>
                  <View style={styles.editLink}>
                    <MaterialCommunityIcons name="pencil" size={13} color="#2D6A4F" />
                    <Text style={styles.editLinkText}>Edit</Text>
                  </View>
                </View>
                {it && it.length > 0 ? (
                  <Text style={styles.sectionBody}>
                    {it.map((x) => x.label).filter(Boolean).join(", ")}
                  </Text>
                ) : (
                  <Text style={styles.sectionMuted}>Not set</Text>
                )}
              </Pressable>

              {/* Preferences */}
              <Pressable
                style={styles.section}
                onPress={() => editPrefs(i)}
                accessibilityRole="button"
                accessibilityLabel={`Edit preferences for ${nameOf(i)}`}
              >
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Preferences</Text>
                  <View style={styles.editLink}>
                    <MaterialCommunityIcons name="pencil" size={13} color="#2D6A4F" />
                    <Text style={styles.editLinkText}>Edit</Text>
                  </View>
                </View>
                {pf ? (
                  <View style={styles.kvList}>
                    <Text style={styles.sectionBody}>
                      Format: {pf.format ? FORMAT_LABELS[pf.format] : "—"}
                    </Text>
                    {needLoc ? (
                      <Text style={styles.sectionBody}>
                        Location: {pf.region ? REGION_LABELS[pf.region] ?? pf.region : "—"}
                        {pf.district ? ` · ${pf.district}` : ""}
                      </Text>
                    ) : null}
                    <Text style={styles.sectionBody}>
                      Languages: {summariseLangs(pf)}
                    </Text>
                    <Text style={styles.sectionBody}>
                      Availability: {summariseAvail(pf.avail)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.sectionMuted}>Not set</Text>
                )}
              </Pressable>
            </View>
          );
        })}

        <Button
          label="Confirm"
          variant="primary"
          onPress={confirm}
          style={styles.confirmBtn}
        />
      </ScrollView>
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
  reviewContent: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { marginTop: 6, fontSize: 30, fontWeight: "800", color: "#111827" },
  subtitle: { marginTop: 8, fontSize: 16, color: "#6B7280" },

  card: {
    backgroundColor: "#F7F7F5",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F4A923",
    alignItems: "center",
    justifyContent: "center",
  },
  numberBadgeText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  cardName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  cardLevel: { fontSize: 13, fontWeight: "600", color: "#6B7280" },

  section: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "#374151",
    textTransform: "uppercase",
  },
  editLink: { flexDirection: "row", alignItems: "center", gap: 3 },
  editLinkText: { color: "#2D6A4F", fontSize: 13, fontWeight: "700" },
  kvList: { gap: 2 },
  sectionBody: { fontSize: 14, color: "#111827", lineHeight: 20 },
  sectionMuted: { fontSize: 14, color: "#9CA3AF", fontStyle: "italic" },

  confirmBtn: { marginTop: 28 },
});
