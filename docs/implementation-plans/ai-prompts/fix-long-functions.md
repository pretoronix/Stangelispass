# AI Refactoring Plan: Fix Long Functions

This document serves as an instruction set for an AI agent (like Cursor or Github Copilot Workspace) to systematically fix the long function issues identified in `docs/refactoring/code-quality.md`.

## Goal
Reduce the cyclomatic complexity and line counts of the worst offending screens (`HomeScreen`, `AddBeerScreen`) down to < 100 lines per component by extracting logic into custom hooks or smaller sub-components.

## Instructions for the AI Agent

### General Rules
1. **Preserve Behavior:** Do not change any underlying business logic, routing, or state updates.
2. **Move to Hooks:** The easiest way to reduce component size is to pull `useCallback`, `useState`, and `useEffect` logic into dedicated hooks in `app/src/hooks/`.
3. **Move to Sub-components:** Extract complex JSX into pure presentational sub-components in `app/src/components/`.
4. **Testing Checklist:** Ensure you keep stable `testID` accessibility tokens intact.

---

## 1. HomeScreen (`app/src/app/(tabs)/index.tsx`)
Currently around 300+ lines.
- **Action A:** Identify the remaining `useCallback` functions (e.g., `handleShareLeaderboard`, `handleStartRound`) and extract them into a single hook, `useHomeActions.ts`.
- **Action B:** The JSX `FlatList` `renderItem` is already extracted somewhat to `LeaderboardItem`, but `ListHeaderComponent` `HomeHeader` has lots of props. Consider wrapping the `HomeHeader` component state securely so the `HomeScreen` itself is just a simple glue layer.

## 2. AddBeerScreen (`app/src/app/add.tsx`)
Currently around 160+ lines.
- **Action A:** Extract the QR logic (`handleUserQr`, `handleParticipantQr`, `openQrModal`, `closeQrModal`) into a unified `useAddQrModal.ts` hook.
- **Action B:** Extract the main returned JSX into a `AddBeerLayout` component, or split the logic out so the default export is very clean.

## 3. AppProvider (`app/src/providers/AppProvider.tsx`)
- *Note:* This file may have already been refactored in a previous pass into smaller files (like `useAppProviderState.ts`). 
- **Action:** If there are still large logic blocks, extract them to `app/src/providers/hooks/`. Otherwise, mark it as completed.

## Next Steps for the AI Developer
If you are an AI reading this:
1. Run `make quality-report` to view the latest stats.
2. Target `HomeScreen` using `docs/implementation-plans/ai-prompts/fix-long-functions.md` as your guide.
3. Once completed, run `cd app && npm run typecheck` and `cd app && npm test` to ensure you didn't break functionality.
