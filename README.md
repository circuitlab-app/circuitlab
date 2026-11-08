<p align="center">
  <a href="https://circuitlab.app"><img src="public/logo.svg" width="96" alt="Circuit Lab logo: a red light bulb with an orange filament"></a>
</p>

<h1 align="center">Circuit Lab</h1>

<p align="center">
  <b>A 3D circuit simulator for kids that runs in the browser.</b><br>
  Drag parts onto the board, join them with wires and watch lamps glow, motors spin and screens light up.<br>
  Then tell the AI board what to do, in plain words.
</p>

<p align="center">
  <a href="https://circuitlab.app"><img src="https://img.shields.io/badge/%E2%96%B6%EF%B8%8E%20Live%20demo-circuitlab.app-e11d48?style=for-the-badge" alt="Open the live demo at circuitlab.app"></a>
  <a href="https://github.com/circuitlab-app/circuitlab"><img src="https://img.shields.io/github/stars/circuitlab-app/circuitlab?style=for-the-badge&logo=github&label=Star%20on%20GitHub&color=24292f" alt="Star Circuit Lab on GitHub"></a>
</p>

<p align="center">
  <b>111</b> parts · <b>213</b> example projects · <b>69</b> workshop tools · <b>15</b> missions · <b>3</b> languages · free and open source
</p>

<p align="center">
  <b>English</b> · <a href="README.fa.md">فارسی</a> · <a href="README.ar.md">العربية</a>
</p>

<p align="center">
  <a href="https://circuitlab.app"><img src="docs/images/demo.gif" width="900" alt="Building a circuit in Circuit Lab: an AI board, a resistor and an LED are dragged onto the board and wired up, then the AI board is asked to make the light fade in and out, and it does"></a>
  <br>
  <sub>Build a circuit, then ask the AI board: “Make the light fade in and out slowly.” (The local model's thinking time is cut from the clip.)</sub>
</p>

## Why kids love it

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="docs/images/examples.jpg"><img src="docs/images/examples.jpg" alt="The Examples window with shelves of ready-made projects"></a>
      <b>213 ready-made projects</b><br>
      Seventeen shelves, from a first flashlight to cars, factories, oil wells and home appliances. Pick one and it opens on the board, ready to play with.
    </td>
    <td width="50%" valign="top">
      <a href="docs/images/dark.jpg"><img src="docs/images/dark.jpg" alt="Four coloured LEDs glowing on the board in dark mode"></a>
      <b>Lights that really shine</b><br>
      Every part is a live 3D model. In dark mode the board becomes a dark room, and LEDs, lamps and screens light it up.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="docs/images/plc.jpg"><img src="docs/images/plc.jpg" alt="A factory bottle-filling line run by a PLC, with its Structured Text program in the details panel"></a>
      <b>Real boards, real code</b><br>
      Arduino, ESP32, Raspberry Pi, micro:bit, bare AVR chips, a car ECU and a factory PLC. Each one shows the real code for what you chose: Arduino C++, AVR C, MicroPython, Python or PLC Structured Text.
    </td>
    <td width="50%" valign="top">
      <a href="docs/images/persian.jpg"><img src="docs/images/persian.jpg" alt="Circuit Lab in Persian, with the whole app mirrored right to left"></a>
      <b>English, فارسی and العربية</b><br>
      Every word in all three languages. In Persian and Arabic the whole app mirrors right to left, with a font made for each script.
    </td>
  </tr>
</table>

## The tools

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="docs/images/board.jpg"><img src="docs/images/board.jpg" alt="The parts box beside a radar circuit with a servo, a distance sensor and an Arduino Mega"></a>
      <h3>🧩 Parts box and board</h3>
      111 parts in ten groups: power, boards, switches, electronic parts, chips, lights and motors, screens, sensors, networks and meters. Drag one onto the board and join the red <b>+</b> and black <b>−</b> dots with wires. The current shows as dots running along the wires.
    </td>
    <td width="50%" valign="top">
      <a href="docs/images/ai.jpg"><img src="docs/images/ai.jpg" alt="The AI board's chat: asked to turn all three lights on, it switches pins P1 to P3 on and all three LEDs shine"></a>
      <h3>🦙 AI board</h3>
      A board you talk to. Wire lights, motors and buzzers to it, press <b>Ask</b> and type what they should do. It picks a program for each pin and shows exactly which pins changed. The model runs on your own computer with Ollama.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="docs/images/scope.jpg"><img src="docs/images/scope.jpg" alt="An oscilloscope drawing the square wave of a 555 blinker"></a>
      <h3>📈 Meters and oscilloscope</h3>
      A multimeter, voltmeter, ammeter, logic probe and an oscilloscope that draws the voltage as a moving line. Every part's details also show its live volts, amps and watts.
    </td>
    <td width="50%" valign="top">
      <a href="docs/images/screens.jpg"><img src="docs/images/screens.jpg" alt="A City TV LED wall saying Have a nice day and a scrolling LED sign"></a>
      <h3>📺 Screens and LED walls</h3>
      Number displays, LCD, OLED and colour screens, and LED walls of any size: shop signs, an airport board, and a City TV that plays your own photos and videos.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="docs/images/code.jpg"><img src="docs/images/code.jpg" alt="An ATmega328P chip with its register-level AVR C code in the details panel"></a>
      <h3>💻 Boards and code</h3>
      Pick what each pin does (on, blink, take turns, fade, follow a sensor) and the board writes the real program for it, down to register-level AVR C for the ATmega and ATtiny chips.
    </td>
    <td width="50%" valign="top">
      <a href="docs/images/iot.jpg"><img src="docs/images/iot.jpg" alt="A Wi-Fi weather station sending its temperature to a cloud dashboard"></a>
      <h3>📡 Messages and networks</h3>
      SMS, Wi-Fi, Bluetooth, LoRa and GPS modules, a car's CAN bus and a factory's RS-485 / Modbus. The details panel shows what arrives: texts on a phone, a cloud dashboard, a CAN message or a Modbus register.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="docs/images/lesson.jpg"><img src="docs/images/lesson.jpg" alt="The lesson for a shining LED, with a fun fact and the live volts and amps"></a>
      <h3>📖 Lessons</h3>
      Tap any part to learn what it does in kid-friendly words, with an “It's like…” comparison, a fun fact and a “Right now” line that uses the live numbers from the board. Resistors teach their colour code.
    </td>
    <td width="50%" valign="top">
      <a href="docs/images/missions.jpg"><img src="docs/images/missions.jpg" alt="The Missions list with the first two missions done"></a>
      <h3>🏆 Missions</h3>
      Fifteen challenges, from “light up a lamp” to “blink an LED with the Arduino”. Each one ticks itself off, with confetti, when the circuit on the board does the job.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="docs/images/toolbox.jpg"><img src="docs/images/toolbox.jpg" alt="The Toolbox: workshop rules, the Which tool quiz, the starter kit and drawings of measuring tools"></a>
      <h3>🧰 Toolbox</h3>
      69 real workshop tools in eight groups: measure, build, cut and hold, power, fix, stay safe, program and connect, and keep it tidy. Plus a “Which tool?” quiz and a starter-kit checklist.
    </td>
    <td width="50%" valign="top">
      <a href="docs/images/tool.jpg"><img src="docs/images/tool.jpg" alt="The soldering iron's page: what it is for, how to use it, a safety note and a fun fact"></a>
      <h3>🔧 A page for every tool</h3>
      Each tool has a drawing, what it is for, how to use it step by step, how to stay safe and a fun fact. Where the board has a matching part, a button lets you try it.
    </td>
  </tr>
</table>

<details>
<summary><b>Everything inside</b> (every part, board and example shelf)</summary>

- **Power:** batteries from 1.5 to 12 V, a solar panel, a bench power supply, a lemon battery (three lemons just light a red LED), a coin cell, a hand dynamo and a USB power bank.
- **Boards:** Arduino Uno, Nano and Mega, ESP32, ESP8266, Raspberry Pi Pico, micro:bit, Raspberry Pi, the AVR chips ATmega328P, ATmega32 (ATmega16) and ATtiny85 with register-level AVR C, and an STM32 Blue Pill. Each pin can be on, off, blinking, taking turns, fading or following a sensor, and the board shows the real code for what you chose.
- **Boards from the real world:** a car's engine computer (ECU), a factory PLC that shows its program in Structured Text, and an oil well's RTU, plus an industrial pressure gauge.
- **Messages and networks:** SMS, Wi-Fi, Bluetooth and LoRa modules, a GPS, and the CAN bus of cars and RS-485 / Modbus of factories.
- **AI board:** a board you talk to: "make the red light blink", "turn the lamp on when it gets dark".
- **Switches and knobs:** switch, push button, stair switch, micro switch, dimmer, knob (potentiometer), joystick and relay.
- **Electronic parts:** resistor (with a colour-code lesson), capacitor, diode, Zener diode, transistors, MOSFET, optocoupler, fuse and voltage regulator.
- **Chips and logic:** NOT, AND, OR, XOR, NAND and NOR gates with a live truth table, a memory latch, a light-chaser counter, a comparator, a 555 blinker and a motor driver.
- **Light, sound and motion:** lamp, LED, RGB LED, motor, vibration motor, buzzer (a beep or a real police siren), speaker, electric bell, heating element, electromagnet, solenoid, servo, laser, infrared LED, traffic light, warning beacon, LED bar graph, fan and a water pump with moving water.
- **Sensors:** light, temperature, tilt, magnet, distance, motion, sound, smoke, soil, touch, flame, rain, water level, humidity, obstacle, line, pressure, heartbeat and knock.
- **Screens:** number displays, text and colour screens, LED matrices and LED walls of any size.
- **Meters:** a multimeter, a logic probe, a voltmeter, an ammeter and an oscilloscope.
- **Things that go wrong, safely:** too many volts burn a lamp, an LED without a resistor burns out, a wire straight across a battery makes a short circuit, and a fuse blows to protect the rest. Nothing can really break or get hot, so kids can try anything, make mistakes and learn why.
- **213 example projects** on seventeen shelves, among them 21 for cars, 21 for factories, 12 for oil and gas, 25 home appliances that show how they work inside (washing machine, fridge, vacuum cleaner, juicer, mixer, toaster, iron, samovar …), and 11 that you talk to, with search and an easy / medium / hard filter.

</details>

## Three languages, every word

Circuit Lab is built in **English, Persian and Arabic** from the ground up, so a child in Tehran, Muscat or London gets the same app in their own words.

- **Everything in all three:** the board, all 111 parts and their lessons, 213 example projects, 15 missions, the Toolbox and its quiz, and every tip and warning.
- **Real right-to-left:** in Persian and Arabic the whole app mirrors, from the panels and menus to the sliders and arrow keys, while formulas like V = A × Ω still read correctly.
- **A font made for each script,** and Persian digits where Persian children expect them.
- **Search that understands you:** Arabic and Persian spellings of the same letter (ي / ی, ك / ک) find the same thing.
- **An AI that speaks your language:** the AI board understands requests in any of the three and answers in the app's language.

## Talk to the AI board

The AI board uses a language model that runs on your own computer with [Ollama](https://ollama.com). No account and no cloud: the child's words stay at home.

1. Install Ollama from [ollama.com](https://ollama.com) and open it.
2. Download a model once, for example `ollama pull gemma3:4b`.
3. In Circuit Lab, add an AI board (or open an example from the **Talk to AI** shelf) and press **Ask** on its card.

If something is missing, the AI panel shows simple steps to fix it.

## Use it anywhere

- **Online** at [circuitlab.app](https://circuitlab.app), on a computer, tablet or phone.
- **Install it** like an app from the browser's menu ("Install" or "Add to Home Screen").
- **Works offline** after the first visit, and the board is saved automatically.

## Run it on your computer

You need [Node.js](https://nodejs.org) 22.12 or later.

```bash
git clone https://github.com/circuitlab-app/circuitlab.git
cd circuitlab
npm install
npm run dev      # opens on http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the app with hot reload |
| `npm test` | Runs the unit tests (Vitest) |
| `npm run lint` | Checks the code with oxlint |
| `npm run build` | Type-checks and builds the site into `dist/` |

Built with React 19, TypeScript, Vite, React Flow, three.js (React Three Fiber), Tailwind CSS, shadcn/ui and Zustand. The circuit solver is a small nodal-analysis engine in `src/circuit/solver.ts`. [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) explains how the simulation, the 3D models and the AI board work.

## Contributing

Ideas, bug reports and pull requests are welcome.

- **Found a bug or have an idea?** [Open an issue](https://github.com/circuitlab-app/circuitlab/issues), with a screenshot if you can.
- **Want to add something?** [Adding things](docs/DEVELOPMENT.md#adding-things) lists the steps for a new part or a new language. Example projects live in `src/circuit/presets.ts`.
- **Before a pull request,** run `npm test`, `npm run lint` and `npm run build`, and add any new words to all three dictionaries in `src/i18n/` (English, Persian and Arabic).

If Circuit Lab helps a child you know, a ⭐ on GitHub helps other people find it.

## About

Circuit Lab is a product of **SBC** · [sbc.om](https://sbc.om) · released under the [MIT License](LICENSE).
