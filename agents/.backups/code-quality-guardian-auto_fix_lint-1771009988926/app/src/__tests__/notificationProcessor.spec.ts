import { processNotificationsBatch } from '@/services/notificationProcessor';

describe('processNotificationsBatch', () => {
  test('no notifications -> processed 0', async () => {
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (url.includes('/rest/v1/notifications')) {
        return { ok: true, status: 200, json: async (): Promise<any> => [], text: async (): Promise<string> => '[]' };
      }
      return { ok: false, status: 404, json: async (): Promise<any> => null, text: async (): Promise<string> => 'not found' };
    });

    const res = await processNotificationsBatch({ fetchFn, supabaseUrl: 'https://supabase.test', serviceKey: 'key' });
    expect(res.processed).toBe(0);
    expect(res.results).toEqual([]);
  });

  test('tokens fetch failure -> attempts incremented', async () => {
    const notif = [{ id: 'n1', new_leader: 'u1', event_id: 'e1', attempts: 0 }];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (url.includes('/rest/v1/notifications')) {
        // First call: fetch notifications
        if (url.includes('processed=eq.false')) return { ok: true, status: 200, json: async (): Promise<any> => notif, text: async (): Promise<string> => JSON.stringify(notif) };
        // PATCH calls should be accepted
        if (init?.method === 'PATCH') return { ok: true, status: 200, json: async (): Promise<any> => ({}), text: async (): Promise<string> => '{}' };
      }
      if (url.includes('/rest/v1/device_tokens')) {
        return { ok: false, status: 500, json: async (): Promise<any> => null, text: async (): Promise<string> => 'db error' };
      }
      return { ok: false, status: 404, json: async (): Promise<any> => null, text: async (): Promise<string> => 'not found' };
    });

    const res = await processNotificationsBatch({ fetchFn, supabaseUrl: 'https://supabase.test', serviceKey: 'key' });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(false);
    expect(res.results[0].reason).toBe('failed to fetch tokens');

    // Ensure a PATCH to notifications was called (third call)
    const patchCall = calls.find(c => c.init && c.init.method === 'PATCH' && c.url.includes('/rest/v1/notifications?id=eq.n1'));
    expect(patchCall).toBeTruthy();
  });

  test('no tokens -> mark processed', async () => {
    const notif = [{ id: 'n2', new_leader: 'u2', event_id: 'e2', attempts: 0 }];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (url.includes('/rest/v1/notifications') && url.includes('processed=eq.false')) {
        return { ok: true, status: 200, json: async (): Promise<any> => notif, text: async (): Promise<string> => JSON.stringify(notif) };
      }
      if (url.includes('/rest/v1/device_tokens')) {
        return { ok: true, status: 200, json: async (): Promise<any> => [], text: async (): Promise<string> => '[]' };
      }
      if (init?.method === 'PATCH' && url.includes('/rest/v1/notifications?id=eq.n2')) {
        return { ok: true, status: 200, json: async (): Promise<any> => ({ processed: true }), text: async (): Promise<string> => '{}' };
      }
      return { ok: false, status: 404, json: async (): Promise<any> => null, text: async (): Promise<string> => 'not found' };
    });

    const res = await processNotificationsBatch({ fetchFn, supabaseUrl: 'https://supabase.test', serviceKey: 'key' });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(true);
    expect(res.results[0].reason).toBe('no tokens');

    const patchCall = calls.find(c => c.init && c.init.method === 'PATCH' && c.url.includes('/rest/v1/notifications?id=eq.n2'));
    expect(patchCall).toBeTruthy();
  });

  test('milestone disabled by user preference -> skip send and mark processed', async () => {
    const notif = [{
      id: 'n4',
      event_id: 'e4',
      target_user: 'u4',
      payload: { type: 'milestone', milestone: 10, user_id: 'u4' },
      attempts: 0,
    }];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (url.includes('/rest/v1/notifications') && url.includes('processed=eq.false')) {
        return { ok: true, status: 200, json: async (): Promise<any> => notif, text: async (): Promise<string> => JSON.stringify(notif) };
      }
      if (url.includes('/rest/v1/users?id=eq.u4')) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => [{ notification_prefs: { leader_change: true, milestones: [5] } }],
          text: async (): Promise<string> => '[]',
        };
      }
      if (init?.method === 'PATCH' && url.includes('/rest/v1/notifications?id=eq.n4')) {
        return { ok: true, status: 200, json: async (): Promise<any> => ({ processed: true }), text: async (): Promise<string> => '{}' };
      }
      return { ok: false, status: 404, json: async (): Promise<any> => null, text: async (): Promise<string> => 'not found' };
    });

    const res = await processNotificationsBatch({ fetchFn, supabaseUrl: 'https://supabase.test', serviceKey: 'key' });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(true);
    expect(res.results[0].reason).toBe('disabled by preference');
    expect(calls.some(c => c.url.includes('/rest/v1/device_tokens'))).toBe(false);
  });

  test('sends pushes and marks processed', async () => {
    const notif = [{ id: 'n3', new_leader: 'u3', event_id: 'e3', attempts: 0 }];
    const tokens = [{ token: 't1' }, { token: 't2' }];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (url.includes('/rest/v1/notifications') && url.includes('processed=eq.false')) {
        return { ok: true, status: 200, json: async (): Promise<any> => notif, text: async (): Promise<string> => JSON.stringify(notif) };
      }
      if (url.includes('/rest/v1/device_tokens')) {
        return { ok: true, status: 200, json: async (): Promise<any> => tokens, text: async (): Promise<string> => JSON.stringify(tokens) };
      }
      if (url.includes('exp.host')) {
        return { ok: true, status: 200, json: async (): Promise<any> => ({ data: 'ok' }), text: async (): Promise<string> => '{}' };
      }
      if (init?.method === 'PATCH' && url.includes('/rest/v1/notifications?id=eq.n3')) {
        return { ok: true, status: 200, json: async (): Promise<any> => ({ processed: true }), text: async (): Promise<string> => '{}' };
      }
      return { ok: false, status: 404, json: async (): Promise<any> => null, text: async (): Promise<string> => 'not found' };
    });

    const res = await processNotificationsBatch({ fetchFn, supabaseUrl: 'https://supabase.test', serviceKey: 'key' });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(true);
    expect(Array.isArray(res.results[0].sendResults)).toBe(true);
    // ensure two pushes were sent
    const pushCalls = calls.filter(c => c.url.includes('exp.host'));
    expect(pushCalls.length).toBe(2);

    const patchCall = calls.find(c => c.init && c.init.method === 'PATCH' && c.url.includes('/rest/v1/notifications?id=eq.n3'));
    expect(patchCall).toBeTruthy();
  });
});
