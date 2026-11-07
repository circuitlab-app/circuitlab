import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { damp } from '../helpers'
import { Lead } from './kit'
import { useBuilt } from './shared'

const CENTER = -0.12
const TIP = 0.8
const HEAD = -1.02
const COIL_FROM = -0.62
const COIL_TO = 0.56
const TURNS = 13
/** the field lines: ellipses round the bolt, above and below it */
const LOOPS = [
  { b: 0.4, side: 1 },
  { b: 0.62, side: 1 },
  { b: 0.4, side: -1 },
  { b: 0.62, side: -1 },
]
const LOOP_A = 1.08
const DOTS = 2

const NORTH = new THREE.Color('#ef4444')
const SOUTH = new THREE.Color('#3b82f6')
const PLAIN = new THREE.Color('#9ca3af')

/** The path of the wire wound round the bolt. */
class Helix extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super()
  }
  getPoint(s: number, target = new THREE.Vector3()) {
    const a = s * TURNS * Math.PI * 2
    return target.set(COIL_FROM + (COIL_TO - COIL_FROM) * s, Math.cos(a) * 0.19, Math.sin(a) * 0.19)
  }
}

/** Copper wire wound round the bolt. */
const coilGeometry = () => new THREE.TubeGeometry(new Helix(), TURNS * 28, 0.036, 8, false)

function loopGeometry(b: number, side: number) {
  const points = Array.from({ length: 65 }, (_, i) => {
    const t = (i / 64) * Math.PI * 2
    return new THREE.Vector3(CENTER + Math.cos(t) * LOOP_A, side * Math.sin(t) * b, 0)
  })
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 96, 0.009, 5, true)
}

/** A paperclip's bent wire, standing up, about 0.2 wide and 0.5 tall. */
function paperclipGeometry() {
  const points: THREE.Vector3[] = []
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    for (let i = 0; i <= 6; i++) points.push(new THREE.Vector3(x0 + ((x1 - x0) * i) / 6, y0 + ((y1 - y0) * i) / 6, 0))
  }
  const arc = (cx: number, cy: number, r: number, from: number, to: number) => {
    for (let i = 1; i <= 10; i++) {
      const a = from + ((to - from) * i) / 10
      points.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0))
    }
  }
  line(-0.07, -0.1, -0.07, 0.16)
  arc(0, 0.16, 0.07, Math.PI, 0)
  line(0.07, 0.16, 0.07, -0.19)
  arc(0.015, -0.19, 0.055, 0, -Math.PI)
  line(-0.04, -0.19, -0.04, 0.11)
  arc(0, 0.11, 0.04, Math.PI, 0)
  line(0.04, 0.11, 0.04, -0.07)
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.1), 160, 0.013, 6, false)
}

/**
 * An electromagnet: copper wire wound round an iron bolt. With current it
 * becomes a magnet: field lines appear round it (the dots run from N to S),
 * its ends turn red (N) and blue (S), and it pulls a paperclip to its tip.
 * Swap the wires and N and S swap.
 */
export function ElectromagnetModel({ strength, hot }: { strength: number; hot: boolean }) {
  const coil = useBuilt(coilGeometry)
  const loops = useMemo(() => LOOPS.map(({ b, side }) => loopGeometry(b, side)), [])
  useEffect(() => () => loops.forEach((g) => g.dispose()), [loops])
  const clip = useBuilt(paperclipGeometry)
  const field = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const dots = useRef<(THREE.Mesh | null)[]>([])
  const tipCap = useRef<THREE.MeshStandardMaterial>(null)
  const headCap = useRef<THREE.MeshStandardMaterial>(null)
  const winding = useRef<THREE.MeshStandardMaterial>(null)
  const paperclip = useRef<THREE.Group>(null)
  const power = useRef(0)
  const pull = useRef(0)
  const flow = useRef(0)

  useFrame((_, dt) => {
    const s = THREE.MathUtils.clamp(Number.isFinite(strength) ? strength : 0, -1.6, 1.6)
    power.current = damp(power.current, s, 6, dt)
    const p = power.current
    const m = Math.min(1, Math.abs(p))
    field.current.forEach((mat, i) => {
      if (mat) mat.opacity = m * (i % 2 === 0 ? 0.7 : 0.45)
    })
    // the field runs out of N, round the outside, and back into S
    flow.current += dt * 0.35 * Math.sign(p) * (0.4 + m)
    dots.current.forEach((dot, i) => {
      if (!dot) return
      const loop = LOOPS[Math.floor(i / DOTS)]
      const t = (flow.current + (i % DOTS) / DOTS + Math.floor(i / DOTS) * 0.13) * Math.PI * 2
      dot.position.set(CENTER + Math.cos(t) * LOOP_A, loop.side * Math.sin(t) * loop.b, 0)
      dot.visible = m > 0.05
      dot.scale.setScalar(0.6 + m * 0.4)
    })
    const north = p > 0
    if (tipCap.current) tipCap.current.color.copy(PLAIN).lerp(north ? NORTH : SOUTH, m)
    if (headCap.current) headCap.current.color.copy(PLAIN).lerp(north ? SOUTH : NORTH, m)
    if (winding.current) winding.current.emissiveIntensity = hot ? 0.35 : 0
    // either end pulls iron: the paperclip slides over and sticks to the tip
    pull.current = damp(pull.current, Math.min(1, m * 1.6), m > pull.current ? 5 : 3, dt)
    const k = pull.current
    if (paperclip.current) {
      paperclip.current.position.set(1.12 - 0.18 * k, -0.3 + 0.27 * k, 0.06 * (1 - k))
      paperclip.current.rotation.z = -0.5 + 0.42 * k
    }
  })

  return (
    <group position={[-0.06, 0.04, 0]} rotation={[0.22, -0.32, 0]}>
      {/* field lines and the dots that run along them */}
      {loops.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial
            ref={(mat) => {
              field.current[i] = mat
            }}
            color="#fbbf24"
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      {Array.from({ length: LOOPS.length * DOTS }, (_, i) => (
        <mesh
          key={i}
          ref={(dot) => {
            dots.current[i] = dot
          }}
          visible={false}
        >
          <sphereGeometry args={[0.03, 10, 8]} />
          <meshBasicMaterial color="#fde68a" toneMapped={false} />
        </mesh>
      ))}
      {/* the iron bolt: hex head, shaft, and coloured pole ends */}
      <mesh position={[HEAD, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 0.16, 6]} />
        <meshStandardMaterial color="#8e949d" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[(HEAD + TIP) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, TIP - HEAD, 24]} />
        <meshStandardMaterial color="#9aa0a9" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[TIP - 0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.137, 0.137, 0.1, 24]} />
        <meshStandardMaterial ref={tipCap} color={PLAIN} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[HEAD + 0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.137, 0.137, 0.1, 24]} />
        <meshStandardMaterial ref={headCap} color={PLAIN} roughness={0.4} metalness={0.2} />
      </mesh>
      {/* the copper coil and its two leads */}
      <mesh geometry={coil}>
        <meshStandardMaterial ref={winding} color="#c8702e" metalness={0.8} roughness={0.3} emissive="#ff6a00" emissiveIntensity={0} />
      </mesh>
      <Lead points={[[COIL_FROM, -0.18, 0.06], [COIL_FROM - 0.05, -0.38, 0.22], [COIL_FROM + 0.05, -0.56, 0.3]]} radius={0.022} color="#c8702e" />
      <Lead points={[[COIL_TO, -0.18, 0.06], [COIL_TO + 0.04, -0.38, 0.22], [COIL_TO - 0.06, -0.56, 0.3]]} radius={0.022} color="#c8702e" />
      {/* the paperclip it picks up */}
      <group ref={paperclip} position={[1.12, -0.3, 0.06]} rotation={[0, 0, -0.5]}>
        <mesh geometry={clip}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
        </mesh>
      </group>
    </group>
  )
}
