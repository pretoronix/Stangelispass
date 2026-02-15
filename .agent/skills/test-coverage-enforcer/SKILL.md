---
name: Test Coverage Enforcer
description: Skill for ensuring comprehensive test coverage and quality.
---

# Test Coverage Enforcer

This skill encapsulates the test enforcement logic originally handled by the `test-coverage-enforcer` agent.

## Capabilities
- **Affected Test Runner**: Runs only the tests affected by recent changes.
- **Full Suite Execution**: Runs the complete test suite with coverage reporting.
- **Flaky Test Detection**: Identifies and reports on unstable tests.
- **Component Test Generation**: Assists in generating initial tests for React components.

## Usage
Use the provided workflows to manage testing:
- `enforce-tests`: Runs affected tests and checks coverage.
- `full-test-run`: Executes the entire test suite.
- `generate-tests`: Uses the component test generator script.

## Related Agents Scripts
- `agents/scripts/generate-tests.ts`
- `agents/scripts/coverage-report.ts`
- `agents/scripts/detect-flaky-tests.ts`
