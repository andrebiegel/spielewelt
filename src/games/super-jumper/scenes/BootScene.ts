/**
 * @file BootScene.ts
 * @description Erste Phaser-Scene — erzeugt alle Spieltexturen prozedural.
 *
 * Textur-Keys im Cache nach create():
 *   'player'   — 32×48 px  Spieler-Charakter
 *   'platform' — 64×16 px  Plattform-Kachel
 *   'ground'   — 64×32 px  Boden-Kachel
 *   'coin'     — 16×16 px  Münze
 *   'enemy'    — 28×32 px  Gegner (rotes Pilz-Wesen)
 *   'chest'    — 40×36 px  Schatztruhe (Levelziel)
 *
 * Ref: https://phaser.io/docs/latest/Phaser.GameObjects.Graphics#generateTexture
 */

import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create() {
    this.makePlayer()
    this.makePlatformGrass()
    this.makePlatformStone()
    this.makePlatformWood()
    this.makePlatformIce()
    this.makeGround()
    this.makeCoin()
    this.makeEnemy()
    this.makeChest()
    this.scene.start('LevelSelectScene')
  }

  // ── Spieler (32×48) ─────────────────────────────────────────────────────

  private makePlayer() {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xe63946); g.fillRect(4, 16, 24, 20)   // Körper
    g.fillRect(2, 4, 28, 14)                             // Hut
    g.fillStyle(0xc0392b); g.fillRect(0, 16, 32, 4)    // Hutrand
    g.fillStyle(0xf4a261); g.fillRect(6, 6, 20, 12)    // Gesicht
    g.fillStyle(0x3a86ff); g.fillRect(6, 24, 20, 12)   // Latzhose
    g.fillStyle(0x4a2c0a)
    g.fillRect(2, 36, 12, 8); g.fillRect(18, 36, 12, 8) // Schuhe
    g.fillStyle(0x1a1a2e)
    g.fillRect(10, 8, 4, 4); g.fillRect(18, 8, 4, 4)   // Augen
    g.fillStyle(0x4a2c0a); g.fillRect(8, 14, 16, 3)    // Schnurrbart
    g.generateTexture('player', 32, 48)
    g.destroy()
  }

  // ── Plattform: Grass (64×16) — braune Erde, grüne Gras-Oberkante ──────────

  private makePlatformGrass() {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x8B4513); g.fillRect(0,  0, 64, 16)   // Erde
    g.fillStyle(0x32CD32); g.fillRect(0,  0, 64,  6)   // Gras (hell)
    g.fillStyle(0x228B22); g.fillRect(0,  6, 64,  2)   // Gras-Schatten
    // Erde-Textur: kleine Flecken
    g.fillStyle(0x7a3b10, 0.5)
    g.fillRect(10, 8, 8, 4)
    g.fillRect(36, 9, 6, 3)
    g.generateTexture('platform-grass', 64, 16)
    g.destroy()
  }

  // ── Plattform: Stone (64×16) — grauer Stein mit Rissen ───────────────────

  private makePlatformStone() {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x7f8c8d); g.fillRect(0, 0, 64, 16)    // Stein-Basis
    g.fillStyle(0x95a5a6); g.fillRect(0, 0, 64,  4)    // Helle Oberkante
    g.fillStyle(0x626567); g.fillRect(0, 4, 64,  2)    // Schattenstreifen
    // Fugen / Risse
    g.fillStyle(0x4d5356, 0.7)
    g.fillRect(0,  0,  1, 16)   // linke Kante
    g.fillRect(63, 0,  1, 16)   // rechte Kante
    g.fillRect(21, 0,  2, 16)   // mittlere Fuge links
    g.fillRect(42, 0,  2, 16)   // mittlere Fuge rechts
    g.fillRect(0,  8, 64,  1)   // horizontale Fuge
    // Highlight oben-links für 3D-Effekt
    g.fillStyle(0xbdc3c7, 0.4)
    g.fillRect(2, 1, 18, 2)
    g.fillRect(24, 1, 16, 2)
    g.generateTexture('platform-stone', 64, 16)
    g.destroy()
  }

  // ── Plattform: Wood (64×16) — helles Holz mit Maserung ───────────────────

  private makePlatformWood() {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xd4a017); g.fillRect(0, 0, 64, 16)    // Holz-Basis (golden)
    g.fillStyle(0xb8860b); g.fillRect(0, 0, 64,  3)    // Oberkante dunkler
    g.fillStyle(0xc49a0a); g.fillRect(0, 3, 64,  2)    // Übergang
    // Holzmaserung (horizontale Linien)
    g.fillStyle(0xb8860b, 0.5)
    g.fillRect(0,  6, 64, 1)
    g.fillRect(0, 10, 64, 1)
    g.fillRect(0, 13, 64, 1)
    // Holzbretter-Fugen (vertikal)
    g.fillStyle(0x8B6914, 0.6)
    g.fillRect(0,  0, 1, 16)
    g.fillRect(31, 0, 2, 16)
    g.fillRect(63, 0, 1, 16)
    // Schrauben / Nägel-Andeutungen
    g.fillStyle(0x8B6914)
    g.fillRect(4,  2, 3, 3)
    g.fillRect(57, 2, 3, 3)
    g.fillRect(28, 2, 3, 3)
    g.generateTexture('platform-wood', 64, 16)
    g.destroy()
  }

  // ── Plattform: Ice (64×16) — hellblaues Eis mit Glanz ────────────────────

  private makePlatformIce() {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xa8d8ea); g.fillRect(0, 0, 64, 16)    // Eis-Basis (hellblau)
    g.fillStyle(0xd6eaf8); g.fillRect(0, 0, 64,  4)    // Sehr helle Oberkante
    g.fillStyle(0x85c1e9); g.fillRect(0, 4, 64,  2)    // Übergangsstreifen
    // Glanzflecken (unregelmäßig)
    g.fillStyle(0xffffff, 0.7)
    g.fillRect(5,  1, 12, 2)
    g.fillRect(30, 1,  8, 1)
    g.fillRect(50, 2,  9, 2)
    // Eis-Risse
    g.fillStyle(0x5dade2, 0.4)
    g.fillRect(18, 5, 1, 8)
    g.fillRect(45, 6, 1, 7)
    // Unterkante leicht dunkler
    g.fillStyle(0x7fb3d3)
    g.fillRect(0, 14, 64, 2)
    g.generateTexture('platform-ice', 64, 16)
    g.destroy()
  }

  // ── Boden (64×32) ────────────────────────────────────────────────────────

  private makeGround() {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x228B22); g.fillRect(0, 0, 64, 32)
    g.fillStyle(0x32CD32); g.fillRect(0, 0, 64, 8)
    g.fillStyle(0x1a6e1a); g.fillRect(0, 8, 64, 2)
    g.generateTexture('ground', 64, 32)
    g.destroy()
  }

  // ── Münze (16×16) ────────────────────────────────────────────────────────

  private makeCoin() {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xFFD700); g.fillCircle(8, 8, 8)
    g.fillStyle(0xFFA500); g.fillCircle(8, 8, 5)
    g.generateTexture('coin', 16, 16)
    g.destroy()
  }

  // ── Gegner (28×32) — roter Pilz-Goomba-Stil ──────────────────────────────

  private makeEnemy() {
    const g = this.make.graphics({ x: 0, y: 0 })
    // Körper (rund, braun-rot)
    g.fillStyle(0xc0392b)
    g.fillEllipse(14, 20, 26, 22)
    // Kopf (runder, dunkler Pilzhut)
    g.fillStyle(0x7d1a0c)
    g.fillEllipse(14, 10, 26, 18)
    // Hut-Punkte (hell)
    g.fillStyle(0xf5b7b1)
    g.fillCircle(8,  7, 3)
    g.fillCircle(18, 5, 4)
    // Augen (weiß + schwarz)
    g.fillStyle(0xffffff)
    g.fillEllipse(8,  21, 8, 7)
    g.fillEllipse(20, 21, 8, 7)
    g.fillStyle(0x1a1a2e)
    g.fillCircle(9,  22, 2)
    g.fillCircle(21, 22, 2)
    // Füße
    g.fillStyle(0x4a2c0a)
    g.fillRect(2,  28, 10, 4)
    g.fillRect(16, 28, 10, 4)
    g.generateTexture('enemy', 28, 32)
    g.destroy()
  }

  // ── Schatztruhe (40×36) ──────────────────────────────────────────────────

  private makeChest() {
    const g = this.make.graphics({ x: 0, y: 0 })
    // Truhen-Körper (braun)
    g.fillStyle(0x7d5a1e)
    g.fillRect(2, 14, 36, 20)
    // Truhen-Deckel (leicht gewölbt, heller)
    g.fillStyle(0xb8860b)
    g.fillRect(2, 6, 36, 12)
    g.fillStyle(0xd4a017)
    g.fillRect(4, 7, 32, 4)
    // Goldener Beschlag (horizontal)
    g.fillStyle(0xFFD700)
    g.fillRect(2, 18, 36, 4)
    // Goldene Ecken
    g.fillRect(2,  14, 6, 6)
    g.fillRect(32, 14, 6, 6)
    g.fillRect(2,  28, 6, 6)
    g.fillRect(32, 28, 6, 6)
    // Schloss (mittig)
    g.fillStyle(0xFFD700)
    g.fillRect(16, 15, 8, 8)
    g.fillStyle(0x7d5a1e)
    g.fillCircle(20, 17, 2)
    g.fillRect(18, 18, 4, 4)
    // Goldener Rand oben
    g.fillStyle(0xFFD700)
    g.fillRect(2, 6, 36, 2)
    g.generateTexture('chest', 40, 36)
    g.destroy()
  }
}
