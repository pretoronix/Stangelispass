export type FetchLike = (input: string, init?: any) => Promise<{ ok: boolean; status: number; json: () => Promise<any>; text: () => Promise<string>; }>;

type NotificationType = 'leader_change' | 'milestone';

const DEFAULT_PREFS = {
  leader_change: true,
  milestones: [5, 10, 20],
};

const normalizePrefs = (raw: any): { leader_change: boolean; milestones: number[] } => {
  if (!raw || typeof raw !== 'object') return DEFAULT_PREFS;
  const leader_change = typeof raw.leader_change === 'boolean' ? raw.leader_change : DEFAULT_PREFS.leader_change;
  const milestones: number[] = Array.isArray(raw.milestones)
    ? raw.milestones.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n) && n > 0)
    : [...DEFAULT_PREFS.milestones];
  return { leader_change, milestones: [...new Set<number>(milestones)].sort((a, b) => a - b) };
};

const notificationTypeOf = (n: any): NotificationType => {
  const t = n?.payload?.type;
  return t === 'milestone' ? 'milestone' : 'leader_change';
};

const recipientOf = (n: any, notificationType: NotificationType) => {
  if (notificationType === 'milestone') {
    return n?.target_user || n?.payload?.user_id || n?.payload?.target_user_id || null;
  }
  return n?.target_user || n?.new_leader || n?.payload?.new || n?.payload?.new_leader || null;
};

const buildPushMessage = (n: any, notificationType: NotificationType) => {
  const eventId = n?.event_id;
  if (notificationType === 'milestone') {
    const milestone = Number(n?.payload?.milestone || 0);
    return {
      title: `Milestone: ${milestone} beers`,
      body: `You reached ${milestone} beers in the current round.`,
      data: { type: 'milestone', event_id: eventId, milestone },
    };
  }
  return {
    title: 'Lead change',
    body: `You are currently leading event ${eventId}.`,
    data: { type: 'leader_change', event_id: eventId },
  };
};

export async function processNotificationsBatch(opts: {
  fetchFn: FetchLike;
  supabaseUrl: string;
  serviceKey: string;
  expoEndpoint?: string;
  limit?: number;
}) {
  const { fetchFn, supabaseUrl, serviceKey, expoEndpoint = 'https://exp.host/--/api/v2/push/send', limit = 20 } = opts;
  const authHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  // Helper to perform REST fetch with auth
  const restFetch = (path: string, init?: any) => {
    const url = `${supabaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    const headers = { ...(init?.headers || {}), ...authHeaders };
    return fetchFn(url, { ...init, headers });
  };

  const notifyRes = await restFetch(`rest/v1/notifications?processed=eq.false&order=created_at.asc&limit=${limit}`);
  if (!notifyRes.ok) {
    const txt = await notifyRes.text();
    throw new Error(`Failed to fetch notifications: ${notifyRes.status} - ${txt}`);
  }
  const notifications = await notifyRes.json();
  if (!Array.isArray(notifications)) throw new Error('Unexpected notifications response');

  const results: any[] = [];

  for (const n of notifications) {
    const id = n.id;
    const notificationType = notificationTypeOf(n);
    const recipientUserId = recipientOf(n, notificationType);

    const markProcessed = async (extraBody: Record<string, any> = {}) => {
      await restFetch(`rest/v1/notifications?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processed: true,
          processed_at: new Date().toISOString(),
          attempts: (n.attempts || 0) + 1,
          ...extraBody,
        }),
      }).catch(() => null);
    };

    if (!recipientUserId) {
      await markProcessed();
      results.push({ id, success: false, reason: 'missing recipient' });
      continue;
    }

    // Resolve user preferences (fallback to defaults if unavailable)
    let prefs = DEFAULT_PREFS;
    const prefsRes = await restFetch(`rest/v1/users?id=eq.${encodeURIComponent(recipientUserId)}&select=notification_prefs&limit=1`);
    if (prefsRes.ok) {
      const prefsBody = await prefsRes.json().catch(() => []);
      const row = Array.isArray(prefsBody) ? prefsBody[0] : null;
      prefs = normalizePrefs(row?.notification_prefs);
    }

    const enabled = notificationType === 'leader_change'
      ? prefs.leader_change
      : prefs.milestones.includes(Number(n?.payload?.milestone || 0));

    if (!enabled) {
      await markProcessed();
      results.push({ id, success: true, reason: 'disabled by preference' });
      continue;
    }

    // Fetch tokens
    const tokensRes = await restFetch(`rest/v1/device_tokens?user_id=eq.${encodeURIComponent(recipientUserId)}&select=token`);
    if (!tokensRes.ok) {
      // update attempts
      await restFetch(`rest/v1/notifications?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempts: (n.attempts || 0) + 1 }),
      }).catch(() => null);
      results.push({ id, success: false, reason: 'failed to fetch tokens' });
      continue;
    }

    const tokensBody = await tokensRes.json();
    const pushTokens = Array.isArray(tokensBody) ? tokensBody.map((t: any) => t.token).filter(Boolean) : [];

    if (pushTokens.length === 0) {
      // Mark as processed (nothing to send)
      await markProcessed();
      results.push({ id, success: true, reason: 'no tokens' });
      continue;
    }

    const message = buildPushMessage(n, notificationType);

    // Send notifications
    const sendPromises = pushTokens.map((token: string) => {
      const payload = {
        to: token,
        title: message.title,
        body: message.body,
        data: message.data,
      };
      return fetchFn(expoEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json().catch(() => null)).catch(() => null);
    });

    const sendResults = await Promise.all(sendPromises);
    const failedSends = sendResults.filter((r: any) => !r || r.error || r.errors);
    const sendSuccess = failedSends.length === 0;

    // Mark notification processed and record attempts
    await markProcessed();

    results.push({
      id,
      success: sendSuccess,
      reason: sendSuccess ? undefined : 'send failures',
      sendResults,
      failedCount: failedSends.length,
    });
  }

  return { processed: notifications.length, results };
}
