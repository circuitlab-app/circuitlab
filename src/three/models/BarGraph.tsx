import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, damp } from '../helpers'
import { Indicator, SidePin } from './kit'
import { METAL, MODULE_TILT, SILK } from './shared'

const BOARD_T = 0.05
const FACE = BOARD_T / 2
const COUNT = 10
const PITCH = 0.142
const BLOCK_Y = 0.17
const BLOCK_H = 0.2

/** 6 green, 2 yellow, 2 red, from the left */
const SEGMENTS = Array.from({ length: COUNT }, (_, i) => {
  const kind = i < 6 ? 0 : i < 8 ? 1 : 2
  return {
    x: (i - (COUNT - 1) / 2) * PITCH,
    lit: ['#2cf07a', '#ffd21f', '#ff3a2e'][kind],
    off: ['#1d3b28', '#3d3519', '#3f1c1a'][kind],
  }
})

/** One segment of the bar graph: dark when off, glowing in its colour when lit. */
function Segment({ x, lit, off, on }: { x: number; lit: string; off: string; on: boolean }) {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const level = useRef(0)
  const glow = useRef(0)
  useFrame((_, dt) => {
    // LEDs snap on and off
    level.current = damp(level.current, on ? 1 : 0, 30, dt)
    if (material.current) material.current.emissiveIntensity = level.current * 1.25
    glow.current = level.current * 0.45
  })
  return (
    <group position={[x, 0, BLOCK_H]}>
      <mesh position={[0, 0, 0.004]}>
        <boxGeometry args={[0.088, 0.38, 0.008]} />
        <meshStandardMaterial ref={material} color={off} emissive={lit} emissiveIntensity={0} roughness={0.32} toneMapped={false} />
      </mesh>
      <Halo color={lit} intensity={glow} position={[0, 0, 0.06]} scale={0.45} />
    </group>
  )
}

/**
 * A 10-segment LED bar graph on its driver board. The chip compares the
 * voltage on IN with the supply and lights that many bars from the left:
 * green, then yellow, then red at the top of the range.
 */
export function BarGraphModel({ bars, powered }: { bars: number; powered: boolean }) {
  const n = powered && Number.isFinite(bars) ? Math.round(bars) : 0

  return (
    <group position={[0.08, 0, 0]} rotation={MODULE_TILT}>
      <RoundedBox args={[2.2, 1.25, BOARD_T]} radius={0.03} smoothness={2}>
        <meshStandardMaterial color="#1d3f8f" roughness={0.55} metalness={0.1} />
      </RoundedBox>
      {/* mounting holes with their plated rings */}
      {[
        [-0.95, 0.5],
        [0.95, 0.5],
        [-0.95, -0.5],
        [0.95, -0.5],
      ].map(([x, y]) => (
        <group key={`${x}${y}`} position={[x, y, FACE + 0.001]}>
          <mesh>
            <ringGeometry args={[0.045, 0.075, 20]} />
            <meshStandardMaterial color="#d8dde3" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.045, 20]} />
            <meshStandardMaterial color="#0b1020" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* the bar graph block: black face with ten segments, and its legs along both long sides */}
      <group position={[0, BLOCK_Y, FACE]}>
        <RoundedBox args={[COUNT * PITCH + 0.12, 0.56, BLOCK_H]} radius={0.012} smoothness={2} position={[0, 0, BLOCK_H / 2]}>
          <meshStandardMaterial color="#17171a" roughness={0.45} />
        </RoundedBox>
        {/* the chamfer that marks pin 1 */}
        <mesh position={[-(COUNT * PITCH + 0.12) / 2 + 0.03, -0.25, BLOCK_H + 0.001]} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.06, 0.06]} />
          <meshStandardMaterial color="#3a3a40" roughness={0.6} />
        </mesh>
        {SEGMENTS.map(({ x, lit, off }, i) => (
          <Segment key={x} x={x} lit={lit} off={off} on={i < n} />
        ))}
        {SEGMENTS.map(({ x }) =>
          [1, -1].map((side) => (
            <mesh key={`${x}${side}`} position={[x, side * 0.3, 0.025]}>
              <boxGeometry args={[0.05, 0.06, 0.03]} />
              <meshStandardMaterial {...METAL} />
            </mesh>
          )),
        )}
      </group>

      {/* the driver chip with its legs and pin-1 dot, a trimmer and two small parts */}
      <group position={[-0.2, -0.38, FACE]}>
        <RoundedBox args={[0.66, 0.22, 0.07]} radius={0.01} smoothness={2} position={[0, 0, 0.035]}>
          <meshStandardMaterial color="#1a1a1d" roughness={0.45} />
        </RoundedBox>
        <mesh position={[-0.28, -0.06, 0.071]}>
          <circleGeometry args={[0.018, 12]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.6} />
        </mesh>
        {Array.from({ length: 9 }, (_, i) =>
          [1, -1].map((side) => (
            <mesh key={`${i}${side}`} position={[-0.28 + i * 0.07, side * 0.13, 0.012]}>
              <boxGeometry args={[0.03, 0.06, 0.02]} />
              <meshStandardMaterial {...METAL} />
            </mesh>
          )),
        )}
      </group>
      <group position={[0.42, -0.38, FACE]}>
        <RoundedBox args={[0.2, 0.2, 0.1]} radius={0.015} smoothness={2} position={[0, 0, 0.05]}>
          <meshStandardMaterial color="#1e5bd6" roughness={0.45} />
        </RoundedBox>
        <mesh position={[0, 0, 0.102]}>
          <circleGeometry args={[0.07, 20]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.104]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.1, 0.022, 0.004]} />
          <meshStandardMaterial color="#52525b" />
        </mesh>
      </group>
      {[0.66, 0.78].map((x, i) => (
        <group key={x} position={[x, -0.3 - i * 0.12, FACE + 0.02]}>
          <mesh>
            <boxGeometry args={[0.12, 0.06, 0.04]} />
            <meshStandardMaterial color={i === 0 ? '#1c1c1f' : '#b59a72'} roughness={0.5} />
          </mesh>
          {[-0.05, 0.05].map((dx) => (
            <mesh key={dx} position={[dx, 0, 0]}>
              <boxGeometry args={[0.025, 0.062, 0.042]} />
              <meshStandardMaterial {...METAL} />
            </mesh>
          ))}
        </group>
      ))}
      <Indicator position={[0.86, -0.12, FACE + 0.02]} color="#ef4444" off="#fecaca" level={powered ? 0.7 : 0} size={[0.07, 0.045, 0.035]} halo={0.3} />

      {/* header pins where the card's terminals are: + above − on the left, IN on the right */}
      <SidePin x={-1.1} y={0.225} z={FACE + 0.06} direction={-1} length={0.22} />
      <SidePin x={-1.1} y={-0.225} z={FACE + 0.06} direction={-1} length={0.22} />
      <SidePin x={1.1} y={0} z={FACE + 0.06} direction={1} length={0.22} />
      <mesh position={[-0.94, 0.225, FACE + 0.003]}>
        <boxGeometry args={[0.06, 0.06, 0.004]} />
        <meshStandardMaterial color="#ef4444" roughness={0.6} />
      </mesh>
      <mesh position={[-0.94, -0.225, FACE + 0.003]}>
        <boxGeometry args={[0.06, 0.06, 0.004]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.6} />
      </mesh>
      <mesh position={[0.95, 0, FACE + 0.003]}>
        <boxGeometry args={[0.05, 0.014, 0.004]} />
        <meshStandardMaterial {...SILK} />
      </mesh>
    </group>
  )
}
