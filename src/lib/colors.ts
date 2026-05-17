export const PALETTE_NAMES: Record<string, string> = {
  '#E8E4E1': 'CREAM',    '#0090C0': 'AQUA',      '#CC3820': 'ROUGE',
  '#E8C800': 'DANDELION','#4A4140': 'CHOCO',     '#d4ef02': 'LIME',
  '#0a205c': 'NAVY',     '#eb5791': 'ROSE',       '#e9afaf': 'BLUSH',
  '#cfd9a8': 'SAGE',     '#054899': 'COBALT',     '#ce1719': 'CRIMSON',
  '#4d4135': 'ESPRESSO', '#7ab17a': 'FERN',       '#354fae': 'INDIGO',
  '#ec602b': 'TANGERINE','#e7d6b9': 'LINEN',      '#4dab4a': 'CLOVER',
  '#8fb9c9': 'MIST',     '#fd8143': 'PEACH',      '#f9f7d0': 'BUTTER',
  '#2d6a53': 'FOREST',   '#bbd7ec': 'SKY',        '#ffcc00': 'MARIGOLD',
  '#fffaf0': 'IVORY',
}

export const PALETTE = [
  '#E8E4E1', '#0090C0', '#CC3820', '#E8C800', '#4A4140',
  '#d4ef02', '#0a205c', '#eb5791', '#e9afaf', '#cfd9a8',
  '#054899', '#ce1719', '#4d4135', '#7ab17a', '#354fae',
  '#ec602b', '#e7d6b9', '#4dab4a', '#8fb9c9', '#fd8143',
  '#f9f7d0', '#2d6a53', '#bbd7ec', '#ffcc00', '#fffaf0',
]

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const rMean = (r1 + r2) / 2
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rMean) / 256) * db * db
  )
}

export function snapToPalette(hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  let minDist = Infinity
  let closest = PALETTE[0]
  for (const p of PALETTE) {
    const [pr, pg, pb] = hexToRgb(p)
    const d = colorDistance(r, g, b, pr, pg, pb)
    if (d < minDist) { minDist = d; closest = p }
  }
  return closest
}

const SIMILAR_GROUPS: string[][] = [
  ['#4A4140', '#4d4135'],  // CHOCO와 ESPRESSO
]

function addWithSimilar(used: Set<string>, color: string) {
  used.add(color)
  for (const group of SIMILAR_GROUPS) {
    if (group.includes(color)) {
      group.forEach(c => used.add(c))
    }
  }
}

export function snapToPaletteUnique(hexes: string[]): string[] {
  const used = new Set<string>()
  return hexes.map(hex => {
    const [r, g, b] = hexToRgb(hex)
    let minDist = Infinity
    let closest = ''
    for (const p of PALETTE) {
      if (used.has(p)) continue
      const [pr, pg, pb] = hexToRgb(p)
      const d = colorDistance(r, g, b, pr, pg, pb)
      if (d < minDist) { minDist = d; closest = p }
    }
    if (!closest) closest = snapToPalette(hex)
    addWithSimilar(used, closest)
    return closest
  })
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
    case g: h = ((b - r) / d + 2) / 6; break
    default: h = ((r - g) / d + 4) / 6
  }
  return [h * 360, s, l]
}

export interface SlotColors {
  milk: string        // index 0,4
  brown: string       // index 1,3
  skyblue: string     // index 2
  insideGreen: string // index 5
}

export function extractSlotColors(imageData: ImageData): SlotColors {
  const { data, width, height } = imageData
  const STEP = 10
  const NUM_BUCKETS = 10
  const BUCKET_DEG = 36

  type Sample = { rgb: [number, number, number]; s: number }
  const buckets: Sample[][] = Array.from({ length: NUM_BUCKETS }, () => [])

  for (let y = 0; y < height; y += STEP) {
    for (let x = 0; x < width; x += STEP) {
      const i = (y * width + x) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const [h, s, l] = rgbToHsl(r, g, b)
      if (s < 0.2 || l > 0.88 || l < 0.1) continue
      const bi = Math.min(NUM_BUCKETS - 1, Math.floor(h / BUCKET_DEG))
      buckets[bi].push({ rgb: [r, g, b], s })
    }
  }

  const pool: { rgb: [number, number, number]; h: number; s: number; l: number }[] =
    buckets
      .filter(b => b.length > 0)
      .map(b => {
        const best = b.reduce((a, c) => c.s > a.s ? c : a)
        const [h, s, l] = rgbToHsl(...best.rgb)
        return { rgb: best.rgb, h, s, l }
      })

  if (pool.length === 0) {
    return { milk: '#F5F0E8', brown: '#4A3728', skyblue: '#6B9FBF', insideGreen: '#7FA85C' }
  }

  const used = new Set<number>()

  function pickIdx(score: (e: typeof pool[0]) => number, lower = false, filter?: (e: typeof pool[0]) => boolean): number {
    let best = -1, bestVal = lower ? Infinity : -Infinity
    pool.forEach((e, i) => {
      if (used.has(i)) return
      if (filter && !filter(e)) return
      const v = score(e)
      if (lower ? v < bestVal : v > bestVal) { best = i; bestVal = v }
    })
    if (best === -1) pool.forEach((e, i) => {
      if (used.has(i)) return
      const v = score(e)
      if (lower ? v < bestVal : v > bestVal) { best = i; bestVal = v }
    })
    return Math.max(0, best)
  }

  const milkIdx = pickIdx(e => e.l, false, e => e.l <= 0.85); used.add(milkIdx)
  const skyblueIdx = pickIdx(e => e.s); used.add(skyblueIdx)
  const brownIdx = pickIdx(e => e.l, true); used.add(brownIdx)
  const igIdx = pickIdx(e => e.s * e.l)

  function clampColor(entry: typeof pool[0], lRange?: [number, number]): string {
    const { h, s, l } = entry
    const cl = lRange && s < 0.5 ? Math.max(lRange[0], Math.min(lRange[1], l)) : l
    return hslToHex(h, s, cl)
  }

  return {
    milk:        clampColor(pool[milkIdx],   [0.75, 0.93]),
    skyblue:     clampColor(pool[skyblueIdx],[0.30, 0.75]),
    brown:       clampColor(pool[brownIdx],  [0.10, 0.45]),
    insideGreen: clampColor(pool[igIdx],     [0.40, 0.75]),
  }
}

export function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function slotColorsToArray(sc: SlotColors): string[] {
  return [sc.milk, sc.brown, sc.skyblue, sc.brown, sc.milk, sc.insideGreen]
}
