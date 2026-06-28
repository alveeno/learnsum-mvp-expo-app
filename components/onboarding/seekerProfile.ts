import {
  ApiError,
  patchProfileMe,
  type MeResponse,
  type ProfileMeUpdate,
} from "../../lib/api";
import { getStored, setStored } from "./onboardingStore";
import { EMPTY_EDU, type EduByLevel } from "./educationTypes";

/**
 * Seeker (student / parent) profile — the analogue of the tutor edit store, for
 * the shared `SeekerAbout` screen.
 *
 * The screen reads/writes the `seeker:about:*` store keys below; education reuses
 * the student onboarding key so the level stays a single source of truth.
 *
 *   - `buildSeekerProfileBlock()` → the `profile` block sent in the one-shot
 *     `POST /api/onboarding` save (seekerOnboardingPayload). Like the tutor
 *     payload, it sends the app's OWN gender value (the backend maps aliases).
 *   - `hydrateSeekerAboutFromMe(me)` → seed the store from the caller's real
 *     saved profile before opening the screen in edit mode.
 *   - `saveSeekerProfile(role)` → flush the edited store via PATCH /api/profiles/me
 *     (here the gender IS mapped to the backend enum, as that route expects).
 *
 * `bio` / `phone` / an editable `school_level` need backend support (see the
 * backend gap notes in CLAUDE.md); they're sent forward-compatibly.
 */

// Store keys the SeekerAbout screen reads/writes.
export const SEEKER_ABOUT = {
  firstName: "seeker:about:firstName",
  lastName: "seeker:about:lastName",
  gender: "seeker:about:gender",
  avatarUrl: "seeker:about:avatarUrl",
  bio: "seeker:about:bio",
  phone: "seeker:about:phone",
} as const;
// Education reuses the student onboarding key (single source of truth).
export const SEEKER_EDU_KEY = "student:eduLevel";
// Full per-level school history (EduByLevel) — students only; persisted to
// student_profiles.education.
export const SEEKER_EDU_HISTORY_KEY = "seeker:about:eduByLevel";

// App gender code → backend gender_type enum (used by the PATCH edit path).
export const GENDER_TO_BACKEND: Record<string, string> = {
  male: "male",
  female: "female",
  lgbtq: "lgbt",
  na: "prefer_not_to_say",
};
// Backend gender_type enum → the app's gender keys (used when hydrating).
export const GENDER_TO_APP: Record<string, string> = {
  male: "male",
  female: "female",
  lgbt: "lgbtq",
  prefer_not_to_say: "na",
  other: "na",
};

// Split a stored full_name/display_name back into first + last. Onboarding sets
// display_name = first name and full_name = "first last", so the startsWith
// branch is the normal path; the rest is a defensive fallback.
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

const str = (key: string) => getStored<string>(key, "").trim();

/** The `profile` block sent in the one-shot onboarding save (sends app gender). */
export function buildSeekerProfileBlock(): Record<string, string | null> {
  const gender = getStored<string | null>(SEEKER_ABOUT.gender, null);
  return {
    first_name: str(SEEKER_ABOUT.firstName) || null,
    last_name: str(SEEKER_ABOUT.lastName) || null,
    gender, // app value — backend maps aliases (matches the tutor payload)
    avatar_url: str(SEEKER_ABOUT.avatarUrl) || null,
    bio: str(SEEKER_ABOUT.bio) || null,
    phone: str(SEEKER_ABOUT.phone) || null,
  };
}

/**
 * The seeker's saved education level (student `school_level`). `GET /api/auth/me`
 * nests the student detail under `detail.student_profile` (see the backend
 * auth/me route), so read it there — not at `detail.school_level`.
 */
export function schoolLevelFromMe(me: MeResponse): string | null {
  const sp = (me.detail as { student_profile?: { school_level?: unknown } } | null)?.student_profile;
  return sp && typeof sp.school_level === "string" ? sp.school_level : null;
}

// Coerce a backend `education` jsonb into a complete EduByLevel (all 4 keys).
function normEdu(value: unknown): EduByLevel {
  const e = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Partial<EduByLevel>;
  return {
    kindergarten: Array.isArray(e.kindergarten) ? e.kindergarten : [],
    primary: Array.isArray(e.primary) ? e.primary : [],
    secondary: Array.isArray(e.secondary) ? e.secondary : [],
    university: Array.isArray(e.university) ? e.university : [],
  };
}

/** The seeker's saved school history (student_profile.education). */
export function eduHistoryFromMe(me: MeResponse): EduByLevel {
  const sp = (me.detail as { student_profile?: { education?: unknown } } | null)?.student_profile;
  return normEdu(sp?.education);
}

/** Seed the `seeker:about:*` store keys from the caller's real saved profile. */
export function hydrateSeekerAboutFromMe(me: MeResponse): void {
  const p = me.profile;
  const { first, last } = splitName(p.full_name || "", p.display_name || "");
  setStored(SEEKER_ABOUT.firstName, first);
  setStored(SEEKER_ABOUT.lastName, last);
  const g = typeof p.gender === "string" ? p.gender : "";
  setStored<string | null>(SEEKER_ABOUT.gender, GENDER_TO_APP[g] ?? null);
  setStored(SEEKER_ABOUT.avatarUrl, typeof p.avatar_url === "string" ? p.avatar_url : "");
  setStored(SEEKER_ABOUT.bio, typeof p.bio === "string" ? p.bio : "");
  setStored(SEEKER_ABOUT.phone, typeof p.phone === "string" ? p.phone : "");
  const level = schoolLevelFromMe(me);
  if (level) setStored<string | null>(SEEKER_EDU_KEY, level);
  setStored<EduByLevel>(SEEKER_EDU_HISTORY_KEY, eduHistoryFromMe(me));
}

const DIRTY_KEY = "seeker:profile:dirty";

/** Mark the Account tab stale so it refetches when it regains focus. */
export function markSeekerProfileDirty(): void {
  setStored<boolean>(DIRTY_KEY, true);
}
/** Read-and-clear the stale flag. */
export function consumeSeekerProfileDirty(): boolean {
  const v = getStored<boolean>(DIRTY_KEY, false);
  if (v) setStored<boolean>(DIRTY_KEY, false);
  return v;
}

/** Flush the edited seeker profile to the backend. In __DEV__ an offline failure is a no-op. */
export async function saveSeekerProfile(role: "student" | "parent"): Promise<void> {
  const firstName = str(SEEKER_ABOUT.firstName);
  const lastName = str(SEEKER_ABOUT.lastName);
  const gender = getStored<string | null>(SEEKER_ABOUT.gender, null);
  const avatarUrl = str(SEEKER_ABOUT.avatarUrl);
  const bio = str(SEEKER_ABOUT.bio);
  const phone = str(SEEKER_ABOUT.phone);
  const level = getStored<string | null>(SEEKER_EDU_KEY, null);
  const eduHistory = getStored<EduByLevel>(SEEKER_EDU_HISTORY_KEY, EMPTY_EDU);

  const fields: ProfileMeUpdate = {
    avatar_url: avatarUrl || null, // always sent so removal persists
    bio: bio || null,
    phone: phone || null,
  };
  if (firstName || lastName) {
    fields.full_name = `${firstName} ${lastName}`.trim();
    fields.display_name = firstName || lastName;
  }
  if (gender) fields.gender = GENDER_TO_BACKEND[gender] ?? null;
  // Education is only meaningful for students (a parent's level belongs to their
  // child): the single level (for matching) + the full school history.
  if (role === "student") {
    fields.student = { education: eduHistory };
    if (level) fields.student.school_level = level;
  }

  try {
    await patchProfileMe(fields);
  } catch (err) {
    if (err instanceof ApiError && err.isNetworkError && __DEV__) {
      markSeekerProfileDirty();
      return;
    }
    throw err;
  }
  markSeekerProfileDirty();
}
