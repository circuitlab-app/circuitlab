import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { DEG, damp } from '../helpers'

const BODY_W = 2
const BODY_H = 1.5
const BODY_D = 0.42
const FRONT = BODY_D / 2
const FACE_Y = 0.2
const FACE_W = 1.72
const FACE_H = 0.96
const PIVOT_Y = -0.2
const ARC_R = 0.68
/** needle swing either side of straight up, at 0 and at full scale */
const SWING = 50 * DEG
const TICKS = 20
/** how far past the ends of the scale the needle can be pushed */
const UNDER = -0.06
const OVER = 1.06
const POST_Y = -0.53

const KINDS = {
  volt: { color: '#2563eb' },
  amp: { color: '#f97316' },
} as const

type Stroke = { size: [number, number]; at: [number, number]; angle?: number }

/** "V" and "A" drawn with flat strokes, centred on the badge. */
const LETTERS: Record<keyof typeof KINDS, Stroke[]> = {
  volt: [
    { size: [0.024, 0.115], at: [-0.024, 0], angle: 0.42 },
    { size: [0.024, 0.115], at: [0.024, 0], angle: -0.42 },
  ],
  amp: [
    { size: [0.024, 0.118], at: [-0.025, 0], angle: -0.44 },
    { size: [0.024, 0.118], at: [0.025, 0], angle: 0.44 },
    { size: [0.056, 0.018], at: [0, -0.014] },
  ],
}

/** Major and minor tick marks around the scale arc, as one mesh. */
function ticksGeometry() {
  const ticks: THREE.BufferGeometry[] = []
  for (let i = 0; i <= TICKS; i++) {
    const major = i % 5 === 0
    const length = major ? 0.1 : 0.055
    const a = -SWING + (2 * SWING * i) / TICKS
    const r = ARC_R + length / 2
    ticks.push(
      new THREE.BoxGeometry(major ? 0.018 : 0.01, length, 0.004)
        .rotateZ(-a)
        .translate(Math.sin(a) * r, Math.cos(a) * r, 0),
    )
  }
  const merged = mergeGeometries(ticks) ?? new THREE.BufferGeometry()
  ticks.forEach((g) => g.dispose())
  return merged
}

/** One binding post: a hex nut and a knurled coloured cap. */
function Post({ x, color }: { x: number; color: string }) {
  return (
    <group position={[x, POST_Y, FRONT]}>
      <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.06, 6]} />
        <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.11, 0.14, 20]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.205]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.012, 12]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

/** Moving-coil panel meter: the red needle swings from 0 (left) to full scale (right). */
export function MeterModel({
  kind,
  value,
  fullScale,
}: {
  kind: 'volt' | 'amp'
  /** the reading, in the same unit as fullScale */
  value: number
  fullScale: number
}) {
  const ticks = useMemo(() => ticksGeometry(), [])
  useEffect(() => () => ticks.dispose(), [ticks])
  const needle = useRef<THREE.Group>(null)
  const targetAngle = () => {
    const fraction = fullScale > 0 && Number.isFinite(value) ? value / fullScale : 0
    return (THREE.MathUtils.clamp(fraction, UNDER, OVER) - 0.5) * 2 * SWING
  }
  const angle = useRef(targetAngle())

  useFrame((_, dt) => {
    // a moving coil has a little inertia
    angle.current = damp(angle.current, targetAngle(), 5, dt)
    if (needle.current) needle.current.rotation.z = -angle.current
  })

  const accent = KINDS[kind].color
  const arcStart = Math.PI / 2 - SWING

  return (
    <group rotation={[-0.28, 0.22, 0]}>
      <RoundedBox args={[BODY_W, BODY_H, BODY_D]} radius={0.1} smoothness={3}>
        <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.1} />
      </RoundedBox>

      {/* dial face */}
      <mesh position={[0, FACE_Y, FRONT + 0.005]}>
        <boxGeometry args={[FACE_W, FACE_H, 0.02]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>
      <group position={[0, PIVOT_Y, FRONT + 0.017]}>
        <mesh geometry={ticks}>
          <meshStandardMaterial color="#111827" roughness={0.6} />
        </mesh>
        <mesh rotation={[0, 0, arcStart]} scale={[1, 1, 0.2]}>
          <torusGeometry args={[ARC_R, 0.006, 4, 48, 2 * SWING]} />
          <meshStandardMaterial color="#111827" roughness={0.6} />
        </mesh>
        <mesh rotation={[0, 0, arcStart]} scale={[1, 1, 0.2]}>
          <torusGeometry args={[ARC_R - 0.07, 0.014, 4, 48, 2 * SWING]} />
          <meshStandardMaterial color={accent} roughness={0.5} />
        </mesh>
        {/* red zone past 90 % */}
        <mesh rotation={[0, 0, arcStart]} scale={[1, 1, 0.2]}>
          <torusGeometry args={[ARC_R + 0.03, 0.02, 4, 12, 2 * SWING * 0.1]} />
          <meshStandardMaterial color="#dc2626" roughness={0.5} />
        </mesh>

        {/* needle */}
        <group ref={needle} position={[0, 0, 0.012]}>
          <mesh position={[0, 0.29, 0]}>
            <boxGeometry args={[0.022, 0.7, 0.008]} />
            <meshStandardMaterial color="#dc2626" roughness={0.4} emissive="#dc2626" emissiveIntensity={0.15} />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.03, 20]} />
          <meshStandardMaterial color="#111827" roughness={0.4} />
        </mesh>
      </group>
      {/* window glass */}
      <mesh position={[0, FACE_Y, FRONT + 0.06]} renderOrder={2}>
        <boxGeometry args={[FACE_W, FACE_H, 0.01]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.1} roughness={0.05} metalness={0.2} depthWrite={false} />
      </mesh>

      {/* zero-adjust screw */}
      <group position={[0, -0.34, FRONT + 0.01]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.011]} rotation={[0, 0, 0.6]}>
          <boxGeometry args={[0.06, 0.01, 0.004]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      </group>

      {/* kind badge: blue V for volts, orange A for amps */}
      <group position={[0, POST_Y, FRONT]}>
        <RoundedBox args={[0.3, 0.2, 0.03]} radius={0.012} smoothness={2} position={[0, 0, 0.012]}>
          <meshStandardMaterial color={accent} roughness={0.4} />
        </RoundedBox>
        {LETTERS[kind].map(({ size, at, angle: a = 0 }, i) => (
          <mesh key={i} position={[at[0], at[1], 0.03]} rotation={[0, 0, a]}>
            <boxGeometry args={[size[0], size[1], 0.006]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* binding posts: + red on the left, − black on the right */}
      <Post x={-0.66} color="#dc2626" />
      <Post x={0.66} color="#18181b" />
    </group>
  )
}
