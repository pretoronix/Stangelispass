# iOS App Store Launch — Design Spec

> **Goal:** Vorbereiten, bauen und einreichen einer iOS-Production-Version von Stängelispass, sodass sie den App Store Review besteht und im App Store veröffentlicht werden kann.

**Scope:** Technischer Launch-Readiness, App Store Connect Setup, rechtliche/privacy Compliance, Marketing Assets, Build-Pipeline, TestFlight und Submission.

**Approach:** Polished Launch — zuerst interner TestFlight-Release, dann Store-Listing, dann öffentliche Submission.

---

## Global Constraints

- App-Name: `Stängelispass`
- Bundle ID: `com.stangelispass.app` (bereits in `app/app.json`)
- Expo SDK: ~54.0.33
- React Native: 0.81.5
- iOS Deployment Target: mindestens iOS 15.1 (Expo 54 Default)
- EAS Build Profil `production` muss Signierung mit App Store Distribution unterstützen.
- Keine Hard-Coded Secrets im Repo.
- Alkohol-App: App Store Review Guideline 1.3 erfordert Altersbeschränkung 17+ und verantwortungsvolle Darstellung.
- Kein App-Tracking ohne App Tracking Transparency (ATT) Prompt.

---

## Sub-Projects / Phasen

Dieser Launch ist in fünf unabhängige Sub-Projekte zerlegt:

### Phase 1: Apple Developer & App Store Connect Setup
**Verantwortlich:** Account-Inhaber (menschender Benutzer). AI kann Checklisten und Anleitungen bereitstellen.

**Deliverables:**
- Apple Developer Program Mitgliedschaft (99 USD/Jahr)
- App ID mit Bundle ID `com.stangelispass.app` in Apple Developer Portal
- App Store Connect App-Eintrag mit korrekter Primärkategorie
- TestFlight-Setup
- EAS Submit Berechtigungen

**Blocker:** Ohne Apple Developer Program kann kein Store-Build signiert werden.

**Detaillierte Schritte:**

#### 1.1 Apple Developer Program beitreten
1. Mit Apple ID unter https://developer.apple.com/account/ anmelden.
2. "Join the Apple Developer Program" auswählen.
3. Entity Type wählen: "Individual" oder "Organization" (Organization erfordert D-U-N-S Nummer).
4. Zahlungsinformationen eingeben (99 USD/Jahr).
5. Mitgliedschaft aktivieren (kann 24–48 Stunden dauern, besonders bei Organization).

#### 1.2 Bundle ID registrieren
1. Apple Developer Portal öffnen: https://developer.apple.com/account/resources/identifiers/list
2. "Identifiers" → "App IDs" → "+" klicken.
3. "App" auswählen.
4. Beschreibung: `Stängelispass`
5. Bundle ID: `com.stangelispass.app` (explicit)
6. Capabilities: Nur aktivieren, was wirklich verwendet wird:
   - Push Notifications (falls Push verwendet wird)
   - Sign in with Apple (NICHT aktivieren, da keine Apple-ID-Authentifizierung existiert)
7. "Continue" → "Register".

#### 1.3 App Store Connect App-Eintrag erstellen
1. https://appstoreconnect.apple.com/ öffnen.
2. "My Apps" → "+" → "New App".
3. Plattform: iOS.
4. Name: `Stängelispass` (muss global eindeutig sein; falls vergeben, Subtitle anpassen).
5. Primary Language: German.
6. Bundle ID: `com.stangelispass.app` (aus Dropdown wählen).
7. SKU: `stangelispass-v1` (intern, beliebig).
8. User Access: Full Access.
9. "Create".

#### 1.4 TestFlight vorbereiten
1. In App Store Connect: App → TestFlight.
2. Internal Testing Group "App Store Connect Users" ist automatisch vorhanden.
3. Sicherstellen, dass mindestens ein interner Tester mit Admin/App Manager Rolle hinzugefügt ist.

#### 1.5 App Store Connect API Key für EAS Submit erstellen
1. App Store Connect → Users and Access → Integrations → App Store Connect API.
2. "+" → Name: `EAS Submit` → Rolle: `App Manager` oder `Admin`.
3. Download `.p8`-Datei sofort (wird nur einmal angezeigt).
4. Issuer ID und Key ID notieren.
5. Diese Werte werden in EAS Secrets hinterlegt (`APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY_PATH`, etc.).

---

### Phase 2: App-Konfiguration & Compliance
**Verantwortlich:** AI implementiert Konfiguration, Benutzer liefert Assets.

**Deliverables:**
- `app.json` / `app.config.ts` Erweiterungen:
  - `infoPlist` Einträge für Privacy Manifest
  - `NSUserTrackingUsageDescription` (falls Tracking)
  - `ITSAppUsesNonExemptEncryption` = false (sofern keine kundeneigene Krypto)
  - `CFBundleAllowMixedLocalizations` = true
  - Altersfreigabe in App Store Connect setzen
- Privacy Manifest `PrivacyInfo.xcprivacy` für verwendete APIs
- `eas.json` Production-Profil erweitern:
  - `autoIncrement: true` für Build-Nummer
  - `ios.enterpriseProvisioning` nicht verwendet (App Store Distribution)
- Icon- und Splash-Asset-Grössen prüfen/ergänzen

**Privacy Manifest Details:**

| API Category | Reason | Begründung |
| --- | --- | --- |
| NSPrivacyAccessedAPICategoryUserDefaults | CA92.1 | App-spezifische Einstellungen über `expo-secure-store` / React Native Defaults |
| NSPrivacyAccessedAPICategoryFileTimestamp | C617.1 | Dateisystem-Zugriff durch Expo/React Native für Caches |
| NSPrivacyAccessedAPICategoryDiskSpace | E174.1 | Prüfung verfügbarer Speicher durch das Betriebssystem |

| Collected Data Type | Linked to User | Tracking | Purpose |
| --- | --- | --- | --- |
| NSPrivacyCollectedDataTypeUserID | true | false | App Functionality |
| NSPrivacyCollectedDataTypeDeviceID | true | false | App Functionality |

**infoPlist Details:**

| Key | Wert | Begründung |
| --- | --- | --- |
| CFBundleAllowMixedLocalizations | true | Ermöglicht gemischte Lokalisierungen |
| ITSAppUsesNonExemptEncryption | false | Keine eigene Kryptografie |
| NSCameraUsageDescription | Kamera für QR-Code-Scan | Wird für Peer-Logging verwendet |
| NSPhotoLibraryUsageDescription | Fotozugriff nur für Share-Cards | Optional, falls Save-to-Photos implementiert |
| NSUserTrackingUsageDescription | Kein Tracking | Dient als Fallback, falls ATT nötig wird |

---

### Phase 3: Rechtliche Dokumente & Store Listing
**Verantwortlich:** AI erstellt Templates, Benutzer prüft/liefert finale Texte.

**Deliverables:**
- Datenschutzerklärung (HTML/Markdown) — erforderlich wegen Netzwerk, Supabase, Geräte-ID
- Nutzungsbedingungen / AGB (Template)
- Impressum (für CH/EU erforderlich)
- App Store Connect Store Listing:
  - App-Name, Untertitel, Keywords, Beschreibung
  - Promotional Text, What's New
  - Support-URL und Marketing-URL
  - Datenschutz-Etiketten
  - Altersfreigabe: 17+ wegen Alkohol

**Store Listing Texte (Kopie in `docs/deployment/store-listing-copy.md`):**

- Subtitle: Max. 30 Zeichen.
- Keywords: Max. 100 Zeichen, kommagetrennt, keine Leerzeichen nach Kommas.
- Description: Max. 4000 Zeichen.
- Promotional Text: Max. 170 Zeichen (kann ohne Review geändert werden).

---

### Phase 4: Marketing Assets
**Verantwortlich:** Benutzer erstellt Screenshots/Video; AI prüft Spezifikationen.

**Deliverables:**
- App Icon: 1024×1024 px, keine Transparenz, keine Alpha-Kanal
- Screenshots für iPhone 6.7" Display (1290×2796) und iPhone 6.5" Display (1284×2778)
- Optional: App Preview Video (15–30 Sekunden)
- Feature Graphic / App Store Promotional Artwork
- App Preview in mindestens einer Lokalisierung (Deutsch, optional Englisch)

**Asset-Checkliste:**

| Asset | Spezifikation | Pflicht |
| --- | --- | --- |
| App Icon | 1024×1024 px, RGB, kein Alpha | Ja |
| Screenshot 6.7" | 1290×2796 px (iPhone 14 Pro Max / 15 Pro Max / 16 Pro Max) | Ja |
| Screenshot 6.5" | 1284×2778 px (iPhone 14 Plus / 13 Pro Max) | Ja |
| Screenshot 5.5" | 1242×2208 px (iPhone 8 Plus) | Empfohlen |
| iPad Pro 12.9" 6th Gen | 2048×2732 px | Optional |
| App Preview | 15–30 Sekunden, H.264 oder ProRes 422 | Optional |

**Empfohlene Screenshot-Szenen:**
1. Event-Übersicht / Leaderboard
2. Bier-Log-Dialog
3. "Who Pays?"-Randomizer
4. Wall of Fame
5. Kommentare / Live-Chat

---

### Phase 5: Production Build, TestFlight & Submission
**Verantwortlich:** AI konfiguriert Pipeline, Benutzer startet Builds und managed App Store Connect.

**Deliverables:**
- `eas build --platform ios --profile production`
- TestFlight interner Test
- Externer TestFlight-Test (optional, empfohlen)
- Pre-Submission Checklist ausgeführt
- `eas submit --platform ios` oder manueller Upload über App Store Connect
- App Store Review eingereicht
- Launch-Datum gesetzt

**Pre-Submission Checklist:**

- [ ] Apple Developer Program aktiv
- [ ] Bundle ID registriert
- [ ] App Store Connect App-Eintrag erstellt
- [ ] `app.json` iOS-Einstellungen korrekt
- [ ] `PrivacyInfo.xcprivacy` vorhanden
- [ ] `eas.json` Production-Profil korrekt
- [ ] EAS Secrets gesetzt
- [ ] Rechtliche Dokumente veröffentlicht und verlinkt
- [ ] Store Listing Texte vollständig
- [ ] Screenshots hochgeladen
- [ ] App Icon hochgeladen
- [ ] TestFlight Build verarbeitet
- [ ] Interne Smoke Tests bestanden
- [ ] Review Notes vorbereitet

---

## Critical iOS Review Risks

### 1. Alkohol-Content (Guideline 1.3)
- App muss Altersfreigabe 17+ haben.
- Darf keine Förderung von übermäßigem Alkoholkonsum darstellen.
- Empfohlen: Verantwortungsbewusster Genuss-Hinweis in App-Beschreibung und optional in der App (z. B. im Settings-Screen).
- Vermeiden: Trinkspiele, die zu übermäßigem Konsum anstacheln; Wetten um Geld; Belohnungen für hohen Alkoholkonsum.

### 2. App Tracking Transparency
- Falls Analytics, Crashlytics oder werbliche Tracker verwendet werden, muss ATT vor dem Tracking abgefragt werden.
- Aktuell keine Analytics-Library sichtbar; falls nachträglich hinzugefügt, muss ATT implementiert werden.
- Mit `NSPrivacyTracking = false` im Privacy Manifest signalisieren wir, dass keine Tracking-Daten erhoben werden.

### 3. Privacy Manifest
- Ab iOS 17.2 erfordert Apple Privacy Manifests für Apps, die bestimmte APIs verwenden.
- Expo 54 generiert teilweise automatisch Manifests, aber eigene Native-Module (SecureStore, Camera, Notifications etc.) müssen geprüft werden.
- `PrivacyInfo.xcprivacy` wird über `expo-build-properties` in `app.json` eingebunden.

### 4. Sign-In & Account-Erstellung
- Aktuell lokale Benutzerauswahl ohne echtes Login. Kein Sign-in-with-Apple erforderlich, solange keine Apple-ID-basierte Authentifizierung existiert.
- Falls später Supabase Auth/OTP hinzukommt: Sign in with Apple ist bei iOS Apps mit Third-Party-Login Pflicht.

### 5. In-App Purchases
- `expo-in-app-purchases` ist als Dependency vorhanden, aber es gibt keine IAP-Funktionalität. Entweder entfernen oder Review-Kommentar vorbereiten, dass es nicht genutzt wird.
- Empfohlen: Dependency entfernen, falls nicht benötigt, um Review-Fragen zu vermeiden.

### 6. Kamera-Berechtigung
- `NSCameraUsageDescription` muss präzise erklären, warum die Kamera verwendet wird (QR-Code-Scan für Peer-Logging).
- Berechtigung darf nicht beim App-Start, sondern erst beim ersten QR-Scan angefragt werden.

---

## Technical Decisions

### App-Konfiguration: `app.json` vs. `app.config.ts`
Empfehlung: `app.json` beibehalten, aber für dynamische Werte (Build-Nummer aus Umgebung) optional `app.config.ts` einführen. Für den Launch ist `app.json` ausreichend, solange `eas.json` `autoIncrement` verwendet.

### EAS Build & Submit
- `eas.json` Production-Profil um `autoIncrement` erweitern.
- Credentials über EAS CLI generieren (`eas credentials`).
- Submission via `eas submit` oder manueller Upload des `.ipa` in Transporter/App Store Connect.

### Backend Production Readiness
- Supabase Production-Projekt muss konfiguriert sein.
- `EXPO_PUBLIC_SUPABASE_URL` und `EXPO_PUBLIC_SUPABASE_ANON_KEY` müssen in EAS Secrets hinterlegt sein (nicht im Repo).
- RLS muss aktiviert sein (laut Projektstatus bereits erledigt).

### Analytics & Tracking
- Keine Third-Party-Analytics aktuell aktiv.
- Empfehlung: Keine Analytics für v1.0, um ATT zu vermeiden.

---

## Success Criteria

1. Apple Developer Program ist aktiv.
2. `eas build --platform ios --profile production` erzeugt erfolgreich ein `.ipa`.
3. Build lässt sich in TestFlight installieren und starten.
4. App Store Connect Store Listing ist vollständig ausgefüllt.
5. Datenschutzerklärung und AGB sind veröffentlicht und verlinkt.
6. App Store Review wurde eingereicht.
7. Keine Blocker durch Privacy Manifest, ATT oder Alkohol-Content.

---

## Out of Scope

- Android Play Store Launch (separater Plan möglich)
- Backend Feature-Entwicklung (nur Production-Readiness)
- Marketing-Kampagne außerhalb App Store
- Mehrsprachige Lokalisierung (optional, aber nicht blockierend)

---

*Spec erstellt am 2026-07-03*
