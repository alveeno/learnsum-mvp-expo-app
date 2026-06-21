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

/** Full public profile from GET /api/tutors/[slug] (profile + subjects + posts). */
export interface TutorDetail {
  slug: string;
  bio: string | null;
  university: string | null;
  teaching_levels?: string[] | null;
  education?: unknown;
  current_studies?: unknown;
  is_published?: boolean;
  whatsapp_number?: string | null;
  instagram_handle?: string | null;
  wechat_id?: string | null;
  profiles?: { display_name: string | null; avatar_url: string | null; district: string | null } | null;
  tutor_subcategories?: unknown[];
  tutor_languages?: { language: string; proficiency: number }[];
  posts?: unknown[];
  [key: string]: unknown;
}

/** Fetch a tutor's public profile by slug (sends the token so the joined
 *  `profiles` name/avatar resolve — those aren't readable anonymously). */
export async function getTutor(slug: string): Promise<TutorDetail> {
  const res = await apiFetch<{ tutor: TutorDetail }>(`/api/tutors/${encodeURIComponent(slug)}`);
  return res.tutor;
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
