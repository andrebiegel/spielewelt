/**
 * @file validate-levels.mjs
 * @description Validiert alle Level-JSONs gegen das JSON Schema vor dem Build.
 *
 * Ausführung:  node scripts/validate-levels.mjs
 * Im Build:    npm run build  (via prebuild-Hook in package.json)
 *
 * Zusätzlich zum Schema werden semantische Regeln geprüft:
 *   - id muss eindeutig sein (keine Duplikate)
 *   - enemy.x muss zwischen patrolLeft und patrolRight liegen
 *   - enemy.patrolRight muss > patrolLeft sein
 *   - platform.x + tiles*64 darf world.width nicht überschreiten
 *   - goal.x darf world.width nicht überschreiten
 *   - player.startX/startY muss innerhalb der Weltgrenzen liegen
 */

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Ajv from 'ajv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const levelsDir = join(__dirname, '..', 'src', 'games', 'super-jumper', 'levels')
const schemaPath = join(levelsDir, 'level.schema.json')

// ── Schema laden ────────────────────────────────────────────────────────────

const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'))
const ajv    = new Ajv({ allErrors: true })
const validate = ajv.compile(schema)

// ── Level-Dateien sammeln ────────────────────────────────────────────────────

const files = readdirSync(levelsDir)
  .filter((f) => f.match(/^level-\d+\.json$/))
  .sort()

if (files.length === 0) {
  console.error('❌ Keine Level-Dateien gefunden in:', levelsDir)
  process.exit(1)
}

// ── Validierung ──────────────────────────────────────────────────────────────

let hasError   = false
const seenIds  = new Map()   // id → filename

console.log(`\n🎮 Validiere ${files.length} Level-Datei(en)...\n`)

for (const file of files) {
  const filePath = join(levelsDir, file)
  let level

  // JSON parsen
  try {
    level = JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (e) {
    console.error(`❌ ${file}: Ungültiges JSON — ${e.message}`)
    hasError = true
    continue
  }

  const errors = []

  // ── JSON Schema Validierung ───────────────────────────────────────────────
  if (!validate(level)) {
    for (const err of validate.errors) {
      const path = err.instancePath || '(root)'
      errors.push(`Schema: ${path} ${err.message}`)
    }
  }

  // ── Semantische Regeln ────────────────────────────────────────────────────

  if (level.id !== undefined) {
    // Doppelte IDs erkennen
    if (seenIds.has(level.id)) {
      errors.push(`Semantik: id ${level.id} wird bereits von "${seenIds.get(level.id)}" verwendet`)
    } else {
      seenIds.set(level.id, file)
    }
  }

  if (level.world && level.player) {
    const W = level.world.width
    const H = level.world.height

    // Spieler-Startposition innerhalb der Welt
    if (level.player.startX > W) {
      errors.push(`Semantik: player.startX (${level.player.startX}) > world.width (${W})`)
    }
    if (level.player.startY > H) {
      errors.push(`Semantik: player.startY (${level.player.startY}) > world.height (${H})`)
    }

    // Plattformen innerhalb der Welt
    if (Array.isArray(level.platforms)) {
      level.platforms.forEach((p, i) => {
        const rightEdge = p.x + (p.tiles ?? 1) * 64
        if (rightEdge > W) {
          errors.push(`Semantik: platforms[${i}] rechte Kante (${rightEdge}px) überschreitet world.width (${W})`)
        }
        if (p.y >= H) {
          errors.push(`Semantik: platforms[${i}].y (${p.y}) >= world.height (${H})`)
        }
      })
    }

    // Gegner: patrolRight > patrolLeft, x im Patrol-Bereich
    if (Array.isArray(level.enemies)) {
      level.enemies.forEach((e, i) => {
        if (e.patrolRight <= e.patrolLeft) {
          errors.push(`Semantik: enemies[${i}].patrolRight (${e.patrolRight}) muss > patrolLeft (${e.patrolLeft}) sein`)
        }
        if (e.x < e.patrolLeft || e.x > e.patrolRight) {
          errors.push(`Semantik: enemies[${i}].x (${e.x}) liegt nicht zwischen patrolLeft (${e.patrolLeft}) und patrolRight (${e.patrolRight})`)
        }
        if (e.patrolRight > W) {
          errors.push(`Semantik: enemies[${i}].patrolRight (${e.patrolRight}) überschreitet world.width (${W})`)
        }
      })
    }

    // Ziel innerhalb der Welt
    if (level.goal) {
      if (level.goal.x > W) {
        errors.push(`Semantik: goal.x (${level.goal.x}) überschreitet world.width (${W})`)
      }
      if (level.goal.y > H) {
        errors.push(`Semantik: goal.y (${level.goal.y}) überschreitet world.height (${H})`)
      }
    }
  }

  // ── Ergebnis ausgeben ────────────────────────────────────────────────────
  if (errors.length === 0) {
    console.log(`  ✅ ${file}  (id: ${level.id}, "${level.name}")`)
  } else {
    console.error(`  ❌ ${file}  (id: ${level.id ?? '?'}, "${level.name ?? '?'}")`)
    for (const err of errors) {
      console.error(`       → ${err}`)
    }
    hasError = true
  }
}

// ── Abschluss ────────────────────────────────────────────────────────────────

console.log()
if (hasError) {
  console.error('❌ Level-Validierung fehlgeschlagen — Build abgebrochen.\n')
  process.exit(1)
} else {
  console.log(`✅ Alle ${files.length} Level valide.\n`)
}
