import { apiFetch } from "./client";

/**
 * Seeker (parent / student) profiles — what a TUTOR sees when they open a
 * parent/student who viewed or was saved.
 *
 *   GET /api/seekers/[id] → a Seeker (preferences + child level/age)
 *
 * The seeker's **contact** (phone / WhatsApp / WeChat / chat account) is the
 * gated bit: the backend only fills `contact` once the tutor has spent one of
 * their 3 daily unlocks on this seeker (see lib/api/contacts.ts). Until then the
 * fields come back null and the UI shows the locked card. (For the offline mock
 * the sample data carries the contact and `SeekerProfileContent` hides it
 * client-side until unlocked — same end result.)
 *
 * Phone is NEVER shown before an unlock — a tutor sees preferences/category/
 * child age only, never a number, until they pay a quota to connect.
 */

export type SeekerRole = "parent" | "student";

export interface SeekerChild {
  name: string;
  /** Education level key (kindergarten | primary | middle | high | university | adult). */
  level: string;
  /** Optional — collected on parent onboarding; null when not provided. */
  age: number | null;
}

export interface SeekerContact {
  phone: string | null;
  whatsapp: string | null;
  wechat: string | null;
  /** Real chat account id; null for sample seekers (Message falls back to an alert). */
  account_id: string | null;
}

export interface Seeker {
  id: string;
  role: SeekerRole;
  /** "Mrs. Chan" (parent) or the student's own name. */
  name: string;
  avatar_url: string | null;
  /** Parent only — their (primary) child; null for a student searching for themselves. */
  child: SeekerChild | null;
  /** Subject display names, e.g. ["Mathematics", "English"]. */
  subjects: string[];
  format: "in_person" | "online" | "both" | null;
  /** Subdistrict slugs (render with subdistrictsLabel). */
  districts: string[];
  /** Language display names. */
  languages: string[];
  /** Short human availability summary, e.g. "Weekday evenings · Sat morning". */
  availability_note: string | null;
  /** Hidden until the tutor unlocks this seeker — see module doc. */
  contact: SeekerContact;
}

/** Fetch one seeker by id. Throws `ApiError` (the caller falls back to sample data). */
export async function getSeeker(id: string): Promise<Seeker> {
  return apiFetch<Seeker>(`/api/seekers/${encodeURIComponent(id)}`);
}
