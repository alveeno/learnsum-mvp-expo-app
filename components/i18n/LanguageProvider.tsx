import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_LANG,
  translations,
  type Lang,
  type TranslationKey,
} from "./translations";

/**
 * App-wide language state.
 *
 * `LanguageProvider` is mounted once at the root (app/_layout.tsx) so it wraps
 * every screen. Changing the language re-renders every component that reads it
 * via `useT()` / `useLanguage()` — that's how one tap re-skins the whole app.
 *
 * The current language lives in memory (resets on a full app restart), matching
 * the rest of the app. Persisting it across restarts is a later, isolated change
 * (swap the in-memory state for on-device storage — see CLAUDE.md notes); none of
 * the screens that use `t()` would change.
 */

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translate;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);

  const value = useMemo<LanguageContextValue>(() => {
    const t: Translate = (key, params) => {
      const entry = translations[key];
      // Fall back to English, then the raw key, so a missing draft is visible
      // rather than blank.
      let text: string = entry[lang] ?? entry.en ?? key;
      if (params) {
        for (const name of Object.keys(params)) {
          text = text.replace(new RegExp(`\\{${name}\\}`, "g"), String(params[name]));
        }
      }
      return text;
    };
    return { lang, setLang, t };
  }, [lang]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

/** Read the current language plus `setLang` and `t`. */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  }
  return ctx;
}

/** Shortcut for components that only need to translate text. */
export function useT(): Translate {
  return useLanguage().t;
}
