import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Smoke, damp } from '../helpers'
import { Lead } from './kit'
import { COPPER, useBuilt } from './shared'

/* Everything lies along x: the plunger's head is on the left, the push rod comes out on the right. */
const END = 0.63
const PLATE = 0.06
const COIL_R = 0.36
const FLANGE_R = 0.41
const BASE_Y = -0.45
/** how far the plunger moves when the coil pulls it in */
const STROKE = 0.28
/** the head's collar when the rod is in; the spring runs from here to the frame */
const COLLAR_X = -1.14
const ROD_TIP = 0.82

const STEEL = { color: '#c3c8cf', metalness: 0.55, roughness: 0.32 } as const
const SHINY = { color: '#e3e6ea', metalness: 0.85, roughness: 0.16 } as const
const ZINC = { color: '#c9ccc4', metalness: 0.5, roughness: 0.42 } as const

/** The copper windings at the ends of the coil, with a ridge for every turn of wire. */
function windingGeometry() {
  const points: THREE.Vector2[] = []
  const turns = 10
  const steps = turns * 4
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    points.push(new THREE.Vector2(COIL_R - 0.006 + Math.abs(Math.sin(t * turns * Math.PI)) * 0.012, -0.125 + t * 0.25))
  }
  return new THREE.LatheGeometry(points, 40).rotateZ(-Math.PI / 2)
}

const SPRING_TURNS = 6

/** The return spring: steel wire wound 1 long, squashed by scaling x. */
class Coil extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super()
  }
  getPoint(s: number, target = new THREE.Vector3()) {
    const a = s * SPRING_TURNS * Math.PI * 2
    return target.set(s, Math.cos(a) * 0.16, Math.sin(a) * 0.16)
  }
}
const springGeometry = () => new THREE.TubeGeometry(new Coil(), SPRING_TURNS * 24, 0.012, 6, false)

/**
 * A small push solenoid (like the JF-0530B): a coil in an open steel frame
 * with a steel plunger through it. Current turns the coil into a magnet that
 * snaps the plunger in, so the rod with its rubber tip shoots out of the
 * other side; the spring pulls it back when the current stops.
 */
export function SolenoidModel({ push, hot }: { push: number; hot: boolean }) {
  const winding = useBuilt(windingGeometry)
  const spring = useBuilt(springGeometry)
  const plunger = useRef<THREE.Group>(null)
  const springMesh = useRef<THREE.Mesh>(null)
  const copper = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const tape = useRef<THREE.MeshStandardMaterial>(null)
  const pos = useRef(0)
  const vel = useRef(0)
  const heat = useRef(0)

  useFrame(({ clock }, dt) => {
    const pulled = Number.isFinite(push) && push > 0.3
    // small steps so the plunger bounces off its stops the same at any frame rate
    let left = Math.min(dt, 0.06)
    while (left > 1e-5) {
      const h = Math.min(left, 1 / 240)
      left -= h
      // the magnet pulls hard; the spring pushes back toward a bit past "in"
      const a = pulled ? 70 - 12 * pos.current - 6 * vel.current : -70 * (pos.current + 0.4) - 9 * vel.current
      vel.current += a * h
      pos.current += vel.current * h
      if (pos.current > 1) {
        pos.current = 1
        if (vel.current > 0) vel.current *= -0.28
      } else if (pos.current < 0) {
        pos.current = 0
        if (vel.current < 0) vel.current *= -0.22
      }
    }
    const x = pos.current * STROKE
    if (plunger.current) plunger.current.position.x = x
    if (springMesh.current) {
      const from = COLLAR_X + 0.03 + x
      springMesh.current.position.x = from
      springMesh.current.scale.x = -END - PLATE / 2 - from
    }
    heat.current = damp(heat.current, hot ? 1 : 0, 1.5, dt)
    const glow = heat.current * (0.5 + Math.sin(clock.elapsedTime * 5) * 0.12)
    for (const m of copper.current) if (m) m.emissiveIntensity = glow
    if (tape.current) tape.current.emissiveIntensity = glow * 0.6
  })

  return (
    <group position={[-0.06, 0.115, 0]} rotation={[0.4, -0.18, 0]}>
      {/* the bent steel frame: a base with mounting holes and two ends the plunger runs through */}
      <RoundedBox args={[2 * END + PLATE, PLATE, 0.92]} radius={0.012} smoothness={2} position={[0, BASE_Y - PLATE / 2, 0]}>
        <meshStandardMaterial {...ZINC} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <group key={side}>
          <RoundedBox args={[PLATE, 0.9, 0.92]} radius={0.012} smoothness={2} position={[side * END, BASE_Y + 0.42, 0]}>
            <meshStandardMaterial {...ZINC} />
          </RoundedBox>
          {/* the hole the plunger (left) or the push rod (right) slides through */}
          <mesh position={[side * (END + PLATE / 2 + 0.001), 0, 0]} rotation={[0, (side * Math.PI) / 2, 0]}>
            <ringGeometry args={side < 0 ? [0.11, 0.135, 28] : [0.05, 0.075, 20]} />
            <meshStandardMaterial color="#3a3d42" roughness={0.6} />
          </mesh>
          {/* the threaded mounting holes in the ends */}
          {[-0.3, 0.3].map((z) => (
            <mesh key={z} position={[side * (END + PLATE / 2 + 0.001), 0.26, z]} rotation={[0, (side * Math.PI) / 2, 0]}>
              <ringGeometry args={[0.022, 0.045, 16]} />
              <meshStandardMaterial color="#5b5f66" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      {/* the coil: black bobbin cheeks, copper at the ends and yellow tape round the middle */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (END - PLATE / 2 - 0.025), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[FLANGE_R, FLANGE_R, 0.04, 40]} />
          <meshStandardMaterial color="#232326" roughness={0.55} />
        </mesh>
      ))}
      {[-0.43, 0.43].map((x, i) => (
        <mesh key={x} geometry={winding} position={[x, 0, 0]}>
          <meshStandardMaterial
            ref={(m) => {
              copper.current[i] = m
            }}
            {...COPPER}
            emissive="#ff5a1a"
            emissiveIntensity={0}
          />
        </mesh>
      ))}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[COIL_R + 0.012, COIL_R + 0.012, 0.62, 40]} />
        <meshStandardMaterial ref={tape} color="#e6b422" roughness={0.38} metalness={0.05} emissive="#ff6a1a" emissiveIntensity={0} />
      </mesh>
      {/* where the tape's end overlaps, and the little white label */}
      <mesh position={[0, COIL_R + 0.014, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.012, 0.62, 0.006]} />
        <meshStandardMaterial color="#c99611" roughness={0.4} />
      </mesh>
      <group position={[0, 0, COIL_R + 0.014]}>
        <mesh>
          <planeGeometry args={[0.34, 0.2]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>
        {[
          [0.05, 0.24],
          [-0.02, 0.18],
          [-0.07, 0.2],
        ].map(([y, w]) => (
          <mesh key={y} position={[-0.12 + w / 2, y, 0.002]}>
            <planeGeometry args={[w, 0.022]} />
            <meshStandardMaterial color="#52525b" roughness={0.7} />
          </mesh>
        ))}
      </group>
      {/* the two leads out of the bottom of the coil */}
      <Lead points={[[0.36, -0.22, 0.3], [0.42, -0.4, 0.46], [0.6, -0.46, 0.56], [0.8, -0.44, 0.6]]} radius={0.024} color="#dc2626" />
      <Lead points={[[0.26, -0.24, 0.3], [0.3, -0.42, 0.48], [0.48, -0.5, 0.62], [0.68, -0.5, 0.68]]} radius={0.024} color="#1f2328" />
      {[
        [0.82, -0.44, 0.605],
        [0.7, -0.5, 0.685],
      ].map(([x, y, z]) => (
        <mesh key={x} position={[x + 0.03, y, z + 0.008]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.014, 0.014, 0.08, 6]} />
          <meshStandardMaterial color="#d6d3d1" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* the spring between the plunger's collar and the frame */}
      <mesh ref={springMesh} geometry={spring} position={[COLLAR_X + 0.03, 0, 0]} scale={[-END - PLATE / 2 - COLLAR_X - 0.03, 1, 1]}>
        <meshStandardMaterial {...SHINY} />
      </mesh>
      {/* the moving part: plunger, collar with its clip, push rod and rubber tip */}
      <group ref={plunger}>
        <mesh position={[(COLLAR_X - 0.06 + 0.1) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.11, 0.11, 0.1 - COLLAR_X + 0.06, 28]} />
          <meshStandardMaterial {...SHINY} />
        </mesh>
        <mesh position={[COLLAR_X - 0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.11, 0.025, 28]} />
          <meshStandardMaterial {...SHINY} />
        </mesh>
        {/* the cross hole you hook a linkage through */}
        <mesh position={[COLLAR_X - 0.0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.225, 12]} />
          <meshStandardMaterial color="#1b1c1f" roughness={0.6} />
        </mesh>
        <mesh position={[COLLAR_X + 0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.19, 0.19, 0.022, 32]} />
          <meshStandardMaterial {...STEEL} />
        </mesh>
        <mesh position={[COLLAR_X + 0.065, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.125, 0.018, 8, 28, Math.PI * 1.6]} />
          <meshStandardMaterial color="#26282c" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[(0.1 + ROD_TIP) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, ROD_TIP - 0.1, 18]} />
          <meshStandardMaterial {...SHINY} />
        </mesh>
        <mesh position={[ROD_TIP + 0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.085, 0.085, 0.1, 24]} />
          <meshStandardMaterial color="#2a2a2e" roughness={0.85} />
        </mesh>
        <mesh position={[ROD_TIP + 0.1, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[0.085, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2a2a2e" roughness={0.85} />
        </mesh>
      </group>
      {/* smaller puffs, so they fade before the top of the window */}
      <group position={[0, 0.28, 0.05]} scale={0.7}>
        <Smoke active={hot} position={[0, 0, 0]} rise={0.35} color="#7c818a" />
      </group>
    </group>
  )
}
