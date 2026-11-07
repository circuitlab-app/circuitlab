import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Halo, Smoke, damp } from '../helpers'
import { Rod, SidePin } from './kit'
import { METAL, useBuilt } from './shared'

/* The beam runs along +x at y = 0, from the lens to the middle of the card. */
const LENS_X = -0.4
const CARD_X = 0.96
const CARD = 0.76
/** the card is turned partly toward you, so the beam meets it at a slant */
const CARD_TURN = 0.8
const BARREL_R = 0.17
const BOARD_TOP = -BARREL_R
const BOARD_X = -1.0

const BRASS = { color: '#cfa24a', metalness: 0.65, roughness: 0.3 } as const
const SOOT = '#3b2f24'

/** The focus thread at the front of the brass head: a zig-zag turned round the beam's axis. */
function threadGeometry() {
  const points: THREE.Vector2[] = []
  const from = -0.62
  const to = LENS_X
  const steps = 16
  for (let i = 0; i <= steps; i++) {
    points.push(new THREE.Vector2(i % 2 === 0 ? BARREL_R - 0.012 : BARREL_R + 0.004, from + ((to - from) * i) / steps))
  }
  // turned round y, then laid along x
  return new THREE.LatheGeometry(points, 40).rotateZ(-Math.PI / 2)
}

/** A printed paper target: rings, a red bullseye and the ring scores. */
function targetTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2
  ctx.fillStyle = '#fbf8f1'
  ctx.fillRect(0, 0, size, size)
  // crop marks in the corners
  ctx.strokeStyle = '#9ca3af'
  ctx.lineWidth = 2
  for (const [x, y, dx, dy] of [
    [10, 10, 1, 1],
    [246, 10, -1, 1],
    [10, 246, 1, -1],
    [246, 246, -1, -1],
  ]) {
    ctx.beginPath()
    ctx.moveTo(x + dx * 14, y)
    ctx.lineTo(x, y)
    ctx.lineTo(x, y + dy * 14)
    ctx.stroke()
  }
  ctx.fillStyle = '#1f2937'
  ctx.beginPath()
  ctx.arc(c, c, 74, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#1f2937'
  ctx.lineWidth = 3
  for (const r of [112, 93]) {
    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.strokeStyle = '#f8fafc'
  for (const r of [55, 36]) {
    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = '#dc2626'
  ctx.beginPath()
  ctx.arc(c, c, 17, 0, Math.PI * 2)
  ctx.fill()
  ctx.font = '600 15px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ;[
    [102, '6', '#1f2937'],
    [83, '7', '#1f2937'],
    [64, '8', '#f8fafc'],
    [45, '9', '#f8fafc'],
  ].forEach(([r, label, color]) => {
    ctx.fillStyle = color as string
    ctx.fillText(label as string, c + (r as number), c)
    ctx.fillText(label as string, c - (r as number), c)
  })
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/**
 * A KY-008 red laser module: a little black board with a brass laser head.
 * When it is on, a thin red beam crosses to a paper target and makes a bright
 * dot on the bullseye. Too much current burns the laser diode out.
 */
export function LaserModel({ level, burnt }: { level: number; burnt: boolean }) {
  const thread = useBuilt(threadGeometry)
  const target = useMemo(() => targetTexture(), [])
  useEffect(() => () => target.dispose(), [target])
  const bright = useRef(0)
  const dotGlow = useRef(0)
  const lensGlow = useRef(0)
  const beam = useRef<THREE.MeshBasicMaterial>(null)
  const beamHaze = useRef<THREE.MeshBasicMaterial>(null)
  const dot = useRef<THREE.MeshBasicMaterial>(null)
  const lens = useRef<THREE.MeshStandardMaterial>(null)

  useFrame((_, dt) => {
    // a laser diode switches on at once
    bright.current = damp(bright.current, burnt ? 0 : Math.min(1.3, Math.max(0, level)), 22, dt)
    const b = bright.current
    const on = Math.min(1, b)
    if (beam.current) beam.current.opacity = on * 0.42
    if (beamHaze.current) beamHaze.current.opacity = on * 0.1
    if (dot.current) dot.current.opacity = Math.min(1, b * 1.6)
    if (lens.current) lens.current.emissiveIntensity = b * 2.4
    dotGlow.current = b * 0.85
    lensGlow.current = b * 0.45
  })

  const beamLength = CARD_X - LENS_X - 0.012
  const barrel = burnt ? { ...BRASS, color: SOOT, metalness: 0.3, roughness: 0.8 } : BRASS

  return (
    <group position={[0.22, 0.04, 0]} rotation={[0.36, 0.3, 0]}>
      {/* the black KY-008 board */}
      <RoundedBox args={[1.0, 0.06, 0.8]} radius={0.015} smoothness={2} position={[BOARD_X, BOARD_TOP - 0.03, 0]}>
        <meshStandardMaterial color="#141417" roughness={0.6} metalness={0.1} />
      </RoundedBox>
      {/* silk outline of the head and the pin marks */}
      {[
        [BOARD_X + 0.2, 0.25, 0.6, 0.012],
        [BOARD_X + 0.2, -0.25, 0.6, 0.012],
      ].map(([x, z, w, d]) => (
        <mesh key={z} position={[x, BOARD_TOP + 0.002, z]}>
          <boxGeometry args={[w, 0.003, d]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[BOARD_X - 0.36, BOARD_TOP + 0.002, 0.25]}>
        <boxGeometry args={[0.05, 0.003, 0.012]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.7} />
      </mesh>
      {/* "S" pin gets a little square */}
      <mesh position={[BOARD_X - 0.36, BOARD_TOP + 0.002, -0.25]}>
        <boxGeometry args={[0.05, 0.003, 0.05]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.7} />
      </mesh>
      {/* its resistor */}
      <group position={[BOARD_X - 0.24, BOARD_TOP + 0.022, -0.02]}>
        <mesh>
          <boxGeometry args={[0.08, 0.04, 0.13]} />
          <meshStandardMaterial color="#1c1c1f" roughness={0.5} />
        </mesh>
        {[-0.07, 0.07].map((z) => (
          <mesh key={z} position={[0, 0, z]}>
            <boxGeometry args={[0.082, 0.042, 0.03]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
        ))}
      </group>
      {/* header pins out of the back edge */}
      {[-0.22, 0, 0.22].map((z) => (
        <SidePin key={z} x={BOARD_X - 0.5} y={BOARD_TOP - 0.03} z={z} direction={-1} length={0.2} />
      ))}

      {/* the laser head: the diode's can at the back, a brass barrel, the focus thread and the lens */}
      <mesh position={[-1.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 0.08, 28]} />
        <meshStandardMaterial color={burnt ? SOOT : '#c7ccd3'} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* the diode's legs bend down into the board */}
      {[-0.05, 0.05].map((z) => (
        <group key={z}>
          <Rod from={[-1.16, -0.02, z]} to={[-1.22, -0.02, z]} radius={0.012} />
          <Rod from={[-1.22, -0.02, z]} to={[-1.22, BOARD_TOP, z]} radius={0.012} />
        </group>
      ))}
      {[-0.05, 0.05].map((z) => (
        <mesh key={z} position={[-1.22, BOARD_TOP + 0.003, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.035, 14]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      ))}
      <mesh position={[-0.84, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[BARREL_R, BARREL_R, 0.48, 36]} />
        <meshStandardMaterial {...barrel} />
      </mesh>
      <mesh position={[-1.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[BARREL_R + 0.01, BARREL_R + 0.01, 0.03, 36]} />
        <meshStandardMaterial {...barrel} />
      </mesh>
      <mesh geometry={thread}>
        <meshStandardMaterial {...barrel} flatShading />
      </mesh>
      <mesh position={[LENS_X + 0.001, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <ringGeometry args={[0.07, BARREL_R - 0.006, 36]} />
        <meshStandardMaterial {...barrel} />
      </mesh>
      <mesh position={[LENS_X - 0.004, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.07, 28]} />
        <meshStandardMaterial
          ref={lens}
          color={burnt ? '#050505' : '#2a0b0e'}
          emissive="#ff2020"
          emissiveIntensity={0}
          roughness={0.08}
          metalness={0.2}
          toneMapped={false}
        />
      </mesh>
      <Halo color="#ff3030" intensity={lensGlow} position={[LENS_X + 0.04, 0, 0]} scale={0.5} />

      {/* the beam: a thin red line and a faint haze round it */}
      <mesh position={[LENS_X + beamLength / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={6}>
        <cylinderGeometry args={[0.011, 0.011, beamLength, 8, 1, true]} />
        <meshBasicMaterial ref={beam} color="#ff3b30" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh position={[LENS_X + beamLength / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={6}>
        <cylinderGeometry args={[0.035, 0.035, beamLength, 10, 1, true]} />
        <meshBasicMaterial ref={beamHaze} color="#ff2a1f" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>

      {/* the paper target in its wooden foot */}
      <group position={[CARD_X, 0, 0]} rotation={[0, CARD_TURN, 0]}>
        <mesh position={[0.012, 0, 0]}>
          <boxGeometry args={[0.02, CARD, CARD]} />
          <meshStandardMaterial color="#e7e2d6" roughness={0.9} />
        </mesh>
        <mesh position={[-0.0015, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[CARD, CARD]} />
          <meshStandardMaterial map={target} roughness={0.85} />
        </mesh>
        {/* the dot: stretched a little because the beam comes in at a slant */}
        <mesh position={[-0.004, 0, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[1.3, 1, 1]} renderOrder={7}>
          <circleGeometry args={[0.03, 20]} />
          <meshBasicMaterial ref={dot} color="#ffd9d4" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
        <Halo color="#ff2a1f" intensity={dotGlow} position={[-0.06, 0, 0]} scale={0.95} />
        <group position={[0.01, -CARD / 2 - 0.02, 0]}>
          <RoundedBox args={[0.2, 0.12, 0.5]} radius={0.015} smoothness={2}>
            <meshStandardMaterial color="#c08a52" roughness={0.75} />
          </RoundedBox>
          {/* the saw cut the card sits in */}
          <mesh position={[0, 0.061, 0]}>
            <boxGeometry args={[0.035, 0.002, 0.46]} />
            <meshStandardMaterial color="#5b3a1e" roughness={0.9} />
          </mesh>
          {[-0.12, 0.05, 0.17].map((z, i) => (
            <mesh key={z} position={[-0.101, 0, z]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[0.012 + i * 0.004, 0.1]} />
              <meshStandardMaterial color="#a8743f" roughness={0.85} />
            </mesh>
          ))}
        </group>
      </group>

      <Smoke active={burnt} position={[-0.9, 0.2, 0]} rise={0.4} />
    </group>
  )
}
