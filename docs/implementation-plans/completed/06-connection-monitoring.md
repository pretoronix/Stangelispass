# Implementation Plan: Connection Monitoring & Offline Detection

**Priority**: 🟡 MEDIUM  
**Estimated Time**: 3-4 hours  
**Technical Complexity**: ⭐⭐ Low-Medium  
**ROI**: Medium (better UX)

**Status**: Implemented (2026-02-13)

## Implementation Summary

- **Network status hook**: `app/src/hooks/useNetworkStatus.ts`
- **Offline banner**: `app/src/components/ui/OfflineBanner.tsx` mounted in `app/src/app/_layout.tsx`
- **Offline queue**: `app/src/hooks/useOfflineMutations.ts`
- **Offline queue processor**: `app/src/hooks/useOfflineQueueProcessor.ts` mounted in `app/src/providers/AppProvider.tsx`
- **Sync indicator**: `app/src/components/ui/SyncIndicator.tsx` (shown on Add screen)
- **Offline-aware Add flow**: `app/src/app/add.tsx` queues mutations when offline
- **Tests**: `app/src/__tests__/useNetworkStatus.spec.ts`, `app/src/__tests__/useOfflineMutations.spec.ts`, `app/src/__tests__/useOfflineQueueProcessor.spec.ts`

---

## Overview

Add network connection monitoring to show users when they're offline and handle offline scenarios gracefully.

## Current State

✅ Implemented:
- Network status monitoring with NetInfo + React Query online manager
- Offline banner + reconnect feedback
- Offline mutation queue with automatic retry on reconnect
- Sync indicator for queued changes
- Add screen queuing when offline with user feedback

---

## Time Breakdown

| Task | Duration | Complexity |
|------|----------|------------|
| Install NetInfo | 0.5 hours | Very Low |
| Create connection hook | 1 hour | Low |
| Offline banner component | 1.5 hours | Low |
| Queue offline mutations | 2 hours | Medium |
| Testing offline scenarios | 2 hours | Medium |
| **Total** | **7 hours (1 day)** | **Low-Medium** |

---

## Technical Implementation

### Phase 1: Install Package (30 min)

```bash
cd app
npx expo install @react-native-community/netinfo
```

**Configuration**: No additional setup needed for Expo.

---

### Phase 2: Connection Hook (1 hour)

**File**: `app/src/hooks/useNetworkStatus.ts` (new)

```typescript
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [isReconnecting, setIsReconnecting] = useState(false);
    
    useEffect(() => {
        // Initial check
        NetInfo.fetch().then(state => {
            const online = state.isConnected && state.isInternetReachable !== false;
            setIsOnline(online);
            onlineManager.setOnline(online);
        });
        
        // Subscribe to changes
        const unsubscribe = NetInfo.addEventListener(state => {
            const wasOnline = isOnline;
            const online = state.isConnected && state.isInternetReachable !== false;
            
            setIsOnline(online);
            onlineManager.setOnline(online);
            
            // Detect reconnection
            if (!wasOnline && online) {
                setIsReconnecting(true);
                setTimeout(() => setIsReconnecting(false), 3000);
            }
        });
        
        return () => unsubscribe();
    }, [isOnline]);
    
    return { isOnline, isReconnecting };
}
```

---

### Phase 3: Offline Banner (1.5 hours)

**File**: `app/src/components/ui/OfflineBanner.tsx` (new)

```typescript
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export function OfflineBanner() {
    const { isOnline, isReconnecting } = useNetworkStatus();
    const [slideAnim] = React.useState(new Animated.Value(-50));
    
    React.useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: !isOnline ? 0 : -50,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isOnline]);
    
    if (isOnline && !isReconnecting) return null;
    
    return (
        <Animated.View 
            style={[
                styles.banner,
                isReconnecting && styles.reconnecting,
                { transform: [{ translateY: slideAnim }] }
            ]}
        >
            <Ionicons 
                name={isReconnecting ? 'cloud-done' : 'cloud-offline'} 
                size={20} 
                color="#fff" 
            />
            <Text style={styles.text}>
                {isReconnecting ? '✓ Back online' : '📶 Offline - viewing cached data'}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ff6b6b',
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    reconnecting: {
        backgroundColor: '#51cf66',
    },
    text: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: spacing.sm,
    },
});
```

**Integration**: Add to `app/src/app/_layout.tsx`

```typescript
import { OfflineBanner } from '@/components/ui/OfflineBanner';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AppErrorBoundary>
                <QueryProvider>
                    <AppProvider>
                        <OfflineBanner />
                        <Tabs>{/* ... */}</Tabs>
                    </AppProvider>
                </QueryProvider>
            </AppErrorBoundary>
        </SafeAreaProvider>
    );
}
```

---

### Phase 4: Disable Actions When Offline (1 hour)

**File**: `app/src/app/add.tsx`

**Implemented**: Add screen now queues beer additions when offline and shows a short offline banner plus sync indicator. Actions continue optimistically and sync when back online.

```typescript
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

function AddBeerScreen() {
    const { isOnline } = useNetworkStatus();
    const addBeerMutation = useAddBeer();
    
    const handleAddBeer = () => {
        if (!isOnline) {
            Alert.alert(
                'Offline',
                'You need to be online to log beers. They will be synced when you reconnect.'
            );
            return;
        }
        
        addBeerMutation.mutate({
            userId: selectedUser.id,
            addedBy: currentUser.id,
            eventId: activeEvent.id,
        });
    };
    
    return (
        <View>
            <Button 
                onPress={handleAddBeer}
                disabled={!isOnline || addBeerMutation.isPending}
            />
            {!isOnline && (
                <Text style={styles.offlineWarning}>
                    ⚠️ Offline - connect to log beers
                </Text>
            )}
        </View>
    );
}
```

---

### Phase 5: Offline Mutation Queue (2 hours)

**File**: `app/src/hooks/useOfflineMutations.ts` (new)

```typescript
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetworkStatus } from './useNetworkStatus';
import { useAddBeer } from './useBeersQuery';

const OFFLINE_QUEUE_KEY = 'offline_mutations_queue';

type OfflineMutation = {
    id: string;
    type: 'addBeer' | 'removeBeer';
    data: any;
    timestamp: number;
};

export function useOfflineMutations() {
    const { isOnline } = useNetworkStatus();
    const [queue, setQueue] = useState<OfflineMutation[]>([]);
    const addBeerMutation = useAddBeer();
    
    // Load queue from storage
    useEffect(() => {
        loadQueue();
    }, []);
    
    // Process queue when online
    useEffect(() => {
        if (isOnline && queue.length > 0) {
            processQueue();
        }
    }, [isOnline, queue]);
    
    const loadQueue = async () => {
        const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        if (stored) {
            setQueue(JSON.parse(stored));
        }
    };
    
    const saveQueue = async (newQueue: OfflineMutation[]) => {
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
        setQueue(newQueue);
    };
    
    const addToQueue = async (mutation: Omit<OfflineMutation, 'id' | 'timestamp'>) => {
        const newMutation: OfflineMutation = {
            ...mutation,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
        };
        
        const newQueue = [...queue, newMutation];
        await saveQueue(newQueue);
    };
    
    const processQueue = async () => {
        for (const mutation of queue) {
            try {
                if (mutation.type === 'addBeer') {
                    await addBeerMutation.mutateAsync(mutation.data);
                }
                
                // Remove from queue on success
                const newQueue = queue.filter(m => m.id !== mutation.id);
                await saveQueue(newQueue);
            } catch (error) {
                console.error('Failed to process offline mutation:', error);
                // Keep in queue for retry
            }
        }
    };
    
    return {
        addToQueue,
        queue,
        isProcessing: isOnline && queue.length > 0,
    };
}
```

**Usage**:

```typescript
function AddBeerScreen() {
    const { isOnline } = useNetworkStatus();
    const { addToQueue } = useOfflineMutations();
    const addBeerMutation = useAddBeer();
    
    const handleAddBeer = async () => {
        const mutation = {
            userId: selectedUser.id,
            addedBy: currentUser.id,
            eventId: activeEvent.id,
        };
        
        if (!isOnline) {
            // Queue for later
            await addToQueue({
                type: 'addBeer',
                data: mutation,
            });
            
            Alert.alert('Queued', 'Beer will be logged when you reconnect');
            return;
        }
        
        // Execute immediately when online
        addBeerMutation.mutate(mutation);
    };
    
    return <Button onPress={handleAddBeer} />;
}
```

---

### Phase 6: Sync Indicator (1 hour)

**File**: `app/src/components/ui/SyncIndicator.tsx` (new)

```typescript
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useOfflineMutations } from '@/hooks/useOfflineMutations';
import { colors, spacing } from '@/lib/theme';

export function SyncIndicator() {
    const { queue, isProcessing } = useOfflineMutations();
    
    if (queue.length === 0) return null;
    
    return (
        <View style={styles.container}>
            {isProcessing ? (
                <>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.text}>
                        Syncing {queue.length} change{queue.length > 1 ? 's' : ''}...
                    </Text>
                </>
            ) : (
                <Text style={styles.text}>
                    {queue.length} pending change{queue.length > 1 ? 's' : ''}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        backgroundColor: colors.surfaceLight,
    },
    text: {
        marginLeft: spacing.sm,
        fontSize: 12,
        color: colors.textMuted,
    },
});
```

---

## Testing Strategy

### Manual Testing

1. **Go Offline**:
   - Enable airplane mode
   - Verify banner appears
   - Try to log beer
   - Check queued mutations

2. **Come Online**:
   - Disable airplane mode
   - Verify "Back online" message
   - Watch queued mutations sync
   - Verify UI updates

3. **Edge Cases**:
   - Intermittent connection
   - Queue multiple mutations
   - App restart with pending queue

### Automated Testing

Implemented tests:

- `app/src/__tests__/useNetworkStatus.spec.ts`
- `app/src/__tests__/useOfflineMutations.spec.ts`
- `app/src/__tests__/useOfflineQueueProcessor.spec.ts`

---

## Success Criteria

- ✅ Offline banner shows when disconnected
- ✅ Reconnection message shows briefly
- ✅ Mutations queue when offline
- ✅ Queue processes automatically on reconnect
- ✅ No data loss
- ✅ Clear user feedback

---

## Future Enhancements

1. **Conflict Resolution**: Handle simultaneous edits
2. **Sync Priority**: Prioritize critical mutations
3. **Partial Sync**: Sync individual items
4. **Manual Sync Button**: Force retry failed mutations
5. **Offline Mode Toggle**: Test offline behavior
