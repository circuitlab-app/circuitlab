import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, Smoke, damp } from '../helpers'
import { markingTexture } from './print'
import { BRUSHED, merge, unit, useBuilt } from './shared'

/* A TO-220 drawn to scale: 1 mm ≈ 0.064 units. */
const W = 0.64
const BODY_H = 0.58
const BODY_D = 0.27
const TAB_T = 0.06
const TAB_TOP = BODY_H / 2 + 0.42
/** the back of the tab is flush with the back of the body */
const BACK = -BODY_D / 2
const HOLE_Y = TAB_TOP - 0.18
const PITCH = 0.163
const LEG_Z = BACK + TAB_T * 0.6
const LEG_END = -BODY_H / 2 - 0.56

/** The metal tab: a plate with its mounting hole and the two little notches on its sides. */
function tabGeometry() {
  const shape = new THREE.Shape()
  const x = W / 2
  const notch = BODY_H / 2 + 0.07
  shape.moveTo(-x, -BODY_H / 2 + 0.05)
  shape.lineTo(x, -BODY_H / 2 + 0.05)
  shape.lineTo(x, notch - 0.04)
  shape.absarc(x, notch, 0.04, -Math.PI / 2, Math.PI / 2, true)
  shape.lineTo(x, TAB_TOP)
  shape.lineTo(-x, TAB_TOP)
  shape.lineTo(-x, notch + 0.04)
  shape.absarc(-x, notch, 0.04, Math.PI / 2, -Math.PI / 2, true)
  shape.closePath()
  shape.holes.push(new THREE.Path().absarc(0, HOLE_Y, 0.115, 0, Math.PI * 2, true))
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: TAB_T, bevelEnabled: false, curveSegments: 24 })
  geometry.translate(0, 0, BACK - 0.004)
  return geometry
}

/** G, D and S: a wide shoulder where each leg leaves the body, then the thin part that goes into the board. */
function legsGeometry() {
  return merge(
    [-1, 0, 1].flatMap((i) => {
      const x = i * PITCH
      const top = -BODY_H / 2 + 0.02
      const shoulder = 0.15
      return [
        new THREE.BoxGeometry(0.1, shoulder, 0.035).translate(x, top - shoulder / 2, LEG_Z),
        new THREE.BoxGeometry(0.055, top - shoulder - LEG_END, 0.03).translate(x, (top - shoulder + LEG_END) / 2, LEG_Z),
      ]
    }),
  )
}

const HOT_TAB = new THREE.Color('#ff5a1f')
/** tinned legs: full metalness looks black without an environment map */
const TIN = { color: '#cfd3d9', metalness: 0.55, roughness: 0.32 } as const

/**
 * An N-channel MOSFET (IRLZ44N) in its TO-220 case: black body, a metal tab
 * with a screw hole, and three legs G, D, S. The little green light follows
 * how hard the gate is driven; the tab glows when it gets too hot.
 */
export function MosfetModel({
  drive,
  current,
  hot,
}: {
  /** 0..1: how hard the gate is driven */
  drive: number
  /** amps flowing from D to S */
  current: number
  hot: boolean
}) {
  const tab = useBuilt(tabGeometry)
  const legs = useBuilt(legsGeometry)
  const print = markingTexture(['IRLZ44N', 'IR  2245P'], 0.46, 0.15)
  const tabMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const bodyMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const dot = useRef<THREE.MeshStandardMaterial>(null)
  const lit = useRef(0)
  const warm = useRef(0)
  const halo = useRef(0)

  useFrame((_, dt) => {
    // the light comes on with the gate, a touch brighter while current really flows
    const flowing = Math.abs(current) > 1e-3 ? 1 : 0.6
    lit.current = damp(lit.current, unit(drive) * flowing, 10, dt)
    // metal takes a moment to heat up and to cool down
    warm.current = damp(warm.current, hot ? 1 : 0, 1.6, dt)
    halo.current = lit.current * 0.75
    if (dot.current) dot.current.emissiveIntensity = 0.05 + lit.current * 3
    if (tabMaterial.current) tabMaterial.current.emissiveIntensity = warm.current * 0.55
    if (bodyMaterial.current) bodyMaterial.current.emissiveIntensity = warm.current * 0.06
  })

  return (
    <group position={[0.05, 0.12, 0]} rotation={[0.2, -0.45, 0.05]}>
      <mesh geometry={tab}>
        <meshStandardMaterial ref={tabMaterial} {...BRUSHED} emissive={HOT_TAB} emissiveIntensity={0} />
      </mesh>
      {/* the black body */}
      <RoundedBox args={[W, BODY_H, BODY_D]} radius={0.02} smoothness={2}>
        <meshStandardMaterial ref={bodyMaterial} color="#202024" roughness={0.42} emissive="#7c2d12" emissiveIntensity={0} />
      </RoundedBox>
      {/* type number, lasered into the front */}
      <mesh position={[-0.02, 0.1, BODY_D / 2 + 0.001]}>
        <planeGeometry args={[0.46, 0.15]} />
        <meshStandardMaterial map={print} transparent roughness={0.7} depthWrite={false} />
      </mesh>
      {/* two ejector-pin marks from the mould */}
      {[-0.17, 0.17].map((x) => (
        <mesh key={x} position={[x, -0.15, BODY_D / 2 + 0.001]}>
          <circleGeometry args={[0.045, 20]} />
          <meshStandardMaterial color="#0f0f11" roughness={0.75} />
        </mesh>
      ))}
      {/* conduction light, like the transistor's */}
      <mesh position={[0, -0.15, BODY_D / 2 + 0.004]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.01, 20]} />
        <meshStandardMaterial ref={dot} color="#14532d" emissive="#22c55e" emissiveIntensity={0.05} roughness={0.3} toneMapped={false} />
      </mesh>
      <Halo color="#4ade80" intensity={halo} position={[0, -0.15, BODY_D / 2 + 0.08]} scale={0.9} />
      <mesh geometry={legs}>
        <meshStandardMaterial {...TIN} />
      </mesh>
      <group position={[0, 0.3, 0.05]} scale={0.6}>
        <Smoke active={hot} position={[0, 0, 0]} rise={0.4} color="#d4d4d8" />
      </group>
    </group>
  )
}
