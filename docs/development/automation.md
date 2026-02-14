# Agent Automation

## Overview

The Stängelispass project uses automated agents for code quality, strategic planning, and feature ideation. These agents run on different schedules to maintain project health.

## Automation Schedules

### Daily (Midnight UTC)
**Workflow**: `.github/workflows/agents.yml`

**Agents**:
- Code Quality Guardian (analysis only)
- Test Coverage Enforcer (reports)

**Actions**:
- Generate quality reports
- Upload artifacts to GitHub Actions

**Trigger**: `schedule: '0 0 * * *'`

---

### Weekly (Mondays 9 AM UTC)
**Workflow**: `.github/workflows/weekly-agents.yml`

**Agents**:
- Code Quality Guardian (full report)
- Swarm Roadmap Analyzer (with writes)
- Swarm Feature Brainstorm (with writes)

**Actions**:
1. Run quality analysis → `agents/agent.log`
2. Sync roadmap with codebase → updates `docs/planning/strategy/feature_roadmap.md`
3. Extract TODOs from `docs/features/*.md` → propose new features
4. Vote on proposals (consensus threshold: 80%)
5. Apply approved changes to roadmap
6. Commit changes with message: `chore: weekly agent sync (roadmap + brainstorm) [skip ci]`
7. Upload reports as artifacts (90-day retention)

**Trigger**: `schedule: '0 9 * * 1'`

---

### On Push (main/develop)
**Workflow**: `.github/workflows/agents.yml`

**Agents**:
- Code Quality Guardian (auto-fix mode)

**Actions**:
- Auto-fix linting errors
- Format code with Prettier
- Commit fixes automatically

---

### On Pull Request
**Workflow**: `.github/workflows/agents.yml`

**Agents**:
- Code Quality Guardian (analysis)
- Test Coverage Enforcer (analysis)

**Actions**:
- Analyze code quality
- Check test coverage
- Post findings as PR comments

---

## Manual Triggers

### Run Weekly Automation Now

```bash
# Via GitHub CLI
gh workflow run weekly-agents.yml

# Or via GitHub UI:
# Actions → Weekly Agent Automation → Run workflow
```

**Options**:
- `apply_changes`: `true` (default) or `false` for dry-run

### Run Quality Check Locally

```bash
npm run quality          # Full analysis + fixes
npm run quality:report   # Analysis only (daily mode)
npm run quality:fix      # Auto-fix only
```

### Run Swarm Agents Locally

```bash
# Roadmap sync
npm run swarm:roadmap              # Dry-run (preview)
npm run swarm:roadmap -- --no-dry-run  # Apply changes

# Feature brainstorm
npm run swarm:brainstorm           # Dry-run
npm run swarm:brainstorm -- --no-dry-run  # Apply

# Both (weekly automation equivalent)
npm run swarm:weekly
```

---

## Artifacts & Reports

### Weekly Artifacts
Uploaded to GitHub Actions (90-day retention):

- **`weekly-quality-report`** - Code quality analysis log
- **`weekly-summary`** - High-level summary of agent actions
- **`roadmap-snapshot`** - Snapshot of updated roadmap (30 days)

### Accessing Artifacts

1. Go to **Actions** tab in GitHub
2. Click on **Weekly Agent Automation** workflow
3. Select the most recent run
4. Scroll to **Artifacts** section
5. Download the desired report

---

## Customizing Schedules

### Change Weekly Schedule

Edit `.github/workflows/weekly-agents.yml`:

```yaml
on:
  schedule:
    # Every Monday at 9 AM UTC → Change to Friday 5 PM
    - cron: '0 17 * * 5'
```

### Cron Syntax Quick Reference

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6, Sunday=0)
│ │ │ │ │
* * * * *
```

**Examples**:
- `0 9 * * 1` - Every Monday at 9 AM
- `0 0 * * 0` - Every Sunday at midnight
- `0 12 1 * *` - 1st of every month at noon
- `0 0 1 1 *` - January 1st at midnight

---

## Safety Features

### Rollback Protection
All swarm agents create a "Swarm Sync Log" section in the roadmap instead of directly rewriting content. This:
- Preserves the original roadmap structure
- Makes changes transparent and reversible
- Enables easy manual review

### Idempotency
Swarm agents detect if today's changes were already applied:
- Same-day reruns skip duplicate writes
- Only new proposals are added to backlog

### Dry-Run Default
All swarm commands default to dry-run mode:
- `npm run swarm:roadmap` → preview only
- Must explicitly use `--no-dry-run` to apply

### Skip CI
Weekly commits include `[skip ci]` to prevent infinite loops:
```
chore: weekly agent sync (roadmap + brainstorm) [skip ci]
```

---

## Monitoring

### Check Last Run

```bash
# Via GitHub CLI
gh run list --workflow=weekly-agents.yml --limit 5

# View logs
gh run view <run-id> --log
```

### View Commit History

```bash
git log --author="Swarm Agent System" --oneline -10
```

---

## Troubleshooting

### Workflow Failed

1. Check **Actions** tab for error logs
2. Common issues:
   - **npm install failed** → Check `package.json` dependencies
   - **Permission denied** → Verify `GITHUB_TOKEN` has `contents: write`
   - **Swarm proposals rejected** → Lower consensus threshold in `swarm-agents.json`

### No Changes Committed

This is normal if:
- All roadmap items already marked complete
- No new TODOs found in `docs/features/*.md`
- All proposals rejected by consensus voting

### Too Many/Few Proposals

Adjust in `agents/config/swarm-agents.json`:

```json
{
  "rules": {
    "safety": {
      "max_changes_per_run": 10  // Increase/decrease
    },
    "consensus": {
      "approval_threshold": 0.8  // Lower = more approvals
    }
  }
}
```

---

## Future Enhancements

- [ ] Slack/Discord notifications on weekly run completion
- [ ] Automatic PR creation for major roadmap changes
- [ ] Metrics dashboard (approval rate, proposal quality)
- [ ] Multi-repo support for organization-wide planning
- [ ] Integration with GitHub Projects for automated task creation

---

**See Also**:
- [Agent System Overview](./agents.md)
- [Swarm Architecture](../../agents/docs/SWARM_AGENTS.md)
- [GitHub Actions Workflows](../../.github/workflows/)
