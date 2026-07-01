import * as SecureStore from "expo-secure-store";

import type { Role, Session } from "./auth";

/**
 * Session store — in-memory cache backed by the device keychain.
 *
 * After signup/login the backend returns a Supabase session. We persist:
 *   • `access_token`  — the Bearer token every protected call sends
 *     (`Authorization: Bearer <token>`); cached in memory for SYNCHRONOUS reads.
 *   • `refresh_token` — long-lived credential used to mint a fresh access token
 *     when the ~1h access token expires (`POST /api/auth/refresh`, see
 *     lib/api/auth.ts → `refreshSession`, wired into `apiFetch`'s 401 retry).
 *   • `role`          — the last signed-in role, so a cold start can route
 *     straight to that role's home even while offline (before getMe returns).
 *
 * Call `restoreToken()` once at startup (app/_layout.tsx) before anything reads
 * the token. With the refresh flow, a session survives across cold starts and
 * past the access-token expiry — the user stays logged in until they log out or
 * the refresh token is revoked.
 */

const ACCESS_KEY = "learnsum.session.token";
const REFRESH_KEY = "learnsum.session.refresh";
const ROLE_KEY = "learnsum.session.role";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let sessionRole: Role | null = null;

/** The current Bearer token, or null when logged out. */
export function getToken(): string | null {
  return accessToken;
}

/** The refresh token, or null. Present ⇒ we can mint a fresh access token. */
export function getRefreshToken(): string | null {
  return refreshToken;
}

/** The last signed-in role (for cold-start / offline routing), or null. */
export function getStoredRole(): Role | null {
  return sessionRole;
}

/** True when an access token is present (a session was restored / created). */
export function hasToken(): boolean {
  return accessToken != null;
}

/**
 * Store a full session (access + refresh) after signup / login / refresh.
 * Pass null to clear everything. Persists best-effort — a keychain failure must
 * not block auth.
 */
export function setSession(session: Pick<Session, "access_token" | "refresh_token"> | null): void {
  if (!session || !session.access_token) {
    clearToken();
    return;
  }
  accessToken = session.access_token;
  void SecureStore.setItemAsync(ACCESS_KEY, accessToken).catch(() => {});
  // Supabase returns a (rotated) refresh token on every login/refresh; keep the
  // existing one if a response ever omits it rather than dropping the session.
  if (session.refresh_token) {
    refreshToken = session.refresh_token;
    void SecureStore.setItemAsync(REFRESH_KEY, session.refresh_token).catch(() => {});
  }
}

/** Store just the access token (no refresh). Prefer `setSession`. */
export function setToken(token: string | null): void {
  if (!token) {
    clearToken();
    return;
  }
  accessToken = token;
  void SecureStore.setItemAsync(ACCESS_KEY, token).catch(() => {});
}

/** Remember the signed-in role for cold-start routing (null clears it). */
export function setStoredRole(role: Role | null): void {
  if (role === sessionRole) return; // skip redundant keychain writes
  sessionRole = role;
  if (role) void SecureStore.setItemAsync(ROLE_KEY, role).catch(() => {});
  else void SecureStore.deleteItemAsync(ROLE_KEY).catch(() => {});
}

/** Forget the whole session (logout) — clears memory + keychain. */
export function clearToken(): void {
  accessToken = null;
  refreshToken = null;
  sessionRole = null;
  void SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => {});
  void SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
  void SecureStore.deleteItemAsync(ROLE_KEY).catch(() => {});
}

/**
 * Load any persisted session (access + refresh + role) into memory. Call once
 * at app start, before the first protected call. Resolves to the access token
 * (or null). An expired access token is still restored — `apiFetch` refreshes it
 * on the first 401.
 */
export async function restoreToken(): Promise<string | null> {
  try {
    const [a, r, role] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
      SecureStore.getItemAsync(ROLE_KEY),
    ]);
    if (a) accessToken = a;
    if (r) refreshToken = r;
    if (role === "student" || role === "parent" || role === "tutor") sessionRole = role;
  } catch {
    // No keychain / read error → start logged out.
  }
  return accessToken;
}
