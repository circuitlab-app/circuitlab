import { useEffect, useRef, useState } from 'react'
import { TINT_COLORS, segmentDigits } from '@/circuit/display'
import type { DisplayTint, PartData } from '@/circuit/types'
import { useFrameLoop, useLive } from './loop'
import { clockParts } from './text'
import { NoPower } from './NoPower'

/*
 * A real 7-segment module: slanted bars, the unlit bars faintly visible,
 * a decimal point after each digit and a colon on 4-digit clocks.
 */

const T = 3.4 // bar thickness
const G = 0.7 // gap between bars
const W = 20 // digit width (without its dot)
const H = 36 // digit height
const CELL = 26 // digit plus its dot
const STEP = 30 // from one digit to the next
const COLON = 8 // extra room for the colon on 4-digit displays

const L = T / 2
const R = W - T / 2
const TOP = T / 2
const MID = H / 2
const BOT = H - T / 2

const across = (x1: number, x2: number, y: number) =>
  `${x1},${y} ${x1 + T / 2},${y - T / 2} ${x2 - T / 2},${y - T / 2} ${x2},${y} ${x2 - T / 2},${y + T / 2} ${x1 + T / 2},${y + T / 2}`
const down = (x: number, y1: number, y2: number) =>
  `${x},${y1} ${x + T / 2},${y1 + T / 2} ${x + T / 2},${y2 - T / 2} ${x},${y2} ${x - T / 2},${y2 - T / 2} ${x - T / 2},${y1 + T / 2}`

const BARS = {
  a: across(L + G, R - G, TOP),
  b: down(R, TOP + G, MID - G),
  c: down(R, MID + G, BOT - G),
  d: across(L + G, R - G, BOT),
  e: down(L, MID + G, BOT - G),
  f: down(L, TOP + G, MID - G),
  g: across(L + G, R - G, MID),
} as const
type Bar = keyof typeof BARS
const BAR_NAMES = Object.keys(BARS) as Bar[]

/** Which bars light up for each character a 7-segment display can show. */
const GLYPHS: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc',
  '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg',
  '-': 'g', _: 'd', '=': 'dg', "'": 'f', '"': 'bf', '°': 'abfg', ' ': '',
  A: 'abcefg', b: 'cdefg', C: 'adef', c: 'deg', d: 'bcdeg', E: 'adefg', F: 'aefg',
  G: 'acdef', H: 'bcefg', h: 'cefg', I: 'ef', J: 'bcde', L: 'def', n: 'ceg', N: 'abcef',
  o: 'cdeg', O: 'abcdef', P: 'abefg', q: 'abcfg', r: 'eg', S: 'acdfg', t: 'defg',
  U: 'bcdef', u: 'cde', y: 'bcdfg', Y: 'bcdfg', Z: 'abged',
}

function glyph(char: string): string {
  return GLYPHS[char] ?? GLYPHS[char.toUpperCase()] ?? GLYPHS[char.toLowerCase()] ?? ''
}

type Cell = { bars: string; dot: boolean }

/** Splits text into digit cells; a "." lights the dot of the digit before it. */
function cells(text: string, count: number): Cell[] {
  const out: Cell[] = []
  for (const char of text) {
    if ((char === '.' || char === ',') && out.length > 0 && !out[out.length - 1].dot) {
      out[out.length - 1].dot = true
    } else if (char === '.' || char === ',') {
      out.push({ bars: '', dot: true })
    } else if (char !== ':') {
      out.push({ bars: glyph(char), dot: false })
    }
  }
  // right-aligned like a calculator: the last digits stay in view
  const shown = out.slice(-count)
  while (shown.length < count) shown.unshift({ bars: '', dot: false })
  return shown
}

function formatVolts(volts: number, digits: number) {
  const v = Math.max(0, volts)
  if (digits === 1) return String(Math.min(9, Math.round(v)))
  if (digits === 2) return Math.min(9.9, v).toFixed(1)
  return v.toFixed(2)
}

/** What the display shows right now. */
function content(data: PartData, digits: number, now: number, count: number, volts: number) {
  const { h, m, s, ms } = clockParts(new Date(now))
  switch (data.mode) {
    case 'counter':
      return { text: String(count % 10 ** digits), colon: false }
    case 'clock':
      if (digits === 1) return { text: s[1], colon: false }
      if (digits === 2) return { text: `${s}${ms < 500 ? '.' : ''}`, colon: false }
      if (digits === 4) return { text: `${h}${m}`, colon: ms < 500 }
      return { text: `${h}-${m}-${s}`, colon: false }
    case 'volts':
      return { text: formatVolts(volts, digits), colon: false }
    default:
      return { text: data.text ?? '', colon: digits === 4 && (data.text ?? '').includes(':') }
  }
}

export function SegmentFace({ data, powered, volts }: { data: PartData; powered: boolean; volts: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const digits = segmentDigits(data)
  const ticking = powered && (data.mode === 'clock' || data.mode === 'counter')
  const live = useLive(ref, ticking)
  const [now, setNow] = useState(() => Date.now())
  const [count, setCount] = useState(0)
  // the counter starts from 0 each time the display gets power
  const startedAt = useRef(0)
  useEffect(() => {
    if (powered) startedAt.current = Date.now()
  }, [powered])
  useFrameLoop(live, 4, () => {
    const time = Date.now()
    setNow(time)
    setCount(Math.floor((time - startedAt.current) / 1000))
  })

  const color = TINT_COLORS[(data.tint as DisplayTint) ?? 'red'] ?? TINT_COLORS.red
  const shown = powered ? content(data, digits, now, count, volts) : { text: '', colon: false }
  const list = cells(shown.text, digits)
  const x = (i: number) => i * STEP + (digits === 4 && i >= 2 ? COLON : 0)
  const width = x(digits - 1) + CELL + 6
  const colonX = x(2) - (STEP - CELL + COLON) / 2 - 2

  return (
    <div ref={ref} className="screen-module seg-module" style={{ ['--seg' as string]: color }}>
      <svg viewBox={`-2 -3 ${width} ${H + 6}`} className="seg-digits" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <g transform="translate(4 0) skewX(-6)">
          {list.map((cell, i) => (
            <g key={i} transform={`translate(${x(i)} 0)`}>
              {BAR_NAMES.map((bar) => (
                <polygon key={bar} points={BARS[bar]} className={cell.bars.includes(bar) ? 'seg-on' : 'seg-off'} />
              ))}
              <circle cx={W + 3.2} cy={BOT} r={1.9} className={cell.dot ? 'seg-on' : 'seg-off'} />
            </g>
          ))}
          {digits === 4 && (
            <g className={shown.colon ? 'seg-on' : 'seg-off'}>
              <circle cx={colonX} cy={H * 0.32} r={1.8} />
              <circle cx={colonX} cy={H * 0.68} r={1.8} />
            </g>
          )}
        </g>
      </svg>
      {!powered && <NoPower />}
    </div>
  )
}
