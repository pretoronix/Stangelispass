# Stängelispass Testing Guide 🧪

A comprehensive strategy for ensuring app stability, combining **Behavior-Driven Testing** with robust **Mock Factories**.

## 🏗️ Testing Architecture

We follow the **Testing Pyramid**:
1.  **Unit Tests (Logic)**: `services/` and `utils/` (High-speed, 100% coverage).
2.  **Feature/Integration Tests**: `__tests__/MvpFeatures.test.tsx` (Verifies user flows).
3.  **Manual Smoke Tests**: Physical hardware verification (Haptics, Camera).

---

## 🏭 Mock Factories

Use factories to keep tests DRY and maintainable. Define these in `src/__tests__/factories.ts`.

```typescript
// Example User Factory
export const getMockUser = (overrides?: Partial<User>): User => ({
  id: 'uuid-123',
  name: 'Patrick',
  is_admin: false,
  subscription_tier: 'pilsner',
  ...overrides
});

// Example Beer Factory
export const getMockBeer = (overrides?: Partial<Beer>): Beer => ({
  id: 'beer-123',
  user_id: 'uuid-123',
  created_at: new Date().toISOString(),
  ...overrides
});
```

---

## 🛠️ Automated Testing Patterns

### 1. Mocking Supabase
We use a centralized mock in `jest-setup.js`. To override behavior in a specific test:
```typescript
import { createClient } from '@supabase/supabase-js';

const mockFrom = (createClient() as any).from;
mockFrom.mockReturnValue({
  select: () => ({ data: [], error: null })
});
```

### 2. Testing Sensory UX (Haptics)
Always verify that haptics are triggered on critical actions:
```typescript
import * as Haptics from 'expo-haptics';

it('triggers heavy impact on beer log', () => {
    // ... trigger log action
    expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Heavy
    );
});
```

---

## 📋 Manual Smoke Test Checklist

| Feature | Action | Expected Result |
| :--- | :--- | :--- |
| **Haptics** | Add a beer | Physical vibration (Heavy) |
| **Camera** | Scan QR Code | Success alert + Leaderboard update |
| **Sharing** | Export CSV | iOS Share Sheet appears |
| **Persistence** | Reload App | Beer count remains accurate |
| **Permissions** | Deny Camera | Graceful error message shown |

---

## 🚀 Execution Commands

```bash
# 1. Type Check
npx tsc --noEmit

# 2. Run All Tests
npm test

# 3. Run Specific Feature
npx jest src/__tests__/MvpFeatures.test.tsx --watch
```

## 🧠 Behavioral Guidelines

1.  **Red-Green-Refactor**: Always write a failing test before fixing a bug.
2.  **Test Behavior, Not State**: Check if the user sees the "Success" alert, don't just check the variable `isLoading` is false.
3.  **Clear Mocks**: Ensure `jest.clearAllMocks()` is in `beforeEach` to prevent cross-test contamination.
