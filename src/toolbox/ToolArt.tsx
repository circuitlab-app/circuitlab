import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import * as build from './art/build'
import * as code from './art/code'
import * as cut from './art/cut'
import { Cell, Clip, H, Handles, Pivot, Probe, R, Readout, Shadow, Tube, V } from './art/kit'
import * as measure from './art/measure'
import { COPPER, LCD, r2, STEEL, STEEL_ROUND, url, type ArtProps, type Stop } from './art/palette'
import * as powerFix from './art/powerFix'
import * as safe from './art/safe'
import * as tidy from './art/tidy'
import type { ToolId } from './catalog'

/*
 * Drawings of real workshop tools, in the same hand as the part drawings
 * (src/editor/PartArt.tsx): a 48 × 48 box, light from the top left and a
 * soft shadow under every tool. They are drawn to stay crisp when shown big.
 * The first tools are drawn here; the newer ones live in ./art/, drawer by
 * drawer, and share the helpers in ./art/kit.tsx.
 */

/* ───────────────────────── Measure ───────────────────────── */

function Multimeter({ id }: ArtProps) {
  const ticks = [-135, -90, -45, 0, 45, 90, 135]
  return (
    <>
      <defs>
        <V id={`${id}h`} stops={['#fde047', '#f59e0b', '#b45309']} />
        <V id={`${id}f`} stops={['#3f3f46', '#18181b']} />
        <V id={`${id}s`} stops={LCD} />
        <R id={`${id}k`} stops={['#71717a', '#27272a', '#09090b']} />
        <H id={`${id}pr`} stops={['#fca5a5', '#dc2626', '#7f1d1d']} />
        <H id={`${id}pb`} stops={['#71717a', '#27272a', '#09090b']} />
      </defs>
      <Shadow y={44.4} rx={21} />
      <rect x="11" y="3" width="26" height="38.5" rx="4.5" fill={url(`${id}h`)} />
      <rect x="13" y="4" width="22" height="1.4" rx="0.7" fill="#fff" opacity="0.45" />
      <rect x="13.5" y="6" width="21" height="33" rx="2.6" fill={url(`${id}f`)} />
      <rect x="15.5" y="8" width="17" height="8.6" rx="1.2" fill={url(`${id}s`)} />
      <Readout x={17.3} y={9.7} value="1.50" w={2.9} h={5.2} t={0.7} gap={0.9} on="#1f2a16" />
      <path d="M29.2 12.5l1 2.4 1-2.4" fill="none" stroke="#1f2a16" strokeWidth="0.6" strokeLinejoin="round" />
      <rect x="15.5" y="8" width="17" height="1.6" rx="0.8" fill="#fff" opacity="0.35" />
      {/* the dial with its settings around it */}
      <circle cx="24" cy="26.5" r="6.6" fill="#27272a" stroke="#52525b" strokeWidth="0.5" />
      {ticks.map((a) => (
        <rect
          key={a}
          x="23.6"
          y="18.1"
          width="0.8"
          height="1.3"
          rx="0.3"
          fill={a === -45 ? '#fde047' : '#e4e4e7'}
          opacity={a === -45 ? 1 : 0.6}
          transform={`rotate(${a} 24 26.5)`}
        />
      ))}
      <circle cx="24" cy="26.5" r="5" fill={url(`${id}k`)} />
      <rect x="22.6" y="21.8" width="2.8" height="9.4" rx="1.4" fill="#52525b" transform="rotate(-45 24 26.5)" />
      <rect x="23" y="22.3" width="0.8" height="8.4" rx="0.4" fill="#fff" opacity="0.18" transform="rotate(-45 24 26.5)" />
      <circle cx="21.7" cy="24.2" r="0.7" fill="#fff" />
      {/* jacks: 10A, COM, V */}
      {[
        [18.5, '#dc2626'],
        [24, '#52525b'],
        [29.5, '#dc2626'],
      ].map(([x, ring]) => (
        <g key={x}>
          <circle cx={x} cy="35.6" r="1.9" fill="#0a0a0a" stroke={ring as string} strokeWidth="0.8" />
          <circle cx={x} cy="35.6" r="0.7" fill="#3f3f46" />
        </g>
      ))}
      {/* the leads hang down in front of the meter */}
      <path d="M24 37.6C24 46 7.5 46 6.5 36.4" fill="none" stroke="#18181b" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M29.5 37.6C29.5 46 40.5 46 41.5 36.4" fill="none" stroke="#b91c1c" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M29.6 38.4C30 44 38 44.6 40.6 38.4" fill="none" stroke="#fca5a5" strokeWidth="0.4" strokeLinecap="round" opacity="0.6" />
      <rect x="23" y="34.6" width="2" height="3.4" rx="0.6" fill="#27272a" />
      <rect x="28.5" y="34.6" width="2" height="3.4" rx="0.6" fill="#dc2626" />
      <Probe id={`${id}pb`} x={6.5} />
      <Probe id={`${id}pr`} x={41.5} />
    </>
  )
}

function Oscilloscope({ id }: ArtProps) {
  const sine = Array.from({ length: 49 }, (_, i) => {
    const x = 6.8 + (i * 21.4) / 48
    const y = 20.2 - 3.8 * Math.sin((i / 48) * Math.PI * 4)
    return `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`
  }).join('')
  const half = 21.4 / 8
  let square = 'M6.8 27.8'
  for (let k = 0; k < 8; k++) square += `H${r2(6.8 + (k + 1) * half)}V${k % 2 ? 27.8 : 25.6}`
  return (
    <>
      <defs>
        <V id={`${id}t`} stops={['#fafafa', '#d4d4d8']} />
        <V id={`${id}b`} stops={['#e4e4e7', '#a1a1aa']} />
        <V id={`${id}s`} stops={['#0c1a33', '#04080f']} />
        <R id={`${id}k`} stops={['#71717a', '#18181b']} />
        <R id={`${id}n`} stops={['#fafafa', '#a1a1aa', '#52525b']} />
        <clipPath id={`${id}c`}>
          <rect x="6.8" y="14.3" width="21.4" height="15.4" rx="0.5" />
        </clipPath>
      </defs>
      <Shadow y={39.4} rx={21} />
      <rect x="6" y="36" width="5" height="2" rx="0.7" fill="#3f3f46" />
      <rect x="37" y="36" width="5" height="2" rx="0.7" fill="#3f3f46" />
      <path d="M4.6 10.6L7.6 7.4H40.4L43.4 10.6Z" fill={url(`${id}t`)} />
      <rect x="3" y="10.4" width="42" height="26.2" rx="1.8" fill={url(`${id}b`)} />
      <rect x="4.5" y="11" width="39" height="0.8" rx="0.4" fill="#fff" opacity="0.6" />
      <rect x="5.5" y="13" width="24" height="18" rx="1.2" fill="#1c1c20" />
      <rect x="6.8" y="14.3" width="21.4" height="15.4" rx="0.5" fill={url(`${id}s`)} />
      <g clipPath={url(`${id}c`)}>
        {Array.from({ length: 7 }, (_, k) => (
          <path key={`v${k}`} d={`M${r2(6.8 + (k + 1) * half)} 14.3V29.7`} stroke="#7dd3fc" strokeWidth="0.22" opacity={k === 3 ? 0.32 : 0.14} />
        ))}
        {[1, 2, 3].map((k) => (
          <path key={`h${k}`} d={`M6.8 ${r2(14.3 + k * 3.85)}H28.2`} stroke="#7dd3fc" strokeWidth="0.22" opacity={k === 2 ? 0.32 : 0.14} />
        ))}
        <path d={sine} fill="none" stroke="#facc15" strokeWidth="1.7" opacity="0.22" strokeLinejoin="round" />
        <path d={sine} fill="none" stroke="#fde047" strokeWidth="0.65" strokeLinejoin="round" />
        <path d={square} fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.2" strokeLinejoin="round" />
        <path d={square} fill="none" stroke="#67e8f9" strokeWidth="0.55" strokeLinejoin="round" />
        <path d="M6.8 14.3h9L8.6 29.7H6.8z" fill="#fff" opacity="0.06" />
      </g>
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={i} x={7 + i * 4.4} y="32.6" width="3.2" height="1.4" rx="0.5" fill="#71717a" />
      ))}
      {/* controls */}
      <circle cx="37" cy="17.4" r="3.6" fill="#27272a" />
      <circle cx="37" cy="17.4" r="2.9" fill={url(`${id}k`)} />
      <path d="M37 17.4l1.6-1.9" stroke="#fff" strokeWidth="0.7" strokeLinecap="round" />
      {[
        [33.6, '#facc15'],
        [40.4, '#22d3ee'],
      ].map(([x, ring]) => (
        <g key={x}>
          <circle cx={x} cy="24.4" r="1.9" fill={url(`${id}k`)} stroke={ring as string} strokeWidth="0.55" />
          <circle cx={x} cy="33.4" r="1.6" fill={url(`${id}n`)} stroke={ring as string} strokeWidth="0.45" />
          <circle cx={x} cy="33.4" r="0.6" fill="#27272a" />
        </g>
      ))}
      {['#facc15', '#22d3ee', '#d4d4d8', '#ef4444'].map((c, i) => (
        <rect key={c} x={31.9 + i * 2.8} y="28.3" width="2.2" height="1.5" rx="0.5" fill={c} />
      ))}
    </>
  )
}

function Calipers({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}m`} stops={['#fafafa', '#d4d4d8', '#9ca3af']} />
        <V id={`${id}d`} stops={['#3f3f46', '#18181b']} />
        <V id={`${id}s`} stops={LCD} />
      </defs>
      <Shadow y={41} rx={19} />
      {/* the beam with its scale */}
      <rect x="3.5" y="16.5" width="41.5" height="5" rx="0.7" fill={url(`${id}m`)} />
      <rect x="5" y="19.6" width="39" height="0.6" rx="0.3" fill="#fff" opacity="0.7" />
      {Array.from({ length: 26 }, (_, i) => (
        <path key={i} d={`M${19 + i} 16.5v${i % 5 === 0 ? 1.8 : 1}`} stroke="#52525b" strokeWidth="0.22" />
      ))}
      {/* the fixed jaws */}
      <path d="M3.5 18H9.5V35.2L8.7 37.5H8.3C6.2 33 4.2 27.5 3.5 22Z" fill={url(`${id}m`)} stroke="#a1a1aa" strokeWidth="0.25" />
      <path d="M6.6 16.6V12.6L9.3 9.6H9.5V16.6Z" fill={url(`${id}m`)} stroke="#a1a1aa" strokeWidth="0.25" />
      {/* the sliding jaws */}
      <path d="M14 18H19.5V22C19 27.5 16.8 33 14.8 37.5H14.4L14 35.2Z" fill={url(`${id}m`)} stroke="#a1a1aa" strokeWidth="0.25" />
      <path d="M14 16.6V9.6H14.2L16.9 12.6V16.6Z" fill={url(`${id}m`)} stroke="#a1a1aa" strokeWidth="0.25" />
      <rect x="14" y="14.6" width="21" height="9" rx="1.2" fill={url(`${id}m`)} stroke="#a1a1aa" strokeWidth="0.25" />
      {/* the reading */}
      <rect x="16.5" y="12" width="17.5" height="13.5" rx="2" fill={url(`${id}d`)} />
      <rect x="17.5" y="12.5" width="15.5" height="0.7" rx="0.35" fill="#fff" opacity="0.18" />
      <rect x="18" y="13.6" width="10.6" height="5.6" rx="0.6" fill={url(`${id}s`)} />
      <Readout x={18.9} y={14.7} value="12.70" w={1.8} h={3.4} t={0.45} gap={0.55} on="#1f2a16" />
      <circle cx="31.4" cy="15.4" r="1" fill="#e4e4e7" stroke="#71717a" strokeWidth="0.3" />
      <circle cx="31.4" cy="18.6" r="1" fill="#f87171" stroke="#991b1b" strokeWidth="0.3" />
      <rect x="18.5" y="21.2" width="7" height="1.6" rx="0.8" fill="#52525b" />
      {/* the thumb wheel */}
      <circle cx="30.6" cy="26.4" r="1.7" fill={url(`${id}m`)} stroke="#71717a" strokeWidth="0.3" />
      <path d="M29.4 25.6h2.4M29.2 26.4h2.8M29.4 27.2h2.4" stroke="#71717a" strokeWidth="0.25" />
    </>
  )
}

function PartTester({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}p`} stops={['#3b82f6', '#1d4ed8', '#1e3a8a']} />
        <V id={`${id}z`} stops={['#4ade80', '#16a34a', '#166534']} />
        <V id={`${id}s`} stops={LCD} />
        <V id={`${id}t`} stops={['#52525b', '#09090b']} />
        <R id={`${id}b`} stops={['#fafafa', '#a1a1aa']} />
      </defs>
      <Shadow y={40.6} rx={21} />
      <rect x="3.5" y="12" width="41" height="26" rx="1.6" fill="#172554" />
      <rect x="3.5" y="11" width="41" height="26" rx="1.6" fill={url(`${id}p`)} />
      <rect x="5" y="11.6" width="38" height="0.6" rx="0.3" fill="#fff" opacity="0.25" />
      {[
        [5.4, 12.9],
        [42.6, 12.9],
        [5.4, 35.1],
        [42.6, 35.1],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="0.85" fill="#cbd5e1" stroke="#1e3a8a" strokeWidth="0.3" />
      ))}
      {/* the socket that grips the mystery part */}
      <rect x="7.6" y="14" width="10" height="20" rx="1" fill={url(`${id}z`)} />
      {Array.from({ length: 7 }, (_, row) =>
        [10.3, 14.9].map((x) => <rect key={`${row}${x}`} x={x - 0.6} y={16.4 + row * 2.45} width="1.2" height="1.2" rx="0.2" fill="#052e16" />),
      )}
      <rect x="5.2" y="11.2" width="1.3" height="22.6" rx="0.65" fill="#d4d4d8" />
      <rect x="4.7" y="9.4" width="2.3" height="3.2" rx="1" fill="#14532d" />
      <circle cx="5.85" cy="33.4" r="1.2" fill="#a1a1aa" />
      {/* a transistor waiting to be tested */}
      <path d="M10.2 14.2v2.6M12.6 14.2v2.6M15 14.2v2.6" stroke="#d4d4d8" strokeWidth="0.55" strokeLinecap="round" />
      <path d="M9.8 14.4V11.5A2.8 2.8 0 0 1 15.4 11.5V14.4Z" fill={url(`${id}t`)} />
      <rect x="10.4" y="10.6" width="1" height="3" rx="0.5" fill="#fff" opacity="0.2" />
      {/* the screen draws the part it found */}
      <rect x="20" y="13.5" width="21.5" height="14" rx="0.8" fill="#0f172a" />
      <rect x="21.3" y="14.8" width="18.9" height="11.4" rx="0.4" fill={url(`${id}s`)} />
      <g fill="none" stroke="#1f2a16" strokeWidth="0.55" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="26.4" cy="20.5" r="3.7" />
        <path d="M22.3 20.5h3M25.3 18.2v4.6M25.3 19.4l2.6-1.8v-1.9M25.3 21.6l2.6 1.8v1.9" />
      </g>
      <path d="M27.9 23.4l-1.5.1.6-1.2z" fill="#1f2a16" />
      {[
        [16.6, 6.2],
        [19, 4.6],
        [21.4, 5.6],
        [23.8, 3.8],
      ].map(([y, w]) => (
        <rect key={y} x="32.2" y={y} width={w} height="0.9" rx="0.3" fill="#1f2a16" opacity="0.55" />
      ))}
      {/* test button and chip */}
      <rect x="21.4" y="29.4" width="5" height="5" rx="0.7" fill="#18181b" />
      <circle cx="23.9" cy="31.9" r="1.6" fill={url(`${id}b`)} />
      <rect x="30.5" y="29.8" width="9" height="4.4" rx="0.5" fill="#18181b" />
      <path
        d="M31.6 29.8v-1M33.4 29.8v-1M35.2 29.8v-1M37 29.8v-1M38.6 29.8v-1M31.6 34.2v1M33.4 34.2v1M35.2 34.2v1M37 34.2v1M38.6 34.2v1"
        stroke="#d4d4d8"
        strokeWidth="0.5"
      />
      <circle cx="31.6" cy="31" r="0.4" fill="#52525b" />
    </>
  )
}

/* ───────────────────────── Build ───────────────────────── */

function Breadboard({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}b`} stops={['#ffffff', '#f4f4f5', '#e4e4e7']} />
        <pattern id={`${id}h`} x="5.1" y="17.25" width="1.4" height="1.4" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="0.7" height="0.7" rx="0.12" fill="#64748b" opacity="0.7" />
        </pattern>
        <V id={`${id}r`} stops={['#f6e7c6', '#cfae7c']} />
        <R id={`${id}l`} stops={['#fecaca', '#ef4444', '#991b1b']} />
      </defs>
      <Shadow y={41} rx={21} />
      <rect x="3" y="11.8" width="42" height="27.6" rx="1.6" fill="#a1a1aa" />
      <rect x="3" y="10.6" width="42" height="27.6" rx="1.6" fill={url(`${id}b`)} />
      <rect x="4.5" y="11.1" width="39" height="0.6" rx="0.3" fill="#fff" />
      {/* the power lines along the edges */}
      <rect x="5" y="12" width="38" height="0.5" rx="0.25" fill="#ef4444" />
      <rect x="5" y="16.1" width="38" height="0.5" rx="0.25" fill="#3b82f6" />
      <rect x="5" y="33.1" width="38" height="0.5" rx="0.25" fill="#ef4444" />
      <rect x="5" y="37.2" width="38" height="0.5" rx="0.25" fill="#3b82f6" />
      <rect x="5.1" y="13.05" width="37.8" height="2.8" fill={url(`${id}h`)} />
      <rect x="5.1" y="17.25" width="37.8" height="7" fill={url(`${id}h`)} />
      <rect x="5.1" y="25.85" width="37.8" height="7" fill={url(`${id}h`)} />
      <rect x="5.1" y="34.25" width="37.8" height="2.8" fill={url(`${id}h`)} />
      {/* the middle groove */}
      <rect x="4" y="24.45" width="40" height="1.2" rx="0.4" fill="#d4d4d8" />
      {/* a resistor across the groove, an LED and a wire */}
      <path d="M23.65 21.8v5.8" stroke="#a1a1aa" strokeWidth="0.55" />
      <rect x="22.75" y="22.2" width="1.8" height="5" rx="0.9" fill={url(`${id}r`)} />
      <path d="M22.75 23.4h1.8M22.75 24.4h1.8M22.75 25.4h1.8" stroke="#7c3f12" strokeWidth="0.45" />
      <path d="M22.75 26.3h1.8" stroke="#d4a017" strokeWidth="0.4" />
      <circle cx="34.15" cy="20.4" r="2.2" fill="#991b1b" opacity="0.35" />
      <circle cx="34.15" cy="20.1" r="1.9" fill={url(`${id}l`)} />
      <circle cx="33.5" cy="19.4" r="0.55" fill="#fff" opacity="0.7" />
      <path d="M9.65 20.4C9.65 24 19.45 24.6 19.45 29" fill="none" stroke="#15803d" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M9.6 20.2C9.9 23.4 18.8 24 19.3 28" fill="none" stroke="#86efac" strokeWidth="0.35" strokeLinecap="round" opacity="0.8" />
      <circle cx="9.65" cy="20.4" r="0.55" fill="#a1a1aa" />
      <circle cx="19.45" cy="29" r="0.55" fill="#a1a1aa" />
    </>
  )
}

function JumperWires({ id }: ArtProps) {
  const wires: { from: number; to: number; lift: number; color: string; light: string }[] = [
    { from: 6, to: 42, lift: 0, color: '#dc2626', light: '#fca5a5' },
    { from: 10, to: 38, lift: 5.4, color: '#f59e0b', light: '#fde68a' },
    { from: 14, to: 34, lift: 10.7, color: '#16a34a', light: '#86efac' },
    { from: 18, to: 30, lift: 16, color: '#2563eb', light: '#93c5fd' },
  ]
  return (
    <>
      <defs>
        <V id={`${id}h`} stops={['#52525b', '#18181b', '#09090b']} />
      </defs>
      <Shadow y={42} rx={20} />
      {wires.map((w) => (
        <g key={w.color} fill="none" strokeLinecap="round">
          <path d={`M${w.from} 30.6C${w.from} ${w.lift} ${w.to} ${w.lift} ${w.to} 30.6`} stroke={w.color} strokeWidth="1.8" />
          <path
            d={`M${w.from - 0.35} 29.6C${w.from - 0.35} ${w.lift + 0.6} ${w.to - 0.35} ${w.lift + 0.6} ${w.to - 0.35} 29.6`}
            stroke={w.light}
            strokeWidth="0.45"
            opacity="0.75"
          />
        </g>
      ))}
      {wires.flatMap((w) =>
        [w.from, w.to].map((x) => (
          <g key={x}>
            <rect x={x - 0.36} y="35.6" width="0.72" height="3.8" rx="0.2" fill="#d4d4d8" />
            <rect x={x - 1.3} y="30" width="2.6" height="6" rx="0.5" fill={url(`${id}h`)} />
            <rect x={x - 0.9} y="30.5" width="0.5" height="5" rx="0.25" fill="#fff" opacity="0.2" />
          </g>
        )),
      )}
    </>
  )
}

function CrocClips({ id }: ArtProps) {
  const red: Stop[] = ['#fca5a5', '#ef4444', '#991b1b']
  return (
    <>
      <Shadow y={40.5} rx={20} />
      <path d="M27.4 9.6C38 8 41.5 18 30 21.5S11.5 26 20.6 31.4" fill="none" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M27.6 9.2C36 8.2 39.5 15.4 31.5 19.6" fill="none" stroke="#fca5a5" strokeWidth="0.4" strokeLinecap="round" opacity="0.6" />
      <g transform="translate(3.5 12) rotate(-6)">
        <Clip id={`${id}a`} boot={red} />
      </g>
      <g transform="translate(44.5 34) rotate(6) scale(-1 1)">
        <Clip id={`${id}b`} boot={red} open={11} />
      </g>
    </>
  )
}

function SolderingIron({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}m`} stops={STEEL_ROUND} />
        <V id={`${id}t`} stops={['#d4d4d8', '#71717a', '#3f3f46']} />
        <V id={`${id}g`} stops={['#52525b', '#18181b']} />
        <V id={`${id}h`} stops={['#93c5fd', '#2563eb', '#1e3a8a']} />
        <radialGradient id={`${id}glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fdba74" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow cx={26} y={41.5} rx={17} />
      {/* heat rising from the tip */}
      <path
        d="M5.4 30.6c-.9-1 .9-2 0-3s.9-2 0-3M8.4 29.6c-.9-1 .9-2 0-3s.9-2 0-3M11.4 28.6c-.9-1 .9-2 0-3s.9-2 0-3"
        fill="none"
        stroke="#f97316"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="7.6" cy="35.5" r="3.4" fill={url(`${id}glow`)} />
      <path
        d="M38.7 13.7C42.5 11.3 46 13 45 18C44 23 39 24 40 30C41 35 44.5 36 46.5 38"
        fill="none"
        stroke="#27272a"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M38.9 13.2C42.3 11.2 45.3 12.8 44.5 17.4C43.6 22 39 23.4 39.6 29"
        fill="none"
        stroke="#a1a1aa"
        strokeWidth="0.4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <g transform="rotate(-35 24 24)">
        <path d="M3.6 24L9.4 22.9V25.1Z" fill={url(`${id}t`)} />
        <path d="M3.6 24L6.2 23.5V24.5Z" fill="#fb923c" />
        <rect x="9" y="22.8" width="10.5" height="2.4" rx="0.4" fill={url(`${id}m`)} />
        <rect x="19" y="21.7" width="2.6" height="4.6" rx="0.6" fill={url(`${id}g`)} />
        <path d="M21.4 21.2C26 20.6 33 20.6 38.5 21.4V26.6C33 27.4 26 27.4 21.4 26.8Z" fill={url(`${id}h`)} />
        <rect x="22" y="20.9" width="7.4" height="6.2" rx="2" fill={url(`${id}g`)} />
        <path d="M23.4 21.4v5.2M24.8 21.3v5.4M26.2 21.3v5.4M27.6 21.4v5.2" stroke="#fff" strokeWidth="0.3" opacity="0.15" />
        <path d="M30 21.8C33 21.6 35.6 21.7 38 22.1" fill="none" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.45" />
        <path d="M10 23.4H19" stroke="#fff" strokeWidth="0.4" strokeLinecap="round" opacity="0.7" />
        <path d="M38.4 22L42 22.8V25.2L38.4 26Z" fill="#18181b" />
      </g>
    </>
  )
}

function Solder({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}w`} stops={['#fafafa', '#d4d4d8', '#a1a1aa', '#71717a']} />
        <V id={`${id}f`} stops={['#f87171', '#dc2626', '#991b1b']} />
      </defs>
      <Shadow cx={23} y={39.6} rx={17} />
      <ellipse cx="12.6" cy="24" rx="3.6" ry="13" fill="#7f1d1d" />
      <rect x="12.6" y="15" width="20.4" height="18" fill={url(`${id}w`)} />
      {Array.from({ length: 18 }, (_, i) => (
        <path key={i} d={`M${r2(13.8 + i * 1.1)} 15V33`} stroke="#3f3f46" strokeWidth="0.28" opacity="0.28" />
      ))}
      <rect x="12.6" y="17" width="20.4" height="1" fill="#fff" opacity="0.6" />
      {/* the loose end of the wire */}
      <path d="M26.5 15.2C27.6 9.6 36 6.4 44.2 10.2" fill="none" stroke="#a1a1aa" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M26.8 14.2C28.4 9.6 35.4 7.4 43 10.4" fill="none" stroke="#fff" strokeWidth="0.35" strokeLinecap="round" opacity="0.8" />
      <ellipse cx="33" cy="24" rx="3.6" ry="13" fill={url(`${id}f`)} />
      <ellipse cx="33" cy="24" rx="2.7" ry="11.6" fill="none" stroke="#fff" strokeWidth="0.35" opacity="0.3" />
      <ellipse cx="33.4" cy="24" rx="1.3" ry="4.2" fill="#450a0a" />
      <ellipse cx="32.6" cy="17" rx="0.8" ry="3.6" fill="#fff" opacity="0.3" />
    </>
  )
}

function HelpingHands({ id }: ArtProps) {
  const black: Stop[] = ['#52525b', '#27272a', '#09090b']
  return (
    <>
      <defs>
        <V id={`${id}base`} stops={['#52525b', '#27272a', '#09090b']} />
        <H id={`${id}rod`} stops={STEEL_ROUND} />
        <V id={`${id}bar`} stops={STEEL} />
        <V id={`${id}pcb`} stops={['#22c55e', '#15803d']} />
        <R
          id={`${id}lens`}
          cx={0.4}
          cy={0.35}
          r={0.75}
          stops={[
            [0, '#f0f9ff', 0.85],
            [0.6, '#bae6fd', 0.45],
            [1, '#38bdf8', 0.35],
          ]}
        />
      </defs>
      <Shadow y={41.6} rx={19} />
      <rect x="23.1" y="18" width="1.8" height="18" fill={url(`${id}rod`)} />
      <path
        d="M7 37.6C7 36 8 35.2 10 35.2H38C40 35.2 41 36 41 37.6V39C41 40 40.2 40.6 39 40.6H9C7.8 40.6 7 40 7 39Z"
        fill={url(`${id}base`)}
      />
      <rect x="9" y="35.6" width="30" height="0.6" rx="0.3" fill="#fff" opacity="0.25" />
      <rect x="7" y="19.6" width="34" height="1.5" rx="0.75" fill={url(`${id}bar`)} />
      <circle cx="24" cy="20.35" r="1.6" fill="#27272a" />
      <circle cx="7.8" cy="20.35" r="1.2" fill="#27272a" />
      <circle cx="40.2" cy="20.35" r="1.2" fill="#27272a" />
      {/* a small board held by the two clips */}
      <rect x="13.6" y="26.6" width="20.8" height="6" rx="0.6" fill={url(`${id}pcb`)} />
      {[17, 20.5, 24, 27.5, 31].map((x) => (
        <circle key={x} cx={x} cy="29.6" r="0.75" fill="#fbbf24" stroke="#a16207" strokeWidth="0.2" />
      ))}
      <rect x="14.4" y="27" width="19.2" height="0.5" rx="0.25" fill="#fff" opacity="0.25" />
      <g transform="translate(13.8 28.5) rotate(-127.2) scale(0.42)">
        <Clip id={`${id}a`} boot={black} open={4} />
      </g>
      <g transform="translate(34.2 28.5) rotate(-52.8) scale(0.42 -0.42)">
        <Clip id={`${id}b`} boot={black} open={4} />
      </g>
      {/* the magnifying glass */}
      <circle cx="24" cy="19.1" r="1.1" fill="#27272a" />
      <circle cx="24" cy="10.4" r="8" fill={url(`${id}lens`)} stroke="#3f3f46" strokeWidth="1.8" />
      <circle cx="24" cy="10.4" r="7" fill="none" stroke="#fff" strokeWidth="0.35" opacity="0.5" />
      <path d="M18.6 8.2A6 6 0 0 1 22 4.8" fill="none" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />
    </>
  )
}

function HotGlue({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}b`} stops={['#a5b4fc', '#6366f1', '#3730a3']} />
        <H id={`${id}g`} stops={['#4f46e5', '#4338ca', '#312e81']} />
        <V id={`${id}n`} stops={['#fde68a', '#d97706', '#92400e']} />
        <V id={`${id}s`} stops={['#ffffff', '#f1f5f9', '#cbd5e1']} />
        <V id={`${id}t`} stops={['#fde047', '#d97706']} />
      </defs>
      <Shadow cx={25} y={42.6} rx={17} />
      <path d="M31 39C31.5 42.5 36 43 40 41.6S45 39.2 47 40" fill="none" stroke="#27272a" strokeWidth="1.3" strokeLinecap="round" />
      {/* the glue stick going in at the back */}
      <rect x="33" y="13.6" width="13" height="4.6" rx="1.6" fill={url(`${id}s`)} stroke="#94a3b8" strokeWidth="0.3" />
      <rect x="35" y="14.3" width="10" height="0.8" rx="0.4" fill="#fff" />
      {/* handle and trigger */}
      <path d="M24.5 21.4H33L35 37C35.2 38.4 34.4 39.2 33 39.2H29C27.7 39.2 27 38.5 26.8 37.3Z" fill={url(`${id}g`)} />
      <path d="M28.4 25l1.6 1.6M28.8 28l1.6 1.6M29.2 31l1.6 1.6M29.6 34l1.6 1.6" stroke="#fff" strokeWidth="0.35" opacity="0.2" strokeLinecap="round" />
      <path d="M18.6 21.6H23.4L24.6 28.5C24.7 29.4 24 30 23.2 29.6C21 28.4 19.4 25.4 18.6 21.6Z" fill={url(`${id}t`)} />
      {/* the body */}
      <path
        d="M9.5 12.6C9.5 11 10.8 10 12.5 10H32C34.6 10 36 11.6 36 13.8V18.6C36 20.6 34.6 22 32.6 22H12.5C10.8 22 9.5 21 9.5 19.4Z"
        fill={url(`${id}b`)}
      />
      {[14, 17, 20].map((x) => (
        <rect key={x} x={x} y="13.2" width="1.5" height="5.4" rx="0.75" fill="#1e1b4b" opacity="0.45" />
      ))}
      <path d="M12 11.2H32" stroke="#fff" strokeWidth="0.7" strokeLinecap="round" opacity="0.5" />
      {/* the hot brass nozzle and a drop of glue */}
      <rect x="6.3" y="14.4" width="3.6" height="3.2" rx="0.4" fill={url(`${id}n`)} />
      <path d="M6.4 14.6L2.6 16.1V16.9L6.4 17.4Z" fill={url(`${id}n`)} />
      <path d="M2.7 17.3C2.7 17.3 1.4 19.3 1.4 20.3A1.3 1.3 0 0 0 4 20.3C4 19.3 2.7 17.3 2.7 17.3Z" fill="#fef3c7" stroke="#fcd34d" strokeWidth="0.3" />
      <ellipse cx="2.2" cy="19.9" rx="0.35" ry="0.55" fill="#fff" />
    </>
  )
}

function HeatShrink({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}k`} stops={['#71717a', '#27272a', '#09090b']} />
        <V id={`${id}r`} stops={['#fca5a5', '#dc2626', '#7f1d1d']} />
        <V id={`${id}b`} stops={['#93c5fd', '#2563eb', '#1e3a8a']} />
        <V id={`${id}y`} stops={['#fef08a', '#eab308', '#854d0e']} />
        <V id={`${id}w`} stops={['#e4e4e7', '#a1a1aa', '#52525b']} />
        <V id={`${id}c`} stops={COPPER} />
      </defs>
      <Shadow y={38.4} rx={20} />
      <Tube x={9} y={10.6} len={24} d={3} fill={url(`${id}y`)} />
      <Tube x={12} y={15} len={27} d={4.2} fill={url(`${id}b`)} />
      <Tube x={5} y={20.5} len={28} d={5.2} fill={url(`${id}r`)} />
      {/* a wire runs through the biggest tube */}
      <rect x="2" y="29.3" width="8" height="2.4" rx="1.2" fill={url(`${id}w`)} />
      <Tube x={8} y={27} len={30} d={7} fill={url(`${id}k`)} />
      <rect x="38" y="29.3" width="6" height="2.4" fill={url(`${id}w`)} />
      <rect x="43.6" y="29.75" width="2.8" height="1.5" rx="0.7" fill={url(`${id}c`)} />
      <circle cx="38" cy="30.5" r="1.25" fill={url(`${id}w`)} />
      <circle cx="38" cy="30.5" r="0.6" fill="#d97706" />
    </>
  )
}

/* ───────────────────────── Cut and hold ───────────────────────── */

function WireStripper({ id }: ArtProps) {
  return (
    <>
      <defs>
        <H id={`${id}m`} stops={['#e4e4e7', '#a1a1aa', '#52525b']} />
        <R id={`${id}p`} stops={['#fafafa', '#a1a1aa']} />
        <V id={`${id}w`} stops={['#93c5fd', '#2563eb', '#1e3a8a']} />
        <V id={`${id}c`} stops={COPPER} />
      </defs>
      <Shadow y={42} rx={14} />
      {/* a wire in the right hole, its plastic coat sliding off */}
      <rect x="6" y="11.6" width="17" height="1.8" rx="0.9" fill={url(`${id}w`)} />
      <rect x="24" y="12.05" width="7" height="0.9" rx="0.45" fill={url(`${id}c`)} />
      <rect x="31.4" y="11.6" width="3.6" height="1.8" rx="0.9" fill={url(`${id}w`)} />
      <Handles color="#dc2626" light="#fca5a5" />
      <path d="M21.2 21C20.6 15 21 8.5 22.6 4.6C23 3.7 25 3.7 25.4 4.6C27 8.5 27.4 15 26.8 21Z" fill={url(`${id}m`)} />
      <path d="M24 4.6V20" stroke="#3f3f46" strokeWidth="0.45" />
      {[
        [7.6, 0.45],
        [9.6, 0.55],
        [12.5, 0.7],
        [15.4, 0.85],
      ].map(([y, r]) => (
        <circle key={y} cx="24" cy={y} r={r} fill="#18181b" stroke="#e4e4e7" strokeWidth="0.25" />
      ))}
      <path d="M22.4 6C21.9 9 21.8 14 22.2 19" fill="none" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
      <Pivot id={`${id}p`} />
    </>
  )
}

function SideCutters({ id }: ArtProps) {
  return (
    <>
      <defs>
        <H id={`${id}m`} stops={['#e4e4e7', '#a1a1aa', '#52525b']} />
        <R id={`${id}p`} stops={['#fafafa', '#a1a1aa']} />
        <V id={`${id}c`} stops={COPPER} />
      </defs>
      <Shadow y={42} rx={14} />
      <g transform="rotate(10 24 24)">
        {/* a wire being cut, and the little piece that flies away */}
        <rect x="9" y="10.6" width="14" height="0.9" rx="0.45" fill={url(`${id}c`)} />
        <Handles color="#f59e0b" light="#fde68a" />
        <path d="M20.8 20.6C19.6 15.6 20.6 10.6 24 7.2C27.4 10.6 28.4 15.6 27.2 20.6Z" fill={url(`${id}m`)} />
        <path d="M24 7.8V17" stroke="#3f3f46" strokeWidth="0.45" />
        <path d="M22.3 10.2C21.4 12.4 21.3 15.6 21.9 19" fill="none" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
        <Pivot id={`${id}p`} />
      </g>
      <rect x="33" y="4.4" width="4" height="0.9" rx="0.45" fill={url(`${id}c`)} transform="rotate(-30 35 4.85)" />
      <path d="M30.4 8.8l-1.6.9M31.6 10.6l-1.8.4" stroke="currentColor" strokeWidth="0.45" strokeLinecap="round" opacity="0.35" />
    </>
  )
}

function Pliers({ id }: ArtProps) {
  return (
    <>
      <defs>
        <H id={`${id}m`} stops={['#e4e4e7', '#a1a1aa', '#52525b']} />
        <R id={`${id}p`} stops={['#fafafa', '#a1a1aa']} />
      </defs>
      <Shadow y={42} rx={14} />
      <g transform="rotate(-12 24 24)">
        <Handles color="#2563eb" light="#93c5fd" spring={false} />
        <path d="M21.4 20.6C21.6 15 22.8 8 23.6 2.6C23.8 1.8 24.2 1.8 24.4 2.6C25.2 8 26.4 15 26.6 20.6Z" fill={url(`${id}m`)} />
        <path d="M24 2.8V19.4" stroke="#3f3f46" strokeWidth="0.4" />
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={`M23.4 ${r2(4.6 + i * 1.15)}h1.2`} stroke="#3f3f46" strokeWidth="0.25" />
        ))}
        <path d="M23.3 16.4Q24 18.2 24.7 16.4Q24 15 23.3 16.4Z" fill="#3f3f46" />
        <path d="M22.6 18.6C22.6 14 23 8.4 23.4 4" fill="none" stroke="#fff" strokeWidth="0.45" strokeLinecap="round" opacity="0.6" />
        <Pivot id={`${id}p`} />
      </g>
    </>
  )
}

function Tweezers({ id }: ArtProps) {
  const left = 'M23.2 5C20.6 14 19.4 27 23.3 41.9L23.9 41.9C21.9 27 22.2 14 24.2 5Z'
  const right = 'M24.8 5C27.4 14 28.6 27 24.7 41.9L24.1 41.9C26.1 27 25.8 14 23.8 5Z'
  return (
    <>
      <defs>
        <H id={`${id}m`} stops={['#fafafa', '#a1a1aa', '#52525b']} />
        <H id={`${id}c`} stops={['#93c5fd', '#2563eb', '#1e3a8a']} />
        <clipPath id={`${id}top`}>
          <rect x="0" y="0" width="48" height="23" />
        </clipPath>
      </defs>
      <Shadow y={41} rx={15} />
      <g transform="rotate(35 24 24)">
        <path d={left} fill={url(`${id}m`)} />
        <path d={right} fill={url(`${id}m`)} />
        {/* the blue coat that keeps static away */}
        <g clipPath={url(`${id}top`)}>
          <path d={left} fill={url(`${id}c`)} />
          <path d={right} fill={url(`${id}c`)} />
        </g>
        <rect x="22.3" y="3" width="3.4" height="3.6" rx="1.5" fill={url(`${id}c`)} />
        <path d="M21 13.5l1.1.4M20.7 15.5l1.1.3M20.6 17.5l1.1.2M27 13.5l-1.1.4M27.3 15.5l-1.1.3M27.4 17.5l-1.1.2" stroke="#fff" strokeWidth="0.35" opacity="0.4" strokeLinecap="round" />
        {/* a tiny part held at the tips */}
        <rect x="22.5" y="41.1" width="3" height="1.7" rx="0.25" fill="#18181b" />
        <rect x="22.5" y="41.1" width="0.6" height="1.7" fill="#d4d4d8" />
        <rect x="24.9" y="41.1" width="0.6" height="1.7" fill="#d4d4d8" />
      </g>
    </>
  )
}

function Screwdriver({ id, x, top, tip, cap }: { id: string; x: number; top: number; tip: 'flat' | 'cross' | 'small'; cap: string }) {
  const end = 40
  return (
    <g>
      <rect x={x - 0.55} y={top + 17} width="1.1" height={end - top - 19} fill={url(`${id}s`)} />
      {tip === 'cross' ? (
        <>
          <path d={`M${x - 0.75} ${end - 2.6}H${x + 0.75}L${x} ${end}Z`} fill={url(`${id}s`)} />
          <path d={`M${x} ${end - 2.4}V${end - 0.4}`} stroke="#52525b" strokeWidth="0.3" />
        </>
      ) : (
        <path
          d={`M${x - 0.55} ${end - 2.6}L${x - (tip === 'flat' ? 1.1 : 0.8)} ${end - 0.5}V${end}H${x + (tip === 'flat' ? 1.1 : 0.8)}V${end - 0.5}L${x + 0.55} ${end - 2.6}Z`}
          fill={url(`${id}s`)}
        />
      )}
      <path d={`M${x - 1.3} ${top + 15.4}H${x + 1.3}L${x + 0.7} ${top + 17.6}H${x - 0.7}Z`} fill="#3f3f46" />
      <rect x={x - 2.6} y={top + 2} width="5.2" height="13.6" rx="1.6" fill={url(`${id}h`)} />
      <rect x={x - 2.6} y={top + 2} width="5.2" height="13.6" rx="1.6" fill={url(`${id}k`)} opacity="0.35" />
      <rect x={x - 1.9} y={top + 2.6} width="0.8" height="12.4" rx="0.4" fill="#fff" opacity="0.4" />
      <rect x={x - 2.1} y={top} width="4.2" height="2.6" rx="1.1" fill={cap} />
      <rect x={x - 1.5} y={top + 0.4} width="2" height="0.6" rx="0.3" fill="#fff" opacity="0.45" />
    </g>
  )
}

function Screwdrivers({ id }: ArtProps) {
  return (
    <>
      <defs>
        <H id={`${id}s`} stops={STEEL_ROUND} />
        <H id={`${id}h`} stops={['#e4e4e7', '#a1a1aa', '#52525b']} />
        <pattern id={`${id}k`} width="1" height="1" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0.5H1M0.5 0V1" stroke="#18181b" strokeWidth="0.3" />
        </pattern>
      </defs>
      <Shadow y={42} rx={17} />
      <Screwdriver id={id} x={13} top={8} tip="flat" cap="#ef4444" />
      <Screwdriver id={id} x={24} top={4} tip="cross" cap="#22c55e" />
      <Screwdriver id={id} x={35} top={11} tip="small" cap="#3b82f6" />
    </>
  )
}

/* ───────────────────────── Power ───────────────────────── */

function BenchSupply({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}t`} stops={['#71717a', '#3f3f46']} />
        <V id={`${id}b`} stops={['#4b5563', '#27272a', '#18181b']} />
        <R id={`${id}k`} stops={['#a1a1aa', '#3f3f46', '#18181b']} />
        <R id={`${id}r`} stops={['#fecaca', '#ef4444', '#7f1d1d']} />
        <R id={`${id}n`} stops={['#71717a', '#18181b', '#000000']} />
      </defs>
      <Shadow y={40.6} rx={21} />
      <rect x="6.5" y="37.4" width="5" height="1.8" rx="0.7" fill="#18181b" />
      <rect x="36.5" y="37.4" width="5" height="1.8" rx="0.7" fill="#18181b" />
      <path d="M5.6 9.6L8.2 7H39.8L42.4 9.6Z" fill={url(`${id}t`)} />
      <rect x="4" y="9.4" width="40" height="28.6" rx="2" fill={url(`${id}b`)} />
      <rect x="5.5" y="10" width="37" height="0.7" rx="0.35" fill="#fff" opacity="0.22" />
      {/* the two screens: volts and amps */}
      <rect x="6.5" y="12.2" width="15.5" height="7.4" rx="0.8" fill="#0a0a0a" />
      <rect x="26" y="12.2" width="15.5" height="7.4" rx="0.8" fill="#0a0a0a" />
      <Readout x={8.45} y={13.4} value="5.00" w={3.2} h={5} t={0.8} gap={1} on="#ef4444" off="#ef444420" />
      <Readout x={27.95} y={13.4} value="0.20" w={3.2} h={5} t={0.8} gap={1} on="#22c55e" off="#22c55e20" />
      {/* the knobs */}
      {[14.25, 33.75].map((x) => (
        <g key={x}>
          <circle cx={x} cy="26.4" r="3.9" fill="#09090b" />
          <circle cx={x} cy="26.4" r="3.3" fill={url(`${id}k`)} />
          <path d={`M${x} 26.4l-1.8-2.1`} stroke="#fff" strokeWidth="0.75" strokeLinecap="round" />
        </g>
      ))}
      <circle cx="20.4" cy="23.4" r="0.7" fill="#4ade80" />
      <circle cx="20.4" cy="23.4" r="1.3" fill="#4ade80" opacity="0.25" />
      {/* power switch and the + and − outputs */}
      <rect x="6.5" y="31.4" width="5" height="4.2" rx="0.8" fill="#09090b" />
      <path d="M7.2 32.1H10.8V33.5H7.2Z" fill="#a1a1aa" />
      <path d="M7.2 33.5H10.8V34.9H7.2Z" fill="#52525b" />
      <circle cx="31" cy="33.5" r="2.1" fill={url(`${id}n`)} />
      <circle cx="38" cy="33.5" r="2.1" fill={url(`${id}r`)} />
      <circle cx="31" cy="33.5" r="0.85" fill="#0a0a0a" stroke="#71717a" strokeWidth="0.25" />
      <circle cx="38" cy="33.5" r="0.85" fill="#0a0a0a" stroke="#fca5a5" strokeWidth="0.25" />
    </>
  )
}

function BatteryHolder({ id }: ArtProps) {
  const spring = (x: number, y: number) =>
    `M${x} ${y}l.7 .55-1.4 .55 1.4 .55-1.4 .55 1.4 .55-1.4 .55 1.4 .55-1.4 .55 1.4 .55-.7 .55`
  return (
    <>
      <defs>
        <V id={`${id}h`} stops={['#3f3f46', '#18181b', '#09090b']} />
        <V id={`${id}b`} stops={['#52525b', '#18181b']} />
        <V id={`${id}c`} stops={['#fbbf24', '#d97706', '#92400e']} />
      </defs>
      <Shadow cx={23} y={39.4} rx={19} />
      {/* red is +, black is − */}
      <path d="M37 19C42 19 41 27 44.5 30.5" fill="none" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M37 29C40.5 29 40 34 43 37" fill="none" stroke="#18181b" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M44.5 30.5L45.6 31.6M43 37L44.1 38.1" stroke="#d4d4d8" strokeWidth="1" strokeLinecap="round" />
      <rect x="4.5" y="12.5" width="33" height="23.4" rx="2.4" fill={url(`${id}h`)} />
      <rect x="6" y="13" width="30" height="0.7" rx="0.35" fill="#fff" opacity="0.2" />
      <rect x="6.3" y="14.2" width="29.4" height="20" rx="1.4" fill="#0a0a0a" />
      <rect x="34.2" y="15.4" width="0.9" height="7" fill="#a1a1aa" />
      <rect x="6.9" y="26.6" width="0.9" height="7" fill="#a1a1aa" />
      <path d={spring(7.3, 15.8)} fill="none" stroke="#d4d4d8" strokeWidth="0.45" />
      <path d={spring(34.7, 27)} fill="none" stroke="#d4d4d8" strokeWidth="0.45" />
      <Cell id={id} x={8.1} y={15.1} />
      <Cell id={id} x={8.1} y={26.3} flip />
    </>
  )
}

function UsbPower({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}b`} stops={['#475569', '#1e293b', '#0f172a']} />
        <V id={`${id}p`} stops={['#71717a', '#3f3f46']} />
        <H id={`${id}m`} stops={STEEL_ROUND} />
      </defs>
      <Shadow cx={22} y={43.5} rx={17} />
      <path d="M16.5 5.4C16.5 1.6 30.5 1.2 35 8C38.3 13.2 38 20 38 26.6" fill="none" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17.2 4.4C18.4 2.4 29.6 2.2 33.8 8" fill="none" stroke="#a1a1aa" strokeWidth="0.4" strokeLinecap="round" opacity="0.5" />
      {/* the plug in the power bank, and the small plug for the board */}
      <rect x="13.2" y="5" width="6.6" height="3.8" rx="0.7" fill={url(`${id}p`)} />
      <rect x="14" y="8.4" width="5" height="1.8" fill={url(`${id}m`)} />
      <rect x="37" y="24.8" width="2" height="2.2" rx="0.4" fill="#3f3f46" />
      <rect x="36.3" y="26.6" width="3.4" height="6.6" rx="1" fill={url(`${id}p`)} />
      <rect x="36.9" y="33" width="2.2" height="3.2" rx="0.9" fill={url(`${id}m`)} />
      <rect x="8" y="10" width="17" height="31" rx="3.4" fill={url(`${id}b`)} />
      <rect x="9.5" y="10.6" width="14" height="0.8" rx="0.4" fill="#fff" opacity="0.25" />
      <path d="M10 13L17 11.5V36L10 38Z" fill="#fff" opacity="0.04" />
      <path d="M17.9 16.4L14.2 23.2H16.9L15.6 29.2L20.4 21.5H17.6L19.4 16.4Z" fill="#38bdf8" />
      {[12.3, 15, 17.7, 20.4].map((x, i) => (
        <g key={x}>
          {i < 3 && <circle cx={x} cy="35.2" r="1.3" fill="#22d3ee" opacity="0.25" />}
          <circle cx={x} cy="35.2" r="0.75" fill={i < 3 ? '#67e8f9' : '#334155'} />
        </g>
      ))}
    </>
  )
}

/* ───────────────────────── Fix ───────────────────────── */

function DesolderPump({ id }: ArtProps) {
  return (
    <>
      <defs>
        <H id={`${id}b`} stops={['#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a']} />
        <H id={`${id}n`} stops={['#ffffff', '#e5e7eb', '#cbd5e1']} />
        <H id={`${id}m`} stops={STEEL_ROUND} />
        <V id={`${id}k`} stops={['#52525b', '#18181b']} />
      </defs>
      <Shadow cx={22} y={42.6} rx={14} />
      <g transform="rotate(30 24 24)">
        <path d="M22.3 34.5H25.7L24.9 43H23.1Z" fill={url(`${id}n`)} stroke="#94a3b8" strokeWidth="0.3" />
        <ellipse cx="24" cy="43" rx="0.6" ry="0.3" fill="#475569" />
        <rect x="21.6" y="32.8" width="4.8" height="2.2" rx="0.5" fill={url(`${id}k`)} />
        <rect x="23.2" y="3.8" width="1.6" height="7.6" fill={url(`${id}m`)} />
        <rect x="21.2" y="1.8" width="5.6" height="2.6" rx="1.2" fill={url(`${id}k`)} />
        <rect x="22" y="2.2" width="3" height="0.6" rx="0.3" fill="#fff" opacity="0.3" />
        <rect x="27.4" y="15.6" width="2.2" height="3.6" rx="0.8" fill="#ef4444" />
        <rect x="20" y="12" width="8" height="21" rx="1.4" fill={url(`${id}b`)} />
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={`M20 ${r2(25.6 + i * 0.95)}H28`} stroke="#1e3a8a" strokeWidth="0.35" opacity="0.5" />
        ))}
        <rect x="21.3" y="13" width="0.9" height="19" rx="0.45" fill="#fff" opacity="0.45" />
        <rect x="19.6" y="11" width="8.8" height="2.4" rx="0.8" fill={url(`${id}k`)} />
      </g>
    </>
  )
}

function SolderWick({ id }: ArtProps) {
  return (
    <>
      <defs>
        <pattern id={`${id}w`} width="1.2" height="1.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="1.2" height="1.2" fill="#d97706" />
          <path d="M0 0.6H1.2" stroke="#fde68a" strokeWidth="0.35" />
          <path d="M0.6 0V1.2" stroke="#92400e" strokeWidth="0.35" />
        </pattern>
        <V
          id={`${id}sh`}
          stops={[
            [0, '#ffffff', 0.35],
            [0.5, '#ffffff', 0],
            [1, '#000000', 0.3],
          ]}
        />
        <V id={`${id}t`} stops={STEEL} />
        <R id={`${id}s`} stops={['#86efac', '#16a34a', '#14532d']} />
      </defs>
      <Shadow cx={25} y={41} rx={19} />
      <g transform="translate(25.5 25.5) rotate(36.6)">
        <rect x="-2" y="-1.7" width="23" height="3.4" fill={url(`${id}w`)} />
        {/* the end is silver: full of the solder it soaked up */}
        <rect x="16.6" y="-1.7" width="4.4" height="3.4" fill={url(`${id}t`)} />
        <rect x="16.6" y="-1.7" width="4.4" height="3.4" fill={url(`${id}w`)} opacity="0.25" />
        <rect x="-2" y="-1.7" width="23" height="3.4" fill={url(`${id}sh`)} />
      </g>
      <circle cx="19" cy="19" r="12.5" fill={url(`${id}s`)} />
      <circle cx="19" cy="19" r="11.6" fill="none" stroke="#fff" strokeWidth="0.35" opacity="0.3" />
      <circle cx="19" cy="19" r="8.6" fill="#dcfce7" opacity="0.25" />
      <circle cx="19" cy="19" r="4.6" fill="#15803d" />
      <circle cx="19" cy="19" r="2" fill="#052e16" />
      <path d="M10.4 13.6A10 10 0 0 1 16.4 9.4" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
    </>
  )
}

function TipCleaner({ id }: ArtProps) {
  // a tangle of thin brass ribbons: loops of many sizes, light ones on top
  const curls = Array.from({ length: 26 }, (_, i) => {
    const x = 13.5 + ((i * 7.3) % 21)
    const y = 16.5 + ((i * 4.7) % 11)
    return { x: r2(x), y: r2(y), rx: r2(1.6 + ((i * 1.7) % 1.8)), a: (i * 47) % 180, light: i % 3 === 0 }
  })
  const wool = 'M12.4 27.2C11.6 20.4 17 14.6 24 14.6C31 14.6 36.4 20.4 35.6 27.2A11.6 3.3 0 0 1 12.4 27.2Z'
  return (
    <>
      <defs>
        <H id={`${id}c`} stops={['#71717a', '#d4d4d8', '#a1a1aa', '#3f3f46']} />
        <R id={`${id}w`} cx={0.4} cy={0.3} r={0.85} stops={['#fef3c7', '#fbbf24', '#d97706', '#92400e']} />
        <clipPath id={`${id}clip`}>
          <path d={wool} />
        </clipPath>
      </defs>
      <Shadow y={40.8} rx={15} />
      <path d="M11 27V35.4A13 4 0 0 0 37 35.4V27Z" fill={url(`${id}c`)} />
      <path d="M11.6 33.6A12.6 3.8 0 0 0 36.4 33.6" fill="none" stroke="#000" strokeWidth="0.4" opacity="0.2" />
      <ellipse cx="24" cy="27" rx="13" ry="4" fill="#a1a1aa" />
      <ellipse cx="24" cy="27.2" rx="11.6" ry="3.3" fill="#3f3f46" />
      <path d={wool} fill={url(`${id}w`)} />
      <g clipPath={url(`${id}clip`)} fill="none">
        {curls.map((c, i) => (
          <ellipse
            key={i}
            cx={c.x}
            cy={c.y}
            rx={c.rx}
            ry={r2(c.rx * 0.45)}
            transform={`rotate(${c.a} ${c.x} ${c.y})`}
            stroke={c.light ? '#fef9c3' : i % 2 ? '#b45309' : '#78350f'}
            strokeWidth={c.light ? 0.35 : 0.3}
            opacity={c.light ? 0.9 : 0.45}
          />
        ))}
      </g>
      {/* the cup's front lip, in front of the wool */}
      <path d="M11 27A13 4 0 0 0 37 27" fill="none" stroke="#e4e4e7" strokeWidth="0.9" />
      <path d="M17.6 18C19.6 16.4 21.8 15.7 24.2 15.7" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
    </>
  )
}

/* ───────────────────────── Stay safe ───────────────────────── */

function SafetyGlasses({ id }: ArtProps) {
  const lens =
    'M5 17C5 15.3 6.3 14.5 8 14.5H40C41.7 14.5 43 15.3 43 17C43 23.5 41.3 29.5 35.6 30.4C31.3 31.1 28 29.3 26.4 25.6C25.8 24.3 24.9 23.6 24 23.6C23.1 23.6 22.2 24.3 21.6 25.6C20 29.3 16.7 31.1 12.4 30.4C6.7 29.5 5 23.5 5 17Z'
  return (
    <>
      <defs>
        <V
          id={`${id}l`}
          stops={[
            [0, '#e0f2fe', 0.85],
            [0.55, '#7dd3fc', 0.5],
            [1, '#38bdf8', 0.4],
          ]}
        />
        <V id={`${id}f`} stops={['#fdba74', '#ea580c', '#9a3412']} />
      </defs>
      <Shadow y={37.6} rx={17} />
      <path d="M4.2 15.8L2.2 17.6V22.6L5 21.2Z" fill="#9a3412" />
      <path d="M43.8 15.8L45.8 17.6V22.6L43 21.2Z" fill="#9a3412" />
      <path d={lens} fill={url(`${id}l`)} stroke="#0ea5e9" strokeWidth="0.5" strokeOpacity="0.6" />
      <path d="M9.4 18.2L13.6 26.4M12.8 17.8L15.2 22M29.8 18.2L34 26.4M33.2 17.8L35.6 22" stroke="#fff" strokeLinecap="round" strokeWidth="1.1" opacity="0.7" />
      <path d="M22.1 24.2C21.2 25.2 20.9 26.6 21.2 27.8M25.9 24.2C26.8 25.2 27.1 26.6 26.8 27.8" fill="none" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
      <path d="M4 15.6C4 13.2 5.6 12 8 12H40C42.4 12 44 13.2 44 15.6V17.2H4Z" fill={url(`${id}f`)} />
      <path d="M7 12.9H41" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.5" />
    </>
  )
}

function FumeFan({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}b`} stops={['#52525b', '#27272a', '#09090b']} />
        <V id={`${id}s`} stops={['#3f3f46', '#18181b']} />
        <H id={`${id}bl`} stops={['#71717a', '#3f3f46']} />
      </defs>
      <Shadow cx={27} y={41.2} rx={18} />
      <path d="M15 39.6L18.6 32.4H37.4L41 39.6Z" fill={url(`${id}s`)} />
      <rect x="13" y="6" width="30" height="28" rx="3" fill={url(`${id}b`)} />
      <rect x="15" y="6.6" width="26" height="0.8" rx="0.4" fill="#fff" opacity="0.2" />
      <circle cx="28" cy="20" r="11.6" fill="#0a0a0a" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="28" cy="14.2" rx="2.7" ry="5.4" fill={url(`${id}bl`)} transform={`rotate(${a + 18} 28 20)`} />
      ))}
      <g fill="none" stroke="#a1a1aa" strokeWidth="0.55">
        <circle cx="28" cy="20" r="3.6" />
        <circle cx="28" cy="20" r="6.8" />
        <circle cx="28" cy="20" r="10" />
        <path d="M28 8.4V31.6M16.4 20H39.6" />
      </g>
      <circle cx="28" cy="20" r="11.4" fill="none" stroke="#52525b" strokeWidth="0.6" />
      <circle cx="28" cy="20" r="1.8" fill="#a1a1aa" />
      <circle cx="16.4" cy="9.4" r="1.3" fill="#4ade80" opacity="0.3" />
      <circle cx="16.4" cy="9.4" r="0.7" fill="#4ade80" />
      {/* smoke drawn into the fan */}
      <g fill="none" stroke="#94a3b8" strokeLinecap="round" opacity="0.7">
        <path d="M2 27C5 25 6 29 9 27S13 24 18.5 23.4" strokeWidth="1.1" />
        <path d="M3 19.4C5.6 17.6 7 21.4 10 19.6S14 17.6 18.2 18.6" strokeWidth="0.9" />
        <path d="M4.6 12.4C7 11 8.4 14.2 11 13S15.4 12.6 19 15" strokeWidth="0.75" />
      </g>
    </>
  )
}

function HeatMat({ id }: ArtProps) {
  const mat = 'M4 37L9 13C9.2 12.2 9.8 11.8 10.6 11.8H37.4C38.2 11.8 38.8 12.2 39 13L44 37C44.2 38 43.6 38.6 42.6 38.6H5.4C4.4 38.6 3.8 38 4 37Z'
  const rows = [0.18, 0.38, 0.6, 0.83]
  return (
    <>
      <defs>
        <V id={`${id}m`} stops={['#94a3b8', '#64748b', '#475569']} />
        <V id={`${id}p`} stops={['#22c55e', '#15803d']} />
      </defs>
      <Shadow y={40.6} rx={21} />
      <path d={mat} fill="#334155" transform="translate(0 1.2)" />
      <path d={mat} fill={url(`${id}m`)} />
      <g stroke="#e2e8f0" strokeWidth="0.3" opacity="0.3">
        {Array.from({ length: 8 }, (_, k) => (
          <path key={k} d={`M${r2(10 + (28 * (k + 1)) / 9)} 12.4L${r2(5 + (38 * (k + 1)) / 9)} 37.8`} />
        ))}
        {rows.map((f) => (
          <path key={f} d={`M${r2(9.6 - 5 * f)} ${r2(12.6 + 25 * f)}H${r2(38.4 + 5 * f)}`} />
        ))}
      </g>
      <path d="M10.4 12.6H37.6" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.4" />
      {/* little cups for screws */}
      {[26.6, 31, 35.4].map((x, i) => (
        <g key={x}>
          <ellipse cx={x} cy="16.8" rx="1.9" ry="1.1" fill="#334155" />
          <ellipse cx={x} cy="17.1" rx="1.4" ry="0.7" fill="#1e293b" />
          {i === 1 && <circle cx={x} cy="16.9" r="0.55" fill="#e4e4e7" />}
        </g>
      ))}
      {/* a small board on the mat */}
      <path d="M10.6 33.4L12.4 25.4H25.4L24.4 33.4Z" fill={url(`${id}p`)} />
      <path d="M15.6 31.4L16.2 27.6H20L19.6 31.4Z" fill="#18181b" />
      {[12.8, 14, 21.6, 22.6].map((x, i) => (
        <circle key={x} cx={x} cy={i < 2 ? 29.4 + i * 1.6 : 27.8 + (i - 2) * 2.6} r="0.5" fill="#fbbf24" />
      ))}
    </>
  )
}

function AntiStatic({ id }: ArtProps) {
  const black: Stop[] = ['#52525b', '#18181b', '#09090b']
  return (
    <>
      <defs>
        <R id={`${id}s`} stops={['#fafafa', '#a1a1aa', '#52525b']} />
      </defs>
      <Shadow y={43} rx={19} />
      {/* the coiled wire: each loop crosses the cord, its front half catching the light */}
      <g fill="none" strokeLinecap="round">
        {Array.from({ length: 10 }, (_, i) => {
          const x = r2(23.6 + i * 1.13)
          const y = r2(22.8 + i * 1.24)
          return (
            <g key={i} transform={`rotate(42 ${x} ${y})`}>
              <ellipse cx={x} cy={y} rx="1.25" ry="3" stroke="#18181b" strokeWidth="0.85" />
              <path d={`M${r2(x - 1.25)} ${y}A1.25 3 0 0 0 ${r2(x + 1.25)} ${y}`} stroke="#71717a" strokeWidth="0.35" />
            </g>
          )
        })}
      </g>
      <g transform="translate(44.5 42) rotate(-143.13) scale(0.55)">
        <Clip id={`${id}c`} boot={black} open={6} />
      </g>
      {/* the wrist band */}
      <g transform="rotate(-18 15.5 15)">
        <ellipse cx="15.5" cy="15" rx="10.5" ry="7" fill="none" stroke="#1e3a8a" strokeWidth="3.8" />
        <path d="M5 15A10.5 7 0 0 0 26 15" fill="none" stroke="#2563eb" strokeWidth="3.8" />
        <path d="M6.4 17.4A10 6 0 0 0 24.6 17.4" fill="none" stroke="#93c5fd" strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />
      </g>
      <circle cx="22.4" cy="20.6" r="2.4" fill={url(`${id}s`)} stroke="#3f3f46" strokeWidth="0.3" />
      <circle cx="22.4" cy="20.6" r="0.9" fill="#3f3f46" />
    </>
  )
}

const ART: Record<ToolId, (p: ArtProps) => ReactNode> = {
  multimeter: Multimeter,
  oscilloscope: Oscilloscope,
  calipers: Calipers,
  partTester: PartTester,
  breadboard: Breadboard,
  jumperWires: JumperWires,
  crocClips: CrocClips,
  solderingIron: SolderingIron,
  solder: Solder,
  helpingHands: HelpingHands,
  hotGlue: HotGlue,
  heatShrink: HeatShrink,
  wireStripper: WireStripper,
  sideCutters: SideCutters,
  pliers: Pliers,
  tweezers: Tweezers,
  screwdrivers: Screwdrivers,
  benchSupply: BenchSupply,
  batteryHolder: BatteryHolder,
  usbPower: UsbPower,
  desolderPump: DesolderPump,
  solderWick: SolderWick,
  tipCleaner: TipCleaner,
  safetyGlasses: SafetyGlasses,
  fumeFan: FumeFan,
  heatMat: HeatMat,
  antiStatic: AntiStatic,
  continuityTester: measure.ContinuityTester,
  clampMeter: measure.ClampMeter,
  usbMeter: measure.UsbMeter,
  irThermometer: measure.IrThermometer,
  logicProbe: measure.LogicProbe,
  logicAnalyzer: measure.LogicAnalyzer,
  tapeMeasure: measure.TapeMeasure,
  loupe: measure.Loupe,
  dupont: build.Dupont,
  headerPins: build.HeaderPins,
  perfboard: build.Perfboard,
  pcb: build.Pcb,
  screwTerminal: build.ScrewTerminal,
  wireSpool: build.WireSpool,
  crimper: build.Crimper,
  electricalTape: build.ElectricalTape,
  cuttingMat: cut.CuttingMat,
  hobbyKnife: cut.HobbyKnife,
  miniSaw: cut.MiniSaw,
  file: cut.NeedleFiles,
  handDrill: cut.HandDrill,
  pcbVise: cut.PcbVise,
  coinCells: powerFix.CoinCells,
  charger: powerFix.Charger,
  wallAdapter: powerFix.WallAdapter,
  flux: powerFix.Flux,
  alcoholBrush: powerFix.AlcoholBrush,
  hotAir: powerFix.HotAir,
  gloves: safe.Gloves,
  esdMat: safe.EsdMat,
  firstAid: safe.FirstAid,
  extinguisher: safe.Extinguisher,
  usbCable: code.UsbCable,
  laptop: code.Laptop,
  usbSerial: code.UsbSerial,
  programmer: code.Programmer,
  sdCard: code.SdCard,
  partsBox: tidy.PartsBox,
  labelMaker: tidy.LabelMaker,
  magneticTray: tidy.MagneticTray,
  staticBags: tidy.StaticBags,
  cableTies: tidy.CableTies,
}

/** A drawing of a workshop tool. `size` is the width and height in pixels. */
export function ToolArt({ tool, size = 48, className }: { tool: ToolId; size?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  const Art = ART[tool]
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={cn('shrink-0 text-foreground', className)}>
      <Art id={id} />
    </svg>
  )
}

/** The Toolbox's own mark: a red metal toolbox with a black handle. */
export function ToolboxMark({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={cn('shrink-0 text-foreground', className)}>
      <defs>
        <V id={`${id}b`} stops={['#f87171', '#dc2626', '#991b1b']} />
        <V id={`${id}l`} stops={['#fca5a5', '#ef4444']} />
        <V id={`${id}m`} stops={STEEL} />
      </defs>
      <Shadow y={42.4} rx={18} />
      <path d="M17 13.4V10.6C17 9 18.2 7.8 19.8 7.8H28.2C29.8 7.8 31 9 31 10.6V13.4" fill="none" stroke="#27272a" strokeWidth="2.4" />
      <path d="M18.4 12.4V10.8C18.4 10 19 9.3 19.9 9.3H28" fill="none" stroke="#a1a1aa" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
      <path d="M8.6 18.6L12.2 13.2C12.5 12.8 12.9 12.6 13.4 12.6H34.6C35.1 12.6 35.5 12.8 35.8 13.2L39.4 18.6Z" fill={url(`${id}l`)} />
      <rect x="6" y="18.2" width="36" height="21" rx="2" fill={url(`${id}b`)} />
      <path d="M6 23.2H42" stroke="#7f1d1d" strokeWidth="0.7" opacity="0.7" />
      <rect x="7.5" y="18.8" width="33" height="0.8" rx="0.4" fill="#fff" opacity="0.35" />
      {[13, 31].map((x) => (
        <g key={x}>
          <rect x={x} y="20.6" width="4" height="5" rx="0.8" fill={url(`${id}m`)} stroke="#52525b" strokeWidth="0.3" />
          <circle cx={x + 2} cy="24.2" r="0.55" fill="#52525b" />
        </g>
      ))}
    </svg>
  )
}
