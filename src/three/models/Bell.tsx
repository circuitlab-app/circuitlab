import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Halo, Smoke, damp } from '../helpers'
import { Lead } from './kit'
import { useBuilt } from './shared'

/* Everything stands on a wooden board facing +z. */
const GONG: [number, number] = [-0.58, 0.12]
const GONG_R = 0.58
const GONG_Z = 0.24
const COILS_Y = [0.08, -0.3]
const COIL_X = 0.36
const DEPTH = 0.26
/** the armature swings on a flat spring at its foot */
const PIVOT: [number, number] = [0.8, -0.6]
/** the hammer's ball, relative to the pivot, and how far the arm turns before it hits the gong */
const BALL: [number, number] = [-0.66, 1.02]
const HIT = 0.108
const CONTACT_Y = 0.27

const BRASS = { color: '#e8bd5a', metalness: 0.55, roughness: 0.22 } as const
const IRON = { color: '#8d939b', metalness: 0.6, roughness: 0.4 } as const

/** The gong's dome, a raised ring near the middle and a rolled lip, turned to face +z. */
function gongGeometry() {
  const profile: [number, number][] = [
    [GONG_R - 0.035, -0.012],
    [GONG_R, 0],
    [GONG_R - 0.015, 0.045],
    [0.5, 0.115],
    [0.4, 0.19],
    [0.28, 0.245],
    [0.17, 0.275],
    [0.13, 0.282],
    [0.12, 0.3],
    [0.08, 0.31],
    [0, 0.312],
  ]
  const points = profile.map(([r, h]) => new THREE.Vector2(r, h))
  return new THREE.LatheGeometry(points, 64).rotateX(Math.PI / 2)
}

/** Varnished wood with its grain, for the board's face. */
function grainTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#8f5130'
  ctx.fillRect(0, 0, 256, 128)
  // the same grain every time
  let seed = 7
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 0; i < 46; i++) {
    const y = random() * 128
    const wave = 2 + random() * 5
    ctx.strokeStyle = random() > 0.5 ? 'rgba(60,28,12,0.22)' : 'rgba(190,120,70,0.16)'
    ctx.lineWidth = 0.6 + random() * 1.8
    ctx.beginPath()
    for (let x = 0; x <= 256; x += 8) ctx.lineTo(x, y + Math.sin(x / 40 + i) * wave)
    ctx.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** A slotted brass screw head on the board. */
function Screw({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, 0.012]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1]}>
        <sphereGeometry args={[0.045, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, 0, 0.04]} rotation={[0, 0, 0.7]}>
        <boxGeometry args={[0.08, 0.012, 0.012]} />
        <meshStandardMaterial color="#5c4a1e" roughness={0.6} />
      </mesh>
    </group>
  )
}

/** A brass terminal: washer and a knurled nut that clamps the wire. */
function Terminal({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, 0]}>
      <mesh position={[0, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.03, 24]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, 0, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.09, 14]} />
        <meshStandardMaterial {...BRASS} flatShading />
      </mesh>
      <mesh position={[0, 0, 0.122]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.01, 12]} />
        <meshStandardMaterial color="#b88f3a" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  )
}

/** How far the hammer has swung toward the gong (0..1) at a point in its cycle. */
function swing(u: number) {
  if (u < 0.3) return (u / 0.3) ** 2 // pulled in faster and faster
  if (u < 0.4) return 1 // resting on the gong
  const k = (u - 0.4) / 0.6
  return 1 - k * k * (3 - 2 * k) // the spring carries it back
}

/**
 * A classroom electric bell. Current makes the two red coils a magnet that
 * pulls the iron arm, so the hammer hits the brass gong. That pulls the arm's
 * spring off the contact screw, the current stops, the arm springs back,
 * touches the screw again... so the hammer strikes again and again.
 */
export function BellModel({ ring, hot }: { ring: number; hot: boolean }) {
  const gong = useBuilt(gongGeometry)
  const grain = useMemo(() => grainTexture(), [])
  useEffect(() => () => grain.dispose(), [grain])
  const arm = useRef<THREE.Group>(null)
  const dome = useRef<THREE.Group>(null)
  const domeMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const wave = useRef<THREE.Mesh>(null)
  const coils = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const amp = useRef(0)
  const phase = useRef(0)
  const shiver = useRef(0)
  const age = useRef(1)
  const glint = useRef(0)
  const spark = useRef(0)
  const heat = useRef(0)

  useFrame(({ clock }, dt) => {
    const r = Number.isFinite(ring) ? THREE.MathUtils.clamp(ring, 0, 1.5) : 0
    const ringing = r > 0.05
    amp.current = damp(amp.current, ringing ? 1 : 0, 9, dt)
    const loud = 0.55 + 0.45 * Math.min(1, r)
    const before = phase.current % 1
    // a few strikes a second, so each one can be seen (a real bell buzzes faster)
    if (amp.current > 0.01) phase.current += dt * (3.6 + 2.2 * r)
    else phase.current = 0
    const u = phase.current % 1
    // the hammer lands: the gong shivers and a ring of sound leaves it
    if (ringing && amp.current > 0.6 && before < 0.3 && u >= 0.3) {
      shiver.current = loud
      age.current = 0
    }
    shiver.current = damp(shiver.current, 0, 9, dt)
    age.current = Math.min(1, age.current + dt)
    const t = clock.elapsedTime

    if (arm.current) arm.current.rotation.z = HIT * swing(u) * amp.current
    const s = shiver.current
    if (dome.current) {
      dome.current.rotation.x = Math.sin(t * 157) * 0.03 * s
      dome.current.rotation.y = Math.sin(t * 131 + 1) * 0.03 * s
    }
    if (domeMaterial.current) domeMaterial.current.emissiveIntensity = s * 0.22
    glint.current = s * 0.75
    if (wave.current) {
      const k = age.current / 0.32
      wave.current.visible = k < 1 && amp.current > 0.5
      wave.current.scale.setScalar(1.03 + k * 0.17)
      ;(wave.current.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.55 * loud
    }
    // the contact sparks a little each time it opens
    spark.current = amp.current * Math.max(0, 1 - Math.abs(u - 0.1) * 14) * 0.7

    heat.current = damp(heat.current, hot ? 1 : 0, 1.5, dt)
    for (const m of coils.current) if (m) m.emissiveIntensity = heat.current * (0.4 + Math.sin(t * 5) * 0.1)
  })

  return (
    <group position={[0.0, 0.0, 0]} rotation={[-0.08, -0.32, 0]}>
      {/* the wooden board, its screws and the two terminals */}
      <RoundedBox args={[2.5, 1.68, 0.12]} radius={0.03} smoothness={2} position={[0, 0, -0.06]}>
        <meshStandardMaterial color="#7a4226" roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0, 0.0015]}>
        <planeGeometry args={[2.44, 1.62]} />
        <meshStandardMaterial map={grain} roughness={0.45} />
      </mesh>
      {[
        [-1.1, 0.7],
        [1.1, 0.7],
        [-1.1, -0.7],
        [1.1, -0.7],
      ].map(([x, y]) => (
        <Screw key={`${x}${y}`} x={x} y={y} />
      ))}
      <Terminal x={-0.95} y={-0.64} />
      <Terminal x={-0.45} y={-0.64} />
      <Lead points={[[-0.45, -0.64, 0.1], [-0.1, -0.6, 0.06], [0.12, -0.48, 0.12], [0.16, -0.32, 0.2]]} radius={0.018} color="#1f2328" />
      <Lead points={[[-0.95, -0.64, 0.1], [-0.6, -0.76, 0.05], [0.4, -0.78, 0.04], [1.05, -0.62, 0.05], [1.05, -0.4, 0.06]]} radius={0.018} color="#dc2626" />

      {/* the gong on its post, with a domed nut in the middle */}
      <group position={[GONG[0], GONG[1], 0]}>
        <mesh position={[0, 0, GONG_Z / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, GONG_Z, 12]} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
        <group ref={dome} position={[0, 0, GONG_Z]}>
          <mesh geometry={gong}>
            <meshStandardMaterial ref={domeMaterial} {...BRASS} emissive="#fff1c2" emissiveIntensity={0} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.05, 6]} />
            <meshStandardMaterial color="#cfd3d8" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.355]} rotation={[Math.PI / 2, 0, 0]}>
            <sphereGeometry args={[0.055, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#dfe3e8" metalness={0.75} roughness={0.22} />
          </mesh>
        </group>
        <mesh ref={wave} position={[0, 0, GONG_Z + 0.02]} visible={false}>
          <torusGeometry args={[GONG_R, 0.012, 6, 72]} />
          <meshBasicMaterial color="#fcd34d" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      <Halo color="#fff3c4" intensity={glint} position={[-0.07, 0.38, GONG_Z + 0.06]} scale={0.7} />

      {/* the electromagnet: an iron yoke, two red coils and their poles */}
      <mesh position={[0.1, -0.07, DEPTH]}>
        <boxGeometry args={[0.06, 0.66, 0.18]} />
        <meshStandardMaterial {...IRON} />
      </mesh>
      <mesh position={[0.1, -0.07, DEPTH / 2 - 0.02]}>
        <boxGeometry args={[0.16, 0.5, DEPTH - 0.04]} />
        <meshStandardMaterial {...IRON} />
      </mesh>
      {COILS_Y.map((y, i) => (
        <group key={y} position={[COIL_X, y, DEPTH]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.15, 0.15, 0.38, 32]} />
            <meshStandardMaterial
              ref={(m) => {
                coils.current[i] = m
              }}
              color="#c42a2f"
              roughness={0.62}
              emissive="#ff5a1a"
              emissiveIntensity={0}
            />
          </mesh>
          {[-0.12, 0.12].map((h) => (
            <mesh key={h} position={[0, h, 0]}>
              <cylinderGeometry args={[0.152, 0.152, 0.012, 32]} />
              <meshStandardMaterial color="#9b1c22" roughness={0.65} />
            </mesh>
          ))}
          {[-0.205, 0.205].map((h) => (
            <mesh key={h} position={[0, h, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.03, 32]} />
              <meshStandardMaterial color="#26211d" roughness={0.6} />
            </mesh>
          ))}
          <mesh position={[0, -0.24, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.04, 20]} />
            <meshStandardMaterial {...IRON} />
          </mesh>
        </group>
      ))}

      {/* the arm: an iron plate on a flat spring, carrying the hammer and the contact spring */}
      <mesh position={[PIVOT[0], PIVOT[1] - 0.13, DEPTH / 2]}>
        <boxGeometry args={[0.16, 0.12, DEPTH]} />
        <meshStandardMaterial {...IRON} />
      </mesh>
      <mesh position={[PIVOT[0], PIVOT[1] - 0.035, DEPTH]}>
        <boxGeometry args={[0.012, 0.09, 0.14]} />
        <meshStandardMaterial color="#c0c6ce" metalness={0.8} roughness={0.25} />
      </mesh>
      <group ref={arm} position={[PIVOT[0], PIVOT[1], DEPTH]}>
        <mesh position={[0, 0.44, 0]}>
          <boxGeometry args={[0.05, 0.84, 0.17]} />
          <meshStandardMaterial {...IRON} />
        </mesh>
        <mesh position={[0.032, CONTACT_Y, 0]}>
          <boxGeometry args={[0.012, 0.3, 0.06]} />
          <meshStandardMaterial color="#c9a24f" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[(0 + BALL[0]) / 2, (0.84 + BALL[1]) / 2, 0]} rotation={[0, 0, Math.atan2(BALL[1] - 0.84, BALL[0]) - Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, Math.hypot(BALL[0], BALL[1] - 0.84), 8]} />
          <meshStandardMaterial color="#c3c8cf" metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[BALL[0], BALL[1], 0]}>
          <sphereGeometry args={[0.07, 20, 14]} />
          <meshStandardMaterial color="#9ba1aa" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* the contact screw on its brass pillar, with a lock nut */}
      <group position={[1.04, PIVOT[1] + CONTACT_Y, 0]}>
        <mesh position={[0, 0, DEPTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.065, DEPTH + 0.04, 16]} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
        <mesh position={[-0.1, 0, DEPTH]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.2, 10]} />
          <meshStandardMaterial color="#c3c8cf" metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[-0.075, 0, DEPTH]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.03, 6]} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
        <mesh position={[0.08, 0, DEPTH]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.04, 18]} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
      </group>
      <Halo color="#bfe3ff" intensity={spark} position={[PIVOT[0] + 0.04, PIVOT[1] + CONTACT_Y, DEPTH + 0.06]} scale={0.45} />
      <Smoke active={hot} position={[COIL_X, 0.25, DEPTH]} rise={0.4} />
    </group>
  )
}
