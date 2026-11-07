import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { resistorBands } from '@/circuit/catalog'
import type { Rotation } from '@/circuit/types'
import { DEG, Halo, Smoke, damp } from '../helpers'

const OPEN_ANGLE = 0.62

/** Classic school "knife switch": a copper blade on a wooden base. */
export function SwitchModel({
  closed,
  rotation,
  current,
}: {
  closed: boolean
  rotation: Rotation
  current: number
}) {
  const lever = useRef<THREE.Group>(null)
  const angle = useRef(closed ? 0 : OPEN_ANGLE)
  const spark = useRef(0)
  const wasClosed = useRef(closed)

  useFrame((_, dt) => {
    if (closed && !wasClosed.current && Math.abs(current) > 0.005) spark.current = 1.2
    wasClosed.current = closed
    angle.current = damp(angle.current, closed ? 0 : OPEN_ANGLE, 11, dt)
    if (lever.current) lever.current.rotation.z = angle.current
    spark.current = Math.max(0, spark.current - dt * 5)
  })

  return (
    <group rotation={[0.62, 0, 0]} scale={0.92}>
      <group rotation={[0, 0, -rotation * DEG]}>
        <RoundedBox args={[1.95, 0.16, 0.8]} radius={0.05} position={[0, -0.08, 0]}>
          <meshStandardMaterial color="#d6a46a" roughness={0.75} />
        </RoundedBox>
        {[-0.72, 0.72].map((x) => (
          <mesh key={x} position={[x, 0.12, 0]}>
            <boxGeometry args={[0.16, 0.3, 0.34]} />
            <meshStandardMaterial color="#c2410c" metalness={0.75} roughness={0.3} />
          </mesh>
        ))}
        {[-0.88, 0.88].map((x) => (
          <mesh key={x} position={[x, 0.05, 0.25]}>
            <cylinderGeometry args={[0.07, 0.07, 0.1, 16]} />
            <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
        <group ref={lever} position={[-0.72, 0.24, 0]}>
          <mesh position={[0.72, 0, 0]}>
            <boxGeometry args={[1.44, 0.05, 0.13]} />
            <meshStandardMaterial color="#ea580c" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[1.56, 0.12, 0]}>
            <capsuleGeometry args={[0.085, 0.22, 6, 16]} />
            <meshStandardMaterial color="#ef4444" roughness={0.35} />
          </mesh>
        </group>
        <Halo color="#fde68a" intensity={spark} position={[0.72, 0.3, 0.1]} scale={1.4} />
      </group>
    </group>
  )
}

/** Tactile push button: the red cap sinks while it is held. */
export function ButtonModel({ pressed }: { pressed: boolean }) {
  const cap = useRef<THREE.Mesh>(null)
  const capMaterial = useRef<THREE.MeshStandardMaterial>(null)
  useFrame((_, dt) => {
    if (cap.current) cap.current.position.y = damp(cap.current.position.y, pressed ? 0.24 : 0.36, 22, dt)
    if (capMaterial.current) capMaterial.current.emissiveIntensity = damp(capMaterial.current.emissiveIntensity, pressed ? 0.45 : 0, 12, dt)
  })
  return (
    <group position={[0, -0.18, 0]} rotation={[0.62, 0, 0]}>
      <RoundedBox args={[1.15, 0.36, 1.15]} radius={0.08}>
        <meshStandardMaterial color="#1f2937" roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.44, 0.44, 0.06, 40]} />
        <meshStandardMaterial color="#6b7280" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh ref={cap} position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.34, 0.36, 0.26, 40]} />
        <meshStandardMaterial ref={capMaterial} color="#ec4899" emissive="#ec4899" emissiveIntensity={0} roughness={0.3} />
      </mesh>
      {[-0.42, 0.42].flatMap((x) =>
        [-0.42, 0.42].map((z) => (
          <mesh key={`${x}${z}`} position={[x, -0.26, z]}>
            <boxGeometry args={[0.06, 0.18, 0.06]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.25} />
          </mesh>
        )),
      )}
    </group>
  )
}

/** Through-hole resistor with real colour bands for its value. */
export function ResistorModel({
  ohms,
  rotation,
  heat,
}: {
  ohms: number
  rotation: Rotation
  /** power / rated power */
  heat: number
}) {
  const body = useRef<THREE.MeshStandardMaterial>(null)
  const glow = useRef(0)
  const bands = useMemo(() => resistorBands(ohms), [ohms])
  useFrame((_, dt) => {
    glow.current = damp(glow.current, THREE.MathUtils.clamp(heat - 0.6, 0, 2), 2, dt)
    if (body.current) body.current.emissiveIntensity = glow.current * 0.6
  })
  return (
    <group rotation={[0.45, 0, 0]}>
      <group rotation={[0, 0, -rotation * DEG]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.22, 0.78, 8, 24]} />
          <meshStandardMaterial ref={body} color="#e9d3a5" roughness={0.55} emissive="#ff5a1f" emissiveIntensity={0} />
        </mesh>
        {bands.map((color, i) => (
          <mesh key={i} position={[[-0.3, -0.15, 0, 0.3][i], 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.226, 0.226, 0.07, 32]} />
            <meshStandardMaterial color={color} roughness={0.5} metalness={i === 3 ? 0.7 : 0} />
          </mesh>
        ))}
        {[-0.85, 0.85].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.028, 0.028, 0.5, 8]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
      </group>
      <Smoke active={heat > 2} position={[0, 0.25, 0]} />
    </group>
  )
}

/** Rotary potentiometer: the knob turns with the dimmer level. */
export function DimmerModel({ level }: { level: number }) {
  const knob = useRef<THREE.Group>(null)
  const ticks = useMemo(() => Array.from({ length: 9 }, (_, i) => (-135 + (270 * i) / 8) * DEG), [])
  useFrame((_, dt) => {
    if (knob.current) knob.current.rotation.z = damp(knob.current.rotation.z, (0.5 - level) * 270 * DEG, 10, dt)
  })
  return (
    <group position={[0, 0.02, 0]} rotation={[-0.35, 0.4, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.66, 0.66, 0.3, 48]} />
        <meshStandardMaterial color="#0f766e" metalness={0.45} roughness={0.35} />
      </mesh>
      {ticks.map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 0.56, Math.cos(a) * 0.56, 0.16]} rotation={[0, 0, -a]}>
          <boxGeometry args={[0.025, 0.09, 0.01]} />
          <meshStandardMaterial color="#ccfbf1" emissive="#5eead4" emissiveIntensity={i / 8 <= level ? 0.8 : 0} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.12, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>
      <group ref={knob} position={[0, 0, 0.38]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.44, 0.28, 32]} />
          <meshStandardMaterial color="#1f2937" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.2, 0.145]}>
          <boxGeometry args={[0.06, 0.26, 0.01]} />
          <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.3} />
        </mesh>
      </group>
      {[-0.35, 0, 0.35].map((x) => (
        <mesh key={x} position={[x, -0.82, 0]}>
          <boxGeometry args={[0.08, 0.36, 0.03]} />
          <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
    </group>
  )
}
