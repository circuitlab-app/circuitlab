import { describe, expect, it } from 'vitest'
import { ar } from '@/i18n/ar'
import { en } from '@/i18n/en'
import { fa } from '@/i18n/fa'
import { arLearn } from '@/i18n/learn/ar'
import { enLearn } from '@/i18n/learn/en'
import { faLearn } from '@/i18n/learn/fa'
import { BOARDS, PARTS, PART_ORDER, RADIOS, RADIO_TYPES, createPartData, isRadio, isTimeDependent, pinModesFor } from './catalog'
import { boardCode } from './code'
import { radioStep } from './devices'
import { DEFAULT_STEP, solveCircuit, type NetPart, type NetWire, type SimResult } from './solver'
import type { PartData, PartType, PinMode } from './types'

/*
 * The boards from the real world (the car's ECU, the factory PLC, the oil
 * well's RTU), the message modules (SMS, Wi-Fi, Bluetooth, LoRa, GPS, CAN,
 * RS-485) and the pressure sensor.
 */

const NEW_PARTS: PartType[] = [
  'ecu',
  'plc',
  'rtu',
  'gsm',
  'wifi',
  'bluetooth',
  'lora',
  'gps',
  'canBus',
  'rs485',
  'pressureSensor',
  'beacon',
]

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
const join = (...pairs: [string, string][]) => pairs.map(([from, to]) => wire(from, to))

/** Runs the circuit step by step like the app, the parts as `build` gives them at each moment. */
function timeline(build: (t: number) => NetPart[], wires: NetWire[], seconds: number): SimResult[] {
  const steps: SimResult[] = []
  let previous: SimResult | undefined
  for (let i = 0; i * DEFAULT_STEP <= seconds + 1e-9; i++) {
    const time = i * DEFAULT_STEP
    previous = solveCircuit(build(time), wires, {
      time,
      dt: DEFAULT_STEP,
      capacitors: previous?.capacitors,
      inputs: previous?.inputs,
      states: previous?.states,
    })
    steps.push(previous)
  }
  return steps
}
/** The step at `t` seconds. */
const at = (steps: SimResult[], t: number) => steps[Math.round(t / DEFAULT_STEP)]

/** A module on a battery, its IN (if it has one) on the middle of two equal resistors. */
function onBattery(type: PartType, volts = 4.5) {
  const parts = [
    part('bat', 'battery', { voltage: volts }),
    part('m', type),
    part('r1', 'resistor', { resistance: 1000 }),
    part('r2', 'resistor', { resistance: 1000 }),
  ]
  const wires = join(['bat:a', 'm:VCC'], ['m:GND', 'bat:b'], ['bat:a', 'r1:a'], ['r1:b', 'r2:a'], ['r2:b', 'bat:b'])
  if (isRadio(type) && !RADIOS[type].output) wires.push(wire('r1:b', 'm:IN'))
  return { parts, wires }
}

describe('every new board and module', () => {
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
    for (const dictionary of [en, fa, ar]) {
      for (const type of RADIO_TYPES) {
        expect(dictionary.radio.joining[type] && dictionary.radio.receivers[type], type).toBeTruthy()
        expect(dictionary.radio.tips.joining[type] && dictionary.radio.tips.ready[type], type).toBeTruthy()
      }
    }
  })

  it('sits on an empty board without making a sound or burning', () => {
    const parts = NEW_PARTS.map((type, i) => part(`p${i}`, type))
    for (const r of timeline(() => parts, [], 3)) {
      for (const result of Object.values(r.parts)) {
        expect(result.damaged).toBe(false)
        expect(Number.isFinite(result.voltage)).toBe(true)
        expect(Number.isFinite(result.current)).toBe(true)
      }
    }
  })
})

describe('the boards from the real world', () => {
  it('ECU: OUT1 … OUT3 can fade (PWM), OUT4 … OUT6 only switch; every pin can follow AIN', () => {
    expect(pinModesFor('ecu', 'OUT1')).toContain('fade')
    expect(pinModesFor('ecu', 'OUT6')).not.toContain('fade')
    expect(pinModesFor('ecu', 'OUT6')).toContain('follow')
    expect(BOARDS.ecu.input).toBe('AIN')
  })

  it('PLC and RTU: only their analog outputs (AQ0, AO1, AO2) can be set between on and off', () => {
    expect(pinModesFor('plc', 'AQ0')).toContain('fade')
    for (const pin of ['Q0', 'Q1', 'Q2', 'Q3', 'Q4']) expect(pinModesFor('plc', pin)).not.toContain('fade')
    expect(pinModesFor('rtu', 'AO2')).toContain('fade')
    expect(pinModesFor('rtu', 'DO1')).not.toContain('fade')
  })

  it('lights an LED on every output through 220 Ω without overloading a pin', () => {
    for (const type of ['ecu', 'plc', 'rtu'] as const) {
      const pins = BOARDS[type].pins
      const parts = [
        part('board', type, { pins: Object.fromEntries(pins.map((p) => [p, 'on' as PinMode])) }),
        ...pins.flatMap((_, i) => [part(`r${i}`, 'resistor', { resistance: 220 }), part(`l${i}`, 'led')]),
      ]
      const wires = pins.flatMap((pin, i) => join([`board:${pin}`, `r${i}:a`], [`r${i}:b`, `l${i}:a`], [`l${i}:b`, 'board:GND']))
      const r = solveCircuit(parts, wires)
      expect(r.parts.board.status, type).toBe('on')
      for (let i = 0; i < pins.length; i++) expect(r.parts[`l${i}`].status, `${type} ${pins[i]}`).toBe('on')
    }
  })

  it('writes Structured Text for the PLC, each output at its address', () => {
    const code = boardCode('plc', { AQ0: 'follow', Q0: 'on', Q1: 'blink', Q2: 'off', Q3: 'step2', Q4: 'alarm' })
    expect(code).toMatch(/^PROGRAM Main\nVAR\n/)
    expect(code).toContain('AQ0 AT %QW0 : INT;')
    expect(code).toContain('Q0 AT %QX0.0 : BOOL;')
    expect(code).toContain('Q4 AT %QX0.4 : BOOL;')
    expect(code).not.toContain('Q2 AT')
    expect(code).toContain('AI0 AT %IW0 : INT;  (* 0 … 27648 *)')
    expect(code).toContain('AQ0 := AI0;')
    expect(code).toContain('Q0 := TRUE;')
    expect(code).toContain('Q1 := (ms MOD 1000) < 500;')
    expect(code).toContain('Q3 := step = 1;')
    expect(code).toContain('Q4 := AI0 > 13824 AND (ms MOD beat) < beat / 2;')
    expect(code.trimEnd().endsWith('END_PROGRAM')).toBe(true)
  })

  it('writes the RTU’s analog outputs as numbers and its digital ones as TRUE / FALSE rules', () => {
    const code = boardCode('rtu', { AO1: 'fade', AO2: 'invert', DO1: 'invert', DO2: 'off', DO3: 'off', DO4: 'off' })
    expect(code).toContain('AO2 AT %QW2 : INT;')
    expect(code).toContain('DO1 AT %QX0.0 : BOOL;')
    expect(code).toContain('AO1 := REAL_TO_INT((1.0 - COS(')
    expect(code).toContain('AO2 := 4095 - AI1;')
    expect(code).toContain('DO1 := AI1 <= 2048;')
    expect(boardCode('plc', {})).toContain('(* every output is off *)')
  })

  it('writes Arduino-style C for the ECU', () => {
    const code = boardCode('ecu', { OUT1: 'follow', OUT6: 'invert' })
    expect(code).toContain('pinMode(OUT1, OUTPUT);')
    expect(code).toContain('int reading = analogRead(AIN);  // 0 … 4095')
    expect(code).toContain('analogWrite(OUT1, reading / 16);')
    expect(code).toContain('digitalWrite(OUT6, reading > 2048 ? LOW : HIGH);')
  })
})

describe('the message modules', () => {
  it('run by the clock, so the simulation keeps going while they are on the board', () => {
    for (const type of RADIO_TYPES) expect(isTimeDependent(createPartData(type)), type).toBe(true)
  })

  it('need 3 V or more: from a 1.5 V cell they stay off and never join', () => {
    const { parts, wires } = onBattery('wifi', 1.5)
    const last = timeline(() => parts, wires, 3).at(-1)!
    expect(last.parts.m.status).toBe('weak')
    expect(last.parts.m.channels?.link).toBe(0)
  })

  it('each join their network after their own time: the buses at once, the GPS last', () => {
    const linkedAt = (type: PartType) => {
      const { parts, wires } = onBattery(type)
      const steps = timeline(() => parts, wires, 4)
      return steps.findIndex((r) => r.parts.m.channels?.link === 1) * DEFAULT_STEP
    }
    for (const type of RADIO_TYPES) expect(linkedAt(type), type).toBeCloseTo(RADIOS[type].link, 5)
    expect(linkedAt('canBus')).toBeLessThan(linkedAt('wifi'))
    expect(linkedAt('gsm')).toBeLessThan(linkedAt('gps'))
  })

  it('send the share of their supply on IN, once every period', () => {
    const { parts, wires } = onBattery('wifi')
    const steps = timeline(() => parts, wires, 4)
    const last = steps.at(-1)!
    expect(last.parts.m.channels?.value).toBeCloseTo(0.5, 2)
    // joined at 1.5 s, then one message at once and one every second: 1.5, 2.5, 3.5
    expect(last.parts.m.channels?.sent).toBe(3)
    // its TX light flashes once for each message
    const flashes = steps.slice(1).filter((r, i) => r.parts.m.channels?.tx === 1 && steps[i].parts.m.channels?.tx !== 1)
    expect(flashes.length).toBe(3)
  })

  it('SMS: one text each time IN goes HIGH, never before the network, and not while one is going out', () => {
    // IN high from the start: it waits for the network (2 s), then sends for 2 s
    const first = radioStep('gsm', { up: 1, time: 1, high: true, sent: 0, armed: true, since: null })
    expect(first).toMatchObject({ linked: false, tx: false, armed: true, since: null })
    const start = radioStep('gsm', { up: 2.2, time: 2.2, high: true, sent: 0, armed: true, since: null })
    expect(start).toMatchObject({ linked: true, tx: true, armed: false, since: 2.2, progress: 0 })
    const half = radioStep('gsm', { up: 3.2, time: 3.2, high: true, sent: 0, armed: false, since: 2.2 })
    expect(half.progress).toBeCloseTo(0.5)
    // done: one sent, and IN still HIGH does not send another
    const done = radioStep('gsm', { up: 4.3, time: 4.3, high: true, sent: 0, armed: false, since: 2.2 })
    expect(done).toMatchObject({ sent: 1, tx: false, armed: false, since: null })
    // IN goes LOW, then HIGH again: the next one goes out
    const low = radioStep('gsm', { up: 4.4, time: 4.4, high: false, sent: 1, armed: false, since: null })
    expect(low.armed).toBe(true)
    expect(radioStep('gsm', { up: 4.5, time: 4.5, high: true, sent: 1, armed: true, since: null }).since).toBe(4.5)
  })

  it('SMS in a circuit: a switch on IN sends one text per press', () => {
    const parts = (t: number) => [
      part('bat', 'battery', { voltage: 4.5 }),
      part('sw', 'switch', { closed: (t > 2.5 && t < 6) || t > 6.5 }),
      part('sms', 'gsm'),
    ]
    const wires = join(['bat:a', 'sms:VCC'], ['sms:GND', 'bat:b'], ['bat:a', 'sw:a'], ['sw:b', 'sms:IN'])
    const steps = timeline(parts, wires, 9.5)
    expect(at(steps, 2.4).parts.sms.channels?.sent).toBe(0)
    expect(at(steps, 3).parts.sms.channels?.progress).toBeGreaterThan(0)
    expect(at(steps, 5.5).parts.sms.channels?.sent).toBe(1)
    expect(at(steps, 9.5).parts.sms.channels?.sent).toBe(2)
  })

  it('GPS: no fix for 3 s, then PPS goes HIGH at the start of every second, strong enough for an LED', () => {
    const parts = [part('bat', 'battery', { voltage: 4.5 }), part('gps', 'gps'), part('r', 'resistor', { resistance: 220 }), part('led', 'led')]
    const wires = join(['bat:a', 'gps:VCC'], ['gps:GND', 'bat:b'], ['gps:PPS', 'r:a'], ['r:b', 'led:a'], ['led:b', 'bat:b'])
    const steps = timeline(() => parts, wires, 5)
    expect(steps.filter((_, i) => i * DEFAULT_STEP < 2.99).every((r) => r.parts.led.level === 0)).toBe(true)
    expect(at(steps, 2).parts.gps.channels?.sats).toBeLessThan(4)
    expect(at(steps, 3.1).parts.led.status).toBe('on')
    expect(at(steps, 3.5).parts.led.level).toBe(0)
    expect(at(steps, 4.1).parts.led.status).toBe('on')
    expect(at(steps, 4.1).parts.gps.channels?.sats).toBeGreaterThanOrEqual(4)
  })

  it('forget their network when the power goes, and join again from the start', () => {
    const parts = (t: number) => [part('bat', 'battery', { voltage: 4.5 }), part('sw', 'switch', { closed: t < 2 || t > 2.5 }), part('m', 'wifi')]
    const wires = join(['bat:a', 'sw:a'], ['sw:b', 'm:VCC'], ['m:GND', 'bat:b'])
    const steps = timeline(parts, wires, 4.5)
    expect(at(steps, 1.9).parts.m.channels?.link).toBe(1)
    expect(at(steps, 2.2).parts.m.status).not.toBe('on')
    expect(at(steps, 3.5).parts.m.channels?.link).toBe(0)
    expect(at(steps, 4.3).parts.m.channels?.link).toBe(1)
  })
})

describe('the warning beacon', () => {
  const lit = (volts: number, reversed = false) => {
    const parts = [part('bat', 'battery', { voltage: volts }), part('b', 'beacon')]
    const wires = reversed ? join(['bat:a', 'b:b'], ['b:a', 'bat:b']) : join(['bat:a', 'b:a'], ['b:b', 'bat:b'])
    return solveCircuit(parts, wires).parts.b
  }

  it('has its resistor inside: a board pin lights it fully without overloading the pin', () => {
    const parts = [part('board', 'ecu', { pins: { OUT6: 'on' } }), part('b', 'beacon')]
    const r = solveCircuit(parts, join(['board:OUT6', 'b:a'], ['b:b', 'board:GND']))
    expect(r.parts.b.status).toBe('on')
    expect(r.parts.b.level).toBeGreaterThan(0.9)
    expect(r.parts.board.status).toBe('on')
  })

  it('works from 4.5 V or 9 V, gets too hot on 12 V, and stays dark the wrong way round', () => {
    expect(lit(4.5).status).toBe('on')
    expect(lit(9).status).toBe('on')
    expect(lit(12).status).toBe('over')
    expect(lit(1.5).level).toBe(0)
    expect(lit(4.5, true).status).toBe('reverse')
  })
})

describe('the pressure sensor', () => {
  it('gives a signal that rises with the pressure, from 0 to 200 bar', () => {
    const reading = (sense: number) => {
      const parts = [part('bat', 'battery', { voltage: 4.5 }), part('p', 'pressureSensor', { sense }), part('vm', 'voltmeter')]
      const wires = join(['bat:a', 'p:VCC'], ['p:GND', 'bat:b'], ['p:OUT', 'vm:a'], ['vm:b', 'bat:b'])
      return solveCircuit(parts, wires).parts.vm.level
    }
    expect(reading(0)).toBeLessThan(0.1)
    expect(reading(0.5)).toBeGreaterThan(reading(0.2))
    expect(reading(1)).toBeGreaterThan(4)
  })
})
