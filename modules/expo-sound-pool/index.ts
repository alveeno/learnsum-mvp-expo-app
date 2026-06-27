import { requireOptionalNativeModule } from "expo-modules-core";

/**
 * JS bridge to the native low-latency sound pool (modules/expo-sound-pool, iOS).
 *
 * `requireOptionalNativeModule` returns null when the native module isn't in the
 * running binary (an old dev build before the rebuild, the iOS Simulator without
 * the module, Android, Expo Go, web). Every helper here is a safe no-op in that
 * case so callers can fall back to expo-audio — see components/ui/sound.ts.
 */
interface ExpoSoundPoolNative {
  /** Decode a clip (file:// uri from expo-asset) into a PCM buffer under `name`. */
  load(name: string, uri: string): Promise<boolean>;
  /** Warm the audio session + engine so the first play doesn't pay start cost. */
  prime(): Promise<boolean>;
  /** Play a pre-loaded clip immediately (volume 0..1). */
  play(name: string, volume: number): void;
}

const Native = requireOptionalNativeModule<ExpoSoundPoolNative>("ExpoSoundPool");

/** True when the native pool is available in this binary. */
export const isSoundPoolAvailable = Native != null;

export async function loadPoolSound(name: string, uri: string): Promise<boolean> {
  if (!Native) return false;
  try {
    return await Native.load(name, uri);
  } catch {
    return false;
  }
}

export async function primePool(): Promise<void> {
  if (!Native) return;
  try {
    await Native.prime();
  } catch {
    /* best-effort */
  }
}

export function playPoolSound(name: string, volume = 1): void {
  if (!Native) return;
  try {
    Native.play(name, volume);
  } catch {
    /* best-effort */
  }
}
