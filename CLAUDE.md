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
| `/feed`          | Home feed — **placeholder built** (real feed not yet) |
| `/tutors/[slug]` | Tutor profile page — *not built yet* |
| `/search`        | Browse and filter — *not built yet* |
| `/notifications` | Notification centre — *not built yet* |
| `/profile`       | Own profile and settings — *not built yet* |
| `/auth/*`        | Login / sign-up — *not built; login is a placeholder bottom sheet (below), not a route* |

Onboarding is **built** and lives under `app/onboarding/` (PascalCase route files),
one flow per role. The welcome screen routes into the first screen of each:

- **Student:** `StudentEducationLevel` → `StudentCatSel` → `StudentPrefs`
- **Parent:** `ParentNumChild` → `ParentChildSetup` (per-child categories +
  preferences, one child at a time, then a review)
- **Tutor:** `TutorInspiration` → `TutorTeachLevels` → `TutorCatSel` → `TutorSD`
  (Strengths & Details) → `TutorPrefs` → `TutorNext` *(placeholder landing — the
  real post-onboarding screen isn't built yet)*

The student and parent flows land on `/feed` (a placeholder "You're all set" screen) and
the tutor flow lands on `TutorNext` (placeholder). **Log in** is a placeholder bottom sheet
(`components/auth/LoginSheet.tsx`) opened from the welcome screen — email/password +
Google/Apple/Microsoft buttons, nothing wired to a backend yet — **not** a route. Fleshing
out these placeholders (and the real `/feed`, `/auth`) is the next work.

**No messaging screen in v1.** Contact happens via WhatsApp redirect and inquiry form
only — there is no `/messages` route.

## Architecture decisions

- **Contact flow:** WhatsApp redirect is the primary path; the inquiry form is the
  fallback. **No in-app messaging in v1.**
- **Guest home feed** shows the latest published tutors with **no personalisation**.
- **Tutor profile pages are public** and viewable **without auth**.
- **Auth is required only for:** posting content, sending inquiries, and accessing
  notifications and profile.

## Onboarding state & persistence

All onboarding input is kept in a shared **in-memory** store —
`components/onboarding/onboardingStore.ts` (`usePersistentState`, `getStored`,
`setStored`). Expo Router rebuilds a screen from scratch when you navigate back and
then forward again, which would wipe local `useState`; the store lets a rebuilt
screen re-seed itself so **input is never lost while the app is open**.

- **In-memory only** — no AsyncStorage, no backend. Drafts clear on a full app
  reload/close (consistent with the "no backend writes" rule above).
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

- Push notifications
- Post likes and comments UI
- Saved filter preferences
- Advanced search beyond category and district
- In-app payments
- In-app messaging
- Real-time chat

> Note: a per-day availability picker **is** built (the "When are you available?"
> section of `PreferencesScreen`), so it's no longer out of scope.
