import { router } from "expo-router";

import { PreferencesScreen } from "../../components/onboarding/PreferencesScreen";

/**
 * Student preferences — the final DATA step of the student onboarding path.
 * Thin wrapper over the shared PreferencesScreen (see that file for the UI).
 *
 * Completing (Continue) goes to the CreateAccount step (Option A: credentials on
 * the final step), which creates the account, saves the answers, then lands on
 * the shared "Welcome to LearnSum" screen → /feed. Skipping bails straight to
 * /feed (no account, nothing saved).
 */
export default function StudentPrefs() {
  const goCreateAccount = () =>
    router.push({ pathname: "/onboarding/CreateAccount", params: { role: "student", next: "/feed" } });

  return (
    <PreferencesScreen
      progress={1}
      languageMode="select"
      persistKey="student:prefs"
      onContinue={goCreateAccount}
      onSkip={() => router.push("/feed")}
      onBack={() => router.back()}
    />
  );
}
