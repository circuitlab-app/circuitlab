import { useEffect, useRef } from 'react'
import type { DemoId, PartData } from '@/circuit/types'
import { useI18n } from '@/i18n'
import { drawDemo, newDemoState, type DemoState } from './demos'
import { useFrameLoop, useLive } from './loop'
import { drawCover, drawSamplePicture, useMediaSource, useVideoPlayback } from './media'
import { NoPower } from './NoPower'
import { drawCentredLines, fitWrapped, fontFor, useFontsReady } from './text'

/* A 320 × 240 colour TFT, shown at half size: photos, videos, shows or words. */

const W = 320
const H = 240

export function TftFace({ data, powered }: { data: PartData; powered: boolean }) {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const state = useRef<DemoState | null>(null)
  /** shows start from their beginning when the screen first draws */
  const startedAt = useRef(0)
  const mode = data.mode ?? 'demo'
  const demo: DemoId = data.demo ?? 'rainbow'
  const text = data.text ?? t.display.samples.tft
  const samples = t.display.samples
  const fonts = useFontsReady(`${text} ${samples.ad} ${samples.news}`)
  const media = useMediaSource(mode === 'picture' ? data.media : undefined)

  const draw = (now = performance.now()) => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    if (!powered) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)
      return
    }
    if (mode === 'demo') {
      startedAt.current ||= now
      drawDemo(demo, ctx, W, H, (now - startedAt.current) / 1000, (state.current ??= newDemoState()), samples)
    } else if (mode === 'picture') {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)
      if (media) drawCover(ctx, media, W, H)
      else drawSamplePicture(ctx, W, H)
    } else {
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#4338ca')
      bg.addColorStop(1, '#db2777')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      const { size, lines } = fitWrapped(ctx, text, W - 32, H - 32, 72, 800)
      ctx.font = fontFor(text, size, 800)
      ctx.fillStyle = 'rgba(30, 0, 40, 0.35)'
      drawCentredLines(ctx, lines, size, 16 + size * 0.05, 16 + size * 0.06, W - 32, H - 32)
      ctx.fillStyle = '#fff'
      drawCentredLines(ctx, lines, size, 16, 16, W - 32, H - 32)
    }
  }

  const animated = mode === 'demo' || (mode === 'picture' && media?.kind === 'video')
  const live = useLive(ref, powered && animated)
  useVideoPlayback(media, live)
  useFrameLoop(live, 30, draw)
  // draw again whenever anything it shows changes
  useEffect(draw, [powered, mode, demo, text, fonts, media, samples])

  return (
    <div ref={ref} className="screen-module tft-pcb">
      <span className="tft-pins" aria-hidden />
      <div className="tft-glass">
        <canvas ref={canvas} width={W} height={H} role="img" aria-label={powered ? t.parts.tft.name : t.display.noPower} />
      </div>
      {!powered && <NoPower />}
    </div>
  )
}
