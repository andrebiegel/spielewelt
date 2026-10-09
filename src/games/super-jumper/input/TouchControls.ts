/**
 * @file TouchControls.ts
 * @description Virtuelle On-Screen-Steuerung für Touch-Geräte (iOS, iPadOS, Android).
 *
 * Zwei Eingabemodi werden parallel unterstützt:
 *
 *   1. On-Screen Buttons (D-Pad + Sprung-Button)
 *      Drei Phaser-GameObjects (Rectangle/Ellipse) werden mit `setScrollFactor(0)`
 *      fest am Bildschirm verankert. Pointer-Events setzen Flags in `this.state`.
 *      Ref: https://phaser.io/docs/latest/Phaser.GameObjects.Components.ScrollFactor
 *
 *   2. Swipe-Gesten als Fallback
 *      Beim `pointerup`-Event wird Richtung und Distanz des Wischens berechnet.
 *      Der Winkel wird mit `Math.atan2` ermittelt und mit einem Toleranz-Kegel
 *      (SWIPE_ANGLE = ±45°) verglichen.
 *      Ref: https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
 *
 * Verwendung in GameScene:
 *   ```ts
 *   this.touch = new TouchControls(this)
 *   // Im update()-Loop:
 *   if (this.touch.state.left)  body.setVelocityX(-speed)
 *   if (this.touch.state.right) body.setVelocityX(speed)
 *   if (this.touch.state.jump)  body.setVelocityY(-jumpPower)
 *   ```
 *
 * iOS-Besonderheit:
 *   `touch-action: none` in `GameCanvas.css` verhindert das Browser-eigene
 *   Scroll- und Zoom-Verhalten während des Spiels.
 *   Ref: https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
 */

/**
 * Aktueller Zustand der Touch-Steuerung.
 * Wird im `update()`-Loop von GameScene gelesen.
 * `true` = Taste gedrückt/gehalten, `false` = losgelassen.
 */
export interface TouchState {
  left:  boolean
  right: boolean
  jump:  boolean
}

/**
 * Minimale Wischstrecke in Pixeln, damit eine Geste als Swipe erkannt wird.
 * Verhindert, dass kurze Taps als Richtungsbefehle gewertet werden.
 */
const SWIPE_THRESHOLD = 30

/**
 * Halbwinkel des Erkennungs-Kegels für Swipe-Richtungen in Grad.
 * Ein Wert von 45° bedeutet: ±45° um die Achse → insgesamt 90° breiter Kegel.
 * Ref: https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Using_Touch_Events
 */
const SWIPE_ANGLE = 45

/**
 * Verwaltet Touch-Eingaben für ein Phaser.Scene.
 *
 * Erstellt beim Konstruktor-Aufruf sofort die sichtbaren Buttons und
 * registriert die Swipe-Erkennung auf dem Scene-Input-Manager.
 *
 * Die Instanz muss beim Scene-Wechsel via `destroy()` aufgeräumt werden,
 * da Phaser-GameObjects nicht automatisch mit dem Scene-Lifecycle verknüpft sind.
 */
export class TouchControls {
  /**
   * Aktueller Eingabe-Zustand. Wird direkt von GameScene.update() gelesen.
   * `readonly` verhindert versehentliches Ersetzen des Objekts von außen —
   * die Felder selbst sind aber mutierbar (bewusst, für Performance).
   */
  readonly state: TouchState = { left: false, right: false, jump: false }

  /** X-Koordinate beim `pointerdown` — Ausgangspunkt für Swipe-Berechnung */
  private startX = 0
  /** Y-Koordinate beim `pointerdown` — Ausgangspunkt für Swipe-Berechnung */
  private startY = 0

  /** Phaser-Rechteck für den Links-Button (◀) */
  private btnLeft!:  Phaser.GameObjects.Rectangle
  /** Phaser-Rechteck für den Rechts-Button (▶) */
  private btnRight!: Phaser.GameObjects.Rectangle
  /** Phaser-Ellipse für den Sprung-Button (▲) */
  private btnJump!:  Phaser.GameObjects.Ellipse

  /** Referenz auf die übergeordnete Phaser.Scene für Zugriff auf Input und Scale */
  private scene: Phaser.Scene

  /**
   * @param scene - Die aktive Phaser.Scene, in der die Buttons erstellt werden.
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.createButtons()
    this.registerSwipe()
  }

  /**
   * Erstellt die drei On-Screen-Buttons und bindet Pointer-Events.
   *
   * Buttons werden mit `setScrollFactor(0)` fix am Bildschirm verankert —
   * sie scrollen nicht mit der Spielkamera mit.
   * `setDepth(100)` stellt sicher, dass sie über Spielobjekten liegen.
   *
   * Pointer-Events:
   * - `pointerdown`: Taste gedrückt → flag = true
   * - `pointerup`:   Taste losgelassen → flag = false
   * - `pointerout`:  Pointer verlässt Button ohne loszulassen → flag = false
   *   (wichtig für Drag-Situationen auf iOS)
   */
  private createButtons() {
    const { width, height } = this.scene.scale

    // Halbtransparent (35%) — sichtbar, aber nicht störend
    const btnAlpha = 0.35
    // Vertikale Position: 60px vom unteren Bildschirmrand
    const y = height - 60

    // ── Links-Button (◀) ────────────────────────────────────────────────────
    this.btnLeft = this.scene.add.rectangle(60, y, 80, 80, 0xffffff, btnAlpha)
      .setScrollFactor(0)   // kamerafest
      .setDepth(100)        // über Spielobjekten
      .setInteractive()     // Pointer-Events aktivieren

    // Pfeil-Emoji als Label — eigene Text-Objekte, da Rectangle kein Text hat
    this.scene.add.text(60, y, '◀', { fontSize: '28px', color: '#fff' })
      .setOrigin(0.5)       // zentriert im Button
      .setScrollFactor(0)
      .setDepth(101)        // über dem Rectangle
      .setAlpha(0.8)

    // ── Rechts-Button (▶) ───────────────────────────────────────────────────
    this.btnRight = this.scene.add.rectangle(160, y, 80, 80, 0xffffff, btnAlpha)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive()

    this.scene.add.text(160, y, '▶', { fontSize: '28px', color: '#fff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101)
      .setAlpha(0.8)

    // ── Sprung-Button (▲) — rechte Seite, Ellipse für visuelle Unterscheidung
    this.btnJump = this.scene.add.ellipse(width - 70, y, 90, 90, 0xe63946, btnAlpha)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive()

    this.scene.add.text(width - 70, y, '▲', { fontSize: '28px', color: '#fff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101)
      .setAlpha(0.8)

    // ── Event-Bindung ────────────────────────────────────────────────────────
    // Alle drei Buttons folgen demselben Schema: down → true, up/out → false
    this.btnLeft.on('pointerdown',  () => { this.state.left  = true  })
    this.btnLeft.on('pointerup',    () => { this.state.left  = false })
    this.btnLeft.on('pointerout',   () => { this.state.left  = false })  // Drag raus

    this.btnRight.on('pointerdown', () => { this.state.right = true  })
    this.btnRight.on('pointerup',   () => { this.state.right = false })
    this.btnRight.on('pointerout',  () => { this.state.right = false })

    this.btnJump.on('pointerdown',  () => { this.state.jump  = true  })
    this.btnJump.on('pointerup',    () => { this.state.jump  = false })
    this.btnJump.on('pointerout',   () => { this.state.jump  = false })
  }

  /**
   * Registriert Swipe-Gesten auf dem Scene-Input-Manager.
   *
   * Algorithmus:
   *   1. `pointerdown`: Startposition merken
   *   2. `pointerup`: Verschiebung (dx, dy) berechnen
   *   3. Euklidische Distanz prüfen → kleiner als SWIPE_THRESHOLD = kein Swipe
   *   4. Winkel per atan2 berechnen (Ergebnis: -180° bis +180°)
   *   5. Winkel-Betrag mit Kegeln vergleichen:
   *      - < 45°           → Swipe rechts
   *      - > 135°          → Swipe links
   *      - 45°–135°, dy<0  → Swipe oben (Sprung)
   *
   * Swipe-Flags werden nach kurzer Zeit (300ms/150ms) automatisch zurückgesetzt,
   * da kein `pointerup`-Gegenereignis für die State-Rücksetzung verfügbar ist.
   */
  private registerSwipe() {
    const input = this.scene.input

    // Startpunkt beim Drücken merken
    input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.startX = p.x
      this.startY = p.y
    })

    input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const dx   = p.x - this.startX
      const dy   = p.y - this.startY
      // Euklidische Distanz — nur echte Wischgesten verarbeiten
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < SWIPE_THRESHOLD) return

      // atan2 gibt den Winkel zur x-Achse zurück (Bogenmaß → Grad)
      // Math.abs() normiert auf 0°–180° für einfacheren Vergleich
      const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI))

      if (angle < SWIPE_ANGLE) {
        // 0°–45°: Wischen nach rechts
        this.state.right = true
        setTimeout(() => { this.state.right = false }, 300)
      } else if (angle > 180 - SWIPE_ANGLE) {
        // 135°–180°: Wischen nach links
        this.state.left = true
        setTimeout(() => { this.state.left = false }, 300)
      } else if (dy < 0 && angle > 90 - SWIPE_ANGLE && angle < 90 + SWIPE_ANGLE) {
        // 45°–135°, nach oben: Sprung
        // dy < 0 stellt sicher dass wirklich nach oben gewischt wurde
        this.state.jump = true
        setTimeout(() => { this.state.jump = false }, 150)
      }
    })
  }

  /**
   * Entfernt alle erstellten Phaser-GameObjects aus der Scene.
   * Muss beim Scene-Wechsel aufgerufen werden, um Memory Leaks zu vermeiden.
   * Swipe-Event-Listener werden automatisch mit der Scene bereinigt.
   */
  destroy() {
    this.btnLeft.destroy()
    this.btnRight.destroy()
    this.btnJump.destroy()
  }
}
