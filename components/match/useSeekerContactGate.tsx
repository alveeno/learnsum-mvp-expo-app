import { useState, type ReactNode } from "react";

import { MatchCheckInModal } from "./MatchCheckInModal";
import { getSeekerPending, resolveSeekerContact, startSeekerContact, useSeekerContact } from "./seekerContact";
import { ConfirmModal } from "../ui/ConfirmModal";

/**
 * Shared seeker "one tutor at a time" contact gate.
 *
 * Wraps any seeker-side action that reaches out to a tutor (open a WhatsApp/WeChat
 * chat, start an in-app conversation) so it goes through the same confirm flow
 * everywhere it can happen — the public tutor profile AND the Saved tab. Extracted
 * from `TutorProfileContent` so the two surfaces can't drift.
 *
 * `requestContact(tutorId, tutorName, run)`:
 *   - already pending on THIS tutor  → run() immediately (already committed)
 *   - pending on a DIFFERENT tutor   → MatchCheckInModal (resolve the previous one first) → confirm
 *   - no pending contact             → ConfirmModal "Contact [name]?"
 *   - on confirm → startSeekerContact(tutorId, tutorName); run()
 *
 * `tutorId` is the tutor's **slug** — the same key both surfaces already use.
 * Render `modals` once in the component tree.
 */
export function useSeekerContactGate(): {
  requestContact: (tutorId: string, tutorName: string, run: () => void) => void;
  modals: ReactNode;
} {
  const seekerPending = useSeekerContact();
  // The tutor a confirm/check-in is currently in flight for, plus the action to
  // run once committed. Kept in state so it survives the check-in → confirm hop.
  const [target, setTarget] = useState<{ id: string; name: string; run: () => void } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [checkIn, setCheckIn] = useState(false);

  const requestContact = (tutorId: string, tutorName: string, run: () => void) => {
    const cur = getSeekerPending();
    if (cur && cur.tutorId === tutorId) return run(); // already committed to this tutor
    setTarget({ id: tutorId, name: tutorName, run });
    if (cur && cur.tutorId !== tutorId) setCheckIn(true); // resolve the previous tutor first
    else setConfirm(true); // confirm this tutor
  };

  const onConfirm = () => {
    setConfirm(false);
    if (target) {
      startSeekerContact(target.id, target.name);
      target.run();
    }
    setTarget(null);
  };

  const onCancel = () => {
    setConfirm(false);
    setTarget(null);
  };

  // Answered the previous tutor's question → clear it, then confirm this tutor.
  const onCheckInAnswer = (started: boolean) => {
    setCheckIn(false);
    resolveSeekerContact(started);
    setConfirm(true);
  };

  const modals = (
    <>
      <ConfirmModal
        visible={confirm}
        title={`Contact ${target?.name || "this tutor"}?`}
        message="You'll focus on this tutor for now. Once you've reached out, tell us whether you started lessons before contacting anyone else."
        confirmLabel="Yes, contact them"
        cancelLabel="Not yet"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <MatchCheckInModal
        visible={checkIn}
        name={seekerPending?.tutorName ?? "the tutor"}
        onYes={() => onCheckInAnswer(true)}
        onNo={() => onCheckInAnswer(false)}
      />
    </>
  );

  return { requestContact, modals };
}
