import { apiFetch } from "./client";

/**
 * The caller's recurring weekly availability.
 *
 *   GET /api/availability  → { availability: { mon: [{ start, end }], ... } }
 *   PUT /api/availability  { availability } — full replace ({} clears all).
 *
 * Times are minutes from midnight (e.g. 540 = 09:00). Days are mon..sun; a day
 * with no ranges may be omitted. Tutors don't pass a child_id (that's parents).
 */

export type TimeRange = { start: number; end: number };
export type AvailabilityMap = Record<string, TimeRange[]>;

/** Fetch the caller's availability map (days with no ranges are omitted). */
export async function getAvailability(): Promise<AvailabilityMap> {
  const res = await apiFetch<{ availability: AvailabilityMap }>("/api/availability");
  return res.availability ?? {};
}

/** Full-replace the caller's availability. Pass {} to clear all ranges. */
export async function putAvailability(availability: AvailabilityMap): Promise<void> {
  await apiFetch("/api/availability", { method: "PUT", body: { availability } });
}
