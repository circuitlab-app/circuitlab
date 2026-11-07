import { describe, expect, it } from 'vitest'
import { PARTS, alarmBeat, partHeight, partWidth, pinModesFor, pinOutput, terminalIds } from './catalog'
import { PRESET_CATEGORIES, PRESET_INFO, PRESET_ORDER, buildPreset, type PresetId } from './presets'
import { DEFAULT_STEP, solveCircuit, type NetPart, type NetWire, type SimResult } from './solver'
import type { PartData, PinMode } from './types'
import { describeBoard } from '@/ai/plan'
// this file's own text: every example must be named in one of its tests
import thisFile from './examples.test.ts?raw'

/*
 * Every example in the gallery is run here the way the app runs it: step by
 * step, each step getting the time, the capacitor voltages and the board
 * inputs of the step before (see useSimulationEngine).
 */

/** Part keys as written in the preset ("board", "siren" …) instead of their random ids. */
const keyOf = (id: string) => id.slice(0, -7)

type Run = {
  /** the result after the last step */
  last: SimResult
  /** every step's result, oldest first */
  steps: SimResult[]
  /** the parts as they were solved, for running on from here */
  parts: NetPart[]
  wires: NetWire[]
}

/** Builds an example, changes some parts (by key) and runs it for `seconds`. */
function run(id: PresetId, seconds = 0.5, set: Record<string, Partial<PartData>> = {}, from?: Run): Run {
  let parts: NetPart[]
  let wires: NetWire[]
  if (from) {
    parts = from.parts.map((p) => ({ id: p.id, data: { ...p.data, ...set[p.id] } }))
    wires = from.wires
  } else {
    const { nodes, edges } = buildPreset(id)
    parts = nodes.map((n) => ({ id: keyOf(n.id), data: { ...n.data, ...set[keyOf(n.id)] } }))
    wires = edges.map((e) => ({ ...e, source: keyOf(e.source), target: keyOf(e.target) }))
  }
  const start = from ? from.steps.length * DEFAULT_STEP : 0
  let previous = from?.last
  const steps: SimResult[] = []
  for (let i = 0; i * DEFAULT_STEP <= seconds + 1e-9; i++) {
    previous = solveCircuit(parts, wires, {
      time: start + i * DEFAULT_STEP,
      dt: DEFAULT_STEP,
      capacitors: previous?.capacitors,
      inputs: previous?.inputs,
      states: previous?.states,
    })
    steps.push(previous)
  }
  return { last: previous!, steps: [...(from?.steps ?? []), ...steps], parts, wires }
}

/** One step at an exact time, after the board has read its sensor (and the chips have settled) once. */
function at(id: PresetId, time: number, set: Record<string, Partial<PartData>> = {}) {
  const { nodes, edges } = buildPreset(id)
  const parts = nodes.map((n) => ({ id: keyOf(n.id), data: { ...n.data, ...set[keyOf(n.id)] } }))
  const wires = edges.map((e) => ({ ...e, source: keyOf(e.source), target: keyOf(e.target) }))
  const first = solveCircuit(parts, wires, { time })
  return solveCircuit(parts, wires, { time, inputs: first.inputs, states: first.states }).parts
}

const on = (r: SimResult, key: string) => r.parts[key].status === 'on'
/** true when the part was on in some steps and off in others: blinking or beeping */
const pulses = (steps: SimResult[], key: string) =>
  steps.some((r) => on(r, key)) && steps.some((r) => r.parts[key].level === 0)

/** The first examples, from before the gallery had shelves. Every later one must show something working as it opens. */
const FIRST_EXAMPLES: PresetId[] = [
  'flashlight',
  'fan',
  'doorbell',
  'led',
  'series',
  'parallel',
  'dimmer',
  'short',
  'arduino',
  'transistor',
  'capacitor',
  'solar',
  'meters',
  'servo',
  'motion',
  'cityTv',
  'goldSign',
  'counter',
]
const NEW_EXAMPLES = PRESET_ORDER.filter((id) => !FIRST_EXAMPLES.includes(id))

/** Examples that show a part working too hard on purpose. */
const SHOWS_TROUBLE: PresetId[] = ['short']

describe('the examples gallery', () => {
  it('puts every example on exactly one shelf, with a small picture of 2 to 4 parts', () => {
    expect(new Set(PRESET_ORDER).size).toBe(PRESET_ORDER.length)
    expect(PRESET_ORDER.length).toBe(Object.keys(PRESET_INFO).length)
    expect(PRESET_ORDER.length).toBeGreaterThanOrEqual(100)
    for (const id of PRESET_ORDER) {
      const info = PRESET_INFO[id]
      expect(PRESET_CATEGORIES).toContain(info.category)
      expect(info.art.length).toBeGreaterThanOrEqual(2)
      expect(info.art.length).toBeLessThanOrEqual(4)
    }
    for (const category of PRESET_CATEGORIES) {
      expect(PRESET_ORDER.filter((id) => PRESET_INFO[id].category === category).length).toBeGreaterThanOrEqual(5)
    }
  })

  it('joins every wire to a real terminal and keeps every card clear of the others', () => {
    for (const id of PRESET_ORDER) {
      const { nodes, edges } = buildPreset(id, { citySign: 'Hello' })
      const byId = new Map(nodes.map((n) => [n.id, n]))
      for (const e of edges) {
        expect(terminalIds(byId.get(e.source)!.data.type), `${id}: ${e.source}:${e.sourceHandle}`).toContain(e.sourceHandle)
        expect(terminalIds(byId.get(e.target)!.data.type), `${id}: ${e.target}:${e.targetHandle}`).toContain(e.targetHandle)
      }
      // cards keep at least a small gap between them
      const boxes = nodes.map((n) => ({
        id: n.id,
        x: n.position.x,
        y: n.position.y,
        w: partWidth(n.data.type, n.data),
        h: partHeight(n.data.type, n.data),
      }))
      for (const a of boxes) {
        for (const b of boxes) {
          if (a === b) continue
          const apart = a.x + a.w + 20 <= b.x || b.x + b.w + 20 <= a.x || a.y + a.h + 20 <= b.y || b.y + b.h + 20 <= a.y
          expect(apart, `${id}: ${a.id} overlaps ${b.id}`).toBe(true)
        }
      }
    }
  })

  it('runs every example for three seconds without a short circuit, a burnt part or a part working too hard', () => {
    for (const id of PRESET_ORDER.filter((p) => !SHOWS_TROUBLE.includes(p))) {
      const { steps } = run(id, 3)
      for (const r of steps) {
        expect(r.shortCircuit, id).toBe(false)
        for (const [key, part] of Object.entries(r.parts)) expect(part.damaged, `${id}: ${key}`).toBe(false)
        for (const [key, part] of Object.entries(r.parts)) expect(part.status, `${id}: ${key}`).not.toBe('over')
        for (const [key, part] of Object.entries(r.parts)) expect(part.status, `${id}: ${key}`).not.toBe('reverse')
        // a board pin asked for too much current
        for (const [key, part] of Object.entries(r.parts)) {
          if (key === 'board' || key === 'esp') expect(part.status, `${id}: ${key}`).not.toBe('over')
        }
      }
    }
  })

  it('shows something working in every new example within two seconds of opening', () => {
    expect(NEW_EXAMPLES.length).toBeGreaterThanOrEqual(90)
    for (const id of NEW_EXAMPLES) {
      const shows = buildPreset(id)
        .nodes.filter((n) => ['output', 'display', 'meter'].includes(PARTS[n.data.type].category))
        .map((n) => keyOf(n.id))
      const { steps } = run(id, 2)
      expect(steps.some((r) => shows.some((key) => r.parts[key].status === 'on')), id).toBe(true)
    }
  })
})

describe('new board programs', () => {
  it('blinks two pins in turn', () => {
    expect(pinOutput('blink', 0.2, false)).toBe(1)
    expect(pinOutput('blink2', 0.2, false)).toBe(0)
    expect(pinOutput('blink', 0.7, false)).toBe(0)
    expect(pinOutput('blink2', 0.7, false)).toBe(1)
  })

  it('lights the three steps one second each, then starts again', () => {
    const lit = (t: number) => (['step1', 'step2', 'step3'] as const).filter((m) => pinOutput(m, t, false) === 1)
    expect(lit(0.5)).toEqual(['step1'])
    expect(lit(1.5)).toEqual(['step2'])
    expect(lit(2.5)).toEqual(['step3'])
    expect(lit(3.5)).toEqual(['step1'])
  })

  it('does the opposite of the sensor: on when it reads low', () => {
    expect(pinOutput('invert', 0, false, 0.2)).toBe(1)
    expect(pinOutput('invert', 0, false, 0.8)).toBe(0)
    expect(pinOutput('invert', 0, true, 0.2)).toBeCloseTo(0.8)
  })

  it('beeps only when the sensor reads high, faster the higher it reads', () => {
    const beeps = (reading: number) =>
      Array.from({ length: 200 }, (_, i) => pinOutput('alarm', i * 0.01, false, reading)).filter(Boolean).length
    expect(beeps(0.3)).toBe(0)
    expect(beeps(0.7)).toBeGreaterThan(80)
    expect(alarmBeat(1)).toBeLessThan(alarmBeat(0.6))
  })

  it('offers the sensor programs only on boards with a sensor input', () => {
    expect(pinModesFor('arduino', 'D13')).toEqual(
      expect.arrayContaining(['blink2', 'step1', 'step2', 'step3', 'follow', 'invert', 'alarm']),
    )
    expect(pinModesFor('arduino', 'D13')).not.toContain('fade')
    expect(pinModesFor('raspberrypi', 'GPIO17')).not.toContain('invert')
    expect(pinModesFor('raspberrypi', 'GPIO17')).toContain('step2')
  })
})

describe('first circuits', () => {
  it('rainbow: four LEDs of four colours all shine', () => {
    const { last } = run('rainbow')
    for (const key of ['l0', 'l1', 'l2', 'l3']) expect(last.parts[key].status, key).toBe('on')
  })

  it('toy car: one switch spins both wheels the same way', () => {
    const { last } = run('toyCar')
    expect(last.parts.left.status).toBe('on')
    expect(last.parts.right.status).toBe('on')
    expect(last.parts.left.level).toBeCloseTo(last.parts.right.level, 1)
    expect(run('toyCar', 0.2, { sw: { closed: false } }).last.parts.left.level).toBe(0)
  })

  it('battery tester: the meter reads the battery, and 1.5 V is too weak for the green light', () => {
    const full = run('batteryTester').last
    expect(full.parts.vm.level).toBeGreaterThan(4.3)
    expect(full.parts.led.status).toBe('on')
    const weak = run('batteryTester', 0.2, { bat: { voltage: 1.5 } }).last
    expect(weak.parts.vm.level).toBeCloseTo(1.5, 1)
    expect(weak.parts.led.level).toBe(0)
  })
})

describe('electronics', () => {
  it('street lamp: on at night, off in daylight', () => {
    const night = run('streetLamp').last
    expect(night.parts.lamp.status).toBe('on')
    expect(night.parts.q.status).toBe('on')
    const dusk = run('streetLamp', 0.2, { ldr: { light: 0.7 } }).last
    expect(dusk.parts.lamp.level).toBeLessThan(night.parts.lamp.level)
    const day = run('streetLamp', 0.2, { ldr: { light: 1 } }).last
    expect(day.parts.lamp.level).toBe(0)
    expect(day.parts.q.status).toBe('idle')
  })

  it('fuse guard: the lamp shines, and a short breaks the fuse before anything else', () => {
    const fine = run('fuseGuard').last
    expect(fine.parts.lamp.status).toBe('on')
    expect(fine.parts.fuse.damaged).toBe(false)
    const shorted = run('fuseGuard', 0.1, { sw: { closed: true } }).last
    expect(shorted.parts.fuse.damaged).toBe(true)
    expect(shorted.parts.lamp.damaged).toBe(false)
  })

  it('solar garden light: the sun fills the capacitor, which keeps the light on after sunset', () => {
    const day = run('solarGarden', 2)
    expect(day.last.parts.led.status).toBe('on')
    expect(day.last.capacitors.cap).toBeGreaterThan(4)
    const dusk = run('solarGarden', 1, { sun: { light: 0 } }, day)
    expect(dusk.last.parts.led.level).toBeGreaterThan(0)
    expect(dusk.last.parts.d.current).toBe(0)
    const night = run('solarGarden', 12, {}, dusk)
    expect(night.last.parts.led.status).not.toBe('on')
  })

  it('noise light: the louder it is, the brighter the lamp', () => {
    const loud = run('noiseLight').last.parts.lamp
    const soft = run('noiseLight', 0.2, { mic: { sense: 0.4 } }).last.parts.lamp
    const quiet = run('noiseLight', 0.2, { mic: { sense: 0.1 } }).last.parts.lamp
    expect(loud.status).toBe('on')
    expect(soft.level).toBeLessThan(loud.level)
    expect(quiet.level).toBe(0)
  })
})

describe('boards and code', () => {
  it('traffic light: red, then green, then yellow', () => {
    const lit = (t: number) =>
      ['red', 'yellow', 'green'].filter((key) => at('trafficLight', t)[key].status === 'on')
    expect(lit(0.5)).toEqual(['red'])
    expect(lit(1.5)).toEqual(['green'])
    expect(lit(2.5)).toEqual(['yellow'])
  })

  it('police lights: red and blue take turns, and the siren rises and falls', () => {
    expect(at('policeLights', 0.25).red.status).toBe('on')
    expect(at('policeLights', 0.25).blue.level).toBe(0)
    expect(at('policeLights', 0.75).red.level).toBe(0)
    expect(at('policeLights', 0.75).blue.status).toBe('on')
    // the siren chip wails without a break, like a real police car
    const { steps, parts } = run('policeLights', 2)
    expect(steps.every((r) => on(r, 'siren'))).toBe(true)
    expect(parts.find((p) => p.id === 'siren')?.data.sound).toBe('wail')
  })

  it('party lights: three lights chase each other, a fourth breathes and the sign shines', () => {
    expect(at('partyLights', 0.5).red.status).toBe('on')
    expect(at('partyLights', 0.5).green.level).toBe(0)
    expect(at('partyLights', 1.5).green.status).toBe('on')
    expect(at('partyLights', 2.5).blue.status).toBe('on')
    expect(at('partyLights', 1).gold.status).toBe('on')
    expect(at('partyLights', 0.5).sign.status).toBe('on')
  })

  it('holiday lights: red and green take turns on the Raspberry Pi, the star breathes', () => {
    expect(at('holidayLights', 0.25).red.status).toBe('on')
    expect(at('holidayLights', 0.25).green.level).toBe(0)
    expect(at('holidayLights', 0.75).green.status).toBe('on')
    expect(at('holidayLights', 1).star.status).toBe('on')
    expect(at('holidayLights', 0.25).sign.status).toBe('on')
  })

  it('train crossing: the gate goes down and the two lights take turns', () => {
    expect(at('railroad', 0.25).gate.level).toBeGreaterThan(0.9)
    expect(at('railroad', 0.25).left.status).toBe('on')
    expect(at('railroad', 0.25).right.level).toBe(0)
    expect(at('railroad', 0.75).right.status).toBe('on')
  })
})

describe('smart gadgets', () => {
  it('night light: on in the dark, off in daylight', () => {
    const dark = run('nightLight').last
    expect(dark.parts.lamp1.status).toBe('on')
    expect(dark.parts.lamp2.status).toBe('on')
    const day = run('nightLight', 0.3, { ldr: { light: 1 } }).last
    expect(day.parts.lamp1.level).toBe(0)
  })

  it('smoke alarm: green in clean air, flashing red and beeps in smoke', () => {
    const clean = run('smokeAlarm', 1)
    expect(on(clean.last, 'safe')).toBe(true)
    expect(clean.steps.every((r) => r.parts.siren.level === 0)).toBe(true)
    const smoke = run('smokeAlarm', 1.5, { sensor: { sense: 0.9 } })
    expect(pulses(smoke.steps.slice(2), 'siren')).toBe(true)
    expect(pulses(smoke.steps.slice(2), 'warn')).toBe(true)
    expect(smoke.last.parts.safe.level).toBe(0)
  })

  it('parking sensor: quiet and green far away, beeping and red up close', () => {
    const far = run('parkingSensor', 1)
    expect(on(far.last, 'far')).toBe(true)
    expect(far.steps.every((r) => r.parts.beeper.level === 0)).toBe(true)
    const close = run('parkingSensor', 1.5, { sensor: { sense: 0.1 } })
    expect(pulses(close.steps.slice(2), 'beeper')).toBe(true)
    expect(on(close.last, 'near')).toBe(true)
    expect(close.last.parts.far.level).toBe(0)
  })

  it('thirsty plant: red and a low bar when dry, green and a high bar when wet', () => {
    const dry = run('plantAlarm').last
    expect(on(dry, 'dry')).toBe(true)
    expect(dry.parts.wet.level).toBe(0)
    expect(dry.parts.screen.status).toBe('on')
    expect(dry.parts.screen.level).toBeLessThan(1.5)
    const wet = run('plantAlarm', 0.5, { sensor: { sense: 0.85 } }).last
    expect(on(wet, 'wet')).toBe(true)
    expect(wet.parts.dry.level).toBe(0)
    expect(wet.parts.screen.level).toBeGreaterThan(3.5)
  })

  it('smart fan: spins on a hot day, faster when hotter, and rests when cool', () => {
    const hot = run('smartFan').last
    expect(hot.parts.fan.status).toBe('on')
    expect(hot.parts.q.damaged).toBe(false)
    const warm = run('smartFan', 0.3, { temp: { sense: 0.6 } }).last
    expect(warm.parts.fan.level).toBeLessThan(hot.parts.fan.level)
    const cool = run('smartFan', 0.3, { temp: { sense: 0.2 } }).last
    expect(cool.parts.fan.level).toBe(0)
  })

  it('automatic door: shut with a red light, wide open with a green light when someone moves', () => {
    const still = run('autoDoor').last
    expect(still.parts.door.level).toBeLessThan(0.05)
    expect(on(still, 'shut')).toBe(true)
    const someone = run('autoDoor', 0.3, { sensor: { sense: 1 } }).last
    expect(someone.parts.door.level).toBeGreaterThan(0.9)
    expect(on(someone, 'open')).toBe(true)
    expect(someone.parts.shut.level).toBe(0)
  })

  it('radar: the servo sweeps, and something close lights the red LED and starts the beeps', () => {
    const quiet = run('radar', 2.5)
    const angles = quiet.steps.map((r) => r.parts.sweep.level)
    expect(Math.min(...angles)).toBeLessThan(0.2)
    expect(Math.max(...angles)).toBeGreaterThan(0.8)
    expect(quiet.steps.every((r) => r.parts.beeper.level === 0)).toBe(true)
    const close = run('radar', 1.5, { sensor: { sense: 0.1 } })
    expect(pulses(close.steps.slice(2), 'beeper')).toBe(true)
    expect(on(close.last, 'target')).toBe(true)
  })

  it('door alarm: green while the door is shut, beeps when it opens', () => {
    const shut = run('doorAlarm', 1)
    expect(on(shut.last, 'safe')).toBe(true)
    expect(shut.steps.every((r) => r.parts.siren.level === 0)).toBe(true)
    const open = run('doorAlarm', 1.5, { reed: { sense: 0 } })
    expect(pulses(open.steps.slice(2), 'siren')).toBe(true)
    expect(open.last.parts.safe.level).toBe(0)
  })

  it('smart home: the screen greets you, the fan cools the room, the porch light waits for someone', () => {
    const home = run('smartHome').last
    expect(home.parts.screen.status).toBe('on')
    expect(home.parts.fan.status).toBe('on')
    expect(home.parts.porch.level).toBe(0)
    const visitor = run('smartHome', 0.5, { sensor: { sense: 1 } })
    expect(on(visitor.last, 'porch')).toBe(true)
    expect(pulses(visitor.steps.slice(2), 'chime')).toBe(true)
  })
})

describe('screens and signs', () => {
  it('thermometer: the screen shows more volts when it gets hotter', () => {
    const warm = run('thermometer').last.parts.digits
    const hot = run('thermometer', 0.2, { temp: { sense: 0.9 } }).last.parts.digits
    expect(warm.status).toBe('on')
    expect(warm.level).toBeGreaterThan(2)
    expect(hot.level).toBeGreaterThan(warm.level + 1)
  })

  it('scoreboard: the sign and the game clock both light from one battery', () => {
    const { last } = run('scoreboard')
    expect(last.parts.sign.status).toBe('on')
    expect(last.parts.clock.status).toBe('on')
  })

  it('smart doorbell: the screen is always on and the bell rings while the button is held', () => {
    const idle = run('doorbellScreen').last
    expect(idle.parts.screen.status).toBe('on')
    expect(idle.parts.bell.level).toBe(0)
    expect(run('doorbellScreen', 0.1, { btn: { pressed: true } }).last.parts.bell.status).toBe('on')
  })

  it('bus stop board: sunlight is enough for both screens', () => {
    const { last } = run('busStop')
    expect(last.parts.board.status).toBe('on')
    expect(last.parts.clock.status).toBe('on')
  })

  it('pocket TV: on with the switch, off without it', () => {
    expect(run('pocketTv').last.parts.tv.status).toBe('on')
    expect(run('pocketTv', 0.1, { power: { closed: false } }).last.parts.tv.status).toBe('idle')
  })
})

/** The most a part reached, and the least, over a run. */
const most = (steps: SimResult[], key: string) => Math.max(...steps.map((r) => r.parts[key].level))
const least = (steps: SimResult[], key: string) => Math.min(...steps.map((r) => r.parts[key].level))
const silent = (steps: SimResult[], key: string) => steps.every((r) => r.parts[key].level === 0)

describe('first circuits, second batch', () => {
  it('hair dryer: the fan and the hot coil each have their own switch', () => {
    const both = run('hairDryer').last
    expect(on(both, 'fan')).toBe(true)
    expect(on(both, 'heater')).toBe(true)
    const cool = run('hairDryer', 0.2, { heatSw: { closed: false } }).last
    expect(cool.parts.heater.level).toBe(0)
    expect(on(cool, 'fan')).toBe(true)
  })

  it('bike: the light stays on, the bell rings while the button is held', () => {
    const riding = run('bikeBell').last
    expect(on(riding, 'light')).toBe(true)
    expect(riding.parts.ring.level).toBe(0)
    expect(on(run('bikeBell', 0.1, { bell: { pressed: true } }).last, 'ring')).toBe(true)
  })

  it('car lights: one switch lights two white and two red LEDs', () => {
    const lit = run('carLights').last
    for (const key of ['headL', 'headR', 'tailL', 'tailR']) expect(on(lit, key), key).toBe(true)
    const off = run('carLights', 0.1, { sw: { closed: false } }).last
    for (const key of ['headL', 'headR', 'tailL', 'tailR']) expect(off.parts[key].level, key).toBe(0)
  })

  it('Morse key: the screen shows the code, the key beeps and flashes together', () => {
    const idle = run('morseKey').last
    expect(on(idle, 'card')).toBe(true)
    expect(idle.parts.beep.level).toBe(0)
    expect(idle.parts.flash.level).toBe(0)
    const tap = run('morseKey', 0.1, { key: { pressed: true } }).last
    expect(on(tap, 'beep')).toBe(true)
    expect(on(tap, 'flash')).toBe(true)
  })
})

describe('electronics, second batch', () => {
  it('knob dimmer: turning the knob down dims the LED, and all the way up is still safe', () => {
    const bright = run('knobDimmer').last.parts.led
    const dim = run('knobDimmer', 0.1, { knob: { level: 0.2 } }).last.parts.led
    const full = run('knobDimmer', 0.1, { knob: { level: 1 } }).last.parts.led
    expect(bright.status).toBe('on')
    expect(dim.level).toBeLessThan(bright.level)
    expect(full.status).toBe('on')
  })

  it('one-way street: the diode pointing the right way lights its lamp, the other blocks', () => {
    const { last } = run('diodeCheck')
    expect(on(last, 'lit')).toBe(true)
    expect(last.parts.dark.level).toBe(0)
    expect(last.parts.shut.current).toBe(0)
  })

  it('relay switch: the small switch runs the lamp on the other battery', () => {
    const closed = run('relayLamp').last
    expect(closed.parts.relay.level).toBe(1)
    expect(on(closed, 'lamp')).toBe(true)
    const open = run('relayLamp', 0.1, { sw: { closed: false } }).last
    expect(open.parts.relay.level).toBe(0)
    expect(open.parts.lamp.level).toBe(0)
  })

  it('safe power supply: a short only makes it hold the current at its limit', () => {
    const fine = run('safeShort').last
    expect(on(fine, 'lamp')).toBe(true)
    expect(fine.parts.ps.status).toBe('on')
    const shorted = run('safeShort', 0.2, { sw: { closed: true } })
    expect(shorted.steps.every((r) => !r.shortCircuit)).toBe(true)
    expect(shorted.last.parts.ps.status).toBe('over')
    expect(shorted.last.parts.amm.level).toBeCloseTo(0.5, 1)
    expect(shorted.last.parts.lamp.level).toBe(0)
    for (const part of Object.values(shorted.last.parts)) expect(part.damaged).toBe(false)
  })

  it('phone charger: 9 V in, a steady 5 V out; a 4.5 V battery is not enough', () => {
    const nine = run('phoneCharger').last
    expect(nine.parts.vm.level).toBeCloseTo(5, 1)
    expect(on(nine, 'phone')).toBe(true)
    expect(nine.parts.reg.status).toBe('on')
    const weak = run('phoneCharger', 0.1, { bat: { voltage: 4.5 } }).last
    expect(weak.parts.vm.level).toBeLessThan(3)
    expect(weak.parts.phone.status).not.toBe('on')
  })

  it('hallway timer light: switched off, it stays on for a while and then goes out', () => {
    const on1 = run('delayLight', 1)
    expect(on(on1.last, 'lamp')).toBe(true)
    const later = run('delayLight', 3, { sw: { closed: false } }, on1)
    expect(later.last.parts.lamp.level).toBeGreaterThan(0)
    const dark = run('delayLight', 30, {}, later)
    expect(dark.last.parts.lamp.level).toBe(0)
  })
})

describe('science lab', () => {
  it('scope knob: the line sits at the knob’s share of the battery', () => {
    const middle = run('scopeKnob').last.parts.scope
    const low = run('scopeKnob', 0.1, { knob: { level: 0.2 } }).last.parts.scope
    expect(middle.status).toBe('on')
    expect(middle.level).toBeCloseTo(4.5 * 0.6, 0)
    expect(low.level).toBeLessThan(middle.level - 1)
  })

  it('light meter: more light, more volts', () => {
    const dim = run('lightMeter', 0.1, { ldr: { light: 0.1 } }).last.parts.vm.level
    const room = run('lightMeter').last.parts.vm.level
    const sun = run('lightMeter', 0.1, { ldr: { light: 1 } }).last.parts.vm.level
    expect(dim).toBeLessThan(room)
    expect(room).toBeLessThan(sun)
  })

  it('sun meter: the panel’s volts and current fall when a cloud comes', () => {
    const sunny = run('solarMeter').last
    expect(on(sunny, 'led')).toBe(true)
    expect(sunny.parts.vm.level).toBeGreaterThan(3)
    const cloudy = run('solarMeter', 0.1, { sun: { light: 0.2 } }).last
    expect(cloudy.parts.amm.level).toBeLessThan(sunny.parts.amm.level)
  })

  it("Ohm's law: twice the volts, twice the current", () => {
    const six = run('ohmsLaw').last
    expect(six.parts.vm.level).toBeCloseTo(6, 1)
    expect(six.parts.amm.level).toBeCloseTo(0.006, 3)
    const twelve = run('ohmsLaw', 0.1, { ps: { voltage: 12 } }).last
    expect(twelve.parts.amm.level / six.parts.amm.level).toBeCloseTo(2, 1)
  })

  it('magnet lab: more volts make a stronger magnet, and the limit keeps it from getting hot', () => {
    const three = run('magnetLab').last.parts.magnet
    expect(three.status).toBe('on')
    const nine = run('magnetLab', 0.2, { ps: { voltage: 9 } }).last
    expect(nine.parts.magnet.level).toBeGreaterThan(three.level)
    expect(nine.parts.ps.status).toBe('over')
    expect(nine.parts.magnet.status).toBe('on')
  })

  it('square wave: the scope jumps between 9 V and 0 V with the LED', () => {
    expect(at('scopeSquare', 0.25).scope.level).toBeGreaterThan(8)
    expect(at('scopeSquare', 0.25).led.status).toBe('on')
    expect(at('scopeSquare', 0.75).scope.level).toBeLessThan(0.5)
    expect(at('scopeSquare', 0.75).led.level).toBe(0)
  })

  it('capacitor charging: fast at first, then slower, and the button empties it', () => {
    const fill = run('scopeCap', 6)
    const v = (t: number) => fill.steps[Math.round(t / DEFAULT_STEP)].parts.scope.level
    expect(v(1) - v(0)).toBeGreaterThan(v(5) - v(4))
    expect(v(6)).toBeGreaterThan(4)
    const empty = run('scopeCap', 1, { drain: { pressed: true } }, fill)
    expect(empty.last.parts.scope.level).toBeLessThan(1)
  })

  it('breathing wave: the scope draws the fading pin rising and falling', () => {
    const { steps } = run('scopeBreath', 2.5)
    expect(least(steps, 'scope')).toBeLessThan(1)
    expect(most(steps, 'scope')).toBeGreaterThan(4)
  })
})

describe('logic and chips', () => {
  it('555 flasher: the two lights take turns', () => {
    expect(at('flasher555', 0.25).right.status).toBe('on')
    expect(at('flasher555', 0.25).left.level).toBe(0)
    expect(at('flasher555', 0.75).left.status).toBe('on')
    expect(at('flasher555', 0.75).right.level).toBe(0)
  })

  it('dark lamp: NOT turns the light on in the dark and off in daylight', () => {
    expect(on(run('darkLamp').last, 'lamp')).toBe(true)
    expect(run('darkLamp', 0.1, { ldr: { light: 1 } }).last.parts.lamp.level).toBe(0)
  })

  it('stair light: either switch changes it', () => {
    expect(on(run('stairLight').last, 'lamp')).toBe(true)
    expect(run('stairLight', 0.1, { down: { closed: true } }).last.parts.lamp.level).toBe(0)
    expect(on(run('stairLight', 0.1, { up: { closed: false }, down: { closed: true } }).last, 'lamp')).toBe(true)
    expect(run('stairLight', 0.1, { up: { closed: false } }).last.parts.lamp.level).toBe(0)
  })

  it('safe lock: red until both buttons are held, then green', () => {
    const shut = run('safeLock').last
    expect(on(shut, 'locked')).toBe(true)
    expect(shut.parts.open.level).toBe(0)
    expect(on(run('safeLock', 0.1, { keyA: { pressed: true } }).last, 'locked')).toBe(true)
    const both = run('safeLock', 0.1, { keyA: { pressed: true }, keyB: { pressed: true } }).last
    expect(on(both, 'open')).toBe(true)
    expect(both.parts.locked.level).toBe(0)
  })

  it('two-door bell: either button rings, and the waiting light goes out while it rings', () => {
    const waiting = run('twoDoors').last
    expect(on(waiting, 'ready')).toBe(true)
    expect(waiting.parts.bell.level).toBe(0)
    for (const door of ['front', 'back']) {
      const ring = run('twoDoors', 0.1, { [door]: { pressed: true } }).last
      expect(on(ring, 'bell'), door).toBe(true)
      expect(ring.parts.ready.status, door).not.toBe('on')
    }
  })

  it('adding machine: 1 + 1 = 10, 1 + 0 = 1, 0 + 0 = 0', () => {
    const two = run('halfAdder').last
    expect(on(two, 'carry')).toBe(true)
    expect(two.parts.sum.level).toBe(0)
    const one = run('halfAdder', 0.1, { b: { closed: false } }).last
    expect(on(one, 'sum')).toBe(true)
    expect(one.parts.carry.level).toBe(0)
    const zero = run('halfAdder', 0.1, { a: { closed: false }, b: { closed: false } }).last
    expect(zero.parts.sum.level + zero.parts.carry.level).toBe(0)
  })

  it('seat belt beeper: beeps until the belt is clicked in', () => {
    const open = run('seatbelt', 1.5)
    expect(pulses(open.steps, 'beep')).toBe(true)
    expect(pulses(open.steps, 'warn')).toBe(true)
    expect(silent(run('seatbelt', 1.5, { belt: { closed: true } }).steps, 'beep')).toBe(true)
  })
})

describe('boards and code, second batch', () => {
  it('fireflies: different ones glow at different times', () => {
    const lit = (t: number) => ['fly1', 'fly2', 'fly3', 'fly4', 'fly5', 'fly6'].filter((k) => at('fireflies', t)[k].status === 'on')
    expect(lit(0.25)).not.toEqual(lit(0.75))
    expect(lit(0.75)).not.toEqual(lit(1.75))
    expect(lit(0.25).length).toBeGreaterThan(0)
  })

  it('light chaser: the light runs along the row, step by step', () => {
    const lit = (t: number) => ['l1', 'l2', 'l3', 'l4', 'l5', 'l6'].filter((k) => at('chaser', t)[k].status === 'on')
    expect(lit(0.5)).toEqual(['l1', 'l4'])
    expect(lit(1.5)).toEqual(['l2', 'l5'])
    expect(lit(2.5)).toEqual(['l3', 'l6'])
  })
})

describe('smart gadgets, second batch', () => {
  it('rain alarm: green while dry, blue and beeps when it rains', () => {
    const dry = run('rainAlert', 1)
    expect(on(dry.last, 'dry')).toBe(true)
    expect(silent(dry.steps, 'beeper')).toBe(true)
    const rain = run('rainAlert', 1.5, { sensor: { sense: 0.9 } })
    expect(pulses(rain.steps.slice(2), 'beeper')).toBe(true)
    expect(on(rain.last, 'rain')).toBe(true)
    expect(rain.last.parts.dry.level).toBe(0)
  })

  it('laser alarm: calm while the beam shines, beeps when something blocks it', () => {
    const calm = run('laserAlarm', 1)
    expect(on(calm.last, 'safe')).toBe(true)
    expect(silent(calm.steps, 'siren')).toBe(true)
    const blocked = run('laserAlarm', 1.5, { beam: { light: 0.2 } })
    expect(pulses(blocked.steps.slice(2), 'siren')).toBe(true)
    expect(blocked.last.parts.safe.level).toBe(0)
  })

  it('baby monitor: green while the baby sleeps, red and beeps when it cries', () => {
    const quiet = run('babyMonitor', 1)
    expect(on(quiet.last, 'calm')).toBe(true)
    expect(on(quiet.last, 'screen')).toBe(true)
    expect(silent(quiet.steps, 'beeper')).toBe(true)
    const crying = run('babyMonitor', 1.5, { sensor: { sense: 0.9 } })
    expect(pulses(crying.steps.slice(2), 'beeper')).toBe(true)
    expect(pulses(crying.steps.slice(2), 'cry')).toBe(true)
  })

  it('watering robot: the pump runs while the soil is dry and stops when it is wet', () => {
    const dry = run('greenhouse').last
    expect(on(dry, 'pump')).toBe(true)
    expect(on(dry, 'thirsty')).toBe(true)
    const wet = run('greenhouse', 0.5, { sensor: { sense: 0.8 } }).last
    expect(wet.parts.pump.level).toBe(0)
    expect(on(wet, 'happy')).toBe(true)
  })
})

describe('sound and music', () => {
  it('piano: each key plays its own note', () => {
    const idle = run('piano').last
    expect(on(idle, 'power')).toBe(true)
    for (const key of ['low', 'mid', 'high']) expect(idle.parts[key].level, key).toBe(0)
    const middle = run('piano', 0.1, { key2: { pressed: true } }).last
    expect(on(middle, 'mid')).toBe(true)
    expect(middle.parts.low.level).toBe(0)
    expect(middle.parts.high.level).toBe(0)
  })

  it('metronome: a beep and a flash on every beat, twice as many when set fast', () => {
    const beats = (steps: SimResult[]) => steps.filter((r, i) => i > 0 && on(r, 'tick') && !on(steps[i - 1], 'tick')).length
    const medium = run('metronome', 3)
    expect(pulses(medium.steps, 'beat')).toBe(true)
    expect(beats(run('metronome', 3, { timer: { rate: 2 } }).steps)).toBe(2 * beats(medium.steps))
  })

  it('siren: the high and the low speaker take turns', () => {
    const nee = at('siren', 0.1)
    const naw = at('siren', 0.35)
    expect(nee.nee.status).toBe('on')
    expect(nee.nee.level).toBeGreaterThan(5 * nee.naw.level)
    expect(naw.naw.status).toBe('on')
    expect(naw.naw.level).toBeGreaterThan(5 * naw.nee.level)
  })

  it('music box: low, middle and high notes play one after another', () => {
    const playing = (t: number) => ['low', 'mid', 'high'].filter((k) => at('musicBox', t)[k].status === 'on')
    expect(playing(0.5)).toEqual(['low'])
    expect(playing(1.5)).toEqual(['mid'])
    expect(playing(2.5)).toEqual(['high'])
  })

  it('morning bird: quiet with the blue light at night, sings when the sun comes up', () => {
    const night = run('morningBird', 1)
    expect(on(night.last, 'moon')).toBe(true)
    expect(silent(night.steps, 'bird')).toBe(true)
    const morning = run('morningBird', 1.5, { ldr: { light: 0.9 } })
    expect(pulses(morning.steps.slice(2), 'bird')).toBe(true)
    expect(morning.last.parts.moon.level).toBe(0)
  })

  it('ambulance: red and white take turns and the hi-lo siren never stops', () => {
    expect(at('ambulance', 0.25).red.status).toBe('on')
    expect(at('ambulance', 0.25).white.level).toBe(0)
    expect(at('ambulance', 0.75).white.status).toBe('on')
    const { steps, parts } = run('ambulance', 2)
    expect(steps.every((r) => on(r, 'siren'))).toBe(true)
    expect(parts.find((p) => p.id === 'siren')?.data.sound).toBe('hilo')
  })

  it('laser alarm yelps like a police car', () => {
    expect(run('laserAlarm', 0.1).parts.find((p) => p.id === 'siren')?.data.sound).toBe('yelp')
  })

  it('ding-dong: press for the high note, let go for the low one', () => {
    const idle = run('dingDong')
    expect(on(idle.last, 'power')).toBe(true)
    const pressed = run('dingDong', 0.5, { press: { pressed: true } }, idle)
    expect(on(pressed.last, 'ding')).toBe(true)
    expect(pressed.last.parts.ding.level).toBeGreaterThan(pressed.last.parts.dong.level)
    const released = run('dingDong', 0.15, { press: { pressed: false } }, pressed)
    expect(released.last.parts.ding.level).toBe(0)
    expect(on(released.last, 'dong')).toBe(true)
    const later = run('dingDong', 2, {}, released)
    expect(later.last.parts.dong.status).not.toBe('on')
  })
})

describe('motion and robots', () => {
  it('toothbrush: shakes while switched on', () => {
    expect(on(run('toothbrush').last, 'brush')).toBe(true)
    expect(run('toothbrush', 0.1, { sw: { closed: false } }).last.parts.brush.level).toBe(0)
  })

  it('crane: the magnet holds, the winch lifts, and the magnet lets go when switched off', () => {
    const holding = run('crane').last
    expect(on(holding, 'magnet')).toBe(true)
    expect(holding.parts.winch.level).toBe(0)
    const lifting = run('crane', 0.1, { winchSw: { closed: true } }).last
    expect(on(lifting, 'winch')).toBe(true)
    expect(on(lifting, 'magnet')).toBe(true)
    expect(run('crane', 0.1, { magnetSw: { closed: false } }).last.parts.magnet.level).toBeCloseTo(0, 3)
  })

  it('fan speed knob: the knob sets how fast the fan spins', () => {
    const fast = run('fanKnob').last.parts.fan
    const slow = run('fanKnob', 0.1, { knob: { level: 0.45 } }).last.parts.fan
    const stopped = run('fanKnob', 0.1, { knob: { level: 0.1 } }).last.parts.fan
    expect(fast.status).toBe('on')
    expect(slow.level).toBeLessThan(fast.level)
    expect(stopped.level).toBe(0)
  })

  it('robot arm: each servo follows its own knob', () => {
    const { last } = run('robotArm')
    expect(last.parts.arm.level).toBeCloseTo(0.3, 1)
    expect(last.parts.claw.level).toBeCloseTo(0.7, 1)
    expect(run('robotArm', 0.1, { knob1: { level: 0.9 } }).last.parts.arm.level).toBeCloseTo(0.9, 1)
  })

  it('ringing phone: the screen shows the call and the phone buzzes on and off', () => {
    const { steps, last } = run('phoneBuzz', 2)
    expect(on(last, 'screen')).toBe(true)
    expect(pulses(steps, 'buzz')).toBe(true)
    expect(last.parts.reg.status).toBe('on')
  })

  it('robot head: blue eyes, a turning head and a beep-boop voice', () => {
    const { steps, last } = run('robotHead', 2.5)
    expect(on(last, 'eyeL')).toBe(true)
    expect(on(last, 'eyeR')).toBe(true)
    expect(least(steps, 'neck')).toBeLessThan(0.2)
    expect(most(steps, 'neck')).toBeGreaterThan(0.8)
    expect(at('robotHead', 0.25).beep.status).toBe('on')
    expect(at('robotHead', 0.25).boop.level).toBe(0)
    expect(at('robotHead', 0.75).boop.status).toBe('on')
  })

  it('conveyor belt: START keeps it running after you let go, STOP stops it', () => {
    const idle = run('conveyor')
    expect(on(idle.last, 'ready')).toBe(true)
    expect(idle.last.parts.belt.level).toBe(0)
    const started = run('conveyor', 0.2, { start: { pressed: true } }, idle)
    expect(on(started.last, 'belt')).toBe(true)
    const runs = run('conveyor', 0.5, { start: { pressed: false } }, started)
    expect(on(runs.last, 'belt')).toBe(true)
    expect(runs.last.parts.relay.level).toBe(1)
    const stopped = run('conveyor', 0.2, { stop: { closed: false } }, runs)
    expect(stopped.last.parts.belt.level).toBe(0)
    const rested = run('conveyor', 0.2, { stop: { closed: true } }, stopped)
    expect(rested.last.parts.belt.level).toBe(0)
  })

  it('gas pedal: press further, the wheels spin faster and the screen shows more', () => {
    const fast = run('gasPedal').last
    const slow = run('gasPedal', 0.1, { pedal: { level: 0.45 } }).last
    expect(on(fast, 'wheels')).toBe(true)
    expect(on(fast, 'speed')).toBe(true)
    expect(slow.parts.wheels.level).toBeLessThan(fast.parts.wheels.level)
    expect(slow.parts.speed.level).toBeLessThan(fast.parts.speed.level)
  })

  it('robot car: drives far from walls, slows down nearer, stops and beeps at the wall', () => {
    const far = run('robotCar', 1)
    expect(on(far.last, 'left')).toBe(true)
    expect(on(far.last, 'right')).toBe(true)
    expect(silent(far.steps, 'beeper')).toBe(true)
    const nearer = run('robotCar', 0.5, { sensor: { sense: 0.45 } }).last
    expect(nearer.parts.left.level).toBeLessThan(far.last.parts.left.level)
    const wall = run('robotCar', 1.5, { sensor: { sense: 0.03 } })
    expect(wall.last.parts.left.level).toBe(0)
    expect(wall.last.parts.right.level).toBe(0)
    expect(pulses(wall.steps.slice(2), 'beeper')).toBe(true)
  })
})

describe('home and city', () => {
  it('lighthouse: one long flash every two seconds', () => {
    expect(at('lighthouse', 0.5).beam1.status).toBe('on')
    expect(at('lighthouse', 0.5).beam2.status).toBe('on')
    expect(at('lighthouse', 1.5).beam1.level).toBe(0)
    expect(at('lighthouse', 2.5).beam1.status).toBe('on')
  })

  it('fridge light: off while the door is shut, on when it opens', () => {
    const shut = run('fridgeLight').last
    expect(on(shut, 'cold')).toBe(true)
    expect(shut.parts.inside.level).toBe(0)
    const open = run('fridgeLight', 0.1, { door: { sense: 0 } }).last
    expect(on(open, 'inside')).toBe(true)
    expect(open.parts.cold.level).toBe(0)
  })

  it('mood lamp: each knob sets one colour', () => {
    const pink = run('moodLamp').last.parts.lamp
    expect(pink.status).toBe('on')
    expect(pink.channels!.R).toBeGreaterThan(pink.channels!.G)
    const lessRed = run('moodLamp', 0.1, { redKnob: { level: 0.2 } }).last.parts.lamp
    expect(lessRed.channels!.R).toBeLessThan(pink.channels!.R)
    const moreGreen = run('moodLamp', 0.1, { greenKnob: { level: 0.95 } }).last.parts.lamp
    expect(moreGreen.channels!.G).toBeGreaterThan(pink.channels!.G)
  })

  it('bike lights: steady white at the front, flashing red at the back', () => {
    const { steps, last } = run('bikeLights', 2)
    expect(steps.every((r) => on(r, 'front'))).toBe(true)
    expect(pulses(steps, 'back1')).toBe(true)
    expect(pulses(steps, 'back2')).toBe(true)
    const off = run('bikeLights', 0.5, { sw: { closed: false } })
    expect(silent(off.steps, 'front')).toBe(true)
    expect(silent(off.steps, 'back1')).toBe(true)
    expect(last.parts.timer.status).toBe('on')
  })

  it('alarm clock: the clock runs, and the alarm beeps once it is switched on', () => {
    const quiet = run('alarmClock', 1.5)
    expect(on(quiet.last, 'clock')).toBe(true)
    expect(silent(quiet.steps, 'beeper')).toBe(true)
    expect(pulses(run('alarmClock', 1.5, { alarm: { closed: true } }).steps, 'beeper')).toBe(true)
  })

  it('Christmas tree: the lights take turns and the star turns red, green, then blue', () => {
    const star = (t: number) => at('christmasTree', t).star.channels!
    expect(star(0.5).R).toBeGreaterThan(0.5)
    expect(star(0.5).G + star(0.5).B).toBe(0)
    expect(star(1.5).G).toBeGreaterThan(0.5)
    expect(star(2.5).B).toBeGreaterThan(0.5)
    expect(at('christmasTree', 0.25).red.status).toBe('on')
    expect(at('christmasTree', 0.25).green.level).toBe(0)
    expect(at('christmasTree', 0.75).green.status).toBe('on')
    expect(at('christmasTree', 0.5).sign.status).toBe('on')
  })

  it('crossing: cars go until the button is held, then people walk to the beeps', () => {
    const cars = run('crossing', 1)
    expect(on(cars.last, 'carsGo')).toBe(true)
    expect(on(cars.last, 'wait')).toBe(true)
    expect(cars.last.parts.walk.level).toBe(0)
    expect(silent(cars.steps, 'beeper')).toBe(true)
    const people = run('crossing', 1.5, { press: { pressed: true } })
    expect(on(people.last, 'carsStop')).toBe(true)
    expect(on(people.last, 'walk')).toBe(true)
    expect(people.last.parts.carsGo.level).toBe(0)
    expect(pulses(people.steps.slice(2), 'beeper')).toBe(true)
  })

  it('garden lamp: the relay turns the big lamp on at night and off in daylight', () => {
    const night = run('gardenLamp').last
    expect(night.parts.relay.level).toBe(1)
    expect(on(night, 'lamp')).toBe(true)
    const day = run('gardenLamp', 0.5, { ldr: { light: 1 } }).last
    expect(day.parts.relay.level).toBe(0)
    expect(day.parts.lamp.level).toBe(0)
  })
})

describe('games', () => {
  it('stopwatch: counts while switched on', () => {
    expect(on(run('stopwatch').last, 'watch')).toBe(true)
    expect(run('stopwatch', 0.1, { sw: { closed: false } }).last.parts.watch.status).toBe('idle')
  })

  it('steady hands: the green light says go, and tipping it buzzes', () => {
    const level = run('steadyHand').last
    expect(on(level, 'go')).toBe(true)
    expect(level.parts.buzz.level).toBe(0)
    expect(on(run('steadyHand', 0.1, { tilt: { sense: 1 } }).last, 'buzz')).toBe(true)
  })

  it('quiz board: only the right answer lights green and rings', () => {
    const asking = run('quizBoard').last
    expect(on(asking, 'question')).toBe(true)
    for (const wrong of ['a', 'c']) {
      const r = run('quizBoard', 0.1, { [wrong]: { pressed: true } }).last
      expect(on(r, 'wrong'), wrong).toBe(true)
      expect(r.parts.right.level, wrong).toBe(0)
      expect(r.parts.bell.level, wrong).toBe(0)
    }
    const right = run('quizBoard', 0.1, { b: { pressed: true } }).last
    expect(on(right, 'right')).toBe(true)
    expect(on(right, 'bell')).toBe(true)
    expect(right.parts.wrong.level).toBe(0)
  })

  it('shout meter: louder gives a bigger number and a higher line', () => {
    const talk = run('shoutMeter').last
    const shout = run('shoutMeter', 0.1, { mic: { sense: 0.95 } }).last
    expect(on(talk, 'meter')).toBe(true)
    expect(on(talk, 'graph')).toBe(true)
    expect(shout.parts.meter.level).toBeGreaterThan(talk.parts.meter.level + 1.5)
    expect(shout.parts.graph.level).toBeGreaterThan(talk.parts.graph.level + 1.5)
  })

  it('disco: the light turns red, green and blue while the speakers go boom and tick', () => {
    const ball = (t: number) => at('disco', t).ball.channels!
    expect(ball(0.5).R).toBeGreaterThan(0.5)
    expect(ball(1.5).G).toBeGreaterThan(0.5)
    expect(ball(2.5).B).toBeGreaterThan(0.5)
    expect(at('disco', 0.25).boom.status).toBe('on')
    expect(at('disco', 0.25).tick.level).toBe(0)
    expect(at('disco', 0.75).tick.status).toBe('on')
    expect(at('disco', 0.5).sign.status).toBe('on')
  })

  it('reaction game: a press while the light is on cheers, a press while it is off does not', () => {
    expect(pulses(run('reactionGame', 2).steps, 'target')).toBe(true)
    expect(at('reactionGame', 0.25, { press: { pressed: true } }).cheer.status).toBe('on')
    expect(at('reactionGame', 0.75, { press: { pressed: true } }).cheer.level).toBe(0)
    expect(at('reactionGame', 0.25).cheer.level).toBe(0)
  })
})

describe('screens and signs, second batch', () => {
  it('open sign: lit while the switch is on', () => {
    expect(on(run('openSign').last, 'sign')).toBe(true)
    expect(run('openSign', 0.1, { sw: { closed: false } }).last.parts.sign.status).toBe('idle')
  })

  it('pharmacy sign, news desk and café menu: every screen lights', () => {
    expect(on(run('pharmacySign').last, 'sign')).toBe(true)
    const news = run('newsDesk').last
    expect(on(news, 'tv')).toBe(true)
    expect(on(news, 'ticker')).toBe(true)
    const cafe = run('cafeMenu').last
    expect(on(cafe, 'menu')).toBe(true)
    expect(on(cafe, 'sign')).toBe(true)
  })

  it('elevator: the floor number and the screen are lit, the button dings', () => {
    const riding = run('elevator').last
    expect(on(riding, 'floor')).toBe(true)
    expect(on(riding, 'screen')).toBe(true)
    expect(riding.parts.ding.level).toBe(0)
    expect(on(run('elevator', 0.1, { call: { pressed: true } }).last, 'ding')).toBe(true)
  })

  it('weather station: the graph climbs when it gets warmer', () => {
    const mild = run('weatherStation').last
    const hot = run('weatherStation', 0.1, { temp: { sense: 0.9 } }).last
    expect(on(mild, 'forecast')).toBe(true)
    expect(on(mild, 'graph')).toBe(true)
    expect(hot.parts.graph.level).toBeGreaterThan(mild.parts.graph.level + 1.5)
  })

  it('airport board: the bench supply lights the departures and the clock', () => {
    const { last } = run('airportBoard')
    expect(on(last, 'board')).toBe(true)
    expect(on(last, 'clock')).toBe(true)
    expect(last.parts.ps.status).toBe('on')
  })

  it('cinema sign: six bulbs run around while the words move', () => {
    const lit = (t: number) => ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'].filter((k) => at('cinemaSign', t)[k].status === 'on')
    expect(lit(0.5)).toEqual(['b1', 'b4'])
    expect(lit(1.5)).toEqual(['b2', 'b5'])
    expect(lit(2.5)).toEqual(['b3', 'b6'])
    expect(at('cinemaSign', 0.5).sign.status).toBe('on')
  })
})

/** An AI board's pins after the model's answer: every pin off except the ones given. */
const aiPins = (pins: Record<string, PinMode>): Partial<PartData> => ({
  pins: { P1: 'off', P2: 'off', P3: 'off', P4: 'off', P5: 'off', P6: 'off', ...pins },
})

describe('talk to the AI board', () => {
  it('talking smart home: the lamp waits for the dark; the fan and the bell start when the AI sets their pins', () => {
    const night = run('aiSmartHome').last
    expect(on(night, 'lamp')).toBe(true)
    expect(night.parts.fan.level).toBe(0)
    expect(night.parts.bell.level).toBe(0)
    expect(run('aiSmartHome', 0.3, { ldr: { light: 1 } }).last.parts.lamp.level).toBe(0)
    // "turn on the fan and ring the bell"
    const asked = run('aiSmartHome', 0.5, { board: aiPins({ P1: 'on', P2: 'invert', P3: 'on' }) }).last
    expect(Math.abs(asked.parts.fan.level)).toBeGreaterThan(0.3)
    expect(on(asked, 'bell')).toBe(true)
    expect(asked.parts.board.status).not.toBe('over')
  })

  it('AI traffic light: red, then green, then yellow; and a flashing yellow when asked', () => {
    const lit = (t: number, set = {}) => ['red', 'yellow', 'green'].filter((key) => at('aiTrafficLight', t, set)[key].status === 'on')
    expect(lit(0.5)).toEqual(['red'])
    expect(lit(1.5)).toEqual(['green'])
    expect(lit(2.5)).toEqual(['yellow'])
    // "flash the yellow light like at night"
    const night = { board: aiPins({ P2: 'blink' }) }
    expect(lit(0.25, night)).toEqual(['yellow'])
    expect(lit(0.75, night)).toEqual([])
  })

  it('AI party lights: three lights run one after another and the gold one breathes', () => {
    expect(at('aiPartyLights', 0.5).red.status).toBe('on')
    expect(at('aiPartyLights', 0.5).green.level).toBe(0)
    expect(at('aiPartyLights', 1.5).green.status).toBe('on')
    expect(at('aiPartyLights', 2.5).blue.status).toBe('on')
    expect(at('aiPartyLights', 1).gold.status).toBe('on')
    expect(at('aiPartyLights', 0.02).gold.level).toBeLessThan(at('aiPartyLights', 1).gold.level)
  })

  it('AI plant helper: dry soil runs the pump with the red light; wet soil rests it with the green light', () => {
    const dry = run('aiPlantHelper').last
    expect(Math.abs(dry.parts.pump.level)).toBeGreaterThan(0.3)
    expect(on(dry, 'thirsty')).toBe(true)
    expect(dry.parts.happy.level).toBe(0)
    const wet = run('aiPlantHelper', 0.5, { sensor: { sense: 0.9 } }).last
    expect(wet.parts.pump.level).toBe(0)
    expect(on(wet, 'happy')).toBe(true)
  })

  it('AI robot pet: the tail wags and the eyes shine; taught to beep, it beeps only while touched', () => {
    const { steps } = run('aiRobotPet', 2)
    const tail = steps.map((r) => r.parts.tail.level)
    expect(Math.max(...tail) - Math.min(...tail)).toBeGreaterThan(0.5)
    expect(on(steps.at(-1)!, 'eyeL')).toBe(true)
    expect(on(steps.at(-1)!, 'eyeR')).toBe(true)
    expect(steps.every((r) => r.parts.voice.level === 0)).toBe(true)
    // "beep when I touch you"
    const taught = aiPins({ P1: 'fade', P3: 'on', P4: 'on', P5: 'alarm' })
    expect(run('aiRobotPet', 1, { board: taught }).steps.every((r) => r.parts.voice.level === 0)).toBe(true)
    expect(pulses(run('aiRobotPet', 1, { board: taught, sensor: { sense: 1 } }).steps, 'voice')).toBe(true)
  })

  it('shows the model what every AI example wires to each pin and to IN', () => {
    const info = (id: PresetId) => {
      const { nodes, edges } = buildPreset(id)
      const board = nodes.find((n) => n.data.type === 'aiBoard')!
      return describeBoard(board.id, nodes, edges)!
    }
    const home = info('aiSmartHome')
    const drives = (pin: string) => home.pins.find((p) => p.pin === pin)!.devices.map((d) => d.type)
    expect(drives('P1')).toEqual(['motor'])
    expect(drives('P2')).toEqual(['led'])
    expect(drives('P3')).toEqual(['buzzer'])
    expect(home.input).toMatchObject({ high: 'it is bright', low: 'it is dark' })
    expect(info('aiPlantHelper').input?.sensor?.type).toBe('soilSensor')
    expect(info('aiRobotPet').pins[0].devices[0].type).toBe('servo')
    expect(info('aiTrafficLight').pins.slice(0, 3).map((p) => p.devices[0].color)).toEqual(['green', 'yellow', 'red'])
  })
})

describe('every example has its own behaviour check', () => {
  it('names each new example in a test above', () => {
    for (const id of NEW_EXAMPLES) expect(thisFile.includes(`'${id}'`), id).toBe(true)
  })
})
