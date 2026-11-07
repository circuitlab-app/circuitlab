import { Cell, H, R, Readout, Shadow, V } from './kit'
import { r2, STEEL, STEEL_ROUND, url, type ArtProps } from './palette'

/* ───────────────────────── Power and fix: the newer tools ───────────────────────── */

function CoinCells({ id }: ArtProps) {
  // one cell lying flat, seen from a little above: a band for its edge, an oval for its face
  const lying = (cx: number, cy: number) => (
    <g>
      <path
        d={`M${r2(cx - 9)} ${cy}V${r2(cy + 2.4)}A9 3.2 0 0 0 ${r2(cx + 9)} ${r2(cy + 2.4)}V${cy}Z`}
        fill={url(`${id}e`)}
        stroke="#52525b"
        strokeWidth="0.3"
      />
      <ellipse cx={cx} cy={cy} rx="9" ry="3.2" fill={url(`${id}t`)} />
      <ellipse cx={cx} cy={cy} rx="7.7" ry="2.5" fill="none" stroke="#fff" strokeWidth="0.35" opacity="0.6" />
      <ellipse cx={cx} cy={r2(cy + 0.15)} rx="8.3" ry="2.85" fill="none" stroke="#71717a" strokeWidth="0.25" opacity="0.6" />
      <path d={`M${r2(cx - 1.4)} ${cy}h2.8M${cx} ${r2(cy - 0.6)}v1.2`} stroke="#71717a" strokeWidth="0.35" strokeLinecap="round" opacity="0.6" />
    </g>
  )
  return (
    <>
      <defs>
        <H id={`${id}e`} stops={STEEL_ROUND} />
        <R id={`${id}t`} cx={0.35} cy={0.3} r={0.9} stops={['#fafafa', '#e4e4e7', '#a1a1aa']} />
        <R id={`${id}f`} stops={['#fafafa', '#e4e4e7', '#a1a1aa', '#71717a']} />
        <V id={`${id}s`} stops={['#a1a1aa', '#52525b']} />
        <V id={`${id}p`} stops={['#f4f4f5', '#a1a1aa']} />
      </defs>
      <Shadow cx={18} y={32.6} rx={11} />
      <Shadow cx={36.6} y={43.2} rx={10.5} />
      {/* a cell standing up, its + side facing you */}
      <circle cx="18" cy="19.6" r="12.4" fill={url(`${id}s`)} />
      <circle cx="16.5" cy="19.6" r="12.4" fill={url(`${id}f`)} />
      <circle cx="16.5" cy="19.6" r="11.5" fill="none" stroke="#71717a" strokeWidth="0.3" opacity="0.6" />
      <circle cx="16.5" cy="19.6" r="11" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.55" />
      {/* the + pressed into the metal */}
      <g transform="translate(0.35 0.35)" fill="#3f3f46" opacity="0.35">
        <rect x="12.9" y="15.3" width="7.2" height="1.8" rx="0.5" />
        <rect x="15.6" y="12.6" width="1.8" height="7.2" rx="0.5" />
      </g>
      <g transform="translate(-0.3 -0.3)" fill="#fff" opacity="0.8">
        <rect x="12.9" y="15.3" width="7.2" height="1.8" rx="0.5" />
        <rect x="15.6" y="12.6" width="1.8" height="7.2" rx="0.5" />
      </g>
      <g fill={url(`${id}p`)}>
        <rect x="12.9" y="15.3" width="7.2" height="1.8" rx="0.5" />
        <rect x="15.6" y="12.6" width="1.8" height="7.2" rx="0.5" />
      </g>
      {/* its name and volts, printed small */}
      <rect x="11" y="23.6" width="11" height="0.9" rx="0.45" fill="#52525b" opacity="0.5" />
      <rect x="12.8" y="25.6" width="7.4" height="0.9" rx="0.45" fill="#52525b" opacity="0.4" />
      <path d="M8.2 13.4A10 10 0 0 1 13.6 9" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      {/* two more lying in a little stack */}
      {lying(37, 37.2)}
      {lying(35.8, 33.9)}
    </>
  )
}

function Charger({ id }: ArtProps) {
  const bays = [9.25, 16.65, 24.05, 31.45]
  // green: full; red: still charging
  const leds = ['#4ade80', '#4ade80', '#ef4444', '#ef4444']
  return (
    <>
      <defs>
        <V id={`${id}h`} stops={['#a1a1aa', '#71717a', '#3f3f46']} />
        <V id={`${id}b`} stops={['#4ade80', '#16a34a', '#14532d']} />
        <V id={`${id}c`} stops={['#f4f4f5', '#a1a1aa', '#52525b']} />
        <V id={`${id}p`} stops={STEEL} />
        <V id={`${id}k`} stops={['#52525b', '#18181b']} />
      </defs>
      <Shadow cx={24} y={41.6} rx={21} />
      {/* the cable to the wall */}
      <path d="M38.5 15.5C44.5 15.5 46 21 44.5 27C43.4 31.5 41.8 32.5 41.8 36.6" fill="none" stroke="#27272a" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M39 15C43.4 15.2 45.2 19 44.4 23.6" fill="none" stroke="#a1a1aa" strokeWidth="0.4" strokeLinecap="round" opacity="0.5" />
      <rect x="40.5" y="40.2" width="2.6" height="2.2" rx="0.3" fill={url(`${id}p`)} />
      <rect x="40" y="36.2" width="3.6" height="4.4" rx="0.7" fill={url(`${id}k`)} />
      {/* the cradle */}
      <rect x="3.5" y="7.8" width="35" height="31.4" rx="3" fill="#27272a" />
      <rect x="3.5" y="6.5" width="35" height="31.4" rx="3" fill={url(`${id}h`)} />
      <rect x="5.5" y="7.1" width="31" height="0.8" rx="0.4" fill="#fff" opacity="0.45" />
      {bays.map((x) => (
        <rect key={x} x={x - 3.5} y="9" width="7" height="24.4" rx="1.6" fill="#18181b" />
      ))}
      {/* four AA cells, + up */}
      {bays.map((x) => (
        <g key={x} transform={`translate(${x} 21.2) rotate(-90) scale(0.9) translate(-12.95 -3.7)`}>
          <Cell id={id} x={0} y={0} />
        </g>
      ))}
      {/* a light under each cell */}
      {bays.map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="35.5" r="1.5" fill={leds[i]} opacity="0.35" />
          <circle cx={x} cy="35.5" r="0.75" fill={leds[i]} />
          <circle cx={x - 0.25} cy="35.25" r="0.25" fill="#fff" opacity="0.8" />
        </g>
      ))}
    </>
  )
}

function WallAdapter({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}f`} stops={['#52525b', '#27272a', '#09090b']} />
        <V id={`${id}t`} stops={['#71717a', '#3f3f46']} />
        <V id={`${id}sd`} stops={['#3f3f46', '#18181b']} />
        <H id={`${id}p`} stops={STEEL_ROUND} />
        <V id={`${id}k`} stops={['#52525b', '#18181b']} />
        <V id={`${id}m`} stops={STEEL_ROUND} />
      </defs>
      <Shadow cx={24} y={43} rx={20} />
      {/* the cable and its round barrel plug */}
      <path d="M15.5 35.4C15.5 42.6 28.46 36.22 31.2 35" fill="none" stroke="#18181b" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 36.6C17 40.6 24 39.6 28 37" fill="none" stroke="#a1a1aa" strokeWidth="0.35" strokeLinecap="round" opacity="0.45" />
      <g transform="translate(31 35) rotate(-24)">
        <path d="M0 -1.2L3.4 -1.9V1.9L0 1.2Z" fill={url(`${id}k`)} />
        <rect x="3.2" y="-2.3" width="7.6" height="4.6" rx="0.9" fill={url(`${id}k`)} />
        <path d="M5 -2.3v4.6M6.2 -2.3v4.6M7.4 -2.3v4.6" stroke="#fff" strokeWidth="0.25" opacity="0.15" />
        <rect x="3.8" y="-1.8" width="6.4" height="0.6" rx="0.3" fill="#fff" opacity="0.25" />
        <rect x="10.6" y="-1.45" width="4.4" height="2.9" fill={url(`${id}m`)} />
        <ellipse cx="15" cy="0" rx="0.5" ry="1.45" fill="#a1a1aa" />
        <ellipse cx="15.05" cy="0" rx="0.28" ry="0.75" fill="#18181b" />
      </g>
      {/* the two round pins that go into the wall */}
      {[13.8, 20.8].map((x) => (
        <g key={x}>
          <rect x={x - 0.95} y="2.8" width="1.9" height="7.4" rx="0.95" fill={url(`${id}p`)} />
          <rect x={x - 1.05} y="7.2" width="2.1" height="3.2" rx="0.4" fill="#18181b" />
        </g>
      ))}
      {/* the brick */}
      <rect x="14.3" y="33.2" width="2.4" height="2.6" rx="0.6" fill={url(`${id}k`)} />
      <path d="M24.8 11.8L28.4 8.8V30.4L24.8 33.6Z" fill={url(`${id}sd`)} stroke="#52525b" strokeWidth="0.3" strokeLinejoin="round" />
      <path d="M6 11.8L9.6 8.8H28.4L24.8 11.8Z" fill={url(`${id}t`)} />
      {[13.8, 20.8].map((x) => (
        <ellipse key={x} cx={x} cy="10.3" rx="1.25" ry="0.55" fill="#09090b" />
      ))}
      <rect x="6" y="11.6" width="18.8" height="22" rx="0.8" fill={url(`${id}f`)} stroke="#71717a" strokeWidth="0.3" strokeOpacity="0.6" />
      <path d="M6.6 12.2H24.2" stroke="#fff" strokeWidth="0.4" strokeLinecap="round" opacity="0.35" />
      <path d="M6.6 12.6V32.8" stroke="#fff" strokeWidth="0.4" strokeLinecap="round" opacity="0.15" />
      <circle cx="9.4" cy="15" r="1.3" fill="#4ade80" opacity="0.35" />
      <circle cx="9.4" cy="15" r="0.65" fill="#4ade80" />
      {/* the label, with the sign that says which side of the plug is + */}
      <rect x="9.4" y="19" width="12" height="9.4" rx="0.8" fill="#000" opacity="0.25" stroke="#71717a" strokeWidth="0.25" />
      <g fill="none" stroke="#a1a1aa" strokeWidth="0.35" strokeLinecap="round">
        <path d="M11.2 23.4h1.6M14.8 25.3a1.7 1.7 0 1 0 -1.4 -2.7M15.4 23.4h1.6M17.8 23.4h1.4M18.5 22.7v1.4" />
      </g>
      <circle cx="14.4" cy="23.4" r="0.4" fill="#a1a1aa" />
      <rect x="11.2" y="20.4" width="6" height="0.5" rx="0.25" fill="#a1a1aa" opacity="0.6" />
      <rect x="11.2" y="26.2" width="8.4" height="0.5" rx="0.25" fill="#a1a1aa" opacity="0.5" />
    </>
  )
}

function Flux({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V
          id={`${id}g`}
          stops={[
            [0, '#ffffff', 0.85],
            [0.5, '#e0f2fe', 0.5],
            [1, '#94a3b8', 0.7],
          ]}
        />
        <V id={`${id}a`} stops={['#fde68a', '#f59e0b', '#b45309']} />
        <V id={`${id}c`} stops={['#e4e4e7', '#a1a1aa', '#71717a']} />
        <V id={`${id}k`} stops={['#52525b', '#18181b']} />
        <H id={`${id}t`} stops={STEEL_ROUND} />
        <R id={`${id}p`} stops={['#fef3c7', '#fbbf24', '#b45309']} />
      </defs>
      <Shadow cx={25} y={42.6} rx={20} />
      {/* a tin of flux paste */}
      <path d="M30 31V37.6A7.5 2.6 0 0 0 45 37.6V31Z" fill={url(`${id}t`)} />
      <path d="M30 33.2A7.5 2.6 0 0 0 45 33.2V35.6A7.5 2.6 0 0 1 30 35.6Z" fill="#f97316" />
      <path d="M30 33.2A7.5 2.6 0 0 0 45 33.2" fill="none" stroke="#fff" strokeWidth="0.3" opacity="0.4" />
      <ellipse cx="37.5" cy="31" rx="7.5" ry="2.6" fill="#d4d4d8" />
      <ellipse cx="37.5" cy="31.1" rx="6.6" ry="2.05" fill={url(`${id}p`)} />
      <path d="M33.8 31.1C35 30.2 38.4 30 40.2 30.8" fill="none" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
      {/* the flux pen: you can see the flux inside */}
      <g transform="translate(4.4 41.6) rotate(-40) scale(1.2)">
        <path d="M0.2 -0.5C0.2 -0.9 0.8 -1.2 1.4 -1.2H3.1V1.2H1.4C0.8 1.2 0.2 0.9 0.2 0.5Z" fill="#f5f5f4" stroke="#a8a29e" strokeWidth="0.2" />
        <path d="M0.2 -0.4C0.2 -0.8 0.6 -1 1 -1V1C0.6 1 0.2 0.8 0.2 0.4Z" fill="#f59e0b" opacity="0.7" />
        <rect x="2.9" y="-1.9" width="2.8" height="3.8" rx="0.5" fill={url(`${id}c`)} />
        <path d="M5.5 -1.9L8.2 -2.9V2.9L5.5 1.9Z" fill={url(`${id}g`)} stroke="#94a3b8" strokeWidth="0.25" />
        <rect x="8" y="-2.9" width="22" height="5.8" rx="1.2" fill={url(`${id}g`)} stroke="#94a3b8" strokeWidth="0.3" />
        <rect x="9" y="-1.9" width="19.4" height="3.9" rx="0.8" fill={url(`${id}a`)} opacity="0.9" />
        <circle cx="11.6" cy="-0.6" r="0.5" fill="#fff" opacity="0.7" />
        <circle cx="25.6" cy="0.6" r="0.35" fill="#fff" opacity="0.6" />
        <rect x="15" y="-2.95" width="7" height="5.9" fill="#fafafa" />
        <rect x="15" y="-2.95" width="7" height="1.4" fill="#2563eb" />
        <path d="M16.2 0.1h4.6M16.2 1.4h3.2" stroke="#a1a1aa" strokeWidth="0.4" strokeLinecap="round" />
        <rect x="8.6" y="-2.4" width="21" height="0.7" rx="0.35" fill="#fff" opacity="0.6" />
        <rect x="29.6" y="-2.4" width="2.6" height="4.8" rx="1" fill={url(`${id}k`)} />
      </g>
    </>
  )
}

function AlcoholBrush({ id }: ArtProps) {
  return (
    <>
      <defs>
        <H
          id={`${id}g`}
          stops={[
            [0, '#ffffff', 0.8],
            [0.35, '#e0f2fe', 0.45],
            [1, '#94a3b8', 0.65],
          ]}
        />
        <V
          id={`${id}l`}
          stops={[
            [0, '#bae6fd', 0.6],
            [1, '#38bdf8', 0.6],
          ]}
        />
        <V id={`${id}p`} stops={['#fafafa', '#d4d4d8', '#a1a1aa']} />
        <H id={`${id}h`} stops={['#fca5a5', '#dc2626', '#7f1d1d']} />
        <H id={`${id}m`} stops={STEEL_ROUND} />
        <H id={`${id}b`} stops={['#efe2c4', '#c4a574', '#8b6b3d']} />
      </defs>
      <Shadow cx={24} y={42.6} rx={20} />
      {/* a small brush with stiff bristles */}
      <g transform="translate(42.5 4.6) rotate(20)">
        <rect x="-1.8" y="0" width="3.6" height="24" rx="1.8" fill={url(`${id}h`)} />
        <circle cx="0" cy="3" r="0.85" fill="#450a0a" />
        <rect x="-1.05" y="5.4" width="0.7" height="16.6" rx="0.35" fill="#fff" opacity="0.35" />
        <rect x="-2.1" y="23.4" width="4.2" height="4.2" rx="0.4" fill={url(`${id}m`)} />
        <path d="M-2.1 24.6h4.2M-2.1 26.4h4.2" stroke="#52525b" strokeWidth="0.3" />
        <path d="M-2 27.4L-3 36.4H3L2 27.4Z" fill={url(`${id}b`)} />
        {Array.from({ length: 9 }, (_, i) => {
          const f = (i - 4) / 4
          return <path key={i} d={`M${r2(f * 1.8)} 27.8L${r2(f * 2.7)} 36.2`} stroke="#78350f" strokeWidth="0.2" opacity="0.5" />
        })}
      </g>
      {/* the pump bottle of alcohol */}
      <ellipse cx="15" cy="10.3" rx="8.4" ry="2.3" fill="#a1a1aa" />
      <ellipse cx="15" cy="9.6" rx="8.4" ry="2.3" fill="#e4e4e7" stroke="#a1a1aa" strokeWidth="0.3" />
      <ellipse cx="15" cy="9.6" rx="6.9" ry="1.6" fill="#a1a1aa" opacity="0.45" />
      <ellipse cx="15" cy="9.4" rx="2.4" ry="0.8" fill="#71717a" />
      <rect x="10.4" y="10.6" width="9.2" height="3.2" rx="0.8" fill={url(`${id}p`)} />
      <path d="M7.6 15.6C8.4 13.8 9.8 13.2 11 13.2H19C20.2 13.2 21.6 13.8 22.4 15.6Z" fill={url(`${id}g`)} stroke="#94a3b8" strokeWidth="0.3" />
      <rect x="5.5" y="15" width="19" height="26.5" rx="3" fill={url(`${id}g`)} stroke="#94a3b8" strokeWidth="0.35" />
      <rect x="6.3" y="21" width="17.4" height="19.8" rx="2.4" fill={url(`${id}l`)} />
      <path d="M6.6 21.1H23.4" stroke="#fff" strokeWidth="0.5" opacity="0.7" />
      {/* the label, with the "catches fire easily" sign */}
      <rect x="5.6" y="25.4" width="18.8" height="10.6" fill="#fafafa" />
      <rect x="5.6" y="25.4" width="18.8" height="1.6" fill="#2563eb" />
      <path d="M10.4 28.3L13.3 31.2L10.4 34.1L7.5 31.2Z" fill="#fff" stroke="#dc2626" strokeWidth="0.55" strokeLinejoin="round" />
      <path
        d="M10.4 33C9.4 33 8.9 32.2 9.3 31.3C9.6 30.7 9.9 30.3 9.8 29.6C10.8 30 11.6 30.9 11.5 31.8C11.8 31.6 11.9 31.3 11.9 31C12.3 31.9 11.7 33 10.4 33Z"
        fill="#18181b"
      />
      <rect x="15" y="28.6" width="7.4" height="1.1" rx="0.3" fill="#1e3a8a" />
      <rect x="15" y="30.8" width="6" height="0.6" rx="0.3" fill="#a1a1aa" />
      <rect x="15" y="32.4" width="6.8" height="0.6" rx="0.3" fill="#a1a1aa" />
      <rect x="6.6" y="16.4" width="1.1" height="23.4" rx="0.55" fill="#fff" opacity="0.55" />
    </>
  )
}

function HotAir({ id }: ArtProps) {
  const loops = Array.from({ length: 7 }, (_, i) => ({ x: r2(29.8 + i * 2), y: r2(34.2 + i * 0.55) }))
  return (
    <>
      <defs>
        <V id={`${id}c`} stops={['#e4e4e7', '#a1a1aa', '#71717a']} />
        <V id={`${id}t`} stops={['#fafafa', '#d4d4d8']} />
        <V id={`${id}p`} stops={['#3f3f46', '#18181b']} />
        <R id={`${id}k`} stops={['#a1a1aa', '#3f3f46', '#18181b']} />
        <H id={`${id}n`} stops={STEEL_ROUND} />
        <H id={`${id}g`} stops={['#71717a', '#27272a', '#09090b']} />
        <H id={`${id}s`} stops={STEEL} />
        <radialGradient id={`${id}glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fdba74" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow cx={25} y={42.4} rx={21} />
      {/* the station: temperature screen, air and heat knobs, power switch */}
      <rect x="5" y="39.4" width="4.4" height="1.8" rx="0.7" fill="#3f3f46" />
      <rect x="22.6" y="39.4" width="4.4" height="1.8" rx="0.7" fill="#3f3f46" />
      <path d="M4.6 19.2L7.4 16.4H26.2L28.4 19.2Z" fill={url(`${id}t`)} />
      <rect x="3.4" y="19" width="25.4" height="21" rx="1.8" fill={url(`${id}c`)} />
      <rect x="4.6" y="19.5" width="23" height="0.7" rx="0.35" fill="#fff" opacity="0.6" />
      <rect x="5" y="21" width="22.2" height="17.4" rx="1.2" fill={url(`${id}p`)} />
      <rect x="6.2" y="22.2" width="13.6" height="7.4" rx="0.6" fill="#0a0a0a" />
      <Readout x={7.2} y={23.4} value="350" w={3.2} h={5} t={0.8} gap={1} on="#ef4444" off="#ef444420" />
      <rect x="21.4" y="22.2" width="4.4" height="3.3" rx="0.6" fill="#52525b" />
      <path d="M22.6 24.5l1-1.3 1 1.3z" fill="#e4e4e7" />
      <rect x="21.4" y="26.3" width="4.4" height="3.3" rx="0.6" fill="#52525b" />
      <path d="M22.6 27.3l1 1.3 1-1.3z" fill="#e4e4e7" />
      {[9.8, 17.2].map((x) => (
        <g key={x}>
          <circle cx={x} cy="33.6" r="3" fill="#09090b" />
          <circle cx={x} cy="33.6" r="2.5" fill={url(`${id}k`)} />
          <path d={`M${x} 33.6l-1.3-1.6`} stroke="#fff" strokeWidth="0.6" strokeLinecap="round" />
        </g>
      ))}
      <rect x="21.8" y="31.2" width="4" height="4.8" rx="0.6" fill="#09090b" />
      <path d="M22.3 31.7H25.3V33.6H22.3Z" fill="#ef4444" />
      <path d="M22.3 33.6H25.3V35.5H22.3Z" fill="#7f1d1d" />
      {/* the stand the hot handle rests in */}
      <path d="M34.6 41.2C34.6 40 35.4 39.2 36.6 39.2H44.4C45.6 39.2 46.4 40 46.4 41.2Z" fill={url(`${id}p`)} />
      <rect x="37.7" y="27.3" width="1.6" height="12.3" fill={url(`${id}s`)} />
      {/* the curly hose */}
      <g fill="none" strokeLinecap="round">
        {loops.map((l, i) => (
          <g key={i} transform={`rotate(-14 ${l.x} ${l.y})`}>
            <ellipse cx={l.x} cy={l.y} rx="1.2" ry="2.5" stroke="#27272a" strokeWidth="0.85" />
            <path d={`M${r2(l.x - 1.2)} ${l.y}A1.2 2.5 0 0 0 ${r2(l.x + 1.2)} ${l.y}`} stroke="#71717a" strokeWidth="0.35" />
          </g>
        ))}
      </g>
      <path d="M34.85 26.63A3.6 1.2 0 0 1 42.05 26.63" fill="none" stroke="#a1a1aa" strokeWidth="0.9" transform="rotate(-25 38.45 26.63)" />
      {/* the handle: hot air blows out of the metal nozzle */}
      <g transform="translate(30 8.5) rotate(-25)">
        <circle cx="0" cy="-0.4" r="2.8" fill={url(`${id}glow`)} />
        <path
          d="M-2.2 -1c-.9-1 .9-2 0-3s.9-2 0-3M0 -1.4c-.9-1 .9-2 0-3s.9-2 0-3M2.2 -1c-.9-1 .9-2 0-3s.9-2 0-3"
          fill="none"
          stroke="#f97316"
          strokeWidth="0.7"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path d="M-0.75 0H0.75L1.35 4H-1.35Z" fill={url(`${id}n`)} />
        <rect x="-1.75" y="3.8" width="3.5" height="9.2" fill={url(`${id}n`)} />
        <rect x="-1.75" y="3.8" width="3.5" height="2.4" fill="#b45309" opacity="0.35" />
        <rect x="-1.75" y="6.2" width="3.5" height="1.4" fill="#6366f1" opacity="0.2" />
        <rect x="-2.4" y="12.8" width="4.8" height="2" rx="0.6" fill="#27272a" />
        <rect x="-2.9" y="14.6" width="5.8" height="15.8" rx="2.4" fill={url(`${id}g`)} />
        <rect x="-2.9" y="15.6" width="5.8" height="1.4" fill="#f97316" />
        <rect x="-1.9" y="17.6" width="0.9" height="11.4" rx="0.45" fill="#fff" opacity="0.25" />
        <path d="M-2.9 21h5.8M-2.9 22.4h5.8M-2.9 23.8h5.8" stroke="#000" strokeWidth="0.3" opacity="0.3" />
        <rect x="-1.7" y="30.2" width="3.4" height="2.6" rx="0.8" fill="#18181b" />
      </g>
      <path d="M34.85 26.63A3.6 1.2 0 0 0 42.05 26.63" fill="none" stroke="#d4d4d8" strokeWidth="0.9" transform="rotate(-25 38.45 26.63)" />
    </>
  )
}

export { CoinCells, Charger, WallAdapter, Flux, AlcoholBrush, HotAir }
