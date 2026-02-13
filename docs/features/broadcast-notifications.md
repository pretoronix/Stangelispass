# Admin Broadcast Notifications

## Overview
Event administrators can send push notifications to all participants in an active event. Participants can opt-in or opt-out via settings.

## Features
- ✅ Permission-based access (event admin/owner only)
- ✅ Opt-out mechanism via notification preferences
- ✅ Message validation (1-100 characters)
- ✅ Character counter UI
- ✅ Haptic feedback
- ✅ Success/error handling
- ✅ Foreground notification alerts
- ✅ Navigation on tap

## Architecture

### Service Layer
**File**: `app/src/services/notifications.ts`

```typescript
sendAdminBroadcast(eventId: string, message: string, senderId: string): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}>
```

**Validation**:
- Message: 1-100 characters, trimmed
- Permissions: Only event admin/owner can broadcast
- Opt-out: Filters recipients by `notification_prefs.admin_broadcasts`

**Implementation**:
1. Fetch event with memberships
2. Verify sender has admin/owner role
3. Fetch all members' device tokens
4. Filter by admin_broadcasts preference
5. Enqueue notifications via Supabase
6. Return success + recipient count

### React Query Hook
**File**: `app/src/hooks/useNotificationsQuery.ts`

```typescript
useSendBroadcast(): {
  mutate: (params: { eventId: string; message: string }) => void;
  isPending: boolean;
}
```

Handles:
- Loading states
- Error logging via `reportError`
- Success/error callbacks

### UI Components

#### BroadcastModal
**File**: `app/src/components/notifications/BroadcastModal.tsx`

**Props**:
- `visible: boolean`
- `eventId: string`
- `onClose: () => void`

**Features**:
- Text input with 100-char limit
- Real-time character counter
- Disabled send when invalid
- Loading overlay during send
- Haptic feedback (Medium on send, Success/Error on result)
- Discard confirmation if message entered
- Success alert with recipient count

**Usage**:
```tsx
<BroadcastModal
  visible={showBroadcast}
  eventId={activeEvent.id}
  onClose={() => setShowBroadcast(false)}
/>
```

#### Home Screen Button
**File**: `app/src/app/index.tsx`

- "Notify All" button in header
- Only visible if `eventPermissions.canManageEvent`
- Opens BroadcastModal on press

### Settings Integration
**File**: `app/src/app/settings.tsx`

**Toggle**: Admin Broadcasts (default: enabled)

Users can opt-out of receiving broadcast notifications while still receiving other notification types (leader changes, milestones).

**Implementation**:
- Added to `NotificationsSection` component
- Controlled by `useNotificationPreferences` hook
- Persisted to `notification_prefs.admin_broadcasts`

### Notification Handlers
**File**: `app/src/hooks/useNotificationHandler.ts`

**Foreground Behavior**:
- Shows Alert dialog with notification title and body
- Plays sound
- Allows dismissal

**Tap Behavior**:
- `admin_broadcast`: Navigate to home screen
- `leader_change`: Navigate to home screen
- `milestone`: Navigate to history screen
- Default: Navigate to home screen

**Integration**:
Called once in `app/src/app/_layout.tsx` at app root level.

## Data Flow

```
Admin clicks "Notify All"
  → BroadcastModal opens
  → User types message (1-100 chars)
  → Clicks "Send"
  → useSendBroadcast mutation called
  → sendAdminBroadcast service function
    → Validates permissions
    → Filters opt-out users
    → Enqueues notifications
  → Success alert with count
  → Modal closes

Recipient receives notification
  → Foreground: Alert dialog shown
  → Background: Notification in tray
  → User taps notification
  → useNotificationHandler navigates to screen
```

## Testing

### Component Tests
**File**: `app/src/components/notifications/__tests__/BroadcastModal.spec.tsx`

Tests:
1. Renders when visible
2. Character counter updates
3. Send button disabled when empty
4. Send button enabled when valid (1-100 chars)

### Manual Testing Checklist
- [ ] Admin can open broadcast modal
- [ ] Non-admin cannot see "Notify All" button
- [ ] Message validation works (empty, >100 chars)
- [ ] Character counter accurate
- [ ] Send button state correct
- [ ] Loading state shows while sending
- [ ] Success alert shows recipient count
- [ ] Modal closes after send
- [ ] Recipients receive notification
- [ ] Opt-out preference respected
- [ ] Foreground notifications show alert
- [ ] Tapped notifications navigate correctly

## Security

1. **Permission Validation**: Server-side check in `sendAdminBroadcast`
   - Prevents client-side bypass
   - Only event admin/owner can broadcast

2. **Opt-out Enforcement**: Service layer filters recipients
   - Respects `notification_prefs.admin_broadcasts`
   - Cannot be bypassed

3. **Message Sanitization**: Input trimmed, length validated
   - Prevents empty messages
   - Prevents excessive length

## Performance

- **Batch Notification**: Uses Supabase edge function for efficient queuing
- **Opt-out Filtering**: Single query with join, no N+1 issues
- **React Query**: Automatic loading/error states, no manual state management

## Future Enhancements

1. **Scheduled Broadcasts**: Send at specific time
2. **Rich Content**: Support markdown, emojis, images
3. **Broadcast History**: Log of sent broadcasts
4. **Delivery Reports**: Track who received/opened
5. **Templates**: Pre-defined message templates
6. **Targeting**: Send to specific user groups
7. **Reply Capability**: Allow recipients to respond

## Maintenance

### Adding New Notification Types
1. Add template to `notificationTemplates.ts`
2. Update `useNotificationHandler` navigation logic
3. Add opt-in/opt-out toggle to settings if needed
4. Update tests

### Debugging
- Check logs via `reportError` (scope: `sendAdminBroadcast`)
- Verify device tokens in `device_tokens` table
- Check notification queue in `notifications` table
- Test with Expo Go or development build (not Expo Snack)

### Common Issues
1. **Notifications not received**: Check device token registration
2. **Permission denied**: Verify event membership role
3. **Opt-out not working**: Check `notification_prefs.admin_broadcasts` value
4. **Navigation fails**: Ensure `useNotificationHandler` is called in _layout.tsx
