/**
 * @file UpdateOverlay.tsx
 * @description Vollbild-Overlay mit animierter Fortschrittsanzeige für PWA-Updates.
 *
 * Konzept:
 *   Wird von Navbar.tsx gerendert wenn `updateState !== 'idle'`.
 *   Zeigt einen modalen Dialog über dem gesamten Viewport, der den
 *   Nutzer über den Update-Fortschritt informiert.
 *
 *   Die Komponente ist rein presentational — sie empfängt Zustand und
 *   Fortschritt als Props und hat keine eigene Logik. Die gesamte
 *   Update-Logik liegt im `useServiceWorkerUpdate`-Hook.
 *
 * Barrierefreiheit (ARIA):
 *   Die Fortschrittsanzeige verwendet role="progressbar" mit
 *   aria-valuenow/min/max für Screenreader-Kompatibilität.
 *   Ref: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/progressbar_role
 *
 * CSS-Animationen:
 *   - Overlay: `fadeIn` (Opacity 0→1)
 *   - Karte: `slideUp` (Y-Translation + Opacity)
 *   - Lade-Icon: `spin` (CSS rotate, gestoppt bei done/error via :has())
 *   - Progress-Füllbalken: CSS transition auf `width` (0.35s cubic-bezier)
 *   - Shimmer-Effekt: translierendes weißes Gradient auf dem Balken
 *
 * Icon-Spin:
 *   Das 🔄-Emoji dreht sich während des Updates per CSS-Animation.
 *   Bei done/error stoppt die Animation via `.upd-card:has(.upd-bar__fill--done)`.
 *   `:has()` ist seit Safari 15.4 und Chrome 105 unterstützt.
 *   Ref: https://caniuse.com/css-has
 */

import type { UpdateState } from '../hooks/useServiceWorkerUpdate'

import './UpdateOverlay.css'

/**
 * Props für UpdateOverlay.
 */
interface Props {
  /** Aktueller Update-Zustand (aus useServiceWorkerUpdate) */
  state:    UpdateState
  /** Fortschritt in Prozent 0–100 */
  progress: number
  /** Menschenlesbarer Schritt-Text */
  step:     string
}

/**
 * Zeigt ein Vollbild-Overlay mit Fortschrittsbalken während eines PWA-Updates.
 * Gibt `null` zurück wenn `state === 'idle'` (kein Update aktiv).
 *
 * @param props.state    - Aktueller Update-Zustand
 * @param props.progress - Fortschritt 0–100
 * @param props.step     - Aktueller Schritt-Text
 */
export default function UpdateOverlay({ state, progress, step }: Props) {
  // Kein Overlay im Ruhezustand — kein DOM-Element
  if (state === 'idle') return null

  const isError = state === 'error'
  const isDone  = state === 'done'

  return (
    // Dunkel-transparenter Blur-Hintergrund — blockiert Interaktion mit dem Spielfeld
    <div className="upd-overlay">
      <div className="upd-card">

        {/* Drehendes Icon — Emoji wechselt je nach Zustand */}
        <div className="upd-card__icon">
          {isError ? '❌' : isDone ? '✅' : '🔄'}
        </div>

        {/* Titel ändert sich je nach Zustand */}
        <h2 className="upd-card__title">
          {isError
            ? 'Update fehlgeschlagen'
            : isDone
            ? 'Update abgeschlossen'
            : 'Spiel wird aktualisiert'}
        </h2>

        {/*
          ARIA progressbar:
          - role="progressbar"           → Screenreader erkennt Fortschrittsbalken
          - aria-valuenow={progress}     → Aktueller Wert
          - aria-valuemin/max={0/100}    → Wertebereich
          Ref: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/progressbar_role
        */}
        <div
          className="upd-bar"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={[
              'upd-bar__fill',
              isDone  ? 'upd-bar__fill--done'  : '',
              isError ? 'upd-bar__fill--error' : '',
            ].join(' ').trim()}
            // Fehler → Balken voll rot, sonst normaler Fortschritt
            style={{ width: `${isError ? 100 : progress}%` }}
          />
        </div>

        {/* Schritt-Text und Prozentzahl */}
        <div className="upd-progress-row">
          <span className="upd-step">{step}</span>
          {/* Im Fehlerfall kein Prozentwert anzeigen */}
          <span className="upd-percent">
            {isError ? '' : `${Math.round(progress)}%`}
          </span>
        </div>

      </div>
    </div>
  )
}
