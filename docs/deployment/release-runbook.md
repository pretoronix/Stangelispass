# Stängelispass 1.0.0 — Release Runbook

The ordered manual path from "code complete" to "live in the App Store". Every
step is an action with a verifiable outcome; record the outcome inline as you
go, so 1.0.1 repeats this without re-deriving anything.

**Source of truth for metadata:** `docs/deployment/store-listing-copy.md`
**Plan this implements:** `docs/superpowers/plans/2026-08-17-finish-the-app.md`
**Compliance basis:** `docs/deployment/compliance-audit.md`

## Green light

`cd app && npm run release:guard` must exit 0 before any build is submitted.
It is the machine-checkable form of the punch list below — while it exits 1, it
prints exactly what is still missing.

Guard state at the time this runbook was written (9 blockers, all in steps 1–3):

```
✗ docs/deployment/store-listing-copy.md: unresolved placeholder <DOMAIN>
✗ docs/legal/imprint.md: [E-Mail einfügen] / [Name/Firma des Betreibers einfügen] / [Optional einfügen]
✗ web/legal/public/support.html: [Support-E-Mail einfügen]
✗ web/legal/public/imprint.html: [E-Mail einfügen] / [Name/Firma des Betreibers einfügen] / [Optional einfügen]
✗ app.json: extra.eas.projectId missing — run `eas init` in app/
```

---

## Step 1 — Operator and support details

Needs one decision from the account owner: which address receives support mail,
and the operator identity for the DACH imprint.

- [ ] Collect: operator name/company, postal address, support e-mail, optional
      phone and commercial-register entry.
- [ ] Replace every placeholder in `docs/legal/imprint.md`,
      `web/legal/public/imprint.html`, `web/legal/public/support.html`.
      Keep the markdown and HTML copies identical in substance.
- [ ] Verify: `cd app && npm run release:guard` no longer reports e-mail or
      operator placeholders (`<DOMAIN>` still will, until step 2).
- [ ] Commit: `git add docs/legal web/legal && git commit -m "docs(legal): fill in operator and support contact details"`

Apple opens the support URL during review; a page reading
`[Support-E-Mail einfügen]` is a rejection risk, and the imprint is a legal
requirement in DACH.

## Step 2 — Deploy the legal pages, bind the domain

- [ ] From `web/legal/`: `vercel deploy --prod` (the directory already carries
      `vercel.json` and the four pages).
- [ ] Attach the production domain in the Vercel dashboard, or accept the
      generated `*.vercel.app` host for 1.0.
- [ ] Verify all four routes return 200 without auth:

```bash
for p in privacy terms imprint support; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "https://<real-domain>/$p"
done
```

      Expected: `200` four times. A 401/404 on `/privacy` blocks submission —
      App Store Connect validates that URL.
- [ ] Replace `<DOMAIN>` in `docs/deployment/store-listing-copy.md` with the
      real host (five occurrences plus the checklist line).
- [ ] Verify: `npm run release:guard` now reports only `extra.eas.projectId missing`.
- [ ] Commit: `git commit -m "docs(store): point listing URLs at the deployed legal pages"`

## Step 3 — Apple and EAS prerequisites

- [ ] Apple Developer Program active; all Agreements / Tax / Banking signed in
      App Store Connect. Unsigned agreements silently block submission.
- [ ] `cd app && eas init` — links the project and writes `extra.eas.projectId`
      and `owner` into `app.json`. Commit that change.
- [ ] Create the ASC app record: name `Stängelispass`, bundle
      `com.stangelispass.app`, primary language German, SKU of your choice.
- [ ] `cd app && eas credentials` — create/attach the APNs push key.
      `expo-notifications` is wired and the `processNotifications` /
      `notifyLeadChange` Edge Functions exist, so push must work in TestFlight.
- [ ] EAS secrets — production Supabase values:

```bash
cd app
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://<prod>.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<prod-anon-key>"
```

- [ ] Export the submit-profile env: `APP_STORE_CONNECT_APP_ID`,
      `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY_PATH`,
      `ASC_TEAM_ID`. `app/eas.json`'s submit profile already references them.
- [ ] Verify: `cd app && npm run release:guard` exits 0. **That is the green
      light for step 5.**

## Step 4 — Screenshots

`npm run screenshots` drives booted simulators, writes
`docs/deployment/screenshots/<size>/<scene>.png`, and fails if any file has the
wrong pixel dimensions.

- [ ] One shell: `cd app && npx expo start --ios`.
- [ ] Boot the target simulator(s) and open the app on each.
- [ ] Other shell: `cd app && npm run screenshots`, following its prompts
      through the five scenes (leaderboard, add-beer, who-pays, wall-of-fame,
      comments).
- [ ] Commit the resulting PNGs.

Size classes the script knows:

| Class | Required pixels | Simulator models it accepts |
| --- | --- | --- |
| 6.9" | 1320×2868 | iPhone 17 Pro Max, iPhone 16 Pro Max |
| 6.5" | 1242×2688 | iPhone 11 Pro Max, iPhone XS Max |

**Note:** on the machine where this runbook was written, no 6.5" runtime was
installed — the script warns and skips that class. Install the runtime via
Xcode → Settings → Components if App Store Connect asks for that size.

## Step 5 — Build, TestFlight, submit, release

- [ ] Full gate: `cd app && npm run preflight:release`
      (typecheck, lint, tests, guard — all must be green).
- [ ] Config sanity: `cd app && npx expo config --type public`. Confirm version
      `1.0.0`, `supportsTablet: false`, no `NSUserTrackingUsageDescription`,
      `projectId` present.
- [ ] Production build: `cd app && eas build -p ios --profile production`.
      Remote versioning assigns the build number — **do not pass one**.
- [ ] Submit to TestFlight: `cd app && eas submit -p ios --profile production`.
      Answer Export Compliance (no non-exempt encryption) if prompted.
- [ ] TestFlight smoke test on a real device: create a profile, create an event,
      log a beer, run "Wer zahlt?", scan a participant QR, receive a push
      notification, save a share card to Photos, then background/foreground the
      app. Any failure stops the release; file it and fix before resubmitting.
- [ ] ASC metadata: paste name, subtitle, keywords, description, What's New,
      URLs and review notes from `docs/deployment/store-listing-copy.md`; upload
      the screenshots from step 4; answer the age-rating questionnaire per that
      doc (→ 17+); fill the App Privacy nutrition labels to match
      `app/PrivacyInfo.xcprivacy` exactly.
- [ ] Submit for review with **manual release** selected, so you control the
      launch moment.
- [ ] On approval: release, then verify the live listing renders the German copy
      and that the support/privacy URLs still resolve.

---

## Invariants that must not regress

Enforced by `npm run release:guard`; listed here because a reviewer will check
them by hand if the guard is ever bypassed.

- Version `1.0.0`; `app/eas.json` uses `appVersionSource: "remote"` with
  `autoIncrement: true` on production — never hand-edit `buildNumber`.
- Bundle ID `com.stangelispass.app`; age rating 17+; primary language German.
- `app/app.json` keeps `ios.supportsTablet: false` and
  `ITSAppUsesNonExemptEncryption: false`, and contains **no**
  `NSUserTrackingUsageDescription`.
- `IAP_ENABLED` in `app/src/services/iap.ts` stays `false` for 1.0 — no visible
  purchase UI anywhere.
- Swiss orthography in all user-facing copy: **ss, never ß**. Guarded by
  `app/src/ui/__tests__/copy.spec.ts`.

## Rejection playbook

| Apple's objection | Response |
| --- | --- |
| 2.1 — need a demo account | The app has no authentication; profiles are created in-app. Point to the review notes. |
| 5.1.1(v) — account deletion missing | Not applicable: no registration, no accounts. Cite audit §1. |
| 1.4.3 / alcohol concerns | 17+ rating, in-app age + responsibility notice (settings footer), responsible-drinking text in description and terms. |
| 2.3.1 — hidden features | `IAP_ENABLED` is `false` and `expo-in-app-purchases` is removed; nothing purchasable is reachable. |
| 5.1.2 — privacy labels mismatch | Labels are derived 1:1 from `PrivacyInfo.xcprivacy`; five linked types, none used for tracking. |
