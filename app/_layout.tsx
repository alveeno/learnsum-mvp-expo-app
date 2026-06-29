import "../global.css";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { markRegistered } from "../components/auth/authState";
import { LanguageProvider } from "../components/i18n/LanguageProvider";
import { loadLang } from "../components/i18n/langStorage";
import { type Lang } from "../components/i18n/translations";
import { hasToken, restoreToken } from "../lib/api";
import { useMatchNotificationObserver } from "../components/match/notifications";
import { hydrateTier } from "../components/subscription/tierStore";
import { initSounds } from "../components/ui/sound";

export default function RootLayout() {
  // Bootstrap on-device state before the first screen renders: restore the saved
  // session token (SecureStore) and the chosen language (AsyncStorage), so a cold
  // start reopens logged-in and in the user's language instead of resetting.
  const [bootLang, setBootLang] = useState<Lang | null>(null);

  // Handwriting display font (Patrick Hand, OFL). Loaded at runtime via
  // expo-font — its native module ships with @expo/vector-icons, so this needs
  // no EAS rebuild. Used for the guide text on the tutor "student slots" picker.
  const [fontsLoaded, fontError] = useFonts({
    PatrickHand: require("../assets/fonts/PatrickHand-Regular.ttf"),
  });

  // Route a tapped match reminder notification to the check-in screen.
  useMatchNotificationObserver();

  useEffect(() => {
    let cancelled = false;
    initSounds(); // warm the native sound pool so the first onboarding pop is in sync
    void hydrateTier(); // restore the mock subscription tier
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
  // default language / logged-out state. Also wait for the handwriting font, but
  // never block on a font error (fall back to the system font).
  if (bootLang === null || (!fontsLoaded && !fontError)) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider initialLang={bootLang}>
        <Stack screenOptions={{ headerShown: false }} />
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
