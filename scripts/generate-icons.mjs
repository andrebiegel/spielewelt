import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })

/**
 * Spielewelt Icon — 512×512
 *
 * Design-Konzept: Kindlich, bunt, einladend
 *   - Warmer lila-blauer Verlauf-Hintergrund (via gestapelte Rechtecke)
 *   - Leuchtende Sterne und Funken
 *   - Großer bunter Game-Controller in der Mitte
 *   - Rakete oben rechts
 *   - Regenbogen-Bogen im Hintergrund
 *   - Konfetti-Punkte überall verteilt
 *   - "SPIELEWELT" Schriftzug unten in warmem Gold
 */
function buildSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <!-- Hintergrund-Verlauf: dunkelviolett → mittelblau -->
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#1a0533"/>
      <stop offset="60%"  stop-color="#2d1b69"/>
      <stop offset="100%" stop-color="#11317a"/>
    </linearGradient>
    <!-- Controller-Glanz -->
    <radialGradient id="ctrlGlow" cx="50%" cy="40%" r="50%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Hintergrund -->
  <rect width="512" height="512" fill="url(#bg)"/>

  <!-- Regenbogen-Bogen (hinten) -->
  <g opacity="0.35">
    <path d="M 20 420 Q 256 60 492 420" fill="none" stroke="#ff6b6b" stroke-width="18" stroke-linecap="round"/>
    <path d="M 36 420 Q 256 88 476 420" fill="none" stroke="#ffa500" stroke-width="16" stroke-linecap="round"/>
    <path d="M 52 420 Q 256 114 460 420" fill="none" stroke="#FFD700" stroke-width="14" stroke-linecap="round"/>
    <path d="M 66 420 Q 256 136 446 420" fill="none" stroke="#4ddb4d" stroke-width="12" stroke-linecap="round"/>
    <path d="M 80 420 Q 256 156 432 420" fill="none" stroke="#3a86ff" stroke-width="11" stroke-linecap="round"/>
    <path d="M 94 420 Q 256 174 418 420" fill="none" stroke="#a855f7" stroke-width="10" stroke-linecap="round"/>
  </g>

  <!-- Sterne (groß, leuchtend) -->
  <!-- Stern-Funktion: Polygon 8-Zack -->
  <g fill="#FFD700">
    <!-- Stern oben links -->
    <polygon points="72,55 77,72 95,72 81,82 86,100 72,90 58,100 63,82 49,72 67,72" opacity="0.95"/>
    <!-- Stern oben rechts -->
    <polygon points="440,42 444,55 458,55 447,64 451,77 440,68 429,77 433,64 422,55 436,55" opacity="0.9"/>
    <!-- Stern mitte links -->
    <polygon points="38,200 41,210 52,210 43,216 46,227 38,221 30,227 33,216 24,210 35,210" opacity="0.7"/>
  </g>

  <!-- Kleine Funkelsterne (weiß) -->
  <g fill="white">
    <circle cx="120" cy="45"  r="3" opacity="0.9"/>
    <circle cx="195" cy="30"  r="2" opacity="0.7"/>
    <circle cx="310" cy="25"  r="3" opacity="0.85"/>
    <circle cx="390" cy="55"  r="2" opacity="0.6"/>
    <circle cx="470" cy="110" r="2.5" opacity="0.8"/>
    <circle cx="30"  cy="140" r="2" opacity="0.65"/>
    <circle cx="480" cy="200" r="2" opacity="0.7"/>
    <circle cx="60"  cy="320" r="2.5" opacity="0.6"/>
    <circle cx="490" cy="350" r="2" opacity="0.55"/>
    <!-- Glitzerpunkte -->
    <polygon points="160,80 162,86 168,86 163,90 165,96 160,92 155,96 157,90 152,86 158,86" opacity="0.8"/>
    <polygon points="350,60 352,65 357,65 353,68 355,73 350,70 345,73 347,68 343,65 348,65" opacity="0.75"/>
  </g>

  <!-- Rakete (oben rechts, schräg) -->
  <g transform="translate(390,60) rotate(-30)">
    <!-- Raketenkörper -->
    <ellipse cx="0" cy="0" rx="22" ry="52" fill="#e63946"/>
    <ellipse cx="0" cy="0" rx="16" ry="44" fill="#ff6b6b"/>
    <!-- Spitze -->
    <ellipse cx="0" cy="-46" rx="14" ry="16" fill="#c0392b"/>
    <!-- Fenster -->
    <circle cx="0" cy="-10" r="10" fill="#a8d8ea"/>
    <circle cx="0" cy="-10" r="7"  fill="#5dade2"/>
    <circle cx="-3" cy="-13" r="3" fill="white" opacity="0.6"/>
    <!-- Flügel links -->
    <polygon points="-22,30 -40,55 -8,42" fill="#c0392b"/>
    <!-- Flügel rechts -->
    <polygon points="22,30 40,55 8,42" fill="#c0392b"/>
    <!-- Flammen -->
    <ellipse cx="0"   cy="62" rx="10" ry="18" fill="#FFD700" opacity="0.95"/>
    <ellipse cx="-6"  cy="68" rx="6"  ry="12" fill="#ff6b6b" opacity="0.8"/>
    <ellipse cx="6"   cy="66" rx="6"  ry="12" fill="#ffa500" opacity="0.8"/>
  </g>

  <!-- Game Controller (Mitte, groß) -->
  <g transform="translate(256,248)">
    <!-- Controller-Körper -->
    <rect x="-110" y="-70" width="220" height="130" rx="55" fill="#6c3fc5"/>
    <rect x="-110" y="-70" width="220" height="130" rx="55" fill="url(#ctrlGlow)"/>
    <!-- Griffe links -->
    <rect x="-110" y="20" width="55" height="55" rx="20" fill="#5a34a8"/>
    <!-- Griffe rechts -->
    <rect x="55"   y="20" width="55" height="55" rx="20" fill="#5a34a8"/>
    <!-- Rand-Highlight oben -->
    <rect x="-90" y="-65" width="180" height="8" rx="4" fill="#9b6ef0" opacity="0.6"/>

    <!-- D-Pad (links) -->
    <rect x="-80" y="-20" width="14" height="40" rx="4" fill="#3a2080"/>
    <rect x="-93" y="-7"  width="40" height="14" rx="4" fill="#3a2080"/>

    <!-- Buttons rechts (ABXY in Farben) -->
    <!-- A (unten, rot) -->
    <circle cx="62"  cy="18"  r="13" fill="#e63946"/>
    <text x="62"  y="23"  text-anchor="middle" font-family="Arial Black" font-size="13" font-weight="900" fill="white">A</text>
    <!-- B (rechts, gelb) -->
    <circle cx="80"  cy="0"   r="13" fill="#FFD700"/>
    <text x="80"  y="5"   text-anchor="middle" font-family="Arial Black" font-size="13" font-weight="900" fill="#4a2c0a">B</text>
    <!-- X (links, blau) -->
    <circle cx="44"  cy="0"   r="13" fill="#3a86ff"/>
    <text x="44"  y="5"   text-anchor="middle" font-family="Arial Black" font-size="13" font-weight="900" fill="white">X</text>
    <!-- Y (oben, grün) -->
    <circle cx="62"  cy="-18" r="13" fill="#2ecc71"/>
    <text x="62"  y="-13" text-anchor="middle" font-family="Arial Black" font-size="13" font-weight="900" fill="white">Y</text>

    <!-- Start/Select Buttons (mitte) -->
    <rect x="-16" y="-8" width="14" height="8" rx="4" fill="#3a2080"/>
    <rect x="2"   y="-8" width="14" height="8" rx="4" fill="#3a2080"/>

    <!-- Analogsticks -->
    <circle cx="-40" cy="42" r="16" fill="#3a2080"/>
    <circle cx="-40" cy="42" r="10" fill="#5a34a8"/>
    <circle cx="40"  cy="42" r="16" fill="#3a2080"/>
    <circle cx="40"  cy="42" r="10" fill="#5a34a8"/>

    <!-- Controller-Glanz -->
    <ellipse cx="-30" cy="-50" rx="40" ry="10" fill="white" opacity="0.12"/>
  </g>

  <!-- Konfetti-Punkte (bunt, überall) -->
  <g>
    <circle cx="40"  cy="400" r="7" fill="#ff6b6b" opacity="0.85"/>
    <circle cx="80"  cy="370" r="5" fill="#FFD700" opacity="0.9"/>
    <circle cx="55"  cy="450" r="6" fill="#3a86ff" opacity="0.8"/>
    <circle cx="460" cy="390" r="7" fill="#2ecc71" opacity="0.85"/>
    <circle cx="490" cy="430" r="5" fill="#ff6b6b" opacity="0.75"/>
    <circle cx="470" cy="460" r="6" fill="#FFD700" opacity="0.8"/>
    <circle cx="130" cy="440" r="5" fill="#a855f7" opacity="0.8"/>
    <circle cx="380" cy="445" r="5" fill="#3a86ff" opacity="0.75"/>
    <!-- Konfetti-Rechtecke (gedreht) -->
    <rect x="100" y="390" width="10" height="6" rx="2" fill="#ff6b6b" opacity="0.8" transform="rotate(25 105 393)"/>
    <rect x="410" cy="395" width="10" height="6" rx="2" fill="#2ecc71" opacity="0.8" transform="rotate(-20 415 398)"/>
    <rect x="160" cy="460" width="8"  height="5" rx="2" fill="#FFD700" opacity="0.85" transform="rotate(40 164 462)"/>
    <rect x="350" cy="465" width="8"  height="5" rx="2" fill="#3a86ff" opacity="0.8" transform="rotate(-35 354 468)"/>
  </g>

  <!-- "SPIELEWELT" Schriftzug -->
  <rect x="42" y="455" width="428" height="46" rx="10" fill="rgba(0,0,0,0.45)"/>
  <!-- Schatten -->
  <text x="258" y="490" text-anchor="middle"
    font-family="Arial Black, Impact, sans-serif" font-weight="900"
    font-size="30" fill="#4a2c0a" letter-spacing="3">SPIELEWELT</text>
  <!-- Haupttext -->
  <text x="256" y="488" text-anchor="middle"
    font-family="Arial Black, Impact, sans-serif" font-weight="900"
    font-size="30" fill="#FFD700" letter-spacing="3">SPIELEWELT</text>
</svg>`
}

// Favicon 32×32 — Controller-Icon mit Glanz-Hintergrund
function buildFaviconSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="fbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2d1b69"/>
      <stop offset="100%" stop-color="#11317a"/>
    </linearGradient>
  </defs>
  <!-- Hintergrund -->
  <rect width="32" height="32" rx="7" fill="url(#fbg)"/>
  <!-- Sterne -->
  <circle cx="5"  cy="5"  r="1.5" fill="white" opacity="0.8"/>
  <circle cx="27" cy="7"  r="1.2" fill="white" opacity="0.7"/>
  <circle cx="27" cy="24" r="1"   fill="white" opacity="0.6"/>
  <!-- Controller-Körper -->
  <rect x="3" y="10" width="26" height="16" rx="7" fill="#6c3fc5"/>
  <!-- Griff links -->
  <rect x="3" y="20" width="8" height="8" rx="4" fill="#5a34a8"/>
  <!-- Griff rechts -->
  <rect x="21" y="20" width="8" height="8" rx="4" fill="#5a34a8"/>
  <!-- D-Pad -->
  <rect x="7"  y="14" width="2" height="6" rx="1" fill="#3a2080"/>
  <rect x="5"  y="16" width="6" height="2" rx="1" fill="#3a2080"/>
  <!-- Buttons -->
  <circle cx="22" cy="14" r="2.5" fill="#e63946"/>
  <circle cx="26" cy="14" r="2.5" fill="#FFD700"/>
  <circle cx="18" cy="14" r="2.5" fill="#3a86ff"/>
  <!-- Highlight -->
  <rect x="5" y="11" width="14" height="3" rx="1.5" fill="white" opacity="0.12"/>
</svg>`
}

async function generateIcon(size, filename) {
  const svg = Buffer.from(buildSVG())
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(publicDir, filename))
  console.log(`Generated: ${filename} (${size}×${size})`)
}

async function generateFavicon() {
  const svg = Buffer.from(buildFaviconSVG())
  await sharp(svg).resize(32, 32).png().toFile(join(publicDir, 'favicon.png'))
  await sharp(svg).resize(32, 32).png().toFile(join(publicDir, 'favicon.ico'))
  console.log('Generated: favicon.ico (32×32)')
}

async function main() {
  await Promise.all([
    generateIcon(512, 'pwa-512x512.png'),
    generateIcon(192, 'pwa-192x192.png'),
    generateIcon(180, 'apple-touch-icon.png'),
    generateFavicon(),
  ])
  console.log('All icons generated!')
}

main().catch(console.error)
