import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, damp } from '../helpers'
import { Rod } from './kit'
import { FACE, ModuleBoard, type SensorProps } from './Sensors'
import { BRUSHED, CHIP, METAL, MODULE_TILT, merge, unit, useBuilt } from './shared'

/*
 * Sensor modules that work with light: the flame sensor (it sees the infrared
 * light of fire), the obstacle sensor (it shines infrared light and waits for
 * it to bounce back) and the line sensor (black takes in its light, white
 * sends it back).
 */

/** The blue trimmer with its brass screw that sets when a module switches. */
function Trimmer({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, FACE]}>
      <mesh position={[0, 0, 0.07]}>
        <boxGeometry args={[0.22, 0.22, 0.14]} />
        <meshStandardMaterial color="#2563eb" roughness={0.4} />
      </mesh>
      <mesh position={[0.05, 0.05, 0.145]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 14]} />
        <meshStandardMaterial color="#d6a84a" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0.05, 0.05, 0.157]}>
        <boxGeometry args={[0.06, 0.012, 0.004]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
    </group>
  )
}

/** The LM393 comparator chip with its eight little legs. */
function Comparator({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, FACE]}>
      <mesh position={[0, 0, 0.022]}>
        <boxGeometry args={[0.24, 0.13, 0.044]} />
        <meshStandardMaterial {...CHIP} />
      </mesh>
      {[-1, 1].flatMap((side) =>
        [0, 1, 2, 3].map((i) => (
          <mesh key={`${side}${i}`} position={[-0.09 + i * 0.06, side * 0.08, 0.008]}>
            <boxGeometry args={[0.025, 0.04, 0.016]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
        )),
      )}
    </group>
  )
}

/** A 5 mm LED lying on its side, pointing along −x, with its two legs bent back to the board. */
function SideLed({
  position,
  color,
  opacity = 1,
  inner,
}: {
  position: [number, number, number]
  color: string
  opacity?: number
  /** the tiny chip seen through a clear LED */
  inner?: string
}) {
  const r = 0.085
  const clear = opacity < 1
  return (
    <group position={position}>
      <mesh position={[-0.11, 0, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={clear ? 2 : 0}>
        <cylinderGeometry args={[r, r, 0.22, 20]} />
        <meshStandardMaterial color={color} roughness={0.12} metalness={0.05} transparent={clear} opacity={opacity} depthWrite={!clear} />
      </mesh>
      <mesh position={[-0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={clear ? 2 : 0}>
        <sphereGeometry args={[r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.12} metalness={0.05} transparent={clear} opacity={opacity} depthWrite={!clear} />
      </mesh>
      <mesh position={[0.005, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r + 0.012, r + 0.012, 0.03, 20]} />
        <meshStandardMaterial color={color} roughness={0.2} transparent={clear} opacity={Math.min(1, opacity + 0.2)} />
      </mesh>
      {inner && (
        <mesh position={[-0.12, 0, 0]}>
          <boxGeometry args={[0.04, 0.05, 0.05]} />
          <meshStandardMaterial color={inner} metalness={0.6} roughness={0.3} />
        </mesh>
      )}
      {[-0.03, 0.03].map((dy) => (
        <Rod key={dy} from={[0.02, dy, 0]} to={[0.12, dy, 0]} radius={0.012} />
      ))}
    </group>
  )
}

/* ----------------------------------------------------------------- flame */

const FLAME_PROFILE = [
  [0, 0],
  [0.045, 0.02],
  [0.07, 0.07],
  [0.068, 0.13],
  [0.045, 0.2],
  [0.018, 0.27],
  [0, 0.31],
].map(([r, y]) => new THREE.Vector2(r, y))

const flameGeometry = () => new THREE.LatheGeometry(FLAME_PROFILE, 20)

const CANDLE_R = 0.1
const CANDLE_H = 0.42
const CANDLE_Y = -0.42
/** the candle slides closer as the fire grows */
const CANDLE_FAR = -1.12
const CANDLE_NEAR = -0.9

/**
 * Flame sensor: a dark infrared eye at the end of a blue module looks at a
 * candle. The slider lights the candle, makes its flame bigger and moves it closer.
 */
export function FlameSensorModel({ sense, level, powered }: SensorProps) {
  const flame = useBuilt(flameGeometry)
  const candle = useRef<THREE.Group>(null)
  const outer = useRef<THREE.Mesh>(null)
  const inner = useRef<THREE.Mesh>(null)
  const fire = useRef(unit(sense))
  const glow = useRef(0)
  const eyeGlow = useRef(0)

  useFrame(({ clock }, dt) => {
    fire.current = damp(fire.current, unit(sense), 4, dt)
    const f = fire.current
    const t = clock.elapsedTime
    if (candle.current) candle.current.position.x = THREE.MathUtils.lerp(CANDLE_FAR, CANDLE_NEAR, f)
    // a living flame: it breathes and sways a little
    const flicker = 1 + Math.sin(t * 13) * 0.07 + Math.sin(t * 7.3) * 0.05
    const size = f < 0.02 ? 0 : 0.55 + f * 0.75
    for (const [mesh, k] of [
      [outer.current, 1],
      [inner.current, 0.6],
    ] as const) {
      if (!mesh) continue
      mesh.visible = size > 0
      mesh.scale.set(size * k * (2 - flicker), size * k * flicker, size * k * (2 - flicker))
      mesh.rotation.z = Math.sin(t * 5.1) * 0.06 * f
    }
    glow.current = f < 0.02 ? 0 : (0.35 + f * 0.65) * flicker
    eyeGlow.current = powered ? unit(level) * 0.35 : 0
  })

  return (
    <group position={[0.26, 0.02, 0]} rotation={[MODULE_TILT[0] * 0.6, 0.35, 0]}>
      <group position={[0.42, 0.02, 0]}>
        <ModuleBoard width={1.18} height={0.56} color="#1d4ed8" pins={4} leds={[[0.44, 0.13], [0.44, -0.03]]} powered={powered} level={level}>
          <Trimmer x={-0.05} y={0.06} />
          <Comparator x={0.22} y={-0.08} />
          {/* the dark eye: an infrared light catcher */}
          <SideLed position={[-0.59, 0.1, FACE + 0.1]} color="#111114" />
          <Halo color="#fb923c" intensity={eyeGlow} position={[-0.82, 0.1, FACE + 0.2]} scale={0.5} />
        </ModuleBoard>
      </group>
      {/* the candle and its flame */}
      <group ref={candle} position={[CANDLE_FAR, CANDLE_Y, 0.12]}>
        <mesh position={[0, -0.015, 0]}>
          <cylinderGeometry args={[0.2, 0.22, 0.03, 28]} />
          <meshStandardMaterial {...BRUSHED} />
        </mesh>
        <mesh position={[0, CANDLE_H / 2, 0]}>
          <cylinderGeometry args={[CANDLE_R, CANDLE_R, CANDLE_H, 24]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.65} />
        </mesh>
        <mesh position={[0, CANDLE_H + 0.025, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.05, 6]} />
          <meshStandardMaterial color="#27272a" />
        </mesh>
        <group position={[0, CANDLE_H + 0.035, 0]}>
          <mesh ref={outer} geometry={flame} visible={false} renderOrder={4}>
            <meshBasicMaterial color="#fb923c" transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
          <mesh ref={inner} geometry={flame} visible={false} renderOrder={5}>
            <meshBasicMaterial color="#fef08a" transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
          <Halo color="#f97316" intensity={glow} position={[0, 0.14, 0.05]} scale={1.1} />
        </group>
      </group>
    </group>
  )
}

/* -------------------------------------------------------------- obstacle */

const BRICK = { w: 0.24, h: 0.1, d: 0.11 }
const BRICK_COLORS = ['#b45309', '#9a3412', '#c2410c', '#a8431b']
/** where the little wall stands when it blocks the way, and where it waits, faded out */
const WALL_NEAR = -0.95
const WALL_FAR = -1.2
/** the tips of the two LEDs sit at the board's end */
const EMITTER_X = -0.13

/** A short wall of bricks, its face toward +x. */
function BrickWall() {
  const bricks: { y: number; z: number; w: number; color: string }[] = []
  for (let row = 0; row < 6; row++) {
    const offset = row % 2 === 0 ? 0 : BRICK.w / 2
    for (let col = -1; col <= 2; col++) {
      const z = -0.3 + col * (BRICK.w + 0.02) + offset
      // keep the bricks inside a neat 0.62 wide wall, halving the ones at the ends
      const left = Math.max(-0.31, z - BRICK.w / 2)
      const right = Math.min(0.31, z + BRICK.w / 2)
      if (right - left < 0.04) continue
      bricks.push({ y: -0.29 + row * (BRICK.h + 0.016), z: (left + right) / 2, w: right - left, color: BRICK_COLORS[(row * 3 + col + 4) % 4] })
    }
  }
  return (
    <group>
      <mesh position={[0, 0.0, 0]}>
        <boxGeometry args={[BRICK.d - 0.02, 0.66, 0.6]} />
        <meshStandardMaterial color="#d6d3d1" roughness={0.95} transparent />
      </mesh>
      {bricks.map(({ y, z, w, color }) => (
        <mesh key={`${y}${z}`} position={[0, y, z]}>
          <boxGeometry args={[BRICK.d, BRICK.h, w]} />
          <meshStandardMaterial color={color} roughness={0.85} transparent />
        </mesh>
      ))}
    </group>
  )
}

/** A soft beam of light along +x from `from`, `length` long. */
function beamGeometry() {
  // narrow at the LED, wider as it spreads out
  const g = new THREE.CylinderGeometry(0.11, 0.05, 1, 16, 1, true)
  g.rotateZ(Math.PI / 2)
  g.translate(-0.5, 0, 0)
  return g
}

/**
 * Obstacle sensor: a clear light and a dark eye side by side. Put the wall in
 * front, and the light bounces off it, back into the dark eye.
 */
export function IrSensorModel({ sense, level, powered }: SensorProps) {
  const beam = useBuilt(beamGeometry)
  const wall = useRef<THREE.Group>(null)
  const out = useRef<THREE.Mesh>(null)
  const back = useRef<THREE.Mesh>(null)
  const outMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const backMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const blocked = useRef(unit(sense))
  const spot = useRef(0)
  const wallMaterials = useRef<THREE.MeshStandardMaterial[]>([])

  useFrame((_, dt) => {
    blocked.current = damp(blocked.current, unit(sense), 6, dt)
    const b = blocked.current
    const w = wall.current
    if (w) {
      w.position.x = THREE.MathUtils.lerp(WALL_FAR, WALL_NEAR, b)
      w.visible = b > 0.02
      if (wallMaterials.current.length === 0) {
        w.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
          if (m) wallMaterials.current.push(m)
        })
      }
      wallMaterials.current.forEach((m) => (m.opacity = b))
    }
    // the light reaches the wall and comes back only while something is there
    const reach = THREE.MathUtils.lerp(0.32, Math.abs(WALL_NEAR - EMITTER_X) - 0.06, b)
    if (out.current) {
      out.current.scale.set(reach, 1, 1)
      out.current.visible = powered
    }
    if (outMaterial.current) outMaterial.current.opacity = powered ? 0.16 + b * 0.12 : 0
    if (back.current) {
      back.current.scale.set(reach, 0.8, 0.8)
      back.current.visible = powered && b > 0.05
    }
    if (backMaterial.current) backMaterial.current.opacity = powered ? b * 0.22 : 0
    spot.current = powered ? b * 0.5 : 0
  })

  return (
    <group position={[0.055, 0.04, 0]} rotation={[MODULE_TILT[0] * 0.7, -0.5, 0]}>
      <group position={[0.42, 0, 0]}>
        <ModuleBoard width={1.1} height={0.44} color="#047857" leds={[[0.4, 0.11], [0.4, -0.05]]} powered={powered} level={level}>
          <Trimmer x={-0.08} y={0.04} />
          <Comparator x={0.18} y={-0.09} />
        </ModuleBoard>
      </group>
      {/* the clear light that shines and the dark eye that catches it */}
      <SideLed position={[EMITTER_X, 0.09, FACE + 0.1]} color="#e0e7ff" opacity={0.55} inner="#94a3b8" />
      <SideLed position={[EMITTER_X, -0.1, FACE + 0.1]} color="#111114" />
      <group position={[EMITTER_X - 0.27, 0.09, FACE + 0.1]}>
        <mesh ref={out} geometry={beam} renderOrder={3}>
          <meshBasicMaterial ref={outMaterial} color="#f0abfc" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      </group>
      <group position={[EMITTER_X - 0.27, -0.1, FACE + 0.1]}>
        <mesh ref={back} geometry={beam} renderOrder={3}>
          <meshBasicMaterial ref={backMaterial} color="#e879f9" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      </group>
      <group ref={wall} position={[WALL_FAR, 0, FACE + 0.1]} visible={false}>
        <BrickWall />
        <Halo color="#f0abfc" intensity={spot} position={[0.1, 0, 0]} scale={0.6} />
      </group>
    </group>
  )
}


/* ------------------------------------------------------------------ line */

const PAPER_Y = -0.5
/** the black line slides along the paper: under the sensor, or off to the side */
const LINE_UNDER = 0
const LINE_ASIDE = 0.62

/** The TCRT5000: a black block with a blue light and a dark eye, both looking down. */
function Tcrt5000() {
  return (
    <group>
      <RoundedBox args={[0.3, 0.14, 0.15]} radius={0.015} smoothness={2}>
        <meshStandardMaterial color="#18181b" roughness={0.5} />
      </RoundedBox>
      {[
        [-0.07, '#2563eb'],
        [0.07, '#0a0a0a'],
      ].map(([x, color]) => (
        <mesh key={color as string} position={[x as number, -0.075, 0]}>
          <sphereGeometry args={[0.055, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color={color as string} roughness={0.1} metalness={0.1} />
        </mesh>
      ))}
    </group>
  )
}

const paperGeometry = () => new THREE.BoxGeometry(2.1, 0.02, 0.9)
const spotGeometry = () => new THREE.RingGeometry(0, 0.1, 24)

/** Little grey fibres in the paper, so it reads as paper and not plastic. */
function fibreGeometry() {
  const parts: THREE.BufferGeometry[] = []
  const seeded = (n: number) => (Math.sin(n * 91.7) * 43758.5) % 1
  for (let i = 0; i < 26; i++) {
    const x = -0.95 + Math.abs(seeded(i)) * 1.9
    const z = -0.38 + Math.abs(seeded(i + 40)) * 0.76
    parts.push(new THREE.BoxGeometry(0.06, 0.002, 0.004).rotateY(seeded(i + 80) * 3).translate(x, 0.011, z))
  }
  return merge(parts)
}

/**
 * Line sensor: the module hangs over a sheet of paper and looks down. Its
 * light bounces back off white paper (a pink spot), but a black line takes it in.
 */
export function LineSensorModel({ sense, level, powered }: SensorProps) {
  const paper = useBuilt(paperGeometry)
  const fibres = useBuilt(fibreGeometry)
  const line = useRef<THREE.Mesh>(null)
  const black = useRef(unit(sense))
  const spot = useRef(0)
  const spotMesh = useRef<THREE.Mesh>(null)
  const spotMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const ring = useBuilt(spotGeometry)

  useFrame((_, dt) => {
    black.current = damp(black.current, unit(sense), 6, dt)
    const b = black.current
    if (line.current) line.current.position.x = THREE.MathUtils.lerp(LINE_ASIDE, LINE_UNDER, b)
    // white paper sends the light back up; the black line keeps it
    const bounce = powered ? 1 - b : 0
    spot.current = bounce * 0.45
    if (spotMaterial.current) spotMaterial.current.opacity = bounce * 0.55
    if (spotMesh.current) spotMesh.current.visible = bounce > 0.02
  })

  return (
    <group position={[0, 0.06, 0]} rotation={[0.42, -0.28, 0]}>
      {/* the paper and its black line */}
      <mesh geometry={paper} position={[0, PAPER_Y, 0]}>
        <meshStandardMaterial color="#f8fafc" roughness={0.95} />
      </mesh>
      <mesh geometry={fibres} position={[0, PAPER_Y, 0]}>
        <meshStandardMaterial color="#cbd5e1" roughness={1} />
      </mesh>
      <mesh ref={line} position={[LINE_ASIDE, PAPER_Y + 0.012, 0]}>
        <boxGeometry args={[0.3, 0.004, 0.9]} />
        <meshStandardMaterial color="#111113" roughness={0.8} />
      </mesh>
      <mesh ref={spotMesh} geometry={ring} position={[-0.0, PAPER_Y + 0.016, 0.03]} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={3}>
        <meshBasicMaterial ref={spotMaterial} color="#f0abfc" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <Halo color="#f5d0fe" intensity={spot} position={[0, PAPER_Y + 0.05, 0.03]} scale={0.7} />
      {/* the module, standing over the paper with its eyes at the bottom */}
      <group position={[0, 0.1, 0.03]}>
        <ModuleBoard width={0.86} height={0.62} color="#1e293b" header="top" leds={[[-0.28, 0.12], [-0.28, -0.04]]} powered={powered} level={level}>
          <Trimmer x={0.2} y={0.1} />
          <Comparator x={0.04} y={-0.13} />
          <group position={[0, -0.36, FACE + 0.08]}>
            <Tcrt5000 />
          </group>
        </ModuleBoard>
      </group>
    </group>
  )
}
