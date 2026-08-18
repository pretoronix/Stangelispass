# Stängelispass — App Store Connect Listing (v1.0.0)

> Copy-paste-fertige Metadaten für die Erstauslieferung.
> Primärsprache: **Deutsch (Deutschland)**, Zielmärkte DACH (DE/AT/CH).
> Stand: v1.0.0, `app.json` → `version: 1.0.0`, `bundleIdentifier: com.stangelispass.app`.
>
> **Wichtig:** In-App-Käufe / Event-Pässe sind in v1.0 deaktiviert
> (`IAP_ENABLED = false` in `app/src/services/iap.ts`). Sie kommen in **keinem**
> Listing-Text, Screenshot oder Review-Hinweis vor.
> iPad wird nicht unterstützt (`supportsTablet: false`) — **keine iPad-Screenshots hochladen.**
>
> ⚠️ **Sprach-Diskrepanz (am Code verifiziert):** Die App-UI ist derzeit **englisch**
> (`Legends Gallery`, `Who Pays?`, `Manage Users`, Badge-Namen `Hat Trick`, `Night Owl`, …),
> das Listing hier ist deutsch. Das ist kein Ablehnungsgrund, wirkt im Store aber
> inkonsistent. Zwei saubere Optionen vor dem Submit:
> **(a)** UI-Strings auf Deutsch ziehen und die Captions unten 1:1 verwenden, oder
> **(b)** Screenshot-Captions auf Deutsch lassen (verkaufen), aber akzeptieren, dass
> die Screens englisch sind. Empfehlung: (a), zumindest für die Screens, die in den
> Screenshots landen.

---

## 1. App-Name & Subtitle

### App Name (max. 30 Zeichen)

```
Stängelispass
```

**13 Zeichen** ✅

### Subtitle (max. 30 Zeichen)

```
Biertracker für deine Crew
```

**26 Zeichen** ✅

Alternativen (falls der Name schon vergeben ist bzw. A/B-Test gewünscht):

| Variante | Zeichen |
| --- | --- |
| `Biertracker für deine Crew` | 26 |
| `Runden tracken mit Freunden` | 27 |
| `Biere zählen im Freundeskreis` | 29 |

---

## 2. Keywords (max. 100 Zeichen)

```
bier,trinken,rangliste,freunde,gruppe,party,runde,zählen,statistik,promille,event,stammtisch,qr
```

**95 Zeichen** ✅

Regeln, die hier eingehalten sind:
- Kommasepariert **ohne** Leerzeichen (Leerzeichen zählen als Zeichen und bringen kein Ranking).
- Keine Wiederholung von Wörtern aus Name (`Stängelispass`) oder Subtitle
  (`Biertracker`, `für`, `deine`, `Crew`) — Apple indexiert diese Felder bereits.
- Kein Plural, wenn der Singular reicht (Apple matcht Wortstämme).
- Keine Markennamen Dritter, keine Wettbewerberbegriffe.

Reserve-Keywords für spätere Iterationen (falls Ranking-Optimierung nötig):
`saufen`, `oktoberfest`, `wgleben`, `bestenliste`, `apero`, `feierabend`, `promillerechner`.

---

## 3. Description (max. 4000 Zeichen)

> Zeichenzahl der folgenden Fassung: **ca. 2.480 Zeichen** ✅ (Limit 4000)

```
Stängelispass macht aus dem gemeinsamen Feierabendbier ein Spiel: Wer hat heute
die Nase vorn, wer schuldet der Runde noch was – und wer war der Held des Abends?

BIER LOGGEN IN ZWEI SEKUNDEN
Ein Tipp, und das Bier ist eingetragen. Kein Formular, kein Login, keine Hürde.
Wer will, ergänzt Sorte und Preis für die Kostenübersicht.

QR-CODE STATT DISKUSSION
Jede Person hat ihren eigenen QR-Code. Einmal scannen und der Eintrag landet beim
richtigen Namen – auch wenn nur ein Handy am Tisch liegt. Die Kamera wird
ausschliesslich zum Scannen genutzt, es werden keine Fotos gespeichert.

EVENTS UND RUNDEN
Startet eine Runde für den Abend, das Grillfest oder das Turnier. Alle Einträge,
Statistiken und Ranglisten laufen sauber getrennt pro Event.

LIVE-RANGLISTE
Die Bestenliste aktualisiert sich in Echtzeit auf allen Geräten. Tempo,
Gesamtzahl und Platzierung immer im Blick.

KOMMENTARE
Jeder Eintrag lässt sich kommentieren. Die Sprüche vom Abend bleiben da, wo sie
hingehören: beim Beweisstück.

WER ZAHLT?
Ein Tipp, und die App würfelt aus, wer die nächste Runde übernimmt. Rein zum
Spass — es wird kein Geld eingesetzt und keine Zahlung abgewickelt.

KOSTENÜBERSICHT
Wenn ihr Preise mitschreibt, seht ihr pro Event, was zusammengekommen ist. Die
Zahlen tippt ihr selbst ein, die App wickelt nichts ab.

AUSZEICHNUNGEN
Hat Trick, Early Bird, Night Owl, Century Club und mehr. Abzeichen für alle, die
Statistik ernster nehmen als nötig.

HALL OF FAME
Am Ende jeder Runde wird der MVP gekürt und in die Legenden-Liste aufgenommen.
Die Rekorde bleiben, auch wenn der Abend vorbei ist.

SHARECARDS
Ergebnisse als Bild teilen – für die Gruppenchat-Nachbesprechung am nächsten
Morgen.

PUSH-BENACHRICHTIGUNGEN
Wenn dich jemand überholt, ein Kommentar reinkommt oder eine Runde endet.

DEIN PROFIL
Persönliche Statistiken, verdiente Abzeichen und – wenn du Gewicht und
Geschlecht hinterlegst – eine grobe Promille-Schätzung nach der
Widmark-Formel inklusive Hinweis, ob Fahren tabu ist.

--------------------------------

VERANTWORTUNG

Stängelispass ist eine Spass- und Protokoll-App für Erwachsene. Sie verkauft
keinen Alkohol, vermittelt keine Bestellungen und fordert niemanden zum
Übermässigen Trinken auf.

Die Promille-Anzeige ist eine grobe Schätzung auf Basis der Widmark-Formel und
ersetzt KEIN Messgerät. Verlasse dich niemals darauf, um zu entscheiden, ob du
fahren kannst. Im Zweifel: Fahrzeug stehen lassen.

Nutzung ab 18 Jahren. Bitte trinke verantwortungsvoll.
```

> **Formatierungshinweis:** App Store Connect zeigt reinen Text mit Zeilenumbrüchen.
> Keine Emojis in der Description verwenden (Apple lehnt Emoji-Überladung gelegentlich ab),
> Grossbuchstaben-Zwischenüberschriften sind erlaubt und funktionieren gut als visuelle Trennung.

### Kürzestfassung (falls Localizations gekürzt werden müssen, ~490 Zeichen)

```
Stängelispass macht aus dem Feierabendbier ein Spiel. Bier mit einem Tipp
eintragen, per QR-Code auch für Freunde, alles sauber getrennt nach Event.
Live-Rangliste, Kommentare zu jedem Eintrag, Abzeichen, MVP-Kürung und eine
Hall of Fame für legendäre Abende. Ergebnisse als Sharecard teilen.

Kein Login nötig. Kein Alkoholverkauf, keine Vermittlung. Die optionale
Promille-Schätzung ist nur ein Richtwert und ersetzt kein Messgerät.

Ab 18 Jahren. Bitte trinke verantwortungsvoll.
```

---

## 4. Promotional Text (max. 170 Zeichen)

```
Wer trinkt heute am schnellsten? Bier per Tipp oder QR-Code eintragen, Live-Rangliste checken, MVP küren. Ab 18 – und bitte verantwortungsvoll.
```

**143 Zeichen** ✅

> Der Promotional Text lässt sich **ohne neues Review** jederzeit ändern —
> gut für Saison-Aktionen (Oktoberfest, Feierabend-Kampagnen).

---

## 5. What's New in This Version (v1.0.0)

```
Willkommen bei Stängelispass – die erste Version ist da.

• Bier mit einem Tipp eintragen, optional mit Sorte und Preis
• QR-Codes, um Freunden am selben Tisch ein Bier einzutragen
• Events und Runden mit getrennter Zählung
• Live-Rangliste, die sich in Echtzeit auf allen Geräten aktualisiert
• Kommentare zu jedem einzelnen Eintrag
• Abzeichen, MVP-Kürung und Hall of Fame
• Sharecards für den Gruppenchat
• Push-Benachrichtigungen bei Überholmanövern und Rundenende
• Optionale Promille-Schätzung im Profil (Richtwert, kein Messgerät)

Feedback willkommen – schreib uns über die Support-Seite.
```

---

## 6. URLs — **Platzhalter, vom Menschen zu füllen**

Die Domain steht noch nicht fest. Die Legal-Seiten liegen unter `web/legal/` und
werden auf Vercel deployt; die Routen sind bereits fix.

| Feld in ASC | Wert | Pflicht | Status |
| --- | --- | --- | --- |
| Support URL | `https://<TODO-DOMAIN>/support` | ✅ Pflicht | ⛔ Domain fehlt |
| Marketing URL | `https://<TODO-DOMAIN>` | optional | ⛔ Domain fehlt |
| Privacy Policy URL | `https://<TODO-DOMAIN>/privacy` | ✅ Pflicht | ⛔ Domain fehlt |
| AGB / Terms (EULA-Ersatz, App-Beschreibung) | `https://<TODO-DOMAIN>/terms` | optional | ⛔ Domain fehlt |
| Impressum (DACH-Pflicht, in Support-Seite verlinken) | `https://<TODO-DOMAIN>/imprint` | rechtlich empfohlen | ⛔ Domain fehlt |

**Checkliste vor Submit:**
1. Domain registrieren und in Vercel als Production-Domain verbinden.
2. Alle vier Routen im Browser öffnen und auf HTTP 200 prüfen (`/privacy`, `/terms`, `/imprint`, `/support`).
3. Routen müssen **ohne Login** und **ohne Redirect auf einen App-Store-Link** erreichbar sein — Apple lehnt sonst ab.
4. `<TODO-DOMAIN>` in diesem Dokument, in `app.json` (falls dort verlinkt) und in der In-App-Settings-Verlinkung ersetzen.

---

## 7. Screenshot-Spezifikation

### Pflichtgrössen (nur iPhone — **kein iPad**, `supportsTablet: false`)

| Slot | Auflösung (Portrait) | Referenzgerät zum Aufnehmen | Anzahl |
| --- | --- | --- | --- |
| iPhone 6.9" | **1320 × 2868 px** | iPhone 16 Pro Max / 17 Pro Max Simulator | 5 |
| iPhone 6.5" | **1242 × 2688 px** | iPhone 11 Pro Max / XS Max Simulator | 5 |

- Farbraum sRGB, 72 dpi, PNG oder JPG, **kein Alphakanal**.
- Reihenfolge in ASC = Reihenfolge unten. Screenshot 1 ist der wichtigste (wird in Suchergebnissen gezeigt).
- Statusleiste: sauber halten (voller Akku, volles Signal, Uhrzeit `09:41`) — siehe Aufnahme-Anleitung.

### Testdaten-Setup (einmalig, gilt für alle Screenshots)

Vor der Aufnahme im Simulator anlegen (Settings → Nutzerverwaltung):

- **5 Nutzer:** `Lena`, `Jonas`, `Mira`, `Timo`, `Fabi` — je ein Avatar/Emoji setzen.
- **1 aktives Event:** Name `Grillabend bei Timo`, gestartet vor ~3 Stunden.
- **Beer-Log:** Lena 7, Jonas 6, Mira 4, Timo 3, Fabi 2 Biere, Zeitstempel über die
  letzten 3 Stunden verteilt (nicht alle in derselben Minute — sonst wirkt die Velocity-Anzeige tot).
- **Kommentare:** mindestens 3 Kommentare an unterschiedlichen Einträgen, kurze
  Texte ohne echte Namen Dritter, z. B. „Das war ein Halbes, zählt nicht!", „Rekordverdächtig", „Beweisfoto fehlt".
- **Abzeichen:** so loggen, dass `Hat Trick` (3 Biere in unter 1 Stunde) und
  `Early Bird` (Eintrag vor 18:00) bei Lena freigeschaltet sind.
- **Hall of Fame:** mindestens ein abgeschlossenes Vor-Event mit gekürtem MVP,
  damit der Legends-Screen nicht leer ist.
- **Profil-Physiologie:** Gewicht 72 kg, Geschlecht gesetzt — sonst zeigt die
  Promille-Karte nur Defaultwerte.

⚠️ Keine echten Personennamen, keine echten Fotos, keine Preise in Fremdwährung
mit realen Lokalnamen. Keine Screenshots von Kaufflächen (IAP ist deaktiviert).

### Die 5 Screens

#### Screenshot 1 — Live-Rangliste (Home)
- **App-Screen:** `app/src/app/index.tsx` (Home mit aktivem Event + Leaderboard)
- **Testdaten:** aktives Event `Grillabend bei Timo`, 5 Nutzer mit obiger Verteilung, Lena auf Platz 1
- **Caption (Overlay):** `Wer führt gerade?`
- **Subcaption:** `Live-Rangliste, die sich bei jedem Bier aktualisiert.`

#### Screenshot 2 — Bier eintragen
- **App-Screen:** `app/src/app/add.tsx` (Nutzer-Grid + ausgewählte Person)
- **Testdaten:** `Jonas` ausgewählt, Sorte und Preis ausgefüllt, Button aktiv
- **Caption:** `Ein Tipp. Eingetragen.`
- **Subcaption:** `Sorte und Preis optional — für die Kostenübersicht.`

#### Screenshot 3 — QR-Code fürs Peer-Logging
- **App-Screen:** QR-Modal aus `app/src/app/add.tsx` → `components/features/QRGenerator.tsx` / `components/add/AddQrModal.tsx`
- **Testdaten:** `Mira` ausgewählt, QR-Modus `log`, QR sichtbar gerendert
- **Caption:** `Ein Handy reicht.`
- **Subcaption:** `QR scannen und das Bier landet beim richtigen Namen.`

#### Screenshot 4 — Profil mit Abzeichen
- **App-Screen:** `app/src/app/profile.tsx` (`ProfileHeader`, `ProfileStats`, `ProfileAchievements`)
- **Testdaten:** `Lena` aktiv, mindestens 2 freigeschaltete Abzeichen sichtbar, Lifetime-Zähler > 50
- **Caption:** `Deine Bilanz.`
- **Subcaption:** `Statistiken und Abzeichen, die niemand gebraucht hat — aber alle wollen.`
- ⚠️ Promille-Karte (`ProfileBACCard`) **nicht** als Verkaufsargument gross ins Bild rücken.
  Falls sie sichtbar ist: einen niedrigen, unkritischen Wert zeigen und den Disclaimer-Text im Frame lassen.

#### Screenshot 5 — Hall of Fame / Legends
- **App-Screen:** `app/src/app/legends.tsx` (`components/features/WallOfFame.tsx`)
- **Testdaten:** mindestens 3 abgeschlossene Events mit gekürten MVPs
- **Caption:** `Legenden vergisst man nicht.`
- **Subcaption:** `Nach jeder Runde wird der MVP gekürt.`

**Optionaler Reserve-Screen** (falls einer der obigen leer/hässlich wirkt):
Kommentar-Ansicht (`components/features/BeerLogItemWithComments.tsx` / `CommentsList.tsx`)
mit Caption `Die Sprüche bleiben beim Beweisstück.`

### Aufnahme-Anleitung (abarbeitbar)

1. Simulator starten:
   `xcrun simctl boot "iPhone 16 Pro Max"` (6.9") bzw. `"iPhone 11 Pro Max"` (6.5").
2. Statusleiste normieren (pro Simulator einmal, vor jedem Screenshot wiederholen, falls sie zurückspringt):
   ```
   xcrun simctl status_bar booted override --time "09:41" --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3
   ```
3. App im Release-ähnlichen Modus starten (kein Expo-Dev-Overlay, kein LogBox-Banner):
   ```
   npx expo start --no-dev --minify
   ```
   Dev-Menü und Fast-Refresh-Banner müssen aus sein.
4. Testdaten wie oben anlegen. Danach einmal die App neu starten, damit keine
   Toasts/Modals mehr offen sind.
5. Zum Screen navigieren, kurz warten bis Animationen ausgelaufen sind, dann:
   ```
   xcrun simctl io booted screenshot ~/Desktop/shots/6.9/01-leaderboard.png
   ```
   Dateinamen `01`…`05` verwenden — ASC übernimmt die Sortierung nicht automatisch.
6. Auflösung verifizieren:
   ```
   sips -g pixelWidth -g pixelHeight ~/Desktop/shots/6.9/*.png
   ```
   Muss exakt `1320 × 2868` bzw. `1242 × 2688` ergeben. Abweichung → falscher Simulator.
7. Alphakanal entfernen (Apple lehnt PNGs mit Alpha ab):
   ```
   sips -s format jpeg -s formatOptions 95 ~/Desktop/shots/6.9/01-leaderboard.png --out 01-leaderboard.jpg
   ```
8. Captions als Overlay setzen (Figma/Sketch-Template oder Fastlane `frameit`).
   Textgrösse so wählen, dass sie in der Store-Vorschau (ca. 1/3 Grösse) noch lesbar ist.
9. Alle 5 Screens für **beide** Grössen wiederholen. Gleiche Testdaten, gleiche
   Reihenfolge, gleiche Captions — sonst wirkt das Listing inkonsistent.
10. In ASC hochladen: `App Store` → `iOS App 1.0.0` → `App Previews and Screenshots`
    → Tab `iPhone 6.9" Display` und `iPhone 6.5" Display`. **iPad-Tabs leer lassen.**

### App Icon
- 1024 × 1024 px, PNG, **kein Alphakanal**, keine Transparenz, keine abgerundeten Ecken
  (Apple rundet selbst), keine Store-Badges oder „Neu"-Sticker im Icon.

### App Preview Video (optional, für v1.0 nicht nötig)
- 15–30 Sekunden, gleiche Zielauflösungen, nur echtes App-Material (kein Renderfilm).
- Falls doch gedreht: keine Szene, die Trinkgeschwindigkeit glorifiziert.

---

## 8. App Review Information (Review-Notes)

### Kontaktdaten — **Platzhalter, vom Menschen zu füllen**

| Feld | Wert |
| --- | --- |
| First name / Last name | `<TODO>` |
| Phone number | `<TODO, inkl. Ländervorwahl>` |
| Email | `<TODO>` |

### Sign-in required?

Die App hat **keinen Login und keine Kontoerstellung** — Nutzerprofile werden lokal
im Gerät ausgewählt bzw. angelegt (kein Supabase-Auth-Flow im Code auffindbar,
`app/src/services/client.ts` nutzt den anonymen Client).

→ In ASC den Haken bei **„Sign-in required" auf NEIN** setzen.

Falls die Review-Abteilung dennoch Zugangsdaten verlangt, diesen Platzhalter füllen:

| Feld | Wert |
| --- | --- |
| Demo-Benutzername | `<TODO — nur ausfüllen, falls Apple nachfragt>` |
| Demo-Passwort | `<TODO>` |
| Demo-Event-Code | `<TODO>` |

### Notes (Feld „Notes" in ASC — englischer Text zum Kopieren)

```
ABOUT THE APP

Stängelispass is a social beer-logging app for adults in the German-speaking
market (DE/AT/CH). Groups of friends record the beers they drink during an
event, see a live leaderboard, comment on entries, and crown an MVP at the end
of a round.

NO ACCOUNT NEEDED
There is no sign-up or login. On first launch the reviewer creates one or more
local profiles (Settings -> add user). No email, phone number, or password is
required.

NO ALCOHOL IS SOLD
The app does NOT sell, deliver, or facilitate the purchase of alcohol. There is
no shop, no ordering, no delivery partner, and no affiliate link to any vendor.
It only records what users say they drank, for entertainment among friends. The
optional price field is a manual, user-entered number used to split a bill
inside the group; no payment is processed.

NO GAMBLING
The "Who Pays?" button picks a random participant to buy the next round. It is a
social gag: nothing is staked, nothing is won, nothing is paid out, and the app
processes no payments of any kind. The optional per-beer price is a number the
user types in so the group can split a bill among themselves.

NO IN-APP PURCHASES IN THIS VERSION
Version 1.0.0 ships with in-app purchases disabled by a build flag. There is no
purchase entry point, no paywall, and no StoreKit call reachable at runtime.

HOW TO TEST THE QR SCANNING FEATURE WITH A SINGLE DEVICE

The QR feature lets one person log a beer for another person sitting at the
same table. It can be fully tested with one device only:

1. Open Settings and create two local profiles, e.g. "Reviewer A" and
   "Reviewer B".
2. On the Home screen, start a round/event.
3. Go to the "Add" tab, select "Reviewer B", and tap the QR button. The app
   renders that user's QR code on screen.
4. Tap "Share" in the QR dialog and send the generated PNG to any second
   screen you have available - AirDrop to a Mac, save to Photos and open it on
   a laptop, or simply print it. The QR code is a static image; no network
   connection is needed to display it.
5. Return to the Home screen and tap the scan icon. iOS will ask for camera
   permission (this is the only place the camera is used - no photo or video is
   ever captured or stored).
6. Point the camera at the QR code shown on the second screen. The beer is
   logged for "Reviewer B" and appears immediately in the leaderboard.

If no second screen is available at all, the QR path is not required to
evaluate the app: the same action is available without the camera by selecting
a user in the "Add" tab and tapping the log button directly. The QR code is a
convenience shortcut, not a gate to any functionality.

CAMERA PERMISSION
Requested only when the scan screen is opened, never at launch. Purpose string
is declared in Info.plist (NSCameraUsageDescription).

BLOOD ALCOHOL ESTIMATE
The profile screen can show a rough blood alcohol estimate based on the Widmark
formula, using weight and gender that the user enters voluntarily. It is
labelled inside the app as an estimate that must not be used to decide whether
to drive. The app never encourages driving after drinking.

AGE
The app is rated for adults only and carries in-app responsible-drinking
messaging.

PRIVACY
No third-party advertising SDKs, no analytics SDKs, and no tracking across apps
or websites. The only backend is Supabase, used to sync a group's own entries.
```

### Häufige Rückfragen der Review-Abteilung — vorbereitete Antworten

**Q: Verkauft, vermittelt oder bewirbt die App Alkohol?**
A: Nein. Es gibt keinen Shop, keine Bestellung, keine Lieferung, keinen Händler-Link
und keine Affiliate-Verknüpfung. Die App protokolliert ausschliesslich vom Nutzer
selbst eingegebene Konsumdaten innerhalb einer privaten Gruppe.

**Q: Warum braucht die App Kamerazugriff?**
A: Ausschliesslich zum Scannen von QR-Codes beim Peer-Logging. Der Zugriff wird erst
beim Öffnen des Scanners angefragt, nicht beim App-Start. Es werden keine Fotos
oder Videos aufgenommen oder gespeichert (siehe `NSCameraUsageDescription` in `app.json`).

**Q: Ist die „Wer zahlt?"-/MVP-Funktion Glücksspiel?**
A: Nein. Es wird kein echtes Geld eingesetzt, gewonnen oder ausgezahlt. Der optionale
Preis pro Bier ist eine manuell eingegebene Zahl, die nur zur Aufteilung einer
Zeche innerhalb der Gruppe angezeigt wird. Es findet keine Zahlungsabwicklung statt.

**Q: Fördert die App übermässigen Alkoholkonsum?**
A: Nein. Die App dokumentiert Konsum und enthält Hinweise zu verantwortungsvollem
Trinken sowie einen expliziten Nicht-Fahren-Hinweis. Sie gibt keine Trinkziele vor,
setzt keine Mindestmengen und belohnt keine Geschwindigkeit mit realen Vorteilen.

**Q: Warum werden Gesundheitsdaten (Gewicht, Geschlecht) erhoben?**
A: Rein optional und nur, um die Promille-Schätzung zu berechnen. Ohne Eingabe
funktioniert die App vollständig; es wird dann ein generischer Defaultwert benutzt.
Es erfolgt keine Verknüpfung mit HealthKit und keine Weitergabe an Dritte.

**Q: Gibt es In-App-Käufe?**
A: In Version 1.0.0 nicht. Die Funktion ist per Build-Flag deaktiviert
(`IAP_ENABLED = false`), es existiert kein erreichbarer Kauf-Einstieg.

---

## 9. Age Rating — ASC-Fragebogen (Ziel: 18+)

Die App soll bewusst in der höchsten Alterskategorie landen. Antworten für den
aktuellen App-Store-Connect-Fragebogen:

| Frage | Antwort | Begründung |
| --- | --- | --- |
| Cartoon or Fantasy Violence | **None** | keine Gewaltdarstellung |
| Realistic Violence | **None** | — |
| Prolonged Graphic or Sadistic Realistic Violence | **None** | — |
| Profanity or Crude Humor | **Infrequent/Mild** | Abzeichen- und UI-Texte sind flapsig, aber nicht vulgär |
| Mature/Suggestive Themes | **Infrequent/Mild** | Partykontext |
| Horror/Fear Themes | **None** | — |
| Medical/Treatment Information | **None** | Promille-Schätzung ist ausdrücklich als Nicht-Medizinprodukt gekennzeichnet |
| **Alcohol, Tobacco, or Drug Use or References** | **Frequent/Intense** | Alkoholkonsum ist das zentrale Thema der App |
| Simulated Gambling | **None** | keine Wetten, kein Einsatz, keine Auszahlung |
| Sexual Content or Nudity | **None** | — |
| Graphic Sexual Content and Nudity | **None** | — |
| Contests | **None** | MVP-Kürung ist rein sozial, kein Preis |

**Zusätzliche Deklarationen:**

| Frage | Antwort |
| --- | --- |
| Unrestricted Web Access | **No** (kein In-App-Browser mit freier URL-Eingabe) |
| Gambling (real money) | **No** |
| Made for Kids | **No** |
| Age Verification / Age Assurance benötigt | **Ja — App richtet sich ausschliesslich an Erwachsene** |

**Ergebnis:** `Frequent/Intense` bei Alkohol führt im aktuellen Apple-Schema zu
**18+** (bzw. `17+` im alten Schema). Das ist das gewünschte Ziel — nicht abmildern.

**Territorien:** Vertrieb auf **DE, AT, CH** beschränken (ASC → Pricing and
Availability). Länder mit Alkoholwerbeverbot (u. a. Saudi-Arabien, VAE, Kuwait,
Katar, Iran, Türkei-Einschränkungen) explizit ausschliessen — sonst drohen
Store-seitige Beanstandungen.

**In-App-Absicherung, die vor dem Submit stehen sollte:** ein Alters-Gate beim
ersten Start (Bestätigung „Ich bin 18 Jahre oder älter"). ⚠️ **Nicht am Code
verifiziert** — vor Submit prüfen und ggf. nachziehen.

---

## 10. App Privacy — Nutrition Labels

Basis: `app/PrivacyInfo.xcprivacy` (geprüft). Dort deklariert:
`UserID`, `DeviceID`, `Name`, `Health`, `OtherUserContent` — alle mit
`Linked = true`, `Tracking = false`, Zweck jeweils `AppFunctionality`.
`NSPrivacyTracking` ist `false`, `NSPrivacyTrackingDomains` ist leer.

**Die ASC-Antworten müssen exakt dazu passen:**

| ASC-Kategorie | Datentyp | Erhoben? | Zweck | Mit Identität verknüpft | Für Tracking | Quelle im Manifest |
| --- | --- | --- | --- | --- | --- | --- |
| Contact Info | **Name** | Ja | App Functionality | **Ja** | Nein | `NSPrivacyCollectedDataTypeName` |
| Contact Info | Email, Phone, Address, Other | Nein | — | — | — | nicht deklariert |
| Health & Fitness | **Health** (Gewicht, Geschlecht für Promille-Schätzung) | Ja | App Functionality | **Ja** | Nein | `NSPrivacyCollectedDataTypeHealth` |
| Identifiers | **User ID** | Ja | App Functionality | **Ja** | Nein | `NSPrivacyCollectedDataTypeUserID` |
| Identifiers | **Device ID** (Push-Token) | Ja | App Functionality | **Ja** | Nein | `NSPrivacyCollectedDataTypeDeviceID` |
| User Content | **Other User Content** (Kommentare, Bier-Einträge, Event-Namen) | Ja | App Functionality | **Ja** | Nein | `NSPrivacyCollectedDataTypeOtherUserContent` |
| Financial Info | — | **Nein** | — | — | — | keine Zahlungsabwicklung, IAP aus |
| Location | — | **Nein** | — | — | — | nicht deklariert |
| Purchases | — | **Nein** | — | — | — | IAP deaktiviert |
| Usage Data | — | **Nein** | — | — | — | keine Analytics-SDKs |
| Diagnostics | — | **Nein** | — | — | — | kein Sentry/Crashlytics/Bugsnag in `app/package.json` gefunden ✅ |
| Search History / Browsing History | — | **Nein** | — | — | — | — |
| Sensitive Info | — | **Nein** | — | — | — | — |
| Contacts | — | **Nein** | — | — | — | — |
| Photos or Videos | — | **Nein** | — | — | — | Kamera nur Live-Scan, kein Speichern |
| Audio Data | — | **Nein** | — | — | — | App spielt Sounds ab, nimmt keine auf |

**Tracking:** In ASC die Frage „Do you or your third-party partners use data for
tracking?" mit **NEIN** beantworten. Konsistent zu `NSPrivacyTracking = false`.
→ **Kein** `App Tracking Transparency`-Prompt, kein `NSUserTrackingUsageDescription`.

**Data Deletion:** ASC fragt, ob Nutzer die Löschung ihres Kontos in der App
anstossen können. Da es kein Konto gibt, ist „Account Creation" mit Nein zu
beantworten; die Löschung lokaler Profile und der Event-Daten muss trotzdem
in der Privacy Policy (`/privacy`) beschrieben sein.

### ⚠️ Vor dem Submit prüfen (nicht am Code verifiziert)

1. **Diagnostics:** In `app/package.json` ist kein Sentry/Crashlytics/Bugsnag/PostHog/
   Amplitude/Firebase enthalten — `Diagnostics: No` ist damit belastbar. Sobald ein
   solches SDK dazukommt, müssen `Crash Data` / `Performance Data` im Nutrition Label
   **und** in `PrivacyInfo.xcprivacy` ergänzt werden.
2. **Health-Kategorie:** Apple prüft die Kategorie `Health` streng. Wenn Gewicht und
   Geschlecht ausschliesslich lokal auf dem Gerät bleiben und **nicht** an Supabase
   gehen, darf `Health` gar nicht als „collected" deklariert werden — dann Manifest
   **und** Nutrition Label anpassen. Serverseitig verifizieren, ob `physiology`
   in Supabase persistiert wird.
3. **Name:** Die App-internen Profilnamen sind frei gewählte Spitznamen. Deklaration
   als `Name` ist die konservative, sichere Variante und wird hier beibehalten.

---

## 11. Kategorien

| Slot | Kategorie | Begründung |
| --- | --- | --- |
| **Primär** | **Social Networking** | Kern der App ist die Gruppeninteraktion: gemeinsame Events, Live-Rangliste über mehrere Geräte, Kommentare, Peer-Logging per QR, Push-Benachrichtigungen zwischen Teilnehmenden. Die Konkurrenz in `Lifestyle` ist deutlich generischer, `Social Networking` beschreibt die tatsächliche Nutzung am präzisesten und passt zur ASO-Erwartung („mit Freunden"). |
| **Sekundär** | **Entertainment** | Die Gamification-Schicht — Abzeichen, MVP-Kürung, Hall of Fame, Sharecards — ist Unterhaltung, kein Utility. |

**Bewusst nicht gewählt:**

- `Health & Fitness` — trotz Promille-Schätzung. Die Kategorie zieht bei Apple
  strengere Prüfung nach sich (Gesundheitsdaten, medizinische Aussagen) und die App
  ist ausdrücklich **kein** Gesundheitsprodukt. Risiko einer Ablehnung ohne Nutzen.
- `Food & Drink` — würde die Erwartung „Rezepte/Bestellen/Restaurantsuche" wecken
  und die Frage aufwerfen, ob Alkohol verkauft wird. Vermeiden.
- `Games` — würde Game-Center-/Gaming-Erwartungen setzen, die die App nicht erfüllt,
  und die Alkohol-Gamification unnötig zuspitzen.
- `Utilities` / `Lifestyle` — zu generisch, schlechte Auffindbarkeit.

---

## 12. Restliche ASC-Pflichtfelder — Kurzreferenz

| Feld | Wert | Status |
| --- | --- | --- |
| Bundle ID | `com.stangelispass.app` | ✅ aus `app.json` |
| Version | `1.0.0` | ✅ aus `app.json` |
| Build (Android `versionCode`-Pendant) | `1` | ✅ |
| SKU | `STANGELISPASS-IOS-001` | Vorschlag, frei wählbar |
| Primärsprache | Deutsch (Deutschland) | ✅ |
| Copyright | `2026 <TODO — Firmenname oder Einzelperson>` | ⛔ offen |
| Content Rights — Third-party content? | **No** | ✅ |
| Export Compliance | Nur Standard-HTTPS/TLS → `ITSAppUsesNonExemptEncryption = false` | ✅ bereits in `app.json` gesetzt |
| Advertising Identifier (IDFA) | **No** | ✅ konsistent zu `NSPrivacyTracking = false` |
| Verfügbarkeit | DE, AT, CH | ⛔ manuell setzen |
| Preis | Kostenlos, keine IAP | ✅ (IAP deaktiviert) |
| Release-Option | Manuell freigeben nach Genehmigung | Empfehlung |

---

## 13. Offene Punkte für den Menschen

- [ ] **Domain festlegen** und `<TODO-DOMAIN>` in Abschnitt 6 ersetzen (4 URLs).
- [ ] Legal-Seiten auf der Live-Domain deployen und alle vier Routen auf HTTP 200 prüfen.
- [ ] Review-Kontaktdaten (Name, Telefon, E-Mail) in Abschnitt 8 eintragen.
- [ ] Copyright-Inhaber in Abschnitt 12 eintragen.
- [ ] Alters-Gate beim ersten Start verifizieren bzw. ergänzen (Abschnitt 9).
- [ ] Klären, ob `physiology` (Gewicht/Geschlecht) serverseitig persistiert wird →
      entscheidet über `Health` im Nutrition Label (Abschnitt 10).
- [ ] Entscheiden, ob die UI vor dem Submit auf Deutsch lokalisiert wird (siehe Warnung ganz oben) —
      betrifft mindestens die 5 Screens, die in den Screenshots landen.
- [ ] Screenshots für **beide** iPhone-Grössen erstellen (Abschnitt 7), iPad-Slots leer lassen.
