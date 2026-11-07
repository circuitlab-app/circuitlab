import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, Smoke, damp } from '../helpers'
import { Lead } from './kit'
import { markingTexture } from './print'
import { GOLD, METAL, merge, unit, useBuilt } from './shared'

/* A 4-pin DIP (PC817) drawn to scale, 1 mm ≈ 0.2 units, lying with its top toward +z. */
const W = 1.3
const H = 0.92
const T = 0.36
const TOP = T / 2
const PIN_Y = 0.254
/** the lead frame and the legs leave the body at this height */
const FRAME_Z = -0.04
const LEG_DROP = 0.5
const LED_X = -0.31
const EYE_X = 0.31

/** The four legs: out of the side, a wide shoulder, then bent down and thin. */
function legsGeometry() {
  return merge(
    [-1, 1].flatMap((side) =>
      [-1, 1].flatMap((row) => {
        // where the leg bends down, just off the side of the body
        const bend = side * (W / 2 + 0.1)
        const y = row * PIN_Y
        return [
          new THREE.BoxGeometry(0.13, 0.14, 0.03).translate(side * (W / 2 + 0.035), y, FRAME_Z),
          new THREE.BoxGeometry(0.03, 0.14, 0.15).translate(bend, y, FRAME_Z - 0.06),
          new THREE.BoxGeometry(0.03, 0.065, LEG_DROP - 0.13).translate(bend, y, FRAME_Z - 0.13 - (LEG_DROP - 0.13) / 2),
        ]
      }),
    ),
  )
}

/** The lead frame inside: a strip from each pin, with a wider pad under each die. */
function frameGeometry() {
  const strip = (x0: number, x1: number, y: number) => new THREE.BoxGeometry(Math.abs(x1 - x0), 0.08, 0.02).translate((x0 + x1) / 2, y, FRAME_Z)
  return merge([
    // LED side: + (top) ends near the die, − (bottom) carries it
    strip(-W / 2, -0.43, PIN_Y),
    strip(-W / 2, -0.4, -PIN_Y),
    new THREE.BoxGeometry(0.2, 0.36, 0.02).translate(LED_X - 0.02, -0.1, FRAME_Z),
    // switch side: C (top) carries the light-catching die, E (bottom) is wired to it
    strip(0.43, W / 2, -PIN_Y),
    strip(0.4, W / 2, PIN_Y),
    new THREE.BoxGeometry(0.2, 0.36, 0.02).translate(EYE_X + 0.02, 0.1, FRAME_Z),
  ])
}

/** tinned legs: full metalness looks black without an environment map */
const TIN = { color: '#cfd3d9', metalness: 0.55, roughness: 0.32 } as const
const BEAM_CORE = '#ff3d6e'
const BEAM_OUTER = '#b05cff'

/**
 * A PC817 optocoupler in a smoky see-through case, so you can look inside:
 * an LED on the left and a light-catching switch (a phototransistor) on the
 * right, facing each other across a small gap. When the LED is lit its
 * (invisible infrared) light crosses the gap, shown here warm red, and the
 * switch side lights up green to show it is switched on.
 */
export function OptocouplerModel({
  led,
  output,
  burnt,
}: {
  /** 0..1.3: how bright the LED inside is */
  led: number
  /** 0..1: how much its light switch conducts */
  output: number
  burnt: boolean
}) {
  const legs = useBuilt(legsGeometry)
  const frame = useBuilt(frameGeometry)
  const print = markingTexture(['PC817 C', '2245'], 0.5, 0.13, '#e4e4e7')
  const ledDie = useRef<THREE.MeshStandardMaterial>(null)
  const eyeDie = useRef<THREE.MeshStandardMaterial>(null)
  const core = useRef<THREE.MeshBasicMaterial>(null)
  const outer = useRef<THREE.MeshBasicMaterial>(null)
  const lit = useRef(0)
  const on = useRef(0)
  const ledGlow = useRef(0)
  const eyeGlow = useRef(0)

  useFrame((_, dt) => {
    const target = burnt ? 0 : Math.min(1.3, Math.max(0, Number.isFinite(led) ? led : 0))
    lit.current = damp(lit.current, target, 12, dt)
    on.current = damp(on.current, burnt ? 0 : unit(output), 10, dt)
    const l = Math.min(1, lit.current)
    if (ledDie.current) ledDie.current.emissiveIntensity = lit.current * 3
    if (eyeDie.current) eyeDie.current.emissiveIntensity = on.current * 2.4
    if (core.current) core.current.opacity = l * 0.55
    if (outer.current) outer.current.opacity = l * 0.22
    ledGlow.current = lit.current * 0.7
    eyeGlow.current = on.current * 0.55
  })

  return (
    <group position={[0, 0.06, 0]} rotation={[-0.42, 0.22, 0]}>
      <mesh geometry={legs}>
        <meshStandardMaterial {...TIN} />
      </mesh>
      <mesh geometry={frame}>
        <meshStandardMaterial {...TIN} color={burnt ? '#57534e' : TIN.color} />
      </mesh>

      {/* the LED die in its little silver cup, turned toward the switch */}
      <group position={[LED_X, -0.02, FRAME_Z + 0.01]} rotation={[0, 0.7, 0]}>
        <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.06, 0.06, 20, 1, true]} />
          <meshStandardMaterial {...METAL} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.065, 0.065, 0.05]} />
          <meshStandardMaterial
            ref={ledDie}
            color={burnt ? '#0c0a09' : '#3b3340'}
            emissive={BEAM_CORE}
            emissiveIntensity={0}
            roughness={0.4}
            toneMapped={false}
          />
        </mesh>
      </group>
      {/* the phototransistor die, turned toward the LED */}
      <group position={[EYE_X, 0.03, FRAME_Z + 0.01]} rotation={[0, -0.7, 0]}>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.13, 0.13, 0.03]} />
          <meshStandardMaterial color={burnt ? '#1c1917' : '#334155'} metalness={0.35} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.036]}>
          <planeGeometry args={[0.085, 0.085]} />
          <meshStandardMaterial
            ref={eyeDie}
            color={burnt ? '#0c0a09' : '#5b6b82'}
            emissive="#22c55e"
            emissiveIntensity={0}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>
      </group>
      {/* gold bond wires from each die to the other pin */}
      <Lead points={[[LED_X + 0.02, 0.0, FRAME_Z + 0.07], [LED_X - 0.06, 0.16, FRAME_Z + 0.13], [-0.45, PIN_Y, FRAME_Z + 0.015]]} radius={0.007} color={GOLD.color} />
      <Lead points={[[EYE_X - 0.02, 0.01, FRAME_Z + 0.06], [EYE_X + 0.06, -0.15, FRAME_Z + 0.12], [0.45, -PIN_Y, FRAME_Z + 0.015]]} radius={0.007} color={GOLD.color} />

      {/* the black lower half of the moulding: the lead frame lies on it */}
      <mesh position={[0, 0, (-T / 2 + FRAME_Z - 0.012) / 2]}>
        <boxGeometry args={[W - 0.03, H - 0.03, FRAME_Z - 0.012 + T / 2]} />
        <meshStandardMaterial color={burnt ? '#0c0a09' : '#141217'} roughness={0.6} />
      </mesh>
      {/* the clear silicone that carries the light across the gap */}
      <mesh position={[0, 0, FRAME_Z + 0.03]} scale={[0.42, 0.17, 0.09]} renderOrder={3}>
        <sphereGeometry args={[1, 28, 16]} />
        <meshStandardMaterial color="#ede9fe" transparent opacity={burnt ? 0.03 : 0.08} roughness={0.2} depthWrite={false} />
      </mesh>
      {/* the light crossing the gap: a bright core inside a wider soft cone */}
      <group position={[0, 0.005, FRAME_Z + 0.05]} rotation={[0, 0, -Math.PI / 2]}>
        <mesh renderOrder={7}>
          <cylinderGeometry args={[0.07, 0.03, 0.5, 20, 1, true]} />
          <meshBasicMaterial ref={core} color={BEAM_CORE} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <mesh renderOrder={7}>
          <cylinderGeometry args={[0.13, 0.05, 0.5, 20, 1, true]} />
          <meshBasicMaterial ref={outer} color={BEAM_OUTER} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
      <Halo color="#ff5a86" intensity={ledGlow} position={[LED_X + 0.04, -0.02, FRAME_Z + 0.12]} scale={0.75} />
      <Halo color="#4ade80" intensity={eyeGlow} position={[EYE_X, 0.03, FRAME_Z + 0.12]} scale={0.6} />

      {/* the smoky see-through case, drawn after everything inside it */}
      <RoundedBox args={[W, H, T]} radius={0.035} smoothness={2} renderOrder={5}>
        <meshStandardMaterial
          color={burnt ? '#1c1310' : '#3a3342'}
          transparent
          opacity={burnt ? 0.92 : 0.34}
          roughness={0.42}
          metalness={0.05}
          depthWrite={false}
        />
      </RoundedBox>
      {/* pin-1 dot and the marking on top */}
      <mesh position={[-W / 2 + 0.13, PIN_Y + 0.06, TOP + 0.001]} renderOrder={6}>
        <circleGeometry args={[0.04, 20]} />
        <meshStandardMaterial color="#0b0b0d" roughness={0.8} />
      </mesh>
      <mesh position={[0.02, H / 2 - 0.1, TOP + 0.002]} renderOrder={6}>
        <planeGeometry args={[0.5, 0.13]} />
        <meshStandardMaterial map={print} transparent opacity={burnt ? 0.3 : 0.9} roughness={0.7} depthWrite={false} />
      </mesh>
      <group position={[0.1, 0.12, TOP]} scale={0.5}>
        <Smoke active={burnt} position={[0, 0, 0]} rise={0.5} />
      </group>
    </group>
  )
}
