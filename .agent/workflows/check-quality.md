---
description: Automatically fix linting and formatting issues in the app.
---

1. Run lint fix
// turbo
```bash
cd app && npm run lint -- --fix
```

2. Format code with Prettier
// turbo
```bash
cd app && npx prettier --write "src/**/*.{ts,tsx}"
```

3. Run auto-refactoring check (suggest-refactoring)
// turbo
```bash
npm run agent manual -- --action suggest_refactoring
```

4. (Optional) Replace console statements
// turbo
```bash
npm run agent manual -- --action replace_console
```
