import { apiFetch } from "./client";

/**
 * Caller's own `profiles` row (+ role block) editing.
 *
 *   PATCH /api/profiles/me — role-routed editing of the caller's own data.
 *   For ANY role this updates the common `profiles` fields:
 *     display_name, full_name, age, gender, avatar_url, district,
 *     preferred_language, bio, phone, wechat_id
 *   (student/parent also pass a `student` / `parent` block — e.g. an editable
 *   `school_level` — not used by tutors, who edit their profile via
 *   PATCH /api/tutors/[slug] and their subjects / languages via the tutor
 *   endpoints).
 *
 * `gender` is the backend gender_type enum: male | female | lgbt | other |
 * prefer_not_to_say (the app's "lgbtq"/"na" are mapped before sending).
 *
 * NOTE: `bio` / `phone` (and editing a seeker's `school_level`) need backend
 * support (new `profiles.bio` / `profiles.phone` columns + the route handling
 * them — see CLAUDE.md / the backend gap doc). They're sent forward-compatibly;
 * until the backend ships they're accepted-and-ignored server-side.
 */

export interface ProfileMeUpdate {
  display_name?: string | null;
  full_name?: string | null;
  age?: number | null;
  gender?: string | null;
  avatar_url?: string | null;
  district?: string | null;
  preferred_language?: string | null;
  bio?: string | null;
  phone?: string | null;
  /** Seeker (student/parent) WeChat ID — shared profiles column (migration 0031). */
  wechat_id?: string | null;
  /** Seeker privacy toggles (migration 0029). Default true. */
  is_discoverable?: boolean;
  share_personal_info?: boolean;
  /** Seeker role block (editable education level + school history). Ignored by tutors. */
  student?: { school_level?: string | null; education?: unknown };
  parent?: { school_level?: string | null };
}

/** Update the caller's own profile fields. Send only the keys you want changed. */
export async function patchProfileMe(fields: ProfileMeUpdate): Promise<void> {
  await apiFetch("/api/profiles/me", { method: "PATCH", body: fields });
}
