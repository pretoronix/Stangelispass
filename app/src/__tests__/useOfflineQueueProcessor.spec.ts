import { renderHook, waitFor } from '@testing-library/react-native';
import { useOfflineQueueProcessor } from '@/hooks/useOfflineQueueProcessor';
import { addBeer, removeBeer } from '@/services/beers';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import type { OfflineMutation } from '@/hooks/useOfflineMutations';

jest.mock('@/services/beers', () => ({
  addBeer: jest.fn(),
  removeBeer: jest.fn(),
}));

jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(),
}));

const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

describe('useOfflineQueueProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes queued mutations when online', async () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    const queue: OfflineMutation[] = [
      {
        id: 'mutation-1',
        type: 'addBeer',
        data: { userId: 'user-1', addedBy: 'user-2', eventId: 'event-1' },
        timestamp: Date.now(),
      },
      {
        id: 'mutation-2',
        type: 'removeBeer',
        data: { beerId: 'beer-1' },
        timestamp: Date.now(),
      },
    ];

    const processQueue = jest.fn(async (executor) => {
      for (const mutation of queue) {
        await executor(mutation);
      }
    });

    renderHook(() => useOfflineQueueProcessor({ queue, processQueue, isProcessing: false }));

    await waitFor(() => {
      expect(processQueue).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(addBeer).toHaveBeenCalledWith('user-1', 'user-2', 'event-1');
      expect(removeBeer).toHaveBeenCalledWith('beer-1');
    });
  });

  it('skips processing when offline', async () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });

    const queue: OfflineMutation[] = [
      {
        id: 'mutation-1',
        type: 'addBeer',
        data: { userId: 'user-1', addedBy: 'user-2', eventId: 'event-1' },
        timestamp: Date.now(),
      },
    ];

    const processQueue = jest.fn();

    renderHook(() => useOfflineQueueProcessor({ queue, processQueue, isProcessing: false }));

    await waitFor(() => {
      expect(processQueue).not.toHaveBeenCalled();
    });
  });

  it('skips processing while already processing', async () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    const queue: OfflineMutation[] = [
      {
        id: 'mutation-1',
        type: 'addBeer',
        data: { userId: 'user-1', addedBy: 'user-2', eventId: 'event-1' },
        timestamp: Date.now(),
      },
    ];

    const processQueue = jest.fn();

    renderHook(() => useOfflineQueueProcessor({ queue, processQueue, isProcessing: true }));

    await waitFor(() => {
      expect(processQueue).not.toHaveBeenCalled();
    });
  });
});
