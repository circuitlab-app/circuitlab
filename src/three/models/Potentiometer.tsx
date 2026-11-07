import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { DEG, Halo, damp } from '../helpers'
import { METAL, unit, useBuilt } from './shared'

const R = 0.8
/** the resistance track: a 270° ring with its gap at the bottom */
const TRACK_IN = 0.47
const TRACK_OUT = 0.62
const TRACK_START = -45 * DEG
const TRACK_LENGTH = 270 * DEG
/** where on the track the wiper sits: B at 225°, A at −45° */
const wiperAngle = (level: number) => (225 - 270 * unit(level)) * DEG

const CARBON = new THREE.Color('#2b2b30')
const LOW = new THREE.Color('#3b3b44')
const MID = new THREE.Color('#c2410c')
const HIGH = new THREE.Color('#ffb15c')

/**
 * The track coloured by its voltage: dark at B (−), glowing orange at A (+).
 * The wiper picks up whatever voltage is under it.
 */
function trackGeometry() {
  const g = new THREE.RingGeometry(TRACK_IN, TRACK_OUT, 72, 1, TRACK_START, TRACK_LENGTH)
  const position = g.attributes.position
  const colors = new Float32Array(position.count * 3)
  const color = new THREE.Color()
  for (let i = 0; i < position.count; i++) {
    let angle = Math.atan2(position.getY(i), position.getX(i))
    if (angle < TRACK_START - 1e-6) angle += Math.PI * 2
    // 0 at B, 1 at A
    const share = THREE.MathUtils.clamp((225 * DEG - angle) / TRACK_LENGTH, 0, 1)
    if (share < 0.55) color.copy(LOW).lerp(MID, share / 0.55)
    else color.copy(MID).lerp(HIGH, (share - 0.55) / 0.45)
    color.toArray(colors, i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return g
}

const carbonGeometry = () => new THREE.RingGeometry(TRACK_IN, TRACK_OUT, 72, 1, TRACK_START, TRACK_LENGTH)

/**
 * A see-through potentiometer: as the knob turns, the wiper arm slides along
 * the resistance track from B to A. With volts across it the track glows from
 * dark (B) to bright (A), so you can see the voltage the wiper picks up.
 */
export function PotentiometerModel({ level, powered }: { level: number; powered: boolean }) {
  const track = useBuilt(trackGeometry)
  const carbon = useBuilt(carbonGeometry)
  const arm = useRef<THREE.Group>(null)
  const glowMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const contact = useRef<THREE.Group>(null)
  const angle = useRef(wiperAngle(level))
  const lit = useRef(powered ? 1 : 0)
  const spark = useRef(0)

  useFrame((_, dt) => {
    angle.current = damp(angle.current, wiperAngle(level), 12, dt)
    lit.current = damp(lit.current, powered ? 1 : 0, 6, dt)
    if (arm.current) arm.current.rotation.z = angle.current
    if (glowMaterial.current) glowMaterial.current.opacity = lit.current
    if (contact.current) {
      const r = (TRACK_IN + TRACK_OUT) / 2
      contact.current.position.set(Math.cos(angle.current) * r, Math.sin(angle.current) * r, 0.12)
    }
    // the contact shines brighter the closer it is to A, where the volts are highest
    const share = THREE.MathUtils.clamp((225 * DEG - angle.current) / TRACK_LENGTH, 0, 1)
    spark.current = lit.current * share * 0.75
  })

  const ticks = Array.from({ length: 11 }, (_, i) => (225 - 27 * i) * DEG)

  return (
    <group position={[0, 0.12, 0]} rotation={[-0.42, 0.18, 0]}>
      {/* three legs: B, W, A */}
      {[-0.32, 0, 0.32].map((x) => (
        <mesh key={x} position={[x, -R - 0.1, -0.02]}>
          <boxGeometry args={[0.08, 0.32, 0.03]} />
          <meshStandardMaterial {...(x === 0 ? { color: '#e5c76b', metalness: 0.85, roughness: 0.3 } : METAL)} />
        </mesh>
      ))}
      {/* the housing */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[R, R, 0.16, 56]} />
        <meshStandardMaterial color="#312e81" roughness={0.45} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0, 0.081]}>
        <ringGeometry args={[R - 0.07, R, 56]} />
        <meshStandardMaterial color="#4338ca" roughness={0.4} metalness={0.2} />
      </mesh>
      {ticks.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * (R - 0.035), Math.sin(a) * (R - 0.035), 0.084]} rotation={[0, 0, a]}>
          <boxGeometry args={[0.05, 0.012, 0.004]} />
          <meshStandardMaterial color="#e0e7ff" roughness={0.6} />
        </mesh>
      ))}
      {/* the resistance track, and its glow when there are volts across it */}
      <mesh geometry={carbon} position={[0, 0, 0.082]}>
        <meshStandardMaterial color={CARBON} roughness={0.9} />
      </mesh>
      <mesh geometry={track} position={[0, 0, 0.084]}>
        <meshBasicMaterial ref={glowMaterial} vertexColors transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* the end contacts of the track */}
      {[TRACK_START, TRACK_START + TRACK_LENGTH].map((a) => (
        <mesh key={a} position={[Math.cos(a) * 0.545, Math.sin(a) * 0.545, 0.09]}>
          <boxGeometry args={[0.1, 0.1, 0.012]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      ))}
      {/* the wiper arm, turned by the shaft */}
      <group ref={arm} position={[0, 0, 0.1]}>
        <mesh position={[0.29, 0, 0]}>
          <boxGeometry args={[0.5, 0.07, 0.02]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        <mesh position={[0.545, 0, -0.005]}>
          <boxGeometry args={[0.07, 0.11, 0.02]} />
          <meshStandardMaterial color="#e5c76b" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>
      <group ref={contact}>
        <Halo color="#ffb15c" intensity={spark} scale={0.6} />
      </group>
      {/* the knurled shaft with its slot */}
      <mesh position={[0, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.16, 18]} />
        <meshStandardMaterial color="#c4c9d1" metalness={0.75} roughness={0.35} flatShading />
      </mesh>
      <mesh position={[0, 0, 0.252]}>
        <circleGeometry args={[0.165, 28]} />
        <meshStandardMaterial color="#d9dde3" metalness={0.6} roughness={0.3} />
      </mesh>
      <ShaftSlot level={level} />
    </group>
  )
}

/** The screwdriver slot on the shaft turns with the wiper. */
function ShaftSlot({ level }: { level: number }) {
  const slot = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (slot.current) slot.current.rotation.z = damp(slot.current.rotation.z, wiperAngle(level), 12, dt)
  })
  return (
    <mesh ref={slot} position={[0, 0, 0.256]}>
      <boxGeometry args={[0.3, 0.04, 0.01]} />
      <meshStandardMaterial color="#52525b" roughness={0.6} />
    </mesh>
  )
}
