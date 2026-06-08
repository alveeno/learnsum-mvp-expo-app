import { router, useLocalSearchParams } from "expo-router";

import { useT } from "../../components/i18n/LanguageProvider";
import { CategorySelect, type Interest } from "./StudentCatSel";

/**
 * Tutor onboarding — subject selection.
 *
 * Same screen as the student category selection (the shared CategorySelect
 * core), with tutor copy. The tutor's teaching levels arrive from the previous
 * step and are carried forward alongside the chosen subjects — no backend.
 */
export default function TutorCatSel() {
  const t = useT();
  const { levels } = useLocalSearchParams<{ levels?: string }>();

  const goNext = (interests: Interest[]) =>
    router.push({
      pathname: "/onboarding/TutorSD",
      params: {
        ...(levels ? { levels } : {}),
        interests: JSON.stringify(interests),
      },
    });

  return (
    <CategorySelect
      heading={t("tutor.cat.heading")}
      subtitle={t("tutor.cat.subtitle")}
      progress={0.75}
      persistKey="tutor:interests"
      onContinue={goNext}
      onSkip={() => goNext([])}
      onBack={() => router.back()}
    />
  );
}
