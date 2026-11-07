import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, damp } from '../helpers'

const BEAD_Y = 0.26
const BEAD_R = 0.27
const BEAD_SCALE: [number, number, number] = [1, 1.08, 0.62]
const UP = new THREE.Vector3(0, 1, 0)

type Point = [number, number, number]

/** A straight piece of tinned wire between two points. */
function Wire({ from, to }: { from: Point; to: Point }) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const direction = b.clone().sub(a)
  const length = direction.length()
  const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, direction.normalize())
  return (
    <mesh position={a.add(b).multiplyScalar(0.5)} quaternion={quaternion}>
      <cylinderGeometry args={[0.02, 0.02, length, 8]} />
      <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.25} />
    </mesh>
  )
}

/** NTC thermistor: an epoxy bead on two legs that glows warmer as it heats up. */
export function ThermistorModel({ heat }: { heat: number }) {
  const bead = useRef<THREE.MeshStandardMaterial>(null)
  const warmth = useRef(THREE.MathUtils.clamp(heat, 0, 1))
  const halo = useRef(0)

  useFrame((_, dt) => {
    const target = THREE.MathUtils.clamp(Number.isFinite(heat) ? heat : 0, 0, 1)
    warmth.current = damp(warmth.current, target, 4, dt)
    const h = warmth.current
    if (bead.current) bead.current.emissiveIntensity = h * 0.9
    // only a really hot bead gets a visible haze
    halo.current = Math.max(0, h - 0.55) * 1.4
  })

  return (
    <group position={[0, 0.09, 0]} rotation={[0.3, -0.35, 0]}>
      <mesh position={[0, BEAD_Y, 0]} scale={BEAD_SCALE}>
        <sphereGeometry args={[BEAD_R, 32, 24]} />
        <meshStandardMaterial ref={bead} color="#c2410c" roughness={0.3} metalness={0.05} emissive="#ff5a1f" emissiveIntensity={0} />
      </mesh>
      {/* printed code */}
      <mesh position={[0, BEAD_Y + 0.04, BEAD_R * BEAD_SCALE[2] - 0.004]}>
        <boxGeometry args={[0.16, 0.03, 0.012]} />
        <meshStandardMaterial color="#fde7c7" roughness={0.6} />
      </mesh>
      {/* epoxy that ran down the legs */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.07, BEAD_Y - 0.28, 0]}>
          <cylinderGeometry args={[0.05, 0.03, 0.16, 12]} />
          <meshStandardMaterial color="#c2410c" roughness={0.3} />
        </mesh>
      ))}
      {/* legs: close together under the bead, then spread */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Wire from={[side * 0.07, BEAD_Y - 0.1, 0]} to={[side * 0.07, -0.12, 0]} />
          <Wire from={[side * 0.07, -0.12, 0]} to={[side * 0.16, -0.26, 0]} />
          <Wire from={[side * 0.16, -0.26, 0]} to={[side * 0.16, -0.72, 0]} />
          {[-0.12, -0.26].map((y) => (
            <mesh key={y} position={[side * (y === -0.12 ? 0.07 : 0.16), y, 0]}>
              <sphereGeometry args={[0.02, 8, 6]} />
              <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.25} />
            </mesh>
          ))}
        </group>
      ))}
      <Halo color="#fb923c" intensity={halo} position={[0, BEAD_Y, 0.25]} scale={1.3} />
    </group>
  )
}
