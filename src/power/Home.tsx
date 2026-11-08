import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { Readouts } from '@/telecom/Waves'
import { APPLIANCE_IDS, APPLIANCES, CIRCUIT_IDS, CIRCUITS, house, MAIN_AMPS, SHOCK_MA, touch, type ApplianceId } from './model'
import { usePowerBook } from './ui'

/* A home's panel: appliances, breakers sized for their wires, the main switch, and why earth and an RCD save lives. */

const EMOJI: Record<ApplianceId, string> = {
  lights: '💡',
  tv: '📺',
  fridge: '🧊',
  kettle: '🫖',
  microwave: '📦',
  washer: '🧺',
  iron: '👔',
  ac: '❄️',
  heater: '🚿',
  ev: '🚗',
}

export function Home() {
  const { book, num, digits } = usePowerBook()
  const h = book.home
  const [on, setOn] = useState<ApplianceId[]>(['lights', 'fridge', 'tv'])
  const [earth, setEarth] = useState(false)
  const [rcd, setRcd] = useState(true)
  const [wet, setWet] = useState(true)
  const [touched, setTouched] = useState(false)
  const panel = house(on)
  const shock = touch({ earth, rcd, wet })
  const toggle = (id: ApplianceId) => setOn((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
  const scaleX = (ma: number) => (Math.log10(Math.max(ma, 0.5)) / Math.log10(400)) * 100
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <p className="max-w-3xl text-[14px] leading-relaxed">{h.intro}</p>
        <section className="tel-card grid gap-5 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {APPLIANCE_IDS.map((id) => {
              const live = on.includes(id) && !panel.mainTripped && !panel.circuits[APPLIANCES[id].circuit].tripped
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on.includes(id)}
                  onClick={() => toggle(id)}
                  className={cn(
                    'rounded-xl border p-2.5 text-start transition',
                    on.includes(id) ? 'border-[var(--pipe-run)] bg-[color-mix(in_oklch,var(--pipe-run)_10%,transparent)]' : 'hover:bg-muted',
                    on.includes(id) && !live && 'border-[var(--pipe-bad)] bg-[color-mix(in_oklch,var(--pipe-bad)_10%,transparent)]',
                  )}
                >
                  <span className={cn('block text-2xl transition', live ? '' : 'opacity-40 grayscale')}>{EMOJI[id]}</span>
                  <span className="block text-[12.5px] font-medium">{h.appliances[id]}</span>
                  <span className="block font-mono text-[11px] text-muted-foreground" dir="ltr">
                    {digits(`${APPLIANCES[id].watts} W`)}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="space-y-2">
            <p className="text-[13px] font-semibold">{h.panel}</p>
            {CIRCUIT_IDS.map((id) => {
              const c = panel.circuits[id]
              const share = Math.min(1.3, c.amps / CIRCUITS[id].amps)
              return (
                <div key={id} className="grid grid-cols-[6.5rem_1fr_6.5rem] items-center gap-2 text-xs">
                  <span className="truncate">{h.circuits[id]}</span>
                  <span className="h-3 overflow-hidden rounded-full bg-muted" dir="ltr">
                    <span className="block h-full rounded-full" style={{ width: `${Math.min(100, share * 100)}%`, background: c.tripped ? 'var(--pipe-bad)' : share > 0.8 ? 'var(--pipe-run)' : 'var(--pipe-ok)' }} />
                  </span>
                  <span className="font-mono" dir="ltr">
                    {digits(`${c.amps.toFixed(1)} / ${CIRCUITS[id].amps} A`)}
                    {c.tripped ? ` ⚡` : ''}
                  </span>
                </div>
              )
            })}
            <div
              className="rounded-lg px-2.5 py-1.5 text-[13px]"
              style={{ background: `color-mix(in oklch, ${panel.mainTripped ? 'var(--pipe-bad)' : 'var(--pipe-ok)'} 14%, transparent)` }}
            >
              <b>{h.main}: </b>
              {panel.mainTripped ? h.mainTripped : `${h.ok} · ${digits(`${panel.total.toFixed(1)} / ${MAIN_AMPS} A`)}`}
            </div>
            {CIRCUIT_IDS.some((id) => panel.circuits[id].tripped) ? (
              <p className="text-xs text-[var(--pipe-bad)]">
                ⚡ {h.tripped}: {CIRCUIT_IDS.filter((id) => panel.circuits[id].tripped).map((id) => `${h.circuits[id]} (${CIRCUITS[id].amps} A · ${CIRCUITS[id].mm2} mm²)`).join('، ')}
              </p>
            ) : null}
            <Readouts
              rows={[
                [h.total, `${panel.total.toFixed(1)} A`],
                [h.kwhDay, `${panel.kwhDay.toFixed(1)} kWh`],
                [h.kwhMonth, `${Math.round(panel.kwhDay * 30)} kWh`],
              ]}
            />
          </div>
        </section>

        <section className="tel-card space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShieldCheck className="size-5 text-[var(--pipe-ok)]" aria-hidden />
            {h.safety.title}
          </h2>
          <p className="max-w-3xl text-[13px] leading-relaxed">{h.safety.text}</p>
          <div className="flex flex-wrap gap-4 text-[13px]">
            {(
              [
                [h.safety.earth, earth, setEarth],
                [h.safety.rcd, rcd, setRcd],
                [h.safety.wet, wet, setWet],
              ] as const
            ).map(([label, value, set]) => (
              <label key={label} className="flex items-center gap-2">
                <Switch
                  checked={value}
                  onCheckedChange={(v) => {
                    set(v)
                    setTouched(false)
                  }}
                />
                {label}
              </label>
            ))}
            <button type="button" onClick={() => setTouched(true)} className="rounded-lg bg-primary px-3 py-1 font-semibold text-primary-foreground">
              ✋ {h.safety.touch}
            </button>
          </div>
          {touched ? (
            <p
              className="rounded-lg px-3 py-2 text-[13px] font-semibold"
              style={{ background: `color-mix(in oklch, ${shock.outcome === 'earth' || shock.outcome === 'rcd' ? 'var(--pipe-ok)' : 'var(--pipe-bad)'} 15%, transparent)` }}
            >
              {h.safety.outcomes[shock.outcome]} {shock.bodyMa ? digits(`(${Math.round(shock.bodyMa)} mA)`) : ''}
            </p>
          ) : null}
          <div className="relative h-14" dir="ltr">
            <div className="absolute inset-x-0 top-5 h-3 rounded-full" style={{ background: 'linear-gradient(90deg, #10a37a, #eab308 45%, #ef4444 70%, #7f1d1d)' }} />
            {SHOCK_MA.map((ma, i) => (
              <div key={ma} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${scaleX(ma)}%` }}>
                <span className="block font-mono text-[10px] font-semibold">{num(ma)} mA</span>
                <span className="mx-auto mt-0.5 block h-5 w-px bg-foreground/50" />
                <span className="block max-w-20 text-[10px] leading-tight text-muted-foreground">{h.safety.levels[i]}</span>
              </div>
            ))}
            {touched && shock.bodyMa ? (
              <span className="absolute top-3 size-5 -translate-x-1/2 rounded-full border-2 border-background bg-foreground" style={{ left: `${Math.min(100, scaleX(shock.bodyMa))}%` }} />
            ) : null}
          </div>
        </section>
        <p className="pt-6 text-[11px] text-muted-foreground italic">{book.model}</p>
      </div>
    </div>
  )
}
