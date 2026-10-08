import { useEffect, useRef } from 'react'
import { createGame } from '../game/PhaserGame'
import './GameCanvas.css'

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef      = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    gameRef.current = createGame(containerRef.current)

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return <div className="game-canvas" ref={containerRef} />
}
