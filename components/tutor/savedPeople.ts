import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

import {
  ApiError,
  addSavedPerson,
  getSavedPeople,
  removeSavedPerson,
  type SavedPerson,
} from "../../lib/api";

export type { SavedPerson } from "../../lib/api";

/**
 * The TUTOR's saved list — a MIXED set of other tutors AND seekers
 * (parents/students). Shared module-level store (the Saved tab, the seeker
 * profile route, and the search/viewers Save buttons all read it) so every
 * surface stays in sync — read through `useSavedPeople`.
 *
 * Unlike the seeker `savedTutors` store (a Set of slugs that re-fetches cards),
 * this keeps the full `SavedPerson` per id so rows render without a second fetch
 * (seekers have no public profile route to re-fetch from). Writes are optimistic;
 * backed by `/api/saved/people` and mirrored to AsyncStorage so the mock works
 * offline. Call `hydrateSavedPeople()` once after sign-in (the tutor shell does).
 */

const KEY = "tutor:savedPeople";

let people = new Map<string, SavedPerson>();
const listeners = new Set<() => void>();

// Stable snapshot identity between changes (useSyncExternalStore compares by ref).
let snapshot: SavedPerson[] = [];

function rebuildSnapshot() {
  snapshot = [...people.values()];
}

function emit() {
  rebuildSnapshot();
  void persist();
  listeners.forEach((l) => l());
}

async function persist() {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify([...people.values()]));
  } catch {
    // best-effort
  }
}

/** Load saved people: AsyncStorage first, then reconcile with the backend. */
export async function hydrateSavedPeople(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const list = JSON.parse(raw) as SavedPerson[];
      people = new Map(list.map((p) => [p.id, p]));
      rebuildSnapshot();
      listeners.forEach((l) => l());
    }
  } catch {
    // ignore
  }
  try {
    const list = await getSavedPeople();
    people = new Map(list.map((p) => [p.id, p]));
    emit();
  } catch (e) {
    // Offline / endpoint not built yet — the AsyncStorage mirror stands in.
    if (!(e instanceof ApiError)) throw e;
  }
}

export function isSavedPerson(id: string): boolean {
  return people.has(id);
}

/** Optimistically toggle a bookmark, then persist; revert on a real rejection. */
export function toggleSavedPerson(person: SavedPerson): void {
  if (!person.id) return;
  const wasSaved = people.has(person.id);
  if (wasSaved) people.delete(person.id);
  else people.set(person.id, person);
  emit();

  const request = wasSaved ? removeSavedPerson(person.id) : addSavedPerson(person);
  request.catch((e) => {
    // Offline keeps the optimistic change (the AsyncStorage mirror is the source
    // of truth for the mock); only a real backend rejection reverts.
    if (e instanceof ApiError && !e.isNetworkError) {
      if (wasSaved) people.set(person.id, person);
      else people.delete(person.id);
      emit();
    }
  });
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Subscribe a component to the saved-people list (re-renders on every change). */
export function useSavedPeople(): { list: SavedPerson[]; isSaved: (id: string) => boolean; toggle: (p: SavedPerson) => void } {
  const list = useSyncExternalStore(subscribe, () => snapshot);
  return { list, isSaved: (id: string) => people.has(id), toggle: toggleSavedPerson };
}
