import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { DEG, Halo, damp } from '../helpers'

const metal = { color: '#d4d4d8', metalness: 0.9, roughness: 0.25 } as const
/** the can is large: less metalness keeps it silver instead of dark */
const can = { color: '#d6dae0', metalness: 0.55, roughness: 0.3 } as const

/* ------------------------------------------------------------------ tilt */

const CAN_R = 0.24
const CAN_BOTTOM = -0.04
const CAN_TOP = 0.6
/** the viewing window is cut into the lower part of the can */
const WINDOW_TOP = 0.4
const WINDOW = 1.5
const FLOOR = CAN_BOTTOM + 0.06
const BALL_R = 0.1
/** the two contact pins sit on the side that goes down when tilted */
const PIN_X = 0.15
const PIN_Z = 0.07
/** ball resting in the middle, and wedged between the two pins */
const BALL_OPEN_X = -0.08
const BALL_CLOSED_X = PIN_X - Math.sqrt((BALL_R + 0.025) ** 2 - PIN_Z ** 2)
const TILT = 35 * DEG

/** Tilt ball switch: tip it over and the ball rolls between the two contacts. */
export function TiltModel({ tilted }: { tilted: boolean }) {
  const body = useRef<THREE.Group>(null)
  const ball = useRef<THREE.Mesh>(null)
  const tilt = useRef(tilted ? 1 : 0)
  const flash = useRef(0)
  const glint = useRef(0)
  const wasClosed = useRef(tilted)

  useFrame((_, dt) => {
    tilt.current = damp(tilt.current, tilted ? 1 : 0, 6, dt)
    const t = tilt.current
    if (body.current) body.current.rotation.z = -t * TILT
    const x = THREE.MathUtils.lerp(BALL_OPEN_X, BALL_CLOSED_X, t)
    const b = ball.current
    if (b) {
      b.position.x = x
      b.rotation.z = -(x - BALL_OPEN_X) / BALL_R
    }
    // a glint where the ball touches the contacts
    const closed = t > 0.9
    if (closed && !wasClosed.current) flash.current = 1
    wasClosed.current = closed
    flash.current = Math.max(0, flash.current - dt * 3)
    glint.current = (closed ? 0.25 : 0) + flash.current * 0.8
  })

  return (
    <group position={[0, -0.01, 0]} rotation={[0.3, 0, 0]}>
      <group ref={body}>
        {/* can with a window, its dark inside and a faint pane */}
        <mesh position={[0, (CAN_BOTTOM + WINDOW_TOP) / 2, 0]}>
          <cylinderGeometry args={[CAN_R, CAN_R, WINDOW_TOP - CAN_BOTTOM, 32, 1, true, WINDOW / 2, Math.PI * 2 - WINDOW]} />
          <meshStandardMaterial {...can} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, (CAN_BOTTOM + WINDOW_TOP) / 2, 0]}>
          <cylinderGeometry args={[CAN_R - 0.012, CAN_R - 0.012, WINDOW_TOP - CAN_BOTTOM, 32, 1, true]} />
          <meshStandardMaterial color="#8b8f97" metalness={0.3} roughness={0.5} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, (CAN_BOTTOM + WINDOW_TOP) / 2, 0]} renderOrder={2}>
          <cylinderGeometry args={[CAN_R + 0.002, CAN_R + 0.002, WINDOW_TOP - CAN_BOTTOM, 12, 1, true, -WINDOW / 2, WINDOW]} />
          <meshStandardMaterial color="#e0f2fe" transparent opacity={0.12} roughness={0.05} depthWrite={false} />
        </mesh>
        <mesh position={[0, (WINDOW_TOP + CAN_TOP) / 2, 0]}>
          <cylinderGeometry args={[CAN_R, CAN_R, CAN_TOP - WINDOW_TOP, 32]} />
          <meshStandardMaterial {...can} />
        </mesh>
        <mesh position={[0, CAN_TOP, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[CAN_R - 0.015, 0.018, 8, 32]} />
          <meshStandardMaterial {...can} />
        </mesh>
        {[WINDOW_TOP, CAN_BOTTOM].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[CAN_R, 0.012, 6, 32]} />
            <meshStandardMaterial {...can} />
          </mesh>
        ))}

        {/* floor, contact pins and the ball */}
        <mesh position={[0, FLOOR - 0.01, 0]}>
          <cylinderGeometry args={[CAN_R - 0.012, CAN_R - 0.012, 0.02, 24]} />
          <meshStandardMaterial color="#6b7280" roughness={0.6} />
        </mesh>
        {[-PIN_Z, PIN_Z].map((z) => (
          <mesh key={z} position={[PIN_X, FLOOR + 0.06, z]}>
            <cylinderGeometry args={[0.025, 0.025, 0.12, 10]} />
            <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.3} />
          </mesh>
        ))}
        <mesh ref={ball} position={[BALL_OPEN_X, FLOOR + BALL_R, 0]}>
          <sphereGeometry args={[BALL_R, 24, 16]} />
          <meshStandardMaterial color="#e5e7eb" metalness={1} roughness={0.12} />
        </mesh>
        <Halo color="#fef3c7" intensity={glint} position={[PIN_X - 0.04, FLOOR + 0.1, 0.12]} scale={0.9} />

        {/* black base and legs */}
        <mesh position={[0, CAN_BOTTOM - 0.035, 0]}>
          <cylinderGeometry args={[CAN_R + 0.01, CAN_R + 0.01, 0.07, 32]} />
          <meshStandardMaterial color="#18181b" roughness={0.6} />
        </mesh>
        {[-0.09, 0.09].map((x) => (
          <mesh key={x} position={[x, -0.39, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.56, 8]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ reed */

const TUBE_R = 0.12
const TUBE_HALF = 0.55
const TUBE_Y = -0.28
const BLADE_LEN = 0.66
const BLADE_Y = 0.024
/** how far each blade tip bends to touch the other */
const BEND = (BLADE_Y - 0.006) / BLADE_LEN
const LEAD_END = 1
const MAGNET_FAR = 0.42
const MAGNET_NEAR = 0

type Stroke = { size: [number, number]; at: [number, number]; angle?: number }

/** White "N" and "S" printed on the magnet's two halves. */
const POLE_LETTERS: Stroke[][] = [
  [
    { size: [0.02, 0.1], at: [-0.035, 0] },
    { size: [0.02, 0.1], at: [0.035, 0] },
    { size: [0.02, 0.118], at: [0, 0], angle: 0.6 },
  ],
  [
    { size: [0.07, 0.018], at: [0, 0.042] },
    { size: [0.018, 0.05], at: [-0.026, 0.021] },
    { size: [0.07, 0.018], at: [0, 0] },
    { size: [0.018, 0.05], at: [0.026, -0.021] },
    { size: [0.07, 0.018], at: [0, -0.042] },
  ],
]

/** Reed switch: bring the magnet close and the two blades in the glass snap together. */
export function ReedModel({ closed }: { closed: boolean }) {
  const magnet = useRef<THREE.Group>(null)
  const left = useRef<THREE.Group>(null)
  const right = useRef<THREE.Group>(null)
  const distance = useRef(closed ? 0 : 1)
  const bend = useRef(closed ? 1 : 0)
  const flash = useRef(0)
  const glint = useRef(0)
  const wasTouching = useRef(closed)

  useFrame((_, dt) => {
    distance.current = damp(distance.current, closed ? 0 : 1, 5, dt)
    if (magnet.current) magnet.current.position.y = THREE.MathUtils.lerp(MAGNET_NEAR, MAGNET_FAR, distance.current)
    // the blades snap shut once the magnet is close, and spring open as soon as it leaves
    const pulled = closed && distance.current < 0.35
    bend.current = damp(bend.current, pulled ? 1 : 0, 22, dt)
    const angle = -bend.current * BEND
    if (left.current) left.current.rotation.z = angle
    if (right.current) right.current.rotation.z = angle
    const touching = bend.current > 0.9
    if (touching && !wasTouching.current) flash.current = 1
    wasTouching.current = touching
    flash.current = Math.max(0, flash.current - dt * 3)
    glint.current = (touching ? 0.2 : 0) + flash.current * 0.8
  })

  const blade = <meshStandardMaterial color="#d4b06a" metalness={0.85} roughness={0.3} />

  return (
    <group position={[0, -0.06, 0]} rotation={[0.45, 0, 0]}>
      <group position={[0, TUBE_Y, 0]}>
        {/* blades, each hinged where it leaves the glass */}
        <group ref={left} position={[-TUBE_HALF + 0.02, 0, 0]}>
          <mesh position={[BLADE_LEN / 2, BLADE_Y, 0]}>
            <boxGeometry args={[BLADE_LEN, 0.012, 0.045]} />
            {blade}
          </mesh>
        </group>
        <group ref={right} position={[TUBE_HALF - 0.02, 0, 0]}>
          <mesh position={[-BLADE_LEN / 2, -BLADE_Y, 0]}>
            <boxGeometry args={[BLADE_LEN, 0.012, 0.045]} />
            {blade}
          </mesh>
        </group>
        <Halo color="#fef3c7" intensity={glint} position={[0, 0, 0.08]} scale={0.8} />

        {/* glass tube with sealed, tapered ends */}
        <mesh rotation={[0, 0, Math.PI / 2]} renderOrder={2}>
          <cylinderGeometry args={[TUBE_R, TUBE_R, TUBE_HALF * 2 - 0.2, 28, 1, true]} />
          <meshStandardMaterial color="#e0f2fe" transparent opacity={0.22} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (TUBE_HALF - 0.05), 0, 0]} rotation={[0, 0, -side * (Math.PI / 2)]} renderOrder={2}>
            <cylinderGeometry args={[0.035, TUBE_R, 0.1, 28, 1, true]} />
            <meshStandardMaterial color="#e0f2fe" transparent opacity={0.3} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]} renderOrder={3}>
          <cylinderGeometry args={[TUBE_R + 0.002, TUBE_R + 0.002, TUBE_HALF * 1.6, 8, 1, true, 0.48, 0.28]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.45} depthWrite={false} />
        </mesh>
        {/* leads */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (TUBE_HALF - 0.04 + LEAD_END) * 0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, LEAD_END - TUBE_HALF + 0.04, 8]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        ))}
      </group>

      {/* bar magnet: red N, grey S */}
      <group ref={magnet} position={[0, closed ? MAGNET_NEAR : MAGNET_FAR, 0]}>
        {['#dc2626', '#9ca3af'].map((color, i) => (
          <group key={color} position={[i === 0 ? -0.18 : 0.18, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.36, 0.17, 0.17]} />
              <meshStandardMaterial color={color} roughness={0.4} metalness={i === 0 ? 0.1 : 0.6} />
            </mesh>
            {POLE_LETTERS[i].map(({ size, at, angle = 0 }, k) => (
              <mesh key={k} position={[at[0], at[1], 0.088]} rotation={[0, 0, angle]}>
                <boxGeometry args={[size[0], size[1], 0.006]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  )
}
