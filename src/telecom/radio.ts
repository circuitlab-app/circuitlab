/*
 * A small, simplified radio model for the Telecom Lab: how strong a signal
 * arrives after some distance and walls, how many bars that is, and which
 * network letter (G, E, 3G, H, H+, 4G/LTE, LTE+, 5G, 5G+) a phone would show.
 *
 * It is a teaching model, not a planning tool: free-space loss near the
 * mast, then 40 dB per tenfold distance as in a city, a fixed loss per wall
 * that grows with frequency, and one sensitivity per technology.
 */

export type Gen = '2g' | '3g' | '4g' | '5g'
export type Tech = 'landline' | Gen | 'walkie'

export const GENS: Gen[] = ['2g', '3g', '4g', '5g']
export const TECHS: Tech[] = ['landline', '2g', '3g', '4g', '5g', 'walkie']

export type RadioTech = {
  /** carrier frequency in MHz */
  mhz: number
  /** what a phone (or handheld radio) transmits, in dBm */
  phoneDbm: number
  /** the weakest signal still usable, in dBm */
  sensitivity: number
  codec: string
  /** the voice codec's bit rate, kbit/s */
  kbps: number
  modulation: string
  tower: string
  core: string
  access: 'FDMA' | 'TDMA' | 'CDMA' | 'OFDMA'
}

export const RADIO: Record<Gen | 'walkie', RadioTech> = {
  '2g': { mhz: 900, phoneDbm: 33, sensitivity: -108, codec: 'GSM-EFR', kbps: 12.2, modulation: 'GMSK', tower: 'BTS', core: 'MSC', access: 'TDMA' },
  '3g': { mhz: 2100, phoneDbm: 24, sensitivity: -110, codec: 'AMR', kbps: 12.2, modulation: 'QPSK', tower: 'NodeB', core: 'MSC', access: 'CDMA' },
  '4g': { mhz: 1800, phoneDbm: 23, sensitivity: -105, codec: 'EVS (VoLTE)', kbps: 24.4, modulation: '64-QAM', tower: 'eNodeB', core: 'EPC + IMS', access: 'OFDMA' },
  '5g': { mhz: 3500, phoneDbm: 26, sensitivity: -100, codec: 'EVS (VoNR)', kbps: 24.4, modulation: '256-QAM', tower: 'gNodeB', core: '5GC + IMS', access: 'OFDMA' },
  walkie: { mhz: 446, phoneDbm: 27, sensitivity: -115, codec: 'AMBE+2', kbps: 2.45, modulation: '4FSK', tower: '', core: '', access: 'TDMA' },
}

/** The radio a technology uses; a landline has none, so its radio parts behave like 4G. */
export const radioOf = (tech: Tech): RadioTech => RADIO[tech === 'landline' ? '4g' : tech]

/** A tower's sector: 20 W into an antenna with 17 dBi of gain. */
export const TOWER_DBM = 43
export const TOWER_GAIN = 17
/** What a modulator puts out when no power amplifier follows it. */
export const NO_AMP_DBM = -10
/** A receiving antenna with no low-noise amplifier after it hears this much less. */
export const NO_LNA_DB = 8

/** 5G bands: low reaches far, mid is the usual 5G, high (mmWave) is very fast but very short. */
export type Band5g = 'low' | 'mid' | 'high'
export const BAND_MHZ: Record<Band5g, number> = { low: 700, mid: 3500, high: 28000 }

/** How much one wall takes away: higher frequencies get through walls far worse. */
export function wallLoss(mhz: number): number {
  return mhz < 1000 ? 6 : mhz < 2500 ? 9 : mhz < 6000 ? 13 : 35
}

/**
 * Loss in dB over `km` between a mast and a phone in a city: the 3GPP urban
 * macro model without line of sight (13.54 + 39.08·log d[m] + 20·log f[GHz]),
 * never less than in free space.
 */
export function pathLoss(mhz: number, km: number): number {
  const d = Math.max(km, 0.005)
  const free = 32.44 + 20 * Math.log10(mhz) + 20 * Math.log10(d)
  const city = 13.54 + 39.08 * Math.log10(d * 1000) + 20 * Math.log10(mhz / 1000)
  return Math.max(free, city)
}

export function receivedDbm(o: { tx: number; gain?: number; mhz: number; km: number; walls?: number }): number {
  return o.tx + (o.gain ?? 0) - pathLoss(o.mhz, o.km) - (o.walls ?? 0) * wallLoss(o.mhz)
}

export type Bars = 0 | 1 | 2 | 3 | 4

/** Bars from how far above the weakest usable signal it is. */
export function barsOf(marginDb: number): Bars {
  return marginDb >= 30 ? 4 : marginDb >= 20 ? 3 : marginDb >= 10 ? 2 : marginDb >= 0 ? 1 : 0
}

/* ───────────────────────── towers on the map ───────────────────────── */

export type Tower = {
  id: string
  /** position in km */
  x: number
  y: number
  gens: Gen[]
  band5g: Band5g
  /** two 4G bands at once (carrier aggregation): LTE+ / 4G+ */
  aggregation: boolean
  on: boolean
}

/** A building, in km; every wall between the tower and the phone weakens the signal. */
export type Building = { x: number; y: number; w: number; h: number }

/** Liang–Barsky: does the segment from a to b pass through the rectangle? */
function crosses(ax: number, ay: number, bx: number, by: number, r: Building): boolean {
  const dx = bx - ax
  const dy = by - ay
  let t0 = 0
  let t1 = 1
  const edges: [number, number][] = [
    [-dx, ax - r.x],
    [dx, r.x + r.w - ax],
    [-dy, ay - r.y],
    [dy, r.y + r.h - ay],
  ]
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false
    } else {
      const t = q / p
      if (p < 0) t0 = Math.max(t0, t)
      else t1 = Math.min(t1, t)
      if (t0 > t1) return false
    }
  }
  return true
}

/** Walls between two points: two for each building crossed (in and out), one if a point is inside. */
export function wallsBetween(ax: number, ay: number, bx: number, by: number, buildings: Building[]): number {
  let walls = 0
  for (const b of buildings) {
    if (!crosses(ax, ay, bx, by, b)) continue
    const inside = (x: number, y: number) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h
    walls += inside(ax, ay) || inside(bx, by) ? 1 : 2
  }
  return walls
}

export type NetIcon = 'none' | 'G' | 'E' | '3G' | 'H' | 'H+' | '4G' | 'LTE' | '4G+' | 'LTE+' | '5G' | '5G+'

export type Service = {
  tower: Tower | null
  gen: Gen | null
  icon: NetIcon
  dbm: number
  margin: number
  bars: Bars
  /** an estimate of the download speed, Mbit/s */
  mbps: number
  modulation: string
  km: number
  walls: number
}

const RANK: Record<Gen, number> = { '2g': 1, '3g': 2, '4g': 3, '5g': 4 }

const SPEED: Record<Exclude<NetIcon, 'none'>, number> = {
  G: 0.04,
  E: 0.2,
  '3G': 0.38,
  H: 7.2,
  'H+': 21,
  '4G': 50,
  LTE: 50,
  '4G+': 180,
  'LTE+': 180,
  '5G': 450,
  '5G+': 1800,
}

const mhzOf = (gen: Gen, tower: Tower) => (gen === '5g' ? BAND_MHZ[tower.band5g] : RADIO[gen].mhz)

/** 5G mid and high bands aim beams at the phone (massive MIMO): about 8 dB more. */
const beamGain = (gen: Gen, tower: Tower) => (gen === '5g' && tower.band5g !== 'low' ? 8 : 0)

/** The weakest usable 5G signal depends on the band: wider channels let in more noise. */
const sensitivityOf = (gen: Gen, tower: Tower) =>
  gen === '5g' && tower.band5g === 'high' ? -92 : RADIO[gen].sensitivity

/** The modulation a link uses at this margin: the better the signal, the more bits per symbol. */
export function modulationFor(gen: Gen, margin: number, icon: NetIcon): string {
  if (gen === '2g') return icon === 'E' ? '8PSK' : 'GMSK'
  if (gen === '3g') return icon === 'H+' ? '64-QAM' : icon === 'H' ? '16-QAM' : 'QPSK'
  if (margin < 6) return 'QPSK'
  if (margin < 14) return '16-QAM'
  if (margin < 22) return '64-QAM'
  return '256-QAM'
}

function iconFor(gen: Gen, margin: number, tower: Tower, lteLabel: '4g' | 'lte'): Exclude<NetIcon, 'none'> {
  if (gen === '5g') return tower.band5g === 'high' ? '5G+' : '5G'
  if (gen === '4g') {
    const plus = tower.aggregation && margin >= 15
    return lteLabel === 'lte' ? (plus ? 'LTE+' : 'LTE') : plus ? '4G+' : '4G'
  }
  if (gen === '3g') return margin >= 20 ? 'H+' : margin >= 10 ? 'H' : '3G'
  return margin >= 10 ? 'E' : 'G'
}

/**
 * What a phone at (x, y) gets: it uses the newest generation it can hear well
 * enough (a few dB above the edge), from the tower that gives it the strongest signal.
 */
export function serviceAt(
  x: number,
  y: number,
  towers: Tower[],
  buildings: Building[],
  lteLabel: '4g' | 'lte' = '4g',
): Service {
  let best: { tower: Tower; gen: Gen; dbm: number; margin: number; km: number; walls: number } | null = null
  for (const tower of towers) {
    if (!tower.on) continue
    const km = Math.hypot(tower.x - x, tower.y - y)
    const walls = wallsBetween(tower.x, tower.y, x, y, buildings)
    for (const gen of tower.gens) {
      const mhz = mhzOf(gen, tower)
      const gain = TOWER_GAIN + beamGain(gen, tower)
      // what the phone hears from the tower …
      const dbm = receivedDbm({ tx: TOWER_DBM, gain, mhz, km, walls })
      // … and what the tower hears from the phone, which sends far weaker (towers listen about 6 dB better)
      const up = receivedDbm({ tx: RADIO[gen].phoneDbm, gain, mhz, km, walls })
      const sensitivity = sensitivityOf(gen, tower)
      // a call needs both directions: the weaker one decides
      const margin = Math.min(dbm - sensitivity, up - (sensitivity - 6))
      if (margin < 3) continue
      const better =
        !best || RANK[gen] > RANK[best.gen] || (RANK[gen] === RANK[best.gen] && dbm > best.dbm)
      if (better) best = { tower, gen, dbm, margin, km, walls }
    }
  }
  if (!best) {
    return { tower: null, gen: null, icon: 'none', dbm: -140, margin: -40, bars: 0, mbps: 0, modulation: '', km: 0, walls: 0 }
  }
  const icon = iconFor(best.gen, best.margin, best.tower, lteLabel)
  const scale = Math.min(1, Math.max(0.2, 0.2 + best.margin / 35))
  return {
    tower: best.tower,
    gen: best.gen,
    icon,
    dbm: best.dbm,
    margin: best.margin,
    bars: barsOf(best.margin),
    mbps: SPEED[icon] * scale,
    modulation: modulationFor(best.gen, best.margin, icon),
    km: best.km,
    walls: best.walls,
  }
}

/** Seconds to download `megabytes` at `mbps`. */
export const downloadSeconds = (megabytes: number, mbps: number) => (mbps > 0 ? (megabytes * 8) / mbps : Number.POSITIVE_INFINITY)

/* ───────────────────────── the generations, in numbers ───────────────────────── */

export type GenerationId = '1g' | '2g' | '3g' | '4g' | '5g' | '6g'

export type Generation = {
  id: GenerationId
  year: number
  /** how the air is shared between users */
  access: 'FDMA' | 'TDMA' | 'CDMA' | 'OFDMA' | '?'
  standards: string
  modulation: string
  /** a typical real-world download speed, Mbit/s (0 for voice only) */
  typical: number
  /** the fastest the standard allows, Mbit/s */
  peak: number
  /** round-trip delay, ms */
  latency: number
  /** the letters a phone shows for it */
  icons: string[]
}

export const GENERATIONS: Generation[] = [
  { id: '1g', year: 1979, access: 'FDMA', standards: 'AMPS · NMT · TACS', modulation: 'FM', typical: 0, peak: 0, latency: 0, icons: [] },
  { id: '2g', year: 1991, access: 'TDMA', standards: 'GSM · GPRS · EDGE', modulation: 'GMSK · 8PSK', typical: 0.1, peak: 0.47, latency: 600, icons: ['G', 'E'] },
  { id: '3g', year: 2001, access: 'CDMA', standards: 'UMTS (WCDMA) · HSPA · HSPA+', modulation: 'QPSK · 16-QAM · 64-QAM', typical: 5, peak: 42, latency: 100, icons: ['3G', 'H', 'H+'] },
  { id: '4g', year: 2009, access: 'OFDMA', standards: 'LTE · LTE-Advanced', modulation: 'QPSK … 256-QAM', typical: 50, peak: 1000, latency: 30, icons: ['4G', 'LTE', '4G+', 'LTE+'] },
  { id: '5g', year: 2019, access: 'OFDMA', standards: '5G NR (NSA · SA)', modulation: 'QPSK … 256-QAM', typical: 450, peak: 20000, latency: 8, icons: ['5G', '5G+'] },
  { id: '6g', year: 2030, access: '?', standards: '—', modulation: '—', typical: 0, peak: 0, latency: 0, icons: [] },
]
