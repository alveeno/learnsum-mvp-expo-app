/**
 * Seeker (student/parent) search results — the "Students" mode of the Search
 * tabs. Queries GET /api/seekers (public seekers only) and renders cards; tapping
 * one opens the seeker profile (/seekers/[id], itself gated server-side). Used by
 * both the seeker and tutor Search screens.
 *
 * Backend respects the seeker's privacy toggles: a seeker who hid their personal
 * info comes back as a minimal card ("Student"/"Parent", no name/level).
 */
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar } from "../tutor/feedUi";
import { C } from "../tutor/tutorData";
import { ApiError, searchSeekers, type SeekerCard } from "../../lib/api";

const LEVEL_LABEL: Record<string, string> = {
  kindergarten: "Kindergarten",
  primary: "Primary",
  middle: "Junior Sec",
  high: "Senior Sec",
  university: "University",
  adult: "Adult",
};
const LEVELS = ["primary", "middle", "high", "university"] as const;

function cardSubtitle(s: SeekerCard): string {
  const lvl = s.level ? LEVEL_LABEL[s.level] ?? s.level : null;
  const subjects = s.subjects.slice(0, 2).join(", ");
  return [lvl, subjects].filter(Boolean).join(" · ");
}

export function SeekerResultsList({
  query,
  locations,
  onOpen,
}: {
  query: string;
  /** Subdistrict slugs from the shared filter (first is sent as the district filter). */
  locations: string[];
  onOpen: (id: string) => void;
}) {
  const [level, setLevel] = useState<string | null>(null);
  const [seekers, setSeekers] = useState<SeekerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const district = locations[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    searchSeekers({ q: query.trim() || undefined, level: level ?? undefined, district })
      .then((list) => {
        if (!cancelled) setSeekers(list);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof ApiError);
          setSeekers([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, level, district]);

  // Narrow further by the typed query against name + subjects (the backend only
  // text-matches names of seekers who share their info).
  const results = useMemo(() => {
    const k = query.trim().toLowerCase();
    if (!k) return seekers;
    return seekers.filter((s) =>
      [s.name, ...s.subjects].some((f) => f.toLowerCase().includes(k)),
    );
  }, [query, seekers]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
      {/* Level filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelRow}>
        {LEVELS.map((lv) => {
          const on = level === lv;
          return (
            <Pressable key={lv} onPress={() => setLevel(on ? null : lv)} style={[styles.levelPill, on && styles.levelPillOn]}>
              <Text style={[styles.levelText, on && styles.levelTextOn]}>{LEVEL_LABEL[lv]}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator color={C.green} />
        </View>
      ) : error ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={38} color={C.unselIc} />
          <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 10, color: C.muted }}>Couldn&apos;t load students</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={40} color={C.unselIc} />
          <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 10, color: C.muted }}>No students match</Text>
          <Text style={{ fontSize: 13, marginTop: 4, color: C.muted, textAlign: "center" }}>
            Only students and parents who made their profile public appear here.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.count}>
            {results.length} {results.length === 1 ? "student" : "students"}
          </Text>
          {results.map((s) => (
            <Pressable key={s.id} onPress={() => onOpen(s.id)} style={styles.row}>
              <Avatar name={s.name} uri={s.avatar_url ?? undefined} size={48} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: "700", color: C.ink }} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <View style={styles.roleTag}>
                    <Text style={styles.roleTagText}>{s.role === "parent" ? "Parent" : "Student"}</Text>
                  </View>
                </View>
                {!!cardSubtitle(s) && (
                  <Text style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }} numberOfLines={1}>
                    {cardSubtitle(s)}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.unselIc} />
            </Pressable>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  levelRow: { gap: 8, paddingVertical: 10, paddingRight: 8 },
  levelPill: { height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1.5, borderColor: C.hairline, alignItems: "center", justifyContent: "center" },
  levelPillOn: { backgroundColor: C.green, borderColor: C.green },
  levelText: { fontSize: 13, fontWeight: "700", color: C.ink },
  levelTextOn: { color: "#fff" },
  count: { fontSize: 13, fontWeight: "600", letterSpacing: 0.3, color: C.muted, textTransform: "uppercase", marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.hairline },
  roleTag: { backgroundColor: C.greenTint, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
  roleTagText: { fontSize: 10.5, fontWeight: "800", color: C.greenD },
  stateWrap: { paddingVertical: 48, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
});
