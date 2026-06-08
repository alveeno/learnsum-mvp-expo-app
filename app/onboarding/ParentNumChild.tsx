import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "../../components/ui/Button";
import { SelectableCircle } from "../../components/ui/SelectableCircle";
import { usePersistentState } from "../../components/onboarding/onboardingStore";
import { useSkipGuard } from "../../components/onboarding/useSkipGuard";
import { useT } from "../../components/i18n/LanguageProvider";
import { type TranslationKey } from "../../components/i18n/translations";

/**
 * Parent onboarding — step 1: "Your children".
 *
 * The parent sets how many children they have, then names each child and picks
 * that child's education level. Everything is local state and is handed FORWARD
 * as route params — no backend write (see CLAUDE.md data rules).
 *
 * Continue is enabled only once EVERY child has a name and a level. The chosen
 * education levels use the same six options as the student path, but each one
 * glows gold (Accent) when selected — single-select per child.
 */

type Child = { name: string; level: string | null };

const LEVELS: { key: string; labelKey: TranslationKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "kindergarten", labelKey: "level.kindergarten", icon: "happy" },
  { key: "primary", labelKey: "level.primary", icon: "pencil" },
  { key: "middle", labelKey: "level.middle", icon: "book" },
  { key: "high", labelKey: "level.high", icon: "school" },
  { key: "university", labelKey: "level.university", icon: "library" },
  { key: "adult", labelKey: "level.adult", icon: "briefcase" },
];

const MIN_CHILDREN = 1;
const MAX_CHILDREN = 6;
const PROGRESS = 0.33; // first of three parent steps

export default function ParentNumChild() {
  const t = useT();
  // Persisted roster: names + levels survive navigating away and back, and feed
  // the per-child setup that follows (see onboardingStore).
  const [children, setChildren] = usePersistentState<Child[]>("parent:roster", [
    { name: "", level: null },
  ]);
  const count = children.length;

  // One-time "Skip this step?" confirmation, shared across all onboarding Skips.
  const { requestSkip, skipModal } = useSkipGuard();

  const setCountTo = (n: number) => {
    const c = Math.max(MIN_CHILDREN, Math.min(MAX_CHILDREN, n));
    setChildren((prev) => {
      if (c === prev.length) return prev;
      if (c > prev.length) {
        const extra = Array.from({ length: c - prev.length }, () => ({
          name: "",
          level: null,
        }));
        return [...prev, ...extra];
      }
      return prev.slice(0, c); // trimming keeps the remaining children intact
    });
  };

  const setName = (i: number, name: string) =>
    setChildren((prev) => prev.map((ch, idx) => (idx === i ? { ...ch, name } : ch)));
  const setLevel = (i: number, level: string) =>
    setChildren((prev) => prev.map((ch, idx) => (idx === i ? { ...ch, level } : ch)));

  const isComplete = (ch: Child) => ch.name.trim().length > 0 && ch.level !== null;
  const allComplete = children.every(isComplete);

  const goNext = () =>
    router.push({
      pathname: "/onboarding/ParentChildSetup",
      params: {
        childCount: String(count),
        children: JSON.stringify(children),
      },
    });

  return (
    <SafeAreaView style={styles.safeArea}>
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
          onPress={() => requestSkip(() => router.push("/feed"))}
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
        <Text style={styles.title}>{t("parent.children.title")}</Text>
        <Text style={styles.subtitle}>
          {t("parent.children.subtitle")}{" "}
          <Text style={styles.subtitleStrong}>{t("parent.children.editLater")}</Text>
        </Text>

        {/* Number-of-children stepper */}
        <View style={styles.counterRow}>
          <Pressable
            style={[styles.stepBtn, count <= MIN_CHILDREN && styles.stepBtnDisabled]}
            disabled={count <= MIN_CHILDREN}
            onPress={() => setCountTo(count - 1)}
            accessibilityRole="button"
            accessibilityLabel="Fewer children"
          >
            <Ionicons name="remove" size={28} color="#111827" />
          </Pressable>

          <View style={styles.counterCenter}>
            <Text style={styles.counterNumber}>{count}</Text>
            <Text style={styles.counterCaption}>
              {count === 1
                ? t("parent.children.unit.one")
                : t("parent.children.unit.other")}
            </Text>
          </View>

          <Pressable
            style={[styles.stepBtn, count >= MAX_CHILDREN && styles.stepBtnDisabled]}
            disabled={count >= MAX_CHILDREN}
            onPress={() => setCountTo(count + 1)}
            accessibilityRole="button"
            accessibilityLabel="More children"
          >
            <Ionicons name="add" size={28} color="#111827" />
          </Pressable>
        </View>

        {/* One card per child */}
        {children.map((child, i) => {
          const complete = isComplete(child);
          return (
            <View key={i} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>{i + 1}</Text>
                </View>
                <Text style={styles.childHeading}>
                  {t("parent.child.heading", { n: i + 1 })}
                </Text>
                {complete ? (
                  <View style={styles.checkOn}>
                    <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={styles.checkOff} />
                )}
              </View>

              {/* Name — a labelled, boxed field that stays visible after typing,
                  with a gold highlight + "Required" tag while empty, so it can't
                  be overlooked (older users missed the old thin underline). */}
              <View style={styles.nameBlock}>
                <View style={styles.nameLabelRow}>
                  <Text style={styles.nameLabel}>{t("parent.child.nameLabel")}</Text>
                  {child.name.trim().length === 0 ? (
                    <View style={styles.requiredTag}>
                      <Text style={styles.requiredTagText}>
                        {t("parent.child.required")}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.nameBox,
                    child.name.trim().length === 0
                      ? styles.nameBoxEmpty
                      : styles.nameBoxFilled,
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={20}
                    color={child.name.trim().length === 0 ? "#D98E0A" : "#2D6A4F"}
                  />
                  <TextInput
                    style={styles.nameInput}
                    value={child.name}
                    onChangeText={(text) => setName(i, text)}
                    placeholder={t("parent.child.namePlaceholder")}
                    placeholderTextColor="#B58A3C"
                    returnKeyType="done"
                    accessibilityLabel={`Name for child ${i + 1}`}
                  />
                  {child.name.trim().length > 0 ? (
                    <MaterialIcons name="check-circle" size={20} color="#2D6A4F" />
                  ) : (
                    <MaterialIcons name="edit" size={18} color="#D98E0A" />
                  )}
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.eduScroll}
              >
                {LEVELS.map((lvl) => (
                  <SelectableCircle
                    key={lvl.key}
                    style={styles.eduItem}
                    size={56}
                    label={t(lvl.labelKey)}
                    labelStyle={styles.eduLabel}
                    selected={child.level === lvl.key}
                    color="#F4A923"
                    onPress={() => setLevel(i, lvl.key)}
                    accessibilityLabel={t(lvl.labelKey)}
                    renderIcon={({ size, color }) => (
                      <Ionicons name={lvl.icon} size={size} color={color} />
                    )}
                  />
                ))}
              </ScrollView>
            </View>
          );
        })}

        <Button
          label={t("common.continue")}
          variant="primary"
          disabled={!allComplete}
          onPress={goNext}
          style={styles.continue}
        />
      </ScrollView>

      {skipModal}
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
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { marginTop: 6, fontSize: 30, fontWeight: "800", color: "#111827" },
  subtitle: { marginTop: 8, fontSize: 16, lineHeight: 22, color: "#6B7280" },
  subtitleStrong: { color: "#374151", fontWeight: "600" },

  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    marginTop: 24,
  },
  stepBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0F1F3",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnDisabled: { opacity: 0.4 },
  counterCenter: { alignItems: "center", minWidth: 80 },
  counterNumber: { fontSize: 40, fontWeight: "800", color: "#111827", lineHeight: 46 },
  counterCaption: { marginTop: 2, fontSize: 14, color: "#6B7280" },

  card: {
    backgroundColor: "#F7F7F5",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F4A923",
    alignItems: "center",
    justifyContent: "center",
  },
  numberBadgeText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  childHeading: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  nameBlock: { marginBottom: 16 },
  nameLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  nameLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: "#6B7280",
  },
  requiredTag: {
    backgroundColor: "#FDECC8",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  requiredTagText: { fontSize: 11, fontWeight: "800", color: "#B26A00" },
  nameBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  nameBoxEmpty: { borderColor: "#F4A923", backgroundColor: "#FDF7E8" },
  nameBoxFilled: { borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" },
  nameInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    paddingVertical: 0,
  },
  checkOn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F4A923",
    alignItems: "center",
    justifyContent: "center",
  },
  checkOff: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "transparent",
  },
  eduScroll: { paddingVertical: 2, paddingRight: 8 },
  eduItem: { width: 88 },
  eduLabel: { fontSize: 12, lineHeight: 15 },

  continue: { marginTop: 32 },
});
