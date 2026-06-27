import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { Asset } from "expo-asset";

import {
  isSoundPoolAvailable,
  loadPoolSound,
  playPoolSound,
  primePool,
} from "../../modules/expo-sound-pool";

/**
 * Sound effects — short UI blips.
 *
 * Pairs with the haptics in `feedback.ts`: a sound rides alongside the buzz on
 * button taps, the like pop, and success/error. A separate "pop" rides the
 * onboarding category/subject grid cascade — `SelectableCircle` fires one as each
 * icon lands, so it must play with near-zero, consistent latency to stay in sync.
 *
 * Two backends, picked at runtime:
 *  1. The native low-latency pool (modules/expo-sound-pool, iOS) — clips are
 *     pre-decoded into PCM buffers and scheduled on an always-running AVAudioEngine,
 *     so `play` is effectively instant. Preferred when present. **Needs an EAS
 *     rebuild** to ship (it's native code).
 *  2. expo-audio — the previous backend. Higher, variable playback latency (fine
 *     for one-off taps, not for animation-synced pops). Used as a FALLBACK when the
 *     native pool isn't in the binary (old dev build, Simulator, Android, Expo Go),
 *     so sounds keep working before/without the rebuild.
 *
 * The clips live in `assets/sounds/` (tap/like/success/error/pop.mp3) and are
 * wired in SOURCES below. To swap one, replace the file (keep the name) or point
 * its require at the new path; to disable one, comment its line out.
 *
 * Best-effort throughout: a missing clip, a simulator without audio, or a load
 * failure never throws into UI code.
 */

type Player = ReturnType<typeof createAudioPlayer>;

export type SoundName = "tap" | "like" | "success" | "error" | "pop";

/**
 * Each sound → its bundled asset (via `require`). EMPTY until the clips exist:
 * a `require` of a missing file is a BUNDLER error, so the lines stay commented
 * until the files are added.
 */
const SOURCES: Partial<Record<SoundName, number>> = {
  tap: require("../../assets/sounds/tap.mp3"),
  like: require("../../assets/sounds/like.mp3"),
  success: require("../../assets/sounds/success.mp3"),
  error: require("../../assets/sounds/error.mp3"),
  pop: require("../../assets/sounds/pop.mp3"),
};

let muted = false;
export function setSoundMuted(value: boolean): void {
  muted = value;
}
export function isSoundMuted(): boolean {
  return muted;
}

// ---------------------------------------------------------------------------
// Native low-latency pool (preferred)
// ---------------------------------------------------------------------------

let poolReady = false;
let poolLoading: Promise<void> | null = null;

// Resolve each bundled clip to a local file:// uri (expo-asset downloads it from
// Metro in dev / reads the embedded copy in production) and hand it to native to
// decode into a PCM buffer. Runs once; safe to call repeatedly.
async function ensurePoolLoaded(): Promise<void> {
  if (!isSoundPoolAvailable || poolReady) return;
  if (poolLoading) return poolLoading;
  poolLoading = (async () => {
    const names = Object.keys(SOURCES) as SoundName[];
    await Promise.all(
      names.map(async (name) => {
        const mod = SOURCES[name];
        if (mod == null) return;
        try {
          const asset = Asset.fromModule(mod);
          await asset.downloadAsync();
          const uri = asset.localUri ?? asset.uri;
          if (uri) await loadPoolSound(name, uri);
        } catch {
          /* best-effort */
        }
      }),
    );
    await primePool();
    poolReady = true;
  })();
  return poolLoading;
}

/** Warm the native sound pool at app start (best-effort). Safe to call anytime. */
export function initSounds(): void {
  void ensurePoolLoaded();
}

// ---------------------------------------------------------------------------
// expo-audio fallback
// ---------------------------------------------------------------------------

// Play even on silent + mix with other audio. Configured lazily on first use.
let configured = false;
function ensureConfigured() {
  if (configured) return;
  configured = true;
  void setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: "mixWithOthers",
  }).catch(() => {});
}

// One player per sound, created lazily. The rapid cascade "pop" gets a small
// round-robin pool so back-to-back pops can overlap instead of cutting off.
const players: Partial<Record<SoundName, Player>> = {};
const POP_POOL_SIZE = 4;
let popPool: Player[] = [];
let popIndex = 0;

function fire(p: Player): void {
  try {
    void p.seekTo(0);
    p.play();
  } catch {
    /* best-effort */
  }
}

function playerFor(name: SoundName): Player | null {
  const src = SOURCES[name];
  if (src == null) return null;
  if (!players[name]) {
    try {
      players[name] = createAudioPlayer(src);
    } catch {
      return null;
    }
  }
  return players[name] ?? null;
}

function ensureExpoPopPool(): void {
  ensureConfigured();
  if (popPool.length > 0) return;
  const src = SOURCES.pop;
  if (src == null) return;
  try {
    popPool = Array.from({ length: POP_POOL_SIZE }, () => createAudioPlayer(src));
  } catch {
    /* best-effort */
  }
}

function playPopPooled(): void {
  ensureExpoPopPool();
  if (popPool.length === 0) return;
  const p = popPool[popIndex];
  popIndex = (popIndex + 1) % popPool.length;
  if (p) fire(p);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Warm up the cascade pop before a grid animates so the first pop doesn't hitch:
 * load the native pool if available, else pre-create the expo-audio fallback pool.
 */
export function primePops(): void {
  if (isSoundPoolAvailable) {
    void ensurePoolLoaded();
    return;
  }
  ensureExpoPopPool();
}

/** Play a named sound (no-op when muted or the clip isn't wired yet). */
export function playSound(name: SoundName): void {
  if (muted) return;
  if (isSoundPoolAvailable) {
    void ensurePoolLoaded();
    if (poolReady) {
      playPoolSound(name, 1);
      return;
    }
    // Pool still loading — fall back to expo-audio for this early call.
  }
  ensureConfigured();
  if (name === "pop") return playPopPooled();
  const p = playerFor(name);
  if (p) fire(p);
}

export const playTap = () => playSound("tap");
export const playLike = () => playSound("like");
export const playSuccess = () => playSound("success");
export const playError = () => playSound("error");
export const playPop = () => playSound("pop");
