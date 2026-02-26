# Quality Maintenance Guide

## Quick Start

Run quality checks and fixes:

```bash
# Analyze code quality (no changes)
npm run agent manual

# Run pre-commit fixes (auto-fix linting, formatting)
npm run agent pre_commit

# Daily quality report
npm run agent daily_cron
```

## What the Agents Do

### Code Quality Guardian 🛡️

**Autonomous Actions (run automatically):**
- `auto_fix_lint` - Fixes ESLint errors with --fix
- `format_code` - Formats code with Prettier
- `replace_console` - Replaces console.* with reportError()

**Advisory Actions (generate reports):**
- `analyze_quality` - Code quality metrics
- `analyze_complexity` - Cyclomatic complexity analysis
- `suggest_refactoring` - Code smell detection

### Test Coverage Enforcer 🧪

**Autonomous Actions:**
- `run_affected_tests` - Runs tests for changed files
- `update_snapshots` - Updates test snapshots

**Advisory Actions:**
- `coverage_report` - Test coverage analysis
- `detect_flaky_tests` - Identifies potentially flaky tests
- `suggest_integration_tests` - Suggests integration test suites

## Current Codebase Health

**From latest analysis:**

- **TypeScript Coverage:** 95% 🟢
- **'any' Type Usage:** 58 occurrences 🟢 (Improved through direct Row types)
- **Console Statements:** 8 remaining ⚠️ (In audit)
- **Error Handling Score:** 45% 🟡 (Improving)
- **Complex Functions:** 18 out of 219 (8%) 🟢 (Reduced through extraction)
- **Code Smells:** 2,412 total (Down from 2,682)
  - 38 long functions (>50 lines) (Reduced `HomeScreen`, `AddBeerScreen`, `AppProvider`)
  - 2,362 deep nesting issues
  - 58 'any' types
  - 8 console statements
- **Test Coverage:** 5% (Targeting 50%+) 🟡

## Priority Actions

### High Priority 🔴

1. **Fix long functions** (43 functions >50 lines)
   - AppProvider.tsx (347 lines)
   - HomeScreen (293 lines)
   - AddBeerScreen (293 lines)
   - See full list with: `npm run agent manual`

2. **Improve test coverage** (currently 1%)
   - 101 files without tests
   - Run: `npm run agent manual` to see coverage report

3. **Improve error handling** (32% score)
   - Add reportError() to more error handlers
   - Replace remaining 11 console.* calls

### Medium Priority 🟡

1. **Reduce complexity** (26 complex functions)
   - useBeers (complexity: 43)
   - AddBeerScreen (complexity: 42)
   - HomeScreen (complexity: 35)

2. **Replace 'any' types** (65 occurrences)
   - Use specific types or 'unknown' with type guards

3. **Fix deep nesting** (2,362 instances)
   - Use early returns
   - Extract nested logic to functions

### Low Priority 🟢

1. **Extract duplicate strings** (126 instances)
2. **Replace magic numbers** (67 instances)
3. **Reduce long parameter lists** (10 instances)

## Maintenance Schedule

### Pre-Commit (Automatic)
```bash
npm run agent pre_commit
```
- Auto-fixes linting errors
- Formats code with Prettier

### Daily (Scheduled via GitHub Actions)
```bash
npm run agent daily_cron
```
- Generates quality report
- Analyzes complexity
- Suggests refactoring
- Runs full test suite

### Manual (As Needed)
```bash
npm run agent manual
```
- All analysis scripts
- Comprehensive reports
- No automatic changes

## Agent CLI Reference

```bash
# General format
npm run agent <trigger> [options]

# Available triggers
pre_commit     # Pre-commit hooks
post_commit    # Post-commit actions
pr_opened      # When PR is created
daily_cron     # Daily scheduled run
manual         # Manual execution

# Options
--dry-run      # Preview without changes
--skip-approval # Skip approval prompts (dangerous!)
```

## Rollback Protection

All autonomous actions create backups before making changes:

- Backups stored in `agents/.backups/`
- Automatic rollback on failure
- Old backups cleaned after 7 days

## Logs

All agent executions logged to:
```
agents/agent.log
```

View recent activity:
```bash
tail -50 agents/agent.log
```

## Troubleshooting

**Agent not running:**
- Check `enabled: true` in manifest
- Verify trigger event
- Review `agents/agent.log`

**Action fails:**
- Check timeout (default: 300s)
- Enable debug logging
- Review error in logs

**Permission denied:**
- Check permissions in manifest
- Verify file access

## Next Steps

1. **Run daily:** `npm run agent daily_cron`
2. **Review reports** and prioritize fixes
3. **Gradually reduce** code smells
4. **Increase test coverage** from 1% to 80%+
5. **Monitor metrics** over time

## Documentation

- [Architecture](agents/docs/AGENTS_ARCHITECTURE.md)
- [Development Guide](agents/docs/AGENT_DEVELOPMENT.md)
- [Agent README](agents/README.md)

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-13  
**Status:** ✅ Production Ready
