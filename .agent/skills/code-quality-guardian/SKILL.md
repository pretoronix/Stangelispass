---
name: Code Quality Guardian
description: Skill for maintaining code quality, formatting, and linting.
---

# Code Quality Guardian

This skill encapsulates the code quality enforcement logic originally handled by the `code-quality-guardian` agent.

## Capabilities
- **Lint Fixing**: Automatically fixes common linting issues.
- **Code Formatting**: Enforces Prettier formatting standards.
- **Console Cleaning**: Replaces `console.log` statements with proper reporting utilities.
- **Quality Auditing**: Generates complexity and quality reports.
- **Auto-Refactoring**: Leverages agentic intelligence to apply complex refactoring patterns (e.g., early returns, extracting hooks).

## Refactor Guide
When reviewing or refactoring code in this project, prioritize:
1. **Early Returns**: Guard clauses should handle edge cases at the start of functions.
2. **Hook Extraction**: Move complex state logic into custom hooks.
3. **Semantic Naming**: Use clear, descriptive names for functions and variables.
4. **Error Handling**: Use `reportError()` in all catch blocks.
5. **Types over Any**: Never use `any`; use specific types or generics.

## Usage
Use the provided workflows to trigger quality checks:
- `check-quality`: Runs lint fixes, formatting, and auto-refactoring check.
- `replace-console`: Runs the console cleaning script.
- `quality-report`: Generates a comprehensive quality and complexity report.

## Related Agents Scripts
- `agents/scripts/replace-console.ts`
- `agents/scripts/analyze-quality.ts`
- `agents/scripts/analyze-complexity.ts`
