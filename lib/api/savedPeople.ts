import { apiFetch } from "./client";

/**
 * The TUTOR's saved list — a MIXED set of other tutors AND seekers
 * (parents/students) the tutor has bookmarked. (Distinct from the seeker-side
 * `/api/saved`, which is seeker-saves-tutor only.)
 *
 *   GET    /api/saved/people        → { saved: SavedPerson[] }
 *   POST   /api/saved/people        → bookmark; body { id, kind }
 *   DELETE /api/saved/people/[id]   → un-bookmark
 *
 * A row carries enough to render without a second fetch (name/subtitle/avatar).
 * The store in `components/tutor/savedPeople.ts` does optimistic writes and keeps
 * an AsyncStorage mirror so the Saved tab works offline (mock).
 */

export type SavedKind = "tutor" | "parent" | "student";

export interface SavedPerson {
  /** Tutor slug, or seeker id. */
  id: string;
  kind: SavedKind;
  name: string;
  /** e.g. "Mathematics · Causeway Bay" or "Parent · P3 Maths". */
  subtitle: string;
  avatar_url: string | null;
}

/** The tutor's saved people (tutors + seekers). Throws `ApiError`. */
export async function getSavedPeople(): Promise<SavedPerson[]> {
  const res = await apiFetch<{ saved: SavedPerson[] }>("/api/saved/people");
  return res.saved;
}

/** Bookmark a person. Throws `ApiError`. */
export async function addSavedPerson(p: SavedPerson): Promise<void> {
  await apiFetch("/api/saved/people", { method: "POST", body: { id: p.id, kind: p.kind } });
}

/** Remove a bookmark. Throws `ApiError`. */
export async function removeSavedPerson(id: string): Promise<void> {
  await apiFetch(`/api/saved/people/${encodeURIComponent(id)}`, { method: "DELETE" });
}
