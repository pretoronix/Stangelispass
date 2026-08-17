/**
 * User-facing copy, German (DE) — the app's only shipping locale for 1.0.
 * Swiss orthography: ss, never ß. Keep in sync with web/legal and
 * docs/deployment/store-listing-copy.md.
 *
 * testIDs and accessibility labels live in ./labels.ts, not here.
 */
export const copy = {
  /** Strings shared by components that are not owned by a single screen. */
  common: {
    cancel: "Abbrechen",
    close: "Schliessen",
    share: "Teilen",
    error: "Fehler",
    success: "Erfolg",
    admin: "Admin",
    beers: "Biere",
    price: "Preis",
    notAuthorized: "Nicht berechtigt",
    selectUser: "Profil wählen",
    unavailable: "Nicht verfügbar",
    enterCode: "Code eingeben",
    ok: "OK",
    retry: "Erneut versuchen",
    delete: "Löschen",
    discard: "Verwerfen",
    remove: "Entfernen",
    reset: "Zurücksetzen",
    clear: "Leeren",
    nice: "Super!",
    offlineNotice:
      "Offline – Änderungen werden synchronisiert, sobald du wieder online bist.",
    beerLogged: "Bier eingetragen!",

    // Error boundaries
    somethingWentWrong: "Etwas ist schiefgelaufen",
    tryAgain: "Erneut versuchen",
    copyErrorDetails: "Fehlerdetails kopieren",
    featureUnavailable: "Funktion nicht verfügbar",
    retrySection: "Bereich neu laden",

    // QR scanner
    qrRequestingPermission: "Kamerazugriff wird angefragt …",
    qrPermissionNeeded:
      "Für das Scannen von QR-Codes wird die Kamera benötigt.",
    qrGrantPermission: "Zugriff erlauben",
    qrOpenSettings: "Einstellungen öffnen",
    qrCenterHint: "QR-Code hier zentrieren",

    // Comments
    comment: "Kommentar",
    commentPlaceholder: "Kommentar hinzufügen …",
    commentsLoading: "Kommentare werden geladen …",
    commentsLoadFailed: "Kommentare konnten nicht geladen werden",
    commentsEmpty: "Noch keine Kommentare",
    commentsBeFirst: "Sei die erste Person, die kommentiert!",

    // MVP recap
    brewmasterOfTheNight: "BRAUMEISTER DES ABENDS",
    stangeli: "STÄNGELI",
    legendsNeverDie:
      "Legenden sterben nie. Sie holen sich einfach noch eine Runde. 🍻",
    saveToCameraRoll: "In Fotos sichern & schliessen",
    closeWithoutSaving: "Ohne Sichern schliessen",

    // Safe ride
    safeRideMonitor: "Safe-Ride-Monitor",
    estimatedBac: "Gesch. BAK",
    untilZero: "Bis 0 ‰",
    overTheLimit: "Du bist über dem Limit. Bitte fahre nicht.",
    callTaxi: "Taxi rufen",
    orderUber: "Uber bestellen",

    // Velocity
    velocityTitle: "Tempo (Pace)",
    beersPerHour: "Biere/Std.",
    savePace: "Tempo merken",
    clearPace: "Zurücksetzen",

    // Invite
    inviteTitle: "Freund einladen",
    inviteSecure: "Sichere Peer-to-Peer-Einladung",

    // Broadcast
    broadcastPlaceholder: "Nachricht eingeben …",

    alerts: {
      updateFailed: "Aktualisierung fehlgeschlagen",
      configRequired: "Konfiguration erforderlich",
      supabaseOffline:
        "Supabase ist nicht konfiguriert. Die App läuft im Offline-Modus.",
      copied: "Kopiert",
      copiedDetails:
        "Fehlerdetails wurden in die Zwischenablage kopiert. Bitte teile sie mit den Entwicklern.",
      saved: "Gesichert!",
      cardSaved: "Deine Braumeister-Karte wurde in deinen Fotos gesichert.",
      permissionDenied: "Zugriff verweigert",
      enablePhotoAccess:
        "Erlaube den Zugriff auf die Fotomediathek in den Einstellungen, um Bilder zu sichern.",
      sharingNotAvailable: "Teilen nicht verfügbar",
      shareImageFailed:
        "Bild konnte nicht geteilt werden. Bitte versuche es erneut.",
      noFileSystem: "Auf diesem Gerät ist kein Dateisystem verfügbar.",
      noSharing: "Teilen ist auf diesem Gerät nicht verfügbar.",
      invalidQr: "Ungültiger QR-Code",
      unknownQr: "Dieser Code wird von Stängelispass nicht erkannt.",
      commentTooLong: "Kommentar zu lang",
      commentTooLongMessage: "Kommentare dürfen höchstens 500 Zeichen haben.",
      deleteComment: "Kommentar löschen",
      commentAddFailed:
        "Kommentar konnte nicht hinzugefügt werden. Bitte versuche es erneut.",
      commentDeleteFailed:
        "Kommentar konnte nicht gelöscht werden. Bitte versuche es erneut.",
      broadcastSent: "Durchsage gesendet! 📢",
      broadcastFailed: "Senden fehlgeschlagen",
      broadcastUnexpected: "Ein unerwarteter Fehler ist aufgetreten.",
      discardMessage: "Nachricht verwerfen?",
      discardMessageHint: "Deine Nachricht geht verloren.",
    },
  },

  home: {
    startRound: "Runde starten",
    whoPays: "Wer zahlt?",
    endRound: "Runde beenden",
    invite: "Einladen",
    shareLeaderboard: "Rangliste teilen",
    scan: "Scannen",
    export: "Export",
    notifyAll: "Alle benachrichtigen",
    noActiveRound: "Keine aktive Runde",
    firstRoundFree: "Die erste Runde ist immer gratis!",
    leaderPrefix: "Spitze:",
    pointsSuffix: "Pkt.",
    hotStreakPrefix: "Lauf:",
    stangeliTotal: "Stängeli total",
    totalBill: "Gesamtrechnung",
    leaderboard: "Rangliste",
    empty: "Noch keine Biere eingetragen!",
    emptyHint: "Zeit, loszulegen?",
    beerPriceLabel: "Bierpreis (CHF):",
    namePlaceholder: "Dein Name",
    pricePlaceholder: "5.00",
    alerts: {
      noActiveRound: "Keine aktive Runde",
      adminRequired: "Admin erforderlich",
      passRequired: "Pass erforderlich",
      adminOnlyStartRound: "Nur Admins können eine Runde starten.",
      invalidPrice: "Ungültiger Preis",
      priceMustBePositive: "Der Bierpreis muss grösser als 0 sein.",
      joined: "Beigetreten!",
      couldNotCreateUser:
        "Profil konnte nicht erstellt werden. Bitte versuche es erneut.",
      actionFailed:
        "Diese Aktion konnte nicht abgeschlossen werden. Bitte versuche es erneut.",
      startRoundFailed:
        "Runde konnte nicht gestartet werden. Bitte versuche es erneut.",
      whoPaysNoBeers: "Es hat noch niemand ein Bier eingetragen!",
      roundIsOn: "🍻 Die Runde geht auf …",
      cheers: "Prost!",
      getWalletReady: "Mach schon mal das Portemonnaie bereit.",
      leaderboardLink: "Ranglisten-Link",
      linkCopied: "Link kopiert",
      leaderboardLinkCopied: "Ranglisten-Link in die Zwischenablage kopiert.",
      export: "Export",
      exportNoRound: "Keine aktive Runde zum Exportieren.",
      exportNoBeers: "Für dieses Event sind noch keine Biere eingetragen.",
      exportFailed: "Daten konnten nicht exportiert werden.",
      csvDownloaded: "CSV erfolgreich heruntergeladen!",
      csvSaved: "CSV im Gerätespeicher gesichert.",
      stamp: "Stempel",
      stampRedeemed: "Stempel eingelöst",
      stampAdded: "+1 Bier erfolgreich hinzugefügt.",
      stampFailed: "Beim Einlösen des Stempels ist ein Fehler aufgetreten.",
      stampInvalid: "Dieser Stempel ist ungültig.",
      stampAlreadyRedeemed: "Dieser Stempel wurde bereits eingelöst.",
      stampExpired: "Dieser Stempel ist abgelaufen.",
      stampsUnavailable:
        "Die Stempel-Funktion ist in der Datenbank noch nicht verfügbar.",
      stampRedeemFailed: "Stempel konnte nicht eingelöst werden.",
      wrongRound: "Falsche Runde",
      qrOtherEvent: "Dieser QR-Code gehört zu einem anderen Event.",
      qrNoActiveRound: "Dieser QR-Code ist mit keiner aktiven Runde verknüpft.",
      joinFailed: "Beitritt zur Runde fehlgeschlagen. Bitte versuche es erneut.",
      logBeerFailed:
        "Bier konnte nicht eingetragen werden. Bitte versuche es erneut.",
      scanFailed: "Scan konnte nicht verarbeitet werden.",
      adminOnlyLogForOthers:
        "Nur Admins können Biere für andere Profile eintragen.",
      organizerOnlyScan:
        "Nur Organisatoren können Teilnehmer-QR-Codes scannen.",
      selectUserForStamp:
        "Wähle zuerst in den Einstellungen ein Profil, um Stempel einzulösen.",
      selectUserForScan:
        "Wähle zuerst in den Einstellungen ein Profil, um Bier-QR-Codes zu scannen.",
      achievementUnlocked: "🏆 Erfolg freigeschaltet!",
    },
  },

  add: {
    whosDrinking: "Wer trinkt?",
    readyForBeer: "Bereit für ein Bier?",
    addBeer: "1 Bier eintragen!",
    stampQr: "Stempel-QR (+1)",
    userQr: "Profil-QR (Admin-Eintrag)",
    participantQr: "Teilnehmer-QR (Organisator-Scan)",
    shareQr: "QR teilen",
    noUsers: "Keine Profile gefunden. Lege in den Einstellungen welche an!",
    alerts: {
      queued: "In Warteschlange",
      queuedHint: "Das Bier wird eingetragen, sobald du wieder online bist.",
      addBeerFailed:
        "Bier konnte nicht hinzugefügt werden. Bitte versuche es erneut.",
      shareQrFailed: "QR-Code konnte nicht geteilt werden.",
      qrImageTimeout: "QR-Bild konnte nicht erzeugt werden (Zeitüberschreitung).",
      stampQrFailed: "Stempel-QR konnte nicht erstellt werden.",
      legacyQr: "Alter QR-Code",
      legacyQrHint:
        "Die Stempel-Tabelle ist noch nicht verfügbar. Es wird ein alter QR-Code erzeugt (nicht einmalig).",
      stampUnavailable:
        "Stempel können erst ausgegeben werden, wenn die Datenbank bereit ist.",
      achievementUnlocked: "🏆 Erfolg freigeschaltet!",
    },
  },

  profile: {
    title: "Trophäen-Schrank",
    goToSettings: "Zu den Einstellungen",
    selectUserFirst: "Wähle zuerst in den Einstellungen ein Profil.",
    currentRoundSpending: "Ausgaben der aktuellen Runde",
    sobernessEstimator: "Nüchternheits-Schätzung",
    consumptionStats: "Konsum-Statistik",
    totalCost: "Gesamtkosten",
    beerCount: "Biere",
    pricePerBeer: "Preis pro Bier",
    lastLog: "Letzter Eintrag",
    lifetime: "Insgesamt",
    yourTotal: "Dein Total",
    noBadges: "Noch keine Abzeichen. Auf geht's! 🍻",
    bacDisclaimer:
      "Die Angaben dienen ausschliesslich der «Just for fun»-BAK-Schätzung.",
  },

  history: {
    title: "Verlauf",
    empty: "Der Verlauf ist leer.",
    alerts: {
      notAuthorized: "Nicht berechtigt",
      adminOnlyRemove: "Nur Admins können Biere entfernen.",
      removeFailed: "Bier konnte nicht entfernt werden.",
    },
  },

  legends: {
    title: "Legenden-Galerie",
    subtitle: "Wall of Fame von Stängelispass",
    empty: "Die Halle der Legenden wartet noch …",
    beers: "BIERE",
  },

  leaderboard: {
    title: "Rangliste",
    empty: "Noch keine Biere eingetragen.",
    adminBadge: "ADMIN",
  },

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

    alerts: {
      // Cache
      clearCacheTitle: "Cache leeren",
      clearCacheHint:
        "Damit werden alle zwischengespeicherten Daten entfernt. Die App lädt anschliessend frische Daten vom Server.",
      cacheCleared: "Cache erfolgreich geleert",
      cacheClearFailed: "Cache konnte nicht geleert werden",

      // Users
      enterName: "Bitte gib einen Namen ein",
      addUserFailed: "Profil konnte nicht hinzugefügt werden",
      userCreateFailed:
        "Profil konnte nicht erstellt werden. Prüfe deine Datenbankverbindung.",
      userSelected: "Profil ausgewählt",

      // Events
      noUser: "Kein Profil",
      selectUserBeforeEvent: "Wähle ein Profil, bevor du ein Event startest.",
      enterEventName: "Gib einen Namen für das Event ein.",
      adminOnlyStartEvent: "Nur Admins können neue Events starten.",
      eventStarted: "Event gestartet",
      eventNowActive: "Ein neues Event ist jetzt aktiv.",
      startEventFailed: "Event konnte nicht gestartet werden.",
      resetEventTitle: "Event-Daten zurücksetzen",
      resetEventHint:
        "Damit werden Events, Biere, Erfolge, Wall of Fame, Benachrichtigungen und Gerätetokens gelöscht. Profile bleiben erhalten. Fortfahren?",
      adminOnlyReset: "Nur Admins können Event-Daten zurücksetzen.",
      resetComplete: "Zurücksetzen abgeschlossen",
      eventDataCleared: "Die Event-Daten wurden gelöscht.",
      partialReset: "Teilweise zurückgesetzt",
      partialResetHint:
        "Einige Tabellen konnten nicht geleert werden. Prüfe die Logs.",
      resetFailed: "Event-Daten konnten nicht zurückgesetzt werden.",
      notAllowed: "Nicht erlaubt",
      ownerRoleFixed: "Die Owner-Rolle kann hier nicht geändert werden.",
      ownerNotRemovable: "Der Owner kann nicht aus dem Event entfernt werden.",
      roleUpdateFailed: "Rolle konnte nicht aktualisiert werden.",
      memberAdded: "Hinzugefügt",
      addMemberFailed: "Mitglied konnte diesem Event nicht hinzugefügt werden.",
      removeMemberTitle: "Mitglied entfernen",
      removeMemberFailed: "Mitglied konnte nicht entfernt werden.",

      // Passes and codes
      passRequired: "Pass erforderlich",
      codeGenerated: "Code erzeugt",
      generateCodeFailed: "Code konnte nicht erzeugt werden.",
      generatePromoFailed: "Promo-Code konnte nicht erzeugt werden.",
      adminOnlyPromo: "Nur Admins können Promo-Codes erzeugen.",
      ownerOnlyLifetime: "Nur App-Owner können Lifetime-Pass-Codes erzeugen.",
      enterPromoCode: "Bitte gib einen Promo-Code ein.",
      enterLifetimeCode: "Bitte gib einen Lifetime-Pass-Code ein.",
      selectUserBeforeRedeem:
        "Wähle ein Profil, bevor du einen Code einlöst.",
      selectUserBeforePurchase: "Wähle ein Profil, bevor du etwas kaufst.",
      redeemFailed: "Einlösen fehlgeschlagen",
      redeemCodeFailed: "Code konnte nicht eingelöst werden.",
      codeRedeemed: "Code erfolgreich eingelöst.",
      lifetimeActivated: "Lifetime-Pass aktiviert. Viel Spass!",
      lifetimeUnlocked: "Lebenslanger Zugang freigeschaltet.",
      eventPassAdded: "Event-Pass zu deinem Profil hinzugefügt.",
      purchaseComplete: "Kauf abgeschlossen",
      purchaseFailed: "Kauf fehlgeschlagen",
      purchaseIncomplete: "Kauf konnte nicht abgeschlossen werden.",
      iapNotOnWeb: "In-App-Käufe werden im Web nicht unterstützt.",
      paymentPreview: "Zahlung (Vorschau)",
      supporterPreview: "Supporter (Vorschau)",
      supporterActivated: "Supporter aktiviert",
      supporterPreviewHint:
        "Lifetime-Supporter — CHF 100\n\nZahlungen sind noch nicht aktiviert. Dies markiert dich nur in der App als Supporter.",
      promoCodesUnavailable:
        "Promo-Codes sind erst verfügbar, wenn die Datenbank bereit ist.",
      eventCreditsUnavailable:
        "Event-Guthaben sind erst verfügbar, wenn die Datenbank bereit ist.",
      lifetimeCodesUnavailable:
        "Lifetime-Pass-Codes sind erst verfügbar, wenn die Datenbank bereit ist.",

      // Notifications
      notificationSaveFailed:
        "Benachrichtigungs-Einstellungen konnten nicht gespeichert werden.",
    },

    // Footer
    tagline: "Für Bierliebhaber gemacht 🍻",
    responsibilityNotice:
      "Nur für Personen ab 17 Jahren bzw. dem gesetzlichen Mindestalter für Alkoholkonsum. Bitte geniesse Alkohol verantwortungsvoll.",
  },
} as const;
