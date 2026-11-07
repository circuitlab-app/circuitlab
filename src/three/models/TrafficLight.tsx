import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, damp } from '../helpers'
import { GOLD, METAL, SILK } from './shared'

const BOARD_T = 0.06
const FACE = BOARD_T / 2
const LENS_R = 0.15
const VISOR_R = 0.205
const VISOR_L = 0.2
const HALF = 0.9

const LIGHTS = [
  { key: 'r', y: 0.44, lit: '#ff2d2d', off: '#6b1a1a' },
  { key: 'y', y: 0, lit: '#ffc21a', off: '#6e5112' },
  { key: 'g', y: -0.44, lit: '#22e06b', off: '#164a2b' },
] as const

/** The pins along the bottom, left to right: GND, G, Y, R. */
const PINS = [
  { x: -0.18, mark: '#0a0a0a' },
  { x: -0.06, mark: '#22c55e' },
  { x: 0.06, mark: '#eab308' },
  { x: 0.18, mark: '#ef4444' },
]

/** One diffused 8 mm LED with its silk outline, its resistor and a little hood over it. */
function Light({ y, lit, off, level }: { y: number; lit: string; off: string; level: number }) {
  const body = useRef<THREE.MeshStandardMaterial>(null)
  const dome = useRef<THREE.MeshStandardMaterial>(null)
  const glow = useRef(0)
  const on = useRef(0)
  useFrame((_, dt) => {
    on.current = damp(on.current, Math.min(1.3, Math.max(0, Number.isFinite(level) ? level : 0)), 20, dt)
    const b = on.current
    if (body.current) body.current.emissiveIntensity = 0.04 + b * 1.4
    if (dome.current) dome.current.emissiveIntensity = 0.04 + b * 2.2
    glow.current = b * 0.85
  })
  return (
    <group position={[0, y, FACE]}>
      <mesh position={[0, 0, 0.001]}>
        <ringGeometry args={[0.225, 0.238, 40]} />
        <meshStandardMaterial {...SILK} />
      </mesh>
      <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[LENS_R + 0.02, LENS_R + 0.02, 0.025, 32]} />
        <meshStandardMaterial ref={body} color={off} emissive={lit} emissiveIntensity={0.04} roughness={0.45} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[LENS_R, LENS_R, 0.1, 32]} />
        <meshStandardMaterial color={off} emissive={lit} emissiveIntensity={0.04} roughness={0.45} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[LENS_R, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial ref={dome} color={off} emissive={lit} emissiveIntensity={0.04} roughness={0.4} toneMapped={false} />
      </mesh>
      {/* the hood over the top half, like a real traffic light */}
      <mesh position={[0, 0, 0.04 + VISOR_L / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[VISOR_R, VISOR_R, VISOR_L, 32, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#141416" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* its resistor beside it */}
      <group position={[0.29, -0.17, 0.015]}>
        <mesh>
          <boxGeometry args={[0.1, 0.05, 0.03]} />
          <meshStandardMaterial color="#1c1c1f" roughness={0.5} />
        </mesh>
        {[-0.045, 0.045].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <boxGeometry args={[0.022, 0.052, 0.032]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
        ))}
      </group>
      <Halo color={lit} intensity={glow} position={[0, 0, 0.3]} scale={0.95} />
    </group>
  )
}

/**
 * A traffic-light module for Arduino projects: three LEDs (red, yellow, green)
 * with their own resistors on a black board, and four pins. Any light whose pin
 * gets volts (with GND to −) shines.
 */
export function TrafficLightModel({ r, y, g }: { r: number; y: number; g: number }) {
  const levels = { r, y, g }
  return (
    <group position={[0.02, 0.09, 0]} rotation={[-0.42, -0.6, 0]}>
      <RoundedBox args={[0.82, 2 * HALF, BOARD_T]} radius={0.03} smoothness={2}>
        <meshStandardMaterial color="#141518" roughness={0.45} metalness={0.15} />
      </RoundedBox>
      {/* the silkscreen line round the edge of the board */}
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.37, 0, FACE + 0.002]}>
            <boxGeometry args={[0.012, 2 * HALF - 0.08, 0.004]} />
            <meshStandardMaterial {...SILK} />
          </mesh>
          <mesh position={[0, side * (HALF - 0.04), FACE + 0.002]}>
            <boxGeometry args={[0.752, 0.012, 0.004]} />
            <meshStandardMaterial {...SILK} />
          </mesh>
        </group>
      ))}
      {/* the mounting hole at the top */}
      <group position={[0, HALF - 0.12, FACE + 0.001]}>
        <mesh>
          <ringGeometry args={[0.04, 0.07, 20]} />
          <meshStandardMaterial color="#d8dde3" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.04, 20]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>
      {LIGHTS.map(({ key, y: at, lit, off }) => (
        <Light key={key} y={at} lit={lit} off={off} level={levels[key]} />
      ))}

      {/* the pin header along the bottom edge, with a mark above each pin */}
      <mesh position={[0, -HALF + 0.08, FACE + 0.05]}>
        <boxGeometry args={[0.5, 0.11, 0.1]} />
        <meshStandardMaterial color="#18181b" roughness={0.6} />
      </mesh>
      {PINS.map(({ x, mark }, i) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, -HALF - 0.02, FACE + 0.05]}>
            <boxGeometry args={[0.035, 0.26, 0.035]} />
            <meshStandardMaterial {...GOLD} />
          </mesh>
          {i === 0 ? (
            // the ground sign: three lines, each shorter
            [0, 1, 2].map((k) => (
              <mesh key={k} position={[0, -HALF + 0.22 - k * 0.025, FACE + 0.002]}>
                <boxGeometry args={[0.07 - k * 0.022, 0.012, 0.004]} />
                <meshStandardMaterial {...SILK} />
              </mesh>
            ))
          ) : (
            <mesh position={[0, -HALF + 0.2, FACE + 0.002]}>
              <circleGeometry args={[0.032, 16]} />
              <meshStandardMaterial color={mark} roughness={0.6} />
            </mesh>
          )}
        </group>
      ))}
      <mesh position={[0, -HALF + 0.14, FACE + 0.002]}>
        <boxGeometry args={[0.5, 0.012, 0.004]} />
        <meshStandardMaterial {...SILK} />
      </mesh>
    </group>
  )
}
