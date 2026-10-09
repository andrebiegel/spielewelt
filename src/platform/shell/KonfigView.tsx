/**
 * @file KonfigView.tsx
 * @description Konfigurations-Panel — aktuell: Update-URL einstellen.
 *
 * Update-URL-Logik:
 *   1. Build-Zeit-Default (__DEFAULT_UPDATE_URL__) aus vite.config.ts:
 *      - GitHub Pages Build → https://<owner>.github.io/<repo>/
 *      - Lokal              → http://localhost:4173/
 *   2. Nutzer kann eine eigene URL eingeben → wird in localStorage('update-url') gespeichert
 *   3. useServiceWorkerUpdate liest: localStorage('update-url') || __DEFAULT_UPDATE_URL__
 *   4. "Zurücksetzen" löscht den localStorage-Eintrag → Default greift wieder
 */

import { useState } from 'react'
import './KonfigView.css'

interface Props {
  onClose: () => void
}

const LS_KEY = 'update-url'

export default function KonfigView({ onClose }: Props) {
  const stored  = localStorage.getItem(LS_KEY)
  const [url, setUrl]       = useState(stored ?? '')
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  // Der gespeicherte Wert ist immer gesetzt (wird in main.tsx beim ersten Start geschrieben).
  // "automatisch" = der Wert wurde nicht manuell vom Nutzer geändert.
  // Wir erkennen das daran ob der gespeicherte Wert mit window.location übereinstimmt.
  const installUrl   = window.location.origin + window.location.pathname
  const isAuto       = stored === installUrl
  const effectiveUrl = stored || window.location.href

  function validate(value: string): boolean {
    if (!value.trim()) return true   // leer = zurücksetzen = ok
    try {
      const u = new URL(value)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }

  function handleSave() {
    const trimmed = url.trim()
    if (trimmed && !validate(trimmed)) {
      setError('Ungültige URL — muss mit http:// oder https:// beginnen.')
      return
    }
    setError('')
    if (trimmed) {
      localStorage.setItem(LS_KEY, trimmed)
    } else {
      localStorage.removeItem(LS_KEY)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    localStorage.removeItem(LS_KEY)
    setUrl('')
    setError('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="konfig-overlay" onClick={onClose}>
      <div className="konfig-panel" onClick={(e) => e.stopPropagation()}>

        <header className="konfig-panel__header">
          <span className="konfig-panel__icon">⚙️</span>
          <div>
            <h2 className="konfig-panel__title">Konfigurationen</h2>
            <p className="konfig-panel__subtitle">Plattform-Einstellungen</p>
          </div>
          <button className="konfig-panel__close" onClick={onClose} aria-label="Schließen">✕</button>
        </header>

        {/* ── Update-URL ─────────────────────────────────────────── */}
        <section className="konfig-section">
          <h3 className="konfig-section__title">Update-URL</h3>

          <p className="konfig-section__desc">
            Wenn du <strong>„App aktualisieren"</strong> klickst, werden alle
            Caches geleert und der Browser lädt die App von dieser URL neu.
            Die URL wird beim <strong>ersten Start automatisch</strong> auf die
            aktuelle Adresse gesetzt — bei einer PWA-Installation ist das
            automatisch die richtige Adresse. Du kannst sie hier bei Bedarf ändern.
          </p>

          <div className="konfig-examples">
            <p className="konfig-examples__title">Beispiele</p>
            <table className="konfig-examples__table">
              <tbody>
                <tr>
                  <td className="konfig-examples__env">Lokal (Dev)</td>
                  <td><code>http://localhost:5173/</code></td>
                </tr>
                <tr>
                  <td className="konfig-examples__env">Lokal (Preview)</td>
                  <td><code>http://localhost:4173/</code></td>
                </tr>
                <tr>
                  <td className="konfig-examples__env">Docker</td>
                  <td><code>http://localhost:3000/</code></td>
                </tr>
                <tr>
                  <td className="konfig-examples__env">GitHub Pages</td>
                  <td><code>https://nutzername.github.io/repo/</code></td>
                </tr>
                <tr>
                  <td className="konfig-examples__env">Eigener Server</td>
                  <td><code>https://meine-domain.de/</code></td>
                </tr>
              </tbody>
            </table>
            <p className="konfig-examples__hint">
              ⚠️ Der abschließende <code>/</code> ist wichtig —
              ohne ihn kann der Browser die App nicht korrekt laden.
            </p>
          </div>

          <div className="konfig-field">
            <label className="konfig-label" htmlFor="update-url">URL</label>
            <input
              id="update-url"
              className={`konfig-input${error ? ' konfig-input--error' : ''}`}
              type="url"
              placeholder={__DEFAULT_UPDATE_URL__}
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              spellCheck={false}
              autoComplete="off"
            />
            {error && <p className="konfig-error">{error}</p>}
          </div>

          <div className="konfig-meta">
            <span className="konfig-meta__label">Aktiv:</span>
            <code className="konfig-meta__value">{effectiveUrl}</code>
            {isAuto && <span className="konfig-badge">Automatisch</span>}
          </div>

          <div className="konfig-actions">
            <button
              className="konfig-btn konfig-btn--secondary"
              onClick={handleReset}
              disabled={isAuto && !url}
              title="Standard-URL wiederherstellen"
            >
              Zurücksetzen
            </button>
            <button
              className={`konfig-btn konfig-btn--primary${saved ? ' konfig-btn--saved' : ''}`}
              onClick={handleSave}
            >
              {saved ? '✓ Gespeichert' : 'Speichern'}
            </button>
          </div>
        </section>

        <footer className="konfig-panel__footer">
          Änderungen werden sofort wirksam — kein Neustart nötig.
        </footer>

      </div>
    </div>
  )
}
