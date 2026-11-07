import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, damp } from '../helpers'
import { Lead } from './kit'
import { PRINT_FONT, printTexture } from './print'
import { METAL, merge, unit, useBuilt } from './shared'

/*
 * A pen-shaped logic probe lying on the bench: a steel needle at the right
 * end, a see-through violet body with its little board inside, three LEDs
 * (HIGH red, LOW green, PULSE amber) on the flat top, and at the left end the
 * cable that splits into a red and a black alligator clip for + and −.
 */

/** the pen's own axis runs along x with the needle at +x; its LEDs face +z */
const R = 0.18
/** along the axis: the cable relief, end cap, body, nose, needle */
const U = { relief: -1.28, cap: -1.04, body: -0.9, nose: 0.68, needleBase: 0.98, point: 1.36 }
const PEN_AT: [number, number, number] = [0.35, 0.02, 0]
const PEN_ANGLE = 0.58
/** the bench the pen and the clips lie on */
const BENCH = -R
const PANEL = { from: -0.07, to: 0.62, width: 0.27, ledY: 0.04 }
const LEDS = [
  { u: 0.5, color: '#ff3b30', off: '#7f1d1d', key: 'high', label: 'HIGH' },
  { u: 0.27, color: '#34e36b', off: '#14532d', key: 'low', label: 'LOW' },
  { u: 0.04, color: '#ffb020', off: '#78350f', key: 'pulse', label: 'PULSE' },
] as const

/* ------------------------------------------------------------- geometry */

/** A shape turned round the pen's axis: `profile` is [radius, along the axis] pairs. */
function turned(profile: [number, number][], segments = 36) {
  return new THREE.LatheGeometry(
    profile.map(([r, u]) => new THREE.Vector2(r, u)),
    segments,
  ).rotateZ(-Math.PI / 2)
}

const shellGeometry = () =>
  turned([
    [R - 0.006, U.body],
    [R, U.body + 0.1],
    [R + 0.004, -0.3],
    [R, U.nose - 0.1],
    [R - 0.004, U.nose],
  ])

const capGeometry = () =>
  turned([
    [0, U.cap - 0.02],
    [0.09, U.cap - 0.02],
    [0.14, U.cap + 0.02],
    [R - 0.002, U.cap + 0.09],
    [R + 0.006, U.body + 0.02],
  ])

const noseGeometry = () =>
  turned([
    [R + 0.006, U.nose - 0.02],
    [R + 0.01, U.nose + 0.05],
    [R - 0.01, U.nose + 0.1],
    [0.1, U.nose + 0.21],
    [0.045, U.needleBase - 0.02],
    [0.03, U.needleBase],
    [0, U.needleBase],
  ])

/** the ribbed rubber sleeve that keeps the cable from kinking */
function reliefGeometry() {
  const length = U.cap - U.relief
  const parts: THREE.BufferGeometry[] = [
    new THREE.CylinderGeometry(0.09, 0.05, length, 20).rotateZ(Math.PI / 2).translate((U.cap + U.relief) / 2, 0, 0),
  ]
  for (let i = 0; i < 4; i++) {
    const u = U.cap - 0.04 - i * 0.05
    const r = 0.09 - ((U.cap - u) / length) * 0.04 + 0.012
    parts.push(new THREE.CylinderGeometry(r, r, 0.02, 20).rotateZ(Math.PI / 2).translate(u, 0, 0))
  }
  return merge(parts)
}

/** tiny resistors and a capacitor on the board inside */
function smdGeometry() {
  const parts: THREE.BufferGeometry[] = []
  for (const [u, y] of [
    [-0.08, 0.06],
    [-0.08, -0.06],
    [0.04, 0.07],
    [0.16, -0.06],
    [-0.72, 0.05],
  ] as const)
    parts.push(new THREE.BoxGeometry(0.07, 0.035, 0.025).translate(u, y, 0))
  return merge(parts)
}

/** the gold pads along both edges of the board */
function padsGeometry() {
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 12; i++) parts.push(new THREE.BoxGeometry(0.03, 0.03, 0.004).translate(-0.8 + i * 0.11, i % 2 ? 0.09 : -0.09, 0))
  return merge(parts)
}

/** little triangular teeth along a clip jaw's inner edge */
function teethGeometry() {
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 5; i++) parts.push(new THREE.BoxGeometry(0.022, 0.022, 0.06).rotateZ(Math.PI / 4).translate(i * 0.05, 0, 0))
  return merge(parts)
}

/* ---------------------------------------------------------------- print */

const PANEL_LENGTH = PANEL.to - PANEL.from

/** the LEDs' names in white on the black panel, on the near side of each light */
const panelPrint = () =>
  printTexture('logicProbe:panel', PANEL_LENGTH, PANEL.width, (ctx, w, h) => {
    const ppu = w / PANEL_LENGTH
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#e4e4e7'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    for (const led of LEDS) {
      ctx.font = `800 ${(led.label.length > 4 ? 0.044 : 0.05) * ppu}px ${PRINT_FONT}`
      ctx.fillText(led.label, (led.u - PANEL.from) * ppu, (PANEL.width / 2 + 0.085) * ppu)
    }
  })

const NAME = { u: -0.35, length: 0.5, height: 0.085 }
const namePrint = () =>
  printTexture('logicProbe:name', NAME.length, NAME.height, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(250, 245, 255, 0.95)'
    ctx.textBaseline = 'middle'
    ctx.font = `800 ${h * 0.66}px ${PRINT_FONT}`
    const text = 'LOGIC PROBE'
    const fit = Math.min(1, (w * 0.98) / ctx.measureText(text).width)
    ctx.scale(fit, 1)
    ctx.fillText(text, 0, h * 0.54)
  })

/* ---------------------------------------------------------------- pieces */

/** One LED in the panel: it glows with `level` and throws a soft halo. */
function Led({ u, color, off, level }: { u: number; color: string; off: string; level: number }) {
  const lens = useRef<THREE.MeshStandardMaterial>(null)
  const lit = useRef(unit(level))
  const glow = useRef(0)
  useFrame((_, dt) => {
    // LEDs switch in a flash, so even a short PULSE shows
    lit.current = damp(lit.current, unit(level), 30, dt)
    if (lens.current) lens.current.emissiveIntensity = 0.06 + lit.current * 3
    glow.current = lit.current * 0.85
  })
  return (
    <group position={[u, PANEL.ledY, R + 0.004]}>
      {/* the chrome bezel the LED sits in */}
      <mesh position={[0, 0, 0.006]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.068, 0.07, 0.014, 28]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.75]}>
        <sphereGeometry args={[0.052, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial ref={lens} color={off} emissive={color} emissiveIntensity={0.06} roughness={0.15} toneMapped={false} />
      </mesh>
      <Halo color={color} intensity={glow} position={[0, 0, 0.08]} scale={0.7} />
    </group>
  )
}

/** A crocodile clip lying on its side: the coloured boot, the plated jaws with their teeth, the rivet. */
function Clip({ at, angle, color }: { at: [number, number, number]; angle: number; color: string }) {
  const teeth = useBuilt(teethGeometry)
  return (
    <group position={at} rotation={[0, 0, angle]}>
      {/* the soft PVC boot, wider where it covers the jaws' levers */}
      <mesh position={[0.17, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.6]}>
        <cylinderGeometry args={[0.092, 0.05, 0.34, 20]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <mesh position={[0.345, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.6]}>
        <cylinderGeometry args={[0.088, 0.098, 0.03, 20]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      {/* the two jaws, pressed shut by the spring */}
      {[1, -1].map((side) => (
        <group key={side} position={[0.36, side * 0.04, 0]} rotation={[0, 0, -side * 0.13]}>
          <mesh position={[0.15, 0, 0]}>
            <boxGeometry args={[0.3, 0.02, 0.06]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
          <mesh geometry={teeth} position={[0.06, -side * 0.014, 0]}>
            <meshStandardMaterial {...METAL} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.4, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.09, 14]} />
        <meshStandardMaterial color="#a1a1aa" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

/* --------------------------------------------------------- the cable run */

const cos = Math.cos(PEN_ANGLE)
const sin = Math.sin(PEN_ANGLE)
/** a point on the pen's axis, in bench coordinates */
const onPen = (u: number, lift = 0): [number, number, number] => [PEN_AT[0] + u * cos, PEN_AT[1] + u * sin, PEN_AT[2] + lift]

const TAIL = onPen(U.relief)
const SPLIT: [number, number, number] = [-1.1, -0.86, BENCH + 0.045]
type Placed = { at: [number, number, number]; angle: number }
const RED_CLIP: Placed = { at: [-0.98, 0.3, BENCH + 0.055], angle: Math.PI - 0.12 }
const BLACK_CLIP: Placed = { at: [-1.04, -0.25, BENCH + 0.055], angle: Math.PI + 0.1 }

const MAIN_CABLE: [number, number, number][] = [TAIL, onPen(U.relief - 0.14, -0.03), [-0.98, -0.88, BENCH + 0.05], SPLIT]
/** a point `d` behind a clip, along its axis, where its wire goes in */
const behind = (clip: Placed, d: number, lift = -0.01): [number, number, number] => [
  clip.at[0] - Math.cos(clip.angle) * d,
  clip.at[1] - Math.sin(clip.angle) * d,
  clip.at[2] + lift,
]
/** from the splitter the two leads bow up the left side and curl into the back of their clips */
const RED_LEAD: [number, number, number][] = [
  SPLIT,
  [-0.98, -0.66, BENCH + 0.03],
  [-0.84, -0.28, BENCH + 0.03],
  [-0.77, 0.1, BENCH + 0.03],
  behind(RED_CLIP, 0.16),
  behind(RED_CLIP, 0.05),
  behind(RED_CLIP, -0.02),
]
const BLACK_LEAD: [number, number, number][] = [
  SPLIT,
  [-1.0, -0.64, BENCH + 0.03],
  [-0.86, -0.4, BENCH + 0.03],
  behind(BLACK_CLIP, 0.16),
  behind(BLACK_CLIP, 0.05),
  behind(BLACK_CLIP, -0.02),
]

/* ------------------------------------------------------------------ model */

/**
 * A logic probe: clip it to + and −, touch the needle to a point, and the
 * red HIGH or green LOW light says which it is; the amber PULSE light
 * flashes each time it changes.
 */
export function LogicProbeModel({ high, low, pulse, powered }: { high: number; low: number; pulse: number; powered: boolean }) {
  const shell = useBuilt(shellGeometry)
  const cap = useBuilt(capGeometry)
  const nose = useBuilt(noseGeometry)
  const relief = useBuilt(reliefGeometry)
  const smd = useBuilt(smdGeometry)
  const pads = useBuilt(padsGeometry)
  const levels = { high: powered ? high : 0, low: powered ? low : 0, pulse: powered ? pulse : 0 }

  return (
    <group position={[0.18, 0, 0]} rotation={[-0.62, 0, 0]}>
      <group position={PEN_AT} rotation={[0, 0, PEN_ANGLE]}>
        {/* the little board inside, seen through the body */}
        <mesh position={[-0.15, 0, -0.03]}>
          <boxGeometry args={[1.4, 0.24, 0.02]} />
          <meshStandardMaterial color="#14532d" roughness={0.6} />
        </mesh>
        <mesh geometry={pads} position={[0, 0, -0.018]}>
          <meshStandardMaterial color="#e5c76b" metalness={0.8} roughness={0.35} />
        </mesh>
        <RoundedBox args={[0.3, 0.15, 0.06]} radius={0.01} smoothness={2} position={[-0.42, 0, 0.01]}>
          <meshStandardMaterial color="#18181b" roughness={0.45} />
        </RoundedBox>
        <mesh geometry={smd} position={[0, 0, -0.008]}>
          <meshStandardMaterial color="#27272a" roughness={0.5} />
        </mesh>
        {/* the needle's contact spring running back to the board */}
        <mesh position={[(U.nose + 0.5) / 2, 0, -0.01]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, U.nose - 0.5 + 0.2, 8]} />
          <meshStandardMaterial {...METAL} />
        </mesh>

        {/* the flat black panel on top with the three LEDs and their names */}
        <RoundedBox args={[PANEL_LENGTH, PANEL.width, 0.08]} radius={0.014} smoothness={2} position={[(PANEL.from + PANEL.to) / 2, 0, R - 0.036]}>
          <meshStandardMaterial color="#17171b" roughness={0.5} />
        </RoundedBox>
        <mesh position={[(PANEL.from + PANEL.to) / 2, 0, R + 0.0045]}>
          <planeGeometry args={[PANEL_LENGTH, PANEL.width]} />
          <meshStandardMaterial map={panelPrint()} transparent roughness={0.5} depthWrite={false} />
        </mesh>
        {LEDS.map((led) => (
          <Led key={led.key} u={led.u} color={led.color} off={led.off} level={levels[led.key]} />
        ))}

        {/* the slide switch for TTL or CMOS chips */}
        <group position={[-0.74, 0, R - 0.008]}>
          <RoundedBox args={[0.24, 0.09, 0.03]} radius={0.01} smoothness={2}>
            <meshStandardMaterial color="#111114" roughness={0.6} />
          </RoundedBox>
          <RoundedBox args={[0.075, 0.07, 0.045]} radius={0.012} smoothness={2} position={[-0.055, 0, 0.012]}>
            <meshStandardMaterial color="#d4d4d8" roughness={0.45} />
          </RoundedBox>
        </group>
        <mesh position={[NAME.u, -0.02, R + 0.005]}>
          <planeGeometry args={[NAME.length, NAME.height]} />
          <meshStandardMaterial map={namePrint()} transparent roughness={0.5} depthWrite={false} />
        </mesh>

        {/* the see-through violet body, drawn after what is inside it */}
        <mesh geometry={shell} renderOrder={4}>
          <meshStandardMaterial color="#7c3aed" transparent opacity={0.4} roughness={0.16} metalness={0.05} depthWrite={false} />
        </mesh>
        <mesh geometry={cap}>
          <meshStandardMaterial color="#1c1b22" roughness={0.45} />
        </mesh>
        <mesh geometry={relief}>
          <meshStandardMaterial color="#141418" roughness={0.6} />
        </mesh>
        <mesh geometry={nose}>
          <meshStandardMaterial color="#1c1b22" roughness={0.4} />
        </mesh>
        {/* the steel needle */}
        <mesh position={[(U.needleBase + U.point - 0.06) / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.02, U.point - 0.06 - U.needleBase, 12]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        <mesh position={[U.point - 0.03, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.018, 0.06, 12]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      </group>

      {/* the cable, its splitter, and the red (+) and black (−) clips */}
      <Lead points={MAIN_CABLE} radius={0.038} color="#18181b" />
      <mesh position={SPLIT} rotation={[0, 0, Math.PI / 2 + 0.5]}>
        <capsuleGeometry args={[0.052, 0.07, 6, 16]} />
        <meshStandardMaterial color="#141418" roughness={0.55} />
      </mesh>
      <Lead points={RED_LEAD} radius={0.026} color="#dc2626" />
      <Lead points={BLACK_LEAD} radius={0.026} color="#1f1f23" />
      <Clip at={RED_CLIP.at} angle={RED_CLIP.angle} color="#dc2626" />
      <Clip at={BLACK_CLIP.at} angle={BLACK_CLIP.angle} color="#202024" />
    </group>
  )
}
