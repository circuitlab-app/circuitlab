import type { LearnBook } from './types'

export const enLearn: LearnBook = {
  basics: {
    title: 'How electricity works',
    intro:
      'Electricity is made of tiny, tiny bits called electrons that move through wires. They only keep moving when there is a full loop: out of the battery, through the parts and back again. To understand every part, you just need four ideas. Let’s imagine the wires are water pipes!',
    voltage: {
      name: 'Voltage',
      unit: 'volts (V)',
      text: 'Voltage is the push. It is like the water pressure from a water tank up high: the higher the tank, the harder the water pushes. One AA battery pushes with 1.5 V, and a 9 V battery pushes six times harder. Voltage is always measured between two points, like the + and − ends of a battery.',
    },
    current: {
      name: 'Current',
      unit: 'amperes, or amps (A)',
      text: 'Current is how much electricity flows past a spot every second. It is like how much water flows through a pipe. Big flows are counted in amps (A) and small ones in milliamps (mA): 1 A = 1000 mA. An LED is happy with about 20 mA, and a small lamp takes about 300 mA.',
    },
    resistance: {
      name: 'Resistance',
      unit: 'ohms (Ω)',
      text: 'Resistance is how hard it is for electricity to get through. It is like a narrow pipe: the water has to squeeze through, so less of it flows. A wire has almost no resistance, while a resistor has a lot. When electricity squeezes through resistance, some of its energy turns into heat, and in a lamp, into light.',
    },
    power: {
      name: 'Power',
      unit: 'watts (W)',
      text: 'Power is how much work electricity does every second: making light, heat, sound or movement. To find it, multiply the push by the flow: watts = volts × amps. A lamp with 3 V and 0.3 A does 3 × 0.3 = 0.9 W of work. Too many watts make a part too hot, and it can burn out.',
    },
    law: {
      title: 'Ohm’s law: the secret rule',
      idea: 'Volts, amps and ohms are always linked. If you know two of them, you can work out the third.',
      formulas: [
        { math: 'V = A × Ω', say: 'volts = amps × ohms' },
        { math: 'A = V ÷ Ω', say: 'amps = volts ÷ ohms' },
        { math: 'Ω = V ÷ A', say: 'ohms = volts ÷ amps' },
      ],
      rules: ['More push (volts) → more flow (amps).', 'A harder path (more ohms) → less flow (amps).'],
      exampleTitle: 'Try it with a lamp',
      steps: [
        { say: 'A 3 V battery and a 10 Ω lamp', math: '3 V ÷ 10 Ω = 0.3 A' },
        { say: 'A 6 V battery: twice the push', math: '6 V ÷ 10 Ω = 0.6 A' },
        { say: 'A 20 Ω lamp: twice as hard', math: '3 V ÷ 20 Ω = 0.15 A' },
      ],
    },
    units: [
      '1 A = 1000 mA (milli means one thousandth)',
      '1 kΩ = 1000 Ω (kilo means a thousand)',
      'One AA battery gives 1.5 V, and two in a row give 3 V',
      'amps = volts ÷ ohms',
      'watts = volts × amps',
      'Capacitors are measured in microfarads (µF): a bigger number holds more charge',
    ],
  },
  labels: { like: 'It’s like…', fact: 'Did you know?', nowTitle: 'Right now' },
  colorCode: {
    title: 'Read the colours',
    intro:
      'A resistor is too small to print a number on, so it wears coloured stripes instead. Each colour stands for a number.',
    bands: [
      'Stripe 1: the first number',
      'Stripe 2: the second number',
      'Stripe 3: how many zeros to add',
      'Stripe 4: how exact it is',
    ],
    colors: ['Black', 'Brown', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Violet', 'Grey', 'White'],
    gold: 'Gold',
    tolerance: 'Gold means it can be 5% more or less than its number.',
    zeros: (count) => (count === 0 ? 'no zeros' : count === 1 ? 'add 1 zero' : `add ${count} zeros`),
    result: (first, second, zeros, value) =>
      `${first} and ${second}, then ${zeros === 0 ? 'no zeros' : zeros === 1 ? 'add 1 zero' : `add ${zeros} zeros`}: ${value}`,
    chartTitle: 'Colour → number',
    tip: 'Hold it with the gold stripe on the right, then read the colours from the left.',
  },
  now: (volts, amps, ohms, watts) =>
    `Right now ${volts} pushes ${amps} through it, so it does ${watts} of work.` +
    (ohms === null ? '' : ` That means it has about ${ohms}.`),
  parts: {
    battery: {
      about: [
        'A battery is the pusher of the circuit. Chemicals inside it make a voltage between its + end and its − end.',
        'Each AA cell gives about 1.5 V. Cells in a row add up their pushes: two make 3 V, and six make 9 V.',
        'Current only flows when there is a full loop from + through your parts and back to −.',
        'Never join + straight to − with just a wire. That is a short circuit: the amps get huge and the battery gets hot.',
      ],
      like: 'It is like a water pump that pushes water around a loop of pipes. More volts means a stronger pump.',
      fact: 'The first battery was built by Alessandro Volta in 1800 from a stack of zinc and copper discs with salty cloth in between. The volt is named after him!',
    },
    solar: {
      about: [
        'A solar panel turns light into electricity. It has no moving parts and never runs out, as long as light keeps shining on it.',
        'More light gives more volts. In bright sun this panel makes about 6 V, in the shade it makes less, and in the dark it makes nothing.',
        'It can only give a small current, so it is great for LEDs, small motors and charging batteries.',
      ],
      like: 'It is like a plant leaf: both catch sunlight and turn it into energy they can use.',
      fact: 'There are no power plugs in space, so satellites and the International Space Station make their electricity with big solar panels.',
    },
    arduino: {
      about: [
        'An Arduino Uno is a tiny computer on a board. You give it a little program, and it switches its pins on and off.',
        'When a pin is on, it gives 5 V. When it is off, it gives 0 V. The 5V and GND pins can power small parts too.',
        'A pin can only give about 20 mA safely, and 40 mA at most. So an LED on a pin needs a resistor to keep the amps small.',
        'Motors need much more current than a pin can give, so they need a transistor to help.',
      ],
      like: 'It is like the brain of a robot: it decides when each light, buzzer or motor should turn on.',
      fact: 'Arduino was made in Italy in 2005 for art and design students. It is named after a café where its makers liked to meet.',
    },
    nano: {
      about: [
        'The Arduino Nano is a tiny Arduino, about as long as your thumb. It runs the same programs as the Uno.',
        'Its pins give 5 V when they are on and 0 V when they are off.',
        'Each pin gives only about 20 mA, so use a resistor with every LED and a transistor for motors.',
      ],
      like: 'It is like the Uno’s little brother: a smaller body with the same brain.',
      fact: 'The Nano is so small that it plugs right into a breadboard, and makers hide it inside robots, costumes and toys.',
    },
    mega: {
      about: [
        'The Arduino Mega is a big Arduino with lots of pins: 54 on/off pins and 16 inputs that can read voltages.',
        'Its pins work with 5 V, just like the Uno.',
        'Each pin still gives only about 20 mA, and all the pins together can share only about 200 mA. Big things like motors need their own power.',
      ],
      like: 'It is like a piano with many more keys than a toy keyboard: you can play much bigger songs.',
      fact: 'Many home-made 3D printers are run by an Arduino Mega, because a printer needs lots of pins for its motors, heaters and sensors.',
    },
    esp32: {
      about: [
        'The ESP32 is a fast little board with Wi-Fi and Bluetooth, so your project can talk to a phone or the internet.',
        'Its pins work with 3.3 V, not 5 V. When a pin is on, it gives 3.3 V.',
        'Never put 5 V into one of its pins, because that can break the chip. Each pin gives only about 20 mA safely, so LEDs need a resistor.',
      ],
      like: 'It is like a brain and a walkie-talkie in one: it can think and also send messages through the air.',
      fact: 'The ESP32 has two brains (called cores) inside, so it can do two jobs at once, like reading a sensor while talking over Wi-Fi.',
    },
    esp8266: {
      about: [
        'The ESP8266 NodeMCU is a small, cheap board with Wi-Fi. It can send sensor readings to a website or turn on a light from your phone.',
        'Its pins use 3.3 V. Putting 5 V into a pin can damage it.',
        'A pin can only give a small current, about 12 mA, so always use a resistor with an LED.',
      ],
      like: 'It is like a little postman: it carries messages from your project over Wi-Fi.',
      fact: 'When the ESP8266 came out in 2014, it made Wi-Fi so cheap that people all over the world started building their own smart-home gadgets.',
    },
    pico: {
      about: [
        'The Raspberry Pi Pico is a small board you program in MicroPython, an easy computer language.',
        'Its pins use 3.3 V. Never connect 5 V straight to one of its pins.',
        'Each pin gives only a few milliamps, so put a resistor of a few hundred ohms in front of an LED to keep it safe.',
      ],
      like: 'It is like a pocket calculator that can also flip switches: small, simple and quick.',
      fact: 'The Pico costs only about 4 dollars, yet it is thousands of times faster than the computer that helped astronauts land on the Moon.',
    },
    microbit: {
      about: [
        'The micro:bit is a pocket-size board made for schools. It has 25 little LEDs, two buttons and sensors built in.',
        'Its pins use 3.3 V and can only give a few milliamps. Add a resistor before an LED, and never connect a motor straight to a pin.',
        'You can program it with blocks that fit together like puzzle pieces, or with Python.',
      ],
      like: 'It is like a smart badge: it can show pictures with its lights and feel when you shake it.',
      fact: 'In 2016, about one million micro:bits were given free to children in the UK, so a whole year of pupils could start coding.',
    },
    raspberrypi: {
      about: [
        'The Raspberry Pi is a real computer as small as a bank card. Add a screen, keyboard and mouse, and you can play games and write Python.',
        'Its pins use 3.3 V. Putting 5 V into one of its pins can break it.',
        'Each pin should only give a small current, about 16 mA. LEDs need a resistor, and motors need a transistor or a driver board.',
      ],
      like: 'It is like a whole desktop computer shrunk down to fit in your pocket.',
      fact: 'The Raspberry Pi was made to help children learn coding, and tens of millions of them have been sold around the world.',
    },
    aiBoard: {
      about: [
        'The AI board has a helper inside called a language model: a computer program that has read a huge amount of writing, so it can understand your words and write back.',
        'Ollama is a free app that runs the model on your own computer, not on the internet. Your words stay at home.',
        'When you ask for something, the AI picks a program for each pin, like on, blink or fade, and the board runs it. It can only pick programs the pins already have.',
        'AI can make mistakes. Look at the pins and the parts to check what it really did.',
      ],
      like: 'It is like asking a friend to work the switches for you: you say what you want, and your friend flips them.',
      fact: 'A language model does not think like a person. It guesses the next word, again and again, very fast.',
    },
    switch: {
      about: [
        'A switch opens or closes a gap in the loop. Closed (on), current flows. Open (off), the loop is broken and everything stops.',
        'A switch does not make electricity. It only lets it pass or stops it. When it is closed, it has almost no resistance.',
        'It must be in the same loop as the part you want to control.',
      ],
      like: 'It is like a drawbridge: when it is down, cars can cross, and when it is up, nobody gets across.',
      fact: 'The light switch on your wall works exactly the same way. It opens and closes a gap in a wire hidden inside the wall.',
    },
    button: {
      about: [
        'A push button closes the loop only while you press it. When you let go, a spring opens it again.',
        'While it is pressed, current flows with almost no resistance. When it is released, no current flows at all.',
        'That is why buttons are used for doorbells, game controllers and keyboard keys.',
      ],
      like: 'It is like a doorbell: it only rings while your finger is on it.',
      fact: 'A computer keyboard has a little button under every key, and the computer checks all of them many times every second.',
    },
    dimmer: {
      about: [
        'A dimmer, also called a potentiometer, is a resistor you can change by turning a knob.',
        'Turn it up and its resistance gets small, so more amps flow and a lamp shines brighter. Turn it down and the resistance grows, so fewer amps flow and the lamp gets dim.',
        'It is Ohm’s law in your hand: the same volts with more ohms give fewer amps.',
      ],
      like: 'It is like a water tap: open it wide and lots of water flows, close it a bit and only a trickle comes out.',
      fact: 'The volume knob on many radios and electric guitars is the same kind of part: a potentiometer.',
    },
    resistor: {
      about: [
        'A resistor makes it harder for electricity to flow. Its number in ohms (Ω) tells you how hard: 10 Ω is a little, 1000 Ω (1 kΩ) is a lot.',
        'We use it to keep the amps small and protect delicate parts like LEDs.',
        'Example: a 3 V battery with a 100 Ω resistor lets 3 ÷ 100 = 0.03 A, or 30 mA, flow.',
        'The energy it holds back turns into heat, so too many watts can make a resistor hot.',
      ],
      like: 'It is like a narrow doorway in a busy school: only a few children can squeeze through at a time.',
      fact: 'The coloured stripes on a resistor are a secret code. Brown, black, brown means 1, 0 and then one more zero: 100 Ω!',
    },
    capacitor: {
      about: [
        'A capacitor stores electric charge for a short time, then gives it back. It fills up when a voltage pushes charge in, and empties when it has a path to let go.',
        'Its size is measured in microfarads (µF). A bigger number holds more charge, so it takes longer to fill and keeps a light on for longer.',
        'Filling it through a resistor slows it down: more ohms means a slower fill.',
        'This kind has a + side and a − side and can take up to 16 V, so connect it the right way round.',
      ],
      like: 'It is like a bucket under a tap: it fills up, and you can pour it out later. A bigger bucket, with more µF, holds more.',
      fact: 'A camera flash uses a capacitor. It slowly fills up, then lets all its charge out in a split second to make a super-bright flash.',
    },
    diode: {
      about: [
        'A diode lets current flow only one way, from its + side to its − side. Turned around, it blocks the current.',
        'It needs a small push of about 0.7 V before it starts to let current through.',
        'Diodes protect circuits from batteries that are put in backwards. The stripe on a diode marks its − end.',
      ],
      like: 'It is like a one-way door, or the valves in your heart that let blood flow in only one direction.',
      fact: 'An LED is a special diode that gives out light. That is why an LED also works only one way round!',
    },
    transistor: {
      about: [
        'A transistor is an electronic switch with no moving parts. It has three legs: B (base), C (collector) and E (emitter).',
        'A tiny current into B controls a current about 100 times bigger from C to E. So 3 mA into B can let up to 300 mA flow, enough for a motor.',
        'B needs about 0.7 V to wake up, and it should always get its current through a resistor.',
        'This is how a weak board pin can switch on a big motor or a bright lamp.',
      ],
      like: 'It is like a tiny handle on a giant water pipe: a little twist of your fingers controls a huge rush of water.',
      fact: 'The chip inside a phone has billions of transistors, each far smaller than a speck of dust, all switching on and off super fast.',
    },
    fuse: {
      about: [
        'A fuse is a safety guard. Inside is a very thin wire that lets current pass with almost no resistance.',
        'Its number tells you how many amps it can take, like 0.5 A. If more amps flow, the thin wire gets so hot that it melts and breaks the loop.',
        'That stops the current before wires or batteries get dangerously hot. A blown fuse must be replaced, but fix the problem first!',
      ],
      like: 'It is like the weakest link in a chain, chosen on purpose: if you pull too hard, it snaps first and saves everything else.',
      fact: 'A car has a whole box of fuses, a different one for the lights, the radio and the windows, so one problem cannot harm everything.',
    },
    lamp: {
      about: [
        'A lamp has a very thin wire inside called a filament. When current squeezes through it, the wire gets so hot that it glows.',
        'This lamp has about 10 Ω. With 3 V, Ohm’s law gives 3 ÷ 10 = 0.3 A, and 3 × 0.3 = 0.9 W: a nice bright glow.',
        'With 1.5 V it glows dimly. With 9 V far too many amps flow and the filament burns out.',
        'Unlike an LED, a lamp works either way round.',
      ],
      like: 'It is like the glowing wires inside a toaster, only much hotter, so it shines bright yellow-white.',
      fact: 'Old light bulbs turn only a small part of their electricity into light, and most of it becomes heat. That is why LEDs, which waste much less, are replacing them.',
    },
    led: {
      about: [
        'An LED (light-emitting diode) shines when current flows through it from its + leg to its − leg. Backwards, it stays dark.',
        'It needs about 2 V to start shining, and it only wants a small current: about 20 mA (0.02 A).',
        'Too many amps burn it out in a moment, so we always put a resistor in the loop to keep the amps small.',
        'Example: with a 9 V battery and a 470 Ω resistor, about (9 − 2) ÷ 470 = 0.015 A, or 15 mA, flows. Safe and bright!',
      ],
      like: 'It is like a little plant that needs just a sip of water: a small current makes it happy, but a flood ruins it.',
      fact: 'The blue LED was so hard to invent that the scientists who made it won a Nobel Prize in 2014. With blue, LEDs could finally make white light.',
    },
    motor: {
      about: [
        'A motor turns electricity into spinning. Inside are magnets and coils of wire that push against each other.',
        'More volts make it spin faster. This motor likes about 3 V: with too little it barely turns, and with too much it races and gets hot.',
        'It needs lots of current. It has only about 4 Ω, so 3 V gives about 0.75 A, far more than a board pin can give. Use a transistor.',
        'Swap its wires and it spins the other way.',
      ],
      like: 'It is like a merry-go-round pushed by magnets: the harder the push (more volts), the faster it spins.',
      fact: 'Electric cars, drones and washing machines all use motors. Even your phone buzzes with a tiny motor that spins a lopsided weight.',
    },
    buzzer: {
      about: [
        'A buzzer turns electricity into sound. Inside, a thin plate shakes back and forth very fast, and the shaking air reaches your ears as a beep.',
        'It needs only a little current: it starts beeping at about 15 mA, and more current makes a louder beep.',
        'Too much current, more than about 60 mA, can harm it.',
      ],
      like: 'It is like a tiny drum that plays itself thousands of times every second.',
      fact: 'Microwaves, alarm clocks and smoke alarms all use buzzers to call you. A smoke alarm is loud enough to wake you from a deep sleep.',
    },
    servo: {
      about: [
        'A servo is a motor that turns to an exact angle, from 0° to 180°, and holds it there.',
        'It has three wires: + and − for power (about 5 V), and S for the signal. The power wires carry the big current.',
        'The S wire needs almost no current. It only tells the servo where to point, with short pulses about 50 times a second: a short pulse means one end, a longer pulse means the other.',
      ],
      like: 'It is like the hand of a clock that you can tell exactly where to point.',
      fact: 'Robot arms, remote-control cars and model planes use servos to steer, grab and move their wing flaps.',
    },
    ldr: {
      about: [
        'A light sensor, or LDR (light-dependent resistor), is a resistor that changes with light.',
        'In the dark it has lots of resistance, about 20,000 Ω, so very little current flows. In bright light it drops to about 200 Ω, so much more current flows.',
        'Put it in a loop with an LED or a board input, and your circuit can tell how bright it is.',
      ],
      like: 'It is like a door that opens wider the more sunshine falls on it.',
      fact: 'Many street lights have a light sensor, so they switch on by themselves when it gets dark.',
    },
    thermistor: {
      about: [
        'A thermistor is a resistor that changes with heat. This kind gets less resistance as it gets warmer.',
        'At room temperature (25 °C) it has about 10,000 Ω (10 kΩ). Warm it up and its ohms drop, so more amps can flow.',
        'Measuring that change tells you how hot something is.',
      ],
      like: 'It is like honey: cold honey is thick and slow, but warm honey flows easily.',
      fact: 'Digital fever thermometers, fridges and phone batteries use thermistors to keep an eye on the temperature.',
    },
    tilt: {
      about: [
        'A tilt switch has a tiny metal ball inside. When you tip it over, the ball rolls onto two metal contacts and closes the loop.',
        'Stand it back up and the ball rolls away, so the loop opens and the current stops.',
        'It is a switch that you don’t press: gravity does the work.',
      ],
      like: 'It is like a marble in a cup: tip the cup and the marble rolls to the other side.',
      fact: 'Some toys light up or make a sound when you tip or shake them, thanks to a tilt switch hidden inside.',
    },
    reed: {
      about: [
        'A magnet switch, or reed switch, has two thin metal strips sealed in a little glass tube.',
        'When a magnet comes near, the strips pull together and touch, closing the loop. Take the magnet away and they spring apart, and the current stops.',
        'It needs no power of its own: the magnet does the work.',
      ],
      like: 'It is like two paper clips that jump together when you bring a magnet close.',
      fact: 'Burglar alarms put a reed switch on a door frame and a magnet on the door. When the door opens, the magnet moves away, and the alarm knows!',
    },
    tempSensor: {
      about: [
        'A temperature sensor module measures how hot or cold it is.',
        'It has three pins: + and − for power, and S for the signal. The hotter it gets, the higher the voltage on S.',
        'Connect S to a board input, like A0, and the board can read the temperature as a number. The module uses only a few milliamps.',
      ],
      like: 'It is like a thermometer that talks in volts instead of showing a red line.',
      fact: 'A popular sensor called the LM35 changes by 10 millivolts (0.01 V) for every degree, so at 25 °C it gives 0.25 V.',
    },
    ultrasonic: {
      about: [
        'A distance sensor sends out a squeak of sound that is too high for people to hear, then listens for the echo.',
        'The quicker the echo comes back, the closer the object is. Here, closer things give a bigger voltage on S.',
        'Power it with + and −, then connect S to a board input to read the distance.',
      ],
      like: 'It is like shouting in a cave and waiting for the echo, or like a bat finding its way in the dark.',
      fact: 'Bats and dolphins find food this way, and cars use the same trick to beep when you get close to a wall while parking.',
    },
    pir: {
      about: [
        'A motion sensor (PIR) feels the invisible heat light, called infrared, that warm bodies like people and pets give off.',
        'When something warm moves in front of it, its S pin switches on to a high voltage. When nothing moves, S stays at about 0 V.',
        'It is only on or off, which makes it perfect for switching on lights and alarms.',
      ],
      like: 'It is like a guard dog that wakes up when someone walks past.',
      fact: 'Lights in many hallways and bathrooms use PIR sensors to switch on only when someone is there, which saves electricity.',
    },
    soundSensor: {
      about: [
        'A sound sensor has a tiny microphone. Sound is shaking air, and the microphone turns that shaking into small changes in voltage.',
        'The louder the sound, the bigger the voltage on S.',
        'Connect S to a board input, and you can build a light that turns on when you clap.',
      ],
      like: 'It is like an ear for your circuit.',
      fact: 'Sound travels about 343 metres every second in air. Light is much faster, which is why you see lightning before you hear the thunder.',
    },
    gasSensor: {
      about: [
        'A smoke sensor has a tiny heater and a special material whose resistance changes when smoke or gas touches it.',
        'More smoke or gas gives a bigger voltage on S. Because of its heater, a real one feels warm, and that is normal.',
        'In this lab it is for learning. Real homes need a proper smoke alarm.',
      ],
      like: 'It is like a nose for your circuit that can smell smoke.',
      fact: 'Cooking gas has no smell of its own! A smelly chemical is added on purpose, so people notice right away if there is a leak.',
    },
    soilSensor: {
      about: [
        'A soil sensor has two metal legs that you push into a plant pot. Wet soil lets electricity through much more easily than dry soil.',
        'Wetter soil gives a bigger voltage on S, and drier soil gives a smaller one.',
        'With a board, you can make a plant that tells you when it is thirsty.',
      ],
      like: 'It is like poking your finger into the soil to check if it is wet, but with electricity.',
      fact: 'Totally pure water hardly carries electricity at all! The water in soil carries it because it has tiny bits of minerals and salts mixed in.',
    },
    touchSensor: {
      about: [
        'A touch sensor feels your finger without any moving button. Your body changes the electricity near its pad a tiny bit, and the sensor notices.',
        'While you touch it, S goes high (on). When you let go, S goes low (off).',
        'Only a tiny current is involved, far too small to feel.',
      ],
      like: 'It is like the screen of a phone: it knows your finger is there without being pushed down.',
      fact: 'Phone and tablet screens use the same idea. That is why most of them don’t work when you wear ordinary gloves.',
    },
    flameSensor: {
      about: [
        'A flame sensor has a dark eye that sees infrared light, a kind of light our eyes can’t see. Fire gives off lots of it.',
        'The bigger and closer the flame, the bigger the signal on S. Join + and − to power it, then read S with a board.',
        'Only test it with a grown-up and a small candle, far from anything that can burn.',
      ],
      like: 'It is like a cat’s eyes that can see in the dark, but for warm, glowing things.',
      fact: 'Factories use flame sensors like this, because they notice a fire even before there is much smoke.',
    },
    rainSensor: {
      about: [
        'A rain sensor has a plate with two combs of metal lines. Their teeth sit in between each other, but they never touch.',
        'When a raindrop lands across two teeth, the water lets a little current through. More drops let more through, so the signal on S grows.',
        'The little board next to the plate turns the wet plate into a signal a board can read.',
      ],
      like: 'It is like a bridge that gets a new plank with every drop, until lots of people can cross.',
      fact: 'Many cars have a rain sensor on the windscreen that switches the wipers on all by themselves.',
    },
    waterSensor: {
      about: [
        'This sensor has long copper fingers side by side. Every other finger is joined to S, and the ones between are joined to −.',
        'Water joins the fingers together. The higher the water climbs, the more of each finger it joins, and the bigger the signal.',
        'Only dip the strip, never the part with the pins, and dry it after use so it does not rust.',
      ],
      like: 'It is like a ruler standing in a glass that tells you how full the glass is.',
      fact: 'Sensors like this warn you when a fish tank, a plant tray or a rain barrel is getting too full.',
    },
    humiditySensor: {
      about: [
        'Air always has some water in it, in bits far too small to see. Humidity says how much: 0 % is very dry, and 100 % is as damp as a cloud.',
        'Inside the blue box is a little part that soaks up water from the air, and that changes how easily current gets through it.',
        'Join + and −, and S tells how damp the air is. After a hot shower, the air in a bathroom can reach 90 % or more!',
      ],
      like: 'It is like a sponge that feels how wet the air is.',
      fact: 'Museums check the humidity all day long, because air that is too damp or too dry can crack old paintings.',
    },
    hallSensor: {
      about: [
        'A Hall sensor is a tiny chip that feels a magnet through the air, without touching it.',
        'Bring a magnet close and S turns on. Take it away and S turns off. Nothing inside moves, so it never wears out.',
        'Like the other sensor modules, it needs power on + and −.',
      ],
      like: 'It is like feeling a fridge magnet pull before it even touches the fridge.',
      fact: 'A bike computer uses a Hall sensor and a small magnet on the wheel: it counts one turn every time the magnet passes. The sensor is named after Edwin Hall, who found out how it works in 1879.',
    },
    irSensor: {
      about: [
        'An obstacle sensor has two eyes. The clear one shines infrared light, which we can’t see. The dark one waits to catch it.',
        'When something is in front, the light bounces off it, back into the dark eye, and S turns on.',
        'Dark, dull things send back less light than white, shiny ones, so they have to come a little closer.',
      ],
      like: 'It is like shouting in a cave and hearing your echo come back.',
      fact: 'Robot vacuum cleaners use sensors like this so they don’t fall down the stairs. A phone camera can see the light: point it at the clear eye!',
    },
    lineSensor: {
      about: [
        'A line sensor looks down at the floor. It shines a little light and checks how much of it bounces back.',
        'White paper sends the light back up. A black line soaks it up, so no light comes back and S turns on.',
        'Put two of them under a robot, one each side of a black line, and the robot can follow the line all by itself.',
      ],
      like: 'It is like walking along a path while you watch your feet.',
      fact: 'Schools all over the world hold races for little robot cars that follow a black line.',
    },
    forceSensor: {
      about: [
        'A press sensor is a flat pad made of two thin layers. Pressing pushes them together, so more current can get through.',
        'Press harder and the signal on S gets bigger. It can tell a soft touch from a hard squeeze.',
        'It feels how hard you press, but it is not a kitchen scale: its numbers are only rough.',
      ],
      like: 'It is like a sponge: the harder you squeeze it, the more water comes out.',
      fact: 'Some electronic drum pads have press sensors inside, so hitting harder plays a louder drum.',
    },
    pulseSensor: {
      about: [
        'Every time your heart beats, a little more blood rushes into your fingertip, and blood soaks up light.',
        'The sensor shines its green light into your finger and measures how much comes back. With every beat the light dips, and S jumps up.',
        'Slide the heart rate to try a slow, resting heart or a fast one after running. A child’s heart often beats 70 to 110 times a minute.',
      ],
      like: 'It is like watching waves pass a boat, but the waves are your blood.',
      fact: 'Smart watches measure your pulse in just this way, with the little green lights on their back.',
    },
    knockSensor: {
      about: [
        'Inside the little can is a spring with a metal pin in its middle. A knock or a shake makes the spring wobble and touch the pin.',
        'Each touch closes a tiny switch, so S turns on.',
        'Use it to make a secret knock lock, or a box that knows when someone moves it.',
      ],
      like: 'It is like a jelly that wobbles when you tap the table.',
      fact: 'Some car alarms have a shake sensor that sounds the alarm when someone bumps the car.',
    },
    slideSwitch: {
      about: [
        'A stair switch, also called a two-way switch, has three legs. COM is always joined to one side: A or B.',
        'Slide the knob and COM jumps from A to B. One of the two paths is always on.',
        'Two of them can switch one stair light from the top and from the bottom. Join A to A and B to B between the switches. Then flip either one, and the light changes!',
      ],
      like: 'It is like the points on a railway that send the train down one track or the other.',
      fact: 'Almost every house with stairs has a pair of these switches: one at the top and one at the bottom.',
    },
    microSwitch: {
      about: [
        'A micro switch is a tiny switch with a metal lever. Press the lever just a little and it clicks.',
        'COM touches NC (normally closed) until you press. Then it jumps over to NO (normally open).',
        'Robots use them as bumpers to feel a wall, and machines use them to know when a door is shut.',
      ],
      like: 'It is like the button inside a fridge door that turns the light off when you close it.',
      fact: 'The click of a computer mouse comes from a micro switch under each button.',
    },
    joystick: {
      about: [
        'A joystick is two knobs in one. Pushing the stick left and right turns one knob, and pushing it up and down turns the other.',
        'Join + and −. X gives more volts as you push right, and Y gives more volts as you push up. In the middle each one gives half.',
        'Join X to a servo or to a board’s input, and the stick controls it.',
      ],
      like: 'It is like steering a car and pressing its pedals, all with one thumb.',
      fact: 'The thumb sticks on game controllers work just like this one.',
    },
    lemon: {
      about: [
        'A lemon battery is a copper coin and a nail covered in zinc, pushed into a lemon. The sour juice lets tiny charged bits travel between the two metals.',
        'One lemon gives about 0.9 V. Join the copper of one lemon to the nail of the next, and the volts add up: three lemons make about 2.7 V.',
        'Lemons can only give a tiny current. That is enough to make a red LED glow, but never enough for a lamp or a motor.',
      ],
      like: 'It is like a team of very weak pushers: one can’t do much, but in a row they push much harder.',
      fact: 'You can make a battery from potatoes, apples or even pickles. The metals do the work: the fruit just lets the charges travel.',
    },
    coinCell: {
      about: [
        'A coin cell is a flat 3 V battery, like the one in a watch, a car key or a computer.',
        'It holds a lot of energy for its size, but it can only let it out slowly. A big load pulls its volts right down.',
        'So it can light an LED for days, but it can’t spin a motor. Keep coin cells away from little children: swallowing one is very dangerous.',
      ],
      like: 'It is like a juice box with a very thin straw: lots inside, but it only comes out slowly.',
      fact: 'The name CR2032 tells you its size: 20 mm across and 3.2 mm thick.',
    },
    dynamo: {
      about: [
        'A hand dynamo is a little generator with a crank. Turning its magnets past its coils of wire makes electricity.',
        'The faster you turn the crank, the more volts it makes. Stop turning and the power stops too.',
        'Gears inside make the little motor spin much faster than your hand does.',
      ],
      like: 'It is like a bicycle light that only shines while you pedal.',
      fact: 'Big power stations work the same way, but steam, wind or water turns their giant generators instead of a hand.',
    },
    powerBank: {
      about: [
        'A power bank is a big battery in a box that you charge up. It gives a steady 5 V from its USB port, just like a phone charger.',
        'Its lights show how full it is. It gives 2 A at most: if a part tries to take more, it holds the current back to stay safe.',
        'It is a handy, safe way to power a board like the Arduino away from a computer.',
      ],
      like: 'It is like a water bottle you fill at home and drink from on a trip.',
      fact: 'Most power banks have lithium cells inside, the same kind that power phones and electric cars.',
    },
    voltmeter: {
      about: [
        'A voltmeter measures volts: how big the push is between two points.',
        'Put it next to a part, with one wire on each side. This is called connecting it across, or in parallel. Its + goes to the side nearer the battery’s +.',
        'It has a huge resistance, about 10,000,000 Ω, so almost no current goes through it and it doesn’t change your circuit.',
        'Don’t put it inside the loop: its huge resistance would stop the current.',
      ],
      like: 'It is like a pressure gauge on a water pipe: it tells how hard the water pushes without letting any out.',
      fact: 'A fresh AA battery reads about 1.5 V or a little more, and a tired one reads less. A voltmeter can tell you which batteries are still good.',
    },
    ammeter: {
      about: [
        'An ammeter measures amps: how much current flows through the loop.',
        'Put it inside the loop, so all the current has to pass through it. This is called connecting it in series.',
        'It has almost no resistance, about 0.01 Ω, so it doesn’t slow the current down.',
        'Never connect it straight across a battery: with almost no resistance, a huge current would flow, just like a short circuit.',
      ],
      like: 'It is like a water meter on a pipe: every drop has to go through it, so it can count the flow.',
      fact: 'The amp is named after André-Marie Ampère, a French scientist who studied electricity and magnets about 200 years ago.',
    },
    segment: {
      about: [
        'A 7-segment display shows numbers with 7 little LED bars, arranged like the number 8. Lighting different bars makes each number from 0 to 9.',
        'Every bar is an LED, so each one needs about 2 V, a small current of about 10 to 20 mA, and a resistor.',
        'Showing an 8 lights all 7 bars, so it uses about 7 times the current of a single bar.',
      ],
      like: 'It is like making numbers out of matchsticks: move the sticks and you get a different number.',
      fact: 'Microwave clocks, alarm clocks and petrol pumps often use 7-segment displays. Many have a tiny dot as an 8th LED for the decimal point.',
    },
    lcd: {
      about: [
        'A character LCD shows letters and numbers in rows, often 2 rows of 16 letters.',
        'Its letters are made of tiny dots of liquid crystal. They don’t make light: they work like tiny shutters that block it. A backlight LED behind them makes the screen glow.',
        'The screen part needs only about 1 mA. The backlight uses much more, often tens of milliamps. It usually runs on 5 V and is controlled by a board.',
      ],
      like: 'It is like a window with lots of tiny blinds: each one closes to make a dark dot in front of the light.',
      fact: 'Many calculators use an LCD without a backlight. It needs so little power that a tiny solar cell or battery can run it for years.',
    },
    oled: {
      about: [
        'An OLED screen is made of thousands of tiny dots called pixels, and each one makes its own light. No backlight is needed!',
        'A small 128 × 64 OLED has 8,192 pixels.',
        'Each lit pixel uses a tiny bit of current, so a screen full of white dots uses more amps than a mostly black one. Black pixels are simply off.',
      ],
      like: 'It is like a mosaic picture made of tiny glowing lights instead of tiles.',
      fact: 'Many phones and smartwatches have OLED screens. A black background saves battery there, because black pixels are switched off.',
    },
    tft: {
      about: [
        'A colour TFT screen shows full-colour pictures. Every pixel has three tiny parts: red, green and blue. Mixing them makes every colour.',
        'TFT means thin-film transistor: each tiny colour dot has its own transistor that switches it on and off.',
        'It needs a backlight made of LEDs, so it uses more current than a small OLED, often about 50 to 100 mA.',
      ],
      like: 'It is like a giant paint box with only red, green and blue, mixed in millions of tiny dots.',
      fact: 'Put a drop of water on a phone screen and look closely: it works like a magnifying glass, and you may see the tiny red, green and blue dots!',
    },
    matrix: {
      about: [
        'A dot-matrix board is a grid of LEDs in rows and columns, like 8 by 8. Lighting the right dots draws letters, and shifting them along makes a scrolling message.',
        'Each dot is an LED that needs about 20 mA. If all 64 dots of an 8 × 8 grid were fully on at once, that would be more than 1 A!',
        'So the board lights one row at a time, so fast that your eyes see the whole picture. Bigger signs still need a strong power supply.',
      ],
      like: 'It is like a stadium crowd doing a wave: each person stands up for a moment, and the picture seems to move.',
      fact: 'The scrolling signs in shops, buses and train stations are LED dot-matrix boards. The letters don’t really move: dots just switch on and off in turn.',
    },
    ledwall: {
      about: [
        'A big LED video wall, like a city TV, is made of many panels, each packed with thousands of tiny red, green and blue LEDs.',
        'Outdoor screens must be very bright to be seen in sunshine, and brighter means more amps.',
        'With so many LEDs, a big wall can use thousands of watts, as much as several kettles boiling at once. Real ones run on mains power, so only trained electricians install them.',
      ],
      like: 'It is like a giant TV made of building bricks: each brick is a panel, and you can snap on more to make it bigger.',
      fact: 'From far away you see a smooth picture, but up close you can see every single LED. Your eyes and brain blend the dots together.',
    },
    powerSupply: {
      about: [
        'A power supply plugs into the wall and gives exactly the voltage you pick, from 0 to 12 V. Engineers keep one on their desk instead of batteries.',
        'It also has a current limit. If a part tries to take more amps than the limit, the supply holds the current there and its CC light comes on. That stops LEDs from burning out!',
        'Its little screen shows two numbers: the volts it pushes, and the amps flowing out.',
      ],
      like: 'It is like a water tap you can turn up and down, with a safety valve that never lets too much water rush out.',
      fact: 'CV means “constant voltage” and CC means “constant current”. Real power supplies switch between them all by themselves, just like this one.',
    },
    potentiometer: {
      about: [
        'A potentiometer is a knob with three legs. Inside, a track of resistance runs from A to B, and a little arm called the wiper (W) slides along it as you turn.',
        'Join A to + and B to −. Then W gives a voltage in between: turn one way for 0 V, the other way for the full voltage.',
        'This is called a voltage divider. It is perfect for telling a board’s input, or a servo, how far to go.',
      ],
      like: 'It is like a playground slide: the higher you stand on it, the more push you have.',
      fact: 'The volume knob on a radio and the joysticks on game controllers are potentiometers!',
    },
    relay: {
      about: [
        'A relay is a switch worked by an electromagnet. When current flows in its coil, the coil becomes a magnet and pulls a metal arm. Click! The switch between COM and NO closes.',
        'The coil needs about 4 V (about 55 mA), but the switch can carry big currents for lamps and motors. So a small current switches a big one.',
        'The coil and the switch are not joined by any wire. They can even use two different batteries.',
      ],
      like: 'It is like asking a strong friend to open a heavy door for you: you only tap them on the shoulder.',
      fact: 'The very first computers were built from thousands of clicking relays. They were loud!',
    },
    rgbLed: {
      about: [
        'An RGB LED has three tiny LEDs inside one bulb: R is red, G is green and B is blue. They all share one − leg.',
        'Light each color through its own resistor. Red and green make yellow, red and blue make pink, and all three make white!',
        'Each little LED still works one way only, and needs a resistor, just like a normal LED.',
      ],
      like: 'It is like mixing paint, but with light: three colors can make almost any color you like.',
      fact: 'Every dot on a phone or TV screen is made of tiny red, green and blue lights, just like this one.',
    },
    speaker: {
      about: [
        'A speaker has a paper cone, a coil and a magnet. Current in the coil pushes the cone in and out, and that shakes the air into sound.',
        'More power makes it louder. Pick a low, middle or high note on its card.',
        'It is only 8 Ω, so it takes a lot of current. Too much power makes it hot, and on 9 V it can break.',
      ],
      like: 'It is like a drum that plays itself: the cone is the drum skin, and electricity is the drummer.',
      fact: 'A speaker can work backwards: shout into one and it makes a tiny current. That is how a microphone works!',
    },
    vibration: {
      about: [
        'A vibration motor is a tiny motor with a heavy weight stuck on one side. When it spins, the weight swings around and the whole motor shakes.',
        'It wants about 3 V. It shakes the same whichever way round you join it.',
        'Too many volts make it shake wildly and get hot.',
      ],
      like: 'It is like a washing machine dancing across the floor when all the clothes are on one side.',
      fact: 'Phones, game controllers and smart watches all have one inside to buzz in your hand.',
    },
    electromagnet: {
      about: [
        'An electromagnet is a coil of wire wrapped around a piece of iron. When current flows, it becomes a magnet. Turn the current off, and the magnet is gone!',
        'More current makes a stronger magnet. Swap the wires, and its north (N) and south (S) ends swap too.',
        'The coil has only a little resistance, so it takes a lot of current and gets hot if you give it too much.',
      ],
      like: 'It is like a magnet with an on and off switch.',
      fact: 'Giant electromagnets in scrapyards lift whole cars, then drop them when the power is turned off.',
    },
    regulator: {
      about: [
        'A voltage regulator is a chip that keeps its OUT pin at a steady 5 V, even when the voltage going in changes.',
        'Join IN to + (7 to 12 V) and GND to −, and take 5 V from OUT. It needs about 2 V more on IN than it gives out.',
        'The extra volts turn into heat. With a big current it gets hot, so real ones often sit on a metal heatsink.',
      ],
      like: 'It is like a dam on a river: however much water arrives, the same calm amount flows out.',
      fact: 'The 7805 is one of the most used chips ever. The “05” in its name means 5 volts.',
    },
    notGate: {
      about: [
        'A NOT gate is a tiny chip that flips its input. If A is on (1), Y is off (0). If A is off, Y is on.',
        'Logic chips need power on + and −. An input counts as on when it has more than half of the supply voltage.',
        'An input that is not joined to anything counts as off.',
      ],
      like: 'It is like a friend who always says the opposite: you say “yes”, they say “no”.',
      fact: 'Computers have billions of tiny gates like this inside, each switching billions of times a second.',
    },
    andGate: {
      about: [
        'An AND gate turns Y on only when A and B are both on.',
        'Join two switches from + to A and B. Only when both switches are on does the LED on Y light up.',
        'Like every logic chip, it needs power on + and −.',
      ],
      like: 'It is like a door with two locks: you need both keys to open it.',
      fact: 'A washing machine uses AND: it only starts when the door is shut AND you press start.',
    },
    orGate: {
      about: [
        'An OR gate turns Y on when A is on, or B is on, or both.',
        'Join two buttons from + to A and B: pressing either one lights the LED on Y.',
        'Like every logic chip, it needs power on + and −.',
      ],
      like: 'It is like a house with two doorbells, front and back: either one rings the bell.',
      fact: 'The light inside a car uses OR: it turns on when any door is open.',
    },
    xorGate: {
      about: [
        'An XOR gate turns Y on when A and B are different: one on and one off.',
        'If both are on, or both are off, Y stays off.',
        'Like every logic chip, it needs power on + and −.',
      ],
      like: 'It is like the light switches at the top and bottom of the stairs: flip either one to change the light.',
      fact: 'Computers use XOR gates to add numbers together.',
    },
    timer555: {
      about: [
        'The 555 is a famous chip that blinks all by itself. Its OUT pin turns on and off, again and again.',
        'Give it power: at least 4.5 V on + and −. Then join an LED with a resistor to OUT, and pick slow, medium or fast.',
        'Its OUT pin can give up to 200 mA, enough for a buzzer or a small lamp.',
      ],
      like: 'It is like a little drummer who keeps the beat without anyone telling them to.',
      fact: 'The 555 was first made in 1971 and is still made today. Billions of them have been built!',
    },
    oscilloscope: {
      about: [
        'An oscilloscope draws a picture of a voltage. The line goes up when the voltage goes up, and the picture slides along as time passes.',
        'Join + to the spot you want to watch, and − to the battery −. It only listens, so it does not change your circuit.',
        'Each box on the screen is one step of volts up or down. The number in the corner tells you how many volts.',
      ],
      like: 'It is like the heart monitor in a hospital, but for electricity.',
      fact: 'Engineers use oscilloscopes to see signals that change millions of times a second, much too fast for our eyes.',
    },
    zener: {
      about: [
        'A Zener diode is a diode that is happy to work backwards. Joined with its striped end toward +, it blocks the power until the push reaches 5.1 V.',
        'Above 5.1 V it lets just enough through to hold the volts there. So a resistor and a Zener turn 9 V or 12 V into a steady 5.1 V.',
        'Always put a resistor before it. Without one, too much current flows and it burns out.',
      ],
      like: 'It is like the overflow hole in a bathtub: the water can never get higher than the hole.',
      fact: 'Zener diodes are named after Clarence Zener, the scientist who explained how they work.',
    },
    pnp: {
      about: [
        'A PNP transistor is the mirror of the NPN. Its E (emitter) goes to +, and the part it switches goes from C (collector) to −.',
        'It turns on when a small current flows out of B (base), toward − through a resistor. Then a big current flows from E to C.',
        'So the NPN switches the − side of a part, and the PNP switches the + side.',
      ],
      like: 'It is like a tap that opens when you pull the handle down instead of pushing it up.',
      fact: 'Many circuits use an NPN and a PNP as a pair, one pushing and one pulling, like two kids on a seesaw.',
    },
    mosfet: {
      about: [
        'A MOSFET is a switch worked by volts, not by current. Put about 4 V on G (gate), and a big current can flow from D (drain) to S (source).',
        'The gate is like a tiny capacitor: it takes almost no current, so a board pin can switch a big motor with it.',
        'With only 2 or 3 V on G it is half on. Then it gets hot, so give G enough volts.',
      ],
      like: 'It is like a garden hose with a squeeze clip: press the clip a little, and water flows; press it all the way, and it gushes.',
      fact: 'A computer chip has billions of tiny MOSFETs inside. They are the most made thing in the whole world!',
    },
    optocoupler: {
      about: [
        'An optocoupler has a little LED and a light sensor sealed inside one dark chip. Light the LED, and the sensor lets current flow from C to E.',
        'The two sides are joined only by light, never by a wire. So one circuit can switch another with no electric path between them.',
        'Its LED needs a resistor, just like any LED.',
      ],
      like: 'It is like flashing a torch at a friend across the street to tell them to start.',
      fact: 'Optocouplers keep people safe inside chargers: the high voltage from the wall never touches the part you can hold.',
    },
    laser: {
      about: [
        'A laser module makes a beam of light that stays thin and straight, so it makes a sharp dot far away.',
        'It has its own resistor inside, so you can join it straight to about 5 V.',
        'Laser light is very strong. Never point it at anyone’s eyes, or at animals, cars or planes.',
      ],
      like: 'It is like water from a hose set to a thin jet, instead of a wide spray.',
      fact: 'Scientists bounce lasers off mirrors left on the Moon to measure how far away it is, to a few centimetres!',
    },
    irLed: {
      about: [
        'An IR LED gives infrared light. It is a colour just past red that our eyes can’t see.',
        'It works like a normal LED: + to +, and a resistor to keep it safe. It starts to shine at only 1.2 V.',
        'Phone cameras can see infrared, so a TV remote looks purple through a camera when you press a button.',
      ],
      like: 'It is like a dog whistle: it is really there, but it is too high for us to notice.',
      fact: 'A TV remote sends its buttons as a code of quick infrared flashes that the TV reads.',
    },
    solenoid: {
      about: [
        'A solenoid is a coil of wire with a loose iron rod inside. When current flows, the coil becomes a magnet and shoves the rod. Clack!',
        'When the current stops, a spring pulls the rod back in.',
        'It takes a lot of current, so a board pin can’t drive it alone. Let a MOSFET or a transistor switch it.',
      ],
      like: 'It is like a jack-in-the-box: press the switch and out it pops.',
      fact: 'Door locks, pinball flippers and the valves in washing machines all use solenoids.',
    },
    pump: {
      about: [
        'A water pump has a small motor that spins a wheel with blades, called an impeller. The spinning wheel throws the water out through the tube.',
        'More volts spin it faster, and the water goes higher. It needs about 1.5 V before it lifts any water at all.',
        'This kind sits under the water. Running it dry for a long time can harm it.',
      ],
      like: 'It is like stirring a cup of tea so fast that the tea climbs up the sides.',
      fact: 'Pumps like this water the plants in smart gardens and keep fish tanks bubbling.',
    },
    bell: {
      about: [
        'An electric bell has an electromagnet that pulls a little hammer onto a metal gong. Ding!',
        'As the hammer moves, it breaks its own circuit, so the magnet lets go and a spring pulls the hammer back. Then it all starts again, many times a second.',
        'That is why one steady battery can make it ring and ring.',
      ],
      like: 'It is like a woodpecker tapping a tree: tap, back, tap, back, as long as it has energy.',
      fact: 'School bells and old fire alarms used this same clever trick for more than 150 years.',
    },
    barGraph: {
      about: [
        'A bar graph is ten small lights in a row. A chip on its board measures the voltage on IN and lights more bars as it goes higher.',
        'No bars means IN is at −. All ten bars means IN is as high as +. Five bars means half way.',
        'The bars go green, then yellow, then red, so you can see at a glance when it is getting high.',
      ],
      like: 'It is like the fuel gauge in a car, or the battery bars on a phone.',
      fact: 'Music players use bar graphs that jump up and down with the beat. They are called VU meters.',
    },
    trafficLight: {
      about: [
        'This module has a red, a yellow and a green LED, each with its own resistor already inside.',
        'Join − to −, and any of R, Y or G to + to light that colour. It is just right for a board’s pins.',
        'Program a board to light them one after another, and you have a real traffic light!',
      ],
      like: 'It is like a tiny copy of the lights on the street corner.',
      fact: 'The first electric traffic light was put up in Cleveland, USA, in 1914. It only had red and green.',
    },
    fan: {
      about: [
        'A fan is a small motor with angled blades. When the blades spin, they push air through, which cools things down.',
        'This fan has a little circuit inside, so it only spins with + to + and − to −.',
        'It is made for 5 V. Fewer volts make it slower and quieter.',
      ],
      like: 'It is like a paper windmill, but here the motor turns the blades to make the wind.',
      fact: 'There is a fan like this inside most computers and game consoles to stop the chips from getting too hot.',
    },
    nandGate: {
      about: [
        'A NAND gate is an AND gate with a NOT on the end. Y is on, unless A and B are both on.',
        'The little circle at the tip of its symbol means “the opposite”.',
        'Like every logic chip, it needs power on + and −.',
      ],
      like: 'It is like a nightlight that stays on unless the door is shut and the big light is on.',
      fact: 'With enough NAND gates you can build any other gate, and even a whole computer!',
    },
    norGate: {
      about: [
        'A NOR gate is an OR gate with a NOT on the end. Y is on only when A and B are both off.',
        'If even one input turns on, Y turns off.',
        'Like every logic chip, it needs power on + and −.',
      ],
      like: 'It is like a quiet room sign that only lights up when nobody is talking and no music is playing.',
      fact: 'The computer that flew the Apollo astronauts to the Moon was built almost entirely from NOR gates.',
    },
    latch: {
      about: [
        'A latch is a tiny memory. A pulse on S (set) turns Q on, and Q stays on even after you let go.',
        'A pulse on R (reset) turns Q off again. With both off, it simply remembers.',
        'Take its power away and it forgets, just like a computer’s memory.',
      ],
      like: 'It is like a light switch: you flick it once and it stays where you left it.',
      fact: 'A computer’s memory has billions of tiny latches. Each one remembers a single 1 or 0.',
    },
    counter: {
      about: [
        'The 4017 counter has a row of outputs, and only one is on at a time. Each pulse on CLK moves the “on” to the next one: 0, 1, 2, 3, 4, then back to 0.',
        'Feed it pulses from a 555 blinker, and its lights chase each other along the row.',
        'A pulse on RST sends it back to 0. Join an output to RST, and it counts only up to that number.',
      ],
      like: 'It is like passing a ball around a circle of friends: each clap, the ball moves on by one.',
      fact: 'Chasing lights on shop signs and fairground rides were often made with this very chip.',
    },
    comparator: {
      about: [
        'A comparator looks at two voltages, on IN+ and IN−. When IN+ is higher, OUT turns on. When IN+ is lower, OUT turns off.',
        'Put a sensor on IN+ and a knob on IN−. The knob sets the point where it switches.',
        'It only listens to its inputs, so it does not change the circuits it watches.',
      ],
      like: 'It is like a referee who only says which of two players is taller.',
      fact: 'Thermostats use a comparator to switch the heating on when the room is colder than you set.',
    },
    hBridge: {
      about: [
        'A motor driver lets a weak board pin control a strong motor, forwards and backwards.',
        'Inside, four switches make the shape of a letter H around the motor. IN1 on: current flows one way, so the motor goes forward. IN2 on: it flows the other way, so the motor goes back.',
        'The motor gets its power from the driver’s own + and −, not from the board’s pins.',
      ],
      like: 'It is like a railway switch that sends the train left or right, but for current.',
      fact: 'Every robot car and toy drone has motor drivers to steer by spinning wheels or propellers.',
    },
    multimeter: {
      about: [
        'A multimeter is three meters in one. Turn the dial to V for volts, A for amps or Ω for ohms. It is the first tool every maker buys.',
        'For volts, touch the probes to both sides of a part. For amps, open the loop and let the current go through the meter. For ohms, take the power away and touch both ends of a part.',
        'On the beep setting, it beeps when its two probes are joined. That is great for finding broken wires!',
      ],
      like: 'It is like a doctor’s bag with a thermometer, a stethoscope and a scale, all in one.',
      fact: 'The first meter that could measure volts, amps and ohms was invented in 1920 by a post office engineer.',
    },
    logicProbe: {
      about: [
        'A logic probe tells you what a wire in a logic circuit is doing. The red light means HIGH, the green light means LOW.',
        'The PULSE light flashes whenever the wire changes, even if it changes too fast for you to see.',
        'Clip its + and − to your circuit’s power, then touch the tip to the wire you want to test.',
      ],
      like: 'It is like a doctor listening to a heartbeat with a stethoscope.',
      fact: 'Before computers were small, engineers used logic probes to hunt for faults in machines as big as a room.',
    },
    ecu: {
      about: [
        'An ECU (engine control unit) is the computer that runs a car\'s engine. A modern car has dozens of them: for the engine, the brakes, the airbags and the lights.',
        'It reads a sensor on AIN, such as the engine\'s temperature, and drives fans, pumps and lights from OUT1 to OUT6. OUT1, OUT2 and OUT3 can also run things at part speed (PWM).',
        'A car runs on 12 V, but the ECU gives its sensors a steady 5 V on its 5V pin. Each output gives only a little current: use a resistor with an LED, and a transistor for a fan or a motor.',
      ],
      like: 'It is like the car\'s brain: it feels with its sensors and moves with its outputs, many times every second.',
      fact: 'An engine ECU can make thousands of decisions every second, such as exactly when to spark each cylinder.',
    },
    plc: {
      about: [
        'A PLC (programmable logic controller) is the tough computer that runs machines in factories: belts, pumps, presses and robots.',
        'It reads a sensor on AI0. Its relay outputs Q0 to Q4 just switch on or off, and AQ0 can be set to any level in between.',
        'Real PLCs work with 24 V and are programmed in special languages such as Structured Text. This one uses 5 V so it is safe with your kit, and the details panel shows its program in Structured Text.',
      ],
      like: 'It is like the conductor of an orchestra: it tells every machine in the factory when to start and when to stop.',
      fact: 'The first PLC was made in 1968 for a car factory, to replace walls of relays that took weeks to rewire for each new car model.',
    },
    rtu: {
      about: [
        'An RTU (remote terminal unit) watches an oil or gas well far away from any town, often in the desert, and reports back to a control room.',
        'It reads a sensor on AI1, such as the well\'s pressure, and runs pumps, horns and lights from DO1 to DO4. AO1 and AO2 can be set to any level, to send a reading on to a radio or a gauge.',
        'RTUs are built to work for years in heat, dust and storms, often powered by a solar panel and a battery. Like a PLC, it is programmed in Structured Text.',
      ],
      like: 'It is like a guard who stays at a far-away well day and night, and phones the control room the moment something is wrong.',
      fact: 'A big oil field can have thousands of wells spread over hundreds of kilometres, and RTUs let a few people watch all of them from one room.',
    },
    gsm: {
      about: [
        'The SMS module is a mobile phone on a chip. It has a slot for a SIM card and a little spring antenna.',
        'After you give it power, it needs a few seconds to find the mobile network. Then, each time IN goes HIGH, it sends one text message to the phone number you set.',
        'A real SMS module needs about 4 V, and short bursts of up to 2 A while it sends, so it needs a strong power supply. Type your own message and number in the details panel.',
      ],
      like: 'It is like a little messenger that runs to your phone with a note the moment your sensor finds something.',
      fact: 'Alarm systems at farms, pumping stations and oil wells use SMS modules, because mobile networks reach places where there is no internet.',
    },
    wifi: {
      about: [
        'The Wi-Fi module joins a Wi-Fi network, just like your phone or laptop does.',
        'Once it is online, it sends the volts on IN to the cloud every second, so you can watch the reading on a phone from anywhere in the world.',
        'It works with 3 V to 5 V and uses a few tens of milliamps. The details panel shows the cloud dashboard with a little chart of what it sent.',
      ],
      like: 'It is like a postman who carries a letter from your project to the internet every second.',
      fact: 'Smart homes, weather stations and factory machines use Wi-Fi modules like this one. This is called the Internet of Things.',
    },
    bluetooth: {
      about: [
        'The Bluetooth module talks to a phone or a tablet close by, without any wires.',
        'First it pairs with the phone. Then, twice a second, it sends the volts on IN to an app on the phone.',
        'Bluetooth reaches about 10 metres and uses very little power, which is why it is used in fitness bands, headphones and toys.',
      ],
      like: 'It is like a whisper to a friend standing next to you: quiet, quick and private.',
      fact: 'Bluetooth is named after Harald Bluetooth, a Viking king who joined the tribes of Denmark together, just as Bluetooth joins devices together.',
    },
    lora: {
      about: [
        'LoRa (long range) is a radio that sends small messages very far: several kilometres in towns and even more than 10 km in open country.',
        'Every 2 seconds it sends the volts on IN to a LoRa gateway, which passes them on to the internet.',
        'It sends only a few bytes at a time, but it uses so little power that a sensor can run for years on one battery. Farms, cities and oil fields use it.',
      ],
      like: 'It is like a carrier pigeon: it carries only a tiny note, but it can fly a very long way.',
      fact: 'LoRa messages have been received hundreds of kilometres away, from radios floating high up on balloons.',
    },
    gps: {
      about: [
        'The GPS module finds out where it is on Earth by listening to satellites flying high above us.',
        'It must hear at least four satellites to work out its position. That can take a while, so it is best out in the open sky.',
        'Once it has a fix, its PPS pin gives a pulse at the start of every second, exact to a millionth of a second. Boards can use it as a perfect clock.',
      ],
      like: 'It is like finding where you are by listening to several friends call out from different places at the same time.',
      fact: 'There are about 30 GPS satellites, more than 20 000 km above us, and each one carries very precise atomic clocks.',
    },
    canBus: {
      about: [
        'CAN (controller area network) is the network inside a car that joins all its computers: the engine, the brakes, the airbags and the dashboard.',
        'This module puts the volts on IN onto the CAN bus ten times a second, as one byte in a message with its own ID number.',
        'The bus needs only two wires, CAN-H and CAN-L, twisted together so that noise from the engine cannot spoil the messages.',
      ],
      like: 'It is like a group chat in which every computer in the car can read every message, and each one picks out the messages meant for it.',
      fact: 'CAN was invented in the 1980s for cars, and now it is also used in trucks, tractors, ships, lifts and even hospital machines.',
    },
    rs485: {
      about: [
        'RS-485 sends data down a long cable, as far as about 1 km, even in noisy factories full of motors.',
        'This module writes the volts on IN into Modbus register 40001 four times a second, for the control room to read. Modbus is the language many factory machines speak.',
        'Up to 32 machines can share one pair of wires, each with its own address, and the control room asks each one in turn.',
      ],
      like: 'It is like a long string telephone through the factory, on which the control room calls each machine by its number.',
      fact: 'Modbus was made in 1979 and it is still one of the most used languages in factories, oil fields and power stations today.',
    },
    pressureSensor: {
      about: [
        'The pressure sensor measures how hard a liquid or a gas pushes inside a pipe, a tank or a well, from 0 to 200 bar.',
        'It has a dial so you can read the pressure with your eyes, and its S pin gives a signal that rises with the pressure, for a board to read.',
        'One bar is about the push of the air around us. The water in a garden hose is about 3 bar, and an oil well can push 200 bar or more.',
      ],
      like: 'It is like a tyre gauge that never stops checking, and tells a computer the answer all the time.',
      fact: 'Oil wells are watched all day by pressure sensors, because a sudden change in pressure can be the first sign of trouble deep underground.',
    },
  },
}
