import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Halo, Smoke, damp, getGlowTexture } from '../helpers'
import { BRUSHED, useBuilt } from './shared'

/* An open-coil heating element: nichrome wire wound on a white ceramic rod, held by two metal brackets on a ceramic base. */

/** the element leans back like the resistor so the coil and its base both show */
const TILT = 0.5
const BASE_TOP = -0.06
const ROD_Y = 0.12
const ROD_R = 0.1
const COIL_R = 0.125
const WIRE = 0.02
/** the coil runs from −HALF to HALF along x */
const HALF = 0.8
const TURNS = 20
/** the brackets that hold the rod, and the screw lugs (the two terminals) past the ends of the base */
const BRACKET_X = 0.93
const LUG_X = 1.29

const CERAMIC = { color: '#f2eee6', roughness: 0.78 } as const
/** the dull grey of cold nichrome; it darkens as it heats so the glow stays a deep, saturated colour */
const COLD_WIRE = new THREE.Color('#8b8f96')
const HOT_WIRE = new THREE.Color('#1c1210')
const SMOKE = '#a8a29e'
const SHIMMER = '#ffd2a1'

/** glow colour as the wire heats: dark red → bright orange → yellow-orange, and paler still when overheating */
const STOPS: [number, THREE.Color][] = [
  [0.1, new THREE.Color('#3b0a06')],
  [0.4, new THREE.Color('#b3180c')],
  [0.7, new THREE.Color('#ff4a0a')],
  [1.0, new THREE.Color('#ff7f18')],
  [1.4, new THREE.Color('#ffaa3c')],
  [1.8, new THREE.Color('#ffd88a')],
]

function heatColor(h: number, out: THREE.Color) {
  if (h <= STOPS[0][0]) return out.copy(STOPS[0][1])
  for (let i = 1; i < STOPS.length; i++) {
    const [h1, c1] = STOPS[i]
    if (h <= h1) {
      const [h0, c0] = STOPS[i - 1]
      return out.lerpColors(c0, c1, (h - h0) / (h1 - h0))
    }
  }
  return out.copy(STOPS[STOPS.length - 1][1])
}

/** the helix of wire round the rod, with a short straight tail into each bracket */
function buildCoil() {
  const steps = TURNS * 20
  const top = ROD_Y + COIL_R
  const points = [new THREE.Vector3(-BRACKET_X + 0.03, top, 0), new THREE.Vector3(-HALF - 0.04, top, 0)]
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = t * TURNS * Math.PI * 2
    points.push(new THREE.Vector3(-HALF + 2 * HALF * t, ROD_Y + Math.cos(a) * COIL_R, Math.sin(a) * COIL_R))
  }
  points.push(new THREE.Vector3(HALF + 0.04, top, 0), new THREE.Vector3(BRACKET_X - 0.03, top, 0))
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), steps * 2, WIRE, 6, false)
}

const WISPS = 5

export function HeaterModel({ level, over }: { level: number; over: boolean }) {
  const coil = useBuilt(buildCoil)
  const wire = useRef<THREE.MeshStandardMaterial>(null)
  const rod = useRef<THREE.MeshStandardMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  const wisps = useRef<THREE.Group>(null)
  const heat = useRef(0)
  const glow = useRef(0)
  const tint = useMemo(() => new THREE.Color(), [])

  useFrame(({ clock }, dt) => {
    const target = THREE.MathUtils.clamp(Number.isFinite(level) ? level : 0, 0, 1.4) + (over ? 0.4 : 0)
    // the wire heats up in a moment and cools a little slower
    heat.current = damp(heat.current, target, target > heat.current ? 2.4 : 1.4, dt)
    const h = heat.current
    const on = THREE.MathUtils.smoothstep(h, 0.05, 0.35)
    // a slow breathing of the glow while it is hot
    const pulse = 1 + Math.sin(clock.elapsedTime * 2.3) * 0.06 * on
    heatColor(h, tint)
    if (wire.current) {
      wire.current.color.lerpColors(COLD_WIRE, HOT_WIRE, on)
      wire.current.emissive.copy(tint)
      wire.current.emissiveIntensity = on * 1.1 * pulse
    }
    if (rod.current) {
      rod.current.emissive.copy(tint)
      rod.current.emissiveIntensity = on * 0.14
    }
    glow.current = THREE.MathUtils.smoothstep(h, 0.25, 1.1) * 0.6 * pulse
    if (light.current) light.current.intensity = on * Math.min(h, 1.8) * 1.4
    // faint wisps of hot air rising off the coil
    const shimmer = THREE.MathUtils.smoothstep(h, 0.3, 0.9)
    const g = wisps.current
    if (!g) return
    g.visible = shimmer > 0.01
    g.children.forEach((child, i) => {
      const t = (clock.elapsedTime * 0.32 + i / WISPS) % 1
      const sprite = child as THREE.Sprite
      sprite.position.set(-0.64 + (i * 1.28) / (WISPS - 1) + Math.sin(t * 5 + i * 2) * 0.05, t * 0.62, 0)
      sprite.scale.set(0.16 + t * 0.12, 0.34 + t * 0.26, 1)
      ;(sprite.material as THREE.SpriteMaterial).opacity = Math.sin(Math.PI * t) * 0.26 * shimmer
    })
  })

  // where the coil ends up once the element leans back
  const coilAt: [number, number, number] = [0, ROD_Y * Math.cos(TILT), ROD_Y * Math.sin(TILT)]

  return (
    <group position={[0, -0.04, 0]}>
      <group rotation={[TILT, 0, 0]}>
        {/* ceramic base */}
        <RoundedBox args={[2.3, 0.12, 0.7]} radius={0.04} smoothness={3} position={[0, BASE_TOP - 0.06, 0]}>
          <meshStandardMaterial {...CERAMIC} />
        </RoundedBox>
        {/* ceramic rod the wire is wound on, running through both brackets */}
        <mesh position={[0, ROD_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[ROD_R, ROD_R, 2 * BRACKET_X + 0.1, 28]} />
          <meshStandardMaterial ref={rod} {...CERAMIC} emissive="#000000" emissiveIntensity={0} />
        </mesh>
        <mesh geometry={coil}>
          <meshStandardMaterial ref={wire} color="#8b8f96" metalness={0.55} roughness={0.4} emissive="#000000" emissiveIntensity={0} toneMapped={false} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            {/* the upright bracket with a nut holding the rod */}
            <mesh position={[s * BRACKET_X, (BASE_TOP + ROD_Y + 0.15) / 2, 0]}>
              <boxGeometry args={[0.05, ROD_Y + 0.15 - BASE_TOP, 0.26]} />
              <meshStandardMaterial {...BRUSHED} />
            </mesh>
            <mesh position={[s * (BRACKET_X + 0.04), ROD_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.075, 0.075, 0.035, 6]} />
              <meshStandardMaterial {...BRUSHED} />
            </mesh>
            {/* its foot, running out past the base into a lug with a screw for the wire */}
            <mesh position={[s * ((BRACKET_X + LUG_X + 0.1) / 2), BASE_TOP + 0.0125, 0]}>
              <boxGeometry args={[LUG_X + 0.1 - BRACKET_X, 0.025, 0.2]} />
              <meshStandardMaterial {...BRUSHED} />
            </mesh>
            <mesh position={[s * LUG_X, BASE_TOP + 0.04, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.035, 20]} />
              <meshStandardMaterial {...BRUSHED} />
            </mesh>
            <mesh position={[s * LUG_X, BASE_TOP + 0.059, 0]} rotation={[0, 0.6, 0]}>
              <boxGeometry args={[0.09, 0.006, 0.016]} />
              <meshStandardMaterial color="#3f3f46" roughness={0.6} />
            </mesh>
          </group>
        ))}
        <pointLight ref={light} position={[0, ROD_Y + 0.6, 0.45]} color="#ff7a1a" intensity={0} distance={2.6} decay={1.5} />
      </group>

      {[-0.45, 0.45].map((x) => (
        <Halo key={x} color="#ff7a1a" intensity={glow} position={[x, coilAt[1] + 0.14, coilAt[2]]} scale={1.65} />
      ))}
      <group ref={wisps} position={[0, coilAt[1] + 0.2, coilAt[2]]}>
        {Array.from({ length: WISPS }, (_, i) => (
          <sprite key={i} renderOrder={11}>
            <spriteMaterial map={getGlowTexture()} color={SHIMMER} transparent opacity={0} depthWrite={false} toneMapped={false} />
          </sprite>
        ))}
      </group>
      <Smoke active={over} position={[0, coilAt[1] + 0.25, coilAt[2]]} color={SMOKE} rise={0.5} />
    </group>
  )
}
