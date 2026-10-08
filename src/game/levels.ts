export interface LevelConfig {
  id: number
  name: string
  subtitle: string
  bgColor: number
  groundColor: number
  platformColor: number
  gravity: number
  playerSpeed: number
  jumpPower: number
  locked: boolean
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Level 1',
    subtitle: 'Der Anfang',
    bgColor: 0x5c94fc,
    groundColor: 0x228B22,
    platformColor: 0x8B4513,
    gravity: 600,
    playerSpeed: 220,
    jumpPower: 480,
    locked: false,
  },
  {
    id: 2,
    name: 'Level 2',
    subtitle: 'Höher hinaus',
    bgColor: 0xe07b54,
    groundColor: 0x8B6914,
    platformColor: 0x5a3010,
    gravity: 650,
    playerSpeed: 250,
    jumpPower: 500,
    locked: false,
  },
  {
    id: 3,
    name: 'Level 3',
    subtitle: 'Nachts unterwegs',
    bgColor: 0x1a1a2e,
    groundColor: 0x16213e,
    platformColor: 0x0f3460,
    gravity: 700,
    playerSpeed: 280,
    jumpPower: 520,
    locked: false,
  },
]
