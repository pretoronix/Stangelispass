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
} from '@/services/supabase';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { reportError } from '@/utils/logger';
import { assertSupabaseConfigured } from '@/utils/preflight';
import { useNotifications } from '@/hooks/useNotifications';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'stangelispass_current_user';

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

    // Register device for push notifications when user is set
    const { token: pushToken, isRegistered: isPushRegistered } = useNotifications(currentUser?.id || null);

    const handleError = useCallback((error: any, context: string) => {
        reportError(error, { scope: 'app_provider', action: context });
        // In a real app, this would show a toast or alert
    }, []);

    const setCurrentUser = useCallback(async (user: User | null) => {
        try {
            setCurrentUserState(user);
            if (Platform.OS === 'web') {
                if (typeof window !== 'undefined') {
                    if (user) window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
                    else window.localStorage.removeItem(CURRENT_USER_KEY);
                }
                return;
            }
            if (user) {
                await SecureStore.setItemAsync(CURRENT_USER_KEY, JSON.stringify(user));
            } else {
                await SecureStore.deleteItemAsync(CURRENT_USER_KEY);
            }
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
                const localEvent: Event = {
                    id: 'local',
                    name: 'Local Round',
                    created_by: 'local',
                    is_active: true,
                    pass_type: 'free',
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    created_at: new Date().toISOString(),
                };
                setActiveEvent(localEvent);
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
                console.warn('Supabase schema missing: events table not found — using local fallback event');
                // create a lightweight local active event so the UI can operate in offline mode
                const localEvent: Event = {
                    id: 'local',
                    name: 'Local Round',
                    created_by: 'local',
                    is_active: true,
                    pass_type: 'free',
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    created_at: new Date().toISOString(),
                };
                setActiveEvent(localEvent);
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
            const { data, error } = await (supabase.from('events') as any)
                .insert({
                    name,
                    created_by: currentUser.id,
                    is_active: true,
                    pass_type: passType,
                    beer_price: beerPrice ?? 5.00,
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            setActiveEvent(data);
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
        const configured = assertSupabaseConfigured();
        setSupabaseConfigured(configured);
        const init = async () => {
            try {
                let savedUser = null;
                if (Platform.OS === 'web') {
                    if (typeof window !== 'undefined') {
                        savedUser = window.localStorage.getItem(CURRENT_USER_KEY);
                    }
                } else {
                    savedUser = await SecureStore.getItemAsync(CURRENT_USER_KEY);
                }

                if (savedUser) {
                    try {
                        setCurrentUserState(JSON.parse(savedUser));
                    } catch (parseError) {
                        reportError(parseError, { scope: 'app_provider', action: 'Invalid saved user payload' });
                        if (Platform.OS === 'web') {
                            if (typeof window !== 'undefined') {
                                window.localStorage.removeItem(CURRENT_USER_KEY);
                            }
                        } else {
                            await SecureStore.deleteItemAsync(CURRENT_USER_KEY);
                        }
                    }
                }

                await Promise.all([
                    refreshUsers(),
                    fetchActiveEvent()
                ]);
            } catch (e) {
                reportError(e, { scope: 'app_provider', action: 'Init error' });
            } finally {
                setLoading(false);
            }
        };

        init();

        const usersChannel = supabase
            .channel('app_users')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
                refreshUsers();
            })
            .subscribe();

        const eventsChannel = supabase
            .channel('app_events')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
                // Always refetch to avoid stale closure/state edge cases.
                fetchActiveEvent();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(usersChannel);
            supabase.removeChannel(eventsChannel);
        };
    }, [refreshUsers, fetchActiveEvent]);

    useEffect(() => {
        refreshEventAccess();
        refreshEventMembers();
    }, [refreshEventAccess, refreshEventMembers]);

    useEffect(() => {
        if (!activeEvent?.id) return;
        const channel = supabase
            .channel(`event_memberships_${activeEvent.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_memberships' }, () => {
                refreshEventMembers();
                refreshEventAccess();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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
