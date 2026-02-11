# Push Notifications Implementation

## Overview

This implementation adds real-time push notifications to the Stängelispass app for key events like leader changes, new rounds, and milestone achievements.

## What Was Implemented

### 1. Database Schema Updates

**Files Modified:**
- `app/supabase-schema.sql` - Added device_tokens and notifications tables

**Migrations Created:**
- `app/supabase/migrations/20260211235830_push_notifications_tables.sql` - Creates tables for device tokens and notifications queue
- `app/supabase/migrations/20260211235831_notification_triggers.sql` - Adds database triggers for automatic notification creation

**New Tables:**
- `device_tokens` - Stores Expo push tokens for each user's devices
- `notifications` - Queue for pending notifications to be processed

**New Triggers:**
- `on_leader_change` - Automatically creates notifications when event leader changes
- `on_beer_milestone` - Creates notifications when users hit milestones (5, 10, 20, 50, 100 beers)
- `on_beer_update_leader` - Automatically updates the current leader when beers are added/removed

### 2. Frontend Implementation

**New Files Created:**
- `app/src/hooks/useNotifications.ts` - React hook for managing push notification registration
- `app/src/services/notificationTemplates.ts` - Centralized notification message templates
- `app/src/__tests__/useNotifications.spec.ts` - Comprehensive test suite for the notification hook

**Files Modified:**
- `app/src/providers/AppProvider.tsx` - Integrated notification hook to auto-register devices when users sign in

**Existing Infrastructure (Already in place):**
- `app/src/services/notifications.ts` - Device token registration logic
- `app/src/services/notificationProcessor.ts` - Notification queue processing logic
- `app/src/app/settings.tsx` - User preferences UI (already implemented)
- `app/supabase/functions/processNotifications/` - Edge function to process notification queue
- `app/supabase/functions/notifyLeadChange/` - Edge function for leader change notifications

### 3. Notification Flow

```
User Action (e.g., logs a beer)
    ↓
Database Trigger fires
    ↓
Notification inserted into `notifications` table
    ↓
Edge Function processes queue
    ↓
Checks user preferences
    ↓
Fetches device tokens
    ↓
Sends via Expo Push API
    ↓
Push notification delivered to device
```

## Features

### Supported Notification Types

1. **Leader Change** 👑
   - Triggered when a user takes the lead in an event
   - Sent to the new leader
   - User can toggle on/off in settings

2. **Milestone Achievements** 🎉
   - Triggered at: 5, 10, 20, 50, 100 beers
   - Sent to the user who hit the milestone
   - Users can enable/disable specific milestones in settings

3. **New Round** 🍺 (Ready for implementation)
   - Template exists, trigger needs to be added
   - Would notify all users when a new event starts

4. **Badge Unlocked** 🏆 (Ready for implementation)
   - Template exists, trigger needs to be added
   - Would notify users when they unlock achievements

5. **Round Expiring** ⏰ (Ready for implementation)
   - Template exists, scheduled job needs to be added
   - Would remind users when event is about to expire

### User Preferences

Users can control their notification preferences in Settings:
- **Lead Change Alerts** - Toggle on/off
- **5 Beers Milestone** - Toggle on/off
- **10 Beers Milestone** - Toggle on/off
- **20 Beers Milestone** - Toggle on/off

Additional milestones (50, 100) are defined in the database triggers but not yet exposed in the UI.

## Testing

### Run Tests
```bash
cd app
npm test -- useNotifications.spec.ts
```

### Test Coverage
- ✅ Registration when user is set
- ✅ No registration when user is null
- ✅ Graceful failure handling
- ✅ Unregistration on user change
- ✅ Manual unregistration

## Deployment

### 1. Apply Database Migrations

Run the SQL migrations in your Supabase SQL Editor:

```bash
# First migration - creates tables
cat app/supabase/migrations/20260211235830_push_notifications_tables.sql

# Second migration - creates triggers
cat app/supabase/migrations/20260211235831_notification_triggers.sql
```

Or if you have Supabase CLI:

```bash
cd app
supabase db push
```

### 2. Deploy Edge Functions

The edge functions already exist and should already be deployed. To redeploy:

```bash
cd app
supabase functions deploy processNotifications
supabase functions deploy notifyLeadChange
```

### 3. Set Environment Variables

Ensure these are set in your Supabase Edge Functions:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for server-side operations)
- `EXPO_PUSH_ENDPOINT` - (Optional) Defaults to `https://exp.host/--/api/v2/push/send`

### 4. Schedule Notification Processing

Set up a cron job or scheduled function to periodically process the notification queue:

**Option A: Database Cron (pg_cron)**
```sql
-- Run every minute
SELECT cron.schedule(
  'process-notifications',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://[your-project].supabase.co/functions/v1/processNotifications',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"limit": 50}'::jsonb
    );
  $$
);
```

**Option B: External Cron (GitHub Actions, etc.)**
```yaml
# .github/workflows/process-notifications.yml
name: Process Notifications
on:
  schedule:
    - cron: '* * * * *' # Every minute
jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            https://[your-project].supabase.co/functions/v1/processNotifications \
            -H "Content-Type: application/json" \
            -d '{"limit": 50}'
```

### 5. Configure Expo Push Notifications

Make sure your `app.json` has the required Expo configuration:

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#FF6B35"
    }
  }
}
```

## Monitoring

### Check Notification Queue Status

```sql
-- See pending notifications
SELECT * FROM notifications WHERE processed = false ORDER BY created_at DESC;

-- See processed notifications (last hour)
SELECT * FROM notifications 
WHERE processed = true 
  AND processed_at > NOW() - INTERVAL '1 hour'
ORDER BY processed_at DESC;

-- Check notification stats
SELECT 
  payload->>'type' as notification_type,
  processed,
  COUNT(*) as count
FROM notifications
GROUP BY payload->>'type', processed;
```

### Check Device Token Registration

```sql
-- See all registered devices
SELECT u.name, dt.platform, dt.token, dt.created_at
FROM device_tokens dt
JOIN users u ON u.id = dt.user_id
ORDER BY dt.created_at DESC;

-- Count devices per user
SELECT u.name, COUNT(dt.id) as device_count
FROM users u
LEFT JOIN device_tokens dt ON dt.user_id = u.id
GROUP BY u.id, u.name
ORDER BY device_count DESC;
```

## Troubleshooting

### Notifications Not Being Sent

1. **Check if device tokens are registered:**
   ```sql
   SELECT COUNT(*) FROM device_tokens;
   ```

2. **Check if notifications are being created:**
   ```sql
   SELECT * FROM notifications WHERE processed = false LIMIT 10;
   ```

3. **Check Edge Function logs:**
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for errors in `processNotifications` function

4. **Check user preferences:**
   ```sql
   SELECT name, notification_prefs FROM users;
   ```

### Notifications Being Created but Not Delivered

1. **Check if Edge Function is being called:**
   - Verify cron job is running
   - Check Edge Function invocations in dashboard

2. **Check Expo Push API response:**
   - Look at Edge Function logs for send failures
   - Verify push tokens are valid Expo format

3. **Check device permissions:**
   - User must grant notification permissions on their device
   - Check iOS Settings or Android Settings for app permissions

### Device Not Registering for Notifications

1. **Platform Support:**
   - Push notifications don't work on web
   - Requires physical device (not simulator/emulator for production)

2. **Check Expo configuration:**
   - Verify `app.json` has correct notification settings
   - Ensure app is built with EAS or has proper push credentials

3. **Check logs:**
   - Look for errors in app console when user signs in
   - Check if `registerForPushNotificationsAsync` is being called

## Future Enhancements

The implementation plan document includes several future enhancements:

1. **Rich Notifications** - Images, actions, categories
2. **Scheduled Notifications** - "Your round expires in 1 hour"
3. **Notification History** - In-app inbox
4. **Custom Sounds** - Per notification type
5. **Deep Linking** - Open specific screen on tap

These features can be added by:
- Extending the notification templates
- Adding new triggers or scheduled jobs
- Enhancing the notification UI

## Success Metrics

Track these metrics to measure success:

- **Registration Rate**: % of active users with registered devices
- **Delivery Rate**: % of notifications successfully delivered
- **Open Rate**: % of notifications opened
- **Opt-out Rate**: % of users who disable notifications
- **Error Rate**: % of notifications that fail to send

Query for basic metrics:
```sql
-- Registration rate
SELECT 
  (SELECT COUNT(DISTINCT user_id) FROM device_tokens) * 100.0 / 
  (SELECT COUNT(*) FROM users) as registration_percentage;

-- Delivery stats (last 24 hours)
SELECT 
  processed,
  COUNT(*) as count
FROM notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY processed;
```

## Documentation References

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- Original Plan: `/docs/implementation-plans/01-push-notifications.md`
