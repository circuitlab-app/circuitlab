import { BOARDS, createPartData, type BoardType } from './catalog'
import type {
  BuzzerSound,
  CircuitSnapshot,
  LedColor,
  PartData,
  PartNode,
  PartType,
  PinMode,
  Rotation,
  WireColor,
  WireEdge,
} from './types'

export type PresetId =
  | 'flashlight'
  | 'fan'
  | 'doorbell'
  | 'led'
  | 'series'
  | 'parallel'
  | 'dimmer'
  | 'short'
  | 'arduino'
  | 'transistor'
  | 'capacitor'
  | 'solar'
  | 'meters'
  | 'servo'
  | 'motion'
  | 'cityTv'
  | 'goldSign'
  | 'counter'
  // first circuits
  | 'rainbow'
  | 'toyCar'
  | 'batteryTester'
  // electronics
  | 'streetLamp'
  | 'fuseGuard'
  | 'solarGarden'
  | 'noiseLight'
  // boards and code
  | 'trafficLight'
  | 'policeLights'
  | 'partyLights'
  | 'holidayLights'
  | 'railroad'
  // smart gadgets
  | 'nightLight'
  | 'smokeAlarm'
  | 'parkingSensor'
  | 'plantAlarm'
  | 'smartFan'
  | 'autoDoor'
  | 'radar'
  | 'doorAlarm'
  | 'smartHome'
  // screens and signs
  | 'thermometer'
  | 'scoreboard'
  | 'doorbellScreen'
  | 'busStop'
  | 'pocketTv'
  // first circuits, second batch
  | 'hairDryer'
  | 'bikeBell'
  | 'carLights'
  | 'morseKey'
  // electronics, second batch
  | 'knobDimmer'
  | 'diodeCheck'
  | 'relayLamp'
  | 'safeShort'
  | 'phoneCharger'
  | 'delayLight'
  // science lab
  | 'scopeKnob'
  | 'lightMeter'
  | 'solarMeter'
  | 'ohmsLaw'
  | 'magnetLab'
  | 'scopeSquare'
  | 'scopeCap'
  | 'scopeBreath'
  // logic and chips
  | 'flasher555'
  | 'darkLamp'
  | 'stairLight'
  | 'safeLock'
  | 'twoDoors'
  | 'halfAdder'
  | 'seatbelt'
  // boards and code, second batch
  | 'fireflies'
  | 'chaser'
  // smart gadgets, second batch
  | 'rainAlert'
  | 'laserAlarm'
  | 'babyMonitor'
  | 'greenhouse'
  // sound and music
  | 'piano'
  | 'metronome'
  | 'siren'
  | 'musicBox'
  | 'morningBird'
  | 'dingDong'
  | 'ambulance'
  // motion and robots
  | 'toothbrush'
  | 'crane'
  | 'fanKnob'
  | 'robotArm'
  | 'phoneBuzz'
  | 'robotHead'
  | 'conveyor'
  | 'gasPedal'
  | 'robotCar'
  // home and city
  | 'lighthouse'
  | 'fridgeLight'
  | 'moodLamp'
  | 'bikeLights'
  | 'alarmClock'
  | 'christmasTree'
  | 'crossing'
  | 'gardenLamp'
  // games
  | 'stopwatch'
  | 'steadyHand'
  | 'quizBoard'
  | 'shoutMeter'
  | 'disco'
  | 'reactionGame'
  // screens and signs, second batch
  | 'openSign'
  | 'pharmacySign'
  | 'newsDesk'
  | 'cafeMenu'
  | 'elevator'
  | 'weatherStation'
  | 'airportBoard'
  | 'cinemaSign'
  // talk to the AI board
  | 'aiSmartHome'
  | 'aiTrafficLight'
  | 'aiPartyLights'
  | 'aiPlantHelper'
  | 'aiRobotPet'
  | 'aiCarLights'
  | 'aiFactoryLine'
  | 'aiWellGuard'
  | 'aiWeatherCloud'
  | 'aiNightGuard'
  | 'aiMoodLamp'
  // cars: the engine computer (ECU) and the car's own networks
  | 'ecuCooling'
  | 'ecuHeadlights'
  | 'ecuWipers'
  | 'ecuParking'
  | 'ecuCanDash'
  | 'ecuAlarm'
  | 'ecuTracker'
  | 'ecuHazard'
  | 'ecuBrakeLights'
  | 'ecuSeatbelt'
  | 'ecuDomeLight'
  | 'ecuFuelGauge'
  | 'ecuBattery'
  | 'ecuHorn'
  | 'ecuLaneAssist'
  | 'ecuClimate'
  | 'ecuCrash'
  | 'ecuShiftLight'
  | 'ecuEvCooling'
  | 'ecuDefog'
  | 'ecuChildAlert'
  // factories: the PLC and the machines it runs
  | 'plcConveyor'
  | 'plcTank'
  | 'plcAndon'
  | 'plcSafety'
  | 'plcModbus'
  | 'plcHydraulic'
  | 'plcBurner'
  | 'plcCounter'
  | 'plcBottling'
  | 'plcMixer'
  | 'plcSorter'
  | 'plcTwoHand'
  | 'plcCrane'
  | 'plcBoiler'
  | 'plcColdRoom'
  | 'plcSilo'
  | 'plcScale'
  | 'plcPaintBooth'
  | 'plcRobotArm'
  | 'plcLightCurtain'
  | 'plcForklift'
  // oil and gas: the RTU at the well, far from any town
  | 'rtuWellhead'
  | 'rtuGasLeak'
  | 'rtuPumpJack'
  | 'rtuFlare'
  | 'rtuTankFarm'
  | 'rtuPipeline'
  | 'rtuSolarSite'
  | 'rtuSeparator'
  | 'rtuChoke'
  | 'rtuEsp'
  | 'rtuDeluge'
  | 'rtuPigging'
  // connected: SMS, Wi-Fi, Bluetooth, LoRa and GPS
  | 'smsFireAlarm'
  | 'wifiWeather'
  | 'btHeartBand'
  | 'loraFarm'
  | 'wifiDoorbell'
  | 'gpsBike'

/** Words some presets show on their screens, in the app's language. An empty string shows the screen's own sample. */
export type PresetTexts = {
  citySign: string
  party: string
  holiday: string
  score: string
  doorbell: string
  busStop: string
  smartHome: string
  /** the phone charger's screen */
  charging: string
  /** the ringing phone's screen */
  calling: string
  /** the star sign on the Christmas tree */
  tree: string
  /** the quiz board's question and its three answers, one per line */
  quiz: string
  /** the moving words over the cinema doors */
  cinema: string
  /** the airport's departures board, four lines */
  departures: string
  /** the pharmacy's two-line sign */
  pharmacy: string
  /** the elevator's screen */
  elevator: string
  /** the weather station's forecast */
  weather: string
  /** the café's menu, four lines */
  menu: string
  /** the shop's open sign */
  open: string
  /** the news ticker under the studio's screen */
  news: string
  /** the disco's sign */
  disco: string
  /** the baby monitor's screen */
  baby: string
  /** the text messages: the car alarm's, the gas leak's, the flare's and the fire alarm's */
  smsCar: string
  smsGas: string
  smsFlare: string
  smsFire: string
  /** the crash call, the child left in the car and the pipeline pig */
  smsCrash: string
  smsChild: string
  smsPig: string
}

type PresetPart = {
  key: string
  type: PartType
  x: number
  y: number
  rotation?: Rotation
  /** a function when the part shows words in the app's language */
  data?: Partial<PartData> | ((texts: Partial<PresetTexts>) => Partial<PartData>)
}

/** [from, to, colour] with terminals written as `key:a` / `key:b` */
type PresetWire = [string, string, WireColor]

type Preset = { parts: PresetPart[]; wires: PresetWire[] }

/*
 * Most presets use the same "loop" layout that reads like a textbook diagram:
 *
 *            ┌── top part ──┐
 *   battery  │              │  right part
 *   (+ top)  └──────────────┘  (a top, b bottom)
 */
const loop = (top: PresetPart['type'], right: PresetPart['type'], extra: {
  top?: Partial<PartData>
  right?: Partial<PartData>
  battery?: Partial<PartData>
} = {}): Preset => ({
  parts: [
    { key: 'bat', type: 'battery', x: 0, y: 150, rotation: 270, data: extra.battery },
    { key: 'top', type: top, x: 290, y: -40, data: extra.top },
    { key: 'right', type: right, x: 580, y: 150, rotation: 90, data: extra.right },
  ],
  wires: [
    ['bat:a', 'top:a', 'red'],
    ['top:b', 'right:a', 'yellow'],
    ['right:b', 'bat:b', 'black'],
  ],
})

/** Every pin of a board switched off, then the ones given: a board never runs a program you did not ask for. */
function program(board: BoardType, pins: Record<string, PinMode>): Partial<PartData> {
  return { pins: { ...Object.fromEntries(BOARDS[board].pins.map((pin) => [pin, 'off' as PinMode])), ...pins } }
}

/*
 * Board examples share one layout, so they read the same way every time:
 *
 *              screen or servo     (just above the board, joined on its left)
 *              board ─ pin wires ─┬──────────┬──────────┐
 *   sensor                     resistor   resistor   resistor   (upright)
 *   (below left, S up into the input) LED  LED      buzzer      (+ on top)
 *   └──── one black ground wire back under everything, to the sensor's − or the board's GND
 *
 * The highest pin goes to the column furthest away, so pin wires never cross.
 */
const COLUMN = 220
const FIRST_COLUMN = 330
const RESISTOR_ROW = 240
const OUTPUT_ROW = 470
/** a sensor module below and left of a board at (0, 0) */
const SENSOR_SPOT = { x: -330, y: 260 }
/** a screen or servo just above a board at (0, 0) */
const ABOVE_BOARD = { x: -40, y: -250 }

type Output = {
  key: string
  pin: string
  /** any part with a + end `a` and a − end `b`: an LED, a buzzer, a speaker, a beacon … */
  type: PartType
  color?: LedColor
  /** the speaker's note */
  pitch?: number
  /** a buzzer's beep or siren */
  sound?: BuzzerSound
  /** the resistor in front of it; 0 for a part with its own (the beacon) */
  ohms: number
  wire: WireColor
}

/** A part fed from `from` through its own resistor: one column of `branches`. */
type Branch = Omit<Output, 'pin'> & { from: string }

/**
 * Columns of resistor-and-part pairs hanging from their own terminals, left to
 * right, with the − ends joined along the bottom and one wire back to `ground`.
 * The resistors stand at `top`, the parts under them.
 */
function branches(list: Branch[], ground: string, left = FIRST_COLUMN, top = RESISTOR_ROW): Preset {
  return {
    parts: list.flatMap((o, i) => [
      // a part with its resistor built in (the beacon) has none in front of it
      ...(o.ohms > 0 ? [{ key: `${o.key}R`, type: 'resistor', x: left + i * COLUMN, y: top, rotation: 90, data: { resistance: o.ohms } } satisfies PresetPart] : []),
      {
        key: o.key,
        type: o.type,
        x: left + i * COLUMN,
        y: top + OUTPUT_ROW - RESISTOR_ROW,
        rotation: 90,
        data: o.color ? { color: o.color } : o.pitch ? { pitch: o.pitch } : o.sound ? { sound: o.sound } : undefined,
      },
    ] satisfies PresetPart[]),
    wires: [
      ...list.flatMap((o): PresetWire[] =>
        o.ohms > 0
          ? [
              [o.from, `${o.key}R:a`, o.wire],
              [`${o.key}R:b`, `${o.key}:a`, o.wire],
            ]
          : [[o.from, `${o.key}:a`, o.wire]],
      ),
      // the − ends join along the bottom, then one wire runs back
      ...list.slice(1).map((o, i): PresetWire => [`${o.key}:b`, `${list[i].key}:b`, 'black']),
      [`${list[0].key}:b`, ground, 'black'],
    ],
  }
}

/** Pins driving LEDs and buzzers through their resistors, left to right, with a shared ground. */
function outputs(board: string, list: Output[], ground = `${board}:GND`): Preset {
  return branches(
    list.map(({ pin, ...o }) => ({ ...o, from: `${board}:${pin}` })),
    ground,
  )
}

/** A part on a ladder: its key, its type and its settings. */
type Piece = { key: string; type: PartType; data?: PresetPart['data']; rotation?: Rotation }

/** One rung of a ladder: the top part feeds the bottom one. */
type Rung = { top: Piece; bottom: Piece; wire?: WireColor }

/*
 * Several loops side by side on one battery, like a real ladder diagram:
 *
 *   battery   lead?   top    top    top      (+ joined along the top)
 *   (+ top)           bottom bottom bottom   (− joined along the bottom)
 *
 * Both parts of a rung stand upright (+ end on top). An optional `lead` (a main
 * switch, say) sits between the battery and the first rung.
 */
function ladder(power: Piece, rungs: Rung[], lead?: Piece): Preset {
  const left = lead ? 560 : 270
  // a part turned the other way round (270°) has its − end on top
  const up = (p: Piece) => `${p.key}:${p.rotation === 270 ? 'b' : 'a'}`
  const down = (p: Piece) => `${p.key}:${p.rotation === 270 ? 'a' : 'b'}`
  return {
    parts: [
      { ...power, x: 0, y: 160, rotation: power.rotation ?? 270 },
      ...(lead ? [{ ...lead, x: 270, y: -60 }] : []),
      ...rungs.flatMap((r, i): PresetPart[] => [
        { ...r.top, x: left + i * COLUMN, y: 0, rotation: r.top.rotation ?? 90 },
        { ...r.bottom, x: left + i * COLUMN, y: 240, rotation: r.bottom.rotation ?? 90 },
      ]),
    ],
    wires: [
      ...(lead ? [[`${power.key}:a`, `${lead.key}:a`, 'red'] satisfies PresetWire] : []),
      [lead ? `${lead.key}:b` : `${power.key}:a`, up(rungs[0].top), 'red'],
      ...rungs.slice(1).map((r, i): PresetWire => [up(rungs[i].top), up(r.top), 'red']),
      ...rungs.map((r): PresetWire => [down(r.top), up(r.bottom), r.wire ?? 'yellow']),
      ...rungs.slice(1).map((r, i): PresetWire => [down(r.bottom), down(rungs[i].bottom), 'black']),
      [down(rungs[0].bottom), `${power.key}:b`, 'black'],
    ],
  }
}

const battery = (voltage: number, key = 'bat'): Piece => ({ key, type: 'battery', data: { voltage } })

/*
 * Chip examples share one layout. The chip sits at (0, 0) with its battery on
 * the left; a 2-input chip has its two inputs (switches, buttons) between them,
 * one above and one below:
 *
 *                    low light (fed from +, lit while the output is LOW)
 *   battery  input A
 *            input B  chip ── Y/OUT ── resistor ── high light (lit while HIGH)
 */
const CHIP_POWER = { x: -330, y: 0 }
const INPUT_A = { x: -330, y: -230 }
const INPUT_B = { x: -330, y: 230 }

/** The chip at (0, 0) and its battery or power supply, joined to VCC and GND. */
function chipOn(chip: Piece, power: Piece, at = CHIP_POWER): Preset {
  const supply = power.type === 'powerSupply'
  return {
    parts: [
      { ...power, ...at, rotation: supply ? 0 : 270 },
      { ...chip, x: 0, y: 0 },
    ],
    wires: [
      [`${power.key}:a`, `${chip.key}:VCC`, 'red'],
      [`${chip.key}:GND`, `${power.key}:b`, 'black'],
    ],
  }
}

/** Two inputs for a gate: each joins + to A or B when it is on or pressed. */
function gateInputs(chip: string, plus: string, a: Piece, b: Piece): Preset {
  return {
    parts: [
      { ...a, ...INPUT_A },
      { ...b, ...INPUT_B },
    ],
    wires: [
      [plus, `${a.key}:a`, 'red'],
      [plus, `${b.key}:a`, 'red'],
      [`${a.key}:b`, `${chip}:A`, 'yellow'],
      [`${b.key}:b`, `${chip}:B`, 'blue'],
    ],
  }
}

/** A light (or buzzer, or speaker) behind its resistor. */
type Light = { key: string; type: PartType; data?: Partial<PartData>; ohms: number }

/**
 * The chip's output drives `high` while it is HIGH: out → resistor → part → −,
 * to the right of the chip. `low` hangs above the chip, from + through its
 * resistor into the output, so it lights while the output is LOW.
 */
function chipLights(out: string, plus: string, minus: string, high?: Light, low?: Light): Preset {
  return join(
    high
      ? {
          parts: [
            { key: `${high.key}R`, type: 'resistor', x: 290, y: 0, data: { resistance: high.ohms } },
            { key: high.key, type: high.type, x: 560, y: 0, rotation: 90, data: high.data },
          ],
          wires: [
            [out, `${high.key}R:a`, 'yellow'],
            [`${high.key}R:b`, `${high.key}:a`, 'yellow'],
            [`${high.key}:b`, minus, 'black'],
          ],
        }
      : { parts: [], wires: [] },
    low
      ? {
          parts: [
            { key: `${low.key}R`, type: 'resistor', x: 0, y: -480, rotation: 90, data: { resistance: low.ohms } },
            { key: low.key, type: low.type, x: 0, y: -250, rotation: 90, data: low.data },
          ],
          wires: [
            [plus, `${low.key}R:a`, 'red'],
            [`${low.key}R:b`, `${low.key}:a`, 'red'],
            [`${low.key}:b`, out, 'blue'],
          ],
        }
      : { parts: [], wires: [] },
  )
}

/** A 3-pin sensor module below and left of a board, reporting to its input. */
function sensorFor(board: string, type: BoardType, sensor: PartType, data?: Partial<PartData>): Preset {
  const spec = BOARDS[type]
  return {
    parts: [{ key: 'sensor', type: sensor, ...SENSOR_SPOT, data }],
    wires: [
      [`${board}:${spec.supply}`, 'sensor:VCC', 'red'],
      ['sensor:GND', `${board}:GND`, 'black'],
      ['sensor:OUT', `${board}:${spec.input}`, 'yellow'],
    ],
  }
}

/*
 * Industry examples add two more pieces to the board layout:
 *
 *   message module (above the board)   resistor ─ transistor     load   battery
 *   board ─────────────────────────────┘ (a pin switches a load too big for it, from its own battery)
 */
const DRIVER = { x: 330, y: -250 }

/**
 * A load too big for a board pin (a fan, a pump, a motor, a valve), switched by a
 * transistor from its own battery. Its − joins `ground`, so the board and the
 * battery share one ground.
 */
function driver(from: string, load: Piece, ground: string, volts = 4.5, ohms = 1000): Preset {
  const k = load.key
  return {
    parts: [
      { key: `${k}R`, type: 'resistor', ...DRIVER, data: { resistance: ohms } },
      { key: `${k}Q`, type: 'transistor', x: DRIVER.x + 290, y: DRIVER.y },
      { ...load, x: DRIVER.x + 540, y: DRIVER.y - 270, rotation: 90 },
      { key: `${k}Bat`, type: 'battery', x: DRIVER.x + 780, y: DRIVER.y - 270, rotation: 270, data: { voltage: volts } },
    ],
    wires: [
      [from, `${k}R:a`, 'blue'],
      [`${k}R:b`, `${k}Q:B`, 'blue'],
      [`${k}Bat:a`, `${k}:a`, 'red'],
      [`${k}:b`, `${k}Q:C`, 'yellow'],
      [`${k}Q:E`, `${k}Bat:b`, 'black'],
      [`${k}Bat:b`, ground, 'black'],
    ],
  }
}

/** A module just above the board on its supply, its IN joined to `from` (a pin, a sensor or a button). */
function above(board: BoardType, piece: Piece, from?: string, at: { x: number; y: number } = ABOVE_BOARD): Preset {
  const supply = BOARDS[board].supply
  return {
    parts: [{ ...piece, ...at }],
    wires: [
      [`board:${supply}`, `${piece.key}:VCC`, 'red'],
      [`${piece.key}:GND`, 'board:GND', 'black'],
      ...(from ? [[from, `${piece.key}:IN`, 'blue'] satisfies PresetWire] : []),
    ],
  }
}

/**
 * A switch, button or other two-legged input between the board's supply and its
 * input, with a pull-down resistor under it: the input reads HIGH while it is closed.
 */
function pulledDown(board: BoardType, input: Piece, ohms = 1000): Preset {
  const spec = BOARDS[board]
  return {
    parts: [
      { ...input, x: -330, y: -230, rotation: input.rotation ?? 90 },
      { key: 'pull', type: 'resistor', x: -330, y: 30, rotation: 90, data: { resistance: ohms } },
    ],
    wires: [
      [`board:${spec.supply}`, `${input.key}:a`, 'red'],
      [`${input.key}:b`, `board:${spec.input}`, 'yellow'],
      [`${input.key}:b`, 'pull:a', 'yellow'],
      ['pull:b', 'board:GND', 'black'],
    ],
  }
}

/** A board at (0, 0) running a program. */
const boardAt = (type: BoardType, pins: Record<string, PinMode>): Preset => ({
  parts: [{ key: 'board', type, x: 0, y: 0, data: program(type, pins) }],
  wires: [],
})

const join = (...presets: Preset[]): Preset => ({
  parts: presets.flatMap((p) => p.parts),
  wires: presets.flatMap((p) => p.wires),
})

/** colour and resistor of each LED in the rainbow: blue needs more volts, so it gets less resistance */
const RAINBOW: [LedColor, number][] = [
  ['red', 220],
  ['yellow', 220],
  ['green', 220],
  ['blue', 100],
]

const PRESETS: Record<PresetId, Preset> = {
  flashlight: loop('switch', 'lamp', { top: { closed: true } }),
  fan: loop('switch', 'motor', { top: { closed: true } }),
  doorbell: loop('button', 'buzzer'),
  led: loop('resistor', 'led', { top: { resistance: 47 }, right: { color: 'green' } }),
  series: loop('lamp', 'lamp'),
  dimmer: loop('dimmer', 'lamp', { top: { level: 0.55 }, right: { color: 'yellow' } }),
  parallel: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 150, rotation: 270 },
      { key: 'l1', type: 'lamp', x: 290, y: 150, rotation: 90 },
      { key: 'l2', type: 'lamp', x: 560, y: 150, rotation: 90, data: { color: 'blue' } },
    ],
    wires: [
      ['bat:a', 'l1:a', 'red'],
      ['bat:a', 'l2:a', 'red'],
      ['l1:b', 'bat:b', 'black'],
      ['l2:b', 'bat:b', 'black'],
    ],
  },
  short: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 150, rotation: 270 },
      { key: 'sw', type: 'switch', x: 290, y: 150, rotation: 90, data: { closed: true } },
      { key: 'lamp', type: 'lamp', x: 580, y: 150, rotation: 90 },
    ],
    wires: [
      ['bat:a', 'lamp:a', 'red'],
      ['lamp:b', 'bat:b', 'black'],
      ['bat:a', 'sw:a', 'yellow'],
      ['sw:b', 'bat:b', 'yellow'],
    ],
  },
  // pin 13 blinks a red LED, pin 9 fades a blue one; each LED has its resistor
  arduino: {
    parts: [
      {
        key: 'uno',
        type: 'arduino',
        x: 0,
        y: 150,
        data: { pins: { D13: 'blink', D12: 'off', D11: 'off', D10: 'off', D9: 'fade', D8: 'off' } },
      },
      { key: 'r1', type: 'resistor', x: 330, y: 0, data: { resistance: 220 } },
      { key: 'l1', type: 'led', x: 610, y: 0, data: { color: 'red' } },
      { key: 'r2', type: 'resistor', x: 330, y: 330, data: { resistance: 220 } },
      { key: 'l2', type: 'led', x: 610, y: 330, data: { color: 'blue' } },
    ],
    wires: [
      ['uno:D13', 'r1:a', 'red'],
      ['r1:b', 'l1:a', 'yellow'],
      ['l1:b', 'uno:GND', 'black'],
      ['uno:D9', 'r2:a', 'blue'],
      ['r2:b', 'l2:a', 'yellow'],
      ['l2:b', 'uno:GND', 'black'],
    ],
  },
  // a small current through the button and 1 kΩ switches the big lamp current
  transistor: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 180, rotation: 270, data: { voltage: 4.5 } },
      { key: 'lamp', type: 'lamp', x: 300, y: -20 },
      { key: 'q', type: 'transistor', x: 620, y: 180 },
      { key: 'btn', type: 'button', x: 160, y: 430 },
      { key: 'rb', type: 'resistor', x: 430, y: 430, data: { resistance: 1000 } },
    ],
    wires: [
      ['bat:a', 'lamp:a', 'red'],
      ['lamp:b', 'q:C', 'yellow'],
      ['q:E', 'bat:b', 'black'],
      ['bat:a', 'btn:a', 'red'],
      ['btn:b', 'rb:a', 'blue'],
      ['rb:b', 'q:B', 'blue'],
    ],
  },
  // switch on: the capacitor fills up. Switch off: it keeps the LED glowing for a while
  capacitor: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 180, rotation: 270, data: { voltage: 4.5 } },
      { key: 'sw', type: 'switch', x: 300, y: -20, data: { closed: true } },
      { key: 'cap', type: 'capacitor', x: 600, y: 180, rotation: 90, data: { capacitance: 10000 } },
      { key: 'r', type: 'resistor', x: 880, y: -20, data: { resistance: 220 } },
      { key: 'led', type: 'led', x: 1160, y: 180, rotation: 90, data: { color: 'yellow' } },
    ],
    wires: [
      ['bat:a', 'sw:a', 'red'],
      ['sw:b', 'cap:a', 'red'],
      ['cap:b', 'bat:b', 'black'],
      ['cap:a', 'r:a', 'yellow'],
      ['r:b', 'led:a', 'yellow'],
      ['led:b', 'cap:b', 'black'],
    ],
  },
  solar: {
    parts: [
      { key: 'sun', type: 'solar', x: 0, y: 150, rotation: 270, data: { light: 1 } },
      { key: 'm', type: 'motor', x: 330, y: 150, rotation: 90 },
    ],
    wires: [
      ['sun:a', 'm:a', 'red'],
      ['m:b', 'sun:b', 'black'],
    ],
  },
  // the fading pin 9 makes the servo sweep back and forth
  servo: {
    parts: [
      {
        key: 'uno',
        type: 'arduino',
        x: 0,
        y: 150,
        data: { pins: { D13: 'blink', D12: 'off', D11: 'off', D10: 'off', D9: 'fade', D8: 'off' } },
      },
      { key: 'servo', type: 'servo', x: 380, y: 150 },
    ],
    wires: [
      ['uno:5V', 'servo:VCC', 'red'],
      ['servo:GND', 'uno:GND', 'black'],
      ['uno:D9', 'servo:OUT', 'yellow'],
    ],
  },
  // the motion sensor talks to A0; pin 13 follows it and lights the LED
  motion: {
    parts: [
      { key: 'pir', type: 'pir', x: -340, y: 150 },
      {
        key: 'uno',
        type: 'arduino',
        x: 0,
        y: 150,
        data: { pins: { D13: 'follow', D12: 'off', D11: 'off', D10: 'off', D9: 'off', D8: 'off' } },
      },
      { key: 'r', type: 'resistor', x: 340, y: 0, data: { resistance: 220 } },
      { key: 'led', type: 'led', x: 620, y: 0, data: { color: 'green' } },
    ],
    wires: [
      ['uno:5V', 'pir:VCC', 'red'],
      ['pir:GND', 'uno:GND', 'black'],
      ['pir:OUT', 'uno:A0', 'yellow'],
      ['uno:D13', 'r:a', 'blue'],
      ['r:b', 'led:a', 'blue'],
      ['led:b', 'uno:GND', 'black'],
    ],
  },
  // the ammeter sits in the loop, the voltmeter across the lamp
  meters: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 180, rotation: 270 },
      { key: 'amm', type: 'ammeter', x: 300, y: -20 },
      { key: 'lamp', type: 'lamp', x: 600, y: 180, rotation: 90 },
      { key: 'vm', type: 'voltmeter', x: 880, y: 180, rotation: 90 },
    ],
    wires: [
      ['bat:a', 'amm:a', 'red'],
      ['amm:b', 'lamp:a', 'yellow'],
      ['lamp:b', 'bat:b', 'black'],
      ['lamp:a', 'vm:a', 'red'],
      ['lamp:b', 'vm:b', 'black'],
    ],
  },
  // a 6 × 3 panel video wall plays every built-in show from a big battery;
  // the moving sign under it runs on sunlight
  cityTv: {
    parts: [
      { key: 'bat', type: 'battery', x: -300, y: 72, rotation: 270, data: { voltage: 9 } },
      { key: 'wall', type: 'ledwall', x: 0, y: 0, data: { cols: 6, rows: 3, mode: 'demo', demo: 'reel', brightness: 0.9 } },
      { key: 'sun', type: 'solar', x: -300, y: 336, rotation: 270, data: { light: 1 } },
      {
        key: 'sign',
        type: 'matrix',
        x: 0,
        y: 348,
        data: (texts) => ({ cols: 9, rows: 1, tint: 'rainbow', text: texts.citySign || undefined, speed: 0.55, brightness: 0.7 }),
      },
    ],
    wires: [
      ['bat:a', 'wall:VCC', 'red'],
      ['wall:GND', 'bat:b', 'black'],
      ['sun:a', 'sign:VCC', 'red'],
      ['sign:GND', 'sun:b', 'black'],
    ],
  },
  // two lines of gold words; the sample text greets you and shows the gold price line
  goldSign: {
    parts: [
      { key: 'bat', type: 'battery', x: -300, y: 120, rotation: 270, data: { voltage: 4.5 } },
      { key: 'sign', type: 'matrix', x: 0, y: 110, data: { cols: 6, rows: 2, tint: 'yellow', effect: 'sparkle', speed: 0.45 } },
    ],
    wires: [
      ['bat:a', 'sign:VCC', 'red'],
      ['sign:GND', 'bat:b', 'black'],
    ],
  },
  counter: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 150, rotation: 270, data: { voltage: 4.5 } },
      { key: 'clock', type: 'segment', x: 300, y: 150, data: { digits: 4, mode: 'clock', tint: 'red' } },
    ],
    wires: [
      ['bat:a', 'clock:VCC', 'red'],
      ['clock:GND', 'bat:b', 'black'],
    ],
  },

  // ── first circuits ──

  // four LEDs side by side, each with its own resistor: + along the top, − along the bottom
  rainbow: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 160, rotation: 270, data: { voltage: 4.5 } },
      ...RAINBOW.flatMap(([color, ohms], i): PresetPart[] => [
        { key: `r${i}`, type: 'resistor', x: 270 + i * COLUMN, y: 0, rotation: 90, data: { resistance: ohms } },
        { key: `l${i}`, type: 'led', x: 270 + i * COLUMN, y: 240, rotation: 90, data: { color } },
      ]),
    ],
    wires: [
      ['bat:a', 'r0:a', 'red'],
      ...RAINBOW.slice(1).map((_, i): PresetWire => [`r${i}:a`, `r${i + 1}:a`, 'red']),
      ...RAINBOW.map((_, i): PresetWire => [`r${i}:b`, `l${i}:a`, 'yellow']),
      ...RAINBOW.slice(1).map((_, i): PresetWire => [`l${i + 1}:b`, `l${i}:b`, 'black']),
      ['l0:b', 'bat:b', 'black'],
    ],
  },
  // one switch, two wheels
  toyCar: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 150, rotation: 270 },
      { key: 'sw', type: 'switch', x: 290, y: -40, data: { closed: true } },
      { key: 'left', type: 'motor', x: 580, y: 150, rotation: 90 },
      { key: 'right', type: 'motor', x: 820, y: 150, rotation: 90 },
    ],
    wires: [
      ['bat:a', 'sw:a', 'red'],
      ['sw:b', 'left:a', 'yellow'],
      ['left:a', 'right:a', 'yellow'],
      ['right:b', 'left:b', 'black'],
      ['left:b', 'bat:b', 'black'],
    ],
  },
  // the voltmeter reads the battery; the green LED needs about 2 volts, so 1.5 V leaves it dark
  batteryTester: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 150, rotation: 270, data: { voltage: 4.5 } },
      { key: 'vm', type: 'voltmeter', x: 290, y: 150, rotation: 90 },
      { key: 'r', type: 'resistor', x: 560, y: -40, data: { resistance: 220 } },
      { key: 'led', type: 'led', x: 850, y: 150, rotation: 90, data: { color: 'green' } },
    ],
    wires: [
      ['bat:a', 'vm:a', 'red'],
      ['vm:a', 'r:a', 'red'],
      ['r:b', 'led:a', 'yellow'],
      ['led:b', 'vm:b', 'black'],
      ['vm:b', 'bat:b', 'black'],
    ],
  },

  // ── electronics ──

  // the light sensor and R1 share the battery's volts: in the dark the sensor takes most of
  // them, B gets enough and the transistor lights the lamp. The diode under E makes it wait
  // for real darkness instead of switching on at the first cloud
  streetLamp: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 150, rotation: 270, data: { voltage: 4.5 } },
      { key: 'r1', type: 'resistor', x: 260, y: -80, rotation: 90, data: { resistance: 1000 } },
      { key: 'ldr', type: 'ldr', x: 260, y: 330, rotation: 90, data: { light: 0.1 } },
      { key: 'q', type: 'transistor', x: 500, y: 150 },
      { key: 'lamp', type: 'lamp', x: 740, y: -80, rotation: 90 },
      { key: 'd', type: 'diode', x: 740, y: 330, rotation: 90 },
    ],
    wires: [
      ['bat:a', 'r1:a', 'red'],
      ['r1:a', 'lamp:a', 'red'],
      ['r1:b', 'ldr:a', 'yellow'],
      ['r1:b', 'q:B', 'yellow'],
      ['lamp:b', 'q:C', 'yellow'],
      ['q:E', 'd:a', 'blue'],
      ['d:b', 'ldr:b', 'black'],
      ['ldr:b', 'bat:b', 'black'],
    ],
  },
  // flip the switch: it joins both ends of the lamp, the current jumps and the fuse breaks first
  fuseGuard: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 150, rotation: 270 },
      { key: 'fuse', type: 'fuse', x: 290, y: -40, data: { rating: 0.5 } },
      { key: 'lamp', type: 'lamp', x: 580, y: 150, rotation: 90 },
      { key: 'sw', type: 'switch', x: 820, y: 150, rotation: 90, data: { closed: false } },
    ],
    wires: [
      ['bat:a', 'fuse:a', 'red'],
      ['fuse:b', 'lamp:a', 'yellow'],
      ['lamp:a', 'sw:a', 'yellow'],
      ['sw:b', 'lamp:b', 'black'],
      ['lamp:b', 'bat:b', 'black'],
    ],
  },
  // the sun fills the capacitor; the diode stops it emptying back into the dark panel
  solarGarden: {
    parts: [
      { key: 'sun', type: 'solar', x: 0, y: 150, rotation: 270, data: { light: 1 } },
      { key: 'd', type: 'diode', x: 290, y: -40 },
      { key: 'cap', type: 'capacitor', x: 580, y: 150, rotation: 90, data: { capacitance: 10000 } },
      { key: 'r', type: 'resistor', x: 860, y: -40, data: { resistance: 220 } },
      { key: 'led', type: 'led', x: 1150, y: 150, rotation: 90, data: { color: 'yellow' } },
    ],
    wires: [
      ['sun:a', 'd:a', 'red'],
      ['d:b', 'cap:a', 'red'],
      ['cap:a', 'r:a', 'yellow'],
      ['r:b', 'led:a', 'yellow'],
      ['led:b', 'cap:b', 'black'],
      ['cap:b', 'sun:b', 'black'],
    ],
  },
  // the sound sensor's signal feeds the transistor: the louder, the brighter the lamp
  noiseLight: {
    parts: [
      { key: 'bat', type: 'battery', x: -420, y: 120, rotation: 270, data: { voltage: 4.5 } },
      { key: 'mic', type: 'soundSensor', x: 0, y: 0, data: { sense: 0.8 } },
      { key: 'rb', type: 'resistor', x: 260, y: 0, data: { resistance: 220 } },
      { key: 'q', type: 'transistor', x: 520, y: 0 },
      { key: 'lamp', type: 'lamp', x: 760, y: -260, rotation: 90 },
    ],
    wires: [
      ['bat:a', 'mic:VCC', 'red'],
      ['mic:GND', 'bat:b', 'black'],
      ['mic:OUT', 'rb:a', 'yellow'],
      ['rb:b', 'q:B', 'yellow'],
      ['bat:a', 'lamp:a', 'red'],
      ['lamp:b', 'q:C', 'yellow'],
      ['q:E', 'bat:b', 'black'],
    ],
  },

  // ── boards and code ──

  // red, then green, then yellow, one second each
  trafficLight: join(
    { parts: [{ key: 'board', type: 'pico', x: 0, y: 0, data: program('pico', { GP13: 'step1', GP14: 'step3', GP15: 'step2' }) }], wires: [] },
    outputs('board', [
      { key: 'red', pin: 'GP13', type: 'led', color: 'red', ohms: 47, wire: 'white' },
      { key: 'yellow', pin: 'GP14', type: 'led', color: 'yellow', ohms: 47, wire: 'yellow' },
      { key: 'green', pin: 'GP15', type: 'led', color: 'green', ohms: 47, wire: 'green' },
    ]),
  ),
  // red and blue take turns while a buzzer with a siren chip wails, like a real police car
  policeLights: join(
    { parts: [{ key: 'board', type: 'nano', x: 0, y: 0, data: program('nano', { D8: 'blink', D10: 'blink2', D11: 'on' }) }], wires: [] },
    outputs('board', [
      { key: 'red', pin: 'D8', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'blue', pin: 'D10', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
      { key: 'siren', pin: 'D11', type: 'buzzer', sound: 'wail', ohms: 100, wire: 'yellow' },
    ]),
  ),
  // three lights chase each other, a fourth breathes, and the sign sparkles
  partyLights: join(
    {
      parts: [
        { key: 'board', type: 'mega', x: 0, y: 0, data: program('mega', { D10: 'step1', D11: 'step2', D12: 'step3', D13: 'fade' }) },
        { key: 'sign', type: 'matrix', ...ABOVE_BOARD, y: -210, data: (texts) => ({ cols: 4, rows: 1, tint: 'rainbow', effect: 'sparkle', speed: 0.6, text: texts.party || undefined }) },
      ],
      wires: [
        ['board:5V', 'sign:VCC', 'red'],
        ['sign:GND', 'board:GND', 'black'],
      ],
    },
    outputs('board', [
      { key: 'red', pin: 'D10', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'green', pin: 'D11', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'blue', pin: 'D12', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
      { key: 'gold', pin: 'D13', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
    ]),
  ),
  // red and green take turns, the gold star breathes; the Python program starts them at different times
  holidayLights: join(
    {
      parts: [
        { key: 'board', type: 'raspberrypi', x: 0, y: 0, data: program('raspberrypi', { GPIO22: 'fade', GPIO23: 'blink', GPIO24: 'blink2' }) },
        { key: 'sign', type: 'matrix', ...ABOVE_BOARD, y: -210, data: (texts) => ({ cols: 4, rows: 1, tint: 'rainbow', effect: 'sparkle', speed: 0.5, text: texts.holiday || undefined }) },
      ],
      wires: [
        ['board:3V3', 'sign:VCC', 'red'],
        ['sign:GND', 'board:GND', 'black'],
      ],
    },
    outputs('board', [
      { key: 'green', pin: 'GPIO24', type: 'led', color: 'green', ohms: 47, wire: 'green' },
      { key: 'red', pin: 'GPIO23', type: 'led', color: 'red', ohms: 47, wire: 'white' },
      { key: 'star', pin: 'GPIO22', type: 'led', color: 'yellow', ohms: 47, wire: 'yellow' },
    ]),
  ),
  // two red lights take turns and the gate (the servo) stays down
  railroad: join(
    {
      parts: [
        { key: 'board', type: 'arduino', x: 0, y: 0, data: program('arduino', { D13: 'on', D12: 'blink2', D8: 'blink' }) },
        { key: 'gate', type: 'servo', ...ABOVE_BOARD },
      ],
      wires: [
        ['board:5V', 'gate:VCC', 'red'],
        ['gate:GND', 'board:GND', 'black'],
        ['board:D13', 'gate:OUT', 'blue'],
      ],
    },
    outputs('board', [
      { key: 'left', pin: 'D8', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'right', pin: 'D12', type: 'led', color: 'red', ohms: 220, wire: 'white' },
    ]),
  ),

  // ── smart gadgets ──

  // the light sensor and 1 kΩ make a voltage that falls in the dark; the lights do the opposite
  nightLight: join(
    {
      parts: [
        { key: 'board', type: 'microbit', x: 0, y: 0, data: program('microbit', { P0: 'invert', P1: 'invert' }) },
        { key: 'ldr', type: 'ldr', x: -330, y: -230, rotation: 90, data: { light: 0.15 } },
        { key: 'div', type: 'resistor', x: -330, y: 30, rotation: 90, data: { resistance: 1000 } },
      ],
      wires: [
        ['board:3V3', 'ldr:a', 'red'],
        ['ldr:b', 'board:P2', 'yellow'],
        ['ldr:b', 'div:a', 'yellow'],
        ['div:b', 'board:GND', 'black'],
      ],
    },
    outputs(
      'board',
      [
        { key: 'lamp1', pin: 'P1', type: 'led', color: 'yellow', ohms: 47, wire: 'white' },
        { key: 'lamp2', pin: 'P0', type: 'led', color: 'yellow', ohms: 47, wire: 'yellow' },
      ],
      'div:b',
    ),
  ),
  // clean air: the green light. Smoke: the red light flashes and the buzzer beeps
  smokeAlarm: join(
    { parts: [{ key: 'board', type: 'arduino', x: 0, y: 0, data: program('arduino', { D8: 'invert', D12: 'alarm', D13: 'alarm' }) }], wires: [] },
    sensorFor('board', 'arduino', 'gasSensor', { sense: 0.1 }),
    outputs('board', [
      { key: 'safe', pin: 'D8', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'warn', pin: 'D12', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'siren', pin: 'D13', type: 'buzzer', ohms: 100, wire: 'blue' },
    ], 'sensor:GND'),
  ),
  // far: green. Closer: the red light grows and the beeps get faster
  parkingSensor: join(
    { parts: [{ key: 'board', type: 'nano', x: 0, y: 0, data: program('nano', { D8: 'invert', D9: 'follow', D13: 'alarm' }) }], wires: [] },
    sensorFor('board', 'nano', 'ultrasonic', { sense: 0.6 }),
    outputs('board', [
      { key: 'far', pin: 'D8', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'near', pin: 'D9', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'beeper', pin: 'D13', type: 'buzzer', ohms: 100, wire: 'blue' },
    ], 'sensor:GND'),
  ),
  // the screen shows how wet the soil is; red glows when the plant is thirsty
  plantAlarm: join(
    {
      parts: [
        { key: 'board', type: 'arduino', x: 0, y: 0, data: program('arduino', { D8: 'follow', D10: 'invert', D11: 'follow' }) },
        { key: 'screen', type: 'oled', ...ABOVE_BOARD, data: { mode: 'graph' } },
      ],
      wires: [
        ['board:5V', 'screen:VCC', 'red'],
        ['screen:GND', 'board:GND', 'black'],
        ['board:D11', 'screen:S', 'blue'],
      ],
    },
    sensorFor('board', 'arduino', 'soilSensor', { sense: 0.2 }),
    outputs('board', [
      { key: 'wet', pin: 'D8', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'dry', pin: 'D10', type: 'led', color: 'red', ohms: 220, wire: 'white' },
    ], 'sensor:GND'),
  ),
  // the hotter it gets, the more pin 2 lets through the transistor, the faster the fan.
  // The diode across the motor catches the kick it gives when it slows down
  smartFan: {
    parts: [
      { key: 'board', type: 'esp32', x: 0, y: 0, data: program('esp32', { G2: 'follow' }) },
      { key: 'temp', type: 'tempSensor', x: -330, y: 250, data: { sense: 0.85 } },
      { key: 'rb', type: 'resistor', x: 330, y: 0, data: { resistance: 470 } },
      { key: 'q', type: 'transistor', x: 590, y: 0 },
      { key: 'fan', type: 'motor', x: 640, y: -330, rotation: 90 },
      { key: 'd', type: 'diode', x: 880, y: -330, rotation: 270 },
    ],
    wires: [
      ['board:3V3', 'temp:VCC', 'red'],
      ['temp:GND', 'board:GND', 'black'],
      ['temp:OUT', 'board:G34', 'yellow'],
      ['board:G2', 'rb:a', 'blue'],
      ['rb:b', 'q:B', 'blue'],
      ['board:3V3', 'fan:a', 'red'],
      ['fan:a', 'd:b', 'red'],
      ['d:a', 'fan:b', 'yellow'],
      ['fan:b', 'q:C', 'yellow'],
      ['q:E', 'temp:GND', 'black'],
    ],
  },
  // someone comes: the door (the servo) swings open and the light turns green
  autoDoor: join(
    {
      parts: [
        { key: 'board', type: 'arduino', x: 0, y: 0, data: program('arduino', { D13: 'follow', D12: 'follow', D8: 'invert' }) },
        { key: 'door', type: 'servo', ...ABOVE_BOARD },
      ],
      wires: [
        ['board:5V', 'door:VCC', 'red'],
        ['door:GND', 'board:GND', 'black'],
        ['board:D13', 'door:OUT', 'blue'],
      ],
    },
    sensorFor('board', 'arduino', 'pir'),
    outputs('board', [
      { key: 'shut', pin: 'D8', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'open', pin: 'D12', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // the servo sweeps the sensor around; something close lights the red LED and starts the beeps
  radar: join(
    {
      parts: [
        { key: 'board', type: 'mega', x: 0, y: 0, data: program('mega', { D13: 'fade', D11: 'alarm', D10: 'follow' }) },
        { key: 'sweep', type: 'servo', ...ABOVE_BOARD },
      ],
      wires: [
        ['board:5V', 'sweep:VCC', 'red'],
        ['sweep:GND', 'board:GND', 'black'],
        ['board:D13', 'sweep:OUT', 'blue'],
      ],
    },
    sensorFor('board', 'mega', 'ultrasonic', { sense: 0.7 }),
    outputs('board', [
      { key: 'target', pin: 'D10', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'beeper', pin: 'D11', type: 'buzzer', ohms: 100, wire: 'yellow' },
    ], 'sensor:GND'),
  ),
  // the magnet on the door keeps the switch closed and A0 low. Open the door: A0 goes high
  doorAlarm: join(
    {
      parts: [
        { key: 'board', type: 'arduino', x: 0, y: 0, data: program('arduino', { D8: 'invert', D12: 'alarm', D13: 'alarm' }) },
        { key: 'pull', type: 'resistor', x: -330, y: -230, rotation: 90, data: { resistance: 1000 } },
        { key: 'reed', type: 'reed', x: -330, y: 30, rotation: 90, data: { sense: 1 } },
      ],
      wires: [
        ['board:5V', 'pull:a', 'red'],
        ['pull:b', 'board:A0', 'yellow'],
        ['pull:b', 'reed:a', 'yellow'],
        ['reed:b', 'board:GND', 'black'],
      ],
    },
    outputs(
      'board',
      [
        { key: 'safe', pin: 'D8', type: 'led', color: 'green', ohms: 220, wire: 'green' },
        { key: 'warn', pin: 'D12', type: 'led', color: 'red', ohms: 220, wire: 'white' },
        { key: 'siren', pin: 'D13', type: 'buzzer', ohms: 100, wire: 'blue' },
      ],
      'reed:b',
    ),
  ),
  // two boards: the Uno watches the door, the ESP32 keeps the room cool
  smartHome: join(
    {
      parts: [
        { key: 'board', type: 'arduino', x: 0, y: 0, data: program('arduino', { D12: 'follow', D13: 'alarm' }) },
        {
          key: 'screen',
          type: 'lcd',
          ...ABOVE_BOARD,
          data: (texts) => ({ cols: 16, rows: 2, tint: 'blue', text: texts.smartHome || undefined }),
        },
      ],
      wires: [
        ['board:5V', 'screen:VCC', 'red'],
        ['screen:GND', 'board:GND', 'black'],
      ],
    },
    sensorFor('board', 'arduino', 'pir'),
    outputs('board', [
      { key: 'porch', pin: 'D12', type: 'led', color: 'white', ohms: 100, wire: 'white' },
      { key: 'chime', pin: 'D13', type: 'buzzer', ohms: 100, wire: 'blue' },
    ], 'sensor:GND'),
    {
      parts: [
        { key: 'esp', type: 'esp32', x: 0, y: 880, data: program('esp32', { G2: 'follow' }) },
        { key: 'temp', type: 'tempSensor', x: -330, y: 1140, data: { sense: 0.8 } },
        { key: 'rb', type: 'resistor', x: 430, y: 880, data: { resistance: 470 } },
        { key: 'q', type: 'transistor', x: 750, y: 880 },
        { key: 'fan', type: 'motor', x: 1000, y: 600, rotation: 90 },
        { key: 'd', type: 'diode', x: 1240, y: 600, rotation: 270 },
      ],
      wires: [
        ['esp:3V3', 'temp:VCC', 'red'],
        ['temp:GND', 'esp:GND', 'black'],
        ['temp:OUT', 'esp:G34', 'yellow'],
        ['esp:G2', 'rb:a', 'blue'],
        ['rb:b', 'q:B', 'blue'],
        ['esp:3V3', 'fan:a', 'red'],
        ['fan:a', 'd:b', 'red'],
        ['d:a', 'fan:b', 'yellow'],
        ['fan:b', 'q:C', 'yellow'],
        ['q:E', 'temp:GND', 'black'],
      ],
    },
  ),

  // ── screens and signs ──

  // more heat, more volts on S: the numbers climb. The battery sits between the two
  // modules, + to the top one and − to the bottom one, with a short lane down each side
  thermometer: {
    parts: [
      { key: 'bat', type: 'battery', x: -520, y: -80, rotation: 270, data: { voltage: 4.5 } },
      { key: 'digits', type: 'segment', x: 0, y: -270, data: { digits: 4, mode: 'volts', tint: 'green' } },
      { key: 'temp', type: 'tempSensor', x: -170, y: 0, data: { sense: 0.55 } },
    ],
    wires: [
      ['bat:a', 'digits:VCC', 'red'],
      ['digits:VCC', 'temp:VCC', 'red'],
      ['digits:GND', 'temp:GND', 'black'],
      ['bat:b', 'temp:GND', 'black'],
      ['temp:OUT', 'digits:S', 'yellow'],
    ],
  },
  // the score on a big sign and a game clock, all from one battery
  scoreboard: {
    parts: [
      { key: 'bat', type: 'battery', x: -520, y: -80, rotation: 270, data: { voltage: 9 } },
      { key: 'clock', type: 'segment', x: 0, y: -270, data: { digits: 4, mode: 'counter', tint: 'yellow' } },
      {
        key: 'sign',
        type: 'matrix',
        x: -170,
        y: 0,
        data: (texts) => ({ cols: 6, rows: 2, tint: 'rainbow', effect: 'sparkle', speed: 0.5, brightness: 0.8, text: texts.score || undefined }),
      },
    ],
    wires: [
      ['bat:a', 'clock:VCC', 'red'],
      ['clock:VCC', 'sign:VCC', 'red'],
      ['clock:GND', 'sign:GND', 'black'],
      ['bat:b', 'sign:GND', 'black'],
    ],
  },
  // the screen always says hello; hold the button to ring
  doorbellScreen: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 150, rotation: 270, data: { voltage: 4.5 } },
      { key: 'btn', type: 'button', x: 290, y: -40 },
      { key: 'bell', type: 'buzzer', x: 580, y: 150, rotation: 90 },
      { key: 'screen', type: 'lcd', x: 300, y: 430, data: (texts) => ({ cols: 16, rows: 2, tint: 'blue', text: texts.doorbell || undefined }) },
    ],
    wires: [
      ['bat:a', 'btn:a', 'red'],
      ['btn:b', 'bell:a', 'yellow'],
      ['bell:b', 'bat:b', 'black'],
      ['btn:a', 'screen:VCC', 'red'],
      ['bat:b', 'screen:GND', 'black'],
    ],
  },
  // a bus stop board that runs on sunlight: the next buses and the time
  busStop: {
    parts: [
      { key: 'sun', type: 'solar', x: -520, y: -80, rotation: 270, data: { light: 1 } },
      { key: 'board', type: 'lcd', x: 0, y: -270, data: (texts) => ({ cols: 20, rows: 4, tint: 'green', text: texts.busStop || undefined }) },
      { key: 'clock', type: 'segment', x: -170, y: 0, data: { digits: 4, mode: 'clock', tint: 'red' } },
    ],
    wires: [
      ['sun:a', 'board:VCC', 'red'],
      ['board:VCC', 'clock:VCC', 'red'],
      ['board:GND', 'clock:GND', 'black'],
      ['sun:b', 'clock:GND', 'black'],
    ],
  },
  // a pocket TV: flip the switch to turn it on
  pocketTv: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 150, rotation: 270, data: { voltage: 4.5 } },
      { key: 'power', type: 'switch', x: 290, y: -40, data: { closed: true } },
      { key: 'tv', type: 'tft', x: 600, y: 120, data: { mode: 'demo', demo: 'fireworks' } },
    ],
    wires: [
      ['bat:a', 'power:a', 'red'],
      ['power:b', 'tv:VCC', 'red'],
      ['tv:GND', 'bat:b', 'black'],
    ],
  },

  // ── first circuits, second batch ──

  // one switch for the fan, one for the hot coil (the red lamp)
  hairDryer: ladder(battery(3), [
    { top: { key: 'fanSw', type: 'switch', data: { closed: true } }, bottom: { key: 'fan', type: 'motor' } },
    { top: { key: 'heatSw', type: 'switch', data: { closed: true } }, bottom: { key: 'heater', type: 'lamp', data: { color: 'red' } } },
  ]),
  // a switch for the light, a button for the bell
  bikeBell: ladder(battery(3), [
    { top: { key: 'lightSw', type: 'switch', data: { closed: true } }, bottom: { key: 'light', type: 'lamp' } },
    { top: { key: 'bell', type: 'button' }, bottom: { key: 'ring', type: 'buzzer' } },
  ]),
  // one switch for all four lights: white at the front, red at the back
  carLights: ladder(
    battery(4.5),
    [
      { top: { key: 'headLR', type: 'resistor', data: { resistance: 100 } }, bottom: { key: 'headL', type: 'led', data: { color: 'white' } } },
      { top: { key: 'headRR', type: 'resistor', data: { resistance: 100 } }, bottom: { key: 'headR', type: 'led', data: { color: 'white' } } },
      { top: { key: 'tailLR', type: 'resistor', data: { resistance: 220 } }, bottom: { key: 'tailL', type: 'led', data: { color: 'red' } } },
      { top: { key: 'tailRR', type: 'resistor', data: { resistance: 220 } }, bottom: { key: 'tailR', type: 'led', data: { color: 'red' } } },
    ],
    { key: 'sw', type: 'switch', data: { closed: true } },
  ),
  // the key beeps and blinks together; the screen keeps the code for SOS handy
  morseKey: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 160, rotation: 270, data: { voltage: 4.5 } },
      { key: 'key', type: 'button', x: 270, y: -60 },
      { key: 'beep', type: 'buzzer', x: 560, y: 160, rotation: 90 },
      { key: 'r', type: 'resistor', x: 800, y: -60, data: { resistance: 220 } },
      { key: 'flash', type: 'led', x: 1090, y: 160, rotation: 90, data: { color: 'yellow' } },
      { key: 'card', type: 'lcd', x: 250, y: -330, data: { cols: 16, rows: 2, tint: 'blue', text: 'SOS\n...  ---  ...' } },
    ],
    wires: [
      ['bat:a', 'key:a', 'red'],
      ['key:b', 'beep:a', 'yellow'],
      ['beep:a', 'r:a', 'yellow'],
      ['r:b', 'flash:a', 'yellow'],
      ['flash:b', 'beep:b', 'black'],
      ['beep:b', 'bat:b', 'black'],
      ['bat:a', 'card:VCC', 'red'],
      ['card:GND', 'bat:b', 'black'],
    ],
  },

  // ── electronics, second batch ──

  // the knob is a resistor you can turn: less resistance, a brighter LED. The 100 Ω keeps it safe at the end
  knobDimmer: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 160, rotation: 270, data: { voltage: 4.5 } },
      { key: 'r', type: 'resistor', x: 270, y: -60, data: { resistance: 100 } },
      { key: 'knob', type: 'potentiometer', x: 560, y: -60, data: { level: 0.8 } },
      { key: 'led', type: 'led', x: 850, y: 160, rotation: 90, data: { color: 'green' } },
    ],
    wires: [
      ['bat:a', 'r:a', 'red'],
      ['r:b', 'knob:A', 'yellow'],
      ['knob:W', 'led:a', 'yellow'],
      ['led:b', 'bat:b', 'black'],
    ],
  },
  // two lamps, two diodes: the one pointing the right way lets the power through
  diodeCheck: ladder(battery(3), [
    { top: { key: 'open', type: 'diode' }, bottom: { key: 'lit', type: 'lamp' } },
    { top: { key: 'shut', type: 'diode', rotation: 270 }, bottom: { key: 'dark', type: 'lamp' } },
  ]),
  // the small switch powers the relay's coil; the relay's own switch runs the lamp on its own battery
  relayLamp: {
    parts: [
      { key: 'coilBat', type: 'battery', x: 0, y: 160, rotation: 270, data: { voltage: 4.5 } },
      { key: 'sw', type: 'switch', x: 270, y: -60, data: { closed: true } },
      { key: 'relay', type: 'relay', x: 560, y: 160 },
      { key: 'lamp', type: 'lamp', x: 850, y: -60 },
      { key: 'lampBat', type: 'battery', x: 1140, y: 160, rotation: 270, data: { voltage: 3 } },
    ],
    wires: [
      ['coilBat:a', 'sw:a', 'red'],
      ['sw:b', 'relay:a', 'yellow'],
      ['relay:b', 'coilBat:b', 'black'],
      ['relay:COM', 'lamp:a', 'yellow'],
      ['lamp:b', 'lampBat:a', 'red'],
      ['lampBat:b', 'relay:NO', 'black'],
    ],
  },
  // flip the switch: it joins both ends of the lamp, and the supply just holds the current at its limit
  safeShort: {
    parts: [
      { key: 'ps', type: 'powerSupply', x: -40, y: -60, data: { voltage: 3, limit: 0.5 } },
      { key: 'amm', type: 'ammeter', x: 270, y: -60 },
      { key: 'lamp', type: 'lamp', x: 560, y: 160, rotation: 90 },
      { key: 'sw', type: 'switch', x: 800, y: 160, rotation: 90, data: { closed: false } },
    ],
    wires: [
      ['ps:a', 'amm:a', 'red'],
      ['amm:b', 'lamp:a', 'yellow'],
      ['lamp:a', 'sw:a', 'yellow'],
      ['sw:b', 'lamp:b', 'black'],
      ['lamp:b', 'ps:b', 'black'],
    ],
  },
  // 9 V in, a steady 5 V out for the phone, like a USB charger
  phoneCharger: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 160, rotation: 270, data: { voltage: 9 } },
      { key: 'reg', type: 'regulator', x: 270, y: 160 },
      { key: 'vm', type: 'voltmeter', x: 560, y: 160, rotation: 90 },
      { key: 'phone', type: 'tft', x: 820, y: 132, data: (texts) => ({ mode: 'text', text: texts.charging || undefined }) },
    ],
    wires: [
      ['bat:a', 'reg:IN', 'red'],
      ['reg:GND', 'bat:b', 'black'],
      ['reg:OUT', 'vm:a', 'red'],
      ['vm:b', 'reg:GND', 'black'],
      ['vm:a', 'phone:VCC', 'red'],
      ['phone:GND', 'vm:b', 'black'],
    ],
  },
  // the switch fills the big capacitor; switch off and it keeps the transistor (and the lamp) on for a while
  delayLight: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 160, rotation: 270, data: { voltage: 3 } },
      { key: 'sw', type: 'switch', x: 270, y: -60, data: { closed: true } },
      { key: 'cap', type: 'capacitor', x: 560, y: 160, rotation: 90, data: { capacitance: 10000 } },
      { key: 'rb', type: 'resistor', x: 800, y: 160, data: { resistance: 1000 } },
      { key: 'q', type: 'transistor', x: 1090, y: 160 },
      { key: 'lamp', type: 'lamp', x: 1140, y: -170, rotation: 90 },
    ],
    wires: [
      ['bat:a', 'sw:a', 'red'],
      ['sw:b', 'cap:a', 'red'],
      ['cap:b', 'bat:b', 'black'],
      ['cap:a', 'rb:a', 'yellow'],
      ['rb:b', 'q:B', 'yellow'],
      ['bat:a', 'lamp:a', 'red'],
      ['lamp:b', 'q:C', 'yellow'],
      ['q:E', 'cap:b', 'black'],
    ],
  },

  // ── science lab ──

  // the knob shares out the battery's volts; the oscilloscope draws them as a line
  scopeKnob: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 160, rotation: 270, data: { voltage: 4.5 } },
      { key: 'knob', type: 'potentiometer', x: 270, y: 160, data: { level: 0.6 } },
      { key: 'scope', type: 'oscilloscope', x: 560, y: 160, data: { span: 10 } },
    ],
    wires: [
      ['bat:a', 'knob:A', 'red'],
      ['knob:B', 'bat:b', 'black'],
      ['knob:W', 'scope:a', 'yellow'],
      ['scope:b', 'knob:B', 'black'],
    ],
  },
  // more light, less resistance in the sensor, more volts on the meter
  lightMeter: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 160, rotation: 270, data: { voltage: 4.5 } },
      { key: 'ldr', type: 'ldr', x: 270, y: -60, data: { light: 0.6 } },
      { key: 'r', type: 'resistor', x: 560, y: 160, rotation: 90, data: { resistance: 1000 } },
      { key: 'vm', type: 'voltmeter', x: 800, y: 160, rotation: 90 },
    ],
    wires: [
      ['bat:a', 'ldr:a', 'red'],
      ['ldr:b', 'r:a', 'yellow'],
      ['r:b', 'bat:b', 'black'],
      ['r:a', 'vm:a', 'yellow'],
      ['vm:b', 'r:b', 'black'],
    ],
  },
  // the voltmeter reads the panel, the ammeter the current it gives the LED
  solarMeter: {
    parts: [
      { key: 'sun', type: 'solar', x: 0, y: 160, rotation: 270, data: { light: 0.8 } },
      { key: 'vm', type: 'voltmeter', x: 240, y: 160, rotation: 90 },
      { key: 'amm', type: 'ammeter', x: 480, y: -60 },
      { key: 'r', type: 'resistor', x: 770, y: -60, data: { resistance: 220 } },
      { key: 'led', type: 'led', x: 1060, y: 160, rotation: 90, data: { color: 'green' } },
    ],
    wires: [
      ['sun:a', 'vm:a', 'red'],
      ['vm:a', 'amm:a', 'red'],
      ['amm:b', 'r:a', 'yellow'],
      ['r:b', 'led:a', 'yellow'],
      ['led:b', 'vm:b', 'black'],
      ['vm:b', 'sun:b', 'black'],
    ],
  },
  // 1 kΩ: every volt more on the supply gives one milliamp more
  ohmsLaw: {
    parts: [
      { key: 'ps', type: 'powerSupply', x: -40, y: -60, data: { voltage: 6, limit: 0.5 } },
      { key: 'amm', type: 'ammeter', x: 270, y: -60 },
      { key: 'r', type: 'resistor', x: 560, y: 160, rotation: 90, data: { resistance: 1000 } },
      { key: 'vm', type: 'voltmeter', x: 800, y: 160, rotation: 90 },
    ],
    wires: [
      ['ps:a', 'amm:a', 'red'],
      ['amm:b', 'r:a', 'yellow'],
      ['r:b', 'ps:b', 'black'],
      ['r:a', 'vm:a', 'yellow'],
      ['vm:b', 'r:b', 'black'],
    ],
  },
  // more current, a stronger magnet; the supply's limit stops it before it gets hot
  magnetLab: {
    parts: [
      { key: 'ps', type: 'powerSupply', x: -40, y: -60, data: { voltage: 3, limit: 0.5 } },
      { key: 'amm', type: 'ammeter', x: 270, y: -60 },
      { key: 'magnet', type: 'electromagnet', x: 560, y: 160, rotation: 90 },
    ],
    wires: [
      ['ps:a', 'amm:a', 'red'],
      ['amm:b', 'magnet:a', 'yellow'],
      ['magnet:b', 'ps:b', 'black'],
    ],
  },
  // the 555 turns its output on and off; the oscilloscope draws the square wave
  scopeSquare: join(
    chipOn({ key: 'timer', type: 'timer555', data: { rate: 1 } }, battery(9)),
    {
      parts: [{ key: 'scope', type: 'oscilloscope', x: 290, y: 0, data: { span: 5 } }],
      wires: [
        ['timer:OUT', 'scope:a', 'yellow'],
        ['scope:b', 'bat:b', 'black'],
      ],
    },
    branches([{ key: 'led', from: 'timer:OUT', type: 'led', color: 'red', ohms: 470, wire: 'yellow' }], 'bat:b', 290),
  ),
  // the capacitor fills up through 1 kΩ, quickly at first, then slower and slower
  scopeCap: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 160, rotation: 270, data: { voltage: 4.5 } },
      { key: 'sw', type: 'switch', x: 270, y: -60, data: { closed: true } },
      { key: 'r', type: 'resistor', x: 560, y: -60, data: { resistance: 1000 } },
      { key: 'cap', type: 'capacitor', x: 850, y: 160, rotation: 90, data: { capacitance: 2200 } },
      { key: 'scope', type: 'oscilloscope', x: 1090, y: 160, data: { span: 10 } },
      { key: 'drainR', type: 'resistor', x: 1090, y: -270, data: { resistance: 100 } },
      { key: 'drain', type: 'button', x: 1380, y: -60, rotation: 90 },
    ],
    wires: [
      ['bat:a', 'sw:a', 'red'],
      ['sw:b', 'r:a', 'red'],
      ['r:b', 'cap:a', 'yellow'],
      ['cap:b', 'bat:b', 'black'],
      ['cap:a', 'scope:a', 'yellow'],
      ['scope:b', 'cap:b', 'black'],
      ['cap:a', 'drainR:a', 'yellow'],
      ['drainR:b', 'drain:a', 'yellow'],
      ['drain:b', 'scope:b', 'black'],
    ],
  },
  // the fading pin rises and falls; the oscilloscope draws it as a smooth wave
  scopeBreath: join(
    {
      parts: [
        { key: 'board', type: 'arduino', x: 0, y: 0, data: program('arduino', { D9: 'fade' }) },
        { key: 'scope', type: 'oscilloscope', ...ABOVE_BOARD, data: { span: 5 } },
      ],
      wires: [
        ['board:D9', 'scope:a', 'yellow'],
        ['scope:b', 'board:GND', 'black'],
      ],
    },
    outputs('board', [{ key: 'led', pin: 'D9', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' }]),
  ),

  // ── logic and chips ──

  // HIGH: the right light; LOW: the light above. They take turns, once a second
  flasher555: join(
    chipOn({ key: 'timer', type: 'timer555', data: { rate: 1 } }, battery(9)),
    chipLights(
      'timer:OUT',
      'bat:a',
      'bat:b',
      { key: 'right', type: 'led', data: { color: 'red' }, ohms: 470 },
      { key: 'left', type: 'led', data: { color: 'red' }, ohms: 470 },
    ),
  ),
  // the light sensor and 1 kΩ make a voltage that drops in the dark; NOT turns that into "light on"
  darkLamp: join(
    chipOn({ key: 'not', type: 'notGate' }, battery(4.5), { x: -620, y: 0 }),
    {
      parts: [
        { key: 'ldr', type: 'ldr', ...INPUT_A, data: { light: 0.2 } },
        { key: 'div', type: 'resistor', ...INPUT_B, rotation: 90, data: { resistance: 1000 } },
      ],
      wires: [
        ['bat:a', 'ldr:a', 'red'],
        ['ldr:b', 'not:A', 'yellow'],
        ['not:A', 'div:a', 'yellow'],
        ['div:b', 'bat:b', 'black'],
      ],
    },
    chipLights('not:Y', 'bat:a', 'bat:b', { key: 'lamp', type: 'led', data: { color: 'yellow' }, ohms: 100 }),
  ),
  // XOR: the light is on when the two switches disagree, so either one can change it
  stairLight: join(
    chipOn({ key: 'xor', type: 'xorGate' }, battery(4.5), { x: -620, y: 0 }),
    gateInputs('xor', 'bat:a', { key: 'up', type: 'switch', data: { closed: true } }, { key: 'down', type: 'switch', data: { closed: false } }),
    chipLights('xor:Y', 'bat:a', 'bat:b', { key: 'lamp', type: 'led', data: { color: 'white' }, ohms: 47 }),
  ),
  // AND: only both buttons together open it. Red (locked) is lit while the output is LOW
  safeLock: join(
    chipOn({ key: 'and', type: 'andGate' }, battery(4.5), { x: -620, y: 0 }),
    gateInputs('and', 'bat:a', { key: 'keyA', type: 'button' }, { key: 'keyB', type: 'button' }),
    chipLights(
      'and:Y',
      'bat:a',
      'bat:b',
      { key: 'open', type: 'led', data: { color: 'green' }, ohms: 220 },
      { key: 'locked', type: 'led', data: { color: 'red' }, ohms: 220 },
    ),
  ),
  // OR: either button rings the bell. The green light waits, and goes out while it rings
  twoDoors: join(
    chipOn({ key: 'or', type: 'orGate' }, battery(4.5), { x: -620, y: 0 }),
    gateInputs('or', 'bat:a', { key: 'front', type: 'button' }, { key: 'back', type: 'button' }),
    chipLights(
      'or:Y',
      'bat:a',
      'bat:b',
      { key: 'bell', type: 'buzzer', ohms: 10 },
      { key: 'ready', type: 'led', data: { color: 'green' }, ohms: 220 },
    ),
  ),
  // XOR gives the ones (1 + 1 = 0, carry one), AND gives the carry: 1 + 1 = 10 in binary
  halfAdder: {
    parts: [
      { key: 'bat', type: 'battery', x: -620, y: 0, rotation: 270, data: { voltage: 4.5 } },
      { key: 'a', type: 'switch', ...INPUT_A, data: { closed: true } },
      { key: 'b', type: 'switch', ...INPUT_B, data: { closed: true } },
      { key: 'xor', type: 'xorGate', x: 0, y: -230 },
      { key: 'and', type: 'andGate', x: 0, y: 230 },
      { key: 'sumR', type: 'resistor', x: 290, y: -230, data: { resistance: 220 } },
      { key: 'sum', type: 'led', x: 560, y: -230, rotation: 90, data: { color: 'yellow' } },
      { key: 'carryR', type: 'resistor', x: 290, y: 230, data: { resistance: 220 } },
      { key: 'carry', type: 'led', x: 560, y: 230, rotation: 90, data: { color: 'yellow' } },
    ],
    wires: [
      ['bat:a', 'a:a', 'red'],
      ['bat:a', 'b:a', 'red'],
      ['bat:a', 'xor:VCC', 'red'],
      ['xor:VCC', 'and:VCC', 'red'],
      ['xor:GND', 'and:GND', 'black'],
      ['and:GND', 'bat:b', 'black'],
      ['a:b', 'xor:A', 'yellow'],
      ['a:b', 'and:A', 'yellow'],
      ['b:b', 'xor:B', 'blue'],
      ['b:b', 'and:B', 'blue'],
      ['xor:Y', 'sumR:a', 'yellow'],
      ['sumR:b', 'sum:a', 'yellow'],
      ['sum:b', 'carry:b', 'black'],
      ['and:Y', 'carryR:a', 'yellow'],
      ['carryR:b', 'carry:a', 'yellow'],
      ['carry:b', 'and:GND', 'black'],
    ],
  },
  // the 555 beats; NOT turns "belt open" into HIGH; AND lets the beats through only then
  seatbelt: join(
    {
      parts: [
        { key: 'bat', type: 'battery', x: -910, y: 0, rotation: 270, data: { voltage: 9 } },
        { key: 'timer', type: 'timer555', x: -620, y: -230, data: { rate: 2 } },
        { key: 'belt', type: 'switch', x: -620, y: 230, data: { closed: false } },
        { key: 'not', type: 'notGate', x: -330, y: 230 },
        { key: 'and', type: 'andGate', x: 0, y: 0 },
      ],
      wires: [
        ['bat:a', 'timer:VCC', 'red'],
        ['bat:a', 'belt:a', 'red'],
        ['bat:a', 'and:VCC', 'red'],
        ['and:VCC', 'not:VCC', 'red'],
        ['timer:GND', 'bat:b', 'black'],
        ['not:GND', 'bat:b', 'black'],
        ['and:GND', 'not:GND', 'black'],
        ['belt:b', 'not:A', 'yellow'],
        ['timer:OUT', 'and:A', 'blue'],
        ['not:Y', 'and:B', 'yellow'],
      ],
    },
    branches(
      [
        { key: 'beep', from: 'and:Y', type: 'buzzer', ohms: 47, wire: 'yellow' },
        { key: 'warn', from: 'and:Y', type: 'led', color: 'red', ohms: 470, wire: 'yellow' },
      ],
      'and:GND',
      290,
    ),
  ),

  // ── boards and code, second batch ──

  // six fireflies, each with its own rhythm
  fireflies: join(
    {
      parts: [
        {
          key: 'board',
          type: 'pico',
          x: 0,
          y: 0,
          data: program('pico', { GP10: 'fade', GP11: 'step1', GP12: 'blink', GP13: 'step2', GP14: 'blink2', GP15: 'step3' }),
        },
      ],
      wires: [],
    },
    outputs('board', [
      { key: 'fly1', pin: 'GP10', type: 'led', color: 'yellow', ohms: 47, wire: 'yellow' },
      { key: 'fly2', pin: 'GP11', type: 'led', color: 'green', ohms: 47, wire: 'green' },
      { key: 'fly3', pin: 'GP12', type: 'led', color: 'yellow', ohms: 47, wire: 'yellow' },
      { key: 'fly4', pin: 'GP13', type: 'led', color: 'green', ohms: 47, wire: 'green' },
      { key: 'fly5', pin: 'GP14', type: 'led', color: 'yellow', ohms: 47, wire: 'yellow' },
      { key: 'fly6', pin: 'GP15', type: 'led', color: 'green', ohms: 47, wire: 'green' },
    ]),
  ),
  // step 1, 2, 3 and again: the light runs along the row
  chaser: join(
    {
      parts: [
        {
          key: 'board',
          type: 'esp32',
          x: 0,
          y: 0,
          data: program('esp32', { G21: 'step1', G19: 'step2', G18: 'step3', G5: 'step1', G4: 'step2', G2: 'step3' }),
        },
      ],
      wires: [],
    },
    outputs('board', [
      { key: 'l1', pin: 'G21', type: 'led', color: 'red', ohms: 47, wire: 'white' },
      { key: 'l2', pin: 'G19', type: 'led', color: 'red', ohms: 47, wire: 'white' },
      { key: 'l3', pin: 'G18', type: 'led', color: 'red', ohms: 47, wire: 'white' },
      { key: 'l4', pin: 'G5', type: 'led', color: 'red', ohms: 47, wire: 'white' },
      { key: 'l5', pin: 'G4', type: 'led', color: 'red', ohms: 47, wire: 'white' },
      { key: 'l6', pin: 'G2', type: 'led', color: 'red', ohms: 47, wire: 'white' },
    ]),
  ),

  // ── smart gadgets, second batch ──

  // dry: green. The first drops: the blue light and the beeps
  rainAlert: join(
    { parts: [{ key: 'board', type: 'nano', x: 0, y: 0, data: program('nano', { D8: 'invert', D12: 'follow', D13: 'alarm' }) }], wires: [] },
    sensorFor('board', 'nano', 'soilSensor', { sense: 0.05 }),
    outputs('board', [
      { key: 'dry', pin: 'D8', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'rain', pin: 'D12', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
      { key: 'beeper', pin: 'D13', type: 'buzzer', ohms: 100, wire: 'yellow' },
    ], 'sensor:GND'),
  ),
  // the beam keeps the light sensor bright and A0 low; step through it and A0 goes high
  laserAlarm: join(
    {
      parts: [
        { key: 'board', type: 'arduino', x: 0, y: 0, data: program('arduino', { D8: 'invert', D12: 'alarm', D13: 'alarm' }) },
        { key: 'pull', type: 'resistor', x: -330, y: -230, rotation: 90, data: { resistance: 1000 } },
        { key: 'beam', type: 'ldr', x: -330, y: 30, rotation: 90, data: { light: 1 } },
      ],
      wires: [
        ['board:5V', 'pull:a', 'red'],
        ['pull:b', 'board:A0', 'yellow'],
        ['pull:b', 'beam:a', 'yellow'],
        ['beam:b', 'board:GND', 'black'],
      ],
    },
    outputs(
      'board',
      [
        { key: 'safe', pin: 'D8', type: 'led', color: 'green', ohms: 220, wire: 'green' },
        { key: 'warn', pin: 'D12', type: 'led', color: 'red', ohms: 220, wire: 'white' },
        { key: 'siren', pin: 'D13', type: 'buzzer', sound: 'yelp', ohms: 100, wire: 'blue' },
      ],
      'beam:b',
    ),
  ),
  // quiet: green. Crying: red and beeps
  babyMonitor: join(
    {
      parts: [
        { key: 'board', type: 'arduino', x: 0, y: 0, data: program('arduino', { D8: 'invert', D12: 'alarm', D13: 'alarm' }) },
        { key: 'screen', type: 'lcd', ...ABOVE_BOARD, data: (texts) => ({ cols: 16, rows: 2, tint: 'blue', text: texts.baby || undefined }) },
      ],
      wires: [
        ['board:5V', 'screen:VCC', 'red'],
        ['screen:GND', 'board:GND', 'black'],
      ],
    },
    sensorFor('board', 'arduino', 'soundSensor', { sense: 0.1 }),
    outputs('board', [
      { key: 'calm', pin: 'D8', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'cry', pin: 'D12', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'beeper', pin: 'D13', type: 'buzzer', ohms: 100, wire: 'blue' },
    ], 'sensor:GND'),
  ),
  // dry soil: the pump (a motor on its own battery) runs through the transistor; wet soil: it rests.
  // The top pin drives the pump, so no wire crosses another
  greenhouse: join(
    {
      parts: [
        { key: 'board', type: 'arduino', x: 0, y: 0, data: program('arduino', { D8: 'invert', D12: 'follow', D13: 'invert' }) },
        { key: 'rb', type: 'resistor', x: 330, y: -250, data: { resistance: 1000 } },
        { key: 'q', type: 'transistor', x: 620, y: -250 },
        { key: 'pump', type: 'motor', x: 870, y: -520, rotation: 90 },
        { key: 'pumpBat', type: 'battery', x: 1110, y: -520, rotation: 270, data: { voltage: 3 } },
      ],
      wires: [
        ['board:D13', 'rb:a', 'blue'],
        ['rb:b', 'q:B', 'blue'],
        ['pumpBat:a', 'pump:a', 'red'],
        ['pump:b', 'q:C', 'yellow'],
        ['q:E', 'pumpBat:b', 'black'],
        ['pumpBat:b', 'happy:b', 'black'],
      ],
    },
    sensorFor('board', 'arduino', 'soilSensor', { sense: 0.25 }),
    outputs('board', [
      { key: 'thirsty', pin: 'D8', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'happy', pin: 'D12', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),

  // ── sound and music ──

  // three keys, three notes: low, middle and high; the red light says the piano is on
  piano: ladder(battery(3), [
    { top: { key: 'powerR', type: 'resistor', data: { resistance: 47 } }, bottom: { key: 'power', type: 'led', data: { color: 'red' } } },
    { top: { key: 'key1', type: 'button' }, bottom: { key: 'low', type: 'speaker', data: { pitch: 262 } } },
    { top: { key: 'key2', type: 'button' }, bottom: { key: 'mid', type: 'speaker', data: { pitch: 523 } } },
    { top: { key: 'key3', type: 'button' }, bottom: { key: 'high', type: 'speaker', data: { pitch: 1047 } } },
  ]),
  // the 555 ticks: a beep and a flash on every beat
  metronome: join(
    chipOn({ key: 'timer', type: 'timer555', data: { rate: 1 } }, battery(9)),
    branches(
      [
        { key: 'tick', from: 'timer:OUT', type: 'buzzer', ohms: 100, wire: 'yellow' },
        { key: 'beat', from: 'timer:OUT', type: 'led', color: 'green', ohms: 470, wire: 'yellow' },
      ],
      'bat:b',
      290,
    ),
  ),
  // HIGH plays the high speaker, LOW the low one: nee-naw, nee-naw
  siren: join(
    chipOn({ key: 'timer', type: 'timer555', data: { rate: 2 } }, { key: 'ps', type: 'powerSupply', data: { voltage: 6, limit: 0.5 } }, { x: -330, y: -300 }),
    chipLights(
      'timer:OUT',
      'ps:a',
      'timer:GND',
      { key: 'nee', type: 'speaker', data: { pitch: 1047 }, ohms: 47 },
      { key: 'naw', type: 'speaker', data: { pitch: 523 }, ohms: 47 },
    ),
  ),
  // three pins take turns, so the three notes play one after another; the light breathes along
  musicBox: join(
    { parts: [{ key: 'board', type: 'arduino', x: 0, y: 0, data: program('arduino', { D9: 'fade', D11: 'step3', D12: 'step2', D13: 'step1' }) }], wires: [] },
    outputs('board', [
      { key: 'glow', pin: 'D9', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
      { key: 'high', pin: 'D11', type: 'speaker', pitch: 1047, ohms: 100, wire: 'white' },
      { key: 'mid', pin: 'D12', type: 'speaker', pitch: 523, ohms: 100, wire: 'white' },
      { key: 'low', pin: 'D13', type: 'speaker', pitch: 262, ohms: 100, wire: 'white' },
    ]),
  ),
  // at night the blue light glows; when the sun comes up the bird sings, faster in brighter light
  morningBird: join(
    {
      parts: [
        { key: 'board', type: 'arduino', x: 0, y: 0, data: program('arduino', { D8: 'invert', D13: 'alarm' }) },
        { key: 'ldr', type: 'ldr', x: -330, y: -230, rotation: 90, data: { light: 0.15 } },
        { key: 'div', type: 'resistor', x: -330, y: 30, rotation: 90, data: { resistance: 1000 } },
      ],
      wires: [
        ['board:5V', 'ldr:a', 'red'],
        ['ldr:b', 'board:A0', 'yellow'],
        ['ldr:b', 'div:a', 'yellow'],
        ['div:b', 'board:GND', 'black'],
      ],
    },
    outputs(
      'board',
      [
        { key: 'moon', pin: 'D8', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
        { key: 'bird', pin: 'D13', type: 'speaker', pitch: 1047, ohms: 100, wire: 'white' },
      ],
      'div:b',
    ),
  ),
  // red and white take turns while the siren on the steady pin goes hi-lo without a break
  ambulance: join(
    { parts: [{ key: 'board', type: 'nano', x: 0, y: 0, data: program('nano', { D8: 'blink', D10: 'blink2', D12: 'on' }) }], wires: [] },
    outputs('board', [
      { key: 'red', pin: 'D8', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'white', pin: 'D10', type: 'led', color: 'white', ohms: 100, wire: 'white' },
      { key: 'siren', pin: 'D12', type: 'buzzer', sound: 'hilo', ohms: 100, wire: 'yellow' },
    ]),
  ),
  // press: "ding" on the high speaker while the diode fills the capacitor.
  // Let go: the capacitor empties into the low speaker, "dong"
  dingDong: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 160, rotation: 270, data: { voltage: 3 } },
      { key: 'powerR', type: 'resistor', x: 270, y: 0, rotation: 90, data: { resistance: 47 } },
      { key: 'power', type: 'led', x: 270, y: 240, rotation: 90, data: { color: 'red' } },
      { key: 'press', type: 'button', x: 520, y: -260 },
      { key: 'ding', type: 'speaker', x: 560, y: 160, rotation: 90, data: { pitch: 1047 } },
      { key: 'd', type: 'diode', x: 800, y: -60 },
      { key: 'cap', type: 'capacitor', x: 1090, y: 160, rotation: 90, data: { capacitance: 10000 } },
      { key: 'r', type: 'resistor', x: 1330, y: -60, data: { resistance: 10 } },
      { key: 'dong', type: 'speaker', x: 1620, y: 160, rotation: 90, data: { pitch: 262 } },
    ],
    wires: [
      ['bat:a', 'powerR:a', 'red'],
      ['powerR:b', 'power:a', 'yellow'],
      ['power:b', 'bat:b', 'black'],
      ['powerR:a', 'press:a', 'red'],
      ['press:b', 'ding:a', 'yellow'],
      ['ding:b', 'power:b', 'black'],
      ['ding:a', 'd:a', 'yellow'],
      ['d:b', 'cap:a', 'yellow'],
      ['cap:b', 'ding:b', 'black'],
      ['cap:a', 'r:a', 'yellow'],
      ['r:b', 'dong:a', 'yellow'],
      ['dong:b', 'cap:b', 'black'],
    ],
  },

  // ── motion and robots ──

  // a switch and a little shaking motor
  toothbrush: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 150, rotation: 270, data: { voltage: 3 } },
      { key: 'sw', type: 'switch', x: 290, y: -40, data: { closed: true } },
      { key: 'brush', type: 'vibration', x: 580, y: 150, rotation: 90 },
    ],
    wires: [
      ['bat:a', 'sw:a', 'red'],
      ['sw:b', 'brush:a', 'yellow'],
      ['brush:b', 'bat:b', 'black'],
    ],
  },
  // one switch holds the steel with the magnet, the other runs the winch that lifts it
  crane: ladder(battery(3), [
    { top: { key: 'magnetSw', type: 'switch', data: { closed: true } }, bottom: { key: 'magnet', type: 'electromagnet' } },
    { top: { key: 'winchSw', type: 'switch', data: { closed: false } }, bottom: { key: 'winch', type: 'motor' } },
  ]),
  // the knob sets the volts on B, the transistor lets that much current through the motor
  fanKnob: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 160, rotation: 270, data: { voltage: 4.5 } },
      { key: 'knob', type: 'potentiometer', x: 270, y: 160, data: { level: 0.75 } },
      { key: 'rb', type: 'resistor', x: 560, y: 160, data: { resistance: 470 } },
      { key: 'q', type: 'transistor', x: 850, y: 160 },
      { key: 'fan', type: 'motor', x: 900, y: -170, rotation: 90 },
    ],
    wires: [
      ['bat:a', 'knob:A', 'red'],
      ['knob:B', 'bat:b', 'black'],
      ['knob:W', 'rb:a', 'yellow'],
      ['rb:b', 'q:B', 'yellow'],
      ['bat:a', 'fan:a', 'red'],
      ['fan:b', 'q:C', 'yellow'],
      ['q:E', 'knob:B', 'black'],
    ],
  },
  // each knob gives its servo a voltage, and the servo turns to match it. Each servo sits just above its knob
  robotArm: {
    parts: [
      { key: 'ps', type: 'powerSupply', x: -330, y: 120, data: { voltage: 5, limit: 1 } },
      { key: 'arm', type: 'servo', x: 0, y: -230 },
      { key: 'knob1', type: 'potentiometer', x: 0, y: 0, data: { level: 0.3 } },
      { key: 'claw', type: 'servo', x: 0, y: 260 },
      { key: 'knob2', type: 'potentiometer', x: 0, y: 490, data: { level: 0.7 } },
    ],
    wires: [
      ['ps:a', 'arm:VCC', 'red'],
      ['ps:a', 'knob1:A', 'red'],
      ['ps:a', 'claw:VCC', 'red'],
      ['ps:a', 'knob2:A', 'red'],
      ['arm:GND', 'ps:b', 'black'],
      ['knob1:B', 'ps:b', 'black'],
      ['claw:GND', 'ps:b', 'black'],
      ['knob2:B', 'ps:b', 'black'],
      ['knob1:W', 'arm:OUT', 'yellow'],
      ['knob2:W', 'claw:OUT', 'blue'],
    ],
  },
  // the regulator gives 5 V; the 555 switches the shaking motor on and off while the screen shows the call
  phoneBuzz: {
    parts: [
      { key: 'bat', type: 'battery', x: -620, y: 0, rotation: 270, data: { voltage: 9 } },
      { key: 'reg', type: 'regulator', x: -330, y: 0 },
      { key: 'timer', type: 'timer555', x: 0, y: 0, data: { rate: 2 } },
      { key: 'r', type: 'resistor', x: 290, y: 0, data: { resistance: 10 } },
      { key: 'buzz', type: 'vibration', x: 560, y: 0, rotation: 90 },
      { key: 'screen', type: 'tft', x: -40, y: 260, data: (texts) => ({ mode: 'text', text: texts.calling || undefined }) },
    ],
    wires: [
      ['bat:a', 'reg:IN', 'red'],
      ['reg:GND', 'bat:b', 'black'],
      ['reg:OUT', 'timer:VCC', 'red'],
      ['timer:GND', 'reg:GND', 'black'],
      ['timer:OUT', 'r:a', 'yellow'],
      ['r:b', 'buzz:a', 'yellow'],
      ['buzz:b', 'timer:GND', 'black'],
      ['reg:OUT', 'screen:VCC', 'red'],
      ['screen:GND', 'reg:GND', 'black'],
    ],
  },
  // two blue eyes, a head that turns (the servo) and a voice that goes beep-boop
  robotHead: join(
    {
      parts: [
        { key: 'board', type: 'arduino', x: 0, y: 0, data: program('arduino', { D9: 'fade', D10: 'blink2', D11: 'blink', D12: 'on', D13: 'on' }) },
        { key: 'neck', type: 'servo', ...ABOVE_BOARD },
      ],
      wires: [
        ['board:5V', 'neck:VCC', 'red'],
        ['neck:GND', 'board:GND', 'black'],
        ['board:D9', 'neck:OUT', 'yellow'],
      ],
    },
    outputs('board', [
      { key: 'boop', pin: 'D10', type: 'speaker', pitch: 262, ohms: 100, wire: 'white' },
      { key: 'beep', pin: 'D11', type: 'speaker', pitch: 1047, ohms: 100, wire: 'white' },
      { key: 'eyeL', pin: 'D12', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
      { key: 'eyeR', pin: 'D13', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
    ]),
  ),
  // START closes the relay, and the relay's own switch keeps its coil on; STOP (the switch) breaks the loop.
  // The bench supply holds its 4.5 V while the motor runs, so the relay never lets go by itself
  conveyor: {
    parts: [
      { key: 'ps', type: 'powerSupply', x: -40, y: -60, data: { voltage: 4.5, limit: 2 } },
      { key: 'stop', type: 'switch', x: 250, y: -60, data: { closed: true } },
      { key: 'start', type: 'button', x: 540, y: -60 },
      // turned round, so its switch faces the buttons and its coil faces the motor
      { key: 'relay', type: 'relay', x: 830, y: 160, rotation: 180 },
      { key: 'belt', type: 'motor', x: 1120, y: 160, rotation: 90 },
      { key: 'readyR', type: 'resistor', x: 250, y: 160, rotation: 90, data: { resistance: 220 } },
      { key: 'ready', type: 'led', x: 250, y: 400, rotation: 90, data: { color: 'green' } },
    ],
    wires: [
      ['ps:a', 'stop:a', 'red'],
      ['stop:b', 'start:a', 'red'],
      ['start:b', 'relay:NO', 'yellow'],
      ['stop:b', 'relay:COM', 'red'],
      ['start:b', 'belt:a', 'yellow'],
      ['belt:a', 'relay:a', 'yellow'],
      ['relay:b', 'belt:b', 'black'],
      ['stop:b', 'readyR:a', 'red'],
      ['readyR:b', 'ready:a', 'yellow'],
      ['belt:b', 'ready:b', 'black'],
      ['ready:b', 'ps:b', 'black'],
    ],
  },
  // the pedal (a knob) drives the wheels through the transistor, and the screen shows how far it is pressed
  gasPedal: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 160, rotation: 270, data: { voltage: 4.5 } },
      { key: 'pedal', type: 'potentiometer', x: 270, y: 160, data: { level: 0.75 } },
      { key: 'rb', type: 'resistor', x: 560, y: 160, data: { resistance: 470 } },
      { key: 'q', type: 'transistor', x: 850, y: 160 },
      { key: 'wheels', type: 'motor', x: 900, y: -170, rotation: 90 },
      { key: 'speed', type: 'segment', x: 270, y: -170, data: { digits: 2, mode: 'volts', tint: 'green' } },
    ],
    wires: [
      ['bat:a', 'pedal:A', 'red'],
      ['pedal:B', 'bat:b', 'black'],
      ['pedal:W', 'rb:a', 'yellow'],
      ['rb:b', 'q:B', 'yellow'],
      ['bat:a', 'wheels:a', 'red'],
      ['wheels:b', 'q:C', 'yellow'],
      ['q:E', 'pedal:B', 'black'],
      ['bat:a', 'speed:VCC', 'red'],
      ['speed:GND', 'pedal:B', 'black'],
      ['pedal:W', 'speed:S', 'yellow'],
    ],
  },
  // far from the wall both wheels turn; closer they slow down, and at the wall they stop and it beeps.
  // Each wheel has its own transistor on the wheel battery; the pins only steer them
  robotCar: join(
    {
      parts: [
        { key: 'board', type: 'arduino', x: 0, y: 0, data: program('arduino', { D8: 'alarm', D9: 'invert', D11: 'invert' }) },
        { key: 'rbL', type: 'resistor', x: 330, y: -250, data: { resistance: 470 } },
        { key: 'qL', type: 'transistor', x: 620, y: -250 },
        { key: 'left', type: 'motor', x: 900, y: -470, rotation: 90 },
        { key: 'rbR', type: 'resistor', x: 330, y: 0, data: { resistance: 470 } },
        { key: 'qR', type: 'transistor', x: 620, y: 0 },
        { key: 'right', type: 'motor', x: 900, y: -210, rotation: 90 },
        { key: 'wheelBat', type: 'battery', x: 1160, y: 0, rotation: 270, data: { voltage: 4.5 } },
      ],
      wires: [
        ['board:D11', 'rbL:a', 'blue'],
        ['rbL:b', 'qL:B', 'blue'],
        ['board:D9', 'rbR:a', 'green'],
        ['rbR:b', 'qR:B', 'green'],
        ['wheelBat:a', 'left:a', 'red'],
        ['wheelBat:a', 'right:a', 'red'],
        ['left:b', 'qL:C', 'yellow'],
        ['right:b', 'qR:C', 'yellow'],
        ['qL:E', 'qR:E', 'black'],
        ['qR:E', 'wheelBat:b', 'black'],
        ['qR:E', 'beeper:b', 'black'],
      ],
    },
    sensorFor('board', 'arduino', 'ultrasonic', { sense: 0.8 }),
    outputs('board', [{ key: 'beeper', pin: 'D8', type: 'buzzer', ohms: 100, wire: 'white' }], 'sensor:GND'),
  ),

  // ── home and city ──

  // a slow 555: a bright flash every two seconds
  lighthouse: join(
    chipOn({ key: 'timer', type: 'timer555', data: { rate: 0.5 } }, battery(9)),
    branches(
      [
        { key: 'beam1', from: 'timer:OUT', type: 'led', color: 'white', ohms: 220, wire: 'yellow' },
        { key: 'beam2', from: 'timer:OUT', type: 'led', color: 'white', ohms: 220, wire: 'yellow' },
      ],
      'bat:b',
      290,
    ),
  ),
  // door shut: the magnet closes the reed switch, A is HIGH and the inside light is off.
  // Open the door: NOT turns the light on
  fridgeLight: join(
    chipOn({ key: 'not', type: 'notGate' }, battery(4.5), { x: -620, y: 0 }),
    {
      parts: [
        { key: 'door', type: 'reed', ...INPUT_A, data: { sense: 1 } },
        { key: 'coldR', type: 'resistor', ...INPUT_B, rotation: 90, data: { resistance: 220 } },
        { key: 'cold', type: 'led', x: INPUT_B.x, y: INPUT_B.y + 230, rotation: 90, data: { color: 'blue' } },
      ],
      wires: [
        ['bat:a', 'door:a', 'red'],
        ['door:b', 'not:A', 'yellow'],
        ['not:A', 'coldR:a', 'yellow'],
        ['coldR:b', 'cold:a', 'yellow'],
        ['cold:b', 'bat:b', 'black'],
      ],
    },
    chipLights('not:Y', 'bat:a', 'bat:b', { key: 'inside', type: 'led', data: { color: 'white' }, ohms: 47 }),
  ),
  // each knob sets how much of one colour flows; the colours mix in the lamp
  moodLamp: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 160, rotation: 270, data: { voltage: 4.5 } },
      { key: 'blueKnob', type: 'potentiometer', x: 270, y: -260, rotation: 90, data: { level: 0.8 } },
      { key: 'greenKnob', type: 'potentiometer', x: 490, y: -260, rotation: 90, data: { level: 0.3 } },
      { key: 'redKnob', type: 'potentiometer', x: 710, y: -260, rotation: 90, data: { level: 0.9 } },
      { key: 'blueR', type: 'resistor', x: 270, y: 0, rotation: 90, data: { resistance: 100 } },
      { key: 'greenR', type: 'resistor', x: 490, y: 0, rotation: 90, data: { resistance: 100 } },
      { key: 'redR', type: 'resistor', x: 710, y: 0, rotation: 90, data: { resistance: 100 } },
      { key: 'lamp', type: 'rgbLed', x: 490, y: 240, rotation: 90 },
    ],
    wires: [
      ['bat:a', 'blueKnob:A', 'red'],
      ['blueKnob:A', 'greenKnob:A', 'red'],
      ['greenKnob:A', 'redKnob:A', 'red'],
      ['blueKnob:W', 'blueR:a', 'blue'],
      ['greenKnob:W', 'greenR:a', 'green'],
      ['redKnob:W', 'redR:a', 'red'],
      ['blueR:b', 'lamp:B', 'blue'],
      ['greenR:b', 'lamp:G', 'green'],
      ['redR:b', 'lamp:R', 'red'],
      ['lamp:K', 'bat:b', 'black'],
    ],
  },
  // white in front all the time; the 555 flashes the red ones at the back
  bikeLights: join(
    {
      parts: [
        { key: 'bat', type: 'battery', x: -620, y: 0, rotation: 270, data: { voltage: 9 } },
        { key: 'sw', type: 'switch', x: -330, y: -230, data: { closed: true } },
        { key: 'timer', type: 'timer555', x: 0, y: 0, data: { rate: 2 } },
      ],
      wires: [
        ['bat:a', 'sw:a', 'red'],
        ['sw:b', 'timer:VCC', 'red'],
        ['timer:GND', 'bat:b', 'black'],
      ],
    },
    branches(
      [
        { key: 'front', from: 'sw:b', type: 'led', color: 'white', ohms: 220, wire: 'red' },
        { key: 'back1', from: 'timer:OUT', type: 'led', color: 'red', ohms: 470, wire: 'yellow' },
        { key: 'back2', from: 'timer:OUT', type: 'led', color: 'red', ohms: 470, wire: 'yellow' },
      ],
      'bat:b',
      290,
    ),
  ),
  // the regulator gives the clock and the 555 a steady 5 V; flip the switch to let the 555 beep
  alarmClock: {
    parts: [
      { key: 'bat', type: 'battery', x: -620, y: 0, rotation: 270, data: { voltage: 9 } },
      { key: 'reg', type: 'regulator', x: -330, y: 0 },
      { key: 'clock', type: 'segment', x: -40, y: -260, data: { digits: 4, mode: 'clock', tint: 'red' } },
      { key: 'timer', type: 'timer555', x: 0, y: 0, data: { rate: 2 } },
      { key: 'alarm', type: 'switch', x: 290, y: 0, data: { closed: false } },
      { key: 'r', type: 'resistor', x: 580, y: 0, data: { resistance: 100 } },
      { key: 'beeper', type: 'buzzer', x: 870, y: 0, rotation: 90 },
    ],
    wires: [
      ['bat:a', 'reg:IN', 'red'],
      ['reg:GND', 'bat:b', 'black'],
      ['reg:OUT', 'timer:VCC', 'red'],
      ['timer:GND', 'reg:GND', 'black'],
      ['reg:OUT', 'clock:VCC', 'red'],
      ['clock:GND', 'timer:GND', 'black'],
      ['timer:OUT', 'alarm:a', 'yellow'],
      ['alarm:b', 'r:a', 'yellow'],
      ['r:b', 'beeper:a', 'yellow'],
      ['beeper:b', 'timer:GND', 'black'],
    ],
  },
  // the lights blink in turns; the star on top changes colour, red, green, blue
  christmasTree: join(
    {
      parts: [
        {
          key: 'board',
          type: 'mega',
          x: 0,
          y: 0,
          data: program('mega', { D8: 'fade', D9: 'blink2', D10: 'blink', D11: 'step3', D12: 'step2', D13: 'step1' }),
        },
        { key: 'sign', type: 'matrix', ...ABOVE_BOARD, y: -210, data: (texts) => ({ cols: 4, rows: 1, tint: 'rainbow', effect: 'sparkle', speed: 0.5, text: texts.tree || undefined }) },
        { key: 'star', type: 'rgbLed', x: FIRST_COLUMN + 4 * COLUMN, y: OUTPUT_ROW, rotation: 90 },
      ],
      wires: [
        ['board:5V', 'sign:VCC', 'red'],
        ['sign:GND', 'board:GND', 'black'],
        ['starB:b', 'star:B', 'blue'],
        ['starG:b', 'star:G', 'green'],
        ['starR:b', 'star:R', 'red'],
        ['star:K', 'gold:b', 'black'],
      ],
    },
    outputs('board', [
      { key: 'gold', pin: 'D8', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
      { key: 'green', pin: 'D9', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'red', pin: 'D10', type: 'led', color: 'red', ohms: 220, wire: 'white' },
    ]),
    {
      parts: [
        { key: 'starB', type: 'resistor', x: FIRST_COLUMN + 3 * COLUMN, y: RESISTOR_ROW, rotation: 90, data: { resistance: 100 } },
        { key: 'starG', type: 'resistor', x: FIRST_COLUMN + 4 * COLUMN, y: RESISTOR_ROW, rotation: 90, data: { resistance: 220 } },
        { key: 'starR', type: 'resistor', x: FIRST_COLUMN + 5 * COLUMN, y: RESISTOR_ROW, rotation: 90, data: { resistance: 220 } },
      ],
      wires: [
        ['board:D11', 'starB:a', 'blue'],
        ['board:D12', 'starG:a', 'green'],
        ['board:D13', 'starR:a', 'red'],
      ],
    },
  ),
  // hold the button: the cars get red, people get the green man and the beeps
  crossing: join(
    {
      parts: [
        {
          key: 'board',
          type: 'arduino',
          x: 0,
          y: 0,
          data: program('arduino', { D8: 'alarm', D10: 'invert', D11: 'follow', D12: 'invert', D13: 'follow' }),
        },
        { key: 'press', type: 'button', x: -330, y: -230, rotation: 90 },
        { key: 'pull', type: 'resistor', x: -330, y: 30, rotation: 90, data: { resistance: 1000 } },
      ],
      wires: [
        ['board:5V', 'press:a', 'red'],
        ['press:b', 'board:A0', 'yellow'],
        ['press:b', 'pull:a', 'yellow'],
        ['pull:b', 'board:GND', 'black'],
      ],
    },
    outputs(
      'board',
      [
        { key: 'beeper', pin: 'D8', type: 'buzzer', ohms: 100, wire: 'white' },
        { key: 'wait', pin: 'D10', type: 'led', color: 'red', ohms: 220, wire: 'white' },
        { key: 'walk', pin: 'D11', type: 'led', color: 'green', ohms: 220, wire: 'green' },
        { key: 'carsGo', pin: 'D12', type: 'led', color: 'green', ohms: 220, wire: 'green' },
        { key: 'carsStop', pin: 'D13', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      ],
      'pull:b',
    ),
  ),
  // dark: the light sensor pulls A low, NOT turns its output on, and that is enough to pull the relay in.
  // The relay's switch runs the big lamp on its own battery
  gardenLamp: join(
    chipOn({ key: 'not', type: 'notGate' }, battery(9), { x: -620, y: 0 }),
    {
      parts: [
        { key: 'ldr', type: 'ldr', ...INPUT_A, data: { light: 0.15 } },
        { key: 'div', type: 'resistor', ...INPUT_B, rotation: 90, data: { resistance: 1000 } },
        { key: 'relay', type: 'relay', x: 290, y: 0 },
        { key: 'lamp', type: 'lamp', x: 580, y: -230 },
        { key: 'lampBat', type: 'battery', x: 870, y: 0, rotation: 270, data: { voltage: 3 } },
      ],
      wires: [
        ['bat:a', 'ldr:a', 'red'],
        ['ldr:b', 'not:A', 'yellow'],
        ['not:A', 'div:a', 'yellow'],
        ['div:b', 'bat:b', 'black'],
        ['not:Y', 'relay:a', 'yellow'],
        ['relay:b', 'div:b', 'black'],
        ['relay:COM', 'lamp:a', 'yellow'],
        ['lamp:b', 'lampBat:a', 'red'],
        ['lampBat:b', 'relay:NO', 'black'],
      ],
    },
  ),

  // ── games ──

  // power on and it counts the seconds from zero
  stopwatch: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 150, rotation: 270, data: { voltage: 4.5 } },
      { key: 'sw', type: 'switch', x: 290, y: -40, data: { closed: true } },
      { key: 'watch', type: 'segment', x: 580, y: 150, data: { digits: 4, mode: 'counter', tint: 'yellow' } },
    ],
    wires: [
      ['bat:a', 'sw:a', 'red'],
      ['sw:b', 'watch:VCC', 'red'],
      ['watch:GND', 'bat:b', 'black'],
    ],
  },
  // carry it level: tip it over and the tilt switch closes and buzzes
  steadyHand: ladder(battery(3), [
    { top: { key: 'goR', type: 'resistor', data: { resistance: 47 } }, bottom: { key: 'go', type: 'led', data: { color: 'green' } } },
    { top: { key: 'tilt', type: 'tilt', data: { sense: 0 } }, bottom: { key: 'buzz', type: 'buzzer' } },
  ]),
  // only B (the right answer) is wired to the green light and the bell; A and C light the red one
  quizBoard: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 160, rotation: 270, data: { voltage: 4.5 } },
      { key: 'question', type: 'lcd', x: 950, y: 0, data: (texts) => ({ cols: 20, rows: 4, tint: 'blue', text: texts.quiz || undefined }) },
      { key: 'a', type: 'button', x: 270, y: 0, rotation: 90 },
      { key: 'b', type: 'button', x: 490, y: 0, rotation: 90 },
      { key: 'c', type: 'button', x: 710, y: 0, rotation: 90 },
      { key: 'wrongR', type: 'resistor', x: 270, y: 240, rotation: 90, data: { resistance: 220 } },
      { key: 'rightR', type: 'resistor', x: 490, y: 240, rotation: 90, data: { resistance: 220 } },
      { key: 'wrong', type: 'led', x: 270, y: 470, rotation: 90, data: { color: 'red' } },
      { key: 'right', type: 'led', x: 490, y: 470, rotation: 90, data: { color: 'green' } },
      { key: 'bell', type: 'buzzer', x: 710, y: 470, rotation: 90 },
    ],
    wires: [
      ['bat:a', 'a:a', 'red'],
      ['a:a', 'b:a', 'red'],
      ['b:a', 'c:a', 'red'],
      ['c:a', 'question:VCC', 'red'],
      ['question:GND', 'bell:b', 'black'],
      ['a:b', 'wrongR:a', 'white'],
      ['c:b', 'wrongR:a', 'white'],
      ['b:b', 'rightR:a', 'green'],
      ['wrongR:b', 'wrong:a', 'white'],
      ['rightR:b', 'right:a', 'green'],
      ['rightR:a', 'bell:a', 'green'],
      ['bell:b', 'right:b', 'black'],
      ['right:b', 'wrong:b', 'black'],
      ['wrong:b', 'bat:b', 'black'],
    ],
  },
  // the louder you shout, the bigger the number and the higher the line
  shoutMeter: {
    parts: [
      { key: 'bat', type: 'battery', x: -520, y: -80, rotation: 270, data: { voltage: 4.5 } },
      { key: 'meter', type: 'segment', x: 0, y: -270, data: { digits: 2, mode: 'volts', tint: 'red' } },
      { key: 'mic', type: 'soundSensor', x: -170, y: 0, data: { sense: 0.45 } },
      { key: 'graph', type: 'oled', x: 290, y: -270, data: { mode: 'graph', tint: 'white' } },
    ],
    wires: [
      ['bat:a', 'meter:VCC', 'red'],
      ['meter:VCC', 'mic:VCC', 'red'],
      ['meter:GND', 'mic:GND', 'black'],
      ['bat:b', 'mic:GND', 'black'],
      ['mic:OUT', 'meter:S', 'yellow'],
      ['meter:VCC', 'graph:VCC', 'red'],
      ['graph:GND', 'meter:GND', 'black'],
      ['mic:OUT', 'graph:S', 'yellow'],
    ],
  },
  // the lamp turns red, green, blue; the low speaker booms, the high one ticks, and the sign sparkles
  disco: join(
    {
      parts: [
        { key: 'board', type: 'nano', x: 0, y: 0, data: program('nano', { D8: 'blink', D9: 'step3', D10: 'step2', D11: 'step1', D12: 'blink2' }) },
        { key: 'sign', type: 'matrix', ...ABOVE_BOARD, y: -210, data: (texts) => ({ cols: 4, rows: 1, tint: 'rainbow', effect: 'sparkle', speed: 0.7, text: texts.disco || undefined }) },
        { key: 'ball', type: 'rgbLed', x: FIRST_COLUMN + 2 * COLUMN, y: OUTPUT_ROW, rotation: 90 },
        { key: 'blueR', type: 'resistor', x: FIRST_COLUMN + COLUMN, y: RESISTOR_ROW, rotation: 90, data: { resistance: 100 } },
        { key: 'greenR', type: 'resistor', x: FIRST_COLUMN + 2 * COLUMN, y: RESISTOR_ROW, rotation: 90, data: { resistance: 220 } },
        { key: 'redR', type: 'resistor', x: FIRST_COLUMN + 3 * COLUMN, y: RESISTOR_ROW, rotation: 90, data: { resistance: 220 } },
        { key: 'boomR', type: 'resistor', x: FIRST_COLUMN, y: RESISTOR_ROW, rotation: 90, data: { resistance: 100 } },
        { key: 'boom', type: 'speaker', x: FIRST_COLUMN, y: OUTPUT_ROW, rotation: 90, data: { pitch: 262 } },
        { key: 'tickR', type: 'resistor', x: FIRST_COLUMN + 4 * COLUMN, y: RESISTOR_ROW, rotation: 90, data: { resistance: 100 } },
        { key: 'tick', type: 'speaker', x: FIRST_COLUMN + 4 * COLUMN, y: OUTPUT_ROW, rotation: 90, data: { pitch: 1047 } },
      ],
      wires: [
        ['board:5V', 'sign:VCC', 'red'],
        ['sign:GND', 'board:GND', 'black'],
        ['board:D8', 'boomR:a', 'white'],
        ['boomR:b', 'boom:a', 'white'],
        ['board:D9', 'blueR:a', 'blue'],
        ['board:D10', 'greenR:a', 'green'],
        ['board:D11', 'redR:a', 'red'],
        ['blueR:b', 'ball:B', 'blue'],
        ['greenR:b', 'ball:G', 'green'],
        ['redR:b', 'ball:R', 'red'],
        ['board:D12', 'tickR:a', 'white'],
        ['tickR:b', 'tick:a', 'white'],
        ['tick:b', 'ball:K', 'black'],
        ['ball:K', 'boom:b', 'black'],
        ['boom:b', 'board:GND', 'black'],
      ],
    },
  ),
  // press while the red light is on: AND sees both HIGH and the speaker cheers
  reactionGame: {
    parts: [
      { key: 'bat', type: 'battery', x: -620, y: 0, rotation: 270, data: { voltage: 9 } },
      { key: 'timer', type: 'timer555', x: -330, y: -260, data: { rate: 1 } },
      { key: 'press', type: 'button', ...INPUT_B },
      { key: 'and', type: 'andGate', x: 0, y: 0 },
      { key: 'targetR', type: 'resistor', x: 0, y: -520, rotation: 90, data: { resistance: 470 } },
      { key: 'target', type: 'led', x: 260, y: -520, rotation: 90, data: { color: 'red' } },
      { key: 'cheerR', type: 'resistor', x: 290, y: 0, data: { resistance: 47 } },
      { key: 'cheer', type: 'speaker', x: 560, y: 0, rotation: 90, data: { pitch: 1047 } },
    ],
    wires: [
      ['bat:a', 'timer:VCC', 'red'],
      ['timer:GND', 'bat:b', 'black'],
      ['bat:a', 'and:VCC', 'red'],
      ['and:GND', 'bat:b', 'black'],
      ['bat:a', 'press:a', 'red'],
      ['press:b', 'and:B', 'yellow'],
      ['timer:OUT', 'and:A', 'blue'],
      ['timer:OUT', 'targetR:a', 'blue'],
      ['targetR:b', 'target:a', 'blue'],
      ['target:b', 'timer:GND', 'black'],
      ['and:Y', 'cheerR:a', 'yellow'],
      ['cheerR:b', 'cheer:a', 'yellow'],
      ['cheer:b', 'bat:b', 'black'],
    ],
  },

  // ── screens and signs, second batch ──

  // flip the switch in the morning and the shop says OPEN
  openSign: {
    parts: [
      { key: 'bat', type: 'battery', x: 0, y: 150, rotation: 270, data: { voltage: 4.5 } },
      { key: 'sw', type: 'switch', x: 290, y: -40, data: { closed: true } },
      { key: 'sign', type: 'matrix', x: 580, y: 140, data: (texts) => ({ cols: 3, rows: 1, tint: 'red', effect: 'static', text: texts.open || undefined }) },
    ],
    wires: [
      ['bat:a', 'sw:a', 'red'],
      ['sw:b', 'sign:VCC', 'red'],
      ['sign:GND', 'bat:b', 'black'],
    ],
  },
  // a green two-line sign, the kind that glows outside a pharmacy at night
  pharmacySign: {
    parts: [
      { key: 'bat', type: 'battery', x: -300, y: 120, rotation: 270, data: { voltage: 4.5 } },
      { key: 'sign', type: 'matrix', x: 0, y: 100, data: (texts) => ({ cols: 5, rows: 2, tint: 'green', effect: 'static', brightness: 0.9, text: texts.pharmacy || undefined }) },
    ],
    wires: [
      ['bat:a', 'sign:VCC', 'red'],
      ['sign:GND', 'bat:b', 'black'],
    ],
  },
  // the studio screen plays the news, the ticker underneath runs the headlines
  newsDesk: {
    parts: [
      { key: 'bat', type: 'battery', x: -520, y: -60, rotation: 270, data: { voltage: 4.5 } },
      { key: 'tv', type: 'tft', x: 0, y: -330, data: { mode: 'demo', demo: 'news' } },
      { key: 'ticker', type: 'matrix', x: -170, y: 0, data: (texts) => ({ cols: 6, rows: 1, tint: 'red', speed: 0.6, brightness: 0.8, text: texts.news || undefined }) },
    ],
    wires: [
      ['bat:a', 'tv:VCC', 'red'],
      ['tv:VCC', 'ticker:VCC', 'red'],
      ['tv:GND', 'ticker:GND', 'black'],
      ['bat:b', 'ticker:GND', 'black'],
    ],
  },
  // the menu on a blue screen and a sparkling sign in the window
  cafeMenu: {
    parts: [
      { key: 'bat', type: 'battery', x: -520, y: -80, rotation: 270, data: { voltage: 4.5 } },
      { key: 'menu', type: 'lcd', x: 0, y: -270, data: (texts) => ({ cols: 20, rows: 4, tint: 'blue', text: texts.menu || undefined }) },
      { key: 'sign', type: 'matrix', x: -170, y: 0, data: (texts) => ({ cols: 3, rows: 1, tint: 'yellow', effect: 'sparkle', speed: 0.4, text: texts.open || undefined }) },
    ],
    wires: [
      ['bat:a', 'menu:VCC', 'red'],
      ['menu:VCC', 'sign:VCC', 'red'],
      ['menu:GND', 'sign:GND', 'black'],
      ['bat:b', 'sign:GND', 'black'],
    ],
  },
  // the number counts up the floors; press the button for the "ding"
  elevator: {
    parts: [
      { key: 'bat', type: 'battery', x: -520, y: -80, rotation: 270, data: { voltage: 4.5 } },
      { key: 'floor', type: 'segment', x: 0, y: -270, data: { digits: 2, mode: 'counter', tint: 'red' } },
      { key: 'screen', type: 'lcd', x: 230, y: -270, data: (texts) => ({ cols: 16, rows: 2, tint: 'green', text: texts.elevator || undefined }) },
      { key: 'call', type: 'button', x: -170, y: 0 },
      { key: 'ding', type: 'buzzer', x: 290, y: 0, rotation: 90 },
    ],
    wires: [
      ['bat:a', 'floor:VCC', 'red'],
      ['floor:VCC', 'screen:VCC', 'red'],
      ['floor:GND', 'screen:GND', 'black'],
      ['bat:b', 'floor:GND', 'black'],
      ['bat:a', 'call:a', 'red'],
      ['call:b', 'ding:a', 'yellow'],
      ['ding:b', 'bat:b', 'black'],
    ],
  },
  // the temperature sensor draws its line on the small screen; the big one shows the forecast
  weatherStation: {
    parts: [
      { key: 'bat', type: 'battery', x: -520, y: -80, rotation: 270, data: { voltage: 4.5 } },
      { key: 'graph', type: 'oled', x: 0, y: -270, data: { mode: 'graph', tint: 'yellowBlue' } },
      { key: 'temp', type: 'tempSensor', x: -170, y: 0, data: { sense: 0.4 } },
      { key: 'forecast', type: 'lcd', x: 260, y: -270, data: (texts) => ({ cols: 16, rows: 2, tint: 'green', text: texts.weather || undefined }) },
    ],
    wires: [
      ['bat:a', 'graph:VCC', 'red'],
      ['graph:VCC', 'temp:VCC', 'red'],
      ['graph:GND', 'temp:GND', 'black'],
      ['bat:b', 'temp:GND', 'black'],
      ['temp:OUT', 'graph:S', 'yellow'],
      ['graph:VCC', 'forecast:VCC', 'red'],
      ['forecast:GND', 'graph:GND', 'black'],
    ],
  },
  // a steady 5 V from the bench supply for the departures board and its clock
  airportBoard: {
    parts: [
      { key: 'ps', type: 'powerSupply', x: -560, y: -80, data: { voltage: 5, limit: 0.5 } },
      { key: 'board', type: 'lcd', x: 0, y: -270, data: (texts) => ({ cols: 20, rows: 4, tint: 'blue', text: texts.departures || undefined }) },
      { key: 'clock', type: 'segment', x: -170, y: 0, data: { digits: 4, mode: 'clock', tint: 'yellow' } },
    ],
    wires: [
      ['ps:a', 'board:VCC', 'red'],
      ['board:VCC', 'clock:VCC', 'red'],
      ['board:GND', 'clock:GND', 'black'],
      ['ps:b', 'clock:GND', 'black'],
    ],
  },
  // six bulbs run around the sign, one step at a time, while the words move above them
  cinemaSign: join(
    {
      parts: [
        {
          key: 'board',
          type: 'mega',
          x: 0,
          y: 0,
          data: program('mega', { D8: 'step1', D9: 'step2', D10: 'step3', D11: 'step1', D12: 'step2', D13: 'step3' }),
        },
        { key: 'sign', type: 'matrix', ...ABOVE_BOARD, y: -210, data: (texts) => ({ cols: 6, rows: 1, tint: 'yellow', speed: 0.5, text: texts.cinema || undefined }) },
      ],
      wires: [
        ['board:5V', 'sign:VCC', 'red'],
        ['sign:GND', 'board:GND', 'black'],
      ],
    },
    outputs('board', [
      { key: 'b1', pin: 'D8', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
      { key: 'b2', pin: 'D9', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
      { key: 'b3', pin: 'D10', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
      { key: 'b4', pin: 'D11', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
      { key: 'b5', pin: 'D12', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
      { key: 'b6', pin: 'D13', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
    ]),
  ),

  // ── talk to the AI board ── (the industry examples follow them)
  // Each opens with a program already running, so something works before anyone asks;
  // then the child tells the board in their own words what to change.

  // the lamp comes on in the dark; ask for the fan (a motor on its own battery) or the doorbell
  aiSmartHome: join(
    {
      parts: [
        { key: 'board', type: 'aiBoard', x: 0, y: 0, data: program('aiBoard', { P2: 'invert' }) },
        { key: 'ldr', type: 'ldr', x: -330, y: -230, rotation: 90, data: { light: 0.15 } },
        { key: 'div', type: 'resistor', x: -330, y: 30, rotation: 90, data: { resistance: 1000 } },
        { key: 'rb', type: 'resistor', x: 330, y: -250, data: { resistance: 1000 } },
        { key: 'q', type: 'transistor', x: 620, y: -250 },
        { key: 'fan', type: 'motor', x: 870, y: -520, rotation: 90 },
        { key: 'fanBat', type: 'battery', x: 1110, y: -520, rotation: 270, data: { voltage: 3 } },
      ],
      wires: [
        ['board:5V', 'ldr:a', 'red'],
        ['ldr:b', 'board:IN', 'yellow'],
        ['ldr:b', 'div:a', 'yellow'],
        ['div:b', 'board:GND', 'black'],
        ['board:P1', 'rb:a', 'blue'],
        ['rb:b', 'q:B', 'blue'],
        ['fanBat:a', 'fan:a', 'red'],
        ['fan:b', 'q:C', 'yellow'],
        ['q:E', 'fanBat:b', 'black'],
        ['fanBat:b', 'lamp:b', 'black'],
      ],
    },
    outputs(
      'board',
      [
        { key: 'bell', pin: 'P3', type: 'buzzer', ohms: 100, wire: 'blue' },
        { key: 'lamp', pin: 'P2', type: 'led', color: 'white', ohms: 100, wire: 'white' },
      ],
      'div:b',
    ),
  ),
  // red, then green, then yellow, like the street; ask it to flash yellow at night
  aiTrafficLight: join(
    { parts: [{ key: 'board', type: 'aiBoard', x: 0, y: 0, data: program('aiBoard', { P3: 'step1', P1: 'step2', P2: 'step3' }) }], wires: [] },
    outputs('board', [
      { key: 'red', pin: 'P3', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'yellow', pin: 'P2', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
      { key: 'green', pin: 'P1', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ]),
  ),
  // three lights run one after another and the gold one breathes; ask for a new dance
  aiPartyLights: join(
    {
      parts: [
        { key: 'board', type: 'aiBoard', x: 0, y: 0, data: program('aiBoard', { P4: 'step1', P3: 'step2', P2: 'step3', P1: 'fade' }) },
      ],
      wires: [],
    },
    outputs('board', [
      { key: 'red', pin: 'P4', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'green', pin: 'P3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'blue', pin: 'P2', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
      { key: 'gold', pin: 'P1', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
    ]),
  ),
  // dry soil: the red light is on and the pump runs; wet soil: the green light. Ask it to change the rules
  aiPlantHelper: join(
    {
      parts: [
        { key: 'board', type: 'aiBoard', x: 0, y: 0, data: program('aiBoard', { P1: 'invert', P2: 'follow', P3: 'invert' }) },
        { key: 'rb', type: 'resistor', x: 330, y: -250, data: { resistance: 1000 } },
        { key: 'q', type: 'transistor', x: 620, y: -250 },
        { key: 'pump', type: 'motor', x: 870, y: -520, rotation: 90 },
        { key: 'pumpBat', type: 'battery', x: 1110, y: -520, rotation: 270, data: { voltage: 3 } },
      ],
      wires: [
        ['board:P1', 'rb:a', 'blue'],
        ['rb:b', 'q:B', 'blue'],
        ['pumpBat:a', 'pump:a', 'red'],
        ['pump:b', 'q:C', 'yellow'],
        ['q:E', 'pumpBat:b', 'black'],
        ['pumpBat:b', 'happy:b', 'black'],
      ],
    },
    sensorFor('board', 'aiBoard', 'soilSensor', { sense: 0.25 }),
    outputs(
      'board',
      [
        { key: 'thirsty', pin: 'P3', type: 'led', color: 'red', ohms: 220, wire: 'white' },
        { key: 'happy', pin: 'P2', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      ],
      'sensor:GND',
    ),
  ),
  // the tail (a servo) wags and the blue eyes shine; ask it to beep when you touch it
  aiRobotPet: join(
    {
      parts: [
        { key: 'board', type: 'aiBoard', x: 0, y: 0, data: program('aiBoard', { P1: 'fade', P3: 'on', P4: 'on' }) },
        { key: 'tail', type: 'servo', ...ABOVE_BOARD },
      ],
      wires: [
        ['board:5V', 'tail:VCC', 'red'],
        ['tail:GND', 'board:GND', 'black'],
        ['board:P1', 'tail:OUT', 'yellow'],
      ],
    },
    sensorFor('board', 'aiBoard', 'touchSensor'),
    outputs(
      'board',
      [
        { key: 'voice', pin: 'P5', type: 'buzzer', ohms: 100, wire: 'white' },
        { key: 'eyeL', pin: 'P4', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
        { key: 'eyeR', pin: 'P3', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
      ],
      'sensor:GND',
    ),
  ),

  // ── cars: the engine computer (ECU) ──

  // the hotter the engine, the faster the radiator fan (PWM on OUT1); red warns above 30 °C
  ecuCooling: join(
    boardAt('ecu', { OUT1: 'follow', OUT5: 'invert', OUT6: 'follow' }),
    sensorFor('board', 'ecu', 'tempSensor', { sense: 0.45 }),
    driver('board:OUT1', { key: 'fan', type: 'fan' }, 'ok:b', 6, 4700),
    outputs('board', [
      { key: 'hot', pin: 'OUT6', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'ok', pin: 'OUT5', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // dusk: the headlights fade in and the blue light on the dashboard comes on
  ecuHeadlights: join(
    {
      parts: [
        { key: 'board', type: 'ecu', x: 0, y: 0, data: program('ecu', { OUT2: 'invert', OUT3: 'invert', OUT6: 'invert' }) },
        { key: 'ldr', type: 'ldr', x: -330, y: -230, rotation: 90, data: { light: 0.15 } },
        { key: 'div', type: 'resistor', x: -330, y: 30, rotation: 90, data: { resistance: 1000 } },
      ],
      wires: [
        ['board:5V', 'ldr:a', 'red'],
        ['ldr:b', 'board:AIN', 'yellow'],
        ['ldr:b', 'div:a', 'yellow'],
        ['div:b', 'board:GND', 'black'],
      ],
    },
    outputs('board', [
      { key: 'dash', pin: 'OUT6', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
      { key: 'right', pin: 'OUT3', type: 'led', color: 'white', ohms: 100, wire: 'white' },
      { key: 'left', pin: 'OUT2', type: 'led', color: 'white', ohms: 100, wire: 'white' },
    ], 'div:b'),
  ),
  // rain on the glass starts the wiper (a servo); the harder it rains, the faster it sweeps
  ecuWipers: join(
    boardAt('ecu', { OUT1: 'alarm', OUT5: 'invert', OUT6: 'follow' }),
    above('ecu', { key: 'wiper', type: 'servo' }),
    { parts: [], wires: [['board:OUT1', 'wiper:OUT', 'blue']] },
    sensorFor('board', 'ecu', 'rainSensor', { sense: 0.7 }),
    outputs('board', [
      { key: 'rain', pin: 'OUT6', type: 'led', color: 'blue', ohms: 220, wire: 'blue' },
      { key: 'dry', pin: 'OUT5', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // reversing: the closer the wall, the more bars light and the faster it beeps
  ecuParking: join(
    boardAt('ecu', { OUT1: 'follow', OUT5: 'invert', OUT6: 'alarm' }),
    above('ecu', { key: 'gauge', type: 'barGraph' }, 'board:OUT1'),
    sensorFor('board', 'ecu', 'ultrasonic', { sense: 0.35 }),
    outputs('board', [
      { key: 'beeper', pin: 'OUT6', type: 'buzzer', ohms: 100, wire: 'white' },
      { key: 'clear', pin: 'OUT5', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // the gas pedal is a knob: the ECU spins the engine and tells the dashboard over the CAN bus
  ecuCanDash: join(
    {
      parts: [
        { key: 'board', type: 'ecu', x: 0, y: 0, data: program('ecu', { OUT1: 'follow', OUT2: 'follow', OUT6: 'on' }) },
        { key: 'pedal', type: 'potentiometer', ...SENSOR_SPOT, data: { level: 0.5, resistance: 10000 } },
      ],
      wires: [
        ['board:5V', 'pedal:A', 'red'],
        ['pedal:B', 'board:GND', 'black'],
        ['pedal:W', 'board:AIN', 'yellow'],
      ],
    },
    above('ecu', { key: 'can', type: 'canBus' }, 'board:OUT2'),
    driver('board:OUT1', { key: 'engine', type: 'motor' }, 'ready:b', 3),
    outputs('board', [{ key: 'ready', pin: 'OUT6', type: 'led', color: 'green', ohms: 220, wire: 'green' }], 'pedal:B'),
  ),
  // armed: the red light blinks. A knock on the glass: siren, hazard lights and a text to the owner
  ecuAlarm: join(
    boardAt('ecu', { OUT1: 'follow', OUT3: 'blink', OUT4: 'alarm', OUT5: 'alarm', OUT6: 'alarm' }),
    above('ecu', { key: 'sms', type: 'gsm', data: (texts) => ({ text: texts.smsCar || undefined }) }, 'board:OUT1'),
    sensorFor('board', 'ecu', 'knockSensor'),
    outputs('board', [
      { key: 'siren', pin: 'OUT6', type: 'buzzer', sound: 'yelp', ohms: 100, wire: 'white' },
      { key: 'hazardL', pin: 'OUT5', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
      { key: 'hazardR', pin: 'OUT4', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
      { key: 'armed', pin: 'OUT3', type: 'led', color: 'red', ohms: 220, wire: 'blue' },
    ], 'sensor:GND'),
  ),
  // the GPS finds the car; once it has a fix, its pulse blinks the green light and goes out by LoRa
  ecuTracker: join(
    {
      parts: [
        { key: 'board', type: 'ecu', x: 0, y: 0, data: program('ecu', { OUT2: 'follow', OUT5: 'on', OUT6: 'follow' }) },
        { key: 'gps', type: 'gps', ...SENSOR_SPOT },
      ],
      wires: [
        ['board:5V', 'gps:VCC', 'red'],
        ['gps:GND', 'board:GND', 'black'],
        ['gps:PPS', 'board:AIN', 'yellow'],
      ],
    },
    above('ecu', { key: 'radio', type: 'lora' }, 'board:OUT2'),
    outputs('board', [
      { key: 'fix', pin: 'OUT6', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'power', pin: 'OUT5', type: 'led', color: 'white', ohms: 100, wire: 'white' },
    ], 'gps:GND'),
  ),

  // ── factories: the PLC ──

  // the belt runs until a box reaches the sensor at its end; red says a box is waiting
  plcConveyor: join(
    boardAt('plc', { Q0: 'invert', Q3: 'follow', Q4: 'invert' }),
    sensorFor('board', 'plc', 'irSensor'),
    driver('board:Q0', { key: 'belt', type: 'motor' }, 'run:b', 3),
    outputs('board', [
      { key: 'run', pin: 'Q4', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'box', pin: 'Q3', type: 'led', color: 'red', ohms: 220, wire: 'white' },
    ], 'sensor:GND'),
  ),
  // the pump fills the tank until the water reaches the level sensor's top
  plcTank: join(
    boardAt('plc', { Q0: 'invert', Q3: 'invert', Q4: 'follow' }),
    sensorFor('board', 'plc', 'waterSensor', { sense: 0.2 }),
    driver('board:Q0', { key: 'pump', type: 'pump' }, 'full:b'),
    outputs('board', [
      { key: 'full', pin: 'Q4', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
      { key: 'filling', pin: 'Q3', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
    ], 'sensor:GND'),
  ),
  // a machine's three-step cycle on its stack light: run (green), change over (yellow), stop (red, with a beep)
  plcAndon: join(
    {
      parts: [
        { key: 'board', type: 'plc', x: 0, y: 0, data: program('plc', { Q0: 'step1', Q1: 'step3', Q2: 'step2', Q3: 'step1', Q4: 'step3' }) },
        { key: 'tower', type: 'trafficLight', x: FIRST_COLUMN, y: 0 },
      ],
      wires: [
        ['board:Q1', 'tower:R', 'white'],
        ['board:Q2', 'tower:Y', 'yellow'],
        ['board:Q3', 'tower:G', 'green'],
        ['tower:GND', 'board:GND', 'black'],
      ],
    },
    driver('board:Q0', { key: 'machine', type: 'motor' }, 'board:GND', 3),
    outputs('board', [{ key: 'horn', pin: 'Q4', type: 'buzzer', ohms: 100, wire: 'blue' }]),
  ),
  // the guard door's switch: shut, the machine may run; open it and the machine stops at once
  plcSafety: join(
    {
      parts: [
        { key: 'board', type: 'plc', x: 0, y: 0, data: program('plc', { Q0: 'follow', Q3: 'follow', Q4: 'invert' }) },
        { key: 'door', type: 'slideSwitch', x: -330, y: -230, rotation: 90, data: { closed: true } },
        { key: 'pull', type: 'resistor', x: -330, y: 30, rotation: 90, data: { resistance: 1000 } },
      ],
      wires: [
        ['board:5V', 'door:COM', 'red'],
        ['door:B', 'board:AI0', 'yellow'],
        ['door:B', 'pull:a', 'yellow'],
        ['pull:b', 'board:GND', 'black'],
      ],
    },
    driver('board:Q0', { key: 'press', type: 'motor' }, 'safe:b', 3),
    outputs('board', [
      { key: 'open', pin: 'Q4', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'safe', pin: 'Q3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'pull:b'),
  ),
  // the furnace's temperature goes to the control room over RS-485; above 30 °C the fan and the horn start
  plcModbus: join(
    boardAt('plc', { AQ0: 'follow', Q0: 'follow', Q3: 'invert', Q4: 'alarm' }),
    above('plc', { key: 'bus', type: 'rs485' }, 'board:AQ0'),
    sensorFor('board', 'plc', 'tempSensor', { sense: 0.4 }),
    driver('board:Q0', { key: 'fan', type: 'fan' }, 'ok:b'),
    outputs('board', [
      { key: 'horn', pin: 'Q4', type: 'buzzer', ohms: 100, wire: 'white' },
      { key: 'ok', pin: 'Q3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // a hydraulic press's power pack: the pump builds up the pressure, and the plant watches it over Wi-Fi
  plcHydraulic: join(
    boardAt('plc', { AQ0: 'follow', Q0: 'invert', Q3: 'invert', Q4: 'follow' }),
    above('plc', { key: 'wifi', type: 'wifi' }, 'board:AQ0'),
    sensorFor('board', 'plc', 'pressureSensor', { sense: 0.3 }),
    driver('board:Q0', { key: 'pump', type: 'pump' }, 'ready:b'),
    outputs('board', [
      { key: 'ready', pin: 'Q4', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'building', pin: 'Q3', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
    ], 'sensor:GND'),
  ),
  // the gas valve stays open only while the sensor sees the flame; if it goes out, the valve shuts and the horn sounds
  plcBurner: join(
    boardAt('plc', { Q0: 'follow', Q3: 'follow', Q4: 'invert' }),
    sensorFor('board', 'plc', 'flameSensor', { sense: 0.8 }),
    driver('board:Q0', { key: 'valve', type: 'solenoid' }, 'lit:b'),
    outputs('board', [
      { key: 'horn', pin: 'Q4', type: 'buzzer', ohms: 100, wire: 'white' },
      { key: 'lit', pin: 'Q3', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
    ], 'sensor:GND'),
  ),

  // ── oil and gas: the RTU at the well ──

  // the wellhead's pressure goes to the control room by LoRa; too high, and the beacon and the horn go off
  rtuWellhead: join(
    boardAt('rtu', { AO1: 'follow', DO2: 'invert', DO3: 'alarm', DO4: 'alarm' }),
    above('rtu', { key: 'radio', type: 'lora' }, 'board:AO1'),
    sensorFor('board', 'rtu', 'pressureSensor', { sense: 0.35 }),
    outputs('board', [
      { key: 'horn', pin: 'DO4', type: 'buzzer', sound: 'wail', ohms: 100, wire: 'white' },
      { key: 'beacon', pin: 'DO3', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'normal', pin: 'DO2', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // poisonous gas at the well: the beacon flashes, the horn wails and the supervisor gets a text
  rtuGasLeak: join(
    boardAt('rtu', { DO1: 'follow', DO2: 'invert', DO3: 'alarm', DO4: 'alarm' }),
    above('rtu', { key: 'sms', type: 'gsm', data: (texts) => ({ text: texts.smsGas || undefined }) }, 'board:DO1'),
    sensorFor('board', 'rtu', 'gasSensor', { sense: 0.1 }),
    outputs('board', [
      { key: 'horn', pin: 'DO4', type: 'buzzer', sound: 'wail', ohms: 100, wire: 'white' },
      { key: 'beacon', pin: 'DO3', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'safe', pin: 'DO2', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // the pump jack lifts oil into the tank and stops when the tank is full; the bars show the level
  rtuPumpJack: join(
    boardAt('rtu', { AO1: 'follow', DO1: 'invert', DO3: 'invert', DO4: 'follow' }),
    above('rtu', { key: 'level', type: 'barGraph' }, 'board:AO1'),
    sensorFor('board', 'rtu', 'waterSensor', { sense: 0.3 }),
    driver('board:DO1', { key: 'jack', type: 'motor' }, 'pumping:b', 3),
    outputs('board', [
      { key: 'full', pin: 'DO4', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'pumping', pin: 'DO3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // the flare must never go out: if the sensor loses the flame, the horn sounds and a text goes out
  rtuFlare: join(
    boardAt('rtu', { DO1: 'invert', DO3: 'follow', DO4: 'invert' }),
    above('rtu', { key: 'sms', type: 'gsm', data: (texts) => ({ text: texts.smsFlare || undefined }) }, 'board:DO1'),
    sensorFor('board', 'rtu', 'flameSensor', { sense: 0.8 }),
    outputs('board', [
      { key: 'horn', pin: 'DO4', type: 'buzzer', ohms: 100, wire: 'white' },
      { key: 'lit', pin: 'DO3', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
    ], 'sensor:GND'),
  ),
  // a storage tank's level, on its bar gauge and in the cloud over Wi-Fi; red when it is nearly full
  rtuTankFarm: join(
    boardAt('rtu', { AO1: 'follow', AO2: 'follow', DO3: 'invert', DO4: 'follow' }),
    above('rtu', { key: 'wifi', type: 'wifi' }, 'board:AO1'),
    above('rtu', { key: 'gauge', type: 'barGraph' }, 'board:AO2', DRIVER),
    sensorFor('board', 'rtu', 'waterSensor', { sense: 0.4 }),
    outputs('board', [
      { key: 'high', pin: 'DO4', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'ok', pin: 'DO3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // the booster pump keeps the pipeline's pressure up; the pressure goes to the control room over Modbus
  rtuPipeline: join(
    boardAt('rtu', { AO1: 'follow', DO1: 'invert', DO3: 'invert', DO4: 'follow' }),
    above('rtu', { key: 'bus', type: 'rs485' }, 'board:AO1'),
    sensorFor('board', 'rtu', 'pressureSensor', { sense: 0.25 }),
    driver('board:DO1', { key: 'pump', type: 'pump' }, 'ok:b'),
    outputs('board', [
      { key: 'ok', pin: 'DO4', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'boosting', pin: 'DO3', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
    ], 'sensor:GND'),
  ),

  // ── connected: SMS, Wi-Fi, Bluetooth, LoRa and GPS ──

  // a flame: the buzzer beeps and a text message goes to your phone
  smsFireAlarm: join(
    boardAt('arduino', { D8: 'invert', D12: 'follow', D13: 'alarm' }),
    above('arduino', { key: 'sms', type: 'gsm', data: (texts) => ({ text: texts.smsFire || undefined }) }, 'board:D12'),
    sensorFor('board', 'arduino', 'flameSensor'),
    outputs('board', [
      { key: 'safe', pin: 'D8', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'siren', pin: 'D13', type: 'buzzer', ohms: 100, wire: 'white' },
    ], 'sensor:GND'),
  ),
  // the temperature goes to the cloud every second; blue when it is cold, red when it is hot
  wifiWeather: join(
    boardAt('arduino', { D8: 'follow', D9: 'follow', D12: 'invert' }),
    above('arduino', { key: 'wifi', type: 'wifi' }, 'board:D9'),
    sensorFor('board', 'arduino', 'tempSensor', { sense: 0.45 }),
    outputs('board', [
      { key: 'hot', pin: 'D8', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'cold', pin: 'D12', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
    ], 'sensor:GND'),
  ),
  // a fitness band: the red light beats with your heart, and the phone gets every beat over Bluetooth
  btHeartBand: join(
    boardAt('nano', { D9: 'follow', D13: 'follow' }),
    above('nano', { key: 'bt', type: 'bluetooth' }, 'board:D9'),
    sensorFor('board', 'nano', 'pulseSensor', { sense: 0.25 }),
    outputs('board', [{ key: 'beat', pin: 'D13', type: 'led', color: 'red', ohms: 220, wire: 'white' }], 'sensor:GND'),
  ),
  // a field far from any Wi-Fi: the soil's wetness goes kilometres by LoRa; red glows when the plants are thirsty
  loraFarm: join(
    boardAt('pico', { GP10: 'invert', GP11: 'follow', GP15: 'follow' }),
    above('pico', { key: 'radio', type: 'lora' }, 'board:GP15'),
    sensorFor('board', 'pico', 'soilSensor', { sense: 0.25 }),
    outputs('board', [
      { key: 'thirsty', pin: 'GP10', type: 'led', color: 'red', ohms: 47, wire: 'white' },
      { key: 'wet', pin: 'GP11', type: 'led', color: 'green', ohms: 47, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // touch the bell: it rings inside, and the Wi-Fi tells your phone someone is at the door
  wifiDoorbell: join(
    boardAt('nano', { D8: 'on', D12: 'follow', D13: 'follow' }),
    above('nano', { key: 'wifi', type: 'wifi' }, 'board:D12'),
    sensorFor('board', 'nano', 'touchSensor'),
    outputs('board', [
      { key: 'porch', pin: 'D8', type: 'led', color: 'white', ohms: 100, wire: 'white' },
      { key: 'chime', pin: 'D13', type: 'buzzer', ohms: 100, wire: 'yellow' },
    ], 'sensor:GND'),
  ),
  // a bike computer: the GPS finds the bike, and every pulse goes to the phone on the handlebars
  gpsBike: join(
    {
      parts: [
        { key: 'board', type: 'nano', x: 0, y: 0, data: program('nano', { D8: 'on', D9: 'follow', D13: 'follow' }) },
        { key: 'gps', type: 'gps', ...SENSOR_SPOT },
      ],
      wires: [
        ['board:5V', 'gps:VCC', 'red'],
        ['gps:GND', 'board:GND', 'black'],
        ['gps:PPS', 'board:A0', 'yellow'],
      ],
    },
    above('nano', { key: 'bt', type: 'bluetooth' }, 'board:D9'),
    outputs('board', [
      { key: 'power', pin: 'D8', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'fix', pin: 'D13', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
    ], 'gps:GND'),
  ),

  // ── cars, second batch ──

  // the hazard switch: both orange lights flash together, the dashboard triangle glows and the relay ticks
  ecuHazard: join(
    boardAt('ecu', { OUT3: 'follow', OUT4: 'alarm', OUT5: 'alarm', OUT6: 'alarm' }),
    pulledDown('ecu', { key: 'sw', type: 'switch', data: { closed: true } }),
    outputs('board', [
      { key: 'tick', pin: 'OUT6', type: 'buzzer', ohms: 100, wire: 'white' },
      { key: 'left', pin: 'OUT5', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
      { key: 'right', pin: 'OUT4', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
      { key: 'dash', pin: 'OUT3', type: 'led', color: 'red', ohms: 220, wire: 'blue' },
    ], 'pull:b'),
  ),
  // press the brake pedal: the two brake lights and the high third one come on together
  ecuBrakeLights: join(
    boardAt('ecu', { OUT4: 'follow', OUT5: 'follow', OUT6: 'follow' }),
    sensorFor('board', 'ecu', 'forceSensor', { sense: 0.6 }),
    outputs('board', [
      { key: 'left', pin: 'OUT6', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'third', pin: 'OUT5', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'right', pin: 'OUT4', type: 'led', color: 'red', ohms: 220, wire: 'white' },
    ], 'sensor:GND'),
  ),
  // the buckle is a two-way switch: unbuckled, the red belt light blinks and the chime sounds
  ecuSeatbelt: join(
    {
      parts: [
        { key: 'board', type: 'ecu', x: 0, y: 0, data: program('ecu', { OUT4: 'invert', OUT5: 'alarm', OUT6: 'alarm' }) },
        { key: 'buckle', type: 'slideSwitch', x: -330, y: -230, rotation: 90, data: { closed: true } },
        { key: 'pull', type: 'resistor', x: -330, y: 30, rotation: 90, data: { resistance: 1000 } },
      ],
      wires: [
        ['board:5V', 'buckle:COM', 'red'],
        ['buckle:A', 'board:AIN', 'yellow'],
        ['buckle:A', 'pull:a', 'yellow'],
        ['pull:b', 'board:GND', 'black'],
      ],
    },
    outputs('board', [
      { key: 'chime', pin: 'OUT6', type: 'buzzer', ohms: 100, wire: 'white' },
      { key: 'belt', pin: 'OUT5', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'buckled', pin: 'OUT4', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'pull:b'),
  ),
  // open the door and the light inside comes on; the magnet on the door keeps it off while it is shut
  ecuDomeLight: join(
    {
      parts: [
        { key: 'board', type: 'ecu', x: 0, y: 0, data: program('ecu', { OUT2: 'follow', OUT6: 'follow' }) },
        { key: 'pull', type: 'resistor', x: -330, y: -230, rotation: 90, data: { resistance: 1000 } },
        { key: 'door', type: 'reed', x: -330, y: 30, rotation: 90, data: { sense: 0 } },
      ],
      wires: [
        ['board:5V', 'pull:a', 'red'],
        ['pull:b', 'board:AIN', 'yellow'],
        ['pull:b', 'door:a', 'yellow'],
        ['door:b', 'board:GND', 'black'],
      ],
    },
    outputs('board', [
      { key: 'open', pin: 'OUT6', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'dome', pin: 'OUT2', type: 'led', color: 'white', ohms: 100, wire: 'white' },
    ], 'door:b'),
  ),
  // the float in the tank sets the fuel gauge; with less than half a tank the orange light comes on
  ecuFuelGauge: join(
    boardAt('ecu', { OUT1: 'follow', OUT6: 'invert' }),
    above('ecu', { key: 'gauge', type: 'barGraph' }, 'board:OUT1'),
    sensorFor('board', 'ecu', 'waterSensor', { sense: 0.7 }),
    outputs('board', [{ key: 'low', pin: 'OUT6', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' }], 'sensor:GND'),
  ),
  // the ECU measures the 12 V car battery through two resistors; below 8 V the red battery light comes on
  ecuBattery: join(
    {
      parts: [
        { key: 'board', type: 'ecu', x: 0, y: 0, data: program('ecu', { OUT1: 'follow', OUT5: 'follow', OUT6: 'invert' }) },
        { key: 'carBat', type: 'battery', x: -620, y: -100, rotation: 270, data: { voltage: 12 } },
        { key: 'top', type: 'resistor', x: -330, y: -230, rotation: 90, data: { resistance: 2200 } },
        { key: 'bottom', type: 'resistor', x: -330, y: 30, rotation: 90, data: { resistance: 1000 } },
        { key: 'vm', type: 'voltmeter', x: -620, y: 200 },
      ],
      wires: [
        ['carBat:a', 'top:a', 'red'],
        ['top:b', 'board:AIN', 'yellow'],
        ['top:b', 'bottom:a', 'yellow'],
        ['bottom:b', 'board:GND', 'black'],
        ['carBat:b', 'board:GND', 'black'],
        ['carBat:a', 'vm:a', 'red'],
        ['vm:b', 'carBat:b', 'black'],
      ],
    },
    above('ecu', { key: 'gauge', type: 'barGraph' }, 'board:OUT1'),
    outputs('board', [
      { key: 'warn', pin: 'OUT6', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'ok', pin: 'OUT5', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'bottom:b'),
  ),
  // the button on the steering wheel: the ECU switches the loud horn through a transistor
  ecuHorn: join(
    boardAt('ecu', { OUT1: 'follow', OUT6: 'on' }),
    pulledDown('ecu', { key: 'wheel', type: 'button' }),
    driver('board:OUT1', { key: 'horn', type: 'bell' }, 'ignition:b'),
    outputs('board', [{ key: 'ignition', pin: 'OUT6', type: 'led', color: 'green', ohms: 220, wire: 'green' }], 'pull:b'),
  ),
  // the camera's line sensor sees a lane line under the car: the steering wheel shakes and it beeps
  ecuLaneAssist: join(
    boardAt('ecu', { OUT1: 'alarm', OUT4: 'alarm', OUT5: 'alarm', OUT6: 'invert' }),
    sensorFor('board', 'ecu', 'lineSensor'),
    driver('board:OUT1', { key: 'wheel', type: 'vibration' }, 'inLane:b', 3),
    outputs('board', [
      { key: 'inLane', pin: 'OUT6', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'warn', pin: 'OUT5', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
      { key: 'beeper', pin: 'OUT4', type: 'buzzer', ohms: 100, wire: 'white' },
    ], 'sensor:GND'),
  ),
  // a hot cabin: the air conditioning (blue) and a faster blower; a cold one: the heater (red)
  ecuClimate: join(
    boardAt('ecu', { OUT1: 'follow', OUT5: 'invert', OUT6: 'follow' }),
    sensorFor('board', 'ecu', 'tempSensor', { sense: 0.7 }),
    driver('board:OUT1', { key: 'blower', type: 'motor' }, 'heat:b', 3),
    outputs('board', [
      { key: 'cool', pin: 'OUT6', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
      { key: 'heat', pin: 'OUT5', type: 'led', color: 'red', ohms: 220, wire: 'white' },
    ], 'sensor:GND'),
  ),
  // a crash: the airbag light, the hazard lights, the doors unlock, and an emergency text with the car's place
  ecuCrash: join(
    boardAt('ecu', { OUT1: 'follow', OUT2: 'follow', OUT3: 'on', OUT4: 'alarm', OUT5: 'alarm', OUT6: 'follow' }),
    above('ecu', { key: 'sms', type: 'gsm', data: (texts) => ({ text: texts.smsCrash || undefined }) }, 'board:OUT1'),
    sensorFor('board', 'ecu', 'knockSensor'),
    driver('board:OUT2', { key: 'locks', type: 'solenoid' }, 'ready:b'),
    outputs('board', [
      { key: 'airbag', pin: 'OUT6', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'hazardL', pin: 'OUT5', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
      { key: 'hazardR', pin: 'OUT4', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
      { key: 'ready', pin: 'OUT3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // rev the engine with the knob: the bars climb like a rev counter and the blue shift light flashes near the top
  ecuShiftLight: join(
    {
      parts: [
        { key: 'board', type: 'ecu', x: 0, y: 0, data: program('ecu', { OUT1: 'follow', OUT2: 'follow', OUT5: 'on', OUT6: 'alarm' }) },
        { key: 'pedal', type: 'potentiometer', ...SENSOR_SPOT, data: { level: 0.4, resistance: 10000 } },
      ],
      wires: [
        ['board:5V', 'pedal:A', 'red'],
        ['pedal:B', 'board:GND', 'black'],
        ['pedal:W', 'board:AIN', 'yellow'],
      ],
    },
    above('ecu', { key: 'revs', type: 'barGraph' }, 'board:OUT1'),
    driver('board:OUT2', { key: 'engine', type: 'motor' }, 'run:b', 3),
    outputs('board', [
      { key: 'shift', pin: 'OUT6', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
      { key: 'run', pin: 'OUT5', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'pedal:B'),
  ),
  // an electric car's battery pack: the warmer it gets, the faster the coolant pump runs
  ecuEvCooling: join(
    boardAt('ecu', { OUT1: 'follow', OUT5: 'invert', OUT6: 'follow' }),
    sensorFor('board', 'ecu', 'tempSensor', { sense: 0.4 }),
    driver('board:OUT1', { key: 'pump', type: 'pump' }, 'ok:b'),
    outputs('board', [
      { key: 'hot', pin: 'OUT6', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'ok', pin: 'OUT5', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // damp air mists the windscreen: the blower clears it and the orange demister light comes on
  ecuDefog: join(
    boardAt('ecu', { OUT1: 'follow', OUT6: 'follow' }),
    sensorFor('board', 'ecu', 'humiditySensor', { sense: 0.75 }),
    driver('board:OUT1', { key: 'blower', type: 'fan' }, 'demist:b', 6, 4700),
    outputs('board', [{ key: 'demist', pin: 'OUT6', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' }], 'sensor:GND'),
  ),
  // the car is locked but something moves on the back seat: the horn, the lights, a cooling fan and a text
  ecuChildAlert: join(
    boardAt('ecu', { OUT1: 'follow', OUT2: 'follow', OUT4: 'on', OUT5: 'alarm', OUT6: 'alarm' }),
    above('ecu', { key: 'sms', type: 'gsm', data: (texts) => ({ text: texts.smsChild || undefined }) }, 'board:OUT1'),
    sensorFor('board', 'ecu', 'pir'),
    driver('board:OUT2', { key: 'fan', type: 'fan' }, 'locked:b'),
    outputs('board', [
      { key: 'horn', pin: 'OUT6', type: 'buzzer', sound: 'hilo', ohms: 100, wire: 'white' },
      { key: 'lights', pin: 'OUT5', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
      { key: 'locked', pin: 'OUT4', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),

  // ── factories, second batch ──

  // every box that passes the sensor moves the counter's light on by one: five boxes make a batch
  plcCounter: join(
    boardAt('plc', { Q0: 'follow', Q3: 'follow', Q4: 'invert' }),
    sensorFor('board', 'plc', 'irSensor'),
    {
      parts: [{ key: 'count', type: 'counter', ...DRIVER }],
      wires: [
        ['board:5V', 'count:VCC', 'red'],
        ['count:GND', 'board:GND', 'black'],
        ['board:Q0', 'count:CLK', 'blue'],
      ],
    },
    outputs('board', [
      { key: 'clear', pin: 'Q4', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'box', pin: 'Q3', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
    ], 'sensor:GND'),
  ),
  // a bottle under the nozzle: the pump fills it; no bottle, no filling
  plcBottling: join(
    boardAt('plc', { Q0: 'follow', Q3: 'follow', Q4: 'invert' }),
    sensorFor('board', 'plc', 'irSensor', { sense: 1 }),
    driver('board:Q0', { key: 'filler', type: 'pump' }, 'waiting:b'),
    outputs('board', [
      { key: 'waiting', pin: 'Q4', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'filling', pin: 'Q3', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
    ], 'sensor:GND'),
  ),
  // a batch in three steps, one second each: fill (blue), mix (the mixer turns), drain (orange)
  plcMixer: join(
    boardAt('plc', { Q0: 'step2', Q2: 'step1', Q3: 'step2', Q4: 'step3' }),
    driver('board:Q0', { key: 'mixer', type: 'motor' }, 'board:GND', 3),
    outputs('board', [
      { key: 'drain', pin: 'Q4', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
      { key: 'mix', pin: 'Q3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'fill', pin: 'Q2', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
    ]),
  ),
  // the magnet sensor spots a metal part on the belt, and the pusher kicks it into its own bin
  plcSorter: join(
    boardAt('plc', { Q0: 'follow', Q3: 'follow', Q4: 'on' }),
    sensorFor('board', 'plc', 'hallSensor'),
    driver('board:Q0', { key: 'pusher', type: 'solenoid' }, 'running:b'),
    outputs('board', [
      { key: 'running', pin: 'Q4', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'metal', pin: 'Q3', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
    ], 'sensor:GND'),
  ),
  // the press comes down only while both hands hold both buttons, so no hand can be under it
  plcTwoHand: join(
    {
      parts: [
        { key: 'board', type: 'plc', x: 0, y: 0, data: program('plc', { Q0: 'follow', Q3: 'follow', Q4: 'invert' }) },
        { key: 'both', type: 'andGate', ...SENSOR_SPOT },
        { key: 'left', type: 'button', x: -660, y: 120 },
        { key: 'right', type: 'button', x: -660, y: 400 },
      ],
      wires: [
        ['board:5V', 'both:VCC', 'red'],
        ['both:GND', 'board:GND', 'black'],
        ['both:Y', 'board:AI0', 'yellow'],
        ['board:5V', 'left:a', 'red'],
        ['board:5V', 'right:a', 'red'],
        ['left:b', 'both:A', 'yellow'],
        ['right:b', 'both:B', 'blue'],
      ],
    },
    driver('board:Q0', { key: 'ram', type: 'solenoid' }, 'ready:b'),
    outputs('board', [
      { key: 'ready', pin: 'Q4', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'pressing', pin: 'Q3', type: 'led', color: 'red', ohms: 220, wire: 'white' },
    ], 'both:GND'),
  ),
  // the crane's lifting magnet holds the steel while its switch is on, and the orange beacon turns
  plcCrane: join(
    boardAt('plc', { Q0: 'follow', Q3: 'follow', Q4: 'on' }),
    pulledDown('plc', { key: 'lift', type: 'switch', data: { closed: true } }),
    driver('board:Q0', { key: 'magnet', type: 'electromagnet' }, 'power:b'),
    outputs('board', [
      { key: 'power', pin: 'Q4', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'warn', pin: 'Q3', type: 'beacon', color: 'orange', ohms: 0, wire: 'yellow' },
    ], 'pull:b'),
  ),
  // the boiler heats (the lamp glows) until the water is hot enough, then waits
  plcBoiler: join(
    boardAt('plc', { Q0: 'invert', Q3: 'follow', Q4: 'invert' }),
    sensorFor('board', 'plc', 'tempSensor', { sense: 0.3 }),
    driver('board:Q0', { key: 'heater', type: 'lamp' }, 'heating:b', 3),
    outputs('board', [
      { key: 'heating', pin: 'Q4', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
      { key: 'ready', pin: 'Q3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // the cold room's compressor runs until the room is cold enough again
  plcColdRoom: join(
    boardAt('plc', { Q0: 'follow', Q3: 'invert', Q4: 'follow' }),
    sensorFor('board', 'plc', 'tempSensor', { sense: 0.6 }),
    driver('board:Q0', { key: 'compressor', type: 'motor' }, 'cooling:b', 3),
    outputs('board', [
      { key: 'cooling', pin: 'Q4', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
      { key: 'cold', pin: 'Q3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // the distance sensor at the top of the grain silo: the auger fills it until the grain comes close
  plcSilo: join(
    boardAt('plc', { AQ0: 'follow', Q0: 'invert', Q3: 'invert', Q4: 'follow' }),
    above('plc', { key: 'level', type: 'barGraph' }, 'board:AQ0'),
    sensorFor('board', 'plc', 'ultrasonic', { sense: 0.7 }),
    driver('board:Q0', { key: 'auger', type: 'motor' }, 'filling:b', 3),
    outputs('board', [
      { key: 'full', pin: 'Q4', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'filling', pin: 'Q3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // the bag sits on a scale: the feeder pours until the bag weighs enough, the bars show its weight
  plcScale: join(
    boardAt('plc', { AQ0: 'follow', Q0: 'invert', Q3: 'invert', Q4: 'follow' }),
    above('plc', { key: 'weight', type: 'barGraph' }, 'board:AQ0'),
    sensorFor('board', 'plc', 'forceSensor', { sense: 0.3 }),
    driver('board:Q0', { key: 'feeder', type: 'motor' }, 'full:b', 3),
    outputs('board', [
      { key: 'full', pin: 'Q4', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'pouring', pin: 'Q3', type: 'led', color: 'yellow', ohms: 220, wire: 'yellow' },
    ], 'sensor:GND'),
  ),
  // paint fumes: the more there are, the faster the extractor fan runs; too many sound the horn
  plcPaintBooth: join(
    boardAt('plc', { AQ0: 'follow', Q3: 'invert', Q4: 'alarm' }),
    sensorFor('board', 'plc', 'gasSensor', { sense: 0.3 }),
    driver('board:AQ0', { key: 'extractor', type: 'fan' }, 'clean:b', 6, 4700),
    outputs('board', [
      { key: 'horn', pin: 'Q4', type: 'buzzer', ohms: 100, wire: 'white' },
      { key: 'clean', pin: 'Q3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // the robot arm (a servo) swings back and forth; when a part is under it, its magnet grips it
  plcRobotArm: join(
    boardAt('plc', { AQ0: 'fade', Q0: 'follow', Q3: 'follow', Q4: 'on' }),
    above('plc', { key: 'arm', type: 'servo' }),
    { parts: [], wires: [['board:AQ0', 'arm:OUT', 'blue']] },
    sensorFor('board', 'plc', 'irSensor', { sense: 1 }),
    driver('board:Q0', { key: 'gripper', type: 'electromagnet' }, 'power:b'),
    outputs('board', [
      { key: 'power', pin: 'Q4', type: 'led', color: 'green', ohms: 220, wire: 'green' },
      { key: 'holding', pin: 'Q3', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
    ], 'sensor:GND'),
  ),
  // a laser beam across the machine's opening: break it with a hand and the machine stops at once
  plcLightCurtain: join(
    {
      parts: [
        { key: 'board', type: 'plc', x: 0, y: 0, data: program('plc', { Q0: 'follow', Q1: 'on', Q3: 'invert', Q4: 'invert' }) },
        { key: 'ldr', type: 'ldr', x: -330, y: -230, rotation: 90, data: { light: 1 } },
        { key: 'div', type: 'resistor', x: -330, y: 30, rotation: 90, data: { resistance: 1000 } },
      ],
      wires: [
        ['board:5V', 'ldr:a', 'red'],
        ['ldr:b', 'board:AI0', 'yellow'],
        ['ldr:b', 'div:a', 'yellow'],
        ['div:b', 'board:GND', 'black'],
      ],
    },
    driver('board:Q0', { key: 'machine', type: 'motor' }, 'div:b', 3),
    outputs('board', [
      { key: 'horn', pin: 'Q4', type: 'buzzer', ohms: 100, wire: 'white' },
      { key: 'stop', pin: 'Q3', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'beam', pin: 'Q1', type: 'laser', ohms: 0, wire: 'yellow' },
    ], 'div:b'),
  ),
  // a forklift comes to the crossing: the blue beacon turns and walkers get a red light
  plcForklift: join(
    boardAt('plc', { Q2: 'invert', Q3: 'follow', Q4: 'follow' }),
    sensorFor('board', 'plc', 'pir'),
    outputs('board', [
      { key: 'beacon', pin: 'Q4', type: 'beacon', color: 'blue', ohms: 0, wire: 'blue' },
      { key: 'stop', pin: 'Q3', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'walk', pin: 'Q2', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),

  // ── oil and gas, second batch ──

  // no power lines in the desert: the sun powers the pressure sensor and its LoRa radio
  rtuSolarSite: {
    parts: [
      { key: 'sun', type: 'solar', x: 0, y: 100, data: { light: 0.9 } },
      { key: 'radio', type: 'lora', x: 330, y: -100 },
      { key: 'sensor', type: 'pressureSensor', x: 330, y: 240, data: { sense: 0.35 } },
      { key: 'vm', type: 'voltmeter', x: 660, y: 100 },
    ],
    wires: [
      ['sun:a', 'radio:VCC', 'red'],
      ['sun:a', 'sensor:VCC', 'red'],
      ['radio:GND', 'sun:b', 'black'],
      ['sensor:GND', 'sun:b', 'black'],
      ['sensor:OUT', 'radio:IN', 'yellow'],
      ['sun:a', 'vm:a', 'red'],
      ['vm:b', 'sun:b', 'black'],
    ],
  },
  // oil floats on water: when the water in the separator rises, the dump valve lets it out
  rtuSeparator: join(
    boardAt('rtu', { AO1: 'follow', DO1: 'follow', DO3: 'invert', DO4: 'follow' }),
    above('rtu', { key: 'level', type: 'barGraph' }, 'board:AO1'),
    sensorFor('board', 'rtu', 'waterSensor', { sense: 0.3 }),
    driver('board:DO1', { key: 'valve', type: 'solenoid' }, 'ok:b'),
    outputs('board', [
      { key: 'dumping', pin: 'DO4', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
      { key: 'ok', pin: 'DO3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // the choke valve (a servo) closes as the well's pressure rises, to keep the flow steady
  rtuChoke: join(
    boardAt('rtu', { AO1: 'invert', DO3: 'invert', DO4: 'alarm' }),
    above('rtu', { key: 'choke', type: 'servo' }),
    { parts: [], wires: [['board:AO1', 'choke:OUT', 'blue']] },
    sensorFor('board', 'rtu', 'pressureSensor', { sense: 0.4 }),
    outputs('board', [
      { key: 'horn', pin: 'DO4', type: 'buzzer', sound: 'wail', ohms: 100, wire: 'white' },
      { key: 'ok', pin: 'DO3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // the pump deep in the well stops if its motor gets too hot; its temperature goes out by LoRa
  rtuEsp: join(
    boardAt('rtu', { AO1: 'follow', DO1: 'invert', DO3: 'invert', DO4: 'follow' }),
    above('rtu', { key: 'radio', type: 'lora' }, 'board:AO1'),
    sensorFor('board', 'rtu', 'tempSensor', { sense: 0.4 }),
    driver('board:DO1', { key: 'pump', type: 'pump' }, 'running:b'),
    outputs('board', [
      { key: 'trip', pin: 'DO4', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'running', pin: 'DO3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // fire on the well pad: the red beacon turns, the horn wails and the fire-water pump floods the pad
  rtuDeluge: join(
    boardAt('rtu', { DO1: 'follow', DO2: 'invert', DO3: 'follow', DO4: 'alarm' }),
    sensorFor('board', 'rtu', 'flameSensor'),
    driver('board:DO1', { key: 'deluge', type: 'pump' }, 'safe:b'),
    outputs('board', [
      { key: 'horn', pin: 'DO4', type: 'buzzer', sound: 'wail', ohms: 100, wire: 'white' },
      { key: 'beacon', pin: 'DO3', type: 'beacon', color: 'red', ohms: 0, wire: 'white' },
      { key: 'safe', pin: 'DO2', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // a cleaning "pig" travels through the pipeline with a magnet: when it arrives, the beacon turns and a text goes out
  rtuPigging: join(
    boardAt('rtu', { DO1: 'follow', DO3: 'invert', DO4: 'follow' }),
    above('rtu', { key: 'sms', type: 'gsm', data: (texts) => ({ text: texts.smsPig || undefined }) }, 'board:DO1'),
    sensorFor('board', 'rtu', 'hallSensor'),
    outputs('board', [
      { key: 'beacon', pin: 'DO4', type: 'beacon', color: 'orange', ohms: 0, wire: 'yellow' },
      { key: 'waiting', pin: 'DO3', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),

  // ── talk to the AI board, second batch ──

  // the headlights come on in the dark; ask for the hazard lights or the horn
  aiCarLights: join(
    {
      parts: [
        { key: 'board', type: 'aiBoard', x: 0, y: 0, data: program('aiBoard', { P1: 'invert' }) },
        { key: 'ldr', type: 'ldr', x: -330, y: -230, rotation: 90, data: { light: 0.15 } },
        { key: 'div', type: 'resistor', x: -330, y: 30, rotation: 90, data: { resistance: 1000 } },
      ],
      wires: [
        ['board:5V', 'ldr:a', 'red'],
        ['ldr:b', 'board:IN', 'yellow'],
        ['ldr:b', 'div:a', 'yellow'],
        ['div:b', 'board:GND', 'black'],
      ],
    },
    outputs('board', [
      { key: 'horn', pin: 'P4', type: 'buzzer', ohms: 100, wire: 'blue' },
      { key: 'left', pin: 'P3', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
      { key: 'right', pin: 'P2', type: 'led', color: 'orange', ohms: 220, wire: 'yellow' },
      { key: 'head', pin: 'P1', type: 'led', color: 'white', ohms: 100, wire: 'white' },
    ], 'div:b'),
  ),
  // the belt runs and the green light is on; ask it to stop the belt when a box reaches the sensor
  aiFactoryLine: join(
    boardAt('aiBoard', { P1: 'on', P2: 'on' }),
    sensorFor('board', 'aiBoard', 'irSensor'),
    driver('board:P1', { key: 'belt', type: 'motor' }, 'running:b', 3),
    outputs('board', [
      { key: 'box', pin: 'P3', type: 'led', color: 'red', ohms: 220, wire: 'white' },
      { key: 'running', pin: 'P2', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // green while the air is clean; ask it to turn the beacon, sound the horn and text you when there is gas
  aiWellGuard: join(
    boardAt('aiBoard', { P1: 'invert' }),
    above('aiBoard', { key: 'sms', type: 'gsm', data: (texts) => ({ text: texts.smsGas || undefined }) }, 'board:P4'),
    sensorFor('board', 'aiBoard', 'gasSensor', { sense: 0.1 }),
    outputs('board', [
      { key: 'horn', pin: 'P3', type: 'buzzer', sound: 'wail', ohms: 100, wire: 'white' },
      { key: 'beacon', pin: 'P2', type: 'beacon', color: 'red', ohms: 0, wire: 'white' },
      { key: 'safe', pin: 'P1', type: 'led', color: 'green', ohms: 220, wire: 'green' },
    ], 'sensor:GND'),
  ),
  // red when hot, blue when cold; ask it to send the temperature to the cloud
  aiWeatherCloud: join(
    boardAt('aiBoard', { P2: 'follow', P3: 'invert' }),
    above('aiBoard', { key: 'wifi', type: 'wifi' }, 'board:P1'),
    sensorFor('board', 'aiBoard', 'tempSensor', { sense: 0.25 }),
    outputs('board', [
      { key: 'cold', pin: 'P3', type: 'led', color: 'blue', ohms: 47, wire: 'blue' },
      { key: 'hot', pin: 'P2', type: 'led', color: 'red', ohms: 220, wire: 'white' },
    ], 'sensor:GND'),
  ),
  // the blue light blinks while it keeps watch; ask for the floodlight or the alarm when someone moves
  aiNightGuard: join(
    boardAt('aiBoard', { P1: 'blink' }),
    sensorFor('board', 'aiBoard', 'pir'),
    outputs('board', [
      { key: 'alarm', pin: 'P3', type: 'buzzer', ohms: 100, wire: 'white' },
      { key: 'flood', pin: 'P2', type: 'led', color: 'white', ohms: 100, wire: 'white' },
      { key: 'watch', pin: 'P1', type: 'led', color: 'blue', ohms: 100, wire: 'blue' },
    ], 'sensor:GND'),
  ),
  // one RGB LED with its red, green and blue parts on three pins: ask for any colour or a rainbow
  aiMoodLamp: {
    parts: [
      { key: 'board', type: 'aiBoard', x: 0, y: 0, data: program('aiBoard', { P1: 'fade', P2: 'blink', P3: 'blink2' }) },
      { key: 'rR', type: 'resistor', x: FIRST_COLUMN, y: RESISTOR_ROW, rotation: 90, data: { resistance: 220 } },
      { key: 'rG', type: 'resistor', x: FIRST_COLUMN + COLUMN, y: RESISTOR_ROW, rotation: 90, data: { resistance: 220 } },
      { key: 'rB', type: 'resistor', x: FIRST_COLUMN + 2 * COLUMN, y: RESISTOR_ROW, rotation: 90, data: { resistance: 100 } },
      { key: 'lamp', type: 'rgbLed', x: FIRST_COLUMN + COLUMN, y: OUTPUT_ROW + 20 },
    ],
    wires: [
      ['board:P1', 'rR:a', 'red'],
      ['board:P2', 'rG:a', 'green'],
      ['board:P3', 'rB:a', 'blue'],
      ['rR:b', 'lamp:R', 'red'],
      ['rG:b', 'lamp:G', 'green'],
      ['rB:b', 'lamp:B', 'blue'],
      ['lamp:K', 'board:GND', 'black'],
    ],
  },
}

/** How hard an example is to understand: 1 easy, 2 medium, 3 hard. */
export type PresetLevel = 1 | 2 | 3

/** The shelves of the examples gallery. */
export type PresetCategory =
  | 'first'
  | 'electronics'
  | 'science'
  | 'logic'
  | 'boards'
  | 'smart'
  | 'sound'
  | 'motion'
  | 'home'
  | 'games'
  | 'screens'
  | 'ai'
  | 'iot'
  | 'car'
  | 'factory'
  | 'oil'

export const PRESET_CATEGORIES: readonly PresetCategory[] = [
  'first',
  'electronics',
  'science',
  'logic',
  'boards',
  'smart',
  'iot',
  'car',
  'factory',
  'oil',
  'ai',
  'sound',
  'motion',
  'home',
  'games',
  'screens',
]

/** A part in an example's picture; LEDs can say their colour (`led:green`). */
export type PresetArt = PartType | `led:${LedColor}`

export type PresetInfo = {
  category: PresetCategory
  level: PresetLevel
  /** the main parts, drawn together as the example's little picture (2 to 4) */
  art: readonly PresetArt[]
}

/** Where each example sits in the gallery, how hard it is and what its picture shows. */
export const PRESET_INFO: Record<PresetId, PresetInfo> = {
  flashlight: { category: 'first', level: 1, art: ['battery', 'switch', 'lamp'] },
  fan: { category: 'first', level: 1, art: ['battery', 'switch', 'motor'] },
  doorbell: { category: 'first', level: 1, art: ['battery', 'button', 'buzzer'] },
  led: { category: 'first', level: 1, art: ['battery', 'resistor', 'led:green'] },
  rainbow: { category: 'first', level: 1, art: ['battery', 'led:red', 'led:green', 'led:blue'] },
  batteryTester: { category: 'first', level: 1, art: ['battery', 'voltmeter', 'led:green'] },
  series: { category: 'first', level: 1, art: ['battery', 'lamp', 'lamp'] },
  parallel: { category: 'first', level: 1, art: ['battery', 'lamp', 'lamp'] },
  dimmer: { category: 'first', level: 1, art: ['battery', 'dimmer', 'lamp'] },
  short: { category: 'first', level: 1, art: ['battery', 'switch'] },

  solar: { category: 'electronics', level: 1, art: ['solar', 'motor'] },
  transistor: { category: 'electronics', level: 2, art: ['button', 'transistor', 'lamp'] },
  capacitor: { category: 'electronics', level: 2, art: ['battery', 'capacitor', 'led:yellow'] },
  fuseGuard: { category: 'electronics', level: 2, art: ['battery', 'fuse', 'lamp'] },
  solarGarden: { category: 'electronics', level: 2, art: ['solar', 'diode', 'capacitor', 'led:yellow'] },
  noiseLight: { category: 'electronics', level: 2, art: ['soundSensor', 'transistor', 'lamp'] },
  streetLamp: { category: 'electronics', level: 3, art: ['ldr', 'transistor', 'lamp'] },

  arduino: { category: 'boards', level: 1, art: ['arduino', 'resistor', 'led'] },
  servo: { category: 'boards', level: 2, art: ['arduino', 'servo'] },
  trafficLight: { category: 'boards', level: 2, art: ['pico', 'led:red', 'led:yellow', 'led:green'] },
  policeLights: { category: 'boards', level: 2, art: ['nano', 'led:red', 'led:blue', 'buzzer'] },
  railroad: { category: 'boards', level: 2, art: ['arduino', 'led', 'servo'] },
  holidayLights: { category: 'boards', level: 2, art: ['raspberrypi', 'led:green', 'matrix'] },
  partyLights: { category: 'boards', level: 3, art: ['mega', 'led:green', 'led:blue', 'matrix'] },

  motion: { category: 'smart', level: 2, art: ['pir', 'arduino', 'led:green'] },
  nightLight: { category: 'smart', level: 2, art: ['ldr', 'microbit', 'led:yellow'] },
  autoDoor: { category: 'smart', level: 2, art: ['pir', 'arduino', 'servo'] },
  plantAlarm: { category: 'smart', level: 2, art: ['soilSensor', 'arduino', 'oled'] },
  smokeAlarm: { category: 'smart', level: 2, art: ['gasSensor', 'arduino', 'buzzer'] },
  parkingSensor: { category: 'smart', level: 2, art: ['ultrasonic', 'nano', 'buzzer'] },
  doorAlarm: { category: 'smart', level: 2, art: ['reed', 'arduino', 'buzzer'] },
  smartFan: { category: 'smart', level: 3, art: ['tempSensor', 'esp32', 'transistor', 'motor'] },
  radar: { category: 'smart', level: 3, art: ['ultrasonic', 'mega', 'servo'] },
  smartHome: { category: 'smart', level: 3, art: ['pir', 'arduino', 'esp32', 'lcd'] },

  counter: { category: 'screens', level: 1, art: ['battery', 'segment'] },
  goldSign: { category: 'screens', level: 1, art: ['battery', 'matrix'] },
  pocketTv: { category: 'screens', level: 1, art: ['battery', 'switch', 'tft'] },
  doorbellScreen: { category: 'screens', level: 1, art: ['button', 'lcd', 'buzzer'] },
  thermometer: { category: 'screens', level: 2, art: ['battery', 'tempSensor', 'segment'] },
  busStop: { category: 'screens', level: 2, art: ['solar', 'lcd', 'segment'] },
  scoreboard: { category: 'screens', level: 2, art: ['battery', 'segment', 'matrix'] },
  cityTv: { category: 'screens', level: 2, art: ['solar', 'ledwall', 'matrix'] },

  hairDryer: { category: 'first', level: 1, art: ['battery', 'switch', 'motor', 'lamp'] },
  bikeBell: { category: 'first', level: 1, art: ['battery', 'lamp', 'button', 'buzzer'] },
  carLights: { category: 'first', level: 1, art: ['battery', 'switch', 'led:white', 'led:red'] },
  morseKey: { category: 'first', level: 1, art: ['button', 'buzzer', 'led:yellow', 'lcd'] },

  knobDimmer: { category: 'electronics', level: 1, art: ['battery', 'potentiometer', 'led:green'] },
  diodeCheck: { category: 'electronics', level: 2, art: ['battery', 'diode', 'lamp'] },
  relayLamp: { category: 'electronics', level: 2, art: ['switch', 'relay', 'lamp'] },
  safeShort: { category: 'electronics', level: 2, art: ['powerSupply', 'lamp', 'switch'] },
  phoneCharger: { category: 'electronics', level: 2, art: ['battery', 'regulator', 'tft'] },
  delayLight: { category: 'electronics', level: 3, art: ['capacitor', 'transistor', 'lamp'] },

  meters: { category: 'science', level: 1, art: ['ammeter', 'lamp', 'voltmeter'] },
  scopeKnob: { category: 'science', level: 1, art: ['battery', 'potentiometer', 'oscilloscope'] },
  lightMeter: { category: 'science', level: 1, art: ['battery', 'ldr', 'voltmeter'] },
  solarMeter: { category: 'science', level: 1, art: ['solar', 'ammeter', 'led:green'] },
  ohmsLaw: { category: 'science', level: 2, art: ['powerSupply', 'resistor', 'ammeter'] },
  magnetLab: { category: 'science', level: 2, art: ['powerSupply', 'ammeter', 'electromagnet'] },
  scopeSquare: { category: 'science', level: 2, art: ['timer555', 'led:red', 'oscilloscope'] },
  scopeCap: { category: 'science', level: 2, art: ['resistor', 'capacitor', 'oscilloscope'] },
  scopeBreath: { category: 'science', level: 2, art: ['arduino', 'led:yellow', 'oscilloscope'] },

  flasher555: { category: 'logic', level: 1, art: ['battery', 'timer555', 'led:red', 'led:red'] },
  darkLamp: { category: 'logic', level: 2, art: ['ldr', 'notGate', 'led:yellow'] },
  stairLight: { category: 'logic', level: 2, art: ['switch', 'switch', 'xorGate', 'led:white'] },
  safeLock: { category: 'logic', level: 2, art: ['button', 'button', 'andGate', 'led:green'] },
  twoDoors: { category: 'logic', level: 2, art: ['button', 'button', 'orGate', 'buzzer'] },
  halfAdder: { category: 'logic', level: 3, art: ['switch', 'xorGate', 'andGate', 'led:yellow'] },
  seatbelt: { category: 'logic', level: 3, art: ['timer555', 'notGate', 'andGate', 'buzzer'] },

  fireflies: { category: 'boards', level: 1, art: ['pico', 'led:yellow', 'led:green'] },
  chaser: { category: 'boards', level: 2, art: ['esp32', 'led:red', 'led:red', 'led:red'] },

  rainAlert: { category: 'smart', level: 2, art: ['soilSensor', 'nano', 'led:blue', 'buzzer'] },
  laserAlarm: { category: 'smart', level: 2, art: ['ldr', 'arduino', 'buzzer'] },
  babyMonitor: { category: 'smart', level: 2, art: ['soundSensor', 'arduino', 'lcd'] },
  greenhouse: { category: 'smart', level: 3, art: ['soilSensor', 'arduino', 'transistor', 'motor'] },

  piano: { category: 'sound', level: 1, art: ['button', 'speaker', 'speaker', 'speaker'] },
  metronome: { category: 'sound', level: 2, art: ['battery', 'timer555', 'buzzer', 'led:green'] },
  siren: { category: 'sound', level: 2, art: ['powerSupply', 'timer555', 'speaker', 'speaker'] },
  musicBox: { category: 'sound', level: 2, art: ['arduino', 'speaker', 'speaker', 'speaker'] },
  morningBird: { category: 'sound', level: 2, art: ['ldr', 'arduino', 'speaker'] },
  ambulance: { category: 'sound', level: 1, art: ['nano', 'led:red', 'led:white', 'buzzer'] },
  dingDong: { category: 'sound', level: 3, art: ['button', 'speaker', 'capacitor', 'speaker'] },

  toothbrush: { category: 'motion', level: 1, art: ['battery', 'switch', 'vibration'] },
  toyCar: { category: 'motion', level: 1, art: ['battery', 'switch', 'motor', 'motor'] },
  crane: { category: 'motion', level: 1, art: ['battery', 'switch', 'electromagnet', 'motor'] },
  fanKnob: { category: 'motion', level: 2, art: ['potentiometer', 'transistor', 'motor'] },
  robotArm: { category: 'motion', level: 2, art: ['powerSupply', 'potentiometer', 'servo'] },
  phoneBuzz: { category: 'motion', level: 2, art: ['regulator', 'timer555', 'vibration', 'tft'] },
  robotHead: { category: 'motion', level: 2, art: ['arduino', 'servo', 'led:blue', 'speaker'] },
  conveyor: { category: 'motion', level: 3, art: ['powerSupply', 'button', 'relay', 'motor'] },
  gasPedal: { category: 'motion', level: 3, art: ['potentiometer', 'transistor', 'motor', 'segment'] },
  robotCar: { category: 'motion', level: 3, art: ['ultrasonic', 'arduino', 'transistor', 'motor'] },

  lighthouse: { category: 'home', level: 1, art: ['battery', 'timer555', 'led:white', 'led:white'] },
  fridgeLight: { category: 'home', level: 2, art: ['reed', 'notGate', 'led:white'] },
  moodLamp: { category: 'home', level: 2, art: ['potentiometer', 'potentiometer', 'rgbLed'] },
  bikeLights: { category: 'home', level: 2, art: ['switch', 'timer555', 'led:white', 'led:red'] },
  alarmClock: { category: 'home', level: 2, art: ['regulator', 'segment', 'timer555', 'buzzer'] },
  christmasTree: { category: 'home', level: 2, art: ['mega', 'led:green', 'rgbLed', 'matrix'] },
  crossing: { category: 'home', level: 2, art: ['button', 'arduino', 'led:red', 'led:green'] },
  gardenLamp: { category: 'home', level: 3, art: ['ldr', 'notGate', 'relay', 'lamp'] },

  stopwatch: { category: 'games', level: 1, art: ['battery', 'switch', 'segment'] },
  steadyHand: { category: 'games', level: 1, art: ['battery', 'tilt', 'buzzer'] },
  quizBoard: { category: 'games', level: 2, art: ['lcd', 'button', 'led:green', 'buzzer'] },
  shoutMeter: { category: 'games', level: 2, art: ['soundSensor', 'segment', 'oled'] },
  disco: { category: 'games', level: 2, art: ['nano', 'rgbLed', 'speaker', 'matrix'] },
  reactionGame: { category: 'games', level: 3, art: ['timer555', 'button', 'andGate', 'speaker'] },

  openSign: { category: 'screens', level: 1, art: ['battery', 'switch', 'matrix'] },
  pharmacySign: { category: 'screens', level: 1, art: ['battery', 'matrix'] },
  newsDesk: { category: 'screens', level: 1, art: ['battery', 'tft', 'matrix'] },
  cafeMenu: { category: 'screens', level: 1, art: ['battery', 'lcd', 'matrix'] },
  elevator: { category: 'screens', level: 2, art: ['segment', 'lcd', 'button', 'buzzer'] },
  weatherStation: { category: 'screens', level: 2, art: ['tempSensor', 'oled', 'lcd'] },
  airportBoard: { category: 'screens', level: 2, art: ['powerSupply', 'lcd', 'segment'] },
  cinemaSign: { category: 'screens', level: 2, art: ['mega', 'led:yellow', 'matrix'] },

  aiTrafficLight: { category: 'ai', level: 1, art: ['aiBoard', 'led:red', 'led:yellow', 'led:green'] },
  aiPartyLights: { category: 'ai', level: 1, art: ['aiBoard', 'led:red', 'led:green', 'led:blue'] },
  aiRobotPet: { category: 'ai', level: 2, art: ['touchSensor', 'aiBoard', 'servo', 'led:blue'] },
  aiSmartHome: { category: 'ai', level: 2, art: ['ldr', 'aiBoard', 'motor', 'buzzer'] },
  aiPlantHelper: { category: 'ai', level: 3, art: ['soilSensor', 'aiBoard', 'transistor', 'motor'] },
  aiMoodLamp: { category: 'ai', level: 1, art: ['aiBoard', 'rgbLed'] },
  aiCarLights: { category: 'ai', level: 1, art: ['ldr', 'aiBoard', 'led:white', 'buzzer'] },
  aiNightGuard: { category: 'ai', level: 2, art: ['pir', 'aiBoard', 'led:white', 'buzzer'] },
  aiWeatherCloud: { category: 'ai', level: 2, art: ['tempSensor', 'aiBoard', 'wifi'] },
  aiFactoryLine: { category: 'ai', level: 2, art: ['irSensor', 'aiBoard', 'transistor', 'motor'] },
  aiWellGuard: { category: 'ai', level: 3, art: ['gasSensor', 'aiBoard', 'beacon', 'gsm'] },

  ecuHeadlights: { category: 'car', level: 1, art: ['ldr', 'ecu', 'led:white'] },
  ecuCooling: { category: 'car', level: 2, art: ['tempSensor', 'ecu', 'transistor', 'fan'] },
  ecuWipers: { category: 'car', level: 2, art: ['rainSensor', 'ecu', 'servo'] },
  ecuParking: { category: 'car', level: 2, art: ['ultrasonic', 'ecu', 'barGraph', 'buzzer'] },
  ecuAlarm: { category: 'car', level: 2, art: ['knockSensor', 'ecu', 'gsm', 'buzzer'] },
  ecuCanDash: { category: 'car', level: 3, art: ['potentiometer', 'ecu', 'canBus', 'motor'] },
  ecuTracker: { category: 'car', level: 3, art: ['gps', 'ecu', 'lora', 'led:green'] },
  ecuHazard: { category: 'car', level: 1, art: ['switch', 'ecu', 'led:yellow', 'buzzer'] },
  ecuBrakeLights: { category: 'car', level: 1, art: ['forceSensor', 'ecu', 'led:red'] },
  ecuDomeLight: { category: 'car', level: 1, art: ['reed', 'ecu', 'led:white'] },
  ecuHorn: { category: 'car', level: 1, art: ['button', 'ecu', 'transistor', 'bell'] },
  ecuSeatbelt: { category: 'car', level: 2, art: ['slideSwitch', 'ecu', 'led:red', 'buzzer'] },
  ecuFuelGauge: { category: 'car', level: 2, art: ['waterSensor', 'ecu', 'barGraph'] },
  ecuClimate: { category: 'car', level: 2, art: ['tempSensor', 'ecu', 'motor', 'led:blue'] },
  ecuDefog: { category: 'car', level: 2, art: ['humiditySensor', 'ecu', 'fan'] },
  ecuLaneAssist: { category: 'car', level: 2, art: ['lineSensor', 'ecu', 'vibration', 'buzzer'] },
  ecuShiftLight: { category: 'car', level: 2, art: ['potentiometer', 'ecu', 'barGraph', 'led:blue'] },
  ecuBattery: { category: 'car', level: 3, art: ['battery', 'resistor', 'ecu', 'voltmeter'] },
  ecuEvCooling: { category: 'car', level: 3, art: ['tempSensor', 'ecu', 'transistor', 'pump'] },
  ecuCrash: { category: 'car', level: 3, art: ['knockSensor', 'ecu', 'solenoid', 'gsm'] },
  ecuChildAlert: { category: 'car', level: 3, art: ['pir', 'ecu', 'fan', 'gsm'] },

  plcAndon: { category: 'factory', level: 1, art: ['plc', 'trafficLight', 'buzzer'] },
  plcConveyor: { category: 'factory', level: 2, art: ['irSensor', 'plc', 'transistor', 'motor'] },
  plcTank: { category: 'factory', level: 2, art: ['waterSensor', 'plc', 'pump'] },
  plcSafety: { category: 'factory', level: 2, art: ['slideSwitch', 'plc', 'motor', 'led:red'] },
  plcBurner: { category: 'factory', level: 2, art: ['flameSensor', 'plc', 'solenoid'] },
  plcModbus: { category: 'factory', level: 3, art: ['tempSensor', 'plc', 'rs485', 'fan'] },
  plcHydraulic: { category: 'factory', level: 3, art: ['pressureSensor', 'plc', 'pump', 'wifi'] },
  plcBottling: { category: 'factory', level: 1, art: ['irSensor', 'plc', 'pump'] },
  plcBoiler: { category: 'factory', level: 1, art: ['tempSensor', 'plc', 'lamp'] },
  plcColdRoom: { category: 'factory', level: 1, art: ['tempSensor', 'plc', 'motor', 'led:blue'] },
  plcForklift: { category: 'factory', level: 1, art: ['pir', 'plc', 'beacon'] },
  plcCounter: { category: 'factory', level: 2, art: ['irSensor', 'plc', 'counter'] },
  plcMixer: { category: 'factory', level: 2, art: ['plc', 'motor', 'led:blue'] },
  plcSorter: { category: 'factory', level: 2, art: ['hallSensor', 'plc', 'solenoid'] },
  plcCrane: { category: 'factory', level: 2, art: ['switch', 'plc', 'electromagnet', 'beacon'] },
  plcScale: { category: 'factory', level: 2, art: ['forceSensor', 'plc', 'barGraph', 'motor'] },
  plcPaintBooth: { category: 'factory', level: 2, art: ['gasSensor', 'plc', 'fan', 'buzzer'] },
  plcSilo: { category: 'factory', level: 3, art: ['ultrasonic', 'plc', 'barGraph', 'motor'] },
  plcTwoHand: { category: 'factory', level: 3, art: ['button', 'button', 'andGate', 'plc'] },
  plcRobotArm: { category: 'factory', level: 3, art: ['irSensor', 'plc', 'servo', 'electromagnet'] },
  plcLightCurtain: { category: 'factory', level: 3, art: ['laser', 'ldr', 'plc', 'motor'] },

  rtuWellhead: { category: 'oil', level: 2, art: ['pressureSensor', 'rtu', 'lora', 'buzzer'] },
  rtuGasLeak: { category: 'oil', level: 2, art: ['gasSensor', 'rtu', 'gsm', 'buzzer'] },
  rtuFlare: { category: 'oil', level: 2, art: ['flameSensor', 'rtu', 'gsm'] },
  rtuPumpJack: { category: 'oil', level: 2, art: ['waterSensor', 'rtu', 'motor', 'barGraph'] },
  rtuTankFarm: { category: 'oil', level: 2, art: ['waterSensor', 'rtu', 'wifi', 'barGraph'] },
  rtuPipeline: { category: 'oil', level: 3, art: ['pressureSensor', 'rtu', 'pump', 'rs485'] },
  rtuSolarSite: { category: 'oil', level: 1, art: ['solar', 'pressureSensor', 'lora'] },
  rtuPigging: { category: 'oil', level: 2, art: ['hallSensor', 'rtu', 'beacon', 'gsm'] },
  rtuSeparator: { category: 'oil', level: 2, art: ['waterSensor', 'rtu', 'solenoid', 'barGraph'] },
  rtuChoke: { category: 'oil', level: 2, art: ['pressureSensor', 'rtu', 'servo'] },
  rtuEsp: { category: 'oil', level: 3, art: ['tempSensor', 'rtu', 'pump', 'lora'] },
  rtuDeluge: { category: 'oil', level: 3, art: ['flameSensor', 'rtu', 'beacon', 'pump'] },

  wifiWeather: { category: 'iot', level: 1, art: ['tempSensor', 'arduino', 'wifi'] },
  wifiDoorbell: { category: 'iot', level: 1, art: ['touchSensor', 'nano', 'wifi', 'buzzer'] },
  smsFireAlarm: { category: 'iot', level: 2, art: ['flameSensor', 'arduino', 'gsm', 'buzzer'] },
  btHeartBand: { category: 'iot', level: 2, art: ['pulseSensor', 'nano', 'bluetooth', 'led:red'] },
  loraFarm: { category: 'iot', level: 2, art: ['soilSensor', 'pico', 'lora'] },
  gpsBike: { category: 'iot', level: 3, art: ['gps', 'nano', 'bluetooth', 'led:blue'] },
}

/** Every example, shelf by shelf, easiest first. */
export const PRESET_ORDER: PresetId[] = PRESET_CATEGORIES.flatMap((category) =>
  (Object.keys(PRESET_INFO) as PresetId[])
    .filter((id) => PRESET_INFO[id].category === category)
    // a stable sort keeps the hand-picked order inside each level
    .sort((a, b) => PRESET_INFO[a].level - PRESET_INFO[b].level),
)

/** Builds a fresh board (new ids every time) from a preset. */
export function buildPreset(id: PresetId, texts: Partial<PresetTexts> = {}): CircuitSnapshot {
  const preset = PRESETS[id]
  const suffix = crypto.randomUUID().slice(0, 6)
  const nodeId = (key: string) => `${key}-${suffix}`

  const nodes: PartNode[] = preset.parts.map((p) => ({
    id: nodeId(p.key),
    type: 'part',
    position: { x: p.x, y: p.y },
    data: { ...createPartData(p.type), rotation: p.rotation ?? 0, ...(typeof p.data === 'function' ? p.data(texts) : p.data) },
  }))

  const edges: WireEdge[] = preset.wires.map(([from, to, color], index) => {
    const [sourceKey, sourceHandle] = from.split(':')
    const [targetKey, targetHandle] = to.split(':')
    return {
      id: `wire-${index}-${suffix}`,
      type: 'wire',
      source: nodeId(sourceKey),
      sourceHandle,
      target: nodeId(targetKey),
      targetHandle,
      data: { color },
    }
  })

  return { nodes, edges }
}
