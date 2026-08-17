#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";

export const PLACEHOLDERS = [
  "<DOMAIN>",
  "[Support-E-Mail einfügen]",
  "[E-Mail einfügen]",
  "[Name/Firma des Betreibers einfügen]",
  "[Optional einfügen]",
];

// Paths are relative to app/scripts/, so repo-root files need two levels up.
export const GUARDED_FILES = [
  "../../docs/deployment/store-listing-copy.md",
  "../../docs/legal/imprint.md",
  "../../web/legal/public/support.html",
  "../../web/legal/public/imprint.html",
];

export const checkPlaceholders = (files) =>
  files.flatMap(({ path: p, content }) =>
    PLACEHOLDERS.filter((needle) => content.includes(needle)).map(
      (placeholder) => ({ path: p, placeholder }),
    ),
  );

export const checkAppConfig = (appJson) => {
  const expo = appJson?.expo ?? {};
  const ios = expo.ios ?? {};
  const info = ios.infoPlist ?? {};
  const problems = [];

  if (expo.version !== "1.0.0")
    problems.push(`expo.version must be 1.0.0 (got ${expo.version})`);
  if (ios.bundleIdentifier !== "com.stangelispass.app")
    problems.push("ios.bundleIdentifier must be com.stangelispass.app");
  if (ios.supportsTablet !== false)
    problems.push("ios.supportsTablet must be false");
  if ("NSUserTrackingUsageDescription" in info)
    problems.push(
      "NSUserTrackingUsageDescription must be absent (no ATT, no tracking)",
    );
  if (info.ITSAppUsesNonExemptEncryption !== false)
    problems.push("ITSAppUsesNonExemptEncryption must be set to false");
  if (!info.NSPhotoLibraryAddUsageDescription)
    problems.push(
      "NSPhotoLibraryAddUsageDescription is required (share card save)",
    );
  if (!expo.extra?.eas?.projectId)
    problems.push("extra.eas.projectId missing — run `eas init` in app/");

  return problems;
};

// Resolved from argv rather than `import.meta.url`: the app's Babel preset
// (babel-preset-expo / Hermes) cannot parse `import.meta`, and the pure checks
// below are unit-tested through Jest, which runs them through that preset.
const scriptDir = () =>
  process.argv[1] ? path.dirname(path.resolve(process.argv[1])) : process.cwd();

const main = async () => {
  const here = scriptDir();
  const files = await Promise.all(
    GUARDED_FILES.map(async (rel) => ({
      path: rel.replace(/^(\.\.\/)+/, ""),
      content: await readFile(path.join(here, rel), "utf8").catch(() => ""),
    })),
  );

  const placeholderFindings = checkPlaceholders(files);
  const appJson = JSON.parse(
    await readFile(path.join(here, "../app.json"), "utf8"),
  );
  const configFindings = checkAppConfig(appJson);

  for (const { path: p, placeholder } of placeholderFindings)
    console.error(`✗ ${p}: unresolved placeholder ${placeholder}`);
  for (const problem of configFindings) console.error(`✗ app.json: ${problem}`);

  if (placeholderFindings.length || configFindings.length) {
    console.error(
      `\n${placeholderFindings.length + configFindings.length} release blocker(s). Not ready to submit.`,
    );
    process.exit(1);
  }
  console.log("✓ release guard: no blockers");
};

if (process.argv[1] && path.basename(process.argv[1]) === "release-guard.mjs") {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
