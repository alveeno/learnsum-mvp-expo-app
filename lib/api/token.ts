import * as SecureStore from "expo-secure-store";

/**
 * Session token store — in-memory cache backed by the device keychain.
 *
 * After signup/login the backend returns a Supabase session whose
 * `access_token` is the Bearer token every protected call must send
 * (`Authorization: Bearer <token>`) — cookies are unreliable in React Native.
 *
 * The token is cached in memory for SYNCHRONOUS reads (so `apiFetch` stays sync)
 * AND persisted to `expo-secure-store`, so a cold app start restores the session
 * instead of forcing a re-login. Call `restoreToken()` once at startup
 * (app/_layout.tsx) before anything reads the token.
 *
 * Caveat: only the Supabase ACCESS token is stored (it expires, ~1h). There's no
 * refresh-token flow yet (the backend has no refresh endpoint), so a restore
 * after expiry will 401 and the app falls back to logged-out — screens already
 * handle that. A true long-lived session is a follow-up (store + use the refresh
 * token via a backend refresh route).
 */

const KEY = "learnsum.session.token";

let accessToken: string | null = null;

/** The current Bearer token, or null when logged out. */
export function getToken(): string | null {
  return accessToken;
}

/** Store the token after a successful signup/login (pass null to clear). Persists. */
export function setToken(token: string | null): void {
  accessToken = token;
  // Persist best-effort — a keychain failure must not block auth.
  if (token) void SecureStore.setItemAsync(KEY, token).catch(() => {});
  else void SecureStore.deleteItemAsync(KEY).catch(() => {});
}

/** Forget the token (logout) — clears memory + keychain. */
export function clearToken(): void {
  setToken(null);
}

/** True when a token is present (i.e. there is a live session). */
export function hasToken(): boolean {
  return accessToken != null;
}

/**
 * Load any persisted token into the in-memory cache. Call once at app start,
 * before the first protected call. Resolves to the restored token (or null).
 */
export async function restoreToken(): Promise<string | null> {
  try {
    const t = await SecureStore.getItemAsync(KEY);
    if (t) accessToken = t;
  } catch {
    // No keychain / read error → start logged out.
  }
  return accessToken;
}
