/**
 * @file LevelSelectScene.ts
 * @description Phaser-interne Level-Auswahl — liest alle Level aus levels/*.json.
 *
 * Level werden automatisch erkannt: neue JSON-Datei anlegen = neues Level erscheint.
 * Sortierung nach `id`-Feld. Gesperrte Level (`locked: true`) zeigen Schloss-Icon.
 */

import Phaser from 'phaser'
import { LEVELS, parseColor } from '../levelLoader'

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' })
  }

  create() {
    const { width, height } = this.scale

    // Hintergrund
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // Sternenhimmel
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, width)
      const y = Phaser.Math.Between(0, height * 0.75)
      this.add.circle(x, y, Phaser.Math.FloatBetween(1, 2.5), 0xffffff, Phaser.Math.FloatBetween(0.3, 0.9))
    }

    // Titel
    this.add.text(width / 2, 60, '🍄 SUPER JUMPER', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '34px',
      color: '#FFD700',
      stroke: '#4a2c0a',
      strokeThickness: 4,
    }).setOrigin(0.5)

    this.add.text(width / 2, 105, 'Wähle dein Level', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: 'rgba(255,255,255,0.5)',
    }).setOrigin(0.5)

    // ── Karten-Layout (Tutorial + Level-Karten) ───────────────────────────────
    const totalCards = LEVELS.length + 1   // +1 für Tutorial
    const cardW  = Math.min(200, (width - 80) / totalCards - 16)
    const cardH  = 210
    const gap    = 20
    const totalW = totalCards * cardW + (totalCards - 1) * gap
    const startX = (width - totalW) / 2
    const cy     = height / 2 + 30

    // ── Tutorial-Kachel (immer erste Position) ────────────────────────────────
    const tcx = startX + cardW / 2

    const tutCard = this.add.rectangle(tcx, cy, cardW, cardH, 0x0f2044)
      .setStrokeStyle(2, 0x3a86ff)
      .setInteractive({ useHandCursor: true })

    this.add.circle(tcx, cy - 62, 32, 0x3a86ff)
    this.add.text(tcx, cy - 62, '📖', { fontSize: '22px' }).setOrigin(0.5)

    this.add.text(tcx, cy - 16, 'Tutorial', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '17px',
      color: '#ffffff',
    }).setOrigin(0.5)

    this.add.text(tcx, cy + 10, 'Steuerung lernen', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: 'rgba(255,255,255,0.5)',
    }).setOrigin(0.5)

    this.add.text(tcx, cy + 36, '5 Schritte  •  Geführt', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: 'rgba(58,134,255,0.7)',
      align: 'center',
    }).setOrigin(0.5)

    const tutBtn = this.add.text(tcx, cy + 72, '▶  STARTEN', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '13px',
      color: '#fff',
      backgroundColor: '#3a86ff',
      padding: { x: 12, y: 7 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    tutBtn.on('pointerover',  () => tutBtn.setStyle({ backgroundColor: '#2563cc' }))
    tutBtn.on('pointerout',   () => tutBtn.setStyle({ backgroundColor: '#3a86ff' }))
    tutBtn.on('pointerdown',  () => this.startTutorial())
    tutCard.on('pointerdown', () => this.startTutorial())

    tutCard.on('pointerover', () => {
      this.tweens.add({ targets: tutCard, scaleX: 1.03, scaleY: 1.03, duration: 120 })
    })
    tutCard.on('pointerout', () => {
      this.tweens.add({ targets: tutCard, scaleX: 1, scaleY: 1, duration: 120 })
    })

    // ── Level-Karten ─────────────────────────────────────────────────────────
    LEVELS.forEach((level, i) => {
      const cx = startX + (i + 1) * (cardW + gap) + cardW / 2  // +1 = nach Tutorial

      const bgColor = parseColor(level.world.bgColor)
      const locked  = level.locked

      // Karten-Hintergrund
      const card = this.add.rectangle(cx, cy, cardW, cardH, 0x16213e)
        .setStrokeStyle(2, locked ? 0x555566 : 0xe63946)
        .setInteractive({ useHandCursor: !locked })

      // Level-Nummer-Kreis
      this.add.circle(cx, cy - 62, 32, locked ? 0x333344 : bgColor)
      this.add.text(cx, cy - 62, String(level.id), {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '26px',
        color: locked ? '#666677' : '#FFD700',
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(0.5)

      // Name + Subtitle
      this.add.text(cx, cy - 16, level.name, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '17px',
        color: locked ? '#555566' : '#ffffff',
      }).setOrigin(0.5)

      this.add.text(cx, cy + 10, level.subtitle, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: locked ? '#444455' : 'rgba(255,255,255,0.5)',
      }).setOrigin(0.5)

      // Stats
      if (!locked) {
        this.add.text(cx, cy + 36, [
          `❤️ ${level.player.lives} Leben`,
          `👾 ${level.enemies.length} Gegner`,
          `🪙 ${level.coins.length} Münzen`,
        ].join('   '), {
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.38)',
          align: 'center',
          wordWrap: { width: cardW - 16 },
        }).setOrigin(0.5)
      }

      // Spielen-Button oder Schloss
      if (locked) {
        this.add.text(cx, cy + 72, '🔒', { fontSize: '28px' }).setOrigin(0.5)
      } else {
        const btn = this.add.text(cx, cy + 72, '▶  SPIELEN', {
          fontFamily: 'Arial Black, sans-serif',
          fontSize: '13px',
          color: '#fff',
          backgroundColor: '#e63946',
          padding: { x: 12, y: 7 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })

        btn.on('pointerover',  () => btn.setStyle({ backgroundColor: '#c0392b' }))
        btn.on('pointerout',   () => btn.setStyle({ backgroundColor: '#e63946' }))
        btn.on('pointerdown',  () => this.startLevel(level.id))
        card.on('pointerdown', () => this.startLevel(level.id))

        card.on('pointerover', () => {
          this.tweens.add({ targets: card, scaleX: 1.03, scaleY: 1.03, duration: 120 })
        })
        card.on('pointerout', () => {
          this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 120 })
        })
      }
    })

    // Footer
    this.add.text(width / 2, height - 28, '← → Bewegen  |  ↑ Springen  |  Touch: Buttons oder Wischen', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: 'rgba(255,255,255,0.28)',
    }).setOrigin(0.5)
  }

  private startLevel(id: number) {
    this.cameras.main.fadeOut(300, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { levelId: id })
    })
  }

  private startTutorial() {
    this.cameras.main.fadeOut(300, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('TutorialScene')
    })
  }
}
