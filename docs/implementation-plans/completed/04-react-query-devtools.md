# Implementation Plan: React Query DevTools

**Priority**: 🟢 LOW  
**Estimated Time**: 1-2 hours  
**Technical Complexity**: ⭐ Very Low  
**ROI**: Medium (developer experience)

---

## Overview

Add React Query DevTools for development to debug queries, inspect cache, and monitor performance.

## Current State

✅ Infrastructure:
- React Query v5 installed
- QueryProvider configured

⏳ Missing:
- DevTools integration
- Development-only loading

---

## Time Breakdown

| Task | Duration | Complexity |
|------|----------|------------|
| Install DevTools package | 0.5 hours | Very Low |
| Configure integration | 0.5 hours | Very Low |
| Add toggle button | 1 hour | Low |
| Documentation | 0.5 hours | Very Low |
| **Total** | **2.5 hours** | **Very Low** |

---

## Technical Implementation

### Phase 1: Install Package (30 min)

```bash
cd app
npm install --save-dev @tanstack/react-query-devtools
```

**Note**: DevTools are ~40KB but automatically tree-shaken in production builds.

---

### Phase 2: Basic Integration (30 min)

**File**: `app/src/providers/QueryProvider.tsx`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Platform } from 'react-native';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30 * 1000,
        },
    },
});

export function QueryProvider({ children }: QueryProviderProps) {
    const isDev = __DEV__; // Expo/React Native dev mode flag
    
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            
            {/* Only load in development */}
            {isDev && Platform.OS !== 'web' && (
                <ReactQueryDevtools 
                    initialIsOpen={false}
                    position="bottom"
                />
            )}
        </QueryClientProvider>
    );
}
```

---

### Phase 3: Floating Button Toggle (1 hour)

For mobile, add a floating button to toggle DevTools.

**File**: `app/src/components/dev/DevToolsToggle.tsx` (new)

```typescript
import React, { useState } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function DevToolsToggle() {
    const [isOpen, setIsOpen] = useState(false);
    
    if (!__DEV__) return null;
    
    return (
        <>
            {/* Floating Button */}
            <TouchableOpacity 
                style={styles.floatingButton}
                onPress={() => setIsOpen(!isOpen)}
                activeOpacity={0.7}
            >
                <Ionicons 
                    name={isOpen ? "bug" : "bug-outline"} 
                    size={24} 
                    color="#fff" 
                />
            </TouchableOpacity>
            
            {/* DevTools Panel */}
            {isOpen && (
                <View style={styles.devToolsContainer}>
                    <ReactQueryDevtools 
                        initialIsOpen={true}
                        position="bottom"
                    />
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    floatingButton: {
        position: 'absolute',
        bottom: 80,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#ff6b6b',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 9999,
    },
    devToolsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        zIndex: 9998,
    },
});
```

**Integration**: Add to `app/src/app/_layout.tsx`

```typescript
import { DevToolsToggle } from '@/components/dev/DevToolsToggle';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AppErrorBoundary>
                <QueryProvider>
                    <AppProvider>
                        <Tabs>{/* ... */}</Tabs>
                        
                        {/* Dev Tools */}
                        <DevToolsToggle />
                    </AppProvider>
                </QueryProvider>
            </AppErrorBoundary>
        </SafeAreaProvider>
    );
}
```

---

### Phase 4: Custom Configuration (30 min)

**File**: `app/src/providers/QueryProvider.tsx`

```typescript
export function QueryProvider({ children }: QueryProviderProps) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            
            {__DEV__ && (
                <ReactQueryDevtools 
                    initialIsOpen={false}
                    position="bottom"
                    toggleButtonProps={{
                        style: {
                            bottom: 80,
                            right: 20,
                        },
                    }}
                    panelProps={{
                        style: {
                            height: '50%',
                        },
                    }}
                />
            )}
        </QueryClientProvider>
    );
}
```

---

## Features & Usage

### Query Inspector

View all active queries:
- Query key
- Data
- Status (loading, success, error)
- Last updated time
- Stale/Fresh status
- Number of observers

### Cache Explorer

- Browse entire query cache
- See all cached data
- Manually invalidate queries
- Clear cache

### Mutation Tracker

- See pending mutations
- View mutation state
- Error tracking

### Performance Metrics

- Query execution time
- Render count
- Cache hit/miss ratio

---

## Developer Workflow

### Debugging Queries

```typescript
// In DevTools:
1. Find query by key (e.g., ['beers', 'event-123'])
2. Inspect data returned
3. Check fetch status
4. View error if failed
5. Manually refetch
6. Invalidate to test refresh
```

### Testing Cache Behavior

```typescript
// In DevTools:
1. Trigger a query
2. Navigate away (unmount component)
3. Check if query still in cache
4. Navigate back
5. Verify data loads from cache (instant)
```

### Debugging Stale Data

```typescript
// In DevTools:
1. Find query showing stale data
2. Check "last updated" timestamp
3. Check staleTime configuration
4. Manually refetch to get fresh data
5. Adjust staleTime if needed
```

---

## Alternative: Web-Only DevTools

If mobile DevTools are too invasive, use web-only version for desktop debugging.

**File**: `app/src/providers/QueryProvider.tsx`

```typescript
import { Platform } from 'react-native';

export function QueryProvider({ children }: QueryProviderProps) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            
            {/* Only on web */}
            {__DEV__ && Platform.OS === 'web' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    );
}
```

**Usage**: Test app in web browser (`npm run web`) to access DevTools.

---

## Performance Impact

| Metric | Development | Production |
|--------|-------------|------------|
| Bundle size | +40KB | 0KB (tree-shaken) |
| Runtime overhead | ~5% | 0% |
| Memory usage | +2MB | 0MB |

**Note**: Zero impact on production builds due to automatic tree-shaking.

---

## Documentation

### Developer Guide

Create `docs/development/developer/react-query-devtools.md`:

```markdown
# React Query DevTools Guide

## Opening DevTools

### Mobile (iOS/Android)
Tap the red bug icon in bottom-right corner.

### Web
DevTools appear automatically in bottom-left corner.

## Common Tasks

### Inspect a Query
1. Open DevTools
2. Find query in list (search by key)
3. Click to expand
4. View data, status, and metadata

### Clear Cache
1. Open DevTools
2. Click "Clear Cache" button
3. All queries will refetch

### Manually Refetch
1. Find query
2. Click "Refetch" button
3. Watch network request in DevTools

### Test Offline Behavior
1. Open DevTools
2. Enable "Offline" mode
3. Trigger queries (should use cache)
4. Disable offline mode
5. Queries auto-refetch

## Troubleshooting

### DevTools Not Appearing
- Check you're in dev mode (`__DEV__` true)
- Verify package installed
- Restart development server

### Can't Find Query
- Check query key matches exactly
- Query might be garbage collected
- Component might be unmounted
```

---

## Testing

### Verification Checklist

- [ ] DevTools appear in development
- [ ] DevTools hidden in production build
- [ ] Can toggle DevTools on/off
- [ ] Can inspect queries
- [ ] Can invalidate cache
- [ ] Can manually refetch
- [ ] Performance acceptable (< 5% overhead)
- [ ] No crashes or errors

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Accidentally shipped to production | Very Low | Low | Automatic tree-shaking |
| Performance overhead | Low | Low | Only in dev mode |
| UI interference on mobile | Medium | Low | Floating button toggle |
| Learning curve | Medium | Low | Documentation provided |

---

## Success Criteria

- ✅ DevTools available in development
- ✅ Zero impact on production
- ✅ Easy to toggle on mobile
- ✅ Helpful for debugging queries
- ✅ Team trained on usage

---

## Future Enhancements

1. **Custom Panels**: Add app-specific debug info
2. **Query Timeline**: Visual timeline of query execution
3. **Network Tab**: Show actual network requests
4. **Export Cache**: Save cache state for debugging
5. **Remote DevTools**: Debug on physical devices
