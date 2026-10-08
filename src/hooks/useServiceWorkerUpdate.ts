import { useState, useEffect, useRef } from 'react'

export type UpdateState = 'idle' | 'updating' | 'done' | 'error'

export interface UpdateStatus {
  state: UpdateState
  progress: number        // 0 – 100
  step: string            // human-readable current step
  triggerUpdate: () => void
}

// Weighted steps — must sum to 100
const STEPS = [
  { label: 'Service Worker wird geprüft…',      weight: 15 },
  { label: 'Service Worker wird aktiviert…',    weight: 20 },
  { label: 'Update wird heruntergeladen…',      weight: 25 },
  { label: 'Caches werden geleert…',            weight: 30 },
  { label: 'Neustart wird vorbereitet…',        weight: 10 },
]

function sumWeightsBefore(index: number) {
  return STEPS.slice(0, index).reduce((acc, s) => acc + s.weight, 0)
}

export function useServiceWorkerUpdate(): UpdateStatus {
  const [state, setState]       = useState<UpdateState>('idle')
  const [progress, setProgress] = useState(0)
  const [step, setStep]         = useState('')
  const abortRef                = useRef(false)

  useEffect(() => {
    abortRef.current = false
    return () => { abortRef.current = true }
  }, [])

  function advance(stepIndex: number) {
    if (abortRef.current) return
    const base = sumWeightsBefore(stepIndex)
    setProgress(base)
    setStep(STEPS[stepIndex].label)
  }

  async function triggerUpdate() {
    setState('updating')
    setProgress(0)
    setStep(STEPS[0].label)

    try {
      // Step 0 — find registrations
      advance(0)
      const registrations = 'serviceWorker' in navigator
        ? await navigator.serviceWorker.getRegistrations()
        : []
      await tick(120)

      // Step 1 — skip waiting
      advance(1)
      for (const reg of registrations) {
        reg.waiting?.postMessage({ type: 'SKIP_WAITING' })
      }
      await tick(200)

      // Step 2 — call update() on each registration
      advance(2)
      await Promise.all(registrations.map((reg) => reg.update()))
      await tick(300)

      // Step 3 — wipe caches
      advance(3)
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map((key) => caches.delete(key)))
      await tick(200)

      // Step 4 — prepare reload
      advance(4)
      await tick(150)

      if (abortRef.current) return
      setProgress(100)
      setStep('Fertig!')
      setState('done')

      setTimeout(() => window.location.reload(), 900)
    } catch {
      if (abortRef.current) return
      setState('error')
      setStep('Fehler beim Aktualisieren.')
      setTimeout(() => {
        setState('idle')
        setProgress(0)
        setStep('')
      }, 3000)
    }
  }

  return { state, progress, step, triggerUpdate }
}

function tick(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}
