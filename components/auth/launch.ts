/**
 * Cold-start session routing.
 *
 * The app persists the session across launches (lib/api/token.ts), but the
 * welcome screen is the initial route — so on launch we must decide whether a
 * returning user should skip it and land on their home screen. This resolves
 * that destination from the restored session; app/index.tsx shows a splash while
 * it runs, then redirects (or falls through to the welcome screen).
 */
import { type Href } from "expo-router";

import {
  ApiError,
  clearToken,
  getMe,
  getRefreshToken,
  getStoredRole,
  hasToken,
  type Role,
} from "../../lib/api";

/** The home route for a role. Tutors → the tutor shell; seekers → /feed. */
export function homeForRole(role: Role | null): Href {
  return role === "student" || role === "parent" ? "/feed" : "/tutor-home";
}

/**
 * Decide where a cold start should land based on the restored session:
 *   • No stored session → null (show the welcome / login screen).
 *   • Valid session (getMe ok — apiFetch auto-refreshes an expired access token
 *     via the refresh token) → that role's home.
 *   • Offline / server unreachable but a session exists → home using the last
 *     known role, so being offline never bounces a logged-in user to login.
 *   • Session rejected (refresh token invalid / revoked) → clear it → null.
 */
export async function resolveLaunchDestination(): Promise<Href | null> {
  if (!hasToken() && !getRefreshToken()) return null;
  try {
    const me = await getMe();
    return homeForRole(me.profile?.role ?? null);
  } catch (err) {
    if (err instanceof ApiError && err.isNetworkError) {
      // Offline but we hold a session — open to home anyway (last known role).
      return homeForRole(getStoredRole());
    }
    // A real 401 even after the auto-refresh attempt ⇒ the session is dead.
    clearToken();
    return null;
  }
}
