/**
 * Sample parents/students — the offline / not-yet-built-backend fallback for the
 * tutor-facing seeker surfaces (the Analytics "profile viewers" list and the
 * `/seekers/[id]` profile view). English-only, like the rest of the tutor shell
 * (see CLAUDE.md). Real data will come from `GET /api/seekers/[id]` and
 * `GET /api/tutor/profile-views` once the backend exists.
 *
 * Each record carries the seeker's preferences + (for parents) the child's level
 * and age, plus the contact block the UI keeps hidden until the tutor spends one
 * of their 3 daily unlocks.
 */
import type { ProfileViewer } from "../../lib/api/profileViews";
import type { Seeker } from "../../lib/api/seekers";

export const SAMPLE_SEEKERS: Seeker[] = [
  {
    id: "seeker-chan",
    role: "parent",
    name: "Mrs. Chan",
    avatar_url: null,
    child: { name: "Emma", level: "primary", age: 9 },
    subjects: ["Mathematics", "English"],
    format: "in_person",
    districts: ["causeway_bay", "tin_hau"],
    languages: ["Cantonese", "English"],
    availability_note: "Weekday evenings · Sat morning",
    contact: {
      phone: "+852 9123 4567",
      whatsapp: "85291234567",
      wechat: "mrschan_hk",
      account_id: null,
    },
  },
  {
    id: "seeker-lau",
    role: "parent",
    name: "Mr. Lau",
    avatar_url: null,
    child: { name: "Marcus", level: "high", age: 16 },
    subjects: ["Physics", "Mathematics"],
    format: "both",
    districts: ["mong_kok"],
    languages: ["Cantonese", "Mandarin"],
    availability_note: "Thursday & Sunday evenings",
    contact: {
      phone: "+852 9876 5432",
      whatsapp: "85298765432",
      wechat: null,
      account_id: null,
    },
  },
  {
    id: "seeker-wong",
    role: "parent",
    name: "Ms. Wong",
    avatar_url: null,
    child: { name: "Lucas", level: "middle", age: 13 },
    subjects: ["Mathematics"],
    format: "in_person",
    districts: ["sha_tin"],
    languages: ["Cantonese"],
    availability_note: "After school, weekdays",
    contact: {
      phone: "+852 9011 2233",
      whatsapp: "85290112233",
      wechat: "wong.family",
      account_id: null,
    },
  },
  {
    id: "seeker-tina",
    role: "student",
    name: "Tina Ho",
    avatar_url: null,
    child: null,
    subjects: ["Chemistry", "Biology"],
    format: "online",
    districts: [],
    languages: ["English", "Cantonese"],
    availability_note: "Flexible · prefers weekends",
    contact: {
      phone: "+852 9345 6789",
      whatsapp: "85293456789",
      wechat: null,
      account_id: null,
    },
  },
  {
    id: "seeker-david",
    role: "student",
    name: "David Yeung",
    avatar_url: null,
    child: null,
    subjects: ["Economics"],
    format: "both",
    districts: ["tsim_sha_tsui"],
    languages: ["Cantonese", "English"],
    availability_note: "Weekday afternoons",
    contact: {
      phone: "+852 9555 6677",
      whatsapp: "85295556677",
      wechat: "davidy",
      account_id: null,
    },
  },
];

export function findSampleSeeker(id: string): Seeker | undefined {
  return SAMPLE_SEEKERS.find((s) => s.id === id);
}

/** A short "why they're here" note for the viewers list, derived from a seeker. */
function viewerNote(s: Seeker): string {
  const subject = s.subjects[0] ?? "a tutor";
  if (s.role === "parent" && s.child) {
    const lvlChip = LEVEL_SHORT[s.child.level] ?? "";
    return `Looking for ${subject} for ${s.child.name}${lvlChip ? ` (${lvlChip})` : ""}`;
  }
  return `Looking for a ${subject} tutor`;
}

/** Compact level chips used in viewer notes (e.g. "P3", "S4"). */
const LEVEL_SHORT: Record<string, string> = {
  kindergarten: "KG",
  primary: "Primary",
  middle: "Junior",
  high: "Senior",
  university: "Uni",
  adult: "Adult",
};

/** Sample viewers (a subset of the seekers, with relative times). */
export const SAMPLE_VIEWERS: ProfileViewer[] = [
  { ...viewerOf(SAMPLE_SEEKERS[0]), ago: "2h" },
  { ...viewerOf(SAMPLE_SEEKERS[1]), ago: "5h" },
  { ...viewerOf(SAMPLE_SEEKERS[3]), ago: "1d" },
  { ...viewerOf(SAMPLE_SEEKERS[2]), ago: "2d" },
];

function viewerOf(s: Seeker): Omit<ProfileViewer, "ago"> {
  return { id: s.id, name: s.name, role: s.role, note: viewerNote(s), avatar_url: s.avatar_url };
}
