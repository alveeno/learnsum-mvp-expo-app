import { apiFetch } from "./client";

/**
 * Post likes.
 *
 *   GET    /api/posts/[id]/likes → { liked, likes_count }  (public; liked=false signed out)
 *   POST   /api/posts/[id]/likes → like (idempotent)
 *   DELETE /api/posts/[id]/likes → unlike (idempotent)
 *
 * `likes_count` is the authoritative TOTAL (everyone's likes). The posts feed
 * (GET /api/tutors/[slug]/posts) returns `liked_by_me` per post for initial state,
 * so a screen usually only calls like/unlike on tap. Each returns the fresh count.
 */

export interface LikeState {
  liked: boolean;
  likes_count: number;
}

export async function getPostLikes(postId: string): Promise<LikeState> {
  return apiFetch<LikeState>(`/api/posts/${encodeURIComponent(postId)}/likes`, { auth: true });
}

export async function likePost(postId: string): Promise<LikeState> {
  return apiFetch<LikeState>(`/api/posts/${encodeURIComponent(postId)}/likes`, { method: "POST" });
}

export async function unlikePost(postId: string): Promise<LikeState> {
  return apiFetch<LikeState>(`/api/posts/${encodeURIComponent(postId)}/likes`, { method: "DELETE" });
}
