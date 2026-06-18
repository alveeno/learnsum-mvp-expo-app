/**
 * Tutor app — viewing ANOTHER tutor's profile (overlay).
 *
 * Ported from `TutorProfile` in `tutor/tutor-profile.jsx`. Opened from the feed,
 * search results, and the suggestions strip; replaces the tab content while the
 * bottom tab bar stays visible. The Message button is inert (no in-app chat yet).
 */
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar, FollowBtn, PostsGrid, Qualified, StatBlock } from "./feedUi";
import { C, lookupTutor, type PostKind } from "./tutorData";

export function TutorProfileView({
  id,
  connected,
  onConnect,
  onBack,
}: {
  id: string;
  connected: boolean;
  onConnect: () => void;
  onBack: () => void;
}) {
  const t = lookupTutor(id);
  const first = (t.post?.kind ?? "image") as PostKind;
  const grid: { kind: PostKind }[] = [
    { kind: first },
    { kind: "image" },
    { kind: "whiteboard" },
    { kind: "video" },
    { kind: "image" },
    { kind: "quote" },
  ];

  return (
    <>
      <View style={styles.head}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: C.ink }} numberOfLines={1}>
            {t.username}
          </Text>
          {t.qualified && <Qualified />}
        </View>
        <Pressable style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={C.ink} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
            <Avatar name={t.name} size={72} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: C.ink }}>{t.name}</Text>
              <Text style={{ fontSize: 13, color: C.greenD, fontWeight: "600", marginTop: 2 }}>
                {t.subject} · {t.school}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                <Ionicons name="location-outline" size={15} color={C.muted} />
                <Text style={{ fontSize: 12.5, color: C.muted }}>{t.loc}</Text>
              </View>
            </View>
          </View>

          <StatBlock stats={t.stats} />

          <View style={{ flexDirection: "row", gap: 9, marginTop: 15, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <FollowBtn following={connected} onToggle={onConnect} />
            </View>
            <Pressable style={styles.messageBtn}>
              <Ionicons name="chatbubble-outline" size={16} color={C.ink} />
              <Text style={{ fontSize: 13.5, fontWeight: "700", color: C.ink }}>Message</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: C.hairline }}>
          <PostsGrid items={grid} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 4, paddingRight: 10, paddingTop: 2, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  messageBtn: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: C.hairline,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
});
