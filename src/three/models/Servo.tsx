import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { damp } from '../helpers'

const BODY_W = 0.92
const BODY_H = 0.9
const BODY_D = 0.49
const TOP = BODY_H / 2
/** the output shaft sits over one end of the body */
const SHAFT_X = BODY_W / 2 - BODY_D / 2
const TOWER_H = 0.14
const HORN_Y = TOP + TOWER_H + 0.03
const HORN_L = 0.36
const HORN_TIP = 0.055
const HORN_HUB = 0.11
const HORN_T = 0.045
const EAR_Y = TOP - 0.22
const WIRES = ['#6b3f1d', '#dc2626', '#f97316']
const UP = new THREE.Vector3(0, 1, 0)

const blue = { color: '#2b6fd6', roughness: 0.3, metalness: 0.05 } as const
const white = { color: '#f8fafc', roughness: 0.45 } as const

/** Flat two-arm horn with its rows of holes, lying in the xz plane, marked arm along +x. */
function hornGeometry() {
  const s = new THREE.Shape()
  s.moveTo(-HORN_L, -HORN_TIP)
  s.lineTo(0, -HORN_HUB)
  s.lineTo(HORN_L, -HORN_TIP)
  s.absarc(HORN_L, 0, HORN_TIP, -Math.PI / 2, Math.PI / 2, false)
  s.lineTo(0, HORN_HUB)
  s.lineTo(-HORN_L, HORN_TIP)
  s.absarc(-HORN_L, 0, HORN_TIP, Math.PI / 2, Math.PI * 1.5, false)
  for (const x of [-0.3, -0.22, -0.14, 0.14, 0.22, 0.3]) {
    s.holes.push(new THREE.Path().absarc(x, 0, 0.018, 0, Math.PI * 2, true))
  }
  const g = new THREE.ExtrudeGeometry(s, {
    depth: HORN_T,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 1,
    curveSegments: 12,
  })
  // lie flat with the thickness pointing up
  g.rotateX(-Math.PI / 2)
  return g
}

/** One coloured wire of the servo lead, between two points. */
function Wire({ from, to, color }: { from: THREE.Vector3; to: THREE.Vector3; color: string }) {
  const direction = to.clone().sub(from)
  const length = direction.length()
  const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, direction.normalize())
  return (
    <mesh position={from.clone().add(to).multiplyScalar(0.5)} quaternion={quaternion}>
      <cylinderGeometry args={[0.022, 0.022, length, 8]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  )
}

/** SG90 micro servo: the white horn turns to `angle` (0..1 → 0°..180°) while powered. */
export function ServoModel({ angle, powered }: { angle: number; powered: boolean }) {
  const horn = useMemo(() => hornGeometry(), [])
  useEffect(() => () => horn.dispose(), [horn])
  const hornGroup = useRef<THREE.Group>(null)
  const target = () => THREE.MathUtils.clamp(Number.isFinite(angle) ? angle : 0, 0, 1) * Math.PI
  const current = useRef(target())

  useFrame((_, dt) => {
    // without power the gears hold still wherever they were
    if (powered) current.current = damp(current.current, target(), 6, dt)
    // 0 points the marked arm left, 90° toward you, 180° right
    if (hornGroup.current) hornGroup.current.rotation.y = current.current - Math.PI
  })

  return (
    <group position={[0.07, -0.1, 0]} rotation={[0.42, -0.3, 0]}>
      {/* case, mounting ears and the gear tower */}
      <RoundedBox args={[BODY_W, BODY_H, BODY_D]} radius={0.03} smoothness={2}>
        <meshStandardMaterial {...blue} />
      </RoundedBox>
      <RoundedBox args={[1.28, 0.08, BODY_D]} radius={0.02} smoothness={2} position={[0, EAR_Y, 0]}>
        <meshStandardMaterial {...blue} />
      </RoundedBox>
      {[-0.56, 0.56].map((x) => (
        <mesh key={x} position={[x, EAR_Y, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.084, 12]} />
          <meshStandardMaterial color="#0b1f45" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[SHAFT_X, TOP + TOWER_H / 2, 0]}>
        <cylinderGeometry args={[BODY_D / 2, BODY_D / 2, TOWER_H, 32]} />
        <meshStandardMaterial {...blue} />
      </mesh>
      <mesh position={[SHAFT_X - 0.3, TOP + 0.04, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 20]} />
        <meshStandardMaterial {...blue} />
      </mesh>
      <mesh position={[SHAFT_X, TOP + TOWER_H + 0.015, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.03, 16]} />
        <meshStandardMaterial {...white} />
      </mesh>

      {/* label on the front */}
      <mesh position={[0, -0.1, BODY_D / 2 + 0.002]}>
        <boxGeometry args={[0.62, 0.26, 0.004]} />
        <meshStandardMaterial color="#1e40af" roughness={0.5} />
      </mesh>
      {[
        [-0.06, 0.36],
        [-0.15, 0.24],
      ].map(([y, w]) => (
        <mesh key={y} position={[0, y, BODY_D / 2 + 0.005]}>
          <boxGeometry args={[w, 0.03, 0.004]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
        </mesh>
      ))}

      {/* the horn on the output shaft */}
      <group ref={hornGroup} position={[SHAFT_X, HORN_Y, 0]}>
        <mesh geometry={horn}>
          <meshStandardMaterial {...white} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.1, 24]} />
          <meshStandardMaterial {...white} />
        </mesh>
        <mesh position={[0, 0.105, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.012, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.25} />
        </mesh>
        {/* orange mark on one arm so you can read the angle */}
        <mesh position={[HORN_L + 0.01, HORN_T + 0.012, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.006, 12]} />
          <meshStandardMaterial color="#f97316" roughness={0.4} emissive="#f97316" emissiveIntensity={0.25} />
        </mesh>
      </group>

      {/* lead: brown (−), red (+), orange (signal) */}
      <mesh position={[-BODY_W / 2 - 0.02, -TOP + 0.09, 0]}>
        <boxGeometry args={[0.06, 0.09, 0.16]} />
        <meshStandardMaterial {...blue} />
      </mesh>
      {WIRES.map((color, i) => {
        const z = (i - 1) * 0.045
        return (
          <Wire
            key={color}
            color={color}
            from={new THREE.Vector3(-BODY_W / 2 - 0.04, -TOP + 0.09, z)}
            to={new THREE.Vector3(-BODY_W / 2 - 0.38, -TOP + 0.01, z)}
          />
        )
      })}
    </group>
  )
}
