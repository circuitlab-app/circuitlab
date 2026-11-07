import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { damp } from '../helpers'
import { Lead } from './kit'
import { PRINT_FONT, printTexture } from './print'
import { FACE, ModuleBoard, type SensorProps } from './Sensors'
import { BRUSHED, CHIP, METAL, merge, unit, useBuilt } from './shared'

/*
 * The pressure sensor: an industrial gauge with a stainless case, a white
 * 0–200 bar dial and a red needle, screwed in by its brass hex fitting. A
 * cable leaves its side through a gland and runs to the little transmitter
 * board that turns the pressure into a voltage on S.
 */

/** centre of the dial, the case's radius and how deep it is */
const G = { x: -0.3, y: 0.15, r: 0.5, back: -0.1, front: 0.12 }
const DIAL_R = G.r - 0.05
const DIAL_Z = G.front - 0.03
/** the needle sweeps 270°, from the left stop (0) to the right stop (200 bar) */
const SWEEP = (270 * Math.PI) / 180
const FULL_SCALE = 200
const BRASS = { color: '#c9a24a', metalness: 0.75, roughness: 0.32 } as const
const BOARD_AT: [number, number, number] = [0.72, -0.2, 0]

/** angle of a reading 0..1, clockwise from straight up */
const angleOf = (v: number) => -SWEEP / 2 + SWEEP * v

/* ------------------------------------------------------------- the dial */

const dialPrint = () =>
  printTexture('pressure:dial', DIAL_R * 2, DIAL_R * 2, (ctx, w) => {
    const c = w / 2
    const ppu = w / (DIAL_R * 2)
    const at = (v: number, rho: number): [number, number] => {
      const a = angleOf(v)
      return [c + Math.sin(a) * rho * ppu, c - Math.cos(a) * rho * ppu]
    }
    ctx.fillStyle = '#fbfaf6'
    ctx.fillRect(0, 0, w, w)
    // the red band where the pressure is too high
    ctx.strokeStyle = '#dc2626'
    ctx.lineWidth = 0.035 * ppu
    ctx.beginPath()
    ctx.arc(c, c, (DIAL_R - 0.06) * ppu, angleOf(160 / FULL_SCALE) - Math.PI / 2, angleOf(1) - Math.PI / 2)
    ctx.stroke()
    // ticks: every 5 bar, longer every 25, labelled every 50
    ctx.strokeStyle = '#18181b'
    for (let bar = 0; bar <= FULL_SCALE; bar += 5) {
      const v = bar / FULL_SCALE
      const major = bar % 25 === 0
      const [x0, y0] = at(v, DIAL_R - 0.035)
      const [x1, y1] = at(v, DIAL_R - (major ? 0.11 : 0.07))
      ctx.lineWidth = (major ? 0.014 : 0.006) * ppu
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
    }
    ctx.fillStyle = '#18181b'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${0.075 * ppu}px ${PRINT_FONT}`
    for (let bar = 0; bar <= FULL_SCALE; bar += 50) {
      const [x, y] = at(bar / FULL_SCALE, DIAL_R - 0.19)
      ctx.fillText(String(bar), x, y)
    }
    ctx.font = `700 ${0.07 * ppu}px ${PRINT_FONT}`
    ctx.fillText('bar', c, c + 0.2 * ppu)
    ctx.fillStyle = '#71717a'
    ctx.font = `600 ${0.038 * ppu}px ${PRINT_FONT}`
    ctx.fillText('PRESSURE', c, c - 0.17 * ppu)
  })

/** the red needle, pointing up from its pivot: broad at the hub, sharp at the tip, with only a stub behind */
function needleGeometry() {
  const reach = DIAL_R - 0.07
  const shape = new THREE.Shape()
  shape.moveTo(-0.012, -0.05)
  shape.lineTo(0.012, -0.05)
  shape.lineTo(0.02, 0.0)
  shape.lineTo(0.008, reach)
  shape.lineTo(0, reach + 0.02)
  shape.lineTo(-0.008, reach)
  shape.lineTo(-0.02, 0.0)
  shape.closePath()
  return new THREE.ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: false })
}

/** the stainless case: a cup open at the front, with a rolled rim */
function caseGeometry() {
  const depth = G.front - G.back
  return merge([
    new THREE.CylinderGeometry(G.r, G.r, depth, 48, 1, true).rotateX(Math.PI / 2).translate(0, 0, (G.front + G.back) / 2),
    new THREE.CircleGeometry(G.r, 48).rotateY(Math.PI).translate(0, 0, G.back),
    new THREE.TorusGeometry(G.r - 0.012, 0.03, 10, 48).translate(0, 0, G.front),
  ])
}

/** the brass hex and its threaded tip, hanging below the case along −y */
function fittingGeometry() {
  const top = -G.r - 0.05
  const parts: THREE.BufferGeometry[] = [
    new THREE.CylinderGeometry(0.15, 0.15, 0.13, 6).translate(0, top - 0.065, 0),
    new THREE.CylinderGeometry(0.075, 0.075, 0.17, 20).translate(0, top - 0.13 - 0.085, 0),
  ]
  // the thread
  for (let i = 0; i < 5; i++) parts.push(new THREE.TorusGeometry(0.076, 0.008, 6, 20).rotateX(Math.PI / 2).translate(0, top - 0.155 - i * 0.03, 0))
  return merge(parts)
}

/** the nylon cable gland: a hex nut and a domed cap, along +x */
function glandGeometry() {
  return merge([
    new THREE.CylinderGeometry(0.075, 0.075, 0.06, 6).rotateZ(Math.PI / 2).translate(0.03, 0, 0),
    new THREE.CylinderGeometry(0.045, 0.062, 0.09, 18).rotateZ(Math.PI / 2).translate(0.105, 0, 0),
  ])
}

/* ------------------------------------------------------------------ model */

/**
 * Pressure sensor: the needle sweeps across the dial with `sense` (0 bar at
 * the left stop, 200 bar at the right), slowed a little like a real gauge.
 * The transmitter board's lights show its supply and its output signal.
 */
export function PressureSensorModel({ sense, level, powered }: SensorProps) {
  const shell = useBuilt(caseGeometry)
  const fitting = useBuilt(fittingGeometry)
  const gland = useBuilt(glandGeometry)
  const needleShape = useBuilt(needleGeometry)
  const needle = useRef<THREE.Group>(null)
  const reading = useRef(unit(sense))

  useFrame((_, dt) => {
    reading.current = damp(reading.current, unit(sense), 4, dt)
    if (needle.current) needle.current.rotation.z = -angleOf(reading.current)
  })

  const glandZ = (G.front + G.back) / 2
  return (
    <group position={[-0.06, 0.02, 0]} rotation={[-0.22, 0.22, 0]}>
      <group position={[G.x, G.y, 0]}>
        <mesh geometry={shell}>
          <meshStandardMaterial {...BRUSHED} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, DIAL_Z]}>
          <circleGeometry args={[DIAL_R, 48]} />
          <meshStandardMaterial map={dialPrint()} roughness={0.6} />
        </mesh>
        <group ref={needle} position={[0, 0, DIAL_Z + 0.008]}>
          <mesh geometry={needleShape}>
            <meshStandardMaterial color="#dc2626" roughness={0.4} />
          </mesh>
        </group>
        <mesh position={[0, 0, DIAL_Z + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.045, 0.024, 20]} />
          <meshStandardMaterial color="#27272a" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* the glass, a faint sheen over the dial */}
        <mesh position={[0, 0, G.front - 0.006]} renderOrder={4}>
          <circleGeometry args={[G.r - 0.03, 48]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.1} roughness={0.05} metalness={0.2} depthWrite={false} />
        </mesh>
        {/* the socket welded under the case, then the brass hex and thread */}
        <mesh position={[0, -G.r - 0.01, glandZ]}>
          <cylinderGeometry args={[0.075, 0.075, 0.1, 20]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        <mesh geometry={fitting} position={[0, 0, glandZ]}>
          <meshStandardMaterial {...BRASS} />
        </mesh>
        {/* the cable gland on the side of the case */}
        <mesh geometry={gland} position={[G.r - 0.01, 0, glandZ]}>
          <meshStandardMaterial color="#1f1f23" roughness={0.6} />
        </mesh>
      </group>
      {/* the cable down to the transmitter board */}
      <Lead
        points={[
          [G.x + G.r + 0.13, G.y, glandZ],
          [G.x + G.r + 0.24, G.y + 0.01, glandZ + 0.02],
          [BOARD_AT[0] - 0.17, BOARD_AT[1] + 0.2, FACE + 0.06],
          [BOARD_AT[0] - 0.17, BOARD_AT[1] + 0.1, FACE + 0.02],
        ]}
        radius={0.024}
        color="#1f1f23"
      />
      <group position={BOARD_AT}>
        <ModuleBoard width={0.62} height={0.5} color="#334155" leds={[[0.17, 0.12], [0.17, -0.02]]} powered={powered} level={level}>
          {/* the amplifier chip and a couple of tiny parts */}
          <mesh position={[-0.07, -0.03, FACE + 0.022]}>
            <boxGeometry args={[0.2, 0.13, 0.044]} />
            <meshStandardMaterial {...CHIP} />
          </mesh>
          {[-0.21, 0.07].map((x) => (
            <mesh key={x} position={[x, 0.15, FACE + 0.013]}>
              <boxGeometry args={[0.075, 0.042, 0.026]} />
              <meshStandardMaterial color="#c8a27a" roughness={0.55} />
            </mesh>
          ))}
        </ModuleBoard>
      </group>
    </group>
  )
}
