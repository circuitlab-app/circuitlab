import { Gauge } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Chips, Range, Readouts } from '@/telecom/Waves'
import { DEMAND, dispatchDay, PLANT_IDS, PLANTS, SHEDDING_HZ, type Mix, type PlantId } from './model'
import { usePowerBook } from './ui'

/* Balancing a grid through a day: plants, weather, the hour, and the frequency that tells how it is going. */

const PRESETS: Record<'gas' | 'clean' | 'fossil', Mix> = {
  gas: { nuclear: 100, coal: 0, gas: 800, hydro: 120, wind: 40, solar: 150, battery: 0 },
  clean: { nuclear: 250, coal: 0, gas: 250, hydro: 200, wind: 350, solar: 600, battery: 300 },
  fossil: { nuclear: 0, coal: 500, gas: 400, hydro: 80, wind: 0, solar: 50, battery: 0 },
}

const STACK: PlantId[] = ['nuclear', 'hydro', 'wind', 'solar', 'battery', 'coal', 'gas']

export function Plants() {
  const { book, num, digits } = usePowerBook()
  const p = book.plants
  const [cap, setCap] = useState<Mix>(PRESETS.gas)
  const [sunny, setSunny] = useState(true)
  const [windy, setWindy] = useState(false)
  const [hour, setHour] = useState(19)
  const day = useMemo(() => dispatchDay(cap, { sunny, windy }), [cap, sunny, windy])
  const now = day[hour]
  const X = (h: number) => 40 + (h / 23) * 540
  const Y = (mw: number) => 210 - (mw / 1300) * 190
  const areas = STACK.map((id, k) => {
    const below = (h: number) => STACK.slice(0, k).reduce((s, j) => s + day[h].out[j], 0)
    const top = day.map((_, h) => `${X(h)},${Y(below(h) + day[h].out[id])}`)
    const bottom = day.map((_, h) => `${X(h)},${Y(below(h))}`).reverse()
    return <polygon key={id} points={[...top, ...bottom].join(' ')} fill={PLANTS[id].color} opacity={0.85} />
  })
  const clean = day.reduce((s, h) => s + h.out.nuclear + h.out.hydro + h.out.wind + h.out.solar + h.out.battery, 0) / day.reduce((s, h) => s + h.demand - h.shortage, 0)
  const status = now.frequency < SHEDDING_HZ ? p.status.shedding : now.shortage > 0 ? p.status.low : now.charge + now.curtailed > 0 ? p.status.curtail : p.status.ok
  const needle = Math.max(-1, Math.min(1, (now.frequency - 50) / 3))
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <p className="max-w-3xl text-[14px] leading-relaxed">{p.intro}</p>
        <section className="tel-card grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="tel-stage" dir="ltr">
              <svg viewBox="0 0 600 240" className="w-full" role="img" aria-label={p.demand}>
                {[0, 400, 800, 1200].map((mw) => (
                  <g key={mw}>
                    <line x1={40} x2={580} y1={Y(mw)} y2={Y(mw)} className="tel-scope__mark" />
                    <text x={34} y={Y(mw) + 3} textAnchor="end" className="tel-annot__tiny">
                      {digits(String(mw))}
                    </text>
                  </g>
                ))}
                {areas}
                {day.map((h) =>
                  h.shortage > 0 ? <rect key={h.hour} x={X(h.hour) - 10} y={Y(h.demand)} width={20} height={Y(h.demand - h.shortage) - Y(h.demand)} fill="var(--pipe-bad)" opacity={0.55} /> : null,
                )}
                <polyline points={DEMAND.map((_, h) => `${X(h)},${Y(day[h].demand)}`).join(' ')} fill="none" stroke="currentColor" strokeWidth={2.5} strokeDasharray="6 4" />
                <line x1={X(hour)} x2={X(hour)} y1={14} y2={210} stroke="currentColor" strokeWidth={2} />
                {[0, 6, 12, 18, 23].map((h) => (
                  <text key={h} x={X(h)} y={228} textAnchor="middle" className="tel-annot__tiny">
                    {digits(`${h}:00`)}
                  </text>
                ))}
              </svg>
            </div>
            <Range label={p.hour} value={hour} shown={digits(`${hour}:00`)} min={0} max={23} step={1} onChange={setHour} />
            <div className="flex flex-wrap gap-2">
              <Chips value={sunny ? 'sun' : 'cloud'} options={[{ id: 'sun', label: `☀️ ${p.sunny}` }, { id: 'cloud', label: `☁️ ${p.cloudy}` }]} onChange={(v) => setSunny(v === 'sun')} />
              <Chips value={windy ? 'wind' : 'calm'} options={[{ id: 'wind', label: `🌬️ ${p.windy}` }, { id: 'calm', label: `🍃 ${p.calm}` }]} onChange={(v) => setWindy(v === 'wind')} />
            </div>
            <Chips<keyof typeof PRESETS | ''> value="" options={(['gas', 'clean', 'fossil'] as const).map((id) => ({ id, label: p.presets[id] }))} onChange={(id) => id && setCap(PRESETS[id])} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 160 96" className="w-40 shrink-0" role="img" aria-label={p.frequency}>
                <path d="M15 85 A65 65 0 0 1 145 85" fill="none" stroke="var(--pipe-bad)" strokeWidth={10} strokeDasharray="34 400" />
                <path d="M15 85 A65 65 0 0 1 145 85" fill="none" stroke="var(--pipe-ok)" strokeWidth={10} strokeDasharray="0 68 68 400" />
                <line x1={80} y1={85} x2={80 + 58 * Math.sin(needle * 1.4)} y2={85 - 58 * Math.cos(needle * 1.4)} stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                <text x={80} y={70} textAnchor="middle" className="tel-annot__small">
                  {digits(now.frequency.toFixed(2))} Hz
                </text>
              </svg>
              <p className="flex items-start gap-1.5 text-[13px] font-semibold">
                <Gauge className="mt-0.5 size-4 shrink-0" aria-hidden />
                {status}
              </p>
            </div>
            <Readouts
              rows={[
                [p.demand, `${Math.round(now.demand)} MW`],
                [p.co2, `${Math.round(now.co2)} g/kWh`],
                [p.renewable, `${Math.round(clean * 100)}%`],
                ['🔋', `${Math.round(now.stored)} MWh`],
              ]}
            />
            <div className="space-y-2">
              {PLANT_IDS.map((id) => (
                <div key={id} className="grid grid-cols-[0.75rem_1fr] items-center gap-2">
                  <span className="size-3 rounded-sm" style={{ background: PLANTS[id].color }} />
                  <Range label={`${p.names[id]} · ${Math.round(now.out[id])} MW`} value={cap[id]} shown={`${num(cap[id])} MW`} min={0} max={1000} step={10} onChange={(v) => setCap((c) => ({ ...c, [id]: v }))} />
                </div>
              ))}
            </div>
          </div>
        </section>
        <p className="tel-why">
          <Gauge className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{p.lesson}</span>
        </p>
        <p className="text-[11px] text-muted-foreground italic">{book.model}</p>
      </div>
    </div>
  )
}
