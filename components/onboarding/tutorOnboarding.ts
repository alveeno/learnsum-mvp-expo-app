import { router, type Href } from "expo-router";

import { isRegistered, markRegistered } from "../auth/authState";
import { getStored, setStored } from "./onboardingStore";

/**
 * Tutor onboarding completion + "resume the screens you skipped" coordinator.
 *
 * A screen counts as DONE once the user presses Continue on it (per the product
 * decision) — pressing Skip, or never reaching it, leaves it incomplete. State
 * lives in the in-memory onboarding store (session only, like everything else),
 * so a full app reload resets it.
 *
 * Two navigation modes share the tracked screens:
 *  - First-time (linear): each screen keeps its own push to the next screen.
 *  - Resume: tapping the home/profile "set up your profile" banner walks ONLY
 *    the not-completed screens in order (jumping over completed ones) via the
 *    store-driven resolver below, then returns to /tutor-home.
 */

export type TutorStep = "teachLevels" | "catSel" | "sd" | "prefs" | "about";

const FLOW: { id: TutorStep; route: string }[] = [
  { id: "catSel", route: "/onboarding/TutorCatSel" },
  { id: "sd", route: "/onboarding/TutorSD" },
  { id: "prefs", route: "/onboarding/TutorPrefs" },
  { id: "about", route: "/onboarding/TutorAbout" },
];

const DONE_KEY = "tutor:onboarding:done";
const RESUMING_KEY = "tutor:onboarding:resuming";
const EDITING_KEY = "tutor:onboarding:editing"; // string[] route queue while editing from the profile, else null
// Resume ends here (the review + publish sheet), which performs the one-shot
// POST /api/onboarding save — the same save the first-time flow uses.
const CONFIRM_ROUTE = "/onboarding/TutorProfileConfirm";

type DoneMap = Partial<Record<TutorStep, boolean>>;

function getDone(): DoneMap {
  return getStored<DoneMap>(DONE_KEY, {});
}

export function markStepDone(id: TutorStep): void {
  setStored<DoneMap>(DONE_KEY, { ...getDone(), [id]: true });
}

/**
 * Mark every tracked step done. Used when the backend reports the account has
 * already finished onboarding (`profile.onboarding_done`), so a returning tutor
 * who logs in on a fresh session isn't told to "set up your profile" again — the
 * local completion map is session-only and starts empty after a login/reload.
 */
export function markAllStepsDone(): void {
  const all: DoneMap = {};
  for (const s of FLOW) all[s.id] = true;
  setStored<DoneMap>(DONE_KEY, all);
}

export function incompleteSteps(): TutorStep[] {
  const done = getDone();
  return FLOW.filter((s) => !done[s.id]).map((s) => s.id);
}

export function isOnboardingComplete(): boolean {
  return incompleteSteps().length === 0;
}

function nextIncompleteAfter(id: TutorStep): string | null {
  const idx = FLOW.findIndex((s) => s.id === id);
  const done = getDone();
  for (let i = idx + 1; i < FLOW.length; i++) {
    if (!done[FLOW[i].id]) return FLOW[i].route;
  }
  return null;
}

function firstIncomplete(): string | null {
  const done = getDone();
  const step = FLOW.find((s) => !done[s.id]);
  return step ? step.route : null;
}

export function isResuming(): boolean {
  return getStored<boolean>(RESUMING_KEY, false);
}

function setResuming(v: boolean): void {
  setStored<boolean>(RESUMING_KEY, v);
}

/**
 * Resume mode: jump to the next not-completed step. When none remain, route to
 * the review + publish screen (TutorProfileConfirm) so the profile is actually
 * SAVED via POST /api/onboarding.
 *
 * Previously this jumped straight home WITHOUT ever saving, so anyone who
 * finished setup from the "Complete profile" banner ended up registered-but-empty
 * (banner stuck, profile blank, "couldn't save" on edits) with no way to recover
 * in-app. Ending at TutorProfileConfirm reuses the same save the first-time flow
 * runs, so a half-saved account can complete itself by re-doing setup.
 */
function resumeNext(id: TutorStep): void {
  const next = nextIncompleteAfter(id);
  if (next) {
    router.push(next as Href);
    return;
  }
  setResuming(false);
  router.push(CONFIRM_ROUTE as Href);
}

// ---------------------------------------------------------------------------
// Edit mode — re-entering onboarding screens from the Profile tab's "Change
// preferences" sheet. We walk only the chosen screens, then route to the
// TutorEditSave step, which flushes the edits to the backend (saveTutorEdits)
// and returns home. Normal onboarding never sets EDITING_KEY, so the checks
// below are inert during a first-time / resumed flow.
// ---------------------------------------------------------------------------
export function isEditing(): boolean {
  return getStored<string[] | null>(EDITING_KEY, null) != null;
}

/** Enter edit mode for the given onboarding routes (in order), then home. */
export function startEditing(routes: string[]): void {
  if (routes.length === 0) return;
  setStored<string[] | null>(EDITING_KEY, routes);
  router.push(routes[0] as Href);
}

/** Drop the current screen from the queue → next screen, or the save step when
 *  all chosen screens are done. Edit mode stays on (the empty queue is still
 *  non-null) through the save screen, which clears it once the save resolves. */
function editAdvance(): void {
  const rest = getStored<string[]>(EDITING_KEY, []).slice(1);
  if (rest.length > 0) {
    setStored<string[] | null>(EDITING_KEY, rest);
    router.push(rest[0] as Href);
  } else {
    setStored<string[] | null>(EDITING_KEY, []);
    router.push("/onboarding/TutorEditSave" as Href);
  }
}

/** Abandon edit mode (e.g. the Profile tab regained focus). */
export function clearEditing(): void {
  setStored<string[] | null>(EDITING_KEY, null);
}

/**
 * True when the tutor has a chosen subject with no saved details yet — i.e. a
 * subject added during "Change preferences" that still needs a Strengths &
 * Details pass. A newly-added subject lands in `tutor:interests` but has no
 * `tutor:sd:details["<catId>:<subId>"]` entry (hydrate only seeds saved subjects).
 */
function hasSubjectNeedingDetails(): boolean {
  const interests = getStored<{ catId: string; subId: string }[]>("tutor:interests", []);
  const details = getStored<Record<string, unknown>>("tutor:sd:details", {});
  return interests.some((it) => it.catId && it.subId && !details[`${it.catId}:${it.subId}`]);
}

/**
 * When editing Subjects, make sure a newly-added subject gets a details pass:
 * inject TutorSD right after the current step (catSel) if it isn't already queued
 * and some subject has no details. So ticking only "Subjects" and adding a new
 * category still routes through "Strengths & Details" to fill it in.
 */
function ensureDetailsStepAfterCatSel(): void {
  const SD_ROUTE = "/onboarding/TutorSD";
  const q = getStored<string[]>(EDITING_KEY, []);
  if (q.includes(SD_ROUTE) || !hasSubjectNeedingDetails()) return;
  setStored<string[] | null>(EDITING_KEY, [q[0], SD_ROUTE, ...q.slice(1)]);
}

/** Continue pressed on a tracked step — marks it done, then advances. */
export function onStepContinue(id: TutorStep, firstTimeNext: () => void): void {
  if (isEditing()) {
    if (id === "catSel") ensureDetailsStepAfterCatSel(); // new subject → force a details pass
    editAdvance(); // editing: walk only the chosen screens, don't touch completion
    return;
  }
  markStepDone(id);
  if (isResuming()) resumeNext(id);
  else firstTimeNext();
}

/** Skip pressed on a tracked step — advances WITHOUT marking it done. */
export function onStepSkip(id: TutorStep, firstTimeNext: () => void): void {
  if (isEditing()) {
    if (id === "catSel") ensureDetailsStepAfterCatSel(); // new subject → force a details pass
    editAdvance();
    return;
  }
  if (isResuming()) resumeNext(id);
  else firstTimeNext();
}

/**
 * "Set up your profile" banner tap (home feed + profile gate). First-timers go
 * through the SignUp gate; returning (signed-up) tutors jump straight to the
 * first not-completed profile step in resume mode.
 */
export function startTutorSetup(): void {
  if (!isRegistered()) {
    setResuming(false);
    router.push("/onboarding/SignUp" as Href);
    return;
  }
  const next = firstIncomplete();
  if (!next) return; // already complete — banner shouldn't be showing
  setResuming(true);
  router.push(next as Href);
}

/** SignUp hands off here once the account step is passed (first-time entry).
 *  Runs for BOTH the email "Continue" and the social buttons, so this is where
 *  the user becomes "registered" (ungating like / connect / filters). */
export function goAfterSignUp(): void {
  markRegistered();
  setResuming(false);
  const next = firstIncomplete() ?? "/onboarding/TutorCatSel";
  router.push(next as Href);
}
