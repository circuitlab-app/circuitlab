import { Lightbulb } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Slider } from '@/components/ui/slider'
import type { WaveCardId } from '@/i18n/telecom/types'
import { cn } from '@/lib/utils'
import {
  aliasOf,
  arrayFactor,
  capacity,
  dbmToWatts,
  doppler,
  fspl,
  IONISING_EV,
  MARKERS,
  photonEv,
  refract,
  REGIONS,
  si,
  squareHarmonics,
  wavelength,
  type MarkerId,
} from './physics'
import { pathLoss } from './radio'
import { GEN_COLOR, useTelecomBook } from './ui'

/*
 * Waves and physics: the laws behind every call, one card each, with a live
 * drawing to play with. Animations only run while a card is on screen, and
 * stand still for readers who ask for reduced motion.
 */

const AMBER = '#e59a0b'
const SKY = '#0ea5e9'
const RED = '#ef4444'
const BLUE = '#3b82f6'
const GREEN = '#10a37a'

/* ───────────────────────── shared pieces ───────────────────────── */

/** Seconds since the page opened, ticking only while `ref` is on screen. */
export function useTime(ref: RefObject<Element | null>, fps = 40): number {
  const [t, setT] = useState(1.2)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '80px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  useEffect(() => {
    if (!visible || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    let last = 0
    const loop = (now: number) => {
      if (now - last >= 1000 / fps) {
        last = now
        setT(now / 1000)
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [visible, fps])
  return t
}

export function Range({
  label,
  value,
  shown,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  shown: string
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold tabular-nums" dir="ltr">
          {shown}
        </span>
      </span>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} dir="ltr" />
    </label>
  )
}

export function Chips<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium transition',
            o.id === value ? 'border-[var(--tel-accent)] bg-[var(--tel-accent)] text-white' : 'hover:bg-muted',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Live numbers of a card: [label, value] pairs. */
export function Readouts({ rows }: { rows: [string, string][] }) {
  const { digits } = useTelecomBook()
  return (
    <dl className="grid grid-cols-2 gap-1.5">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-muted/60 px-2.5 py-1.5">
          <dt className="text-[10.5px] text-muted-foreground">{label}</dt>
          <dd className={cn("text-[13px] font-semibold", !/[\u0600-\u06FF]/.test(value) && "font-mono")} dir={/[\u0600-\u06FF]/.test(value) ? undefined : "ltr"}>
            {digits(value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

type CardBody = {
  index: number
  visual: ReactNode
  controls?: ReactNode
  formulas: string[]
  readouts?: [string, string][]
  extra?: ReactNode
}

/** One card of a lab's physics section (shared with the Power Lab): a live drawing, its formula and why it matters. */
export function LabCard({
  anchor,
  index,
  title,
  law,
  text,
  why,
  whyLabel,
  visual,
  controls,
  formulas,
  readouts,
  extra,
}: CardBody & { anchor: string; title: string; law: string; text: string; why: string; whyLabel: string }) {
  const { num } = useTelecomBook()
  return (
    <section id={anchor} className="tel-card scroll-mt-16">
      <header className="mb-4 flex items-start gap-3">
        <span className="tel-card__num">{num(index)}</span>
        <div className="min-w-0">
          <h2 className="text-lg leading-tight font-bold">{title}</h2>
          <p className="text-[12.5px] font-medium text-[var(--tel-accent)]">{law}</p>
        </div>
      </header>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="tel-stage" dir="ltr">
          {visual}
        </div>
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-1.5" dir="ltr">
            {formulas.map((f) => (
              <code key={f} className="tel-formula">
                {f}
              </code>
            ))}
          </div>
          {controls ? <div className="space-y-3">{controls}</div> : null}
          {readouts ? <Readouts rows={readouts} /> : null}
          <p className="text-[13px] leading-relaxed">{text}</p>
          <p className="tel-why">
            <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <b>{whyLabel}: </b>
              {why}
            </span>
          </p>
          {extra}
        </div>
      </div>
    </section>
  )
}

function Card({ id, ...body }: CardBody & { id: WaveCardId }) {
  const { book } = useTelecomBook()
  const card = book.waves.cards[id]
  return <LabCard anchor={`wave-${id}`} {...card} whyLabel={book.waves.why} {...body} />
}

/** A sine path from x0 to x1 (px) with y = mid − amp·sin(2π(x/λ) − phase). */
export function sinePath(x0: number, x1: number, mid: number, amp: number, lambda: number, phase: number, step = 3) {
  let d = ''
  for (let x = x0; x <= x1; x += step) {
    const y = mid - amp * Math.sin((2 * Math.PI * (x - x0)) / lambda - phase)
    d += `${x === x0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }
  return d
}

/** A wave field drawn on a small canvas: `field(x, y)` returns −1 … 1, null for a wall. */
export function useField(canvas: RefObject<HTMLCanvasElement | null>, w: number, h: number, field: (x: number, y: number) => number | null, deps: unknown[]) {
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const image = ctx.createImageData(w, h)
    const data = image.data
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = field(x, y)
        const i = (y * w + x) * 4
        if (v === null) {
          data[i] = 120
          data[i + 1] = 120
          data[i + 2] = 130
          data[i + 3] = 255
          continue
        }
        const c = Math.max(-1, Math.min(1, v))
        if (c >= 0) {
          data[i] = 229
          data[i + 1] = 154
          data[i + 2] = 11
        } else {
          data[i] = 59
          data[i + 1] = 127
          data[i + 2] = 240
        }
        data[i + 3] = Math.abs(c) * 235
      }
    }
    ctx.putImageData(image, 0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/* ───────────────────────── 1. a wave ───────────────────────── */

function Anatomy({ index }: { index: number }) {
  const { book, num } = useTelecomBook()
  const L = book.waves.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box)
  const [f, setF] = useState(0.8)
  const [a, setA] = useState(0.75)
  const v = 160 // px per second: 4 cm/s at 40 px per cm
  const lambda = v / f
  const W = 600
  const mid = 110
  const amp = a * 80
  const phase = 2 * Math.PI * f * t
  const crest = (((0.25 + f * t) % 1) + 1) % 1
  let xc = 30 + crest * lambda
  if (xc + lambda > W - 20) xc -= lambda
  if (xc < 30) xc += lambda
  const buoyX = 470
  const buoyY = mid - amp * Math.sin((2 * Math.PI * (buoyX - 30)) / lambda - phase)
  return (
    <Card
      id="anatomy"
      index={index}
      formulas={['v = f · λ', 'T = 1 / f']}
      visual={
        <svg ref={box} viewBox={`0 0 ${W} 220`} className="w-full" role="img" aria-label={book.waves.cards.anatomy.title}>
          <line x1={20} x2={W - 10} y1={mid} y2={mid} className="tel-scope__axis" />
          <path d={sinePath(30, W - 10, mid, amp, lambda, phase)} fill="none" stroke={SKY} strokeWidth={3.5} strokeLinecap="round" />
          {xc + lambda <= W - 10 ? (
            <g className="tel-annot">
              <line x1={xc} x2={xc} y1={mid - amp - 6} y2={mid - amp - 26} />
              <line x1={xc + lambda} x2={xc + lambda} y1={mid - amp - 6} y2={mid - amp - 26} />
              <line x1={xc} x2={xc + lambda} y1={mid - amp - 18} y2={mid - amp - 18} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x={xc + lambda / 2} y={mid - amp - 24} textAnchor="middle" className="tel-annot__big">
                λ
              </text>
            </g>
          ) : null}
          <g className="tel-annot">
            <line x1={xc} x2={xc} y1={mid} y2={mid - amp} markerEnd="url(#arrow)" />
            <text x={xc + 8} y={mid - amp / 2} className="tel-annot__big">
              A
            </text>
          </g>
          <line x1={buoyX} x2={buoyX} y1={mid - 82} y2={mid + 82} stroke={AMBER} strokeOpacity={0.35} strokeDasharray="3 4" />
          <circle cx={buoyX} cy={buoyY} r={8} fill={AMBER} stroke="white" strokeWidth={2} />
          <text x={buoyX + 14} y={mid + 78} className="tel-annot__small" fill={AMBER}>
            T = 1/f
          </text>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
            </marker>
          </defs>
          <text x={22} y={210} className="tel-annot__small">
            {L.slow}
          </text>
        </svg>
      }
      controls={
        <>
          <Range label={L.frequency} value={f} shown={`${num(f, 2)} Hz`} min={0.25} max={2} step={0.05} onChange={setF} />
          <Range label={L.amplitude} value={a} shown={`${num(a * 100)}%`} min={0.2} max={1} step={0.05} onChange={setA} />
        </>
      }
      readouts={[
        [L.frequency, `${num(f, 2)} Hz`],
        [L.period, `${num(1 / f, 2)} s`],
        [L.speed, '4 cm/s'],
        [L.wavelength, `${num(4 / f, 1)} cm`],
      ]}
    />
  )
}

/* ───────────────────────── 2. c = f·λ and antennas ───────────────────────── */

const PRESETS: { id: string; hz: number; label: string }[] = [
  { id: 'am', hz: 1e6, label: 'AM 1 MHz' },
  { id: 'fm', hz: 1e8, label: 'FM 100 MHz' },
  { id: 'gsm', hz: 9e8, label: '2G 900 MHz' },
  { id: 'wifi', hz: 2.4e9, label: 'Wi-Fi 2.4 GHz' },
  { id: 'nr', hz: 3.5e9, label: '5G 3.5 GHz' },
  { id: 'mm', hz: 2.8e10, label: 'mmWave 28 GHz' },
]

const REFS: { id: 'field' | 'bus' | 'person' | 'phone' | 'coin' | 'grain'; m: number }[] = [
  { id: 'field', m: 100 },
  { id: 'bus', m: 12 },
  { id: 'person', m: 1.7 },
  { id: 'phone', m: 0.15 },
  { id: 'coin', m: 0.024 },
  { id: 'grain', m: 0.006 },
]

function Light({ index }: { index: number }) {
  const { book, digits } = useTelecomBook()
  const L = book.waves.labels
  const [logF, setLogF] = useState(Math.log10(3.5e9))
  const hz = 10 ** logF
  const lambda = wavelength(hz)
  const W = 600
  const span = 520
  const scale = span / lambda
  const ref = REFS.find((r) => r.m <= lambda * 0.95 && r.m * scale >= 10) ?? REFS[REFS.length - 1]
  return (
    <Card
      id="light"
      index={index}
      formulas={['λ = c / f', 'c ≈ 300 000 km/s', 'dipole = λ / 2']}
      visual={
        <svg viewBox={`0 0 ${W} 230`} className="w-full" role="img" aria-label={book.waves.cards.light.title}>
          <path d={sinePath(40, 40 + span, 95, 55, span, 0, 2)} fill="none" stroke={SKY} strokeWidth={3.5} strokeLinecap="round" />
          <g className="tel-annot">
            <line x1={40} x2={40 + span} y1={170} y2={170} markerStart="url(#arrow2)" markerEnd="url(#arrow2)" />
            <text x={40 + span / 2} y={163} textAnchor="middle" className="tel-annot__big">
              λ = {digits(si(lambda, 'm'))}
            </text>
          </g>
          <rect x={40} y={20} width={span / 2} height={7} rx={3.5} fill={AMBER} />
          <text x={44 + span / 2} y={28} className="tel-annot__small" fill={AMBER}>
            {L.halfWave}: {digits(si(lambda / 2, 'm'))}
          </text>
          <rect x={40} y={190} width={Math.max(3, ref.m * scale)} height={14} rx={3} fill={GREEN} />
          <text x={46 + Math.max(3, ref.m * scale)} y={202} className="tel-annot__small" fill={GREEN}>
            {book.waves.refs[ref.id]} ≈ {digits(si(ref.m, 'm', 2))}
          </text>
          <defs>
            <marker id="arrow2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
            </marker>
          </defs>
        </svg>
      }
      controls={
        <>
          <Range label={L.frequency} value={logF} shown={digits(si(hz, 'Hz'))} min={5} max={11} step={0.01} onChange={setLogF} />
          <Chips value={PRESETS.find((p) => Math.abs(Math.log10(p.hz) - logF) < 0.005)?.id ?? ''} options={PRESETS} onChange={(id) => setLogF(Math.log10(PRESETS.find((p) => p.id === id)!.hz))} />
        </>
      }
      readouts={[
        [L.wavelength, si(lambda, 'm')],
        [L.period, si(1 / hz, 's')],
        [L.halfWave, si(lambda / 2, 'm')],
        [L.quarterWave, si(lambda / 4, 'm')],
      ]}
    />
  )
}

/* ───────────────────────── 3. the spectrum ───────────────────────── */

function Spectrum({ index }: { index: number }) {
  const { book, digits } = useTelecomBook()
  const L = book.waves.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 30)
  const [pick, setPick] = useState<MarkerId>('nr')
  const marker = MARKERS.find((m) => m.id === pick)!
  const W = 640
  const x = (hz: number) => 20 + ((Math.log10(hz) - 3) / 18) * 600
  const ev = photonEv(marker.hz)
  // a "chirp": the wave gets shorter and shorter towards high frequencies
  let chirp = ''
  for (let px = 20; px <= 620; px += 1) {
    const u = (px - 20) / 600
    const phase = (Math.exp(u * 4.2) - 1) * 9 - t * 3
    chirp += `${px === 20 ? 'M' : 'L'}${px},${(58 - 20 * Math.sin(phase)).toFixed(1)}`
  }
  const decades = [3, 6, 9, 12, 15, 18, 21]
  return (
    <Card
      id="spectrum"
      index={index}
      formulas={['E = h · f', 'h = 6.626 × 10⁻³⁴ J·s']}
      visual={
        <svg ref={box} viewBox={`0 0 ${W} 250`} className="w-full" role="img" aria-label={book.waves.cards.spectrum.title}>
          <defs>
            <linearGradient id="rainbow" x1="0" x2="1">
              <stop offset="0" stopColor="#ff2a2a" />
              <stop offset="0.25" stopColor="#ffb02e" />
              <stop offset="0.45" stopColor="#f4f40a" />
              <stop offset="0.6" stopColor="#2ed12e" />
              <stop offset="0.8" stopColor="#2e7dff" />
              <stop offset="1" stopColor="#8a2eff" />
            </linearGradient>
          </defs>
          <path d={chirp} fill="none" stroke={SKY} strokeWidth={2} />
          {decades.map((d) => (
            <g key={d}>
              <line x1={x(10 ** d)} x2={x(10 ** d)} y1={96} y2={104} className="tel-scope__axis" />
              <text x={x(10 ** d)} y={92} textAnchor="middle" className="tel-annot__small">
                {digits(si(10 ** d, 'Hz', 1))}
              </text>
              <text x={x(10 ** d)} y={178} textAnchor="middle" className="tel-annot__small">
                {digits(si(wavelength(10 ** d), 'm', 1))}
              </text>
            </g>
          ))}
          {REGIONS.map((r) => (
            <g key={r.id}>
              <rect x={x(r.from)} y={110} width={Math.max(2, x(r.to) - x(r.from))} height={40} fill={r.color} opacity={0.85} />
              {x(r.to) - x(r.from) > 40 ? (
                <text x={(x(r.from) + x(r.to)) / 2} y={135} textAnchor="middle" className="tel-spectrum__label">
                  {book.waves.regions[r.id]}
                </text>
              ) : null}
            </g>
          ))}
          {MARKERS.map((m) => (
            <line key={m.id} x1={x(m.hz)} x2={x(m.hz)} y1={150} y2={158} stroke="currentColor" strokeWidth={m.id === pick ? 3 : 1} opacity={m.id === pick ? 1 : 0.5} />
          ))}
          <g transform={`translate(${x(marker.hz)} 0)`}>
            <line y1={104} y2={160} stroke="currentColor" strokeWidth={2} />
            <circle cy={196} r={5} fill="var(--tel-accent)" />
            <text y={220} textAnchor="middle" className="tel-annot__big" style={{ fontSize: 13 }}>
              {book.waves.markers[pick]}
            </text>
          </g>
        </svg>
      }
      controls={<Chips value={pick} options={MARKERS.map((m) => ({ id: m.id, label: book.waves.markers[m.id] }))} onChange={setPick} />}
      readouts={[
        [L.frequency, si(marker.hz, 'Hz')],
        [L.wavelength, si(wavelength(marker.hz), 'm')],
        [L.photon, si(ev, 'eV')],
        ['', ev >= IONISING_EV ? L.ionising : L.nonIonising],
      ]}
    />
  )
}

/* ───────────────────────── 4. the electromagnetic wave ───────────────────────── */

function EmWave({ index }: { index: number }) {
  const { book } = useTelecomBook()
  const L = book.waves.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box)
  const [pol, setPol] = useState<'vertical' | 'horizontal'>('vertical')
  const x0 = 40
  const len = 520
  const mid = 130
  const lambda = 180
  const phase = 2 * Math.PI * 0.45 * t
  // the "depth" direction drawn slanted, for a feel of 3D
  const depth = (v: number) => ({ dx: v * 0.55, dy: -v * 0.32 })
  const field = (kind: 'up' | 'depth', color: string) => {
    let d = ''
    const lines: ReactNode[] = []
    for (let s = 0; s <= len; s += 4) {
      const v = 70 * Math.sin((2 * Math.PI * s) / lambda - phase)
      const p = kind === 'up' ? { dx: 0, dy: -v } : depth(v)
      d += `${s === 0 ? 'M' : 'L'}${(x0 + s + p.dx).toFixed(1)},${(mid + p.dy).toFixed(1)}`
      if (s % 16 === 0) lines.push(<line key={s} x1={x0 + s} y1={mid} x2={x0 + s + p.dx} y2={mid + p.dy} stroke={color} strokeOpacity={0.35} />)
    }
    return (
      <g>
        {lines}
        <path d={d} fill="none" stroke={color} strokeWidth={3} />
      </g>
    )
  }
  const eUp = pol === 'vertical'
  return (
    <Card
      id="em"
      index={index}
      formulas={['c = 1 / √(μ₀ ε₀)', 'E ⟂ B ⟂ c']}
      visual={
        <svg ref={box} viewBox="0 0 600 250" className="w-full" role="img" aria-label={book.waves.cards.em.title}>
          {field(eUp ? 'depth' : 'up', BLUE)}
          <line x1={x0 - 10} x2={x0 + len + 20} y1={mid} y2={mid} stroke="currentColor" strokeWidth={1.5} markerEnd="url(#arrow3)" />
          {field(eUp ? 'up' : 'depth', RED)}
          <text x={x0 + len + 18} y={mid + 18} className="tel-annot__big">
            c
          </text>
          <text x={20} y={30} fill={RED} className="tel-annot__big">
            E<tspan className="tel-annot__small" dx={8}>{L.electric}</tspan>
          </text>
          <text x={20} y={238} fill={BLUE} className="tel-annot__big">
            B<tspan className="tel-annot__small" dx={8}>{L.magnetic}</tspan>
          </text>
          <defs>
            <marker id="arrow3" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
            </marker>
          </defs>
        </svg>
      }
      controls={
        <Chips
          value={pol}
          options={[
            { id: 'vertical', label: L.vertical },
            { id: 'horizontal', label: L.horizontal },
          ]}
          onChange={setPol}
        />
      }
    />
  )
}

/* ───────────────────────── 5. inverse square, path loss and decibels ───────────────────────── */

const LOSS_BANDS = [
  { id: '900', mhz: 900, label: '900 MHz' },
  { id: '3500', mhz: 3500, label: '3.5 GHz' },
  { id: '28000', mhz: 28000, label: '28 GHz' },
]

function InverseSquare({ index }: { index: number }) {
  const { book, digits } = useTelecomBook()
  const L = book.waves.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 30)
  const [logD, setLogD] = useState(0)
  const [band, setBand] = useState('3500')
  const mhz = LOSS_BANDS.find((b) => b.id === band)!.mhz
  const km = 10 ** logD
  const eirp = 60 // a tower sector: 43 dBm into a 17 dBi antenna
  const free = eirp - fspl(mhz, km)
  const city = eirp - pathLoss(mhz, km)
  // chart: distance 10 m … 30 km (log), power −150 … −20 dBm
  const cx = (d: number) => 330 + ((Math.log10(d) + 2) / Math.log10(3000)) * 260
  const cy = (dbm: number) => 20 + ((-20 - dbm) / 130) * 190
  const curve = (loss: (d: number) => number) => {
    let d = ''
    for (let i = 0; i <= 80; i++) {
      const dist = 10 ** (-2 + (i / 80) * Math.log10(3000))
      d += `${i ? 'L' : 'M'}${cx(dist).toFixed(1)},${cy(Math.max(-150, eirp - loss(dist))).toFixed(1)}`
    }
    return d
  }
  const pulse = (t * 0.6) % 1
  return (
    <Card
      id="inverse"
      index={index}
      formulas={['S = P / (4π r²)', 'FSPL = 20·log₁₀(d) + 20·log₁₀(f) + 32.44']}
      visual={
        <svg ref={box} viewBox="0 0 600 240" className="w-full" role="img" aria-label={book.waves.cards.inverse.title}>
          {/* the same power spreads over 1, 4, 9 squares at r, 2r, 3r */}
          <line x1={22} y1={120} x2={290} y2={30} className="tel-scope__axis" />
          <line x1={22} y1={120} x2={290} y2={210} className="tel-scope__axis" />
          {[1, 2, 3].map((r) => {
            const s = r * 26
            const xx = 22 + r * 82
            return (
              <g key={r}>
                <rect x={xx - 3} y={120 - s} width={6} height={2 * s} fill={AMBER} opacity={0.25} />
                {Array.from({ length: r + 1 }, (_, i) => (
                  <line key={i} x1={xx - 3} x2={xx + 3} y1={120 - s + (2 * s * i) / r} y2={120 - s + (2 * s * i) / r} stroke={AMBER} />
                ))}
                <text x={xx} y={120 + s + 16} textAnchor="middle" className="tel-annot__small">
                  {digits(`${r}r → 1/${r * r}`)}
                </text>
              </g>
            )
          })}
          {[0, 0.33, 0.66].map((o) => {
            const r = ((pulse + o) % 1) * 260
            return <path key={o} d={`M${22 + r * 0.95},${120 - r * 0.33} A${r},${r} 0 0 1 ${22 + r * 0.95},${120 + r * 0.33}`} fill="none" stroke={SKY} strokeWidth={2} opacity={1 - ((pulse + o) % 1)} />
          })}
          <circle cx={22} cy={120} r={7} fill={SKY} />
          {/* the chart */}
          <rect x={330} y={20} width={260} height={190} className="tel-chart__bg" />
          {[-40, -70, -100, -130].map((db) => (
            <g key={db}>
              <line x1={330} x2={590} y1={cy(db)} y2={cy(db)} className="tel-scope__mark" />
              <text x={326} y={cy(db) + 3} textAnchor="end" className="tel-annot__tiny">
                {digits(String(db))}
              </text>
            </g>
          ))}
          {[0.01, 0.1, 1, 10].map((d) => (
            <text key={d} x={cx(d)} y={224} textAnchor="middle" className="tel-annot__tiny">
              {digits(si(d * 1000, 'm', 1))}
            </text>
          ))}
          <path d={curve((d) => fspl(mhz, d))} fill="none" stroke={SKY} strokeWidth={2.5} />
          <path d={curve((d) => pathLoss(mhz, d))} fill="none" stroke={RED} strokeWidth={2.5} />
          <line x1={330} x2={590} y1={cy(-100)} y2={cy(-100)} stroke={GREEN} strokeDasharray="5 4" />
          <line x1={cx(km)} x2={cx(km)} y1={20} y2={210} stroke="currentColor" strokeOpacity={0.4} />
          <circle cx={cx(km)} cy={cy(Math.max(-150, free))} r={5} fill={SKY} />
          <circle cx={cx(km)} cy={cy(Math.max(-150, city))} r={5} fill={RED} />
          <text x={336} y={34} className="tel-annot__tiny" fill={SKY}>
            {L.freeSpace}
          </text>
          <text x={336} y={46} className="tel-annot__tiny" fill={RED}>
            {L.city}
          </text>
          <text x={336} y={cy(-100) - 4} className="tel-annot__tiny" fill={GREEN}>
            −100 dBm
          </text>
        </svg>
      }
      controls={
        <>
          <Range label={L.distance} value={logD} shown={digits(si(km * 1000, 'm'))} min={-2} max={Math.log10(30)} step={0.01} onChange={setLogD} />
          <Chips value={band} options={LOSS_BANDS} onChange={setBand} />
        </>
      }
      readouts={[
        ['FSPL', `${fspl(mhz, km).toFixed(1)} dB`],
        [`${L.received} · ${L.freeSpace}`, `${free.toFixed(1)} dBm`],
        [`${L.received} · ${L.city}`, `${city.toFixed(1)} dBm`],
        [L.received, si(dbmToWatts(city), 'W')],
      ]}
      extra={
        <div className="space-y-1">
          <p className="text-xs font-semibold">{book.waves.db.title}</p>
          <div className="grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-0.5 text-xs">
            {book.waves.db.rows.map((row) => (
              <div key={row.db} className="contents">
                <span className="font-mono font-semibold" dir="ltr">
                  {row.db}
                </span>
                <span className="text-muted-foreground">{row.text}</span>
              </div>
            ))}
          </div>
        </div>
      }
    />
  )
}

/* ───────────────────────── 6. reflection, refraction, total internal reflection ───────────────────────── */

const MEDIA = { air: 1.0003, water: 1.333, glass: 1.5, core: 1.468, cladding: 1.462 }
type Medium = keyof typeof MEDIA

function Snell({ index }: { index: number }) {
  const { book, num, digits } = useTelecomBook()
  const L = book.waves.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 30)
  const [angle, setAngle] = useState(35)
  const [top, setTop] = useState<Medium>('glass')
  const [bottom, setBottom] = useState<Medium>('air')
  const n1 = MEDIA[top]
  const n2 = MEDIA[bottom]
  const { refracted, critical } = refract(n1, n2, angle)
  const rad = (d: number) => (d * Math.PI) / 180
  const cx = 300
  const cy = 120
  const Lr = 110
  const inc = { x: cx - Lr * Math.sin(rad(angle)), y: cy - Lr * Math.cos(rad(angle)) }
  const refl = { x: cx + Lr * Math.sin(rad(angle)), y: cy - Lr * Math.cos(rad(angle)) }
  const tir = refracted === null
  const fiberT = (t * 0.25) % 1
  // a zig-zag through the fibre core, bouncing off the cladding
  const zig: [number, number][] = Array.from({ length: 9 }, (_, i) => [20 + i * 70, i % 2 ? 268 : 292])
  const along = fiberT * (zig.length - 1)
  const seg = Math.floor(along)
  const fr = along - seg
  const dot = zig[seg + 1] ? [zig[seg][0] + fr * (zig[seg + 1][0] - zig[seg][0]), zig[seg][1] + fr * (zig[seg + 1][1] - zig[seg][1])] : zig[seg]
  const mediaOptions = (Object.keys(MEDIA) as Medium[]).map((m) => ({ id: m, label: `${book.waves.media[m]} · ${MEDIA[m]}` }))
  return (
    <Card
      id="snell"
      index={index}
      formulas={['n₁ · sin θ₁ = n₂ · sin θ₂', 'θc = arcsin(n₂ / n₁)']}
      visual={
        <svg ref={box} viewBox="0 0 600 310" className="w-full" role="img" aria-label={book.waves.cards.snell.title}>
          <rect x={0} y={0} width={600} height={cy} fill={SKY} opacity={0.06 + (n1 - 1) * 0.35} />
          <rect x={0} y={cy} width={600} height={120} fill={SKY} opacity={0.06 + (n2 - 1) * 0.35} />
          <text x={10} y={18} className="tel-annot__small">
            {book.waves.media[top]} · n₁ = {digits(String(n1))}
          </text>
          <text x={10} y={cy + 20} className="tel-annot__small">
            {book.waves.media[bottom]} · n₂ = {digits(String(n2))}
          </text>
          <line x1={0} x2={600} y1={cy} y2={cy} stroke="currentColor" strokeOpacity={0.5} />
          <line x1={cx} x2={cx} y1={cy - 115} y2={cy + 115} className="tel-scope__mark" />
          <line x1={inc.x} y1={inc.y} x2={cx} y2={cy} stroke={AMBER} strokeWidth={4} strokeLinecap="round" />
          <line x1={cx} y1={cy} x2={refl.x} y2={refl.y} stroke={AMBER} strokeWidth={tir ? 4 : 2} strokeOpacity={tir ? 1 : 0.4} strokeLinecap="round" />
          {refracted !== null ? (
            <line x1={cx} y1={cy} x2={cx + Lr * Math.sin(rad(refracted))} y2={cy + Lr * Math.cos(rad(refracted))} stroke={SKY} strokeWidth={4} strokeLinecap="round" />
          ) : (
            <text x={cx + 14} y={cy + 30} className="tel-annot__big" fill={RED}>
              {L.tir}
            </text>
          )}
          <text x={cx - 46} y={cy - 40} className="tel-annot__small">
            θ₁ {digits(`${Math.round(angle)}°`)}
          </text>
          {refracted !== null ? (
            <text x={cx + 10} y={cy + 60} className="tel-annot__small">
              θ₂ {digits(`${Math.round(refracted)}°`)}
            </text>
          ) : null}
          {/* the fibre */}
          <rect x={10} y={252} width={580} height={56} rx={28} fill={SKY} opacity={0.12} />
          <rect x={10} y={262} width={580} height={36} rx={18} fill={SKY} opacity={0.22} />
          <polyline points={zig.map(([a, b]) => `${a},${b}`).join(' ')} fill="none" stroke={AMBER} strokeOpacity={0.45} strokeWidth={2} />
          <circle cx={dot[0]} cy={dot[1]} r={6} fill={AMBER} style={{ filter: 'drop-shadow(0 0 6px #e59a0b)' }} />
        </svg>
      }
      controls={
        <>
          <Range label={L.angle} value={angle} shown={`${num(angle)}°`} min={0} max={89} step={1} onChange={setAngle} />
          <p className="text-xs text-muted-foreground">{L.top}</p>
          <Chips value={top} options={mediaOptions} onChange={setTop} />
          <p className="text-xs text-muted-foreground">{L.bottom}</p>
          <Chips value={bottom} options={mediaOptions} onChange={setBottom} />
        </>
      }
      readouts={[
        ['θ₁', `${Math.round(angle)}°`],
        ['θ₂', refracted === null ? '—' : `${refracted.toFixed(1)}°`],
        [L.critical, critical === null ? '—' : `${critical.toFixed(1)}°`],
        ['', tir ? L.tir : L.refracted],
      ]}
    />
  )
}

/* ───────────────────────── 7. diffraction ───────────────────────── */

function Diffraction({ index }: { index: number }) {
  const { book, num } = useTelecomBook()
  const L = book.waves.labels
  const canvas = useRef<HTMLCanvasElement>(null)
  const t = useTime(canvas, 24)
  const [lambda, setLambda] = useState(10)
  const [gap, setGap] = useState(14)
  const W = 220
  const H = 130
  const wallX = 70
  const sources = useMemo(() => Array.from({ length: 14 }, (_, i) => H / 2 - gap / 2 + ((i + 0.5) * gap) / 14), [gap])
  useField(
    canvas,
    W,
    H,
    (x, y) => {
      const k = (2 * Math.PI) / lambda
      const w = 2 * Math.PI * 0.9 * t
      if (x < wallX) return Math.cos(k * x - w) * 0.85
      if (x < wallX + 3) return Math.abs(y - H / 2) <= gap / 2 ? Math.cos(k * x - w) * 0.85 : null
      let s = 0
      for (const sy of sources) {
        const r = Math.hypot(x - wallX, y - sy)
        s += Math.cos(k * (r + wallX) - w) / Math.sqrt(r + 4)
      }
      return (s / sources.length) * 6
    },
    [t, lambda, gap, sources],
  )
  const ratio = lambda / gap
  return (
    <Card
      id="diffraction"
      index={index}
      formulas={['θ ≈ λ / a']}
      visual={<canvas ref={canvas} width={W} height={H} className="tel-field w-full" aria-label={book.waves.cards.diffraction.title} />}
      controls={
        <>
          <Range label={L.wavelength} value={lambda} shown={`λ = ${num(lambda)}`} min={4} max={24} step={1} onChange={setLambda} />
          <Range label={L.gap} value={gap} shown={`a = ${num(gap)}`} min={4} max={48} step={1} onChange={setGap} />
        </>
      }
      readouts={[['λ / a', ratio.toFixed(2)], ['θ', ratio >= 1 ? '> 57°' : `≈ ${Math.round((ratio * 180) / Math.PI)}°`]]}
    />
  )
}

/* ───────────────────────── 8. interference ───────────────────────── */

function Interference({ index }: { index: number }) {
  const { book, num } = useTelecomBook()
  const L = book.waves.labels
  const canvas = useRef<HTMLCanvasElement>(null)
  const t = useTime(canvas, 24)
  const [phase, setPhase] = useState(0)
  const [spacing, setSpacing] = useState(2.5)
  const W = 200
  const H = 130
  const lambda = 12
  useField(
    canvas,
    W,
    H,
    (x, y) => {
      const k = (2 * Math.PI) / lambda
      const w = 2 * Math.PI * 0.9 * t
      const half = (spacing * lambda) / 2
      const r1 = Math.hypot(x - 18, y - (H / 2 - half))
      const r2 = Math.hypot(x - 18, y - (H / 2 + half))
      return (Math.cos(k * r1 - w) / Math.sqrt(r1 + 3) + Math.cos(k * r2 - w + (phase * Math.PI) / 180) / Math.sqrt(r2 + 3)) * 2.4
    },
    [t, phase, spacing],
  )
  const p = (phase * Math.PI) / 180
  const sum = 2 * Math.abs(Math.cos(p / 2))
  const trace = (fn: (u: number) => number, y0: number) => {
    let d = ''
    for (let i = 0; i <= 120; i++) {
      const u = i / 120
      d += `${i ? 'L' : 'M'}${(i * 2.5).toFixed(1)},${(y0 - fn(u) * 16).toFixed(1)}`
    }
    return d
  }
  const w = 2 * Math.PI * 0.5 * t
  return (
    <Card
      id="interference"
      index={index}
      formulas={['A = 2·A₀·|cos(Δφ / 2)|']}
      visual={
        <div className="grid gap-2 sm:grid-cols-2">
          <svg viewBox="0 0 300 200" className="w-full" role="img" aria-label={book.waves.cards.interference.title}>
            <path d={trace((u) => Math.sin(2 * Math.PI * 2 * u - w), 34)} fill="none" stroke={SKY} strokeWidth={2.5} />
            <path d={trace((u) => Math.sin(2 * Math.PI * 2 * u - w + p), 84)} fill="none" stroke={AMBER} strokeWidth={2.5} />
            <path d={trace((u) => Math.sin(2 * Math.PI * 2 * u - w) + Math.sin(2 * Math.PI * 2 * u - w + p), 150)} fill="none" stroke={GREEN} strokeWidth={3} />
            <text x={2} y={12} className="tel-annot__tiny" fill={SKY}>
              {L.waveA}
            </text>
            <text x={2} y={62} className="tel-annot__tiny" fill={AMBER}>
              {L.waveB}
            </text>
            <text x={2} y={114} className="tel-annot__tiny" fill={GREEN}>
              {L.sum}
            </text>
          </svg>
          <canvas ref={canvas} width={W} height={H} className="tel-field w-full" />
        </div>
      }
      controls={
        <>
          <Range label={L.phase} value={phase} shown={`${num(phase)}°`} min={0} max={360} step={5} onChange={setPhase} />
          <Range label={L.spacing} value={spacing} shown={`${num(spacing, 1)} λ`} min={0.5} max={5} step={0.1} onChange={setSpacing} />
        </>
      }
      readouts={[
        ['A / A₀', sum.toFixed(2)],
        ['', sum > 1.4 ? L.constructive : sum < 0.6 ? L.destructive : '…'],
      ]}
    />
  )
}

/* ───────────────────────── 9. Doppler ───────────────────────── */

function Doppler({ index }: { index: number }) {
  const { book, num, digits } = useTelecomBook()
  const L = book.waves.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 40)
  const [beta, setBeta] = useState(0.45)
  const c = 110 // px per second
  const f = 1.3
  const cycle = 7
  const tau = t % cycle
  const v = beta * c
  const xAt = (time: number) => 120 + v * time
  const fronts: ReactNode[] = []
  for (let k = 0; k * (1 / f) <= tau; k++) {
    const te = tau - k / f
    const r = c * (tau - te)
    fronts.push(<circle key={k} cx={xAt(te)} cy={110} r={r} fill="none" stroke={SKY} strokeWidth={2} opacity={Math.max(0, 1 - r / 420)} />)
  }
  const d = doppler(1, beta, 1)
  const cases: [string, number, number][] = [
    [book.waves.dopplerCases.car, 3.5e9, 120 / 3.6],
    [book.waves.dopplerCases.train, 3.5e9, 350 / 3.6],
    [book.waves.dopplerCases.satellite, 2e9, 7600],
  ]
  return (
    <Card
      id="doppler"
      index={index}
      formulas={["f' = f · c / (c − v)", 'Δf ≈ f · v / c']}
      visual={
        <svg ref={box} viewBox="0 0 600 220" className="w-full overflow-hidden" role="img" aria-label={book.waves.cards.doppler.title}>
          {fronts}
          <circle cx={xAt(tau)} cy={110} r={9} fill={AMBER} stroke="white" strokeWidth={2} />
          <text x={590} y={24} textAnchor="end" className="tel-annot__small">
            {L.ahead}: {digits(`${(d.ahead * 100).toFixed(0)}%`)}
          </text>
          <text x={10} y={24} className="tel-annot__small">
            {L.behind}: {digits(`${(d.behind * 100).toFixed(0)}%`)}
          </text>
        </svg>
      }
      controls={<Range label={L.speed} value={beta} shown={`v = ${num(beta, 2)} c`} min={0} max={0.85} step={0.01} onChange={setBeta} />}
      readouts={cases.map(([label, hz, speed]): [string, string] => [label, `Δf ≈ ${si(doppler(hz, speed).shift, 'Hz')}`])}
    />
  )
}

/* ───────────────────────── 10. Fourier ───────────────────────── */

function Fourier({ index }: { index: number }) {
  const { book, num } = useTelecomBook()
  const L = book.waves.labels
  const [count, setCount] = useState(3)
  const harmonics = squareHarmonics(count)
  const path = (fn: (u: number) => number, scale = 50) => {
    let d = ''
    for (let i = 0; i <= 300; i++) {
      const u = i / 300
      d += `${i ? 'L' : 'M'}${(10 + i * 1.1).toFixed(1)},${(100 - fn(u) * scale).toFixed(1)}`
    }
    return d
  }
  const sum = (u: number) => harmonics.reduce((s, h) => s + h.amp * Math.sin(2 * Math.PI * 2 * h.k * u), 0)
  return (
    <Card
      id="fourier"
      index={index}
      formulas={['x(t) = 4/π · Σ sin(2π k f t) / k', 'k = 1, 3, 5, …']}
      visual={
        <svg viewBox="0 0 600 200" className="w-full" role="img" aria-label={book.waves.cards.fourier.title}>
          <text x={10} y={14} className="tel-annot__tiny">
            {L.time}
          </text>
          <path d={path((u) => (Math.sin(2 * Math.PI * 2 * u) >= 0 ? 1 : -1))} fill="none" stroke="currentColor" strokeOpacity={0.25} strokeDasharray="4 4" />
          {harmonics.map((h) => (
            <path key={h.k} d={path((u) => h.amp * Math.sin(2 * Math.PI * 2 * h.k * u))} fill="none" stroke={SKY} strokeOpacity={0.3} />
          ))}
          <path d={path(sum)} fill="none" stroke={AMBER} strokeWidth={3} />
          <text x={370} y={14} className="tel-annot__tiny">
            {L.spectrum}
          </text>
          <line x1={370} x2={590} y1={170} y2={170} className="tel-scope__axis" />
          {Array.from({ length: 15 }, (_, i) => i + 1).map((k) => {
            const h = harmonics.find((x) => x.k === k)
            const x = 374 + (k - 1) * 14.5
            return (
              <g key={k}>
                <rect x={x} y={170 - (h ? h.amp * 120 : 0)} width={9} height={h ? h.amp * 120 : 0} rx={2} fill={AMBER} />
                {k % 2 ? (
                  <text x={x + 4.5} y={184} textAnchor="middle" className="tel-annot__tiny">
                    {k}
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>
      }
      controls={<Range label={L.harmonics} value={count} shown={num(count)} min={1} max={8} step={1} onChange={setCount} />}
      readouts={[[L.bandwidth, `≈ ${2 * count - 1} · f`]]}
    />
  )
}

/* ───────────────────────── 11. sampling ───────────────────────── */

function Sampling({ index }: { index: number }) {
  const { book, num } = useTelecomBook()
  const L = book.waves.labels
  const [f, setF] = useState(3)
  const [fs, setFs] = useState(10)
  const alias = aliasOf(f, fs)
  const r = ((f % fs) + fs) % fs
  const sign = r > fs / 2 ? -1 : 1
  const ok = Math.abs(alias - f) < 1e-9
  const X = (s: number) => 10 + s * 580
  const Y = (v: number) => 100 - v * 70
  let wave = ''
  let rebuilt = ''
  for (let i = 0; i <= 600; i++) {
    const s = i / 600
    wave += `${i ? 'L' : 'M'}${X(s).toFixed(1)},${Y(Math.sin(2 * Math.PI * f * s)).toFixed(1)}`
    rebuilt += `${i ? 'L' : 'M'}${X(s).toFixed(1)},${Y(sign * Math.sin(2 * Math.PI * alias * s)).toFixed(1)}`
  }
  const samples = Array.from({ length: Math.floor(fs) + 1 }, (_, n) => n / fs).filter((s) => s <= 1)
  return (
    <Card
      id="sampling"
      index={index}
      formulas={['f_s ≥ 2 · f_max', '8 kHz ≥ 2 × 3.4 kHz']}
      visual={
        <svg viewBox="0 0 600 200" className="w-full" role="img" aria-label={book.waves.cards.sampling.title}>
          <line x1={10} x2={590} y1={100} y2={100} className="tel-scope__axis" />
          <path d={wave} fill="none" stroke={SKY} strokeWidth={2} strokeOpacity={0.7} />
          <path d={rebuilt} fill="none" stroke={ok ? GREEN : RED} strokeWidth={2.5} strokeDasharray={ok ? undefined : '7 5'} />
          {samples.map((s) => (
            <g key={s}>
              <line x1={X(s)} x2={X(s)} y1={100} y2={Y(Math.sin(2 * Math.PI * f * s))} stroke={AMBER} strokeWidth={2} />
              <circle cx={X(s)} cy={Y(Math.sin(2 * Math.PI * f * s))} r={4.5} fill={AMBER} />
            </g>
          ))}
        </svg>
      }
      controls={
        <>
          <Range label={L.signal} value={f} shown={`${num(f)} Hz`} min={1} max={14} step={1} onChange={setF} />
          <Range label={L.sampleRate} value={fs} shown={`${num(fs)} Hz`} min={2} max={40} step={1} onChange={setFs} />
        </>
      }
      readouts={[
        ['2 · f', `${2 * f} Hz`],
        [L.alias, `${alias} Hz`],
        ['', ok ? L.faithful : L.alias],
      ]}
    />
  )
}

/* ───────────────────────── 12. Shannon ───────────────────────── */

const WIDTHS: { hz: number; label: string; gen: keyof typeof GEN_COLOR }[] = [
  { hz: 2e5, label: '200 kHz · 2G', gen: '2g' },
  { hz: 5e6, label: '5 MHz · 3G', gen: '3g' },
  { hz: 2e7, label: '20 MHz · 4G', gen: '4g' },
  { hz: 1e8, label: '100 MHz · 5G', gen: '5g' },
  { hz: 4e8, label: '400 MHz · mmWave', gen: '6g' },
]

function Shannon({ index }: { index: number }) {
  const { book, num, digits } = useTelecomBook()
  const L = book.waves.labels
  const [logB, setLogB] = useState(Math.log10(2e7))
  const [snr, setSnr] = useState(20)
  const B = 10 ** logB
  const cap = capacity(B, snr)
  const eff = Math.log2(1 + 10 ** (snr / 10))
  const X = (db: number) => 50 + ((db + 10) / 50) * 520
  const Y = (bps: number) => 210 - ((Math.log10(Math.max(bps, 1e4)) - 4) / 6) * 190
  const curve = (hz: number) => {
    let d = ''
    for (let db = -10; db <= 40; db += 1) d += `${db === -10 ? 'M' : 'L'}${X(db).toFixed(1)},${Y(capacity(hz, db)).toFixed(1)}`
    return d
  }
  const qam = eff >= 8 ? '256-QAM' : eff >= 6 ? '64-QAM' : eff >= 4 ? '16-QAM' : eff >= 2 ? 'QPSK' : 'BPSK'
  return (
    <Card
      id="shannon"
      index={index}
      formulas={['C = B · log₂(1 + S/N)']}
      visual={
        <svg viewBox="0 0 600 240" className="w-full" role="img" aria-label={book.waves.cards.shannon.title}>
          <rect x={50} y={20} width={520} height={190} className="tel-chart__bg" />
          {[1e4, 1e6, 1e8, 1e10].map((b) => (
            <g key={b}>
              <line x1={50} x2={570} y1={Y(b)} y2={Y(b)} className="tel-scope__mark" />
              <text x={46} y={Y(b) + 3} textAnchor="end" className="tel-annot__tiny">
                {digits(si(b, 'b/s', 1))}
              </text>
            </g>
          ))}
          {[-10, 0, 10, 20, 30, 40].map((db) => (
            <text key={db} x={X(db)} y={226} textAnchor="middle" className="tel-annot__tiny">
              {digits(`${db} dB`)}
            </text>
          ))}
          {WIDTHS.map((w) => (
            <g key={w.hz}>
              <path d={curve(w.hz)} fill="none" stroke={GEN_COLOR[w.gen]} strokeWidth={2} />
              <text x={X(40) - 4} y={Y(capacity(w.hz, 40)) - 5} textAnchor="end" className="tel-annot__tiny" fill={GEN_COLOR[w.gen]}>
                {w.label}
              </text>
            </g>
          ))}
          <path d={curve(B)} fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="5 4" />
          <circle cx={X(snr)} cy={Y(cap)} r={7} fill="var(--tel-accent)" stroke="white" strokeWidth={2} />
        </svg>
      }
      controls={
        <>
          <Range label={L.bandwidth} value={logB} shown={digits(si(B, 'Hz'))} min={5} max={Math.log10(4e8)} step={0.01} onChange={setLogB} />
          <Range label={L.snr} value={snr} shown={`${num(snr)} dB`} min={-10} max={40} step={1} onChange={setSnr} />
        </>
      }
      readouts={[
        [L.capacity, si(cap, 'bit/s')],
        [L.efficiency, `${eff.toFixed(2)} bit/s/Hz`],
        ['≈', qam],
      ]}
    />
  )
}

/* ───────────────────────── 13. beamforming ───────────────────────── */

function Beam({ index }: { index: number }) {
  const { book, num } = useTelecomBook()
  const L = book.waves.labels
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 30)
  const [n, setN] = useState(8)
  const [steer, setSteer] = useState(25)
  const cx = 300
  const cy = 235
  const R = 190
  let shape = ''
  for (let a = -90; a <= 90; a += 1) {
    const g = arrayFactor(n, 0.5, steer, a) ** 2
    const db = Math.max(-25, 10 * Math.log10(Math.max(g, 1e-6)))
    const r = ((db + 25) / 25) * R
    const rad = (a * Math.PI) / 180
    shape += `${a === -90 ? 'M' : 'L'}${(cx + r * Math.sin(rad)).toFixed(1)},${(cy - r * Math.cos(rad)).toFixed(1)}`
  }
  shape += 'Z'
  const steerRad = (steer * Math.PI) / 180
  return (
    <Card
      id="beam"
      index={index}
      formulas={['AF(θ) = Σ e^{j·n·(k·d·sin θ − φ)}', 'G ≈ 10·log₁₀(N) dB']}
      visual={
        <svg ref={box} viewBox="0 0 600 270" className="w-full" role="img" aria-label={book.waves.cards.beam.title}>
          <defs>
            <radialGradient id="beamFill" cx="0.5" cy="1" r="1">
              <stop offset="0" stopColor="#a24ef0" stopOpacity="0.55" />
              <stop offset="1" stopColor="#a24ef0" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          {[1, 2 / 3, 1 / 3].map((f) => (
            <path key={f} d={`M${cx - R * f},${cy} A${R * f},${R * f} 0 0 1 ${cx + R * f},${cy}`} className="tel-scope__mark" fill="none" />
          ))}
          {[-60, -30, 0, 30, 60].map((a) => (
            <line key={a} x1={cx} y1={cy} x2={cx + R * Math.sin((a * Math.PI) / 180)} y2={cy - R * Math.cos((a * Math.PI) / 180)} className="tel-scope__mark" />
          ))}
          <path d={shape} fill="url(#beamFill)" stroke="#a24ef0" strokeWidth={2} />
          <line x1={cx} y1={cy} x2={cx + (R + 10) * Math.sin(steerRad)} y2={cy - (R + 10) * Math.cos(steerRad)} stroke="currentColor" strokeDasharray="4 4" />
          <text x={cx + (R + 24) * Math.sin(steerRad)} y={cy - (R + 24) * Math.cos(steerRad)} textAnchor="middle" fontSize={18}>
            📱
          </text>
          {Array.from({ length: n }, (_, k) => {
            const x = cx + (k - (n - 1) / 2) * 12
            const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * 1.2 * t - k * Math.PI * Math.sin(steerRad))
            return <circle key={k} cx={x} cy={cy + 14} r={4} fill="#a24ef0" opacity={0.35 + 0.65 * pulse} />
          })}
        </svg>
      }
      controls={
        <>
          <Range label={L.elements} value={n} shown={num(n)} min={1} max={32} step={1} onChange={setN} />
          <Range label={L.steer} value={steer} shown={`${num(steer)}°`} min={-60} max={60} step={1} onChange={setSteer} />
        </>
      }
      readouts={[
        ['G', `${(10 * Math.log10(n)).toFixed(1)} dB`],
        ['θ₃dB', n > 1 ? `≈ ${Math.round(102 / n)}°` : '—'],
      ]}
    />
  )
}

/* ───────────────────────── the section ───────────────────────── */

const ORDER: [WaveCardId, (p: { index: number }) => ReactNode][] = [
  ['anatomy', Anatomy],
  ['light', Light],
  ['spectrum', Spectrum],
  ['em', EmWave],
  ['inverse', InverseSquare],
  ['snell', Snell],
  ['diffraction', Diffraction],
  ['interference', Interference],
  ['doppler', Doppler],
  ['fourier', Fourier],
  ['sampling', Sampling],
  ['shannon', Shannon],
  ['beam', Beam],
]

export function Waves() {
  const { book, num } = useTelecomBook()
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <nav className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b bg-background/95 px-3 py-2 backdrop-blur">
        {ORDER.map(([id], i) => (
          <a
            key={id}
            href={`#wave-${id}`}
            className="shrink-0 rounded-md px-2 py-1 text-[12px] font-medium whitespace-nowrap hover:bg-muted"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(`wave-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            <span className="me-1 text-muted-foreground tabular-nums">{num(i + 1)}</span>
            {book.waves.cards[id].title}
          </a>
        ))}
      </nav>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <p className="max-w-3xl text-[14px] leading-relaxed">{book.waves.intro}</p>
        {ORDER.map(([id, Component], i) => (
          <Component key={id} index={i + 1} />
        ))}
        <p className="text-[11px] text-muted-foreground italic">{book.guide.model}</p>
      </div>
    </div>
  )
}
