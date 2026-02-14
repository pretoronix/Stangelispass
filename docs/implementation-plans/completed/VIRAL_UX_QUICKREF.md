# Viral UX Features - Quick Reference

## 🎯 What We're Building

Transform event endings into shareable celebration moments that drive viral growth.

## 🚀 Core Features

### 1. MVP Recap Modal
**Trigger**: Instant when event closes  
**Design**: Gold gradient card with trophy  
**Data**: Winner name, beer count, leaderboard  
**Actions**: Share + Save to photos

### 2. Wall of Fame
**Purpose**: Permanent gallery of victories  
**Content**: All past event recaps  
**Interaction**: "Beer Clink" to toast winners  
**Social**: Real-time broadcast to squad

### 3. Beer Clink Mechanic
**Action**: Tap to toast winner  
**Feedback**: Heavy haptic vibration  
**Effect**: Counter increments, broadcasts to all  
**Limit**: One clink per user per entry

## 📊 Expected Impact

| Metric | Target | Impact |
|--------|--------|--------|
| Share rate | 60%+ | Viral growth |
| Return visits | +40% | Retention |
| Viral coefficient | 1.3+ | User acquisition |
| Clink engagement | 80%+ | Social proof |

## 🛠️ Tech Stack

- **UI**: Expo Linear Gradient, Blur View
- **Capture**: react-native-view-shot
- **Share**: expo-sharing, expo-media-library
- **Haptics**: expo-haptics
- **Real-time**: Supabase Channels
- **Animations**: React Native Reanimated

## 📁 Key Files

```
MVP Recap Modal: app/src/components/features/MVPRecapModal.tsx
Wall of Fame Screen: app/src/app/wall-of-fame.tsx
Beer Clink Hook: app/src/hooks/useBeerClink.ts
Share Utility: app/src/utils/shareImage.ts
Database Schema: app/supabase/migrations/20260211_wall_of_fame.sql
```

## 🎨 Design Specs

### MVP Card
- **Colors**: Gold gradient (#FFD700 → #FFA500 → #FF6B35)
- **Size**: 90% screen width, max 400px
- **Elements**: Trophy icon, winner name, beer count, mini leaderboard
- **Animation**: Spring scale-in (tension: 50, friction: 7)

### Wall Cards
- **Background**: White with subtle shadow
- **Layout**: Trophy + winner info + clink button
- **Spacing**: 16px padding, 16px between cards
- **Haptic**: Heavy impact on clink

## ⚡ Quick Implementation

### 1. Install Dependencies
```bash
cd app
npm install expo-media-library expo-sharing react-native-view-shot expo-blur expo-linear-gradient expo-haptics
```

### 2. Database Setup
```bash
# Run migration
npx supabase migration up 20260211_wall_of_fame
```

### 3. Wire Event Close
```typescript
// In event close handler
if (eventClosed) {
    showMVPRecapModal({
        eventName,
        winner,
        participants,
        endedAt: new Date(),
    });
}
```

### 4. Enable Sharing
```typescript
import { captureAndShareCard } from '@/utils/shareImage';

const handleShare = () => {
    captureAndShareCard(cardRef, {
        eventName,
        saveToLibrary: true,
    });
};
```

## 🧪 Testing Checklist

- [ ] Close event → Modal appears
- [ ] Share → Screenshot saved to camera roll
- [ ] Share → Native share sheet works
- [ ] Wall entry created in database
- [ ] Wall loads all past events
- [ ] Clink → Haptic fires
- [ ] Clink → Count increments
- [ ] Clink → Real-time broadcast works
- [ ] Animations run at 60fps
- [ ] Works on iOS and Android

## 🎯 User Journey

```
User finishes event
    ↓
Event closes
    ↓
🏆 MVP MODAL APPEARS (auto)
    ↓
User sees winner celebration
    ↓
User taps "Share"
    ↓
Screenshot saved + Share sheet opens
    ↓
User shares to Instagram/WhatsApp
    ↓
Entry added to Wall of Fame
    ↓
Squad members see notification
    ↓
They open app to "Clink" 🍺
    ↓
Haptic + real-time counter update
    ↓
VIRAL LOOP COMPLETE ✅
```

## 💡 Key Insights

1. **Peak Social Energy**: Capture the moment immediately after event ends
2. **Dual Distribution**: In-app (Wall) + External (Camera Roll)
3. **Squad Privacy**: Only event participants see entries
4. **Gamification**: Clinks create engagement loop
5. **Persistence**: Permanent gallery encourages return visits

## 🔐 Privacy & Security

- **RLS Policies**: Only event participants can view entries
- **Permissions**: Request camera roll access gracefully
- **Data**: No public exposure of drinking habits
- **Opt-out**: Users can skip sharing

## 📈 Success Metrics

Track in analytics:
- `modal_shown` - MVP modal displays
- `modal_shared` - User taps share
- `image_saved` - Saved to camera roll
- `wall_viewed` - User opens Wall of Fame
- `clink_sent` - User taps clink button
- `share_completed` - Native share succeeded

## 🚨 Common Issues

**Issue**: Permissions denied  
**Fix**: Graceful fallback, show educational prompt

**Issue**: Screenshot quality poor  
**Fix**: Use quality: 1, test gradients on devices

**Issue**: Clinks delayed  
**Fix**: Optimistic updates + real-time sync

**Issue**: Modal doesn't appear  
**Fix**: Verify event close trigger fires

---

**Full Plan**: `docs/implementation-plans/completed/08-viral-ux-features.md`  
**Spec**: `docs/specs/viral_ux_spec.md`
