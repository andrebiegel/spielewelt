# Level JSON Schema — Super Jumper

Jedes Level liegt als `level-XX.json` in diesem Verzeichnis.
Neue Datei anlegen = neues Level erscheint automatisch in der Auswahl.

## Dateiname-Konvention und Sortierung

Dateien werden per `import.meta.glob('./levels/level-*.json')` geladen.
Die **Anzeigereihenfolge in der Level-Auswahl richtet sich ausschließlich nach dem `id`-Feld**
in der JSON — nicht nach dem Dateinamen.

Empfehlung: Dateiname und `id` konsistent halten, damit beides deckungsgleich ist:

| Dateiname | `"id"` | Angezeigte Position |
|-----------|--------|---------------------|
| `level-01.json` | `1` | 1. |
| `level-02.json` | `2` | 2. |
| `level-03.json` | `3` | 3. |

Eine Datei `level-03.json` mit `"id": 1` würde trotzdem als **erstes** angezeigt werden.
Der Dateiname selbst hat auf die Reihenfolge keinen Einfluss.

---

## Koordinatensystem

```
(0,0) ──────────────────────────────► X  (world.width)
  │
  │   Spielwelt
  │
  ▼
  Y  (world.height)
```

- **X** wächst nach **rechts** (0 = linker Rand)
- **Y** wächst nach **unten** (0 = oberer Rand)
- Der Boden liegt bei `world.height - 32` (32px = halbe Bodenkachel-Höhe)
- Für Level 1: Boden bei Y = 568, Bodenfläche bei Y = 552–584

---

## Felder

### Toplevel

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `number` | Eindeutige ID, bestimmt Sortierreihenfolge. `1, 2, 3, ...` |
| `name` | `string` | Anzeigename auf der Level-Karte und im HUD. z. B. `"Level 1"` |
| `subtitle` | `string` | Kurze Stimmungsbeschreibung. z. B. `"Der Anfang"` |
| `locked` | `boolean` | `true` = Schloss-Icon, nicht spielbar. `false` = spielbar |

---

### `world`

| Feld | Typ | Bereich | Beschreibung |
|------|-----|---------|--------------|
| `width` | `number` | `800 – 9999` | Gesamtbreite der Spielwelt in Pixeln. Empfohlen: Vielfaches von 64. Standard: `3200` |
| `height` | `number` | `400 – 2000` | Gesamthöhe der Spielwelt in Pixeln. Standard: `600`. Wird selten geändert |
| `bgColor` | `string` | Hex `"0xRRGGBB"` | Hintergrundfarbe (Himmel). z. B. `"0x5c94fc"` (Blau), `"0x1a1a2e"` (Nacht) |
| `groundColor` | `string` | Hex `"0xRRGGBB"` | Einfärbung der Boden-Kacheln per Tint. z. B. `"0x228B22"` (Grün) |
| `platformColor` | `string` | Hex `"0xRRGGBB"` | Einfärbung der Plattform-Kacheln per Tint. z. B. `"0x8B4513"` (Braun) |
| `cloudCount` | `number` | `0 – 40` | Anzahl zufällig platzierter Wolken. `0` = keine. Nur sinnvoll wenn `starCount = 0` |
| `starCount` | `number` | `0 – 200` | Anzahl zufälliger Sterne (für Nacht-Level). `0` = keine |

> **Tipp Farben:** Tools wie [coolors.co](https://coolors.co) oder der Browser-DevTools-Colorpicker liefern Hex-Werte. `#5c94fc` → JSON: `"0x5c94fc"` (Raute durch `0x` ersetzen).

> **Tipp Wolken vs. Sterne:** Genau eines der beiden sollte > 0 sein. Beide auf 0 = leerer Hintergrund (auch gültig).

---

### `physics`

| Feld | Typ | Bereich | Beschreibung |
|------|-----|---------|--------------|
| `gravity` | `number` | `200 – 1200` | Schwerkraft in px/s². Höher = schnellerer Fall = schwieriger. Standard: `600`. Niedrig (`300`) = Mondgefühl, Hoch (`900`) = sehr schwer |
| `playerSpeed` | `number` | `80 – 500` | Laufgeschwindigkeit in px/s. Standard: `220`. Langsam (`120`) = gemächlich, Schnell (`350`) = rasant |
| `jumpPower` | `number` | `200 – 800` | Sprungimpuls in px/s. Standard: `480`. Niedriger Wert = kurzer Sprung, Höherer Wert = hoher Sprung. Muss zur `gravity` passen: bei `gravity: 900` braucht man mind. `600` um Plattformen zu erreichen |

> **Faustformel Sprung-Höhe:** `jumpPower² / (2 × gravity)` = maximale Sprunghöhe in Pixeln.
> Bei `jumpPower: 480, gravity: 600` → `480² / 1200 ≈ 192px` maximale Höhe.

---

### `player`

| Feld | Typ | Bereich | Beschreibung |
|------|-----|---------|--------------|
| `startX` | `number` | `32 – world.width - 32` | X-Startposition des Spielers. Empfohlen: nahe am linken Rand, z. B. `120` |
| `startY` | `number` | `0 – world.height - 80` | Y-Startposition. Für Boden-Start: `world.height - 80` (= `520` bei height 600) |
| `lives` | `number` | `1 – 9` | Startleben. Standard: `3`. Angezeigt als ❤️-Symbole im HUD |

---

### `platforms`

Array von Plattform-Clustern. Jeder Cluster ist eine Reihe horizontaler 64px-Kacheln.

```json
{ "x": 300, "y": 420, "tiles": 4 }
```

| Feld | Typ | Bereich | Beschreibung |
|------|-----|---------|--------------|
| `x` | `number` | `0 – world.width - 64` | X-Position der **linken Kante** der ersten Kachel. Nicht der Mittelpunkt |
| `y` | `number` | `80 – world.height - 80` | Y-Position der **Oberkante** der Plattform. Höherer Y-Wert = tiefer im Bild. Niedrigster sinnvoller Wert: `~80` (oberer Rand), Höchster: kurz über dem Boden |
| `tiles` | `number` | `1 – 20` | Anzahl aneinandergereihter 64px-Kacheln. `1` = 64px breit, `4` = 256px breit, `8` = 512px breit |
| `type` | `string` | siehe Tabelle | **Optional.** Visueller Plattform-Typ. Fehlt das Feld, wird `"grass"` verwendet. Hat keinen Einfluss auf die Physik |

**Plattform-Typen:**

| `type` | Aussehen | Empfohlenes Setting |
|--------|----------|---------------------|
| `"grass"` | Braune Erde mit grüner Gras-Oberkante | Standard, Outdoor-Level |
| `"stone"` | Grauer Stein mit Fugen und Rissen | Höhlen, Festungen |
| `"wood"` | Goldfarbenes Holz mit Maserung und Bretterstruktur | Baumhäuser, Schiffe |
| `"ice"` | Hellblaues Eis mit Glanzflecken und Rissen | Winter-Level, Höhenpassagen |

**Y-Orientierung (Beispiele bei world.height = 600):**

| Y-Wert | Position |
|--------|----------|
| `80` | Sehr hoch oben — kaum erreichbar ohne Mehrfachsprung |
| `150` | Hoch — braucht guten Sprung |
| `250` | Mittlere Höhe |
| `380` | Niedriger — leicht zu erreichen |
| `520` | Bodennähe — fast auf Bodenniveau |
| `568` | Genau auf Bodenhöhe (= Boden, kein freier Raum darunter) |

**Erreichbarkeit prüfen:**
Sprung-Höhe = `jumpPower² / (2 × gravity)`. Plattform ist erreichbar wenn der Y-Abstand zur aktuellen Position ≤ Sprung-Höhe.
Bei `jumpPower: 480, gravity: 600`: max. ~192px Höhenunterschied pro Sprung.

**Plattformbreite:**

| `tiles` | Breite | Schwierigkeit |
|---------|--------|---------------|
| `1` | 64 px | Sehr schmal — präzise Landung nötig |
| `2` | 128 px | Schmal |
| `3` | 192 px | Mittel |
| `4` | 256 px | Komfortabel |
| `6` | 384 px | Breit |
| `8` | 512 px | Sehr breit |

**Abstand zwischen Plattformen:**
Für begehbare Übergänge ohne Sprung: `x2 - (x1 + tiles1 × 64)` sollte `≤ 200px` sein (Spielerbreite 32px + Sprungweite).
Horizontale Sprungweite ≈ `playerSpeed × (2 × jumpPower / gravity)`.
Bei Standard-Werten: `220 × (960 / 600) ≈ 352px` — das ist die maximale horizontale Distanz bei einem Sprung.

---

### `coins`

Array von Münz-Positionen. Münzen geben +10 Punkte.

```json
{ "x": 380, "y": 380 }
```

| Feld | Typ | Bereich | Beschreibung |
|------|-----|---------|--------------|
| `x` | `number` | `0 – world.width` | X-Mittelpunkt der Münze |
| `y` | `number` | `0 – world.height` | Y-Mittelpunkt der Münze. Typisch 20–40px **über** einer Plattform platzieren (Plattform-Y minus 30) |

**Größe und Abstände:**

- Sprite: **16×16 px**, Ankerpunkt in der **Mitte** (`x`/`y` = Mittelpunkt)
- Münze belegt also 8px nach links, 8px nach rechts, 8px nach oben, 8px nach unten
- **Minimaler Abstand** zwischen zwei Münzen ohne Überlappung: **≥ 16px** (Mitte zu Mitte)
- Empfohlener Abstand für komfortables Einsammeln: **32–64px** (Mitte zu Mitte)

```
Münze bei x=380:  belegt x = 372 – 388
Münze bei x=460:  belegt x = 452 – 468
Abstand Mitte–Mitte: 80px → keine Überlappung ✓

Münze bei x=380:  belegt x = 372 – 388
Münze bei x=390:  belegt x = 382 – 398
Abstand Mitte–Mitte: 10px → Überlappung ✗ (< 16px)
```

---

### `enemies`

Array von Gegnern. Gegner patrouillieren horizontal. Berührung kostet 1 Leben (außer Sprung von oben: Gegner stirbt, +20 Punkte).

```json
{ "x": 450, "y": 396, "patrolLeft": 310, "patrolRight": 570, "speed": 80 }
```

| Feld | Typ | Bereich | Beschreibung |
|------|-----|---------|--------------|
| `x` | `number` | `patrolLeft – patrolRight` | X-Startposition des Gegners. Muss zwischen `patrolLeft` und `patrolRight` liegen |
| `y` | `number` | `0 – world.height` | Y-Position. Sollte auf einer Plattform oder dem Boden stehen: Plattform-Y minus 16 (halbe Gegner-Höhe 32px / 2 = 16) |
| `patrolLeft` | `number` | `0 – patrolRight - 1` | Linke Umkehrgrenze in Weltkoordinaten. Empfohlen: linke Kante der Plattform |
| `patrolRight` | `number` | `patrolLeft + 1 – world.width` | Rechte Umkehrgrenze. Empfohlen: rechte Kante der Plattform (`x + tiles × 64`) |
| `speed` | `number` | `20 – 300` | Patrouilliergeschwindigkeit in px/s. `60` = langsam, `100` = mittel, `180` = schnell, `250` = sehr schnell |

**Y-Position auf Plattform berechnen:**
`enemy.y = platform.y - 16`  (Plattform-Oberkante minus halbe Gegner-Höhe)

**Patrol-Grenzen auf Plattform:**
- `patrolLeft` = `platform.x + 14` (etwas Abstand zum Rand)
- `patrolRight` = `platform.x + platform.tiles × 64 - 14`

---

### `goal`

Die Schatztruhe — Ziel des Levels. Berührung löst "Level geschafft" aus.

```json
{ "x": 3100, "y": 537 }
```

| Feld | Typ | Bereich | Beschreibung |
|------|-----|---------|--------------|
| `x` | `number` | `0 – world.width - 20` | X-Mittelpunkt der Truhe. Typisch am Ende der Welt, z. B. `world.width - 100` |
| `y` | `number` | `0 – world.height` | Y-Mittelpunkt. Für Boden-Platzierung: `world.height - 63` (= `537` bei height 600). Auf Plattform: `platform.y - 18` |

> Die Truhe ist 40×36px groß und schwebt leicht (±6px Tween). Genug Abstand zum Rand einplanen.

---

## Vollständiges Beispiel mit Kommentaren

```jsonc
{
  "id": 2,
  "name": "Level 2",
  "subtitle": "Höher hinaus",

  "world": {
    "width": 3200,        // 50 × 64px — Standardbreite
    "height": 600,        // Standardhöhe, selten ändern
    "bgColor": "0xe07b54",     // Abendhimmel orange-rot
    "groundColor": "0x8B6914", // Goldbraune Erde
    "platformColor": "0x5a3010", // Dunkles Holz
    "cloudCount": 12,     // weniger Wolken als Level 1
    "starCount": 0        // kein Sternenhimmel
  },

  "physics": {
    "gravity": 650,       // etwas schwerer als Level 1 (600)
    "playerSpeed": 250,   // schneller
    "jumpPower": 500      // höherer Sprung wegen stärkerer Schwerkraft
  },

  "player": {
    "startX": 120,        // links starten
    "startY": 520,        // kurz über dem Boden (height - 80)
    "lives": 3
  },

  "platforms": [
    // Erste Plattform: 3 Kacheln (192px) bei x=250, y=400 (niedriger)
    { "x": 250, "y": 400, "tiles": 3 },
    // Zweite höher: y=300 — 100px höher, erreichbar mit jumpPower 500
    { "x": 550, "y": 300, "tiles": 4 }
    // ...
  ],

  "coins": [
    // 20px über der ersten Plattform: y = 400 - 30 = 370
    { "x": 330, "y": 370 }
  ],

  "enemies": [
    // Auf der ersten Plattform: y = 400 - 16 = 384
    // Patrol: linke Kante 250+14=264, rechte Kante 250+192-14=428
    { "x": 346, "y": 384, "patrolLeft": 264, "patrolRight": 428, "speed": 90 }
  ],

  "goal": {
    "x": 3100,
    "y": 537   // Bodenhöhe: 600 - 63 = 537
  },

  "locked": false
}
```
