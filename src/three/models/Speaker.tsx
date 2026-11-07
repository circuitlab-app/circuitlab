import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Smoke, damp } from '../helpers'
import { useBuilt } from './shared'

const RINGS = 3

/** The paper cone's profile: wide at the front, narrow where it meets the coil. */
function coneGeometry() {
  const points = [
    new THREE.Vector2(0.7, 0),
    new THREE.Vector2(0.6, -0.08),
    new THREE.Vector2(0.45, -0.18),
    new THREE.Vector2(0.3, -0.27),
    new THREE.Vector2(0.2, -0.32),
  ]
  // turned round the y axis, then tipped so the cone opens toward +z
  return new THREE.LatheGeometry(points, 56).rotateX(Math.PI / 2)
}

/** The steel basket behind the cone, from the rim down to the magnet. */
function basketGeometry() {
  const points = [new THREE.Vector2(0.86, 0), new THREE.Vector2(0.62, -0.22), new THREE.Vector2(0.4, -0.44)]
  return new THREE.LatheGeometry(points, 56).rotateX(Math.PI / 2)
}

/** How fast the cone visibly shakes for each note (the real note is far too fast to see). */
const shakeHz = (pitch: number) => (pitch < 400 ? 6 : pitch < 800 ? 10 : 15)

/**
 * A round 8 Ω speaker: current in its coil pushes the paper cone in and out,
 * faster for higher notes, and sound waves roll out of the front.
 */
export function SpeakerModel({ level, pitch, burnt }: { level: number; pitch: number; burnt: boolean }) {
  const cone = useBuilt(coneGeometry)
  const basket = useBuilt(basketGeometry)
  const moving = useRef<THREE.Group>(null)
  const rings = useRef<(THREE.Mesh | null)[]>([])
  const loud = useRef(0)
  const phase = useRef(0)

  useFrame(({ clock }, dt) => {
    loud.current = damp(loud.current, burnt ? 0 : Math.min(1.5, Math.max(0, level)), 12, dt)
    const v = loud.current
    phase.current += dt * Math.PI * 2 * shakeHz(pitch)
    if (moving.current) moving.current.position.z = Math.sin(phase.current) * 0.04 * Math.min(1.2, v)
    // sound waves leave the cone and fade; higher notes roll out faster
    const speed = pitch < 400 ? 0.8 : pitch < 800 ? 1.1 : 1.5
    rings.current.forEach((ring, i) => {
      if (!ring) return
      const t = (clock.elapsedTime * speed + i / RINGS) % 1
      ring.visible = v > 0.02
      ring.scale.setScalar(0.45 + t * 0.6)
      ring.position.z = 0.08 + t * 0.42
      ;(ring.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.8 * Math.min(1, v)
    })
  })

  return (
    <group position={[-0.05, 0.02, 0]} rotation={[0.12, -0.62, 0]}>
      {/* the steel frame: rim, ears with screw holes, and the basket */}
      <mesh scale={[1, 1, 0.45]}>
        <torusGeometry args={[0.86, 0.06, 12, 64]} />
        <meshStandardMaterial color="#9aa1ab" metalness={0.7} roughness={0.35} />
      </mesh>
      {[45, 135, 225, 315].map((a) => {
        const r = (a * Math.PI) / 180
        return (
          <group key={a} position={[Math.cos(r) * 0.9, Math.sin(r) * 0.9, -0.01]} rotation={[0, 0, r]}>
            <mesh>
              <boxGeometry args={[0.2, 0.17, 0.03]} />
              <meshStandardMaterial color="#9aa1ab" metalness={0.7} roughness={0.35} />
            </mesh>
            <mesh position={[0.03, 0, 0.016]}>
              <circleGeometry args={[0.035, 12]} />
              <meshStandardMaterial color="#18181b" />
            </mesh>
          </group>
        )
      })}
      <mesh geometry={basket}>
        <meshStandardMaterial color="#7d848e" metalness={0.65} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* the magnet at the back */}
      <mesh position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.26, 40]} />
        <meshStandardMaterial color="#26282d" roughness={0.55} metalness={0.3} />
      </mesh>
      {[-0.45, -0.75].map((z) => (
        <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.43, 0.43, 0.04, 40]} />
          <meshStandardMaterial color="#b9bfc8" metalness={0.75} roughness={0.3} />
        </mesh>
      ))}
      {/* the rubber surround, the paper cone and its dust cap move together */}
      <mesh position={[0, 0, 0.01]} scale={[1, 1, 0.7]}>
        <torusGeometry args={[0.75, 0.065, 12, 64]} />
        <meshStandardMaterial color="#1b1b1e" roughness={0.75} />
      </mesh>
      <group ref={moving}>
        <mesh geometry={cone}>
          <meshStandardMaterial color={burnt ? '#0e0e10' : '#2b2b31'} roughness={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, -0.31]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.22, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.6} metalness={0.15} />
        </mesh>
      </group>
      {Array.from({ length: RINGS }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            rings.current[i] = m
          }}
          visible={false}
        >
          <torusGeometry args={[0.7, 0.018, 8, 64]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      <Smoke active={burnt} position={[0, 0.4, 0.1]} rise={0.4} />
    </group>
  )
}
