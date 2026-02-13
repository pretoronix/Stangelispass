# React Query DevTools Guide

## Opening DevTools

### Web
DevTools appear automatically in bottom-left corner when running in web mode.

```bash
cd app
npm run web
```

Then open your browser and look for the React Query DevTools icon in the bottom-left corner.

### Mobile (iOS/Android)
DevTools are currently disabled on mobile platforms for better performance and UX. Use web mode for debugging.

## Common Tasks

### Inspect a Query
1. Open DevTools (click the icon in bottom-left)
2. Find query in list (search by key)
3. Click to expand
4. View data, status, and metadata

### Clear Cache
1. Open DevTools
2. Click "Clear Cache" button
3. All queries will refetch

### Manually Refetch
1. Find query in DevTools
2. Click "Refetch" button
3. Watch the query status update

### View Query Details
- **Query Key**: Unique identifier (e.g., `['beers', 'event-123']`)
- **Status**: `loading`, `success`, `error`
- **Data**: The actual cached data
- **Last Updated**: Timestamp of last fetch
- **Stale**: Whether data is considered stale
- **Observers**: Number of components watching this query

## Debugging Workflows

### Debug Stale Data Issues
```typescript
// In DevTools:
1. Find the query showing stale data
2. Check "last updated" timestamp
3. Check staleTime configuration (default: 30s)
4. Manually refetch to get fresh data
5. Adjust staleTime in QueryProvider if needed
```

### Test Cache Behavior
```typescript
// In DevTools:
1. Trigger a query (navigate to a screen)
2. Navigate away (unmount component)
3. Check if query still in cache
4. Navigate back
5. Verify data loads from cache instantly
```

### Debug Failed Queries
```typescript
// In DevTools:
1. Find failed query (red status)
2. Expand to see error details
3. Check error message
4. Click "Refetch" to retry
5. Fix the issue in code
```

## Troubleshooting

### DevTools Not Appearing
- Check you're in dev mode (`__DEV__` is true)
- Verify you're running on web platform (`npm run web`)
- Verify package is installed: `@tanstack/react-query-devtools`
- Restart development server

### Can't Find Query
- Check query key matches exactly (case-sensitive)
- Query might be garbage collected (if no components are observing it)
- Component might be unmounted
- Query might not have been triggered yet

### DevTools Causing Performance Issues
DevTools have ~5% overhead in development mode but are automatically excluded from production builds.

## Configuration

DevTools are configured in `app/src/providers/QueryProvider.tsx`:

```typescript
{__DEV__ && Platform.OS === 'web' && (
    <ReactQueryDevtools 
        initialIsOpen={false}
        position="bottom"
    />
)}
```

**Options:**
- `initialIsOpen`: Whether DevTools panel starts open (default: false)
- `position`: Where to place the toggle button (`top-left`, `top-right`, `bottom-left`, `bottom-right`)

## Performance Impact

| Metric | Development | Production |
|--------|-------------|------------|
| Bundle size | +40KB | 0KB (tree-shaken) |
| Runtime overhead | ~5% | 0% |
| Memory usage | +2MB | 0MB |

**Note**: Zero impact on production builds due to automatic tree-shaking and `__DEV__` guards.

## Advanced Usage

### Query Inspector
View all active queries with their:
- Query key
- Cached data
- Status (loading, success, error)
- Last updated timestamp
- Stale/fresh status
- Number of observers
- Retry count

### Cache Explorer
- Browse entire query cache
- See all cached data
- Manually invalidate specific queries
- Clear entire cache
- View cache size

### Mutation Tracker
- See pending mutations
- View mutation state and variables
- Track mutation errors
- Monitor mutation history

## Best Practices

1. **Always use web mode for debugging**: More reliable and better UX than mobile DevTools
2. **Monitor cache size**: Large caches can impact performance
3. **Check stale time**: Ensure stale time matches your app's needs
4. **Watch query refetches**: Excessive refetching can indicate configuration issues
5. **Use query keys effectively**: Descriptive keys make debugging easier

## Common Query Keys in App

- `['beers', eventId]` - Beers for a specific event
- `['event', eventId]` - Event details
- `['user', userId]` - User profile
- `['participants', eventId]` - Event participants

## Related Documentation

- [React Query Documentation](https://tanstack.com/query/latest)
- [DevTools Documentation](https://tanstack.com/query/latest/docs/react/devtools)
- [App Query Provider](../../app/src/providers/QueryProvider.tsx)
