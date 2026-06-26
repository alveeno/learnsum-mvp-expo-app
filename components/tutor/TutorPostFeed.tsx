/**
 * A tutor's public post feed with working likes — shown on the tutor profile
 * (seeker route + the in-shell "view tutor" overlay).
 *
 * Fetches GET /api/tutors/[slug]/posts (which returns `liked_by_me` per post for
 * the signed-in caller) and wires the heart to POST/DELETE /api/posts/[id]/likes.
 * Likes are optimistic — the heart + count update immediately, then reconcile with
 * the server's authoritative count, reverting on failure (e.g. a guest with no
 * session gets 401). `likes_count` is the TOTAL, so EngagementRow (which adds the
 * caller's own +1 on top of its `likes` base) is fed the base = total − own-like.
 */
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

import { EngagementRow } from "./feedUi";
import { C } from "./tutorData";
import { getTutorPosts, likePost, unlikePost, type Post, type PostType } from "../../lib/api";

const TYPE_LABEL: Record<PostType, string> = { update: "Update", showcase: "Showcase", result: "Result" };

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

function PostCard({ post, onToggleLike }: { post: Post; onToggleLike: () => void }) {
  const liked = !!post.liked_by_me;
  const base = Math.max(0, post.likes_count - (liked ? 1 : 0)); // EngagementRow adds own +1
  const media = post.post_media[0];
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{TYPE_LABEL[post.post_type] ?? "Post"}</Text>
        </View>
        <Text style={styles.date}>{relativeTime(post.created_at)}</Text>
      </View>
      <Text style={styles.content}>{post.content}</Text>
      {media ? (
        media.media_type === "video" ? (
          <View style={styles.postVideo}>
            <Ionicons name="play-circle" size={38} color="#fff" />
          </View>
        ) : (
          <Image source={{ uri: media.url }} style={styles.postImage} />
        )
      ) : null}
      <View style={{ marginTop: 12 }}>
        <EngagementRow likes={base} liked={liked} onLike={onToggleLike} />
      </View>
    </View>
  );
}

export function TutorPostFeed({ slug }: { slug: string }) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    getTutorPosts(slug)
      .then((res) => {
        if (!cancelled) setPosts(res.posts);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const toggleLike = (id: string) => {
    const cur = posts?.find((p) => p.id === id);
    if (!cur) return;
    const willLike = !cur.liked_by_me;

    // Optimistic update.
    setPosts((ps) =>
      ps
        ? ps.map((p) =>
            p.id === id
              ? { ...p, liked_by_me: willLike, likes_count: Math.max(0, p.likes_count + (willLike ? 1 : -1)) }
              : p,
          )
        : ps,
    );

    (willLike ? likePost(id) : unlikePost(id))
      .then((state) =>
        // Reconcile with the server's authoritative count.
        setPosts((ps) =>
          ps ? ps.map((p) => (p.id === id ? { ...p, liked_by_me: state.liked, likes_count: state.likes_count } : p)) : ps,
        ),
      )
      .catch(() =>
        // Revert to the pre-tap values (e.g. guest got a 401).
        setPosts((ps) =>
          ps
            ? ps.map((p) => (p.id === id ? { ...p, liked_by_me: cur.liked_by_me, likes_count: cur.likes_count } : p))
            : ps,
        ),
      );
  };

  if (loading && !posts) {
    return (
      <View style={styles.stateWrap}>
        <ActivityIndicator color={C.green} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Posts</Text>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Couldn&apos;t load posts.</Text>
        </View>
      </View>
    );
  }
  if (!posts || posts.length === 0) return null; // no posts → show nothing extra

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Posts</Text>
      <View style={{ gap: 10 }}>
        {posts.map((p) => (
          <PostCard key={p.id} post={p} onToggleLike={() => toggleLike(p.id)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 26 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: C.ink, letterSpacing: -0.2, marginBottom: 12 },
  stateWrap: { paddingVertical: 28, alignItems: "center", justifyContent: "center" },
  emptyWrap: { paddingVertical: 24, paddingHorizontal: 20, alignItems: "center", backgroundColor: C.surface, borderRadius: 16 },
  emptyText: { fontSize: 14, color: C.muted },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 14 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  badge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 8, backgroundColor: C.greenTint },
  badgeText: { fontSize: 11.5, fontWeight: "800", color: C.greenD, letterSpacing: 0.3 },
  date: { fontSize: 12.5, color: C.muted },
  content: { fontSize: 14.5, color: C.ink, lineHeight: 21 },
  postImage: { width: "100%", height: 200, borderRadius: 12, marginTop: 10, backgroundColor: "#EDEFF1" },
  postVideo: { width: "100%", height: 160, borderRadius: 12, marginTop: 10, backgroundColor: "#16201C", alignItems: "center", justifyContent: "center" },
});
