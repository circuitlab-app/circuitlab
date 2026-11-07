import { Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Rotation } from '@/circuit/types'
import { DEG, Smoke, damp } from '../helpers'

/** One AA cell lying along the x axis, + end pointing to +x. */
function Cell({ y, register }: { y: number; register: (m: THREE.MeshStandardMaterial | null) => void }) {
  return (
    <group position={[0, y, 0]} rotation={[0, 0, -Math.PI / 2]}>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.82, 32]} />
        <meshStandardMaterial ref={register} color="#18181b" roughness={0.35} metalness={0.3} emissive="#ff3d00" emissiveIntensity={0} />
      </mesh>
      <mesh position={[0, 0.41, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 32]} />
        <meshStandardMaterial ref={register} color="#d97706" roughness={0.3} metalness={0.6} emissive="#ff3d00" emissiveIntensity={0} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.08, 16]} />
        <meshStandardMaterial color="#e5e7eb" metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 24]} />
        <meshStandardMaterial color="#d4d4d8" metalness={1} roughness={0.25} />
      </mesh>
    </group>
  )
}

/** A rectangular 9 V block with its snap terminals on the + side. */
function NineVolt({ register }: { register: (m: THREE.MeshStandardMaterial | null) => void }) {
  return (
    <group>
      <mesh position={[-0.22, 0, 0]}>
        <boxGeometry args={[0.8, 0.78, 0.44]} />
        <meshStandardMaterial ref={register} color="#111827" roughness={0.4} metalness={0.3} emissive="#ff3d00" emissiveIntensity={0} />
      </mesh>
      <mesh position={[0.38, 0, 0]}>
        <boxGeometry args={[0.4, 0.78, 0.44]} />
        <meshStandardMaterial ref={register} color="#2563eb" roughness={0.35} metalness={0.4} emissive="#ff3d00" emissiveIntensity={0} />
      </mesh>
      <mesh position={[0.64, 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.12, 6]} />
        <meshStandardMaterial color="#d4d4d8" metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0.64, -0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.12, 20]} />
        <meshStandardMaterial color="#d4d4d8" metalness={1} roughness={0.2} />
      </mesh>
    </group>
  )
}

export function BatteryModel({
  voltage,
  rotation,
  delivering,
  short,
}: {
  voltage: number
  rotation: Rotation
  delivering: boolean
  short: boolean
}) {
  const shell = useRef<THREE.Group>(null)
  const materials = useRef(new Set<THREE.MeshStandardMaterial>())
  const heat = useRef(0)
  const register = (m: THREE.MeshStandardMaterial | null) => {
    if (m) materials.current.add(m)
  }

  useFrame(({ clock }, dt) => {
    heat.current = damp(heat.current, short ? 1 : 0, short ? 2 : 0.8, dt)
    const h = heat.current
    const pulse = h * (0.6 + Math.sin(clock.elapsedTime * 9) * 0.3)
    materials.current.forEach((m) => (m.emissiveIntensity = pulse))
    if (shell.current) {
      shell.current.position.x = (Math.random() - 0.5) * 0.03 * h
      shell.current.position.y = (Math.random() - 0.5) * 0.03 * h
    }
  })

  const cells = voltage >= 9 ? 0 : Math.max(1, Math.round(voltage / 1.5))
  const spacing = 0.44

  return (
    <group rotation={[0.38, 0, 0]}>
      {/* rotate the battery so its + end points at the + terminal */}
      <group rotation={[0, 0, -rotation * DEG]}>
        <group ref={shell}>
          {cells === 0 ? (
            <NineVolt register={register} />
          ) : (
            <>
              {cells > 1 && (
                <mesh position={[0, 0, -0.16]}>
                  <boxGeometry args={[1.5, cells * spacing + 0.1, 0.12]} />
                  <meshStandardMaterial color="#334155" roughness={0.7} />
                </mesh>
              )}
              {Array.from({ length: cells }, (_, i) => (
                <Cell key={i} y={(i - (cells - 1) / 2) * spacing} register={register} />
              ))}
            </>
          )}
        </group>
        {delivering && !short && (
          <Sparkles count={14} scale={[0.5, 0.6, 0.5]} size={2.2} speed={0.8} color="#fde047" position={[0.8, 0, 0.1]} />
        )}
      </group>
      <Smoke active={short} position={[0, 0.4, 0]} color="#a1a1aa" />
    </group>
  )
}
