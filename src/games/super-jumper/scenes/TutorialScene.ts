/**
 * @file TutorialScene.ts
 * @description Interaktives Tutorial für Super Jumper.
 *
 * Konzept:
 *   Das Tutorial besteht aus sequentiellen Schritten. Jeder Schritt:
 *   - zeigt eine Erklärung als Overlay-Panel
 *   - wartet auf eine konkrete Spieleraktion (Bewegen, Springen, Münze, Gegner, Ziel)
 *   - blendet das Panel aus sobald die Aktion erkannt wurde
 *   - geht automatisch zum nächsten Schritt
 *
 *   Die Welt ist absichtlich eng und geführt:
 *   kleine Plattformen erzwingen die jeweilige Aktion.
 *
 * Schritte:
 *   1. Laufen       — nach rechts laufen bis zur Markierung
 *   2. Springen     — über eine Lücke springen
 *   3. Münze        — eine Münze einsammeln
 *   4. Gegner       — Gegner von oben besiegen
 *   5. Schatztruhe  — Ziel erreichen → Tutorial abgeschlossen
 */

import Phaser from 'phaser'
import { TouchControls } from '../input/TouchControls'

// ── Tutorial-Schritt-Definition ───────────────────────────────────────────────

interface TutorialStep {
  /** Überschrift im Panel */
  title: string
  /** Erklärungstext (kann Zeilenumbrüche mit \n enthalten) */
  text: string
  /** Icon/Emoji oben im Panel */
  icon: string
  /** Taste/Geste für Desktop */
  keyHint?: string
  /** Geste für Touch */
  touchHint?: string
  /** Bedingung: wird jeden Frame geprüft — true = Schritt abgeschlossen */
  condition: () => boolean
}

// ── Konstanten ────────────────────────────────────────────────────────────────

const W = 1800   // Weltbreite
const H = 600    // Welthöhe
const GROUND_Y = H - 16   // Bodenmitte

// X-Positionen der Tutorial-Zonen
const ZONE_RUN    = 400    // Spieler muss bis hierher laufen
const ZONE_JUMP   = 800    // Plattform nach Lücke
const ZONE_COIN_X = 650    // Münze X
const ZONE_COIN_Y = 430    // Münze Y
const ZONE_ENEMY_X = 1050  // Gegner X
const ZONE_CHEST_X = 1600  // Schatztruhe X

export class TutorialScene extends Phaser.Scene {
  private player!:    Phaser.Physics.Arcade.Image
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private coinGroup!: Phaser.Physics.Arcade.StaticGroup
  private enemyGroup!: Phaser.Physics.Arcade.Group
  private chest!:     Phaser.Physics.Arcade.Image

  private cursors!:   Phaser.Types.Input.Keyboard.CursorKeys
  private touch!:     TouchControls

  private steps!:         TutorialStep[]
  private stepIndex       = 0
  private stepDone        = false   // Schritt gerade abgeschlossen (kurze Pause)
  private stepDoneTimer   = 0

  // Overlay-Elemente (werden bei jedem Schritt neu gebaut)
  private panel!:       Phaser.GameObjects.Container
  private arrowSprite!: Phaser.GameObjects.Text  // Pfeil der zur Aktion zeigt

  // Tracking
  private coinCollected  = false
  private enemyKilled    = false
  private goalReached    = false

  // Sprung-Input
  private jumpPressed = false

  constructor() {
    super({ key: 'TutorialScene' })
  }

  create() {
    // ── Welt ────────────────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, W, H)
    this.physics.world.gravity.y = 600

    // Hintergrund (Morgenhimmel)
    this.add.rectangle(W / 2, H / 2, W, H, 0x87ceeb)

    // Wolken
    for (let i = 0; i < 8; i++) {
      const x = 100 + i * 220
      const y = Phaser.Math.Between(40, 150)
      this.addCloud(x, y)
    }

    // ── Plattformen ──────────────────────────────────────────────────────────
    this.platforms = this.physics.add.staticGroup()

    // Durchgehender Boden links (Startzone + Lauf-Zone)
    for (let x = 0; x < 500; x += 64) {
      this.makeTile(x + 32, GROUND_Y, 'ground', 0x228B22)
    }

    // Lücke bei 500–580 (Sprung-Zone)

    // Plattform nach der Lücke (Sprungziel) + Weiterführender Boden
    for (let x = 580; x < W; x += 64) {
      this.makeTile(x + 32, GROUND_Y, 'ground', 0x228B22)
    }

    // Erhöhte Plattform für Gegner-Bereich
    for (let i = 0; i < 5; i++) {
      this.makeTile(920 + i * 64 + 32, 450, 'platform-grass', 0xffffff)
    }

    // ── Münze ────────────────────────────────────────────────────────────────
    this.coinGroup = this.physics.add.staticGroup()
    const coin = this.coinGroup.create(ZONE_COIN_X, ZONE_COIN_Y, 'coin') as Phaser.Physics.Arcade.Image
    // Leuchtendes Shimmer per Tween
    this.tweens.add({
      targets: coin, scaleX: 1.3, scaleY: 1.3,
      duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    // ── Gegner ───────────────────────────────────────────────────────────────
    this.enemyGroup = this.physics.add.group()
    const enemy = this.enemyGroup.create(ZONE_ENEMY_X, 418, 'enemy') as Phaser.Physics.Arcade.Image
    enemy.setCollideWorldBounds(true)
    enemy.setData('dir', 1)
    ;(enemy.body as Phaser.Physics.Arcade.Body).setVelocityX(60)

    this.physics.add.collider(this.enemyGroup, this.platforms)

    // ── Schatztruhe ──────────────────────────────────────────────────────────
    this.chest = this.physics.add.image(ZONE_CHEST_X, GROUND_Y - 50, 'chest') as Phaser.Physics.Arcade.Image
    ;(this.chest.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.chest.setImmovable(true)
    this.tweens.add({
      targets: this.chest, y: GROUND_Y - 56,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    // ── Spieler ──────────────────────────────────────────────────────────────
    this.player = this.physics.add.image(80, GROUND_Y - 50, 'player') as Phaser.Physics.Arcade.Image
    this.player.setCollideWorldBounds(true)
    ;(this.player.body as Phaser.Physics.Arcade.Body).setGravityY(0)

    // Kollisionen
    this.physics.add.collider(this.player, this.platforms)

    this.physics.add.overlap(this.player, this.coinGroup, (_p, c) => {
      if (!this.coinCollected) {
        this.coinCollected = true
        ;(c as Phaser.GameObjects.GameObject).destroy()
      }
    })

    this.physics.add.overlap(this.player, this.enemyGroup, (_p, e) => {
      const enemy = e as Phaser.Physics.Arcade.Image
      const pBody = this.player.body as Phaser.Physics.Arcade.Body
      if (pBody.velocity.y > 0 && this.player.y < enemy.y - 10) {
        this.enemyKilled = true
        enemy.destroy()
        pBody.setVelocityY(-300)
      }
    })

    this.physics.add.overlap(this.player, this.chest, () => {
      if (!this.goalReached) this.goalReached = true
    })

    // ── Kamera ───────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, W, H)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.fadeIn(500)

    // ── Eingabe ───────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.touch   = new TouchControls(this)

    // ── Tutorial-Schritte definieren ─────────────────────────────────────────
    this.steps = this.buildSteps()
    this.stepIndex = 0
    this.stepDone  = false

    // Zurück-Button
    this.createBackButton()

    // Erster Schritt anzeigen
    this.showStep(0)
  }

  update(_time: number, delta: number) {
    if (this.stepIndex >= this.steps.length) return

    this.updatePlayer()
    this.updateEnemies()

    // Kurze Pause nach abgeschlossenem Schritt (800ms Erfolgs-Feedback)
    if (this.stepDone) {
      this.stepDoneTimer += delta
      if (this.stepDoneTimer >= 800) {
        this.stepDone      = false
        this.stepDoneTimer = 0
        this.nextStep()
      }
      return
    }

    // Prüfe ob aktueller Schritt abgeschlossen
    const step = this.steps[this.stepIndex]
    if (step.condition()) {
      this.markStepDone()
    }
  }

  // ─── Spieler-Steuerung ────────────────────────────────────────────────────

  private updatePlayer() {
    const body  = this.player.body as Phaser.Physics.Arcade.Body
    const kb    = this.cursors
    const touch = this.touch.state

    if (kb.left.isDown || touch.left) {
      body.setVelocityX(-200)
      this.player.setFlipX(true)
    } else if (kb.right.isDown || touch.right) {
      body.setVelocityX(200)
      this.player.setFlipX(false)
    } else {
      body.setVelocityX(0)
    }

    const jumpDown = kb.up.isDown || kb.space.isDown || touch.jump
    if (jumpDown && !this.jumpPressed && body.blocked.down) {
      body.setVelocityY(-480)
      this.jumpPressed  = true
    }
    if (!jumpDown) this.jumpPressed = false
  }

  private updateEnemies() {
    this.enemyGroup.getChildren().forEach((obj) => {
      const e    = obj as Phaser.Physics.Arcade.Image
      const body = e.body as Phaser.Physics.Arcade.Body
      let   dir  = e.getData('dir') as number
      if (e.x <= 920)  { dir = 1;  e.setData('dir', dir); e.setFlipX(false) }
      if (e.x >= 1230) { dir = -1; e.setData('dir', dir); e.setFlipX(true)  }
      body.setVelocityX(dir * 60)
    })
  }

  // ─── Tutorial-Schritte ────────────────────────────────────────────────────

  private buildSteps(): TutorialStep[] {
    return [
      {
        title:     'Willkommen!',
        text:      'Dieses Tutorial erklärt dir\ndie Steuerung Schritt für Schritt.\n\nLauf nach rechts um zu beginnen!',
        icon:      '👋',
        keyHint:   '→  Pfeiltaste Rechts',
        touchHint: '▶  Button rechts unten',
        condition: () => this.player.x > ZONE_RUN,
      },
      {
        title:     'Super! Jetzt springen',
        text:      'Vor dir liegt eine Lücke.\nSpring darüber!',
        icon:      '⬆️',
        keyHint:   '↑  Pfeiltaste Hoch  oder  Leertaste',
        touchHint: '▲  Button rechts unten',
        condition: () => this.player.x > ZONE_JUMP,
      },
      {
        title:     'Münzen sammeln',
        text:      'Lauf über die\nglitzernde Münze!\n\nMünzen geben +10 Punkte.',
        icon:      '🪙',
        keyHint:   '← →  Bewegen',
        touchHint: '◀ ▶  Buttons',
        condition: () => this.coinCollected,
      },
      {
        title:     'Gegner besiegen',
        text:      'Vor dir ist ein Gegner!\n\nSpring auf ihn von oben\num ihn zu besiegen.\n\nBerühre ihn von der Seite\nnicht — das kostet ein Leben!',
        icon:      '👾',
        keyHint:   '↑  Springen + auf Gegner landen',
        touchHint: '▲  Springen + auf Gegner landen',
        condition: () => this.enemyKilled,
      },
      {
        title:     'Ziel erreichen',
        text:      'Fast geschafft!\n\nErreiche die\nglänzende Schatztruhe\nam Ende des Levels.',
        icon:      '🏆',
        keyHint:   '→  Laufen',
        touchHint: '▶  Button',
        condition: () => this.goalReached,
      },
    ]
  }

  private showStep(index: number) {
    if (index >= this.steps.length) {
      this.finishTutorial()
      return
    }

    // Altes Panel entfernen
    this.panel?.destroy()

    const step            = this.steps[index]
    const { width, height } = this.scale
    const isMobile        = width < 600
    const panelW          = isMobile ? width - 32 : 420
    const panelX          = width / 2

    // Panel-Container (kamerafest)
    const container = this.add.container(panelX, height - (isMobile ? 160 : 140))
      .setScrollFactor(0)
      .setDepth(80)

    // Hintergrund
    const bg = this.add.rectangle(0, 0, panelW, isMobile ? 140 : 130, 0x0a0a20, 0.92)
      .setStrokeStyle(2, 0x3a86ff)
    container.add(bg)

    // Schritt-Indikator Punkte
    const dotSpacing = 16
    const totalDots  = this.steps.length
    const dotsStartX = -(totalDots - 1) * dotSpacing / 2
    for (let i = 0; i < totalDots; i++) {
      const dot = this.add.circle(
        dotsStartX + i * dotSpacing,
        isMobile ? -54 : -48,
        5,
        i === index ? 0x3a86ff : 0x333355,
      )
      container.add(dot)
    }

    // Icon
    const icon = this.add.text(-panelW / 2 + 20, isMobile ? -44 : -38, step.icon, { fontSize: '26px' })
      .setOrigin(0, 0.5)
    container.add(icon)

    // Titel
    const title = this.add.text(-panelW / 2 + 54, isMobile ? -44 : -38, step.title, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize:   isMobile ? '14px' : '15px',
      color:      '#FFD700',
    }).setOrigin(0, 0.5)
    container.add(title)

    // Trennlinie
    const line = this.add.rectangle(0, isMobile ? -28 : -22, panelW - 20, 1, 0x3a86ff, 0.4)
    container.add(line)

    // Erklärungstext
    const bodyText = this.add.text(0, isMobile ? -4 : -2, step.text, {
      fontFamily: 'Arial, sans-serif',
      fontSize:   isMobile ? '12px' : '13px',
      color:      'rgba(255,255,255,0.85)',
      align:      'center',
      lineSpacing: 4,
      wordWrap:   { width: panelW - 32 },
    }).setOrigin(0.5, 0)
    container.add(bodyText)

    // Hinweis-Zeile (Tastatur / Touch)
    const isTouch  = this.sys.game.device.input.touch
    const hint     = isTouch ? step.touchHint : step.keyHint
    if (hint) {
      const hintText = this.add.text(0, isMobile ? 52 : 46, hint, {
        fontFamily:      'Arial, sans-serif',
        fontSize:        isMobile ? '11px' : '12px',
        color:           '#3a86ff',
        backgroundColor: 'rgba(58,134,255,0.12)',
        padding:         { x: 10, y: 4 },
      }).setOrigin(0.5)
      container.add(hintText)
    }

    this.panel = container

    // Einblend-Animation
    container.setAlpha(0)
    this.tweens.add({ targets: container, alpha: 1, duration: 250, ease: 'Quad.easeOut' })

    // Pfeil der auf relevante Spielobjekte zeigt
    this.updateArrow(step)
  }

  private updateArrow(step: TutorialStep) {
    this.arrowSprite?.destroy()

    // Ziel-X für den Pfeil (zeigt in der Spielwelt auf das nächste Ziel)
    let targetX: number | null = null
    const stepIdx = this.steps.indexOf(step)

    if (stepIdx === 0) targetX = ZONE_RUN
    if (stepIdx === 1) targetX = ZONE_JUMP
    if (stepIdx === 2) targetX = ZONE_COIN_X
    if (stepIdx === 3) targetX = ZONE_ENEMY_X
    if (stepIdx === 4) targetX = ZONE_CHEST_X

    if (targetX === null) return

    this.arrowSprite = this.add.text(targetX, GROUND_Y - 90, '⬇️', {
      fontSize: '28px',
    }).setOrigin(0.5).setDepth(70)

    // Hüpf-Animation
    this.tweens.add({
      targets:  this.arrowSprite,
      y:        GROUND_Y - 75,
      duration: 500,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    })
  }

  private markStepDone() {
    this.stepDone      = true
    this.stepDoneTimer = 0

    // Grünes Häkchen-Flash im Panel
    const { width, height } = this.scale
    const flash = this.add.text(width / 2, height - 160, '✅', {
      fontSize: '48px',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(90).setAlpha(0)

    this.tweens.add({
      targets:  flash,
      alpha:    1,
      scaleX:   1.4,
      scaleY:   1.4,
      duration: 200,
      yoyo:     true,
      onComplete: () => flash.destroy(),
    })
  }

  private nextStep() {
    this.arrowSprite?.destroy()
    this.stepIndex++
    this.showStep(this.stepIndex)
  }

  // ─── Tutorial abgeschlossen ───────────────────────────────────────────────

  private finishTutorial() {
    this.panel?.destroy()
    this.arrowSprite?.destroy()
    this.input.keyboard!.enabled = false

    const { width, height } = this.scale

    // Dunkles Overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a14, 0)
      .setScrollFactor(0).setDepth(200)
    this.tweens.add({ targets: overlay, fillAlpha: 0.88, duration: 400 })

    this.time.delayedCall(400, () => {
      this.add.text(width / 2, height / 2 - 80, '🏆', { fontSize: '64px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(201)

      this.add.text(width / 2, height / 2 - 10, 'Tutorial abgeschlossen!', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize:   '28px',
        color:      '#FFD700',
        stroke:     '#4a2c0a',
        strokeThickness: 3,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201)

      this.add.text(width / 2, height / 2 + 36, 'Du weißt jetzt alles — viel Erfolg!', {
        fontFamily: 'Arial, sans-serif',
        fontSize:   '15px',
        color:      'rgba(255,255,255,0.7)',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201)

      const btn = this.add.text(width / 2, height / 2 + 90, '▶  Spielen!', {
        fontFamily:      'Arial Black, sans-serif',
        fontSize:        '18px',
        color:           '#fff',
        backgroundColor: '#e63946',
        padding:         { x: 24, y: 12 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201)
        .setInteractive({ useHandCursor: true })

      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#c0392b' }))
      btn.on('pointerout',  () => btn.setStyle({ backgroundColor: '#e63946' }))
      btn.on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('LevelSelectScene')
        })
      })
    })
  }

  // ─── Zurück-Button (HUD) ─────────────────────────────────────────────────

  private createBackButton() {
    const { width } = this.scale

    this.add.rectangle(width / 2, 22, width, 44, 0x000000, 0.5)
      .setScrollFactor(0).setDepth(50)

    this.add.text(14, 10, '📖 Tutorial', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize:   '13px',
      color:      '#FFD700',
    }).setScrollFactor(0).setDepth(51)

    const back = this.add.text(width - 14, 10, '⬅ Auswahl', {
      fontFamily: 'Arial, sans-serif',
      fontSize:   '12px',
      color:      'rgba(255,255,255,0.55)',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51)
      .setInteractive({ useHandCursor: true })

    back.on('pointerover', () => back.setColor('#fff'))
    back.on('pointerout',  () => back.setColor('rgba(255,255,255,0.55)'))
    back.on('pointerdown', () => {
      this.cameras.main.fadeOut(280, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('LevelSelectScene')
      })
    })
  }

  // ─── Hilfsmethoden ───────────────────────────────────────────────────────

  private makeTile(x: number, y: number, key: string, tint: number) {
    const t = this.platforms.create(x, y, key) as Phaser.Physics.Arcade.Image
    if (tint !== 0xffffff) t.setTint(tint)
    t.refreshBody()
    return t
  }

  private addCloud(x: number, y: number) {
    const g = this.add.graphics()
    g.fillStyle(0xffffff, 0.75)
    g.fillEllipse(x,      y,      90, 38)
    g.fillEllipse(x + 28, y - 10, 65, 34)
    g.fillEllipse(x - 22, y - 6,  52, 30)
  }
}
