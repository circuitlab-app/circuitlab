import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { RadioType } from '@/circuit/catalog'
import { Halo, damp } from '../helpers'
import { markingTexture } from './print'
import { MODULE_TILT, merge } from './shared'

/*
 * The message modules: SMS (a SIM800L), Wi-Fi (an ESP-01), Bluetooth (an
 * HC-05), LoRa, GPS (a NEO-6M), CAN bus (an MCP2515 board) and RS-485 (a
 * MAX485 board). Each stands like the sensor modules, its face toward +z, and
 * shows what it is doing with its lights the way the real board does: the
 * SIM800's network light blinks fast while it looks for the network and
 * slowly once it is on it, the Bluetooth light blinks fast until it is paired.
 * The four wireless ones send a few faint rings out of their antenna with
 * every message.
 */

const BOARD_T = 0.05
const FACE = BOARD_T / 2
const PITCH = 0.126

type Vec2 = [number, number]
type Vec3 = [number, number, number]

type Mat =
  | 'black'
  | 'hole'
  | 'gold'
  | 'silver'
  | 'can'
  | 'silk'
  | 'tan'
  | 'dark'
  | 'grey'
  | 'copper'
  | 'rubber'
  | 'beige'
  | 'white'
  | 'module'
  | 'greenTerminal'
  | 'blueTerminal'

/** No environment map here, so big metal faces keep some diffuse colour instead of turning black. */
const MATERIALS: Record<Mat, { color: string; roughness: number; metalness?: number }> = {
  black: { color: '#1c1c1f', roughness: 0.5 },
  hole: { color: '#060606', roughness: 0.9 },
  gold: { color: '#e5c76b', roughness: 0.3, metalness: 0.75 },
  silver: { color: '#d4d7dc', roughness: 0.3, metalness: 0.6 },
  /** the brushed tin of a shield can */
  can: { color: '#d9dde3', roughness: 0.38, metalness: 0.45 },
  silk: { color: '#f1f5f9', roughness: 0.7 },
  tan: { color: '#c8a27a', roughness: 0.55 },
  dark: { color: '#2a2a2e', roughness: 0.5 },
  grey: { color: '#8b9099', roughness: 0.45, metalness: 0.3 },
  copper: { color: '#d08a4e', roughness: 0.3, metalness: 0.7 },
  rubber: { color: '#17171a', roughness: 0.8 },
  /** the ceramic of a GPS patch antenna */
  beige: { color: '#d8c49a', roughness: 0.7 },
  white: { color: '#eef1f4', roughness: 0.45 },
  /** the green HC-05 board riding on the Bluetooth carrier */
  module: { color: '#16803f', roughness: 0.55 },
  greenTerminal: { color: '#1f9d55', roughness: 0.5 },
  blueTerminal: { color: '#2563eb', roughness: 0.45 },
}

/* ---------------------------------------------------------------- builder */

/** Collects the static parts of a module by material, to merge into one mesh each. */
class Face {
  parts: Partial<Record<Mat, THREE.BufferGeometry[]>> = {}

  add(mat: Mat, g: THREE.BufferGeometry) {
    ;(this.parts[mat] ??= []).push(g)
  }

  /** a block on the face: `w` wide, `h` tall, `d` deep, raised `lift` off the face */
  block(mat: Mat, w: number, h: number, d: number, x: number, y: number, lift = 0, turn = 0) {
    this.add(mat, new THREE.BoxGeometry(w, h, d).rotateZ(turn).translate(x, y, FACE + lift + d / 2))
  }

  /** print or a pad flat on the face (or on something `lift` deep) */
  flat(mat: Mat, w: number, h: number, x: number, y: number, lift = 0, turn = 0) {
    this.block(mat, w, h, 0.004, x, y, lift, turn)
  }

  /** a disc or post standing out of the face */
  post(mat: Mat, r: number, d: number, x: number, y: number, lift = 0, sides = 20) {
    this.add(mat, new THREE.CylinderGeometry(r, r, d, sides).rotateX(Math.PI / 2).translate(x, y, FACE + lift + d / 2))
  }

  /** a round rod standing up (along +y) from `y0` to `y1`, `rTop` wide at its top */
  rod(mat: Mat, r: number, y0: number, y1: number, x: number, z: number, rTop = r, sides = 16) {
    this.add(mat, new THREE.CylinderGeometry(rTop, r, y1 - y0, sides).translate(x, (y0 + y1) / 2, z))
  }
}

/** right-angle pin header on the bottom edge, its pins pointing down past it */
function bottomHeader(F: Face, n: number, h: number) {
  const edge = -h / 2
  F.block('black', n * PITCH, 0.1, 0.1, 0, edge + 0.05)
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * PITCH
    F.add('gold', new THREE.BoxGeometry(0.035, 0.34, 0.035).translate(x, edge - 0.1, FACE + 0.05))
    F.flat('silk', 0.05, 0.014, x, edge + 0.15)
  }
}

/** right-angle pin header on the left edge, `rows` deep, its pins pointing out to the left */
function leftHeader(F: Face, n: number, w: number, pitch = PITCH, rows = 1) {
  const edge = -w / 2
  F.block('black', 0.1, n * pitch, 0.1 * rows, edge + 0.05, 0)
  for (let i = 0; i < n; i++) {
    const y = (i - (n - 1) / 2) * pitch
    for (let r = 0; r < rows; r++) F.add('gold', new THREE.BoxGeometry(0.3, 0.035, 0.035).translate(edge - 0.1, y, FACE + 0.05 + r * 0.1))
    F.flat('silk', 0.014, 0.05, edge + 0.15, y)
  }
}

/** a black IC with silver legs along its top and bottom edges (and its sides for `sides` 4) */
function chip(F: Face, x: number, y: number, w: number, h: number, perSide: number, sides: 2 | 4, lift = 0, d = 0.045) {
  F.block('black', w, h, d, x, y, lift)
  for (let k = 0; k < perSide; k++) {
    const tx = (k - (perSide - 1) / 2) * ((w * 0.8) / perSide)
    const ty = (k - (perSide - 1) / 2) * ((h * 0.8) / perSide)
    for (const side of [-1, 1]) {
      F.block('silver', 0.022, 0.05, 0.016, x + tx, y + side * (h / 2 + 0.02), lift)
      if (sides === 4) F.block('silver', 0.05, 0.022, 0.016, x + side * (w / 2 + 0.02), y + ty, lift)
    }
  }
  // the pin 1 dot
  F.post('grey', 0.016, 0.003, x - w / 2 + 0.045, y + h / 2 - 0.045, lift + d, 12)
}

/** tiny resistors and capacitors */
function smd(F: Face, mat: Mat, spots: Vec2[], turn = 0) {
  for (const [x, y] of spots) F.block(mat, 0.075, 0.042, 0.026, x, y, 0, turn)
}

/** an HC-49 crystal: a silver can with round ends */
function crystal(F: Face, x: number, y: number, w = 0.32, h = 0.12, d = 0.09) {
  F.block('silver', w - h, h, d, x, y)
  for (const side of [-1, 1]) F.post('silver', h / 2, d, x + (side * (w - h)) / 2, y)
}

/** a plated mounting hole */
function hole(F: Face, x: number, y: number, r = 0.04) {
  F.add('gold', new THREE.RingGeometry(r, r + 0.028, 20).translate(x, y, FACE + 0.001))
  F.add('hole', new THREE.CircleGeometry(r, 20).translate(x, y, FACE + 0.002))
}

/** a screw terminal hanging over the right edge: `n` ways stacked along y, the screws facing the viewer, the wire mouths facing out */
function screwTerminal(F: Face, mat: Mat, edge: number, y0: number, n: number, pitch = 0.2) {
  const w = 0.26
  const d = 0.24
  const x = edge - w / 2 + 0.03
  F.block(mat, w, n * pitch - 0.01, d, x, y0)
  for (let i = 0; i < n; i++) {
    const y = y0 + (i - (n - 1) / 2) * pitch
    F.post('hole', 0.064, 0.006, x - 0.025, y, d)
    F.post('silver', 0.05, 0.02, x - 0.025, y, d + 0.002)
    F.block('dark', 0.082, 0.016, 0.006, x - 0.025, y, d + 0.022, 0.7)
    F.block('hole', 0.008, pitch * 0.48, d * 0.42, x + w / 2 + 0.004, y, d * 0.16)
    if (i > 0) F.block(mat, w * 0.9, 0.016, 0.03, x, y - pitch / 2, d)
  }
}

/** a spring antenna: a copper wire wound round the y axis, starting at +x */
function helixGeometry(r: number, h: number, turns: number, wire: number) {
  class Helix extends THREE.Curve<THREE.Vector3> {
    constructor() {
      super()
    }

    getPoint(t: number, target = new THREE.Vector3()) {
      const a = t * turns * Math.PI * 2
      return target.set(Math.cos(a) * r, t * h, Math.sin(a) * r)
    }
  }
  return new THREE.TubeGeometry(new Helix(), turns * 18, wire, 6)
}

/** a PCB antenna: runs along y joined at alternating ends */
function meander(F: Face, mat: Mat, x0: number, y0: number, y1: number, runs: number, step: number, lift = 0) {
  for (let k = 0; k < runs; k++) {
    const x = x0 + k * step
    F.flat(mat, 0.022, y1 - y0, x, (y0 + y1) / 2, lift)
    if (k < runs - 1) F.flat(mat, step + 0.022, 0.022, x + step / 2, k % 2 === 0 ? y1 : y0, lift)
  }
}

/* --------------------------------------------------------------- modules */

/** what a status light does; each one is worked out every frame from the clock */
type Role = 'power' | 'net' | 'wifi' | 'pair' | 'tx' | 'busTx' | 'busRx'

type Light = { role: Role; at: Vec2; color: string; off: string }

type Spec = {
  board: { w: number; h: number; color: string }
  build: () => Face
  /** where the module sits in its window */
  at: Vec3
  lights: Light[]
  /** laser marking on a chip or a can: lines, centre, size, the depth of its top */
  marks?: { lines: string[]; x: number; y: number; w: number; h: number; z: number; color?: string }[]
  /** rings sent out of the antenna with every message */
  waves?: { at: Vec3; color: string; axis: number; both: boolean; spread: number; radius: number; repeat?: number }
}

const POWER_RED: Light['color'] = '#ef4444'
const RED_OFF = '#fecaca'
const GREEN = '#22c55e'
const GREEN_OFF = '#bbf7d0'
const AMBER = '#f59e0b'
const AMBER_OFF = '#fde68a'

/* SMS: SIM800L with its micro-SIM holder and spring antenna */
const GSM = { w: 1.3, h: 0.92, color: '#6b1a2a' }
const GSM_COIL = { x: 0.47, y: GSM.h / 2 - 0.06, r: 0.055, h: 0.42, z: FACE + 0.07 }

function gsmParts() {
  const F = new Face()
  bottomHeader(F, 6, GSM.h)
  // the SIM800 under its shield can
  F.block('can', 0.64, 0.56, 0.08, -0.2, 0.04)
  // the micro-SIM holder with the card in it, its gold contacts showing
  F.block('silver', 0.38, 0.54, 0.03, 0.39, 0.01)
  for (const side of [-1, 1]) F.block('silver', 0.03, 0.54, 0.056, 0.39 + side * 0.175, 0.01)
  F.block('white', 0.31, 0.44, 0.012, 0.39, -0.01, 0.03)
  F.block('gold', 0.17, 0.2, 0.004, 0.39, 0.0, 0.042)
  F.block('dark', 0.004, 0.2, 0.002, 0.39, 0.0, 0.046)
  for (const dy of [-0.034, 0.034]) F.block('dark', 0.17, 0.004, 0.002, 0.39, dy, 0.046)
  // the spring antenna standing on its pad at the top edge
  F.flat('gold', 0.16, 0.1, GSM_COIL.x + 0.03, GSM_COIL.y)
  F.post('copper', 0.011, GSM_COIL.z - FACE, GSM_COIL.x + GSM_COIL.r, GSM_COIL.y, 0, 8)
  F.add('copper', helixGeometry(GSM_COIL.r, GSM_COIL.h, 10, 0.011).translate(GSM_COIL.x, GSM_COIL.y, GSM_COIL.z))
  // a big tantalum capacitor for the bursts of current, and the little parts
  F.block('black', 0.16, 0.09, 0.06, -0.36, -0.3)
  F.flat('tan', 0.03, 0.09, -0.42, -0.3, 0.06)
  smd(F, 'tan', [
    [0.12, -0.33],
    [0.25, -0.33],
    [0.52, -0.33],
  ])
  smd(F, 'dark', [
    [-0.08, 0.385],
    [0.08, 0.385],
  ])
  hole(F, -0.56, -0.37)
  hole(F, 0.56, -0.37)
  return F
}

/* Wi-Fi: ESP-01 */
const WIFI = { w: 1.45, h: 0.78, color: '#151517' }

function wifiParts() {
  const F = new Face()
  leftHeader(F, 4, WIFI.w, PITCH, 2)
  chip(F, -0.12, 0.06, 0.3, 0.3, 0, 4)
  chip(F, -0.45, 0.13, 0.22, 0.15, 4, 2)
  F.block('silver', 0.18, 0.12, 0.05, 0.14, -0.2)
  smd(F, 'tan', [
    [0.16, 0.12],
    [0.16, 0.0],
    [-0.12, -0.22],
    [0.0, 0.3],
  ])
  smd(F, 'dark', [
    [-0.2, 0.3],
    [-0.45, -0.08],
  ], Math.PI / 2)
  // the gold zig-zag antenna across the far end, fed from the chip
  meander(F, 'gold', 0.38, -0.3, 0.3, 6, 0.058)
  F.flat('gold', 0.14, 0.022, 0.31, -0.3)
  return F
}

/* Bluetooth: an HC-05 riding on its sky-blue carrier */
const BT = { w: 1.55, h: 0.72, color: '#38a2dc' }
/** the green HC-05 itself */
const HC = { x: 0.2, w: 1.06, h: 0.56, t: 0.03 }

function bluetoothParts() {
  const F = new Face()
  leftHeader(F, 6, BT.w, 0.11)
  F.block('module', HC.w, HC.h, HC.t, HC.x, 0)
  // the half holes along its edges, soldered to the carrier
  for (let i = 0; i < 13; i++) {
    for (const side of [-1, 1]) F.flat('gold', 0.032, 0.06, HC.x - HC.w / 2 + 0.08 + i * 0.058, side * (HC.h / 2 - 0.03), HC.t)
  }
  chip(F, HC.x - 0.1, 0.0, 0.24, 0.24, 0, 4, HC.t)
  chip(F, HC.x - 0.37, 0.0, 0.2, 0.13, 4, 2, HC.t)
  F.block('silver', 0.12, 0.08, 0.035, HC.x + 0.13, -0.12, HC.t)
  smd(F, 'tan', [[HC.x + 0.13, 0.1]])
  // the trace antenna at its far end
  const ax = HC.x + HC.w / 2 - 0.06
  F.flat('gold', 0.025, 0.42, ax, 0.0, HC.t)
  F.flat('gold', 0.16, 0.025, ax - 0.07, 0.2, HC.t)
  for (const dx of [-0.07, -0.14]) F.flat('gold', 0.025, 0.14, ax + dx, 0.13, HC.t)
  // on the carrier: the EN button, the regulator, small parts
  F.block('silver', 0.17, 0.17, 0.05, -0.5, 0.15)
  F.post('black', 0.048, 0.05, -0.5, 0.15, 0.05)
  F.block('black', 0.16, 0.1, 0.05, -0.5, -0.07)
  for (const dx of [-0.05, 0, 0.05]) F.block('silver', 0.02, 0.05, 0.014, -0.5 + dx, -0.14)
  smd(F, 'tan', [[-0.36, 0.28]])
  smd(F, 'dark', [[-0.36, -0.28]])
  return F
}

/* LoRa: a radio can, a gold SMA socket and a tall rubber-duck antenna */
const LORA = { w: 1.3, h: 0.82, color: '#5b21b6' }
const SMA = { x: 0.4, z: FACE + 0.06 }
const DUCK = { base: LORA.h / 2 + 0.14, knuckle: LORA.h / 2 + 0.26, tip: LORA.h / 2 + 0.78 }

function loraParts() {
  const F = new Face()
  bottomHeader(F, 6, LORA.h)
  // the radio module: its own little board under a shield can, pads round it
  F.block('dark', 0.74, 0.62, 0.02, -0.2, 0.04)
  F.block('can', 0.64, 0.54, 0.08, -0.2, 0.04, 0.02)
  for (let i = 0; i < 8; i++) for (const side of [-1, 1]) F.flat('gold', 0.03, 0.05, -0.2 - 0.3 + 0.04 + i * 0.074, 0.04 + side * 0.29, 0.02)
  // the edge-mount SMA socket with its hex and thread, and the antenna on it
  const top = LORA.h / 2
  F.block('gold', 0.18, 0.16, 0.12, SMA.x, top - 0.04)
  F.rod('gold', 0.085, top + 0.04, top + 0.09, SMA.x, SMA.z, 0.085, 6)
  F.rod('gold', 0.058, top + 0.09, DUCK.base, SMA.x, SMA.z)
  F.rod('rubber', 0.078, DUCK.base, DUCK.knuckle, SMA.x, SMA.z, 0.078, 20)
  F.rod('grey', 0.07, DUCK.knuckle, DUCK.knuckle + 0.02, SMA.x, SMA.z, 0.07, 20)
  F.rod('rubber', 0.068, DUCK.knuckle + 0.02, DUCK.tip, SMA.x, SMA.z, 0.046, 20)
  F.add('rubber', new THREE.SphereGeometry(0.046, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(SMA.x, DUCK.tip, SMA.z))
  F.flat('gold', 0.03, 0.12, 0.25, 0.3)
  F.block('black', 0.16, 0.12, 0.05, 0.42, 0.08)
  for (const dx of [-0.05, 0, 0.05]) F.block('silver', 0.02, 0.05, 0.014, 0.42 + dx, 0.0)
  smd(F, 'tan', [
    [0.3, 0.12],
    [0.55, 0.12],
    [0.42, -0.1],
  ])
  hole(F, -0.56, -0.33)
  hole(F, 0.56, 0.33)
  return F
}

/* GPS: NEO-6M with a ceramic patch antenna and its backup cell */
const GPS = { w: 1.35, h: 0.95, color: '#1f4fbf' }

function gpsParts() {
  const F = new Face()
  bottomHeader(F, 4, GPS.h)
  F.block('can', 0.5, 0.52, 0.07, -0.33, 0.1)
  // the patch antenna: a beige ceramic tile with its silver feed dot
  F.block('beige', 0.5, 0.5, 0.1, 0.33, 0.1)
  F.post('silver', 0.038, 0.012, 0.37, 0.15, 0.1)
  // the backup coin cell keeps the almanac between power-ups
  F.post('silver', 0.1, 0.035, -0.5, -0.29, 0, 28)
  F.post('grey', 0.075, 0.003, -0.5, -0.29, 0.035, 28)
  F.flat('silk', 0.05, 0.012, -0.5, -0.29, 0.038)
  F.flat('silk', 0.012, 0.05, -0.5, -0.29, 0.038)
  F.block('black', 0.14, 0.1, 0.05, 0.08, -0.28)
  smd(F, 'tan', [
    [-0.2, -0.27],
    [0.26, -0.27],
  ])
  smd(F, 'dark', [[-0.08, -0.27]], Math.PI / 2)
  hole(F, -0.56, 0.37)
  hole(F, 0.56, 0.37)
  return F
}

/* CAN bus: MCP2515 controller and TJA1050 transceiver, a crystal, a two-screw H/L terminal */
const CAN = { w: 1.55, h: 0.95, color: '#1b4fae' }

function canParts() {
  const F = new Face()
  leftHeader(F, 7, CAN.w, 0.11)
  chip(F, -0.17, 0.2, 0.5, 0.26, 9, 2)
  chip(F, 0.28, -0.12, 0.26, 0.17, 4, 2)
  crystal(F, -0.24, -0.2)
  smd(F, 'tan', [
    [-0.47, -0.2],
    [-0.01, -0.2],
    [0.28, 0.12],
    [-0.47, 0.06],
  ], Math.PI / 2)
  smd(F, 'dark', [
    [0.12, 0.34],
    [0.12, -0.34],
  ])
  screwTerminal(F, 'greenTerminal', CAN.w / 2, 0.12, 2)
  // the 120 Ω terminator jumper
  F.block('black', 0.24, 0.12, 0.06, 0.6, -0.3)
  F.block('dark', 0.26, 0.13, 0.12, 0.6, -0.3, 0.06)
  hole(F, -0.6, 0.38)
  hole(F, -0.6, -0.38)
  return F
}

/* RS-485: MAX485 with a blue two-screw A/B terminal */
const RS485 = { w: 1.5, h: 0.62, color: '#3730a3' }

function rs485Parts() {
  const F = new Face()
  leftHeader(F, 4, RS485.w)
  chip(F, -0.18, 0.05, 0.3, 0.2, 4, 2)
  smd(F, 'dark', [
    [0.12, 0.12],
    [0.12, 0.0],
    [-0.45, -0.18],
  ], Math.PI / 2)
  smd(F, 'tan', [
    [0.24, 0.12],
    [-0.45, 0.2],
  ])
  screwTerminal(F, 'blueTerminal', RS485.w / 2, 0.05, 2)
  smd(F, 'tan', [[0.3, 0.2]])
  hole(F, -0.55, 0.22, 0.035)
  return F
}

const SPECS: Record<RadioType, Spec> = {
  gsm: {
    board: GSM,
    build: gsmParts,
    at: [-0.02, -0.1, 0],
    lights: [
      { role: 'net', at: [-0.4, 0.385], color: '#ff2d2d', off: RED_OFF },
      { role: 'power', at: [-0.26, 0.385], color: GREEN, off: GREEN_OFF },
    ],
    marks: [{ lines: ['SIM800L'], x: -0.2, y: 0.12, w: 0.44, h: 0.08, z: 0.08, color: '#52525b' }],
    waves: { at: [GSM_COIL.x, GSM_COIL.y + GSM_COIL.h * 0.62, GSM_COIL.z], color: '#f43f5e', axis: 0, both: true, spread: 0.95, radius: 0.48, repeat: 0.7 },
  },
  wifi: {
    board: WIFI,
    build: wifiParts,
    at: [0.12, -0.04, 0],
    lights: [
      { role: 'power', at: [-0.45, -0.24], color: POWER_RED, off: RED_OFF },
      { role: 'wifi', at: [-0.31, -0.24], color: '#3b82f6', off: '#bfdbfe' },
    ],
    marks: [{ lines: ['ESP8266EX'], x: -0.12, y: 0.06, w: 0.24, h: 0.04, z: 0.045, color: '#a1a1aa' }],
    waves: { at: [0.52, 0.32, FACE + 0.01], color: '#3b82f6', axis: Math.PI / 2, both: false, spread: 1.0, radius: 0.55 },
  },
  bluetooth: {
    board: BT,
    build: bluetoothParts,
    at: [0.1, -0.08, 0],
    lights: [
      { role: 'power', at: [-0.62, -0.25], color: GREEN, off: GREEN_OFF },
      { role: 'pair', at: [-0.48, -0.25], color: '#ff2d2d', off: RED_OFF },
    ],
    waves: { at: [HC.x + HC.w / 2 - 0.12, 0.22, FACE + HC.t + 0.01], color: '#0ea5e9', axis: Math.PI / 2, both: false, spread: 1.0, radius: 0.52 },
  },
  lora: {
    board: LORA,
    build: loraParts,
    at: [0.0, -0.28, 0],
    lights: [
      { role: 'power', at: [0.3, -0.24], color: POWER_RED, off: RED_OFF },
      { role: 'tx', at: [0.44, -0.24], color: GREEN, off: GREEN_OFF },
    ],
    marks: [{ lines: ['SX1278', 'LoRa 433'], x: -0.2, y: 0.06, w: 0.4, h: 0.15, z: 0.1, color: '#52525b' }],
    waves: { at: [SMA.x, (DUCK.knuckle + DUCK.tip) / 2 + 0.06, SMA.z], color: '#8b5cf6', axis: 0, both: true, spread: 0.95, radius: 0.5 },
  },
  gps: {
    board: GPS,
    build: gpsParts,
    at: [0.02, 0.1, 0],
    lights: [
      { role: 'tx', at: [0.42, -0.29], color: GREEN, off: GREEN_OFF },
      { role: 'power', at: [0.56, -0.29], color: POWER_RED, off: RED_OFF },
    ],
    marks: [{ lines: ['u-blox', 'NEO-6M'], x: -0.33, y: 0.1, w: 0.34, h: 0.15, z: 0.07, color: '#52525b' }],
  },
  canBus: {
    board: CAN,
    build: canParts,
    at: [0.1, 0.0, 0],
    lights: [
      { role: 'power', at: [0.2, 0.36], color: POWER_RED, off: RED_OFF },
      { role: 'busTx', at: [0.34, 0.36], color: GREEN, off: GREEN_OFF },
      { role: 'busRx', at: [0.48, 0.36], color: AMBER, off: AMBER_OFF },
    ],
    marks: [
      { lines: ['MCP2515'], x: -0.17, y: 0.2, w: 0.34, h: 0.07, z: 0.045, color: '#a1a1aa' },
      { lines: ['TJA1050'], x: 0.28, y: -0.12, w: 0.18, h: 0.045, z: 0.045, color: '#a1a1aa' },
      { lines: ['H'], x: 0.5, y: 0.22, w: 0.05, h: 0.07, z: 0, color: '#f1f5f9' },
      { lines: ['L'], x: 0.5, y: 0.02, w: 0.05, h: 0.07, z: 0, color: '#f1f5f9' },
    ],
  },
  rs485: {
    board: RS485,
    build: rs485Parts,
    at: [0.1, 0.05, 0],
    lights: [
      { role: 'power', at: [0.06, -0.2], color: POWER_RED, off: RED_OFF },
      { role: 'busTx', at: [0.2, -0.2], color: GREEN, off: GREEN_OFF },
      { role: 'busRx', at: [0.34, -0.2], color: AMBER, off: AMBER_OFF },
    ],
    marks: [
      { lines: ['MAX485'], x: -0.18, y: 0.05, w: 0.22, h: 0.06, z: 0.045, color: '#a1a1aa' },
      { lines: ['A'], x: 0.47, y: 0.15, w: 0.05, h: 0.07, z: 0, color: '#f1f5f9' },
      { lines: ['B'], x: 0.47, y: -0.05, w: 0.05, h: 0.07, z: 0, color: '#f1f5f9' },
    ],
  },
}

/* ---------------------------------------------------------------- pieces */

/** The static parts of one module, one merged mesh per material, freed when it goes away. */
function useParts(build: () => Face) {
  const meshes = useMemo(
    () => (Object.entries(build().parts) as [Mat, THREE.BufferGeometry[]][]).map(([mat, parts]) => ({ mat, geometry: merge(parts) })),
    [build],
  )
  useEffect(() => () => meshes.forEach(({ geometry }) => geometry.dispose()), [meshes])
  return meshes
}

/** A tiny SMD LED that follows `drive` (0..1, above 1 for an extra bright flash). */
function Lamp({ at, color, off, drive, speed }: { at: Vec2; color: string; off: string; drive: { current: number }; speed: number }) {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const lit = useRef(0)
  const glow = useRef(0)
  useFrame((_, dt) => {
    lit.current = damp(lit.current, Math.max(0, drive.current), speed, dt)
    if (material.current) material.current.emissiveIntensity = 0.03 + lit.current * 2.8
    glow.current = Math.min(1.3, lit.current) * 0.7
  })
  return (
    <>
      <mesh position={[at[0], at[1], FACE + 0.018]}>
        <boxGeometry args={[0.075, 0.045, 0.036]} />
        <meshStandardMaterial ref={material} color={off} emissive={color} emissiveIntensity={0.03} roughness={0.35} toneMapped={false} />
      </mesh>
      <Halo color={color} intensity={glow} position={[at[0], at[1], FACE + 0.08]} scale={0.45} />
    </>
  )
}

/** Laser marking on a chip or a can. */
function Marking({ lines, x, y, w, h, z, color = '#a1a1aa' }: NonNullable<Spec['marks']>[number]) {
  return (
    <mesh position={[x, y, FACE + z + 0.002]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={markingTexture(lines, w, h, color)} transparent roughness={0.5} depthWrite={false} />
    </mesh>
  )
}

/* ------------------------------------------------------------ radio rings */

/** how many rings can be in the air at once */
const SLOTS = 8
/** seconds a ring takes to reach its full size and fade */
const RING_LIFE = 0.9
/** each message sends three rings this far apart */
const RING_GAP = 0.13

const WAVE_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/* thin arcs drawn on a square: each slot holds one ring's age (0..1, below 0 for none) */
const WAVE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uAge[${SLOTS}];
uniform vec2 uAxis;
uniform float uBoth;
uniform float uSpread;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float d = length(p);
  float c = dot(p / max(d, 1e-4), uAxis);
  if (uBoth > 0.5) c = abs(c);
  float lobe = smoothstep(uSpread - 0.22, uSpread + 0.12, c);
  float a = 0.0;
  for (int i = 0; i < ${SLOTS}; i++) {
    float k = uAge[i];
    if (k <= 0.0 || k >= 1.0) continue;
    float r = mix(0.16, 0.97, k);
    float ring = 1.0 - smoothstep(0.012, 0.034, abs(d - r));
    a += ring * pow(1.0 - k, 1.4) * smoothstep(0.0, 0.1, k);
  }
  a = min(a, 1.0) * lobe * 0.65;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}
`

/**
 * Faint arcs that grow out of the antenna and fade, three for each message
 * (`tx` going high). While `tx` stays high (the SMS module sending a text)
 * another three follow every `repeat` seconds.
 */
function Waves({
  at,
  color,
  axis,
  both,
  spread,
  radius,
  repeat = Infinity,
  tx,
}: NonNullable<Spec['waves']> & { tx: boolean }) {
  const geometry = useMemo(() => new THREE.PlaneGeometry(radius * 2, radius * 2), [radius])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uAge: { value: Array.from({ length: SLOTS }, () => -1) },
          uAxis: { value: new THREE.Vector2(Math.cos(axis), Math.sin(axis)) },
          uBoth: { value: both ? 1 : 0 },
          uSpread: { value: Math.cos(spread) },
        },
        vertexShader: WAVE_VERTEX,
        fragmentShader: WAVE_FRAGMENT,
        transparent: true,
        depthWrite: false,
      }),
    [color, axis, both, spread],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])
  const mesh = useRef<THREE.Mesh>(null)
  const starts = useRef<number[]>([])
  const sending = useRef({ high: false, at: -Infinity })

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const s = sending.current
    if (tx && (!s.high || t - s.at >= repeat)) {
      for (let i = 0; i < 3; i++) starts.current.push(t + i * RING_GAP)
      s.at = t
    }
    s.high = tx
    starts.current = starts.current.filter((start) => t - start < RING_LIFE).slice(-SLOTS)
    const ages = material.uniforms.uAge.value as number[]
    for (let i = 0; i < SLOTS; i++) {
      const start = starts.current[i]
      ages[i] = start === undefined ? -1 : (t - start) / RING_LIFE
    }
    if (mesh.current) mesh.current.visible = starts.current.length > 0
  })

  return <mesh ref={mesh} geometry={geometry} material={material} position={at} renderOrder={6} visible={false} />
}

/* ------------------------------------------------------------------ model */

/** a short flash `on` seconds long at the start of every `period` */
const flash = (t: number, period: number, on: number) => ((((t % period) + period) % period) < on ? 1 : 0)

/** a steady random-looking on/off at `rate` changes a second, different for each `seed` */
function flicker(t: number, rate: number, seed: number) {
  const n = Math.sin((Math.floor(t * rate) + seed * 31.7) * 12.9898) * 43758.5453
  return n - Math.floor(n) > 0.4 ? 1 : 0
}

/** how fast each light follows its pattern: blinkers snap, the others ease */
const SPEED: Record<Role, number> = { power: 12, net: 45, wifi: 30, pair: 40, tx: 30, busTx: 40, busRx: 40 }

/**
 * A message module. `powered`: it has enough supply (the power light).
 * `linked`: it has joined its network, paired, has a GPS fix or the bus is
 * up. `tx`: a message is going out right now (for the GPS, its PPS pulse).
 */
export function RadioModel({ variant, powered, linked, tx }: { variant: RadioType; powered: boolean; linked: boolean; tx: boolean }) {
  const spec = SPECS[variant] ?? SPECS.gsm
  const parts = useParts(spec.build)
  const drives = useMemo(() => spec.lights.map(() => ({ current: 0 })), [spec])
  /** how busy a wired bus is: 1 while it sends, fading out after */
  const busy = useRef(0)
  const on = powered
  const joined = on && linked
  const sending = on && tx

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    busy.current = sending ? 1 : Math.max(0, busy.current - dt * 3)
    spec.lights.forEach((light, i) => {
      let v = 0
      if (on) {
        switch (light.role) {
          case 'power':
            v = 1
            break
          case 'net':
            // SIM800: a blink every 0.9 s while it looks for the network, every 3 s once it is on it,
            // and quick bright flashes while it sends
            v = sending ? flash(t, 0.3, 0.07) * 1.6 : joined ? flash(t, 3, 0.07) : flash(t, 0.9, 0.07)
            break
          case 'wifi':
            // blinks while it joins, then stays on and flickers with the data
            v = !joined ? flash(t, 0.5, 0.25) : busy.current > 0.05 ? 0.15 + 0.85 * flicker(t, 24, 1) : 1
            break
          case 'pair':
            // HC-05: fast blinking until paired, then a double blink every 2 s
            v = !joined ? flash(t, 0.2, 0.1) : flash(t, 2, 0.1) || flash(t - 0.3, 2, 0.1)
            break
          case 'tx':
            v = sending ? 1 : 0
            break
          case 'busTx':
            v = busy.current * flicker(t, 26, 2)
            break
          case 'busRx':
            v = busy.current * flicker(t, 22, 5)
            break
        }
      }
      drives[i].current = v
    })
  })

  const { board } = spec
  return (
    <group position={spec.at} rotation={MODULE_TILT}>
      <RoundedBox args={[board.w, board.h, BOARD_T]} radius={0.02} smoothness={2}>
        <meshStandardMaterial color={board.color} roughness={0.55} metalness={0.1} />
      </RoundedBox>
      {parts.map(({ mat, geometry }) => (
        <mesh key={mat} geometry={geometry}>
          <meshStandardMaterial {...MATERIALS[mat]} />
        </mesh>
      ))}
      {spec.marks?.map((mark) => <Marking key={mark.lines.join()} {...mark} />)}
      {spec.lights.map((light, i) => (
        <Lamp key={light.role} at={light.at} color={light.color} off={light.off} drive={drives[i]} speed={SPEED[light.role]} />
      ))}
      {spec.waves && <Waves {...spec.waves} tx={sending} />}
    </group>
  )
}
