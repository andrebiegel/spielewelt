/**
 * @file SuperJumperCanvas.tsx
 * @description React-Wrapper-Komponente für die Super Jumper Phaser-Instanz.
 * Zugehörigkeit: games/super-jumper — spezifisch für dieses Spiel.
 *
 * Bettet Phaser in React ein: verwaltet Lifecycle (Mount/Unmount),
 * verhindert Doppel-Initialisierung im React 18 StrictMode.
 *
 * Ref React useEffect: https://react.dev/reference/react/useEffect
 * Ref Phaser destroy:  https://phaser.io/docs/latest/Phaser.Game#destroy
 */

import { useEffect, useRef } from 'react'
import { createGame } from './PhaserGame'
import './SuperJumperCanvas.css'

/**
 * Rendert einen vollflächigen Container und startet darin die Phaser.Game-Instanz.
 * Keine Props — Konfiguration kommt aus PhaserGame.ts und levels.ts.
 */
export default function SuperJumperCanvas() {
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
