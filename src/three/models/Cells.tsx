import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, damp } from '../helpers'
import { Lead } from './kit'
import { BRUSHED, COPPER, METAL, unit, useBuilt } from './shared'

/*
 * The small power sources: a row of lemons, a coin cell in its holder, the
 * hand-crank generator and a USB power bank.
 */

/* ----------------------------------------------------------------- lemon */

const LEMON_HALF = 0.3
const LEMON_R = 0.235
const LEMON_GAP = 0.66

/** A lemon lying along x: round in the middle, a little point at each end, tiny pores all over. */
function lemonGeometry() {
  const points: THREE.Vector2[] = []
  for (let i = 0; i <= 24; i++) {
    const h = -LEMON_HALF + (i / 24) * LEMON_HALF * 2
    const t = Math.abs(h) / LEMON_HALF
    // a soft body, then the nub at each tip
    const r = LEMON_R * Math.pow(Math.max(0, 1 - t * t), 0.6) + (t > 0.86 ? 0.025 * (1 - (t - 0.86) / 0.14) : 0)
    points.push(new THREE.Vector2(Math.max(0.001, r), h))
  }
  const g = new THREE.LatheGeometry(points, 36)
  // pores: tiny dents, the same on every lemon
  const position = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i)
    const radial = Math.hypot(v.x, v.z)
    if (radial < 0.02) continue
    const dent = 1 + 0.012 * Math.sin(v.y * 90) * Math.sin(Math.atan2(v.z, v.x) * 23)
    position.setXYZ(i, v.x * dent, v.y, v.z * dent)
  }
  g.computeVertexNormals()
  g.rotateZ(Math.PI / 2)
  return g
}

/** One lemon with its copper strip (+) and its zinc nail (−) pushed in. */
function OneLemon({ turn }: { turn: number }) {
  const geometry = useBuilt(lemonGeometry)
  return (
    <group rotation={[0, turn, 0]}>
      <mesh geometry={geometry} scale={[1, 0.95, 1]}>
        <meshStandardMaterial color="#facc15" roughness={0.55} emissive="#a16207" emissiveIntensity={0.06} />
      </mesh>
      {/* the stalk end */}
      <mesh position={[-LEMON_HALF - 0.015, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.03, 0.035, 10]} />
        <meshStandardMaterial color="#65a30d" roughness={0.7} />
      </mesh>
      {/* the copper strip on the right, the zinc nail on the left */}
      <mesh position={[0.12, LEMON_R * 0.95 - 0.01, 0.02]} rotation={[0, 0.25, -0.1]}>
        <boxGeometry args={[0.13, 0.18, 0.018]} />
        <meshStandardMaterial {...COPPER} />
      </mesh>
      <group position={[-0.12, LEMON_R * 0.95 + 0.03, 0.02]} rotation={[0, 0, 0.12]}>
        <mesh>
          <cylinderGeometry args={[0.014, 0.014, 0.22, 8]} />
          <meshStandardMaterial color="#a1a1aa" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.014, 14]} />
          <meshStandardMaterial color="#b4b4bb" metalness={0.7} roughness={0.35} />
        </mesh>
      </group>
    </group>
  )
}

/** A little crocodile clip at the end of a wire. */
function Clip({ position, color, angle = 0 }: { position: [number, number, number]; color: string; angle?: number }) {
  return (
    <group position={position} rotation={[0, 0, angle]}>
      <mesh>
        <boxGeometry args={[0.1, 0.045, 0.045]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
      <mesh position={[0.065, 0, 0]}>
        <boxGeometry args={[0.04, 0.03, 0.035]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
    </group>
  )
}

const TURNS = [0.18, -0.12, 0.08, -0.2]

/**
 * Lemon battery: one to four lemons in a row. Copper of one lemon is wired to
 * the nail of the next, so their volts add up, like cells in a battery.
 */
export function LemonModel({ cells }: { cells: number }) {
  const n = Math.min(4, Math.max(1, Math.round(cells)))
  const width = (n - 1) * LEMON_GAP + LEMON_HALF * 2 + 0.5
  const fit = Math.min(1, 2.3 / width)
  const xs = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * LEMON_GAP)
  const top = LEMON_R * 0.95
  return (
    <group position={[0, -0.1, 0]} rotation={[0.3, 0, 0]} scale={fit}>
      {xs.map((x, i) => (
        <group key={i} position={[x, 0, i % 2 === 0 ? 0 : -0.06]}>
          <OneLemon turn={TURNS[i]} />
        </group>
      ))}
      {/* copper of each lemon to the nail of the next one */}
      {xs.slice(0, -1).map((x, i) => (
        <Lead
          key={i}
          points={[
            [x + 0.12, top + 0.1, 0.02],
            [x + LEMON_GAP / 2, top + 0.34, 0.06],
            [x + LEMON_GAP - 0.12, top + 0.16, 0.02],
          ]}
          color={i % 2 === 0 ? '#16a34a' : '#eab308'}
          radius={0.016}
        />
      ))}
      {/* the − lead from the first nail and the + lead from the last copper */}
      <Lead points={[[xs[0] - 0.12, top + 0.16, 0.02], [xs[0] - 0.32, top + 0.22, 0.04], [xs[0] - 0.5, top - 0.1, 0.06]]} color="#18181b" radius={0.016} />
      <Clip position={[xs[0] - 0.13, top + 0.12, 0.02]} color="#18181b" angle={-0.4} />
      <Lead points={[[xs[n - 1] + 0.12, top + 0.1, 0.02], [xs[n - 1] + 0.32, top + 0.22, 0.04], [xs[n - 1] + 0.5, top - 0.1, 0.06]]} color="#dc2626" radius={0.016} />
      <Clip position={[xs[n - 1] + 0.14, top + 0.08, 0.02]} color="#dc2626" angle={0.4 + Math.PI} />
    </group>
  )
}

/* ------------------------------------------------------------- coin cell */

const CELL_R = 0.5
const CELL_T = 0.08

/** The marks pressed into the cell's + face: a big plus and a line of small print. */
function CellMarks() {
  return (
    <group position={[0, CELL_T / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[CELL_R - 0.07, CELL_R - 0.06, 48]} />
        <meshStandardMaterial color="#8b8f97" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-0.2, 0.06, 0]}>
        <boxGeometry args={[0.13, 0.03, 0.002]} />
        <meshStandardMaterial color="#6b7079" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-0.2, 0.06, 0]}>
        <boxGeometry args={[0.03, 0.13, 0.002]} />
        <meshStandardMaterial color="#6b7079" metalness={0.5} roughness={0.5} />
      </mesh>
      {[
        [0.05, 0.08, 0.22],
        [0.03, -0.0, 0.26],
        [0.0, -0.1, 0.16],
      ].map(([x, y, w]) => (
        <mesh key={y} position={[x + w / 2 - 0.06, y, 0]}>
          <boxGeometry args={[w, 0.025, 0.002]} />
          <meshStandardMaterial color="#8b8f97" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Coin cell: a shiny CR2032 in its black holder, the springy clip pressing on
 * its + face. A big load makes it work hard, and it warms up a little.
 */
export function CoinCellModel({ load }: { load: number }) {
  const shell = useRef<THREE.MeshStandardMaterial>(null)
  const warm = useRef(0)

  useFrame((_, dt) => {
    warm.current = damp(warm.current, unit((load - 0.6) * 2.5), 2, dt)
    if (shell.current) shell.current.emissiveIntensity = warm.current * 0.5
  })

  return (
    <group position={[0, -0.06, 0]} rotation={[0.82, 0, 0]}>
      {/* the holder: a black ring with a cut-out at the front */}
      <mesh position={[0, -0.03, 0]}>
        <cylinderGeometry args={[CELL_R + 0.12, CELL_R + 0.14, 0.1, 56, 1, false, 0.5, Math.PI * 2 - 1]} />
        <meshStandardMaterial color="#1c1c1f" roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.07, 0]}>
        <cylinderGeometry args={[CELL_R + 0.12, CELL_R + 0.12, 0.03, 56]} />
        <meshStandardMaterial color="#27272a" roughness={0.6} />
      </mesh>
      {/* the cell */}
      <mesh position={[0, 0.0, 0]}>
        <cylinderGeometry args={[CELL_R, CELL_R, CELL_T, 56]} />
        <meshStandardMaterial ref={shell} {...BRUSHED} emissive="#ff6a3d" emissiveIntensity={0} />
      </mesh>
      <mesh position={[0, -CELL_T / 2 - 0.004, 0]}>
        <cylinderGeometry args={[CELL_R - 0.05, CELL_R - 0.05, 0.01, 48]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.5} roughness={0.4} />
      </mesh>
      <CellMarks />
      {/* the springy clip over the top */}
      <group position={[0.18, CELL_T / 2 + 0.03, -0.1]} rotation={[0, -0.5, 0]}>
        <mesh>
          <boxGeometry args={[0.64, 0.025, 0.12]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        <mesh position={[0.36, -0.06, 0]} rotation={[0, 0, -0.9]}>
          <boxGeometry args={[0.16, 0.025, 0.12]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        <mesh position={[-0.2, -0.016, 0]}>
          <sphereGeometry args={[0.03, 12, 8]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      </group>
    </group>
  )
}

/* ---------------------------------------------------------------- dynamo */

const ARM = 0.4
const GEARBOX_X = -0.32
/** turns a second at full speed */
const TURNS_PER_SECOND = 1.6
/** the little motor inside spins this many times faster than the crank */
const GEAR_RATIO = 5

/** A gear with square teeth, flat in the xy plane. */
function gearGeometry() {
  const shape = new THREE.Shape()
  const teeth = 14
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2
    const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2
    const r = i % 2 === 0 ? 0.25 : 0.21
    if (i === 0) shape.moveTo(Math.cos(a0) * r, Math.sin(a0) * r)
    else shape.lineTo(Math.cos(a0) * r, Math.sin(a0) * r)
    shape.lineTo(Math.cos(a1) * r, Math.sin(a1) * r)
  }
  shape.holes.push(new THREE.Path().absarc(0, 0, 0.04, 0, Math.PI * 2, true))
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false })
  g.translate(0, 0, -0.015)
  return g
}

/**
 * Crank generator: turn the red handle and the gears spin a little motor
 * backwards, so it makes power. The faster the crank turns, the more volts.
 */
export function DynamoModel({ speed, output }: { speed: number; output: number }) {
  const gear = useBuilt(gearGeometry)
  const crank = useRef<THREE.Group>(null)
  const gearMesh = useRef<THREE.Mesh>(null)
  const rotor = useRef<THREE.Group>(null)
  const turn = useRef(unit(speed))
  const glow = useRef(0)

  useFrame((_, dt) => {
    turn.current = damp(turn.current, unit(speed), 3, dt)
    const w = turn.current * TURNS_PER_SECOND * Math.PI * 2
    if (crank.current) crank.current.rotation.z -= w * dt
    if (gearMesh.current) gearMesh.current.rotation.z -= w * dt
    if (rotor.current) rotor.current.rotation.x += w * GEAR_RATIO * dt
    glow.current = unit(output) * 0.4
  })

  return (
    <group position={[0.04, -0.05, 0]} rotation={[0.3, -0.42, 0]}>
      {/* the motor that makes the power, its end cap spinning */}
      <group position={[0.38, -0.08, -0.05]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.27, 0.27, 0.66, 32]} />
          <meshStandardMaterial color="#52525b" metalness={0.55} roughness={0.35} />
        </mesh>
        {[-0.18, 0, 0.18].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.272, 0.008, 6, 32]} />
            <meshStandardMaterial color="#3f3f46" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
        <group ref={rotor} position={[0.34, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.03, 24]} />
            <meshStandardMaterial {...BRUSHED} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0.017, 0, 0]} rotation={[(i * Math.PI) / 3, 0, 0]}>
              <boxGeometry args={[0.006, 0.34, 0.04]} />
              <meshStandardMaterial color="#71717a" />
            </mesh>
          ))}
        </group>
        <Halo color="#fde68a" intensity={glow} position={[0.4, 0, 0.1]} scale={0.6} />
      </group>
      {/* the orange gearbox, with a window onto the big gear */}
      <group position={[GEARBOX_X, -0.02, 0]}>
        <RoundedBox args={[0.68, 0.74, 0.44]} radius={0.06} smoothness={3}>
          <meshStandardMaterial color="#ea580c" roughness={0.45} />
        </RoundedBox>
        <mesh position={[0, 0, 0.221]}>
          <circleGeometry args={[0.29, 40]} />
          <meshStandardMaterial color="#431407" roughness={0.8} />
        </mesh>
        <mesh ref={gearMesh} geometry={gear} position={[0, 0, 0.226]}>
          <meshStandardMaterial color="#e5c76b" metalness={0.75} roughness={0.32} />
        </mesh>
        <mesh position={[0, 0, 0.245]} renderOrder={2}>
          <circleGeometry args={[0.3, 40]} />
          <meshStandardMaterial color="#fff7ed" transparent opacity={0.18} roughness={0.05} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0, 0.226]}>
          <torusGeometry args={[0.3, 0.02, 8, 40]} />
          <meshStandardMaterial color="#c2410c" roughness={0.4} />
        </mesh>
        {[
          [-0.27, 0.3],
          [0.27, 0.3],
          [-0.27, -0.3],
          [0.27, -0.3],
        ].map(([x, y]) => (
          <mesh key={`${x}${y}`} position={[x, y, 0.222]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.01, 12]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
        ))}
        {/* the crank: an arm on the axle and a red handle at its end */}
        <group ref={crank} position={[0, 0, 0.27]}>
          <mesh position={[0, 0, 0.0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.08, 18]} />
            <meshStandardMaterial {...BRUSHED} />
          </mesh>
          <mesh position={[0, ARM / 2, 0.04]}>
            <boxGeometry args={[0.07, ARM + 0.06, 0.04]} />
            <meshStandardMaterial {...BRUSHED} />
          </mesh>
          <group position={[0, ARM, 0.15]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <capsuleGeometry args={[0.055, 0.14, 6, 16]} />
              <meshStandardMaterial color="#dc2626" roughness={0.35} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------ power bank */

const BANK_W = 1.5
const BANK_H = 0.3
const BANK_D = 0.78

/**
 * USB power bank: a slim box with four blue lights that show it is full. They
 * light up while it gives power, and blink when something takes too much.
 */
export function PowerBankModel({ on, limiting }: { on: boolean; limiting: boolean }) {
  const lights = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const lit = useRef(on ? 1 : 0)
  const glow = useRef(0)

  useFrame(({ clock }, dt) => {
    lit.current = damp(lit.current, on ? 1 : 0, 8, dt)
    const blink = limiting ? (Math.sin(clock.elapsedTime * 10) > 0 ? 1 : 0.15) : 1
    lights.current.forEach((m) => {
      if (m) m.emissiveIntensity = 0.04 + lit.current * blink * 2.4
    })
    glow.current = lit.current * blink * 0.35
  })

  return (
    <group position={[-0.23, -0.08, 0]} rotation={[0.62, -0.3, 0]}>
      <RoundedBox args={[BANK_W, BANK_H, BANK_D]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color="#1e293b" roughness={0.38} metalness={0.25} />
      </RoundedBox>
      {/* a glossy top panel and its four lights */}
      <mesh position={[0, BANK_H / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BANK_W - 0.3, BANK_D - 0.24]} />
        <meshStandardMaterial color="#334155" roughness={0.18} metalness={0.3} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.36 + i * 0.13, BANK_H / 2 + 0.006, 0.22]}>
          <cylinderGeometry args={[0.025, 0.025, 0.01, 14]} />
          <meshStandardMaterial
            ref={(m) => {
              lights.current[i] = m
            }}
            color="#bae6fd"
            emissive="#38bdf8"
            emissiveIntensity={0.04}
            toneMapped={false}
          />
        </mesh>
      ))}
      <Halo color="#7dd3fc" intensity={glow} position={[-0.17, BANK_H / 2 + 0.06, 0.22]} scale={0.9} />
      {/* the button */}
      <mesh position={[0.36, BANK_H / 2 + 0.008, 0.22]}>
        <cylinderGeometry args={[0.045, 0.045, 0.016, 18]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      {/* the USB port on its end, with a plug and cable in it */}
      <group position={[BANK_W / 2, 0, 0.05]}>
        <mesh position={[0.005, 0, 0]}>
          <boxGeometry args={[0.012, 0.09, 0.26]} />
          <meshStandardMaterial color="#09090b" />
        </mesh>
        <mesh position={[0.07, 0, 0]}>
          <boxGeometry args={[0.13, 0.1, 0.25]} />
          <meshStandardMaterial {...BRUSHED} />
        </mesh>
        <RoundedBox args={[0.22, 0.15, 0.32]} radius={0.04} smoothness={2} position={[0.24, 0, 0]}>
          <meshStandardMaterial color="#e4e4e7" roughness={0.5} />
        </RoundedBox>
        <Lead points={[[0.34, 0, 0], [0.48, -0.04, 0.05], [0.5, -0.3, 0.28]]} color="#e4e4e7" radius={0.035} />
      </group>
      <mesh position={[-BANK_W / 2 - 0.002, 0, 0.05]}>
        <boxGeometry args={[0.006, 0.05, 0.14]} />
        <meshStandardMaterial color="#09090b" />
      </mesh>
    </group>
  )
}
