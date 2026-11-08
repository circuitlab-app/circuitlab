import { Activity, Factory, House, PlugZap, Zap } from 'lucide-react'
import { useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Separator } from '@/components/ui/separator'
import { LabSwitcher } from '@/editor/LabSwitcher'
import { LanguageMenu, ThemeToggle } from '@/editor/TopBar'
import type { PowerMode, StageId } from '@/i18n/power/types'
import { cn } from '@/lib/utils'
import { Chips, Range, Readouts } from '@/telecom/Waves'
import { Basics } from './Basics'
import { Home } from './Home'
import { LINE_KV, lineAmps, transmission } from './model'
import { Plants } from './Plants'
import { usePowerBook } from './ui'

/*
 * The Power Lab: how electricity gets from a power plant to a socket. Four
 * sections: the journey through the grid (and why lines run at very high
 * voltage), AC and three-phase basics, balancing a grid through a day, and
 * the circuits and safety devices of a home.
 */

const MODES: PowerMode[] = ['grid', 'basics', 'plants', 'home']
const ICONS = { grid: Zap, basics: Activity, plants: Factory, home: House }

const usePower = create<{ mode: PowerMode; setMode: (mode: PowerMode) => void }>()(
  persist((set) => ({ mode: 'grid', setMode: (mode) => set({ mode }) }), {
    name: 'circuit-lab:power',
    version: 1,
    merge: (saved, current) => {
      const mode = (saved as { mode?: PowerMode } | undefined)?.mode
      return { ...current, mode: mode && MODES.includes(mode) ? mode : current.mode }
    },
  }),
)

/** Writes a current with a sensible unit: 812 A, 16.1 kA. */
const amps = (a: number) => (a >= 1000 ? `${(a / 1000).toFixed(1)} kA` : `${Math.round(a)} A`)

const STAGES: StageId[] = ['plant', 'stepUp', 'line', 'substation', 'distribution', 'pole', 'house']

function Grid() {
  const { book, num, digits } = usePowerBook()
  const g = book.grid
  const [mw, setMw] = useState(500)
  const [kv, setKv] = useState(400)
  const [km, setKm] = useState(200)
  const line = transmission(mw, kv, km)
  // the voltage on the wire after each stage, and the current it carries for this power
  const wires: { kv: number; label: string }[] = [
    { kv: 20, label: '20 kV' },
    { kv, label: `${kv} kV` },
    { kv, label: `${kv} kV` },
    { kv: 20, label: '20 kV' },
    { kv: 20, label: '20 kV' },
    { kv: 0.4, label: '400 / 230 V' },
  ]
  const x = (i: number) => 60 + i * 130
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <p className="max-w-3xl text-[14px] leading-relaxed">{g.intro}</p>
        <section className="tel-card">
          <div className="tel-stage" dir="ltr">
            <svg viewBox="0 0 900 230" className="w-full" role="img" aria-label={book.modes.grid}>
              {wires.map((w, i) => {
                const a = i === 5 ? 90 : lineAmps(mw, w.kv)
                const thick = Math.min(14, 2 + Math.log10(Math.max(a, 1)) * 2.4)
                return (
                  <g key={i}>
                    <line x1={x(i) + 26} x2={x(i + 1) - 26} y1={90} y2={90} stroke="var(--wire-outline)" strokeWidth={thick + 3} strokeLinecap="round" />
                    <line x1={x(i) + 26} x2={x(i + 1) - 26} y1={90} y2={90} stroke={w.kv >= 100 ? '#a855f7' : w.kv >= 10 ? '#f97316' : '#eab308'} strokeWidth={thick} strokeLinecap="round" />
                    <line
                      x1={x(i) + 26}
                      x2={x(i + 1) - 26}
                      y1={90}
                      y2={90}
                      className="wire-flow"
                      strokeLinecap="round"
                      style={{ strokeDasharray: '1 15', animationDuration: `${Math.max(0.15, 2.4 - Math.log10(a + 1) * 0.45)}s` }}
                    />
                    <text x={(x(i) + x(i + 1)) / 2} y={70} textAnchor="middle" className="tel-annot__small">
                      {digits(w.label)}
                    </text>
                    <text x={(x(i) + x(i + 1)) / 2} y={122} textAnchor="middle" className="tel-annot__tiny">
                      {i === 5 ? '≈ 20 A / home' : digits(amps(a))}
                    </text>
                  </g>
                )
              })}
              {STAGES.map((s, i) => (
                <g key={s} transform={`translate(${x(i)} 90)`}>
                  <circle r={24} fill="var(--card)" stroke="var(--tel-accent)" strokeWidth={2.5} />
                  <text y={6} textAnchor="middle" fontSize={20}>
                    {['🏭', '⬆️', '🗼', '🏗️', '🔌', '🔽', '🏠'][i]}
                  </text>
                  <text y={48} textAnchor="middle" className="tel-annot__small">
                    {g.stages[s].name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((s) => (
              <p key={s}>
                <b className="text-foreground">{g.stages[s].name}: </b>
                {g.stages[s].text}
              </p>
            ))}
          </div>
        </section>
        <section className="tel-card grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <Range label={g.power} value={mw} shown={`${num(mw)} MW`} min={50} max={1000} step={10} onChange={setMw} />
            <Range label={g.length} value={km} shown={`${num(km)} km`} min={10} max={500} step={10} onChange={setKm} />
            <p className="text-xs text-muted-foreground">{g.voltage}</p>
            <Chips value={String(kv)} options={LINE_KV.map((v) => ({ id: String(v), label: `${v} kV` }))} onChange={(v) => setKv(Number(v))} />
            <Readouts
              rows={[
                [g.current, amps(line.amps)],
                [g.loss, line.lossMw >= mw ? `> ${mw} MW` : `${line.lossMw.toFixed(1)} MW · ${(line.lossShare * 100).toFixed(1)}%`],
                [g.drop, `${Math.min(100, line.dropShare * 100).toFixed(1)}%`],
                [g.delivered, `${Math.max(0, mw - line.lossMw).toFixed(0)} MW`],
              ]}
            />
            <p
              className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold"
              style={{ background: `color-mix(in oklch, ${line.workable ? 'var(--pipe-ok)' : 'var(--pipe-bad)'} 14%, transparent)` }}
            >
              {line.workable ? g.workable : g.unworkable}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[13px] font-semibold">{g.chartTitle}</p>
            <div className="space-y-1.5" dir="ltr">
              {LINE_KV.map((v) => {
                const share = Math.min(1, transmission(mw, v, km).lossShare)
                return (
                  <button key={v} type="button" onClick={() => setKv(v)} className="grid w-full grid-cols-[4rem_1fr_3.5rem] items-center gap-2 text-xs">
                    <span className={cn('font-mono', v === kv && 'font-bold')}>{v} kV</span>
                    <span className="h-4 overflow-hidden rounded bg-muted">
                      <span className="block h-full rounded" style={{ width: `${Math.max(1, share * 100)}%`, background: share > 0.3 ? 'var(--pipe-bad)' : share > 0.08 ? 'var(--pipe-run)' : 'var(--pipe-ok)', outline: v === kv ? '2px solid var(--foreground)' : undefined }} />
                    </span>
                    <span className="text-end font-mono">{share >= 1 ? '>100%' : `${(share * 100).toFixed(1)}%`}</span>
                  </button>
                )
              })}
            </div>
            <p className="tel-why">
              <PlugZap className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{g.lesson}</span>
            </p>
          </div>
        </section>
        <p className="text-[11px] text-muted-foreground italic">{book.model}</p>
      </div>
    </div>
  )
}

export default function PowerLab() {
  const { book } = usePowerBook()
  const mode = usePower((s) => s.mode)
  const setMode = usePower((s) => s.setMode)
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-1 border-b bg-background px-2 sm:gap-2 sm:px-3">
        <h1 className="sr-only">{book.title}</h1>
        <LabSwitcher current="power" />
        <Separator orientation="vertical" className="mx-0.5 !h-6 max-sm:hidden" />
        <nav className="flex min-w-0 gap-0.5 overflow-x-auto" aria-label={book.title}>
          {MODES.map((id) => {
            const Icon = ICONS[id]
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                aria-current={id === mode ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition',
                  id === mode ? 'bg-[color-mix(in_oklch,var(--tel-accent)_14%,transparent)] text-[var(--tel-accent)]' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className={cn(id !== mode && 'max-md:hidden')}>{book.modes[id]}</span>
              </button>
            )
          })}
        </nav>
        <div className="ms-auto flex shrink-0 items-center gap-0.5 max-lg:hidden">
          <LanguageMenu />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">
        {mode === 'grid' ? <Grid /> : mode === 'basics' ? <Basics /> : mode === 'plants' ? <Plants /> : <Home />}
      </main>
    </div>
  )
}
