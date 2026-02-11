# Stängelispass Business Plan: The "Event Pass" Model

We are pivoting to a **transactional, event-based monetization model**. This aligns with the "spontaneous social" nature of the app—paying only when you're actually out with the squad.

## 💰 Monetization Strategy: Pay-per-Event

### 1. Pricing Structure (MFS: +12)
| Product | Price | Duration | Value Metric |
| :--- | :--- | :--- | :--- |
| **First Round (Trial)** | Free | 1 Event | Full features for your first squad event. |
| **Standard Pass** | $0.99 | 24 Hours | One-time group tracker for a single night out. |
| **Weekend Warrior** | $2.49 | 72 Hours | Multi-day event tracking (Festivals, Cabin trips). |
| **Brewmaster (Annual)** | $19.99 | 1 Year | Unlimited events for power users and societies. |

### 2. Psychological Levers (PLFS +14)
- **Frictionless Entry**: 1st event is free to build the "leaderboard habit."
- **Social Friction (Pressure)**: If the host doesn't buy a pass after the free one, the leaderboard remains "locked" for the whole group.
- **Micro-Transactions**: $0.99 is an impulse buy, significantly lowering the "Craft" subscription barrier.

---

## 📣 Social Media Push Plan (Updated)

### 1. Platform Strategy: TikTok/Reels
- **Hook**: "Don't pay for beer trackers. Get the first night on us." 🍻
- **Focus**: Spontaneous night-out clips. The "Saturday Night Pass" being activated.

### 2. Influencer Outreach
- Focus on "Nightlife Organizers" and "Party Planners"—the people who naturally host these events.

---

## 🛠 Next Steps (Transactional)
1.  **Schema Update**: Add `events` and `event_passes` tables.
2.  **Logic**: Restrict beer logging unless an active `event_pass` exists for the squad.
3.  **UI**: "Start an Event" flow on the Home screen.
