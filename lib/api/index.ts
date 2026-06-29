/**
 * The app's backend API layer. Import from "lib/api" rather than the individual
 * files so the surface stays in one place.
 *
 *   import { apiFetch, ApiError, signup, login, getMe, getToken } from "../../lib/api";
 */

export { API_BASE_URL } from "./config";
export { apiFetch, ApiError } from "./client";
export type { ApiOptions, QueryValue } from "./client";
export { getToken, setToken, clearToken, hasToken, restoreToken } from "./token";
export { signup, login, logout, getMe } from "./auth";
export type { Role, AuthUser, Session, Profile, MeResponse } from "./auth";
export { getCategories, getSubcategoryIndex, subcategoryIdForSlug } from "./categories";
export type { Category, Subcategory, IndexedSubcategory } from "./categories";
export { postOnboarding } from "./onboarding";
export type { OnboardingResult, OnboardingSkipped } from "./onboarding";
export { patchTutor, setTutorPublished, setTutorTier, getTutor, putTutorSubjects, putTutorLanguages, searchTutors } from "./tutors";
export type { TutorProfile, TutorDetail, TutorSubjectInput, BrowseTutorCard, TutorSearchParams, TutorSearchResult } from "./tutors";
export { getSavedTutors, saveTutor, unsaveTutor } from "./saved";
export type { SavedTutor } from "./saved";
export { getSeeker } from "./seekers";
export type { Seeker, SeekerRole, SeekerChild, SeekerContact } from "./seekers";
export { getProfileViewers, recordProfileView } from "./profileViews";
export type { ProfileViewer } from "./profileViews";
export { getContactQuota, unlockContact, DAILY_CONTACT_QUOTA } from "./contacts";
export type { ContactQuota } from "./contacts";
export { getSavedPeople, addSavedPerson, removeSavedPerson } from "./savedPeople";
export type { SavedPerson, SavedKind } from "./savedPeople";
export { getPostLikes, likePost, unlikePost } from "./likes";
export type { LikeState } from "./likes";
export {
  listConversations,
  startConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  getMyId,
} from "./chat";
export type { Conversation, ChatParticipant, ChatMessage, MessagesPage } from "./chat";
export { patchProfileMe } from "./profiles";
export type { ProfileMeUpdate } from "./profiles";
export { getAvailability, putAvailability } from "./availability";
export type { AvailabilityMap, TimeRange } from "./availability";
export { getFeed } from "./feed";
export type { FeedResponse, FeedTutor, FeedCategory } from "./feed";
export { getTutorPosts, createPost } from "./posts";
export type { Post, PostMedia, PostType, PostsPage, NewPostMedia } from "./posts";
export { uploadFile } from "./upload";
export type { UploadKind } from "./upload";
