## User Handling Improvements (Top 5)

These are scoped, code-grounded improvements based on current user handling. They are suggestions only and not implemented here.

1. Track who created/added a user
   - Add `created_by` to `users` or persist the creator in `event_memberships.invited_by`.
   - Enables “show only users I added” without relying on global user lists.
   - Tests: create user with `created_by`; verify it is returned and persisted.

2. Separate global users from event participants
   - Avoid `getUsers()` for leaderboard contexts; always use event memberships or event beers.
   - Prevents unrelated users appearing in event leaderboards.
   - Tests: event with extra users in `users` table should not leak into leaderboard.

3. De-duplicate and validate user names
   - Enforce uniqueness or add disambiguation (e.g., short IDs).
   - Reduces confusion when multiple users share a name.
   - Tests: create users with same name; ensure UI disambiguates consistently.

4. Tighten current user persistence
   - Add a stale-user cleanup: if stored user no longer exists, clear and prompt selection.
   - Improves resilience after deletes or resets.
   - Tests: delete user; app should clear `CURRENT_USER_KEY` and prompt selection.

5. Explicit membership state transitions
   - On add/remove, always update `event_memberships.status` and invalidate relevant queries.
   - Keeps UI consistent across devices.
   - Tests: remove member → leaderboard refresh excludes user.
