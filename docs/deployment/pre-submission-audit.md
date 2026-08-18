# Pre-Submission Compliance Audit — Stängelispass 1.0.0

**Datum:** 2026-08-16
**Umfang:** Read-only Code-Audit, keine Änderungen ausserhalb dieser Datei.
**Methode:** Geprüft wurde am Code, nicht an Doku-Behauptungen. Jeder Befund trägt
eine konkrete Fundstelle `pfad/datei:zeile`.

---

## Zusammenfassung

> **6 BLOCKER — die App ist in diesem Zustand nicht einreichbar.**

| # | Schweregrad | Befund |
| --- | --- | --- |
| 1.1 | **BLOCKER** | Keine In-App-Account-Löschung (Guideline 5.1.1(v)) |
| 2.1 | **BLOCKER** | RLS auf allen 15 Tabellen durch `USING (true)` wirkungslos |
| 2.2 | **BLOCKER** | `device_tokens` ohne `ENABLE ROW LEVEL SECURITY` in `008` |
| 4.1 | **BLOCKER** | Kein Altersgate in einer reinen Alkohol-Tracking-App |
| 4.2 | **BLOCKER** | "Safe Ride Monitor" signalisiert Fahrtauglichkeit ohne Disclaimer |
| 5.1 | **BLOCKER** | Datenschutzerklärung/Impressum mit unausgefüllten Platzhaltern |
| 1.2 | RISIKO | Keine Authentifizierung — jeder kann jedes Profil übernehmen |
| 2.3 | RISIKO | `api.*`-Views ohne `security_invoker` umgehen RLS |
| 3.2 | RISIKO | Production-Build ohne garantierte Supabase-Env → Crash beim Start |
| 4.3 | RISIKO | Gamification belohnt Tempo und Menge ("Hat Trick": 3 Bier < 1h) |
| 4.4 | RISIKO | Kein Hinweis auf verantwortungsvollen Konsum |
| 4.5 | RISIKO | Platzhalter-Taxinummer `tel:0800800800` im Sicherheits-Pfad |
| 5.2 | RISIKO | Gewicht/Geschlecht/Klarname fehlen in der Datenschutzerklärung |
| 5.5 | RISIKO | Kein In-App-Link auf die Rechtstexte |
| 6.3 | RISIKO | `expo-notifications` nicht als Expo-Plugin konfiguriert |

**Sauber (keine Massnahme nötig):**
Secrets (3.1 — keine geleakten Keys, keine `.env` eingecheckt, History sauber),
Third-Party-SDKs (5.4 — kein Tracking/Analytics),
IAP-Gating (6.1 — verifiziert kein toter Kauf-Pfad),
Platzhaltertexte im App-Code (6.2 — bis auf 4.5).

### Wichtigste Korrektur zur Ausgangsannahme

Die App verwendet **keine Supabase-Auth-Registrierung.** `signUp`, `signInWith*` und
`auth.uid()` kommen im Client nirgends vor. Nutzerprofile sind ungeschützte
Datenbankzeilen, die per Namenseingabe angelegt und per Tap übernommen werden.
Guideline 5.1.1(v) greift trotzdem, weil die App Account-*Erstellung* unterstützt —
und die fehlende Auth macht zusätzlich die gesamte RLS-Schicht wirkungslos.

### Reihenfolge der Behebung

1. **2.1 / 2.2 zuerst** — Solange `USING (true)` gilt, ist die Datenbank über den
   im Bundle liegenden Anon-Key öffentlich les- und schreibbar, inklusive
   Push-Token, Gesundheitsdaten und Lifetime-Pass-Codes. Das ist der einzige Befund,
   der auch nach einem erfolgreichen Review aktiv Schaden anrichtet.
2. **1.1** — Löschfunktion bauen; ohne sie ist ein Review chancenlos.
3. **4.1 / 4.2** — Age-Gate und Entschärfung der Fahrtauglichkeits-Aussage.
4. **5.1** — Rechtstexte ausfüllen (billig, rein redaktionell).
5. Danach die RISIKO-Punkte, mindestens 3.2 (Start-Crash) und 4.5 (Platzhalternummer).

---

## 1. Account-Löschung / Guideline 5.1.1(v)

### 1.1 BLOCKER — Keine In-App-Account-Löschung vorhanden

**Befund:** Es existiert im gesamten Client-Code kein Pfad, um einen Account zu löschen.
Volltextsuche über `app/src/**/*.{ts,tsx}` nach `delete account`, `deleteAccount`,
`account_delete`, `deleteUser`, `delete_user`, `Konto löschen`, `löschen` liefert **null Treffer**.

Auch serverseitig existiert nichts: keine Edge Function für Löschung
(vorhanden sind nur `app/supabase/functions/notifyLeadChange/index.ts` und
`app/supabase/functions/processNotifications/index.ts`), und keine Migration in
`app/supabase/migrations/` definiert eine `delete_user`-RPC oder ein
Kaskaden-Lösch-Verfahren, das vom Client aufrufbar wäre.

Der Settings-Screen `app/src/app/settings.tsx:104` rendert `SettingsSections` mit
den Handles aus `app/src/hooks/settings/useUserManagement.ts`. Die einzige
löschungsnahe Aktion dort ist:

- `app/src/hooks/settings/useUserManagement.ts:101` — `handleLogout` setzt lediglich
  `setCurrentUser(null)`. Das ist ein Profilwechsel im lokalen State, **keine Löschung**.
- `app/src/hooks/settings/useCacheManagement.ts:19` — "This will remove all cached data.
  The app will reload fresh data from the server." Das löscht nur den lokalen Cache;
  die Serverdaten bleiben vollständig bestehen.

**Wichtige Korrektur zur Ausgangsannahme:** Die App verwendet **keine Supabase-Auth-
Registrierung**. `supabase.auth.signUp` / `signInWith*` / `auth.uid()` kommen im
Client nirgends vor (einziger `auth.`-Treffer: der Noop-Stub
`app/src/services/client.ts:73`). Accounts werden als reine Datenbankzeilen angelegt:
`app/src/services/users.ts:60` (`supabase.from("users").insert({ name, is_admin })`),
aufgerufen aus `app/src/hooks/settings/useUserManagement.ts:61`.

Das entschärft 5.1.1(v) **nicht**: Apple verlangt die Löschmöglichkeit für Apps, die
*Account-Erstellung unterstützen* — und genau das tut `handleAddUser`. Es entsteht ein
dauerhafter serverseitiger Datensatz mit Name, Gewicht (`weight_kg`), Geschlecht
(`gender`), Trinkhistorie und Push-Token. Ein Reviewer, der in Settings einen Nutzer
anlegt, hat einen Account erstellt und findet keinen Weg, ihn wieder zu entfernen.

**Empfohlene Behebung:**

1. **UI-Ort:** In `app/src/screens/settings/SettingsSections.tsx` eine eigene
   Sektion "Account" mit destruktiv gestyltem Eintrag "Account löschen" ergänzen —
   erreichbar in maximal zwei Taps ab dem Settings-Tab, nicht hinter Admin-Rechten,
   nicht nur im Nutzer-Verwaltungs-Modal.
2. **Bestätigungs-Flow:** Zweistufig. Erst `Alert.alert` mit expliziter Aufzählung,
   was gelöscht wird (Profil, alle Bier-Logs, Achievements, Kommentare, Wall-of-Fame-
   Einträge, Push-Token). Dann eine zweite Bestätigung mit Tippen des eigenen Namens
   oder ein zweiter "Endgültig löschen"-Dialog. Kein Weblink, keine Support-Mail.
3. **Serverseitiges Löschen:** Eine Postgres-`SECURITY DEFINER`-Funktion
   `public.delete_user_account(p_user_id uuid)` als Migration anlegen, die in einer
   Transaktion aus `beers`, `beer_stamps`, `achievements`, `wall_of_fame`, `toasts`,
   `comments`, `device_tokens`, `notifications`, `event_memberships`,
   `event_game_stats`, `event_leader_state`, `event_leader_snapshots` und zuletzt
   `users` löscht. `device_tokens.user_id` hat bereits `ON DELETE CASCADE`
   (`app/supabase/migrations/008_device_tokens.sql:7`), die übrigen Tabellen sind
   explizit zu prüfen. Nur die Profilzeile zu löschen genügt nicht.
4. **Auth-User:** Sobald echtes Supabase Auth eingeführt wird (siehe 2.1 — ohne Auth
   ist RLS wirkungslos), muss der Flow zusätzlich `auth.admin.deleteUser()` aus einer
   Edge Function mit `service_role` aufrufen. Solange kein Auth-User existiert,
   entfällt dieser Schritt — er ist aber der Grund, den Löschpfad von vornherein
   serverseitig als Edge Function zu bauen statt als Client-Query.
5. **Nach dem Löschen:** lokalen State und SecureStore-Session räumen
   (`app/src/services/storage.ts`) und zum Startzustand zurückkehren.

### 1.2 RISIKO — Keine Authentifizierung: jeder kann jedes Profil übernehmen

**Befund:** `app/src/hooks/settings/useUserManagement.ts:28-33` — `handleSelectUser`
setzt beliebige Nutzer als aktuellen Nutzer und meldet
`Alert.alert("User Selected", \`You are now signed in as ${user.name}\`)`.
Es gibt kein Passwort, keinen Token, keine Verifikation. Die Nutzerliste kommt
ungefiltert aus `app/src/services/users.ts:14` (`getUsers`, `select("*")`).

Zusätzlich: `app/src/services/users.ts:61` schreibt `is_admin` direkt aus einem
Client-Toggle (`isNewUserAdmin`, `app/src/hooks/settings/useUserManagement.ts:25`).
Ein Nutzer kann sich beim Anlegen selbst zum Admin machen.

Das ist primär ein Datenschutz- und Integritätsproblem (siehe Abschnitt 5), aber
Apple-Reviewer stoßen bei einer App mit Nutzerprofilen und sichtbaren Fremddaten
regelmäßig auch auf Guideline 5.1.2 (Datenzugriff ohne Einwilligung).

**Empfohlene Behebung:** Vor dem Launch echtes Supabase Auth (Magic Link / Apple
Sign-In) einführen und Profile an `auth.uid()` binden. Falls das für 1.0.0 zu groß
ist, muss die Datenschutzerklärung unmissverständlich offenlegen, dass alle Profile
und Trinkdaten für jeden App-Nutzer sichtbar und editierbar sind.

---

## 2. Supabase RLS

### 2.1 BLOCKER — RLS ist auf allen Tabellen faktisch wirkungslos (`USING (true)`)

**Befund:** RLS ist zwar auf nahezu allen Tabellen eingeschaltet, aber jede Tabelle
bekommt eine `FOR ALL USING (true) WITH CHECK (true)`-Policy. Das erlaubt der
`anon`-Rolle vollen Lese-, Schreib- und Löschzugriff auf alle Zeilen aller Nutzer.
Da der Anon-Key im App-Bundle liegt (`app/src/services/client.ts:20`), ist das
öffentlich zugänglich.

Betroffene Tabellen namentlich, jeweils mit `USING (true)`:

| Tabelle | Fundstelle |
| --- | --- |
| `users` | `app/supabase/migrations/001_init.sql:149` |
| `beers` | `app/supabase/migrations/001_init.sql:152` |
| `events` | `app/supabase/migrations/001_init.sql:155` |
| `achievements` | `app/supabase/migrations/001_init.sql:158` |
| `wall_of_fame` | `app/supabase/migrations/001_init.sql:161` |
| `toasts` | `app/supabase/migrations/001_init.sql:164` |
| `beer_stamps` | `app/supabase/migrations/001_init.sql:167`, `010_profile_and_beer_stamps.sql:40` |
| `device_tokens` | `app/supabase/migrations/20260211235830_push_notifications_tables.sql:40` |
| `notifications` | `20260211235830_push_notifications_tables.sql:43`, `015_reconcile_notifications_table.sql:66` |
| `event_game_stats` | `app/supabase/migrations/013_event_game_stats.sql:40` |
| `event_leader_state` | `app/supabase/migrations/013_event_game_stats.sql:53` |
| `event_leader_snapshots` | `app/supabase/migrations/20260213123000_event_leader_snapshots.sql:32` |
| `event_memberships` | `app/supabase/migrations/012_event_memberships.sql:32` |
| `promo_codes` | `app/supabase/migrations/20260215194500_event_pass_credits.sql:32` |
| `lifetime_pass_codes` | `app/supabase/migrations/20260213090000_lifetime_pass_codes.sql:26` |

Besonders kritisch sind dabei:

- **`device_tokens`** — Expo-Push-Token aller Nutzer sind öffentlich lesbar. Wer den
  Anon-Key aus dem Bundle zieht, kann alle Token abziehen und (mit Expo-Push-API)
  beliebige Push-Nachrichten an alle Nutzer senden.
- **`users`** — Name, `weight_kg`, `gender` und `is_admin` aller Nutzer sind öffentlich
  les- **und schreibbar**. `is_admin` kann per anon-Key auf beliebigen Zeilen gesetzt werden.
- **`lifetime_pass_codes`** und **`promo_codes`** — die Einlöse-Codes für den
  Lifetime-Pass sind vollständig auslesbar und beliebig manipulierbar. Das Bezahl-/
  Freischalt-Modell ist damit trivial umgehbar.

### 2.2 BLOCKER — Keine RLS auf `device_tokens` in `008_device_tokens.sql`

**Befund:** `app/supabase/migrations/008_device_tokens.sql:5-11` legt
`public.device_tokens` an, ruft aber **kein** `ENABLE ROW LEVEL SECURITY` auf.
Der spätere Fix in `20260211235830_push_notifications_tables.sql:33` greift nur, wenn
diese Migration tatsächlich gelaufen ist und dieselbe Tabelle meint — beide Migrationen
verwenden `CREATE TABLE IF NOT EXISTS`. Auf einer Datenbank, in der `008` zuerst lief,
ist der Zustand abhängig von der Ausführungsreihenfolge zu verifizieren. Praktisch
ändert das wenig, weil die Policy ohnehin `USING (true)` ist (2.1).

### 2.3 RISIKO — `api.*`-Views umgehen RLS

**Befund:** `app/supabase/migrations/002_api_views.sql:6-11` legt Views
`api.users`, `api.beers`, `api.events`, `api.achievements`, `api.wall_of_fame`,
`api.toasts` als `SELECT * FROM public.<tabelle>` an — ohne `WITH (security_invoker = on)`.
Views laufen in Postgres standardmäßig mit den Rechten des View-Owners, RLS der
Basistabelle greift dann **nicht**. `app/supabase/migrations/002_api_views.sql:15` und
`app/supabase/migrations/004_api_grants.sql:4-26` geben `anon` zusätzlich
`SELECT/INSERT/UPDATE/DELETE` auf diese Views.

Selbst wenn die Policies aus 2.1 später verschärft werden, bleibt über das
`api`-Schema ein vollständiger Bypass offen.

**Empfohlene Behebung:** `ALTER VIEW api.<name> SET (security_invoker = on);` für alle
sechs Views, oder das `api`-Schema ganz entfernen, wenn der Client es nicht mehr nutzt.

### 2.4 HINWEIS — `comments`-Policies referenzieren `auth.uid()`, das immer NULL ist

**Befund:** `app/supabase/migrations/20260212001334_create_comments.sql:46` und `:53`
prüfen `user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)`.
Da die App keine Supabase-Auth-Session aufbaut (siehe 1.1), ist `auth.uid()` immer
`NULL` und beide Policies evaluieren zu `false`. UPDATE und DELETE auf `comments`
sind damit für die App faktisch blockiert.

SELECT (`:36`, `USING (true)`) und INSERT (`:41`, `WITH CHECK (true)`) sind dagegen
komplett offen — jeder kann alle Kommentare lesen und beliebige Kommentare unter
beliebiger `user_id` schreiben.

**Empfohlene Behebung:** Zusammen mit 1.2 lösen. Solange keine Auth existiert, ist die
Policy irreführend: sie suggeriert Ownership-Prüfung, erzwingt aber nichts.

### 2.5 HINWEIS — `service_role` im Client-Code

**Befund:** Der Client verwendet **keinen** `service_role`-Key. `app/src/services/client.ts:19-20`
liest ausschließlich `EXPO_PUBLIC_SUPABASE_URL` und `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
Das ist korrekt. Einzige `service_role`-Referenz in Migrationen:
`app/supabase/migrations/20260211235831_notification_triggers.sql:143` liest den Key
über `current_setting('app.supabase_service_role_key')` — also aus der DB-Konfiguration,
nicht hartcodiert. Ebenfalls korrekt.

## 3. Secrets im Repo

### 3.1 HINWEIS — Keine geleakten Secrets gefunden (sauber)

**Befund:** Es wurde **kein** `service_role`-Key, API-Secret oder privater Schlüssel im
Repo oder in der Git-History gefunden.

- `.gitignore:10-11` ignoriert `.env` und `.env.*`;
  `.gitignore:50-51` zusätzlich `app/supabase/.env` und `app/supabase/.env.local`.
- `git ls-files | grep -i '\.env'` liefert **null Treffer** — es ist keine `.env`-Datei
  eingecheckt. Auf der Platte liegen `app/.env` (untracked) und `app/.env.example` (tracked).
- `app/.env.example:2-3` enthält nur Platzhalter
  (`https://your-project.supabase.co`, `your-anon-key-here`).
- `app/app.json` enthält keinerlei Credentials — kein `extra`-Block mit Keys.
- `app/eas.json:29-33` referenziert App-Store-Connect-Credentials ausschliesslich über
  Variablen (`$APP_STORE_CONNECT_APP_ID`, `$APP_STORE_CONNECT_ISSUER_ID`,
  `$APP_STORE_CONNECT_API_KEY_PATH`, `$ASC_TEAM_ID`), keine Werte.
- `git log -p --all -S "service_role"` bringt nur Dokumentations-Commits
  (z.B. `041f4df`, Sprint-Pläne) — keine Key-Werte.
- Alle `SUPABASE_SERVICE_ROLE_KEY`-Treffer sind Variablen*namen* in serverseitigem Code
  bzw. CI-Secrets: `app/.github/workflows/ci.yml:40` (`${{ secrets.… }}`),
  `app/scripts/process_notifications.js:12`,
  `app/supabase/functions/notifyLeadChange/index.ts:25`,
  `app/supabase/functions/processNotifications/index.ts:12`. Alles korrekt.

**Abgrenzung EXPO_PUBLIC:** `app/src/services/client.ts:19-20` liest
`EXPO_PUBLIC_SUPABASE_URL` und `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Diese Werte werden von
Expo bewusst ins Bundle inlined und sind **per Design öffentlich** — das ist kein Leak.
Der Anon-Key ist nur so sicher wie die RLS-Policies dahinter. Genau deshalb ist
Abschnitt 2.1 ein Blocker: mit `USING (true)` ist der öffentliche Anon-Key
gleichbedeutend mit einem öffentlichen Vollzugriff auf die Datenbank.

### 3.2 RISIKO — Production-Build hat keine garantierte Supabase-Konfiguration

**Befund:** `app/eas.json:20-25` definiert das `production`-Build-Profil ohne
`env`-Block. `app/.env` ist gitignored und wird von EAS standardmäßig nicht mit
hochgeladen. `app/app.json` hat keinen `extra`-Block als Fallback, obwohl
`app/src/services/client.ts:29-40` genau darauf zurückzufallen versucht.

Konsequenz: Sind die Variablen im EAS-Projekt nicht gesetzt, greift
`app/src/services/client.ts:105-114` — und weil `NODE_ENV === "production"` im
Release-Build gilt, wird die Exception **geworfen statt auf den Noop-Client
zurückzufallen**. Das Modul wird beim App-Start importiert, also stürzt die App beim
Start ab. Ein Reviewer sieht einen sofortigen Crash → Guideline 2.1 (App Completeness).

**Empfohlene Behebung:** Vor dem Build verifizieren, dass `EXPO_PUBLIC_SUPABASE_URL`
und `EXPO_PUBLIC_SUPABASE_ANON_KEY` als EAS-Environment-Variablen für das
`production`-Profil hinterlegt sind (`eas env:list`), oder sie explizit im
`env`-Block von `app/eas.json` eintragen. Anschliessend den fertigen Build auf einem
Gerät starten, nicht nur im Dev-Client.

## 4. Alkohol-Content-Compliance

### 4.1 BLOCKER — Kein Altersgate vorhanden

**Befund:** Volltextsuche über `app/src/**` nach `age gate`, `ageGate`, `18+`, `16+`,
`birth`, `Geburt`, `Alter`, `minimumAge`, `volljährig` liefert **null Treffer**.
Es gibt keinen Onboarding-Screen und keine Altersabfrage. Die App startet direkt in
`app/src/app/index.tsx` mit dem Leaderboard.

Für eine App, deren einziger Zweck das Protokollieren von Alkoholkonsum ist, erwartet
Apple ein Age-Rating von 17+ **und** in der Praxis regelmässig ein In-App-Age-Gate.
Ohne Altersabfrage ist eine Ablehnung nach Guideline 1.1.7 / 5.1.1 realistisch.

**Empfohlene Behebung:** Beim ersten Start ein blockierendes Age-Gate (Geburtsdatum
oder mindestens "Ich bin 18 oder älter" mit Ablehnungspfad), Ergebnis persistieren
(z.B. via `app/src/services/storage.ts`). Zusätzlich in App Store Connect das
Age-Rating auf 17+ setzen und "Alcohol, Tobacco, or Drug Use or References" auf
"Frequent/Intense" deklarieren.

### 4.2 BLOCKER — "Safe Ride Monitor" gibt eine Fahrtauglichkeits-Aussage ohne Disclaimer

**Befund:** `app/src/components/features/SafeRideCard.tsx:44-50` rendert bei
`stats.canDrive === true` ein grünes `check-circle` unter der Überschrift
"Safe Ride Monitor". Der Warnhinweis "You're over the limit. Please don't drive."
erscheint ausschliesslich im `!stats.canDrive`-Zweig
(`app/src/components/features/SafeRideCard.tsx:64-70`). Unterhalb der Schwelle
signalisiert die Karte also aktiv grünes Licht zum Fahren.

`canDrive` stammt aus `app/src/services/safety.ts:48`
(`canDrive: bac < LEGAL_LIMIT_PER_MILLE`, `LEGAL_LIMIT_PER_MILLE = 0.5`,
`app/src/services/safety.ts:22`) — eine reine Widmark-Schätzung auf Basis von
Gewicht und Geschlecht, mit Default-Gewicht 75 kg wenn nichts gesetzt ist
(`app/src/services/safety.ts:32`). Diese Schätzung ist nicht geeignet, Fahrtauglichkeit
zu beurteilen.

Inkonsistent dazu trägt die *andere* BAC-Anzeige einen korrekten Disclaimer:
`app/src/components/features/ProfileBACCard.tsx:40-43` — "Estimation based on N beers.
Strictly for entertainment. Never drive after drinking." Der `SafeRideCard` fehlt er
komplett.

Das ist zugleich ein Haftungsrisiko und ein Ablehnungsgrund (Guideline 1.4.1 /
Physical Harm): Eine App, die suggeriert, man dürfe nach dem Trinken fahren, wird
von Apple regelmässig zurückgewiesen.

**Empfohlene Behebung:** Den `canDrive === true`-Zustand neutral gestalten (kein
grünes Häkchen, keine Freigabe-Semantik), denselben Disclaimer wie in
`ProfileBACCard` immer anzeigen — nicht nur im Warnfall — und den Wert konsequent als
"Schätzung, nicht rechtsverbindlich" labeln. Alternativ die Fahrtauglichkeits-Logik
ganz entfernen und nur die Promille-Schätzung mit Warnhinweis zeigen.

### 4.3 RISIKO — Gamification belohnt schnelles und exzessives Trinken

**Befund:** Mehrere Mechaniken belohnen direkt Menge und Tempo:

- `app/src/services/achievements.ts:15-16` — Achievement **"Hat Trick"**:
  "Drank 3 beers in under 1 hour." Das ist definitionsgemäss Binge-Drinking und wird
  hier explizit ausgezeichnet.
- `app/src/services/achievements.ts:29-30` — **"Night Owl"**: "Logged a beer after 2:00 AM."
- `app/src/services/achievements.ts:36-37` — **"Century Club"**: "Logged 100 lifetime beers."
- `app/src/components/home/HomeHeader.tsx:195` — **"Hot Streak: {name} x{count}"**,
  eine sichtbare Serien-Anzeige, gespeist aus
  `app/src/hooks/home/useHomeEventData.ts:82`.
- Leaderboards als zentrales Feature: `app/src/app/index.tsx:226` (`LeaderboardItem`)
  und der öffentlich teilbare Screen `app/src/app/leaderboard/[eventId].tsx:117-120`,
  der zusätzlich die Gesamtsumme aller getrunkenen Biere prominent anzeigt
  (`app/src/app/leaderboard/[eventId].tsx:106`).
- `app/src/app/legends.tsx:52-53` — **"Legends Gallery" / "Hall of Fame of Stängelispass"**,
  eine dauerhafte Bestenliste.
- `app/src/components/home/HomeModals.tsx:51-52` — Gewinner-Modal mit `winnerName`
  und `totalBeers`.

**Ehrliche Einschätzung:** Der Wettbewerbsaspekt ist nicht nur Beiwerk, sondern der
Kern der App — "Who's drinking?" (`app/src/app/add.tsx:116`) und ein Leaderboard auf
dem Startscreen. Apple lehnt Trink-Wettbewerbs-Apps nicht automatisch ab, reagiert
aber sensibel auf Mechaniken, die *Geschwindigkeit* prämieren. "Hat Trick" ist der
riskanteste Einzelposten, weil der Text die Belohnung für 3 Bier in unter einer Stunde
wörtlich ausspricht.

**Empfohlene Behebung:** Mindestens "Hat Trick" umformulieren oder entfernen — ein
zeitbasiertes Tempo-Achievement ist schwer zu verteidigen. Für die übrigen Mechaniken
einen sichtbaren Hinweis auf verantwortungsvollen Konsum ergänzen (siehe 4.4).

### 4.4 RISIKO — Kein Hinweis auf verantwortungsvollen Konsum

**Befund:** Ausser dem Satz in `app/src/components/features/ProfileBACCard.tsx:40-43`
(nur im Profil-Screen sichtbar) und der bedingten Warnung in
`app/src/components/features/SafeRideCard.tsx:67` existiert **kein** Hinweis auf
verantwortungsvollen Alkoholkonsum. Auf dem Startscreen (`app/src/app/index.tsx`),
im Erfassungs-Screen (`app/src/app/add.tsx`), im Leaderboard
(`app/src/app/leaderboard/[eventId].tsx`) und in der Legends-Galerie
(`app/src/app/legends.tsx`) findet sich nichts dergleichen.

**Empfohlene Behebung:** Einen permanenten, unaufdringlichen Hinweis im Footer des
Startscreens und im Add-Flow ("Trink verantwortungsvoll. Fahre nie unter
Alkoholeinfluss."), zusätzlich einen einmaligen Hinweis nach dem Age-Gate. Das ist
billig umzusetzen und entschärft 4.3 spürbar.

### 4.5 RISIKO — Platzhalter-Telefonnummer im Notfall-Pfad "Call Taxi"

**Befund:** `app/src/components/features/SafeRideCard.tsx:36` —
`Linking.openURL("tel:0800800800"); // Example taxi number`.
Der Kommentar im Code sagt es selbst: Es ist eine Beispielnummer. Der Button ist in der
Produktions-UI sichtbar und wählbar, gerade in der Situation, in der der Nutzer alkoholisiert
ist und kein Auto fahren soll.

Das ist doppelt problematisch: ein sichtbarer Platzhalter (Guideline 2.1, siehe auch
Abschnitt 6) und ein sicherheitsrelevanter Pfad, der ins Leere führt.

**Empfohlene Behebung:** Durch eine echte, regional passende Taxi-Nummer ersetzen, oder
den Button auf einen generischen Systemaufruf umstellen (z.B. Karten-App-Suche nach
"Taxi in der Nähe"). Nicht mit Platzhalter ausliefern.

## 5. Datenerhebung vs. Deklaration

### 5.1 BLOCKER — Datenschutzerklärung und Impressum enthalten unausgefüllte Platzhalter

**Befund:** Die verlinkten Rechtstexte sind nicht fertiggestellt. Apple verlangt in
App Store Connect eine erreichbare, gültige Privacy-Policy-URL; eine Seite mit
`[Name/Firma des Betreibers einfügen]` erfüllt das nicht (Guideline 5.1.1).

- `docs/legal/privacy-policy.md:6-8` — `[Name/Firma des Betreibers einfügen]`,
  `[Adresse einfügen]`, `[E-Mail einfügen]`
- `docs/legal/imprint.md:3-13` — neun Platzhalter, u.a. Name, Strasse, PLZ, Land, E-Mail
- `web/legal/public/privacy.html:29-31` — dieselben drei Platzhalter im ausgelieferten
  HTML, sogar mit eigener CSS-Klasse `class="placeholder"`
- `web/legal/public/imprint.html:29-51` — sechs Platzhalter
- `web/legal/public/support.html:34,37,106` — `[Support-E-Mail einfügen]`,
  `[Übliche Antwortzeit einfügen, …]`

Besonders kritisch: `docs/legal/privacy-policy.md:36` verweist für die Ausübung der
Betroffenenrechte auf "die oben genannte E-Mail" — die es nicht gibt. Damit existiert
weder ein In-App-Löschweg (Abschnitt 1.1) **noch** ein funktionierender Kontaktweg für
ein Löschbegehren.

**Empfohlene Behebung:** Alle Platzhalter vor dem Build durch reale Angaben ersetzen
und die Support-URL in App Store Connect auf `web/legal/public/support.html` zeigen
lassen. (Hinweis: `web/**` wird parallel bearbeitet — vor der Einreichung erneut prüfen.)

### 5.2 RISIKO — Erhobene Daten fehlen in der Datenschutzerklärung

**Befund:** Die App erhebt mehr, als `docs/legal/privacy-policy.md:14-17` auflistet.
Die Erklärung nennt nur App-interne Benutzer-ID, Geräte-ID, Nutzungsdaten und Crash-Daten.
Nicht genannt, aber tatsächlich erhoben:

| Tatsächlich erhoben | Fundstelle | In Policy? | Im Manifest? |
| --- | --- | --- | --- |
| **Klarname** des Nutzers | `app/src/services/users.ts:61` (`insert({ name, … })`) | ❌ fehlt | ✅ `NSPrivacyCollectedDataTypeName` (`app/PrivacyInfo.xcprivacy:37`) |
| **Körpergewicht** (`weight_kg`) | `app/src/app/settings.tsx:75-85`, gelesen in `app/src/services/safety.ts:32` | ❌ fehlt | ✅ als `…TypeHealth` (`app/PrivacyInfo.xcprivacy:49`) |
| **Geschlecht** (`gender`) | `app/src/app/settings.tsx:87-97`, gelesen in `app/src/services/safety.ts:42` | ❌ fehlt | ✅ als `…TypeHealth` |
| **Alkoholkonsum-Historie** | Tabelle `beers`, `app/supabase/migrations/001_init.sql:75` | ⚠️ nur als "Nutzungsdaten" umschrieben | ⚠️ nur `…TypeOtherUserContent` |
| **Push-Token** | `app/src/hooks/settings/useUserManagement.ts:34` (`registerForPushNotificationsAsync`), Tabelle `device_tokens` | ✅ als "Geräte-ID" | ✅ `…TypeDeviceID` |
| **Kommentare** | Tabelle `comments`, `app/supabase/migrations/20260212001334_create_comments.sql:9` | ✅ | ✅ `…TypeOtherUserContent` |

Gewicht, Geschlecht und detaillierte Trinkhistorie sind nach DSGVO/DSG besonders
schützenswerte Gesundheitsdaten. Das Privacy-Manifest deklariert sie korrekt als
`NSPrivacyCollectedDataTypeHealth` (`app/PrivacyInfo.xcprivacy:49`) — die
Datenschutzerklärung erwähnt sie **überhaupt nicht**. Diese Inkonsistenz zwischen
Manifest und Policy ist der auffälligste Widerspruch im Datenschutz-Set.

Ebenfalls nicht erwähnt: dass Profile, Trinkdaten und Leaderboards für **alle**
App-Nutzer sichtbar sind (Folge von 1.2 und 2.1), und dass der Leaderboard-Screen
`app/src/app/leaderboard/[eventId].tsx` ohne jede Zugangskontrolle abrufbar ist.

**Empfohlene Behebung:** Datenschutzerklärung um Klarname, Gewicht, Geschlecht,
Alkoholkonsum-Daten (als Gesundheitsdaten kenntlich) und die Sichtbarkeit gegenüber
anderen Nutzern ergänzen. Zusätzlich Kamera- und Fotomediathek-Zugriff aufnehmen —
beide sind in `app/app.json:22-24` als `NSCameraUsageDescription`,
`NSPhotoLibraryAddUsageDescription`, `NSPhotoLibraryUsageDescription` deklariert und
fehlen in der Erklärung.

### 5.3 HINWEIS — "Crash-Daten" werden deklariert, aber nicht erhoben

**Befund:** `docs/legal/privacy-policy.md:17` nennt "Crash-Daten: Bei Aktivierung zur
Fehlerbehebung." In `app/package.json` ist **kein** Crash-Reporting- oder
Analytics-SDK enthalten — kein Sentry, Bugsnag, Firebase, Amplitude, Mixpanel,
PostHog, Segment. `app/src/utils/logger.ts` enthält keinen Netzwerk-Versand
(kein `fetch`, kein Endpoint); die Logs gehen ausschliesslich an `console`
(`app/src/utils/logger.ts:95-96`).

Das ist eine Über-Deklaration, kein Verstoss — aber sie sollte gestrichen werden,
damit die Erklärung dem tatsächlichen Verhalten entspricht.

### 5.4 HINWEIS — Third-Party-SDKs: keine undeklarierten gefunden (sauber)

**Befund:** Die Abhängigkeitsliste in `app/package.json` enthält ausschliesslich
Expo-/React-Native-Kernpakete, `@supabase/supabase-js`, `@tanstack/react-query`,
`date-fns` sowie UI-Bibliotheken (`lottie-react-native`,
`react-native-gifted-charts`, `react-native-qrcode-svg`,
`react-native-confetti-cannon`, `react-native-view-shot`, `react-native-svg`).
Kein Werbe-, Tracking- oder Analytics-SDK. Das deckt sich mit
`app/PrivacyInfo.xcprivacy:5-8` (`NSPrivacyTracking = false`, leere
`NSPrivacyTrackingDomains`). Die in `docs/legal/privacy-policy.md:26-27` genannten
Drittanbieter Supabase und Expo sind korrekt und vollständig.

### 5.5 RISIKO — Kein In-App-Link auf die Datenschutzerklärung

**Befund:** Volltextsuche über `app/src/**` nach `privacy`, `datenschutz`,
`impressum`, `imprint`, `terms`, `agb`, `nutzungsbeding` liefert **null Treffer**.
Es gibt keinen Menüeintrag in `app/src/screens/settings/SettingsSections.tsx`, der
auf die Rechtstexte verlinkt.

`docs/legal/privacy-policy.md:42` behauptet dagegen: "Die aktuelle Version ist immer
in der App verlinkt." Das ist im aktuellen Code nicht der Fall.

**Empfohlene Behebung:** Eine "Rechtliches"-Sektion in den Settings mit
`Linking.openURL` auf die Seiten unter `web/legal/public/` ergänzen
(Datenschutz, Impressum, Nutzungsbedingungen, Support).

---

## 6. Sonstige Store-Risiken

### 6.1 HINWEIS — IAP-Gating ist sauber, kein toter Kauf-Pfad erreichbar (verifiziert)

**Befund:** Der parallele Workstream hat sauber gearbeitet. Verifikation der Kette:

1. `app/src/services/iap.ts:23` — `export const IAP_ENABLED = false;`
2. `app/src/hooks/settings/useEventPasses.ts:274` — `iapEnabled: IAP_ENABLED` wird
   nach aussen gereicht.
3. `app/src/screens/settings/SettingsSections.tsx:146` — `purchasesEnabled={eventPasses.iapEnabled}`.
4. `app/src/components/settings/PremiumTierCard.tsx:71` —
   `{purchasesEnabled && !isLifetime && (…)}` umschliesst **alle drei** Buttons
   ("Buy Single Event (CHF 10)", "Buy Weekend Unlimited (CHF 15)",
   "Become a Supporter (CHF 100)", `PremiumTierCard.tsx:74/79/84`). Bei
   `purchasesEnabled = false` wird keiner gerendert.
5. Zusätzliche Absicherung in der Logik: `app/src/hooks/settings/useEventPasses.ts:168`
   (`if (!IAP_ENABLED) return;` in `handlePurchaseEventPass`) und
   `app/src/hooks/settings/useEventPasses.ts:215` (dasselbe in `handlePurchaseLifetime`).
   Selbst bei einem versehentlich erreichbaren Callback passiert nichts.
6. Auch die Nutzertexte sind konsistent umgeschaltet:
   `app/src/services/iap.ts:29-31` liefert bei deaktiviertem IAP
   "No event passes available. Redeem a promo code in Settings to unlock an event."
   statt des Kauf-Hinweises.

**Ergebnis: kein erreichbarer toter Kauf-Pfad.** Es gibt auch keinen
"Restore Purchases"-Button, der ins Leere liefe.

**Restrisiko (klein):** `PremiumTierCard` rendert weiterhin die Zeile
"Current Tier: Pilsner (Free)" sowie die Zähler "Day Passes 0 / Weekend Passes 0"
(`app/src/components/settings/PremiumTierCard.tsx:37-44`), ohne dass es einen Weg gibt,
diese Pässe zu erwerben — der einzige Weg ist ein Promo-Code. Ein Reviewer könnte das
als unvollständiges Feature lesen. Empfehlung: bei `!purchasesEnabled` die Day-/Weekend-
Zähler ausblenden oder um einen Satz ergänzen ("Pässe werden per Promo-Code freigeschaltet").

### 6.2 HINWEIS — Keine Platzhaltertexte, keine Debug-UI, keine localhost-Links im App-Code (sauber)

**Befund:** Volltextsuche über `app/src/**/*.{ts,tsx}` (ohne Tests) nach
`TODO`, `FIXME`, `Coming soon`, `Lorem`, `PLACEHOLDER`, `XXX`, `HACK`, `localhost`,
`127.0.0.1`, `example.com`, `your-project` liefert **null Treffer**.

Einzige Ausnahme ist die in 4.5 beschriebene Beispiel-Telefonnummer
`app/src/components/features/SafeRideCard.tsx:36` — die Suche hat sie nicht erfasst,
weil sie nicht als "TODO", sondern als Kommentar `// Example taxi number` markiert ist.
Das ist der einzige Platzhalter, der es in die Produktions-UI geschafft hat.

Die Platzhalter in den Rechtstexten (`web/legal/public/*.html`, `docs/legal/*.md`)
sind separat unter 5.1 erfasst.

### 6.3 RISIKO — `expo-notifications` ist installiert, aber nicht als Expo-Plugin konfiguriert

**Befund:** `app/package.json` enthält `"expo-notifications": "^0.32.16"` und die App
registriert aktiv Push-Token
(`app/src/hooks/settings/useUserManagement.ts:34` und `:71`,
`app/src/services/notifications.ts`). In `app/app.json:40-52` ist die
`plugins`-Liste jedoch auf `expo-router`, `expo-secure-store` und
`expo-build-properties` beschränkt — `expo-notifications` fehlt. Ebenso fehlen im
`ios.infoPlist`-Block (`app/app.json:19-25`) `UIBackgroundModes` und im Projekt ein
`aps-environment`-Entitlement.

Konsequenz: Der Prebuild richtet die Push-Konfiguration nicht ein.
`getExpoPushTokenAsync()` kann im Release-Build fehlschlagen. Das führt zwar dank der
`.catch()`-Behandlung in `app/src/hooks/settings/useUserManagement.ts:35-41` nicht zum
Absturz, aber das beworbene Push-Feature funktioniert dann schlicht nicht — Guideline 2.1.

**Empfohlene Behebung:** `expo-notifications` in `app/app.json` unter `plugins`
eintragen (mit `icon` und `color`), APNs-Key über `eas credentials` hinterlegen und
Push auf einem echten Gerät aus dem Production-Build heraus verifizieren.

### 6.4 HINWEIS — App-UI ist Englisch, Store-Auftritt und Rechtstexte sind Deutsch

**Befund:** Sämtliche Nutzertexte im Code sind englisch, z.B.
`app/src/app/add.tsx:116` ("Who's drinking?"),
`app/src/app/legends.tsx:52-53` ("Legends Gallery" / "Hall of Fame of Stängelispass"),
`app/src/components/features/SafeRideCard.tsx:49,67,82,94`
("Safe Ride Monitor", "You're over the limit. Please don't drive.", "Order Uber",
"Call Taxi"), `app/src/hooks/settings/useUserManagement.ts:32`
("You are now signed in as …").

Demgegenüber sind die Info.plist-Strings deutsch (`app/app.json:22-24`) und die
Rechtstexte ebenfalls (`docs/legal/privacy-policy.md`, `docs/legal/imprint.md`).

Das ist kein Ablehnungsgrund, aber inkonsistent: Wird die App in App Store Connect
mit Deutsch als Primärsprache und deutschen Screenshots eingereicht, sieht der
Reviewer eine englische Oberfläche. Empfehlung: entweder die UI lokalisieren oder
Englisch als Primärsprache setzen.

### 6.5 HINWEIS — `app/src/services/# Code Citations.md` liegt im Quellverzeichnis

**Befund:** Die Datei `app/src/services/# Code Citations.md` ist eingecheckt und liegt
mitten im Service-Verzeichnis. Sie wird nicht gebundelt (kein Import) und ist damit
kein Store-Risiko, gehört aber nicht in `src/`. Aufräumen empfohlen.
