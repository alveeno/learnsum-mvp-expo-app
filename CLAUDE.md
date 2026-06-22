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
  (deferred — needs assets), `expo-audio` (deferred — needs assets).

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
  fallback. `token.ts` holds the session token **in memory only** (session-only like the rest of
  the app — **now persisted to `expo-secure-store`**: the in-memory cache backs synchronous reads,
  and `restoreToken()` in `app/_layout.tsx` reloads the session on a cold start so you stay logged
  in. Only the Supabase **access** token is stored — it expires (~1h) and there's no refresh-token
  flow yet, so a restore after expiry falls back to logged-out).
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
| `/tutor-home`    | **Tutor app shell** a tutor lands on after picking "Tutor" — a 5-tab experience (Home / Search / Chat / Analytics / Profile). **Built** (front-end only — see "Tutor app shell" below) |
| `/feed`          | Placeholder "You're all set" landing for the **student/parent** flows (reached via the shared `Welcome` screen on completion) — **placeholder built** (real seeker feed **→ Todo**) |
| `/tutors/[slug]` | Public tutor profile page (bio + post feed + WhatsApp/WeChat buttons) — **→ Todo** |
| `/search`        | Standalone seeker search route + Quick Match card — **→ Todo** (a tutor-facing Search tab **is** built inside `/tutor-home`) |
| `/profile`       | Standalone profile route, editing, account deletion, publish/unpublish — **→ Todo** (a tutor Profile tab **is** built inside `/tutor-home`) |
| `/auth/gate`     | Tutor **log in / sign up** gate, shown when an unregistered user hits a gated action in `/tutor-home` — **built** (front-end mock: opens `LoginSheet` or the `SignUp` flow). Full email+password / social auth routes **→ Todo** |
| `/post-new`      | Tutor **post composer** (text + a post_type + optional photo/video) → `POST /api/tutors/[slug]/posts` (+ `POST /api/upload`) — **built**; opened from the Home feed "+" and the Profile Posts section |

> **No `/notifications` route — notifications aren't built (see the Todo list).**

Onboarding is **built** and lives under `app/onboarding/` (PascalCase route files),
one flow per role:

- **Student:** `StudentEducationLevel` → `StudentCatSel` → `StudentPrefs`
- **Parent:** `ParentNumChild` → `ParentChildSetup` (per-child categories +
  preferences, one child at a time, then a review)
- **Tutor:** `SignUp` (email + password / social — account gate) → `TutorTeachLevels` →
  `TutorCatSel` → `TutorSD` (Strengths & Details — a per-subject accordion collecting years of
  **teaching** experience, preferred pay, **lesson format** (In person / Online / Both,
  default Both), **location** (only for In person / Both — region tabs + district grid via the
  shared `DistrictPicker`; later subjects get a **"Same as previous"** chip that copies the
  districts from the nearest earlier in-person subject), achievements, experience and
  qualifications; the **pay slider is non-linear** — small $10 steps near the bottom growing to
  $100 near the top, so the common $200–$500 range is easy to land on) → `TutorPrefs` →
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
  param). Skipping out of a flow still goes straight to `/feed`, bypassing `Welcome`.

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
subjects only), **Years exp / Per hour** stat
tiles, then **Qualifications**,
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
the existing `LoginSheet` (pre-filled). If the backend is unreachable **in `__DEV__`** it falls
back to the old `REGISTERED_EMAILS` mock so the app still demos offline.
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
from the welcome screen and from the `/auth/gate` route); its "Log in" button now calls **`POST
/api/auth/login`** (`lib/api/auth`) — storing the session token, marking the user registered, and
handing off — with a one-line inline error on bad credentials and a `__DEV__` offline fallback
that accepts the login so the app still demos. The social buttons and "Forgot password?" stay
inert, and there's no standalone `/auth` login route yet.

**No dedicated messaging screen** (in-app chat is **→ Todo**). Contact happens via **WhatsApp +
WeChat** buttons on the tutor profile (both optional, either or both) — **Instagram was dropped**
(a product decision; the old design mentioned it). There is no `/messages` route and **no inquiry
form**.

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
  unregistered ones hit the auth gate. (Adding a **story** is still a stub — stories aren't backed.)
- **Search** (`SearchScreen` + `FilterSheet`) — text search over a sample directory, trending
  tags, recent searches, and an advanced filter sheet (gesture-driven dual sliders, HK
  district discs, gender, rating/years/sessions/followers).
- **Chat** (`ChatScreen`) — conversation list + thread with a composer.
- **Analytics** (`AnalyticsScreen`) — Premium paywall over a dimmed dashboard; "Upgrade"
  reveals it locally.
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
"Tutors you may know" strip is hidden. A `__DEV__`-only toggle in the shell flips this registered
state for demoing. Real auth / session persistence is still **→ Todo**.

**Caveats (prototype):** front-end only — no backend, no real messaging, no real payment.
**English-only** (not yet wired into i18n — unlike the rest of the app). The **blur/paywall and
gate now use real `expo-blur`**, and accent surfaces (setup banner/card, story rings, paywall
button) use **real `expo-linear-gradient`** — these were flat-colour/opacity approximations before
the native batch. Story items + the setup banner use a Reanimated **`PressableScale`** (press
spring + haptic), and every shared `Button` fires a light haptic. (Sound effects + Lottie are
deferred pending asset files.) The Chat and Premium/payments tabs exist here only as UI from the
design and are **not wired to a backend yet** (see the Todo list).

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
  inquiry form. No in-app messaging** (the Chat tab in `/tutor-home` is UI-only — see the Todo list).
- **Home feed:** personalized weighted matching for seekers (subject > availability > price
  > language > district; per child for parents); **guests** get the latest published tutors
  (`created_at` DESC, unfiltered).
- **Tutor profile pages are public** and viewable **without auth**; a tutor is **not
  published** until they complete their profile and publish.
- **Auth is required for:** posting content, profile editing / account deletion, and saving
  filter preferences. In the `/tutor-home` shell (front-end mock) unregistered users are **also**
  gated on engagement — like, connect, advanced filters, create post, add story — via the
  `/auth/gate` screen. **Notifications and chat aren't built** (see the Todo list).

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
  regions/districts data in `components/onboarding/hkDistricts.ts`): a controlled region-tabs +
  district-grid component used by both `PreferencesScreen` (student/parent) and the per-subject
  cards on `TutorSD`. Districts are stored as `"<regionId>:<District Name>"` keys and can span
  regions; `districtName()` turns a key back into its display name. (Extracting this made the
  district grid show its first region immediately, rather than only after a region tab is tapped.)
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
  HK districts + regions, language names, and qualification/exam option values
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

- Public tutor profile page `/tutors/[slug]` — bio + post feed + WhatsApp / WeChat
  buttons.
- Standalone seeker **Search** route + **Quick Match** card (a tutor-facing Search tab already
  exists inside `/tutor-home`).
- Standalone **Profile** route — editing, account deletion, publish / self-unpublish (a tutor
  Profile tab already exists inside `/tutor-home`).
- Standalone auth routes `/auth/*` (email + password and **social**) — today `SignUp` + the
  `LoginSheet` (opened from the welcome screen and the `/auth/gate` route) call the **real**
  `POST /api/auth/signup` / `/login`; the session **persists** via SecureStore. Still Todo: dedicated
  `/auth/*` routes, **social login** (only Google is configured on Supabase), and a **refresh-token
  flow** for truly long-lived sessions (only the ~1h access token is stored today, so a cold start
  after expiry logs out).
- Real personalized **home feed** for seekers — `/feed` is currently just a "you're all set"
  placeholder.
- Tutor **profile-completion** screen — bio, photo, WhatsApp / WeChat + remaining
  details — plus explicit **publish / self-unpublish**.

**Auth & data**

- **DONE:** `SignUp` / `LoginSheet` create/restore the Supabase **session** via `lib/api/auth`
  (`POST /api/auth/signup` · `/login`), with the in-memory token store carrying the Bearer token.
  **DONE (tutor):** the tutor onboarding store is **persisted in one shot** at the publish sheet
  (`POST /api/onboarding`). **Still Todo:** the same one-shot save for **student / parent** and the
  **final credential step for student / parent**.
- **DONE:** email existence is handled by `signup` (an existing email routes to the login sheet);
  `REGISTERED_EMAILS` survives only as the `__DEV__` offline fallback.
- **Social login** — only **Google** is configured on Supabase; Apple / Microsoft buttons are
  placeholder UI.
- **Saved filter preferences** — persist a seeker's filters across sessions.

**`/tutor-home` shell — front-end only today, needs backend**

- **Chat / in-app messaging** — the Chat tab is UI-only (no messaging backend).
- **Premium / in-app payments** — the Analytics tab shows a paywall UI only (no real payment).
- **Posts** — creating a post (**text + photo/video**) + the own **Posts list** are wired (`POST` /
  `GET /api/tutors/[slug]/posts` + `POST /api/upload`, `lib/api/posts.ts` / `lib/api/upload.ts`).
  Still Todo: real-device **HEIC** photos need `expo-image-manipulator` conversion (Simulator yields
  jpeg/png so it's fine), and a real **multi-tutor home feed** of posts (no post-stream endpoint
  yet — that's the deferred seeker browse surface, so
  the Home tab stays sample data). Post **likes** have no endpoint yet (display-only).
- Replace the prototype sample data and **English-only copy** with live data + i18n (the rest of
  the app is already trilingual).

**Deferred by design (may stay out)**

- Push notifications **and** in-app notifications (no `/notifications`).
- Post **likes** UI is front-end only (schema on the backend). **Comments were removed** from
  the tutor feed — the `Comment` type and sample `comments` data remain in `tutorData.ts` but
  nothing renders them.
- **Inquiry form** — contact is WhatsApp / WeChat instead.
- **Calendar / per-date scheduling** — availability is recurring weekday time ranges (the
  picker already collects precise start/end ranges).

**Content pass (i18n)**

- Translate the deferred content lists — subjects / categories, HK districts + regions, language
  names, qualification / exam option values. UI chrome is already in English / Traditional /
  Simplified Chinese.
