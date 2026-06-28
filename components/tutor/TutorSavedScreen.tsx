/**
 * Tutor app — SAVED tab (replaces the old Analytics tab).
 *
 * A MIXED bookmarks list: the other tutors AND the parents/students the tutor
 * has saved (from Search, the profile-viewers list, or a seeker profile). Backed
 * by the shared `savedPeople` store (optimistic + AsyncStorage mirror), so
 * un-saving removes the row instantly and stays in sync everywhere.
 *
 * Tapping a tutor opens the in-shell tutor overlay; tapping a parent/student
 * opens `/seekers/[id]`. English-only (mirrors the tutor shell, see CLAUDE.md).
 */
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar } from "./feedUi";
import { useSavedPeople, type SavedPerson } from "./savedPeople";
import { C } from "./tutorData";
import { SaveButton } from "../seeker/SaveButton";

const KIND_LABEL: Record<SavedPerson["kind"], string> = {
  tutor: "Tutor",
  parent: "Parent",
  student: "Student",
};

function KindBadge({ kind }: { kind: SavedPerson["kind"] }) {
  const isTutor = kind === "tutor";
  return (
    <View style={[styles.badge, { backgroundColor: isTutor ? C.greenTint : C.goldTint }]}>
      <Text style={[styles.badgeText, { color: isTutor ? C.greenD : C.goldD }]}>{KIND_LABEL[kind]}</Text>
    </View>
  );
}

export function TutorSavedScreen({ onOpenTutor }: { onOpenTutor: (slug: string) => void }) {
  const { list, toggle } = useSavedPeople();

  const open = (p: SavedPerson) => {
    if (p.kind === "tutor") onOpenTutor(p.id);
    else router.push(`/seekers/${p.id}` as Href);
  };

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
        {list.length > 0 && <Text style={styles.count}>{list.length}</Text>}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {list.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="bookmark-outline" size={34} color={C.green} />
            </View>
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.emptyBody}>
              Tap the bookmark on a tutor in Search, or on a parent/student who viewed your profile, to keep them here.
            </Text>
          </View>
        ) : (
          list.map((p) => (
            <Pressable key={p.id} onPress={() => open(p)} style={styles.row}>
              <Avatar name={p.name} uri={p.avatar_url ?? undefined} size={48} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <KindBadge kind={p.kind} />
                </View>
                {!!p.subtitle && (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {p.subtitle}
                  </Text>
                )}
              </View>
              <SaveButton saved onToggle={() => toggle(p)} />
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
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flexShrink: 1, fontSize: 14.5, fontWeight: "700", color: C.ink },
  subtitle: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
  badgeText: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.2 },
  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 24 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.greenTint, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink },
  emptyBody: { marginTop: 8, fontSize: 14, lineHeight: 20, color: C.muted, textAlign: "center" },
});
