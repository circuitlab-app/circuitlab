import type { Edge, Node } from '@xyflow/react'

export type PartType =
  | 'battery'
  | 'solar'
  | 'arduino'
  | 'nano'
  | 'mega'
  | 'esp32'
  | 'esp8266'
  | 'pico'
  | 'microbit'
  | 'raspberrypi'
  // a board you talk to: a language model on your own computer (Ollama) sets its pins
  | 'aiBoard'
  | 'switch'
  | 'button'
  | 'dimmer'
  | 'resistor'
  | 'capacitor'
  | 'diode'
  | 'transistor'
  | 'fuse'
  | 'lamp'
  | 'led'
  | 'motor'
  | 'buzzer'
  | 'servo'
  | 'ldr'
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
  | 'slideSwitch'
  | 'microSwitch'
  | 'joystick'
  | 'lemon'
  | 'coinCell'
  | 'dynamo'
  | 'powerBank'
  | 'voltmeter'
  | 'ammeter'
  | 'segment'
  | 'lcd'
  | 'oled'
  | 'tft'
  | 'matrix'
  | 'ledwall'
  | 'powerSupply'
  | 'potentiometer'
  | 'relay'
  | 'rgbLed'
  | 'speaker'
  | 'vibration'
  | 'electromagnet'
  | 'regulator'
  | 'notGate'
  | 'andGate'
  | 'orGate'
  | 'xorGate'
  | 'timer555'
  | 'oscilloscope'
  // more components, outputs, chips and meters
  | 'zener'
  | 'pnp'
  | 'mosfet'
  | 'optocoupler'
  | 'laser'
  | 'irLed'
  | 'solenoid'
  | 'pump'
  | 'bell'
  | 'barGraph'
  | 'trafficLight'
  | 'fan'
  | 'nandGate'
  | 'norGate'
  | 'latch'
  | 'counter'
  | 'comparator'
  | 'hBridge'
  | 'multimeter'
  | 'logicProbe'
  // boards from the real world: a car's engine computer, a factory PLC and an oil well's remote unit
  | 'ecu'
  | 'plc'
  | 'rtu'
  // modules that send messages: by SMS, Wi-Fi, Bluetooth and LoRa, a GPS, and the wired CAN and RS-485 buses
  | 'gsm'
  | 'wifi'
  | 'bluetooth'
  | 'lora'
  | 'gps'
  | 'canBus'
  | 'rs485'
  // an industrial pressure sensor with its own dial, as on an oil well or an air line
  | 'pressureSensor'

/** What a screen shows. Each kind of screen offers some of these (see `DISPLAY_MODES`). */
export type DisplayMode =
  | 'number'
  | 'counter'
  | 'clock'
  | 'volts'
  | 'text'
  | 'scroll'
  | 'graph'
  | 'picture'
  | 'demo'

/** The colour of a screen's light: its LEDs, its backlight or its pixels. */
export type DisplayTint = 'red' | 'green' | 'blue' | 'yellow' | 'white' | 'rainbow' | 'yellowBlue'

/** How the words move on an LED sign. */
export type SignEffect = 'scrollLeft' | 'scrollRight' | 'static' | 'blink' | 'sparkle'

/** Built-in animations for the colour screens. `reel` plays all of them in turn. */
export type DemoId = 'reel' | 'cityAd' | 'fireworks' | 'rainbow' | 'news' | 'clock' | 'bars'

/** A photo or video a child added to a screen. The file itself lives in IndexedDB. */
export type MediaRef = { id: string; name: string; kind: 'image' | 'video' }

/** Clockwise rotation of a part on the board, in degrees. */
export type Rotation = 0 | 90 | 180 | 270

/**
 * A connection point on a part. Simple parts have `a` and `b`; a transistor
 * has `B`, `C` and `E`; the Arduino has one per pin (`5V`, `GND`, `D13` …).
 */
export type TerminalId = string

export type Side = 'left' | 'top' | 'right' | 'bottom'

export type LampColor = 'warm' | 'yellow' | 'red' | 'green' | 'blue'
export type LedColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'white' | 'pink'

/**
 * What a buzzer plays. `wail` is the slow up-and-down police siren, `yelp`
 * the fast one police use in heavy traffic, `hilo` the two-tone nee-naw.
 */
export type BuzzerSound = 'beep' | 'wail' | 'yelp' | 'hilo'
export type WireColor = 'red' | 'black' | 'blue' | 'yellow' | 'green' | 'white'

/**
 * What an Arduino pin does: stay low, stay high, blink, blink while the
 * `blink` pins rest (`blink2`), light up in its turn of a 3-step loop
 * (`step1` … `step3`: traffic lights, chasers), fade up and down (PWM pins),
 * follow the sensor on A0, do the opposite of it (`invert`: on in the dark,
 * on when dry), or beep while the sensor reads high, faster the higher it
 * reads (`alarm`).
 */
export type PinMode =
  | 'off'
  | 'on'
  | 'blink'
  | 'blink2'
  | 'step1'
  | 'step2'
  | 'step3'
  | 'fade'
  | 'follow'
  | 'invert'
  | 'alarm'

/**
 * Data stored on a React Flow node. It is a `type` (not an `interface`) so it
 * satisfies React Flow's `Record<string, unknown>` constraint.
 */
export type PartData = {
  type: PartType
  rotation: Rotation
  /** battery: nominal voltage; bench power supply: the voltage it is set to */
  voltage?: number
  /** lamp / led: colour key */
  color?: LampColor | LedColor
  /** switch: lever position; slide switch: false joins COM to A, true joins COM to B */
  closed?: boolean
  /** push button / micro switch: held down right now (never persisted) */
  pressed?: boolean
  /** resistor: ohms; potentiometer: ohms from end to end */
  resistance?: number
  /** dimmer / potentiometer: knob position 0..1; crank generator: how fast the crank turns, 0..1 */
  level?: number
  /** lemon battery: how many lemons in a row, 1..4 */
  cells?: number
  /** joystick: where the stick is pushed, 0..1 (0.5 is the middle): left → right and down → up */
  stickX?: number
  stickY?: number
  /** capacitor: microfarads */
  capacitance?: number
  /** fuse: amps it can carry before it blows */
  rating?: number
  /** light sensor / solar panel: how much light falls on it, 0..1 */
  light?: number
  /**
   * sensors: the world around them, 0..1 — how hot, how far, how loud, how much
   * smoke or water; 0 or 1 for motion, touch, tilt and a magnet nearby
   */
  sense?: number
  /** arduino: the "program" of each output pin */
  pins?: Record<string, PinMode>
  /** lamp / led / diode / fuse / transistor: destroyed by too much power */
  burnt?: boolean
  /** screens: what they show */
  mode?: DisplayMode
  /** screens: the colour of their light */
  tint?: DisplayTint
  /** screens: the words or number shown, lines split by "\n"; unset shows a sample in the app's language */
  text?: string
  /** 7-segment display: how many digits */
  digits?: number
  /** LCD: letters per line × lines; LED sign: modules across × down; LED wall: panels across × down */
  cols?: number
  rows?: number
  /** LED sign: how the words move */
  effect?: SignEffect
  /** LED sign: how fast the words move, 0..1 */
  speed?: number
  /** LED sign and LED wall: 0.1..1 */
  brightness?: number
  /** TFT and LED wall: which built-in animation plays */
  demo?: DemoId
  /** LED wall: false while paused */
  playing?: boolean
  /** OLED, TFT and LED wall: the photo or video shown in "picture" mode */
  media?: MediaRef
  /** bench power supply: the most current it lets out, in amps */
  limit?: number
  /** speaker: the note it plays, in hertz */
  pitch?: number
  /** buzzer: a plain beep, or the siren chip inside it (police wail, fast yelp, two-tone) */
  sound?: BuzzerSound
  /** 555 blinker: blinks per second */
  rate?: number
  /** oscilloscope: seconds shown across the screen */
  span?: number
  /** multimeter: what its dial is turned to */
  dial?: MeterDial
  /** IR LED: seen through a phone camera (true) or with your own eyes */
  camera?: boolean
  /** SMS module: the number it texts (its message is in `text`) */
  phone?: string
}

/** The multimeter's dial: volts, amps, ohms, or ohms with a beep for a joined path. */
export type MeterDial = 'volts' | 'amps' | 'ohms' | 'beep'

export type WireData = {
  color: WireColor
}

export type PartNode = Node<PartData, 'part'>
export type WireEdge = Edge<WireData, 'wire'>

export type CircuitSnapshot = {
  nodes: PartNode[]
  edges: WireEdge[]
}
