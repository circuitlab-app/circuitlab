import { useStore } from '@xyflow/react'
import { useEffect, useMemo, useRef } from 'react'
import { TINT_COLORS, displayGeometry, displayGrid } from '@/circuit/display'
import type { DemoId, DisplayTint, PartData, SignEffect } from '@/circuit/types'
import { useI18n } from '@/i18n'
import { drawDemo, newDemoState, type DemoState } from './demos'
import { useFrameLoop, useLive } from './loop'
import { drawCover, drawSamplePicture, useMediaSource, useVideoPlayback } from './media'
import { NoPower } from './NoPower'
import { context, fitFontSize, isRtl, makeCanvas, signEffect, textMask, useFontsReady } from './text'

/*
 * LED signs and the city TV. The picture is drawn at the real LED resolution
 * (32 × 16 per sign module, 64 × 32 per wall panel) into a small canvas that
 * the browser enlarges without smoothing; a fixed dot pattern on top turns
 * each pixel into a round LED. No LED is ever drawn one by one.
 */

/** What a dark LED looks like: not quite black, so the grid of LEDs still shows. */
const UNLIT = '#17120e'

/** LED steps per second for the speed slider; each divides 60 so scrolling stays even. */
const STEP_RATES = [10, 12, 15, 20, 30, 60]

type Band = {
  mask: HTMLCanvasElement
  y: number
  h: number
  rtl: boolean
  fits: boolean
  /** lit LEDs of the words, for the sparkles */
  lit: Int16Array
}

/** Splits the words into one band per line, as many lines as the sign has module rows. */
function buildBands(text: string, w: number, h: number, rows: number, fitWidth: boolean): Band[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return []
  const count = Math.min(lines.length, rows)
  // more lines than rows: the extra lines join the last one
  const merged = lines.length > count ? [...lines.slice(0, count - 1), lines.slice(count - 1).join('  •  ')] : lines
  const bandH = Math.floor(h / count)
  const top = Math.floor((h - bandH * count) / 2)
  const size = fitFontSize(merged, bandH - 2, fitWidth ? w - 2 : Infinity)
  return merged.map((line, i) => {
    const mask = textMask(line, bandH, size)
    const data = context(mask, true).getImageData(0, 0, mask.width, mask.height).data
    const lit: number[] = []
    for (let y = 0; y < mask.height; y++) {
      for (let x = 0; x < mask.width; x++) if (data[(y * mask.width + x) * 4 + 3]) lit.push(x, y)
    }
    return { mask, y: top + i * bandH, h: bandH, rtl: isRtl(line), fits: mask.width <= w, lit: Int16Array.from(lit) }
  })
}

/** How strongly the LED dots show: they fade out when zoomed so far out that an LED is under 2 pixels. */
function maskStrength(screenPitch: number) {
  const devicePitch = screenPitch * (window.devicePixelRatio || 1)
  return Math.round(Math.min(1, Math.max(0, (devicePitch - 2) / 2)) * 4) / 4
}

type Painter = { ctx: CanvasRenderingContext2D; layer: CanvasRenderingContext2D }

type SignLook = {
  w: number
  h: number
  bands: Band[]
  effect: SignEffect
  speed: number
  rate: number
  tint: DisplayTint
  sparkles: { current: { x: number; y: number; life: number }[] }
}

const scrolls = (band: Band, effect: SignEffect) =>
  effect === 'scrollLeft' || effect === 'scrollRight' || (effect === 'sparkle' && !band.fits)

/** One frame of an LED sign: the words moved, coloured and sparkling. */
function paintSign({ ctx, layer }: Painter, now: number, look: SignLook) {
  const { w, h, bands, effect, speed, rate, tint, sparkles } = look
  const seconds = now / 1000
  layer.clearRect(0, 0, w, h)
  const blinkOff = effect === 'blink' && seconds % (1.6 - speed) > (1.6 - speed) * 0.62
  // where each band's words are in this frame
  const xs: number[] = []
  if (!blinkOff) {
    const steps = Math.floor(seconds * Math.min(30, rate)) * (rate > 30 ? 2 : 1)
    for (const band of bands) {
      const mw = band.mask.width
      let x = Math.round((w - mw) / 2)
      if (scrolls(band, effect)) {
        const left = effect === 'scrollLeft' || (effect !== 'scrollRight' && !band.rtl)
        const run = steps % (mw + w)
        x = left ? w - run : run - mw
      }
      layer.drawImage(band.mask, x, band.y)
      xs.push(x)
    }
    // colour the words, band by band ("atop" keeps the other bands, "in" would wipe them)
    layer.globalCompositeOperation = 'source-atop'
    for (const band of bands) {
      if (tint === 'rainbow') {
        const g = layer.createLinearGradient(0, 0, w, 0)
        const shift = (seconds * 90) % 360
        for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, `hsl(${(shift + i * 60) % 360} 100% 58%)`)
        layer.fillStyle = g
      } else if (effect === 'sparkle' && tint === 'yellow') {
        const g = layer.createLinearGradient(0, band.y, 0, band.y + band.h)
        g.addColorStop(0, '#fff2b0')
        g.addColorStop(0.45, '#ffc02e')
        g.addColorStop(1, '#d97f00')
        layer.fillStyle = g
      } else {
        layer.fillStyle = TINT_COLORS[tint]
      }
      layer.fillRect(0, band.y, w, band.h)
    }
    // a shine sweeps across the gold
    if (effect === 'sparkle') {
      layer.globalCompositeOperation = 'source-atop'
      const sweep = ((seconds * 0.45) % 1.6) * (w + h * 2) - h
      const g = layer.createLinearGradient(sweep - h, 0, sweep + h, h)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(0.5, 'rgba(255,255,240,0.85)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      layer.fillStyle = g
      layer.fillRect(0, 0, w, h)
    }
    layer.globalCompositeOperation = 'source-over'
  }
  ctx.fillStyle = UNLIT
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(layer.canvas, 0, 0)
  // sparkles twinkle on the letters
  if (effect === 'sparkle' && !blinkOff) {
    const list = sparkles.current
    bands.forEach((band, i) => {
      const count = band.lit.length / 2
      // about one new sparkle a frame for every 250 lit LEDs
      for (let n = 0; n < Math.max(1, Math.round(count / 250)) && count > 0; n++) {
        if (Math.random() > 0.6) continue
        const k = Math.floor(Math.random() * count) * 2
        list.push({ x: band.lit[k] + xs[i], y: band.lit[k + 1] + band.y, life: 1 })
      }
    })
    sparkles.current = list.filter((s) => {
      s.life -= 0.12
      if (s.life <= 0) return false
      ctx.fillStyle = `rgba(255, 255, 255, ${s.life})`
      ctx.fillRect(s.x, s.y, 1, 1)
      if (s.life > 0.6) {
        ctx.fillStyle = `rgba(255, 245, 200, ${s.life * 0.6})`
        ctx.fillRect(s.x - 1, s.y, 3, 1)
        ctx.fillRect(s.x, s.y - 1, 1, 3)
      }
      return true
    })
  }
}

export function LedFace({ data, powered }: { data: PartData; powered: boolean }) {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const painter = useRef<Painter | null>(null)
  const demoState = useRef<DemoState | null>(null)
  /** shows start from their beginning when the screen first draws */
  const startedAt = useRef(0)
  const sparkles = useRef<{ x: number; y: number; life: number }[]>([])
  const wall = data.type === 'ledwall'
  const geometry = displayGeometry(data)
  const { w, h, pitch } = geometry.leds!
  const { cols, rows } = displayGrid(data)
  const dots = useStore((s) => maskStrength(s.transform[2] * pitch))
  const samples = t.display.samples

  // ---- sign ----
  const text = data.text ?? samples.matrix
  const fonts = useFontsReady(wall ? `${samples.ad} ${samples.news} ${samples.newsTitle}` : text)
  const tint = (data.tint as DisplayTint) ?? 'yellow'
  const effect = signEffect(data, text)
  const speed = Math.min(1, Math.max(0, data.speed ?? 0.5))
  const rate = STEP_RATES[Math.round(speed * (STEP_RATES.length - 1))]
  const bands = useMemo(() => {
    // built again once the real font has loaded
    void fonts
    return wall ? [] : buildBands(text, w, h, rows, effect === 'static' || effect === 'blink')
  }, [wall, text, w, h, rows, effect, fonts])

  // ---- wall ----
  const mode = data.mode ?? 'demo'
  const demo: DemoId = data.demo ?? 'reel'
  const playing = data.playing !== false
  const media = useMediaSource(wall && mode === 'picture' ? data.media : undefined)


  const draw = (now = performance.now()) => {
    const el = canvas.current
    if (!el) return
    if (!painter.current || painter.current.layer.canvas.width !== w || painter.current.layer.canvas.height !== h) {
      painter.current = { ctx: el.getContext('2d')!, layer: context(makeCanvas(w, h)) }
    }
    const { ctx } = painter.current
    ctx.imageSmoothingEnabled = false
    if (!powered) {
      ctx.fillStyle = wall ? '#0b0b0d' : UNLIT
      ctx.fillRect(0, 0, w, h)
      return
    }
    if (!wall) return paintSign(painter.current, now, { w, h, bands, effect, speed, rate, tint, sparkles })
    if (mode === 'picture') {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
      if (media) drawCover(ctx, media, w, h)
      else drawSamplePicture(ctx, w, h)
    } else {
      startedAt.current ||= now
      drawDemo(demo, ctx, w, h, (now - startedAt.current) / 1000, (demoState.current ??= newDemoState()), samples)
    }
  }

  const animated = wall
    ? playing && (mode === 'demo' || media?.kind === 'video')
    : effect !== 'static' || tint === 'rainbow'
  const live = useLive(ref, powered && animated)
  const fps = wall ? 30 : scrollsAny(bands, effect) ? Math.min(30, rate) : effect === 'blink' && tint !== 'rainbow' ? 5 : 20
  useVideoPlayback(media, live)
  useFrameLoop(live, fps, draw)
  // draw again whenever anything it shows changes
  useEffect(draw, [powered, wall, bands, tint, effect, speed, rate, mode, demo, media, samples, w, h, playing])

  const brightness = Math.min(1, Math.max(0.1, data.brightness ?? (wall ? 0.9 : 1)))
  const glow = !wall && powered && tint !== 'rainbow' ? TINT_COLORS[tint] : undefined

  return (
    <div ref={ref} className="screen-module led-module">
      <div className={wall ? 'led-housing led-housing--wall' : 'led-housing'}>
        <div
          className="led-screen"
          style={{
            width: w * pitch,
            height: h * pitch,
            ['--led-w' as string]: w,
            ['--led-h' as string]: h,
            ['--cols' as string]: cols,
            ['--rows' as string]: rows,
            ['--glow' as string]: glow,
          }}
          data-glow={glow ? '' : undefined}
        >
          <canvas
            ref={canvas}
            width={w}
            height={h}
            className="screen-pixels"
            style={{ opacity: powered ? 0.2 + 0.8 * brightness : 1 }}
            role="img"
            aria-label={powered ? (wall ? t.parts.ledwall.name : text) : t.display.noPower}
          />
          {dots > 0 && <span className="led-mask" style={{ opacity: dots }} aria-hidden />}
          <span className="led-seams" aria-hidden />
        </div>
      </div>
      {!powered && <NoPower />}
    </div>
  )
}

function scrollsAny(bands: Band[], effect: SignEffect) {
  return effect === 'scrollLeft' || effect === 'scrollRight' || (effect === 'sparkle' && bands.some((b) => !b.fits))
}
