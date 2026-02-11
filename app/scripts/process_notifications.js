#!/usr/bin/env node
// Local worker script for development to process notifications via REST API
// Usage: SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... node scripts/process_notifications.js

// Use global fetch when available (Node 18+) otherwise dynamically import node-fetch
const fetch = global.fetch
  ? (...args) => global.fetch(...args)
  : (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

(async ()=>{
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const EXPO_PUSH_ENDPOINT = process.env.EXPO_PUSH_ENDPOINT || 'https://exp.host/--/api/v2/push/send';

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const authHeaders = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    const notifyRes = await fetch(`${SUPABASE_URL}/rest/v1/notifications?processed=eq.false&order=created_at.asc&limit=20`, { headers: authHeaders });
    if (!notifyRes.ok) {
      console.error('Failed to fetch notifications', await notifyRes.text());
      process.exit(1);
    }
    const notifications = await notifyRes.json();
    for (const n of notifications) {
      const id = n.id;
      const newLeader = n.new_leader;
      const eventId = n.event_id;

      const tokensRes = await fetch(`${SUPABASE_URL}/rest/v1/device_tokens?user_id=eq.${encodeURIComponent(newLeader)}&select=token`, { headers: authHeaders });
      if (!tokensRes.ok) {
        console.error('Failed to fetch tokens for', newLeader, await tokensRes.text());
        await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ attempts: (n.attempts || 0) + 1 }) });
        continue;
      }
      const tokens = await tokensRes.json();
      const pushTokens = tokens.map(t => t.token).filter(Boolean);
      if (pushTokens.length === 0) {
        console.log('No tokens for', newLeader, 'marking processed');
        await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ processed: true, processed_at: new Date().toISOString(), attempts: (n.attempts || 0) + 1 }) });
        continue;
      }

      for (const token of pushTokens) {
        const payload = { to: token, title: "You're leading!", body: `You're currently leading event ${eventId}.`, data: { event_id: eventId } };
        const r = await fetch(EXPO_PUSH_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        console.log('sent to', token, 'status', r.status);
      }

      await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ processed: true, processed_at: new Date().toISOString(), attempts: (n.attempts || 0) + 1 }) });
    }

    console.log('Done');
  } catch (err) {
    console.error('Error processing notifications', err);
  }
})();
