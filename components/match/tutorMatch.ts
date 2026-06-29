import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

import { cancelMatchReminder, scheduleMatchReminder } from "./notifications";

/**
 * Tutor side of the match question. When a tutor spends a contact to reach a
 * seeker (in the chat reply gate or on the seeker profile), that seeker is added
 * here and the tutor gets the same "Starting lessons with [seeker]?" banner.
 *
 * A Premium (1/day) / Deluxe (3/day) tutor can engage several seekers, so this is
 * a small **queue** — the banner surfaces the oldest unanswered one at a time.
 * Local mock (AsyncStorage mirror), same shape as the other stores.
 */

const KEY = "tutor:activeMatches";

export type TutorMatch = {
  seekerId: string;
  seekerName: string;
  startedAt: number;
  notifId: string | null;
};

let queue: TutorMatch[] = [];
const listeners = new Set<() => void>();
let snapshot: TutorMatch | null = null; // the oldest unanswered (stable identity)

function recompute() {
  snapshot = queue.length > 0 ? queue[0] : null;
}

function emit() {
  recompute();
  listeners.forEach((l) => l());
}

function persist() {
  void AsyncStorage.setItem(KEY, JSON.stringify(queue)).catch(() => {});
}

export async function hydrateTutorMatch(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    queue = raw ? (JSON.parse(raw) as TutorMatch[]) : [];
    emit();
  } catch {
    // ignore — start empty
  }
}

/** Add a seeker the tutor just committed to (deduped); schedules the reminder. */
export function addTutorMatch(seekerId: string, seekerName: string): void {
  if (queue.some((m) => m.seekerId === seekerId)) return;
  queue = [...queue, { seekerId, seekerName, startedAt: Date.now(), notifId: null }];
  persist();
  emit();
  void scheduleMatchReminder("tutor", seekerId, seekerName).then((nid) => {
    const m = queue.find((x) => x.seekerId === seekerId);
    if (m) {
      m.notifId = nid;
      persist();
    }
  });
}

function removeMatch(seekerId: string) {
  const m = queue.find((x) => x.seekerId === seekerId);
  if (!m) return;
  void cancelMatchReminder(m.notifId);
  queue = queue.filter((x) => x.seekerId !== seekerId);
  persist();
  emit();
}

/** Answer the banner's current (oldest) question. */
export function resolveOldestTutorMatch(_started: boolean): void {
  if (queue.length === 0) return;
  removeMatch(queue[0].seekerId);
}

/** Answer a specific seeker's question (from a notification deep-link). */
export function resolveTutorMatch(seekerId: string, _started: boolean): void {
  removeMatch(seekerId);
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Subscribe a component to the oldest unanswered tutor match. */
export function useTutorMatch(): TutorMatch | null {
  return useSyncExternalStore(subscribe, () => snapshot);
}
