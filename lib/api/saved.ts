import { apiFetch } from "./client";
import type { BrowseTutorCard } from "./tutors";

/**
 * Saved / bookmarked tutors (the seeker "Saved" tab).
 *
 *   GET    /api/saved        → { saved: [...] }   the caller's bookmarks, newest first
 *   POST   /api/saved        → bookmark a tutor; body { slug } or { tutor_id }; idempotent
 *   DELETE /api/saved/[id]   → un-bookmark; [id] is the tutor's slug or uuid; idempotent
 *
 * All auth-only and owner-scoped by RLS — your saved list is private to you. A
 * saved card is a browse card plus the row `id` (tutor uuid) and `saved_at`.
 */

export interface SavedTutor extends BrowseTutorCard {
  id: string;
  saved_at: string;
}

export async function getSavedTutors(): Promise<SavedTutor[]> {
  const res = await apiFetch<{ saved: SavedTutor[] }>("/api/saved");
  return res.saved;
}

/** Bookmark a tutor by slug (preferred — that's what cards carry) or uuid. */
export async function saveTutor(ref: { slug?: string; tutor_id?: string }): Promise<void> {
  await apiFetch("/api/saved", { method: "POST", body: ref });
}

/** Remove a bookmark; pass the tutor's slug or uuid. */
export async function unsaveTutor(slugOrId: string): Promise<void> {
  await apiFetch(`/api/saved/${encodeURIComponent(slugOrId)}`, { method: "DELETE" });
}
