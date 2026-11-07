import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { RGB_CHANNELS } from '@/circuit/catalog'
import { Halo, Smoke, damp } from '../helpers'

const COLORS = {
  R: new THREE.Color(RGB_CHANNELS.R),
  G: new THREE.Color(RGB_CHANNELS.G),
  B: new THREE.Color(RGB_CHANNELS.B),
}
const MILK = new THREE.Color('#eef2f7')

/** legs left to right: R, the long common −, G, B */
const LEGS: [number, number][] = [
  [-0.165, 0.8],
  [-0.055, 0.98],
  [0.055, 0.8],
  [0.165, 0.72],
]

/**
 * A 5 mm RGB LED with a milky lens: three tiny chips inside (red, green and
 * blue) light up with their own currents, and the lens glows in the colour
 * they mix to.
 */
export function RgbLedModel({ r, g, b, burnt }: { r: number; g: number; b: number; burnt: boolean }) {
  const levels = useRef({ R: 0, G: 0, B: 0 })
  const lens = useRef<THREE.MeshStandardMaterial>(null)
  const dome = useRef<THREE.MeshStandardMaterial>(null)
  const dies = useRef<Record<string, THREE.MeshStandardMaterial | null>>({})
  const light = useRef<THREE.PointLight>(null)
  const brightness = useRef(0)
  const mixed = useRef(new THREE.Color())

  useFrame((_, dt) => {
    const target = { R: burnt ? 0 : r, G: burnt ? 0 : g, B: burnt ? 0 : b }
    const l = levels.current
    for (const ch of ['R', 'G', 'B'] as const) {
      l[ch] = damp(l[ch], Math.max(0, target[ch]), 18, dt)
      const die = dies.current[ch]
      if (die) die.emissiveIntensity = 0.12 + l[ch] * 5
    }
    const top = Math.max(l.R, l.G, l.B)
    brightness.current = top
    // the colour the three lights make together, at full strength
    const c = mixed.current.setRGB(
      COLORS.R.r * l.R + COLORS.G.r * l.G + COLORS.B.r * l.B,
      COLORS.R.g * l.R + COLORS.G.g * l.G + COLORS.B.g * l.B,
      COLORS.R.b * l.R + COLORS.G.b * l.G + COLORS.B.b * l.B,
    )
    const peak = Math.max(c.r, c.g, c.b)
    if (peak > 1e-4) c.multiplyScalar(1 / peak)
    for (const m of [lens.current, dome.current]) {
      if (!m) continue
      m.emissive.copy(c)
      m.emissiveIntensity = top * 1.6
      m.color.copy(MILK).lerp(c, Math.min(1, top) * 0.5)
    }
    if (light.current) {
      light.current.color.copy(c)
      light.current.intensity = top * 2.6
    }
  })

  return (
    <group position={[0, 0.02, 0]} rotation={[0.15, 0, 0]}>
      {/* milky lens */}
      <mesh position={[0, 0.22, 0]} renderOrder={2}>
        <cylinderGeometry args={[0.3, 0.3, 0.52, 40]} />
        <meshStandardMaterial
          ref={lens}
          color={burnt ? '#52525b' : MILK}
          emissive="#000"
          transparent
          opacity={0.9}
          roughness={0.5}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.48, 0]} renderOrder={2}>
        <sphereGeometry args={[0.3, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          ref={dome}
          color={burnt ? '#52525b' : MILK}
          emissive="#000"
          transparent
          opacity={0.9}
          roughness={0.5}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, -0.07, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.07, 40]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.9} roughness={0.4} />
      </mesh>
      {/* the three little chips inside */}
      {(['R', 'G', 'B'] as const).map((ch, i) => (
        <mesh key={ch} position={[(i - 1) * 0.085, 0.16, 0.02]}>
          <boxGeometry args={[0.05, 0.03, 0.05]} />
          <meshStandardMaterial
            ref={(m) => {
              dies.current[ch] = m
            }}
            color="#fafafa"
            emissive={COLORS[ch]}
            emissiveIntensity={0.12}
            toneMapped={false}
          />
        </mesh>
      ))}
      {LEGS.map(([x, length]) => (
        <mesh key={x} position={[x, -0.1 - length / 2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, length, 8]} />
          <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      <Halo color="#ffffff" intensity={brightness} tint={mixed} position={[0, 0.32, 0.1]} scale={1.6} />
      <pointLight ref={light} position={[0, 0.35, 0.5]} intensity={0} distance={3} decay={1.5} />
      <Smoke active={burnt} position={[0, 0.65, 0]} rise={0.45} />
    </group>
  )
}
