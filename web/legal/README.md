# Stängelispass — Legal- und Support-Site

Statische Website mit den öffentlichen Rechts- und Support-Seiten, die Apple für die
App-Store-Einreichung als URL verlangt (Privacy-Policy-URL und Support-URL).

Reines HTML + CSS. Kein Build-Schritt, kein Framework, kein JavaScript, kein externes CDN,
kein Tracking.

## Struktur

```
web/legal/
├── public/
│   ├── index.html      → /
│   ├── privacy.html    → /privacy
│   ├── terms.html      → /terms
│   ├── imprint.html    → /imprint
│   ├── support.html    → /support
│   └── styles.css
├── vercel.json
└── README.md
```

Inhalte stammen wortgetreu aus `docs/legal/privacy-policy.md`, `docs/legal/terms-of-use.md`
und `docs/legal/imprint.md`. Diese Markdown-Dateien bleiben die Quelle — bei Textänderungen
zuerst dort ändern, dann hier nachziehen.

## Lokal ansehen

Kein Build nötig. Entweder Dateien direkt im Browser öffnen (dann greifen die hübschen URLs
nicht, nur `privacy.html` usw.) oder mit einem lokalen Server:

```bash
cd web/legal/public && python3 -m http.server 4000
# → http://localhost:4000/
```

Mit exakt dem Vercel-Routing (inkl. `cleanUrls`):

```bash
cd web/legal && npx vercel dev
```

## Deployen (Vercel)

Der Vercel-Account gehört dem Betreiber; der Deploy ist eine öffentliche Aktion und wird
manuell ausgelöst.

```bash
cd web/legal
npx vercel link          # einmalig: Projekt anlegen/verknüpfen
npx vercel deploy --prod
```

`vercel.json` setzt `outputDirectory: "public"`, `cleanUrls: true` und Security-Header
(CSP `default-src 'none'`, HSTS, `nosniff`, `no-referrer`). Kein Build- oder Install-Command.

Nach dem Deploy in App Store Connect eintragen:

| ASC-Feld | URL |
| --- | --- |
| Privacy Policy URL | `https://<domain>/privacy` |
| Support URL | `https://<domain>/support` |
| Marketing URL (optional) | `https://<domain>/` |
| EULA / Terms (optional) | `https://<domain>/terms` |

## Noch auszufüllende Platzhalter

Alle Platzhalter sind im HTML als `<span class="placeholder">[…]</span>` markiert und werden
auf der Seite sichtbar hervorgehoben. Vor dem Produktiv-Deploy ersetzen:

**`public/imprint.html`**
- `[Name/Firma des Betreibers einfügen]`
- `[Strasse und Hausnummer]`, `[PLZ Ort]`, `[Land]`
- `[E-Mail einfügen]`
- `[Optional einfügen]` — Telefon, Handelsregister, USt-IdNr., Vertretungsberechtigte Personen
  (optionale Felder: Zeile ganz entfernen, wenn nicht zutreffend)

**`public/privacy.html`** (Abschnitt „Verantwortlicher")
- `[Name/Firma des Betreibers einfügen]`
- `[Adresse einfügen]`
- `[E-Mail einfügen]`

**`public/support.html`**
- `[Support-E-Mail einfügen]` — kommt zweimal vor (Kontakt-Block und Abschnitt
  „Konto und Daten löschen")
- `[Übliche Antwortzeit einfügen, …]`

Ebenfalls prüfen: das Datum „Zuletzt aktualisiert: 3. Juli 2026" in `privacy.html` und
`terms.html` (aus den Quell-Markdowns übernommen).

Alle Platzhalter finden:

```bash
grep -rn 'class="placeholder"' web/legal/public
```

## Offener inhaltlicher Punkt

Die Support-Seite beschreibt die Kontolöschung als Anfrage per E-Mail, weil im App-Code
(`app/src`) kein In-App-Löschflow gefunden wurde. Apple Guideline 5.1.1(v) verlangt bei
Konto-Registrierung eine Löschmöglichkeit **in der App**. Sobald der In-App-Flow existiert,
den Abschnitt „Konto und Daten löschen" um den konkreten Pfad in der App ergänzen.
