// Supabase Edge Function (Deno) — Notify lead change via Expo Push
// Expects POST body with { event_id }

export default async function handler(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const event_id = body?.event_id ?? body?.id;
    if (!event_id) {
      return new Response(JSON.stringify({ error: 'event_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const getEnv = (k: string): string | undefined => {
      try {
        // Access Deno and process via globalThis to avoid direct `Deno` identifier errors
        return (globalThis as any).Deno?.env?.get?.(k) ?? (globalThis as any).process?.env?.[k];
      } catch {
        return undefined;
      }
    };

    const SUPABASE_URL = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL') || '';
    const SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_SERVICE_KEY') || '';
    const EXPO_PUSH_ENDPOINT = getEnv('EXPO_PUSH_ENDPOINT') || 'https://exp.host/--/api/v2/push/send';

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authHeaders = {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    };

    // Fetch beers for this event and compute counts per user
    const beersRes = await fetch(`${SUPABASE_URL}/rest/v1/beers?event=eq.${encodeURIComponent(event_id)}&select=user_id`, {
      headers: authHeaders,
    });
    if (!beersRes.ok) {
      const txt = await beersRes.text();
      return new Response(JSON.stringify({ error: 'Failed to fetch beers', status: beersRes.status, body: txt }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const beers = await beersRes.json();
    if (!Array.isArray(beers)) {
      return new Response(JSON.stringify({ error: 'Unexpected beers response' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const counts: Record<string, number> = {};
    for (const b of beers) {
      const uid = b?.user_id;
      if (!uid) continue;
      counts[uid] = (counts[uid] || 0) + 1;
    }

    let newLeader: string | null = null;
    let maxCount = 0;
    for (const [uid, cnt] of Object.entries(counts)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        newLeader = uid;
      }
    }

    // Fetch current leader from events
    const eventsRes = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${encodeURIComponent(event_id)}&select=current_leader`, {
      headers: authHeaders,
    });
    if (!eventsRes.ok) {
      const txt = await eventsRes.text();
      return new Response(JSON.stringify({ error: 'Failed to fetch event', status: eventsRes.status, body: txt }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const events = await eventsRes.json();
    const currentLeader = Array.isArray(events) && events.length > 0 ? events[0].current_leader ?? null : null;

    if (currentLeader === newLeader) {
      return new Response(JSON.stringify({ changed: false, currentLeader }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Update events.current_leader
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${encodeURIComponent(event_id)}`, {
      method: 'PATCH',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ current_leader: newLeader }),
    });

    if (!updateRes.ok) {
      const txt = await updateRes.text();
      return new Response(JSON.stringify({ error: 'Failed to update event leader', status: updateRes.status, body: txt }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If no leader (e.g., no beers), nothing to notify
    if (!newLeader) {
      return new Response(JSON.stringify({ changed: true, newLeader: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Fetch device tokens for the new leader
    const tokensRes = await fetch(`${SUPABASE_URL}/rest/v1/device_tokens?user_id=eq.${encodeURIComponent(newLeader)}&select=token`, {
      headers: authHeaders,
    });
    if (!tokensRes.ok) {
      const txt = await tokensRes.text();
      return new Response(JSON.stringify({ error: 'Failed to fetch device tokens', status: tokensRes.status, body: txt }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const tokens = await tokensRes.json();
    const pushTokens = Array.isArray(tokens) ? tokens.map((t: any) => t.token).filter(Boolean) : [];

    // Send notifications via Expo Push
    const sendPromises: Promise<any>[] = [];
    for (const token of pushTokens) {
      const payload = {
        to: token,
        title: "You're the leader!",
        body: `You're currently leading event ${event_id}. Cheers!`,
        data: { event_id },
      };

      sendPromises.push(
        fetch(EXPO_PUSH_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then((r) => r.json().catch(() => null)).catch(() => null),
      );
    }

    const results = await Promise.all(sendPromises);

    return new Response(JSON.stringify({ changed: true, newLeader, notifyResults: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
