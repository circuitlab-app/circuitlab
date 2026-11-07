import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, damp } from '../helpers'
import { Indicator } from './kit'
import { METAL, unit } from './shared'

const PCB_Y = -0.6
const CASE: [number, number, number] = [1.3, 1.05, 0.95]
const CASE_X = -0.3
const CASE_Y = PCB_Y + 0.03 + CASE[1] / 2
/** the armature swings on this hinge above the coil */
const PIVOT: [number, number, number] = [-0.54, 0.17, 0]
/** open: the spring holds the arm up; closed: the coil pulls it down onto the contact */
const OPEN_ANGLE = 0.13
const ARM = 1.0

const copper = { color: '#c8702e', metalness: 0.75, roughness: 0.32 } as const

/**
 * A relay on its little board, in a see-through case: current in the coil
 * makes it a magnet that pulls the metal arm down, so the switch inside snaps
 * closed with a click (and a tiny spark).
 */
export function RelayModel({ closed, coil, contact }: { closed: boolean; coil: number; contact: number }) {
  const arm = useRef<THREE.Group>(null)
  const winding = useRef<THREE.MeshStandardMaterial>(null)
  const angle = useRef(closed ? 0 : OPEN_ANGLE)
  const spark = useRef(0)
  const flow = useRef(0)
  const wasClosed = useRef(closed)
  const glow = useRef(0)

  useFrame((_, dt) => {
    // the arm snaps over fast, then settles
    angle.current = damp(angle.current, closed ? 0 : OPEN_ANGLE, 28, dt)
    if (arm.current) arm.current.rotation.z = angle.current
    if (closed && !wasClosed.current) spark.current = 1.2
    wasClosed.current = closed
    spark.current = damp(spark.current, 0, 7, dt)
    flow.current = damp(flow.current, closed ? Math.min(1, Math.abs(contact) / 0.3) * 0.45 : 0, 8, dt)
    glow.current = Math.max(spark.current, flow.current)
    if (winding.current) winding.current.emissiveIntensity = unit(coil) * 0.35
  })

  // where the moving contact meets the fixed one when closed
  const tip: [number, number, number] = [PIVOT[0] + ARM, PIVOT[1] - 0.05, 0]

  return (
    <group position={[0.08, 0.1, 0]} rotation={[0.34, -0.5, 0]}>
      {/* the board */}
      <RoundedBox args={[2.2, 0.06, 1.3]} radius={0.02} smoothness={2} position={[0, PCB_Y, 0]}>
        <meshStandardMaterial color="#1e3a8a" roughness={0.55} metalness={0.1} />
      </RoundedBox>
      <Indicator position={[-0.2, PCB_Y + 0.045, 0.56]} color="#ef4444" off="#fecaca" level={unit(coil)} size={[0.09, 0.04, 0.06]} halo={0.4} />
      {/* screw terminal block for the switch */}
      <group position={[0.76, PCB_Y + 0.19, 0]}>
        <RoundedBox args={[0.42, 0.32, 0.92]} radius={0.02} smoothness={2}>
          <meshStandardMaterial color="#15803d" roughness={0.5} />
        </RoundedBox>
        {[-0.28, 0, 0.28].map((z) => (
          <group key={z}>
            <mesh position={[0, 0.165, z]}>
              <cylinderGeometry args={[0.09, 0.09, 0.02, 20]} />
              <meshStandardMaterial {...METAL} />
            </mesh>
            <mesh position={[0, 0.178, z]}>
              <boxGeometry args={[0.13, 0.008, 0.025]} />
              <meshStandardMaterial color="#52525b" />
            </mesh>
            <mesh position={[0.212, -0.02, z]}>
              <boxGeometry args={[0.01, 0.14, 0.16]} />
              <meshStandardMaterial color="#052e16" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      <group position={[CASE_X, CASE_Y, 0]}>
        {/* the coil on its bobbin, with the iron core on top */}
        <group position={[-0.2, -0.18, 0]}>
          <mesh>
            <cylinderGeometry args={[0.235, 0.235, 0.46, 32]} />
            <meshStandardMaterial ref={winding} {...copper} emissive="#ff7a1a" emissiveIntensity={0} />
          </mesh>
          {[-0.25, 0.25].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <cylinderGeometry args={[0.29, 0.29, 0.04, 32]} />
              <meshStandardMaterial color="#1f2937" roughness={0.6} />
            </mesh>
          ))}
          <mesh position={[0, 0.29, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.04, 20]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.35} />
          </mesh>
        </group>
        {/* the iron yoke beside the coil */}
        <mesh position={[PIVOT[0] + 0.02, -0.16, 0]}>
          <boxGeometry args={[0.05, 0.66, 0.32]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.75} roughness={0.35} />
        </mesh>
        {/* the fixed NO contact on its post */}
        <mesh position={[tip[0], (tip[1] - 0.03 - 0.5) / 2, 0]}>
          <boxGeometry args={[0.05, tip[1] - 0.03 + 0.5, 0.1]} />
          <meshStandardMaterial {...copper} />
        </mesh>
        <mesh position={[tip[0], tip[1] - 0.015, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
          <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* the arm: an iron plate pulled by the coil, carrying the moving contact */}
        <group ref={arm} position={PIVOT}>
          <mesh position={[0.37, 0, 0]}>
            <boxGeometry args={[0.74, 0.045, 0.3]} />
            <meshStandardMaterial color="#a3a9b3" metalness={0.75} roughness={0.32} />
          </mesh>
          <mesh position={[0.87, -0.015, 0]}>
            <boxGeometry args={[0.34, 0.016, 0.12]} />
            <meshStandardMaterial {...copper} />
          </mesh>
          <mesh position={[ARM, -0.035, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
            <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
        <Halo color="#bfe3ff" intensity={glow} position={[tip[0], tip[1] - 0.03, 0.08]} scale={0.7} />
        {/* the clear blue case */}
        <RoundedBox args={CASE} radius={0.04} smoothness={3} renderOrder={5}>
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.26} roughness={0.12} metalness={0.05} depthWrite={false} />
        </RoundedBox>
      </group>
    </group>
  )
}
