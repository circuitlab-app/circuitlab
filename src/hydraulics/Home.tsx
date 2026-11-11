import { Droplets } from 'lucide-react'
import { useState } from 'react'
import { Chips, Range, Readouts } from '@/telecom/Waves'
import { FIXTURE_IDS, FLOORS, homeWater, PIPE_MM, SOURCE_IDS, type Comfort, type FixtureId, type Outlet, type SourceId } from './model'
import { AMBER, GREEN, RED, useHydraulicsBook, WATER } from './ui'

/* A building's water: one main pipe, four floors, thirteen outlets, solved as a network every time a tap is turned. */

const EMOJI: Record<FixtureId | 'hose', string> = { shower: '🚿', tap: '🚰', washer: '🧺', hose: '🌱' }
const TONE: Record<Comfort, string> = { good: GREEN, weak: AMBER, trickle: RED, dry: RED }
const ALL: Outlet[] = ['hose', ...Array.from({ length: FLOORS }, (_, f) => FIXTURE_IDS.map((id): Outlet => `${f}:${id}`)).flat()]
const PRESETS: Record<'quiet' | 'morning' | 'garden' | 'all', Outlet[]> = {
  quiet: ['3:shower'],
  morning: ['0:shower', '1:shower', '2:shower', '3:shower', '1:tap', '2:washer'],
  garden: ['hose', '3:shower'],
  all: ALL,
}

const RISER = 150
const GROUND = 340
const STOREY = 65
/** The height of a floor's branch pipe on the drawing. */
const branchY = (floor: number) => GROUND - floor * STOREY - 24
const FIXTURE_X: Record<FixtureId, number> = { shower: 270, tap: 370, washer: 470 }
const HOSE_X = 598

/** A pipe, with dots that run along it when water flows (backwards for a negative flow). */
function Pipe({ d, lpm = 0, width = 7 }: { d: string; lpm?: number; width?: number }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke="currentColor" strokeOpacity={0.7} strokeWidth={width + 4} />
      <path d={d} stroke={WATER} strokeWidth={width} />
      {Math.abs(lpm) > 0.05 ? (
        <path
          d={d}
          className="wire-flow"
          style={{ stroke: 'white', strokeWidth: 3, strokeDasharray: '1 17', animationDuration: `${Math.max(0.12, 6 / (Math.abs(lpm) + 2))}s`, animationDirection: lpm < 0 ? 'reverse' : 'normal' }}
        />
      ) : null}
    </g>
  )
}

export function Home() {
  const { book, num } = useHydraulicsBook()
  const h = book.home
  const [source, setSource] = useState<SourceId>('city')
  const [cityBar, setCityBar] = useState(3)
  const [pipeMm, setPipeMm] = useState(16)
  const [open, setOpen] = useState<Outlet[]>(PRESETS.quiet)
  const water = homeWater({ source, cityBar, pipeMm, open })
  const toggle = (outlet: Outlet) => setOpen((list) => (list.includes(outlet) ? list.filter((o) => o !== outlet) : [...list, outlet]))
  const floorName = (f: number) => (f === 0 ? h.ground : `${h.floor} ${f}`)

  const outlet = (id: Outlet, kind: FixtureId | 'hose', x: number, y: number) => {
    const state = water.outlets[id]
    const tone = state ? TONE[state.comfort] : undefined
    return (
      <g
        key={id}
        role="button"
        tabIndex={0}
        aria-pressed={Boolean(state)}
        aria-label={`${h.fixtures[kind]}${state ? ` · ${h.comfort[state.comfort]}` : ''}`}
        onClick={() => toggle(id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggle(id)
          }
        }}
        className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-[var(--ring)]"
        transform={`translate(${x} ${y})`}
      >
        <title>{h.fixtures[kind]}</title>
        {state ? <circle r={25} fill={tone} fillOpacity={0.25} /> : null}
        <circle r={19} fill="var(--card)" stroke={tone ?? 'currentColor'} strokeOpacity={tone ? 1 : 0.35} strokeWidth={tone ? 3.5 : 2} />
        <text y={7} textAnchor="middle" fontSize={19} opacity={state ? 1 : 0.45}>
          {EMOJI[kind]}
        </text>
        {state ? (
          <text y={-24} textAnchor="middle" className="tel-annot__small" style={{ fill: tone }}>
            {num(state.lpm, 1)} L/min
          </text>
        ) : null}
      </g>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <p className="max-w-3xl text-[14px] leading-relaxed">{h.intro}</p>
        <section className="tel-card grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            <div className="tel-stage" dir="ltr">
              <svg viewBox="0 0 640 400" className="w-full" role="group" aria-label={book.modes.home}>
                {/* the building */}
                <rect x={130} y={GROUND - FLOORS * STOREY} width={420} height={FLOORS * STOREY} rx={4} fill="var(--card)" fillOpacity={0.6} stroke="currentColor" strokeWidth={2.5} />
                <line x1={0} x2={640} y1={GROUND} y2={GROUND} stroke="currentColor" strokeWidth={2.5} />
                {Array.from({ length: FLOORS }, (_, f) => (
                  <g key={f}>
                    {f ? <line x1={130} x2={550} y1={GROUND - f * STOREY} y2={GROUND - f * STOREY} stroke="currentColor" strokeOpacity={0.35} /> : null}
                    <text x={166} y={GROUND - f * STOREY - 46} className="tel-annot__tiny">
                      {floorName(f)}
                    </text>
                    <text x={166} y={GROUND - f * STOREY - 33} className="tel-annot__small" style={{ fill: water.bar[f] >= 1.5 ? GREEN : water.bar[f] >= 0.7 ? AMBER : RED }}>
                      {num(water.bar[f], 2)} bar
                    </text>
                  </g>
                ))}
                {/* where the water comes from */}
                {source === 'city' ? (
                  <>
                    <Pipe d={`M0 372 H${RISER} V${branchY(0)}`} lpm={water.riser[0]} width={9} />
                    <text x={60} y={392} textAnchor="middle" className="tel-annot__small">
                      {num(cityBar, 1)} bar
                    </text>
                  </>
                ) : source === 'roof' ? (
                  <>
                    <rect x={160} y={30} width={90} height={38} rx={4} fill={WATER} fillOpacity={0.7} stroke="currentColor" strokeWidth={2.5} />
                    <path d="M170 68 V80 M240 68 V80" stroke="currentColor" strokeWidth={3} />
                    <Pipe d={`M${RISER} 55 V${branchY(3)}`} lpm={water.riser[0]} />
                    <path d={`M${RISER} 55 H160`} stroke={WATER} strokeWidth={7} />
                  </>
                ) : (
                  <>
                    <rect x={14} y={346} width={70} height={40} rx={4} fill={WATER} fillOpacity={0.7} stroke="currentColor" strokeWidth={2.5} />
                    <Pipe d={`M84 372 H${RISER} V${branchY(0)}`} lpm={water.riser[0]} />
                    <circle cx={112} cy={372} r={15} fill="var(--card)" stroke="currentColor" strokeWidth={2.5} />
                    <path d="M105 380 L112 362 L119 380 Z" fill={water.riser[0] > 0.05 ? GREEN : 'currentColor'} transform="rotate(90 112 372)" />
                  </>
                )}
                {/* the main pipe between floors, then each floor's branch */}
                {[0, 1, 2].map((f) => (
                  <Pipe key={f} d={`M${RISER} ${branchY(f)} V${branchY(f + 1)}`} lpm={water.riser[f + 1]} />
                ))}
                {Array.from({ length: FLOORS }, (_, f) => {
                  const here = open.filter((o) => (o === 'hose' ? 0 : Number(o.split(':')[0])) === f)
                  const far = Math.max(RISER, ...here.map((o) => (o === 'hose' ? HOSE_X : FIXTURE_X[o.split(':')[1] as FixtureId])))
                  const flow = here.reduce((sum, o) => sum + (water.outlets[o]?.lpm ?? 0), 0)
                  return (
                    <g key={f}>
                      <Pipe d={`M${RISER} ${branchY(f)} H${f ? 470 : HOSE_X}`} width={5} />
                      {flow > 0.05 ? (
                        <path
                          d={`M${RISER} ${branchY(f)} H${far}`}
                          className="wire-flow"
                          fill="none"
                          strokeLinecap="round"
                          style={{ stroke: 'white', strokeWidth: 3, strokeDasharray: '1 17', animationDuration: `${Math.max(0.12, 6 / (flow + 2))}s` }}
                        />
                      ) : null}
                      {FIXTURE_IDS.map((id) => outlet(`${f}:${id}`, id, FIXTURE_X[id], branchY(f)))}
                    </g>
                  )
                })}
                {outlet('hose', 'hose', HOSE_X, branchY(0))}
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">👆 {h.hint}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {(['good', 'weak', 'trickle'] as const).map((c) => (
                <span key={c} className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full" style={{ background: TONE[c] }} />
                  {h.comfort[c]}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[13px] font-semibold">{h.source}</p>
            <Chips value={source} options={SOURCE_IDS.map((id) => ({ id, label: h.sources[id].name }))} onChange={setSource} />
            <p className="text-xs leading-relaxed text-muted-foreground">{h.sources[source].text}</p>
            {source === 'city' ? <Range label={h.cityPressure} value={cityBar} shown={`${num(cityBar, 1)} bar`} min={1} max={6} step={0.1} onChange={setCityBar} /> : null}
            <p className="text-xs text-muted-foreground">{h.pipe}</p>
            <Chips value={String(pipeMm)} options={PIPE_MM.map((mm) => ({ id: String(mm), label: `\u200E⌀ ${mm} mm` }))} onChange={(mm) => setPipeMm(Number(mm))} />
            <p className="text-xs text-muted-foreground">{h.open}</p>
            <Chips<keyof typeof PRESETS | ''> value="" options={(['quiet', 'morning', 'garden', 'all'] as const).map((id) => ({ id, label: h.presets[id] }))} onChange={(id) => id && setOpen(PRESETS[id])} />
            <Readouts
              rows={[
                [h.total, `${num(water.total, 1)} L/min`],
                [h.perHour, `${num(water.total * 60)} L`],
                [`${h.pressure} · ${floorName(0)}`, `${num(water.bar[0], 2)} bar`],
                [`${h.pressure} · ${floorName(FLOORS - 1)}`, `${num(water.bar[FLOORS - 1], 2)} bar`],
              ]}
            />
            {open.length ? (
              <ul className="space-y-1 text-xs">
                {open.map((o) => {
                  const state = water.outlets[o]!
                  const kind = o === 'hose' ? 'hose' : (o.split(':')[1] as FixtureId)
                  return (
                    <li key={o} className="flex items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: TONE[state.comfort] }} />
                      <span className="min-w-0 flex-1 truncate">
                        {EMOJI[kind]} {h.fixtures[kind]}
                        {o === 'hose' ? '' : ` · ${floorName(Number(o.split(':')[0]))}`}
                      </span>
                      <span className="font-semibold">{h.comfort[state.comfort]}</span>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        </section>
        <div className="grid gap-3 md:grid-cols-3">
          {h.lessons.map((lesson) => (
            <p key={lesson} className="tel-why">
              <Droplets className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{lesson}</span>
            </p>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground italic">{book.model}</p>
      </div>
    </div>
  )
}
