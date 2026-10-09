import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

const pkg  = JSON.parse(readFileSync('./package.json', 'utf-8'))
const lock = JSON.parse(readFileSync('./package-lock.json', 'utf-8'))

// Resolve exact installed version from lockfile (packages key in lockfile v3)
function resolvedVersion(name: string): string {
  const entry = lock.packages?.[`node_modules/${name}`]
  return entry?.version ?? pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? '?'
}

interface DepEntry { name: string; version: string; type: 'runtime' | 'build' }

const appDeps: DepEntry[] = [
  ...Object.keys(pkg.dependencies    ?? {}).map((name) => ({ name, version: resolvedVersion(name), type: 'runtime' as const })),
  ...Object.keys(pkg.devDependencies ?? {}).map((name) => ({ name, version: resolvedVersion(name), type: 'build'   as const })),
]

// On GitHub Pages the app lives at /<repo-name>/
// GITHUB_REPOSITORY is set automatically by Actions: "owner/repo"
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = repo ? `/${repo}/` : '/'

// Default Update-URL:
//   - GitHub Pages Build:  https://<owner>.github.io/<repo>/
//   - Lokaler Dev-Build:   http://localhost:4173/
//   - Überschreibbar per UI → localStorage('update-url')
const defaultUpdateUrl = repo
  ? `https://${process.env.GITHUB_REPOSITORY?.split('/')[0]}.github.io/${repo}/`
  : 'http://localhost:4173/'

export default defineConfig({
  base,
  define: {
    __APP_VERSION__:    JSON.stringify(pkg.version),
    __APP_DEPS__:       JSON.stringify(appDeps),
    __DEFAULT_UPDATE_URL__: JSON.stringify(defaultUpdateUrl),
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Spielewelt',
        short_name: 'Spielewelt',
        description: 'Spielewelt — Multi-Game Plattform als PWA',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        scope: base,
        start_url: base,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ]
})
