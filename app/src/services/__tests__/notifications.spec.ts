/* eslint-disable @typescript-eslint/no-var-requires */
import type { Mock } from 'jest-mock';

// Helpers to load the module with per-test mocks.
const loadModule = async (opts: {
  platformOS: 'web' | 'ios' | 'android';
  isDevice: boolean;
  permissions?: { existing: string; requested: string };
  token?: string | null;
  upsertError?: any;
  membershipRole?: 'owner' | 'admin' | 'member' | null;
  senderName?: string | null;
  members?: Array<{ user_id: string }>;
  users?: Array<{ id: string; notification_prefs?: any }>;
  insertError?: any;
}) => {
  jest.resetModules();

  jest.doMock('react-native', () => {
    const actual = jest.requireActual('react-native');
    return {
      ...actual,
      Platform: { ...actual.Platform, OS: opts.platformOS },
    };
  });

  jest.doMock('expo-device', () => ({ isDevice: opts.isDevice }));

  jest.doMock('expo-notifications', () => ({
    getPermissionsAsync: jest.fn(async () => ({ status: opts.permissions?.existing ?? 'granted' })),
    requestPermissionsAsync: jest.fn(async () => ({ status: opts.permissions?.requested ?? 'granted' })),
    getExpoPushTokenAsync: jest.fn(async () => ({ data: opts.token ?? 'ExponentPushToken[test]' })),
  }));

  const fromCalls: Array<{ table: string; args?: any }> = [];

  const supabase = {
    from: jest.fn((table: string) => {
      fromCalls.push({ table });

      if (table === 'device_tokens') {
        return {
          upsert: jest.fn(() => ({
            select: jest.fn(async () => ({ error: opts.upsertError ?? null })),
          })),
          delete: jest.fn(() => ({
            match: jest.fn(async () => ({ error: null })),
          })),
        };
      }

      if (table === 'event_memberships') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn(async () => ({
            data: opts.membershipRole ? { role: opts.membershipRole } : null,
            error: null,
          })),
        };
      }

      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(async () => ({
            data: opts.senderName ? { name: opts.senderName } : null,
            error: null,
          })),
          in: jest.fn(async () => ({ data: opts.users ?? [], error: null })),
        };
      }

      if (table === 'notifications') {
        return {
          insert: jest.fn(async (payload: any) => {
            fromCalls.push({ table: 'notifications.insert', args: payload });
            return { error: opts.insertError ?? null };
          }),
        };
      }

      return {};
    }),
  };

  jest.doMock('../supabase', () => ({ supabase }));
  jest.doMock('../events', () => ({
    getEventMembers: jest.fn(async () => opts.members ?? []),
  }));

  const logger = require('@/utils/logger') as {
    reportError: Mock;
    logExpected: Mock;
  };

  // Import after mocks are in place.
  const mod = await import('../notifications');
  return { mod, supabase, fromCalls, logger };
};

describe('services/notifications', () => {
  it('registerForPushNotificationsAsync returns null on web and logs expected', async () => {
    const { mod, supabase, logger } = await loadModule({
      platformOS: 'web',
      isDevice: true,
    });

    const token = await mod.registerForPushNotificationsAsync('u1');
    expect(token).toBeNull();
    expect(logger.logExpected).toHaveBeenCalled();
    expect((supabase.from as Mock).mock.calls.length).toBe(0);
  });

  it('registerForPushNotificationsAsync returns null on simulator and logs expected', async () => {
    const { mod, supabase, logger } = await loadModule({
      platformOS: 'ios',
      isDevice: false,
    });

    const token = await mod.registerForPushNotificationsAsync('u1');
    expect(token).toBeNull();
    expect(logger.logExpected).toHaveBeenCalled();
    expect((supabase.from as Mock).mock.calls.length).toBe(0);
  });

  it('registerForPushNotificationsAsync reports error when permissions are denied', async () => {
    const { mod, logger } = await loadModule({
      platformOS: 'ios',
      isDevice: true,
      permissions: { existing: 'denied', requested: 'denied' },
    });

    const token = await mod.registerForPushNotificationsAsync('u1');
    expect(token).toBeNull();
    expect(logger.reportError).toHaveBeenCalled();
  });

  it('registerForPushNotificationsAsync returns token and upserts device_tokens', async () => {
    const { mod, supabase } = await loadModule({
      platformOS: 'ios',
      isDevice: true,
      permissions: { existing: 'granted', requested: 'granted' },
      token: 'ExponentPushToken[abc]',
    });

    const token = await mod.registerForPushNotificationsAsync('u1');
    expect(token).toBe('ExponentPushToken[abc]');
    expect((supabase.from as Mock).mock.calls.some(c => c[0] === 'device_tokens')).toBe(true);
  });

  it('registerForPushNotificationsAsync tolerates missing device_tokens table', async () => {
    const { mod, logger } = await loadModule({
      platformOS: 'ios',
      isDevice: true,
      token: 'ExponentPushToken[abc]',
      upsertError: { code: '42P01', message: 'missing table' },
    });

    const token = await mod.registerForPushNotificationsAsync('u1');
    expect(token).toBe('ExponentPushToken[abc]');
    expect(logger.logExpected).toHaveBeenCalled();
  });

  it('sendAdminBroadcast rejects empty message', async () => {
    const { mod } = await loadModule({
      platformOS: 'ios',
      isDevice: true,
    });

    const res = await mod.sendAdminBroadcast('evt1', '   ', 'u1');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/empty/i);
  });

  it('sendAdminBroadcast requires admin role', async () => {
    const { mod, logger } = await loadModule({
      platformOS: 'ios',
      isDevice: true,
      membershipRole: 'member',
    });

    const res = await mod.sendAdminBroadcast('evt1', 'Hello', 'u1');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/admins/i);
    expect(logger.reportError).toHaveBeenCalled();
  });

  it('sendAdminBroadcast enqueues notifications for opted-in members only', async () => {
    const { mod, fromCalls } = await loadModule({
      platformOS: 'ios',
      isDevice: true,
      membershipRole: 'admin',
      senderName: 'Alice',
      members: [{ user_id: 'u1' }, { user_id: 'u2' }, { user_id: 'u3' }],
      users: [
        { id: 'u2', notification_prefs: { admin_broadcasts: true } },
        { id: 'u3', notification_prefs: { admin_broadcasts: false } },
      ],
    });

    const res = await mod.sendAdminBroadcast('evt1', 'Hello', 'u1');
    expect(res.success).toBe(true);
    expect(res.count).toBe(1);

    const insertCall = fromCalls.find(c => c.table === 'notifications.insert');
    expect(insertCall).toBeTruthy();
    expect(insertCall?.args).toHaveLength(1);
    expect(insertCall?.args[0]).toMatchObject({
      event_id: 'evt1',
      target_user: 'u2',
    });
  });

  it('sendAdminBroadcast returns a friendly error when notifications table is missing', async () => {
    const { mod, logger } = await loadModule({
      platformOS: 'ios',
      isDevice: true,
      membershipRole: 'admin',
      senderName: 'Alice',
      members: [{ user_id: 'u1' }, { user_id: 'u2' }],
      users: [{ id: 'u2', notification_prefs: { admin_broadcasts: true } }],
      insertError: { code: 'PGRST205', message: 'missing table' },
    });

    const res = await mod.sendAdminBroadcast('evt1', 'Hello', 'u1');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/table/i);
    expect(logger.reportError).toHaveBeenCalled();
  });

  it('enqueueNewRoundNotifications enqueues for opted-in users excluding sender', async () => {
    const { mod, fromCalls } = await loadModule({
      platformOS: 'ios',
      isDevice: true,
      users: [
        { id: 'u1', notification_prefs: { admin_broadcasts: true } },
        { id: 'u2', notification_prefs: { admin_broadcasts: true } },
        { id: 'u3', notification_prefs: { admin_broadcasts: false } },
      ],
    });

    const res = await mod.enqueueNewRoundNotifications('evt1', 'Event Name', 'u1');
    expect(res.success).toBe(true);
    expect(res.count).toBe(1);

    const insertCall = fromCalls.find(c => c.table === 'notifications.insert');
    expect(insertCall?.args).toHaveLength(1);
    expect(insertCall?.args[0]).toMatchObject({ target_user: 'u2' });
  });
});

