import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Alert } from 'react-native';
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
} from '@/services/supabase';
import { logExpected, reportError } from '@/utils/logger';
import { assertSupabaseConfigured } from '@/utils/preflight';
import { useNotifications } from '@/hooks/useNotifications';
import { useOfflineMutations, OfflineMutation } from '@/hooks/useOfflineMutations';
import { useOfflineQueueProcessor } from '@/hooks/useOfflineQueueProcessor';
import { enqueueNewRoundNotifications } from '@/services/notifications';
import { buildLocalEvent, persistStoredUser } from '@/providers/appProviderUtils';
import {
    bootstrapAppProvider,
    subscribeEventMemberships,
    subscribeUsersAndEvents,
} from '@/providers/appProviderLifecycle';
import { closeEventInSupabase, startEventInSupabase } from '@/providers/appProviderActions';

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
let loggedContextError = false;

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
    const configAlertShown = useRef(false);

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
                logExpected('Supabase schema missing: events table not found — using local fallback event', 'AppProvider');
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
            const data = await startEventInSupabase({
                name,
                userId: currentUser.id,
                passType,
                beerPrice,
            });
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
            await closeEventInSupabase(activeEvent);
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

        if (!configured) {
            setRemoteAvailable(false);
            setActiveEvent(buildLocalEvent());
            if (!configAlertShown.current) {
                configAlertShown.current = true;
                Alert.alert(
                    'Configuration Required',
                    'Supabase is not configured. The app will run in offline mode with limited features.'
                );
            }
        } else {
            // Lightweight health check: if the schema is missing or the API is blocked, degrade gracefully.
            void (async () => {
                try {
                    const { error } = await (supabase as any)
                        .from('users')
                        .select('id', { head: true, count: 'exact' });
                    if (error) throw error;
                } catch (e) {
                    reportError(e, { scope: 'app_provider', action: 'db_health_check' });
                    setRemoteAvailable(false);
                    setActiveEvent(buildLocalEvent());
                }
            })();
        }

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
        if (!loggedContextError) {
            loggedContextError = true;
            reportError(new Error('Context Access Violation'), {
                scope: 'infrastructure',
                action: 'useApp_outside_provider',
            });
        }
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}
