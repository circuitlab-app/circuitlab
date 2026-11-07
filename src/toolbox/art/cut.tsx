import { H, R, Shadow, V } from './kit'
import { r2, STEEL, STEEL_ROUND, url, type ArtProps, type Stop } from './palette'

/* ───────────────────────── Cut and hold: the newer tools ───────────────────────── */

function CuttingMat({ id }: ArtProps) {
  // the mat lies flat and slightly away from us: rows get a little closer towards the back
  const top = 11
  const depth = 24.5
  const yAt = (v: number) => top + depth * v * (0.78 + 0.22 * v)
  const at = (u: number, v: number): [number, number] => {
    const g = (yAt(v) - top) / depth
    const left = 8 - 5 * g
    const right = 40 + 5 * g
    return [r2(left + (right - left) * u), r2(yAt(v))]
  }
  const line = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('')
  const span = (from: [number, number], to: [number, number], n = 6) =>
    line(Array.from({ length: n + 1 }, (_, i) => at(from[0] + ((to[0] - from[0]) * i) / n, from[1] + ((to[1] - from[1]) * i) / n)))
  const u0 = 0.05
  const u1 = 0.95
  const v0 = 0.07
  const v1 = 0.93
  const cols = 16
  const rows = 10
  const cu = (i: number) => u0 + ((u1 - u0) * i) / cols
  const cv = (j: number) => v0 + ((v1 - v0) * j) / rows
  const mat = 'M3.4 34.6L7.6 11.8C7.7 11.3 8 11 8.6 11H39.4C40 11 40.3 11.3 40.4 11.8L44.6 34.6C44.8 35.3 44.4 35.6 43.6 35.6H4.4C3.6 35.6 3.2 35.3 3.4 34.6Z'
  return (
    <>
      <defs>
        <V id={`${id}m`} stops={['#22a35a', '#15803d', '#14532d']} />
        <V id={`${id}r`} stops={STEEL} />
      </defs>
      <Shadow y={39} rx={22} />
      <path d={mat} fill="#0f3d22" transform="translate(0 1.3)" />
      <path d={mat} fill={url(`${id}m`)} />
      {/* the printed grid: thin lines, with a bolder one every fourth */}
      <g fill="none" stroke="#dcfce7" strokeLinecap="round">
        {Array.from({ length: cols + 1 }, (_, i) => (
          <path key={`c${i}`} d={span([cu(i), v0], [cu(i), v1], 1)} strokeWidth={i % 4 ? 0.18 : 0.32} opacity={i % 4 ? 0.28 : 0.6} />
        ))}
        {Array.from({ length: rows + 1 }, (_, j) => (
          <path key={`r${j}`} d={span([u0, cv(j)], [u1, cv(j)], 1)} strokeWidth={j % 5 ? 0.18 : 0.32} opacity={j % 5 ? 0.28 : 0.6} />
        ))}
      </g>
      {/* angle lines for cutting at 30, 45 and 60 degrees */}
      <g fill="none" stroke="#fde047" strokeWidth="0.3" opacity="0.75">
        <path d={span([u0, v1], [u0 + (u1 - u0) * (10 / 16), v0])} />
        <path d={span([u0, v1], [u0 + (u1 - u0) * (5.77 / 16), v0])} />
        <path d={span([u0, v1], [u1, v1 - (v1 - v0) * 0.92])} />
      </g>
      {/* little ticks along the front edge */}
      <g stroke="#dcfce7" strokeWidth="0.25" opacity="0.7">
        {Array.from({ length: cols * 2 + 1 }, (_, i) => {
          const u = u0 + ((u1 - u0) * i) / (cols * 2)
          return <path key={i} d={span([u, 0.955], [u, i % 2 ? 0.975 : 0.995], 1)} />
        })}
      </g>
      <path d="M8.8 11.6H39.2" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" opacity="0.35" />
      {/* a steel ruler lying across the mat */}
      <g transform="translate(11.4 30.8) rotate(-24)">
        <rect x="0.7" y="0.9" width="31" height="4" rx="0.5" fill="#000" opacity="0.28" />
        <rect x="0" y="0" width="31" height="4" rx="0.5" fill={url(`${id}r`)} stroke="#71717a" strokeWidth="0.2" />
        <path
          d={Array.from({ length: 29 }, (_, i) => `M${1 + i} 0v${i % 10 === 0 ? 2.2 : i % 5 === 0 ? 1.6 : 0.9}`).join('')}
          stroke="#3f3f46"
          strokeWidth="0.2"
        />
        <rect x="0.6" y="3.1" width="29.6" height="0.4" rx="0.2" fill="#fff" opacity="0.6" />
        <circle cx="29.4" cy="2" r="0.75" fill="#52525b" stroke="#e4e4e7" strokeWidth="0.2" />
      </g>
    </>
  )
}

function HobbyKnife({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}b`} stops={['#ffffff', '#e4e4e7', '#a1a1aa']} />
        <V id={`${id}c`} stops={STEEL_ROUND} />
        <V id={`${id}h`} stops={['#a1a1aa', '#f4f4f5', '#d4d4d8', '#71717a']} />
        <V id={`${id}o`} stops={['#fdba74', '#f97316', '#c2410c']} />
        <pattern id={`${id}k`} width="1.1" height="1.1" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0.55H1.1M0.55 0V1.1" stroke="#27272a" strokeWidth="0.22" opacity="0.55" />
        </pattern>
      </defs>
      <Shadow y={41} rx={17} />
      <g transform="rotate(-35 24 24)">
        {/* the safety cap, lying next to the knife */}
        <path d="M20 30.8H30.4A2.3 2.3 0 0 1 30.4 35.4H20Z" fill={url(`${id}o`)} />
        <ellipse cx="20" cy="33.1" rx="0.85" ry="2.3" fill="#7c2d12" />
        <ellipse cx="20" cy="33.1" rx="0.45" ry="1.6" fill="#431407" />
        <path d="M21 31.6H30.2" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" opacity="0.5" />
        <path d="M26.8 30.8V35.4" stroke="#9a3412" strokeWidth="0.3" opacity="0.6" />
        {/* the sharp angled blade */}
        <path d="M2.6 23.3L11.2 22.9V25.1H8.4Z" fill={url(`${id}b`)} stroke="#71717a" strokeWidth="0.2" strokeLinejoin="round" />
        <path d="M3.2 23.6L8.4 24.9" stroke="#fff" strokeWidth="0.35" strokeLinecap="round" />
        {/* the collet that grips it, and its nut */}
        <path d="M10.4 22.5L15.6 21.4V26.6L10.4 25.5Z" fill={url(`${id}c`)} />
        <path d="M11 24H15.2" stroke="#3f3f46" strokeWidth="0.3" />
        <rect x="15.4" y="20.8" width="3.2" height="6.4" rx="0.7" fill={url(`${id}c`)} />
        <path d="M16.2 21v6M17 21v6M17.8 21v6" stroke="#52525b" strokeWidth="0.25" />
        {/* the aluminium handle with its rough grip */}
        <path d="M18.4 21H41A3 3 0 0 1 41 27H18.4Z" fill={url(`${id}h`)} />
        <rect x="19.4" y="21" width="12.6" height="6" fill={url(`${id}k`)} />
        <rect x="37.6" y="21" width="1.4" height="6" fill="#2563eb" />
        <rect x="37.6" y="21" width="1.4" height="6" fill="#000" opacity="0.15" />
        <path d="M19 22.1H42.2" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.55" />
      </g>
    </>
  )
}

function MiniSaw({ id }: ArtProps) {
  const teeth = Array.from({ length: 35 }, () => 'l0.62 0.95l0.28 -0.95').join('')
  return (
    <>
      <defs>
        <V id={`${id}b`} stops={STEEL} />
        <H id={`${id}g`} stops={['#52525b', '#27272a', '#09090b']} />
        <V id={`${id}m`} stops={STEEL_ROUND} />
      </defs>
      <Shadow cx={25} y={41.6} rx={19} />
      {/* the blade with its fine teeth */}
      <path d={`M6.8 30.4${teeth}V30.4Z`} fill="#a1a1aa" stroke="#71717a" strokeWidth="0.15" strokeLinejoin="round" />
      <rect x="6.6" y="28.3" width="31.6" height="2.3" fill={url(`${id}b`)} />
      <path d="M7 28.8H38" stroke="#fff" strokeWidth="0.45" opacity="0.7" />
      {/* the bent steel frame, painted orange */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.6 29.4C6.6 23 7 14 13.4 12.6H31.5C36.4 12.6 37.6 16.6 37.4 21L37 29.4" stroke="#9a3412" strokeWidth="2.4" transform="translate(0.35 0.45)" />
        <path d="M7.6 29.4C6.6 23 7 14 13.4 12.6H31.5C36.4 12.6 37.6 16.6 37.4 21L37 29.4" stroke="#f97316" strokeWidth="2.3" />
        <path d="M7 27.4C6.4 22 7 15 12.8 12.1M15 11.95H31.4" stroke="#fed7aa" strokeWidth="0.55" opacity="0.85" />
      </g>
      {/* the pins that hold the blade tight */}
      {[7.6, 37].map((x) => (
        <g key={x}>
          <rect x={x - 1.3} y="27.7" width="2.6" height="3.4" rx="0.6" fill={url(`${id}m`)} />
          <circle cx={x} cy="29.4" r="0.6" fill="#3f3f46" />
        </g>
      ))}
      {/* the grip */}
      <path
        d="M35.4 24.4C37.4 23.2 39.6 23.8 40.5 25.7L45.4 36.4C46.2 38.2 45.4 39.8 43.6 40.1C42.2 40.4 41.1 39.7 40.5 38.5L35.1 27.6C34.5 26.4 34.6 25 35.4 24.4Z"
        fill={url(`${id}g`)}
      />
      <path d="M36.2 25.2C37.4 24.6 38.6 24.8 39.4 26L43.6 35.6" fill="none" stroke="#a1a1aa" strokeWidth="0.55" strokeLinecap="round" opacity="0.55" />
      <path d="M39.9 31.5l1.9-.9M41 33.9l1.9-.9M42.1 36.3l1.9-.9" stroke="#000" strokeWidth="0.4" strokeLinecap="round" opacity="0.5" />
    </>
  )
}

/** A needle file standing up, tip at the top; it is turned into place by its caller. */
function NeedleFile({ id, blade, cut, handle, edge }: { id: string; blade: string; cut: string; handle: string; edge?: boolean }) {
  return (
    <g>
      <rect x="21.9" y="29.4" width="4.2" height="13" rx="2.1" fill={handle} />
      <rect x="22.6" y="30.4" width="0.7" height="10.4" rx="0.35" fill="#fff" opacity="0.35" />
      <rect x="22.1" y="28.8" width="3.8" height="1.3" rx="0.5" fill="#000" opacity="0.25" />
      <rect x="23.2" y="26.2" width="1.6" height="3.4" fill={url(`${id}s`)} />
      <path d={blade} fill={url(`${id}m`)} />
      <path d={blade} fill={cut} />
      <path d={blade} fill="none" stroke="#52525b" strokeWidth="0.18" strokeLinejoin="round" />
      {edge && <path d="M23.65 9.2L23.35 26.4" stroke="#fff" strokeWidth="0.3" opacity="0.55" />}
    </g>
  )
}

function NeedleFiles({ id }: ArtProps) {
  return (
    <>
      <defs>
        <H id={`${id}m`} stops={['#f4f4f5', '#d4d4d8', '#a1a1aa', '#71717a']} />
        <H id={`${id}s`} stops={STEEL_ROUND} />
        <H id={`${id}r`} stops={['#fca5a5', '#dc2626', '#7f1d1d']} />
        <H id={`${id}y`} stops={['#fef08a', '#eab308', '#854d0e']} />
        <H id={`${id}b`} stops={['#7dd3fc', '#0284c7', '#0c4a6e']} />
        {/* the rough steel: criss-cross teeth, and single-cut teeth on the round file */}
        <pattern id={`${id}x`} width="0.95" height="0.95" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <path d="M0 0.47H0.95M0.47 0V0.95" stroke="#3f3f46" strokeWidth="0.2" opacity="0.6" />
        </pattern>
        <pattern id={`${id}o`} width="0.9" height="0.9" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)">
          <path d="M0 0.45H0.9" stroke="#3f3f46" strokeWidth="0.22" opacity="0.6" />
        </pattern>
      </defs>
      <Shadow y={43.2} rx={15} />
      {/* flat */}
      <g transform="rotate(-22 24 52)">
        <NeedleFile id={id} blade="M22.4 26.6L22.8 9L24 6.4L25.2 9L25.6 26.6Z" cut={url(`${id}x`)} handle={url(`${id}r`)} />
      </g>
      {/* half-round */}
      <g transform="rotate(22 24 52)">
        <NeedleFile id={id} blade="M22.3 26.6L22.9 9L24 6.2L25.1 9L25.7 26.6Z" cut={url(`${id}x`)} handle={url(`${id}b`)} edge />
      </g>
      {/* round */}
      <g>
        <NeedleFile id={id} blade="M23 26.6L23.55 9.8Q24 5 24.45 9.8L25 26.6Z" cut={url(`${id}o`)} handle={url(`${id}y`)} />
      </g>
    </>
  )
}

function HandDrill({ id }: ArtProps) {
  const body = 'M16.6 19.6C22 18.2 34 18 39.6 18.8C41.8 19.1 42.8 21 42.8 24C42.8 27 41.8 28.9 39.6 29.2C34 30 22 29.8 16.6 28.4Z'
  const gold: Stop[] = ['#fde68a', '#d4a017', '#92400e']
  return (
    <>
      <defs>
        <V id={`${id}b`} stops={['#94a3b8', '#475569', '#1e293b']} />
        <V id={`${id}n`} stops={['#52525b', '#27272a', '#09090b']} />
        <V id={`${id}m`} stops={STEEL_ROUND} />
        <V id={`${id}o`} stops={['#fdba74', '#f97316', '#c2410c']} />
        <V id={`${id}t`} stops={gold} />
        <R id={`${id}s`} stops={['#fed7aa', '#fb923c', '#c2410c']} />
        <clipPath id={`${id}c`}>
          <path d={body} />
        </clipPath>
      </defs>
      <Shadow cx={25} y={42} rx={19} />
      {/* two spare bits: a drill and a grinding stone */}
      <rect x="33.6" y="36.4" width="8.6" height="1.1" rx="0.3" fill={url(`${id}m`)} />
      <path d="M28 36.95L29.2 36.3H33.8V37.6H29.2Z" fill={url(`${id}t`)} />
      <path d="M29.6 36.35l.7 1.2M30.8 36.35l.7 1.2M32 36.35l.7 1.2M33.1 36.35l.6 1.1" stroke="#78350f" strokeWidth="0.25" />
      <rect x="31.4" y="39.5" width="10" height="1" rx="0.3" fill={url(`${id}m`)} />
      <rect x="26.6" y="38.1" width="5.2" height="3.8" rx="1.3" fill={url(`${id}s`)} />
      {[
        [27.8, 39.2],
        [29.6, 40.6],
        [30.6, 38.9],
        [28.6, 40.9],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="0.22" fill="#7c2d12" opacity="0.6" />
      ))}
      <g transform="rotate(-26 24 24)">
        {/* the cord at the back */}
        <path d="M43.4 24C45.4 24 46.2 25.6 46.8 27.6" fill="none" stroke="#27272a" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="41.8" y="22.6" width="2.4" height="2.8" rx="0.8" fill="#3f3f46" />
        {/* the body: an orange band, air slots and the speed wheel */}
        <path d={body} fill={url(`${id}b`)} />
        <g clipPath={url(`${id}c`)}>
          <rect x="24.6" y="17" width="2.2" height="14" fill={url(`${id}o`)} />
          {[30.6, 32.1, 33.6, 35.1, 36.6].map((x) => (
            <rect key={x} x={x} y="20.6" width="0.75" height="4.4" rx="0.37" fill="#0b1220" transform={`rotate(14 ${x} 22.8)`} />
          ))}
        </g>
        <path d="M18 19.8C26 18.9 34 18.8 39.4 19.6" fill="none" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.4" />
        <path d="M35.2 18.9C35.2 17.2 35.9 16.5 36.9 16.5C37.9 16.5 38.6 17.2 38.6 18.9Z" fill={url(`${id}o`)} />
        <path d="M35.9 17V18.9M36.6 16.6V18.9M37.3 16.6V18.9M38 17V18.9" stroke="#9a3412" strokeWidth="0.25" />
        {[32.4, 33.4, 34.4].map((x, i) => (
          <circle key={x} cx={x} cy={r2(19.4 - i * 0.05)} r={r2(0.18 + i * 0.07)} fill="#fff" opacity="0.8" />
        ))}
        {/* on/off switch */}
        <rect x="19.6" y="18.5" width="4.2" height="1.5" rx="0.6" fill="#18181b" />
        <rect x="20" y="18.7" width="1.8" height="1" rx="0.4" fill="#a1a1aa" />
        {/* the rubber nose and the lock button */}
        <path d="M12.2 21.2L16.8 19.6V28.4L12.2 26.8Z" fill={url(`${id}n`)} />
        <path d="M13.6 20.8V27.2M15 20.3V27.7" stroke="#71717a" strokeWidth="0.25" opacity="0.6" />
        <rect x="13.4" y="19.7" width="2" height="1.1" rx="0.5" fill="#a1a1aa" />
        {/* the collet nut and a small drill bit */}
        <rect x="9.2" y="22" width="3.2" height="4" rx="0.5" fill={url(`${id}m`)} />
        <path d="M10.2 22v4M11.4 22v4" stroke="#52525b" strokeWidth="0.2" />
        <rect x="5" y="23.45" width="4.4" height="1.1" fill={url(`${id}m`)} />
        <path d="M1.8 24L3 23.35H5.3V24.65H3Z" fill={url(`${id}t`)} />
        <path d="M2.9 23.45l.7 1.1M3.9 23.4l.7 1.2M4.7 23.4l.6 1.1" stroke="#78350f" strokeWidth="0.22" />
      </g>
    </>
  )
}

function PcbVise({ id }: ArtProps) {
  const jaw = (x: number, flip: boolean) => {
    // a jaw post with a notch in its inner face; the board's edge slides into the notch
    const inner = flip ? x : x + 5.8
    const outer = flip ? x + 5.8 : x
    const s = flip ? 1 : -1
    return `M${outer} 31.6V14.6Q${outer} 12.4 ${r2(outer - s * 2.2)} 12.4H${r2(inner + s * 1.6)}Q${inner} 12.4 ${inner} 14.2V19.6L${r2(inner + s * 1.4)} 20.8V21.8L${inner} 23V31.6Z`
  }
  return (
    <>
      <defs>
        <V id={`${id}base`} stops={['#52525b', '#27272a', '#09090b']} />
        <H id={`${id}j`} stops={['#fafafa', '#d4d4d8', '#a1a1aa']} />
        <V id={`${id}rod`} stops={STEEL_ROUND} />
        <V id={`${id}k`} stops={['#fca5a5', '#dc2626', '#7f1d1d']} />
        <V id={`${id}p`} stops={['#4ade80', '#16a34a']} />
        <V id={`${id}m`} stops={STEEL} />
      </defs>
      <Shadow y={42} rx={21} />
      {/* the heavy base and the rail the jaws slide on */}
      <path d="M4.6 39.4L6.8 33.4H41.2L43.4 39.4Q43.6 40.4 42.6 40.4H5.4Q4.4 40.4 4.6 39.4Z" fill={url(`${id}base`)} />
      <path d="M6.8 33.4H41.2L41.8 35H6.2Z" fill="#71717a" opacity="0.6" />
      <path d="M7.4 33.8H40.6" stroke="#fff" strokeWidth="0.4" opacity="0.35" />
      <rect x="5.2" y="29.4" width="38" height="2.6" rx="1.3" fill={url(`${id}rod`)} />
      {/* the screw that moves the right jaw, and its knob */}
      <rect x="40" y="24.2" width="3.6" height="1.8" fill={url(`${id}m`)} />
      <path d="M40.6 24.2l-.5 1.8M41.4 24.2l-.5 1.8M42.2 24.2l-.5 1.8M43 24.2l-.5 1.8" stroke="#52525b" strokeWidth="0.25" />
      <rect x="42.6" y="20.2" width="4" height="9.8" rx="1.3" fill={url(`${id}k`)} />
      <path d="M42.9 21.8H46.3M42.9 23.2H46.3M42.9 24.6H46.3M42.9 26H46.3M42.9 27.4H46.3M42.9 28.8H46.3" stroke="#7f1d1d" strokeWidth="0.3" opacity="0.7" />
      <rect x="43.2" y="20.6" width="2.8" height="0.6" rx="0.3" fill="#fff" opacity="0.5" />
      {/* the two jaws */}
      {[
        [7.2, false],
        [34.8, true],
      ].map(([x, flip]) => (
        <g key={String(x)}>
          <rect x={(x as number) - 0.6} y="28.4" width="7" height="5" rx="0.8" fill="#3f3f46" />
          <path d={jaw(x as number, flip as boolean)} fill={url(`${id}j`)} stroke="#a1a1aa" strokeWidth="0.25" strokeLinejoin="round" />
          <rect x={(x as number) + 0.6} y="13.4" width="0.6" height="14" rx="0.3" fill="#fff" opacity="0.6" />
          <rect x={(x as number) + 1.4} y="9.6" width="3" height="2.9" rx="0.7" fill="#27272a" />
          <rect x={(x as number) + 1.8} y="9.9" width="2.2" height="0.5" rx="0.25" fill="#fff" opacity="0.25" />
        </g>
      ))}
      {/* the green board held between them */}
      <path d="M12.4 21.2H35.6L34.6 17.6H13.4Z" fill={url(`${id}p`)} />
      <rect x="12.4" y="21.2" width="23.2" height="1" fill="#14532d" />
      <path d="M13.8 18.1H34.2" stroke="#fff" strokeWidth="0.3" opacity="0.4" />
      <path d="M20.6 18.6H26.6L26.9 20.6H20.3Z" fill="#18181b" />
      <path d="M21 18.6v-.4M22.2 18.6v-.4M23.4 18.6v-.4M24.6 18.6v-.4M25.8 18.6v-.4" stroke="#d4d4d8" strokeWidth="0.3" />
      {[15, 16.6, 18.2, 29.4, 31, 32.6].map((x) => (
        <ellipse key={x} cx={x} cy="20.2" rx="0.55" ry="0.4" fill="#fbbf24" />
      ))}
      <rect x="30.2" y="14.8" width="2.4" height="3.6" rx="1.2" fill="#ef4444" />
      <rect x="30.6" y="15.3" width="0.6" height="2.4" rx="0.3" fill="#fff" opacity="0.6" />
    </>
  )
}

export { CuttingMat, HobbyKnife, MiniSaw, NeedleFiles, HandDrill, PcbVise }
