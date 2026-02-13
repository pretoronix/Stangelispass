# Admin Broadcast Notifications - MVP Implementation Plan

**Priority**: 🔴 HIGH  
**Estimated Time**: 8-12 hours (1.5 days)  
**Approach**: Simple text broadcast to all event members  
**User Story**: "As an event admin, I want to send a quick message to all participants so we can coordinate (e.g., 'moving to the next bar')"

---

## Executive Summary

Implement a broadcast notification feature that allows event admins to send short text messages to all active event members. This builds on the existing notification infrastructure (expo-notifications, device_tokens table, notification queue).

**Key Features**:
- Simple text input (max 100 characters)
- Send to all active event members
- Event admin permission required
- Users can opt-out via settings
- One-tap send from home screen
- Visual confirmation of delivery

**Why This Works**: Existing notification infrastructure handles the hard parts (device tokens, queue processing, Expo push API). We just need to add the UI and admin broadcast logic.

---

## Selected Requirements

Based on user preferences:
- ✅ **Scope**: Quick MVP (simple text broadcast, 8-12 hours)
- ✅ **Location**: Home screen (quick access for admins)
- ✅ **Permissions**: Event admins only (those with admin role in current event)
- ✅ **Opt-Out**: Yes - users can disable event notifications

---

## Current State Analysis

### ✅ What We Have
- `expo-notifications` v0.32.16 installed
- Device token registration working
- `device_tokens` table in database
- `notifications` queue table
- `notificationProcessor.ts` for batch sending
- `notificationTemplates.ts` for message formatting
- User notification preferences infrastructure
- Event roles and permissions system

### 🎯 What's Needed
- Broadcast notification type in templates
- Admin UI for composing message
- Service method to enqueue broadcast
- Permission check (event admin only)
- User opt-out preference
- Notification listener/handler in app
- Visual feedback on send
- Tests

---

## Technical Approach

### Architecture
```
Admin taps "Notify All" (Home screen)
    ↓
Check permissions (event admin?)
    ↓
Show modal with text input
    ↓
Admin enters message (max 100 chars)
    ↓
Confirm send
    ↓
Backend validates permissions
    ↓
Enqueue for all event members
    ↓
Filter out opted-out users
    ↓
Batch processor sends via Expo
    ↓
Show success confirmation
```

### Database Flow
```sql
-- 1. Find all event members
SELECT user_id FROM event_memberships 
WHERE event_id = ? AND is_active = true

-- 2. Get device tokens (filtered by opt-in)
SELECT dt.token FROM device_tokens dt
JOIN users u ON u.id = dt.user_id
WHERE u.id IN (members)
  AND u.notification_prefs->>'admin_broadcasts' != 'false'

-- 3. Enqueue notifications
INSERT INTO notifications (user_id, type, payload)
VALUES (each member, 'admin_broadcast', message_data)
```

---

## Implementation Phases

See detailed checklist below for all tasks.

### Phase 1: Database Schema (1 hour)
- Add `admin_broadcasts` preference type
- Update default preferences
- Add broadcast notification template

### Phase 2: Service Layer (2 hours)
- Implement `sendAdminBroadcast()` function
- Add permission validation
- Add opt-out filtering
- Error handling

### Phase 3: React Query Hook (1 hour)
- Create `useNotificationsQuery.ts`
- Implement `useSendBroadcast()` mutation
- Error logging

### Phase 4: UI Components (3 hours)
- Create `BroadcastModal` component
- Add "Notify All" button to home screen
- Permission-based visibility

### Phase 5: Settings Integration (1 hour)
- Add opt-out toggle
- Wire up to existing preferences

### Phase 6: Notification Handling (2 hours)
- Create notification listener hook
- Handle foreground notifications
- Handle notification taps

### Phase 7: Testing & Polish (2 hours)
- Unit tests
- Manual testing
- Bug fixes

---

## Detailed Workplan

### Phase 1: Schema Updates ✅ (1 hour)

#### Task 1.1: Update NotificationPrefs Type
**File**: `app/src/services/types.ts`

```typescript
export type NotificationPrefs = {
    leader_change: boolean;
    milestones: number[];
    admin_broadcasts: boolean; // NEW
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
    leader_change: true,
    milestones: [5, 10, 20],
    admin_broadcasts: true, // NEW
};
```

#### Task 1.2: Add Broadcast Template
**File**: `app/src/services/notificationTemplates.ts`

```typescript
adminBroadcast: (message: string, senderName: string, eventId?: string): NotificationTemplate => ({
    title: `📢 ${senderName}`,
    body: message,
    sound: 'default',
    priority: 'high',
    data: {
        type: 'admin_broadcast',
        eventId,
        sender: senderName,
    },
}),
```

**Checklist**:
- [ ] Add admin_broadcasts to NotificationPrefs
- [ ] Update DEFAULT_NOTIFICATION_PREFS
- [ ] Add adminBroadcast template
- [ ] Test type compilation

---

### Phase 2: Service Layer ✅ (2 hours)

#### Task 2.1: Create Broadcast Service
**File**: `app/src/services/notifications.ts`

```typescript
export async function sendAdminBroadcast(
    eventId: string,
    message: string,
    senderId: string
): Promise<{ success: boolean; count: number; error?: string }> {
    // 1. Validate message (1-100 chars)
    // 2. Check sender is event admin
    // 3. Get sender name
    // 4. Get all active members (except sender)
    // 5. Filter by opt-in preference
    // 6. Create notification template
    // 7. Enqueue notifications
    // 8. Return result
}
```

**Checklist**:
- [ ] Implement sendAdminBroadcast function
- [ ] Add message validation
- [ ] Add permission check
- [ ] Add opt-out filtering
- [ ] Add error handling
- [ ] Export from index.ts
- [ ] Test with mock data

---

### Phase 3: React Query Hook ✅ (1 hour)

#### Task 3.1: Create Mutation Hook
**File**: `app/src/hooks/useNotificationsQuery.ts` (new)

```typescript
export function useSendBroadcast() {
    return useMutation({
        mutationFn: async ({ eventId, message, senderId }) => {
            return await sendAdminBroadcast(eventId, message, senderId);
        },
        onSuccess: (data) => {
            if (!data.success) {
                reportError(new Error(data.error || 'Broadcast failed'));
            }
        },
    });
}
```

**Checklist**:
- [ ] Create useNotificationsQuery.ts
- [ ] Implement useSendBroadcast
- [ ] Add error logging
- [ ] Test mutation

---

### Phase 4: UI Components ✅ (3 hours)

#### Task 4.1: Broadcast Modal
**File**: `app/src/components/notifications/BroadcastModal.tsx` (new)

Features:
- Text input with character counter (0-100)
- Send/Cancel buttons
- Loading state
- Success/error alerts
- Haptic feedback

**Checklist**:
- [ ] Create BroadcastModal component
- [ ] Add message input
- [ ] Add character counter
- [ ] Add send/cancel buttons
- [ ] Add loading state
- [ ] Add success feedback
- [ ] Add error handling

#### Task 4.2: Home Screen Integration
**File**: `app/src/app/(tabs)/index.tsx`

```typescript
{eventPermissions.canManageEvent && activeEvent && (
    <TouchableOpacity onPress={() => setShowBroadcastModal(true)}>
        <Ionicons name="megaphone-outline" />
        <Text>Notify All</Text>
    </TouchableOpacity>
)}

<BroadcastModal
    visible={showBroadcastModal}
    onClose={() => setShowBroadcastModal(false)}
    eventId={activeEvent.id}
    senderId={currentUser.id}
    eventName={activeEvent.name}
/>
```

**Checklist**:
- [ ] Add "Notify All" button
- [ ] Add permission check
- [ ] Add modal state
- [ ] Integrate BroadcastModal
- [ ] Test UI flow

---

### Phase 5: Settings Integration ✅ (1 hour)

#### Task 5.1: Add Opt-Out Toggle
**File**: `app/src/components/settings/NotificationsSection.tsx`

```typescript
<Switch
    value={notificationPrefs.admin_broadcasts !== false}
    onValueChange={(value) => handleTogglePref('admin_broadcasts', value)}
/>
```

**Checklist**:
- [ ] Add admin_broadcasts toggle
- [ ] Wire to preference handler
- [ ] Test persistence
- [ ] Add accessibility labels

---

### Phase 6: Notification Handlers ✅ (2 hours)

#### Task 6.1: Create Handler Hook
**File**: `app/src/hooks/useNotificationHandler.ts` (new)

```typescript
export function useNotificationHandler() {
    useEffect(() => {
        // Handle received (foreground)
        const received = Notifications.addNotificationReceivedListener((notif) => {
            if (notif.request.content.data?.type === 'admin_broadcast') {
                Alert.alert(title, body);
            }
        });
        
        // Handle tapped
        const response = Notifications.addNotificationResponseReceivedListener((resp) => {
            // Navigate to home
        });
        
        return () => {
            received.remove();
            response.remove();
        };
    }, []);
}
```

**Checklist**:
- [ ] Create useNotificationHandler
- [ ] Handle foreground notifications
- [ ] Handle tapped notifications
- [ ] Add navigation logic
- [ ] Integrate in _layout.tsx

---

### Phase 7: Testing & Polish ✅ (2 hours)

#### Task 7.1: Unit Tests
**File**: `app/src/__tests__/broadcastNotifications.spec.tsx` (new)

Tests:
- Modal renders correctly
- Message validation
- Character counter
- Send mutation
- Error handling

**Checklist**:
- [ ] Write component tests
- [ ] Write service tests
- [ ] Test permission checks
- [ ] Test opt-out filtering

#### Task 7.2: Manual Testing
- [ ] Event admin sees button
- [ ] Non-admin doesn't see button
- [ ] Modal opens/closes
- [ ] Message sends successfully
- [ ] Recipients receive notification
- [ ] Tapping opens app
- [ ] Opt-out works
- [ ] Permission validation works

#### Task 7.3: Documentation
- [ ] Add to AGENTS.md if needed
- [ ] Update HIGH_PRIORITY_REFACTORING.md
- [ ] Add inline code comments

---

## Success Criteria

- ✅ Event admins can send broadcasts from home screen
- ✅ Only event admins see the "Notify All" button
- ✅ Message limited to 100 characters
- ✅ All active event members receive notification
- ✅ Users can opt-out via settings
- ✅ Sender receives confirmation with recipient count
- ✅ Recipients can tap notification to open app
- ✅ Foreground notifications show as alerts
- ✅ All tests pass
- ✅ No permission bypass vulnerabilities

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Permission bypass | High | Backend validates event admin role |
| Spam/abuse | Medium | Consider rate limiting in future |
| Delivery failure | Medium | Queue + retry logic already exists |
| Opt-out not respected | Medium | Filter before enqueue, test thoroughly |
| Network errors | Low | Graceful error handling, user feedback |

---

## Future Enhancements (Out of Scope)

Not included in MVP:
- Message templates/quick replies
- Scheduled broadcasts
- Broadcast history
- Read receipts
- Rich media (images, links)
- Reply functionality
- Rate limiting
- Analytics

---

## Timeline

| Phase | Hours |
|-------|-------|
| Schema | 1 |
| Service | 2 |
| Hook | 1 |
| UI | 3 |
| Settings | 1 |
| Handlers | 2 |
| Testing | 2 |
| **Total** | **12** |

---

## Notes

- Leverages existing notification infrastructure
- Backend permission validation prevents abuse
- Default opt-in, users can disable
- 100 char limit keeps messages concise
- No history tracking in MVP
- Immediate send only (no scheduling)

---

**Status**: ⏳ Ready for Implementation  
**Created**: 2026-02-13  
**Dependencies**: None (uses existing infrastructure)  
**Risk**: Low
