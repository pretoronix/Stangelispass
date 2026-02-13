# Documentation Reorganization - 2026-02-13

## Overview

The Stängelispass documentation has been completely reorganized into a logical, navigable structure. All markdown files have been moved, renamed, and categorized for better discoverability.

## New Structure

```
/docs
├── README.md                    # Documentation index (START HERE)
│
├── /development                 # Developer guides
│   ├── agents.md               # Autonomous agent system
│   └── /developer              # Quick references
│       ├── optimistic-updates.md
│       ├── pour-animation.md
│       └── react-query-devtools.md
│
├── /features                    # Feature documentation
│   ├── notifications.md        # Push notifications
│   ├── broadcast-notifications.md
│   └── viral-features.md       # Social features
│
├── /testing                     # Testing documentation
│   ├── integration-tests.md    # Main testing guide (70 tests)
│   ├── complete-summary.md     # Full test summary
│   ├── phase-1-summary.md      # Event flow tests
│   ├── phase-2-summary.md      # Achievement tests
│   ├── phase-3-summary.md      # QR & offline tests
│   └── guide.md                # General testing guide
│
├── /deployment                  # Operations
│   ├── deployment-checklist.md
│   └── monitoring.md
│
├── /refactoring                 # Code quality
│   ├── refactoring-history.md  # Complete refactoring log
│   ├── refactoring-summary.md  # Executive summary
│   ├── high-priority-items.md
│   ├── code-quality.md
│   └── migration-guides.md
│
├── /planning                    # Strategic docs
│   ├── project-status.md
│   ├── /strategy
│   │   ├── feature_roadmap.md
│   │   ├── business_plan.md
│   │   ├── github_readiness.md
│   │   └── next_level_action_plans.md
│   └── /marketing
│       ├── app_store_listing.md
│       └── marketing_strategy.md
│
└── /archive                     # Historical docs
    ├── /implementation-plans    # Completed feature plans
    ├── /specs                   # Old specs
    ├── /optimization            # Historical optimization docs
    └── *.md                     # Completed summaries
```

## What Changed

### Files Moved

**From Root → docs/development:**
- `AGENTS.md` → `docs/development/agents.md`

**From Root → docs/refactoring:**
- `REFACTORING.md` → `docs/refactoring/refactoring-history.md`
- `REFACTORING_SUMMARY.md` → `docs/refactoring/refactoring-summary.md`
- `HIGH_PRIORITY_REFACTORING.md` → `docs/refactoring/high-priority-items.md`
- `QUALITY_MAINTENANCE.md` → `docs/refactoring/code-quality.md`
- `MIGRATION_GUIDE.md` → `docs/refactoring/migration-guides.md`

**From Root → docs/deployment:**
- `DEPLOYMENT_CHECKLIST.md` → `docs/deployment/deployment-checklist.md`

**From Root → docs/planning:**
- `PROJECT_STATUS.md` → `docs/planning/project-status.md`

**From Root → docs/archive:**
- `COMMENTS_INTEGRATION_SUMMARY.md` → `docs/archive/comments-integration-summary.md`
- `POUR_ANIMATION_SUMMARY.md` → `docs/archive/pour-animation-summary.md`
- `DOCUMENTATION_UPDATE.md` → `docs/archive/documentation-update.md`

**From docs → docs/features:**
- `PUSH_NOTIFICATIONS_README.md` → `docs/features/notifications.md`
- `VIRAL_UX_README.md` → `docs/features/viral-features.md`
- `features/admin-broadcast-notifications.md` → `docs/features/broadcast-notifications.md`

**From docs → docs/deployment:**
- `CONNECTION_MONITORING_README.md` → `docs/deployment/monitoring.md`

**From docs → docs/archive:**
- `VIRAL_UX_IMPLEMENTATION_SUMMARY.md` → `docs/archive/viral-ux-implementation.md`
- `DEPLOYMENT_CHECKLIST_NOTIFICATIONS.md` → `docs/archive/deployment-checklist-notifications.md`
- `implementation-plans/` → `docs/archive/implementation-plans/`
- `specs/` → `docs/archive/specs/`
- `optimization/` → `docs/archive/optimization/`

**From docs → docs/development:**
- `developer/` → `docs/development/developer/`

**From docs → docs/planning:**
- `strategy/` → `docs/planning/strategy/`
- `marketing/` → `docs/planning/marketing/`

**From docs → docs/testing:**
- `testing/testing_guide.md` → `docs/testing/guide.md`

### New Files Created

**docs/testing/**
- `integration-tests.md` - Comprehensive integration test guide
- `complete-summary.md` - Full test overview (70 tests)
- `phase-1-summary.md` - Event flow test details
- `phase-2-summary.md` - Achievement test details
- `phase-3-summary.md` - QR & offline test details

**docs/**
- `README.md` - Master documentation index

### Files Unchanged

**Root level:**
- `README.md` - Project readme (updated with new doc links)
- `Description.md` - Project description
- `LICENSE` - License file

**app/**
- All app source code and tests unchanged
- Integration test files remain in `app/src/__tests__/integration/`

## Benefits

### Before Reorganization
❌ 10+ markdown files in project root  
❌ Inconsistent naming conventions  
❌ Unclear where to find information  
❌ Historical docs mixed with current  
❌ No clear navigation path  

### After Reorganization
✅ Clean project root (3 markdown files)  
✅ Logical folder structure by purpose  
✅ Clear naming conventions  
✅ Historical docs archived  
✅ Master index with navigation  

## How to Find Things Now

### "Where's the testing documentation?"
→ `docs/testing/integration-tests.md` (start here)

### "Where's the refactoring history?"
→ `docs/refactoring/refactoring-history.md`

### "Where's the deployment checklist?"
→ `docs/deployment/deployment-checklist.md`

### "Where's the feature roadmap?"
→ `docs/planning/strategy/feature_roadmap.md`

### "Where's the old implementation plan for X?"
→ `docs/archive/implementation-plans/`

### "I just want an overview of everything"
→ `docs/README.md` (master index)

## Navigation Tips

1. **Start at `/docs/README.md`** - Master index with all links
2. **Browse by folder** - Development, Features, Testing, etc.
3. **Use search** - `grep -r "keyword" docs/`
4. **Check archive** - If you can't find it, try `docs/archive/`

## Documentation Standards

Going forward:

1. **New docs go in appropriate folder** (not root)
2. **Use kebab-case naming** (`my-doc.md`)
3. **Update docs/README.md** when adding top-level content
4. **Archive completed items** - Move to `docs/archive/`
5. **Link from multiple places** - Help users discover docs

## Breaking Changes

### For Existing Links

Old link → New link:
- `/AGENTS.md` → `/docs/development/agents.md`
- `/REFACTORING.md` → `/docs/refactoring/refactoring-history.md`
- `/DEPLOYMENT_CHECKLIST.md` → `/docs/deployment/deployment-checklist.md`
- `/PROJECT_STATUS.md` → `/docs/planning/project-status.md`

**Action Required:** Update any external links to these files.

### For CI/CD

If CI/CD references old paths, update to new structure:
```yaml
# OLD
- docs/implementation-plans/README.md
# NEW
- docs/archive/implementation-plans/README.md
```

## Maintenance

### Adding New Documentation

1. Identify the right folder:
   - Developer guide? → `docs/development/`
   - New feature? → `docs/features/`
   - Test documentation? → `docs/testing/`
   - Deployment? → `docs/deployment/`
   - Planning? → `docs/planning/`

2. Create the file with clear name

3. Update `docs/README.md` if it's a major addition

4. Link from relevant docs for discoverability

### Archiving Old Documentation

When a feature is complete or doc is superseded:

1. Move to `docs/archive/`
2. Keep folder structure (e.g., `archive/implementation-plans/`)
3. Update any "see also" links in active docs
4. Add note at top of archived doc: `> **Archived:** This document is historical. See [new-doc.md] for current info.`

## Questions?

**Can't find a document?**
1. Check `docs/README.md` index
2. Search: `find docs -name "*.md" | xargs grep "keyword"`
3. Check `docs/archive/` for historical content

**Need to create new documentation?**
1. Choose appropriate folder from structure above
2. Follow naming conventions (kebab-case)
3. Update `docs/README.md` if major addition

**Document seems outdated?**
- Update it! Documentation is living
- Or flag it for review with a GitHub issue

---

*Reorganization completed: 2026-02-13*  
*Total files moved: 30+*  
*New structure: 8 top-level categories*
