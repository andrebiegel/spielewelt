import type { UpdateState } from '../hooks/useServiceWorkerUpdate'
import './UpdateOverlay.css'

interface Props {
  state: UpdateState
  progress: number
  step: string
}

export default function UpdateOverlay({ state, progress, step }: Props) {
  if (state === 'idle') return null

  const isError = state === 'error'
  const isDone  = state === 'done'

  return (
    <div className="upd-overlay">
      <div className="upd-card">

        <div className="upd-card__icon">
          {isError ? '❌' : isDone ? '✅' : '🔄'}
        </div>

        <h2 className="upd-card__title">
          {isError ? 'Update fehlgeschlagen' : isDone ? 'Update abgeschlossen' : 'Spiel wird aktualisiert'}
        </h2>

        {/* Progress bar */}
        <div className="upd-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`upd-bar__fill${isDone ? ' upd-bar__fill--done' : ''}${isError ? ' upd-bar__fill--error' : ''}`}
            style={{ width: `${isError ? 100 : progress}%` }}
          />
        </div>

        <div className="upd-progress-row">
          <span className="upd-step">{step}</span>
          <span className="upd-percent">{isError ? '' : `${Math.round(progress)}%`}</span>
        </div>

      </div>
    </div>
  )
}
