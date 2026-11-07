import type { DemoId } from '@/circuit/types'
import { clockParts, fitFontSize, fontFor, isRtl, makeCanvas, context } from './text'

/*
 * The built-in shows of the colour screens, drawn in code at the screen's own
 * resolution (a 6 × 3 panel wall is 384 × 96 LEDs). No pictures are loaded.
 */

export type DemoTexts = { newsTitle: string; news: string; ad: string }

type Particle = { x: number; y: number; vx: number; vy: number; life: number; hue: number; size: number }
type Rocket = { x: number; y: number; vy: number; hue: number; top: number }

export type DemoState = {
  particles: Particle[]
  rockets: Rocket[]
  nextRocket: number
  lastT: number
  reelIndex: number
  plasma?: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; image: ImageData }
  skyline?: { canvas: HTMLCanvasElement; w: number; h: number }
}

export const newDemoState = (): DemoState => ({
  particles: [],
  rockets: [],
  nextRocket: 0,
  lastT: 0,
  reelIndex: -1,
})

type Frame = { ctx: CanvasRenderingContext2D; w: number; h: number; t: number; state: DemoState; texts: DemoTexts }

/** A random number that is the same every time for the same seed. */
function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}

/* ---- color bars: the test picture of old TV stations ---- */
const BARS = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0']
const UNDER = ['#0000c0', '#131313', '#c000c0', '#131313', '#00c0c0', '#131313', '#c0c0c0']

function bars({ ctx, w, h, t }: Frame) {
  const top = Math.round(h * 0.66)
  const mid = Math.round(h * 0.08)
  BARS.forEach((color, i) => {
    const x0 = Math.round((i * w) / 7)
    const x1 = Math.round(((i + 1) * w) / 7)
    ctx.fillStyle = color
    ctx.fillRect(x0, 0, x1 - x0, top)
    ctx.fillStyle = UNDER[i]
    ctx.fillRect(x0, top, x1 - x0, mid)
  })
  // a grey ramp and a white block sliding along the bottom
  const y = top + mid
  const ramp = ctx.createLinearGradient(0, 0, w, 0)
  ramp.addColorStop(0, '#000')
  ramp.addColorStop(1, '#fff')
  ctx.fillStyle = ramp
  ctx.fillRect(0, y, w, h - y)
  const block = Math.max(2, Math.round(w / 12))
  const x = Math.round(((t * 0.25) % 1) * (w + block)) - block
  ctx.fillStyle = '#fff'
  ctx.fillRect(x, y, block, h - y)
  // the "on air" light blinks in the corner
  if (t % 1 < 0.6) {
    ctx.fillStyle = '#ff2a2a'
    const r = Math.max(1.5, h * 0.05)
    ctx.beginPath()
    ctx.arc(w - r * 2, r * 2, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

/* ---- rainbow waves (a plasma) ---- */
const PALETTE = Array.from({ length: 256 }, (_, i) => {
  const hue = (i / 256) * 360
  const c = (n: number) => {
    const k = (n + hue / 30) % 12
    return Math.round(255 * (0.5 - 0.5 * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
  }
  return [c(0), c(8), c(4)] as const
})

function rainbow({ ctx, w, h, t, state }: Frame) {
  // computed at a quarter of the resolution, then smoothly enlarged: cheap even on a 12 × 8 wall
  const pw = Math.max(16, Math.ceil(w / 4))
  const ph = Math.max(8, Math.ceil(h / 4))
  if (!state.plasma || state.plasma.canvas.width !== pw || state.plasma.canvas.height !== ph) {
    const canvas = makeCanvas(pw, ph)
    const c = context(canvas)
    state.plasma = { canvas, ctx: c, image: c.createImageData(pw, ph) }
  }
  const { image } = state.plasma
  const px = image.data
  const aspect = pw / ph
  for (let y = 0; y < ph; y++) {
    const v = (y / ph) * 4
    for (let x = 0; x < pw; x++) {
      const u = (x / pw) * 4 * aspect
      const d = Math.hypot(u - 2 * aspect - Math.sin(t * 0.5) * aspect, v - 2 - Math.cos(t * 0.4))
      const value =
        Math.sin(u * 1.4 + t) + Math.sin(v * 1.9 - t * 1.3) + Math.sin((u + v) * 0.9 + t * 0.7) + Math.sin(d * 2.2 - t * 2)
      const [r, g, b] = PALETTE[Math.floor((value + 4) * 32 + t * 40) & 255]
      const i = (y * pw + x) * 4
      px[i] = r
      px[i + 1] = g
      px[i + 2] = b
      px[i + 3] = 255
    }
  }
  state.plasma.ctx.putImageData(image, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(state.plasma.canvas, 0, 0, w, h)
}

/* ---- a big clock ---- */
function clock({ ctx, w, h }: Frame) {
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#081a3a')
  sky.addColorStop(1, '#02060f')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)
  const { h: hh, m, s, ms } = clockParts()
  const big = `${hh}:${m}`
  const size = fitFontSize([big], h * 0.52, w * 0.62)
  ctx.font = fontFor(big, size)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = 'ltr'
  ctx.fillStyle = '#e8f3ff'
  const bigWidth = ctx.measureText(big).width
  const small = Math.max(6, size * 0.42)
  ctx.font = fontFor(big, small)
  const secWidth = ctx.measureText(s).width
  const left = (w - bigWidth - secWidth - small * 0.3) / 2
  ctx.font = fontFor(big, size)
  ctx.textAlign = 'left'
  ctx.fillText(big, left, h * 0.44)
  ctx.font = fontFor(big, small)
  ctx.fillStyle = '#4fd1ff'
  ctx.fillText(s, left + bigWidth + small * 0.3, h * 0.44 + size * 0.14)
  // the seconds run along a bar
  const bar = Math.max(1, Math.round(h * 0.05))
  const y = Math.round(h * 0.82)
  ctx.fillStyle = '#12305e'
  ctx.fillRect(w * 0.1, y, w * 0.8, bar)
  ctx.fillStyle = '#4fd1ff'
  ctx.fillRect(w * 0.1, y, w * 0.8 * ((Number(s) + ms / 1000) / 60), bar)
}

/* ---- the news: a headline and a moving ticker along the bottom ---- */
function news({ ctx, w, h, t, texts }: Frame) {
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#0b1d4d')
  bg.addColorStop(1, '#122a6b')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  // slow light streaks behind the headline
  for (let i = 0; i < 3; i++) {
    const x = ((t * 0.08 + i / 3) % 1) * (w * 1.6) - w * 0.3
    const streak = ctx.createLinearGradient(x - w * 0.2, 0, x + w * 0.2, 0)
    streak.addColorStop(0, 'rgba(80,140,255,0)')
    streak.addColorStop(0.5, 'rgba(80,140,255,0.22)')
    streak.addColorStop(1, 'rgba(80,140,255,0)')
    ctx.fillStyle = streak
    ctx.fillRect(x - w * 0.2, 0, w * 0.4, h * 0.72)
  }
  const items = texts.news
    .split('•')
    .map((s) => s.trim())
    .filter(Boolean)
  const rtl = isRtl(texts.news)
  const tickerH = Math.max(6, Math.round(h * 0.26))
  const top = h - tickerH
  // title badge
  const badgeH = Math.max(5, Math.round(h * 0.2))
  const badgeSize = fitFontSize([texts.newsTitle], badgeH * 0.62, w * 0.4)
  ctx.font = fontFor(texts.newsTitle, badgeSize)
  const badgeW = ctx.measureText(texts.newsTitle).width + badgeH * 1.4
  const bx = rtl ? w - badgeW - h * 0.05 : h * 0.05
  ctx.fillStyle = '#e11d2e'
  ctx.fillRect(bx, h * 0.06, badgeW, badgeH)
  ctx.fillStyle = t % 1 < 0.6 ? '#fff' : '#ffb3b8'
  ctx.beginPath()
  const dot = rtl ? bx + badgeW - badgeH * 0.5 : bx + badgeH * 0.5
  ctx.arc(dot, h * 0.06 + badgeH / 2, badgeH * 0.18, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.textAlign = 'center'
  ctx.fillText(texts.newsTitle, rtl ? bx + (badgeW - badgeH * 0.6) / 2 : bx + badgeH * 0.6 + (badgeW - badgeH * 0.6) / 2, h * 0.06 + badgeH / 2)
  // headline: one item at a time
  const headline = items[Math.floor(t / 5) % Math.max(1, items.length)] ?? ''
  const zoneTop = h * 0.06 + badgeH
  const zoneH = top - zoneTop
  const size = fitFontSize([headline], zoneH * 0.55, w * 0.92)
  ctx.font = fontFor(headline, size)
  ctx.direction = isRtl(headline) ? 'rtl' : 'ltr'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff'
  const appear = Math.min(1, (t % 5) * 3)
  ctx.globalAlpha = appear
  ctx.fillText(headline, w / 2, zoneTop + zoneH / 2 + (1 - appear) * size * 0.4)
  ctx.globalAlpha = 1
  // ticker
  ctx.fillStyle = '#f5f7fb'
  ctx.fillRect(0, top, w, tickerH)
  ctx.fillStyle = '#e11d2e'
  ctx.fillRect(0, top, w, Math.max(1, Math.round(tickerH * 0.1)))
  const line = items.join('   •   ')
  const tickerSize = fitFontSize([line], tickerH * 0.6)
  ctx.font = fontFor(line, tickerSize, 600)
  const width = ctx.measureText(line).width
  const span = width + w
  const offset = (t * Math.max(14, h * 0.5)) % span
  ctx.fillStyle = '#0b1d4d'
  ctx.textAlign = 'left'
  ctx.direction = rtl ? 'rtl' : 'ltr'
  // left-to-right words move left, right-to-left words move right: the start is read first
  const x = rtl ? -width + offset : w - offset
  ctx.textAlign = 'left'
  ctx.fillText(line, x, top + tickerH * 0.55)
}

/* ---- fireworks over the city ---- */
function skyline(state: DemoState, w: number, h: number) {
  if (state.skyline && state.skyline.w === w && state.skyline.h === h) return state.skyline.canvas
  const canvas = makeCanvas(w, h)
  const c = context(canvas)
  let x = 0
  let i = 0
  while (x < w) {
    const bw = Math.max(3, Math.round((0.04 + hash(i) * 0.07) * h * 1.6))
    const bh = Math.round(h * (0.12 + hash(i + 50) * 0.26))
    c.fillStyle = '#05070d'
    c.fillRect(x, h - bh, bw, bh)
    // a few lit windows
    const step = Math.max(2, Math.round(h * 0.04))
    for (let wy = h - bh + step; wy < h - step; wy += step * 1.6) {
      for (let wx = x + 1; wx < x + bw - 1; wx += step) {
        if (hash(wx * 7 + wy * 13) > 0.62) {
          c.fillStyle = hash(wx + wy) > 0.5 ? '#ffd27a' : '#9fc3ff'
          c.fillRect(Math.round(wx), Math.round(wy), Math.max(1, step * 0.5), Math.max(1, step * 0.6))
        }
      }
    }
    x += bw + Math.round(hash(i + 99) * 2)
    i++
  }
  state.skyline = { canvas, w, h }
  return canvas
}

function fireworks({ ctx, w, h, t, state }: Frame) {
  const dt = Math.min(0.1, Math.max(0, t - state.lastT))
  state.lastT = t
  // fade the last frame instead of clearing it: sparks leave trails
  ctx.fillStyle = 'rgba(2, 3, 12, 0.22)'
  ctx.fillRect(0, 0, w, h)
  if (t >= state.nextRocket) {
    const lanes = Math.max(1, Math.round(w / h))
    for (let i = 0; i < Math.min(3, lanes); i++) {
      state.rockets.push({
        x: w * (0.1 + Math.random() * 0.8),
        y: h,
        vy: -h * (0.9 + Math.random() * 0.4),
        hue: Math.floor(Math.random() * 360),
        top: h * (0.15 + Math.random() * 0.3),
      })
    }
    state.nextRocket = t + 0.5 + Math.random() * 0.9
  }
  const gravity = h * 0.55
  state.rockets = state.rockets.filter((r) => {
    r.y += r.vy * dt
    r.vy += gravity * 0.3 * dt
    ctx.fillStyle = `hsl(${r.hue} 100% 80%)`
    ctx.fillRect(Math.round(r.x), Math.round(r.y), 1, Math.max(1, Math.round(h * 0.03)))
    if (r.y > r.top) return true
    const count = Math.min(70, 30 + Math.round(w / 12))
    for (let i = 0; i < count && state.particles.length < 500; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2
      const speed = h * (0.25 + Math.random() * 0.35)
      state.particles.push({
        x: r.x,
        y: r.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        hue: r.hue + Math.random() * 40 - 20,
        size: Math.max(1, Math.round(h / 64)),
      })
    }
    return false
  })
  state.particles = state.particles.filter((p) => {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += gravity * 0.35 * dt
    p.vx *= 0.985
    p.life -= dt * 0.75
    if (p.life <= 0) return false
    ctx.fillStyle = `hsl(${p.hue} 100% ${50 + p.life * 30}% / ${Math.min(1, p.life * 1.4)})`
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size)
    return true
  })
  ctx.drawImage(skyline(state, w, h), 0, 0)
}

/* ---- a city advert: big words sliding over moving colour ---- */
function cityAd({ ctx, w, h, t, texts }: Frame) {
  const shift = (t * 40) % 360
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, `hsl(${(300 + shift) % 360} 85% 45%)`)
  bg.addColorStop(0.5, `hsl(${(340 + shift) % 360} 90% 52%)`)
  bg.addColorStop(1, `hsl(${(30 + shift) % 360} 95% 55%)`)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  // moving diagonal stripes
  ctx.fillStyle = 'rgba(255,255,255,0.09)'
  const stripe = Math.max(4, h * 0.22)
  const offset = (t * stripe * 1.5) % (stripe * 2)
  for (let x = -h - stripe * 2 + offset; x < w + h; x += stripe * 2) {
    ctx.beginPath()
    ctx.moveTo(x, h)
    ctx.lineTo(x + h, 0)
    ctx.lineTo(x + h + stripe, 0)
    ctx.lineTo(x + stripe, h)
    ctx.fill()
  }
  // a glowing sun that breathes
  const r = h * (0.32 + Math.sin(t * 2) * 0.03)
  const sun = ctx.createRadialGradient(w * 0.85, h * 0.4, 0, w * 0.85, h * 0.4, r * 1.6)
  sun.addColorStop(0, 'rgba(255,245,200,0.95)')
  sun.addColorStop(0.45, 'rgba(255,210,120,0.6)')
  sun.addColorStop(1, 'rgba(255,210,120,0)')
  ctx.fillStyle = sun
  ctx.fillRect(0, 0, w, h)
  // the words fly in, wait, and fly out every 6 seconds
  const text = texts.ad
  const size = fitFontSize([text], h * 0.5, w * 0.86)
  ctx.font = fontFor(text, size, 800)
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.direction = isRtl(text) ? 'rtl' : 'ltr'
  const phase = t % 6
  const ease = (p: number) => 1 - (1 - p) ** 3
  const slide = phase < 0.8 ? 1 - ease(phase / 0.8) : phase > 5.2 ? -ease((phase - 5.2) / 0.8) : 0
  const x = w / 2 + slide * w
  const bounce = phase > 0.8 && phase < 5.2 ? Math.sin((phase - 0.8) * 3) * h * 0.02 : 0
  ctx.fillStyle = 'rgba(40,0,40,0.35)'
  ctx.fillText(text, x + Math.max(1, h * 0.02), h / 2 + bounce + Math.max(1, h * 0.025))
  ctx.fillStyle = '#fff'
  ctx.fillText(text, x, h / 2 + bounce)
  // twinkles
  for (let i = 0; i < Math.round(w / 12); i++) {
    const life = (t * 0.8 + hash(i)) % 1
    if (life > 0.35) continue
    ctx.fillStyle = `rgba(255,255,255,${1 - life / 0.35})`
    ctx.fillRect(Math.round(hash(i + 3 + Math.floor(t * 0.8 + hash(i))) * w), Math.round(hash(i + 7) * h), 1, 1)
  }
}

const SHOWS: Record<Exclude<DemoId, 'reel'>, (frame: Frame) => void> = {
  cityAd,
  fireworks,
  rainbow,
  news,
  clock,
  bars,
}

const REEL: Exclude<DemoId, 'reel'>[] = ['cityAd', 'fireworks', 'rainbow', 'news', 'clock', 'bars']
const REEL_SECONDS = 8

/** Draws one frame of a show. `t` is in seconds. */
export function drawDemo(
  demo: DemoId,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  state: DemoState,
  texts: DemoTexts,
) {
  ctx.save()
  if (demo !== 'reel') {
    SHOWS[demo]({ ctx, w, h, t, state, texts })
    ctx.restore()
    return
  }
  // the reel plays every show in turn and dips to black between them
  const index = Math.floor(t / REEL_SECONDS) % REEL.length
  if (index !== state.reelIndex) {
    state.reelIndex = index
    state.particles = []
    state.rockets = []
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
  }
  SHOWS[REEL[index]]({ ctx, w, h, t, state, texts })
  const into = t % REEL_SECONDS
  const dip = into < 0.35 ? 1 - into / 0.35 : into > REEL_SECONDS - 0.35 ? (into - (REEL_SECONDS - 0.35)) / 0.35 : 0
  if (dip > 0) {
    ctx.fillStyle = `rgba(0,0,0,${dip})`
    ctx.fillRect(0, 0, w, h)
  }
  ctx.restore()
}
