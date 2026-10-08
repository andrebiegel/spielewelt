import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })

// Super Jumper icon: pixel-art style hero jumping over a pipe, blue sky background
// Size-adaptive SVG (viewBox 512x512)
function buildSVG(size) {
  const s = size / 512
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <!-- Sky background -->
  <rect width="512" height="512" fill="#5c94fc"/>

  <!-- Clouds -->
  <g fill="white" opacity="0.9">
    <ellipse cx="80" cy="90" rx="45" ry="22"/>
    <ellipse cx="115" cy="82" rx="35" ry="20"/>
    <ellipse cx="50" cy="88" rx="30" ry="18"/>

    <ellipse cx="360" cy="70" rx="50" ry="24"/>
    <ellipse cx="400" cy="62" rx="38" ry="21"/>
    <ellipse cx="330" cy="68" rx="32" ry="19"/>
  </g>

  <!-- Ground -->
  <rect x="0" y="430" width="512" height="82" fill="#228B22"/>
  <rect x="0" y="430" width="512" height="18" fill="#32CD32"/>

  <!-- Decorative ground bricks -->
  <g fill="#1a6e1a" opacity="0.4">
    <rect x="0"   y="448" width="64" height="4"/>
    <rect x="64"  y="448" width="64" height="4"/>
    <rect x="128" y="448" width="64" height="4"/>
    <rect x="192" y="448" width="64" height="4"/>
    <rect x="256" y="448" width="64" height="4"/>
    <rect x="320" y="448" width="64" height="4"/>
    <rect x="384" y="448" width="64" height="4"/>
    <rect x="448" y="448" width="64" height="4"/>
  </g>

  <!-- Pipe (enemy obstacle) -->
  <g>
    <!-- Pipe body -->
    <rect x="370" y="340" width="80" height="90" fill="#3a9e3a"/>
    <rect x="370" y="340" width="10" height="90" fill="#4dc04d" opacity="0.6"/>
    <rect x="430" y="340" width="20" height="90" fill="#2d7a2d"/>
    <!-- Pipe top cap -->
    <rect x="358" y="320" width="104" height="28" rx="4" fill="#3a9e3a"/>
    <rect x="358" y="320" width="14" height="28" rx="2" fill="#4dc04d" opacity="0.6"/>
    <rect x="438" y="320" width="24" height="28" rx="2" fill="#2d7a2d"/>
  </g>

  <!-- Coin -->
  <circle cx="300" cy="280" r="22" fill="#FFD700"/>
  <circle cx="300" cy="280" r="16" fill="#FFA500"/>
  <text x="300" y="287" text-anchor="middle" font-family="Arial Black, sans-serif" font-weight="900" font-size="20" fill="#FFD700">$</text>

  <!-- Character (jumping, pixel-art inspired) -->
  <!-- Shadow -->
  <ellipse cx="168" cy="436" rx="36" ry="8" fill="rgba(0,0,0,0.25)"/>

  <!-- Body (red overalls) -->
  <rect x="138" y="300" width="60" height="56" rx="6" fill="#e63946"/>
  <!-- Overalls bib -->
  <rect x="148" y="308" width="40" height="30" rx="4" fill="#3a86ff"/>
  <!-- Overalls buttons -->
  <circle cx="158" cy="314" r="4" fill="#FFD700"/>
  <circle cx="178" cy="314" r="4" fill="#FFD700"/>

  <!-- Legs / Pants -->
  <rect x="138" y="352" width="26" height="34" rx="4" fill="#3a86ff"/>
  <rect x="172" y="352" width="26" height="34" rx="4" fill="#3a86ff"/>

  <!-- Shoes (left foot kicked back, right forward = jump pose) -->
  <rect x="128" y="378" width="36" height="16" rx="5" fill="#4a2c0a"/>
  <rect x="172" y="382" width="36" height="14" rx="5" fill="#4a2c0a"/>

  <!-- Arms (raised up) -->
  <rect x="102" y="288" width="36" height="18" rx="8" fill="#f4a261"/>
  <rect x="198" y="278" width="36" height="18" rx="8" fill="#f4a261"/>

  <!-- Gloves -->
  <circle cx="100" cy="297" r="12" fill="white"/>
  <circle cx="234" cy="287" r="12" fill="white"/>

  <!-- Head -->
  <ellipse cx="168" cy="266" rx="42" ry="38" fill="#f4a261"/>

  <!-- Hat (red cap) -->
  <ellipse cx="168" cy="238" rx="44" ry="14" fill="#e63946"/>
  <rect x="124" y="228" width="88" height="22" rx="6" fill="#e63946"/>
  <!-- Hat brim -->
  <rect x="116" y="242" width="96" height="10" rx="5" fill="#c0392b"/>
  <!-- Hat letter -->
  <text x="168" y="244" text-anchor="middle" font-family="Arial Black, sans-serif" font-weight="900" font-size="18" fill="white">S</text>

  <!-- Eyes -->
  <ellipse cx="154" cy="268" rx="9" ry="10" fill="white"/>
  <ellipse cx="182" cy="268" rx="9" ry="10" fill="white"/>
  <circle cx="157" cy="270" r="5" fill="#1a1a2e"/>
  <circle cx="185" cy="270" r="5" fill="#1a1a2e"/>
  <!-- Pupils shine -->
  <circle cx="159" cy="268" r="2" fill="white"/>
  <circle cx="187" cy="268" r="2" fill="white"/>

  <!-- Nose -->
  <ellipse cx="168" cy="278" rx="8" ry="5" fill="#d4845a"/>

  <!-- Mustache -->
  <ellipse cx="155" cy="284" rx="10" ry="5" fill="#4a2c0a"/>
  <ellipse cx="181" cy="284" rx="10" ry="5" fill="#4a2c0a"/>

  <!-- Jump stars / sparkles -->
  <g fill="#FFD700" opacity="0.85">
    <polygon points="80,200 83,210 93,210 85,216 88,226 80,220 72,226 75,216 67,210 77,210" transform="scale(0.7) translate(40,80)"/>
    <polygon points="440,160 443,170 453,170 445,176 448,186 440,180 432,186 435,176 427,170 437,170" transform="scale(0.55) translate(340,60)"/>
    <polygon points="260,120 262,128 270,128 264,133 266,141 260,136 254,141 256,133 250,128 258,128" transform="scale(0.6) translate(160,30)"/>
  </g>

  <!-- "SUPER JUMPER" text at bottom -->
  <rect x="60" y="458" width="392" height="40" rx="6" fill="rgba(0,0,0,0.35)"/>
  <text x="256" y="486" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="26" fill="#FFD700" letter-spacing="2">SUPER JUMPER</text>
</svg>`
}

async function generateIcon(size, filename) {
  const svg = Buffer.from(buildSVG(size))
  await sharp(svg)
    .png()
    .toFile(join(publicDir, filename))
  console.log(`Generated: ${filename} (${size}x${size})`)
}

// Favicon 32x32 (simplified - just the character face + hat)
function buildFaviconSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#5c94fc"/>
  <!-- Ground -->
  <rect x="0" y="26" width="32" height="6" fill="#228B22"/>
  <rect x="0" y="26" width="32" height="2" fill="#32CD32"/>
  <!-- Head -->
  <ellipse cx="16" cy="16" rx="9" ry="8" fill="#f4a261"/>
  <!-- Hat -->
  <ellipse cx="16" cy="9" rx="10" ry="3" fill="#e63946"/>
  <rect x="6" y="7" width="20" height="5" rx="2" fill="#e63946"/>
  <rect x="5" y="11" width="22" height="3" rx="1.5" fill="#c0392b"/>
  <!-- Eyes -->
  <circle cx="13" cy="16" r="2" fill="white"/>
  <circle cx="19" cy="16" r="2" fill="white"/>
  <circle cx="13.5" cy="16.5" r="1" fill="#1a1a2e"/>
  <circle cx="19.5" cy="16.5" r="1" fill="#1a1a2e"/>
  <!-- Mustache -->
  <ellipse cx="13" cy="20" rx="3" ry="1.5" fill="#4a2c0a"/>
  <ellipse cx="19" cy="20" rx="3" ry="1.5" fill="#4a2c0a"/>
</svg>`
}

async function generateFavicon() {
  const svg = Buffer.from(buildFaviconSVG())
  await sharp(svg).png().toFile(join(publicDir, 'favicon.png'))
  // Also write ICO-compatible PNG named favicon.ico (browsers accept PNG)
  await sharp(svg).resize(32, 32).png().toFile(join(publicDir, 'favicon.ico'))
  console.log('Generated: favicon.ico (32x32)')
}

async function main() {
  await Promise.all([
    generateIcon(192, 'pwa-192x192.png'),
    generateIcon(512, 'pwa-512x512.png'),
    generateIcon(180, 'apple-touch-icon.png'),
    generateFavicon(),
  ])
  console.log('All icons generated!')
}

main().catch(console.error)
