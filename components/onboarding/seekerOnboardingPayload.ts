import { ApiError, postOnboarding, type OnboardingResult } from "../../lib/api";
import { getStored } from "./onboardingStore";
import { type Prefs } from "./PreferencesScreen";
import { type Interest } from "../../app/onboarding/StudentCatSel";

/**
 * Build + submit the STUDENT / PARENT `POST /api/onboarding` parcel from the
 * in-memory onboarding store — the seeker analogue of `tutorOnboardingPayload`.
 *
 * The account is created first by signup() on the CreateAccount step; this then
 * saves the collected answers. The backend's onboarding endpoint is currently
 * tutor-shaped (see CLAUDE.md), so student/parent support may not exist yet —
 * `submitSeekerOnboarding` is therefore BEST-EFFORT: it swallows any failure
 * (network, or the backend rejecting the shape) and reports `saved:false` rather
 * than throwing, so onboarding still completes. Mirrors the tutor flow's offline
 * fall-through. Aligning the exact shape with the backend is a later step.
 */

type ChildInput = { name: string; level: string | null };
export type SeekerRole = "student" | "parent";

type InterestOut = { subcategory: string; category: string; label?: string };
type PrefsOut = {
  format: Prefs["format"];
  districts: string[];
  languages: string[];
  availability: Record<string, { start: number; end: number }[]>;
};

function interestsOut(list: Interest[]): InterestOut[] {
  return list
    .filter((it) => it.catId && it.subId)
    .map((it) => ({ subcategory: it.subId, category: it.catId, label: it.label }));
}

function prefsOut(pf: Prefs | null): PrefsOut {
  return {
    format: pf?.format ?? null,
    districts: pf?.format === "online" ? [] : pf?.districts ?? [],
    languages: [...(pf?.langs ?? []), ...(pf?.moreLangs ?? [])],
    availability: (pf?.avail ?? {}) as PrefsOut["availability"],
  };
}

export function buildStudentPayload() {
  return {
    role: "student",
    profile: {},
    student: {
      education_level: getStored<string | null>("student:eduLevel", null),
      interests: interestsOut(getStored<Interest[]>("student:interests", [])),
      ...prefsOut(getStored<Prefs | null>("student:prefs", null)),
    },
  };
}

export function buildParentPayload() {
  const roster = getStored<ChildInput[]>("parent:roster", []);
  return {
    role: "parent",
    profile: {},
    children: roster.map((child, i) => ({
      name: child.name,
      education_level: child.level,
      interests: interestsOut(getStored<Interest[]>(`parent:child:${i}:interests`, [])),
      ...prefsOut(getStored<Prefs | null>(`parent:child:${i}:prefs`, null)),
    })),
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
