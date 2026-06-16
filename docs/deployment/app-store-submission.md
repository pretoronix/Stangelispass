# iOS App Store Submission Guide

This guide takes Stängelispass from source to a live App Store listing. The
repository has already been prepared for submission (see **What's already done**);
the remaining steps require an Apple Developer account and credentials that only a
human can provide.

> **Tooling:** the app is an Expo **managed** project. Builds are produced in the
> cloud with **EAS Build** and uploaded with **EAS Submit** — no Mac or Xcode
> required. Install the CLI once: `npm install -g eas-cli`.

---

## What's already done in the repo ✅

- **`app.json`**
  - iOS `bundleIdentifier`: `com.stangelispass.app`, `buildNumber: "1"`.
  - `ITSAppUsesNonExemptEncryption: false` (skips the manual export-compliance
    prompt — valid because the app only uses standard HTTPS/TLS).
  - Permission usage strings via config plugins (`expo-camera`,
    `expo-media-library`) — required or Apple **rejects** the build:
    - Camera → QR scanning.
    - Photo library (add) → saving shared cards/stats images.
  - `expo-notifications` plugin registered for push.
- **`eas.json`** — `development`, `preview` (internal testing) and `production`
  (store) build profiles, plus a `submit.production.ios` block (fill in the
  three `REPLACE_WITH_*` values).
- **App icon** — re-encoded to a valid **1024×1024 PNG with no alpha channel**
  (Apple requirement). ⚠️ It is still the placeholder artwork — replace
  `app/assets/icon.png` with real 1024×1024 branding before public launch.
- **npm scripts** (`cd app`): `eas:login`, `eas:init`, `build:ios:preview`,
  `build:ios`, `submit:ios`, and `preflight` (typecheck + lint + tests).

---

## Step 1 — Apple Developer account (human, ~$99/yr) 🧑‍💼

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/)
   ($99/year). Use a company name if publishing under an org.
2. In [App Store Connect](https://appstoreconnect.apple.com) → **Users and
   Access**, note your **Team ID** (also under Developer → Membership).
3. Accept the latest **Paid/Free Apps agreements** (Business → Agreements) —
   submissions are blocked until these are signed.

## Step 2 — Create the app record (human)

1. App Store Connect → **My Apps → + → New App**.
2. Platform **iOS**, Name **Stängelispass**, primary language, **Bundle ID**
   `com.stangelispass.app` (register it under Certificates, IDs & Profiles if it
   isn't in the dropdown), SKU e.g. `stangelispass-001`.
3. Copy the numeric **Apple ID / App Store Connect App ID** from the App
   Information page — this is `ascAppId`.

## Step 3 — Fill in `eas.json` submit credentials

In `app/eas.json`, replace under `submit.production.ios`:

| Field         | Value                                            |
| ------------- | ------------------------------------------------ |
| `appleId`     | your Apple ID email                              |
| `ascAppId`    | numeric App Store Connect App ID (Step 2)        |
| `appleTeamId` | your Apple Team ID (Step 1)                      |

## Step 4 — Configure environment / secrets

The app reads Supabase config from `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY`. For production builds set them as EAS
environment variables (do **not** commit real keys):

```bash
cd app
eas login
eas init                       # links/creates the EAS project (writes projectId)
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR.supabase.co" --environment production
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY" --environment production
```

> `eas init` adds `expo.extra.eas.projectId` / `owner` to `app.json` — commit that.

### Repository secrets (GitHub Actions)

Add these under **GitHub → Settings → Secrets and variables → Actions** so the
**Keep Supabase Warm** workflow (`.github/workflows/keep-supabase-warm.yml`)
can ping your project and stop the free tier from pausing after ~7 days idle:

| Secret              | Value                                  |
| ------------------- | -------------------------------------- |
| `SUPABASE_URL`      | `https://YOUR_REF.supabase.co`         |
| `SUPABASE_ANON_KEY` | your project's public anon key         |

> The scheduled ping only runs from the **default branch** (`main`), so it
> activates once this is merged. You can test it immediately via
> **Actions → Keep Supabase Warm → Run workflow**.

## Step 5 — Build the production binary

```bash
cd app
npm run preflight        # green typecheck + lint + tests before spending build minutes
npm run build:ios        # eas build --platform ios --profile production
```

EAS will offer to **generate the iOS Distribution certificate and provisioning
profile for you** — accept (recommended). Push notifications also need an
**APNs key**; EAS can create/manage it when prompted.

## Step 6 — TestFlight (strongly recommended)

```bash
npm run submit:ios       # uploads the build to App Store Connect
```

The build appears under **TestFlight** after Apple finishes processing
(~5–30 min). Add yourself as an internal tester and smoke-test on a real device
before going to review.

## Step 7 — Store listing metadata (human, in App Store Connect)

Required before you can submit for review:

- **Screenshots** — at minimum 6.7" iPhone (1290×2796). Because
  `ios.supportsTablet` is `true`, **iPad screenshots are also required**. To
  avoid that, set `supportsTablet: false` in `app.json` and rebuild.
- **Description, keywords, support URL, marketing URL.**
- **Privacy Policy URL** — mandatory (the app has accounts + collects data).
- **App Privacy ("nutrition label")** — declare data collected via Supabase
  (e.g. user identifiers, usage data) and whether it's linked to identity.
- **Age rating** questionnaire. Note: the app's theme is **alcohol/beer
  tracking** → expect a **17+** rating; answer the alcohol-reference questions
  truthfully.
- **Category** (e.g. Social Networking or Lifestyle).
- **Demo account** — App Review needs working credentials. Provide a seeded
  user/event in the "App Review Information → Sign-in" notes, or the review
  will be rejected.

## Step 8 — Submit for review (human)

1. Attach the processed build to the version.
2. **Add for Review → Submit**. Typical review turnaround: 24–48h.
3. On rejection, read Resolution Center, fix, bump `buildNumber`
   (`production` profile uses `autoIncrement`, so EAS handles this), rebuild,
   resubmit.

---

## Likely rejection risks for this app ⚠️

- **Alcohol content** — keep it responsible; no targeting minors; expect 17+.
- **Placeholder icon/screenshots** — replace with real branding first.
- **Missing demo account** — the single most common avoidable rejection.
- **Account deletion** — Apple requires an in-app way to delete the account for
  apps with account creation. Verify Settings exposes this (or add it).
- **Privacy manifest** — Expo SDK 54 generates `PrivacyInfo.xcprivacy` for its
  modules automatically; no action needed unless you add SDKs that require extra
  reason codes.

## Pre-submission checklist

- [ ] Apple Developer Program active; agreements signed
- [ ] App record created; `ascAppId` known
- [ ] `eas.json` submit credentials filled in
- [ ] `eas init` run; `projectId` committed
- [ ] Production Supabase env vars set in EAS
- [ ] GitHub secrets `SUPABASE_URL` + `SUPABASE_ANON_KEY` added (keep-warm cron)
- [ ] Real 1024×1024 icon (no alpha) in `app/assets/icon.png`
- [ ] `npm run preflight` green
- [ ] Production build succeeds (`npm run build:ios`)
- [ ] Tested via TestFlight on a real device
- [ ] Screenshots (iPhone + iPad if `supportsTablet`), description, keywords
- [ ] Privacy Policy URL + App Privacy answers
- [ ] Age rating completed (alcohol → 17+)
- [ ] Demo account in App Review notes
- [ ] In-app account deletion available
- [ ] Submitted for review
