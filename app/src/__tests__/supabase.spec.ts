import {
    supabase,
    getUsers,
    addBeer,
    removeBeer,
    getBeers,
    getBeerCountByUser,
    createBeerStamp,
    joinEvent,
    getPermissionsForRole,
    getEventGameStats,
    getEventLeaderState,
} from '../services/supabase';
import { checkAchievements } from '../services/achievements';

jest.mock('../services/achievements', () => ({
    checkAchievements: jest.fn(() => [])
}));

describe('Supabase Service Helpers', () => {
    const mockFrom = jest.spyOn(supabase, 'from');

    beforeEach(() => {
        jest.clearAllMocks();
        mockFrom.mockReset();
    });

    test('getUsers fetches and orders users', async () => {
        const mockData = [{ id: '1', name: 'Alice' }];
        const order = jest.fn().mockResolvedValue({ data: mockData, error: null });
        const select = jest.fn().mockReturnValue({ order });

        mockFrom.mockReturnValue({ select } as any);

        const result = await getUsers();
        expect(result).toEqual(mockData);
        expect(supabase.from).toHaveBeenCalledWith('users');
    });

    test('addBeer inserts a new beer record', async () => {
        const mockBeer = { id: 'beer1', user_id: 'u1' };
        const mockRecentBeers = [{ id: 'beer0', user_id: 'u1' }];
        const lifetimeCount = 3;

        const insert = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockBeer, error: null })
            })
        });

        const recentSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: mockRecentBeers, error: null })
                })
            })
        });

        const countSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: lifetimeCount, error: null })
        });

        const achievementsSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
        });

        mockFrom
            .mockReturnValueOnce({ insert } as any)
            .mockReturnValueOnce({ select: recentSelect } as any)
            .mockReturnValueOnce({ select: countSelect } as any)
            .mockReturnValueOnce({ select: achievementsSelect } as any);

        const result = await addBeer('u1', 'admin1', 'event1');
        expect(result).toEqual({ beer: mockBeer, newBadges: [] });
        expect(checkAchievements).toHaveBeenCalledWith(mockRecentBeers, mockBeer, lifetimeCount);
        expect(supabase.from).toHaveBeenCalledWith('beers');
    });

    test('addBeer requires event id', async () => {
        await expect(addBeer('u1', 'admin1', '' as any)).rejects.toThrow('eventId is required');
    });

    test('removeBeer deletes a record by id', async () => {
        const eq = jest.fn().mockResolvedValue({ error: null });
        const del = jest.fn().mockReturnValue({ eq });

        mockFrom.mockReturnValue({ delete: del } as any);

        await removeBeer('beer1');
        expect(supabase.from).toHaveBeenCalledWith('beers');
        expect(eq).toHaveBeenCalledWith('id', 'beer1');
    });

    test('getBeers filters by event id when provided', async () => {
        const eventRows = [{ id: 'b1', event_id: 'e1' }];
        const eq = jest.fn().mockResolvedValue({ data: eventRows, error: null });
        const order = jest.fn().mockReturnValue({ eq });
        const select = jest.fn().mockReturnValue({ order });

        mockFrom.mockReturnValue({ select } as any);

        const result = await getBeers('e1');
        expect(result).toEqual(eventRows);
        expect(eq).toHaveBeenCalledWith('event_id', 'e1');
    });

    test('createBeerStamp falls back to legacy mode when table is missing', async () => {
        const single = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST205' } });
        const select = jest.fn().mockReturnValue({ single });
        const insert = jest.fn().mockReturnValue({ select });
        mockFrom.mockReturnValue({ insert } as any);

        const result = await createBeerStamp('u1', 'e1', 'admin1');

        expect(result).toEqual({ stamp: null, fallbackLegacy: true });
        expect(supabase.from).toHaveBeenCalledWith('beer_stamps');
    });

    test('getBeerCountByUser returns zero counts when beers table is missing', async () => {
        const users = [{ id: 'u1', name: 'Alice', is_admin: false }];
        const usersSelect = jest.fn().mockResolvedValue({ data: users, error: null });
        const beersEq = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST205' } });
        const beersSelect = jest.fn().mockReturnValue({ eq: beersEq });

        mockFrom
            .mockReturnValueOnce({ select: usersSelect } as any)
            .mockReturnValueOnce({ select: beersSelect } as any);

        const result = await getBeerCountByUser('event1');
        expect(result).toEqual([{ userId: 'u1', name: 'Alice', count: 0, isAdmin: false }]);
        expect(beersEq).toHaveBeenCalledWith('event_id', 'event1');
    });

    test('joinEvent falls back gracefully when event_memberships table is missing', async () => {
        const single = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST205' } });
        const select = jest.fn().mockReturnValue({ single });
        const upsert = jest.fn().mockReturnValue({ select });
        mockFrom.mockReturnValue({ upsert } as any);

        const result = await joinEvent('event1', 'user1', 'admin1');

        expect(result).toEqual({ ok: true, fallbackLegacy: true });
        expect(supabase.from).toHaveBeenCalledWith('event_memberships');
    });

    test('getPermissionsForRole keeps admin rights even with restrictive event role', () => {
        const perms = getPermissionsForRole('member', true);

        expect(perms.canManageEvent).toBe(true);
        expect(perms.canManageMembers).toBe(true);
        expect(perms.canManageLogs).toBe(true);
        expect(perms.canInvite).toBe(true);
    });

    test('getEventGameStats returns missingTable when table is unavailable', async () => {
        const orderFinal = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST205' } });
        const order = jest.fn().mockReturnValue({ order: orderFinal });
        const eq = jest.fn().mockReturnValue({ order });
        const select = jest.fn().mockReturnValue({ eq });

        mockFrom.mockReturnValue({ select } as any);

        const result = await getEventGameStats('event-1');
        expect(result.missingTable).toBe(true);
        expect(result.stats).toEqual([]);
        expect(supabase.from).toHaveBeenCalledWith('event_game_stats');
    });

    test('getEventLeaderState returns missingTable when table is unavailable', async () => {
        const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST205' } });
        const eq = jest.fn().mockReturnValue({ maybeSingle });
        const select = jest.fn().mockReturnValue({ eq });

        mockFrom.mockReturnValue({ select } as any);

        const result = await getEventLeaderState('event-1');
        expect(result.missingTable).toBe(true);
        expect(result.leader).toBeNull();
        expect(supabase.from).toHaveBeenCalledWith('event_leader_state');
    });
});
