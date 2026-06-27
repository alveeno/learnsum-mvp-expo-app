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
  /** The tutor's profile id — used as participant_id to start an in-app chat. */
  id?: string;
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

/** A lean browse/search card from GET /api/tutors (same shape as a feed card). */
export interface BrowseTutorCard {
  slug: string;
  bio: string | null;
  tutoring_format: string | null;
  tutoring_type: string | null;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
  district: string | null;
  categories: { id: string; name_en: string; name_zh: string; slug: string }[];
}

/**
 * Structured browse filters for GET /api/tutors. Arrays are sent comma-separated
 * (the backend matches ANY). `district`/`gender`/`language` are the multi-value
 * sets; districts must be hk_district ENUM CODES (e.g. "CentralWestern"), not the
 * "Central & Western" display label — map first (see hkDistricts.districtEnumFromName).
 * Omit a field to leave that dimension unfiltered. There is no free-text search on
 * the backend, so the Search screen narrows the returned cards by text client-side.
 */
export interface TutorSearchParams {
  district?: string[];
  gender?: string[];
  language?: string[];
  subcategory_id?: string;
  tutoring_format?: "in_person" | "online" | "both";
  tutoring_type?: "individual" | "group" | "both";
  min_rate?: number;
  max_rate?: number;
  min_age?: number;
  max_age?: number;
  page?: number;
}

export interface TutorSearchResult {
  tutors: BrowseTutorCard[];
  pagination: { page: number; page_size: number; total: number; has_more: boolean };
}

/** Browse/search published tutors with the full structured filter set. */
export async function searchTutors(params: TutorSearchParams = {}): Promise<TutorSearchResult> {
  return apiFetch<TutorSearchResult>("/api/tutors", {
    query: {
      district: params.district?.length ? params.district.join(",") : undefined,
      gender: params.gender?.length ? params.gender.join(",") : undefined,
      language: params.language?.length ? params.language.join(",") : undefined,
      subcategory_id: params.subcategory_id,
      tutoring_format: params.tutoring_format,
      tutoring_type: params.tutoring_type,
      min_rate: params.min_rate,
      max_rate: params.max_rate,
      min_age: params.min_age,
      max_age: params.max_age,
      page: params.page,
    },
  });
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
  /** Per-subject teaching levels (school_level codes) — backend migration 0020. */
  levels?: string[];
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
