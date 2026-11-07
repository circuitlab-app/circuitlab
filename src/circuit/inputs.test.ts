import { describe, expect, it } from 'vitest'
import {
  BATTERY_VOLTAGES,
  CAPACITOR_VALUES,
  LED_COLORS,
  LED_FORWARD_VOLTAGE,
  PARTS,
  RESISTOR_VALUES,
  SENSORS,
  createPartData,
  isSensorModule,
  isTimeDependent,
  resistorBands,
  senseToBpm,
} from './catalog'
import { DEFAULT_STEP, solveCircuit, type NetPart, type NetWire, type SimResult } from './solver'
import type { PartData, PartType } from './types'

/*
 * The sensors, switches and small power sources a real kit has: the new
 * 3-pin modules, the two-way slide switch, the micro switch, the joystick,
 * the lemon battery, the coin cell, the crank generator and the power bank.
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

/** source(+) → each part, entered at `a` and left at `b` → source(−) */
const loop = (source: string, chain: string[]): NetWire[] => {
  const wires: NetWire[] = []
  let from = `${source}:a`
  for (const id of chain) {
    wires.push(wire(from, `${id}:a`))
    from = `${id}:b`
  }
  wires.push(wire(from, `${source}:b`))
  return wires
}

/** Runs the board for `seconds`, each step fed with the states of the one before, like the app does. */
function run(parts: NetPart[], wires: NetWire[], seconds: number): SimResult[] {
  const steps: SimResult[] = []
  let previous: SimResult | undefined
  for (let i = 0; i * DEFAULT_STEP <= seconds + 1e-9; i++) {
    previous = solveCircuit(parts, wires, {
      time: i * DEFAULT_STEP,
      dt: DEFAULT_STEP,
      capacitors: previous?.capacitors,
      inputs: previous?.inputs,
      states: previous?.states,
    })
    steps.push(previous)
  }
  return steps
}

const NEW_MODULES: PartType[] = [
  'flameSensor',
  'rainSensor',
  'waterSensor',
  'humiditySensor',
  'hallSensor',
  'irSensor',
  'lineSensor',
  'forceSensor',
  'pulseSensor',
  'knockSensor',
]

/** A sensor module on a 5 V supply, its S read by a voltmeter. */
function readModule(type: PartType, sense: number, time = 0) {
  const result = solveCircuit(
    [part('ps', 'powerSupply', { voltage: 5 }), part('m', type, { sense }), part('vm', 'voltmeter')],
    [wire('ps:a', 'm:VCC'), wire('ps:b', 'm:GND'), wire('m:OUT', 'vm:a'), wire('vm:b', 'ps:b')],
    { time },
  )
  return { module: result.parts.m, signal: result.parts.vm.level }
}

describe('sensor modules', () => {
  it('are all + / − / S modules in the sensor drawer', () => {
    for (const type of NEW_MODULES) {
      expect(isSensorModule(type)).toBe(true)
      expect(PARTS[type].category).toBe('sensor')
      expect(Object.keys(PARTS[type].terminals).sort()).toEqual(['GND', 'OUT', 'VCC'])
    }
  })

  it('give no signal until + and − are powered', () => {
    for (const type of NEW_MODULES) {
      const alone = solveCircuit([part('m', type, { sense: 1 }), part('vm', 'voltmeter')], [wire('m:OUT', 'vm:a')])
      expect(alone.parts.m.status).toBe('idle')
      expect(Math.abs(alone.parts.vm.level)).toBeLessThan(0.01)
      // the heartbeat is read at the top of a beat
      const { module, signal } = readModule(type, 1, (0.12 * 60) / senseToBpm(1))
      expect(module.status).toBe('on')
      expect(signal).toBeGreaterThan(2.5)
    }
  })

  it('give a bigger signal for more flame, rain, water, damp air and pressing', () => {
    for (const type of ['flameSensor', 'rainSensor', 'waterSensor', 'humiditySensor', 'forceSensor'] as const) {
      const low = readModule(type, 0.2).signal
      const high = readModule(type, 0.9).signal
      expect(high).toBeGreaterThan(low + 2)
    }
  })

  it('shows the humidity in % and the water in cm', () => {
    expect(SENSORS.humiditySensor.format?.(0.45)).toBe('45%')
    expect(SENSORS.waterSensor.format?.(0.5)).toBe('2.0 cm')
  })

  it('makes the hall sensor follow the magnet', () => {
    const far = readModule('hallSensor', 0).signal
    const near = readModule('hallSensor', 1).signal
    expect(far).toBeLessThan(0.1)
    expect(near).toBeGreaterThan(4.5)
    // a digital module: a magnet halfway there is still either on or off
    expect([0, 5].some((v) => Math.abs(readModule('hallSensor', 0.4).signal - v) < 0.2)).toBe(true)
  })

  it('switches the IR, line and knock sensors fully on or off', () => {
    for (const type of ['irSensor', 'lineSensor', 'knockSensor'] as const) {
      expect(readModule(type, 0).signal).toBeLessThan(0.1)
      expect(readModule(type, 1).signal).toBeGreaterThan(4.5)
    }
  })

  it('lets a hall sensor switch an LED through an Arduino pin', () => {
    const parts = (sense: number) => [
      part('uno', 'arduino', { pins: { D13: 'follow', D12: 'off', D11: 'off', D10: 'off', D9: 'off', D8: 'off' } }),
      part('hall', 'hallSensor', { sense }),
      part('r', 'resistor', { resistance: 220 }),
      part('led', 'led'),
    ]
    const wires = [
      wire('uno:5V', 'hall:VCC'),
      wire('hall:GND', 'uno:GND'),
      wire('hall:OUT', 'uno:A0'),
      wire('uno:D13', 'r:a'),
      wire('r:b', 'led:a'),
      wire('led:b', 'uno:GND'),
    ]
    const led = (sense: number) => run(parts(sense), wires, 0.2).at(-1)!.parts.led
    expect(led(1).status).toBe('on')
    expect(led(0).status).toBe('idle')
  })

  it('beats by itself: the heartbeat signal goes up and down over time', () => {
    expect(isTimeDependent(createPartData('pulseSensor'))).toBe(true)
    const bpm = senseToBpm(createPartData('pulseSensor').sense ?? 0)
    expect(bpm).toBeGreaterThan(60)
    expect(bpm).toBeLessThan(90)
    const period = 60 / bpm
    const signals = Array.from({ length: 80 }, (_, i) => readModule('pulseSensor', 0.25, (i * period) / 40).signal)
    expect(Math.max(...signals)).toBeGreaterThan(4.5)
    expect(Math.min(...signals)).toBeLessThan(1)
    // the same beat comes back one period later
    expect(readModule('pulseSensor', 0.25, 0.1).signal).toBeCloseTo(readModule('pulseSensor', 0.25, 0.1 + period).signal, 4)
    // beats a second: count the times the signal crosses half way going up
    const rising = signals.filter((s, i) => i > 0 && signals[i - 1] < 2.5 && s >= 2.5).length
    expect(rising).toBe(2)
  })

  it('beats faster when the heart rate slider goes up', () => {
    const beats = (sense: number) => {
      const signals = Array.from({ length: 200 }, (_, i) => readModule('pulseSensor', sense, i * 0.025).signal)
      return signals.filter((s, i) => i > 0 && signals[i - 1] < 2.5 && s >= 2.5).length
    }
    expect(beats(0.9)).toBeGreaterThan(beats(0.1) * 2)
  })
})

describe('slide switch and micro switch', () => {
  it('joins COM to A, or to B', () => {
    const parts = (closed: boolean) => [part('bat', 'battery'), part('sw', 'slideSwitch', { closed }), part('la', 'lamp'), part('lb', 'lamp')]
    const wires = [
      wire('bat:a', 'sw:COM'),
      wire('sw:A', 'la:a'),
      wire('la:b', 'bat:b'),
      wire('sw:B', 'lb:a'),
      wire('lb:b', 'bat:b'),
    ]
    const toA = solveCircuit(parts(false), wires).parts
    expect(toA.la.status).toBe('on')
    expect(toA.lb.status).toBe('idle')
    expect(toA.sw.status).toBe('on')
    const toB = solveCircuit(parts(true), wires).parts
    expect(toB.la.status).toBe('idle')
    expect(toB.lb.status).toBe('on')
  })

  it('switches a stair light from both ends', () => {
    // + → COM of the bottom switch; A to A and B to B between the switches; COM of the top switch → lamp → −
    const lampOn = (bottom: boolean, top: boolean) =>
      solveCircuit(
        [part('bat', 'battery'), part('s1', 'slideSwitch', { closed: bottom }), part('s2', 'slideSwitch', { closed: top }), part('lamp', 'lamp')],
        [
          wire('bat:a', 's1:COM'),
          wire('s1:A', 's2:A'),
          wire('s1:B', 's2:B'),
          wire('s2:COM', 'lamp:a'),
          wire('lamp:b', 'bat:b'),
        ],
      ).parts.lamp.status === 'on'
    expect(lampOn(false, false)).toBe(true)
    // flipping either switch changes the light, whatever the other one does
    for (const bottom of [false, true]) {
      for (const top of [false, true]) {
        expect(lampOn(!bottom, top)).toBe(!lampOn(bottom, top))
        expect(lampOn(bottom, !top)).toBe(!lampOn(bottom, top))
      }
    }
  })

  it('moves the micro switch from NC to NO while the lever is pressed', () => {
    const parts = (pressed: boolean) => [part('bat', 'battery'), part('ms', 'microSwitch', { pressed }), part('nc', 'led'), part('no', 'buzzer'), part('r', 'resistor')]
    const wires = [
      wire('bat:a', 'ms:COM'),
      wire('ms:NC', 'r:a'),
      wire('r:b', 'nc:a'),
      wire('nc:b', 'bat:b'),
      wire('ms:NO', 'no:a'),
      wire('no:b', 'bat:b'),
    ]
    const released = solveCircuit(parts(false), wires).parts
    expect(released.nc.status).not.toBe('idle')
    expect(released.no.status).toBe('idle')
    expect(released.ms.level).toBe(0)
    const pressed = solveCircuit(parts(true), wires).parts
    expect(pressed.nc.status).toBe('idle')
    expect(pressed.no.status).toBe('on')
    expect(pressed.ms.level).toBe(1)
  })
})

describe('joystick', () => {
  const read = (stickX: number, stickY: number) =>
    solveCircuit(
      [part('ps', 'powerSupply', { voltage: 5 }), part('js', 'joystick', { stickX, stickY })],
      [wire('ps:a', 'js:VCC'), wire('ps:b', 'js:GND')],
    ).parts.js

  it('gives half the volts on X and Y in the middle', () => {
    const js = read(0.5, 0.5)
    expect(js.status).toBe('on')
    expect(js.channels?.X).toBeCloseTo(2.5, 1)
    expect(js.channels?.Y).toBeCloseTo(2.5, 1)
  })

  it('follows the stick: right and up give more volts', () => {
    const js = read(1, 0)
    expect(js.channels?.X).toBeGreaterThan(4.9)
    expect(js.channels?.Y).toBeLessThan(0.1)
    expect(read(0.75, 0.5).channels?.X).toBeCloseTo(3.75, 1)
  })

  it('turns a servo with X', () => {
    const angle = (stickX: number) =>
      solveCircuit(
        [part('uno', 'arduino', { pins: {} }), part('js', 'joystick', { stickX }), part('sv', 'servo')],
        [wire('uno:5V', 'js:VCC'), wire('js:GND', 'uno:GND'), wire('uno:5V', 'sv:VCC'), wire('sv:GND', 'uno:GND'), wire('js:X', 'sv:OUT')],
      ).parts.sv.level
    expect(angle(0.9)).toBeGreaterThan(angle(0.1) + 0.6)
  })
})

describe('lemon battery', () => {
  const redLed = (cells: number) =>
    solveCircuit([part('lemon', 'lemon', { cells }), part('led', 'led', { color: 'red' })], loop('lemon', ['led'])).parts

  it('gives about 0.9 V for each lemon', () => {
    for (const cells of [1, 2, 3, 4]) {
      const open = solveCircuit([part('lemon', 'lemon', { cells }), part('vm', 'voltmeter')], loop('lemon', ['vm']))
      expect(open.parts.vm.level).toBeCloseTo(0.9 * cells, 2)
      expect(open.hasBattery).toBe(true)
    }
  })

  it('needs three lemons to light a red LED: one lemon is not enough', () => {
    expect(redLed(1).led.status).toBe('idle')
    expect(redLed(2).led.status).toBe('idle')
    expect(redLed(3).led.level).toBeGreaterThan(0.25)
    expect(redLed(3).led.status).not.toBe('idle')
    expect(redLed(4).led.level).toBeGreaterThan(redLed(3).led.level)
  })

  it('never burns the LED, even with no resistor', () => {
    expect(redLed(4).led.damaged).toBe(false)
    expect(redLed(4).led.current).toBeLessThan(0.01)
  })

  it('is far too weak for a motor or a lamp, and a bare wire is no short circuit', () => {
    const motor = solveCircuit([part('lemon', 'lemon', { cells: 4 }), part('m', 'motor')], loop('lemon', ['m']))
    expect(motor.parts.m.level).toBe(0)
    const lamp = solveCircuit([part('lemon', 'lemon', { cells: 4 }), part('l', 'lamp')], loop('lemon', ['l']))
    expect(lamp.parts.l.status).toBe('idle')
    const short = solveCircuit([part('lemon', 'lemon', { cells: 4 })], [wire('lemon:a', 'lemon:b')])
    expect(short.shortCircuit).toBe(false)
  })
})

describe('coin cell', () => {
  it('lights an LED without a resistor and does not burn it', () => {
    const result = solveCircuit([part('cell', 'coinCell'), part('led', 'led', { color: 'red' })], loop('cell', ['led']))
    expect(result.parts.led.status).toBe('on')
    expect(result.parts.led.damaged).toBe(false)
    expect(result.parts.cell.status).toBe('on')
  })

  it('cannot run the motor: its volts drop too far', () => {
    const result = solveCircuit([part('cell', 'coinCell'), part('m', 'motor')], loop('cell', ['m']))
    expect(result.parts.m.level).toBe(0)
    expect(result.parts.m.status).toBe('weak')
    // the cell's own volts sag well below 3 V under the load
    expect(result.parts.cell.voltage).toBeLessThan(1)
  })

  it('shows 3 V with nothing taking current', () => {
    const result = solveCircuit([part('cell', 'coinCell'), part('vm', 'voltmeter')], loop('cell', ['vm']))
    expect(result.parts.vm.level).toBeCloseTo(3, 2)
  })
})

describe('crank generator', () => {
  const lamp = (level: number) =>
    solveCircuit([part('gen', 'dynamo', { level }), part('l', 'lamp')], loop('gen', ['l'])).parts

  it('makes no power while the crank stands still', () => {
    expect(lamp(0).l.status).toBe('idle')
    expect(lamp(0).gen.status).toBe('idle')
  })

  it('gives more volts the faster you crank', () => {
    const volts = [0.2, 0.5, 1].map((level) => lamp(level).l.voltage)
    expect(volts[1]).toBeGreaterThan(volts[0])
    expect(volts[2]).toBeGreaterThan(volts[1])
    expect(lamp(0.5).l.status).not.toBe('idle')
    // cranking flat out makes the lamp very bright, but does not burn it
    expect(lamp(1).l.damaged).toBe(false)
  })
})

describe('power bank', () => {
  it('gives a steady 5 V', () => {
    const result = solveCircuit(
      [part('pb', 'powerBank'), part('r', 'resistor', { resistance: 100 }), part('led', 'led')],
      loop('pb', ['r', 'led']),
    )
    expect(result.parts.pb.voltage).toBeCloseTo(5, 1)
    expect(result.parts.pb.status).toBe('on')
    expect(result.parts.led.status).toBe('on')
  })

  it('holds back anything above 2 A instead of short-circuiting', () => {
    const steps = run([part('pb', 'powerBank')], [wire('pb:a', 'pb:b')], 0.1)
    const last = steps.at(-1)!
    expect(last.shortCircuit).toBe(false)
    expect(last.parts.pb.status).toBe('over')
    expect(last.parts.pb.current).toBeCloseTo(2, 1)
  })
})

describe('a fuller kit', () => {
  it('has the resistor values of a beginner kit, each with the right stripes', () => {
    expect(RESISTOR_VALUES).toEqual([10, 22, 47, 100, 220, 330, 470, 1000, 2200, 4700, 10000, 100000])
    const names = ['#1c1917', '#7c3f12', '#dc2626', '#f97316', '#facc15', '#16a34a', '#2563eb', '#7c3aed']
    const [black, brown, red, orange, yellow, , , violet] = names
    expect(resistorBands(22).slice(0, 3)).toEqual([red, red, black])
    expect(resistorBands(330).slice(0, 3)).toEqual([orange, orange, brown])
    expect(resistorBands(4700).slice(0, 3)).toEqual([yellow, violet, red])
    expect(resistorBands(100000).slice(0, 3)).toEqual([brown, black, yellow])
  })

  it('lights an LED dimly through 4.7 kΩ and brightly through 220 Ω', () => {
    const led = (resistance: number) =>
      solveCircuit(
        [part('bat', 'battery', { voltage: 9 }), part('r', 'resistor', { resistance }), part('led', 'led')],
        loop('bat', ['r', 'led']),
      ).parts.led
    expect(led(4700).status).toBe('weak')
    expect(led(220).status).toBe('on')
    expect(led(100000).status).toBe('idle')
  })

  it('offers 6 V and 12 V batteries, and 12 V burns a lamp', () => {
    expect(BATTERY_VOLTAGES).toContain(6)
    expect(BATTERY_VOLTAGES).toContain(12)
    const lamp = (voltage: number) =>
      solveCircuit([part('bat', 'battery', { voltage }), part('l', 'lamp')], loop('bat', ['l'])).parts.l
    expect(lamp(6).status).toBe('over')
    expect(lamp(12).damaged).toBe(true)
  })

  it('has orange and pink LEDs, each with its own forward voltage', () => {
    for (const color of ['orange', 'pink'] as const) {
      expect(LED_COLORS[color]).toMatch(/^#/)
      const result = solveCircuit(
        [part('bat', 'battery', { voltage: 4.5 }), part('r', 'resistor', { resistance: 100 }), part('led', 'led', { color })],
        loop('bat', ['r', 'led']),
      )
      expect(result.parts.led.status).toBe('on')
      const vf = LED_FORWARD_VOLTAGE[color]
      expect(result.parts.led.current).toBeCloseTo((4.5 - vf) / (100 + 15 + 0.9), 2)
    }
  })

  it('charges a small capacitor much faster than a big one', () => {
    expect(CAPACITOR_VALUES).toContain(10)
    expect(CAPACITOR_VALUES).toContain(4700)
    const charged = (capacitance: number) =>
      run([part('bat', 'battery'), part('r', 'resistor', { resistance: 1000 }), part('c', 'capacitor', { capacitance })], loop('bat', ['r', 'c']), 0.5).at(-1)!
        .parts.c.level
    expect(charged(100)).toBeGreaterThan(2.9)
    expect(charged(4700)).toBeLessThan(0.5)
  })
})
