/**
 * Tutor — "Who viewed you" list, reached by tapping the Analytics profile-views
 * banner (`/profile-viewers`). Shows the REAL people who opened the tutor's
 * profile. Every tier sees the list + avatars; only **Deluxe** sees the viewers'
 * **names** — Free/Premium see them blurred (a subtle upgrade nudge points to
 * Deluxe). Tapping a row opens that seeker's profile.
 */
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar } from "./feedUi";
import { useSavedPeople } from "./savedPeople";
import { C } from "./tutorData";
import { SaveButton } from "../seeker/SaveButton";
import { useTier } from "../subscription/tierStore";
import { BlurredName } from "../ui/BlurredName";
import { getProfileViewers, type ProfileViewer, type ProfileViewersResult } from "../../lib/api";

// Generic label used when a name is hidden — also feeds the Avatar initials so a
// missing photo can't leak the real name.
const roleName = (role: ProfileViewer["role"]) => (role === "parent" ? "Parent" : "Student");

export function ProfileViewersScreen() {
  const [res, setRes] = useState<ProfileViewersResult | null>(null);
  const { isSaved, toggle } = useSavedPeople();
  const revealed = useTier() === "deluxe";

  useEffect(() => {
    let cancelled = false;
    getProfileViewers()
      .then((r) => {
        if (!cancelled) setRes(r);
      })
      .catch(() => {
        if (!cancelled) setRes({ tier: "free", count: 0, seekerCount: 0, tutorCount: 0, viewers: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const viewers = res?.viewers ?? [];

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Who viewed you</Text>
        {!revealed ? (
          <Pressable style={styles.nudge} onPress={() => router.push("/subscribe" as Href)} hitSlop={6}>
            <Ionicons name="lock-open-outline" size={14} color={C.green} />
            <Text style={styles.nudgeText}>Upgrade to Deluxe to see names</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {res === null ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color={C.green} />
          </View>
        ) : viewers.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="eye-outline" size={32} color={C.green} />
            </View>
            <Text style={styles.emptyTitle}>No profile views yet</Text>
            <Text style={styles.emptyBody}>Keep posting and sharing your profile to get noticed.</Text>
          </View>
        ) : (
          viewers.map((v, i) => {
            const displayName = revealed ? v.name : roleName(v.role);
            return (
              <Pressable key={v.id || i} onPress={() => router.push(`/seekers/${v.id}` as Href)} style={styles.row}>
                <Avatar name={displayName} uri={v.avatar_url ?? undefined} size={44} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <BlurredName name={v.name} revealed={revealed} style={styles.name} numberOfLines={1} />
                </View>
                <Text style={styles.ago}>{v.ago}</Text>
                <SaveButton
                  saved={isSaved(v.id)}
                  onToggle={() =>
                    toggle({ id: v.id, kind: v.role, name: displayName, subtitle: revealed ? v.note : "", avatar_url: v.avatar_url })
                  }
                />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: C.ink },
  nudge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  nudgeText: { fontSize: 13, fontWeight: "700", color: C.green },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.hairline },
  name: { fontSize: 15, fontWeight: "700", color: C.ink },
  ago: { fontSize: 11.5, color: C.unselIc, fontWeight: "600" },
  stateWrap: { paddingVertical: 48, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 24 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.greenTint, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink },
  emptyBody: { marginTop: 8, fontSize: 14, lineHeight: 20, color: C.muted, textAlign: "center" },
});
