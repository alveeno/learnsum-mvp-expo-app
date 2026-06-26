import { BOUNDS } from "../tutor/tutorData";
import type { Filters } from "../tutor/FilterSheet";
import { districtEnumFromName } from "../onboarding/hkDistricts";
import type { TutorSearchParams } from "../../lib/api";

/**
 * Map the shared FilterSheet `Filters` → the backend's GET /api/tutors query.
 *
 * Only the dimensions the backend supports are sent: price→rate range, age, lesson
 * mode→tutoring_format, districts (names → hk_district enum codes) and gender (app
 * codes → backend enum). The rating/years/sessions/followers sliders are hidden in
 * the seeker sheet (hideUnsupported) and ignored here — they have no backend filter.
 * Range filters are only sent when narrowed from the full bounds, so an untouched
 * slider never excludes tutors who simply haven't set that value.
 */
const GENDER_CODE: Record<string, string> = { boy: "male", girl: "female", lgbt: "lgbt" };

export function filtersToSearchParams(f: Filters): TutorSearchParams {
  const params: TutorSearchParams = {};

  if (f.price[0] > BOUNDS.price[0]) params.min_rate = f.price[0];
  if (f.price[1] < BOUNDS.price[1]) params.max_rate = f.price[1];

  if (f.age[0] > BOUNDS.age[0]) params.min_age = f.age[0];
  if (f.age[1] < BOUNDS.age[1]) params.max_age = f.age[1];

  if (f.mode === "f2f") params.tutoring_format = "in_person";
  else if (f.mode === "online") params.tutoring_format = "online";

  const districts = f.locations
    .map(districtEnumFromName)
    .filter((c): c is string => c !== null);
  if (districts.length) params.district = districts;

  const genders = f.genders.map((g) => GENDER_CODE[g]).filter(Boolean);
  if (genders.length) params.gender = genders;

  return params;
}

/** Filters that the backend ignores but the seeker sheet hides — used to decide
 *  whether to recompute the server query (vs just re-narrowing text). */
export const SUPPORTED_FILTER_KEYS: (keyof Filters)[] = ["price", "age", "mode", "locations", "genders"];
