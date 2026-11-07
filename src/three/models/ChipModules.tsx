import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, Smoke, damp } from '../helpers'
import { BOARD_T, DipChip, FACE } from './Chips'
import { Indicator, SidePin } from './kit'
import { PRINT_FONT, markingTexture, printTexture } from './print'
import { GOLD, METAL, SILK, merge, unit, useBuilt, useBuiltWith } from './shared'

/*
 * The chip modules: a memory latch, a counter, a comparator and a motor
 * driver. They are built like the logic gate boards: the same board, the same
 * lean, header pins where the card's terminals are (+ and − at the corners of
 * the left side, the two inputs between them) and little LEDs that show what
 * goes in and what comes out.
 */

const W = 2.1
const H = 1.25
/** the same lean as the logic gate boards */
const TILT: [number, number, number] = [-0.3, 0.22, 0]
/** header pin rows on the left: VCC, the two inputs, GND */
const LEFT_PINS = [0.45, 0.2, -0.2, -0.45]
const PIN_X = W / 2

/* ---------------------------------------------------------------- pieces */

/** A board with copper traces under its solder mask and plated mounting holes. */
function Board({
  color,
  trace,
  traces,
  holes,
  vias = [],
}: {
  color: string
  trace: string
  traces: [number, number, number, number][]
  holes: [number, number][]
  /** where a trace dives through to the other side of the board */
  vias?: [number, number][]
}) {
  const geometry = useBuiltWith(traceGeometry, JSON.stringify(traces))
  return (
    <group>
      <RoundedBox args={[W, H, BOARD_T]} radius={0.03} smoothness={2}>
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} />
      </RoundedBox>
      <mesh geometry={geometry}>
        <meshStandardMaterial color={trace} roughness={0.5} metalness={0.15} />
      </mesh>
      {holes.map(([x, y]) => (
        <group key={`${x}${y}`} position={[x, y, FACE + 0.001]}>
          <mesh>
            <ringGeometry args={[0.042, 0.072, 24]} />
            <meshStandardMaterial {...GOLD} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.042, 24]} />
            <meshStandardMaterial color="#0a0a0b" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {vias.map(([x, y]) => (
        <group key={`${x}${y}`} position={[x, y, FACE + 0.005]}>
          <mesh>
            <ringGeometry args={[0.012, 0.026, 16]} />
            <meshStandardMaterial {...GOLD} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.012, 12]} />
            <meshStandardMaterial color="#0a0a0b" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Copper traces, slightly raised under the solder mask: straight runs between [x0, y0] and [x1, y1]. */
function traceGeometry(key: string) {
  const runs = JSON.parse(key) as [number, number, number, number][]
  return merge(
    runs.map(([x0, y0, x1, y1]) => {
      const length = Math.hypot(x1 - x0, y1 - y0)
      return new THREE.BoxGeometry(length + 0.022, 0.022, 0.006)
        .rotateZ(Math.atan2(y1 - y0, x1 - x0))
        .translate((x0 + x1) / 2, (y0 + y1) / 2, FACE + 0.001)
    }),
  )
}

/** The four header pins on the left edge, with the red + and black − marks beside them. */
function PowerHeader() {
  return (
    <>
      {LEFT_PINS.map((y) => (
        <SidePin key={y} x={-PIN_X} y={y} z={FACE + 0.06} direction={-1} length={0.22} />
      ))}
      <mesh position={[-0.9, 0.45, FACE + 0.003]}>
        <boxGeometry args={[0.06, 0.06, 0.004]} />
        <meshStandardMaterial color="#ef4444" roughness={0.6} />
      </mesh>
      <mesh position={[-0.9, -0.45, FACE + 0.003]}>
        <boxGeometry args={[0.06, 0.06, 0.004]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.6} />
      </mesh>
    </>
  )
}

/** A tiny 0805 part: a black resistor or a tan capacitor with tinned ends. */
function Smd({ x, y, kind, turn = false }: { x: number; y: number; kind: 'r' | 'c'; turn?: boolean }) {
  return (
    <group position={[x, y, FACE + 0.018]} rotation={[0, 0, turn ? Math.PI / 2 : 0]}>
      <mesh>
        <boxGeometry args={[0.075, 0.062, 0.034]} />
        <meshStandardMaterial color={kind === 'r' ? '#141416' : '#b9946a'} roughness={0.55} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.05, 0, 0]}>
          <boxGeometry args={[0.028, 0.064, 0.036]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      ))}
    </group>
  )
}

/** The lens of a through-hole LED (rim, body, round top) standing up along +z, as one piece. */
function ledLensGeometry(key: string) {
  const [radius, height] = key.split(':').map(Number)
  return merge([
    new THREE.CylinderGeometry(radius * 1.16, radius * 1.16, 0.035, 24).rotateX(Math.PI / 2),
    new THREE.CylinderGeometry(radius, radius, height, 24).rotateX(Math.PI / 2).translate(0, 0, height / 2),
    new THREE.SphereGeometry(radius, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).translate(0, 0, height),
  ])
}

/** A 3 mm through-hole LED standing on the board: a diffused lens with a round top that glows with `level`. */
function RoundLed({
  x,
  y,
  color,
  off,
  level,
  speed = 18,
  radius = 0.07,
  height = 0.12,
}: {
  x: number
  y: number
  color: string
  off: string
  level: number
  speed?: number
  radius?: number
  height?: number
}) {
  const lens = useBuiltWith(ledLensGeometry, `${radius}:${height}`)
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const lit = useRef(unit(level))
  const glow = useRef(0)
  useFrame((_, dt) => {
    lit.current = damp(lit.current, unit(level), speed, dt)
    if (material.current) material.current.emissiveIntensity = 0.06 + lit.current * 2.6
    glow.current = lit.current * 0.8
  })
  const base = FACE + 0.02
  return (
    <group position={[x, y, base]}>
      <mesh geometry={lens}>
        <meshStandardMaterial ref={material} color={off} emissive={color} emissiveIntensity={0.06} roughness={0.25} transparent opacity={0.92} toneMapped={false} />
      </mesh>
      <Halo color={color} intensity={glow} position={[0, 0, height + radius * 0.6]} scale={0.75} />
    </group>
  )
}

/** Laser-etched type on a chip's top, or white silkscreen on the board. */
function Print({ texture, width, height, position }: { texture: THREE.Texture; width: number; height: number; position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={texture} transparent roughness={0.7} depthWrite={false} />
    </mesh>
  )
}

/** chips lie on the board; their tops are this far above it */
const CHIP_TOP = FACE + 0.112

/* ----------------------------------------------------------------- latch */

const LATCH_SYMBOL: [number, number] = [0.84, 0.38]

/** The latch symbol: a box with S and R going in and Q coming out. */
function latchSymbol() {
  const [w, h] = LATCH_SYMBOL
  return printTexture('latch-symbol', w, h, (ctx, pw, ph) => {
    const u = pw / w
    ctx.strokeStyle = SILK.color
    ctx.fillStyle = SILK.color
    ctx.lineWidth = 0.02 * u
    const box = { x: pw / 2 - 0.2 * u, y: ph / 2 - 0.16 * u, w: 0.4 * u, h: 0.32 * u }
    ctx.strokeRect(box.x, box.y, box.w, box.h)
    // legs: S and R in on the left, Q out on the right
    for (const dy of [-0.085, 0.085]) {
      ctx.beginPath()
      ctx.moveTo(0, ph / 2 + dy * u)
      ctx.lineTo(box.x, ph / 2 + dy * u)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(box.x + box.w, ph / 2)
    ctx.lineTo(pw, ph / 2)
    ctx.stroke()
    ctx.font = `700 ${0.125 * u}px ${PRINT_FONT}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillText('S', box.x + 0.035 * u, ph / 2 - 0.08 * u)
    ctx.fillText('R', box.x + 0.035 * u, ph / 2 + 0.08 * u)
    ctx.textAlign = 'right'
    ctx.fillText('Q', box.x + box.w - 0.035 * u, ph / 2)
  })
}

/**
 * Memory latch: a press on S turns Q on and it stays on (it remembers) until
 * a press on R turns it off. LEDs show S and R and a big one shows Q.
 */
export function LatchModel({ set, reset, q, powered }: { set: number; reset: number; q: number; powered: boolean }) {
  const symbol = latchSymbol()
  const label = markingTexture(['HC279'], 0.22, 0.05)
  return (
    <group position={[0.06, 0, 0]} rotation={TILT}>
      <Board
        color="#831843"
        trace="#9d1f55"
        traces={[
          // + to pin 14 and − to pin 7, like on the real chip
          [-0.93, 0.45, -0.41, 0.45],
          [-0.41, 0.45, -0.41, 0.28],
          [-0.93, -0.45, 0.41, -0.45],
          [0.41, -0.45, 0.41, -0.28],
          [-0.93, 0.2, -0.47, 0.2],
          [-0.93, -0.2, -0.47, -0.2],
          [0.47, 0, 0.93, 0],
        ]}
        holes={[
          [0.93, 0.5],
          [0.93, -0.5],
        ]}
      />
      <DipChip width={0.98} height={0.44} pins={7} position={[0, 0, FACE]} />
      <Print texture={symbol} width={LATCH_SYMBOL[0]} height={LATCH_SYMBOL[1]} position={[0, 0.02, CHIP_TOP]} />
      <Print texture={label} width={0.22} height={0.05} position={[0.32, -0.175, CHIP_TOP]} />
      <Indicator position={[-0.8, 0.2, FACE + 0.02]} color="#22c55e" off="#bbf7d0" level={powered ? set : 0} />
      <Indicator position={[-0.8, -0.2, FACE + 0.02]} color="#f97316" off="#fed7aa" level={powered ? reset : 0} />
      <Smd x={-0.66} y={0.33} kind="r" />
      <Smd x={-0.66} y={-0.33} kind="r" />
      <Smd x={0.62} y={0.3} kind="c" turn />
      <RoundLed x={0.76} y={0} color="#22c55e" off="#15803d" level={powered ? q : 0} radius={0.085} height={0.13} />
      <Indicator position={[0.62, 0.47, FACE + 0.02]} color="#ef4444" off="#fecaca" level={powered ? 1 : 0} size={[0.07, 0.045, 0.035]} halo={0.35} />
      <PowerHeader />
      <SidePin x={PIN_X} y={0} z={FACE + 0.06} direction={1} length={0.22} />
    </group>
  )
}

/* --------------------------------------------------------------- counter */

const COUNTER_Y = [0.45, 0.225, 0, -0.225, -0.45]
const COUNTER_LED_X = 0.66

function counterDigits() {
  return printTexture('counter-digits', 0.08, 1.04, (ctx, pw, ph) => {
    const u = ph / 1.04
    ctx.fillStyle = SILK.color
    ctx.font = `700 ${0.085 * u}px ${PRINT_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    COUNTER_Y.forEach((y, i) => ctx.fillText(String(i), pw / 2, ph / 2 - y * u))
  })
}

/**
 * A counter chip (CD4017) with five LEDs beside its outputs 0 … 4: each pulse
 * on CLK moves the light one step down, then back to the top.
 */
export function CounterModel({ count, clock, powered }: { count: number; clock: number; powered: boolean }) {
  const at = Math.round(Number.isFinite(count) ? count : 0)
  const digits = counterDigits()
  const label = markingTexture(['CD4017BE', 'TI  2245'], 0.48, 0.15)
  return (
    <group position={[0.06, 0, 0]} rotation={TILT}>
      <Board
        color="#155e75"
        trace="#1b7392"
        traces={[
          // + to pin 16 and − to pin 8
          [-0.93, 0.45, -0.62, 0.45],
          [-0.62, 0.45, -0.62, 0.28],
          [-0.93, -0.45, 0.26, -0.45],
          [0.26, -0.45, 0.26, -0.28],
          [-0.93, 0.2, -0.68, 0.2],
          [-0.93, -0.2, -0.68, -0.2],
          // output 0 runs on top, the others come up through the board
          [0.26, 0.28, 0.43, 0.45],
          [0.43, 0.45, 0.93, 0.45],
          ...COUNTER_Y.slice(1).map((y): [number, number, number, number] => [0.47, y, 0.93, y]),
        ]}
        holes={[]}
        vias={COUNTER_Y.slice(1).map((y): [number, number] => [0.47, y])}
      />
      <DipChip width={1.04} height={0.44} pins={8} position={[-0.18, 0, FACE]} />
      <Print texture={label} width={0.48} height={0.15} position={[-0.2, 0.0, CHIP_TOP]} />
      <Indicator position={[-0.8, 0.2, FACE + 0.02]} color="#eab308" off="#fef08a" level={powered ? clock : 0} speed={30} />
      <Indicator position={[-0.3, 0.47, FACE + 0.02]} color="#ef4444" off="#fecaca" level={powered ? 1 : 0} size={[0.07, 0.045, 0.035]} halo={0.35} />
      <Smd x={-0.48} y={0.38} kind="c" />
      {COUNTER_Y.map((y, i) => (
        <RoundLed key={y} x={COUNTER_LED_X} y={y} color="#ff3b30" off="#7f1d1d" level={powered && at === i ? 1 : 0} speed={26} />
      ))}
      <Print texture={digits} width={0.08} height={1.04} position={[0.83, 0, FACE + 0.002]} />
      <PowerHeader />
      {COUNTER_Y.map((y) => (
        <SidePin key={y} x={PIN_X} y={y} z={FACE + 0.06} direction={1} length={0.22} />
      ))}
    </group>
  )
}

/* ------------------------------------------------------------ comparator */

const COMPARATOR_SYMBOL: [number, number] = [0.5, 0.36]

/** The comparator's triangle with + and − on its inputs. */
function comparatorSymbol() {
  const [w, h] = COMPARATOR_SYMBOL
  return printTexture('comparator-symbol', w, h, (ctx, pw, ph) => {
    const u = pw / w
    const cy = ph / 2
    const back = pw / 2 - 0.11 * u
    const tip = pw / 2 + 0.13 * u
    ctx.strokeStyle = SILK.color
    ctx.fillStyle = SILK.color
    ctx.lineWidth = 0.018 * u
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(back, cy - 0.15 * u)
    ctx.lineTo(tip, cy)
    ctx.lineTo(back, cy + 0.15 * u)
    ctx.closePath()
    ctx.stroke()
    for (const dy of [-0.075, 0.075]) {
      ctx.beginPath()
      ctx.moveTo(0, cy + dy * u)
      ctx.lineTo(back, cy + dy * u)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(tip, cy)
    ctx.lineTo(pw, cy)
    ctx.stroke()
    // + on the top input, − on the bottom one
    const s = 0.028 * u
    const x = back + 0.05 * u
    ctx.lineWidth = 0.014 * u
    ctx.beginPath()
    ctx.moveTo(x - s, cy - 0.075 * u)
    ctx.lineTo(x + s, cy - 0.075 * u)
    ctx.moveTo(x, cy - 0.075 * u - s)
    ctx.lineTo(x, cy - 0.075 * u + s)
    ctx.moveTo(x - s, cy + 0.075 * u)
    ctx.lineTo(x + s, cy + 0.075 * u)
    ctx.stroke()
  })
}

/**
 * Comparator module (LM393): it compares IN+ with IN− and turns OUT on when
 * IN+ is higher. A blue multi-turn trimmer sits beside the chip like on the
 * real modules, with an OUT LED and a power LED.
 */
export function ComparatorModel({ out, powered }: { out: number; powered: boolean }) {
  const symbol = comparatorSymbol()
  const label = markingTexture(['LM393'], 0.24, 0.06)
  return (
    <group position={[0.06, 0, 0]} rotation={TILT}>
      <Board
        color="#713f12"
        trace="#86501c"
        traces={[
          // + to pin 8 and − to pin 4
          [-0.93, 0.45, -0.49, 0.45],
          [-0.49, 0.45, -0.49, 0.28],
          [-0.93, -0.45, -0.01, -0.45],
          [-0.01, -0.45, -0.01, -0.28],
          [-0.93, 0.2, -0.55, 0.2],
          [-0.93, -0.2, -0.55, -0.2],
          [0.05, 0, 0.93, 0],
          [0.05, 0.22, 0.19, 0.22],
        ]}
        holes={[
          [0.93, 0.5],
          [0.93, -0.5],
        ]}
      />
      <DipChip width={0.64} height={0.44} pins={4} position={[-0.25, 0, FACE]} />
      <Print texture={symbol} width={COMPARATOR_SYMBOL[0]} height={COMPARATOR_SYMBOL[1]} position={[-0.25, 0.02, CHIP_TOP]} />
      <Print texture={label} width={0.24} height={0.06} position={[-0.3, -0.155, CHIP_TOP]} />
      {/* blue multi-turn trimmer (3296) with its brass adjusting screw */}
      <group position={[0.38, 0.22, FACE]}>
        <RoundedBox args={[0.38, 0.36, 0.22]} radius={0.015} smoothness={2} position={[0, 0, 0.11]}>
          <meshStandardMaterial color="#2563eb" roughness={0.45} />
        </RoundedBox>
        <mesh position={[0.1, 0.1, 0.225]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.03, 20]} />
          <meshStandardMaterial color="#d6a84a" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0.1, 0.1, 0.242]} rotation={[0, 0, 0.6]}>
          <boxGeometry args={[0.09, 0.016, 0.006]} />
          <meshStandardMaterial color="#5c4214" roughness={0.6} />
        </mesh>
        {/* its moulded "103" */}
        <mesh position={[-0.06, -0.08, 0.222]}>
          <planeGeometry args={[0.16, 0.035]} />
          <meshStandardMaterial color="#93c5fd" roughness={0.7} />
        </mesh>
      </group>
      <Smd x={0.2} y={-0.18} kind="r" turn />
      <Smd x={0.4} y={-0.18} kind="r" turn />
      <Smd x={0.06} y={0.36} kind="c" />
      <Indicator position={[0.78, 0, FACE + 0.02]} color="#22c55e" off="#bbf7d0" level={powered ? out : 0} size={[0.11, 0.075, 0.045]} halo={0.6} />
      <Indicator position={[0.78, -0.3, FACE + 0.02]} color="#ef4444" off="#fecaca" level={powered ? 1 : 0} size={[0.07, 0.045, 0.035]} halo={0.35} />
      <PowerHeader />
      <SidePin x={PIN_X} y={0} z={FACE + 0.06} direction={1} length={0.22} />
    </group>
  )
}

/* --------------------------------------------------------------- H-bridge */

const SINK_X = -0.1
const SINK_Y = 0.03
const SINK_W = 0.78
const SINK_H = 0.72
const FIN_H = 0.3
const FINS = 7
const MOTOR_Y = 0.22
const ARROW_X = 0.48

/** A round arrow (about 0.2 across) as a flat shape: clockwise for forward, the mirror for back. */
function arrowGeometry(turn: number) {
  const r = 0.06
  const t = 0.018
  const start = 0.5
  const end = start + 1.5 * Math.PI
  const shape = new THREE.Shape()
  shape.absarc(0, 0, r + t, start, end, false)
  // the arrowhead at the end of the arc
  const hx = Math.cos(end)
  const hy = Math.sin(end)
  const tx = -Math.sin(end)
  const ty = Math.cos(end)
  shape.lineTo((r + t * 2.4) * hx, (r + t * 2.4) * hy)
  shape.lineTo(r * hx + tx * 0.06, r * hy + ty * 0.06)
  shape.lineTo((r - t * 2.4) * hx, (r - t * 2.4) * hy)
  shape.absarc(0, 0, r - t, end, start, true)
  shape.closePath()
  const geometry = new THREE.ShapeGeometry(shape, 24)
  // drawn counterclockwise; mirrored it turns clockwise
  if (turn > 0) geometry.scale(-1, 1, 1)
  return geometry
}

/** The driver chip's fifteen legs in two staggered rows, coming out below its heatsink. */
function chipLegsGeometry() {
  return merge(
    Array.from({ length: 15 }, (_, i) =>
      new THREE.BoxGeometry(0.022, 0.1, 0.04).translate(SINK_X - 0.35 + i * 0.05, SINK_Y - SINK_H / 2 - 0.05 - (i % 2) * 0.06, FACE + 0.02),
    ),
  )
}

/** The fins and base of a black anodised heatsink, as one piece. */
function sinkGeometry() {
  const fins = Array.from({ length: FINS }, (_, i) => {
    const x = -SINK_W / 2 + 0.03 + (i * (SINK_W - 0.06)) / (FINS - 1)
    return new THREE.BoxGeometry(0.04, SINK_H, FIN_H).translate(x, 0, FIN_H / 2 + 0.05)
  })
  return merge([new THREE.BoxGeometry(SINK_W, SINK_H, 0.06).translate(0, 0, 0.03), ...fins])
}

function DirectionArrow({ y, turn, color, level }: { y: number; turn: 1 | -1; color: string; level: number }) {
  const geometry = useBuiltWith(arrowGeometry, turn)
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const lit = useRef(0)
  const glow = useRef(0)
  useFrame((_, dt) => {
    lit.current = damp(lit.current, unit(level), 16, dt)
    if (material.current) material.current.emissiveIntensity = 0.04 + lit.current * 2.6
    glow.current = lit.current * 0.6
  })
  return (
    <group position={[ARROW_X, y, FACE + 0.004]}>
      {/* a dark window that the arrow lights up in */}
      <mesh>
        <circleGeometry args={[0.11, 28]} />
        <meshStandardMaterial color="#1c1917" roughness={0.6} />
      </mesh>
      <mesh geometry={geometry} position={[0, 0, 0.002]}>
        <meshStandardMaterial ref={material} color="#3f3f46" emissive={color} emissiveIntensity={0.04} roughness={0.4} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <Halo color={color} intensity={glow} position={[0, 0, 0.06]} scale={0.6} />
    </group>
  )
}

/**
 * Motor driver (L298N style): a red board with a big finned heatsink over the
 * driver chip and a blue screw terminal for the motor. A round arrow lights
 * for the way the motor turns; the heatsink glows when it is working too hard.
 */
export function HBridgeModel({
  direction,
  in1,
  in2,
  powered,
  hot,
}: {
  /** 1 forward, −1 back, 0 stopped */
  direction: number
  in1: number
  in2: number
  powered: boolean
  hot: boolean
}) {
  const sink = useBuilt(sinkGeometry)
  const legs = useBuilt(chipLegsGeometry)
  const sinkMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const warm = useRef(0)
  useFrame((_, dt) => {
    warm.current = damp(warm.current, hot ? 1 : 0, 1.5, dt)
    if (sinkMaterial.current) sinkMaterial.current.emissiveIntensity = warm.current * 0.4
  })
  return (
    <group position={[0.1, 0, 0]} rotation={TILT}>
      <Board
        color="#b91c1c"
        trace="#cc2a2a"
        traces={[
          [-0.93, 0.2, -0.47, 0.2],
          [-0.93, -0.2, -0.47, -0.2],
          [-0.93, 0.45, 0.3, 0.45],
          [-0.93, -0.45, -0.45, -0.45],
          // the motor outputs, from the chip to the screw terminal
          [0.27, 0.33, 0.6, 0.33],
          [0.6, 0.33, 0.7, MOTOR_Y],
          [0.27, -0.33, 0.6, -0.33],
          [0.6, -0.33, 0.7, -MOTOR_Y],
        ]}
        holes={[
          [-0.62, 0.5],
          [-0.62, -0.5],
        ]}
      />
      {/* the driver chip's fifteen legs in two staggered rows, below its heatsink */}
      <mesh geometry={legs}>
        <meshStandardMaterial {...METAL} />
      </mesh>
      <group position={[SINK_X, SINK_Y, FACE + 0.02]}>
        <mesh geometry={sink}>
          <meshStandardMaterial ref={sinkMaterial} color="#1d1d21" roughness={0.55} metalness={0.35} emissive="#ff5a1f" emissiveIntensity={0} />
        </mesh>
        {/* the screw that holds the chip to the heatsink */}
        <mesh position={[0, -SINK_H / 2 + 0.07, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.03, 16]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      </group>
      <group position={[SINK_X, SINK_Y, FACE + 0.36]} scale={0.75}>
        <Smoke active={hot} position={[0, 0, 0]} rise={0.35} color="#d4d4d8" />
      </group>
      {/* which way the motor turns */}
      <DirectionArrow y={0.12} turn={1} color="#22c55e" level={powered && direction > 0 ? 1 : 0} />
      <DirectionArrow y={-0.12} turn={-1} color="#f59e0b" level={powered && direction < 0 ? 1 : 0} />
      <Indicator position={[-0.8, 0.2, FACE + 0.02]} color="#22c55e" off="#bbf7d0" level={powered ? in1 : 0} />
      <Indicator position={[-0.8, -0.2, FACE + 0.02]} color="#22c55e" off="#bbf7d0" level={powered ? in2 : 0} />
      <Indicator position={[ARROW_X, 0.47, FACE + 0.02]} color="#ef4444" off="#fecaca" level={powered ? 1 : 0} size={[0.07, 0.045, 0.035]} halo={0.35} />
      {/* blue screw terminal for the motor: screws on top, the wire holes facing out */}
      <group position={[0.84, 0, FACE]}>
        <RoundedBox args={[0.32, 0.66, 0.3]} radius={0.02} smoothness={2} position={[0, 0, 0.15]}>
          <meshStandardMaterial color="#1d6fd1" roughness={0.5} />
        </RoundedBox>
        {[MOTOR_Y, -MOTOR_Y].map((y) => (
          <group key={y} position={[0, y, 0]}>
            <mesh position={[-0.03, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.02, 20]} />
              <meshStandardMaterial {...METAL} />
            </mesh>
            <mesh position={[-0.03, 0, 0.312]} rotation={[0, 0, 0.5]}>
              <boxGeometry args={[0.14, 0.022, 0.008]} />
              <meshStandardMaterial color="#52525b" />
            </mesh>
            {/* the square wire opening with its clamp inside */}
            <mesh position={[0.161, 0, 0.11]}>
              <boxGeometry args={[0.004, 0.17, 0.15]} />
              <meshStandardMaterial color="#0a1a33" roughness={0.8} />
            </mesh>
            <mesh position={[0.162, 0, 0.11]}>
              <boxGeometry args={[0.004, 0.12, 0.04]} />
              <meshStandardMaterial {...METAL} />
            </mesh>
          </group>
        ))}
      </group>
      <PowerHeader />
    </group>
  )
}
