import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';

const mockUser = { id: 'u1', name: 'Alice', is_admin: true };
const mockEvent = {
  id: 'e1',
  name: 'Round 1',
  created_by: 'u1',
  is_active: true,
  pass_type: 'free',
  expires_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  beer_price: 5,
};

jest.mock('@/services/supabase', () => {
  const __eventsQuery: any = {};
  __eventsQuery.select = jest.fn(() => __eventsQuery);
  __eventsQuery.eq = jest.fn(() => __eventsQuery);
  __eventsQuery.order = jest.fn(() => __eventsQuery);
  __eventsQuery.limit = jest.fn(() => __eventsQuery);
  __eventsQuery.maybeSingle = jest.fn(async () => ({ data: mockEvent, error: null }));

  return {
    __eventsQuery,
    supabase: {
      from: jest.fn((table: string) => {
        if (table === 'events') return __eventsQuery;
        return null;
      }),
    },
    getUsers: jest.fn(async () => [mockUser]),
    getPermissionsForRole: jest.fn(() => ({
      canManageEvent: true,
      canManageMembers: true,
      canManageLogs: true,
      canIssueStamps: true,
      canCloseEvent: true,
      canInvite: true,
      canResetEventData: true,
    })),
    getEventMembership: jest.fn(async () => ({ missingTable: false, membership: { role: 'owner' } })),
    getEventMembers: jest.fn(async () => []),
  };
});

jest.mock('@/utils/preflight', () => ({
  assertSupabaseConfigured: jest.fn(() => true),
}));

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: jest.fn(),
}));

jest.mock('@/hooks/useOfflineMutations', () => ({
  useOfflineMutations: jest.fn(() => ({
    queue: [],
    addToQueue: jest.fn(),
    isProcessing: false,
  })),
}));

jest.mock('@/hooks/useOfflineQueueProcessor', () => ({
  useOfflineQueueProcessor: jest.fn(),
}));

jest.mock('@/services/notifications', () => ({
  enqueueNewRoundNotifications: jest.fn(async () => null),
}));

jest.mock('@/providers/appProviderUtils', () => ({
  buildLocalEvent: jest.fn(() => ({
    id: 'local',
    name: 'Local Round',
    created_by: 'local',
    is_active: true,
    pass_type: 'free',
    expires_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    beer_price: 5,
  })),
  persistStoredUser: jest.fn(async () => null),
}));

jest.mock('@/providers/appProviderLifecycle', () => ({
  bootstrapAppProvider: jest.fn(async ({ setCurrentUserState, refreshUsers, fetchActiveEvent, setLoading }: any) => {
    setCurrentUserState(mockUser);
    await refreshUsers();
    await fetchActiveEvent();
    setLoading(false);
  }),
  subscribeUsersAndEvents: jest.fn(() => jest.fn()),
  subscribeEventMemberships: jest.fn(() => jest.fn()),
}));

jest.mock('@/providers/appProviderActions', () => ({
  startEventInSupabase: jest.fn(async () => ({
    ...mockEvent,
    id: 'e2',
    name: 'Round 2',
  })),
  closeEventInSupabase: jest.fn(async () => null),
}));

describe('AppProvider', () => {
  test('boots and exposes start/close event actions', async () => {
    const { AppProvider, useApp } = require('@/providers/AppProvider');

    const seen: any = { current: null };
    function Consumer() {
      const ctx = useApp();
      useEffect(() => {
        seen.current = ctx;
      }, [ctx]);
      return <Text testID="child">ok</Text>;
    }

    render(
      <AppProvider>
        <Consumer />
      </AppProvider>
    );

    await waitFor(() => expect(seen.current?.loading).toBe(false));
    expect(seen.current.currentUser?.id).toBe('u1');
    expect(seen.current.users.length).toBeGreaterThan(0);
    expect(seen.current.activeEvent?.id).toBe('e1');

    await act(async () => {
      await seen.current.startEvent('Round 2', 'day', 6);
    });
    expect(seen.current.activeEvent?.id).toBe('e2');

    await act(async () => {
      await seen.current.closeEvent();
    });
    await waitFor(() => expect(seen.current.showRecap).toBe(true));
  });

  test('handles missing events table by falling back to local event', async () => {
    const supabaseMod: any = require('@/services/supabase');
    supabaseMod.__eventsQuery.maybeSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST205' } });

    const { AppProvider, useApp } = require('@/providers/AppProvider');

    const seen: any = { current: null };
    function Consumer() {
      const ctx = useApp();
      useEffect(() => {
        seen.current = ctx;
      }, [ctx]);
      return null;
    }

    render(
      <AppProvider>
        <Consumer />
      </AppProvider>
    );

    await waitFor(() => expect(seen.current?.loading).toBe(false));
    expect(seen.current.remoteAvailable).toBe(false);
    expect(seen.current.activeEvent?.id).toBe('local');
  });

  test('reports error when refreshUsers fails', async () => {
    const { getUsers } = require('@/services/supabase');
    (getUsers as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));

    const { AppProvider } = require('@/providers/AppProvider');
    const { reportError } = require('@/utils/logger');

    render(
      <AppProvider>
        <Text>test</Text>
      </AppProvider>
    );

    // Bootstrap calls refreshUsers
    await waitFor(() => expect(reportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ action: 'Failed to refresh users' })
    ));
  });

  test('reports error when closeEvent fails', async () => {
    const { closeEventInSupabase } = require('@/providers/appProviderActions');
    (closeEventInSupabase as jest.Mock).mockRejectedValueOnce(new Error('Close aborted'));

    const { AppProvider, useApp } = require('@/providers/AppProvider');
    const { reportError } = require('@/utils/logger');

    const seen: any = { current: null };
    function Consumer() {
      const ctx = useApp();
      useEffect(() => { seen.current = ctx; }, [ctx]);
      return null;
    }

    render(
      <AppProvider>
        <Consumer />
      </AppProvider>
    );

    await waitFor(() => expect(seen.current?.loading).toBe(false));

    await act(async () => {
      await seen.current.closeEvent();
    });

    expect(reportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ action: 'Failed to close event' })
    );
  });
});
