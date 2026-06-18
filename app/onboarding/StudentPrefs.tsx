import { router } from "expo-router";

import { PreferencesScreen } from "../../components/onboarding/PreferencesScreen";

/**
 * Student preferences — the final step of the student onboarding path.
 * Thin wrapper over the shared PreferencesScreen (see that file for the UI).
 *
 * Completing (Continue) goes through the shared "Welcome to LearnSum" screen,
 * which then lands on /feed. Skipping bails straight to /feed.
 */
export default function StudentPrefs() {
  const goWelcome = () =>
    router.push({ pathname: "/onboarding/Welcome", params: { next: "/feed" } });

  return (
    <PreferencesScreen
      progress={1}
      languageMode="select"
      persistKey="student:prefs"
      onContinue={goWelcome}
      onSkip={() => router.push("/feed")}
      onBack={() => router.back()}
    />
  );
}
