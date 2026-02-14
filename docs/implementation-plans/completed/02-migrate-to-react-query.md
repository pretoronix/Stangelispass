# Implementation Plan: Migrate Components to React Query

**Priority**: 🟡 MEDIUM  
**Estimated Time**: 2-3 days  
**Technical Complexity**: ⭐⭐ Low-Medium  
**ROI**: High (leverages existing infrastructure)

---

## Overview

Replace manual state management in existing screens with React Query hooks to leverage caching, automatic refetching, and improved performance.

## Current State

✅ Infrastructure Ready:
- 22 React Query hooks created
- QueryProvider integrated in app layout
- All service modules support query hooks

⏳ Components Still Using Manual State:
- Home screen (index.tsx) - uses `useBeers` hook
- History screen - manual state
- Legends screen - manual state
- Add Beer screen - manual mutations
- Profile screen - already migrated ✅

---

## Time Breakdown

| Task | Duration | Complexity |
|------|----------|------------|
| Migrate Home screen | 4 hours | Low |
| Migrate History screen | 3 hours | Low |
| Migrate Legends screen | 2 hours | Low |
| Migrate Add Beer screen | 3 hours | Medium |
| Update AppProvider | 4 hours | Medium |
| Remove deprecated hooks | 2 hours | Low |
| Testing & validation | 6 hours | Medium |
| **Total** | **24 hours (3 days)** | **Low-Medium** |

---

## Technical Implementation

### Phase 1: Migrate Home Screen (4 hours)

**File**: `app/src/app/index.tsx`

**Before**:
```typescript
function HomeScreen() {
    const { activeEvent } = useApp();
    const { beers, beerCounts, loading } = useBeers(activeEvent?.id);
    
    // Manual state
    const [leaderAnnouncement, setLeaderAnnouncement] = useState(null);
    
    return (
        <View>
            {loading ? <Loading /> : <Leaderboard counts={beerCounts} />}
        </View>
    );
}
```

**After**:
```typescript
import { useBeerCounts, useEventLeaderState } from '@/hooks/query';

function HomeScreen() {
    const { activeEvent } = useApp();
    
    // React Query hooks with automatic caching
    const { data: beerCounts, isLoading } = useBeerCounts(activeEvent?.id);
    const { data: leaderState } = useEventLeaderState(activeEvent?.id || '');
    
    // Leader announcements handled by query subscription
    useEffect(() => {
        if (leaderState?.user_id !== prevLeader) {
            setLeaderAnnouncement(`${leaderState?.user?.name} is now leading!`);
        }
    }, [leaderState]);
    
    return (
        <View>
            {isLoading ? <Loading /> : <Leaderboard counts={beerCounts || []} />}
        </View>
    );
}
```

**Benefits**:
- Automatic background refetching
- Cached data on navigation
- No manual loading state management

---

### Phase 2: Migrate History Screen (3 hours)

**File**: `app/src/app/history.tsx`

**Before**:
```typescript
function HistoryScreen() {
    const { activeEvent } = useApp();
    const [beers, setBeers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchBeers = async () => {
            setLoading(true);
            const data = await getBeers(activeEvent?.id);
            setBeers(data);
            setLoading(false);
        };
        fetchBeers();
    }, [activeEvent?.id]);
    
    return (
        <FlatList
            data={beers}
            refreshing={loading}
            onRefresh={() => fetchBeers()}
        />
    );
}
```

**After**:
```typescript
import { useBeersQuery, useRemoveBeer } from '@/hooks/query';

function HistoryScreen() {
    const { activeEvent, eventPermissions } = useApp();
    const { data: beers, isLoading, refetch, isRefetching } = useBeersQuery(activeEvent?.id);
    const removeBeerMutation = useRemoveBeer();
    
    const handleDelete = (beerId: string) => {
        removeBeerMutation.mutate(beerId, {
            onSuccess: () => {
                // Query automatically invalidated and refetched
                Alert.alert('Success', 'Beer removed');
            },
        });
    };
    
    return (
        <FlatList
            data={beers || []}
            refreshing={isRefetching}
            onRefresh={refetch}
            renderItem={({ item }) => (
                <BeerLogItem 
                    beer={item}
                    onDelete={eventPermissions.canManageLogs ? handleDelete : undefined}
                />
            )}
        />
    );
}
```

**Benefits**:
- Pull-to-refresh built-in
- Optimistic deletes
- Auto-refetch on success

---

### Phase 3: Migrate Legends Screen (2 hours)

**File**: `app/src/app/legends.tsx`

**Before**:
```typescript
function LegendsScreen() {
    const [wallOfFame, setWallOfFame] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetch = async () => {
            const data = await getWallOfFame();
            setWallOfFame(data);
            setLoading(false);
        };
        fetch();
    }, []);
    
    return <WallOfFameList data={wallOfFame} />;
}
```

**After**:
```typescript
import { useWallOfFame } from '@/hooks/query';

function LegendsScreen() {
    const { data: wallOfFame, isLoading } = useWallOfFame();
    
    if (isLoading) return <Loading />;
    
    return <WallOfFameList data={wallOfFame || []} />;
}
```

**Benefits**:
- One-line data fetching
- Cached across navigations
- Background updates

---

### Phase 4: Migrate Add Beer Screen (3 hours)

**File**: `app/src/app/add.tsx`

**Before**:
```typescript
function AddBeerScreen() {
    const { activeEvent, currentUser, refreshUsers } = useApp();
    const [submitting, setSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    
    const handleAddBeer = async () => {
        setSubmitting(true);
        try {
            await addBeer(selectedUser.id, currentUser.id, activeEvent.id);
            await refreshUsers(); // Manual refetch
            Alert.alert('Success!');
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setSubmitting(false);
        }
    };
    
    return (
        <Button 
            onPress={handleAddBeer}
            disabled={submitting}
        />
    );
}
```

**After**:
```typescript
import { useAddBeer } from '@/hooks/query';

function AddBeerScreen() {
    const { activeEvent, currentUser } = useApp();
    const [selectedUser, setSelectedUser] = useState(null);
    const addBeerMutation = useAddBeer();
    
    const handleAddBeer = () => {
        if (!selectedUser || !activeEvent) return;
        
        addBeerMutation.mutate({
            userId: selectedUser.id,
            addedBy: currentUser.id,
            eventId: activeEvent.id,
        }, {
            onSuccess: (data) => {
                // Automatic cache invalidation
                Alert.alert('Success!');
                
                // Show new badges if any
                if (data.newBadges.length > 0) {
                    showBadgeAnimation(data.newBadges);
                }
            },
            onError: (error) => {
                Alert.alert('Error', error.message);
            },
        });
    };
    
    return (
        <Button 
            onPress={handleAddBeer}
            disabled={addBeerMutation.isPending}
            loading={addBeerMutation.isPending}
        />
    );
}
```

**Benefits**:
- Built-in loading/error states
- Automatic cache updates
- Badge notifications from response

---

### Phase 5: Simplify AppProvider (4 hours)

**File**: `app/src/providers/AppProvider.tsx`

**Changes**:
1. Remove manual `refreshUsers()` - use `useUsers()` hook instead
2. Remove manual `refreshEventMembers()` - use `useEventMembers()` hook
3. Keep only essential state (currentUser, activeEvent)

**Before (365 lines)**:
```typescript
export function AppProvider({ children }) {
    const [users, setUsers] = useState([]);
    const [eventMembers, setEventMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const refreshUsers = useCallback(async () => {
        const data = await getUsers();
        setUsers(data);
    }, []);
    
    const refreshEventMembers = useCallback(async () => {
        const data = await getEventMembers(eventId);
        setEventMembers(data);
    }, [eventId]);
    
    useEffect(() => {
        refreshUsers();
        refreshEventMembers();
    }, []);
    
    return (
        <AppContext.Provider value={{ 
            users, 
            refreshUsers,
            eventMembers,
            refreshEventMembers,
            // ... more
        }}>
            {children}
        </AppContext.Provider>
    );
}
```

**After (~200 lines)**:
```typescript
export function AppProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [activeEvent, setActiveEvent] = useState(null);
    const [showRecap, setShowRecap] = useState(false);
    
    // Let components use React Query hooks directly
    // No need to fetch and store in provider
    
    return (
        <AppContext.Provider value={{ 
            currentUser,
            setCurrentUser,
            activeEvent,
            setActiveEvent,
            showRecap,
            setShowRecap,
        }}>
            {children}
        </AppContext.Provider>
    );
}

// Components now do:
// const { data: users } = useUsers();
// const { data: eventMembers } = useEventMembers(eventId);
```

**Benefits**:
- Simpler provider (365 → ~200 lines)
- Better separation of concerns
- Each component manages its own data

---

### Phase 6: Remove Deprecated Hooks (2 hours)

**Files to Remove/Update**:
- `app/src/hooks/useBeers.ts` - Mark as deprecated, add warning
- `app/src/hooks/useUsers.ts` - Mark as deprecated, add warning

**Create deprecation warnings**:
```typescript
// useBeers.ts
export function useBeers(eventId?: string) {
    console.warn('useBeers is deprecated. Use useBeerCounts or useBeersQuery from @/hooks/query');
    
    const { data } = useBeerCounts(eventId);
    return {
        beers: [],
        beerCounts: data || [],
        loading: false,
    };
}
```

---

## Testing Strategy

### Component Testing
```typescript
// __tests__/HomeScreen.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('HomeScreen with React Query', () => {
    const queryClient = new QueryClient();
    
    it('should display beer counts', async () => {
        const { getByText } = render(
            <QueryClientProvider client={queryClient}>
                <HomeScreen />
            </QueryClientProvider>
        );
        
        await waitFor(() => {
            expect(getByText(/beers/i)).toBeTruthy();
        });
    });
});
```

### Integration Testing
1. Navigate between screens
2. Verify data persists (cache)
3. Pull to refresh works
4. Mutations update UI

---

## Migration Checklist

- [ ] Migrate Home screen to `useBeerCounts` and `useEventLeaderState`
- [ ] Migrate History screen to `useBeersQuery` and `useRemoveBeer`
- [ ] Migrate Legends screen to `useWallOfFame`
- [ ] Migrate Add Beer screen to `useAddBeer` mutation
- [ ] Simplify AppProvider (remove data fetching)
- [ ] Add deprecation warnings to old hooks
- [ ] Update all imports to use `@/hooks/query`
- [ ] Test each screen individually
- [ ] Test navigation between screens
- [ ] Verify cache invalidation works
- [ ] Check performance (should be faster)
- [ ] Update documentation

---

## Performance Impact

### Before (Manual State)
- Redundant API calls on navigation
- Manual loading state tracking
- No caching between screens
- Stale data problems

### After (React Query)
- 60-80% fewer API calls (caching)
- Automatic loading states
- Data persists between navigations
- Background refetching keeps data fresh

**Estimated improvement**: 2-3x faster perceived performance

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing functionality | Low | High | Thorough testing before deployment |
| Cache synchronization issues | Low | Medium | Use query invalidation properly |
| Learning curve for team | Medium | Low | Provide examples and documentation |

---

## Success Criteria

- ✅ All screens use React Query hooks
- ✅ AppProvider reduced by 40%+ lines
- ✅ All tests passing
- ✅ No performance regressions
- ✅ Improved user experience (faster navigation)
- ✅ Developer experience improved (less boilerplate)

---

## Future Enhancements

1. **Prefetching**: Preload next screen data
2. **Optimistic Updates**: Instant UI feedback
3. **Offline Mutations**: Queue mutations when offline
4. **Infinite Scroll**: Paginated beer history
5. **Background Sync**: Keep data fresh automatically
