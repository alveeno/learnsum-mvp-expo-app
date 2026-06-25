/**
 * Quick Match — pick the single best-fitting tutor for a seeker.
 *
 * Front-end prototype: scores the sample `DIRECTORY` against whatever the seeker
 * entered during onboarding (kept in the in-memory store), preferring a subject
 * match, then a district match, then rating. Seeker onboarding doesn't collect a
 * budget, so price isn't scored. When the store is empty (e.g. a fresh app start
 * — the draft is session-only) it falls back to the top-rated tutor and says so.
 *
 * Reads the STUDENT onboarding keys (`student:interests` / `student:prefs`); the
 * parent flow stores per-child and isn't matched here yet.
 */
import { getStored } from "../onboarding/onboardingStore";
import { type Interest } from "../../app/onboarding/StudentCatSel";
import { type Prefs } from "../onboarding/PreferencesScreen";
import { DIRECTORY, type FullTutor } from "../tutor/tutorData";

export type QuickMatch = {
  tutor: FullTutor;
  /** One-line reason, e.g. "Top match for Mathematics in Eastern". */
  reason: string;
  /** True when we matched the seeker's actual picks (vs a generic top pick). */
  personalized: boolean;
};

/** District keys are stored as "<regionId>:<District Name>" — take the name. */
function districtName(key: string): string {
  const i = key.indexOf(":");
  return i >= 0 ? key.slice(i + 1) : key;
}

export function getQuickMatch(): QuickMatch {
  const interests = getStored<Interest[]>("student:interests", []);
  const prefs = getStored<Prefs | null>("student:prefs", null);

  const wantedSubjects = interests
    .map((it) => (it.label ?? it.subId ?? "").toLowerCase().trim())
    .filter(Boolean);
  const wantedDistricts = (prefs?.districts ?? []).map((d) => districtName(d).toLowerCase().trim());

  const subjectHit = (t: FullTutor) => {
    const subj = t.subject.toLowerCase();
    return wantedSubjects.find((w) => subj.includes(w) || w.includes(subj));
  };
  const districtHit = (t: FullTutor) => {
    const loc = t.loc.toLowerCase();
    return wantedDistricts.find((w) => loc === w || loc.includes(w) || w.includes(loc));
  };

  const score = (t: FullTutor) => {
    let s = Number(t.stats.rating) || 0; // 0..5 tiebreak
    if (subjectHit(t)) s += 100;
    if (districtHit(t)) s += 25;
    if (t.qualified) s += 2;
    return s;
  };

  const best = [...DIRECTORY].sort((a, b) => score(b) - score(a))[0];

  const matchedSubject = subjectHit(best);
  const matchedDistrict = districtHit(best);
  const personalized = !!matchedSubject || !!matchedDistrict;

  let reason: string;
  if (matchedSubject) {
    // Echo the seeker's own subject label (nicely cased) rather than the tutor's.
    const label = interests.find((it) => (it.label ?? it.subId ?? "").toLowerCase().trim() === matchedSubject)?.label;
    reason = `Top match for ${label ?? best.subject}`;
    if (matchedDistrict) reason += ` in ${best.loc}`;
  } else if (matchedDistrict) {
    reason = `Highly rated tutor in ${best.loc}`;
  } else {
    reason = "Top-rated tutor on LearnSum";
  }

  return { tutor: best, reason, personalized };
}
