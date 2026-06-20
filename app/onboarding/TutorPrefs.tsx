import { router, useLocalSearchParams } from "expo-router";

import {
  PreferencesScreen,
  prefsToParams,
  type Prefs,
} from "../../components/onboarding/PreferencesScreen";
import { onStepContinue, onStepSkip } from "../../components/onboarding/tutorOnboarding";
import { useT } from "../../components/i18n/LanguageProvider";

/**
 * Tutor preferences. Same layout as the student's preference screen, except the
 * language section uses tap-to-fill proficiency (Beginner → Intermediate →
 * Advanced → Fluent). Carries the tutor's earlier answers (teaching levels,
 * subjects, Strengths & Details) forward alongside the preferences — no backend.
 */
export default function TutorPrefs() {
  const t = useT();
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

  const firstTimeNext = (data: Prefs) =>
    router.push({
      pathname: "/onboarding/TutorAbout",
      params: { ...carried, ...prefsToParams(data) },
    });

  return (
    <PreferencesScreen
      heading={t("tutor.prefs.heading")}
      subtitle={t("tutor.prefs.subtitle")}
      progress={1}
      languageMode="proficiency"
      languageSectionLabel={t("prefs.section.language.tutor")}
      // Lesson format AND location are collected per-subject on TutorSD now, not
      // here. With format hidden the location section never shows either, so this
      // screen is just availability + languages for tutors.
      showFormat={false}
      persistKey="tutor:prefs"
      onContinue={(data) => onStepContinue("prefs", () => firstTimeNext(data))}
      onSkip={() =>
        onStepSkip("prefs", () =>
          router.push({ pathname: "/onboarding/TutorAbout", params: carried }),
        )
      }
      onBack={() => router.back()}
    />
  );
}
