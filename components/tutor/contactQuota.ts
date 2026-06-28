import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

import { ApiError, DAILY_CONTACT_QUOTA, getContactQuota, unlockContact } from "../../lib/api";

/**
 * Contact quota — a tutor unlocks a parent/student's contact details
 * (phone / WhatsApp / WeChat / in-app chat) at most **3 per day**. An unlock is
 * **permanent** (re-contacting that seeker is free forever); the 3-a-day
 * allowance **resets daily**. This is the gate that replaces the old premium
 * paywall as the monetization lever.
 *
 * Shared module-level store (the `/seekers/[id]` route is a separate Expo Router
 * screen, so it can't read shell state) — read through `useContactQuota`. Backed
 * by the backend (`/api/tutor/contact-quota` + `/api/tutor/contact-unlocks`) but
 * mirrored to AsyncStorage so the daily reset + permanent unlocks survive a
 * reload even with no backend yet (mock). `unlockSeeker` is optimistic.
 */

const KEY = "tutor:contactQuota";

type QuotaState = {
  unlocked: Set<string>; // seeker ids — permanent
  usedToday: number; // 0..DAILY_CONTACT_QUOTA
  dateKey: string; // YYYY-MM-DD the count belongs to
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

let state: QuotaState = { unlocked: new Set(), usedToday: 0, dateKey: todayKey() };
const listeners = new Set<() => void>();

// Cached snapshot so `getSnapshot` returns a stable reference between changes
// (useSyncExternalStore compares by identity and would loop on a fresh object).
let snapshot = computeSnapshot();

function computeSnapshot() {
  rolloverIfNewDay();
  return {
    remaining: Math.max(0, DAILY_CONTACT_QUOTA - state.usedToday),
    unlocked: state.unlocked,
  };
}

function emit() {
  snapshot = computeSnapshot();
  listeners.forEach((l) => l());
}

/** If we've crossed midnight since the count was set, reset it (unlocks persist). */
function rolloverIfNewDay() {
  const today = todayKey();
  if (state.dateKey !== today) {
    state.dateKey = today;
    state.usedToday = 0;
    void persist();
  }
}

async function persist() {
  try {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({ unlocked: [...state.unlocked], usedToday: state.usedToday, dateKey: state.dateKey }),
    );
  } catch {
    // best-effort
  }
}

async function loadFromStorage() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return;
    const p = JSON.parse(raw) as { unlocked?: string[]; usedToday?: number; dateKey?: string };
    state = {
      unlocked: new Set(p.unlocked ?? []),
      usedToday: typeof p.usedToday === "number" ? p.usedToday : 0,
      dateKey: p.dateKey ?? todayKey(),
    };
  } catch {
    // ignore — start fresh
  }
}

/**
 * Load the quota: AsyncStorage first (instant, survives reload), then reconcile
 * with the backend when reachable. Call once after sign-in (the tutor shell does).
 */
export async function hydrateContactQuota(): Promise<void> {
  await loadFromStorage();
  emit();
  try {
    const q = await getContactQuota();
    state = {
      unlocked: new Set(q.unlocked),
      usedToday: Math.max(0, DAILY_CONTACT_QUOTA - q.remaining),
      dateKey: todayKey(),
    };
    void persist();
    emit();
  } catch (e) {
    // Offline / endpoint not built yet — the AsyncStorage mirror stands in.
    if (!(e instanceof ApiError)) throw e;
  }
}

export function isUnlocked(id: string): boolean {
  rolloverIfNewDay();
  return state.unlocked.has(id);
}

export function quotaRemaining(): number {
  rolloverIfNewDay();
  return Math.max(0, DAILY_CONTACT_QUOTA - state.usedToday);
}

/**
 * Unlock a seeker's contact, spending one of today's allowance.
 *   - already unlocked → no-op, returns true (free)
 *   - quota left       → optimistically unlock + decrement, persist, fire the
 *                        backend call (reverted if it rejects non-network), true
 *   - out of quota     → false (caller shows "resets tomorrow")
 */
export function unlockSeeker(id: string): boolean {
  if (!id) return false;
  rolloverIfNewDay();
  if (state.unlocked.has(id)) return true;
  if (state.usedToday >= DAILY_CONTACT_QUOTA) return false;

  // Optimistic spend.
  state.unlocked.add(id);
  state.usedToday += 1;
  void persist();
  emit();

  unlockContact(id).catch((e) => {
    // A real rejection (not just offline) means we shouldn't have charged — revert.
    if (e instanceof ApiError && !e.isNetworkError) {
      state.unlocked.delete(id);
      state.usedToday = Math.max(0, state.usedToday - 1);
      void persist();
      emit();
    }
  });
  return true;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Subscribe a component to the quota (re-renders on unlock / day reset). */
export function useContactQuota(): { remaining: number; isUnlocked: (id: string) => boolean } {
  const snap = useSyncExternalStore(subscribe, () => snapshot);
  return { remaining: snap.remaining, isUnlocked: (id: string) => snap.unlocked.has(id) };
}
