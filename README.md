# Dermaapp

Lernapp für die Facharztprüfung **Dermatologie** im DACH-Raum, mit Fokus Schweiz. Open Education, Non-Profit, lokal gespeichert, keine Tracker.

## Features

- 8 Lernmodi: Karteikarten, Multiple Choice, Zuordnung, Lückentext, Wahr/Falsch, Freitext, Bildquiz, Mixquiz
- 4 Sektionen: Papulosquamös und Ekzem, Urtikaria und Erytheme, Blasenbildende Dermatosen, Adnexorgane
- Über 200 kuratierte Lerninhalte
- Score-Persistenz im Browser via `localStorage`
- Tastatur-Shortcuts und Streak-Tracking
- Swiss-editorial Design, vollständig responsive
- Keine Cookies, keine Drittanbieter-Tracker, keine Backend-Abhängigkeit

## Lokal starten

Doppelklick auf `Dermaapp.html` reicht. Wer einen lokalen Server bevorzugt:

```bash
python -m http.server 8000
```

Dann im Browser `http://localhost:8000/Dermaapp.html` öffnen.

## Tastatur-Shortcuts

| Taste | Aktion |
|---|---|
| `←` / `→` | Frage zurück / vor |
| `Space` | Karte umdrehen oder Antwort prüfen |
| `1` bis `4` | Multiple-Choice-Antwort wählen |
| `R` | Score zurücksetzen |

## Stack

Vanilla HTML, CSS und JavaScript. Kein Build-Step, keine Dependencies. Schriften via Google Fonts (Fraunces, Manrope, JetBrains Mono).

## Struktur

```
Dermaapp/
├── Dermaapp.html       Entry-Point
└── app/
    ├── styles.css      Design-System und Layout
    ├── data.js         Lerninhalte (FLASH, MC, MATCH, CLOZE, TF, FREE, IMG)
    └── app.js          State und Render-Logik
```

## Deployment

Das Verzeichnis ist statisch und kann auf jedem Static Host deployt werden, z. B. GitHub Pages, Vercel Static, Netlify oder ein eigener Webserver.

## Lizenz

Dual-Lizenz für Code und Inhalte:

- **Code** (HTML, CSS, JS, Konfig): [MIT-Lizenz](LICENSE) — frei verwendbar inkl. kommerziell.
- **Lerninhalte** (`app/data.js`, Fragen, Antworten, Mnemonics): [CC BY-NC-SA 4.0](LICENSE-CONTENT.md) — Namensnennung, nicht kommerziell, Weitergabe unter gleichen Bedingungen.

Inhalte orientieren sich an der SGDV-Facharztprüfung. Verwendung im Studium und in der Weiterbildung erlaubt und erwünscht.
