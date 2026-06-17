import {
  consumeEventCredit,
  getAvailableCredits,
  grantEventCredits,
  hasLifetimeAccess,
} from "@/services/eventPasses";

// Force the real (DB-touching) code path; UI-only mode short-circuits it.
jest.mock("@/config/payments", () => ({
  isPaymentsUiOnly: () => false,
}));

/**
 * A tiny in-memory `users` row plus a Supabase-shaped query builder that
 * faithfully simulates compare-and-swap semantics: an UPDATE only applies when
 * its `.eq`/`.is` guard still matches the stored value, and `.select()` returns
 * the affected rows (empty array when the guard misses). This lets us exercise
 * the retry loop and prove a credit can't be double-spent or lost under
 * contention.
 */
type Row = Record<string, any>;

let row: Row;
let selectError: any = null;
let updateError: any = null;

const makeQuery = () => {
  const state: any = {
    op: null,
    patch: null,
    conditions: [] as { column: string; value: any; isNull?: boolean }[],
  };

  const builder: any = {
    select: jest.fn((_cols?: string) => {
      if (state.op === "update") {
        // Terminal for an update: evaluate the CAS guard.
        return Promise.resolve(applyUpdate(state));
      }
      state.op = "select";
      return builder;
    }),
    update: jest.fn((patch: Row) => {
      state.op = "update";
      state.patch = patch;
      return builder;
    }),
    eq: jest.fn((column: string, value: any) => {
      state.conditions.push({ column, value });
      return builder;
    }),
    is: jest.fn((column: string, _value: null) => {
      state.conditions.push({ column, value: null, isNull: true });
      return builder;
    }),
    single: jest.fn(() =>
      Promise.resolve(
        selectError
          ? { data: null, error: selectError }
          : { data: { ...row }, error: null },
      ),
    ),
  };

  return builder;
};

const applyUpdate = (state: any) => {
  if (updateError) return { data: null, error: updateError };
  // Every condition (id match + the CAS guard) must hold against current state.
  const matches = state.conditions.every((c: any) =>
    c.isNull ? row[c.column] == null : row[c.column] === c.value,
  );
  if (!matches) return { data: [], error: null };
  Object.assign(row, state.patch);
  return { data: [{ id: row.id }], error: null };
};

jest.mock("@/services/client", () => ({
  supabase: { from: jest.fn(() => makeQuery()) },
}));

beforeEach(() => {
  row = {
    id: "u1",
    free_event_credits: 0,
    paid_event_credits_day: 0,
    paid_event_credits_weekend: 0,
  };
  selectError = null;
  updateError = null;
});

describe("services/eventPasses pure helpers", () => {
  test("hasLifetimeAccess reflects flag or tier", () => {
    expect(hasLifetimeAccess(null)).toBe(false);
    expect(hasLifetimeAccess({ lifetime_pass: true } as any)).toBe(true);
    expect(hasLifetimeAccess({ subscription_tier: "lifetime" } as any)).toBe(
      true,
    );
    expect(hasLifetimeAccess({ subscription_tier: "craft" } as any)).toBe(
      false,
    );
  });

  test("getAvailableCredits defaults missing balances to 0", () => {
    expect(getAvailableCredits(null)).toEqual({ free: 0, day: 0, weekend: 0 });
    expect(
      getAvailableCredits({
        free_event_credits: 2,
        paid_event_credits_day: 1,
      } as any),
    ).toEqual({ free: 2, day: 1, weekend: 0 });
  });
});

describe("consumeEventCredit", () => {
  test("spends a free credit first", async () => {
    row.free_event_credits = 1;
    row.paid_event_credits_day = 3;

    const res = await consumeEventCredit("u1", "day");

    expect(res).toEqual({ ok: true, used: "free" });
    expect(row.free_event_credits).toBe(0);
    expect(row.paid_event_credits_day).toBe(3);
  });

  test("spends the paid credit matching the pricing type when no free credits", async () => {
    row.paid_event_credits_weekend = 2;

    const res = await consumeEventCredit("u1", "weekend");

    expect(res).toEqual({ ok: true, used: "weekend" });
    expect(row.paid_event_credits_weekend).toBe(1);
  });

  test("does not spend a mismatched pricing type", async () => {
    row.paid_event_credits_weekend = 2; // only weekend credits, but day requested

    const res = await consumeEventCredit("u1", "day");

    expect(res).toEqual({ ok: false, reason: "no_credits" });
    expect(row.paid_event_credits_weekend).toBe(2);
  });

  test("returns no_credits when the balance is empty", async () => {
    const res = await consumeEventCredit("u1", "day");
    expect(res).toEqual({ ok: false, reason: "no_credits" });
  });

  test("surfaces credits_unavailable when the column is missing", async () => {
    selectError = { code: "42703", message: "column ... does not exist" };
    const res = await consumeEventCredit("u1", "day");
    expect(res).toEqual({ ok: false, reason: "credits_unavailable" });
  });

  test("cannot double-spend a single free credit under a concurrent start", async () => {
    row.free_event_credits = 1;

    // Two concurrent consumes against the same starting balance.
    const [a, b] = await Promise.all([
      consumeEventCredit("u1", "day"),
      consumeEventCredit("u1", "day"),
    ]);

    const successes = [a, b].filter((r) => r.ok);
    // Exactly one wins; the other re-reads the now-zero balance.
    expect(successes).toHaveLength(1);
    expect(row.free_event_credits).toBe(0);
    const loser = [a, b].find((r) => !r.ok);
    expect(loser).toEqual({ ok: false, reason: "no_credits" });
  });
});

describe("grantEventCredits", () => {
  test("initialises a null balance (CAS guards on IS NULL)", async () => {
    row.paid_event_credits_day = null;

    const res = await grantEventCredits("u1", "day", 2);

    expect(res).toEqual({ ok: true });
    expect(row.paid_event_credits_day).toBe(2);
  });

  test("adds to an existing balance", async () => {
    row.paid_event_credits_weekend = 1;

    const res = await grantEventCredits("u1", "weekend", 3);

    expect(res).toEqual({ ok: true });
    expect(row.paid_event_credits_weekend).toBe(4);
  });

  test("does not lose an increment under concurrent grants", async () => {
    row.paid_event_credits_day = 0;

    const [a, b] = await Promise.all([
      grantEventCredits("u1", "day", 1),
      grantEventCredits("u1", "day", 1),
    ]);

    expect(a.ok && b.ok).toBe(true);
    // Both increments must land thanks to the CAS retry on the loser.
    expect(row.paid_event_credits_day).toBe(2);
  });

  test("surfaces credits_unavailable when the table is missing", async () => {
    selectError = { code: "PGRST205" };
    const res = await grantEventCredits("u1", "day", 1);
    expect(res).toEqual({ ok: false, reason: "credits_unavailable" });
  });
});
