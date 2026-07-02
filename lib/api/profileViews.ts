import { apiFetch } from "./client";
import type { SeekerRole } from "./seekers";

/**
 * Profile viewers — the parents/students who opened the signed-in tutor's
 * profile. This is the headline of the tutor's Analytics screen (reached from
 * the Home heart icon): a free, tappable list. Tapping a viewer opens that
 * seeker's profile (`/seekers/[id]`).
 *
 *   GET  /api/tutor/profile-views        → { viewers: ProfileViewer[] }
 *   POST /api/tutors/[slug]/views        → record that the caller viewed a tutor
 *
 * `recordProfileView` is fired (best-effort) whenever a seeker opens a tutor
 * profile, so the tutor's viewers list fills up. Both are no-ops offline.
 */

export interface ProfileViewer {
  /** The seeker id — pass to `/seekers/[id]`. */
  id: string;
  name: string;
  role: SeekerRole;
  /** Why they're here, e.g. "Looking for a Maths tutor for P3". */
  note: string;
  /** Relative time, e.g. "2h". */
  ago: string;
  avatar_url: string | null;
}

/**
 * Profile-viewers response. Analytics is open to all tiers now — the counts drive
 * the "Profile views" banner and `viewers` drives the list. Name visibility is
 * gated client-side by the tutor's tier (Deluxe only); `locked`/`detailed` are
 * legacy fields the frontend no longer branches on.
 */
export interface ProfileViewersResult {
  tier: "free" | "premium" | "deluxe";
  count: number;
  /** Viewer counts by role (backend-supplied; can't be derived client-side). */
  seekerCount?: number;
  tutorCount?: number;
  viewers: ProfileViewer[];
  /** @deprecated legacy tier gating — unused by the current UI. */
  locked?: boolean;
  /** @deprecated legacy tier gating — unused by the current UI. */
  detailed?: boolean;
}

/** The tutor's profile viewers (tier-gated). Throws `ApiError` (caller falls back to sample). */
export async function getProfileViewers(): Promise<ProfileViewersResult> {
  return apiFetch<ProfileViewersResult>("/api/tutor/profile-views");
}

/** Record that the caller viewed a tutor's profile. Best-effort — never throws. */
export async function recordProfileView(tutorSlug: string): Promise<void> {
  if (!tutorSlug) return;
  try {
    await apiFetch(`/api/tutors/${encodeURIComponent(tutorSlug)}/views`, { method: "POST" });
  } catch {
    // Offline / sample tutor / endpoint not built yet — silently ignore.
  }
}
