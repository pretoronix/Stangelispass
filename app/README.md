# Stängelispass 🍺

A high-fidelity beer tracking app for friends, optimized for iOS with a focus on real-time competition and legendary history.

## 🚀 Current State: SDK 54 Ready
The project is fully stabilized on **Expo SDK 54**, featuring:
- **Real-time Synchronization** via Supabase.
- **Robust Error Handling** for Web and Native environments.
- **Premium iOS Design** with Haptics and Translucent UI (BlurView).

## ✨ New Features

- **Legends Gallery (Wall of Fame)**: Automatic archival of event winners. Every 'Master of the Round' is immortalized forever.
- **Beer Velocity & Pace**: Real-time "Beers Per Hour" tracking with live trend charts powered by `react-native-gifted-charts`.
- **Sensory Feedback ("Psst!")**: High-engagement auditory feedback (bottle opening sound) and haptic triggers on logging success.
- **QR Group Join & Invite**: Frictionless "Light Auth" flow where friends join rounds instantly via QR scan.
- **Transactional Rounds**: Rounds must be explicitly 'Started' and 'Closed' to prevent accidental logging.
- **Viral Recap**: Shareable MVP summaries generated automatically at the end of every round.
- **Audit History**: Swipe-to-delete history for admins to ensure data integrity.

## 🛠 Features

- **Leaderboard** - Live ranking of current round participants.
- **Admin Control** - Only designated admins can start/stop rounds and manage beer logs.
- **Real-time Sync** - Instant updates across all devices.
- **Dark Theme** - OLED-optimized true black theme with iOS semantic accents.

## 📦 Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Install and login to Supabase CLI (`brew install supabase/tap/supabase`, then `supabase login`).
3. Link this app to your project:
   ```bash
   cd app
   supabase link --project-ref <your-project-ref>
   ```
4. Apply migrations:
   ```bash
   npm run db:push
   ```
5. Ensure Realtime is enabled for `users`, `beers`, `events`, `wall_of_fame`, and `beer_stamps`.

### 2. Configure the App

1. Create an `.env` file in the `app/` directory (use `.env.example` as a template).
2. Add your **Supabase URL** and **Anon Key**:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### 3. Install & Run

```bash
cd app
npm install --legacy-peer-deps
npx expo start --clear
```

## 📱 Usage

1. **Authentication**: Select/Create a user in **Settings**.
2. **Admin**: Use **Home** to start a new event round.
3. **Log Beer**: 
   - **Admins**: Use **Add** to log for anyone.
   - **Participants**: Use **Home** → Scan QR to log your own.
4. **History**: View or clear logs in the **History** tab.
5. **Legends**: Celebrate past winners in the **Legends** gallery.

## 🏗 Tech Stack

- **Framework**: React Native + Expo (SDK 54)
- **Navigation**: Expo Router (v4)
- **Backend**: Supabase (Postgres + Real-time)
- **Design**: iOS HIG optimized Theme System
- **Security**: JWT-based SecureStore (Native) & LocalStorage (Web)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
