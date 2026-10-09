---
name: new-level
description: Use when the user wants to add a new level to Super Jumper. Covers creating the level JSON file, configuring all fields (world, physics, platforms, coins, enemies, goal), placement formulas, and verification. Trigger keywords: "neues Level", "Level hinzufügen", "Level erstellen", "add level", "new level", "level-XX.json", "Plattform hinzufügen", "Gegner platzieren".
---

# Skill: Neues Level für Super Jumper erstellen

Ein Level ist eine einzige JSON-Datei in `src/games/super-jumper/levels/`.
Neue Datei anlegen = Level erscheint automatisch in der Spielauswahl. Kein Code ändern nötig.

---

## Schritt 1 — Datei anlegen

Dateiname-Konvention: `level-XX.json` (XX = zweistellige Nummer, z. B. `level-02.json`).

```
src/games/super-jumper/levels/
├── level-01.json   ← existiert bereits
├── level-02.json   ← neu anlegen
└── SCHEMA.md       ← vollständige Feldreferenz
```

Die **Anzeigereihenfolge** in der Level-Auswahl richtet sich nach dem `id`-Feld in der JSON,
nicht nach dem Dateinamen. Empfehlung: beides konsistent halten (`level-02.json` → `"id": 2`).

---

## Schritt 2 — Minimale JSON-Vorlage

Kopiere diese Vorlage und passe die Werte an:

```json
{
  "id": 2,
  "name": "Level 2",
  "subtitle": "Kurze Stimmungsbeschreibung",

  "world": {
    "width": 3200,
    "height": 600,
    "bgColor": "0x5c94fc",
    "groundColor": "0x228B22",
    "platformColor": "0x8B4513",
    "cloudCount": 18,
    "starCount": 0
  },

  "physics": {
    "gravity": 600,
    "playerSpeed": 220,
    "jumpPower": 480
  },

  "player": {
    "startX": 120,
    "startY": 520,
    "lives": 3
  },

  "platforms": [
    { "x": 300, "y": 420, "tiles": 4, "type": "grass" }
  ],

  "coins": [
    { "x": 380, "y": 390 }
  ],

  "enemies": [
    { "x": 340, "y": 404, "patrolLeft": 314, "patrolRight": 556, "speed": 80 }
  ],

  "goal": {
    "x": 3100,
    "y": 537
  },

  "locked": false
}
```

---

## Schritt 3 — Felder konfigurieren

### Koordinatensystem

```
(0,0) ──────────────────────────► X  (= world.width, Standard: 3200)
  │
  ▼
  Y  (= world.height, Standard: 600)

Boden: Y = world.height - 32  →  568 bei height 600
```

X wächst nach **rechts**, Y wächst nach **unten**.

---

### `world` — Aussehen der Welt

| Feld | Standardwert | Wertebereiche | Hinweis |
|------|-------------|---------------|---------|
| `width` | `3200` | `800–9999` | Vielfaches von 64 empfohlen |
| `height` | `600` | `400–2000` | Selten ändern |
| `bgColor` | `"0x5c94fc"` | Hex `"0xRRGGBB"` | Himmelfarbe. Blau=Tag, Orange=Abend, Dunkel=Nacht |
| `groundColor` | `"0x228B22"` | Hex `"0xRRGGBB"` | Bodenfarbe per Tint |
| `platformColor` | `"0x8B4513"` | Hex `"0xRRGGBB"` | Wird ignoriert wenn `type` pro Plattform gesetzt |
| `cloudCount` | `18` | `0–40` | Wolken. `0` wenn `starCount > 0` |
| `starCount` | `0` | `0–200` | Sterne für Nacht-Level. `0` wenn `cloudCount > 0` |

**Farbpaletten-Empfehlungen:**

| Atmosphäre | bgColor | groundColor | platformColor |
|------------|---------|-------------|---------------|
| Tag (Blau) | `"0x5c94fc"` | `"0x228B22"` | `"0x8B4513"` |
| Abendrot | `"0xe07b54"` | `"0x8B6914"` | `"0x5a3010"` |
| Nacht | `"0x1a1a2e"` | `"0x16213e"` | `"0x0f3460"` |
| Wüste | `"0xf0d080"` | `"0xc8a020"` | `"0xa05010"` |
| Unterwasser | `"0x0e4d6e"` | `"0x1a6e4e"` | `"0x0a3a5a"` |

---

### `physics` — Spielgefühl

| Feld | Standard | Bereich | Hinweis |
|------|----------|---------|---------|
| `gravity` | `600` | `200–1200` | Höher = schnellerer Fall = schwieriger |
| `playerSpeed` | `220` | `80–500` | Laufgeschwindigkeit in px/s |
| `jumpPower` | `480` | `200–800` | Sprungimpuls in px/s |

**Sprunghöhe berechnen:** `jumpPower² / (2 × gravity)` = maximale Höhe in px

| gravity | jumpPower | Sprunghöhe |
|---------|-----------|------------|
| 600 | 480 | ≈ 192 px |
| 600 | 560 | ≈ 261 px |
| 700 | 520 | ≈ 193 px |
| 800 | 580 | ≈ 210 px |

**Horizontale Sprungweite:** `playerSpeed × (2 × jumpPower / gravity)` = max. Distanz in px

| playerSpeed | jumpPower | gravity | Sprungweite |
|-------------|-----------|---------|-------------|
| 220 | 480 | 600 | ≈ 352 px |
| 250 | 500 | 650 | ≈ 385 px |
| 280 | 520 | 700 | ≈ 416 px |

---

### `player` — Startposition

| Feld | Empfehlung | Bereich |
|------|-----------|---------|
| `startX` | `120` | `32 – world.width - 32` |
| `startY` | `world.height - 80` = `520` | `0 – world.height - 80` |
| `lives` | `3` | `1–9` |

---

### `platforms` — Plattformen platzieren

Jede Plattform ist ein Cluster aus 64px-Kacheln:

```json
{ "x": 300, "y": 420, "tiles": 4, "type": "grass" }
```

| Feld | Bereich | Bedeutung |
|------|---------|-----------|
| `x` | `0 – world.width - 64` | X-Position der **linken Kante** |
| `y` | `80 – world.height - 80` | Y-Position der **Oberkante** (höher Y = tiefer im Bild) |
| `tiles` | `1–20` | Anzahl 64px-Kacheln (`4` = 256px breit) |
| `type` | `"grass"` `"stone"` `"wood"` `"ice"` | Optionale Textur (Standard: `"grass"`) |

**Plattform-Typen:**

| `type` | Aussehen |
|--------|----------|
| `"grass"` | Braune Erde mit grüner Gras-Oberkante |
| `"stone"` | Grauer Stein mit Fugen |
| `"wood"` | Goldbraunes Holz mit Maserung |
| `"ice"` | Hellblaues Eis mit Glanz |

**Erreichbarkeit prüfen:**
Maximale Höhendifferenz = `jumpPower² / (2 × gravity)`.
Bei Standard-Physics (gravity 600, jumpPower 480): max. **192px** pro Sprung.
Plattform-Y muss ≤ 192px über dem Boden oder der vorherigen Plattform liegen.

**Maximale horizontale Lücke:**
Bei Standard-Physics und playerSpeed 220: max. **352px** Abstand (Mitte zu Mitte).

**Y-Orientierung (bei world.height = 600):**

| Y-Wert | Höhe im Bild |
|--------|-------------|
| `80` | Sehr hoch oben |
| `200` | Hoch |
| `300` | Mittel |
| `420` | Niedrig |
| `520` | Bodennähe |
| `568` | Genau Boden |

---

### `coins` — Münzen platzieren

```json
{ "x": 380, "y": 390 }
```

| Feld | Bereich | Hinweis |
|------|---------|---------|
| `x` | `0 – world.width` | X-Mittelpunkt (Sprite 16×16px) |
| `y` | `0 – world.height` | Y-Mittelpunkt. Typisch: `platform.y - 30` |

**Formel für Münze über Plattform:** `coin.y = platform.y - 30`

**Mindestabstand zwischen Münzen:** ≥ 16px (Mitte zu Mitte), empfohlen 32–64px.

---

### `enemies` — Gegner platzieren

```json
{ "x": 450, "y": 404, "patrolLeft": 314, "patrolRight": 556, "speed": 80 }
```

| Feld | Bereich | Hinweis |
|------|---------|---------|
| `x` | `patrolLeft – patrolRight` | Startposition — muss innerhalb der Patrol-Grenzen liegen |
| `y` | `0 – world.height` | Y-Mittelpunkt. Formel: `platform.y - 16` |
| `patrolLeft` | `0 – patrolRight` | Linke Umkehrgrenze. Empfohlen: `platform.x + 14` |
| `patrolRight` | `patrolLeft – world.width` | Rechte Umkehrgrenze. Empfohlen: `platform.x + tiles×64 - 14` |
| `speed` | `20–300` | px/s. `60`=langsam, `100`=mittel, `180`=schnell |

**Formeln für Plattform-Gegner:**
```
enemy.y          = platform.y - 16
enemy.patrolLeft  = platform.x + 14
enemy.patrolRight = platform.x + (tiles × 64) - 14
enemy.x           = (patrolLeft + patrolRight) / 2   ← Mitte der Patrol
```

**Gegner-Verhalten:**
- Berührung von der Seite: Spieler verliert 1 Leben (1.5s Unverwundbarkeit)
- Spieler springt von oben (velocity.y > 0): Gegner stirbt, +20 Punkte

---

### `goal` — Schatztruhe (Levelziel)

```json
{ "x": 3100, "y": 537 }
```

| Feld | Empfehlung | Bereich |
|------|-----------|---------|
| `x` | `world.width - 100` | `20 – world.width - 20` |
| `y` | Boden: `world.height - 63` = `537` | Auf Plattform: `platform.y - 18` |

Die Truhe schwebt automatisch ±6px auf/ab (Tween).
Sprite-Größe: 40×36px, Ankerpunkt mittig.

---

## Schritt 4 — Vollständiges Beispiel (Level 2)

```json
{
  "id": 2,
  "name": "Level 2",
  "subtitle": "Höher hinaus",

  "world": {
    "width": 3200,
    "height": 600,
    "bgColor": "0xe07b54",
    "groundColor": "0x8B6914",
    "platformColor": "0x5a3010",
    "cloudCount": 12,
    "starCount": 0
  },

  "physics": {
    "gravity": 650,
    "playerSpeed": 250,
    "jumpPower": 500
  },

  "player": {
    "startX": 120,
    "startY": 520,
    "lives": 3
  },

  "platforms": [
    { "x": 250,  "y": 400, "tiles": 3, "type": "stone" },
    { "x": 550,  "y": 300, "tiles": 4, "type": "wood"  },
    { "x": 850,  "y": 220, "tiles": 3, "type": "stone" },
    { "x": 1100, "y": 360, "tiles": 5, "type": "ice"   },
    { "x": 1400, "y": 260, "tiles": 3, "type": "grass" },
    { "x": 1700, "y": 180, "tiles": 4, "type": "wood"  },
    { "x": 2000, "y": 320, "tiles": 3, "type": "stone" },
    { "x": 2300, "y": 240, "tiles": 5, "type": "ice"   },
    { "x": 2600, "y": 160, "tiles": 3, "type": "grass" },
    { "x": 2900, "y": 300, "tiles": 4, "type": "wood"  }
  ],

  "coins": [
    { "x": 330,  "y": 370 },
    { "x": 650,  "y": 270 },
    { "x": 920,  "y": 190 },
    { "x": 1230, "y": 330 },
    { "x": 1530, "y": 230 },
    { "x": 1830, "y": 150 },
    { "x": 2130, "y": 290 },
    { "x": 2430, "y": 210 },
    { "x": 2730, "y": 130 }
  ],

  "enemies": [
    { "x": 314,  "y": 384, "patrolLeft": 264,  "patrolRight": 426,  "speed": 90  },
    { "x": 950,  "y": 204, "patrolLeft": 864,  "patrolRight": 1042, "speed": 100 },
    { "x": 1480, "y": 244, "patrolLeft": 1414, "patrolRight": 1606, "speed": 110 },
    { "x": 2080, "y": 304, "patrolLeft": 2014, "patrolRight": 2270, "speed": 95  },
    { "x": 2680, "y": 144, "patrolLeft": 2614, "patrolRight": 2742, "speed": 120 }
  ],

  "goal": {
    "x": 3100,
    "y": 537
  },

  "locked": false
}
```

---

## Schritt 5 — Checkliste

- [ ] Datei `level-XX.json` in `src/games/super-jumper/levels/` angelegt
- [ ] `id` ist eindeutig (nicht bereits in einer anderen JSON vergeben)
- [ ] `name` und `subtitle` gesetzt
- [ ] `world.width` und `world.height` definiert
- [ ] Mindestens 1 Plattform vorhanden
- [ ] Schatztruhe (`goal`) platziert — am besten nahe am rechten Ende (`world.width - 100`)
- [ ] `goal.y` korrekt: Boden = `world.height - 63`, Plattform = `platform.y - 18`
- [ ] Plattformen erreichbar: Höhendifferenz ≤ `jumpPower² / (2 × gravity)`
- [ ] Gegner-Y korrekt: `platform.y - 16`
- [ ] Gegner-X liegt zwischen `patrolLeft` und `patrolRight`
- [ ] Münzen über Plattformen: `coin.y = platform.y - 30`
- [ ] `npm run build` — kein Fehler, Level erscheint in der Auswahl

---

## Vollständige Feldreferenz

Alle Felder mit genauen Wertebereichen und Formeln:
→ `src/games/super-jumper/levels/SCHEMA.md`
