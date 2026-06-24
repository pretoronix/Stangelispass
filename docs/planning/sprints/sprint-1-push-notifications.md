# Sprint 1: Complete Push Notifications

**Priority**: 🔴 HIGH  
**Estimated Effort**: 3–5 days  
**Complexity**: ⭐⭐ Low-Medium (infrastructure 80% exists)  
**Status**: 🟡 In Progress — final 20% remaining  
**Depends on**: Physical device + EAS account + Supabase prod access

---

## Goal

Close the gap between the notification infrastructure that exists in the codebase and a fully working end-to-end push notification flow on physical devices. No new architecture is needed — this sprint is entirely about wiring, credentials, and verification.

---

## What Already Exists

| Asset | Location | State |
|---|---|---|
| Device token registration hook | `app/src/hooks/useNotifications.ts` | ✅ Done |
| Notification handler (foreground/background) | `app/src/hooks/useNotificationHandler.ts` | ✅ Done |
| Notification templates | `app/src/services/notificationTemplates.ts` | ✅ Done |
| Notification query hook | `app/src/hooks/useNotificationsQuery.ts` | ✅ Done |
| `device_tokens` + `notifications` DB tables | Migration `20260211235830` | ✅ Done |
| Leader change + milestone triggers | Migration `20260211235831` | ✅ Done |
| `processNotifications` edge function | `app/supabase/functions/processNotifications/` | ✅ Deployed |
| `notifyLeadChange` edge function | `app/supabase/functions/notifyLeadChange/` | ✅ Deployed |
| User notification preference UI | `app/src/components/settings/NotificationsSection.tsx` | ✅ Done |
| `useNotificationPreferences` hook | `app/src/hooks/settings/useNotificationPreferences.ts` | ✅ Done |

---

## What Is Missing

### 1. Expo Push Credentials (Blocking)

EAS push credentials (APNs for iOS, FCM for Android) have not been confirmed as configured. Without these, `getExpoPushTokenAsync()` returns a non-deliverable token.

**Tasks:**
- [ ] Run `eas credentials` and verify APNs key is uploaded for iOS
- [ ] Verify FCM server key is configured for Android in EAS
- [ ] Confirm `app/app.json` has the `notification` block (icon, color, `UIBackgroundModes`)

```json
// app/app.json — add if missing
"notification": {
  "icon": "./assets/icon.png",
  "color": "#FF6B35",
  "androidMode": "default"
},
"ios": {
  "infoPlist": {
    "UIBackgroundModes": ["remote-notification"]
  }
}
```

---

### 2. Notification Processing Cron Job (Blocking)

The `processNotifications` edge function exists and is deployed but nothing calls it on a schedule. The notification queue fills but is never drained.

**Tasks:**
- [ ] Enable `pg_cron` extension in Supabase Dashboard → Database → Extensions
- [ ] Create the cron schedule via SQL Editor:

```sql
-- Run in Supabase SQL Editor
SELECT cron.schedule(
  'process-notifications',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/processNotifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{"limit": 50}'::jsonb
    );
  $$
);
```

- [ ] Alternatively: add a GitHub Actions scheduled workflow at `app/.github/workflows/` that POSTs to the edge function every minute (simpler, no pg_cron needed)
- [ ] Verify the job runs: check `cron.job_run_details` or edge function logs

---

### 3. Deep Linking on Notification Tap

Currently `useNotificationHandler.ts` receives the notification but likely does not navigate to the relevant screen. Users who tap a "You're in the lead!" notification should land on the Home screen (or event leaderboard).

**Tasks:**
- [ ] Audit `app/src/hooks/useNotificationHandler.ts` — check what happens in the `lastNotificationResponse` effect
- [ ] Map notification `data.type` → Expo Router route:
  - `leader_change` → `/` (Home)
  - `milestone` → `/profile`
  - `new_round` → `/`
- [ ] Use `router.push()` from `expo-router` for navigation inside the handler
- [ ] Add test case to `useNotificationHandler.spec.ts` (or create it) covering navigation dispatch

---

### 4. Badge Unlocked Notification Trigger

The `notificationTemplates.ts` has a `BADGE_UNLOCKED` template defined, but there is no database trigger creating a notification row when an achievement is awarded. The `award_achievement` function in migrations `005`/`006` awards badges but does not enqueue a notification.

**Tasks:**
- [ ] Write migration `20260529000000_badge_notification_trigger.sql`:

```sql
CREATE OR REPLACE FUNCTION notify_badge_unlocked()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, payload)
  VALUES (
    NEW.user_id,
    'badge_unlocked',
    jsonb_build_object('badge_type', NEW.badge_type, 'event_id', NEW.event_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_badge_unlocked
AFTER INSERT ON achievements
FOR EACH ROW
EXECUTE FUNCTION notify_badge_unlocked();
```

- [ ] Apply migration to production via `npm run db:push` (from `app/`)
- [ ] Add tests in `app/src/__tests__/notificationProcessor.spec.ts` for `badge_unlocked` type

---

### 5. Expose 50 and 100 Beer Milestone Preferences in UI

Triggers for 50 and 100 beer milestones exist in the DB but are not represented as toggles in the Settings screen `NotificationsSection`. Users cannot opt out of these.

**Tasks:**
- [ ] Add `milestone_50` and `milestone_100` keys to `DEFAULT_NOTIFICATION_PREFS` in `app/src/services/types.ts`
- [ ] Add corresponding toggle rows in `app/src/components/settings/NotificationsSection.tsx`
- [ ] Confirm `useNotificationPreferences` hook reads/writes these keys correctly
- [ ] Update `useNotifications.spec.ts` if needed

---

### 6. End-to-End Verification on Physical Device

**Manual test checklist** (cannot be automated):
- [ ] Sign in on a physical iOS or Android device
- [ ] Grant notification permissions when prompted
- [ ] Confirm a row appears in `device_tokens` table in Supabase Dashboard
- [ ] Log a beer that changes the leader — confirm a row appears in `notifications`
- [ ] Wait ≤ 2 minutes — confirm push notification is received on the device
- [ ] Tap the notification — confirm the app opens on the correct screen
- [ ] Sign out — confirm the device token row is removed from `device_tokens`

---

## File Checklist

| File | Action |
|---|---|
| `app/app.json` | Add `notification` + `UIBackgroundModes` if missing |
| `app/src/hooks/useNotificationHandler.ts` | Add navigation dispatch on tap |
| `app/src/services/types.ts` | Add `milestone_50`, `milestone_100` to default prefs |
| `app/src/components/settings/NotificationsSection.tsx` | Add two new toggle rows |
| `app/supabase/migrations/20260529000000_badge_notification_trigger.sql` | New migration |
| `app/src/__tests__/notificationProcessor.spec.ts` | Test badge_unlocked type |

---

## Definition of Done

- [ ] `eas credentials` shows valid APNs key (iOS) and FCM key (Android)
- [ ] Cron job confirmed running (check `cron.job_run_details` or GitHub Actions logs)
- [ ] Push received on physical device within 2 minutes of triggering event
- [ ] Notification tap navigates to correct screen
- [ ] Badge unlocked trigger migration applied and tested
- [ ] 50/100 milestone toggles visible in Settings
- [ ] All existing 126+ tests still pass: `cd app && npm test`
- [ ] `npm run typecheck` and `npm run lint` pass with 0 errors
