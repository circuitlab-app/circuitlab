/*
 * The physics behind telecom, as small formulas the Waves section draws:
 * c = f·λ, photon energy, the inverse-square law, Snell's law, the Doppler
 * effect, Fourier series, Nyquist sampling, Shannon's capacity and the beam
 * of an antenna array. SI units throughout (Hz, m, s, W).
 */

/** The speed of light in vacuum, m/s (very nearly the same in air). */
export const C = 299_792_458
/** Planck's constant, J·s */
export const PLANCK = 6.62607015e-34
/** One electronvolt, J */
export const EV = 1.602176634e-19
/** The magnetic and electric constants of vacuum: c = 1/√(μ0·ε0). */
export const MU0 = 1.25663706212e-6
export const EPS0 = 8.8541878128e-12

export const wavelength = (hz: number) => C / hz
export const period = (hz: number) => 1 / hz
/** A photon's energy in electronvolts: E = h·f. */
export const photonEv = (hz: number) => (PLANCK * hz) / EV
/** About this much energy per photon is needed to knock an electron off an atom (ionising). */
export const IONISING_EV = 10

/** Free-space path loss in dB (d in km, f in MHz). */
export const fspl = (mhz: number, km: number) => 32.44 + 20 * Math.log10(mhz) + 20 * Math.log10(km)

export const dbmToWatts = (dbm: number) => 10 ** ((dbm - 30) / 10)
export const wattsToDbm = (w: number) => 10 * Math.log10(w) + 30

/** Snell's law n1·sin θ1 = n2·sin θ2; null when the light is totally reflected. */
export function refract(n1: number, n2: number, degrees: number): { refracted: number | null; critical: number | null } {
  const s = (n1 / n2) * Math.sin((degrees * Math.PI) / 180)
  const critical = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : null
  return { refracted: Math.abs(s) > 1 ? null : (Math.asin(s) * 180) / Math.PI, critical }
}

/** The frequencies heard ahead of and behind a source moving at v through waves of speed c. */
export function doppler(hz: number, v: number, c = C) {
  return { ahead: (hz * c) / (c - v), behind: (hz * c) / (c + v), shift: (hz * v) / c }
}

/** Shannon–Hartley: the most bits per second a channel can carry, C = B·log2(1 + S/N). */
export const capacity = (bandwidthHz: number, snrDb: number) => bandwidthHz * Math.log2(1 + 10 ** (snrDb / 10))

/** The frequency a sampled sine seems to have (folded into 0 … fs/2). */
export function aliasOf(hz: number, sampleRate: number): number {
  const r = ((hz % sampleRate) + sampleRate) % sampleRate
  return r > sampleRate / 2 ? sampleRate - r : r
}

/** The odd harmonics that build a square wave: amplitude 4/(πk) at k·f. */
export const squareHarmonics = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ k: 2 * i + 1, amp: 4 / (Math.PI * (2 * i + 1)) }))

/**
 * How strongly an array of `n` antennas, `spacing` wavelengths apart and
 * phased to aim at `steer` degrees, sends towards `theta` degrees (0–1).
 */
export function arrayFactor(n: number, spacing: number, steer: number, theta: number): number {
  const psi = 2 * Math.PI * spacing * (Math.sin((theta * Math.PI) / 180) - Math.sin((steer * Math.PI) / 180))
  let re = 0
  let im = 0
  for (let k = 0; k < n; k++) {
    re += Math.cos(k * psi)
    im += Math.sin(k * psi)
  }
  return Math.hypot(re, im) / n
}

/* ───────────────────────── the electromagnetic spectrum ───────────────────────── */

export type RegionId = 'radio' | 'microwave' | 'infrared' | 'visible' | 'ultraviolet' | 'xray' | 'gamma'

export const REGIONS: { id: RegionId; from: number; to: number; color: string }[] = [
  { id: 'radio', from: 3e3, to: 3e8, color: '#e59a0b' },
  { id: 'microwave', from: 3e8, to: 3e11, color: '#e0479e' },
  { id: 'infrared', from: 3e11, to: 4e14, color: '#dc2626' },
  { id: 'visible', from: 4e14, to: 7.5e14, color: 'url(#rainbow)' },
  { id: 'ultraviolet', from: 7.5e14, to: 3e16, color: '#7c3aed' },
  { id: 'xray', from: 3e16, to: 3e19, color: '#2563eb' },
  { id: 'gamma', from: 3e19, to: 3e21, color: '#0f766e' },
]

export type MarkerId = 'am' | 'fm' | 'tv' | 'gsm' | 'gps' | 'lte' | 'wifi' | 'nr' | 'mmwave' | 'fiber' | 'light' | 'xray'

export const MARKERS: { id: MarkerId; hz: number }[] = [
  { id: 'am', hz: 1e6 },
  { id: 'fm', hz: 1e8 },
  { id: 'tv', hz: 6e8 },
  { id: 'gsm', hz: 9e8 },
  { id: 'gps', hz: 1.57542e9 },
  { id: 'lte', hz: 1.8e9 },
  { id: 'wifi', hz: 2.4e9 },
  { id: 'nr', hz: 3.5e9 },
  { id: 'mmwave', hz: 2.8e10 },
  { id: 'fiber', hz: C / 1550e-9 },
  { id: 'light', hz: C / 550e-9 },
  { id: 'xray', hz: 3e18 },
]

/* ───────────────────────── writing numbers with SI prefixes ───────────────────────── */

const PREFIXES: [number, string][] = [
  [1e21, 'Z'],
  [1e18, 'E'],
  [1e15, 'P'],
  [1e12, 'T'],
  [1e9, 'G'],
  [1e6, 'M'],
  [1e3, 'k'],
  [1, ''],
  [1e-3, 'm'],
  [1e-6, 'µ'],
  [1e-9, 'n'],
  [1e-12, 'p'],
  [1e-15, 'f'],
]

/** 3.5e9, 'Hz' → "3.5 GHz"; 0.0857, 'm' → "85.7 mm". */
export function si(value: number, unit: string, digits = 3): string {
  if (!Number.isFinite(value) || value === 0) return `0 ${unit}`
  const abs = Math.abs(value)
  const [scale, prefix] = PREFIXES.find(([s]) => abs >= s * 0.9995) ?? PREFIXES[PREFIXES.length - 1]
  const n = value / scale
  const text = Number(n.toPrecision(digits)).toString()
  // centimetres read better than tens of millimetres for lengths
  if (unit === 'm' && prefix === 'm' && abs >= 0.01) return `${Number((value * 100).toPrecision(digits))} cm`
  return `${text} ${prefix}${unit}`
}
