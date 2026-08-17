/**
 * User-facing copy, German (DE) — the app's only shipping locale for 1.0.
 * Swiss orthography: ss, never ß. Keep in sync with web/legal and
 * docs/deployment/store-listing-copy.md.
 *
 * testIDs and accessibility labels live in ./labels.ts, not here.
 */
export const copy = {
  settings: {
    // Screen + section headings
    title: "Einstellungen",
    activeProfiles: "Aktive Profile",
    adminTools: "Admin-Werkzeuge",
    eventAdministration: "Event-Verwaltung",
    lifetimePass: "Lifetime-Pass",
    promoCodes: "Promo-Codes",
    sensorySection: "Sinneserlebnis",
    cacheSection: "Cache & Speicher",
    liveUpdates: "Live-Updates",
    notifications: "Benachrichtigungen",
    switchMember: "Mitglied wechseln",

    // Current profile card
    noUserSelected: "Kein Profil ausgewählt. Wähle unten eines aus!",
    adminAccess: "Admin-Zugang",
    eventRolePrefix: "Event",
    switchProfile: "Wechseln",

    // Profile grid
    trophyCase: "Trophäen-Schrank (Profil)",
    manageUsers: "Profile verwalten",
    adminBadge: "Admin",

    // Add profile
    addUser: "Profil hinzufügen",
    newMemberPlaceholder: "Name des neuen Mitglieds …",
    adminPrivileges: "Admin-Rechte",
    adminPrivilegesHint: "Kann Biere für andere eintragen",
    creating: "Wird erstellt …",
    addMember: "Mitglied hinzufügen",
    startNewEvent: "Neues Event starten",
    resetEventData: "Event-Daten zurücksetzen",

    // Start-event modal
    eventNamePlaceholder: "Event-Name …",
    cancel: "Abbrechen",
    start: "Starten",
    passTypeDay: "Einzel-Event",
    passTypeWeek: "Wochenende",
    eventBenefits: "Unbegrenzte Funktionen für dieses Event",
    durationOneDay: "1 Tag",
    durationDaysSuffix: "Tage",

    // Event administration
    noEventMembers: "Für dieses Event gibt es noch keine Mitglieder.",
    addExistingUser: "Bestehendes Profil hinzufügen",
    allUsersInEvent: "Alle Profile sind bereits Teil dieses Events.",
    notInEvent: "nicht im Event",
    addToEvent: "Hinzufügen",
    roleAdmin: "Admin",
    roleMember: "Mitglied",
    removeMember: "Entfernen",

    // Physiology
    physiologySection: "Physiologie (Nüchternheits-Schätzung)",
    weightKg: "Gewicht (kg)",
    gender: "Geschlecht",
    genderMale: "Mann",
    genderFemale: "Frau",
    genderNeutral: "Divers",

    // Sensory
    psstSound: "«Psst!»-Sound abspielen",
    psstSoundHint:
      "Spielt beim Eintragen eines Biers ein knackiges Flaschenöffnen-Geräusch ab.",
    pourAnimation: "🍺 Einschenk-Animation",
    pourAnimationOn: "Animiertes Einschenken beim Eintragen zeigen",
    pourAnimationOff: "Stattdessen einfaches Feedback verwenden",

    // Live beer log
    liveBeerLogUpdates: "Live-Updates im Bierprotokoll",
    liveBeerLogHint:
      "Wenn aus, aktualisiert sich der Verlauf nur bei manuellem Neuladen.",

    // Notifications
    leadChangeAlerts: "Führungswechsel-Hinweise",
    milestoneSuffix: "Biere-Meilenstein",
    adminBroadcasts: "Admin-Durchsagen",
    newRoundAlerts: "Neue-Runde-Hinweise",
    notificationsHint:
      "Wähle, wann du Push-Hinweise zu Führungswechseln und Bier-Meilensteinen erhalten möchtest.",

    // Cache
    cacheSize: "Cache-Grösse",
    cachedQueries: "Zwischengespeicherte Abfragen",
    clearCache: "Cache leeren",
    cacheHint:
      "Zwischengespeicherte Daten ermöglichen die Offline-Ansicht und einen sofortigen Start.",

    // Lifetime pass
    lifetimePassCodes: "Lifetime-Pass-Codes",
    lifetimePassHint:
      "Owner können Codes erzeugen. Andere lösen sie für lebenslangen Zugang ein.",
    generating: "Wird erzeugt …",
    generateCode: "Code erzeugen",
    refreshing: "Wird aktualisiert …",
    refreshCodes: "Codes aktualisieren",
    noCodesYet: "Noch keine Codes erzeugt.",
    redeemCodeLabel: "Code einlösen",
    lifetimeCodePlaceholder: "Lifetime-Pass-Code eingeben …",
    redeeming: "Wird eingelöst …",
    redeemLifetimePass: "Lifetime-Pass einlösen",
    codeAvailable: "Verfügbar",
    redeemedByPrefix: "Eingelöst von",
    unknownUser: "Unbekannt",

    // Promo codes
    promoCodesHint: "Erzeuge Tages- oder Wochenend-Pässe für Aktionen.",
    generateDayPassCode: "Tagespass-Code erzeugen",
    generateWeekendPassCode: "Wochenendpass-Code erzeugen",
    noPromoCodesYet: "Noch keine Promo-Codes erzeugt.",
    redeemPromoCode: "Promo-Code einlösen",
    promoCodePlaceholder: "Promo-Code eingeben …",
    codeRedeemed: "Eingelöst",

    // Tier card
    currentTier: "Aktuelle Stufe",
    tierLifetime: "Supporter (Lifetime)",
    tierCraft: "Craft (Premium)",
    tierFree: "Pilsner (Gratis)",
    freeEvents: "Gratis-Events",
    dayPasses: "Tagespässe",
    weekendPasses: "Wochenendpässe",
    buySingleEvent: "Einzel-Event kaufen (CHF 10)",
    buyWeekendUnlimited: "Wochenende unbegrenzt kaufen (CHF 15)",
    becomeSupporter: "Supporter werden (CHF 100)",

    // Footer
    tagline: "Für Bierliebhaber gemacht 🍻",
    responsibilityNotice:
      "Nur für Personen ab 17 Jahren bzw. dem gesetzlichen Mindestalter für Alkoholkonsum. Bitte geniesse Alkohol verantwortungsvoll.",
  },
} as const;
