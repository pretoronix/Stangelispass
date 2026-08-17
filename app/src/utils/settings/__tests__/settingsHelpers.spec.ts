import { formatAppVersion } from "@/utils/settings/settingsHelpers";

describe("formatAppVersion", () => {
  it("prefixes a semver string with v", () => {
    expect(formatAppVersion("1.0.0")).toBe("v1.0.0");
  });

  it("falls back to v1.0.0 when the config has no version", () => {
    expect(formatAppVersion(undefined)).toBe("v1.0.0");
    expect(formatAppVersion(null)).toBe("v1.0.0");
    expect(formatAppVersion("")).toBe("v1.0.0");
  });

  it("does not double-prefix an already prefixed version", () => {
    expect(formatAppVersion("v1.2.3")).toBe("v1.2.3");
  });
});
