import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Halo, damp, getGlowTexture } from '../helpers'

const WIDTH = 2.1
const HEIGHT = 1.3
const FRAME = 0.08
const COLS = 5
const ROWS = 3
const GAP = 0.025
const FIELD_W = WIDTH - 2 * FRAME - 0.04
const FIELD_H = HEIGHT - 2 * FRAME - 0.04
const CELL_W = (FIELD_W - (COLS - 1) * GAP) / COLS
const CELL_H = (FIELD_H - (ROWS - 1) * GAP) / ROWS
const CHAMFER = 0.045
const CELL_Z = 0.012
const BOX_Y = -HEIGHT / 2 - 0.03
const LED: [number, number, number] = [0.72, BOX_Y, 0.135]

const cellX = (c: number) => -FIELD_W / 2 + CELL_W / 2 + c * (CELL_W + GAP)
const cellY = (r: number) => -FIELD_H / 2 + CELL_H / 2 + r * (CELL_H + GAP)

/** Mono cells with clipped corners, like real ones, as one flat mesh. */
function cellsGeometry() {
  const shape = new THREE.Shape()
  const w = CELL_W / 2
  const h = CELL_H / 2
  const c = CHAMFER
  shape.moveTo(-w + c, -h)
  shape.lineTo(w - c, -h)
  shape.lineTo(w, -h + c)
  shape.lineTo(w, h - c)
  shape.lineTo(w - c, h)
  shape.lineTo(-w + c, h)
  shape.lineTo(-w, h - c)
  shape.lineTo(-w, -h + c)
  const cells: THREE.BufferGeometry[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let col = 0; col < COLS; col++) cells.push(new THREE.ShapeGeometry(shape).translate(cellX(col), cellY(r), 0))
  }
  const merged = mergeGeometries(cells) ?? new THREE.BufferGeometry()
  cells.forEach((g) => g.dispose())
  return merged
}

/** Two silver bus bars running down every column of cells. */
function busbarGeometry() {
  const bars: THREE.BufferGeometry[] = []
  for (let col = 0; col < COLS; col++) {
    for (const dx of [-CELL_W / 4, CELL_W / 4]) {
      bars.push(new THREE.BoxGeometry(0.012, FIELD_H - 0.02, 0.004).translate(cellX(col) + dx, 0, 0))
    }
  }
  const merged = mergeGeometries(bars) ?? new THREE.BufferGeometry()
  bars.forEach((g) => g.dispose())
  return merged
}

const aluminium = { color: '#cfd5dd', metalness: 0.85, roughness: 0.32 } as const

/** Small solar panel on a tilt: brighter light sweeps a sheen across the cells. */
export function SolarModel({
  light,
  output,
}: {
  /** 0..1: how much light falls on it */
  light: number
  /** 0..1: how much power it delivers */
  output: number
}) {
  const cells = useMemo(() => cellsGeometry(), [])
  const busbars = useMemo(() => busbarGeometry(), [])
  useEffect(
    () => () => {
      cells.dispose()
      busbars.dispose()
    },
    [cells, busbars],
  )
  const cellMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const sheen = useRef<THREE.Mesh>(null)
  const sheenMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const ledMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const sun = useRef(THREE.MathUtils.clamp(light, 0, 1))
  const power = useRef(0)
  const ledGlow = useRef(0)

  useFrame((_, dt) => {
    sun.current = damp(sun.current, THREE.MathUtils.clamp(Number.isFinite(light) ? light : 0, 0, 1), 4, dt)
    power.current = damp(power.current, THREE.MathUtils.clamp(Number.isFinite(output) ? output : 0, 0, 1), 8, dt)
    const l = sun.current
    if (cellMaterial.current) cellMaterial.current.emissiveIntensity = l * 0.3
    const s = sheen.current
    if (s) {
      // the highlight slides from left to right as the light gets stronger
      s.visible = l > 0.02
      s.position.x = -0.75 + l * 1.15
      s.scale.setScalar(0.8 + l * 0.3)
    }
    if (sheenMaterial.current) sheenMaterial.current.opacity = l * 0.5
    ledGlow.current = power.current * 0.75
    if (ledMaterial.current) ledMaterial.current.emissiveIntensity = 0.05 + power.current * 3
  })

  return (
    <group position={[0, 0.035, 0]} rotation={[-0.5, 0.18, 0]}>
      {/* back sheet that shows between the cells */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[WIDTH - FRAME, HEIGHT - FRAME, 0.04]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh geometry={cells} position={[0, 0, CELL_Z]}>
        <meshStandardMaterial ref={cellMaterial} color="#1b2858" roughness={0.22} metalness={0.55} emissive="#2563eb" emissiveIntensity={0} />
      </mesh>
      <mesh geometry={busbars} position={[0, 0, CELL_Z + 0.002]}>
        <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh ref={sheen} position={[-0.75, 0, CELL_Z + 0.01]} rotation={[0, 0, -0.55]} visible={false} renderOrder={3}>
        <planeGeometry args={[0.5, 1.2]} />
        <meshBasicMaterial
          ref={sheenMaterial}
          map={getGlowTexture()}
          color="#dbeafe"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* aluminium frame */}
      {[-1, 1].map((side) => (
        <RoundedBox key={`h${side}`} args={[WIDTH, FRAME, 0.1]} radius={0.02} smoothness={2} position={[0, side * (HEIGHT / 2 - FRAME / 2), 0.01]}>
          <meshStandardMaterial {...aluminium} />
        </RoundedBox>
      ))}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={`v${side}`}
          args={[FRAME, HEIGHT - 2 * FRAME + 0.01, 0.1]}
          radius={0.02}
          smoothness={2}
          position={[side * (WIDTH / 2 - FRAME / 2), 0, 0.01]}
        >
          <meshStandardMaterial {...aluminium} />
        </RoundedBox>
      ))}

      {/* junction box with its output light */}
      <RoundedBox args={[0.38, 0.17, 0.15]} radius={0.03} smoothness={2} position={[LED[0], BOX_Y, 0.05]}>
        <meshStandardMaterial color="#1f2937" roughness={0.55} />
      </RoundedBox>
      <mesh position={LED} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.02, 16]} />
        <meshStandardMaterial ref={ledMaterial} color="#14532d" emissive="#22c55e" emissiveIntensity={0.05} roughness={0.3} toneMapped={false} />
      </mesh>
      {[-0.1, 0.1].map((dx) => (
        <mesh key={dx} position={[LED[0] + dx, BOX_Y, 0.13]}>
          <boxGeometry args={[0.05, 0.012, 0.004]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.6} />
        </mesh>
      ))}
      <Halo color="#4ade80" intensity={ledGlow} position={[LED[0], BOX_Y, 0.2]} scale={0.7} />
    </group>
  )
}
