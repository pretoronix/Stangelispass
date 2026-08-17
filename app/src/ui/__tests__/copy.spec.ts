import { copy } from "@/ui/copy";

const flatten = (value: unknown, path = ""): [string, string][] => {
  if (typeof value === "string") return [[path, value]];
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      flatten(v, path ? `${path}.${k}` : k),
    );
  }
  return [];
};

describe("copy", () => {
  it("uses Swiss orthography (no eszett)", () => {
    const offenders = flatten(copy).filter(([, text]) => text.includes("ß"));
    expect(offenders).toEqual([]);
  });

  it("has no empty strings", () => {
    const offenders = flatten(copy).filter(([, text]) => text.trim() === "");
    expect(offenders).toEqual([]);
  });

  it("exposes the settings section titles in German", () => {
    expect(copy.settings.title).toBe("Einstellungen");
    expect(copy.settings.switchMember).toBe("Mitglied wechseln");
    expect(copy.settings.cacheSection).toBe("Cache & Speicher");
    expect(copy.settings.clearCache).toBe("Cache leeren");
    expect(copy.settings.removeMember).toBe("Entfernen");
  });

  it("covers every screen group", () => {
    // The plan's six screen groups plus `common`, which holds the copy of
    // components that no single screen owns (error boundaries, QR scanner,
    // comments, share cards).
    expect(Object.keys(copy).sort()).toEqual(
      [
        "add",
        "common",
        "history",
        "home",
        "leaderboard",
        "legends",
        "profile",
        "settings",
      ].sort(),
    );
  });

  it("labels the core home actions in German", () => {
    expect(copy.home.startRound).toBe("Runde starten");
    expect(copy.home.whoPays).toBe("Wer zahlt?");
    expect(copy.home.endRound).toBe("Runde beenden");
  });

  it("keeps the legally required age and responsibility notice", () => {
    expect(copy.settings.responsibilityNotice).toContain("17 Jahren");
    expect(copy.settings.responsibilityNotice).toContain("verantwortungsvoll");
  });
});
