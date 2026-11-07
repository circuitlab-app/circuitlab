import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Rotation } from '@/circuit/types'
import { DEG, Halo, Smoke, damp } from '../helpers'

/** Half-profile of the moulded body: a short cylinder with softly rounded ends. */
const BODY_PROFILE: [number, number][] = [
  [0, -0.36],
  [0.15, -0.36],
  [0.178, -0.346],
  [0.19, -0.312],
  [0.19, 0.312],
  [0.178, 0.346],
  [0.15, 0.36],
  [0, 0.36],
]
const BAND_X = 0.22
const LEAD_END = 1.1

/** Axial rectifier diode (1N4007 style): the silver band marks the − (cathode) end on the right. */
export function DiodeModel({
  current,
  burnt,
  rotation,
}: {
  /** amps through it, forward */
  current: number
  burnt: boolean
  rotation: Rotation
}) {
  const band = useRef<THREE.MeshStandardMaterial>(null)
  const glow = useRef(0)
  const flash = useRef(0)
  const halo = useRef(0)
  const wasOn = useRef(false)
  const profile = useMemo(() => BODY_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), [])

  useFrame((_, dt) => {
    const on = !burnt && current > 0.001
    // a short flash when current starts to flow, then a steady glow
    if (on && !wasOn.current) flash.current = 1
    wasOn.current = on
    flash.current = Math.max(0, flash.current - dt * 2.5)
    const target = on ? 0.4 + 0.4 * Math.min(1, current / 0.5) : 0
    glow.current = damp(glow.current, target, 8, dt)
    halo.current = glow.current * 0.8 + flash.current * 0.5
    if (band.current) band.current.emissiveIntensity = (glow.current + flash.current * 0.6) * 1.4
  })

  return (
    <group rotation={[0.45, 0, 0]}>
      <group rotation={[0, 0, -rotation * DEG]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <latheGeometry args={[profile, 32]} />
          <meshStandardMaterial
            color={burnt ? '#1f1712' : '#1a1a1c'}
            roughness={burnt ? 0.95 : 0.32}
            metalness={burnt ? 0 : 0.15}
            emissive="#7c2d12"
            emissiveIntensity={burnt ? 0.05 : 0}
          />
        </mesh>
        {/* cathode band */}
        <mesh position={[BAND_X, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.193, 0.193, 0.1, 32]} />
          <meshStandardMaterial
            ref={band}
            color={burnt ? '#57534e' : '#d1d5db'}
            metalness={burnt ? 0.1 : 0.45}
            roughness={burnt ? 0.9 : 0.35}
            emissive="#fbbf24"
            emissiveIntensity={0}
          />
        </mesh>
        {/* printed part number */}
        {!burnt &&
          [
            [-0.21, 0.08],
            [-0.04, 0.18],
          ].map(([x, w]) => (
            <mesh key={x} position={[x, 0, 0.19]}>
              <boxGeometry args={[w, 0.034, 0.006]} />
              <meshStandardMaterial color="#9ca3af" roughness={0.6} />
            </mesh>
          ))}
        {/* leads */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (0.36 + LEAD_END) * 0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, LEAD_END - 0.36, 8]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
        <Halo color="#fde68a" intensity={halo} position={[BAND_X, 0, 0.16]} scale={1} />
      </group>
      <Smoke active={burnt} position={[0, 0.25, 0]} />
    </group>
  )
}
