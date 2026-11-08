import { barsOf, NO_AMP_DBM, NO_LNA_DB, radioOf, receivedDbm, TOWER_DBM, TOWER_GAIN, type Bars, type Tech } from './radio'

/*
 * The parts of a phone call and what each one does to the signal.
 *
 * A call is a chain of parts from a microphone to a speaker. Every part takes
 * the signal in one form and hands it on in another: the microphone turns
 * sound into an analog voltage, the ADC turns that into bits, the modulator
 * puts the bits on a radio frequency, the antenna sends it into the air as a
 * radio wave, the tower passes it to the network as light in a fibre, and so
 * on back to sound. A part that receives the wrong form (an antenna fed bits,
 * with no modulator before it) stops the call there, and the page says why.
 */

/** What the signal is on each wire. */
export type Form = 'analog' | 'digital' | 'rf' | 'radio' | 'light'

export const FORMS: Form[] = ['analog', 'digital', 'rf', 'radio', 'light']

export type PartKind =
  | 'mic'
  | 'adc'
  | 'codec'
  | 'modulator'
  | 'amplifier'
  | 'antenna'
  | 'air'
  | 'tower'
  | 'fiber'
  | 'core'
  | 'demodulator'
  | 'dac'
  | 'speaker'
  | 'copper'
  | 'exchange'

/** The parts tray, in the order a signal meets them. */
export const PART_KINDS: PartKind[] = [
  'mic',
  'adc',
  'codec',
  'modulator',
  'amplifier',
  'antenna',
  'air',
  'tower',
  'fiber',
  'core',
  'demodulator',
  'dac',
  'speaker',
  'copper',
  'exchange',
]

/** What each part turns its input into ([in, out]); parts with two rows work in both directions. */
export const CONVERTS: Record<PartKind, [Form | null, Form | null][]> = {
  mic: [[null, 'analog']],
  adc: [['analog', 'digital']],
  codec: [['digital', 'digital']],
  modulator: [['digital', 'rf']],
  amplifier: [['rf', 'rf']],
  antenna: [
    ['rf', 'radio'],
    ['radio', 'rf'],
  ],
  air: [['radio', 'radio']],
  tower: [
    ['radio', 'light'],
    ['light', 'radio'],
  ],
  fiber: [['light', 'light']],
  core: [['light', 'light']],
  demodulator: [['rf', 'digital']],
  dac: [['digital', 'analog']],
  speaker: [['analog', null]],
  copper: [['analog', 'analog']],
  exchange: [
    ['analog', 'light'],
    ['light', 'analog'],
  ],
}

/** Parts with a length the reader can change, and its starting value in km. */
export const LENGTH: Partial<Record<PartKind, { km: number; max: number }>> = {
  air: { km: 1, max: 40 },
  fiber: { km: 30, max: 500 },
  copper: { km: 3, max: 12 },
}

/** A copper pair loses too much of the voice beyond this, without line amplifiers. */
export const COPPER_MAX_KM = 8

export type PartData = {
  kind: PartKind
  /** switched off, unplugged or cut */
  off?: boolean
  km?: number
  /** walls between the two antennas (air only) */
  walls?: number
  /** on the way back: the signal enters on the right and leaves on the left */
  flip?: boolean
}

export type ChainNode = { id: string; data: PartData }
export type ChainEdge = { source: string; target: string }

/* ───────────────────────── following a call ───────────────────────── */

export type Problem =
  | { code: 'noMic' }
  | { code: 'wrongInput'; kind: PartKind; got: Form; wants: Form[] }
  | { code: 'off'; kind: PartKind }
  | { code: 'deadEnd'; kind: PartKind; form: Form }
  | { code: 'loop'; kind: PartKind }
  | { code: 'noSignal'; dbm: number; need: number; km: number }
  | { code: 'noCore' }
  | { code: 'longLine'; km: number }

export type Note = { code: 'noCodec' } | { code: 'weak'; dbm: number } | { code: 'noAmp' } | { code: 'noLna' }

export type Hop = {
  id: string
  kind: PartKind
  from: Form | null
  to: Form | null
  /** the air: the signal strength at the receiving end */
  dbm?: number
  bars?: Bars
  /** where the call stopped */
  bad?: boolean
}

/** What kind of call the chain makes: through exchanges, through towers, or radio to radio. */
export type Route = 'landline' | 'mobile' | 'direct' | 'other'

export type Trace = {
  ok: boolean
  hops: Hop[]
  problem?: Problem
  notes: Note[]
  route: Route
}

function routeOf(kinds: PartKind[]): Route {
  if (kinds.includes('tower')) return 'mobile'
  if (kinds.includes('exchange')) return 'landline'
  if (kinds.includes('air')) return 'direct'
  return 'other'
}

/**
 * Follows the signal from the microphone along the wires, part by part, and
 * stops at the first part that cannot take what it is given.
 */
export function traceCall(nodes: ChainNode[], edges: ChainEdge[], tech: Tech): Trace {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const next = new Map<string, string>()
  for (const e of edges) if (!next.has(e.source) && byId.has(e.target)) next.set(e.source, e.target)
  const radio = radioOf(tech)

  const mic = nodes.find((n) => n.data.kind === 'mic')
  if (!mic) return { ok: false, hops: [], problem: { code: 'noMic' }, notes: [], route: 'other' }

  const hops: Hop[] = []
  const notes: Note[] = []
  const seen = new Set<string>()
  const finish = (problem?: Problem): Trace => {
    if (problem && hops.length) hops[hops.length - 1].bad = true
    const kinds = hops.map((h) => h.kind)
    if (!problem) {
      // a digital voice sent over radio with no codec takes five times the room in the air
      const adc = kinds.indexOf('adc')
      const mod = kinds.indexOf('modulator')
      if (adc >= 0 && mod > adc && !kinds.slice(adc, mod).includes('codec')) notes.push({ code: 'noCodec' })
    }
    return { ok: !problem, hops, problem, notes, route: routeOf(kinds) }
  }

  let node: ChainNode = mic
  let form: Form | null = null
  // a tower handed the call to the network; another tower may only take it back after the core
  let awaitingCore = false

  for (;;) {
    const { kind } = node.data
    if (seen.has(node.id)) return finish({ code: 'loop', kind })
    seen.add(node.id)

    const row = CONVERTS[kind].find(([input]) => input === form)
    if (!row) {
      hops.push({ id: node.id, kind, from: form, to: null })
      const wants = CONVERTS[kind].map(([input]) => input).filter((f): f is Form => f !== null)
      return finish({ code: 'wrongInput', kind, got: form ?? 'analog', wants })
    }
    const hop: Hop = { id: node.id, kind, from: form, to: row[1] }
    hops.push(hop)
    if (node.data.off) return finish({ code: 'off', kind })

    if (kind === 'copper') {
      const km = node.data.km ?? LENGTH.copper!.km
      if (km > COPPER_MAX_KM) return finish({ code: 'longLine', km })
    }
    if (kind === 'tower') {
      if (form === 'radio') awaitingCore = true
      else if (awaitingCore) return finish({ code: 'noCore' })
    }
    if (kind === 'core') awaitingCore = false

    if (kind === 'air') {
      // who sends: a tower, or a phone's antenna (strong with an amplifier before it)
      const prev = hops[hops.length - 2]
      const beforePrev = hops[hops.length - 3]
      const fromTower = prev?.kind === 'tower'
      const amplified = prev?.kind === 'antenna' && beforePrev?.kind === 'amplifier'
      const tx = fromTower ? TOWER_DBM + TOWER_GAIN : amplified ? radio.phoneDbm : NO_AMP_DBM
      if (prev?.kind === 'antenna' && !amplified) notes.push({ code: 'noAmp' })
      // who listens: a tower, or a phone's antenna (better with a low-noise amplifier after it)
      const rxId = next.get(node.id)
      const rx = rxId ? byId.get(rxId) : undefined
      const afterRx = rx ? byId.get(next.get(rx.id) ?? '') : undefined
      const toTower = rx?.data.kind === 'tower'
      const lna = rx?.data.kind === 'antenna' && afterRx?.data.kind === 'amplifier'
      if (rx?.data.kind === 'antenna' && !lna) notes.push({ code: 'noLna' })
      const km = node.data.km ?? LENGTH.air!.km
      // a 5G tower aims a beam at the phone (massive MIMO), both ways
      const beam = tech === '5g' && (toTower || fromTower) ? 8 : 0
      const dbm = receivedDbm({
        tx,
        gain: (toTower && !fromTower ? TOWER_GAIN : 0) + beam,
        mhz: radio.mhz,
        km,
        walls: node.data.walls ?? 0,
      })
      const need = radio.sensitivity + (rx?.data.kind === 'antenna' && !lna ? NO_LNA_DB : 0)
      hop.dbm = dbm
      hop.bars = barsOf(dbm - need)
      if (dbm < need) return finish({ code: 'noSignal', dbm, need, km })
      if (dbm - need < 10) notes.push({ code: 'weak', dbm })
    }

    form = row[1]
    if (form === null) return finish()
    const target = next.get(node.id)
    const following = target ? byId.get(target) : undefined
    if (!following) return finish({ code: 'deadEnd', kind, form })
    node = following
  }
}

/* ───────────────────────── the call, step by step ───────────────────────── */

export type Phase = 'offhook' | 'dial' | 'ring' | 'setup' | 'page' | 'push' | 'talk' | 'fail'

/** One step of the call: the hops from `from` to `to` are lit; `hop` is the one being explained. */
export type Step = { phase: Phase; from: number; to: number; hop?: number }

export function callSteps(trace: Trace): Step[] {
  const n = trace.hops.length
  if (!n) return [{ phase: 'fail', from: 0, to: -1 }]
  const talk = (upTo: number): Step[] =>
    Array.from({ length: upTo + 1 }, (_, i) => ({ phase: 'talk' as const, from: 0, to: i, hop: i }))
  if (!trace.ok) return [...talk(n - 1), { phase: 'fail', from: 0, to: n - 1, hop: n - 1 }]
  const kinds = trace.hops.map((h) => h.kind)
  if (trace.route === 'landline') {
    const exchange = kinds.indexOf('exchange')
    return [
      { phase: 'offhook', from: 0, to: exchange },
      { phase: 'dial', from: 0, to: exchange },
      { phase: 'ring', from: exchange, to: n - 1 },
      ...talk(n - 1),
    ]
  }
  if (trace.route === 'mobile') {
    const core = kinds.indexOf('core')
    const middle = core >= 0 ? core : kinds.indexOf('tower')
    return [
      { phase: 'setup', from: 0, to: middle },
      { phase: 'page', from: middle, to: n - 1 },
      ...talk(n - 1),
    ]
  }
  if (trace.route === 'direct') return [{ phase: 'push', from: 0, to: 0 }, ...talk(n - 1)]
  return talk(n - 1)
}

/* ───────────────────────── ready-made chains ───────────────────────── */

export type ZoneKey = 'phoneA' | 'phoneB' | 'network' | 'line' | 'air'

export type PresetPart = { id: string; data: PartData; x: number; y: number }
export type Zone = { key: ZoneKey; x: number; y: number; w: number; h: number }
export type Preset = { parts: PresetPart[]; edges: ChainEdge[]; zones: Zone[] }

export const CARD = { w: 168, h: 96, gapX: 46, gapY: 120 }

type Part = PartKind | [PartKind, Partial<PartData>]
type Row = 'there' | 'middle' | 'back'
/** A labelled area behind some parts: [zone, [row, first, last] …]; all pieces make one box. */
type ZoneSpec = [ZoneKey, [Row, number, number][]]

/** The chain for each technology: there (top row), through the network (right), back (bottom row). */
function chainOf(tech: Tech): { there: Part[]; middle: Part[]; back: Part[]; zones: ZoneSpec[] } {
  if (tech === 'landline') {
    return {
      there: ['mic', ['copper', { km: 2 }], 'exchange'],
      middle: [['fiber', { km: 40 }]],
      back: ['exchange', ['copper', { km: 3 }], 'speaker'],
      zones: [
        ['phoneA', [['there', 0, 0]]],
        ['line', [['there', 1, 1]]],
        ['network', [['there', 2, 2], ['middle', 0, 0], ['back', 0, 0]]],
        ['line', [['back', 1, 1]]],
        ['phoneB', [['back', 2, 2]]],
      ],
    }
  }
  const phoneOut: Part[] = ['mic', 'adc', 'codec', 'modulator', 'amplifier', 'antenna']
  const phoneIn: Part[] = ['antenna', 'amplifier', 'demodulator', 'codec', 'dac', 'speaker']
  if (tech === 'walkie') {
    return {
      there: [...phoneOut, ['air', { km: 2 }]],
      middle: [],
      back: phoneIn,
      zones: [
        ['phoneA', [['there', 0, 5]]],
        ['air', [['there', 6, 6]]],
        ['phoneB', [['back', 0, 5]]],
      ],
    }
  }
  return {
    there: [...phoneOut, ['air', { km: 1.2 }], 'tower'],
    middle: [['fiber', { km: 30 }], 'core', ['fiber', { km: 30 }]],
    back: ['tower', ['air', { km: 0.8, walls: 1 }], ...phoneIn],
    zones: [
      ['phoneA', [['there', 0, 5]]],
      ['air', [['there', 6, 6]]],
      ['network', [['there', 7, 7], ['middle', 0, 2], ['back', 0, 0]]],
      ['air', [['back', 1, 1]]],
      ['phoneB', [['back', 2, 7]]],
    ],
  }
}

export function presetFor(tech: Tech): Preset {
  const { there, middle, back, zones } = chainOf(tech)
  const count = new Map<PartKind, number>()
  const make = (p: Part, x: number, y: number, flip: boolean): PresetPart => {
    const [kind, extra] = Array.isArray(p) ? p : [p, {}]
    const n = (count.get(kind) ?? 0) + 1
    count.set(kind, n)
    return { id: `${kind}-${n}`, data: { kind, ...extra, flip }, x, y }
  }
  const stepX = CARD.w + CARD.gapX
  const stepY = CARD.h + 24
  const lastX = (there.length - 1) * stepX
  // the network hangs down the right side, so the way back runs right to left underneath
  const backY = Math.max(CARD.h + CARD.gapY, (middle.length + 1) * stepY)
  const rows: Record<Row, PresetPart[]> = {
    there: there.map((p, i) => make(p, i * stepX, 0, false)),
    middle: middle.map((p, i) => make(p, lastX + stepX, ((i + 1) * backY) / (middle.length + 1), false)),
    back: [],
  }
  rows.back = back.map((p, i) => make(p, lastX - i * stepX, backY, true))
  const parts = [...rows.there, ...rows.middle, ...rows.back]
  const edges: ChainEdge[] = parts.slice(1).map((p, i) => ({ source: parts[i].id, target: p.id }))

  const PAD = 14
  const zoneList: Zone[] = zones.flatMap(([key, pieces]) => {
    const members = pieces.flatMap(([row, a, b]) => rows[row].slice(a, b + 1))
    if (!members.length) return []
    const x0 = Math.min(...members.map((m) => m.x)) - PAD
    const y0 = Math.min(...members.map((m) => m.y)) - PAD - 18
    const x1 = Math.max(...members.map((m) => m.x)) + CARD.w + PAD
    const y1 = Math.max(...members.map((m) => m.y)) + CARD.h + PAD
    return [{ key, x: x0, y: y0, w: x1 - x0, h: y1 - y0 }]
  })
  return { parts, edges, zones: zoneList }
}
