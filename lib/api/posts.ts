import { apiFetch } from "./client";

/**
 * Tutor posts (the Instagram-style feed entries on a tutor's profile).
 *
 *   GET  /api/tutors/[slug]/posts?page=N  → { posts, pagination }   (public)
 *   POST /api/tutors/[slug]/posts          → { post }   (owner only)
 *
 * Posts carry a `post_type` (update | showcase | result) and optional media.
 * Image upload isn't wired yet (needs a native picker → EAS rebuild), so the app
 * only creates text posts for now; `post_media` is read but always empty on
 * create. A post's media URLs must be files the tutor uploaded via POST
 * /api/upload — handled later when the picker lands.
 */

export type PostType = "update" | "showcase" | "result";

export interface PostMedia {
  url: string;
  media_type: "image" | "video";
  sort_order: number;
}

export interface Post {
  id: string;
  content: string;
  content_zh: string | null;
  post_type: PostType;
  likes_count: number;
  comments_count: number;
  created_at: string;
  post_media: PostMedia[];
}

export interface PostsPage {
  posts: Post[];
  pagination: { page: number; page_size: number; total: number; has_more: boolean };
}

/**
 * A tutor's posts, newest first (paginated 10/page). Sends the token when there
 * is one (default auth): the OWNER can then read their own posts even while
 * unpublished (a tutor is unpublished until they publish) — anon reads of an
 * unpublished tutor 404. A guest viewing a published tutor still works tokenless.
 */
export async function getTutorPosts(slug: string, page = 1): Promise<PostsPage> {
  return apiFetch<PostsPage>(`/api/tutors/${encodeURIComponent(slug)}/posts`, {
    query: { page },
  });
}

/** Create a post on the caller's own tutor profile (owner only). Text-only for now. */
export async function createPost(
  slug: string,
  body: { content: string; post_type: PostType; content_zh?: string },
): Promise<Post> {
  const res = await apiFetch<{ post: Post }>(`/api/tutors/${encodeURIComponent(slug)}/posts`, {
    method: "POST",
    body,
  });
  return res.post;
}
