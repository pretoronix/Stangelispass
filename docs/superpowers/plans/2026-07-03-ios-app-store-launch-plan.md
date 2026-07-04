# iOS App Store Launch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vorbereiten, bauen und einreichen einer iOS-Production-Version von Stängelispass für den App Store.

**Architecture:** Expo/EAS-basierter Build- und Submit-Flow mit App Store Connect; Compliance- und rechtliche Dokumente werden im Repo versioniert und über öffentliche URLs verlinkt.

**Tech Stack:** Expo 54, EAS Build/Submit, Apple Developer Portal, App Store Connect, Supabase.

## Global Constraints

- Bundle ID: `com.stangelispass.app`
- App-Name: `Stängelispass`
- Minimale iOS-Version: iOS 15.1
- Keine Secrets im Repo; EAS Secrets für Supabase URL/Anon Key.
- Alkohol-App erfordert Altersfreigabe 17+ und verantwortungsbewusste Darstellung.
- Kein App-Tracking ohne ATT-Prompt.
- Privacy Manifest erforderlich für bestimmte Native APIs.
- Mehrsprachigkeit ist optional; primärer Markt ist DACH.

---

## File Structure

| File | Purpose |
| --- | --- |
| `app/app.json` | Expo-App-Manifest mit iOS-spezifischen Einstellungen |
| `app/eas.json` | EAS Build/Submit-Profile |
| `app/assets/icon.png` | App-Icon (1024×1024) |
| `app/assets/splash-icon.png` | Splash-Screen-Icon |
| `app/PrivacyInfo.xcprivacy` | Apple Privacy Manifest |
| `docs/legal/privacy-policy.md` | Datenschutzerklärung |
| `docs/legal/terms-of-use.md` | Nutzungsbedingungen |
| `docs/legal/imprint.md` | Impressum |
| `docs/deployment/store-listing-copy.md` | App Store Listing Texte und Asset-Spezifikationen |

---

## Task 1: Apple Developer & App Store Connect Voraussetzungen prüfen

**Files:**
- Keine Dateiänderungen im Repo.

**Interfaces:**
- Consumes: Apple ID, Kreditkarte für 99 USD/Jahr.
- Produces: Aktives Apple Developer Program, App Store Connect Zugriff.

- [ ] **Step 1: Apple Developer Program Status prüfen**

Aktion: Benutzer meldet sich unter https://developer.apple.com/account/ an und bestätigt, dass die Mitgliedschaft aktiv ist.

Expected: Account-Status lautet "Active".

Falls nicht aktiv:
1. "Join the Apple Developer Program" auswählen.
2. Entity Type: "Individual" oder "Organization" wählen.
3. 99 USD/Jahr zahlen.
4. Warten, bis Status "Active" ist (bei Organization bis zu 48 Stunden).

- [ ] **Step 2: Bundle ID in Apple Developer Portal registrieren**

Aktion:
1. https://developer.apple.com/account/resources/identifiers/list öffnen.
2. "Identifiers" → "App IDs" → "+" klicken.
3. "App" auswählen.
4. Beschreibung eingeben: `Stängelispass`
5. Bundle ID: `com.stangelispass.app` (explicit, nicht wildcard)
6. Capabilities: Keine zusätzlichen Capabilities aktivieren (kein Sign in with Apple, kein Push falls nicht verwendet).
7. "Continue" → "Register".

Expected: Bundle ID ist registriert und ohne Warnung.

- [ ] **Step 3: App Store Connect App-Eintrag erstellen**

Aktion:
1. https://appstoreconnect.apple.com/ öffnen.
2. "My Apps" → "+" → "New App".
3. Plattform: iOS.
4. Name: `Stängelispass` (falls vergeben, Subtitle anpassen und neuen Namen versuchen).
5. Primary Language: German.
6. Bundle ID: `com.stangelispass.app` auswählen.
7. SKU: `stangelispass-v1`.
8. User Access: Full Access.
9. "Create" klicken.

Expected: App-Eintrag ist sichtbar und Status lautet "Prepare for Submission".

- [ ] **Step 4: App Store Connect API Key erstellen**

Aktion:
1. App Store Connect → Users and Access → Integrations → App Store Connect API.
2. "+" klicken.
3. Name: `EAS Submit`
4. Rolle: `App Manager` (oder `Admin` falls Admin-Rechte gewünscht).
5. "Generate API Key".
6. Key ID, Issuer ID und heruntergeladene `.p8`-Datei sicher speichern.

Expected: API Key ist aktiv und Werte sind notiert.

- [ ] **Step 5: EAS-Account mit Apple verknüpfen**

Aktion: Terminal ausführen:

```bash
cd app
npx eas credentials
```

Im Menü:
1. iOS
2. Production
3. "Generate a new Apple Developer Program credentials"
4. "Log in with Apple" → Apple ID und App-Specific Password eingeben.

Falls App-Specific Password fehlt:
1. https://appleid.apple.com/ öffnen.
2. Sign-In and Security → App-Specific Passwords → "+".
3. Passwort-Label: `EAS Build`.
4. Generiertes Passwort kopieren.

Expected: EAS zeigt `Apple Developer Team ID` und `Bundle Identifier` an.

---

## Task 2: Expo-App-Konfiguration für iOS Launch erweitern

**Files:**
- Modify: `app/app.json`
- Create: `app/PrivacyInfo.xcprivacy`

**Interfaces:**
- Consumes: Bundle ID, App-Name, Asset-Pfade.
- Produces: Vollständiges iOS-App-Manifest mit Privacy Manifest Pfad.

- [ ] **Step 1: Aktuelle `app.json` lesen**

Run: `cat app/app.json`

Expected: Datei enthält `name`, `slug`, `version`, `ios.bundleIdentifier` und `ios.buildNumber`.

- [ ] **Step 2: `app.json` um iOS-spezifische Konfiguration erweitern**

Modify: `app/app.json`

```json
{
  "expo": {
    "name": "Stängelispass",
    "slug": "stangelispass",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "stangelispass",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a2e"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.stangelispass.app",
      "buildNumber": "1",
      "infoPlist": {
        "CFBundleAllowMixedLocalizations": true,
        "ITSAppUsesNonExemptEncryption": false,
        "NSCameraUsageDescription": "Stängelispass uses the camera to scan QR codes for peer beer logging.",
        "NSPhotoLibraryUsageDescription": "Stängelispass accesses your photo library only if you choose to save share cards.",
        "NSUserTrackingUsageDescription": "Your data is not tracked across third-party apps or websites."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a1a2e"
      },
      "package": "com.stangelispass.app",
      "versionCode": 1
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          "ios": {
            "privacyManifests": {
              "PrivacyInfo.xcprivacy": "./PrivacyInfo.xcprivacy"
            }
          }
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

Expected: `app.json` enthält `infoPlist` mit `ITSAppUsesNonExemptEncryption`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSUserTrackingUsageDescription` und `expo-build-properties` Plugin mit Privacy Manifest.

- [ ] **Step 3: Privacy Manifest erstellen**

Create: `app/PrivacyInfo.xcprivacy`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeUserID</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeDeviceID</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
  </array>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>C617.1</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryDiskSpace</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>E174.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

Expected: Datei liegt unter `app/PrivacyInfo.xcprivacy` und ist valides XML.

- [ ] **Step 4: Expo-Konfiguration validieren**

Run:

```bash
cd app
npx expo config --type introspect
```

Expected: Befehl endet ohne Fehler und zeigt iOS-Konfiguration mit `infoPlist` und `plugins`.

- [ ] **Step 5: Commit**

```bash
git add app/app.json app/PrivacyInfo.xcprivacy
git commit -m "feat(ios): add iOS launch config and PrivacyInfo.xcprivacy"
```

---

## Task 3: EAS Production-Profil erweitern

**Files:**
- Modify: `app/eas.json`

**Interfaces:**
- Consumes: App-Name, Bundle ID.
- Produces: Production-Profil mit Auto-Increment und Submit-Konfiguration.

- [ ] **Step 1: Aktuelle `eas.json` lesen**

Run: `cat app/eas.json`

Expected: Datei enthält Profile `development`, `preview`, `production`.

- [ ] **Step 2: `eas.json` erweitern**

Modify: `app/eas.json`

```json
{
  "cli": {
    "version": ">= 14.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "resourceClass": "medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "$APP_STORE_CONNECT_APP_ID",
        "ascIssuerId": "$APP_STORE_CONNECT_ISSUER_ID",
        "ascApiKeyPath": "$APP_STORE_CONNECT_API_KEY_PATH",
        "ascTeamId": "$ASC_TEAM_ID"
      }
    }
  }
}
```

Expected: `eas.json` enthält `cli.appVersionSource: remote`, `production.autoIncrement: true` und `submit.production.ios` mit Umgebungsvariablen.

- [ ] **Step 3: EAS CLI Version prüfen**

Run:

```bash
cd app
npx eas --version
```

Expected: Version ist ≥ 14.0.0. Falls nicht, aktualisieren mit `npm install --save-dev eas-cli@latest`.

- [ ] **Step 4: Commit**

```bash
git add app/eas.json
git commit -m "feat(ios): configure EAS production profile with auto-increment and submit"
```

---

## Task 4: Rechtliche Dokumente erstellen

**Files:**
- Create: `docs/legal/privacy-policy.md`
- Create: `docs/legal/terms-of-use.md`
- Create: `docs/legal/imprint.md`

**Interfaces:**
- Consumes: App-Name, Kontaktdaten des Betreibers.
- Produces: Veröffentlichbare rechtliche Dokumente.

- [ ] **Step 1: Datenschutzerklärung erstellen**

Create: `docs/legal/privacy-policy.md`

```markdown
# Datenschutzerklärung für Stängelispass

Zuletzt aktualisiert: 3. Juli 2026

## Verantwortlicher
[Name/Firma des Betreibers einfügen]
[Adresse einfügen]
[E-Mail einfügen]

## Übersicht
Stängelispass erfasst und speichert Daten, die für die Funktion der App erforderlich sind: Benutzerprofile innerhalb der App, Bier-Logs, Event-Mitgliedschaften und Kommentare. Diese Daten werden in Supabase (PostgreSQL) gespeichert.

## Welche Daten wir erfassen
- **App-interne Benutzer-ID**: Erforderlich für Zuordnung von Logs und Kommentaren.
- **Geräte-ID**: Erforderlich für Push-Benachrichtigungen (optional).
- **Nutzungsdaten**: App-Interaktionen wie Bier-Logs, Event-Teilnahmen und Kommentare.
- **Crash-Daten**: Bei Aktivierung zur Fehlerbehebung.

## Zweck der Datenverarbeitung
Die Daten werden ausschliesslich verwendet, um die Kernfunktionen der App bereitzustellen: Echtzeit-Leaderboards, Event-Verwaltung, Kommentare und Push-Benachrichtigungen.

## Rechtsgrundlage
Die Verarbeitung erfolgt auf Grundlage von Art. 6 DSGVO (bzw. Schweizer DSG) zur Erfüllung des Nutzungsvertrags und auf Grundlage berechtigten Interesses zur Sicherstellung der App-Funktionalität.

## Drittanbieter
- **Supabase**: Cloud-Datenbank und Hosting der Backend-Dienste.
- **Expo**: Build- und Update-Infrastruktur.

## Speicherdauer
Personenbezogene Daten werden so lange gespeichert, wie sie für die App-Nutzung erforderlich sind oder bis der Nutzer die Löschung verlangt.

## Datensicherheit
Wir setzen technische und organisatorische Massnahmen ein, um Daten vor unbefugtem Zugriff zu schützen. Die Kommunikation zwischen App und Backend erfolgt verschlüsselt via HTTPS.

## Ihre Rechte
Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten. Kontaktieren Sie uns unter der oben genannten E-Mail.

## Beschwerderecht
Sie haben das Recht, sich bei einer zuständigen Datenschutzaufsichtsbehörde zu beschweren.

## Änderungen
Wir können diese Datenschutzerklärung aktualisieren. Die aktuelle Version ist immer in der App verlinkt.
```

Expected: Datei liegt unter `docs/legal/privacy-policy.md` und enthält alle Abschnitte.

- [ ] **Step 2: Nutzungsbedingungen erstellen**

Create: `docs/legal/terms-of-use.md`

```markdown
# Nutzungsbedingungen für Stängelispass

Zuletzt aktualisiert: 3. Juli 2026

## Geltungsbereich
Mit der Nutzung von Stängelispass akzeptieren Sie diese Bedingungen.

## Altersbeschränkung
Stängelispass dient der Dokumentation von alkoholischen Getränken. Die App ist nur für Personen ab 17 Jahren bzw. dem gesetzlichen Mindestalter für Alkoholkonsum im jeweiligen Land bestimmt.

## Verantwortungsbewusster Genuss
Stängelispass fördert keinen übermässigen Alkoholkonsum. Nutzen Sie die App verantwortungsvoll.

## Lizenz
Der Betreiber räumt Ihnen eine beschränkte, nicht übertragbare Lizenz zur Nutzung der App ein.

## Verbotene Aktivitäten
Es ist untersagt, die App für illegale Zwecke zu nutzen, Daten zu manipulieren oder die Sicherheit der App zu gefährden.

## Geistiges Eigentum
Alle Rechte an der App und ihren Inhalten verbleiben beim Betreiber.

## Haftungsausschluss
Die App wird "wie besehen" bereitgestellt. Der Betreiber haftet nicht für Fehler in Daten oder Folgen der App-Nutzung.

## Kündigung
Der Betreiber kann den Zugang zur App bei Verstoss gegen diese Bedingungen sperren.

## Anwendbares Recht
Es gilt das Recht des Sitzes des Betreibers. Gerichtsstand ist der Sitz des Betreibers.

## Änderungen
Die Nutzungsbedingungen können jederzeit geändert werden.
```

Expected: Datei liegt unter `docs/legal/terms-of-use.md` und enthält alle Abschnitte.

- [ ] **Step 3: Impressum erstellen**

Create: `docs/legal/imprint.md`

```markdown
# Impressum

[Name/Firma des Betreibers einfügen]
[Strasse und Hausnummer]
[PLZ Ort]
[Land]

E-Mail: [E-Mail einfügen]
Telefon: [Optional einfügen]

Handelsregister: [Optional einfügen]
USt-IdNr.: [Optional einfügen]
Vertretungsberechtigte Personen: [Optional einfügen]
```

Expected: Datei liegt unter `docs/legal/imprint.md`.

- [ ] **Step 4: Commit**

```bash
git add docs/legal/
git commit -m "docs(legal): add privacy policy, terms of use and imprint templates"
```

---

## Task 5: Marketing Assets & Store Listing vorbereiten

**Files:**
- Keine neuen Dateien im Repo (Assets werden in App Store Connect hochgeladen).
- Create: `docs/deployment/store-listing-copy.md`

**Interfaces:**
- Consumes: App-Name, Features, rechtliche Hinweise.
- Produces: Store-Listing-Texte und Asset-Spezifikationen.

- [ ] **Step 1: Store-Listing-Texte erstellen**

Create: `docs/deployment/store-listing-copy.md`

```markdown
# Stängelispass — App Store Listing Copy

## App Name
Stängelispass

## Subtitle
Social beer tracking with real-time leaderboards

## Keywords
beer,drinking,party,leaderboard,social,tracker,event,stängeli,who pays,pub

## Description
Stängelispass ist die ultimative App für Gruppen, die ihre gemeinsamen Runden dokumentieren und spassig verwalten möchten.

- Echtzeit-Leaderboards für Events
- „Who Pays?"-Randomizer für die nächste Runde
- Wall of Fame für legendäre Abende
- Kommentare mit Live-Updates
- Kostenübersicht pro Event
- QR-Code-basiertes Peer-Logging

Bitte geniessen Sie Alkohol verantwortungsvoll. Diese App ist für Personen ab 17 Jahren.

## Support URL
https://[your-domain]/support

## Marketing URL
https://[your-domain]

## Privacy Policy URL
https://[your-domain]/privacy

## What's New (v1.0.0)
Initial release of Stängelispass.
```

Expected: Datei liegt unter `docs/deployment/store-listing-copy.md`.

- [ ] **Step 2: Asset-Spezifikationen dokumentieren**

Append to `docs/deployment/store-listing-copy.md`:

```markdown
## Required Screenshots

- iPhone 6.7" Display: 1290×2796 px
- iPhone 6.5" Display: 1284×2778 px
- iPad Pro 6th Gen 12.9": 2048×2732 px (optional)

Empfohlene Screenshot-Szenen:
1. Event-Übersicht mit Leaderboard
2. Bier-Log hinzufügen
3. „Who Pays?"-Randomizer
4. Wall of Fame
5. Kommentare / Live-Updates

## App Icon
- 1024×1024 px
- Kein Alpha-Kanal / keine Transparenz
- Eckradius wird automatisch von Apple hinzugefügt

## App Preview (optional)
- 15–30 Sekunden
- Auflösung entsprechend Zielgerät
- Ton optional, aber empfohlen
```

Expected: Dokument enthält Screenshot- und Icon-Spezifikationen.

- [ ] **Step 3: Commit**

```bash
git add docs/deployment/store-listing-copy.md
git commit -m "docs(deployment): add App Store listing copy and asset specs"
```

---

## Task 6: EAS Secrets für Production Backend konfigurieren

**Files:**
- Keine Dateiänderungen im Repo.

**Interfaces:**
- Consumes: Produktions-Supabase URL und Anon Key.
- Produces: EAS Build mit korrekten Umgebungsvariablen.

- [ ] **Step 1: Supabase Production Werte bereitstellen**

Aktion: Benutzer kopiert `EXPO_PUBLIC_SUPABASE_URL` und `EXPO_PUBLIC_SUPABASE_ANON_KEY` aus dem Supabase Production Dashboard.

- [ ] **Step 2: EAS Secrets setzen**

Run:

```bash
cd app
npx eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co" --scope project
npx eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key" --scope project
```

Expected: Beide Secrets sind unter Project Settings → Secrets in der EAS Console sichtbar.

- [ ] **Step 3: App Store Connect Submit Secrets setzen**

Run:

```bash
cd app
npx eas secret:create --name APP_STORE_CONNECT_APP_ID --value "1234567890" --scope project
npx eas secret:create --name APP_STORE_CONNECT_ISSUER_ID --value "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" --scope project
npx eas secret:create --name APP_STORE_CONNECT_API_KEY_PATH --value "./AuthKey_XXXXXX.p8" --scope project
npx eas secret:create --name ASC_TEAM_ID --value "XXXXXXXXXX" --scope project
```

Expected: Alle Submit-Secrets sind in der EAS Console sichtbar.

Hinweis: Der Pfad zur `.p8`-Datei muss beim Build/Submit lokal oder im CI verfügbar sein. Bei CI muss die Datei als Encrypted Secret oder File Secret hinterlegt werden.

- [ ] **Step 4: Lokalen `.env` für Build-Validierung setzen**

Aktion: Benutzer erstellt `app/.env` aus `app/.env.example` und füllt die Werte aus.

Run:

```bash
cd app
cp .env.example .env
```

Expected: `app/.env` existiert und ist in `.gitignore` (bereits konfiguriert).

---

## Task 7: Production Build durchführen

**Files:**
- Keine Änderungen am Code (Build ist CI/CD-Aktion).

**Interfaces:**
- Consumes: `eas.json`, EAS Secrets, Apple Credentials.
- Produces: Signiertes `.ipa` im App Store Connect.

- [ ] **Step 1: Pre-Build Validierung**

Run:

```bash
cd app
npm run typecheck
npm run lint
npm run test:handles
```

Expected: TypeScript 0 Fehler, Lint 0 Fehler, alle Tests grün.

**Known issues resolved during preparation:**
- Installed missing dependencies `expo-splash-screen` and `@expo-google-fonts/inter` (required by `src/app/_layout.tsx`).
- Removed invalid `queryClient.clear()` calls from `src/__tests__/labels.spec.tsx`.
- Upgraded `@testing-library/react-native` to v14 and installed `test-renderer` for React 19 compatibility.
- Migrated all test files to v14 async semantics (`await render(...)`, `await renderHook(...)`, `await fireEvent.press(...)`, `await act(...)`).
- Removed unused `screen` global usage; switched to bound query helpers from `await render(...)`.
- Simplified `notifyManager.setNotifyFunction` in `app/jest-setup.js` to run synchronously, eliminating overlapping `act()` warnings.

**Verification:**
- `npm run typecheck` ✅ 0 errors
- `npm run lint` ✅ 0 errors, 6 pre-existing warnings
- `npm run test:handles` ✅ 85/87 suites passed (2 skipped), 536/553 tests passed (17 skipped)

- [ ] **Step 2: EAS Production Build starten**

Run:

```bash
cd app
npx eas build --platform ios --profile production
```

Expected: Build wird in EAS Cloud gestartet und endet mit Upload zu App Store Connect.

Falls Upload fehlschlägt:
1. App Store Connect API Key prüfen.
2. `ASC_TEAM_ID` prüfen.
3. Build manuell mit Transporter App hochladen.

- [ ] **Step 3: Build-Status in App Store Connect prüfen**

Aktion: Benutzer öffnet App Store Connect → My Apps → Stängelispass → TestFlight.

Expected: Build erscheint unter TestFlight → Builds nach Verarbeitung (ca. 5–30 Minuten).

---

## Task 8: TestFlight Release

**Files:**
- Keine Dateiänderungen.

**Interfaces:**
- Consumes: Verarbeiteter Build in App Store Connect.
- Produces: TestFlight-Version, die von internen Testern installiert werden kann.

- [ ] **Step 1: Interne Tester hinzufügen**

Aktion:
1. App Store Connect → TestFlight → Internal Testing.
2. Gruppe "App Store Connect Users" auswählen.
3. "+" → Tester aus dem Team hinzufügen.

Expected: Tester erhalten Einladungs-E-Mail.

- [ ] **Step 2: App auf Testgerät installieren**

Aktion:
1. TestFlight App auf iOS-Gerät installieren.
2. Einladungs-E-Mail öffnen und "View in TestFlight" klicken.
3. In TestFlight: Stängelispass installieren.

Expected: App startet und verbindet sich mit Production-Supabase.

- [ ] **Step 3: Smoke Tests durchführen**

Checklist:
- [ ] App startet ohne Crash
- [ ] Bier-Log hinzufügen
- [ ] Event erstellen/beitreten
- [ ] Kommentar erstellen
- [ ] Leaderboard aktualisiert sich
- [ ] QR-Code-Scan funktioniert
- [ ] Push-Benachrichtigung (falls aktiviert) kommt an

Expected: Alle kritischen Funktionen arbeiten im Production-Build.

- [ ] **Step 4: Externen TestFlight-Test einrichten (optional)**

Aktion:
1. App Store Connect → TestFlight → External Testing.
2. "New Group" erstellen (z. B. "Beta Tester").
3. Build zur Gruppe hinzufügen.
4. Beta App Review Information ausfüllen.
5. "Submit to Beta App Review".

Expected: Build steht externen Testern nach Beta Review zur Verfügung.

---

## Task 9: App Store Connect Store Listing vervollständigen

**Files:**
- Keine Dateiänderungen im Repo.

**Interfaces:**
- Consumes: Store-Listing-Texte, Screenshots, rechtliche URLs.
- Produces: Vollständiger App Store Connect Eintrag.

- [ ] **Step 1: App Information ausfüllen**

Felder:
- Name: `Stängelispass`
- Subtitle: `Social beer tracking with real-time leaderboards`
- Category: Primary `Food & Drink`, Secondary `Social Networking`
- Content Rights: Bestätigen, dass alle Rechte vorhanden sind.
- Age Rating: 17+ (Frequent/Intense Alcohol, Tobacco, or Drug Use or References)
- License Agreement: Standard-Apple-Lizenz oder eigene AGB-URL.

Expected: Alle Pflichtfelder sind ausgefüllt und ohne Validierungsfehler.

- [ ] **Step 2: Pricing and Availability**

Aktion:
1. Preis auf `Free` setzen.
2. Verfügbarkeitsländer auswählen (empfohlen: Schweiz, Deutschland, Österreich zuerst).
3. "Pre-Order" deaktivieren, falls nicht gewünscht.

Expected: Preis ist kostenlos, Länder sind ausgewählt.

- [ ] **Step 3: App Privacy ausfüllen**

Datentypen:
- User ID: Linked to User, Not for Tracking, App Functionality
- Device ID: Linked to User, Not for Tracking, App Functionality
- Usage Data: Linked to User, Not for Tracking, App Functionality
- Crash Data: Linked to User, Not for Tracking, Analytics

Expected: Privacy-Etiketten zeigen "Does not track you".

- [ ] **Step 4: Screenshots hochladen**

Aktion:
1. App Store Connect → App Store → iPhone 6.7" Display.
2. 3–5 Screenshots hochladen.
3. Wiederholen für iPhone 6.5" Display.
4. Optional: iPad Pro 12.9" 6th Gen.

Expected: App Store Connect zeigt Screenshots in der Vorschau an.

---

## Task 10: Review Submission

**Files:**
- Keine Dateiänderungen.

**Interfaces:**
- Consumes: Vollständiger Store Listing, Build, rechtliche Dokumente.
- Produces: App Store Review Anfrage.

- [ ] **Step 1: Review Notes vorbereiten**

Text:

```
Stängelispass is a social beer-tracking app for adult users. The app requires users to be 17+ and encourages responsible drinking.

Test Account: not required — the app uses local user selection and does not require authentication.

Demo Video: attached (optional).

Notes for Reviewer:
- No third-party analytics or advertising trackers are used.
- No in-app purchases are active.
- Camera permission is only requested when scanning a QR code for peer beer logging.
```

Expected: Review Notes sind in App Store Connect hinterlegt.

- [ ] **Step 2: App für Review einreichen**

Aktion:
1. App Store Connect → App Store → Prepare for Submission.
2. "Add Build" → Neuesten TestFlight Build auswählen.
3. Review Notes einfügen.
4. "Submit for Review" klicken.

Expected: Status ändert sich zu "Waiting for Review".

- [ ] **Step 3: Auf Review-Antworten vorbereiten**

Aktion: Benutzer überwacht App Store Connect auf Nachfragen und reagiert innerhalb von 24–48 Stunden.

Häufige Review-Fragen und Antworten:

**Q: Why does the app need camera access?**
A: The camera is only used to scan QR codes for peer beer logging. The permission is requested at the time of scanning, not at app start.

**Q: Is there any gambling or monetary reward?**
A: No. The "Who Pays?" feature is a randomizer for social convenience only. No real money is wagered or won.

**Q: Does the app promote excessive drinking?**
A: No. The app documents consumption for social groups and includes responsible drinking messaging.

Expected: Review entweder approved oder mit konkreten Nachbesserungen.

- [ ] **Step 4: Nach Approval veröffentlichen**

Aktion:
1. Nach Approval in App Store Connect Release manuell oder automatisch planen.
2. "Release This Version" klicken oder "Automatically release this version" einstellen.

Expected: App ist im App Store verfügbar.

---

## Verification Commands

```bash
# TypeScript
cd app && npm run typecheck

# Lint
cd app && npm run lint

# Tests
cd app && npm run test:handles

# Expo config
cd app && npx expo config --type introspect

# EAS build (production)
cd app && npx eas build --platform ios --profile production

# EAS submit (after approval of build)
cd app && npx eas submit --platform ios --profile production
```

---

*Plan erstellt am 2026-07-03*
