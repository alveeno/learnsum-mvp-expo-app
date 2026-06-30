import { router } from "expo-router";
import { useEffect } from "react";
// Type-only import — erased at compile time, so it never loads the native module.
import type * as NotificationsType from "expo-notifications";

/**
 * Local-notification wrapper for the "did you start lessons?" reminder.
 *
 * When a seeker commits to a tutor (or a tutor spends a contact on a seeker) and
 * doesn't answer the match question, a local notification fires **10 minutes
 * later** and deep-links to the check-in screen (`/match-checkin`).
 *
 * `expo-notifications` is a NATIVE module, so it's loaded **lazily + guarded**:
 * on a binary that predates it (the current build before the EAS rebuild, or the
 * Simulator) the require/calls are caught and everything no-ops — the in-app
 * banner / next-contact prompt still nudges the user, and the app never crashes
 * at startup. Once rebuilt + reinstalled, the device notification fires for real
 * (see CLAUDE.md's native-deps workflow).
 */

export type MatchSide = "seeker" | "tutor";

const REMINDER_DELAY_SECONDS = 10 * 60; // 10 minutes

// undefined = not tried yet, null = unavailable on this binary, object = loaded.
let cached: typeof NotificationsType | null | undefined;

function notifModule(): typeof NotificationsType | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("expo-notifications") as typeof NotificationsType;
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    cached = mod;
  } catch {
    cached = null; // native module not in this binary
  }
  return cached;
}

/** Ask for notification permission once (best-effort). Returns whether granted. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const N = notifModule();
  if (!N) return false;
  try {
    const { status } = await N.getPermissionsAsync();
    if (status === "granted") return true;
    const req = await N.requestPermissionsAsync();
    return req.status === "granted";
  } catch {
    return false;
  }
}

function checkInUrl(side: MatchSide, id: string, name: string): string {
  const q = `side=${encodeURIComponent(side)}&id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
  return `/match-checkin?${q}`;
}

/**
 * Schedule the 10-minute reminder. Returns the notification id (to cancel later)
 * or null if scheduling wasn't possible (no native module / no permission).
 */
export async function scheduleMatchReminder(
  side: MatchSide,
  id: string,
  name: string,
): Promise<string | null> {
  const N = notifModule();
  if (!N) return null;
  try {
    const granted = await ensureNotificationPermission();
    if (!granted) return null;
    return await N.scheduleNotificationAsync({
      content: {
        title: side === "seeker" ? "How did it go?" : "Did you connect?",
        body: `Did you start having lessons with ${name}?`,
        data: { url: checkInUrl(side, id, name) },
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: REMINDER_DELAY_SECONDS,
      },
    });
  } catch {
    return null;
  }
}

/** Cancel a previously-scheduled reminder (best-effort). */
export async function cancelMatchReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  const N = notifModule();
  if (!N) return;
  try {
    await N.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // best-effort
  }
}

/**
 * Mount once at the app root: route a notification tap to its `data.url`
 * (`/match-checkin?...`), including the case where a tap cold-started the app.
 */
export function useMatchNotificationObserver(): void {
  useEffect(() => {
    const N = notifModule();
    if (!N) return;
    function redirect(notification: NotificationsType.Notification | null | undefined) {
      const url = notification?.request.content.data?.url;
      if (typeof url === "string") router.push(url as never);
    }
    try {
      const last = N.getLastNotificationResponse();
      if (last?.notification) redirect(last.notification);
      const sub = N.addNotificationResponseReceivedListener((res) => redirect(res.notification));
      return () => sub.remove();
    } catch {
      return undefined;
    }
  }, []);
}
