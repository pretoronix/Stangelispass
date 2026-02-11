# 🗺️ Stängelispass Master Feature Plan

This document outlines the strategic roadmap and detailed technical implementation plans for the evolution of Stängelispass.

## ✅ Completed (MVP)
The following features have been successfully implemented and verified.
- **Heavy Haptic Feedback**: Integrated `expo-haptics` (Heavy impact) for visceral confirmation of beer logging.
- **"Who Pays?" Randomizer**: Deterministic client-side randomizer to gamify round-buying.
- **Cost Tracker**: Real-time context-based calculation (`totalBeers * 5.00`).
- **Export Data (CSV)**: `expo-file-system` and `expo-sharing` integration for data portability.
- **Wall of Fame**: Automatic archival of event winners to Supabase `wall_of_fame` table.

---

## 🚀 Phase 9: Data Insights & Analytics
**Goal**: Move beyond simple counting to behavioral insights.

### 1. Beer Velocity Stats (Beers/Hour)
- **Concept**: Display a dynamic "Pace" metric to show how fast the group is drinking.
- **Technical Plan**:
    -   **Frontend**: Update `useBeers` hook to calculate `velocity = totalBeers / (currentDate - eventStartDate)`.
    -   **UI**: Add a `MetricCard` component to the Header showing "X Beers/hr".
    -   **Visualization**: Use `react-native-gifted-charts` for a simple line graph of "Beers vs Time".
- **Skills Needed**: Time-series data manipulation, vector graphics.

### 2. Peak Hour Heatmap
- **Concept**: Visual representation of the "wildest" hours of the night.
- **Technical Plan**:
    -   **Backend**: Create a Supabase View `hourly_stats` that aggregates `created_at` by hour.
    -   **Frontend**: Render a horizontal bar chart where opacity indicates volume.

---

## 🏆 Phase 10: Gamification & Retention
**Goal**: Create "Sticky" mechanics that reward frequent usage.

### 3. Badges & Achievements System
- **Concept**: Digital rewards for specific milestones (e.g., "Hat Trick" = 3 beers in 1hr).
- **Technical Plan**:
    -   **Schema**: New table `achievements` (`id`, `user_id`, `badge_type`, `awarded_at`).
    -   **Logic Engine**: Implement a `checkAchievements(userId)` function in `MainService.ts` that runs after every `addBeer` call.
    -   **UI**: `ProfileScreen` with a grid of locked/unlocked SVG icons.
    -   **Animation**: `lottie-react-native` for a confetti explosion when a badge is unlocked.
- **Skills Needed**: Game logic design, SVG manipulation, complex state management.

### 4. The "Pour" Animation
- **Concept**: A full-screen cosmetic animation when a beer is logged.
- **Technical Plan**:
    -   **Library**: `react-native-reanimated` + `react-native-skia` for fluid physics.
    -   **Implementation**: A modal overlay where liquid fills the screen using a masking view, triggered by the `addBeer` success state.
    -   **Haptics**: Sync haptic vibration patterns with the visual "fill" level.

---

## 💬 Phase 11: Social Interaction
**Goal**: Transform from a tool to a social network.

### 5. Comments & "Cheers"
- **Concept**: Allow users to comment on specific beer logs (e.g., "Slow down!", "Legend!").
- **Technical Plan**:
    -   **Schema**: New table `comments` (`id`, `beer_id`, `user_id`, `text`).
    -   **Realtime**: Subscribe to `postgres_changes` on `comments` table for live chat feel.
    -   **UI**: Expandable `BeerLogItem` that reveals a threaded conversation view.

### 6. Push Notifications
- **Concept**: "John just stole the lead!" or "New Round Started".
- **Technical Plan**:
    -   **Infrastructure**: Integrate `expo-notifications`.
    -   **Backend**: Supabase Edge Function triggered by database Webhooks (e.g., on `INSERT` to `beers`).
    -   **Auth**: Requires migrating to specific User Auth (Phase 12) to target device tokens.

---

## 🔐 Phase 12: Infrastructure & Scale
**Goal**: Enterprise-grade reliability and security.

### 7. User Authentication (OTP)
- **Concept**: Replace "Select User" with true SMS/Email login to secure accounts.
- **Technical Plan**:
    -   **Auth Provider**: Supabase Auth (OTP).
    -   **Migration**: Script to map existing "Name-based" users to new "Auth-based" UIDs.
    -   **Security**: Enable Row Level Security (RLS) enforcing `auth.uid() = user_id`.

### 8. Offline First Architecture
- **Concept**: Allow logging beers in the basement of a pub with no signal.
- **Technical Plan**:
    -   **State**: Integrate `@tanstack/react-query` with `persist-query-client`.
    -   **Sync Engine**: Queue mutations (`addBeer`) in `AsyncStorage` and replay them when connection is restored (`NetInfo`).
    -   **Conflict Resolution**: "Last write wins" strategy for simple counters.
