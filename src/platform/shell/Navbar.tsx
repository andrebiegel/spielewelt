/**
 * @file Navbar.tsx
 * @description Globale Navigationsleiste der Plattform-Shell.
 * Zugehörigkeit: platform/shell — immer sichtbar, unabhängig vom aktiven Spiel.
 *
 * Verantwortlichkeiten:
 *   - Logo / Heimnavigation (Spielauswahl)
 *   - Breadcrumb wenn ein Spiel aktiv ist
 *   - Einstellungs-Dropdown mit: Information, Update Spiel
 *   - Rendert InfoView und UpdateOverlay als Portale
 */

/**
 * @file Navbar.tsx
 * @description Globale Navigationsleiste der Plattform-Shell.
 *
 * Vollständig spielunabhängig — kein Spiel-Name ist hardcodiert.
 * Das aktive Spiel wird als `currentGame`-Prop übergeben und nur als
 * Breadcrumb angezeigt. Logo und Titel beziehen sich auf die Plattform.
 */

import { useState, useRef, useEffect } from 'react'
import './Navbar.css'
import InfoView      from './InfoView'
import KonfigView   from './KonfigView'
import UpdateOverlay from './UpdateOverlay'
import { useServiceWorkerUpdate } from '../hooks/useServiceWorkerUpdate'
import games from '../games.json'

type View = 'info' | 'konfig' | null

/** Label des Update-Buttons je nach Zustand — plattform-neutral formuliert */
const UPDATE_LABEL: Record<string, string> = {
  idle:     'App aktualisieren',
  updating: 'Aktualisiere…',
  done:     'Fertig — Neustart…',
  error:    'Fehler — erneut versuchen',
}

const UPDATE_ICON: Record<string, string> = {
  idle:     '🔄',
  updating: '⏳',
  done:     '✅',
  error:    '❌',
}

interface NavbarProps {
  /** Callback für Logo-Klick → navigiert zur Spielauswahl */
  onHome?: () => void
  /**
   * component-ID des aktiven Spiels (aus games.json).
   * Wird verwendet um Icon + Titel des aktiven Spiels im Breadcrumb anzuzeigen.
   * Undefined = Spielauswahl ist aktiv, kein Breadcrumb.
   */
  currentGame?: string
}

export default function Navbar({ onHome, currentGame }: NavbarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeView, setActiveView]     = useState<View>(null)
  const dropdownRef = useRef<HTMLLIElement>(null)
  const { state: updateState, progress: updateProgress, step: updateStep, triggerUpdate } = useServiceWorkerUpdate()

  // Aktives Spiel aus games.json nachschlagen für Icon + Titel im Breadcrumb
  const activeGameMeta = currentGame
    ? (games as Array<{ id: string; title: string; icon: string; component: string }>)
        .find((g) => g.component === currentGame)
    : undefined

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function openView(view: View) {
    setActiveView(view)
    setSettingsOpen(false)
  }

  function handleUpdate() {
    setSettingsOpen(false)
    triggerUpdate()
  }

  return (
    <>
      <nav className="navbar">
        {/* Logo — Plattformname, kein spiel-spezifischer Name */}
        <button className="navbar__logo" onClick={onHome} title="Zur Spielauswahl">
          <span className="navbar__logo-icon">🎮</span>
          <span className="navbar__logo-text">Spieleplattform</span>
          {/* Breadcrumb zeigt Icon + Titel des aktiven Spiels */}
          {activeGameMeta && (
            <span className="navbar__breadcrumb">
              / {activeGameMeta.icon} {activeGameMeta.title}
            </span>
          )}
        </button>

        <ul className="navbar__links">
          {/* "← Spielauswahl"-Link nur wenn ein Spiel aktiv ist */}
          {currentGame && (
            <li>
              <button className="navbar__link navbar__link--btn" onClick={onHome}>
                ← Spielauswahl
              </button>
            </li>
          )}

          <li className="navbar__dropdown-wrap" ref={dropdownRef}>
            <button
              className={`navbar__link navbar__link--btn${settingsOpen ? ' navbar__link--active' : ''}`}
              onClick={() => setSettingsOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={settingsOpen}
            >
              Einstellungen
              <span className="navbar__chevron">{settingsOpen ? '▲' : '▼'}</span>
            </button>

            {settingsOpen && (
              <ul className="navbar__dropdown">
                <li>
                  <button className="navbar__dropdown-item" onClick={() => openView('info')}>
                    <span className="navbar__dropdown-item-icon">ℹ️</span>
                    Information
                  </button>
                </li>
                <li>
                  <button className="navbar__dropdown-item" onClick={() => openView('konfig')}>
                    <span className="navbar__dropdown-item-icon">⚙️</span>
                    Konfigurationen
                  </button>
                </li>
                <li className="navbar__dropdown-divider" />
                <li>
                  <button
                    className="navbar__dropdown-item navbar__dropdown-item--update"
                    onClick={handleUpdate}
                    disabled={updateState === 'updating' || updateState === 'done'}
                  >
                    <span className="navbar__dropdown-item-icon">{UPDATE_ICON[updateState]}</span>
                    {UPDATE_LABEL[updateState]}
                  </button>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </nav>

      <UpdateOverlay state={updateState} progress={updateProgress} step={updateStep} />

      {activeView === 'info' && (
        <InfoView onClose={() => setActiveView(null)} />
      )}
      {activeView === 'konfig' && (
        <KonfigView onClose={() => setActiveView(null)} />
      )}
    </>
  )
}
