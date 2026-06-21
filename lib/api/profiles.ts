import { apiFetch } from "./client";

/**
 * Caller's own `profiles` row (+ role block) editing.
 *
 *   PATCH /api/profiles/me — role-routed editing of the caller's own data.
 *   For ANY role this updates the common `profiles` fields:
 *     display_name, full_name, age, gender, avatar_url, district, preferred_language
 *   (student/parent also pass a `student` / `parent` block — not used by tutors,
 *   who edit their profile via PATCH /api/tutors/[slug] and their subjects /
 *   languages via the tutor endpoints).
 *
 * `gender` is the backend gender_type enum: male | female | lgbt | other |
 * prefer_not_to_say (the app's "lgbtq"/"na" are mapped before sending).
 */

export interface ProfileMeUpdate {
  display_name?: string | null;
  full_name?: string | null;
  age?: number | null;
  gender?: string | null;
  avatar_url?: string | null;
  district?: string | null;
  preferred_language?: string | null;
}

/** Update the caller's own profile fields. Send only the keys you want changed. */
export async function patchProfileMe(fields: ProfileMeUpdate): Promise<void> {
  await apiFetch("/api/profiles/me", { method: "PATCH", body: fields });
}
