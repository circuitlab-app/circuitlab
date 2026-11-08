import { useRef, type PointerEvent } from 'react'
import { useLab } from './store'
import { STATE_COLOR, usePipelineBook } from './ui'

/*
 * The run as bars on a clock, like a logic analyser's trace: one row per job,
 * a thin bar per matrix copy. The whole planned run shows faintly; what has
 * happened by now is filled in. Bars that overlap ran at the same time.
 * Dragging along it moves the clock.
 */

const TICKS = [5, 10, 15, 30, 60, 120, 300, 600]

export function TimelineStrip() {
  const { book, clock } = usePipelineBook()
  const timeline = useLab((s) => s.timeline)
  const started = useLab((s) => s.started)
  const t = useLab((s) => s.t)
  const seek = useLab((s) => s.seek)
  const track = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  if (!timeline?.triggered) return null

  const ends = Object.values(timeline.jobs).flatMap((j) => [j.end, j.ready, ...j.lanes.map((l) => l.end)])
  const latest = Math.max(0, ...ends.filter(Number.isFinite))
  const span = Math.max(10, Number.isFinite(timeline.end) ? timeline.end : Math.max(t, latest) + 15)
  const now = started ? Math.min(t, span) : 0
  const pct = (sec: number) => `${(Math.max(0, Math.min(sec, span)) / span) * 100}%`
  const width = (from: number, to: number) => `${(Math.max(0, Math.min(to, span) - Math.max(0, from)) / span) * 100}%`
  const step = TICKS.find((s) => span / s <= 7) ?? 600
  const ticks = Array.from({ length: Math.floor(span / step) + 1 }, (_, i) => i * step)

  const seekAt = (e: PointerEvent) => {
    const box = track.current?.getBoundingClientRect()
    if (!box) return
    seek(((e.clientX - box.left) / box.width) * span)
  }

  return (
    <section className="shrink-0 border-t bg-background px-3 pt-2 pb-2.5" aria-label={book.timeline.title}>
      <div className="mb-1.5 flex items-baseline gap-2">
        <h2 className="text-[12.5px] font-semibold">{book.timeline.title}</h2>
        <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground max-sm:hidden">{book.timeline.hint}</p>
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {clock(now)}
          {Number.isFinite(timeline.end) ? ` / ${clock(timeline.end)}` : ''}
        </span>
      </div>
      <div className="grid max-h-[22vh] grid-cols-[7.5rem_1fr] gap-x-2 overflow-y-auto" dir="ltr">
        <div aria-hidden />
        <div className="relative h-4 text-[10px] text-muted-foreground" aria-hidden>
          {ticks.map((tick, i) => (
            <span
              key={tick}
              className="absolute font-mono tabular-nums"
              style={{ left: pct(tick), transform: i === 0 ? undefined : 'translateX(-50%)' }}
            >
              {clock(tick)}
            </span>
          ))}
        </div>
        {timeline.order.map((id) => {
          const run = timeline.jobs[id]
          const lanes = run.lanes
          return (
            <div key={id} className="contents">
              <span className="truncate py-0.5 text-[11.5px] leading-[18px]" dir="auto" title={run.name}>
                {run.name}
              </span>
              <div className="pipe-gantt__row relative my-0.5 h-[18px] rounded">
                {run.review ? (
                  <>
                    <span
                      className="pipe-gantt__wait pipe-gantt__ghost"
                      style={{ left: pct(run.ready), width: width(run.ready, run.review.until) }}
                    />
                    {started && now > run.ready ? (
                      <span
                        className="pipe-gantt__wait"
                        style={{ left: pct(run.ready), width: width(run.ready, Math.min(now, run.review.until)) }}
                      />
                    ) : null}
                  </>
                ) : null}
                {!lanes.length && run.conclusion === 'skipped' && Number.isFinite(run.ready) ? (
                  <span
                    className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                    style={{ left: pct(run.ready), borderColor: 'var(--pipe-off)', opacity: started && now >= run.ready ? 1 : 0.35 }}
                  />
                ) : null}
                {lanes.map((lane, i) => {
                  const h = 100 / lanes.length
                  const top = `${i * h}%`
                  const height = `calc(${h}% - ${lanes.length > 1 ? 1 : 0}px)`
                  const color = started && now >= lane.end ? STATE_COLOR[lane.conclusion] : STATE_COLOR.running
                  return (
                    <span key={i} className="contents">
                      <span
                        className="pipe-gantt__ghost"
                        style={{ left: pct(lane.start), width: width(lane.start, lane.end), top, height }}
                      />
                      {started && now > lane.queued && now < lane.start ? (
                        <span
                          className="pipe-gantt__queued"
                          style={{ left: pct(lane.queued), width: width(lane.queued, now), top, height }}
                        />
                      ) : null}
                      {started && now > lane.start ? (
                        <span
                          className="pipe-gantt__bar"
                          style={{
                            left: pct(lane.start),
                            width: width(lane.start, Math.min(now, lane.end)),
                            top,
                            height,
                            background: color,
                          }}
                        />
                      ) : null}
                    </span>
                  )
                })}
                {started ? <span className="pipe-gantt__head" style={{ left: pct(now) }} aria-hidden /> : null}
              </div>
            </div>
          )
        })}
        <div aria-hidden />
        <div
          ref={track}
          role="slider"
          tabIndex={0}
          aria-label={book.controls.clock}
          aria-valuemin={0}
          aria-valuemax={Math.round(span)}
          aria-valuenow={Math.round(now)}
          aria-valuetext={clock(now)}
          className="pipe-gantt__scrub relative mt-1 h-3 cursor-ew-resize touch-none rounded-full"
          onPointerDown={(e) => {
            dragging.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            seekAt(e)
          }}
          onPointerMove={(e) => {
            if (dragging.current) seekAt(e)
          }}
          onPointerUp={() => {
            dragging.current = false
          }}
          onPointerCancel={() => {
            dragging.current = false
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') seek(now + 2)
            else if (e.key === 'ArrowLeft') seek(now - 2)
            else if (e.key === 'Home') seek(0)
            else if (e.key === 'End') seek(span)
            else return
            e.preventDefault()
          }}
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-[color-mix(in_oklch,var(--pipe-run)_40%,transparent)]"
            style={{ width: pct(now) }}
          />
          <span
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-[var(--pipe-run)] shadow"
            style={{ left: pct(now) }}
          />
        </div>
      </div>
    </section>
  )
}
