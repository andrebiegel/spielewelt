import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './platform/App'

// Beim allerersten Start (oder wenn kein Wert gespeichert) wird die aktuelle
// URL als Update-Ziel gesichert. So kennt die App nach der PWA-Installation
// automatisch die richtige Adresse — egal ob localhost, GitHub Pages oder
// ein eigener Server.
// Der Nutzer kann den Wert jederzeit über Einstellungen → Konfigurationen überschreiben.
const LS_KEY = 'update-url'
if (!localStorage.getItem(LS_KEY)) {
  // origin + pathname = z. B. "https://user.github.io/repo/" oder "http://localhost:3000/"
  const installUrl = window.location.origin + window.location.pathname
  localStorage.setItem(LS_KEY, installUrl)
}

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Ladebildschirm ausblenden sobald React gerendert hat
const loader = document.getElementById('app-loading')
if (loader) {
  loader.classList.add('hidden')
  loader.addEventListener('transitionend', () => loader.remove(), { once: true })
}
