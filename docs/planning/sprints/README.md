# Sprint Plans

Detailed implementation plans for the next four development sprints (Q2 2026).

| Sprint | Focus | Effort | Status |
|---|---|---|---|
| [Sprint 1](sprint-1-push-notifications.md) | Complete Push Notifications | 3–5 days | 🟡 20% remaining |
| [Sprint 2](sprint-2-viral-ux.md) | Viral UX & Shareability | 4–6 days | 🟡 Core components exist |
| [Sprint 3](sprint-3-approvider-cleanup.md) | AppProvider Cleanup & Hook Deprecation | 2–3 days | 🟠 Partially done |
| [Sprint 4](sprint-4-user-auth.md) | User Auth — Scoping Only | 2 days | 🔵 Not started |

## Sequencing Rationale

**Sprint 1 first** — Push notifications are the single highest-ROI item. Infrastructure is 80% done. Completing it requires no new architecture, only wiring (EAS credentials, cron job, deep link navigation, one new DB trigger).

**Sprint 2 second** — Viral features drive organic growth. The deep-link work from Sprint 1 is directly reused here for share URLs and invite QR codes.

**Sprint 3 third** — A technical hygiene sprint with no user-facing changes. Safer to do after the feature sprints land, so it doesn't introduce churn during active feature work. The cleaner `AppProvider` also makes Sprint 4 safer.

**Sprint 4 last** — User authentication is scoping-only this sprint. The implementation sprint that follows will be 5–8 days of high-risk database and auth work; it should not start until the plan is fully reviewed.
