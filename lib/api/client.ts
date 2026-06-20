import { API_BASE_URL } from "./config";
import { getToken } from "./token";

/**
 * The one place every backend call goes through.
 *
 * - Prefixes the single base URL (lib/api/config.ts).
 * - Attaches `Authorization: Bearer <token>` automatically when we have a
 *   session (opt out with `auth: false` for public endpoints).
 * - Serialises JSON bodies + query strings.
 * - Times out (default 15s) so a dead backend doesn't hang the UI.
 * - Throws a typed `ApiError` on any failure. `isNetworkError` is true when the
 *   request never reached the server (backend down, wrong URL, timeout) — that's
 *   the signal screens use to fall back to mock data in __DEV__.
 */

export type QueryValue = string | number | boolean | null | undefined;

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** A plain object is JSON-encoded; pass FormData/string to send as-is. */
  body?: unknown;
  /** Appended as a query string; null/undefined values are dropped. */
  query?: Record<string, QueryValue>;
  /** Attach the Bearer token? Defaults to true. */
  auth?: boolean;
  /** Abort after this many ms (default 15000). */
  timeoutMs?: number;
  /** Extra headers (merged last). */
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  /** True when the request never reached the server (down / unreachable / timeout). */
  readonly isNetworkError: boolean;

  constructor(message: string, status: number, body: unknown, isNetworkError = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.isNetworkError = isNetworkError;
  }
}

function buildQuery(query?: Record<string, QueryValue>): string {
  if (!query) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

/** Pull a human-readable message out of an error response body. */
function messageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as { error?: unknown }).error;
    if (typeof err === "string") return err;
  }
  return fallback;
}

export async function apiFetch<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true, timeoutMs = 15000, headers = {}, signal } = opts;

  const url = `${API_BASE_URL}${path}${buildQuery(query)}`;

  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };

  // Serialise plain-object bodies as JSON; leave FormData / strings untouched.
  let payload: BodyInit | undefined;
  const isPlainBody =
    body !== undefined &&
    body !== null &&
    typeof body === "object" &&
    !(typeof FormData !== "undefined" && body instanceof FormData);
  if (isPlainBody) {
    finalHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  } else if (body !== undefined && body !== null) {
    payload = body as BodyInit;
  }

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  // Timeout via AbortController, chained to any caller-supplied signal.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: payload,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new ApiError(
      aborted ? `Request to ${path} timed out` : `Could not reach the server at ${API_BASE_URL}`,
      0,
      null,
      true,
    );
  }
  clearTimeout(timer);

  // 204 No Content (or empty body) → nothing to parse.
  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      messageFromBody(parsed, `Request failed (${response.status})`),
      response.status,
      parsed,
      false,
    );
  }

  return parsed as T;
}
