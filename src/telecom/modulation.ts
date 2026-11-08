/*
 * Modulation: how bits ride on a radio wave.
 *
 * Text becomes bytes (UTF-8, so Persian and Arabic work too), bytes become
 * bits, groups of bits become symbols, and each symbol is a point on the
 * constellation: a carrier wave with a certain strength (amplitude) and
 * timing (phase). Noise on the way moves the points; the receiver picks the
 * nearest point, and when noise has pushed a point past its neighbour the
 * wrong bits come out. The more bits a symbol carries (256-QAM: 8), the
 * faster the link and the closer the points, so the cleaner the signal must be.
 * AM and FM carry a sound wave itself, with no bits.
 */

export type Scheme = 'am' | 'fm' | 'ask' | 'fsk' | 'bpsk' | 'qpsk' | '8psk' | '16qam' | '64qam' | '256qam'

export const SCHEMES: Scheme[] = ['am', 'fm', 'ask', 'fsk', 'bpsk', 'qpsk', '8psk', '16qam', '64qam', '256qam']

/** Bits per symbol (0 for the analog schemes). */
export const BITS: Record<Scheme, number> = {
  am: 0,
  fm: 0,
  ask: 1,
  fsk: 1,
  bpsk: 1,
  qpsk: 2,
  '8psk': 3,
  '16qam': 4,
  '64qam': 6,
  '256qam': 8,
}

export const isAnalog = (scheme: Scheme) => BITS[scheme] === 0

export type Point = { i: number; q: number }

const gray = (n: number) => n ^ (n >> 1)

/** The constellation: the point for each symbol value, Gray-coded so neighbours differ in one bit, average power 1. */
export function constellation(scheme: Scheme): Point[] {
  const bits = BITS[scheme]
  const m = 2 ** bits
  if (scheme === 'ask') return [{ i: 0, q: 0 }, { i: Math.SQRT2, q: 0 }]
  // FSK: two tones; shown as two axes (energy at tone 1, energy at tone 2)
  if (scheme === 'fsk') return [{ i: 1, q: 0 }, { i: 0, q: 1 }]
  if (scheme === 'bpsk') return [{ i: 1, q: 0 }, { i: -1, q: 0 }]
  const points: Point[] = Array(m)
  if (scheme === 'qpsk' || scheme === '8psk') {
    const offset = scheme === 'qpsk' ? Math.PI / 4 : 0
    for (let p = 0; p < m; p++) {
      const angle = offset + (2 * Math.PI * p) / m
      points[gray(p)] = { i: Math.cos(angle), q: Math.sin(angle) }
    }
    return points
  }
  // square QAM: half the bits pick the column, half the row, each Gray-coded
  const side = 2 ** (bits / 2)
  const scale = Math.sqrt((2 * (m - 1)) / 3)
  for (let col = 0; col < side; col++) {
    for (let row = 0; row < side; row++) {
      const value = (gray(col) << (bits / 2)) | gray(row)
      points[value] = { i: (2 * col - (side - 1)) / scale, q: (2 * row - (side - 1)) / scale }
    }
  }
  return points
}

export function textToBits(text: string): number[] {
  const bits: number[] = []
  for (const byte of new TextEncoder().encode(text)) for (let b = 7; b >= 0; b--) bits.push((byte >> b) & 1)
  return bits
}

export function bitsToText(bits: number[]): string {
  const bytes = new Uint8Array(Math.floor(bits.length / 8))
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0
    for (let b = 0; b < 8; b++) byte = (byte << 1) | (bits[i * 8 + b] ?? 0)
    bytes[i] = byte
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

/** A small seeded random generator, so the same settings always show the same noise. */
export function random(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  /** a normally distributed number (Box–Muller) */
  const gauss = () => Math.sqrt(-2 * Math.log(next() || 1e-12)) * Math.cos(2 * Math.PI * next())
  return { next, gauss }
}

export type SentSymbol = { value: number; sent: Point; got: Point; decided: number; bits: number[]; ok: boolean }

export type Transmission = {
  scheme: Scheme
  bits: number[]
  symbols: SentSymbol[]
  received: number[]
  errors: number
  text: string
}

/**
 * Sends `text` with `scheme` through noise at `snrDb` (signal-to-noise ratio
 * per symbol) and decodes it again, choosing the nearest constellation point.
 */
export function transmit(text: string, scheme: Scheme, snrDb: number, seed = 1): Transmission {
  const bitsPer = BITS[scheme]
  if (!bitsPer) return { scheme, bits: [], symbols: [], received: [], errors: 0, text: '' }
  const bits = textToBits(text)
  const padded = [...bits, ...Array((bitsPer - (bits.length % bitsPer)) % bitsPer).fill(0)]
  const points = constellation(scheme)
  const sigma = Math.sqrt(1 / (2 * 10 ** (snrDb / 10)))
  const rng = random(seed)
  const symbols: SentSymbol[] = []
  for (let s = 0; s < padded.length; s += bitsPer) {
    const chunk = padded.slice(s, s + bitsPer)
    const value = chunk.reduce((v, b) => (v << 1) | b, 0)
    const sent = points[value]
    const got = { i: sent.i + sigma * rng.gauss(), q: sent.q + sigma * rng.gauss() }
    let decided = 0
    let bestDistance = Number.POSITIVE_INFINITY
    points.forEach((p, v) => {
      const d = (p.i - got.i) ** 2 + (p.q - got.q) ** 2
      if (d < bestDistance) {
        bestDistance = d
        decided = v
      }
    })
    symbols.push({ value, sent, got, decided, bits: chunk, ok: decided === value })
  }
  const received = symbols.flatMap((s) => Array.from({ length: bitsPer }, (_, k) => (s.decided >> (bitsPer - 1 - k)) & 1))
  let errors = 0
  for (let i = 0; i < bits.length; i++) if (received[i] !== bits[i]) errors++
  return { scheme, bits, symbols, received, errors, text: bitsToText(received.slice(0, bits.length)) }
}

/* ───────────────────────── the waves on the scope ───────────────────────── */

export type Waves = {
  /** what is being sent: the voice for AM/FM, the bits (as 0/1 levels) for the rest */
  message: number[]
  carrier: number[]
  /** the carrier after modulation, with the noise of the air */
  signal: number[]
  /** where each symbol starts, as a sample index */
  marks: number[]
}

const VOICE = (t: number) => 0.62 * Math.sin(2 * Math.PI * 1.1 * t) + 0.3 * Math.sin(2 * Math.PI * 2.7 * t + 0.6)

/** The first `count` symbols as waves, `per` samples each, with `cycles` carrier periods per symbol. */
export function waves(tx: Transmission, scheme: Scheme, snrDb: number, count = 12, per = 48, cycles = 3, seed = 7): Waves {
  const rng = random(seed)
  const sigma = Math.sqrt(1 / (2 * 10 ** (snrDb / 10)))
  const message: number[] = []
  const carrier: number[] = []
  const signal: number[] = []
  const marks: number[] = []
  if (isAnalog(scheme)) {
    const total = count * per
    let phase = 0
    for (let n = 0; n < total; n++) {
      const t = n / per / 3
      const m = VOICE(t)
      const c = Math.cos((2 * Math.PI * cycles * n) / per)
      phase += (2 * Math.PI * cycles) / per + (scheme === 'fm' ? (2.2 * m * 2 * Math.PI) / per : 0)
      message.push(m)
      carrier.push(c)
      const s = scheme === 'am' ? (1 + 0.8 * m) * c * 0.56 : Math.cos(phase)
      signal.push(s + sigma * 0.6 * rng.gauss())
    }
    return { message, carrier, signal, marks }
  }
  const shown = tx.symbols.slice(0, count)
  shown.forEach((symbol, k) => {
    marks.push(k * per)
    for (let n = 0; n < per; n++) {
      const angle = (2 * Math.PI * cycles * n) / per
      const level = symbol.bits.reduce((v, b) => v * 2 + b, 0) / Math.max(1, 2 ** symbol.bits.length - 1)
      message.push(level)
      carrier.push(Math.cos(angle))
      let s: number
      if (scheme === 'fsk') s = Math.cos(((symbol.value ? 2 : 1) * 2 * Math.PI * cycles * n) / per)
      else s = symbol.sent.i * Math.cos(angle) - symbol.sent.q * Math.sin(angle)
      signal.push(s / 1.5 + sigma * 0.6 * rng.gauss())
    }
  })
  return { message, carrier, signal, marks }
}
