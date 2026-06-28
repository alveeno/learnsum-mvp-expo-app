/**
 * Hong Kong regions → districts → subdistricts, shared by the preference screens
 * (student / parent location) and the tutor's per-subject location picker on
 * TutorSD (both via DistrictPicker).
 *
 * A chosen location is a **subdistrict**, stored as a stable text **slug**
 * (e.g. "causeway_bay") — that's the source of truth the app sends to the backend
 * (stored as text[]; the frontend is the source of truth for the location list).
 * Districts/regions are never stored on their own; selecting a whole district just
 * selects all of its subdistricts. Names + the single Chinese character shown on a
 * circle are English/zh content (deferred i18n like subjects — see CLAUDE.md).
 */

export type RegionId = "hk" | "kln" | "nt";

export interface Subdistrict {
  /** Stable storage key, e.g. "causeway_bay". */
  slug: string;
  name: string;
  /** First character of the subdistrict's Chinese name, shown in its circle. */
  zh: string;
}
export interface District {
  name: string;
  /** First character of the district's Chinese name, shown in its (larger) circle. */
  zh: string;
  subs: Subdistrict[];
}
export interface Region {
  id: RegionId;
  /** Short label for the segmented tab. */
  label: string;
  fullLabel: string;
  districts: District[];
}

// Derive a slug from a subdistrict name. All names are letters + spaces, so a
// lowercase + underscore form is stable and globally unique across HK.
const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, "_");

// Raw data: region → district (with its zh) → [subdistrict name, zh] tuples.
type SubTuple = readonly [name: string, zh: string];
type RawDistrict = { zh: string; subs: readonly SubTuple[] };
type RawRegion = { id: RegionId; label: string; fullLabel: string; districts: Record<string, RawDistrict> };

const RAW: readonly RawRegion[] = [
  {
    id: "hk",
    label: "HK Island",
    fullLabel: "Hong Kong Island",
    districts: {
      "Central and Western": {
        zh: "中",
        subs: [
          ["Central", "中"],
          ["Admiralty", "金"],
          ["Sheung Wan", "上"],
          ["Sai Ying Pun", "西"],
          ["Kennedy Town", "堅"],
          ["The Peak", "山"],
        ],
      },
      "Wan Chai": {
        zh: "灣",
        subs: [
          ["Wan Chai", "灣"],
          ["Causeway Bay", "銅"],
          ["Happy Valley", "跑"],
          ["Tai Hang", "大"],
        ],
      },
      Eastern: {
        zh: "東",
        subs: [
          ["North Point", "北"],
          ["Quarry Bay", "鰂"],
          ["Shau Kei Wan", "筲"],
          ["Tai Koo Shing", "太"],
          ["Chai Wan", "柴"],
          ["Siu Sai Wan", "小"],
        ],
      },
      Southern: {
        zh: "南",
        subs: [
          ["Aberdeen", "香"],
          ["Ap Lei Chau", "鴨"],
          ["Wong Chuk Hang", "黃"],
          ["Repulse Bay", "淺"],
          ["Stanley", "赤"],
          ["Shek O", "石"],
        ],
      },
    },
  },
  {
    id: "kln",
    label: "Kowloon",
    fullLabel: "Kowloon",
    districts: {
      "Yau Tsim Mong": {
        zh: "油",
        subs: [
          ["Tsim Sha Tsui", "尖"],
          ["Jordan", "佐"],
          ["Yau Ma Tei", "油"],
          ["Mong Kok", "旺"],
          ["Prince Edward", "太"],
          ["Tai Kok Tsui", "大"],
        ],
      },
      "Sham Shui Po": {
        zh: "深",
        subs: [
          ["Sham Shui Po", "深"],
          ["Cheung Sha Wan", "長"],
          ["Lai Chi Kok", "荔"],
          ["Mei Foo", "美"],
          ["Shek Kip Mei", "石"],
        ],
      },
      "Kowloon City": {
        zh: "九",
        subs: [
          ["Kowloon City", "九"],
          ["Hung Hom", "紅"],
          ["To Kwa Wan", "土"],
          ["Ho Man Tin", "何"],
          ["Kowloon Tong", "九"],
          ["Kai Tak", "啟"],
        ],
      },
      "Wong Tai Sin": {
        zh: "黃",
        subs: [
          ["Wong Tai Sin", "黃"],
          ["Diamond Hill", "鑽"],
          ["Lok Fu", "樂"],
          ["Tsz Wan Shan", "慈"],
          ["San Po Kong", "新"],
          ["Choi Hung", "彩"],
        ],
      },
      "Kwun Tong": {
        zh: "觀",
        subs: [
          ["Kwun Tong", "觀"],
          ["Ngau Tau Kok", "牛"],
          ["Kowloon Bay", "九"],
          ["Sau Mau Ping", "秀"],
          ["Lam Tin", "藍"],
          ["Yau Tong", "油"],
        ],
      },
    },
  },
  {
    id: "nt",
    label: "New Terr.",
    fullLabel: "New Territories",
    districts: {
      "Sha Tin": {
        zh: "沙",
        subs: [
          ["Sha Tin", "沙"],
          ["Tai Wai", "大"],
          ["Ma On Shan", "馬"],
          ["Fo Tan", "火"],
        ],
      },
      "Tai Po": {
        zh: "大",
        subs: [
          ["Tai Po", "大"],
          ["Tai Po Market", "大"],
          ["Tai Mei Tuk", "大"],
          ["Hong Lok Yuen", "康"],
        ],
      },
      North: {
        zh: "北",
        subs: [
          ["Fanling", "粉"],
          ["Sheung Shui", "上"],
          ["Sha Tau Kok", "沙"],
          ["Ta Kwu Ling", "打"],
        ],
      },
      "Sai Kung": {
        zh: "西",
        subs: [
          ["Sai Kung", "西"],
          ["Tseung Kwan O", "將"],
          ["Hang Hau", "坑"],
          ["Clear Water Bay", "清"],
        ],
      },
      "Tsuen Wan": {
        zh: "荃",
        subs: [
          ["Tsuen Wan", "荃"],
          ["Ma Wan", "馬"],
        ],
      },
      "Kwai Tsing": {
        zh: "葵",
        subs: [
          ["Kwai Chung", "葵"],
          ["Tsing Yi", "青"],
          ["Lai King", "荔"],
        ],
      },
      "Tuen Mun": {
        zh: "屯",
        subs: [
          ["Tuen Mun", "屯"],
          ["So Kwun Wat", "掃"],
        ],
      },
      "Yuen Long": {
        zh: "元",
        subs: [
          ["Yuen Long", "元"],
          ["Tin Shui Wai", "天"],
          ["Hung Shui Kiu", "洪"],
          ["Lau Fau Shan", "流"],
        ],
      },
      Islands: {
        zh: "離",
        subs: [
          ["Tung Chung", "東"],
          ["Discovery Bay", "愉"],
          ["Lamma Island", "南"],
          ["Cheung Chau", "長"],
          ["Peng Chau", "坪"],
        ],
      },
    },
  },
];

export const REGIONS: Region[] = RAW.map((r) => ({
  id: r.id,
  label: r.label,
  fullLabel: r.fullLabel,
  districts: Object.entries(r.districts).map(([name, d]) => ({
    name,
    zh: d.zh,
    subs: d.subs.map(([sn, sz]) => ({ slug: slugify(sn), name: sn, zh: sz })),
  })),
}));

// slug → { subdistrict, its district, its region } for O(1) reverse lookups.
const SUB_INDEX: Record<string, { sub: Subdistrict; district: District; region: Region }> = {};
for (const region of REGIONS) {
  for (const district of region.districts) {
    for (const sub of district.subs) {
      SUB_INDEX[sub.slug] = { sub, district, region };
    }
  }
}

/** All subdistrict slugs (e.g. for validating values from the backend). */
export const ALL_SUB_SLUGS: string[] = Object.keys(SUB_INDEX);

export const isSubSlug = (slug: string): boolean => slug in SUB_INDEX;

/** Display name for a stored slug ("causeway_bay" → "Causeway Bay"). Falls back
 *  to a title-cased slug for any unknown value so old data never renders blank. */
export const subName = (slug: string): string =>
  SUB_INDEX[slug]?.sub.name ??
  slug.split("_").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");

/** The single Chinese character to show for a slug (subdistrict zh). */
export const subZh = (slug: string): string => SUB_INDEX[slug]?.sub.zh ?? subName(slug)[0] ?? "";

/** The parent district name for a slug ("causeway_bay" → "Wan Chai"), or null. */
export const districtNameOfSub = (slug: string): string | null =>
  SUB_INDEX[slug]?.district.name ?? null;

/** The region id for a slug ("causeway_bay" → "hk"), or null. */
export const regionIdOfSub = (slug: string): RegionId | null =>
  SUB_INDEX[slug]?.region.id ?? null;

/** Every subdistrict slug under a district (for the "Select all" button). */
export const subSlugsOfDistrict = (district: District): string[] =>
  district.subs.map((s) => s.slug);

/** Compact location label for a card from a list of subdistrict slugs:
 *  "" / "Causeway Bay" / "Causeway Bay +2". */
export const subdistrictsLabel = (slugs: string[] | null | undefined): string => {
  if (!slugs || slugs.length === 0) return "";
  const first = subName(slugs[0]);
  return slugs.length > 1 ? `${first} +${slugs.length - 1}` : first;
};
