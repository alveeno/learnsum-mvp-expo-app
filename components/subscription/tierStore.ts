import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

/**
 * Tutor subscription tier — a **local, mock** store driving every tier-gated
 * behaviour while we test the model (no real payments / backend yet):
 *
 *   - **free**    — can't reply to seekers in-app; WhatsApp/WeChat hidden on the
 *                   tutor's profile; 0 daily seeker unlocks.
 *   - **premium** — can reply (spending 1 of 1 daily unlocks); exposes WhatsApp/WeChat.
 *   - **deluxe**  — can reply (spending 1 of 3 daily unlocks); exposes WhatsApp/WeChat.
 *
 * Same `useSyncExternalStore` + AsyncStorage shape as `contactQuota.ts`. A
 * **temporary** switcher on the Profile tab flips it so you can test each tier
 * from one device. It does double duty: it's the signed-in tutor's tier on tutor
 * surfaces, AND — as a mock — stands in for the *viewed* tutor's tier on the
 * seeker-facing profile (so flipping to Premium makes WhatsApp/WeChat appear
 * while you browse). A real per-tutor tier needs a backend `tutors.tier` column.
 */

export type Tier = "free" | "premium" | "deluxe";

const KEY = "tutor:tier";

/** Daily seeker-unlock allowance per tier. */
const QUOTA: Record<Tier, number> = { free: 0, premium: 1, deluxe: 3 };

export function quotaForTier(t: Tier): number {
  return QUOTA[t];
}

let tier: Tier = "free";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Subscribe to tier changes (used by React hooks and by `contactQuota.ts`). */
export function subscribeTier(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getTier(): Tier {
  return tier;
}

export function setTier(next: Tier): void {
  if (next === tier) return;
  tier = next;
  void AsyncStorage.setItem(KEY, next).catch(() => {});
  emit();
}

/** Load the saved tier on cold start (called from `app/_layout.tsx`). */
export async function hydrateTier(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw === "free" || raw === "premium" || raw === "deluxe") {
      tier = raw;
      emit();
    }
  } catch {
    // best-effort — default "free" stands in
  }
}

/** Subscribe a component to the current tier (re-renders on change). */
export function useTier(): Tier {
  return useSyncExternalStore(subscribeTier, getTier);
}
