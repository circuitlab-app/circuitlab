import { Waves } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Chips, Range, Readouts } from '@/telecom/Waves'
import { BOWL_M, HOUSE_IDS, HOUSE_M, PUMP_MODES, towerDay, type PumpMode } from './model'
import { AMBER, DEEP, GREEN, RED, useHydraulicsBook, WATER } from './ui'

/* A town and its water tower through a day: the pump fills, the people empty, and height is pressure. */

const HOUSE_X = { valley: 270, mid: 400, hill: 530 }
/** The scene's scale, px per metre, and its ground line. */
const PX = 2.3
const BASE = 205

export function City() {
  const { book, num } = useHydraulicsBook()
  const c = book.city
  const [people, setPeople] = useState(5000)
  const [pumpM3h, setPump] = useState(60)
  const [volumeM3, setVolume] = useState(500)
  const [heightM, setHeight] = useState(45)
  const [mode, setMode] = useState<PumpMode>('auto')
  const [hour, setHour] = useState(19)
  const town = useMemo(() => towerDay({ people, pumpM3h, volumeM3, heightM, mode }), [people, pumpM3h, volumeM3, heightM, mode])
  const now = town.day[hour]
  const top = Math.max(pumpM3h, ...town.day.map((h) => h.demand)) * 1.1
  const X = (h: number) => 40 + (h / 23) * 520
  const Y = (m3h: number) => 205 - (m3h / top) * 180
  const lowest = Math.min(...town.day.map((h) => h.bar.hill))
  const status = town.shortage > 0 ? c.status.empty : town.spill > 1 ? c.status.spill : lowest < 1 ? c.status.low : c.status.ok
  const good = town.shortage === 0 && town.spill <= 1 && lowest >= 1
  const bowl = BASE - heightM * PX
  const surface = bowl - BOWL_M * PX * now.level
  const pumping = now.pump > 0
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <p className="max-w-3xl text-[14px] leading-relaxed">{c.intro}</p>
        <section className="tel-card grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            {/* the town: tower, the slope and three houses */}
            <div className="tel-stage" dir="ltr">
              <svg viewBox="0 0 600 240" className="w-full" role="img" aria-label={c.tower}>
                <path d={`M0 ${BASE} H${HOUSE_X.valley + 40} C${HOUSE_X.mid - 40} ${BASE} ${HOUSE_X.mid - 40} ${BASE - HOUSE_M.mid * PX} ${HOUSE_X.mid} ${BASE - HOUSE_M.mid * PX} S${HOUSE_X.hill - 50} ${BASE - HOUSE_M.hill * PX} ${HOUSE_X.hill - 20} ${BASE - HOUSE_M.hill * PX} H600 V240 H0 Z`} fill={GREEN} fillOpacity={0.25} stroke={GREEN} strokeWidth={2} />
                {/* the level the water would rise to in any pipe */}
                <line x1={105} x2={600} y1={surface} y2={surface} stroke={WATER} strokeWidth={1.5} strokeDasharray="6 5" />
                <path d={`M70 ${BASE} L84 ${bowl + 14} M130 ${BASE} L116 ${bowl + 14} M100 ${BASE} V${bowl + 14}`} stroke="currentColor" strokeWidth={4} fill="none" />
                <rect x={62} y={bowl - BOWL_M * PX - 4} width={76} height={BOWL_M * PX + 18} rx={8} fill="var(--card)" stroke="currentColor" strokeWidth={3} />
                <rect x={65} y={surface} width={70} height={bowl + 11 - surface} rx={5} fill={WATER} fillOpacity={0.85} />
                <text x={100} y={bowl - BOWL_M * PX - 10} textAnchor="middle" className="tel-annot__small">
                  {num(now.level * 100)}% · {num(heightM)} m
                </text>
                <circle cx={30} cy={BASE - 12} r={12} fill={pumping ? GREEN : 'var(--card)'} stroke="currentColor" strokeWidth={2.5} />
                <path d={`M42 ${BASE - 12} H100`} stroke={pumping ? WATER : 'currentColor'} strokeWidth={4} strokeOpacity={pumping ? 1 : 0.4} />
                {pumping ? <path d={`M42 ${BASE - 12} H100 V${bowl}`} fill="none" className="wire-flow" strokeLinecap="round" style={{ stroke: 'white', strokeWidth: 3, strokeDasharray: '1 17', animationDuration: '0.4s' }} /> : null}
                <text x={30} y={BASE + 16} textAnchor="middle" className="tel-annot__tiny">
                  {pumping ? `${num(pumpM3h)} m³/h` : '⏸'}
                </text>
                {HOUSE_IDS.map((id) => {
                  const y = BASE - HOUSE_M[id] * PX
                  const bar = now.bar[id]
                  const tone = bar >= 1.5 ? GREEN : bar >= 0.7 ? AMBER : RED
                  return (
                    <g key={id}>
                      <text x={HOUSE_X[id]} y={y - 2} textAnchor="middle" fontSize={30}>
                        🏠
                      </text>
                      {bar > 0 ? <line x1={HOUSE_X[id] + 22} x2={HOUSE_X[id] + 22} y1={y - 4} y2={Math.min(y - 4, surface)} stroke={tone} strokeWidth={3} /> : null}
                      <text x={HOUSE_X[id]} y={y + 16} textAnchor="middle" className="tel-annot__small" style={{ fill: tone }}>
                        {bar > 0.05 ? `${num(bar, 1)} bar` : `✕ ${c.noWater}`}
                      </text>
                      <text x={HOUSE_X[id]} y={y + 29} textAnchor="middle" className="tel-annot__tiny">
                        {`${c.houses[id]}\u200E · ${HOUSE_M[id]} m`}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
            {/* the day: use, pumping and how full the tower is */}
            <div className="tel-stage" dir="ltr">
              <svg viewBox="0 0 600 240" className="w-full" role="img" aria-label={c.demand}>
                {town.day.map((h) => (
                  <g key={h.hour}>
                    <rect x={X(h.hour) - 9} y={Y(h.demand)} width={18} height={205 - Y(h.demand)} rx={2} fill={h.shortage > 0 ? RED : AMBER} fillOpacity={h.hour === hour ? 1 : 0.55} />
                    {h.pump > 0 ? <rect x={X(h.hour) - 9} y={Y(h.pump)} width={18} height={3} fill={GREEN} /> : null}
                  </g>
                ))}
                <polyline points={town.day.map((h) => `${X(h.hour)},${205 - h.level * 180}`).join(' ')} fill="none" stroke={DEEP} strokeWidth={3} strokeLinejoin="round" />
                <line x1={X(hour)} x2={X(hour)} y1={14} y2={205} stroke="currentColor" strokeWidth={1.5} />
                <line x1={30} x2={570} y1={205} y2={205} className="tel-scope__axis" />
                {[0, 6, 12, 18, 23].map((h) => (
                  <text key={h} x={X(h)} y={222} textAnchor="middle" className="tel-annot__tiny">
                    {h}:00
                  </text>
                ))}
                <text x={596} y={29} textAnchor="end" className="tel-annot__tiny" style={{ fill: DEEP }}>
                  100%
                </text>
                <text x={4} y={Y(top / 1.1) + 3} className="tel-annot__tiny">
                  {num(top / 1.1)}
                </text>
              </svg>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {(
                [
                  [AMBER, `${c.demand} (m³/h)`],
                  [GREEN, `${c.pumping} (m³/h)`],
                  [DEEP, `${c.level} (%)`],
                ] as const
              ).map(([color, text]) => (
                <span key={text} className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full" style={{ background: color }} />
                  {text}
                </span>
              ))}
            </div>
            <Range label={c.hour} value={hour} shown={`${hour}:00`} min={0} max={23} step={1} onChange={setHour} />
          </div>
          <div className="space-y-3">
            <p className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold" style={{ background: `color-mix(in oklch, ${good ? 'var(--pipe-ok)' : 'var(--pipe-bad)'} 14%, transparent)` }}>
              {status}
            </p>
            <Range label={c.people} value={people} shown={num(people)} min={1000} max={20000} step={500} onChange={setPeople} />
            <Range label={c.pumpRate} value={pumpM3h} shown={`${num(pumpM3h)} m³/h`} min={10} max={300} step={5} onChange={setPump} />
            <Range label={c.volume} value={volumeM3} shown={`${num(volumeM3)} m³`} min={100} max={3000} step={50} onChange={setVolume} />
            <Range label={c.height} value={heightM} shown={`${num(heightM)} m`} min={10} max={60} step={1} onChange={setHeight} />
            <p className="text-xs text-muted-foreground">{c.pump}</p>
            <Chips value={mode} options={PUMP_MODES.map((id) => ({ id, label: c.pumpModes[id] }))} onChange={setMode} />
            <Readouts
              rows={[
                [`${c.demand} · ${hour}:00`, `${num(now.demand)} m³/h`],
                [c.level, `${num(now.level * 100)}%`],
                [c.used, `${num(people * 0.2)} m³`],
                [c.kwh, `${num(town.kwh)} kWh`],
              ]}
            />
          </div>
        </section>
        <p className="tel-why">
          <Waves className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{c.lesson}</span>
        </p>
        <p className="text-[11px] text-muted-foreground italic">{book.model}</p>
      </div>
    </div>
  )
}
