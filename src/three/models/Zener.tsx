import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Rotation } from '@/circuit/types'
import { DEG, Halo, Smoke, damp } from '../helpers'
import { METAL, useBuilt } from './shared'

/** Half-profile of the DO-35 glass: a tube that narrows where it is sealed onto each lead. */
const GLASS_PROFILE: [number, number][] = [
  [0, -0.5],
  [0.04, -0.5],
  [0.09, -0.488],
  [0.142, -0.458],
  [0.18, -0.41],
  [0.198, -0.35],
  [0.202, -0.28],
  [0.202, 0.28],
  [0.198, 0.35],
  [0.18, 0.41],
  [0.142, 0.458],
  [0.09, 0.488],
  [0.04, 0.5],
  [0, 0.5],
]
const R = 0.202
const BAND_X = -0.235
const LEAD_END = 0.98
/** the two metal slugs inside press the tiny silicon die between them */
const SLUG_IN = 0.05
const SLUG_OUT = 0.37

const glassGeometry = () =>
  new THREE.LatheGeometry(
    GLASS_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)),
    36,
  ).rotateZ(Math.PI / 2)

const WARM = new THREE.Color('#ff8a1f')
const COOL = new THREE.Color('#93c5fd')

/**
 * A 5.1 V zener in its little orange glass body (DO-35). The black band on the
 * left is the + end. Through the glass you can see the two metal slugs and the
 * tiny die between them: it glows warm while the zener holds its volts, and
 * gives only a faint pale hint when current flows the "wrong" way.
 */
export function ZenerModel({
  holding,
  forward,
  burnt,
  rotation,
}: {
  /** amps flowing in its normal (reverse) direction while it holds 5.1 V */
  holding: number
  /** amps flowing the other way, where it acts like a plain diode */
  forward: number
  burnt: boolean
  rotation: Rotation
}) {
  const glass = useBuilt(glassGeometry)
  const die = useRef<THREE.MeshStandardMaterial>(null)
  const shell = useRef<THREE.MeshStandardMaterial>(null)
  const hold = useRef(0)
  const leak = useRef(0)
  const halo = useRef(0)
  const tint = useRef(new THREE.Color().copy(WARM))

  useFrame((_, dt) => {
    const h = !burnt && holding > 5e-4 ? 0.4 + 0.6 * Math.min(1, holding / 0.04) : 0
    const f = !burnt && forward > 1e-3 ? 0.25 + 0.2 * Math.min(1, forward / 0.05) : 0
    hold.current = damp(hold.current, h, 8, dt)
    leak.current = damp(leak.current, f, 8, dt)
    const total = hold.current + leak.current
    // warm while holding, pale while it only leaks forward
    tint.current.copy(COOL).lerp(WARM, total > 0.001 ? hold.current / total : 1)
    halo.current = hold.current * 0.85 + leak.current * 0.6
    if (die.current) {
      die.current.emissive.copy(tint.current)
      die.current.emissiveIntensity = total * 3.2
    }
    if (shell.current) shell.current.emissiveIntensity = hold.current * 0.9
  })

  return (
    <group rotation={[0.45, 0, 0]}>
      <group rotation={[0, 0, -rotation * DEG]}>
        {/* leads, running into the glass as far as the slugs */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[(side * (SLUG_OUT - 0.02 + LEAD_END)) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, LEAD_END - SLUG_OUT + 0.02, 8]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
        ))}
        {/* the slugs (copper-clad "dumet") and the die squeezed between them */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[(side * (SLUG_IN + SLUG_OUT)) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, SLUG_OUT - SLUG_IN, 20]} />
            <meshStandardMaterial
              color={burnt ? '#3b2618' : '#c0703f'}
              metalness={burnt ? 0.2 : 0.75}
              roughness={burnt ? 0.8 : 0.3}
            />
          </mesh>
        ))}
        <mesh>
          <boxGeometry args={[SLUG_IN * 2, 0.1, 0.1]} />
          <meshStandardMaterial
            ref={die}
            color={burnt ? '#0c0a09' : '#3f3f46'}
            metalness={0.4}
            roughness={0.35}
            emissive="#ff8a1f"
            emissiveIntensity={0}
            toneMapped={false}
          />
        </mesh>
        {/* the glass, drawn after what is inside it */}
        <mesh geometry={glass} renderOrder={4}>
          <meshStandardMaterial
            ref={shell}
            color={burnt ? '#2a1a10' : '#e0520f'}
            emissive="#ff9a3c"
            emissiveIntensity={0}
            transparent
            opacity={burnt ? 0.92 : 0.7}
            roughness={burnt ? 0.85 : 0.08}
            metalness={0.05}
            depthWrite={false}
          />
        </mesh>
        {/* a long glint along the top of the glass */}
        {!burnt && (
          <mesh position={[0.02, R * 0.72, R * 0.72]} rotation={[-Math.PI / 4, 0, 0]} renderOrder={5}>
            <planeGeometry args={[0.5, 0.026]} />
            <meshBasicMaterial color="#fff7ed" transparent opacity={0.55} depthWrite={false} />
          </mesh>
        )}
        {/* the black band: this end (the cathode) goes toward + */}
        <mesh position={[BAND_X, 0, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={6}>
          <cylinderGeometry args={[R + 0.004, R + 0.004, 0.11, 36, 1, true]} />
          <meshStandardMaterial color="#111113" roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
        {/* "5V1" printed small on the glass */}
        {!burnt &&
          [
            [0.03, 0.055],
            [0.105, 0.04],
            [0.18, 0.055],
          ].map(([x, w]) => (
            <mesh key={x} position={[x, 0, R + 0.002]} renderOrder={6}>
              <planeGeometry args={[w, 0.055]} />
              <meshBasicMaterial color="#2a1306" transparent opacity={0.75} depthWrite={false} />
            </mesh>
          ))}
        <Halo color="#ffb067" tint={tint} intensity={halo} position={[0, 0, 0.14]} scale={1.35} />
      </group>
      <group position={[0, 0.1, 0.05]} scale={0.55}>
        <Smoke active={burnt} position={[0, 0, 0]} rise={0.5} />
      </group>
    </group>
  )
}
