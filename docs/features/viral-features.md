# Viral UX Features

This document describes the viral UX features implemented for the Stängelispass app, including MVP celebration modals, social sharing, and Wall of Fame.

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Components](#components)
- [Hooks](#hooks)
- [Services](#services)
- [Database Schema](#database-schema)
- [Usage](#usage)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Features

### 1. MVP Recap Modal
After an event closes, the winner is shown a beautiful celebration modal with:
- Gradient background (gold to orange)
- Blurred backdrop
- Winner name and beer count
- Event name and date
- Top 5 participants leaderboard
- Share and close buttons
- Haptic feedback on interactions
- Smooth animations

### 2. Social Sharing
Users can share their MVP status via:
- Native iOS/Android share sheet
- Captured component as image
- Optional save to camera roll
- Automatic permissions handling
- Error feedback via alerts

### 3. Wall of Fame
Persistent celebration board featuring:
- All event winners
- Winner name, event name, beer count
- Social interactions (beer clinks/toasts)
- Optimistic UI updates
- Real-time toast counts

## Architecture

### Data Flow
1. **Event Close** → Trigger MVP Recap Modal
2. **User Shares** → Capture component → Native share sheet
3. **User Clinks** → Optimistic update → API call → Rollback on error

### State Management
- React Query for server state
- Optimistic updates for social interactions
- Local state for modals and animations

### Permissions
- Camera roll: `expo-media-library`
- Native sharing: `expo-sharing`
- Automatic permission requests with user feedback

## Components

### MVPRecapModal
**Location:** `app/src/components/features/MVPRecapModal.tsx`

Celebration modal shown when event ends.

```tsx
import { MVPRecapModal, MVPRecapData } from '@/components/features/MVPRecapModal';

<MVPRecapModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  eventData={{
    winnerName: 'John Doe',
    winnerBeerCount: 10,
    eventName: 'Friday Night',
    eventDate: new Date('2025-02-15'),
    participants: [
      { name: 'John Doe', beerCount: 10 },
      { name: 'Jane Smith', beerCount: 8 },
      // ...
    ],
  }}
  onShare={(imageUri) => {
    console.log('Shared:', imageUri);
  }}
/>
```

**Features:**
- Gradient background with LinearGradient
- Blurred backdrop with BlurView
- Haptic feedback on show/hide
- Fade-in animation
- Share button triggers image capture and native sharing
- Close button hides modal

### WallOfFame
**Location:** `app/src/components/features/WallOfFame.tsx`

Enhanced with toast/clink buttons and user interaction.

```tsx
import { WallOfFame } from '@/components/features/WallOfFame';

<WallOfFame userId={currentUserId} />
```

**Features:**
- Displays all event winners
- Toast/clink button per entry
- Shows toast count
- Optimistic updates
- Disabled state when user already clinked

## Hooks

### useWallOfFame
**Location:** `app/src/hooks/useWallOfFame.tsx`

React Query hooks for Wall of Fame data.

```tsx
import { useWallOfFame, useBeerClink, useUserToasts } from '@/hooks/useWallOfFame';

// Fetch wall of fame entries
const { data: entries, isLoading } = useWallOfFame();

// Clink/un-clink an entry
const { mutate: clink } = useBeerClink();
clink({ wallId: 'entry-id', userId: 'user-id' });

// Check if user has clinked entries
const { data: toasts } = useUserToasts('user-id');
const hasCliked = toasts?.some(t => t.wall_id === wallId);
```

**Features:**
- Automatic refetching
- Optimistic updates with rollback
- Error handling with reportError
- Haptic feedback on interactions

## Services

### shareImage
**Location:** `app/src/utils/shareImage.ts`

Utility for capturing React components as images and sharing.

```tsx
import { captureAndShareCard, captureView } from '@/utils/shareImage';

// Capture and share a component
const viewRef = useRef<View>(null);
const result = await captureAndShareCard(viewRef, {
  eventName: 'Friday Night',
  saveToLibrary: true,
});

if (result.success) {
  console.log('Shared:', result.uri);
}

// Capture only
const uri = await captureView(viewRef, {
  format: 'png',
  quality: 0.9,
});
```

**Features:**
- Captures any React component as PNG
- Native share sheet integration
- Optional camera roll save
- Permission handling
- Error handling with alerts

### wallOfFame
**Location:** `app/src/services/wallOfFame.ts`

CRUD operations for Wall of Fame and toasts.

```tsx
import {
  getWallOfFame,
  createWallOfFameEntry,
  addToast,
  removeToast,
  getUserToasts,
} from '@/services/wallOfFame';

// Get all entries
const entries = await getWallOfFame();

// Create entry
const entry = await createWallOfFameEntry({
  event_id: 'event-id',
  winner_id: 'user-id',
  total_stängeli: 10,
  image_url: 'https://...',
});

// Toast/un-toast
await addToast('wall-id', 'user-id');
await removeToast('wall-id', 'user-id');

// Check user toasts
const toasts = await getUserToasts('user-id');
```

**Features:**
- Joins for winner/event names
- Toast count aggregation
- Unique constraint handling (prevents duplicate toasts)
- Error handling with console logs

## Database Schema

### wall_of_fame Table
```sql
CREATE TABLE wall_of_fame (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_stängeli INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### toasts Table
```sql
CREATE TABLE toasts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wall_id UUID REFERENCES wall_of_fame(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wall_id, user_id) -- Prevent duplicate toasts
);
```

**Note:** These tables already exist in `supabase-schema.sql`.

## Usage

### Integration with Event Close

Add to `AppProvider.closeEvent()` function:

```tsx
import { MVPRecapModal } from '@/components/features/MVPRecapModal';
import { createWallOfFameEntry } from '@/services/wallOfFame';

const closeEvent = async () => {
  // ... existing close logic ...
  
  // Determine winner
  const winner = participants[0]; // Already sorted by beer count
  
  // Create wall entry
  await createWallOfFameEntry({
    event_id: currentEvent.id,
    winner_id: winner.user_id,
    total_stängeli: winner.beer_count,
  });
  
  // Show MVP modal
  setMvpData({
    winnerName: winner.name,
    winnerBeerCount: winner.beer_count,
    eventName: currentEvent.name,
    eventDate: new Date(currentEvent.created_at),
    participants: participants.slice(0, 5),
  });
  setShowMvpModal(true);
};
```

### Share Handler

```tsx
const handleShare = async (imageUri?: string) => {
  // Image already captured and shared by MVPRecapModal
  setShowMvpModal(false);
};
```

## Testing

### Run Tests
```bash
cd app
npm test -- MVPRecapModal.spec.tsx
npm test -- useWallOfFame.spec.tsx
npm test -- shareImage.spec.ts
```

### Test Coverage
- **MVPRecapModal**: 8 tests
  - Rendering when visible/hidden
  - Haptic feedback
  - Participant display
  - Share/close callbacks
  - Date formatting
  - Leaderboard limiting (top 5)

- **useWallOfFame**: 9 tests
  - Fetch entries
  - Beer clink (add/remove)
  - User toasts
  - Optimistic updates
  - Error handling

- **shareImage**: 10 tests
  - Capture and share
  - Save to library
  - Permission handling
  - Error cases
  - Null reference handling

### Mocks Required
```tsx
jest.mock('expo-haptics');
jest.mock('expo-blur');
jest.mock('expo-linear-gradient');
jest.mock('expo-media-library');
jest.mock('expo-sharing');
jest.mock('react-native-view-shot');
```

## Troubleshooting

### Camera Roll Permissions (iOS)
If saving to camera roll fails:
1. Check `info.plist` has `NSPhotoLibraryAddUsageDescription`
2. User must grant permission when prompted
3. Check Settings > Privacy > Photos > YourApp

### Camera Roll Permissions (Android)
If saving to camera roll fails:
1. Check `AndroidManifest.xml` has `WRITE_EXTERNAL_STORAGE`
2. For Android 11+, use scoped storage (expo-media-library handles this)
3. Check Settings > Apps > YourApp > Permissions > Storage

### Share Sheet Not Appearing
- `expo-sharing` requires native platforms (won't work on web)
- Check `Sharing.isAvailableAsync()` returns true
- Ensure you're testing on a real device, not simulator (some features limited)

### Image Capture Fails
- Ensure view ref is not null
- Wait for component to render before capturing
- Use `onLayout` to ensure view is ready
- Check console for `react-native-view-shot` errors

### Toasts Not Saving
- Check Supabase RLS policies allow insert on `toasts` table
- Unique constraint prevents duplicate toasts (returns `23505` error code)
- Check user is authenticated

### Wall of Fame Empty
- Check Supabase RLS policies allow select on `wall_of_fame` table
- Ensure entries are created when events close
- Check `getWallOfFame()` joins succeed (events and users tables must exist)

### TypeScript Errors
If you see type errors for wall_of_fame or toasts tables:
- Generated Supabase types may not include these tables
- Type assertions (`as any`) used to bypass during development
- Generate types: `npx supabase gen types typescript --project-id <id>`

## Future Enhancements

### From Original Plan (Optional)
- [ ] Confetti animation on modal appearance
- [ ] Deep linking for shared images
- [ ] Beer Stamps (QR code generation for +1 beer rewards)
- [ ] Refer-a-friend bonus beers
- [ ] Leaderboard streaks and badges

### Additional Ideas
- [ ] Export wall of fame as PDF
- [ ] Video celebrations instead of static images
- [ ] Wall of Fame filters (by month, by user, by event type)
- [ ] Social media integration (Twitter, Instagram)
- [ ] Custom share message templates

## Dependencies

### Production
- `expo-media-library`: Camera roll access
- `react-native-view-shot`: Component to image capture
- `expo-sharing`: Native share sheet
- `expo-haptics`: Haptic feedback
- `expo-blur`: Blurred backdrop
- `expo-linear-gradient`: Gradient backgrounds

### Development
- `@testing-library/react-native`: Component testing
- `@tanstack/react-query`: Server state management

## Related Documentation
- [Push Notifications](../PUSH_NOTIFICATIONS_README.md)
- [Connection Monitoring](../CONNECTION_MONITORING_README.md)
- [Implementation Plan](../implementation-plans/completed/08-viral-ux-features.md)
