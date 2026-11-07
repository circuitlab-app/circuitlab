import { describe, expect, it } from 'vitest'
import { ar } from '@/i18n/ar'
import { en } from '@/i18n/en'
import { fa } from '@/i18n/fa'
import { arLearn } from '@/i18n/learn/ar'
import { enLearn } from '@/i18n/learn/en'
import { faLearn } from '@/i18n/learn/fa'
import { COUNTER_OUTPUTS, PARTS, PART_ORDER, createPartData, gateOutput, isTimeDependent } from './catalog'
import { OPEN_LOOP, barsLit, bridgeDirection, latchNext, meterReading, mosfetStep } from './devices'
import { solveCircuit, type NetPart, type NetWire, type SimResult, type SolveOptions } from './solver'
import type { PartData, PartType } from './types'

/*
 * The newer components, outputs, chips and meters: each one doing what a
 * child expects on a real workbench.
 */

const part = (id: string, type: PartType, extra: Partial<PartData> = {}): NetPart => ({
  id,
  data: { ...createPartData(type), ...extra },
})

let wireId = 0
const wire = (from: string, to: string): NetWire => {
  const [source, sourceHandle] = from.split(':')
  const [target, targetHandle] = to.split(':')
  return { id: `w${wireId++}`, source, sourceHandle, target, targetHandle }
}

/** Joins each pair of terminals with a wire: ['bat:a', 'r:a'], … */
const join = (...pairs: [string, string][]) => pairs.map(([from, to]) => wire(from, to))

/** Solves a few steps in a row, carrying what the parts remember, like the app does. */
function run(parts: NetPart[], wires: NetWire[], steps = 1, options: SolveOptions = {}): SimResult {
  let result = solveCircuit(parts, wires, options)
  for (let i = 1; i < steps; i++) {
    result = solveCircuit(parts, wires, { ...options, capacitors: result.capacitors, states: result.states })
  }
  return result
}

describe('components', () => {
  it('Zener: holds about 5.1 V while the battery above it changes', () => {
    for (const voltage of [9, 12]) {
      const result = solveCircuit(
        [part('bat', 'battery', { voltage }), part('r', 'resistor', { resistance: 220 }), part('z', 'zener')],
        join(['bat:a', 'r:a'], ['r:b', 'z:a'], ['z:b', 'bat:b']),
      )
      expect(result.parts.z.status).toBe('on')
      expect(result.parts.z.voltage).toBeGreaterThan(5.05)
      expect(result.parts.z.voltage).toBeLessThan(5.25)
    }
  })

  it('Zener: below 5.1 V it lets nothing through, and joined the other way it is a plain diode', () => {
    const low = solveCircuit(
      [part('bat', 'battery', { voltage: 4.5 }), part('r', 'resistor', { resistance: 220 }), part('z', 'zener')],
      join(['bat:a', 'r:a'], ['r:b', 'z:a'], ['z:b', 'bat:b']),
    )
    expect(low.parts.z.status).toBe('idle')
    expect(low.parts.z.voltage).toBeCloseTo(4.5, 1)

    const flipped = solveCircuit(
      [part('bat', 'battery', { voltage: 9 }), part('r', 'resistor', { resistance: 220 }), part('z', 'zener')],
      join(['bat:a', 'r:a'], ['r:b', 'z:b'], ['z:a', 'bat:b']),
    )
    expect(flipped.parts.z.status).toBe('reverse')
    expect(Math.abs(flipped.parts.z.voltage)).toBeLessThan(0.9)
  })

  it('Zener: straight across a 12 V battery it burns out', () => {
    const result = solveCircuit(
      [part('bat', 'battery', { voltage: 12 }), part('z', 'zener')],
      join(['bat:a', 'z:a'], ['z:b', 'bat:b']),
    )
    expect(result.parts.z.damaged).toBe(true)
  })

  it('PNP: a small current out of B lets a big one flow from E to the lamp', () => {
    const parts = (closed: boolean) => [
      part('bat', 'battery', { voltage: 4.5 }),
      part('q', 'pnp'),
      part('lamp', 'lamp'),
      part('rb', 'resistor', { resistance: 1000 }),
      part('sw', 'switch', { closed }),
    ]
    const wires = join(
      ['bat:a', 'q:E'],
      ['q:C', 'lamp:a'],
      ['lamp:b', 'bat:b'],
      // the base is pulled down to − through the resistor and the switch
      ['q:B', 'rb:a'],
      ['rb:b', 'sw:a'],
      ['sw:b', 'bat:b'],
    )
    const off = solveCircuit(parts(false), wires)
    expect(off.parts.q.current).toBeLessThan(1e-4)
    expect(off.parts.lamp.level).toBe(0)

    const on = solveCircuit(parts(true), wires)
    expect(on.parts.q.status).toBe('on')
    expect(on.parts.lamp.status).not.toBe('idle')
    expect(on.parts.q.current).toBeGreaterThan(0.1)
  })

  it('MOSFET: the gate voltage switches a motor, and half a gate gives half the speed', () => {
    const board = (level: number) =>
      solveCircuit(
        [
          part('bat', 'battery', { voltage: 4.5 }),
          part('m', 'motor'),
          part('fet', 'mosfet'),
          part('pot', 'potentiometer', { level, resistance: 10000 }),
        ],
        join(
          ['bat:a', 'm:a'],
          ['m:b', 'fet:D'],
          ['fet:S', 'bat:b'],
          ['pot:A', 'bat:a'],
          ['pot:B', 'bat:b'],
          ['pot:W', 'fet:G'],
        ),
      )
    const off = board(0.3) // 1.35 V on G: below the 2 V it needs
    expect(off.parts.m.level).toBe(0)
    expect(off.parts.fet.current).toBeLessThan(1e-3)

    const half = board(0.55) // about 2.5 V
    const full = board(1) // 4.5 V: fully on
    expect(full.parts.fet.status).toBe('on')
    expect(full.parts.m.status).toBe('on')
    expect(full.parts.m.level).toBeGreaterThan(1.2)
    expect(half.parts.m.level).toBeGreaterThan(0.1)
    expect(half.parts.m.level).toBeLessThan(full.parts.m.level)
    // the gate only listens: almost nothing flows into it
    expect(Math.abs(full.parts.pot.current)).toBeLessThan(1e-3)
  })

  it('MOSFET: gate steps grow with the gate voltage', () => {
    expect(mosfetStep(1.9)).toBe(0)
    expect(mosfetStep(2.1)).toBeGreaterThan(0)
    expect(mosfetStep(3)).toBeLessThan(mosfetStep(4))
    expect(mosfetStep(5)).toBe(mosfetStep(4))
  })

  it('optocoupler: light from its LED closes the switch on the other side, with no wire between them', () => {
    const board = (closed: boolean) =>
      solveCircuit(
        [
          part('bat1', 'battery', { voltage: 3 }),
          part('sw', 'switch', { closed }),
          part('r1', 'resistor', { resistance: 100 }),
          part('opto', 'optocoupler'),
          // a second, separate circuit
          part('bat2', 'battery', { voltage: 4.5 }),
          part('r2', 'resistor', { resistance: 220 }),
          part('led', 'led', { color: 'green' }),
        ],
        join(
          ['bat1:a', 'sw:a'],
          ['sw:b', 'r1:a'],
          ['r1:b', 'opto:a'],
          ['opto:b', 'bat1:b'],
          ['bat2:a', 'r2:a'],
          ['r2:b', 'led:a'],
          ['led:b', 'opto:C'],
          ['opto:E', 'bat2:b'],
        ),
      )
    const dark = board(false)
    expect(dark.parts.opto.status).toBe('idle')
    expect(dark.parts.led.level).toBe(0)

    const lit = board(true)
    expect(lit.parts.opto.status).toBe('on')
    expect(lit.parts.led.status).toBe('on')
    expect(lit.parts.opto.channels?.switch).toBeGreaterThan(5e-3)
  })
})

describe('outputs', () => {
  it('laser: a beam on 5 V, too much on 12 V', () => {
    const at = (voltage: number) =>
      solveCircuit(
        [part('ps', 'powerSupply', { voltage, limit: 2 }), part('l', 'laser')],
        join(['ps:a', 'l:a'], ['l:b', 'ps:b']),
      ).parts.l
    expect(at(5).status).toBe('on')
    expect(at(5).level).toBeGreaterThan(0.5)
    expect(at(12).damaged).toBe(true)
    expect(at(1.5).level).toBe(0)
  })

  it('IR LED: it lights from 1.2 V, so even a 1.5 V cell works it', () => {
    const result = solveCircuit(
      [part('bat', 'battery', { voltage: 3 }), part('r', 'resistor', { resistance: 100 }), part('ir', 'irLed')],
      join(['bat:a', 'r:a'], ['r:b', 'ir:a'], ['ir:b', 'bat:b']),
    )
    expect(result.parts.ir.status).toBe('on')
    // (3 − 1.2) / (100 + 15 + 0.6) ≈ 15.6 mA
    expect(result.parts.ir.current).toBeCloseTo(1.8 / 115.6, 3)
  })

  it('solenoid: 1.5 V only hums, 4.5 V pushes the rod out', () => {
    const at = (voltage: number) =>
      solveCircuit([part('bat', 'battery', { voltage }), part('s', 'solenoid')], join(['bat:a', 's:a'], ['s:b', 'bat:b']))
        .parts.s
    expect(at(1.5).status).toBe('weak')
    expect(at(1.5).level).toBe(0)
    expect(at(4.5).status).toBe('on')
    expect(at(4.5).level).toBeGreaterThan(0.8)
  })

  it('water pump: more volts pump faster', () => {
    const at = (voltage: number) =>
      solveCircuit([part('bat', 'battery', { voltage }), part('p', 'pump')], join(['bat:a', 'p:a'], ['p:b', 'bat:b'])).parts.p
    expect(at(3).level).toBeGreaterThan(0.3)
    expect(at(4.5).level).toBeGreaterThan(at(3).level)
    expect(at(4.5).status).toBe('on')
  })

  it('bell: rings on 3 V', () => {
    const result = solveCircuit([part('bat', 'battery'), part('b', 'bell')], join(['bat:a', 'b:a'], ['b:b', 'bat:b']))
    expect(result.parts.b.status).toBe('on')
    expect(result.parts.b.level).toBeGreaterThan(0.5)
  })

  it('bar graph: more volts on IN light more bars', () => {
    const at = (level: number) =>
      solveCircuit(
        [part('bat', 'battery', { voltage: 4.5 }), part('pot', 'potentiometer', { level }), part('bg', 'barGraph')],
        join(
          ['bat:a', 'bg:VCC'],
          ['bat:b', 'bg:GND'],
          ['pot:A', 'bat:a'],
          ['pot:B', 'bat:b'],
          ['pot:W', 'bg:IN'],
        ),
      ).parts.bg
    expect(at(0).level).toBe(0)
    expect(at(0.3).level).toBe(3)
    expect(at(0.75).level).toBeGreaterThan(at(0.3).level)
    expect(at(1).level).toBe(10)
    expect(at(1).status).toBe('on')
    expect(barsLit(0.5)).toBe(5)
  })

  it('bar graph: lit bars take current from +', () => {
    const at = (level: number) =>
      solveCircuit(
        [part('bat', 'battery', { voltage: 4.5 }), part('pot', 'potentiometer', { level }), part('bg', 'barGraph')],
        join(['bat:a', 'bg:VCC'], ['bat:b', 'bg:GND'], ['pot:A', 'bat:a'], ['pot:B', 'bat:b'], ['pot:W', 'bg:IN']),
      ).parts.bg.current
    expect(at(1)).toBeGreaterThan(at(0) + 0.05)
  })

  it('traffic light module: each pin lights its own colour, no resistor needed', () => {
    const result = solveCircuit(
      [part('bat', 'battery', { voltage: 4.5 }), part('tl', 'trafficLight')],
      join(['bat:a', 'tl:Y'], ['tl:GND', 'bat:b']),
    )
    expect(result.parts.tl.status).toBe('on')
    expect(result.parts.tl.channels?.Y).toBeGreaterThan(0.6)
    expect(result.parts.tl.channels?.R).toBe(0)
    expect(result.parts.tl.channels?.G).toBe(0)
  })

  it('fan: spins on 5 V one way round only', () => {
    const at = (flip: boolean) =>
      solveCircuit(
        [part('ps', 'powerSupply', { voltage: 5 }), part('f', 'fan')],
        flip ? join(['ps:a', 'f:b'], ['f:a', 'ps:b']) : join(['ps:a', 'f:a'], ['f:b', 'ps:b']),
      ).parts.f
    expect(at(false).status).toBe('on')
    expect(at(false).level).toBeGreaterThan(0.8)
    expect(at(true).level).toBe(0)
    expect(at(true).status).toBe('reverse')
  })
})

/** A chip powered from a 4.5 V battery, with each named input joined to + through a switch. */
function chipBoard(type: PartType, inputs: Record<string, boolean>, extra: NetPart[] = [], extraWires: NetWire[] = []) {
  const parts = [part('bat', 'battery', { voltage: 4.5 }), part('chip', type), ...extra]
  const wires = join(['bat:a', 'chip:VCC'], ['chip:GND', 'bat:b'])
  for (const [input, closed] of Object.entries(inputs)) {
    parts.push(part(`sw${input}`, 'switch', { closed }))
    wires.push(wire('bat:a', `sw${input}:a`), wire(`sw${input}:b`, `chip:${input}`))
  }
  return { parts, wires: [...wires, ...extraWires] }
}

describe('chips', () => {
  it('NAND and NOR: AND and OR turned upside down', () => {
    const rows: [boolean, boolean][] = [
      [false, false],
      [false, true],
      [true, false],
      [true, true],
    ]
    expect(rows.map(([a, b]) => gateOutput('nandGate', a, b))).toEqual([true, true, true, false])
    expect(rows.map(([a, b]) => gateOutput('norGate', a, b))).toEqual([true, false, false, false])
    for (const type of ['nandGate', 'norGate'] as const) {
      for (const [a, b] of rows) {
        const { parts, wires } = chipBoard(type, { A: a, B: b })
        expect(solveCircuit(parts, wires).parts.chip.channels?.Y).toBe(gateOutput(type, a, b) ? 1 : 0)
      }
    }
  })

  it('latch: remembers after SET is let go, until RESET', () => {
    const step = (set: boolean, reset: boolean, states?: Record<string, number>) => {
      const { parts, wires } = chipBoard('latch', { S: set, R: reset })
      return solveCircuit(parts, wires, { states })
    }
    const fresh = step(false, false)
    expect(fresh.parts.chip.channels?.Q).toBe(0)
    const set = step(true, false, fresh.states)
    expect(set.parts.chip.channels?.Q).toBe(1)
    // SET let go: it still remembers
    const held = step(false, false, set.states)
    expect(held.parts.chip.channels?.Q).toBe(1)
    expect(held.parts.chip.status).toBe('on')
    const reset = step(false, true, held.states)
    expect(reset.parts.chip.channels?.Q).toBe(0)
    expect(step(false, false, reset.states).parts.chip.channels?.Q).toBe(0)
    expect(latchNext(true, true, true)).toBe(false)
  })

  it('latch: forgets when its power is taken away', () => {
    const { parts, wires } = chipBoard('latch', { S: true })
    const set = solveCircuit(parts, wires)
    const unpowered = solveCircuit(
      parts,
      wires.filter((w) => w.targetHandle !== 'VCC'),
      { states: set.states },
    )
    expect(unpowered.parts.chip.channels?.Q).toBe(0)
    expect(unpowered.states.chip).toBe(0)
  })

  it('counter: each pulse on CLK moves the light to the next output, then back to 0', () => {
    let states: Record<string, number> | undefined
    const lit: number[] = []
    for (let pulse = 0; pulse < COUNTER_OUTPUTS + 1; pulse++) {
      for (const clock of [true, false]) {
        const { parts, wires } = chipBoard('counter', { CLK: clock })
        const result = solveCircuit(parts, wires, { states })
        states = result.states
        if (!clock) lit.push(result.parts.chip.level)
      }
    }
    expect(lit).toEqual([1, 2, 3, 4, 0, 1])
  })

  it('counter: the chaser steps over time when a 555 drives CLK', () => {
    const parts = [part('bat', 'battery', { voltage: 9 }), part('t', 'timer555', { rate: 2 }), part('chip', 'counter')]
    const wires = join(['bat:a', 't:VCC'], ['t:GND', 'bat:b'], ['bat:a', 'chip:VCC'], ['chip:GND', 'bat:b'], ['t:OUT', 'chip:CLK'])
    let states: Record<string, number> = {}
    const seen = new Set<number>()
    const dt = 0.05
    for (let time = 0; time < 3; time += dt) {
      const result = solveCircuit(parts, wires, { time, dt, states })
      states = result.states
      seen.add(result.parts.chip.level)
      const lit = Object.entries(result.parts.chip.channels ?? {}).filter(([k, v]) => k.startsWith('Q') && v === 1)
      expect(lit).toHaveLength(1)
    }
    // 2 blinks a second for 3 seconds: it has gone all the way round
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4])
  })

  it('counter: RST sends it back to 0, so Q3 joined to RST makes it count 0, 1, 2', () => {
    let states: Record<string, number> | undefined
    const lit: number[] = []
    for (let pulse = 0; pulse < 6; pulse++) {
      for (const clock of [true, false]) {
        const { parts, wires } = chipBoard('counter', { CLK: clock }, [], [wire('chip:Q3', 'chip:RST')])
        const result = solveCircuit(parts, wires, { states })
        states = result.states
        if (!clock) lit.push(result.parts.chip.level)
      }
    }
    expect(lit).toEqual([1, 2, 0, 1, 2, 0])
  })

  it('comparator: OUT is HIGH only while IN+ is above IN−', () => {
    const at = (level: number) => {
      const parts = [
        part('bat', 'battery', { voltage: 4.5 }),
        part('chip', 'comparator'),
        part('pot', 'potentiometer', { level }),
        part('r1', 'resistor', { resistance: 1000 }),
        part('r2', 'resistor', { resistance: 1000 }),
      ]
      const wires = join(
        ['bat:a', 'chip:VCC'],
        ['chip:GND', 'bat:b'],
        ['pot:A', 'bat:a'],
        ['pot:B', 'bat:b'],
        ['pot:W', 'chip:P'],
        // IN− sits at half the battery
        ['bat:a', 'r1:a'],
        ['r1:b', 'r2:a'],
        ['r2:b', 'bat:b'],
        ['r1:b', 'chip:N'],
      )
      return solveCircuit(parts, wires).parts.chip
    }
    expect(at(0.3).channels?.OUT).toBe(0)
    expect(at(0.7).channels?.OUT).toBe(1)
    expect(at(0.7).status).toBe('on')
  })

  it('H-bridge: IN1 spins the motor forward, IN2 spins it back, both or neither stop it', () => {
    const at = (in1: boolean, in2: boolean) => {
      const { parts, wires } = chipBoard('hBridge', { IN1: in1, IN2: in2 }, [part('m', 'motor')], join(['chip:M1', 'm:a'], ['m:b', 'chip:M2']))
      return solveCircuit(parts, wires)
    }
    const forward = at(true, false)
    const back = at(false, true)
    expect(forward.parts.m.level).toBeGreaterThan(0.5)
    expect(back.parts.m.level).toBeLessThan(-0.5)
    expect(forward.parts.chip.level).toBe(1)
    expect(back.parts.chip.level).toBe(-1)
    expect(at(false, false).parts.m.level).toBe(0)
    expect(at(true, true).parts.m.level).toBe(0)
    expect(bridgeDirection(true, true)).toBe(0)
  })

  it('H-bridge: an Arduino pin can drive it without a resistor, and the motor gets the battery', () => {
    const parts = [
      part('uno', 'arduino', { pins: { D13: 'on' } }),
      part('bat', 'battery', { voltage: 4.5 }),
      part('chip', 'hBridge'),
      part('m', 'motor'),
    ]
    const wires = join(
      ['bat:a', 'chip:VCC'],
      ['chip:GND', 'bat:b'],
      ['uno:GND', 'bat:b'],
      ['uno:D13', 'chip:IN1'],
      ['uno:D12', 'chip:IN2'],
      ['chip:M1', 'm:a'],
      ['m:b', 'chip:M2'],
    )
    const result = solveCircuit(parts, wires)
    expect(result.parts.m.status).toBe('on')
    expect(result.parts.uno.status).toBe('on')
  })
})

describe('meters', () => {
  it('multimeter: reads the ohms of a 220 Ω resistor with no battery at all', () => {
    const result = solveCircuit(
      [part('dmm', 'multimeter', { dial: 'ohms' }), part('r', 'resistor', { resistance: 220 })],
      join(['dmm:a', 'r:a'], ['r:b', 'dmm:b']),
    )
    expect(result.parts.dmm.level).toBeCloseTo(220, 0)
    expect(meterReading('ohms', result.parts.dmm)).toEqual({ text: '220', unit: 'Ω' })
    expect(result.parts.dmm.channels?.beep).toBe(0)
  })

  it('multimeter: shows OL with nothing between its probes, and kΩ for big resistors', () => {
    const open = solveCircuit([part('dmm', 'multimeter', { dial: 'ohms' })], [])
    expect(open.parts.dmm.level).toBe(OPEN_LOOP)
    expect(meterReading('ohms', open.parts.dmm).text).toBe('OL')

    const big = solveCircuit(
      [part('dmm', 'multimeter', { dial: 'ohms' }), part('r', 'resistor', { resistance: 4700 })],
      join(['dmm:a', 'r:a'], ['r:b', 'dmm:b']),
    )
    expect(meterReading('ohms', big.parts.dmm)).toEqual({ text: '4.70', unit: 'kΩ' })
  })

  it('multimeter: beeps when its probes find a joined path', () => {
    const wireOnly = solveCircuit([part('dmm', 'multimeter', { dial: 'beep' })], join(['dmm:a', 'dmm:b']))
    expect(wireOnly.parts.dmm.channels?.beep).toBe(1)
    const lamp = solveCircuit(
      [part('dmm', 'multimeter', { dial: 'beep' }), part('lamp', 'lamp')],
      join(['dmm:a', 'lamp:a'], ['lamp:b', 'dmm:b']),
    )
    expect(lamp.parts.dmm.channels?.beep).toBe(1)
    const resistor = solveCircuit(
      [part('dmm', 'multimeter', { dial: 'beep' }), part('r', 'resistor', { resistance: 1000 })],
      join(['dmm:a', 'r:a'], ['r:b', 'dmm:b']),
    )
    expect(resistor.parts.dmm.channels?.beep).toBe(0)
  })

  it('multimeter: the test current is too small to light an LED', () => {
    const result = solveCircuit(
      [part('dmm', 'multimeter', { dial: 'ohms' }), part('led', 'led')],
      join(['dmm:a', 'led:a'], ['led:b', 'dmm:b']),
    )
    expect(result.parts.led.level).toBe(0)
    expect(meterReading('ohms', result.parts.dmm).text).toBe('OL')
  })

  it('multimeter: on V it reads the battery, on A it reads the current in the loop', () => {
    const volts = solveCircuit(
      [part('bat', 'battery', { voltage: 9 }), part('dmm', 'multimeter')],
      join(['bat:a', 'dmm:a'], ['dmm:b', 'bat:b']),
    )
    expect(meterReading('volts', volts.parts.dmm)).toEqual({ text: '9.00', unit: 'V' })

    const amps = solveCircuit(
      [part('bat', 'battery'), part('dmm', 'multimeter', { dial: 'amps' }), part('lamp', 'lamp')],
      join(['bat:a', 'dmm:a'], ['dmm:b', 'lamp:a'], ['lamp:b', 'bat:b']),
    )
    expect(amps.parts.dmm.current).toBeCloseTo(amps.parts.lamp.current, 3)
    expect(meterReading('amps', amps.parts.dmm).unit).toBe('mA')
    expect(Number(meterReading('amps', amps.parts.dmm).text)).toBeGreaterThan(250)
  })

  it('multimeter: swapped probes show a minus sign', () => {
    const result = solveCircuit(
      [part('bat', 'battery'), part('dmm', 'multimeter')],
      join(['bat:a', 'dmm:b'], ['dmm:a', 'bat:b']),
    )
    expect(result.parts.dmm.status).toBe('reverse')
    expect(meterReading('volts', result.parts.dmm).text).toBe('-3.00')
  })

  it('logic probe: HIGH, LOW, nothing for a loose tip, and PULSE for a moment after a change', () => {
    const board = (closed: boolean | null) => {
      const parts = [part('bat', 'battery', { voltage: 4.5 }), part('lp', 'logicProbe'), part('sw', 'switch', { closed: !!closed })]
      const wires = join(['bat:a', 'lp:VCC'], ['lp:GND', 'bat:b'])
      if (closed !== null) wires.push(wire('bat:a', 'sw:a'), wire('sw:b', 'lp:TIP'), wire('lp:TIP', 'bat:b'))
      return { parts, wires }
    }
    const loose = board(null)
    const floating = solveCircuit(loose.parts, loose.wires, { time: 0 })
    expect(floating.parts.lp.channels).toEqual({ high: 0, low: 0, pulse: 0 })

    // tip on −, then on +
    const low = solveCircuit(board(false).parts, board(false).wires.slice(0, 2).concat(wire('lp:TIP', 'bat:b')), {
      time: 0,
      states: floating.states,
    })
    expect(low.parts.lp.channels?.low).toBe(1)
    const highBoard = board(true)
    const high = solveCircuit(highBoard.parts, highBoard.wires.slice(0, 2).concat(wire('lp:TIP', 'bat:a')), {
      time: 1,
      states: low.states,
    })
    expect(high.parts.lp.channels?.high).toBe(1)
    expect(high.parts.lp.channels?.pulse).toBe(1)
    const later = solveCircuit(highBoard.parts, highBoard.wires.slice(0, 2).concat(wire('lp:TIP', 'bat:a')), {
      time: 2,
      states: high.states,
    })
    expect(later.parts.lp.channels?.high).toBe(1)
    expect(later.parts.lp.channels?.pulse).toBe(0)
    expect(isTimeDependent(createPartData('logicProbe'))).toBe(true)
  })

  it('logic probe: PULSE keeps blinking on a 555', () => {
    const parts = [part('bat', 'battery', { voltage: 9 }), part('t', 'timer555', { rate: 1 }), part('lp', 'logicProbe')]
    const wires = join(['bat:a', 't:VCC'], ['t:GND', 'bat:b'], ['bat:a', 'lp:VCC'], ['lp:GND', 'bat:b'], ['t:OUT', 'lp:TIP'])
    let states: Record<string, number> = {}
    let pulses = 0
    let wasPulse = false
    for (let time = 0; time < 3; time += 0.05) {
      const result = solveCircuit(parts, wires, { time, dt: 0.05, states })
      states = result.states
      const pulse = result.parts.lp.channels?.pulse === 1
      if (pulse && !wasPulse) pulses++
      wasPulse = pulse
    }
    // a change every half second
    expect(pulses).toBeGreaterThanOrEqual(5)
  })
})

const NEW_PARTS: PartType[] = [
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
  'nandGate',
  'norGate',
  'latch',
  'counter',
  'comparator',
  'hBridge',
  'multimeter',
  'logicProbe',
]

describe('every new part', () => {
  it('is in the parts tray and speaks English, Persian and Arabic, with a lesson in each', () => {
    for (const type of NEW_PARTS) {
      expect(PART_ORDER).toContain(type)
      expect(Object.keys(PARTS[type].terminals).length).toBeGreaterThan(1)
      for (const [dictionary, book] of [
        [en, enLearn],
        [fa, faLearn],
        [ar, arLearn],
      ] as const) {
        const words = dictionary.parts[type]
        expect(words.name && words.description && words.working, type).toBeTruthy()
        const lesson = book.parts[type]
        expect(lesson?.about.length, type).toBeGreaterThanOrEqual(3)
        expect(lesson?.like && lesson.fact, type).toBeTruthy()
      }
    }
  })

  it('sits on an empty board without making a sound or burning', () => {
    const types = NEW_PARTS
    const result = run(types.map((type, i) => part(`p${i}`, type)), [], 3)
    for (const r of Object.values(result.parts)) {
      expect(r.damaged).toBe(false)
      expect(Number.isFinite(r.voltage)).toBe(true)
      expect(Number.isFinite(r.current)).toBe(true)
    }
  })
})
