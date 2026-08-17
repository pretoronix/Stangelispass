import {
  checkPlaceholders,
  checkAppConfig,
} from "../../scripts/release-guard.mjs";

describe("checkPlaceholders", () => {
  it("finds unresolved launch placeholders", () => {
    const findings = checkPlaceholders([
      { path: "docs/x.md", content: "Support: https://<DOMAIN>/support" },
      { path: "docs/y.md", content: "E-Mail: [E-Mail einfügen]" },
    ]);
    expect(findings).toEqual([
      { path: "docs/x.md", placeholder: "<DOMAIN>" },
      { path: "docs/y.md", placeholder: "[E-Mail einfügen]" },
    ]);
  });

  it("passes clean content", () => {
    expect(
      checkPlaceholders([
        {
          path: "docs/x.md",
          content: "Support: https://stangelispass.app/support",
        },
      ]),
    ).toEqual([]);
  });
});

describe("checkAppConfig", () => {
  const compliant = {
    expo: {
      version: "1.0.0",
      extra: { eas: { projectId: "abc" } },
      ios: {
        supportsTablet: false,
        bundleIdentifier: "com.stangelispass.app",
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false,
          NSPhotoLibraryAddUsageDescription: "Save your share card.",
        },
      },
    },
  };

  it("accepts a compliant config", () => {
    expect(checkAppConfig(compliant)).toEqual([]);
  });

  it("rejects tablet support", () => {
    const cfg = structuredClone(compliant);
    cfg.expo.ios.supportsTablet = true;
    expect(checkAppConfig(cfg)).toContain("ios.supportsTablet must be false");
  });

  it("rejects a tracking usage description", () => {
    const cfg = structuredClone(compliant) as any;
    cfg.expo.ios.infoPlist.NSUserTrackingUsageDescription = "why";
    expect(checkAppConfig(cfg)).toContain(
      "NSUserTrackingUsageDescription must be absent (no ATT, no tracking)",
    );
  });

  it("requires the export compliance flag", () => {
    const cfg = structuredClone(compliant) as any;
    delete cfg.expo.ios.infoPlist.ITSAppUsesNonExemptEncryption;
    expect(checkAppConfig(cfg)).toContain(
      "ITSAppUsesNonExemptEncryption must be set to false",
    );
  });
});
