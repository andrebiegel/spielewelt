/**
 * @file InfoView.tsx
 * @description Informations-Panel mit App-Version und automatisch geladenen Abhängigkeiten.
 *
 * Konzept "Build-Time Dependency Injection":
 *   Die Abhängigkeitsliste wird NICHT zur Laufzeit aus dem Netz geladen,
 *   sondern zur Build-Zeit von Vite in das Bundle injiziert:
 *
 *   1. `vite.config.ts` liest `package.json` (Paketnamen) und
 *      `package-lock.json` (exakte installierte Versionen)
 *   2. Die Liste wird als globale Konstante `__APP_DEPS__` via `define` in das Bundle geschrieben
 *   3. TypeScript kennt den Typ über `src/vite-env.d.ts`
 *
 *   Vorteile:
 *   - Keine Laufzeit-Kosten, keine asynchronen Requests
 *   - Versionsdaten sind exakt (aus lockfile, nicht aus package.json ranges)
 *   - Neue Abhängigkeiten erscheinen automatisch nach dem nächsten Build
 *   - Unterscheidung Runtime (`dependencies`) vs. Build-Tools (`devDependencies`)
 *
 *   Ref Vite define: https://vitejs.dev/config/shared-options.html#define
 *   Ref package-lock.json Format: https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json
 *
 * Globale Konstanten:
 *   - `__APP_VERSION__` — Wert aus `package.json.version` (z. B. "1.0.0")
 *   - `__APP_DEPS__`    — Array aus `DepEntry`-Objekten mit name, version, type
 *
 * Interaction:
 *   - Klick auf Overlay-Hintergrund → schließen (onClose)
 *   - Klick auf ✕-Button            → schließen (onClose)
 *   - Klick auf Panel-Inhalt        → stopPropagation (verhindert ungewolltes Schließen)
 */

import './InfoView.css'

/**
 * Props des InfoView-Panels.
 */
interface Props {
  /**
   * Callback zum Schließen des Panels.
   * Wird bei Klick auf ✕ oder auf den Overlay-Hintergrund aufgerufen.
   * In Navbar.tsx: `() => setActiveView(null)`
   */
  onClose: () => void
}

/**
 * Zeigt ein modales Panel mit App-Informationen, Version und Abhängigkeiten.
 *
 * Liest `__APP_DEPS__` (zur Build-Zeit injiziert) und teilt es in
 * Laufzeit-Abhängigkeiten und Build-Werkzeuge auf.
 *
 * @param props.onClose - Funktion zum Schließen des Panels
 */
export default function InfoView({ onClose }: Props) {
  /**
   * Laufzeit-Abhängigkeiten: npm `dependencies` aus package.json.
   * Diese werden in das fertige Bundle eingebunden (z. B. react, react-dom, phaser).
   */
  const runtime = __APP_DEPS__.filter((d) => d.type === 'runtime')

  /**
   * Build-Werkzeuge: npm `devDependencies` aus package.json.
   * Diese werden nur während des Builds benötigt und landen nicht im Bundle
   * (z. B. vite, typescript, sharp).
   */
  const build = __APP_DEPS__.filter((d) => d.type === 'build')

  return (
    // Halbtransparenter Overlay-Hintergrund — Klick schließt das Panel
    <div className="info-overlay" onClick={onClose}>

      {/* Panel-Inhalt — stopPropagation verhindert Schließen beim Klick ins Panel */}
      <div className="info-panel" onClick={(e) => e.stopPropagation()}>

        {/* Header: Logo, Titel, Schließen-Button */}
        <header className="info-panel__header">
          <span className="info-panel__icon">🎮</span>
          <div>
            <h2 className="info-panel__title">Spieleplattform</h2>
            <p className="info-panel__subtitle">Allgemeine Informationen</p>
          </div>
          <button
            className="info-panel__close"
            onClick={onClose}
            aria-label="Schließen"   // Screenreader-Label
          >
            ✕
          </button>
        </header>

        {/* App-Version aus package.json (via __APP_VERSION__ define) */}
        <section className="info-section">
          <h3 className="info-section__title">Version</h3>
          <div className="info-badge">
            <span className="info-badge__label">App</span>
            <span className="info-badge__value">{__APP_VERSION__}</span>
          </div>
        </section>

        {/* Laufzeit-Abhängigkeiten (package.json > dependencies) */}
        <section className="info-section">
          <h3 className="info-section__title">Laufzeit-Abhängigkeiten</h3>
          <table className="info-table">
            <thead>
              <tr>
                <th>Paket</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              {runtime.map((d) => (
                <tr key={d.name}>
                  {/* <code> für Monospace-Darstellung von Paketnamen */}
                  <td><code>{d.name}</code></td>
                  {/* Exakte Version aus package-lock.json */}
                  <td><span className="info-version">{d.version}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Build-Werkzeuge (package.json > devDependencies) */}
        <section className="info-section">
          <h3 className="info-section__title">Build-Werkzeuge</h3>
          <table className="info-table">
            <thead>
              <tr>
                <th>Paket</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              {build.map((d) => (
                <tr key={d.name}>
                  <td><code>{d.name}</code></td>
                  <td><span className="info-version">{d.version}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="info-panel__footer">
          Multi-Game PWA &bull; Offline-fähig &bull; Installierbar
        </footer>

      </div>
    </div>
  )
}
