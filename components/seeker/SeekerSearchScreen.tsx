/**
 * Seeker (student/parent) SEARCH — find a real tutor.
 *
 * Now wired to the backend: GET /api/tutors with the FilterSheet's structured
 * filters (price / age / lesson mode / district / gender → query params). The
 * backend has no free-text search, so the typed query narrows the fetched cards
 * client-side (by name / slug / subject). Each result's action is Save (bookmark,
 * → /api/saved); tapping a result opens the real public profile by slug.
 *
 * The rating / years / sessions / followers sliders are hidden here (the backend
 * doesn't support them yet — see FilterSheet `hideUnsupported`).
 */
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { filtersToSearchParams } from "./searchFilters";
import { loadSavedFilters, saveFilters } from "./filterStorage";
import { SaveButton } from "./SaveButton";
import { SeekerResultsList } from "./SeekerResultsList";
import { SearchModeToggle, type SearchMode } from "./SearchModeToggle";
import { Avatar } from "../tutor/feedUi";
import { activeCount, DEF_FILTERS, FilterSheet, type Filters } from "../tutor/FilterSheet";
import { C } from "../tutor/tutorData";
import { subdistrictsLabel } from "../onboarding/hkDistricts";
import { ApiError, searchTutors, type BrowseTutorCard } from "../../lib/api";

// "jane-doe" → "Jane Doe" when a card has no display_name (guest / unnamed).
function slugToName(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
function cardName(t: BrowseTutorCard): string {
  return t.display_name?.trim() || slugToName(t.slug);
}
function subtitle(t: BrowseTutorCard): string {
  const subject = t.categories[0]?.name_en;
  const loc = subdistrictsLabel(t.subdistricts);
  return [subject, loc].filter(Boolean).join(" · ");
}

function ResultRow({
  t,
  saved,
  onToggleSave,
  onOpen,
}: {
  t: BrowseTutorCard;
  saved: boolean;
  onToggleSave: () => void;
  onOpen: () => void;
}) {
  const name = cardName(t);
  const sub = subtitle(t);
  return (
    <Pressable onPress={onOpen} style={styles.row}>
      <Avatar name={name} uri={t.avatar_url ?? undefined} size={48} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 14.5, fontWeight: "700", color: C.ink }} numberOfLines={1}>
          {name}
        </Text>
        {!!sub && (
          <Text style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }} numberOfLines={1}>
            {sub}
          </Text>
        )}
      </View>
      <SaveButton saved={saved} onToggle={onToggleSave} />
    </Pressable>
  );
}

export function SeekerSearchScreen({
  saved,
  onToggleSave,
  onOpenProfile,
}: {
  saved: Set<string>;
  onToggleSave: (slug: string) => void;
  onOpenProfile: (slug: string) => void;
}) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<SearchMode>("tutors");
  const [filters, setFilters] = useState<Filters>(DEF_FILTERS());
  const [sheet, setSheet] = useState(false);
  const [tutors, setTutors] = useState<BrowseTutorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch real tutors for the given filters (server-side dimensions only).
  const load = useCallback((f: Filters) => {
    setLoading(true);
    setError(false);
    searchTutors(filtersToSearchParams(f))
      .then((res) => setTutors(res.tutors))
      .catch((e) => {
        // A network error (backend down) is the only "real" failure; an empty/4xx
        // shouldn't normally happen for a public browse. Show the error state.
        setError(e instanceof ApiError);
        setTutors([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Restore saved filters on mount, then do the first fetch with them.
  useEffect(() => {
    let cancelled = false;
    loadSavedFilters().then((saved) => {
      if (cancelled) return;
      const f = saved ?? DEF_FILTERS();
      setFilters(f);
      load(f);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const fcount = activeCount(filters);

  // Text query narrows the fetched cards client-side (the backend has no text search).
  const results = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return tutors;
    return tutors.filter((t) =>
      [cardName(t), t.slug, ...(t.categories ?? []).map((c) => c.name_en)]
        .some((field) => field.toLowerCase().includes(k)),
    );
  }, [q, tutors]);

  return (
    <>
      <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 }}>
        <View style={{ marginBottom: 11 }}>
          <SearchModeToggle mode={mode} onChange={setMode} />
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={22} color={C.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={mode === "students" ? "Search students, subjects…" : "Search tutors, subjects…"}
            placeholderTextColor={C.unselIc}
            style={styles.searchInput}
          />
          {!!q && (
            <Pressable onPress={() => setQ("")} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={C.unselIc} />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => setSheet(true)}
          style={[styles.filterBtn, { borderColor: fcount ? C.green : C.hairline, backgroundColor: fcount ? C.greenTint : "#fff" }]}
        >
          <Ionicons name="options-outline" size={21} color={fcount ? C.greenD : C.ink} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14.5, fontWeight: "700", color: fcount ? C.greenD : C.ink }}>Advanced search filters</Text>
            <Text style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>Price, age, location, lesson mode & gender</Text>
          </View>
          {fcount > 0 && (
            <View style={styles.filterCount}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#fff" }}>{fcount}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={22} color={C.muted} />
        </Pressable>
      </View>

      {mode === "students" ? (
        <SeekerResultsList query={q} locations={filters.locations} onOpen={(id) => router.push(`/seekers/${id}` as Href)} />
      ) : (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color={C.green} />
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Ionicons name="cloud-offline-outline" size={38} color={C.unselIc} />
            <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 10, color: C.muted }}>Couldn&apos;t load tutors</Text>
            <Pressable onPress={() => load(filters)} style={styles.resetBtn}>
              <Text style={{ fontSize: 13.5, fontWeight: "700", color: C.ink }}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[styles.label, { marginTop: 4, marginBottom: 6 }]}>
              {results.length} tutor{results.length === 1 ? "" : "s"}
              {fcount > 0 ? ` · ${fcount} filter${fcount === 1 ? "" : "s"}` : ""}
            </Text>
            {results.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="search" size={40} color={C.unselIc} />
                <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 10, color: C.muted }}>No tutors match</Text>
                <Text style={{ fontSize: 13, marginTop: 4, color: C.muted }}>Try a different search or widen your filters.</Text>
                {fcount > 0 && (
                  <Pressable
                    onPress={() => {
                      const d = DEF_FILTERS();
                      setFilters(d);
                      saveFilters(d);
                      load(d);
                    }}
                    style={styles.resetBtn}
                  >
                    <Text style={{ fontSize: 13.5, fontWeight: "700", color: C.ink }}>Reset filters</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              results.map((t) => (
                <ResultRow
                  key={t.slug}
                  t={t}
                  saved={saved.has(t.slug)}
                  onToggleSave={() => onToggleSave(t.slug)}
                  onOpen={() => onOpenProfile(t.slug)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
      )}

      <FilterSheet
        visible={sheet}
        init={filters}
        hideUnsupported
        count={() => results.length}
        onClose={() => setSheet(false)}
        onApply={(fl) => {
          setFilters(fl);
          saveFilters(fl); // persist across sessions
          setSheet(false);
          load(fl); // refetch from the backend with the new filters
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    height: 44,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.hairline,
    borderRadius: 14,
    paddingHorizontal: 13,
  },
  searchInput: { flex: 1, fontSize: 15.5, color: C.ink, padding: 0 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    height: 48,
    marginTop: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  filterCount: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: C.green, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 13, fontWeight: "600", letterSpacing: 0.3, color: C.muted, textTransform: "uppercase" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.hairline },
  stateWrap: { paddingVertical: 48, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
  resetBtn: { marginTop: 14, height: 38, paddingHorizontal: 18, borderRadius: 19, borderWidth: 1.5, borderColor: C.hairline, alignItems: "center", justifyContent: "center" },
});
