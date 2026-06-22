/**
 * The app's backend API layer. Import from "lib/api" rather than the individual
 * files so the surface stays in one place.
 *
 *   import { apiFetch, ApiError, signup, login, getMe, getToken } from "../../lib/api";
 */

export { API_BASE_URL } from "./config";
export { apiFetch, ApiError } from "./client";
export type { ApiOptions, QueryValue } from "./client";
export { getToken, setToken, clearToken, hasToken } from "./token";
export { signup, login, logout, getMe } from "./auth";
export type { Role, AuthUser, Session, Profile, MeResponse } from "./auth";
export { getCategories, getSubcategoryIndex, subcategoryIdForSlug } from "./categories";
export type { Category, Subcategory, IndexedSubcategory } from "./categories";
export { postOnboarding } from "./onboarding";
export type { OnboardingResult, OnboardingSkipped } from "./onboarding";
export { patchTutor, setTutorPublished, getTutor, putTutorSubjects, putTutorLanguages } from "./tutors";
export type { TutorProfile, TutorDetail, TutorSubjectInput } from "./tutors";
export { patchProfileMe } from "./profiles";
export type { ProfileMeUpdate } from "./profiles";
export { getAvailability, putAvailability } from "./availability";
export type { AvailabilityMap, TimeRange } from "./availability";
export { getFeed } from "./feed";
export type { FeedResponse, FeedTutor, FeedCategory } from "./feed";
export { getTutorPosts, createPost } from "./posts";
export type { Post, PostMedia, PostType, PostsPage } from "./posts";
