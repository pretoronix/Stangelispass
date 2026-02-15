import { NotificationTemplates } from "../notificationTemplates";

describe("NotificationTemplates", () => {
  it("leaderChange includes type and optional eventId", () => {
    const t = NotificationTemplates.leaderChange("Alice", "evt_1");
    expect(t.title).toContain("Leader");
    expect(t.body).toContain("Alice");
    expect(t.sound).toBe("default");
    expect(t.priority).toBe("high");
    expect(t.data).toEqual({ type: "leader_change", eventId: "evt_1" });
  });

  it("roundExpiring pluralizes hours", () => {
    const t1 = NotificationTemplates.roundExpiring("My Event", 1, "evt_2");
    expect(t1.body).toContain("1 hour!");

    const t2 = NotificationTemplates.roundExpiring("My Event", 2, "evt_2");
    expect(t2.body).toContain("2 hours!");
    expect(t2.data).toEqual({
      type: "round_expiring",
      eventId: "evt_2",
      hoursLeft: 2,
    });
  });

  it("adminBroadcast includes sender and eventId", () => {
    const t = NotificationTemplates.adminBroadcast("Hello", "Bob", "evt_3");
    expect(t.title).toBe("📢 Bob");
    expect(t.body).toBe("Hello");
    expect(t.priority).toBe("high");
    expect(t.data).toEqual({
      type: "admin_broadcast",
      eventId: "evt_3",
      sender: "Bob",
    });
  });
});
