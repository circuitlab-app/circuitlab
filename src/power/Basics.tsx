import { useRef, useState, type ReactNode } from 'react'
import type { BasicCardId } from '@/i18n/power/types'
import { Chips, LabCard, Range, sinePath, useTime } from '@/telecom/Waves'
import { acPower, generatorHz, lineVoltage, peakOf, transformer } from './model'
import { usePowerBook } from './ui'

/* AC and three-phase: six cards, each a live drawing with its law. */

const RED = '#ef4444'
const AMBER = '#e59a0b'
const BLUE = '#3b82f6'
const GREEN = '#10a37a'
const PHASES = ['#a16207', '#111827', '#9ca3af']

function Card({ id, index, ...rest }: { id: BasicCardId; index: number; visual: ReactNode; controls?: ReactNode; formulas: string[]; readouts?: [string, string][] }) {
  const { book } = usePowerBook()
  const card = book.basics.cards[id]
  return <LabCard anchor={`power-${id}`} index={index} {...card} whyLabel={book.why} {...rest} />
}

/** A trace across the box: y(u) for u in 0…1. */
function trace(fn: (u: number) => number, x0: number, w: number, mid: number, scale: number) {
  let d = ''
  for (let i = 0; i <= 240; i++) {
    const u = i / 240
    d += `${i ? 'L' : 'M'}${(x0 + u * w).toFixed(1)},${(mid - fn(u) * scale).toFixed(1)}`
  }
  return d
}

function Ac() {
  const { book, num } = usePowerBook()
  const L = book.basics.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 30)
  const [hz, setHz] = useState<'50' | '60'>('50')
  const [rms, setRms] = useState(230)
  const peak = peakOf(rms)
  const k = 70 / 340
  return (
    <Card
      id="ac"
      index={1}
      formulas={['V_peak = √2 · V_rms', 'T = 1 / f']}
      visual={
        <svg ref={box} viewBox="0 0 600 200" className="w-full" role="img" aria-label={book.basics.cards.ac.title}>
          <line x1={20} x2={590} y1={100} y2={100} className="tel-scope__axis" />
          {[peak, -peak].map((v) => (
            <line key={v} x1={20} x2={590} y1={100 - v * k} y2={100 - v * k} stroke={RED} strokeDasharray="5 5" strokeOpacity={0.6} />
          ))}
          <line x1={20} x2={590} y1={100 - rms * k} y2={100 - rms * k} stroke={GREEN} strokeDasharray="2 4" />
          <path d={sinePath(20, 590, 100, peak * k, hz === '50' ? 190 : 158, t * 2)} fill="none" stroke={AMBER} strokeWidth={3} />
          <text x={24} y={100 - peak * k - 6} className="tel-annot__tiny" fill={RED}>
            {L.peak} ±{Math.round(peak)} V
          </text>
          <text x={24} y={100 - rms * k + 14} className="tel-annot__tiny" fill={GREEN}>
            RMS {rms} V
          </text>
        </svg>
      }
      controls={
        <>
          <Range label={L.rms} value={rms} shown={`${num(rms)} V`} min={100} max={240} step={5} onChange={setRms} />
          <Chips value={hz} options={[{ id: '50', label: '50 Hz' }, { id: '60', label: '60 Hz' }]} onChange={setHz} />
        </>
      }
      readouts={[
        [L.peak, `${peak.toFixed(0)} V`],
        [L.period, `${(1000 / Number(hz)).toFixed(1)} ms`],
      ]}
    />
  )
}

function Generator() {
  const { book, num } = usePowerBook()
  const L = book.basics.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 40)
  const [rpm, setRpm] = useState(3000)
  const [poles, setPoles] = useState('2')
  const f = generatorHz(rpm, Number(poles))
  // slowed down 50× so the turning can be followed
  const angle = (t * (rpm / 60) * 360) / 50
  const theta = (angle * Math.PI) / 180
  return (
    <Card
      id="generator"
      index={2}
      formulas={['ε = −N · dΦ / dt', 'f = n · p / 120']}
      visual={
        <svg ref={box} viewBox="0 0 600 200" className="w-full" role="img" aria-label={book.basics.cards.generator.title}>
          <circle cx={100} cy={100} r={80} fill="none" stroke="currentColor" strokeOpacity={0.3} strokeWidth={10} />
          {[0, 120, 240].map((a, i) => (
            <rect key={a} x={92} y={14} width={16} height={22} rx={3} fill={PHASES[i]} transform={`rotate(${a} 100 100)`} />
          ))}
          <g transform={`rotate(${angle} 100 100)`}>
            <rect x={60} y={88} width={40} height={24} rx={4} fill={RED} />
            <rect x={100} y={88} width={40} height={24} rx={4} fill={BLUE} />
            <text x={72} y={105} fill="white" fontWeight={700}>
              N
            </text>
            <text x={114} y={105} fill="white" fontWeight={700}>
              S
            </text>
          </g>
          <line x1={210} x2={590} y1={100} y2={100} className="tel-scope__axis" />
          <path d={trace((u) => Math.sin(u * 4 * Math.PI - theta * (Number(poles) / 2)), 210, 380, 100, 70)} fill="none" stroke={AMBER} strokeWidth={3} />
        </svg>
      }
      controls={
        <>
          <Range label={L.speed} value={rpm} shown={`${num(rpm)} rpm`} min={150} max={3600} step={50} onChange={setRpm} />
          <Chips value={poles} options={['2', '4', '8', '40'].map((p) => ({ id: p, label: `${p} ${L.poles}` }))} onChange={setPoles} />
        </>
      }
      readouts={[[L.frequency, `${f.toFixed(1)} Hz`]]}
    />
  )
}

function Ohm() {
  const { book, num } = usePowerBook()
  const L = book.basics.labels
  const [volts, setVolts] = useState(230)
  const [ohms, setOhms] = useState(26)
  const amps = volts / ohms
  const watts = volts * amps
  const glow = Math.min(1, Math.log10(watts + 1) / 3.6)
  return (
    <Card
      id="ohm"
      index={3}
      formulas={['V = I · R', 'P = V · I = I² · R']}
      visual={
        <svg viewBox="0 0 600 180" className="w-full" role="img" aria-label={book.basics.cards.ohm.title}>
          <path d="M40 90 H200" stroke="currentColor" strokeWidth={4} />
          <path d="M400 90 H560" stroke="currentColor" strokeWidth={4} />
          <path d={trace((u) => (Math.floor(u * 14) % 2 ? 1 : -1) * (u > 0.02 && u < 0.98 ? 1 : 0), 200, 200, 90, 26)} fill="none" stroke={`color-mix(in oklch, ${RED} ${Math.round(glow * 100)}%, currentColor)`} strokeWidth={5} style={{ filter: `drop-shadow(0 0 ${glow * 14}px ${RED})` }} />
          <text x={300} y={150} textAnchor="middle" className="tel-annot__small">
            {Math.round(watts)} W → 🔥
          </text>
        </svg>
      }
      controls={
        <>
          <Range label={L.voltage} value={volts} shown={`${num(volts)} V`} min={1} max={240} step={1} onChange={setVolts} />
          <Range label={L.resistance} value={ohms} shown={`${num(ohms)} Ω`} min={1} max={200} step={1} onChange={setOhms} />
        </>
      }
      readouts={[
        [L.current, `${amps.toFixed(2)} A`],
        [L.power, `${watts.toFixed(0)} W`],
      ]}
    />
  )
}

function PowerFactor() {
  const { book, num } = usePowerBook()
  const L = book.basics.labels
  const [phi, setPhi] = useState(37)
  const [load, setLoad] = useState<'r' | 'l' | 'c'>('l')
  const shift = load === 'r' ? 0 : load === 'l' ? phi : -phi
  const p = acPower(230, 10, Math.abs(shift))
  const rad = (shift * Math.PI) / 180
  const sx = 420
  const sy = 150
  const scale = 0.06
  return (
    <Card
      id="pf"
      index={4}
      formulas={['P = V·I·cos φ', 'Q = V·I·sin φ', 'S² = P² + Q²']}
      visual={
        <svg viewBox="0 0 600 200" className="w-full" role="img" aria-label={book.basics.cards.pf.title}>
          <line x1={10} x2={330} y1={100} y2={100} className="tel-scope__axis" />
          <path d={trace((u) => Math.sin(u * 4 * Math.PI), 10, 320, 100, 70)} fill="none" stroke={AMBER} strokeWidth={2.5} />
          <path d={trace((u) => 0.75 * Math.sin(u * 4 * Math.PI - rad), 10, 320, 100, 70)} fill="none" stroke={BLUE} strokeWidth={2.5} />
          <path d={trace((u) => 0.5 * Math.sin(u * 4 * Math.PI) * Math.sin(u * 4 * Math.PI - rad) * 1.6, 10, 320, 100, 70)} fill="none" stroke={GREEN} strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={14} y={20} className="tel-annot__tiny" fill={AMBER}>
            v
          </text>
          <text x={24} y={20} className="tel-annot__tiny" fill={BLUE}>
            i
          </text>
          <text x={34} y={20} className="tel-annot__tiny" fill={GREEN}>
            p = v·i
          </text>
          <line x1={sx} y1={sy} x2={sx + p.p * scale} y2={sy} stroke={GREEN} strokeWidth={4} />
          <line x1={sx + p.p * scale} y1={sy} x2={sx + p.p * scale} y2={sy - p.q * scale * Math.sign(shift || 1)} stroke={RED} strokeWidth={4} />
          <line x1={sx} y1={sy} x2={sx + p.p * scale} y2={sy - p.q * scale * Math.sign(shift || 1)} stroke={BLUE} strokeWidth={4} />
          <text x={sx} y={sy + 18} className="tel-annot__tiny" fill={GREEN}>
            P
          </text>
          <text x={sx + p.p * scale + 6} y={sy - (p.q * scale) / 2} className="tel-annot__tiny" fill={RED}>
            Q
          </text>
          <text x={sx + 10} y={sy - 24} className="tel-annot__tiny" fill={BLUE}>
            S
          </text>
        </svg>
      }
      controls={
        <>
          <Chips value={load} options={[{ id: 'r', label: L.resistive }, { id: 'l', label: L.inductive }, { id: 'c', label: L.capacitive }]} onChange={setLoad} />
          {load !== 'r' ? <Range label={L.angle} value={phi} shown={`${num(phi)}°`} min={0} max={85} step={1} onChange={setPhi} /> : null}
        </>
      }
      readouts={[
        [L.pf, p.pf.toFixed(2)],
        [L.real, `${Math.round(p.p)} W`],
        [L.reactive, `${Math.round(p.q)} var`],
        [L.apparent, `${Math.round(p.s)} VA`],
      ]}
    />
  )
}

function ThreePhase() {
  const { book } = usePowerBook()
  const L = book.basics.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 30)
  const w = t * 1.2
  return (
    <Card
      id="threePhase"
      index={5}
      formulas={['V_line = √3 · V_phase', 'i₁ + i₂ + i₃ = 0']}
      visual={
        <svg ref={box} viewBox="0 0 600 200" className="w-full" role="img" aria-label={book.basics.cards.threePhase.title}>
          <circle cx={100} cy={100} r={75} fill="none" className="tel-scope__mark" />
          {PHASES.map((c, k) => {
            const a = w - (k * 2 * Math.PI) / 3
            return <line key={c} x1={100} y1={100} x2={100 + 75 * Math.cos(a)} y2={100 - 75 * Math.sin(a)} stroke={c} strokeWidth={4} strokeLinecap="round" />
          })}
          <line x1={200} x2={590} y1={100} y2={100} className="tel-scope__axis" />
          {PHASES.map((c, k) => (
            <path key={c} d={trace((u) => Math.sin(u * 4 * Math.PI + w - (k * 2 * Math.PI) / 3), 200, 390, 100, 70)} fill="none" stroke={c} strokeWidth={2.5} />
          ))}
        </svg>
      }
      readouts={[
        [L.phase, '230 V'],
        [L.line, `${lineVoltage(230).toFixed(0)} V`],
      ]}
    />
  )
}

function Transformer() {
  const { book, num } = usePowerBook()
  const L = book.basics.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 30)
  const [n1, setN1] = useState(1000)
  const [n2, setN2] = useState(20)
  const { v2, i2 } = transformer(20000, 10, n1, n2)
  const coil = (x: number, turns: number, color: string) =>
    Array.from({ length: Math.min(12, Math.max(1, Math.round(Math.log2(turns + 1) * 1.4))) }, (_, k) => (
      <ellipse key={k} cx={x} cy={52 + k * 8.5} rx={30} ry={5} fill="none" stroke={color} strokeWidth={3} />
    ))
  const flow = (t * 60) % 40
  return (
    <Card
      id="transformer"
      index={6}
      formulas={['V₂ / V₁ = N₂ / N₁', 'I₂ / I₁ = N₁ / N₂']}
      visual={
        <svg ref={box} viewBox="0 0 600 200" className="w-full" role="img" aria-label={book.basics.cards.transformer.title}>
          <rect x={180} y={30} width={240} height={140} rx={8} fill="none" stroke="currentColor" strokeOpacity={0.45} strokeWidth={22} />
          <rect x={180} y={30} width={240} height={140} rx={8} fill="none" stroke={BLUE} strokeWidth={3} strokeDasharray="10 30" strokeDashoffset={-flow} />
          {coil(180, n1, AMBER)}
          {coil(420, n2, GREEN)}
          <text x={100} y={95} textAnchor="middle" className="tel-annot__small">
            {L.primary}
          </text>
          <text x={100} y={115} textAnchor="middle" className="tel-annot__tiny">
            20 kV · 10 A
          </text>
          <text x={500} y={95} textAnchor="middle" className="tel-annot__small">
            {L.secondary}
          </text>
          <text x={500} y={115} textAnchor="middle" className="tel-annot__tiny">
            {Math.round(v2)} V · {Math.round(i2)} A
          </text>
        </svg>
      }
      controls={
        <>
          <Range label={`${L.primary} · ${L.turns}`} value={n1} shown={num(n1)} min={10} max={2000} step={10} onChange={setN1} />
          <Range label={`${L.secondary} · ${L.turns}`} value={n2} shown={num(n2)} min={10} max={2000} step={10} onChange={setN2} />
        </>
      }
      readouts={[
        [L.voltage, `${Math.round(v2)} V`],
        [L.current, `${i2.toFixed(1)} A`],
        [L.power, '200 kW'],
      ]}
    />
  )
}

export function Basics() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <Ac />
        <Generator />
        <Ohm />
        <PowerFactor />
        <ThreePhase />
        <Transformer />
      </div>
    </div>
  )
}
