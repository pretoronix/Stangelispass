# Sprint 2: Viral UX Features

**Priority**: 🟠 HIGH  
**Estimated Effort**: 4–6 days  
**Complexity**: ⭐⭐ Low-Medium  
**Status**: 🟡 Partial — core components exist, shareability gaps remain  
**Depends on**: Sprint 1 (deep linking setup is reusable)

---

## Goal

Make Stängelispass shareable and socially sticky. The MVP recap modal, Wall of Fame, QR scanning, and confetti components are all built — this sprint wires them together into polished share flows, adds Wall of Fame filtering, and ensures shared content can deep-link back into the app.

---

## What Already Exists

| Asset | Location | State |
|---|---|---|
| MVP Recap Modal | `app/src/components/features/MVPRecapModal.tsx` | ✅ Done |
| MVP Recap sub-components | `app/src/components/features/mvp/` | ✅ Done |
| `shareImage.ts` utility | `app/src/utils/shareImage.ts` | ✅ Done |
| `WallOfFame` component | `app/src/components/features/WallOfFame.tsx` | ✅ Done |
| `useWallOfFame` hook | `app/src/hooks/useWallOfFame.ts` | ✅ Done |
| `InviteModal` | `app/src/components/features/InviteModal.tsx` | ✅ Done |
| `QRGenerator` / `QRScanner` | `app/src/components/features/QRGenerator.tsx` | ✅ Done |
| `Confetti` component | `app/src/components/animations/Confetti.tsx` | ✅ Done |
| `useQrSharing` hook | `app/src/hooks/add/useQrSharing.ts` | ✅ Done |
| Beer stamp / stamp QR | `app/src/hooks/add/useStampQr.ts` | ✅ Done |

---

## Tasks

### 1. Deep Linking for Shared Images

When a user shares their MVP result or Wall of Fame entry, the image currently carries no link back to the app. A recipient tapping the image on social media or in a message should be able to open the app directly to the relevant event/leaderboard.

**Tasks:**
- [ ] Configure Expo deep linking in `app/app.json`:
  ```json
  "scheme": "stangelispass",
  "intentFilters": [
    {
      "action": "VIEW",
      "data": [{ "scheme": "stangelispass" }],
      "category": ["BROWSABLE", "DEFAULT"]
    }
  ]
  ```
- [ ] Add a `links.ts` helper (or extend `app/src/utils/links.ts`) with `buildShareUrl(type, params)` that produces a `stangelispass://leaderboard/{eventId}` URI
- [ ] Embed the URL in the share payload inside `shareImage.ts` (add to `message` field of `expo-sharing`)
- [ ] Handle the incoming URL in `app/src/app/_layout.tsx` using Expo Router's `Linking` API — navigate to `/leaderboard/[eventId]` when the scheme is opened
- [ ] Test: share an image → tap link → confirm app opens on leaderboard screen

**Files:** `app/src/utils/links.ts`, `app/src/utils/shareImage.ts`, `app/src/app/_layout.tsx`, `app/app.json`

---

### 2. Wall of Fame Filters

The Wall of Fame screen (`app/src/app/legends.tsx`) shows a flat list of all winners. Add UI to filter by time period and by user.

**Tasks:**
- [ ] Add filter state to `legends.tsx`: `filterPeriod` (`all` | `month` | `week`) and optional `filterUserId`
- [ ] Extend `getWallOfFame()` in `app/src/services/events/wallOfFame.ts` (or add a new query) to accept `{ since?: Date; userId?: string }` params
- [ ] Add query key variant in `EVENT_QUERY_KEYS` for filtered Wall of Fame (`wallOfFameFiltered(eventId, since, userId)`)
- [ ] Build a compact filter bar component in `app/src/components/features/WallOfFame.tsx`:
  - Period chips: "All time" / "This month" / "This week"
  - Optional user picker (reuse `UserSelectionGrid` pattern from settings)
- [ ] Update `useWallOfFame` hook to accept filter params and pass through to the query
- [ ] Add tests for the filter query logic in `app/src/__tests__/useWallOfFame.spec.tsx`

**Files:** `app/src/app/legends.tsx`, `app/src/services/events/wallOfFame.ts`, `app/src/hooks/useWallOfFame.ts`, `app/src/hooks/useEventsQuery.ts`, `app/src/components/features/WallOfFame.tsx`

---

### 3. Custom Share Message Templates

The `shareImage.ts` utility currently uses a hardcoded message string. Allow the caller to pass a template, and provide a few built-in presets.

**Tasks:**
- [ ] Define a `ShareTemplate` type in `shareImage.ts`:
  ```typescript
  type ShareTemplate = 'mvp' | 'leaderboard' | 'milestone' | 'custom';
  ```
- [ ] Add `buildShareMessage(template, data)` — returns a localized string for each template type (e.g. MVP: `"🍺 I just won {eventName} with {count} beers! #{appTag}"`)
- [ ] Update `MVPRecapActions.tsx` to pass `template: 'mvp'` and relevant data to `shareImage.ts`
- [ ] Add a "Share leaderboard" action to the Home screen that uses `template: 'leaderboard'`
- [ ] Wire `labels.home.shareLeaderboard` testID (already defined in `ui/labels.ts`) to the new button
- [ ] Tests: unit-test `buildShareMessage()` for each template in `shareImage.spec.ts`

**Files:** `app/src/utils/shareImage.ts`, `app/src/components/features/mvp/MVPRecapActions.tsx`, `app/src/app/index.tsx`, `app/src/__tests__/shareImage.spec.ts`

---

### 4. Confetti on MVPRecapModal Appearance

The `Confetti` component (`app/src/components/animations/Confetti.tsx`) exists but may not be firing on modal open. Confirm it triggers immediately when `visible` becomes `true`.

**Tasks:**
- [ ] Audit `MVPRecapModal.tsx` — check whether `<Confetti>` is mounted and its `start` prop tied to `visible`
- [ ] If missing: add `<Confetti />` inside the modal, start it via a `useEffect` on `visible === true`
- [ ] Ensure it only fires once per open (reset state on close)
- [ ] Add an animation safety test in `animationSafety.spec.tsx` covering the confetti trigger

**Files:** `app/src/components/features/MVPRecapModal.tsx`, `app/src/__tests__/animationSafety.spec.tsx`

---

### 5. Wall of Fame PDF Export

Add a "Export as PDF" / "Save as image" option to the Wall of Fame screen for sharing the full leaderboard history.

**Tasks:**
- [ ] Extend `shareImage.ts` to support capturing a `ref`-based `<View>` (not just a single card) using `react-native-view-shot` (already installed)
- [ ] Add an "Export" button to `app/src/app/legends.tsx` using `labels.home.export` testID (already defined)
- [ ] Capture the full Wall of Fame list as a long screenshot, then pass to `expo-sharing`
- [ ] Handle the case where the list is taller than the screen — scroll-capture or paginate

**Files:** `app/src/utils/shareImage.ts`, `app/src/app/legends.tsx`

---

### 6. Invite Friends Flow Polish

`InviteModal.tsx` exists. Verify the invite QR code contains a usable deep link (not just a static payload) and that scanning it on a fresh device navigates correctly.

**Tasks:**
- [ ] Audit `InviteModal.tsx` — check QR code value. If it's a raw event ID, update it to a full `stangelispass://join/{eventId}` URI
- [ ] Add a route handler for `stangelispass://join/{eventId}` in `_layout.tsx` that calls `joinEvent()` and navigates to Home
- [ ] Test with `expo-camera` QR scan on a physical device

**Files:** `app/src/components/features/InviteModal.tsx`, `app/src/app/_layout.tsx`

---

## File Checklist

| File | Action |
|---|---|
| `app/app.json` | Add `scheme` + Android `intentFilters` |
| `app/src/utils/links.ts` | Add `buildShareUrl()` |
| `app/src/utils/shareImage.ts` | Add `buildShareMessage()`, template support, view-capture for Wall of Fame |
| `app/src/components/features/mvp/MVPRecapActions.tsx` | Use share template |
| `app/src/components/features/MVPRecapModal.tsx` | Wire confetti on open |
| `app/src/components/features/WallOfFame.tsx` | Add filter bar |
| `app/src/services/events/wallOfFame.ts` | Accept filter params |
| `app/src/hooks/useWallOfFame.ts` | Pass filter params to query |
| `app/src/hooks/useEventsQuery.ts` | Add filtered Wall of Fame key |
| `app/src/app/index.tsx` | Add share leaderboard button |
| `app/src/app/legends.tsx` | Add filter state + export button |
| `app/src/app/_layout.tsx` | Handle incoming deep links |
| `app/src/components/features/InviteModal.tsx` | Use full URI in QR value |
| `app/src/__tests__/shareImage.spec.ts` | Test template builder |
| `app/src/__tests__/useWallOfFame.spec.tsx` | Test filter queries |
| `app/src/__tests__/animationSafety.spec.tsx` | Test confetti trigger |

---

## Definition of Done

- [ ] Sharing an MVP result produces an image with a working deep link
- [ ] Tapping the deep link opens the app on the correct leaderboard screen
- [ ] Wall of Fame can be filtered by "This week", "This month", "All time"
- [ ] Confetti fires exactly once when the MVP modal opens
- [ ] Wall of Fame can be exported/shared as an image
- [ ] Invite QR code carries a full `stangelispass://` URI
- [ ] All new UI elements use testIDs from `ui/labels.ts` (add new labels there first)
- [ ] All existing 126+ tests still pass
- [ ] `npm run typecheck` and `npm run lint` pass with 0 errors
