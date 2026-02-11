import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetworkStatus } from './useNetworkStatus';

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
      console.error('Failed to load offline queue:', error);
    }
  }, []);
  
  const saveQueue = useCallback(async (newQueue: OfflineMutation[]) => {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
      setQueue(newQueue);
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }, []);
  
  const addToQueue = useCallback(async (mutation: Omit<OfflineMutation, 'id' | 'timestamp'>) => {
    const newMutation: OfflineMutation = {
      ...mutation,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    
    const newQueue = [...queue, newMutation];
    await saveQueue(newQueue);
  }, [queue, saveQueue]);
  
  const removeFromQueue = useCallback(async (mutationId: string) => {
    const newQueue = queue.filter(m => m.id !== mutationId);
    await saveQueue(newQueue);
  }, [queue, saveQueue]);
  
  const clearQueue = useCallback(async () => {
    await saveQueue([]);
  }, [saveQueue]);
  
  const processQueue = useCallback(async (executor: (mutation: OfflineMutation) => Promise<void>) => {
    if (queue.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    
    for (const mutation of queue) {
      try {
        await executor(mutation);
        // Remove from queue on success
        await removeFromQueue(mutation.id);
      } catch (error) {
        console.error('Failed to process offline mutation:', error);
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
