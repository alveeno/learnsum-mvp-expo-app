import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

/**
 * Sound effects — short UI blips, played imperatively with expo-audio.
 *
 * Pairs with the haptics in `feedback.ts`: a sound rides alongside the buzz on
 * button taps, the like pop, and success/error. A separate "pop" drives the
 * onboarding category/subject grid cascade (each icon that lands plays one).
 *
 * expo-audio is ALREADY in the installed dev build (it shipped unused in the
 * native batch — see CLAUDE.md), so this is JS-only: no EAS rebuild.
 *
 * The clips live in `assets/sounds/` (tap/like/success/error/pop.mp3) and are
 * wired in SOURCES below. To swap one, replace the file (keep the name) or point
 * its require at the new path; to disable one, comment its line out (every play()
 * for a missing entry is a safe no-op).
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

// Play these even when the ringer is on silent, and mix with other audio rather
// than pausing it. Configured lazily on first play (no native call at import).
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

let muted = false;
export function setSoundMuted(value: boolean): void {
  muted = value;
}
export function isSoundMuted(): boolean {
  return muted;
}

// One player per sound, created lazily. The rapid cascade "pop" gets a small
// round-robin pool so back-to-back ticks can overlap instead of cutting off.
const players: Partial<Record<SoundName, Player>> = {};
const POP_POOL_SIZE = 4;
let popPool: Player[] = [];
let popIndex = 0;
const POP_SEQUENCE_GAP_MS = 65;
let popQueue: number[] = [];
let popTimer: ReturnType<typeof setTimeout> | null = null;

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

function playPopPooled(): void {
  const src = SOURCES.pop;
  if (src == null) return;
  if (popPool.length === 0) {
    try {
      popPool = Array.from({ length: POP_POOL_SIZE }, () => createAudioPlayer(src));
    } catch {
      return;
    }
  }
  const p = popPool[popIndex];
  popIndex = (popIndex + 1) % popPool.length;
  if (p) fire(p);
}

function pumpPopQueue(): void {
  if (popTimer || popQueue.length === 0) return;
  const targetAt = popQueue[0];
  const wait = Math.max(0, targetAt - Date.now());
  popTimer = setTimeout(() => {
    popTimer = null;
    popQueue.shift();
    playSound("pop");
    if (popQueue.length > 0) {
      const nextEarliest = Date.now() + POP_SEQUENCE_GAP_MS;
      popQueue[0] = Math.max(popQueue[0], nextEarliest);
      pumpPopQueue();
    }
  }, wait);
}

/**
 * Queue one cascade pop after a relative delay. Unlike one timer per icon, this
 * keeps a minimum gap between pops even if route transition work delays JS and
 * multiple timers would otherwise wake up in the same frame.
 */
export function schedulePop(delayMs: number): () => void {
  const targetAt = Date.now() + Math.max(0, delayMs);
  popQueue.push(targetAt);
  popQueue.sort((a, b) => a - b);
  pumpPopQueue();
  return () => {
    const idx = popQueue.indexOf(targetAt);
    if (idx >= 0) popQueue.splice(idx, 1);
  };
}

/** Play a named sound (no-op when muted or the clip isn't wired yet). */
export function playSound(name: SoundName): void {
  if (muted) return;
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
