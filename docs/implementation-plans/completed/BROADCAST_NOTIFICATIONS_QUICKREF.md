# Admin Broadcast Notifications - Quick Reference

## 🎯 Goal
Event admins can send quick messages to all participants (e.g., "Moving to next bar!")

## ⚡ Quick Facts
- **Scope**: MVP - simple text broadcast
- **Time**: 8-12 hours
- **Location**: Home screen button
- **Permission**: Event admins only
- **Opt-Out**: Yes, users can disable

## 📋 7 Phases

1. **Schema** (1hr) - Add admin_broadcasts preference + template
2. **Service** (2hrs) - sendAdminBroadcast() function
3. **Hook** (1hr) - useSendBroadcast() mutation
4. **UI** (3hrs) - BroadcastModal + home button
5. **Settings** (1hr) - Opt-out toggle
6. **Handlers** (2hrs) - Notification listeners
7. **Testing** (2hrs) - Tests + manual QA

## 🔑 Key Files to Create

```
app/src/
├── hooks/
│   └── useNotificationsQuery.ts       # NEW
├── components/notifications/
│   └── BroadcastModal.tsx             # NEW
└── hooks/
    └── useNotificationHandler.ts      # NEW
```

## 🔧 Key Files to Modify

```
app/src/
├── services/
│   ├── types.ts                       # Add admin_broadcasts
│   ├── notificationTemplates.ts       # Add adminBroadcast
│   └── notifications.ts               # Add sendAdminBroadcast
├── app/(tabs)/
│   └── index.tsx                      # Add "Notify All" button
├── components/settings/
│   └── NotificationsSection.tsx       # Add opt-out toggle
└── app/
    └── _layout.tsx                    # Add useNotificationHandler
```

## 💻 Core Implementation

### 1. Service Method
```typescript
sendAdminBroadcast(eventId, message, senderId)
  → validates message (1-100 chars)
  → checks sender is event admin
  → gets active members
  → filters opted-out users
  → enqueues notifications
  → returns {success, count, error?}
```

### 2. UI Flow
```typescript
// Home screen
{eventPermissions.canManageEvent && (
    <TouchableOpacity onPress={() => setShowModal(true)}>
        Notify All 📢
    </TouchableOpacity>
)}

// Modal
<BroadcastModal
    visible={showModal}
    onClose={closeModal}
    eventId={eventId}
    senderId={userId}
    eventName={name}
/>
```

### 3. Notification Template
```typescript
adminBroadcast: (message, senderName, eventId) => ({
    title: `📢 ${senderName}`,
    body: message,
    priority: 'high',
    data: { type: 'admin_broadcast', eventId }
})
```

## ✅ Success Criteria

- Event admins see "Notify All" button on home
- Modal allows 1-100 character message
- Sends to all active event members
- Filters opted-out users
- Shows success with recipient count
- Recipients get notification
- Tapping notification opens app
- All tests pass

## 🧪 Testing Checklist

- [ ] Event admin sees button
- [ ] Non-admin doesn't see button
- [ ] Message sends successfully
- [ ] Character limit enforced
- [ ] Recipients receive notification
- [ ] Opt-out works
- [ ] Permission validated on backend
- [ ] Error handling works

## 📊 Database Changes

```typescript
// NotificationPrefs type
{
    leader_change: boolean,
    milestones: number[],
    admin_broadcasts: boolean  // NEW - default true
}

// notification.type values
| 'leader_change'
| 'milestone'  
| 'admin_broadcast'  // NEW
```

## 🚀 Implementation Order

1. Add types + template (schema)
2. Implement service method
3. Create React Query hook
4. Build BroadcastModal UI
5. Add button to home screen
6. Add settings toggle
7. Add notification handlers
8. Write tests

## 📝 Quick Commands

```bash
# Run tests
npm test -- broadcastNotifications.spec.tsx

# Type check
npm run typecheck

# Lint
npm run lint
```

## 🔮 Future (Not MVP)

- Message templates
- Scheduled sends
- Broadcast history
- Read receipts
- Rich media
- Rate limiting
- Analytics

---

**Full Plan**: `docs/implementation-plans/completed/11-admin-broadcast-notifications.md`  
**Status**: Ready for implementation  
**Created**: 2026-02-13
