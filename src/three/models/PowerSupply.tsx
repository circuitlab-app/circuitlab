import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { DEG, damp } from '../helpers'
import { Indicator } from './kit'
import { METAL } from './shared'

const W = 2.6
const H = 1.45
const D = 1.0
const FRONT = D / 2
const DISPLAY_Y = 0.3
const ROW_Y = -0.33

/* --------------------------------------------------- seven-segment readout */

const DIGITS: Record<string, string> = {
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
  ' ': '',
}

const CANVAS_W = 512
const CANVAS_H = 128
const CELL_W = 38
const CELL_H = 76
const BAR = 9
const PITCH = 46

/** One bar of a digit with pointed ends, horizontal or upright. */
function bar(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const t = BAR / 2
  ctx.beginPath()
  if (y0 === y1) {
    ctx.moveTo(x0, y0)
    ctx.lineTo(x0 + t, y0 - t)
    ctx.lineTo(x1 - t, y0 - t)
    ctx.lineTo(x1, y0)
    ctx.lineTo(x1 - t, y0 + t)
    ctx.lineTo(x0 + t, y0 + t)
  } else {
    ctx.moveTo(x0, y0)
    ctx.lineTo(x0 + t, y0 + t)
    ctx.lineTo(x0 + t, y1 - t)
    ctx.lineTo(x0, y1)
    ctx.lineTo(x0 - t, y1 - t)
    ctx.lineTo(x0 - t, y0 + t)
  }
  ctx.closePath()
  ctx.fill()
}

function digit(ctx: CanvasRenderingContext2D, x: number, y: number, segments: string) {
  const g = 2
  const t = BAR / 2
  const mid = y + CELL_H / 2
  const left = x + t
  const right = x + CELL_W - t
  const all: Record<string, [number, number, number, number]> = {
    a: [left + g, y + t, right - g, y + t],
    g: [left + g, mid, right - g, mid],
    d: [left + g, y + CELL_H - t, right - g, y + CELL_H - t],
    f: [left, y + t + g, left, mid - g],
    b: [right, y + t + g, right, mid - g],
    e: [left, mid + g, left, y + CELL_H - t - g],
    c: [right, mid + g, right, y + CELL_H - t - g],
  }
  for (const s of segments) bar(ctx, ...all[s])
}

/** "12.00" style: the text's digits, with a point after `point` of them. */
function readout(ctx: CanvasRenderingContext2D, x: number, text: string, unit: string, lit: string, ghost: string) {
  const chars = text.replace('.', '')
  const point = text.indexOf('.')
  const y = (CANVAS_H - CELL_H) / 2
  ctx.save()
  // real readouts lean a little
  ctx.transform(1, 0, -0.07, 1, 6, 0)
  ctx.fillStyle = ghost
  for (let i = 0; i < 4; i++) digit(ctx, x + i * PITCH, y, DIGITS['8'])
  ctx.fillStyle = lit
  ctx.shadowColor = lit
  ctx.shadowBlur = 10
  ;[...chars].forEach((c, i) => digit(ctx, x + i * PITCH, y, DIGITS[c] ?? ''))
  if (point > 0) ctx.fillRect(x + point * PITCH - 6, y + CELL_H - BAR, BAR, BAR)
  ctx.restore()
  ctx.save()
  ctx.fillStyle = lit
  ctx.shadowColor = lit
  ctx.shadowBlur = 8
  ctx.font = '700 40px ui-sans-serif, system-ui, sans-serif'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(unit, x + 4 * PITCH + 4, y + CELL_H)
  ctx.restore()
}

/** Volts in red, amps in green, like most bench power supplies. Blank while switched off. */
function drawPanel(ctx: CanvasRenderingContext2D, volts: string, amps: string, on: boolean) {
  ctx.fillStyle = '#07090a'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.fillStyle = '#121518'
  ctx.fillRect(CANVAS_W / 2 - 1, 14, 2, CANVAS_H - 28)
  readout(ctx, 14, on ? volts : '    ', 'V', on ? '#ff4b3e' : '#2a0d0b', '#2a0d0b')
  readout(ctx, CANVAS_W / 2 + 12, on ? amps : '    ', 'A', on ? '#3dff8a' : '#0b2a16', '#0b2a16')
}

function panelTexture(volts: string, amps: string, on: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d')
  if (ctx) drawPanel(ctx, volts, amps, on)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

const formatVolts = (v: number) => {
  const clamped = THREE.MathUtils.clamp(v, 0, 99.99)
  return clamped.toFixed(2).padStart(5, ' ')
}
const formatAmps = (a: number) => THREE.MathUtils.clamp(a, 0, 9.999).toFixed(3)

/* ------------------------------------------------------------------ model */

function Knob({ x, radius, angle }: { x: number; radius: number; angle: number }) {
  const knob = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (knob.current) knob.current.rotation.z = damp(knob.current.rotation.z, angle, 10, dt)
  })
  return (
    <group position={[x, ROW_Y, FRONT + 0.01]}>
      <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius + 0.035, radius + 0.035, 0.03, 32]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <group ref={knob} position={[0, 0, 0.09]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[radius * 0.92, radius, 0.12, 28]} />
          <meshStandardMaterial color="#1f2329" roughness={0.4} />
        </mesh>
        <mesh position={[0, radius * 0.5, 0.062]}>
          <boxGeometry args={[0.025, radius * 0.75, 0.005]} />
          <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.25} />
        </mesh>
      </group>
    </group>
  )
}

function Post({ x, color, cap }: { x: number; color: string; cap: string }) {
  return (
    <group position={[x, ROW_Y, FRONT + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.05, 6]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.085, 0.1, 0.16, 24]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.23, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.05, 24]} />
        <meshStandardMaterial color={cap} roughness={0.35} />
      </mesh>
    </group>
  )
}

/**
 * A bench power supply: the readout shows the volts it gives and the amps
 * flowing out, the knobs turn with its settings, and the CC light comes on
 * while it is holding the current at its limit.
 */
export function PowerSupplyModel({
  on,
  volts,
  amps,
  setting,
  limit,
  limiting,
}: {
  /** the simulation runs, so the supply is switched on */
  on: boolean
  /** measured output */
  volts: number
  amps: number
  /** the voltage knob, 0..1 */
  setting: number
  /** the current knob, 0..1 */
  limit: number
  limiting: boolean
}) {
  const v = formatVolts(volts)
  const a = formatAmps(Math.max(0, amps))
  // a small new texture each time the numbers change (at most a few times a second)
  const texture = useMemo(() => panelTexture(v, a, on), [v, a, on])
  useEffect(() => () => texture.dispose(), [texture])

  // the knobs sweep 270°, from pointing down-left to down-right
  const sweep = (share: number) => (135 - 270 * THREE.MathUtils.clamp(share, 0, 1)) * DEG

  return (
    <group position={[0, -0.02, 0]} rotation={[0.1, -0.32, 0]}>
      <RoundedBox args={[W, H, D]} radius={0.06} smoothness={3}>
        <meshStandardMaterial color="#2f353e" roughness={0.5} metalness={0.25} />
      </RoundedBox>
      {/* the light front panel */}
      <mesh position={[0, 0, FRONT + 0.005]}>
        <boxGeometry args={[W - 0.12, H - 0.12, 0.01]} />
        <meshStandardMaterial color="#d6dae0" roughness={0.45} metalness={0.3} />
      </mesh>
      {/* the readout behind its dark glass */}
      <mesh position={[0, DISPLAY_Y, FRONT + 0.02]}>
        <boxGeometry args={[2.1, 0.6, 0.02]} />
        <meshStandardMaterial color="#111316" roughness={0.3} />
      </mesh>
      <mesh position={[0, DISPLAY_Y, FRONT + 0.032]}>
        <planeGeometry args={[1.98, 0.495]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <Knob x={-0.86} radius={0.17} angle={sweep(setting)} />
      <Knob x={-0.4} radius={0.14} angle={sweep(limit)} />
      {/* CV: steady volts, CC: holding the current limit */}
      <Indicator position={[0.07, -0.22, FRONT + 0.025]} color="#22c55e" off="#bbf7d0" level={on && !limiting ? 1 : 0} size={[0.09, 0.06, 0.03]} halo={0.4} />
      <Indicator position={[0.07, -0.44, FRONT + 0.025]} color="#ef4444" off="#fecaca" level={on && limiting ? 1 : 0} size={[0.09, 0.06, 0.03]} halo={0.45} />
      <Post x={0.55} color="#dc2626" cap="#ef4444" />
      <Post x={0.95} color="#18181b" cap="#27272a" />
      {/* rubber feet */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.25), -H / 2 - 0.025, sz * (D / 2 - 0.18)]}>
            <cylinderGeometry args={[0.09, 0.09, 0.05, 16]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
        )),
      )}
    </group>
  )
}
