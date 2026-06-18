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

- **Expo SDK 56** (`expo ~56.0.8`)
- **Expo Router** (`~56.2.8`) — file-based routing; entry is `expo-router/entry`
- **NativeWind v4** (`4.2.1`) with **Tailwind CSS v3** (`tailwindcss 3.4.17`)
- **React Native 0.85** (`0.85.3`)
- **React 19.2** (`19.2.3`)
- **TypeScript** throughout (`~6.0.3`)
- Supporting native modules: `expo-linking`, `expo-status-bar`, `expo-dev-client`,
  `@expo/metro-runtime`, `react-native-reanimated@4.3.1`, `react-native-worklets`,
  `react-native-safe-area-context`

## Backend connection

- **All API calls go through the Next.js backend** at `EXPO_PUBLIC_API_URL`.
  Never call Supabase directly from this app.
- The backend is **currently at `http://localhost:3000`** — **update this to the Vercel
  URL after deployment.**
- For the full database schema and API endpoint reference, see **`PLAN.md` in the backend
  repo (`learnsum-mvp-back`)**.

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
| `/feed`          | Placeholder "You're all set" landing for the **student/parent** flows — **placeholder built** (real seeker feed **→ Todo**) |
| `/tutors/[slug]` | Public tutor profile page (bio + post feed + WhatsApp/Instagram/WeChat buttons) — **→ Todo** |
| `/search`        | Standalone seeker search route + Quick Match card — **→ Todo** (a tutor-facing Search tab **is** built inside `/tutor-home`) |
| `/profile`       | Standalone profile route, editing, account deletion, publish/unpublish — **→ Todo** (a tutor Profile tab **is** built inside `/tutor-home`) |
| `/auth/*`        | Email+password **and** social login — **→ Todo** (login is a placeholder bottom sheet, not a route) |

> **No `/notifications` route — notifications aren't built (see the Todo list).**

Onboarding is **built** and lives under `app/onboarding/` (PascalCase route files),
one flow per role:

- **Student:** `StudentEducationLevel` → `StudentCatSel` → `StudentPrefs`
- **Parent:** `ParentNumChild` → `ParentChildSetup` (per-child categories +
  preferences, one child at a time, then a review)
- **Tutor:** `SignUp` (email + password / social — account gate) → `TutorTeachLevels` →
  `TutorCatSel` → `TutorSD` (Strengths & Details) → `TutorPrefs` → `TutorAbout` (name, bio,
  gender, education — all optional), which returns to **`/tutor-home`** on Continue.
  *(The old `TutorNext` placeholder has been removed.)*

**Routing from the welcome screen:** **student** and **parent** go straight into the first
screen of their onboarding flow (landing on `/feed`, a placeholder "You're all set" screen).
**Tutor is home-first:** picking "Tutor" goes directly to **`/tutor-home`** (the tutor app
shell, in its first-time / not-yet-set-up state). The tutor onboarding flow above is reached
**from there** — via the gold **"Complete profile"** banner on the Home feed and the **"Set up
your profile"** gate on the Profile tab. On Continue, the final step (`TutorAbout`) returns to
`/tutor-home` (the old `TutorNext` placeholder was removed).

**Completion + resume (`components/onboarding/tutorOnboarding.ts`):** a step counts as done
once the user presses **Continue** on it (Skip / never-reached = incomplete). The Home banner
and Profile gate show only while ≥1 of the five profile steps is incomplete, and **hide once
all are done** — re-checked when `/tutor-home` regains focus (the in-memory store has no
subscription). Tapping the banner **resumes only the skipped steps** in order, jumping over
completed ones; first-timers pass through `SignUp` first, returning (signed-up) tutors jump
straight in. Because a resumed step can be entered directly, `TutorSD` reads its
subjects/levels from the store (`tutor:interests` / `tutor:levels`) rather than route params.
State is **session-only** (a full reload resets it).

**Account gate (`SignUp`, tutor flow only):** the tutor flow now opens with a sign-up screen
that takes email + password (and Google/Apple/Microsoft buttons) **before** any info is
collected, to catch returning users. The existence check is a **front-end mock**
(`REGISTERED_EMAILS` in `app/onboarding/SignUp.tsx` — swap for a backend lookup later); a known
email opens the existing `LoginSheet` (pre-filled), otherwise it continues into onboarding.
**This intentionally diverges from Option A below** (which collected credentials on the *final*
step) — for the tutor flow, credentials now come first.

**The real next work:** wire `SignUp` (and, for student/parent, a **final credential step,
Option A**) to actually create the Supabase account and **persist the whole onboarding store to
the backend in one shot** (email verification is OFF, so the new session is live immediately).
**Social login (Google / Apple / Microsoft) is planned** — the buttons on `SignUp` and in
`components/auth/LoginSheet.tsx` are still placeholder UI. A tutor is **unpublished** until they
finish setup; the dedicated profile-completion screen (bio, photo, WhatsApp, Instagram, WeChat
+ remaining details) and explicit publish / self-unpublish are **not built yet** — for now the
tutor onboarding flow stands in for it. **Log in** is a placeholder bottom sheet opened from
the welcome screen — not a route.

**No dedicated messaging screen** (in-app chat is **→ Todo**). Contact happens via **WhatsApp,
Instagram, and WeChat** buttons on the tutor profile (all optional, any combination) — there is
no `/messages` route and **no inquiry form**.

## Tutor app shell (`/tutor-home`)

The tutor's post-pick landing, **ported from the Claude Design "Tutor Home" handoff** and
living in `components/tutor/`. A single stateful shell (`app/tutor-home.tsx`) with a custom
bottom tab bar that switches five tabs, plus a shared "view another tutor" overlay
(`TutorProfileView`):

- **Home** (`FeedScreen`) — editorial Instagram-style feed: gold **"Complete profile"** banner
  (→ onboarding), stories row, post cards with like (red pop + count) and a comment sheet with
  a composer, and a "Tutors you may know" strip.
- **Search** (`SearchScreen` + `FilterSheet`) — text search over a sample directory, trending
  tags, recent searches, and an advanced filter sheet (gesture-driven dual sliders, HK
  district discs, gender, rating/years/sessions/followers).
- **Chat** (`ChatScreen`) — conversation list + thread with a composer.
- **Analytics** (`AnalyticsScreen`) — Premium paywall over a dimmed dashboard; "Upgrade"
  reveals it locally.
- **Profile** (`ProfileScreen`) — own profile, **dimmed behind a "Set up your profile" gate**
  (→ onboarding) until setup is done.

**Caveats (prototype):** front-end only — no backend, no real messaging, no real payment.
**English-only** (not yet wired into i18n — unlike the rest of the app). Gradients and the
blur/paywall use **flat-colour / opacity approximations** to avoid a native module (which would
force an EAS rebuild). The Chat and Premium/payments tabs exist here only as UI from the
design and are **not wired to a backend yet** (see the Todo list).

## Architecture decisions

- **Onboarding (Option A):** browse freely; each role's flow collects everything first and
  takes **email + password on the final step**, which creates the account and persists the
  onboarding store in one shot. Email verification is OFF. **Tutors are home-first:** they land
  on `/tutor-home` and enter onboarding from its "Complete profile" / "Set up your profile"
  prompts (student/parent still go straight into their flow).
- **Contact flow:** **WhatsApp + Instagram + WeChat** buttons on the tutor profile — all
  optional, any combination, all shown at once. WhatsApp pre-fills `Hi, I found you on
  LearnSum and I'm interested in tutoring for [subject].` **No inquiry form. No in-app
  messaging** (the Chat tab in `/tutor-home` is UI-only — see the Todo list).
- **Home feed:** personalized weighted matching for seekers (subject > availability > price
  > language > district; per child for parents); **guests** get the latest published tutors
  (`created_at` DESC, unfiltered).
- **Tutor profile pages are public** and viewable **without auth**; a tutor is **not
  published** until they complete their profile and publish.
- **Auth is required only for:** posting content, profile editing / account deletion, and
  saving filter preferences. **Notifications and chat aren't built** (see the Todo list).

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
- **Skip confirmation:** every onboarding "Skip" routes through `useSkipGuard()`
  (`components/onboarding/useSkipGuard.tsx`), which shows a one-time "Skip this step?"
  warning (`components/ui/ConfirmModal.tsx`) the first time per app session, then skips
  silently after. Wire any new Skip button through it.
- **Reusable UI:** `components/ui/BottomSheet.tsx` (instant-dim + slide-up sheet — used by
  the language picker, the login sheet and the dropdowns) and `ConfirmModal.tsx` (centred
  warning dialog).

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
- **Current language is in-memory only** (resets on a full app restart), matching the
  onboarding store. Persisting it across restarts needs a native storage module
  (AsyncStorage = one EAS rebuild); only the provider's state line would change.
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
- **Install the latest development build on the simulator:**
  ```
  /Users/alveeno/.npm-global/bin/eas build:run --platform ios --latest
  ```
- **When native dependencies change**, a new EAS cloud build is required before the
  simulator will pick up the changes:
  ```
  /Users/alveeno/.npm-global/bin/eas build --platform ios --profile development
  ```

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

- Public tutor profile page `/tutors/[slug]` — bio + post feed + WhatsApp / Instagram / WeChat
  buttons.
- Standalone seeker **Search** route + **Quick Match** card (a tutor-facing Search tab already
  exists inside `/tutor-home`).
- Standalone **Profile** route — editing, account deletion, publish / self-unpublish (a tutor
  Profile tab already exists inside `/tutor-home`).
- Auth routes `/auth/*` (email + password and social); today log in is a placeholder bottom
  sheet, not a route.
- Real personalized **home feed** for seekers — `/feed` is currently just a "you're all set"
  placeholder.
- Tutor **profile-completion** screen — bio, photo, WhatsApp / Instagram / WeChat + remaining
  details — plus explicit **publish / self-unpublish**.

**Auth & data**

- Wire `SignUp` (and a final credential step for student / parent) to actually create the
  Supabase account and **persist the onboarding store to the backend in one shot**.
- Real **email-existence check** on `SignUp` (currently a front-end mock — `REGISTERED_EMAILS`).
- **Social login** (Google / Apple / Microsoft) — the buttons are placeholder UI.
- **Saved filter preferences** — persist a seeker's filters across sessions.

**`/tutor-home` shell — front-end only today, needs backend**

- **Chat / in-app messaging** — the Chat tab is UI-only (no messaging backend).
- **Premium / in-app payments** — the Analytics tab shows a paywall UI only (no real payment).
- Replace the prototype sample data and **English-only copy** with live data + i18n (the rest of
  the app is already trilingual).

**Deferred by design (may stay out)**

- Push notifications **and** in-app notifications (no `/notifications`).
- Post **likes & comments** UI (schema only on the backend).
- **Inquiry form** — contact is WhatsApp / Instagram / WeChat instead.
- **Calendar / per-date scheduling** — availability is recurring weekday time ranges (the
  picker already collects precise start/end ranges).

**Content pass (i18n)**

- Translate the deferred content lists — subjects / categories, HK districts + regions, language
  names, qualification / exam option values. UI chrome is already in English / Traditional /
  Simplified Chinese.
