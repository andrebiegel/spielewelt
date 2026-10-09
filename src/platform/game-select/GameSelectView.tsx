/**
 * @file GameSelectView.tsx
 * @description Startseite der Plattform — zeigt alle registrierten Spiele als Kacheln.
 * Zugehörigkeit: platform/game-select — der Einstiegspunkt nach App-Start.
 *
 * Liest `games.json` zur Build-Zeit und rendert für jeden Eintrag eine interaktive Kachel.
 * CSS Custom Properties (`--card-color`, `--card-accent`) erlauben pro-Kachel-Farben
 * ohne dynamische Klassen.
 * Ref: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
 */

import games from '../games.json'
import './GameSelectView.css'

/** Typdefinition für einen Spielregistereintrag — muss mit games.json übereinstimmen. */
interface Game {
  id:          string
  title:       string
  subtitle:    string
  description: string
  icon:        string
  color:       string
  accentColor: string
  tags:        string[]
  players:     string
  engine:      string
  version:     string
  component:   string
}

interface Props {
  onSelect: (gameId: string) => void
}

export default function GameSelectView({ onSelect }: Props) {
  const registry = games as Game[]

  return (
    <div className="gs-view">
      <header className="gs-header">
        <h1 className="gs-header__title">🎮 Spielauswahl</h1>
        <p className="gs-header__sub">Wähle ein Spiel zum Starten</p>
      </header>

      <div className="gs-grid">
        {registry.map((game) => (
          <button
            key={game.id}
            className="gs-card"
            style={{ '--card-color': game.color, '--card-accent': game.accentColor } as React.CSSProperties}
            onClick={() => onSelect(game.id)}
          >
            <div className="gs-card__top">
              <span className="gs-card__icon">{game.icon}</span>
              <div className="gs-card__badges">
                {game.tags.map((tag) => (
                  <span key={tag} className="gs-card__badge">{tag}</span>
                ))}
              </div>
            </div>
            <div className="gs-card__body">
              <h2 className="gs-card__title">{game.title}</h2>
              <p className="gs-card__subtitle">{game.subtitle}</p>
              <p className="gs-card__desc">{game.description}</p>
            </div>
            <div className="gs-card__footer">
              <span className="gs-card__meta">👤 {game.players}</span>
              <span className="gs-card__meta">⚙️ {game.engine}</span>
              <span className="gs-card__meta">v{game.version}</span>
              <span className="gs-card__play">▶ Spielen</span>
            </div>
          </button>
        ))}

        <div className="gs-card gs-card--soon" aria-disabled="true">
          <div className="gs-card__top"><span className="gs-card__icon">🚧</span></div>
          <div className="gs-card__body">
            <h2 className="gs-card__title">Nächstes Spiel</h2>
            <p className="gs-card__subtitle">In Entwicklung</p>
            <p className="gs-card__desc">Hier entsteht bald ein neues Spiel. Füge es über games.json hinzu.</p>
          </div>
          <div className="gs-card__footer">
            <span className="gs-card__meta">🔒 Bald verfügbar</span>
          </div>
        </div>
      </div>
    </div>
  )
}
