import { renderHook, waitFor } from '@testing-library/react-native';
import { useBeers } from '@/hooks/useBeers';
import { useApp } from '@/providers/AppProvider';
import { reportError } from '@/utils/logger';

const mockGetEventGameStats = jest.fn();
const mockGetEventLeaderState = jest.fn();
const mockGetUsers = jest.fn();
const mockGetBeerCountByUser = jest.fn();

const mockFrom = jest.fn();
const mockChannel = jest.fn();
const mockRemoveChannel = jest.fn();

jest.mock('@/providers/AppProvider', () => ({
  useApp: jest.fn(),
}));

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    channel: (...args: any[]) => mockChannel(...args),
    removeChannel: (...args: any[]) => mockRemoveChannel(...args),
  },
  getEventGameStats: (...args: any[]) => mockGetEventGameStats(...args),
  getEventLeaderState: (...args: any[]) => mockGetEventLeaderState(...args),
  getUsers: (...args: any[]) => mockGetUsers(...args),
  getBeerCountByUser: (...args: any[]) => mockGetBeerCountByUser(...args),
}));

describe('useBeers', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useApp as jest.Mock).mockReturnValue({ activeEvent: { id: 'e1' } });

    mockChannel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(() => 'chan'),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table !== 'beers') throw new Error(`unexpected table: ${table}`);
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: [{ created_at: '2026-01-01T00:00:00.000Z' }] }),
        }),
      };
    });
  });

  it('uses game stats when available and computes leader/hot streak', async () => {
    mockGetEventGameStats.mockResolvedValueOnce({
      missingTable: false,
      stats: [
        { user_id: 'u1', beer_count: 3, points: 10, streak_count: 2, longest_streak: 3, lead_changes: 1 },
        { user_id: 'u2', beer_count: 5, points: 6, streak_count: 0, longest_streak: 1, lead_changes: 0 },
      ],
    });
    mockGetEventLeaderState.mockResolvedValueOnce({ leader: { user_id: 'u1' } });
    mockGetUsers.mockResolvedValueOnce([
      { id: 'u1', name: 'Alice', is_admin: true },
      { id: 'u2', name: 'Bob', is_admin: false },
    ]);

    const { result, unmount } = renderHook(() => useBeers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.gameStatsAvailable).toBe(true);
    expect(result.current.totalBeers).toBe(8);
    expect(result.current.leaderInfo?.userId).toBe('u1');
    expect(result.current.leaderLead).toBe(4); // 10 - 6
    expect(result.current.hotStreak?.userId).toBe('u1');
    expect(result.current.rawBeers).toHaveLength(1);

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  it('falls back to beer counts when stats table is missing', async () => {
    mockGetEventGameStats.mockResolvedValueOnce({ missingTable: true, stats: [] });
    mockGetEventLeaderState.mockResolvedValueOnce({ leader: null });
    mockGetUsers.mockResolvedValueOnce([{ id: 'u1', name: 'Alice', is_admin: true }]);
    mockGetBeerCountByUser.mockResolvedValueOnce([
      { userId: 'u2', name: 'Bob', count: 2, isAdmin: false },
      { userId: 'u1', name: 'Alice', count: 5, isAdmin: true },
    ]);

    const { result } = renderHook(() => useBeers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.gameStatsAvailable).toBe(false);
    expect(result.current.leaderInfo?.userId).toBe('u1');
    expect(result.current.leaderLead).toBe(5);
    expect(result.current.hotStreak).toBeNull();
  });

  it('handles single-user events (no runner-up) when stats are available', async () => {
    mockGetEventGameStats.mockResolvedValueOnce({
      missingTable: false,
      stats: [{ user_id: 'u1', beer_count: 3, points: 9, streak_count: 0, longest_streak: 0, lead_changes: 0 }],
    });
    mockGetEventLeaderState.mockResolvedValueOnce({ leader: null });
    mockGetUsers.mockResolvedValueOnce([{ id: 'u1', name: 'Alice', is_admin: true }]);

    const { result } = renderHook(() => useBeers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.beerCounts).toHaveLength(1);
    expect(result.current.leaderLead).toBe(9);
  });

  it('clears state when there is no active event', async () => {
    (useApp as jest.Mock).mockReturnValue({ activeEvent: null });

    const { result } = renderHook(() => useBeers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.beerCounts).toEqual([]);
    expect(result.current.totalBeers).toBe(0);
    expect(result.current.leaderInfo).toBeNull();
    expect(result.current.rawBeers).toEqual([]);
  });

  it('reports errors and stops loading when fetch fails', async () => {
    mockGetEventGameStats.mockRejectedValueOnce(new Error('boom'));
    mockGetEventLeaderState.mockResolvedValueOnce({ leader: null });
    mockGetUsers.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useBeers());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(reportError).toHaveBeenCalled();
  });
});
