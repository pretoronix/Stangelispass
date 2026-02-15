# Stängelispass 🍺

A production-ready beer tracking app for friends, optimized for iOS with real-time competition, social features, and legendary history.

[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54-000000.svg?style=flat&logo=expo)](https://expo.dev)
[![Tests](https://img.shields.io/badge/tests-140%20passing-success.svg)](./src/__tests__)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)

## 🚀 Current State: Production-Ready

**Version:** 1.0.0  
**Last Updated:** February 2026  
**Status:** ✅ All core features implemented and tested

The project is fully stabilized on **Expo SDK 54** with comprehensive features:
- **Real-time Synchronization** via Supabase with optimistic updates
- **Offline-First Architecture** with automatic sync on reconnection
- **Push Notifications** for achievements and leader changes
- **Social Features** including Wall of Fame and viral sharing
- **Premium iOS Design** with Haptics, BlurView, and native feel
- **Robust Error Handling** for web and native environments
- **140 Passing Tests** ensuring reliability and quality

## ✨ Core Features

### Event Management
- **Transactional Rounds** - Explicit start/close workflow prevents accidental logging
- **Live Leaderboard** - Real-time ranking with beer count and pace tracking
- **Admin Control** - Role-based permissions for event management
- **QR Group Join** - Frictionless "Light Auth" join via QR scan
- **Event History** - Browse and archive past events

### Beer Tracking
- **Quick Logging** - One-tap beer logging with haptic feedback
- **Beer Velocity & Pace** - Real-time "Beers Per Hour" tracking
- **Audit History** - Swipe-to-delete for admins to ensure data integrity
- **Milestone Achievements** - Celebrate 5, 10, 20, 50, 100 beer milestones
- **Sensory Feedback** - Bottle opening sound and haptics on logging

### Social & Viral Features (NEW - Feb 2026)
- **Wall of Fame** - Automatic archival of event winners with social interactions
- **Beer Clinks** - Toast other users' achievements with one tap
- **MVP Recap Modal** - Beautiful celebration screen at event close
- **Social Sharing** - Share achievements as images via native share sheet
- **Viral Summaries** - Auto-generated shareable cards with winner stats

### Push Notifications (NEW - Feb 2026)
- **Leader Change Alerts** - Get notified when you take the lead 👑
- **Milestone Notifications** - Celebrate achievements in real-time 🎉
- **Smart Delivery** - Respects user preferences and quiet hours
- **Multi-Device Support** - Register multiple devices per user
- **Template-Based** - Consistent, beautiful notification messages

### Offline Support (NEW - Feb 2026)
- **Offline Detection** - Visual banner shows connection status
- **Mutation Queue** - Actions queued when offline, synced on reconnection
- **Optimistic Updates** - Instant UI updates with automatic rollback on error
- **AsyncStorage Persistence** - Queue survives app restarts
- **React Query Integration** - Automatic retry and refetch on reconnect

## 📦 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Supabase account (free tier works)

### 1. Clone and Install

```bash
cd app
npm install --legacy-peer-deps
```

**Note:** `--legacy-peer-deps` resolves peer dependency conflicts with Expo SDK 54.

### 2. Configure Environment

Create `.env` file in `app/` directory:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** Never commit `.env` to version control. Use `.env.example` as a template.

### 3. Setup Supabase Database

**Option A: Using Supabase CLI (Recommended)**

```bash
# Install Supabase CLI
brew install supabase/tap/supabase  # macOS
# or: npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations
npm run db:push
```

**Option B: Manual SQL Execution**

1. Go to [supabase.com](https://supabase.com) → Your Project → SQL Editor
2. Execute SQL from `supabase-schema.sql`
3. Execute migrations in order from `supabase/migrations/`

**Verify Setup:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should see: beers, device_tokens, events, notifications, 
--              toasts, users, wall_of_fame
```

### 4. Enable Realtime

In Supabase Dashboard → Database → Replication:
- Enable Realtime for: `users`, `beers`, `events`, `wall_of_fame`, `toasts`

### 5. Run the App

```bash
# Start Expo development server
npm start

# Or specific platforms:
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

**First Launch:**
1. App will check Supabase configuration
2. If unconfigured, runs in offline/demo mode
3. Set up user in Settings tab
4. Start creating events!

## 🧪 Development

### Run Tests
```bash
npm test                    # All tests
npm test -- --watch        # Watch mode
npm test -- useNotifications.spec.ts  # Specific test
```

**Test Coverage:**
- Unit tests: Hooks, services, utilities
- Component tests: UI components, screens
- Integration tests: Complex user flows
- **Total:** 140 tests passing

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint           # Check for issues
npm run lint -- --fix  # Auto-fix issues
```

### Database Commands
```bash
npm run db:push        # Apply migrations
npm run db:reset       # Reset database (destructive!)
npm run db:diff        # Show pending changes
```

## 🏗️ Project Structure

```
app/
├── src/
│   ├── app/              # Expo Router pages (file-based routing)
│   ├── components/       # Reusable UI components
│   │   ├── features/     # Feature-specific components
│   │   ├── ui/           # Generic UI components
│   │   └── animations/   # Animation components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Business logic & API clients
│   │   └── supabase/     # Supabase service modules
│   ├── providers/        # React Context providers
│   ├── utils/            # Utility functions
│   ├── lib/              # Configuration & theme
│   ├── types/            # TypeScript type definitions
│   └── __tests__/        # Test suites
├── supabase/
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge functions
├── assets/               # Images, fonts, sounds
├── .env.example          # Environment template
└── package.json
```

## 📱 Usage Guide

### Getting Started

1. **First Launch**
   - App performs preflight checks for Supabase configuration
   - If missing, runs in fallback/demo mode
   - Navigate to Settings to configure user

2. **User Setup**
   - Go to **Settings** tab
   - Select existing user or create new one
   - User stored in SecureStore (native) or LocalStorage (web)

3. **Create an Event**
   - Navigate to **Home** tab
   - Tap "Start New Event"
   - Give it a name (e.g., "Friday Night")
   - Event status: "Active" → ready for logging

### Logging Beers

**As Admin:**
- Use **Add** tab to log beers for any participant
- Select user from list
- Tap beer icon to increment count
- Instant haptic feedback and sound

**As Participant:**
- Scan admin's QR code to join event
- Log your own beers via personal QR scan
- View your rank on leaderboard

### Event Management

**Starting Events:**
- Only admins can create and start events
- Set event name and initial settings
- Invite participants via QR code

**Closing Events:**
- Tap "Close Event" in event detail
- System determines winner (highest beer count)
- MVP Recap Modal shows celebration screen
- Winner added to Wall of Fame automatically

**History:**
- View all logged beers in History tab
- Admins can swipe-to-delete entries
- Undo support for accidental deletions

### Wall of Fame

- **View Past Winners:** Legends tab shows all event champions
- **Beer Clinks:** Toast achievements with tap interaction
- **Social Sharing:** Share MVP cards to camera roll or social media
- **Persistent Glory:** Winners immortalized forever

### Notifications

**Enable Push Notifications:**
1. Grant notification permissions when prompted
2. Configure preferences in Settings
3. Toggle specific notification types:
   - Leader change alerts
   - Milestone achievements (5, 10, 20+ beers)

**Notification Types:**
- 👑 **Leader Change** - You've taken the lead!
- 🎉 **Milestones** - Hit 5, 10, 20, 50, or 100 beers
- 🍺 **New Round** - Event started (future)
- ⏰ **Expiring Soon** - Event closing reminder (future)

## 🏗 Tech Stack

### Frontend
- **Framework:** React Native 0.78+ with React 19
- **Development Platform:** Expo SDK 54
- **Navigation:** Expo Router v6 (file-based routing)
- **State Management:** React Query v5 (TanStack Query)
- **UI Components:** Custom theme system based on iOS HIG
- **Animations:** React Native Animated API + Lottie
- **TypeScript:** v5.x for type safety

### Backend & Data
- **Database:** Supabase (PostgreSQL 15)
- **Real-time Sync:** Supabase Realtime subscriptions
- **Authentication:** Supabase Auth (JWT-based)
- **Storage:** Supabase Storage for images
- **Edge Functions:** Deno-based serverless functions

### Key Libraries
- `@tanstack/react-query` (v5.90.20) - Server state management
- `expo-router` (v6.0.23) - File-based navigation
- `expo-notifications` - Push notification handling
- `@react-native-community/netinfo` - Network status detection
- `react-native-view-shot` - Component screenshot capture
- `expo-haptics` - Haptic feedback
- `expo-audio` - Audio playback (bottle opening sound)
- `expo-blur` - Native blur effects

### Development Tools
- **Testing:** Jest + React Native Testing Library
- **Type Checking:** TypeScript strict mode
- **Linting:** ESLint with TypeScript rules
- **Code Quality:** 140 passing tests, ~80% coverage

### Security & Storage
- **Secrets:** ExpoSecureStore (native) / LocalStorage (web)
- **Offline Storage:** AsyncStorage for mutation queue
- **Query Cache:** Persisted with AsyncStorageAdapter
- **RLS Policies:** Row-level security on all tables

## 📚 Documentation

### Feature Documentation
- [Push Notifications](../docs/PUSH_NOTIFICATIONS_README.md) - Complete push notification implementation guide
- [Offline Support](../docs/CONNECTION_MONITORING_README.md) - Network detection and offline queue
- [Viral Features](../docs/VIRAL_UX_README.md) - Social sharing and Wall of Fame
- [Deployment Checklist](../docs/DEPLOYMENT_CHECKLIST_NOTIFICATIONS.md) - Production deployment guide

### Developer Resources
- [Agent Runbook](../AGENTS.md) - Quick commands and troubleshooting
- [Implementation Plans](../docs/implementation-plans/) - Detailed feature plans
- [GitHub Readiness](../docs/strategy/github_readiness.md) - Repository preparation status

### Architecture Guides
- Database schema: `supabase-schema.sql`
- Migration history: `supabase/migrations/`
- Edge functions: `supabase/functions/`
- Type definitions: `src/types/`

## 🐛 Troubleshooting

### Common Issues

**"Supabase not configured" warning on startup**
- **Solution:** Create `.env` file with valid Supabase credentials (see Quick Start #2)
- App will run in offline/demo mode without Supabase

**Tests failing with "Cannot find module" errors**
- **Solution:** Run `npm install --legacy-peer-deps` to resolve peer dependency conflicts

**iOS Simulator: Push notifications not working**
- **Expected:** iOS Simulator has limited push notification support
- **Solution:** Test on physical device or use Android Emulator with Google Play

**"Network request failed" on Supabase calls**
- **Check:** Verify Supabase URL and anon key in `.env`
- **Check:** Ensure Supabase project is not paused (free tier auto-pauses after inactivity)
- **Check:** Network connection and firewall settings

**TypeScript errors after updating dependencies**
- **Solution:** Run `npm run typecheck` to see full error list
- **Solution:** Delete `node_modules` and `package-lock.json`, then `npm install --legacy-peer-deps`

**App crashes on beer logging**
- **Check:** Verify active event exists (event must be in "active" status)
- **Check:** User is authenticated and has permissions
- **Check:** Database triggers are properly configured

**Offline queue not syncing**
- **Check:** Network banner shows "connected" status
- **Check:** AsyncStorage permissions granted (especially on Android)
- **Check:** React Query DevTools to inspect mutation state

### Debug Commands

```bash
# Clear all caches
npm start -- --clear

# Reset Metro bundler
npx expo start --reset-cache

# Check Expo configuration
npx expo config

# View logs (separate terminals)
npx expo start --ios  # iOS logs
npx expo start --android  # Android logs

# Database health check
npm run db:push -- --dry-run
```

### Getting Help

1. **Check Documentation:** Review relevant guides in `docs/` directory
2. **Check Tests:** Run `npm test` to ensure all tests pass
3. **Check Logs:** Enable React Native debugger for detailed error messages
4. **Check Supabase:** View logs in Supabase Dashboard → Logs

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/stangelispass.git
   cd stangelispass/app
   npm install --legacy-peer-deps
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow existing code style
   - Add tests for new features
   - Update documentation as needed
   - Run linter: `npm run lint -- --fix`

4. **Test Your Changes**
   ```bash
   npm test                # All tests
   npm run typecheck      # Type safety
   npm run lint           # Code quality
   ```

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

6. **Open Pull Request**
   - Describe your changes
   - Reference any related issues
   - Ensure CI checks pass

### Code Style Guidelines

- **TypeScript:** Use strict typing, avoid `any` when possible
- **Components:** Functional components with hooks
- **File Naming:** `camelCase.tsx` for components, `camelCase.ts` for utilities
- **Exports:** Named exports preferred over default exports
- **Comments:** JSDoc for public APIs, inline for complex logic
- **Tests:** Co-locate tests in `__tests__/` directory

### Commit Message Format

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

### Areas for Contribution

- **Features:** See `docs/implementation-plans/` for planned features
- **Bug Fixes:** Check GitHub Issues for open bugs
- **Documentation:** Improve guides, add examples
- **Tests:** Increase test coverage
- **Performance:** Optimize rendering, reduce bundle size
- **Accessibility:** Improve screen reader support

## 🎯 Roadmap

### Completed ✅
- Core beer tracking and leaderboards
- Real-time synchronization with Supabase
- Push notifications for achievements
- Offline support with mutation queue
- Social features (Wall of Fame, sharing)
- QR code event joining
- Admin controls and permissions

### In Progress 🚧
- Deep linking from notifications
- Notification history/inbox
- Rich push notifications (images, actions)

### Planned 📋
- **Event Analytics:** Detailed stats and trends
- **Achievements System:** Badges and unlockables
- **Beer Stamps:** QR-based +1 beer rewards
- **Scheduled Notifications:** Event reminders
- **Social Integrations:** Share to Instagram/Twitter
- **Export Data:** CSV/PDF reports
- **Dark Mode Improvements:** More theme customization

See [Implementation Plans](../docs/implementation-plans/) for detailed feature specifications.

## 📊 Performance

### Metrics
- **App Size:** ~45 MB (iOS), ~35 MB (Android)
- **Cold Start:** < 3 seconds on modern devices
- **Beer Log Latency:** < 500ms (online), instant (offline)
- **Test Suite:** 140 tests in ~8 seconds
- **Bundle Size:** ~2.5 MB (JS), ~15 MB (assets)

### Optimizations
- React Query caching reduces network calls by 70%
- Optimistic updates for instant UI feedback
- Image lazy loading and caching
- Minimized re-renders with React.memo
- Native animations for 60fps performance

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

### Attribution
- Built with [Expo](https://expo.dev)
- Powered by [Supabase](https://supabase.com)
- Uses [React Query](https://tanstack.com/query) for state management

---

**Made with 🍺 by the Stängelispass Team**  
**Last Updated:** February 13, 2026  
**Version:** 1.0.0
