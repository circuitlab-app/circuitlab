import { BatteryMedium, Footprints, Plus, RadioTower, RotateCcw, Smartphone, Square, Trash } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { Bars } from './CallBoard'
import { downloadSeconds, GENS, serviceAt, type Band5g, type Gen } from './radio'
import { BUILDINGS, CITY, ROUTE, useTelecom } from './store'
import { GEN_COLOR, useTelecomBook } from './ui'

/*
 * Towers and coverage: a small city with towers of different generations and
 * bands, buildings that block the signal, and a phone you can drag or send
 * for a walk. The map is coloured by the newest network you would get at
 * each spot, and the phone's status bar shows the letter, bars and speed.
 */

const SCALE = 100 // SVG units per km
const GRID = { x: 80, y: 51 }

function useHeat(canvas: React.RefObject<HTMLCanvasElement | null>) {
  const towers = useTelecom((s) => s.towers)
  const lteLabel = useTelecom((s) => s.lteLabel)
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, GRID.x, GRID.y)
    for (let gx = 0; gx < GRID.x; gx++) {
      for (let gy = 0; gy < GRID.y; gy++) {
        const s = serviceAt(((gx + 0.5) / GRID.x) * CITY.w, ((gy + 0.5) / GRID.y) * CITY.h, towers, BUILDINGS, lteLabel)
        if (!s.gen) continue
        ctx.globalAlpha = 0.14 + s.bars * 0.1
        ctx.fillStyle = GEN_COLOR[s.gen]
        ctx.fillRect(gx, gy, 1, 1)
      }
    }
  }, [canvas, towers, lteLabel])
}

function TowerEditor() {
  const { book } = useTelecomBook()
  const tower = useTelecom((s) => s.towers.find((t) => t.id === s.tower))
  const { updateTower, removeTower } = useTelecom.getState()
  if (!tower) return null
  const toggle = (gen: Gen) =>
    updateTower(tower.id, { gens: tower.gens.includes(gen) ? tower.gens.filter((g) => g !== gen) : [...tower.gens, gen].sort() })
  return (
    <section className="space-y-2.5 rounded-xl border p-3">
      <h3 className="flex items-center gap-1.5 text-[13px] font-semibold">
        <RadioTower className="size-4" aria-hidden />
        {book.map.tower} {tower.id}
      </h3>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{book.map.gens}</p>
        <div className="flex gap-1" dir="ltr">
          {GENS.map((gen) => (
            <button
              key={gen}
              type="button"
              aria-pressed={tower.gens.includes(gen)}
              onClick={() => toggle(gen)}
              className={cn('flex-1 rounded-md border py-1 text-xs font-semibold uppercase transition', !tower.gens.includes(gen) && 'opacity-45')}
              style={tower.gens.includes(gen) ? { borderColor: GEN_COLOR[gen], color: GEN_COLOR[gen] } : undefined}
            >
              {gen}
            </button>
          ))}
        </div>
      </div>
      {tower.gens.includes('5g') ? (
        <label className="grid grid-cols-[5rem_1fr] items-center gap-2 text-xs">
          <span className="text-muted-foreground">{book.map.band}</span>
          <Select value={tower.band5g} onValueChange={(band) => updateTower(tower.id, { band5g: band as Band5g })}>
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {(['low', 'mid', 'high'] as Band5g[]).map((b) => (
                <SelectItem key={b} value={b}>
                  {book.map.bands[b]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      ) : null}
      {tower.gens.includes('4g') ? (
        <label className="flex items-center justify-between gap-2 text-xs">
          {book.map.aggregation}
          <Switch checked={tower.aggregation} onCheckedChange={(aggregation) => updateTower(tower.id, { aggregation })} />
        </label>
      ) : null}
      <label className="flex items-center justify-between gap-2 text-xs">
        {book.map.on}
        <Switch checked={tower.on} onCheckedChange={(on) => updateTower(tower.id, { on })} />
      </label>
      <Button variant="outline" size="sm" className="w-full text-destructive" onClick={() => removeTower(tower.id)}>
        <Trash className="size-3.5" aria-hidden />
        {book.map.remove}
      </Button>
    </section>
  )
}

export function CellMap() {
  const { book, num, time, speed, dir } = useTelecomBook()
  const towers = useTelecom((s) => s.towers)
  const phone = useTelecom((s) => s.phone)
  const lteLabel = useTelecom((s) => s.lteLabel)
  const selectedTower = useTelecom((s) => s.tower)
  const walking = useTelecom((s) => s.walking)
  const { setPhone, setLteLabel, selectTower, updateTower, addTower, resetTowers, setWalking, setWalkAt } = useTelecom.getState()
  const canvas = useRef<HTMLCanvasElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: string; moved: boolean } | null>(null)
  useHeat(canvas)

  const service = useMemo(() => serviceAt(phone.x, phone.y, towers, BUILDINGS, lteLabel), [phone, towers, lteLabel])

  // handovers: every time the serving tower changes
  const [handovers, setHandovers] = useState<{ from: string; to: string }[]>([])
  const serving = service.tower?.id ?? '—'
  const last = useRef(serving)
  useEffect(() => {
    if (last.current !== serving) {
      // read the ref now: the updater below runs later, after it has changed
      const from = last.current
      setHandovers((h) => [{ from, to: serving }, ...h].slice(0, 8))
      last.current = serving
    }
  }, [serving])

  // the walk: about 40 seconds from one end of town to the other
  useEffect(() => {
    if (!walking) return
    let frame = 0
    let before = performance.now()
    const loop = (now: number) => {
      const at = useTelecom.getState().walkAt + (now - before) / 40000
      before = now
      if (at >= 1) {
        setWalkAt(1)
        setWalking(false)
        return
      }
      setWalkAt(at)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [walking, setWalkAt, setWalking])

  const toKm = (e: PointerEvent) => {
    const box = svg.current!.getBoundingClientRect()
    return {
      x: Math.min(CITY.w, Math.max(0, ((e.clientX - box.left) / box.width) * CITY.w)),
      y: Math.min(CITY.h, Math.max(0, ((e.clientY - box.top) / box.height) * CITY.h)),
    }
  }
  const startDrag = (id: string) => (e: PointerEvent) => {
    e.stopPropagation()
    if (id === 'phone' && walking) setWalking(false)
    drag.current = { id, moved: false }
    svg.current?.setPointerCapture(e.pointerId)
  }
  const onMove = (e: PointerEvent) => {
    if (!drag.current) return
    drag.current.moved = true
    const at = toKm(e)
    if (drag.current.id === 'phone') setPhone(at)
    else updateTower(drag.current.id, at)
  }
  const onUp = () => {
    if (drag.current && !drag.current.moved && drag.current.id !== 'phone') selectTower(drag.current.id)
    drag.current = null
  }

  const icon = service.icon === 'none' ? book.map.noService : service.icon
  const color = service.gen ? GEN_COLOR[service.gen] : GEN_COLOR.none

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <div className="min-w-0 flex-1 p-3 lg:overflow-auto">
        <div className="relative mx-auto w-full max-w-[1100px] overflow-hidden rounded-xl border bg-[var(--board-bg)]" style={{ aspectRatio: `${CITY.w} / ${CITY.h}` }} dir="ltr">
          <canvas ref={canvas} width={GRID.x} height={GRID.y} className="absolute inset-0 h-full w-full" aria-hidden />
          <svg
            ref={svg}
            viewBox={`0 0 ${CITY.w * SCALE} ${CITY.h * SCALE}`}
            className="absolute inset-0 h-full w-full touch-none select-none"
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerDown={() => selectTower(null)}
            role="application"
            aria-label={book.modes.map}
          >
            {/* a 1 km grid */}
            {Array.from({ length: CITY.w + 1 }, (_, i) => (
              <line key={`x${i}`} x1={i * SCALE} x2={i * SCALE} y1={0} y2={CITY.h * SCALE} className="tel-map__grid" />
            ))}
            {Array.from({ length: Math.floor(CITY.h) + 1 }, (_, i) => (
              <line key={`y${i}`} y1={i * SCALE} y2={i * SCALE} x1={0} x2={CITY.w * SCALE} className="tel-map__grid" />
            ))}
            <polyline points={ROUTE.map(([x, y]) => `${x * SCALE},${y * SCALE}`).join(' ')} className="tel-map__route" />
            {BUILDINGS.map((b, i) => (
              <rect key={i} x={b.x * SCALE} y={b.y * SCALE} width={b.w * SCALE} height={b.h * SCALE} rx={3} className="tel-map__building" />
            ))}
            {service.tower ? (
              <line
                x1={phone.x * SCALE}
                y1={phone.y * SCALE}
                x2={service.tower.x * SCALE}
                y2={service.tower.y * SCALE}
                stroke={color}
                strokeWidth={3}
                strokeDasharray="8 6"
                className="tel-map__link"
              />
            ) : null}
            {towers.map((t) => (
              <g
                key={t.id}
                transform={`translate(${t.x * SCALE} ${t.y * SCALE})`}
                onPointerDown={startDrag(t.id)}
                className={cn('tel-map__tower', !t.on && 'opacity-40', t.id === selectedTower && 'tel-map__tower--selected')}
              >
                <circle r={17} />
                <path d="M0 -9 L-6 9 M0 -9 L6 9 M-4 3 H4 M0 -9 V-12" strokeWidth={2.2} fill="none" />
                <text y={33} textAnchor="middle">
                  {t.id} · {t.gens.map((g) => g[0]).join('/')}G
                  {t.gens.includes('5g') && t.band5g === 'high' ? '+' : ''}
                </text>
              </g>
            ))}
            <g transform={`translate(${phone.x * SCALE} ${phone.y * SCALE})`} onPointerDown={startDrag('phone')} className="tel-map__phone">
              <circle r={15} style={{ fill: color }} />
              <rect x={-5.5} y={-9} width={11} height={18} rx={2.5} />
            </g>
          </svg>
          <p className="pointer-events-none absolute start-2 bottom-2 rounded-md bg-background/85 px-2 py-1 text-[11px] text-muted-foreground" dir={dir}>
            {book.map.hint}
          </p>
        </div>
      </div>

      <aside className="space-y-3 border-t p-3 lg:w-[340px] lg:shrink-0 lg:overflow-y-auto lg:border-s lg:border-t-0">
        {/* the phone's status bar */}
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between bg-foreground px-3 py-1.5 text-background" dir="ltr">
            <span className="text-xs font-semibold tabular-nums">12:30</span>
            <span className="flex items-center gap-1.5 text-xs font-bold">
              <span style={{ color: service.gen ? color : undefined }}>{service.icon === 'none' ? '' : service.icon}</span>
              <Bars bars={service.bars} />
              <BatteryMedium className="size-4" aria-hidden />
            </span>
          </div>
          <div className="space-y-2 p-3">
            <p className="flex items-center gap-2">
              <Smartphone className="size-4 text-muted-foreground" aria-hidden />
              <span className="text-[15px] font-bold" style={{ color }} dir="ltr">
                {icon}
              </span>
              <span className="text-xs leading-snug text-muted-foreground">{book.map.icons[service.icon]}</span>
            </p>
            {service.tower ? (
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <dt className="text-muted-foreground">{book.map.serving}</dt>
                <dd className="font-mono" dir="ltr">
                  {service.tower.id} · {service.gen?.toUpperCase()}
                </dd>
                <dt className="text-muted-foreground">{book.map.distance}</dt>
                <dd className="font-mono" dir="ltr">
                  {num(service.km, 2)} km
                </dd>
                <dt className="text-muted-foreground">{book.map.walls}</dt>
                <dd className="font-mono">{num(service.walls)}</dd>
                <dt className="text-muted-foreground">{book.map.signal}</dt>
                <dd className="font-mono" dir="ltr">
                  {num(service.dbm)} dBm
                </dd>
                <dt className="text-muted-foreground">{book.map.modulation}</dt>
                <dd className="font-mono" dir="ltr">
                  {service.modulation}
                </dd>
                <dt className="text-muted-foreground">{book.map.speed}</dt>
                <dd className="font-mono" dir="ltr">
                  {speed(service.mbps)}
                </dd>
              </dl>
            ) : null}
            {service.tower ? <p className="text-xs text-muted-foreground">{book.map.song(time(downloadSeconds(5, service.mbps)))}</p> : null}
          </div>
        </section>

        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant={walking ? 'default' : 'outline'} onClick={() => setWalking(!walking)}>
            {walking ? <Square className="size-3.5" aria-hidden /> : <Footprints className="size-3.5" aria-hidden />}
            {walking ? book.map.stopWalk : book.map.walk}
          </Button>
          <Button size="sm" variant="outline" onClick={() => addTower({ x: CITY.w / 2, y: CITY.h / 2 })}>
            <Plus className="size-3.5" aria-hidden />
            {book.map.add}
          </Button>
          <Button size="sm" variant="ghost" onClick={resetTowers}>
            <RotateCcw className="size-3.5" aria-hidden />
            {book.map.reset}
          </Button>
        </div>

        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{book.map.lteLabel}</span>
          <ToggleGroup type="single" size="sm" variant="outline" value={lteLabel} onValueChange={(v) => v && setLteLabel(v as '4g' | 'lte')} dir="ltr">
            <ToggleGroupItem value="4g" className="px-2.5 text-xs font-semibold">
              4G
            </ToggleGroupItem>
            <ToggleGroupItem value="lte" className="px-2.5 text-xs font-semibold">
              LTE
            </ToggleGroupItem>
          </ToggleGroup>
        </label>

        <TowerEditor />

        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold">{book.map.legend}</h3>
          <div className="flex flex-wrap gap-2 text-xs" dir="ltr">
            {GENS.map((g) => (
              <span key={g} className="flex items-center gap-1">
                <span className="size-3 rounded-sm" style={{ background: GEN_COLOR[g] }} />
                {g.toUpperCase()}
              </span>
            ))}
            <span className="flex items-center gap-1" dir={dir}>
              <span className="size-3 rounded-sm border" />
              {book.map.noService}
            </span>
          </div>
        </section>

        <section className="space-y-1">
          <h3 className="text-xs font-semibold">{book.map.handovers}</h3>
          {handovers.length ? (
            <ol className="space-y-0.5 font-mono text-xs" dir="ltr">
              {handovers.map((h, i) => (
                <li key={i} className={cn(i > 0 && 'text-muted-foreground')}>
                  {book.map.handover(h.from, h.to)}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-muted-foreground">{book.map.none}</p>
          )}
        </section>
      </aside>
    </div>
  )
}
