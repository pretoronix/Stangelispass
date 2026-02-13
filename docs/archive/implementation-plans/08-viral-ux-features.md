# UX Improvement Plan: Viral Features & Social Engagement

**Based on**: `docs/specs/viral_ux_spec.md`  
**Priority**: 🔴 HIGH  
**Estimated Time**: 12-16 hours  
**Technical Complexity**: ⭐⭐⭐ Medium-High  
**ROI**: Very High (viral growth potential)

---

## Overview

Transform Stängelispass from a transactional event tracker into a shareable, social-proof engine that drives viral growth through celebration moments and social mechanics.

**Core Insight**: The moment after an event ends is peak social energy - capture it with shareable, celebratory content.

---

## Goals

1. **Viral Growth**: Drive app downloads through social sharing
2. **Engagement**: Increase return visits via Wall of Fame
3. **Social Proof**: Build credibility through squad celebrations
4. **Retention**: Create emotional attachment to achievement moments

---

## Time Breakdown

| Phase | Task | Duration | Complexity |
|-------|------|----------|------------|
| **Phase 1** | Database schema & migrations | 2 hours | Medium |
| **Phase 2** | MVP Recap Modal component | 3 hours | Medium |
| **Phase 3** | Image generation & export | 2 hours | Medium |
| **Phase 4** | Wall of Fame feature | 3 hours | Medium |
| **Phase 5** | Beer Clink social mechanic | 3 hours | High |
| **Phase 6** | Animations & haptics | 2 hours | Medium |
| **Phase 7** | Testing & polish | 3 hours | Medium |
| **Total** | | **18 hours** | **Medium-High** |

---

## Technical Implementation

### Phase 1: Database Schema (2 hours)

**New Tables**:

```sql
-- Wall of Fame entries
CREATE TABLE wall_of_fame (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    winner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    beer_count INTEGER NOT NULL,
    participants JSONB NOT NULL, -- Array of participant data
    event_name TEXT NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    image_uri TEXT, -- Saved screenshot URI
    clink_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Beer clinks (toasts)
CREATE TABLE beer_clinks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wall_entry_id UUID NOT NULL REFERENCES wall_of_fame(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wall_entry_id, user_id) -- One clink per user per entry
);

-- Indexes for performance
CREATE INDEX idx_wall_event ON wall_of_fame(event_id);
CREATE INDEX idx_wall_winner ON wall_of_fame(winner_id);
CREATE INDEX idx_clinks_entry ON beer_clinks(wall_entry_id);

-- RLS Policies
ALTER TABLE wall_of_fame ENABLE ROW LEVEL SECURITY;
ALTER TABLE beer_clinks ENABLE ROW LEVEL SECURITY;

-- Users can view wall entries for events they participated in
CREATE POLICY "View own event walls" ON wall_of_fame
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM event_memberships
            WHERE event_memberships.event_id = wall_of_fame.event_id
            AND event_memberships.user_id = auth.uid()
            AND event_memberships.status = 'active'
        )
    );

-- Users can create wall entries for events they own
CREATE POLICY "Create wall entries" ON wall_of_fame
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = wall_of_fame.event_id
            AND events.created_by = auth.uid()
        )
    );

-- Users can clink any wall entry they can view
CREATE POLICY "Create clinks" ON beer_clinks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM wall_of_fame wof
            JOIN event_memberships em ON em.event_id = wof.event_id
            WHERE wof.id = beer_clinks.wall_entry_id
            AND em.user_id = auth.uid()
            AND em.status = 'active'
        )
    );
```

**Migration File**: `app/supabase/migrations/20260211_wall_of_fame.sql`

---

### Phase 2: MVP Recap Modal (3 hours)

**File**: `app/src/components/features/MVPRecapModal.tsx`

```typescript
import React, { useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface MVPRecapModalProps {
    visible: boolean;
    onClose: () => void;
    eventData: {
        eventName: string;
        winner: {
            id: string;
            name: string;
            beerCount: number;
            avatar?: string;
        };
        participants: Array<{
            id: string;
            name: string;
            beerCount: number;
        }>;
        endedAt: Date;
    };
    onShare: () => void;
}

export function MVPRecapModal({
    visible,
    onClose,
    eventData,
    onShare,
}: MVPRecapModalProps) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    
    React.useEffect(() => {
        if (visible) {
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            );
            
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);
    
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={90} style={styles.backdrop}>
                <Animated.View
                    style={[
                        styles.cardContainer,
                        { transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    <LinearGradient
                        colors={['#FFD700', '#FFA500', '#FF6B35']}
                        style={styles.card}
                    >
                        {/* Trophy Icon */}
                        <View style={styles.trophyContainer}>
                            <Ionicons
                                name="trophy"
                                size={80}
                                color="#FFF"
                            />
                        </View>
                        
                        {/* Title */}
                        <Text style={styles.title}>
                            🍺 Brewmaster of the Night
                        </Text>
                        
                        {/* Winner Info */}
                        <View style={styles.winnerSection}>
                            <Text style={styles.winnerName}>
                                {eventData.winner.name}
                            </Text>
                            <Text style={styles.beerCount}>
                                {eventData.winner.beerCount} beers
                            </Text>
                        </View>
                        
                        {/* Event Info */}
                        <View style={styles.eventInfo}>
                            <Text style={styles.eventName}>
                                {eventData.eventName}
                            </Text>
                            <Text style={styles.date}>
                                {eventData.endedAt.toLocaleDateString()}
                            </Text>
                        </View>
                        
                        {/* Leaderboard Preview */}
                        <View style={styles.leaderboard}>
                            {eventData.participants.slice(0, 3).map((p, i) => (
                                <View key={p.id} style={styles.leaderboardRow}>
                                    <Text style={styles.rank}>#{i + 1}</Text>
                                    <Text style={styles.playerName}>{p.name}</Text>
                                    <Text style={styles.playerCount}>
                                        {p.beerCount} 🍺
                                    </Text>
                                </View>
                            ))}
                        </View>
                        
                        {/* Actions */}
                        <View style={styles.actions}>
                            <Pressable
                                style={styles.shareButton}
                                onPress={onShare}
                            >
                                <Ionicons name="share-social" size={24} color="#FFF" />
                                <Text style={styles.shareText}>Share</Text>
                            </Pressable>
                            
                            <Pressable
                                style={styles.closeButton}
                                onPress={onClose}
                            >
                                <Text style={styles.closeText}>Close</Text>
                            </Pressable>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    cardContainer: {
        width: '90%',
        maxWidth: 400,
    },
    card: {
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    trophyContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 24,
        textAlign: 'center',
    },
    winnerSection: {
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 20,
        borderRadius: 16,
        width: '100%',
    },
    winnerName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    beerCount: {
        fontSize: 20,
        color: '#FFF',
        fontWeight: '600',
    },
    eventInfo: {
        alignItems: 'center',
        marginBottom: 24,
    },
    eventName: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
        marginBottom: 4,
    },
    date: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    leaderboard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    leaderboardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    rank: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        width: 40,
    },
    playerName: {
        fontSize: 16,
        color: '#FFF',
        flex: 1,
    },
    playerCount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    shareButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    shareText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
});
```

---

### Phase 3: Image Generation & Export (2 hours)

**File**: `app/src/utils/shareImage.ts`

```typescript
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Alert } from 'react-native';

export async function captureAndShareCard(
    viewRef: React.RefObject<any>,
    options: {
        eventName: string;
        saveToLibrary?: boolean;
    }
): Promise<{ success: boolean; uri?: string }> {
    try {
        // Capture the view as image
        const uri = await captureRef(viewRef, {
            format: 'png',
            quality: 1,
            result: 'tmpfile',
        });
        
        // Save to camera roll if requested
        if (options.saveToLibrary) {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            
            if (status === 'granted') {
                await MediaLibrary.saveToLibraryAsync(uri);
                Alert.alert(
                    'Saved!',
                    'Your Brewmaster card has been saved to your photos.',
                    [{ text: 'OK' }]
                );
            }
        }
        
        // Share via native share sheet
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: `Share ${options.eventName} Results`,
            });
        }
        
        return { success: true, uri };
    } catch (error) {
        console.error('Failed to share image:', error);
        Alert.alert('Error', 'Failed to share image. Please try again.');
        return { success: false };
    }
}
```

---

### Phase 4: Wall of Fame (3 hours)

**File**: `app/src/app/wall-of-fame.tsx`

```typescript
import React from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Pressable,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getWallOfFame } from '@/services/wallOfFame';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function WallOfFameScreen() {
    const { data: entries, isLoading } = useQuery({
        queryKey: ['wall-of-fame'],
        queryFn: getWallOfFame,
    });
    
    const handleClink = async (entryId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        // Trigger clink mutation
    };
    
    return (
        <View style={styles.container}>
            <Text style={styles.header}>🏆 Wall of Fame</Text>
            
            <FlatList
                data={entries}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.eventName}>
                                {item.eventName}
                            </Text>
                            <Text style={styles.date}>
                                {new Date(item.endedAt).toLocaleDateString()}
                            </Text>
                        </View>
                        
                        <View style={styles.winnerSection}>
                            <Ionicons name="trophy" size={40} color="#FFD700" />
                            <View style={styles.winnerInfo}>
                                <Text style={styles.winnerName}>
                                    {item.winnerName}
                                </Text>
                                <Text style={styles.beerCount}>
                                    {item.beerCount} beers
                                </Text>
                            </View>
                        </View>
                        
                        <Pressable
                            style={styles.clinkButton}
                            onPress={() => handleClink(item.id)}
                        >
                            <Ionicons name="beer" size={24} color="#FF6B35" />
                            <Text style={styles.clinkText}>
                                Clink! ({item.clinkCount})
                            </Text>
                        </Pressable>
                    </View>
                )}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        padding: 20,
        textAlign: 'center',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        marginBottom: 16,
    },
    eventName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    date: {
        fontSize: 14,
        color: '#666',
    },
    winnerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    winnerInfo: {
        flex: 1,
    },
    winnerName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    beerCount: {
        fontSize: 16,
        color: '#666',
    },
    clinkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    clinkText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF6B35',
    },
});
```

---

### Phase 5: Beer Clink Mechanic (3 hours)

**File**: `app/src/hooks/useBeerClink.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/client';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';

export function useBeerClink(wallEntryId: string) {
    const queryClient = useQueryClient();
    
    // Subscribe to real-time clinks
    useEffect(() => {
        const channel = supabase
            .channel(`clinks:${wallEntryId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'beer_clinks',
                    filter: `wall_entry_id=eq.${wallEntryId}`,
                },
                (payload) => {
                    // Trigger haptic on remote clink
                    Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Medium
                    );
                    
                    // Update local count
                    queryClient.invalidateQueries({
                        queryKey: ['wall-of-fame', wallEntryId],
                    });
                }
            )
            .subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, [wallEntryId]);
    
    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('beer_clinks')
                .insert({
                    wall_entry_id: wallEntryId,
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                });
            
            if (error) throw error;
            
            // Haptic feedback
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['wall-of-fame'],
            });
        },
    });
}
```

---

## Success Metrics

### Primary Metrics
- **Shares per event**: Target 60%+ share rate
- **Return visits**: +40% return to Wall of Fame
- **Viral coefficient**: 1.3+ (each user brings 1.3 new users)

### Secondary Metrics
- **Clink engagement**: 80%+ of participants clink winners
- **Screenshot rate**: 70%+ save to camera roll
- **Time in app**: +25% from Wall of Fame browsing

---

## User Flows

### 1. Event End → Share Flow
```
Event Closes
  ↓
MVP Recap Modal appears (auto)
  ↓
User sees winner celebration
  ↓
[Share] → Native share sheet → Social media
  ↓
[Save] → Camera roll (with permission)
  ↓
Entry added to Wall of Fame
```

### 2. Wall of Fame Engagement
```
User opens Wall tab
  ↓
Sees all squad victories
  ↓
Taps "Clink" on entry
  ↓
Haptic feedback + count increments
  ↓
Real-time broadcast to all participants
```

---

## Testing Strategy

### Manual Testing
1. **Recap Modal**:
   - Close event → Modal appears
   - Verify winner data correct
   - Test share → Screenshot saved
   - Verify Wall entry created

2. **Wall of Fame**:
   - View all entries
   - Test clink → Haptic fires
   - Verify count increments
   - Test real-time updates

3. **Permissions**:
   - Camera roll permission flow
   - Share permission flow
   - Test denial cases

### Automated Testing
```typescript
describe('MVP Recap', () => {
    it('shows modal on event close', () => {});
    it('displays correct winner', () => {});
    it('saves to wall of fame', () => {});
});

describe('Beer Clink', () => {
    it('increments count', () => {});
    it('triggers haptic', () => {});
    it('broadcasts real-time', () => {});
});
```

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Permission denied | High | Medium | Graceful fallback, re-prompt strategy |
| Poor screenshot quality | Medium | High | Test on multiple devices, optimize gradients |
| Clink spam | Medium | Low | Rate limiting, one clink per user |
| Real-time delays | Low | Medium | Optimistic updates, retry logic |

---

## Dependencies

**NPM Packages**:
```bash
npm install expo-media-library
npm install expo-sharing
npm install react-native-view-shot
npm install expo-blur
npm install expo-linear-gradient
npm install expo-haptics
```

**Permissions** (app.json):
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSPhotoLibraryAddUsageDescription": "Save your Brewmaster victories!",
        "NSPhotoLibraryUsageDescription": "Access your saved victories"
      }
    },
    "android": {
      "permissions": [
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

---

## Future Enhancements

1. **Animated Confetti**: Celebration effects on modal appear
2. **Personalized Messages**: Dynamic congratulations text
3. **Squad Challenges**: Challenge other squads to beat score
4. **Seasonal Themes**: Holiday-themed MVP cards
5. **Video Clips**: Short video recap instead of static image
6. **Social Integration**: Direct post to Instagram/Twitter
7. **Achievement Badges**: Unlock special designs for milestones

---

## Files Structure

```
app/
├── src/
│   ├── components/
│   │   └── features/
│   │       ├── MVPRecapModal.tsx
│   │       └── WallOfFameCard.tsx
│   ├── hooks/
│   │   ├── useBeerClink.ts
│   │   └── useWallOfFame.ts
│   ├── services/
│   │   └── wallOfFame.ts
│   ├── utils/
│   │   └── shareImage.ts
│   └── app/
│       └── wall-of-fame.tsx
└── supabase/
    └── migrations/
        └── 20260211_wall_of_fame.sql
```

---

## Implementation Checklist

### Phase 1: Database (2 hours)
- [ ] Create wall_of_fame table
- [ ] Create beer_clinks table
- [ ] Add RLS policies
- [ ] Test migrations locally
- [ ] Deploy to production

### Phase 2: MVP Modal (3 hours)
- [ ] Create MVPRecapModal component
- [ ] Add gradient styling
- [ ] Implement animations
- [ ] Add haptic feedback
- [ ] Wire to event close trigger

### Phase 3: Sharing (2 hours)
- [ ] Install required packages
- [ ] Implement view capture
- [ ] Add camera roll save
- [ ] Add native share
- [ ] Handle permissions

### Phase 4: Wall of Fame (3 hours)
- [ ] Create wall-of-fame screen
- [ ] Fetch entries query
- [ ] Display cards
- [ ] Add navigation
- [ ] Style components

### Phase 5: Clinks (3 hours)
- [ ] Implement clink mutation
- [ ] Add real-time subscription
- [ ] Haptic feedback
- [ ] Optimistic updates
- [ ] Broadcast to squad

### Phase 6: Polish (2 hours)
- [ ] Test all animations at 60fps
- [ ] Verify haptics on iOS/Android
- [ ] Test on various screen sizes
- [ ] Accessibility labels
- [ ] Error handling

### Phase 7: Testing (3 hours)
- [ ] Unit tests for hooks
- [ ] Integration tests for flows
- [ ] Manual QA on devices
- [ ] Permission edge cases
- [ ] Performance profiling

---

## Success Criteria

- ✅ Modal appears instantly on event close
- ✅ Screenshot quality optimized for social media
- ✅ Share success rate >80%
- ✅ Wall of Fame loads <500ms
- ✅ Clinks broadcast in real-time (<1s delay)
- ✅ Animations maintain 60fps
- ✅ All tests pass
- ✅ Works offline (cached wall)

---

**Ready for implementation!** 🚀
