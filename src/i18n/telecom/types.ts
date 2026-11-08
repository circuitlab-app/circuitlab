import type { Scheme } from '@/telecom/modulation'
import type { MarkerId, RegionId } from '@/telecom/physics'
import type { Form, Hop, Note, PartKind, Phase, Problem, ZoneKey } from '@/telecom/parts'
import type { Band5g, GenerationId, NetIcon, RadioTech, Tech } from '@/telecom/radio'
import type { Mode, Panel } from '@/telecom/store'

export type WaveCardId =
  | 'anatomy'
  | 'light'
  | 'spectrum'
  | 'em'
  | 'inverse'
  | 'snell'
  | 'diffraction'
  | 'interference'
  | 'doppler'
  | 'fourier'
  | 'sampling'
  | 'shannon'
  | 'beam'

/** One card of the Waves section: its title, the law's name, what it says and why phones care. */
export type WaveCard = { title: string; law: string; text: string; why: string }

/** What a step of the call is about, for the words that explain it. */
export type HopContext = { hop: Hop; tech: Tech; radio: RadioTech; km?: number; walls?: number }

/** Every word of the Telecom Lab, in one language. Standards and units (GSM, LTE, dBm, MHz) stay as written. */
export type TelecomBook = {
  title: string
  modes: Record<Mode, string>
  techs: Record<Tech, string>
  forms: Record<Form, { name: string; hint: string }>
  parts: Record<PartKind, { name: string; does: string; inside: string }>
  zones: Record<ZoneKey, string>
  /** "3 walls" */
  walls: (n: number) => string

  call: {
    tech: string
    call: string
    pause: string
    again: string
    prev: string
    next: string
    reset: string
    panels: Record<Panel, string>
    ok: string
    failed: string
    pick: string
    phases: Record<Phase, string>
    /** what happens in each phase before the voice flows */
    say: Record<Exclude<Phase, 'talk' | 'fail'>, (tech: Tech, radio: RadioTech) => string>
    /** what one part does to the voice on its way */
    hop: (ctx: HopContext) => string
    problem: (p: Problem, name: (kind: PartKind) => string) => string
    note: (n: Note) => string
    signal: (dbm: number, bars: number) => string
    length: string
    working: string
    remove: string
    takesGives: string
    trayHint: string
    connectHint: string
  }

  scope: {
    scheme: string
    schemes: Record<Scheme, { name: string; used: string }>
    text: string
    snr: string
    snrHint: string
    noise: string
    message: string
    carrier: string
    signal: string
    constellation: string
    sent: string
    received: string
    errors: (wrong: number, total: number) => string
    bitsPerSymbol: (n: number) => string
    speed: (mbps: number) => string
    analog: string
    tip: string
  }

  map: {
    hint: string
    phone: string
    noService: string
    serving: string
    distance: string
    walls: string
    signal: string
    speed: string
    modulation: string
    song: (time: string) => string
    tower: string
    gens: string
    band: string
    bands: Record<Band5g, string>
    aggregation: string
    on: string
    add: string
    remove: string
    reset: string
    walk: string
    stopWalk: string
    lteLabel: string
    legend: string
    handovers: string
    handover: (from: string, to: string) => string
    none: string
    icons: Record<NetIcon, string>
  }

  waves: {
    intro: string
    why: string
    cards: Record<WaveCardId, WaveCard>
    labels: {
      frequency: string
      amplitude: string
      wavelength: string
      period: string
      speed: string
      slow: string
      halfWave: string
      quarterWave: string
      photon: string
      ionising: string
      nonIonising: string
      electric: string
      magnetic: string
      vertical: string
      horizontal: string
      distance: string
      received: string
      freeSpace: string
      city: string
      angle: string
      top: string
      bottom: string
      critical: string
      tir: string
      reflected: string
      refracted: string
      gap: string
      phase: string
      waveA: string
      waveB: string
      sum: string
      constructive: string
      destructive: string
      spacing: string
      ahead: string
      behind: string
      harmonics: string
      time: string
      spectrum: string
      signal: string
      sampleRate: string
      alias: string
      faithful: string
      bandwidth: string
      snr: string
      capacity: string
      efficiency: string
      elements: string
      steer: string
    }
    refs: Record<'field' | 'bus' | 'person' | 'phone' | 'coin' | 'grain', string>
    regions: Record<RegionId, string>
    markers: Record<MarkerId, string>
    media: Record<'air' | 'water' | 'glass' | 'core' | 'cladding', string>
    dopplerCases: { car: string; train: string; satellite: string }
    db: { title: string; rows: { db: string; text: string }[] }
  }

  guide: {
    sections: { phone: string; gens: string; icons: string; speeds: string; terms: string }
    phone: {
      intro: string
      steps: { title: string; text: string }[]
      keypad: string
      keypadHint: string
      tones: { dial: string; busy: string; ringback: string }
    }
    gens: Record<GenerationId, { name: string; what: string; how: string; news: string }>
    access: Record<'FDMA' | 'TDMA' | 'CDMA' | 'OFDMA', string>
    accessTitle: string
    labels: {
      year: string
      standards: string
      access: string
      modulation: string
      typical: string
      peak: string
      latency: string
      icons: string
      future: string
    }
    icons: { icon: string; text: string }[]
    speedsHint: string
    song: (time: string) => string
    terms: { term: string; text: string }[]
    model: string
  }
}
