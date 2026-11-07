import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Smoke, damp } from '../helpers'
import { Lead } from './kit'

/** rad/s of the little weight inside at the motor's rated voltage */
const RATED_OMEGA = 26

/**
 * A coin vibration motor on its sticky pad. Through the clear top you can see
 * the half-moon weight inside: it spins off-centre, so the whole coin shakes.
 */
export function VibrationMotorModel({ speed, hot }: { speed: number; hot: boolean }) {
  const body = useRef<THREE.Group>(null)
  const weight = useRef<THREE.Group>(null)
  const marks = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const omega = useRef(0)

  useFrame(({ clock }, dt) => {
    const target = Math.abs(speed) * RATED_OMEGA
    // the tiny rotor spins up and stops almost at once
    omega.current = damp(omega.current, target, target > omega.current ? 6 : 4, dt)
    const w = omega.current / RATED_OMEGA
    if (weight.current) weight.current.rotation.y += omega.current * dt
    const t = clock.elapsedTime
    if (body.current) {
      const shake = Math.min(2, w) * 0.022
      body.current.position.set(Math.sin(t * 71) * shake, Math.cos(t * 83) * shake * 0.5, Math.cos(t * 59) * shake)
      body.current.rotation.z = Math.sin(t * 67) * shake * 1.2
    }
    const flicker = 0.65 + 0.35 * Math.sin(t * 38)
    marks.current.forEach((m, i) => {
      if (m) m.opacity = THREE.MathUtils.clamp(w * 1.4 - (i % 2) * 0.4, 0, 1) * flicker * 0.85
    })
  })

  return (
    <group position={[0, 0.06, 0]} rotation={[0.62, -0.25, 0]}>
      <group ref={body}>
        {/* foam pad */}
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.66, 0.66, 0.05, 48]} />
          <meshStandardMaterial color="#3a3a40" roughness={0.95} />
        </mesh>
        {/* the coin's steel can */}
        <mesh>
          <cylinderGeometry args={[0.55, 0.55, 0.2, 56, 1, true]} />
          <meshStandardMaterial color="#c7ccd3" metalness={0.75} roughness={0.28} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.09, 0]}>
          <cylinderGeometry args={[0.53, 0.53, 0.02, 48]} />
          <meshStandardMaterial color="#1f2328" roughness={0.6} />
        </mesh>
        {/* inside: the shaft and the off-centre brass weight */}
        <mesh position={[0, -0.03, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.12, 16]} />
          <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.2} />
        </mesh>
        <group ref={weight} position={[0, -0.03, 0]}>
          <mesh>
            <cylinderGeometry args={[0.42, 0.42, 0.08, 32, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#d4a017" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
        {/* the clear lid and its rim */}
        <mesh position={[0, 0.1, 0]} renderOrder={3}>
          <cylinderGeometry args={[0.54, 0.54, 0.01, 48]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.22} roughness={0.08} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.025, 8, 56]} />
          <meshStandardMaterial color="#dfe3e8" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* red and blue leads */}
        <Lead points={[[0.42, -0.02, 0.32], [0.62, -0.06, 0.48], [0.82, -0.1, 0.5], [0.98, -0.12, 0.42]]} radius={0.022} color="#dc2626" />
        <Lead points={[[0.36, -0.02, 0.38], [0.52, -0.07, 0.58], [0.74, -0.11, 0.64], [0.92, -0.13, 0.6]]} radius={0.022} color="#2563eb" />
      </group>
      {/* shake marks either side */}
      {[-1, 1].map((side) =>
        [0, 1].map((ring) => (
          <mesh
            key={`${side}${ring}`}
            position={[side * (0.6 + ring * 0.08), 0.02, 0]}
            // each arc bulges outward, away from the coin
            rotation={[-0.62, 0, side > 0 ? -0.55 : Math.PI - 0.55]}
          >
            <torusGeometry args={[0.2 + ring * 0.08, 0.016, 6, 24, 1.1]} />
            <meshBasicMaterial
              ref={(m) => {
                marks.current[(side + 1) + ring] = m
              }}
              color="#ec4899"
              transparent
              opacity={0}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        )),
      )}
      <Smoke active={hot} position={[0, 0.12, 0]} rise={0.22} color="#d4d4d8" />
    </group>
  )
}
