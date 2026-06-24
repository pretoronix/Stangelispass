# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stängelispass is a social beer-tracking mobile app (React Native / Expo) backed by Supabase. It supports real-time beer logging, an achievement system, gamification, offline support, and push notifications.

## Repository Layout

```
app/          # The Expo / React Native application (all active development here)
agents/       # AI agent runner scripts and swarm-agent configs
docs/         # Extended documentation (architecture, roadmaps, feature plans)
.github/      # CI workflows and agent workflow definitions
Makefile      # Shorthand commands for common verification tasks
package.json  # Root-level agent/swarm scripts (not the app's package.json)
```

All application code lives under `app/`. Most tasks require `cd app` first.

## Development Commands

All commands are run from the `app/` directory unless noted.

```bash
# Install dependencies
npm ci

# Start Expo dev server
npm run start

# Run tests (interactive watch mode)
npm test

# Run tests for CI (no watch, with coverage)
npm run test:ci

# Run a single test file
npx jest src/__tests__/beerCounts.spec.ts

# TypeScript check
npm run typecheck

# Lint
npm run lint

# Format (Prettier)
npm run format

# Database: push migrations to remote Supabase
npm run db:push

# Database: check connection and schema health
npm run db:check

# Coverage ratchet (enforces coverage doesn't regress)
node scripts/coverageRatchet.mjs
```

From the **repo root** (not `app/`):

```bash
# Full verify: test + typecheck + lint
make verify

# AI quality agent (analysis)
npm run quality

# AI quality agent (auto-fix lint/format issues)
npm run quality:fix

# Swarm agents (planning & documentation)
npm run swarm:analyze
npm run swarm:roadmap
npm run swarm:docs
```

## Architecture

### Provider Hierarchy

`_layout.tsx` mounts a fixed provider stack:

```
SafeAreaProvider
  AppErrorBoundary        ← catches React errors, shows fallback UI
    QueryProvider         ← TanStack Query with AsyncStorage persistence (24h cache)
      AppProvider         ← global auth/event/user state (see below)
        <Tabs />          ← Expo Router tab navigation
```

`QueryProvider` (`src/providers/QueryProvider.tsx`) wraps `PersistQueryClientProvider`. The React Query cache is persisted to AsyncStorage keyed by `STANGELISPASS_QUERY_CACHE_{version}_{cacheVersion}`. Sensitive keys (`device-token`, `auth-session`) are excluded from persistence.

`AppProvider` (`src/providers/AppProvider.tsx`) exposes `AppContextType` via `useApp()`. The context includes: `currentUser`, `activeEvent`, `isAdmin`, `eventPermissions`, `eventMembers`, `offlineQueue`, and helpers like `startEvent`/`closeEvent`. Its state logic is split across `useAppProviderState.ts`, `appProviderActions.ts`, `appProviderLifecycle.ts`, and `appProviderUtils.ts`.

### Screens (Expo Router file-based routing)

| File | Tab |
|---|---|
| `src/app/index.tsx` | Home – live beer log, round controls |
| `src/app/add.tsx` | Add – log beers for other users, QR scanning |
| `src/app/history.tsx` | History – personal beer log |
| `src/app/legends.tsx` | Legends – leaderboard and Wall of Fame |
| `src/app/settings.tsx` | Settings – event admin, user management, IAP |
| `src/app/profile.tsx` | Profile – hidden from tab bar, navigated to directly |
| `src/app/leaderboard/[eventId].tsx` | Dynamic leaderboard per event |

### Service Layer (`src/services/`)

`src/services/supabase.ts` is the **barrel file** that re-exports everything. Internally services are split into:

- `client.ts` – Supabase client creation; falls back to a silent noop client when `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are absent (dev only; throws in production).
- `beers.ts` – beer CRUD, achievements, beer stamps
- `events/` – split sub-module: `lifecycle.ts`, `memberships.ts`, `stats.ts`, `reset.ts`, `leaderSnapshots.ts`, `wallOfFame.ts`
- `users.ts`, `notifications.ts`, `notificationProcessor.ts`, `iap.ts`, `lifetimePass.ts`, `promoCodes.ts`, `safety.ts`, `permissions.ts`

Import from `@/services/supabase` (or the specific file). **Never import directly from `@supabase/supabase-js` in application code.**

### Hooks and React Query

`src/hooks/query.ts` is the central barrel for all query/mutation hooks. Always import from `@/hooks/query` rather than individual hook files.

Query key constants are exported as `BEER_QUERY_KEYS`, `EVENT_QUERY_KEYS`, `USER_QUERY_KEYS` from their respective hook files. Use these constants when manually prefetching or invalidating.

### Offline Support

`useOfflineMutations` queues `addBeer`/`removeBeer` operations to AsyncStorage when offline. `useOfflineQueueProcessor` drains the queue when connectivity is restored. The `OfflineBanner` component (`src/components/ui/OfflineBanner.tsx`) surfaces status to users.

### Database (Supabase)

Migrations are in `app/supabase/migrations/` and are strictly **additive** – never modify or delete an existing migration file. Edge functions live in `app/supabase/functions/` (`processNotifications`, `notifyLeadChange`).

Database TypeScript types are auto-generated at `src/types/database.types.ts`. Per-table slices live in `src/types/database/`.

## Coding Conventions

### Error handling

Use `reportError(error, { scope, action, eventId?, userId?, metadata? })` from `@/utils/logger` for all unexpected exceptions. Use `logInfo` / `logWarn` for informational output. Never use raw `console.error` in application code. Never use `Alert.alert` for main user-facing errors; use the designated UI error overlays or snackbars instead.

### TestIDs / accessibility labels

UI element identifiers live in `src/ui/labels.ts`. **Always add a new ID to `labels.ts` first**, then wire the `testID` and `accessibilityLabel` into the component. Tests use these stable IDs.

### Mocking Supabase in tests

Never allow real network calls in tests. Mock `@/services/supabase` in every test file. The test helper at `src/__tests__/helpers/mockSupabase.ts` provides `MockDatabase` and `createMockSupabaseClient` for integration tests. `src/__tests__/helpers/testDataFactory.ts` provides test data factories.

### Feature flags

`src/config/featureFlags.ts` exports `FEATURE_FLAGS` (e.g. `NOTIFICATIONS_ENABLED`, `REALTIME_ENABLED`, `OFFLINE_MODE_ENABLED`). Override via `EXPO_PUBLIC_*` environment variables without a redeploy.

### File naming

- Components: PascalCase (`BeerLogItem.tsx`)
- Hooks: camelCase prefixed with `use` (`useBeersQuery.ts`)
- Services/utils: camelCase (`costCalculator.ts`)
- Screens: Expo Router conventions (`index.tsx`, `[eventId].tsx`)
- Tests: match source file, suffix `.spec.ts` / `.spec.tsx`

### Path aliases

`@/` maps to `app/src/`. Use it everywhere; no relative `../../` imports.

## CI

CI (`.github/workflows/ci.yml`) runs on every push and PR:
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test:ci` (coverage collected)
4. `node scripts/coverageRatchet.mjs` (blocks if coverage drops below baseline)

Current coverage thresholds: branches 41%, functions 45%, lines 54%, statements 53%.
