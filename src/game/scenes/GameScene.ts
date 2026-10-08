import Phaser from 'phaser'
import { LEVELS, LevelConfig } from '../levels'
import { TouchControls } from '../input/TouchControls'

const WORLD_WIDTH  = 3200
const WORLD_HEIGHT = 600
const GROUND_Y     = WORLD_HEIGHT - 32

export class GameScene extends Phaser.Scene {
  private player!:       Phaser.GameObjects.Image
  private playerBody!:   Phaser.Physics.Arcade.Body
  private platforms!:    Phaser.Physics.Arcade.StaticGroup
  private coins!:        Phaser.Physics.Arcade.StaticGroup
  private cursors!:      Phaser.Types.Input.Keyboard.CursorKeys
  private touch!:        TouchControls
  private level!:        LevelConfig
  private score          = 0
  private scoreText!:    Phaser.GameObjects.Text
  private isOnGround     = false
  private jumpPressed    = false

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data: { levelId?: number }) {
    const id    = data.levelId ?? 1
    this.level  = LEVELS.find((l) => l.id === id) ?? LEVELS[0]
    this.score  = 0
  }

  create() {
    const lv = this.level

    // Physics world bounds
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.physics.world.gravity.y = lv.gravity

    // Background
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, lv.bgColor)

    // Background scenery (clouds / stars depending on level)
    this.addScenery()

    // Ground
    this.platforms = this.physics.add.staticGroup()
    for (let x = 0; x < WORLD_WIDTH; x += 64) {
      const g = this.platforms.create(x + 32, WORLD_HEIGHT - 16, 'ground') as Phaser.GameObjects.Image
      g.setTint(lv.groundColor)
    }

    // Platforms layout for this level
    this.buildPlatforms()

    // Coins
    this.coins = this.physics.add.staticGroup()
    this.placCoins()

    // Player
    this.player = this.physics.add.image(120, GROUND_Y - 50, 'player') as unknown as Phaser.GameObjects.Image
    this.playerBody = (this.player as unknown as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.Body
    this.playerBody.setCollideWorldBounds(true)
    this.playerBody.setGravityY(0) // uses world gravity
    ;(this.player as unknown as Phaser.Physics.Arcade.Image).setCollideWorldBounds(true)

    // Colliders
    this.physics.add.collider(this.player as unknown as Phaser.Physics.Arcade.Image, this.platforms)
    this.physics.add.overlap(
      this.player as unknown as Phaser.Physics.Arcade.Image,
      this.coins,
      (_player, coin) => this.collectCoin(coin as Phaser.GameObjects.Image),
      undefined,
      this,
    )

    // Camera
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.startFollow(this.player as unknown as Phaser.GameObjects.GameObject, true, 0.1, 0.1)
    this.cameras.main.fadeIn(400)

    // Keyboard
    this.cursors = this.input.keyboard!.createCursorKeys()

    // Touch controls
    this.touch = new TouchControls(this)

    // HUD
    this.createHUD()
  }

  update() {
    const body   = this.playerBody
    const speed  = this.level.playerSpeed
    const jump   = this.level.jumpPower
    const touch  = this.touch.state
    const kb     = this.cursors

    this.isOnGround = body.blocked.down

    // Horizontal movement
    if (kb.left.isDown || touch.left) {
      body.setVelocityX(-speed)
      this.player.setFlipX(true)
    } else if (kb.right.isDown || touch.right) {
      body.setVelocityX(speed)
      this.player.setFlipX(false)
    } else {
      body.setVelocityX(0)
    }

    // Jump — single press only
    const jumpDown = kb.up.isDown || kb.space.isDown || touch.jump
    if (jumpDown && !this.jumpPressed && this.isOnGround) {
      body.setVelocityY(-jump)
      this.jumpPressed = true
    }
    if (!jumpDown) {
      this.jumpPressed = false
    }

    // Simple walk animation via tint flash (placeholder until sprites added)
    if (!this.isOnGround) {
      this.player.setTint(0xddddff)
    } else {
      this.player.clearTint()
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private addScenery() {
    const lv = this.level
    if (lv.id === 3) {
      // Stars for night level
      for (let i = 0; i < 120; i++) {
        const x = Phaser.Math.Between(0, WORLD_WIDTH)
        const y = Phaser.Math.Between(0, WORLD_HEIGHT * 0.6)
        this.add.circle(x, y, Phaser.Math.FloatBetween(1, 2), 0xffffff, Phaser.Math.FloatBetween(0.3, 1))
      }
    } else {
      // Clouds
      for (let i = 0; i < 18; i++) {
        const x = Phaser.Math.Between(100, WORLD_WIDTH - 100)
        const y = Phaser.Math.Between(40, 180)
        this.addCloud(x, y)
      }
    }
  }

  private addCloud(x: number, y: number) {
    const g = this.add.graphics()
    g.fillStyle(0xffffff, 0.8)
    g.fillEllipse(x, y, 90, 40)
    g.fillEllipse(x + 30, y - 12, 70, 36)
    g.fillEllipse(x - 25, y - 8, 55, 32)
  }

  private buildPlatforms() {
    const lv     = this.level
    const tint   = lv.platformColor
    // Each level gets a deterministic but different layout
    const layouts: Array<Array<[number, number, number]>> = [
      // [x, y, count of 64px tiles]
      [
        [300,  420, 4],
        [600,  340, 3],
        [900,  260, 5],
        [1200, 380, 3],
        [1500, 300, 4],
        [1800, 220, 3],
        [2100, 350, 5],
        [2400, 280, 4],
        [2700, 200, 3],
        [3000, 320, 4],
      ],
      [
        [250,  400, 3],
        [550,  300, 4],
        [850,  220, 3],
        [1100, 360, 5],
        [1400, 260, 3],
        [1700, 180, 4],
        [2000, 320, 3],
        [2300, 240, 5],
        [2600, 160, 3],
        [2900, 300, 4],
      ],
      [
        [280,  380, 2],
        [520,  280, 3],
        [780,  180, 2],
        [1040, 340, 4],
        [1300, 240, 2],
        [1600, 160, 3],
        [1900, 300, 2],
        [2200, 200, 3],
        [2500, 120, 2],
        [2800, 260, 3],
      ],
    ]

    const layout = layouts[(lv.id - 1) % layouts.length]
    layout.forEach(([x, y, count]) => {
      for (let i = 0; i < count; i++) {
        const p = this.platforms.create(x + i * 64 + 32, y, 'platform') as Phaser.Physics.Arcade.Image
        p.setTint(tint)
        p.refreshBody()
      }
    })
  }

  private placCoins() {
    // Place coins above each platform cluster
    const positions = [
      [380, 380], [460, 380], [660, 300], [960, 220],
      [1280, 340], [1580, 260], [1880, 180], [2180, 310],
      [2480, 240], [2780, 160], [1040, 300], [2050, 200],
    ]
    positions.forEach(([x, y]) => {
      this.coins.create(x, y - 20, 'coin')
    })
  }

  private collectCoin(coin: Phaser.GameObjects.Image) {
    coin.destroy()
    this.score += 10
    this.scoreText.setText(`Münzen: ${this.score}`)

    // Pop tween on score text
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.3, scaleY: 1.3,
      duration: 100,
      yoyo: true,
    })
  }

  private createHUD() {
    const { width } = this.scale

    // Semi-transparent HUD bar
    this.add.rectangle(width / 2, 22, width, 44, 0x000000, 0.45)
      .setScrollFactor(0)
      .setDepth(50)

    this.add.text(16, 10, `${this.level.name} — ${this.level.subtitle}`, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '14px',
      color: '#FFD700',
    })
      .setScrollFactor(0)
      .setDepth(51)

    this.scoreText = this.add.text(width - 16, 10, 'Münzen: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#fff',
    })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(51)

    // Back button
    const backBtn = this.add.text(width / 2, 11, '⬅ Level-Auswahl', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: 'rgba(255,255,255,0.6)',
    })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(51)
      .setInteractive({ useHandCursor: true })

    backBtn.on('pointerover', () => backBtn.setColor('#fff'))
    backBtn.on('pointerout',  () => backBtn.setColor('rgba(255,255,255,0.6)'))
    backBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('LevelSelectScene')
      })
    })
  }
}
