# AGENTS.md

## Quick Commands

### App Development
- Install: `cd app && npm ci`
- Tests: `cd app && npm test`
- Lint: `cd app && npm run lint`
- Typecheck: `cd app && npm run typecheck`
- Start dev: `cd app && npm run start`

### Quality Maintenance (NEW)
- **Quick check:** `npm run quality` - Full analysis + fixes
- **Auto-fix:** `npm run quality:fix` - Fix linting & formatting
- **Reports:** `npm run quality:report` - Daily quality reports
- **Manual:** `npm run agent:manual` - All analysis actions
- **Dry-run:** `npm run agent:dry-run` - Preview without changes

## Agent System ✅ PRODUCTION READY

The Stängelispass project includes an agentic AI workflow system that automates code quality maintenance, testing, and analysis.

### 📊 Current Codebase Health

**From Latest Analysis:**
- TypeScript Coverage: **95%** 🟢
- Test Coverage: **1%** 🔴 (101 files untested)
- Complex Functions: **26 out of 219** (12%) 🟡
- Code Smells: **2,682 total**
  - 43 long functions (>50 lines)
  - 2,362 deep nesting issues
  - 65 'any' types
  - 11 console statements

**Priority Actions:**
1. Fix 43 long functions (AppProvider: 347 lines!)
2. Improve test coverage from 1% to 80%+
3. Replace 65 'any' types with specific types
4. Add reportError() to improve error handling (currently 32%)

### Available Agents

#### 1. Code Quality Guardian 🛡️

**Autonomous Actions (Auto-Execute):**
- Auto-fixes ESLint errors
- Formats code with Prettier
- Replaces console.* with reportError()

**Advisory Actions (Generate Reports):**
- Code quality analysis (TS coverage, any usage, error handling)
- Cyclomatic complexity analysis (26 complex functions found)
- Code smell detection (2,682 issues identified)

#### 2. Test Coverage Enforcer 🧪

**Autonomous Actions:**
- Runs affected tests on commit
- Updates test snapshots

**Advisory Actions:**
- Coverage report (1% coverage, 101 untested files)
- Flaky test detection
- Integration test suggestions (6 areas identified)

### Quick Start

```bash
# Full quality maintenance (recommended)
npm run quality

# Just fix issues
npm run quality:fix

# Just see reports
npm run quality:report

# Manual trigger (all analysis)
npm run agent:manual

# Pre-commit (auto-fix only)
npm run agent:pre-commit

# Daily report
npm run agent:daily
```

### Documentation

- **[Quality Maintenance Guide](./QUALITY_MAINTENANCE.md)** - How to use agents
- **[Architecture](./agents/docs/AGENTS_ARCHITECTURE.md)** - System design
- **[Development Guide](./agents/docs/AGENT_DEVELOPMENT.md)** - Create new agents
- **[Agent README](./agents/README.md)** - Configuration reference

### Features

✅ **Rollback Protection** - Automatic backup before changes  
✅ **Dry-Run Mode** - Preview changes without applying  
✅ **Structured Logging** - All actions logged to `agents/agent.log`  
✅ **CI/CD Integration** - GitHub Actions workflows included  
✅ **Hybrid Autonomy** - Safe actions auto-execute, complex ones need approval

### Maintenance Schedule

- **Pre-Commit:** Auto-fix linting, formatting (automatic)
- **Daily:** Quality reports, complexity analysis (GitHub Actions)
- **Manual:** Full analysis when needed (`npm run quality`)

## Runbook
1. Check Supabase config via `.env` in `app/` or Expo extras.
2. If Supabase is unavailable, the app uses fallback/noop clients.
3. Prefer running tests after UI or service changes.

## Agentic Modules
- Logger: `app/src/utils/logger.ts`
  - Use `reportError(error, { scope, action, eventId, userId, metadata })`.
- Preflight: `app/src/utils/preflight.ts`
  - `assertSupabaseConfigured()` and `warnIfWebUnsupported(feature)`.
- Stable labels: `app/src/ui/labels.ts`
  - Add new testIDs/accessibility labels here first, then wire into screens.

## Adding TestIDs
1. Add a new entry to `app/src/ui/labels.ts`.
2. Use the constants in the screen component.
3. Add or update `app/src/__tests__/labels.spec.tsx`.

## Preflight Local Checks
- Run `node -e "require('./app/src/utils/preflight')"`.
- Or in tests: `npm test -- preflight.spec.ts`.

## Disable Supabase Calls In Tests
- Mock `@/services/supabase` in test files to prevent network access.
- Prefer local returns or noop client behavior.

## When To Use reportError
- Use `reportError` for user-visible failures, init failures, data-loading issues, and unexpected exceptions.
- Provide a stable `scope` and `action` so logs are searchable and consistent.

## Quick Test Runs
- Single file: `cd app && npm test -- <file>.spec.ts`
- UI labels: `cd app && npm test -- labels.spec.tsx`
- Preflight: `cd app && npm test -- preflight.spec.ts`

## Common Failures
- Missing Supabase env: ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set (or Expo extras configured).
- Missing Supabase tables: local fallback will be used; run migrations or sync schema if needed.
- CI lint/typecheck failures: run `npm run lint` and `npm run typecheck` locally to reproduce.

## Safety
- Do not delete migrations.
- Avoid destructive git commands unless asked.
