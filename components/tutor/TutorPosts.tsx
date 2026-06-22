/**
 * Tutor PROFILE — the "Posts" section (own profile tab).
 *
 * Lists the tutor's own posts (GET /api/tutors/[slug]/posts), newest first.
 * Text-only for now — image upload needs a native picker (→ EAS rebuild) and is
 * deferred; `post_media` is read but nothing renders it yet. New posts are
 * created from the composer (the Home feed "+" or the header here); on success
 * the composer flags this list dirty so it refetches when the tab regains focus.
 *
 * English-only, matching the rest of /tutor-home.
 */
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { C } from "./tutorData";
import { getStored, setStored } from "../onboarding/onboardingStore";
import { getTutorPosts, type Post, type PostType } from "../../lib/api";

const DIRTY_KEY = "tutor:posts:dirty";
/** Flag the posts list stale (called by the composer after creating a post). */
export function markPostsDirty(): void {
  setStored<boolean>(DIRTY_KEY, true);
}
function consumePostsDirty(): boolean {
  const v = getStored<boolean>(DIRTY_KEY, false);
  if (v) setStored<boolean>(DIRTY_KEY, false);
  return v;
}

const TYPE_LABEL: Record<PostType, string> = {
  update: "Update",
  showcase: "Showcase",
  result: "Result",
};

// Compact relative time: "just now", "5m", "3h", "2d", else a short date.
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(then).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PostRow({ post }: { post: Post }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{TYPE_LABEL[post.post_type] ?? "Post"}</Text>
        </View>
        <Text style={styles.date}>{relativeTime(post.created_at)}</Text>
      </View>
      <Text style={styles.content}>{post.content}</Text>
      {post.post_media[0] ? (
        post.post_media[0].media_type === "video" ? (
          <View style={styles.postVideo}>
            <Ionicons name="play-circle" size={38} color="#fff" />
          </View>
        ) : (
          <Image source={{ uri: post.post_media[0].url }} style={styles.postImage} />
        )
      ) : null}
      <View style={styles.statRow}>
        <Ionicons name="heart-outline" size={15} color={C.muted} />
        <Text style={styles.statText}>{post.likes_count}</Text>
      </View>
    </View>
  );
}

export function TutorPosts({ slug }: { slug: string }) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    getTutorPosts(slug)
      .then((res) => setPosts(res.posts))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  // Refetch when a freshly created post flagged the list dirty.
  useFocusEffect(
    useCallback(() => {
      if (consumePostsDirty()) load();
    }, [load]),
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Posts</Text>
        <Pressable
          style={styles.newBtn}
          onPress={() => router.push("/post-new" as Href)}
          accessibilityRole="button"
          accessibilityLabel="New post"
        >
          <Ionicons name="add" size={16} color={C.green} />
          <Text style={styles.newBtnText}>New post</Text>
        </Pressable>
      </View>

      {loading && !posts ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator color={C.green} />
        </View>
      ) : error ? (
        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>Couldn&apos;t load your posts.</Text>
        </View>
      ) : posts && posts.length > 0 ? (
        <View style={{ gap: 10 }}>
          {posts.map((p) => (
            <PostRow key={p.id} post={p} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyWrap}>
          <Ionicons name="newspaper-outline" size={28} color={C.unselIc} />
          <Text style={styles.emptyText}>No posts yet. Share an update, a student result, or your work.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 26 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: C.ink, letterSpacing: -0.2 },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 3, paddingVertical: 6, paddingHorizontal: 11, borderRadius: 16, borderWidth: 1.5, borderColor: C.green },
  newBtnText: { fontSize: 13, fontWeight: "700", color: C.green },
  stateWrap: { paddingVertical: 28, alignItems: "center", justifyContent: "center" },
  stateText: { fontSize: 14, color: C.muted },
  emptyWrap: { paddingVertical: 30, paddingHorizontal: 20, alignItems: "center", gap: 10, backgroundColor: C.surface, borderRadius: 16 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 20 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 14 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  badge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 8, backgroundColor: C.greenTint },
  badgeText: { fontSize: 11.5, fontWeight: "800", color: C.greenD, letterSpacing: 0.3 },
  date: { fontSize: 12.5, color: C.muted },
  content: { fontSize: 14.5, color: C.ink, lineHeight: 21 },
  postImage: { width: "100%", height: 200, borderRadius: 12, marginTop: 10, backgroundColor: "#EDEFF1" },
  postVideo: { width: "100%", height: 160, borderRadius: 12, marginTop: 10, backgroundColor: "#16201C", alignItems: "center", justifyContent: "center" },
  statRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  statText: { fontSize: 12.5, color: C.muted },
});
