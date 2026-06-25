/**
 * Seeker (student/parent) SAVED tab — the tutors a seeker has bookmarked.
 *
 * Reads the shared saved-tutor set (passed down from the shell, backed by
 * `savedTutors.ts`) and lists each one from the sample directory. Tapping a row
 * opens the public profile route; the bookmark removes it. Empty until the
 * seeker saves someone from the feed, search, or a profile.
 */
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SaveButton } from "./SaveButton";
import { Avatar, Qualified } from "../tutor/feedUi";
import { C, lookupTutor } from "../tutor/tutorData";

export function SeekerSavedScreen({
  saved,
  onToggleSave,
  onOpenProfile,
}: {
  saved: Set<string>;
  onToggleSave: (id: string) => void;
  onOpenProfile: (id: string) => void;
}) {
  const ids = [...saved];
  const tutors = ids.map((id) => lookupTutor(id));

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Saved tutors</Text>
        {ids.length > 0 && <Text style={styles.count}>{ids.length}</Text>}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {tutors.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="bookmark-outline" size={34} color={C.green} />
            </View>
            <Text style={styles.emptyTitle}>No saved tutors yet</Text>
            <Text style={styles.emptyBody}>
              Tap the bookmark on any tutor in your feed or search to keep them here for later.
            </Text>
          </View>
        ) : (
          tutors.map((t) => (
            <Pressable key={t.id} onPress={() => onOpenProfile(t.id)} style={styles.row}>
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
              <SaveButton saved onToggle={() => onToggleSave(t.id)} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 24, fontWeight: "800", color: C.ink },
  count: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: C.greenTint,
    color: C.greenD,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 24,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.hairline },
  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 24 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.greenTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink },
  emptyBody: { marginTop: 8, fontSize: 14, lineHeight: 20, color: C.muted, textAlign: "center" },
});
