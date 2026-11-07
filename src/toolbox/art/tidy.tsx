import { R, Shadow, V } from './kit'
import { LCD, r2, STEEL, url, type ArtProps, type Stop } from './palette'

/* ───────────────────────── Keep it tidy: the newer tools ───────────────────────── */

/** Spreads `n` things over a box in the same "random" way every time. */
function scatter(x0: number, y0: number, x1: number, y1: number, n: number, seed: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453
    const b = Math.sin((i + 1) * 39.3468 + seed * 11.135) * 24634.6345
    return { x: r2(x0 + (a - Math.floor(a)) * (x1 - x0)), y: r2(y0 + (b - Math.floor(b)) * (y1 - y0)), a: Math.round((a - Math.floor(a)) * 180) }
  })
}

function Leds({ x0, y0, x1, y1, color, light, seed }: { x0: number; y0: number; x1: number; y1: number; color: string; light: string; seed: number }) {
  return (
    <>
      {scatter(x0, y0, x1, y1, 4, seed).map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y + 0.25} r="1.15" fill="#000" opacity="0.2" />
          <circle cx={p.x} cy={p.y} r="1.15" fill={color} />
          <circle cx={p.x - 0.35} cy={p.y - 0.35} r="0.45" fill={light} opacity="0.9" />
        </g>
      ))}
    </>
  )
}

function PartsBox({ id }: ArtProps) {
  const wall = '#94a3b8'
  return (
    <>
      <defs>
        <V id={`${id}f`} stops={['#f1f5f9', '#dbe3ec']} />
        <V id={`${id}w`} stops={['#cbd5e1', '#94a3b8']} />
        <V id={`${id}l`} stops={['#60a5fa', '#2563eb', '#1e3a8a']} />
        <V id={`${id}r`} stops={['#f5e1bd', '#d6b27a']} />
        <V id={`${id}s`} stops={STEEL} />
        <R id={`${id}c`} stops={['#93c5fd', '#1d4ed8', '#172554']} />
      </defs>
      <Shadow y={41.6} rx={21} />
      {/* the front wall of the box */}
      <path d="M3.5 33.6H44.5V37.8A2 2 0 0 1 42.5 39.8H5.5A2 2 0 0 1 3.5 37.8Z" fill={url(`${id}w`)} />
      <path d="M4.4 38.4H43.6" stroke="#fff" strokeWidth="0.4" opacity="0.5" />
      {/* the floor, seen through the clear lid */}
      <rect x="3.5" y="8.4" width="41" height="27" rx="2" fill={url(`${id}f`)} stroke="#64748b" strokeWidth="0.5" />
      {/* the walls between the compartments */}
      <g stroke={wall} strokeWidth="0.9" strokeLinecap="round">
        <path d="M5 17.2H43M5 26H43" />
        <path d="M14.5 9.8V17.2M24 9.8V17.2M33.5 9.8V17.2" />
        <path d="M19.5 17.2V26M31 17.2V26" />
        <path d="M12 26V34M24 26V34M36 26V34" />
      </g>
      <g stroke="#fff" strokeWidth="0.3" opacity="0.8">
        <path d="M5 16.8H43M5 25.6H43" />
        <path d="M14.1 9.8V17M23.6 9.8V17M33.1 9.8V17M19.1 17.4V25.8M30.6 17.4V25.8M11.6 26.2V33.8M23.6 26.2V33.8M35.6 26.2V33.8" />
      </g>
      {/* LEDs in three colours */}
      <Leds x0={7} y0={11.6} x1={12.6} y1={15.6} color="#ef4444" light="#fecaca" seed={1} />
      <Leds x0={16.6} y0={11.6} x1={22.2} y1={15.6} color="#facc15" light="#fef9c3" seed={2} />
      <Leds x0={26} y0={11.6} x1={31.6} y1={15.6} color="#22c55e" light="#bbf7d0" seed={3} />
      {/* screws */}
      {scatter(35.6, 11.4, 40.6, 15.4, 4, 4).map((p, i) => (
        <g key={i} transform={`rotate(${p.a} ${p.x} ${p.y})`}>
          <rect x={p.x} y={p.y - 0.4} width="2.6" height="0.8" rx="0.2" fill={url(`${id}s`)} />
          <circle cx={p.x} cy={p.y} r="0.95" fill={url(`${id}s`)} stroke="#71717a" strokeWidth="0.2" />
          <path d={`M${p.x - 0.5} ${p.y}h1M${p.x} ${p.y - 0.5}v1`} stroke="#52525b" strokeWidth="0.25" />
        </g>
      ))}
      {/* resistors */}
      {[
        [8.6, 19.8, -20],
        [13.4, 21.2, 15],
        [9.2, 23.4, 8],
        [15.4, 23.8, -30],
      ].map(([x, y, a]) => (
        <g key={`${x}${y}`} transform={`rotate(${a} ${x} ${y})`}>
          <path d={`M${x - 3} ${y}H${x + 3}`} stroke="#a1a1aa" strokeWidth="0.3" />
          <rect x={x - 1.6} y={y - 0.65} width="3.2" height="1.3" rx="0.6" fill={url(`${id}r`)} />
          <path d={`M${x - 0.9} ${y - 0.6}v1.2M${x - 0.2} ${y - 0.6}v1.2M${x + 0.5} ${y - 0.6}v1.2`} stroke="#7c3f12" strokeWidth="0.35" />
          <path d={`M${x + 1.1} ${y - 0.6}v1.2`} stroke="#d4a017" strokeWidth="0.3" />
        </g>
      ))}
      {/* capacitors, seen from the top */}
      {scatter(22, 19.6, 28.6, 23.8, 4, 5).map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="1.35" fill={url(`${id}c`)} />
          <path d={`M${p.x - 0.6} ${p.y}h1.2M${p.x} ${p.y - 0.6}v1.2`} stroke="#bfdbfe" strokeWidth="0.25" opacity="0.8" />
        </g>
      ))}
      {/* short wires */}
      {[
        ['#dc2626', 'M33 19.6C35 21 38 19 40.6 20.4'],
        ['#16a34a', 'M33.4 21.8C35.6 23.4 38 21.2 41 22.8'],
        ['#f59e0b', 'M32.8 24C35 22.6 38.2 24.8 40.4 23.6'],
      ].map(([color, d]) => (
        <path key={color} d={d} fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
      ))}
      {/* nuts, buttons, blue LEDs */}
      {scatter(6.6, 28.4, 10.2, 32, 3, 6).map((p, i) => (
        <g key={i}>
          <path
            d={`M${p.x - 1.1} ${p.y}L${p.x - 0.55} ${r2(p.y - 0.95)}H${p.x + 0.55}L${p.x + 1.1} ${p.y}L${p.x + 0.55} ${r2(p.y + 0.95)}H${p.x - 0.55}Z`}
            fill={url(`${id}s`)}
            stroke="#71717a"
            strokeWidth="0.2"
          />
          <circle cx={p.x} cy={p.y} r="0.45" fill="#64748b" />
        </g>
      ))}
      {[
        [15, 28.6],
        [19.6, 29],
        [16.6, 31.8],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <rect x={x - 1.2} y={y - 1.2} width="2.4" height="2.4" rx="0.3" fill="#27272a" />
          <circle cx={x} cy={y} r="0.75" fill="#71717a" />
        </g>
      ))}
      {[
        [27, 28.4],
        [31.4, 29.4],
        [28.6, 32],
        [32.6, 31.8],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <path d={`M${x - 1.1} ${y + 0.5}V${y - 0.2}A1.1 1.1 0 0 1 ${x + 1.1} ${y - 0.2}V${y + 0.5}Z`} fill="#18181b" />
          <path d={`M${x - 0.6} ${y + 0.5}v1M${x} ${y + 0.5}v1M${x + 0.6} ${y + 0.5}v1`} stroke="#a1a1aa" strokeWidth="0.25" />
        </g>
      ))}
      <Leds x0={38} y0={28.6} x1={42} y1={32} color="#3b82f6" light="#dbeafe" seed={7} />
      {/* the clear lid: a shine across it */}
      <rect x="3.5" y="8.4" width="41" height="27" rx="2" fill="#e0f2fe" opacity="0.12" />
      <path d="M12 8.4H17.6L9.4 35.4H3.8Z" fill="#fff" opacity="0.22" />
      <path d="M19.4 8.4H21L12.8 35.4H11.2Z" fill="#fff" opacity="0.18" />
      <path d="M5.4 9.2H42.6" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.8" />
      {/* the latches */}
      {[9.4, 32.6].map((x) => (
        <g key={x}>
          <rect x={x} y="32.4" width="6" height="5.8" rx="0.8" fill={url(`${id}l`)} />
          <path d={`M${x + 1} ${33.2}H${x + 5}`} stroke="#fff" strokeWidth="0.4" strokeLinecap="round" opacity="0.5" />
          <path d={`M${x + 1.6} 36.6H${x + 4.4}`} stroke="#1e3a8a" strokeWidth="0.4" strokeLinecap="round" />
        </g>
      ))}
    </>
  )
}

function LabelMaker({ id }: ArtProps) {
  const keys: { x: number; y: number; w: number; color: string }[] = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (row === 4 && col > 1 && col < 4) continue
      keys.push({
        x: r2(16.4 + col * 3.1 + (row === 4 && col === 1 ? 0 : 0)),
        y: r2(28.4 + row * 2.4),
        w: row === 4 && col === 1 ? 8.8 : 2.6,
        color: row === 4 && col === 4 ? '#22c55e' : row === 0 && col === 4 ? '#ef4444' : '#e4e4e7',
      })
    }
  }
  return (
    <>
      <defs>
        <V id={`${id}b`} stops={['#64748b', '#334155', '#1e293b']} />
        <V id={`${id}f`} stops={['#3f3f46', '#27272a']} />
        <V id={`${id}t`} stops={['#fef08a', '#facc15']} />
        <V id={`${id}s`} stops={LCD} />
        <R id={`${id}c`} stops={['#fca5a5', '#ef4444', '#991b1b']} />
      </defs>
      <Shadow cx={25} y={44} rx={15} />
      {/* a label it has just printed, lying on the table */}
      <g transform="translate(41.6 27.6) rotate(8)">
        <rect x="-5" y="-1.2" width="10" height="3.2" rx="0.5" fill="#000" opacity="0.15" />
        <rect x="-5" y="-1.6" width="10" height="3.2" rx="0.5" fill={url(`${id}t`)} stroke="#ca8a04" strokeWidth="0.25" />
        {[-3.6, -1.9, -0.2, 1.5, 3].map((x, i) => (
          <rect key={x} x={x} y="-0.75" width={i === 4 ? 0.9 : 1.3} height="1.5" rx="0.2" fill="#18181b" />
        ))}
        <path d="M-4.4 -1.1H4.4" stroke="#fff" strokeWidth="0.35" strokeLinecap="round" opacity="0.6" />
      </g>
      <g transform="rotate(-12 24 26)">
        {/* the label coming out of the top, with words printed on it */}
        <path d="M16.4 14V4.4C16.4 3.6 17 3 17.8 3H21.2L21.8 4L21.2 5L21.8 6L21.2 7V14Z" fill={url(`${id}t`)} stroke="#ca8a04" strokeWidth="0.25" />
        {[4.4, 6.2, 8, 9.8, 11.6].map((y, i) => (
          <rect key={y} x="18.1" y={y} width="1.5" height={i === 2 ? 0.9 : 1.3} rx="0.2" fill="#18181b" />
        ))}
        <path d="M17 4.2V13" stroke="#fff" strokeWidth="0.4" strokeLinecap="round" opacity="0.6" />
        {/* the body */}
        <rect x="13.4" y="12.6" width="21.4" height="31" rx="3.4" fill={url(`${id}b`)} />
        <path d="M15.4 13.4H32.8" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" opacity="0.35" />
        <rect x="15.4" y="13.8" width="17.4" height="4.6" rx="1.2" fill="#1e293b" />
        <rect x="16.2" y="14.5" width="6" height="3.2" rx="0.6" fill="#0f172a" />
        <rect x="17.2" y="15" width="3.6" height="2.2" rx="0.3" fill={url(`${id}t`)} opacity="0.85" />
        <circle cx="30" cy="16.1" r="1.7" fill="#0f172a" />
        <circle cx="30" cy="16" r="1.35" fill={url(`${id}c`)} />
        <rect x="15" y="19.6" width="18.2" height="22.6" rx="1.8" fill={url(`${id}f`)} />
        {/* the little screen */}
        <rect x="16.2" y="20.8" width="15.8" height="5.8" rx="0.7" fill="#0f172a" />
        <rect x="16.9" y="21.5" width="14.4" height="4.4" rx="0.4" fill={url(`${id}s`)} />
        {[17.8, 19.6, 21.4, 23.2].map((x) => (
          <rect key={x} x={x} y="22.6" width="1.3" height="2" rx="0.2" fill="#1f2a16" opacity="0.8" />
        ))}
        <rect x="25.2" y="22.4" width="0.35" height="2.4" fill="#1f2a16" />
        <path d="M17 21.9H31" stroke="#fff" strokeWidth="0.35" opacity="0.4" />
        {/* the keys */}
        {keys.map((k) => (
          <g key={`${k.x}${k.y}`}>
            <rect x={k.x} y={k.y + 0.3} width={k.w} height="1.8" rx="0.45" fill="#09090b" opacity="0.6" />
            <rect x={k.x} y={k.y} width={k.w} height="1.8" rx="0.45" fill={k.color} />
            <rect x={k.x + 0.4} y={k.y + 0.25} width={r2(k.w - 0.8)} height="0.35" rx="0.17" fill="#fff" opacity="0.5" />
          </g>
        ))}
      </g>
    </>
  )
}

/** A screw lying down: head at (0, 0), its threads along +x. */
function Screw({ len, metal }: { len: number; metal: string }) {
  return (
    <g>
      <rect x="0.8" y="-0.75" width={len} height="1.5" rx="0.3" fill={url(metal)} />
      {Array.from({ length: Math.floor(len / 0.8) }, (_, i) => (
        <path key={i} d={`M${r2(1.4 + i * 0.8)} -0.75l0.45 1.5`} stroke="#000" strokeWidth="0.25" opacity="0.35" />
      ))}
      <path d={`M${len + 0.8} -0.75L${len + 1.8} 0L${len + 0.8} 0.75Z`} fill={url(metal)} />
      <rect x="0.4" y="-1.85" width="1.1" height="3.7" rx="0.5" fill={url(metal)} stroke="#000" strokeWidth="0.2" strokeOpacity="0.3" />
      <ellipse cx="0" cy="0" rx="0.9" ry="1.85" fill={url(metal)} stroke="#000" strokeWidth="0.2" strokeOpacity="0.3" />
      <path d="M0 -1.1V1.1M-0.5 0H0.5" stroke="#000" strokeWidth="0.3" opacity="0.5" />
      <rect x="1.4" y="-0.6" width={r2(len - 1)} height="0.3" rx="0.15" fill="#fff" opacity="0.35" />
    </g>
  )
}

function MagneticTray({ id }: ArtProps) {
  const metal: Stop[] = ['#e4e4e7', '#a1a1aa', '#52525b']
  return (
    <>
      <defs>
        <V id={`${id}r`} stops={['#fafafa', '#d4d4d8']} />
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#71717a" />
          <stop offset="0.3" stopColor="#f4f4f5" />
          <stop offset="0.65" stopColor="#a1a1aa" />
          <stop offset="1" stopColor="#52525b" />
        </linearGradient>
        <R id={`${id}i`} cx={0.62} cy={0.7} r={0.75} stops={['#fafafa', '#d4d4d8', '#a1a1aa', '#71717a']} />
        <V id={`${id}s`} stops={metal} />
        <V id={`${id}k`} stops={['#71717a', '#3f3f46', '#18181b']} />
        <V id={`${id}y`} stops={['#fde68a', '#d97706', '#92400e']} />
      </defs>
      <Shadow y={39.6} rx={20} />
      {/* the rubber-coated magnet underneath */}
      <path d="M4.6 26.4V28.4A19.4 11 0 0 0 43.4 28.4V26.4Z" fill="#18181b" />
      {/* the steel wall and rim */}
      <path d="M4.2 22.6V26.4A19.8 11.4 0 0 0 43.8 26.4V22.6Z" fill={url(`${id}w`)} />
      <ellipse cx="24" cy="22.6" rx="19.8" ry="11.4" fill={url(`${id}r`)} />
      {/* the bowl, lit on its far side */}
      <ellipse cx="24" cy="23" rx="17.8" ry="9.8" fill={url(`${id}i`)} />
      <ellipse cx="24.6" cy="24.2" rx="11" ry="5.6" fill="none" stroke="#fff" strokeWidth="0.4" opacity="0.5" />
      <path d="M7.4 20.2A17.8 9.8 0 0 1 19 13.5" fill="none" stroke="#52525b" strokeWidth="0.6" opacity="0.4" />
      {/* screws and a nut, held by the magnet */}
      <g transform="translate(12.6 22.4) rotate(12)">
        <Screw len={7.4} metal={`${id}s`} />
      </g>
      <g transform="translate(21.4 28.4) rotate(-14)">
        <Screw len={6.2} metal={`${id}y`} />
      </g>
      <g transform="translate(34.2 17.4) rotate(160)">
        <Screw len={6.6} metal={`${id}k`} />
      </g>
      <g transform="translate(32.6 25.4)">
        <path d="M-2.4 0.4L-1.2 -1.5H1.2L2.4 0.4L1.2 2.3H-1.2Z" fill="#000" opacity="0.2" />
        <path d="M-2.4 0L-1.2 -1.9H1.2L2.4 0L1.2 1.9H-1.2Z" fill={url(`${id}s`)} stroke="#52525b" strokeWidth="0.25" />
        <path d="M-1.2 -1.9L1.2 -1.9" stroke="#fff" strokeWidth="0.35" opacity="0.7" />
        <ellipse cx="0" cy="0" rx="1" ry="0.85" fill="#52525b" />
        <ellipse cx="0.2" cy="0.2" rx="0.7" ry="0.55" fill="#a1a1aa" />
      </g>
      <path d="M8.2 15.4A19.8 11.4 0 0 1 22 11.3" fill="none" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" opacity="0.9" />
    </>
  )
}

function StaticBags({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}p`} stops={['#fbcfe8', '#f472b6', '#db2777']} />
        <V id={`${id}s`} stops={['#f4f4f5', '#d4d4d8', '#a1a1aa', '#8b8b94']} />
        <V id={`${id}b`} stops={['#22c55e', '#15803d']} />
      </defs>
      <Shadow cx={25} y={43.4} rx={19} />
      {/* the pink bag behind */}
      <g transform="rotate(11 30 22)">
        <rect x="19" y="4.6" width="23" height="33" rx="0.8" fill={url(`${id}p`)} opacity="0.92" />
        <rect x="19" y="4.6" width="23" height="3.4" fill="#be185d" opacity="0.25" />
        <path d="M19.6 9.6H41.4M19.6 10.6H41.4" stroke="#9d174d" strokeWidth="0.4" opacity="0.6" />
        <path d="M20.6 6H40.4" stroke="#fff" strokeWidth="0.45" strokeLinecap="round" opacity="0.6" />
        <path d="M24 12L34 37.6H38.8L28.8 12Z" fill="#fff" opacity="0.18" />
      </g>
      {/* the silver shielding bag, a board faintly inside */}
      <g transform="rotate(-6 18 26)">
        <rect x="9.6" y="20.4" width="17" height="12.6" rx="0.6" fill={url(`${id}b`)} />
        <rect x="13" y="23.4" width="5.6" height="5.6" rx="0.3" fill="#18181b" />
        {[11, 21.6, 23.6].map((x) => (
          <circle key={x} cx={x} cy="30.8" r="0.6" fill="#fbbf24" />
        ))}
        <rect x="20.6" y="22.4" width="4" height="2.2" rx="0.3" fill="#18181b" />
        <rect x="5" y="8.6" width="26.6" height="34" rx="0.8" fill={url(`${id}s`)} opacity="0.72" />
        <rect x="5" y="8.6" width="26.6" height="34" rx="0.8" fill="none" stroke="#71717a" strokeWidth="0.35" />
        <rect x="5" y="8.6" width="26.6" height="4.6" rx="0.8" fill="#d4d4d8" opacity="0.85" />
        {/* the zip */}
        <path d="M5.4 14.2H31.2" stroke="#52525b" strokeWidth="0.55" />
        <path d="M5.4 15.3H31.2" stroke="#52525b" strokeWidth="0.55" />
        <path d="M5.4 14.75H31.2" stroke="#fff" strokeWidth="0.35" opacity="0.8" />
        {/* the sealed edges */}
        <path d="M6.1 16V42M30.5 16V42" stroke="#71717a" strokeWidth="1.1" strokeDasharray="0.35 0.35" opacity="0.45" />
        <path d="M6 9.8H30.6" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" opacity="0.8" />
        <path d="M10 16.4L21.4 42.6H25.4L14 16.4Z" fill="#fff" opacity="0.3" />
        <path d="M17 16.4L20 23.2" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" opacity="0.5" />
        {/* the yellow "careful, static" label */}
        <rect x="21.4" y="33" width="7.6" height="7" rx="0.4" fill="#facc15" stroke="#18181b" strokeWidth="0.4" />
        <path d="M25.2 34.2L28 38.9H22.4Z" fill="none" stroke="#18181b" strokeWidth="0.45" strokeLinejoin="round" />
        <path d="M24.6 38.1V36.6C24.6 36.2 25.4 36.2 25.4 36.6V38.1Z" fill="#18181b" />
        <path d="M23.4 38.6L27 35" stroke="#18181b" strokeWidth="0.4" strokeLinecap="round" />
        <rect x="8.4" y="35.4" width="10" height="1" rx="0.4" fill="#3f3f46" opacity="0.45" />
        <rect x="8.4" y="37.4" width="7" height="1" rx="0.4" fill="#3f3f46" opacity="0.35" />
      </g>
    </>
  )
}

/** A loose cable tie lying straight: its head at (0, 0), its strap along +x. */
function LooseTie({ len, light, dark }: { len: number; light: string; dark: string }) {
  return (
    <g>
      <path d={`M2.6 -0.75H${len - 1.6}L${len} -0.35V0.35L${len - 1.6} 0.75H2.6Z`} fill={light} stroke={dark} strokeWidth="0.25" />
      {Array.from({ length: Math.floor((len - 6) / 0.9) }, (_, i) => (
        <path key={i} d={`M${r2(4 + i * 0.9)} -0.45v0.9`} stroke={dark} strokeWidth="0.22" opacity="0.6" />
      ))}
      <rect x="0" y="-1.6" width="3" height="3.2" rx="0.5" fill={light} stroke={dark} strokeWidth="0.3" />
      <rect x="0.8" y="-0.75" width="1.4" height="1.5" rx="0.2" fill={dark} opacity="0.8" />
      <path d={`M3 -0.4H${len - 2}`} stroke="#fff" strokeWidth="0.3" opacity="0.45" />
    </g>
  )
}

function CableTies({ id }: ArtProps) {
  const wires = [
    { color: '#dc2626', light: '#fca5a5' },
    { color: '#e4e4e7', light: '#ffffff' },
    { color: '#eab308', light: '#fef08a' },
    { color: '#2563eb', light: '#93c5fd' },
    { color: '#16a34a', light: '#86efac' },
  ]
  // the wires are bunched tight in the middle and spread out at both ends
  const wire = (o: number) => {
    const tight = 20 + o * 1.45
    const loose = 20 + o * 2.4
    return `M4.6 ${loose}C11 ${loose} 12 ${tight} 16 ${tight}H32C36 ${tight} 37 ${loose} 43.4 ${loose}`
  }
  const tie = (x: number, tail: number) => (
    <g key={x}>
      <rect x={x - 0.95} y="15.8" width="1.9" height="8.6" rx="0.7" fill={url(`${id}t`)} stroke="#a1a1aa" strokeWidth="0.3" />
      {[17, 18, 19, 20, 21, 22, 23].map((y) => (
        <path key={y} d={`M${x - 0.6} ${y}h1.2`} stroke="#a1a1aa" strokeWidth="0.2" />
      ))}
      <path d={`M${x - 0.6} 24.6L${x + tail - 0.7} 31.6L${x + tail + 0.7} 31.4L${x + 0.6} 24.6Z`} fill={url(`${id}t`)} stroke="#a1a1aa" strokeWidth="0.25" />
      <rect x={x - 1.7} y="23.2" width="3.4" height="3" rx="0.5" fill={url(`${id}t`)} stroke="#a1a1aa" strokeWidth="0.3" />
      <rect x={x - 0.75} y="24" width="1.5" height="1.3" rx="0.2" fill="#71717a" />
    </g>
  )
  return (
    <>
      <defs>
        <V id={`${id}t`} stops={['#ffffff', '#f4f4f5', '#d4d4d8']} />
      </defs>
      <Shadow y={42.4} rx={20} />
      {/* loose ties: one closed into a ring, two still straight */}
      <g transform="rotate(-8 11 36)">
        <ellipse cx="11" cy="36" rx="5.6" ry="3.4" fill="none" stroke="#991b1b" strokeWidth="1.7" />
        <ellipse cx="11" cy="36" rx="5.6" ry="3.4" fill="none" stroke="#ef4444" strokeWidth="1.2" />
        <path d="M6.4 34.2A5.6 3.4 0 0 1 12 32.6" fill="none" stroke="#fecaca" strokeWidth="0.35" opacity="0.8" />
        <path d="M16.6 35.4L23.6 34.2L23.8 35.4L16.8 37.2Z" fill="#ef4444" stroke="#991b1b" strokeWidth="0.25" />
        <rect x="14.8" y="34.4" width="3" height="3" rx="0.5" fill="#ef4444" stroke="#991b1b" strokeWidth="0.3" />
        <rect x="15.6" y="35.2" width="1.4" height="1.4" rx="0.2" fill="#7f1d1d" />
      </g>
      <g transform="translate(22 39.8) rotate(-16)">
        <LooseTie len={22} light="#3b82f6" dark="#1e3a8a" />
      </g>
      <g transform="translate(26.4 43.2) rotate(-14)">
        <LooseTie len={19} light="#facc15" dark="#a16207" />
      </g>
      {/* the bundle of wires and its two ties */}
      <g transform="rotate(-18 24 20)">
        {wires.map((w, i) => (
          <g key={w.color} fill="none">
            <path d={wire(i - 2)} stroke="#000" strokeWidth="1.75" opacity="0.35" />
            <path d={wire(i - 2)} stroke={w.color} strokeWidth="1.35" />
            <path d={wire(i - 2)} stroke={w.light} strokeWidth="0.35" opacity="0.6" transform="translate(0 -0.35)" />
          </g>
        ))}
        {wires.map((w, i) => {
          const y = 20 + (i - 2) * 2.4
          return (
            <g key={w.color}>
              <rect x="2.8" y={y - 0.4} width="2" height="0.8" rx="0.3" fill="#d97706" />
              <rect x="43.2" y={y - 0.4} width="2" height="0.8" rx="0.3" fill="#d97706" />
            </g>
          )
        })}
        {tie(19.6, -1.6)}
        {tie(28.4, 1.6)}
      </g>
    </>
  )
}

export { PartsBox, LabelMaker, MagneticTray, StaticBags, CableTies }
