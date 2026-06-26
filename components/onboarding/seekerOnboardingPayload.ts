import { ApiError, postOnboarding, type OnboardingResult } from "../../lib/api";
import { getStored } from "./onboardingStore";
import { type Prefs } from "./PreferencesScreen";
import { type Interest } from "../../app/onboarding/StudentCatSel";

/**
 * Build + submit the STUDENT / PARENT `POST /api/onboarding` parcel from the
 * in-memory onboarding store — the seeker analogue of `tutorOnboardingPayload`.
 *
 * The account is created first by signup() on the CreateAccount step; this then
 * saves the collected answers. The backend's `POST /api/onboarding` FULLY
 * supports student + parent (it branches by role and writes via the
 * `complete_onboarding` RPC), so the shape here MUST match that contract:
 *   - student → `{ role, profile, student: { school_level, format, districts,
 *       languages, interests, availability } }`
 *   - parent  → `{ role, profile, parent: { searching_for_self, children: [{
 *       name, school_level, format, districts, languages, interests, availability }] } }`
 * `interests` are subject **slugs** (== the app's `subId`; the backend re-maps
 * them to UUIDs), and districts stay `"<region>:<Label>"` (the backend maps the
 * labels). `submitSeekerOnboarding` stays BEST-EFFORT (swallows errors →
 * `saved:false`) so a network blip can't block onboarding completion — but with
 * the correct shape it now genuinely PERSISTS on success.
 */

type ChildInput = { name: string; level: string | null };
export type SeekerRole = "student" | "parent";

// One seeker section (a student, or one parent child) in the exact shape the
// backend reads: school_level + format + districts + languages + interests
// (subject slugs) + availability. (tutoring `type` and `budget` aren't collected
// in seeker onboarding, so they're omitted → the backend stores null.)
function seekerSection(level: string | null, interests: Interest[], pf: Prefs | null) {
  return {
    school_level: level,
    format: pf?.format ?? null,
    districts: pf?.format === "online" ? [] : pf?.districts ?? [],
    languages: [...(pf?.langs ?? []), ...(pf?.moreLangs ?? [])],
    // Subject SLUGS (the backend maps slug → subcategory UUID). Drop custom
    // user-typed subjects (no real slug) — the backend would skip them anyway.
    interests: interests.filter((it) => it.catId && it.subId).map((it) => it.subId),
    availability: (pf?.avail ?? {}) as Record<string, { start: number; end: number }[]>,
  };
}

export function buildStudentPayload() {
  return {
    role: "student",
    profile: {},
    student: seekerSection(
      getStored<string | null>("student:eduLevel", null),
      getStored<Interest[]>("student:interests", []),
      getStored<Prefs | null>("student:prefs", null),
    ),
  };
}

export function buildParentPayload() {
  const roster = getStored<ChildInput[]>("parent:roster", []);
  return {
    role: "parent",
    profile: {},
    parent: {
      searching_for_self: false,
      children: roster.map((child, i) => ({
        name: child.name,
        ...seekerSection(
          child.level,
          getStored<Interest[]>(`parent:child:${i}:interests`, []),
          getStored<Prefs | null>(`parent:child:${i}:prefs`, null),
        ),
      })),
    },
  };
}

export type SeekerSaveResult = { saved: boolean; result?: OnboardingResult; error?: unknown };

/** Best-effort save — never throws; returns `saved:false` on any failure. */
export async function submitSeekerOnboarding(role: SeekerRole): Promise<SeekerSaveResult> {
  const body = role === "parent" ? buildParentPayload() : buildStudentPayload();
  try {
    const result = await postOnboarding(body);
    return { saved: true, result };
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        "[seeker onboarding] save failed (continuing anyway):",
        error instanceof ApiError ? error.message : error,
      );
    }
    return { saved: false, error };
  }
}
