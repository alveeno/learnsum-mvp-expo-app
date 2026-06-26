/**
 * Hong Kong regions + districts, shared by the preference screens (student /
 * parent location) and the tutor's per-subject location picker on TutorSD.
 *
 * A chosen district is stored as a stable key "<regionId>:<District Name>" so a
 * selection can span several regions (see `districtKey` / `districtName`). The
 * district NAMES are intentionally English for now (deferred i18n content, like
 * subjects and languages — see CLAUDE.md); only the UI chrome is translated.
 */

export type RegionId = "hk" | "kln" | "nt";

export const REGIONS: { id: RegionId; label: string; districts: string[] }[] = [
  {
    id: "hk",
    label: "HK Island",
    districts: ["Central & Western", "Eastern", "Southern", "Wan Chai"],
  },
  {
    id: "kln",
    label: "Kowloon",
    districts: [
      "Yau Tsim Mong",
      "Sham Shui Po",
      "Kowloon City",
      "Wong Tai Sin",
      "Kwun Tong",
    ],
  },
  {
    id: "nt",
    label: "New Terr.",
    districts: [
      "Kwai Tsing",
      "Tsuen Wan",
      "Tuen Mun",
      "Yuen Long",
      "North",
      "Tai Po",
      "Sha Tin",
      "Sai Kung",
      "Islands",
    ],
  },
];

/** Single-character label shown inside each district circle. */
export const DISTRICT_ZH: Record<string, string> = {
  "Central & Western": "中",
  Eastern: "東",
  Southern: "南",
  "Wan Chai": "灣",
  "Yau Tsim Mong": "油",
  "Sham Shui Po": "深",
  "Kowloon City": "九",
  "Wong Tai Sin": "黃",
  "Kwun Tong": "觀",
  "Kwai Tsing": "葵",
  "Tsuen Wan": "荃",
  "Tuen Mun": "屯",
  "Yuen Long": "元",
  North: "北",
  "Tai Po": "大",
  "Sha Tin": "沙",
  "Sai Kung": "西",
  Islands: "離",
};

/** Stable key for a chosen district: "<regionId>:<District Name>". */
export const districtKey = (regionId: RegionId, d: string) => `${regionId}:${d}`;

/** The human district name from a stored key ("hk:Eastern" → "Eastern"). */
export const districtName = (key: string) => key.slice(key.indexOf(":") + 1);

// ---------------------------------------------------------------------------
// hk_district enum code ↔ display name. The backend stores districts as the 18
// hk_district enum codes; the app stores them as "<regionId>:<Name>" keys. These
// bridge the two when reading a tutor's saved profile back into the edit screens
// and when saving edits. (Must stay in sync with the backend hk_district enum.)
// ---------------------------------------------------------------------------
const DISTRICT_ENUM_BY_NAME: Record<string, string> = {
  "Central & Western": "CentralWestern", "Wan Chai": "WanChai", Eastern: "Eastern", Southern: "Southern",
  "Yau Tsim Mong": "YauTsimMong", "Sham Shui Po": "ShamshuiPo", "Kowloon City": "KowloonCity",
  "Wong Tai Sin": "WongTaiSin", "Kwun Tong": "KwunTong", "Kwai Tsing": "KwaiTsing", "Tsuen Wan": "TsuenWan",
  "Tuen Mun": "TuenMun", "Yuen Long": "YuenLong", North: "North", "Tai Po": "TaiPo", "Sai Kung": "SaiKung",
  "Sha Tin": "ShaTin", Islands: "Islands",
};
const DISTRICT_NAME_BY_ENUM: Record<string, string> = Object.fromEntries(
  Object.entries(DISTRICT_ENUM_BY_NAME).map(([name, code]) => [code, name]),
);
// name → its region, so an enum code can be rebuilt into a "<regionId>:<Name>" key.
const REGION_BY_NAME: Record<string, RegionId> = Object.fromEntries(
  REGIONS.flatMap((r) => r.districts.map((d) => [d, r.id] as const)),
);

/** Store key ("nt:Sha Tin") → hk_district enum code ("ShaTin"), or null. */
export const districtEnumFromKey = (key: string): string | null =>
  DISTRICT_ENUM_BY_NAME[districtName(key)] ?? null;

/** Bare district name ("Sha Tin") → hk_district enum code ("ShaTin"), or null.
 *  Used by the seeker Search filters, which hold plain district names. */
export const districtEnumFromName = (name: string): string | null =>
  DISTRICT_ENUM_BY_NAME[name] ?? null;

/** hk_district enum code ("ShaTin") → store key ("nt:Sha Tin"), or null. */
export const districtKeyFromEnum = (code: string): string | null => {
  const name = DISTRICT_NAME_BY_ENUM[code];
  if (!name) return null;
  const region = REGION_BY_NAME[name];
  return region ? districtKey(region, name) : null;
};
