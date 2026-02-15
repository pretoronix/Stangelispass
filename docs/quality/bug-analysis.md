# Bug Analysis (Agent-Assisted)

**Date:** 2026-02-15

This report summarizes issues discovered while running the project’s agents and during recent app startup/testing, plus the targeted fixes applied.

## ✅ High-Impact Bugs Fixed

### 1) Logger recursion → stack overflow in tests/runtime
- **Symptom:** `RangeError: Maximum call stack size exceeded` in `logger.spec.ts` (and potential runtime recursion).
- **Cause:** `emit()` in `app/src/utils/logger.ts` called `reportError()` which calls `logError()` which calls `emit()` again.
- **Fix:** `emit()` now writes to `console.*` directly to avoid recursion.

### 2) Agent “replace console” broke logger + created duplicate imports
- **Symptom:** Jest parse failures like `Identifier 'reportError' has already been declared` and repeated re-introduction of duplicate logger imports.
- **Cause:** `agents/scripts/replace-console.ts`:
  - Added `import { reportError } from '@/utils/logger'` even when an existing import used double quotes.
  - Rewrote `console.error` in the logger implementation itself, reintroducing recursion.
- **Fix:** `replace-console.ts` now:
  - Detects `reportError` imports with either quote style.
  - Skips `app/src/utils/logger.ts(x)` entirely.

### 3) Expo bundling error for `expo-in-app-purchases`
- **Symptom:** Metro “Unable to resolve `expo-in-app-purchases`” originating from `src/services/iap.ts`.
- **Cause:** The dependency wasn’t reliably available for bundling across environments; any import path that Metro tries to resolve can hard-fail.
- **Fix:** `app/src/services/iap.ts` is now a dependency-free stub that throws a clear “IAP not configured” error when invoked, while allowing the app to bundle.

### 4) Hardcoded Supabase credentials in one-time script
- **Symptom:** `app/scripts/db-verify-one-time.mjs` contained URL + anon key constants.
- **Fix:** Reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (or `SUPABASE_URL`/`SUPABASE_ANON_KEY`) from env and exits if missing.

## ⚠️ Improvements Made (Lower Risk)

### Realtime toast subscription efficiency + typing
- `app/src/hooks/useBeerLogToast.ts` now uses a realtime `filter` on `event_id` to reduce noise, and uses `ReturnType<typeof setTimeout>` for RN-safe timeout typing.

## 🧪 Testing

Agent runs executed:
- Quality agents: `manual` (analysis + safe automated actions) and `pre_commit` (lint/format + affected tests)
- Swarm analysis: `baseline_maintenance` and `maintainability_refactor` (dry-run for proposals)

Local verification:
- Jest: targeted suites around logger + UI error paths were run repeatedly during fixes.
- Lint: no blocking errors (warnings remain for hook dependency suggestions).

## 🧭 Agent Findings (Not Yet Applied)

Swarm maintainability refactor (dry-run) suggested high-impact refactors:
- `app/src/types/database.types.ts`
- `app/src/providers/AppProvider.tsx`
- `app/src/app/add.tsx`

These are larger changes (multi-day risk) and should be tackled as a dedicated refactor with additional safety tests first.

