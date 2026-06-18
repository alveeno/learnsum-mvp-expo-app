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

File-based routes (Expo Router). v1 route map:

| Route            | Purpose |
| ---------------- | ------- |
| `/`              | Welcome screen with user-type selection — **built** |
| `/tutor-home`    | **Tutor app shell** a tutor lands on after picking "Tutor" — a 5-tab experience (Home / Search / Chat / Analytics / Profile). **Built** (front-end only — see "Tutor app shell" below) |
| `/feed`          | Placeholder "You're all set" landing for the **student/parent** flows — **placeholder built** (real seeker feed not yet) |
| `/tutors/[slug]` | Public tutor profile page (bio + post feed + WhatsApp/Instagram/WeChat buttons) — *not built yet* |
| `/search`        | Standalone seeker search route + Quick Match card — *not built* (a tutor-facing Search tab **is** built inside `/tutor-home`) |
| `/profile`       | Standalone profile route, editing, account deletion, publish/unpublish — *not built* (a tutor Profile tab **is** built inside `/tutor-home`) |
| `/auth/*`        | Email+password **and** social login — *not built; login is a placeholder bottom sheet (below), not a route* |

> **No `/notifications` route — notifications are fully out of v1.**

Onboarding is **built** and lives under `app/onboarding/` (PascalCase route files),
one flow per role:

- **Student:** `StudentEducationLevel` → `StudentCatSel` → `StudentPrefs`
- **Parent:** `ParentNumChild` → `ParentChildSetup` (per-child categories +
  preferences, one child at a time, then a review)
- **Tutor:** `SignUp` (email + password / social — account gate) → `TutorTeachLevels` →
  `TutorCatSel` → `TutorSD` (Strengths & Details) → `TutorPrefs` → `TutorAbout` (name, bio,
  gender, education — all optional) → `TutorNext` *(placeholder landing — the real
  post-onboarding screen isn't built yet)*

**Routing from the welcome screen:** **student** and **parent** go straight into the first
screen of their onboarding flow (landing on `/feed`, a placeholder "You're all set" screen).
**Tutor is home-first:** picking "Tutor" goes directly to **`/tutor-home`** (the tutor app
shell, in its first-time / not-yet-set-up state). The tutor onboarding flow above is reached
**from there** — via the gold **"Complete profile"** banner on the Home feed and the **"Set up
your profile"** gate on the Profile tab (both push `/onboarding/SignUp`, the first step). It
still ends on `TutorNext` (placeholder).

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
**Social login (Google / Apple / Microsoft) is in v1** — the buttons on `SignUp` and in
`components/auth/LoginSheet.tsx` are still placeholder UI. A tutor is **unpublished** until they
finish setup; the dedicated profile-completion screen (bio, photo, WhatsApp, Instagram, WeChat
+ remaining details) and explicit publish / self-unpublish are **not built yet** — for now the
tutor onboarding flow stands in for it. **Log in** is a placeholder bottom sheet opened from
the welcome screen — not a route.

**No messaging screen in v1.** Contact happens via **WhatsApp, Instagram, and WeChat**
buttons on the tutor profile (all optional, any combination) — there is no `/messages` route
and **no inquiry form**.

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
design and remain **out of scope for shipping v1** (see below).

## Architecture decisions

- **Onboarding (Option A):** browse freely; each role's flow collects everything first and
  takes **email + password on the final step**, which creates the account and persists the
  onboarding store in one shot. Email verification is OFF. **Tutors are home-first:** they land
  on `/tutor-home` and enter onboarding from its "Complete profile" / "Set up your profile"
  prompts (student/parent still go straight into their flow).
- **Contact flow:** **WhatsApp + Instagram + WeChat** buttons on the tutor profile — all
  optional, any combination, all shown at once. WhatsApp pre-fills `Hi, I found you on
  LearnSum and I'm interested in tutoring for [subject].` **No inquiry form. No in-app
  messaging in v1.**
- **Home feed:** personalized weighted matching for seekers (subject > availability > price
  > language > district; per child for parents); **guests** get the latest published tutors
  (`created_at` DESC, unfiltered).
- **Tutor profile pages are public** and viewable **without auth**; a tutor is **not
  published** until they complete their profile and publish.
- **Auth is required only for:** posting content, profile editing / account deletion, and
  saving filter preferences. **Notifications and chat are out of v1.**

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

## Explicitly out of scope for v1

- Push notifications **and** in-app notifications (fully out — no `/notifications`)
- Post likes and comments UI (schema only on the backend)
- Inquiry form (contact is WhatsApp / Instagram / WeChat)
- In-app messaging / real-time chat *(a Chat-tab UI exists in `/tutor-home` from the design
  handoff, but it's front-end-only and not part of shipping v1)*
- In-app payments *(the `/tutor-home` Analytics tab shows a Premium paywall UI only — no real
  payment)*
- Calendar / per-date scheduling (availability is recurring weekday time ranges)

> **Now IN v1** (previously listed out): saved filter preferences + Quick Match card, and the
> full filter set (preferred languages, districts, format, type, subcategory, price,
> availability) — not just category + district.
>
> Note: the availability picker **is** built (the "When are you available?" section of
> `PreferencesScreen`) and already collects **precise start/end time ranges** — which is the
> shape the backend is moving to (it's replacing its old morning/afternoon/evening buckets).
