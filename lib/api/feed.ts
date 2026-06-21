import { apiFetch } from "./client";

/**
 * Home feed: GET /api/feed — the seeker's "browse published tutors" feed.
 *
 * Returns lean tutor discovery cards. A logged-in student/parent with interests
 * gets a personalized ranked list; everyone else (guests, no-interest seekers)
 * gets the latest published tutors. The token is attached automatically when we
 * have one (apiFetch); without it, the guest feed is returned.
 *
 * Note: `display_name` / `avatar_url` / `district` come from the joined
 * `profiles` row, which is only readable by an AUTHENTICATED caller — a guest
 * (no token) gets those as null (the slug + categories still come through). The
 * UI falls back to a slug-derived name + initials avatar in that case.
 */

export interface FeedCategory {
  id: string;
  name_en: string;
  name_zh: string;
  slug: string;
}

export interface FeedTutor {
  slug: string;
  bio: string | null;
  display_name: string | null;
  avatar_url: string | null;
  district: string | null;
  categories: FeedCategory[];
  score?: number;
}

export interface FeedResponse {
  feed: FeedTutor[];
  personalized: boolean;
  pagination: { page: number; page_size: number; total: number; has_more: boolean };
}

export async function getFeed(opts: { page?: number; childId?: string } = {}): Promise<FeedResponse> {
  return apiFetch<FeedResponse>("/api/feed", {
    query: { page: opts.page, child_id: opts.childId },
  });
}
