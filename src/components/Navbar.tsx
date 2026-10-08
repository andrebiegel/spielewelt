import { useState, useRef, useEffect } from 'react'
import './Navbar.css'
import InfoView from './InfoView'
import UpdateOverlay from './UpdateOverlay'
import { useServiceWorkerUpdate } from '../hooks/useServiceWorkerUpdate'

type View = 'info' | null

const UPDATE_LABEL: Record<string, string> = {
  idle:     'Update Spiel',
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

export default function Navbar() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeView, setActiveView]     = useState<View>(null)
  const dropdownRef = useRef<HTMLLIElement>(null)
  const { state: updateState, progress: updateProgress, step: updateStep, triggerUpdate } = useServiceWorkerUpdate()

  // Close dropdown on outside click
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
        <div className="navbar__logo">
          <span className="navbar__logo-icon">🍄</span>
          <span className="navbar__logo-text">Super Jumper</span>
        </div>

        <ul className="navbar__links">
          <li>
            <a className="navbar__link" href="#">Spiel</a>
          </li>
          <li>
            <a className="navbar__link" href="#">Bestenliste</a>
          </li>

          {/* Einstellungen with dropdown */}
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
                  <button
                    className="navbar__dropdown-item"
                    onClick={() => openView('info')}
                  >
                    <span className="navbar__dropdown-item-icon">ℹ️</span>
                    Information
                  </button>
                </li>
                <li className="navbar__dropdown-divider" />
                <li>
                  <button
                    className="navbar__dropdown-item navbar__dropdown-item--update"
                    onClick={handleUpdate}
                    disabled={updateState === 'updating' || updateState === 'done'}
                  >
                    <span className="navbar__dropdown-item-icon">
                      {UPDATE_ICON[updateState]}
                    </span>
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
    </>
  )
}
