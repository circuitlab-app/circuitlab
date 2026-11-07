import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Halo, damp } from '../helpers'

type Variant = 'nano' | 'mega' | 'esp32' | 'esp8266' | 'pico' | 'microbit' | 'raspberrypi' | 'ecu' | 'plc' | 'rtu'

/** same lean as the Arduino UNO so every board shares one camera framing */
const TILT = 0.72
const BOARD_T = 0.06
/** top surface of the PCB */
const TOP = BOARD_T / 2
const OUTPUTS = 6

type Vec3 = [number, number, number]
type Mat =
  | 'black'
  | 'hole'
  | 'gold'
  | 'silver'
  | 'silk'
  | 'white'
  | 'tan'
  | 'dark'
  | 'red'
  | 'blue'
  | 'grey'
  | 'copper'
  | 'terminal'
  | 'plastic'
  | 'charcoal'
  | 'teal'
  | 'orange'
  | 'slate'
  | 'ink'
  | 'rubber'

/** No environment map here, so big metal faces keep some diffuse colour instead of turning black. */
const MATERIALS: Record<Mat, { color: string; roughness: number; metalness?: number }> = {
  black: { color: '#1f1f22', roughness: 0.55 },
  hole: { color: '#050505', roughness: 0.9 },
  gold: { color: '#e5c76b', roughness: 0.3, metalness: 0.75 },
  silver: { color: '#d9dde3', roughness: 0.35, metalness: 0.5 },
  silk: { color: '#f1f5f9', roughness: 0.7 },
  white: { color: '#f8fafc', roughness: 0.45 },
  tan: { color: '#c8a27a', roughness: 0.55 },
  dark: { color: '#2a2a2e', roughness: 0.5 },
  red: { color: '#b91c1c', roughness: 0.4 },
  blue: { color: '#2563eb', roughness: 0.4 },
  grey: { color: '#8b9099', roughness: 0.5, metalness: 0.3 },
  copper: { color: '#c9a24a', roughness: 0.35, metalness: 0.6 },
  /** the green of screw terminal blocks */
  terminal: { color: '#1f9d55', roughness: 0.5 },
  /** light-grey housing of a DIN-rail module */
  plastic: { color: '#d5d8dd', roughness: 0.62 },
  charcoal: { color: '#2b2f36', roughness: 0.6 },
  teal: { color: '#0d9488', roughness: 0.45 },
  /** safety orange */
  orange: { color: '#f06a1d', roughness: 0.55 },
  /** grey plastic of a connector latch */
  slate: { color: '#5b6470', roughness: 0.5 },
  /** the dark print on an LCD */
  ink: { color: '#0f3b37', roughness: 0.6 },
  /** the matte black of an antenna */
  rubber: { color: '#151517', roughness: 0.85 },
}

type Prim =
  | { kind: 'box'; size: Vec3; at: Vec3; turn: number }
  | { kind: 'cyl'; r: number; h: number; at: Vec3; axis: 'x' | 'y' | 'z'; half: boolean; turn: number; sides: number }
  | { kind: 'ring'; r: number; tube: number; at: Vec3; stretch: number }

/** Collects the small static parts of a board, sorted by material, to merge into one mesh each. */
class Layout {
  parts: Partial<Record<Mat, Prim[]>> = {}

  add(mat: Mat, prim: Prim) {
    ;(this.parts[mat] ??= []).push(prim)
  }

  box(mat: Mat, size: Vec3, at: Vec3, turn = 0) {
    this.add(mat, { kind: 'box', size, at, turn })
  }

  /** a block standing on the board */
  top(mat: Mat, size: Vec3, x: number, z: number, turn = 0, lift = 0) {
    this.box(mat, size, [x, TOP + lift + size[1] / 2, z], turn)
  }

  /** print or a pad flat on the board, or `lift` above it on a housing */
  flat(mat: Mat, w: number, d: number, x: number, z: number, turn = 0, lift = 0) {
    this.box(mat, [w, 0.004, d], [x, TOP + lift + 0.002, z], turn)
  }

  cyl(mat: Mat, r: number, h: number, at: Vec3, axis: 'x' | 'y' | 'z' = 'y', half = false, turn = 0, sides = 18) {
    this.add(mat, { kind: 'cyl', r, h, at, axis, half, turn, sides })
  }

  /** a thin ring lying on the board */
  ring(mat: Mat, r: number, tube: number, x: number, z: number, stretch = 1) {
    this.add(mat, { kind: 'ring', r, tube, at: [x, TOP + 0.004, z], stretch })
  }
}

function primGeometry(p: Prim): THREE.BufferGeometry {
  if (p.kind === 'box') return new THREE.BoxGeometry(...p.size).rotateY(p.turn).translate(...p.at)
  if (p.kind === 'cyl') {
    const g = new THREE.CylinderGeometry(p.r, p.r, p.h, p.sides, 1, false, 0, p.half ? Math.PI : Math.PI * 2).rotateY(p.turn)
    if (p.axis === 'x') g.rotateZ(Math.PI / 2)
    if (p.axis === 'z') g.rotateX(Math.PI / 2)
    return g.translate(...p.at)
  }
  return new THREE.TorusGeometry(p.r, p.tube, 6, 32)
    .rotateX(Math.PI / 2)
    .scale(p.stretch, 0.3, 1)
    .translate(...p.at)
}

/* --------------------------------------------------------- part builders */

/** male header: black spacer with gold square pins standing up */
function maleRow(L: Layout, x0: number, n: number, z: number, pitch: number, rows = 1, pinH = 0.2) {
  L.top('black', [n * pitch, 0.08, rows * pitch], x0 + (n * pitch) / 2, z)
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < n; i++) {
      L.box('gold', [pitch * 0.3, pinH, pitch * 0.3], [x0 + pitch / 2 + i * pitch, TOP + pinH / 2, z + (r - (rows - 1) / 2) * pitch])
    }
  }
}

/** female header strip along x with a hole per pin */
function femaleRow(L: Layout, x0: number, n: number, z: number, pitch: number, h = 0.16) {
  L.top('black', [n * pitch, h, pitch * 0.98], x0 + (n * pitch) / 2, z)
  for (let i = 0; i < n; i++) L.box('hole', [pitch * 0.42, 0.004, pitch * 0.42], [x0 + pitch / 2 + i * pitch, TOP + h + 0.001, z])
}

/** female header block running along z, `cols` holes wide */
function femaleBlockZ(L: Layout, x: number, z: number, n: number, cols: number, pitch: number, h = 0.16) {
  L.top('black', [cols * pitch, h, n * pitch], x, z)
  for (let c = 0; c < cols; c++) {
    for (let i = 0; i < n; i++) {
      L.box('hole', [pitch * 0.42, 0.004, pitch * 0.42], [x + (c - (cols - 1) / 2) * pitch, TOP + h + 0.001, z - (n * pitch) / 2 + pitch / 2 + i * pitch])
    }
  }
}

/** dark opening (and the plastic tongue inside it) on one outer face of a connector */
function slot(L: Layout, x: number, z: number, size: Vec3, axis: 'x' | 'z', sign: 1 | -1, opening: [number, number], tongue: Mat | null = null, y = TOP + size[1] / 2) {
  if (axis === 'x') {
    const fx = x + sign * (size[0] / 2 + 0.004)
    L.box('hole', [0.008, opening[1], opening[0]], [fx, y, z])
    if (tongue) L.box(tongue, [0.01, opening[1] * 0.35, opening[0] * 0.75], [fx + sign * 0.002, y, z])
  } else {
    const fz = z + sign * (size[2] / 2 + 0.004)
    L.box('hole', [opening[0], opening[1], 0.008], [x, y, fz])
    if (tongue) L.box(tongue, [opening[0] * 0.75, opening[1] * 0.35, 0.01], [x, y, fz + sign * 0.002])
  }
}

/** a silver connector with its opening facing out of the board */
function port(L: Layout, x: number, z: number, size: Vec3, axis: 'x' | 'z', sign: 1 | -1, opening: [number, number], tongue: Mat | null = null) {
  L.top('silver', size, x, z)
  slot(L, x, z, size, axis, sign, opening, tongue)
}

/** black IC with silver legs on two or four sides (none for QFN parts) */
function chip(L: Layout, x: number, z: number, w: number, d: number, perSide: number, sides: 2 | 4, turn = 0, h = 0.05) {
  L.top('black', [w, h, d], x, z, turn)
  const c = Math.cos(turn)
  const s = Math.sin(turn)
  const leg = (lx: number, lz: number, size: Vec3) => L.box('silver', size, [x + lx * c + lz * s, TOP + 0.008, z - lx * s + lz * c], turn)
  for (let k = 0; k < perSide; k++) {
    const tx = (k - (perSide - 1) / 2) * ((w * 0.8) / perSide)
    const tz = (k - (perSide - 1) / 2) * ((d * 0.8) / perSide)
    for (const side of [-1, 1]) {
      leg(tx, side * (d / 2 + 0.02), [0.022, 0.016, 0.05])
      if (sides === 4) leg(side * (w / 2 + 0.02), tz, [0.05, 0.016, 0.022])
    }
  }
}

/** tactile push button: square metal body, round cap */
function button(L: Layout, x: number, z: number, cap: Mat, size = 0.22, capR = 0.065) {
  L.top('silver', [size, 0.06, size], x, z)
  L.cyl(cap, capR, 0.06, [x, TOP + 0.09, z])
}

/** plated mounting hole */
function mountHole(L: Layout, x: number, z: number, r = 0.07, pad: Mat = 'silver') {
  L.cyl(pad, r, 0.004, [x, TOP + 0.002, z])
  L.cyl('hole', r * 0.55, 0.072, [x, 0, z])
}

/** small SMD electrolytic: aluminium can with a dark half-moon on top */
function ecap(L: Layout, x: number, z: number, r = 0.08, h = 0.14) {
  L.cyl('silver', r, h, [x, TOP + h / 2, z])
  L.cyl('black', r * 0.98, 0.004, [x, TOP + h + 0.002, z], 'y', true)
}

/** SOT-223 voltage regulator: black body with a wide metal tab */
function regulator(L: Layout, x: number, z: number) {
  L.top('dark', [0.24, 0.06, 0.16], x, z)
  L.top('silver', [0.24, 0.016, 0.07], x, z - 0.13)
}

function smd(L: Layout, mat: Mat, spots: [number, number][], turn = 0, size: Vec3 = [0.075, 0.026, 0.04]) {
  for (const [x, z] of spots) L.top(mat, size, x, z, turn)
}

/** 2 × 3 ICSP header */
function icsp(L: Layout, x: number, z: number) {
  L.top('black', [0.19, 0.07, 0.28], x, z)
  for (const dx of [-0.045, 0.045]) {
    for (const dz of [-0.088, 0, 0.088]) L.box('gold', [0.03, 0.17, 0.03], [x + dx, TOP + 0.085, z + dz])
  }
}

/** the "∞ − +" logo in silkscreen */
function logo(L: Layout, x: number, z: number, r = 0.09) {
  L.ring('silk', r, r * 0.18, x - r, z)
  L.ring('silk', r, r * 0.18, x + r, z)
  L.flat('silk', r * 0.7, r * 0.2, x - r, z)
  L.flat('silk', r * 0.7, r * 0.2, x + r, z)
  L.flat('silk', r * 0.2, r * 0.7, x + r, z)
}

/** silkscreen label: a frame with a couple of "text" lines */
function label(L: Layout, x: number, z: number, w: number, lines: number[]) {
  lines.forEach((lw, i) => L.flat('silk', lw, 0.028, x - (w - lw) / 2, z + i * 0.07))
}

/** PCB trace antenna: runs along z joined at alternating ends */
function meanderZ(L: Layout, x0: number, z0: number, z1: number, runs: number, step: number, y: number) {
  for (let k = 0; k < runs; k++) {
    const x = x0 + k * step
    L.box('copper', [0.022, 0.004, z1 - z0], [x, y, (z0 + z1) / 2])
    if (k < runs - 1) L.box('copper', [step + 0.022, 0.004, 0.022], [x + step / 2, y, k % 2 === 0 ? z1 : z0])
  }
}

/** PCB trace antenna: runs along x joined at alternating ends */
function meanderX(L: Layout, x0: number, x1: number, z0: number, runs: number, step: number, y: number) {
  for (let k = 0; k < runs; k++) {
    const z = z0 + k * step
    L.box('copper', [x1 - x0, 0.004, 0.022], [(x0 + x1) / 2, y, z])
    if (k < runs - 1) L.box('copper', [0.022, 0.004, step + 0.022], [k % 2 === 0 ? x1 : x0, y, z + step / 2])
  }
}

/* seven-segment digits and a few letters, printed flat; "up" is −z */
const SEGMENTS: Record<string, string> = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', E: 'adefg', C: 'adef', U: 'bcdef', P: 'abefg', L: 'def' }

function glyph(L: Layout, ch: string, x: number, z: number, h = 0.13, s = 0.022, lift = 0) {
  const flat = (mat: Mat, w: number, d: number, fx: number, fz: number, turn = 0) => L.flat(mat, w, d, fx, fz, turn, lift)
  const w = h * 0.55
  const half = h / 2
  const seg: Record<string, [number, number, boolean]> = {
    a: [x, z - half, true],
    b: [x + w / 2, z - half / 2, false],
    c: [x + w / 2, z + half / 2, false],
    d: [x, z + half, true],
    e: [x - w / 2, z + half / 2, false],
    f: [x - w / 2, z - half / 2, false],
    g: [x, z, true],
  }
  const lean = Math.atan2(w / 2, h)
  const stroke = Math.hypot(w / 2, h)
  switch (ch) {
    case 'A':
      flat('silk', s, stroke, x - w / 4, z, -lean)
      flat('silk', s, stroke, x + w / 4, z, lean)
      flat('silk', w * 0.5, s, x, z + h * 0.12)
      return
    case 'V':
      flat('silk', s, stroke, x - w / 4, z, lean)
      flat('silk', s, stroke, x + w / 4, z, -lean)
      return
    case 'B':
      flat('silk', s, h, x - w / 2, z)
      for (const dz of [-half, half]) flat('silk', w * 0.75, s, x - w * 0.125, z + dz)
      flat('silk', w * 0.6, s, x - w * 0.2, z)
      for (const dz of [-half / 2, half / 2]) flat('silk', s, half * 0.8, x + w * 0.3, z + dz)
      return
    case 'GND':
      flat('silk', s, h * 0.45, x, z - h * 0.3)
      ;[0.16, 0.1, 0.045].forEach((bw, i) => flat('silk', bw, s, x, z + i * 0.04))
      return
  }
  for (const k of SEGMENTS[ch] ?? '') {
    const [sx, sz, across] = seg[k]
    flat('silk', across ? w : s, across ? s : half, sx, sz)
  }
}

/* --------------------------------------------------------------- boards */

type Spec = {
  pcb: { w: number; d: number; color: string; x?: number }
  layout: Layout
  /** (x, z) of the six output LEDs */
  leds: [number, number][]
  ledSize: [number, number]
  power: [number, number]
  powerColor: string
  /** lit and unlit colour of the six output LEDs; amber when left out */
  ledColor?: [string, string]
  /** how far above the PCB the LEDs stand (on top of a housing) */
  deck?: number
  /** a backlit screen that comes on with the power: centre, size, height above the PCB */
  screen?: { x: number; z: number; w: number; d: number; y: number; color: string; glow: string }
  /** micro:bit 5 × 5 LED grid */
  matrix?: { x: number; z: number; pitch: number }
  /** x move that centres the board with everything sticking out of it */
  shift: number
  /** y move after the tilt that centres it vertically */
  lift: number
}

/** Arduino Nano, scaled up to the UNO's width */
function nano(): Spec {
  const L = new Layout()
  const P = 0.192
  const X0 = -1.44
  for (const z of [-0.53, 0.53]) maleRow(L, X0, 15, z, P)
  for (let i = 0; i < 15; i++) L.flat('silk', 0.03, 0.07, X0 + P / 2 + i * P, 0.4)
  port(L, -1.6, 0, [0.36, 0.16, 0.42], 'x', -1, [0.28, 0.07])
  chip(L, 0.42, 0, 0.48, 0.48, 8, 4, Math.PI / 4)
  button(L, -0.35, 0, 'white', 0.26, 0.08)
  L.top('silver', [0.22, 0.06, 0.12], -0.82, 0.18)
  regulator(L, -1.05, 0.24)
  smd(L, 'tan', [
    [1.05, 0.22],
    [1.05, -0.22],
    [-0.82, -0.12],
  ])
  smd(L, 'dark', [
    [-0.6, 0.28],
    [-0.1, 0.28],
    [0.95, 0],
  ], Math.PI / 2)
  logo(L, 1.25, 0, 0.07)
  for (const x of [-1.6, 1.6]) for (const z of [-0.53, 0.53]) mountHole(L, x, z, 0.06)
  return {
    pcb: { w: 3.4, d: 1.36, color: '#0b62a4' },
    layout: L,
    leds: Array.from({ length: OUTPUTS }, (_, i) => [X0 + P / 2 + i * P, -0.31]),
    ledSize: [0.07, 0.045],
    power: [0.05, 0.3],
    powerColor: '#22c55e',
    shift: 0.04,
    lift: -0.04,
  }
}

/** Arduino Mega 2560 */
function mega(): Spec {
  const L = new Layout()
  const P = 0.0864
  port(L, -1.54, -0.42, [0.56, 0.36, 0.42], 'x', -1, [0.3, 0.26], 'white')
  L.top('black', [0.5, 0.36, 0.32], -1.45, 0.5)
  L.cyl('hole', 0.1, 0.02, [-1.705, TOP + 0.17, 0.5], 'x')
  L.cyl('silver', 0.03, 0.024, [-1.706, TOP + 0.17, 0.5], 'x')
  for (const [x0, n] of [
    [-0.85, 10],
    [0.09, 8],
    [0.86, 8],
  ]) femaleRow(L, x0, n, -0.85, P)
  for (const x0 of [-0.55, 0.22, 0.99]) femaleRow(L, x0, 8, 0.85, P)
  femaleBlockZ(L, 1.705, 0, 18, 2, P)
  chip(L, 0.45, 0.1, 0.52, 0.52, 12, 4, Math.PI / 4)
  chip(L, -0.95, -0.35, 0.2, 0.2, 5, 4)
  button(L, -1.12, -0.62, 'red', 0.2, 0.06)
  icsp(L, 1.25, 0.1)
  icsp(L, -0.6, -0.35)
  L.top('silver', [0.24, 0.06, 0.1], -0.25, 0.48)
  ecap(L, -0.95, 0.3)
  ecap(L, -0.95, 0.58)
  regulator(L, -0.72, 0.68)
  smd(L, 'tan', [
    [-0.25, 0.25],
    [1.05, 0.5],
    [1.05, -0.3],
    [-0.4, -0.6],
  ])
  smd(L, 'dark', [
    [-0.1, -0.6],
    [0.05, -0.6],
    [1.2, -0.5],
  ])
  logo(L, -0.05, -0.38, 0.08)
  label(L, 0.75, -0.42, 0.5, [0.5, 0.34])
  for (const [x, z] of [
    [-1.0, -0.84],
    [-1.05, 0.84],
    [1.4, -0.55],
    [1.4, 0.55],
  ]) mountHole(L, x, z, 0.06)
  return {
    pcb: { w: 3.45, d: 1.84, color: '#00878f', x: 0.125 },
    layout: L,
    // D13 … D8 are the fifth to tenth holes of the first top strip
    leds: Array.from({ length: OUTPUTS }, (_, i) => [-0.85 + P / 2 + (4 + i) * P, -0.73]),
    ledSize: [0.056, 0.04],
    power: [0.35, -0.6],
    powerColor: '#22c55e',
    shift: -0.015,
    lift: -0.055,
  }
}

/** ESP32 DevKit with a WROOM module */
function esp32(): Spec {
  const L = new Layout()
  const P = 0.169
  const X0 = -1.3
  for (const z of [-0.68, 0.68]) maleRow(L, X0, 15, z, P)
  port(L, -1.62, 0, [0.3, 0.13, 0.4], 'x', -1, [0.22, 0.05])
  for (const z of [-0.33, 0.33]) {
    button(L, -1.25, z, 'dark', 0.2, 0.055)
    L.flat('silk', 0.12, 0.02, -1.25, z * 0.58)
  }
  chip(L, -0.55, -0.05, 0.3, 0.3, 6, 4)
  regulator(L, -0.95, 0.38)
  smd(L, 'tan', [
    [-0.2, -0.2],
    [-0.2, 0.1],
    [-0.95, -0.05],
  ])
  smd(L, 'dark', [
    [-0.55, 0.32],
    [-0.4, 0.32],
  ])
  // WROOM module: its own PCB, the shield can and the zig-zag antenna past it
  const MY = TOP + 0.04
  L.top('dark', [1.7, 0.04, 1.12], 0.9, 0)
  L.top('silver', [1.22, 0.12, 1.0], 0.7, 0, 0, 0.04)
  for (const [dz, w] of [
    [-0.22, 0.62],
    [-0.12, 0.46],
    [0.0, 0.54],
  ]) L.box('grey', [w, 0.004, 0.03], [0.62, MY + 0.122, dz])
  L.box('grey', [0.18, 0.004, 0.18], [0.35, MY + 0.122, 0.25])
  meanderZ(L, 1.38, -0.42, 0.42, 6, 0.065, MY + 0.002)
  for (let i = 0; i < 14; i++) for (const z of [-0.52, 0.52]) L.box('gold', [0.04, 0.006, 0.07], [0.12 + i * 0.085, MY + 0.002, z])
  return {
    pcb: { w: 3.4, d: 1.6, color: '#151517' },
    layout: L,
    leds: Array.from({ length: OUTPUTS }, (_, i) => [X0 + P / 2 + i * P, -0.5]),
    ledSize: [0.07, 0.045],
    power: [-0.2, 0.38],
    powerColor: '#ef4444',
    shift: 0.01,
    lift: -0.05,
  }
}

/** NodeMCU with an ESP-12 module */
function esp8266(): Spec {
  const L = new Layout()
  const P = 0.18
  const X0 = -1.35
  for (const z of [-0.78, 0.78]) maleRow(L, X0, 15, z, P)
  for (let i = 0; i < 15; i++) L.flat('silk', 0.03, 0.06, X0 + P / 2 + i * P, 0.65)
  port(L, -1.62, 0, [0.3, 0.13, 0.4], 'x', -1, [0.22, 0.05])
  for (const z of [-0.38, 0.38]) button(L, -1.25, z, 'dark', 0.2, 0.055)
  chip(L, -0.65, 0.12, 0.34, 0.34, 0, 4)
  regulator(L, -0.15, 0.42)
  smd(L, 'tan', [
    [-0.25, 0.0],
    [-0.95, -0.1],
    [-0.95, 0.15],
  ])
  smd(L, 'dark', [
    [-0.4, -0.3],
    [-0.25, -0.3],
  ])
  label(L, -0.62, -0.32, 0.4, [0.4, 0.26])
  // ESP-12 module with its snake antenna
  const MY = TOP + 0.04
  L.top('dark', [1.6, 0.04, 1.12], 0.95, 0)
  L.top('silver', [1.0, 0.11, 0.92], 0.72, 0, 0, 0.04)
  L.box('grey', [0.5, 0.004, 0.03], [0.68, MY + 0.112, -0.15])
  L.box('grey', [0.36, 0.004, 0.03], [0.61, MY + 0.112, -0.05])
  meanderX(L, 1.32, 1.68, -0.4, 11, 0.08, MY + 0.002)
  for (let i = 0; i < 8; i++) for (const z of [-0.52, 0.52]) L.box('gold', [0.05, 0.006, 0.07], [0.25 + i * 0.12, MY + 0.002, z])
  for (const x of [-1.55, 1.55]) for (const z of [-0.78, 0.78]) mountHole(L, x, z, 0.065)
  return {
    pcb: { w: 3.4, d: 1.85, color: '#1d2f52' },
    layout: L,
    leds: Array.from({ length: OUTPUTS }, (_, i) => [X0 + P / 2 + i * P, -0.6]),
    ledSize: [0.07, 0.045],
    power: [-0.25, 0.2],
    powerColor: '#ef4444',
    shift: 0.01,
    lift: -0.045,
  }
}

/** Raspberry Pi Pico with castellated edges */
function pico(): Spec {
  const L = new Layout()
  const P = 0.169
  const X0 = -1.69
  const EDGE = 0.7
  for (const side of [-1, 1]) {
    for (let i = 0; i < 20; i++) {
      const x = X0 + P / 2 + i * P
      L.flat('gold', 0.1, 0.17, x, side * (EDGE - 0.085))
      // half a plated hole cut into the board edge
      L.cyl('hole', 0.042, 0.072, [x, 0, side * EDGE], 'y', true, side === -1 ? -Math.PI / 2 : Math.PI / 2)
    }
  }
  for (let i = 0; i < 20; i++) L.flat('silk', 0.03, 0.06, X0 + P / 2 + i * P, 0.45)
  port(L, -1.63, 0, [0.32, 0.14, 0.42], 'x', -1, [0.24, 0.05])
  chip(L, 0.15, 0, 0.5, 0.5, 0, 4)
  for (const [dz, w] of [
    [-0.08, 0.3],
    [0.02, 0.22],
  ]) L.box('grey', [w, 0.004, 0.03], [0.15, TOP + 0.052, dz])
  chip(L, -0.5, 0.3, 0.3, 0.2, 4, 2)
  // white BOOTSEL button
  L.top('silver', [0.26, 0.06, 0.26], -1.0, -0.22)
  L.cyl('white', 0.085, 0.07, [-1.0, TOP + 0.095, -0.22])
  L.top('silver', [0.2, 0.05, 0.14], 0.78, -0.3)
  L.top('grey', [0.22, 0.08, 0.22], -0.5, -0.22)
  smd(L, 'tan', [
    [0.75, 0.25],
    [-0.15, -0.38],
    [-0.15, 0.38],
  ])
  smd(L, 'dark', [
    [0.55, 0.25],
    [-1.25, -0.1],
  ])
  for (const dz of [-0.13, 0, 0.13]) L.flat('gold', 0.08, 0.09, 1.56, dz)
  label(L, 1.0, 0.18, 0.44, [0.44, 0.3])
  for (const x of [-1.57, 1.57]) for (const z of [-0.38, 0.38]) mountHole(L, x, z, 0.07, 'gold')
  return {
    pcb: { w: 3.4, d: 1.4, color: '#2a7a3b' },
    layout: L,
    leds: Array.from({ length: OUTPUTS }, (_, i) => [X0 + P / 2 + (1 + i) * P, -0.45]),
    ledSize: [0.07, 0.045],
    power: [-1.25, 0.25],
    powerColor: '#22c55e',
    shift: 0.05,
    lift: 0,
  }
}

/** BBC micro:bit */
function microbit(): Spec {
  const L = new Layout()
  const EDGE = 2.15 / 2
  // buttons A and B with their letters
  for (const [x, ch] of [
    [-0.98, 'A'],
    [0.98, 'B'],
  ] as const) {
    L.top('dark', [0.36, 0.08, 0.36], x, -0.2)
    L.cyl('black', 0.12, 0.08, [x, TOP + 0.12, -0.2])
    glyph(L, ch, x, -0.53, 0.16, 0.026)
  }
  // gold edge connector: five big rings and the narrow fingers between them
  const PADS = [-1.04, -0.52, 0, 0.52, 1.04]
  for (const x of PADS) {
    L.flat('gold', 0.36, 0.42, x, EDGE - 0.21)
    L.cyl('hole', 0.1, 0.072, [x, 0, EDGE - 0.24])
    L.ring('gold', 0.115, 0.02, x, EDGE - 0.24)
  }
  for (const g of [-0.78, -0.26, 0.26, 0.78]) for (const dx of [-0.045, 0, 0.045]) L.flat('gold', 0.03, 0.3, g + dx, EDGE - 0.15)
  glyph(L, '0', PADS[0], 0.56)
  glyph(L, '1', PADS[1], 0.56)
  glyph(L, '2', PADS[2], 0.56)
  glyph(L, '3', PADS[3] - 0.06, 0.56)
  glyph(L, 'V', PADS[3] + 0.06, 0.56)
  glyph(L, 'GND', PADS[4], 0.54)
  // top edge: USB, battery socket, the gold face logo
  port(L, -0.42, -EDGE + 0.09, [0.4, 0.13, 0.3], 'z', -1, [0.3, 0.05])
  L.top('white', [0.42, 0.2, 0.26], 0.5, -EDGE + 0.17)
  for (const dx of [-0.08, 0.08]) L.box('hole', [0.1, 0.1, 0.008], [0.5 + dx, TOP + 0.1, -EDGE + 0.036])
  L.ring('gold', 0.11, 0.02, 0, -0.88, 1.45)
  for (const dx of [-0.06, 0.06]) L.cyl('gold', 0.025, 0.004, [dx, TOP + 0.002, -0.88])
  smd(L, 'dark', [
    [-0.85, 0.4],
    [0.85, 0.4],
  ])
  return {
    pcb: { w: 2.64, d: 2.15, color: '#1c1c1f' },
    layout: L,
    leds: Array.from({ length: OUTPUTS }, (_, i) => [-0.75 + i * 0.3, 0.44]),
    ledSize: [0.07, 0.045],
    power: [-0.85, -0.9],
    powerColor: '#ef4444',
    matrix: { x: 0, z: -0.2, pitch: 0.26 },
    shift: 0,
    lift: -0.075,
  }
}

/** Raspberry Pi 4 */
function raspberrypi(): Spec {
  const L = new Layout()
  const P = 0.0933
  const W = 3.12
  // 40-pin GPIO and the PoE pins
  maleRow(L, -1.3, 20, -0.895, P, 2, 0.24)
  maleRow(L, 0.88, 2, -0.72, P, 2, 0.2)
  // Ethernet and the two USB stacks along the right edge
  port(L, 1.27, -0.66, [0.78, 0.36, 0.6], 'x', 1, [0.42, 0.24])
  for (const [z, tongue] of [
    [-0.02, 'black'],
    [0.58, 'blue'],
  ] as const) {
    const size: Vec3 = [0.66, 0.4, 0.5]
    L.top('silver', size, 1.31, z)
    for (const y of [TOP + 0.11, TOP + 0.29]) slot(L, 1.31, z, size, 'x', 1, [0.38, 0.12], tongue, y)
  }
  // SoC under its heat spreader, RAM, USB controller, wireless can
  L.top('silver', [0.56, 0.05, 0.56], -0.45, 0.05)
  for (const [dz, w] of [
    [-0.08, 0.34],
    [0.02, 0.24],
  ]) L.box('grey', [w, 0.004, 0.03], [-0.45, TOP + 0.052, 0.05 + dz])
  L.top('black', [0.4, 0.04, 0.55], 0.25, 0.05)
  chip(L, 0.85, 0.35, 0.26, 0.26, 0, 4)
  L.top('silver', [0.42, 0.05, 0.34], -1.15, -0.45)
  // bottom edge: USB-C power, two micro-HDMI, audio jack
  port(L, -1.15, 0.925, [0.34, 0.12, 0.28], 'z', 1, [0.26, 0.05])
  for (const x of [-0.6, -0.11]) port(L, x, 0.925, [0.26, 0.1, 0.28], 'z', 1, [0.18, 0.04])
  L.top('black', [0.26, 0.2, 0.5], 0.42, 0.8)
  L.cyl('hole', 0.06, 0.02, [0.42, TOP + 0.1, 1.05], 'z')
  // camera and display ribbon connectors
  L.top('black', [0.47, 0.08, 0.1], -0.015, 0.6)
  L.top('white', [0.43, 0.02, 0.04], -0.015, 0.6, 0, 0.08)
  L.top('black', [0.1, 0.08, 0.6], -1.38, 0.05)
  L.top('white', [0.04, 0.02, 0.56], -1.38, 0.05, 0, 0.08)
  smd(L, 'tan', [
    [-0.05, -0.35],
    [0.25, -0.45],
    [0.6, 0.05],
  ])
  smd(L, 'dark', [
    [-0.75, -0.45],
    [0.55, -0.35],
  ])
  label(L, -0.3, -0.62, 0.5, [0.5])
  for (const x of [-1.43, 0.7]) for (const z of [-0.9, 0.9]) mountHole(L, x, z, 0.08, 'gold')
  return {
    pcb: { w: W, d: 2.05, color: '#237a3c' },
    layout: L,
    leds: Array.from({ length: OUTPUTS }, (_, i) => [-1.3 + P / 2 + i * P, -0.74]),
    ledSize: [0.056, 0.04],
    power: [-1.42, 0.55],
    powerColor: '#ef4444',
    shift: -0.055,
    lift: -0.12,
  }
}

/* ------------------------------------------------- the industrial boards */

/** green screw terminal block along x: `n` ways, the wire openings facing `sign` along z */
function screwTerminals(L: Layout, x0: number, z: number, n: number, pitch: number, sign: 1 | -1, h = 0.2, d = 0.3, lift = 0) {
  L.top('terminal', [n * pitch - 0.01, h, d], x0 + (n * pitch) / 2, z, 0, lift)
  const y = TOP + lift + h
  for (let i = 0; i < n; i++) {
    const x = x0 + pitch / 2 + i * pitch
    const sz = z - sign * d * 0.12
    // the screw in its well, with its slot
    L.cyl('hole', pitch * 0.36, 0.006, [x, y + 0.002, sz])
    L.cyl('silver', pitch * 0.28, 0.02, [x, y + 0.008, sz])
    L.box('dark', [pitch * 0.42, 0.006, pitch * 0.07], [x, y + 0.019, sz], 0.7)
    // the square mouth the wire goes into
    L.box('hole', [pitch * 0.56, h * 0.36, 0.008], [x, TOP + lift + h * 0.38, z + sign * (d / 2 + 0.004)])
    // ribs between the ways
    if (i > 0) L.box('terminal', [0.016, 0.03, d * 0.9], [x - pitch / 2, y + 0.015, z])
  }
}

/** DPAK power transistor: black body, two legs at the front, the wide silver tab soldered behind it */
function dpak(L: Layout, x: number, z: number) {
  L.top('silver', [0.26, 0.016, 0.16], x, z - 0.12)
  L.top('black', [0.25, 0.075, 0.22], x, z)
  for (const dx of [-0.075, 0.075]) L.top('silver', [0.035, 0.016, 0.1], x + dx, z + 0.15)
}

/** a car's engine computer (ECU), opened up */
function ecu(): Spec {
  const L = new Layout()
  // the big automotive connector along the front edge: two pin fields facing out
  const C = { x: -0.3, z: 0.64, w: 2.5, d: 0.46, h: 0.3 }
  const face = C.z + C.d / 2
  L.top('black', [C.w, C.h, C.d], C.x, C.z)
  for (const fx of [-0.63, 0.63]) {
    L.box('hole', [1.08, C.h * 0.64, 0.008], [C.x + fx, TOP + C.h * 0.48, face + 0.004])
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 11; c++) {
        L.box('gold', [0.034, 0.034, 0.008], [C.x + fx + (c - 5) * 0.09, TOP + C.h * 0.48 + (r - 1) * 0.058, face + 0.009])
      }
    }
  }
  // coding ribs on top and the locking towers at both ends
  for (const dx of [-0.95, -0.3, 0.3, 0.95]) L.top('dark', [0.05, 0.02, C.d * 0.7], C.x + dx, C.z + 0.02, 0, C.h)
  for (const side of [-1, 1]) L.top('black', [0.14, C.h + 0.06, 0.3], C.x + side * (C.w / 2 + 0.05), C.z + 0.02)
  // the latch lever: a U lying over the top, pivoting on the end towers
  L.top('slate', [C.w + 0.06, 0.04, 0.08], C.x, C.z + 0.17, 0, C.h + 0.03)
  for (const side of [-1, 1]) {
    L.top('slate', [0.05, 0.04, 0.36], C.x + side * (C.w / 2 + 0.03), C.z + 0.02, 0, C.h + 0.03)
    L.cyl('silver', 0.04, 0.06, [C.x + side * (C.w / 2 + 0.1), TOP + C.h - 0.04, C.z - 0.05], 'x')
  }
  // the microcontroller (QFP), its crystal, the CAN transceiver
  chip(L, -0.15, -0.2, 0.62, 0.62, 16, 4)
  L.cyl('grey', 0.035, 0.004, [-0.37, TOP + 0.052, -0.42])
  L.top('black', [0.3, 0.02, 0.14], 0.42, -0.5)
  L.top('silver', [0.27, 0.07, 0.11], 0.42, -0.5, 0, 0.02)
  chip(L, -1.05, -0.2, 0.26, 0.17, 4, 2)
  // three power drivers with their tabs, two electrolytics, a power inductor
  for (const x of [0.92, 1.2, 1.48]) dpak(L, x, -0.52)
  for (const x of [1.22, 1.52]) ecap(L, x, 0.5, 0.13, 0.3)
  L.top('dark', [0.28, 0.14, 0.28], 0.68, -0.02)
  L.top('grey', [0.16, 0.004, 0.16], 0.68, -0.02, 0, 0.14)
  smd(L, 'tan', [
    [0.3, -0.15],
    [0.3, 0.02],
    [-0.6, -0.3],
    [-0.62, 0.02],
    [1.05, -0.12],
    [1.33, -0.12],
  ])
  smd(L, 'dark', [
    [-0.85, 0.08],
    [-1.25, 0.08],
    [1.6, -0.12],
    [0.2, -0.58],
  ], Math.PI / 2)
  // "ECU" in silkscreen and the output marks under the LEDs
  for (const [k, ch] of ['E', 'C', 'U'].entries()) glyph(L, ch, -0.9 + k * 0.13, -0.47, 0.12, 0.02)
  for (let i = 0; i < OUTPUTS; i++) L.flat('silk', 0.07, 0.022, -1.5 + i * 0.16, -0.58)
  for (const [x, z] of [
    [-1.6, -0.8],
    [1.6, -0.8],
    [1.6, 0.8],
  ]) mountHole(L, x, z, 0.06)
  return {
    pcb: { w: 3.4, d: 1.8, color: '#1d4a33' },
    layout: L,
    leds: Array.from({ length: OUTPUTS }, (_, i) => [-1.5 + i * 0.16, -0.7]),
    ledSize: [0.08, 0.05],
    power: [-1.5, -0.2],
    powerColor: '#22c55e',
    shift: 0.05,
    lift: -0.08,
  }
}

/** a factory PLC: a grey DIN-rail module with terminal rows top and bottom */
function plc(): Spec {
  const L = new Layout()
  /** the top of the raised front, where the panel, LEDs and LCD are */
  const D = 0.36
  const SHELF = 0.16
  // the DIN rail behind it, the housing: low shelves for the terminals, a raised front between them
  L.box('silver', [3.62, 0.04, 0.34], [0, -BOARD_T / 2 - 0.02, 0])
  L.top('plastic', [3.34, SHELF, 1.74], 0, 0)
  L.top('plastic', [3.34, D - SHELF, 0.9], 0, 0, 0, SHELF)
  L.flat('teal', 3.34, 0.07, 0, -0.41, 0, D)
  // input terminals along the back, outputs and supply along the front
  for (const x0 of [-1.54, -0.62, 0.3]) screwTerminals(L, x0, -0.66, 4, 0.22, -1, 0.17, 0.3, SHELF)
  screwTerminals(L, -1.54, 0.66, 2, 0.22, 1, 0.17, 0.3, SHELF)
  screwTerminals(L, -0.95, 0.66, 4, 0.22, 1, 0.17, 0.3, SHELF)
  screwTerminals(L, 0.25, 0.66, 6, 0.22, 1, 0.17, 0.3, SHELF)
  // the charcoal front panel: the LCD in its bezel, the keypad, the LEDs
  L.flat('charcoal', 3.2, 0.74, 0, 0.03, 0, D)
  L.top('black', [0.94, 0.012, 0.54], -1.08, 0.02, 0, D)
  const ink = TOP + D + 0.012 + 0.008
  for (const [dz, w] of [
    [-0.12, 0.5],
    [-0.04, 0.62],
    [0.04, 0.36],
    [0.12, 0.56],
  ]) L.box('ink', [w, 0.002, 0.04], [-1.08 - (0.7 - w) / 2, ink, 0.02 + dz])
  for (const [dx, dz] of [
    [0, -0.14],
    [0, 0.14],
    [-0.14, 0],
    [0.14, 0],
  ]) {
    L.top('slate', [0.1, 0.03, 0.1], -0.36 + dx, 0.02 + dz, 0, D)
  }
  for (const dx of [-0.12, 0.12]) L.top('slate', [0.16, 0.03, 0.08], -0.36 + dx, 0.3, 0, D)
  // "PLC" and the output names, a flap over the memory card slot, vents
  for (const [k, ch] of ['P', 'L', 'C'].entries()) glyph(L, ch, 1.12 + k * 0.15, -0.2, 0.15, 0.024, D)
  L.flat('silk', 0.07, 0.022, 0.36, -0.11, 0, D)
  for (let i = 0; i < OUTPUTS; i++) L.flat('silk', 0.12, 0.022, 0.36 + i * 0.22, 0.32, 0, D)
  L.top('plastic', [0.5, 0.012, 0.18], 0.75, -0.22, 0, D)
  L.flat('hole', 0.12, 0.02, 0.75, -0.22, 0, D + 0.012)
  return {
    pcb: { w: 3.4, d: 1.8, color: '#a3a9b2' },
    layout: L,
    leds: Array.from({ length: OUTPUTS }, (_, i) => [0.36 + i * 0.22, 0.22]),
    ledSize: [0.09, 0.06],
    ledColor: ['#22c55e', '#4d6b58'],
    power: [0.36, -0.2],
    powerColor: '#22c55e',
    deck: D,
    screen: { x: -1.08, z: 0.02, w: 0.84, d: 0.44, y: D + 0.012, color: '#8fd3c4', glow: '#2dd4bf' },
    shift: 0,
    lift: -0.12,
  }
}

/** the remote terminal unit (RTU) of an oil well: a dark board in a safety-orange tray */
function rtu(): Spec {
  const L = new Layout()
  // the tray: a floor under the board and walls round it
  const yb = -BOARD_T / 2 - 0.05
  const yt = TOP + 0.1
  const wy = (yb + yt) / 2
  L.box('orange', [3.4, 0.05, 1.8], [0, yb + 0.025, 0])
  for (const z of [-0.85, 0.85]) L.box('orange', [3.4, yt - yb, 0.1], [0, wy, z])
  for (const x of [-1.65, 1.65]) L.box('orange', [0.1, yt - yb, 1.6], [x, wy, 0])
  for (const x of [-1.65, 1.65]) for (const z of [-0.85, 0.85]) L.cyl('silver', 0.035, 0.01, [x, yt + 0.005, z])
  // the 18650 cell in its holder
  const B = { x: -0.78, z: -0.4, r: 0.17 }
  const by = TOP + 0.04 + B.r
  L.top('black', [1.42, 0.1, 0.44], B.x, B.z)
  for (const side of [-1, 1]) L.top('black', [0.08, 0.32, 0.44], B.x + side * 0.67, B.z)
  L.cyl('blue', B.r, 1.16, [B.x, by, B.z], 'x')
  L.cyl('white', B.r + 0.003, 0.025, [B.x + 0.5, by, B.z], 'x')
  L.cyl('silver', B.r * 0.42, 0.06, [B.x + 0.6, by, B.z], 'x')
  L.cyl('silver', B.r * 0.75, 0.03, [B.x - 0.6, by, B.z], 'x')
  // the radio: a shield can, its gold SMA socket and a short black antenna standing up
  L.top('silver', [0.66, 0.1, 0.56], 0.98, -0.36)
  L.flat('grey', 0.3, 0.03, 0.9, -0.48)
  L.flat('grey', 0.22, 0.03, 0.86, -0.4)
  L.flat('gold', 0.05, 0.16, 1.43, -0.45)
  const A = { x: 1.43, z: -0.6 }
  L.cyl('gold', 0.08, 0.06, [A.x, TOP + 0.03, A.z], 'y', false, 0, 6)
  L.cyl('gold', 0.05, 0.12, [A.x, TOP + 0.12, A.z])
  L.cyl('rubber', 0.065, 0.1, [A.x, TOP + 0.23, A.z])
  L.cyl('rubber', 0.045, 0.4, [A.x, TOP + 0.48, A.z])
  L.cyl('rubber', 0.05, 0.03, [A.x, TOP + 0.69, A.z])
  // the controller and its passives
  chip(L, 0.25, -0.05, 0.38, 0.38, 9, 4)
  L.top('silver', [0.2, 0.05, 0.09], 0.25, 0.28)
  smd(L, 'tan', [
    [-0.05, -0.2],
    [-0.05, 0.08],
    [0.55, -0.02],
    [0.55, 0.16],
  ])
  smd(L, 'dark', [
    [0.85, 0.2],
    [1.05, 0.2],
    [1.25, 0.2],
  ], Math.PI / 2)
  regulator(L, 1.3, -0.02)
  // field terminals along the front: outputs, inputs and the supply
  for (const x0 of [-1.48, -0.66, 0.16]) screwTerminals(L, x0, 0.52, 4, 0.2, 1, 0.2, 0.26)
  screwTerminals(L, 1.06, 0.52, 2, 0.2, 1, 0.2, 0.26)
  for (let i = 0; i < OUTPUTS; i++) L.flat('silk', 0.08, 0.022, -1.38 + i * 0.2, 0.02)
  for (const x of [-1.45, 1.45]) for (const z of [-0.65, 0.65]) mountHole(L, x, z, 0.05)
  return {
    pcb: { w: 3.1, d: 1.5, color: '#1c2430' },
    layout: L,
    leds: Array.from({ length: OUTPUTS }, (_, i) => [-1.38 + i * 0.2, 0.12]),
    ledSize: [0.08, 0.05],
    power: [0.75, 0.12],
    powerColor: '#22c55e',
    shift: 0,
    lift: -0.1,
  }
}

const SPECS: Record<Variant, () => Spec> = { nano, mega, esp32, esp8266, pico, microbit, raspberrypi, ecu, plc, rtu }

const unit = (v: number | undefined) => THREE.MathUtils.clamp(v !== undefined && Number.isFinite(v) ? v : 0, 0, 1)

/** A tiny SMD LED on the board with its glow, following `level` (0..1); `y` lifts it onto a housing. */
function Led({
  x,
  z,
  y = 0,
  size,
  level,
  color,
  off,
  halo,
}: {
  x: number
  z: number
  y?: number
  size: [number, number]
  level: number
  color: string
  off: string
  halo: number
}) {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const lit = useRef(unit(level))
  const glow = useRef(0)
  useFrame((_, dt) => {
    // LEDs follow their pin almost instantly
    lit.current = damp(lit.current, unit(level), 16, dt)
    if (material.current) material.current.emissiveIntensity = 0.02 + lit.current * 3
    glow.current = lit.current * 0.7
  })
  return (
    <>
      <mesh position={[x, TOP + y + 0.018, z]}>
        <boxGeometry args={[size[0], 0.035, size[1]]} />
        <meshStandardMaterial ref={material} color={off} emissive={color} emissiveIntensity={0.02} roughness={0.35} toneMapped={false} />
      </mesh>
      <Halo color={color} intensity={glow} position={[x, TOP + y + 0.08, z]} scale={halo} />
    </>
  )
}

/** A backlit LCD that lights up with the power. */
function Screen({ screen, powered }: { screen: NonNullable<Spec['screen']>; powered: boolean }) {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const lit = useRef(powered ? 1 : 0)
  useFrame((_, dt) => {
    lit.current = damp(lit.current, powered ? 1 : 0, 6, dt)
    if (material.current) material.current.emissiveIntensity = 0.04 + lit.current * 0.5
  })
  return (
    <mesh position={[screen.x, TOP + screen.y + 0.004, screen.z]}>
      <boxGeometry args={[screen.w, 0.008, screen.d]} />
      <meshStandardMaterial ref={material} color={screen.color} emissive={screen.glow} emissiveIntensity={0.04} roughness={0.3} />
    </mesh>
  )
}

/**
 * Other microcontroller, computer and industrial boards. Each shows its six
 * output pins as LEDs (amber unless the board has its own colour) beside the
 * header, plus a power LED; the micro:bit also lights its 5 × 5 grid, one
 * column per output, and the PLC's LCD lights up with the power.
 */
export function BoardModel({
  variant,
  levels,
  powered,
}: {
  variant: Variant
  /** output level 0..1 of the board's six output pins, in order */
  levels: number[]
  powered: boolean
}) {
  const spec = useMemo(() => (SPECS[variant] ?? SPECS.nano)(), [variant])
  const meshes = useMemo(
    () =>
      (Object.entries(spec.layout.parts) as [Mat, Prim[]][]).map(([mat, prims]) => {
        const parts = prims.map(primGeometry)
        const geometry = mergeGeometries(parts) ?? new THREE.BufferGeometry()
        parts.forEach((g) => g.dispose())
        return { mat, geometry }
      }),
    [spec],
  )
  useEffect(() => () => meshes.forEach(({ geometry }) => geometry.dispose()), [meshes])

  const matrixMaterials = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const columns = useRef(Array.from({ length: 5 }, () => 0))

  useFrame((_, dt) => {
    if (!spec.matrix) return
    // micro:bit: each of the first five outputs fills one column from the bottom
    for (let c = 0; c < 5; c++) columns.current[c] = damp(columns.current[c], unit(levels[c]), 16, dt)
    matrixMaterials.current.forEach((m, k) => {
      if (!m) return
      const fromBottom = 4 - (k % 5)
      m.emissiveIntensity = THREE.MathUtils.clamp(columns.current[Math.floor(k / 5)] * 5 - fromBottom, 0, 1) * 2.4
    })
  })

  const { pcb, matrix } = spec

  return (
    <group position={[0, spec.lift, 0]} rotation={[TILT, 0, 0]}>
      <group position={[spec.shift, 0, 0]}>
        <RoundedBox args={[pcb.w, BOARD_T, pcb.d]} radius={0.025} smoothness={2} position={[pcb.x ?? 0, 0, 0]}>
          <meshStandardMaterial color={pcb.color} roughness={0.55} metalness={0.1} />
        </RoundedBox>
        {meshes.map(({ mat, geometry }) => (
          <mesh key={mat} geometry={geometry}>
            <meshStandardMaterial {...MATERIALS[mat]} />
          </mesh>
        ))}

        {spec.leds.map(([x, z], i) => (
          <Led
            key={i}
            x={x}
            z={z}
            y={spec.deck}
            size={spec.ledSize}
            level={levels[i] ?? 0}
            color={spec.ledColor?.[0] ?? '#ffa31a'}
            off={spec.ledColor?.[1] ?? '#fde9b8'}
            halo={0.5}
          />
        ))}
        <Led x={spec.power[0]} z={spec.power[1]} y={spec.deck} size={spec.ledSize} level={powered ? 1 : 0} color={spec.powerColor} off="#e5e7eb" halo={0.6} />
        {spec.screen && <Screen screen={spec.screen} powered={powered} />}
        {matrix &&
          Array.from({ length: 25 }, (_, k) => (
            <mesh key={k} position={[matrix.x + (Math.floor(k / 5) - 2) * matrix.pitch, TOP + 0.015, matrix.z + ((k % 5) - 2) * matrix.pitch]}>
              <boxGeometry args={[0.06, 0.03, 0.1]} />
              <meshStandardMaterial
                ref={(m) => {
                  matrixMaterials.current[k] = m
                }}
                color="#5f534c"
                emissive="#ff1f1f"
                emissiveIntensity={0}
                roughness={0.4}
                toneMapped={false}
              />
            </mesh>
          ))}
      </group>
    </group>
  )
}
