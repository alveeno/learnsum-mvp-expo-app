import { router, useLocalSearchParams } from "expo-router";

import { CategorySelect, type Interest } from "./StudentCatSel";

/**
 * Tutor onboarding — subject selection.
 *
 * Same screen as the student category selection (the shared CategorySelect
 * core), with tutor copy. The tutor's teaching levels arrive from the previous
 * step and are carried forward alongside the chosen subjects — no backend.
 */
export default function TutorCatSel() {
  const { levels } = useLocalSearchParams<{ levels?: string }>();

  const goNext = (interests: Interest[]) =>
    router.push({
      pathname: "/onboarding/TutorNext",
      params: {
        ...(levels ? { levels } : {}),
        interests: JSON.stringify(interests),
      },
    });

  return (
    <CategorySelect
      heading="What subject would you like to teach?"
      subtitle="Select all that applies."
      progress={0.75}
      onContinue={goNext}
      onSkip={() => goNext([])}
      onBack={() => router.back()}
    />
  );
}
