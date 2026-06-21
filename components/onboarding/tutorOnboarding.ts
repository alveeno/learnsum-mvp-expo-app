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
  { id: "teachLevels", route: "/onboarding/TutorTeachLevels" },
  { id: "catSel", route: "/onboarding/TutorCatSel" },
  { id: "sd", route: "/onboarding/TutorSD" },
  { id: "prefs", route: "/onboarding/TutorPrefs" },
  { id: "about", route: "/onboarding/TutorAbout" },
];

const DONE_KEY = "tutor:onboarding:done";
const RESUMING_KEY = "tutor:onboarding:resuming";
const EDITING_KEY = "tutor:onboarding:editing"; // string[] route queue while editing from the profile, else null
const HOME = "/tutor-home";

type DoneMap = Partial<Record<TutorStep, boolean>>;

function getDone(): DoneMap {
  return getStored<DoneMap>(DONE_KEY, {});
}

export function markStepDone(id: TutorStep): void {
  setStored<DoneMap>(DONE_KEY, { ...getDone(), [id]: true });
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

function goHome(): void {
  setResuming(false);
  router.dismissTo(HOME as Href);
}

/** Resume mode: jump to the next not-completed step, or home when none remain. */
function resumeNext(id: TutorStep): void {
  const next = nextIncompleteAfter(id);
  if (next) router.push(next as Href);
  else goHome();
}

// ---------------------------------------------------------------------------
// Edit mode — re-entering onboarding screens from the Profile tab's "Change
// preferences" sheet. We walk only the chosen screens, then return to home.
// (Persisting the edits to the backend is the NEXT step; for now this just
// drives the navigation.) Normal onboarding never sets EDITING_KEY, so the
// checks below are inert during a first-time / resumed flow.
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

/** Drop the current screen from the queue → next screen, or home when done. */
function editAdvance(): void {
  const rest = getStored<string[]>(EDITING_KEY, []).slice(1);
  if (rest.length > 0) {
    setStored<string[] | null>(EDITING_KEY, rest);
    router.push(rest[0] as Href);
  } else {
    setStored<string[] | null>(EDITING_KEY, null);
    router.dismissTo(HOME as Href);
  }
}

/** Abandon edit mode (e.g. the Profile tab regained focus). */
export function clearEditing(): void {
  setStored<string[] | null>(EDITING_KEY, null);
}

/** Continue pressed on a tracked step — marks it done, then advances. */
export function onStepContinue(id: TutorStep, firstTimeNext: () => void): void {
  if (isEditing()) {
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
  const next = firstIncomplete() ?? "/onboarding/TutorTeachLevels";
  router.push(next as Href);
}
