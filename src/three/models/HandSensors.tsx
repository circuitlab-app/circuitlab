import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, damp } from '../helpers'
import { Lead, Rod } from './kit'
import { FACE, ModuleBoard, type SensorProps } from './Sensors'
import { BRUSHED, CHIP, METAL, MODULE_TILT, SILK, merge, unit, useBuilt } from './shared'

/*
 * Sensor modules you work with your hands: the magnet (Hall) sensor, the
 * press pad, the heartbeat sensor and the knock sensor.
 */

const UP = new THREE.Vector3(0, 1, 0)
const SKIN = '#f1c19c'
const NAIL = '#fbd5c8'

/** A fingertip lying along +y from its base, its nail on the +z side. */
function Fingertip({ radius = 0.13, length = 0.3 }: { radius?: number; length?: number }) {
  return (
    <group>
      <mesh position={[0, radius + length / 2, 0]}>
        <capsuleGeometry args={[radius, length, 8, 20]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>
      <mesh position={[0, radius + 0.07, radius * 0.82]} scale={[0.8, 1.15, 0.3]}>
        <sphereGeometry args={[radius * 0.72, 16, 12]} />
        <meshStandardMaterial color={NAIL} roughness={0.25} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ hall */

type Stroke = { size: [number, number]; at: [number, number]; angle?: number }

/** "N" and "S" printed on the magnet's ends, like the reed switch's magnet. */
const POLE_LETTERS: Stroke[][] = [
  [
    { size: [0.018, 0.09], at: [-0.03, 0] },
    { size: [0.018, 0.09], at: [0.03, 0] },
    { size: [0.018, 0.105], at: [0, 0], angle: 0.6 },
  ],
  [
    { size: [0.062, 0.016], at: [0, 0.038] },
    { size: [0.016, 0.045], at: [-0.023, 0.019] },
    { size: [0.062, 0.016], at: [0, 0] },
    { size: [0.016, 0.045], at: [0.023, -0.019] },
    { size: [0.062, 0.016], at: [0, -0.038] },
  ],
]

const MAGNET_FAR = -1.08
const MAGNET_NEAR = -0.74
const SENSOR_X = -0.4

/** Lines of the magnet's pull, curling out of its N end. */
function fieldGeometry() {
  const parts: THREE.BufferGeometry[] = []
  for (const [r, tilt] of [
    [0.16, 0],
    [0.24, 0],
    [0.16, Math.PI],
    [0.24, Math.PI],
  ] as const) {
    const g = new THREE.TorusGeometry(r, 0.006, 5, 40, Math.PI * 0.9)
    g.rotateZ(Math.PI * 0.05 + tilt)
    parts.push(g)
  }
  return merge(parts)
}

/**
 * Magnet (Hall) sensor: a tiny black chip stands at the end of the board. Bring
 * the bar magnet close and the field lines reach it: S turns on, without touching.
 */
export function HallSensorModel({ sense, level, powered }: SensorProps) {
  const field = useBuilt(fieldGeometry)
  const magnet = useRef<THREE.Group>(null)
  const fieldMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const near = useRef(unit(sense))
  const sensed = useRef(0)

  useFrame((_, dt) => {
    near.current = damp(near.current, unit(sense), 5, dt)
    const n = near.current
    if (magnet.current) magnet.current.position.x = THREE.MathUtils.lerp(MAGNET_FAR, MAGNET_NEAR, n)
    if (fieldMaterial.current) fieldMaterial.current.opacity = 0.15 + n * 0.45
    sensed.current = powered ? unit(level) * 0.4 : 0
  })

  return (
    <group position={[0.31, 0.02, 0]} rotation={[MODULE_TILT[0], 0.32, 0]}>
      <group position={[0.36, 0, 0]}>
        <ModuleBoard width={1.0} height={0.5} color="#4338ca" leds={[[0.32, 0.12], [0.32, -0.04]]} powered={powered} level={level}>
          {/* a resistor and a little SMD light helper */}
          <mesh position={[0.02, 0.08, FACE + 0.012]}>
            <boxGeometry args={[0.1, 0.05, 0.024]} />
            <meshStandardMaterial color="#18181b" roughness={0.5} />
          </mesh>
          {[-0.04, 0.08].map((x) => (
            <mesh key={x} position={[x, 0.08, FACE + 0.013]}>
              <boxGeometry args={[0.02, 0.052, 0.026]} />
              <meshStandardMaterial {...METAL} />
            </mesh>
          ))}
        </ModuleBoard>
      </group>
      {/* the Hall chip: a flat black body on three legs, facing the magnet */}
      <group position={[SENSOR_X, 0.04, FACE + 0.06]}>
        <mesh position={[-0.07, 0, 0]}>
          <boxGeometry args={[0.07, 0.17, 0.15]} />
          <meshStandardMaterial {...CHIP} />
        </mesh>
        <mesh position={[-0.106, 0.02, 0]}>
          <boxGeometry args={[0.003, 0.05, 0.1]} />
          <meshStandardMaterial color="#d4d4d8" roughness={0.7} />
        </mesh>
        {[-0.045, 0, 0.045].map((z) => (
          <Rod key={z} from={[-0.04, -0.04, z]} to={[0.13, -0.04, z]} radius={0.01} />
        ))}
        <Halo color="#a5b4fc" intensity={sensed} position={[-0.12, 0, 0.1]} scale={0.5} />
      </group>
      {/* the bar magnet, N end first */}
      <group ref={magnet} position={[MAGNET_FAR, 0.04, FACE + 0.06]}>
        {['#dc2626', '#9ca3af'].map((color, i) => (
          <group key={color} position={[i === 0 ? 0.13 : -0.13, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.26, 0.15, 0.15]} />
              <meshStandardMaterial color={color} roughness={0.4} metalness={i === 0 ? 0.1 : 0.6} />
            </mesh>
            {POLE_LETTERS[i].map(({ size, at, angle = 0 }, k) => (
              <mesh key={k} position={[at[0], at[1], 0.078]} rotation={[0, 0, angle]}>
                <boxGeometry args={[size[0], size[1], 0.005]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
              </mesh>
            ))}
          </group>
        ))}
        <mesh geometry={field} position={[0.27, 0, 0]} renderOrder={3}>
          <meshBasicMaterial ref={fieldMaterial} color="#a5b4fc" transparent opacity={0.15} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

/* ----------------------------------------------------------------- force */

const PAD_R = 0.34
const PAD_X = -0.42
const THUMB_LIFT = 0.32
/** the thumb comes down from the upper left, onto the pad */
const THUMB_DIR = new THREE.Vector3(-0.3, 0.45, 0.85).normalize()
const THUMB_TURN = new THREE.Quaternion().setFromUnitVectors(UP, THUMB_DIR)
const SOFT = new THREE.Color('#22c55e')
const HARD = new THREE.Color('#ef4444')

/** The pad's silver fingers: two combs in a circle, like a real force sensor. */
function padFingers() {
  const parts: THREE.BufferGeometry[] = []
  const r = PAD_R - 0.05
  for (let i = 0; i < 11; i++) {
    const y = -r + 0.03 + (i * (2 * r - 0.06)) / 10
    const half = Math.sqrt(Math.max(0, r * r - y * y)) - 0.03
    if (half < 0.02) continue
    parts.push(new THREE.BoxGeometry(2 * half, 0.012, 0.004).translate(0, y, 0))
  }
  return merge(parts)
}

/**
 * Press sensor: a round pad on a thin tail. The slider pushes the thumb down:
 * the harder it presses, the more the ring glows, from green to red.
 */
export function ForceSensorModel({ sense, level, powered }: SensorProps) {
  const fingers = useBuilt(padFingers)
  const thumb = useRef<THREE.Group>(null)
  const ring = useRef<THREE.MeshStandardMaterial>(null)
  const press = useRef(unit(sense))
  const glow = useRef(0)
  const tint = useRef(new THREE.Color())

  useFrame((_, dt) => {
    press.current = damp(press.current, unit(sense), 8, dt)
    const p = press.current
    const t = thumb.current
    if (t) {
      // the thumb comes down, then squashes a little as it presses harder
      t.position.y = Math.max(0, 1 - p * 1.6) * THUMB_LIFT
      const squash = Math.max(0, p - 0.6) * 0.3
      t.scale.set(1 + squash * 0.5, 1 - squash, 1 + squash * 0.5)
    }
    tint.current.lerpColors(SOFT, HARD, p)
    if (ring.current) {
      ring.current.emissive.copy(tint.current)
      ring.current.emissiveIntensity = p * 1.4
    }
    glow.current = p * 0.5
  })

  return (
    <group position={[-0.03, 0.04, 0]} rotation={[-0.35, 0.28, 0]}>
      {/* the pad: a beige ring around the dark sensing disc */}
      <group position={[PAD_X, 0.02, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[PAD_R + 0.06, PAD_R + 0.06, 0.02, 48]} />
          <meshStandardMaterial color="#e7e5e4" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.011]}>
          <circleGeometry args={[PAD_R, 48]} />
          <meshStandardMaterial color="#27272a" roughness={0.5} />
        </mesh>
        <mesh geometry={fingers} position={[0, 0, 0.014]}>
          <meshStandardMaterial {...BRUSHED} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <torusGeometry args={[PAD_R + 0.025, 0.012, 6, 48]} />
          <meshStandardMaterial ref={ring} color="#d6d3d1" roughness={0.4} emissive={SOFT} emissiveIntensity={0} toneMapped={false} />
        </mesh>
        <Halo color="#fca5a5" intensity={glow} position={[0, 0, 0.12]} scale={1.1} />
        {/* the thumb, sliding along its own length onto the pad */}
        <group position={[0, 0, 0.02]} quaternion={THUMB_TURN}>
          <group ref={thumb} position={[0, THUMB_LIFT, 0]}>
            <Fingertip radius={0.15} length={0.28} />
          </group>
        </group>
      </group>
      {/* the thin tail with its two legs */}
      <mesh position={[PAD_X + PAD_R + 0.3, 0.02, 0]}>
        <boxGeometry args={[0.5, 0.11, 0.012]} />
        <meshStandardMaterial color="#d6d3d1" roughness={0.6} />
      </mesh>
      {[-0.025, 0.025].map((y) => (
        <mesh key={y} position={[PAD_X + PAD_R + 0.3, 0.02 + y, 0.007]}>
          <boxGeometry args={[0.5, 0.012, 0.003]} />
          <meshStandardMaterial {...BRUSHED} />
        </mesh>
      ))}
      {/* the little board that turns the push into a signal */}
      <group position={[0.68, 0.02, 0]}>
        <ModuleBoard width={0.56} height={0.5} color="#6d28d9" leds={[[0.13, 0.12], [0.13, -0.04]]} powered={powered} level={level}>
          <mesh position={[-0.1, 0.06, FACE + 0.015]}>
            <boxGeometry args={[0.12, 0.06, 0.03]} />
            <meshStandardMaterial color="#c8a27a" roughness={0.55} />
          </mesh>
          <mesh position={[-0.13, 0.17, FACE + 0.004]}>
            <boxGeometry args={[0.16, 0.014, 0.004]} />
            <meshStandardMaterial {...SILK} />
          </mesh>
        </ModuleBoard>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------- heartbeat */

const PULSE_R = 0.4

function heartShape(size: number) {
  const s = size
  const shape = new THREE.Shape()
  shape.moveTo(0, -0.9 * s)
  shape.bezierCurveTo(0.15 * s, -0.7 * s, 1.0 * s, -0.25 * s, 1.0 * s, 0.25 * s)
  shape.bezierCurveTo(1.0 * s, 0.75 * s, 0.35 * s, 0.95 * s, 0, 0.45 * s)
  shape.bezierCurveTo(-0.35 * s, 0.95 * s, -1.0 * s, 0.75 * s, -1.0 * s, 0.25 * s)
  shape.bezierCurveTo(-1.0 * s, -0.25 * s, -0.15 * s, -0.7 * s, 0, -0.9 * s)
  return shape
}

/** The thin white heart printed on the board. */
function heartOutline() {
  const outer = heartShape(0.21)
  outer.holes.push(new THREE.Path(heartShape(0.18).getPoints(40).reverse()))
  return new THREE.ShapeGeometry(outer, 24)
}

/** A plump red heart that beats beside the sensor. */
function heartGeometry() {
  const g = new THREE.ExtrudeGeometry(heartShape(0.13), {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 3,
    curveSegments: 16,
  })
  g.center()
  return g
}

/**
 * Heartbeat sensor: the round green board with a heart on it and a green
 * light in the middle. A fingertip rests on it, and with every beat the light
 * shines through and the little red heart thumps.
 */
export function PulseSensorModel({ level, powered }: SensorProps) {
  const outline = useBuilt(heartOutline)
  const heart = useBuilt(heartGeometry)
  const beat = useRef<THREE.Mesh>(null)
  const heartMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const led = useRef<THREE.MeshStandardMaterial>(null)
  const pulse = useRef(0)
  const glow = useRef(0)
  const heartGlow = useRef(0)

  useFrame((_, dt) => {
    // 0 between beats, 1 at the top of a beat
    const target = powered ? unit((level - 0.12) / 0.88) : 0
    pulse.current = damp(pulse.current, target, target > pulse.current ? 30 : 9, dt)
    const p = pulse.current
    if (beat.current) beat.current.scale.setScalar(1 + p * 0.22)
    if (heartMaterial.current) heartMaterial.current.emissiveIntensity = 0.1 + p * 0.9
    if (led.current) led.current.emissiveIntensity = powered ? 0.8 + p * 2 : 0.03
    glow.current = powered ? 0.25 + p * 0.45 : 0
    heartGlow.current = p * 0.45
  })

  return (
    <group position={[-0.08, 0.06, 0]} rotation={[-0.3, 0.3, 0]}>
      {/* its three wires, down to a little plug */}
      <Lead points={[[-0.04, -PULSE_R + 0.02, -0.02], [-0.08, -0.62, 0.0], [-0.25, -0.78, 0.04]]} color="#7c3aed" radius={0.016} />
      <Lead points={[[0, -PULSE_R + 0.02, -0.02], [0, -0.62, 0.0], [-0.21, -0.78, 0.04]]} color="#dc2626" radius={0.016} />
      <Lead points={[[0.04, -PULSE_R + 0.02, -0.02], [0.08, -0.62, 0.0], [-0.17, -0.78, 0.04]]} color="#18181b" radius={0.016} />
      <mesh position={[-0.32, -0.8, 0.04]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.18, 0.1, 0.07]} />
        <meshStandardMaterial color="#18181b" roughness={0.5} />
      </mesh>
      {/* the round board */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[PULSE_R, PULSE_R, 0.05, 48]} />
        <meshStandardMaterial color="#16a34a" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh geometry={outline} position={[0, 0.0, 0.027]}>
        <meshStandardMaterial {...SILK} />
      </mesh>
      {/* the green light and the light catcher beside it */}
      <mesh position={[0, 0.04, 0.035]}>
        <boxGeometry args={[0.09, 0.09, 0.03]} />
        <meshStandardMaterial ref={led} color="#bbf7d0" emissive="#22c55e" emissiveIntensity={0.03} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.09, 0.03]}>
        <boxGeometry args={[0.07, 0.05, 0.02]} />
        <meshStandardMaterial {...CHIP} />
      </mesh>
      <Halo color="#4ade80" intensity={glow} position={[0, 0.04, 0.12]} scale={0.8} />
      {/* a fingertip resting across the top of the board */}
      <group position={[-0.05, 0.26, 0.06]} rotation={[0, 0, 1.25]}>
        <group rotation={[0.1, 0, 0]}>
          <Fingertip radius={0.12} length={0.32} />
        </group>
      </group>
      {/* the heart that beats */}
      <mesh ref={beat} geometry={heart} position={[0.72, 0.12, 0.05]} rotation={[0, -0.25, 0]}>
        <meshStandardMaterial ref={heartMaterial} color="#ef4444" roughness={0.35} emissive="#dc2626" emissiveIntensity={0.1} />
      </mesh>
      <Halo color="#f87171" intensity={heartGlow} position={[0.72, 0.12, 0.2]} scale={0.9} />
    </group>
  )
}

/* ----------------------------------------------------------------- knock */

const MALLET_LENGTH = 0.76
/** the handle's end: the mallet's head comes down right over the can */
const MALLET_PIVOT: [number, number, number] = [0.52, 0.28, 0.11]
/** the mallet rests lifted, and comes down onto the sensor can */
const MALLET_UP = -0.42
const MALLET_DOWN = 0
const KNOCKS_PER_SECOND = 3

/**
 * Knock sensor: a little can with a spring inside sits on a blue board.
 * Hold the button and a wooden mallet taps on it: the board jumps, and S turns on.
 */
export function KnockSensorModel({ sense, level, powered }: SensorProps) {
  const mallet = useRef<THREE.Group>(null)
  const board = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const ringMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const angle = useRef(MALLET_UP)
  const start = useRef(0)
  const knocking = sense > 0.5

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    if (!knocking) start.current = t
    // while held: lift, strike, lift … ; let go and it rests up
    const phase = ((t - start.current) * KNOCKS_PER_SECOND) % 1
    const swing = knocking ? Math.abs(Math.cos(phase * Math.PI)) : 1
    angle.current = knocking ? MALLET_DOWN + (MALLET_UP - MALLET_DOWN) * swing ** 2 : damp(angle.current, MALLET_UP, 8, dt)
    if (mallet.current) mallet.current.rotation.z = angle.current
    // the hit: the board jumps and a ring spreads out
    const hit = knocking ? Math.max(0, 1 - Math.min(phase, 1 - phase) * 6) : 0
    if (board.current) board.current.position.y = -hit * 0.02
    const spread = knocking ? phase : 1
    if (ring.current) {
      ring.current.visible = knocking && spread < 0.6
      ring.current.scale.setScalar(0.6 + spread * 2)
    }
    if (ringMaterial.current) ringMaterial.current.opacity = (1 - spread / 0.6) * 0.7
  })

  return (
    <group position={[0.03, -0.06, 0]} rotation={[MODULE_TILT[0], 0.3, 0]}>
      <group ref={board}>
        <ModuleBoard width={1.3} height={0.5} color="#1d4ed8" leds={[[0.48, 0.12], [0.48, -0.04]]} powered={powered} level={level}>
          {/* the knock can: a spring in a little tube */}
          <group position={[-0.28, 0.04, FACE + 0.085]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.085, 0.085, 0.36, 24]} />
              <meshStandardMaterial {...BRUSHED} />
            </mesh>
            <mesh position={[0.19, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.07, 0.04, 20]} />
              <meshStandardMaterial color="#16a34a" roughness={0.5} />
            </mesh>
            <mesh ref={ring} position={[0, 0.0, 0.1]} visible={false} renderOrder={3}>
              <torusGeometry args={[0.13, 0.01, 6, 32]} />
              <meshBasicMaterial ref={ringMaterial} color="#fde68a" transparent opacity={0} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
          <mesh position={[0.08, 0.05, FACE + 0.07]}>
            <boxGeometry args={[0.2, 0.2, 0.14]} />
            <meshStandardMaterial color="#2563eb" roughness={0.4} />
          </mesh>
          <mesh position={[0.13, 0.1, FACE + 0.145]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
            <meshStandardMaterial color="#d6a84a" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0.28, -0.1, FACE + 0.022]}>
            <boxGeometry args={[0.22, 0.12, 0.044]} />
            <meshStandardMaterial {...CHIP} />
          </mesh>
        </ModuleBoard>
      </group>
      {/* the wooden mallet, swinging from the end of its handle */}
      <group ref={mallet} position={MALLET_PIVOT} rotation={[0, 0, MALLET_UP]}>
        <mesh position={[-MALLET_LENGTH / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.024, 0.03, MALLET_LENGTH, 12]} />
          <meshStandardMaterial color="#d6a46a" roughness={0.7} />
        </mesh>
        <RoundedBox args={[0.15, 0.27, 0.15]} radius={0.04} smoothness={2} position={[-MALLET_LENGTH - 0.04, 0, 0]}>
          <meshStandardMaterial color="#92400e" roughness={0.65} />
        </RoundedBox>
        <mesh position={[-MALLET_LENGTH - 0.04, 0.136, 0]}>
          <boxGeometry args={[0.11, 0.004, 0.11]} />
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
}
