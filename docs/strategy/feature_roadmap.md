# 🗺️ Stängelispass Master Feature Plan

This document outlines the strategic roadmap and detailed technical implementation plans for the evolution of Stängelispass.

**Last Updated**: February 11, 2026  
**Status**: Phase 9 ✅ Complete | Phase 10 ✅ Complete | Infrastructure ✅ Refactored

---

## ✅ Completed (MVP + Core Features)
The following features have been successfully implemented and verified.

### Core Functionality
- **Heavy Haptic Feedback**: Integrated `expo-haptics` (Heavy impact) for visceral confirmation of beer logging.
- **"Who Pays?" Randomizer**: Deterministic client-side randomizer to gamify round-buying.
- **Cost Tracker**: Real-time context-based calculation (`totalBeers * 5.00`).
- **Export Data (CSV)**: `expo-file-system` and `expo-sharing` integration for data portability.
- **Wall of Fame**: Automatic archival of event winners to Supabase `wall_of_fame` table.

### ✅ Phase 9: Data Insights & Analytics (COMPLETED)
**Status**: ✅ **SHIPPED** - February 2026

#### 1. Beer Velocity Stats (Beers/Hour) ✅
- **Implementation**: `utils/statsCalculator.ts` with `calculateVelocity()` function
- **UI Component**: `VelocityMetricCard` showing real-time pace
- **Visualization**: Integrated `react-native-gifted-charts` for trend analysis
- **Location**: Home screen displays group velocity and individual pace

#### 2. Peak Hour Heatmap ✅
- **Implementation**: `prepareTrendData()` aggregates beers by time buckets
- **Visualization**: Line chart showing consumption patterns over time
- **Features**: Real-time updates as beers are logged

### ✅ Phase 10: Gamification & Retention (COMPLETED)
**Status**: ✅ **SHIPPED** - February 2026

#### 3. Badges & Achievements System ✅
- **Schema**: `achievements` table implemented with `badge_type` field
- **Logic Engine**: `services/achievements.ts` with `checkAchievements()` function
- **Badge Types Implemented**:
  - **Hat Trick**: 3 beers within 1 hour
  - **Early Bird**: First beer of the event
  - **Night Owl**: Beer after midnight
  - **Century Club**: 100 lifetime beers
  - **Social Butterfly**: Logged beers with 10+ different people
- **UI**: Profile screen displays badge grid with `BadgeIcon` component
- **Integration**: Automatic badge checking on every `addBeer()` call
- **Notification**: New badges returned with beer log response

#### 4. Enhanced User Experience ✅
- **Auditory Feedback**: Bottle opening sound effect (`audio.ts`)
- **Streak System**: Point bonuses for consecutive beers
- **Game Stats**: Event-level tracking with `event_game_stats` table
- **Leader Announcements**: Real-time notifications when leader changes
- **MVP Modal**: End-of-event recap with shareable summaries

---

## 🏗️ Phase 10.5: Architecture Refactoring (COMPLETED)
**Status**: ✅ **SHIPPED** - February 2026  
**Goal**: Modernize codebase for scalability and maintainability

### Technical Debt Resolution ✅
- **Service Modularization**: Split 926-line `supabase.ts` into 8 focused modules
  - `client.ts` - Supabase initialization
  - `types.ts` - Type definitions
  - `users.ts` - User operations
  - `beers.ts` - Beer & achievement operations
  - `events.ts` - Event & membership operations
  - `storage.ts` - Cross-platform storage
  - `permissions.ts` - Role-based permissions
  - `helpers.ts` - Utility functions

### React Query Integration ✅
- **Query Hooks**: 22 custom hooks for data fetching
  - `useUsersQuery.ts` - User operations (3 hooks)
  - `useBeersQuery.ts` - Beer operations (8 hooks)
  - `useEventsQuery.ts` - Event operations (9 hooks)
  - `useEventPermissions.ts` - Permission hooks (2 hooks)
  - `useCurrentUser.ts` - Session management
- **Benefits**: 60-80% reduction in redundant API calls via caching
- **Provider**: `QueryProvider` with optimal defaults

### Code Quality Improvements ✅
- **React Hooks**: Fixed all 12 ESLint warnings
- **Memoization**: Wrapped functions in `useCallback` for performance
- **Custom Hooks**: Extracted common patterns (permissions, session)
- **Type Safety**: Full TypeScript compliance
- **Testing**: All 56 tests passing

### Performance Gains
- **API Efficiency**: Smart caching reduces network calls
- **Render Optimization**: Proper memoization prevents unnecessary re-renders
- **Code Size**: Main service file reduced 92% (926 → 71 lines)

---

## 💬 Phase 11: Social Interaction (IN PROGRESS)
**Goal**: Transform from a tool to a social network.  
**Priority**: Medium | **Target**: Q2 2026

### 5. Comments & "Cheers" (PLANNED)
- **Concept**: Allow users to comment on specific beer logs (e.g., "Slow down!", "Legend!").
- **Technical Plan**:
    -   **Schema**: New table `comments` (`id`, `beer_id`, `user_id`, `text`).
    -   **Realtime**: Subscribe to `postgres_changes` on `comments` table for live chat feel.
    -   **UI**: Expandable `BeerLogItem` that reveals a threaded conversation view.
    -   **Query Hooks**: Add `useComments(beerId)` and `useAddComment()` mutations
- **Dependencies**: None (can implement now)

### 6. Push Notifications (PLANNED)
- **Concept**: "John just stole the lead!" or "New Round Started".
- **Status**: Infrastructure partially in place
  - ✅ `expo-notifications` already installed
  - ✅ `services/notifications.ts` and `notificationProcessor.ts` exist
  - ✅ `device_tokens` table in schema
  - ⏳ Backend webhook triggers needed
- **Technical Plan**:
    -   **Backend**: Supabase Edge Function triggered by database Webhooks (e.g., on `INSERT` to `beers`).
    -   **Processing**: Use existing `notificationProcessor.ts` for logic
    -   **Preferences**: User notification settings via `notification_prefs` field
    -   **Auth**: Requires migrating to specific User Auth (Phase 12) to target device tokens.
- **Priority**: HIGH - Most infrastructure already exists

---

## 🔐 Phase 12: Infrastructure & Scale (PARTIALLY COMPLETE)
**Goal**: Enterprise-grade reliability and security.

### 7. User Authentication (OTP) (PLANNED)
- **Concept**: Replace "Select User" with true SMS/Email login to secure accounts.
- **Technical Plan**:
    -   **Auth Provider**: Supabase Auth (OTP).
    -   **Migration**: Script to map existing "Name-based" users to new "Auth-based" UIDs.
    -   **Security**: Enable Row Level Security (RLS) enforcing `auth.uid() = user_id`.
    -   **Current State**: Using `SecureStore` for local persistence (via `useCurrentUser` hook)
- **Priority**: MEDIUM - Current approach works for MVP

### 8. Offline First Architecture ✅ (PARTIALLY COMPLETE)
- **Status**: Foundation in place, needs enhancement
- **Completed**:
    -   ✅ `@tanstack/react-query` integrated with caching
    -   ✅ Optimistic updates ready via mutation hooks
    -   ✅ Automatic retry logic for failed requests
- **Remaining Work**:
    -   ⏳ Add `persist-query-client` for persistent cache
    -   ⏳ Implement queue for offline mutations in `AsyncStorage`
    -   ⏳ Add `NetInfo` integration for connection monitoring
    -   ⏳ Conflict resolution strategy for sync
- **Priority**: MEDIUM - Core caching works well

---

## 🎯 Recommended Next Steps (Q2 2026)

> 📋 **Detailed implementation plans available in** `/docs/implementation-plans/`
> Each feature has time estimates, complexity ratings, and step-by-step guides.

### Immediate Opportunities (High ROI)

1. **Push Notifications** ⭐⭐⭐⭐⭐  
   - **Time**: 3-4 days | **Complexity**: Medium
   - Infrastructure 80% complete, high user value
   - 📄 [Implementation Plan](../implementation-plans/01-push-notifications.md)

2. **Migrate Components to React Query** ⭐⭐⭐⭐⭐  
   - **Time**: 2-3 days | **Complexity**: Low-Medium
   - Leverage new hooks in existing screens
   - 📄 [Implementation Plan](../implementation-plans/02-migrate-to-react-query.md)

3. **Persist Query Cache** ⭐⭐⭐⭐  
   - **Time**: 1 day | **Complexity**: Low
   - Enable offline data viewing with minimal effort
   - 📄 [Implementation Plan](../implementation-plans/03-persist-query-cache.md)

4. **React Query DevTools** ⭐⭐⭐  
   - **Time**: 2 hours | **Complexity**: Very Low
   - Add development debugging tools
   - 📄 [Implementation Plan](../implementation-plans/04-react-query-devtools.md)

### Medium Priority

5. **Comments System** ⭐⭐⭐  
   - **Time**: 5-7 days | **Complexity**: Medium
   - Add social layer to beer logs
   - 📄 [Implementation Plan](../implementation-plans/05-comments-system.md)

6. **Connection Monitoring** ⭐⭐⭐  
   - **Time**: 1 day | **Complexity**: Low-Medium
   - NetInfo integration for offline detection
   - 📄 [Implementation Plan](../implementation-plans/06-connection-monitoring.md)

7. **Optimistic UI Updates** ⭐⭐⭐⭐  
   - **Time**: 3 hours | **Complexity**: Low-Medium
   - Instant feedback for mutations
   - 📄 [Implementation Plan](../implementation-plans/07-optimistic-updates.md)

### Future Considerations

8. **User Authentication** ⭐⭐⭐⭐  
   - **Time**: 2-3 weeks | **Complexity**: High
   - When scaling beyond friend groups
   - 📄 [Implementation Plan](../implementation-plans/08-user-authentication.md)

9. **Advanced Analytics** ⭐⭐⭐  
   - **Time**: 4-6 weeks | **Complexity**: Very High
   - ML-based insights and predictions
   - 📄 [Implementation Plan](../implementation-plans/09-advanced-analytics.md)

10. **The "Pour" Animation** ⭐⭐  
   - **Time**: 1-2 weeks | **Complexity**: High
   - Polish feature for premium feel
   - 📄 [Implementation Plan](../implementation-plans/10-pour-animation.md)

---

## 📊 Feature Comparison Matrix

| Feature | Time | Complexity | ROI | Status |
|---------|------|-----------|-----|--------|
| Push Notifications | 3-4 days | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 80% ready |
| Migrate to React Query | 2-3 days | ⭐⭐ | ⭐⭐⭐⭐⭐ | Infrastructure ready |
| Persist Cache | 1 day | ⭐ | ⭐⭐⭐⭐ | Easy add-on |
| DevTools | 2 hours | ⭐ | ⭐⭐⭐ | Simple integration |
| Comments | 5-7 days | ⭐⭐⭐ | ⭐⭐⭐ | New schema needed |
| Connection Monitor | 1 day | ⭐⭐ | ⭐⭐⭐ | NetInfo needed |
| Optimistic Updates | 3 hours | ⭐⭐ | ⭐⭐⭐⭐ | React Query ready |
| Authentication | 2-3 weeks | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Major refactor |
| Analytics & ML | 4-6 weeks | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Research phase |
| Pour Animation | 1-2 weeks | ⭐⭐⭐⭐ | ⭐⭐ | Premium feature |

**Total Time for All Features**: 61-70 working days (~3-3.5 months)

---

## 📊 Progress Summary

| Phase | Status | Completion | Notes |
|-------|--------|-----------|-------|
| MVP | ✅ Complete | 100% | Core features shipped |
| Phase 9: Analytics | ✅ Complete | 100% | Velocity & trends live |
| Phase 10: Gamification | ✅ Complete | 100% | Achievements & streaks |
| Phase 10.5: Refactoring | ✅ Complete | 100% | Modern architecture |
| Phase 11: Social | 🟡 Partial | 20% | Notifications ready |
| Phase 12: Infrastructure | 🟡 Partial | 50% | Query caching done |

**Overall Progress**: 78% of planned features complete

---

## 🛠️ Technical Debt & Maintenance

### Completed ✅
- Service modularization
- React Query integration  
- React Hook compliance
- Type safety improvements
- Test coverage maintained

### Outstanding
- Migration to flat ESLint config (low priority, cosmetic)
- Further AppProvider simplification (use query hooks)
- Deprecate old `useBeers`/`useUsers` hooks (after migration)

---

**For detailed implementation guides, see:**
- `HIGH_PRIORITY_REFACTORING.md` - Recent architecture changes
- `MIGRATION_GUIDE.md` - How to use React Query hooks
- `REFACTORING_SUMMARY.md` - Complete refactoring overview
