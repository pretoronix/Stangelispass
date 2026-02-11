# Migration Guide: Using React Query Hooks

## Quick Start

All new query hooks are available and ready to use alongside existing code. No breaking changes!

## 1. Basic Data Fetching

### Old Way (Manual State)
```typescript
import { useEffect, useState } from 'react';
import { getUsers } from '@/services/supabase';

function MyComponent() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getUsers();
            setUsers(data);
            setLoading(false);
        };
        fetchData();
    }, []);
    
    if (loading) return <Loading />;
    return <UserList users={users} />;
}
```

### New Way (React Query)
```typescript
import { useUsers } from '@/hooks/query';

function MyComponent() {
    const { data: users, isLoading } = useUsers();
    
    if (isLoading) return <Loading />;
    return <UserList users={users} />;
}
```

**Benefits**: Automatic caching, background updates, error handling, retry logic.

## 2. Mutations (Adding/Updating Data)

### Old Way
```typescript
import { useState } from 'react';
import { addBeer } from '@/services/supabase';

function LogBeer({ userId, eventId }) {
    const [submitting, setSubmitting] = useState(false);
    
    const handleLog = async () => {
        setSubmitting(true);
        try {
            await addBeer(userId, currentUser.id, eventId);
            // Manually refresh data
            await refreshBeers();
        } catch (e) {
            alert('Error');
        } finally {
            setSubmitting(false);
        }
    };
    
    return <Button onPress={handleLog} disabled={submitting} />;
}
```

### New Way
```typescript
import { useAddBeer } from '@/hooks/query';

function LogBeer({ userId, eventId, currentUserId }) {
    const addBeerMutation = useAddBeer();
    
    const handleLog = () => {
        addBeerMutation.mutate({ 
            userId, 
            addedBy: currentUserId, 
            eventId 
        });
    };
    
    return (
        <Button 
            onPress={handleLog} 
            disabled={addBeerMutation.isPending} 
        />
    );
}
```

**Benefits**: Automatic cache invalidation, loading states, error handling, optimistic updates ready.

## 3. Dependent Queries

### Old Way
```typescript
const [user, setUser] = useState(null);
const [achievements, setAchievements] = useState([]);

useEffect(() => {
    if (user) {
        getUserAchievements(user.id).then(setAchievements);
    }
}, [user]);
```

### New Way
```typescript
import { useUserAchievements } from '@/hooks/query';

const { data: achievements } = useUserAchievements(
    user?.id || '', 
    !!user  // enabled flag
);
```

**Benefits**: Only fetches when user exists, automatic refetch when user changes.

## 4. Event Permissions

### Old Way (In AppProvider)
```typescript
const [permissions, setPermissions] = useState(defaultPermissions);

useEffect(() => {
    const fetchPermissions = async () => {
        const membership = await getEventMembership(eventId, userId);
        const perms = getPermissionsForRole(membership?.role, isAdmin);
        setPermissions(perms);
    };
    fetchPermissions();
}, [eventId, userId]);
```

### New Way
```typescript
import { useEventPermissions } from '@/hooks/query';

const { permissions, role, loading } = useEventPermissions(
    eventId,
    userId,
    isAdmin
);
```

**Benefits**: Cached permissions, automatic updates, loading state.

## 5. Leaderboard with Leader State

### Old Way
```typescript
const [counts, setCounts] = useState([]);
const [leader, setLeader] = useState(null);

useEffect(() => {
    Promise.all([
        getBeerCountByUser(eventId),
        getEventLeaderState(eventId)
    ]).then(([countsData, leaderData]) => {
        setCounts(countsData);
        setLeader(leaderData);
    });
}, [eventId]);
```

### New Way
```typescript
import { useBeerCounts, useEventLeaderState } from '@/hooks/query';

const { data: counts } = useBeerCounts(eventId);
const { data: leaderData } = useEventLeaderState(eventId);
```

**Benefits**: Parallel fetching, independent caching, automatic refetch.

## 6. Manual Refetch

### Old Way
```typescript
const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
};
```

### New Way
```typescript
const { data, refetch, isRefetching } = useUsers();

// Later...
<RefreshControl
    refreshing={isRefetching}
    onRefresh={refetch}
/>
```

## Common Patterns

### Loading States
```typescript
const { data, isLoading, isError, error } = useUsers();

if (isLoading) return <Loading />;
if (isError) return <Error message={error.message} />;
return <UserList users={data} />;
```

### Conditional Fetching
```typescript
const { data } = useEventMembers(eventId, !!eventId);  // Only fetch if eventId exists
```

### Optimistic Updates (Advanced)
```typescript
const mutation = useAddBeer();

mutation.mutate(data, {
    onSuccess: () => {
        // Success callback
    },
    onError: (error) => {
        // Error callback
    }
});
```

### Background Refetch
```typescript
// Data automatically refetches when:
// - Window regains focus
// - Network reconnects
// - Stale time expires (default 30s)
```

## Import Shortcuts

```typescript
// Individual imports
import { useUsers } from '@/hooks/useUsersQuery';
import { useBeersQuery } from '@/hooks/useBeersQuery';

// Or use central export
import { useUsers, useBeersQuery, useEventPermissions } from '@/hooks/query';
```

## Gradual Migration Strategy

1. **Keep existing code working** - No need to change everything at once
2. **Use new hooks in new features** - Start with new components
3. **Migrate high-traffic screens first** - Get caching benefits early
4. **Test thoroughly** - Ensure data flows work as expected
5. **Deprecate old patterns** - Once migration is complete

## Query Keys (for advanced usage)

```typescript
import { BEER_QUERY_KEYS } from '@/hooks/query';

// Invalidate specific queries
queryClient.invalidateQueries({ 
    queryKey: BEER_QUERY_KEYS.beers(eventId) 
});

// Prefetch data
queryClient.prefetchQuery({
    queryKey: BEER_QUERY_KEYS.beers(eventId),
    queryFn: () => getBeers(eventId)
});
```

## Debugging

React Query has excellent DevTools. To add them:

```bash
npm install @tanstack/react-query-devtools
```

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In your app
<QueryProvider>
    <App />
    <ReactQueryDevtools initialIsOpen={false} />
</QueryProvider>
```

## Performance Tips

1. **Set appropriate stale times** - Longer for rarely-changing data
2. **Use enabled flags** - Prevent unnecessary fetches
3. **Leverage cache** - Same query key = same cache entry
4. **Batch mutations** - Group related updates
5. **Prefetch predictable data** - Load before user needs it

## Questions?

See the official React Query docs: https://tanstack.com/query/latest
