# Agent Development Guide

## Creating a New Agent

This guide walks through creating a custom agent from scratch.

### Step 1: Define the Agent Manifest

Create a YAML file in `agents/config/`:

```yaml
# agents/config/my-agent.yml
name: my-agent
version: 1.0.0
description: Brief description of what your agent does
autonomy: hybrid  # or 'autonomous' or 'advisory'
enabled: true

triggers:
  - event: manual  # Start with manual trigger for testing
    actions:
      - my_action

actions:
  my_action:
    type: autonomous  # or 'advisory'
    command: echo "Hello from my agent"
    # or use: script: scripts/my-script.ts
    timeout_seconds: 60
    rollback_on_failure: true

permissions:
  - read:code
  # Add more permissions as needed

monitoring:
  log_level: info
  metrics:
    - actions_executed
```

### Step 2: Validate the Manifest

```bash
# Install dependencies if not already installed
npm install

# Validate your manifest
node -e "
  const { AgentLoader } = require('./agents/lib/agent-loader');
  const fs = require('fs');
  const yaml = require('js-yaml');
  const data = yaml.load(fs.readFileSync('agents/config/my-agent.yml', 'utf-8'));
  const result = AgentLoader.validateManifest(data);
  console.log(result.valid ? 'Valid ✅' : 'Invalid ❌', result.errors);
"
```

### Step 3: Create Action Script (if using scripts)

Create a TypeScript file in `agents/scripts/`:

```typescript
// agents/scripts/my-script.ts
import type { AgentExecutionContext } from '../lib/types';

interface ScriptResult {
  output: string;
  metrics?: Record<string, number>;
  changes_made?: string[];
}

export default async function execute(
  context: AgentExecutionContext
): Promise<ScriptResult> {
  // Your agent logic here
  console.log(`Executing ${context.action_name} for ${context.agent_name}`);
  
  // Example: Analyze code, make changes, etc.
  const filesProcessed = 42;
  
  return {
    output: `Processed ${filesProcessed} files successfully`,
    metrics: {
      files_processed: filesProcessed,
      errors_found: 0,
    },
    changes_made: [
      'file1.ts',
      'file2.tsx',
    ],
  };
}
```

### Step 4: Test the Agent

```bash
# Test with dry-run first
npm run agent my-agent --dry-run

# Run for real
npm run agent manual
```

### Step 5: Add to CI/CD (Optional)

Edit `.github/workflows/agents.yml` to include your agent:

```yaml
- name: Run my agent
  run: |
    npx ts-node agents/scripts/agent-runner.ts manual
```

## Agent Action Types

### Command-Based Actions

Execute shell commands:

```yaml
actions:
  build_app:
    type: autonomous
    command: cd app && npm run build
    timeout_seconds: 300
    rollback_on_failure: false
```

**Pros:**
- Simple and quick
- No additional code needed
- Works with any CLI tool

**Cons:**
- Limited control
- Hard to handle complex logic
- Difficult to track metrics

### Script-Based Actions

Execute TypeScript/JavaScript functions:

```yaml
actions:
  analyze_code:
    type: advisory
    script: scripts/analyze-code.ts
    approval_required: true
```

**Pros:**
- Full control over logic
- Easy to track metrics
- Can return structured data
- Better error handling

**Cons:**
- More code to write
- Requires TypeScript knowledge

## Common Patterns

### Pattern 1: File Processing

```typescript
import * as fs from 'fs';
import { glob } from 'glob';

export default async function execute(context) {
  const files = await glob('**/*.ts', { cwd: 'app/src' });
  
  let processed = 0;
  for (const file of files) {
    // Process each file
    const content = fs.readFileSync(file, 'utf-8');
    // ... do something with content
    processed++;
  }
  
  return {
    output: `Processed ${processed} files`,
    metrics: { files_processed: processed },
  };
}
```

### Pattern 2: Code Analysis with AST

```typescript
import * as ts from 'typescript';

export default async function execute(context) {
  const program = ts.createProgram(['app/src/index.ts'], {});
  const checker = program.getTypeChecker();
  
  // Analyze TypeScript AST
  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;
    // ... analyze nodes
  }
  
  return { output: 'Analysis complete' };
}
```

### Pattern 3: Git Operations

```typescript
import { execSync } from 'child_process';

export default async function execute(context) {
  // Get changed files
  const changed = execSync('git diff --name-only', { encoding: 'utf-8' })
    .trim()
    .split('\n');
  
  // Process only changed files
  for (const file of changed) {
    // ... process
  }
  
  return {
    output: `Processed ${changed.length} changed files`,
    changes_made: changed,
  };
}
```

### Pattern 4: API Integration

```typescript
import fetch from 'node-fetch';

export default async function execute(context) {
  // Call GitHub API
  const response = await fetch('https://api.github.com/repos/...', {
    headers: {
      'Authorization': `token ${process.env.GITHUB_TOKEN}`,
    },
  });
  
  const data = await response.json();
  
  return {
    output: `Fetched ${data.length} items`,
    metrics: { items_fetched: data.length },
  };
}
```

## Trigger Events

### pre_commit
Runs before code is committed

**Use for:**
- Linting and formatting
- Running tests
- Checking for console.log

**Example:**
```yaml
triggers:
  - event: pre_commit
    actions: [lint, format, check_console]
```

### post_commit
Runs after code is committed

**Use for:**
- Generating changelog
- Updating version numbers
- Sending notifications

### pr_opened / pr_updated
Runs when PR is created or updated

**Use for:**
- Code review
- Complexity analysis
- Suggesting improvements

### daily_cron / weekly_cron
Runs on schedule

**Use for:**
- Dependency updates
- Security scans
- Performance audits
- Generating reports

### manual
Triggered manually

**Use for:**
- Deployment
- Data migrations
- One-off tasks

### file_changed
Runs when specific files change

**Use for:**
- Regenerating docs
- Updating tests
- Rebuilding assets

## Best Practices

### DO ✅

- **Start with manual triggers** for testing
- **Use dry-run mode** before autonomous actions
- **Add comprehensive logging** to scripts
- **Track metrics** for all actions
- **Handle errors gracefully** with try-catch
- **Validate inputs** before processing
- **Use TypeScript** for type safety
- **Document** your agent's purpose and usage

### DON'T ❌

- **Don't auto-commit** sensitive files
- **Don't make breaking changes** without approval
- **Don't ignore errors** in scripts
- **Don't hardcode** values (use config)
- **Don't skip testing** before enabling
- **Don't create side effects** without logging
- **Don't use console.log** (use logger)

## Testing Agents

### Unit Testing Action Scripts

```typescript
// __tests__/my-script.spec.ts
import execute from '../scripts/my-script';

describe('my-script', () => {
  it('should process files correctly', async () => {
    const context = {
      agent_name: 'test-agent',
      trigger_event: 'manual',
      action_name: 'test_action',
      started_at: new Date(),
    };
    
    const result = await execute(context);
    
    expect(result.output).toContain('files');
    expect(result.metrics?.files_processed).toBeGreaterThan(0);
  });
});
```

### Integration Testing

```bash
# Create a test branch
git checkout -b test-agent

# Run agent with dry-run
npm run agent manual --dry-run

# Verify output
cat agents/agent.log

# Run for real
npm run agent manual

# Check changes
git status
git diff

# Clean up
git reset --hard
git checkout main
```

## Debugging

### Enable Debug Logging

```bash
# In agent manifest
monitoring:
  log_level: debug

# Or via environment variable
LOG_LEVEL=debug npm run agent manual
```

### Common Debug Scenarios

**Agent not running:**
```bash
# Check if agent is enabled
cat agents/config/my-agent.yml | grep enabled

# Check if trigger matches
npm run agent manual  # Use manual trigger first
```

**Script errors:**
```bash
# Run script directly
npx ts-node agents/scripts/my-script.ts

# Check TypeScript compilation
npx tsc --noEmit agents/scripts/my-script.ts
```

**Permission denied:**
```bash
# Check permissions in manifest
cat agents/config/my-agent.yml | grep -A 10 permissions
```

## Advanced Topics

### Multi-Step Actions

Chain multiple actions:

```yaml
triggers:
  - event: deployment
    actions:
      - run_tests
      - build_app
      - deploy_staging
      - smoke_test
      - deploy_production
```

### Conditional Execution

Use conditions to control when actions run:

```yaml
actions:
  deploy:
    type: autonomous
    script: scripts/deploy.ts
    conditions:
      branch: main
      tests_passing: true
      coverage_threshold: 80
```

### Parallel Execution

Run multiple actions in parallel (future feature):

```yaml
triggers:
  - event: pr_opened
    parallel:
      - analyze_code
      - run_tests
      - check_security
```

### Custom Metrics

Track custom metrics:

```typescript
return {
  output: 'Task complete',
  metrics: {
    files_processed: 42,
    lines_changed: 1337,
    execution_time_ms: 5000,
    memory_used_mb: 128,
  },
};
```

## Examples

See `/agents/config/` for example agent manifests:
- `code-quality-guardian.yml` - Code quality maintenance
- `test-coverage-enforcer.yml` - Test coverage (coming soon)
- `documentation-maestro.yml` - Documentation sync (coming soon)

---

**Need Help?**
- Check `AGENTS_ARCHITECTURE.md` for system design
- Review example agents in `/agents/config/`
- Check logs in `/agents/agent.log`
- Run with `--dry-run` to test safely

**Contributing:**
- Follow the patterns in existing agents
- Add tests for your scripts
- Document your agent's purpose
- Update this guide with new patterns

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-13
