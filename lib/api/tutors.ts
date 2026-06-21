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

/**
 * One subject the tutor teaches, for PUT /api/tutor/subjects (full replace).
 * `subcategory_id` is the backend UUID (resolve from the slug via the categories
 * index). `format`/`districts` are persisted by the endpoint (extended to match
 * what onboarding stores — see backend migration 0016); districts are hk_district
 * enum codes and only apply to in-person/both.
 */
export interface TutorSubjectInput {
  subcategory_id: string;
  years_experience?: number | null;
  hourly_rate_min?: number | null;
  hourly_rate_max?: number | null;
  achievements?: { en: string; zh: string } | null;
  qualifications?: unknown[] | null;
  exam_results?: unknown[] | null;
  experience?: unknown[] | null;
  format?: "in_person" | "online" | "both" | null;
  districts?: string[];
}

/** Full-replace the tutor's subjects (send [] to clear). */
export async function putTutorSubjects(subjects: TutorSubjectInput[]): Promise<void> {
  await apiFetch("/api/tutor/subjects", { method: "PUT", body: { subjects } });
}

/**
 * Full-replace the tutor's teaching languages. Accepts the proficiency map the
 * app already holds ({ english: 4, cantonese: 3, ... }, level 1..4); the backend
 * also accepts an array form. Send {} (or []) to clear.
 */
export async function putTutorLanguages(
  languages: Record<string, number> | { language: string; proficiency?: number | null }[],
): Promise<void> {
  await apiFetch("/api/tutor/languages", { method: "PUT", body: { languages } });
}
