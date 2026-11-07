import { Clip, H, R, Shadow, V } from './kit'
import { STEEL, url, type ArtProps, type Stop } from './palette'

/* ───────────────────────── Stay safe: the newer tools ───────────────────────── */

const FINGERS = [
  { x: -5.1, len: 8.6, a: -10 },
  { x: -1.6, len: 10, a: -3 },
  { x: 1.9, len: 9.2, a: 4 },
  { x: 5.3, len: 7, a: 11 },
]

/** The fingers, thumb and palm of a glove pointing up, the cuff's bottom edge centred on (0, 0). */
function GloveShape({ fill, stroke }: { fill: string; stroke?: string }) {
  return (
    <g fill={fill} stroke={stroke} strokeWidth={stroke ? 1 : undefined}>
      {FINGERS.map((f) => (
        <rect
          key={f.x}
          x={f.x - 1.7}
          y={-20 - f.len}
          width="3.4"
          height={f.len + 3}
          rx="1.7"
          transform={`rotate(${f.a} ${f.x} -19)`}
        />
      ))}
      <rect x="-8.5" y="-21" width="3.8" height="10.5" rx="1.9" transform="rotate(-46 -6.6 -11.5)" />
      <path d="M-7 -6.5L-7.5 -18C-7.5 -20.4 -5.6 -21.8 -3.2 -21.8H3.4C5.8 -21.8 7.5 -20.4 7.5 -18L7 -6.5Z" />
    </g>
  )
}

/** A knit work glove with a ribbed cuff; `dots` adds the grippy rubber dots on the palm. */
function Glove({ id, knit, cuff, dots }: { id: string; knit: string; cuff: string; dots?: boolean }) {
  return (
    <g>
      {/* drawn twice: a dark pass whose outer edge stays as the outline, then the knit on top */}
      <GloveShape fill="#3f3f46" stroke="#3f3f46" />
      <GloveShape fill={url(knit)} />
      <GloveShape fill={url(`${id}t`)} />
      {dots &&
        Array.from({ length: 4 }, (_, row) =>
          Array.from({ length: 5 }, (_, col) => (
            <circle key={`${row}${col}`} cx={-4.6 + col * 2.3 + (row % 2) * 1.15 - 0.6} cy={-17.4 + row * 2.5} r="0.5" fill="#1d4ed8" opacity="0.85" />
          )),
        )}
      {FINGERS.map((f) => (
        <path
          key={f.x}
          d={`M${f.x - 0.85} ${-18.2 - f.len}V${-21}`}
          stroke="#fff"
          strokeWidth="0.45"
          strokeLinecap="round"
          opacity="0.45"
          transform={`rotate(${f.a} ${f.x} -19)`}
        />
      ))}
      <path d="M-6 -19.6C-2 -20.6 2 -20.6 6.2 -19.6" fill="none" stroke="#000" strokeWidth="0.35" opacity="0.25" />
      <rect x="-7.8" y="-7.4" width="15.6" height="7.4" rx="1.3" fill={url(cuff)} stroke="#3f3f46" strokeWidth="0.5" />
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} d={`M${-6.3 + i * 1.4} -6.8V-0.6`} stroke="#000" strokeWidth="0.35" opacity="0.2" />
      ))}
      <path d="M-6.8 -6.6H6.8" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" opacity="0.45" />
    </g>
  )
}

function Gloves({ id }: ArtProps) {
  const knit = (key: string, top: string, bottom: string) => (
    <linearGradient id={`${id}${key}`} gradientUnits="userSpaceOnUse" x1="-6" y1="-31" x2="5" y2="0">
      <stop offset="0" stopColor={top} />
      <stop offset="1" stopColor={bottom} />
    </linearGradient>
  )
  return (
    <>
      <defs>
        {knit('kb', '#c4c4cc', '#6f6f7a')}
        {knit('kf', '#ececef', '#9ca3af')}
        <V id={`${id}cb`} stops={['#f59e0b', '#c2410c', '#7c2d12']} />
        <V id={`${id}cf`} stops={['#fdba74', '#f97316', '#c2410c']} />
        <pattern id={`${id}t`} width="1.2" height="1" patternUnits="userSpaceOnUse">
          <path d="M0 0.25L0.6 0.75L1.2 0.25" fill="none" stroke="#000" strokeWidth="0.22" opacity="0.2" />
        </pattern>
      </defs>
      <Shadow y={42.4} rx={19} />
      <g transform="translate(17.5 39) rotate(-16) scale(-1 1)">
        <Glove id={id} knit={`${id}kb`} cuff={`${id}cb`} />
      </g>
      <g transform="translate(31 40.5) rotate(15)">
        <Glove id={id} knit={`${id}kf`} cuff={`${id}cf`} dots />
      </g>
    </>
  )
}

function EsdMat({ id }: ArtProps) {
  const sheet = 'M7.5 19.5H40.5L44.4 36.6C44.6 37.5 44 38.2 43 38.2H5C4 38.2 3.4 37.5 3.6 36.6Z'
  const black: Stop[] = ['#52525b', '#18181b', '#09090b']
  return (
    <>
      <defs>
        <V id={`${id}m`} stops={['#7ea9df', '#4b80c4', '#2f5f9e']} />
        <V id={`${id}r`} stops={['#a9c8ee', '#5b8fd0', '#2f5a92', '#1d3a63']} />
        <R id={`${id}s`} stops={['#fafafa', '#a1a1aa', '#52525b']} />
        <V
          id={`${id}u`}
          stops={[
            [0, '#0f172a', 0.4],
            [1, '#0f172a', 0],
          ]}
        />
      </defs>
      <Shadow y={41.2} rx={21} />
      {/* the black, conductive layer underneath */}
      <path d={sheet} fill="#1e293b" transform="translate(0 1.1)" />
      <path d={sheet} fill={url(`${id}m`)} />
      <path d="M12 38.2L22 19.5H27L17 38.2Z" fill="#fff" opacity="0.07" />
      <path d="M4.3 37.3H43.7" stroke="#fff" strokeWidth="0.4" strokeLinecap="round" opacity="0.3" />
      {/* the yellow "careful, static" mark printed in the corner */}
      <path d="M37.6 23.4L40.2 27.9H35Z" fill="#facc15" stroke="#18181b" strokeWidth="0.35" strokeLinejoin="round" />
      <path d="M36.5 27.2L38.8 24.6" stroke="#18181b" strokeWidth="0.35" strokeLinecap="round" />
      {/* the shadow of the roll on the mat */}
      <rect x="7.2" y="19.6" width="33.6" height="2.8" fill={url(`${id}u`)} />
      {/* the rolled-up end */}
      <path d="M9.2 10.4H40.6V20.2H9.2A2.2 4.9 0 0 1 9.2 10.4Z" fill={url(`${id}r`)} />
      <path d="M9.4 11.8H39.6" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.45" />
      <ellipse cx="40.6" cy="15.3" rx="2.3" ry="4.9" fill="#3d6fb0" />
      <g fill="none" stroke="#0f172a" strokeWidth="0.32">
        <ellipse cx="40.6" cy="15.3" rx="1.85" ry="4" />
        <ellipse cx="40.6" cy="15.3" rx="1.4" ry="3.05" />
        <ellipse cx="40.6" cy="15.3" rx="0.95" ry="2.1" />
      </g>
      <ellipse cx="40.6" cy="15.3" rx="0.5" ry="1.15" fill="#0f172a" />
      <path d="M39.2 11.6A2.3 4.9 0 0 1 41.6 10.6" fill="none" stroke="#fff" strokeWidth="0.4" opacity="0.5" />
      {/* the snap stud the ground cord clicks onto */}
      <circle cx="9.6" cy="34" r="2.1" fill="#1e293b" opacity="0.35" />
      <circle cx="9.6" cy="33.7" r="1.95" fill={url(`${id}s`)} stroke="#52525b" strokeWidth="0.25" />
      <circle cx="9.6" cy="33.7" r="0.8" fill="#3f3f46" />
      <circle cx="9" cy="33.1" r="0.35" fill="#fff" opacity="0.8" />
      {/* the coiled ground cord and its clip */}
      <path d="M11.4 33.9H12.6" stroke="#18181b" strokeWidth="0.8" strokeLinecap="round" />
      <g fill="none" strokeLinecap="round">
        {Array.from({ length: 12 }, (_, i) => {
          const x = 13.2 + i * 1.22
          const y = 34 + i * 0.05
          return (
            <g key={i} transform={`rotate(18 ${x} ${y})`}>
              <ellipse cx={x} cy={y} rx="0.95" ry="2.1" stroke="#18181b" strokeWidth="0.75" />
              <path d={`M${x - 0.95} ${y}A0.95 2.1 0 0 0 ${x + 0.95} ${y}`} stroke="#71717a" strokeWidth="0.3" />
            </g>
          )
        })}
      </g>
      <path d="M27.4 34.6H29.6" stroke="#18181b" strokeWidth="0.8" strokeLinecap="round" />
      <g transform="translate(41.6 34.6) scale(-0.5 0.5)">
        <Clip id={`${id}c`} boot={black} open={6} />
      </g>
    </>
  )
}

function FirstAid({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}f`} stops={['#4ade80', '#16a34a', '#166534']} />
        <V id={`${id}t`} stops={['#bbf7d0', '#4ade80']} />
        <V id={`${id}s`} stops={['#15803d', '#14532d']} />
        <V id={`${id}l`} stops={STEEL} />
        <V id={`${id}p`} stops={['#f8d9b4', '#e2ab76', '#c4844a']} />
        <V id={`${id}h`} stops={['#52525b', '#18181b']} />
      </defs>
      <Shadow cx={24} y={40.6} rx={21} />
      {/* the box: top, side and front */}
      <path d="M4 17.4L7.2 13.8H38.2L35 17.4Z" fill={url(`${id}t`)} />
      <path d="M35 17.4L38.2 13.8V35.4L35 39Z" fill={url(`${id}s`)} />
      <rect x="4" y="17.4" width="31" height="21.6" rx="1.4" fill={url(`${id}f`)} />
      <path d="M5.2 18.4H33.8" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.55" />
      {/* the handle */}
      <path
        d="M14.8 15.8L16 10.4C16.2 9.6 16.8 9.2 17.6 9.2H25C25.8 9.2 26.4 9.6 26.6 10.4L27.8 15.8"
        fill="none"
        stroke={url(`${id}h`)}
        strokeWidth="2.1"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M16.6 10.6C16.8 10 17.2 9.8 17.8 9.8H24.6" fill="none" stroke="#fff" strokeWidth="0.45" strokeLinecap="round" opacity="0.4" />
      <rect x="13.8" y="14.6" width="2.4" height="1.6" rx="0.5" fill="#18181b" />
      <rect x="26.4" y="14.6" width="2.4" height="1.6" rx="0.5" fill="#18181b" />
      {/* where the lid closes, and its two latches */}
      <path d="M4 22.2H35L38.2 18.6" fill="none" stroke="#14532d" strokeWidth="0.6" opacity="0.8" />
      <path d="M4.4 22.9H34.6" stroke="#fff" strokeWidth="0.35" opacity="0.3" />
      {[7.6, 28.4].map((x) => (
        <g key={x}>
          <rect x={x} y="19.8" width="3" height="4.8" rx="0.6" fill={url(`${id}l`)} stroke="#52525b" strokeWidth="0.25" />
          <circle cx={x + 1.5} cy="23.4" r="0.4" fill="#52525b" />
        </g>
      ))}
      {/* the white cross */}
      <g transform="translate(0.35 0.45)" fill="#14532d" opacity="0.45">
        <rect x="17.9" y="25" width="3.4" height="10.4" rx="0.5" />
        <rect x="14.4" y="28.5" width="10.4" height="3.4" rx="0.5" />
      </g>
      <rect x="17.9" y="25" width="3.4" height="10.4" rx="0.5" fill="#fff" />
      <rect x="14.4" y="28.5" width="10.4" height="3.4" rx="0.5" fill="#fff" />
      {/* a sticking plaster */}
      <g transform="translate(38.4 38) rotate(-24)">
        <rect x="-7.5" y="-2.7" width="15" height="5.4" rx="2.7" fill="#a16207" opacity="0.35" transform="translate(0.3 0.4)" />
        <rect x="-7.5" y="-2.7" width="15" height="5.4" rx="2.7" fill={url(`${id}p`)} />
        <rect x="-2.8" y="-2.05" width="5.6" height="4.1" rx="0.7" fill="#fdf1e4" stroke="#d6a473" strokeWidth="0.25" />
        {[-1.6, 0, 1.6].map((x) => [-0.8, 0.8].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="0.22" fill="#d6a473" />))}
        {[-6, -4.6, 4.6, 6].map((x) => [-1, 1].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="0.25" fill="#a16207" opacity="0.55" />))}
        <path d="M-5.6 -2H5.6" stroke="#fff" strokeWidth="0.45" strokeLinecap="round" opacity="0.5" />
      </g>
    </>
  )
}

function Extinguisher({ id }: ArtProps) {
  const body = 'M14 19C14 15.2 17.4 13.4 22.5 13.4C27.6 13.4 31 15.2 31 19V40.4C31 41.7 30.2 42.4 29 42.4H16C14.8 42.4 14 41.7 14 40.4Z'
  return (
    <>
      <defs>
        <H
          id={`${id}b`}
          stops={[
            [0, '#991b1b'],
            [0.22, '#f87171'],
            [0.5, '#dc2626'],
            [1, '#7f1d1d'],
          ]}
        />
        <V id={`${id}k`} stops={['#52525b', '#27272a', '#09090b']} />
        <V id={`${id}n`} stops={['#fde68a', '#d97706', '#92400e']} />
        <V id={`${id}l`} stops={['#ffffff', '#e4e4e7']} />
        <H
          id={`${id}ls`}
          stops={[
            [0, '#000', 0.28],
            [0.3, '#000', 0],
            [0.7, '#000', 0],
            [1, '#000', 0.32],
          ]}
        />
        <R id={`${id}g`} stops={['#ffffff', '#f4f4f5', '#a1a1aa']} />
        <V id={`${id}m`} stops={STEEL} />
      </defs>
      <Shadow cx={22} y={43} rx={13} />
      {/* the hose and its nozzle, clipped to the side */}
      <path d="M18.6 10.4C12.6 10.4 9.4 13.2 9.4 19.2V29.4" fill="none" stroke="#18181b" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M17.6 9.8C12.8 10 9.6 12.4 9 17.4" fill="none" stroke="#71717a" strokeWidth="0.45" strokeLinecap="round" opacity="0.7" />
      <rect x="9.6" y="30" width="5" height="1.5" rx="0.4" fill="#27272a" />
      <path d="M8.1 29H10.7L11.5 35.6C11.5 36.2 11 36.6 10.4 36.6H8.4C7.8 36.6 7.3 36.2 7.3 35.6Z" fill={url(`${id}k`)} />
      <rect x="7.6" y="35.2" width="3.6" height="1.4" rx="0.4" fill={url(`${id}m`)} />
      <path d="M8.5 29.6L8.1 34.6" stroke="#fff" strokeWidth="0.4" strokeLinecap="round" opacity="0.3" />
      {/* the red bottle */}
      <path d={body} fill={url(`${id}b`)} />
      <path d="M16.6 17.6C16.6 16.4 17.4 15.6 18.4 15.2" fill="none" stroke="#fff" strokeWidth="0.7" strokeLinecap="round" opacity="0.6" />
      <rect x="15.9" y="18.4" width="1.3" height="20.6" rx="0.65" fill="#fff" opacity="0.28" />
      <rect x="14" y="39.8" width="17" height="2.6" rx="1.1" fill="#18181b" />
      {/* the label band, with a flame */}
      <rect x="14" y="23" width="17" height="11.4" fill={url(`${id}l`)} />
      <rect x="14" y="23" width="17" height="11.4" fill={url(`${id}ls`)} />
      <path d="M14 23H31M14 34.4H31" stroke="#b91c1c" strokeWidth="0.5" />
      <path
        d="M18.2 31.8C16.4 31.8 15.8 30.4 16.2 29.2C16.6 28 17.6 27.6 17.6 26C18.8 26.8 19 27.8 18.8 28.6C19.4 28.2 19.6 27.6 19.6 27.2C20.6 28.4 20.8 29.6 20.4 30.6C20 31.4 19.2 31.8 18.2 31.8Z"
        fill="#f97316"
      />
      <path d="M18.2 31.8C17.4 31.8 17 31.2 17.2 30.4C17.4 29.8 18 29.6 18.2 28.8C18.8 29.6 19.4 30.4 19 31.2C18.8 31.6 18.6 31.8 18.2 31.8Z" fill="#fde047" />
      {[25.4, 27.4, 29.4, 31.4].map((y, i) => (
        <rect key={y} x="22" y={y} width={[6.6, 5, 6, 3.8][i]} height="0.9" rx="0.3" fill="#3f3f46" opacity={i === 0 ? 0.85 : 0.5} />
      ))}
      {/* the valve on top: brass neck, gauge, pin and the two levers */}
      <rect x="20" y="10.4" width="5" height="3.6" rx="0.5" fill={url(`${id}n`)} />
      <path d="M18.6 7.4C18.6 6.6 19.2 6 20 6H25.4C26.2 6 26.8 6.6 26.8 7.4V11C26.8 11.6 26.4 12 25.8 12H19.6C19 12 18.6 11.6 18.6 11Z" fill={url(`${id}k`)} />
      <path d="M20.4 6.8H25.2" stroke="#fff" strokeWidth="0.4" strokeLinecap="round" opacity="0.35" />
      <path d="M19.4 6.4L34.6 3.6C35.4 3.5 35.9 4.2 35.3 4.8L34.1 5.9L20.4 8Z" fill={url(`${id}k`)} />
      <path d="M21 6.8L34.2 4.4" stroke="#fff" strokeWidth="0.4" strokeLinecap="round" opacity="0.35" />
      <path d="M25.6 10.2H34.6C35.4 10.2 35.8 11 35.2 11.5L34.2 12.2H25.6Z" fill={url(`${id}k`)} />
      <path d="M26.4 9.2H29.8" stroke={url(`${id}m`)} strokeWidth="0.7" strokeLinecap="round" />
      <circle cx="31.2" cy="9.2" r="1.45" fill="none" stroke="#facc15" strokeWidth="0.6" />
      <path d="M17.6 7.2H19" stroke="#71717a" strokeWidth="0.9" />
      <circle cx="15.8" cy="6.8" r="2.75" fill="#3f3f46" />
      <circle cx="15.8" cy="6.8" r="2.2" fill={url(`${id}g`)} />
      <path d="M13.9 7.6A2 2 0 0 1 14.4 5.3" fill="none" stroke="#ef4444" strokeWidth="0.55" />
      <path d="M14.6 5.1A2 2 0 0 1 17.6 5.9" fill="none" stroke="#22c55e" strokeWidth="0.55" />
      <path d="M15.8 6.8L16.6 5.4" stroke="#18181b" strokeWidth="0.35" strokeLinecap="round" />
      <circle cx="15.8" cy="6.8" r="0.35" fill="#18181b" />
    </>
  )
}

export { Gloves, EsdMat, FirstAid, Extinguisher }
