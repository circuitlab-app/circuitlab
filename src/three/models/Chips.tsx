import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { GateType } from '@/circuit/catalog'
import { Halo, Smoke, damp } from '../helpers'
import { Indicator, SidePin } from './kit'
import { METAL, SILK, unit, useBuiltWith } from './shared'

export const BOARD_T = 0.05
export const FACE = BOARD_T / 2
/** chip modules lean back a little and turn to show their edge, like the sensor modules */
const TILT: [number, number, number] = [-0.3, 0.22, 0]

/* ------------------------------------------------------------- DIP chip */

/** A black DIP chip lying on a board: `pins` legs along each long side, a notch at the left end. */
export function DipChip({ width, height, pins, position }: { width: number; height: number; pins: number; position: [number, number, number] }) {
  const pitch = (width - 0.16) / (pins - 1)
  return (
    <group position={position}>
      <RoundedBox args={[width, height, 0.11]} radius={0.015} smoothness={2} position={[0, 0, 0.055]}>
        <meshStandardMaterial color="#19191c" roughness={0.45} />
      </RoundedBox>
      {/* pin 1 notch and dot */}
      <mesh position={[-width / 2, 0, 0.105]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.012, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#060607" roughness={0.8} />
      </mesh>
      <mesh position={[-width / 2 + 0.09, -height / 2 + 0.08, 0.111]}>
        <circleGeometry args={[0.022, 12]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.6} />
      </mesh>
      {Array.from({ length: pins }, (_, i) =>
        [1, -1].map((side) => (
          <mesh key={`${i}${side}`} position={[-width / 2 + 0.08 + i * pitch, side * (height / 2 + 0.03), 0.035]}>
            <boxGeometry args={[0.05, 0.07, 0.03]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
        )),
      )}
    </group>
  )
}

/* ---------------------------------------------------------- logic gates */

const GATE_BOARD = {
  notGate: '#9a3412',
  andGate: '#166534',
  orGate: '#1e3a8a',
  xorGate: '#581c87',
  nandGate: '#115e59',
  norGate: '#3730a3',
} as const

/** The gate's symbol, as the flat white print on top of the chip (about 0.32 tall). */
function symbolGeometry(kind: GateType) {
  const shapes: THREE.Shape[] = []
  const h = 0.15
  const body = new THREE.Shape()
  switch (kind) {
    case 'notGate':
      body.moveTo(-0.14, -h)
      body.lineTo(0.1, 0)
      body.lineTo(-0.14, h)
      body.closePath()
      break
    case 'andGate':
    case 'nandGate': {
      // NAND sits a little to the left to make room for its bubble
      const x = kind === 'nandGate' ? -0.03 : 0
      body.moveTo(-0.15 + x, -h)
      body.lineTo(x, -h)
      body.absarc(x, 0, h, -Math.PI / 2, Math.PI / 2, false)
      body.lineTo(-0.15 + x, h)
      body.closePath()
      break
    }
    case 'orGate':
    case 'xorGate':
    case 'norGate': {
      const x = kind === 'xorGate' ? 0.03 : kind === 'norGate' ? -0.03 : 0
      body.moveTo(-0.16 + x, h)
      body.quadraticCurveTo(0.04 + x, h, 0.16 + x, 0)
      body.quadraticCurveTo(0.04 + x, -h, -0.16 + x, -h)
      body.quadraticCurveTo(-0.08 + x, 0, -0.16 + x, h)
      break
    }
  }
  shapes.push(body)
  if (kind === 'xorGate') {
    // the extra curve behind an XOR's body
    const arc = new THREE.Shape()
    arc.moveTo(-0.2, h)
    arc.quadraticCurveTo(-0.12, 0, -0.2, -h)
    arc.lineTo(-0.175, -h)
    arc.quadraticCurveTo(-0.095, 0, -0.175, h)
    arc.closePath()
    shapes.push(arc)
  }
  if (kind === 'notGate' || kind === 'nandGate' || kind === 'norGate') {
    // the little circle that means "the opposite"
    const at = kind === 'notGate' ? 0.135 : kind === 'nandGate' ? 0.155 : 0.165
    const bubble = new THREE.Shape().absarc(at, 0, 0.035, 0, Math.PI * 2, false)
    bubble.holes.push(new THREE.Path().absarc(at, 0, 0.018, 0, Math.PI * 2, true))
    shapes.push(bubble)
  }
  return new THREE.ShapeGeometry(shapes, 16)
}

/**
 * A logic gate on its little board: the chip with the gate's symbol printed on
 * it, a green LED for each input on the left and one for the output Y on the
 * right, and the header pins in the same places as the card's terminals.
 */
export function LogicGateModel({
  kind,
  inputs,
  output,
  powered,
}: {
  kind: GateType
  /** A (and B): 0 or 1 */
  inputs: number[]
  output: number
  powered: boolean
}) {
  const symbol = useBuiltWith(symbolGeometry, kind)
  const ins = kind === 'notGate' ? [0] : [0.2, -0.2]
  const backX = { notGate: -0.14, andGate: -0.15, orGate: -0.125, xorGate: -0.095, nandGate: -0.18, norGate: -0.155 }[kind]
  const tipX = { notGate: 0.17, andGate: 0.16, orGate: 0.16, xorGate: 0.19, nandGate: 0.19, norGate: 0.2 }[kind]
  return (
    <group position={[0.06, 0, 0]} rotation={TILT}>
      <RoundedBox args={[2.1, 1.25, BOARD_T]} radius={0.03} smoothness={2}>
        <meshStandardMaterial color={GATE_BOARD[kind]} roughness={0.55} metalness={0.1} />
      </RoundedBox>
      <DipChip width={0.98} height={0.44} pins={7} position={[0, 0, FACE]} />
      {/* the symbol and its little legs, printed white on the chip */}
      <group position={[0, 0, FACE + 0.112]}>
        <mesh geometry={symbol}>
          <meshStandardMaterial {...SILK} />
        </mesh>
        {ins.map((y) => (
          <mesh key={y} position={[(-0.33 + backX) / 2 + 0.02, y * 0.4, 0]}>
            <planeGeometry args={[backX + 0.33 + 0.04, 0.018]} />
            <meshStandardMaterial {...SILK} />
          </mesh>
        ))}
        <mesh position={[(tipX + 0.33) / 2, 0, 0]}>
          <planeGeometry args={[0.33 - tipX, 0.018]} />
          <meshStandardMaterial {...SILK} />
        </mesh>
      </group>
      {/* silk traces from the input LEDs to the chip and from the chip to Y */}
      {ins.map((y) => (
        <mesh key={y} position={[-0.66, y, FACE + 0.002]}>
          <boxGeometry args={[0.22, 0.014, 0.004]} />
          <meshStandardMaterial {...SILK} />
        </mesh>
      ))}
      <mesh position={[0.62, 0, FACE + 0.002]}>
        <boxGeometry args={[0.26, 0.014, 0.004]} />
        <meshStandardMaterial {...SILK} />
      </mesh>
      {ins.map((y, i) => (
        <Indicator key={y} position={[-0.83, y, FACE + 0.02]} color="#22c55e" off="#bbf7d0" level={powered ? (inputs[i] ?? 0) : 0} />
      ))}
      <Indicator position={[0.83, 0, FACE + 0.025]} color="#22c55e" off="#bbf7d0" level={powered ? output : 0} size={[0.12, 0.08, 0.05]} halo={0.7} />
      <Indicator position={[0.83, 0.47, FACE + 0.02]} color="#ef4444" off="#fecaca" level={powered ? 1 : 0} size={[0.07, 0.045, 0.035]} halo={0.35} />
      {/* header pins where the card's terminals are: + and − at the corners, the inputs between, Y on the right */}
      {[0.45, ...ins, -0.45].map((y) => (
        <SidePin key={y} x={-1.05} y={y} z={FACE + 0.06} direction={-1} length={0.22} />
      ))}
      <SidePin x={1.05} y={0} z={FACE + 0.06} direction={1} length={0.22} />
      <mesh position={[-0.9, 0.45, FACE + 0.003]}>
        <boxGeometry args={[0.06, 0.06, 0.004]} />
        <meshStandardMaterial color="#ef4444" roughness={0.6} />
      </mesh>
      <mesh position={[-0.9, -0.45, FACE + 0.003]}>
        <boxGeometry args={[0.06, 0.06, 0.004]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.6} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------ 555 timer */

/** A 555 blinker board: the chip, its timing capacitor and resistor, and a red LED that blinks with OUT. */
export function Timer555Model({ output, powered }: { output: number; powered: boolean }) {
  const lens = useRef<THREE.MeshStandardMaterial>(null)
  const light = useRef(0)
  const glow = useRef(0)
  useFrame((_, dt) => {
    // a 555 switches in a flash, so the LED snaps on and off
    light.current = damp(light.current, powered ? unit(output) : 0, 32, dt)
    if (lens.current) lens.current.emissiveIntensity = 0.08 + light.current * 2.6
    glow.current = light.current * 0.9
  })
  return (
    <group position={[0.05, 0, 0]} rotation={TILT}>
      <RoundedBox args={[2, 1.2, BOARD_T]} radius={0.03} smoothness={2}>
        <meshStandardMaterial color="#0f766e" roughness={0.55} metalness={0.1} />
      </RoundedBox>
      <DipChip width={0.62} height={0.42} pins={4} position={[-0.28, 0.02, FACE]} />
      <mesh position={[-0.28, 0.02, FACE + 0.112]}>
        <planeGeometry args={[0.32, 0.03]} />
        <meshStandardMaterial {...SILK} />
      </mesh>
      {/* timing capacitor, standing up */}
      <group position={[0.36, -0.26, FACE]}>
        <mesh position={[0, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.32, 24]} />
          <meshStandardMaterial color="#2563eb" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.335]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.01, 24]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        <mesh position={[0.1, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.322, 6, 1, false, -0.6, 1.2]} />
          <meshStandardMaterial color="#bfdbfe" roughness={0.5} />
        </mesh>
      </group>
      {/* timing resistor, lying down */}
      <group position={[0.36, 0.3, FACE + 0.06]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.055, 0.2, 6, 12]} />
          <meshStandardMaterial color="#e9d3a5" roughness={0.55} />
        </mesh>
        {[-0.07, -0.02, 0.03, 0.09].map((x, i) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.057, 0.057, 0.025, 12]} />
            <meshStandardMaterial color={['#7c3f12', '#1c1917', '#f97316', '#d4a017'][i]} roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* the blinking LED */}
      <group position={[0.76, 0.02, FACE]}>
        <mesh position={[0, 0, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.22, 24]} />
          <meshStandardMaterial ref={lens} color="#ef4444" emissive="#ff3b3b" emissiveIntensity={0.08} transparent opacity={0.85} roughness={0.2} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.24]}>
          <sphereGeometry args={[0.12, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ef4444" emissive="#ff3b3b" emissiveIntensity={0.5} transparent opacity={0.85} roughness={0.2} toneMapped={false} />
        </mesh>
        <Halo color="#ff4d4d" intensity={glow} position={[0, 0, 0.32]} scale={1.1} />
      </group>
      <Indicator position={[-0.75, 0.42, FACE + 0.02]} color="#ef4444" off="#fecaca" level={powered ? 0.6 : 0} size={[0.07, 0.045, 0.035]} halo={0.3} />
      <SidePin x={-1} y={0.3} z={FACE + 0.06} direction={-1} length={0.22} />
      <SidePin x={-1} y={-0.3} z={FACE + 0.06} direction={-1} length={0.22} />
      <SidePin x={1} y={0} z={FACE + 0.06} direction={1} length={0.22} />
    </group>
  )
}

/* ------------------------------------------------------ voltage regulator */

/** A 7805 in its TO-220 case on a little finned heatsink. The metal glows when the extra volts turn into heat. */
export function RegulatorModel({ heat, regulating }: { heat: number; regulating: boolean }) {
  const tab = useRef<THREE.MeshStandardMaterial>(null)
  const sink = useRef<THREE.MeshStandardMaterial>(null)
  const warm = useRef(0)
  const status = useRef(0)
  const glow = useRef(0)
  useFrame((_, dt) => {
    warm.current = damp(warm.current, THREE.MathUtils.clamp(heat - 0.5, 0, 1.5), 1.5, dt)
    status.current = damp(status.current, regulating ? 1 : 0, 10, dt)
    const w = warm.current * 0.45
    if (tab.current) tab.current.emissiveIntensity = w
    if (sink.current) sink.current.emissiveIntensity = w * 0.6
    glow.current = status.current * 0.5
  })
  const fins = [-0.42, -0.28, -0.14, 0, 0.14, 0.28, 0.42]
  return (
    <group position={[-0.15, 0.06, 0]} rotation={[0.18, -0.5, 0]}>
      {/* heatsink: a plate with fins behind the chip */}
      <mesh position={[0, 0.12, -0.15]}>
        <boxGeometry args={[1.0, 0.98, 0.05]} />
        <meshStandardMaterial ref={sink} color="#b8bec7" metalness={0.55} roughness={0.35} emissive="#ff5a1f" emissiveIntensity={0} />
      </mesh>
      {fins.map((x) => (
        <mesh key={x} position={[x, 0.12, -0.33]}>
          <boxGeometry args={[0.045, 0.98, 0.32]} />
          <meshStandardMaterial color="#c3c9d1" metalness={0.55} roughness={0.35} />
        </mesh>
      ))}
      {/* the metal tab with its screw */}
      <mesh position={[0, 0.36, -0.09]}>
        <boxGeometry args={[0.64, 0.5, 0.05]} />
        <meshStandardMaterial ref={tab} color="#d9dde3" metalness={0.6} roughness={0.3} emissive="#ff5a1f" emissiveIntensity={0} />
      </mesh>
      <mesh position={[0, 0.44, -0.055]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 6]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0.44, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.03, 20]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* the black body and its printing */}
      <RoundedBox args={[0.64, 0.56, 0.18]} radius={0.02} smoothness={2} position={[0, -0.12, 0]}>
        <meshStandardMaterial color="#1a1a1d" roughness={0.45} />
      </RoundedBox>
      {[
        [0.0, 0.42],
        [-0.1, 0.3],
      ].map(([y, w]) => (
        <mesh key={y} position={[0, y - 0.08, 0.092]}>
          <boxGeometry args={[w, 0.03, 0.004]} />
          <meshStandardMaterial color="#d4d4d8" roughness={0.7} />
        </mesh>
      ))}
      {/* a tiny green mark lights while it holds 5 V */}
      <mesh position={[0.2, -0.32, 0.093]}>
        <circleGeometry args={[0.025, 16]} />
        <meshBasicMaterial color="#4ade80" toneMapped={false} transparent opacity={0.9} />
      </mesh>
      <Halo color="#4ade80" intensity={glow} position={[0.2, -0.32, 0.14]} scale={0.35} />
      {/* IN, GND and OUT legs */}
      {[-0.2, 0, 0.2].map((x) => (
        <mesh key={x} position={[x, -0.72, 0]}>
          <boxGeometry args={[0.07, 0.66, 0.03]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      ))}
      <Smoke active={heat > 2.2} position={[0, 0.6, -0.1]} rise={0.35} color="#d4d4d8" />
    </group>
  )
}
