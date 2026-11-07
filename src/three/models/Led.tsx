import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Halo, Smoke, damp } from '../helpers'

export function LedModel({
  level,
  color,
  burnt,
}: {
  level: number
  color: string
  burnt: boolean
}) {
  const brightness = useRef(0)
  const lens = useRef<THREE.MeshStandardMaterial>(null)
  const dome = useRef<THREE.MeshStandardMaterial>(null)
  const die = useRef<THREE.MeshStandardMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  const lensColor = useMemo(() => new THREE.Color(burnt ? '#3f3f46' : color), [burnt, color])

  useFrame((_, dt) => {
    // LEDs switch on almost instantly
    brightness.current = damp(brightness.current, burnt ? 0 : level, 18, dt)
    const b = brightness.current
    for (const m of [lens.current, dome.current]) {
      if (!m) continue
      m.emissiveIntensity = b * 2.2
      m.opacity = 0.62 + Math.min(1, b) * 0.3
    }
    if (die.current) die.current.emissiveIntensity = 0.1 + b * 6
    if (light.current) light.current.intensity = b * 3
  })

  const lensMaterial = (
    <meshStandardMaterial
      ref={lens}
      color={lensColor}
      emissive={lensColor}
      emissiveIntensity={0}
      transparent
      opacity={0.65}
      roughness={0.15}
      toneMapped={false}
    />
  )

  return (
    <group position={[0, -0.02, 0]} rotation={[0.15, 0, 0]}>
      {/* epoxy lens */}
      <mesh position={[0, 0.22, 0]} renderOrder={2}>
        <cylinderGeometry args={[0.3, 0.3, 0.52, 40]} />
        {lensMaterial}
      </mesh>
      <mesh position={[0, 0.48, 0]} renderOrder={2}>
        <sphereGeometry args={[0.3, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={lensColor}
          emissive={lensColor}
          emissiveIntensity={0}
          transparent
          opacity={0.7}
          roughness={0.15}
          toneMapped={false}
          ref={dome}
        />
      </mesh>
      <mesh position={[0, -0.07, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.07, 40]} />
        <meshStandardMaterial color={lensColor} transparent opacity={0.8} roughness={0.2} />
      </mesh>
      {/* reflector cup and die */}
      <mesh position={[0.05, 0.1, 0]}>
        <cylinderGeometry args={[0.11, 0.06, 0.12, 16]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.05, 0.18, 0]}>
        <boxGeometry args={[0.06, 0.03, 0.06]} />
        <meshStandardMaterial ref={die} color="#fafafa" emissive={lensColor} emissiveIntensity={0.1} toneMapped={false} />
      </mesh>
      {/* legs: the longer one is + (anode) */}
      <mesh position={[-0.11, -0.52, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.86, 8]} />
        <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0.11, -0.43, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.68, 8]} />
        <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.25} />
      </mesh>

      <Halo color={color} intensity={brightness} position={[0, 0.32, 0.1]} scale={1.7} />
      <pointLight ref={light} position={[0, 0.35, 0.5]} color={color} intensity={0} distance={3} decay={1.5} />
      <Smoke active={burnt} position={[0, 0.65, 0]} rise={0.45} />
    </group>
  )
}
