Process Notifications Function

This Supabase Edge Function processes rows in `public.notifications` where `processed = false`.
It will:
- Fetch a batch of unprocessed notifications
- For each notification, fetch device tokens for the `new_leader` and send Expo Push notifications
- Mark the notification as processed and record `processed_at` and increment `attempts`

Environment variables required:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- EXPO_PUSH_ENDPOINT (optional — defaults to https://exp.host/--/api/v2/push/send)

Invoke via HTTP POST with optional JSON body: { "limit": 20 }
