import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type ReactNode, type Ref } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Halo, Smoke, damp } from '../helpers'

export type SensorProps = {
  /** 0..1: what the sensor feels (heat, distance, motion, loudness, smoke, moisture, touch) */
  sense: number
  /** 0..1: the module's output signal right now */
  level: number
  /** the module has supply */
  powered: boolean
}

export const BOARD_T = 0.05
export const FACE = BOARD_T / 2
export const PITCH = 0.126
const UP = new THREE.Vector3(0, 1, 0)
/** modules lean back a little and turn to show their edge */
const MODULE_TILT: [number, number, number] = [-0.3, 0.25, 0]

const metal = { color: '#d4d4d8', metalness: 0.9, roughness: 0.25 } as const
/** for big metal faces: without an environment map full metalness looks black */
const brushed = { color: '#d9dde3', metalness: 0.5, roughness: 0.32 } as const
const silk = { color: '#f1f5f9', roughness: 0.7 } as const
const chip = { color: '#1a1a1c', roughness: 0.45 } as const

const unit = (v: number) => THREE.MathUtils.clamp(Number.isFinite(v) ? v : 0, 0, 1)

/* ---------------------------------------------------------------- shared */

function merge(parts: THREE.BufferGeometry[]) {
  const merged = mergeGeometries(parts) ?? new THREE.BufferGeometry()
  parts.forEach((g) => g.dispose())
  return merged
}

/** Geometry built once per model and freed when the model unmounts. */
function useGeometry(build: () => THREE.BufferGeometry) {
  const geometry = useMemo(() => build(), [build])
  useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}

/** A woven grid of thin bars clipped to a circle: microphone and sensor meshes. */
function meshDisc(radius: number, pitch: number, bar: number) {
  const parts: THREE.BufferGeometry[] = []
  for (let p = -radius + pitch / 2; p < radius; p += pitch) {
    const half = Math.sqrt(Math.max(0, radius * radius - p * p))
    if (half < bar) continue
    parts.push(new THREE.BoxGeometry(2 * half, bar, 0.004).translate(0, p, 0))
    parts.push(new THREE.BoxGeometry(bar, 2 * half, 0.004).translate(p, 0, 0))
  }
  return merge(parts)
}

const eyeGrid = () => meshDisc(0.28, 0.05, 0.008)
const micGrid = () => meshDisc(0.16, 0.04, 0.008)
const gasGrid = () => meshDisc(0.3, 0.05, 0.01)

/** A straight wire between two points. */
export function Wire({ from, to, radius = 0.018, color = metal.color }: { from: THREE.Vector3; to: THREE.Vector3; radius?: number; color?: string }) {
  const direction = to.clone().sub(from)
  const length = direction.length()
  const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, direction.normalize())
  return (
    <mesh position={from.clone().add(to).multiplyScalar(0.5)} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial color={color} metalness={0.9} roughness={0.25} />
    </mesh>
  )
}

/** A tiny SMD LED on a board face. */
function SmdLed({ x, y, off, color, material }: { x: number; y: number; off: string; color: string; material: Ref<THREE.MeshStandardMaterial> }) {
  return (
    <mesh position={[x, y, FACE + 0.018]}>
      <boxGeometry args={[0.075, 0.045, 0.036]} />
      <meshStandardMaterial ref={material} color={off} emissive={color} emissiveIntensity={0.03} roughness={0.35} toneMapped={false} />
    </mesh>
  )
}

/**
 * The little PCB every sensor module is built on: a right-angle pin header
 * along one edge, a red power LED and a green signal LED. Its face is at
 * z = FACE; whatever the module carries is passed as children.
 */
export function ModuleBoard({
  width,
  height,
  color,
  pins = 3,
  header = 'bottom',
  leds,
  powered,
  level,
  children,
}: {
  width: number
  height: number
  color: string
  pins?: number
  header?: 'top' | 'bottom'
  /** where the power LED and the signal LED sit */
  leds: [[number, number], [number, number]]
  powered: boolean
  level: number
  children?: ReactNode
}) {
  const power = useRef(powered ? 1 : 0)
  const signal = useRef(unit(level))
  const powerMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const signalMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const powerGlow = useRef(0)
  const signalGlow = useRef(0)

  useFrame((_, dt) => {
    power.current = damp(power.current, powered ? 1 : 0, 12, dt)
    signal.current = damp(signal.current, unit(level), 14, dt)
    if (powerMaterial.current) powerMaterial.current.emissiveIntensity = 0.03 + power.current * 2.6
    if (signalMaterial.current) signalMaterial.current.emissiveIntensity = 0.03 + signal.current * 2.8
    powerGlow.current = power.current * 0.6
    signalGlow.current = signal.current * 0.65
  })

  const side = header === 'bottom' ? -1 : 1
  const edge = (side * height) / 2
  const pinX = Array.from({ length: pins }, (_, i) => (i - (pins - 1) / 2) * PITCH)

  return (
    <group>
      <RoundedBox args={[width, height, BOARD_T]} radius={0.02} smoothness={2}>
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} />
      </RoundedBox>
      {/* right-angle header: black spacer on the edge, gold pins sticking out past it */}
      <mesh position={[0, edge - side * 0.05, FACE + 0.05]}>
        <boxGeometry args={[pins * PITCH, 0.1, 0.1]} />
        <meshStandardMaterial color="#18181b" roughness={0.6} />
      </mesh>
      {pinX.map((x) => (
        <group key={x}>
          <mesh position={[x, edge + side * 0.1, FACE + 0.05]}>
            <boxGeometry args={[0.035, 0.34, 0.035]} />
            <meshStandardMaterial color="#e5c76b" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[x, edge - side * 0.15, FACE + 0.002]}>
            <boxGeometry args={[0.05, 0.014, 0.004]} />
            <meshStandardMaterial {...silk} />
          </mesh>
        </group>
      ))}
      <SmdLed x={leds[0][0]} y={leds[0][1]} off="#fecaca" color="#ef4444" material={powerMaterial} />
      <SmdLed x={leds[1][0]} y={leds[1][1]} off="#bbf7d0" color="#22c55e" material={signalMaterial} />
      <Halo color="#f87171" intensity={powerGlow} position={[leds[0][0], leds[0][1], FACE + 0.08]} scale={0.45} />
      <Halo color="#4ade80" intensity={signalGlow} position={[leds[1][0], leds[1][1], FACE + 0.08]} scale={0.45} />
      {children}
    </group>
  )
}

/* ----------------------------------------------------------- temperature */

const TO92_R = 0.2
const TO92_FLAT = 0.075
const TO92_H = 0.32
const TO92_BEVEL = 0.02
const TEMP_X = -0.15
const TEMP_LEG_TOP = 0.42
const TEMP_BODY_Y = TEMP_LEG_TOP + TO92_BEVEL + TO92_H / 2
const TEMP_AXIS_Z = FACE + 0.13
const TEMP_BAR_X = -0.48
const TEMP_BAR_W = 0.7
const TEMP_BAR_Y = -0.03
const COLD = new THREE.Color('#60a5fa')
const HOT = new THREE.Color('#ef4444')

/** Small TO-92 "D" body standing upright, flat face toward +z. */
function to92Geometry() {
  const w = Math.sqrt(TO92_R * TO92_R - TO92_FLAT * TO92_FLAT)
  const a = Math.atan2(TO92_FLAT, w)
  const shape = new THREE.Shape()
  shape.moveTo(-w, TO92_FLAT)
  shape.lineTo(w, TO92_FLAT)
  shape.absarc(0, 0, TO92_R, a, Math.PI - a, true)
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: TO92_H,
    bevelEnabled: true,
    bevelThickness: TO92_BEVEL,
    bevelSize: TO92_BEVEL,
    bevelSegments: 2,
    curveSegments: 20,
  })
  g.translate(0, 0, -TO92_H / 2)
  g.rotateX(Math.PI / 2)
  return g
}

/** Wavy lines of warm air either side of the sensor. */
function shimmerGeometry() {
  const lines = [TEMP_X - 0.33, TEMP_X + 0.33].map((x) => {
    const points = Array.from({ length: 24 }, (_, i) => {
      const t = i / 23
      return new THREE.Vector3(x + Math.sin(t * Math.PI * 5) * 0.025, TEMP_LEG_TOP - 0.06 + t * 0.36, TEMP_AXIS_Z)
    })
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, 0.008, 4)
  })
  return merge(lines)
}

/** Temperature module: the sensor glows from cool blue to hot red, with a bar gauge underneath. */
export function TempSensorModel({ sense, level, powered }: SensorProps) {
  const body = useGeometry(to92Geometry)
  const shimmer = useGeometry(shimmerGeometry)
  const heat = useRef(unit(sense))
  const bodyMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const fill = useRef<THREE.Mesh>(null)
  const fillMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const shimmerMesh = useRef<THREE.Mesh>(null)
  const shimmerMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const coldGlow = useRef(0)
  const warmGlow = useRef(0)
  const tint = useMemo(() => new THREE.Color(), [])

  useFrame(({ clock }, dt) => {
    heat.current = damp(heat.current, unit(sense), 4, dt)
    const h = heat.current
    tint.lerpColors(COLD, HOT, h)
    if (bodyMaterial.current) {
      bodyMaterial.current.emissive.copy(tint)
      bodyMaterial.current.emissiveIntensity = 0.05 + h * 0.35
    }
    coldGlow.current = (1 - h) * 0.15
    warmGlow.current = h * 0.65
    const f = fill.current
    if (f) {
      f.scale.x = Math.max(0.001, h * TEMP_BAR_W)
      f.position.x = TEMP_BAR_X + (h * TEMP_BAR_W) / 2
    }
    if (fillMaterial.current) {
      fillMaterial.current.color.copy(tint)
      fillMaterial.current.emissive.copy(tint)
    }
    const hot = THREE.MathUtils.clamp((h - 0.55) * 2, 0, 0.7)
    if (shimmerMaterial.current) shimmerMaterial.current.opacity = hot
    if (shimmerMesh.current) {
      shimmerMesh.current.visible = hot > 0.01
      shimmerMesh.current.position.y = Math.sin(clock.elapsedTime * 3) * 0.012
    }
  })

  return (
    <group position={[0, -0.03, 0]} rotation={MODULE_TILT}>
      <group position={[0, -0.12, 0]}>
        <ModuleBoard width={1.3} height={0.62} color="#4338ca" leds={[[0.44, 0.1], [0.44, -0.06]]} powered={powered} level={level}>
          {/* the sensor, its legs bent into the board */}
          <mesh geometry={body} position={[TEMP_X, TEMP_BODY_Y, TEMP_AXIS_Z]}>
            <meshStandardMaterial ref={bodyMaterial} color="#1c1c1f" roughness={0.42} metalness={0.1} emissive={COLD} emissiveIntensity={0.05} />
          </mesh>
          <mesh position={[TEMP_X, TEMP_BODY_Y + 0.06, TEMP_AXIS_Z + TO92_FLAT + TO92_BEVEL + 0.002]}>
            <boxGeometry args={[0.22, 0.026, 0.004]} />
            <meshStandardMaterial color="#d4d4d8" roughness={0.7} />
          </mesh>
          {[-0.1, 0, 0.1].map((dx) => (
            <group key={dx}>
              <Wire from={new THREE.Vector3(TEMP_X + dx, TEMP_LEG_TOP + 0.02, TEMP_AXIS_Z)} to={new THREE.Vector3(TEMP_X + dx, 0.16, TEMP_AXIS_Z)} />
              <Wire from={new THREE.Vector3(TEMP_X + dx, 0.16, TEMP_AXIS_Z)} to={new THREE.Vector3(TEMP_X + dx, 0.16, FACE)} />
              <mesh position={[TEMP_X + dx, 0.16, FACE + 0.003]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.006, 12]} />
                <meshStandardMaterial {...metal} />
              </mesh>
            </group>
          ))}
          {/* bar gauge: blue end cold, red end hot */}
          {[
            { size: [TEMP_BAR_W + 0.03, 0.012], at: [TEMP_BAR_X + TEMP_BAR_W / 2, TEMP_BAR_Y + 0.05] },
            { size: [TEMP_BAR_W + 0.03, 0.012], at: [TEMP_BAR_X + TEMP_BAR_W / 2, TEMP_BAR_Y - 0.05] },
            { size: [0.012, 0.11], at: [TEMP_BAR_X - 0.015, TEMP_BAR_Y] },
            { size: [0.012, 0.11], at: [TEMP_BAR_X + TEMP_BAR_W + 0.015, TEMP_BAR_Y] },
          ].map(({ size, at }, i) => (
            <mesh key={i} position={[at[0], at[1], FACE + 0.002]}>
              <boxGeometry args={[size[0], size[1], 0.004]} />
              <meshStandardMaterial {...silk} />
            </mesh>
          ))}
          <mesh ref={fill} position={[TEMP_BAR_X, TEMP_BAR_Y, FACE + 0.004]}>
            <boxGeometry args={[1, 0.07, 0.006]} />
            <meshStandardMaterial ref={fillMaterial} color={COLD} emissive={COLD} emissiveIntensity={0.5} roughness={0.5} toneMapped={false} />
          </mesh>
          {[
            [TEMP_BAR_X - 0.08, '#60a5fa'],
            [TEMP_BAR_X + TEMP_BAR_W + 0.08, '#ef4444'],
          ].map(([x, color]) => (
            <mesh key={color} position={[x as number, TEMP_BAR_Y, FACE + 0.004]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.006, 12]} />
              <meshStandardMaterial color={color as string} roughness={0.5} />
            </mesh>
          ))}
          <mesh ref={shimmerMesh} geometry={shimmer} visible={false} renderOrder={3}>
            <meshBasicMaterial ref={shimmerMaterial} color="#fdba74" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
          <Halo color="#93c5fd" intensity={coldGlow} position={[TEMP_X, TEMP_BODY_Y, TEMP_AXIS_Z + 0.25]} scale={1.2} />
          <Halo color="#f97316" intensity={warmGlow} position={[TEMP_X, TEMP_BODY_Y, TEMP_AXIS_Z + 0.25]} scale={1.3} />
        </ModuleBoard>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------ ultrasonic */

const EYE_X = 0.56
const EYE_Y = 0.05
const EYE_DEPTH = 0.3
const ECHO_NEAR = 0.25
const ECHO_FAR = 1.15

/** One silver transducer can with its dark mesh face. */
function Eye({ x, grid }: { x: number; grid: THREE.BufferGeometry }) {
  return (
    <group position={[x, EYE_Y, FACE]}>
      <mesh position={[0, 0, EYE_DEPTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.34, 0.34, EYE_DEPTH, 32, 1, true]} />
        <meshStandardMaterial {...brushed} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, EYE_DEPTH]}>
        <torusGeometry args={[0.325, 0.022, 8, 32]} />
        <meshStandardMaterial {...brushed} />
      </mesh>
      <mesh position={[0, 0, EYE_DEPTH - 0.06]}>
        <circleGeometry args={[0.33, 32]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      <mesh geometry={grid} position={[0, 0, EYE_DEPTH - 0.055]}>
        <meshStandardMaterial color="#6b7280" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}

/** HC-SR04: two "eyes" ping a toy block; the block sits as far away as the measured distance. */
export function UltrasonicModel({ sense, level, powered }: SensorProps) {
  const grid = useGeometry(eyeGrid)
  const block = useRef<THREE.Mesh>(null)
  const waves = useRef<(THREE.Mesh | null)[]>([])
  const distance = useRef(unit(sense))

  useFrame((_, dt) => {
    distance.current = damp(distance.current, unit(sense), 5, dt)
    const d = THREE.MathUtils.lerp(ECHO_NEAR, ECHO_FAR, distance.current)
    if (block.current) block.current.position.z = FACE + EYE_DEPTH + d + 0.17
    // two wave fronts spaced evenly between the eyes and the block
    waves.current.forEach((w, i) => {
      if (w) w.position.z = FACE + EYE_DEPTH + (d * (i + 1)) / 3
    })
  })

  return (
    <group position={[-0.29, 0.04, 0]} rotation={[-0.25, 0.75, 0]} scale={0.9}>
      <ModuleBoard width={1.9} height={0.85} color="#2563eb" pins={4} leds={[[-0.08, -0.25], [0.08, -0.25]]} powered={powered} level={level}>
        <Eye x={-EYE_X} grid={grid} />
        <Eye x={EYE_X} grid={grid} />
        {/* crystal and a couple of SMD parts between the eyes */}
        <mesh position={[0, 0.24, FACE + 0.04]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.5]}>
          <capsuleGeometry args={[0.065, 0.2, 4, 16]} />
          <meshStandardMaterial {...brushed} />
        </mesh>
        {[-0.09, 0.09].map((x) => (
          <mesh key={x} position={[x, 0.02, FACE + 0.012]}>
            <boxGeometry args={[0.08, 0.04, 0.024]} />
            <meshStandardMaterial color="#c8a27a" roughness={0.55} />
          </mesh>
        ))}
        {/* the block being measured and the sound between */}
        {[0, 1].map((i) => (
          <mesh
            key={i}
            ref={(m) => {
              waves.current[i] = m
            }}
            position={[0, EYE_Y, FACE + EYE_DEPTH + 0.2 * (i + 1)]}
            renderOrder={3}
          >
            <torusGeometry args={[0.2 + i * 0.07, 0.012, 6, 32]} />
            <meshBasicMaterial color="#93c5fd" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
        ))}
        <RoundedBox ref={block} args={[0.34, 0.34, 0.34]} radius={0.04} smoothness={2} position={[0, EYE_Y, FACE + EYE_DEPTH + ECHO_NEAR + 0.17]}>
          <meshStandardMaterial color="#f59e0b" roughness={0.45} />
        </RoundedBox>
      </ModuleBoard>
    </group>
  )
}

/* ------------------------------------------------------------------- PIR */

const DOME_X = -0.15

/** HC-SR501 motion sensor: a faceted white dome that pulses when it sees movement. */
export function PirModel({ sense, level, powered }: SensorProps) {
  const dome = useRef<THREE.MeshStandardMaterial>(null)
  const ripple = useRef<THREE.Mesh>(null)
  const rippleMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const motion = useRef(unit(sense))
  const glow = useRef(0)

  useFrame((_, dt) => {
    motion.current = damp(motion.current, unit(sense), 6, dt)
    const m = motion.current
    if (dome.current) dome.current.emissiveIntensity = m * 0.5
    glow.current = m * 0.4
    if (ripple.current) {
      ripple.current.visible = m > 0.02
      ripple.current.scale.setScalar(1 + m * 0.2)
    }
    if (rippleMaterial.current) rippleMaterial.current.opacity = m * 0.6
  })

  return (
    <group position={[0, 0.1, 0]} rotation={MODULE_TILT} scale={0.88}>
      <ModuleBoard width={1.5} height={1.06} color="#15803d" leds={[[0.58, 0.1], [0.58, -0.06]]} powered={powered} level={level}>
        <RoundedBox args={[0.96, 0.96, 0.08]} radius={0.03} smoothness={2} position={[DOME_X, 0, FACE + 0.04]}>
          <meshStandardMaterial color="#f5f5f4" roughness={0.5} />
        </RoundedBox>
        <mesh position={[DOME_X, 0, FACE + 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[0.42, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial ref={dome} color="#fafaf9" roughness={0.45} flatShading emissive="#fb7185" emissiveIntensity={0} />
        </mesh>
        <mesh ref={ripple} position={[DOME_X, 0, FACE + 0.09]} visible={false} renderOrder={3}>
          <torusGeometry args={[0.44, 0.014, 6, 40]} />
          <meshBasicMaterial ref={rippleMaterial} color="#fda4af" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <Halo color="#fda4af" intensity={glow} position={[DOME_X, 0, FACE + 0.5]} scale={1.4} />
      </ModuleBoard>
    </group>
  )
}

/* ----------------------------------------------------------------- sound */

const MIC_X = -0.52
const MIC_Y = 0.02
const MIC_DEPTH = 0.26
const RING_THRESHOLDS = [0.15, 0.4, 0.65]
const BAR_COLORS = ['#22c55e', '#22c55e', '#eab308', '#f97316', '#ef4444']

function lm393Legs() {
  return merge(
    [-1, 1].flatMap((side) =>
      [0, 1, 2, 3].map((i) => new THREE.BoxGeometry(0.03, 0.05, 0.02).translate(0.45 - 0.105 + i * 0.07, 0.14 + side * 0.1, FACE + 0.01)),
    ),
  )
}

/** Sound module: an electret microphone that sends out rings and fills a level bar when it is loud. */
export function SoundSensorModel({ sense, level, powered }: SensorProps) {
  const grid = useGeometry(micGrid)
  const legs = useGeometry(lm393Legs)
  const loud = useRef(unit(sense))
  const rings = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const bars = useRef<(THREE.MeshStandardMaterial | null)[]>([])

  useFrame((_, dt) => {
    // quick to rise, a little slower to fall, like a VU meter
    const target = unit(sense)
    loud.current = damp(loud.current, target, target > loud.current ? 14 : 5, dt)
    const l = loud.current
    rings.current.forEach((m, i) => {
      if (m) m.opacity = THREE.MathUtils.clamp((l - RING_THRESHOLDS[i]) * 3, 0, 1) * 0.8
    })
    bars.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = THREE.MathUtils.clamp(l * BAR_COLORS.length - i, 0, 1) * 2.2
    })
  })

  return (
    <group position={[0.02, 0.04, 0]} rotation={MODULE_TILT}>
      <ModuleBoard width={1.7} height={0.7} color="#0f766e" pins={4} leds={[[0.4, -0.2], [0.56, -0.2]]} powered={powered} level={level}>
        {/* microphone capsule */}
        <group position={[MIC_X, MIC_Y, FACE]}>
          <mesh position={[0, 0, MIC_DEPTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, MIC_DEPTH, 32]} />
            <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0, MIC_DEPTH + 0.001]}>
            <circleGeometry args={[0.17, 32]} />
            <meshStandardMaterial color="#52525b" roughness={0.9} />
          </mesh>
          <mesh geometry={grid} position={[0, 0, MIC_DEPTH + 0.004]}>
            <meshStandardMaterial color="#0a0a0a" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, MIC_DEPTH]}>
            <torusGeometry args={[0.185, 0.016, 8, 32]} />
            <meshStandardMaterial color="#27272a" metalness={0.5} roughness={0.35} />
          </mesh>
          {RING_THRESHOLDS.map((_, i) => (
            <mesh key={i} position={[0, 0, MIC_DEPTH + 0.01]} renderOrder={3}>
              <torusGeometry args={[0.27 + i * 0.07, 0.012, 6, 40]} />
              <meshBasicMaterial
                ref={(m) => {
                  rings.current[i] = m
                }}
                color="#a5f3fc"
                transparent
                opacity={0}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
        {/* blue multi-turn trimmer with its brass screw */}
        <mesh position={[-0.02, 0.06, FACE + 0.1]}>
          <boxGeometry args={[0.36, 0.34, 0.2]} />
          <meshStandardMaterial color="#2563eb" roughness={0.4} />
        </mesh>
        <mesh position={[0.08, 0.255, FACE + 0.1]}>
          <cylinderGeometry args={[0.045, 0.045, 0.05, 12]} />
          <meshStandardMaterial color="#d6a84a" metalness={0.85} roughness={0.3} />
        </mesh>
        {/* comparator chip */}
        <mesh position={[0.45, 0.14, FACE + 0.025]}>
          <boxGeometry args={[0.3, 0.16, 0.05]} />
          <meshStandardMaterial {...chip} />
        </mesh>
        <mesh geometry={legs}>
          <meshStandardMaterial {...metal} />
        </mesh>
        {/* level bar */}
        {BAR_COLORS.map((color, i) => (
          <mesh key={i} position={[0.74, -0.2 + i * 0.1, FACE + 0.01]}>
            <boxGeometry args={[0.08, 0.07, 0.02]} />
            <meshStandardMaterial
              ref={(m) => {
                bars.current[i] = m
              }}
              color="#1f2937"
              emissive={color}
              emissiveIntensity={0}
              roughness={0.4}
              toneMapped={false}
            />
          </mesh>
        ))}
      </ModuleBoard>
    </group>
  )
}

/* ------------------------------------------------------------------- gas */

const GAS_X = -0.18
const GAS_Y = 0.02
const GAS_BASE = 0.08
const GAS_CAN = 0.34

/** MQ-2 gas sensor: a steel mesh can on a brown base that glows and puffs smoke when it smells some. */
export function GasSensorModel({ sense, level, powered }: SensorProps) {
  const grid = useGeometry(gasGrid)
  const core = useRef<THREE.MeshStandardMaterial>(null)
  const smoke = useRef(unit(sense))
  const glow = useRef(0)

  useFrame((_, dt) => {
    smoke.current = damp(smoke.current, unit(sense), 5, dt)
    // the heater is always a little warm while powered
    const warm = smoke.current * 0.8 + (powered ? 0.15 : 0)
    if (core.current) core.current.emissiveIntensity = warm * 1.6
    glow.current = smoke.current * 0.55
  })

  return (
    <group position={[0.02, 0.09, 0]} rotation={MODULE_TILT} scale={0.92}>
      <ModuleBoard width={1.5} height={0.95} color="#1e40af" pins={4} leds={[[0.55, 0.22], [0.55, 0.06]]} powered={powered} level={level}>
        <group position={[GAS_X, GAS_Y, FACE]}>
          <mesh position={[0, 0, GAS_BASE / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.38, 0.38, GAS_BASE, 32]} />
            <meshStandardMaterial color="#9a3412" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, GAS_BASE + (GAS_CAN - 0.02) / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, GAS_CAN - 0.02, 24]} />
            <meshStandardMaterial ref={core} color="#27272a" roughness={0.8} emissive="#f97316" emissiveIntensity={0} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, GAS_BASE + GAS_CAN / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.33, 0.33, GAS_CAN, 20, 3, true]} />
            <meshStandardMaterial {...metal} wireframe />
          </mesh>
          {[GAS_BASE + 0.01, GAS_BASE + GAS_CAN].map((z) => (
            <mesh key={z} position={[0, 0, z]}>
              <torusGeometry args={[0.33, 0.022, 8, 32]} />
              <meshStandardMaterial {...brushed} />
            </mesh>
          ))}
          <mesh geometry={grid} position={[0, 0, GAS_BASE + GAS_CAN]}>
            <meshStandardMaterial {...brushed} />
          </mesh>
          <Halo color="#fb923c" intensity={glow} position={[0, 0, GAS_BASE + GAS_CAN + 0.1]} scale={1.3} />
          <Smoke active={sense > 0.3} position={[0, 0.25, GAS_BASE + GAS_CAN + 0.05]} rise={0.4} color="#9ca3af" />
        </group>
        {/* comparator chip */}
        <mesh position={[0.5, -0.2, FACE + 0.025]}>
          <boxGeometry args={[0.3, 0.16, 0.05]} />
          <meshStandardMaterial {...chip} />
        </mesh>
      </ModuleBoard>
    </group>
  )
}

/* ------------------------------------------------------------------ soil */

const DRY = new THREE.Color('#c9a46a')
const WET = new THREE.Color('#3f2a1a')
const SOIL_Y = -0.46
const SOIL_H = 0.36
const SOIL_TOP = SOIL_Y + SOIL_H / 2
const HEAD_Y = 0.32
const PEBBLES: [number, number, number][] = [
  [-0.55, 0.22, 0.04],
  [-0.32, -0.25, 0.03],
  [0.05, 0.28, 0.035],
  [0.42, -0.2, 0.045],
  [0.6, 0.18, 0.03],
  [-0.05, -0.3, 0.03],
]
const DROPS: [number, number][] = [
  [-0.42, 0.05],
  [0.36, 0.12],
  [0.12, -0.22],
]

/** Soil moisture probe: a two-prong fork in a block of soil that darkens as it gets wet. */
export function SoilSensorModel({ sense, level, powered }: SensorProps) {
  const soil = useRef<THREE.MeshStandardMaterial>(null)
  const drops = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const moisture = useRef(unit(sense))
  const glint = useRef(0)

  useFrame((_, dt) => {
    moisture.current = damp(moisture.current, unit(sense), 4, dt)
    const m = moisture.current
    const s = soil.current
    if (s) {
      s.color.lerpColors(DRY, WET, m)
      s.roughness = 1 - m * 0.45
    }
    drops.current.forEach((d) => {
      if (d) d.opacity = THREE.MathUtils.clamp((m - 0.4) * 2, 0, 0.85)
    })
    glint.current = Math.max(0, m - 0.5) * 1.2
  })

  return (
    <group position={[0, 0.03, 0]} rotation={[0.35, -0.3, 0]}>
      {/* soil block with a few pebbles and, when wet, water drops */}
      <RoundedBox args={[1.5, SOIL_H, 0.8]} radius={0.06} smoothness={2} position={[0, SOIL_Y, 0]}>
        <meshStandardMaterial ref={soil} color={DRY} roughness={1} />
      </RoundedBox>
      {PEBBLES.map(([x, z, r]) => (
        <mesh key={`${x}${z}`} position={[x, SOIL_TOP + r * 0.3, z]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[r, 10, 8]} />
          <meshStandardMaterial color="#7c5a3a" roughness={0.9} />
        </mesh>
      ))}
      {DROPS.map(([x, z], i) => (
        <mesh key={i} position={[x, SOIL_TOP + 0.012, z]} scale={[1, 0.45, 1]}>
          <sphereGeometry args={[0.045, 14, 10]} />
          <meshStandardMaterial
            ref={(m) => {
              drops.current[i] = m
            }}
            color="#60a5fa"
            transparent
            opacity={0}
            roughness={0.05}
            metalness={0.1}
            depthWrite={false}
          />
        </mesh>
      ))}
      <Halo color="#93c5fd" intensity={glint} position={[DROPS[1][0], SOIL_TOP + 0.05, DROPS[1][1]]} scale={0.8} />

      {/* the fork: two nickel-plated prongs pushed into the soil */}
      {[-0.24, 0.24].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, -0.27, 0]}>
            <boxGeometry args={[0.17, 0.78, BOARD_T]} />
            <meshStandardMaterial color="#1e293b" roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.27, FACE + 0.002]}>
            <boxGeometry args={[0.1, 0.72, 0.004]} />
            <meshStandardMaterial {...brushed} />
          </mesh>
        </group>
      ))}
      <group position={[0, HEAD_Y, 0]}>
        <ModuleBoard width={0.86} height={0.4} color="#1e293b" header="top" leds={[[-0.3, -0.08], [0.3, -0.08]]} powered={powered} level={level}>
          <mesh position={[0, -0.06, FACE + 0.002]}>
            <boxGeometry args={[0.3, 0.024, 0.004]} />
            <meshStandardMaterial {...silk} />
          </mesh>
        </ModuleBoard>
      </group>
    </group>
  )
}

/* ----------------------------------------------------------------- touch */

const PAD_Y = 0.1
const PAD_R = 0.27
const FINGER_R = 0.14
const FINGER_L = 0.26
const FINGER_LIFT = 0.3
/** the finger comes in from the upper right, toward the pad */
const FINGER_DIR = new THREE.Vector3(0.35, 0.5, 0.8).normalize()
const FINGER_TURN = new THREE.Quaternion().setFromUnitVectors(UP, FINGER_DIR)

/** TTP223 touch module: a fingertip presses onto the round pad and the pad lights up. */
export function TouchSensorModel({ sense, level, powered }: SensorProps) {
  const finger = useRef<THREE.Group>(null)
  const pad = useRef<THREE.MeshStandardMaterial>(null)
  const touch = useRef(unit(sense))
  const glow = useRef(0)

  useFrame((_, dt) => {
    touch.current = damp(touch.current, unit(sense), 9, dt)
    const t = touch.current
    if (finger.current) finger.current.position.y = (1 - t) * FINGER_LIFT
    if (pad.current) pad.current.emissiveIntensity = t * 1.1
    glow.current = t * 0.6
  })

  return (
    <group position={[0, 0.02, 0]} rotation={[-0.15, 0.25, 0]}>
      <ModuleBoard width={1.1} height={0.9} color="#dc2626" leds={[[0.3, -0.28], [0.44, -0.28]]} powered={powered} level={level}>
        {/* round pad with its silkscreen ring */}
        <mesh position={[0, PAD_Y, FACE + 0.005]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[PAD_R, PAD_R, 0.01, 40]} />
          <meshStandardMaterial ref={pad} color="#f87171" roughness={0.35} metalness={0.2} emissive="#7dd3fc" emissiveIntensity={0} />
        </mesh>
        <mesh position={[0, PAD_Y, FACE + 0.004]} scale={[1, 1, 0.2]}>
          <torusGeometry args={[PAD_R + 0.03, 0.014, 6, 40]} />
          <meshStandardMaterial {...silk} />
        </mesh>
        {/* the TTP223 chip */}
        <mesh position={[-0.38, -0.28, FACE + 0.02]}>
          <boxGeometry args={[0.12, 0.08, 0.04]} />
          <meshStandardMaterial {...chip} />
        </mesh>
        <Halo color="#7dd3fc" intensity={glow} position={[0, PAD_Y, FACE + 0.12]} scale={1.2} />

        {/* the fingertip: slides along its own length onto the pad */}
        <group position={[0, PAD_Y, FACE + 0.01]} quaternion={FINGER_TURN}>
          <group ref={finger} position={[0, FINGER_LIFT, 0]}>
            <mesh position={[0, FINGER_R + FINGER_L / 2, 0]}>
              <capsuleGeometry args={[FINGER_R, FINGER_L, 8, 20]} />
              <meshStandardMaterial color="#f1c19c" roughness={0.6} />
            </mesh>
            <mesh position={[0, FINGER_R + 0.07, FINGER_R * 0.82]} scale={[0.8, 1.15, 0.3]}>
              <sphereGeometry args={[0.1, 16, 12]} />
              <meshStandardMaterial color="#fbd5c8" roughness={0.25} />
            </mesh>
          </group>
        </group>
      </ModuleBoard>
    </group>
  )
}
