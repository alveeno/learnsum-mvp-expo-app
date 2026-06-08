import { router } from "expo-router";

import {
  PreferencesScreen,
  prefsToParams,
  type Prefs,
} from "../../components/onboarding/PreferencesScreen";

/**
 * Student preferences — the final step of the student onboarding path.
 * Thin wrapper over the shared PreferencesScreen (see that file for the UI).
 */
export default function StudentPrefs() {
  const goFeed = (data: Prefs) =>
    router.push({ pathname: "/feed", params: prefsToParams(data) });

  return (
    <PreferencesScreen
      progress={1}
      languageMode="select"
      persistKey="student:prefs"
      onContinue={goFeed}
      onSkip={() => router.push("/feed")}
      onBack={() => router.back()}
    />
  );
}
