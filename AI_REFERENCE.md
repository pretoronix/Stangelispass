# AI Agent Reference Document

Welcome, AI Agent! This file provides essential context, architecture, and constraints for the **Stängelispass** project. Use this reference to guide your interactions, code generation, and debugging.

## 🍺 Project Context & Overview
- **Name**: Stängelispass 
- **Description**: A social beer tracking application with real-time features, gamification, and a premium UX.
- **Current Status**: Production Ready (Version 2.0.0). 100% of MVP features complete.
- **Primary Features**: Real-time beer tracking, Comments & social interaction, Achievement system, optimistic UI updates, offline support, device-specific haptics and animations.
- **Goal**: Maintain 100% test passing (currently 126/126), zero TypeScript errors, and zero lint errors.

## 🛠️ Technology Stack
- **Frontend Framework**: React Native via **Expo** (Expo Router).
- **Backend & Database**: **Supabase** (PostgreSQL, Edge Functions, Realtime, Auth).
- **State Management**: React Query + React Context.
- **UI Library**: React Native Paper + Custom styling.
- **Language**: Strict TypeScript (100% coverage expected).
- **Testing**: Jest + React Native Testing Library.

## 🏗️ Project Structure
```text
project-root/
├── app/
│   ├── src/
│   │   ├── app/              # Expo Router screens (file-based routing)
│   │   ├── components/       # Reusable React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API & Backend services (Supabase clients)
│   │   ├── providers/        # React Context providers
│   │   ├── utils/            # Utilities (logger, preflight checks)
│   │   ├── ui/               # UI tokens, labels for testing
│   │   └── __tests__/        # Jest test files
│   └── supabase/
│       ├── migrations/       # SQL Database migrations
│       └── functions/        # Edge Functions
├── docs/                     # Extensive documentation (Architecture, roadmaps)
└── agents/                   # Configs and scripts for the custom Swarm Agents
```

## 🤖 Built-in Agent System
Stängelispass employs its own set of AI agents (Swarm & Quality Agents). 
- **Quality Agents**: Run `npm run quality` (or `npm run quality:fix`) in the root to auto-fix lint/formatting or check test coverage. Avoid backsliding by running the ratchet gate (see `app/scripts/coverageRatchet.mjs`).
- **Swarm Agents**: Used for planning and documentation sync (e.g., `npm run swarm:roadmap`). Configs are in `agents/config/swarm-agents.json`.
- *Details*: Check `docs/development/agents.md` before suggesting script modifications.

## 📜 Coding Conventions & Rules

1. **Strict Types and Linting**: Do not suppress TypeScript errors arbitrarily. Maintain `0 errors` for linting (`cd app && npm run lint`).
2. **Error Handling**: Use `reportError(error, { scope, action, eventId, userId, metadata })` from `app/src/utils/logger.ts` for all user-visible or unexpected exceptions rather than simple `console.error`.
3. **No Direct Supabase Network Calls in Tests**: Always mock `@/services/supabase` in test files. Prevent actual network access during unit and integration tests.
4. **Testing Requirements**:
   - Write tests for *all* new files (`src/services/`, `src/utils/`, `src/hooks/`, `src/providers/` primarily).
   - Use stable accessibility labels (TestIDs) from `app/src/ui/labels.ts`. Add new IDs there first, then wire them into components.
   - Run tests using `cd app && npm test`.
5. **Preflight Checks**: The app uses a preflight setup (`app/src/utils/preflight.ts`) to verify environment configurations (like Supabase credentials). Make sure `assertSupabaseConfigured()` paths handle missing keys gracefully in development.
6. **No Breaking Migrations**: Do not delete or rewrite existing Supabase migrations in `app/supabase/migrations/`. Use additive migrations, or test destructively only in local isolated branches.
7. **UI Best Practices**: Focus on high-quality, premium designs. Never use raw `Alert.alert` for main visual flows; use the designated UI error overlays or snackbars. Respect the React Native Paper theme.

## 🏁 AI Action Checklist
- [ ] Have I checked `docs/planning/project-status.md` or `docs/development/agents.md` if I'm unsure about an architecture decision?
- [ ] Does my code pass `cd app && npm run typecheck` and `cd app && npm run lint`?
- [ ] Have I written/updated tests for the new logic?
- [ ] Does the coverage ratchet (`node scripts/coverageRatchet.mjs`) pass?
