import { useEffect, useSyncExternalStore } from 'react'
import type { PartData, SignEffect } from '@/circuit/types'

/*
 * Words on the screens are drawn into canvases. Latin text uses Geist and
 * Persian or Arabic text uses Vazirmatn, the app's fonts, with the browser's
 * own shaping and right-to-left layout.
 */

const RTL_CHAR = /[֐-ࣿיִ-﷿ﹰ-﻿]/
const STRONG_CHAR = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ֐-ࣿיִ-﷿ﹰ-﻿]/

/** True when the first letter is Persian, Arabic or Hebrew: the words read right to left. */
export function isRtl(text: string): boolean {
  const first = STRONG_CHAR.exec(text)
  return !!first && RTL_CHAR.test(first[0])
}

export const hasRtl = (text: string) => RTL_CHAR.test(text)

/** A sign's words move this way unless a child picks: in the direction they are read. */
export function signEffect(data: PartData, text: string): SignEffect {
  return data.effect ?? (isRtl(text) ? 'scrollRight' : 'scrollLeft')
}

const LATIN = '"Geist Variable", "Vazirmatn Variable", sans-serif'
const ARABIC = '"Vazirmatn Variable", "Geist Variable", sans-serif'

/** A canvas font for these words. */
export function fontFor(text: string, size: number, weight = 700): string {
  return `${weight} ${Math.max(1, Math.round(size * 10) / 10)}px ${hasRtl(text) ? ARABIC : LATIN}`
}

/* A canvas draws with a fallback font until the real one has loaded. Screens
 * read this version number and draw again when a font finishes loading. */
let fontVersion = 0
const listeners = new Set<() => void>()
if (typeof document !== 'undefined' && document.fonts) {
  document.fonts.addEventListener('loadingdone', () => {
    fontVersion++
    listeners.forEach((listener) => listener())
  })
}
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Starts loading the fonts these words need; the result changes once they are ready. */
export function useFontsReady(text: string): number {
  const version = useSyncExternalStore(subscribe, () => fontVersion)
  useEffect(() => {
    if (!document.fonts) return
    for (const font of [fontFor(text, 16, 700), fontFor(text, 16, 500)]) {
      document.fonts.load(font, text || 'A').catch(() => undefined)
    }
  }, [text])
  return version
}

export function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil(width))
  canvas.height = Math.max(1, Math.ceil(height))
  return canvas
}

export function context(canvas: HTMLCanvasElement, readBack = false): CanvasRenderingContext2D {
  return canvas.getContext('2d', readBack ? { willReadFrequently: true } : undefined)!
}

let probeContext: CanvasRenderingContext2D | null = null
/** One small canvas shared for measuring words. */
const measurer = () => (probeContext ??= context(makeCanvas(1, 1)))

/** Biggest font size at which every line fits `height` px of LEDs (and `width`, when given). */
export function fitFontSize(lines: string[], height: number, width = Infinity, weight = 700): number {
  const probe = measurer()
  probe.direction = 'ltr'
  probe.textAlign = 'left'
  let size = height * 1.15
  for (const line of lines) {
    if (!line) continue
    probe.font = fontFor(line, 100, weight)
    const m = probe.measureText(line)
    const tall = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
    if (tall > 0) size = Math.min(size, (height * 100) / tall)
    if (Number.isFinite(width) && m.width > 0) size = Math.min(size, (width * 100) / m.width)
  }
  return Math.max(4, size)
}

/**
 * One line of words as a crisp on/off mask, `height` LEDs tall: lit LEDs are
 * opaque white, the rest transparent. Drawn once, then moved every frame.
 */
export function textMask(text: string, height: number, size: number, weight = 700): HTMLCanvasElement {
  const direction: CanvasDirection = isRtl(text) ? 'rtl' : 'ltr'
  const probe = measurer()
  probe.font = fontFor(text, size, weight)
  probe.direction = direction
  probe.textAlign = 'left'
  const m = probe.measureText(text)
  const width = Math.max(1, Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + 2)
  const canvas = makeCanvas(width, height)
  const ctx = context(canvas, true)
  ctx.font = probe.font
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'alphabetic'
  // centre the ink itself, so letters with long tails still fit
  const ink = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
  const baseline = Math.round((height - ink) / 2 + m.actualBoundingBoxAscent)
  // right-to-left words keep their letter order; "left" still pins the left edge of the ink
  ctx.direction = direction
  ctx.textAlign = 'left'
  ctx.fillText(text, 1 + m.actualBoundingBoxLeft, baseline)
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const px = image.data
  for (let i = 3; i < px.length; i += 4) px[i] = px[i] > 110 ? 255 : 0
  ctx.putImageData(image, 0, 0)
  return canvas
}

/** Breaks words into lines no wider than `width` at the current `ctx.font`. */
export function wrapLines(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = []
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    let line = ''
    for (const word of words) {
      const next = line ? `${line} ${word}` : word
      if (line && ctx.measureText(next).width > width) {
        out.push(line)
        line = word
      } else {
        line = next
      }
    }
    out.push(line)
  }
  return out
}

/** The largest font size (≤ max) at which `text` wraps into the box. */
export function fitWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  max: number,
  weight = 700,
): { size: number; lines: string[] } {
  for (let size = max; size > 6; size *= 0.9) {
    ctx.font = fontFor(text, size, weight)
    const lines = wrapLines(ctx, text, width)
    const fits = lines.length * size * 1.25 <= height && lines.every((l) => ctx.measureText(l).width <= width)
    if (fits) return { size, lines }
  }
  ctx.font = fontFor(text, 6, weight)
  return { size: 6, lines: wrapLines(ctx, text, width) }
}

/** Draws wrapped lines centred in a box. */
export function drawCentredLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  size: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const lineHeight = size * 1.25
  const top = y + (height - lines.length * lineHeight) / 2 + lineHeight / 2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  lines.forEach((line, i) => {
    ctx.direction = isRtl(line) ? 'rtl' : 'ltr'
    ctx.fillText(line, x + width / 2, top + i * lineHeight)
  })
}

/** Local time as HH:MM:SS parts. */
export function clockParts(date = new Date()) {
  const two = (n: number) => String(n).padStart(2, '0')
  return { h: two(date.getHours()), m: two(date.getMinutes()), s: two(date.getSeconds()), ms: date.getMilliseconds() }
}
