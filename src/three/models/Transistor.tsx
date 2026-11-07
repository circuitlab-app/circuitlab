import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Halo, Smoke, damp } from '../helpers'

const RADIUS = 0.4
/** distance from the axis to the flat front face */
const FLAT = 0.15
const HEIGHT = 0.68
const BEVEL = 0.03
const BODY_Y = 0.26
const FACE_Z = FLAT + BEVEL
const BODY_BOTTOM = BODY_Y - HEIGHT / 2 - BEVEL
const LEG_END = -0.72

/** TO-92 "D" profile extruded upward, flat face toward +z. */
function bodyGeometry() {
  const w = Math.sqrt(RADIUS * RADIUS - FLAT * FLAT)
  const a = Math.atan2(FLAT, w)
  const shape = new THREE.Shape()
  shape.moveTo(-w, FLAT)
  shape.lineTo(w, FLAT)
  shape.absarc(0, 0, RADIUS, a, Math.PI - a, true)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: HEIGHT,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 3,
    curveSegments: 28,
  })
  geometry.translate(0, 0, -HEIGHT / 2)
  // shape y becomes depth (z), the extrusion becomes height (y)
  geometry.rotateX(Math.PI / 2)
  return geometry
}

/** How the two kinds differ: the PNP (BC557) has an amber light and its own print. */
const VARIANT = {
  npn: { off: '#14532d', light: '#22c55e', halo: '#4ade80', print: [[0.38, 0.42], [0.28, 0.3]] },
  pnp: { off: '#78350f', light: '#f59e0b', halo: '#fbbf24', print: [[0.38, 0.42], [0.28, 0.2]] },
} as const

/** Small transistor in a TO-92 package (NPN BC547 or PNP BC557); a light shows how hard it conducts. */
export function TransistorModel({
  on,
  burnt,
  variant = 'npn',
}: {
  /** 0..1: how much it conducts */
  on: number
  burnt: boolean
  variant?: 'npn' | 'pnp'
}) {
  const look = VARIANT[variant]
  const geometry = useMemo(() => bodyGeometry(), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  const dot = useRef<THREE.MeshStandardMaterial>(null)
  const glow = useRef(0)
  const halo = useRef(0)

  useFrame((_, dt) => {
    const target = burnt ? 0 : THREE.MathUtils.clamp(Number.isFinite(on) ? on : 0, 0, 1)
    glow.current = damp(glow.current, target, 10, dt)
    halo.current = glow.current * 0.8
    if (dot.current) dot.current.emissiveIntensity = 0.05 + glow.current * 3
  })

  return (
    <group position={[0, -0.01, 0]} rotation={[0.3, -0.32, 0]}>
      <mesh geometry={geometry} position={[0, BODY_Y, 0]}>
        <meshStandardMaterial
          color={burnt ? '#0b0a09' : '#1c1c1f'}
          roughness={burnt ? 0.95 : 0.42}
          metalness={burnt ? 0 : 0.1}
          emissive="#7c2d12"
          emissiveIntensity={burnt ? 0.05 : 0}
        />
      </mesh>
      {/* printed type number on the flat face */}
      {look.print.map(([y, w]) => (
        <mesh key={y} position={[0, y, FACE_Z + 0.002]}>
          <boxGeometry args={[w, 0.032, 0.004]} />
          <meshStandardMaterial color={burnt ? '#44403c' : '#d4d4d8'} roughness={0.7} />
        </mesh>
      ))}
      {/* conduction light */}
      <mesh position={[0, 0.13, FACE_Z + 0.004]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.01, 20]} />
        <meshStandardMaterial ref={dot} color={look.off} emissive={look.light} emissiveIntensity={0.05} roughness={0.3} toneMapped={false} />
      </mesh>
      {/* three legs: C, B, E */}
      {[-0.25, 0, 0.25].map((x) => (
        <mesh key={x} position={[x, (BODY_BOTTOM + 0.02 + LEG_END) / 2, -0.05]}>
          <boxGeometry args={[0.05, BODY_BOTTOM + 0.02 - LEG_END, 0.03]} />
          <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      <Halo color={look.halo} intensity={halo} position={[0, 0.13, FACE_Z + 0.08]} scale={1.1} />
      {/* small puffs from the body, so they stay inside the window */}
      <group position={[0, 0.3, 0.2]} scale={0.6}>
        <Smoke active={burnt} position={[0, 0, 0]} rise={0.4} />
      </group>
    </group>
  )
}
