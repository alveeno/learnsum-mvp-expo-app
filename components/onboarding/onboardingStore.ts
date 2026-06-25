import { useCallback, useRef, useState } from "react";

/**
 * Onboarding draft store — a single shared, in-memory notebook for everything
 * the user types during onboarding.
 *
 * WHY THIS EXISTS
 * Expo Router keeps a stack of screens. When you go *back* to an earlier screen
 * and then move forward again, the later screen is rebuilt from scratch, so its
 * local `useState` starts empty and the user's earlier input appears to vanish.
 * This module gives every screen a place to stash its answers, keyed by a stable
 * label, so a rebuilt screen can seed itself from the last known values.
 *
 * SCOPE (per the agreed behaviour):
 *  - In-memory only. Nothing is written to disk or to a backend, so the draft
 *    lasts while the app is open and is gone after a full close/reload. No new
 *    package, no AsyncStorage, no Supabase (see CLAUDE.md data rules).
 *  - Key by stable IDs (subject id, child index, etc.). Removing an item does
 *    NOT erase its stored answers, so re-adding it brings the data back.
 *
 * Values are held by reference (not serialised), so Sets, Maps and plain objects
 * can be stored as-is — callers must always store a NEW value rather than
 * mutating a stored one in place (every screen here already does).
 */

const store: Record<string, unknown> = {};

const has = (key: string) => Object.prototype.hasOwnProperty.call(store, key);

/** Read a stored value, or `fallback` if nothing has been stored under `key`. */
export function getStored<T>(key: string, fallback: T): T {
  return has(key) ? (store[key] as T) : fallback;
}

/** Write (or overwrite) the value stored under `key`. */
export function setStored<T>(key: string, value: T): void {
  store[key] = value;
}

/** Forget whatever is stored under `key`. */
export function clearStored(key: string): void {
  delete store[key];
}

/**
 * Wipe the entire in-memory draft — a clean slate equivalent to a fresh app
 * start. Used on logout so signing up a NEW account re-runs onboarding from
 * scratch (clears the onboarding completion map, the `registered` flag, any
 * staged answers, and the signup email/password). Language lives elsewhere
 * (AsyncStorage / LanguageProvider) and is unaffected.
 */
export function resetStore(): void {
  for (const key of Object.keys(store)) delete store[key];
}

type Updater<T> = T | ((prev: T) => T);

/**
 * Drop-in replacement for `useState` whose value is mirrored into the shared
 * store under `key`. On first mount it seeds from the store (falling back to
 * `initial`); every update writes straight back. The result: navigating away and
 * returning — even when the screen is rebuilt from scratch — restores the input.
 *
 * Pass a STABLE `key` (e.g. a subject id) so re-adding a removed item brings its
 * data back. `key` is assumed stable for the life of the component.
 */
export function usePersistentState<T>(
  key: string,
  initial: T | (() => T),
): [T, (next: Updater<T>) => void] {
  const [value, setValue] = useState<T>(() => {
    if (has(key)) return store[key] as T;
    const init = typeof initial === "function" ? (initial as () => T)() : initial;
    store[key] = init;
    return init;
  });

  // Keep the latest key without re-creating the setter each render.
  const keyRef = useRef(key);
  keyRef.current = key;

  const set = useCallback((next: Updater<T>) => {
    setValue((prev) => {
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      store[keyRef.current] = resolved;
      return resolved;
    });
  }, []);

  return [value, set];
}
