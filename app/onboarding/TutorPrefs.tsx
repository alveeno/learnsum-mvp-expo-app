import { router, useLocalSearchParams } from "expo-router";

import {
  PreferencesScreen,
  prefsToParams,
  type Prefs,
} from "../../components/onboarding/PreferencesScreen";

/**
 * Tutor preferences. Same layout as the student's preference screen, except the
 * language section uses tap-to-fill proficiency (Beginner → Intermediate →
 * Advanced → Fluent). Carries the tutor's earlier answers (teaching levels,
 * subjects, Strengths & Details) forward alongside the preferences — no backend.
 */
export default function TutorPrefs() {
  const { levels, interests, tutorDetails } = useLocalSearchParams<{
    levels?: string;
    interests?: string;
    tutorDetails?: string;
  }>();

  // Everything collected earlier, passed straight through.
  const carried = {
    ...(levels ? { levels } : {}),
    ...(interests ? { interests } : {}),
    ...(tutorDetails ? { tutorDetails } : {}),
  };

  const goNext = (data: Prefs) =>
    router.push({
      pathname: "/onboarding/TutorNext",
      params: { ...carried, ...prefsToParams(data) },
    });

  return (
    <PreferencesScreen
      heading="Your teaching preferences"
      subtitle="Tell students how and what you teach."
      progress={1}
      languageMode="proficiency"
      languageSectionLabel="LANGUAGES YOU TEACH"
      persistKey="tutor:prefs"
      onContinue={goNext}
      onSkip={() =>
        router.push({ pathname: "/onboarding/TutorNext", params: carried })
      }
      onBack={() => router.back()}
    />
  );
}
