import { type FormatId } from "../onboarding/PreferencesScreen";
import { type Interest } from "../../app/onboarding/StudentCatSel";
import { type MeResponse } from "../../lib/api";
import {
  EMPTY_EDU,
  type Detail,
  type EduByLevel,
  type Experience,
  type ProfileBodyData,
  type Qualification,
} from "./ProfileBody";

/**
 * Maps backend tutor data → the normalized `ProfileBodyData` that ProfileBody
 * renders. Shared by the own Profile tab (GET /api/auth/me) and, later, the
 * "view another tutor" overlay (GET /api/tutors/[slug]) — both return the same
 * per-subject shape.
 */

// hk_district enum code → display name (the backend returns enum codes).
const DISTRICT_LABELS: Record<string, string> = {
  CentralWestern: "Central & Western", WanChai: "Wan Chai", Eastern: "Eastern", Southern: "Southern",
  YauTsimMong: "Yau Tsim Mong", ShamshuiPo: "Sham Shui Po", KowloonCity: "Kowloon City",
  WongTaiSin: "Wong Tai Sin", KwunTong: "Kwun Tong", KwaiTsing: "Kwai Tsing", TsuenWan: "Tsuen Wan",
  TuenMun: "Tuen Mun", YuenLong: "Yuen Long", North: "North", TaiPo: "Tai Po", SaiKung: "Sai Kung",
  ShaTin: "Sha Tin", Islands: "Islands",
};

// Backend per-subject shape (tutor_subcategories row, as returned by me/[slug]).
interface RawSubject {
  years_experience?: number | null;
  hourly_rate_min?: number | null;
  format?: string | null;
  districts?: string[] | null;
  achievements?: unknown;
  qualifications?: unknown;
  experience?: unknown;
  subcategories?: {
    name_en?: string | null;
    slug?: string | null;
    categories?: { slug?: string | null; name_en?: string | null } | null;
  } | null;
}

interface RawTutorDetail {
  tutor_profile?: {
    slug?: string | null;
    bio?: string | null;
    university?: string | null;
    teaching_levels?: string[] | null;
    education?: unknown;
  } | null;
  subjects?: RawSubject[];
  languages?: { language?: string | null; proficiency?: number | null }[];
}

const isFormat = (v: unknown): v is FormatId => v === "in_person" || v === "online" || v === "both";

// Onboarding stores achievements as { en: "a; b", zh: "" }; edits may store an
// array. Accept both → string[].
function parseAchievements(a: unknown): string[] {
  if (Array.isArray(a)) return a.filter((x): x is string => typeof x === "string");
  if (a && typeof a === "object" && "en" in a) {
    const en = (a as { en?: unknown }).en;
    if (typeof en === "string" && en.trim()) return en.split(";").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function normEdu(education: unknown): EduByLevel {
  const e = (education && typeof education === "object" && !Array.isArray(education)
    ? education
    : {}) as Partial<EduByLevel>;
  return {
    kindergarten: e.kindergarten ?? [],
    primary: e.primary ?? [],
    secondary: e.secondary ?? [],
    university: e.university ?? [],
  };
}

function subjectToInterestDetail(sub: RawSubject): { interest: Interest; detail: Detail } | null {
  const sc = sub.subcategories;
  const subId = sc?.slug ?? "";
  if (!subId) return null;
  const cat = sc?.categories;
  const interest: Interest = {
    catId: cat?.slug ?? "",
    subId,
    label: sc?.name_en ?? subId,
    category: cat?.name_en ?? undefined,
  };
  const detail: Detail = {
    years: String(sub.years_experience ?? "0"),
    pay: sub.hourly_rate_min ?? 0,
    format: isFormat(sub.format) ? sub.format : "both",
    districts: Array.isArray(sub.districts) ? sub.districts.map((c) => DISTRICT_LABELS[c] ?? c) : [],
    achievements: parseAchievements(sub.achievements),
    experiences: (Array.isArray(sub.experience) ? sub.experience : []) as Experience[],
    quals: (Array.isArray(sub.qualifications) ? sub.qualifications : []) as Qualification[],
  };
  return { interest, detail };
}

/** Shared core: build a ProfileBodyData from name/gender + a tutor detail block. */
export function buildProfileBody(
  fullName: string,
  gender: string | null,
  detail: RawTutorDetail,
  avatarUrl?: string | null,
): ProfileBodyData {
  const tp = detail.tutor_profile ?? {};
  const interests: Interest[] = [];
  const details: Record<string, Detail> = {};
  for (const sub of detail.subjects ?? []) {
    const mapped = subjectToInterestDetail(sub);
    if (!mapped) continue;
    interests.push(mapped.interest);
    details[`${mapped.interest.catId}:${mapped.interest.subId}`] = mapped.detail;
  }
  const langLevels: Record<string, number> = {};
  for (const l of detail.languages ?? []) {
    if (l.language) langLevels[l.language] = l.proficiency ?? 0;
  }
  return {
    fullName: fullName || "Your profile",
    gender,
    avatarUrl: avatarUrl ?? undefined,
    bio: tp.bio ?? "",
    levels: Array.isArray(tp.teaching_levels) ? tp.teaching_levels : [],
    interests,
    details,
    langLevels,
    eduByLevel: normEdu(tp.education) ?? EMPTY_EDU,
  };
}

/** Own profile (GET /api/auth/me). Returns the body data + the tutor slug. */
export function mapMeToProfileBody(me: MeResponse): { data: ProfileBodyData; slug: string } {
  const detail = (me.detail ?? {}) as RawTutorDetail;
  const fullName = me.profile.full_name || me.profile.display_name || "";
  const gender = typeof me.profile.gender === "string" ? me.profile.gender : null;
  const avatarUrl = typeof me.profile.avatar_url === "string" ? me.profile.avatar_url : null;
  const data = buildProfileBody(fullName, gender, detail, avatarUrl);
  return { data, slug: detail.tutor_profile?.slug ?? "" };
}

// GET /api/tutors/[slug] shape — profile + subjects/languages are top-level on
// the tutor object (not nested under `tutor_profile`), and there's no gender.
interface RawTutorSlug {
  slug?: string | null;
  bio?: string | null;
  university?: string | null;
  teaching_levels?: string[] | null;
  education?: unknown;
  profiles?: { display_name?: string | null; avatar_url?: string | null } | null;
  tutor_subcategories?: unknown[];
  tutor_languages?: { language?: string | null; proficiency?: number | null }[];
}

/** Another tutor's public profile (GET /api/tutors/[slug]). */
export function mapTutorToProfileBody(tutor: RawTutorSlug): ProfileBodyData {
  const detail: RawTutorDetail = {
    tutor_profile: {
      slug: tutor.slug,
      bio: tutor.bio,
      university: tutor.university,
      teaching_levels: tutor.teaching_levels,
      education: tutor.education,
    },
    subjects: (tutor.tutor_subcategories ?? []) as RawSubject[],
    languages: tutor.tutor_languages ?? [],
  };
  const fullName = tutor.profiles?.display_name || tutor.slug || "";
  // [slug] doesn't return gender; avatar comes from the joined profiles row.
  return buildProfileBody(fullName, null, detail, tutor.profiles?.avatar_url);
}
