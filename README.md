# Super Jumper

Ein Mario Jump & Run Clone als Progressive Web App — installierbar und offline-fähig.

## Stack

| Tool | Zweck |
|------|-------|
| [Vite 5](https://vitejs.dev/) | Build-Tool |
| [React 18](https://react.dev/) | UI-Framework |
| [TypeScript](https://www.typescriptlang.org/) | Typsicherheit |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | Service Worker + Web App Manifest (Workbox) |

## PWA-Features

- **Installierbar** — Web App Manifest mit Icons, `display: standalone`
- **Offline-fähig** — Workbox Service Worker cached alle Assets (JS, CSS, HTML, Bilder) via `generateSW`
- **Auto-Update** — `registerType: 'autoUpdate'` aktualisiert den Service Worker automatisch im Hintergrund
- **Runtime Caching** — Google Fonts werden mit `CacheFirst`-Strategie gecacht (1 Jahr TTL)

## Projektstruktur

```
super-jumper/
├── public/                     # Statische Assets
│   ├── favicon.ico             # Browser-Tab Icon (32×32)
│   ├── apple-touch-icon.png    # iOS Add-to-Home-Screen Icon (180×180)
│   ├── pwa-192x192.png         # PWA Home Screen Icon
│   └── pwa-512x512.png         # PWA Splash / Maskable Icon
├── scripts/
│   └── generate-icons.mjs      # Icon-Generator (SVG → PNG via Sharp)
├── src/
│   ├── components/             # React-Komponenten
│   ├── App.tsx                 # Root-Komponente
│   ├── App.css
│   ├── main.tsx                # Einstiegspunkt
│   └── index.css               # Globale Styles
├── index.html
├── vite.config.ts              # Vite + PWA-Plugin Konfiguration
├── tsconfig.json
├── tsconfig.node.json
├── package.json
├── Dockerfile                  # Multi-Stage Build (Node → nginx)
├── docker-compose.yml          # Compose-Konfiguration
└── nginx.conf                  # nginx SPA + PWA Konfiguration
```

## Icons

Die Icons sind im Mario Jump & Run Stil gestaltet und werden per Script aus SVG in PNG konvertiert.

| Datei | Größe | Zweck |
|-------|-------|-------|
| `pwa-512x512.png` | 512×512 | PWA Splash / Maskable |
| `pwa-192x192.png` | 192×192 | PWA Home Screen |
| `apple-touch-icon.png` | 180×180 | iOS Add to Home Screen |
| `favicon.ico` | 32×32 | Browser Tab |

### Design

- **Hintergrund:** blauer Himmel mit weißen Wolken
- **Charakter:** springender Held mit rotem Cap ("S"), rotem Overall, blauer Latzhose und Schnurrbart
- **Pipe:** grüner Röhren-Gegner als Hindernis
- **Coin:** goldene Münze in der Luft
- **Schriftzug:** "SUPER JUMPER" in Gold am unteren Rand
- **Favicon:** Charakter-Kopf mit Cap (optimiert für 32 px)

### Icons neu generieren

```bash
node scripts/generate-icons.mjs
```

Voraussetzung: `sharp` ist als Dev-Dependency installiert (`npm install`).

## Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Dev-Server starten (PWA im Dev-Modus aktiv)
npm run dev

# Production Build
npm run build

# Build lokal testen (PWA voll funktional)
npm run preview
```

## PWA testen

1. `npm run build && npm run preview` ausführen
2. Browser öffnen → `http://localhost:4173`
3. In der Adressleiste erscheint das Installations-Icon (Chrome/Edge)
4. Nach der Installation läuft die App offline

## Docker

### Aufbau (Multi-Stage)

```
Stage 1 — builder  (node:22-alpine)
  └── npm ci → npm run build → /app/dist

Stage 2 — runner   (nginx:1.27-alpine)
  └── dist/ + nginx.conf → Port 80
```

Der Builder-Layer wird nicht ins finale Image übernommen — das Produktions-Image enthält nur nginx und die statischen Assets.

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

### Starten

```bash
# Image bauen und Container starten
docker compose up --build -d

# Logs verfolgen
docker compose logs -f

# Stoppen
docker compose down
```

Die App ist danach erreichbar unter `http://localhost:3000`.

### Nur Image bauen (ohne Compose)

```bash
docker build -t super-jumper:latest .
docker run -p 3000:80 super-jumper:latest
```

### Produktions-Deployment

Für ein Deployment auf einem Server einfach das Image taggen und in eine Registry pushen:

```bash
docker build -t registry.example.com/super-jumper:1.0.0 .
docker push registry.example.com/super-jumper:1.0.0
```
