# Agentic AI Workflow System

## Phase 1: Foundation ✅ COMPLETE

This directory contains the infrastructure for automated agent workflows that help maintain code quality, enforce testing standards, keep documentation current, and accelerate feature delivery.

## What's Included

### Infrastructure ✅
- **Agent Orchestrator** (`scripts/agent-runner.ts`) - Main execution engine
- **Manifest Loader** (`lib/agent-loader.ts`) - Loads and validates agent configs
- **Type System** (`lib/types.ts`) - TypeScript definitions for all components
- **JSON Schema** (`lib/agent-schema.json`) - Validation schema for manifests
- **Logger** (`lib/logger.ts`) - Structured logging system
- **GitHub Actions** (`../.github/workflows/agents.yml`) - CI/CD integration

### Agents ✅
- **Code Quality Guardian** (`config/code-quality-guardian.yml`)
  - Auto-fixes linting issues
  - Formats code
  - Replaces console statements with reportError()
  - Generates quality reports

### Scripts ✅
- **replace-console.ts** - Replaces console.* with reportError() utility

## Quick Start

### Install Dependencies

```bash
# From root directory
npm install
```

### Run an Agent

```bash
# Run code quality checks (dry-run first for safety)
npm run agent:pre-commit --dry-run

# Run for real
npm run agent:pre-commit

# Run specific trigger
npm run agent <trigger> [options]
```

### Available Triggers

- `pre_commit` - Before committing code
- `post_commit` - After committing code
- `pr_opened` - When PR is created
- `pr_updated` - When PR is updated
- `daily_cron` - Daily scheduled run
- `weekly_cron` - Weekly scheduled run
- `manual` - Manual execution
- `file_changed` - When files change
- `deployment` - During deployment
- `test_failed` - When tests fail

### Options

- `--dry-run` - Preview changes without applying them
- `--skip-approval` - Skip approval for advisory actions (dangerous!)

## Creating a New Agent

1. Create manifest in `config/my-agent.yml`
2. Define triggers, actions, permissions
3. Create scripts in `scripts/` if needed
4. Test with `npm run agent manual --dry-run`
5. Enable and add to CI/CD

See [Development Guide](./docs/AGENT_DEVELOPMENT.md) for detailed instructions.

## Architecture

```
Trigger Event → Orchestrator → Load Manifests → Execute Actions → Log Results
                                      ↓
                          ┌───────────┴──────────┐
                          ↓                      ↓
                    Autonomous              Advisory
                 (Auto-execute)      (Generate Report)
                          ↓                      ↓
                    Commit & Push        Wait for Approval
```

See [Architecture Guide](./docs/AGENTS_ARCHITECTURE.md) for full details.

## Directory Structure

```
agents/
├── config/                    # Agent manifests (.yml)
│   └── code-quality-guardian.yml
├── scripts/                   # Action scripts (.ts)
│   ├── agent-runner.ts       # Main orchestrator
│   └── replace-console.ts    # Example script
├── lib/                      # Shared libraries
│   ├── types.ts             # TypeScript types
│   ├── agent-loader.ts      # Manifest loader
│   ├── agent-schema.json    # Validation schema
│   └── logger.ts            # Logging utility
├── templates/               # Code generation templates (future)
├── docs/                    # Documentation
│   ├── AGENTS_ARCHITECTURE.md
│   └── AGENT_DEVELOPMENT.md
└── agent.log               # Execution logs
```

## Configuration

### Agent Manifest Format

```yaml
name: my-agent
version: 1.0.0
description: What the agent does
autonomy: hybrid  # autonomous | advisory | hybrid
enabled: true

triggers:
  - event: pre_commit
    actions: [action1, action2]

actions:
  action1:
    type: autonomous  # or advisory
    command: npm run lint -- --fix
    # OR
    script: scripts/my-script.ts
    rollback_on_failure: true
    timeout_seconds: 300

permissions:
  - read:code
  - write:code
  - commit:auto_fix

monitoring:
  log_level: info
  metrics: [...]
```

## CI/CD Integration

Agents run automatically via GitHub Actions:

- **On Push:** Pre-commit quality checks
- **On PR:** Code analysis and suggestions
- **On Schedule:** Daily/weekly audits
- **Manual:** Triggered via workflow_dispatch

See `.github/workflows/agents.yml` for configuration.

## Logging

All agent executions are logged to `agent.log`:

```
[2026-02-13T18:00:00Z] [INFO] [code-quality-guardian] [auto_fix_lint] Executing action
[2026-02-13T18:00:05Z] [INFO] [code-quality-guardian] [auto_fix_lint] Action completed: success (5234ms)
```

Log levels: debug, info, warn, error

## Metrics

Agents track execution metrics:

- `lint_errors_fixed` - Number of lint errors corrected
- `files_formatted` - Files formatted
- `console_statements_replaced` - Console calls replaced
- `code_complexity_score` - Cyclomatic complexity
- `type_coverage_percentage` - TypeScript coverage
- `files_processed` - Total files processed

## Security

### Permission Model

Agents require explicit permissions:
- `read:code` - Read source files
- `write:code` - Modify source files
- `commit:auto_fix` - Commit changes
- `create:pr` - Create pull requests
- `run:tests` - Execute test suites

### Rollback Protection

Autonomous actions automatically rollback on failure:
1. Create backup
2. Execute action
3. Verify success
4. Commit OR restore from backup

### Approval Workflow

Advisory actions requiring approval:
1. Generate change preview
2. Create approval request
3. Wait for human review
4. Execute if approved

## Troubleshooting

**Agent not running:**
- Check `enabled: true` in manifest
- Verify trigger event
- Review `agents/agent.log`

**Action fails:**
- Check timeout_seconds
- Verify script path
- Enable debug logging
- Review error in logs

**Permission denied:**
- Check permissions array in manifest
- Verify file system access

## Next Steps (Phase 2+)

Planned agents:
- Test Coverage Enforcer 🧪
- Documentation Maestro 📚
- Deployment Orchestrator 🚀
- Feature Delivery Accelerator ⚡
- Performance Optimizer 🏎️
- Security Sentinel 🔒
- Dependency Manager 📦

See `~/.copilot/session-state/.../plan.md` for full roadmap.

## Resources

- **Documentation:** `./docs/`
- **Examples:** `./config/`
- **Logs:** `./agent.log`
- **Schema:** `./lib/agent-schema.json`

## Contributing

1. Follow patterns in existing agents
2. Add tests for scripts
3. Document your agent
4. Submit PR with agent manifest

---

**Phase:** 1 of 5 (Foundation)  
**Status:** ✅ Complete  
**Version:** 1.0.0  
**Last Updated:** 2026-02-13
