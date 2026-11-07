import {
  BOARDS,
  ELECTRICAL as E,
  isBoard,
  LED_FORWARD_VOLTAGE,
  SENSORS,
  batteryResistance,
  cellModel,
  contactPairs,
  dimmerResistance,
  isSupply,
  gateInputs,
  gateOutput,
  isGate,
  isSensorModule,
  ldrResistance,
  pinOutput,
  potentiometerSplit,
  solarVoltage,
  supplySettings,
  terminalIds,
  thermistorResistance,
  timerHigh,
} from './catalog'
import { createDevice, type Device, type Mna } from './devices'
import { displayCurrent, hasSignalInput, isDisplay } from './display'
import type { LedColor, PartData } from './types'

/**
 * Circuit solver based on nodal analysis.
 *
 * Every part terminal is a circuit node. Wires are tiny resistors (so we also
 * get the current through each wire for the flow animation), batteries, solar
 * panels and Arduino pins are Norton equivalents (current source + internal
 * conductance), and LEDs, diodes and transistors are piecewise-linear parts
 * whose state is found iteratively. Every node has a tiny leak to ground so
 * floating sub-circuits never make the matrix singular.
 *
 * Time matters for three parts only: a capacitor remembers its voltage from the
 * previous step (backward Euler), and an Arduino pin and a 555 timer follow
 * their own clock. Everything else settles instantly.
 *
 * Relays, logic chips and the bench power supply switch between a few states
 * (open / closed, LOW / HIGH, steady volts / current limit). Like the diodes
 * their state is found iteratively, starting from the state they were in after
 * the previous step, so a relay that holds itself closed stays closed.
 */

export type NetPart = { id: string; data: PartData }
export type NetWire = {
  id: string
  source: string
  sourceHandle?: string | null
  target: string
  targetHandle?: string | null
}

export type PartStatus =
  | 'idle' //    no meaningful current
  | 'weak' //    works, but only a little (dim lamp, motor hums)
  | 'on' //      working normally
  | 'over' //    too much: too bright / too hot / too fast
  | 'reverse' // connected the wrong way round
  | 'burnt' //   destroyed, needs repair
  | 'short' //   a power source is short-circuited

export type PartResult = {
  /** V(a) − V(b) in volts; collector − emitter for a transistor; 5V − GND for the Arduino */
  voltage: number
  /** current through the part from a to b; for power sources, current delivered out of + */
  current: number
  /** watts */
  power: number
  /** normalised activity: brightness, motor speed (signed), volume, capacitor volts, meter reading, a screen's S volts … */
  level: number
  status: PartStatus
  /** the part received enough power to be destroyed */
  damaged: boolean
  /** Arduino: each output pin's level right now (0..1) */
  pins?: Record<string, number>
  /** Arduino: current out of each output pin, in amps */
  pinCurrents?: Record<string, number>
  /**
   * RGB LED: brightness of R, G and B (0..1.3); logic chips: each input and
   * output as 0 or 1; relay: current through its switch; regulator: volts on IN
   */
  channels?: Record<string, number>
}

export type SimResult = {
  parts: Record<string, PartResult>
  /** current through each wire, positive = flowing from source handle to target handle */
  wires: Record<string, number>
  shortCircuit: boolean
  /** a battery, solar panel or Arduino is on the board */
  hasBattery: boolean
  /** total current delivered by all power sources */
  batteryCurrent: number
  /** capacitor voltages after this step: feed them back into the next step */
  capacitors: Record<string, number>
  /** each Arduino's A0 reading (volts) in this step: its program uses it in the next one */
  inputs: Record<string, number>
  /** relays (1 = closed), logic chips (1 = HIGH) and power supplies (1 = at the current limit) */
  states: Record<string, number>
}

export type SolveOptions = {
  /** seconds since the simulation started (drives the Arduino programs) */
  time?: number
  /** length of this step in seconds (how far capacitors charge) */
  dt?: number
  /** capacitor voltages from the previous step */
  capacitors?: Record<string, number>
  /** Arduino A0 readings from the previous step, like a real board's loop() */
  inputs?: Record<string, number>
  /** relay, logic chip and power supply states after the previous step */
  states?: Record<string, number>
}

export const EMPTY_RESULT: SimResult = {
  parts: {},
  wires: {},
  shortCircuit: false,
  hasBattery: false,
  batteryCurrent: 0,
  capacitors: {},
  inputs: {},
  states: {},
}

/** What a sensor module puts out at `time`, as a share of its supply, when it is powered. */
function moduleSignal(data: PartData, time: number): number {
  const spec = SENSORS[data.type]
  const raw = spec?.signal?.(data.sense ?? 0, time) ?? 0
  return spec?.digital ? (raw > 0.5 ? 1 : 0) : Math.min(1, Math.max(0, raw))
}

const GMIN = 1e-9
const MAX_ITERATIONS = 40
/** A part that changes its state more often than this in one solve is flipping back and forth: it stays put. */
const MAX_FLIPS = 4
/** a step this long is used when nothing says otherwise */
export const DEFAULT_STEP = 0.05

type Stamp = { a: number; b: number; g: number; source: number }
type TransistorState = 'off' | 'active' | 'saturated'
type RegulatorState = 'off' | 'regulating' | 'dropout'
/** A diode-like junction: an LED, a diode or one colour of the RGB LED. */
type Junction = { key: string; a: number; b: number; vf: number; g: number }

const RGB = ['R', 'G', 'B'] as const
const RGB_FORWARD: Record<(typeof RGB)[number], number> = {
  R: LED_FORWARD_VOLTAGE.red,
  G: LED_FORWARD_VOLTAGE.green,
  B: LED_FORWARD_VOLTAGE.blue,
}

function solveLinear(matrix: Float64Array, rhs: Float64Array, n: number): Float64Array {
  const m = matrix.slice()
  const x = rhs.slice()
  for (let col = 0; col < n; col++) {
    let pivot = col
    let best = Math.abs(m[col * n + col])
    for (let row = col + 1; row < n; row++) {
      const value = Math.abs(m[row * n + col])
      if (value > best) {
        best = value
        pivot = row
      }
    }
    if (best < 1e-18) continue
    if (pivot !== col) {
      for (let k = 0; k < n; k++) {
        const tmp = m[col * n + k]
        m[col * n + k] = m[pivot * n + k]
        m[pivot * n + k] = tmp
      }
      const tmp = x[col]
      x[col] = x[pivot]
      x[pivot] = tmp
    }
    const diag = m[col * n + col]
    for (let row = col + 1; row < n; row++) {
      const factor = m[row * n + col] / diag
      if (factor === 0) continue
      for (let k = col; k < n; k++) m[row * n + k] -= factor * m[col * n + k]
      x[row] -= factor * x[col]
    }
  }
  for (let row = n - 1; row >= 0; row--) {
    let sum = x[row]
    for (let k = row + 1; k < n; k++) sum -= m[row * n + k] * x[k]
    const diag = m[row * n + row]
    x[row] = Math.abs(diag) < 1e-18 ? 0 : sum / diag
  }
  return x
}

/** Resistance of a passive two-terminal part in its current state, or null when it is open. */
function passiveResistance(data: PartData): number | null {
  switch (data.type) {
    case 'lamp':
      return data.burnt ? null : E.lamp.resistance
    case 'motor':
      return E.motor.resistance
    case 'buzzer':
      return E.buzzer.resistance
    case 'resistor':
      return data.resistance ?? 100
    case 'dimmer':
      return dimmerResistance(data.level ?? 0.7)
    case 'switch':
      return data.closed ? E.contactResistance : null
    case 'button':
      return data.pressed ? E.contactResistance : null
    case 'fuse':
      return data.burnt ? null : E.fuse.resistance
    case 'ldr':
      return ldrResistance(data.light ?? 0.6)
    case 'thermistor':
      return thermistorResistance(data.sense ?? 0.42)
    case 'tilt':
    case 'reed':
      // closed when tilted / when the magnet is near
      return (data.sense ?? 0) > 0.5 ? E.contactResistance : null
    case 'voltmeter':
      return E.voltmeter.resistance
    case 'ammeter':
      return E.ammeter.resistance
    case 'speaker':
      return E.speaker.resistance
    case 'vibration':
      return E.vibration.resistance
    case 'electromagnet':
      return E.electromagnet.resistance
    case 'oscilloscope':
      return E.oscilloscope.resistance
    default:
      return null
  }
}

/** A screen behaves like a resistor that takes `displayCurrent` from 5 V. */
const displayResistance = (data: PartData) => E.display.ratedVoltage / displayCurrent(data)

/** Forward voltage and series resistance of a diode-like part. */
function diodeModel(data: PartData) {
  if (data.type === 'led') {
    return { vf: LED_FORWARD_VOLTAGE[(data.color as LedColor) ?? 'red'] ?? 2, g: 1 / E.led.seriesResistance }
  }
  return { vf: E.diode.forwardVoltage, g: 1 / E.diode.seriesResistance }
}

export function solveCircuit(parts: NetPart[], wires: NetWire[], options: SolveOptions = {}): SimResult {
  const time = options.time ?? 0
  const dt = options.dt ?? DEFAULT_STEP
  const previousCaps = options.capacitors ?? {}
  const previousInputs = options.inputs ?? {}
  const previousStates = options.states ?? {}

  // 1. index every terminal
  const index = new Map<string, number>()
  for (const part of parts) {
    for (const handle of terminalIds(part.data.type)) index.set(`${part.id}:${handle}`, index.size)
  }
  const n = index.size
  const node = (id: string, handle: string) => index.get(`${id}:${handle}`)!

  const validWires = wires.filter(
    (w) => index.has(`${w.source}:${w.sourceHandle}`) && index.has(`${w.target}:${w.targetHandle}`),
  )

  // 2. linear stamps that never change between iterations
  const fixed: Stamp[] = []
  const wireG = 1 / E.wireResistance
  for (const w of validWires) {
    fixed.push({
      a: node(w.source, w.sourceHandle!),
      b: node(w.target, w.targetHandle!),
      g: wireG,
      source: 0,
    })
  }

  let hasBattery = false
  const pinLevels = new Map<string, Record<string, number>>()
  const capG = new Map<string, number>()

  for (const part of parts) {
    const { id, data } = part
    switch (data.type) {
      case 'battery': {
        hasBattery = true
        const v = data.voltage ?? 3
        const g = 1 / batteryResistance(v)
        fixed.push({ a: node(id, 'a'), b: node(id, 'b'), g, source: v * g })
        break
      }
      case 'solar': {
        hasBattery = true
        const g = 1 / E.solar.resistance
        fixed.push({ a: node(id, 'a'), b: node(id, 'b'), g, source: solarVoltage(data.light ?? 0.8) * g })
        break
      }
      case 'lemon':
      case 'coinCell':
      case 'dynamo': {
        // a push behind a resistance, like the battery
        hasBattery = true
        const cell = cellModel(data)!
        const g = 1 / cell.resistance
        fixed.push({ a: node(id, 'a'), b: node(id, 'b'), g, source: cell.voltage * g })
        break
      }
      case 'slideSwitch':
      case 'microSwitch':
      case 'joystick':
        // whichever contacts are touching, or the joystick's two knobs
        for (const [from, to, r] of contactPairs(data)) fixed.push({ a: node(id, from), b: node(id, to), g: 1 / r, source: 0 })
        break
      case 'arduino':
      case 'nano':
      case 'mega':
      case 'esp32':
      case 'esp8266':
      case 'pico':
      case 'microbit':
      case 'raspberrypi':
      case 'aiBoard':
      case 'ecu':
      case 'plc':
      case 'rtu':
      case 'atmega328':
      case 'atmega32':
      case 'attiny85':
      case 'stm32': {
        hasBattery = true
        const spec = BOARDS[data.type]
        const gnd = node(id, 'GND')
        const supplyG = 1 / E.arduino.supplyResistance
        fixed.push({ a: node(id, spec.supply), b: gnd, g: supplyG, source: spec.voltage * supplyG })
        // the input only listens: a very high resistance to ground
        if (spec.input) fixed.push({ a: node(id, spec.input), b: gnd, g: 1 / E.arduino.inputResistance, source: 0 })
        const levels: Record<string, number> = {}
        const pinG = 1 / E.arduino.pinResistance
        const reading = (previousInputs[id] ?? 0) / spec.voltage
        for (const pin of spec.pins) {
          // a LOW pin is not open: it is driven to 0 V and can sink current
          levels[pin] = pinOutput(data.pins?.[pin], time, spec.pwm.has(pin), reading)
          fixed.push({ a: node(id, pin), b: gnd, g: pinG, source: spec.voltage * levels[pin] * pinG })
        }
        pinLevels.set(id, levels)
        break
      }
      case 'capacitor': {
        // backward Euler: a conductance C/dt in parallel with the remembered voltage
        const g = ((data.capacitance ?? 2200) * 1e-6) / dt
        capG.set(id, g)
        fixed.push({ a: node(id, 'a'), b: node(id, 'b'), g, source: (previousCaps[id] ?? 0) * g })
        break
      }
      case 'servo': {
        // the motor draws power; the signal pin only listens
        const gnd = node(id, 'GND')
        fixed.push({ a: node(id, 'VCC'), b: gnd, g: 1 / E.servo.resistance, source: 0 })
        fixed.push({ a: node(id, 'OUT'), b: gnd, g: 1 / E.servo.signalResistance, source: 0 })
        break
      }
      case 'powerSupply':
      case 'powerBank':
        hasBattery = true
        break // steady volts or current limit: solved iteratively below
      case 'potentiometer': {
        // two resistors in a row, joined at the wiper
        const { aw, wb } = potentiometerSplit(data)
        fixed.push({ a: node(id, 'A'), b: node(id, 'W'), g: 1 / aw, source: 0 })
        fixed.push({ a: node(id, 'W'), b: node(id, 'B'), g: 1 / wb, source: 0 })
        break
      }
      case 'relay':
        // the coil is a plain resistor; its switch is solved iteratively below
        fixed.push({ a: node(id, 'a'), b: node(id, 'b'), g: 1 / E.relay.coilResistance, source: 0 })
        break
      case 'regulator':
        // the chip itself uses a few milliamps; the 5 V output is solved iteratively below
        fixed.push({ a: node(id, 'IN'), b: node(id, 'GND'), g: 1 / E.regulator.quiescentResistance, source: 0 })
        break
      case 'timer555':
        fixed.push({ a: node(id, 'VCC'), b: node(id, 'GND'), g: 1 / E.timer555.supplyResistance, source: 0 })
        break
      case 'led':
      case 'diode':
      case 'rgbLed':
      case 'transistor':
        break // solved iteratively below
      default: {
        if (isDisplay(data.type)) {
          // a screen is a load between + and −; its S input only listens
          const gnd = node(id, 'GND')
          fixed.push({ a: node(id, 'VCC'), b: gnd, g: 1 / displayResistance(data), source: 0 })
          if (hasSignalInput(data.type)) {
            fixed.push({ a: node(id, 'S'), b: gnd, g: 1 / E.display.signalResistance, source: 0 })
          }
          break
        }
        if (isSensorModule(data.type)) {
          // the module's own electronics use a few milliamps
          fixed.push({ a: node(id, 'VCC'), b: node(id, 'GND'), g: 1 / E.module.supplyResistance, source: 0 })
          break
        }
        if (isGate(data.type)) {
          // a logic chip uses a tiny current; its inputs only listen (an unjoined input reads LOW)
          const gnd = node(id, 'GND')
          fixed.push({ a: node(id, 'VCC'), b: gnd, g: 1 / E.logic.supplyResistance, source: 0 })
          for (const input of gateInputs(data.type)) {
            fixed.push({ a: node(id, input), b: gnd, g: 1 / E.logic.inputResistance, source: 0 })
          }
          break
        }
        const r = passiveResistance(data)
        if (r !== null) fixed.push({ a: node(id, 'a'), b: node(id, 'b'), g: 1 / r, source: 0 })
      }
    }
  }

  // LEDs and diodes are one junction each; the RGB LED is three that share the − leg
  const junctions: Junction[] = []
  for (const { id, data } of parts) {
    if (data.burnt) continue
    if (data.type === 'led' || data.type === 'diode') {
      const { vf, g } = diodeModel(data)
      junctions.push({ key: id, a: node(id, 'a'), b: node(id, 'b'), vf, g })
    } else if (data.type === 'rgbLed') {
      for (const ch of RGB) {
        junctions.push({ key: `${id}:${ch}`, a: node(id, ch), b: node(id, 'K'), vf: RGB_FORWARD[ch], g: 1 / E.led.seriesResistance })
      }
    }
  }
  const diodeOn = new Map(junctions.map((j) => [j.key, true]))
  const transistors = parts.filter((p) => p.data.type === 'transistor' && !p.data.burnt)
  const transistorState = new Map<string, TransistorState>(transistors.map((p) => [p.id, 'active']))
  const T = E.transistor
  const gbe = 1 / T.baseResistance
  const gm = T.beta * gbe
  const modules = parts.filter((p) => isSensorModule(p.data.type))
  const modulePowered = new Map(modules.map((p) => [p.id, true]))

  // parts that switch between states start where they were after the last step
  const supplies = parts.filter((p) => isSupply(p.data.type))
  const supplyLimited = new Map(supplies.map((p) => [p.id, previousStates[p.id] === 1]))
  const relays = parts.filter((p) => p.data.type === 'relay')
  const relayClosed = new Map(relays.map((p) => [p.id, previousStates[p.id] === 1]))
  const regulators = parts.filter((p) => p.data.type === 'regulator')
  const regulatorState = new Map<string, RegulatorState>(regulators.map((p) => [p.id, 'off']))
  const R = E.regulator
  const regulatorG = 1 / R.outputResistance
  const chips = parts.filter((p) => isGate(p.data.type) || p.data.type === 'timer555')
  const chipPowered = new Map(chips.map((p) => [p.id, true]))
  const chipHigh = new Map(
    chips.map((p) => [
      p.id,
      p.data.type === 'timer555' ? timerHigh(p.data.rate ?? 1, time) : previousStates[p.id] === 1,
    ]),
  )
  const chipOut = (type: PartData['type']) => (type === 'timer555' ? 'OUT' : 'Y')
  const chipMinVoltage = (type: PartData['type']) =>
    type === 'timer555' ? E.timer555.minVoltage : E.logic.minVoltage
  const chipG = (type: PartData['type']) =>
    1 / (type === 'timer555' ? E.timer555.outputResistance : E.logic.outputResistance)
  const flips = new Map<string, number>()
  /** counts a change of `key`'s state; false once it has flipped too often to trust */
  const mayFlip = (key: string) => {
    const count = (flips.get(key) ?? 0) + 1
    flips.set(key, count)
    return count <= MAX_FLIPS
  }
  // the newer parts (Zener, PNP, MOSFET, multimeter, latch …) stamp and judge themselves: see devices.ts
  const devices = new Map<string, Device>()
  for (const { id, data } of parts) {
    const device = createDevice({ id, data, pin: (handle) => node(id, handle), time, memory: previousStates })
    if (device) devices.set(id, device)
  }

  // 3. solve, refining diode and transistor states until they are consistent
  let voltages: Float64Array = new Float64Array(n)
  const nodeVoltage = (i: number) => voltages[i]
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const matrix = new Float64Array(n * n)
    const rhs = new Float64Array(n)
    for (let i = 0; i < n; i++) matrix[i * n + i] += GMIN

    const stamp = ({ a, b, g, source }: Stamp) => {
      matrix[a * n + a] += g
      matrix[b * n + b] += g
      matrix[a * n + b] -= g
      matrix[b * n + a] -= g
      // `source` amps are pushed from b to a inside the element
      rhs[a] += source
      rhs[b] -= source
    }
    fixed.forEach(stamp)

    const mna: Mna = {
      stamp: (a, b, g, source = 0) => stamp({ a, b, g, source }),
      vccs: (from, to, p, q, gm, offset = 0) => {
        matrix[from * n + p] += gm
        matrix[from * n + q] -= gm
        rhs[from] += gm * offset
        matrix[to * n + p] -= gm
        matrix[to * n + q] += gm
        rhs[to] -= gm * offset
      },
    }
    for (const device of devices.values()) device.stamp(mna)

    for (const j of junctions) {
      if (!diodeOn.get(j.key)) continue
      stamp({ a: j.a, b: j.b, g: j.g, source: j.vf * j.g })
    }

    for (const s of supplies) {
      const { voltage, limit } = supplySettings(s.data)
      if (supplyLimited.get(s.id)) {
        // at the limit it pushes a fixed current (with a tiny leak so it is never ideal)
        stamp({ a: node(s.id, 'a'), b: node(s.id, 'b'), g: 1 / E.supply.shuntResistance, source: limit })
      } else {
        const g = 1 / E.supply.resistance
        stamp({ a: node(s.id, 'a'), b: node(s.id, 'b'), g, source: voltage * g })
      }
    }

    for (const r of relays) {
      if (relayClosed.get(r.id)) stamp({ a: node(r.id, 'COM'), b: node(r.id, 'NO'), g: 1 / E.contactResistance, source: 0 })
    }

    for (const r of regulators) {
      const state = regulatorState.get(r.id)!
      const i = node(r.id, 'IN')
      const g = node(r.id, 'GND')
      const o = node(r.id, 'OUT')
      if (state === 'regulating') {
        // a current from IN to OUT, as big as it takes to hold OUT 5 V above GND:
        // I = G × (5 − (V(OUT) − V(GND)))
        matrix[i * n + o] -= regulatorG
        matrix[i * n + g] += regulatorG
        rhs[i] -= regulatorG * R.output
        matrix[o * n + o] += regulatorG
        matrix[o * n + g] -= regulatorG
        rhs[o] += regulatorG * R.output
      } else if (state === 'dropout') {
        // not enough volts in: OUT simply follows IN, 2 V lower
        stamp({ a: i, b: o, g: regulatorG, source: R.dropout * regulatorG })
      }
    }

    for (const c of chips) {
      if (!chipPowered.get(c.id)) continue
      // the output is joined to + (HIGH) or to − (LOW) through a small resistance
      const out = node(c.id, chipOut(c.data.type))
      const g = chipG(c.data.type)
      if (chipHigh.get(c.id)) stamp({ a: node(c.id, 'VCC'), b: out, g, source: 0 })
      else stamp({ a: out, b: node(c.id, 'GND'), g, source: 0 })
    }

    for (const tr of transistors) {
      const state = transistorState.get(tr.id)!
      if (state === 'off') continue
      const b = node(tr.id, 'B')
      const c = node(tr.id, 'C')
      const e = node(tr.id, 'E')
      // base–emitter junction: a diode
      stamp({ a: b, b: e, g: gbe, source: T.baseEmitterVoltage * gbe })
      if (state === 'saturated') {
        stamp({ a: c, b: e, g: 1 / T.saturationResistance, source: 0 })
      } else {
        // active: collector current = beta × base current, flowing C → E
        matrix[c * n + b] += gm
        matrix[c * n + e] -= gm
        matrix[e * n + b] -= gm
        matrix[e * n + e] += gm
        rhs[c] += gm * T.baseEmitterVoltage
        rhs[e] -= gm * T.baseEmitterVoltage
      }
    }

    for (const m of modules) {
      const vcc = node(m.id, 'VCC')
      const gnd = node(m.id, 'GND')
      const out = node(m.id, 'OUT')
      const g = 1 / (SENSORS[m.data.type]?.digital ? E.module.digitalResistance : E.module.analogResistance)
      // OUT follows signal × (VCC − GND) through a small output resistance;
      // an unpowered module just pulls OUT down to GND
      const k = modulePowered.get(m.id) ? moduleSignal(m.data, time) : 0
      matrix[out * n + out] += g
      matrix[out * n + gnd] += g * k - g
      matrix[out * n + vcc] -= g * k
      matrix[gnd * n + out] -= g
      matrix[gnd * n + gnd] += g - g * k
      matrix[gnd * n + vcc] += g * k
    }

    voltages = solveLinear(matrix, rhs, n)

    let changed = false
    for (const m of modules) {
      const powered = voltages[node(m.id, 'VCC')] - voltages[node(m.id, 'GND')] > E.module.minVoltage
      if (powered !== modulePowered.get(m.id)) {
        modulePowered.set(m.id, powered)
        changed = true
      }
    }
    for (const j of junctions) {
      const drop = voltages[j.a] - voltages[j.b]
      const on = diodeOn.get(j.key)!
      if (on && drop < j.vf - 1e-9) {
        diodeOn.set(j.key, false)
        changed = true
      } else if (!on && drop > j.vf + 1e-6) {
        diodeOn.set(j.key, true)
        changed = true
      }
    }
    for (const s of supplies) {
      const { voltage, limit } = supplySettings(s.data)
      const out = voltages[node(s.id, 'a')] - voltages[node(s.id, 'b')]
      const limited = supplyLimited.get(s.id)!
      // steady volts until a part wants more than the limit; back to steady volts once
      // holding the limit would need more volts than it is set to
      const next = limited ? out <= voltage + 1e-9 : (voltage - out) / E.supply.resistance > limit + 1e-9
      if (next !== limited && mayFlip(s.id)) {
        supplyLimited.set(s.id, next)
        changed = true
      }
    }
    for (const r of relays) {
      const coil = Math.abs(voltages[node(r.id, 'a')] - voltages[node(r.id, 'b')])
      const closed = relayClosed.get(r.id)!
      // it needs a strong pull to close, but holds on until the coil is nearly empty
      const next = closed ? coil >= E.relay.dropOut : coil >= E.relay.pullIn
      if (next !== closed && mayFlip(r.id)) {
        relayClosed.set(r.id, next)
        changed = true
      }
    }
    for (const r of regulators) {
      const state = regulatorState.get(r.id)!
      const vi = voltages[node(r.id, 'IN')]
      const vg = voltages[node(r.id, 'GND')]
      const vo = voltages[node(r.id, 'OUT')]
      let next = state
      if (state === 'off') {
        if (vi - vo > R.dropout + 1e-6) next = vi - vg >= R.output + R.dropout ? 'regulating' : 'dropout'
      } else {
        const current = state === 'regulating' ? regulatorG * (R.output - (vo - vg)) : regulatorG * (vi - vo - R.dropout)
        // it can only push current out, never take it back
        if (current < -1e-6) next = 'off'
        else if (state === 'regulating' && vi - vo < R.dropout - 1e-6) next = 'dropout'
        else if (state === 'dropout' && vo - vg > R.output + 1e-6) next = 'regulating'
      }
      if (next !== state && mayFlip(r.id)) {
        regulatorState.set(r.id, next)
        changed = true
      }
    }
    for (const c of chips) {
      const vg = voltages[node(c.id, 'GND')]
      const supply = voltages[node(c.id, 'VCC')] - vg
      const powered = supply >= chipMinVoltage(c.data.type)
      if (powered !== chipPowered.get(c.id) && mayFlip(`${c.id}:power`)) {
        chipPowered.set(c.id, powered)
        changed = true
      }
      if (!isGate(c.data.type) || !chipPowered.get(c.id)) continue
      // an input is HIGH above half the supply
      const high = (input: string) => voltages[node(c.id, input)] - vg > supply / 2
      const next = gateOutput(c.data.type, high('A'), c.data.type !== 'notGate' && high('B'))
      if (next !== chipHigh.get(c.id) && mayFlip(c.id)) {
        chipHigh.set(c.id, next)
        changed = true
      }
    }
    for (const tr of transistors) {
      const vb = voltages[node(tr.id, 'B')]
      const vc = voltages[node(tr.id, 'C')]
      const ve = voltages[node(tr.id, 'E')]
      const ib = (vb - ve - T.baseEmitterVoltage) * gbe
      const state = transistorState.get(tr.id)!
      let next = state
      if (state === 'off') {
        if (vb - ve > T.baseEmitterVoltage + 1e-6) next = 'active'
      } else if (ib < 0) {
        next = 'off'
      } else if (state === 'active' && vc - ve < 0.1) {
        next = 'saturated'
      } else if (state === 'saturated' && (vc - ve) / T.saturationResistance > T.beta * ib) {
        next = 'active' // not enough base current to stay fully on
      }
      if (next !== state) {
        transistorState.set(tr.id, next)
        changed = true
      }
    }
    for (const device of devices.values()) {
      if (device.update(nodeVoltage, mayFlip)) changed = true
    }
    if (!changed) break
  }

  const v = (id: string, handle: string) => voltages[node(id, handle)]

  // 4. interpret the node voltages
  const results: Record<string, PartResult> = {}
  // oscilloscopes with a wire on their probe (+)
  const probed = new Set(
    validWires.flatMap((w) => [
      ...(w.sourceHandle === 'a' ? [w.source] : []),
      ...(w.targetHandle === 'a' ? [w.target] : []),
    ]),
  )
  const capacitors: Record<string, number> = {}
  const inputs: Record<string, number> = {}
  const states: Record<string, number> = {}
  let shortCircuit = false
  let batteryCurrent = 0

  const deliver = (result: PartResult, delivered: number) => {
    result.current = delivered
    result.power = delivered * result.voltage
    result.level = delivered
    batteryCurrent += Math.max(0, delivered)
    if (delivered > E.shortCircuitCurrent) {
      result.status = 'short'
      shortCircuit = true
    } else if (delivered > 1e-3) {
      result.status = 'on'
    }
  }

  for (const part of parts) {
    const { id, data } = part
    const device = devices.get(id)
    if (device) {
      results[id] = device.result(nodeVoltage, states)
      continue
    }
    const handles = terminalIds(data.type)
    const voltage =
      data.type === 'transistor'
        ? v(id, 'C') - v(id, 'E')
        : isBoard(data.type)
          ? v(id, BOARDS[data.type].supply) - v(id, 'GND')
          : data.type === 'servo' ||
              data.type === 'timer555' ||
              isGate(data.type) ||
              isSensorModule(data.type) ||
              isDisplay(data.type)
            ? v(id, 'VCC') - v(id, 'GND')
            : v(id, handles[0]) - v(id, handles[1])
    const result: PartResult = {
      voltage,
      current: 0,
      power: 0,
      level: 0,
      status: data.burnt ? 'burnt' : 'idle',
      damaged: false,
    }

    switch (data.type) {
      case 'battery': {
        const vb = data.voltage ?? 3
        deliver(result, (vb - voltage) / batteryResistance(vb))
        break
      }
      case 'solar': {
        deliver(result, (solarVoltage(data.light ?? 0.8) - voltage) / E.solar.resistance)
        break
      }
      case 'lemon':
      case 'coinCell':
      case 'dynamo': {
        const cell = cellModel(data)!
        deliver(result, (cell.voltage - voltage) / cell.resistance)
        break
      }
      case 'slideSwitch':
      case 'microSwitch': {
        // the current through the contact that is touching, from COM to that side
        const [[from, to, r]] = contactPairs(data)
        result.voltage = v(id, from) - v(id, to)
        result.current = result.voltage / r
        result.power = result.voltage * result.current
        result.level = data.type === 'slideSwitch' ? (data.closed ? 1 : 0) : data.pressed ? 1 : 0
        if (Math.abs(result.current) > 1e-3) result.status = 'on'
        break
      }
      case 'joystick': {
        // the volts on X and Y, from −
        const gnd = v(id, 'GND')
        result.current = voltage / (E.joystick.resistance / 2)
        result.power = voltage * result.current
        result.channels = { X: v(id, 'X') - gnd, Y: v(id, 'Y') - gnd }
        result.level = Math.abs(voltage)
        if (voltage > 0.5) result.status = 'on'
        else if (voltage < -0.5) result.status = 'reverse'
        break
      }
      case 'arduino':
      case 'nano':
      case 'mega':
      case 'esp32':
      case 'esp8266':
      case 'pico':
      case 'microbit':
      case 'raspberrypi':
      case 'aiBoard':
      case 'ecu':
      case 'plc':
      case 'rtu':
      case 'atmega328':
      case 'atmega32':
      case 'attiny85':
      case 'stm32': {
        const spec = BOARDS[data.type]
        const levels = pinLevels.get(id) ?? {}
        const gnd = v(id, 'GND')
        let delivered = (spec.voltage - voltage) / E.arduino.supplyResistance
        const pinCurrents: Record<string, number> = {}
        let overloaded = false
        for (const pin of spec.pins) {
          const out = (spec.voltage * levels[pin] - (v(id, pin) - gnd)) / E.arduino.pinResistance
          pinCurrents[pin] = out
          delivered += Math.max(0, out)
          if (Math.abs(out) > E.arduino.pinMaxCurrent) overloaded = true
        }
        deliver(result, delivered)
        // the board itself is always running its program (it is plugged into USB)
        if (result.status === 'idle') result.status = 'on'
        if (overloaded && result.status !== 'short') result.status = 'over'
        result.pins = levels
        result.pinCurrents = pinCurrents
        if (spec.input) inputs[id] = v(id, spec.input) - gnd
        break
      }
      case 'servo': {
        result.current = voltage / E.servo.resistance
        result.power = voltage * result.current
        if (voltage > E.servo.minVoltage) {
          // the signal voltage sets the angle: 0 V → 0°, 5 V → 180°
          const signal = (v(id, 'OUT') - v(id, 'GND')) / E.arduino.voltage
          result.level = Math.min(1, Math.max(0, signal))
          result.status = 'on'
        } else if (voltage > 0.5) {
          result.status = 'weak'
        }
        break
      }
      case 'capacitor': {
        const g = capG.get(id) ?? 0
        const previous = previousCaps[id] ?? 0
        capacitors[id] = voltage
        result.current = (voltage - previous) * g
        result.power = voltage * result.current
        result.level = voltage
        if (voltage < -E.capacitor.reverseVoltage) result.status = 'reverse'
        else if (voltage > E.capacitor.maxVoltage) result.status = 'over'
        else if (Math.abs(result.current) > 1e-3) result.status = 'on'
        break
      }
      case 'lamp': {
        if (data.burnt) break
        result.current = voltage / E.lamp.resistance
        result.power = voltage * result.current
        const ratio = result.power / E.lamp.ratedPower
        if (ratio >= E.lamp.burnRatio) {
          result.damaged = true
          result.status = 'over'
          result.level = 1.6
        } else if (ratio > 0.02) {
          result.level = Math.min(1.6, ratio ** 0.6)
          result.status = ratio > E.lamp.overRatio ? 'over' : ratio < 0.35 ? 'weak' : 'on'
        }
        break
      }
      case 'led': {
        if (data.burnt) break
        const { vf, g } = diodeModel(data)
        const current = diodeOn.get(id) ? Math.max(0, (voltage - vf) * g) : 0
        result.current = current
        result.power = voltage * current
        if (current > E.led.burnCurrent) {
          result.damaged = true
          result.status = 'over'
          result.level = 1.3
        } else if (current > 1e-3) {
          result.level = Math.min(1.3, 0.25 + (0.75 * current) / E.led.fullCurrent)
          result.status = current > E.led.overCurrent ? 'over' : current < 5e-3 ? 'weak' : 'on'
        } else if (voltage < -0.5) {
          result.status = 'reverse'
        }
        break
      }
      case 'diode': {
        if (data.burnt) break
        const { vf, g } = diodeModel(data)
        const current = diodeOn.get(id) ? Math.max(0, (voltage - vf) * g) : 0
        result.current = current
        result.power = voltage * current
        result.level = current
        if (current > E.diode.burnCurrent) {
          result.damaged = true
          result.status = 'over'
        } else if (current > 1e-3) {
          result.status = 'on'
        }
        break
      }
      case 'transistor': {
        if (data.burnt) break
        const state = transistorState.get(id) ?? 'off'
        const ib = state === 'off' ? 0 : Math.max(0, (v(id, 'B') - v(id, 'E') - T.baseEmitterVoltage) * gbe)
        const ic =
          state === 'off' ? 0 : state === 'saturated' ? voltage / T.saturationResistance : T.beta * ib
        result.current = ic
        result.power = voltage * ic + T.baseEmitterVoltage * ib
        result.level = ic
        if (ic > T.burnCurrent || ib > T.burnBaseCurrent) {
          result.damaged = true
          result.status = 'over'
        } else if (ic > 1e-3) {
          result.status = 'on'
        }
        break
      }
      case 'fuse': {
        if (data.burnt) break
        result.current = voltage / E.fuse.resistance
        result.power = voltage * result.current
        const rating = data.rating ?? 0.5
        const load = Math.abs(result.current) / rating
        result.level = load
        if (load > 1) {
          result.damaged = true
          result.status = 'over'
        } else if (load > 0.8) {
          result.status = 'over'
        } else if (Math.abs(result.current) > 1e-3) {
          result.status = 'on'
        }
        break
      }
      case 'motor': {
        result.current = voltage / E.motor.resistance
        result.power = voltage * result.current
        const speed = voltage / E.motor.ratedVoltage
        const magnitude = Math.abs(speed)
        if (magnitude >= E.motor.stallSpeed) {
          result.level = speed
          result.status = magnitude > E.motor.overSpeed ? 'over' : magnitude < 0.35 ? 'weak' : 'on'
        } else if (magnitude > 0.02) {
          result.status = 'weak'
        }
        break
      }
      case 'buzzer': {
        result.current = voltage / E.buzzer.resistance
        result.power = voltage * result.current
        const magnitude = Math.abs(result.current)
        if (magnitude >= E.buzzer.onCurrent) {
          result.level = Math.min(1.5, magnitude / E.buzzer.ratedCurrent)
          result.status = magnitude > E.buzzer.ratedCurrent * 2.5 ? 'over' : 'on'
        }
        break
      }
      case 'powerSupply':
      case 'powerBank': {
        const { voltage: set, limit } = supplySettings(data)
        const limited = supplyLimited.get(id) ?? false
        const delivered = limited ? limit - voltage / E.supply.shuntResistance : (set - voltage) / E.supply.resistance
        result.current = delivered
        result.power = delivered * voltage
        result.level = delivered
        batteryCurrent += Math.max(0, delivered)
        // it protects itself: a short only makes it hold the current at the limit
        if (limited) result.status = 'over'
        else if (delivered > 1e-3) result.status = 'on'
        states[id] = limited ? 1 : 0
        break
      }
      case 'potentiometer': {
        const { aw, wb } = potentiometerSplit(data)
        const toWiper = (v(id, 'A') - v(id, 'W')) / aw
        const fromWiper = (v(id, 'W') - v(id, 'B')) / wb
        result.current = Math.abs(toWiper) >= Math.abs(fromWiper) ? toWiper : fromWiper
        result.power = toWiper * toWiper * aw + fromWiper * fromWiper * wb
        // the volts at the wiper, measured from B
        result.level = v(id, 'W') - v(id, 'B')
        if (result.power > E.potentiometer.ratedPower) result.status = 'over'
        else if (Math.abs(result.current) > 1e-5) result.status = 'on'
        break
      }
      case 'relay': {
        const closed = relayClosed.get(id) ?? false
        result.current = voltage / E.relay.coilResistance
        result.power = voltage * result.current
        result.level = closed ? 1 : 0
        result.channels = { contact: closed ? (v(id, 'COM') - v(id, 'NO')) / E.contactResistance : 0 }
        result.status = closed ? 'on' : Math.abs(voltage) > 0.5 ? 'weak' : 'idle'
        states[id] = closed ? 1 : 0
        break
      }
      case 'rgbLed': {
        if (data.burnt) break
        const channels: Record<string, number> = {}
        let total = 0
        let brightest = 0
        let strongest = 0
        let push = -Infinity
        for (const ch of RGB) {
          const drop = v(id, ch) - v(id, 'K')
          const current = diodeOn.get(`${id}:${ch}`) ? Math.max(0, (drop - RGB_FORWARD[ch]) / E.led.seriesResistance) : 0
          const glow = current > 1e-3 ? Math.min(1.3, 0.25 + (0.75 * current) / E.led.fullCurrent) : 0
          channels[ch] = glow
          total += current
          result.power += drop * current
          brightest = Math.max(brightest, glow)
          strongest = Math.max(strongest, current)
          push = Math.max(push, drop)
        }
        result.voltage = push
        result.current = total
        result.level = brightest
        result.channels = channels
        if (strongest > E.led.burnCurrent) {
          result.damaged = true
          result.status = 'over'
        } else if (brightest > 0) {
          result.status = strongest > E.led.overCurrent ? 'over' : strongest < 5e-3 ? 'weak' : 'on'
        } else if (push < -0.5) {
          result.status = 'reverse'
        }
        break
      }
      case 'speaker': {
        result.current = voltage / E.speaker.resistance
        result.power = voltage * result.current
        const watts = Math.abs(result.power)
        if (watts > E.speaker.burnPower) {
          result.damaged = true
          result.status = 'over'
          result.level = 1.5
        } else if (watts > 1e-3) {
          // loudness grows with the square root of the power, like our ears hear it
          result.level = Math.min(1.5, Math.sqrt(watts / E.speaker.ratedPower))
          result.status = watts > E.speaker.overPower ? 'over' : watts < 5e-3 ? 'weak' : 'on'
        }
        break
      }
      case 'vibration': {
        result.current = voltage / E.vibration.resistance
        result.power = voltage * result.current
        // it shakes the same both ways round
        const speed = Math.abs(voltage) / E.vibration.ratedVoltage
        if (speed >= E.vibration.stallSpeed) {
          result.level = speed
          result.status = speed > E.vibration.overSpeed ? 'over' : speed < 0.35 ? 'weak' : 'on'
        } else if (speed > 0.02) {
          result.status = 'weak'
        }
        break
      }
      case 'electromagnet': {
        result.current = voltage / E.electromagnet.resistance
        result.power = voltage * result.current
        const amps = Math.abs(result.current)
        // signed: swapping the wires swaps its north and south ends
        result.level = result.current / E.electromagnet.ratedCurrent
        if (amps > E.electromagnet.hotCurrent) result.status = 'over'
        else if (amps > E.electromagnet.ratedCurrent * 0.35) result.status = 'on'
        else if (amps > 0.01) result.status = 'weak'
        break
      }
      case 'regulator': {
        const state = regulatorState.get(id) ?? 'off'
        const vin = v(id, 'IN') - v(id, 'GND')
        const vout = v(id, 'OUT') - v(id, 'GND')
        const through =
          state === 'regulating'
            ? regulatorG * (R.output - vout)
            : state === 'dropout'
              ? regulatorG * (v(id, 'IN') - v(id, 'OUT') - R.dropout)
              : 0
        result.voltage = vout
        result.current = through
        // the extra volts become heat
        result.power = Math.max(0, (v(id, 'IN') - v(id, 'OUT')) * through)
        result.level = vout
        result.channels = { in: vin }
        if (state === 'regulating') result.status = result.power > R.ratedPower ? 'over' : 'on'
        else if (state === 'dropout') result.status = 'weak'
        else if (vin < -0.5) result.status = 'reverse'
        else if (vin > 0.5) result.status = 'weak'
        break
      }
      case 'timer555': {
        const powered = chipPowered.get(id) ?? false
        const high = powered && (chipHigh.get(id) ?? false)
        const g = 1 / E.timer555.outputResistance
        const out = high ? Math.max(0, (v(id, 'VCC') - v(id, 'OUT')) * g) : 0
        result.current = voltage / E.timer555.supplyResistance + out
        result.power = voltage * result.current
        result.level = high ? 1 : 0
        result.channels = { OUT: high ? 1 : 0 }
        if (powered) result.status = 'on'
        else if (voltage < -0.5) result.status = 'reverse'
        else if (voltage > 0.5) result.status = 'weak'
        break
      }
      case 'oscilloscope': {
        result.current = voltage / E.oscilloscope.resistance
        result.level = voltage
        // it is watching as soon as its probe is clipped on, even while the signal sits at 0 V
        if (probed.has(id) || Math.abs(voltage) > 0.01) result.status = 'on'
        break
      }
      case 'voltmeter': {
        result.current = voltage / E.voltmeter.resistance
        result.level = voltage
        if (Math.abs(voltage) > 0.01) result.status = voltage < 0 ? 'reverse' : 'on'
        break
      }
      case 'ammeter': {
        result.current = voltage / E.ammeter.resistance
        result.power = voltage * result.current
        result.level = result.current
        if (Math.abs(result.current) > 5e-4) result.status = result.current < 0 ? 'reverse' : 'on'
        break
      }
      default: {
        if (isDisplay(data.type)) {
          result.current = voltage / displayResistance(data)
          result.power = voltage * result.current
          if (voltage >= E.display.minVoltage) {
            result.status = 'on'
            // screens that read S report its voltage; the others are simply lit
            result.level = hasSignalInput(data.type) ? Math.max(0, v(id, 'S') - v(id, 'GND')) : 1
          } else if (voltage < -0.5) {
            result.status = 'reverse'
          } else if (voltage > 0.5) {
            result.status = 'weak'
          }
          break
        }
        if (isGate(data.type)) {
          const powered = chipPowered.get(id) ?? false
          const high = powered && (chipHigh.get(id) ?? false)
          const gnd = v(id, 'GND')
          const out = high ? Math.max(0, (v(id, 'VCC') - v(id, 'Y')) / E.logic.outputResistance) : 0
          result.current = voltage / E.logic.supplyResistance + out
          result.power = voltage * result.current
          result.level = high ? 1 : 0
          const reads = (input: string) => (powered && v(id, input) - gnd > voltage / 2 ? 1 : 0)
          result.channels = Object.fromEntries([
            ...gateInputs(data.type).map((input) => [input, reads(input)]),
            ['Y', high ? 1 : 0],
          ])
          if (powered) result.status = high ? 'on' : 'idle'
          else if (voltage < -0.5) result.status = 'reverse'
          else if (voltage > 0.5) result.status = 'weak'
          states[id] = high ? 1 : 0
          break
        }
        if (isSensorModule(data.type)) {
          result.current = voltage / E.module.supplyResistance
          result.power = voltage * result.current
          if (modulePowered.get(id)) {
            // how strongly it is sensing right now: drives the little light on the module
            result.level = moduleSignal(data, time)
            result.status = 'on'
          } else if (voltage > 0.5) {
            result.status = 'weak'
          }
          break
        }
        const r = passiveResistance(data)
        if (r === null) break
        result.current = voltage / r
        result.power = voltage * result.current
        const magnitude = Math.abs(result.current)
        result.level = magnitude
        if (magnitude > (data.type === 'ldr' ? 1e-4 : 1e-3)) {
          const hot =
            (data.type === 'resistor' || data.type === 'dimmer') && result.power > E.resistor.ratedPower
          result.status = hot ? 'over' : 'on'
        }
      }
    }
    results[id] = result
  }

  const wireCurrents: Record<string, number> = {}
  for (const w of validWires) {
    const vs = voltages[node(w.source, w.sourceHandle!)]
    const vt = voltages[node(w.target, w.targetHandle!)]
    wireCurrents[w.id] = (vs - vt) * wireG
  }

  return { parts: results, wires: wireCurrents, shortCircuit, hasBattery, batteryCurrent, capacitors, inputs, states }
}
