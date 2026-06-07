import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
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

const LEVELS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "kindergarten", label: "Kindergarten", icon: "happy" },
  { key: "primary", label: "Primary", icon: "pencil" },
  { key: "middle", label: "Middle School", icon: "book" },
  { key: "high", label: "High School", icon: "school" },
  { key: "university", label: "University", icon: "library" },
  { key: "adult", label: "Adult / Pro", icon: "briefcase" },
];

const MIN_CHILDREN = 1;
const MAX_CHILDREN = 6;
const PROGRESS = 0.33; // first of three parent steps

export default function ParentNumChild() {
  const [children, setChildren] = useState<Child[]>([
    { name: "", level: null },
    { name: "", level: null },
  ]);
  const count = children.length;

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
          onPress={() => router.push("/feed")}
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
        <Text style={styles.title}>Your children</Text>
        <Text style={styles.subtitle}>
          Set each child&apos;s education level.{" "}
          <Text style={styles.subtitleStrong}>You can edit this later.</Text>
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
              {count === 1 ? "child" : "children"}
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

                <View style={styles.nameField}>
                  <TextInput
                    style={styles.nameInput}
                    value={child.name}
                    onChangeText={(t) => setName(i, t)}
                    placeholder={`Click here to add name for Child ${i + 1}`}
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="done"
                    accessibilityLabel={`Name for child ${i + 1}`}
                  />
                  {child.name.trim().length > 0 ? (
                    <MaterialIcons name="edit" size={16} color="#9CA3AF" />
                  ) : null}
                </View>

                {complete ? (
                  <View style={styles.checkOn}>
                    <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={styles.checkOff} />
                )}
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
                    label={lvl.label}
                    labelStyle={styles.eduLabel}
                    selected={child.level === lvl.key}
                    color="#F4A923"
                    onPress={() => setLevel(i, lvl.key)}
                    accessibilityLabel={`${lvl.label} for child ${i + 1}`}
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
          label="Continue"
          variant="primary"
          disabled={!allComplete}
          onPress={goNext}
          style={styles.continue}
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
  nameField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 12,
    marginRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 4,
  },
  nameInput: {
    flex: 1,
    fontSize: 14,
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
