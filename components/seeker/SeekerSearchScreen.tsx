/**
 * Seeker (student/parent) SEARCH — find a tutor + Quick Match.
 *
 * Mirrors the tutor Search tab (text + advanced filters over the sample
 * `DIRECTORY`, trending tags, recent searches) but for seekers: each result's
 * action is Save (bookmark) instead of Connect, and a gold "Quick Match" card
 * sits on top of the resting state — it reads the seeker's onboarding picks and
 * surfaces the single best-fitting tutor (see `quickMatch.ts`).
 *
 * Sample data + English-only (see CLAUDE.md).
 */
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { loadSavedFilters, saveFilters } from "./filterStorage";
import { getQuickMatch } from "./quickMatch";
import { SaveButton } from "./SaveButton";
import { Avatar, Qualified } from "../tutor/feedUi";
import { activeCount, DEF_FILTERS, FilterSheet, passFilters, type Filters } from "../tutor/FilterSheet";
import { C, DIRECTORY, type FullTutor } from "../tutor/tutorData";

const TRENDING = ["#DSEmaths", "#IBchemistry", "#phonics", "#pianoHK", "#examtips"];

function QuickMatchCard({ onOpen, saved, onToggleSave }: { onOpen: (id: string) => void; saved: Set<string>; onToggleSave: (id: string) => void }) {
  const match = useMemo(() => getQuickMatch(), []);
  const t = match.tutor;
  return (
    <Pressable style={styles.qmCard} onPress={() => onOpen(t.id)} accessibilityRole="button">
      <View style={styles.qmKicker}>
        <Ionicons name="flash" size={14} color={C.goldD} />
        <Text style={styles.qmKickerText}>Quick Match</Text>
      </View>
      <View style={styles.qmBody}>
        <Avatar name={t.name} uri={t.avatarUrl} size={54} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={styles.qmName} numberOfLines={1}>
              {t.name}
            </Text>
            {t.qualified && <Qualified mini />}
          </View>
          <Text style={styles.qmReason} numberOfLines={1}>
            {match.reason}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
            <Ionicons name="star" size={13} color={C.gold} />
            <Text style={styles.qmMeta} numberOfLines={1}>
              {t.stats.rating} · {t.subject} · ${t.price}/hr
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.qmActions}>
        <View style={styles.qmViewBtn}>
          <Text style={styles.qmViewText}>View profile</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </View>
        <SaveButton saved={saved.has(t.id)} onToggle={() => onToggleSave(t.id)} variant="pill" />
      </View>
    </Pressable>
  );
}

function ResultRow({
  t,
  recent,
  saved,
  onToggleSave,
  onOpen,
  onRemove,
}: {
  t: FullTutor;
  recent?: boolean;
  saved: boolean;
  onToggleSave: () => void;
  onOpen: () => void;
  onRemove?: () => void;
}) {
  return (
    <Pressable onPress={onOpen} style={styles.row}>
      <Avatar name={t.name} uri={t.avatarUrl} size={48} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Text style={{ fontSize: 14.5, fontWeight: "700", color: C.ink }} numberOfLines={1}>
            {t.username}
          </Text>
          {t.qualified && <Qualified mini />}
        </View>
        <Text style={{ fontSize: 13, color: C.ink, marginTop: 1 }} numberOfLines={1}>
          {t.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 }}>
          <Ionicons name="star" size={13} color={C.gold} />
          <Text style={{ fontSize: 12, color: C.muted }} numberOfLines={1}>
            {t.stats.rating} · {t.subject} · {t.loc}
          </Text>
        </View>
      </View>
      {recent ? (
        <Pressable onPress={onRemove} hitSlop={8} style={styles.removeBtn}>
          <Ionicons name="close" size={18} color={C.unselIc} />
        </Pressable>
      ) : (
        <SaveButton saved={saved} onToggle={onToggleSave} />
      )}
    </Pressable>
  );
}

export function SeekerSearchScreen({
  saved,
  onToggleSave,
  onOpenProfile,
}: {
  saved: Set<string>;
  onToggleSave: (id: string) => void;
  onOpenProfile: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>(DEF_FILTERS());
  const [sheet, setSheet] = useState(false);
  const [recents, setRecents] = useState<string[]>(["chloe", "rachel", "jason"]);

  // Restore the seeker's saved filters on mount (persisted across restarts).
  useEffect(() => {
    let cancelled = false;
    loadSavedFilters().then((saved) => {
      if (!cancelled && saved) setFilters(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const fcount = activeCount(filters);
  const active = q.trim() !== "" || fcount > 0;

  const byQuery = (t: FullTutor) => {
    const k = q.trim().toLowerCase();
    return !k || [t.name, t.username, t.subject, t.school, t.loc].some((field) => field.toLowerCase().includes(k));
  };
  const results = useMemo(() => DIRECTORY.filter((t) => byQuery(t) && passFilters(t, filters)), [q, filters]);
  const sheetCount = (fl: Filters) => DIRECTORY.filter((t) => byQuery(t) && passFilters(t, fl)).length;

  const recentRecs = recents.map((id) => DIRECTORY.find((t) => t.id === id)).filter(Boolean) as FullTutor[];
  const removeRecent = (id: string) => setRecents((r) => r.filter((x) => x !== id));
  const pushRecent = (id: string) => setRecents((r) => [id, ...r.filter((x) => x !== id)].slice(0, 6));
  const openProfile = (id: string) => {
    pushRecent(id);
    onOpenProfile(id);
  };

  return (
    <>
      <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 }}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={22} color={C.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search tutors, subjects, schools…"
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
            <Text style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>Price, age, location, rating & more</Text>
          </View>
          {fcount > 0 && (
            <View style={styles.filterCount}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#fff" }}>{fcount}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={22} color={C.muted} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {!active ? (
          <>
            <QuickMatchCard onOpen={openProfile} saved={saved} onToggleSave={onToggleSave} />

            <View style={{ marginTop: 18, marginBottom: 18 }}>
              <Text style={styles.label}>Trending subjects</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
                {TRENDING.map((tag) => (
                  <Pressable key={tag} onPress={() => setQ(tag.replace("#", ""))} style={styles.trendChip}>
                    <Text style={{ color: C.greenD, fontSize: 13, fontWeight: "700" }}>{tag}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <Text style={styles.label}>Recently viewed</Text>
              {recentRecs.length > 0 && (
                <Pressable onPress={() => setRecents([])} hitSlop={8}>
                  <Text style={{ color: C.green, fontSize: 13, fontWeight: "700" }}>Clear</Text>
                </Pressable>
              )}
            </View>
            {recentRecs.length > 0 ? (
              recentRecs.map((t) => (
                <ResultRow
                  key={t.id}
                  t={t}
                  recent
                  saved={saved.has(t.id)}
                  onToggleSave={() => onToggleSave(t.id)}
                  onOpen={() => openProfile(t.id)}
                  onRemove={() => removeRecent(t.id)}
                />
              ))
            ) : (
              <View style={styles.empty}>
                <Ionicons name="time-outline" size={34} color={C.unselIc} />
                <Text style={{ fontSize: 13.5, marginTop: 8, color: C.muted }}>Tutors you view will appear here.</Text>
              </View>
            )}
          </>
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
                <Text style={{ fontSize: 13, marginTop: 4, color: C.muted }}>Try widening your filters.</Text>
                <Pressable onPress={() => setFilters(DEF_FILTERS())} style={styles.resetBtn}>
                  <Text style={{ fontSize: 13.5, fontWeight: "700", color: C.ink }}>Reset filters</Text>
                </Pressable>
              </View>
            ) : (
              results.map((t) => (
                <ResultRow
                  key={t.id}
                  t={t}
                  saved={saved.has(t.id)}
                  onToggleSave={() => onToggleSave(t.id)}
                  onOpen={() => openProfile(t.id)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      <FilterSheet
        visible={sheet}
        init={filters}
        count={sheetCount}
        onClose={() => setSheet(false)}
        onApply={(fl) => {
          setFilters(fl);
          saveFilters(fl); // persist across sessions
          setSheet(false);
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
  trendChip: { height: 34, paddingHorizontal: 13, borderRadius: 17, backgroundColor: C.greenTint, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.hairline },
  removeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
  resetBtn: { marginTop: 14, height: 38, paddingHorizontal: 18, borderRadius: 19, borderWidth: 1.5, borderColor: C.hairline, alignItems: "center", justifyContent: "center" },

  // Quick Match card
  qmCard: {
    marginTop: 6,
    backgroundColor: C.goldTint,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(217,142,10,0.25)",
    padding: 16,
  },
  qmKicker: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  qmKickerText: { color: C.goldD, fontSize: 12, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  qmBody: { flexDirection: "row", alignItems: "center", gap: 13 },
  qmName: { fontSize: 16, fontWeight: "800", color: C.ink, flexShrink: 1 },
  qmReason: { fontSize: 13, fontWeight: "700", color: C.greenD, marginTop: 2 },
  qmMeta: { fontSize: 12, color: C.muted, flexShrink: 1 },
  qmActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 15 },
  qmViewBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  qmViewText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
