import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Rotation } from '@/circuit/types'
import { DEG, Halo, damp } from '../helpers'

const GLASS_R = 0.19
const GLASS_HALF = 0.44
const CAP_R = 0.205
const CAP_LEN = 0.24
const CAP_X = GLASS_HALF + CAP_LEN / 2 - 0.02
const LEAD_START = CAP_X + CAP_LEN / 2
const LEAD_END = 0.95
const WIRE_R = 0.012
/** half of the gap left in the wire once it has melted */
const GAP = 0.07

const metal = { color: '#d4d4d8', metalness: 0.9, roughness: 0.25 } as const
/** the caps are large: less metalness keeps them silver instead of dark */
const nickel = { color: '#dadde2', metalness: 0.55, roughness: 0.3 } as const

/** Glass cartridge fuse: the thin wire glows near its rating and melts in two when blown. */
export function FuseModel({
  blown,
  load,
  rotation,
}: {
  blown: boolean
  /** current / rating */
  load: number
  rotation: Rotation
}) {
  const wire = useRef<THREE.MeshStandardMaterial>(null)
  const glass = useRef<THREE.MeshStandardMaterial>(null)
  const heat = useRef(0)
  const halo = useRef(0)

  useFrame((_, dt) => {
    const target = blown ? 0 : THREE.MathUtils.clamp(((Number.isFinite(load) ? load : 0) - 0.6) / 0.4, 0, 1.5)
    // the wire heats quickly and cools a little slower
    heat.current = damp(heat.current, target, target > heat.current ? 7 : 4, dt)
    const h = heat.current
    halo.current = h * 0.75
    if (wire.current) wire.current.emissiveIntensity = h * 3.2
    if (glass.current) glass.current.emissiveIntensity = h * 0.3
  })

  const halfWire = (GLASS_HALF - GAP) / 2

  return (
    <group rotation={[0.45, 0, 0]}>
      <group rotation={[0, 0, -rotation * DEG]}>
        {/* the fuse wire */}
        {blown ? (
          [-1, 1].map((side) => (
            // each half curls down a little where it melted
            <group key={side} position={[side * GLASS_HALF, 0, 0]} rotation={[0, 0, side * 0.09]}>
              <mesh position={[-side * halfWire, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[WIRE_R, WIRE_R, GLASS_HALF - GAP, 6]} />
                <meshStandardMaterial color="#8a8580" metalness={0.6} roughness={0.5} />
              </mesh>
              <mesh position={[-side * (GLASS_HALF - GAP), 0, 0]}>
                <sphereGeometry args={[0.024, 10, 8]} />
                <meshStandardMaterial color="#57534e" metalness={0.4} roughness={0.6} />
              </mesh>
            </group>
          ))
        ) : (
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[WIRE_R, WIRE_R, GLASS_HALF * 2, 6]} />
            <meshStandardMaterial ref={wire} color="#b8b8b8" metalness={0.8} roughness={0.35} emissive="#ff6a00" emissiveIntensity={0} toneMapped={false} />
          </mesh>
        )}
        {blown && (
          // soot left on the inside of the glass
          <mesh scale={[1.7, 0.95, 0.95]} renderOrder={1}>
            <sphereGeometry args={[0.13, 16, 12]} />
            <meshStandardMaterial color="#27272a" transparent opacity={0.45} roughness={1} depthWrite={false} />
          </mesh>
        )}

        {/* glass tube and a highlight along its top */}
        <mesh rotation={[0, 0, Math.PI / 2]} renderOrder={2}>
          <cylinderGeometry args={[GLASS_R, GLASS_R, GLASS_HALF * 2, 32, 1, true]} />
          <meshStandardMaterial
            ref={glass}
            color={blown ? '#6b6158' : '#e0f2fe'}
            emissive="#fb923c"
            emissiveIntensity={0}
            transparent
            opacity={blown ? 0.5 : 0.22}
            roughness={0.05}
            metalness={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} renderOrder={3}>
          <cylinderGeometry args={[GLASS_R + 0.002, GLASS_R + 0.002, GLASS_HALF * 1.8, 8, 1, true, 0.48, 0.28]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={blown ? 0.18 : 0.5} depthWrite={false} />
        </mesh>

        {/* nickel end caps and leads */}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * CAP_X, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[CAP_R, CAP_R, CAP_LEN, 32]} />
              <meshStandardMaterial {...nickel} />
            </mesh>
            <mesh position={[side * (GLASS_HALF - 0.01), 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[CAP_R - 0.004, 0.012, 6, 32]} />
              <meshStandardMaterial {...nickel} />
            </mesh>
            <mesh position={[side * (LEAD_START + LEAD_END) * 0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.028, 0.028, LEAD_END - LEAD_START, 8]} />
              <meshStandardMaterial {...metal} />
            </mesh>
          </group>
        ))}
        <Halo color="#fb923c" intensity={halo} position={[0, 0, 0.1]} scale={1.1} />
      </group>
    </group>
  )
}
