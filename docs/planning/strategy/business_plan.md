# Stängelispass Business Plan: The "Event Pass" Model

We are pivoting to a **transactional, event-based monetization model**. This aligns with the "spontaneous social" nature of the app—paying only when you're actually out with the squad.

## 💰 Monetization Strategy: Pay-per-Event

### 1. Pricing Structure (MFS: +12)
| Product | Price | Duration | Value Metric |
| :--- | :--- | :--- | :--- |
| **First Round (Trial)** | Free | 1 Event | Full features for your first squad event. |
| **Single Event Pass** | CHF 10 | 24 Hours | Unlimited logging + full features for one night. |
| **Weekend Pass** | CHF 15 | 72 Hours | Multi-day event tracking (festivals, cabin trips, pub crawls). |
| **Lifetime Supporter** | CHF 100 | Lifetime | Unlimited access + “Supporter” status (support the project). |

---

## 🧾 Competitor Costs (Add Verified Snapshot)

The current repo includes qualitative competitor analysis (see `docs/planning/strategy/competitive_analysis.md`) but **does not contain verified competitor pricing**. To “check the costs”, we need a recorded snapshot (date + market + source) before locking our final price points.

> [!IMPORTANT]
> Fill the table below with *verified* pricing from store listings and/or official pricing pages. Do not treat assumptions as facts.

| Competitor | Category | Monetization Model | Verified Price Points | Snapshot Metadata |
| :--- | :--- | :--- | :--- | :--- |
| Untappd | Discovery / Ratings | Freemium + optional paid tier | _TBD (verify)_ | _TBD: market, platform, date, source_ |
| RateBeer | Reviews / Community | Freemium / membership (varies) | _TBD (verify)_ | _TBD: market, platform, date, source_ |
| Sunnyside / Less | Moderation / Health | Subscription | _TBD (verify)_ | _TBD: market, platform, date, source_ |
| DrinkCounter / Generic tally apps | Utility | Free / ads / IAP | _TBD (verify)_ | _TBD: market, platform, date, source_ |

**Verification checklist**
- Record: **market** (e.g. US/CH/DE), **platform** (iOS/Android/Web), **date checked**, and **source** (link/title).
- Note whether pricing is **subscription vs one-time**, and whether a **free tier** is usable without nagging.

---

## 🧠 Pricing Suggestions (Derived From Competitor Positioning)

Competitors skew toward **individual check-ins** (discovery/ratings) or **self-improvement** (moderation). Our edge is **group utility during a night out**, so pricing should anchor on *event moments* and *group outcomes*.

1. **Add an “Occasion” SKU for highest-intent nights**
   - **Pub Crawl / JGA Pass**: 24h, optimized for multi-venue chaos (fast logging + recap + “who pays?”).
   - Merchant it seasonally (weekends, summer, wedding season) and tie it to the updated marketing target (pub crawls / Junggesellenabschied).

2. **Introduce bundles for repeat squads**
   - **3-Pack / 5-Pack Event Passes**: lower per-event price, faster checkout, better retention for regular groups.

3. **Make Lifetime explicitly “Supporter”**
   - Position **Lifetime Supporter (CHF 100)** as “Unlimited access + support the project”.
   - Add one supporter-only perk to justify the tier (e.g., supporter badge, special recap template, or export formats).

4. **After competitor prices are verified: run a 2-price A/B**
   - Test `Single Event Pass` and `Weekend Pass` price points against the verified competitor range to maximize conversion without underpricing.

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
