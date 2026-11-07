import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Rotation } from '@/circuit/types'
import { DEG, Halo, damp } from '../helpers'
import { BRUSHED, COPPER, GOLD, METAL, SILK, unit } from './shared'

/*
 * Switches and sticks: the two-way slide switch, the micro switch with its
 * lever, and the thumb joystick.
 */

type Stroke = { size: [number, number]; at: [number, number]; angle?: number }

/** Silkscreen letters drawn with little bars. */
const LETTERS: Record<'A' | 'B' | 'C', Stroke[]> = {
  A: [
    { size: [0.016, 0.1], at: [-0.02, 0], angle: -0.38 },
    { size: [0.016, 0.1], at: [0.02, 0], angle: 0.38 },
    { size: [0.04, 0.014], at: [0, -0.012] },
  ],
  B: [
    { size: [0.016, 0.1], at: [-0.022, 0] },
    { size: [0.036, 0.014], at: [0, 0.043] },
    { size: [0.04, 0.014], at: [0.002, 0] },
    { size: [0.04, 0.014], at: [0.002, -0.043] },
    { size: [0.014, 0.034], at: [0.02, 0.022] },
    { size: [0.014, 0.034], at: [0.024, -0.022] },
  ],
  C: [
    { size: [0.016, 0.07], at: [-0.022, 0] },
    { size: [0.04, 0.014], at: [0.002, 0.043] },
    { size: [0.04, 0.014], at: [0.002, -0.043] },
  ],
}

function Letter({ char, position, scale = 1 }: { char: keyof typeof LETTERS; position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {LETTERS[char].map(({ size, at, angle = 0 }, i) => (
        <mesh key={i} position={[at[0], at[1], 0]} rotation={[0, 0, angle]}>
          <boxGeometry args={[size[0], size[1], 0.004]} />
          <meshStandardMaterial {...SILK} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------------------------------------------------- slide switch */

const SHELL_W = 1.0
const SHELL_H = 0.36
const SHELL_D = 0.34
/** the knob's two stops: over A, or over B */
const KNOB_TRAVEL = 0.2
const PAD_X = 0.34
const PCB_T = 0.06

/**
 * Two-way slide switch on a little green board. The black knob slides to A or
 * to B, and the copper path from COM to that side lights up while current flows.
 */
export function SlideSwitchModel({ toB, rotation, current }: { toB: boolean; rotation: Rotation; current: number }) {
  const knob = useRef<THREE.Group>(null)
  const pathA = useRef<THREE.MeshStandardMaterial>(null)
  const pathB = useRef<THREE.MeshStandardMaterial>(null)
  const side = useRef(toB ? 1 : 0)
  const flow = useRef(0)
  const flash = useRef(0)
  const wasB = useRef(toB)
  const spark = useRef(0)

  useFrame((_, dt) => {
    side.current = damp(side.current, toB ? 1 : 0, 16, dt)
    if (knob.current) knob.current.position.x = THREE.MathUtils.lerp(-KNOB_TRAVEL, KNOB_TRAVEL, side.current)
    flow.current = damp(flow.current, Math.abs(current) > 1e-3 ? 1 : 0, 10, dt)
    if (toB !== wasB.current) flash.current = 1
    wasB.current = toB
    flash.current = Math.max(0, flash.current - dt * 4)
    // only the side COM is joined to glows
    if (pathA.current) pathA.current.emissiveIntensity = (toB ? 0 : flow.current) * 1.6
    if (pathB.current) pathB.current.emissiveIntensity = (toB ? flow.current : 0) * 1.6
    spark.current = flash.current * 0.7
  })

  return (
    <group rotation={[0.55, 0, 0]} position={[0, -0.02, 0]}>
      <group rotation={[0, 0, -rotation * DEG]}>
        {/* the board, its three pads and the copper paths from COM */}
        <RoundedBox args={[1.72, 0.86, PCB_T]} radius={0.03} smoothness={2} position={[0, -PCB_T / 2, -0.04]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#15803d" roughness={0.55} metalness={0.1} />
        </RoundedBox>
        {[-PAD_X, 0, PAD_X].map((x) => (
          <mesh key={x} position={[x, 0.002, 0.3]}>
            <cylinderGeometry args={[0.06, 0.06, 0.008, 18]} />
            <meshStandardMaterial {...GOLD} />
          </mesh>
        ))}
        {[
          { ref: pathA, x: -PAD_X / 2 },
          { ref: pathB, x: PAD_X / 2 },
        ].map(({ ref, x }) => (
          <mesh key={x} position={[x, 0.003, 0.3]}>
            <boxGeometry args={[PAD_X - 0.1, 0.006, 0.05]} />
            <meshStandardMaterial ref={ref} {...COPPER} emissive="#4ade80" emissiveIntensity={0} toneMapped={false} />
          </mesh>
        ))}
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <Letter char="A" position={[-0.62, -0.3, 0.003]} scale={1.3} />
          <Letter char="B" position={[0.62, -0.3, 0.003]} scale={1.3} />
          <Letter char="C" position={[0, -0.42, 0.003]} scale={0.9} />
        </group>
        {/* the metal shell with its slot, and the black knob */}
        <group position={[0, SHELL_H / 2, -0.06]}>
          <RoundedBox args={[SHELL_W, SHELL_H, SHELL_D]} radius={0.02} smoothness={2}>
            <meshStandardMaterial {...BRUSHED} />
          </RoundedBox>
          <mesh position={[0, SHELL_H / 2 + 0.001, 0]}>
            <boxGeometry args={[KNOB_TRAVEL * 2 + 0.22, 0.004, 0.12]} />
            <meshStandardMaterial color="#27272a" roughness={0.8} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (SHELL_W / 2 + 0.06), -SHELL_H / 2 + 0.02, 0]}>
              <boxGeometry args={[0.12, 0.04, 0.16]} />
              <meshStandardMaterial {...BRUSHED} />
            </mesh>
          ))}
          <group ref={knob} position={[toB ? KNOB_TRAVEL : -KNOB_TRAVEL, SHELL_H / 2, 0]}>
            <RoundedBox args={[0.2, 0.24, 0.11]} radius={0.025} smoothness={2} position={[0, 0.11, 0]}>
              <meshStandardMaterial color="#18181b" roughness={0.45} />
            </RoundedBox>
            {[-0.05, 0, 0.05].map((x) => (
              <mesh key={x} position={[x, 0.2, 0.057]}>
                <boxGeometry args={[0.014, 0.12, 0.006]} />
                <meshStandardMaterial color="#3f3f46" roughness={0.6} />
              </mesh>
            ))}
          </group>
        </group>
        <Halo color="#bbf7d0" intensity={spark} position={[0, SHELL_H + 0.2, 0]} scale={0.9} />
      </group>
    </group>
  )
}

/* ---------------------------------------------------------- micro switch */

const BODY_W = 1.2
const BODY_H = 0.6
const BODY_D = 0.36
const HINGE_X = -0.5
const LEVER_LENGTH = 1.08
/** the lever's slope when it rests, and when it is pressed onto the plunger */
const LEVER_UP = 7 * DEG
const LEVER_DOWN = 2 * DEG
const PLUNGER_X = 0.28

/**
 * Micro switch: a black box with a red plunger and a metal lever with a little
 * wheel. Hold the button and the lever presses the plunger: click! COM moves from NC to NO.
 */
export function MicroSwitchModel({ pressed }: { pressed: boolean }) {
  const lever = useRef<THREE.Group>(null)
  const plunger = useRef<THREE.Mesh>(null)
  const angle = useRef(pressed ? LEVER_DOWN : LEVER_UP)
  const flash = useRef(0)
  const was = useRef(pressed)
  const spark = useRef(0)

  useFrame((_, dt) => {
    angle.current = damp(angle.current, pressed ? LEVER_DOWN : LEVER_UP, 22, dt)
    const a = angle.current
    if (lever.current) lever.current.rotation.z = a
    // the plunger sits under the lever and moves with it
    const reach = (a - LEVER_DOWN) / (LEVER_UP - LEVER_DOWN)
    if (plunger.current) plunger.current.position.y = BODY_H / 2 + 0.02 + reach * 0.065
    if (pressed !== was.current) flash.current = 1
    was.current = pressed
    flash.current = Math.max(0, flash.current - dt * 4)
    spark.current = flash.current * 0.6
  })

  return (
    <group position={[0.02, -0.08, 0]} rotation={[0.28, -0.32, 0]}>
      {/* the three tabs: C, NC and NO */}
      {[-0.42, 0.02, 0.44].map((x) => (
        <group key={x} position={[x, -BODY_H / 2 - 0.15, 0]}>
          <mesh>
            <boxGeometry args={[0.13, 0.3, 0.025]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
          <mesh position={[0, -0.06, 0.014]}>
            <cylinderGeometry args={[0.025, 0.025, 0.006, 12]} />
            <meshStandardMaterial color="#71717a" />
          </mesh>
        </group>
      ))}
      {/* the black body with its two mounting holes */}
      <RoundedBox args={[BODY_W, BODY_H, BODY_D]} radius={0.035} smoothness={2}>
        <meshStandardMaterial color="#1c1c1f" roughness={0.45} />
      </RoundedBox>
      {[-0.36, 0.36].map((x) => (
        <group key={x} position={[x, -0.05, BODY_D / 2 + 0.001]}>
          <mesh>
            <circleGeometry args={[0.05, 20]} />
            <meshStandardMaterial color="#09090b" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0, 0.001]}>
            <ringGeometry args={[0.05, 0.065, 24]} />
            <meshStandardMaterial color="#3f3f46" roughness={0.6} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.2, BODY_D / 2 + 0.002]}>
        <boxGeometry args={[0.5, 0.05, 0.004]} />
        <meshStandardMaterial color="#52525b" roughness={0.7} />
      </mesh>
      {/* the red plunger */}
      <mesh ref={plunger} position={[PLUNGER_X, BODY_H / 2 + 0.09, 0]}>
        <boxGeometry args={[0.15, 0.13, 0.14]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} />
      </mesh>
      {/* the hinge, the springy lever and its wheel */}
      <mesh position={[HINGE_X, BODY_H / 2 + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, BODY_D * 0.8, 14]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <group ref={lever} position={[HINGE_X, BODY_H / 2 + 0.06, 0]} rotation={[0, 0, LEVER_UP]}>
        <mesh position={[LEVER_LENGTH / 2, 0.012, 0]}>
          <boxGeometry args={[LEVER_LENGTH, 0.024, 0.2]} />
          <meshStandardMaterial {...BRUSHED} />
        </mesh>
        <group position={[LEVER_LENGTH, 0.07, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.12, 24]} />
            <meshStandardMaterial color="#e4e4e7" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.2, 10]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
          {[-0.07, 0.07].map((z) => (
            <mesh key={z} position={[-0.05, -0.04, z]}>
              <boxGeometry args={[0.16, 0.08, 0.012]} />
              <meshStandardMaterial {...BRUSHED} />
            </mesh>
          ))}
        </group>
      </group>
      <Halo color="#fef3c7" intensity={spark} position={[PLUNGER_X, BODY_H / 2 + 0.1, 0.25]} scale={0.8} />
    </group>
  )
}

/* -------------------------------------------------------------- joystick */

const STICK_TILT = 24 * DEG
const STICK_LENGTH = 0.36

/**
 * Thumb joystick on its black board: the stick tilts the way the two sliders
 * push it, and the two blue knobs on its sides turn with it.
 */
export function JoystickModel({ x, y, powered }: { x: number; y: number; powered: boolean }) {
  const stick = useRef<THREE.Group>(null)
  const knobX = useRef<THREE.Mesh>(null)
  const knobY = useRef<THREE.Mesh>(null)
  const tilt = useRef({ x: (unit(x) - 0.5) * 2, y: (unit(y) - 0.5) * 2 })
  const glow = useRef(0)

  useFrame((_, dt) => {
    tilt.current.x = damp(tilt.current.x, (unit(x) - 0.5) * 2, 14, dt)
    tilt.current.y = damp(tilt.current.y, (unit(y) - 0.5) * 2, 14, dt)
    const { x: tx, y: ty } = tilt.current
    if (stick.current) {
      // pushed right, the top leans right; pushed up, it leans up
      stick.current.rotation.set(-ty * STICK_TILT, tx * STICK_TILT, 0)
    }
    if (knobX.current) knobX.current.rotation.x = tx * 1.2
    if (knobY.current) knobY.current.rotation.y = ty * 1.2
    glow.current = powered ? 0.3 : 0
  })

  return (
    <group position={[0.06, -0.02, 0]} rotation={[-0.62, 0.32, 0]}>
      {/* the black board with its five pins along one edge */}
      <RoundedBox args={[1.18, 1.04, 0.05]} radius={0.03} smoothness={2}>
        <meshStandardMaterial color="#1f1f23" roughness={0.6} metalness={0.1} />
      </RoundedBox>
      {[-0.48, 0.48].flatMap((px) =>
        [-0.42, 0.42].map((py) => (
          <mesh key={`${px}${py}`} position={[px, py, 0.026]}>
            <ringGeometry args={[0.035, 0.055, 18]} />
            <meshStandardMaterial {...GOLD} />
          </mesh>
        )),
      )}
      <mesh position={[-0.53, 0, 0.05]}>
        <boxGeometry args={[0.1, 5 * 0.126, 0.1]} />
        <meshStandardMaterial color="#18181b" roughness={0.6} />
      </mesh>
      {[-2, -1, 0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.68, i * 0.126, 0.05]}>
          <boxGeometry args={[0.32, 0.035, 0.035]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
      ))}
      <mesh position={[-0.36, 0.42, 0.027]}>
        <boxGeometry args={[0.2, 0.014, 0.004]} />
        <meshStandardMaterial {...SILK} />
      </mesh>
      {/* the gimbal: a dark frame with a blue knob on two of its sides */}
      <group position={[0.08, 0, 0.025]}>
        <RoundedBox args={[0.62, 0.62, 0.2]} radius={0.03} smoothness={2} position={[0, 0, 0.1]}>
          <meshStandardMaterial color="#2a2a2f" roughness={0.5} />
        </RoundedBox>
        <mesh ref={knobX} position={[0, -0.38, 0.1]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.24, 0.12, 0.18]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
        </mesh>
        <mesh ref={knobY} position={[0.38, 0, 0.1]}>
          <boxGeometry args={[0.12, 0.24, 0.18]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.205]}>
          <circleGeometry args={[0.2, 32]} />
          <meshStandardMaterial color="#111114" roughness={0.7} />
        </mesh>
        {/* the stick and its round thumb cap, tilting from the middle */}
        <group ref={stick} position={[0, 0, 0.2]}>
          <mesh position={[0, 0, STICK_LENGTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.05, STICK_LENGTH, 12]} />
            <meshStandardMaterial color="#3f3f46" metalness={0.4} roughness={0.4} />
          </mesh>
          <group position={[0, 0, STICK_LENGTH]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.27, 0.24, 0.16, 36]} />
              <meshStandardMaterial color="#1c1c1f" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0, 0.082]}>
              <torusGeometry args={[0.235, 0.035, 10, 36]} />
              <meshStandardMaterial color="#27272a" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.07]}>
              <circleGeometry args={[0.22, 36]} />
              <meshStandardMaterial color="#141417" roughness={0.75} />
            </mesh>
          </group>
        </group>
      </group>
      <Halo color="#ef4444" intensity={glow} position={[0.45, 0.42, 0.06]} scale={0.3} />
      <mesh position={[0.45, 0.42, 0.035]}>
        <boxGeometry args={[0.07, 0.04, 0.03]} />
        <meshStandardMaterial color="#fecaca" emissive="#ef4444" emissiveIntensity={powered ? 2.2 : 0.03} toneMapped={false} />
      </mesh>
    </group>
  )
}
