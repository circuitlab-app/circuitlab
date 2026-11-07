import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PartData } from '@/circuit/types'
import { useSimulation } from '@/store/simulation'
import { canvasScale, useFrameLoop, useLive } from './loop'

/*
 * The oscilloscope's screen: a green phosphor trace of the voltage on its
 * probe over the last few seconds, drawn on a small 2D canvas. It samples the
 * simulation about 30 times a second while something is changing, and stops
 * drawing once the trace has been flat for a whole screen.
 */

const FPS = 30
/** boxes across and down */
const COLS = 6
const ROWS = 4
/** volts per box the screen picks from, smallest first */
const SCALES = [0.2, 0.5, 1, 2, 5] as const
const PHOSPHOR = '#7dffaa'

type Sample = { t: number; v: number }

/** The smallest volts-per-box that fits every sample, and where 0 V sits (in boxes from the top). */
function scaleFor(samples: Sample[]) {
  let low = 0
  let high = 0
  for (const s of samples) {
    low = Math.min(low, s.v)
    high = Math.max(high, s.v)
  }
  // signals that never go below 0 V get three boxes up; others get two each way
  const bipolar = low < -0.05
  const room = bipolar ? ROWS / 2 : ROWS - 1
  const needed = Math.max(high, -low) * 1.06
  const perBox = SCALES.find((s) => s * room >= needed) ?? SCALES[SCALES.length - 1]
  return { perBox, zero: bipolar ? ROWS / 2 : ROWS - 1 }
}

const formatScale = (v: number) => `${v < 1 ? v.toFixed(1).replace(/^0/, '') : v}V`

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(110, 255, 160, 0.11)'
  ctx.beginPath()
  for (let i = 1; i < COLS; i++) {
    const x = Math.round((i * w) / COLS) + 0.5
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
  }
  for (let i = 1; i < ROWS; i++) {
    const y = Math.round((i * h) / ROWS) + 0.5
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
  }
  ctx.stroke()
  // little ticks along the middle lines, like the screen's printed scale
  ctx.strokeStyle = 'rgba(110, 255, 160, 0.2)'
  ctx.beginPath()
  const cx = Math.round(w / 2) + 0.5
  const cy = Math.round(h / 2) + 0.5
  for (let i = 1; i < COLS * 5; i++) {
    const x = Math.round((i * w) / (COLS * 5)) + 0.5
    ctx.moveTo(x, cy - 1.5)
    ctx.lineTo(x, cy + 1.5)
  }
  for (let i = 1; i < ROWS * 5; i++) {
    const y = Math.round((i * h) / (ROWS * 5)) + 0.5
    ctx.moveTo(cx - 1.5, y)
    ctx.lineTo(cx + 1.5, y)
  }
  ctx.stroke()
}

export function ScopeFace({ id, data }: { id: string; data: PartData }) {
  const ref = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const samples = useRef<Sample[]>([])
  const size = useRef({ w: 0, h: 0, scale: 2 })
  const running = useSimulation((s) => s.running)
  const connected = useSimulation((s) => s.result.parts[id] !== undefined)
  // a flat trace for a whole screen needs no more drawing, until the voltage moves again
  const [settled, setSettled] = useState(false)
  const span = data.span ?? 5
  // a new width of the screen starts drawing again
  const [drawnSpan, setDrawnSpan] = useState(span)
  if (span !== drawnSpan) {
    setDrawnSpan(span)
    setSettled(false)
  }

  const draw = (now: number) => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return
    const { w, h, scale } = size.current
    if (w === 0) return
    const t = now / 1000
    const list = samples.current
    const live = useSimulation.getState()
    const r = live.result.parts[id]
    if (live.running && r) {
      list.push({ t, v: Number.isFinite(r.voltage) ? r.voltage : 0 })
    }
    // keep one sample from before the window, so the line starts at the left edge
    while (list.length > 2 && list[1].t < t - span) list.shift()

    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.clearRect(0, 0, w, h)
    drawGrid(ctx, w, h)

    const { perBox, zero } = scaleFor(list)
    const boxH = h / ROWS
    const y = (v: number) => zero * boxH - (v / perBox) * boxH
    const x = (time: number) => ((time - (t - span)) / span) * w

    // the 0 V line is a little brighter
    ctx.strokeStyle = 'rgba(110, 255, 160, 0.28)'
    ctx.beginPath()
    ctx.moveTo(0, Math.round(y(0)) + 0.5)
    ctx.lineTo(w, Math.round(y(0)) + 0.5)
    ctx.stroke()

    if (list.length > 0) {
      // each sample holds until the next one, like the simulation's steps
      ctx.beginPath()
      ctx.moveTo(Math.max(0, x(list[0].t)), y(list[0].v))
      for (let i = 1; i < list.length; i++) {
        const px = x(list[i].t)
        ctx.lineTo(px, y(list[i - 1].v))
        ctx.lineTo(px, y(list[i].v))
      }
      const last = list[list.length - 1]
      ctx.lineTo(Math.min(w, x(t)), y(last.v))
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      // a soft glow, then the bright core of the beam
      ctx.strokeStyle = 'rgba(70, 255, 130, 0.35)'
      ctx.lineWidth = 3.6
      ctx.stroke()
      ctx.strokeStyle = PHOSPHOR
      ctx.lineWidth = 1.4
      ctx.stroke()
      // the beam's spot, where the newest sample is being drawn
      const spotX = Math.min(w - 1.5, x(t))
      ctx.fillStyle = '#eafff1'
      ctx.shadowColor = '#5dff99'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(spotX, y(last.v), 1.7, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }

    // volts per box and seconds across the screen, in the corners
    ctx.font = '600 8px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.fillStyle = 'rgba(150, 255, 185, 0.75)'
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'
    ctx.fillText(formatScale(perBox), 3, 3)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`${span}s`, w - 3, h - 2)

    // flat for a whole screen: nothing will change until the voltage does
    if (list.length > 1 && list[0].t <= t - span + 0.05) {
      const first = list[list.length - 1].v
      if (list.every((s) => Math.abs(s.v - first) < 1e-3)) setSettled(true)
    }
  }

  const live = useLive(ref, running && connected && !settled)
  useFrameLoop(live, FPS, draw)
  // effects below draw one frame with the latest settings
  const latest = useRef(draw)
  useLayoutEffect(() => {
    latest.current = draw
  })

  // wake up as soon as the probe sees a new voltage
  useEffect(
    () =>
      useSimulation.subscribe((s, prev) => {
        const now = s.result.parts[id]?.voltage
        if (now !== prev.result.parts[id]?.voltage || s.running !== prev.running) setSettled(false)
      }),
    [id],
  )


  // the canvas matches the screen's size, with extra pixels so zooming in stays sharp
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const resize = () => {
      const scale = canvasScale()
      const w = el.clientWidth
      const h = el.clientHeight
      size.current = { w, h, scale }
      el.width = Math.round(w * scale)
      el.height = Math.round(h * scale)
      latest.current(performance.now())
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // a stopped simulation clears the trace
  useEffect(() => {
    if (running) return
    samples.current = []
    latest.current(performance.now())
  }, [running])

  return (
    <div ref={ref} className="scope-face" dir="ltr">
      <div className={running && connected ? 'scope-screen scope-screen--on' : 'scope-screen'}>
        <canvas ref={canvas} className="absolute inset-0 size-full" aria-hidden />
      </div>
      <div className="scope-panel" aria-hidden>
        <span className={running && connected ? 'scope-led scope-led--on' : 'scope-led'} />
        <span className="scope-knob" />
        <span className="scope-knob scope-knob--small" />
        <span className="scope-jack" />
      </div>
    </div>
  )
}
