import {
  createPromoCode,
  listPromoCodes,
  redeemPromoCode,
} from "@/services/promoCodes";

/**
 * The promo_codes service talks to Supabase through a fluent query builder.
 * We model that builder as a chainable mock whose terminal methods
 * (`maybeSingle`, `single`, `order`) resolve to whatever the individual test
 * queues up. Each `from()` call returns a fresh builder so reads and writes can
 * be configured independently.
 */
type QueuedResult = { data: any; error: any };

const makeBuilder = (terminals: {
  maybeSingle?: QueuedResult;
  single?: QueuedResult;
  order?: QueuedResult;
}) => {
  const builder: any = {};
  builder.select = jest.fn(() => builder);
  builder.insert = jest.fn(() => builder);
  builder.update = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.is = jest.fn(() => builder);
  builder.order = jest.fn(async () => terminals.order ?? { data: [], error: null });
  builder.maybeSingle = jest.fn(
    async () => terminals.maybeSingle ?? { data: null, error: null },
  );
  builder.single = jest.fn(
    async () => terminals.single ?? { data: null, error: null },
  );
  return builder;
};

const mockFrom = jest.fn();

jest.mock("@/services/client", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

beforeEach(() => {
  mockFrom.mockReset();
});

describe("services/promoCodes", () => {
  describe("listPromoCodes", () => {
    test("returns ordered rows", async () => {
      const rows = [{ id: "p1", code: "ABC", type: "lifetime" }];
      mockFrom.mockReturnValueOnce(
        makeBuilder({ order: { data: rows, error: null } }),
      );

      await expect(listPromoCodes()).resolves.toEqual(rows);
    });

    test("returns [] when the table is missing", async () => {
      mockFrom.mockReturnValueOnce(
        makeBuilder({ order: { data: null, error: { code: "PGRST205" } } }),
      );

      await expect(listPromoCodes()).resolves.toEqual([]);
    });

    test("rethrows unexpected errors", async () => {
      mockFrom.mockReturnValueOnce(
        makeBuilder({ order: { data: null, error: { code: "12345" } } }),
      );

      await expect(listPromoCodes()).rejects.toBeTruthy();
    });
  });

  describe("createPromoCode", () => {
    test("inserts a code and returns the created row", async () => {
      const created = { id: "p2", code: "NEW", type: "event_day", credits: 1 };
      const builder = makeBuilder({ single: { data: created, error: null } });
      mockFrom.mockReturnValueOnce(builder);

      const result = await createPromoCode("event_day", "admin-1", 1);

      expect(result).toEqual(created);
      const payload = builder.insert.mock.calls[0][0];
      expect(payload.type).toBe("event_day");
      expect(payload.created_by).toBe("admin-1");
      expect(payload.credits).toBe(1);
      expect(typeof payload.code).toBe("string");
      expect(payload.code.length).toBeGreaterThan(0);
    });

    test("returns null when the table is missing", async () => {
      mockFrom.mockReturnValueOnce(
        makeBuilder({ single: { data: null, error: { code: "PGRST205" } } }),
      );

      await expect(createPromoCode("lifetime")).resolves.toBeNull();
    });
  });

  describe("redeemPromoCode", () => {
    test("rejects an unknown code", async () => {
      mockFrom.mockReturnValueOnce(
        makeBuilder({ maybeSingle: { data: null, error: null } }),
      );

      const res = await redeemPromoCode("NOPE", "user-1");
      expect(res).toEqual({ ok: false, reason: "invalid" });
    });

    test("rejects a code that is already redeemed", async () => {
      mockFrom.mockReturnValueOnce(
        makeBuilder({
          maybeSingle: {
            data: { id: "p3", code: "USED", redeemed_by: "someone" },
            error: null,
          },
        }),
      );

      const res = await redeemPromoCode("USED", "user-1");
      expect(res).toEqual({ ok: false, reason: "already_redeemed" });
    });

    test("rejects an expired code", async () => {
      mockFrom.mockReturnValueOnce(
        makeBuilder({
          maybeSingle: {
            data: {
              id: "p4",
              code: "OLD",
              type: "event_day",
              expires_at: "2000-01-01T00:00:00.000Z",
            },
            error: null,
          },
        }),
      );

      const res = await redeemPromoCode("OLD", "user-1");
      expect(res).toEqual({ ok: false, reason: "expired" });
    });

    test("redeems a valid code with an atomic claim guard", async () => {
      const readBuilder = makeBuilder({
        maybeSingle: {
          data: {
            id: "p5",
            code: "GOOD",
            type: "lifetime",
            credits: 3,
            redeemed_by: null,
          },
          error: null,
        },
      });
      const updateBuilder = makeBuilder({
        maybeSingle: {
          data: { id: "p5", redeemed_by: "user-1" },
          error: null,
        },
      });
      mockFrom
        .mockReturnValueOnce(readBuilder)
        .mockReturnValueOnce(updateBuilder);

      const res = await redeemPromoCode("GOOD", "user-1");

      expect(res).toEqual({ ok: true, type: "lifetime", credits: 3 });
      // The claim MUST be guarded so a concurrent redemption cannot win twice.
      expect(updateBuilder.is).toHaveBeenCalledWith("redeemed_by", null);
    });

    test("loses the race when the atomic claim returns no row", async () => {
      // Two concurrent redemptions both pass the read check, but only one wins
      // the guarded UPDATE; the loser gets an empty result and must be rejected
      // as already_redeemed rather than reported as a successful redemption.
      const readBuilder = makeBuilder({
        maybeSingle: {
          data: {
            id: "p6",
            code: "RACE",
            type: "event_day",
            credits: 1,
            redeemed_by: null,
          },
          error: null,
        },
      });
      const updateBuilder = makeBuilder({
        maybeSingle: { data: null, error: null },
      });
      mockFrom
        .mockReturnValueOnce(readBuilder)
        .mockReturnValueOnce(updateBuilder);

      const res = await redeemPromoCode("RACE", "user-2");

      expect(res).toEqual({ ok: false, reason: "already_redeemed" });
    });

    test("reports codes_unavailable when the table is missing", async () => {
      mockFrom.mockReturnValueOnce(
        makeBuilder({
          maybeSingle: { data: null, error: { code: "PGRST205" } },
        }),
      );

      const res = await redeemPromoCode("ANY", "user-1");
      expect(res).toEqual({ ok: false, reason: "codes_unavailable" });
    });
  });
});
