/**
 * @file GameScene.ts
 * @description Hauptspielszene für Super Jumper.
 *
 * Features:
 *   - 3 Leben (konfigurierbar per JSON) — Gegner-Berührung kostet 1 Leben
 *   - Kurze Unverwundbarkeit nach Treffer (Blink-Effekt, 1.5s)
 *   - Gegner patrouillieren horizontal zwischen definierten Grenzen
 *   - Schatztruhe als Levelziel → "Level geschafft"-Overlay
 *   - Game-Over-Overlay bei 0 Leben
 *   - Alles konfiguriert aus LevelData (JSON)
 */

import Phaser from 'phaser'
import { LEVELS, LevelData, parseColor } from '../levelLoader'
import { TouchControls } from '../input/TouchControls'

/** Dauer der Unverwundbarkeit nach Treffer in Millisekunden */
const INVINCIBLE_MS = 1500
/** Blink-Intervall während Unverwundbarkeit in Millisekunden */
const BLINK_INTERVAL = 120

export class GameScene extends Phaser.Scene {
  // ── Konfiguration ────────────────────────────────────────────────────────
  private levelData!: LevelData

  // ── Spielobjekte ─────────────────────────────────────────────────────────
  private player!:    Phaser.Physics.Arcade.Image
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private coins!:     Phaser.Physics.Arcade.StaticGroup
  private enemies!:   Phaser.Physics.Arcade.Group
  private chest!:     Phaser.Physics.Arcade.Image

  // ── Steuerung ─────────────────────────────────────────────────────────────
  private cursors!:  Phaser.Types.Input.Keyboard.CursorKeys
  private touch!:    TouchControls

  // ── Spielzustand ─────────────────────────────────────────────────────────
  private lives        = 3
  private score        = 0
  private isOnGround   = false
  private jumpPressed  = false
  private invincible   = false
  private blinkTimer   = 0
  private gameOver     = false
  private levelCleared = false

  // ── HUD ───────────────────────────────────────────────────────────────────
  private scoreText!:  Phaser.GameObjects.Text
  private livesText!:  Phaser.GameObjects.Text

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data: { levelId?: number }) {
    const id        = data.levelId ?? 1
    this.levelData  = LEVELS.find((l) => l.id === id) ?? LEVELS[0]
    this.lives      = this.levelData.player.lives
    this.score      = 0
    this.gameOver   = false
    this.levelCleared = false
    this.invincible = false
    this.jumpPressed = false
  }

  create() {
    const lv  = this.levelData
    const W   = lv.world.width
    const H   = lv.world.height

    // ── Physik ───────────────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, W, H)
    this.physics.world.gravity.y = lv.physics.gravity

    // ── Hintergrund ──────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, parseColor(lv.world.bgColor))
    this.addScenery(W, H)

    // ── Boden ────────────────────────────────────────────────────────────────
    this.platforms = this.physics.add.staticGroup()
    for (let x = 0; x < W; x += 64) {
      const g = this.platforms.create(x + 32, H - 16, 'ground') as Phaser.Physics.Arcade.Image
      g.setTint(parseColor(lv.world.groundColor))
      g.refreshBody()
    }

    // ── Plattformen aus JSON ──────────────────────────────────────────────────
    // Textur-Key wird aus dem `type`-Feld der Plattform abgeleitet.
    // Fehlt `type`, wird "grass" als Standard verwendet.
    lv.platforms.forEach(({ x, y, tiles, type = 'grass' }) => {
      const textureKey = `platform-${type}`
      for (let i = 0; i < tiles; i++) {
        const p = this.platforms.create(x + i * 64 + 32, y, textureKey) as Phaser.Physics.Arcade.Image
        p.refreshBody()
      }
    })

    // ── Münzen ───────────────────────────────────────────────────────────────
    this.coins = this.physics.add.staticGroup()
    lv.coins.forEach(({ x, y }) => {
      this.coins.create(x, y - 20, 'coin')
    })

    // ── Gegner ───────────────────────────────────────────────────────────────
    // Arcade-Group mit dynamischen Bodies für Bewegung
    this.enemies = this.physics.add.group()
    lv.enemies.forEach((def) => {
      const e = this.enemies.create(def.x, def.y, 'enemy') as Phaser.Physics.Arcade.Image
      e.setCollideWorldBounds(true)
      e.setData('patrolLeft',  def.patrolLeft)
      e.setData('patrolRight', def.patrolRight)
      e.setData('speed',       def.speed)
      e.setData('dir',         1)
      ;(e.body as Phaser.Physics.Arcade.Body).setVelocityX(def.speed)
    })

    // Gegner stoßen mit Plattformen zusammen (bleiben oben)
    this.physics.add.collider(this.enemies, this.platforms)

    // ── Schatztruhe (Ziel) ───────────────────────────────────────────────────
    this.chest = this.physics.add.image(lv.goal.x, lv.goal.y, 'chest') as Phaser.Physics.Arcade.Image
    this.chest.setImmovable(true)
    ;(this.chest.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    // Leichtes Schweben per Tween
    this.tweens.add({
      targets:  this.chest,
      y:        lv.goal.y - 6,
      duration: 900,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    })

    // ── Spieler ──────────────────────────────────────────────────────────────
    this.player = this.physics.add.image(lv.player.startX, lv.player.startY, 'player') as Phaser.Physics.Arcade.Image
    this.player.setCollideWorldBounds(true)
    ;(this.player.body as Phaser.Physics.Arcade.Body).setGravityY(0)

    // ── Kollisionen ──────────────────────────────────────────────────────────
    this.physics.add.collider(this.player, this.platforms)

    this.physics.add.overlap(this.player, this.coins, (_p, coin) => {
      this.collectCoin(coin as Phaser.Physics.Arcade.Image)
    })

    this.physics.add.overlap(this.player, this.enemies, (_p, enemy) => {
      this.hitEnemy(enemy as Phaser.Physics.Arcade.Image)
    })

    this.physics.add.overlap(this.player, this.chest, () => {
      this.reachGoal()
    })

    // ── Kamera ───────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, W, H)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.fadeIn(400)

    // ── Eingabe ───────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.touch   = new TouchControls(this)

    // ── HUD ───────────────────────────────────────────────────────────────────
    this.createHUD()
  }

  update(_time: number, delta: number) {
    // Spiellogik eingefroren bei Game-Over oder Level-Cleared
    if (this.gameOver || this.levelCleared) return

    this.updatePlayer()
    this.updateEnemies()

    // Blink-Effekt während Unverwundbarkeit
    if (this.invincible) {
      this.blinkTimer += delta
      if (this.blinkTimer >= BLINK_INTERVAL) {
        this.blinkTimer = 0
        this.player.setAlpha(this.player.alpha < 1 ? 1 : 0.3)
      }
    }
  }

  // ─── Spieler-Bewegung ────────────────────────────────────────────────────

  private updatePlayer() {
    const body  = this.player.body as Phaser.Physics.Arcade.Body
    const speed = this.levelData.physics.playerSpeed
    const jump  = this.levelData.physics.jumpPower
    const kb    = this.cursors
    const touch = this.touch.state

    this.isOnGround = body.blocked.down

    if (kb.left.isDown || touch.left) {
      body.setVelocityX(-speed)
      this.player.setFlipX(true)
    } else if (kb.right.isDown || touch.right) {
      body.setVelocityX(speed)
      this.player.setFlipX(false)
    } else {
      body.setVelocityX(0)
    }

    const jumpDown = kb.up.isDown || kb.space.isDown || touch.jump
    if (jumpDown && !this.jumpPressed && this.isOnGround) {
      body.setVelocityY(-jump)
      this.jumpPressed = true
    }
    if (!jumpDown) this.jumpPressed = false

    // Visuelles Feedback: Tint in der Luft (nur wenn nicht blinkend)
    if (!this.invincible) {
      this.player.setAlpha(1)
      this.player.setTint(this.isOnGround ? 0xffffff : 0xddddff)
    }
  }

  // ─── Gegner-KI ───────────────────────────────────────────────────────────

  private updateEnemies() {
    this.enemies.getChildren().forEach((obj) => {
      const e    = obj as Phaser.Physics.Arcade.Image
      const body = e.body as Phaser.Physics.Arcade.Body
      const left  = e.getData('patrolLeft')  as number
      const right = e.getData('patrolRight') as number
      const speed = e.getData('speed')       as number
      let   dir   = e.getData('dir')         as number

      // Richtungswechsel an Patrouillengrenzen
      if (e.x <= left) {
        dir = 1
        e.setData('dir', dir)
        e.setFlipX(false)
      } else if (e.x >= right) {
        dir = -1
        e.setData('dir', dir)
        e.setFlipX(true)
      }

      body.setVelocityX(dir * speed)
    })
  }

  // ─── Events ──────────────────────────────────────────────────────────────

  private collectCoin(coin: Phaser.Physics.Arcade.Image) {
    coin.destroy()
    this.score += 10
    this.scoreText.setText(`🪙 ${this.score}`)
    this.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true })
  }

  private hitEnemy(enemy: Phaser.Physics.Arcade.Image) {
    if (this.invincible) return

    // Prüfen ob Spieler von oben auf Gegner fällt → Gegner stirbt
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    if (playerBody.velocity.y > 0 && this.player.y < enemy.y - 10) {
      this.score += 20
      this.scoreText.setText(`🪙 ${this.score}`)
      enemy.destroy()
      // Kleiner Abprall nach oben
      playerBody.setVelocityY(-this.levelData.physics.jumpPower * 0.5)
      return
    }

    // Treffer: Leben abziehen
    this.lives--
    this.livesText.setText(this.buildLivesText())

    if (this.lives <= 0) {
      this.triggerGameOver()
      return
    }

    // Unverwundbarkeit aktivieren
    this.invincible  = true
    this.blinkTimer  = 0
    this.time.delayedCall(INVINCIBLE_MS, () => {
      this.invincible = false
      this.player.setAlpha(1)
      this.player.clearTint()
    })

    // Spieler kurz zurückwerfen
    const dir = this.player.x < enemy.x ? -1 : 1
    ;(this.player.body as Phaser.Physics.Arcade.Body).setVelocity(dir * 200, -250)
  }

  private reachGoal() {
    if (this.levelCleared) return
    this.levelCleared = true
    this.input.keyboard!.enabled = false

    // Truhen-Animation (aufleuchten)
    this.tweens.add({
      targets:  this.chest,
      scaleX:   1.4,
      scaleY:   1.4,
      alpha:    0,
      duration: 500,
    })

    this.cameras.main.fadeOut(600, 255, 215, 0)   // Gold-Fade
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.showLevelClearedOverlay()
    })
  }

  private triggerGameOver() {
    if (this.gameOver) return
    this.gameOver = true
    this.input.keyboard!.enabled = false

    this.cameras.main.shake(400, 0.015)
    this.cameras.main.fadeOut(600, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.showGameOverOverlay()
    })
  }

  // ─── Overlays ────────────────────────────────────────────────────────────

  private showLevelClearedOverlay() {
    const { width, height } = this.scale

    // Hintergrund dunkel
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a14, 0.92)
      .setScrollFactor(0).setDepth(200)

    // Truhen-Icon
    this.add.text(width / 2, height / 2 - 90, '🏆', { fontSize: '64px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(201)

    this.add.text(width / 2, height / 2 - 18, 'Level geschafft!', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize:   '36px',
      color:      '#FFD700',
      stroke:     '#4a2c0a',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201)

    this.add.text(width / 2, height / 2 + 30, `Münzen gesammelt: ${this.score}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize:   '18px',
      color:      '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201)

    this.cameras.main.fadeIn(400)

    // Buttons
    this.createOverlayButton(width / 2 - 90, height / 2 + 90, '🔄 Nochmal', 201, () => {
      this.scene.restart({ levelId: this.levelData.id })
    })
    this.createOverlayButton(width / 2 + 90, height / 2 + 90, '🏠 Auswahl',  201, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('LevelSelectScene')
      })
    })
  }

  private showGameOverOverlay() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0000, 0.92)
      .setScrollFactor(0).setDepth(200)

    this.add.text(width / 2, height / 2 - 80, '💀', { fontSize: '64px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(201)

    this.add.text(width / 2, height / 2 - 12, 'Game Over', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize:   '40px',
      color:      '#e63946',
      stroke:     '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201)

    this.add.text(width / 2, height / 2 + 36, `Münzen: ${this.score}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize:   '16px',
      color:      'rgba(255,255,255,0.6)',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201)

    this.cameras.main.fadeIn(400)

    this.createOverlayButton(width / 2 - 90, height / 2 + 90, '🔄 Nochmal', 201, () => {
      this.scene.restart({ levelId: this.levelData.id })
    })
    this.createOverlayButton(width / 2 + 90, height / 2 + 90, '🏠 Auswahl',  201, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('LevelSelectScene')
      })
    })
  }

  private createOverlayButton(x: number, y: number, label: string, depth: number, cb: () => void) {
    const btn = this.add.text(x, y, label, {
      fontFamily:      'Arial Black, sans-serif',
      fontSize:        '16px',
      color:           '#fff',
      backgroundColor: '#e63946',
      padding:         { x: 16, y: 10 },
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true })

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#c0392b' }))
    btn.on('pointerout',  () => btn.setStyle({ backgroundColor: '#e63946' }))
    btn.on('pointerdown', cb)
    return btn
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  private createHUD() {
    const { width } = this.scale

    this.add.rectangle(width / 2, 22, width, 44, 0x000000, 0.5)
      .setScrollFactor(0).setDepth(50)

    // Level-Name links
    this.add.text(14, 10, `${this.levelData.name} — ${this.levelData.subtitle}`, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize:   '13px',
      color:      '#FFD700',
    }).setScrollFactor(0).setDepth(51)

    // Leben mittig-links
    this.livesText = this.add.text(width / 2 - 80, 10, this.buildLivesText(), {
      fontFamily: 'Arial, sans-serif',
      fontSize:   '14px',
      color:      '#ff6b6b',
    }).setScrollFactor(0).setDepth(51)

    // Score rechts
    this.scoreText = this.add.text(width - 14, 10, '🪙 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize:   '14px',
      color:      '#fff',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51)

    // Zurück-Button
    const back = this.add.text(width / 2 + 60, 11, '⬅ Auswahl', {
      fontFamily: 'Arial, sans-serif',
      fontSize:   '12px',
      color:      'rgba(255,255,255,0.55)',
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true })

    back.on('pointerover', () => back.setColor('#fff'))
    back.on('pointerout',  () => back.setColor('rgba(255,255,255,0.55)'))
    back.on('pointerdown', () => {
      this.cameras.main.fadeOut(280, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('LevelSelectScene')
      })
    })
  }

  private buildLivesText(): string {
    return '❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(Math.max(0, this.levelData.player.lives - this.lives))
  }

  // ─── Hintergrund-Dekoration ───────────────────────────────────────────────

  private addScenery(W: number, H: number) {
    const lv = this.levelData
    if (lv.world.starCount > 0) {
      for (let i = 0; i < lv.world.starCount; i++) {
        const x = Phaser.Math.Between(0, W)
        const y = Phaser.Math.Between(0, H * 0.6)
        this.add.circle(x, y, Phaser.Math.FloatBetween(1, 2), 0xffffff, Phaser.Math.FloatBetween(0.3, 1))
      }
    } else if (lv.world.cloudCount > 0) {
      for (let i = 0; i < lv.world.cloudCount; i++) {
        const x = Phaser.Math.Between(100, W - 100)
        const y = Phaser.Math.Between(40, 180)
        this.addCloud(x, y)
      }
    }
  }

  private addCloud(x: number, y: number) {
    const g = this.add.graphics()
    g.fillStyle(0xffffff, 0.8)
    g.fillEllipse(x,      y,      90, 40)
    g.fillEllipse(x + 30, y - 12, 70, 36)
    g.fillEllipse(x - 25, y - 8,  55, 32)
  }
}
