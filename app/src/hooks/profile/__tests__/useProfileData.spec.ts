import { renderHook, waitFor } from '@testing-library/react-native';
import { useProfileData } from '@/hooks/profile/useProfileData';
import { getBeersByUser, getUserAchievements } from '@/services/supabase';
import { reportError } from '@/utils/logger';

jest.mock('@/services/supabase', () => ({
  getBeersByUser: jest.fn(),
  getUserAchievements: jest.fn(),
}));

describe('useProfileData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty data when currentUser is null', async () => {
    const { result } = renderHook(() => useProfileData(null as any, { id: 'e1' } as any));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.beers).toEqual([]);
    expect(result.current.roundBeers).toEqual([]);
    expect(result.current.achievements).toEqual([]);
  });

  it('fetches beers and achievements and filters round beers', async () => {
    (getBeersByUser as jest.Mock).mockResolvedValue([
      { id: 'b1', event_id: 'e1' },
      { id: 'b2', event_id: 'e2' },
    ]);
    (getUserAchievements as jest.Mock).mockResolvedValue([{ id: 'a1' }]);

    const currentUser = { id: 'u1' } as any;
    const activeEvent = { id: 'e1' } as any;

    const { result } = renderHook(() =>
      useProfileData(currentUser, activeEvent)
    );

    await waitFor(() => expect(result.current.beers).toHaveLength(2));
    expect(result.current.roundBeers).toHaveLength(1);
    expect(result.current.roundBeers[0]?.id).toBe('b1');
    expect(result.current.achievements).toEqual([{ id: 'a1' }]);
  });

  it('reports errors and finishes loading on failure', async () => {
    (getBeersByUser as jest.Mock).mockRejectedValue(new Error('fail'));
    (getUserAchievements as jest.Mock).mockResolvedValue([]);

    const currentUser = { id: 'u1' } as any;
    const activeEvent = { id: 'e1' } as any;

    const { result } = renderHook(() =>
      useProfileData(currentUser, activeEvent)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(reportError).toHaveBeenCalled();
  });
});
