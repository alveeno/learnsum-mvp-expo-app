import { useState } from "react";

import { ConfirmModal } from "../ui/ConfirmModal";
import { getStored, setStored } from "./onboardingStore";

/**
 * One-time "Skip this step?" confirmation, shared across every onboarding Skip
 * button.
 *
 * The first time the user taps any Skip in onboarding, a warning pop-up appears.
 * After that it never appears again — the "already shown" flag lives in the
 * shared in-memory store, so it is remembered for the whole app session and
 * resets only on a full app reload (see CLAUDE.md persistence notes).
 *
 * Usage in a screen:
 *   const { requestSkip, skipModal } = useSkipGuard();
 *   <Pressable onPress={() => requestSkip(doTheActualSkip)} />
 *   ...
 *   {skipModal}
 */

const SEEN_KEY = "onboarding:skipWarningSeen";

export function useSkipGuard() {
  // The skip action awaiting confirmation; null means the pop-up is closed.
  const [pending, setPending] = useState<(() => void) | null>(null);

  const requestSkip = (action: () => void) => {
    // Already shown once this session → skip straight away, no pop-up.
    if (getStored(SEEN_KEY, false)) {
      action();
      return;
    }
    // First time: mark it seen now (so it shows exactly once) and confirm.
    setStored(SEEN_KEY, true);
    setPending(() => action);
  };

  const close = () => setPending(null);
  const skipAnyway = () => {
    const action = pending;
    setPending(null);
    action?.();
  };

  const skipModal = (
    <ConfirmModal
      visible={pending !== null}
      title="Skip this step?"
      message="Skipping this step may reduce the quality of your matches. Are you sure?"
      confirmLabel="Skip anyway"
      cancelLabel="Go back"
      onConfirm={skipAnyway}
      onCancel={close}
    />
  );

  return { requestSkip, skipModal };
}
