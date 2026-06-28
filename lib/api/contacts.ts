import { apiFetch } from "./client";

/**
 * Contact quota — a tutor may unlock a parent/student's contact details
 * (phone / WhatsApp / WeChat / in-app chat) at most **3 times per day**.
 * Unlocking a seeker is **permanent** (re-contacting them later is free); the
 * 3-a-day allowance **resets daily**. This is the monetization lever in place of
 * the old premium paywall.
 *
 *   GET  /api/tutor/contact-quota         → { remaining, unlocked }
 *   POST /api/tutor/contact-unlocks       → spend one unlock; { seeker_id }
 *                                            returns the fresh { remaining, unlocked }
 *
 * The store in `components/tutor/contactQuota.ts` owns the day-reset + optimistic
 * spend; these just talk to the backend (and the store keeps an AsyncStorage
 * mirror so the mock works offline).
 */

export const DAILY_CONTACT_QUOTA = 3;

export interface ContactQuota {
  /** How many of today's 3 unlocks remain (0–3). */
  remaining: number;
  /** Seeker ids already unlocked (permanent). */
  unlocked: string[];
}

/** The tutor's current quota + permanently-unlocked seekers. Throws `ApiError`. */
export async function getContactQuota(): Promise<ContactQuota> {
  return apiFetch<ContactQuota>("/api/tutor/contact-quota");
}

/** Spend one daily unlock on a seeker. Returns the fresh quota. Throws `ApiError`. */
export async function unlockContact(seekerId: string): Promise<ContactQuota> {
  return apiFetch<ContactQuota>("/api/tutor/contact-unlocks", {
    method: "POST",
    body: { seeker_id: seekerId },
  });
}
