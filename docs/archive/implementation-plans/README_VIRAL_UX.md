# Viral UX Implementation - Overview

## 📚 Documentation Suite

This folder contains comprehensive documentation for implementing viral features in Stängelispass.

### Main Documents

1. **[08-viral-ux-features.md](./08-viral-ux-features.md)** (25KB)
   - Complete implementation plan
   - Technical specifications
   - Code examples for all components
   - Database schema
   - Testing strategy
   - Success metrics

2. **[VIRAL_UX_QUICKREF.md](./VIRAL_UX_QUICKREF.md)** (4.8KB)
   - Quick reference guide
   - Core features summary
   - Key files location
   - Implementation checklist
   - Common issues & fixes

3. **[VIRAL_UX_DESIGN_MOCKUPS.md](./VIRAL_UX_DESIGN_MOCKUPS.md)** (8.9KB)
   - Visual design specifications
   - ASCII mockups
   - Animation sequences
   - Typography & spacing
   - Color palette
   - Haptic patterns

### Source Specification

Based on: **[docs/specs/viral_ux_spec.md](../../specs/viral_ux_spec.md)**

---

## 🎯 What We're Building

### 1. MVP Recap Modal
**The Moment**: Instantly when an event closes  
**The Experience**: Celebratory gold-gradient card showing the "Brewmaster of the Night"  
**The Action**: Share to social media + save to camera roll  
**The Goal**: Turn event endings into shareable viral moments

### 2. Wall of Fame
**The Moment**: Anytime, permanent gallery  
**The Experience**: Browse all past squad victories  
**The Action**: "Clink" to toast winners with haptic feedback  
**The Goal**: Increase return visits and engagement

### 3. Beer Clink Mechanic
**The Moment**: When viewing Wall of Fame entries  
**The Experience**: Tap button → Heavy haptic → Real-time broadcast to squad  
**The Action**: Social acknowledgment of victories  
**The Goal**: Create engagement loops

---

## 📊 Expected Impact

| Metric | Target |
|--------|--------|
| Share rate | **60%+** of events shared |
| Return visits | **+40%** from Wall browsing |
| Viral coefficient | **1.3+** users per user |
| Clink engagement | **80%+** participants toast |

---

## 🛠️ Tech Stack

- **UI**: Expo Linear Gradient, Blur View
- **Capture**: react-native-view-shot
- **Share**: expo-sharing, expo-media-library
- **Haptics**: expo-haptics (iOS/Android)
- **Real-time**: Supabase Channels
- **Animations**: React Native Reanimated
- **State**: React Query with optimistic updates

---

## 📁 File Structure

```
app/
├── src/
│   ├── components/features/
│   │   ├── MVPRecapModal.tsx          ← Main celebration modal
│   │   └── WallOfFameCard.tsx         ← Wall entry display
│   ├── hooks/
│   │   ├── useBeerClink.ts            ← Clink mutation + real-time
│   │   └── useWallOfFame.ts           ← Wall data fetching
│   ├── services/
│   │   └── wallOfFame.ts              ← API layer
│   ├── utils/
│   │   └── shareImage.ts              ← Screenshot & share logic
│   └── app/
│       └── wall-of-fame.tsx           ← Wall of Fame screen
└── supabase/
    └── migrations/
        └── 20260211_wall_of_fame.sql  ← Database schema
```

---

## ⏱️ Implementation Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Database schema | 2 hours | ⏳ Not started |
| MVP Recap Modal | 3 hours | ⏳ Not started |
| Image generation | 2 hours | ⏳ Not started |
| Wall of Fame | 3 hours | ⏳ Not started |
| Beer Clinks | 3 hours | ⏳ Not started |
| Animations | 2 hours | ⏳ Not started |
| Testing | 3 hours | ⏳ Not started |
| **Total** | **18 hours** | |

---

## 🚀 Quick Start

### 1. Review Documentation
```bash
# Start with quick reference
open docs/implementation-plans/VIRAL_UX_QUICKREF.md

# Then review full plan
open docs/implementation-plans/08-viral-ux-features.md

# Check design specs
open docs/implementation-plans/VIRAL_UX_DESIGN_MOCKUPS.md
```

### 2. Install Dependencies
```bash
cd app
npm install expo-media-library expo-sharing react-native-view-shot \
            expo-blur expo-linear-gradient expo-haptics
```

### 3. Set Up Database
```bash
# Create and run migration
npx supabase migration new wall_of_fame
# Copy schema from 08-viral-ux-features.md Phase 1
npx supabase db push
```

### 4. Start Implementation
Begin with Phase 1 (Database) and work through sequentially.

---

## ✅ Pre-Implementation Checklist

- [ ] Read viral_ux_spec.md to understand the vision
- [ ] Review 08-viral-ux-features.md implementation plan
- [ ] Check VIRAL_UX_DESIGN_MOCKUPS.md for visual specs
- [ ] Install all required npm packages
- [ ] Set up database schema
- [ ] Configure permissions in app.json
- [ ] Test on both iOS and Android devices
- [ ] Ensure Supabase real-time is enabled

---

## 🎨 Design Principles

1. **Instant Gratification**: Modal appears immediately on event close
2. **Social-First**: Optimized for social media sharing
3. **High Contrast**: Bold gradients and clear hierarchy
4. **Tactile Feedback**: Haptics reinforce every action
5. **Squad Privacy**: Only event participants see entries
6. **Persistent Value**: Wall of Fame creates lasting engagement

---

## 🧪 Testing Strategy

### Manual Tests
- [ ] Close event → Modal appears automatically
- [ ] Tap Share → Native share sheet opens
- [ ] Save → Photo appears in camera roll
- [ ] Wall → All past events displayed
- [ ] Clink → Haptic fires, count increments
- [ ] Real-time → Other users see clink immediately

### Automated Tests
- [ ] MVP modal data fetching
- [ ] Wall of Fame query
- [ ] Clink mutation with optimistic updates
- [ ] Real-time subscription
- [ ] Image capture and export
- [ ] Permission handling

---

## 📈 Success Metrics to Track

```typescript
// Analytics events to implement
'mvp_modal_shown'      // Modal displayed
'mvp_modal_shared'     // Share button tapped
'image_saved'          // Saved to camera roll
'share_completed'      // Share sheet succeeded
'wall_viewed'          // Wall of Fame opened
'clink_sent'           // Clink button tapped
'clink_received'       // Real-time clink notification
```

---

## 🔗 Related Documentation

- Source spec: `docs/specs/viral_ux_spec.md`
- Database schema: See Phase 1 in main implementation plan
- API endpoints: `app/src/services/wallOfFame.ts`
- React Query hooks: `app/src/hooks/useWallOfFame.ts`

---

## 💡 Key Insights

1. **Peak Social Energy**: The moment after an event ends has the highest social sharing potential
2. **Dual Distribution**: In-app Wall keeps users returning, external shares drive growth
3. **Squad Privacy**: Privacy-first approach prevents concerns about public drinking data
4. **Gamification**: Clinks create a feedback loop that encourages engagement
5. **Permanent Gallery**: Unlike ephemeral stories, these victories last forever

---

## 🚨 Critical Success Factors

1. **Modal Quality**: Must look great in screenshots
2. **Performance**: Animations must run at 60fps
3. **Permissions**: Graceful handling of denied permissions
4. **Real-time**: Clinks must broadcast instantly (<1s)
5. **Testing**: Must work perfectly on first event close

---

## 🎯 North Star Metric

**Viral Coefficient**: 1.3+

Every user should bring 1.3 new users through shares.

Track: `new_users_from_share / total_active_users`

---

## 📞 Support

For questions during implementation:
1. Review the main implementation plan
2. Check design mockups for visual specs
3. Consult quick reference for common issues
4. Test on real devices early and often

---

**Ready to build viral features!** 🚀

*Last updated: 2026-02-11*
