# AGENTS.md

## Quick Commands
- Install: `cd app && npm ci`
- Tests: `cd app && npm test`
- Lint: `cd app && npm run lint`
- Typecheck: `cd app && npm run typecheck`
- Start dev: `cd app && npm run start`

## Runbook
1. Check Supabase config via `.env` in `app/` or Expo extras.
2. If Supabase is unavailable, the app uses fallback/noop clients.
3. Prefer running tests after UI or service changes.

## Agentic Modules
- Logger: `app/src/utils/logger.ts`
  - Use `reportError(error, { scope, action, eventId, userId, metadata })`.
- Preflight: `app/src/utils/preflight.ts`
  - `assertSupabaseConfigured()` and `warnIfWebUnsupported(feature)`.
- Stable labels: `app/src/ui/labels.ts`
  - Add new testIDs/accessibility labels here first, then wire into screens.

## Adding TestIDs
1. Add a new entry to `app/src/ui/labels.ts`.
2. Use the constants in the screen component.
3. Add or update `app/src/__tests__/labels.spec.tsx`.

## Preflight Local Checks
- Run `node -e "require('./app/src/utils/preflight')"`.
- Or in tests: `npm test -- preflight.spec.ts`.

## Disable Supabase Calls In Tests
- Mock `@/services/supabase` in test files to prevent network access.
- Prefer local returns or noop client behavior.

## When To Use reportError
- Use `reportError` for user-visible failures, init failures, data-loading issues, and unexpected exceptions.
- Provide a stable `scope` and `action` so logs are searchable and consistent.

## Quick Test Runs
- Single file: `cd app && npm test -- <file>.spec.ts`
- UI labels: `cd app && npm test -- labels.spec.tsx`
- Preflight: `cd app && npm test -- preflight.spec.ts`

## Common Failures
- Missing Supabase env: ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set (or Expo extras configured).
- Missing Supabase tables: local fallback will be used; run migrations or sync schema if needed.
- CI lint/typecheck failures: run `npm run lint` and `npm run typecheck` locally to reproduce.

## Safety
- Do not delete migrations.
- Avoid destructive git commands unless asked.
