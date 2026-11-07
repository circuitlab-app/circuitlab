import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Halo, Smoke, damp } from '../helpers'

const COLD = new THREE.Color('#7c2d12')
const HOT = new THREE.Color('#fff7d6')

/** Helix of tungsten wire between the two support posts. */
function filamentCurve(from: number, to: number) {
  const points: THREE.Vector3[] = []
  const turns = 9
  const steps = 160
  for (let i = 0; i <= steps; i++) {
    const t = from + ((to - from) * i) / steps
    const angle = t * Math.PI * 2 * turns
    points.push(new THREE.Vector3(-0.17 + 0.34 * t, 0.36 + Math.sin(angle) * 0.032, Math.cos(angle) * 0.032))
  }
  return new THREE.CatmullRomCurve3(points)
}

export function LampModel({
  level,
  color,
  burnt,
}: {
  level: number
  color: string
  burnt: boolean
}) {
  const brightness = useRef(0)
  const filamentMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const glassMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const light = useRef<THREE.PointLight>(null)

  const tint = useMemo(() => new THREE.Color(color), [color])
  const glassColor = useMemo(
    () => (burnt ? new THREE.Color('#52525b') : new THREE.Color('#ffffff').lerp(tint, 0.35)),
    [burnt, tint],
  )
  const filaments = useMemo(
    () =>
      burnt
        ? [filamentCurve(0, 0.44), filamentCurve(0.56, 1)]
        : [filamentCurve(0, 1)],
    [burnt],
  )

  useFrame(({ clock }, dt) => {
    const target = burnt ? 0 : level
    // filaments heat up quickly and cool down a little slower
    brightness.current = damp(brightness.current, target, target > brightness.current ? 6 : 3, dt)
    const b = brightness.current
    const flicker = b > 0.02 ? 1 + Math.sin(clock.elapsedTime * 41) * 0.02 : 1
    const f = filamentMaterial.current
    if (f) {
      f.emissive.lerpColors(COLD, HOT, Math.min(1, b))
      f.emissiveIntensity = (0.05 + b * 4.5) * flicker
    }
    const g = glassMaterial.current
    if (g) {
      g.emissiveIntensity = Math.min(1.4, b) * 0.85
      g.opacity = 0.3 + Math.min(1, b) * 0.4
    }
    if (light.current) light.current.intensity = b * 5 * flicker
  })

  return (
    <group position={[0, -0.05, 0]}>
      {/* glass bulb */}
      <mesh position={[0, 0.3, 0]} renderOrder={2}>
        <sphereGeometry args={[0.56, 48, 32]} />
        <meshStandardMaterial
          ref={glassMaterial}
          color={glassColor}
          emissive={tint}
          emissiveIntensity={0}
          transparent
          opacity={0.32}
          roughness={0.08}
          metalness={0}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, -0.2, 0]} renderOrder={2}>
        <cylinderGeometry args={[0.22, 0.27, 0.2, 32, 1, true]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.35} roughness={0.1} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* filament and its supports */}
      {filaments.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 160, 0.011, 6, false]} />
          <meshStandardMaterial ref={i === 0 ? filamentMaterial : undefined} color="#3f3f46" emissive={COLD} toneMapped={false} />
        </mesh>
      ))}
      {[-0.17, 0.17].map((x) => (
        <mesh key={x} position={[x, 0.07, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.58, 6]} />
          <meshStandardMaterial color="#a1a1aa" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 0.16, 12]} />
        <meshStandardMaterial color="#e4e4e7" transparent opacity={0.7} />
      </mesh>

      {/* screw base */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.27, 0.25, 0.42, 32]} />
        <meshStandardMaterial color="#c7cbd3" metalness={0.9} roughness={0.25} />
      </mesh>
      {[-0.38, -0.5, -0.62].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.27, 0.026, 8, 32]} />
          <meshStandardMaterial color="#d4d8df" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, -0.74, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.06, 24]} />
        <meshStandardMaterial color="#18181b" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.09, 0.07, 0.07, 16]} />
        <meshStandardMaterial color="#b45309" metalness={0.8} roughness={0.3} />
      </mesh>

      <Halo color={color} intensity={brightness} position={[0, 0.34, 0]} scale={2} />
      <pointLight ref={light} position={[0, 0.34, 0.3]} color={color} intensity={0} distance={4} decay={1.4} />
      <Smoke active={burnt} position={[0, 0.7, 0]} rise={0.45} />
    </group>
  )
}
