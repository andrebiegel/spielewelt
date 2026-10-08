import './InfoView.css'

interface Dep {
  name: string
  version: string
  type: 'runtime' | 'build'
}

const DEPS: Dep[] = [
  { name: 'react',            version: '18.3.1', type: 'runtime' },
  { name: 'react-dom',        version: '18.3.1', type: 'runtime' },
  { name: 'vite',             version: '5.4.1',  type: 'build'   },
  { name: '@vitejs/plugin-react', version: '4.3.1', type: 'build' },
  { name: 'vite-plugin-pwa',  version: '0.20.5', type: 'build'   },
  { name: 'typescript',       version: '5.5.3',  type: 'build'   },
  { name: 'sharp',            version: '0.35.5', type: 'build'   },
]

interface Props {
  onClose: () => void
}

export default function InfoView({ onClose }: Props) {
  const runtime = DEPS.filter((d) => d.type === 'runtime')
  const build   = DEPS.filter((d) => d.type === 'build')

  return (
    <div className="info-overlay" onClick={onClose}>
      <div className="info-panel" onClick={(e) => e.stopPropagation()}>

        <header className="info-panel__header">
          <span className="info-panel__icon">🍄</span>
          <div>
            <h2 className="info-panel__title">Super Jumper</h2>
            <p className="info-panel__subtitle">Allgemeine Informationen</p>
          </div>
          <button className="info-panel__close" onClick={onClose} aria-label="Schließen">✕</button>
        </header>

        <section className="info-section">
          <h3 className="info-section__title">Version</h3>
          <div className="info-badge">
            <span className="info-badge__label">App</span>
            <span className="info-badge__value">{__APP_VERSION__}</span>
          </div>
        </section>

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
                  <td><code>{d.name}</code></td>
                  <td><span className="info-version">{d.version}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

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
          Ein Mario Jump &amp; Run Clone &bull; PWA &bull; Offline-fähig
        </footer>
      </div>
    </div>
  )
}
