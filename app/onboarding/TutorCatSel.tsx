import { router } from "expo-router";

import { onStepContinue, onStepSkip } from "../../components/onboarding/tutorOnboarding";
import { useT } from "../../components/i18n/LanguageProvider";
import { CategorySelect, type Interest } from "./StudentCatSel";

/**
 * Tutor onboarding — subject selection.
 *
 * Same screen as the student category selection (the shared CategorySelect
 * core), with tutor copy. Teaching levels are now chosen per subject on the
 * Strengths & Details screen.
 */
export default function TutorCatSel() {
  const t = useT();

  const firstTimeNext = (interests: Interest[]) =>
    router.push({
      pathname: "/onboarding/TutorSD",
      params: { interests: JSON.stringify(interests) },
    });

  return (
    <CategorySelect
      heading={t("tutor.cat.heading")}
      subtitle={t("tutor.cat.subtitle")}
      progress={0.75}
      persistKey="tutor:interests"
      onContinue={(interests) => onStepContinue("catSel", () => firstTimeNext(interests))}
      onSkip={() => onStepSkip("catSel", () => firstTimeNext([]))}
      onBack={() => router.back()}
    />
  );
}
