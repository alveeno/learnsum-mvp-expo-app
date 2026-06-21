import { ApiError, postOnboarding, type OnboardingResult } from "../../lib/api";
import { getStored } from "./onboardingStore";
import { type FormatId, type Prefs } from "./PreferencesScreen";

/**
 * Build the tutor `POST /api/onboarding` parcel from the in-memory onboarding
 * store, and submit it.
 *
 * Mirrors the store keys/shapes that TutorProfileConfirm reads (TutorAbout /
 * TutorTeachLevels / TutorCatSel / TutorSD / TutorPrefs). The backend re-maps
 * subject slugs → ids and gender aliases, so we send the app's own values.
 *
 * Notes on the mapping decisions:
 *  - `slug` is derived from the name (the app never collects a handle); on a
 *    collision we retry with a numeric suffix.
 *  - `university` is the first University-level school entered.
 *  - Per-subject `format` + `districts` are sent (backend migration 0016 stores
 *    them); the tutor-level `format` is a *collapsed* value (matching reads it).
 *  - `current_studies` is derived from education entries flagged "ongoing".
 *  - `exam_results` stays null — the app folds exam grades into `qualifications`.
 */

// ---- store shapes (mirror TutorProfileConfirm / TutorAbout / TutorSD) --------
type LevelId = "kindergarten" | "primary" | "secondary" | "university";
type SchoolEntry = { institution: string; qualification: string; score: string; ongoing?: boolean };
type EduByLevel = Record<LevelId, SchoolEntry[]>;
type Interest = { catId: string; subId: string; label?: string; category?: string };
type Detail = {
  years: string;
  pay: number;
  format: FormatId;
  districts: string[];
  achievements: string[];
  experiences: unknown[];
  quals: unknown[];
};

const EMPTY_EDU: EduByLevel = { kindergarten: [], primary: [], secondary: [], university: [] };
const DEFAULT_DETAIL: Detail = {
  years: "0",
  pay: 0,
  format: "both",
  districts: [],
  achievements: [],
  experiences: [],
  quals: [],
};

// ---- payload type ------------------------------------------------------------
export interface TutorOnboardingBody {
  profile: { first_name?: string; last_name?: string; gender?: string | null };
  tutor: {
    slug: string;
    university: string | null;
    format: FormatId | null;
    levels: string[];
    education: Partial<EduByLevel> | null;
    current_studies: { institution: string; programme: string; level: LevelId }[];
    subjects: Array<{
      subcategory: string;
      years: string;
      pay: number;
      format: FormatId;
      districts: string[];
      achievements: string[];
      qualifications: unknown[];
      exam_results: null;
      experiences: unknown[];
    }>;
    languages: Record<string, number>;
    availability: Record<string, { start: number; end: number }[]>;
  };
}

// ---- helpers -----------------------------------------------------------------
function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Collapse per-subject formats into one tutor-level format (matching reads it). */
function collapseFormat(formats: FormatId[]): FormatId | null {
  const set = new Set(formats);
  if (set.size === 0) return null;
  if (set.size === 1) return [...set][0];
  return "both";
}

function readStore() {
  return {
    firstName: getStored<string>("tutor:about:firstName", "").trim(),
    lastName: getStored<string>("tutor:about:lastName", "").trim(),
    gender: getStored<string | null>("tutor:about:gender", null),
    eduByLevel: getStored<EduByLevel>("tutor:about:eduByLevel", EMPTY_EDU),
    levels: [...getStored<Set<string>>("tutor:levels", new Set<string>())],
    interests: getStored<Interest[]>("tutor:interests", []).filter((it) => it.catId && it.subId),
    details: getStored<Record<string, Detail>>("tutor:sd:details", {}),
    prefs: getStored<Prefs | null>("tutor:prefs", null),
  };
}

export function deriveTutorSlug(): string {
  const first = getStored<string>("tutor:about:firstName", "").trim();
  const last = getStored<string>("tutor:about:lastName", "").trim();
  return slugify(`${first} ${last}`) || "tutor";
}

// ---- builder -----------------------------------------------------------------
export function buildTutorPayload(slug: string): TutorOnboardingBody {
  const s = readStore();
  const detailFor = (it: Interest) => s.details[`${it.catId}:${it.subId}`] ?? DEFAULT_DETAIL;

  const subjects = s.interests.map((it) => {
    const d = detailFor(it);
    return {
      subcategory: it.subId,
      years: d.years,
      pay: d.pay,
      format: d.format,
      districts: d.format === "online" ? [] : d.districts,
      achievements: d.achievements.filter((a) => a.trim().length > 0),
      qualifications: d.quals,
      exam_results: null,
      experiences: d.experiences,
    };
  });

  const university =
    (s.eduByLevel.university ?? []).find((e) => e.institution.trim())?.institution.trim() ?? null;

  // education: keep levels with entries; current_studies: the ongoing ones.
  const education: Partial<EduByLevel> = {};
  const currentStudies: { institution: string; programme: string; level: LevelId }[] = [];
  (Object.keys(s.eduByLevel) as LevelId[]).forEach((lvl) => {
    const entries = (s.eduByLevel[lvl] ?? []).filter((e) => e.institution.trim());
    if (entries.length) education[lvl] = entries;
    entries
      .filter((e) => e.ongoing)
      .forEach((e) =>
        currentStudies.push({ institution: e.institution.trim(), programme: e.qualification.trim(), level: lvl }),
      );
  });

  const langLevels = s.prefs?.langLevels ?? {};
  const languages: Record<string, number> = {};
  for (const [id, lvl] of Object.entries(langLevels)) if (lvl > 0) languages[id] = lvl;

  return {
    profile: {
      first_name: s.firstName || undefined,
      last_name: s.lastName || undefined,
      gender: s.gender,
    },
    tutor: {
      slug,
      university,
      format: collapseFormat(subjects.map((x) => x.format)),
      levels: s.levels,
      education: Object.keys(education).length ? education : null,
      current_studies: currentStudies,
      subjects,
      languages,
      availability: (s.prefs?.avail ?? {}) as Record<string, { start: number; end: number }[]>,
    },
  };
}

/**
 * Build + POST the tutor onboarding. If the derived slug is already taken
 * (409), retry with a numeric suffix (the save is transactional, so a failed
 * attempt leaves onboarding incomplete and safe to retry). Returns the backend
 * result, including `skipped`.
 */
export async function submitTutorOnboarding(): Promise<OnboardingResult> {
  const base = deriveTutorSlug();
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    try {
      return await postOnboarding(buildTutorPayload(slug));
    } catch (err) {
      lastErr = err;
      const slugTaken =
        err instanceof ApiError && err.status === 409 && /slug|url|taken/i.test(err.message);
      if (!slugTaken) throw err;
    }
  }
  throw lastErr;
}
