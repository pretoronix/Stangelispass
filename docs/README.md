# Stängelispass Documentation

Welcome to the Stängelispass documentation! This folder contains all guides, references, and planning documents for the drinking game tracking app.

## 📁 Documentation Structure

### 🚀 [/guides](./guides)
User-facing guides and tutorials
- Getting started
- User guide
- Troubleshooting

### 💻 [/development](./development)
Developer documentation and technical guides
- **[agents.md](./development/agents.md)** - Autonomous agent system guide
- **[bug-reports/](./development/bug-reports/)** - Bug reports and resolutions
  - **[2026-02-13-cachemanager-syntax-error.md](./development/bug-reports/2026-02-13-cachemanager-syntax-error.md)** - CacheManager crash (FIXED)
- **[developer/](./development/developer/)** - Quick references and flows
  - Optimistic updates
  - Pour animation
  - React Query devtools

### ✨ [/features](./features)
Feature-specific documentation
- **[notifications.md](./features/notifications.md)** - Push notifications
- **[broadcast-notifications.md](./features/broadcast-notifications.md)** - Admin broadcasts
- **[viral-features.md](./features/viral-features.md)** - Social & sharing features
- **[comments.md](./features/comments.md)** - Comment system (if exists)

### 🧪 [/testing](./testing)
Testing documentation and results
- **[integration-tests.md](./testing/integration-tests.md)** - Integration test guide (70 tests)
- **[phase-1-summary.md](./testing/phase-1-summary.md)** - Event flow tests
- **[phase-2-summary.md](./testing/phase-2-summary.md)** - Achievement tests
- **[phase-3-summary.md](./testing/phase-3-summary.md)** - QR & offline tests
- **[complete-summary.md](./testing/complete-summary.md)** - Full test overview
- **[guide.md](./testing/guide.md)** - General testing guide

### 🚀 [/deployment](./deployment)
Deployment, monitoring, and operations
- **[deployment-checklist.md](./deployment/deployment-checklist.md)** - Pre-deploy checklist
- **[monitoring.md](./deployment/monitoring.md)** - Connection monitoring

### 🔧 [/refactoring](./refactoring)
Code quality and refactoring history
- **[refactoring-history.md](./refactoring/refactoring-history.md)** - Complete refactoring log
- **[refactoring-summary.md](./refactoring/refactoring-summary.md)** - Executive summary
- **[high-priority-items.md](./refactoring/high-priority-items.md)** - Priority refactors
- **[code-quality.md](./refactoring/code-quality.md)** - Code quality guidelines
- **[migration-guides.md](./refactoring/migration-guides.md)** - Migration instructions

### 📋 [/planning](./planning)
Strategic planning and roadmaps
- **[project-status.md](./planning/project-status.md)** - Current project status
- **[strategy/](./planning/strategy/)** - Business & technical strategy
  - Roadmap
  - Business plan
  - GitHub readiness
- **[marketing/](./planning/marketing/)** - Marketing materials
  - App store listing
  - Marketing strategy

### 📦 [/archive](./archive)
Historical and completed documentation
- Implementation plans (completed features)
- Legacy summaries
- Old specs and optimizations

---

## 🎯 Quick Links

### For New Developers
1. Start with [Description.md](../Description.md) (root) - What is this app?
2. Read [development/agents.md](./development/agents.md) - How to work with agents
3. Check [testing/integration-tests.md](./testing/integration-tests.md) - Test infrastructure

### For Contributors
1. [refactoring/code-quality.md](./refactoring/code-quality.md) - Code standards
2. [testing/guide.md](./testing/guide.md) - How to write tests
3. [deployment/deployment-checklist.md](./deployment/deployment-checklist.md) - Pre-deploy steps

### For Product Managers
1. [planning/project-status.md](./planning/project-status.md) - Current state
2. [planning/strategy/feature_roadmap.md](./planning/strategy/feature_roadmap.md) - Feature roadmap
3. [testing/complete-summary.md](./testing/complete-summary.md) - What's tested

### For Testers
1. [testing/integration-tests.md](./testing/integration-tests.md) - Full test guide
2. [testing/complete-summary.md](./testing/complete-summary.md) - Test results
3. [development/developer/](./development/developer/) - Feature quickrefs

---

## 🏆 Test Coverage Highlights

**70 Integration Tests** covering:
- ✅ Event lifecycle (create, join, log, close)
- ✅ Achievement precision (Hat Trick, badges)
- ✅ QR code scanning (all formats)
- ✅ Offline support (queue & sync)
- ✅ Concurrent operations (10+ users)

**Coverage:** 7 of 10 critical scenarios tested

See [testing/complete-summary.md](./testing/complete-summary.md) for full details.

---

## 📚 Documentation Guidelines

### When to Update Docs

- **Feature Added**: Update relevant feature doc in `/features`
- **Refactoring Done**: Update `/refactoring` history
- **Tests Added**: Update `/testing` guides
- **Deployment Change**: Update `/deployment` checklist
- **Architecture Change**: Update `/development` guides

### Documentation Standards

1. **Use Markdown**: All docs in `.md` format
2. **Clear Headings**: Use `##` for main sections
3. **Code Blocks**: Use triple backticks with language
4. **Links**: Use relative paths for internal links
5. **Emojis**: Use sparingly for visual scanning
6. **Examples**: Provide code examples where helpful

### File Naming

- Use kebab-case: `my-document.md`
- Be descriptive: `integration-tests.md` not `tests.md`
- Avoid redundancy: `features/notifications.md` not `features/notifications-feature.md`

---

## 🔄 Recent Updates

**2026-02-13**
- ✅ Reorganized entire documentation structure
- ✅ Created comprehensive testing documentation
- ✅ Consolidated 70 integration test summaries
- ✅ Moved historical docs to archive
- ✅ Improved navigation with this README

---

## 🤝 Contributing to Docs

1. **Find the right folder**: See structure above
2. **Check existing docs**: Avoid duplication
3. **Follow standards**: See Documentation Standards
4. **Update this README**: If adding new top-level sections
5. **Link from relevant places**: Help users find your doc

---

## 📞 Need Help?

- **Can't find a doc?** Check `/archive` for historical content
- **Doc outdated?** Please update it or flag for review
- **New doc needed?** Create it in the appropriate folder

---

*Documentation structure last updated: 2026-02-13*
