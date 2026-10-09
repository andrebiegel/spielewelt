/**
 * @file App.tsx
 * @description Root-Komponente der Super Jumper PWA-Plattform.
 *
 * Architektur:
 *   App ist der zentrale Orchestrator. Er verwaltet das Routing zwischen der
 *   Spielauswahl und den einzelnen Spielen über einen einfachen State-basierten
 *   Router — ohne externe Routing-Bibliothek (kein React Router).
 *
 * Warum kein React Router?
 *   - Die App hat keine URL-Struktur (PWA im Standalone-Modus hat keine Browser-URL-Leiste)
 *   - Nur zwei Ebenen: Home (Spielauswahl) und Spiel
 *   - Weniger Bundle-Größe, keine zusätzliche Abhängigkeit
 *   - Einfacher Code — ein `useState` reicht für die gesamte Navigation
 *
 * Routing-Konzept:
 *   `route` ist ein String-State:
 *     - `'home'`          → GameSelectView wird gerendert
 *     - `'super-jumper'`  → SuperJumperCanvas (Phaser) wird gerendert
 *     - andere Strings    → Fallback-Fehlermeldung
 *
 *   Der `route`-Wert entspricht exakt dem `component`-Feld in `games.json`.
 *   Neues Spiel hinzufügen: 1. games.json ergänzen, 2. `if`-Zweig in renderContent() hinzufügen.
 *   Vollständige Anleitung: `.opencode/skills/new-game/SKILL.md`
 *
 * Layout:
 *   Das `<div class="app">` ist ein Flex-Container (column):
 *     - `<Navbar>` (56px, flex-shrink: 0)
 *     - `<main class="main">` (flex: 1, füllt restlichen Platz)
 */

import { useState } from 'react'
import './App.css'
import Navbar          from './shell/Navbar'
import GameSelectView  from './game-select/GameSelectView'
import SuperJumperCanvas from '../games/super-jumper/SuperJumperCanvas'

/**
 * Routing-Typ: 'home' für die Spielauswahl, beliebiger String für ein Spiel-Component.
 * Der String entspricht dem `component`-Feld in games.json.
 */
type Route = 'home' | string

/**
 * Root-Komponente — rendert Navbar + aktiven View basierend auf dem Route-State.
 */
export default function App() {
  const [route, setRoute] = useState<Route>('home')

  /**
   * Bestimmt welche Komponente im `<main>`-Bereich gerendert wird.
   *
   * Reihenfolge:
   *   1. 'home'          → Spielauswahl
   *   2. 'super-jumper'  → Phaser-Spielcanvas
   *   3. unbekannt       → Fehlermeldung mit Zurück-Button
   *
   * ── Hierhin neue Spiele eintragen ────────────────────────────────────────
   * Beispiel:
   *   import MeinSpielCanvas from '../games/mein-spiel/MeinSpielCanvas'
   *   if (route === 'mein-spiel') return <MeinSpielCanvas />
   * ─────────────────────────────────────────────────────────────────────────
   */
  function renderContent() {
    if (route === 'home') {
      return <GameSelectView onSelect={(id) => setRoute(id)} />
    }

    if (route === 'super-jumper') {
      return <SuperJumperCanvas />
    }

    return (
      <div className="main__not-found">
        <p>Spiel <code>{route}</code> nicht gefunden.</p>
        <button onClick={() => setRoute('home')}>← Zurück</button>
      </div>
    )
  }

  return (
    <div className="app">
      <Navbar
        onHome={() => setRoute('home')}
        currentGame={route !== 'home' ? route : undefined}
      />
      <main className="main">
        {renderContent()}
      </main>
    </div>
  )
}
