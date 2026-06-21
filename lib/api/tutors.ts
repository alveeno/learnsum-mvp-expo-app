import { apiFetch } from "./client";

/**
 * Tutor profile reads/writes.
 *
 *   PATCH /api/tutors/[slug] — update own profile (owner-checked + RLS). Accepts
 *   any subset of { bio, university, tutoring_format, tutoring_type, whatsapp_number,
 *   instagram_handle, wechat_id, is_published, teaching_levels, education,
 *   current_studies }. Until is_published is true the profile is invisible to
 *   everyone but the owner.
 *
 * Note: the publish sheet's per-audience toggles (parents&students / tutors) are
 * NOT sent — the backend has only a single `is_published` boolean. Those toggles
 * stay in the onboarding store for a later "audience visibility" feature.
 */

export interface TutorProfile {
  id: string;
  slug: string;
  is_published: boolean;
  [key: string]: unknown;
}

/** Update own tutor profile with any subset of editable fields. */
export async function patchTutor(
  slug: string,
  fields: Record<string, unknown>,
): Promise<TutorProfile> {
  const res = await apiFetch<{ tutor_profile: TutorProfile }>(
    `/api/tutors/${encodeURIComponent(slug)}`,
    { method: "PATCH", body: fields },
  );
  return res.tutor_profile;
}

/** Publish (or unpublish) own tutor profile. */
export async function setTutorPublished(slug: string, isPublished: boolean): Promise<TutorProfile> {
  return patchTutor(slug, { is_published: isPublished });
}
