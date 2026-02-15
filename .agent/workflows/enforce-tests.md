---
description: Run tests and ensure high coverage standards.
---

1. Run tests affected by changes
// turbo
```bash
cd app && npm test -- --onlyChanged --passWithNoTests
```

2. Run full test suite with coverage
// turbo
```bash
cd app && npm test -- --coverage --watchAll=false
```

3. Update snapshots (if needed)
// turbo
```bash
cd app && npm test -- --updateSnapshot --watchAll=false
```

4. Generate component tests
// turbo
```bash
npm run agent manual -- --action generate_component_tests
```
