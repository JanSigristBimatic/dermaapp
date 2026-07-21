# Dermaapp

Open-Education-Lernapp für die Facharztprüfung **Dermatologie** im DACH-Raum (Hauptregion Schweiz). Vanilla HTML/CSS/JS, ohne Build-Step, lokale Speicherung via `localStorage`.

## Quick Facts

| | |
|---|---|
| **Zielgruppe** | Assistenzärzte/innen Dermatologie, DACH (CH-Fokus) |
| **Charakter** | Non-Profit, Open Education, keine Tracker, keine Cookies |
| **Stack** | Vanilla JS, kein Framework, kein Build, keine Dependencies |
| **Persistence** | `localStorage` (Key: `dermaapp_v1`), nur Score |
| **Sprache (UI)** | Deutsch |
| **Hosting** | Static (jeder Webserver, GitHub Pages, Vercel Static) |

## Verzeichnisstruktur

```
Dermaapp/
├── Dermaapp.html       # Entry-Point, lädt styles.css + data.js + content/*.js + app.js
└── app/
    ├── styles.css      # Swiss-editorial Design-System (Fraunces + Manrope + JetBrains Mono)
    ├── data.js         # Globale Konstanten FLASH, MC, MATCH, CLOZE, TF, FREETEXT, IMG (Basis-Items Sektion 3-6)
    ├── app.js          # State-Maschine, 8 Lernmodi, Render-Logik (Sektionen dynamisch aus SECTION_LABELS)
    └── content/        # Pro Sektion eine Datei, hängt via IIFE an die globalen Arrays an
        ├── sec02.js    # Pruritus & Psyche (Cap 50)
        ├── sec03.js … sec06.js   # Erweiterungen der Basis-Sektionen
        ├── sec07.js, sec08.js, sec10.js, sec11.js, sec12.js, sec13.js
        └── medis.js    # Medikamente/Pharmakologie (Sektion s:20)
```

**Content-Dateien:** Jede `content/secNN.js` ist eine IIFE, die lokale Arrays definiert und
mit `FLASH.push(...)` etc. an die in `data.js` deklarierten Globals anhängt. Neue Sektionen
werden ausschliesslich in `SECTION_LABELS`/`SECTION_CHIPS` (`app.js`) registriert; Filter-Chips,
Sidebar-Ringe und `perSection` leiten sich davon dynamisch ab. Für eine neue Sektion zusätzlich
das Script-Tag in `Dermaapp.html` und ein `--secNN`-Token samt `.section-tag.sNN` in `styles.css`.

## Design-System (Tokens in `app/styles.css :root`)

| Token | Wert | Verwendung |
|---|---|---|
| `--paper` | `#F4EFE8` | Hintergrund (warmes Off-White) |
| `--ink` | `#1B1A18` | Haupttext |
| `--accent` | `#B43A2E` | Sienna-Rot (Schweizer-Kreuz-Derivat), Marker, CTAs |
| `--sec2..sec20` | muted editorial Farbtöne | Sektion-Codes (2,3,4,5,6,7,8,10,11,12,13,20) |
| `--serif` | Fraunces | Display, Brandname, Hero |
| `--sans` | Manrope | UI |
| `--mono` | JetBrains Mono | medizinische IDs, Mode-Nummern, Codes |

**Aesthetic-Regel:** Klinisch elegant. Keine Bouncing-/Cartoon-Effekte. Animationen subtil (Stagger-Reveal, Cross-Fade, Tab-Pill, Streak-Pop). Fokus: Lernen, nicht Gamification.

## Lernmodi (Tabs, 01 bis 08)

| Nr | Mode-ID | Datenquelle |
|---|---|---|
| 01 | `flash` | `FLASH[]` |
| 02 | `mc` | `MC[]` |
| 03 | `match` | `MATCH[]` |
| 04 | `cloze` | `CLOZE[]` |
| 05 | `tf` | `TF[]` |
| 06 | `freetext` | `FREETEXT[]` |
| 07 | `image` | `IMG[]` |
| 08 | `mix` | alle gemischt |

**Sektion-Filter:** `all` plus alle Sektionen mit Inhalten: `2,3,4,5,6,7,8,10,11,12,13,20` (`20` = Medikamente). Chips werden dynamisch aus `SECTION_LABELS`/`SECTION_CHIPS` (`app/app.js`) erzeugt und nur angezeigt, wenn die Sektion Items hat.

## Datenmodell

Jedes Item hat `s` (Sektionsnummer) plus modus-spezifische Felder:
- Flash: `{s, q, a}`
- MC: `{s, q, o:[4 Optionen], c:Index 0-3, e:Erklärung}`
- TF: `{s, st:Aussage, c:boolean, e:Erklärung}`
- Cloze: `{s, parts:[Text,"BLANK",…], a:[Lösungen]}` (Anzahl `"BLANK"` == Länge `a`)
- Match: `{s, t:Titel, p:[[links,rechts],…]}`
- Freetext: `{s, q, a:Musterlösung}`
- Image: `{s, cap, q, o:[4], c, e, svg:\`<svg…>\`}` (self-contained SVG, keine externen Referenzen)

**Beim Hinzufügen neuer Items:** Sektion-ID konsistent halten. Für bestehende Sektionen genügt
Anhängen in der passenden `content/secNN.js`. Für eine neue Sektion siehe oben (SECTION_LABELS +
Script-Tag + CSS-Token).

## Tastatur-Shortcuts (in `app.js` registriert)

| Taste | Aktion |
|---|---|
| `←` / `→` | vorherige / nächste Frage |
| `Space` | Karte umdrehen / Antwort prüfen |
| `1` bis `4` | MC-Antwort wählen |
| `R` | Score zurücksetzen |

## Coding-Konventionen

- **Keine Build-Tools, keine Dependencies, keine Polyfills.** Wenn ein Feature einen Build verlangt, vorher mit dem User abklären.
- **Code-Kommentare auf Englisch**, UI-Texte auf Deutsch.
- **Keine** zusätzlichen Frameworks (kein React, kein jQuery, kein Tailwind).
- Globale Konstanten in `data.js`, Mutable State nur in der `state`-Konstante in `app.js`.
- DOM-Manipulation via `innerHTML` ist im Projekt akzeptiert (Performance unkritisch). Bei User-Input zwingend `escapeHtml()` verwenden.
- **CleanCode-Skill** anwenden bei Refactorings.
- **Niemals** `localStorage`-Key `dermaapp_v1` umbenennen ohne Migration, sonst verlieren bestehende Lernende ihren Score.

## Definition of Done

- [ ] Datei `Dermaapp.html` öffnet sich lokal ohne Konsolen-Fehler (Doppelklick reicht)
- [ ] Alle 8 Lernmodi schalten ohne Fehler durch
- [ ] Sektion-Filter (`all` / 3 / 4 / 5 / 6) funktioniert in jedem Modus
- [ ] Score persistiert nach Reload
- [ ] Tastatur-Shortcuts reagieren
- [ ] Mobile-Viewport (375px) bleibt benutzbar
- [ ] Keine externen Tracker, keine Cookies, keine Drittanbieter-Skripte ausser den `fonts.googleapis.com`-Imports

## Commands

| Aktion | Command |
|---|---|
| Lokal öffnen | Doppelklick auf `Dermaapp.html` (oder `start Dermaapp.html` auf Windows) |
| Lokaler Server (optional) | `python -m http.server 8000` und `http://localhost:8000/Dermaapp.html` |
| Statisches Deploy | Verzeichnis 1:1 hochladen (z. B. via Vercel/GitHub Pages) |

## Context Management

- Beim Lesen von `app/data.js` (~94 KB, 2000+ Zeilen): **niemals komplett laden**, immer mit `offset`/`limit` arbeiten oder gezielt mit `Grep` nach Sektion/Stichwort suchen.
- Beim Lesen von `app/app.js` (~36 KB): zuerst Grep nach betroffener Render-Funktion, dann nur den Block lesen.
- Beim Lesen von `app/styles.css` (~26 KB): zuerst nach Token oder Klassenname greppen.

## Required Skills

- `CleanCode` für Refactoring
- `animejs-animation-expert` **nur** wenn der User Animationen explizit ausbauen will (aktuell pures CSS, keine Library)
- `seo-aio-optimizer` falls eine öffentliche Landingpage entsteht

**Last Updated:** 2026-07-21
