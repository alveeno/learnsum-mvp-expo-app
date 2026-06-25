import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEF_FILTERS, type Filters } from "../tutor/FilterSheet";

/**
 * Persist the seeker's advanced search filters across app restarts.
 *
 * The Search tab's filters are otherwise session-only; saving them to
 * AsyncStorage (the same store the chosen language uses) means a returning
 * student/parent keeps their price/district/rating choices. `Filters` is plain
 * JSON (numbers / strings / arrays), so it serialises directly.
 */
const KEY = "seeker:filters";

export async function loadSavedFilters(): Promise<Filters | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Filters>;
    // Merge onto current defaults so adding a filter field later doesn't break
    // an older saved blob.
    return { ...DEF_FILTERS(), ...parsed };
  } catch {
    return null;
  }
}

export function saveFilters(f: Filters): void {
  void AsyncStorage.setItem(KEY, JSON.stringify(f)).catch(() => {});
}

export function clearSavedFilters(): void {
  void AsyncStorage.removeItem(KEY).catch(() => {});
}
