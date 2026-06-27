import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/ui/Button";
import { SelectableCircle } from "../../components/ui/SelectableCircle";
import { usePersistentState } from "../../components/onboarding/onboardingStore";
import { onStepContinue, onStepSkip } from "../../components/onboarding/tutorOnboarding";
import { useSkipGuard } from "../../components/onboarding/useSkipGuard";
import { useT } from "../../components/i18n/LanguageProvider";
import { type TranslationKey } from "../../components/i18n/translations";

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

type Level = { key: LevelKey; labelKey: TranslationKey; icon: keyof typeof Ionicons.glyphMap };

const LEVELS: Level[] = [
  { key: "kindergarten", labelKey: "level.kindergarten", icon: "happy" },
  { key: "primary", labelKey: "level.primary", icon: "pencil" },
  { key: "middle", labelKey: "level.middle", icon: "book" },
  { key: "high", labelKey: "level.high", icon: "school" },
  { key: "university", labelKey: "level.university", icon: "library" },
  { key: "adult", labelKey: "level.adult", icon: "briefcase" },
];

const SELECTED_COLOR = "#2D6A4F"; // uniform glow for every chosen level
const PROGRESS = 0.5;
const CASCADE_STAGGER = 55;

export default function TutorTeachLevels() {
  const t = useT();
  // Multi-select: a set of chosen level keys. Persisted so the choices survive
  // navigating away and back (see onboardingStore).
  const [selected, setSelected] = usePersistentState<Set<LevelKey>>(
    "tutor:levels",
    () => new Set(),
  );

  // One-time "Skip this step?" confirmation, shared across all onboarding Skips.
  const { requestSkip, skipModal } = useSkipGuard();

  const toggle = (key: LevelKey) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const firstTimeNext = () =>
    router.push({
      pathname: "/onboarding/TutorCatSel",
      params: { levels: JSON.stringify([...selected]) },
    });
  const goContinue = () => onStepContinue("teachLevels", firstTimeNext);
  const goSkip = () => onStepSkip("teachLevels", firstTimeNext);

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
            onPress={() => requestSkip(goSkip)}
            accessibilityRole="button"
            accessibilityLabel="Skip"
          >
            <Text style={styles.skip}>{t("common.skip")}</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>{t("tutor.levels.title")}</Text>
        <Text style={styles.subtitle}>{t("tutor.levels.subtitle")}</Text>

        <View style={styles.grid}>
          {LEVELS.map((level, i) => {
            const isSelected = selected.has(level.key);
            return (
              <SelectableCircle
                key={level.key}
                style={styles.gridItem}
                label={t(level.labelKey)}
                selected={isSelected}
                color={SELECTED_COLOR}
                entranceDelay={i * CASCADE_STAGGER}
                accessibilityLabel={t(level.labelKey)}
                onPress={() => toggle(level.key)}
                renderIcon={({ size, color }) => (
                  <Ionicons name={level.icon} size={size} color={color} />
                )}
              />
            );
          })}
        </View>

        <Button
          label={t("common.continue")}
          variant="primary"
          disabled={selected.size === 0}
          style={styles.continue}
          onPress={goContinue}
        />
      </View>

      {skipModal}
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
  continue: { marginTop: 40 },
});
