import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import {
  PreferencesScreen,
  type Prefs,
} from "../../components/onboarding/PreferencesScreen";

/**
 * Parent preferences. The same screen as the student, repeated once per child:
 * a "Child X of Y" banner is shown, Continue advances to the next child (or
 * finishes), and Back returns to a previous child with their answers restored.
 *
 * `childCount` arrives as a route param from an earlier parent step; it
 * defaults to 2 for local testing until that upstream screen exists.
 */
export default function ParentPrefs() {
  const { childCount } = useLocalSearchParams<{ childCount?: string }>();
  const total = Math.max(1, Number.parseInt(childCount ?? "2", 10) || 2);

  const [index, setIndex] = useState(0);
  // Answers per child; null until that child has been completed once.
  const [perChild, setPerChild] = useState<(Prefs | null)[]>(() =>
    Array.from({ length: total }, () => null),
  );

  const finish = (all: (Prefs | null)[]) =>
    router.push({
      pathname: "/feed",
      params: { children: JSON.stringify(all) },
    });

  const onContinue = (data: Prefs) => {
    const next = [...perChild];
    next[index] = data;
    setPerChild(next);
    if (index + 1 < total) setIndex(index + 1);
    else finish(next);
  };

  const onSkip = () => {
    // Leave this child's answers as-is (null if untouched) and move on.
    if (index + 1 < total) setIndex(index + 1);
    else finish(perChild);
  };

  const onBack = () => {
    if (index > 0) setIndex(index - 1);
    else router.back();
  };

  return (
    <PreferencesScreen
      // Remount per child so the form clears, then re-seeds from saved answers.
      key={index}
      heading="Child preferences"
      subtitle="Set what works best for this child."
      banner={`Child ${index + 1} of ${total}`}
      progress={(index + 1) / total}
      languageMode="select"
      initialValue={perChild[index]}
      continueLabel={index + 1 < total ? "Next child" : "Continue"}
      onContinue={onContinue}
      onSkip={onSkip}
      onBack={onBack}
    />
  );
}
