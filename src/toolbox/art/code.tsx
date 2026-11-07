import { H, Shadow, V } from './kit'
import { r2, STEEL, url, type ArtProps } from './palette'

/* ───────────────────────── Program and connect: the newer tools ───────────────────────── */

const GOLD = ['#fde68a', '#eab308', '#a16207']

/**
 * A USB-A plug seen from above, its tip at (0, 0) and its body along +x.
 * Needs the gradients `${id}m` (metal) and `${id}k` (black plastic).
 */
function PlugA({ id }: { id: string }) {
  return (
    <g>
      <rect x="0" y="-2.4" width="5.8" height="4.8" rx="0.35" fill={url(`${id}m`)} stroke="#71717a" strokeWidth="0.2" />
      <rect x="1.3" y="-1.55" width="1.3" height="1" rx="0.15" fill="#3f3f46" />
      <rect x="1.3" y="0.55" width="1.3" height="1" rx="0.15" fill="#3f3f46" />
      <path d="M0.4 -1.95H5.4" stroke="#fff" strokeWidth="0.35" strokeLinecap="round" opacity="0.7" />
      <path d="M13.4 -2.3L16 -1.1V1.1L13.4 2.3Z" fill={url(`${id}k`)} />
      <rect x="5.4" y="-3.1" width="8.4" height="6.2" rx="1.2" fill={url(`${id}k`)} />
      <path d="M6.4 -2.5H12.8" stroke="#fff" strokeWidth="0.35" strokeLinecap="round" opacity="0.25" />
      {/* the USB trident */}
      <g stroke="#d4d4d8" strokeWidth="0.3" fill="none" strokeLinecap="round" opacity="0.85">
        <path d="M7.4 0H12.1M8.7 0L9.9 -1.25H11M9.5 0L10.6 1.15H11.2" />
      </g>
      <circle cx="7.2" cy="0" r="0.42" fill="#d4d4d8" opacity="0.85" />
      <path d="M12 -0.5L12.9 0L12 0.5Z" fill="#d4d4d8" opacity="0.85" />
      <circle cx="11.3" cy="-1.25" r="0.32" fill="#d4d4d8" opacity="0.85" />
      <rect x="11.2" y="0.85" width="0.6" height="0.6" fill="#d4d4d8" opacity="0.85" />
    </g>
  )
}

/** A USB-C plug, its tip at (0, 0) and its body along +x. Uses the same gradients as PlugA. */
function PlugC({ id }: { id: string }) {
  return (
    <g>
      <rect x="0" y="-1.4" width="4.6" height="2.8" rx="1.4" fill={url(`${id}m`)} stroke="#71717a" strokeWidth="0.2" />
      <rect x="0.7" y="-0.45" width="2.6" height="0.9" rx="0.45" fill="#27272a" />
      <path d="M11 -1.9L13.4 -0.9V0.9L11 1.9Z" fill={url(`${id}k`)} />
      <rect x="4.2" y="-2.5" width="7.2" height="5" rx="1.6" fill={url(`${id}k`)} />
      <path d="M5.2 -1.9H10.4" stroke="#fff" strokeWidth="0.35" strokeLinecap="round" opacity="0.25" />
    </g>
  )
}

/** A blue braided cable along a path. */
function Cable({ d }: { d: string }) {
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke="#172554" strokeWidth="2.3" />
      <path d={d} stroke="#2563eb" strokeWidth="1.65" />
      <path d={d} stroke="#1e3a8a" strokeWidth="1.65" strokeDasharray="0.45 0.45" opacity="0.45" />
      <path d={d} stroke="#93c5fd" strokeWidth="0.4" opacity="0.6" transform="translate(-0.3 -0.35)" />
    </g>
  )
}

function UsbCable({ id }: ArtProps) {
  const loops = [
    { cx: 24.5, cy: 17.2, rx: 13.6, ry: 8, a: -6 },
    { cx: 23.6, cy: 18.4, rx: 12.8, ry: 7.4, a: 4 },
    { cx: 25.2, cy: 16.6, rx: 12.2, ry: 6.8, a: -12 },
  ]
  return (
    <>
      <defs>
        <V id={`${id}m`} stops={STEEL} />
        <V id={`${id}k`} stops={['#52525b', '#27272a', '#09090b']} />
        <V id={`${id}s`} stops={['#a1a1aa', '#52525b', '#3f3f46']} />
      </defs>
      <Shadow y={41.6} rx={20} />
      {loops.map((l) => (
        <g key={l.cx} transform={`rotate(${l.a} ${l.cx} ${l.cy})`}>
          <Cable d={`M${l.cx - l.rx} ${l.cy}A${l.rx} ${l.ry} 0 1 1 ${l.cx + l.rx} ${l.cy}A${l.rx} ${l.ry} 0 1 1 ${l.cx - l.rx} ${l.cy}Z`} />
        </g>
      ))}
      {/* the two ends hang out of the coil */}
      <Cable d="M16.6 30.2C18.4 28.6 17.4 25.2 14.8 23" />
      <Cable d="M34.3 31C32.4 29.4 33.2 25.2 34.8 23" />
      {/* a hook-and-loop strap keeps the coil together */}
      <rect x="9.3" y="12.4" width="3.9" height="10" rx="1" fill={url(`${id}s`)} />
      <path d="M10.2 13.2V21.6" stroke="#e4e4e7" strokeWidth="0.35" strokeDasharray="0.6 0.5" opacity="0.7" />
      <g transform="translate(4 40.2) rotate(-38)">
        <PlugA id={id} />
      </g>
      <g transform="translate(44.6 39.2) rotate(38) scale(-1 1)">
        <PlugC id={id} />
      </g>
    </>
  )
}

/** One line of code: an indent and coloured words, each [width, colour]. */
type Line = [indent: number, words: [number, string][]]

const KW = '#f472b6'
const FN = '#60a5fa'
const NUM = '#c4b5fd'
const TXT = '#e5e7eb'
const COM = '#6b7280'
const STR = '#fbbf24'

const CODE: Line[] = [
  [0, [[2.6, KW], [3.6, FN], [1.2, TXT]]],
  [1, [[4.6, FN], [1.2, NUM], [3.2, STR]]],
  [0, [[0.8, TXT]]],
  [0, []],
  [0, [[2.6, KW], [3, FN], [1.2, TXT]]],
  [1, [[5.8, COM]]],
  [1, [[5.6, FN], [1.2, NUM], [2.4, KW]]],
  [1, [[3.2, FN], [2.2, NUM]]],
  [1, [[5.6, FN], [1.2, NUM], [2, KW]]],
  [1, [[3.2, FN], [2.2, NUM]]],
  [0, [[0.8, TXT]]],
]

function Laptop({ id }: ArtProps) {
  // the base is seen from above at a slant: narrow at the back, wide at the front
  const back = 30.2
  const front = 37.4
  const edge = (y: number) => {
    const f = (y - back) / (front - back)
    return [8.4 - 5 * f, 39.6 + 5 * f]
  }
  const at = (y: number, f: number) => {
    const [l, r] = edge(y)
    const inset = (r - l) * 0.075
    return r2(l + inset + f * (r - l - 2 * inset))
  }
  const key = (y0: number, y1: number, a: number, b: number) =>
    `M${at(y0, a)} ${y0}H${at(y0, b)}L${at(y1, b)} ${y1}H${at(y1, a)}Z`
  const rows: { y0: number; y1: number; keys: number[] }[] = [
    { y0: 30.7, y1: 31.4, keys: Array(13).fill(1) },
    { y0: 31.7, y1: 32.45, keys: [1.5, ...Array(11).fill(1), 1.5] },
    { y0: 32.75, y1: 33.55, keys: [1.8, ...Array(10).fill(1), 2.2] },
    { y0: 33.85, y1: 34.7, keys: [1, 1, 1.2, 6, 1.2, 1, 1] },
  ]
  const gap = 0.012
  return (
    <>
      <defs>
        <V id={`${id}b`} stops={['#f4f4f5', '#d4d4d8', '#a1a1aa']} />
        <V id={`${id}e`} stops={['#a1a1aa', '#52525b']} />
        <V id={`${id}l`} stops={['#52525b', '#27272a', '#18181b']} />
      </defs>
      <Shadow y={40.4} rx={22} />
      {/* the base with its keyboard and trackpad */}
      <path d={`M3.4 ${front}H44.6V38.4C44.6 39.2 44 39.8 43 39.8H5C4 39.8 3.4 39.2 3.4 38.4Z`} fill={url(`${id}e`)} />
      <path d={`M8.4 ${back}H39.6L44.6 ${front}H3.4Z`} fill={url(`${id}b`)} />
      <path d={`M3.6 ${front}H44.4`} stroke="#fff" strokeWidth="0.35" opacity="0.8" />
      <path d="M21 39.8A3 0.9 0 0 1 27 39.8" fill="#3f3f46" />
      {rows.map((row) => {
        const total = row.keys.reduce((s, k) => s + k, 0)
        let from = 0
        return row.keys.map((k, i) => {
          const a = from / total
          from += k
          return <path key={`${row.y0}${i}`} d={key(row.y0, row.y1, a + gap, from / total - gap)} fill="#3f3f46" />
        })
      })}
      <path d={key(35.2, 36.9, 0.36, 0.64)} fill="#c4c4cc" stroke="#a1a1aa" strokeWidth="0.2" />
      {/* the lid and its screen with code on it */}
      <rect x="8.4" y="6.6" width="31.2" height="24.2" rx="1.8" fill={url(`${id}l`)} stroke="#a1a1aa" strokeWidth="0.35" />
      <circle cx="24" cy="7.5" r="0.32" fill="#71717a" />
      <rect x="9.7" y="8.3" width="28.6" height="21.2" rx="0.5" fill="#111827" />
      <rect x="9.7" y="8.3" width="28.6" height="1.6" fill="#1f2937" />
      <rect x="12.6" y="8.3" width="6.4" height="1.6" fill="#111827" />
      <rect x="12.6" y="8.3" width="6.4" height="0.35" fill="#ec4899" />
      <rect x="13.4" y="8.85" width="3.6" height="0.55" rx="0.2" fill="#9ca3af" />
      <rect x="19.8" y="8.85" width="3.6" height="0.55" rx="0.2" fill="#4b5563" />
      <rect x="9.7" y="9.9" width="2.6" height="18.6" fill="#0b1120" />
      <rect x="12.3" y="18.15" width="26" height="1.4" fill="#fff" opacity="0.05" />
      {CODE.map(([indent, words], i) => {
        const y = 10.9 + i * 1.55
        let x = 13.2 + indent * 1.7
        return (
          <g key={i}>
            <rect x={i >= 9 ? 10.2 : 10.8} y={y} width={i >= 9 ? 1.4 : 0.8} height="0.7" rx="0.2" fill="#4b5563" />
            {words.map(([w, color], j) => {
              const bar = <rect key={j} x={r2(x)} y={y} width={w} height="0.7" rx="0.3" fill={color} />
              x += w + 0.5
              return bar
            })}
          </g>
        )
      })}
      <rect x="20.6" y="18.4" width="0.35" height="1" fill="#f9fafb" />
      <rect x="9.7" y="28.5" width="28.6" height="1" fill="#2563eb" />
      <rect x="10.4" y="28.8" width="3" height="0.4" rx="0.2" fill="#fff" opacity="0.8" />
      <rect x="33.6" y="28.8" width="4" height="0.4" rx="0.2" fill="#fff" opacity="0.8" />
      <path d="M9.7 8.3H19.6L12.4 29.5H9.7Z" fill="#fff" opacity="0.05" />
      <rect x="10.4" y={back - 0.5} width="27.2" height="1" rx="0.5" fill="#3f3f46" />
    </>
  )
}

function UsbSerial({ id }: ArtProps) {
  const pins = Array.from({ length: 6 }, (_, i) => r2(16.9 + i * 3))
  // the jumper wires: which pin, its colour, its highlight and where its end rests
  const wires = [
    { pin: 0, color: '#2563eb', light: '#93c5fd', end: 45.6 },
    { pin: 3, color: '#16a34a', light: '#86efac', end: 42 },
    { pin: 4, color: '#eab308', light: '#fef08a', end: 38.4 },
  ]
  return (
    <>
      <defs>
        <V id={`${id}p`} stops={['#f87171', '#dc2626', '#991b1b']} />
        <V id={`${id}m`} stops={STEEL} />
        <V id={`${id}g`} stops={GOLD} />
        <V id={`${id}k`} stops={['#52525b', '#18181b', '#09090b']} />
      </defs>
      <Shadow y={42.6} rx={21} />
      {/* the red board */}
      <rect x="11.5" y="15.5" width="24.5" height="19" rx="1.2" fill="#7f1d1d" />
      <rect x="11.5" y="14.5" width="24.5" height="19" rx="1.2" fill={url(`${id}p`)} />
      <path d="M12.6 15.2H35" stroke="#fff" strokeWidth="0.4" strokeLinecap="round" opacity="0.35" />
      <circle cx="33.4" cy="31.4" r="0.9" fill="#fbbf24" stroke="#7f1d1d" strokeWidth="0.3" />
      <circle cx="33.4" cy="16.6" r="0.9" fill="#fbbf24" stroke="#7f1d1d" strokeWidth="0.3" />
      {/* the USB plug soldered onto one end */}
      <rect x="2.4" y="18" width="11.2" height="12" rx="0.5" fill={url(`${id}m`)} stroke="#71717a" strokeWidth="0.25" />
      <rect x="4.4" y="19.8" width="2.2" height="1.6" rx="0.2" fill="#3f3f46" />
      <rect x="4.4" y="26.6" width="2.2" height="1.6" rx="0.2" fill="#3f3f46" />
      <path d="M2.8 18.6V29.4" stroke="#52525b" strokeWidth="0.5" />
      <path d="M10.8 18.4V29.6" stroke="#71717a" strokeWidth="0.3" opacity="0.7" />
      <path d="M3.4 18.6H12.8" stroke="#fff" strokeWidth="0.45" strokeLinecap="round" opacity="0.8" />
      {/* the chip that speaks USB on one side and serial on the other */}
      <rect x="17.6" y="20.4" width="7" height="7" rx="0.4" fill="#18181b" />
      {Array.from({ length: 5 }, (_, i) => {
        const p = r2(18.7 + i * 1.2)
        return (
          <g key={i} fill="#a1a1aa">
            <rect x={p} y="19.8" width="0.5" height="0.6" />
            <rect x={p} y="27.4" width="0.5" height="0.6" />
            <rect x="17" y={r2(p + 1.7)} width="0.6" height="0.5" />
            <rect x="24.6" y={r2(p + 1.7)} width="0.6" height="0.5" />
          </g>
        )
      })}
      <circle cx="18.6" cy="21.4" r="0.35" fill="#52525b" />
      <path d="M18.2 21H24" stroke="#fff" strokeWidth="0.3" opacity="0.15" />
      {/* tiny parts and the two lights that blink when data goes by */}
      {[
        [14.4, 16.6],
        [14.4, 30.8],
        [26.4, 30.6],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <rect x={x} y={y} width="1.8" height="0.9" rx="0.15" fill="#a16207" />
          <rect x={x} y={y} width="0.4" height="0.9" fill="#d4d4d8" />
          <rect x={x + 1.4} y={y} width="0.4" height="0.9" fill="#d4d4d8" />
        </g>
      ))}
      <circle cx="28.3" cy="18.6" r="1.7" fill="#4ade80" opacity="0.35" />
      <rect x="27.4" y="18.15" width="1.8" height="0.9" rx="0.2" fill="#bbf7d0" />
      <circle cx="28.3" cy="21.6" r="1.7" fill="#fb923c" opacity="0.35" />
      <rect x="27.4" y="21.15" width="1.8" height="0.9" rx="0.2" fill="#fed7aa" />
      {pins.map((y, i) => (
        <rect key={y} x={[30.4, 30.9, 30.4, 31.2, 30.7, 30.9][i]} y={y - 0.35} width={[2.6, 2.1, 2.6, 1.8, 2.3, 2.1][i]} height="0.7" rx="0.2" fill="#fff" opacity="0.85" />
      ))}
      {/* the row of six pins sticking out of the end */}
      <rect x="33.6" y="15.4" width="2.6" height="17.4" rx="0.3" fill={url(`${id}k`)} />
      {pins.map((y) => (
        <rect key={y} x="36.2" y={y - 0.4} width="4.4" height="0.8" fill={url(`${id}g`)} />
      ))}
      {wires.map((w) => {
        const y = pins[w.pin]
        return (
          <g key={w.pin}>
            <path d={`M43 ${y}C46.6 ${y} ${w.end} ${y + 8} ${w.end} 37.8`} fill="none" stroke={w.color} strokeWidth="1.3" strokeLinecap="round" />
            <path
              d={`M43 ${y - 0.3}C46.2 ${y - 0.3} ${w.end - 0.3} ${y + 8} ${w.end - 0.3} 37.4`}
              fill="none"
              stroke={w.light}
              strokeWidth="0.35"
              strokeLinecap="round"
              opacity="0.6"
            />
            <rect x="38.6" y={y - 1.2} width="4.6" height="2.4" rx="0.4" fill={url(`${id}k`)} />
            <rect x="39" y={y - 0.95} width="3.8" height="0.45" rx="0.2" fill="#fff" opacity="0.2" />
            <rect x={w.end - 0.9} y="37.6" width="1.8" height="3.4" rx="0.35" fill={url(`${id}k`)} />
            <rect x={w.end - 0.3} y="41" width="0.6" height="2.4" rx="0.2" fill="#d4d4d8" />
          </g>
        )
      })}
    </>
  )
}

/** Points along a cubic curve, each with the unit normal to its left. */
function along(p: number[][], n: number) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = p
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    const u = 1 - t
    const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3
    const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3
    const dx = 3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2)
    const dy = 3 * u * u * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t * t * (y3 - y2)
    const len = Math.hypot(dx, dy) || 1
    return { x, y, nx: dy / len, ny: -dx / len }
  })
}

/** A strip of the ribbon between two distances from its middle line. */
function strip(pts: ReturnType<typeof along>, a: number, b: number) {
  const side = (o: number) => pts.map((p) => `${r2(p.x + p.nx * o)} ${r2(p.y + p.ny * o)}`)
  return `M${side(a).join('L')}L${side(b).reverse().join('L')}Z`
}

function line(pts: ReturnType<typeof along>, o: number) {
  return `M${pts.map((p) => `${r2(p.x + p.nx * o)} ${r2(p.y + p.ny * o)}`).join('L')}`
}

function Programmer({ id }: ArtProps) {
  const ribbon = along(
    [
      [31, 23.6],
      [31, 30.4],
      [37, 28.4],
      [37, 34.6],
    ],
    20,
  )
  return (
    <>
      <defs>
        <V id={`${id}m`} stops={STEEL} />
        <V id={`${id}k`} stops={['#52525b', '#27272a', '#09090b']} />
        <V id={`${id}b`} stops={['#a5b4fc', '#6366f1', '#3730a3']} />
        <H id={`${id}c`} stops={['#71717a', '#3f3f46', '#27272a']} />
      </defs>
      <Shadow y={42.4} rx={21} />
      {/* the USB lead */}
      <path d="M12.8 17.6C8.6 17.6 6.6 20.4 6.6 25.8" fill="none" stroke="#3f3f46" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12.4 17C8.8 17.2 6.6 19.6 6.1 23.6" fill="none" stroke="#d4d4d8" strokeWidth="0.4" strokeLinecap="round" opacity="0.6" />
      <g transform="translate(6.6 41.6) rotate(-90)">
        <PlugA id={id} />
      </g>
      {/* the grey ribbon cable, red stripe on wire 1 */}
      <path d={strip(ribbon, -3.5, 3.5)} fill="#d4d4d8" />
      {Array.from({ length: 9 }, (_, k) => (
        <path key={k} d={line(ribbon, -2.8 + k * 0.7)} fill="none" stroke="#71717a" strokeWidth="0.18" opacity="0.6" />
      ))}
      <path d={strip(ribbon, 2.8, 3.5)} fill="#dc2626" />
      <path d={line(ribbon, -3.5)} fill="none" stroke="#a1a1aa" strokeWidth="0.25" />
      {/* the black plug that pushes onto the board's pins */}
      <rect x="31" y="33.6" width="12.4" height="6.2" rx="0.6" fill={url(`${id}k`)} />
      <rect x="31" y="33.6" width="12.4" height="2.1" rx="0.5" fill="#3f3f46" />
      <rect x="35" y="39.4" width="4.4" height="1" rx="0.3" fill="#18181b" />
      <path d="M31.8 34.1H42.6" stroke="#fff" strokeWidth="0.35" strokeLinecap="round" opacity="0.3" />
      <path d="M41.4 37.2L42.4 38.6H40.4Z" fill="#e4e4e7" />
      {[33.2, 34.6, 36, 37.4, 38.8].map((x) => (
        <rect key={x} x={x} y="36.6" width="0.6" height="0.6" fill="#71717a" />
      ))}
      {/* the programmer: a metal stick with plastic ends */}
      <rect x="12.4" y="11.2" width="26.2" height="12.8" rx="2.4" fill={url(`${id}c`)} />
      <rect x="15" y="11.2" width="21" height="12.8" fill={url(`${id}b`)} />
      <path d="M13.4 12.2H37.6" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" opacity="0.35" />
      <path d="M15 12.4H36" stroke="#e0e7ff" strokeWidth="0.6" opacity="0.5" />
      {/* its label, with the pin map */}
      <rect x="17" y="15" width="11.6" height="6.6" rx="0.5" fill="#f8fafc" />
      <rect x="18" y="15.9" width="5.6" height="0.8" rx="0.3" fill="#3f3f46" />
      <rect x="18" y="17.4" width="3.6" height="0.6" rx="0.3" fill="#a1a1aa" />
      {[0, 1].map((row) =>
        Array.from({ length: 5 }, (_, i) => (
          <circle key={`${row}${i}`} cx={r2(18.6 + i * 1.6)} cy={19.2 + row * 1.3} r="0.42" fill={row === 0 && i === 0 ? '#dc2626' : '#52525b'} />
        )),
      )}
      <circle cx="32" cy="15.6" r="1.3" fill="#4ade80" opacity="0.4" />
      <circle cx="32" cy="15.6" r="0.6" fill="#bbf7d0" />
      <circle cx="34.6" cy="15.6" r="0.6" fill="#7f1d1d" />
      <rect x="30.6" y="19.4" width="5" height="0.6" rx="0.3" fill="#e0e7ff" opacity="0.7" />
    </>
  )
}

function SdCard({ id }: ArtProps) {
  const sd = 'M2 0H18.6L24 5.4V30A2 2 0 0 1 22 32H2A2 2 0 0 1 0 30V2A2 2 0 0 1 2 0Z'
  const micro =
    'M0.8 0H10.2A0.8 0.8 0 0 1 11 0.8V5.4L10.2 6.4V8L11 8.8V14.2A0.8 0.8 0 0 1 10.2 15H0.8A0.8 0.8 0 0 1 0 14.2V0.8A0.8 0.8 0 0 1 0.8 0Z'
  return (
    <>
      <defs>
        <V id={`${id}b`} stops={['#52525b', '#27272a', '#18181b']} />
        <V id={`${id}l`} stops={['#38bdf8', '#2563eb', '#1e3a8a']} />
        <V id={`${id}g`} stops={GOLD} />
        <V id={`${id}u`} stops={['#3f3f46', '#18181b', '#09090b']} />
      </defs>
      <Shadow y={42} rx={19} />
      {/* the big SD card, label side up */}
      <g transform="translate(10 6.4) rotate(-10 12 16)">
        <path d={sd} fill={url(`${id}b`)} stroke="#71717a" strokeWidth="0.35" />
        <path d="M2.2 0.8H18.2" stroke="#fff" strokeWidth="0.45" strokeLinecap="round" opacity="0.35" />
        {[2.8, 4, 5.2, 6.4].map((y) => (
          <path key={y} d={`M4 ${y}H15.6`} stroke="#000" strokeWidth="0.35" opacity="0.5" />
        ))}
        {/* the lock switch on the side */}
        <rect x="-0.7" y="8.8" width="1.6" height="6.4" rx="0.4" fill="#09090b" />
        <rect x="-1" y="9" width="1.8" height="2.8" rx="0.4" fill="#f4f4f5" />
        <rect x="2.6" y="9.4" width="19" height="20" rx="1" fill={url(`${id}l`)} />
        <path d="M2.6 23L21.6 15.4V28.4A1 1 0 0 1 20.6 29.4H3.6A1 1 0 0 1 2.6 28.4Z" fill="#0ea5e9" opacity="0.35" />
        <path d="M6 12.6V16.4A2.2 2.2 0 0 0 10.4 16.4V12.6" fill="none" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="16.4" cy="14.6" r="2.6" fill="none" stroke="#fde047" strokeWidth="0.8" />
        <rect x="15.2" y="13.9" width="2.4" height="1.4" rx="0.3" fill="#fde047" />
        <rect x="5" y="22.6" width="9.6" height="1.4" rx="0.5" fill="#fff" />
        <rect x="5" y="25.2" width="6" height="0.9" rx="0.4" fill="#fff" opacity="0.7" />
        <path d="M3.4 10.2H20.8" stroke="#fff" strokeWidth="0.4" strokeLinecap="round" opacity="0.35" />
      </g>
      {/* a microSD card in front, turned over to show its gold contacts */}
      <g transform="translate(30 21) rotate(14) scale(1.1)">
        <path d={micro} fill="#000" opacity="0.25" transform="translate(0.4 0.5)" />
        <path d={micro} fill={url(`${id}u`)} stroke="#71717a" strokeWidth="0.3" />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={r2(0.95 + i * 1.15)} y={i === 3 ? 1.6 : 0.9} width="0.8" height={i === 3 ? 3.2 : 3.9} rx="0.2" fill={url(`${id}g`)} />
        ))}
        <path d="M1 6.6H9.4" stroke="#52525b" strokeWidth="0.3" />
        <rect x="2.4" y="10.4" width="5" height="0.8" rx="0.3" fill="#71717a" />
        <rect x="2.4" y="12" width="3.2" height="0.7" rx="0.3" fill="#52525b" />
      </g>
    </>
  )
}

export { UsbCable, Laptop, UsbSerial, Programmer, SdCard }
