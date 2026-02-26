# Makefile for Stängelispass AI Coding Support
# This file provides shorthand commands for AI coding agents to run checks and validations.

.PHONY: verify quality quality-fix test typecheck format ai-report

verify:
	@echo "Running full verification (Test + Typecheck + Lint)..."
	cd app && npm test
	cd app && npm run typecheck
	cd app && npm run lint

test:
	@echo "Running test suite..."
	cd app && npm test

typecheck:
	@echo "Running TypeScript compiler checks..."
	cd app && npm run typecheck

format:
	@echo "Running Prettier..."
	cd app && npm run quality:fix

quality:
	@echo "Running full quality agent analysis..."
	npm run quality

quality-fix:
	@echo "Running quality agent auto-fixes..."
	npm run quality:fix

ai-report:
	@echo "Running AI Manual Quality Report..."
	npm run agent:manual

fix-long-functions:
	@echo "AI TASK: Please read 'docs/implementation-plans/ai-prompts/fix-long-functions.md' for instructions on tackling the long functions."
	@echo "Files to target:"
	@echo " - app/src/app/index.tsx (HomeScreen)"
	@echo " - app/src/app/add.tsx (AddBeerScreen)"
