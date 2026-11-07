import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Halo, damp } from '../helpers'

type Variant = 'nano' | 'mega' | 'esp32' | 'esp8266' | 'pico' | 'microbit' | 'raspberrypi'

/** same lean as the Arduino UNO so every board shares one camera framing */
const TILT = 0.72
const BOARD_T = 0.06
/** top surface of the PCB */
const TOP = BOARD_T / 2
const OUTPUTS = 6

type Vec3 = [number, number, number]
type Mat = 'black' | 'hole' | 'gold' | 'silver' | 'silk' | 'white' | 'tan' | 'dark' | 'red' | 'blue' | 'grey' | 'copper'

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
}

type Prim =
  | { kind: 'box'; size: Vec3; at: Vec3; turn: number }
  | { kind: 'cyl'; r: number; h: number; at: Vec3; axis: 'x' | 'y' | 'z'; half: boolean; turn: number }
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

  /** print or a pad flat on the board */
  flat(mat: Mat, w: number, d: number, x: number, z: number, turn = 0) {
    this.box(mat, [w, 0.004, d], [x, TOP + 0.002, z], turn)
  }

  cyl(mat: Mat, r: number, h: number, at: Vec3, axis: 'x' | 'y' | 'z' = 'y', half = false, turn = 0) {
    this.add(mat, { kind: 'cyl', r, h, at, axis, half, turn })
  }

  /** a thin ring lying on the board */
  ring(mat: Mat, r: number, tube: number, x: number, z: number, stretch = 1) {
    this.add(mat, { kind: 'ring', r, tube, at: [x, TOP + 0.004, z], stretch })
  }
}

function primGeometry(p: Prim): THREE.BufferGeometry {
  if (p.kind === 'box') return new THREE.BoxGeometry(...p.size).rotateY(p.turn).translate(...p.at)
  if (p.kind === 'cyl') {
    const g = new THREE.CylinderGeometry(p.r, p.r, p.h, 18, 1, false, 0, p.half ? Math.PI : Math.PI * 2).rotateY(p.turn)
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
const SEGMENTS: Record<string, string> = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd' }

function glyph(L: Layout, ch: string, x: number, z: number, h = 0.13, s = 0.022) {
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
      L.flat('silk', s, stroke, x - w / 4, z, -lean)
      L.flat('silk', s, stroke, x + w / 4, z, lean)
      L.flat('silk', w * 0.5, s, x, z + h * 0.12)
      return
    case 'V':
      L.flat('silk', s, stroke, x - w / 4, z, lean)
      L.flat('silk', s, stroke, x + w / 4, z, -lean)
      return
    case 'B':
      L.flat('silk', s, h, x - w / 2, z)
      for (const dz of [-half, half]) L.flat('silk', w * 0.75, s, x - w * 0.125, z + dz)
      L.flat('silk', w * 0.6, s, x - w * 0.2, z)
      for (const dz of [-half / 2, half / 2]) L.flat('silk', s, half * 0.8, x + w * 0.3, z + dz)
      return
    case 'GND':
      L.flat('silk', s, h * 0.45, x, z - h * 0.3)
      ;[0.16, 0.1, 0.045].forEach((bw, i) => L.flat('silk', bw, s, x, z + i * 0.04))
      return
  }
  for (const k of SEGMENTS[ch] ?? '') {
    const [sx, sz, across] = seg[k]
    L.flat('silk', across ? w : s, across ? s : half, sx, sz)
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

const SPECS: Record<Variant, () => Spec> = { nano, mega, esp32, esp8266, pico, microbit, raspberrypi }

const unit = (v: number | undefined) => THREE.MathUtils.clamp(v !== undefined && Number.isFinite(v) ? v : 0, 0, 1)

/** A tiny SMD LED on the board with its glow, following `level` (0..1). */
function Led({ x, z, size, level, color, off, halo }: { x: number; z: number; size: [number, number]; level: number; color: string; off: string; halo: number }) {
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
      <mesh position={[x, TOP + 0.018, z]}>
        <boxGeometry args={[size[0], 0.035, size[1]]} />
        <meshStandardMaterial ref={material} color={off} emissive={color} emissiveIntensity={0.02} roughness={0.35} toneMapped={false} />
      </mesh>
      <Halo color={color} intensity={glow} position={[x, TOP + 0.08, z]} scale={halo} />
    </>
  )
}

/**
 * Other microcontroller and computer boards. Each shows its six output pins
 * as amber LEDs beside the header, plus a power LED; the micro:bit also
 * lights its 5 × 5 grid, one column per output.
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
          <Led key={i} x={x} z={z} size={spec.ledSize} level={levels[i] ?? 0} color="#ffa31a" off="#fde9b8" halo={0.5} />
        ))}
        <Led x={spec.power[0]} z={spec.power[1]} size={spec.ledSize} level={powered ? 1 : 0} color={spec.powerColor} off="#e5e7eb" halo={0.6} />
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
