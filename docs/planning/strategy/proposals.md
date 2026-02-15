# Implementation Plan: Push Notification Completion

This plan outlines the final steps to activate the 80%-complete push notification infrastructure for Stängelispass.

## User Review Required

> [!IMPORTANT]
> - **Supabase Auth**: Completion of this plan assumes the app is moving towards true user auth (Phase 13) to reliably target `device_tokens`.
> - **Expo Credentials**: You will need to provide `EXPO_PUSH_TOKEN` and ensure the project is configured in the Expo Dashboard.

---

## Proposed Changes

### [Backend] Supabase Infrastructure

#### [MODIFY] [SQL Migration](file:///Users/ppf/Downloads/Stangelispass/app/supabase/migrations/20260211235831_notification_triggers.sql)
- **Action**: Add a Database Webhook trigger.
- **Details**: whenever a row is inserted into `notifications`, it should trigger the `process-notifications` Edge Function immediately.
```sql
-- Trigger to call edge function on notification insertion
CREATE OR REPLACE TRIGGER on_notification_insert
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://<project-ref>.supabase.co/functions/v1/processNotifications',
  'POST',
  '{"Content-Type":"application/json", "Authorization":"Bearer <service-key>"}',
  '{}',
  '1000'
);
```

#### [MODIFY] [Edge Function](file:///Users/ppf/Downloads/Stangelispass/app/supabase/functions/processNotifications/index.ts)
- **Action**: Ensure the Deno runtime can resolve the `notificationProcessor`.
- **Details**: Bundle the processor logic specifically for Deno or move it to a shared `functions/_shared` directory to avoid broken relative imports in production.

---

### [Frontend] App Integration

#### [MODIFY] [App Layout](file:///Users/ppf/Downloads/Stangelispass/app/src/app/_layout.tsx)
- **Action**: Initialize push notifications.
- **Details**: Call `registerForPushNotificationsAsync(currentUserId)` once a session is established.

#### [NEW] [Notification Settings](file:///Users/ppf/Downloads/Stangelispass/app/src/app/settings/notifications.tsx)
- **Action**: Create a UI for managing preferences.
- **Details**: Toggle switches for `leader_change`, `milestones`, and `admin_broadcasts` connected to the `users.notification_prefs` JSONB column.

---

## Verification Plan

### Automated Tests
1. **Trigger Logic**: `npm test -- notificationProcessor.spec.ts` (Mocking fetch to Supabase and Expo).
2. **Schema Integrity**: Verify database triggers correctly insert into `notifications` when `current_leader` changes.

### Manual Verification
1. **Leader Swap**: Open the app on two physical devices, log more beers than the leader, and verify a push notification is received on the other device.
2. **Preference Test**: Disable leader notifications in settings, swap leaders, and verify NO notification is enqueued.
