import { useSyncExternalStore } from "react";

import { getSavedTutors, saveTutor, unsaveTutor } from "../../lib/api";

/**
 * Saved tutors — the set of tutor SLUGS the signed-in seeker has bookmarked,
 * backed by the backend (`/api/saved`).
 *
 * Shared between the seeker shell (Saved tab + the Save button on search) and the
 * standalone `app/tutors/[slug].tsx` route, which is a separate Expo Router screen
 * and so can't read the shell's React state. A module-level Set + subscriber list
 * (read through `useSavedTutors`) keeps every surface in sync.
 *
 * Keyed by slug because that's what tutor cards / the profile route carry. Writes
 * are optimistic: the icon flips immediately, then the POST/DELETE runs and the
 * change is reverted if the request fails. Call `hydrateSaved()` once after sign-in
 * (the seeker shell does) to load the existing bookmarks. The sample-data Home feed
 * keeps its OWN local set — only real tutors (a real slug) belong here.
 */
let saved = new Set<string>();
const listeners = new Set<() => void>();

function emit() {
  // New identity each change so `useSyncExternalStore`'s getSnapshot sees a
  // change (it compares by reference).
  saved = new Set(saved);
  listeners.forEach((l) => l());
}

export function isSaved(slug: string): boolean {
  return saved.has(slug);
}

export function getSavedIds(): string[] {
  return [...saved];
}

/** Load the seeker's existing bookmarks from the backend (call once after sign-in). */
export async function hydrateSaved(): Promise<void> {
  try {
    const list = await getSavedTutors();
    saved = new Set(list.map((t) => t.slug));
    listeners.forEach((l) => l());
  } catch {
    // Offline / not signed in — leave the set empty; the UI just shows nothing saved.
  }
}

/** Optimistically toggle a bookmark, then persist; revert if the request fails. */
export function toggleSaved(slug: string): void {
  if (!slug) return;
  const wasSaved = saved.has(slug);
  // Optimistic flip.
  if (wasSaved) saved.delete(slug);
  else saved.add(slug);
  emit();

  const request = wasSaved ? unsaveTutor(slug) : saveTutor({ slug });
  request.catch(() => {
    // Revert on failure (e.g. a sample-data slug the backend doesn't know → 404).
    if (wasSaved) saved.add(slug);
    else saved.delete(slug);
    emit();
  });
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Subscribe a component to the saved-tutor set (re-renders on every change). */
export function useSavedTutors(): { ids: Set<string>; toggle: (slug: string) => void } {
  const ids = useSyncExternalStore(subscribe, () => saved);
  return { ids, toggle: toggleSaved };
}
