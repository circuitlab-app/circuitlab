import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Halo, damp } from '../helpers'
import { Lead } from './kit'
import { BOARD_T, FACE, ModuleBoard, type SensorProps } from './Sensors'
import { CHIP, GOLD, METAL, merge, unit, useBuilt } from './shared'

/*
 * Sensor modules that feel water: the rain plate, the water level strip in a
 * glass, and the DHT11 that feels the water in the air.
 */

const WATER = '#38bdf8'

/* ------------------------------------------------------------------ rain */

const PLATE_W = 1.12
const PLATE_H = 0.86
/** the plate lies back like a roof, so the rain falls onto it */
const PLATE_TILT = -1.05
const PLATE_X = -0.3
const PLATE_Y = -0.3

/** The plate's two combs: nickel-plated teeth that sit in between each other. */
function combGeometry() {
  const parts: THREE.BufferGeometry[] = []
  const bar = 0.026
  const left = -PLATE_W / 2 + 0.09
  const right = PLATE_W / 2 - 0.09
  parts.push(new THREE.BoxGeometry(bar, PLATE_H - 0.16, 0.006).translate(left, 0, 0))
  parts.push(new THREE.BoxGeometry(bar, PLATE_H - 0.16, 0.006).translate(right, 0, 0))
  const teeth = 9
  for (let i = 0; i < teeth; i++) {
    const y = -PLATE_H / 2 + 0.11 + (i * (PLATE_H - 0.22)) / (teeth - 1)
    const fromLeft = i % 2 === 0
    const length = right - left - 0.09
    parts.push(new THREE.BoxGeometry(length, bar * 0.85, 0.006).translate(fromLeft ? left + length / 2 : right - length / 2, y, 0))
  }
  return merge(parts)
}

/** where on the plate the falling drops land, in the plate's own flat coordinates */
const DROPS: [number, number][] = [
  [-0.3, 0.22],
  [0.18, -0.12],
  [0.36, 0.26],
  [-0.12, -0.26],
  [0.02, 0.08],
  [-0.38, -0.05],
  [0.3, 0.02],
  [-0.2, 0.32],
]
/** beads of water that stay on the plate */
const BEADS: [number, number, number][] = [
  [-0.24, 0.05, 0.035],
  [0.26, -0.22, 0.04],
  [0.06, 0.24, 0.03],
  [-0.05, -0.15, 0.045],
  [0.4, 0.14, 0.028],
  [-0.4, -0.27, 0.032],
  [0.14, -0.02, 0.025],
]
const FALL = 0.55

/**
 * Rain sensor: a striped plate lying back like a roof, wired to its little
 * control board. Raindrops fall onto it, and the wetter it gets, the bigger the signal.
 */
export function RainSensorModel({ sense, level, powered }: SensorProps) {
  const comb = useBuilt(combGeometry)
  const drops = useRef<(THREE.Mesh | null)[]>([])
  const beads = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const splashes = useRef<(THREE.Mesh | null)[]>([])
  const rain = useRef(unit(sense))
  const glint = useRef(0)

  useFrame(({ clock }, dt) => {
    rain.current = damp(rain.current, unit(sense), 4, dt)
    const r = rain.current
    const t = clock.elapsedTime
    drops.current.forEach((d, i) => {
      if (!d) return
      // more rain: more drops falling at once
      const falling = i < Math.round(r * DROPS.length + 0.3) && r > 0.03
      d.visible = falling
      const phase = (t * (1.1 + (i % 3) * 0.17) + i * 0.37) % 1
      d.position.z = FACE + 0.035 + FALL * (1 - phase)
      const splash = splashes.current[i]
      if (splash) {
        // a little ring where the drop lands, just after it lands
        const s = phase > 0.85 ? (phase - 0.85) / 0.15 : 0
        splash.visible = falling && s > 0
        splash.scale.setScalar(0.4 + s * 1.2)
        ;(splash.material as THREE.MeshBasicMaterial).opacity = (1 - s) * 0.7
      }
    })
    beads.current.forEach((m, i) => {
      if (m) m.opacity = THREE.MathUtils.clamp(r * BEADS.length - i, 0, 1) * 0.8
    })
    glint.current = r * 0.25
  })

  return (
    <group position={[-0.06, 0.06, 0]} rotation={[0.08, -0.12, 0]}>
      {/* the plate: blue board, nickel combs, two pins at its far end */}
      <group position={[PLATE_X, PLATE_Y, 0]} rotation={[PLATE_TILT, 0, 0]}>
        <RoundedBox args={[PLATE_W, PLATE_H, BOARD_T]} radius={0.02} smoothness={2}>
          <meshStandardMaterial color="#1e3a8a" roughness={0.55} metalness={0.1} />
        </RoundedBox>
        <mesh geometry={comb} position={[0, 0, FACE + 0.003]}>
          <meshStandardMaterial color="#d4d8de" metalness={0.6} roughness={0.3} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (PLATE_W / 2 - 0.09), PLATE_H / 2 - 0.05, FACE + 0.004]}>
            <cylinderGeometry args={[0.03, 0.03, 0.008, 12]} />
            <meshStandardMaterial {...GOLD} />
          </mesh>
        ))}
        {BEADS.map(([x, y, r], i) => (
          <mesh key={i} position={[x, y, FACE + 0.006]} scale={[1, 1, 0.5]}>
            <sphereGeometry args={[r, 14, 10]} />
            <meshStandardMaterial
              ref={(m) => {
                beads.current[i] = m
              }}
              color="#7dd3fc"
              transparent
              opacity={0}
              roughness={0.05}
              metalness={0.1}
              depthWrite={false}
            />
          </mesh>
        ))}
        {/* the drops fall straight onto the plate's face */}
        {DROPS.map(([x, y], i) => (
          <group key={i} position={[x, y, 0]}>
            <mesh
              ref={(m) => {
                drops.current[i] = m
              }}
              position={[0, 0, FACE + FALL]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[1, 1.9, 1]}
              visible={false}
            >
              <sphereGeometry args={[0.03, 12, 8]} />
              <meshStandardMaterial color={WATER} transparent opacity={0.85} roughness={0.05} />
            </mesh>
            <mesh
              ref={(m) => {
                splashes.current[i] = m
              }}
              position={[0, 0, FACE + 0.01]}
              visible={false}
              renderOrder={3}
            >
              <torusGeometry args={[0.045, 0.006, 6, 20]} />
              <meshBasicMaterial color="#bae6fd" transparent opacity={0} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
        ))}
        <Halo color="#bae6fd" intensity={glint} position={[0.1, 0, FACE + 0.1]} scale={1.2} />
      </group>
      {/* two wires to the control board */}
      <Lead points={[[PLATE_X - 0.47, PLATE_Y + 0.23, -0.36], [0.05, 0.05, -0.32], [0.48, 0.2, -0.02]]} color="#dc2626" radius={0.018} />
      <Lead points={[[PLATE_X + 0.47, PLATE_Y + 0.23, -0.36], [0.4, -0.05, -0.28], [0.56, 0.16, -0.02]]} color="#18181b" radius={0.018} />
      {/* the little control board that turns the wet plate into a signal */}
      <group position={[0.7, 0.3, 0]} rotation={[-0.25, 0.2, 0]}>
        <ModuleBoard width={0.66} height={0.42} color="#1d4ed8" pins={4} leds={[[-0.2, 0.1], [-0.2, -0.05]]} powered={powered} level={level}>
          <mesh position={[0.1, 0.06, FACE + 0.07]}>
            <boxGeometry args={[0.2, 0.2, 0.14]} />
            <meshStandardMaterial color="#2563eb" roughness={0.4} />
          </mesh>
          <mesh position={[0.15, 0.11, FACE + 0.145]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
            <meshStandardMaterial color="#d6a84a" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0.12, -0.12, FACE + 0.02]}>
            <boxGeometry args={[0.2, 0.1, 0.04]} />
            <meshStandardMaterial {...CHIP} />
          </mesh>
        </ModuleBoard>
      </group>
    </group>
  )
}

/* ----------------------------------------------------------------- water */

const GLASS_R = 0.5
const GLASS_H = 0.72
const GLASS_Y = -0.62
/** the strip's lowest point, just above the glass floor */
const STRIP_W = 0.4
const STRIP_H = 1.08
const STRIP_Y = GLASS_Y + 0.08 + STRIP_H / 2
const WATER_LOW = 0.05
const WATER_HIGH = GLASS_H - 0.1

/** The strip's ten long fingers, alternately joined to S and to −. */
function fingerGeometry() {
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 10; i++) {
    const x = -STRIP_W / 2 + 0.05 + (i * (STRIP_W - 0.1)) / 9
    const long = i % 2 === 0
    const length = long ? 0.66 : 0.6
    parts.push(new THREE.BoxGeometry(0.016, length, 0.006).translate(x, -STRIP_H / 2 + 0.06 + length / 2 + (long ? 0 : 0.06), 0))
  }
  return merge(parts)
}

/**
 * Water sensor: the red strip stands in a glass. The slider fills the glass,
 * and the higher the water climbs up the fingers, the bigger the signal.
 */
export function WaterSensorModel({ sense, level, powered }: SensorProps) {
  const fingers = useBuilt(fingerGeometry)
  const water = useRef<THREE.Mesh>(null)
  const surface = useRef<THREE.Group>(null)
  const depth = useRef(unit(sense))
  const glint = useRef(0)

  useFrame(({ clock }, dt) => {
    depth.current = damp(depth.current, unit(sense), 4, dt)
    const h = THREE.MathUtils.lerp(WATER_LOW, WATER_HIGH, depth.current)
    if (water.current) {
      water.current.scale.y = h
      water.current.position.y = GLASS_Y + 0.02 + h / 2
    }
    if (surface.current) {
      surface.current.position.y = GLASS_Y + 0.02 + h
      // a slow wobble on the top of the water
      surface.current.rotation.z = Math.sin(clock.elapsedTime * 1.3) * 0.004
    }
    glint.current = powered ? unit(level) * 0.3 : 0
  })

  return (
    <group position={[0, 0.03, 0]} rotation={[0.22, -0.3, 0]} scale={0.94}>
      {/* the strip, its pins on top */}
      <group position={[0, STRIP_Y, -0.02]}>
        <ModuleBoard width={STRIP_W} height={STRIP_H} color="#b91c1c" header="top" leds={[[-0.1, STRIP_H / 2 - 0.12], [0.1, STRIP_H / 2 - 0.12]]} powered={powered} level={level}>
          <mesh geometry={fingers} position={[0, 0, FACE + 0.003]}>
            <meshStandardMaterial color="#e5b25d" metalness={0.75} roughness={0.3} />
          </mesh>
          <mesh position={[0, STRIP_H / 2 - 0.26, FACE + 0.015]}>
            <boxGeometry args={[0.12, 0.06, 0.03]} />
            <meshStandardMaterial color="#c8a27a" roughness={0.55} />
          </mesh>
          <Halo color="#7dd3fc" intensity={glint} position={[0, -0.1, FACE + 0.1]} scale={0.9} />
        </ModuleBoard>
      </group>
      {/* the water, and the glass around it */}
      <mesh ref={water} position={[0, GLASS_Y + 0.02 + WATER_LOW / 2, 0]} renderOrder={2}>
        <cylinderGeometry args={[GLASS_R - 0.025, GLASS_R - 0.035, 1, 40]} />
        <meshStandardMaterial color={WATER} transparent opacity={0.42} roughness={0.08} depthWrite={false} />
      </mesh>
      <group ref={surface} position={[0, GLASS_Y + 0.02 + WATER_LOW, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
          <ringGeometry args={[0.32, GLASS_R - 0.025, 40]} />
          <meshBasicMaterial color="#e0f2fe" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      </group>
      <mesh position={[0, GLASS_Y + GLASS_H / 2, 0]} renderOrder={4}>
        <cylinderGeometry args={[GLASS_R, GLASS_R - 0.02, GLASS_H, 40, 1, true]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.16} roughness={0.04} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, GLASS_Y + 0.01, 0]} renderOrder={4}>
        <cylinderGeometry args={[GLASS_R - 0.02, GLASS_R - 0.02, 0.02, 40]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.3} roughness={0.04} depthWrite={false} />
      </mesh>
      <mesh position={[0, GLASS_Y + GLASS_H, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={4}>
        <torusGeometry args={[GLASS_R, 0.012, 8, 40]} />
        <meshStandardMaterial color="#f0f9ff" transparent opacity={0.5} roughness={0.05} depthWrite={false} />
      </mesh>
      {/* a streak of light down the glass */}
      <mesh position={[0, GLASS_Y + GLASS_H / 2, 0]} renderOrder={5}>
        <cylinderGeometry args={[GLASS_R + 0.003, GLASS_R - 0.017, GLASS_H * 0.8, 8, 1, true, -1.1, 0.16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* -------------------------------------------------------------- humidity */

const DHT_W = 0.46
const DHT_H = 0.6
const DHT_D = 0.18
const DHT_X = -0.14

/** The DHT11's grille: rows of little windows that let the air in. */
function grilleGeometry() {
  const parts: THREE.BufferGeometry[] = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      parts.push(new THREE.BoxGeometry(0.09, 0.06, 0.01).translate(-0.11 + col * 0.11, 0.18 - row * 0.09, 0))
    }
  }
  return merge(parts)
}

/** where dew forms on the sensor in damp air */
const DEW: [number, number, number][] = [
  [-0.17, 0.25, 0.022],
  [0.12, 0.08, 0.026],
  [-0.02, -0.2, 0.02],
  [0.17, -0.12, 0.018],
  [-0.15, -0.04, 0.024],
  [0.05, 0.22, 0.017],
]

/**
 * Humidity sensor: the blue DHT11 on its little board. In damp air, dew
 * forms on it and a soft mist hangs around it.
 */
export function HumiditySensorModel({ sense, level, powered }: SensorProps) {
  const grille = useBuilt(grilleGeometry)
  const wet = useRef(unit(sense))
  const dew = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const mist = useRef(0)

  useFrame((_, dt) => {
    wet.current = damp(wet.current, unit(sense), 4, dt)
    const h = wet.current
    dew.current.forEach((m, i) => {
      // dew appears above about half: the damper the air, the more drops
      if (m) m.opacity = THREE.MathUtils.clamp((h - 0.45) * 2 * DEW.length - i, 0, 1) * 0.85
    })
    mist.current = Math.max(0, h - 0.55) * 0.9
  })

  return (
    <group position={[0.02, 0.0, 0]} rotation={[-0.25, 0.3, 0]}>
      <ModuleBoard width={1.0} height={0.82} color="#1f2937" leds={[[0.36, 0.06], [0.36, -0.1]]} powered={powered} level={level}>
        {/* the blue box, its grille, and a white label strip */}
        <group position={[DHT_X, 0.05, FACE + DHT_D / 2]}>
          <RoundedBox args={[DHT_W, DHT_H, DHT_D]} radius={0.025} smoothness={2}>
            <meshStandardMaterial color="#38bdf8" roughness={0.45} />
          </RoundedBox>
          <mesh geometry={grille} position={[0, 0.02, DHT_D / 2 + 0.001]}>
            <meshStandardMaterial color="#0c4a6e" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.24, DHT_D / 2 + 0.002]}>
            <boxGeometry args={[0.3, 0.05, 0.004]} />
            <meshStandardMaterial color="#e0f2fe" roughness={0.7} />
          </mesh>
          {DEW.map(([x, y, r], i) => (
            <mesh key={i} position={[x, y, DHT_D / 2 + 0.008]} scale={[1, 1.15, 0.55]}>
              <sphereGeometry args={[r, 12, 8]} />
              <meshStandardMaterial
                ref={(m) => {
                  dew.current[i] = m
                }}
                color="#e0f2fe"
                transparent
                opacity={0}
                roughness={0.02}
                metalness={0.2}
                depthWrite={false}
              />
            </mesh>
          ))}
          <Halo color="#e0f2fe" intensity={mist} position={[0, 0.05, DHT_D / 2 + 0.15]} scale={1.5} />
        </group>
        {/* its four legs into the board, and the pull-up resistor beside it */}
        {[-0.15, -0.05, 0.05, 0.15].map((x) => (
          <mesh key={x} position={[DHT_X + x, -0.29, FACE + 0.01]}>
            <boxGeometry args={[0.025, 0.04, 0.02]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
        ))}
        <mesh position={[0.32, 0.26, FACE + 0.012]}>
          <boxGeometry args={[0.1, 0.05, 0.024]} />
          <meshStandardMaterial color="#18181b" roughness={0.5} />
        </mesh>
      </ModuleBoard>
    </group>
  )
}
