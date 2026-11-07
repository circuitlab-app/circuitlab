import { describe, expect, it } from 'vitest'
import { createPartData } from './catalog'
import { solveCircuit, type NetPart, type NetWire } from './solver'
import type { PartData, PartType } from './types'

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

/** battery(+) → x → … → battery(−), each part entered at `a` and left at `b` */
const seriesLoop = (battery: string, chain: string[]): NetWire[] => {
  const wires: NetWire[] = []
  let from = `${battery}:a`
  for (const id of chain) {
    wires.push(wire(from, `${id}:a`))
    from = `${id}:b`
  }
  wires.push(wire(from, `${battery}:b`))
  return wires
}

describe('solveCircuit', () => {
  it('lights a lamp only when the flashlight switch is closed', () => {
    const open = solveCircuit(
      [part('bat', 'battery'), part('sw', 'switch'), part('lamp', 'lamp')],
      seriesLoop('bat', ['sw', 'lamp']),
    )
    expect(open.parts.lamp.level).toBe(0)
    expect(open.batteryCurrent).toBeLessThan(1e-3)

    const closed = solveCircuit(
      [part('bat', 'battery'), part('sw', 'switch', { closed: true }), part('lamp', 'lamp')],
      seriesLoop('bat', ['sw', 'lamp']),
    )
    expect(closed.parts.lamp.status).toBe('on')
    expect(closed.parts.lamp.level).toBeGreaterThan(0.8)
    // 3 V across 10 Ω lamp + 0.6 Ω internal resistance ≈ 0.28 A
    expect(closed.batteryCurrent).toBeCloseTo(3 / 10.62, 2)
  })

  it('makes a lamp dimmer on 1.5 V and burns it on 9 V', () => {
    const dim = solveCircuit(
      [part('bat', 'battery', { voltage: 1.5 }), part('lamp', 'lamp')],
      seriesLoop('bat', ['lamp']),
    )
    expect(dim.parts.lamp.status).toBe('weak')

    const burn = solveCircuit(
      [part('bat', 'battery', { voltage: 9 }), part('lamp', 'lamp')],
      seriesLoop('bat', ['lamp']),
    )
    expect(burn.parts.lamp.damaged).toBe(true)
  })

  it('shares current between two lamps in series and keeps them bright in parallel', () => {
    const series = solveCircuit(
      [part('bat', 'battery'), part('l1', 'lamp'), part('l2', 'lamp')],
      seriesLoop('bat', ['l1', 'l2']),
    )
    expect(series.parts.l1.status).toBe('weak')
    expect(series.parts.l2.level).toBeCloseTo(series.parts.l1.level, 5)

    const parallel = solveCircuit(
      [part('bat', 'battery'), part('l1', 'lamp'), part('l2', 'lamp')],
      [
        wire('bat:a', 'l1:a'),
        wire('bat:a', 'l2:a'),
        wire('l1:b', 'bat:b'),
        wire('l2:b', 'bat:b'),
      ],
    )
    expect(parallel.parts.l1.status).toBe('on')
    expect(parallel.parts.l2.status).toBe('on')
  })

  it('spins a motor in the direction set by the battery polarity', () => {
    const forward = solveCircuit(
      [part('bat', 'battery'), part('m', 'motor')],
      seriesLoop('bat', ['m']),
    )
    expect(forward.parts.m.level).toBeGreaterThan(0.5)

    const backward = solveCircuit(
      [part('bat', 'battery'), part('m', 'motor')],
      [wire('bat:a', 'm:b'), wire('m:a', 'bat:b')],
    )
    expect(backward.parts.m.level).toBeLessThan(-0.5)
  })

  it('treats an LED as a one-way valve', () => {
    const forward = solveCircuit(
      [part('bat', 'battery'), part('r', 'resistor', { resistance: 47 }), part('led', 'led')],
      seriesLoop('bat', ['r', 'led']),
    )
    expect(forward.parts.led.status).toBe('on')
    expect(forward.parts.led.current).toBeGreaterThan(0.015)
    expect(forward.parts.led.current).toBeLessThan(0.03)

    const reversed = solveCircuit(
      [part('bat', 'battery'), part('led', 'led')],
      [wire('bat:a', 'led:b'), wire('led:a', 'bat:b')],
    )
    expect(reversed.parts.led.current).toBe(0)
    expect(reversed.parts.led.status).toBe('reverse')
    expect(reversed.batteryCurrent).toBeLessThan(1e-3)
  })

  it('burns an LED without a resistor on 9 V but not with 220 Ω', () => {
    const naked = solveCircuit(
      [part('bat', 'battery', { voltage: 9 }), part('led', 'led')],
      seriesLoop('bat', ['led']),
    )
    expect(naked.parts.led.damaged).toBe(true)

    const safe = solveCircuit(
      [
        part('bat', 'battery', { voltage: 9 }),
        part('r', 'resistor', { resistance: 220 }),
        part('led', 'led'),
      ],
      seriesLoop('bat', ['r', 'led']),
    )
    expect(safe.parts.led.damaged).toBe(false)
    expect(safe.parts.led.status).toBe('on')
  })

  it('detects a short circuit and reports wire currents', () => {
    const result = solveCircuit([part('bat', 'battery')], [wire('bat:a', 'bat:b')])
    expect(result.shortCircuit).toBe(true)
    expect(result.parts.bat.status).toBe('short')
    const [current] = Object.values(result.wires)
    expect(current).toBeGreaterThan(2)
  })

  it('rings a buzzer only while the push button is held', () => {
    const parts = [part('bat', 'battery'), part('btn', 'button'), part('bz', 'buzzer')]
    const wires = seriesLoop('bat', ['btn', 'bz'])
    expect(solveCircuit(parts, wires).parts.bz.status).toBe('idle')
    parts[1] = part('btn', 'button', { pressed: true })
    expect(solveCircuit(parts, wires).parts.bz.status).toBe('on')
  })

  it('treats a burnt lamp as an open circuit', () => {
    const result = solveCircuit(
      [part('bat', 'battery'), part('lamp', 'lamp', { burnt: true })],
      seriesLoop('bat', ['lamp']),
    )
    expect(result.parts.lamp.status).toBe('burnt')
    expect(result.batteryCurrent).toBeLessThan(1e-3)
  })

  it('dims a lamp with the dimmer knob', () => {
    const at = (level: number) =>
      solveCircuit(
        [part('bat', 'battery'), part('d', 'dimmer', { level }), part('lamp', 'lamp')],
        seriesLoop('bat', ['d', 'lamp']),
      ).parts.lamp.level
    expect(at(1)).toBeGreaterThan(at(0.5))
    expect(at(0.5)).toBeGreaterThan(at(0.1))
  })

  it('ignores wires that point at parts that no longer exist', () => {
    const result = solveCircuit([part('bat', 'battery')], [wire('bat:a', 'ghost:a')])
    expect(result.wires).toEqual({})
    expect(result.shortCircuit).toBe(false)
  })
})

describe('solveCircuit: electronic parts', () => {
  it('lets a diode pass current one way only', () => {
    const forward = solveCircuit(
      [part('bat', 'battery'), part('d', 'diode'), part('lamp', 'lamp')],
      seriesLoop('bat', ['d', 'lamp']),
    )
    expect(forward.parts.d.status).toBe('on')
    expect(forward.parts.lamp.level).toBeGreaterThan(0.3)

    const backward = solveCircuit(
      [part('bat', 'battery'), part('d', 'diode'), part('lamp', 'lamp')],
      [wire('bat:a', 'd:b'), wire('d:a', 'lamp:a'), wire('lamp:b', 'bat:b')],
    )
    expect(backward.parts.d.current).toBe(0)
    expect(backward.parts.lamp.level).toBe(0)
  })

  it('charges a capacitor step by step, and it keeps its charge afterwards', () => {
    const parts = [part('bat', 'battery', { voltage: 9 }), part('r', 'resistor', { resistance: 470 }), part('c', 'capacitor')]
    const wires = seriesLoop('bat', ['r', 'c'])
    let caps: Record<string, number> = {}
    const seen: number[] = []
    for (let step = 0; step < 40; step++) {
      const result = solveCircuit(parts, wires, { dt: 0.05, capacitors: caps })
      caps = result.capacitors
      seen.push(caps.c)
    }
    // rises smoothly towards the battery voltage (τ = 470 Ω × 2200 µF ≈ 1 s)
    expect(seen[0]).toBeGreaterThan(0)
    expect(seen[0]).toBeLessThan(1)
    expect(seen[19]).toBeGreaterThan(seen[9])
    expect(seen[39]).toBeGreaterThan(7)
    expect(seen[39]).toBeLessThan(9)

    // with nothing connected it simply holds its voltage
    const alone = solveCircuit([part('c', 'capacitor')], [], { capacitors: caps })
    expect(alone.capacitors.c).toBeCloseTo(caps.c, 3)
  })

  it('switches a lamp with a transistor only when the base gets current', () => {
    const parts = (withBase: boolean) => [
      part('bat', 'battery', { voltage: 4.5 }),
      part('lamp', 'lamp'),
      part('q', 'transistor'),
      part('rb', 'resistor', { resistance: 1000 }),
      part('sw', 'switch', { closed: withBase }),
    ]
    const wires = [
      wire('bat:a', 'lamp:a'),
      wire('lamp:b', 'q:C'),
      wire('q:E', 'bat:b'),
      wire('bat:a', 'sw:a'),
      wire('sw:b', 'rb:a'),
      wire('rb:b', 'q:B'),
    ]
    const off = solveCircuit(parts(false), wires)
    expect(off.parts.lamp.level).toBe(0)
    expect(off.parts.q.status).toBe('idle')

    const on = solveCircuit(parts(true), wires)
    expect(on.parts.q.status).toBe('on')
    expect(on.parts.lamp.level).toBeGreaterThan(0.5)
    // a few milliamps into the base control a much bigger current
    expect(on.parts.q.current).toBeGreaterThan(0.2)
  })

  it('blows a fuse before a lamp gets too much power', () => {
    const result = solveCircuit(
      [part('bat', 'battery', { voltage: 9 }), part('f', 'fuse', { rating: 0.5 }), part('lamp', 'lamp')],
      seriesLoop('bat', ['f', 'lamp']),
    )
    expect(result.parts.f.damaged).toBe(true)
  })

  it('runs the Arduino blink program on pin 13', () => {
    const parts = [part('uno', 'arduino'), part('r', 'resistor', { resistance: 220 }), part('led', 'led')]
    const wires = [wire('uno:D13', 'r:a'), wire('r:b', 'led:a'), wire('led:b', 'uno:GND')]
    const high = solveCircuit(parts, wires, { time: 0.25 })
    const low = solveCircuit(parts, wires, { time: 0.75 })
    expect(high.parts.uno.pins?.D13).toBe(1)
    expect(high.parts.led.status).toBe('on')
    expect(low.parts.led.level).toBe(0)
    expect(high.hasBattery).toBe(true)
  })

  it('measures voltage and current with the meters', () => {
    const result = solveCircuit(
      [part('bat', 'battery', { voltage: 3 }), part('amm', 'ammeter'), part('lamp', 'lamp'), part('vm', 'voltmeter')],
      [...seriesLoop('bat', ['amm', 'lamp']), wire('vm:a', 'lamp:a'), wire('vm:b', 'lamp:b')],
    )
    expect(result.parts.vm.level).toBeGreaterThan(2.5)
    expect(result.parts.vm.level).toBeLessThan(3)
    expect(result.parts.amm.level).toBeCloseTo(result.parts.lamp.current, 3)
  })

  it('lets more current through a light sensor in bright light', () => {
    const run = (light: number) =>
      solveCircuit([part('bat', 'battery'), part('ldr', 'ldr', { light })], seriesLoop('bat', ['ldr'])).parts.ldr.current
    expect(run(1)).toBeGreaterThan(run(0) * 50)
  })

  it('reads a sensor on A0 and follows it with a PWM pin', () => {
    const parts = (sense: number) => [
      part('uno', 'arduino', { pins: { D9: 'follow' } }),
      part('temp', 'tempSensor', { sense }),
      part('r', 'resistor', { resistance: 220 }),
      part('led', 'led'),
    ]
    const wires = [
      wire('uno:5V', 'temp:VCC'),
      wire('temp:GND', 'uno:GND'),
      wire('temp:OUT', 'uno:A0'),
      wire('uno:D9', 'r:a'),
      wire('r:b', 'led:a'),
      wire('led:b', 'uno:GND'),
    ]
    // like a real loop(): the pin uses what A0 read in the step before
    const run = (sense: number) => {
      const first = solveCircuit(parts(sense), wires)
      return solveCircuit(parts(sense), wires, { inputs: first.inputs })
    }
    const hot = run(0.9)
    const cold = run(0.1)
    expect(hot.inputs.uno).toBeGreaterThan(4)
    expect(cold.inputs.uno).toBeLessThan(1)
    expect(hot.parts.uno.pins?.D9).toBeGreaterThan(0.8)
    expect(hot.parts.led.level).toBeGreaterThan(cold.parts.led.level)
  })

  it('runs every board at its own voltage', () => {
    const boards: [PartType, string, number][] = [
      ['arduino', 'D13', 5],
      ['mega', 'D9', 5],
      ['esp32', 'G2', 3.3],
      ['pico', 'GP15', 3.3],
      ['microbit', 'P0', 3.3],
      ['raspberrypi', 'GPIO17', 3.3],
    ]
    for (const [type, pin, volts] of boards) {
      const result = solveCircuit(
        [part('board', type, { pins: { [pin]: 'on' } }), part('vm', 'voltmeter')],
        [wire(`board:${pin}`, 'vm:a'), wire('vm:b', 'board:GND')],
      )
      expect(result.parts.vm.level).toBeCloseTo(volts, 1)
      expect(result.hasBattery).toBe(true)
    }
  })

  it('needs power before a sensor module gives a signal', () => {
    const unpowered = solveCircuit([part('pir', 'pir', { sense: 1 })], [])
    expect(unpowered.parts.pir.status).toBe('idle')
    const powered = solveCircuit(
      [part('bat', 'battery', { voltage: 4.5 }), part('pir', 'pir', { sense: 1 })],
      [wire('bat:a', 'pir:VCC'), wire('pir:GND', 'bat:b')],
    )
    expect(powered.parts.pir.status).toBe('on')
    expect(powered.parts.pir.level).toBe(1)
  })

  it('turns a servo to the angle its signal asks for', () => {
    const at = (mode: 'on' | 'off') =>
      solveCircuit(
        [part('uno', 'arduino', { pins: { D9: mode } }), part('servo', 'servo')],
        [wire('uno:5V', 'servo:VCC'), wire('servo:GND', 'uno:GND'), wire('uno:D9', 'servo:OUT')],
      ).parts.servo
    expect(at('on').status).toBe('on')
    expect(at('on').level).toBeGreaterThan(0.9)
    expect(at('off').level).toBeLessThan(0.05)
  })

  it('lets more current through a thermistor when it is hot', () => {
    const run = (sense: number) =>
      solveCircuit([part('bat', 'battery'), part('th', 'thermistor', { sense })], seriesLoop('bat', ['th'])).parts.th
        .current
    expect(run(1)).toBeGreaterThan(run(0) * 5)
  })

  it('closes a tilt switch only when tilted', () => {
    const run = (sense: number) =>
      solveCircuit(
        [part('bat', 'battery'), part('tilt', 'tilt', { sense }), part('lamp', 'lamp')],
        seriesLoop('bat', ['tilt', 'lamp']),
      ).parts.lamp.level
    expect(run(1)).toBeGreaterThan(0.3)
    expect(run(0)).toBe(0)
  })

  it('powers a motor from the solar panel only when there is light', () => {
    const run = (light: number) =>
      solveCircuit([part('sun', 'solar', { light }), part('m', 'motor')], seriesLoop('sun', ['m'])).parts.m.level
    expect(run(1)).toBeGreaterThan(0.12)
    expect(run(0)).toBe(0)
  })
})

describe('solveCircuit: screens', () => {
  const powered = (type: PartType, extra: Partial<PartData> = {}, voltage = 4.5) =>
    solveCircuit(
      [part('bat', 'battery', { voltage }), part('scr', type, extra)],
      [wire('bat:a', 'scr:VCC'), wire('scr:GND', 'bat:b')],
    )

  it('lights every screen only when it gets about 3 volts or more', () => {
    for (const type of ['segment', 'lcd', 'oled', 'tft', 'matrix', 'ledwall'] as PartType[]) {
      expect(solveCircuit([part('scr', type)], []).parts.scr.status).toBe('idle')
      const on = powered(type)
      expect(on.parts.scr.status).toBe('on')
      expect(on.parts.scr.current).toBeGreaterThan(0.005)
      expect(on.shortCircuit).toBe(false)
      expect(powered(type, {}, 1.5).parts.scr.status).toBe('weak')
    }
  })

  it('says a screen is joined the wrong way round', () => {
    const result = solveCircuit(
      [part('bat', 'battery'), part('scr', 'lcd')],
      [wire('bat:a', 'scr:GND'), wire('scr:VCC', 'bat:b')],
    )
    expect(result.parts.scr.status).toBe('reverse')
  })

  it('lets a bigger, brighter LED wall take more current, but never trips the short-circuit limit', () => {
    const small = powered('ledwall', { cols: 1, rows: 1 }, 9).parts.scr.current
    const big = powered('ledwall', { cols: 6, rows: 3 }, 9).parts.scr.current
    const dim = powered('ledwall', { cols: 6, rows: 3, brightness: 0.2 }, 9).parts.scr.current
    expect(big).toBeGreaterThan(small * 3)
    expect(dim).toBeLessThan(big)
    const biggest = powered('ledwall', { cols: 12, rows: 8, brightness: 1 }, 9)
    expect(biggest.parts.scr.status).toBe('on')
    expect(biggest.shortCircuit).toBe(false)
    expect(biggest.batteryCurrent).toBeLessThan(1)
  })

  it('needs a strong supply for a big wall: one small solar panel is not enough', () => {
    const result = solveCircuit(
      [part('sun', 'solar', { light: 1 }), part('scr', 'ledwall', { cols: 6, rows: 3 })],
      [wire('sun:a', 'scr:VCC'), wire('scr:GND', 'sun:b')],
    )
    expect(result.parts.scr.status).toBe('weak')
  })

  it('reads the voltage on S without loading the circuit', () => {
    // two equal resistors make half the battery voltage; S must not pull it down
    const parts = [
      part('bat', 'battery', { voltage: 9 }),
      part('r1', 'resistor', { resistance: 1000 }),
      part('r2', 'resistor', { resistance: 1000 }),
      part('seg', 'segment', { mode: 'volts' }),
    ]
    const wires = [
      ...seriesLoop('bat', ['r1', 'r2']),
      wire('bat:a', 'seg:VCC'),
      wire('seg:GND', 'bat:b'),
      wire('r1:b', 'seg:S'),
    ]
    const result = solveCircuit(parts, wires)
    expect(result.parts.seg.status).toBe('on')
    expect(result.parts.seg.level).toBeGreaterThan(4.2)
    expect(result.parts.seg.level).toBeLessThan(4.6)

    // nothing on S reads (almost) zero: a few millivolts at most, shown as 0.0
    const open = solveCircuit(parts, wires.slice(0, -1))
    expect(open.parts.seg.level).toBeLessThan(0.01)
  })

  it('reads an Arduino pin on the OLED S input', () => {
    const result = solveCircuit(
      [part('uno', 'arduino', { pins: { D13: 'on' } }), part('oled', 'oled', { mode: 'graph' })],
      [wire('uno:5V', 'oled:VCC'), wire('oled:GND', 'uno:GND'), wire('uno:D13', 'oled:S')],
    )
    expect(result.parts.oled.status).toBe('on')
    expect(result.parts.oled.level).toBeCloseTo(5, 1)
  })
})

describe('screen examples', () => {
  it('powers every screen in the display examples', async () => {
    const { buildPreset } = await import('./presets')
    for (const id of ['cityTv', 'goldSign', 'counter'] as const) {
      const { nodes, edges } = buildPreset(id, { citySign: 'Hello' })
      const result = solveCircuit(
        nodes.map((n) => ({ id: n.id, data: n.data })),
        edges,
      )
      expect(result.shortCircuit).toBe(false)
      for (const node of nodes.filter((n) => ['ledwall', 'matrix', 'segment'].includes(n.data.type))) {
        expect(result.parts[node.id].status).toBe('on')
      }
    }
  })
})

describe('solveCircuit: workshop parts', () => {
  /** a switch for a gate input: closed joins the input to +, open leaves it LOW */
  const gateCircuit = (type: PartType, a: boolean, b: boolean) => {
    const parts = [
      part('bat', 'battery', { voltage: 4.5 }),
      part('g', type),
      part('sa', 'switch', { closed: a }),
      part('sb', 'switch', { closed: b }),
      part('r', 'resistor', { resistance: 220 }),
      part('led', 'led'),
    ]
    const wires = [
      wire('bat:a', 'g:VCC'),
      wire('g:GND', 'bat:b'),
      wire('bat:a', 'sa:a'),
      wire('sa:b', 'g:A'),
      ...(type === 'notGate' ? [] : [wire('bat:a', 'sb:a'), wire('sb:b', 'g:B')]),
      wire('g:Y', 'r:a'),
      wire('r:b', 'led:a'),
      wire('led:b', 'bat:b'),
    ]
    return solveCircuit(parts, wires)
  }

  it('gives the voltage the power supply is set to', () => {
    const result = solveCircuit(
      [part('ps', 'powerSupply', { voltage: 3, limit: 2 }), part('lamp', 'lamp')],
      seriesLoop('ps', ['lamp']),
    )
    expect(result.hasBattery).toBe(true)
    expect(result.parts.lamp.voltage).toBeCloseTo(3, 1)
    expect(result.parts.ps.status).toBe('on')
    expect(result.parts.ps.current).toBeCloseTo(0.3, 2)
  })

  it('holds the current at the limit instead of short-circuiting', () => {
    const shorted = solveCircuit([part('ps', 'powerSupply', { voltage: 12, limit: 0.5 })], [wire('ps:a', 'ps:b')])
    expect(shorted.shortCircuit).toBe(false)
    expect(shorted.parts.ps.status).toBe('over')
    expect(shorted.parts.ps.current).toBeCloseTo(0.5, 2)
    expect(shorted.states.ps).toBe(1)

    // a bare LED on 12 V would burn, but 0.1 A keeps it alive (just too bright)
    const led = solveCircuit(
      [part('ps', 'powerSupply', { voltage: 12, limit: 0.1 }), part('led', 'led')],
      seriesLoop('ps', ['led']),
    )
    expect(led.parts.led.damaged).toBe(false)
    expect(led.parts.led.current).toBeCloseTo(0.1, 2)
    expect(led.parts.ps.voltage).toBeLessThan(4)
  })

  it('splits the voltage with the potentiometer knob', () => {
    const parts = (level: number) => [
      part('bat', 'battery', { voltage: 9 }),
      part('pot', 'potentiometer', { level }),
      part('vm', 'voltmeter'),
    ]
    const wires = [wire('bat:a', 'pot:A'), wire('pot:B', 'bat:b'), wire('pot:W', 'vm:a'), wire('vm:b', 'bat:b')]
    for (const level of [0, 0.25, 0.5, 1]) {
      const result = solveCircuit(parts(level), wires)
      const supply = result.parts.pot.voltage
      expect(result.parts.vm.level).toBeCloseTo(supply * level, 1)
      expect(result.parts.pot.level).toBeCloseTo(supply * level, 1)
    }
  })

  it('turns a servo with the potentiometer', () => {
    const result = solveCircuit(
      [part('uno', 'arduino', { pins: {} }), part('pot', 'potentiometer', { level: 0.5 }), part('servo', 'servo')],
      [
        wire('uno:5V', 'pot:A'),
        wire('pot:B', 'uno:GND'),
        wire('uno:5V', 'servo:VCC'),
        wire('servo:GND', 'uno:GND'),
        wire('pot:W', 'servo:OUT'),
      ],
    )
    // half way round: about 90°
    expect(result.parts.servo.level).toBeGreaterThan(0.45)
    expect(result.parts.servo.level).toBeLessThan(0.52)
  })

  it('gets hot when the wiper is joined straight to an end', () => {
    const result = solveCircuit(
      [part('bat', 'battery', { voltage: 9 }), part('pot', 'potentiometer', { level: 0.98 })],
      [wire('bat:a', 'pot:A'), wire('pot:W', 'bat:b')],
    )
    expect(result.parts.pot.status).toBe('over')
  })

  it('closes the relay switch when its coil gets enough volts', () => {
    const circuit = (coilVolts: number) =>
      solveCircuit(
        [
          part('coil', 'battery', { voltage: coilVolts }),
          part('relay', 'relay'),
          part('bat', 'battery', { voltage: 3 }),
          part('lamp', 'lamp'),
        ],
        [
          wire('coil:a', 'relay:a'),
          wire('relay:b', 'coil:b'),
          wire('bat:a', 'relay:COM'),
          wire('relay:NO', 'lamp:a'),
          wire('lamp:b', 'bat:b'),
        ],
      )
    const weak = circuit(3)
    expect(weak.parts.relay.level).toBe(0)
    expect(weak.parts.relay.status).toBe('weak')
    expect(weak.parts.lamp.level).toBe(0)

    const strong = circuit(4.5)
    expect(strong.parts.relay.level).toBe(1)
    expect(strong.parts.relay.status).toBe('on')
    expect(strong.parts.lamp.status).toBe('on')
    expect(strong.parts.relay.channels?.contact).toBeGreaterThan(0.2)
    // the small coil current (about 64 mA) switches the big lamp current
    expect(Math.abs(strong.parts.relay.current)).toBeLessThan(0.07)
  })

  it('remembers a relay that holds itself closed', () => {
    // the button starts the coil; the relay's own switch then keeps the coil powered
    const parts = (pressed: boolean) => [
      part('bat', 'battery', { voltage: 9 }),
      part('btn', 'button', { pressed }),
      part('relay', 'relay'),
    ]
    const wires = [
      wire('bat:a', 'btn:a'),
      wire('btn:b', 'relay:a'),
      wire('relay:b', 'bat:b'),
      wire('bat:a', 'relay:COM'),
      wire('relay:NO', 'relay:a'),
    ]
    const before = solveCircuit(parts(false), wires)
    expect(before.parts.relay.level).toBe(0)

    const pressed = solveCircuit(parts(true), wires, { states: before.states })
    expect(pressed.parts.relay.level).toBe(1)

    const released = solveCircuit(parts(false), wires, { states: pressed.states })
    expect(released.parts.relay.level).toBe(1)
  })

  it('mixes the colours of the RGB LED', () => {
    const result = solveCircuit(
      [
        part('bat', 'battery', { voltage: 9 }),
        part('rr', 'resistor', { resistance: 220 }),
        part('rb', 'resistor', { resistance: 220 }),
        part('rgb', 'rgbLed'),
      ],
      [
        wire('bat:a', 'rr:a'),
        wire('rr:b', 'rgb:R'),
        wire('bat:a', 'rb:a'),
        wire('rb:b', 'rgb:B'),
        wire('rgb:K', 'bat:b'),
      ],
    )
    const rgb = result.parts.rgb
    expect(rgb.status).toBe('on')
    expect(rgb.channels?.R).toBeGreaterThan(0.8)
    expect(rgb.channels?.B).toBeGreaterThan(0.8)
    expect(rgb.channels?.G).toBe(0)

    const backwards = solveCircuit(
      [part('bat', 'battery', { voltage: 3 }), part('rgb', 'rgbLed')],
      [wire('bat:a', 'rgb:K'), wire('rgb:G', 'bat:b')],
    )
    expect(backwards.parts.rgb.status).toBe('reverse')
    expect(backwards.parts.rgb.level).toBe(0)
  })

  it('burns an RGB LED colour that gets far too much current', () => {
    const result = solveCircuit(
      [part('bat', 'battery', { voltage: 9 }), part('rgb', 'rgbLed')],
      [wire('bat:a', 'rgb:R'), wire('rgb:K', 'bat:b')],
    )
    expect(result.parts.rgb.damaged).toBe(true)
  })

  it('plays the speaker louder with more power and burns it on 9 V', () => {
    const at = (voltage: number) =>
      solveCircuit([part('bat', 'battery', { voltage }), part('sp', 'speaker')], seriesLoop('bat', ['sp'])).parts.sp
    expect(at(1.5).status).toBe('on')
    expect(at(3).level).toBeGreaterThan(at(1.5).level)
    expect(at(4.5).status).toBe('over')
    expect(at(9).damaged).toBe(true)
  })

  it('shakes the vibration motor either way round', () => {
    const forward = solveCircuit(
      [part('bat', 'battery'), part('vib', 'vibration')],
      seriesLoop('bat', ['vib']),
    )
    const backward = solveCircuit(
      [part('bat', 'battery'), part('vib', 'vibration')],
      [wire('bat:a', 'vib:b'), wire('vib:a', 'bat:b')],
    )
    expect(forward.parts.vib.status).toBe('on')
    expect(backward.parts.vib.level).toBeCloseTo(forward.parts.vib.level, 5)
    const fast = solveCircuit(
      [part('bat', 'battery', { voltage: 9 }), part('vib', 'vibration')],
      seriesLoop('bat', ['vib']),
    )
    expect(fast.parts.vib.status).toBe('over')
  })

  it('swaps the electromagnet poles when the current is reversed', () => {
    const forward = solveCircuit(
      [part('bat', 'battery'), part('em', 'electromagnet')],
      seriesLoop('bat', ['em']),
    )
    const backward = solveCircuit(
      [part('bat', 'battery'), part('em', 'electromagnet')],
      [wire('bat:a', 'em:b'), wire('em:a', 'bat:b')],
    )
    expect(forward.parts.em.status).toBe('on')
    expect(forward.parts.em.level).toBeGreaterThan(0.6)
    expect(backward.parts.em.level).toBeCloseTo(-forward.parts.em.level, 5)
    const hot = solveCircuit(
      [part('bat', 'battery', { voltage: 9 }), part('em', 'electromagnet')],
      seriesLoop('bat', ['em']),
    )
    expect(hot.parts.em.status).toBe('over')
  })

  it('gives a steady 5 V from the regulator', () => {
    const circuit = (voltage: number) =>
      solveCircuit(
        [part('bat', 'battery', { voltage }), part('reg', 'regulator'), part('r', 'resistor', { resistance: 100 })],
        [wire('bat:a', 'reg:IN'), wire('reg:GND', 'bat:b'), wire('reg:OUT', 'r:a'), wire('r:b', 'bat:b')],
      )
    const nine = circuit(9)
    expect(nine.parts.reg.status).toBe('on')
    expect(nine.parts.reg.voltage).toBeCloseTo(5, 2)
    expect(nine.parts.r.voltage).toBeCloseTo(5, 2)
    // what goes in comes out (plus a few milliamps for the chip itself)
    expect(nine.batteryCurrent).toBeGreaterThan(0.05)
    expect(nine.batteryCurrent).toBeLessThan(0.058)
    expect(nine.parts.reg.power).toBeCloseTo((nine.parts.reg.channels!.in - 5) * 0.05, 1)

    const low = circuit(4.5)
    expect(low.parts.reg.status).toBe('weak')
    expect(low.parts.reg.voltage).toBeLessThan(3)

    const powerSupply = solveCircuit(
      [part('ps', 'powerSupply', { voltage: 12, limit: 2 }), part('reg', 'regulator'), part('lamp', 'lamp')],
      [wire('ps:a', 'reg:IN'), wire('reg:GND', 'ps:b'), wire('reg:OUT', 'lamp:a'), wire('lamp:b', 'ps:b')],
    )
    expect(powerSupply.parts.lamp.voltage).toBeCloseTo(5, 1)
    expect(powerSupply.parts.reg.voltage).toBeGreaterThan(4.98)
    // 7 V × 0.5 A of heat
    expect(powerSupply.parts.reg.status).toBe('over')
  })

  it('stays off when the regulator is joined the wrong way', () => {
    const result = solveCircuit(
      [part('bat', 'battery', { voltage: 9 }), part('reg', 'regulator'), part('lamp', 'lamp')],
      [wire('bat:b', 'reg:IN'), wire('reg:GND', 'bat:a'), wire('reg:OUT', 'lamp:a'), wire('lamp:b', 'bat:a')],
    )
    expect(result.parts.reg.status).toBe('reverse')
    expect(Math.abs(result.parts.lamp.current)).toBeLessThan(1e-3)
  })

  it('follows the truth table of every logic gate', () => {
    const table: Record<string, boolean[]> = {
      // inputs: 00, 01, 10, 11
      andGate: [false, false, false, true],
      orGate: [false, true, true, true],
      xorGate: [false, true, true, false],
    }
    for (const [type, outputs] of Object.entries(table)) {
      ;[
        [false, false],
        [false, true],
        [true, false],
        [true, true],
      ].forEach(([a, b], i) => {
        const result = gateCircuit(type as PartType, a, b)
        expect(result.parts.g.level, `${type} ${a} ${b}`).toBe(outputs[i] ? 1 : 0)
        expect(result.parts.led.status === 'on', `${type} ${a} ${b}`).toBe(outputs[i])
        expect(result.parts.g.channels).toEqual({ A: a ? 1 : 0, B: b ? 1 : 0, Y: outputs[i] ? 1 : 0 })
      })
    }
    // NOT: an input left alone reads LOW, so the output is HIGH
    expect(gateCircuit('notGate', false, false).parts.led.status).toBe('on')
    expect(gateCircuit('notGate', true, false).parts.led.status).toBe('idle')
  })

  it('gives a HIGH output of about the supply voltage', () => {
    const result = solveCircuit(
      [part('bat', 'battery', { voltage: 9 }), part('g', 'notGate'), part('vm', 'voltmeter')],
      [wire('bat:a', 'g:VCC'), wire('g:GND', 'bat:b'), wire('g:Y', 'vm:a'), wire('vm:b', 'bat:b')],
    )
    expect(result.parts.vm.level).toBeCloseTo(result.parts.g.voltage, 1)
  })

  it('does nothing without power, and chains gates together', () => {
    const unpowered = solveCircuit(
      [part('bat', 'battery'), part('g', 'notGate'), part('led', 'led')],
      [wire('g:Y', 'led:a'), wire('led:b', 'bat:b'), wire('g:GND', 'bat:b')],
    )
    expect(unpowered.parts.g.status).toBe('idle')
    expect(unpowered.parts.led.level).toBe(0)

    // NOT → NOT gives back the input
    const chain = solveCircuit(
      [part('bat', 'battery', { voltage: 4.5 }), part('n1', 'notGate'), part('n2', 'notGate'), part('vm', 'voltmeter')],
      [
        wire('bat:a', 'n1:VCC'),
        wire('n1:GND', 'bat:b'),
        wire('bat:a', 'n2:VCC'),
        wire('n2:GND', 'bat:b'),
        wire('bat:a', 'n1:A'),
        wire('n1:Y', 'n2:A'),
        wire('n2:Y', 'vm:a'),
        wire('vm:b', 'bat:b'),
      ],
    )
    expect(chain.parts.n1.level).toBe(0)
    expect(chain.parts.n2.level).toBe(1)
    expect(chain.parts.vm.level).toBeGreaterThan(4)
  })

  it('stays calm when a NOT gate feeds its own input', () => {
    const result = solveCircuit(
      [part('bat', 'battery', { voltage: 4.5 }), part('g', 'notGate')],
      [wire('bat:a', 'g:VCC'), wire('g:GND', 'bat:b'), wire('g:Y', 'g:A')],
    )
    for (const r of Object.values(result.parts)) {
      expect(Number.isFinite(r.voltage)).toBe(true)
      expect(Number.isFinite(r.current)).toBe(true)
    }
  })

  it('blinks the 555 on its own, faster when set faster', () => {
    const at = (time: number, rate = 1, voltage = 9) =>
      solveCircuit(
        [part('bat', 'battery', { voltage }), part('t', 'timer555', { rate }), part('r', 'resistor', { resistance: 470 }), part('led', 'led')],
        [
          wire('bat:a', 't:VCC'),
          wire('t:GND', 'bat:b'),
          wire('t:OUT', 'r:a'),
          wire('r:b', 'led:a'),
          wire('led:b', 'bat:b'),
        ],
        { time },
      ).parts
    expect(at(0.1).t.status).toBe('on')
    expect(at(0.1).led.status).toBe('on')
    expect(at(0.6).led.level).toBe(0)
    expect(at(1.1).led.status).toBe('on')
    // twice a second: off again after a quarter of a second
    expect(at(0.3, 2).led.level).toBe(0)
    // 3 V is not enough for a 555
    expect(at(0.1, 1, 3).t.status).toBe('weak')
    expect(at(0.1, 1, 3).led.level).toBe(0)
  })

  it('watches a voltage with the oscilloscope without loading it', () => {
    const result = solveCircuit(
      [part('bat', 'battery', { voltage: 9 }), part('r1', 'resistor', { resistance: 1000 }), part('r2', 'resistor', { resistance: 1000 }), part('scope', 'oscilloscope')],
      [
        ...seriesLoop('bat', ['r1', 'r2']),
        wire('r1:b', 'scope:a'),
        wire('scope:b', 'bat:b'),
      ],
    )
    expect(result.parts.scope.status).toBe('on')
    expect(result.parts.scope.level).toBeCloseTo(4.5, 1)

    // a probe on a wire at 0 V is still watching; a loose scope is not
    const zero = solveCircuit([part('bat', 'battery'), part('scope', 'oscilloscope')], [wire('bat:b', 'scope:a')])
    expect(zero.parts.scope.status).toBe('on')
    expect(solveCircuit([part('scope', 'oscilloscope')], []).parts.scope.status).toBe('idle')
  })
})
