import { processNotificationsBatch } from "@/services/notificationProcessor";

describe("processNotificationsBatch", () => {
  test("no notifications -> processed 0", async () => {
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (url.includes("/rest/v1/notifications")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => [],
          text: async (): Promise<string> => "[]",
        };
      }
      return {
        ok: false,
        status: 404,
        json: async (): Promise<any> => null,
        text: async (): Promise<string> => "not found",
      };
    });

    const res = await processNotificationsBatch({
      fetchFn,
      supabaseUrl: "https://supabase.test",
      serviceKey: "key",
    });
    expect(res.processed).toBe(0);
    expect(res.results).toEqual([]);
  });

  test("tokens fetch failure -> attempts incremented", async () => {
    const notif = [{ id: "n1", new_leader: "u1", event_id: "e1", attempts: 0 }];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (url.includes("/rest/v1/notifications")) {
        // First call: fetch notifications
        if (url.includes("processed=eq.false"))
          return {
            ok: true,
            status: 200,
            json: async (): Promise<any> => notif,
            text: async (): Promise<string> => JSON.stringify(notif),
          };
        // PATCH calls should be accepted
        if (init?.method === "PATCH")
          return {
            ok: true,
            status: 200,
            json: async (): Promise<any> => ({}),
            text: async (): Promise<string> => "{}",
          };
      }
      if (url.includes("/rest/v1/device_tokens")) {
        return {
          ok: false,
          status: 500,
          json: async (): Promise<any> => null,
          text: async (): Promise<string> => "db error",
        };
      }
      return {
        ok: false,
        status: 404,
        json: async (): Promise<any> => null,
        text: async (): Promise<string> => "not found",
      };
    });

    const res = await processNotificationsBatch({
      fetchFn,
      supabaseUrl: "https://supabase.test",
      serviceKey: "key",
    });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(false);
    expect(res.results[0].reason).toBe("failed to fetch tokens");

    // Ensure a PATCH to notifications was called (third call)
    const patchCall = calls.find(
      (c) =>
        c.init &&
        c.init.method === "PATCH" &&
        c.url.includes("/rest/v1/notifications?id=eq.n1"),
    );
    expect(patchCall).toBeTruthy();
  });

  test("no tokens -> mark processed", async () => {
    const notif = [{ id: "n2", new_leader: "u2", event_id: "e2", attempts: 0 }];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (
        url.includes("/rest/v1/notifications") &&
        url.includes("processed=eq.false")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => notif,
          text: async (): Promise<string> => JSON.stringify(notif),
        };
      }
      if (url.includes("/rest/v1/device_tokens")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => [],
          text: async (): Promise<string> => "[]",
        };
      }
      if (
        init?.method === "PATCH" &&
        url.includes("/rest/v1/notifications?id=eq.n2")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({ processed: true }),
          text: async (): Promise<string> => "{}",
        };
      }
      return {
        ok: false,
        status: 404,
        json: async (): Promise<any> => null,
        text: async (): Promise<string> => "not found",
      };
    });

    const res = await processNotificationsBatch({
      fetchFn,
      supabaseUrl: "https://supabase.test",
      serviceKey: "key",
    });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(true);
    expect(res.results[0].reason).toBe("no tokens");

    const patchCall = calls.find(
      (c) =>
        c.init &&
        c.init.method === "PATCH" &&
        c.url.includes("/rest/v1/notifications?id=eq.n2"),
    );
    expect(patchCall).toBeTruthy();
  });

  test("milestone disabled by user preference -> skip send and mark processed", async () => {
    const notif = [
      {
        id: "n4",
        event_id: "e4",
        target_user: null,
        payload: { type: "milestone", milestone: 10, user_id: "u4" },
        attempts: 0,
      },
    ];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (
        url.includes("/rest/v1/notifications") &&
        url.includes("processed=eq.false")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => notif,
          text: async (): Promise<string> => JSON.stringify(notif),
        };
      }
      if (url.includes("/rest/v1/users?id=eq.u4")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => [
            { notification_prefs: { leader_change: true, milestones: [5] } },
          ],
          text: async (): Promise<string> => "[]",
        };
      }
      if (
        init?.method === "PATCH" &&
        url.includes("/rest/v1/notifications?id=eq.n4")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({ processed: true }),
          text: async (): Promise<string> => "{}",
        };
      }
      return {
        ok: false,
        status: 404,
        json: async (): Promise<any> => null,
        text: async (): Promise<string> => "not found",
      };
    });

    const res = await processNotificationsBatch({
      fetchFn,
      supabaseUrl: "https://supabase.test",
      serviceKey: "key",
    });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(true);
    expect(res.results[0].reason).toBe("disabled by preference");
    expect(calls.some((c) => c.url.includes("/rest/v1/device_tokens"))).toBe(
      false,
    );
  });

  test("unknown notification type -> treated as leader_change", async () => {
    const notif = [
      {
        id: "n8",
        event_id: "e8",
        target_user: "u8",
        payload: { type: "weird" },
        attempts: 0,
      },
    ];
    const tokens = [{ token: "t8" }];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (
        url.includes("/rest/v1/notifications") &&
        url.includes("processed=eq.false")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => notif,
          text: async (): Promise<string> => JSON.stringify(notif),
        };
      }
      if (url.includes("/rest/v1/users?id=eq.u8")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => [
            {
              notification_prefs: {
                leader_change: true,
                milestones: [5],
                admin_broadcasts: true,
                new_round: true,
              },
            },
          ],
          text: async (): Promise<string> => "[]",
        };
      }
      if (url.includes("/rest/v1/device_tokens")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => tokens,
          text: async (): Promise<string> => JSON.stringify(tokens),
        };
      }
      if (url.includes("exp.host")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({ data: "ok" }),
          text: async (): Promise<string> => "{}",
        };
      }
      if (
        init?.method === "PATCH" &&
        url.includes("/rest/v1/notifications?id=eq.n8")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({ processed: true }),
          text: async (): Promise<string> => "{}",
        };
      }
      return {
        ok: false,
        status: 404,
        json: async (): Promise<any> => null,
        text: async (): Promise<string> => "not found",
      };
    });

    const res = await processNotificationsBatch({
      fetchFn,
      supabaseUrl: "https://supabase.test",
      serviceKey: "key",
    });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(true);
    expect(calls.some((c) => c.url.includes("exp.host"))).toBe(true);
  });

  test("admin_broadcast sends push using payload fields", async () => {
    const notif = [
      {
        id: "n9",
        event_id: "e9",
        target_user: "u9",
        payload: {
          type: "admin_broadcast",
          title: "Admin",
          body: "Hello",
          data: { foo: "bar" },
          sound: "default",
          priority: "high",
        },
        attempts: 0,
      },
    ];
    const tokens = [{ token: "t9" }];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (
        url.includes("/rest/v1/notifications") &&
        url.includes("processed=eq.false")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => notif,
          text: async (): Promise<string> => JSON.stringify(notif),
        };
      }
      if (url.includes("/rest/v1/users?id=eq.u9")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => [
            {
              notification_prefs: {
                leader_change: true,
                milestones: [5],
                admin_broadcasts: true,
                new_round: true,
              },
            },
          ],
          text: async (): Promise<string> => "[]",
        };
      }
      if (url.includes("/rest/v1/device_tokens")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => tokens,
          text: async (): Promise<string> => JSON.stringify(tokens),
        };
      }
      if (url.includes("exp.host")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({ data: "ok" }),
          text: async (): Promise<string> => "{}",
        };
      }
      if (
        init?.method === "PATCH" &&
        url.includes("/rest/v1/notifications?id=eq.n9")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({ processed: true }),
          text: async (): Promise<string> => "{}",
        };
      }
      return {
        ok: false,
        status: 404,
        json: async (): Promise<any> => null,
        text: async (): Promise<string> => "not found",
      };
    });

    const res = await processNotificationsBatch({
      fetchFn,
      supabaseUrl: "https://supabase.test",
      serviceKey: "key",
    });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(true);
    const pushCall = calls.find((c) => c.url.includes("exp.host"));
    expect(pushCall.init.body).toContain('"title":"Admin"');
    expect(pushCall.init.body).toContain('"type":"admin_broadcast"');
  });

  test("milestone enabled -> sends push", async () => {
    const notif = [
      {
        id: "n10",
        event_id: "e10",
        target_user: "u10",
        payload: { type: "milestone", milestone: 10, user_id: "u10" },
        attempts: 0,
      },
    ];
    const tokens = [{ token: "t10" }];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (
        url.includes("/rest/v1/notifications") &&
        url.includes("processed=eq.false")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => notif,
          text: async (): Promise<string> => JSON.stringify(notif),
        };
      }
      if (url.includes("/rest/v1/users?id=eq.u10")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => [
            {
              notification_prefs: {
                leader_change: true,
                milestones: [10],
                admin_broadcasts: true,
                new_round: true,
              },
            },
          ],
          text: async (): Promise<string> => "[]",
        };
      }
      if (url.includes("/rest/v1/device_tokens")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => tokens,
          text: async (): Promise<string> => JSON.stringify(tokens),
        };
      }
      if (url.includes("exp.host")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({ data: "ok" }),
          text: async (): Promise<string> => "{}",
        };
      }
      if (
        init?.method === "PATCH" &&
        url.includes("/rest/v1/notifications?id=eq.n10")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({ processed: true }),
          text: async (): Promise<string> => "{}",
        };
      }
      return {
        ok: false,
        status: 404,
        json: async (): Promise<any> => null,
        text: async (): Promise<string> => "not found",
      };
    });

    const res = await processNotificationsBatch({
      fetchFn,
      supabaseUrl: "https://supabase.test",
      serviceKey: "key",
    });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(true);
    expect(calls.some((c) => c.url.includes("exp.host"))).toBe(true);
  });

  test("missing recipient -> mark processed and skip send", async () => {
    const notif = [
      {
        id: "n6",
        event_id: "e6",
        payload: { type: "admin_broadcast", title: "Hi", body: "Yo" },
        attempts: 0,
      },
    ];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (
        url.includes("/rest/v1/notifications") &&
        url.includes("processed=eq.false")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => notif,
          text: async (): Promise<string> => JSON.stringify(notif),
        };
      }
      if (
        init?.method === "PATCH" &&
        url.includes("/rest/v1/notifications?id=eq.n6")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({ processed: true }),
          text: async (): Promise<string> => "{}",
        };
      }
      return {
        ok: false,
        status: 404,
        json: async (): Promise<any> => null,
        text: async (): Promise<string> => "not found",
      };
    });

    const res = await processNotificationsBatch({
      fetchFn,
      supabaseUrl: "https://supabase.test",
      serviceKey: "key",
    });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(false);
    expect(res.results[0].reason).toBe("missing recipient");
    expect(calls.some((c) => c.url.includes("/rest/v1/device_tokens"))).toBe(
      false,
    );
  });

  test("markProcessed failures are tolerated", async () => {
    const notif = [
      {
        id: "n11",
        event_id: "e11",
        payload: { type: "admin_broadcast", title: "Hi", body: "Yo" },
        attempts: 0,
      },
    ];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (
        url.includes("/rest/v1/notifications") &&
        url.includes("processed=eq.false")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => notif,
          text: async (): Promise<string> => JSON.stringify(notif),
        };
      }
      if (
        init?.method === "PATCH" &&
        url.includes("/rest/v1/notifications?id=eq.n11")
      ) {
        throw new Error("patch failed");
      }
      return {
        ok: false,
        status: 404,
        json: async (): Promise<any> => null,
        text: async (): Promise<string> => "not found",
      };
    });

    const res = await processNotificationsBatch({
      fetchFn,
      supabaseUrl: "https://supabase.test",
      serviceKey: "key",
    });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(false);
    expect(res.results[0].reason).toBe("missing recipient");
  });

  test("prefs fetch failure -> uses defaults and can still mark processed", async () => {
    const notif = [{ id: "n7", new_leader: "u7", event_id: "e7", attempts: 0 }];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (
        url.includes("/rest/v1/notifications") &&
        url.includes("processed=eq.false")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => notif,
          text: async (): Promise<string> => JSON.stringify(notif),
        };
      }
      if (url.includes("/rest/v1/users?id=eq.u7")) {
        return {
          ok: false,
          status: 404,
          json: async (): Promise<any> => null,
          text: async (): Promise<string> => "not found",
        };
      }
      if (url.includes("/rest/v1/device_tokens")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => [],
          text: async (): Promise<string> => "[]",
        };
      }
      if (
        init?.method === "PATCH" &&
        url.includes("/rest/v1/notifications?id=eq.n7")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({ processed: true }),
          text: async (): Promise<string> => "{}",
        };
      }
      return {
        ok: false,
        status: 404,
        json: async (): Promise<any> => null,
        text: async (): Promise<string> => "not found",
      };
    });

    const res = await processNotificationsBatch({
      fetchFn,
      supabaseUrl: "https://supabase.test",
      serviceKey: "key",
    });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(true);
    expect(res.results[0].reason).toBe("no tokens");
  });

  test("new_round disabled by new_round pref -> skip send and mark processed", async () => {
    const notif = [
      {
        id: "n5",
        event_id: "e5",
        target_user: "u5",
        payload: { type: "new_round", event_name: "Friday Night" },
        attempts: 0,
      },
    ];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (
        url.includes("/rest/v1/notifications") &&
        url.includes("processed=eq.false")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => notif,
          text: async (): Promise<string> => JSON.stringify(notif),
        };
      }
      if (url.includes("/rest/v1/users?id=eq.u5")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => [
            {
              notification_prefs: {
                leader_change: true,
                milestones: [5],
                admin_broadcasts: true,
                new_round: false,
              },
            },
          ],
          text: async (): Promise<string> => "[]",
        };
      }
      if (
        init?.method === "PATCH" &&
        url.includes("/rest/v1/notifications?id=eq.n5")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({ processed: true }),
          text: async (): Promise<string> => "{}",
        };
      }
      return {
        ok: false,
        status: 404,
        json: async (): Promise<any> => null,
        text: async (): Promise<string> => "not found",
      };
    });

    const res = await processNotificationsBatch({
      fetchFn,
      supabaseUrl: "https://supabase.test",
      serviceKey: "key",
    });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(true);
    expect(res.results[0].reason).toBe("disabled by preference");
    expect(calls.some((c) => c.url.includes("/rest/v1/device_tokens"))).toBe(
      false,
    );
  });

  test("sends pushes and marks processed", async () => {
    const notif = [{ id: "n3", new_leader: "u3", event_id: "e3", attempts: 0 }];
    const tokens = [{ token: "t1" }, { token: "t2" }];
    const calls: any[] = [];
    const fetchFn = jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (
        url.includes("/rest/v1/notifications") &&
        url.includes("processed=eq.false")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => notif,
          text: async (): Promise<string> => JSON.stringify(notif),
        };
      }
      if (url.includes("/rest/v1/device_tokens")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => tokens,
          text: async (): Promise<string> => JSON.stringify(tokens),
        };
      }
      if (url.includes("exp.host")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({ data: "ok" }),
          text: async (): Promise<string> => "{}",
        };
      }
      if (
        init?.method === "PATCH" &&
        url.includes("/rest/v1/notifications?id=eq.n3")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({ processed: true }),
          text: async (): Promise<string> => "{}",
        };
      }
      return {
        ok: false,
        status: 404,
        json: async (): Promise<any> => null,
        text: async (): Promise<string> => "not found",
      };
    });

    const res = await processNotificationsBatch({
      fetchFn,
      supabaseUrl: "https://supabase.test",
      serviceKey: "key",
    });
    expect(res.processed).toBe(1);
    expect(res.results[0].success).toBe(true);
    expect(Array.isArray(res.results[0].sendResults)).toBe(true);
    // ensure two pushes were sent
    const pushCalls = calls.filter((c) => c.url.includes("exp.host"));
    expect(pushCalls.length).toBe(2);

    const patchCall = calls.find(
      (c) =>
        c.init &&
        c.init.method === "PATCH" &&
        c.url.includes("/rest/v1/notifications?id=eq.n3"),
    );
    expect(patchCall).toBeTruthy();
  });

  // Helper that fails the Expo push send for a given notification, so we can
  // exercise the retry / give-up branches.
  const makeSendFailureFetch = (notif: any[], calls: any[]) =>
    jest.fn(async (url: string, init?: any) => {
      calls.push({ url, init });
      if (
        url.includes("/rest/v1/notifications") &&
        url.includes("processed=eq.false")
      ) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => notif,
          text: async (): Promise<string> => JSON.stringify(notif),
        };
      }
      if (url.includes("/rest/v1/device_tokens")) {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => [{ token: "tok" }],
          text: async (): Promise<string> => "[]",
        };
      }
      if (url.includes("exp.host")) {
        // Expo reports a per-message error -> counts as a failed send.
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({ error: "DeviceNotRegistered" }),
          text: async (): Promise<string> => "{}",
        };
      }
      if (init?.method === "PATCH") {
        return {
          ok: true,
          status: 200,
          json: async (): Promise<any> => ({}),
          text: async (): Promise<string> => "{}",
        };
      }
      return {
        ok: false,
        status: 404,
        json: async (): Promise<any> => null,
        text: async (): Promise<string> => "not found",
      };
    });

  test("transient send failure -> bumps attempts and leaves processed=false for retry", async () => {
    const notif = [
      { id: "n12", new_leader: "u12", event_id: "e12", attempts: 0 },
    ];
    const calls: any[] = [];
    const fetchFn = makeSendFailureFetch(notif, calls);

    const res = await processNotificationsBatch({
      fetchFn,
      supabaseUrl: "https://supabase.test",
      serviceKey: "key",
    });

    expect(res.results[0].success).toBe(false);
    expect(res.results[0].reason).toBe("send failures (will retry)");

    const patchCall = calls.find(
      (c) =>
        c.init?.method === "PATCH" &&
        c.url.includes("/rest/v1/notifications?id=eq.n12"),
    );
    expect(patchCall).toBeTruthy();
    const body = JSON.parse(patchCall.init.body);
    // Attempts bumped, but NOT marked processed -> next run will retry.
    expect(body.attempts).toBe(1);
    expect(body.processed).toBeUndefined();
  });

  test("send failure after exhausting retries -> marks processed and gives up", async () => {
    const notif = [
      { id: "n13", new_leader: "u13", event_id: "e13", attempts: 2 },
    ];
    const calls: any[] = [];
    const fetchFn = makeSendFailureFetch(notif, calls);

    const res = await processNotificationsBatch({
      fetchFn,
      supabaseUrl: "https://supabase.test",
      serviceKey: "key",
    });

    expect(res.results[0].success).toBe(false);
    expect(res.results[0].reason).toBe("send failures (retries exhausted)");

    const patchCall = calls.find(
      (c) =>
        c.init?.method === "PATCH" &&
        c.url.includes("/rest/v1/notifications?id=eq.n13"),
    );
    expect(patchCall).toBeTruthy();
    const body = JSON.parse(patchCall.init.body);
    // Retry budget exhausted (attempts 2 -> 3 == MAX) -> mark processed.
    expect(body.processed).toBe(true);
  });
});
