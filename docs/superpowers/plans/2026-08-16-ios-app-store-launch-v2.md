# iOS App Store Launch v2 — Gap-Plan (Stängelispass 1.0.0)

**Status:** aktiv. Ersetzt den Ausführungsteil von `2026-07-03-ios-app-store-launch-plan.md`
(dessen Tasks 1–5 sind größtenteils erledigt; dieses Dokument listet nur noch die realen Lücken
gegen den aktuellen Repo-Stand, Audit vom 2026-08-16).

## Entscheidungen (fix, 2026-08-16)

| Thema | Entscheidung |
| --- | --- |
| In-App-Purchases | **Cut für v1.0.** Kauf-UI deaktiviert, `expo-in-app-purchases` entfernt. Event-Pässe kommen in 1.1. |
| iPad | **Deaktiviert.** `supportsTablet: false` → keine iPad-Screenshots, kein iPad-Layout-Risiko. |
| Legal-Hosting | **Vercel.** Statische Seiten aus `docs/legal/*.md`. |
| Bundle ID | `com.stangelispass.app` (unverändert) |
| Altersfreigabe | 17+ / 18+ (Alkoholbezug) |
| Primärmarkt | DACH, Primärsprache DE |

## Blocker aus dem Audit

1. **IAP-Stub wirft** — `app/src/services/iap.ts:27` wirft immer; erreichbar über
   `useEventPasses.ts:186,232` → `src/app/settings.tsx`. Sichtbar kaputtes Feature → Guideline 2.1.
2. **Placeholder-Assets** — `icon.png`, `adaptive-icon.png`, `splash-icon.png` byte-identisch (22279 B).
3. **Kein EAS-Projekt-Link** — `app/app.json` ohne `extra.eas.projectId` / `owner`.
4. **Legal-Docs nur als Markdown im Repo** — Apple braucht öffentliche Privacy-Policy- und Support-URL.
5. **Info.plist-Lücken** — `expo-media-library` (via `src/utils/shareImage.ts`) ohne
   `NSPhotoLibraryAddUsageDescription`; `NSUserTrackingUsageDescription` gesetzt ohne ATT/Tracking → raus.

---

## Workstreams (parallelisierbar)

### WS-A — IAP für v1.0 entfernen
- `expo-in-app-purchases` aus `app/package.json` entfernen.
- `src/services/iap.ts` → `isIapAvailable()` gibt `false` zurück; Feature-Flag `IAP_ENABLED = false`.
- Kauf-UI in `src/screens/settings/SettingsSections.tsx` / `src/app/settings.tsx` hinter dem Flag ausblenden.
- Keine toten Fehlerpfade, keine sichtbaren „Kaufen"-Buttons.
- Tests grün: `npm test`, insbesondere `src/__tests__/guiIntegrity.spec.tsx`.

### WS-B — App-Konfiguration korrigieren
- `ios.supportsTablet: false`.
- `NSPhotoLibraryAddUsageDescription` ergänzen (Sharecard-Speichern).
- `NSUserTrackingUsageDescription` entfernen (kein Tracking, kein ATT-Prompt).
- `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription` gegen tatsächliche Nutzung prüfen.
- `ITSAppUsesNonExemptEncryption: false` bestätigen.
- `PrivacyInfo.xcprivacy` gegen tatsächlich genutzte APIs prüfen.

### WS-C — Finale App-Assets
- `icon.png` 1024×1024, **ohne Alpha-Kanal** (Apple lehnt Transparenz ab).
- `splash-icon.png` und `adaptive-icon.png` eigenständig (nicht identisch mit Icon).
- `favicon.png` in ordentlicher Auflösung.
- Reproduzierbar: Quell-SVG + Render-Skript im Repo.

### WS-D — Legal-Seiten hosten (Vercel)
- Statische HTML-Seiten aus `docs/legal/privacy-policy.md`, `terms-of-use.md`, `imprint.md`.
- Deploy-Config für Vercel, Routen `/privacy`, `/terms`, `/imprint`, `/support`.
- Ergebnis: drei öffentliche URLs für App Store Connect.

### WS-E — Store-Listing finalisieren
- `docs/deployment/store-listing-copy.md` vervollständigen: Name, Subtitle, Keywords (100 Zeichen),
  Description, What's New.
- Screenshot-Spezifikation: 6.9" (1320×2868) + 6.5", je 3–5 Screens, kein iPad.
- Review-Notes inkl. **Demo-Account** (Apple kann sich nicht selbst registrieren).
- Age-Rating-Fragebogen-Antworten vorbereiten (Alkohol → 17+/18+).
- Privacy-Nutrition-Labels konsistent zu `PrivacyInfo.xcprivacy`.

### WS-F — Compliance-Audit (read-only)
- **Account-Löschung in-App** vorhanden? (Guideline 5.1.1(v), Pflicht bei Registrierung.)
- Supabase-RLS auf allen Tabellen aktiv, keine Secrets im Repo.
- Datenerhebung vs. Privacy-Manifest vs. geplante Nutrition-Labels konsistent.
- Alkohol-Content: Verantwortungshinweise, Altersgate.

---

## Manuelle Schritte (nur Account-Inhaber, nicht automatisierbar)

1. Apple Developer Program aktiv, Agreements signiert.
2. `cd app && eas init` → verlinkt Projekt, schreibt `extra.eas.projectId` + `owner`.
3. ASC-App-Record anlegen: `Stängelispass`, Bundle `com.stangelispass.app`, Primärsprache DE.
4. APNs-Key erzeugen (`eas credentials`) — `expo-notifications` ist aktiv verdrahtet.
5. EAS-Secrets setzen: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Prod).
6. Vercel-Deploy der Legal-Seiten, URLs an WS-E zurückmelden.

## Build → Release

```bash
cd app
npx tsc --noEmit
npm run lint
npm test
npx expo config --type public          # Config-Sanity
eas build -p ios --profile production  # autoIncrement + remote versioning aktiv
eas submit -p ios --profile production
```

Danach: TestFlight-Smoketest (Signup → Bier loggen → QR-Scan → Notification → Sharecard),
ASC-Metadaten vervollständigen, Review einreichen, manuelles Release nach Freigabe.

## Zeitschätzung

| Phase | Dauer |
| --- | --- |
| WS-A…F (parallel) | 1 Tag |
| Apple-Prereqs + EAS-Link | 0,5–1 Tag (teils Wartezeit) |
| Assets + Screenshots final | 1–2 Tage |
| Build + TestFlight | 0,5 Tag + 1–2 Tage Testen |
| Review | 1–3 Tage |
| **Gesamt** | **~1–1,5 Wochen** |
