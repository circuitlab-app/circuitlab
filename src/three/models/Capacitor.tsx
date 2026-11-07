import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, damp } from '../helpers'

const RADIUS = 0.34
const HEIGHT = 0.86
const BOTTOM = -0.31
const TOP = BOTTOM + HEIGHT
/** the light stripe sits on the − side, which is the right leg */
const STRIPE_ANGLE = 0.78
const STRIPE_WIDTH = 0.6
const MINUS_MARKS = [-0.2, -0.02, 0.16, 0.34]

const TOP_SILVER = new THREE.Color('#d6dae0')
const TOP_WARN = new THREE.Color('#f2a0a0')

/** Bigger capacitance, bigger can: 470 µF → 0.85, 2200 µF → 1, 10000 µF → 1.15. */
function canScale(capacitance: number) {
  const t = (Math.log10(Math.max(1, capacitance)) - Math.log10(470)) / (Math.log10(10000) - Math.log10(470))
  return THREE.MathUtils.clamp(0.85 + t * 0.3, 0.8, 1.2)
}

/** One groove of the pressure vent pressed into the aluminium top. */
function Score({ from, to }: { from: [number, number]; to: [number, number] }) {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  return (
    <mesh position={[(from[0] + to[0]) / 2, TOP + 0.014, (from[1] + to[1]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]}>
      <boxGeometry args={[Math.hypot(dx, dz), 0.006, 0.018]} />
      <meshStandardMaterial color="#7d838c" metalness={0.7} roughness={0.5} />
    </mesh>
  )
}

/** Upright electrolytic capacitor that fills with light as it charges. */
export function CapacitorModel({
  charge,
  capacitance,
  reversed,
}: {
  /** 0..1: how full it is */
  charge: number
  /** µF */
  capacitance: number
  /** wired the wrong way round */
  reversed: boolean
}) {
  const level = useRef(THREE.MathUtils.clamp(charge, 0, 1))
  const warn = useRef(reversed ? 1 : 0)
  const aura = useRef(0)
  const fill = useRef<THREE.Mesh>(null)
  const fillMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const meniscus = useRef<THREE.Mesh>(null)
  const sleeve = useRef<THREE.MeshStandardMaterial>(null)
  const top = useRef<THREE.MeshStandardMaterial>(null)

  useFrame((_, dt) => {
    const target = THREE.MathUtils.clamp(Number.isFinite(charge) ? charge : 0, 0, 1)
    level.current = damp(level.current, target, 4, dt)
    warn.current = damp(warn.current, reversed ? 1 : 0, 6, dt)
    const c = level.current
    aura.current = c * 0.4

    // a band of light that rises from the bottom of the sleeve
    const f = fill.current
    if (f) {
      f.visible = c > 0.01
      f.scale.y = Math.max(0.001, c * HEIGHT)
      f.position.y = BOTTOM + (c * HEIGHT) / 2
    }
    if (fillMaterial.current) fillMaterial.current.opacity = 0.16 + c * 0.3
    const m = meniscus.current
    if (m) {
      m.visible = c > 0.02 && c < 0.985
      m.position.y = BOTTOM + c * HEIGHT
    }
    if (sleeve.current) sleeve.current.emissiveIntensity = c * 0.22

    const t = top.current
    if (t) {
      t.color.lerpColors(TOP_SILVER, TOP_WARN, warn.current * 0.75)
      t.emissiveIntensity = warn.current * 0.35
    }
  })

  return (
    <group rotation={[0.42, 0, 0]} scale={canScale(capacitance)}>
      {/* plastic sleeve */}
      <mesh position={[0, BOTTOM + HEIGHT / 2, 0]}>
        <cylinderGeometry args={[RADIUS, RADIUS, HEIGHT, 40]} />
        <meshStandardMaterial ref={sleeve} color="#1e3a8a" roughness={0.38} metalness={0.15} emissive="#0ea5e9" emissiveIntensity={0} />
      </mesh>
      <mesh position={[0, TOP, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RADIUS - 0.022, 0.026, 10, 40]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.38} metalness={0.15} />
      </mesh>
      <mesh position={[0, BOTTOM, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RADIUS - 0.022, 0.026, 10, 40]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.38} metalness={0.15} />
      </mesh>

      {/* light stripe with − marks on the negative side */}
      <mesh position={[0, BOTTOM + HEIGHT / 2, 0]}>
        <cylinderGeometry
          args={[RADIUS + 0.002, RADIUS + 0.002, HEIGHT * 0.9, 12, 1, true, STRIPE_ANGLE - STRIPE_WIDTH / 2, STRIPE_WIDTH]}
        />
        <meshStandardMaterial color="#c7d2fe" roughness={0.45} />
      </mesh>
      {MINUS_MARKS.map((y) => (
        <mesh
          key={y}
          position={[Math.sin(STRIPE_ANGLE) * (RADIUS + 0.004), y, Math.cos(STRIPE_ANGLE) * (RADIUS + 0.004)]}
          rotation={[0, STRIPE_ANGLE, 0]}
        >
          <boxGeometry args={[0.085, 0.024, 0.006]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
        </mesh>
      ))}

      {/* charge level */}
      <mesh ref={fill} visible={false} renderOrder={3}>
        <cylinderGeometry args={[RADIUS + 0.007, RADIUS + 0.007, 1, 40, 1, true]} />
        <meshBasicMaterial
          ref={fillMaterial}
          color="#38bdf8"
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={meniscus} visible={false} rotation={[Math.PI / 2, 0, 0]} renderOrder={3}>
        <torusGeometry args={[RADIUS + 0.008, 0.012, 6, 40]} />
        <meshBasicMaterial color="#a5f3fc" transparent opacity={0.85} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* aluminium top with a K-shaped vent */}
      <mesh position={[0, TOP + 0.001, 0]}>
        <cylinderGeometry args={[RADIUS - 0.035, RADIUS - 0.035, 0.022, 40]} />
        <meshStandardMaterial ref={top} color={TOP_SILVER} metalness={0.85} roughness={0.3} emissive="#ef4444" emissiveIntensity={0} />
      </mesh>
      <Score from={[-0.07, -0.15]} to={[-0.07, 0.15]} />
      <Score from={[-0.07, 0]} to={[0.1, -0.15]} />
      <Score from={[-0.07, 0]} to={[0.1, 0.15]} />

      {/* rubber bung and legs: the longer one is + */}
      <mesh position={[0, BOTTOM - 0.012, 0]}>
        <cylinderGeometry args={[RADIUS - 0.03, RADIUS - 0.03, 0.03, 32]} />
        <meshStandardMaterial color="#111827" roughness={0.8} />
      </mesh>
      <mesh position={[-0.11, (BOTTOM - 0.74) / 2, 0]}>
        <cylinderGeometry args={[0.022, 0.022, BOTTOM + 0.74, 8]} />
        <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0.11, (BOTTOM - 0.66) / 2, 0]}>
        <cylinderGeometry args={[0.022, 0.022, BOTTOM + 0.66, 8]} />
        <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.25} />
      </mesh>

      <Halo color="#38bdf8" intensity={aura} position={[0, BOTTOM + HEIGHT / 2, 0.2]} scale={1.4} />
    </group>
  )
}
