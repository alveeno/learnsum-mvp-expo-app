import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEFAULT_LANG, type Lang } from "./translations";

/**
 * Persist the chosen language across app restarts (AsyncStorage — non-sensitive,
 * unlike the session token which uses SecureStore). The current language is still
 * held in React state by LanguageProvider; this just seeds it on cold start and
 * saves every change so the app reopens in the user's language instead of English.
 */

const KEY = "learnsum.lang";
const VALID: Lang[] = ["en", "zh-Hant", "zh-Hans"];

/** Read the saved language (falls back to the default). Call once at startup. */
export async function loadLang(): Promise<Lang> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v && (VALID as string[]).includes(v) ? (v as Lang) : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

/** Persist the chosen language (best-effort). */
export function saveLang(lang: Lang): void {
  void AsyncStorage.setItem(KEY, lang).catch(() => {});
}
