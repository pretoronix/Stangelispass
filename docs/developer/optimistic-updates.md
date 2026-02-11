# Optimistic UI Updates Guide

## Overview

Optimistic updates make the app feel instant by updating the UI before the server confirms the change. If the server request fails, the UI automatically rolls back to the previous state.

## How It Works

1. **User action** triggers a mutation (e.g., logging a beer)
2. **Cache updated immediately** with temporary data
3. **UI re-renders** showing the change instantly
4. **Server request** happens in background
5. **On success**: Real data replaces temporary data
6. **On failure**: UI rolls back to previous state

## Implementation

### Mutations with Optimistic Updates

The following mutations support optimistic updates:

- ✅ `useAddBeer()` - Add beer log
- ✅ `useRemoveBeer()` - Remove beer log

### Example: Adding a Beer

```typescript
import { useAddBeer } from '@/hooks/useBeersQuery';
import { useOptimisticError } from '@/hooks/useOptimisticError';

function AddBeerScreen() {
    const addBeerMutation = useAddBeer();
    const { addError } = useOptimisticError();
    
    const handleAddBeer = () => {
        addBeerMutation.mutate(
            { userId, addedBy, eventId },
            {
                onError: (error) => {
                    addError('Failed to log beer', {
                        retry: () => handleAddBeer(),
                    });
                },
            }
        );
    };
    
    return (
        <Button 
            onPress={handleAddBeer}
            disabled={addBeerMutation.isPending}
        >
            {addBeerMutation.isPending ? 'Adding...' : 'Add Beer'}
        </Button>
    );
}
```

### Example: Displaying Optimistic Items

```typescript
import { OptimisticItem } from '@/components/ui/OptimisticItem';

function BeerLogItem({ beer }) {
    // Temporary IDs start with 'temp-'
    const isOptimistic = beer.id.startsWith('temp-');
    
    return (
        <OptimisticItem isOptimistic={isOptimistic}>
            <View>
                <Text>{beer.user?.name}</Text>
                <Text>{new Date(beer.created_at).toLocaleString()}</Text>
                
                {isOptimistic && (
                    <Text style={styles.pending}>⏳ Saving...</Text>
                )}
            </View>
        </OptimisticItem>
    );
}
```

## Visual Feedback

### OptimisticItem Component

The `OptimisticItem` component provides automatic visual feedback:

- **Pulsing animation** while the item is pending
- **Green border** on the left side
- **Opacity animation** to draw attention

```typescript
<OptimisticItem isOptimistic={isPending} style={yourStyles}>
    {/* Your content */}
</OptimisticItem>
```

### Mutation States

React Query provides several states you can use:

```typescript
const mutation = useAddBeer();

mutation.isPending   // True while mutation is in progress
mutation.isError     // True if mutation failed
mutation.isSuccess   // True if mutation succeeded
mutation.error       // Error object if failed
```

## Error Handling

### useOptimisticError Hook

Provides consistent error handling with rollback notifications:

```typescript
import { useOptimisticError } from '@/hooks/useOptimisticError';

function MyComponent() {
    const { addError } = useOptimisticError();
    const mutation = useAddBeer();
    
    const handleAction = () => {
        mutation.mutate(data, {
            onError: (error) => {
                addError('Operation failed', {
                    retry: () => handleAction(),
                });
            },
        });
    };
}
```

This will:
1. Show an alert to the user
2. Explain that changes were rolled back
3. Optionally provide a retry button

## Testing Optimistic Updates

### Unit Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useAddBeer, QUERY_KEYS } from '@/hooks/useBeersQuery';

it('should update cache optimistically', async () => {
    const { result } = renderHook(() => useAddBeer(), { wrapper });
    
    result.current.mutate({ userId, addedBy, eventId });
    
    // Cache updated immediately
    await waitFor(() => {
        const cached = queryClient.getQueryData(QUERY_KEYS.beers(eventId));
        expect(cached[0].id).toContain('temp-');
    });
});

it('should rollback on error', async () => {
    mockAddBeer.mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useAddBeer(), { wrapper });
    
    result.current.mutate({ userId, addedBy, eventId });
    
    await waitFor(() => {
        expect(result.current.isError).toBe(true);
    });
    
    // Verify rollback
    const cached = queryClient.getQueryData(QUERY_KEYS.beers(eventId));
    expect(cached).toEqual(initialData);
});
```

### Manual Testing

1. **Happy Path**:
   - Log a beer
   - See instant UI update with pulse animation
   - Wait ~1 second for confirmation
   - Animation stops, real data appears

2. **Error Path**:
   - Turn on Airplane Mode
   - Log a beer
   - See optimistic update
   - Wait for timeout
   - See rollback and error alert

3. **Race Conditions**:
   - Log multiple beers quickly
   - Verify all appear in correct order
   - Verify all save successfully

## Technical Details

### How Rollback Works

1. **onMutate** (before API call):
   - Cancel in-flight queries
   - Save snapshot of current cache
   - Update cache with temporary data
   - Return snapshot for later use

2. **onError** (if API fails):
   - Restore cache from snapshot
   - Show error to user

3. **onSuccess** (if API succeeds):
   - Invalidate queries to fetch real data
   - Real data replaces temporary data

### Temporary IDs

Optimistic items use temporary IDs:
- Format: `temp-{timestamp}`
- Example: `temp-1707695480123`
- Easily detectable: `id.startsWith('temp-')`

### Cache Updates

```typescript
// Before mutation
cache = [{ id: '1', count: 5 }]

// After optimistic update
cache = [
    { id: 'temp-123', count: 1 }, // New optimistic item
    { id: '1', count: 6 },        // Updated count
]

// After server confirmation
cache = [
    { id: 'real-456', count: 1 }, // Real ID from server
    { id: '1', count: 6 },
]
```

## Best Practices

1. **Always handle errors**
   - Provide clear error messages
   - Explain that rollback occurred
   - Offer retry option

2. **Show visual feedback**
   - Use `OptimisticItem` for pending states
   - Display "Saving..." text
   - Use loading indicators

3. **Test edge cases**
   - Network failures
   - Concurrent mutations
   - Rapid repeated actions

4. **Keep temp IDs unique**
   - Use timestamps: `temp-${Date.now()}`
   - Check for collisions if needed

5. **Don't persist optimistic items**
   - Temporary data should not be cached to disk
   - Filter out temp IDs before persistence

## Performance Impact

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Perceived latency | 300-500ms | 0ms | -100% |
| Actual latency | 300-500ms | 300-500ms | 0% |
| User satisfaction | Good | Excellent | ↑ |

**Note**: Optimistic updates don't make the app faster, but they feel instant to users.

## Related Files

- `app/src/hooks/useBeersQuery.ts` - Beer mutation hooks
- `app/src/hooks/useOptimisticError.ts` - Error handling
- `app/src/components/ui/OptimisticItem.tsx` - Visual feedback
- `app/src/components/examples/BeerLogItemExample.tsx` - Usage example
- `app/src/__tests__/optimisticUpdates.spec.ts` - Tests

## Future Enhancements

1. **Conflict Resolution**: Handle simultaneous edits from multiple users
2. **Undo/Redo**: Allow users to undo optimistic changes
3. **Batch Updates**: Multiple changes in one transaction
4. **Smart Retry**: Auto-retry failed optimistic updates with exponential backoff
5. **Optimistic Ordering**: Maintain sort order during optimistic updates
