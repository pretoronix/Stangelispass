import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBeerClink, useWallOfFame, useUserToasts } from '@/hooks/useWallOfFame';
import * as wallOfFameService from '@/services/wallOfFame';
import * as Haptics from 'expo-haptics';

jest.mock('@/services/wallOfFame');
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Medium: 'medium',
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  return Wrapper;
};

describe('useWallOfFame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch wall of fame entries', async () => {
    const mockEntries = [
      {
        id: '1',
        event_id: 'event1',
        winner_id: 'user1',
        total_stängeli: 10,
        created_at: new Date().toISOString(),
        winner_name: 'John',
        event_name: 'Friday Night',
        toast_count: 5,
      },
    ];

    (wallOfFameService.getWallOfFame as jest.Mock).mockResolvedValue(mockEntries);

    const { result } = renderHook(() => useWallOfFame(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockEntries);
    });

    expect(wallOfFameService.getWallOfFame).toHaveBeenCalled();
  });

  it('should handle empty wall of fame', async () => {
    (wallOfFameService.getWallOfFame as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useWallOfFame(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });
});

describe('useUserToasts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch user toasts', async () => {
    const mockToasts = ['wall1', 'wall2', 'wall3'];
    (wallOfFameService.getUserToasts as jest.Mock).mockResolvedValue(mockToasts);

    const { result } = renderHook(() => useUserToasts('user123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockToasts);
    });

    expect(wallOfFameService.getUserToasts).toHaveBeenCalledWith('user123');
  });

  it('should not fetch when userId is null', async () => {
    const { result } = renderHook(() => useUserToasts(null), {
      wrapper: createWrapper(),
    });

    expect(wallOfFameService.getUserToasts).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });
});

describe('useBeerClink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add toast when not already toasted', async () => {
    (wallOfFameService.addToast as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useBeerClink('user123'), {
      wrapper: createWrapper(),
    });

    result.current.toggleToast({ wallId: 'wall1', isToasted: false });

    await waitFor(() => {
      expect(wallOfFameService.addToast).toHaveBeenCalledWith('wall1', 'user123');
    });

    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it('should remove toast when already toasted', async () => {
    (wallOfFameService.removeToast as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useBeerClink('user123'), {
      wrapper: createWrapper(),
    });

    result.current.toggleToast({ wallId: 'wall1', isToasted: true });

    await waitFor(() => {
      expect(wallOfFameService.removeToast).toHaveBeenCalledWith('wall1', 'user123');
    });

    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it('should handle error when userId is null', async () => {
    const { result } = renderHook(() => useBeerClink(null), {
      wrapper: createWrapper(),
    });

    result.current.toggleToast({ wallId: 'wall1', isToasted: false });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(wallOfFameService.addToast).not.toHaveBeenCalled();
  });

  it('should provide loading state', () => {
    const { result } = renderHook(() => useBeerClink('user123'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBeDefined();
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should provide toggleToast function', () => {
    const { result } = renderHook(() => useBeerClink('user123'), {
      wrapper: createWrapper(),
    });

    expect(result.current.toggleToast).toBeDefined();
    expect(typeof result.current.toggleToast).toBe('function');
  });
});
