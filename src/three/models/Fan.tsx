import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Smoke, damp } from '../helpers'
import { Lead } from './kit'
import { merge, useBuilt } from './shared'

const SIZE = 1.5
const DEPTH = 0.38
const FRONT = DEPTH / 2
const HOLE_R = 0.7
const HUB_R = 0.28
const TIP_R = 0.675
const BLADES = 7
/** rad/s the rotor visibly turns at 5 V; the real one is far too fast to see */
const RATED = 9
const STREAKS = 12
const PLASTIC = { color: '#1d1d20', roughness: 0.55 } as const

/** The square frame: lightly rounded corners, the round opening and four screw holes. */
function frameGeometry() {
  const h = SIZE / 2
  const c = 0.09
  const shape = new THREE.Shape()
  shape.moveTo(-h + c, -h)
  shape.lineTo(h - c, -h)
  shape.quadraticCurveTo(h, -h, h, -h + c)
  shape.lineTo(h, h - c)
  shape.quadraticCurveTo(h, h, h - c, h)
  shape.lineTo(-h + c, h)
  shape.quadraticCurveTo(-h, h, -h, h - c)
  shape.lineTo(-h, -h + c)
  shape.quadraticCurveTo(-h, -h, -h + c, -h)
  shape.holes.push(new THREE.Path().absarc(0, 0, HOLE_R, 0, Math.PI * 2, true))
  for (const [x, y] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    shape.holes.push(new THREE.Path().absarc(x * (h - 0.13), y * (h - 0.13), 0.055, 0, Math.PI * 2, true))
  }
  return new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH - 0.024,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 40,
  }).translate(0, 0, -FRONT + 0.012)
}

/** One curved blade: swept forward, twisted, a little cupped. */
function bladeGeometry() {
  const NR = 8
  const NC = 8
  const positions: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= NR; i++) {
    const t = i / NR
    const r = HUB_R - 0.01 + (TIP_R - HUB_R + 0.01) * t
    const sweep = 0.55 * t * t
    const chord = 0.6 + 0.16 * t
    const span = 0.24 + 0.04 * t
    for (let j = 0; j <= NC; j++) {
      const s = j / NC - 0.5
      const a = sweep + s * chord
      positions.push(Math.cos(a) * r, Math.sin(a) * r, -s * span + 0.025 * (1 - 4 * s * s))
    }
  }
  for (let i = 0; i < NR; i++) {
    for (let j = 0; j < NC; j++) {
      const a = i * (NC + 1) + j
      const c = a + NC + 1
      indices.push(a, c, a + 1, a + 1, c, c + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setIndex(indices)
  g.computeVertexNormals()
  return g
}

const bladesGeometry = () =>
  merge(Array.from({ length: BLADES }, (_, i) => bladeGeometry().rotateZ((i * Math.PI * 2) / BLADES)))

/** The smear the blades turn into when they spin fast: seven soft lobes. */
function blurTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2
  for (let d = 0; d < 360; d += 1) {
    const a = (d * Math.PI) / 180
    const lobe = (0.5 + 0.5 * Math.cos(a * BLADES)) ** 2
    ctx.fillStyle = `rgba(30,30,34,${0.8 + 0.18 * lobe})`
    ctx.beginPath()
    ctx.moveTo(c, c)
    ctx.arc(c, c, c, a, a + (1.6 * Math.PI) / 180)
    ctx.closePath()
    ctx.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** The round label on the motor: its rating, as on a real fan. */
function stickerTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2
  ctx.fillStyle = '#d9dce1'
  ctx.beginPath()
  ctx.arc(c, c, c, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#3f3f46'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(c, c, c - 14, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#18181b'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '800 54px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText('DC 5V', c, c - 20)
  ctx.font = '600 34px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText('0.10A', c, c + 30)
  ctx.font = '500 20px ui-monospace, monospace'
  ctx.fillText('4010S', c, c + 70)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/** Where each airflow streak starts: its radius, angle and timing. */
const STREAK_AT = Array.from({ length: STREAKS }, (_, i) => ({
  r: 0.36 + ((i * 7) % 5) * 0.065,
  a: (i / STREAKS) * Math.PI * 2 + (i % 3) * 0.2,
  offset: ((i * 5) % STREAKS) / STREAKS,
}))

/**
 * A 40 mm cooling fan, like the ones inside computers. Seen from the side the
 * air comes out of: four struts hold the motor with its label, and the seven
 * blades spin behind them. It speeds up and coasts down, its blades blur when
 * they go fast, and you can see the air it blows.
 */
export function FanModel({ speed, hot }: { speed: number; hot: boolean }) {
  const frame = useBuilt(frameGeometry)
  const blades = useBuilt(bladesGeometry)
  const blur = useMemo(() => blurTexture(), [])
  const sticker = useMemo(() => stickerTexture(), [])
  useEffect(
    () => () => {
      blur.dispose()
      sticker.dispose()
    },
    [blur, sticker],
  )
  const rotor = useRef<THREE.Group>(null)
  const bladeMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const discMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const streaks = useRef<(THREE.Mesh | null)[]>([])
  const omega = useRef(0)
  const travel = useRef(0)

  useFrame((_, dt) => {
    const target = Number.isFinite(speed) ? THREE.MathUtils.clamp(speed, 0, 1.8) * RATED : 0
    // the rotor has inertia: it spins up and coasts down
    omega.current = damp(omega.current, target, target > omega.current ? 2.6 : 2.4, dt)
    const w = omega.current < 0.02 ? 0 : omega.current
    const s = w / RATED
    if (rotor.current) rotor.current.rotation.z -= w * dt
    // fast blades melt into a dark, see-through disc
    const smear = THREE.MathUtils.clamp((s - 0.45) * 1.3, 0, 0.8)
    if (bladeMaterial.current) bladeMaterial.current.opacity = 1 - smear * 0.9
    if (discMaterial.current) discMaterial.current.opacity = Math.min(0.94, smear * 1.2)
    // the air leaves the front in a gentle spiral
    travel.current += dt * (0.25 + 0.75 * Math.min(1.5, s)) * (s > 0.02 ? 1 : 0)
    streaks.current.forEach((streak, i) => {
      if (!streak) return
      const at = STREAK_AT[i]
      const u = (travel.current + at.offset) % 1
      streak.visible = s > 0.04
      const a = at.a - u * 0.9
      streak.position.set(Math.cos(a) * at.r * (1 + u * 0.12), Math.sin(a) * at.r * (1 + u * 0.12), FRONT + 0.12 + u * 0.7)
      ;(streak.material as THREE.MeshBasicMaterial).opacity = Math.sin(u * Math.PI) * 0.55 * Math.min(1, s * 1.4)
    })
  })

  return (
    <group position={[-0.26, 0.05, 0]} rotation={[0.2, 0.6, 0]}>
      <mesh geometry={frame}>
        <meshStandardMaterial {...PLASTIC} />
      </mesh>
      {/* the arrows moulded into the top edge: airflow, and the way the blades turn */}
      <group position={[0, SIZE / 2 + 0.013, 0]}>
        <mesh position={[0.32, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.03, 0.18]} />
          <meshStandardMaterial color="#3a3a40" roughness={0.6} />
        </mesh>
        <mesh position={[0.32, 0.001, 0.11]} rotation={[-Math.PI / 2, 0, Math.PI]}>
          <circleGeometry args={[0.05, 3]} />
          <meshStandardMaterial color="#3a3a40" roughness={0.6} />
        </mesh>
        <mesh position={[-0.3, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 0.03]} />
          <meshStandardMaterial color="#3a3a40" roughness={0.6} />
        </mesh>
        <mesh position={[-0.42, 0.001, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <circleGeometry args={[0.05, 3]} />
          <meshStandardMaterial color="#3a3a40" roughness={0.6} />
        </mesh>
      </group>

      {/* the spinning part: hub and seven blades, and the blur they become */}
      <group ref={rotor}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.03]}>
          <cylinderGeometry args={[HUB_R, HUB_R, 0.28, 36]} />
          <meshStandardMaterial {...PLASTIC} />
        </mesh>
        {/* the blur is drawn first, so the fading blades never punch holes in it */}
        <mesh geometry={blades} renderOrder={2}>
          <meshStandardMaterial ref={bladeMaterial} {...PLASTIC} roughness={0.42} side={THREE.DoubleSide} transparent />
        </mesh>
        <mesh renderOrder={1}>
          <ringGeometry args={[HUB_R, TIP_R, 64, 1]} />
          <meshBasicMaterial ref={discMaterial} map={blur} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* four struts hold the motor, with its label, in the middle */}
      {[45, 135, 225, 315].map((d) => {
        const a = (d * Math.PI) / 180
        const mid = (HUB_R + HOLE_R) / 2
        return (
          <mesh key={d} position={[Math.cos(a) * mid, Math.sin(a) * mid, FRONT - 0.04]} rotation={[0, 0, a]}>
            <boxGeometry args={[HOLE_R - HUB_R + 0.06, 0.05, 0.07]} />
            <meshStandardMaterial {...PLASTIC} />
          </mesh>
        )
      })}
      <mesh position={[0, 0, FRONT - 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[HUB_R + 0.01, HUB_R + 0.01, 0.07, 40]} />
        <meshStandardMaterial {...PLASTIC} />
      </mesh>
      <mesh position={[0, 0, FRONT - 0.004]}>
        <circleGeometry args={[HUB_R - 0.025, 40]} />
        <meshStandardMaterial map={sticker} roughness={0.4} metalness={0.15} />
      </mesh>

      {/* the leads run along a strut and out of the corner, ending in a little plug */}
      <Lead points={[[0.18, -0.2, FRONT + 0.0], [0.42, -0.44, FRONT + 0.02], [0.64, -0.6, FRONT + 0.04], [0.9, -0.74, 0.12], [1.0, -0.98, 0.02]]} radius={0.022} color="#dc2626" />
      <Lead points={[[0.2, -0.17, FRONT + 0.0], [0.45, -0.4, FRONT + 0.03], [0.67, -0.56, FRONT + 0.05], [0.95, -0.7, 0.13], [1.06, -0.94, 0.04]]} radius={0.022} color="#18181b" />
      <RoundedBox args={[0.2, 0.1, 0.12]} radius={0.015} smoothness={2} position={[1.04, -1.02, 0.03]} rotation={[0, 0, -0.35]}>
        <meshStandardMaterial color="#f4f1ea" roughness={0.6} />
      </RoundedBox>

      {Array.from({ length: STREAKS }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            streaks.current[i] = m
          }}
          rotation={[Math.PI / 2, 0, 0]}
          visible={false}
          renderOrder={5}
        >
          <cylinderGeometry args={[0.009, 0.009, 0.26, 5, 1, true]} />
          <meshBasicMaterial color="#7cc4ea" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
      <Smoke active={hot} position={[0.05, 0.32, FRONT + 0.12]} rise={0.35} color="#858b94" />
    </group>
  )
}
