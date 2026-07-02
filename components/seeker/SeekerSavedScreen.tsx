/**
 * Seeker (student/parent) SAVED tab — the tutors a seeker has bookmarked.
 *
 * Wired to the backend: fetches the caller's bookmarks from GET /api/saved on
 * mount (the tab remounts each time it's opened, so it picks up tutors saved
 * elsewhere). Rows are filtered by the shared saved-set so un-saving removes a
 * row instantly (optimistic) without waiting for a refetch. Tapping a row opens
 * the real public profile by slug; the bookmark removes it.
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SaveButton } from "./SaveButton";
import { useSeekerContactGate } from "../match/useSeekerContactGate";
import { Avatar } from "../tutor/feedUi";
import { C } from "../tutor/tutorData";
import { tapLight } from "../ui/feedback";
import { subdistrictsLabel } from "../onboarding/hkDistricts";
import { getSavedTutors, getTutor, startConversation, type SavedTutor } from "../../lib/api";

function slugToName(slug: string): string {
  return slug.split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}
function cardName(t: SavedTutor): string {
  return t.display_name?.trim() || slugToName(t.slug);
}
function subtitle(t: SavedTutor): string {
  const subject = t.categories[0]?.name_en;
  const loc = subdistrictsLabel(t.subdistricts);
  return [subject, loc].filter(Boolean).join(" · ");
}

export function SeekerSavedScreen({
  saved,
  onToggleSave,
  onOpenProfile,
}: {
  saved: Set<string>;
  onToggleSave: (slug: string) => void;
  onOpenProfile: (slug: string) => void;
}) {
  const [cards, setCards] = useState<SavedTutor[] | null>(null);
  const [loading, setLoading] = useState(true);
  // The slug currently being opened into a chat (blocks a double-tap).
  const [messaging, setMessaging] = useState<string | null>(null);
  // Seeker "one tutor at a time" gate — same confirm/check-in as the tutor profile.
  const { requestContact, modals: contactModals } = useSeekerContactGate();

  // Message a saved tutor directly. A SavedTutor only carries its slug, so
  // resolve the tutor's account id first, then start/reopen the conversation.
  const onMessage = async (t: SavedTutor) => {
    if (messaging) return;
    tapLight();
    setMessaging(t.slug);
    try {
      const tutor = await getTutor(t.slug);
      if (!tutor.id) throw new Error("no account");
      const { id: convId } = await startConversation(tutor.id);
      router.push({
        pathname: "/messages/[id]",
        params: { id: convId, name: cardName(t), otherId: tutor.id },
      });
    } catch {
      Alert.alert("Messaging", "Please log in to message this tutor.");
    } finally {
      setMessaging(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSavedTutors()
      .then((list) => {
        if (!cancelled) setCards(list);
      })
      .catch(() => {
        if (!cancelled) setCards([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Show only cards still in the saved set (so an un-save removes the row at once).
  const tutors = useMemo(() => (cards ?? []).filter((t) => saved.has(t.slug)), [cards, saved]);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Saved tutors</Text>
        {saved.size > 0 && <Text style={styles.count}>{saved.size}</Text>}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {loading && cards === null ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color={C.green} />
          </View>
        ) : tutors.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="bookmark-outline" size={34} color={C.green} />
            </View>
            <Text style={styles.emptyTitle}>No saved tutors yet</Text>
            <Text style={styles.emptyBody}>
              Tap the bookmark on any tutor in your search to keep them here for later.
            </Text>
          </View>
        ) : (
          tutors.map((t) => {
            const name = cardName(t);
            const sub = subtitle(t);
            return (
              <Pressable key={t.slug} onPress={() => onOpenProfile(t.slug)} style={styles.row}>
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
                <Pressable
                  onPress={() => requestContact(t.slug, name, () => onMessage(t))}
                  hitSlop={8}
                  disabled={messaging === t.slug}
                  style={styles.msgBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Message ${name}`}
                >
                  {messaging === t.slug ? (
                    <ActivityIndicator size="small" color={C.green} />
                  ) : (
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color={C.green} />
                  )}
                </Pressable>
                <SaveButton saved onToggle={() => onToggleSave(t.slug)} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
      {contactModals}
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
  msgBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  stateWrap: { paddingVertical: 48, alignItems: "center", justifyContent: "center" },
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
