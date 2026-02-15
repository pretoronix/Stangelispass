import { supabase } from '@/services/supabase';
import { bootstrapAppProvider, subscribeEventMemberships, subscribeUsersAndEvents } from '@/providers/appProviderLifecycle';
import { clearStoredUser, readStoredUser } from '@/providers/appProviderUtils';

jest.mock('@/providers/appProviderUtils', () => ({
    readStoredUser: jest.fn(),
    clearStoredUser: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
    reportError: jest.fn(),
}));

describe('appProviderLifecycle', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('bootstrapAppProvider restores user and refreshes data', async () => {
        (readStoredUser as jest.Mock).mockResolvedValue(JSON.stringify({ id: 'u1', name: 'Test' }));

        const setCurrentUserState = jest.fn();
        const refreshUsers = jest.fn().mockResolvedValue(undefined);
        const fetchActiveEvent = jest.fn().mockResolvedValue(undefined);
        const setLoading = jest.fn();

        await bootstrapAppProvider({
            setCurrentUserState,
            refreshUsers,
            fetchActiveEvent,
            setLoading,
        });

        expect(setCurrentUserState).toHaveBeenCalledWith({ id: 'u1', name: 'Test' });
        expect(refreshUsers).toHaveBeenCalled();
        expect(fetchActiveEvent).toHaveBeenCalled();
        expect(setLoading).toHaveBeenCalledWith(false);
    });

    test('bootstrapAppProvider clears invalid stored user payload', async () => {
        (readStoredUser as jest.Mock).mockResolvedValue('not-json');

        await bootstrapAppProvider({
            setCurrentUserState: jest.fn(),
            refreshUsers: jest.fn().mockResolvedValue(undefined),
            fetchActiveEvent: jest.fn().mockResolvedValue(undefined),
            setLoading: jest.fn(),
        });

        expect(clearStoredUser).toHaveBeenCalled();
    });

    test('subscribeUsersAndEvents cleans up channels', () => {
        const channelSpy = jest.spyOn(supabase, 'channel');
        const removeSpy = jest.spyOn(supabase, 'removeChannel').mockResolvedValue('ok' as any);

        channelSpy.mockImplementation((name: string) => ({
            on: () => ({
                subscribe: () => ({ channelName: name }),
            }),
        }) as any);

        const cleanup = subscribeUsersAndEvents(jest.fn(), jest.fn());
        cleanup();

        expect(channelSpy).toHaveBeenCalledWith('app_users');
        expect(channelSpy).toHaveBeenCalledWith('app_events');
        expect(removeSpy).toHaveBeenCalledTimes(2);
    });

    test('subscribeEventMemberships cleans up channel', () => {
        const channelSpy = jest.spyOn(supabase, 'channel');
        const removeSpy = jest.spyOn(supabase, 'removeChannel').mockResolvedValue('ok' as any);

        channelSpy.mockImplementation((name: string) => ({
            on: () => ({
                subscribe: () => ({ channelName: name }),
            }),
        }) as any);

        const cleanup = subscribeEventMemberships('event-1', jest.fn(), jest.fn());
        cleanup();

        expect(channelSpy).toHaveBeenCalledWith('event_memberships_event-1');
        expect(removeSpy).toHaveBeenCalledTimes(1);
    });
});
