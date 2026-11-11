import { Cog } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Chips, Range, Readouts, useTime } from '@/telecom/Waves'
import { Dial } from './Basics'
import { brakes, cylinder, G } from './model'
import { AMBER, GREEN, RED, useHydraulicsBook } from './ui'

/* Oil hydraulics: a car lift (pump, relief valve, control valve, cylinder) and a car's brakes. */

const OIL = '#d4a017'
/** The lift's travel, m, and how much faster than life the drawing runs. */
const STROKE = 1.8
const FAST = 6
type Lever = 'up' | 'hold' | 'down'

function Flow({ d, on, reverse, color = 'white' }: { d: string; on: boolean; reverse?: boolean; color?: string }) {
  return on ? (
    <path d={d} fill="none" className="wire-flow" strokeLinecap="round" style={{ stroke: color, strokeWidth: 3, strokeDasharray: '1 17', animationDuration: '0.45s', animationDirection: reverse ? 'reverse' : 'normal' }} />
  ) : null
}

function Lift() {
  const { book, num } = useHydraulicsBook()
  const l = book.machines.lift
  const box = useRef<SVGSVGElement>(null)
  const t = useTime(box, 40)
  const [lever, setLever] = useState<Lever>('up')
  const [load, setLoad] = useState(1500)
  const [bore, setBore] = useState(80)
  const [pump, setPump] = useState(12)
  const [relief, setRelief] = useState(160)
  const [pos, setPos] = useState(0.15)
  const c = cylinder({ boreMm: bore, loadKg: load, pumpLpm: pump, reliefBar: relief })
  const speed = lever === 'up' ? c.speed : lever === 'down' ? -0.08 : 0
  const last = useRef(t)
  useEffect(() => {
    const dt = Math.min(0.1, t - last.current)
    last.current = t
    if (dt > 0 && speed) setPos((p) => Math.max(0, Math.min(1, p + (speed * FAST * dt) / STROKE)))
  }, [t, speed])

  const stalled = lever === 'up' && !c.lifts
  const rising = lever === 'up' && c.lifts && pos < 1
  const lowering = lever === 'down' && pos > 0
  const status = stalled ? l.status.stalled : rising ? l.status.rising : lever === 'up' ? l.status.top : lever === 'hold' ? l.status.holding : lowering ? l.status.lowering : l.status.bottom
  // the pressure under the piston: the load's while it is carried, the relief valve's when stalled
  const bar = stalled || (lever === 'up' && pos >= 1) ? relief : pos > 0 || lever === 'up' ? c.neededBar : 0
  const hot = Math.min(1, bar / 250)
  const half = 16 + bore * 0.22
  const piston = 252 - pos * 120
  const LINE = { fill: 'none', stroke: 'currentColor', strokeWidth: 5, strokeLinejoin: 'round' as const }
  const suction = 'M80 240 V208'
  const pressure = 'M80 172 V95 H200 V145 H205'
  const toCylinder = 'M265 170 V262 H440'
  const toTank = 'M235 170 V215 H110 V240'
  const overRelief = 'M80 130 H165 V215'
  return (
    <section className="tel-card grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-2">
        <h2 className="text-lg font-bold">{l.title}</h2>
        <div className="tel-stage" dir="ltr">
          <svg ref={box} viewBox="0 0 640 300" className="w-full" role="img" aria-label={l.title}>
            {/* tank, pump, lines */}
            <rect x={30} y={252} width={100} height={36} fill={OIL} fillOpacity={0.7} />
            <path d="M30 240 V288 H130 V240" fill="none" stroke="currentColor" strokeWidth={3} />
            {[suction, pressure, toCylinder, toTank, overRelief].map((d) => (
              <path key={d} d={d} {...LINE} />
            ))}
            <path d={pressure} fill="none" stroke={`color-mix(in oklch, ${RED} ${Math.round((stalled ? 1 : rising ? hot : 0.05) * 100)}%, ${OIL})`} strokeWidth={2.5} />
            <path d={toCylinder} fill="none" stroke={`color-mix(in oklch, ${RED} ${Math.round(hot * 100)}%, ${OIL})`} strokeWidth={2.5} />
            <Flow d={suction} on reverse />
            <Flow d={pressure} on />
            <Flow d={toCylinder} on={rising} />
            <Flow d={toCylinder} on={lowering} reverse />
            <Flow d={toTank} on={!rising && !stalled} />
            <Flow d={overRelief} on={stalled} color="#fecaca" />
            <circle cx={80} cy={190} r={19} fill="var(--card)" stroke="currentColor" strokeWidth={3} />
            <path d="M70 198 L80 176 L90 198 Z" fill={GREEN} />
            {/* relief valve */}
            <rect x={150} y={116} width={30} height={28} rx={4} fill={stalled ? RED : 'var(--card)'} stroke="currentColor" strokeWidth={2.5} />
            <path d="M156 136 l5 -10 l5 10 l5 -10" fill="none" stroke={stalled ? 'white' : 'currentColor'} strokeWidth={2} />
            {/* control valve: three positions, the middle one drawn in the lines */}
            <rect x={205} y={120} width={90} height={50} rx={6} fill="var(--card)" stroke="currentColor" strokeWidth={2.5} />
            {(['up', 'hold', 'down'] as const).map((id, k) => (
              <g key={id} transform={`translate(${220 + k * 30} 145)`}>
                <rect x={-13} y={-21} width={26} height={42} rx={4} fill={lever === id ? 'var(--tel-accent)' : 'transparent'} />
                <text y={6} textAnchor="middle" fontSize={16} style={{ fill: lever === id ? 'white' : 'currentColor' }}>
                  {['▲', '■', '▼'][k]}
                </text>
              </g>
            ))}
            {/* cylinder, piston, rod, platform and the load */}
            <rect x={480 - half} y={piston} width={2 * half} height={270 - piston} fill={`color-mix(in oklch, ${RED} ${Math.round(hot * 100)}%, ${OIL})`} fillOpacity={0.8} />
            <path d={`M${480 - half} 110 V270 H${480 + half} V110`} fill="none" stroke="currentColor" strokeWidth={3.5} />
            <rect x={480 - half + 2} y={piston - 10} width={2 * half - 4} height={10} fill="currentColor" />
            <rect x={476} y={piston - 62} width={8} height={52} fill="currentColor" />
            <rect x={410} y={piston - 68} width={140} height={7} rx={3} fill="currentColor" />
            <text x={480} y={piston - 72} textAnchor="middle" fontSize={44}>
              {load >= 3000 ? '🚚' : load >= 500 ? '🚗' : '🏍️'}
            </text>
            <text x={590} y={piston - 80} textAnchor="middle" className="tel-annot__small">
              {num(load)} kg
            </text>
            <path d="M345 262 V226" {...LINE} strokeWidth={3} />
            <Dial x={345} y={200} share={bar / 250} text={`${num(bar)} bar`} />
            {(
              [
                [80, 298, l.parts.tank],
                [36, 180, l.parts.pump],
                [140, 112, l.parts.relief],
                [250, 112, l.parts.valve],
                [480, 290, l.parts.cylinder],
              ] as const
            ).map(([x, y, text]) => (
              <text key={text} x={x} y={y} textAnchor="middle" className="tel-annot__tiny">
                {text}
              </text>
            ))}
            <text x={630} y={16} textAnchor="end" className="tel-annot__tiny">
              ⏩ × {FAST}
            </text>
          </svg>
        </div>
        <p className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold" style={{ background: `color-mix(in oklch, ${stalled ? 'var(--pipe-bad)' : 'var(--pipe-ok)'} 14%, transparent)` }}>
          {status}
        </p>
      </div>
      <div className="space-y-3">
        <Chips value={lever} options={[{ id: 'up', label: `▲ ${l.up}` }, { id: 'hold', label: `■ ${l.hold}` }, { id: 'down', label: `▼ ${l.down}` }]} onChange={setLever} />
        <Range label={l.load} value={load} shown={`${num(load)} kg`} min={200} max={6000} step={100} onChange={setLoad} />
        <Range label={l.bore} value={bore} shown={`${num(bore)} mm`} min={40} max={200} step={5} onChange={setBore} />
        <Range label={l.pump} value={pump} shown={`${num(pump)} L/min`} min={2} max={40} step={1} onChange={setPump} />
        <Range label={l.relief} value={relief} shown={`${num(relief)} bar`} min={50} max={250} step={10} onChange={setRelief} />
        <Readouts
          rows={[
            [l.needed, `${num(c.neededBar)} bar`],
            [l.max, `${num(c.maxKg)} kg`],
            [l.speed, `${num(c.speed * 100, 1)} cm/s`],
            c.lifts ? [l.power, `${num(c.powerKw, 2)} kW`] : [l.heat, `${num(c.heatKw, 2)} kW`],
          ]}
        />
        <p className="text-[13px] leading-relaxed">{l.text}</p>
        <p className="tel-why">
          <Cog className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{l.lesson}</span>
        </p>
      </div>
    </section>
  )
}

function Brakes() {
  const { book, num } = useHydraulicsBook()
  const b = book.machines.brakes
  const [pedal, setPedal] = useState(150)
  const [master, setMaster] = useState(22)
  const [caliper, setCaliper] = useState(54)
  const [booster, setBooster] = useState(true)
  const RATIO = 4
  const r = brakes({ pedalN: pedal, ratio: RATIO, masterMm: master, caliperMm: caliper, booster })
  const squeeze = Math.min(1, r.bar / 120)
  const tilt = 8 + (pedal / 500) * 22
  const line = `color-mix(in oklch, ${RED} ${Math.round(squeeze * 100)}%, ${OIL})`
  const wheels = [
    [470, 50],
    [470, 170],
    [580, 50],
    [580, 170],
  ]
  return (
    <section className="tel-card grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-2">
        <h2 className="text-lg font-bold">{b.title}</h2>
        <div className="tel-stage" dir="ltr">
          <svg viewBox="0 0 640 230" className="w-full" role="img" aria-label={b.title}>
            {/* pedal: a lever that pushes the master cylinder's rod */}
            <g transform={`rotate(${tilt} 70 40)`}>
              <line x1={70} y1={40} x2={70} y2={170} stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
              <rect x={44} y={166} width={52} height={12} rx={4} fill="currentColor" />
            </g>
            <circle cx={70} cy={40} r={6} fill="currentColor" />
            <text x={30} y={206} className="tel-annot__small">
              🦶 {num(pedal)} N
            </text>
            <line x1={70 - Math.sin((tilt * Math.PI) / 180) * 40} y1={82} x2={150 + squeeze * 18} y2={82} stroke="currentColor" strokeWidth={4} />
            {booster ? <ellipse cx={128} cy={82} rx={12} ry={34} fill="var(--card)" stroke="currentColor" strokeWidth={2.5} /> : null}
            <rect x={150} y={82 - master * 0.5} width={90} height={master} fill="var(--card)" stroke="currentColor" strokeWidth={2.5} />
            <rect x={156 + squeeze * 18} y={82 - master * 0.5 + 2} width={82 - squeeze * 18} height={master - 4} fill={line} />
            <rect x={150 + squeeze * 18} y={82 - master * 0.5 + 2} width={6} height={master - 4} fill="currentColor" />
            {/* the same pressure in every line */}
            <g fill="none" stroke={line} strokeWidth={4} strokeLinejoin="round">
              <path d="M240 82 H340 V50 H430" />
              <path d="M340 82 V170 H430" />
              <path d="M400 50 V20 H540 V50" />
              <path d="M400 170 V200 H540 V170" />
            </g>
            <text x={300} y={72} textAnchor="middle" className="tel-annot__small">
              {num(r.bar)} bar
            </text>
            {wheels.map(([x, y]) => (
              <g key={`${x}:${y}`} transform={`translate(${x} ${y})`}>
                <circle r={34} fill="none" stroke="currentColor" strokeOpacity={0.5} strokeWidth={9} />
                <circle r={22} fill="#94a3b8" fillOpacity={0.5} stroke={`color-mix(in oklch, ${AMBER} ${Math.round(squeeze * 100)}%, currentColor)`} strokeWidth={2 + squeeze * 4} />
                <rect x={-40} y={-caliper * 0.16} width={14 + squeeze * 5} height={caliper * 0.32} rx={3} fill={line} stroke="currentColor" strokeWidth={1.5} />
              </g>
            ))}
            {(
              [
                [70, 222, b.parts.pedal],
                [195, 125, b.parts.master],
                [525, 118, b.parts.caliper],
              ] as const
            ).map(([x, y, text]) => (
              <text key={text} x={x} y={y} textAnchor="middle" className="tel-annot__tiny">
                {text}
              </text>
            ))}
          </svg>
        </div>
      </div>
      <div className="space-y-3">
        <Range label={b.pedal} value={pedal} shown={`${num(pedal)} N ≈ ${num(pedal / G)} kg`} min={20} max={500} step={10} onChange={setPedal} />
        <Range label={b.master} value={master} shown={`⌀ ${num(master)} mm`} min={15} max={32} step={1} onChange={setMaster} />
        <Range label={b.caliper} value={caliper} shown={`⌀ ${num(caliper)} mm`} min={30} max={70} step={1} onChange={setCaliper} />
        <label className="flex items-center gap-2 text-[13px]">
          <Switch checked={booster} onCheckedChange={setBooster} />
          {b.booster}
        </label>
        <Readouts
          rows={[
            [b.ratio, `× ${RATIO}`],
            [b.line, `${num(r.bar)} bar`],
            [b.clamp, `${num(r.clamp / G)} kg`],
            [b.gain, `× ${num(r.gain)}`],
          ]}
        />
        <p className="text-[13px] leading-relaxed">{b.text}</p>
        <p className="tel-why">
          <Cog className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{b.lesson}</span>
        </p>
      </div>
    </section>
  )
}

export function Machines() {
  const { book } = useHydraulicsBook()
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <p className="max-w-3xl text-[14px] leading-relaxed">{book.machines.intro}</p>
        <Lift />
        <Brakes />
        <p className="text-[11px] text-muted-foreground italic">{book.model}</p>
      </div>
    </div>
  )
}
