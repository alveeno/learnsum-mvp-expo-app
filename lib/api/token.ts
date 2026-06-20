/**
 * In-memory session token store.
 *
 * After signup/login the backend returns a Supabase session whose
 * `access_token` is the Bearer token every protected call must send
 * (`Authorization: Bearer <token>`) — cookies are unreliable in React Native.
 *
 * This is held in memory ONLY: a full app reload clears it and the user is
 * logged out, matching the onboarding store + i18n + the old auth mock (see
 * CLAUDE.md data rules). This was a deliberate choice over expo-secure-store to
 * avoid adding a native module / forcing an EAS rebuild. To make the session
 * survive restarts later, swap the three lines below for SecureStore and make
 * the getters async — nothing else needs to change.
 */

let accessToken: string | null = null;

/** The current Bearer token, or null when logged out. */
export function getToken(): string | null {
  return accessToken;
}

/** Store the token after a successful signup/login (pass null to clear). */
export function setToken(token: string | null): void {
  accessToken = token;
}

/** Forget the token (logout). */
export function clearToken(): void {
  accessToken = null;
}

/** True when a token is present (i.e. there is a live session). */
export function hasToken(): boolean {
  return accessToken != null;
}
