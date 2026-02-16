# AGENTS.md

## Quick Commands

### App Development
- Install: `cd app && npm ci`
- Tests: `cd app && npm test`
- Coverage (baseline + changed-files gate): `cd app && node scripts/coverageRatchet.mjs` (default scope: `src/{services,utils,hooks,providers}`; set `COVERAGE_RATCHET_SCOPE=all` to include UI)
- Lint: `cd app && npm run lint`
- Typecheck: `cd app && npm run typecheck`
- Start dev: `cd app && npm run start`

### Quality Maintenance (NEW)
- **Quick check:** `npm run quality` - Full analysis + fixes
- **Auto-fix:** `npm run quality:fix` - Fix linting & formatting
- **Reports:** `npm run quality:report` - Daily quality reports
- **Manual:** `npm run agent:manual` - All analysis actions
- **Dry-run:** `npm run agent:dry-run` - Preview without changes

## Local Codex Skills

### Install
- `skill-installer` is preinstalled (system skill). Use it to install curated skills into `$CODEX_HOME/skills`.
- `gh-address-comments` is installed at `$CODEX_HOME/skills/gh-address-comments`.
- Install/refresh command: `python3 /Users/ppf/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo openai/skills --path skills/.curated/gh-address-comments`
- After installing or updating a skill, restart Codex to pick up changes.

### Use
- `gh-address-comments`: Address PR review comments using `gh` CLI for the current branch. Ensure `gh auth login` has been run, then verify with `gh auth status` before running `scripts/fetch_comments.py`.
- `skill-installer`: Use when installing curated or repo-sourced skills for Codex.

### Skills Usage Workflow (Ad hoc)

**Core rule**: Follow the trigger. Run the checklist. Stop at exit criteria.

**Tools covered**:
- `gh-address-comments`
- `skill-installer`

**Prerequisites**:
- `gh` installed and on PATH
- Run once per machine: `gh auth login`
- Guardrail: run `gh` commands only in approved network-enabled environments

**Trigger definitions**:
- `gh-address-comments` runs only if:
  - A PR exists on the remote host, and
  - The PR has review comments or requested changes
- `skill-installer` runs only if:
  - A required skill is missing, or
  - A human explicitly requests a skill update
- Do not run for preinstalled system skills

**Workflow A — No PR exists**:
- Steps: make changes, commit, push, create PR (main to main if allowed or fork to upstream), then wait for review
- Exit: PR exists and is waiting for comments

**Workflow B — PR exists with comments (`gh-address-comments`)**:
- Guardrails: PR review comments only; no unrelated refactors; no auto-merge
- Checklist:
  1. `gh auth status`
  2. Run `fetch_comments.py`
  3. Summarize threads by file/intent and classify (must/should/nice)
  4. Ask for selection if ambiguous; record scope if obvious
  5. Implement fixes on main; keep commits small
  6. Run quality checks
  7. Re-run `fetch_comments.py` to confirm all addressed
- Exit criteria:
  - All selected threads addressed
  - Quality checks pass
  - No blocking items remain

**Failure paths**:
- Auth failure: run `gh auth login`, then retry
- No PR: use Workflow A
- No comments: stop
- Ambiguous PR: require PR URL

**Workflow C — Install missing skill (`skill-installer`)**:
- Guardrails: only curated skills, no overwrite
- Checklist:
  1. Run install command
  2. Confirm destination directory exists
  3. Restart Codex
  4. Confirm the skill is available
- Outcome: existing destination means "already installed"

**Main-only repo implications**:
- Do not infer a PR from git state
- Always use explicit PR URL or `gh pr list`
- Confirm target remote

**Standard variables (placeholders)**:
```bash
export PR_URL="https://github.com/<org>/<repo>/pull/<number>"
export PR_NUMBER="<number>"
```

**AI guardrails (condensed)**:
- Must: capture current state before changes; keep commits small; run quality checks after each fix block
- Must not: force push; rewrite history; mass refactor unless requested by a reviewer

**Minimal definition of done**:
- Must-fix threads addressed or explicitly deferred with reason
- Quality checks pass
- No unrelated changes

**Commands**:
- `gh auth login`
- `gh auth status`
- `scripts/fetch_comments.py`
- `python3 /Users/ppf/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo openai/skills --path skills/.curated/gh-address-comments`

### Git Ignore
- If you install skills into the repo (for example, `./skills` or `./.codex/skills`), keep those paths in `.gitignore` to avoid accidental commits.

## Agent System ✅ PRODUCTION READY

The Stängelispass project includes an advanced agentic AI workflow system with two complementary subsystems:

1. **Quality Agents**: Automate code quality, testing, and maintenance
2. **Swarm Agents** ✨ NEW: Multi-agent collaboration for strategic planning and documentation

### 📊 Current Codebase Health

**From Latest Analysis:**
- Jest: **41 suites**, **269 tests** passing
- Jest coverage (global): **Statements 41.34%**, **Branches 33.12%**, **Functions 37.62%**, **Lines 42.31%**
- Coverage strategy: global baseline gate + per-changed-file "ratchet" gate (see `app/scripts/coverageRatchet.mjs`)

**Priority Actions:**
1. Add tests for low-coverage hotspots (start with `src/app/*.tsx` and remaining `src/services/*`)
2. Reduce complexity in large files (AppProvider/add/settings) only after adding tests for the touched paths
3. Keep coverage from backsliding by running the ratchet gate locally and in CI

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

#### Swarm Agents (12 agents) ✨

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

#### 7. Refactor Agent 🏗️
**Capabilities**: Decomposition, duplication removal, API simplification, complexity reduction.
**Responsibilities**: Behavior-preserving refactors and structure improvements.

**Voting Weight**: 1.75 (High influence)

#### 8. Maintainability Auditor 🧭
**Capabilities**: Hotspot identification, code smell detection, complexity scoring, risk assessment.
**Responsibilities**: Prioritize tech debt and define maintainability success metrics.

**Voting Weight**: 1.75 (High influence)

#### 9. Dependency Curator 📦
**Capabilities**: Dependency audits, unused code detection, circular dependency detection.
**Responsibilities**: Reduce dependency risk and consolidate fragile module edges.

**Voting Weight**: 1.25 (Medium influence)

#### 10. Regression Guard 🧪
**Capabilities**: Test gap analysis, refactor safety checks, risk-based test planning.
**Responsibilities**: Ensure refactors stay behavior-preserving with minimal, targeted tests.

**Voting Weight**: 1.5 (Medium influence)

#### 11. UX/UX Auditor 🎨
**Capabilities**: Aesthetic consistency, animation review, typography audit, haptic validation.
**Responsibilities**: Premium quality assurance and interaction consistency.

**Voting Weight**: 1.75 (High influence)

#### 12. Social Engagement Agent 🍻
**Capabilities**: Achievement design, viral loop analysis, notification strategy.
**Responsibilities**: Gamification optimization and community growth.

**Voting Weight**: 1.5 (Medium influence)

#### 13. Safety & Compliance Guardian 🛡️
**Capabilities**: GDPR audit, responsible drinking verification, age-gate checking.
**Responsibilities**: Legal/ethical oversight and privacy protection.

**Voting Weight**: 1.5 (Medium influence)

#### 14. Performance & Sync Sentinel ⚡
**Capabilities**: Supabase query audit, realtime sync optimization, offline-first resilience.
**Responsibilities**: Lag reduction, backend efficiency, offline stability.

**Voting Weight**: 1.75 (High influence)

**Canonical Source**: `agents/config/swarm-agents.json`

### Suggested New Agents (Candidates)

Not yet enabled in `agents/config/swarm-agents.json`—add only when there’s a clear workflow need.

1. **Monetization & Billing Agent 💳**: IAP/Stripe design, entitlements, receipt validation, pricing experiments.
2. **Release & Storefront Agent 🚀**: App Store metadata, screenshots, release notes, ASO iteration, versioning discipline.
3. **Localization & i18n Agent 🌍**: Translation coverage, locale formatting, copy tone consistency (DE/CH/EN).
4. **Analytics & Experimentation Agent 📈**: Funnels, cohorts, A/B tests, guardrail metrics tied to roadmap items.

### Swarm Agent Workflows

#### UX & Experience Review Workflow
1. **Visual Audit**: Scan UI tokens and aesthetic consistency.
2. **Social Evaluation**: Review gamification and social impact.
3. **Performance Check**: Assess responsiveness and sync efficiency.
4. **Consensus**: Multi-agent vote on "Delight Factor".
5. **Execution**: Generate Daily Delight Report.

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
- **[Architecture](../../agents/docs/AGENTS_ARCHITECTURE.md)** - System design
- **[Development Guide](../../agents/docs/AGENT_DEVELOPMENT.md)** - Create new agents
- **[Agent README](../../agents/README.md)** - Configuration reference

### Features

#### Quality Agents
✅ **Rollback Protection** - Automatic backup before changes  
✅ **Dry-Run Mode** - Preview changes without applying  
✅ **Structured Logging** - All actions logged to `agents/agent.log`  
✅ **CI/CD Integration** - GitHub Actions workflows included  
✅ **Hybrid Autonomy** - Safe actions auto-execute, complex ones need approval

#### Swarm Agents ✨ NEW
✅ **Multi-Agent Collaboration** - 10 specialized AI agents work together  
✅ **Consensus Decision Making** - Weighted voting system (70-80% threshold)  
✅ **Roadmap Analysis** - Automated gap detection vs. implementation  
✅ **Strategic Insights** - AI-driven feature recommendations  
✅ **UX & Experience Audits** - Specialized performance and aesthetic reviews  
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

**Total Agents**: 14 (2 Quality + 12 Swarm)  
**System Status**: ✅ Production Ready  
**Last Updated**: February 15, 2026

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
