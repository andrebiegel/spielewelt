/**
 * @file PhaserGame.ts
 * @description Factory-Funktion zur Erzeugung der Phaser-Game-Instanz für Super Jumper.
 *
 * Phaser 4 Dokumentation: https://phaser.io/docs
 * Phaser.Types.Core.GameConfig: https://phaser.io/docs/latest/Phaser.Types.Core.GameConfig
 *
 * Konzept:
 *   Diese Datei ist der einzige Einstiegspunkt in die Phaser-Welt aus React heraus.
 *   `createGame()` wird von `GameCanvas.tsx` aufgerufen und erhält das DOM-Element,
 *   in das Phaser seinen Canvas rendern soll. Das Phaser.Game-Objekt verwaltet den
 *   gesamten Spielzyklus (Scenes, Physics, Input, Renderer).
 *
 * Scene-Reihenfolge:
 *   1. BootScene        — generiert alle Texturen prozedural, kein Netzwerk-Request nötig
 *   2. LevelSelectScene — Phaser-interne Level-Auswahl (innerhalb des Canvas)
 *   3. GameScene        — eigentliche Spiellogik
 *
 * Warum Phaser.AUTO?
 *   Phaser wählt automatisch WebGL (bevorzugt) oder Canvas 2D als Renderer,
 *   abhängig von der Browser-Unterstützung. WebGL ist deutlich performanter.
 *   Ref: https://phaser.io/docs/latest/Phaser.Types.Core.GameConfig#type
 *
 * Warum gravity: { x: 0, y: 0 } hier und nicht pro Scene?
 *   Die globale Gravitationskonstante wird auf 0 gesetzt und erst in GameScene
 *   per `this.physics.world.gravity.y = level.gravity` überschrieben, damit
 *   LevelSelectScene (keine Physics) nicht beeinflusst wird.
 *
 * Warum activePointers: 3?
 *   iOS/iPadOS erlaubt bis zu 5 simultane Touch-Punkte. Drei reichen aus, um
 *   gleichzeitig links, rechts und Sprung zu halten.
 *   Ref: https://phaser.io/docs/latest/Phaser.Types.Core.InputConfig#activePointers
 */

import Phaser from 'phaser'
import { BootScene }        from './scenes/BootScene'
import { LevelSelectScene } from './scenes/LevelSelectScene'
import { GameScene }        from './scenes/GameScene'
import { TutorialScene }    from './scenes/TutorialScene'

/**
 * Erstellt eine neue Phaser.Game-Instanz und bindet sie an das übergebene DOM-Element.
 *
 * @param parent - Das HTMLElement, in das Phaser seinen Canvas einfügt.
 *                 Wird von `GameCanvas.tsx` via React-Ref übergeben.
 * @returns Die laufende Phaser.Game-Instanz. Muss beim Unmount via `.destroy(true)` beendet werden.
 *
 * @example
 * ```ts
 * const game = createGame(document.getElementById('game-container')!)
 * // später beim Aufräumen:
 * game.destroy(true)
 * ```
 */
export function createGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    // Renderer: AUTO = WebGL wenn verfügbar, sonst Canvas 2D
    type: Phaser.AUTO,

    // Das React-gemanagte DOM-Element als Container
    parent,

    // Initiale Größe — wird sofort durch Scale.RESIZE überschrieben
    width:  parent.clientWidth  || window.innerWidth,
    height: parent.clientHeight || window.innerHeight,

    // Hintergrundfarbe sichtbar während Scene-Übergängen
    backgroundColor: '#1a1a2e',

    physics: {
      default: 'arcade',
      arcade: {
        // Globale Schwerkraft: hier deaktiviert, wird pro Scene gesetzt
        gravity: { x: 0, y: 0 },
        // debug: true würde Collider-Boxen einzeichnen — nur für Entwicklung
        debug: false,
      },
    },

    // Scenes werden in dieser Reihenfolge registriert.
    // Nur die erste (BootScene) startet automatisch.
    scene: [BootScene, LevelSelectScene, GameScene, TutorialScene],

    scale: {
      // RESIZE: Canvas passt sich dynamisch an das Eltern-Element an
      // Ref: https://phaser.io/docs/latest/Phaser.Scale.ScaleModes
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    input: {
      // Anzahl simultaner Touch-Pointer (iOS/iPad benötigt mindestens 3
      // für gleichzeitig: links + rechts + jump)
      activePointers: 3,
    },
  }

  return new Phaser.Game(config)
}
