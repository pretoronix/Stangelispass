# Viral UX Optimization Spec & Decision Log

This document finalizes the design for the "Viral UX" phase of Stängelispass, following the @brainstorming process.

## 🧠 Understanding Summary
- **Goal**: Turn the transactional "Event Pass" model into a shareable, social-proof engine.
- **Target**: Squads who just finished a round and want to celebrate (or mock) the winner.
- **Killer Feature**: The "Brewmaster of the Night" MVP Recap.

## ⚖️ Decision Log
| Decision Point | Chosen Approach | Rationale |
| :--- | :--- | :--- |
| **Recap Trigger** | Instantly upon closing event | Captures the "peak" of the social energy. |
| **Visual Hook** | Stylized MVP Card | High-contrast visual that is optimized for social media screenshots. |
| **Sharing Layer** | Dual (Wall + Camera Roll) | In-app retention (Wall) + External virality (Camera Roll). |
| **Social Privacy** | Squad-Only | High intimacy; prevents privacy concerns for drinking habits. |
| **Interactions** | "Beer Clink" (Toasts) | Satisfying haptic feedback that gamifies the "Wall of Fame". |
| **Persistence** | Permanent Gallery | Encourages users to return to the app to see their "wins" over time. |

## 🛠️ Implementation Specs (MVP)

### 1. MVP Recap Modal
- **Component**: `MVPModal.tsx`
- **Data**: Fetches the winner from the `beers` table for the just-closed `event_id`.
- **Action**: On close, triggers `MediaLibrary.saveToLibraryAsync` (if permitted) and adds entry to `wall_of_fame` table.

### 2. Beer Clink Social Mechanic
- **Logic**: Real-time broadcast using Supabase Channels.
- **Haptics**: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)` on every clink.

### 3. Non-Functional Requirements
- **Performance**: Animations isolated in `Reanimated` threads to maintain 60fps.
- **Privacy**: RLS policies for `wall_of_fame` restricted to users who shared the `event_id`.

---

## ✅ Ready for Execution?
*Decision log complete. Design approaches accepted. Moving to implementation.*
