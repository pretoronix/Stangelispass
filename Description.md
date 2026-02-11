# Stängelispass: The Social Brew-Graph Utility 🍻

Stängelispass is a high-fidelity, real-time social competition platform designed for group beverage tracking. It bridges the gap between casual night-outs and legendary competition through a premium iOS-inspired interface and a synchronized real-time backend.

## 💎 Core Value Propositions
- **The "Truth Machine"**: A real-time, admin-audited leaderboard that eliminates disputes over whose turn it is to buy the next round.
- **Social Gamification**: Integrated "Who Pays?" randomizers and visceral haptic feedback transform logging into a social ritual.
- **Legacy & Archival**: The "Wall of Fame" automatically archives event winners, turning one-off nights into local legends.
- **Viral Mechanics**: Built-in MVP recap generation and QR-based peer-to-peer logging for friction-less squad growth.

## 🏗️ Technical Architecture & Stack
Designed for low-latency synchronization and native performance.

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React Native (Expo 52) | Cross-platform reach with native feel and HIG compliance. |
| **Backend** | Supabase (PostgreSQL) | Robust RDBMS with instant Realtime Channel subscriptions. |
| **State** | React Context (AppProvider) | Centralized, memoized global state for seamless data flow. |
| **Persistence** | Expo SecureStore | High-security local persistence for user identity. |
| **Sensory** | Expo Haptics (Heavy) | High-fidelity tactile confirmation for "Proof of Brew". |

## 🚀 The Feature Ecosystem

### 📊 Real-time Dashboard
- Live event tracking with gold/silver/bronze trophy distribution.
- Competitive "Event Stngeli" totalizers for group milestones.

### 🤳 Peer-to-Peer QR Integration
- Scan-to-log mechanics allow squads to log beers without administrative bottlenecks, maintaining data integrity via role-based access.

### 💰 Group Utility Tools
- **Cost Tracker**: Instant calculation of the group's "Tab" based on real-time consumption.
- **Who Pays?**: A deterministic randomizer to gamify the buying of the next round.

### 🏆 Hall of Legends
- Hall of Legends database with automated archival logic triggered on event closure.

## 🛣️ Strategic Roadmap: The "Next Level"
From a tracking utility to a social network.
1.  **Phase 9: Velocity & Insights**: Predictive drinking metrics (beers/hr) and peak-consumption heatmaps.
2.  **Phase 10: The Badge Economy**: Digital achievements (Hat Tricks, Early Birds) to drive retention and status.
3.  **Phase 11: Push & Pull**: Real-time "Friends are drinking" alerts to trigger spontaneous social rounds.

---
*For detailed strategy, marketing plans, and implementation specs, refer to the [docs/](file:///Users/ppf/Downloads/Stängelispass/docs/) directory.*
