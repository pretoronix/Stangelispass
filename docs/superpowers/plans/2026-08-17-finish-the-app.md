# Finish Stängelispass 1.0.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Stängelispass from "launch-prepared repo" to "version 1.0.0 live in the App Store", by closing the four remaining code-side gaps, making the release state machine-verifiable, and then walking the manual Apple/Vercel steps in a fixed order.

**Architecture:** No new subsystems. Three of the four code tasks are additive and local: a copy module (`src/ui/copy.ts`) that centralises German user-facing strings, a pure version-format helper in the existing `settingsHelpers`, and a Node release-guard script under `app/scripts/` that fails the build while launch placeholders remain. The fourth is a simulator screenshot script. Everything else in this plan is sequencing of manual account work that no agent can perform.

**Tech Stack:** Expo SDK / React Native, expo-router, TypeScript, Jest + @testing-library/react-native v14, Supabase (Postgres + Edge Functions), EAS Build/Submit, Vercel (static legal pages).

**Spec:** `docs/superpowers/plans/2026-08-16-ios-app-store-launch-v2.md` (decisions + workstreams A–F, all implemented) and `docs/deployment/compliance-audit.md` (audit result, open items). Store metadata source of truth: `docs/deployment/store-listing-copy.md`.

## Scope

**In scope — this plan ships v1.0.0:** the German UI-copy gap, version single-sourcing, a release guard, screenshots, plus the ordered manual path (Apple prereqs → Vercel → EAS → TestFlight → submit → release).

**Out of scope — deliberately deferred, needs its own plan:** event passes / in-app purchases (cut for 1.0, `IAP_ENABLED = false` — a v1.1 plan re-enables the flag, re-adds `expo-in-app-purchases`, and adds ASC products), and the viral/roadmap backlog in `docs/planning/strategy/feature_roadmap.md` (Wall-of-Fame filters, streaks, deep links, Siri, AR). Do not pull these into 1.0.

## Global Constraints

- Version is `1.0.0`; `app/eas.json` uses `appVersionSource: "remote"` and `autoIncrement: true` on the production profile — **never hand-edit `buildNumber`**.
- Bundle ID `com.stangelispass.app`. Age rating 17+. Primary language **German (DE)**, primary market DACH.
- `app/app.json` must keep `ios.supportsTablet: false` and `ITSAppUsesNonExemptEncryption: false`, and must **not** contain `NSUserTrackingUsageDescription`.
- `IAP_ENABLED` in `app/src/services/iap.ts` stays `false` for 1.0. No visible purchase UI.
- Swiss German orthography in user-facing copy: **ss instead of ß** ("geniesse", "ausschliesslich"), matching `web/legal/` and `docs/legal/`.
- Every task ends green on: `cd app && npx tsc --noEmit && npm run lint && npm test`. Baseline today: 0 TS errors, 0 lint errors (6 pre-existing `react-hooks/exhaustive-deps` warnings — do not "fix" them in this plan), 85 suites / 539 tests passing, 2 suites skipped (env-gated `db_health`).
- The worktree needs `node_modules`; if absent, symlink the main checkout's: `ln -sfn ../../../app/node_modules app/node_modules`.

## File Structure

| File | Responsibility | Task |
| --- | --- | --- |
| `app/src/ui/copy.ts` | **new** — all user-facing German strings, grouped per screen. Sibling of `labels.ts` (which stays testIDs/a11y only). | 2, 3 |
| `app/src/ui/__tests__/copy.spec.ts` | **new** — guards copy invariants (no ß, no leftover English keys). | 2 |
| `app/src/utils/settings/settingsHelpers.ts` | **modify** — add `formatAppVersion()`, pure and unit-testable. | 1 |
| `app/src/utils/settings/__tests__/settingsHelpers.spec.ts` | **modify/create** — test `formatAppVersion()`. | 1 |
| `app/src/screens/settings/SettingsSections.tsx` | **modify** — consume `formatAppVersion()` + `copy.settings`. | 1, 2 |
| `app/src/components/settings/*.tsx` | **modify** — consume `copy.settings`. | 2 |
| `app/src/app/index.tsx`, `add.tsx`, `profile.tsx`, `history.tsx`, `legends.tsx`, `leaderboard/[eventId].tsx` | **modify** — consume `copy.*`. | 3 |
| `app/scripts/release-guard.mjs` | **new** — fails on launch placeholders / config regressions. | 4 |
| `app/src/__tests__/releaseGuard.spec.ts` | **new** — tests the guard's pure checks. | 4 |
| `app/scripts/screenshots.mjs` | **new** — drives iOS simulators, writes `docs/deployment/screenshots/<size>/`. | 5 |
| `app/package.json` | **modify** — `release:guard`, `screenshots` scripts. | 4, 5 |
| `docs/deployment/store-listing-copy.md` | **modify** — replace `<DOMAIN>` after Vercel deploy. | 7 |
| `docs/legal/imprint.md`, `web/legal/public/support.html` | **modify** — real operator + support e-mail. | 6 |
| `docs/deployment/release-runbook.md` | **new** — the ordered manual path, one checkbox per action. | 9 |

---

## Task 1: Single-source the app version in the settings footer

The footer string was hand-maintained and drifted (`v1.5.0` while `app.json` said `1.0.0`). It is now hardcoded to `v1.0.0`, which will drift again at 1.0.1. Derive it from the Expo config, the way `cacheManager.ts` and `QueryProvider.tsx` already do.

**Files:**
- Modify: `app/src/utils/settings/settingsHelpers.ts`
- Modify: `app/src/screens/settings/SettingsSections.tsx` (footer, ~line 256)
- Test: `app/src/utils/settings/__tests__/settingsHelpers.spec.ts`

**Interfaces:**
- Consumes: `Constants.expoConfig?.version` from `expo-constants`.
- Produces: `formatAppVersion(version?: string | null): string` — returns `"v1.0.0"` for `"1.0.0"`, `"v1.0.0"` for `null`/`undefined`/`""` (fallback matches the `"1.0.0"` default already used in `cacheManager.ts`), and never double-prefixes (`"v1.2.3"` in → `"v1.2.3"` out).

- [ ] **Step 1: Write the failing test**

Append to `app/src/utils/settings/__tests__/settingsHelpers.spec.ts` (create the file with the import if it does not exist):

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd app && npx jest src/utils/settings/__tests__/settingsHelpers.spec.ts -t formatAppVersion`
Expected: FAIL — `formatAppVersion is not a function`.

- [ ] **Step 3: Write the minimal implementation**

Add to `app/src/utils/settings/settingsHelpers.ts`:

```ts
export const formatAppVersion = (version?: string | null): string => {
  const raw = (version || "").trim();
  if (!raw) return "v1.0.0";
  return raw.startsWith("v") ? raw : `v${raw}`;
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd app && npx jest src/utils/settings/__tests__/settingsHelpers.spec.ts -t formatAppVersion`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire it into the footer**

In `app/src/screens/settings/SettingsSections.tsx`, add the imports (`expo-constants` is already a dependency):

```tsx
import Constants from "expo-constants";
import { formatAppVersion } from "@/utils/settings/settingsHelpers";
```

Replace the hardcoded footer line:

```tsx
<Text style={styles.footerText}>
  Stängelispass {formatAppVersion(Constants.expoConfig?.version)}
</Text>
```

Leave the two lines below it (`footerSubtext`, `footerNotice`) untouched — the 17+/responsible-drinking notice is a compliance requirement from `docs/deployment/compliance-audit.md` §5.

- [ ] **Step 6: Run the full gate**

Run: `cd app && npx tsc --noEmit && npm run lint && npm test`
Expected: 0 TS errors, 0 lint errors, all suites pass. If a settings snapshot/assertion hardcoded `v1.0.0`, update it to read the same helper rather than a literal.

- [ ] **Step 7: Commit**

```bash
git add app/src/utils/settings/settingsHelpers.ts \
        app/src/utils/settings/__tests__/settingsHelpers.spec.ts \
        app/src/screens/settings/SettingsSections.tsx
git commit -m "refactor(settings): derive footer version from expo config"
```

---

## Task 2: German copy module + settings screen migration

The store listing, legal pages and Apple metadata are German (`docs/deployment/store-listing-copy.md`), and DE is the primary language a reviewer sees — but the UI ships English labels ("Settings", "Switch Member", "Clear Cache", "Remove", "Admin Tools"). `src/ui/labels.ts` holds only testIDs and accessibility labels, so visible copy is hardcoded per component. Introduce one copy module and migrate the settings surface first (largest concentration of English strings, and the screen holding the compliance notice).

**Rationale for a plain object over an i18n library:** one shipping locale, no plural/gender rules needed yet, zero new dependencies before review. A future multi-locale plan can swap the module's shape without touching call sites if every string is reached as `copy.<screen>.<key>`.

**Files:**
- Create: `app/src/ui/copy.ts`
- Create: `app/src/ui/__tests__/copy.spec.ts`
- Modify: `app/src/screens/settings/SettingsSections.tsx`
- Modify: `app/src/components/settings/CacheManagementSection.tsx`, `EventAdminSection.tsx`, `EventMemberRow.tsx`, `AddUserSection.tsx`, `PhysiologySection.tsx`, `SensorySection.tsx`, `LiveBeerLogSection.tsx`, `NotificationsSection.tsx`, `LifetimePassSection.tsx`, `PromoCodeSection.tsx`, `PremiumTierCard.tsx`

**Interfaces:**
- Produces: `copy` — a `const`-asserted nested object. Task 3 extends it with `copy.home`, `copy.add`, `copy.profile`, `copy.history`, `copy.legends`, `copy.leaderboard`. Access is always `copy.<screen>.<key>`; no dynamic key lookup, so TypeScript catches typos.
- Note for Task 3's implementer: the export is `export const copy = { ... } as const;` from `@/ui/copy`.

- [ ] **Step 1: Inventory the strings to migrate**

Run, and keep the output as your worklist:

```bash
cd app
grep -rn "Settings\|Switch Member\|Clear Cache\|Remove\|Add User\|Admin Tools\|Lifetime Pass\|Promo Codes\|Live Updates\|Cache & Storage\|Sensory Experience\|Event Administration\|Active Profiles\|Notifications" src/screens/settings src/components/settings
```

Every hit that renders inside a `<Text>`, or is passed as a `title`/`placeholder`/`label` prop, moves into `copy.settings`. Hits that are `testID`s, `accessibilityLabel`s, object keys, or type names stay as they are.

- [ ] **Step 2: Write the failing test**

Create `app/src/ui/__tests__/copy.spec.ts`:

```ts
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

  it("keeps the legally required age and responsibility notice", () => {
    expect(copy.settings.responsibilityNotice).toContain("17 Jahren");
    expect(copy.settings.responsibilityNotice).toContain("verantwortungsvoll");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd app && npx jest src/ui/__tests__/copy.spec.ts`
Expected: FAIL — cannot resolve module `@/ui/copy`.

- [ ] **Step 4: Create the copy module**

Create `app/src/ui/copy.ts`. Start from exactly this skeleton and extend it with every string your Step 1 inventory found:

```ts
/**
 * User-facing copy, German (DE) — the app's only shipping locale for 1.0.
 * Swiss orthography: ss, never ß. Keep in sync with web/legal and
 * docs/deployment/store-listing-copy.md.
 *
 * testIDs and accessibility labels live in ./labels.ts, not here.
 */
export const copy = {
  settings: {
    title: "Einstellungen",
    activeProfiles: "Aktive Profile",
    adminTools: "Admin-Werkzeuge",
    eventAdministration: "Event-Verwaltung",
    lifetimePass: "Lifetime-Pass",
    promoCodes: "Promo-Codes",
    sensorySection: "Sinneserlebnis",
    cacheSection: "Cache & Speicher",
    clearCache: "Cache leeren",
    liveUpdates: "Live-Updates",
    notifications: "Benachrichtigungen",
    switchMember: "Mitglied wechseln",
    addUser: "Profil hinzufügen",
    removeMember: "Entfernen",
    tagline: "Für Bierliebhaber gemacht 🍻",
    responsibilityNotice:
      "Nur für Personen ab 17 Jahren bzw. dem gesetzlichen Mindestalter für Alkoholkonsum. Bitte geniesse Alkohol verantwortungsvoll.",
  },
} as const;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd app && npx jest src/ui/__tests__/copy.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Migrate the settings components**

Replace each inventoried literal with its `copy.settings.*` counterpart, e.g. in `SettingsSections.tsx`:

```tsx
import { copy } from "@/ui/copy";
// ...
<Text style={styles.largeTitle}>{copy.settings.title}</Text>
<Text style={styles.sectionLabel}>{copy.settings.switchMember}</Text>
<Text style={styles.footerSubtext}>{copy.settings.tagline}</Text>
<Text style={styles.footerNotice}>{copy.settings.responsibilityNotice}</Text>
```

and in `CacheManagementSection.tsx`, the button `title="Clear Cache"` becomes `title={copy.settings.clearCache}`.

Do **not** change any `testID` or `accessibilityLabel` — the existing suites (`labels.spec.tsx`, `guiIntegrity.spec.tsx`) query by those, so a correct migration leaves them green.

- [ ] **Step 7: Run the full gate**

Run: `cd app && npx tsc --noEmit && npm run lint && npm test`
Expected: all green. Any test asserting a visible English string (`getByText("Settings")`) must be updated to assert `copy.settings.title` — import the module in the test rather than pasting the German literal, so the next copy edit cannot break it.

- [ ] **Step 8: Commit**

```bash
git add app/src/ui/copy.ts app/src/ui/__tests__/copy.spec.ts \
        app/src/screens/settings app/src/components/settings
git commit -m "feat(i18n): add German copy module and migrate settings screen"
```

---

## Task 3: Migrate the remaining screens to the copy module

**Files:**
- Modify: `app/src/ui/copy.ts` (add `home`, `add`, `profile`, `history`, `legends`, `leaderboard` groups)
- Modify: `app/src/app/index.tsx`, `app/src/app/add.tsx`, `app/src/app/profile.tsx`, `app/src/app/history.tsx`, `app/src/app/legends.tsx`, `app/src/app/leaderboard/[eventId].tsx`, and the components they render (`src/components/home`, `src/components/ui` where copy is hardcoded)
- Test: `app/src/ui/__tests__/copy.spec.ts` (extend), existing screen suites

**Interfaces:**
- Consumes: `copy` from `@/ui/copy` — `export const copy = { ... } as const` (Task 2).
- Produces: the same `copy` object, now covering every screen. After this task no user-facing English literal remains in `src/app`, `src/screens`, `src/components`.

- [ ] **Step 1: Inventory per screen**

```bash
cd app
grep -rn "Text" src/app/index.tsx | grep -iE "[A-Z][a-z]{3,}"
```

Repeat for each screen file listed above. Also check `Alert.alert(` calls — dialog titles and messages are user-facing:

```bash
grep -rn "Alert.alert" src | grep -v __tests__
```

- [ ] **Step 2: Write the failing test**

Extend `app/src/ui/__tests__/copy.spec.ts`:

```ts
it("covers every screen group", () => {
  expect(Object.keys(copy).sort()).toEqual(
    [
      "add",
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd app && npx jest src/ui/__tests__/copy.spec.ts`
Expected: FAIL — received `["settings"]`.

- [ ] **Step 4: Extend the copy module**

Add the groups, e.g.:

```ts
  home: {
    startRound: "Runde starten",
    whoPays: "Wer zahlt?",
    endRound: "Runde beenden",
    invite: "Freunde einladen",
    shareLeaderboard: "Rangliste teilen",
    scan: "QR-Code scannen",
  },
  add: {
    addBeer: "Bier eintragen",
    participantQr: "Teilnehmer-QR",
    shareQr: "QR teilen",
  },
  profile: { totalCost: "Gesamtkosten", beerCount: "Biere", pricePerBeer: "Preis pro Bier" },
  history: { title: "Verlauf", empty: "Noch keine Einträge." },
  legends: { title: "Wall of Fame", empty: "Noch keine Legenden." },
  leaderboard: { title: "Rangliste", empty: "Noch keine Biere eingetragen." },
```

Fill in every remaining key from your Step 1 inventory — the wording above is the house style: imperative verbs, no exclamation marks, du-form.

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd app && npx jest src/ui/__tests__/copy.spec.ts`
Expected: PASS.

- [ ] **Step 6: Migrate the screens, then run the full gate**

Run: `cd app && npx tsc --noEmit && npm run lint && npm test`
Expected: all green, with English-literal assertions in screen suites replaced by `copy.*` references.

- [ ] **Step 7: Commit**

```bash
git add app/src/ui app/src/app app/src/components
git commit -m "feat(i18n): migrate remaining screens to German copy module"
```

---

## Task 4: Release guard script

Four launch placeholders are still in the repo (`<DOMAIN>`, `[Support-E-Mail einfügen]`, `[E-Mail einfügen]`, `[Name/Firma des Betreibers einfügen]`), and three config invariants must not silently regress before submission. Make that machine-checkable so "ready to submit" is a command, not a memory exercise.

**Files:**
- Create: `app/scripts/release-guard.mjs`
- Create: `app/src/__tests__/releaseGuard.spec.ts`
- Modify: `app/package.json` (scripts)

**Interfaces:**
- Produces: `app/scripts/release-guard.mjs` exporting `checkPlaceholders(files)` and `checkAppConfig(appJson)`, both pure, plus a CLI entry that exits `1` on any finding.
  - `checkPlaceholders(files: {path: string, content: string}[]): {path: string, placeholder: string}[]`
  - `checkAppConfig(appJson: unknown): string[]` — array of human-readable violations, empty when compliant.
- Produces: `npm run release:guard` in `app/package.json`.

- [ ] **Step 1: Write the failing test**

Create `app/src/__tests__/releaseGuard.spec.ts`:

```ts
import { checkPlaceholders, checkAppConfig } from "../../scripts/release-guard.mjs";

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
        { path: "docs/x.md", content: "Support: https://stangelispass.app/support" },
      ]),
    ).toEqual([]);
  });
});

describe("checkAppConfig", () => {
  const compliant = {
    expo: {
      version: "1.0.0",
      ios: {
        supportsTablet: false,
        bundleIdentifier: "com.stangelispass.app",
        infoPlist: { ITSAppUsesNonExemptEncryption: false },
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
    const cfg = structuredClone(compliant);
    cfg.expo.ios.infoPlist.NSUserTrackingUsageDescription = "why";
    expect(checkAppConfig(cfg)).toContain(
      "NSUserTrackingUsageDescription must be absent (no ATT, no tracking)",
    );
  });

  it("requires the export compliance flag", () => {
    const cfg = structuredClone(compliant);
    delete cfg.expo.ios.infoPlist.ITSAppUsesNonExemptEncryption;
    expect(checkAppConfig(cfg)).toContain(
      "ITSAppUsesNonExemptEncryption must be set to false",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd app && npx jest src/__tests__/releaseGuard.spec.ts`
Expected: FAIL — cannot find module `../../scripts/release-guard.mjs`.

- [ ] **Step 3: Write the implementation**

Create `app/scripts/release-guard.mjs`:

```js
#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
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
    problems.push("NSPhotoLibraryAddUsageDescription is required (share card save)");
  if (!expo.extra?.eas?.projectId)
    problems.push("extra.eas.projectId missing — run `eas init` in app/");

  return problems;
};

const main = async () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
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

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd app && npx jest src/__tests__/releaseGuard.spec.ts`
Expected: PASS (6 tests). If Jest cannot import the `.mjs` file, add `"scripts/**/*.mjs"` handling by setting `transformIgnorePatterns` to keep the default and importing via `await import(...)` inside the test instead — the exports are plain functions either way.

- [ ] **Step 5: Add the npm script**

In `app/package.json` scripts:

```json
"release:guard": "node scripts/release-guard.mjs",
"preflight:release": "npm run typecheck && npm run lint && npm test -- --watchAll=false && npm run release:guard"
```

- [ ] **Step 6: Run it and confirm it reports today's real blockers**

Run: `cd app && npm run release:guard`
Expected: exit 1, listing `<DOMAIN>` in the store-listing doc, the e-mail/operator placeholders, and `extra.eas.projectId missing`. **That failure is the correct result today** — it is the punch list for Tasks 6–7.

- [ ] **Step 7: Commit**

```bash
git add app/scripts/release-guard.mjs app/src/__tests__/releaseGuard.spec.ts app/package.json
git commit -m "chore(release): add release guard for launch placeholders and ios config"
```

---

## Task 5: Screenshot capture script

App Store Connect needs 3–5 screenshots each at 6.9" (1320×2868) and 6.5" (1242×2688), per `docs/deployment/store-listing-copy.md`. Manual capture drifts in size and scene order between resubmissions.

**Files:**
- Create: `app/scripts/screenshots.mjs`
- Modify: `app/package.json` (script)
- Output: `docs/deployment/screenshots/6.9/01-leaderboard.png` … `docs/deployment/screenshots/6.5/05-comments.png`

**Interfaces:**
- Produces: `npm run screenshots` — expects a running Expo dev server and the named simulators booted; captures with `xcrun simctl io <udid> screenshot`.
- Produces: `SCENES` — the ordered scene list, mirroring the five scenes in the store-listing doc.

- [ ] **Step 1: Confirm the simulator device names available**

Run: `xcrun simctl list devices available`
Note the exact names for a 6.9" device (iPhone 16 Pro Max) and a 6.5" device (iPhone 11 Pro Max). If the 6.5" runtime is absent, install it via Xcode → Settings → Components; Apple still requires that size for the 1.0 listing.

- [ ] **Step 2: Write the script**

Create `app/scripts/screenshots.mjs`:

```js
#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DEVICES = [
  { label: "6.9", name: "iPhone 16 Pro Max", expect: "1320x2868" },
  { label: "6.5", name: "iPhone 11 Pro Max", expect: "1242x2688" },
];

const SCENES = [
  "01-leaderboard",
  "02-add-beer",
  "03-who-pays",
  "04-wall-of-fame",
  "05-comments",
];

const udidFor = (name) => {
  const json = JSON.parse(
    execFileSync("xcrun", ["simctl", "list", "devices", "-j"], {
      encoding: "utf8",
    }),
  );
  for (const list of Object.values(json.devices))
    for (const d of list)
      if (d.name === name && d.state === "Booted") return d.udid;
  throw new Error(`Simulator "${name}" is not booted — boot it and open the app.`);
};

const outDir = (label) =>
  path.resolve(import.meta.dirname, "../../docs/deployment/screenshots", label);

for (const device of DEVICES) {
  const udid = udidFor(device.name);
  mkdirSync(outDir(device.label), { recursive: true });
  for (const scene of SCENES) {
    const file = path.join(outDir(device.label), `${scene}.png`);
    console.log(`\n▸ ${device.label} — navigate the app to: ${scene}`);
    console.log("  press Enter when the screen is ready…");
    execFileSync("/bin/sh", ["-c", "read _"], { stdio: "inherit" });
    execFileSync("xcrun", ["simctl", "io", udid, "screenshot", file]);
    console.log(`  saved ${file}`);
  }
  console.log(
    `\nVerify every ${device.label} file is ${device.expect}: ` +
      `sips -g pixelWidth -g pixelHeight ${outDir(device.label)}/*.png`,
  );
}
```

- [ ] **Step 3: Add the npm script**

```json
"screenshots": "node scripts/screenshots.mjs"
```

- [ ] **Step 4: Capture both sets**

Run: `cd app && npx expo start --ios` in one shell, then `npm run screenshots` in another, following its prompts.
Expected: ten PNGs. Verify dimensions with the printed `sips` command — a wrong-size file is rejected at upload, so fix it now, not in ASC.

- [ ] **Step 5: Commit**

```bash
git add app/scripts/screenshots.mjs app/package.json docs/deployment/screenshots
git commit -m "chore(store): add simulator screenshot script and 1.0 screenshot set"
```

---

## Task 6: Resolve the operator placeholders

Apple opens the support URL during review; a page reading `[Support-E-Mail einfügen]` is a rejection risk, and the imprint is a legal requirement in DACH. This needs one decision from the account owner: **which e-mail address receives support mail** (and the operator name/address for the imprint).

**Files:**
- Modify: `docs/legal/imprint.md`
- Modify: `web/legal/public/imprint.html`, `web/legal/public/support.html`

- [ ] **Step 1: Collect the values** — operator name/company, postal address, support e-mail, optional phone/commercial-register entry.
- [ ] **Step 2: Replace every placeholder** in the four files above. Keep the markdown and HTML copies identical in substance.
- [ ] **Step 3: Verify** — `cd app && npm run release:guard` no longer reports e-mail/operator placeholders (`<DOMAIN>` still will, until Task 7).
- [ ] **Step 4: Commit**

```bash
git add docs/legal web/legal
git commit -m "docs(legal): fill in operator and support contact details"
```

---

## Task 7: Deploy the legal pages and bind the real domain

**Files:**
- Modify: `docs/deployment/store-listing-copy.md` (five `<DOMAIN>` occurrences + the checklist line)

- [ ] **Step 1: Deploy** — from `web/legal/`, `vercel deploy --prod` (the directory already carries `vercel.json` and the four pages).
- [ ] **Step 2: Attach the production domain** in the Vercel dashboard, or accept the generated `*.vercel.app` host for 1.0.
- [ ] **Step 3: Verify all four routes return 200 without auth**

```bash
for p in privacy terms imprint support; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "https://<real-domain>/$p"
done
```

Expected: `200` four times. A 401/404 on `/privacy` blocks submission — App Store Connect validates that URL.

- [ ] **Step 4: Replace `<DOMAIN>`** in `docs/deployment/store-listing-copy.md` with the real host.
- [ ] **Step 5: Verify** — `cd app && npm run release:guard` now reports only `extra.eas.projectId missing`.
- [ ] **Step 6: Commit**

```bash
git add docs/deployment/store-listing-copy.md
git commit -m "docs(store): point listing URLs at the deployed legal pages"
```

---

## Task 8: Apple + EAS prerequisites

Account-owner work; no code beyond the `app.json` fields `eas init` writes.

- [ ] **Step 1: Apple Developer Program** active, all Agreements/Tax/Banking signed in App Store Connect. Unsigned agreements silently block submission.
- [ ] **Step 2: `cd app && eas init`** — links the project and writes `extra.eas.projectId` and `owner` into `app.json`. Commit that change.
- [ ] **Step 3: Create the ASC app record** — name `Stängelispass`, bundle `com.stangelispass.app`, primary language German, SKU of your choice.
- [ ] **Step 4: APNs key** — `cd app && eas credentials`, create/attach the push key (`expo-notifications` is wired and the `processNotifications` / `notifyLeadChange` Edge Functions exist, so push must work in TestFlight).
- [ ] **Step 5: EAS secrets** — production Supabase values:

```bash
cd app
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://<prod>.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<prod-anon-key>"
```

- [ ] **Step 6: Submit-profile env** — export `APP_STORE_CONNECT_APP_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY_PATH`, `ASC_TEAM_ID`; `app/eas.json`'s submit profile already references them.
- [ ] **Step 7: Verify** — `cd app && npm run release:guard` exits 0. That is the green light for Task 9.

---

## Task 9: Build, TestFlight, submit, release

**Files:**
- Create: `docs/deployment/release-runbook.md` — capture the outcome of each step below as you go, so a 1.0.1 repeats it without re-deriving.

- [ ] **Step 1: Full gate** — `cd app && npm run preflight:release`. Expected: typecheck, lint, 539 tests, guard all green.
- [ ] **Step 2: Config sanity** — `cd app && npx expo config --type public`. Confirm version `1.0.0`, `supportsTablet: false`, no `NSUserTrackingUsageDescription`, `projectId` present.
- [ ] **Step 3: Production build** — `cd app && eas build -p ios --profile production`. Remote versioning assigns the build number; do not pass one.
- [ ] **Step 4: Submit to TestFlight** — `cd app && eas submit -p ios --profile production`. Complete the Export Compliance answer (no non-exempt encryption) if prompted.
- [ ] **Step 5: TestFlight smoke test** on a real device — create a profile, create an event, log a beer, run "Wer zahlt?", scan a participant QR, receive a push notification, save a share card to Photos, then background/foreground the app. Any failure here stops the release; file it and fix before resubmitting.
- [ ] **Step 6: ASC metadata** — paste name, subtitle, keywords, description, What's New, URLs, review notes from `docs/deployment/store-listing-copy.md`; upload the ten screenshots from Task 5; answer the age-rating questionnaire per that doc (→ 17+); fill the App Privacy nutrition labels to match `app/PrivacyInfo.xcprivacy` exactly.
- [ ] **Step 7: Submit for review** with **manual release** selected, so you control the launch moment.
- [ ] **Step 8: On approval** — release, then verify the live listing renders the German copy and that the support/privacy URLs still resolve.
- [ ] **Step 9: Write the runbook and commit**

```bash
git add docs/deployment/release-runbook.md
git commit -m "docs(deployment): record the 1.0.0 release runbook"
```

---

## Rejection playbook

Most likely reasons, and the prepared answer — all sourced from `docs/deployment/store-listing-copy.md` and `docs/deployment/compliance-audit.md`:

| Apple's objection | Response |
| --- | --- |
| 2.1 — need a demo account | The app has no authentication; profiles are created in-app. Point to the review notes. |
| 5.1.1(v) — account deletion missing | Not applicable: no registration, no accounts. Cite the audit §1. |
| 1.4.3 / alcohol concerns | 17+ rating, in-app age + responsibility notice (settings footer), responsible-drinking text in description and terms. |
| Guideline 2.3.1 — hidden features | `IAP_ENABLED` is `false` and `expo-in-app-purchases` is removed; nothing purchasable is reachable. |
| 5.1.2 — privacy labels mismatch | Labels are derived 1:1 from `PrivacyInfo.xcprivacy`; five linked types, none used for tracking. |

## Self-Review

**Spec coverage:** WS-A…F of the v2 plan are implemented and committed (`dedacf6`); this plan covers every item the audit left open — support/operator placeholders (Task 6), Vercel deploy + `<DOMAIN>` (Task 7), `eas init` (Task 8), screenshots (Task 5) — plus the two gaps the audit surfaced but did not close: hardcoded version (Task 1) and English UI against a German listing (Tasks 2–3). Task 4 turns the audit's open-items list into a failing command.

**Deferred by decision, not oversight:** event passes / IAP and the viral-feature roadmap (see Scope). A hard age gate stays out — Apple does not require it at 17+, per audit §5.

**Type consistency:** `formatAppVersion(version?: string | null): string` (Task 1) is used only in `SettingsSections.tsx`. `copy` is introduced in Task 2 as `export const copy = { ... } as const` and extended — never redeclared — in Task 3. `checkPlaceholders` / `checkAppConfig` signatures in the Task 4 test match the implementation exactly, and `PLACEHOLDERS` includes every string Task 6 removes.
