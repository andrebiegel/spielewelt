import Phaser from 'phaser'
import { BootScene }        from './scenes/BootScene'
import { LevelSelectScene } from './scenes/LevelSelectScene'
import { GameScene }        from './scenes/GameScene'

export function createGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    width:  parent.clientWidth  || window.innerWidth,
    height: parent.clientHeight || window.innerHeight,
    backgroundColor: '#1a1a2e',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },   // per-scene gravity
        debug: false,
      },
    },
    scene: [BootScene, LevelSelectScene, GameScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      activePointers: 3,   // multi-touch
    },
  }

  return new Phaser.Game(config)
}
