/**
 * @file levelLoader.ts
 * @description Lädt alle Level-Konfigurationen aus dem `levels/`-Verzeichnis.
 *
 * Konzept:
 *   Jedes Level ist eine eigenständige JSON-Datei in `src/games/super-jumper/levels/`.
 *   Vite's `import.meta.glob` importiert zur Build-Zeit alle passenden Dateien und
 *   bündelt sie ins finale Bundle — kein Laufzeit-Fetch nötig, funktioniert offline.
 *
 *   Neues Level hinzufügen: neue Datei `level-XX.json` anlegen → fertig.
 *   Sortierung in der Level-Auswahl nach dem `id`-Feld (aufsteigend).
 *
 *   Vollständige Feldbeschreibungen mit Wertebereichen: `levels/SCHEMA.md`
 *
 *   Ref import.meta.glob: https://vitejs.dev/guide/features#glob-import
 *
 * Koordinatensystem:
 *   X wächst nach rechts (0 = linker Rand).
 *   Y wächst nach unten (0 = oberer Rand, world.height = unterer Rand).
 *   Boden liegt bei world.height - 32 (halbe Bodenkachelhöhe 32px).
 *
 * Farben:
 *   JSON kennt keine 0x-Literale → Farben als String "0xRRGGBB".
 *   `parseColor()` konvertiert sie zur Laufzeit zu Phaser-kompatiblen Zahlen.
 */

/**
 * Verfügbare Plattform-Typen.
 * Bestimmt Textur und Optik — hat keinen Einfluss auf die Physik.
 *
 * | Typ      | Aussehen                          | Textur-Key         |
 * |----------|-----------------------------------|--------------------|
 * | "grass"  | Braun mit grüner Gras-Oberfläche  | "platform-grass"   |
 * | "stone"  | Grauer Stein mit Rissen           | "platform-stone"   |
 * | "wood"   | Helles Holz mit Maserung          | "platform-wood"    |
 * | "ice"    | Hellblau-weißes Eis, glänzend     | "platform-ice"     |
 */
export type PlatformType = 'grass' | 'stone' | 'wood' | 'ice'

/**
 * Plattform-Cluster — eine Reihe horizontal aneinandergereihter 64px-Kacheln.
 *
 * Werte:
 *   x:     Linke Kante der ersten Kachel in Weltpixeln. Bereich: 0 – world.width - 64.
 *          Empfohlen: Vielfaches von 64 (passt zur Kachelbreite).
 *   y:     Oberkante der Plattform in Weltpixeln. Bereich: 80 – world.height - 80.
 *          Höherer Y-Wert = tiefer im Bild (näher am Boden).
 *          Erreichbarkeit: Y-Abstand zur vorherigen Position ≤ jumpPower²/(2×gravity).
 *          Bei Standardwerten (jumpPower 480, gravity 600): max. ≈192px Höhendifferenz.
 *   tiles: Anzahl Kacheln. Bereich: 1–20.
 *          1 Kachel = 64px breit, 4 = 256px, 8 = 512px.
 *          Schmal (1–2) = schwierig, Breit (4+) = komfortabel.
 *   type:  Visueller Plattform-Typ. Optional — Standard: "grass".
 *          Mögliche Werte: "grass" | "stone" | "wood" | "ice"
 */
export interface PlatformDef {
  x:      number
  y:      number
  tiles:  number
  type?:  PlatformType   // optional — fehlt = "grass"
}

/**
 * Sammelbare Münze — gibt +10 Punkte.
 *
 * Werte:
 *   x: Mittelpunkt in Weltpixeln. Bereich: 0 – world.width.
 *   y: Mittelpunkt in Weltpixeln. Bereich: 0 – world.height.
 *      Typisch 20–40px über einer Plattform: platform.y - 30.
 *
 * Sprite: 16×16px, Ankerpunkt mittig.
 */
export interface CoinDef {
  x: number
  y: number
}

/**
 * Gegner — patrouilliert horizontal zwischen patrolLeft und patrolRight.
 *
 * Verhalten:
 *   - Bewegt sich mit `speed` px/s in Richtung `dir`.
 *   - Dreht bei `patrolLeft` nach rechts, bei `patrolRight` nach links um.
 *   - Berührung des Spielers: -1 Leben + 1.5s Unverwundbarkeit.
 *   - Spieler springt von oben drauf (velocity.y > 0, player.y < enemy.y - 10):
 *     Gegner stirbt, Spieler bekommt +20 Punkte und kleinen Abprall.
 *
 * Werte:
 *   x:           X-Startposition. Muss zwischen patrolLeft und patrolRight liegen.
 *   y:           Y-Mittelpunkt. Auf Plattform stehend: platform.y - 16.
 *                Auf dem Boden: world.height - 48.
 *   patrolLeft:  Linke Umkehrgrenze. Empfohlen: platform.x + 14.
 *   patrolRight: Rechte Umkehrgrenze. Empfohlen: platform.x + tiles×64 - 14.
 *                Muss > patrolLeft sein.
 *   speed:       Patrouilliergeschwindigkeit in px/s. Bereich: 20–300.
 *                60 = langsam, 100 = mittel, 180 = schnell, 250 = sehr schnell.
 *
 * Sprite: 28×32px, Ankerpunkt mittig.
 */
export interface EnemyDef {
  x:           number
  y:           number
  patrolLeft:  number
  patrolRight: number
  speed:       number
}

/**
 * Levelziel — Schatztruhe. Berührung löst "Level geschafft"-Overlay aus.
 *
 * Werte:
 *   x: X-Mittelpunkt. Typisch am Ende der Welt: world.width - 100.
 *      Bereich: 20 – world.width - 20.
 *   y: Y-Mittelpunkt.
 *      Auf dem Boden: world.height - 63  (z. B. 537 bei height 600).
 *      Auf Plattform: platform.y - 18.
 *
 * Sprite: 40×36px, Ankerpunkt mittig. Schwebt per Tween ±6px auf/ab.
 */
export interface GoalDef {
  x: number
  y: number
}

/**
 * Vollständige Konfiguration eines Levels.
 * Wird aus einer JSON-Datei in `levels/level-XX.json` geladen.
 * Vollständige Dokumentation aller Felder: `levels/SCHEMA.md`
 */
export interface LevelData {
  /**
   * Eindeutige numerische ID. Bestimmt die Sortierreihenfolge in der Level-Auswahl.
   * Bereich: 1–99. Muss pro Level einzigartig sein.
   *
   * Wichtig: Die Reihenfolge richtet sich ausschließlich nach diesem Feld —
   * nicht nach dem Dateinamen der JSON. Empfehlung: Dateiname und id konsistent
   * halten (level-01.json → id 1, level-02.json → id 2 usw.).
   */
  id: number

  /**
   * Anzeigename auf der Level-Karte und im HUD.
   * z. B. "Level 1"
   */
  name: string

  /**
   * Kurze Stimmungsbeschreibung unter dem Level-Namen.
   * z. B. "Der Anfang", "Höher hinaus", "Nachts unterwegs"
   */
  subtitle: string

  /**
   * Gesperrt-Zustand. `true` = Schloss-Icon, Klick hat keine Wirkung.
   * `false` = Level ist spielbar.
   */
  locked: boolean

  world: {
    /**
     * Gesamtbreite der Spielwelt in Pixeln.
     * Bereich: 800–9999. Empfohlen: Vielfaches von 64 (= Kachelbreite).
     * Standard: 3200 (50 Kacheln). Kamera scrollt bis zu dieser Grenze.
     */
    width: number

    /**
     * Gesamthöhe der Spielwelt in Pixeln.
     * Bereich: 400–2000. Standard: 600. Selten ändern.
     * Boden liegt automatisch bei height - 32.
     */
    height: number

    /**
     * Hintergrundfarbe (Himmel / Nacht).
     * Format: "0xRRGGBB" (Hex-String, da JSON keine 0x-Literale kennt).
     * Beispiele: "0x5c94fc" (Blau), "0xe07b54" (Abendrot), "0x1a1a2e" (Nacht)
     * Konvertierung zu Phaser-Zahl: parseColor(bgColor)
     */
    bgColor: string

    /**
     * Einfärbung der Boden-Kacheln (setTint). Gleicher Hex-Format wie bgColor.
     * Beispiele: "0x228B22" (Grasgrün), "0x8B6914" (Goldbraun), "0x16213e" (Dunkelblau)
     */
    groundColor: string

    /**
     * Einfärbung der Plattform-Kacheln (setTint). Gleicher Hex-Format.
     * Beispiele: "0x8B4513" (Braun), "0x5a3010" (Dunkelbraun), "0x0f3460" (Dunkelblau)
     */
    platformColor: string

    /**
     * Anzahl zufällig platzierter Wolken im oberen Drittel des Hintergrunds.
     * Bereich: 0–40. 0 = keine Wolken. Nur sinnvoll wenn starCount = 0.
     * Wolken liegen bei Y: 40–180 (oberes Bildviertel), verteilt über world.width.
     */
    cloudCount: number

    /**
     * Anzahl zufälliger Sternpunkte (für Nacht-Level).
     * Bereich: 0–200. 0 = keine Sterne. Nur sinnvoll wenn cloudCount = 0.
     * Sterne liegen bei Y: 0–60% von world.height.
     */
    starCount: number
  }

  physics: {
    /**
     * Schwerkraft in px/s² — steuert wie schnell der Spieler fällt.
     * Bereich: 200–1200. Standard: 600.
     * 300 = Mondgefühl (langsam), 600 = normal, 900 = sehr schwer.
     * Höhere Gravity erfordert höheres jumpPower um gleiche Höhe zu erreichen.
     * Sprunghöhe (px) ≈ jumpPower² / (2 × gravity).
     */
    gravity: number

    /**
     * Horizontale Laufgeschwindigkeit des Spielers in px/s.
     * Bereich: 80–500. Standard: 220.
     * 120 = gemächlich, 220 = normal, 350 = rasant.
     * Beeinflusst auch die horizontale Sprungweite:
     * max. Sprungweite ≈ playerSpeed × (2 × jumpPower / gravity).
     */
    playerSpeed: number

    /**
     * Sprungimpuls in px/s (Arcade-Physics: negativer Y-Velocity-Wert).
     * Bereich: 200–800. Standard: 480.
     * Niedrig (300) = kurzer Sprung, Hoch (600) = hoher Sprung.
     * Sprunghöhe ≈ jumpPower² / (2 × gravity).
     * Bei gravity 600 und jumpPower 480: ≈192px maximale Höhe.
     * Bei gravity 600 und jumpPower 600: ≈300px maximale Höhe.
     * Wichtig: Plattformen müssen innerhalb der erreichbaren Sprunghöhe liegen.
     */
    jumpPower: number
  }

  player: {
    /**
     * X-Startposition des Spielers in Weltpixeln (Mittelpunkt des Sprites).
     * Bereich: 32 – world.width - 32.
     * Empfohlen: nah am linken Rand, z. B. 120.
     */
    startX: number

    /**
     * Y-Startposition des Spielers in Weltpixeln (Mittelpunkt des Sprites).
     * Bereich: 0 – world.height - 80.
     * Für Boden-Start: world.height - 80 (z. B. 520 bei height 600).
     * Sprite ist 32×48px, Ankerpunkt mittig.
     */
    startY: number

    /**
     * Anzahl der Startleben. Bereich: 1–9. Standard: 3.
     * Im HUD als ❤️-Symbole angezeigt. Verlorene Leben als 🖤.
     */
    lives: number
  }

  /** Plattformen — vollständige Beschreibung: PlatformDef */
  platforms: PlatformDef[]

  /** Münzen — vollständige Beschreibung: CoinDef */
  coins: CoinDef[]

  /** Gegner — vollständige Beschreibung: EnemyDef */
  enemies: EnemyDef[]

  /** Levelziel (Schatztruhe) — vollständige Beschreibung: GoalDef */
  goal: GoalDef
}

// Vite lädt zur Build-Zeit alle JSON-Dateien im levels/-Verzeichnis.
// `eager: true` = synchroner Import (kein Promise), alles direkt im Bundle.
// Ref: https://vitejs.dev/guide/features#glob-import
const modules = import.meta.glob<{ default: LevelData }>(
  './levels/level-*.json',
  { eager: true },
)

/**
 * Alle geladenen Level, sortiert nach `id` aufsteigend.
 * Wird von LevelSelectScene (Karten) und GameScene (Spiellogik) verwendet.
 */
export const LEVELS: LevelData[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.id - b.id)

/**
 * Konvertiert einen Hex-String aus der JSON ("0x5c94fc") in eine Phaser-Zahl.
 *
 * Hintergrund: JSON erlaubt keine 0x-Zahlenliterale — Farben werden daher
 * als String gespeichert und hier zur Laufzeit konvertiert.
 *
 * @param hex - Hex-String im Format "0xRRGGBB", z. B. "0x5c94fc"
 * @returns Phaser-kompatibler Farbwert als Zahl, z. B. 6067964
 *
 * @example
 * parseColor("0x5c94fc") // → 6067964 (entspricht 0x5c94fc)
 */
export function parseColor(hex: string): number {
  return parseInt(hex, 16)
}
