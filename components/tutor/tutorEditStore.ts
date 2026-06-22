import {
  ApiError,
  getSubcategoryIndex,
  patchProfileMe,
  patchTutor,
  putAvailability,
  putTutorLanguages,
  putTutorSubjects,
  type AvailabilityMap,
  type MeResponse,
  type TutorSubjectInput,
} from "../../lib/api";
import { subColorFor, type Interest } from "../../app/onboarding/StudentCatSel";
import { districtEnumFromKey, districtKeyFromEnum } from "../onboarding/hkDistricts";
import { getStored, setStored } from "../onboarding/onboardingStore";

/**
 * Pre-fill the in-memory onboarding store from a tutor's REAL saved profile, so
 * the "Change preferences" edit screens open showing their current data (the
 * store is otherwise empty for a returning tutor — session-only).
 *
 * This is essential: the edit save (saveTutorEdits) full-REPLACES each section,
 * so if a screen opened blank, saving would wipe that section. Hydrating every
 * key first means untouched sections are saved back unchanged.
 *
 * Reads `GET /api/auth/me` (profile + tutor_profile + subjects + languages) and
 * `GET /api/availability`, and writes the same store keys the onboarding screens
 * read (TutorAbout / TutorTeachLevels / TutorCatSel / TutorSD / TutorPrefs).
 * Mirrors the shapes in tutorOnboardingPayload.ts (the reverse direction).
 */

// ---- store shapes (mirror the onboarding screens) ---------------------------
type LevelId = "kindergarten" | "primary" | "secondary" | "university";
type SchoolEntry = { institution: string; qualification: string; score: string; ongoing: boolean };
type EduByLevel = Record<LevelId, SchoolEntry[]>;
type Detail = {
  years: string;
  pay: number;
  format: "in_person" | "online" | "both";
  districts: string[];
  achievements: string[];
  experiences: unknown[];
  quals: unknown[];
};
type Prefs = {
  format: "in_person" | "online" | "both" | null;
  districts: string[];
  langs: string[];
  moreLangs: string[];
  langLevels: Record<string, number>;
  avail: Record<string, { start: number; end: number }[]>;
};

const EMPTY_EDU: EduByLevel = { kindergarten: [], primary: [], secondary: [], university: [] };
const EMPTY_AVAIL: Prefs["avail"] = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
// Blank defaults for a subject added during editing but never given details.
const DEFAULT_SAVE_DETAIL: Detail = {
  years: "0",
  pay: 0,
  format: "both",
  districts: [],
  achievements: [],
  experiences: [],
  quals: [],
};

// ---- backend shapes (subset of GET /api/auth/me tutor detail) ---------------
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
    teaching_levels?: string[] | null;
    education?: unknown;
    whatsapp_number?: string | null;
    wechat_id?: string | null;
  } | null;
  subjects?: RawSubject[];
  languages?: { language?: string | null; proficiency?: number | null }[];
}

const isFormat = (v: unknown): v is Detail["format"] =>
  v === "in_person" || v === "online" || v === "both";

// Backend gender_type → the app's TutorAbout gender keys.
const GENDER_TO_APP: Record<string, string> = {
  male: "male",
  female: "female",
  lgbt: "lgbtq",
  prefer_not_to_say: "na",
  other: "na",
};

// Onboarding stores achievements as { en: "a; b", zh: "" } → back to a string[].
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

// Split a stored full_name/display_name back into first + last for TutorAbout.
// Onboarding sets display_name = first name and full_name = "first last", so the
// startsWith branch is the normal path; the rest is a defensive fallback.
function splitName(full: string, display: string): { first: string; last: string } {
  const f = full.trim();
  const d = display.trim();
  if (d && f.toLowerCase().startsWith(d.toLowerCase())) {
    return { first: d, last: f.slice(d.length).trim() };
  }
  const parts = f.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: d || parts[0] || "", last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

/** Write all `tutor:*` onboarding store keys from the backend profile. */
export function hydrateTutorStoreFromMe(me: MeResponse, availability: AvailabilityMap): void {
  const detail = (me.detail ?? {}) as RawTutorDetail;
  const tp = detail.tutor_profile ?? {};

  // --- TutorAbout: name / bio / gender / education / photo ---
  const { first, last } = splitName(
    me.profile.full_name || "",
    me.profile.display_name || "",
  );
  setStored("tutor:about:firstName", first);
  setStored("tutor:about:lastName", last);
  setStored("tutor:about:bio", tp.bio ?? "");
  setStored("tutor:about:whatsapp", tp.whatsapp_number ?? "");
  setStored("tutor:about:wechat", tp.wechat_id ?? "");
  const g = typeof me.profile.gender === "string" ? me.profile.gender : "";
  setStored<string | null>("tutor:about:gender", GENDER_TO_APP[g] ?? null);
  setStored<EduByLevel>("tutor:about:eduByLevel", normEdu(tp.education));
  setStored<boolean>("tutor:about:photo", !!me.profile.avatar_url);

  // --- TutorTeachLevels: the teaching-levels Set ---
  const levels = Array.isArray(tp.teaching_levels) ? tp.teaching_levels : [];
  setStored<Set<string>>("tutor:levels", new Set(levels));

  // --- TutorCatSel + TutorSD: interests + per-subject details ---
  const interests: Interest[] = [];
  const details: Record<string, Detail> = {};
  for (const sub of detail.subjects ?? []) {
    const sc = sub.subcategories;
    const subId = sc?.slug ?? "";
    if (!subId) continue;
    const catId = sc?.categories?.slug ?? "";
    interests.push({
      catId,
      subId,
      label: sc?.name_en ?? subId,
      category: sc?.categories?.name_en ?? undefined,
      color: subColorFor(catId, subId),
    });
    details[`${catId}:${subId}`] = {
      years: String(sub.years_experience ?? "0"),
      pay: sub.hourly_rate_min ?? 0,
      format: isFormat(sub.format) ? sub.format : "both",
      districts: Array.isArray(sub.districts)
        ? sub.districts.map(districtKeyFromEnum).filter((k): k is string => !!k)
        : [],
      achievements: parseAchievements(sub.achievements),
      experiences: Array.isArray(sub.experience) ? sub.experience : [],
      quals: Array.isArray(sub.qualifications) ? sub.qualifications : [],
    };
  }
  setStored<Interest[]>("tutor:interests", interests);
  setStored<Record<string, Detail>>("tutor:sd:details", details);

  // --- TutorPrefs: languages (proficiency map) + availability ---
  const langLevels: Record<string, number> = {};
  for (const l of detail.languages ?? []) {
    if (l.language && l.proficiency) langLevels[l.language] = l.proficiency;
  }
  const avail: Prefs["avail"] = { ...EMPTY_AVAIL };
  for (const [day, ranges] of Object.entries(availability ?? {})) {
    if (Array.isArray(ranges)) avail[day] = ranges;
  }
  // Tutors collect format + location per subject (not on TutorPrefs), so those
  // stay empty here — TutorPrefs is just availability + languages.
  setStored<Prefs>("tutor:prefs", {
    format: null,
    districts: [],
    langs: [],
    moreLangs: [],
    langLevels,
    avail,
  });

  // The tutor's slug — needed by saveTutorEdits (PATCH /api/tutors/[slug]).
  setStored<string>("tutor:slug", tp.slug ?? "");
}

// ---------------------------------------------------------------------------
// SAVE — flush the edited store back to the backend, all at once.
//
// The edit screens write to the same store keys hydrated above. When the edit
// queue finishes (see the TutorEditSave screen), this reads the store and fires
// the five edit endpoints, each a full-replace of its section:
//   PATCH /api/profiles/me     — name + gender
//   PATCH /api/tutors/[slug]    — bio, university, levels, education
//   PUT   /api/tutor/subjects   — per-subject details (+ format/districts)
//   PUT   /api/tutor/languages  — teaching languages
//   PUT   /api/availability     — weekly availability
// Because hydrate seeded EVERY section, untouched ones are saved back unchanged.
// In __DEV__ a network failure is swallowed (offline demo), matching the rest of
// the app; any other error propagates so the save screen can show it.
// ---------------------------------------------------------------------------

const GENDER_TO_BACKEND: Record<string, string> = {
  male: "male",
  female: "female",
  lgbtq: "lgbt",
  na: "prefer_not_to_say",
};

const DIRTY_KEY = "tutor:profile:dirty";

/** Mark the own-profile view stale so it refetches when it regains focus. */
export function markProfileDirty(): void {
  setStored<boolean>(DIRTY_KEY, true);
}
/** Read-and-clear the stale flag. */
export function consumeProfileDirty(): boolean {
  const v = getStored<boolean>(DIRTY_KEY, false);
  if (v) setStored<boolean>(DIRTY_KEY, false);
  return v;
}

function parseYears(v: string): number | null {
  const n = parseInt(String(v).replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

/** Collapse the per-subject formats into one tutor-level value (for matching). */
function collapseFormat(formats: Detail["format"][]): "in_person" | "online" | "both" | null {
  const set = new Set(formats);
  if (set.size === 0) return null;
  if (set.size === 1) return [...set][0];
  return "both";
}

// In __DEV__, treat an unreachable backend as a no-op (offline demo).
async function tolerant(run: () => Promise<unknown>): Promise<void> {
  try {
    await run();
  } catch (err) {
    if (err instanceof ApiError && err.isNetworkError && __DEV__) return;
    throw err;
  }
}

/** Flush all edited sections to the backend. Throws on a real (non-offline) error. */
export async function saveTutorEdits(): Promise<void> {
  const firstName = getStored<string>("tutor:about:firstName", "").trim();
  const lastName = getStored<string>("tutor:about:lastName", "").trim();
  const gender = getStored<string | null>("tutor:about:gender", null);
  const bio = getStored<string>("tutor:about:bio", "");
  const whatsapp = getStored<string>("tutor:about:whatsapp", "").trim();
  const wechat = getStored<string>("tutor:about:wechat", "").trim();
  const eduByLevel = getStored<EduByLevel>("tutor:about:eduByLevel", EMPTY_EDU);
  const levels = [...getStored<Set<string>>("tutor:levels", new Set<string>())];
  const interests = getStored<Interest[]>("tutor:interests", []).filter((it) => it.catId && it.subId);
  const details = getStored<Record<string, Detail>>("tutor:sd:details", {});
  const prefs = getStored<Prefs | null>("tutor:prefs", null);
  const slug = getStored<string>("tutor:slug", "");

  // 1) profiles/me — name + gender.
  const profileFields: Record<string, string | null> = {};
  if (firstName || lastName) {
    profileFields.full_name = `${firstName} ${lastName}`.trim();
    profileFields.display_name = firstName || lastName;
  }
  if (gender) profileFields.gender = GENDER_TO_BACKEND[gender] ?? null;
  if (Object.keys(profileFields).length) {
    await tolerant(() => patchProfileMe(profileFields));
  }

  // 2) tutors/[slug] — bio, university, teaching levels, education.
  const detailFor = (it: Interest) => details[`${it.catId}:${it.subId}`];
  const subjectFormats = interests
    .map((it) => detailFor(it)?.format)
    .filter((f): f is Detail["format"] => !!f);

  if (slug) {
    const education: Partial<EduByLevel> = {};
    const currentStudies: { institution: string; programme: string; level: LevelId }[] = [];
    (Object.keys(eduByLevel) as LevelId[]).forEach((lvl) => {
      const entries = (eduByLevel[lvl] ?? []).filter((e) => e.institution.trim());
      if (entries.length) education[lvl] = entries;
      entries
        .filter((e) => e.ongoing)
        .forEach((e) =>
          currentStudies.push({ institution: e.institution.trim(), programme: e.qualification.trim(), level: lvl }),
        );
    });
    const university =
      (eduByLevel.university ?? []).find((e) => e.institution.trim())?.institution.trim() ?? null;

    await tolerant(() =>
      patchTutor(slug, {
        bio: bio.trim() || null,
        whatsapp_number: whatsapp || null,
        wechat_id: wechat || null,
        university,
        teaching_levels: levels,
        education: Object.keys(education).length ? education : null,
        current_studies: currentStudies.length ? currentStudies : null,
        tutoring_format: collapseFormat(subjectFormats),
      }),
    );
  }

  // 3) tutor/subjects — full replace (resolve slug → subcategory UUID).
  const index = await getSubcategoryIndex();
  const subjects: TutorSubjectInput[] = [];
  for (const it of interests) {
    const id = index.get(it.subId)?.id;
    if (!id) continue; // a custom/unknown subject the backend can't store
    // A subject added during editing but never opened in "Strengths & details"
    // has no detail yet — save it with blank defaults rather than dropping it.
    const d = detailFor(it) ?? DEFAULT_SAVE_DETAIL;
    const achievements = d.achievements.map((a) => a.trim()).filter(Boolean);
    subjects.push({
      subcategory_id: id,
      years_experience: parseYears(d.years),
      hourly_rate_min: d.pay,
      hourly_rate_max: d.pay,
      achievements: achievements.length ? { en: achievements.join("; "), zh: "" } : null,
      qualifications: d.quals.filter(
        (q): q is Record<string, unknown> => !!q && typeof q === "object" && !!(q as { type?: unknown }).type,
      ),
      exam_results: null,
      experience: d.experiences,
      format: d.format,
      districts:
        d.format === "online"
          ? []
          : d.districts.map(districtEnumFromKey).filter((c): c is string => !!c),
    });
  }
  await tolerant(() => putTutorSubjects(subjects));

  // 4) tutor/languages — the proficiency map (empty clears all).
  await tolerant(() => putTutorLanguages(prefs?.langLevels ?? {}));

  // 5) availability — weekly ranges (drop empty days).
  const avail: AvailabilityMap = {};
  for (const [day, ranges] of Object.entries(prefs?.avail ?? {})) {
    if (Array.isArray(ranges) && ranges.length) avail[day] = ranges;
  }
  await tolerant(() => putAvailability(avail));

  markProfileDirty();
}
