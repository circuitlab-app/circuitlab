import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, Smoke, damp } from '../helpers'
import { Lead } from './kit'
import { METAL, useBuilt } from './shared'

/** IR LEDs come in clear epoxy with a faint blue-violet tint */
const EPOXY = '#aab4f4'
/** what a phone camera shows when it sees infrared */
const SEEN = '#d7b8ff'

/** The rim at the bottom of the lens, with the flat that marks the − leg. */
function rimGeometry() {
  const shape = new THREE.Shape()
  const r = 0.35
  const flat = 0.29
  const a = Math.acos(flat / r)
  shape.absarc(0, 0, r, a, Math.PI * 2 - a, false)
  shape.closePath()
  // drawn in x-y, stood up so it is a flat ring round the y axis
  return new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: false, curveSegments: 40 }).rotateX(-Math.PI / 2)
}

/**
 * A 5 mm infrared LED. Its light is invisible to your eyes, so with them it
 * never looks lit, however much current flows. A phone camera can see infrared,
 * so through the camera it glows a purple-white.
 */
export function IrLedModel({ level, burnt, camera }: { level: number; burnt: boolean; camera: boolean }) {
  const rim = useBuilt(rimGeometry)
  const seen = useRef(0)
  const lens = useRef<THREE.MeshStandardMaterial>(null)
  const dome = useRef<THREE.MeshStandardMaterial>(null)
  const die = useRef<THREE.MeshStandardMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  const glow = useRef(0)
  const core = useRef(0)

  useFrame((_, dt) => {
    // only the camera sees the light; to your eyes nothing changes at all
    const target = !burnt && camera ? Math.min(1.3, Math.max(0, level)) : 0
    seen.current = damp(seen.current, target, 18, dt)
    const b = seen.current
    if (lens.current) lens.current.emissiveIntensity = b * 0.45
    if (dome.current) dome.current.emissiveIntensity = b * 0.45
    if (die.current) die.current.emissiveIntensity = b * 7
    if (light.current) light.current.intensity = b * 2.2
    glow.current = b * 0.7
    core.current = b * 0.75
  })

  const epoxy = burnt ? '#3f3f46' : EPOXY

  return (
    <group position={[0, -0.02, 0]} rotation={[0.15, 0, 0]}>
      {/* the clear epoxy body, the dome and the rim with its flat */}
      <mesh position={[0, 0.22, 0]} renderOrder={2}>
        <cylinderGeometry args={[0.3, 0.3, 0.52, 40, 1, true]} />
        <meshStandardMaterial
          ref={lens}
          color={epoxy}
          emissive={SEEN}
          emissiveIntensity={0}
          transparent
          opacity={0.42}
          roughness={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.48, 0]} renderOrder={2}>
        <sphereGeometry args={[0.3, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          ref={dome}
          color={epoxy}
          emissive={SEEN}
          emissiveIntensity={0}
          transparent
          opacity={0.5}
          roughness={0.08}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={rim} position={[0, -0.105, 0]} renderOrder={2}>
        <meshStandardMaterial color={epoxy} transparent opacity={0.62} roughness={0.15} depthWrite={false} />
      </mesh>

      {/* inside the clear lens: the big anvil (−) with its cup and chip, the thin post (+) and the bond wire */}
      <mesh position={[0.1, 0.03, 0]}>
        <boxGeometry args={[0.15, 0.22, 0.025]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0.08, 0.17, 0]}>
        <cylinderGeometry args={[0.085, 0.05, 0.08, 20]} />
        <meshStandardMaterial color="#b9bec6" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0.08, 0.215, 0]}>
        <boxGeometry args={[0.065, 0.025, 0.065]} />
        <meshStandardMaterial ref={die} color={burnt ? '#111' : '#2c2a35'} emissive="#ffffff" emissiveIntensity={0} toneMapped={false} />
      </mesh>
      <mesh position={[-0.11, 0.06, 0]}>
        <boxGeometry args={[0.07, 0.24, 0.025]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <Lead
        points={[
          [-0.11, 0.18, 0],
          [-0.04, 0.3, 0],
          [0.06, 0.24, 0],
          [0.08, 0.23, 0],
        ]}
        radius={0.006}
        color="#e5c76b"
      />

      {/* legs: the longer one is + (anode) */}
      <mesh position={[-0.11, -0.52, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.86, 8]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0.11, -0.43, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.68, 8]} />
        <meshStandardMaterial {...METAL} />
      </mesh>

      {/* through a camera: a wide violet bloom with a white-hot middle */}
      <Halo color={SEEN} intensity={glow} position={[0, 0.3, 0.12]} scale={1.7} />
      <Halo color="#ffffff" intensity={core} position={[0.06, 0.22, 0.1]} scale={0.5} />
      <pointLight ref={light} position={[0, 0.35, 0.5]} color={SEEN} intensity={0} distance={3} decay={1.5} />
      {/* small puffs, so they fade before the top of the window */}
      <group position={[0, 0.5, 0]} scale={0.55}>
        <Smoke active={burnt} position={[0, 0, 0]} rise={0.3} />
      </group>
    </group>
  )
}
