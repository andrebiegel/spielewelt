# Spielewelt

Eine Multi-Game-Plattform als Progressive Web App — installierbar und offline-fähig.
Aktuell enthält sie **Super Jumper**, einen Mario Jump & Run Clone, gebaut mit Phaser 4.

---

## Stack

| Tool | Zweck | Dokumentation |
|------|-------|---------------|
| [Vite 5](https://vitejs.dev/) | Build-Tool, Dev-Server, HMR | https://vitejs.dev/guide/ |
| [React 18](https://react.dev/) | UI-Framework | https://react.dev/reference/react |
| [TypeScript 5](https://www.typescriptlang.org/) | Typsicherheit | https://www.typescriptlang.org/docs/ |
| [Phaser 4](https://phaser.io/) | Spiel-Engine (WebGL/Canvas) | https://phaser.io/docs |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | Service Worker + Web App Manifest (Workbox) | https://vite-pwa-org.netlify.app/ |

---

## PWA-Features

- **Installierbar** — Web App Manifest mit Icons, `display: standalone`
  Ref: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- **Offline-fähig** — Workbox Service Worker cached alle Assets (JS, CSS, HTML, Bilder) via `generateSW`
  Ref: https://developer.chrome.com/docs/workbox/
- **Auto-Update** — `registerType: 'autoUpdate'` aktualisiert den Service Worker automatisch
  Ref: https://vite-pwa-org.netlify.app/guide/auto-update.html
- **Manuelles Update** — "Update Spiel" im Einstellungsmenü leert alle Caches und lädt neu
  Ref: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update
- **Runtime Caching** — Google Fonts mit `CacheFirst`-Strategie (1 Jahr TTL)
  Ref: https://developer.chrome.com/docs/workbox/caching-strategies-overview/

---

## Projektstruktur

```
super-jumper/
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions: Build + Deploy zu GitHub Pages
├── .opencode/
│   └── skills/new-game/
│       └── SKILL.md            # OpenCode-Skill: Anleitung neues Spiel hinzufügen
├── public/                     # Statische Assets (werden unverändert kopiert)
│   ├── favicon.ico             # Browser-Tab Icon (32×32)
│   ├── apple-touch-icon.png    # iOS Add-to-Home-Screen Icon (180×180)
│   ├── pwa-192x192.png         # PWA Home Screen Icon
│   └── pwa-512x512.png         # PWA Splash / Maskable Icon
├── scripts/
│   └── generate-icons.mjs      # Icon-Generator: SVG → PNG via Sharp
├── src/
│   ├── games.json              # Spielregister — Quelle der Wahrheit für alle Spiele
│   ├── vite-env.d.ts           # TypeScript-Deklarationen für Vite-Globals (__APP_VERSION__ etc.)
│   ├── App.tsx                 # Root-Komponente + State-basierter Router
│   ├── App.css
│   ├── main.tsx                # React-Einstiegspunkt
│   ├── index.css               # Globale Styles (Reset, Dark Background)
│   ├── components/
│   │   ├── GameCanvas.tsx      # React-Wrapper für Phaser-Instanz
│   │   ├── InfoView.tsx        # Informations-Panel (Versionen + Abhängigkeiten)
│   │   ├── Navbar.tsx          # Navigationsleiste mit Einstellungs-Dropdown
│   │   └── UpdateOverlay.tsx   # Vollbild-Update-Overlay mit Fortschrittsbalken
│   ├── views/
│   │   └── GameSelectView.tsx  # Spielauswahl-Startseite (liest games.json)
│   ├── hooks/
│   │   └── useServiceWorkerUpdate.ts  # Hook: PWA-Update mit Fortschritt
│   └── game/                   # Super Jumper Implementierung
│       ├── PhaserGame.ts       # Phaser.Game Factory-Funktion
│       ├── levels.ts           # Level-Konfigurationen (Farben, Physik, Layout)
│       ├── input/
│       │   └── TouchControls.ts  # On-Screen D-Pad + Swipe-Erkennung
│       └── scenes/
│           ├── BootScene.ts        # Prozedurale Textur-Generierung
│           ├── LevelSelectScene.ts # Phaser-interne Level-Auswahl
│           └── GameScene.ts        # Hauptspiel-Logik
├── index.html
├── vite.config.ts              # Vite + PWA-Plugin + Build-Zeit Dependency-Injection
├── tsconfig.json
├── tsconfig.node.json
├── package.json
├── opencode.json               # OpenCode-Konfiguration (Skill-Pfade)
├── Dockerfile                  # Multi-Stage Build (Node → nginx)
├── docker-compose.yml
└── nginx.conf                  # nginx SPA + PWA Konfiguration
```

---

## Architektur-Konzepte

### State-basiertes Routing

Kein React Router. Navigation wird über einen einfachen `useState`-String in `App.tsx` gesteuert:

```
route = 'home'          → GameSelectView
route = 'super-jumper'  → GameCanvas (Phaser)
route = '<andere>'      → Fehlermeldung
```

Der Route-Wert entspricht dem `component`-Feld in `games.json`.

### Game Registry Pattern

`src/games.json` ist die einzige Quelle der Wahrheit für alle Spiele.
`GameSelectView.tsx` liest diese Datei und rendert automatisch Kacheln.
Neues Spiel: Eintrag in JSON + `if`-Zweig in `App.tsx` + Phaser-Implementierung.

### Build-Zeit Dependency Injection

`vite.config.ts` liest `package.json` und `package-lock.json` zur Build-Zeit
und injiziert die Abhängigkeitsliste als `__APP_DEPS__`-Konstante in das Bundle.
`InfoView.tsx` zeigt diese Liste ohne Runtime-Request oder manuellen Wartungsaufwand.

Ref: https://vitejs.dev/config/shared-options.html#define

### Prozedurale Texturen (Phaser)

`BootScene.ts` generiert alle Spieltexturen mit der Phaser Graphics-API und
`generateTexture()`. Kein externes Asset, kein Netzwerk-Request, vollständig offline.

Ref: https://phaser.io/docs/latest/Phaser.GameObjects.Graphics#generateTexture

### React + Phaser Integration

`GameCanvas.tsx` ist eine dünne Brücken-Komponente:
- React verwaltet ein `<div>` als Container
- `useEffect` erstellt die Phaser-Instanz beim Mount und zerstört sie beim Unmount
- Phaser injiziert seinen `<canvas>` in den Container
- Kein State-Sharing zwischen React und Phaser

---

## Spielsteuerung

### Desktop (Tastatur)

| Taste | Aktion |
|-------|--------|
| `←` / `→` | Laufen |
| `↑` oder `Space` | Springen |

### iOS / iPad / Touch

| Geste | Aktion |
|-------|--------|
| ◀ Button (links unten) | Laufen links |
| ▶ Button (mittig unten) | Laufen rechts |
| ▲ Button (rechts unten) | Springen |
| Wischen links / rechts | Laufen |
| Wischen nach oben | Springen |

Ref Touch Events: https://developer.mozilla.org/en-US/docs/Web/API/Touch_events

---

## Icons

Alle Icons sind SVG-basiert und werden per Script in PNG konvertiert.
Design: Mario Jump & Run Stil — springender Charakter, Pipe, goldene Münze.

| Datei | Größe | Zweck |
|-------|-------|-------|
| `pwa-512x512.png` | 512×512 | PWA Splash / Maskable |
| `pwa-192x192.png` | 192×192 | PWA Home Screen |
| `apple-touch-icon.png` | 180×180 | iOS Add to Home Screen |
| `favicon.ico` | 32×32 | Browser Tab |

### Icons neu generieren

```bash
node scripts/generate-icons.mjs
```

Voraussetzung: `sharp` ist als Dev-Dependency installiert.
Ref Sharp: https://sharp.pixelplumbing.com/

---

## Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Dev-Server starten (PWA im Dev-Modus aktiv)
npm run dev

# Production Build
npm run build

# Build lokal testen (PWA voll funktional inkl. Service Worker)
npm run preview
```

### PWA lokal testen

1. `npm run build && npm run preview`
2. Browser: `http://localhost:4173`
3. Installations-Icon in der Adressleiste (Chrome/Edge)
4. Nach Installation: Netzwerk deaktivieren → App funktioniert weiter

---

## Docker

### Multi-Stage Build

```
Stage 1 — builder  (node:22-alpine)
  npm ci → npm run build → /app/dist

Stage 2 — runner   (nginx:1.27-alpine)
  dist/ + nginx.conf → Port 80
```

Das finale Image enthält nur nginx und die statischen Assets (~15MB).

### nginx-Konfiguration

| Feature | Detail |
|---------|--------|
| SPA-Fallback | Alle unbekannten Routen → `index.html` |
| Service Worker | `no-store` — wird nie gecacht |
| Hashed Assets | `immutable, max-age=1y` |
| Manifest | `max-age=1h` |
| Gzip | aktiviert für JS, CSS, JSON, SVG, Manifest |
| Security Headers | `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy` |
| Healthcheck | `GET /healthz` → `200 ok` |

Ref nginx SPA Config: https://www.nginx.com/resources/wiki/start/topics/tutorials/config_pitfalls/#front-controller-pattern-web-apps

### Starten

```bash
docker compose up --build -d
# → http://localhost:3000
```

### Nur Image bauen

```bash
docker build -t spielewelt:latest .
docker run -p 3000:80 spielewelt:latest
```

---

## GitHub Pages

Der Workflow in `.github/workflows/deploy.yml` baut und deployed automatisch
bei jedem Push auf `main`.

**Setup (einmalig):**

1. GitHub Repo erstellen unter `github.com/new` (Public, nichts initialisieren)
2. Remote hinzufügen und pushen:
   ```bash
   git remote add origin https://github.com/DEIN_USERNAME/super-jumper.git
   git push -u origin main
   ```
3. Im Repo: **Settings → Pages → Source → GitHub Actions** auswählen

**URL:** `https://DEIN_USERNAME.github.io/super-jumper/`

Der `base`-Pfad in `vite.config.ts` wird automatisch aus der Umgebungsvariable
`GITHUB_REPOSITORY` ermittelt — lokal ist der Build immer auf `/`.

Ref GitHub Actions Pages: https://github.com/actions/deploy-pages

---

## OpenCode Skills

Das Projekt enthält spezialisierte OpenCode-Skills die KI-Assistenten mit projektspezifischem
Wissen ausstatten. Skills werden **automatisch** geladen — kein manuelles Aktivieren nötig.

Ref: https://opencode.ai/docs/skills

### Wie Skills funktionieren

OpenCode liest beim Start alle `SKILL.md`-Dateien aus den konfigurierten Verzeichnissen.
Der Pfad ist in `opencode.json` registriert:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "skills": {
    "paths": [".opencode/skills"]
  }
}
```

Jeder Skill hat eine `description` — OpenCode lädt den Skill automatisch wenn deine Anfrage
thematisch dazu passt. Du musst den Skill-Namen nicht kennen oder explizit aufrufen.

### Verfügbare Skills

#### `new-game` — Neues Spiel hinzufügen

**Datei:** `.opencode/skills/new-game/SKILL.md`

Wird automatisch aktiviert bei Anfragen wie:
- *"Füge ein neues Spiel hinzu"*
- *"Wie erstelle ich ein neues Game?"*
- *"games.json erweitern"*
- *"add game", "new game"*

**Inhalt des Skills:**
- Schritt-für-Schritt-Anleitung (games.json → Phaser-Scenes → React-Wrapper → Router)
- Vollständige Dateivorlagen für Game-Factory, BootScene, GameScene, Canvas-Wrapper
- Anleitung zur Wiederverwendung von `TouchControls`
- Erklärung aller Felder in `games.json`
- Checkliste für alle notwendigen Änderungen
- Technische Referenzen (Phaser-Docs, React-Docs, MDN)

---

#### `new-level` — Neues Level für Super Jumper erstellen

**Datei:** `.opencode/skills/new-level/SKILL.md`

Wird automatisch aktiviert bei Anfragen wie:
- *"Erstelle ein neues Level"*
- *"Füge Level 2 hinzu"*
- *"level-02.json anlegen"*
- *"Plattformen konfigurieren", "Gegner platzieren"*
- *"add level", "new level"*

**Inhalt des Skills:**
- Vollständige JSON-Vorlage mit allen Pflichtfeldern
- Koordinatensystem-Erklärung mit ASCII-Diagramm
- Farbpaletten-Empfehlungen für verschiedene Atmosphären (Tag, Abend, Nacht, Wüste)
- Formeln für Sprunghöhe und horizontale Sprungweite
- Formeln für korrekte Gegner- und Münzplatzierung
- Plattform-Typen-Tabelle (`grass`, `stone`, `wood`, `ice`)
- Checkliste aller Pflichtfelder vor dem Build
- Verweis auf `SCHEMA.md` für vollständige Feldreferenz

### Skill-Verzeichnis

```
.opencode/
└── skills/
    ├── new-game/
    │   └── SKILL.md    # Neues Spiel zur Plattform hinzufügen
    └── new-level/
        └── SKILL.md    # Neues Level für Super Jumper erstellen
```

### Skill-Datei-Format

Jede `SKILL.md` beginnt mit YAML-Frontmatter:

```markdown
---
name: skill-name
description: Wann und wofür dieser Skill verwendet wird (max. 1024 Zeichen)
---

# Skill-Inhalt in Markdown
```

- `name` — lowercase-hyphen, muss dem Verzeichnisnamen entsprechen
- `description` — bestimmt wann OpenCode den Skill automatisch lädt;
  je präziser, desto besser die automatische Aktivierung

### Neuen Skill erstellen

```bash
mkdir -p .opencode/skills/mein-skill
# SKILL.md mit Frontmatter anlegen
```

Nach dem nächsten Start von OpenCode ist der Skill automatisch verfügbar.
