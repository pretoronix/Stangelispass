// Supabase Edge Function to process notifications queue
// Deno runtime — delegate to the shared processor in `src` for maintainability.

import { processNotificationsBatch } from '../../../src/services/notificationProcessor';

export default async function handler(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = Number(body?.limit) || 20;

    const SUPABASE_URL = (globalThis as any).Deno?.env?.get('SUPABASE_URL') || (globalThis as any).Deno?.env?.get('NEXT_PUBLIC_SUPABASE_URL') || process?.env?.SUPABASE_URL || process?.env?.NEXT_PUBLIC_SUPABASE_URL || '';
    const SERVICE_KEY = (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') || (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_KEY') || process?.env?.SUPABASE_SERVICE_ROLE_KEY || process?.env?.SUPABASE_SERVICE_KEY || '';
    const EXPO_PUSH_ENDPOINT = (globalThis as any).Deno?.env?.get('EXPO_PUSH_ENDPOINT') || process?.env?.EXPO_PUSH_ENDPOINT || 'https://exp.host/--/api/v2/push/send';

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const result = await processNotificationsBatch({
      fetchFn: fetch as any,
      supabaseUrl: SUPABASE_URL,
      serviceKey: SERVICE_KEY,
      expoEndpoint: EXPO_PUSH_ENDPOINT,
      limit,
    });

    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
