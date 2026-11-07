import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { MeterDial } from '@/circuit/types'
import { DEG, Halo, damp } from '../helpers'
import { Lead } from './kit'
import { PRINT_FONT, printTexture } from './print'
import { METAL, merge, useBuilt } from './shared'

/*
 * A handheld digital multimeter lying on the bench in its yellow rubber boot:
 * the LCD at the top, the rotary dial in the middle, the two jacks at the
 * bottom with the probes plugged in and laid down on either side.
 */

const W = 1.72
const H = 2.3
const D = 0.46
/** the dark face panel, inside the boot's rim */
const FACE_W = W - 0.18
const FACE_H = H - 0.18
/** front plane of the face */
const ZF = D / 2 + 0.02
const LCD_Y = 0.6
const BEZEL: [number, number] = [1.44, 0.84]
const GLASS: [number, number] = [1.32, 0.66]
/** the HOLD and RANGE keys under the LCD */
const KEY_Y = 0.06
const DIAL_Y = -0.33
const KNOB_R = 0.28
const LEGEND_R = 0.48
const JACK_Y = -0.8
/** the little light that comes on with the beep */
const BEEP_AT: [number, number] = [0.6, -0.44]
const JACK_X = 0.32
const BOOT = '#f2b10a'
const FACE = '#2a2e35'

/** where the pointer sits for each dial position, counter-clockwise from straight up */
const DIAL_ANGLE: Record<MeterDial, number> = { volts: 70 * DEG, amps: 26 * DEG, ohms: -26 * DEG, beep: -70 * DEG }

/* ------------------------------------------------------------------ LCD */

const LCD_W = 576
const LCD_H = 288
/** digit cells: a sign cell, then four digits */
const SIGN_X = 14
const CELL_X = 50
const CELL_W = 90
const PITCH = 106
const DIGIT_Y = 44
const DIGIT_H = 198
const T = 16

const LIT = '#1a201b'
const GHOST = 'rgba(26, 38, 26, 0.075)'

const SEGMENTS: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  O: 'abcdef',
  L: 'def',
  '-': 'g',
}

/** One segment: a bar with pointed ends, lying (horizontal) or standing. */
function segment(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const t = T / 2
  ctx.moveTo(x0, y0)
  if (y0 === y1) {
    ctx.lineTo(x0 + t, y0 - t)
    ctx.lineTo(x1 - t, y0 - t)
    ctx.lineTo(x1, y0)
    ctx.lineTo(x1 - t, y0 + t)
    ctx.lineTo(x0 + t, y0 + t)
  } else {
    ctx.lineTo(x0 + t, y0 + t)
    ctx.lineTo(x0 + t, y1 - t)
    ctx.lineTo(x0, y1)
    ctx.lineTo(x0 - t, y1 - t)
    ctx.lineTo(x0 - t, y0 + t)
  }
  ctx.closePath()
}

/** Adds the segments of one digit cell to the current path. */
function digitPath(ctx: CanvasRenderingContext2D, x: number, segments: string) {
  const g = 2.5
  const t = T / 2
  const y = DIGIT_Y
  const mid = y + DIGIT_H / 2
  const left = x + t
  const right = x + CELL_W - t
  const at: Record<string, [number, number, number, number]> = {
    a: [left + g, y + t, right - g, y + t],
    g: [left + g, mid, right - g, mid],
    d: [left + g, y + DIGIT_H - t, right - g, y + DIGIT_H - t],
    f: [left, y + t + g, left, mid - g],
    b: [right, y + t + g, right, mid - g],
    e: [left, mid + g, left, y + DIGIT_H - t - g],
    c: [right, mid + g, right, y + DIGIT_H - t - g],
  }
  for (const s of segments) segment(ctx, ...at[s])
}

type Cell = { ch: string; point: boolean }

/** The reading laid out in four right-aligned cells; "OL" sits in the middle like a real meter. */
function layout(text: string): { minus: boolean; cells: Cell[] } {
  let body = text.trim()
  const minus = body.startsWith('-')
  if (minus) body = body.slice(1)
  const blank = (): Cell => ({ ch: ' ', point: false })
  if (body === 'OL') return { minus: false, cells: [blank(), { ch: 'O', point: false }, { ch: 'L', point: false }, blank()] }
  const cells: Cell[] = []
  for (const ch of body) {
    if (ch === '.') {
      if (!cells.length) cells.push({ ch: '0', point: false })
      cells[cells.length - 1].point = true
    } else cells.push({ ch, point: false })
  }
  const shown = cells.slice(0, 4)
  while (shown.length < 4) shown.unshift(blank())
  return { minus, cells: shown }
}

/** A small loudspeaker with two sound waves. */
function speakerIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath()
  ctx.moveTo(x, y - 6)
  ctx.lineTo(x + 7, y - 6)
  ctx.lineTo(x + 16, y - 13)
  ctx.lineTo(x + 16, y + 13)
  ctx.lineTo(x + 7, y + 6)
  ctx.lineTo(x, y + 6)
  ctx.closePath()
  ctx.fill()
  ctx.lineWidth = 3.5
  for (const r of [9, 16]) {
    ctx.beginPath()
    ctx.arc(x + 15, y, r, -0.8, 0.8)
    ctx.stroke()
  }
}

/** The continuity sign: a dot and three sound arcs, ·))) */
function continuityIcon(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.beginPath()
  ctx.arc(x, y, 3.6 * scale, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 3.4 * scale
  for (const r of [8, 14, 20]) {
    ctx.beginPath()
    ctx.arc(x, y, r * scale, -0.75, 0.75)
    ctx.stroke()
  }
}

/** The DC sign: a solid line over a dashed one. */
function dcIcon(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, thick: number) {
  ctx.fillRect(x, y - thick * 1.6, width, thick)
  const dash = (width - 8) / 3
  for (let i = 0; i < 3; i++) ctx.fillRect(x + i * (dash + 4), y + thick * 0.6, dash, thick)
}

function batteryIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.lineWidth = 3
  ctx.strokeRect(x, y - 8, 30, 16)
  ctx.fillRect(x + 30, y - 4, 4, 8)
  ctx.fillRect(x + 4, y - 4, 8, 8)
}

/** Draws the whole glass: grey-green background, faint ghosts of every segment, the dark reading on top. */
function drawLcd(ctx: CanvasRenderingContext2D, dial: MeterDial, text: string, unit: string, beep: boolean) {
  const bg = ctx.createLinearGradient(0, 0, 0, LCD_H)
  bg.addColorStop(0, '#a3af96')
  bg.addColorStop(0.45, '#b2bda4')
  bg.addColorStop(1, '#a8b49a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, LCD_W, LCD_H)

  const { minus, cells } = layout(text)
  const points = [0, 1, 2]
  const lit = (on: boolean) => {
    ctx.fillStyle = on ? LIT : GHOST
    ctx.strokeStyle = on ? LIT : GHOST
  }
  // ghosts first, flat
  ctx.save()
  ctx.transform(1, 0, -0.07, 1, 12, 0)
  lit(false)
  ctx.beginPath()
  for (let i = 0; i < 4; i++) digitPath(ctx, CELL_X + i * PITCH, SEGMENTS['8'])
  segment(ctx, SIGN_X, DIGIT_Y + DIGIT_H / 2, SIGN_X + 28, DIGIT_Y + DIGIT_H / 2)
  ctx.fill()
  for (const i of points) ctx.fillRect(CELL_X + i * PITCH + CELL_W + 3, DIGIT_Y + DIGIT_H - 15, 15, 15)
  ctx.restore()

  // the reading, with the soft shadow a real LCD casts on its mirror behind
  ctx.save()
  ctx.transform(1, 0, -0.07, 1, 12, 0)
  ctx.shadowColor = 'rgba(28, 40, 26, 0.32)'
  ctx.shadowOffsetX = 4
  ctx.shadowOffsetY = 5
  ctx.shadowBlur = 3
  lit(true)
  ctx.beginPath()
  cells.forEach(({ ch }, i) => {
    const segs = SEGMENTS[ch]
    if (segs) digitPath(ctx, CELL_X + i * PITCH, segs)
  })
  if (minus) segment(ctx, SIGN_X, DIGIT_Y + DIGIT_H / 2, SIGN_X + 28, DIGIT_Y + DIGIT_H / 2)
  ctx.fill()
  cells.forEach(({ point }, i) => {
    if (point && i < 3) ctx.fillRect(CELL_X + i * PITCH + CELL_W + 3, DIGIT_Y + DIGIT_H - 15, 15, 15)
  })

  // the unit, beside the last digit and sitting on the same line
  ctx.font = `700 54px ${PRINT_FONT}`
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  const room = LCD_W - 12 - (CELL_X + 4 * PITCH)
  const width = ctx.measureText(unit).width
  ctx.translate(CELL_X + 4 * PITCH, DIGIT_Y + DIGIT_H)
  if (width > room) ctx.scale(room / width, 1)
  ctx.fillText(unit, 0, 0)
  ctx.restore()

  // the little signs along the top: auto range, DC, continuity, beeping, battery
  const row = 24
  ctx.save()
  ctx.font = `700 22px ${PRINT_FONT}`
  ctx.textBaseline = 'middle'
  lit(true)
  ctx.fillText('AUTO', 22, row + 1)
  lit(dial === 'volts' || dial === 'amps')
  dcIcon(ctx, 104, row, 34, 4)
  lit(dial === 'beep')
  continuityIcon(ctx, 372, row, 0.9)
  lit(beep)
  speakerIcon(ctx, 420, row)
  lit(false)
  batteryIcon(ctx, 516, row)
  ctx.restore()

  // a bar graph under the digits, as long as the reading on a 2000-count scale
  const counts = Number(cells.map((c) => (/\d/.test(c.ch) ? c.ch : '')).join('')) || 0
  const bars = 40
  const on = text === 'OL' ? 0 : Math.min(bars, Math.round((counts / 2000) * bars))
  for (let i = 0; i < bars; i++) {
    lit(i < on)
    ctx.fillRect(40 + i * 12.6, 256 + (i % 5 === 0 ? -4 : 0), 8, i % 5 === 0 ? 15 : 11)
  }

  // the edge of the glass sits in the shade of the bezel
  const shade = ctx.createLinearGradient(0, 0, 0, 18)
  shade.addColorStop(0, 'rgba(20, 28, 18, 0.35)')
  shade.addColorStop(1, 'rgba(20, 28, 18, 0)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, LCD_W, 18)
  const side = ctx.createLinearGradient(0, 0, 14, 0)
  side.addColorStop(0, 'rgba(20, 28, 18, 0.25)')
  side.addColorStop(1, 'rgba(20, 28, 18, 0)')
  ctx.fillStyle = side
  ctx.fillRect(0, 0, 14, LCD_H)
}

function Lcd({ dial, text, unit, beep }: { dial: MeterDial; text: string; unit: string; beep: boolean }) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = LCD_W
    c.height = LCD_H
    return c
  }, [])
  // redrawn only when the reading changes; the old texture is freed
  const texture = useMemo(() => {
    const ctx = canvas.getContext('2d')
    if (ctx) drawLcd(ctx, dial, text, unit, beep)
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [canvas, dial, text, unit, beep])
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <group position={[0, LCD_Y, ZF]}>
      {/* the black frame around the glass */}
      <RoundedBox args={[BEZEL[0], BEZEL[1], 0.03]} radius={0.02} smoothness={2} position={[0, 0, 0.012]}>
        <meshStandardMaterial color="#141619" roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, -0.005, 0.0285]}>
        <planeGeometry args={GLASS} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* the clear window over it catches the light */}
      <mesh position={[0, -0.005, 0.031]}>
        <planeGeometry args={[GLASS[0] + 0.04, GLASS[1] + 0.04]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.07} roughness={0.08} metalness={0.3} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------ face print */

/** the printed part of the face, from under the LCD down to the bottom */
const PRINT_TOP = LCD_Y - BEZEL[1] / 2 - 0.01
const PRINT_BOTTOM = -FACE_H / 2 + 0.03
const PRINT_H = PRINT_TOP - PRINT_BOTTOM
const PRINT_W = FACE_W - 0.06
const PRINT_Y = (PRINT_TOP + PRINT_BOTTOM) / 2

function facePrint() {
  return printTexture('multimeter:face', PRINT_W, PRINT_H, (ctx, w, h) => {
    const ppu = w / PRINT_W
    const X = (u: number) => (u + PRINT_W / 2) * ppu
    const Y = (v: number) => (PRINT_TOP - v) * ppu
    const white = '#eef0f3'
    const grey = '#9aa1ab'
    ctx.clearRect(0, 0, w, h)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // the ring of the dial, with a mark at each stop
    ctx.strokeStyle = grey
    ctx.lineWidth = 0.012 * ppu
    ctx.beginPath()
    ctx.arc(X(0), Y(DIAL_Y), 0.37 * ppu, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = white
    ctx.lineWidth = 0.022 * ppu
    for (const a of Object.values(DIAL_ANGLE)) {
      ctx.beginPath()
      ctx.moveTo(X(-Math.sin(a) * 0.37), Y(DIAL_Y + Math.cos(a) * 0.37))
      ctx.lineTo(X(-Math.sin(a) * 0.42), Y(DIAL_Y + Math.cos(a) * 0.42))
      ctx.stroke()
    }

    // the four stops: V, A, Ω and the continuity beep
    ctx.fillStyle = white
    ctx.strokeStyle = white
    const big = 0.15 * ppu
    ctx.font = `700 ${big}px ${PRINT_FONT}`
    const at = (dial: MeterDial) => {
      const a = DIAL_ANGLE[dial]
      return [X(-Math.sin(a) * LEGEND_R), Y(DIAL_Y + Math.cos(a) * LEGEND_R)] as const
    }
    for (const dial of ['volts', 'amps'] as const) {
      const [x, y] = at(dial)
      ctx.fillText(dial === 'volts' ? 'V' : 'A', x - 0.035 * ppu, y)
      dcIcon(ctx, x + 0.035 * ppu, y - 0.012 * ppu, 0.08 * ppu, 0.014 * ppu)
    }
    {
      const [x, y] = at('ohms')
      ctx.fillText('Ω', x, y)
    }
    {
      const [x, y] = at('beep')
      continuityIcon(ctx, x - 0.05 * ppu, y, 0.0042 * ppu)
    }

    // the two buttons' names
    ctx.fillStyle = grey
    ctx.font = `700 ${0.05 * ppu}px ${PRINT_FONT}`
    ctx.fillText('HOLD', X(-0.56), Y(KEY_Y + 0.1))
    ctx.fillText('RANGE', X(0.56), Y(KEY_Y + 0.1))

    // the beep light's little speaker
    ctx.fillStyle = grey
    ctx.save()
    ctx.translate(X(BEEP_AT[0]), Y(BEEP_AT[1] - 0.1))
    ctx.scale(0.0026 * ppu, 0.0026 * ppu)
    ctx.strokeStyle = grey
    speakerIcon(ctx, -10, 0)
    ctx.restore()

    // the jacks' names, under them so the plugs do not hide them
    ctx.font = `700 ${0.075 * ppu}px ${PRINT_FONT}`
    ctx.fillStyle = white
    ctx.fillText('VΩA', X(-JACK_X), Y(JACK_Y - 0.19))
    ctx.fillText('COM', X(JACK_X), Y(JACK_Y - 0.19))
    // the warning triangle and the most it may measure, between the jacks
    ctx.strokeStyle = white
    ctx.lineWidth = 0.01 * ppu
    ctx.lineJoin = 'round'
    const tx = X(0)
    const ty = Y(JACK_Y + 0.07)
    const s = 0.07 * ppu
    ctx.beginPath()
    ctx.moveTo(tx, ty - s * 0.6)
    ctx.lineTo(tx + s * 0.62, ty + s * 0.48)
    ctx.lineTo(tx - s * 0.62, ty + s * 0.48)
    ctx.closePath()
    ctx.stroke()
    ctx.font = `800 ${0.05 * ppu}px ${PRINT_FONT}`
    ctx.fillText('!', tx, ty + s * 0.08)
    ctx.fillStyle = grey
    ctx.font = `700 ${0.04 * ppu}px ${PRINT_FONT}`
    ctx.fillText('600V MAX', tx, Y(JACK_Y - 0.04))
    ctx.fillText('CAT II', tx, Y(JACK_Y - 0.1))
  })
}

/* ---------------------------------------------------------------- pieces */

/** the boot's raised rim around the face, bevelled like moulded rubber */
function rimGeometry() {
  const rounded = <P extends THREE.Path>(shape: P, w: number, h: number, r: number) => {
    shape.moveTo(-w / 2 + r, -h / 2)
    shape.lineTo(w / 2 - r, -h / 2)
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
    shape.lineTo(w / 2, h / 2 - r)
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
    shape.lineTo(-w / 2 + r, h / 2)
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
    shape.lineTo(-w / 2, -h / 2 + r)
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
    return shape
  }
  const outer = rounded(new THREE.Shape(), W - 0.04, H - 0.04, 0.12)
  outer.holes.push(rounded(new THREE.Path(), FACE_W, FACE_H, 0.07))
  return new THREE.ExtrudeGeometry(outer, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 6 })
}

/** fine ridges around the edge of the dial knob, for grip */
function knurlGeometry() {
  const ridges: THREE.BufferGeometry[] = []
  const n = 36
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    ridges.push(new THREE.BoxGeometry(0.022, 0.03, 0.085).rotateZ(a).translate(Math.cos(a) * KNOB_R, Math.sin(a) * KNOB_R, 0))
  }
  return merge(ridges)
}

/** The black rotary knob: it springs round to its stop and settles with a small bounce, like a detent. */
function Knob({ dial }: { dial: MeterDial }) {
  const knurl = useBuilt(knurlGeometry)
  const knob = useRef<THREE.Group>(null)
  const angle = useRef(DIAL_ANGLE[dial])
  const speed = useRef(0)
  useFrame((_, dt) => {
    const target = DIAL_ANGLE[dial]
    // a stiff, lightly damped spring, stepped in small slices so it stays steady
    const step = Math.min(dt, 1 / 20) / 2
    for (let i = 0; i < 2; i++) {
      speed.current += ((target - angle.current) * 260 - speed.current * 17) * step
      angle.current += speed.current * step
    }
    if (Math.abs(target - angle.current) < 1e-4 && Math.abs(speed.current) < 1e-3) angle.current = target
    if (knob.current) knob.current.rotation.z = angle.current
  })
  return (
    <group position={[0, DIAL_Y, ZF]}>
      {/* the collar the knob turns in */}
      <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[KNOB_R + 0.05, KNOB_R + 0.06, 0.024, 48]} />
        <meshStandardMaterial color="#1b1d21" roughness={0.6} />
      </mesh>
      <group ref={knob}>
        <mesh position={[0, 0, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[KNOB_R - 0.015, KNOB_R, 0.09, 48]} />
          <meshStandardMaterial color="#1c1e22" roughness={0.42} />
        </mesh>
        <mesh geometry={knurl} position={[0, 0, 0.062]}>
          <meshStandardMaterial color="#111215" roughness={0.5} />
        </mesh>
        {/* the grip bar across the knob, and the white pointer on its end */}
        <RoundedBox args={[0.15, 0.56, 0.1]} radius={0.035} smoothness={3} position={[0, 0, 0.15]}>
          <meshStandardMaterial color="#3a3e45" roughness={0.36} metalness={0.1} />
        </RoundedBox>
        <mesh position={[0, 0.16, 0.201]}>
          <planeGeometry args={[0.035, 0.2]} />
          <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.35} roughness={0.4} />
        </mesh>
        <mesh position={[0, KNOB_R - 0.035, 0.111]} rotation={[0, 0, Math.PI / 2]}>
          <circleGeometry args={[0.03, 3]} />
          <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.25} />
        </mesh>
      </group>
    </group>
  )
}

/** A grey rubber key with a printed edge. */
function Key({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, ZF]}>
      <RoundedBox args={[0.27, 0.12, 0.05]} radius={0.02} smoothness={2} position={[0, 0, 0.02]}>
        <meshStandardMaterial color="#3d434c" roughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0, 0.046]}>
        <planeGeometry args={[0.2, 0.012]} />
        <meshStandardMaterial color="#8f97a3" roughness={0.6} />
      </mesh>
    </group>
  )
}

/** The little green light that comes on with the beep. */
function BeepLight({ beep }: { beep: boolean }) {
  const lens = useRef<THREE.MeshStandardMaterial>(null)
  const lit = useRef(beep ? 1 : 0)
  const glow = useRef(0)
  useFrame((_, dt) => {
    lit.current = damp(lit.current, beep ? 1 : 0, 18, dt)
    if (lens.current) lens.current.emissiveIntensity = 0.05 + lit.current * 2.6
    glow.current = lit.current * 0.8
  })
  return (
    <group position={[BEEP_AT[0], BEEP_AT[1], ZF]}>
      <mesh position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.058, 0.02, 24]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0, 0.018]} scale={[1, 1, 0.7]}>
        <sphereGeometry args={[0.04, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial ref={lens} color="#14532d" emissive="#4ade80" emissiveIntensity={0.05} roughness={0.25} toneMapped={false} />
      </mesh>
      <Halo color="#4ade80" intensity={glow} position={[0, 0, 0.07]} scale={0.5} />
    </group>
  )
}

/** A banana jack with its probe's right-angle plug pushed in; the plug's tail points to `side`. */
function Plug({ x, side, color, shroud }: { x: number; side: 1 | -1; color: string; shroud: string }) {
  const lift = 0.15
  return (
    <group position={[x, JACK_Y, ZF]}>
      {/* the jack's coloured collar on the face */}
      <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.125, 0.024, 32]} />
        <meshStandardMaterial color={shroud} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <ringGeometry args={[0.088, 0.1, 32]} />
        <meshStandardMaterial color="#09090b" roughness={0.8} />
      </mesh>
      {/* the plug: a straight shroud, a rounded elbow, then the tail and its strain relief */}
      <mesh position={[0, 0, lift / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.082, 0.086, lift, 24]} />
        <meshStandardMaterial color={color} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0, lift + 0.02]}>
        <sphereGeometry args={[0.082, 24, 16]} />
        <meshStandardMaterial color={color} roughness={0.42} />
      </mesh>
      <mesh position={[side * 0.12, 0, lift + 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.078, 0.082, 0.24, 24]} />
        <meshStandardMaterial color={color} roughness={0.42} />
      </mesh>
      {[0.07, 0.11, 0.15].map((r) => (
        <mesh key={r} position={[side * (0.12 + r), 0, lift + 0.02]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08 - r * 0.2, 0.08 - r * 0.2, 0.02, 20]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[side * 0.32, 0, lift + 0.02]} rotation={[0, 0, (-side * Math.PI) / 2]}>
        <cylinderGeometry args={[0.04, 0.066, 0.09, 20]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  )
}

/** probe lengths along its own axis, from the cable end */
const PROBE = { relief: 0.18, handle: 1.22, guard: 1.29, nose: 1.47, tip: 1.86 }

/** A test probe lying on the bench: cable relief, ribbed handle, finger guard and a steel point. */
function Probe({ at, angle, color, dark }: { at: [number, number, number]; angle: number; color: string; dark: string }) {
  return (
    <group position={at} rotation={[0, 0, angle]}>
      <mesh position={[0, PROBE.relief / 2, 0]}>
        <cylinderGeometry args={[0.062, 0.042, PROBE.relief, 20]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, (PROBE.relief + PROBE.handle) / 2, 0]}>
        <cylinderGeometry args={[0.078, 0.07, PROBE.handle - PROBE.relief, 24]} />
        <meshStandardMaterial color={color} roughness={0.42} />
      </mesh>
      {/* grip rings near the front */}
      {[0.74, 0.82, 0.9, 0.98, 1.06].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.081, 0.081, 0.028, 24]} />
          <meshStandardMaterial color={dark} roughness={0.6} />
        </mesh>
      ))}
      {/* the finger guard: fingers stay behind it */}
      <mesh position={[0, (PROBE.handle + PROBE.guard) / 2, 0]}>
        <cylinderGeometry args={[0.105, 0.125, PROBE.guard - PROBE.handle, 28]} />
        <meshStandardMaterial color={color} roughness={0.42} />
      </mesh>
      <mesh position={[0, (PROBE.guard + PROBE.nose) / 2, 0]}>
        <cylinderGeometry args={[0.036, 0.068, PROBE.nose - PROBE.guard, 20]} />
        <meshStandardMaterial color={color} roughness={0.42} />
      </mesh>
      {/* the steel point */}
      <mesh position={[0, (PROBE.nose + PROBE.tip) / 2, 0]}>
        <cylinderGeometry args={[0.016, 0.018, PROBE.tip - PROBE.nose, 12]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, PROBE.tip + 0.03, 0]}>
        <coneGeometry args={[0.016, 0.06, 12]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
    </group>
  )
}

/** The probes lie on the bench, a little lower than the meter's face. */
const BENCH_Z = -D / 2 + 0.085
const RED_PROBE = { at: [-1.13, -0.9, BENCH_Z] as [number, number, number], angle: 0.11 }
const BLACK_PROBE = { at: [1.15, -0.87, BENCH_Z] as [number, number, number], angle: -0.06 }

/** the cable from a plug's tail, over the boot's edge, down to the bench and round into its probe */
function cable(side: 1 | -1, probe: { at: [number, number, number]; angle: number }): [number, number, number][] {
  const [px, py, pz] = probe.at
  const back: [number, number, number] = [px + Math.sin(probe.angle) * 0.1, py - Math.cos(probe.angle) * 0.1, pz]
  return [
    [side * (JACK_X + 0.36), JACK_Y, ZF + 0.17],
    [side * 0.8, JACK_Y - 0.03, ZF + 0.12],
    [side * 0.95, JACK_Y - 0.09, 0.06],
    [side * 1.03, JACK_Y - 0.19, BENCH_Z + 0.01],
    [(side * 1.03 + back[0]) / 2 + side * 0.03, Math.min(back[1], JACK_Y - 0.19) - 0.06, BENCH_Z],
    [back[0], back[1] - 0.06, pz],
    [px, py + 0.02, pz],
  ]
}

const RED_CABLE = cable(-1, RED_PROBE)
const BLACK_CABLE = cable(1, BLACK_PROBE)

/* ------------------------------------------------------------------ model */

/**
 * A digital multimeter in a yellow boot. The LCD shows the reading with its
 * unit (and a little speaker while it beeps), the dial springs round to V, A,
 * Ω or the beep, and the red and black probes are plugged into VΩA and COM.
 */
export function MultimeterModel({
  dial,
  text,
  unit,
  beep,
}: {
  dial: MeterDial
  /** the digits, like "9.00", "-3.00", "220" or "OL" */
  text: string
  /** V, mA, A, Ω, kΩ or MΩ */
  unit: string
  /** the probes find a joined path while the dial is on the beep */
  beep: boolean
}) {
  const rim = useBuilt(rimGeometry)
  const print = facePrint()
  return (
    <group position={[0, 0.02, 0]} rotation={[-0.74, 0.14, 0]}>
      {/* the yellow boot, its raised rim and the moulding seam round its side */}
      <RoundedBox args={[W, H, D]} radius={0.1} smoothness={3}>
        <meshStandardMaterial color={BOOT} roughness={0.78} />
      </RoundedBox>
      <mesh geometry={rim} position={[0, 0, D / 2 - 0.02]}>
        <meshStandardMaterial color={BOOT} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[W + 0.004, H - 0.2, 0.012]} />
        <meshStandardMaterial color="#d99a06" roughness={0.85} />
      </mesh>
      {/* the dark face and its print */}
      <mesh position={[0, 0, ZF - 0.015]}>
        <boxGeometry args={[FACE_W + 0.02, FACE_H + 0.02, 0.03]} />
        <meshStandardMaterial color={FACE} roughness={0.62} />
      </mesh>
      <mesh position={[0, PRINT_Y, ZF + 0.001]}>
        <planeGeometry args={[PRINT_W, PRINT_H]} />
        <meshStandardMaterial map={print} transparent roughness={0.6} depthWrite={false} />
      </mesh>

      <Lcd dial={dial} text={text} unit={unit} beep={beep} />
      <Key x={-0.56} y={KEY_Y} />
      <Key x={0.56} y={KEY_Y} />
      <Knob dial={dial} />
      <BeepLight beep={beep} />

      {/* red VΩA on the left, black COM on the right, like the card's terminals */}
      <Plug x={-JACK_X} side={-1} color="#d32020" shroud="#b91c1c" />
      <Plug x={JACK_X} side={1} color="#25272c" shroud="#121316" />
      <Lead points={RED_CABLE} radius={0.04} color="#c81e1e" />
      <Lead points={BLACK_CABLE} radius={0.04} color="#28292e" />
      <Probe at={RED_PROBE.at} angle={RED_PROBE.angle} color="#d32020" dark="#991b1b" />
      <Probe at={BLACK_PROBE.at} angle={BLACK_PROBE.angle} color="#2a2c31" dark="#121317" />
    </group>
  )
}
