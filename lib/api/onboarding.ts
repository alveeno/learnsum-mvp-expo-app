import { apiFetch } from "./client";

/**
 * Onboarding one-shot save: POST /api/onboarding.
 *
 * Runs once, right after signup, with the whole collected onboarding store sent
 * as a single role-specific parcel. The backend maps the app's slugs/labels →
 * IDs/enums and persists everything atomically, then returns `skipped` listing
 * anything it couldn't store (custom subjects, unknown districts). The body
 * shape is built per role by the caller (see components/onboarding/*Payload).
 */

export interface OnboardingSkipped {
  unknown_subjects: string[];
  unknown_districts: string[];
  not_persisted_yet: string[];
}

export interface OnboardingResult {
  ok: boolean;
  role: string;
  skipped: OnboardingSkipped;
}

export async function postOnboarding(body: unknown): Promise<OnboardingResult> {
  return apiFetch<OnboardingResult>("/api/onboarding", { method: "POST", body });
}
