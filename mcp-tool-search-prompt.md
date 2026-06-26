# Deep-research prompt — find MCP servers to speed up building LearnSum

> Paste everything below the line into ChatGPT (with web browsing / Deep Research)
> or Perplexity (Pro / Deep Research). It is self-contained — the AI does not need
> access to my codebase.

---

## Your task

You are a senior developer-tools researcher. Conduct an **exhaustive, live web search**
for **MCP (Model Context Protocol) servers/tools** that would most increase the
**productivity of building** the app described below, when used from **Claude Code**
(Anthropic's CLI coding agent) on **macOS**.

MCP servers are plug-ins that give an AI coding agent extra capabilities (e.g. database
access, browser automation, error monitoring, documentation lookup, testing). I want the
ones that make **building this specific app faster** — coding, testing, debugging,
design-to-code, backend/database work, and the Expo/EAS build pipeline. I am **not**
looking for in-product feature integrations (payments SDKs, maps, etc.) unless they
double as a dev-time tool.

This is for a **non-technical founder**, so write the final output in **plain English**
and make every recommendation actionable.

## The project (context you must use to judge "fit")

- **What it is:** LearnSum — a Hong Kong–based, two-sided **tutoring marketplace**, mobile
  app. Tutors build Instagram-style profiles (bio + scrollable post feed); students/parents
  browse, match, and contact tutors via WhatsApp/WeChat. Three user types: parent, student,
  tutor.
- **Frontend stack:** **Expo SDK 56**, **Expo Router** (file-based routing), **NativeWind v4**
  + **Tailwind CSS v3**, **React Native 0.85**, **React 19.2**, **TypeScript**. Native modules
  in use include expo-secure-store, async-storage, expo-image-picker, expo-file-system,
  reanimated, expo-audio, expo-blur, expo-linear-gradient, expo-haptics.
- **Backend:** a **separate Next.js API** repo (the app only ever calls that API, never the DB
  directly). **Supabase** (Postgres + Auth + Storage) sits behind the Next.js backend. SQL
  migrations live in the backend repo.
- **Dev workflow / environment:** **macOS** (M2 MacBook Air). Builds use **EAS Build** in the
  cloud for iOS dev clients (local builds overheat the laptop). The **primary test target is a
  physical iPhone** (dev server via `npx expo start`; install dev build via EAS). Single-line
  terminal commands. No CI described yet.
- **Internationalization:** English / Traditional Chinese / Simplified Chinese, switched live.
- **Still-to-build areas (where tooling could help most):** in-app **chat/messaging**, **payments**,
  **social login** (only Google configured so far), **push + in-app notifications**, a real
  personalized **post feed** from the backend, automated **testing** (none exists), and **error/crash
  monitoring**.

## Tools I ALREADY have connected — do NOT recommend these (only mention if a meaningfully better alternative exists)

- **Figma** MCP (design-to-code), **Canva** MCP, **Supabase** MCP, the official **Expo/EAS**
  MCP plugin, **Claude-in-Chrome** browser automation, **Gmail / Google Calendar / Google Drive**
  MCP, and the built-in IDE diagnostics. Treat these as covered. Focus the search on **gaps** around
  them.

## What to search for (use these as starting angles, not limits — be exhaustive)

Search the live web (official docs, the official MCP servers registry/repos, GitHub, and current
2025–2026 articles) for MCP servers that help with:

1. **Documentation / up-to-date API context** — fetching current docs for Expo SDK 56, React Native,
   NativeWind, etc. (so the agent stops using outdated patterns).
2. **Testing for React Native / Expo** — E2E and UI testing the agent can drive (e.g. Maestro-style),
   plus unit/integration test tooling.
3. **Error & crash monitoring** — reading production/dev errors and stack traces from the agent
   (e.g. Sentry-type MCP).
4. **Backend / Postgres / API** — query, inspect, and test the Next.js API and Postgres beyond what
   the Supabase MCP already covers (HTTP/REST testing, schema inspection, log reading).
5. **Source control & project management** — GitHub (PRs/issues/Actions), and issue trackers
   (Linear/Jira/etc.) if I adopt one.
6. **Mobile build/release & app-store ops** — anything beyond the official Expo/EAS plugin.
7. **Web/library research & dependency safety** — package lookup, changelog/upgrade help, vulnerability
   checks.
8. **i18n / translation** workflow helpers.
9. Anything else a strong researcher would flag as a high-leverage dev-productivity win for **this exact
   stack**.

## Hard requirements for what you recommend

- **Live, current sources only.** Today's date context is mid-2026 — prioritize material from the **last
  ~12 months** and note each tool's freshness (last release / last commit). **Do not invent tools** — every
  recommendation must have a real, working source URL (official site, GitHub repo, or registry listing).
  If you cannot verify it exists and is maintained, leave it out.
- **Prefer free / open-source.** Favor free and open-source servers; clearly flag anything paid or with
  a paid tier, and say what's gated.
- **Official or well-maintained only.** Prefer first-party/official servers or ones with clear signs of
  active maintenance (recent commits, real adoption — note stars/last-commit). Exclude abandoned or
  hobby-grade projects.
- **Flag security & trust risk per tool.** MCP servers run with access to my machine, code, and possibly
  secrets/data. For each recommendation note: who maintains it, whether it's official, what access/scopes
  it needs, and any supply-chain or trust concern. Call out anything that needs API keys or broad
  filesystem/network access.
- **Confirm Claude Code compatibility** — it must be usable as an MCP server from Claude Code on macOS,
  and give the actual install method (e.g. the `claude mcp add ...` command or the JSON config).

## Output format

First, a one-paragraph plain-English summary of what you found and your top 3 picks.

Then a **ranked shortlist of the ~10 best-fit tools** (most valuable first). For **each** tool, give:

1. **Name** + one-line description.
2. **What it does** (plain English).
3. **Why it fits LearnSum specifically** (tie it to the stack / a to-build area above).
4. **Cost** (free / open-source / paid tier — be specific).
5. **Maturity & maintenance** (official? last release/commit? adoption signal).
6. **Security/trust note** (maintainer, access/scopes required, any risk).
7. **How to install in Claude Code** (the exact command or config, with the source URL).
8. **Caveats / when NOT to use it.**

End with a short **"skip these / not worth it"** list: notable tools you considered and rejected, with
the one-line reason (redundant with what I already have, abandoned, paid-only, security risk, etc.).

Be exhaustive in your search but disciplined in the final list — quality and verifiability over quantity.
