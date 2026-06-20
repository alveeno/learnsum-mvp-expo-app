import { apiFetch } from "./client";

/**
 * Categories / subcategories (subjects) from the backend.
 *
 *   GET /api/categories → { categories: [{ id, slug, name_en, name_zh,
 *                                          subcategories: [{ id, slug, ... }] }] }
 *
 * The backend taxonomy is re-seeded to mirror the frontend (see the backend
 * migration 0015_seed_taxonomy.sql), so every subcategory `slug` equals the
 * frontend's subject id. That means:
 *  - Onboarding can keep sending subject SLUGS (the backend maps them by slug).
 *  - Anywhere that needs the backend UUID (e.g. the browse filter
 *    `GET /api/tutors?subcategory_id=`) can resolve slug → id here.
 *
 * Results are cached in memory for the session (the list is reference data and
 * rarely changes), matching the rest of the app's in-memory model.
 */

export interface Subcategory {
  id: string;
  slug: string;
  name_en: string;
  name_zh: string;
}

export interface Category {
  id: string;
  slug: string;
  name_en: string;
  name_zh: string;
  subcategories: Subcategory[];
}

export type IndexedSubcategory = Subcategory & { categorySlug: string };

let cache: Category[] | null = null;

/** Fetch the category tree (public, no auth). Cached for the session. */
export async function getCategories(force = false): Promise<Category[]> {
  if (cache && !force) return cache;
  const res = await apiFetch<{ categories: Category[] }>("/api/categories", { auth: false });
  cache = res.categories ?? [];
  return cache;
}

/** Build a `slug → subcategory` index (includes the parent category slug). */
export async function getSubcategoryIndex(
  force = false,
): Promise<Map<string, IndexedSubcategory>> {
  const cats = await getCategories(force);
  const map = new Map<string, IndexedSubcategory>();
  for (const c of cats) {
    for (const s of c.subcategories ?? []) {
      map.set(s.slug, { ...s, categorySlug: c.slug });
    }
  }
  return map;
}

/** Resolve a frontend subject slug → backend subcategory UUID (null if absent). */
export async function subcategoryIdForSlug(slug: string): Promise<string | null> {
  const idx = await getSubcategoryIndex();
  return idx.get(slug)?.id ?? null;
}
