import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Halo, damp } from '../helpers'
import { PRINT_FONT, printTexture } from './print'

/*
 * The AI board: a dark board with one big "AI" chip in the middle and a ring
 * of tiny lights around it that run in circles while the model is thinking.
 * Six amber pin LEDs beside the right header show what each pin does, like on
 * the other boards; a microphone, a small speaker and a llama printed on the
 * board say it is the one you talk to.
 */

/** same lean as the other boards so they share one camera framing */
const TILT = 0.72
const W = 3.3
const D = 1.9
const T = 0.06
/** top surface of the board */
const TOP = T / 2
const PCB = '#1c1f2e'

const CHIP = { x: -0.08, z: 0, size: 0.84, h: 0.07 }
const RING = { count: 12, radius: 0.64 }
const PIN_LEDS = Array.from({ length: 6 }, (_, i) => -0.5 + i * 0.2)
const HEADER_X = 1.47
const PIN_LED_X = 1.2

type Box = { size: [number, number, number]; at: [number, number, number] }

function boxes(list: Box[]) {
  const parts = list.map(({ size, at }) => new THREE.BoxGeometry(...size).translate(...at))
  const merged = mergeGeometries(parts) ?? new THREE.BufferGeometry()
  parts.forEach((g) => g.dispose())
  return merged
}

function cylinders(list: { r: number; h: number; at: [number, number, number] }[]) {
  const parts = list.map(({ r, h, at }) => new THREE.CylinderGeometry(r, r, h, 24).translate(...at))
  const merged = mergeGeometries(parts) ?? new THREE.BufferGeometry()
  parts.forEach((g) => g.dispose())
  return merged
}

/** The small parts that never change, merged into one mesh per material. */
function buildStatic() {
  const black: Box[] = [
    // the right header: P1 … P6
    { size: [0.18, 0.15, 1.24], at: [HEADER_X, TOP + 0.075, 0] },
    // the left header: 5V, GND, IN
    { size: [0.18, 0.15, 0.64], at: [-HEADER_X, TOP + 0.075, 0] },
    // the chip
    { size: [CHIP.size, CHIP.h, CHIP.size], at: [CHIP.x, TOP + CHIP.h / 2 + 0.008, CHIP.z] },
  ]
  const holes: Box[] = [
    ...PIN_LEDS.map((z): Box => ({ size: [0.075, 0.004, 0.075], at: [HEADER_X, TOP + 0.152, z] })),
    ...[-0.2, 0, 0.2].map((z): Box => ({ size: [0.075, 0.004, 0.075], at: [-HEADER_X, TOP + 0.152, z] })),
    // the USB-C opening, facing out of the left edge
    { size: [0.006, 0.05, 0.2], at: [-1.665, TOP + 0.05, -0.62] },
  ]
  // silver legs on all four sides of the chip
  const legs: Box[] = []
  const n = 9
  for (let k = 0; k < n; k++) {
    const along = (k - (n - 1) / 2) * ((CHIP.size * 0.82) / n)
    const edge = CHIP.size / 2 + 0.03
    legs.push({ size: [0.03, 0.016, 0.07], at: [CHIP.x + along, TOP + 0.008, CHIP.z - edge] })
    legs.push({ size: [0.03, 0.016, 0.07], at: [CHIP.x + along, TOP + 0.008, CHIP.z + edge] })
    legs.push({ size: [0.07, 0.016, 0.03], at: [CHIP.x - edge, TOP + 0.008, CHIP.z + along] })
    legs.push({ size: [0.07, 0.016, 0.03], at: [CHIP.x + edge, TOP + 0.008, CHIP.z + along] })
  }
  const silver: Box[] = [
    ...legs,
    // USB-C socket on the left edge
    { size: [0.28, 0.1, 0.34], at: [-1.5, TOP + 0.05, -0.62] },
  ]
  // copper-coloured traces under the green-black mask, from the chip to the pin LEDs
  const traces: Box[] = PIN_LEDS.map((z): Box => {
    const from = CHIP.x + CHIP.size / 2 + 0.08
    const to = PIN_LED_X - 0.07
    return { size: [to - from, 0.003, 0.022], at: [(from + to) / 2, TOP + 0.0015, z] }
  })
  traces.push(
    ...[-0.2, 0, 0.2].map((z): Box => {
      const from = -HEADER_X + 0.12
      const to = CHIP.x - CHIP.size / 2 - 0.08
      return { size: [to - from, 0.003, 0.022], at: [(from + to) / 2, TOP + 0.0015, z] }
    }),
  )
  // little resistors and capacitors near the chip
  const tan: Box[] = [
    [0.62, -0.78],
    [0.78, -0.78],
    [-0.7, 0.78],
  ].map(([x, z]): Box => ({ size: [0.09, 0.03, 0.05], at: [x, TOP + 0.015, z] }))
  const dark: Box[] = [
    [-0.92, -0.78],
    [-0.78, -0.78],
    [0.55, 0.8],
  ].map(([x, z]): Box => ({ size: [0.09, 0.03, 0.05], at: [x, TOP + 0.015, z] }))
  const mounts = [
    [-1.48, -0.78],
    [-1.48, 0.78],
    [1.48, -0.8],
    [1.48, 0.8],
  ] as const
  return {
    black: boxes(black),
    holes: boxes(holes),
    silver: boxes(silver),
    traces: boxes(traces),
    tan: boxes(tan),
    dark: boxes(dark),
    pads: cylinders([
      ...mounts.map(([x, z]) => ({ r: 0.075, h: 0.004, at: [x, TOP + 0.002, z] as [number, number, number] })),
      // the microphone's can and the speaker's rim
      { r: 0.085, h: 0.07, at: [0.82, TOP + 0.035, -0.66] },
      { r: 0.19, h: 0.03, at: [0.82, TOP + 0.015, 0.62] },
    ]),
    pits: cylinders([
      ...mounts.map(([x, z]) => ({ r: 0.04, h: T + 0.01, at: [x, 0, z] as [number, number, number] })),
      // the microphone's hole and the speaker's cone
      { r: 0.032, h: 0.004, at: [0.82, TOP + 0.072, -0.66] },
      { r: 0.15, h: 0.004, at: [0.82, TOP + 0.032, 0.62] },
    ]),
  }
}

/** "AI" on the chip, with a pin-1 dot and a small type number. */
function chipPrint() {
  return printTexture('ai-board:chip', CHIP.size * 0.92, CHIP.size * 0.92, (ctx, w, h) => {
    ctx.fillStyle = '#d8d2ff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `800 ${h * 0.42}px ${PRINT_FONT}`
    ctx.fillText('AI', w / 2, h * 0.47)
    ctx.fillStyle = '#9ea3b5'
    ctx.font = `600 ${h * 0.09}px ${PRINT_FONT}`
    ctx.fillText('LLM · 1', w / 2, h * 0.8)
    ctx.beginPath()
    ctx.arc(w * 0.12, h * 0.12, w * 0.035, 0, Math.PI * 2)
    ctx.fill()
  })
}

/** A llama printed on the board in cream silkscreen, with a speech bubble: this board listens. */
function llamaPrint() {
  return printTexture('ai-board:llama', 0.62, 0.46, (ctx, w) => {
    const s = w / 124
    ctx.save()
    ctx.scale(s, s)
    ctx.fillStyle = '#e9dfc8'
    ctx.strokeStyle = '#e9dfc8'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    // body and fluffy back
    ctx.beginPath()
    ctx.moveTo(14, 52)
    ctx.bezierCurveTo(12, 40, 22, 36, 34, 37)
    ctx.lineTo(56, 37)
    ctx.bezierCurveTo(62, 37, 64, 33, 64, 26)
    ctx.lineTo(64, 12)
    // head and snout
    ctx.bezierCurveTo(64, 6, 68, 4, 72, 5)
    ctx.lineTo(79, 7)
    ctx.bezierCurveTo(84, 8, 84, 14, 79, 15)
    ctx.lineTo(74, 15)
    ctx.lineTo(74, 38)
    ctx.bezierCurveTo(74, 50, 70, 58, 62, 60)
    ctx.lineTo(22, 60)
    ctx.bezierCurveTo(17, 60, 14, 57, 14, 52)
    ctx.closePath()
    ctx.fill()
    // ears
    ctx.beginPath()
    ctx.moveTo(65, 7)
    ctx.lineTo(64, -1)
    ctx.lineTo(69, 5)
    ctx.moveTo(69, 5)
    ctx.lineTo(70, -2)
    ctx.lineTo(73, 5)
    ctx.fill()
    // tail
    ctx.beginPath()
    ctx.arc(14, 44, 4, 0, Math.PI * 2)
    ctx.fill()
    // four legs
    ctx.lineWidth = 5.5
    for (const x of [21, 31, 56, 66]) {
      ctx.beginPath()
      ctx.moveTo(x, 58)
      ctx.lineTo(x, 80)
      ctx.stroke()
    }
    // the eye, cut out of the head
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(71, 9.5, 1.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
    // a speech bubble with three dots
    ctx.lineWidth = 2.6
    ctx.beginPath()
    ctx.roundRect(88, 4, 34, 22, 7)
    ctx.moveTo(94, 26)
    ctx.lineTo(89, 33)
    ctx.lineTo(101, 26)
    ctx.stroke()
    for (const x of [97, 105, 113]) {
      ctx.beginPath()
      ctx.arc(x, 15, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  })
}

/** One of the tiny lights in the ring around the chip. */
const RING_COLOR = '#b9a8ff'

const unit = (v: number) => THREE.MathUtils.clamp(Number.isFinite(v) ? v : 0, 0, 1)

/** A tiny LED lying on the board, following `level` (0..1), with its glow just above it. */
function SmdLed({ x, z, level, color, off }: { x: number; z: number; level: number; color: string; off: string }) {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const lit = useRef(unit(level))
  const glow = useRef(0)
  useFrame((_, dt) => {
    lit.current = damp(lit.current, unit(level), 16, dt)
    if (material.current) material.current.emissiveIntensity = 0.02 + lit.current * 3
    glow.current = lit.current * 0.7
  })
  return (
    <>
      <mesh position={[x, TOP + 0.018, z]}>
        <boxGeometry args={[0.08, 0.035, 0.06]} />
        <meshStandardMaterial ref={material} color={off} emissive={color} emissiveIntensity={0.02} roughness={0.35} toneMapped={false} />
      </mesh>
      <Halo color={color} intensity={glow} position={[x, TOP + 0.08, z]} scale={0.5} />
    </>
  )
}

/**
 * One of the tiny lights around the chip. While the board thinks, one bright
 * light runs around the ring about once a second with a fading tail behind it.
 */
function RingLed({ index, busy }: { index: number; busy: { current: number } }) {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const glow = useRef(0)
  const a = (index / RING.count) * Math.PI * 2 - Math.PI / 2
  useFrame(({ clock }) => {
    const head = (clock.elapsedTime * 1.1) % 1
    const behind = (head - index / RING.count + 1) % 1
    const lit = busy.current * (0.08 + 0.92 * (1 - behind) ** 5)
    if (material.current) material.current.emissiveIntensity = 0.02 + lit * 3
    glow.current = lit * 0.55
  })
  return (
    <group position={[CHIP.x + Math.cos(a) * RING.radius, TOP + 0.014, CHIP.z + Math.sin(a) * RING.radius]}>
      <mesh rotation={[0, -a, 0]}>
        <boxGeometry args={[0.05, 0.028, 0.08]} />
        <meshStandardMaterial ref={material} color="#77719a" emissive={RING_COLOR} emissiveIntensity={0.02} roughness={0.35} toneMapped={false} />
      </mesh>
      <Halo color={RING_COLOR} intensity={glow} position={[0, 0.06, 0]} scale={0.42} />
    </group>
  )
}

export function AiBoardModel({
  levels,
  powered,
  thinking,
}: {
  /** output level 0..1 of the six pins P1 … P6 */
  levels: number[]
  powered: boolean
  /** the model is working out an answer: the ring runs in circles */
  thinking: boolean
}) {
  const geometry = useMemo(() => buildStatic(), [])
  useEffect(() => () => Object.values(geometry).forEach((g) => g.dispose()), [geometry])
  const chipTexture = useMemo(() => chipPrint(), [])
  const llamaTexture = useMemo(() => llamaPrint(), [])

  const chipMaterial = useRef<THREE.MeshStandardMaterial>(null)
  // 0 … 1: how much the ring is running, eased in and out
  const busy = useRef(0)

  useFrame(({ clock }, dt) => {
    busy.current = damp(busy.current, thinking ? 1 : 0, 5, dt)
    // the letters glow softly while it thinks
    if (chipMaterial.current) chipMaterial.current.emissiveIntensity = busy.current * (0.55 + 0.25 * Math.sin(clock.elapsedTime * 5))
  })

  return (
    <group position={[0, -0.02, 0]} rotation={[TILT, 0, 0]}>
      <RoundedBox args={[W, T, D]} radius={0.03} smoothness={2}>
        <meshStandardMaterial color={PCB} roughness={0.55} metalness={0.1} />
      </RoundedBox>
      <mesh geometry={geometry.traces}>
        <meshStandardMaterial color="#343a55" roughness={0.6} />
      </mesh>
      <mesh geometry={geometry.black}>
        <meshStandardMaterial color="#141417" roughness={0.5} />
      </mesh>
      <mesh geometry={geometry.holes}>
        <meshStandardMaterial color="#030303" roughness={0.9} />
      </mesh>
      <mesh geometry={geometry.silver}>
        <meshStandardMaterial color="#d9dde3" roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh geometry={geometry.tan}>
        <meshStandardMaterial color="#c8a27a" roughness={0.55} />
      </mesh>
      <mesh geometry={geometry.dark}>
        <meshStandardMaterial color="#2a2a2e" roughness={0.5} />
      </mesh>
      <mesh geometry={geometry.pads}>
        <meshStandardMaterial color="#c9b26a" roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh geometry={geometry.pits}>
        <meshStandardMaterial color="#08080a" roughness={0.9} />
      </mesh>

      {/* the print on the chip */}
      <mesh position={[CHIP.x, TOP + CHIP.h + 0.0085, CHIP.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CHIP.size * 0.92, CHIP.size * 0.92]} />
        <meshStandardMaterial
          ref={chipMaterial}
          map={chipTexture}
          emissiveMap={chipTexture}
          emissive="#c4b5fd"
          emissiveIntensity={0}
          transparent
          depthWrite={false}
          roughness={0.6}
          toneMapped={false}
        />
      </mesh>

      {/* the llama */}
      <mesh position={[-1.02, TOP + 0.002, 0.56]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.62, 0.46]} />
        <meshStandardMaterial map={llamaTexture} transparent depthWrite={false} roughness={0.7} />
      </mesh>

      {/* the ring of thinking lights */}
      {Array.from({ length: RING.count }, (_, k) => (
        <RingLed key={k} index={k} busy={busy} />
      ))}

      {/* what each pin does right now */}
      {PIN_LEDS.map((z, i) => (
        <SmdLed key={i} x={PIN_LED_X} z={z} level={levels[i] ?? 0} color="#ffa31a" off="#fde9b8" />
      ))}
      <SmdLed x={-1.16} z={-0.62} level={powered ? 1 : 0} color="#22c55e" off="#e5e7eb" />
    </group>
  )
}
