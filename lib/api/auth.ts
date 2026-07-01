import { ApiError, apiFetch, setTokenRefresher } from "./client";
import { clearToken, getRefreshToken, getToken, setSession, setStoredRole } from "./token";

/**
 * Auth bridge — signup / login / logout / me.
 *
 * Verified against the backend route handlers (learnsum-mvp-back):
 *   POST /api/auth/signup  { email, password, role } → { user, session }   (201)
 *   POST /api/auth/login   { email, password }        → { user, session }
 *   POST /api/auth/logout                              → { success: true }
 *   GET  /api/auth/me                                  → { user, profile, detail }
 *
 * The Bearer token is `session.access_token`. Email verification is OFF, so
 * signup returns a live session immediately. There is NO `is_new_user` field
 * (the FRONTEND_WIRING doc is slightly off here) — whether onboarding is needed
 * is read from `profile.onboarding_done` via getMe().
 */

export type Role = "student" | "parent" | "tutor";

export interface AuthUser {
  id: string;
  email?: string | null;
  [key: string]: unknown;
}

export interface Session {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  [key: string]: unknown;
}

export interface Profile {
  id: string;
  role: Role;
  onboarding_done?: boolean;
  display_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  gender?: string | null;
  /** Backend support pending (see CLAUDE.md backend-gap notes). */
  bio?: string | null;
  phone?: string | null;
  /** Seeker (student/parent) WeChat ID — shared profiles column (migration 0031). */
  wechat_id?: string | null;
  [key: string]: unknown;
}

export interface MeResponse {
  user: AuthUser;
  profile: Profile;
  detail: Record<string, unknown> | null;
}

interface AuthResponse {
  user: AuthUser;
  session: Session | null;
}

/** Create an account. Stores the session (access + refresh) + role. */
export async function signup(email: string, password: string, role: Role): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    auth: false,
    body: { email: email.trim(), password, role },
  });
  if (res.session?.access_token) {
    setSession(res.session);
    setStoredRole(role);
  }
  return res;
}

/** Log a returning user in. Stores the session (access + refresh). */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    auth: false,
    body: { email: email.trim(), password },
  });
  if (res.session?.access_token) setSession(res.session);
  // Role isn't in the login response — getMe() (called next by the caller) persists it.
  return res;
}

/**
 * Exchange the stored refresh token for a fresh session (`POST /api/auth/refresh`).
 * Returns the new access token, or null when there's no refresh token or it's
 * been rejected (revoked / expired), in which case the session is cleared.
 * Registered as `apiFetch`'s 401 refresher (see the bottom of this file).
 */
export async function refreshSession(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  try {
    const res = await apiFetch<AuthResponse>("/api/auth/refresh", {
      method: "POST",
      auth: false,
      body: { refresh_token: rt },
    });
    if (res.session?.access_token) {
      setSession(res.session);
      return res.session.access_token;
    }
    clearToken();
    return null;
  } catch (err) {
    // Offline → leave the session in place to try again later. A real rejection
    // (invalid/revoked refresh token) → clear so the app falls back to logged-out.
    if (err instanceof ApiError && err.isNetworkError) return null;
    clearToken();
    return null;
  }
}

/**
 * Log out. Clears the local session **synchronously first** — so a caller that
 * navigates right after `void logout()` (e.g. `router.replace("/")`) lands in a
 * logged-out state and the welcome-screen launch gate doesn't find a live token
 * and bounce back to home — then best-effort revokes the session server-side.
 *
 * Revocation uses the captured tokens (the local session is already gone, so the
 * auto-attached Bearer would be null): the backend invalidates the refresh
 * token(s) on Supabase so the session can't be resumed. Failures are ignored.
 */
export async function logout(): Promise<void> {
  const accessToken = getToken();
  const refreshToken = getRefreshToken();
  clearToken();
  try {
    await apiFetch("/api/auth/logout", {
      method: "POST",
      auth: false,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: refreshToken ? { refresh_token: refreshToken } : undefined,
    });
  } catch {
    // Already cleared locally — a failed server revocation must not block logout.
  }
}

/** Current user + profile + role detail. Throws ApiError(401) when logged out. */
export async function getMe(): Promise<MeResponse> {
  const me = await apiFetch<MeResponse>("/api/auth/me");
  // Remember the role for cold-start / offline routing.
  if (me.profile?.role) setStoredRole(me.profile.role);
  return me;
}

// Let apiFetch auto-refresh an expired access token on a 401 (no import cycle:
// client never imports auth).
setTokenRefresher(refreshSession);
