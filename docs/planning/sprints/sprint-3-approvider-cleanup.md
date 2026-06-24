# Sprint 3: AppProvider Cleanup & Hook Deprecation

**Priority**: 🟡 MEDIUM  
**Estimated Effort**: 2–3 days  
**Complexity**: ⭐⭐ Low-Medium  
**Status**: 🟠 Partially done — hooks deprecated in docs but still present in codebase  
**Risk**: Low — no user-facing behaviour changes

---

## Goal

Finish the architectural clean-up started during Phase 10.5. `AppProvider` still owns state that is better managed by React Query. The legacy `useBeers.ts` and `useUsers.ts` hook files still exist in the codebase. Completing this sprint simplifies the provider, removes dead code, and makes future feature work easier to reason about.

---

## Context

After the React Query migration (Phase 10.5), the high-priority refactoring doc marks legacy hooks as "deprecated and removed from production usage", but the files `app/src/hooks/useBeers.ts` and `app/src/hooks/useUsers.ts` are still present. Similarly, `AppProvider` (via `useAppProviderState`) still manually fetches and holds data that React Query already owns, causing duplicate fetch logic.

---

## Current State Audit

Before changing anything, run the audit below to get a precise list of active usages:

```bash
# Find all imports of the legacy hooks
cd app
grep -r "from.*useBeers['\"]" src/ --include="*.ts" --include="*.tsx"
grep -r "from.*useUsers['\"]" src/ --include="*.ts" --include="*.tsx"

# Find what AppProvider manually fetches (vs delegates to React Query)
grep -n "supabase\." src/providers/useAppProviderState.ts
grep -n "supabase\." src/providers/appProviderActions.ts
```

Expected: legacy hook imports should only appear in `__tests__` files and possibly a few screens not yet migrated.

---

## Tasks

### 1. Audit and Remove `useBeers.ts`

**Tasks:**
- [ ] Read `app/src/hooks/useBeers.ts` — identify what it re-exports
- [ ] Search all non-test files for imports: `grep -r "useBeers" src/ --include="*.tsx" --include="*.ts" | grep -v __tests__`
- [ ] For each usage, replace with the equivalent from `@/hooks/query` (`useBeersQuery`, `useBeerCounts`, etc.)
- [ ] Remove the file `app/src/hooks/useBeers.ts`
- [ ] Update `app/src/__tests__/useBeers.spec.ts` — either delete it (if it purely tested the wrapper) or migrate to test the query hook directly
- [ ] Confirm `useBeers` does not appear in `query.ts` barrel (it shouldn't — the barrel already exports `useBeersQuery`)

**Files:** `app/src/hooks/useBeers.ts` (delete), any screen importing it, `app/src/__tests__/useBeers.spec.ts` (update or delete)

---

### 2. Audit and Remove `useUsers.ts`

Same process as above for the users wrapper:

**Tasks:**
- [ ] Read `app/src/hooks/useUsers.ts`
- [ ] Find all non-test consumers: `grep -r "useUsers['\"]" src/ --include="*.tsx" --include="*.ts" | grep -v __tests__`
- [ ] Replace each with `useUsers` from `@/hooks/query` (exported from `useUsersQuery.ts`) — note: same name, different source file
- [ ] Remove `app/src/hooks/useUsers.ts`
- [ ] Verify `app/src/__tests__/useCurrentUser.spec.ts` and related tests still pass

**Files:** `app/src/hooks/useUsers.ts` (delete), consumers

---

### 3. Reduce `AppProvider` Manual Fetch Surface

`useAppProviderState.ts` likely fetches users and possibly events directly via Supabase, duplicating what React Query already does. The goal is to have `AppProvider` manage only the state that React Query cannot own: the **currently selected user identity** and **active event identity** (IDs stored in SecureStore).

**Tasks:**
- [ ] Read `app/src/providers/useAppProviderState.ts` and `appProviderLifecycle.ts` in full
- [ ] Identify every `supabase.*` call made directly by the provider
- [ ] For calls that duplicate React Query (e.g. fetching users list, fetching event members), remove the direct call and instead read from the query cache via `queryClient.getQueryData(USER_QUERY_KEYS.users())`
- [ ] Keep direct Supabase calls only for:
  - Writing the selected `userId` to SecureStore
  - Writing the active `eventId` to SecureStore
  - Starting / closing an event (mutations that are not yet in a query hook)
- [ ] Verify `AppContextType` in `appProviderTypes.ts` — remove any fields that are now redundant (e.g. a `users` field that duplicates the query)
- [ ] Run full test suite after each meaningful change

**Files:** `app/src/providers/useAppProviderState.ts`, `app/src/providers/appProviderLifecycle.ts`, `app/src/providers/appProviderActions.ts`, `app/src/providers/appProviderTypes.ts`

---

### 4. Consolidate `startEvent` / `closeEvent` into Query Mutations (Optional Stretch)

If time allows, move the `startEvent` and `closeEvent` logic out of `AppProvider` into dedicated React Query mutations, following the same pattern as `useAddBeer` in `useBeersQuery.ts`.

**Tasks:**
- [ ] Create `useStartEvent()` and `useCloseEvent()` mutations in `app/src/hooks/useEventsQuery.ts`
- [ ] Each mutation should: call the Supabase service, invalidate relevant event query keys, update SecureStore for the active event ID
- [ ] Remove `startEvent` / `closeEvent` from `AppContextType` and `AppProvider`
- [ ] Update all callers (primarily `app/src/app/settings.tsx` and `HomeModals`)
- [ ] Add tests for the new mutation hooks

**Files:** `app/src/hooks/useEventsQuery.ts`, `app/src/providers/appProviderTypes.ts`, `app/src/app/settings.tsx`, `app/src/components/home/HomeModals.tsx`

---

### 5. Update `app/src/hooks/query.ts` Barrel

After removing legacy files, verify the barrel is clean:

**Tasks:**
- [ ] Confirm `query.ts` does not re-export from `useBeers.ts` or `useUsers.ts`
- [ ] Ensure all public hook names are exported exactly once
- [ ] Run `npx tsc --noEmit` to catch any broken imports

---

## Testing Strategy

This sprint makes no user-facing changes. The test suite is the safety net.

- Run `cd app && npm test` after every file deletion or provider change
- If a test imports `useBeers` / `useUsers` from the old path, update the import, not the hook
- Do not delete test files that cover meaningful behaviour — migrate them to test the underlying query hooks

```bash
# Baseline before starting
cd app && npm test -- --watchAll=false --coverage
```

Keep coverage at or above the current baseline (lines 54%, branches 41%). If coverage drops, add focused tests for any paths that are no longer covered by the deleted test files.

---

## File Checklist

| File | Action |
|---|---|
| `app/src/hooks/useBeers.ts` | Delete |
| `app/src/hooks/useUsers.ts` | Delete |
| `app/src/__tests__/useBeers.spec.ts` | Delete or migrate |
| `app/src/providers/useAppProviderState.ts` | Remove direct Supabase fetches |
| `app/src/providers/appProviderLifecycle.ts` | Simplify lifecycle |
| `app/src/providers/appProviderActions.ts` | Thin out manual state writes |
| `app/src/providers/appProviderTypes.ts` | Remove redundant context fields |
| `app/src/hooks/query.ts` | Verify barrel is clean |
| `app/src/hooks/useEventsQuery.ts` | Add `useStartEvent`, `useCloseEvent` (stretch) |

---

## Definition of Done

- [ ] `useBeers.ts` and `useUsers.ts` files no longer exist in the repository
- [ ] No non-test file imports from the deleted paths
- [ ] `AppProvider` makes no direct Supabase calls for data that React Query owns
- [ ] `AppContextType` has no fields that duplicate query cache state
- [ ] All 126+ tests pass: `cd app && npm test`
- [ ] Coverage does not regress below current baselines
- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run lint` passes with 0 errors
