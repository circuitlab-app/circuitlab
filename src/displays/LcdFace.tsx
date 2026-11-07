import { useEffect, useRef } from 'react'
import { displayGeometry, lcdSize } from '@/circuit/display'
import type { PartData } from '@/circuit/types'
import { useI18n } from '@/i18n'
import { dotLit, fitsFont } from './font5x7'
import { canvasScale, useFrameLoop, useLive } from './loop'
import { NoPower } from './NoPower'
import { clockParts, fontFor, isRtl, useFontsReady } from './text'

/*
 * A 16 × 2 or 20 × 4 character LCD. Every letter sits in its own 5 × 8 box
 * of dots; English letters use the LCD's real dot font. Persian and Arabic
 * have no dot font on these screens, so they are drawn in Vazirmatn across
 * the line instead.
 */

/** card width minus padding, glass, bezel and board: the room left for the dots */
const CHROME = 18 + 12 + 16 + 8 + 8

const LOOK = {
  green: { ink: '#1d2a09', dot: 'rgba(29, 42, 9, 0.09)', off: 'rgba(0, 0, 0, 0.13)' },
  blue: { ink: '#eef4ff', dot: 'rgba(255, 255, 255, 0.07)', off: 'rgba(255, 255, 255, 0.05)' },
} as const

function scrolled(line: string, cols: number, step: number, rtl: boolean) {
  const loop = line + ' '.repeat(Math.max(3, cols - line.length + 1))
  const n = loop.length
  let out = ''
  for (let i = 0; i < cols; i++) out += loop[(((rtl ? i - step : i + step) % n) + n) % n]
  return out
}

export function LcdFace({ data, powered }: { data: PartData; powered: boolean }) {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const { cols, rows } = lcdSize(data)
  const tint = data.tint === 'blue' ? 'blue' : 'green'
  const mode = data.mode ?? 'text'
  const text = data.text ?? t.display.samples.lcd
  const fonts = useFontsReady(text)

  const room = displayGeometry(data).width - CHROME
  const pitch = room / (cols * 6 - 1)
  const width = (cols * 6 - 1) * pitch
  const height = (rows * 9 - 1) * pitch

  const draw = () => {
    const el = canvas.current
    if (!el) return
    const scale = canvasScale()
    if (el.width !== Math.round(width * scale)) el.width = Math.round(width * scale)
    if (el.height !== Math.round(height * scale)) el.height = Math.round(height * scale)
    const ctx = el.getContext('2d')!
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.clearRect(0, 0, width, height)
    const look = LOOK[tint]
    const now = new Date()
    const lines = text.split('\n')
    let shown: string[] = []
    if (powered) {
      if (mode === 'clock') {
        const { h, m, s } = clockParts(now)
        shown = [`${h}:${m}:${s}`, ...lines]
      } else if (mode === 'scroll') {
        const step = Math.floor(performance.now() / 350)
        shown = lines.map((line, i) => (i === 0 && fitsFont(line) ? scrolled(line, cols, step, false) : line))
      } else {
        shown = lines
      }
    }
    const dot = pitch * 0.84
    for (let r = 0; r < rows; r++) {
      const raw = shown[r] ?? ''
      const line = mode === 'clock' && r === 0 ? raw.padStart(Math.floor((cols + raw.length) / 2)) : raw
      const bitmap = fitsFont(line)
      const top = r * 9 * pitch
      for (let c = 0; c < cols; c++) {
        const char = bitmap ? (line[c] ?? ' ') : ' '
        for (let dx = 0; dx < 5; dx++) {
          for (let dy = 0; dy < 8; dy++) {
            const lit = powered && bitmap && dotLit(char, dx, dy)
            ctx.fillStyle = lit ? look.ink : powered ? look.dot : look.off
            ctx.fillRect((c * 6 + dx) * pitch, top + dy * pitch, dot, dot)
          }
        }
      }
      if (powered && !bitmap && line) {
        // Persian, Arabic and other scripts: smooth letters across the line
        const rtl = isRtl(line)
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, top - pitch, width, 9 * pitch)
        ctx.clip()
        ctx.font = fontFor(line, pitch * 7.6, 600)
        ctx.fillStyle = look.ink
        ctx.textBaseline = 'middle'
        ctx.direction = rtl ? 'rtl' : 'ltr'
        ctx.textAlign = rtl ? 'right' : 'left'
        let x = rtl ? width : 0
        if (mode === 'scroll' && r === 0) {
          // slide by whole letter boxes, like the real screen
          const box = 6 * pitch
          const span = ctx.measureText(line).width + width
          const offset = (Math.floor(performance.now() / 350) * box) % span
          x = rtl ? offset : width - offset
          ctx.textAlign = 'left'
          if (rtl) x -= ctx.measureText(line).width
        }
        ctx.fillText(line, x, top + 3.6 * pitch)
        ctx.restore()
      }
    }
  }

  const live = useLive(ref, powered && (mode === 'clock' || mode === 'scroll'))
  useFrameLoop(live, mode === 'clock' ? 2 : 3, draw)
  // draw again whenever anything it shows changes
  useEffect(draw, [powered, text, mode, cols, rows, tint, fonts, width, height, pitch])

  return (
    <div ref={ref} className="screen-module lcd-pcb">
      <div className="lcd-bezel">
        <div className="lcd-glass" data-tint={tint} data-on={powered || undefined}>
          <canvas ref={canvas} style={{ width, height }} role="img" aria-label={powered ? text : t.display.noPower} />
        </div>
      </div>
      {!powered && <NoPower />}
    </div>
  )
}
