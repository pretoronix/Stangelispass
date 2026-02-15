import { addUser, getUsers, normalizeNotificationPrefs, updateUser } from '@/services/users';

jest.mock('@/services/client', () => {
  const chain: any = {};

  chain.select = jest.fn((...args: any[]) => {
    // Count/head pre-check: terminal promise
    if (args?.[1]?.count === 'exact' && args?.[1]?.head === true) {
      return Promise.resolve({ count: 0, error: null });
    }
    return chain;
  });

  chain.order = jest.fn(async () => ({ data: [{ id: 'u1', name: 'Alice', is_admin: true }], error: null }));
  chain.insert = jest.fn(() => chain);
  chain.update = jest.fn(() => chain);
  chain.eq = jest.fn(() => chain);
  chain.single = jest.fn(async () => ({ data: { id: 'u2', name: 'Bob', is_admin: true }, error: null }));

  return {
    supabase: {
      from: jest.fn(() => chain),
    },
    __chain: chain,
  };
});

describe('services/users', () => {
  test('getUsers returns rows', async () => {
    const users = await getUsers();
    expect(users.length).toBe(1);
    expect(users[0]?.name).toBe('Alice');
  });

  test('getUsers returns empty list on missing table', async () => {
    const client: any = require('@/services/client');
    client.__chain.order.mockResolvedValueOnce({ data: null, error: { code: 'PGRST205' } });

    const users = await getUsers();
    expect(users).toEqual([]);
  });

  test('addUser promotes first user to admin', async () => {
    const user = await addUser('Bob', false);
    expect(user?.name).toBe('Bob');
    expect(user?.is_admin).toBe(true);
  });

  test('addUser returns null on missing table', async () => {
    const client: any = require('@/services/client');
    client.__chain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST205' } });

    const user = await addUser('Bob', false);
    expect(user).toBe(null);
  });

  test('updateUser returns updated row', async () => {
    const user = await updateUser('u2', { name: 'Bobby' } as any);
    expect(user?.id).toBe('u2');
  });

  test('updateUser returns null on missing table', async () => {
    const client: any = require('@/services/client');
    client.__chain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST205' } });

    const user = await updateUser('u2', { name: 'Bobby' } as any);
    expect(user).toBe(null);
  });

  test('normalizeNotificationPrefs includes new_round and defaults', () => {
    const prefs = normalizeNotificationPrefs({ leader_change: false, milestones: [10], admin_broadcasts: false, new_round: false });
    expect(prefs.leader_change).toBe(false);
    expect(prefs.admin_broadcasts).toBe(false);
    expect(prefs.new_round).toBe(false);
    expect(prefs.milestones).toEqual([10]);

    const defaults = normalizeNotificationPrefs(null);
    expect(defaults.leader_change).toBe(true);
    expect(defaults.admin_broadcasts).toBe(true);
    expect(defaults.new_round).toBe(true);
    expect(defaults.milestones.length).toBeGreaterThan(0);
  });
});
