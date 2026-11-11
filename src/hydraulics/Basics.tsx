import { useMemo, useRef, useState, type ReactNode } from 'react'
import type { BodyId, HydroCardId } from '@/i18n/hydraulics/types'
import { Chips, LabCard, Range, useTime } from '@/telecom/Waves'
import {
  ATM,
  BAR,
  depthPressure,
  float,
  FLUIDS,
  fromLpm,
  G,
  hammer,
  jack,
  jet,
  pipeLoss,
  regimeOf,
  reynolds,
  frictionFactor,
  siphon,
  venturi,
  type FluidId,
} from './model'
import { AMBER, bars, DEEP, GREEN, RED, useHydraulicsBook, WATER } from './ui'

/* The laws of fluids: eleven cards, each a live drawing with its law and where it shows up at home. */

function Card({ id, index, ...rest }: { id: HydroCardId; index: number; visual: ReactNode; controls?: ReactNode; formulas: string[]; readouts?: [string, string][] }) {
  const { book } = useHydraulicsBook()
  return <LabCard anchor={`hydro-${id}`} index={index} {...book.basics.cards[id]} whyLabel={book.why} {...rest} />
}

/** An arrow from one point to another. */
export function Arrow({ x1, y1, x2, y2, color, width = 3 }: { x1: number; y1: number; x2: number; y2: number; color: string; width?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const h = 5 + width * 1.5
  const wing = (da: number) => `${x2 - h * Math.cos(a + da)},${y2 - h * Math.sin(a + da)}`
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - h * 0.7 * Math.cos(a)} y2={y2 - h * 0.7 * Math.sin(a)} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${wing(0.5)} ${wing(-0.5)}`} fill={color} />
    </g>
  )
}

const fluidChips = (names: Record<FluidId, string>, ids: FluidId[]) => ids.map((id) => ({ id, label: names[id] }))

/* ───────────────────────── 1 · pressure and depth ───────────────────────── */

function Pressure() {
  const { book, num } = useHydraulicsBook()
  const L = book.basics.labels
  const [depth, setDepth] = useState(3)
  const [fluid, setFluid] = useState<FluidId>('water')
  const { color, rho } = FLUIDS[fluid]
  const p = depthPressure(rho, depth)
  const y = 34 + (depth / 40) * 150
  const push = Math.min(40, 8 + Math.sqrt(p.gauge / BAR) * 9)
  const atms = p.absolute / ATM
  return (
    <Card
      id="pressure"
      index={1}
      formulas={['p = ρ · g · h', '10 m ≈ 1 bar']}
      visual={
        <svg viewBox="0 0 600 220" className="w-full" role="img" aria-label={book.basics.cards.pressure.title}>
          <defs>
            <linearGradient id="hydro-depth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={0.25} />
              <stop offset="1" stopColor={color} stopOpacity={0.95} />
            </linearGradient>
          </defs>
          <rect x={50} y={30} width={340} height={180} rx={4} fill="url(#hydro-depth)" />
          <line x1={50} x2={390} y1={30} y2={30} stroke={color} strokeWidth={3} />
          {[0, 10, 20, 30, 40].map((m) => (
            <g key={m}>
              <line x1={42} x2={50} y1={34 + (m / 40) * 150} y2={34 + (m / 40) * 150} stroke="currentColor" />
              <text x={38} y={38 + (m / 40) * 150} textAnchor="end" className="tel-annot__tiny">
                {m} m
              </text>
            </g>
          ))}
          <line x1={50} x2={390} y1={y} y2={y} stroke="white" strokeOpacity={0.6} strokeDasharray="4 4" />
          <Arrow x1={220} y1={y - 16 - push} x2={220} y2={y - 16} color="white" />
          <Arrow x1={220} y1={y + 16 + push} x2={220} y2={y + 16} color="white" />
          <Arrow x1={204 - push} y1={y} x2={204} y2={y} color="white" />
          <Arrow x1={236 + push} y1={y} x2={236} y2={y} color="white" />
          <text x={220} y={y + 8} textAnchor="middle" fontSize={22}>
            🤿
          </text>
          {/* one square for every atmosphere on the diver */}
          {Array.from({ length: Math.min(20, Math.ceil(atms)) }, (_, k) => {
            const share = Math.min(1, atms - k)
            return (
              <g key={k} transform={`translate(${430 + (k % 5) * 30} ${150 - Math.floor(k / 5) * 30})`}>
                <rect width={26} height={26} rx={5} fill="none" stroke="currentColor" strokeOpacity={0.3} />
                <rect y={26 * (1 - share)} width={26} height={26 * share} rx={5} fill={k === 0 ? '#94a3b8' : color} />
              </g>
            )
          })}
          <text x={503} y={198} textAnchor="middle" className="tel-annot__small">
            {bars(p.absolute)}
          </text>
          <text x={503} y={212} textAnchor="middle" className="tel-annot__tiny">
            ■ = 1 atm
          </text>
        </svg>
      }
      controls={
        <>
          <Range label={L.depth} value={depth} shown={`${num(depth, 1)} m`} min={0} max={40} step={0.5} onChange={setDepth} />
          <Chips value={fluid} options={fluidChips(book.fluids, ['water', 'sea', 'oil', 'mercury'])} onChange={setFluid} />
        </>
      }
      readouts={[
        [L.gauge, bars(p.gauge)],
        [L.absolute, bars(p.absolute)],
        [L.onPalm, `${num((p.gauge * 0.01) / G)} kg`],
        ['ρ', `${rho} kg/m³`],
      ]}
    />
  )
}

/* ───────────────────────── 2 · Pascal's jack ───────────────────────── */

function Pascal() {
  const { book, num } = useHydraulicsBook()
  const L = book.basics.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 30)
  const [push, setPush] = useState(200)
  const [small, setSmall] = useState(20)
  const [large, setLarge] = useState(200)
  const j = jack(push, small / 1000, large / 1000)
  const kg = j.force / G
  const w1 = 14 + small * 0.9
  const w2 = 40 + large * 0.42
  const stroke = 30 * (1 - Math.cos(t * 1.6))
  const y1 = 62 + stroke
  const y2 = 118 - Math.max(1.2, stroke / j.gain)
  const x1 = 110 - w1 / 2
  const x2 = 300
  const OIL = '#d4a017'
  return (
    <Card
      id="pascal"
      index={2}
      formulas={['p = F₁ / A₁ = F₂ / A₂', 'F₂ = F₁ · (D₂ / D₁)²']}
      visual={
        <svg ref={box} viewBox="0 0 600 220" className="w-full" role="img" aria-label={book.basics.cards.pascal.title}>
          <g fill={OIL} fillOpacity={0.75}>
            <rect x={x1} y={y1} width={w1} height={200 - y1} />
            <rect x={x2} y={y2} width={w2} height={200 - y2} />
            <rect x={x1} y={172} width={x2 + w2 - x1} height={28} />
          </g>
          <path
            d={`M${x1} 40 V200 H${x2 + w2} V40 M${x1 + w1} 40 V172 H${x2} V40`}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <rect x={x1 + 1.5} y={y1 - 10} width={w1 - 3} height={10} fill="currentColor" />
          <rect x={110 - 3} y={y1 - 34} width={6} height={24} fill="currentColor" />
          <rect x={x2 + 1.5} y={y2 - 10} width={w2 - 3} height={10} fill="currentColor" />
          <Arrow x1={110} y1={y1 - 70} x2={110} y2={y1 - 38} color={RED} width={4} />
          <text x={110} y={18} textAnchor="middle" className="tel-annot__small">
            F₁ = {num(push)} N
          </text>
          <text x={x2 + w2 / 2} y={y2 - 16} textAnchor="middle" fontSize={34}>
            {kg >= 6000 ? '🚚' : kg >= 900 ? '🚗' : kg >= 120 ? '🏍️' : kg >= 40 ? '🧍' : '📦'}
          </text>
          <text x={x2 + w2 / 2} y={22} textAnchor="middle" className="tel-annot__small">
            F₂ = {num(j.force)} N ≈ {num(kg)} kg
          </text>
          <text x={(x1 + x2 + w2) / 2} y={191} textAnchor="middle" className="tel-annot__small" style={{ fill: 'white' }}>
            p = {bars(j.pressure)}
          </text>
        </svg>
      }
      controls={
        <>
          <Range label={L.push} value={push} shown={`${num(push)} N ≈ ${num(push / G)} kg`} min={20} max={500} step={10} onChange={setPush} />
          <Range label={L.small} value={small} shown={`${num(small)} mm`} min={10} max={50} step={1} onChange={setSmall} />
          <Range label={L.large} value={large} shown={`${num(large)} mm`} min={60} max={400} step={10} onChange={setLarge} />
        </>
      }
      readouts={[
        [L.lifts, `${num(kg)} kg`],
        [L.gain, `× ${num(j.gain, 1)}`],
        [L.pressure, bars(j.pressure)],
        [L.travel, `${num(j.gain / 100, 2)} m`],
      ]}
    />
  )
}

/* ───────────────────────── 3 · buoyancy ───────────────────────── */

const BODIES: Record<BodyId, { rho: number; emoji: string; color: string }> = {
  ship: { rho: 250, emoji: '🚢', color: '#64748b' },
  wood: { rho: 600, emoji: '🪵', color: '#a16207' },
  ice: { rho: 917, emoji: '🧊', color: '#bae6fd' },
  person: { rho: 985, emoji: '🏊', color: '#fbbf24' },
  egg: { rho: 1035, emoji: '🥚', color: '#fde68a' },
  brick: { rho: 1900, emoji: '🧱', color: '#b45309' },
  steel: { rho: 7850, emoji: '⚙️', color: '#475569' },
}
const BODY_IDS = Object.keys(BODIES) as BodyId[]

function Buoyancy() {
  const { book, num } = useHydraulicsBook()
  const L = book.basics.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 30)
  const [body, setBody] = useState<BodyId>('ice')
  const [fluid, setFluid] = useState<FluidId>('water')
  const b = BODIES[body]
  const f = FLUIDS[fluid]
  const state = float(b.rho, f.rho)
  const size = 76
  const top = state.floats ? 70 - size * (1 - state.submerged) + Math.sin(t * 2) * 2.5 : 200 - size
  const lift = state.floats ? 44 : 44 * (f.rho / b.rho)
  return (
    <Card
      id="buoyancy"
      index={3}
      formulas={['F = ρ · g · V', 'ρ_body < ρ_fluid ⇒ ↑']}
      visual={
        <svg ref={box} viewBox="0 0 600 220" className="w-full" role="img" aria-label={book.basics.cards.buoyancy.title}>
          <rect x={130} y={70} width={340} height={130} fill={f.color} fillOpacity={0.5} />
          <path d="M130 30 V200 H470 V30" fill="none" stroke="currentColor" strokeWidth={3} />
          <path d={`M130 70 ${Array.from({ length: 18 }, (_, k) => `q 5 ${k % 2 ? 3 : -3} 9.45 0 t 9.45 0`).join(' ')}`} fill="none" stroke={f.color} strokeWidth={2.5} />
          <g style={{ transition: 'transform 0.6s cubic-bezier(.3,1.4,.5,1)', transform: `translateY(${top}px)` }}>
            <rect x={262} width={size} height={size} rx={10} fill={b.color} stroke="currentColor" strokeOpacity={0.5} strokeWidth={2} />
            <text x={300} y={size / 2 + 12} textAnchor="middle" fontSize={34}>
              {b.emoji}
            </text>
            <Arrow x1={352} y1={size / 2} x2={352} y2={size / 2 + 44} color={RED} width={4} />
            <Arrow x1={370} y1={size / 2} x2={370} y2={size / 2 - lift} color={GREEN} width={4} />
          </g>
          <text x={140} y={24} className="tel-annot__tiny" style={{ fill: RED }}>
            ↓ m·g
          </text>
          <text x={185} y={24} className="tel-annot__tiny" style={{ fill: GREEN }}>
            ↑ ρ·g·V
          </text>
        </svg>
      }
      controls={
        <>
          <Chips value={body} options={BODY_IDS.map((id) => ({ id, label: `${BODIES[id].emoji} ${book.basics.bodies[id]}` }))} onChange={setBody} />
          <Chips value={fluid} options={fluidChips(book.fluids, ['water', 'sea', 'brine', 'oil', 'mercury'])} onChange={setFluid} />
        </>
      }
      readouts={[
        [book.basics.bodies[body], `${b.rho} kg/m³`],
        [book.fluids[fluid], `${f.rho} kg/m³`],
        [state.floats ? L.floats : L.sinks, state.floats ? '✓' : '⚓'],
        state.floats ? [L.submerged, `${num(state.submerged * 100)}%`] : [L.feels, `${num(state.apparent * 100)}%`],
      ]}
    />
  )
}

/* ───────────────────────── 3, 4 · a pipe with a narrow throat ───────────────────────── */

const half = (x: number, R: number, r: number) => (x < 200 || x > 400 ? R : x < 250 ? R + ((r - R) * (x - 200)) / 50 : x <= 350 ? r : r + ((R - r) * (x - 350)) / 50)

/** A pipe from x = 20 to 580 that narrows in the middle, with dots riding the water: slow where wide, fast where narrow. */
function Duct({ cy, R, share, speed, t }: { cy: number; R: number; share: number; speed: number; t: number }) {
  const r = R * share
  // the time (at the wide part's speed) water needs to reach each x
  const table = useMemo(() => {
    const cum = [0]
    for (let x = 25; x <= 580; x += 5) cum.push(cum[cum.length - 1] + 5 * (half(x, 1, share) ** 2))
    return cum
  }, [share])
  const total = table[table.length - 1]
  const dots = []
  for (let row = -1; row <= 1; row++) {
    for (let k = 0; k < 14; k++) {
      const time = (t * speed + ((k + (row ? 0.5 : 0)) * total) / 14) % total
      let i = 0
      while (table[i + 1] < time) i++
      const x = 20 + 5 * (i + (time - table[i]) / (table[i + 1] - table[i]))
      dots.push(<circle key={`${row}:${k}`} cx={x} cy={cy + row * half(x, R, r) * 0.55} r={2.6} fill="white" />)
    }
  }
  const edge = (s: number) => `20,${cy + s * R} 200,${cy + s * R} 250,${cy + s * r} 350,${cy + s * r} 400,${cy + s * R} 580,${cy + s * R}`
  return (
    <g>
      <polygon points={`${edge(-1)} ${edge(1).split(' ').reverse().join(' ')}`} fill={WATER} fillOpacity={0.75} />
      <polyline points={edge(-1)} fill="none" stroke="currentColor" strokeWidth={3} />
      <polyline points={edge(1)} fill="none" stroke="currentColor" strokeWidth={3} />
      {dots}
    </g>
  )
}

const WIDE_MM = 40

function Continuity() {
  const { book, num } = useHydraulicsBook()
  const L = book.basics.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 40)
  const [flow, setFlow] = useState(25)
  const [d2, setD2] = useState(20)
  const v = venturi(fromLpm(flow), WIDE_MM / 1000, d2 / 1000)
  const len = (speed: number) => Math.min(150, 14 + speed * 26)
  return (
    <Card
      id="continuity"
      index={4}
      formulas={['Q = A · v', 'v₂ / v₁ = (D₁ / D₂)²']}
      visual={
        <svg ref={box} viewBox="0 0 600 200" className="w-full" role="img" aria-label={book.basics.cards.continuity.title}>
          <Duct cy={85} R={42} share={d2 / WIDE_MM} speed={30 + v.v1 * 130} t={t} />
          <Arrow x1={40} y1={160} x2={40 + len(v.v1)} y2={160} color={GREEN} width={4} />
          <text x={40} y={184} className="tel-annot__small">
            v₁ = {num(v.v1, 2)} m/s
          </text>
          <Arrow x1={250} y1={160} x2={250 + len(v.v2)} y2={160} color={RED} width={4} />
          <text x={250} y={184} className="tel-annot__small">
            v₂ = {num(v.v2, 2)} m/s
          </text>
          <text x={110} y={20} textAnchor="middle" className="tel-annot__tiny">
            ⌀ {WIDE_MM} mm
          </text>
          <text x={300} y={20} textAnchor="middle" className="tel-annot__tiny">
            ⌀ {d2} mm
          </text>
        </svg>
      }
      controls={
        <>
          <Range label={L.flow} value={flow} shown={`${num(flow)} L/min`} min={5} max={60} step={1} onChange={setFlow} />
          <Range label={L.narrow} value={d2} shown={`${num(d2)} mm`} min={10} max={40} step={1} onChange={setD2} />
        </>
      }
      readouts={[
        [L.speedWide, `${num(v.v1, 2)} m/s`],
        [L.speedNarrow, `${num(v.v2, 2)} m/s`],
        ['v₂ / v₁', `× ${num(v.v2 / v.v1, 1)}`],
        [L.flow, `${num(flow)} L/min`],
      ]}
    />
  )
}

function Bernoulli() {
  const { book, num } = useHydraulicsBook()
  const L = book.basics.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 40)
  const [flow, setFlow] = useState(30)
  const [d2, setD2] = useState(14)
  const v = venturi(fromLpm(flow), WIDE_MM / 1000, d2 / 1000)
  // the wide part holds 12 kPa: a column 110 px tall
  const scale = 110 / 12_000
  const R = 26
  const cy = 165
  const column = (x: number, pa: number, r: number) => {
    const h = Math.max(0, pa * scale)
    const foot = cy - r
    return (
      <g key={x}>
        <rect x={x - 7} y={foot - h} width={14} height={h} fill={WATER} fillOpacity={0.8} />
        <path d={`M${x - 7} ${foot} V14 M${x + 7} ${foot} V14`} stroke="currentColor" strokeWidth={2} fill="none" />
        {pa < 0 ? <Arrow x1={x} y1={foot - 60} x2={x} y2={foot - 6} color={RED} /> : null}
        <text x={x + 12} y={Math.min(foot - 6, foot - h + 4)} className="tel-annot__tiny">
          {num(pa / 1000, 1)} kPa
        </text>
      </g>
    )
  }
  return (
    <Card
      id="bernoulli"
      index={5}
      formulas={['p + ½ρv² = const', 'Δp = ½ρ (v₂² − v₁²)']}
      visual={
        <svg ref={box} viewBox="0 0 600 200" className="w-full" role="img" aria-label={book.basics.cards.bernoulli.title}>
          <Duct cy={cy} R={R} share={d2 / WIDE_MM} speed={30 + v.v1 * 130} t={t} />
          {column(110, 12_000, R)}
          {column(300, 12_000 - v.drop, (R * d2) / WIDE_MM)}
          {column(490, 12_000, R)}
        </svg>
      }
      controls={
        <>
          <Range label={L.flow} value={flow} shown={`${num(flow)} L/min`} min={5} max={60} step={1} onChange={setFlow} />
          <Range label={L.narrow} value={d2} shown={`${num(d2)} mm`} min={10} max={40} step={1} onChange={setD2} />
        </>
      }
      readouts={[
        [L.speedWide, `${num(v.v1, 2)} m/s`],
        [L.speedNarrow, `${num(v.v2, 2)} m/s`],
        [L.drop, `${num(v.drop / 1000, 1)} kPa`],
        ['p₂', `${num((12_000 - v.drop) / 1000, 1)} kPa`],
      ]}
    />
  )
}

/* ───────────────────────── 6 · Torricelli ───────────────────────── */

function Torricelli() {
  const { book, num } = useHydraulicsBook()
  const L = book.basics.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 30)
  const [level, setLevel] = useState(2.4)
  const [share, setShare] = useState(30)
  const hole = (level * share) / 100
  const j = jet(level, hole)
  const S = 58
  const ground = 200
  const yh = ground - hole * S
  const fall = Math.sqrt((2 * hole) / G)
  const path = Array.from({ length: 25 }, (_, k) => {
    const tau = (k / 24) * fall
    return `${k ? 'L' : 'M'}${(150 + j.speed * tau * S).toFixed(1)},${(yh + 0.5 * G * tau * tau * S).toFixed(1)}`
  }).join('')
  return (
    <Card
      id="torricelli"
      index={6}
      formulas={['v = √(2 g h)', 'x = 2 √(h · y)']}
      visual={
        <svg ref={box} viewBox="0 0 440 220" className="w-full" role="img" aria-label={book.basics.cards.torricelli.title}>
          <rect x={40} y={ground - level * S} width={110} height={level * S} fill={WATER} fillOpacity={0.7} />
          <path d={`M40 14 V${ground} H150 V${yh + 4} M150 ${yh - 4} V14`} fill="none" stroke="currentColor" strokeWidth={3} />
          <line x1={20} x2={430} y1={ground} y2={ground} stroke="currentColor" strokeWidth={2} />
          {[1, 2, 3, 4].map((m) => (
            <g key={m}>
              <line x1={150 + m * S} x2={150 + m * S} y1={ground} y2={ground + 5} stroke="currentColor" />
              <text x={150 + m * S} y={ground + 16} textAnchor="middle" className="tel-annot__tiny">
                {m} m
              </text>
            </g>
          ))}
          <path d={path} fill="none" stroke={WATER} strokeWidth={5} strokeLinecap="round" />
          <path d={path} fill="none" stroke="white" strokeWidth={2} strokeDasharray="3 12" strokeDashoffset={-t * (40 + j.speed * 25)} strokeLinecap="round" />
          <line x1={152} x2={164} y1={ground - (level / 2) * S} y2={ground - (level / 2) * S} stroke={AMBER} strokeWidth={2} strokeDasharray="3 2" />
          <text x={168} y={ground - (level / 2) * S + 3} className="tel-annot__tiny" style={{ fill: AMBER }}>
            ★ {L.best}
          </text>
          <line x1={150 + level * S} x2={150 + level * S} y1={ground - 8} y2={ground} stroke={AMBER} strokeWidth={2} />
          <text x={30} y={yh + 3} textAnchor="end" className="tel-annot__tiny">
            {num(hole, 2)}
          </text>
          <text x={95} y={ground - level * S - 6} textAnchor="middle" className="tel-annot__tiny">
            {num(level, 1)} m
          </text>
        </svg>
      }
      controls={
        <>
          <Range label={L.level} value={level} shown={`${num(level, 1)} m`} min={0.5} max={3} step={0.1} onChange={setLevel} />
          <Range label={L.hole} value={share} shown={`${num(hole, 2)} m`} min={5} max={95} step={1} onChange={setShare} />
        </>
      }
      readouts={[
        [L.speed, `${num(j.speed, 2)} m/s`],
        [L.range, `${num(j.range, 2)} m`],
        [`★ ${L.best}`, `${num(level / 2, 2)} m → ${num(level, 1)} m`],
        ['h', `${num(level - hole, 2)} m`],
      ]}
    />
  )
}

/* ───────────────────────── 7 · Reynolds ───────────────────────── */

function Reynolds() {
  const { book, num } = useHydraulicsBook()
  const L = book.basics.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 30)
  const [knob, setKnob] = useState(35)
  const [mm, setMm] = useState('20')
  const [fluid, setFluid] = useState<FluidId>('water')
  const v = 0.01 * 300 ** (knob / 100)
  const f = FLUIDS[fluid]
  const re = reynolds(f.rho, v, Number(mm) / 1000, f.mu)
  const regime = regimeOf(re)
  // 0 while laminar, 1 when fully turbulent
  const wild = Math.max(0, Math.min(1, (re - 2300) / 1700))
  const cy = 105
  const R = 55
  const profile = (u: number) => (1 - wild) * (1 - u * u) + wild * (1 - Math.abs(u)) ** (1 / 7)
  let dye = `M200,${cy}`
  for (let x = 204; x <= 580; x += 4) {
    const grow = Math.min(1, (x - 200) / 180)
    const wobble = Math.sin(x * 0.09 - t * 9) * 0.5 + Math.sin(x * 0.23 + t * 14) * 0.3 + Math.sin(x * 0.051 - t * 5) * 0.4
    dye += `L${x},${(cy + wild * grow * wobble * R * 0.75).toFixed(1)}`
  }
  return (
    <Card
      id="reynolds"
      index={7}
      formulas={['Re = ρ v D / μ', 'Re < 2300 · Re > 4000']}
      visual={
        <svg ref={box} viewBox="0 0 600 200" className="w-full" role="img" aria-label={book.basics.cards.reynolds.title}>
          <rect x={20} y={cy - R} width={560} height={2 * R} fill={f.color} fillOpacity={0.3} />
          <line x1={20} x2={580} y1={cy - R} y2={cy - R} stroke="currentColor" strokeWidth={3} />
          <line x1={20} x2={580} y1={cy + R} y2={cy + R} stroke="currentColor" strokeWidth={3} />
          {[-0.85, -0.6, -0.3, 0, 0.3, 0.6, 0.85].map((u) => (
            <Arrow key={u} x1={40} y1={cy + u * R} x2={52 + profile(u) * 95} y2={cy + u * R} color={DEEP} width={2.5} />
          ))}
          <path d={`M40,${cy - R} ${[-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1].map((u) => `L${46 + profile(u) * 101},${cy + u * R}`).join(' ')} L40,${cy + R}`} fill="none" stroke={DEEP} strokeDasharray="3 3" />
          <path d={`M180,${cy - R - 16} V${cy} H200`} fill="none" stroke="currentColor" strokeWidth={2} />
          <path d={dye} fill="none" stroke={RED} strokeWidth={2.5 + wild * 5} strokeOpacity={1 - wild * 0.5} strokeLinecap="round" strokeLinejoin="round" />
          <text x={300} y={190} textAnchor="middle" className="tel-annot__small">
            Re = {num(re)} · {book.basics.regimes[regime]}
          </text>
        </svg>
      }
      controls={
        <>
          <Range label="v" value={knob} shown={`${num(v, 2)} m/s`} min={0} max={100} step={1} onChange={setKnob} />
          <Chips value={mm} options={['10', '20', '50'].map((id) => ({ id, label: `\u200E⌀ ${id} mm` }))} onChange={setMm} />
          <Chips value={fluid} options={fluidChips(book.fluids, ['water', 'oil', 'honey'])} onChange={setFluid} />
        </>
      }
      readouts={[
        [L.reynolds, num(re)],
        [L.regime, book.basics.regimes[regime]],
        [L.friction, `f = ${num(frictionFactor(re), 3)}`],
        ['μ', `${f.mu} Pa·s`],
      ]}
    />
  )
}

/* ───────────────────────── 8 · friction ───────────────────────── */

export function Dial({ x, y, share, text }: { x: number; y: number; share: number; text: string }) {
  const a = (-120 + 240 * Math.max(0, Math.min(1, share))) * (Math.PI / 180)
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={26} fill="var(--card)" stroke="currentColor" strokeWidth={2.5} />
      {[0, 0.25, 0.5, 0.75, 1].map((s) => {
        const b = (-120 + 240 * s) * (Math.PI / 180)
        return <line key={s} x1={20 * Math.sin(b)} y1={-20 * Math.cos(b)} x2={24 * Math.sin(b)} y2={-24 * Math.cos(b)} stroke="currentColor" />
      })}
      <line x2={19 * Math.sin(a)} y2={-19 * Math.cos(a)} stroke={RED} strokeWidth={2.5} strokeLinecap="round" style={{ transition: 'all 0.3s' }} />
      <circle r={3} fill="currentColor" />
      <text y={42} textAnchor="middle" className="tel-annot__small">
        {text}
      </text>
    </g>
  )
}

const INLET = 3 * BAR

function Friction() {
  const { book, num } = useHydraulicsBook()
  const L = book.basics.labels
  const [flow, setFlow] = useState(20)
  const [length, setLength] = useState(30)
  const [mm, setMm] = useState('16')
  const loss = pipeLoss(fromLpm(flow), Number(mm) / 1000, length)
  const left = Math.max(0, INLET - loss.drop)
  const Y = (pa: number) => 96 - (pa / INLET) * 70
  // where along the pipe the pressure runs out
  const reach = Math.min(1, INLET / Math.max(loss.drop, 1))
  const x1 = 90 + 420 * reach
  const thick = 4 + Number(mm) * 0.45
  return (
    <Card
      id="friction"
      index={8}
      formulas={['h = f · (L/D) · v²/2g', 'Δp ∝ Q² / D⁵']}
      visual={
        <svg viewBox="0 0 600 220" className="w-full" role="img" aria-label={book.basics.cards.friction.title}>
          <polygon points={`90,${Y(INLET)} ${x1},${Y(left)} ${x1},${Y(0)} 90,${Y(0)}`} fill={WATER} fillOpacity={0.25} />
          <line x1={90} x2={510} y1={Y(0)} y2={Y(0)} className="tel-scope__axis" />
          <line x1={90} y1={Y(INLET)} x2={x1} y2={Y(left)} stroke={reach < 1 ? RED : DEEP} strokeWidth={3} />
          <text x={300} y={18} textAnchor="middle" className="tel-annot__tiny">
            p(x)
          </text>
          <line x1={90} x2={510} y1={128} y2={128} stroke="currentColor" strokeWidth={thick + 4} strokeLinecap="round" />
          <line x1={90} x2={510} y1={128} y2={128} stroke={WATER} strokeWidth={thick} strokeLinecap="round" />
          <line x1={90} x2={510} y1={128} y2={128} className="wire-flow" strokeLinecap="round" style={{ stroke: 'white', strokeWidth: 3, strokeDasharray: '1 17', animationDuration: `${Math.max(0.12, 0.9 / (0.3 + loss.v))}s` }} />
          <text x={300} y={156} textAnchor="middle" className="tel-annot__small">
            {num(length)} m · ⌀ {mm} mm · {num(loss.v, 1)} m/s
          </text>
          <Dial x={45} y={96} share={1} text={bars(INLET)} />
          <Dial x={555} y={96} share={left / INLET} text={bars(left)} />
        </svg>
      }
      controls={
        <>
          <Range label={L.flow} value={flow} shown={`${num(flow)} L/min`} min={2} max={40} step={1} onChange={setFlow} />
          <Range label={L.length} value={length} shown={`${num(length)} m`} min={5} max={100} step={5} onChange={setLength} />
          <Chips value={mm} options={['13', '16', '20', '25', '32'].map((id) => ({ id, label: `\u200E⌀ ${id} mm` }))} onChange={setMm} />
        </>
      }
      readouts={[
        [L.loss, bars(Math.min(loss.drop, INLET * 99))],
        [L.left, bars(left)],
        [L.regime, book.basics.regimes[regimeOf(loss.re)]],
        [L.friction, `f = ${num(loss.f, 3)}`],
      ]}
    />
  )
}

/* ───────────────────────── 9 · siphon ───────────────────────── */

function Siphon() {
  const { book, num } = useHydraulicsBook()
  const L = book.basics.labels
  const [crest, setCrest] = useState(1.5)
  const [fall, setFall] = useState(1)
  const s = siphon(crest, fall)
  const surface = 118
  const top = surface - 18 - crest * 6.6
  const out = surface + 14 + fall * 22
  const tube = `M150,176 V${top + 12} Q150,${top} 162,${top} H258 Q270,${top} 270,${top + 12} V${out}`
  return (
    <Card
      id="siphon"
      index={9}
      formulas={['v = √(2 g Δh)', 'h_max ≈ p_atm / ρg ≈ 10 m']}
      visual={
        <svg viewBox="0 0 600 230" className="w-full" role="img" aria-label={book.basics.cards.siphon.title}>
          <rect x={40} y={surface} width={170} height={70} fill={WATER} fillOpacity={0.7} />
          <path d={`M40 ${surface - 22} V188 H210 V${surface - 22}`} fill="none" stroke="currentColor" strokeWidth={3} />
          <rect x={235} y={210} width={110} height={12} fill={WATER} fillOpacity={0.7} />
          <path d="M235 196 V222 H345 V196" fill="none" stroke="currentColor" strokeWidth={3} />
          <path d={tube} fill="none" stroke="currentColor" strokeOpacity={0.55} strokeWidth={11} />
          <path d={tube} fill="none" stroke={s.works ? WATER : 'var(--card)'} strokeWidth={7} />
          {s.works ? (
            <>
              <path d={tube} fill="none" className="wire-flow" strokeLinecap="round" style={{ stroke: 'white', strokeWidth: 3, strokeDasharray: '1 17', animationDuration: `${Math.max(0.12, 0.8 / s.speed)}s` }} />
              <line x1={270} x2={270} y1={out} y2={212} stroke={WATER} strokeWidth={5} strokeDasharray="6 4" />
            </>
          ) : (
            <>
              <path d={`M150,176 V${Math.max(top + 12, surface - 10.1 * 6.6)}`} stroke={WATER} strokeWidth={7} fill="none" />
              <text x={210} y={top - 6} textAnchor="middle" fontSize={16}>
                🫧
              </text>
            </>
          )}
          {/* how high the wall is, and how far the outlet is below the surface */}
          <line x1={150} x2={420} y1={surface} y2={surface} stroke="currentColor" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Arrow x1={380} y1={surface} x2={380} y2={top} color={AMBER} width={2} />
          <text x={388} y={(surface + top) / 2 + 4} className="tel-annot__small" style={{ fill: AMBER }}>
            {num(crest, 1)} m
          </text>
          <Arrow x1={380} y1={surface} x2={380} y2={out} color={GREEN} width={2} />
          <text x={388} y={(surface + out) / 2 + 6} className="tel-annot__small" style={{ fill: GREEN }}>
            Δh = {num(fall, 1)} m
          </text>
          <text x={470} y={40} className="tel-annot__small" style={{ fill: s.works ? GREEN : RED }}>
            {s.works ? `✓ ${num(s.speed, 1)} m/s` : '✕'}
          </text>
          <text x={470} y={58} className="tel-annot__tiny">
            p = {bars(s.crestPressure)}
          </text>
        </svg>
      }
      controls={
        <>
          <Range label={L.crest} value={crest} shown={`${num(crest, 1)} m`} min={0.5} max={12} step={0.5} onChange={setCrest} />
          <Range label={L.fall} value={fall} shown={`${num(fall, 1)} m`} min={0.2} max={3} step={0.1} onChange={setFall} />
        </>
      }
      readouts={[
        [L.speed, s.works ? `${num(s.speed, 2)} m/s` : '0 m/s'],
        [L.crestPressure, bars(s.crestPressure)],
        [L.limit, `${num(s.limit, 1)} m`],
        [s.works ? L.runs : L.broken, s.works ? '✓' : '✕'],
      ]}
    />
  )
}

/* ───────────────────────── 10 · water hammer ───────────────────────── */

function Hammer() {
  const { book, num } = useHydraulicsBook()
  const L = book.basics.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 40)
  const [v, setV] = useState(2)
  const [length, setLength] = useState(30)
  const [knob, setKnob] = useState(0)
  const [shutAt, setShutAt] = useState<number | null>(null)
  const closing = 0.01 * 200 ** (knob / 100)
  const h = hammer(v, length, closing)
  // slow motion: the wave crosses the pipe in 0.7 s on screen, and rings for 6 s
  const since = shutAt === null ? -1 : t - shutAt
  const ringing = since >= 0 && since < 6
  const lap = 0.7
  const phase = ringing ? (since / lap) % 2 : 0
  const front = 520 - 490 * (phase < 1 ? phase : 2 - phase)
  const fade = Math.exp(-since / 2.2)
  const k = 52 / (998 * 1200 * 3)
  const wave = (tau: number) => h.surge * Math.exp(-tau / 2.2) * Math.sign(Math.cos((Math.PI * tau) / (2 * lap) - 0.001)) * (tau < 0 ? 0 : 1)
  let trace = `M30,150 H${ringing ? 90 : 570}`
  if (ringing) for (let i = 0; i <= 240; i++) {
    const tau = (i / 240) * 6
    if (tau > since) break
    trace += `L${(90 + i * 2).toFixed(0)},${(150 - wave(tau) * k).toFixed(1)}`
  }
  return (
    <Card
      id="hammer"
      index={10}
      formulas={['Δp = ρ · c · v', 't < 2L / c']}
      visual={
        <svg ref={box} viewBox="0 0 600 220" className="w-full" role="img" aria-label={book.basics.cards.hammer.title}>
          <line x1={30} x2={520} y1={50} y2={50} stroke="currentColor" strokeWidth={26} />
          <line x1={30} x2={520} y1={50} y2={50} stroke={WATER} strokeWidth={20} />
          {ringing ? (
            <rect x={Math.min(front, 520) - 0} y={40} width={Math.max(0, 520 - front)} height={20} fill={RED} fillOpacity={Math.min(0.9, (h.surge / 3.6e6) * fade + 0.15 * fade)} />
          ) : (
            <line x1={30} x2={520} y1={50} y2={50} className="wire-flow" strokeLinecap="round" style={{ stroke: 'white', strokeWidth: 3, strokeDasharray: '1 17', animationDuration: `${0.6 / v}s` }} />
          )}
          <g transform="translate(535 50)">
            <path d="M-12 -14 L12 14 V-14 L-12 14 Z" fill={ringing ? RED : GREEN} stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
            <line y1={-14} y2={-26} stroke="currentColor" strokeWidth={3} />
            <line x1={-10} x2={10} y1={-26} y2={-26} stroke="currentColor" strokeWidth={4} strokeLinecap="round" transform={ringing ? 'rotate(90 0 -26)' : undefined} />
          </g>
          <text x={275} y={22} textAnchor="middle" className="tel-annot__tiny">
            {num(length)} m · c ≈ 1200 m/s
          </text>
          <line x1={30} x2={570} y1={150} y2={150} className="tel-scope__axis" />
          {[1, -1].map((s) => (
            <line key={s} x1={30} x2={570} y1={150 - s * h.surge * k} y2={150 - s * h.surge * k} stroke={RED} strokeDasharray="4 4" strokeOpacity={0.5} />
          ))}
          <path d={trace} fill="none" stroke={AMBER} strokeWidth={2.5} strokeLinejoin="round" />
          <text x={34} y={150 - h.surge * k - 5} className="tel-annot__tiny" style={{ fill: RED }}>
            +{bars(h.surge)}
          </text>
          <text x={566} y={212} textAnchor="end" className="tel-annot__tiny">
            p(t)
          </text>
        </svg>
      }
      controls={
        <>
          <Range label="v" value={v} shown={`${num(v, 1)} m/s`} min={0.5} max={3} step={0.1} onChange={setV} />
          <Range label={L.length} value={length} shown={`${num(length)} m`} min={5} max={200} step={5} onChange={setLength} />
          <Range label={L.closing} value={knob} shown={closing < 1 ? `${num(closing * 1000)} ms` : `${num(closing, 1)} s`} min={0} max={100} step={1} onChange={setKnob} />
          <button type="button" onClick={() => setShutAt(t)} className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground">
            🔧 {L.close}
          </button>
        </>
      }
      readouts={[
        [L.surge, bars(h.surge)],
        [L.critical, `${num(h.critical * 1000)} ms`],
        [L.peak, bars(INLET + h.surge)],
        [L.closing, closing <= h.critical ? '⚠︎ < 2L/c' : '✓ > 2L/c'],
      ]}
    />
  )
}

/* ───────────────────────── 11 · water and electricity ───────────────────────── */

function Analogy() {
  const { book, num } = useHydraulicsBook()
  const L = book.basics.labels
  const [push, setPush] = useState(5)
  const [open, setOpen] = useState(60)
  const ohms = 500 / open
  const amps = push / ohms
  const flow = { strokeDasharray: '1 17', animationDuration: `${Math.max(0.1, 0.5 / amps)}s` }
  const loop = (x: number) => `M${x} 170 V50 H${x + 220} V170 Z`
  return (
    <Card
      id="analogy"
      index={11}
      formulas={['Q = Δp / R', 'I = V / R']}
      visual={
        <svg viewBox="0 0 600 220" className="w-full" role="img" aria-label={book.basics.cards.analogy.title}>
          {/* the water loop */}
          <path d={loop(40)} fill="none" stroke="currentColor" strokeWidth={14} strokeLinejoin="round" />
          <path d={loop(40)} fill="none" stroke={WATER} strokeWidth={9} strokeLinejoin="round" />
          <path d={loop(40)} fill="none" className="wire-flow" strokeLinecap="round" style={{ ...flow, stroke: 'white', strokeWidth: 3 }} />
          <circle cx={40} cy={110} r={20} fill="var(--card)" stroke="currentColor" strokeWidth={3} />
          <path d="M30 118 L40 98 L50 118 Z" fill={DEEP} />
          <g transform="translate(260 110)">
            <rect x={-12} y={-18} width={24} height={36} fill="var(--card)" />
            <path d="M-13 -17 L13 -17 L-13 17 L13 17 Z" fill={AMBER} stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
            <rect x={-13} y={-2} width={26 * (1 - open / 100)} height={4} fill="currentColor" />
          </g>
          <text x={150} y={22} textAnchor="middle" className="tel-annot__small">
            💧 {L.water}
          </text>
          <text x={150} y={105} textAnchor="middle" className="tel-annot__small">
            Δp = {num(push, 1)} bar
          </text>
          <text x={150} y={125} textAnchor="middle" className="tel-annot__small" style={{ fill: DEEP }}>
            Q = {num(amps * 10, 1)} L/min
          </text>
          {/* the circuit */}
          <path d={loop(340)} fill="none" stroke="#b45309" strokeWidth={5} strokeLinejoin="round" />
          <path d={loop(340)} fill="none" className="wire-flow" strokeLinecap="round" style={flow} />
          <rect x={326} y={94} width={28} height={32} fill="var(--card)" />
          <line x1={322} x2={358} y1={100} y2={100} stroke="currentColor" strokeWidth={3} />
          <line x1={330} x2={350} y1={110} y2={110} stroke="currentColor" strokeWidth={5} />
          <rect x={548} y={80} width={24} height={60} fill="var(--card)" />
          <path d="M560 78 l-9 6 l18 9 l-18 9 l18 9 l-18 9 l18 9 l-9 6" fill="none" stroke={AMBER} strokeWidth={3} strokeLinejoin="round" />
          <text x={450} y={22} textAnchor="middle" className="tel-annot__small">
            ⚡ {L.electric}
          </text>
          <text x={450} y={105} textAnchor="middle" className="tel-annot__small">
            V = {num(push, 1)} V
          </text>
          <text x={450} y={125} textAnchor="middle" className="tel-annot__small" style={{ fill: '#b45309' }}>
            I = {num(amps, 2)} A
          </text>
          <text x={450} y={196} textAnchor="middle" className="tel-annot__tiny">
            R = {num(ohms, 1)} Ω
          </text>
          <text x={150} y={196} textAnchor="middle" className="tel-annot__tiny">
            {num(open)}%
          </text>
        </svg>
      }
      controls={
        <>
          <Range label={L.pressure} value={push} shown={`${num(push, 1)} bar ↔ ${num(push, 1)} V`} min={1} max={10} step={0.5} onChange={setPush} />
          <Range label={L.valve} value={open} shown={`${num(open)}% ↔ ${num(ohms, 1)} Ω`} min={10} max={100} step={5} onChange={setOpen} />
        </>
      }
      readouts={[
        [`💧 Q`, `${num(amps * 10, 1)} L/min`],
        [`⚡ I`, `${num(amps, 2)} A`],
      ]}
    />
  )
}

export function Basics() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <Pressure />
        <Pascal />
        <Buoyancy />
        <Continuity />
        <Bernoulli />
        <Torricelli />
        <Reynolds />
        <Friction />
        <Siphon />
        <Hammer />
        <Analogy />
      </div>
    </div>
  )
}
