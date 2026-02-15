---
description: Perform a visual and accessibility audit on UI components.
---

1. Scan source code for design token usage
// turbo
```bash
grep -r "color:" app/src/components | grep -v "var("
```

2. Check for interactive elements without proper IDs/labels
// turbo
```bash
grep -r "<button" app/src/components | grep -v "id="
```

3. Verify Lottie/Animation imports
// turbo
```bash
grep -r "lottie-react-native" app/src/components
```

4. Use the `UI/UX & Aesthetics Auditor` skill to review the gathered data and suggest refinements.
