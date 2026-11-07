import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Halo, Smoke, damp } from '../helpers'
import { Lead, Rod } from './kit'
import { METAL, merge, useBuilt } from './shared'

/* Heights from the bottom of the mounting flange, which stands on the table. */
const FLANGE_H = 0.06
const BASE_TOP = 0.32
/** the lens sits on a rubber gasket on top of the base */
const LENS_Y = 0.36
const LENS_R = 0.44
/** where the lens's straight wall ends and its round top begins */
const WALL = 0.5
const LENS_H = 0.78
/** the lamp and the reflector's focus, above the bottom of the lens */
const LAMP_Y = 0.3
const RIBS = 36
const RIB_DEPTH = 0.012
/** one and three-quarter turns a second, like a real rotating beacon */
const SPIN = Math.PI * 2 * 1.75
const PLASTIC = { color: '#25262b', roughness: 0.55, metalness: 0.1 } as const

const smooth = THREE.MathUtils.smoothstep

/** The lens's outline, bottom to top: a collar that clips into the base, a straight wall and a round top. */
function lensProfile(scale = 1) {
  const points = [new THREE.Vector2(LENS_R + 0.02, 0), new THREE.Vector2(LENS_R + 0.02, 0.05)]
  for (let i = 0; i <= 6; i++) {
    const t = i / 6
    points.push(new THREE.Vector2(LENS_R - 0.025 * t, 0.07 + (WALL - 0.07) * t))
  }
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * (Math.PI / 2)
    points.push(new THREE.Vector2((LENS_R - 0.025) * Math.cos(a), WALL + (LENS_H - WALL) * Math.sin(a)))
  }
  return points.map((p) => new THREE.Vector2(p.x * scale, p.y))
}

/** The polycarbonate lens with fine vertical ribs up its wall that fade out over the top. */
function lensGeometry() {
  const g = new THREE.LatheGeometry(lensProfile(), RIBS * 4)
  const position = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const r = Math.hypot(x, z)
    if (r < 1e-4) continue
    const rib = smooth(y, 0.08, 0.12) * (1 - smooth(y, WALL + 0.04, WALL + 0.2))
    const phi = Math.atan2(x, z)
    const k = 1 + (RIB_DEPTH * rib * Math.abs(Math.cos((RIBS * phi) / 2))) / r
    position.setXYZ(i, x * k, y, z * k)
  }
  g.computeVertexNormals()
  // the seam where the lathe closes goes to the back
  return g.rotateY(Math.PI)
}

/** A parabolic mirror opening toward +x, with the lamp at its focus (the origin). */
function reflectorGeometry() {
  const focus = 0.07
  const points: THREE.Vector2[] = []
  for (let i = 0; i <= 10; i++) {
    const r = 0.005 + (0.2 * i) / 10
    points.push(new THREE.Vector2(r, (r * r) / (4 * focus)))
  }
  return new THREE.LatheGeometry(points, 32).rotateZ(-Math.PI / 2).translate(-focus, 0, 0)
}

/** Where the beam hits the lens: a patch of the lens's own shape, brightest in the middle. */
function spotGeometry() {
  const profile = lensProfile(1.03)
  const columns = 24
  const width = 0.8
  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []
  profile.forEach((p) => {
    for (let j = 0; j <= columns; j++) {
      const phi = -width + (2 * width * j) / columns
      positions.push(p.x * Math.cos(phi), p.y, p.x * Math.sin(phi))
      const v = Math.exp(-((phi / 0.32) ** 2)) * Math.exp(-(((p.y - LAMP_Y) / 0.2) ** 2))
      colors.push(v, v, v, v)
    }
  })
  for (let i = 0; i < profile.length - 1; i++) {
    for (let j = 0; j < columns; j++) {
      const a = i * (columns + 1) + j
      const c = a + columns + 1
      indices.push(a, c, a + 1, a + 1, c, c + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4))
  g.setIndex(indices)
  return g
}

/**
 * The beam itself, leaving the lens along +x: two crossed sheets that widen and
 * fade as they go, and fade to nothing at their edges, so it reads as soft light.
 */
function beamGeometry() {
  const length = 0.8
  const along = 6
  const across = 8
  const sheet = (vertical: boolean) => {
    const positions: number[] = []
    const colors: number[] = []
    const indices: number[] = []
    for (let i = 0; i <= along; i++) {
      const t = i / along
      const half = 0.12 + 0.2 * t
      for (let j = 0; j <= across; j++) {
        const s = (j / across) * 2 - 1
        positions.push(LENS_R - 0.02 + length * t, vertical ? s * half : 0, vertical ? 0 : s * half)
        // alpha as well as colour: the canvas is see-through, so a dim part must not darken the page behind it
        const v = (1 - t) ** 1.3 * (1 - s * s) ** 1.5
        colors.push(v, v, v, v)
      }
    }
    for (let i = 0; i < along; i++) {
      for (let j = 0; j < across; j++) {
        const a = i * (across + 1) + j
        const c = a + across + 1
        indices.push(a, c, a + 1, a + 1, c, c + 1)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4))
    g.setIndex(indices)
    return g
  }
  return merge([sheet(false), sheet(true)])
}

/** Three screws hold the flange down: two at the front, one at the back. */
const SCREWS = [60, 180, 300].map((d) => {
  const a = (d * Math.PI) / 180
  return { x: Math.sin(a) * 0.59, z: Math.cos(a) * 0.59, turn: a * 0.7 }
})

/**
 * A rotating warning beacon, like the one on a tow truck's roof or on top of a
 * machine: a dark base screwed down by its flange, carrying a coloured, ribbed
 * lens. Inside, a mirror spins round the lamp and throws a bright beam that
 * sweeps round and round, flashing each time it faces you.
 */
export function BeaconModel({ color, level, burnt }: { color: string; level: number; burnt: boolean }) {
  const lens = useBuilt(lensGeometry)
  const reflector = useBuilt(reflectorGeometry)
  const spot = useBuilt(spotGeometry)
  const beam = useBuilt(beamGeometry)

  const spinner = useRef<THREE.Group>(null)
  const lensOuter = useRef<THREE.MeshStandardMaterial>(null)
  const lensInner = useRef<THREE.MeshStandardMaterial>(null)
  const mirror = useRef<THREE.MeshStandardMaterial>(null)
  const lamp = useRef<THREE.MeshStandardMaterial>(null)
  const spotMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const beamMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  const brightness = useRef(0)
  const omega = useRef(0)
  const angle = useRef(-0.6)
  const flash = useRef(0)
  const glow = useRef(0)

  const { lit, off, hot } = useMemo(() => {
    const c = new THREE.Color(color)
    return {
      lit: c,
      // switched off, the lens is a darker tint of its colour; burnt, it is smoked almost black
      off: burnt ? c.clone().lerp(new THREE.Color('#202024'), 0.82) : c.clone().lerp(new THREE.Color('#1c1917'), 0.3),
      hot: c.clone().lerp(new THREE.Color('#ffffff'), 0.55),
    }
  }, [color, burnt])

  useFrame((_, dt) => {
    const target = burnt ? 0 : Math.min(1.3, Math.max(0, Number.isFinite(level) ? level : 0))
    // the LEDs switch on at once; the little motor takes a moment to spin up and coast down
    brightness.current = damp(brightness.current, target, 16, dt)
    omega.current = damp(omega.current, target > 0.02 ? SPIN : 0, 2.5, dt)
    angle.current = (angle.current + omega.current * dt) % (Math.PI * 2)
    if (spinner.current) spinner.current.rotation.y = angle.current
    const b = brightness.current
    const on = Math.min(1, b)
    // how squarely the beam faces you (you are along +z)
    const facing = Math.max(0, -Math.sin(angle.current))
    const f2 = facing * facing
    for (const m of [lensOuter.current, lensInner.current]) {
      if (!m) continue
      m.emissiveIntensity = b * (0.3 + 0.55 * f2)
      m.opacity = (burnt ? 0.78 : 0.55) + on * 0.2
    }
    if (mirror.current) mirror.current.emissiveIntensity = b * 1.3
    if (lamp.current) lamp.current.emissiveIntensity = 0.05 + b * 5
    if (spotMaterial.current) spotMaterial.current.opacity = on * (0.75 + 0.25 * f2)
    if (beamMaterial.current) beamMaterial.current.opacity = on * 0.8 * (1 - 0.5 * f2)
    if (light.current) light.current.intensity = b * 3
    flash.current = b * (0.05 + 1.15 * f2 * facing)
    glow.current = b * 0.4
  })

  return (
    <group position={[0, -0.58, 0]}>
      {/* the mounting flange and its screws */}
      <mesh position={[0, FLANGE_H / 2, 0]}>
        <cylinderGeometry args={[0.66, 0.68, FLANGE_H, 48]} />
        <meshStandardMaterial {...PLASTIC} />
      </mesh>
      {SCREWS.map(({ x, z, turn }) => (
        <group key={turn} position={[x, FLANGE_H, z]} rotation={[0, turn, 0]}>
          <mesh position={[0, 0.012, 0]}>
            <cylinderGeometry args={[0.042, 0.045, 0.024, 16]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <boxGeometry args={[0.062, 0.006, 0.012]} />
            <meshStandardMaterial color="#3f3f46" />
          </mesh>
        </group>
      ))}
      {/* the base: the motor and the LED driver are inside */}
      <mesh position={[0, (FLANGE_H + BASE_TOP) / 2, 0]}>
        <cylinderGeometry args={[0.47, 0.51, BASE_TOP - FLANGE_H, 48]} />
        <meshStandardMaterial {...PLASTIC} />
      </mesh>
      <mesh position={[0, FLANGE_H + 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.51, 0.014, 8, 48]} />
        <meshStandardMaterial {...PLASTIC} roughness={0.45} />
      </mesh>
      <mesh position={[0, (BASE_TOP + LENS_Y) / 2, 0]}>
        <cylinderGeometry args={[0.475, 0.475, LENS_Y - BASE_TOP, 48]} />
        <meshStandardMaterial color="#111113" roughness={0.85} />
      </mesh>

      {/* the cable: red to +, black to − */}
      <mesh position={[0, 0.17, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.08, 16]} />
        <meshStandardMaterial color="#141416" roughness={0.7} />
      </mesh>
      {([-1, 1] as const).map((side) => {
        const end: [number, number, number] = [side * 1.0, 0.025, -0.08]
        return (
          <group key={side}>
            <Lead
              points={[[side * 0.025, 0.17, -0.5], [side * 0.18, 0.12, -0.72], [side * 0.6, 0.04, -0.76], [side * 0.9, 0.025, -0.44], end]}
              radius={0.024}
              color={side < 0 ? '#dc2626' : '#18181b'}
            />
            <Rod from={end} to={[side * 1.03, 0.025, 0.06]} radius={0.012} color="#b8bcc4" />
          </group>
        )
      })}

      <group position={[0, LENS_Y, 0]}>
        {/* the lamp on its post in the middle */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.045, 0.06, 0.24, 16]} />
          <meshStandardMaterial color="#3a3b40" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, LAMP_Y, 0]}>
          <capsuleGeometry args={[0.055, 0.1, 6, 16]} />
          <meshStandardMaterial
            ref={lamp}
            color={burnt ? '#1c1917' : '#fafafa'}
            emissive={hot}
            emissiveIntensity={0.05}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>

        {/* the mirror turning round the lamp, the bright spot it throws on the lens and the beam beyond */}
        <group ref={spinner}>
          <mesh position={[0, 0.035, 0]}>
            <cylinderGeometry args={[0.27, 0.27, 0.025, 40]} />
            <meshStandardMaterial color="#4a4b52" roughness={0.45} metalness={0.4} />
          </mesh>
          <mesh position={[-0.075, 0.075, 0]}>
            <boxGeometry args={[0.03, 0.06, 0.1]} />
            <meshStandardMaterial color="#4a4b52" roughness={0.45} metalness={0.4} />
          </mesh>
          <group position={[0, LAMP_Y, 0]}>
            {/* outside: plain metal; inside: the mirror, glowing with the lamp */}
            <mesh geometry={reflector}>
              <meshStandardMaterial color="#8d939b" metalness={0.6} roughness={0.35} side={THREE.FrontSide} />
            </mesh>
            <mesh geometry={reflector}>
              <meshStandardMaterial
                ref={mirror}
                color={burnt ? '#57534e' : '#eef0f3'}
                metalness={0.5}
                roughness={0.15}
                emissive={lit}
                emissiveIntensity={0}
                side={THREE.BackSide}
                toneMapped={false}
              />
            </mesh>
          </group>
          <mesh geometry={spot} renderOrder={2}>
            <meshBasicMaterial
              ref={spotMaterial}
              color={hot}
              vertexColors
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          <mesh geometry={beam} position={[0, LAMP_Y, 0]} renderOrder={4}>
            <meshBasicMaterial
              ref={beamMaterial}
              color={lit}
              vertexColors
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          <pointLight ref={light} position={[0.8, LAMP_Y, 0]} color={lit} intensity={0} distance={2.4} decay={1.4} />
          <Halo color={color} intensity={flash} position={[LENS_R + 0.05, LAMP_Y, 0]} scale={1.8} />
        </group>

        {/* the lens: its far side first, then its near side, so you see through it */}
        <mesh geometry={lens} renderOrder={1}>
          <meshStandardMaterial
            ref={lensInner}
            color={off}
            emissive={lit}
            emissiveIntensity={0}
            transparent
            opacity={0.55}
            roughness={0.25}
            depthWrite={false}
            side={THREE.BackSide}
            toneMapped={false}
          />
        </mesh>
        <mesh geometry={lens} renderOrder={3}>
          <meshStandardMaterial
            ref={lensOuter}
            color={off}
            emissive={lit}
            emissiveIntensity={0}
            transparent
            opacity={0.55}
            roughness={0.18}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <Halo color={color} intensity={glow} position={[0, LAMP_Y, 0.2]} scale={1.6} />
      </group>
      <Smoke active={burnt} position={[0, LENS_Y + LENS_H - 0.08, 0]} rise={0.24} />
    </group>
  )
}
