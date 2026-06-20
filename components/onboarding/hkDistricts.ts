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
