import Constants from "expo-constants";

/**
 * The API base URL — the SINGLE source of where the backend lives.
 *
 * Resolution order:
 *   1. `EXPO_PUBLIC_API_URL` from `.env.local` (inlined into the bundle by Expo
 *      because of the `EXPO_PUBLIC_` prefix). This is authoritative.
 *   2. If that URL points at `localhost`/`127.0.0.1` AND we're running on a
 *      physical device (Metro is being served from a LAN IP), rewrite the host
 *      to that LAN IP so the phone can actually reach your Mac. On the simulator
 *      the Metro host IS localhost, so nothing changes.
 *
 * Pinning `EXPO_PUBLIC_API_URL` to a real hostname (e.g. a Vercel URL) skips the
 * rewrite entirely — a non-loopback host is used verbatim.
 */

const FALLBACK = "http://localhost:3000";

/** The host Metro is served from, e.g. "192.168.1.42:8081" → "192.168.1.42". */
function metroHost(): string | null {
  const expo = Constants.expoConfig as { hostUri?: string } | null;
  const legacy = Constants as unknown as { manifest?: { debuggerHost?: string } };
  const hostUri = expo?.hostUri ?? legacy.manifest?.debuggerHost ?? null;
  if (!hostUri) return null;
  const host = hostUri.split(":")[0]?.trim();
  return host || null;
}

/** Swap a loopback host for the LAN IP Metro is served from (device case). */
function resolveBaseUrl(): string {
  const configured = (process.env.EXPO_PUBLIC_API_URL ?? FALLBACK).trim().replace(/\/+$/, "");

  // Avoid `new URL()` — React Native's URL polyfill is incomplete. Parse by hand.
  const match = configured.match(/^(https?:\/\/)(\[[^\]]+\]|[^/:]+)(:\d+)?(\/.*)?$/i);
  if (!match) return configured;

  const [, scheme, host, port = "", path = ""] = match;
  const isLoopback = host === "localhost" || host === "127.0.0.1";
  if (!isLoopback) return configured;

  const lan = metroHost();
  if (!lan || lan === "localhost" || lan === "127.0.0.1") return configured;

  return `${scheme}${lan}${port}${path}`;
}

export const API_BASE_URL = resolveBaseUrl();
