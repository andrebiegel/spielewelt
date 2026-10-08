import Phaser from 'phaser'
import { LEVELS } from '../levels'

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' })
  }

  create() {
    const { width, height } = this.scale

    // Background gradient via rectangle
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // Stars background
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, width)
      const y = Phaser.Math.Between(0, height * 0.75)
      const r = Phaser.Math.FloatBetween(1, 2.5)
      this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.9))
    }

    // Title
    this.add.text(width / 2, 70, '🍄 SUPER JUMPER', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '36px',
      color: '#FFD700',
      stroke: '#4a2c0a',
      strokeThickness: 4,
    }).setOrigin(0.5)

    this.add.text(width / 2, 115, 'Wähle dein Level', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: 'rgba(255,255,255,0.55)',
    }).setOrigin(0.5)

    // Level cards
    const cardW   = Math.min(220, (width - 80) / LEVELS.length - 20)
    const cardH   = 200
    const gap     = 24
    const totalW  = LEVELS.length * cardW + (LEVELS.length - 1) * gap
    const startX  = (width - totalW) / 2

    LEVELS.forEach((level, i) => {
      const cx = startX + i * (cardW + gap) + cardW / 2
      const cy = height / 2 + 20

      // Card background
      const card = this.add.rectangle(cx, cy, cardW, cardH, 0x16213e)
        .setStrokeStyle(2, level.locked ? 0x555566 : 0xe63946)
        .setInteractive({ useHandCursor: !level.locked })

      // Level number circle
      this.add.circle(cx, cy - 55, 34, level.locked ? 0x333344 : level.bgColor)
      this.add.text(cx, cy - 55, String(level.id), {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '28px',
        color: level.locked ? '#666677' : '#FFD700',
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(0.5)

      // Level name
      this.add.text(cx, cy + 2, level.name, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '18px',
        color: level.locked ? '#555566' : '#ffffff',
      }).setOrigin(0.5)

      // Subtitle
      this.add.text(cx, cy + 30, level.subtitle, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: level.locked ? '#444455' : 'rgba(255,255,255,0.55)',
      }).setOrigin(0.5)

      // Stats row
      if (!level.locked) {
        this.add.text(cx, cy + 60, `⚡ ${level.playerSpeed}  ↑ ${level.jumpPower}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.4)',
        }).setOrigin(0.5)
      }

      // Lock icon or "Spielen" button
      if (level.locked) {
        this.add.text(cx, cy + 72, '🔒', { fontSize: '28px' }).setOrigin(0.5)
      } else {
        const btn = this.add.text(cx, cy + 75, '▶  SPIELEN', {
          fontFamily: 'Arial Black, sans-serif',
          fontSize: '14px',
          color: '#fff',
          backgroundColor: '#e63946',
          padding: { x: 14, y: 8 },
        })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })

        btn.on('pointerover',  () => btn.setStyle({ backgroundColor: '#c0392b' }))
        btn.on('pointerout',   () => btn.setStyle({ backgroundColor: '#e63946' }))
        btn.on('pointerdown',  () => this.startLevel(level.id))
        card.on('pointerdown', () => this.startLevel(level.id))
      }

      // Hover effect on card
      if (!level.locked) {
        card.on('pointerover', () => {
          this.tweens.add({ targets: card, scaleX: 1.03, scaleY: 1.03, duration: 120 })
        })
        card.on('pointerout', () => {
          this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 120 })
        })
      }
    })

    // Footer hint
    this.add.text(width / 2, height - 30, '← → Bewegen  |  ↑ Springen  |  Touch: Buttons oder Wischen', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: 'rgba(255,255,255,0.3)',
    }).setOrigin(0.5)
  }

  private startLevel(id: number) {
    this.cameras.main.fadeOut(300, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { levelId: id })
    })
  }
}
