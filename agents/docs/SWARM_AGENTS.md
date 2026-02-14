# Swarm Agent System Documentation

## Overview

The Swarm Agent System is a multi-agent workflow runner that coordinates planning, documentation, and maintainability tasks. You trigger a workflow from the CLI, agents analyze the codebase and docs, then a consensus step decides what to apply. By default it runs in dry-run mode (no file changes) unless you pass `--no-dry-run`.

## Architecture

### Multi-Agent Collaboration

Core strategic agents:

1. **🎯 Strategy Agent**
   - Analyzes roadmap vs. actual implementation
   - Detects feature completion gaps
   - Proposes roadmap updates
   - Prioritizes backlog items

2. **💡 Product Agent**
   - Evaluates features from user perspective
   - Assesses value propositions and ROI
   - Writes compelling feature descriptions
   - Maintains marketing content

3. **⚙️ Technical Agent**
   - Assesses implementation complexity
   - Identifies technical dependencies
   - Estimates effort levels
   - Flags technical debt

4. **📚 Documentation Agent**
   - Validates cross-references
   - Checks version/date consistency
   - Enforces documentation standards
   - Ensures completeness

Maintainability swarm agents:

5. **🏗️ Refactor Agent**
   - Proposes behavior-preserving refactors
   - Decomposes large modules
   - Simplifies control flow

6. **🧭 Maintainability Auditor**
   - Identifies hotspots and code smells
   - Scores maintainability risk
   - Prioritizes refactor candidates

7. **📦 Dependency Curator**
   - Detects circular imports
   - Flags unused dependencies
   - Suggests consolidation

8. **🧪 Regression Guard**
   - Identifies test gaps for refactors
   - Defines safety checks
   - Verifies behavior preservation

### Collaboration Protocol

Agents follow a structured workflow:

```
1. ANALYSIS PHASE
   ↓ Agents scan their domain
2. PROPOSAL PHASE
   ↓ Agents propose changes
3. DISCUSSION PHASE
   ↓ Agents comment on proposals
4. CONSENSUS PHASE
   ↓ Weighted voting
5. EXECUTION PHASE
   ↓ Approved changes applied
```

### Consensus Mechanism

- **Voting**: Weighted by agent expertise
- **Threshold**: 75% approval required (configurable)
- **Tie-Breaker**: Strategy Agent has final say
- **Safety**: Dry-run mode by default

## Workflows

### 1. Roadmap Update (`roadmap_update`)

**Purpose**: Keep roadmap synchronized with implementation

**Phases**:
1. **Analysis**: Scan codebase for completed features
2. **Proposal**: Suggest roadmap status updates
3. **Validation**: Check technical feasibility
4. **Consensus**: Vote on proposals
5. **Execution**: Update roadmap files

**Output**: Updated `feature_roadmap.md` with accurate status

### 2. Feature Brainstorm (`feature_brainstorm`)

**Purpose**: Collaboratively ideate and plan new features

**Phases**:
1. **Ideation**: Identify user needs and market trends
2. **Evaluation**: Assess complexity and effort
3. **Refinement**: Discuss tradeoffs
4. **Decision**: Vote and create implementation plans

**Output**: New feature proposals with specifications

### 3. Documentation Sync (`documentation_sync`)

**Purpose**: Ensure all docs are consistent and current

**Phases**:
1. **Audit**: Scan all documentation files
2. **Verification**: Validate against codebase
3. **Update**: Fix inconsistencies and update content

**Output**: Synchronized documentation

### 4. Maintainability Refactor (`maintainability_refactor`)

**Purpose**: Identify, prioritize, and implement refactors that improve maintainability without behavior changes

**Phases**:
1. **Audit**: Detect hotspots, smells, dependency risks
2. **Proposal**: Define refactor candidates and metrics
3. **Safety**: Add/identify tests to protect changes
4. **Consensus**: Vote and prioritize
5. **Execution**: Apply refactors and document results

**Output**: Refactor plan and applied changes

### 5. Baseline Maintenance (`baseline_maintenance`)

**Purpose**: Run the baseline agents (Technical, Documentation, Regression Guard) in a single pass.

**Phases**:
1. **Technical Audit**: Hotspots, code smells, dependency risks
2. **Documentation Audit**: Roadmap vs. codebase drift
3. **Safety Guidance**: Test and verification suggestions

**Output**: Audit notes and safety guidance (no automatic code changes)

## Usage

### Quick Start

1. Pick a workflow based on what you want to accomplish.
2. Run it in dry-run first to see the proposed changes.
3. Re-run with `--no-dry-run` to apply changes.

### CLI Commands

```bash
# Run full swarm analysis (default: dry-run)
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

### Command Line Options

```bash
# Dry run (default)
npm run swarm:analyze

# Apply changes
npm run swarm:analyze -- --no-dry-run

# Specific workflow
npm run swarm:analyze roadmap_update
npm run swarm:analyze feature_brainstorm
npm run swarm:analyze documentation_sync
npm run swarm:analyze maintainability_refactor
npm run swarm:analyze baseline_maintenance
```

### When To Use Which Workflow

- `roadmap_update`: reconcile roadmap with what is actually in code.
- `feature_brainstorm`: propose new features and draft specs.
- `documentation_sync`: clean up and align docs with reality.
- `maintainability_refactor`: identify and apply refactors (behavior-preserving).
- `baseline_maintenance`: run baseline checks across technical risk, docs drift, and safety.

### Output And Artifacts

- Dry-run: logs only, no file changes.
- Non-dry-run: applies changes and writes a report.
- Maintainability refactor report: `docs/refactoring/refactor-swarm-report.md`.

### Common Runs

```bash
# Baseline health check (no file changes)
npm run swarm:analyze baseline_maintenance

# Inspect maintainability refactors without changing files
npm run swarm:analyze maintainability_refactor

# Apply maintainability refactors after review
npm run swarm:analyze maintainability_refactor -- --no-dry-run
```

## Configuration

### Swarm Configuration File

Location: `agents/config/swarm-agents.json`

Key sections:
- **agents**: Agent definitions with roles and capabilities
- **workflows**: Workflow definitions with phases
- **rules**: Voting, consensus, and safety rules
- **file_targets**: Files managed by the system

### Agent Weights

Voting weights determine influence:
- Strategy Agent: 2.0
- Technical Agent: 2.0
- Product Agent: 1.5
- Documentation Agent: 1.5
- Refactor Agent: 1.75
- Maintainability Auditor: 1.75
- Dependency Curator: 1.25
- Regression Guard: 1.5

### Safety Rules

- **Dry-run by default**: No changes without explicit flag
- **Human approval required** for:
  - Major roadmap changes
  - New phase additions
  - Feature deprecations
- **Rollback protection**: Automatic backup before changes
- **Max changes**: 10 changes per run (safety limit)

## How It Works

### Roadmap Analysis

1. **Parse roadmap.md**: Extract features and status
2. **Scan codebase**: Look for implementation evidence
3. **Compare**: Identify gaps between roadmap and reality
4. **Generate proposals**: Suggest updates
5. **Vote**: Agents decide on changes
6. **Apply**: Update roadmap (if approved)

### Gap Detection

The system identifies:
- ✅ Features marked complete but not implemented (critical)
- ✅ Features implemented but not marked complete (minor)
- ✅ Features marked in-progress but not started (moderate)

### Proposal Generation

Each proposal includes:
- **Title**: What will change
- **Description**: Why it should change
- **Rationale**: Evidence/reasoning
- **Impact**: Low/Medium/High
- **Confidence**: 0-1 score
- **Changes**: File diffs

### Consensus Voting

1. Each agent votes: Approve/Reject/Abstain
2. Votes weighted by expertise
3. Score calculated: `Σ(vote × weight) / Σ(weight)`
4. Approved if score ≥ threshold (75%)
5. Tie-breaker if needed

## Output

### Execution Report

After each run, you get:
- Workflow status (completed/failed)
- Phase execution results
- Proposals generated
- Voting results
- Changes applied (or would apply in dry-run)
- Consensus rate

### Example Output

```
╔════════════════════════════════════════════════════════════════╗
║           SWARM AGENT SYSTEM - ROADMAP ANALYSIS                ║
╔════════════════════════════════════════════════════════════════╗

Workflow: roadmap_update
Status: completed
Duration: 12.45s
Dry Run: Yes

Phases Executed: 5
  - analysis: completed
  - proposal: completed
  - validation: completed
  - consensus: completed
  - execution: completed

Proposals Generated: 3
  - Update roadmap status for: Comments System ✅ Approved
  - Update roadmap status for: Pour Animation ✅ Approved
  - Add new feature: Connection Monitoring ❌ Rejected

📊 SUMMARY:
  Agents Participated: 4
  Proposals Generated: 3
  Proposals Approved: 2
  Consensus Rate: 66.7%

✅ Workflow completed successfully!

💡 This was a DRY RUN. No changes were made.
   Run with --no-dry-run to apply changes.
```

## Integration

### With Existing Agent System

The swarm agents extend (not replace) the existing agent system:
- **Code Quality Guardian**: Still handles linting/formatting
- **Test Coverage Enforcer**: Still runs tests
- **Swarm Agents**: Handle strategy and documentation

### GitHub Actions

Add to `.github/workflows/swarm-agents.yml`:

```yaml
name: Swarm Agent Analysis

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly
  workflow_dispatch: # Manual trigger

jobs:
  swarm-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run swarm:analyze
      - run: npm run swarm:docs
```

## Best Practices

### When to Use Swarm Agents

✅ **Good for:**
- Roadmap maintenance
- Feature planning sessions
- Documentation audits
- Strategic reviews

❌ **Not for:**
- Code changes (use Code Quality Guardian)
- Test execution (use Test Coverage Enforcer)
- Build/deployment tasks

### Frequency

- **Roadmap update**: Weekly or after major features
- **Feature brainstorm**: Monthly or as needed
- **Documentation sync**: Weekly
- **Full analysis**: After milestones

### Reviewing Results

1. Check the execution report
2. Review proposals and voting results
3. Examine discussion messages
4. Verify changes in dry-run mode
5. Apply with `--no-dry-run` if satisfied

## Troubleshooting

### No Proposals Generated

**Cause**: Roadmap already in sync with implementation

**Solution**: Normal! System is working correctly.

### Low Consensus Rate

**Cause**: Proposals controversial or low confidence

**Solution**: Review agent discussions, refine proposals manually.

### Workflow Failed

**Cause**: Missing files, permission issues, or config errors

**Solution**: Check logs in `agents/agent.log`

## Future Enhancements

Planned improvements:
- AI-powered proposal generation (currently simulated)
- Natural language processing for feature extraction
- Integration with issue trackers
- Automated pull request creation
- Slack/Discord notifications
- Performance analytics dashboard

## Technical Details

### File Structure

```
agents/
├── config/
│   └── swarm-agents.json          # Agent definitions
├── lib/
│   ├── swarm-types.ts             # Type definitions
│   ├── consensus-engine.ts        # Voting logic
│   ├── roadmap-analyzer.ts        # Feature detection
│   └── swarm-orchestrator.ts      # Workflow engine
├── scripts/
│   └── run-swarm-analysis.mjs     # CLI entry point
└── docs/
    └── SWARM_AGENTS.md            # This file
```

### Dependencies

- Node.js (ES modules)
- TypeScript
- glob (file searching)
- Existing agent system infrastructure

### API

The orchestrator exposes:
- `loadConfiguration(path)`: Load config
- `executeWorkflow(name, dryRun)`: Run workflow
- `generateReport(execution)`: Create summary

---

**Version**: 1.0.0  
**Last Updated**: February 13, 2026  
**Maintainer**: Agent System Team
