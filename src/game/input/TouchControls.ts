/**
 * TouchControls — virtual on-screen d-pad + jump button for iOS/iPad.
 * Also handles swipe gestures as fallback:
 *   swipe right → move right
 *   swipe left  → move left
 *   swipe up    → jump
 */

export interface TouchState {
  left: boolean
  right: boolean
  jump: boolean
}

const SWIPE_THRESHOLD = 30   // px
const SWIPE_ANGLE     = 45   // degrees — cone for direction detection

export class TouchControls {
  readonly state: TouchState = { left: false, right: false, jump: false }

  private startX = 0
  private startY = 0
  private btnLeft!:  Phaser.GameObjects.Rectangle
  private btnRight!: Phaser.GameObjects.Rectangle
  private btnJump!:  Phaser.GameObjects.Ellipse
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.createButtons()
    this.registerSwipe()
  }

  private createButtons() {
    const { width, height } = this.scene.scale

    const btnAlpha = 0.35
    const y = height - 60

    // Left arrow
    this.btnLeft = this.scene.add.rectangle(60, y, 80, 80, 0xffffff, btnAlpha)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive()

    this.scene.add.text(60, y, '◀', { fontSize: '28px', color: '#fff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101)
      .setAlpha(0.8)

    // Right arrow
    this.btnRight = this.scene.add.rectangle(160, y, 80, 80, 0xffffff, btnAlpha)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive()

    this.scene.add.text(160, y, '▶', { fontSize: '28px', color: '#fff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101)
      .setAlpha(0.8)

    // Jump button (right side)
    this.btnJump = this.scene.add.ellipse(width - 70, y, 90, 90, 0xe63946, btnAlpha)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive()

    this.scene.add.text(width - 70, y, '▲', { fontSize: '28px', color: '#fff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101)
      .setAlpha(0.8)

    // Pointer down/up for each button
    this.btnLeft.on('pointerdown',  () => { this.state.left  = true  })
    this.btnLeft.on('pointerup',    () => { this.state.left  = false })
    this.btnLeft.on('pointerout',   () => { this.state.left  = false })

    this.btnRight.on('pointerdown', () => { this.state.right = true  })
    this.btnRight.on('pointerup',   () => { this.state.right = false })
    this.btnRight.on('pointerout',  () => { this.state.right = false })

    this.btnJump.on('pointerdown',  () => { this.state.jump  = true  })
    this.btnJump.on('pointerup',    () => { this.state.jump  = false })
    this.btnJump.on('pointerout',   () => { this.state.jump  = false })
  }

  private registerSwipe() {
    const input = this.scene.input

    input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.startX = p.x
      this.startY = p.y
    })

    input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const dx = p.x - this.startX
      const dy = p.y - this.startY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < SWIPE_THRESHOLD) return

      const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI))

      if (angle < SWIPE_ANGLE) {
        // swipe right
        this.state.right = true
        setTimeout(() => { this.state.right = false }, 300)
      } else if (angle > 180 - SWIPE_ANGLE) {
        // swipe left
        this.state.left = true
        setTimeout(() => { this.state.left = false }, 300)
      } else if (dy < 0 && angle > 90 - SWIPE_ANGLE && angle < 90 + SWIPE_ANGLE) {
        // swipe up → jump
        this.state.jump = true
        setTimeout(() => { this.state.jump = false }, 150)
      }
    })
  }

  destroy() {
    this.btnLeft.destroy()
    this.btnRight.destroy()
    this.btnJump.destroy()
  }
}
