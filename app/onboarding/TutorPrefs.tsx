import { router } from "expo-router";

import {
  PreferencesScreen,
  prefsToParams,
  type Prefs,
} from "../../components/onboarding/PreferencesScreen";

/**
 * Tutor preferences. Same screen as the student / parent, except the language
 * section uses tap-to-fill proficiency (Beginner → Intermediate → Advanced →
 * Fluent) instead of a plain on/off pick.
 */
export default function TutorPrefs() {
  const goFeed = (data: Prefs) =>
    router.push({ pathname: "/feed", params: prefsToParams(data) });

  return (
    <PreferencesScreen
      heading="Your teaching preferences"
      subtitle="Tell students how and what you teach."
      progress={1}
      languageMode="proficiency"
      languageSectionLabel="LANGUAGES YOU TEACH"
      onContinue={goFeed}
      onSkip={() => router.push("/feed")}
      onBack={() => router.back()}
    />
  );
}
