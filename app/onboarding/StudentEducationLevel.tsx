import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "../../components/ui/Button";
import { usePersistentState } from "../../components/onboarding/onboardingStore";
import { useSkipGuard } from "../../components/onboarding/useSkipGuard";
import { useT } from "../../components/i18n/LanguageProvider";
import { type TranslationKey } from "../../components/i18n/translations";

/**
 * Step 1 of student onboarding: pick an education level.
 *
 * The selection is kept in local state and passed FORWARD to the category
 * screen as a route param (no backend write — see CLAUDE.md data rules).
 * The progress bar only advances when the user either picks a level and
 * presses Continue, or presses Skip.
 */
type LevelKey =
  | "kindergarten"
  | "primary"
  | "middle"
  | "high"
  | "university"
  | "adult";

type Level = {
  key: LevelKey;
  labelKey: TranslationKey;
  icon: keyof typeof Ionicons.glyphMap;
  /** Colour the icon circle grows into once selected. */
  color: string;
};

// Green is the Primary token and red is the Destructive token from the design
// system; orange / yellow / blue / indigo are not design tokens, so they use
// clean conventional hues (this screen's spec asks for six distinct colours).
const LEVELS: Level[] = [
  { key: "kindergarten", labelKey: "level.kindergarten", icon: "happy", color: "#E63946" },
  { key: "primary", labelKey: "level.primary", icon: "pencil", color: "#F97316" },
  { key: "middle", labelKey: "level.middle", icon: "book", color: "#EAB308" },
  { key: "high", labelKey: "level.high", icon: "school", color: "#2D6A4F" },
  { key: "university", labelKey: "level.university", icon: "library", color: "#2563EB" },
  { key: "adult", labelKey: "level.adult", icon: "briefcase", color: "#4F46E5" },
];

// This screen is step 1; advancing lands on the category screen further along.
const PROGRESS = 0.33;

export default function StudentEducationLevel() {
  const t = useT();
  // Single-select: one level or none. Persisted so returning to this step keeps
  // the choice (see onboardingStore).
  const [selectedKey, setSelectedKey] = usePersistentState<LevelKey | null>(
    "student:eduLevel",
    null,
  );

  // One-time "Skip this step?" confirmation, shared across all onboarding Skips.
  const { requestSkip, skipModal } = useSkipGuard();

  const goToCategory = () => {
    router.push({
      pathname: "/onboarding/StudentCatSel",
      // Pass the chosen level forward; undefined when skipped.
      params: selectedKey ? { educationLevel: selectedKey } : {},
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Progress bar — only advances by navigating to the next step. */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
      </View>

      <View style={styles.container}>
        {/* Back + Skip row */}
        <View style={styles.headerRow}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#111827" />
          </Pressable>
          <Pressable hitSlop={8} onPress={() => requestSkip(goToCategory)}>
            <Text style={styles.skip}>{t("common.skip")}</Text>
          </Pressable>
        </View>

        {/* Heading */}
        <Text style={styles.title}>{t("student.level.title")}</Text>
        <Text style={styles.subtitle}>{t("student.level.subtitle")}</Text>

        {/* 3 x 2 grid of selectable levels */}
        <View style={styles.grid}>
          {LEVELS.map((level) => {
            const isSelected = level.key === selectedKey;
            const circleStyle = StyleSheet.flatten([
              styles.iconCircle,
              isSelected
                ? { backgroundColor: level.color }
                : styles.iconCircleResting,
            ]);

            return (
              <Pressable
                key={level.key}
                style={styles.gridItem}
                accessibilityRole="button"
                accessibilityLabel={t(level.labelKey)}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelectedKey(level.key)}
              >
                <View style={circleStyle}>
                  <Ionicons
                    name={level.icon}
                    size={30}
                    color={isSelected ? "#FFFFFF" : "#9CA3AF"}
                  />
                </View>
                <Text style={styles.itemLabel}>{t(level.labelKey)}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Continue — enabled only once a level is chosen. */}
        <Button
          label={t("common.continue")}
          variant="primary"
          disabled={selectedKey === null}
          style={styles.continue}
          onPress={goToCategory}
        />
      </View>

      {skipModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  progressTrack: {
    height: 4,
    backgroundColor: "#E5E7EB",
    width: "100%",
  },
  progressFill: {
    height: 4,
    backgroundColor: "#2D6A4F", // Primary / Forest Green
  },
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
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 24,
    marginTop: 32,
  },
  gridItem: {
    // Three per row with even gutters.
    width: "30%",
    alignItems: "center",
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 999, // circular avatar
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleResting: {
    // Greyed out until selected.
    backgroundColor: "#F0F1F3",
  },
  itemLabel: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  continue: {
    marginTop: 40,
  },
});
