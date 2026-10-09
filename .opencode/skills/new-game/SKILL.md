---
name: new-game
description: Use when the user wants to add a new game to the Super Jumper platform. Covers all steps to register the game in games.json, create the Phaser scene files, wire up the React component and router, and add touch controls. Trigger keywords: "neues Spiel", "neues Game", "Spiel hinzufügen", "add game", "new game", "games.json".
---

# Skill: Ein neues Spiel hinzufügen

Dieses Projekt ist eine Multi-Game-PWA-Plattform. Jedes Spiel ist eigenständig und wird über `src/games.json` registriert. Der Router in `src/App.tsx` lädt das passende React-Component anhand der `component`-ID.

## Technische Grundlagen

### Game Registry Pattern
Alle Spielmetadaten leben in einer zentralen JSON-Datei. `GameSelectView.tsx` liest
diese Datei zur Build-Zeit (statischer Import) und rendert automatisch Kacheln.
Vorteil: Neue Spiele hinzufügen erfordert keine Änderung an View-Logik.

### State-basiertes Routing (kein React Router)
`App.tsx` nutzt einen einfachen `useState`-String als Router. Der Wert entspricht
dem `component`-Feld in `games.json`. Kein Overhead durch externe Bibliotheken.
Ref React useState: https://react.dev/reference/react/useState

### Phaser 4 Scene-Lifecycle
Jedes Phaser-Spiel durchläuft: `init(data)` → `preload()` → `create()` → `update()` [pro Frame]
Ref: https://phaser.io/docs/latest/Phaser.Scene

### Prozedurale Texturen
Texturen werden in `BootScene` per `graphics.generateTexture()` erzeugt.
Kein externes Asset nötig → vollständig offline-fähig.
Ref: https://phaser.io/docs/latest/Phaser.GameObjects.Graphics#generateTexture

### React + Phaser Brücke
`GameCanvas.tsx` hält die Phaser.Game-Instanz in einem `useRef`.
`useEffect` startet Phaser beim Mount und ruft `game.destroy(true)` beim Unmount auf.
Ref useEffect Cleanup: https://react.dev/reference/react/useEffect#usage
Ref Phaser destroy: https://phaser.io/docs/latest/Phaser.Game#destroy

### Touch-Steuerung
`TouchControls.ts` kombiniert On-Screen-Buttons (Phaser GameObjects mit `setScrollFactor(0)`)
mit Swipe-Erkennung via `Math.atan2`. Wiederverwendbar in jedem Phaser-Spiel.
Ref Touch Events: https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
Ref Phaser Input: https://phaser.io/docs/latest/Phaser.Input.InputManager

### Arcade Physics
Phaser Arcade Physics ist das einfachste Physics-System (AABB, keine Rotation).
Ideal für 2D-Platformer. StaticGroup für unbewegte Objekte, dynamische Bodies für Spieler.
Ref: https://phaser.io/docs/latest/Phaser.Physics.Arcade

---

## Übersicht der Projektstruktur

```
src/
├── games.json                  ← Spielregister (Quelle der Wahrheit)
├── App.tsx                     ← Router: liest games.json, rendert Komponenten
├── views/
│   └── GameSelectView.tsx      ← Spielauswahl-Kacheln (liest games.json)
└── game/                       ← Super Jumper Implementierung (Referenz)
    ├── PhaserGame.ts
    ├── levels.ts
    ├── input/TouchControls.ts
    └── scenes/
        ├── BootScene.ts
        ├── LevelSelectScene.ts
        └── GameScene.ts
```

---

## Schritt 1 — Eintrag in games.json

Datei: `src/games.json`

Füge ein neues Objekt in das JSON-Array ein:

```json
{
  "id": "mein-spiel",
  "title": "Mein Spiel",
  "subtitle": "Kurze Kategoriebezeichnung",
  "description": "Ein-Zwei-Satz Beschreibung für die Kachel.",
  "icon": "🎯",
  "color": "#e63946",
  "accentColor": "#FFD700",
  "tags": ["Arcade", "Singleplayer"],
  "players": "1 Spieler",
  "engine": "Phaser 4",
  "version": "1.0.0",
  "component": "mein-spiel"
}
```

**Felder:**

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | string | ✓ | Eindeutige ID, kebab-case |
| `title` | string | ✓ | Anzeigename auf der Kachel |
| `subtitle` | string | ✓ | Kurze Kategorie (z. B. "Puzzle", "Shooter") |
| `description` | string | ✓ | 1–2 Sätze für die Kachel |
| `icon` | string | ✓ | Ein Emoji als visuelles Symbol |
| `color` | string (hex) | ✓ | Primärfarbe der Kachel (Top-Streifen) |
| `accentColor` | string (hex) | ✓ | Akzentfarbe (Play-Button-Text) |
| `tags` | string[] | ✓ | Kurze Label-Badges |
| `players` | string | ✓ | z. B. `"1 Spieler"` oder `"1–4 Spieler"` |
| `engine` | string | ✓ | z. B. `"Phaser 4"` |
| `version` | string | ✓ | Semver-String |
| `component` | string | ✓ | Muss exakt dem `id`-Wert entsprechen |

---

## Schritt 2 — Phaser-Spielverzeichnis anlegen

Erstelle ein neues Verzeichnis für das Spiel:

```
src/games/mein-spiel/
├── MeinSpielGame.ts       ← Phaser.Game Factory (wie PhaserGame.ts)
└── scenes/
    ├── BootScene.ts       ← Texturen generieren
    └── GameScene.ts       ← Hauptspiel-Logik
```

### MeinSpielGame.ts (Vorlage)

```typescript
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { GameScene } from './scenes/GameScene'

export function createMeinSpielGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1a1a2e',
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 600 }, debug: false },
    },
    scene: [BootScene, GameScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: { activePointers: 3 },
  })
}
```

### BootScene.ts (Vorlage)

```typescript
import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }) }

  create() {
    // Texturen per generateTexture() erzeugen — kein externes Asset nötig
    this.scene.start('GameScene')
  }
}
```

### GameScene.ts (Vorlage)

```typescript
import Phaser from 'phaser'

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }) }

  create() {
    this.cameras.main.fadeIn(400)
    // Spiellogik hier
  }

  update() {
    // Update-Loop
  }
}
```

---

## Schritt 3 — React-Canvas-Wrapper erstellen

Erstelle `src/components/MeinSpielCanvas.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import { createMeinSpielGame } from '../games/mein-spiel/MeinSpielGame'
import '../components/GameCanvas.css'   // gleiche CSS wie Super Jumper Canvas

export default function MeinSpielCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return
    gameRef.current = createMeinSpielGame(containerRef.current)
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return <div className="game-canvas" ref={containerRef} />
}
```

---

## Schritt 4 — Router in App.tsx eintragen

Datei: `src/App.tsx`

Im `renderContent()`-Block einen neuen `if`-Zweig hinzufügen:

```tsx
if (route === 'mein-spiel') {
  return <MeinSpielCanvas />
}
```

**Wichtig:** Der String muss exakt dem `component`-Wert in `games.json` entsprechen.

---

## Schritt 5 — Touch-Steuerung einbinden (optional)

Die bestehende `TouchControls`-Klasse unter `src/game/input/TouchControls.ts` kann wiederverwendet werden:

```typescript
import { TouchControls } from '../../game/input/TouchControls'

// In create():
this.touch = new TouchControls(this)

// In update():
if (this.touch.state.left)  { /* links bewegen */ }
if (this.touch.state.right) { /* rechts bewegen */ }
if (this.touch.state.jump)  { /* springen */ }
```

`TouchControls` zeigt automatisch On-Screen-Buttons (◀ ▶ ▲) und registriert Swipe-Gesten.

---

## Schritt 6 — Vite Chunk-Splitting (optional)

Wenn das neue Spiel eine eigene große Bibliothek mitbringt, in `vite.config.ts` unter `manualChunks` eintragen:

```typescript
manualChunks: {
  phaser:     ['phaser'],
  'mein-lib': ['meine-externe-lib'],
}
```

---

## Checkliste

- [ ] Eintrag in `src/games.json` mit eindeutiger `id` und passendem `component`
- [ ] `src/games/mein-spiel/` Verzeichnis mit Game-Factory und Scenes
- [ ] `src/components/MeinSpielCanvas.tsx` React-Wrapper
- [ ] `if (route === 'mein-spiel')` in `src/App.tsx` `renderContent()`
- [ ] `npm run build` — kein TypeScript-Fehler
- [ ] Spiel in der Spielauswahl sichtbar und klickbar
- [ ] Auf Mobilgerät: Touch-Buttons funktionieren

---

## Referenz: Super Jumper

Das bestehende Spiel unter `src/game/` dient als vollständige Referenzimplementierung mit:
- Prozeduraler Textur-Generierung in `BootScene`
- Level-Konfiguration via TypeScript-Array (`levels.ts`)
- Kamera-Follow, Arcade-Physics, Collectibles
- Touch + Keyboard Input
- HUD mit ScrollFactor(0)
