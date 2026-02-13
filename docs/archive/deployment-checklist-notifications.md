# Push Notifications Deployment Checklist

## Pre-Deployment Verification

- [x] All tests passing
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] Code reviewed
- [x] Documentation complete

## Database Setup

- [ ] Run migration 1: `20260211235830_push_notifications_tables.sql`
  - Creates `device_tokens` table
  - Creates `notifications` table
  - Enables RLS and policies
  
- [ ] Run migration 2: `20260211235831_notification_triggers.sql`
  - Adds `current_leader` column to events
  - Creates helper functions
  - Creates triggers for auto-notifications
  
- [ ] Verify tables created:
  ```sql
  SELECT * FROM device_tokens LIMIT 1;
  SELECT * FROM notifications LIMIT 1;
  ```

## Edge Functions

- [ ] Verify functions are deployed:
  ```bash
  cd app
  supabase functions list
  # Should show: processNotifications, notifyLeadChange
  ```

- [ ] Test processNotifications manually:
  ```bash
  curl -X POST https://[PROJECT].supabase.co/functions/v1/processNotifications \
    -H "Content-Type: application/json" \
    -d '{"limit": 10}'
  ```

## Environment Variables

Verify these are set in Supabase Dashboard → Edge Functions → Settings:

- [ ] `SUPABASE_URL` - Your project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- [ ] `EXPO_PUSH_ENDPOINT` - (Optional) Defaults to Expo's API

## Cron Job Setup

Choose ONE method:

### Option A: Supabase Database Cron (Recommended)

- [ ] Install pg_cron extension:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  ```

- [ ] Schedule notification processing:
  ```sql
  SELECT cron.schedule(
    'process-push-notifications',
    '* * * * *',  -- Every minute
    $$
      SELECT net.http_post(
        url := 'https://[PROJECT].supabase.co/functions/v1/processNotifications',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{"limit": 50}'::jsonb
      );
    $$
  );
  ```

- [ ] Verify cron job created:
  ```sql
  SELECT * FROM cron.job;
  ```

### Option B: External Cron Service

- [ ] Set up external scheduler (GitHub Actions, etc.)
- [ ] Configure to call edge function every minute
- [ ] Test first run

## App Configuration

- [ ] Verify `app.json` has notification settings:
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

- [ ] Rebuild app if notification icon/config changed

## Testing

### 1. Device Registration Test

- [ ] Install app on physical device
- [ ] Sign in as a user
- [ ] Check device_tokens table:
  ```sql
  SELECT u.name, dt.token, dt.platform 
  FROM device_tokens dt
  JOIN users u ON u.id = dt.user_id;
  ```

### 2. Leader Change Notification Test

- [ ] User A logs in and adds beers
- [ ] User B logs more beers to take the lead
- [ ] Check notifications table:
  ```sql
  SELECT * FROM notifications 
  WHERE payload->>'type' = 'leader_change'
  ORDER BY created_at DESC LIMIT 5;
  ```
- [ ] Wait 1 minute for cron to process
- [ ] Verify notification delivered to User B's device

### 3. Milestone Notification Test

- [ ] User logs beers until hitting 5
- [ ] Check notifications table for milestone:
  ```sql
  SELECT * FROM notifications 
  WHERE payload->>'type' = 'milestone'
  ORDER BY created_at DESC LIMIT 5;
  ```
- [ ] Wait 1 minute for processing
- [ ] Verify notification delivered

### 4. User Preferences Test

- [ ] User disables "Lead Change Alerts" in settings
- [ ] Trigger a leader change
- [ ] Verify notification NOT sent (should be filtered by processor)

## Monitoring Setup

- [ ] Set up monitoring dashboard in Supabase
- [ ] Create saved queries for common checks:

  **Pending Notifications:**
  ```sql
  SELECT COUNT(*) as pending 
  FROM notifications 
  WHERE processed = false;
  ```

  **Delivery Rate (last hour):**
  ```sql
  SELECT 
    processed,
    COUNT(*) as count,
    (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()) as percentage
  FROM notifications
  WHERE created_at > NOW() - INTERVAL '1 hour'
  GROUP BY processed;
  ```

  **Registration Rate:**
  ```sql
  SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT dt.user_id) as registered_users,
    (COUNT(DISTINCT dt.user_id) * 100.0 / COUNT(DISTINCT u.id)) as registration_rate
  FROM users u
  LEFT JOIN device_tokens dt ON dt.user_id = u.id;
  ```

## Post-Deployment Verification

- [ ] Monitor Edge Function logs for errors
- [ ] Check notification queue is being processed
- [ ] Verify delivery rate is > 90%
- [ ] Confirm user opt-out rate is < 10%

## Rollback Plan

If issues occur:

1. **Disable Cron Job:**
   ```sql
   SELECT cron.unschedule('process-push-notifications');
   ```

2. **Stop Creating Notifications:**
   ```sql
   DROP TRIGGER IF EXISTS on_leader_change ON events;
   DROP TRIGGER IF EXISTS on_beer_milestone ON beers;
   ```

3. **Clear Queue (if needed):**
   ```sql
   UPDATE notifications SET processed = true WHERE processed = false;
   ```

## Success Criteria

After 24 hours of production use:

- [ ] > 80% of active users have registered devices
- [ ] > 95% notification delivery rate
- [ ] < 5% opt-out rate
- [ ] No critical errors in logs
- [ ] Average notification open rate > 30%

## Documentation

- [x] README created at `docs/PUSH_NOTIFICATIONS_README.md`
- [x] Deployment checklist completed
- [ ] Update main README if needed
- [ ] Add to changelog

## Notes

- Push notifications require physical devices (not simulators)
- Web platform does not support push notifications
- iOS requires proper push certificate configuration in Expo
- Test thoroughly on both iOS and Android before production

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Production URL:** _____________

**Notes:** _____________
