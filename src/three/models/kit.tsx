import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, damp } from '../helpers'
import { GOLD, METAL, unit, useBuiltWith } from './shared'

/*
 * Small pieces shared by the workshop models (power supply, relay, chips …):
 * header pins, tiny indicator LEDs, wires and geometry that frees itself.
 */

/** A gold header pin sticking straight out along `direction` (+1 right, −1 left) from an edge at `x`. */
export function SidePin({ x, y, z, direction, length = 0.3 }: { x: number; y: number; z: number; direction: 1 | -1; length?: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh position={[(-direction * 0.05) / 2, 0, 0]}>
        <boxGeometry args={[0.1, 0.12, 0.12]} />
        <meshStandardMaterial color="#18181b" roughness={0.6} />
      </mesh>
      <mesh position={[(direction * length) / 2, 0, 0]}>
        <boxGeometry args={[length, 0.035, 0.035]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
    </group>
  )
}

/** A tiny surface-mount LED that glows with `level` (0..1), with a soft halo. */
export function Indicator({
  position,
  color,
  off,
  level,
  size = [0.08, 0.05, 0.04],
  halo = 0.45,
  speed = 14,
}: {
  position: [number, number, number]
  color: string
  off: string
  level: number
  size?: [number, number, number]
  halo?: number
  /** how quickly it follows `level` */
  speed?: number
}) {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const glow = useRef(0)
  const lit = useRef(unit(level))
  useFrame((_, dt) => {
    lit.current = damp(lit.current, unit(level), speed, dt)
    if (material.current) material.current.emissiveIntensity = 0.03 + lit.current * 2.8
    glow.current = lit.current * 0.7
  })
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial ref={material} color={off} emissive={color} emissiveIntensity={0.03} roughness={0.35} toneMapped={false} />
      </mesh>
      <Halo color={color} intensity={glow} position={[0, 0, size[2] / 2 + 0.05]} scale={halo} />
    </group>
  )
}

const UP = new THREE.Vector3(0, 1, 0)

/** A straight round rod between two points: a wire, a leg, a lead. */
export function Rod({
  from,
  to,
  radius = 0.02,
  color = METAL.color,
  metalness = 0.9,
  roughness = 0.25,
}: {
  from: [number, number, number]
  to: [number, number, number]
  radius?: number
  color?: string
  metalness?: number
  roughness?: number
}) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const direction = b.clone().sub(a)
  const length = direction.length()
  const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, direction.normalize())
  return (
    <mesh position={a.add(b).multiplyScalar(0.5)} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  )
}

function leadGeometry(key: string) {
  const { points, radius } = JSON.parse(key) as { points: [number, number, number][]; radius: number }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 32, radius, 8)
}

/** A soft, bent wire through `points`, like a component's coloured lead. */
export function Lead({ points, radius = 0.025, color }: { points: [number, number, number][]; radius?: number; color: string }) {
  const geometry = useBuiltWith(leadGeometry, JSON.stringify({ points, radius }))
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  )
}
