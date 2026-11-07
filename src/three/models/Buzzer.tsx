import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { damp } from '../helpers'

const RINGS = 3

export function BuzzerModel({ level }: { level: number }) {
  const body = useRef<THREE.Group>(null)
  const rings = useRef<(THREE.Mesh | null)[]>([])
  const loudness = useRef(0)

  useFrame(({ clock }, dt) => {
    loudness.current = damp(loudness.current, level, 14, dt)
    const v = Math.min(1.4, loudness.current)
    const t = clock.elapsedTime
    if (body.current) {
      const buzz = Math.sin(t * 140) * 0.025 * v
      body.current.scale.set(1 - buzz * 0.4, 1 + buzz, 1 - buzz * 0.4)
      body.current.position.x = Math.sin(t * 117) * 0.008 * v
    }
    // sound waves leave the hole and fade out
    rings.current.forEach((ring, i) => {
      if (!ring) return
      const phase = (t * 1.6 + i / RINGS) % 1
      ring.visible = v > 0.02
      ring.scale.setScalar(0.25 + phase * 1.05)
      ring.position.y = 0.32 + phase * 0.35
      ;(ring.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.85 * Math.min(1, v)
    })
  })

  return (
    <group position={[0, -0.18, 0]} rotation={[0.62, 0, 0]}>
      <group ref={body}>
        <mesh>
          <cylinderGeometry args={[0.62, 0.62, 0.5, 48]} />
          <meshStandardMaterial color="#111827" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.46, 0.03, 10, 48]} />
          <meshStandardMaterial color="#374151" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.255, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.02, 24]} />
          <meshStandardMaterial color="#000000" roughness={1} />
        </mesh>
        <group position={[0.36, 0.26, -0.18]}>
          <mesh>
            <boxGeometry args={[0.14, 0.01, 0.035]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.035, 0.01, 0.14]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
        <mesh position={[0, 0.05, 0.63]}>
          <boxGeometry args={[0.5, 0.18, 0.02]} />
          <meshStandardMaterial color="#8b5cf6" roughness={0.5} />
        </mesh>
      </group>
      {Array.from({ length: RINGS }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            rings.current[i] = m
          }}
          rotation={[Math.PI / 2, 0, 0]}
          visible={false}
        >
          <torusGeometry args={[0.55, 0.022, 8, 48]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
