# Circuit Lab: developer notes

How to run, publish and change Circuit Lab. For what the app does, see the [README](../README.md).

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # solver unit tests (Vitest)
npm run build    # type-check + production build
```

Requires Node.js 22.12 or later (the Animate UI CLI needs it).

## Publishing (circuitlab.app)

Every push to `main` runs [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml): it installs, type-checks, builds, runs all tests and publishes `dist/` to GitHub Pages. `public/CNAME` holds the domain.

One-time setup:

- **GitHub:** Settings → Pages → Source: **GitHub Actions**, custom domain `circuitlab.app`, then **Enforce HTTPS** once the certificate is ready.
- **DNS** at the domain registrar:
  - `A` records for `circuitlab.app` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - `AAAA` records → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
  - `CNAME` for `www` → `milad-raeisi.github.io`
- **Recommended:** verify the domain under your GitHub profile → Settings → Pages, so no one else can claim it.

`.app` domains only work over HTTPS, so the site opens once GitHub has issued its certificate (usually minutes, at most a day after DNS is set).

**Brand and app files** live in `public/`: `logo.jpg` (the original logo), `logo.svg` (the same bulb traced as a sharp vector), `favicon.svg` / `favicon.ico`, `apple-touch-icon.png`, `icons/` (PWA and maskable icons), `og-image.jpg` (link previews) and `manifest.webmanifest`. The app can be installed and works offline: `src/pwa/sw.js` is written to `/sw.js` by the build, with a fresh cache for each release.

## AI board internals

How it works: `src/ai/plan.ts` follows the wires from each pin (through resistors, switches and transistors) to the part it drives, reads the sensor on `IN`, and sends that, the rules and the chat so far to `POST /api/chat` with a JSON schema (`src/ai/ollama.ts`). The model may only answer with a list of pin programs the simulator already has (on, blink, fade, follow the sensor …); the app checks every one before it sets the pins, so the simulation stays the same as when a child picks the programs by hand. The details panel then shows which pins changed and the Arduino code for the new program. The Ollama address and the model are saved in the browser (`circuit-lab:ai`), with each board's chat.

The dev server (`localhost:5173`) can call Ollama directly, because Ollama allows `localhost` pages by default. A copy of Circuit Lab on a **website** has to be allowed first: quit Ollama and start it with that site's address, for example

```bash
OLLAMA_ORIGINS="https://your-site.example" ollama serve
```

(on macOS with the menu-bar app: `launchctl setenv OLLAMA_ORIGINS "https://your-site.example"`, then restart Ollama). The panel shows this command with the right address when Ollama refuses the page.

## Tech stack

| Concern | Library |
| --- | --- |
| App | React 19, Vite 8, TypeScript 7 |
| Styling | Tailwind CSS v4, shadcn/ui (Radix base, Nova preset) |
| Animation | [Animate UI](https://animate-ui.com/docs) (`@animate-ui/react` + `motion`) |
| Node editor | React Flow (`@xyflow/react`) |
| 3D | three.js, `@react-three/fiber`, `@react-three/drei` |
| State | Zustand (persisted to `localStorage`) |

## Animate UI

The project is set up the way the [Animate UI installation guide](https://animate-ui.com/docs/installation) describes, so any Animate UI component can be added:

- `@animate-ui/react` and `motion` are installed, and the app is wrapped in `AnimateUIProvider` (`src/main.tsx`).
- The shadcn/ui components in `src/components/ui` were animated with `npx @animate-ui/cli@latest animate all`, so they import their primitives from `@animate-ui/react/primitives/radix-ui`.
- Registry components and animated icons live in `src/components/animate-ui`.
- Primitives (texts, effects, buttons) are imported straight from the package, for example `@animate-ui/react/primitives/texts/sliding-number`.

To add more:

```bash
npx shadcn@latest add <component>                  # a shadcn/ui component…
npx @animate-ui/cli@latest animate <component>      # …then animate it
npx shadcn@latest add @animate-ui/buttons-liquid    # an Animate UI registry component
npx shadcn@latest add @animate-ui/icons-lucide-bell # an animated icon
```

`noUnusedLocals` is off in `tsconfig.app.json` because registry files ship with unused `React` imports. oxlint still reports unused variables in app code (`npm run lint`).

## How the simulation works

`src/circuit/solver.ts` is a small DC solver based on nodal analysis:

- Every terminal is a circuit node.
- Wires are tiny resistors, so each wire also gets its own current for the flow animation.
- Batteries are Norton equivalents with an internal resistance.
- LEDs are piecewise-linear diodes; the solver repeats until every LED's on/off state is consistent.
- The newer parts (Zener, PNP, MOSFET, optocoupler, laser, IR LED, solenoid, pump, bell, bar graph, traffic light, fan, latch, counter, comparator, motor driver, multimeter and logic probe) are small "devices" in `src/circuit/devices.ts`: each adds its own stamps, refines its own state in the same loop, and reports its result. The latch, the counter and the logic probe remember their state from one step to the next.
- The message modules (SMS, Wi-Fi, Bluetooth, LoRa, GPS, CAN bus, RS-485) are devices too (`radio` in `devices.ts`, timings in `RADIOS` in `catalog.ts`). They remember when their power came on, join their network after a set time, and then send: the SMS module one text per rising edge on IN, the others the share of their supply on IN once per period; the GPS drives its PPS pin once a second after its fix. Their card row, the details panel's "receiver" view and the SMS settings are in `src/editor/RadioPanels.tsx`.
- The car ECU, the factory PLC and the oil well's RTU are ordinary boards in `BOARDS`. The PLC and the RTU show their program in IEC 61131-3 Structured Text, and the bare AVR chips (ATmega328P, ATmega32, ATtiny85) in register-level AVR C with each chip's own timers and ADC (`src/circuit/code.ts`, which writes every board's code). The ATtiny85 has four outputs instead of six.

The solver is pure and unit-tested (`solver.test.ts`, and `outputs.test.ts` for the newer parts). The electrical constants in `src/circuit/catalog.ts` are tuned so toy circuits behave the way kids expect: 1.5 V dim, 3 V bright, 9 V burns the lamp.

The solver only re-runs when the electrical makeup of the board changes (`src/hooks/useSimulationEngine.ts`); dragging parts around doesn't trigger it.

## Pipeline Lab (`#/pipelines`)

A second page that shows how a GitHub Actions workflow runs, drawn as a circuit: the event is the battery, jobs are parts, `needs:` are the wires and the run result is a bulb. It opens from the top bar (or the ⋯ menu on phones) and is its own lazy chunk, with the `yaml` parser in a chunk of its own, so the board never loads it.

- `src/pipeline/parse.ts` reads workflow YAML (with line ranges for every job and step); `expr.ts` evaluates `${{ }}` and `if:` the way GitHub does (case-insensitive `==`, status functions, implicit `success() &&`); `trigger.ts` decides whether an event passes the `on:` filters.
- `simulate.ts` works out the whole run at once from the event, the steps set to fail, the step outputs and the approvals given: every job, matrix copy and step with its start and end second. The page only asks what is happening at second *t*, so the clock can play, pause and be dragged on the timeline. Jobs start when their `needs` finish; a failed step skips the rest of its job, a failed job skips the jobs that need it, a failed matrix copy cancels its sisters (fail-fast), protected environments wait for approval.
- `runner.ts` makes up step durations and log lines from what each step says (`npm ci`, `actions/checkout` …). Nothing is executed.
- The first example is this repository's own `.github/workflows/deploy.yml`, imported as text, so the page always shows the real release pipeline. Readers can paste their own workflow; it stays in the browser (`circuit-lab:pipelines`).
- Words live in `src/i18n/pipeline/` (en, fa, ar); workflow names, steps and logs stay as written. The engine is tested in `src/pipeline/simulate.test.ts`.

## 3D rendering

All parts share **one** WebGL canvas (`src/three/SceneCanvas.tsx`). Each part node registers a drei `<View>` that tracks its DOM box, so a board with dozens of parts still uses a single WebGL context. The canvas covers the window but ignores the pointer, so React Flow keeps handling every click and drag. Models live in `src/three/models/` and read their animation state from the simulation result each frame.

## Project layout

```
src/
  circuit/      solver, parts catalog, examples, missions (no React)
  ai/           the AI board: Ollama client, board description and prompt (unit-tested), chat store
  editor/       board, part nodes, wires, sidebar, inspector, lessons, gallery, top/status bars
  displays/     screen faces (digits, LCD, OLED, TFT, LED walls, oscilloscope)
  toolbox/      the workshop tools section
  pipeline/     the Pipeline Lab: GitHub Actions workflows simulated like circuits (#/pipelines)
  three/        shared canvas, lighting helpers and the 3D part models
  store/        Zustand stores: circuit (with undo/redo), settings, simulation, drag
  i18n/         en (default), ar, fa dictionaries and the useI18n hook
  hooks/        simulation engine, keyboard shortcuts
  lib/          Web Audio sound effects, utilities
  components/   generated shadcn/ui and Animate UI components
```

## Adding things

- **A language:** copy `src/i18n/en.ts` (the `Dictionary` type makes TypeScript list every missing string), then register it in `LANGUAGES` and `DICTIONARIES` in `src/i18n/index.ts`.
- **A part:** add it to `PartType` (`src/circuit/types.ts`), `PARTS` and `PART_ORDER` (`catalog.ts`), the solver, a model in `src/three/models/` and its framing in `PartScene.tsx`, a tray drawing in `src/editor/PartArt.tsx`, a lesson in `src/i18n/learn/*` and the three dictionaries.
