import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { saveLang } from "./langStorage";
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
 * The language now PERSISTS across restarts: `_layout.tsx` seeds `initialLang`
 * from AsyncStorage (`loadLang`) at startup, and every `setLang` saves the choice
 * (`saveLang`). None of the screens that use `t()` changed.
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

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: ReactNode;
  /** Seeded from on-device storage at startup (see app/_layout.tsx). */
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang ?? DEFAULT_LANG);

  // Persist every change so the app reopens in the chosen language.
  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    saveLang(next);
  }, []);

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
