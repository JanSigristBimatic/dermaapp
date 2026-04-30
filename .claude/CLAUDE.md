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
├── Dermaapp.html       # Entry-Point, lädt app/styles.css + app/data.js + app/app.js
└── app/
    ├── styles.css      # Swiss-editorial Design-System (Fraunces + Manrope + JetBrains Mono)
    ├── data.js         # Globale Konstanten: FLASH, MC, MATCH, CLOZE, TF, FREE, IMG (200+ Items)
    └── app.js          # State-Maschine, 8 Lernmodi, Render-Logik
```

## Design-System (Tokens in `app/styles.css :root`)

| Token | Wert | Verwendung |
|---|---|---|
| `--paper` | `#F4EFE8` | Hintergrund (warmes Off-White) |
| `--ink` | `#1B1A18` | Haupttext |
| `--accent` | `#B43A2E` | Sienna-Rot (Schweizer-Kreuz-Derivat), Marker, CTAs |
| `--sec3..6` | moss/sienna/indigo/ochre | Sektion-Codes 3 bis 6 |
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
| 06 | `freetext` | `FREE[]` |
| 07 | `image` | `IMG[]` |
| 08 | `mix` | alle gemischt |

**Sektion-Filter:** `all`, `3`, `4`, `5`, `6` (siehe `SECTION_LABELS` in `app/app.js`).

## Datenmodell

Jedes Item hat `s` (Sektion 3-6) plus modus-spezifische Felder:
- Flash: `{s, q, a}`
- MC: `{s, q, options[], correct}`
- TF: `{s, q, a}` (`a` = boolean)
- Cloze: `{s, text, blanks[]}`
- Match: `{s, pairs[]}`
- Free: `{s, q, accept[]}`
- Image: `{s, src, q, ...}`

**Beim Hinzufügen neuer Items:** Sektion-ID konsistent halten, `app.js` muss nicht angepasst werden.

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

**Last Updated:** 2026-04-30
