import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

import { cancelMatchReminder, scheduleMatchReminder } from "./notifications";

/**
 * Seeker side of the "one tutor at a time" rule.
 *
 * When a seeker confirms contacting a tutor, that tutor becomes their single
 * **active contact** (`pending`). While a contact is pending the seeker can't
 * start a new one until they answer "Starting lessons with [tutor]?" — answering
 * (Yes or No) clears it and frees them. A 10-minute local notification nudges
 * them if they never answer.
 *
 * Local mock (AsyncStorage mirror) — same store shape as `contactQuota.ts`.
 */

const KEY = "seeker:activeContact";

export type SeekerPending = {
  tutorId: string;
  tutorName: string;
  startedAt: number;
  /** Scheduled reminder id, so we can cancel it when answered. */
  notifId: string | null;
};

let pending: SeekerPending | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  void AsyncStorage.setItem(KEY, JSON.stringify(pending)).catch(() => {});
}

export async function hydrateSeekerContact(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    pending = raw ? (JSON.parse(raw) as SeekerPending | null) : null;
    emit();
  } catch {
    // ignore — start with no pending contact
  }
}

export function getSeekerPending(): SeekerPending | null {
  return pending;
}

/** Commit to a tutor: set the pending contact + schedule the 10-min reminder. */
export function startSeekerContact(tutorId: string, tutorName: string): void {
  pending = { tutorId, tutorName, startedAt: Date.now(), notifId: null };
  persist();
  emit();
  void scheduleMatchReminder("seeker", tutorId, tutorName).then((nid) => {
    if (pending && pending.tutorId === tutorId) {
      pending.notifId = nid;
      persist();
    }
  });
}

/** Answer the match question (Yes/No both free the seeker): clear + cancel reminder. */
export function resolveSeekerContact(_started: boolean): void {
  if (!pending) return;
  void cancelMatchReminder(pending.notifId);
  pending = null;
  persist();
  emit();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Subscribe a component to the seeker's pending contact. */
export function useSeekerContact(): SeekerPending | null {
  return useSyncExternalStore(subscribe, getSeekerPending);
}
