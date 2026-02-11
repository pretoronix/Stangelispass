Notify Lead Change

This is a Supabase Edge Function intended to run on the Supabase Functions platform.

What it does:
- Receives a webhook POST from the database (e.g., on INSERT to `beers`).
- Uses the Supabase service role key to query beers for the affected event and compute the current leader.
- If the leader changed, updates `events.current_leader` and sends push notifications via Expo Push API to relevant device tokens.

Environment variables required when deploying to Supabase Functions:
- SUPABASE_URL - your Supabase project URL
- SUPABASE_SERVICE_ROLE_KEY - service role key for server-side queries
- EXPO_PUSH_ENDPOINT (optional) - defaults to https://exp.host/--/api/v2/push/send

Deploy:
- Place this code in a Supabase Function and configure environment variables in the Supabase dashboard.
- Create a database trigger or webhook that POSTs the inserted `beers` row to this function's URL.
