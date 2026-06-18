/**
 * Tutor app — HOME feed (Editorial look, first-time state).
 *
 * Ported from `tutor/tutor-feed.jsx`. Like/Connect state and "open a tutor's
 * profile" are lifted to the shell so they're shared across tabs; the comment
 * sheet stays local. Gradients/stripes from the web source are flattened to
 * solid colours (RN has no CSS gradients without a native module → EAS rebuild).
 */
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Avatar, EngagementRow, FollowBtn, Logo, MediaSlot, Qualified } from "./feedUi";
import { C, ME, STORIES, SUGGEST, TH, TUTORS, tutorById, type Comment, type Tutor } from "./tutorData";

/* top app bar */
function FeedBar() {
  return (
    <View style={styles.feedBar}>
      <Logo size={23} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Pressable style={styles.iconBtn}>
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
    <Pressable style={styles.banner} onPress={onPress}>
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
    </Pressable>
  );
}

/* stories-style row */
function StoryRow({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyRow}>
      <View style={styles.storyItem}>
        <View style={{ width: 66, height: 66 }}>
          <Avatar name={ME.name} size={66} />
          <View style={styles.storyAdd}>
            <Ionicons name="add" size={16} color="#fff" />
          </View>
        </View>
        <Text style={[styles.storyLabel, { color: C.muted }]} numberOfLines={1}>
          Your story
        </Text>
      </View>

      {STORIES.map((id) => {
        const t = tutorById(id);
        if (!t) return null;
        return (
          <Pressable key={id} style={styles.storyItem} onPress={() => onOpen(id)}>
            <View style={styles.storyRing}>
              <View style={styles.storyRingInner}>
                <Avatar name={t.name} size={58} />
              </View>
            </View>
            <Text style={[styles.storyLabel, { color: C.ink }]} numberOfLines={1}>
              {t.username.split(".")[0]}
            </Text>
          </Pressable>
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
  onComment,
  onOpenProfile,
}: {
  t: Tutor;
  liked: boolean;
  connected: boolean;
  onLike: () => void;
  onConnect: () => void;
  onComment: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Pressable onPress={onOpenProfile}>
          <Avatar name={t.name} size={40} />
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

      <MediaSlot label={t.post.label} kind={t.post.kind} height={296} radius={TH.mediaRadius} />
      <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
        <View style={styles.typeChip}>
          <Ionicons name="bookmark" size={13} color={C.greenD} />
          <Text style={styles.typeChipText}>{t.post.type}</Text>
        </View>
        <EngagementRow
          likes={t.counts.likes}
          comments={t.counts.comments}
          liked={liked}
          onLike={onLike}
          onComment={onComment}
        />
        <Text style={styles.caption}>
          <Text style={{ fontWeight: "700" }}>{t.username}</Text> {t.post.caption}
        </Text>
        <Pressable onPress={onComment}>
          <Text style={styles.viewComments}>View all {t.counts.comments} comments</Text>
        </Pressable>
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
        {SUGGEST.map((s) => (
          <View key={s.id} style={styles.suggestCard}>
            <Pressable onPress={() => onOpenProfile(s.id)}>
              <Avatar name={s.name} size={62} />
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
            <Text style={{ fontSize: 11, color: C.unselIc, marginTop: 6, marginBottom: 11 }}>{s.mutual} mutual</Text>
            <FollowBtn following={connected.has(s.id)} onToggle={() => onConnect(s.id)} size="sm" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* comment sheet — with a composer to post your own comment */
function CommentSheet({ tutor, onClose }: { tutor: Tutor | null; onClose: () => void }) {
  const [extra, setExtra] = useState<Comment[]>([]);
  const [val, setVal] = useState("");
  // Reset the draft + locally-posted comments whenever a different post opens.
  useEffect(() => {
    setExtra([]);
    setVal("");
  }, [tutor?.id]);

  const list: Comment[] = [...(tutor?.comments ?? []), ...extra];
  const send = () => {
    const text = val.trim();
    if (!text) return;
    setExtra((e) => [...e, { who: ME.username, text, ago: "now", mine: true }]);
    setVal("");
  };

  return (
    <Modal visible={!!tutor} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheetRoot}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.commentSheet}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>Comments</Text>
          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {list.map((c, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 11, paddingVertical: 11, alignItems: "flex-start" }}>
                <Avatar name={c.who} size={34} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 13.5, lineHeight: 19, color: C.ink }}>
                    <Text style={{ fontWeight: "700" }}>{c.who}</Text> {c.text}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: C.unselIc, marginTop: 3, fontWeight: "600" }}>
                    {c.ago}
                    {c.mine ? "" : " · Reply"}
                  </Text>
                </View>
                <Ionicons name="heart-outline" size={16} color={C.unselIc} style={{ marginTop: 4 }} />
              </View>
            ))}
          </ScrollView>
          <View style={styles.composer}>
            <Avatar name={ME.name} size={34} />
            <TextInput
              value={val}
              onChangeText={setVal}
              placeholder="Add a comment…"
              placeholderTextColor={C.unselIc}
              style={styles.composerInput}
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <Pressable onPress={send} disabled={!val.trim()} hitSlop={8}>
              <Text style={{ fontSize: 14.5, fontWeight: "700", color: val.trim() ? C.green : C.unselIc }}>Post</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function FeedScreen({
  likes,
  connected,
  onLike,
  onConnect,
  onOpenProfile,
  showSetup,
  onSetup,
}: {
  likes: Set<string>;
  connected: Set<string>;
  onLike: (id: string) => void;
  onConnect: (id: string) => void;
  onOpenProfile: (id: string) => void;
  showSetup: boolean;
  onSetup: () => void;
}) {
  const [sheet, setSheet] = useState<Tutor | null>(null);
  return (
    <>
      <FeedBar />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: TH.cardGap, paddingBottom: 24 }}>
        {showSetup && <SetupBanner onPress={onSetup} />}
        <StoryRow onOpen={onOpenProfile} />
        {TUTORS.map((t, i) => (
          <View key={t.id} style={{ gap: TH.cardGap }}>
            <PostCard
              t={t}
              liked={likes.has(t.id)}
              connected={connected.has(t.id)}
              onLike={() => onLike(t.id)}
              onConnect={() => onConnect(t.id)}
              onComment={() => setSheet(t)}
              onOpenProfile={() => onOpenProfile(t.id)}
            />
            {i === 1 && <SuggestStrip connected={connected} onConnect={onConnect} onOpenProfile={onOpenProfile} />}
          </View>
        ))}
      </ScrollView>
      <CommentSheet tutor={sheet} onClose={() => setSheet(null)} />
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
  viewComments: { paddingTop: 8, color: C.muted, fontSize: 13 },
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
  sheetRoot: { flex: 1, backgroundColor: "rgba(0,0,0,0.42)", justifyContent: "flex-end" },
  commentSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
  },
  grabber: { width: 38, height: 4, borderRadius: 2, backgroundColor: C.unselBg, alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 16, fontWeight: "700", textAlign: "center", color: C.ink, marginBottom: 6 },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: C.hairline,
  },
  composerInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: C.hairline,
    backgroundColor: C.surface,
    paddingHorizontal: 14,
    fontSize: 15,
    color: C.ink,
  },
});
