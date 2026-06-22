import "../global.css";

import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { markRegistered } from "../components/auth/authState";
import { LanguageProvider } from "../components/i18n/LanguageProvider";
import { loadLang } from "../components/i18n/langStorage";
import { type Lang } from "../components/i18n/translations";
import { hasToken, restoreToken } from "../lib/api";

export default function RootLayout() {
  // Bootstrap on-device state before the first screen renders: restore the saved
  // session token (SecureStore) and the chosen language (AsyncStorage), so a cold
  // start reopens logged-in and in the user's language instead of resetting.
  const [bootLang, setBootLang] = useState<Lang | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [, lang] = await Promise.all([restoreToken(), loadLang()]);
      if (cancelled) return;
      if (hasToken()) markRegistered(); // a restored session counts as registered
      setBootLang(lang);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hold the UI until bootstrap resolves (a frame or two) to avoid a flash of the
  // default language / logged-out state.
  if (bootLang === null) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider initialLang={bootLang}>
        <Stack screenOptions={{ headerShown: false }} />
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
