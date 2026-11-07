import type { GateType, PartCategory, RadioType, SensedPart } from '@/circuit/catalog'
import type { MissionId } from '@/circuit/missions'
import type { PresetCategory, PresetId, PresetLevel, PresetTexts } from '@/circuit/presets'
import type { PartStatus } from '@/circuit/solver'
import type {
  DemoId,
  DisplayMode,
  DisplayTint,
  LampColor,
  LedColor,
  MeterDial,
  PartType,
  PinMode,
  SignEffect,
  WireColor,
} from '@/circuit/types'

type PartText = { name: string; description: string; working: string }

export type Dictionary = {
  app: {
    title: string
    subtitle: string
  }
  parts: Record<PartType, PartText>
  /** the label of each sensor's control: what you change in the world around it */
  sense: Record<SensedPart, string>
  categories: Record<PartCategory, string>
  colors: Record<LampColor | LedColor | WireColor | 'auto', string>
  status: Record<PartStatus, string>
  tips: {
    lampWeak: string
    lampOver: string
    burnt: string
    ledReverse: string
    ledOver: string
    ledOff: string
    motorWeak: string
    motorOver: string
    motorReverse: string
    short: string
    resistorHot: string
    batteryIdle: string
    fuseBlown: string
    fuseNear: string
    capacitorReverse: string
    diodeReverse: string
    transistorBase: string
    arduinoPin: string
    solarDark: string
    meterReverse: string
    servoPower: string
    sensorPower: string
    followHint: string
    displayPower: string
    displayWeak: string
    displayReverse: string
    displaySignal: string
  }
  sidebar: { title: string; hint: string; search: string; noResults: string; tapToAdd: string }
  toolbar: {
    examples: string
    undo: string
    redo: string
    running: string
    paused: string
    clear: string
    soundOn: string
    soundOff: string
    language: string
    theme: string
    help: string
    more: string
    toolbox: string
  }
  confirm: {
    clearTitle: string
    clearBody: string
    loadTitle: string
    loadBody: string
    cancel: string
    clear: string
    load: string
  }
  presets: Record<PresetId, { name: string; description: string }>
  /** the examples gallery */
  gallery: {
    title: string
    description: (count: number) => string
    all: string
    /** what the list of shelves is called, for screen readers */
    shelves: string
    categories: Record<PresetCategory, { name: string; short: string; blurb: string }>
    levels: Record<PresetLevel, string>
    /** the search box: its placeholder, its label for screen readers and its clear button */
    search: string
    searchLabel: string
    clearSearch: string
    /** the Easy / Medium / Hard filter: its label and the choice that shows every level */
    levelFilter: string
    anyLevel: string
    /** how many examples the search found */
    found: (count: number) => string
    noResults: string
    noResultsHint: string
    /** clears the search and the level filter */
    showAll: string
    /** words some examples show on their screens */
    screens: Omit<PresetTexts, 'citySign'>
  }
  inspector: {
    tab: string
    missionsTab: string
    empty: string
    emptyHint: string
    voltage: string
    current: string
    power: string
    speed: string
    brightness: string
    batteryVoltage: string
    color: string
    resistance: string
    switchState: string
    on: string
    off: string
    knob: string
    rotate: string
    duplicate: string
    delete: string
    repair: string
    wire: string
    wireColor: string
    wireCurrent: string
    deleteWire: string
    readings: string
    settings: string
    whatItDoes: string
    plusEnd: string
    minusEnd: string
    capacitance: string
    rating: string
    light: string
    charge: string
    program: string
    programHint: string
    code: string
    pinModes: Record<PinMode, string>
    a0: string
    angle: string
    signal: string
  }
  node: { on: string; off: string; press: string; replace: string }
  /** screens: the 7-segment display, LCD, OLED, colour screen, LED sign and city TV */
  display: {
    modes: Record<DisplayMode, string>
    effects: Record<SignEffect, string>
    demos: Record<DemoId, string>
    tints: Record<DisplayTint, string>
    show: string
    digits: string
    size: string
    across: string
    down: string
    backlight: string
    text: string
    number: string
    line: (n: number) => string
    effect: string
    picture: string
    upload: string
    replace: string
    remove: string
    mediaHint: string
    tooBig: string
    badFile: string
    play: string
    pause: string
    next: string
    leds: (w: number, h: number) => string
    signal: string
    noPower: string
    /** what a fresh screen shows until you type your own words */
    samples: {
      lcd: string
      oled: string
      tft: string
      matrix: string
      citySign: string
      newsTitle: string
      news: string
      ad: string
    }
  }
  statusBar: {
    complete: string
    open: string
    short: string
    noBattery: string
    empty: string
    paused: string
    count: (parts: number, wires: number) => string
    batteryCurrent: string
  }
  toasts: {
    lampBurnt: string
    ledBurnt: string
    short: string
    mission: string
    copied: string
    fuseBlown: string
    partBurnt: string
  }
  missions: {
    title: string
    progress: (done: number, total: number) => string
    reset: string
    allDone: string
    items: Record<MissionId, string>
  }
  empty: { title: string; body: string; cta: string }
  help: { title: string; intro: string; steps: string[]; shortcuts: string; keys: [string, string][] }
  drag: { drop: string }
  wirePalette: string
  controls: { zoomIn: string; zoomOut: string; fit: string }
  /** the power supply, potentiometer, relay, RGB LED, speaker, chips and oscilloscope */
  workshop: {
    tips: {
      supplyLimit: string
      potHint: string
      potHot: string
      relayWeak: string
      relayHint: string
      rgbHint: string
      speakerOver: string
      magnetHot: string
      regulatorLow: string
      regulatorHot: string
      regulatorHint: string
      chipPower: string
      chipWeak: string
      chipReverse: string
      timerWeak: string
      scopeHint: string
    }
    voltage: string
    limit: string
    limitHint: string
    knobSize: string
    wiper: string
    note: string
    /** low, middle and high */
    notes: [string, string, string]
    /** what a buzzer plays */
    sound: string
    /** beep, police siren, fast siren, two-tone: short words that fit the card */
    sounds: [string, string, string, string]
    /** one line about each sound, in the details panel */
    soundHints: [string, string, string, string]
    speed: string
    /** slow, medium and fast */
    speeds: [string, string, string]
    perSecond: (n: number) => string
    span: string
    seconds: (n: number) => string
    strength: string
    shake: string
    loudness: string
    open: string
    closed: string
    coil: string
    contactCurrent: string
    regulatorIn: string
    regulatorOut: string
    truthTable: string
    truthHint: string
    gateRules: Record<GateType, string>
    scopeReading: string
  }
  /** the new switches, the joystick and the small power sources: lemons, coin cell, crank, power bank */
  inputs: {
    tips: {
      lemonTiny: string
      lemonMore: string
      coinSag: string
      crank: string
      bankLimit: string
      slideHint: string
      microHint: string
      joystickPower: string
    }
    lemons: string
    lemonCount: (n: number) => string
    crank: string
    toA: string
    toB: string
    slideTo: string
    lever: string
    pressed: string
    stickX: string
    stickY: string
    volts: string
  }
  /** the Zener, PNP, MOSFET, optocoupler, laser, IR LED … the chips, the multimeter and the logic probe */
  lab: {
    tips: {
      zenerHint: string
      zenerLow: string
      zenerForward: string
      zenerHot: string
      pnpBase: string
      mosfetGate: string
      mosfetHalf: string
      mosfetHot: string
      optoHint: string
      laserSafety: string
      laserWeak: string
      irEyes: string
      irCamera: string
      solenoidWeak: string
      solenoidHot: string
      pumpWeak: string
      bellWeak: string
      bellHot: string
      modulePower: string
      barHint: string
      trafficHint: string
      fanReverse: string
      fanWeak: string
      latchHint: string
      counterHint: string
      comparatorHint: string
      bridgeHint: string
      bridgeHot: string
      meterVolts: string
      meterAmps: string
      meterAmpsShort: string
      meterOhms: string
      meterOutside: string
      meterReverse: string
      meterBeep: string
      probePower: string
      probeLoose: string
    }
    eyes: string
    camera: string
    lookWith: string
    viewHint: string
    dial: string
    dials: Record<MeterDial, string>
    dialHints: Record<MeterDial, string>
    reading: string
    gate: string
    held: string
    push: string
    flow: string
    inVolts: string
    bars: (n: number) => string
    count: string
    forward: string
    back: string
    stop: string
    high: string
    low: string
    pulse: string
    latchTable: { title: string; hint: string; keeps: string }
    bridgeTable: { title: string; hint: string; motor: string }
  }
  /** the message modules: SMS, Wi-Fi, Bluetooth, LoRa, GPS, CAN bus and RS-485 */
  radio: {
    tips: {
      power: string
      /** while it joins its network (the GPS: while it looks for satellites) */
      joining: Record<RadioType, string>
      /** once it has joined: what it does now */
      ready: Record<RadioType, string>
      /** the SMS module, while a text is going out */
      sending: string
      /** the SMS module, after it sent one */
      sent: string
    }
    /** one word on the card while it joins: "Searching", "Pairing" … */
    joining: Record<RadioType, string>
    /** who gets what it sends: a phone, the cloud, the control room … */
    receivers: Record<RadioType, string>
    sending: string
    ready: string
    sent: (n: number) => string
    sats: (n: number) => string
    /** the SMS module's settings */
    message: string
    phone: string
    messageHint: string
    defaultMessage: string
    noMessages: string
    delivered: string
    /** the value it is sending right now */
    now: string
    /** how many messages it has sent */
    messages: string
    distance: string
    signal: string
    position: string
    waiting: string
  }
  units: { volt: string; amp: string; milliamp: string; watt: string; ohm: string }
}

/** English: the default language. Short, everyday words a young child can read. */
export const en: Dictionary = {
  app: { title: 'Circuit Lab', subtitle: 'Build it. Light it up!' },
  parts: {
    battery: {
      name: 'Battery',
      description: 'Gives power to your circuit. It has a + end and a − end.',
      working: 'Giving power',
    },
    switch: {
      name: 'Switch',
      description: 'Turns the power on and off.',
      working: 'On',
    },
    button: {
      name: 'Push button',
      description: 'Lets power through only while you hold it down.',
      working: 'Held down',
    },
    dimmer: {
      name: 'Dimmer',
      description: 'Turn it to make things brighter or dimmer.',
      working: 'Working',
    },
    resistor: {
      name: 'Resistor',
      description: 'Slows the power down to keep small parts safe.',
      working: 'Working',
    },
    lamp: {
      name: 'Lamp',
      description: 'Makes light. Too much power burns it out!',
      working: 'Shining',
    },
    led: {
      name: 'LED',
      description: 'A small light that works one way only: + goes to +.',
      working: 'Shining',
    },
    motor: {
      name: 'Motor',
      description: 'Spins around. Swap its wires to spin it the other way.',
      working: 'Spinning',
    },
    buzzer: {
      name: 'Buzzer',
      description: 'Makes a beep. More power makes a louder beep.',
      working: 'Beeping',
    },
    solar: {
      name: 'Solar panel',
      description: 'Turns sunlight into power. More sun gives more power.',
      working: 'Making power',
    },
    arduino: {
      name: 'Arduino Uno',
      description: 'A tiny computer. Tell each pin to turn on, blink or fade.',
      working: 'Running code',
    },
    nano: {
      name: 'Arduino Nano',
      description: 'A tiny Arduino with the same pins as the Uno. Great for small projects.',
      working: 'Running code',
    },
    mega: {
      name: 'Arduino Mega',
      description: 'A big Arduino with lots of pins for large projects.',
      working: 'Running code',
    },
    esp32: {
      name: 'ESP32',
      description: 'A fast board with Wi-Fi and Bluetooth. Its pins use 3.3 volts.',
      working: 'Running code',
    },
    esp8266: {
      name: 'ESP8266 NodeMCU',
      description: 'A small Wi-Fi board. Its pins use 3.3 volts.',
      working: 'Running code',
    },
    pico: {
      name: 'Raspberry Pi Pico',
      description: 'A small board you program in MicroPython. Its pins use 3.3 volts.',
      working: 'Running code',
    },
    microbit: {
      name: 'micro:bit',
      description: 'A pocket-size school board with lights and buttons. Its pins use 3.3 volts.',
      working: 'Running code',
    },
    raspberrypi: {
      name: 'Raspberry Pi',
      description: 'A real little computer you program in Python. Its pins use 3.3 volts.',
      working: 'Running code',
    },
    aiBoard: {
      name: 'AI board',
      description: 'A board you talk to. Tell it what you want, and the AI sets its pins for you.',
      working: 'Ready',
    },
    capacitor: {
      name: 'Capacitor',
      description: 'Stores power for a short time, then gives it back.',
      working: 'Working',
    },
    diode: {
      name: 'Diode',
      description: 'Lets power go one way only, like a one-way door.',
      working: 'Letting power through',
    },
    transistor: {
      name: 'Transistor',
      description: 'A tiny switch: a small current into B turns on a big current from C to E.',
      working: 'Switched on',
    },
    fuse: {
      name: 'Fuse',
      description: 'Breaks on purpose when too much power flows, to keep the rest safe.',
      working: 'Working',
    },
    ldr: {
      name: 'Light sensor',
      description: 'Lets more power through when more light shines on it.',
      working: 'Sensing light',
    },
    voltmeter: {
      name: 'Voltmeter',
      description: 'Shows the voltage between its two ends. Put it next to a part.',
      working: 'Measuring',
    },
    ammeter: {
      name: 'Ammeter',
      description: 'Shows how much current flows through it. Put it inside the loop.',
      working: 'Measuring',
    },
    servo: {
      name: 'Servo motor',
      description: 'Turns to the angle you ask for and stays there. Give it power, then a signal on S.',
      working: 'Turning',
    },
    thermistor: {
      name: 'Thermistor',
      description: 'A heat sensor. It lets more power through when it gets hot.',
      working: 'Sensing heat',
    },
    tilt: {
      name: 'Tilt switch',
      description: 'Turns on when you tip it over.',
      working: 'Tilted',
    },
    reed: {
      name: 'Magnet switch',
      description: 'Turns on when a magnet comes near.',
      working: 'Magnet near',
    },
    tempSensor: {
      name: 'Temperature sensor',
      description: 'Tells how hot it is. The hotter it gets, the bigger its signal on S.',
      working: 'Sensing',
    },
    ultrasonic: {
      name: 'Distance sensor',
      description: 'Uses sound too high to hear to find how far things are. Closer gives a bigger signal.',
      working: 'Sensing',
    },
    pir: {
      name: 'Motion sensor',
      description: 'Sees people move nearby and sends a signal on S.',
      working: 'Watching',
    },
    soundSensor: {
      name: 'Sound sensor',
      description: 'Hears noise. Louder noise gives a bigger signal.',
      working: 'Listening',
    },
    gasSensor: {
      name: 'Smoke sensor',
      description: 'Smells smoke and gas in the air. More smoke gives a bigger signal.',
      working: 'Sniffing',
    },
    soilSensor: {
      name: 'Soil sensor',
      description: 'Tells if a plant’s soil is wet or dry. Wetter soil gives a bigger signal.',
      working: 'Sensing',
    },
    touchSensor: {
      name: 'Touch sensor',
      description: 'Sends a signal while you touch it.',
      working: 'Ready',
    },
    flameSensor: {
      name: 'Flame sensor',
      description: 'Sees fire. A bigger, closer flame gives a bigger signal on S.',
      working: 'Watching',
    },
    rainSensor: {
      name: 'Rain sensor',
      description: 'Feels raindrops on its striped plate. More rain gives a bigger signal.',
      working: 'Sensing',
    },
    waterSensor: {
      name: 'Water sensor',
      description: 'Dip its strip in water. The higher the water, the bigger the signal.',
      working: 'Sensing',
    },
    humiditySensor: {
      name: 'Humidity sensor',
      description: 'Feels how much water is in the air. Damp air gives a bigger signal.',
      // short, so the long name still fits on the card next to it
      working: 'On',
    },
    hallSensor: {
      name: 'Magnet sensor',
      description: 'Feels a magnet without touching it. S turns on when a magnet comes close.',
      working: 'Sensing',
    },
    irSensor: {
      name: 'Obstacle sensor',
      description: 'Shines a light you can’t see. When something is in front, the light bounces back and S turns on.',
      working: 'On',
    },
    lineSensor: {
      name: 'Line sensor',
      description: 'Looks at the floor. S turns on over a black line, so a robot can follow it.',
      working: 'Looking',
    },
    forceSensor: {
      name: 'Press sensor',
      description: 'A flat pad that feels a push. Press harder for a bigger signal.',
      working: 'Feeling',
    },
    pulseSensor: {
      name: 'Heartbeat sensor',
      description: 'Put your finger on it to feel your heartbeat. S jumps up with every beat.',
      working: 'On',
    },
    knockSensor: {
      name: 'Knock sensor',
      description: 'Feels a knock or a shake. S turns on when you tap it.',
      working: 'Feeling',
    },
    slideSwitch: {
      name: 'Stair switch',
      description: 'Joins COM to A or to B. Use two of them to turn a stair light on and off from both ends.',
      working: 'On',
    },
    microSwitch: {
      name: 'Micro switch',
      description: 'A tiny switch with a lever. Press it and COM moves from NC to NO. Robots use it to feel a wall.',
      working: 'Pressed',
    },
    joystick: {
      name: 'Joystick',
      description: 'A thumb stick, like on a game controller. Push it right or up and X or Y gives more volts.',
      working: 'On',
    },
    lemon: {
      name: 'Lemon battery',
      description: 'Lemons with a copper coin and a zinc nail make a little power. Three in a row can light a red LED!',
      working: 'On',
    },
    coinCell: {
      name: 'Coin cell',
      description: 'A flat 3 V battery, like the one in a watch. It can light an LED, but it is too weak for a motor.',
      working: 'Giving power',
    },
    dynamo: {
      name: 'Hand dynamo',
      description: 'Turn the crank to make power. The faster you turn it, the more volts you get.',
      working: 'On',
    },
    powerBank: {
      name: 'Power bank',
      description: 'The battery you charge your phone with. It gives a steady 5 V, just like a USB port.',
      working: 'On',
    },
    segment: {
      name: '7-segment display',
      description: 'Shows numbers with little light bars. It can count, show the time or show the volts on S.',
      working: 'Showing',
    },
    lcd: {
      name: 'LCD screen',
      description: 'Shows two or four lines of words. Type what it should say.',
      working: 'Showing',
    },
    oled: {
      name: 'OLED screen',
      description: 'A tiny, sharp screen. It shows words, the time, a picture or the volts on S.',
      working: 'Showing',
    },
    tft: {
      name: 'Color screen',
      description: 'A small screen in full color. It plays your photos, your videos and fun shows.',
      working: 'Playing',
    },
    matrix: {
      name: 'LED sign',
      description: 'A sign made of many little lights, like in shop windows. Words can slide across it.',
      working: 'Showing',
    },
    ledwall: {
      name: 'City TV',
      description: 'A giant screen made of LED panels, like on big buildings. Make it any size and play any photo or video.',
      working: 'Playing',
    },
    powerSupply: {
      name: 'Power supply',
      description: 'A power box you plug in. Turn it to any voltage from 0 to 12 V. Its current limit keeps your parts safe.',
      // short, so the card title still fits next to it
      working: 'On',
    },
    potentiometer: {
      name: 'Potentiometer',
      description: 'A knob with three legs. Join A to + and B to −. Then W gives any voltage in between.',
      // short, so the long name still fits on the card next to it
      working: 'On',
    },
    relay: {
      name: 'Relay',
      description: 'A switch worked by a magnet. A small current in the coil closes a big switch from COM to NO. Click!',
      working: 'Switch closed',
    },
    rgbLed: {
      name: 'RGB LED',
      description: 'Three little lights in one: red, green and blue. Mix them to make any color!',
      working: 'Shining',
    },
    speaker: {
      name: 'Speaker',
      description: 'Plays a music note. More power makes it louder. Pick the note on its card.',
      working: 'Playing',
    },
    vibration: {
      name: 'Vibration motor',
      description: 'A tiny coin motor that shakes, like the buzz in a phone.',
      working: 'Shaking',
    },
    electromagnet: {
      name: 'Electromagnet',
      description: 'A coil of wire around iron. When current flows, it becomes a magnet!',
      working: 'Magnet on',
    },
    regulator: {
      name: 'Voltage regulator',
      description: 'A chip that turns 7 to 12 V into a steady 5 V. Its pins are IN, GND and OUT.',
      working: 'Giving 5 V',
    },
    notGate: {
      name: 'NOT gate',
      description: 'Flips its input: when A is off, Y is on. When A is on, Y is off.',
      working: 'Y is on',
    },
    andGate: {
      name: 'AND gate',
      description: 'Y turns on only when A and B are both on.',
      working: 'Y is on',
    },
    orGate: {
      name: 'OR gate',
      description: 'Y turns on when A or B is on, or both.',
      working: 'Y is on',
    },
    xorGate: {
      name: 'XOR gate',
      description: 'Y turns on when just one of A and B is on, not both.',
      working: 'Y is on',
    },
    timer555: {
      name: '555 blinker',
      description: 'A famous chip that blinks its OUT pin all by itself. Pick how fast.',
      working: 'Blinking',
    },
    oscilloscope: {
      name: 'Oscilloscope',
      description: 'Draws the voltage as it changes over time. Watch blinks, fades and charging!',
      working: 'Watching',
    },
    zener: {
      name: 'Zener diode',
      description: 'A diode that holds a steady 5.1 V. Join its striped + end toward + through a resistor, and its − end to −.',
      working: 'Holds 5.1 V',
    },
    pnp: {
      name: 'PNP transistor',
      description: 'The mirror of the NPN. Join E to +. A small current out of B lets a big current flow from E to C.',
      working: 'On',
    },
    mosfet: {
      name: 'MOSFET',
      description: 'A switch worked by volts. A few volts on G let a big current flow from D to S. G takes almost no current.',
      working: 'Switched on',
    },
    optocoupler: {
      name: 'Optocoupler',
      description: 'An LED and a light switch in one chip. Light the LED, and the switch from C to E closes. No wire joins the two sides!',
      working: 'Switch on',
    },
    laser: {
      name: 'Laser',
      description: 'Shines a thin red beam and makes a bright dot. Never point it at anyone’s eyes!',
      working: 'Beam on',
    },
    irLed: {
      name: 'IR LED',
      description: 'Gives a light your eyes can’t see, like a TV remote. Look at it through a phone camera!',
      working: 'Shining',
    },
    solenoid: {
      name: 'Solenoid',
      description: 'A coil with a metal rod inside. Give it power, and the rod pushes out. Clack!',
      working: 'Pushing',
    },
    pump: {
      name: 'Water pump',
      description: 'Pushes water up through a tube. More volts pump faster.',
      working: 'Pumping',
    },
    bell: {
      name: 'Electric bell',
      description: 'A magnet pulls a little hammer that hits the bell, again and again. Ring ring!',
      working: 'Ringing',
    },
    barGraph: {
      name: 'LED bar graph',
      description: 'Ten lights in a row. The higher the voltage on IN, the more bars light up.',
      working: 'Showing',
    },
    trafficLight: {
      name: 'Traffic light',
      description: 'Red, yellow and green lights with their resistors inside. Join R, Y or G to +, and − to −.',
      working: 'Shining',
    },
    fan: {
      name: 'Fan',
      description: 'Blows air to keep things cool. It only spins with + to + and − to −.',
      working: 'Blowing',
    },
    nandGate: {
      name: 'NAND gate',
      description: 'Y is on, except when A and B are both on.',
      working: 'Y is on',
    },
    norGate: {
      name: 'NOR gate',
      description: 'Y is on only when A and B are both off.',
      working: 'Y is on',
    },
    latch: {
      name: 'Memory latch',
      description: 'Remembers one thing. A pulse on S turns Q on, and Q stays on until a pulse on R.',
      working: 'Q is on',
    },
    counter: {
      name: '4017 counter',
      description: 'Counts the pulses on CLK. Each pulse moves the light to the next pin: 0, 1, 2, 3, 4, then 0 again.',
      working: 'Counting',
    },
    comparator: {
      name: 'Comparator',
      description: 'Compares two voltages. OUT turns on when IN+ is higher than IN−.',
      working: 'OUT is on',
    },
    hBridge: {
      name: 'Motor driver',
      description: 'Lets a board drive a motor both ways. IN1 on: forward. IN2 on: back. The motor goes on M1 and M2.',
      working: 'Driving',
    },
    multimeter: {
      name: 'Multimeter',
      description: 'The tool every maker uses. Turn the dial to measure volts (V), amps (A) or ohms (Ω), or to beep on a joined path.',
      working: 'Measuring',
    },
    logicProbe: {
      name: 'Logic probe',
      description: 'Touch its tip to a wire to see if it is HIGH, LOW or pulsing. It takes power from your circuit.',
      working: 'Testing',
    },
    ecu: {
      name: 'Car ECU',
      description: 'The engine computer of a car. It reads a sensor on AIN and runs fans, lights and pumps from OUT1 to OUT6.',
      working: 'Running',
    },
    plc: {
      name: 'Factory PLC',
      description: 'The controller that runs the machines in a factory. It reads AI0, clicks relays Q0 to Q4, and sets AQ0 anywhere between off and on.',
      working: 'Running',
    },
    rtu: {
      name: 'Oil-well RTU',
      description: 'The remote unit at an oil well, far from any town. It watches its sensor on AI1 and runs pumps and alarms on its own.',
      working: 'Running',
    },
    gsm: {
      name: 'SMS module',
      description: 'A mobile phone on a chip, with its own SIM card. When IN goes HIGH, it sends a text message.',
      working: 'On network',
    },
    wifi: {
      name: 'Wi-Fi module',
      description: 'Joins the Wi-Fi and sends the volts on IN to the cloud every second, so you can see them on a phone anywhere.',
      working: 'Online',
    },
    bluetooth: {
      name: 'Bluetooth module',
      description: 'Talks to a phone close by, without wires. It sends what it reads on IN to the phone.',
      working: 'Paired',
    },
    lora: {
      name: 'LoRa radio',
      description: 'Sends small messages many kilometres away on very little power. Farms and oil fields use it.',
      working: 'Joined',
    },
    gps: {
      name: 'GPS module',
      description: 'Listens to satellites to find where it is on Earth. Once it knows, PPS gives a pulse every second.',
      working: 'Fix',
    },
    canBus: {
      name: 'CAN bus module',
      description: 'Puts the volts on IN onto the CAN bus: the network that joins all the computers in a car.',
      working: 'On the bus',
    },
    rs485: {
      name: 'RS-485 module',
      description: 'Sends IN down a long cable to the control room, in Modbus: the language of factory machines.',
      working: 'On the line',
    },
    pressureSensor: {
      name: 'Pressure sensor',
      description: 'Measures the pressure in a pipe or a well, from 0 to 200 bar. S rises with the pressure.',
      working: 'Measuring',
    },
  },
  sense: {
    thermistor: 'Heat',
    tilt: 'Tip it over',
    reed: 'Bring the magnet',
    tempSensor: 'Heat',
    ultrasonic: 'Distance',
    pir: 'Wave',
    soundSensor: 'Noise',
    gasSensor: 'Smoke',
    soilSensor: 'Water',
    touchSensor: 'Touch',
    flameSensor: 'Fire',
    rainSensor: 'Rain',
    waterSensor: 'Water',
    humiditySensor: 'Damp air',
    hallSensor: 'Bring the magnet',
    irSensor: 'Wall ahead',
    lineSensor: 'Black line',
    forceSensor: 'Press',
    pulseSensor: 'Heart rate',
    knockSensor: 'Knock',
    pressureSensor: 'Pressure',
  },
  categories: {
    power: 'Power',
    board: 'Boards',
    control: 'Switches and knobs',
    component: 'Electronic parts',
    logic: 'Chips and logic',
    output: 'Light, sound and motion',
    sensor: 'Sensors',
    meter: 'Meters',
    display: 'Displays',
    comms: 'Messages and networks',
  },
  colors: {
    warm: 'Warm',
    yellow: 'Yellow',
    red: 'Red',
    green: 'Green',
    blue: 'Blue',
    white: 'White',
    orange: 'Orange',
    pink: 'Pink',
    black: 'Black',
    auto: 'Auto',
  },
  status: {
    idle: 'Off',
    weak: 'Weak',
    on: 'On',
    over: 'Too much!',
    reverse: 'Wrong way',
    burnt: 'Burnt out',
    short: 'Short circuit',
  },
  tips: {
    lampWeak: 'The light is weak. Try a bigger battery, or put the lamps side by side.',
    lampOver: 'Very bright and very hot. It may burn out!',
    burnt: 'It burnt out because the power was too strong. Use a smaller battery, then fix it.',
    ledReverse: 'The LED is the wrong way round. Join its + to the battery +.',
    ledOver: 'Too much power for the LED. Add a resistor next to it.',
    ledOff: 'The LED needs a bit more power to light up. Try a bigger battery.',
    motorWeak: 'Not enough power to spin. Try a bigger battery.',
    motorOver: 'The motor is spinning very fast and getting hot!',
    motorReverse: 'It spins the other way because + and − are swapped.',
    short: 'Short circuit! The two battery ends are joined by a bare wire. The battery is getting hot.',
    resistorHot: 'The resistor is getting hot! Pick a bigger number.',
    batteryIdle: 'Power only flows in a full loop: from + all the way back to −.',
    fuseBlown: 'The fuse broke to keep the other parts safe. Find what took too much power, then fix the fuse.',
    fuseNear: 'Almost too much current for this fuse!',
    capacitorReverse: 'The capacitor is the wrong way round. Join its + to the + side.',
    diodeReverse: 'The diode is blocking the power. Turn it around to let power through.',
    transistorBase: 'Nothing goes into B, so the transistor stays off. Send a small current into B through a resistor.',
    arduinoPin: 'Too much current for an Arduino pin! Add a resistor.',
    solarDark: 'Not enough sunlight. Slide the sun up.',
    meterReverse: 'The meter is connected the wrong way. Swap its two wires.',
    servoPower: 'The servo needs about 5 volts. Join its + to 5V and its − to GND.',
    sensorPower: 'This sensor needs power. Join its + to 5V and its − to GND.',
    followHint: 'Set a pin to “Follow sensor”, then join the sensor’s S to the board’s input pin (like A0).',
    displayPower: 'This screen needs power. Join its + to + and its − to −.',
    displayWeak: 'Not enough power for this screen. Try a bigger battery.',
    displayReverse: 'The screen is joined the wrong way. Swap its + and − wires.',
    displaySignal: 'Join S to the wire you want to measure.',
  },
  sidebar: {
    title: 'Parts',
    hint: 'Drag a part onto the board',
    search: 'Find a part',
    noResults: 'No parts match',
    tapToAdd: 'Tap a part to add it',
  },
  toolbar: {
    examples: 'Examples',
    undo: 'Undo',
    redo: 'Redo',
    running: 'Running',
    paused: 'Paused',
    clear: 'Clear board',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    language: 'Language',
    theme: 'Dark mode',
    help: 'Help',
    more: 'More',
    toolbox: 'Toolbox',
  },
  confirm: {
    clearTitle: 'Clear the board?',
    clearBody: 'This takes away every part and wire. You can get them back with Undo.',
    loadTitle: 'Open this example?',
    loadBody: 'It will replace what is on your board. You can get your board back with Undo.',
    cancel: 'Keep my board',
    clear: 'Clear',
    load: 'Open it',
  },
  presets: {
    flashlight: { name: 'Flashlight', description: 'A battery, a switch and a lamp' },
    fan: { name: 'Fan', description: 'A motor and a switch. Watch it spin!' },
    doorbell: { name: 'Doorbell', description: 'Hold the button to make a beep' },
    led: { name: 'LED light', description: 'An LED kept safe by a resistor' },
    series: { name: 'Two lamps in a row', description: 'Both lamps get dimmer' },
    parallel: { name: 'Two lamps side by side', description: 'Both lamps stay bright' },
    dimmer: { name: 'Night light', description: 'Turn the dimmer to change the light' },
    short: { name: 'Short circuit (oops!)', description: 'See what a bare wire does' },
    arduino: { name: 'Arduino blink', description: 'Pin 13 blinks a red LED, pin 9 fades a blue one' },
    transistor: { name: 'Transistor switch', description: 'A small button current turns on a big lamp' },
    capacitor: { name: 'Capacitor light', description: 'Turn the switch off and watch the LED fade slowly' },
    solar: { name: 'Solar fan', description: 'Sunlight spins the motor' },
    meters: { name: 'Measure it', description: 'Read the current and the voltage of a lamp' },
    servo: { name: 'Servo sweep', description: 'Pin 9 swings the servo arm back and forth' },
    motion: { name: 'Motion light', description: 'Wave at the motion sensor to light the LED' },
    cityTv: { name: 'City TV', description: 'A giant LED screen and a moving sign' },
    goldSign: { name: 'Shop sign', description: 'A gold shop sign with sparkling words' },
    counter: { name: 'Digital clock', description: 'A 4-digit clock with blinking dots' },
    rainbow: { name: 'Rainbow lights', description: 'Four colored LEDs light up together' },
    toyCar: { name: 'Toy car', description: 'One switch spins both wheels' },
    batteryTester: { name: 'Battery tester', description: 'See how strong a battery is' },
    streetLamp: { name: 'Street lamp', description: 'It turns on by itself when it gets dark' },
    fuseGuard: { name: 'Fuse guard', description: 'Flip the switch and the fuse keeps you safe' },
    solarGarden: { name: 'Solar garden light', description: 'The sun fills it up, it glows after sunset' },
    noiseLight: { name: 'Noise light', description: 'The louder it is, the brighter the lamp' },
    trafficLight: { name: 'Traffic light', description: 'Red, green, yellow, again and again' },
    policeLights: { name: 'Police lights', description: 'Red and blue flash with a siren' },
    partyLights: { name: 'Party lights', description: 'Colored lights chase and a sign sparkles' },
    holidayLights: { name: 'Holiday lights', description: 'Twinkling lights run by a Python program' },
    railroad: { name: 'Train crossing', description: 'Red lights flash and the gate comes down' },
    nightLight: { name: 'Auto night light', description: 'It lights up by itself in the dark' },
    smokeAlarm: { name: 'Smoke alarm', description: 'Beeps and flashes when it smells smoke' },
    parkingSensor: { name: 'Parking sensor', description: 'Beeps faster as you get closer' },
    plantAlarm: { name: 'Thirsty plant', description: 'Tells you when the plant needs water' },
    smartFan: { name: 'Smart fan', description: 'Spins faster when it gets hotter' },
    autoDoor: { name: 'Automatic door', description: 'Opens when someone walks by' },
    radar: { name: 'Radar', description: 'Sweeps around and beeps at close things' },
    doorAlarm: { name: 'Door alarm', description: 'Beeps when the door opens' },
    smartHome: { name: 'Smart home', description: 'A porch light, a fan and a welcome screen' },
    thermometer: { name: 'Digital thermometer', description: 'More heat makes a bigger number' },
    scoreboard: { name: 'Scoreboard', description: 'A big sign and a game clock' },
    doorbellScreen: { name: 'Smart doorbell', description: 'The screen says hello, the button rings' },
    busStop: { name: 'Bus stop board', description: 'Bus times and a clock, run by the sun' },
    pocketTv: { name: 'Pocket TV', description: 'A tiny color screen shows fireworks' },
    hairDryer: { name: 'Hair dryer', description: 'A fan and a hot coil, each with its own switch' },
    bikeBell: { name: 'Bike light and bell', description: 'Flip on the light, press the bell' },
    carLights: { name: 'Car lights', description: 'One switch for white lights in front and red at the back' },
    morseKey: { name: 'Morse code key', description: 'Tap the key to beep and flash secret messages' },
    knobDimmer: { name: 'Knob dimmer', description: 'Turn the knob to make the LED brighter or dimmer' },
    diodeCheck: { name: 'One-way street', description: 'A diode lets power through one way only' },
    relayLamp: { name: 'Relay switch', description: 'A small switch turns on a lamp on another battery' },
    safeShort: { name: 'Safe power supply', description: 'Make a short on purpose. The supply keeps it safe' },
    phoneCharger: { name: 'Phone charger', description: 'Turns 9 volts into the 5 volts a phone needs' },
    delayLight: { name: 'Hallway timer light', description: 'Switch it off and it stays on a little longer' },
    scopeKnob: { name: 'Draw with a knob', description: 'Turn the knob and watch the line go up and down' },
    lightMeter: { name: 'Light meter', description: 'More light makes a bigger number' },
    solarMeter: { name: 'Sun power meter', description: 'See how much power the sun gives' },
    ohmsLaw: { name: 'Ohm\'s law', description: 'Twice the volts give twice the current' },
    magnetLab: { name: 'Magnet lab', description: 'More current makes a stronger magnet' },
    scopeSquare: { name: 'Square wave', description: 'See a 555 chip switch on and off' },
    scopeCap: { name: 'Filling a capacitor', description: 'Watch it fill up fast, then slower and slower' },
    scopeBreath: { name: 'Breathing wave', description: 'A fading light drawn as a smooth wave' },
    flasher555: { name: 'Blinker chip', description: 'A 555 chip makes two lights take turns' },
    darkLamp: { name: 'Dark detector', description: 'A NOT chip turns the light on when it gets dark' },
    stairLight: { name: 'Stair light', description: 'Turn it on downstairs, off upstairs' },
    safeLock: { name: 'Two-button safe', description: 'It opens only when both buttons are pressed' },
    twoDoors: { name: 'Front and back doorbell', description: 'Either door rings the same bell' },
    halfAdder: { name: 'Adding machine', description: 'Two switches and two chips add 1 + 1' },
    seatbelt: { name: 'Seat belt beeper', description: 'Beeps until you click the belt in' },
    fireflies: { name: 'Firefly jar', description: 'Six little lights glow at different times' },
    chaser: { name: 'Light chaser', description: 'A light runs along a row of LEDs' },
    rainAlert: { name: 'Rain alarm', description: 'Beeps when the first drops fall' },
    laserAlarm: { name: 'Laser alarm', description: 'Step through the beam and it beeps' },
    babyMonitor: { name: 'Baby monitor', description: 'Beeps when the baby cries' },
    greenhouse: { name: 'Watering robot', description: 'Waters the plant when the soil is dry' },
    piano: { name: 'Three-key piano', description: 'Low, middle and high notes' },
    metronome: { name: 'Metronome', description: 'Beeps and blinks to keep the beat' },
    siren: { name: 'Fire truck siren', description: 'Nee-naw, nee-naw, made with a 555 chip' },
    musicBox: { name: 'Music box', description: 'Three notes play again and again' },
    morningBird: { name: 'Morning bird', description: 'Sings when the sun comes up' },
    ambulance: { name: 'Ambulance', description: 'Red and white lights flash and the siren never stops' },
    dingDong: { name: 'Ding-dong bell', description: 'Ding when you press, dong when you let go' },
    toothbrush: { name: 'Electric toothbrush', description: 'A tiny motor that shakes' },
    crane: { name: 'Magnet crane', description: 'Pick up steel with a magnet and lift it' },
    fanKnob: { name: 'Fan speed knob', description: 'Turn the knob to make the fan go faster' },
    robotArm: { name: 'Robot arm', description: 'Two knobs move the arm and the claw' },
    phoneBuzz: { name: 'Ringing phone', description: 'Buzz, buzz! Grandma is calling' },
    robotHead: { name: 'Robot head', description: 'Blue eyes, a turning head and a beep-boop voice' },
    conveyor: { name: 'Conveyor belt', description: 'Press START once. It keeps going until STOP' },
    gasPedal: { name: 'Gas pedal', description: 'Press further and the wheels spin faster' },
    robotCar: { name: 'Robot car', description: 'Slows down near walls and stops before it hits' },
    lighthouse: { name: 'Lighthouse', description: 'A bright flash every two seconds' },
    fridgeLight: { name: 'Fridge light', description: 'The light comes on when you open the door' },
    moodLamp: { name: 'Mood lamp', description: 'Mix any color with three knobs' },
    bikeLights: { name: 'Bike lights', description: 'White in front, flashing red at the back' },
    alarmClock: { name: 'Alarm clock', description: 'A clock with a beeping alarm switch' },
    christmasTree: { name: 'Christmas tree', description: 'Twinkling lights and a color-changing star' },
    crossing: { name: 'Crossing button', description: 'Hold the button so people can cross' },
    gardenLamp: { name: 'Garden lamp', description: 'A relay turns on a big lamp at night' },
    stopwatch: { name: 'Stopwatch', description: 'Switch it on and it counts the seconds' },
    steadyHand: { name: 'Steady hands', description: 'Don\'t tip it, or it buzzes!' },
    quizBoard: { name: 'Quiz board', description: 'Press the right answer to hear the bell' },
    shoutMeter: { name: 'Shout meter', description: 'Who can make the biggest number?' },
    disco: { name: 'Disco party', description: 'Color lights and a boom-tick beat' },
    reactionGame: { name: 'Catch the light', description: 'Press while the light is on to win' },
    openSign: { name: 'Open sign', description: 'Flip the switch to open the shop' },
    pharmacySign: { name: 'Pharmacy sign', description: 'A green sign that glows all night' },
    newsDesk: { name: 'News studio', description: 'The news on screen and a moving ticker' },
    cafeMenu: { name: 'Café menu', description: 'A menu screen and a sparkly sign' },
    elevator: { name: 'Elevator screen', description: 'The floor number counts up. Ding!' },
    weatherStation: { name: 'Weather station', description: 'A temperature graph and the forecast' },
    airportBoard: { name: 'Airport board', description: 'Flights, times and a big clock' },
    cinemaSign: { name: 'Cinema sign', description: 'Bulbs run around a moving sign' },
    aiSmartHome: { name: 'Talking smart home', description: 'Ask the board to run the fan, ring the bell or light the lamp' },
    aiTrafficLight: { name: 'AI traffic light', description: 'Tell the lights how to change, in your own words' },
    aiPartyLights: { name: 'AI party lights', description: 'Ask for a new light dance and watch it start' },
    aiPlantHelper: { name: 'AI plant helper', description: 'The pump waters dry soil. Ask it to change the rules' },
    aiRobotPet: { name: 'AI robot pet', description: 'A wagging tail and blue eyes. Teach it to beep when touched' },
    ecuCooling: { name: 'Engine cooling fan', description: 'The hotter the engine, the faster the ECU spins the radiator fan' },
    ecuHeadlights: { name: 'Automatic headlights', description: 'The ECU turns the headlights on at dusk' },
    ecuWipers: { name: 'Rain-sensing wipers', description: 'Rain on the glass starts the wiper; heavy rain sweeps faster' },
    ecuParking: { name: 'Parking radar', description: 'Reversing: the closer the wall, the more bars and the faster the beeps' },
    ecuCanDash: { name: 'CAN bus dashboard', description: 'The gas pedal sets the engine, and the CAN bus tells the dashboard' },
    ecuAlarm: { name: 'Car alarm with SMS', description: 'A knock on the glass: siren, hazard lights and a text to the owner' },
    ecuTracker: { name: 'GPS car tracker', description: 'The GPS finds the car and LoRa reports where it is' },
    plcConveyor: { name: 'Conveyor belt', description: 'The belt runs until a box reaches the sensor at its end' },
    plcTank: { name: 'Tank filling', description: 'The PLC runs the pump until the tank is full' },
    plcAndon: { name: 'Machine stack light', description: 'Green runs, yellow changes over, red stops with a horn' },
    plcSafety: { name: 'Guard door interlock', description: 'Open the guard door and the press stops at once' },
    plcModbus: { name: 'Furnace over Modbus', description: 'The furnace’s temperature goes to the control room on RS-485' },
    plcHydraulic: { name: 'Hydraulic power pack', description: 'The pump builds the pressure, and Wi-Fi sends it to the plant' },
    plcBurner: { name: 'Burner flame safety', description: 'The gas valve stays open only while the flame is seen' },
    rtuWellhead: { name: 'Wellhead pressure', description: 'The well’s pressure goes out by LoRa; too high sets off the alarm' },
    rtuGasLeak: { name: 'Gas leak alarm', description: 'Poisonous gas at the well: beacon, horn and a text to the supervisor' },
    rtuPumpJack: { name: 'Pump jack', description: 'Lifts oil into the tank and stops when the tank is full' },
    rtuFlare: { name: 'Flare watchdog', description: 'If the flare goes out, the horn sounds and a text goes out' },
    rtuTankFarm: { name: 'Oil tank level', description: 'The tank’s level on a bar gauge and in the cloud' },
    rtuPipeline: { name: 'Pipeline booster pump', description: 'Keeps the pipeline’s pressure up and reports it over Modbus' },
    smsFireAlarm: { name: 'SMS fire alarm', description: 'A flame makes it beep and send a text to your phone' },
    wifiWeather: { name: 'Wi-Fi weather station', description: 'Sends the temperature to the cloud every second' },
    btHeartBand: { name: 'Bluetooth heart band', description: 'Beats with your heart and sends each beat to the phone' },
    loraFarm: { name: 'LoRa farm sensor', description: 'Sends the soil’s wetness kilometres away, far from any Wi-Fi' },
    wifiDoorbell: { name: 'Wi-Fi doorbell', description: 'Rings inside and tells your phone someone is at the door' },
    gpsBike: { name: 'GPS bike computer', description: 'Finds the bike with GPS and sends it to the phone by Bluetooth' },
  },
  gallery: {
    title: 'Examples',
    description: (count) => `${count} ready-made projects. Pick one to open it on your board.`,
    all: 'All',
    shelves: 'Kinds of examples',
    categories: {
      first: { name: 'First circuits', short: 'Basics', blurb: 'A battery, a few wires, and your first lights and motors.' },
      electronics: { name: 'Electronics', short: 'Electronics', blurb: 'Transistors, capacitors, diodes and fuses at work.' },
      boards: { name: 'Boards and code', short: 'Code', blurb: 'Tiny computers that blink, chase and fade lights.' },
      smart: { name: 'Smart gadgets', short: 'Smart', blurb: 'Sensors tell a board what is going on, and it does something.' },
      screens: { name: 'Screens and signs', short: 'Screens', blurb: 'Numbers, words, clocks and shows that light up.' },
      science: { name: 'Science lab', short: 'Science', blurb: 'Meters and an oscilloscope show what electricity does.' },
      logic: { name: 'Logic and chips', short: 'Chips', blurb: 'Little chips that decide, count and keep time.' },
      sound: { name: 'Sound and music', short: 'Sound', blurb: 'Beeps, notes, sirens and tunes.' },
      motion: { name: 'Motion and robots', short: 'Robots', blurb: 'Motors, magnets and servos that move things.' },
      home: { name: 'Home and city', short: 'Home', blurb: 'Gadgets for your house and your street.' },
      games: { name: 'Games and fun', short: 'Games', blurb: 'Play with friends and test your skills.' },
      ai: { name: 'Talk to AI', short: 'AI', blurb: 'Tell the AI board what to do, and it sets its own pins.' },
      iot: { name: 'Connected', short: 'Online', blurb: 'SMS, Wi-Fi, Bluetooth, LoRa and GPS: projects that send messages.' },
      car: { name: 'Cars', short: 'Cars', blurb: 'The engine computer (ECU) and the networks inside a car.' },
      factory: { name: 'Factories', short: 'Factory', blurb: 'The PLC runs belts, pumps, presses and burners.' },
      oil: { name: 'Oil and gas', short: 'Oil', blurb: 'The RTU watches a far-away well and reports to the control room.' },
    },
    levels: { 1: 'Easy', 2: 'Medium', 3: 'Hard' },
    search: 'Find an example',
    searchLabel: 'Search the examples',
    clearSearch: 'Clear search',
    levelFilter: 'How hard',
    anyLevel: 'All levels',
    found: (count) => (count === 1 ? '1 example' : `${count} examples`),
    noResults: 'No examples match',
    noResultsHint: 'Try another word, or pick All levels.',
    showAll: 'Show all',
    screens: {
      party: 'Party time!',
      holiday: 'Happy holidays!',
      score: 'GOAL!\nHOME 2 : 1 AWAY',
      doorbell: 'Welcome home!\nPress the bell',
      busStop: 'Park Road stop\nBus 12      3 min\nBus 7       8 min\nBus 21     15 min',
      smartHome: 'Welcome home!\nAll is well',
      charging: 'Charging\n80%',
      calling: 'Grandma\nis calling',
      tree: 'Merry Christmas!',
      quiz: 'Which one is a star?\nA: the Moon\nB: the Sun\nC: Mars',
      cinema: 'NOW SHOWING: Robots in Space',
      departures: 'DEPARTURES\nParis       10:45\nTokyo       11:20\nCairo       12:05',
      pharmacy: 'PHARMACY\nOpen day and night',
      elevator: 'Going up\nPlease wait',
      weather: 'Sunny and warm\nRain on Friday',
      menu: 'CAFE MENU\nHot cocoa     2.50\nPancakes      4.00\nApple juice   1.80',
      open: 'OPEN',
      news: 'Kite show in the park on Friday • The new library opens today • Sunny all week',
      disco: 'Dance!',
      baby: 'Baby room\nListening...',
      smsCar: 'Car alarm! Someone is at your car.',
      smsGas: 'GAS ALARM at Well 7! Leave the area.',
      smsFlare: 'Well 7: the flare is out! Please check.',
      smsFire: 'Fire at home! Please call for help.',
    },
  },
  inspector: {
    tab: 'Details',
    missionsTab: 'Missions',
    empty: 'Nothing picked yet',
    emptyHint: 'Tap a part or a wire to see more about it.',
    voltage: 'Voltage',
    current: 'Current',
    power: 'Power',
    speed: 'Speed',
    brightness: 'Brightness',
    batteryVoltage: 'Battery size',
    color: 'Color',
    resistance: 'Resistance',
    switchState: 'Switch',
    on: 'On',
    off: 'Off',
    knob: 'Knob',
    rotate: 'Turn',
    duplicate: 'Copy',
    delete: 'Delete',
    repair: 'Fix it',
    wire: 'Wire',
    wireColor: 'Wire color',
    wireCurrent: 'Current in this wire',
    deleteWire: 'Delete wire',
    readings: 'Meter',
    settings: 'Change it',
    whatItDoes: 'What does it do?',
    plusEnd: 'Red dot: the + end',
    minusEnd: 'Black dot: the − end',
    capacitance: 'Size',
    rating: 'Breaks above',
    light: 'Light',
    charge: 'Charge',
    program: 'What each pin does',
    programHint: 'Tap a pin to change what it does.',
    code: 'The code it runs',
    pinModes: {
      off: 'Off',
      on: 'On',
      blink: 'Blink',
      blink2: 'Blink, take turns',
      step1: 'Step 1 of 3',
      step2: 'Step 2 of 3',
      step3: 'Step 3 of 3',
      fade: 'Fade',
      follow: 'Follow sensor',
      invert: 'Opposite of sensor',
      alarm: 'Sensor alarm',
    },
    a0: 'Sensor input reads',
    angle: 'Angle',
    signal: 'Signal',
  },
  node: { on: 'On', off: 'Off', press: 'Hold me', replace: 'Fix it' },
  display: {
    modes: {
      number: 'Number',
      counter: 'Count',
      clock: 'Clock',
      volts: 'Volts',
      text: 'Words',
      scroll: 'Slide',
      graph: 'Graph',
      picture: 'Picture',
      demo: 'Show',
    },
    effects: {
      scrollLeft: 'Slide left',
      scrollRight: 'Slide right',
      static: 'Stay still',
      blink: 'Blink',
      sparkle: 'Sparkle',
    },
    demos: {
      reel: 'All shows',
      cityAd: 'Big sign',
      fireworks: 'Fireworks',
      rainbow: 'Rainbow',
      news: 'News',
      clock: 'Clock',
      bars: 'Color bars',
    },
    tints: {
      red: 'Red',
      green: 'Green',
      blue: 'Blue',
      yellow: 'Yellow',
      white: 'White',
      rainbow: 'Rainbow',
      yellowBlue: 'Yellow and blue',
    },
    show: 'What it shows',
    digits: 'Digits',
    size: 'Size',
    across: 'Across',
    down: 'Down',
    backlight: 'Light color',
    text: 'Words',
    number: 'Number',
    line: (n) => `Line ${n}`,
    effect: 'How the words move',
    picture: 'Your photo or video',
    upload: 'Add a photo or video',
    replace: 'Pick another',
    remove: 'Take it away',
    mediaHint: 'It stays on this device. Videos play with no sound.',
    tooBig: 'This file is too big. Pick one under 200 MB.',
    badFile: 'This file can’t be shown. Pick a photo or a video.',
    play: 'Play',
    pause: 'Pause',
    next: 'Next show',
    leds: (w, h) => `${w} × ${h} lights`,
    signal: 'S reads',
    noPower: 'No power',
    samples: {
      lcd: 'Hello, world!\nI built this!\nCircuit Lab\nHave a nice day',
      oled: 'Hello!',
      tft: 'Hello, world!',
      matrix: 'Welcome!\nGold 18K • Best price today',
      citySign: 'Welcome to our city! • Have a nice day',
      newsTitle: 'City news',
      news: 'Big kite show in the park on Friday • Sunny and warm all week • The new library opens today',
      ad: 'Have a nice day!',
    },
  },
  statusBar: {
    complete: 'It works! Power is flowing',
    open: 'The loop is not closed yet',
    short: 'Short circuit!',
    noBattery: 'Add a battery',
    empty: 'The board is empty',
    paused: 'Paused',
    count: (parts, wires) =>
      `${parts} ${parts === 1 ? 'part' : 'parts'} · ${wires} ${wires === 1 ? 'wire' : 'wires'}`,
    batteryCurrent: 'Current',
  },
  toasts: {
    lampBurnt: 'The lamp burnt out! The power was too strong.',
    ledBurnt: 'The LED burnt out! It needs a resistor.',
    short: 'Short circuit! Take away the bare wire.',
    mission: 'Mission done!',
    copied: 'Copied',
    fuseBlown: 'The fuse broke! It stopped too much power.',
    partBurnt: 'A part burnt out! Too much power.',
  },
  missions: {
    title: 'Missions',
    progress: (done, total) => `${done} of ${total} done`,
    reset: 'Start again',
    allDone: 'You did every mission. Great job, engineer!',
    items: {
      light: 'Light up a lamp',
      flashlight: 'Make a flashlight with a switch and turn it on',
      motor: 'Make the motor spin',
      reverse: 'Spin the motor both ways',
      led: 'Light an LED without burning it',
      doorbell: 'Make the buzzer beep with a push button',
      parallel: 'Light two lamps brightly at the same time',
      dimmer: 'Change a lamp’s light with the dimmer',
      meter: 'Measure the voltage of a part with the voltmeter',
      blink: 'Blink an LED with the Arduino',
      transistor: 'Turn something on with a transistor',
      capacitor: 'Keep a light on with only a capacitor',
      servo: 'Turn a servo with the Arduino',
      sensor: 'Let a sensor switch on a light through the Arduino',
      screen: 'Show a photo or video on a screen',
    },
  },
  empty: {
    title: 'Your board is ready!',
    body: 'Add some parts, then join their dots with wires to make the power flow.',
    cta: 'Show me a flashlight',
  },
  help: {
    title: 'How to play',
    intro: 'Power flows only in a full loop: out of the battery +, through your parts, and back to −.',
    steps: [
      'Drag a part onto the board, or just tap it.',
      'Drag from a dot on one part to a dot on another part. That makes a wire.',
      'Tap a switch to turn it on. Hold a push button down.',
      'Tap a part to see its numbers.',
      'Finish the missions and become an engineer!',
    ],
    shortcuts: 'Keyboard shortcuts',
    keys: [
      ['Delete', 'Delete'],
      ['R', 'Turn the part'],
      ['Ctrl + D', 'Copy the part'],
      ['Ctrl + Z', 'Undo'],
      ['Ctrl + Shift + Z', 'Redo'],
      ['Space', 'Flip the switch'],
    ],
  },
  drag: { drop: 'Drop it here' },
  wirePalette: 'Wire color',
  controls: { zoomIn: 'Zoom in', zoomOut: 'Zoom out', fit: 'See everything' },
  workshop: {
    tips: {
      supplyLimit: 'The current limit is on (the CC light). The supply holds the current there so nothing burns. Turn the limit up, or add a resistor.',
      potHint: 'Join A to + and B to −. Then W gives a voltage in between. Turn the knob to change it.',
      potHot: 'Too much current in the knob! Don’t join W straight to + or −.',
      relayWeak: 'The coil needs about 4 V to pull the switch. A board pin is too weak for it: let a transistor switch the coil.',
      relayHint: 'Give the coil power (+ and −). Then the switch between COM and NO closes.',
      rgbHint: 'Join R, G or B to + through a resistor, and the − leg to −.',
      speakerOver: 'Very loud and getting hot! Use a smaller battery, or add a resistor.',
      magnetHot: 'The coil is getting hot! Use a smaller battery, or add a resistor.',
      regulatorLow: 'It needs at least 7 V on IN to give a steady 5 V. Try a 9 V battery.',
      regulatorHot: 'The regulator is hot: it turns the extra volts into heat. Give IN fewer volts, or take less current.',
      regulatorHint: 'Join IN to + (7 to 12 V) and GND to −. Then OUT gives 5 V.',
      chipPower: 'This chip needs power. Join its + to + and its − to −.',
      chipWeak: 'Not enough power for this chip. Try a bigger battery.',
      chipReverse: 'The chip is joined the wrong way. Swap its + and − wires.',
      timerWeak: 'The 555 needs at least 4.5 V. Try a 9 V battery or the 5V pin.',
      scopeHint: 'Join + to the spot you want to watch, and − to the battery −.',
    },
    voltage: 'Voltage',
    limit: 'Current limit',
    limitHint: 'The most current it will give. A small limit keeps LEDs safe.',
    knobSize: 'Size',
    wiper: 'W gives',
    note: 'Note',
    notes: ['Low', 'Middle', 'High'],
    sound: 'Sound',
    sounds: ['Beep', 'Siren', 'Fast', 'Hi-lo'],
    soundHints: [
      'A steady beep, like an alarm clock.',
      'Slowly up and down, like a police car: wooo-iiii-ooo.',
      'Up and down very fast. Police cars use it in busy traffic.',
      'Two notes in turn: nee-naw, nee-naw.',
    ],
    speed: 'Blink speed',
    speeds: ['Slow', 'Medium', 'Fast'],
    perSecond: (n) => (n < 1 ? `1 blink every ${1 / n} seconds` : n === 1 ? '1 blink a second' : `${n} blinks a second`),
    span: 'Time across the screen',
    seconds: (n) => `${n} seconds`,
    strength: 'Magnet strength',
    shake: 'Shake',
    loudness: 'Loudness',
    open: 'Open',
    closed: 'Closed',
    coil: 'Coil',
    contactCurrent: 'Current in the switch',
    regulatorIn: 'In',
    regulatorOut: 'Out',
    truthTable: 'Truth table',
    truthHint: 'Each row is one way to set the inputs. 1 means on and 0 means off. The lit row is what is happening now.',
    gateRules: {
      notGate: 'Y is the opposite of A.',
      andGate: 'Y is on only when A and B are both on.',
      orGate: 'Y is on when A or B is on.',
      xorGate: 'Y is on when A and B are different.',
      nandGate: 'Y is off only when A and B are both on.',
      norGate: 'Y is on only when A and B are both off.',
    },
    scopeReading: 'Voltage now',
  },
  inputs: {
    tips: {
      lemonTiny: 'Lemons give only a tiny current. It is enough to make an LED glow, but never enough for a lamp or a motor.',
      lemonMore: 'One lemon gives about 1 volt. Put more lemons in a row: three of them can light a red LED.',
      coinSag: 'The coin cell is small inside. A big load pulls its volts right down, so it can’t spin a motor.',
      crank: 'Turn the crank to make power. Slide it up to turn it faster.',
      bankLimit: 'The power bank gives 2 A at most, so it is holding the current back. Something takes too much.',
      slideHint: 'COM is joined to A or to B. Join two of these switches A to A and B to B, and you can switch a stair light from both ends.',
      microHint: 'Hold the lever down: COM lets go of NC and joins NO.',
      joystickPower: 'The joystick needs power. Join its + to 5V and its − to GND, then read X and Y.',
    },
    lemons: 'Lemons',
    lemonCount: (n) => (n === 1 ? '1 lemon' : `${n} lemons`),
    crank: 'Crank speed',
    toA: 'To A',
    toB: 'To B',
    slideTo: 'Slide to',
    lever: 'Press the lever',
    pressed: 'Pressed',
    stickX: 'Left and right',
    stickY: 'Down and up',
    volts: 'Volts now',
  },
  lab: {
    tips: {
      zenerHint: 'Join its + end to + through a resistor, and its − end to −. Then it holds 5.1 V.',
      zenerLow: 'It needs more than 5.1 V before it starts to hold. Try a 9 V battery and a resistor.',
      zenerForward: 'It is joined the other way, so it lets power through like a plain diode. Turn it around to hold 5.1 V.',
      zenerHot: 'Too much current: it is getting hot! Put a bigger resistor before it.',
      pnpBase: 'Join E to +. Then pull B toward − through a resistor to turn it on.',
      mosfetGate: 'Put a few volts on G to turn it on. Join S to −, and put the part it switches between + and D.',
      mosfetHalf: 'G has only a few volts, so it is only half on. Give G 4 V or more.',
      mosfetHot: 'It is half on and getting hot! Give G more volts so it switches fully on.',
      optoHint: 'Light its LED: + through a resistor to +, and − to −. Then the switch from C to E closes.',
      laserSafety: 'Never shine a laser into anyone’s eyes, not even your own!',
      laserWeak: 'The beam is weak. It wants about 5 V.',
      irEyes: 'It is shining, but our eyes can’t see this light. Tap Camera to look through a phone camera!',
      irCamera: 'A phone camera can see infrared light: it looks like a purple glow. That is how a TV remote talks to the TV.',
      solenoidWeak: 'Not enough current to push the rod. A board pin is too weak: let a MOSFET or a transistor switch it.',
      solenoidHot: 'The coil is getting hot! Use fewer volts, and only push for a short time.',
      pumpWeak: 'Not enough power to lift the water. Try more volts.',
      bellWeak: 'Not enough current to ring. Try a bigger battery.',
      bellHot: 'The coils are getting hot! Use fewer volts.',
      modulePower: 'This module needs power. Join its + to + and its − to −.',
      barHint: 'Join IN to the voltage you want to see, like the W pin of a potentiometer.',
      trafficHint: 'Join R, Y or G to + (a board pin works well), and − to −.',
      fanReverse: 'The fan only spins one way. Swap its + and − wires.',
      fanWeak: 'Not enough power to spin. It wants about 5 V.',
      latchHint: 'Press a button from + to S: Q turns on and stays on. A button from + to R turns it off again.',
      counterHint: 'Send pulses to CLK from a button or a 555 blinker. Each pulse moves the light along.',
      comparatorHint: 'OUT turns on when IN+ is higher than IN−. Try a light sensor on IN+ and a knob on IN−.',
      bridgeHint: 'Turn IN1 or IN2 on (a board pin works) to spin the motor on M1 and M2. Both on, or both off, stops it.',
      bridgeHot: 'Too much current: the driver is getting hot! Use a smaller motor or fewer volts.',
      meterVolts: 'Touch the red probe to one side of a part, and the black probe (COM) to the other side.',
      meterAmps: 'To measure amps, the current must go through the meter: open the loop and put the meter in the gap.',
      meterAmpsShort: 'On A, the meter is like a bare wire. Never put it straight across a battery!',
      meterOhms: 'Touch the two probes to the two ends of a part. OL means nothing joins them.',
      meterOutside: 'Measure ohms with the power off: take the battery out of the loop first.',
      meterReverse: 'The minus sign means the probes are swapped. That is OK: the number is still right!',
      meterBeep: 'Beep! The probes are joined by a path, so current can flow.',
      probePower: 'Join + and − to the + and − of the circuit you test. Then touch TIP to a wire.',
      probeLoose: 'No light: the tip touches nothing, or the voltage there is only half way.',
    },
    eyes: 'Eyes',
    camera: 'Camera',
    lookWith: 'Look with',
    viewHint: 'Our eyes can’t see infrared light, but a phone camera can.',
    dial: 'Dial',
    dials: { volts: 'Volts', amps: 'Amps', ohms: 'Ohms', beep: 'Beep' },
    dialHints: {
      volts: 'V: the push between the two probes. Put the probes on both sides of a part.',
      amps: 'A: the current going through the meter. Put the meter in the loop.',
      ohms: 'Ω: how hard it is for current to get through. Measure with the power off.',
      beep: 'Beep: it beeps when the two probes are joined, so you can find broken wires.',
    },
    reading: 'Reading',
    gate: 'Volts on G',
    held: 'Volts across it',
    push: 'Push',
    flow: 'Water flow',
    inVolts: 'Volts on IN',
    bars: (n) => `${n} of 10 bars`,
    count: 'Count',
    forward: 'Forward',
    back: 'Back',
    stop: 'Stop',
    high: 'High',
    low: 'Low',
    pulse: 'Pulse',
    latchTable: {
      title: 'Memory table',
      hint: 'S sets Q to 1 and R sets it back to 0. With both off, Q keeps what it had. If both are on, R wins.',
      keeps: 'keeps',
    },
    bridgeTable: {
      title: 'Which way the motor turns',
      hint: 'IN1 sets M1 and IN2 sets M2. The motor only turns when the two are different.',
      motor: 'Motor',
    },
  },
  radio: {
    tips: {
      power: 'This module needs power: join + to + and − to −, with 3 V or more. A board’s 5V pin is just right.',
      joining: {
        gsm: 'Looking for the mobile network. Like a phone you just turned on, it takes a couple of seconds.',
        wifi: 'Joining the Wi-Fi network…',
        bluetooth: 'Pairing with the phone…',
        lora: 'Joining the LoRa network…',
        gps: 'Listening for satellites. It must hear four of them to know where it is. Out in the open it hears more.',
        canBus: 'Joining the bus…',
        rs485: 'Joining the line…',
      },
      ready: {
        gsm: 'Ready! Make IN go HIGH (with a board pin or a sensor) and it sends the message to the phone.',
        wifi: 'Online: every second it sends the volts on IN to the cloud, so you can watch them on a phone anywhere.',
        bluetooth: 'Paired: twice a second it sends the volts on IN to the phone next to it.',
        lora: 'Every 2 seconds it sends the volts on IN, as far as 10 km, using less power than a small LED.',
        gps: 'Fix! It knows where it is. PPS gives a pulse at the start of every second, right to a millionth of a second.',
        canBus: 'Ten times a second it puts the volts on IN onto the car’s bus, as one byte in a CAN message.',
        rs485: 'Four times a second it writes the volts on IN into Modbus register 40001, for the control room.',
      },
      sending: 'Sending the text… A real SMS module takes a few seconds, and needs short bursts of up to 2 A.',
      sent: 'Sent! IN must go LOW and then HIGH again before it sends another one.',
    },
    joining: {
      gsm: 'Searching',
      wifi: 'Joining',
      bluetooth: 'Pairing',
      lora: 'Joining',
      gps: 'Searching',
      canBus: 'Starting',
      rs485: 'Starting',
    },
    receivers: {
      gsm: 'Phone',
      wifi: 'Cloud dashboard',
      bluetooth: 'Phone app',
      lora: 'LoRa gateway',
      gps: 'Where it is',
      canBus: 'Car dashboard',
      rs485: 'Control room',
    },
    sending: 'Sending',
    ready: 'Ready',
    sent: (n) => `${n} sent`,
    sats: (n) => `${n} satellites`,
    message: 'Message',
    phone: 'Phone number',
    messageHint: 'It sends this text each time IN goes HIGH.',
    defaultMessage: 'Alarm! Please check the sensor.',
    noMessages: 'No messages yet',
    delivered: 'Delivered',
    now: 'Sending now',
    messages: 'Messages sent',
    distance: 'Distance',
    signal: 'Signal',
    position: 'Position',
    waiting: 'Waiting for the network…',
  },
  units: { volt: 'V', amp: 'A', milliamp: 'mA', watt: 'W', ohm: 'Ω' },
}
