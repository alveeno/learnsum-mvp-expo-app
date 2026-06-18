/**
 * Tutor app — own PROFILE tab (Columns stat treatment).
 *
 * Ported from `ProfileTab` in `tutor/tutor-profile.jsx`. The Edit/Share/settings
 * controls are present but inert (the profile-setup form is not in this build).
 */
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar, PostsGrid, Qualified, StatBlock } from "./feedUi";
import { C, LIKED, lookupTutor, ME, type PostKind } from "./tutorData";

const MY_POSTS: { kind: PostKind }[] = [
  { kind: "image" },
  { kind: "whiteboard" },
  { kind: "video" },
  { kind: "image" },
  { kind: "quote" },
  { kind: "whiteboard" },
];

export function ProfileScreen({ premium }: { premium: boolean }) {
  // Profile is gated until onboarding, so the tabs are display-only (Posts active).
  const [tab] = useState<"posts" | "liked">("posts");
  const liked = LIKED.map((id) => ({ kind: lookupTutor(id).post?.kind ?? ("image" as PostKind) }));

  return (
    <>
      <View style={styles.topRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Text style={{ fontSize: 19, fontWeight: "800", letterSpacing: -0.3, color: C.ink }}>{ME.username}</Text>
          {ME.qualified && <Qualified />}
        </View>
        <Pressable style={styles.iconBtn}>
          <Ionicons name="settings-outline" size={24} color={C.ink} />
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        {/* The placeholder profile is dimmed until the tutor completes onboarding. */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ opacity: 0.3 }} pointerEvents="none">
            <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
                <Avatar name={ME.name} size={72} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: C.ink }}>{ME.name}</Text>
                    {premium && (
                      <View style={styles.premiumBadge}>
                        <MaterialIcons name="workspace-premium" size={12} color="#3a2c06" />
                        <Text style={{ fontSize: 10.5, fontWeight: "800", color: "#3a2c06" }}>Premium</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 13, color: C.greenD, fontWeight: "600", marginTop: 2 }}>
                    {ME.subject} tutor · {ME.school}
                  </Text>
                </View>
              </View>

              <StatBlock stats={ME.stats} />

              <Text style={{ marginTop: 12, fontSize: 13.5, lineHeight: 20, color: C.ink }}>
                DSE & IB maths and physics. I teach the <Text style={{ fontStyle: "italic" }}>why</Text>, not just the
                how. Causeway Bay studio + online. 📈
              </Text>

              <View style={{ flexDirection: "row", gap: 9, marginTop: 14, marginBottom: 4 }}>
                <Pressable style={styles.actionBtn}>
                  <Text style={styles.actionText}>Edit profile</Text>
                </Pressable>
                <Pressable style={styles.actionBtn}>
                  <Text style={styles.actionText}>Share profile</Text>
                </Pressable>
                <Pressable style={styles.actionSquare}>
                  <Ionicons name="share-outline" size={20} color={C.ink} />
                </Pressable>
              </View>
            </View>

            <View style={styles.tabsRow}>
              {([
                ["posts", "grid-outline"],
                ["liked", "heart-outline"],
              ] as const).map(([id, ic]) => {
                const on = tab === id;
                return (
                  <View key={id} style={[styles.tabBtn, { borderBottomColor: on ? C.ink : "transparent" }]}>
                    <Ionicons name={on ? (ic.replace("-outline", "") as keyof typeof Ionicons.glyphMap) : ic} size={22} color={on ? C.ink : C.unselIc} />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: on ? C.ink : C.unselIc, textTransform: "capitalize" }}>{id}</Text>
                  </View>
                );
              })}
            </View>

            {tab === "posts" ? (
              <PostsGrid items={MY_POSTS} />
            ) : liked.length ? (
              <PostsGrid items={liked} />
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <Ionicons name="heart-outline" size={38} color={C.unselIc} />
                <Text style={{ fontSize: 14, marginTop: 8, color: C.muted }}>Posts you like will show here.</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Centered setup gate (gold, matches the home banner) → tutor onboarding. */}
        <View style={styles.gateOverlay} pointerEvents="box-none">
          <Pressable style={styles.gateCard} onPress={() => router.push("/onboarding/TutorInspiration")}>
            <View style={styles.gateKicker}>
              <Ionicons name="rocket" size={14} color="#3a2c06" />
              <Text style={styles.gateKickerText}>Get started</Text>
            </View>
            <Text style={styles.gateTitle}>Set up your profile</Text>
            <Text style={styles.gateBody}>Add your photo, subjects and rate so parents and students can find you.</Text>
            <View style={styles.gateCta}>
              <Text style={styles.gateCtaText}>Complete profile</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </View>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 14, paddingRight: 10, paddingTop: 2, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  premiumBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.gold, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 7 },
  actionBtn: { flex: 1, height: 38, borderRadius: 11, borderWidth: 1.5, borderColor: C.hairline, alignItems: "center", justifyContent: "center" },
  actionText: { fontSize: 14, fontWeight: "700", color: C.ink },
  actionSquare: { width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, borderColor: C.hairline, alignItems: "center", justifyContent: "center" },
  tabsRow: { flexDirection: "row", marginTop: 14, borderBottomWidth: 1, borderBottomColor: C.hairline },
  tabBtn: { flex: 1, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderBottomWidth: 2 },
  gateOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  gateCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    backgroundColor: C.gold,
    padding: 20,
    alignItems: "center",
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 8,
  },
  gateKicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(58,44,6,0.16)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 11,
  },
  gateKickerText: { color: "#3a2c06", fontSize: 11, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  gateTitle: { fontSize: 22, fontWeight: "800", color: "#3a2c06", letterSpacing: -0.5, textAlign: "center" },
  gateBody: { marginTop: 6, marginBottom: 16, fontSize: 13.5, color: "#5a4a18", lineHeight: 19, textAlign: "center" },
  gateCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: C.ink,
  },
  gateCtaText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

