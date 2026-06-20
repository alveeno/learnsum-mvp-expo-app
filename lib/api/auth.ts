import { apiFetch } from "./client";
import { clearToken, setToken } from "./token";

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

/** Create an account. Stores the returned token and returns the user/session. */
export async function signup(email: string, password: string, role: Role): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    auth: false,
    body: { email: email.trim(), password, role },
  });
  if (res.session?.access_token) setToken(res.session.access_token);
  return res;
}

/** Log a returning user in. Stores the returned token. */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    auth: false,
    body: { email: email.trim(), password },
  });
  if (res.session?.access_token) setToken(res.session.access_token);
  return res;
}

/** Best-effort server logout; always clears the local token. */
export async function logout(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}

/** Current user + profile + role detail. Throws ApiError(401) when logged out. */
export async function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>("/api/auth/me");
}
