# Push Notifications Plan

Feature: Push Notifications for key events (lead changes, new round started, admin broadcasts)  
Roadmap source: docs/planning/strategy/feature_roadmap.md  
Status: ✅ Implemented (Core pipeline)  
Owner: Product + Engineering  
Last Updated: 2026-02-13

---

## Summary
Add targeted push notifications for event activity, using existing Expo + Supabase infrastructure. The app already has expo-notifications, device token storage, server-side triggers, and a queue processor. Core flows now work end-to-end, including vibration feedback on receipt.

## Implementation Status (Feb 13, 2026)

✅ **Implemented**
- Device token registration and storage (`device_tokens`)
- Notifications queue (`notifications`) + processing edge function (`processNotifications`)
- DB triggers for leader changes + milestones
- Admin broadcasts enqueued to queue
- New round notifications enqueued when a round starts (via AppProvider)
- Foreground vibration feedback via `expo-haptics`
- Push payload includes sound/priority to trigger device vibration where supported

⚠️ **Required to operate in production**
- Deploy Edge Functions (`processNotifications`, `notifyLeadChange`)
- Ensure a scheduler calls `/functions/v1/processNotifications` (cron or GitHub Actions)
- Run migrations for `device_tokens`, `notifications`, and notification prefs

---

## Benefits
- Engagement: pulls users back during active rounds.
- Retention: real-time social signal boosts session return.
- Admin power: broadcasts and round changes become instantly visible.
- Competitive dynamics: leader change notifications intensify gameplay.

---

## Complexity and Effort
Complexity: Medium–High  
Estimated time: 7–12 engineering days  
Risk: Medium (depends on backend triggers, auth, and device-token integrity)

Effort breakdown:
1. Backend webhook + Edge Function: 3–5 days
2. Notification preference modeling + UI: 1–2 days
3. Token lifecycle and device registration stability: 1–2 days
4. Testing + staging validation: 2–3 days

---

## Dependencies
- Supabase Edge Functions
- Supabase DB webhooks (insert/update events)
- Reliable device_tokens table population
- Auth migration (OTP) is optional but improves targeting

---

## Proposed Scope
Must-have (MVP):
1. Leader change: "John just stole the lead!"
2. New round: "Round started — join now"
3. Admin broadcast: "Admin message: ..."

Nice-to-have (post-MVP):
1. Milestones: "You hit 10 beers"
2. Achievement unlocked: "Hat Trick!"
3. Round ending soon: "15 minutes left"

---

## Implementation Plan (Current)

### Phase 1 — Backend Triggering (Implemented)
1. Create Supabase Webhooks
   Trigger on:
   - beers insert (leader change)
   - events update (round started/ended)
   - notifications insert (admin broadcast)

2. Edge Function
   Implement notify_event handler that:
   - receives webhook payload
   - decides notification type
   - resolves recipients from device_tokens
   - applies notification_prefs
   - enqueues delivery via Expo push API

3. Security and Auth
   - Validate Supabase webhook signature
   - Guard broadcasts to admins only
   - Ensure RLS doesn’t block internal processing

### Phase 2 — Client Integration (Implemented)
1. Device Token Registration
   - Confirm registerForPushNotificationsAsync executes for logged-in users
   - Ensure tokens saved in device_tokens
   - Handle token refresh and cleanup

2. Notification Preferences
   - Expose in settings (admin broadcast, leader change, milestones)
   - Map to notification_prefs JSON

3. Vibration Feedback
   - Foreground notifications trigger `expo-haptics` success feedback

### Phase 3 — Testing and Validation (Ongoing)
1. Unit Tests
   - Notification processor logic (type, payload, target selection)
2. Integration Tests
   - Simulate insert events and verify notification payload
3. Manual QA
   - iOS device validation
   - Multiple user test (leader change + broadcast)

---

## Data Model Updates
Update supabase schema/migrations:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs JSONB
DEFAULT '{"leader_change": true, "admin_broadcasts": true, "milestones": [5,10,20]}'::jsonb;
```

---

## Risks and Mitigations
1. Webhook delivery delays  
Mitigation: Retry logic + monitoring

2. Token drift or stale tokens  
Mitigation: Cleanup invalid tokens on push response

3. Expo push rate limits  
Mitigation: Batch sends, throttle

4. Auth mismatch  
Mitigation: Use userId mapping fallback in tokens

---

## Success Criteria
- 95%+ successful push delivery in test environment
- Leader-change push arrives under 5 seconds after event
- Users can opt out and receive zero notifications

---

## File Targets
- app/src/services/notifications.ts (token + preferences)
- app/src/services/notificationProcessor.ts (server logic)
- app/supabase/functions/notify_event/ (Edge Function)
- app/supabase/migrations/XXX_notification_prefs.sql
 - app/src/providers/AppProvider.tsx (new round enqueue)
 - app/src/hooks/useNotificationHandler.ts (vibration feedback)

---

## Estimated Timeline
- Week 1: Backend Edge Function + webhook setup
- Week 2: Client preferences + QA + validation
