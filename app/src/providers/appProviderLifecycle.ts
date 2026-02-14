import { supabase } from '@/services/supabase';
import { reportError } from '@/utils/logger';
import { clearStoredUser, readStoredUser } from '@/providers/appProviderUtils';
import type { User } from '@/services/supabase';

type BootstrapOptions = {
    setCurrentUserState: (user: User | null) => void;
    refreshUsers: () => Promise<void>;
    fetchActiveEvent: () => Promise<void>;
    setLoading: (loading: boolean) => void;
};

export const bootstrapAppProvider = async ({
    setCurrentUserState,
    refreshUsers,
    fetchActiveEvent,
    setLoading,
}: BootstrapOptions) => {
    try {
        const savedUser = await readStoredUser();
        if (savedUser) {
            try {
                setCurrentUserState(JSON.parse(savedUser));
            } catch (parseError) {
                reportError(parseError, { scope: 'app_provider', action: 'Invalid saved user payload' });
                await clearStoredUser();
            }
        }

        await Promise.all([
            refreshUsers(),
            fetchActiveEvent(),
        ]);
    } catch (e) {
        reportError(e, { scope: 'app_provider', action: 'Init error' });
    } finally {
        setLoading(false);
    }
};

export const subscribeUsersAndEvents = (
    refreshUsers: () => Promise<void>,
    fetchActiveEvent: () => Promise<void>
) => {
    const usersChannel = supabase
        .channel('app_users')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
            refreshUsers();
        })
        .subscribe();

    const eventsChannel = supabase
        .channel('app_events')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
            fetchActiveEvent();
        })
        .subscribe();

    return () => {
        supabase.removeChannel(usersChannel);
        supabase.removeChannel(eventsChannel);
    };
};

export const subscribeEventMemberships = (
    eventId: string,
    refreshEventMembers: () => Promise<void>,
    refreshEventAccess: () => Promise<void>
) => {
    const channel = supabase
        .channel(`event_memberships_${eventId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_memberships' }, () => {
            refreshEventMembers();
            refreshEventAccess();
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};
