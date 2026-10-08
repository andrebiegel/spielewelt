import Phaser from 'phaser'

/**
 * BootScene — generates all procedural textures used in the game.
 * No external assets needed.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create() {
    // Player texture (32×48 — simple blocky hero)
    const playerGfx = this.make.graphics({ x: 0, y: 0 })
    // Body (red)
    playerGfx.fillStyle(0xe63946)
    playerGfx.fillRect(4, 16, 24, 20)
    // Hat (red)
    playerGfx.fillRect(2, 4, 28, 14)
    // Hat brim
    playerGfx.fillStyle(0xc0392b)
    playerGfx.fillRect(0, 16, 32, 4)
    // Face (skin)
    playerGfx.fillStyle(0xf4a261)
    playerGfx.fillRect(6, 6, 20, 12)
    // Overalls (blue)
    playerGfx.fillStyle(0x3a86ff)
    playerGfx.fillRect(6, 24, 20, 12)
    // Shoes
    playerGfx.fillStyle(0x4a2c0a)
    playerGfx.fillRect(2, 36, 12, 8)
    playerGfx.fillRect(18, 36, 12, 8)
    // Eyes
    playerGfx.fillStyle(0x1a1a2e)
    playerGfx.fillRect(10, 8, 4, 4)
    playerGfx.fillRect(18, 8, 4, 4)
    // Mustache
    playerGfx.fillStyle(0x4a2c0a)
    playerGfx.fillRect(8, 14, 16, 3)

    playerGfx.generateTexture('player', 32, 48)
    playerGfx.destroy()

    // Platform texture (64×16)
    const platGfx = this.make.graphics({ x: 0, y: 0 })
    platGfx.fillStyle(0x8B4513)
    platGfx.fillRect(0, 0, 64, 16)
    platGfx.fillStyle(0x32CD32)
    platGfx.fillRect(0, 0, 64, 6)
    platGfx.fillStyle(0x228B22)
    platGfx.fillRect(0, 6, 64, 2)
    platGfx.generateTexture('platform', 64, 16)
    platGfx.destroy()

    // Ground tile (64×32)
    const groundGfx = this.make.graphics({ x: 0, y: 0 })
    groundGfx.fillStyle(0x228B22)
    groundGfx.fillRect(0, 0, 64, 32)
    groundGfx.fillStyle(0x32CD32)
    groundGfx.fillRect(0, 0, 64, 8)
    groundGfx.fillStyle(0x1a6e1a)
    groundGfx.fillRect(0, 8, 64, 2)
    groundGfx.generateTexture('ground', 64, 32)
    groundGfx.destroy()

    // Coin texture (16×16)
    const coinGfx = this.make.graphics({ x: 0, y: 0 })
    coinGfx.fillStyle(0xFFD700)
    coinGfx.fillCircle(8, 8, 8)
    coinGfx.fillStyle(0xFFA500)
    coinGfx.fillCircle(8, 8, 5)
    coinGfx.generateTexture('coin', 16, 16)
    coinGfx.destroy()

    this.scene.start('LevelSelectScene')
  }
}
