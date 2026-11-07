import { PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import * as THREE from 'three'

let glowTexture: THREE.Texture | null = null

/** Soft radial sprite used for halos. Generated once, no image assets. */
export function getGlowTexture() {
  if (glowTexture) return glowTexture
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.6)')
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.14)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  glowTexture = new THREE.CanvasTexture(canvas)
  glowTexture.colorSpace = THREE.SRGBColorSpace
  return glowTexture
}

export const damp = THREE.MathUtils.damp
export const DEG = Math.PI / 180

export type Framing = {
  /** where the camera sits, looking at the model's middle */
  camera?: [number, number, number]
  /** above 1 moves the camera back (the model looks smaller), below 1 moves it closer */
  scale?: number
  /** moves the camera and its aim up or down so the model sits in the middle of its window */
  lift?: number
}

/** Camera + lighting shared by every part preview. */
export function Stage({
  children,
  camera = [0, 0.55, 4.6],
  scale = 1,
  lift = 0,
  fov = 30,
}: Framing & {
  children: ReactNode
  fov?: number
}) {
  const position: [number, number, number] = [camera[0] * scale, camera[1] * scale + lift, camera[2] * scale]
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={position}
        fov={fov}
        near={0.1}
        far={50}
        onUpdate={(c) => c.lookAt(0, lift, 0)}
      />
      <ambientLight intensity={0.85} />
      <hemisphereLight args={['#ffffff', '#475569', 0.7]} />
      <directionalLight position={[2.5, 4, 5]} intensity={1.9} />
      <directionalLight position={[-3, 1.5, -2]} intensity={0.7} color="#a5b4fc" />
      {children}
    </>
  )
}

/** Additive glow sprite whose size and opacity follow `intensity`. */
export function Halo({
  color,
  intensity,
  scale = 2.6,
  position = [0, 0, 0],
  tint,
}: {
  color: string
  intensity: { current: number }
  scale?: number
  position?: [number, number, number]
  /** a colour that changes while it glows (the RGB LED); overrides `color` */
  tint?: { current: THREE.Color }
}) {
  const sprite = useRef<THREE.Sprite>(null)
  useFrame(() => {
    const s = sprite.current
    if (!s) return
    const v = intensity.current
    s.visible = v > 0.01
    s.scale.setScalar(scale * (0.45 + 0.75 * Math.min(1.6, v)))
    const material = s.material as THREE.SpriteMaterial
    material.opacity = Math.min(1, v * 0.95)
    if (tint) material.color.copy(tint.current)
  })
  return (
    <sprite ref={sprite} position={position} renderOrder={10}>
      <spriteMaterial
        map={getGlowTexture()}
        color={color}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </sprite>
  )
}

/** A few grey puffs that rise and fade: used for burnt and overheating parts. */
export function Smoke({
  active,
  position = [0, 0.6, 0],
  color = '#9ca3af',
  rise = 0.7,
}: {
  active: boolean
  position?: [number, number, number]
  color?: string
  /** how far the puffs climb before they vanish */
  rise?: number
}) {
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    g.visible = active
    if (!active) return
    g.children.forEach((child, i) => {
      const t = (clock.elapsedTime * 0.45 + i / g.children.length) % 1
      // short rise and a quick fade so the smoke is gone before it reaches the window's edge
      child.position.set(Math.sin(t * 6 + i) * 0.12, t * rise, Math.cos(t * 5 + i) * 0.05)
      child.scale.setScalar(0.1 + t * 0.24)
      ;((child as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = (1 - t) ** 2 * 0.6
    })
  })
  return (
    <group ref={group} position={position}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color={color} transparent opacity={0.4} depthWrite={false} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}
