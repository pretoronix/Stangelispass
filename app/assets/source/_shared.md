# Stängelispass — Icon-Quellen

Alle Icons werden aus den SVGs in diesem Ordner gerendert. Nicht die PNGs
direkt bearbeiten — SVG ändern und `app/scripts/generate-assets.mjs` laufen lassen.

## Motiv

Eine "Stange" (Schweizer Bierglas) mit Schaumkrone, umschlossen von einem
doppelten Kreisring — der Ring zitiert den Stempel/Siegel eines Passes
("Stängelispass" = Bier + Pass mit Stempeln).

## Palette (aus dem App-Design abgeleitet)

| Token        | Hex       | Herkunft                          |
| ------------ | --------- | --------------------------------- |
| Navy (BG)    | `#1a1a2e` | `app.json` splash/adaptiveIcon    |
| Gold         | `#ffd700` | häufigste Akzentfarbe in `src/`   |
| Amber        | `#f59e0b` | Sekundärakzent                    |
| Amber dunkel | `#d97706` | Verlaufsende Bier                 |
| Braun        | `#92400e` | Bodensatz/Schatten                |
| Schaum       | `#fffdf5` | aus `#ffffff` abgeleitet          |

## Dateien

| Quelle              | Ziel                          | Besonderheit                             |
| ------------------- | ----------------------------- | ---------------------------------------- |
| `icon.svg`          | `../icon.png` 1024²           | randvoll, **ohne Alpha** (Apple)          |
| `adaptive-icon.svg` | `../adaptive-icon.png` 1024²  | transparent, Motiv in zentralen 66 %      |
| `splash-icon.svg`   | `../splash-icon.png` 1024²    | transparent, reduziert (Glas ohne Ring)   |
| `icon.svg`          | `../favicon.png` 256²         | randvoll                                  |

Kein Text im Icon (Apple-Praxis), keine eigenen abgerundeten Ecken —
iOS maskiert selbst.
