# Implementation Plan: Push Notifications

**Priority**: 🔴 HIGH  
**Estimated Time**: 3-4 days  
**Technical Complexity**: ⭐⭐⭐ Medium  
**ROI**: Very High (80% infrastructure exists)

---

## Overview

Enable real-time push notifications for key events like leader changes, new rounds, and milestone achievements.

## Current State

✅ Already Implemented:
- `expo-notifications` package installed
- `services/notifications.ts` exists
- `notificationProcessor.ts` for logic
- `device_tokens` table in schema
- User notification preferences in database

⏳ Missing:
- Supabase Edge Function for webhook triggers
- Device token registration flow
- Notification sending logic

---

## Time Breakdown

| Task | Duration | Complexity |
|------|----------|------------|
| Device token registration | 3 hours | Low |
| Supabase Edge Function setup | 4 hours | Medium |
| Webhook configuration | 2 hours | Medium |
| Notification templates | 2 hours | Low |
| Permission handling | 2 hours | Low |
| Testing & debugging | 8 hours | Medium |
| **Total** | **21 hours (3 days)** | **Medium** |

---

## Technical Implementation

### Phase 1: Device Token Registration (3 hours)

**File**: `app/src/hooks/useNotifications.ts` (new)

```typescript
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';

export function useNotifications(userId: string | null) {
    const [token, setToken] = useState<string | null>(null);
    
    useEffect(() => {
        if (!userId) return;
        
        registerForPushNotifications();
    }, [userId]);
    
    async function registerForPushNotifications() {
        // 1. Request permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;
        
        // 2. Get push token
        const tokenData = await Notifications.getExpoPushTokenAsync();
        setToken(tokenData.data);
        
        // 3. Save to Supabase
        await supabase.from('device_tokens').upsert({
            user_id: userId,
            token: tokenData.data,
            platform: Platform.OS,
        });
    }
    
    return { token };
}
```

**Integration**: Add to `AppProvider.tsx`

### Phase 2: Supabase Edge Function (4 hours)

**File**: `supabase/functions/send-notification/index.ts` (new)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
    const { type, data } = await req.json();
    
    // Determine notification based on type
    let title = '';
    let body = '';
    let userIds: string[] = [];
    
    switch (type) {
        case 'leader_change':
            title = '👑 New Leader!';
            body = `${data.userName} just took the lead!`;
            // Send to all event members
            userIds = await getEventMemberIds(data.eventId);
            break;
            
        case 'new_round':
            title = '🍺 New Round Started';
            body = `${data.eventName} has begun!`;
            userIds = await getAllUserIds();
            break;
            
        case 'milestone':
            title = '🏆 Milestone Reached!';
            body = `${data.userName} hit ${data.count} beers!`;
            userIds = await getEventMemberIds(data.eventId);
            break;
    }
    
    // Get device tokens
    const tokens = await getDeviceTokens(userIds);
    
    // Send notifications via Expo Push API
    await sendPushNotifications(tokens, { title, body, data });
    
    return new Response('OK', { status: 200 });
});
```

**Setup Commands**:
```bash
cd supabase/functions
deno init send-notification
# Deploy
supabase functions deploy send-notification --no-verify-jwt
```

### Phase 3: Database Webhooks (2 hours)

**SQL Migration**: `supabase/migrations/YYYYMMDD_notification_webhooks.sql`

```sql
-- Trigger on leader change
CREATE OR REPLACE FUNCTION notify_leader_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://[project-ref].supabase.co/functions/v1/send-notification',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
            'type', 'leader_change',
            'data', jsonb_build_object(
                'eventId', NEW.event_id,
                'userId', NEW.user_id,
                'userName', (SELECT name FROM users WHERE id = NEW.user_id)
            )
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_leader_change
AFTER UPDATE ON event_leader_state
FOR EACH ROW
WHEN (OLD.user_id IS DISTINCT FROM NEW.user_id)
EXECUTE FUNCTION notify_leader_change();

-- Trigger on new beer (for milestones)
CREATE OR REPLACE FUNCTION check_milestone_notification()
RETURNS TRIGGER AS $$
DECLARE
    total_count INT;
BEGIN
    -- Get total count for user
    SELECT COUNT(*) INTO total_count
    FROM beers
    WHERE user_id = NEW.user_id;
    
    -- Check if milestone (5, 10, 20, etc.)
    IF total_count IN (5, 10, 20, 50, 100) THEN
        PERFORM net.http_post(
            url := 'https://[project-ref].supabase.co/functions/v1/send-notification',
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := jsonb_build_object(
                'type', 'milestone',
                'data', jsonb_build_object(
                    'eventId', NEW.event_id,
                    'userId', NEW.user_id,
                    'userName', (SELECT name FROM users WHERE id = NEW.user_id),
                    'count', total_count
                )
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_beer_milestone
AFTER INSERT ON beers
FOR EACH ROW
EXECUTE FUNCTION check_milestone_notification();
```

### Phase 4: Notification Templates (2 hours)

**File**: `app/src/services/notificationTemplates.ts` (new)

```typescript
export const NotificationTemplates = {
    leaderChange: (userName: string) => ({
        title: '👑 New Leader!',
        body: `${userName} just took the lead!`,
        sound: 'default',
        priority: 'high',
    }),
    
    newRound: (eventName: string) => ({
        title: '🍺 New Round Started',
        body: `${eventName} has begun! Time to drink!`,
        sound: 'default',
        priority: 'normal',
    }),
    
    milestone: (userName: string, count: number) => ({
        title: '🎉 Milestone Reached!',
        body: `${userName} just hit ${count} beers!`,
        sound: 'default',
        priority: 'normal',
    }),
    
    newBadge: (badgeName: string) => ({
        title: '🏆 New Achievement!',
        body: `You unlocked: ${badgeName}`,
        sound: 'default',
        priority: 'high',
    }),
};
```

### Phase 5: Permission Handling (2 hours)

**File**: Update `app/src/app/settings.tsx`

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function NotificationSettings() {
    const { currentUser } = useApp();
    const { token } = useNotifications(currentUser?.id || null);
    const [settings, setSettings] = useState({
        leaderChange: true,
        milestones: true,
        newRound: true,
    });
    
    const updatePreferences = async (newSettings) => {
        await updateUser(currentUser.id, {
            notification_prefs: {
                leader_change: newSettings.leaderChange,
                milestones: newSettings.milestones ? [5, 10, 20, 50] : [],
            },
        });
    };
    
    return (
        <View>
            <Text>Push Notifications</Text>
            <Switch 
                value={settings.leaderChange}
                onValueChange={(v) => {
                    setSettings({ ...settings, leaderChange: v });
                    updatePreferences({ ...settings, leaderChange: v });
                }}
            />
            {/* More settings */}
        </View>
    );
}
```

---

## Testing Strategy

### Manual Testing
1. Register device token on app launch
2. Trigger leader change by logging beers
3. Verify notification received
4. Test notification preferences
5. Test on iOS and Android

### Automated Testing
```typescript
// __tests__/notifications.spec.ts
describe('Notifications', () => {
    it('should register device token', async () => {
        const { token } = await registerForPushNotifications(userId);
        expect(token).toBeTruthy();
    });
    
    it('should respect user preferences', async () => {
        // Mock user with notifications disabled
        const shouldSend = checkNotificationPreferences(user, 'leader_change');
        expect(shouldSend).toBe(false);
    });
});
```

---

## Dependencies

- ✅ `expo-notifications` (already installed)
- ⏳ Supabase CLI (for Edge Functions)
- ⏳ Expo Push API credentials

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| iOS/Android permission differences | Medium | Medium | Test on both platforms early |
| Rate limiting on Expo Push API | Low | High | Implement batching for bulk sends |
| Database webhook failures | Low | Medium | Add retry logic and dead letter queue |
| User spam | Medium | Low | Add frequency limits per user |

---

## Rollout Plan

### Week 1
- Day 1-2: Implement device token registration
- Day 3: Set up Supabase Edge Function
- Day 4: Configure database webhooks

### Week 2
- Day 1: Create notification templates
- Day 2: Add settings UI
- Day 3: Testing & bug fixes
- Day 4: Deploy to production

### Metrics to Track
- Notification delivery rate
- Open rate
- Opt-out rate
- User engagement after notifications

---

## Future Enhancements

1. **Rich Notifications**: Images, actions, categories
2. **Scheduled Notifications**: "Your round expires in 1 hour"
3. **Notification History**: In-app inbox
4. **Custom Sounds**: Per notification type
5. **Deep Linking**: Open specific screen on tap

---

## Success Criteria

- ✅ 95%+ notification delivery rate
- ✅ Device tokens registered for all active users
- ✅ < 5% opt-out rate
- ✅ No spam complaints
- ✅ Average notification open rate > 30%
