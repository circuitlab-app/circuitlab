import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Halo, damp } from '../helpers'

const DISC_Y = 0.2
const CERAMIC_R = 0.4
const CERAMIC_T = 0.1
const EPOXY_R = 0.44
const EPOXY_T = 0.16
/** the serpentine stays inside this circle */
const TRACK_R = 0.31
const TRACK_ROWS = 7
const TRACK_PITCH = 0.085
const TRACK_W = 0.034
const GLINT: [number, number, number] = [-0.2, DISC_Y + 0.2, 0.1]

/** The red-orange CdS track: straight runs joined at alternating ends, one mesh. */
function trackGeometry() {
  const ys = Array.from({ length: TRACK_ROWS }, (_, i) => (i - (TRACK_ROWS - 1) / 2) * TRACK_PITCH)
  const halves = ys.map((y) => Math.sqrt(TRACK_R * TRACK_R - y * y) - 0.03)
  // the run between row i and i + 1 turns on the right for even i, on the left for odd i
  const turnX = ys.slice(0, -1).map((_, i) => (i % 2 === 0 ? 1 : -1) * Math.min(halves[i], halves[i + 1]))
  const boxes: THREE.BufferGeometry[] = []
  ys.forEach((y, i) => {
    const prev = i > 0 ? turnX[i - 1] : -Math.sign(turnX[0]) * halves[0]
    const next = i < turnX.length ? turnX[i] : -Math.sign(turnX[i - 1]) * halves[i]
    boxes.push(new THREE.BoxGeometry(Math.abs(next - prev) + TRACK_W, TRACK_W, 0.008).translate((prev + next) / 2, y, 0))
  })
  turnX.forEach((x, i) => {
    boxes.push(new THREE.BoxGeometry(TRACK_W, TRACK_PITCH + TRACK_W, 0.008).translate(x, (ys[i] + ys[i + 1]) / 2, 0))
  })
  const merged = mergeGeometries(boxes) ?? new THREE.BufferGeometry()
  boxes.forEach((g) => g.dispose())
  return merged
}

/** Light-dependent resistor: a ceramic disc with a serpentine track that lights up in bright light. */
export function LdrModel({ light }: { light: number }) {
  const track = useMemo(() => trackGeometry(), [])
  useEffect(() => () => track.dispose(), [track])
  const ceramic = useRef<THREE.MeshStandardMaterial>(null)
  const trackMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const rays = useRef<THREE.Group>(null)
  const rayMaterials = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const level = useRef(THREE.MathUtils.clamp(light, 0, 1))
  const glint = useRef(0)

  useFrame((_, dt) => {
    const target = THREE.MathUtils.clamp(Number.isFinite(light) ? light : 0, 0, 1)
    level.current = damp(level.current, target, 6, dt)
    const l = level.current
    glint.current = l * 0.55
    if (ceramic.current) ceramic.current.emissiveIntensity = l * 0.4
    if (trackMaterial.current) trackMaterial.current.emissiveIntensity = 0.04 + l * 0.55
    if (rays.current) {
      rays.current.visible = l > 0.05
      rays.current.scale.setScalar(0.55 + l * 0.45)
    }
    rayMaterials.current.forEach((m) => {
      if (m) m.opacity = l * 0.75
    })
  })

  return (
    <group position={[0, 0.03, 0]} rotation={[-0.3, 0.35, 0]}>
      <group position={[0, DISC_Y, 0]}>
        {/* ceramic disc */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[CERAMIC_R, CERAMIC_R, CERAMIC_T, 40]} />
          <meshStandardMaterial ref={ceramic} color="#f3ecdc" roughness={0.75} emissive="#fff3c4" emissiveIntensity={0} />
        </mesh>
        <mesh geometry={track} position={[0, 0, CERAMIC_T / 2 + 0.004]}>
          <meshStandardMaterial ref={trackMaterial} color="#e0542a" roughness={0.5} emissive="#ff7a3d" emissiveIntensity={0.04} />
        </mesh>
        {/* clear epoxy coat around it */}
        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={2}>
          <cylinderGeometry args={[EPOXY_R, EPOXY_R, EPOXY_T, 40]} />
          <meshStandardMaterial color="#fff8e6" transparent opacity={0.28} roughness={0.06} depthWrite={false} />
        </mesh>
      </group>

      {/* legs */}
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} position={[x, -0.46, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.52, 8]} />
          <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}

      {/* sun glint that grows with the light */}
      <group ref={rays} position={GLINT} visible={false}>
        {[0, Math.PI / 2, Math.PI / 4, -Math.PI / 4].map((angle, i) => (
          <mesh key={angle} rotation={[0, 0, angle]} renderOrder={4}>
            <planeGeometry args={[i < 2 ? 0.42 : 0.24, 0.022]} />
            <meshBasicMaterial
              ref={(m) => {
                rayMaterials.current[i] = m
              }}
              color="#fffbeb"
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
      <Halo color="#fff7d6" intensity={glint} position={GLINT} scale={1} />
    </group>
  )
}
