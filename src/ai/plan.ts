import { BOARDS, PARTS, SENSORS, SENSOR_MODES, formatOhms, isBoard, pinModesFor, type BoardType } from '@/circuit/catalog'
import type { PartData, PartType, PinMode } from '@/circuit/types'
import { en } from '@/i18n/en'
import { stripThinking, type ChatMessage } from './ollama'

/*
 * How the AI board talks to a language model, without React or the network:
 *
 *   1. describeBoard   what each pin drives (following the wires through
 *                      resistors, switches and transistors) and what IN reads
 *   2. buildMessages   the rules, the board's facts, the chat so far, the request
 *   3. replyFormat     a JSON schema that only allows each pin's own programs
 *   4. parseReply      the model's answer, with anything unknown dropped
 *   5. applyPins       the new pin programs and the list of what changed
 *
 * The model never runs code: it only picks from the pin programs the
 * simulator already has, and the app checks every pick before using it.
 */

export type PlanPart = { id: string; data: PartData }
export type PlanWire = { source: string; sourceHandle?: string | null; target: string; targetHandle?: string | null }

export type Device = {
  id: string
  type: PartType
  /** an LED's or a lamp's colour */
  color?: string
  /** which of its terminals the pin reaches, for parts with named inputs (R, G, B, OUT …) */
  terminal?: string
  /** in English, for the model: "red LED", "motor", "RGB LED (its red part)" */
  name: string
  /** the same in the app's language, so the model knows the child's own words */
  local: string
  /** what sits between the pin and the part: "220Ω resistor", "transistor" */
  via: string[]
  /** a one-way part whose − end faces the pin, so it cannot work */
  backwards?: boolean
}

export type PinInfo = {
  pin: string
  mode: PinMode
  /** the programs this pin can run */
  modes: PinMode[]
  devices: Device[]
}

export type InputInfo = {
  pin: string
  sensor: Device | null
  /** what IN reads now, as a share (0..1) of the board's volts; null before the board has read it */
  share: number | null
  /** the sensor's own words for the world around it: "24°C", "light 15%" */
  reading: string | null
  /** what a high and a low reading mean with this sensor wired this way: "it is bright" / "it is dark" */
  high: string | null
  low: string | null
}

export type BoardInfo = {
  id: string
  board: BoardType
  pins: PinInfo[]
  input: InputInfo | null
}

export type PinChange = { pin: string; from: PinMode; to: PinMode }

/** Two-legged parts that current flows through on its way to what it powers. */
const PASS_THROUGH = new Set<PartType>([
  'resistor',
  'diode',
  'zener',
  'fuse',
  'switch',
  'button',
  'dimmer',
  'ammeter',
  'ldr',
  'thermistor',
  'tilt',
  'reed',
])

/** Parts a pin switches on with a small current: the pin goes in, the load hangs on the other side. */
const DRIVERS: Partial<Record<PartType, { input: string; outputs: string[] }>> = {
  transistor: { input: 'B', outputs: ['C'] },
  pnp: { input: 'B', outputs: ['C'] },
  mosfet: { input: 'G', outputs: ['D'] },
  optocoupler: { input: 'a', outputs: ['C', 'E'] },
  relay: { input: 'a', outputs: ['COM', 'NO'] },
}

/** Nicer words for the named legs of a few parts. */
const LEG_NAMES: Partial<Record<PartType, Record<string, string>>> = {
  rgbLed: { R: 'its red part', G: 'its green part', B: 'its blue part' },
  trafficLight: { R: 'its red light', Y: 'its yellow light', G: 'its green light' },
  servo: { OUT: 'its signal wire' },
  barGraph: { IN: 'its input' },
}

/** What a high and a low reading on IN mean, for each sensor wired the usual way. */
const SENSE_WORDS: Partial<Record<PartType, [high: string, low: string]>> = {
  ldr: ['it is bright', 'it is dark'],
  thermistor: ['it is hot', 'it is cold'],
  tempSensor: ['it is hot', 'it is cold'],
  ultrasonic: ['something is close', 'nothing is close'],
  pir: ['something moves', 'nothing moves'],
  soundSensor: ['it is loud', 'it is quiet'],
  gasSensor: ['there is smoke or gas', 'the air is clean'],
  soilSensor: ['the soil is wet', 'the soil is dry'],
  touchSensor: ['someone touches it', 'nobody touches it'],
  flameSensor: ['it sees a flame', 'there is no flame'],
  rainSensor: ['it rains', 'it is dry'],
  waterSensor: ['the water is deep', 'the water is low'],
  humiditySensor: ['the air is damp', 'the air is dry'],
  hallSensor: ['a magnet is near', 'no magnet is near'],
  irSensor: ['something is in front of it', 'nothing is in front of it'],
  lineSensor: ['it is over a black line', 'it is over white'],
  forceSensor: ['someone presses it hard', 'nobody presses it'],
  pulseSensor: ['the heart beats', 'it is between two beats'],
  knockSensor: ['someone knocks', 'nobody knocks'],
  switch: ['the switch is on', 'the switch is off'],
  button: ['the button is pressed', 'the button is not pressed'],
  tilt: ['it is tilted', 'it stands straight'],
  reed: ['a magnet is near', 'no magnet is near'],
  potentiometer: ['the knob is turned up', 'the knob is turned down'],
  joystick: ['the stick is pushed one way', 'the stick is pushed the other way'],
}

/** Sensors whose reading flips when they sit between IN and − instead of between + and IN. */
const TWO_LEGGED_SENSORS = new Set<PartType>(['ldr', 'thermistor', 'switch', 'button', 'tilt', 'reed'])

export const LIGHTS = new Set<PartType>(['led', 'lamp', 'rgbLed', 'trafficLight', 'barGraph', 'laser'])
export const MOVERS = new Set<PartType>(['motor', 'fan', 'pump', 'vibration', 'servo', 'solenoid', 'electromagnet'])
export const SOUNDERS = new Set<PartType>(['buzzer', 'speaker', 'bell'])

const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s)

/** A part's everyday English name with its colour: "red LED", "warm lamp", "motor". */
export function englishName(data: PartData): string {
  const name = lowerFirst(en.parts[data.type]?.name ?? data.type)
  if ((data.type === 'led' || data.type === 'lamp') && data.color) {
    return `${en.colors[data.color as keyof typeof en.colors]?.toLowerCase() ?? data.color} ${name}`
  }
  return name
}

const terminalKey = (id: string, handle: string) => `${id}\u0000${handle}`
const splitKey = (key: string) => key.split('\u0000') as [string, string]

/** Which terminals the wires join together. */
function wireGraph(wires: PlanWire[]) {
  const links = new Map<string, string[]>()
  const link = (a: string, b: string) => {
    const list = links.get(a)
    if (list) list.push(b)
    else links.set(a, [b])
  }
  for (const w of wires) {
    if (!w.sourceHandle || !w.targetHandle) continue
    const a = terminalKey(w.source, w.sourceHandle)
    const b = terminalKey(w.target, w.targetHandle)
    link(a, b)
    link(b, a)
  }
  /** every terminal joined to `start` by wires alone, `start` included */
  return (start: string): string[] => {
    const seen = new Set([start])
    const queue = [start]
    while (queue.length > 0) {
      for (const next of links.get(queue.pop()!) ?? []) {
        if (!seen.has(next)) {
          seen.add(next)
          queue.push(next)
        }
      }
    }
    return [...seen]
  }
}

export type DescribeOptions = {
  /** the volts the board last read on its input */
  inputVolts?: number
  /** a part's name in the app's language */
  local?: (data: PartData) => string
}

/** Everything the model needs to know about one board: its pins, what they drive and what IN reads. */
export function describeBoard(
  boardId: string,
  parts: PlanPart[],
  wires: PlanWire[],
  options: DescribeOptions = {},
): BoardInfo | null {
  const board = parts.find((p) => p.id === boardId)
  if (!board || !isBoard(board.data.type)) return null
  const type = board.data.type
  const spec = BOARDS[type]
  const byId = new Map(parts.map((p) => [p.id, p]))
  const joined = wireGraph(wires)
  const local = options.local ?? englishName

  const isPower = (t: PartType) => PARTS[t].category === 'power' || isBoard(t)
  const polarityAt = (key: string) => {
    const [id, handle] = splitKey(key)
    const part = byId.get(id)
    if (!part || !isPower(part.data.type)) return undefined
    return PARTS[part.data.type].terminals[handle]?.polarity
  }

  const device = (part: PlanPart, handle: string, via: string[], driven: boolean, legs = true): Device => {
    const t = part.data.type
    const terminals = PARTS[t].terminals
    const named = legs && (Object.keys(terminals).length > 2 || !['a', 'b'].includes(handle))
    const leg = named ? (LEG_NAMES[t]?.[handle] ?? `its ${terminals[handle]?.label ?? handle} leg`) : null
    const color = t === 'led' || t === 'lamp' ? (part.data.color as string | undefined) : undefined
    return {
      id: part.id,
      type: t,
      ...(color ? { color } : {}),
      ...(named ? { terminal: handle } : {}),
      name: leg ? `${englishName(part.data)} (${leg})` : englishName(part.data),
      local: local(part.data),
      via,
      ...(!driven && handle === 'b' && terminals.a?.polarity === '+' ? { backwards: true } : {}),
    }
  }

  const viaName = (part: PlanPart) =>
    part.data.type === 'resistor' ? `${formatOhms(part.data.resistance ?? 100)} resistor` : englishName(part.data)

  /** The parts a pin powers: wire by wire, through resistors and switches, past a transistor to its load. */
  const devicesFrom = (pin: string): Device[] => {
    const found: Device[] = []
    const seen = new Set<string>([boardId])
    const visit = (from: string, via: string[], driven: boolean, depth: number) => {
      for (const key of joined(from)) {
        if (key === from) continue
        const [id, handle] = splitKey(key)
        const part = byId.get(id)
        if (!part || seen.has(id)) continue
        seen.add(id)
        const t = part.data.type
        if (isPower(t)) continue
        const driver = DRIVERS[t]
        if (driver) {
          if (handle === driver.input && depth < 5) {
            for (const out of driver.outputs) visit(terminalKey(id, out), [...via, viaName(part)], true, depth + 1)
          }
          continue
        }
        if (PASS_THROUGH.has(t) && (handle === 'a' || handle === 'b')) {
          if (depth < 5) visit(terminalKey(id, handle === 'a' ? 'b' : 'a'), [...via, viaName(part)], driven, depth + 1)
          continue
        }
        found.push(device(part, handle, via, driven))
      }
    }
    visit(terminalKey(boardId, pin), [], false, 0)
    return found
  }

  const describeInput = (): InputInfo | null => {
    if (!spec.input) return null
    const start = terminalKey(boardId, spec.input)
    let sensor: Device | null = null
    let words: [string, string] | null = null
    let reading: string | null = null
    for (const key of joined(start)) {
      if (key === start) continue
      const [id, handle] = splitKey(key)
      const part = byId.get(id)
      if (!part || id === boardId) continue
      const t = part.data.type
      const sense = part.data.sense ?? 0
      const module = SENSORS[t]
      if (module?.signal && handle === 'OUT') {
        sensor = device(part, handle, [], true, false)
        words = SENSE_WORDS[t] ?? ['the sensor reads high', 'the sensor reads low']
        reading = module.format?.(sense) ?? (module.digital ? (sense > 0.5 ? 'on' : 'off') : `${Math.round(sense * 100)}%`)
        break
      }
      if (TWO_LEGGED_SENSORS.has(t) && (handle === 'a' || handle === 'b')) {
        // between + and IN a sensor pulls IN up as it lets more through; between IN and − it pulls it down
        const far = joined(terminalKey(id, handle === 'a' ? 'b' : 'a')).map(polarityAt)
        const flipped = far.includes('-') && !far.includes('+')
        const [high, low] = SENSE_WORDS[t]!
        sensor = device(part, handle, [], true, false)
        words = flipped ? [low, high] : [high, low]
        reading =
          t === 'ldr'
            ? `light ${Math.round((part.data.light ?? 0.6) * 100)}%`
            : t === 'thermistor'
              ? (SENSORS.thermistor.format?.(part.data.sense ?? 0.42) ?? null)
              : t === 'switch'
                ? part.data.closed
                  ? 'on'
                  : 'off'
                : t === 'button'
                  ? part.data.pressed
                    ? 'pressed'
                    : 'not pressed'
                  : sense > 0.5
                    ? 'on'
                    : 'off'
        break
      }
      if ((t === 'potentiometer' && handle === 'W') || (t === 'joystick' && (handle === 'X' || handle === 'Y'))) {
        sensor = device(part, handle, [], true, false)
        words = SENSE_WORDS[t]!
        reading = `${Math.round(((t === 'joystick' ? (handle === 'X' ? part.data.stickX : part.data.stickY) : part.data.level) ?? 0.5) * 100)}%`
        break
      }
    }
    const volts = options.inputVolts
    return {
      pin: spec.input,
      sensor,
      share: volts === undefined || !Number.isFinite(volts) ? null : Math.min(1, Math.max(0, volts / spec.voltage)),
      reading,
      high: words?.[0] ?? null,
      low: words?.[1] ?? null,
    }
  }

  const pins = (board.data.pins ?? {}) as Record<string, PinMode>
  return {
    id: boardId,
    board: type,
    pins: spec.pins.map((pin) => ({
      pin,
      mode: pins[pin] ?? 'off',
      modes: pinModesFor(type, pin),
      devices: devicesFrom(pin),
    })),
    input: describeInput(),
  }
}

const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

function deviceText(d: Device) {
  const local = d.local && d.local !== d.name ? ` ("${d.local}")` : ''
  const via = d.via.length > 0 ? ` through a ${list(d.via)}` : ''
  const wrong = d.backwards ? ', but it is put in the wrong way round, so it cannot work' : ''
  return `${d.name}${local}${via}${wrong}`
}

/** The board as short English facts, one line per pin and one for IN. */
export function boardFacts(info: BoardInfo): string {
  const lines = info.pins.map((p) => {
    const what = p.devices.length > 0 ? p.devices.map(deviceText).join(', and ') : 'nothing is connected (leave this pin alone)'
    return `- ${p.pin} → ${what}. Set to: ${p.mode}.`
  })
  const input = info.input
  if (input) {
    if (!input.sensor) {
      lines.push(`- ${input.pin} (the input) ← no sensor is connected, so follow, invert and alarm cannot react to anything.`)
    } else {
      const now =
        input.share === null
          ? ''
          : ` It reads ${Math.round(input.share * 100)}% now${input.reading ? ` (${input.reading})` : ''}, so right now ${input.share > 0.5 ? input.high : input.low}.`
      lines.push(
        `- ${input.pin} (the input) ← ${input.sensor.name} ("${input.sensor.local}"). It reads high when ${input.high} and low when ${input.low}.${now}`,
      )
    }
  }
  return lines.join('\n')
}

/** The language names the model is asked to answer in. */
export const LANGUAGE_NAMES = { en: 'English', fa: 'Persian (Farsi)', ar: 'Arabic' } as const

function modeGuide(info: BoardInfo): string {
  const input = info.input?.sensor ? info.input : null
  const here = (words: string | null | undefined) => (input && words ? ` (here: when ${words})` : '')
  return [
    '- off: always off.',
    '- on: always on.',
    '- blink: on for half a second, off for half a second.',
    '- blink2: blinks too, but it is on while the "blink" pins are off, so two pins take turns.',
    '- fade: slowly brighter, then dimmer, again and again. A motor speeds up and slows down.',
    '- step1, step2, step3: a 3-second loop. step1 is on in the 1st second, step2 in the 2nd, step3 in the 3rd. Good for traffic lights and lights that run one after another.',
    `- follow: on when ${info.input?.pin ?? 'the input'} reads high${here(input?.high)}. The higher it reads, the brighter or faster.`,
    `- invert: the opposite of follow: on when ${info.input?.pin ?? 'the input'} reads low${here(input?.low)}.`,
    `- alarm: off while ${info.input?.pin ?? 'the input'} reads low; beeps or flashes when it reads high${here(input?.high)}, faster the higher it reads.`,
  ].join('\n')
}

export type HistoryTurn = { role: 'kid' | 'ai'; text: string; pins?: Record<string, PinMode> }

/** How many earlier messages the model sees, so it knows what "it" and "again" mean. */
export const HISTORY_FOR_MODEL = 6

/** The system prompt with the board's facts, the chat so far, and the new request. */
export function buildMessages(info: BoardInfo, history: HistoryTurn[], request: string, lang: keyof typeof LANGUAGE_NAMES): ChatMessage[] {
  const language = LANGUAGE_NAMES[lang]
  const system = [
    'You are the friendly helper inside the AI board, a part in Circuit Lab, a circuit game for children.',
    'A child tells you what the lights, motors and buzzers wired to the board should do. You set the board\'s pins and answer.',
    '',
    'THE BOARD NOW',
    boardFacts(info),
    '',
    'WHAT A PIN CAN DO (use exactly these words)',
    modeGuide(info),
    '',
    'RULES',
    '1. Answer with JSON that has "pins" and "say".',
    '2. "pins" is a list of only the pins you change, each with one word from the list above. Leave the other pins out. Use [] when nothing should change, like for a question or something you cannot do.',
    '3. Children use everyday words: "light" or "lamp" can mean any LED or lamp, "fan", "wheel" or "pump" a motor, "bell", "alarm" or "beeper" a buzzer. Pick the pin whose part matches what the child names.',
    '4. Only change pins that have a part connected. Never set a pin that has nothing connected.',
    '5. "Turn on" means on. Use follow, invert or alarm only when the child says when it should happen, like "when it gets dark" or "if someone comes".',
    `6. "say": one or two short, friendly sentences in ${language}, with easy words for a child. Say what will happen and name the part (like "the red light"), not the pin.`,
    '7. If the board cannot do what the child asks (change a colour, an exact time or speed, a part that is not on the board), change nothing, say so kindly and offer something close that it can do.',
    '8. Only if the child asks about wall sockets, mains electricity, opening batteries, fire or anything else dangerous: say it is not safe and that they should ask a grown-up. Do not add warnings otherwise.',
    '9. If you are not sure what the child means, ask one short question and change nothing.',
    '',
    'EXAMPLES (for a different board: P1 → green LED, P2 → buzzer, P3 → nothing, IN ← motion sensor)',
    'Child: make the light blink → {"pins":[{"pin":"P1","mode":"blink"}],"say":"Your green light is blinking now!"}',
    'Child: turn on the beeper → {"pins":[{"pin":"P2","mode":"on"}],"say":"The buzzer is beeping now."}',
    'Child: beep when someone walks by → {"pins":[{"pin":"P2","mode":"alarm"}],"say":"I will beep when the motion sensor sees someone move."}',
    'Child: what is on P3? → {"pins":[],"say":"Nothing is connected to P3 yet. Wire a light to it, and I can switch it for you."}',
    `Write "say" in ${language}, even when the child writes in another language.`,
  ].join('\n')

  const earlier = history.slice(-HISTORY_FOR_MODEL).map(
    (turn): ChatMessage =>
      turn.role === 'kid'
        ? { role: 'user', content: turn.text }
        : { role: 'assistant', content: JSON.stringify({ pins: pinList(turn.pins ?? {}), say: turn.text }) },
  )
  return [{ role: 'system', content: system }, ...earlier, { role: 'user', content: request }]
}

/** Pin programs as the model writes them: a list, so it can name the pins in any order. */
export const pinList = (pins: Record<string, PinMode>) => Object.entries(pins).map(([pin, mode]) => ({ pin, mode }))

/**
 * The JSON shape the model must answer in: a list of pin changes, each pin
 * with only its own programs, and what to say. A list instead of an object
 * keyed by pin, because Ollama writes an object's keys in the schema's order:
 * after P3 the model could no longer pick P2.
 */
export function replyFormat(info: BoardInfo) {
  // pins that offer the same programs share one choice
  const groups = new Map<string, { pins: string[]; modes: PinMode[] }>()
  for (const p of info.pins) {
    const key = p.modes.join()
    const group = groups.get(key)
    if (group) group.pins.push(p.pin)
    else groups.set(key, { pins: [p.pin], modes: p.modes })
  }
  const choices = [...groups.values()].map((g) => ({
    type: 'object',
    properties: { pin: { type: 'string', enum: g.pins }, mode: { type: 'string', enum: g.modes } },
    required: ['pin', 'mode'],
    additionalProperties: false,
  }))
  return {
    type: 'object',
    properties: {
      pins: { type: 'array', items: choices.length === 1 ? choices[0] : { anyOf: choices } },
      say: { type: 'string' },
    },
    required: ['pins', 'say'],
  }
}

export type Reply = {
  say: string
  /** the pin programs the model asked for, all known and allowed */
  pins: Record<string, PinMode>
  /** what was dropped because the pin or the program does not exist */
  ignored: string[]
}

/** The longest answer kept, in letters: the model is asked for one or two sentences. */
const MAX_SAY = 600

/** "Pin 1", "p1" and "1" all mean P1. */
function findPin(info: BoardInfo, key: string) {
  const k = key.trim().toLowerCase().replace(/^pin\s*/, '').replace(/\s+/g, '')
  return info.pins.find((p) => {
    const name = p.pin.toLowerCase()
    return name === k || name.replace(/^[a-z]+/, '') === k
  })
}

/** The model's answer as text → what to say and which pins to change; null when it is not usable. */
export function parseReply(text: string, info: BoardInfo): Reply | null {
  const clean = stripThinking(text)
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  let raw: unknown
  try {
    raw = JSON.parse(clean.slice(start, end + 1))
  } catch {
    return null
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const body = raw as { say?: unknown; pins?: unknown }
  const say = typeof body.say === 'string' ? body.say.trim().slice(0, MAX_SAY) : ''
  const pins: Record<string, PinMode> = {}
  const ignored: string[] = []
  // a list of { pin, mode }, or (from a model that ignored the format) an object keyed by pin
  const entries: [string, unknown][] = Array.isArray(body.pins)
    ? body.pins.map((item: unknown): [string, unknown] =>
        item && typeof item === 'object' ? [String((item as { pin?: unknown }).pin ?? ''), (item as { mode?: unknown }).mode] : ['', item],
      )
    : body.pins && typeof body.pins === 'object'
      ? Object.entries(body.pins)
      : []
  for (const [key, value] of entries) {
    const pin = findPin(info, key)
    const mode = typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, '') : ''
    if (pin && (pin.modes as string[]).includes(mode)) pins[pin.pin] = mode as PinMode
    else ignored.push(`${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  }
  if (!say && Object.keys(pins).length === 0) return null
  return { say, pins, ignored }
}

/** The board's pins after the reply, and each pin that really changed. */
export function applyPins(current: Record<string, PinMode>, wanted: Record<string, PinMode>, pinOrder: readonly string[]) {
  const next = { ...current }
  const changes: PinChange[] = []
  for (const pin of pinOrder) {
    const to = wanted[pin]
    if (!to) continue
    const from = current[pin] ?? 'off'
    if (from === to) continue
    next[pin] = to
    changes.push({ pin, from, to })
  }
  return { pins: next, changes }
}

/** The kinds of things a child could try asking next, picked from what is wired. */
export type Suggestion =
  | { kind: 'whenDark'; device: Device }
  | { kind: 'whenSensed'; device: Device }
  | { kind: 'trafficLight' }
  | { kind: 'blink'; device: Device }
  | { kind: 'takeTurns' }
  | { kind: 'slowly'; device: Device }
  | { kind: 'allOff' }
  | { kind: 'whatIsConnected' }
  | { kind: 'howToConnect' }

/** Up to four ideas for the next request, the most fitting first. */
export function suggestionsFor(info: BoardInfo): Suggestion[] {
  const devices = info.pins.flatMap((p) => p.devices).filter((d) => !d.backwards)
  const lights = devices.filter((d) => LIGHTS.has(d.type))
  const movers = devices.filter((d) => MOVERS.has(d.type) && d.type !== 'servo')
  const sounders = devices.filter((d) => SOUNDERS.has(d.type))
  const sensor = info.input?.sensor ?? null
  const out: Suggestion[] = []
  /** the program of the pin that drives a part: ideas that are already running are left out */
  const modeOf = (d: Device) => info.pins.find((p) => p.devices.includes(d))?.mode
  const steps = new Set<PinMode>(['step1', 'step2', 'step3'])

  if (devices.length === 0) return [{ kind: 'howToConnect' }, { kind: 'whatIsConnected' }]

  if (sensor?.type === 'ldr' && lights[0]) {
    if (modeOf(lights[0]) !== 'invert') out.push({ kind: 'whenDark', device: lights[0] })
  } else if (sensor && (sounders[0] ?? lights[0])) {
    const device = sounders[0] ?? lights[0]
    if (!SENSOR_MODES.includes(modeOf(device)!)) out.push({ kind: 'whenSensed', device })
  }

  const leds = lights.filter((d) => d.type === 'led')
  const colors = new Set(leds.map((d) => d.color))
  const isTraffic = colors.has('red') && (colors.has('yellow') || colors.has('orange')) && colors.has('green')
  if (isTraffic && !leds.every((d) => steps.has(modeOf(d)!))) out.push({ kind: 'trafficLight' })
  if (lights[0] && modeOf(lights[0]) !== 'blink') out.push({ kind: 'blink', device: lights[0] })
  if (lights.length >= 2 && !isTraffic) out.push({ kind: 'takeTurns' })
  if (movers[0] && modeOf(movers[0]) !== 'fade') out.push({ kind: 'slowly', device: movers[0] })
  if (info.pins.some((p) => p.mode !== 'off')) out.push({ kind: 'allOff' })
  out.push({ kind: 'whatIsConnected' })

  // the question about the board always stays; the rest keep their order
  return out.length <= 4 ? out : [...out.slice(0, 3), out[out.length - 1]]
}
