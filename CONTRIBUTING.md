# Contributing to Stängelispass 🍺

First off, thank you for considering contributing to Stängelispass! It's people like you that make this tool great.

## Code of Conduct

By participating in this project, you are expected to uphold our standards of conduct. We are committed to providing a welcoming and inspiring community for all.

## How Can I Contribute?

### Reporting Bugs
If you find a bug, please open an issue in our repository. Include as much detail as possible: steps to reproduce, expected behavior, and actual behavior.

### Suggesting Enhancements
If you have an idea for a new feature or an improvement to an existing one, please open an issue describing your idea. We welcome all suggestions!

### Pull Requests
1. **Fork the repo** and create your branch from `main`.
2. **Follow the code style**: Run `npm run lint` and `npm run typecheck` to ensure your code matches our standards.
3. **Write tests**: We maintain 100% test passing. Ensure any new features are thoroughly tested. Use stable TestIDs for UI components.
4. **Agent System**: We use an AI Agent system for code quality and testing (`npm run quality`). Please make sure your code passes the agent checks.
5. **Issues**: Link the PR to the relevant issue.

## Development Setup

1. `cd app && npm ci`
2. Set up your `.env` following the `.env.example` structure.
3. `npm run start` to start the Expo development server.

## File Naming Conventions

To keep our codebase organized and maintainable, please adhere to the following file naming conventions:

- **Components (`src/components/`, `src/ui/`)**: PascalCase (`Button.tsx`, `GlassHeader.tsx`).
- **Hooks (`src/hooks/`)**: camelCase starting with `use` (`useTheme.ts`, `useAuth.ts`).
- **Services/Utilities (`src/services/`, `src/utils/`)**: camelCase (`logger.ts`, `supabaseClient.ts`).
- **Expo Router Screens (`src/app/`)**: kebab-case or standard Expo Router format (`index.tsx`, `_layout.tsx`, `settings.tsx`, `[id].tsx`).
- **Tests (`src/__tests__/`)**: Match the file they test, ending in `.spec.ts` or `.spec.tsx` (`Button.spec.tsx`).
- **Documentation (`docs/`)**: kebab-case (`deployment-checklist.md`, `agents.md`). Use UPPERCASE for major root readmes (`README.md`, `AGENTS.md`).

## Agent Reference

Before committing, please review the `AI_REFERENCE.md` file in the root for strict rules on tests, error handling, and linting.

Thanks for your contributions!
