import type { ReactNode } from 'react'
import { r2, SEGMENTS, STEEL, url, type Stop } from './palette'

/*
 * The shared hand of every tool drawing: gradients lit from the top left,
 * the soft shadow under each tool, steel and copper colours, seven-segment
 * numbers and a few pieces (clips, probes, handles) that several tools share.
 * Every drawing is a 48 × 48 box.
 */

function stopsOf(stops: Stop[]) {
  return stops.map((s, i) => {
    const [offset, color, opacity] =
      typeof s === 'string' ? [stops.length === 1 ? 0 : i / (stops.length - 1), s, undefined] : s
    return <stop key={i} offset={r2(offset)} stopColor={color} stopOpacity={opacity} />
  })
}

/** top to bottom */
export function V({ id, stops }: { id: string; stops: Stop[] }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      {stopsOf(stops)}
    </linearGradient>
  )
}

/** left to right */
export function H({ id, stops }: { id: string; stops: Stop[] }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      {stopsOf(stops)}
    </linearGradient>
  )
}

/** a round highlight up on the top left */
export function R({ id, stops, cx = 0.35, cy = 0.3, r = 0.8 }: { id: string; stops: Stop[]; cx?: number; cy?: number; r?: number }) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r={r}>
      {stopsOf(stops)}
    </radialGradient>
  )
}

export function Shadow({ cx = 24, y = 42, rx = 14 }: { cx?: number; y?: number; rx?: number }) {
  return <ellipse cx={cx} cy={y} rx={rx} ry="2.2" fill="currentColor" opacity="0.12" />
}

/* ── seven-segment numbers, for the meters and screens ── */

export function Readout({
  x,
  y,
  value,
  w,
  h,
  t,
  gap,
  on,
  off,
}: {
  x: number
  y: number
  value: string
  w: number
  h: number
  t: number
  gap: number
  on: string
  off?: string
}) {
  const out: ReactNode[] = []
  let left = x
  ;[...value].forEach((ch, i) => {
    if (ch === '.') {
      out.push(<rect key={i} x={r2(left - gap / 2 - t / 2)} y={r2(y + h - t)} width={t} height={t} rx={r2(t / 3)} fill={on} />)
      return
    }
    const lit = SEGMENTS[Number(ch)] ?? ''
    const half = h / 2
    const v = half - 1.5 * t
    const seg: Record<string, [number, number, number, number]> = {
      a: [left + t, y, w - 2 * t, t],
      b: [left + w - t, y + t, t, v],
      c: [left + w - t, y + half + t / 2, t, v],
      d: [left + t, y + h - t, w - 2 * t, t],
      e: [left, y + half + t / 2, t, v],
      f: [left, y + t, t, v],
      g: [left + t, y + half - t / 2, w - 2 * t, t],
    }
    for (const [name, [sx, sy, sw, sh]] of Object.entries(seg)) {
      const isOn = lit.includes(name)
      if (!isOn && !off) continue
      out.push(
        <rect
          key={`${i}${name}`}
          x={r2(sx)}
          y={r2(sy)}
          width={r2(sw)}
          height={r2(sh)}
          rx={r2(t / 2.5)}
          fill={isOn ? on : off}
        />,
      )
    }
    left += w + gap
  })
  return <>{out}</>
}

/** A crocodile clip lying with its jaws to the left; the wire leaves at (24.4, 0). */
export function Clip({ id, boot, open = 8 }: { id: string; boot: Stop[]; open?: number }) {
  const jaw =
    'M0.3 -0.5C0.6 -1.6 1.6 -2.1 3 -2.3L15 -4.2L15 -1L10.2 -0.75l-0.7 0.75-0.7 -0.75-0.7 0.75-0.7 -0.75-0.7 0.75-0.7 -0.75-0.7 0.75-0.7 -0.75-0.7 0.75-0.7 -0.75-0.7 0.75-0.7 -0.75L0.3 -0.5Z'
  return (
    <>
      <defs>
        <V id={`${id}m`} stops={STEEL} />
        <V id={`${id}b`} stops={boot} />
      </defs>
      <path d={jaw} fill={url(`${id}m`)} stroke="#52525b" strokeWidth="0.25" transform={`rotate(${-open / 2} 11.2 0)`} />
      <path
        d={jaw}
        fill={url(`${id}m`)}
        stroke="#52525b"
        strokeWidth="0.25"
        transform={`rotate(${open / 2} 11.2 0) scale(1 -1)`}
      />
      <circle cx="11.2" cy="0" r="0.95" fill="#d4d4d8" stroke="#52525b" strokeWidth="0.3" />
      <path
        d="M12.2 -4.4C16 -5.4 20.4 -4.4 23.6 -2.4C24.6 -1.8 24.6 1.8 23.6 2.4C20.4 4.4 16 5.4 12.2 4.4C11.3 2.2 11.3 -2.2 12.2 -4.4Z"
        fill={url(`${id}b`)}
      />
      <path d="M16.4 -4.1V4.1M18 -3.8V3.8M19.6 -3.4V3.4" stroke="#000" strokeWidth="0.45" opacity="0.18" />
      <path d="M13.5 -3.3C16.8 -4.2 20 -3.5 22.6 -2" fill="none" stroke="#fff" strokeWidth="0.7" strokeLinecap="round" opacity="0.4" />
    </>
  )
}

export function Probe({ id, x }: { id: string; x: number }) {
  return (
    <g>
      <path d={`M${x} 14V7.6`} stroke="#d4d4d8" strokeWidth="0.95" strokeLinecap="round" />
      <path d={`M${x - 0.15} 13.6V8.4`} stroke="#fff" strokeWidth="0.3" strokeLinecap="round" opacity="0.8" />
      <rect x={x - 2.3} y="13.6" width="4.6" height="1.7" rx="0.85" fill={url(id)} />
      <rect x={x - 1.45} y="14.8" width="2.9" height="19.6" rx="1.35" fill={url(id)} />
      <rect x={x - 1} y="34" width="2" height="2.6" rx="0.6" fill={url(id)} />
      <rect x={x - 0.95} y="16.4" width="0.7" height="16" rx="0.35" fill="#fff" opacity="0.3" />
      <path d={`M${x - 1.45} 27.5h2.9M${x - 1.45} 29.2h2.9M${x - 1.45} 30.9h2.9`} stroke="#000" strokeWidth="0.35" opacity="0.25" />
    </g>
  )
}

export function Tube({ x, y, len, d, fill }: { x: number; y: number; len: number; d: number; fill: string }) {
  const e = r2(d * 0.25)
  const half = r2(d / 2)
  return (
    <g>
      <path d={`M${x} ${y}H${x + len}A${e} ${half} 0 0 1 ${x + len} ${r2(y + d)}H${x}A${e} ${half} 0 0 1 ${x} ${y}Z`} fill={fill} />
      <path d={`M${x + 0.4} ${r2(y + d * 0.24)}H${x + len - 0.6}`} stroke="#fff" strokeWidth={r2(d * 0.12)} strokeLinecap="round" opacity="0.35" />
      <ellipse cx={x + len} cy={r2(y + half)} rx={e} ry={half} fill="#000" opacity="0.25" />
      <ellipse cx={x + len} cy={r2(y + half)} rx={r2(e * 0.72)} ry={r2(half * 0.78)} fill="#0a0a0a" opacity="0.75" />
    </g>
  )
}

/** Two handles from the pivot at (24, 21.5) down to the bottom, with rubber grips. */
export function Handles({ color, light, spring = true }: { color: string; light: string; spring?: boolean }) {
  return (
    <g strokeLinecap="round" fill="none">
      {spring && <path d="M21 29.4C22.4 26.8 25.6 26.8 27 29.4" stroke="#a1a1aa" strokeWidth="0.6" />}
      <path d="M23 22L14.5 40.4M25 22L33.5 40.4" stroke="#a1a1aa" strokeWidth="2.2" />
      <path d="M22.7 22.4L18.8 30.8M25.3 22.4L29.2 30.8" stroke="#fff" strokeWidth="0.5" opacity="0.6" />
      <path d="M20.4 27.4L14.4 40.4M27.6 27.4L33.6 40.4" stroke={color} strokeWidth="4.2" />
      <path d="M19.6 28.4L14.6 39.2M27.8 27.9L32.9 38.9" stroke={light} strokeWidth="1.1" opacity="0.75" />
    </g>
  )
}

export function Pivot({ id }: { id: string }) {
  return (
    <>
      <circle cx="24" cy="21.5" r="2.1" fill={url(id)} stroke="#52525b" strokeWidth="0.3" />
      <circle cx="24" cy="21.5" r="0.7" fill="#3f3f46" />
    </>
  )
}

export function Cell({ id, x, y, flip }: { id: string; x: number; y: number; flip?: boolean }) {
  // an AA cell lying down, + to the right unless it is flipped
  return (
    <g transform={flip ? `translate(${2 * x + 25.9} 0) scale(-1 1)` : undefined}>
      <rect x={x + 24.8} y={y + 2.4} width="1.1" height="2.6" rx="0.4" fill="#a1a1aa" />
      <rect x={x} y={y} width="24.8" height="7.4" rx="2" fill={url(`${id}b`)} />
      <path d={`M${x + 17} ${y}H${x + 22.8}A2 2 0 0 1 ${x + 24.8} ${y + 2}V${y + 5.4}A2 2 0 0 1 ${x + 22.8} ${y + 7.4}H${x + 17}Z`} fill={url(`${id}c`)} />
      <path d={`M${x + 20.9} ${y + 2.5}v2.4M${x + 19.7} ${y + 3.7}h2.4`} stroke="#451a03" strokeWidth="0.75" strokeLinecap="round" />
      <rect x={x + 1.5} y={y + 1} width="21.8" height="1.1" rx="0.55" fill="#fff" opacity="0.22" />
    </g>
  )
}
