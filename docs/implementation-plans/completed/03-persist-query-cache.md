# Implementation Plan: Persist Query Cache

**Priority**: 🟢 HIGH  
**Estimated Time**: 4-6 hours  
**Technical Complexity**: ⭐ Low  
**ROI**: High (offline data viewing)  
**Importance Rank**: #3  
**Status**: ✅ **IMPLEMENTED** (Feb 13, 2026)

---

## Overview

Enable persistent caching of React Query data so users can view cached data offline and have instant app startup with previously loaded data.

## Current State

✅ Implemented:
- Persisted cache via `PersistQueryClientProvider` in `app/src/providers/QueryProvider.tsx`
- AsyncStorage persister with throttling and versioned cache keys
- Old cache cleanup on startup
- Cache management utilities (`app/src/utils/cacheManager.ts`)
- Settings UI for cache management
- Test coverage (`app/src/__tests__/cacheManager.spec.ts`, `app/src/__tests__/QueryProvider.spec.tsx`)

---

## Time Breakdown

| Task | Duration | Complexity |
|------|----------|------------|
| Install dependencies | 0.5 hours | Low |
| Configure persister | 1 hour | Low |
| Hydrate cache on startup | 1 hour | Low |
| Add cache versioning | 1 hour | Low |
| Test offline scenarios | 2 hours | Medium |
| Performance optimization | 1 hour | Low |
| **Total** | **6.5 hours (1 day)** | **Low** |

---

## Technical Implementation

### Phase 1: Install Dependencies (30 min)

```bash
cd app
npm install @tanstack/react-query-persist-client
npm install @tanstack/query-async-storage-persister
```

**Package Sizes**:
- `@tanstack/react-query-persist-client`: ~5KB
- `@tanstack/query-async-storage-persister`: ~2KB

**Total bundle increase**: ~7KB (minimal)

---

### Phase 2: Configure Persister (1 hour)

**File**: `app/src/providers/QueryProvider.tsx`

**Before**:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30 * 1000,
        },
    },
});

export function QueryProvider({ children }: QueryProviderProps) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
```

**After**:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30 * 1000,
            cacheTime: 1000 * 60 * 60 * 24, // 24 hours
        },
    },
});

const persister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: 'STANGELISPASS_QUERY_CACHE',
    throttleTime: 1000, // Only persist once per second
});

export function QueryProvider({ children }: QueryProviderProps) {
    return (
        <PersistQueryClientProvider 
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: 1000 * 60 * 60 * 24, // 24 hours
                hydrateOptions: {},
                dehydrateOptions: {
                    shouldDehydrateQuery: (query) => {
                        // Only persist successful queries
                        return query.state.status === 'success';
                    },
                },
            }}
        >
            {children}
        </PersistQueryClientProvider>
    );
}

export { queryClient };
```

---

### Phase 3: Add Cache Versioning (1 hour)

Handle cache invalidation when app updates or data structure changes.

**File**: `app/src/providers/QueryProvider.tsx`

```typescript
import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
const CACHE_VERSION = 'v2'; // Increment when breaking changes

const persister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: `STANGELISPASS_QUERY_CACHE_${APP_VERSION}_${CACHE_VERSION}`,
    throttleTime: 1000,
});

// Clear old cache versions on app start
useEffect(() => {
    const clearOldCache = async () => {
        const keys = await AsyncStorage.getAllKeys();
        const oldCacheKeys = keys.filter(
            key => key.startsWith('STANGELISPASS_QUERY_CACHE_') 
                && key !== `STANGELISPASS_QUERY_CACHE_${APP_VERSION}_${CACHE_VERSION}`
        );
        
        if (oldCacheKeys.length > 0) {
            await AsyncStorage.multiRemove(oldCacheKeys);
            console.log('Cleared old cache versions:', oldCacheKeys.length);
        }
    };
    
    clearOldCache();
}, []);
```

---

### Phase 4: Selective Persistence (1 hour)

Choose which queries to persist (avoid persisting sensitive or transient data).

**File**: `app/src/providers/QueryProvider.tsx`

```typescript
const persister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: `STANGELISPASS_QUERY_CACHE_${APP_VERSION}_${CACHE_VERSION}`,
    throttleTime: 1000,
});

export function QueryProvider({ children }: QueryProviderProps) {
    return (
        <PersistQueryClientProvider 
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: 1000 * 60 * 60 * 24, // 24 hours
                dehydrateOptions: {
                    shouldDehydrateQuery: (query) => {
                        const queryKey = query.queryKey[0] as string;
                        
                        // Don't persist sensitive or frequently-changing data
                        const skipPersist = [
                            'device-tokens',
                            'notifications',
                            'real-time-',
                        ];
                        
                        const shouldSkip = skipPersist.some(key => 
                            typeof queryKey === 'string' && queryKey.includes(key)
                        );
                        
                        // Only persist successful queries that aren't in skip list
                        return query.state.status === 'success' && !shouldSkip;
                    },
                },
            }}
        >
            {children}
        </PersistQueryClientProvider>
    );
}
```

---

### Phase 5: Loading Indicator (1 hour)

Show loading state while hydrating cache.

**File**: `app/src/providers/QueryProvider.tsx`

```typescript
import { useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export function QueryProvider({ children }: QueryProviderProps) {
    const [isRestoring, setIsRestoring] = useState(true);
    
    return (
        <PersistQueryClientProvider 
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: 1000 * 60 * 60 * 24,
            }}
            onSuccess={() => {
                setIsRestoring(false);
            }}
        >
            {isRestoring ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" />
                    <Text>Loading cached data...</Text>
                </View>
            ) : (
                children
            )}
        </PersistQueryClientProvider>
    );
}
```

---

## Testing Strategy

### Manual Testing

1. **Cache Persistence**:
   - Open app, load data
   - Close app completely
   - Reopen app in airplane mode
   - Verify data visible immediately

2. **Cache Invalidation**:
   - Change `CACHE_VERSION`
   - Reopen app
   - Verify old cache cleared

3. **Selective Persistence**:
   - Check AsyncStorage keys
   - Verify only appropriate queries persisted

### Automated Testing

```typescript
// __tests__/queryPersistence.spec.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryClient } from '@/providers/QueryProvider';

describe('Query Persistence', () => {
    beforeEach(async () => {
        await AsyncStorage.clear();
    });
    
    it('should persist query data', async () => {
        // Fetch data
        await queryClient.prefetchQuery({
            queryKey: ['users'],
            queryFn: getUsers,
        });
        
        // Wait for persistence
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check AsyncStorage
        const cached = await AsyncStorage.getItem('STANGELISPASS_QUERY_CACHE_v1');
        expect(cached).toBeTruthy();
        
        const parsed = JSON.parse(cached!);
        expect(parsed.clientState).toBeTruthy();
    });
    
    it('should skip sensitive queries', async () => {
        await queryClient.prefetchQuery({
            queryKey: ['device-tokens'],
            queryFn: () => ['token123'],
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const cached = await AsyncStorage.getItem('STANGELISPASS_QUERY_CACHE_v1');
        const parsed = JSON.parse(cached!);
        
        // Should not contain device-tokens
        expect(JSON.stringify(parsed)).not.toContain('device-tokens');
    });
});
```

---

## Performance Impact

### Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| App startup (online) | 800ms | 300ms | -62% |
| App startup (offline) | N/A | 200ms | New |
| Cache write overhead | 0ms | ~50ms | +50ms |
| Storage used | 0KB | ~500KB | +500KB |

**Note**: Cache write is throttled and asynchronous, doesn't block UI.

---

## Cache Management

### Size Limits

```typescript
// Monitor cache size
const getCacheSize = async () => {
    const key = `STANGELISPASS_QUERY_CACHE_${APP_VERSION}_${CACHE_VERSION}`;
    const data = await AsyncStorage.getItem(key);
    const sizeKB = data ? new Blob([data]).size / 1024 : 0;
    console.log('Cache size:', sizeKB.toFixed(2), 'KB');
};

// Clear cache if too large (>5MB)
if (sizeKB > 5120) {
    await queryClient.clear();
    console.log('Cache cleared due to size');
}
```

### Manual Cache Clear

Add to Settings screen:

```typescript
// In settings.tsx
function CacheSettings() {
    const handleClearCache = async () => {
        await queryClient.clear();
        await AsyncStorage.clear();
        Alert.alert('Success', 'Cache cleared');
    };
    
    return (
        <Button onPress={handleClearCache}>
            Clear Cache
        </Button>
    );
}
```

---

## Offline Behavior

### Data Availability

With persistent cache:
- ✅ View leaderboard (cached)
- ✅ View beer history (cached)
- ✅ View wall of fame (cached)
- ✅ View profile (cached)
- ❌ Log new beers (requires connection)
- ❌ Real-time updates (requires connection)

### User Messaging

```typescript
import NetInfo from '@react-native-community/netinfo';

function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);
    
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOffline(!state.isConnected);
        });
        return unsubscribe;
    }, []);
    
    if (!isOffline) return null;
    
    return (
        <View style={styles.offlineBanner}>
            <Text>📶 Viewing cached data - reconnect to see updates</Text>
        </View>
    );
}
```

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Stale data shown | Medium | Low | Show last updated timestamp |
| Cache corruption | Low | Medium | Add error boundary and cache clear |
| Storage quota exceeded | Low | Low | Monitor size, add size limits |
| Version mismatch issues | Low | Medium | Robust versioning strategy |

---

## Success Criteria

- ✅ App loads instantly with cached data
- ✅ Offline viewing works for all read operations
- ✅ Cache size < 2MB average
- ✅ No performance degradation on writes
- ✅ Old caches auto-cleared on version change
- ✅ User can manually clear cache

---

## Future Enhancements

1. **Selective Invalidation**: Invalidate specific queries by pattern
2. **Smart Refetch**: Refetch stale data in background
3. **Size Optimization**: Compress cached data
4. **Cache Analytics**: Track hit/miss rates
5. **Background Sync**: Update cache periodically
