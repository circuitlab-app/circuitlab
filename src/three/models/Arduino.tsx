import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Halo, damp } from '../helpers'

const BOARD_W = 3.4
const BOARD_D = 2.2
const BOARD_T = 0.06
/** top surface of the PCB */
const TOP = BOARD_T / 2
const PITCH = 0.126
const HEADER_H = 0.16

/** Female header strips: left edge, number of pins, depth position (−z is the top edge). */
const HEADERS = [
  { x0: -0.83, n: 10, z: -0.99 }, // SCL SDA AREF GND D13 … D8
  { x0: 0.5, n: 8, z: -0.99 }, // D7 … D0
  { x0: -0.4, n: 8, z: 0.99 }, // power
  { x0: 0.8, n: 6, z: 0.99 }, // A0 … A5
]
const OUTPUTS = ['D13', 'D12', 'D11', 'D10', 'D9', 'D8'] as const
/** D13 is the fifth hole of the first strip, D8 the tenth */
const OUTPUT_X = OUTPUTS.map((_, i) => HEADERS[0].x0 + PITCH / 2 + (4 + i) * PITCH)
const OUTPUT_LED_Z = -0.84
const L_LED: [number, number, number] = [-0.45, TOP + 0.018, -0.66]
const ON_LED: [number, number, number] = [1.25, TOP + 0.018, -0.55]
const MOUNT_HOLES: [number, number][] = [
  [-1.006, 0.997],
  [-0.947, -0.997],
  [1.571, 0.786],
  [1.571, -0.365],
]
const CHIP_X = 0.6
const CHIP_Z = 0.52
const CHIP_TOP = TOP + 0.05 + 0.13

type Box = { size: [number, number, number]; at: [number, number, number]; turn?: number }

/** Many small boxes that share one material, as one mesh. */
function mergeBoxes(boxes: Box[]) {
  const parts = boxes.map(({ size, at, turn = 0 }) =>
    new THREE.BoxGeometry(...size).rotateY(turn).translate(...at),
  )
  const merged = mergeGeometries(parts) ?? new THREE.BufferGeometry()
  parts.forEach((g) => g.dispose())
  return merged
}

function buildGeometries() {
  const strips: Box[] = HEADERS.map(({ x0, n, z }) => ({
    size: [n * PITCH, HEADER_H, 0.12],
    at: [x0 + (n * PITCH) / 2, TOP + HEADER_H / 2, z],
  }))
  const holes: Box[] = HEADERS.flatMap(({ x0, n, z }) =>
    Array.from({ length: n }, (_, i) => ({
      size: [0.05, 0.004, 0.05] as [number, number, number],
      at: [x0 + PITCH / 2 + i * PITCH, TOP + HEADER_H + 0.001, z] as [number, number, number],
    })),
  )
  // 2 × 14 legs of the DIP chip
  const chipLegs: Box[] = [-1, 1].flatMap((side) =>
    Array.from({ length: 14 }, (_, i) => ({
      size: [0.045, 0.08, 0.03] as [number, number, number],
      at: [CHIP_X - 0.715 + i * 0.11, TOP + 0.09, CHIP_Z + side * 0.185] as [number, number, number],
    })),
  )
  // ICSP header pins
  const icsp: Box[] = [-1, 1].flatMap((side) =>
    [-1, 0, 1].map((row) => ({
      size: [0.035, 0.2, 0.035] as [number, number, number],
      at: [1.45 + side * 0.063, TOP + 0.1, row * 0.126] as [number, number, number],
    })),
  )
  // white silkscreen: "UNO" and the − / + inside the logo
  const s = 0.024
  const t = 0.004
  const y = TOP + 0.002
  const glyph = (cx: number): Box[] => [
    { size: [s, t, 0.16], at: [cx - 0.045, y, -0.3] },
    { size: [s, t, 0.16], at: [cx + 0.045, y, -0.3] },
  ]
  const silk: Box[] = [
    ...glyph(0.72),
    { size: [0.09 + s, t, s], at: [0.72, y, -0.3 + 0.08 - s / 2] },
    ...glyph(0.88),
    { size: [s, t, 0.184], at: [0.88, y, -0.3], turn: Math.atan2(0.09, 0.16) },
    { size: [0.07, t, 0.018], at: [0.2, y, -0.3] },
    { size: [0.07, t, 0.018], at: [0.4, y, -0.3] },
    { size: [0.018, t, 0.07], at: [0.4, y, -0.3] },
    // pin ticks between the header and its LEDs
    ...OUTPUT_X.map((x): Box => ({ size: [0.012, t, 0.04], at: [x, y, -0.895] })),
  ]
  // a handful of tiny SMD resistors (dark) and capacitors (tan)
  const resistors: Box[] = [
    [-0.2, -0.66],
    [-0.05, -0.66],
    [0.1, -0.66],
    [-0.62, 0.2],
    [1.18, -0.3],
  ].map(([x, z]) => ({ size: [0.075, 0.025, 0.04], at: [x, TOP + 0.0125, z] }))
  const capacitors: Box[] = [
    [0.0, 0.12],
    [0.13, 0.12],
    [1.15, 0.12],
    [-0.32, 0.3],
    [-0.3, -0.42],
  ].map(([x, z]) => ({ size: [0.075, 0.03, 0.04], at: [x, TOP + 0.015, z], turn: Math.PI / 2 }))
  return {
    strips: mergeBoxes(strips),
    holes: mergeBoxes(holes),
    chipLegs: mergeBoxes(chipLegs),
    icsp: mergeBoxes(icsp),
    silk: mergeBoxes(silk),
    resistors: mergeBoxes(resistors),
    capacitors: mergeBoxes(capacitors),
  }
}

/** no environment map here, so big metal faces need some diffuse colour to not look black */
const silver = { color: '#d9dde3', metalness: 0.5, roughness: 0.35 } as const
const silkscreen = { color: '#f1f5f9', roughness: 0.7 } as const

/** A small SMD LED: pale when off, glowing in its colour when on. */
function SmdLed({
  position,
  color,
  off,
  register,
}: {
  position: [number, number, number]
  color: string
  off: string
  register?: (m: THREE.MeshStandardMaterial | null) => void
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.07, 0.035, 0.045]} />
      <meshStandardMaterial ref={register} color={off} emissive={color} emissiveIntensity={0.02} roughness={0.35} toneMapped={false} />
    </mesh>
  )
}

/** Arduino-UNO-style board: one amber LED per output pin, the "L" LED on pin 13 and a green ON light. */
export function ArduinoModel({
  pins,
  powered,
}: {
  /** output level 0..1 of D8 … D13 */
  pins: Record<string, number>
  powered: boolean
}) {
  const geometries = useMemo(() => buildGeometries(), [])
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries])

  const pinMaterials = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const pinLevels = useRef(OUTPUTS.map(() => 0))
  const pinGlows = useMemo(() => OUTPUTS.map(() => ({ current: 0 })), [])
  const lMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const onMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const lLevel = useRef(0)
  const lGlow = useRef(0)
  const onLevel = useRef(powered ? 1 : 0)
  const onGlow = useRef(0)

  useFrame((_, dt) => {
    const level = (pin: string) => {
      const v = pins[pin] ?? 0
      return THREE.MathUtils.clamp(Number.isFinite(v) ? v : 0, 0, 1)
    }
    OUTPUTS.forEach((pin, i) => {
      // LEDs follow their pin almost instantly
      const v = (pinLevels.current[i] = damp(pinLevels.current[i], level(pin), 16, dt))
      const m = pinMaterials.current[i]
      if (m) m.emissiveIntensity = 0.02 + v * 3
      pinGlows[i].current = v * 0.7
    })
    lLevel.current = damp(lLevel.current, level('D13'), 16, dt)
    if (lMaterial.current) lMaterial.current.emissiveIntensity = 0.02 + lLevel.current * 3
    lGlow.current = lLevel.current * 0.75

    onLevel.current = damp(onLevel.current, powered ? 1 : 0, 12, dt)
    if (onMaterial.current) onMaterial.current.emissiveIntensity = 0.02 + onLevel.current * 2.6
    onGlow.current = onLevel.current * 0.7
  })

  return (
    <group position={[0, -0.04, 0]} rotation={[0.72, 0, 0]}>
      {/* centred on the board plus the USB port sticking out on the left */}
      <group position={[0.11, 0, 0]}>
        <RoundedBox args={[BOARD_W, BOARD_T, BOARD_D]} radius={0.025} smoothness={2}>
          <meshStandardMaterial color="#00878f" roughness={0.55} metalness={0.1} />
        </RoundedBox>
        {MOUNT_HOLES.map(([x, z]) => (
          <group key={`${x}${z}`} position={[x, TOP + 0.001, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh>
              <ringGeometry args={[0.04, 0.075, 20]} />
              <meshStandardMaterial {...silver} />
            </mesh>
            <mesh>
              <circleGeometry args={[0.04, 16]} />
              <meshStandardMaterial color="#06282a" roughness={0.9} />
            </mesh>
          </group>
        ))}

        {/* female headers along the top and bottom edges */}
        <mesh geometry={geometries.strips}>
          <meshStandardMaterial color="#232326" roughness={0.6} />
        </mesh>
        <mesh geometry={geometries.holes}>
          <meshStandardMaterial color="#050505" roughness={0.9} />
        </mesh>

        {/* USB-B port */}
        <group position={[-1.53, TOP + 0.22, -0.47]}>
          <mesh>
            <boxGeometry args={[0.78, 0.44, 0.5]} />
            <meshStandardMaterial {...silver} />
          </mesh>
          <mesh position={[-0.392, 0, 0]}>
            <boxGeometry args={[0.01, 0.3, 0.34]} />
            <meshStandardMaterial color="#27272a" roughness={0.8} />
          </mesh>
          <mesh position={[-0.394, 0.02, 0]}>
            <boxGeometry args={[0.012, 0.1, 0.22]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
          </mesh>
        </group>

        {/* DC barrel jack */}
        <group position={[-1.445, TOP + 0.22, 0.78]}>
          <RoundedBox args={[0.69, 0.44, 0.37]} radius={0.04} smoothness={2}>
            <meshStandardMaterial color="#18181b" roughness={0.5} />
          </RoundedBox>
          <mesh position={[-0.345, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 20]} />
            <meshStandardMaterial color="#000000" roughness={1} />
          </mesh>
          <mesh position={[-0.35, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
            <meshStandardMaterial {...silver} />
          </mesh>
        </group>

        {/* ATmega328P in its socket */}
        <mesh position={[CHIP_X, TOP + 0.025, CHIP_Z]}>
          <boxGeometry args={[1.66, 0.05, 0.46]} />
          <meshStandardMaterial color="#121214" roughness={0.6} />
        </mesh>
        <mesh geometry={geometries.chipLegs}>
          <meshStandardMaterial {...silver} />
        </mesh>
        <RoundedBox args={[1.6, 0.13, 0.34]} radius={0.02} smoothness={2} position={[CHIP_X, CHIP_TOP - 0.065, CHIP_Z]}>
          <meshStandardMaterial color="#1a1a1c" roughness={0.45} />
        </RoundedBox>
        <mesh position={[CHIP_X - 0.72, CHIP_TOP + 0.002, CHIP_Z]}>
          <cylinderGeometry args={[0.045, 0.045, 0.004, 16]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.6} />
        </mesh>
        {[
          [0.05, -0.05, 0.55],
          [-0.04, 0.05, 0.38],
        ].map(([dx, dz, w]) => (
          <mesh key={dx} position={[CHIP_X + dx, CHIP_TOP + 0.002, CHIP_Z + dz]}>
            <boxGeometry args={[w, 0.004, 0.035]} />
            <meshStandardMaterial color="#a1a1aa" roughness={0.6} />
          </mesh>
        ))}

        {/* USB chip, crystal, regulator and the two supply capacitors */}
        <mesh position={[-0.75, TOP + 0.02, -0.45]}>
          <boxGeometry args={[0.28, 0.04, 0.28]} />
          <meshStandardMaterial color="#1a1a1c" roughness={0.45} />
        </mesh>
        <mesh position={[-0.62, TOP + 0.04, -0.08]} rotation={[0, 0, Math.PI / 2]} scale={[0.6, 1, 1]}>
          <capsuleGeometry args={[0.065, 0.22, 4, 16]} />
          <meshStandardMaterial {...silver} />
        </mesh>
        <mesh position={[-0.75, TOP + 0.03, 0.78]}>
          <boxGeometry args={[0.26, 0.06, 0.2]} />
          <meshStandardMaterial color="#1a1a1c" roughness={0.45} />
        </mesh>
        <mesh position={[-0.75, TOP + 0.008, 0.62]}>
          <boxGeometry args={[0.26, 0.016, 0.1]} />
          <meshStandardMaterial {...silver} />
        </mesh>
        {[0.15, 0.42].map((z) => (
          <group key={z} position={[-0.95, TOP, z]}>
            <mesh position={[0, 0.015, 0]}>
              <boxGeometry args={[0.22, 0.03, 0.22]} />
              <meshStandardMaterial color="#1f1f22" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.115, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.17, 20]} />
              <meshStandardMaterial {...silver} />
            </mesh>
            <mesh position={[0, 0.201, 0]}>
              <cylinderGeometry args={[0.098, 0.098, 0.004, 16, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>
          </group>
        ))}
        <mesh geometry={geometries.resistors}>
          <meshStandardMaterial color="#27272a" roughness={0.5} />
        </mesh>
        <mesh geometry={geometries.capacitors}>
          <meshStandardMaterial color="#c8a27a" roughness={0.55} />
        </mesh>

        {/* ICSP header */}
        <mesh position={[1.45, TOP + 0.04, 0]}>
          <boxGeometry args={[0.26, 0.08, 0.38]} />
          <meshStandardMaterial color="#1a1a1c" roughness={0.6} />
        </mesh>
        <mesh geometry={geometries.icsp}>
          <meshStandardMaterial color="#e5c76b" metalness={0.85} roughness={0.3} />
        </mesh>

        {/* reset button */}
        <group position={[-1.4, TOP, -0.93]}>
          <mesh position={[0, 0.035, 0]}>
            <boxGeometry args={[0.22, 0.07, 0.22]} />
            <meshStandardMaterial color="#a1a1aa" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.06, 20]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.4} />
          </mesh>
        </group>

        {/* silkscreen: ∞ logo and "UNO" */}
        <mesh geometry={geometries.silk}>
          <meshStandardMaterial {...silkscreen} />
        </mesh>
        {[0.2, 0.4].map((x) => (
          <mesh key={x} position={[x, TOP + 0.002, -0.3]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.2]}>
            <torusGeometry args={[0.1, 0.016, 6, 32]} />
            <meshStandardMaterial {...silkscreen} />
          </mesh>
        ))}
        <group position={[1.045, TOP + 0.002, -0.3]} scale={[1, 1, 1.45]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.2]}>
            <torusGeometry args={[0.055, 0.012, 6, 24]} />
            <meshStandardMaterial {...silkscreen} />
          </mesh>
        </group>

        {/* status LEDs */}
        {OUTPUT_X.map((x, i) => (
          <SmdLed
            key={OUTPUTS[i]}
            position={[x, TOP + 0.018, OUTPUT_LED_Z]}
            color="#ffa31a"
            off="#fde9b8"
            register={(m) => {
              pinMaterials.current[i] = m
            }}
          />
        ))}
        <SmdLed
          position={L_LED}
          color="#ffa31a"
          off="#fde9b8"
          register={(m) => {
            lMaterial.current = m
          }}
        />
        <SmdLed position={[L_LED[0], L_LED[1], L_LED[2] + 0.12]} color="#ffa31a" off="#fde9b8" />
        <SmdLed position={[L_LED[0], L_LED[1], L_LED[2] + 0.24]} color="#ffa31a" off="#fde9b8" />
        <SmdLed
          position={ON_LED}
          color="#22c55e"
          off="#d9f99d"
          register={(m) => {
            onMaterial.current = m
          }}
        />

        {OUTPUT_X.map((x, i) => (
          <Halo key={OUTPUTS[i]} color="#fbbf24" intensity={pinGlows[i]} position={[x, TOP + 0.08, OUTPUT_LED_Z]} scale={0.5} />
        ))}
        <Halo color="#fbbf24" intensity={lGlow} position={[L_LED[0], TOP + 0.08, L_LED[2]]} scale={0.6} />
        <Halo color="#4ade80" intensity={onGlow} position={[ON_LED[0], TOP + 0.08, ON_LED[2]]} scale={0.6} />
      </group>
    </group>
  )
}
