import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import { getStored, setStored } from "../../components/onboarding/onboardingStore";

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

// Dark slate the "Others" circle fills with while its search is open.
const OTHERS_ACTIVE_COLOR = "#3F4A56";

// Extended, searchable subjects per category — IN ADDITION to the main subs
// above. These are only surfaced through the "Others" search. Colours are
// themed to each category; icons are reasonable MaterialCommunityIcons glyphs.
const EXTRA: Record<string, Sub[]> = {
  sports: [
    { id: "gymnastics", label: "Gymnastics", color: "#E76F51", icon: "gymnastics" },
    { id: "rugby", label: "Rugby", color: "#2A9D8F", icon: "rugby" },
    { id: "boxing", label: "Boxing", color: "#E63946", icon: "boxing-glove" },
    { id: "yoga", label: "Yoga", color: "#9B5DE5", icon: "yoga" },
    { id: "cycling", label: "Cycling", color: "#457B9D", icon: "bike" },
    { id: "golf", label: "Golf", color: "#588157", icon: "golf" },
    { id: "karate", label: "Karate", color: "#1A1A1A", icon: "karate" },
    { id: "skating", label: "Skating", color: "#F4A261", icon: "roller-skate" },
    { id: "climbing", label: "Climbing", color: "#6A4C93", icon: "terrain" },
    { id: "dance", label: "Dance", color: "#FF7F50", icon: "dance-ballroom" },
    { id: "cricket", label: "Cricket", color: "#06D6A0", icon: "cricket" },
    { id: "squash", label: "Squash", color: "#FB8500", icon: "racquetball" },
  ],
  academics: [
    { id: "geography", label: "Geography", color: "#3A86FF", icon: "earth" },
    { id: "economics", label: "Economics", color: "#2EC4B6", icon: "chart-line" },
    { id: "computer-science", label: "Computer Science", color: "#6A4C93", icon: "laptop" },
    { id: "accounting", label: "Accounting", color: "#2A9D8F", icon: "calculator" },
    { id: "psychology", label: "Psychology", color: "#7209B7", icon: "brain" },
    { id: "business-studies", label: "Business Studies", color: "#457B9D", icon: "briefcase" },
    { id: "literature", label: "Literature", color: "#8B5A2B", icon: "bookshelf" },
    { id: "statistics", label: "Statistics", color: "#06D6A0", icon: "chart-bar" },
    { id: "coding", label: "Coding", color: "#1A1A1A", icon: "code-tags" },
    { id: "philosophy", label: "Philosophy", color: "#588157", icon: "owl" },
  ],
  culinary: [
    { id: "korean-cuisine", label: "Korean Cuisine", color: "#C1121F", icon: "bowl-mix" },
    { id: "thai-cuisine", label: "Thai Cuisine", color: "#FF9F1C", icon: "chili-mild" },
    { id: "italian-cuisine", label: "Italian Cuisine", color: "#D62828", icon: "pasta" },
    { id: "cake-decorating", label: "Cake Decorating", color: "#FF85A1", icon: "cake-variant" },
    { id: "sushi-making", label: "Sushi Making", color: "#FA8072", icon: "rice" },
    { id: "coffee-barista", label: "Coffee/Barista", color: "#6F4E37", icon: "coffee" },
    { id: "vegan-cooking", label: "Vegan Cooking", color: "#80B918", icon: "sprout" },
    { id: "bbq", label: "BBQ", color: "#722F37", icon: "grill" },
    { id: "pastry", label: "Pastry", color: "#E6B89C", icon: "food-croissant" },
    { id: "dim-sum", label: "Dim Sum", color: "#D90429", icon: "noodles" },
  ],
  arts: [
    { id: "watercolor", label: "Watercolor", color: "#4CC9F0", icon: "palette" },
    { id: "sketching", label: "Sketching", color: "#4A4A4A", icon: "pencil" },
    { id: "animation", label: "Animation", color: "#9B5DE5", icon: "movie-open" },
    { id: "graphic-design", label: "Graphic Design", color: "#00B8A9", icon: "vector-square" },
    { id: "sewing", label: "Sewing", color: "#E63946", icon: "needle" },
    { id: "crochet", label: "Crochet", color: "#FF85A1", icon: "hook" },
    { id: "jewelry-making", label: "Jewelry Making", color: "#FFB703", icon: "diamond-stone" },
    { id: "sculpture", label: "Sculpture", color: "#C4A484", icon: "cube-outline" },
    { id: "comic-art", label: "Comic Art", color: "#2B2D42", icon: "book-open-variant" },
    { id: "embroidery", label: "Embroidery", color: "#722F37", icon: "scissors-cutting" },
  ],
  languages: [
    { id: "italian", label: "Italian", color: "#008C45", icon: "translate" },
    { id: "portuguese", label: "Portuguese", color: "#006600", icon: "translate" },
    { id: "thai", label: "Thai", color: "#A51931", icon: "translate" },
    { id: "vietnamese", label: "Vietnamese", color: "#DA251D", icon: "translate" },
    { id: "arabic", label: "Arabic", color: "#006C35", icon: "translate" },
    { id: "russian", label: "Russian", color: "#0039A6", icon: "translate" },
    { id: "hindi", label: "Hindi", color: "#FF9933", icon: "translate" },
    { id: "sign-language", label: "Sign Language", color: "#6A4C93", icon: "hand-wave" },
    { id: "dutch", label: "Dutch", color: "#F36C21", icon: "translate" },
    { id: "tagalog", label: "Tagalog", color: "#0038A8", icon: "translate" },
  ],
};

/** The MaterialCommunityIcons glyph for a subject (main subs + the extended
 * "Others" list). Custom user-typed subjects fall back to "tag". */
export function subIconFor(
  catId: string,
  subId: string,
): keyof typeof MaterialCommunityIcons.glyphMap {
  const cat = CATEGORIES.find((c) => c.id === catId);
  const pool = [...(cat?.subs ?? []), ...(EXTRA[catId] ?? [])];
  return pool.find((s) => s.id === subId)?.icon ?? "tag";
}

/** One chosen subject, as handed back through `onContinue`. */
export type Interest = {
  catId: string;
  subId: string;
  category?: string;
  label?: string;
  color?: string;
};

export type CategorySelectProps = {
  /** Main heading. Defaults to the student copy. */
  heading?: string;
  subtitle?: string;
  /** Optional gold banner shown above the heading (e.g. "Alex · Child 1 of 2"). */
  banner?: string;
  /** Progress bar fill, 0..1. */
  progress?: number;
  /** Pre-select these subjects (used when returning to edit). */
  initialValue?: Interest[] | null;
  /**
   * When set, the selection auto-saves to the shared in-memory store under this
   * key and re-seeds from it on mount — so picks survive navigating away and
   * back. Give each usage a unique, stable key (e.g. "tutor:interests"). When
   * omitted, the screen behaves as a plain controlled form (no persistence).
   */
  persistKey?: string;
  /** Label for the Continue button. */
  continueLabel?: string;
  /** Called with the chosen subjects when Continue is tapped. */
  onContinue: (interests: Interest[]) => void;
  /** Optional Skip handler; the Skip link is hidden when omitted. */
  onSkip?: () => void;
  /** Optional Back handler for grid mode; defaults to router.back(). */
  onBack?: () => void;
};

/**
 * The reusable, props-driven core. Each role gets its own thin route file that
 * renders this with its own heading / banner (see StudentCatSel below).
 */
export function CategorySelect({
  heading = "What are you interested in?",
  subtitle = "Pick a category to explore subjects.",
  banner,
  progress = 0.66,
  initialValue,
  persistKey,
  continueLabel = "Continue",
  onContinue,
  onSkip,
  onBack,
}: CategorySelectProps) {
  // Seed once: prefer anything saved under persistKey, else the initialValue.
  const [seed] = useState<Interest[]>(() =>
    persistKey ? getStored<Interest[]>(persistKey, initialValue ?? []) : initialValue ?? [],
  );

  const [view, setView] = useState<"grid" | "subs">("grid");
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  // Composite keys "<catId>:<subId>" of every chosen subcategory.
  const [selected, setSelected] = useState<Set<string>>(() => {
    const s = new Set<string>();
    seed.forEach((it) => {
      if (it.catId && it.subId) s.add(`${it.catId}:${it.subId}`);
    });
    return s;
  });
  // "Others" search: whether the bar is open and the current query.
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  // User-typed custom subjects per category — session only, NO backend.
  const [customSubs, setCustomSubs] = useState<Record<string, Sub[]>>(() => {
    // Rebuild any user-typed ("custom-…") subjects so they render on re-entry.
    const cs: Record<string, Sub[]> = {};
    seed.forEach((it) => {
      if (it.catId && it.subId && it.subId.startsWith("custom-")) {
        if (!cs[it.catId]) cs[it.catId] = [];
        cs[it.catId].push({
          id: it.subId,
          label: it.label ?? "Custom",
          color: it.color ?? "#2D6A4F",
          icon: "tag",
        });
      }
    });
    return cs;
  });

  const keyFor = (catId: string, subId: string) => `${catId}:${subId}`;
  const totalCount = selected.size;

  // Everything selectable in a category: main subs + extended list + customs.
  const subsForCat = (catId: string): Sub[] => {
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (!cat) return [];
    return [...cat.subs, ...(EXTRA[catId] ?? []), ...(customSubs[catId] ?? [])];
  };
  const findSub = (catId: string, subId: string) =>
    subsForCat(catId).find((s) => s.id === subId);

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

  // Select without toggling (used when suggesting an already-existing subject).
  const selectSub = (catId: string, subId: string) => {
    setSelected((prev) => new Set(prev).add(keyFor(catId, subId)));
  };

  const openCategory = (catId: string) => {
    setActiveCatId(catId);
    setView("subs");
    // Each category starts with search closed and empty.
    setSearchOpen(false);
    setQuery("");
  };

  const activeCat = CATEGORIES.find((c) => c.id === activeCatId) ?? null;

  // Toggle the "Others" search bar. Closing clears the query; selections persist.
  const toggleSearch = () => {
    setSearchOpen((open) => {
      if (open) setQuery("");
      return !open;
    });
  };

  // "Suggest a new category": add exactly what was typed as a selected custom
  // subject — unless it already exists in this category, in which case just
  // select the existing one (no duplicate). Session state only, NO backend.
  const handleSuggest = () => {
    const typed = query.trim();
    if (!activeCat || typed.length < 2) return;
    const existing = subsForCat(activeCat.id).find(
      (s) => s.label.toLowerCase() === typed.toLowerCase(),
    );
    if (existing) {
      selectSub(activeCat.id, existing.id);
      return;
    }
    const id = `custom-${Date.now()}`;
    const newSub: Sub = { id, label: typed, color: activeCat.color, icon: "tag" };
    setCustomSubs((prev) => ({
      ...prev,
      [activeCat.id]: [...(prev[activeCat.id] ?? []), newSub],
    }));
    selectSub(activeCat.id, id);
  };

  // Search results once 2+ chars are typed. Search EVERY subject in the
  // category — the main grid subs, the extended list, AND customs — so the
  // main subcategories also surface here and stay in sync with the grid (they
  // share the same selection key, so toggling either side updates both).
  const trimmedQuery = query.trim();
  const isSearching = searchOpen && trimmedQuery.length >= 2;
  const results =
    isSearching && activeCat
      ? subsForCat(activeCat.id).filter((s) =>
          s.label.toLowerCase().includes(trimmedQuery.toLowerCase()),
        )
      : [];
  const noMatch = isSearching && results.length === 0;

  // Extended / custom subjects that were selected via Others and are NOT one of
  // the default main-grid rows. These surface in a top section above a divider.
  const othersSelected = activeCat
    ? [...(EXTRA[activeCat.id] ?? []), ...(customSubs[activeCat.id] ?? [])].filter(
        (s) => selected.has(keyFor(activeCat.id, s.id)),
      )
    : [];
  // A divider sits above the main grid when search is open OR the top section shows.
  const hasDividerAbove = searchOpen || othersSelected.length > 0;

  // Back chevron: subcategory mode returns to the grid; grid mode hands off to
  // the supplied onBack (or leaves the screen).
  const handleBackPress = () => {
    if (view === "subs") setView("grid");
    else if (onBack) onBack();
    else router.back();
  };

  // Build the chosen subjects from the current selection, resolving labels and
  // colours across main subs, the extended list, and custom subjects.
  const toInterests = (): Interest[] =>
    [...selected].map((k) => {
      const [catId, subId] = k.split(":");
      const cat = CATEGORIES.find((c) => c.id === catId);
      const sub = findSub(catId, subId);
      return {
        catId,
        subId,
        category: cat?.label,
        label: sub?.label,
        color: sub?.color,
      };
    });

  // Auto-save the selection to the shared store on every change, so picks are
  // never lost when the user navigates away (and the screen is later rebuilt).
  useEffect(() => {
    if (!persistKey) return;
    setStored<Interest[]>(persistKey, toInterests());
  }, [persistKey, selected, customSubs]);

  // Continue / Skip: hand the chosen subjects to the next screen.
  const goNext = () => onContinue(toInterests());

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
        <Pressable hitSlop={8} onPress={handleBackPress} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </Pressable>
        {onSkip ? (
          <Pressable hitSlop={8} onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip">
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : (
          <View />
        )}
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

            {/* "Selected via Others": extended / custom picks that aren't one of
                the default rows. Shown above a divider when search is closed. */}
            {!searchOpen && othersSelected.length > 0 ? (
              <>
                <View style={styles.othersGrid}>
                  {othersSelected.map((sub) => (
                    <SelectableCircle
                      key={sub.id}
                      style={styles.gridItem}
                      label={sub.label}
                      selected
                      color={sub.color}
                      onPress={() => toggleSub(activeCat.id, sub.id)}
                      renderIcon={({ size, color }) => (
                        <MaterialCommunityIcons name={sub.icon} size={size} color={color} />
                      )}
                    />
                  ))}
                </View>
                <View style={styles.searchDivider} />
              </>
            ) : null}

            {/* "Others" search — opens above the grid; the grid stays visible. */}
            {searchOpen ? (
              <>
                <View style={styles.searchBar}>
                  <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.searchInput}
                    value={query}
                    onChangeText={setQuery}
                    placeholder={`Search for ${activeCat.label.toLowerCase()}…`}
                    placeholderTextColor="#9CA3AF"
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    accessibilityLabel={`Search ${activeCat.label}`}
                  />
                  {query.length > 0 ? (
                    <Pressable
                      hitSlop={8}
                      onPress={() => setQuery("")}
                      accessibilityRole="button"
                      accessibilityLabel="Clear search text"
                    >
                      <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
                    </Pressable>
                  ) : null}
                </View>

                {/* Empty query: preview the subjects already picked via Others,
                    lit up and tappable to deselect. Typing 2+ chars filters as
                    normal (below) and replaces this preview. */}
                {!isSearching && othersSelected.length > 0 ? (
                  <View style={styles.resultsGrid}>
                    {othersSelected.map((sub) => (
                      <SelectableCircle
                        key={sub.id}
                        style={styles.gridItem}
                        label={sub.label}
                        selected
                        color={sub.color}
                        onPress={() => toggleSub(activeCat.id, sub.id)}
                        renderIcon={({ size, color }) => (
                          <MaterialCommunityIcons name={sub.icon} size={size} color={color} />
                        )}
                      />
                    ))}
                  </View>
                ) : null}

                {/* Matching extended / custom subjects (2+ chars). */}
                {results.length > 0 ? (
                  <View style={styles.resultsGrid}>
                    {results.map((sub) => (
                      <SelectableCircle
                        key={sub.id}
                        style={styles.gridItem}
                        label={sub.label}
                        selected={selected.has(keyFor(activeCat.id, sub.id))}
                        color={sub.color}
                        onPress={() => toggleSub(activeCat.id, sub.id)}
                        renderIcon={({ size, color }) => (
                          <MaterialCommunityIcons name={sub.icon} size={size} color={color} />
                        )}
                      />
                    ))}
                  </View>
                ) : null}

                {/* No match → let them add exactly what they typed. */}
                {noMatch ? (
                  <View style={styles.noMatch}>
                    <Text style={styles.noMatchText}>
                      Can't find what you're looking for?
                    </Text>
                    <Button
                      label="Suggest a new category"
                      variant="tint"
                      onPress={handleSuggest}
                      style={styles.suggestBtn}
                      icon={<MaterialCommunityIcons name="plus" size={18} color="#2D6A4F" />}
                    />
                  </View>
                ) : null}

                <View style={styles.searchDivider} />
              </>
            ) : null}

            <View style={[styles.grid, hasDividerAbove && styles.gridSearchOpen]}>
              {activeCat.subs.map((sub) => (
                <SelectableCircle
                  key={sub.id}
                  style={styles.gridItem}
                  label={sub.label}
                  selected={selected.has(keyFor(activeCat.id, sub.id))}
                  color={sub.color}
                  onPress={() => toggleSub(activeCat.id, sub.id)}
                  renderIcon={({ size, color }) => (
                    <MaterialCommunityIcons name={sub.icon} size={size} color={color} />
                  )}
                />
              ))}

              {/* "Others": toggles the search bar; lit dark while search is open. */}
              <SelectableCircle
                style={styles.gridItem}
                label="Others"
                selected={searchOpen}
                color={OTHERS_ACTIVE_COLOR}
                onPress={toggleSearch}
                accessibilityLabel={searchOpen ? "Close search" : "Search for more"}
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
          label={continueLabel}
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
  const toPrefs = (interests: Interest[]) =>
    router.push({
      pathname: "/onboarding/StudentPrefs",
      params: {
        ...(educationLevel ? { educationLevel } : {}),
        interests: JSON.stringify(interests),
      },
    });
  return (
    <CategorySelect
      heading="What are you interested in?"
      subtitle="Pick a category to explore subjects."
      persistKey="student:interests"
      onContinue={toPrefs}
      onSkip={() => toPrefs([])}
      onBack={() => router.back()}
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F4F4F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    marginTop: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0, // keep the row at its intended 48pt height
  },
  // Search results left-align (a single hit sits in the first column).
  resultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 24,
    marginTop: 18,
  },
  // "Selected via Others" top section — same left-aligned wrap as results.
  othersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 24,
    marginTop: 14,
  },
  noMatch: { alignItems: "center", marginTop: 18 },
  noMatchText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  suggestBtn: {
    height: 38,
    paddingHorizontal: 16,
    alignSelf: "center",
    marginTop: 12,
  },
  searchDivider: { height: 1, backgroundColor: "#ECECEC", marginTop: 16 },
  // Tighten the grid's top gap when it sits below the search divider.
  gridSearchOpen: { marginTop: 16 },
  backToCats: { marginTop: 24 },
  continue: { marginTop: 24 },
});
