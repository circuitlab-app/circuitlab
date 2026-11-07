import type {
  BuzzerSound,
  LampColor,
  LedColor,
  MeterDial,
  PartData,
  PartType,
  PinMode,
  Rotation,
  Side,
  TerminalId,
  WireColor,
} from './types'
import { DISPLAY_DEFAULTS, displayGeometry, hasSignalInput, isDisplay, type DisplayType } from './display'

export type PartCategory =
  | 'power'
  | 'board'
  | 'control'
  | 'component'
  | 'logic'
  | 'output'
  | 'display'
  | 'sensor'
  | 'meter'

export type TerminalDef = {
  side: Side
  /**
   * Where along its side the terminal sits, 0..1, measured clockwise: the left
   * side runs bottom → top, the top left → right, the right top → bottom and
   * the bottom right → left. Measured this way, turning a part keeps the value.
   * 0.5 (the default) is the middle.
   */
  offset?: number
  polarity?: '+' | '-'
  /** short text shown on the terminal: B, C, E, 13, 5V … */
  label?: string
  /** drawn as a header pin (Arduino) instead of a round screw terminal */
  pin?: boolean
  /** colour of the terminal, for legs that are told apart by colour (the RGB LED) */
  tint?: string
}

export type PartDef = {
  category: PartCategory
  /** Brand colour used for chips, glows and the minimap. */
  accent: string
  terminals: Record<TerminalId, TerminalDef>
  defaults: Omit<PartData, 'type' | 'rotation'>
  /** card width in px; most parts use the standard width */
  width?: number
  /** false for parts that look wrong turned on their side (the Arduino) */
  rotatable?: boolean
}

export const DEFAULT_PART_WIDTH = 176

/**
 * Electrical constants. Values are picked so that the classic beginner
 * circuits behave the way children expect from real toy kits:
 * 1.5 V makes a lamp glow dimly, 3 V lights it nicely and 9 V burns it out.
 */
export const ELECTRICAL = {
  wireResistance: 0.01,
  contactResistance: 0.01,
  /** internal resistance per 1.5 V cell */
  cellResistance: 0.3,
  /** a battery delivering more than this is treated as short-circuited */
  shortCircuitCurrent: 2,
  lamp: { resistance: 10, ratedPower: 0.9, burnRatio: 2.8, overRatio: 1.6 },
  motor: { resistance: 4, ratedVoltage: 3, stallSpeed: 0.12, overSpeed: 1.8 },
  buzzer: { resistance: 50, onCurrent: 0.015, ratedCurrent: 0.06 },
  led: {
    seriesResistance: 15,
    fullCurrent: 0.02,
    overCurrent: 0.04,
    burnCurrent: 0.15,
  },
  resistor: { ratedPower: 0.5 },
  dimmer: { minResistance: 2, maxResistance: 150 },
  /** a silicon rectifier diode */
  diode: { forwardVoltage: 0.7, seriesResistance: 0.5, burnCurrent: 1.5 },
  /** electrolytic: above this it is overloaded, reversed beyond 1 V it complains */
  capacitor: { maxVoltage: 16, reverseVoltage: 1 },
  fuse: { resistance: 0.05 },
  /** a small NPN transistor such as the BC547 */
  transistor: {
    beta: 100,
    baseEmitterVoltage: 0.7,
    baseResistance: 10,
    saturationResistance: 2,
    burnCurrent: 0.8,
    burnBaseCurrent: 0.05,
  },
  /** light sensor: resistance in the dark and in bright light */
  ldr: { dark: 20000, bright: 200 },
  /** small 6 V hobby panel in full sun */
  solar: { voltage: 6, resistance: 25 },
  voltmeter: { resistance: 1e7 },
  ammeter: { resistance: 0.01 },
  /** powered over USB; each pin drives through ~25 Ω and should stay below 40 mA */
  arduino: { voltage: 5, supplyResistance: 0.3, pinResistance: 25, pinMaxCurrent: 0.04, inputResistance: 1e6 },
  /** 3-pin sensor modules: they need about 3 V or more and use a few milliamps */
  module: { supplyResistance: 1000, minVoltage: 2.7, analogResistance: 1000, digitalResistance: 100 },
  /** hobby servo: needs about 4 V or more; the signal pin barely draws current */
  servo: { resistance: 50, signalResistance: 10000, minVoltage: 3.5 },
  /** NTC thermistor: 10 kΩ at 25 °C, falling as it warms */
  thermistor: { r25: 10000, beta: 3950 },
  /**
   * one lemon with a copper coin and a zinc nail in it: about 0.9 V, but the juice lets
   * only a tiny current through. Three in a row just glow a red LED; no lemon spins a motor
   */
  lemon: { voltage: 0.9, resistance: 100 },
  /** CR2032 coin cell: 3 V, but so much resistance inside that it lights an LED and stalls a motor */
  coinCell: { voltage: 3, resistance: 40 },
  /** hand-crank generator: its volts follow the crank, up to 6 V when you turn it fast */
  dynamo: { maxVoltage: 6, resistance: 5 },
  /** USB power bank: a steady 5 V that holds back anything above 2 A */
  powerBank: { voltage: 5, limit: 2 },
  /** thumb joystick: one 10 kΩ knob for left–right and one for up–down */
  joystick: { resistance: 10000 },
  /** screens: they light up from about 3 V; the S input only listens */
  display: { minVoltage: 3, signalResistance: 1e6, ratedVoltage: 5 },
  /**
   * bench power supply, 0–12 V. It never short-circuits: when a part wants more
   * than the current limit it holds the current there (and its CC light comes on)
   */
  supply: { maxVoltage: 12, resistance: 0.05, shuntResistance: 1e4 },
  /** 3-pin knob: the wiper W slides along a track from B to A; it should stay under a quarter watt */
  potentiometer: { wiperResistance: 1, ratedPower: 0.25 },
  /** 5 V relay: the 70 Ω coil pulls the switch closed from 3.75 V and lets go below 1.5 V */
  relay: { coilResistance: 70, pullIn: 3.75, dropOut: 1.5 },
  /** small 8 Ω speaker: loud from half a watt, too much above 2 W, destroyed above 5 W */
  speaker: { resistance: 8, ratedPower: 0.5, overPower: 2, burnPower: 5 },
  /** coin vibration motor, made for 3 V */
  vibration: { resistance: 40, ratedVoltage: 3, stallSpeed: 0.15, overSpeed: 1.8 },
  /** a coil of wire around an iron bolt: full strength at 0.4 A, hot above 0.6 A */
  electromagnet: { resistance: 10, ratedCurrent: 0.4, hotCurrent: 0.6 },
  /** 7805: a steady 5 V out as long as IN is 2 V higher; above 1.5 W of heat it gets hot */
  regulator: { output: 5, dropout: 2, outputResistance: 0.02, quiescentResistance: 1500, ratedPower: 1.5 },
  /** logic chips (like the 74HC family, with their indicator LEDs): they work from 2 V and use a couple of milliamps; their inputs only listen */
  logic: { minVoltage: 2, outputResistance: 50, inputResistance: 1e6, supplyResistance: 2000 },
  /** NE555 timer: it needs 4.5 V or more and can drive 200 mA */
  timer555: { minVoltage: 4.5, outputResistance: 10, supplyResistance: 1500 },
  /** the oscilloscope's probe only listens */
  oscilloscope: { resistance: 1e6 },
  /**
   * 5.1 V Zener diode. Joined + to + it waits until it has 5.1 V across it, then lets
   * just enough through to hold the volts there. The other way round it is a plain diode.
   */
  zener: { voltage: 5.1, forwardVoltage: 0.7, seriesResistance: 2, forwardResistance: 0.5, hotPower: 0.5, burnPower: 1.3 },
  /** logic-level N-channel MOSFET: off below 2 V on G, fully on from 4 V; G only listens */
  mosfet: { threshold: 2, fullOn: 4, onResistance: 0.05, gateResistance: 1e6, hotPower: 1.5, steps: 20 },
  /** optocoupler (PC817): its LED needs 1.2 V; the light switch passes up to twice the LED's current */
  optocoupler: { forwardVoltage: 1.2, seriesResistance: 15, transfer: 2, saturationResistance: 10, burnCurrent: 0.1 },
  /** red laser module with its own resistor: a beam from about 2.5 V, too much above 60 mA */
  laser: { forwardVoltage: 2.2, seriesResistance: 80, weakCurrent: 0.012, overCurrent: 0.06, burnCurrent: 0.12 },
  /** infrared LED: like any LED, but it starts at 1.2 V and its light is invisible to our eyes */
  irLed: { forwardVoltage: 1.2 },
  /** push solenoid: the coil pushes the rod out from 0.2 A, hot above 0.8 A */
  solenoid: { resistance: 10, pushCurrent: 0.2, ratedCurrent: 0.45, hotCurrent: 0.8 },
  /** small water pump made for 5 V: it lifts water from about 1.5 V */
  pump: { resistance: 15, ratedVoltage: 5, startSpeed: 0.3, overSpeed: 1.6 },
  /** electric bell: the hammer rings from 0.12 A, full and loud at 0.35 A */
  bell: { resistance: 12, ringCurrent: 0.12, ratedCurrent: 0.35, hotCurrent: 0.75 },
  /** 10-bar LED bar graph module: each lit bar takes about 8 mA from + */
  barGraph: { minVoltage: 2.7, supplyResistance: 5000, barResistance: 600, inputResistance: 1e7, bars: 10 },
  /** traffic light module: three LEDs with their resistors built in, sharing one − pin */
  trafficLight: { seriesResistance: 220, fullCurrent: 0.012 },
  /** 5 V cooling fan: its electronics let it spin one way only, from about 1.5 V */
  fan: { forwardVoltage: 0.4, resistance: 45, ratedVoltage: 5, startSpeed: 0.3, overSpeed: 1.6 },
  /** comparator chip (like the LM393): its inputs listen very quietly */
  comparator: { inputResistance: 1e7, hysteresis: 0.005 },
  /** H-bridge motor driver (like the L9110): each motor pin joins + or − through about 1 Ω */
  hBridge: { minVoltage: 2.5, outputResistance: 1, supplyResistance: 2000, hotCurrent: 1.5 },
  /**
   * multimeter: on V it only listens, on A it is almost a wire, and on Ω it pushes a tiny
   * test current from its 1 V cell through 1 kΩ and works out the ohms from the volts it gets
   */
  multimeter: {
    voltResistance: 1e7,
    ampResistance: 0.01,
    testVoltage: 1,
    testResistance: 1000,
    beepBelow: 30,
    openAbove: 4e7,
    /** more than this on A: it was put straight across a battery */
    maxAmps: 2,
  },
  /** logic probe: HIGH above 70 % of its supply, LOW below 30 %; a change lights PULSE for a moment */
  logicProbe: { minVoltage: 3, supplyResistance: 2000, biasResistance: 1e6, high: 0.7, low: 0.3, pulseTime: 0.3 },
} as const

/** AA packs of 1 to 4 cells, a 9 V block and a 12 V block */
export const BATTERY_VOLTAGES = [1.5, 3, 4.5, 6, 9, 12] as const
/** the values in a beginner's resistor kit, ohms */
export const RESISTOR_VALUES = [10, 22, 47, 100, 220, 330, 470, 1000, 2200, 4700, 10000, 100000] as const
/** microfarads */
export const CAPACITOR_VALUES = [10, 100, 470, 1000, 2200, 4700, 10000] as const
/** lemon battery: how many lemons can sit in a row */
export const LEMON_COUNTS = [1, 2, 3, 4] as const
/** amps */
export const FUSE_RATINGS = [0.2, 0.5, 1] as const
/** bench power supply current limits, amps */
export const SUPPLY_LIMITS = [0.1, 0.5, 1, 2] as const
/** potentiometer sizes, ohms */
export const POT_VALUES = [1000, 10000] as const
/** the speaker's notes, hertz: a low, a middle and a high C */
export const SPEAKER_NOTES = [262, 523, 1047] as const
/** what a buzzer can play: a beep, or one of the siren chip's three sounds */
export const BUZZER_SOUNDS: readonly BuzzerSound[] = ['beep', 'wail', 'yelp', 'hilo']
/** 555 blinker speeds, blinks per second */
export const TIMER_RATES = [0.5, 1, 2] as const
/** oscilloscope screen widths, seconds */
export const SCOPE_SPANS = [2, 5, 10] as const
/** the multimeter's dial, in the order it turns */
export const METER_DIALS = ['volts', 'amps', 'ohms', 'beep'] as const satisfies readonly MeterDial[]
/** how many outputs the counter chip steps through */
export const COUNTER_OUTPUTS = 5

export type BoardType =
  | 'arduino'
  | 'nano'
  | 'mega'
  | 'esp32'
  | 'esp8266'
  | 'pico'
  | 'microbit'
  | 'raspberrypi'
  | 'aiBoard'

/** What a microcontroller board offers. Every board shows six output pins, its supply, GND and one input. */
export type BoardSpec = {
  /** logic and supply voltage */
  voltage: number
  /** terminal id (and label) of the supply pin */
  supply: '5V' | '3V3'
  /** output pins, top to bottom along the right header */
  pins: readonly string[]
  /** pins that can fade (PWM) */
  pwm: ReadonlySet<string>
  /** the analog input that "follow" pins copy; the Raspberry Pi has none */
  input?: string
  /** highest number its analog input reads */
  adcMax: number
  /** language of the code shown in the details panel */
  language: 'arduino' | 'micropython-pico' | 'micropython-microbit' | 'python'
  /** how the pin is written in that code */
  codeName: (pin: string) => string
  /** short text printed on the header pin */
  label: (pin: string) => string
}

const ARDUINO_HEADER = ['D13', 'D12', 'D11', 'D10', 'D9', 'D8'] as const
const AI_PINS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'] as const
const drop = (prefix: string) => (pin: string) => pin.slice(prefix.length)
const all = (pins: readonly string[]) => new Set(pins)

const uno: BoardSpec = {
  voltage: 5,
  supply: '5V',
  pins: ARDUINO_HEADER,
  pwm: new Set(['D11', 'D10', 'D9']),
  input: 'A0',
  adcMax: 1023,
  language: 'arduino',
  codeName: drop('D'),
  label: (pin) => `${['D11', 'D10', 'D9'].includes(pin) ? '~' : ''}${pin.slice(1)}`,
}

export const BOARDS: Record<BoardType, BoardSpec> = {
  arduino: uno,
  nano: uno,
  // the Mega can fade on pins 2 … 13
  mega: { ...uno, pwm: all(ARDUINO_HEADER), label: (pin) => `~${pin.slice(1)}` },
  esp32: {
    voltage: 3.3,
    supply: '3V3',
    pins: ['G2', 'G4', 'G5', 'G18', 'G19', 'G21'],
    pwm: all(['G2', 'G4', 'G5', 'G18', 'G19', 'G21']),
    input: 'G34',
    adcMax: 4095,
    language: 'arduino',
    codeName: drop('G'),
    label: drop('G'),
  },
  esp8266: {
    voltage: 3.3,
    supply: '3V3',
    pins: ['D1', 'D2', 'D5', 'D6', 'D7', 'D8'],
    pwm: all(['D1', 'D2', 'D5', 'D6', 'D7', 'D8']),
    input: 'A0',
    adcMax: 1023,
    language: 'arduino',
    codeName: (pin) => pin,
    label: (pin) => pin,
  },
  pico: {
    voltage: 3.3,
    supply: '3V3',
    pins: ['GP15', 'GP14', 'GP13', 'GP12', 'GP11', 'GP10'],
    pwm: all(['GP15', 'GP14', 'GP13', 'GP12', 'GP11', 'GP10']),
    input: 'GP26',
    adcMax: 65535,
    language: 'micropython-pico',
    codeName: drop('GP'),
    label: (pin) => pin,
  },
  microbit: {
    voltage: 3.3,
    supply: '3V3',
    pins: ['P0', 'P1', 'P8', 'P12', 'P13', 'P16'],
    pwm: all(['P0', 'P1', 'P8', 'P12', 'P13', 'P16']),
    input: 'P2',
    adcMax: 1023,
    language: 'micropython-microbit',
    codeName: (pin) => `pin${pin.slice(1)}`,
    label: (pin) => pin,
  },
  raspberrypi: {
    voltage: 3.3,
    supply: '3V3',
    pins: ['GPIO17', 'GPIO27', 'GPIO22', 'GPIO23', 'GPIO24', 'GPIO25'],
    pwm: all(['GPIO17', 'GPIO27', 'GPIO22', 'GPIO23', 'GPIO24', 'GPIO25']),
    adcMax: 0,
    language: 'python',
    codeName: drop('GPIO'),
    label: drop('GPIO'),
  },
  // the AI board: a 5 V board whose pin programs are picked by a language model
  // from what the child asks for. Every pin can fade, and IN reads a sensor.
  aiBoard: {
    voltage: 5,
    supply: '5V',
    pins: AI_PINS,
    pwm: all(AI_PINS),
    input: 'IN',
    adcMax: 1023,
    // the details panel shows the Arduino code for the program the AI chose
    language: 'arduino',
    codeName: (pin) => pin,
    label: (pin) => pin,
  },
}

export const isBoard = (type: PartType): type is BoardType => type in BOARDS

/** Kept for older code: the Uno's header. */
export const ARDUINO_PINS = ARDUINO_HEADER
export const pinNumber = (pin: string) => pin.replace('D', '')

/** The programs a pin can run, in the order a tap cycles through them. */
export function pinModesFor(board: BoardType, pin: string): PinMode[] {
  const spec = BOARDS[board]
  return [
    'off',
    'on',
    'blink',
    'blink2',
    'step1',
    'step2',
    'step3',
    ...(spec.pwm.has(pin) ? (['fade'] as const) : []),
    ...(spec.input ? (['follow', 'invert', 'alarm'] as const) : []),
  ]
}

export const LED_FORWARD_VOLTAGE: Record<LedColor, number> = {
  red: 1.8,
  orange: 1.9,
  yellow: 2.0,
  green: 2.2,
  blue: 2.9,
  white: 2.9,
  // a blue LED with a pink glow coating inside
  pink: 2.9,
}

export const LED_COLORS: Record<LedColor, string> = {
  red: '#ff3b3b',
  orange: '#ff8a1f',
  yellow: '#ffd21f',
  green: '#22e06b',
  blue: '#3b82ff',
  white: '#f4f7ff',
  pink: '#ff5fb8',
}

export const LAMP_COLORS: Record<LampColor, string> = {
  warm: '#ffd38a',
  yellow: '#fff06a',
  red: '#ff6b6b',
  green: '#7dff9b',
  blue: '#8ab8ff',
}

export const WIRE_COLORS: Record<WireColor, string> = {
  red: '#ef4444',
  black: '#27272a',
  blue: '#3b82f6',
  yellow: '#facc15',
  green: '#22c55e',
  white: '#e4e4e7',
}

export const PART_ORDER: PartType[] = [
  'battery',
  'solar',
  'powerSupply',
  'coinCell',
  'lemon',
  'dynamo',
  'powerBank',
  'arduino',
  'nano',
  'mega',
  'esp32',
  'esp8266',
  'pico',
  'microbit',
  'raspberrypi',
  'aiBoard',
  'switch',
  'button',
  'slideSwitch',
  'microSwitch',
  'dimmer',
  'potentiometer',
  'joystick',
  'relay',
  'resistor',
  'capacitor',
  'diode',
  'zener',
  'transistor',
  'pnp',
  'mosfet',
  'optocoupler',
  'fuse',
  'notGate',
  'andGate',
  'orGate',
  'xorGate',
  'nandGate',
  'norGate',
  'latch',
  'counter',
  'comparator',
  'timer555',
  'hBridge',
  'regulator',
  'lamp',
  'led',
  'irLed',
  'laser',
  'rgbLed',
  'trafficLight',
  'barGraph',
  'motor',
  'fan',
  'pump',
  'vibration',
  'buzzer',
  'speaker',
  'bell',
  'servo',
  'electromagnet',
  'solenoid',
  'ldr',
  'thermistor',
  'tilt',
  'reed',
  'tempSensor',
  'ultrasonic',
  'pir',
  'soundSensor',
  'gasSensor',
  'soilSensor',
  'touchSensor',
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
  'multimeter',
  'voltmeter',
  'ammeter',
  'oscilloscope',
  'logicProbe',
  'segment',
  'lcd',
  'oled',
  'tft',
  'matrix',
  'ledwall',
]

const twoWay: Record<TerminalId, TerminalDef> = {
  a: { side: 'left' },
  b: { side: 'right' },
}

/** + on the left, − on the right: LEDs, diodes, capacitors and meters */
const polarised: Record<TerminalId, TerminalDef> = {
  a: { side: 'left', polarity: '+' },
  b: { side: 'right', polarity: '-' },
}

/** Small power sources (lemons, coin cell, crank, power bank): + on the right like the battery */
const cellTerminals: Record<TerminalId, TerminalDef> = {
  a: { side: 'right', polarity: '+' },
  b: { side: 'left', polarity: '-' },
}

/** 3-pin sensor modules: power on the left, the signal (S) on the right */
const sensorModule: Record<TerminalId, TerminalDef> = {
  VCC: { side: 'left', offset: 0.68, polarity: '+' },
  GND: { side: 'left', offset: 0.32, polarity: '-' },
  OUT: { side: 'right', label: 'S' },
}

/** Logic chips: + and − at the corners of the left side, the inputs between them, the output Y on the right. */
function gateTerminals(inputs: 1 | 2): Record<TerminalId, TerminalDef> {
  return {
    VCC: { side: 'left', offset: 0.86, polarity: '+' },
    ...(inputs === 2
      ? { A: { side: 'left', offset: 0.62, label: 'A' }, B: { side: 'left', offset: 0.38, label: 'B' } }
      : { A: { side: 'left', offset: 0.5, label: 'A' } }),
    GND: { side: 'left', offset: 0.14, polarity: '-' },
    Y: { side: 'right', label: 'Y' },
  } satisfies Record<TerminalId, TerminalDef>
}

const gate = (inputs: 1 | 2, accent: string): PartDef => ({
  category: 'logic',
  accent,
  terminals: gateTerminals(inputs),
  defaults: {},
})

/**
 * Chip modules laid out like the gates: + and − at the corners of the left side,
 * two inputs between them, and their outputs on the right.
 */
function chipTerminals(
  inputs: [[TerminalId, string], [TerminalId, string]],
  outputs: Record<TerminalId, TerminalDef>,
): Record<TerminalId, TerminalDef> {
  return {
    VCC: { side: 'left', offset: 0.86, polarity: '+' },
    [inputs[0][0]]: { side: 'left', offset: 0.62, label: inputs[0][1] },
    [inputs[1][0]]: { side: 'left', offset: 0.38, label: inputs[1][1] },
    GND: { side: 'left', offset: 0.14, polarity: '-' },
    ...outputs,
  }
}

/** The counter's outputs Q0 … Q4, top to bottom along the right side. */
const counterOutputs = Object.fromEntries(
  Array.from({ length: COUNTER_OUTPUTS }, (_, i) => [
    `Q${i}`,
    { side: 'right', offset: 0.14 + i * 0.18, label: String(i) } satisfies TerminalDef,
  ]),
)

/** Boards: supply, GND and the input on the left, the six output pins on the right. */
function boardTerminals(spec: BoardSpec): Record<TerminalId, TerminalDef> {
  return {
    [spec.supply]: { side: 'left', offset: 0.74, label: spec.supply, pin: true, polarity: '+' },
    GND: { side: 'left', offset: 0.52, label: 'GND', pin: true, polarity: '-' },
    ...(spec.input ? { [spec.input]: { side: 'left', offset: 0.28, label: spec.input, pin: true } } : {}),
    ...Object.fromEntries(
      spec.pins.map((pin, i) => [
        pin,
        { side: 'right', offset: 0.18 + i * 0.11, label: spec.label(pin), pin: true } satisfies TerminalDef,
      ]),
    ),
  }
}

const board = (type: BoardType, accent: string): PartDef => {
  const spec = BOARDS[type]
  return {
    category: 'board',
    accent,
    terminals: boardTerminals(spec),
    // a fresh board blinks its first pin, like the classic first program
    defaults: { pins: Object.fromEntries(spec.pins.map((pin, i) => [pin, i === 0 ? 'blink' : 'off'])) },
    width: 232,
    rotatable: false,
  }
}

/** Screens: + and − on the left like the sensor modules; some read a voltage on S. */
function screen(type: DisplayType, accent: string): PartDef {
  return {
    category: 'display',
    accent,
    terminals: {
      VCC: { side: 'left', offset: 0.68, polarity: '+' },
      GND: { side: 'left', offset: 0.32, polarity: '-' },
      ...(hasSignalInput(type) ? { S: { side: 'right', label: 'S' } satisfies TerminalDef } : {}),
    },
    defaults: DISPLAY_DEFAULTS[type],
    // a screen turned on its side would show its picture sideways
    rotatable: false,
  }
}

export const PARTS: Record<PartType, PartDef> = {
  battery: {
    category: 'power',
    accent: '#f59e0b',
    // + on the right so current leaves to the right on a fresh board
    terminals: { a: { side: 'right', polarity: '+' }, b: { side: 'left', polarity: '-' } },
    defaults: { voltage: 3 },
  },
  solar: {
    category: 'power',
    accent: '#1d4ed8',
    terminals: { a: { side: 'right', polarity: '+' }, b: { side: 'left', polarity: '-' } },
    defaults: { light: 0.8 },
  },
  arduino: board('arduino', '#0e9aa7'),
  nano: board('nano', '#0e7490'),
  mega: board('mega', '#0369a1'),
  esp32: board('esp32', '#475569'),
  esp8266: board('esp8266', '#1e40af'),
  pico: board('pico', '#16a34a'),
  microbit: board('microbit', '#7c3aed'),
  raspberrypi: board('raspberrypi', '#c51a4a'),
  aiBoard: board('aiBoard', '#6d5bd0'),
  switch: { category: 'control', accent: '#6366f1', terminals: twoWay, defaults: { closed: false } },
  button: { category: 'control', accent: '#ec4899', terminals: twoWay, defaults: {} },
  dimmer: { category: 'control', accent: '#14b8a6', terminals: twoWay, defaults: { level: 0.7 } },
  resistor: { category: 'component', accent: '#a16207', terminals: twoWay, defaults: { resistance: 100 } },
  capacitor: { category: 'component', accent: '#2563eb', terminals: polarised, defaults: { capacitance: 2200 } },
  diode: { category: 'component', accent: '#3f3f46', terminals: polarised, defaults: {} },
  transistor: {
    category: 'component',
    accent: '#65a30d',
    terminals: {
      B: { side: 'left', label: 'B' },
      C: { side: 'right', offset: 0.32, label: 'C' },
      E: { side: 'right', offset: 0.68, label: 'E' },
    },
    defaults: {},
  },
  fuse: { category: 'component', accent: '#64748b', terminals: twoWay, defaults: { rating: 0.5 } },
  lamp: { category: 'output', accent: '#facc15', terminals: twoWay, defaults: { color: 'warm' } },
  led: { category: 'output', accent: '#ef4444', terminals: polarised, defaults: { color: 'red' } },
  motor: { category: 'output', accent: '#0ea5e9', terminals: twoWay, defaults: {} },
  buzzer: { category: 'output', accent: '#8b5cf6', terminals: twoWay, defaults: {} },
  servo: { category: 'output', accent: '#2563eb', terminals: sensorModule, defaults: {} },
  ldr: { category: 'sensor', accent: '#ea580c', terminals: twoWay, defaults: { light: 0.6 } },
  thermistor: { category: 'sensor', accent: '#dc2626', terminals: twoWay, defaults: { sense: 0.42 } },
  tilt: { category: 'sensor', accent: '#7c3aed', terminals: twoWay, defaults: { sense: 0 } },
  reed: { category: 'sensor', accent: '#0891b2', terminals: twoWay, defaults: { sense: 0 } },
  tempSensor: { category: 'sensor', accent: '#e11d48', terminals: sensorModule, defaults: { sense: 0.4 } },
  ultrasonic: { category: 'sensor', accent: '#0369a1', terminals: sensorModule, defaults: { sense: 0.5 } },
  pir: { category: 'sensor', accent: '#9333ea', terminals: sensorModule, defaults: { sense: 0 } },
  soundSensor: { category: 'sensor', accent: '#db2777', terminals: sensorModule, defaults: { sense: 0.2 } },
  gasSensor: { category: 'sensor', accent: '#57534e', terminals: sensorModule, defaults: { sense: 0.1 } },
  soilSensor: { category: 'sensor', accent: '#15803d', terminals: sensorModule, defaults: { sense: 0.5 } },
  touchSensor: { category: 'sensor', accent: '#c026d3', terminals: sensorModule, defaults: { sense: 0 } },
  flameSensor: { category: 'sensor', accent: '#ea580c', terminals: sensorModule, defaults: { sense: 0 } },
  rainSensor: { category: 'sensor', accent: '#0284c7', terminals: sensorModule, defaults: { sense: 0 } },
  waterSensor: { category: 'sensor', accent: '#b91c1c', terminals: sensorModule, defaults: { sense: 0.3 } },
  humiditySensor: { category: 'sensor', accent: '#0ea5e9', terminals: sensorModule, defaults: { sense: 0.45 } },
  hallSensor: { category: 'sensor', accent: '#4338ca', terminals: sensorModule, defaults: { sense: 0 } },
  irSensor: { category: 'sensor', accent: '#059669', terminals: sensorModule, defaults: { sense: 0 } },
  lineSensor: { category: 'sensor', accent: '#334155', terminals: sensorModule, defaults: { sense: 0 } },
  forceSensor: { category: 'sensor', accent: '#7c3aed', terminals: sensorModule, defaults: { sense: 0 } },
  pulseSensor: { category: 'sensor', accent: '#16a34a', terminals: sensorModule, defaults: { sense: 0.25 } },
  knockSensor: { category: 'sensor', accent: '#a16207', terminals: sensorModule, defaults: { sense: 0 } },
  slideSwitch: {
    category: 'control',
    accent: '#475569',
    // COM is joined to A or to B: two of them switch a stair light from both ends
    terminals: {
      COM: { side: 'left', label: 'COM' },
      A: { side: 'right', offset: 0.32, label: 'A' },
      B: { side: 'right', offset: 0.68, label: 'B' },
    },
    defaults: { closed: false },
  },
  microSwitch: {
    category: 'control',
    accent: '#be123c',
    // COM touches NC until the lever is pressed, then it jumps over to NO
    terminals: {
      COM: { side: 'left', label: 'COM' },
      NO: { side: 'right', offset: 0.32, label: 'NO' },
      NC: { side: 'right', offset: 0.68, label: 'NC' },
    },
    defaults: {},
  },
  joystick: {
    category: 'control',
    accent: '#18181b',
    terminals: {
      VCC: { side: 'left', offset: 0.68, polarity: '+' },
      GND: { side: 'left', offset: 0.32, polarity: '-' },
      X: { side: 'right', offset: 0.32, label: 'X' },
      Y: { side: 'right', offset: 0.68, label: 'Y' },
    },
    defaults: { stickX: 0.5, stickY: 0.5 },
  },
  // the small power sources: + on the right, like the battery. Their models stay the right way up
  lemon: { category: 'power', accent: '#ca8a04', terminals: cellTerminals, defaults: { cells: 3 }, rotatable: false },
  coinCell: { category: 'power', accent: '#71717a', terminals: cellTerminals, defaults: {}, rotatable: false },
  dynamo: { category: 'power', accent: '#ea580c', terminals: cellTerminals, defaults: { level: 0 }, rotatable: false },
  powerBank: { category: 'power', accent: '#0ea5e9', terminals: cellTerminals, defaults: {}, rotatable: false },
  voltmeter: { category: 'meter', accent: '#0284c7', terminals: polarised, defaults: {} },
  ammeter: { category: 'meter', accent: '#f97316', terminals: polarised, defaults: {} },
  segment: screen('segment', '#ef4444'),
  lcd: screen('lcd', '#65a30d'),
  oled: screen('oled', '#2563eb'),
  tft: screen('tft', '#db2777'),
  matrix: screen('matrix', '#f59e0b'),
  ledwall: screen('ledwall', '#7c3aed'),
  powerSupply: {
    category: 'power',
    accent: '#e11d48',
    // like the battery: + on the right
    terminals: { a: { side: 'right', polarity: '+' }, b: { side: 'left', polarity: '-' } },
    defaults: { voltage: 5, limit: 0.5 },
    // its display would read sideways
    rotatable: false,
  },
  potentiometer: {
    category: 'control',
    accent: '#4f46e5',
    terminals: {
      A: { side: 'left', offset: 0.68, label: 'A' },
      B: { side: 'left', offset: 0.32, label: 'B' },
      W: { side: 'right', label: 'W' },
    },
    defaults: { level: 0.5, resistance: 1000 },
  },
  relay: {
    category: 'control',
    accent: '#1d4ed8',
    // the coil on the left, the switch it works on the right
    terminals: {
      a: { side: 'left', offset: 0.68, polarity: '+' },
      b: { side: 'left', offset: 0.32, polarity: '-' },
      COM: { side: 'right', offset: 0.32, label: 'COM' },
      NO: { side: 'right', offset: 0.68, label: 'NO' },
    },
    defaults: {},
  },
  rgbLed: {
    category: 'output',
    accent: '#d946ef',
    terminals: {
      R: { side: 'left', offset: 0.76, label: 'R', tint: '#dc2626' },
      G: { side: 'left', offset: 0.5, label: 'G', tint: '#16a34a' },
      B: { side: 'left', offset: 0.24, label: 'B', tint: '#2563eb' },
      K: { side: 'right', polarity: '-' },
    },
    defaults: {},
  },
  speaker: { category: 'output', accent: '#0e7490', terminals: twoWay, defaults: { pitch: 523 } },
  vibration: { category: 'output', accent: '#be185d', terminals: twoWay, defaults: {} },
  electromagnet: { category: 'output', accent: '#b45309', terminals: twoWay, defaults: {} },
  regulator: {
    category: 'logic',
    accent: '#334155',
    terminals: {
      IN: { side: 'left', offset: 0.68, label: 'IN', polarity: '+' },
      GND: { side: 'left', offset: 0.32, polarity: '-' },
      OUT: { side: 'right', label: 'OUT', polarity: '+' },
    },
    defaults: {},
  },
  notGate: gate(1, '#ea580c'),
  andGate: gate(2, '#16a34a'),
  orGate: gate(2, '#2563eb'),
  xorGate: gate(2, '#9333ea'),
  timer555: {
    category: 'logic',
    accent: '#0f766e',
    terminals: {
      VCC: { side: 'left', offset: 0.68, polarity: '+' },
      GND: { side: 'left', offset: 0.32, polarity: '-' },
      OUT: { side: 'right', label: 'OUT' },
    },
    defaults: { rate: 1 },
  },
  oscilloscope: {
    category: 'meter',
    accent: '#16a34a',
    terminals: polarised,
    defaults: { span: 5 },
    // a screen turned on its side would show its picture sideways
    rotatable: false,
  },
  // the striped end (+) goes toward + so it can hold its 5.1 V
  zener: { category: 'component', accent: '#c2410c', terminals: polarised, defaults: {} },
  pnp: {
    category: 'component',
    accent: '#ca8a04',
    // the mirror of the NPN: E goes to +, C to the part it switches
    terminals: {
      B: { side: 'left', label: 'B' },
      E: { side: 'right', offset: 0.32, label: 'E' },
      C: { side: 'right', offset: 0.68, label: 'C' },
    },
    defaults: {},
  },
  mosfet: {
    category: 'component',
    accent: '#4338ca',
    terminals: {
      G: { side: 'left', label: 'G' },
      D: { side: 'right', offset: 0.32, label: 'D' },
      S: { side: 'right', offset: 0.68, label: 'S' },
    },
    defaults: {},
  },
  optocoupler: {
    category: 'component',
    accent: '#9f1239',
    // the LED on the left, the light switch it works on the right
    terminals: {
      a: { side: 'left', offset: 0.68, polarity: '+' },
      b: { side: 'left', offset: 0.32, polarity: '-' },
      C: { side: 'right', offset: 0.32, label: 'C' },
      E: { side: 'right', offset: 0.68, label: 'E' },
    },
    defaults: {},
  },
  laser: { category: 'output', accent: '#dc2626', terminals: polarised, defaults: {} },
  irLed: { category: 'output', accent: '#7e22ce', terminals: polarised, defaults: { camera: false } },
  solenoid: { category: 'output', accent: '#57534e', terminals: twoWay, defaults: {} },
  pump: { category: 'output', accent: '#0891b2', terminals: twoWay, defaults: {} },
  bell: { category: 'output', accent: '#d97706', terminals: twoWay, defaults: {} },
  barGraph: {
    category: 'output',
    accent: '#16a34a',
    terminals: {
      VCC: { side: 'left', offset: 0.68, polarity: '+' },
      GND: { side: 'left', offset: 0.32, polarity: '-' },
      IN: { side: 'right', label: 'IN' },
    },
    defaults: {},
  },
  trafficLight: {
    category: 'output',
    accent: '#eab308',
    terminals: {
      R: { side: 'left', offset: 0.76, label: 'R', tint: '#dc2626' },
      Y: { side: 'left', offset: 0.5, label: 'Y', tint: '#ca8a04' },
      G: { side: 'left', offset: 0.24, label: 'G', tint: '#16a34a' },
      GND: { side: 'right', polarity: '-' },
    },
    defaults: {},
  },
  fan: { category: 'output', accent: '#0d9488', terminals: polarised, defaults: {} },
  nandGate: gate(2, '#0d9488'),
  norGate: gate(2, '#4f46e5'),
  latch: {
    category: 'logic',
    accent: '#db2777',
    terminals: chipTerminals([['S', 'S'], ['R', 'R']], { Q: { side: 'right', label: 'Q' } }),
    defaults: {},
  },
  counter: {
    category: 'logic',
    accent: '#0891b2',
    terminals: chipTerminals([['CLK', 'CLK'], ['RST', 'RST']], counterOutputs),
    defaults: {},
  },
  comparator: {
    category: 'logic',
    accent: '#ca8a04',
    terminals: chipTerminals([['P', 'IN+'], ['N', 'IN−']], { OUT: { side: 'right', label: 'OUT' } }),
    defaults: {},
  },
  hBridge: {
    category: 'logic',
    accent: '#dc2626',
    terminals: chipTerminals([['IN1', 'IN1'], ['IN2', 'IN2']], {
      M1: { side: 'right', offset: 0.32, label: 'M1' },
      M2: { side: 'right', offset: 0.68, label: 'M2' },
    }),
    defaults: {},
  },
  multimeter: {
    category: 'meter',
    accent: '#eab308',
    // red probe (+) on the left, black COM probe (−) on the right
    terminals: polarised,
    defaults: { dial: 'volts' },
    // its screen would read sideways
    rotatable: false,
  },
  logicProbe: {
    category: 'meter',
    accent: '#7c3aed',
    terminals: {
      VCC: { side: 'left', offset: 0.68, polarity: '+' },
      GND: { side: 'left', offset: 0.32, polarity: '-' },
      TIP: { side: 'right', label: 'TIP' },
    },
    defaults: {},
  },
}

/** The logic gates. */
export type GateType = 'notGate' | 'andGate' | 'orGate' | 'xorGate' | 'nandGate' | 'norGate'
export const GATE_TYPES: readonly GateType[] = ['notGate', 'andGate', 'orGate', 'xorGate', 'nandGate', 'norGate']
export const isGate = (type: PartType): type is GateType => (GATE_TYPES as readonly string[]).includes(type)

/** What a gate's output Y is for its inputs. NOT only looks at A. */
export function gateOutput(type: GateType, a: boolean, b: boolean): boolean {
  switch (type) {
    case 'notGate':
      return !a
    case 'andGate':
      return a && b
    case 'orGate':
      return a || b
    case 'xorGate':
      return a !== b
    // NAND and NOR are AND and OR with a NOT on the end
    case 'nandGate':
      return !(a && b)
    case 'norGate':
      return !(a || b)
  }
}

/** A gate's inputs, in the order they are drawn from the top. */
export const gateInputs = (type: GateType): ('A' | 'B')[] => (type === 'notGate' ? ['A'] : ['A', 'B'])

/** Is the 555 blinker's output high at `t` seconds? Half of each blink is on, half off. */
export const timerHigh = (rate: number, t: number) => (t * rate) % 1 < 0.5

/** The colours of the RGB LED's three little LEDs. */
export const RGB_CHANNELS = { R: '#ff2d2d', G: '#22e06b', B: '#3b6bff' } as const

/**
 * The colour you see when the RGB LED's three lights shine together, from
 * their brightness (0..1.3 each). Null when all three are dark.
 */
export function rgbMix(levels: { R?: number; G?: number; B?: number } | undefined): string | null {
  const r = Math.max(0, levels?.R ?? 0)
  const g = Math.max(0, levels?.G ?? 0)
  const b = Math.max(0, levels?.B ?? 0)
  const top = Math.max(r, g, b)
  if (top < 0.01) return null
  // each primary leaks a little into the others, like light mixing in the milky lens
  const mix = [r + 0.12 * g + 0.15 * b, 0.12 * r + g + 0.3 * b, 0.08 * r + 0.25 * g + b]
  const scale = 255 / Math.max(...mix)
  return `#${mix.map((c) => Math.round(c * scale).toString(16).padStart(2, '0')).join('')}`
}

export type SensorSpec = {
  /** how the world around the sensor is set on its card: a slider, a hold button or an on/off toggle */
  control: 'slider' | 'hold' | 'toggle'
  /** the value shown next to the slider */
  format?: (sense: number) => string
  /**
   * 3-pin modules only: the output, as a share of the supply voltage, for this `sense`
   * at `time` seconds (only the heartbeat sensor changes by itself)
   */
  signal?: (sense: number, time: number) => number
  /** 3-pin modules only: the output is just HIGH or LOW */
  digital?: boolean
}

const percent = (s: number) => `${Math.round(s * 100)}%`
/** sensors read 0 °C … 60 °C */
export const senseToCelsius = (s: number) => Math.round(s * 60)
/** the distance sensor reads 2 cm … 200 cm */
export const senseToCentimetres = (s: number) => Math.round(2 + s * 198)
/** the water sensor's strip is 4 cm long */
export const senseToWaterDepth = (s: number) => Math.round(s * 40) / 10
/** the heartbeat sensor: 40 to 180 beats a minute */
export const senseToBpm = (s: number) => Math.round(40 + Math.min(1, Math.max(0, s)) * 140)

/**
 * The heartbeat sensor's output at `time` seconds: a quick bump for every beat and
 * a small echo after it, like the line on a hospital monitor. 0..1.
 */
export function heartbeat(bpm: number, time: number): number {
  const phase = ((time * bpm) / 60) % 1
  const beat = Math.exp(-(((phase - 0.12) / 0.09) ** 2))
  const echo = 0.25 * Math.exp(-(((phase - 0.42) / 0.07) ** 2))
  return 0.12 + 0.88 * Math.min(1, beat + echo)
}

/** Parts whose card has a control for the world around them. */
export type SensedPart =
  | 'thermistor'
  | 'tilt'
  | 'reed'
  | 'tempSensor'
  | 'ultrasonic'
  | 'pir'
  | 'soundSensor'
  | 'gasSensor'
  | 'soilSensor'
  | 'touchSensor'
  | 'flameSensor'
  | 'rainSensor'
  | 'waterSensor'
  | 'humiditySensor'
  | 'hallSensor'
  | 'irSensor'
  | 'lineSensor'
  | 'forceSensor'
  | 'pulseSensor'
  | 'knockSensor'

export const SENSORS: Partial<Record<PartType, SensorSpec>> & Record<SensedPart, SensorSpec> = {
  thermistor: { control: 'slider', format: (s) => `${senseToCelsius(s)}°C` },
  tilt: { control: 'toggle' },
  reed: { control: 'toggle' },
  tempSensor: { control: 'slider', format: (s) => `${senseToCelsius(s)}°C`, signal: (s) => s },
  // closer things give a bigger signal
  ultrasonic: { control: 'slider', format: (s) => `${senseToCentimetres(s)} cm`, signal: (s) => 1 - s },
  pir: { control: 'hold', digital: true, signal: (s) => s },
  soundSensor: { control: 'slider', format: percent, signal: (s) => s },
  gasSensor: { control: 'slider', format: percent, signal: (s) => s },
  soilSensor: { control: 'slider', format: percent, signal: (s) => s },
  touchSensor: { control: 'hold', digital: true, signal: (s) => s },
  // a bigger, closer flame gives a bigger signal
  flameSensor: { control: 'slider', format: percent, signal: (s) => s },
  rainSensor: { control: 'slider', format: percent, signal: (s) => s },
  waterSensor: { control: 'slider', format: (s) => `${senseToWaterDepth(s).toFixed(1)} cm`, signal: (s) => s },
  // the share of water the air holds, 0 … 100 %
  humiditySensor: { control: 'slider', format: percent, signal: (s) => s },
  // HIGH while the magnet is near
  hallSensor: { control: 'toggle', digital: true, signal: (s) => s },
  // HIGH while something is in front of it
  irSensor: { control: 'toggle', digital: true, signal: (s) => s },
  // HIGH over a black line: black takes in the light, so none bounces back
  lineSensor: { control: 'toggle', digital: true, signal: (s) => s },
  forceSensor: { control: 'slider', format: percent, signal: (s) => s },
  pulseSensor: {
    control: 'slider',
    format: (s) => `${senseToBpm(s)} bpm`,
    signal: (s, time) => heartbeat(senseToBpm(s), time),
  },
  knockSensor: { control: 'hold', digital: true, signal: (s) => s },
}

export const isSensorModule = (type: PartType) => SENSORS[type]?.signal !== undefined

/** NTC thermistor: high resistance when cold, low when hot. */
export function thermistorResistance(sense: number): number {
  const { r25, beta } = ELECTRICAL.thermistor
  const kelvin = senseToCelsius(Math.min(1, Math.max(0, sense))) + 273.15
  return r25 * Math.exp(beta * (1 / kelvin - 1 / 298.15))
}

/** Height of a standard card: title row, 3D window and control row. */
export const DEFAULT_PART_HEIGHT = 178

/** Card width in px. Screens grow with their size, so they need their data. */
export function partWidth(type: PartType, data?: PartData): number {
  if (isDisplay(type)) return displayGeometry(data ?? createPartData(type)).width
  return PARTS[type].width ?? DEFAULT_PART_WIDTH
}

/** Card height in px. */
export function partHeight(type: PartType, data?: PartData): number {
  return isDisplay(type) ? displayGeometry(data ?? createPartData(type)).height : DEFAULT_PART_HEIGHT
}

export const isRotatable = (type: PartType) => PARTS[type].rotatable !== false
export const terminalIds = (type: PartType) => Object.keys(PARTS[type].terminals)

const SIDES_CLOCKWISE: Side[] = ['left', 'top', 'right', 'bottom']

export function rotateSide(side: Side, rotation: Rotation): Side {
  const index = SIDES_CLOCKWISE.indexOf(side)
  return SIDES_CLOCKWISE[(index + rotation / 90) % 4]
}

/**
 * Where a terminal sits on the card, as a CSS position along its side.
 * Offsets are measured clockwise, so a turned part keeps them unchanged.
 */
export function terminalPlacement(def: TerminalDef, rotation: Rotation) {
  const side = rotateSide(def.side, rotation)
  const offset = def.offset ?? 0.5
  const along = side === 'left' || side === 'bottom' ? 1 - offset : offset
  return { side, percent: along * 100 }
}

export function nextRotation(rotation: Rotation): Rotation {
  return ((rotation + 90) % 360) as Rotation
}

/** The bench power supply's set voltage and current limit, kept inside what it can do. */
export function supplySettings(data: PartData) {
  // a USB power bank is a supply with fixed settings
  if (data.type === 'powerBank') return { voltage: ELECTRICAL.powerBank.voltage, limit: ELECTRICAL.powerBank.limit }
  const voltage = Math.min(ELECTRICAL.supply.maxVoltage, Math.max(0, data.voltage ?? 5))
  const limit = Math.min(2, Math.max(0.01, data.limit ?? 0.5))
  return { voltage, limit }
}

/** Parts that hold their volts steady up to a current limit: the bench supply and the power bank. */
export const isSupply = (type: PartType) => type === 'powerSupply' || type === 'powerBank'

/** How many lemons are in the row, 1 … 4. */
export const lemonCount = (data: PartData) => Math.min(4, Math.max(1, Math.round(data.cells ?? 3)))

/** The volts of the crank generator for how fast its crank turns. */
export const dynamoVoltage = (speed: number) => ELECTRICAL.dynamo.maxVoltage * Math.min(1, Math.max(0, speed))

/**
 * The lemons, the coin cell and the crank generator are cells like the battery:
 * a push (volts) behind a resistance inside them. Null for every other part.
 */
export function cellModel(data: PartData): { voltage: number; resistance: number } | null {
  switch (data.type) {
    case 'lemon': {
      // lemons in a row add their volts, and their resistances too
      const n = lemonCount(data)
      return { voltage: n * ELECTRICAL.lemon.voltage, resistance: n * ELECTRICAL.lemon.resistance }
    }
    case 'coinCell':
      return { voltage: ELECTRICAL.coinCell.voltage, resistance: ELECTRICAL.coinCell.resistance }
    case 'dynamo':
      return { voltage: dynamoVoltage(data.level ?? 0), resistance: ELECTRICAL.dynamo.resistance }
    default:
      return null
  }
}

/**
 * The terminal pairs a switch-like part joins right now, with the ohms between
 * them: the slide switch's and micro switch's contacts, and the joystick's two knobs.
 */
export function contactPairs(data: PartData): [TerminalId, TerminalId, number][] {
  const contact = ELECTRICAL.contactResistance
  switch (data.type) {
    case 'slideSwitch':
      return [['COM', data.closed ? 'B' : 'A', contact]]
    case 'microSwitch':
      return [['COM', data.pressed ? 'NO' : 'NC', contact]]
    case 'joystick': {
      // each knob runs from + to −, its wiper is X or Y: pushed right (or up) gives more volts
      const total = ELECTRICAL.joystick.resistance
      const { wiperResistance } = ELECTRICAL.potentiometer
      const halves = (share: number) => {
        const s = Math.min(1, Math.max(0, share))
        return [total * (1 - s) + wiperResistance, total * s + wiperResistance]
      }
      const [xTop, xBottom] = halves(data.stickX ?? 0.5)
      const [yTop, yBottom] = halves(data.stickY ?? 0.5)
      return [
        ['VCC', 'X', xTop],
        ['X', 'GND', xBottom],
        ['VCC', 'Y', yTop],
        ['Y', 'GND', yBottom],
      ]
    }
    default:
      return []
  }
}

/** The potentiometer's two halves: from A to the wiper W and from W to B. */
export function potentiometerSplit(data: PartData) {
  const total = data.resistance ?? 1000
  const level = Math.min(1, Math.max(0, data.level ?? 0.5))
  const { wiperResistance } = ELECTRICAL.potentiometer
  return { aw: total * (1 - level) + wiperResistance, wb: total * level + wiperResistance }
}

export function batteryResistance(voltage: number): number {
  const cells = Math.max(1, Math.round(voltage / 1.5))
  return cells * ELECTRICAL.cellResistance
}

export function dimmerResistance(level: number): number {
  const { minResistance, maxResistance } = ELECTRICAL.dimmer
  const clamped = Math.min(1, Math.max(0, level))
  return minResistance + (maxResistance - minResistance) * (1 - clamped) ** 1.5
}

/** Light sensor: lots of resistance in the dark, little in bright light. */
export function ldrResistance(light: number): number {
  const { dark, bright } = ELECTRICAL.ldr
  const clamped = Math.min(1, Math.max(0, light))
  return dark * (bright / dark) ** clamped
}

/** Open-circuit voltage of the solar panel for a given amount of light. */
export function solarVoltage(light: number): number {
  const clamped = Math.min(1, Math.max(0, light))
  return clamped < 0.02 ? 0 : ELECTRICAL.solar.voltage * clamped ** 0.35
}

/**
 * Output level (0..1) of an Arduino pin at `t` seconds: what its tiny program
 * does right now. `a0` is the voltage last read on the A0 input.
 */
export function pinOutput(mode: PinMode | undefined, t: number, pwm: boolean, reading = 0): number {
  switch (mode) {
    case 'on':
      return 1
    case 'blink':
      return t % 1 < 0.5 ? 1 : 0
    case 'fade':
      // PWM: the average voltage rises and falls every 2 seconds
      return pwm ? 0.5 - 0.5 * Math.cos(Math.PI * t) : t % 1 < 0.5 ? 1 : 0
    case 'blink2':
      // the other half of each second: two pins take turns
      return t % 1 < 0.5 ? 0 : 1
    case 'step1':
    case 'step2':
    case 'step3':
      // a 3-second loop, one second each: red, green, yellow on a traffic light
      return Math.floor(t % 3) === STEP_INDEX[mode] ? 1 : 0
    case 'follow': {
      // `reading` is the input as a share of the board's voltage. PWM pins
      // copy it smoothly, the others switch at half way
      const share = Math.min(1, Math.max(0, reading))
      return pwm ? share : share > 0.5 ? 1 : 0
    }
    case 'invert': {
      // the opposite: on in the dark, on when the soil is dry
      const share = Math.min(1, Math.max(0, reading))
      return pwm ? 1 - share : share > 0.5 ? 0 : 1
    }
    case 'alarm': {
      // silent below half way, then beeps: every 0.6 s at half, every 0.2 s at the top
      const share = Math.min(1, Math.max(0, reading))
      if (share <= 0.5) return 0
      const beat = alarmBeat(share)
      return t % beat < beat / 2 ? 1 : 0
    }
    default:
      return 0
  }
}

const STEP_INDEX = { step1: 0, step2: 1, step3: 2 } as const

/** Seconds from one beep of an `alarm` pin to the next, for a reading above half way. */
export const alarmBeat = (share: number) => 0.6 - 0.8 * (Math.min(1, share) - 0.5)

/** Pin programs that read the board's sensor input. */
export const SENSOR_MODES: readonly PinMode[] = ['follow', 'invert', 'alarm']

/** True when the board changes over time (blinking pins, charging capacitors, pins reading a sensor). */
export function isTimeDependent(data: PartData): boolean {
  if (data.type === 'capacitor' || data.type === 'timer555') return true
  // the heartbeat sensor beats by itself
  if (data.type === 'pulseSensor') return true
  // the logic probe's PULSE light stays on for a moment after each change, then goes out
  if (data.type === 'logicProbe') return true
  if (isBoard(data.type)) return Object.values(data.pins ?? {}).some((m) => m !== 'off' && m !== 'on')
  return false
}

export function createPartData(type: PartType): PartData {
  const { defaults } = PARTS[type]
  // copy nested objects so two parts never share one pin program
  return { type, rotation: 0, ...defaults, ...(defaults.pins ? { pins: { ...defaults.pins } } : {}) }
}

/** 4-band resistor colour code: two digits, multiplier, gold tolerance. */
const BAND_COLORS = [
  '#1c1917', // black
  '#7c3f12', // brown
  '#dc2626', // red
  '#f97316', // orange
  '#facc15', // yellow
  '#16a34a', // green
  '#2563eb', // blue
  '#7c3aed', // violet
  '#9ca3af', // grey
  '#fafafa', // white
]

export function resistorBands(ohms: number): string[] {
  const exponent = Math.max(0, Math.floor(Math.log10(ohms)) - 1)
  const significant = Math.round(ohms / 10 ** exponent)
  const first = Math.floor(significant / 10) % 10
  const second = significant % 10
  return [BAND_COLORS[first], BAND_COLORS[second], BAND_COLORS[exponent], '#d4a017']
}

export function formatOhms(ohms: number): string {
  return ohms >= 1000 ? `${ohms / 1000}kΩ` : `${ohms}Ω`
}

export function formatFarads(microfarads: number): string {
  return `${microfarads}µF`
}

export function formatAmps(amps: number): string {
  return `${amps}A`
}
