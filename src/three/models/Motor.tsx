import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Smoke, damp } from '../helpers'

/** rad/s of the propeller at the motor's rated voltage */
const RATED_OMEGA = 20

const BLADE_COLORS = ['#f97316', '#0ea5e9', '#22c55e']

export function MotorModel({ speed, overheated }: { speed: number; overheated: boolean }) {
  const propeller = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const blur = useRef<THREE.MeshBasicMaterial>(null)
  const can = useRef<THREE.MeshStandardMaterial>(null)
  const blades = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const omega = useRef(0)
  const heat = useRef(0)

  useFrame(({ clock }, dt) => {
    // the rotor has inertia: it spins up and coasts down
    const target = speed * RATED_OMEGA
    omega.current = damp(omega.current, target, Math.abs(target) > Math.abs(omega.current) ? 2.2 : 1.1, dt)
    const w = omega.current
    const magnitude = Math.abs(w) / RATED_OMEGA

    if (propeller.current) propeller.current.rotation.z -= w * dt
    if (body.current) {
      const shake = Math.min(2, magnitude) * 0.006
      body.current.position.x = Math.sin(clock.elapsedTime * 95) * shake
      body.current.position.y = Math.cos(clock.elapsedTime * 83) * shake
    }
    // fast blades turn into a translucent disc, like a real fan
    const smear = THREE.MathUtils.clamp((magnitude - 0.55) * 0.6, 0, 0.45)
    if (blur.current) blur.current.opacity = smear
    blades.current.forEach((m) => {
      if (m) m.opacity = 1 - smear * 1.2
    })

    heat.current = damp(heat.current, overheated ? 1 : 0, 1.5, dt)
    if (can.current) can.current.emissiveIntensity = heat.current * (0.55 + Math.sin(clock.elapsedTime * 6) * 0.15)
  })

  return (
    <group position={[0.3, -0.05, 0]} rotation={[0.32, -0.78, 0]}>
      <group ref={body}>
        {/* can */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.92, 40]} />
          <meshStandardMaterial ref={can} color="#c9ced8" metalness={0.85} roughness={0.28} emissive="#ff3d00" emissiveIntensity={0} />
        </mesh>
        <mesh position={[0, 0, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.12, 40]} />
          <meshStandardMaterial color="#1f2937" roughness={0.6} />
        </mesh>
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} position={[x, 0.12, -0.6]}>
            <boxGeometry args={[0.1, 0.16, 0.06]} />
            <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.16, 0.1, 24]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.72]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.44, 12]} />
          <meshStandardMaterial color="#e5e7eb" metalness={1} roughness={0.15} />
        </mesh>
      </group>

      {/* propeller */}
      <group position={[0, 0, 0.94]}>
        <group ref={propeller}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.1, 20]} />
            <meshStandardMaterial color="#111827" roughness={0.4} />
          </mesh>
          {BLADE_COLORS.map((color, i) => (
            <group key={color} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
              <mesh position={[0, 0.4, 0]} rotation={[0, 0.5, 0]} scale={[1, 1, 0.22]}>
                <capsuleGeometry args={[0.12, 0.46, 6, 16]} />
                <meshStandardMaterial
                  ref={(m) => {
                    blades.current[i] = m
                  }}
                  color={color}
                  roughness={0.35}
                  transparent
                />
              </mesh>
            </group>
          ))}
        </group>
        <mesh position={[0, 0, 0.02]}>
          <circleGeometry args={[0.76, 48]} />
          <meshBasicMaterial ref={blur} color="#e2e8f0" transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      <Smoke active={overheated} position={[0, 0.45, -0.2]} color="#d4d4d8" />
    </group>
  )
}
