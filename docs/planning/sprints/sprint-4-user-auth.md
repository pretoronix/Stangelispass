# Sprint 4: User Authentication — Scoping & Migration Plan

**Priority**: 🟡 MEDIUM  
**Estimated Effort**: 2 days (this sprint = planning only; implementation = separate sprint)  
**Complexity**: ⭐⭐⭐⭐ High  
**Status**: 🔵 Not started — current approach works at friend-group scale  
**Depends on**: Sprints 1–3 complete (cleaner AppProvider makes auth migration safer)

---

## Goal

This sprint produces a complete, reviewed implementation plan for replacing the current name-based user selection with Supabase Auth OTP (SMS or Email magic link). No code is written in this sprint — the output is a detailed migration spec and a go/no-go decision.

The plan must answer:
1. What breaks when we enable real auth?
2. How do existing "name-based" users get mapped to Auth UIDs?
3. How do RLS policies change?
4. What is the rollback strategy if migration goes wrong?

---

## Why This Is Deferred

The current approach — selecting a user from a local list, persisting to `SecureStore` — works well for a closed friend group where everyone shares one device or trusts each other's device. It breaks when:

- The app is used by people who don't trust each other with device access
- A user wants their data accessible on multiple devices
- The app scales beyond ~20 people who all know each other

This sprint decides *when* to pull this trigger, not just *how*.

---

## Current Auth Architecture

```
User selects name from list
   → stored in SecureStore via useCurrentUser hook
   → read by AppProvider → exposed as currentUser
   → passed as user_id to all Supabase writes

No Supabase Auth session exists.
RLS policies use anon key; most tables are open to the anon role.
```

Key files:
- `app/src/hooks/useCurrentUser.ts` — reads/writes selected user from SecureStore
- `app/src/providers/appProviderTypes.ts` — `currentUser: User | null`
- `app/src/services/client.ts` — Supabase client (no `auth.getSession()` usage)
- `app/supabase/migrations/001_init.sql` — initial schema (no auth UID references)

---

## Scoping Tasks (This Sprint)

### 1. RLS Audit

Read every migration file and catalog which tables have RLS enabled and what their policies look like. The goal is to understand how much policy work auth migration requires.

**Deliverable:** A table in this doc listing each table, current RLS state, and what the policy needs to become post-auth.

```bash
# Pull current RLS state from DB
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

# Pull existing policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

Expected findings: most tables currently allow anon reads with minimal write restrictions. Post-auth, writes should require `auth.uid() = user_id`.

---

### 2. Identify All `user_id` Write Paths

Every Supabase insert/update that writes a `user_id` column must be updated to use `auth.uid()` instead of the locally-stored ID.

```bash
cd app
grep -r "user_id" src/services/ --include="*.ts" | grep -E "insert|upsert|update"
```

**Deliverable:** A list of service functions that need updating, with their file:line locations.

---

### 3. Design the Migration Strategy

There are two approaches. Choose one:

**Option A: Hard cutover**
- All existing users get a magic-link email sent to an address they provide
- They authenticate once; their existing `users.id` UUID is mapped to `auth.uid()`
- Pros: clean; Cons: requires collecting email addresses, one-time disruption

**Option B: Soft introduction (recommended for friend groups)**
- Introduce auth as optional initially ("Sign in with email for cross-device sync")
- New auth users get linked to existing name-based users via a `auth_uid` column on the `users` table
- Once all users have signed in, remove the fallback
- Pros: zero disruption; Cons: dual-mode complexity for ~2 weeks

**Deliverable:** Write up the chosen approach with the exact migration SQL and rollback plan.

---

### 4. Design the `users` Table Migration

The current `users` table has a `id` UUID column that is app-generated. After auth, the canonical ID should be `auth.uid()`. Options:

**Option A: Add `auth_uid` column, keep app-generated `id`**

```sql
ALTER TABLE users ADD COLUMN auth_uid UUID REFERENCES auth.users(id);
CREATE UNIQUE INDEX users_auth_uid_idx ON users(auth_uid) WHERE auth_uid IS NOT NULL;
```

Advantage: no FK changes across other tables. All existing `user_id` references remain valid.

**Option B: Replace `id` with `auth.uid()`**

Requires updating every foreign key in `beers`, `comments`, `achievements`, `event_memberships`, `device_tokens`, `notifications`. High risk.

**Recommendation:** Option A. Add `auth_uid`, link at login, enforce `auth_uid IS NOT NULL` only after all users have signed in.

---

### 5. Design the App-Side Changes

**`useCurrentUser.ts`** — currently reads a UUID from SecureStore. Post-auth:
- On app start: call `supabase.auth.getSession()` to get the logged-in user
- Map `session.user.id` → `users.auth_uid` to find the app-level `User` record
- Fall back to SecureStore selection if no session (backward-compat period)

**`client.ts`** — no changes; the Supabase client already supports auth sessions via `ExpoSecureStoreAdapter`.

**New screens needed:**
- `app/src/app/auth/sign-in.tsx` — email input → OTP request
- `app/src/app/auth/verify.tsx` — OTP code entry → session established
- Both screens use `supabase.auth.signInWithOtp()` and `supabase.auth.verifyOtp()`

**`_layout.tsx`** — add an auth gate: if no session, redirect to `auth/sign-in`

---

### 6. Define Go/No-Go Criteria

Before committing to implementation, answer:

| Question | Threshold |
|---|---|
| How many active users currently exist? | > 5 justifies the work |
| Are users willing to provide an email/phone? | Must confirm with group |
| Is cross-device sync a requested feature? | Determines urgency |
| Is the friend group closed (known users only)? | Open group → auth is mandatory |

**Deliverable:** Fill in the answers above and make a written go/no-go recommendation at the bottom of this file.

---

## Deliverables from This Sprint

By end of sprint, this file should be updated with:

- [ ] RLS audit table (all tables + current policy + target policy)
- [ ] List of all service write paths that reference `user_id`
- [ ] Chosen migration strategy (Option A or B) with rationale
- [ ] SQL for the `users` table migration (additive only)
- [ ] Rollback plan (how to undo if something goes wrong in production)
- [ ] List of new screens and hooks required
- [ ] Updated time estimate for the implementation sprint
- [ ] Written go/no-go recommendation

---

## Implementation Sprint Preview (Not This Sprint)

Once the plan above is approved, the implementation sprint will follow this order:

1. **Database migration**: Add `auth_uid` column, update RLS policies (additive — nothing breaks yet)
2. **Auth screens**: `sign-in.tsx` and `verify.tsx` with OTP flow
3. **`useCurrentUser` update**: Prefer `auth.uid()` over SecureStore, fall back gracefully
4. **`_layout.tsx` auth gate**: Redirect unauthenticated users
5. **Soft rollout**: Run both modes in parallel for one week
6. **Hard cutover**: Enforce `auth_uid IS NOT NULL`, remove SecureStore fallback
7. **RLS tighten**: Change write policies from `anon` to `auth.uid() = user_id`

**Estimated effort for implementation sprint**: 5–8 days

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Users refuse to provide email/phone | Medium | Support magic link (passwordless, low friction) or WhatsApp OTP via Twilio |
| Existing data becomes inaccessible after migration | Low (with Option A) | Keep `id` column unchanged; only add `auth_uid` |
| Auth breaks offline mode | Medium | `supabase.auth.getSession()` reads from SecureStore, works offline |
| Test suite breaks (many tests mock `currentUser`) | High | Update `mockSupabase.ts` helper to return an auth session; migrate tests incrementally |

---

## Definition of Done for This Sprint

- [ ] RLS audit completed and documented in this file
- [ ] All `user_id` write paths identified and listed
- [ ] Migration strategy chosen with written rationale
- [ ] `users` table migration SQL drafted and reviewed
- [ ] Rollback SQL drafted
- [ ] New screen list and hook list finalized
- [ ] Go/no-go recommendation written
- [ ] Implementation sprint time estimate updated
