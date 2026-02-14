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

The Stängelispass project includes an advanced agentic AI workflow system with two complementary subsystems:

1. **Quality Agents**: Automate code quality, testing, and maintenance
2. **Swarm Agents** ✨ NEW: Multi-agent collaboration for strategic planning and documentation

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

#### Quality Agents (2 agents)

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

---

#### Swarm Agents (4 agents) ✨ NEW

Multi-agent AI collaboration system for strategic planning and documentation management.

#### 3. Strategy Agent 🎯

**Capabilities:**
- Roadmap analysis against actual implementation
- Feature completion gap detection
- Backlog prioritization
- Phase planning

**Responsibilities:**
- Scan codebase for implementation evidence
- Compare roadmap vs. reality
- Propose roadmap updates
- Identify strategic gaps

**Voting Weight**: 2.0 (High influence)

#### 4. Product Agent 💡

**Capabilities:**
- User value assessment
- Feature evaluation from product perspective
- Marketing content generation
- ROI estimation

**Responsibilities:**
- Evaluate features for user impact
- Write compelling descriptions
- Assess competitive positioning
- Maintain product documentation

**Voting Weight**: 1.5 (Medium influence)

#### 5. Technical Agent ⚙️

**Capabilities:**
- Implementation complexity analysis
- Technical dependency mapping
- Effort estimation
- Architecture review

**Responsibilities:**
- Assess technical feasibility
- Identify dependencies
- Estimate implementation effort
- Flag technical debt

**Voting Weight**: 2.0 (High influence)

#### 6. Documentation Agent 📚

**Capabilities:**
- Cross-document consistency validation
- Version/date checking
- Link integrity verification
- Completeness analysis

**Responsibilities:**
- Validate cross-references
- Check consistency across docs
- Enforce documentation standards
- Ensure completeness

**Voting Weight**: 1.5 (Medium influence)

### Swarm Agent Workflows

#### Roadmap Update Workflow
1. **Analysis**: Scan codebase for completed features
2. **Proposal**: Generate roadmap update suggestions
3. **Discussion**: Agents comment on proposals
4. **Consensus**: Weighted voting (75% threshold)
5. **Execution**: Apply approved changes

#### Feature Brainstorm Workflow
1. **Ideation**: Identify user needs and trends
2. **Evaluation**: Assess complexity and value
3. **Refinement**: Discuss tradeoffs
4. **Decision**: Vote and create plans

#### Documentation Sync Workflow
1. **Audit**: Scan all documentation
2. **Verification**: Validate against codebase
3. **Update**: Fix inconsistencies

### Quick Start

#### Quality Agents

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

#### Swarm Agents ✨ NEW

```bash
# Full swarm analysis (default: dry-run)
npm run swarm:analyze

# Update roadmap only
npm run swarm:roadmap

# Sync all documentation
npm run swarm:docs

# Brainstorm new features
npm run swarm:brainstorm

# Apply changes (disable dry-run)
npm run swarm:analyze -- --no-dry-run
```

### Documentation

- **[Quality Maintenance Guide](./QUALITY_MAINTENANCE.md)** - How to use quality agents
- **[Swarm Agents Guide](../../agents/docs/SWARM_AGENTS.md)** ✨ NEW - Multi-agent system
- **[Architecture](./agents/docs/AGENTS_ARCHITECTURE.md)** - System design
- **[Development Guide](./agents/docs/AGENT_DEVELOPMENT.md)** - Create new agents
- **[Agent README](./agents/README.md)** - Configuration reference

### Features

#### Quality Agents
✅ **Rollback Protection** - Automatic backup before changes  
✅ **Dry-Run Mode** - Preview changes without applying  
✅ **Structured Logging** - All actions logged to `agents/agent.log`  
✅ **CI/CD Integration** - GitHub Actions workflows included  
✅ **Hybrid Autonomy** - Safe actions auto-execute, complex ones need approval

#### Swarm Agents ✨ NEW
✅ **Multi-Agent Collaboration** - 4 specialized AI agents work together  
✅ **Consensus Decision Making** - Weighted voting system (75% threshold)  
✅ **Roadmap Analysis** - Automated gap detection vs. implementation  
✅ **Strategic Insights** - AI-driven feature recommendations  
✅ **Documentation Sync** - Cross-document consistency validation  
✅ **Dry-Run Default** - Safe testing before applying changes  
✅ **Human-in-the-Loop** - Major decisions require approval
✅ **Hybrid Autonomy** - Safe actions auto-execute, complex ones need approval

### Maintenance Schedule

#### Quality Agents
- **Pre-Commit:** Auto-fix linting, formatting (automatic)
- **Daily:** Quality reports, complexity analysis (GitHub Actions)
- **Manual:** Full analysis when needed (`npm run quality`)

#### Swarm Agents ✨ NEW
- **Weekly:** Roadmap synchronization (`npm run swarm:roadmap`)
- **Weekly:** Documentation audits (`npm run swarm:docs`)
- **Monthly:** Feature brainstorming (`npm run swarm:brainstorm`)
- **On-Demand:** Full strategic analysis (`npm run swarm:analyze`)

---

**Total Agents**: 6 (2 Quality + 4 Swarm)  
**System Status**: ✅ Production Ready  
**Last Updated**: February 13, 2026

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
