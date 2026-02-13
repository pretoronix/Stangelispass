# Agent System Architecture

## Overview

The Stängelispass Agent System is a comprehensive agentic AI workflow infrastructure that automates development tasks, maintains code quality, and accelerates feature delivery through autonomous and semi-autonomous agents.

## System Design

### Components

```
┌─────────────────────────────────────────────────────────┐
│                   Agent Orchestrator                     │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │   Loader   │→ │  Executor   │→ │  Result Handler  │ │
│  └────────────┘  └─────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                   ↓
┌───────────────┐  ┌──────────────┐  ┌─────────────────┐
│  Autonomous   │  │   Advisory   │  │  Approval Req   │
│    Actions    │  │   Actions    │  │    (Human)      │
└───────────────┘  └──────────────┘  └─────────────────┘
        ↓                  ↓                   ↓
┌───────────────┐  ┌──────────────┐  ┌─────────────────┐
│  Auto-commit  │  │   Generate   │  │   Wait for      │
│   & Push      │  │    Report    │  │   Approval      │
└───────────────┘  └──────────────┘  └─────────────────┘
```

### Agent Manifest Structure

Each agent is defined by a YAML manifest:

```yaml
name: agent-name
version: 1.0.0
description: What the agent does
autonomy: hybrid | autonomous | advisory
enabled: true

triggers:
  - event: pre_commit
    actions: [action1, action2]
    
actions:
  action1:
    type: autonomous
    command: npm run lint -- --fix
    rollback_on_failure: true
    
permissions:
  - read:code
  - write:code
  - commit:auto_fix
  
monitoring:
  log_level: info
  metrics: [...]
```

### Execution Flow

1. **Trigger** - Event occurs (commit, PR, cron, manual)
2. **Load** - Agent manifests loaded and validated
3. **Filter** - Find agents configured for this trigger
4. **Execute** - Run actions in sequence
   - Autonomous: Execute → Verify → Commit
   - Advisory: Analyze → Report → Wait (if approval needed)
5. **Log** - Record results, metrics, errors
6. **Notify** - Send notifications on failure/success

### Autonomy Levels

**Autonomous**
- Executes actions without human approval
- Automatically commits changes
- Rolls back on failure
- Use for: Formatting, linting, safe fixes

**Advisory**
- Generates reports and recommendations
- No automatic changes
- Human reviews and approves
- Use for: Refactoring, architecture changes

**Hybrid**
- Mix of autonomous and advisory actions
- Some actions auto-execute, others require approval
- Most flexible approach
- Use for: Most agents (e.g., Code Quality Guardian)

## Directory Structure

```
agents/
├── config/                    # Agent manifest files (.yml)
│   ├── code-quality-guardian.yml
│   ├── test-coverage-enforcer.yml
│   └── ...
├── scripts/                   # Automation scripts
│   ├── agent-runner.ts       # Main orchestrator
│   ├── replace-console.ts    # Example action script
│   └── ...
├── lib/                      # Shared libraries
│   ├── types.ts             # TypeScript types
│   ├── agent-loader.ts      # Manifest loader
│   ├── agent-schema.json    # JSON Schema validation
│   └── logger.ts            # Logging utility
├── templates/               # Code generation templates
│   └── ...
└── docs/                    # Documentation
    ├── AGENTS_ARCHITECTURE.md  (this file)
    └── AGENT_DEVELOPMENT.md
```

## Agent Types

### 1. Code Quality Guardian
- **Purpose:** Maintain code consistency
- **Autonomy:** Hybrid
- **Triggers:** pre_commit, daily_cron, pr_opened
- **Key Actions:**
  - Auto-fix ESLint errors
  - Format code with Prettier
  - Replace console.* with reportError()
  - Generate quality reports

### 2. Test Coverage Enforcer
- **Purpose:** Ensure comprehensive testing
- **Autonomy:** Hybrid
- **Triggers:** file_changed, pr_opened, daily_cron
- **Key Actions:**
  - Generate missing test files
  - Update test snapshots
  - Run affected tests
  - Report coverage metrics

### 3. Documentation Maestro
- **Purpose:** Keep docs in sync with code
- **Autonomy:** Advisory
- **Triggers:** pr_opened, weekly_cron
- **Key Actions:**
  - Generate API docs from JSDoc
  - Suggest missing documentation
  - Update version numbers
  - Fix broken links

### 4. Deployment Orchestrator
- **Purpose:** Automate safe deployments
- **Autonomy:** Advisory with autonomous components
- **Triggers:** deployment, manual
- **Key Actions:**
  - Run pre-deployment checks
  - Apply database migrations
  - Deploy Edge Functions
  - Verify deployment health

### 5. Feature Delivery Accelerator
- **Purpose:** Speed up feature implementation
- **Autonomy:** Hybrid
- **Triggers:** manual, pr_opened
- **Key Actions:**
  - Generate boilerplate from plans
  - Create test stubs
  - Add to navigation
  - Scaffold CRUD services

### 6. Performance Optimizer
- **Purpose:** Identify performance issues
- **Autonomy:** Advisory
- **Triggers:** pr_opened, weekly_cron
- **Key Actions:**
  - Analyze bundle size
  - Identify re-renders
  - Suggest optimizations
  - Monitor query performance

### 7. Security Sentinel
- **Purpose:** Prevent security vulnerabilities
- **Autonomy:** Hybrid
- **Triggers:** daily_cron, pr_opened
- **Key Actions:**
  - Scan for vulnerabilities (npm audit)
  - Check for hardcoded secrets
  - Verify RLS policies
  - Update vulnerable dependencies

### 8. Dependency Manager
- **Purpose:** Keep dependencies current
- **Autonomy:** Hybrid
- **Triggers:** weekly_cron, manual
- **Key Actions:**
  - Update patch versions (auto)
  - Suggest major updates (advisory)
  - Run tests after updates
  - Remove unused dependencies

## Data Flow

### Action Execution

```typescript
interface AgentExecutionContext {
  agent_name: string;
  trigger_event: TriggerEvent;
  action_name: string;
  started_at: Date;
  metadata?: Record<string, any>;
}

interface AgentExecutionResult {
  context: AgentExecutionContext;
  status: 'success' | 'failed' | 'approval_required';
  output?: string;
  error?: string;
  metrics?: Record<string, number>;
  changes_made?: string[];
  completed_at?: Date;
  duration_ms?: number;
}
```

### Logging

All agent actions are logged with structured data:

```
[2026-02-13T18:00:00Z] [INFO] [code-quality-guardian] [auto_fix_lint] Executing action
[2026-02-13T18:00:05Z] [INFO] [code-quality-guardian] [auto_fix_lint] Action completed: success (5234ms)
```

Log location: `agents/agent.log`

### Metrics

Agents track execution metrics:

- `lint_errors_fixed`: Number of lint errors auto-fixed
- `files_formatted`: Number of files formatted
- `console_statements_replaced`: Console calls replaced
- `code_complexity_score`: Cyclomatic complexity
- `type_coverage_percentage`: TypeScript type coverage
- `test_coverage_percentage`: Test coverage
- `bundle_size_bytes`: JavaScript bundle size
- `vulnerabilities_found`: Security issues detected

## Integration Points

### GitHub Actions

Agents integrate with CI/CD via `.github/workflows/agents.yml`:

- **On Push:** Run pre-commit agents
- **On PR:** Run analysis agents
- **On Schedule:** Run daily/weekly agents
- **Manual:** Trigger specific agents

### CLI Commands

```bash
# Run all agents for a trigger
npm run agent:pre-commit

# Run with dry-run (no changes)
npm run agent pre_commit --dry-run

# Skip approval (force execution)
npm run agent pr_opened --skip-approval

# Manual execution
npm run agent manual
```

### Pre-commit Hooks

Install as git hooks:

```bash
# .git/hooks/pre-commit
#!/bin/bash
npm run agent:pre-commit
```

## Security Considerations

### Permission Model

Agents request explicit permissions:

- `read:code` - Read source code
- `write:code` - Modify source code
- `commit:auto_fix` - Commit changes automatically
- `create:pr` - Create pull requests
- `deploy:production` - Deploy to production

### Rollback Mechanism

All autonomous actions have rollback capability:

1. Create backup before changes
2. Execute action
3. Verify success
4. If failed: Restore from backup
5. Log results

### Approval Workflow

Advisory actions requiring approval:

1. Generate change preview
2. Calculate risk level
3. Create approval request
4. Notify reviewers
5. Wait for approval
6. Execute if approved
7. Archive if rejected/expired

## Monitoring & Observability

### Dashboards

Track agent performance:

- Execution success/failure rates
- Average execution time
- Changes made per agent
- Approval wait times
- Resource usage

### Alerts

Configured alert channels:

- **Console:** Always on (local dev)
- **Slack:** Failures, approvals
- **Discord:** Failures, approvals
- **Email:** Critical failures

### Health Checks

Agents self-monitor:

- Execution timeout protection
- Memory usage limits
- API rate limiting
- Retry logic with backoff

## Troubleshooting

### Common Issues

**Agent not executing**
- Check `enabled: true` in manifest
- Verify trigger event matches
- Check permissions
- Review agent.log for errors

**Action fails repeatedly**
- Check timeout_seconds
- Verify command/script path
- Review rollback logs
- Increase retry_count

**Approval stuck pending**
- Check approval expiration
- Verify notification sent
- Review approval URL
- Manually approve/reject

### Debug Mode

Enable verbose logging:

```bash
export LOG_LEVEL=debug
npm run agent:pre-commit
```

## Future Enhancements

- **AI-Powered Analysis:** Use LLMs for smarter code analysis
- **Learning System:** Agents learn from past executions
- **Distributed Execution:** Run agents in parallel
- **Plugin System:** Custom agent types
- **Visual Dashboard:** Web UI for monitoring
- **Approval via Slack:** Approve actions from Slack
- **Cost Tracking:** Monitor API usage and costs

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-13  
**Maintainer:** Agent System Team
