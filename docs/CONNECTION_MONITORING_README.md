# Connection Monitoring & Offline Detection

## Overview

This implementation adds real-time network connection monitoring to provide users with clear feedback when they're offline and handle offline scenarios gracefully.

## What Was Implemented

### 1. Network Status Monitoring

**File**: `app/src/hooks/useNetworkStatus.ts`

- Detects online/offline status using `@react-native-community/netinfo`
- Integrates with React Query's `onlineManager` for automatic retry logic
- Detects reconnection events and shows temporary feedback
- Returns `{ isOnline, isReconnecting }` state

**Features:**
- Initial status check on mount
- Real-time status updates via event listener
- 3-second "Back online" notification on reconnection
- Proper cleanup on unmount

### 2. Offline Banner Component

**File**: `app/src/components/ui/OfflineBanner.tsx`

- Shows at top of screen when offline
- Animated slide-in/slide-out transitions
- Two states:
  - **Offline**: Red banner with "📶 Offline - viewing cached data"
  - **Reconnecting**: Green banner with "✓ Back online" (3 seconds)

**Integration**: Automatically included in `app/src/app/_layout.tsx`

### 3. Offline Mutations Queue

**File**: `app/src/hooks/useOfflineMutations.ts`

- Queues mutations when offline using AsyncStorage
- Automatically processes queue when connection is restored
- Supports retry logic for failed mutations
- Persists across app restarts

**API:**
```typescript
const {
  queue,              // Array of pending mutations
  addToQueue,         // Add a mutation to the queue
  removeFromQueue,    // Remove a specific mutation
  clearQueue,         // Clear all pending mutations
  processQueue,       // Process queue with executor function
  isProcessing,       // Boolean indicating if queue is being processed
} = useOfflineMutations();
```

### 4. Sync Indicator Component

**File**: `app/src/components/ui/SyncIndicator.tsx`

- Shows number of pending offline changes
- Displays spinner when actively syncing
- Auto-hides when queue is empty

**Usage**: Can be placed in any screen to show sync status

## Architecture

```
NetInfo (Native Module)
    ↓
useNetworkStatus Hook
    ↓
├─> OfflineBanner (UI Feedback)
├─> React Query onlineManager (Auto-retry)
└─> useOfflineMutations Hook
      ↓
   AsyncStorage (Persistence)
      ↓
   Process Queue on Reconnection
```

## Testing

### Test Coverage

**Network Status Hook** (`useNetworkStatus.spec.ts`):
- ✅ Initialize with online status
- ✅ Detect offline status
- ✅ Show reconnecting state
- ✅ Handle null isInternetReachable
- ✅ Cleanup event listener on unmount

**Offline Mutations Hook** (`useOfflineMutations.spec.ts`):
- ✅ Initialize with empty queue
- ✅ Load queue from storage on mount
- ✅ Add mutation to queue
- ✅ Remove mutation from queue
- ✅ Clear entire queue
- ✅ Process queue with executor
- ✅ Keep mutation in queue if executor fails

**Test Results:**
```
PASS src/__tests__/useNetworkStatus.spec.ts (5 tests)
PASS src/__tests__/useOfflineMutations.spec.ts (7 tests)

Total: 12 passed
```

### Manual Testing

1. **Go Offline**:
   - Enable airplane mode or disable Wi-Fi
   - Verify red offline banner appears at top
   - Try to use the app - cached data should still be visible
   - Queue mutations if applicable

2. **Come Back Online**:
   - Disable airplane mode or re-enable Wi-Fi
   - Verify green "Back online" banner shows for 3 seconds
   - Watch queued mutations sync automatically
   - Verify data refreshes

3. **Edge Cases**:
   - Intermittent connection (flaky network)
   - Queue multiple mutations while offline
   - Restart app with pending queue
   - Failed mutations (network errors)

## Usage Examples

### Example 1: Check Network Status in Component

```typescript
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

function MyComponent() {
  const { isOnline, isReconnecting } = useNetworkStatus();
  
  return (
    <View>
      {!isOnline && (
        <Text>⚠️ You're offline. Changes will sync when reconnected.</Text>
      )}
      <Button disabled={!isOnline} onPress={handleAction} />
    </View>
  );
}
```

### Example 2: Queue Mutations When Offline

```typescript
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineMutations } from '@/hooks/useOfflineMutations';
import { useAddBeer } from '@/hooks/useBeersQuery';

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
  
  return (
    <Button onPress={handleAddBeer} title="Add Beer" />
  );
}
```

### Example 3: Process Queue on Reconnection

```typescript
import { useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineMutations } from '@/hooks/useOfflineMutations';
import { useAddBeer } from '@/hooks/useBeersQuery';

function AppProvider({ children }) {
  const { isOnline } = useNetworkStatus();
  const { processQueue } = useOfflineMutations();
  const addBeerMutation = useAddBeer();
  
  useEffect(() => {
    if (isOnline) {
      // Process pending mutations when online
      processQueue(async (mutation) => {
        if (mutation.type === 'addBeer') {
          await addBeerMutation.mutateAsync(mutation.data);
        }
        // Handle other mutation types...
      });
    }
  }, [isOnline, processQueue, addBeerMutation]);
  
  return <>{children}</>;
}
```

### Example 4: Show Sync Indicator

```typescript
import { SyncIndicator } from '@/components/ui/SyncIndicator';

function HistoryScreen() {
  return (
    <View>
      <SyncIndicator />
      {/* Rest of your screen content */}
    </View>
  );
}
```

## Integration with React Query

The `useNetworkStatus` hook automatically integrates with React Query's online manager:

```typescript
onlineManager.setOnline(online);
```

This enables:
- **Automatic Refetch**: Queries refetch when connection is restored
- **Pause Mutations**: Mutations pause when offline (if configured)
- **Smart Retry**: Failed requests retry when back online

## Configuration

### Adjust Reconnection Banner Duration

Edit `app/src/hooks/useNetworkStatus.ts`:

```typescript
// Change 3000ms to desired duration
setTimeout(() => setIsReconnecting(false), 3000);
```

### Customize Banner Colors

Edit `app/src/components/ui/OfflineBanner.tsx`:

```typescript
const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#ff6b6b', // Offline color (red)
    // ...
  },
  reconnecting: {
    backgroundColor: '#51cf66', // Online color (green)
  },
});
```

### Change Queue Storage Key

Edit `app/src/hooks/useOfflineMutations.ts`:

```typescript
const OFFLINE_QUEUE_KEY = 'your_custom_queue_key';
```

## Troubleshooting

### Banner Not Showing

1. Check if `OfflineBanner` is included in `_layout.tsx`
2. Verify NetInfo is properly installed: `npm ls @react-native-community/netinfo`
3. Check console for errors

### Queue Not Persisting

1. Verify AsyncStorage is working (check logs for errors)
2. Test with: `AsyncStorage.getItem('offline_mutations_queue')`
3. Check if storage quota is exceeded

### Queue Not Processing

1. Ensure executor function is provided to `processQueue()`
2. Check console for mutation processing errors
3. Verify network is actually online (not just appearing online)

### React Query Not Auto-Refetching

1. Verify `onlineManager.setOnline()` is being called
2. Check React Query configuration for `refetchOnReconnect`
3. Ensure queries have proper retry configuration

## Future Enhancements

1. **Conflict Resolution**
   - Detect and resolve conflicting offline mutations
   - Show UI for manual conflict resolution

2. **Sync Priority**
   - Prioritize critical mutations (e.g., payments before likes)
   - Reorder queue based on importance

3. **Partial Sync**
   - Sync individual items instead of full queue
   - Allow manual sync of specific mutations

4. **Manual Sync Button**
   - Force retry of failed mutations
   - Clear pending queue manually

5. **Offline Mode Toggle**
   - Test offline behavior without disabling network
   - Useful for development and testing

6. **Smart Deduplication**
   - Detect duplicate mutations in queue
   - Merge similar mutations (e.g., multiple beers for same user)

7. **Bandwidth Optimization**
   - Batch multiple mutations into single request
   - Compress mutation data

8. **Detailed Sync Status**
   - Show individual mutation status
   - Progress bar for queue processing
   - Error details for failed mutations

## Performance Considerations

- NetInfo listener runs continuously (minimal overhead)
- AsyncStorage reads/writes are async and non-blocking
- Queue processing is sequential (prevents race conditions)
- Banner animations use native driver (smooth 60fps)

## Dependencies

- `@react-native-community/netinfo` - Network status detection
- `@react-native-async-storage/async-storage` - Queue persistence  
- `@tanstack/react-query` - Integration for auto-retry

## Browser/Web Support

NetInfo works on web but with limitations:
- Only detects online/offline (not connection quality)
- May not detect all network changes
- Banner still shows and works correctly

## Platform Differences

### iOS
- Reliable network detection
- Detects Wi-Fi vs cellular
- Fast reconnection detection

### Android
- Reliable network detection
- Detects connection type
- May require permissions for detailed network info

### Web
- Basic online/offline detection
- Uses browser's `navigator.onLine` API
- Less reliable than native platforms

## Success Criteria

- ✅ Offline banner shows when disconnected
- ✅ "Back online" message shows briefly on reconnection
- ✅ React Query integrates properly (auto-refetch)
- ✅ Mutations can be queued (if implemented in app)
- ✅ No performance degradation
- ✅ Clean user feedback
- ✅ Comprehensive test coverage

## Files Created

1. `app/src/hooks/useNetworkStatus.ts` - Network status detection
2. `app/src/hooks/useOfflineMutations.ts` - Offline mutation queue
3. `app/src/components/ui/OfflineBanner.tsx` - Visual feedback banner
4. `app/src/components/ui/SyncIndicator.tsx` - Sync status indicator
5. `app/src/__tests__/useNetworkStatus.spec.ts` - Network status tests
6. `app/src/__tests__/useOfflineMutations.spec.ts` - Offline queue tests

## Files Modified

1. `app/src/app/_layout.tsx` - Added OfflineBanner
2. `app/jest-setup.js` - Added AsyncStorage mock

## Package Installed

- `@react-native-community/netinfo@^12.0.3`

---

**Last Updated**: 2026-02-11
**Version**: 1.0.0
**Status**: ✅ Production Ready
