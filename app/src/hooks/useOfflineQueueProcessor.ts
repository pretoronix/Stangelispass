import { useCallback, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OfflineMutation } from '@/hooks/useOfflineMutations';
import { addBeer, removeBeer } from '@/services/beers';

type OfflineMutationsApi = {
  queue: OfflineMutation[];
  processQueue: (executor: (mutation: OfflineMutation) => Promise<void>) => Promise<void> | void;
  isProcessing: boolean;
};

/**
 * Processes queued offline mutations when the device is online.
 * Keep this hook mounted at the app root (AppProvider).
 */
export function useOfflineQueueProcessor(offline: OfflineMutationsApi) {
  const { isOnline } = useNetworkStatus();
  const { queue, processQueue, isProcessing } = offline;

  const execute = useCallback(async (mutation: OfflineMutation) => {
    if (mutation.type === 'addBeer') {
      const { userId, addedBy, eventId } = mutation.data || {};
      if (!userId || !addedBy || !eventId) {
        throw new Error('Invalid addBeer payload');
      }
      await addBeer(userId, addedBy, eventId);
      return;
    }

    if (mutation.type === 'removeBeer') {
      const { beerId } = mutation.data || {};
      if (!beerId) {
        throw new Error('Invalid removeBeer payload');
      }
      await removeBeer(beerId);
    }
  }, []);

  useEffect(() => {
    if (!isOnline || queue.length === 0 || isProcessing) return;
    void processQueue(execute);
  }, [execute, isOnline, isProcessing, processQueue, queue.length]);

  return {
    queueLength: queue.length,
    isProcessing,
  };
}
