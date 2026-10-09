/**
 * @file useServiceWorkerUpdate.ts
 * @description React-Hook zur manuellen Aktualisierung der PWA via Service Worker.
 *
 * Konzept:
 *   Progressive Web Apps (PWA) nutzen Service Worker als Proxy zwischen der App
 *   und dem Netzwerk. Workbox (via vite-plugin-pwa) generiert automatisch einen
 *   Service Worker, der alle Assets cached. Wenn eine neue Version deployed wird,
 *   lädt der Browser den neuen SW im Hintergrund, aber aktiviert ihn erst wenn
 *   alle Tabs der App geschlossen werden ("waiting" Zustand).
 *
 *   Dieser Hook ermöglicht es dem Nutzer, das Update sofort zu erzwingen:
 *     1. `SKIP_WAITING` an den wartenden SW senden → sofortige Aktivierung
 *     2. `reg.update()` aufrufen → SW prüft auf neue Version
 *     3. `caches.delete()` für alle Cache-Einträge → sauberer Neustart
 *     4. `window.location.reload()` → App lädt mit neuem SW
 *
 *   Ref Service Worker Lifecycle:
 *     https://developer.chrome.com/docs/workbox/service-worker-lifecycle/
 *   Ref Cache API:
 *     https://developer.mozilla.org/en-US/docs/Web/API/Cache
 *   Ref ServiceWorkerRegistration.update():
 *     https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update
 *
 * Fortschritts-Simulation:
 *   Da die echten async-Operationen (update, cache delete) sehr schnell sind,
 *   werden zwischen den Schritten künstliche Wartezeiten (`tick()`) eingefügt.
 *   Das gibt dem Nutzer visuelles Feedback und verhindert einen gefühlt
 *   sofortigen Abschluss ohne wahrnehmbare Aktivität.
 *
 *   Die Schritte sind gewichtet (STEPS.weight summiert auf 100), damit der
 *   Fortschrittsbalken proportional zu den Schritten wächst.
 *
 * abort-Mechanismus:
 *   `abortRef` ist ein Ref (kein State), weil es den aktuellen Wert auch
 *   innerhalb von async-Closures ohne Stale-Closure-Problem liefert.
 *   Wenn die Komponente unmountet wird (React Cleanup), wird `abortRef.current = true`
 *   gesetzt — alle nachfolgenden `setState`-Aufrufe werden dann übersprungen.
 */

import { useState, useEffect, useRef } from 'react'

/**
 * Mögliche Zustände des Update-Prozesses.
 * - `idle`:     Kein Update läuft, Button ist klickbar
 * - `updating`: Update-Prozess läuft, Button deaktiviert
 * - `done`:     Update abgeschlossen, Reload wird ausgelöst
 * - `error`:    Ein Fehler ist aufgetreten, Fehlermeldung wird angezeigt
 */
export type UpdateState = 'idle' | 'updating' | 'done' | 'error'

/**
 * Rückgabetyp des Hooks — wird direkt in Navbar.tsx destructured.
 */
export interface UpdateStatus {
  /** Aktueller Update-Zustand */
  state: UpdateState
  /** Fortschritt in Prozent (0–100), für die Progress Bar */
  progress: number
  /** Menschenlesbarer Text zum aktuellen Schritt */
  step: string
  /** Funktion zum Starten des Updates — aus dem Button aufrufen */
  triggerUpdate: () => void
}

/**
 * Gewichtete Update-Schritte.
 * `weight` gibt den prozentualen Anteil am Gesamtfortschritt an.
 * Alle Weights müssen in Summe 100 ergeben.
 *
 * Reihenfolge entspricht der tatsächlichen Ausführungsreihenfolge in `triggerUpdate()`.
 */
const STEPS = [
  { label: 'Service Worker wird geprüft…',   weight: 15 },  // getRegistrations()
  { label: 'Service Worker wird aktiviert…', weight: 20 },  // SKIP_WAITING
  { label: 'Update wird heruntergeladen…',   weight: 25 },  // reg.update()
  { label: 'Caches werden geleert…',         weight: 30 },  // caches.delete()
  { label: 'Neustart wird vorbereitet…',     weight: 10 },  // tick vor reload
]

/**
 * Berechnet den kumulierten Fortschritt aller Schritte vor dem gegebenen Index.
 * Beispiel: index=2 → weight[0] + weight[1] = 15 + 20 = 35%
 *
 * @param index - Index des aktuellen Schritts (0-basiert)
 */
function sumWeightsBefore(index: number): number {
  return STEPS.slice(0, index).reduce((acc, s) => acc + s.weight, 0)
}

/**
 * Hook zur manuellen PWA-Aktualisierung mit Fortschrittsanzeige.
 *
 * @returns UpdateStatus mit state, progress, step und triggerUpdate
 *
 * @example
 * ```tsx
 * const { state, progress, step, triggerUpdate } = useServiceWorkerUpdate()
 * // Im JSX:
 * <button onClick={triggerUpdate} disabled={state !== 'idle'}>Update</button>
 * <UpdateOverlay state={state} progress={progress} step={step} />
 * ```
 */
export function useServiceWorkerUpdate(): UpdateStatus {
  const [state, setState]       = useState<UpdateState>('idle')
  const [progress, setProgress] = useState(0)
  const [step, setStep]         = useState('')
  /**
   * Ref statt State, damit der aktuelle Wert innerhalb von async-Callbacks
   * ohne Stale-Closure-Problem gelesen werden kann.
   * Wird auf `true` gesetzt wenn die Komponente unmountet wird.
   */
  const abortRef = useRef(false)

  useEffect(() => {
    // Reset bei Mount (falls Hook wiederverwendet wird)
    abortRef.current = false
    // Cleanup: Update-Prozess darf nach Unmount keine State-Updates mehr auslösen
    return () => { abortRef.current = true }
  }, [])

  /**
   * Setzt Fortschritt und Schritt-Label auf den Wert des angegebenen Schritts.
   * Übersprungen wenn die Komponente bereits unmountet wurde.
   *
   * @param stepIndex - Index des aktuellen Schritts in STEPS
   */
  function advance(stepIndex: number) {
    if (abortRef.current) return
    setProgress(sumWeightsBefore(stepIndex))
    setStep(STEPS[stepIndex].label)
  }

  /**
   * Startet den vollständigen Update-Prozess:
   *   1. Service Worker Registrierungen ermitteln
   *   2. Wartende SW aktivieren (SKIP_WAITING)
   *   3. SW auf neue Version prüfen lassen (update())
   *   4. Alle Browser-Caches leeren (Cache API)
   *   5. Seite neu laden (window.location.reload)
   *
   * Im Fehlerfall (catch) wird `state` auf 'error' gesetzt und
   * nach 3 Sekunden automatisch auf 'idle' zurückgesetzt.
   */
  async function triggerUpdate() {
    setState('updating')
    setProgress(0)
    setStep(STEPS[0].label)

    try {
      // Schritt 0: Alle registrierten Service Worker abrufen
      // getRegistrations() gibt [] zurück wenn kein SW registriert ist (z.B. im Dev-Build)
      // Ref: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/getRegistrations
      advance(0)
      const registrations = 'serviceWorker' in navigator
        ? await navigator.serviceWorker.getRegistrations()
        : []
      await tick(120)   // Künstliche Pause für sichtbaren Fortschritt

      // Schritt 1: Wartende Service Worker sofort aktivieren
      // `reg.waiting` ist der SW im "waiting"-Zustand (neue Version heruntergeladen)
      // SKIP_WAITING ist eine Konvention — Workbox reagiert darauf in sw.js
      // Ref: https://developer.chrome.com/docs/workbox/handling-service-worker-updates/
      advance(1)
      for (const reg of registrations) {
        reg.waiting?.postMessage({ type: 'SKIP_WAITING' })
      }
      await tick(200)

      // Schritt 2: Update-Check für jeden registrierten SW
      // reg.update() prüft ob eine neue sw.js auf dem Server liegt
      // Ref: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update
      advance(2)
      await Promise.all(registrations.map((reg) => reg.update()))
      await tick(300)

      // Schritt 3: Alle Browser-Caches löschen
      // caches.keys() liefert alle Cache-Namen (z.B. "workbox-precache-v2-...")
      // caches.delete() entfernt den Cache vollständig
      // Ref: https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage/keys
      advance(3)
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map((key) => caches.delete(key)))
      await tick(200)

      // Schritt 4: Abschluss vorbereiten
      advance(4)
      await tick(150)

      // Sicherheitscheck: Komponente noch gemountet?
      if (abortRef.current) return

      setProgress(100)
      setStep('Fertig!')
      setState('done')

      // Update-URL: aus localStorage lesen — wird beim ersten App-Start
      // automatisch auf die Installations-URL gesetzt (main.tsx).
      // Kann in Einstellungen → Konfigurationen überschrieben werden.
      const updateUrl = localStorage.getItem('update-url') || window.location.href
      setTimeout(() => { window.location.href = updateUrl }, 900)

    } catch {
      if (abortRef.current) return
      setState('error')
      setStep('Fehler beim Aktualisieren.')
      // Automatisch zurücksetzen nach 3 Sekunden
      setTimeout(() => {
        setState('idle')
        setProgress(0)
        setStep('')
      }, 3000)
    }
  }

  return { state, progress, step, triggerUpdate }
}

/**
 * Hilfsfunktion: Wartet `ms` Millisekunden.
 * Wird verwendet um zwischen Update-Schritten sichtbaren Fortschritt zu erzeugen.
 *
 * @param ms - Wartezeit in Millisekunden
 */
function tick(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}
