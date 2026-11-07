import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { damp } from '../helpers'
import { Lead } from './kit'
import { useBuilt } from './shared'

const R = 0.8
const BOTTOM = -0.55
const TOP = 0.4
const WATER = 0.02
const Z = 0.05
/** where the tube's end pours, and where the stream lands */
const SPOUT: [number, number] = [0.42, 0.45]
const TUBE_R = 0.045
const TUBE_SEGMENTS = 90
const TUBE_SIDES = 10
const SAMPLES = 160
const BEADS = 9
const DROPS = 4
const RIPPLES = 3
const SPLASHES = 4
const BUBBLES = 3

/** The clear tube: up from the pump's outlet, over a bend, and down to pour back in. */
function tubePoints() {
  const points: THREE.Vector3[] = []
  for (let y = -0.1; y < 0.6; y += 0.05) points.push(new THREE.Vector3(-0.02, y, Z))
  const cx = (SPOUT[0] - 0.02) / 2
  const r = (SPOUT[0] + 0.02) / 2
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI - (i / 12) * Math.PI
    points.push(new THREE.Vector3(cx + Math.cos(a) * r, 0.6 + Math.sin(a) * r * 0.85, Z))
  }
  for (let y = 0.55; y >= SPOUT[1] - 0.001; y -= 0.05) points.push(new THREE.Vector3(SPOUT[0], y, Z))
  return new THREE.CatmullRomCurve3(points, false, 'centripetal')
}

const tubeGeometry = () => new THREE.TubeGeometry(tubePoints(), TUBE_SEGMENTS, TUBE_R, TUBE_SIDES, false)
const waterGeometry = () => new THREE.TubeGeometry(tubePoints(), TUBE_SEGMENTS, TUBE_R * 0.68, TUBE_SIDES, false)

/** A beaker's printed scale: a long mark every 100 ml and a short one between. */
const MARKS = [-0.36, -0.22, -0.08, 0.06, 0.2].map((y, i) => ({ y, long: i % 2 === 0 }))

/**
 * A little 5 V water pump sitting at the bottom of a beaker. When it runs it
 * pushes water up the clear tube, over the bend and back into the beaker, like
 * a tiny fountain: faster with more volts. With no power the water in the tube
 * sinks back to the level in the beaker.
 */
export function PumpModel({ flow }: { flow: number }) {
  const tube = useBuilt(tubeGeometry)
  const water = useBuilt(waterGeometry)
  // points along the tube for the moving water, and where the tube leaves the water
  const { path, rest } = useMemo(() => {
    const points = tubePoints().getSpacedPoints(SAMPLES - 1)
    const below = points.findIndex((p) => p.y > WATER)
    return { path: points, rest: Math.max(0, below) / (SAMPLES - 1) }
  }, [])
  const speed = useRef(0)
  const fill = useRef(rest)
  const phase = useRef(0)
  const body = useRef<THREE.Group>(null)
  const beads = useRef<(THREE.Mesh | null)[]>([])
  const drops = useRef<(THREE.Mesh | null)[]>([])
  const ripples = useRef<(THREE.Mesh | null)[]>([])
  const splashes = useRef<(THREE.Mesh | null)[]>([])
  const bubbles = useRef<(THREE.Mesh | null)[]>([])
  const stream = useRef<THREE.Mesh>(null)
  const streamMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const surface = useRef<THREE.Mesh>(null)

  useFrame(({ clock }, dt) => {
    const target = Number.isFinite(flow) ? THREE.MathUtils.clamp(flow, 0, 1.6) : 0
    // the impeller spins up and down in a moment
    speed.current = damp(speed.current, target, 4, dt)
    const f = speed.current < 0.01 ? 0 : speed.current
    phase.current += dt * f
    const t = clock.elapsedTime

    // the tube fills from the pump up, and drains back when it stops
    fill.current = f > 0.05 ? Math.min(1, fill.current + dt * (0.6 + f * 2.2)) : Math.max(rest, fill.current - dt * 1.6)
    water.setDrawRange(0, Math.round(fill.current * TUBE_SEGMENTS) * TUBE_SIDES * 6)
    const pouring = fill.current >= 0.999 ? Math.min(1, f * 1.6) : 0

    if (body.current) {
      const shake = Math.min(1, f) * 0.004
      body.current.position.set(Math.sin(t * 91) * shake, Math.cos(t * 77) * shake, 0)
    }
    // brighter bits of water running along the tube
    beads.current.forEach((bead, i) => {
      if (!bead) return
      const u = (phase.current * 0.9 + i / BEADS) % 1
      bead.visible = f > 0.02 && u <= fill.current
      if (!bead.visible) return
      const k = u * (SAMPLES - 1)
      const a = path[Math.floor(k)]
      const b = path[Math.min(SAMPLES - 1, Math.floor(k) + 1)]
      bead.position.lerpVectors(a, b, k - Math.floor(k))
    })
    // the stream that falls from the tube's end, with drops running down it
    const fallTop = SPOUT[1] - 0.01
    const fall = fallTop - WATER
    if (stream.current) stream.current.visible = pouring > 0.01
    if (streamMaterial.current) streamMaterial.current.opacity = pouring * 0.55
    drops.current.forEach((drop, i) => {
      if (!drop) return
      const u = (phase.current * 2.4 + i / DROPS) % 1
      drop.visible = pouring > 0.01
      // falling faster and faster
      drop.position.set(SPOUT[0] + Math.sin(t * 13 + i) * 0.004, fallTop - fall * u * u, Z)
    })
    // rings spreading where the stream lands, and a few splashes
    ripples.current.forEach((ring, i) => {
      if (!ring) return
      const u = (phase.current * 1.3 + i / RIPPLES) % 1
      ring.visible = pouring > 0.01
      ring.scale.setScalar(0.3 + u * 1.9)
      ;(ring.material as THREE.MeshBasicMaterial).opacity = (1 - u) * 0.7 * pouring
    })
    splashes.current.forEach((drop, i) => {
      if (!drop) return
      const u = (phase.current * 3.1 + i / SPLASHES) % 1
      const a = i * 1.9 + Math.floor(phase.current * 3.1 + i / SPLASHES) * 2.4
      drop.visible = pouring > 0.2
      const out = u * 0.11
      drop.position.set(SPOUT[0] + Math.cos(a) * out, WATER + 4 * u * (1 - u) * 0.07 * pouring, Z + Math.sin(a) * out)
    })
    // air pulled under by the stream bubbles back up
    bubbles.current.forEach((bubble, i) => {
      if (!bubble) return
      const u = (phase.current * 0.8 + i / BUBBLES) % 1
      bubble.visible = pouring > 0.2
      bubble.position.set(SPOUT[0] + Math.sin(u * 9 + i) * 0.03 - 0.03 * i, WATER - 0.26 + u * 0.24, Z + 0.04 * (i - 1))
    })
    // the surface trembles a little while water pours in
    if (surface.current) surface.current.position.y = WATER + Math.sin(t * 17) * 0.003 * pouring
  })

  // the spout points back and to the left
  const spout = (205 * Math.PI) / 180

  return (
    <group position={[0.1, 0.04, 0]} rotation={[0.3, -0.22, 0]}>
      {/* the pump on the bottom: black body, motor end, inlet grille and outlet */}
      <group ref={body}>
        <group position={[-0.15, BOTTOM + 0.2, Z]}>
          <RoundedBox args={[0.44, 0.3, 0.32]} radius={0.06} smoothness={3}>
            <meshStandardMaterial color="#1d1e21" roughness={0.5} />
          </RoundedBox>
          <mesh position={[-0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.13, 0.13, 0.08, 28]} />
            <meshStandardMaterial color="#26272b" roughness={0.45} />
          </mesh>
          <mesh position={[-0.282, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <circleGeometry args={[0.1, 24]} />
            <meshStandardMaterial color="#323338" roughness={0.4} />
          </mesh>
          {/* the slots it drinks through */}
          <mesh position={[0.04, -0.02, 0.161]}>
            <circleGeometry args={[0.095, 24]} />
            <meshStandardMaterial color="#0c0c0e" roughness={0.8} />
          </mesh>
          {[-0.045, 0, 0.045].map((x) => (
            <mesh key={x} position={[0.04 + x, -0.02, 0.165]}>
              <boxGeometry args={[0.018, 0.17, 0.01]} />
              <meshStandardMaterial color="#2a2b30" roughness={0.5} />
            </mesh>
          ))}
          <mesh position={[0.13, 0.19, 0]}>
            <cylinderGeometry args={[0.06, 0.07, 0.1, 20]} />
            <meshStandardMaterial color="#1d1e21" roughness={0.5} />
          </mesh>
        </group>
      </group>
      {/* the wires climb up the wall, over the rim and hang down outside */}
      {[
        { z: -0.12, color: '#dc2626' },
        { z: -0.04, color: '#1f2328' },
      ].map(({ z, color }, i) => (
        <group key={color}>
          <Lead
            points={[
              [-0.44, BOTTOM + 0.2 - i * 0.04, Z + z + 0.06],
              [-0.62, BOTTOM + 0.26, z],
              [-0.74, 0.18, z],
              [-0.8, TOP + 0.07, z],
              [-0.9, 0.3, z + 0.02],
              [-0.97, -0.16, z + 0.08],
              [-0.95 + i * 0.05, BOTTOM + 0.06, z + 0.16],
            ]}
            radius={0.022}
            color={color}
          />
          <mesh position={[-0.95 + i * 0.05, BOTTOM + 0.01, z + 0.17]}>
            <cylinderGeometry args={[0.012, 0.012, 0.09, 6]} />
            <meshStandardMaterial color="#d6d3d1" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* the clear tube and the water inside it */}
      <mesh geometry={water} renderOrder={3}>
        <meshStandardMaterial color="#2b84de" transparent opacity={0.72} roughness={0.2} depthWrite={false} />
      </mesh>
      <mesh geometry={tube} renderOrder={5}>
        <meshStandardMaterial color="#e6f4ff" transparent opacity={0.3} roughness={0.1} depthWrite={false} />
      </mesh>
      {Array.from({ length: BEADS }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            beads.current[i] = m
          }}
          visible={false}
          renderOrder={4}
        >
          <sphereGeometry args={[0.024, 8, 6]} />
          <meshBasicMaterial color="#c7e8ff" toneMapped={false} />
        </mesh>
      ))}

      {/* the falling stream, its drops, the rings and splashes it makes, and bubbles */}
      <mesh ref={stream} position={[SPOUT[0], (SPOUT[1] + WATER) / 2, Z]} visible={false} renderOrder={4}>
        <cylinderGeometry args={[0.02, 0.026, SPOUT[1] - WATER, 10, 1, true]} />
        <meshBasicMaterial ref={streamMaterial} color="#6cb8f5" transparent opacity={0} depthWrite={false} />
      </mesh>
      {Array.from({ length: DROPS }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            drops.current[i] = m
          }}
          visible={false}
          scale={[1, 1.6, 1]}
          renderOrder={4}
        >
          <sphereGeometry args={[0.026, 8, 6]} />
          <meshBasicMaterial color="#d6efff" toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: RIPPLES }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            ripples.current[i] = m
          }}
          position={[SPOUT[0], WATER + 0.004, Z]}
          rotation={[Math.PI / 2, 0, 0]}
          visible={false}
          renderOrder={4}
        >
          <torusGeometry args={[0.1, 0.007, 6, 40]} />
          <meshBasicMaterial color="#e0f2fe" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: SPLASHES }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            splashes.current[i] = m
          }}
          visible={false}
          renderOrder={4}
        >
          <sphereGeometry args={[0.014, 6, 5]} />
          <meshBasicMaterial color="#e0f2fe" toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: BUBBLES }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            bubbles.current[i] = m
          }}
          visible={false}
          renderOrder={2}
        >
          <sphereGeometry args={[0.018 + i * 0.006, 8, 6]} />
          <meshBasicMaterial color="#e0f2fe" transparent opacity={0.8} depthWrite={false} />
        </mesh>
      ))}

      {/* the water in the beaker and its surface */}
      <mesh position={[0, (BOTTOM + 0.04 + WATER) / 2, 0]} renderOrder={1}>
        <cylinderGeometry args={[R - 0.015, R - 0.015, WATER - BOTTOM - 0.04, 48, 1, true]} />
        <meshStandardMaterial color="#3b8fe6" transparent opacity={0.42} roughness={0.15} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={surface} position={[0, WATER, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <circleGeometry args={[R - 0.015, 48]} />
        <meshStandardMaterial color="#7cc0f7" transparent opacity={0.5} roughness={0.05} depthWrite={false} />
      </mesh>
      <mesh position={[0, BOTTOM + 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <circleGeometry args={[R - 0.015, 48]} />
        <meshStandardMaterial color="#3b8fe6" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* the glass beaker: thick base, thin wall, rolled rim, spout and printed scale */}
      <mesh position={[0, BOTTOM + 0.02, 0]} renderOrder={6}>
        <cylinderGeometry args={[R, R, 0.04, 48]} />
        <meshStandardMaterial color="#dbeafe" transparent opacity={0.35} roughness={0.08} depthWrite={false} />
      </mesh>
      <mesh position={[0, (BOTTOM + TOP) / 2, 0]} renderOrder={6}>
        <cylinderGeometry args={[R, R, TOP - BOTTOM, 56, 1, true]} />
        <meshStandardMaterial color="#e0efff" transparent opacity={0.16} roughness={0.05} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, TOP, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={6}>
        <torusGeometry args={[R, 0.018, 8, 64]} />
        <meshStandardMaterial color="#eef6ff" transparent opacity={0.55} roughness={0.05} depthWrite={false} />
      </mesh>
      <group position={[Math.cos(spout) * R, TOP, Math.sin(spout) * R]} rotation={[0, -spout - Math.PI / 2, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} renderOrder={6}>
          <torusGeometry args={[0.08, 0.018, 8, 20, Math.PI]} />
          <meshStandardMaterial color="#eef6ff" transparent opacity={0.55} roughness={0.05} depthWrite={false} />
        </mesh>
      </group>
      {MARKS.map(({ y, long }) => (
        <mesh key={y} position={[0, y, 0]} renderOrder={7}>
          <cylinderGeometry args={[R + 0.003, R + 0.003, 0.014, 12, 1, true, long ? -0.78 : -0.7, long ? 0.26 : 0.12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
