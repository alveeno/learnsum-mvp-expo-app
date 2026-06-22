import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

/**
 * Tiny tactile/clipboard feedback helpers (native modules — needs the EAS build).
 *
 * All calls are best-effort and swallow errors, so a missing capability (e.g. a
 * simulator without the Taptic engine) never throws into UI code. Sound effects
 * live separately (see sound.ts) since they need bundled audio assets.
 */

/** Light tap — selections, toggles, opening a sheet. */
export function tapLight(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Medium tap — primary actions (post, publish, connect). */
export function tapMedium(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Success buzz — a save/post/publish succeeded. */
export function notifySuccess(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Error buzz — a save/post failed. */
export function notifyError(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

/** Copy text to the clipboard (best-effort). Returns true on success. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
