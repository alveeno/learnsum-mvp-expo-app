# LearnSum (Expo frontend)

> **Expo SDK 56 has breaking changes from earlier versions.** Read the exact versioned
> docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code. Do not rely on
> patterns from older SDKs.

## Project

LearnSum is a Hong Kong–based, two-sided tutoring marketplace **frontend**, built in
React Native and Expo. It connects to a separate Next.js backend API that lives in a
different repository, **`learnsum-mvp-back`**.

Tutors build Instagram-style profiles with a bio block and a scrollable post feed. The
primary tutor target is university students looking for side income.

There are three user types:

- **parent**
- **student**
- **tutor**

## Stack

- **Expo SDK 56** (`expo ~56.0.12`)
- **Expo Router** (`~56.2.11`) — file-based routing; entry is `expo-router/entry`
- **NativeWind v4** (`4.2.1`) with **Tailwind CSS v3** (`tailwindcss 3.4.17`)
- **React Native 0.85** (`0.85.3`)
- **React 19.2** (`19.2.3`)
- **TypeScript** throughout (`~6.0.3`)
- Supporting native modules: `expo-linking`, `expo-status-bar`, `expo-dev-client`,
  `@expo/metro-runtime`, `react-native-reanimated@4.3.1`, `react-native-worklets`,
  `react-native-safe-area-context`. **Native batch** (added together — one EAS rebuild):
  `expo-secure-store` (session persistence), `@react-native-async-storage/async-storage`
  (language persistence), `expo-image-picker` + `expo-file-system` (media pick/upload),
  `expo-blur`, `expo-linear-gradient`, `expo-clipboard`, `expo-haptics`, `lottie-react-native`
  (deferred — needs assets), `expo-audio` (the sound-effects **fallback** in `components/ui/sound.ts`;
  clips in `assets/sounds/`). Later additions (**each needs an EAS rebuild**): `expo-asset` (loads
  the sound clips into the native pool) and a **local Expo module `modules/expo-sound-pool/`** (iOS
  `AVAudioEngine` low-latency SFX pool — the preferred sound backend; see "Tutor app shell" caveats).
  **`expo-font`** loads a bundled **Patrick Hand** handwriting font (`assets/fonts/` + OFL license;
  runtime `useFonts` in `app/_layout.tsx`, **no rebuild** — `expo-font` already ships in the build)
  for the tutor **student-slots** guide text on `TutorSD`.

## Backend connection

- **All API calls go through the Next.js backend** at `EXPO_PUBLIC_API_URL`.
  Never call Supabase directly from this app.
- The backend is **currently at `http://localhost:3000`** — **update this to the Vercel
  URL after deployment.**
- For the full database schema and API endpoint reference, see **`PLAN.md` in the backend
  repo (`learnsum-mvp-back`)**. A plain-English screen→endpoint map lives in that repo's
  **`FRONTEND_WIRING.md`**.
- **The API layer lives in `lib/api/`** — import from `lib/api`. `config.ts` resolves the
  **single** base URL from `EXPO_PUBLIC_API_URL` (and auto-swaps `localhost` → the Mac's LAN IP
  when running on a physical device, so device builds reach the backend; that path also needs the
  `NSAllowsLocalNetworking` ATS entry now in `app.json`). `client.ts` is the shared `apiFetch`
  helper: it attaches `Authorization: Bearer <token>`, encodes JSON + query strings, times out,
  and throws a typed `ApiError` whose **`isNetworkError`** flag drives the `__DEV__` offline-mock
  fallback. `token.ts` persists the whole session to **`expo-secure-store`** (in-memory cache backs
  synchronous reads): the **access token** (Bearer), the **refresh token**, and the **last signed-in
  role** (`getStoredRole`, for cold-start routing). `restoreToken()` in `app/_layout.tsx` reloads all
  three on a cold start. **Sessions now survive the ~1h access-token expiry** via a **refresh flow**:
  `refreshSession()` (`lib/api/auth.ts` → **`POST /api/auth/refresh`**) exchanges the refresh token for
  a fresh session, and it's registered as `apiFetch`'s **401 auto-retry** (`setTokenRefresher` in
  `client.ts` — no import cycle; on a 401 with a refresh token, apiFetch refreshes once and retries).
  So a returning user stays logged in until they log out or the refresh token is revoked.
  **Cold-start routing (the "don't log in every time" fix):** `app/index.tsx` (the welcome screen, the
  initial route) shows a brand splash and calls `resolveLaunchDestination()`
  (`components/auth/launch.ts`) — with a restored session it `router.replace`s straight to the role's
  home (`homeForRole` → `/tutor-home` or `/feed`); **offline it still opens to home** using the stored
  role (getMe network-errors → last known role); only a genuinely dead/absent session falls through to
  the welcome UI. (`homeForRole` is shared with the login-sheet handoff.)
- **Wired so far:** auth (`signup` / `login` / `logout` / `getMe`, in `lib/api/auth.ts`),
  `getCategories()` (`lib/api/categories.ts`), and the **tutor onboarding one-shot save**
  (`postOnboarding` + `components/onboarding/tutorOnboardingPayload.ts`, fired from the
  `TutorProfileConfirm` publish sheet). The backend taxonomy was **re-seeded to mirror this app's
  subject list** (backend migration `0015_seed_taxonomy.sql`, generated from `StudentCatSel.tsx`)
  so subjects map by slug — the **frontend is the source of truth** for categories; per-subject
  lesson **format + districts** were added to the backend to match the app (migration `0016`).
  **Publish** (`setTutorPublished` → `PATCH /api/tutors/[slug]` `is_published`, `lib/api/tutors.ts`,
  fired from the publish sheet) is also wired. The **own Profile tab** is wired too: it renders the
  shared **`ProfileBody`** (the rich `TutorProfileConfirm`-style layout, extracted into
  `components/tutor/ProfileBody.tsx`) from real data (`GET /api/auth/me` → `profileMapping.ts`), with
  a settings button + a **"Change preferences"** sheet that routes into the onboarding screens via an
  **edit mode** in `tutorOnboarding.ts`. **Editing now saves** (`components/tutor/tutorEditStore.ts`):
  tapping a section's Continue first **pre-fills** the in-memory onboarding store from the tutor's real
  data (`hydrateTutorStoreFromMe`, fed by `GET /api/auth/me` + `GET /api/availability`) so the screens
  show current values and a full-replace save can't wipe an untouched section; the chosen screens are
  walked; then a final **`TutorEditSave`** step flushes everything **at once** via the five edit
  endpoints (`saveTutorEdits` → `PATCH /api/profiles/me` · `PATCH /api/tutors/[slug]` ·
  `PUT /api/tutor/subjects` · `PUT /api/tutor/languages` · `PUT /api/availability`), with a saving
  spinner + retry on error and a `__DEV__` offline no-op. On return the tab refetches
  (`consumeProfileDirty` via `useFocusEffect`). Two **small backend changes** were needed (route-only,
  no migration): `PUT /api/tutor/subjects` now persists per-subject **`format` + `districts`** and
  accepts the app's **array** qualifications/exam_results (it previously only took `{en,zh}` objects and
  had no format/districts), and `PATCH /api/profiles/me` now accepts the **`lgbt`** gender. `ProfileBody`
  is **shared by all three profile surfaces** —
  the onboarding review (`TutorProfileConfirm`, now deduped onto it), the own Profile tab, and the
  **"view another tutor"** overlay (`TutorProfileView` → `getTutor` / `GET /api/tutors/[slug]`, with a
  sample-data fallback for the still-sample tutor lists). The `me`/`tutors/[slug]` reads were extended
  to return per-subject `format`/`districts` (+ `me` returns the subject's parent category). When
  there's no real session the Profile tab shows a "couldn't load" state (no fake data); the
  **social-login buttons are placeholders** that clear the session and continue (use email sign-up to
  actually save). **Tutor posts** are partly wired (`lib/api/posts.ts`): a tutor can **create a
  text post** (the Home feed **"+"** and a Posts-section header both open the composer at
  `app/post-new.tsx` → `POST /api/tutors/[slug]/posts`, with a `post_type` of update/showcase/result)
  and **see their own posts** in a new **Posts section** on the Profile tab
  (`components/tutor/TutorPosts.tsx` → `GET /api/tutors/[slug]/posts`, sent **with the token** so the
  owner reads their own posts while still unpublished; refetched via a `markPostsDirty` flag after
  creating). **Image/video upload is now wired** (`expo-image-picker` + `lib/api/upload.ts` →
  `POST /api/upload` signed URL → `expo-file-system` PUT → public URL on the post; the composer
  attaches a photo/video and the Posts list renders it). The **Home feed** of other tutors' posts
  stays **sample data** (no
  post-stream endpoint, and it's the deferred seeker/browse surface). The **contact buttons** are now
  wired — **WhatsApp + WeChat only** (Instagram was dropped per a product decision). A tutor enters
  them in a "How can students reach you?" block on **`TutorAbout`** (optional;
  `tutor:about:whatsapp`/`tutor:about:wechat`); they're saved on first publish via the existing
  post-onboarding **`PATCH /api/tutors/[slug]`** (`whatsapp_number`/`wechat_id` — **no backend change
  needed**) and via the edit flow (`saveTutorEdits` + hydrate). The **"view another tutor"** overlay
  (`TutorProfileView`) shows a green **WhatsApp** button (opens a pre-filled `wa.me` chat via
  `Linking`) and a **WeChat** button (copies the ID to the clipboard via `expo-clipboard` +
  confirms in an `Alert`), each only when that field is set. (This is the **loop-closing** Tier-1 step. The
  buttons aren't shown on the own-profile/onboarding-review surfaces — only where contacting happens.)
- **Now wired to real backend data** (a batch added alongside backend migrations 0017–0020, all
  applied to live Supabase — accurate detail in the backend repo's `FRONTEND_WIRING.md` §3.7/§3.10
  and `BACKEND_GAP_ANALYSIS.md`):
  - **Search** — **both** the seeker (`components/seeker/SeekerSearchScreen.tsx`) and tutor
    (`components/tutor/SearchScreen.tsx`) Search tabs query **`GET /api/tutors`** via `searchTutors`
    (`lib/api/tutors.ts`), driven by the shared `FilterSheet`. `components/seeker/searchFilters.ts`
    (`filtersToSearchParams`) maps the sheet's `Filters` → query params: price→rate range, age,
    lesson mode→`tutoring_format`, districts (names → `hk_district` enum via `districtEnumFromName`),
    gender (app codes → backend enum). The **rating/years/sessions/followers** sliders have no
    backend filter, so they're hidden via the sheet's **`hideUnsupported`** prop and ignored. Range
    filters are only sent when narrowed from the full bounds (an untouched slider never excludes
    tutors). Results render as `BrowseTutorCard`s.
  - **Saved** — `components/seeker/savedTutors.ts` is now **backend-backed** (`lib/api/saved.ts`:
    `GET /api/saved` · `POST /api/saved` · `DELETE /api/saved/[id]`, keyed by tutor **slug**). It's
    still the shared module-level store (`useSyncExternalStore`) so the Saved tab, search, and the
    `/tutors/[slug]` route stay in sync, but writes are now **optimistic** (icon flips, then the
    request runs, reverted on failure) and `hydrateSaved()` loads existing bookmarks once after
    sign-in (the seeker shell calls it). The sample-data Home feed keeps its **own** local set — only
    real slugs belong in the backed store.
  - **Post likes** — wired on the tutor profile post feed (`components/tutor/TutorPostFeed.tsx`) via
    `lib/api/likes.ts` (`POST` / `DELETE /api/posts/[id]/likes`); the posts feed returns
    `liked_by_me` per post for initial state, and each like/unlike returns the fresh authoritative
    `likes_count`. (The **Home** feeds' likes — tutor + seeker — are still local sample state.)
  - **In-app chat** — a real REST-polling messaging feature (`lib/api/chat.ts`): `GET /api/conversations`,
    `POST /api/conversations { participant_id }` (start/find a 1:1 thread), `GET`/`POST
    /api/conversations/[id]/messages` (paginated, newest-first), `PATCH …/messages` (mark read). The
    backend supports Realtime, but the app **polls** (no Supabase client — it re-fetches on an
    interval while a screen is open). UI in `components/chat/` (`ChatList.tsx` + `ChatThread.tsx`) and
    routes `app/messages/index.tsx` + `app/messages/[id].tsx`. **Entry points:** the tutor shell's
    **Chat tab** (`ChatList` in `app/tutor-home.tsx`), the seeker **Account → Messages** row, and a
    **"Message"** button on tutor profiles (`TutorProfileContent.tsx` → `startConversation` →
    `/messages/[id]`; falls back to a "log in to message" alert for the sample tutors that have no
    real account id).
  - **Per-subject teaching levels** — the tutor's chosen levels are now sent **per subject** in the
    onboarding payload (`tutorOnboardingPayload.ts`) and the tutor-subjects edit (`tutorEditStore.ts`);
    backend migration 0020 stores them on `tutor_subcategories.levels`.
  - `lib/api/client.ts` now sends an **`ngrok-skip-browser-warning: true`** header so dev tunnels
    return JSON instead of ngrok's browser-warning HTML (harmless on non-ngrok hosts).
- **Still sample data (deliberate "leave Home as-is" decision):** only the **seeker Home feed**
  (`components/seeker/SeekerFeedScreen.tsx`) and its like/save, plus the **tutor Home feed**
  (`FeedScreen`) — there's no post-stream endpoint (`getFeed` returns tutor *cards*, not posts).

## Design system

| Token            | Value     |
| ---------------- | --------- |
| Primary          | Forest Green `#2D6A4F` |
| Accent           | Gold `#F4A923` |
| Background        | White `#FFFFFF` |
| Surface          | Off-white `#F9F9F7` |
| Muted text        | `#6B7280` |
| Destructive       | `#E63946` |

UI conventions:

- **Circular avatars** everywhere.
- **16pt rounded corners** on cards.
- **Pill-shaped buttons.**
- Icons via **`@expo/vector-icons`**.

## Navigation structure

File-based routes (Expo Router). Route map:

| Route            | Purpose |
| ---------------- | ------- |
| `/`              | Welcome screen with user-type selection — **built** |
| `/tutor-home`    | **Tutor app shell** a tutor lands on after picking "Tutor" — a 5-tab experience (Home / Search / Chat / **Saved** / Profile). **Built**; **Search + Chat are now backend-wired**, Home stays sample data. **Analytics moved off the tab bar** to the Home **heart icon** (`/analytics`); its old slot is the **Saved** tab — see "Tutor app shell" below |
| `/analytics`     | Tutor **Analytics**, opened from the Home feed **heart icon** — headline is a **free, tappable "who viewed your profile"** list (profile viewers → tap to open a seeker); the reach/post dashboard below stays a premium mock. **Built** (viewers + quota are mock/`__DEV__` fallback pending backend) |
| `/seekers/[id]`  | **Seeker (parent/student) profile**, viewed by a tutor from the viewers list or Saved tab — shows preferences, category, child level + age, **never the phone**; contact (phone/WhatsApp/WeChat/chat) is **locked behind a 3-per-day contact quota** (`components/tutor/contactQuota.ts`). **Built** (sample-data fallback; backend gaps below) |
| `/feed`          | **Seeker (student/parent) app shell** — a 4-tab experience (Home post-feed / Search + Quick Match / Saved / Account). **Built**; **Search + Saved are now backend-wired**, only the **Home feed** stays sample data — see "Seeker app shell" below. Student/parent land here after onboarding/login |
| `/messages`, `/messages/[id]` | **In-app chat** — conversation list + thread, REST-polling (`lib/api/chat.ts` → `/api/conversations*`). **Built** (real backend). Reached from the tutor Chat tab, the seeker Account → Messages row, and the "Message" button on a tutor profile |
| `/tutors/[slug]` | Public tutor profile page (bio + post feed + WhatsApp/WeChat) — **built** (real shareable route; reuses the shared `TutorProfileContent`; the seeker shell pushes into it; sample-data fallback when the slug isn't a real tutor) |
| `/search`        | Standalone seeker search route — **→ Todo** as a *standalone* route, but a **Search tab + Quick Match card is built inside the `/feed` seeker shell** (and a tutor Search tab inside `/tutor-home`) |
| `/profile`       | Standalone profile route, editing, account deletion, publish/unpublish — **→ Todo** (a tutor Profile tab is in `/tutor-home`; a seeker **Account** tab is in `/feed`) |
| `/auth/gate`     | Tutor **log in / sign up** gate, shown when an unregistered user hits a gated action in `/tutor-home` — **built** (front-end mock: opens `LoginSheet` or the `SignUp` flow). Full email+password / social auth routes **→ Todo** |
| `/post-new`      | Tutor **post composer** (text + a post_type + optional photo/video) → `POST /api/tutors/[slug]/posts` (+ `POST /api/upload`) — **built**; opened from the Home feed "+" and the Profile Posts section |
| `/onboarding/CreateAccount` | **Student/parent final credential step** (email + password / social) → `POST /api/auth/signup` then the **best-effort** one-shot save → `Welcome` → `/feed` — **built** (Option A: credentials on the last step; reuses the trilingual `signup.*` copy) |
| `/onboarding/SeekerAbout` | **Seeker "About you"** (name / bio / gender / photo / phone / education — a current level + a full school history for students) — the `TutorAbout` analogue for student/parent. Used as an onboarding step (before `CreateAccount`) **and** as the Account-tab **Edit profile** screen (`mode=edit` → `PATCH /api/profiles/me`) — **built + persisted + verified e2e** (migrations 0022/0023 applied) |

> **No `/notifications` route — notifications aren't built (see the Todo list).**

Onboarding is **built** and lives under `app/onboarding/` (PascalCase route files),
one flow per role:

- **Student:** `StudentEducationLevel` → `StudentCatSel` → `StudentPrefs` → `SeekerAbout`
  → `CreateAccount` (final credential step; Skip on Prefs bypasses straight to `/feed`)
- **Parent:** `ParentNumChild` (per-child name + education level + an **optional age** field —
  age isn't required to Continue; sent best-effort in `seekerOnboardingPayload.ts`, backend column
  pending — see backend gaps) → `ParentChildSetup` (per-child categories +
  preferences, one child at a time, then a review) → `SeekerAbout` → `CreateAccount`
- **`SeekerAbout` (`app/onboarding/SeekerAbout.tsx`, both seeker flows):** the seeker analogue of
  `TutorAbout` — collects the seeker's **name, bio, gender, profile photo, phone number** and (students
  only — hidden for parents, whose level belongs to their child) **education**. Field order is photo →
  name → **bio** → gender → education → phone. Name + gender are required; the rest optional. Same
  building blocks as `TutorAbout` (the `expo-image-picker` + `uploadFile("avatar")` photo flow, the
  4-option gender grid, the in-memory store under `seeker:about:*`). **Education = a current level
  (`student:eduLevel` pills, kept for seeker→tutor matching/search) PLUS a full per-level school
  history** — the **shared `EducationSection`** (`components/onboarding/EducationSection.tsx`, extracted
  from `TutorAbout` so the two are identical: school name / qualification / score searchable dropdowns +
  "Currently studying / Finished"), stored at `seeker:about:eduByLevel` and persisted to
  `student_profiles.education` (jsonb). It runs in **two modes** (`mode` param): in onboarding it's the
  last data step before `CreateAccount`; in **edit** mode it's opened from the Account tab (store
  pre-seeded from `GET /api/auth/me` via `hydrateSeekerAboutFromMe`) and **saves** on its own via
  `saveSeekerProfile` → `PATCH /api/profiles/me` (helpers in `components/onboarding/seekerProfile.ts`;
  the shared gender maps were extracted here, also used by `tutorEditStore.ts`). The collected profile
  is also sent in the one-shot onboarding save — the previously-empty `profile: {}` block in
  `seekerOnboardingPayload.ts` is filled by `buildSeekerProfileBlock()`, and the student section now
  carries `education`. **Name/gender/avatar/bio/phone + school_level + education history all persist and
  round-trip (backend migrations 0022/0023 applied; verified end-to-end).**
- **Tutor:** `SignUp` (email + password / social — account gate) → `TutorTeachLevels` →
  `TutorCatSel` → `TutorSD` (Strengths & Details — a per-subject accordion collecting **student
  slots** (per-subject capacity — two compact scroll wheels reading "currently teaching / capacity"
  like `0/1`, with handwritten guide text under each via the bundled **Patrick Hand** font in
  `assets/fonts/`, loaded at runtime in `app/_layout.tsx`; the "currently teaching" wheel is bounded
  by the chosen capacity; **frontend-only for now** — kept in the onboarding store and shown on the
  review + own-profile surfaces, but **not yet persisted to the backend**, so the server-sourced own
  Profile tab shows the default `0/1`), years of
  **teaching** experience, preferred pay, **lesson format** (In person / Online / Both,
  default Both), **location** (only for In person / Both — region tabs + an expandable
  district→subdistrict picker via the shared `DistrictPicker`, stored as subdistrict slugs; later
  subjects get a **"Same as previous"** chip that copies the districts from the nearest earlier
  in-person subject), achievements, experience and
  qualifications; the **pay slider is non-linear** — small $10 steps near the bottom growing to
  $100 near the top, so the common $200–$500 range is easy to land on. It's a **Reanimated +
  gesture-handler** slider whose thumb runs on the **UI thread** (zero-lag, with a per-step haptic
  tick) — `ValueSlider` in `TutorSD.tsx`; the old PanResponder version lagged behind a fast drag) →
  `TutorPrefs` →
  `TutorAbout` (a **profile
  photo** — a **real** picker now (`expo-image-picker`, library/camera, square crop) that uploads to
  Storage and saves to `profiles.avatar_url` on finish/edit; **WhatsApp + WeChat** contact (see
  Contact flow); **first name, last name and gender are required to Continue**; bio + education stay
  optional). Education entries use
  **searchable dropdowns** (`SearchSelect` + `components/onboarding/eduOptions.ts`): school name
  (universities for the University level, HK secondary schools for the Secondary level) and the
  secondary qualification + score/honours, each with a **free-typed fallback** (type + Return); the
  **university degree is a free-text field** (tutors type the exact degree). Only **Secondary &
  University** carry a per-entry **Currently studying / Finished** status (Kindergarten / Primary
  show just the school name — a tutor must have finished them); choosing **Currently studying**
  hides the score field (no result yet) and clears any entered score. There is **no separate
  "currently studying" section**. Continue → `TutorProfileConfirm`.
  `TutorProfileConfirm` is a **read-only review** that gathers everything entered across the flow
  and lays it out like the tutor's public profile (profile card, About/bio, Education with real
  university logos, Subjects-taught accordion, Languages, Levels-taught track). Its **"Looks good —
  finish"** goes to the shared **`Welcome`** screen, then **`/tutor-home`**. *(The old `TutorNext`
  placeholder has been removed.)* See "Tutor profile review" below.
- **Shared completion (`app/onboarding/Welcome.tsx`):** every role's final **Continue** lands on a
  "Welcome to LearnSum" screen whose own Continue clears the onboarding stack and routes to the
  role's home — **tutor → `/tutor-home`, student/parent → `/feed`** (passed in as a `next` route
  param). Skipping out of a flow still goes straight to `/feed`, bypassing `Welcome`. For
  **student/parent**, the final Continue first passes through **`CreateAccount`** (the credential
  step), which on success routes on to `Welcome` → `/feed`.

**Routing from the welcome screen:** **student** and **parent** go straight into the first
screen of their onboarding flow, which finishes on the shared `Welcome` screen and then `/feed`
(a placeholder "You're all set" screen). **Tutor is home-first:** picking "Tutor" goes directly
to **`/tutor-home`** (the tutor app shell, in its first-time / not-yet-set-up state). The tutor
onboarding flow above is reached **from there** — via the gold **"Complete profile"** banner on
the Home feed and the **"Set up your profile"** gate on the Profile tab. On Continue, the final
data step (`TutorAbout`) opens the `TutorProfileConfirm` review, which then goes through `Welcome`
and back to `/tutor-home` (the old `TutorNext` placeholder was removed). **Resuming** skipped steps
from the banner goes straight home, bypassing both `TutorProfileConfirm` and `Welcome`.

**Completion + resume (`components/onboarding/tutorOnboarding.ts`):** a step counts as done
once the user presses **Continue** on it (Skip / never-reached = incomplete). The Home banner
and Profile gate show only while ≥1 of the five profile steps is incomplete, and **hide once
all are done** — re-checked when `/tutor-home` regains focus (the in-memory store has no
subscription). Tapping the banner **resumes only the skipped steps** in order, jumping over
completed ones; first-timers pass through `SignUp` first, returning (signed-up) tutors jump
straight in. Because a resumed step can be entered directly, `TutorSD` reads its
subjects/levels from the store (`tutor:interests` / `tutor:levels`) rather than route params.
The local completion map is **session-only** (a full reload/login resets it) — so on `/tutor-home`
focus the shell **reconciles it with the backend**: when the user is registered but the local map
is blank, it calls `GET /api/auth/me` and, if `profile.onboarding_done` is true, marks all steps
done (`markAllStepsDone`) so a **returning, already-onboarded tutor isn't asked to set up again**
(the gate/banner is suppressed while that check is in flight to avoid a flash). Offline / no session
falls back to showing the gate.

**Tutor profile review (`app/onboarding/TutorProfileConfirm.tsx`):** the last screen of the tutor
flow — a **read-only** preview that reads the whole onboarding store (a one-shot snapshot, no
subscription) and renders it as the tutor's public profile would look. Sections: a profile card
(initials `Avatar`, single-line name, gender, and a derived **"Qualified"** badge shown **only**
when ≥1 subject has a real qualification), **About** (the optional bio), an **Education** accordion,
a **Subjects-taught** single-open accordion (collapsed row keeps an at-a-glance grade chip + price
per subject; expanded = the subject's own **lesson-format pill** + its **districts** (in-person
subjects only), **Years exp / Per hour / Students** stat
tiles (the **Students** tile shows the per-subject slots `current/capacity` — `0/1` for
server-sourced profiles until the slots feature is wired to the backend), then **Qualifications**,
**Achievements** and **Experience** each in their own card with a big icon-led heading —
Qualifications render as **grade-tiles** (big result on top, short "type + subject" label, e.g.
`7` / "IB Mathematics: AA HL"; results with no exam-style grade fall back to a line)), **Languages**
(proficiency bars), and a **Levels-taught** track. The **Education accordion** groups schools by
level with clear labels and shows **University & Secondary collapsed**; a "Show all education"
toggle reveals the remaining levels (Primary / Kindergarten). Each entry whose TutorAbout status is
**Currently studying** gets a green "Currently studying" badge (the status is a per-entry flag now,
not a separate list). **English-only** (it mirrors the English-only `/tutor-home` profile, and
most content shown is the deferred English-only content lists). University/secondary **logos** come
from a small name→domain map of well-known HK universities pulled via Clearbit
(`logo.clearbit.com/<domain>`); unrecognised schools (and any failed load) fall back to a generic
crest tile. Fields the reference design shows but onboarding never collects — **rating**, post
**"Highlights"**, and **student counts** — are intentionally omitted. The back arrow returns to
`TutorAbout` to edit. **"Looks good — finish"** opens a **publish bottom sheet** ("Make your
profile public?"): a master **Public profile** toggle and, when it's on, two audience toggles —
**Parents & students** (search + public profile) and **Tutors** (the tutor feed / suggestions),
all defaulting on. With Public on you must keep ≥1 audience (the finish button disables
otherwise); turning Public off finishes the profile **private/unpublished**. The sheet's button
(**"Publish & finish"** / **"Keep private & finish"**) writes the visibility choice to the store
(`tutor:visibility` = `{ public, parentsStudents, tutors }`) **and now performs the one-shot
`POST /api/onboarding`** — building the whole tutor parcel from the store
(`components/onboarding/tutorOnboardingPayload.ts`) and saving it (disabled-while-saving + an
inline error; `__DEV__`/offline falls through). On success, if **Public** is on it then fires a
best-effort **`PATCH /api/tutors/[slug]` `{ is_published: true }`** (`setTutorPublished`) to publish,
and routes to `Welcome` → `/tutor-home`. Only `tutor:visibility.public` maps to the backend's single
`is_published` — the two **audience toggles** (parents&students / tutors) stay in the store, unsent,
pending a real audience-visibility feature (they'd need feed/search/suggestion filtering to mean
anything). Everything *displayed* on the screen is still read-only. (English-only, like the rest of
the screen.)

**Account gate (`SignUp`, tutor flow only):** the tutor flow now opens with a sign-up screen
that takes email + password (and Google/Apple/Microsoft buttons) **before** any info is
collected, to catch returning users. **Continue now calls the real backend** (`POST
/api/auth/signup` via `lib/api`): a new email creates the account and stores the session token,
then continues into onboarding; an email that already exists (or a "session-less" signup) opens
the existing `LoginSheet` (pre-filled). If the backend is unreachable it shows a **"can't reach the
server"** error — a real backend is **required**; there is **no offline fake sign-up** (the old
`REGISTERED_EMAILS` `__DEV__` mock, which waved the user into onboarding with nothing saved, was
removed — matching the login change). The screen also has a
persistent **"Already have an account? Log in"** link at the bottom so a returning tutor can open
the `LoginSheet` directly (email pre-filled if typed) instead of typing into the register form and
getting bounced — i.e. no double credential entry; logging in there `dismissTo`s `/tutor-home`.
**This intentionally diverges from Option A below** (which collected credentials on the *final*
step) — for the tutor flow, credentials now come first.

**The real next work:** `SignUp` / `LoginSheet` create/restore the Supabase **session**
(`lib/api/auth`; email verification is OFF, so the new session is live immediately), and the
**tutor onboarding store is now flushed to the backend in one shot** at the `TutorProfileConfirm`
publish sheet (`POST /api/onboarding` via `tutorOnboardingPayload.ts`). Still Todo: the same
one-shot save for **student/parent**, and the **final credential step for student/parent**
(Option A). **Social login is planned** — only **Google** is configured on Supabase; the Apple /
Microsoft buttons on `SignUp` and in `components/auth/LoginSheet.tsx` are still placeholder UI. A tutor is **unpublished** until they
finish setup; the dedicated profile-completion screen (bio, photo, WhatsApp, WeChat
+ remaining details) and **standalone** publish / self-unpublish (from a Profile/Settings route)
are **not built yet** — for now the tutor onboarding flow stands in for it, and the **initial**
publish choice (public + per-audience visibility) is collected on the `TutorProfileConfirm`
publish sheet (see "Tutor profile review" above; saved to `tutor:visibility`). **Log in** uses the `LoginSheet` bottom sheet (opened
from the welcome screen, the `SignUp` screen, and the `/auth/gate` route); its "Log in" button now calls **`POST
/api/auth/login`** (`lib/api/auth`) — storing the session token, marking the user registered,
resolving the account's **role** via `GET /api/auth/me`, and handing off via **`onLoggedIn(role)`** —
with a one-line inline error on bad credentials **or an unreachable server**. A **real session is
required**: there is **no offline fake-login** (the old `__DEV__` accept-on-network-error fallback
was removed — it left the user "logged in" with no session whenever the backend was down, so the
setup banner stayed and the profile tab was empty; start the backend / point `EXPO_PUBLIC_API_URL`
at it to log in for real). **From the welcome screen the login now routes by role**
(this was previously a no-op that just closed the sheet): **tutor → `/tutor-home`**, **student/parent
→ `/feed`** (their flows aren't built yet), and an unknown/`null` role defaults to `/tutor-home`
(the path in active development). The `SignUp` / `/auth/gate` callers ignore the role and go to
`/tutor-home` (tutor-only surfaces). The social buttons and "Forgot password?" stay inert, and
there's no standalone `/auth` login route yet.

**In-app chat is now built** (`/messages` routes + `lib/api/chat.ts`, REST-polling — see "Wired so
far"). Tutor-profile **WhatsApp + WeChat** buttons (both optional, either or both — **Instagram was
dropped**, a product decision) remain the *off-app* contact path; there's still **no inquiry form**.

## Tutor app shell (`/tutor-home`)

The tutor's post-pick landing, **ported from the Claude Design "Tutor Home" handoff** and
living in `components/tutor/`. A single stateful shell (`app/tutor-home.tsx`) with a custom
bottom tab bar that switches five tabs, plus a shared "view another tutor" overlay
(`TutorProfileView`):

- **Home** (`FeedScreen`) — editorial Instagram-style feed: gold **"Complete profile"** banner
  (→ onboarding), stories row, post cards with like (red pop + count), and a "Tutors you may
  know" strip. The strip is **logged-in only** and lists other tutors who share the signed-in
  tutor's **university** (matched against `ME.school`). **No comments** — the comment sheet,
  count and "view all comments" were removed; likes stay. The feed cards are **sample data**, but
  the header **"+"** is now live: registered tutors open the **post composer** (`app/post-new.tsx`);
  unregistered ones hit the auth gate. The header **heart icon** opens **Analytics** (`/analytics`,
  the "who viewed your profile" list — see below); it was inert before. (Adding a **story** is still
  a stub — stories aren't backed.)

**Contact quota (`components/tutor/contactQuota.ts`):** a tutor may **unlock** a parent/student's
contact (phone / WhatsApp / WeChat / in-app chat) at most **3 per day**. An unlock is **permanent**
(re-contacting that seeker is free forever); the 3-a-day allowance **resets daily**. This replaces
the premium paywall as the monetization lever. The store is `useSyncExternalStore` + an AsyncStorage
mirror (so the daily reset + permanent unlocks survive a reload in the mock) over
`lib/api/contacts.ts` (`/api/tutor/contact-quota` + `/api/tutor/contact-unlocks`, mock until built).
On a seeker profile (`/seekers/[id]`, `components/seeker-profile/SeekerProfileContent.tsx`) the phone
and contact buttons are **hidden behind an "Unlock contact (N of 3 left)" CTA** (a `ConfirmModal`
spends one unlock; 0 left → "resets tomorrow" alert). **Seeker data is mock** (`sampleSeekers.ts` →
`getSeeker`, `lib/api/seekers.ts`) and **English-only** like the rest of the shell.
- **Search** (`SearchScreen` + `FilterSheet`) — **now queries `GET /api/tutors`** (real results),
  with trending tags, recent searches, and the advanced filter sheet (gesture-driven dual sliders,
  the shared **subdistrict `DistrictPicker`** for location → `subdistrict` slugs, gender; the
  rating/years/sessions/followers sliders are hidden via `hideUnsupported` — no backend filter). See
  "Wired so far".
- **Chat** (`ChatList`) — **now backend-wired** (REST-polling): the conversation list, opening a
  thread at `/messages/[id]` (`ChatThread`). See "Wired so far".
- **Saved** (`TutorSavedScreen`) — **replaces the old Analytics tab.** A **mixed** bookmarks list:
  the other **tutors AND parents/students** the tutor saved, backed by the shared
  `components/tutor/savedPeople.ts` store (`useSyncExternalStore` + optimistic writes +
  AsyncStorage mirror; `lib/api/savedPeople.ts` → `/api/saved/people`, mock until built). A tutor
  saves from the **Search** results (a `SaveButton` added alongside the existing **Follow**), the
  **profile-viewers** list, or a **seeker profile**. Tapping a tutor opens the in-shell tutor
  overlay; tapping a seeker opens `/seekers/[id]`.
- **Analytics is no longer a tab** — it moved to the Home feed **heart icon** (`AnalyticsScreen`
  via the `/analytics` route). Its headline is now a **free** "who viewed your profile" list
  (`getProfileViewers`, `lib/api/profileViews.ts`, sample fallback) — tappable rows → `/seekers/[id]`,
  each with a `SaveButton`. The reach/post charts below stay a **premium paywall mock** ("Upgrade"
  reveals locally). The monetization lever is now the **contact quota** (below), not the paywall.
- **Profile** (`ProfileScreen`) — own profile, **dimmed behind a "Set up your profile" gate**
  (→ onboarding) until setup is done. Once set up it shows the tutor's **real** profile via the
  shared **`ProfileBody`** layout (`GET /api/auth/me`), with a settings button (inert) and a
  **"Change preferences"** sheet (the 5 onboarding sections) that re-opens the onboarding screens to
  edit. Those edits now **save** back to the backend (pre-fill from `me` + availability → walk the
  chosen screens → `TutorEditSave` flushes via the five edit endpoints; see "Wired so far"). Below
  the profile, a **Posts section** (`TutorPosts`) lists the tutor's own posts (`GET
  /api/tutors/[slug]/posts`, **text-only**) with a **"New post"** button → the same composer.

**Auth gate (front-end mock):** the shell treats the user as **registered** only after they pass
`SignUp` or the mock Log in (`components/auth/authState.ts` — session-only flag). While
unregistered, engagement actions — **like, connect, advanced search filters, create post, add
story** — route to the **`/auth/gate`** screen (Log in / Sign up) instead of acting, and the
"Tutors you may know" strip is hidden. (The old `__DEV__`-only "registered" demo toggle was
**removed** — the real signup/login session drives this now.) The **Profile tab has a red "Log out"
button** at the bottom: it clears the session (`logout()` — token + keychain) and **wipes the
in-memory onboarding store** (`resetStore()` — completion map, `registered` flag, staged answers)
for a clean slate, then returns to the welcome screen, so a fresh signup re-runs onboarding from
scratch. **`logout()` clears the local session *synchronously* before the caller navigates** — otherwise
the cold-start launch gate on `/` would still see a live token and bounce back to home (that was a bug) —
then best-effort **revokes the refresh token(s) server-side** (`POST /api/auth/logout` → GoTrue
`scope=global`, using the captured access token, or the refresh token if it's expired) so the session
can't be resumed. Real auth / session persistence is fully wired (SecureStore) **including a refresh-token
flow** — the session survives cold starts and the ~1h access-token expiry, and a cold start routes
straight to the role's home (see the backend-connection notes on `token.ts` / `resolveLaunchDestination`).

**Caveats (prototype):** **Search + Chat are now backend-wired** (real `/api/tutors` results + real
REST-polling messaging — see "Wired so far"); what remains front-end only is the **Home feed**
(sample posts) and the **Analytics/Premium** tab (no real payment). **English-only** (not yet wired
into i18n — unlike the rest of the app). The **blur/paywall and
gate now use real `expo-blur`**, and accent surfaces (setup banner/card, story rings, paywall
button) use **real `expo-linear-gradient`** — these were flat-colour/opacity approximations before
the native batch. Story items + the setup banner use a Reanimated **`PressableScale`** (press
spring + haptic), and every shared `Button` fires a light haptic. **Sound effects are wired**
(`components/ui/sound.ts`): a sound rides with the button tap, the like pop, and success/error, plus
a per-icon "pop" on the onboarding category/subject grid cascade (fired as each `SelectableCircle`
lands — see "Onboarding shared pieces"). The clips live in `assets/sounds/`
(`tap/like/success/error/pop.mp3`). `sound.ts` has **two backends, chosen at runtime**: a **native
low-latency pool** (`modules/expo-sound-pool/`, a local iOS Expo module — `AVAudioEngine` with a
player-node pool playing clips pre-decoded into PCM buffers, so playback is near-instant + in sync
with animation; **needs an EAS rebuild** as it's native code), with **`expo-audio` as the fallback**
when the native module isn't in the binary (old build, Simulator, Expo Go). Clips are loaded into the
pool at startup via `expo-asset` (`initSounds()` in `app/_layout.tsx`). Lottie is still deferred
pending assets. The **Premium/payments** tab (Analytics) is
still UI-only — **not wired to a backend** (see the Todo list); the Chat tab **is** wired now.

## Seeker app shell (`/tutor-home`'s student/parent counterpart — `/feed`)

The student/parent landing after onboarding/login (`app/feed.tsx`), in `components/seeker/`.
Mirrors the tutor shell: a single stateful controller with a custom bottom tab bar switching four
tabs. **English-only** like the tutor shell. **Search + Saved are now backend-wired**; only the
**Home feed** is still sample data.

- **Home** (`SeekerFeedScreen`) — Instagram-style vertical **post feed** (reuses the tutor
  `feedUi` post-card primitives): a stories row, post cards with **like + Save** (no tutor-only
  "complete profile" banner or "+" composer), and a "Recommended for you" strip. **Still sample
  data** (no post-stream endpoint — see "Wired so far").
- **Search** (`SeekerSearchScreen` + the shared `FilterSheet`) — **now queries `GET /api/tutors`**
  (real results) with the advanced filters, trending tags, recent views, and a gold **Quick Match**
  card on top (`quickMatch.ts`: reads the seeker's onboarding picks — subject/district — and
  surfaces the single best-fit tutor with a "why" line; falls back to top-rated). Its filters
  **persist across restarts** (`filterStorage.ts` → AsyncStorage).
- **Saved** (`SeekerSavedScreen`) — bookmarked tutors, **now backend-backed** (`savedTutors.ts` →
  `/api/saved`). Still a shared store (`useSyncExternalStore`) so the tab, search, and the public
  profile route stay in sync, with optimistic writes; `hydrateSaved()` loads bookmarks after sign-in.
- **Account** (`SeekerAccountScreen`) — now shows the seeker's **real profile** (`GET /api/auth/me`):
  avatar, name, role, and — when set — their bio, phone, education level and gender (from `SeekerAbout`).
  An **"Edit profile"** row pre-seeds the store from `me` and opens `SeekerAbout` in **edit mode**; the
  tab refetches on return (`consumeSeekerProfileDirty`). No session / load error falls back to a neutral
  "Your account" card (no fake data). Plus a **Messages** row (→ `/messages`, the in-app chat), language
  switch (the real `LanguagePicker`), a "Become a tutor" link to `/tutor-home`, and log out.

Tapping any tutor pushes the **public `/tutors/[slug]` route** (the tab bar hides while viewing,
returns on back). Home-feed likes are local session state; Save is the seeker's primary action (no
tutor-style "Connect"). i18n for this shell is a later pass; the **Home feed** stays sample data (the
`getFeed` endpoint returns tutor *cards*, not a post stream).

## Subscription tiers & seeker↔tutor contact flow

Monetization is **tutor-side only** (seekers are never charged). Three tutor tiers —
**free / premium / deluxe** — gate how the two sides reach each other. **All of this is
front-end + local-mock** (AsyncStorage stores, same shape as `contactQuota.ts`); there are
**no backend changes** yet (flagged below). A **temporary tier switcher** on the Profile tab
(`components/subscription/TierSwitcher.tsx`) flips the mock tier so each tier can be tested from
one device — remove it when a real paywall lands.

- **Tier store** (`components/subscription/tierStore.ts`): `Tier = "free" | "premium" | "deluxe"`,
  `useTier()` / `getTier()` / `setTier()` / `hydrateTier()` (hydrated in `app/_layout.tsx`), and
  `quotaForTier()` → **free 0 / premium 1 / deluxe 3** daily seeker unlocks. The store does
  **double duty**: it's the signed-in tutor's tier on tutor surfaces AND — as a mock — stands in
  for the *viewed* tutor's tier on the seeker-facing profile (so flipping to Premium makes
  WhatsApp/WeChat appear while browsing). A real per-tutor tier needs a backend `tutors.tier` column.
- **Contact quota is now tier-based:** `components/tutor/contactQuota.ts` reads
  `quotaForTier(getTier())` instead of the old constant `3` (it subscribes to `subscribeTier` so a
  tier flip re-emits). Free = 0 ⇒ unlock always blocked ⇒ upgrade prompt. `lib/api/contacts.ts`
  still exports the legacy `DAILY_CONTACT_QUOTA` (unused by the store now).
- **Seeker side — one tutor at a time** (`components/match/seekerContact.ts`): tapping a contact
  button on a tutor (`TutorProfileContent` in **`contactMode="seeker"`**, set by `app/tutors/[slug].tsx`;
  the in-shell overlay `TutorProfileView` stays `"tutor"` = direct) runs a **"Contact [tutor]?"**
  `ConfirmModal` → sets the seeker's single **pending contact** + schedules a **10-min reminder**.
  A **`MatchBanner`** ("Starting lessons with [tutor]?" green Yes / red No) shows on the seeker
  **Home + Chat** (`app/feed.tsx`); answering either way frees them. Trying to contact a *different*
  tutor while pending pops a **`MatchCheckInModal`** ("Did you start having lessons with [prev]?")
  first. **WhatsApp/WeChat are hidden for free-tier tutors** (in-app Message only); premium/deluxe
  tutors expose them.
- **Tutor side — reply gating** (`components/match/tutorMatch.ts`, `TutorReplyGate.tsx`): in a chat
  thread (`app/messages/[id].tsx` resolves the viewer's role via `getMe` + tier), when the viewer is
  a **tutor** who hasn't unlocked the other person, `ChatThread`'s new **`composerSlot`** prop swaps
  the composer for `TutorReplyGate`. **Free** → "Reply" shows an upgrade prompt; **premium/deluxe** →
  confirm spending **1 of N** daily contacts → `unlockSeeker` (reveals phone + chat) and `addTutorMatch`
  → the tutor gets the same "Starting lessons with [seeker]?" banner (Home + Chat, `app/tutor-home.tsx`).
  The seeker's full profile (name/age/education/category — Req: all tiers) opens via `/seekers/[id]`
  (`SeekerProfileContent`, also tier-aware now). The conversation→seeker link rides a new **`otherId`**
  nav param (from `ChatList` participants + the profile Message buttons).
- **Notifications** (`components/match/notifications.ts`, **`expo-notifications`** — native, added to
  `app.json` plugins): if the match question goes unanswered, a **local notification fires at 10 min**
  and deep-links (`data.url`) to **`app/match-checkin.tsx`** ("Did you start having lessons?"). The
  observer is mounted in `_layout.tsx` (`useMatchNotificationObserver`). The native module is loaded
  **lazily + guarded** (`require` in a try/catch) so the app still runs on a pre-rebuild binary /
  Simulator — but the notification only fires for real after a **fresh EAS dev build + reinstall**
  (native dep). Everything else (tiers, banners, confirms, reply gating) is JS-only.
- **Now backend-backed + live (migrations 0024–0030 applied to Supabase + verified):** the
  **tier** persists (`tutor_profiles.tier`; `PATCH /api/tutor/tier` from the switcher, read via
  `me`/`getTutor`); the **daily quota + unlocks** are real (`tutor_contact_unlocks` + `/api/tutor/
  contact-quota` · `/contact-unlocks`); a tutor reads a seeker via **`GET /api/seekers/[id]`** (the
  `get_seeker_for_tutor` SECURITY DEFINER RPC); **reply gating** is enforced server-side (a tutor's
  chat send 403s until they've unlocked the seeker). So the frontend stores now hit real endpoints
  (the mock/AsyncStorage paths are the offline fallback). The tutor's WhatsApp/WeChat show to seekers
  only when the **viewed tutor's real tier** is premium/deluxe.
- **Seeker privacy + search + viewer tiers (latest round, live):**
  - **`SeekerAbout` two toggles** (default ON, on profiles): **is_discoverable** (appears in seeker
    search / visible to anyone) and **share_personal_info** (include name/age/education/phone — OFF →
    a *minimal card*, subjects only, + the phone warning). Saved via onboarding + `PATCH /api/profiles/me`.
  - **Visibility rule (enforced in the RPC):** a tutor sees a seeker's details when the seeker is
    **public OR has messaged the tutor**; a **private** seeker is only visible to a tutor they've
    messaged. PII/phone withheld unless `share_personal_info` (phone also needs an unlock).
  - **Seeker search** — a **Tutors/Students** toggle (`SearchModeToggle`) in **both** Search tabs
    (`SeekerSearchScreen` + tutor `SearchScreen`) → `SeekerResultsList` over **`GET /api/seekers`**
    (the `search_seekers` RPC; public seekers only, level filter + name/subject text).
  - **"Who viewed you"** (`AnalyticsScreen`, `GET /api/tutor/profile-views`) is **tier-gated**:
    free = locked (upgrade) · premium = count + **anonymized** list · deluxe = **full** details
    (public viewers only).
- **"Account information" section (all three user types, latest round, live):** a shared
  `components/account/AccountInfoSection.tsx` dropped into **both** the tutor Profile tab
  (`ProfileScreen`, between the Posts list and "Change preferences") and the seeker **Profile** tab
  (`SeekerAccountScreen`, above the old "Profile" settings group). Shows the signup details: **Sign-in
  method** (a prop-driven indicator badge — always **"Email"** today since OAuth/provider aren't wired,
  ready for Google/Apple), **Email** (`me.user.email`), **Password** (a fixed masked `********` literal —
  never fetched/stored/measured), a **Change password** button, read-only **Phone**, and an **editable
  WeChat ID**. Phone source differs by role: seekers show `profiles.phone`; **tutors show their
  `whatsapp_number`** (they don't collect a separate phone). The **WeChat edit** (Edit button →
  `BottomSheet`) saves per role: seeker → `patchProfileMe({ wechat_id })` (**`profiles.wechat_id`**, new
  **backend migration 0031**, applied/live; `me` returns it via `select('*')`); tutor →
  `patchTutor(slug, { wechat_id })` (`tutor_profiles.wechat_id`). The **Change password** sheet
  (`components/account/ChangePasswordSheet.tsx`, old/new **always-masked** secure inputs + an inert
  "Forgot password" placeholder) is **UI-only — not wired** (there's no backend change-password endpoint;
  submit shows a "not connected yet" notice and calls nothing; no password is logged or revealed). The
  **seeker tab + screen title were renamed "Account" → "Profile"** (icon was already the person icon);
  the tutor tab was already "Profile". The seeker WeChat is the seeker's **own** self-edit only — it's
  **not** exposed to tutors yet (`get_seeker_for_tutor` still returns `wechat → NULL`).
- **Still frontend-only:** the **cross-side match dismissal** ("only one side answers", Req 4) — each
  side resolves its own banner per-device (no shared match record). A premium/deluxe tutor can have
  several unanswered match questions; the banner surfaces the **oldest** one. Real **payments** are
  still mock (the tier switcher stands in). The **seeker-search subject filter** is text-match, not a
  dedicated picker.

## Architecture decisions

- **Onboarding (Option A):** browse freely; each role's flow collects everything first and
  takes **email + password on the final step**, which creates the account and persists the
  onboarding store in one shot. Email verification is OFF. **Tutors are home-first:** they land
  on `/tutor-home` and enter onboarding from its "Complete profile" / "Set up your profile"
  prompts (student/parent still go straight into their flow).
- **Contact flow:** **WhatsApp + WeChat** buttons on the tutor profile — both optional, either
  or both (**Instagram was dropped**). WhatsApp pre-fills `Hi, I found you on LearnSum and I'm
  interested in tutoring for [subject].` (the subject is the profile's first subject, omitted if
  none); WeChat has no deep link, so its button copies the ID to the clipboard + confirms. **No
  inquiry form.** In-app messaging **is now built** (`/messages`, REST-polling — see "Wired so far"):
  a **"Message"** button on tutor profiles starts a conversation, alongside the off-app WhatsApp/WeChat.
- **Home feed:** personalized weighted matching for seekers (subject > availability > price
  > language > district; per child for parents); **guests** get the latest published tutors
  (`created_at` DESC, unfiltered).
- **Tutor profile pages are public** and viewable **without auth**; a tutor is **not
  published** until they complete their profile and publish.
- **Auth is required for:** posting content, profile editing / account deletion, and saving
  filter preferences. In the `/tutor-home` shell (front-end mock) unregistered users are **also**
  gated on engagement — like, connect, advanced filters, create post, add story — via the
  `/auth/gate` screen. **Chat is built** (real REST-polling messaging); **notifications aren't**
  (see the Todo list).

## Onboarding state & persistence

All onboarding input is kept in a shared **in-memory** store —
`components/onboarding/onboardingStore.ts` (`usePersistentState`, `getStored`,
`setStored`). Expo Router rebuilds a screen from scratch when you navigate back and
then forward again, which would wipe local `useState`; the store lets a rebuilt
screen re-seed itself so **input is never lost while the app is open**.

- **In-memory during onboarding** — no AsyncStorage, no per-screen backend calls; drafts
  clear on a full app reload/close. The store is the **staging area**: it is flushed to the
  backend **once**, at the final credential step (Option A — see Architecture decisions).
- **Keyed by stable IDs** (subject id, child slot index, etc.) so removing then
  re-adding an item restores its previously-entered data.
- **Any new onboarding screen that collects input must wire into the store** — use
  `usePersistentState("<role>:<thing>", initial)` for top-level state, or pass a
  unique stable `persistKey` to the shared `PreferencesScreen` / `CategorySelect`
  cores (which auto-save on every change).

## Onboarding shared pieces

- **Two reusable cores drive most screens:** `PreferencesScreen`
  (`components/onboarding/`) and `CategorySelect` (exported from
  `app/onboarding/StudentCatSel.tsx`). Role wrappers (Student/Parent/Tutor) pass copy +
  callbacks; both take a `persistKey` and auto-save. The parent flow (`ParentChildSetup`)
  reuses them per child.
- **Education history is shared:** `components/onboarding/EducationSection.tsx` is the controlled
  per-level school-history UI (Kindergarten / Primary / Secondary / University — searchable school /
  qualification / score dropdowns via `SearchSelect` + a "Currently studying / Finished" toggle),
  used by **both** `TutorAbout` and the seeker `SeekerAbout` so they stay identical. Its `EduByLevel`
  shape + `EMPTY_EDU` live in the dependency-free `components/onboarding/educationTypes.ts` (so data
  modules like `seekerProfile.ts` / payloads can import them without pulling in React Native).
- **`PreferencesScreen` section order is deliberate:** **availability ("When are you
  available?") is the first question**, above format / location / language. Parents kept
  tapping a day, missing the timeline that expands below the day row, and pressing Continue
  — so it leads the screen and **auto-scrolls into view** when a day is selected
  (`scrollToTimelineRef` + the `timelineWrap` `onLayout`). Don't reorder it back down. (The
  in-code `// Section 1..4` comments still number by data block, not on-screen position.)
- **Tutors hide both the lesson-format and location questions** (`showFormat={false}` on
  `PreferencesScreen`): both are collected **per subject** on `TutorSD` instead (format under
  Preferred pay; location under format — see the tutor flow above), since a tutor may teach some
  subjects in person and others online, each in different districts. With format off, `format`
  stays null so the location section never renders on `TutorPrefs` either — for tutors that
  screen is just availability + languages. Student/parent flows are unchanged (format shown;
  location follows the chosen format and is required when in-person/both).
- **Location picker is shared** (`components/onboarding/DistrictPicker.tsx` + the HK
  region → district → **subdistrict** data in `components/onboarding/hkDistricts.ts`): a controlled
  component used by `PreferencesScreen` (student/parent), the per-subject cards on `TutorSD`, **and
  the search `FilterSheet`**. It has 3 region tabs → **larger district circles** that **expand** on
  tap into **smaller subdistrict circles**, each showing the first character of its Chinese name; a
  **"Select all"** toggle picks every subdistrict in the open district. Selection is **subdistrict
  only** — a chosen location is a **subdistrict slug** (e.g. `"causeway_bay"`), the value stored in
  the onboarding store and sent to the backend (stored as `text[]`; the **frontend is the source of
  truth** for the list). Helpers: `subName(slug)` / `subZh(slug)` / `subSlugsOfDistrict()` /
  `subdistrictsLabel()`. The circles reuse `SelectableCircle`, so they get the same cascade entrance
  + **"pop" on appear / "tap" on select** through the low-latency native sound pool — zero-lag by the
  same mechanism as the other onboarding grids. (Old model: 18 coarse `hk_district` enum keys
  `"<regionId>:<District Name>"` — replaced.)
- **Skip confirmation:** every onboarding "Skip" routes through `useSkipGuard()`
  (`components/onboarding/useSkipGuard.tsx`), which shows a one-time "Skip this step?"
  warning (`components/ui/ConfirmModal.tsx`) the first time per app session, then skips
  silently after. Wire any new Skip button through it.
- **Reusable UI:** `components/ui/BottomSheet.tsx` (instant-dim + slide-up sheet that **pins to
  the top of the keyboard** — tracked via JS `Keyboard` events, no native module — so it never
  leaves a gap above the keyboard or below the panel; used by the language picker, the login sheet
  and the dropdowns) and `ConfirmModal.tsx` (centred warning dialog).

## Internationalization (i18n)

The app switches between **English / Traditional Chinese / Simplified Chinese** live.
Everything lives in `components/i18n/`:

- `translations.ts` — the `t()` dictionary: one key per phrase, each with all three
  languages (a `satisfies` check forces every entry to provide all three).
- `LanguageProvider.tsx` — React Context holding the current language; mounted once in
  `app/_layout.tsx` so changing it re-renders the whole app. Exposes `useT()` /
  `useLanguage()`.
- `LanguagePicker.tsx` — the globe button + language bottom-sheet (welcome screen).

Rules:

- **Never hardcode user-facing text.** Add the phrase to `translations.ts` (all three
  languages) and render it via `const t = useT(); … t("some.key")`. For data arrays,
  store a `labelKey: TranslationKey` instead of a literal label.
- Watch for `(t) => …` callback params (e.g. `onChangeText`) **shadowing** the translate
  function — name them `(text)`.
- **The chosen language now persists** across restarts (`components/i18n/langStorage.ts` →
  AsyncStorage; `app/_layout.tsx` seeds `LanguageProvider`'s `initialLang` on cold start and every
  `setLang` saves). (The onboarding draft store is still in-memory by design.)
- **Deferred (still English on purpose):** content-list *names* — subjects/categories,
  HK regions / districts / subdistricts (the Chinese **character** on each location circle is shown,
  but the English names aren't translated yet), language names, and qualification/exam option values
  (`tutorQuals.ts`). These are a later "content pass"; the UI chrome is already translated.

## Development workflow

This project uses **EAS Build for iOS development builds** because local builds overheat
the MacBook Air M2.

- **Run the dev server:**
  ```
  npx expo start --clear
  ```
- **Primary test target is a physical iPhone** (the Simulator is rarely used). Two QR codes,
  two jobs: the **EAS build** QR *installs* the dev-build app (only after a new native build);
  the **`npx expo start`** (Metro) QR loads the JS into the already-installed app (every run).
  JS-only change → just `expo start` + the Metro QR; no rebuild.
- **When native dependencies change**, a new EAS cloud build is required, then **reinstall** it
  before the Metro QR will work (`expo start` alone runs new JS on the old binary → "Cannot find
  native module"):
  ```
  /Users/alveeno/.npm-global/bin/eas build --platform ios --profile development-device
  ```
  Install the new build on the phone (scan the EAS build QR), then `npx expo start --clear`.
  Simulator equivalents: `--profile development` then
  `/Users/alveeno/.npm-global/bin/eas build:run --platform ios --latest`.
- **If a fresh build still can't find a just-added native module, add `--clear-cache`** — a stale
  EAS build cache can compile the module yet fail to embed it (a too-fast ~5-min build is the tell).
  Expo modules are statically linked into the **main app binary**, not separate `.framework` dirs.

Environment: **macOS**, **Terminal**, **single-line commands only**.

## Environment variables

Stored in **`.env.local`** — **never committed**.

| Variable                       | Description |
| ------------------------------ | ----------- |
| `EXPO_PUBLIC_API_URL`          | Base URL of the Next.js backend |
| `EXPO_PUBLIC_SUPABASE_URL`     | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`| Supabase anon key |

## Todo (not yet built)

There's no fixed version or deadline — this is the running list of everything still to build.
Items marked **→ Todo** elsewhere in this doc are tracked here.

**Screens & routes**

- **DONE:** Public tutor profile page `/tutors/[slug]` (bio + post feed + WhatsApp / WeChat) — a
  real shareable route reusing the shared `TutorProfileContent`.
- **DONE (inside the `/feed` seeker shell):** seeker **Search** tab + **Quick Match** card. A
  *standalone* `/search` route is still Todo (the tutor-facing Search tab is inside `/tutor-home`).
- Standalone **Profile** route — editing, account deletion, publish / self-unpublish (a tutor
  Profile tab is inside `/tutor-home`; a seeker **Account** tab is inside `/feed`).
- Standalone auth routes `/auth/*` (email + password and **social**) — today `SignUp` + the
  `LoginSheet` (opened from the welcome screen, the `SignUp` screen, and the `/auth/gate` route)
  call the **real** `POST /api/auth/signup` / `/login`; the welcome-screen login routes by role
  (tutor → `/tutor-home`, student/parent → `/feed`); the session **persists** via SecureStore.
  **DONE: refresh-token flow** — the refresh token is stored and exchanged via `POST /api/auth/refresh`
  (registered as `apiFetch`'s 401 auto-retry), so sessions outlive the ~1h access-token expiry and a
  cold start opens straight to the role's home (`resolveLaunchDestination`, offline-tolerant). Still
  Todo: dedicated `/auth/*` routes and **social login** (only Google is configured on Supabase).
- **DONE:** the seeker **`/feed`** is an Instagram-style post-feed app shell (Home / Search / Saved /
  Account), with **Search + Saved now backend-wired** (`GET /api/tutors`, `/api/saved`). Still Todo:
  a **real** personalized post feed for the **Home** tab (no post-stream endpoint yet — `getFeed`
  returns tutor cards, not posts — so Home stays sample data by decision).
- Tutor **profile-completion** screen — bio, photo, WhatsApp / WeChat + remaining
  details — plus explicit **publish / self-unpublish**.

**Auth & data**

- **DONE:** `SignUp` / `LoginSheet` create/restore the Supabase **session** via `lib/api/auth`
  (`POST /api/auth/signup` · `/login`), with the in-memory token store carrying the Bearer token.
  **DONE (tutor):** the tutor onboarding store is **persisted in one shot** at the publish sheet
  (`POST /api/onboarding`). **DONE (student / parent):** a **final credential step**
  (`app/onboarding/CreateAccount.tsx`, Option A) creates the account then runs the one-shot save
  (`components/onboarding/seekerOnboardingPayload.ts`). The backend's `POST /api/onboarding`
  **already supports student + parent** (it branches by role → the `complete_onboarding` RPC), and the
  payload now **matches that contract** (`school_level`, `interests` as subject **slugs**, parent
  `parent:{ children:[…] }`), so the data **persists** on success. The save stays **best-effort**
  (swallows network errors so onboarding still completes; the account is already created). (Continue
  requires a reachable backend to create the account, like the tutor flow; **Skip still bypasses
  straight to `/feed`** with no account.) *(Earlier notes here said the backend was "tutor-shaped /
  may reject seeker onboarding" — that was wrong; corrected after reading the route. See the backend
  repo's `BACKEND_GAP_ANALYSIS.md` H1.)*
- **DONE:** email existence is handled by `signup` (an existing email routes to the login sheet).
  The old `REGISTERED_EMAILS` `__DEV__` offline mock was **removed** — both `SignUp` and `LoginSheet`
  now **require a reachable backend** and show a "can't reach the server" error otherwise (no fake
  sign-up / login).
- **Social login** — only **Google** is configured on Supabase; Apple / Microsoft buttons are
  placeholder UI.
- **DONE:** **Saved filter preferences** — the seeker Search tab's advanced filters now persist
  across sessions (`components/seeker/filterStorage.ts` → AsyncStorage; restored on mount, saved on
  apply).
- **DONE:** **Search, Saved, post likes, and in-app chat are wired to the backend** (a batch
  alongside backend migrations 0017–0020). Both Search tabs query `GET /api/tutors`; Saved is backed
  by `/api/saved`; tutor-profile post likes use `/api/posts/[id]/likes`; chat (`/messages`) polls
  `/api/conversations*`. See "Wired so far" for the full breakdown.
- **Tutor student slots → backend** — the per-subject **student slots** (`current/capacity`, collected
  on `TutorSD`, the `slots` field on `Detail`) are **frontend-only**: held in the onboarding store and
  shown on the review + own-profile surfaces, but **not** sent in `tutorOnboardingPayload.ts` / the
  `PUT /api/tutor/subjects` edit, and there's **no column** for them yet. Todo: add a
  `tutor_subcategories` slots column (+ the onboarding RPC / subjects route + `me`/`tutors/[slug]`
  reads), then send + read them (mirrors how per-subject `levels` were wired in 0020). Until then
  server-sourced profiles show the default `0/1`.
- **Seeker profile fields → backend — DONE + verified e2e.** The `SeekerAbout` screen collects the
  seeker's name, bio, gender, photo, phone and (student) education (a current level + a full school
  history). Wired end-to-end against the live backend (`learnsum-mvp-back`):
  - **Migration 0022** (`profiles += bio, phone` + `complete_onboarding` writes `avatar_url`/`bio`/`phone`)
    — **applied/live**, verified e2e (name/gender/avatar + bio/phone round-trip on onboarding + edit).
  - **Migration 0023** (`student_profiles += education jsonb` + `complete_onboarding` writes the student
    `education`) — **applied/live**, verified e2e (school history round-trips on onboarding + edit).
  - Routes: `POST /api/onboarding` reads `avatar_url`/`bio`/`phone` from the `profile` block **and**
    `student.education`; `PATCH /api/profiles/me` accepts `bio`/`phone` + `student.education` (it already
    handled `student.school_level` + gender). **`GET /api/auth/me` needs no change** — `select('*')`
    returns the new profile columns + `gender`, and the student detail (incl. `school_level` + `education`)
    under **`detail.student_profile`** (the frontend reads via `schoolLevelFromMe` / `eduHistoryFromMe`).
- **Profile viewers + contact quota + tutor-saved-people + child age → backend** — the tutor
  Saved/Analytics/seeker-profile batch (the Saved tab, the `/analytics` "who viewed your profile"
  list, `/seekers/[id]`, and the 3-per-day contact unlock) is **frontend-only with mock/sample +
  AsyncStorage fallbacks**; the API clients exist (`lib/api/profileViews.ts`, `contacts.ts`,
  `seekers.ts`, `savedPeople.ts`) but the endpoints don't. Todo (backend repo):
  - **Profile views:** a `profile_views` table + `POST /api/tutors/[slug]/views` (record, fired by
    `recordProfileView` in `TutorProfileContent`) + `GET /api/tutor/profile-views` (the viewers list,
    seeker preferences joined, **phone omitted**).
  - **Seeker read for tutors:** `GET /api/seekers/[id]` (preferences/category/child level+age;
    **contact fields null unless the tutor has unlocked this seeker**).
  - **Contact quota:** a per-tutor daily counter + a `tutor_contact_unlocks` table;
    `GET /api/tutor/contact-quota` + `POST /api/tutor/contact-unlocks { seeker_id }` (decrement
    remaining, **permanent** unlock, daily reset). Gate the seeker's contact fields + chat
    `startConversation` server-side on an unlock.
  - **Tutor saved (mixed):** `GET/POST/DELETE /api/saved/people` (tutors **and** seekers, keyed by
    slug/id) — distinct from the seeker-side `/api/saved`.
  - **Child age:** add an `age` column to the child/onboarding RPC + reads (sent best-effort by
    `seekerOnboardingPayload.ts`). Until these exist, the surfaces run on `sampleSeekers.ts` +
    AsyncStorage and server-sourced seekers would show no age.

**`/tutor-home` shell — front-end only today, needs backend**

- **DONE: Chat / in-app messaging** — the Chat tab (and `/messages` routes) are now wired to a real
  REST-polling backend (`lib/api/chat.ts` → `/api/conversations*`). See "Wired so far".
- **Premium / in-app payments** — the Analytics tab shows a paywall UI only (no real payment).
- **Posts** — creating a post (**text + photo/video**) + the own **Posts list** are wired (`POST` /
  `GET /api/tutors/[slug]/posts` + `POST /api/upload`, `lib/api/posts.ts` / `lib/api/upload.ts`).
  **Post likes are now wired on the tutor profile post feed** (`/api/posts/[id]/likes`,
  `lib/api/likes.ts`). Still Todo: real-device **HEIC** photos need `expo-image-manipulator`
  conversion (Simulator yields jpeg/png so it's fine), and a real **multi-tutor home feed** of posts
  (no post-stream endpoint yet — that's the deferred seeker browse surface, so the Home tab stays
  sample data; the Home feeds' likes are still local sample state).
- Replace the **remaining** prototype sample data (the Home feeds) and **English-only copy** with
  live data + i18n (the rest of the app is already trilingual). Search, Saved, likes, and chat are
  **already on live data**.

**Deferred by design (may stay out)**

- Push notifications **and** in-app notifications (no `/notifications`).
- Post **likes** are **wired on the tutor profile post feed** (`/api/posts/[id]/likes`); the
  **Home** feeds' likes (tutor + seeker) are still local sample state. **Comments were removed** from
  the tutor feed — the `Comment` type and sample `comments` data remain in `tutorData.ts` but
  nothing renders them.
- **Inquiry form** — contact is WhatsApp / WeChat instead.
- **Calendar / per-date scheduling** — availability is recurring weekday time ranges (the
  picker already collects precise start/end ranges).

**Content pass (i18n)**

- Translate the deferred content lists — subjects / categories, HK regions / districts / subdistricts, language
  names, qualification / exam option values. UI chrome is already in English / Traditional /
  Simplified Chinese.
