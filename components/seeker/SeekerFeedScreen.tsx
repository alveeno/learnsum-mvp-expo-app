/**
 * Seeker (student/parent) HOME feed — Instagram-style vertical post feed.
 *
 * Reuses the tutor app's editorial post-card look (shared `feedUi` primitives +
 * the same sample tutors) but for the discovery side: no "complete your profile"
 * banner and no post composer (seekers don't post), and each card's primary
 * action is Save (bookmark) instead of the tutor-to-tutor Connect. A stories row
 * and a "Recommended for you" strip keep it lively (the rich layout choice).
 *
 * Sample data + English-only, matching the tutor shell (see CLAUDE.md). Tapping a
 * tutor opens the public profile route `app/tutors/[slug].tsx`.
 */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SaveButton } from "./SaveButton";
import { PressableScale } from "../ui/PressableScale";
import { Avatar, EngagementRow, Logo, MediaSlot, Qualified } from "../tutor/feedUi";
import { C, STORIES, SUGGEST, TH, TUTORS, tutorById, type FullTutor, type Tutor } from "../tutor/tutorData";

/* top app bar — brand + a shortcut to the Search tab */
function FeedBar({ onSearch }: { onSearch: () => void }) {
  return (
    <View style={styles.feedBar}>
      <Logo size={23} />
      <Pressable style={styles.iconBtn} onPress={onSearch} accessibilityRole="button" accessibilityLabel="Search tutors">
        <Ionicons name="search" size={24} color={C.ink} />
      </Pressable>
    </View>
  );
}

/* stories row — tutors' highlight rings (seekers don't post their own) */
function StoryRow({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyRow}>
      {STORIES.map((id) => {
        const t = tutorById(id);
        if (!t) return null;
        return (
          <PressableScale key={id} style={styles.storyItem} onPress={() => onOpen(id)}>
            <LinearGradient
              colors={["#F4A923", "#E0941A", "#2D6A4F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storyRing}
            >
              <View style={styles.storyRingInner}>
                <Avatar name={t.name} uri={t.avatarUrl} size={58} />
              </View>
            </LinearGradient>
            <Text style={[styles.storyLabel, { color: C.ink }]} numberOfLines={1}>
              {t.username.split(".")[0]}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

/* one feed post (editorial card) */
function PostCard({
  t,
  liked,
  saved,
  onLike,
  onToggleSave,
  onOpenProfile,
}: {
  t: Tutor;
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onToggleSave: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Pressable onPress={onOpenProfile}>
          <Avatar name={t.name} uri={t.avatarUrl} size={40} />
        </Pressable>
        <Pressable style={{ flex: 1, minWidth: 0 }} onPress={onOpenProfile}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={styles.username} numberOfLines={1}>
              {t.username}
            </Text>
            {t.qualified && <Qualified />}
          </View>
          <Text style={styles.subjectLoc} numberOfLines={1}>
            {t.subject} · {t.loc}
          </Text>
        </Pressable>
        <SaveButton saved={saved} onToggle={onToggleSave} />
      </View>

      <MediaSlot label={t.post.label} kind={t.post.kind} uri={t.post.mediaUrl} height={296} radius={TH.mediaRadius} />
      <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
        <View style={styles.typeChip}>
          <Ionicons name="bookmark" size={13} color={C.greenD} />
          <Text style={styles.typeChipText}>{t.post.type}</Text>
        </View>
        <EngagementRow likes={t.counts.likes} liked={liked} onLike={onLike} />
        <Text style={styles.caption}>
          <Text style={{ fontWeight: "700" }}>{t.username}</Text> {t.post.caption}
        </Text>
        <Text style={styles.ago}>{t.post.ago} ago</Text>
      </View>
    </View>
  );
}

/* "Recommended for you" horizontal strip */
function RecommendStrip({
  saved,
  onToggleSave,
  onOpenProfile,
}: {
  saved: Set<string>;
  onToggleSave: (id: string) => void;
  onOpenProfile: (id: string) => void;
}) {
  return (
    <View style={styles.recWrap}>
      <View style={styles.recHead}>
        <Text style={{ fontSize: 15, fontWeight: "700", letterSpacing: -0.2, color: C.ink }}>Recommended for you</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {SUGGEST.map((s: FullTutor) => (
          <View key={s.id} style={styles.recCard}>
            <Pressable onPress={() => onOpenProfile(s.id)}>
              <Avatar name={s.name} uri={s.avatarUrl} size={62} />
            </Pressable>
            <Pressable
              onPress={() => onOpenProfile(s.id)}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 9 }}
            >
              <Text style={{ fontSize: 13.5, fontWeight: "700", color: C.ink }} numberOfLines={1}>
                {s.username}
              </Text>
              {s.qualified && <Qualified mini />}
            </Pressable>
            <Text style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{s.subject}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, marginBottom: 11 }}>
              <Ionicons name="star" size={12} color={C.gold} />
              <Text style={{ fontSize: 11.5, color: C.unselIc }}>
                {s.stats.rating} · {s.loc}
              </Text>
            </View>
            <SaveButton saved={saved.has(s.id)} onToggle={() => onToggleSave(s.id)} variant="pill" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function SeekerFeedScreen({
  likes,
  saved,
  onLike,
  onToggleSave,
  onOpenProfile,
  onGoSearch,
}: {
  likes: Set<string>;
  saved: Set<string>;
  onLike: (id: string) => void;
  onToggleSave: (id: string) => void;
  onOpenProfile: (id: string) => void;
  onGoSearch: () => void;
}) {
  return (
    <>
      <FeedBar onSearch={onGoSearch} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: TH.cardGap, paddingBottom: 24 }}>
        <StoryRow onOpen={onOpenProfile} />
        {TUTORS.map((t, i) => (
          <View key={t.id} style={{ gap: TH.cardGap }}>
            <PostCard
              t={t}
              liked={likes.has(t.id)}
              saved={saved.has(t.id)}
              onLike={() => onLike(t.id)}
              onToggleSave={() => onToggleSave(t.id)}
              onOpenProfile={() => onOpenProfile(t.id)}
            />
            {i === 1 && <RecommendStrip saved={saved} onToggleSave={onToggleSave} onOpenProfile={onOpenProfile} />}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  feedBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 16,
    paddingRight: 10,
    paddingTop: 4,
    paddingBottom: 8,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  storyRow: { flexDirection: "row", gap: 14, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 4 },
  storyItem: { alignItems: "center", gap: 6, width: 68 },
  storyRing: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  storyRingInner: { width: 63, height: 63, borderRadius: 31.5, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  storyLabel: { fontSize: 11.5, fontWeight: "600", maxWidth: 66 },
  card: {
    marginHorizontal: 16,
    backgroundColor: TH.cardBg,
    borderRadius: TH.cardRadius,
    overflow: "hidden",
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  username: { fontSize: 14.5, fontWeight: "700", letterSpacing: -0.2, color: C.ink, flexShrink: 1 },
  subjectLoc: { fontSize: 12, color: C.muted, marginTop: 1 },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: C.greenTint,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 7,
    marginBottom: 11,
  },
  typeChipText: { color: C.greenD, fontSize: 11, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  caption: { marginTop: 11, fontSize: 14, lineHeight: 20, color: C.ink },
  ago: {
    fontSize: 11,
    color: C.unselIc,
    fontWeight: "600",
    letterSpacing: 0.2,
    textTransform: "uppercase",
    paddingTop: 4,
    paddingBottom: 12,
  },
  recWrap: { paddingTop: 16, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.hairline },
  recHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  recCard: {
    width: 158,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.hairline,
    borderRadius: 18,
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 13,
    alignItems: "center",
  },
});
