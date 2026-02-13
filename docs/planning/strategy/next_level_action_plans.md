# 🚀 Next Level Action Plans: Phases 9 & 10

Following the successful MVP launch, these plans outline the transition from a "tracking tool" to a "social addiction".

---

## 📈 Phase 9: The Data Insights Layer
**Goal**: Provide users with deep insights into their drinking habits (Beer Velocity & Trends).

### Action Plan
1.  **Enhanced useBeers Hook**:
    -   Implement `calculateVelocity(beers)`: Logic to determine beers/hour.
    -   Implement `detectPeakTime(beers)`: Identify the hour with most activity.
2.  **The "Insights" View**:
    -   Create `src/components/features/SessionStats.tsx`.
    -   Use `react-native-chart-kit` (or simple SVG bars) to show consumption over time.
3.  **Monetization Integration**:
    -   Lock "Historical Comparisons" (e.g., "This night vs. Last Friday") behind the **Pilsner Pass**.

---

## 🏆 Phase 10: Gamified Engagement (Badges & Achievement)
**Goal**: Increase retention through digital rewards and status.

### Action Plan
1.  **Achievement Engine**:
    -   Create `achievements` table in Supabase.
    -   Implement background worker (Edge Function) to check for "Hat Tricks" (3 beers in 1hr) or "Early Bird" (log before 18:00).
2.  **The Medal Cabinet**:
    -   Add an "Achievements" section to the User Profile.
    -   Implement high-fidelity SVG medals with glowing animations.
3.  **Social Sharing 2.0**:
    -   Enable "Badge Bragging": One-tap share of newly earned achievements to Instagram Stories.
4.  **Monetization Integration**:
    -   **Exclusive Badges**: Brand-sponsored badges (e.g., "Corona King") for partnered pubs.

---

## 🛠️ Technical Foundation (Pre-requisite)
-   **Authentication (OTP)**: Shift from "Select Name" to "Mobile/Email OTP" to ensure data ownership and multi-device sync for badges.
-   **Push Notifications**: Notify users when a "Friend earns a Badge" to drive re-engagement.
