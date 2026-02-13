# Bug Reports

This directory contains detailed bug reports and their resolutions for critical issues encountered in the Stängelispass app.

## Purpose

Bug reports serve as:
- **Historical Record:** Track what went wrong and how it was fixed
- **Learning Resource:** Document lessons learned and prevention strategies
- **Reference:** Help diagnose similar future issues
- **Quality Improvement:** Identify patterns and systemic issues

## Report Format

Each bug report should include:

1. **Summary:** One-line description of the bug
2. **Status:** Current state (RESOLVED, IN PROGRESS, etc.)
3. **Severity:** Impact level (Critical, High, Medium, Low)
4. **Error Details:** Full error messages and stack traces
5. **Root Cause:** Technical explanation of what went wrong
6. **Fix Applied:** Code changes made to resolve the issue
7. **Verification:** How the fix was tested
8. **Lessons Learned:** Prevention strategies and best practices

## Reports Index

### 2026-02-13

#### [CacheManager Syntax Error](./2026-02-13-cachemanager-syntax-error.md) ✅ RESOLVED
**Severity:** Critical  
**Impact:** iOS app crash, Metro bundler failure  
**Root Cause:** reportError() options object embedded in error message string  
**Resolution Time:** 3 minutes  

**Quick Summary:** Syntax error in `cacheManager.ts` line 79 caused by placing the options object inside the template literal instead of as a separate function argument. Fixed by moving the object outside the string and formatting as multi-line function call.

---

## Filing a New Bug Report

When creating a new bug report:

1. **File Name:** Use format `YYYY-MM-DD-brief-description.md`
2. **Location:** Save in this directory
3. **Template:** Use existing reports as reference
4. **Index:** Update this README with a summary

### Minimum Required Information

- Date and time of occurrence
- Error message(s) and stack traces
- Steps to reproduce
- Environment details (OS, device, versions)
- Impact on users/functionality
- Attempted solutions

### Optional Information

- Screenshots or screen recordings
- Crash logs from device
- Related GitHub issues or PRs
- Similar historical bugs
- Performance metrics

## Bug Severity Levels

- **Critical:** App crash, data loss, complete feature failure
- **High:** Major functionality broken, significant user impact
- **Medium:** Feature partially broken, workaround available
- **Low:** Minor issue, cosmetic problem, edge case

## Resolution Statuses

- ✅ **RESOLVED:** Bug fixed and verified
- 🔄 **IN PROGRESS:** Actively being worked on
- 🔍 **INVESTIGATING:** Root cause being diagnosed
- ⏸️ **BLOCKED:** Waiting on external dependency
- 📝 **DOCUMENTED:** Known issue, workaround available
- ❌ **WONTFIX:** Not addressing (with explanation)

## Related Documentation

- [Developer Guide](../agents.md) - Developer quickstart
- [Integration Tests](../../testing/integration-tests.md) - Test suite documentation
- [Refactoring History](../../refactoring/refactoring-history.md) - Code quality improvements
- [Deployment Checklist](../../deployment/deployment-checklist.md) - Pre-deploy verification

## Prevention Best Practices

Based on historical bugs:

1. **Run typecheck:** Always run `npm run typecheck` before committing
2. **Test locally:** Test Metro bundler before pushing to device
3. **Use IDE features:** Enable TypeScript error highlighting
4. **Code review:** Double-check complex template literals
5. **Automated testing:** Run integration tests regularly
6. **Pre-commit hooks:** Add validation to git hooks

---

**Last Updated:** 2026-02-13  
**Total Reports:** 1  
**Resolved:** 1 (100%)
