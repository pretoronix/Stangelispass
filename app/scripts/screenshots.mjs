#!/usr/bin/env node
/**
 * Captures the App Store screenshot set from booted iOS simulators.
 *
 * Usage:
 *   1. one shell:  cd app && npx expo start --ios
 *   2. boot the simulator(s) you want and open the app on each
 *   3. other shell: cd app && npm run screenshots
 *
 * The script walks the SCENES list per device, waits for you to navigate the
 * app to each scene, then writes docs/deployment/screenshots/<size>/<scene>.png
 * and verifies the pixel dimensions Apple expects.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

// Apple asks for one set per size class. `names` lists the simulator models
// that produce the required resolution — the first booted match wins, so the
// script keeps working as Xcode ships new devices and retires old runtimes.
const DEVICES = [
  {
    label: "6.9",
    expect: "1320x2868",
    names: ["iPhone 17 Pro Max", "iPhone 16 Pro Max"],
  },
  {
    label: "6.5",
    expect: "1242x2688",
    names: ["iPhone 11 Pro Max", "iPhone XS Max"],
  },
];

const SCENES = [
  "01-leaderboard",
  "02-add-beer",
  "03-who-pays",
  "04-wall-of-fame",
  "05-comments",
];

const bootedDevices = () => {
  const json = JSON.parse(
    execFileSync("xcrun", ["simctl", "list", "devices", "-j"], {
      encoding: "utf8",
    }),
  );
  return Object.values(json.devices)
    .flat()
    .filter((d) => d.state === "Booted");
};

const udidFor = (names, booted) => {
  for (const name of names) {
    const match = booted.find((d) => d.name === name);
    if (match) return { udid: match.udid, name };
  }
  return null;
};

const outDir = (label) =>
  path.resolve(
    path.dirname(process.argv[1]),
    "../../docs/deployment/screenshots",
    label,
  );

const dimensionsOf = (file) => {
  const out = execFileSync(
    "sips",
    ["-g", "pixelWidth", "-g", "pixelHeight", file],
    { encoding: "utf8" },
  );
  const width = out.match(/pixelWidth:\s*(\d+)/)?.[1];
  const height = out.match(/pixelHeight:\s*(\d+)/)?.[1];
  return `${width}x${height}`;
};

const booted = bootedDevices();
if (booted.length === 0) {
  console.error(
    "No booted simulator found. Boot one and open the app, then re-run.",
  );
  process.exit(1);
}

const mismatches = [];
let captured = 0;

for (const device of DEVICES) {
  const found = udidFor(device.names, booted);
  if (!found) {
    console.warn(
      `\n! ${device.label}" — none of [${device.names.join(", ")}] is booted; skipping.\n` +
        `  Install the runtime via Xcode > Settings > Components if App Store Connect asks for this size.`,
    );
    continue;
  }

  mkdirSync(outDir(device.label), { recursive: true });
  console.log(`\n=== ${device.label}" via ${found.name} ===`);

  for (const scene of SCENES) {
    const file = path.join(outDir(device.label), `${scene}.png`);
    console.log(`\n▸ ${device.label} — navigate the app to: ${scene}`);
    console.log("  press Enter when the screen is ready…");
    execFileSync("/bin/sh", ["-c", "read _"], { stdio: "inherit" });
    execFileSync("xcrun", ["simctl", "io", found.udid, "screenshot", file]);

    const actual = dimensionsOf(file);
    if (actual === device.expect) {
      console.log(`  saved ${file} (${actual})`);
    } else {
      console.error(
        `  saved ${file} but it is ${actual}, expected ${device.expect}`,
      );
      mismatches.push({ file, actual, expect: device.expect });
    }
    captured += 1;
  }
}

if (captured === 0) {
  console.error("\nNothing captured — no matching simulator was booted.");
  process.exit(1);
}

if (mismatches.length > 0) {
  console.error(
    `\n${mismatches.length} screenshot(s) have the wrong dimensions. ` +
      "App Store Connect rejects these at upload — recapture on a matching device.",
  );
  process.exit(1);
}

console.log(`\n✓ ${captured} screenshot(s) captured at the expected sizes.`);
