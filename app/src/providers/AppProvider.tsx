import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    supabase,
    User,
    Event,
    EventRole,
    EventPermissions,
    EventMembership,
    getUsers,
    getPermissionsForRole,
    getEventMembership,
    getEventMembers,
    isMissingTableError,
    createLeaderEventSnapshot,
} from '@/services/supabase';
import { reportError } from '@/utils/logger';
import { assertSupabaseConfigured } from '@/utils/preflight';
import { useNotifications } from '@/hooks/useNotifications';
import { useOfflineMutations, OfflineMutation } from '@/hooks/useOfflineMutations';
import { useOfflineQueueProcessor } from '@/hooks/useOfflineQueueProcessor';
import { enqueueNewRoundNotifications } from '@/services/notifications';
import {
    buildLocalEvent,
    getPassExpiresAt,
    persistStoredUser,
} from '@/providers/appProviderUtils';
import {
    bootstrapAppProvider,
    subscribeEventMemberships,
    subscribeUsersAndEvents,
} from '@/providers/appProviderLifecycle';

interface AppContextType {
    currentUser: User | null;
    isAdmin: boolean;
    setCurrentUser: (user: User | null) => void;
    users: User[];
    refreshUsers: () => Promise<void>;
    loading: boolean;
    activeEvent: Event | null;
    startEvent: (name: string, passType: Event['pass_type'], beerPrice?: number) => Promise<void>;
    closeEvent: () => Promise<void>;
    showRecap: boolean;
    setShowRecap: (show: boolean) => void;
    // Whether the remote Supabase schema is available
    remoteAvailable: boolean;
    supabaseConfigured: boolean;
    currentEventRole: EventRole | null;
    eventPermissions: EventPermissions;
    eventMembers: EventMembership[];
    refreshEventMembers: () => Promise<void>;
    offlineQueue: OfflineMutation[];
    addOfflineMutation: (mutation: Omit<OfflineMutation, 'id' | 'timestamp'>) => Promise<void>;
    offlineQueueProcessing: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUserState] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [activeEvent, setActiveEvent] = useState<Event | null>(null);
    const [showRecap, setShowRecap] = useState(false);
    const [loading, setLoading] = useState(true);
    const [remoteAvailable, setRemoteAvailable] = useState(true);
    const [supabaseConfigured, setSupabaseConfigured] = useState(true);
    const [currentEventRole, setCurrentEventRole] = useState<EventRole | null>(null);
    const [eventPermissions, setEventPermissions] = useState<EventPermissions>(getPermissionsForRole(null, false));
    const [eventMembers, setEventMembers] = useState<EventMembership[]>([]);
    const offlineMutations = useOfflineMutations();

    useOfflineQueueProcessor(offlineMutations);

    // Register device for push notifications when user is set
    useNotifications(currentUser?.id || null);

    const setCurrentUser = useCallback(async (user: User | null) => {
        try {
            setCurrentUserState(user);
            await persistStoredUser(user);
        } catch (e) {
            reportError(e, { scope: 'app_provider', action: 'Failed to save user' });
        }
    }, []);

    const refreshUsers = useCallback(async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (e) {
            reportError(e, { scope: 'app_provider', action: 'Failed to refresh users' });
        }
    }, []);

    const refreshEventMembers = useCallback(async () => {
        if (!activeEvent?.id) {
            setEventMembers([]);
            return;
        }
        try {
            const members = await getEventMembers(activeEvent.id);
            setEventMembers(members);
        } catch (e) {
            reportError(e, { scope: 'app_provider', action: 'Failed to refresh event members' });
        }
    }, [activeEvent?.id]);

    const refreshEventAccess = useCallback(async () => {
        if (!currentUser) {
            setCurrentEventRole(null);
            setEventPermissions(getPermissionsForRole(null, false));
            return;
        }
        if (!activeEvent?.id) {
            setCurrentEventRole(null);
            setEventPermissions(getPermissionsForRole(null, !!currentUser.is_admin));
            return;
        }

        try {
            const lookup = await getEventMembership(activeEvent.id, currentUser.id);
            if (lookup.missingTable) {
                setCurrentEventRole(null);
                setEventPermissions(getPermissionsForRole(null, !!currentUser.is_admin));
                return;
            }
            const role = lookup.membership?.role || null;
            setCurrentEventRole(role);
            setEventPermissions(getPermissionsForRole(role, !!currentUser.is_admin));
        } catch (e) {
            reportError(e, { scope: 'app_provider', action: 'Failed to resolve event access' });
            setCurrentEventRole(null);
            setEventPermissions(getPermissionsForRole(null, !!currentUser.is_admin));
        }
    }, [currentUser, activeEvent?.id]);

    const fetchActiveEvent = useCallback(async () => {
        try {
            const from = (supabase as any).from && (supabase as any).from('events');
            if (!from || typeof from.select !== 'function') {
                // noop client or incompatible client — provide local fallback without hard error
                setActiveEvent(buildLocalEvent());
                setRemoteAvailable(false);
                return;
            }

            const { data, error } = await from
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            setActiveEvent(data as unknown as Event);
            setRemoteAvailable(true);
        } catch (e) {
            // If the error indicates missing tables in Supabase schema, set a local fallback
            const err: any = e;
            if (err?.code === 'PGRST205') {
                console.log('[AppProvider] Supabase schema missing: events table not found — using local fallback event (expected)');
                // create a lightweight local active event so the UI can operate in offline mode
                setActiveEvent(buildLocalEvent());
                setRemoteAvailable(false);
            } else {
                reportError(e, { scope: 'app_provider', action: 'Failed to fetch active event' });
                setRemoteAvailable(false);
                setActiveEvent(null);
            }
        }
    }, []);

    const startEvent = useCallback(async (name: string, passType: Event['pass_type'], beerPrice?: number) => {
        if (!currentUser) {
            throw new Error('No current user selected');
        }
        const allowed = getPermissionsForRole(currentEventRole, !!currentUser.is_admin).canManageEvent;
        if (!allowed) {
            throw new Error('Only admins can start a round');
        }

        try {
            let resolvedPassType: Event['pass_type'] = passType;
            if (passType !== 'free') {
                try {
                    const { count, error: countError } = await (supabase.from('events') as any)
                        .select('*', { count: 'exact', head: true });
                    if (countError) {
                        if (!isMissingTableError(countError)) {
                            throw countError;
                        }
                    } else if ((count as number) === 0) {
                        resolvedPassType = 'free';
                    }
                } catch (countErr) {
                    reportError(countErr as Error, { scope: 'app_provider', action: 'resolve_pass_type' });
                }
            }

            const { data, error } = await (supabase.from('events') as any)
                .insert({
                    name,
                    created_by: currentUser.id,
                    is_active: true,
                    pass_type: resolvedPassType,
                    beer_price: beerPrice ?? 5.00,
                    expires_at: getPassExpiresAt(resolvedPassType)
                })
                .select()
                .single();

            if (error) throw error;
            setActiveEvent(data);
            enqueueNewRoundNotifications(data.id, data.name, currentUser.id).catch(() => null);
        } catch (e) {
            reportError(e, { scope: 'app_provider', action: 'Failed to start event' });
            throw e;
        }
    }, [currentUser, currentEventRole]);

    const closeEvent = useCallback(async () => {
        if (!activeEvent) return;
        if (!eventPermissions.canCloseEvent) {
            reportError(new Error('Not authorized to close event'), { scope: 'app_provider', action: 'Failed to close event' });
            return;
        }

        try {
            const { data: counts, error: countError } = await supabase
                .from('users')
                .select(`
                    id,
                    name,
                    beers:beers!user_id(count)
                `)
                .filter('beers.event_id', 'eq', activeEvent.id);

            if (!countError && counts && counts.length > 0) {
                const winner: any = (counts as any[]).reduce((prev: any, current: any) => {
                    const prevCount = prev.beers[0]?.count || 0;
                    const currentCount = current.beers[0]?.count || 0;
                    return (currentCount > prevCount) ? current : prev;
                }, counts[0]);

                const winnerCount = winner.beers[0]?.count || 0;
                if (winnerCount > 0) {
                    await (supabase
                        .from('wall_of_fame') as any)
                        .insert({
                            event_id: activeEvent.id,
                            winner_id: winner.id,
                            total_stängeli: winnerCount
                        });
                }
            }

            try {
                await createLeaderEventSnapshot(activeEvent.id);
            } catch (snapshotError) {
                reportError(snapshotError as Error, { scope: 'app_provider', action: 'leader_snapshot' });
            }

            const { error } = await (supabase
                .from('events') as any)
                .update({ is_active: false } as Partial<Event>)
                .eq('id', activeEvent.id);

            if (error) throw error;
            setShowRecap(true);
            setActiveEvent(null);
        } catch (e) {
            reportError(e, { scope: 'app_provider', action: 'Failed to close event' });
        }
    }, [activeEvent, eventPermissions.canCloseEvent]);

    useEffect(() => {
        let configured = false;
        try {
            configured = assertSupabaseConfigured();
        } catch (e) {
            reportError(e, { scope: 'app_provider', action: 'supabase_config' });
        }
        setSupabaseConfigured(configured);
        void bootstrapAppProvider({
            setCurrentUserState,
            refreshUsers,
            fetchActiveEvent,
            setLoading,
        });

        return subscribeUsersAndEvents(refreshUsers, fetchActiveEvent);
    }, [refreshUsers, fetchActiveEvent]);

    useEffect(() => {
        refreshEventAccess();
        refreshEventMembers();
    }, [refreshEventAccess, refreshEventMembers]);

    useEffect(() => {
        if (!activeEvent?.id) return;
        return subscribeEventMemberships(activeEvent.id, refreshEventMembers, refreshEventAccess);
    }, [activeEvent?.id, refreshEventMembers, refreshEventAccess]);

    const value = React.useMemo(() => ({
        currentUser,
        isAdmin: currentUser?.is_admin || false,
        setCurrentUser,
        users,
        refreshUsers,
        loading,
        activeEvent,
        startEvent,
        closeEvent,
        showRecap,
        setShowRecap,
        remoteAvailable,
        supabaseConfigured,
        currentEventRole,
        eventPermissions,
        eventMembers,
        refreshEventMembers,
        offlineQueue: offlineMutations.queue,
        addOfflineMutation: offlineMutations.addToQueue,
        offlineQueueProcessing: offlineMutations.isProcessing,
    }), [
        currentUser,
        setCurrentUser,
        users,
        refreshUsers,
        loading,
        activeEvent,
        startEvent,
        closeEvent,
        showRecap,
        setShowRecap,
        remoteAvailable,
        supabaseConfigured,
        currentEventRole,
        eventPermissions,
        eventMembers,
        refreshEventMembers,
        offlineMutations.queue,
        offlineMutations.addToQueue,
        offlineMutations.isProcessing,
    ]);

    return React.createElement(AppContext.Provider, { value },
        children
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}
