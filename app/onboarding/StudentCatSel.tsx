import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "../../components/ui/Button";
import { SelectableCircle } from "../../components/ui/SelectableCircle";

/**
 * Interest / category selection — ONE screen with two display modes:
 *
 *  - "grid": the five top-level categories. Tapping one switches to…
 *  - "subs": that category's subcategories (multi-select).
 *
 * The top bar (back chevron + Skip), progress bar and Continue button stay in
 * place across both modes; only the middle swaps.
 *
 * Built to be shared by all three onboarding roles (student / parent / tutor):
 * `heading`, `subtitle` and an optional `banner` are props. The selection is
 * kept in local state and passed FORWARD as a route param — no backend write
 * (see CLAUDE.md data rules).
 *
 * The category lit-up colours are my pick (the spec left this to me):
 *   Sports → orange, Academics → blue, Culinary → red, Arts & Crafts → purple,
 *   Languages → Forest Green (keeps it on-brand and distinct from Culinary red).
 * Subcategory selected-state colours are the exact values from the spec.
 */

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type Sub = { id: string; label: string; color: string; icon: IconName };
type Category = {
  id: string;
  label: string;
  /** Lit-up colour for the category circle in grid mode. */
  color: string;
  icon: IconName;
  subs: Sub[];
};

const CATEGORIES: Category[] = [
  {
    id: "sports",
    label: "Sports",
    color: "#FF6B35",
    icon: "basketball",
    subs: [
      { id: "basketball", label: "Basketball", color: "#FF6B35", icon: "basketball" },
      { id: "soccer", label: "Soccer", color: "#1A1A1A", icon: "soccer" },
      { id: "volleyball", label: "Volleyball", color: "#FFD93D", icon: "volleyball" },
      { id: "badminton", label: "Badminton", color: "#E63946", icon: "badminton" },
      { id: "swimming", label: "Swimming", color: "#4CC9F0", icon: "swim" },
      { id: "tennis", label: "Tennis", color: "#7CB518", icon: "tennis" },
      { id: "table-tennis", label: "Table Tennis", color: "#D90429", icon: "table-tennis" },
      { id: "running", label: "Running", color: "#FF7F50", icon: "run" },
    ],
  },
  {
    id: "academics",
    label: "Academics",
    color: "#3A86FF",
    icon: "school",
    subs: [
      { id: "mathematics", label: "Mathematics", color: "#3A86FF", icon: "calculator-variant" },
      { id: "english", label: "English", color: "#E63946", icon: "alphabetical-variant" },
      { id: "chinese", label: "Chinese", color: "#FFB703", icon: "translate" },
      { id: "science", label: "Science", color: "#2EC4B6", icon: "flask" },
      { id: "physics", label: "Physics", color: "#7209B7", icon: "lightning-bolt" },
      { id: "chemistry", label: "Chemistry", color: "#06D6A0", icon: "beaker-outline" },
      { id: "biology", label: "Biology", color: "#588157", icon: "microscope" },
      { id: "history", label: "History", color: "#8B5A2B", icon: "script-text" },
    ],
  },
  {
    id: "culinary",
    label: "Culinary",
    color: "#C1121F",
    icon: "silverware-fork-knife",
    subs: [
      { id: "baking", label: "Baking", color: "#E6B89C", icon: "food-croissant" },
      { id: "chinese-cuisine", label: "Chinese Cuisine", color: "#C1121F", icon: "noodles" },
      { id: "western-cuisine", label: "Western Cuisine", color: "#722F37", icon: "silverware-fork-knife" },
      { id: "japanese-cuisine", label: "Japanese Cuisine", color: "#FA8072", icon: "fish" },
      { id: "desserts", label: "Desserts", color: "#FF85A1", icon: "cupcake" },
      { id: "healthy-cooking", label: "Healthy Cooking", color: "#80B918", icon: "leaf" },
      { id: "kids-cooking", label: "Kids Cooking", color: "#FF9F1C", icon: "baby-face-outline" },
      { id: "vegetarian", label: "Vegetarian", color: "#606C38", icon: "food-apple" },
    ],
  },
  {
    id: "arts",
    label: "Arts & Crafts",
    color: "#9B5DE5",
    icon: "palette",
    subs: [
      { id: "drawing", label: "Drawing", color: "#4A4A4A", icon: "draw" },
      { id: "painting", label: "Painting", color: "#E63946", icon: "brush" },
      { id: "pottery", label: "Pottery", color: "#C4A484", icon: "pot-mix" },
      { id: "origami", label: "Origami", color: "#F5F5F5", icon: "shape-outline" },
      { id: "knitting", label: "Knitting", color: "#9B5DE5", icon: "tshirt-crew" },
      { id: "calligraphy", label: "Calligraphy", color: "#1A1A1A", icon: "fountain-pen" },
      { id: "photography", label: "Photography", color: "#2B2D42", icon: "camera" },
      { id: "digital-art", label: "Digital Art", color: "#00F5D4", icon: "checkerboard" },
    ],
  },
  {
    id: "languages",
    label: "Languages",
    color: "#2D6A4F",
    icon: "earth",
    subs: [
      { id: "english", label: "English", color: "#C8102E", icon: "translate" },
      { id: "mandarin", label: "Mandarin", color: "#DE2910", icon: "translate" },
      { id: "cantonese", label: "Cantonese", color: "#DE2910", icon: "translate" },
      { id: "japanese", label: "Japanese", color: "#BC002D", icon: "translate" },
      { id: "korean", label: "Korean", color: "#003478", icon: "translate" },
      { id: "french", label: "French", color: "#002395", icon: "translate" },
      { id: "spanish", label: "Spanish", color: "#C60B1E", icon: "translate" },
      { id: "german", label: "German", color: "#FFCC00", icon: "translate" },
    ],
  },
];

export type CategorySelectProps = {
  /** Main heading. Defaults to the student copy. */
  heading?: string;
  subtitle?: string;
  /** Optional gold banner shown above the heading (e.g. "Selecting for Child 2 of 3"). */
  banner?: string;
  /** Carried forward to the next screen untouched. */
  educationLevel?: string;
  /** Progress bar fill, 0..1. */
  progress?: number;
};

/**
 * The reusable, props-driven core. Each role gets its own thin route file that
 * renders this with its own heading / banner (see StudentCatSel below).
 */
export function CategorySelect({
  heading = "What are you interested in?",
  subtitle = "Pick a category to explore subjects.",
  banner,
  educationLevel,
  progress = 0.66,
}: CategorySelectProps) {
  const [view, setView] = useState<"grid" | "subs">("grid");
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  // Composite keys "<catId>:<subId>" of every chosen subcategory.
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const keyFor = (catId: string, subId: string) => `${catId}:${subId}`;
  const totalCount = selected.size;

  const countForCat = (catId: string) => {
    let n = 0;
    selected.forEach((k) => {
      if (k.startsWith(`${catId}:`)) n += 1;
    });
    return n;
  };

  const toggleSub = (catId: string, subId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const k = keyFor(catId, subId);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const openCategory = (catId: string) => {
    setActiveCatId(catId);
    setView("subs");
  };

  const activeCat = CATEGORIES.find((c) => c.id === activeCatId) ?? null;

  // Back chevron: subcategory mode returns to the grid; grid mode leaves the screen.
  const onBack = () => {
    if (view === "subs") setView("grid");
    else router.back();
  };

  // Continue / Skip: serialise the selection and hand it to the next screen.
  // (No backend write — placeholder route just echoes what was passed.)
  const goNext = () => {
    const interests = [...selected].map((k) => {
      const [catId, subId] = k.split(":");
      const cat = CATEGORIES.find((c) => c.id === catId);
      const sub = cat?.subs.find((s) => s.id === subId);
      return {
        catId,
        subId,
        category: cat?.label,
        label: sub?.label,
        color: sub?.color,
      };
    });
    router.push({
      pathname: "/onboarding/category",
      params: {
        ...(educationLevel ? { educationLevel } : {}),
        interests: JSON.stringify(interests),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Progress bar — stays across both modes. */}
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]}
        />
      </View>

      {/* Top bar — stays across both modes. */}
      <View style={styles.headerRow}>
        <Pressable hitSlop={8} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </Pressable>
        <Pressable hitSlop={8} onPress={goNext} accessibilityRole="button" accessibilityLabel="Skip">
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {banner ? (
          <View style={styles.banner}>
            <MaterialCommunityIcons name="account-child" size={18} color="#8A6D1A" />
            <Text style={styles.bannerText}>{banner}</Text>
          </View>
        ) : null}

        {view === "grid" ? (
          /* ---- Mode 1: category grid ---- */
          <>
            <Text style={styles.title}>{heading}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.grid}>
              {CATEGORIES.map((cat) => {
                const n = countForCat(cat.id);
                return (
                  <SelectableCircle
                    key={cat.id}
                    style={styles.gridItem}
                    label={cat.label}
                    selected={n > 0}
                    color={cat.color}
                    badge={n}
                    badgeColor={cat.color}
                    onPress={() => openCategory(cat.id)}
                    accessibilityLabel={`${cat.label}${n > 0 ? `, ${n} selected` : ""}`}
                    renderIcon={({ size, color }) => (
                      <MaterialCommunityIcons name={cat.icon} size={size} color={color} />
                    )}
                  />
                );
              })}
            </View>

            {totalCount > 0 ? (
              <Text style={styles.countNote}>
                {totalCount} {totalCount > 1 ? "subjects" : "subject"} selected
              </Text>
            ) : null}
          </>
        ) : activeCat ? (
          /* ---- Mode 2: subcategory grid for the tapped category ---- */
          <>
            <View style={styles.subsHeader}>
              <View style={[styles.subsHeaderDot, { backgroundColor: activeCat.color }]}>
                <MaterialCommunityIcons name={activeCat.icon} size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.subsTitle}>{activeCat.label}</Text>
            </View>

            <View style={styles.grid}>
              {activeCat.subs.map((sub) => {
                const isSel = selected.has(keyFor(activeCat.id, sub.id));
                return (
                  <SelectableCircle
                    key={sub.id}
                    style={styles.gridItem}
                    label={sub.label}
                    selected={isSel}
                    color={sub.color}
                    onPress={() => toggleSub(activeCat.id, sub.id)}
                    renderIcon={({ size, color }) => (
                      <MaterialCommunityIcons name={sub.icon} size={size} color={color} />
                    )}
                  />
                );
              })}

              {/* "Others": placeholder only — search behaviour comes in a later step. */}
              <SelectableCircle
                style={styles.gridItem}
                label="Others"
                selected={false}
                color="#E5E7EB"
                accessibilityLabel="Others (coming soon)"
                renderIcon={({ size, color }) => (
                  <MaterialCommunityIcons name="magnify" size={size} color={color} />
                )}
              />
            </View>

            <Button
              label="Back to categories"
              variant="ghost"
              onPress={() => setView("grid")}
              style={styles.backToCats}
              icon={<MaterialCommunityIcons name="view-grid-outline" size={20} color="#111827" />}
            />
          </>
        ) : null}

        {/* Continue — stays across both modes; disabled until something is picked. */}
        <Button
          label="Continue"
          variant="primary"
          disabled={totalCount === 0}
          onPress={goNext}
          style={styles.continue}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Student route. Reads the education level passed in from the previous step and
 * forwards it; uses the student heading and no banner for now.
 */
export default function StudentCatSel() {
  const { educationLevel } = useLocalSearchParams<{ educationLevel?: string }>();
  return (
    <CategorySelect
      heading="What are you interested in?"
      subtitle="Pick a category to explore subjects."
      educationLevel={educationLevel}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  progressTrack: { height: 4, backgroundColor: "#E5E7EB", width: "100%" },
  progressFill: { height: 4, backgroundColor: "#2D6A4F" }, // Primary / Forest Green
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    paddingHorizontal: 24,
  },
  skip: { fontSize: 17, fontWeight: "600", color: "#6B7280" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 32 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FDF3DC", // gold tint
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  bannerText: { color: "#8A6D1A", fontSize: 13.5, fontWeight: "700" },
  title: {
    marginTop: 10,
    // 26 (matching the subcategory headers) keeps the heading on one line.
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 32,
  },
  subtitle: { marginTop: 12, fontSize: 16, color: "#6B7280" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    // Centre cells so a partial last row (e.g. the 2-item second row in mode 1)
    // straddles the gaps instead of hanging off the left. Full rows are
    // unaffected (no spare space to distribute).
    justifyContent: "center",
    rowGap: 24,
    marginTop: 28,
  },
  // Three columns.
  gridItem: { width: "33.333%" },
  countNote: {
    marginTop: 28,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  subsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: 2,
  },
  subsHeaderDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  subsTitle: { fontSize: 26, fontWeight: "800", color: "#111827" },
  backToCats: { marginTop: 24 },
  continue: { marginTop: 24 },
});
