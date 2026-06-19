import { getStored, setStored } from "../onboarding/onboardingStore";

/**
 * Front-end-only auth state for the tutor app shell.
 *
 * The shell (`/tutor-home`) is a prototype with no real backend session, so
 * "registered" is tracked by an explicit flag set the moment the user passes the
 * SignUp account gate — see `markRegistered` / `goAfterSignUp`. We deliberately
 * do NOT infer it from the staged email (`tutor:signup:email`): that field is
 * only written when the user TYPES an address, so signing up via a social button
 * (Google / Apple / Microsoft) would otherwise leave the user "unregistered"
 * forever. Session-only, like the rest of the store — a full reload resets it.
 *
 * Used to gate engagement actions (like / connect / advanced filters / add story
 * / create post): an unregistered tap routes to `/auth/gate` instead, which
 * offers Log in or Sign up.
 */
const REGISTERED_KEY = "tutor:registered";

export function isRegistered(): boolean {
  return getStored<boolean>(REGISTERED_KEY, false);
}

/** Set the registered flag directly — used by the __DEV__ demo toggle. */
export function setRegistered(value: boolean): void {
  setStored<boolean>(REGISTERED_KEY, value);
}

/** Mark the user registered — called once the SignUp / Log in gate is passed. */
export function markRegistered(): void {
  setRegistered(true);
}
