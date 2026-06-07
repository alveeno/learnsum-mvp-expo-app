import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/ui/Button";

/**
 * Tutor onboarding — step 2: "Who do you teach?".
 *
 * Same layout as the student education-level screen, but MULTI-select: a tutor
 * can pick every level they're able to tutor. Selected levels all glow in one
 * uniform colour (brand Forest Green) rather than the student screen's per-level
 * colours. The chosen levels are passed FORWARD as a route param — no backend.
 */
type LevelKey =
  | "kindergarten"
  | "primary"
  | "middle"
  | "high"
  | "university"
  | "adult";

type Level = { key: LevelKey; label: string; icon: keyof typeof Ionicons.glyphMap };

const LEVELS: Level[] = [
  { key: "kindergarten", label: "Kindergarten", icon: "happy" },
  { key: "primary", label: "Primary", icon: "pencil" },
  { key: "middle", label: "Middle School", icon: "book" },
  { key: "high", label: "High School", icon: "school" },
  { key: "university", label: "University", icon: "library" },
  { key: "adult", label: "Adult / Pro", icon: "briefcase" },
];

const SELECTED_COLOR = "#2D6A4F"; // uniform glow for every chosen level
const PROGRESS = 0.5;

export default function TutorTeachLevels() {
  // Multi-select: a set of chosen level keys.
  const [selected, setSelected] = useState<Set<LevelKey>>(() => new Set());

  const toggle = (key: LevelKey) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const goNext = () =>
    router.push({
      pathname: "/onboarding/TutorCatSel",
      params: { levels: JSON.stringify([...selected]) },
    });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
      </View>

      <View style={styles.container}>
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
            onPress={goNext}
            accessibilityRole="button"
            accessibilityLabel="Skip"
          >
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Who do you teach?</Text>
        <Text style={styles.subtitle}>Select all the levels you can teach.</Text>

        <View style={styles.grid}>
          {LEVELS.map((level) => {
            const isSelected = selected.has(level.key);
            const circleStyle = StyleSheet.flatten([
              styles.iconCircle,
              isSelected
                ? { backgroundColor: SELECTED_COLOR }
                : styles.iconCircleResting,
            ]);
            return (
              <Pressable
                key={level.key}
                style={styles.gridItem}
                accessibilityRole="button"
                accessibilityLabel={level.label}
                accessibilityState={{ selected: isSelected }}
                onPress={() => toggle(level.key)}
              >
                <View style={circleStyle}>
                  <Ionicons
                    name={level.icon}
                    size={30}
                    color={isSelected ? "#FFFFFF" : "#9CA3AF"}
                  />
                </View>
                <Text style={styles.itemLabel}>{level.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label="Continue"
          variant="primary"
          disabled={selected.size === 0}
          style={styles.continue}
          onPress={goNext}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  progressTrack: { height: 4, backgroundColor: "#E5E7EB", width: "100%" },
  progressFill: { height: 4, backgroundColor: "#2D6A4F" },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
  },
  skip: { fontSize: 17, fontWeight: "600", color: "#6B7280" },
  title: {
    marginTop: 12,
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 38,
  },
  subtitle: { marginTop: 12, fontSize: 16, color: "#6B7280" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 24,
    marginTop: 32,
  },
  gridItem: { width: "30%", alignItems: "center" },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleResting: { backgroundColor: "#F0F1F3" },
  itemLabel: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  continue: { marginTop: 40 },
});
