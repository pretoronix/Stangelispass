# WS-F — Compliance-Audit (Stängelispass 1.0.0)

Audit-Datum: 2026-08-16. Read-only Prüfung gegen den Repo-Stand des Branches
`worktree-ios-launch-ws-ef`. Ergänzt `docs/superpowers/plans/2026-08-16-ios-app-store-launch-v2.md`.

## Ergebnis auf einen Blick

| # | Prüfpunkt | Status |
| --- | --- | --- |
| 1 | Account-Löschung in-App (Guideline 5.1.1(v)) | **Nicht anwendbar** — keine Registrierung |
| 2 | Supabase RLS auf allen Tabellen | **OK** — 15/15 Tabellen |
| 3 | Keine Secrets im Repo | **OK** — `.env` gitignored, nur Anon-Key |
| 4 | Datenerhebung ↔ Privacy-Manifest ↔ Nutrition Labels | **OK** — konsistent |
| 5 | Alkohol: Verantwortungshinweis / Altersangabe | **Behoben** — Hinweis jetzt in-App |
| 6 | IAP vollständig deaktiviert (Guideline 2.1) | **OK** — Feature-Flag aus |
| 7 | ATT / Tracking | **OK** — kein ATT, kein Tracking |
| 8 | Offene Platzhalter vor Einreichung | **Aktion nötig** (siehe unten) |

---

## 1. Account-Löschung — nicht anwendbar

Guideline 5.1.1(v) verlangt eine In-App-Löschung nur für Apps, in denen ein Konto
angelegt wird. Stängelispass hat keine Authentifizierung:

- keine Treffer für `supabase.auth`, `signUp`, `signInWith` im gesamten `app/src`
- Profile werden lokal ausgewählt (`useUserManagement`, `UserSelectionGrid`)
- kein E-Mail-/Passwort-Flow, kein OAuth, kein Sign in with Apple

Vorhandene Lösch-/Entfernungswege: Event-Admin kann Mitglieder aus einem Event
entfernen (`EventAdminSection` → `onRemoveMember`); lokale Daten über
«Cache & Storage» → «Clear Cache». Eine Profil-Löschung auf Anfrage ist auf der
Support-Seite beschrieben.

> Falls in 1.1 eine Registrierung eingeführt wird, wird 5.1.1(v) sofort verbindlich:
> dann ist eine In-App-Kontolöschung Pflicht.

## 2. Supabase Row Level Security — vollständig

Alle in `app/supabase/migrations` und `app/supabase-schema.sql` angelegten Tabellen
haben `ENABLE ROW LEVEL SECURITY`:

`achievements`, `beers`, `beer_stamps`, `comments`, `device_tokens`,
`event_game_stats`, `event_leader_snapshots`, `event_leader_state`,
`event_memberships`, `events`, `lifetime_pass_codes`, `notifications`,
`promo_codes`, `toasts`, `users`, `wall_of_fame` — 15 eindeutige Tabellen,
15 mit RLS. Keine Tabelle ohne Policy-Schutz.

## 3. Secrets

- `app/.env` ist über `app/.gitignore:4` ausgeschlossen und **nicht** in `git ls-files`
- versioniert ist nur `app/.env.example` mit Platzhaltern
- die App nutzt ausschliesslich `EXPO_PUBLIC_SUPABASE_URL` und
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` — der Anon-Key ist per Design öffentlich und
  nur in Verbindung mit RLS sicher (siehe Punkt 2)
- kein Service-Role-Key im Client-Code

## 4. Datenerhebung ↔ Privacy-Manifest ↔ Nutrition Labels

`app/PrivacyInfo.xcprivacy` deklariert `NSPrivacyTracking = false`, keine Tracking-Domains
und fünf verknüpfte Datentypen, jeweils Zweck „App Functionality", nie Tracking:

| Manifest-Typ | Reale Quelle im Code |
| --- | --- |
| UserID | Profil-/Mitglieds-IDs (`users`, `event_memberships`) |
| DeviceID | Push-Token (`device_tokens`, `expo-notifications`) |
| Name | Anzeigename des Profils |
| Health | Gewicht/Geschlecht für die Promille-Schätzung (`bacCalculator`) |
| OtherUserContent | Kommentare (`comments`) |

Accessed-API-Reasons: UserDefaults `CA92.1`, FileTimestamp `C617.1`,
DiskSpace `E174.1`, SystemBootTime `35F9.1` — passend zu AsyncStorage/SecureStore
und Cache-Statistik. Die Nutrition-Label-Tabelle in
`docs/deployment/store-listing-copy.md` spiegelt genau diese fünf Typen.

## 5. Alkohol-Content

Vorher: Verantwortungs- und Altershinweis existierten nur in `docs/legal/terms-of-use.md`
und den gehosteten Seiten (`web/legal/public/*.html`) — **nicht in der App**.

Jetzt: Footer der Einstellungen zeigt
„Nur für Personen ab 17 Jahren bzw. dem gesetzlichen Mindestalter für Alkoholkonsum.
Bitte geniesse Alkohol verantwortungsvoll." (`app/src/screens/settings/SettingsSections.tsx`).

Ein hartes Altersgate (Geburtsdatum-Abfrage) ist nicht implementiert und für die
Altersfreigabe 17+ auch nicht von Apple gefordert. Die Promille-Anzeige ist als
Unterhaltung ohne medizinischen Anspruch gekennzeichnet (Store-Description + Review Notes).

Nebenbefund behoben: Der Footer zeigte „v1.5.0", `app/app.json` steht auf `1.0.0`.
Angeglichen auf `v1.0.0`.

## 6. In-App-Käufe

`app/src/services/iap.ts:23` → `export const IAP_ENABLED = false;`
`isIapAvailable()` gibt damit auf allen Plattformen `false` zurück; die Kauf-UI in
`PremiumTierCard` / `SettingsSections` ist hinter dem Flag ausgeblendet, die
werfenden Stubs sind erst nach Umlegen des Flags erreichbar.
`expo-in-app-purchases` ist aus `app/package.json` entfernt.

## 7. Tracking

Keine Treffer für `NSUserTracking` im gesamten `app/`-Baum → kein ATT-Prompt.
Konsistent zu `NSPrivacyTracking = false`. Keine Analytics- oder Werbe-SDKs.

## 8. Offene Punkte vor der Einreichung (Account-Inhaber)

1. **Support-E-Mail** — `web/legal/public/support.html` und `docs/legal/imprint.md`
   enthalten Platzhalter `[Support-E-Mail einfügen]` / `[E-Mail einfügen]`.
   Apple prüft die Support-URL; ohne erreichbaren Kontaktweg droht Ablehnung.
2. **Impressum vervollständigen** — Betreiberangaben in `docs/legal/imprint.md`.
3. **Vercel-Deploy** der Seiten aus `web/legal/`, danach `<DOMAIN>` in
   `docs/deployment/store-listing-copy.md` und in App Store Connect ersetzen.
4. **EAS-Link** — `app/app.json` hat weiterhin kein `extra.eas.projectId` / `owner`
   (`cd app && eas init`).
5. **Screenshots** 6.9" und 6.5" erstellen (kein iPad-Set).

## Prüfstand der Codebasis zum Audit-Zeitpunkt

```
npx tsc --noEmit   → 0 Fehler
npm test           → 85 Suites, 539 Tests grün (2 Suites / 17 Tests skipped)
```
