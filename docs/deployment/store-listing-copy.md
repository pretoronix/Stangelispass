# Stängelispass — App Store Listing Copy (v1.0.0)

Stand: 2026-08-16. Primärsprache **Deutsch (DE)**, Primärmarkt DACH.
Platzhalter `<DOMAIN>` = final gehostete Vercel-Domain der Legal-Seiten (WS-D).

---

## App Name (max. 30 Zeichen)

```
Stängelispass
```
(13 Zeichen)

## Subtitle (max. 30 Zeichen)

```
Bier tracken mit der Gruppe
```
(27 Zeichen)

## Keywords (max. 100 Zeichen, kommagetrennt, keine Leerzeichen)

```
bier,stängeli,runde,trinken,party,rangliste,gruppe,event,zähler,prost,wer zahlt,stammtisch
```
(90 Zeichen)

Hinweise: App-Name und Subtitle werden von Apple bereits indexiert — keine Wörter
daraus in den Keywords wiederholen. Keine Markennamen Dritter.

## Promotional Text (max. 170 Zeichen, jederzeit ohne Review änderbar)

```
Neu: Live-Rangliste, «Wer zahlt?»-Randomizer und Wall of Fame. Tracke eure Runden gemeinsam — in Echtzeit, ohne Anmeldung.
```
(122 Zeichen)

## Description (max. 4000 Zeichen)

```
Stängelispass ist die App für Gruppen, die ihre gemeinsamen Runden dokumentieren
und spielerisch verwalten wollen — beim Stammtisch, am Fest oder im Vereinslokal.

FUNKTIONEN

• Live-Rangliste — jedes Event hat eine Rangliste, die sich in Echtzeit aktualisiert.
• «Wer zahlt?» — Randomizer für die nächste Runde. Rein zum Spass, kein Einsatz, kein Gewinn.
• QR-Code-Logging — scanne den Code einer anderen Person und trage ihr ein Getränk ein.
• Wall of Fame — legendäre Abende und Bestleistungen bleiben erhalten.
• Kommentare — Live-Updates zu jedem Event.
• Kostenübersicht — behaltet im Blick, was die Runde gekostet hat.
• Event-Verwaltung — Events anlegen, Mitglieder einladen, Preise pro Getränk hinterlegen.

OHNE ANMELDUNG

Stängelispass braucht kein Benutzerkonto, keine E-Mail-Adresse und kein Passwort.
Profile werden direkt in der Gruppe angelegt und auf dem Gerät ausgewählt.

KEINE WERBUNG, KEIN TRACKING

Keine Werbung, keine Analytics-Dritt-SDKs, kein App-Tracking über andere Apps hinweg.
In dieser Version gibt es keine In-App-Käufe.

VERANTWORTUNG

Stängelispass fördert keinen übermässigen Alkoholkonsum. Die App ist für Personen ab
17 Jahren bzw. dem gesetzlichen Mindestalter für Alkoholkonsum im jeweiligen Land
bestimmt. Bitte geniesse Alkohol verantwortungsvoll. Die angezeigten Werte —
inklusive Promille-Schätzungen — sind Unterhaltung und keine medizinische Aussage.
Fahre niemals unter Alkoholeinfluss.
```

## What's New (v1.0.0)

```
Erste Version von Stängelispass.

• Live-Rangliste pro Event
• «Wer zahlt?»-Randomizer
• QR-Code-Logging für andere Teilnehmende
• Wall of Fame und Event-Historie
• Kommentare mit Live-Updates
```

## URLs

| Feld | Wert |
| --- | --- |
| Support URL (Pflicht) | `https://<DOMAIN>/support` |
| Marketing URL (optional) | `https://<DOMAIN>/` |
| Privacy Policy URL (Pflicht) | `https://<DOMAIN>/privacy` |
| Nutzungsbedingungen (EULA, optional) | `https://<DOMAIN>/terms` |

Quelle der Seiten: `web/legal/` (Vercel-Deploy, WS-D). Nach dem Deploy `<DOMAIN>`
hier und in App Store Connect ersetzen.

---

## Altersfreigabe (Age Rating Fragebogen)

Ziel: **17+** (bzw. 18+ in Regionen mit entsprechender Einstufung).

| Frage | Antwort |
| --- | --- |
| Alkohol, Tabak oder Drogen — Konsum oder Bezugnahme | **Häufig/Intensiv** |
| Realistische Gewalt | Keine |
| Sexuelle Inhalte / Nacktheit | Keine |
| Schimpfwörter / vulgärer Humor | Keine |
| Horror-/Angstthemen | Keine |
| Simuliertes Glücksspiel | **Keine** — «Wer zahlt?» ist ein Randomizer ohne Einsatz und ohne Gewinn |
| Glücksspiel um echtes Geld | Nein |
| Unbeschränkter Web-Zugriff | Nein |
| Nutzergenerierte Inhalte | Ja — Kommentare und Profilnamen innerhalb der Gruppe |
| Kontakt-/Standortweitergabe an Dritte | Nein |

Da nutzergenerierte Inhalte vorhanden sind: Moderationshinweis in den Review-Notes
(Kommentare sind nur innerhalb einer privaten Event-Gruppe sichtbar, kein öffentlicher Feed).

## Privacy Nutrition Labels (App Privacy)

Muss konsistent zu `app/PrivacyInfo.xcprivacy` sein. Für alle Einträge gilt:
**Nicht zum Tracking verwendet**, **mit Nutzer verknüpft**, Zweck **App-Funktionalität**.

| Kategorie | Datentyp | Begründung |
| --- | --- | --- |
| Identifiers | User ID | Profil-/Mitglieds-ID in Supabase |
| Identifiers | Device ID | Push-Token (`device_tokens`) für Event-Benachrichtigungen |
| Contact Info | Name | frei gewählter Anzeigename des Profils |
| Health & Fitness | Health | Körpergewicht/Geschlecht für die Promille-Schätzung, Getränkezählung |
| User Content | Other User Content | Kommentare zu Events |

Nicht erhoben: E-Mail-Adresse, Telefonnummer, Adresse, Standort, Kontakte, Fotos,
Zahlungsdaten, Such-/Browserverlauf, Werbedaten, Diagnose-/Absturzdaten Dritter.
Kein Data Broker, kein Advertising SDK, **kein App Tracking (ATT entfällt)**.

---

## Screenshots

Erforderlich (iPhone only — `supportsTablet: false`, **keine iPad-Screenshots**):

| Gerätegrösse | Auflösung (Portrait) | Anzahl |
| --- | --- | --- |
| 6.9" (iPhone 16 Pro Max) | 1320 × 2868 px | 3–5 |
| 6.5" (iPhone 11 Pro Max / XS Max) | 1242 × 2688 px | 3–5 |

Apple skaliert 6.9" auf kleinere Grössen herunter; 6.5" wird separat hochgeladen,
weil das Seitenverhältnis abweicht.

Szenen (Reihenfolge = Reihenfolge im Store):

1. **Event-Übersicht mit Live-Rangliste** — Kernnutzen sofort sichtbar.
2. **Bier eintragen** — der Ein-Tipp-Flow.
3. **«Wer zahlt?»-Randomizer** — das Spielelement.
4. **Wall of Fame** — Wiederkehr-Motivation.
5. **Kommentare / Live-Updates** — der soziale Teil.

Regeln: echte UI (keine Mockup-Rahmen mit Gerätebildern anderer Hersteller), Text
auf Deutsch, keine Preise/Angebote im Bild, keine erfundenen Auszeichnungen.

## App Icon

- 1024 × 1024 px, PNG, **ohne Alpha-Kanal** (Transparenz führt zur Ablehnung)
- keine eigenen Rundungen — Apple maskiert automatisch
- Quelle: `app/assets/source/` + `app/scripts/generate-assets.mjs` (reproduzierbar)

## App Preview (optional, v1.0 nicht geplant)

- 15–30 s, Aufnahme direkt vom Gerät, Auflösung passend zur Gerätegrösse

---

## Review Notes (App Store Connect → App Review Information)

```
Stängelispass is a social drink-tracking app for adults in German-speaking markets
(primary language: German).

DEMO ACCOUNT: not required. The app has no sign-up, no login and no authentication.
On first launch the user creates or picks a local profile inside the app; all
features are reachable immediately without credentials.

HOW TO TEST
1. Launch the app, tap "Add User" in Settings and create a profile.
2. Create an event, then log a drink from the home screen.
3. Open the event leaderboard to see live updates.
4. "Who Pays?" picks a random member of the event — no wager, no prize, no money.

NOTES
- No in-app purchases are active in this version. Event passes are planned for a
  future release; all purchase UI is disabled behind a feature flag.
- No third-party analytics, no advertising SDKs, no cross-app tracking. The app
  does not request App Tracking Transparency permission.
- Camera access is requested only when the user opens the QR scanner to log a
  drink for another participant. No photo or video is recorded or stored.
- Photo library access (add-only) is requested only when the user chooses
  "Save to Photos" in the share sheet for an event share card.
- Push notifications are used for event updates (new round, leaderboard changes).
- User-generated content (comments, profile names) is visible only to members of
  the same private event. There is no public feed. Members can be removed by the
  event admin.
- The blood-alcohol estimate is an entertainment feature based on the
  Widmark formula and is labelled as non-medical inside the app.
- Age rating 17+ due to alcohol references. The app footer states the age
  restriction and a responsible-drinking notice.
```

## Häufige Review-Rückfragen

**Warum braucht die App Kamerazugriff?**
Ausschliesslich zum Scannen eines QR-Codes, um einer anderen Person ein Getränk
einzutragen. Die Berechtigung wird erst beim Öffnen des Scanners abgefragt.

**Ist «Wer zahlt?» Glücksspiel?**
Nein. Es wird zufällig eine Person aus dem Event ausgewählt, die die nächste Runde
übernimmt. Kein Einsatz, kein Geldgewinn, keine Auszahlung.

**Fördert die App übermässigen Alkoholkonsum?**
Nein. Sie dokumentiert den Konsum einer Gruppe und weist in App, AGB und Store-Text
auf Verantwortung und Altersgrenze hin.

**Warum gibt es keine Kontolöschung in der App?**
Guideline 5.1.1(v) greift bei Accounts mit Registrierung. Stängelispass legt keine
Accounts an (keine Registrierung, keine Authentifizierung, keine E-Mail/Passwort).
Event-Admins können Mitglieder aus einem Event entfernen, lokale Daten lassen sich
über «Cache & Storage» → «Clear Cache» löschen. Löschung eines Profils samt
zugehöriger Einträge auf Anfrage über die Support-URL.

---

## Checkliste vor dem Einreichen

- [ ] `<DOMAIN>` überall durch die echte Vercel-Domain ersetzt (hier + ASC)
- [ ] Privacy-, Support- und Terms-URL öffentlich erreichbar (200, kein Login)
- [ ] Screenshots 6.9" und 6.5" hochgeladen, kein iPad-Set
- [ ] Icon 1024×1024 ohne Alpha geprüft
- [ ] Altersfreigabe-Fragebogen wie oben beantwortet → 17+
- [ ] Nutrition Labels identisch zu `PrivacyInfo.xcprivacy`
- [ ] Review Notes eingefügt (Demo-Account-Hinweis!)
- [ ] Export-Compliance: `ITSAppUsesNonExemptEncryption: false` bereits in `app.json`
