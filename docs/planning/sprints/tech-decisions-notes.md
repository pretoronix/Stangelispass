# Technical Decisions & Notes

*Captured 2026-05-28*

---

## Overall Assessment

The codebase is production-grade for a side project. React Query architecture, service modularisation, offline queue, and test coverage are all done at a high quality level. The foundation is solid.

---

## Sprint Priority Opinion

**Sprint 1 (Push Notifications) is the one that actually matters.** A "you just lost the lead!" notification while at the bar is the kind of thing that makes people show the app to friends. Sprints 2 and 3 are worthwhile but won't move the needle the same way.

**Sprint 3 (AppProvider cleanup) should come after Sprint 2, not before.** It's invisible to users and carries real regression risk if done too fast.

**Sprint 4 (Auth) should stay deferred** unless the app opens up to strangers. The current approach is fine for a friend group. Auth adds friction at sign-up and the migration is genuinely risky.

---

## Firebase vs Expo Push Service

**Switch to Firebase for Android specifically.**

Expo's push service is a middleman over FCM anyway — you lose delivery analytics and the Firebase console debuggability without gaining anything.

**Plan:**
- Install `@react-native-firebase/app` + `@react-native-firebase/messaging`
- Register FCM token for Android instead of Expo token
- Keep `getExpoPushTokenAsync` for iOS (APNs is well-handled by Expo there)
- This is roughly a one-day change — do it before Sprint 1 ships

---

## Vercel Pro Opportunities

**Cron job:** Replace the pg_cron approach for `processNotifications` with a Vercel Cron Job. Simpler to configure, better logs in the Vercel dashboard.

**OG image generation (Sprint 2 - high impact):** When someone shares a leaderboard screenshot, generate a real `og:image` via a Vercel Edge Function that renders a card with live standings. Makes WhatsApp/iMessage link previews look compelling instead of generic. High social impact, straightforward to build.

---

## Open Question

What is the actual user base — friend group only, or broader? This determines whether Sprint 4 (auth) is urgent or stays low priority.
