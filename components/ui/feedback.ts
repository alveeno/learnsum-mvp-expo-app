import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { playError, playSuccess } from "./sound";

/**
 * Tiny tactile/clipboard feedback helpers (native modules — needs the EAS build).
 *
 * All calls are best-effort and swallow errors, so a missing capability (e.g. a
 * simulator without the Taptic engine) never throws into UI code. The
 * success/error helpers also fire the matching sound effect (see sound.ts); the
 * button-tap and like sounds are wired at their own call sites (Button,
 * EngagementRow).
 */

/** Light tap — selections, toggles, opening a sheet. */
export function tapLight(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Medium tap — primary actions (post, publish, connect). */
export function tapMedium(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Subtle selection tick — e.g. each step as a slider value changes. */
export function selectionTick(): void {
  void Haptics.selectionAsync().catch(() => {});
}

/** Success buzz + chime — a save/post/publish succeeded. */
export function notifySuccess(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  playSuccess();
}

/** Error buzz + tone — a save/post failed. */
export function notifyError(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  playError();
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
