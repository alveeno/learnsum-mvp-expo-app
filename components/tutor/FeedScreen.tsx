/**
 * Tutor app — HOME feed (Editorial look, first-time state).
 *
 * Ported from `tutor/tutor-feed.jsx`. Like/Connect state and "open a tutor's
 * profile" are lifted to the shell so they're shared across tabs. Gradients/
 * stripes from the web source are flattened to solid colours (RN has no CSS
 * gradients without a native module → EAS rebuild).
 */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PressableScale } from "../ui/PressableScale";
import { Avatar, EngagementRow, FollowBtn, Logo, MediaSlot, Qualified } from "./feedUi";
import { C, DIRECTORY, ME, STORIES, TH, TUTORS, tutorById, type FullTutor, type Tutor } from "./tutorData";

/* Other tutors from the signed-in tutor's university — the basis for the
   "Tutors you may know" strip (shown to logged-in tutors only). Matches the part
   of the school before any " · " specialisation, so "HKU" matches the feed
   tutors listed as "HKU · Education", "HKU · Pharmacy", etc. */
const university = (school: string) => school.split("·")[0].trim().toLowerCase();
const SAME_SCHOOL: FullTutor[] = DIRECTORY.filter(
  (s) => s.id !== ME.id && university(s.school) === university(ME.school),
);

/* top app bar */
function FeedBar({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.feedBar}>
      <Logo size={23} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Pressable style={styles.iconBtn} onPress={onCreate}>
          <Ionicons name="add-circle-outline" size={27} color={C.ink} />
        </Pressable>
        <Pressable style={styles.iconBtn}>
          <Ionicons name="heart-outline" size={24} color={C.ink} />
          <View style={styles.activityDot} />
        </Pressable>
      </View>
    </View>
  );
}

/* first-time profile-setup banner (gold, eye-catching) — starts onboarding */
function SetupBanner({ onPress }: { onPress: () => void }) {
  return (
    <PressableScale style={styles.banner} onPress={onPress}>
      <LinearGradient
        colors={["#F6B73C", "#E0941A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Ionicons name="sparkles" size={120} color="rgba(255,255,255,0.22)" style={styles.bannerGlow} />
      <View style={styles.bannerInner}>
        <View style={styles.bannerKicker}>
          <Ionicons name="rocket" size={14} color="#3a2c06" />
          <Text style={styles.bannerKickerText}>Get started</Text>
        </View>
        <Text style={styles.bannerTitle}>Set up your tutor profile</Text>
        <Text style={styles.bannerBody}>
          Add your photo, subjects and rate so parents and students can find you. Profiles with photos get 6× more
          interest.
        </Text>
        <View style={styles.bannerCta}>
          <Text style={styles.bannerCtaText}>Complete profile</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </View>
      </View>
    </PressableScale>
  );
}

/* stories-style row */
function StoryRow({ onOpen, onAddStory }: { onOpen: (id: string) => void; onAddStory: () => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyRow}>
      <PressableScale style={styles.storyItem} onPress={onAddStory}>
        <View style={{ width: 66, height: 66 }}>
          <Avatar name={ME.name} size={66} />
          <View style={styles.storyAdd}>
            <Ionicons name="add" size={16} color="#fff" />
          </View>
        </View>
        <Text style={[styles.storyLabel, { color: C.muted }]} numberOfLines={1}>
          Your story
        </Text>
      </PressableScale>

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
  connected,
  onLike,
  onConnect,
  onOpenProfile,
}: {
  t: Tutor;
  liked: boolean;
  connected: boolean;
  onLike: () => void;
  onConnect: () => void;
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
        {!connected && <FollowBtn following={connected} onToggle={onConnect} size="xs" />}
        <Ionicons name="ellipsis-horizontal" size={20} color={C.muted} />
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

/* "Tutors you may know" horizontal strip */
function SuggestStrip({
  connected,
  onConnect,
  onOpenProfile,
}: {
  connected: Set<string>;
  onConnect: (id: string) => void;
  onOpenProfile: (id: string) => void;
}) {
  return (
    <View style={styles.suggestWrap}>
      <View style={styles.suggestHead}>
        <Text style={{ fontSize: 15, fontWeight: "700", letterSpacing: -0.2, color: C.ink }}>Tutors you may know</Text>
        <Text style={{ fontSize: 13, fontWeight: "600", color: C.green }}>See all</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {SAME_SCHOOL.map((s) => (
          <View key={s.id} style={styles.suggestCard}>
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
            <Text style={{ fontSize: 11, color: C.unselIc, marginTop: 6, marginBottom: 11 }}>{s.school}</Text>
            <FollowBtn following={connected.has(s.id)} onToggle={() => onConnect(s.id)} size="sm" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function FeedScreen({
  likes,
  connected,
  onLike,
  onConnect,
  onOpenProfile,
  onCreatePost,
  showSetup,
  onSetup,
  registered,
  onRequireAuth,
}: {
  likes: Set<string>;
  connected: Set<string>;
  onLike: (id: string) => void;
  onConnect: (id: string) => void;
  onOpenProfile: (id: string) => void;
  onCreatePost: () => void;
  showSetup: boolean;
  onSetup: () => void;
  registered: boolean;
  onRequireAuth: () => void;
}) {
  // Like / connect are gated by the shell; adding a story is gated here (stories
  // aren't backed yet). Creating a post is handled by the shell (onCreatePost —
  // routes to the composer when registered, else the auth gate). Unregistered
  // users also don't get the "Tutors you may know" strip (it matches against the
  // signed-in tutor's education record).
  const gatedAction = () => {
    if (!registered) onRequireAuth();
  };
  return (
    <>
      <FeedBar onCreate={onCreatePost} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: TH.cardGap, paddingBottom: 24 }}>
        {showSetup && <SetupBanner onPress={onSetup} />}
        <StoryRow onOpen={onOpenProfile} onAddStory={gatedAction} />
        {TUTORS.map((t, i) => (
          <View key={t.id} style={{ gap: TH.cardGap }}>
            <PostCard
              t={t}
              liked={likes.has(t.id)}
              connected={connected.has(t.id)}
              onLike={() => onLike(t.id)}
              onConnect={() => onConnect(t.id)}
              onOpenProfile={() => onOpenProfile(t.id)}
            />
            {i === 1 && registered && (
              <SuggestStrip connected={connected} onConnect={onConnect} onOpenProfile={onOpenProfile} />
            )}
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
  activityDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.destructive,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  banner: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: C.gold,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 6,
  },
  bannerGlow: { position: "absolute", right: -14, top: -18 },
  bannerInner: { padding: 18 },
  bannerKicker: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "rgba(58,44,6,0.16)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 11,
  },
  bannerKickerText: { color: "#3a2c06", fontSize: 11, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  bannerTitle: { fontSize: 22, fontWeight: "800", color: "#3a2c06", letterSpacing: -0.5, lineHeight: 25 },
  bannerBody: { marginTop: 6, marginBottom: 14, fontSize: 13.5, color: "#5a4a18", lineHeight: 19, maxWidth: "88%" },
  bannerCta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: C.ink,
  },
  bannerCtaText: { color: "#fff", fontSize: 14.5, fontWeight: "700" },
  storyRow: { flexDirection: "row", gap: 14, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 4 },
  storyItem: { alignItems: "center", gap: 6, width: 68 },
  storyAdd: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.green,
    borderWidth: 2.5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
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
  suggestWrap: { paddingTop: 16, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.hairline },
  suggestHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  suggestCard: {
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
