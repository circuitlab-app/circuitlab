import { COUNTER_OUTPUTS, ELECTRICAL as E, LED_FORWARD_VOLTAGE, PPS_WIDTH, RADIOS, radioFlash, type RadioType } from './catalog'
import type { PartResult, PartStatus } from './solver'
import type { MeterDial, PartData, PartType } from './types'

/*
 * The newer components, outputs, chips and meters. Each one is a small
 * "device" the solver asks three things in every iteration: add your stamps,
 * look at the new voltages and change state if you must, and finally say what
 * you did. Like the diodes and transistors in the solver, a device that has
 * a few states (on / off, LOW / HIGH, active / saturated) starts where it was
 * and is refined until its state agrees with the voltages.
 *
 * Chips that remember something (the latch, the counter, the logic probe)
 * read it from `memory`, the states the previous step left behind, and write
 * what the next step needs into `remember`.
 */

export const DEVICE_TYPES = [
  'zener',
  'pnp',
  'mosfet',
  'optocoupler',
  'laser',
  'irLed',
  'solenoid',
  'pump',
  'bell',
  'barGraph',
  'trafficLight',
  'fan',
  'latch',
  'counter',
  'comparator',
  'hBridge',
  'multimeter',
  'logicProbe',
  'gsm',
  'wifi',
  'bluetooth',
  'lora',
  'gps',
  'canBus',
  'rs485',
  'beacon',
] as const satisfies readonly PartType[]

export type DeviceType = (typeof DEVICE_TYPES)[number]
export const isDevice = (type: PartType): type is DeviceType => (DEVICE_TYPES as readonly string[]).includes(type)

/** What a device may add to the circuit's equations in one iteration. */
export type Mna = {
  /** a conductance `g` from a to b, with `source` amps pushed from b to a inside it */
  stamp: (a: number, b: number, g: number, source?: number) => void
  /** a current from `from` to `to` inside the part, of gm × (V(p) − V(q) − offset) amps */
  vccs: (from: number, to: number, p: number, q: number, gm: number, offset?: number) => void
}

/** The voltage of a circuit node in the latest solve. */
type Volts = (node: number) => number

export type Device = {
  stamp: (m: Mna) => void
  /** after a solve: move to the state the voltages call for; true when anything changed */
  update: (v: Volts, mayFlip: (key: string) => boolean) => boolean
  /** what the part did in this step, noting in `remember` what the next step needs */
  result: (v: Volts, remember: Record<string, number>) => PartResult
}

export type DeviceContext = {
  id: string
  data: PartData
  /** the circuit node of one of the part's terminals */
  pin: (handle: string) => number
  /** seconds since the simulation started */
  time: number
  /** what the parts remembered after the previous step */
  memory: Record<string, number>
}

const blank = (voltage: number, burnt = false): PartResult => ({
  voltage,
  current: 0,
  power: 0,
  level: 0,
  status: burnt ? 'burnt' : 'idle',
  damaged: false,
})

/** A chip's status from its supply: on when powered, otherwise reversed, weak or idle. */
const supplyStatus = (powered: boolean, supply: number): PartStatus =>
  powered ? 'on' : supply < -0.5 ? 'reverse' : supply > 0.5 ? 'weak' : 'idle'

/** How brightly an LED-like part shines for a current, like the solver's LEDs (0..1.3). */
const glow = (amps: number, full: number = E.led.fullCurrent) =>
  amps > 1e-3 ? Math.min(1.3, 0.25 + (0.75 * amps) / full) : 0

/** A diode-like junction from a to b that conducts above `vf`, through a series conductance `g`. */
function junction(a: number, b: number, vf: number, g: number) {
  const j = {
    on: true,
    stamp(m: Mna) {
      if (j.on) m.stamp(a, b, g, vf * g)
    },
    update(v: Volts) {
      const drop = v(a) - v(b)
      if (j.on && drop < vf - 1e-9) j.on = false
      else if (!j.on && drop > vf + 1e-6) j.on = true
      else return false
      return true
    },
    current: (v: Volts) => (j.on ? Math.max(0, (v(a) - v(b) - vf) * g) : 0),
  }
  return j
}

/* ------------------------------------------------------- components */

function zener({ data, pin }: DeviceContext): Device {
  const Z = E.zener
  // the striped end (cathode) is the + terminal: it goes toward + to hold the volts
  const k = pin('a')
  const anode = pin('b')
  const forward = junction(anode, k, Z.forwardVoltage, 1 / Z.forwardResistance)
  const holding = junction(k, anode, Z.voltage, 1 / Z.seriesResistance)
  return {
    stamp(m) {
      if (data.burnt) return
      forward.stamp(m)
      holding.stamp(m)
    },
    update(v) {
      if (data.burnt) return false
      const a = forward.update(v)
      const b = holding.update(v)
      return a || b
    },
    result(v) {
      const result = blank(v(k) - v(anode), data.burnt)
      if (data.burnt) return result
      const held = holding.current(v)
      const leak = forward.current(v)
      result.current = held - leak
      result.power = Math.abs(result.voltage * result.current)
      result.level = held
      result.channels = { holding: held, forward: leak }
      if (result.power > Z.burnPower) {
        result.damaged = true
        result.status = 'over'
      } else if (result.power > Z.hotPower) result.status = 'over'
      else if (held > 5e-4) result.status = 'on'
      else if (leak > 1e-3) result.status = 'reverse'
      return result
    },
  }
}

type TransistorState = 'off' | 'active' | 'saturated'

/** The PNP is the solver's NPN mirrored: current flows from E out of C while a little flows from E out of B. */
function pnp({ data, pin }: DeviceContext): Device {
  const T = E.transistor
  const b = pin('B')
  const c = pin('C')
  const e = pin('E')
  const gbe = 1 / T.baseResistance
  const gm = T.beta * gbe
  let state: TransistorState = 'active'
  const baseCurrent = (v: Volts) => (v(e) - v(b) - T.baseEmitterVoltage) * gbe
  return {
    stamp(m) {
      if (data.burnt || state === 'off') return
      m.stamp(e, b, gbe, T.baseEmitterVoltage * gbe)
      if (state === 'saturated') m.stamp(e, c, 1 / T.saturationResistance)
      else m.vccs(e, c, e, b, gm, T.baseEmitterVoltage)
    },
    update(v) {
      if (data.burnt) return false
      const ib = baseCurrent(v)
      const vec = v(e) - v(c)
      let next = state
      if (state === 'off') {
        if (v(e) - v(b) > T.baseEmitterVoltage + 1e-6) next = 'active'
      } else if (ib < 0) next = 'off'
      else if (state === 'active' && vec < 0.1) next = 'saturated'
      else if (state === 'saturated' && vec / T.saturationResistance > T.beta * ib) next = 'active'
      if (next === state) return false
      state = next
      return true
    },
    result(v) {
      const result = blank(v(e) - v(c), data.burnt)
      if (data.burnt) return result
      const ib = state === 'off' ? 0 : Math.max(0, baseCurrent(v))
      const ic = state === 'off' ? 0 : state === 'saturated' ? result.voltage / T.saturationResistance : T.beta * ib
      result.current = ic
      result.power = result.voltage * ic + T.baseEmitterVoltage * ib
      result.level = ic
      if (ic > T.burnCurrent || ib > T.burnBaseCurrent) {
        result.damaged = true
        result.status = 'over'
      } else if (ic > 1e-3) result.status = 'on'
      return result
    },
  }
}

/** How much a MOSFET conducts for each step of gate drive, 0 … `steps`. */
const mosfetConductance = (step: number) => (step / E.mosfet.steps) ** 2 / E.mosfet.onResistance

/** The gate drive a gate voltage gives, in whole steps so the solve settles quickly. */
export function mosfetStep(vgs: number): number {
  const M = E.mosfet
  if (vgs <= M.threshold) return 0
  return Math.min(M.steps, Math.max(1, Math.round((M.steps * (vgs - M.threshold)) / (M.fullOn - M.threshold))))
}

function mosfet({ id, pin }: DeviceContext): Device {
  const M = E.mosfet
  const g = pin('G')
  const d = pin('D')
  const s = pin('S')
  let step = 0
  return {
    stamp(m) {
      // the gate only listens; a tiny leak keeps a loose gate at 0 V
      m.stamp(g, s, 1 / M.gateResistance)
      if (step > 0) m.stamp(d, s, mosfetConductance(step))
    },
    update(v, mayFlip) {
      const next = mosfetStep(v(g) - v(s))
      if (next === step || !mayFlip(`${id}:gate`)) return false
      step = next
      return true
    },
    result(v) {
      const result = blank(v(d) - v(s))
      result.current = step > 0 ? result.voltage * mosfetConductance(step) : 0
      result.power = Math.abs(result.voltage * result.current)
      result.level = step / M.steps
      result.channels = { gate: v(g) - v(s) }
      // from about 3.2 V on G (so a 3.3 V board's pin is enough) it is properly on; below that only half on
      if (result.power > M.hotPower) result.status = 'over'
      else if (Math.abs(result.current) > 1e-3) result.status = step >= M.steps * 0.6 ? 'on' : 'weak'
      return result
    },
  }
}

function optocoupler({ id, data, pin }: DeviceContext): Device {
  const O = E.optocoupler
  const a = pin('a')
  const k = pin('b')
  const c = pin('C')
  const e = pin('E')
  const gLed = 1 / O.seriesResistance
  const led = junction(a, k, O.forwardVoltage, gLed)
  let state: TransistorState = 'active'
  return {
    stamp(m) {
      if (data.burnt) return
      led.stamp(m)
      if (!led.on || state === 'off') return
      // the light switch passes `transfer` times the LED's current, or less when it is fully on
      if (state === 'saturated') m.stamp(c, e, 1 / O.saturationResistance)
      else m.vccs(c, e, a, k, O.transfer * gLed, O.forwardVoltage)
    },
    update(v, mayFlip) {
      if (data.burnt) return false
      const changed = led.update(v)
      const vce = v(c) - v(e)
      let next = state
      if (!led.on) next = 'off'
      else if (state === 'off') next = 'active'
      else if (state === 'active' && vce < 0.15) next = 'saturated'
      else if (state === 'saturated' && vce / O.saturationResistance > O.transfer * led.current(v)) next = 'active'
      if (next === state || !mayFlip(`${id}:switch`)) return changed
      state = next
      return true
    },
    result(v) {
      const result = blank(v(a) - v(k), data.burnt)
      if (data.burnt) return result
      const lit = led.current(v)
      const vce = v(c) - v(e)
      const through =
        !led.on || state === 'off' ? 0 : state === 'saturated' ? vce / O.saturationResistance : O.transfer * lit
      result.current = lit
      result.power = result.voltage * lit + vce * through
      result.level = glow(lit)
      result.channels = { switch: through }
      if (lit > O.burnCurrent) {
        result.damaged = true
        result.status = 'over'
      } else if (lit > 1e-3) result.status = lit > E.led.overCurrent ? 'over' : 'on'
      else if (result.voltage < -0.5) result.status = 'reverse'
      return result
    },
  }
}

/* ---------------------------------------------------------- outputs */

/** An LED-like part with its own forward voltage and series resistance. */
function lightDevice(
  { data, pin }: DeviceContext,
  vf: number,
  resistance: number,
  judge: (amps: number, result: PartResult) => void,
): Device {
  const a = pin('a')
  const b = pin('b')
  const j = junction(a, b, vf, 1 / resistance)
  return {
    stamp(m) {
      if (!data.burnt) j.stamp(m)
    },
    update: (v) => !data.burnt && j.update(v),
    result(v) {
      const result = blank(v(a) - v(b), data.burnt)
      if (data.burnt) return result
      const amps = j.current(v)
      result.current = amps
      result.power = result.voltage * amps
      judge(amps, result)
      if (amps <= 1e-3 && result.voltage < -0.5) result.status = 'reverse'
      return result
    },
  }
}

const laser = (ctx: DeviceContext) =>
  lightDevice(ctx, E.laser.forwardVoltage, E.laser.seriesResistance, (amps, result) => {
    const L = E.laser
    if (amps > L.burnCurrent) {
      result.damaged = true
      result.status = 'over'
      result.level = 1.3
    } else if (amps > 2e-3) {
      result.level = Math.min(1.3, 0.3 + (0.7 * amps) / 0.035)
      result.status = amps > L.overCurrent ? 'over' : amps < L.weakCurrent ? 'weak' : 'on'
    }
  })

const irLed = (ctx: DeviceContext) =>
  lightDevice(ctx, E.irLed.forwardVoltage, E.led.seriesResistance, (amps, result) => {
    if (amps > E.led.burnCurrent) {
      result.damaged = true
      result.status = 'over'
      result.level = 1.3
    } else if (amps > 1e-3) {
      result.level = glow(amps)
      result.status = amps > E.led.overCurrent ? 'over' : amps < 5e-3 ? 'weak' : 'on'
    }
  })

/** The warning beacon: LEDs behind a built-in resistor, so a board pin can light it fully. */
const beacon = (ctx: DeviceContext) =>
  lightDevice(ctx, E.beacon.forwardVoltage, E.beacon.seriesResistance, (amps, result) => {
    const B = E.beacon
    if (amps > B.burnCurrent) {
      result.damaged = true
      result.status = 'over'
      result.level = 1.3
    } else if (amps > 1e-3) {
      result.level = glow(amps, B.fullCurrent)
      result.status = amps > B.overCurrent ? 'over' : amps < B.weakCurrent ? 'weak' : 'on'
    }
  })

const fan = (ctx: DeviceContext) =>
  lightDevice(ctx, E.fan.forwardVoltage, E.fan.resistance, (amps, result) => {
    const F = E.fan
    const speed = amps > 0 ? result.voltage / F.ratedVoltage : 0
    if (speed >= F.startSpeed) {
      result.level = speed
      result.status = speed > F.overSpeed ? 'over' : speed < 0.5 ? 'weak' : 'on'
    } else if (amps > 2e-3) result.status = 'weak'
  })

/** A coil or motor that is just a resistor between a and b. */
function coilDevice({ pin }: DeviceContext, resistance: number, judge: (result: PartResult) => void): Device {
  const a = pin('a')
  const b = pin('b')
  return {
    stamp: (m) => m.stamp(a, b, 1 / resistance),
    update: () => false,
    result(v) {
      const result = blank(v(a) - v(b))
      result.current = result.voltage / resistance
      result.power = result.voltage * result.current
      judge(result)
      return result
    },
  }
}

const solenoid = (ctx: DeviceContext) =>
  coilDevice(ctx, E.solenoid.resistance, (result) => {
    const S = E.solenoid
    const amps = Math.abs(result.current)
    // the rod is pushed out once the coil is strong enough; it pushes the same either way round
    if (amps >= S.pushCurrent) result.level = Math.min(1.5, amps / S.ratedCurrent)
    result.status = amps > S.hotCurrent ? 'over' : amps >= S.pushCurrent ? 'on' : amps > 0.02 ? 'weak' : 'idle'
  })

const pump = (ctx: DeviceContext) =>
  coilDevice(ctx, E.pump.resistance, (result) => {
    const P = E.pump
    const speed = Math.abs(result.voltage) / P.ratedVoltage
    if (speed >= P.startSpeed) {
      result.level = speed
      result.status = speed > P.overSpeed ? 'over' : speed < 0.5 ? 'weak' : 'on'
    } else if (speed > 0.04) result.status = 'weak'
  })

const bell = (ctx: DeviceContext) =>
  coilDevice(ctx, E.bell.resistance, (result) => {
    const B = E.bell
    const amps = Math.abs(result.current)
    if (amps >= B.ringCurrent) {
      result.level = Math.min(1.5, amps / B.ratedCurrent)
      result.status = amps > B.hotCurrent ? 'over' : 'on'
    } else if (amps > 0.02) result.status = 'weak'
  })

/** How many of the bar graph's bars light for a voltage on IN, as a share of its supply. */
export function barsLit(share: number): number {
  const { bars } = E.barGraph
  return Math.min(bars, Math.max(0, Math.floor(share * bars + 0.02)))
}

function barGraph({ id, pin }: DeviceContext): Device {
  const B = E.barGraph
  const vcc = pin('VCC')
  const gnd = pin('GND')
  const input = pin('IN')
  let powered = true
  let bars = 0
  return {
    stamp(m) {
      m.stamp(vcc, gnd, 1 / B.supplyResistance)
      m.stamp(input, gnd, 1 / B.inputResistance)
      // every lit bar takes its own little current
      if (powered && bars > 0) m.stamp(vcc, gnd, bars / B.barResistance)
    },
    update(v, mayFlip) {
      const supply = v(vcc) - v(gnd)
      const on = supply >= B.minVoltage
      const next = on ? barsLit((v(input) - v(gnd)) / supply) : 0
      if ((on === powered && next === bars) || !mayFlip(id)) return false
      powered = on
      bars = next
      return true
    },
    result(v) {
      const supply = v(vcc) - v(gnd)
      const result = blank(supply)
      result.current = supply / B.supplyResistance + (powered ? (bars * supply) / B.barResistance : 0)
      result.power = supply * result.current
      result.level = powered ? bars : 0
      result.channels = { IN: v(input) - v(gnd) }
      result.status = supplyStatus(powered, supply)
      return result
    },
  }
}

const TRAFFIC = ['R', 'Y', 'G'] as const
const TRAFFIC_FORWARD = { R: LED_FORWARD_VOLTAGE.red, Y: LED_FORWARD_VOLTAGE.yellow, G: LED_FORWARD_VOLTAGE.green }

function trafficLight({ pin }: DeviceContext): Device {
  const T = E.trafficLight
  const gnd = pin('GND')
  const lights = TRAFFIC.map((ch) => ({ ch, node: pin(ch), j: junction(pin(ch), gnd, TRAFFIC_FORWARD[ch], 1 / T.seriesResistance) }))
  return {
    stamp(m) {
      for (const { j } of lights) j.stamp(m)
    },
    update(v) {
      let changed = false
      for (const { j } of lights) if (j.update(v)) changed = true
      return changed
    },
    result(v) {
      const drops = lights.map(({ node }) => v(node) - v(gnd))
      const result = blank(Math.max(...drops))
      const channels: Record<string, number> = {}
      let strongest = 0
      for (const { ch, node, j } of lights) {
        const amps = j.current(v)
        channels[ch] = glow(amps, T.fullCurrent)
        result.current += amps
        result.power += (v(node) - v(gnd)) * amps
        strongest = Math.max(strongest, amps)
      }
      result.channels = channels
      result.level = Math.max(...Object.values(channels))
      if (strongest > 1e-3) result.status = strongest > E.led.overCurrent ? 'over' : strongest < 3e-3 ? 'weak' : 'on'
      else if (Math.max(...drops) < -0.5) result.status = 'reverse'
      return result
    },
  }
}

/* ------------------------------------------------------------ chips */

/**
 * The parts every chip shares: a supply between VCC and GND that must reach
 * `minVoltage`, inputs that only listen (an input is HIGH above half the
 * supply) and outputs joined to + (HIGH) or − (LOW) through a small resistance.
 */
function chipBody(
  { id, pin }: DeviceContext,
  {
    inputs,
    minVoltage = E.logic.minVoltage,
    supplyResistance = E.logic.supplyResistance,
    inputResistance = E.logic.inputResistance,
    outputResistance = E.logic.outputResistance,
  }: {
    inputs: string[]
    minVoltage?: number
    supplyResistance?: number
    inputResistance?: number
    outputResistance?: number
  },
) {
  const vcc = pin('VCC')
  const gnd = pin('GND')
  const g = 1 / outputResistance
  const body = {
    vcc,
    gnd,
    powered: true,
    stamp(m: Mna) {
      m.stamp(vcc, gnd, 1 / supplyResistance)
      for (const input of inputs) m.stamp(pin(input), gnd, 1 / inputResistance)
    },
    drive(m: Mna, output: string, high: boolean) {
      if (!body.powered) return
      if (high) m.stamp(vcc, pin(output), g)
      else m.stamp(pin(output), gnd, g)
    },
    /** re-checks the supply; true when the chip just turned on or off */
    updatePower(v: Volts, mayFlip: (key: string) => boolean) {
      const powered = v(vcc) - v(gnd) >= minVoltage
      if (powered === body.powered || !mayFlip(`${id}:power`)) return false
      body.powered = powered
      return true
    },
    supply: (v: Volts) => v(vcc) - v(gnd),
    high: (v: Volts, input: string) => v(pin(input)) - v(gnd) > (v(vcc) - v(gnd)) / 2,
    /** current pushed out of an output: positive while HIGH and feeding a part */
    out(v: Volts, output: string, high: boolean) {
      if (!body.powered) return 0
      return high ? (v(vcc) - v(pin(output))) * g : (v(gnd) - v(pin(output))) * g
    },
    /** the chip's own current plus everything its HIGH outputs give */
    draw(v: Volts, outputs: [string, boolean][]) {
      const own = body.supply(v) / supplyResistance
      return own + outputs.reduce((sum, [output, high]) => sum + (high ? Math.max(0, body.out(v, output, true)) : 0), 0)
    },
  }
  return body
}

/** SR latch: SET makes Q HIGH, RESET makes it LOW, and with both LOW it keeps what it had. RESET wins a tie. */
export const latchNext = (set: boolean, reset: boolean, q: boolean) => (reset ? false : set ? true : q)

function latch(ctx: DeviceContext): Device {
  const { id, memory } = ctx
  const chip = chipBody(ctx, { inputs: ['S', 'R'] })
  let q = memory[id] === 1
  return {
    stamp(m) {
      chip.stamp(m)
      chip.drive(m, 'Q', q)
    },
    update(v, mayFlip) {
      const power = chip.updatePower(v, mayFlip)
      if (!chip.powered) return power
      const next = latchNext(chip.high(v, 'S'), chip.high(v, 'R'), q)
      if (next === q || !mayFlip(id)) return power
      q = next
      return true
    },
    result(v, remember) {
      const supply = chip.supply(v)
      const result = blank(supply)
      const on = chip.powered
      // without power it forgets
      const stored = on && q
      result.current = chip.draw(v, [['Q', stored]])
      result.power = supply * result.current
      result.level = stored ? 1 : 0
      result.channels = {
        S: on && chip.high(v, 'S') ? 1 : 0,
        R: on && chip.high(v, 'R') ? 1 : 0,
        Q: stored ? 1 : 0,
      }
      result.status = on ? (stored ? 'on' : 'idle') : supplyStatus(false, supply)
      remember[id] = stored ? 1 : 0
      return result
    },
  }
}

/** The output a counter shows after one more pulse on CLK. */
export const counterNext = (count: number) => (count + 1) % COUNTER_OUTPUTS

function counter(ctx: DeviceContext): Device {
  const { id, memory } = ctx
  const chip = chipBody(ctx, { inputs: ['CLK', 'RST'] })
  const before = Math.min(COUNTER_OUTPUTS - 1, Math.max(0, Math.round(memory[id] ?? 0)))
  const clockWas = memory[`${id}:clk`] === 1
  let count = before
  let clock = clockWas
  // a pulse on RST sends it back to 0 at once, even if RST is low again by the end of the solve
  let reset = false
  const outputs = () => Array.from({ length: COUNTER_OUTPUTS }, (_, i): [string, boolean] => [`Q${i}`, i === count])
  return {
    stamp(m) {
      chip.stamp(m)
      for (const [output, high] of outputs()) chip.drive(m, output, high)
    },
    update(v, mayFlip) {
      const power = chip.updatePower(v, mayFlip)
      if (!chip.powered) return power
      clock = chip.high(v, 'CLK')
      if (chip.high(v, 'RST')) reset = true
      // it moves on when CLK goes from LOW to HIGH
      const next = reset ? 0 : clock && !clockWas ? counterNext(before) : before
      if (next === count || !mayFlip(id)) return power
      count = next
      return true
    },
    result(v, remember) {
      const supply = chip.supply(v)
      const result = blank(supply)
      const on = chip.powered
      result.current = chip.draw(v, outputs())
      result.power = supply * result.current
      result.level = on ? count : 0
      result.channels = {
        CLK: on && clock ? 1 : 0,
        RST: on && chip.high(v, 'RST') ? 1 : 0,
        ...Object.fromEntries(outputs().map(([output, high]) => [output, on && high ? 1 : 0])),
      }
      result.status = supplyStatus(on, supply)
      remember[id] = on ? count : 0
      remember[`${id}:clk`] = on && clock ? 1 : 0
      return result
    },
  }
}

function comparator(ctx: DeviceContext): Device {
  const { id, memory, pin } = ctx
  const C = E.comparator
  const chip = chipBody(ctx, { inputs: ['P', 'N'], inputResistance: C.inputResistance })
  let out = memory[id] === 1
  return {
    stamp(m) {
      chip.stamp(m)
      chip.drive(m, 'OUT', out)
    },
    update(v, mayFlip) {
      const power = chip.updatePower(v, mayFlip)
      if (!chip.powered) return power
      // a little stickiness so a tie does not make it flicker
      const diff = v(pin('P')) - v(pin('N'))
      const next = out ? diff > -C.hysteresis : diff > C.hysteresis
      if (next === out || !mayFlip(id)) return power
      out = next
      return true
    },
    result(v, remember) {
      const supply = chip.supply(v)
      const result = blank(supply)
      const on = chip.powered
      const high = on && out
      result.current = chip.draw(v, [['OUT', high]])
      result.power = supply * result.current
      result.level = high ? 1 : 0
      result.channels = { P: v(pin('P')) - v(chip.gnd), N: v(pin('N')) - v(chip.gnd), OUT: high ? 1 : 0 }
      result.status = on ? (high ? 'on' : 'idle') : supplyStatus(false, supply)
      remember[id] = high ? 1 : 0
      return result
    },
  }
}

/** Which way an H-bridge turns its motor: 1 forward (IN1 only), −1 back (IN2 only), 0 stopped. */
export const bridgeDirection = (in1: boolean, in2: boolean) => (in1 === in2 ? 0 : in1 ? 1 : -1)

function hBridge(ctx: DeviceContext): Device {
  const { id, memory } = ctx
  const H = E.hBridge
  const chip = chipBody(ctx, {
    inputs: ['IN1', 'IN2'],
    minVoltage: H.minVoltage,
    supplyResistance: H.supplyResistance,
    outputResistance: H.outputResistance,
  })
  // each motor pin follows its input: IN1 sets M1, IN2 sets M2
  let in1 = memory[`${id}:1`] === 1
  let in2 = memory[`${id}:2`] === 1
  return {
    stamp(m) {
      chip.stamp(m)
      chip.drive(m, 'M1', in1)
      chip.drive(m, 'M2', in2)
    },
    update(v, mayFlip) {
      const power = chip.updatePower(v, mayFlip)
      if (!chip.powered) return power
      const next1 = chip.high(v, 'IN1')
      const next2 = chip.high(v, 'IN2')
      if ((next1 === in1 && next2 === in2) || !mayFlip(id)) return power
      in1 = next1
      in2 = next2
      return true
    },
    result(v, remember) {
      const supply = chip.supply(v)
      const result = blank(supply)
      const on = chip.powered
      const motor = chip.out(v, 'M1', in1)
      result.current = chip.draw(v, [['M1', in1], ['M2', in2]])
      // the bridge itself only warms up a little: the motor gets the rest
      result.power = Math.abs(motor) ** 2 * H.outputResistance * 2 + supply * (supply / H.supplyResistance)
      result.level = on ? bridgeDirection(in1, in2) : 0
      result.channels = { IN1: on && in1 ? 1 : 0, IN2: on && in2 ? 1 : 0, motor: on ? motor : 0 }
      if (!on) result.status = supplyStatus(false, supply)
      else if (Math.abs(motor) > H.hotCurrent) result.status = 'over'
      else result.status = result.level !== 0 ? 'on' : 'idle'
      remember[`${id}:1`] = on && in1 ? 1 : 0
      remember[`${id}:2`] = on && in2 ? 1 : 0
      return result
    },
  }
}

/* ----------------------------------------------------------- meters */

/** The meter's reading when nothing joins its probes on Ω: "OL", open loop. */
export const OPEN_LOOP = -1

function multimeter({ data, pin }: DeviceContext): Device {
  const M = E.multimeter
  const a = pin('a')
  const b = pin('b')
  const dial: MeterDial = data.dial ?? 'volts'
  const ohms = dial === 'ohms' || dial === 'beep'
  return {
    stamp(m) {
      if (dial === 'volts') m.stamp(a, b, 1 / M.voltResistance)
      else if (dial === 'amps') m.stamp(a, b, 1 / M.ampResistance)
      // its own little cell pushes a test current out of the red probe
      else m.stamp(a, b, 1 / M.testResistance, M.testVoltage / M.testResistance)
    },
    update: () => false,
    result(v) {
      const volts = v(a) - v(b)
      const result = blank(volts)
      if (dial === 'volts') {
        result.current = volts / M.voltResistance
        result.level = volts
        if (Math.abs(volts) > 0.01) result.status = volts < 0 ? 'reverse' : 'on'
      } else if (dial === 'amps') {
        const amps = volts / M.ampResistance
        result.current = amps
        result.power = volts * amps
        result.level = amps
        if (Math.abs(amps) > M.maxAmps) result.status = 'over'
        else if (Math.abs(amps) > 5e-4) result.status = amps < 0 ? 'reverse' : 'on'
      } else if (ohms) {
        const test = (M.testVoltage - volts) / M.testResistance
        // a battery in the loop pushes against the test current: the reading means nothing
        const outside = volts < -0.01 || volts > M.testVoltage - 1e-4
        const r = outside || test <= 0 ? Infinity : volts / test
        const open = !Number.isFinite(r) || r > M.openAbove
        result.current = test
        result.level = open ? OPEN_LOOP : Math.max(0, r)
        result.channels = { beep: !open && r < M.beepBelow ? 1 : 0, outside: outside ? 1 : 0 }
        if (!open) result.status = 'on'
      }
      return result
    },
  }
}

/** What a multimeter shows for its reading: the digits and the unit next to them. */
export function meterReading(dial: MeterDial, result: PartResult | undefined): { text: string; unit: string } {
  const value = result?.level ?? (dial === 'ohms' || dial === 'beep' ? OPEN_LOOP : 0)
  switch (dial) {
    case 'volts': {
      const v = Math.abs(value) < 0.005 ? 0 : value
      return { text: Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2), unit: 'V' }
    }
    case 'amps': {
      const a = Math.abs(value) < 5e-4 ? 0 : value
      return Math.abs(a) < 1 ? { text: String(Math.round(a * 1000)), unit: 'mA' } : { text: a.toFixed(2), unit: 'A' }
    }
    case 'ohms':
    case 'beep': {
      if (value === OPEN_LOOP) return { text: 'OL', unit: 'Ω' }
      const digits = (n: number) => (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2))
      if (value >= 1e6) return { text: digits(value / 1e6), unit: 'MΩ' }
      if (value >= 1000) return { text: digits(value / 1000), unit: 'kΩ' }
      return { text: value >= 100 ? value.toFixed(0) : value.toFixed(1), unit: 'Ω' }
    }
  }
}

/** Where the logic probe's tip sits: 1 HIGH, 0 LOW, 0.5 in between (nothing joined, or a weak signal). */
export function probeLevel(share: number): number {
  const P = E.logicProbe
  return share > P.high ? 1 : share < P.low ? 0 : 0.5
}

function logicProbe({ id, pin, time, memory }: DeviceContext): Device {
  const P = E.logicProbe
  const vcc = pin('VCC')
  const gnd = pin('GND')
  const tip = pin('TIP')
  return {
    stamp(m) {
      m.stamp(vcc, gnd, 1 / P.supplyResistance)
      // two big resistors hold a loose tip half way, so it shows neither HIGH nor LOW
      m.stamp(vcc, tip, 1 / P.biasResistance)
      m.stamp(tip, gnd, 1 / P.biasResistance)
    },
    update: () => false,
    result(v, remember) {
      const supply = v(vcc) - v(gnd)
      const result = blank(supply)
      const powered = supply >= P.minVoltage
      result.current = supply / P.supplyResistance
      result.power = supply * result.current
      const level = powered ? probeLevel((v(tip) - v(gnd)) / supply) : 0.5
      const before = memory[id]
      let changed = memory[`${id}:t`] ?? -Infinity
      if (powered && before !== undefined && before !== level) changed = time
      const pulse = powered && time - changed < P.pulseTime
      result.level = level
      result.channels = { high: level === 1 ? 1 : 0, low: level === 0 ? 1 : 0, pulse: pulse ? 1 : 0 }
      result.status = supplyStatus(powered, supply)
      remember[id] = level
      if (Number.isFinite(changed)) remember[`${id}:t`] = changed
      return result
    },
  }
}

/* ------------------------------------------------------- message modules */

/** What a message module is doing, worked out from the clock and what it remembers. */
export type RadioState = {
  /** it has joined its network (the GPS: it has a fix) */
  linked: boolean
  /** a message is going out right now (the GPS: its PPS pin is HIGH) */
  tx: boolean
  /** messages sent since the simulation started */
  sent: number
  /** the SMS module only: how far the text it is sending has got, 0..1, or null */
  progress: number | null
}

/**
 * Steps a message module on by one moment. `up` is how long it has had power
 * (null without it). The SMS module sends one text each time IN goes HIGH, but
 * never two at once: while one is going out, IN is not watched, and IN must go
 * LOW again before the next one. The others send the volts on IN all the time,
 * once every `period`; the GPS pulses its PPS pin at the start of every second.
 */
export function radioStep(
  type: RadioType,
  { up, time, high, sent, armed, since }: { up: number | null; time: number; high: boolean; sent: number; armed: boolean; since: number | null },
): RadioState & { armed: boolean; since: number | null } {
  const spec = RADIOS[type]
  const linked = up !== null && up >= spec.link
  if (type === 'gps') return { linked, tx: linked && time % 1 < PPS_WIDTH, sent, progress: null, armed, since: null }
  if (!spec.onEvent) {
    const live = linked ? up! - spec.link : 0
    return {
      linked,
      tx: linked && live % spec.period < radioFlash(type),
      sent: linked ? sent + Math.floor(live / spec.period) + 1 : sent,
      progress: null,
      armed,
      since: null,
    }
  }
  let count = sent
  let start = since
  // the text that was going out has arrived
  if (start !== null && time - start >= spec.period) {
    count += 1
    start = null
  }
  // without power it cannot finish sending
  if (up === null) start = null
  let ready = armed || !high
  if (linked && start === null && ready && high) {
    start = time
    ready = false
  }
  return {
    linked,
    tx: start !== null,
    sent: count,
    progress: start === null ? null : Math.min(1, (time - start) / spec.period),
    armed: ready,
    since: start,
  }
}

/**
 * The message modules: SMS, Wi-Fi, Bluetooth, LoRa, GPS, CAN bus and RS-485.
 * Each is a small chip on + and − with an input that only listens (the GPS has
 * an output instead). Their state lives in `memory`: when the power came on,
 * and for the SMS module what it has sent.
 */
function radio(ctx: DeviceContext): Device {
  const { id, time, memory, data } = ctx
  const type = data.type as RadioType
  const R = E.radio
  const output = RADIOS[type].output
  const chip = chipBody(ctx, {
    inputs: output ? [] : ['IN'],
    minVoltage: R.minVoltage,
    supplyResistance: R.supplyResistance,
    inputResistance: R.inputResistance,
    outputResistance: R.outputResistance,
  })
  const poweredAt = memory[`${id}:on`]
  // modules that keep a running count (the always-sending ones work it out from the clock)
  const sentBefore = memory[`${id}:sent`] ?? 0
  const step = (powered: boolean, high: boolean) =>
    radioStep(type, {
      up: powered ? time - (poweredAt ?? time) : null,
      time,
      high,
      sent: RADIOS[type].onEvent ? sentBefore : 0,
      armed: memory[`${id}:armed`] !== 0,
      since: memory[`${id}:tx`] ?? null,
    })
  return {
    stamp(m) {
      chip.stamp(m)
      if (output) chip.drive(m, output, step(chip.powered, false).tx)
    },
    update: (v, mayFlip) => chip.updatePower(v, mayFlip),
    result(v, remember) {
      const supply = chip.supply(v)
      const result = blank(supply)
      const on = chip.powered
      // the share of its supply on IN: the value it sends
      const reading = output || !on || supply <= 0 ? 0 : Math.min(1, Math.max(0, (v(ctx.pin('IN')) - v(chip.gnd)) / supply))
      const state = step(on, output ? false : chip.high(v, 'IN'))
      result.current = chip.draw(v, output ? [[output, state.tx]] : [])
      result.power = supply * result.current
      result.level = output ? (on && state.tx ? 1 : 0) : reading
      result.channels = {
        link: state.linked ? 1 : 0,
        tx: on && state.tx ? 1 : 0,
        sent: state.sent,
        value: reading,
        ...(state.progress !== null ? { progress: state.progress } : {}),
        // the GPS counts the satellites it hears: four or more give a fix
        ...(type === 'gps' ? { sats: !on ? 0 : state.linked ? 9 : Math.min(3, Math.floor(time - (poweredAt ?? time))) } : {}),
      }
      result.status = supplyStatus(on, supply)
      if (on) remember[`${id}:on`] = poweredAt ?? time
      if (RADIOS[type].onEvent) {
        remember[`${id}:sent`] = state.sent
        remember[`${id}:armed`] = state.armed ? 1 : 0
        if (state.since !== null) remember[`${id}:tx`] = state.since
      }
      return result
    },
  }
}

const FACTORIES: Record<DeviceType, (ctx: DeviceContext) => Device> = {
  zener,
  pnp,
  mosfet,
  optocoupler,
  laser,
  irLed,
  solenoid,
  pump,
  bell,
  barGraph,
  trafficLight,
  fan,
  latch,
  counter,
  comparator,
  hBridge,
  multimeter,
  logicProbe,
  gsm: radio,
  wifi: radio,
  bluetooth: radio,
  lora: radio,
  gps: radio,
  canBus: radio,
  rs485: radio,
  beacon,
}

/** The device for a part, or null when the solver handles the part itself. */
export function createDevice(ctx: DeviceContext): Device | null {
  return isDevice(ctx.data.type) ? FACTORIES[ctx.data.type](ctx) : null
}
