import { useSyncExternalStore } from "react";

/**
 * Saved tutors — a tiny in-memory store of the tutor ids a seeker has bookmarked.
 *
 * Shared between the seeker shell (Saved tab + the Save button on feed/search)
 * and the standalone `app/tutors/[slug].tsx` route, which is a separate Expo
 * Router screen and so can't read the shell's React state. A module-level Set +
 * subscriber list (read through `useSavedTutors`) keeps every surface in sync.
 *
 * Session-only for now, matching the rest of the prototype's in-memory state
 * (see CLAUDE.md). Persisting bookmarks across restarts would be an AsyncStorage
 * pass later, alongside the deferred "saved filter preferences".
 */
let saved = new Set<string>();
const listeners = new Set<() => void>();

function emit() {
  // New identity each change so `useSyncExternalStore`'s getSnapshot sees a
  // change (it compares by reference).
  saved = new Set(saved);
  listeners.forEach((l) => l());
}

export function isSaved(id: string): boolean {
  return saved.has(id);
}

export function toggleSaved(id: string): void {
  if (saved.has(id)) saved.delete(id);
  else saved.add(id);
  emit();
}

export function getSavedIds(): string[] {
  return [...saved];
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Subscribe a component to the saved-tutor set (re-renders on every change). */
export function useSavedTutors(): { ids: Set<string>; toggle: (id: string) => void } {
  const ids = useSyncExternalStore(subscribe, () => saved);
  return { ids, toggle: toggleSaved };
}
