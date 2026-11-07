import { useEffect, useRef } from 'react'
import type { DisplayTint, PartData } from '@/circuit/types'
import { useI18n } from '@/i18n'
import { useFrameLoop, useLive } from './loop'
import { drawCover, drawSamplePicture, useMediaSource, useVideoPlayback } from './media'
import { NoPower } from './NoPower'
import { clockParts, context, drawCentredLines, fitWrapped, fontFor, isRtl, makeCanvas, useFontsReady } from './text'

/*
 * A 0.96" 128 × 64 OLED. Everything is drawn in grey first, then turned into
 * pixels that are either on or off: words by a simple cut-off, pictures by
 * dithering (Floyd–Steinberg), like the real screen's library does.
 */

const W = 128
const H = 64
/** the yellow band at the top of a two-colour OLED */
const BAND = 16

const PIXEL: Record<'white' | 'blue' | 'yellow', [number, number, number]> = {
  white: [236, 244, 255],
  blue: [92, 190, 255],
  yellow: [255, 214, 72],
}

function colorAt(tint: DisplayTint, y: number) {
  if (tint === 'blue') return PIXEL.blue
  if (tint === 'yellowBlue') return y < BAND ? PIXEL.yellow : PIXEL.blue
  return PIXEL.white
}

/** Turns the grey drawing into lit and dark pixels and copies it onto the screen. */
function present(work: CanvasRenderingContext2D, screen: CanvasRenderingContext2D, tint: DisplayTint, dither: boolean) {
  const source = work.getImageData(0, 0, W, H).data
  const out = screen.createImageData(W, H)
  const px = out.data
  const grey = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) grey[i] = (source[i * 4] * 0.3 + source[i * 4 + 1] * 0.59 + source[i * 4 + 2] * 0.11) / 255
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const old = grey[i]
      const on = old > 0.5
      if (dither) {
        const error = old - (on ? 1 : 0)
        if (x + 1 < W) grey[i + 1] += (error * 7) / 16
        if (y + 1 < H) {
          if (x > 0) grey[i + W - 1] += (error * 3) / 16
          grey[i + W] += (error * 5) / 16
          if (x + 1 < W) grey[i + W + 1] += error / 16
        }
      }
      if (!on) continue
      const [r, g, b] = colorAt(tint, y)
      px[i * 4] = r
      px[i * 4 + 1] = g
      px[i * 4 + 2] = b
      px[i * 4 + 3] = 255
    }
  }
  screen.putImageData(out, 0, 0)
}

export function OledFace({ data, powered, volts }: { data: PartData; powered: boolean; volts: number }) {
  const { t, lang } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  // the grey drawing, before it becomes on/off pixels
  const work = useRef<CanvasRenderingContext2D | null>(null)
  const mode = data.mode ?? 'text'
  const tint = (data.tint as DisplayTint) ?? 'yellowBlue'
  const text = data.text ?? t.display.samples.oled
  const fonts = useFontsReady(`${text} ${t.display.signal}`)
  const media = useMediaSource(mode === 'picture' ? data.media : undefined)
  const video = media?.kind === 'video'

  const draw = () => {
    const screen = canvas.current?.getContext('2d')
    if (!screen) return
    screen.clearRect(0, 0, W, H)
    if (!powered) return
    const ctx = (work.current ??= context(makeCanvas(W, H), true))
    ctx.save()
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#fff'
    ctx.direction = 'ltr'
    switch (mode) {
      case 'clock': {
        const now = new Date()
        const { h, m, s } = clockParts(now)
        const date = now.toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' })
        ctx.font = fontFor(date, 11, 600)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(date, W / 2, BAND / 2 + 0.5)
        ctx.font = fontFor('0', 30, 700)
        ctx.fillText(`${h}:${m}`, W / 2, 38)
        ctx.fillRect(4, 58, Math.round((Number(s) / 59) * (W - 8)), 3)
        ctx.strokeStyle = '#fff'
        ctx.strokeRect(3.5, 57.5, W - 7, 4)
        break
      }
      case 'graph': {
        // the voltage on S as a number and a bar of 16 blocks, 0 to 5 volts
        const v = Math.max(0, volts)
        ctx.font = fontFor(t.display.signal, 11, 600)
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        ctx.direction = isRtl(t.display.signal) ? 'rtl' : 'ltr'
        ctx.fillText(t.display.signal, W / 2, BAND / 2 + 0.5)
        ctx.font = fontFor('0', 22, 700)
        ctx.direction = 'ltr'
        ctx.fillText(`${v.toFixed(2)} V`, W / 2, 31)
        const blocks = 16
        const lit = Math.round(Math.min(1, v / 5) * blocks)
        for (let i = 0; i < blocks; i++) {
          const x = 3 + i * 7.6
          if (i < lit) ctx.fillRect(Math.round(x), 46, 6, 10)
          else ctx.fillRect(Math.round(x), 55, 6, 1)
        }
        ctx.font = fontFor('0', 8, 600)
        ctx.textAlign = 'left'
        ctx.fillText('0', 2, 61)
        ctx.textAlign = 'right'
        ctx.fillText('5V', W - 2, 61)
        break
      }
      case 'picture': {
        if (media) drawCover(ctx, media, W, H)
        else drawSamplePicture(ctx, W, H)
        break
      }
      default: {
        const { size, lines } = fitWrapped(ctx, text, W - 6, H - 4, 30)
        ctx.font = fontFor(text, size)
        drawCentredLines(ctx, lines, size, 3, 2, W - 6, H - 4)
      }
    }
    ctx.restore()
    present(ctx, screen, tint, mode === 'picture')
  }

  const live = useLive(ref, powered && (mode === 'clock' || (mode === 'picture' && video)))
  useVideoPlayback(media, live)
  useFrameLoop(live, mode === 'clock' ? 2 : 20, draw)
  // draw again whenever anything it shows changes
  useEffect(draw, [powered, mode, tint, text, fonts, media, volts, lang, t])

  return (
    <div ref={ref} className="screen-module oled-pcb">
      <span className="oled-pins" aria-hidden />
      <div className="oled-glass">
        <canvas ref={canvas} width={W} height={H} className="screen-pixels" role="img" aria-label={powered ? text : t.display.noPower} />
      </div>
      {!powered && <NoPower />}
    </div>
  )
}
