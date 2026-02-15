import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetworkStatus } from './useNetworkStatus';
import { reportError } from '@/utils/logger';

const OFFLINE_QUEUE_KEY = 'offline_mutations_queue';

export type OfflineMutation = {
  id: string;
  type: 'addBeer' | 'removeBeer';
  data: any;
  timestamp: number;
};

export function useOfflineMutations() {
  const { isOnline } = useNetworkStatus();
  const [queue, setQueue] = useState<OfflineMutation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Load queue from storage on mount
  useEffect(() => {
    loadQueue();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const loadQueue = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        setQueue(JSON.parse(stored));
      }
    } catch (error) {
      reportError(new Error('Failed to load offline queue'), {
        scope: 'useOfflineMutations',
        action: 'load_queue',
        metadata: { cause: error instanceof Error ? error.message : String(error) },
      });
    }
  }, []);
  
  const persistQueue = useCallback((updater: (prev: OfflineMutation[]) => OfflineMutation[]) => {
    setQueue((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(next)).catch((error) => {
        reportError(new Error('Failed to save offline queue'), {
          scope: 'useOfflineMutations',
          action: 'persist_queue',
          metadata: { cause: error instanceof Error ? error.message : String(error) },
        });
      });
      return next;
    });
  }, []);
  
  const addToQueue = useCallback(async (mutation: Omit<OfflineMutation, 'id' | 'timestamp'>) => {
    const newMutation: OfflineMutation = {
      ...mutation,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    
    persistQueue((prev) => [...prev, newMutation]);
  }, [persistQueue]);
  
  const removeFromQueue = useCallback(async (mutationId: string) => {
    persistQueue((prev) => prev.filter(m => m.id !== mutationId));
  }, [persistQueue]);
  
  const clearQueue = useCallback(async () => {
    persistQueue(() => []);
  }, [persistQueue]);
  
  const processQueue = useCallback(async (executor: (mutation: OfflineMutation) => Promise<void>) => {
    if (queue.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    
    for (const mutation of queue) {
      try {
        await executor(mutation);
        // Remove from queue on success
        await removeFromQueue(mutation.id);
      } catch (error) {
        reportError(new Error('Failed to process offline mutation'), {
          scope: 'useOfflineMutations',
          action: 'process_queue',
          metadata: { cause: error instanceof Error ? error.message : String(error) },
        });
        // Keep in queue for retry
      }
    }
    
    setIsProcessing(false);
  }, [queue, isProcessing, removeFromQueue]);
  
  return {
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
    isProcessing: isProcessing && isOnline && queue.length > 0,
  };
}
