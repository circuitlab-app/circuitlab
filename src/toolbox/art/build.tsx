import { H, R, Shadow, V } from './kit'
import { COPPER, r2, STEEL, url, type ArtProps, type Stop } from './palette'

/* ───────────────────────── Build: the newer tools ───────────────────────── */

const BLACK_PLASTIC: Stop[] = ['#52525b', '#27272a', '#09090b']
const GOLD: Stop[] = ['#fef3c7', '#fbbf24', '#b45309']

/** A pin with pointed ends, from `top` to `bottom`. */
const pin = (x: number, top: number, bottom: number, w = 0.45) =>
  `M${r2(x - w)} ${r2(top + 0.7)}L${r2(x)} ${r2(top)}L${r2(x + w)} ${r2(top + 0.7)}V${r2(bottom - 0.7)}L${r2(x)} ${r2(bottom)}L${r2(x - w)} ${r2(bottom - 0.7)}Z`

function Dupont({ id }: ArtProps) {
  const wires = [
    { color: '#dc2626', light: '#fca5a5' },
    { color: '#f59e0b', light: '#fde68a' },
    { color: '#16a34a', light: '#86efac' },
    { color: '#2563eb', light: '#93c5fd' },
  ]
  // the ribbon turns round one point, so its wires stay side by side
  const cx = 12
  const cy = 19.5
  const xs = wires.map((_, i) => r2(18.6 + i * 3.2))
  return (
    <>
      <defs>
        <V id={`${id}h`} stops={BLACK_PLASTIC} />
        <H id={`${id}g`} stops={GOLD} />
        <V id={`${id}m`} stops={STEEL} />
        <H id={`${id}c`} stops={COPPER} />
      </defs>
      <Shadow cx={25} y={40} rx={20} />
      {wires.map((w, i) => {
        const r = r2(xs[i] - cx)
        const top = r2(cy - r)
        return (
          <g key={w.color} fill="none">
            <path d={`M${xs[i]} 21V${cy}A${r} ${r} 0 0 0 ${cx} ${top}H5.6`} stroke={w.color} strokeWidth="3" />
            <path
              d={`M${r2(xs[i] - 0.75)} 20.6V${cy}A${r2(r - 0.75)} ${r2(r - 0.75)} 0 0 0 ${cx} ${r2(top + 0.75)}H6.2`}
              stroke={w.light}
              strokeWidth="0.5"
              opacity="0.65"
            />
            <rect x="3.3" y={r2(top - 0.55)} width="2.6" height="1.1" rx="0.45" fill={url(`${id}c`)} />
          </g>
        )
      })}
      {/* the four-pin housing, with its pins poking out */}
      {xs.map((x) => (
        <path key={x} d={pin(x, 30, 37)} fill={url(`${id}g`)} />
      ))}
      <rect x="16.8" y="20.6" width="13.6" height="10.6" rx="0.7" fill={url(`${id}h`)} stroke="#52525b" strokeWidth="0.25" />
      <rect x="16.8" y="20.6" width="13.6" height="1.3" rx="0.6" fill="#71717a" />
      <path d="M20.2 21.9V31.2M23.4 21.9V31.2M26.6 21.9V31.2" stroke="#000" strokeWidth="0.35" opacity="0.6" />
      <path d="M20.5 22.2V30.8M23.7 22.2V30.8M26.9 22.2V30.8" stroke="#fff" strokeWidth="0.2" opacity="0.12" />
      {xs.map((x) => (
        <g key={x}>
          <rect x={r2(x - 0.8)} y="24" width="1.6" height="3.2" rx="0.3" fill="#09090b" stroke="#52525b" strokeWidth="0.2" />
          <rect x={r2(x - 0.45)} y="24.7" width="0.9" height="1.6" rx="0.2" fill={url(`${id}m`)} />
        </g>
      ))}
      <rect x="17.3" y="22.3" width="0.55" height="8.2" rx="0.27" fill="#fff" opacity="0.2" />
      {/* two loose one-pin housings */}
      {[
        [36.2, 23, -12],
        [41.4, 26.6, 9],
      ].map(([x, y, a]) => (
        <g key={x} transform={`translate(${x} ${y}) rotate(${a})`}>
          <rect x="-1.8" y="-6.2" width="3.6" height="12.4" rx="0.5" fill={url(`${id}h`)} stroke="#52525b" strokeWidth="0.25" />
          <rect x="-1.8" y="-6.2" width="3.6" height="1.3" rx="0.5" fill="#71717a" />
          <rect x="-0.75" y="-5.95" width="1.5" height="0.85" rx="0.15" fill="#09090b" />
          <rect x="-0.75" y="-1.4" width="1.5" height="3" rx="0.3" fill="#09090b" stroke="#52525b" strokeWidth="0.2" />
          <rect x="-0.42" y="-0.8" width="0.84" height="1.5" rx="0.2" fill={url(`${id}m`)} />
          <rect x="-1.35" y="-4.6" width="0.5" height="10" rx="0.25" fill="#fff" opacity="0.2" />
        </g>
      ))}
      {/* a loose crimp terminal, before it meets its wire */}
      <g transform="translate(4.4 35.4) rotate(-8)" stroke="#71717a" strokeWidth="0.2" strokeLinejoin="round">
        <rect x="0" y="-1.25" width="5.4" height="2.5" rx="0.3" fill={url(`${id}m`)} />
        <path d="M0.4 -0.1H5" stroke="#52525b" strokeWidth="0.3" />
        <path d="M5.4 -0.7H6.4V0.9H5.4Z" fill={url(`${id}m`)} />
        <path d="M6.4 1.2V-1L6.8 -2.2H8.2L8.6 -1V1.2Z" fill={url(`${id}m`)} />
        <path d="M9 1.2V-1.4L9.4 -2.9H10.9L11.3 -1.4V1.2Z" fill={url(`${id}m`)} />
        <rect x="11.3" y="-0.3" width="1" height="0.9" fill={url(`${id}m`)} />
        <path d="M0.6 -0.95H4.8" stroke="#fff" strokeWidth="0.35" opacity="0.8" />
      </g>
    </>
  )
}

/** A row of male header pins from (0, 0): the black bar is 2.8 tall, the pins stand above and below it. */
function MaleStrip({ id, n }: { id: string; n: number }) {
  const pitch = 4
  return (
    <g>
      {Array.from({ length: n }, (_, k) => (
        <path key={k} d={pin(pitch / 2 + k * pitch, -7, 6.3)} fill={url(`${id}g`)} />
      ))}
      <rect x="0" y="0" width={n * pitch} height="2.8" rx="0.35" fill={url(`${id}b`)} stroke="#52525b" strokeWidth="0.25" />
      <rect x="0.4" y="0.25" width={n * pitch - 0.8} height="0.45" rx="0.22" fill="#fff" opacity="0.18" />
      {/* the grooves where the strip snaps apart */}
      {Array.from({ length: n - 1 }, (_, k) => {
        const x = (k + 1) * pitch
        return <path key={k} d={`M${x - 0.55} 0L${x} 0.75L${x + 0.55} 0ZM${x - 0.55} 2.8L${x} 2.05L${x + 0.55} 2.8Z`} fill="#000" opacity="0.7" />
      })}
    </g>
  )
}

function HeaderPins({ id }: ArtProps) {
  const female = Array.from({ length: 6 }, (_, k) => 22 + k * 4)
  return (
    <>
      <defs>
        <V id={`${id}b`} stops={BLACK_PLASTIC} />
        <H id={`${id}g`} stops={GOLD} />
      </defs>
      <Shadow y={40.6} rx={20} />
      <g transform="translate(4 12)">
        <MaleStrip id={id} n={10} />
      </g>
      {/* a short piece snapped off the long strip */}
      <g transform="translate(5 31.5) rotate(-14)">
        <MaleStrip id={id} n={3} />
      </g>
      {/* a female header: square sockets on top */}
      {female.map((x) => (
        <path key={x} d={pin(x, 33.5, 38.8)} fill={url(`${id}g`)} />
      ))}
      <rect x="20" y="28.2" width="24" height="7" rx="0.6" fill={url(`${id}b`)} stroke="#52525b" strokeWidth="0.25" />
      <path d={female.slice(1).map((x) => `M${x - 2} 28.8V35`).join('')} stroke="#000" strokeWidth="0.3" opacity="0.55" />
      <rect x="20" y="26.4" width="24" height="2.4" rx="0.5" fill="#52525b" />
      <rect x="20.4" y="26.55" width="23.2" height="0.4" rx="0.2" fill="#fff" opacity="0.25" />
      {female.map((x) => (
        <g key={x}>
          <rect x={x - 0.85} y="26.95" width="1.7" height="1.4" rx="0.2" fill="#09090b" />
          <rect x={x - 0.4} y="27.75" width="0.8" height="0.45" fill="#fbbf24" opacity="0.85" />
        </g>
      ))}
    </>
  )
}

function Perfboard({ id }: ArtProps) {
  const pitch = 2.6
  return (
    <>
      <defs>
        <V id={`${id}s`} stops={['#b9814a', '#9a6332', '#7c4a1c']} />
        <V id={`${id}c`} stops={COPPER} />
        <V id={`${id}p`} stops={['#f8e4bc', '#ebc98f', '#d4a663']} />
        <R id={`${id}j`} stops={['#fafafa', '#a1a1aa', '#52525b']} />
        <V id={`${id}r`} stops={['#f6e7c6', '#cfae7c']} />
        <R id={`${id}l`} stops={['#fecaca', '#ef4444', '#991b1b']} />
        <pattern id={`${id}sh`} width={pitch} height={pitch} patternUnits="userSpaceOnUse">
          <circle cx="1.3" cy="1.3" r="0.42" fill="#2a1606" />
        </pattern>
        <pattern id={`${id}ph`} width={pitch} height={pitch} patternUnits="userSpaceOnUse">
          <circle cx="1.3" cy="1.3" r="0.85" fill="#c2702a" />
          <circle cx="1.2" cy="1.2" r="0.62" fill="#f2b56b" />
          <circle cx="1.3" cy="1.3" r="0.36" fill="#3b2208" />
        </pattern>
      </defs>
      <Shadow y={41} rx={21} />
      {/* behind: stripboard, copper side up */}
      <g transform="translate(14.8 7.6) rotate(-6)">
        <rect x="0.4" y="0.9" width="28.6" height="18.2" rx="0.6" fill="#5c3410" />
        <rect x="0" y="0" width="28.6" height="18.2" rx="0.6" fill={url(`${id}s`)} />
        {Array.from({ length: 7 }, (_, j) => (
          <rect key={j} x="0.25" y={r2(0.3 + j * pitch)} width="28.1" height="2" rx="0.35" fill={url(`${id}c`)} />
        ))}
        <rect x="0" y="0" width="28.6" height="18.2" fill={url(`${id}sh`)} />
        {/* a cut in one strip, and two blobs of solder */}
        <circle cx="14.3" cy="6.5" r="1.05" fill="#9a6332" />
        <circle cx="14.3" cy="6.5" r="0.42" fill="#2a1606" />
        {[
          [6.5, 3.9],
          [19.5, 3.9],
          [9.1, 11.7],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="1.05" fill={url(`${id}j`)} />
        ))}
        <rect x="0.5" y="0.35" width="27.6" height="0.4" rx="0.2" fill="#fff" opacity="0.25" />
      </g>
      {/* in front: perfboard with a pad round every hole, and a few parts on it */}
      <g transform="translate(4 19.6) rotate(4)">
        <rect x="0.3" y="0.9" width="26" height="18.2" rx="0.6" fill="#a87a3a" />
        <rect x="0" y="0" width="26" height="18.2" rx="0.6" fill={url(`${id}p`)} />
        <rect x="0" y="0" width="26" height="18.2" fill={url(`${id}ph`)} />
        <rect x="0.5" y="0.3" width="25" height="0.4" rx="0.2" fill="#fff" opacity="0.5" />
        {/* a green wire link */}
        <path d="M3.9 11.7V10.4H14.3V11.7" fill="none" stroke="#15803d" strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M4.3 10.1H13.9" stroke="#86efac" strokeWidth="0.3" opacity="0.8" />
        {/* a resistor */}
        <path d="M3.9 6.5H16.9" stroke="#a1a1aa" strokeWidth="0.5" />
        <rect x="7" y="5.3" width="6.8" height="2.4" rx="1.2" fill={url(`${id}r`)} />
        <path d="M8.5 5.3v2.4M9.6 5.3v2.4M10.7 5.3v2.4" stroke="#7c3f12" strokeWidth="0.5" />
        <path d="M12.4 5.3v2.4" stroke="#d4a017" strokeWidth="0.45" />
        <rect x="7.6" y="5.6" width="5.6" height="0.45" rx="0.22" fill="#fff" opacity="0.5" />
        {/* a red LED seen from above */}
        <circle cx="21.2" cy="6.9" r="2.6" fill="#7f1d1d" opacity="0.35" />
        <circle cx="21.2" cy="6.5" r="2.4" fill={url(`${id}l`)} />
        <path d="M23.3 5.3A2.4 2.4 0 0 1 23.3 7.7" fill="none" stroke="#7f1d1d" strokeWidth="0.35" />
        <circle cx="20.4" cy="5.6" r="0.6" fill="#fff" opacity="0.75" />
        {/* a blue capacitor */}
        <circle cx="20.8" cy="14.3" r="2.3" fill="#1e3a8a" />
        <circle cx="20.6" cy="14.1" r="2.1" fill="#2563eb" />
        <path d="M22.4 12.9A2.1 2.1 0 0 1 22.4 15.3" fill="none" stroke="#bfdbfe" strokeWidth="0.7" />
        <circle cx="20.6" cy="14.1" r="1.1" fill="none" stroke="#93c5fd" strokeWidth="0.25" opacity="0.6" />
      </g>
    </>
  )
}

function Pcb({ id }: ArtProps) {
  const fingers = [16.6, 19, 21.4, 23.8, 26.2, 28.6, 31]
  const sidePins = [-3.2, -1.6, 0, 1.6, 3.2]
  const header = [12.4, 15.6, 18.8, 22, 25.2]
  const board = 'M5.6 7H42.4Q44 7 44 8.6V31.4Q44 33 42.4 33H34V37.4Q34 38 33.4 38H14.6Q14 38 14 37.4V33H5.6Q4 33 4 31.4V8.6Q4 7 5.6 7Z'
  return (
    <>
      <defs>
        <V id={`${id}b`} stops={['#2fbf6a', '#16a34a', '#166534']} />
        <V id={`${id}g`} stops={GOLD} />
        <V id={`${id}c`} stops={BLACK_PLASTIC} />
        <V id={`${id}m`} stops={STEEL} />
      </defs>
      <Shadow y={40.8} rx={21} />
      <path d={board} fill="#14532d" transform="translate(0 1.1)" />
      <path d={board} fill={url(`${id}b`)} />
      <path d="M5.6 7.7H42.4" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" opacity="0.35" />
      {/* copper tracks under the green coat */}
      <g fill="none" stroke="#4ade80" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
        <path d="M19.6 16.8H14.6L12.4 14.6V12.4M19.6 18.4H11.2L9.2 16.4V15.6" />
        <path d="M19.6 20H13.8L12 21.8V22M19.6 21.6H16.6L15.2 23V25.2L12.6 25.2" />
        <path d="M21.8 23.4V26L19 28.8V33.6M23.4 23.4V28.4L21.4 30.4V33.6M25 23.4V33.6M26.6 23.4V28.4L28.6 30.4V33.6M28.2 23.4V26L31 28.8V33.6" />
        <path d="M30.4 16.8H35.2V12.6M30.4 18.4H37.6L39.2 20V24.6M30.4 20H33.6L35 21.4V27.4" />
        <path d="M23.4 12.6V10.2H31.6M26.6 12.6V11.4" />
      </g>
      {/* mounting holes */}
      {[
        [7.4, 10.4],
        [40.6, 10.4],
        [7.4, 29.6],
        [40.6, 29.6],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r="1.8" fill={url(`${id}g`)} />
          <circle cx={x} cy={y} r="0.95" fill="#0a0a0a" />
        </g>
      ))}
      {/* a header row: square pad for pin 1, round pads for the rest */}
      <rect x="10.9" y={header[0] - 1.5} width="3" height="3" rx="0.3" fill={url(`${id}g`)} />
      {header.slice(1).map((y) => (
        <circle key={y} cx="12.4" cy={y} r="1.35" fill={url(`${id}g`)} />
      ))}
      {header.map((y) => (
        <circle key={y} cx="12.4" cy={y} r="0.55" fill="#0a0a0a" />
      ))}
      <rect x="10.1" y="10.1" width="4.6" height="17.4" rx="0.5" fill="none" stroke="#fff" strokeWidth="0.35" opacity="0.85" />
      {/* the chip with legs on all four sides */}
      {sidePins.map((d) => (
        <g key={d} fill={url(`${id}m`)}>
          <rect x={r2(25 + d - 0.35)} y="12.4" width="0.7" height="1.8" rx="0.15" />
          <rect x={r2(25 + d - 0.35)} y="21.8" width="0.7" height="1.8" rx="0.15" />
          <rect x="19.4" y={r2(18 + d - 0.35)} width="1.8" height="0.7" rx="0.15" />
          <rect x="28.8" y={r2(18 + d - 0.35)} width="1.8" height="0.7" rx="0.15" />
        </g>
      ))}
      <rect x="20.8" y="13.8" width="8.4" height="8.4" rx="0.5" fill={url(`${id}c`)} />
      <rect x="21.3" y="14.2" width="7.4" height="0.5" rx="0.25" fill="#fff" opacity="0.15" />
      <circle cx="22.4" cy="15.4" r="0.55" fill="#3f3f46" />
      <path d="M18.4 12V11.2H19.4M31.6 12V11.2H30.6M18.4 24V24.8H19.4M31.6 24V24.8H30.6" fill="none" stroke="#fff" strokeWidth="0.35" opacity="0.85" />
      {/* small parts on the right: two resistors and an LED */}
      {[11.2, 15.2].map((y) => (
        <g key={y}>
          <rect x="35.4" y={y} width="4.4" height="1.9" rx="0.25" fill="#18181b" />
          <rect x="35.4" y={y} width="0.9" height="1.9" fill={url(`${id}m`)} />
          <rect x="38.9" y={y} width="0.9" height="1.9" fill={url(`${id}m`)} />
          <rect x="34.8" y={y - 0.6} width="5.6" height="3.1" rx="0.3" fill="none" stroke="#fff" strokeWidth="0.3" opacity="0.8" />
        </g>
      ))}
      <rect x="37.2" y="24.6" width="3.4" height="2.6" rx="0.3" fill="#fef2f2" />
      <rect x="37.9" y="25.1" width="2" height="1.6" rx="0.3" fill="#ef4444" />
      <path d="M36.2 23.4h1.6M37 22.6v1.6" stroke="#fff" strokeWidth="0.35" opacity="0.85" />
      {/* little holes that take a track to the other side */}
      {[
        [31.6, 10.2],
        [26.6, 11.4],
        [9.2, 15.6],
        [35, 27.4],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r="0.65" fill={url(`${id}g`)} />
          <circle cx={x} cy={y} r="0.25" fill="#0a0a0a" />
        </g>
      ))}
      {/* white label marks */}
      <path d="M31 30.6h2.2M31 31.6h1.4M8.8 30.6h3M8.8 31.6h2" stroke="#fff" strokeWidth="0.45" strokeLinecap="round" opacity="0.75" />
      {/* the gold fingers that slide into a socket */}
      {fingers.map((x) => (
        <rect key={x} x={x - 0.8} y="33.6" width="1.6" height="3.8" rx="0.3" fill={url(`${id}g`)} />
      ))}
    </>
  )
}

function ScrewTerminal({ id }: ArtProps) {
  const centres = [10.33, 21, 31.67]
  const slots = [-18, 24, 62]
  return (
    <>
      <defs>
        <V id={`${id}f`} stops={['#60a5fa', '#2563eb', '#1d4ed8']} />
        <V id={`${id}t`} stops={['#bfdbfe', '#60a5fa']} />
        <V id={`${id}r`} stops={['#1d4ed8', '#1e3a8a']} />
        <R id={`${id}s`} stops={['#fafafa', '#d4d4d8', '#71717a']} />
        <V id={`${id}m`} stops={STEEL} />
        <H id={`${id}l`} stops={['#71717a', '#e4e4e7', '#a1a1aa', '#52525b']} />
      </defs>
      <Shadow cx={23} y={40.4} rx={19} />
      {centres.map((x) => (
        <path key={x} d={pin(x, 31, 38.4, 0.55)} fill={url(`${id}l`)} />
      ))}
      {/* the block: front, top and right side */}
      <path d="M37 16L40.4 10.6V26.6L37 32Z" fill={url(`${id}r`)} />
      <path d="M5 16L8.4 10.6H40.4L37 16Z" fill={url(`${id}t`)} />
      <rect x="5" y="16" width="32" height="16" rx="0.4" fill={url(`${id}f`)} />
      <path d="M15.67 10.6L12.27 16M26.33 10.6L22.93 16" stroke="#1e40af" strokeWidth="0.45" opacity="0.6" />
      <path d="M15.67 16V32M26.33 16V32" stroke="#1e3a8a" strokeWidth="0.5" opacity="0.7" />
      <path d="M16 16.4V31.6M26.66 16.4V31.6" stroke="#93c5fd" strokeWidth="0.3" opacity="0.5" />
      <path d="M5.3 16.2H36.8" stroke="#fff" strokeWidth="0.45" opacity="0.5" />
      <rect x="5" y="30.4" width="32" height="1.6" fill="#1e3a8a" opacity="0.35" />
      {centres.map((x, i) => {
        const sx = r2(x + 1.7)
        return (
          <g key={x}>
            {/* the screw on top */}
            <ellipse cx={sx} cy="13.3" rx="3.7" ry="2.05" fill="#1e3a8a" />
            <ellipse cx={sx} cy="13.2" rx="3.05" ry="1.7" fill={url(`${id}s`)} stroke="#52525b" strokeWidth="0.2" />
            {/* its slot, turned in the screw's own plane and then seen at a slant */}
            <path
              d="M-2.2 0H2.2"
              stroke="#3f3f46"
              strokeWidth="0.6"
              strokeLinecap="round"
              transform={`translate(${sx} 13.2) scale(1 0.56) rotate(${slots[i]})`}
            />
            {/* the opening that takes the wire, with its metal clamp inside */}
            <rect x={r2(x - 3.1)} y="19.4" width="6.2" height="6.4" rx="0.5" fill="#0b1120" />
            <rect x={r2(x - 2.6)} y="19.9" width="5.2" height="1.6" rx="0.2" fill={url(`${id}m`)} />
            <rect x={r2(x - 2.6)} y="23.7" width="5.2" height="1.5" rx="0.2" fill="#71717a" />
            <rect x={r2(x - 3.1)} y="25.8" width="6.2" height="0.4" fill="#93c5fd" opacity="0.35" />
          </g>
        )
      })}
      {/* a stripped red wire pushed into the first opening */}
      <path d="M8.6 25.6C7.4 29.4 4.8 32.6 3.6 38.6" fill="none" stroke="#b91c1c" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M8 26.2C6.8 29.6 4.5 32.4 3.3 37.6" fill="none" stroke="#fca5a5" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
      <path d="M10.3 22.6L8.7 25.5" stroke="#b45309" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M10 22.6L8.5 25.3M10.7 22.9L9.2 25.7" stroke="#fde68a" strokeWidth="0.35" strokeLinecap="round" opacity="0.9" />
    </>
  )
}

/** A reel standing up, its axis upright: flanges at `t` and `b`, the wound wire between. */
function Spool({
  id,
  c,
  t,
  b,
  rad,
  wound,
  wire,
  lines,
}: {
  id: string
  c: number
  t: number
  b: number
  rad: number
  wound: number
  wire: string
  lines: string
}) {
  const ry = r2(rad * 0.3)
  const ryw = r2(wound * 0.3)
  const wraps: number[] = []
  for (let y = t + 2.2; y < b - 0.4; y += 1.25) wraps.push(r2(y))
  return (
    <g>
      <ellipse cx={c} cy={r2(b + 1.4)} rx={rad} ry={ry} fill="#52525b" />
      <ellipse cx={c} cy={b} rx={rad} ry={ry} fill={url(`${id}f`)} stroke="#a1a1aa" strokeWidth="0.25" />
      <path d={`M${r2(c - wound)} ${t}H${r2(c + wound)}V${b}A${wound} ${ryw} 0 0 1 ${r2(c - wound)} ${b}Z`} fill={wire} />
      <g fill="none" stroke={lines} strokeWidth="0.3">
        {wraps.map((y) => (
          <path key={y} d={`M${r2(c - wound)} ${y}A${wound} ${ryw} 0 0 0 ${r2(c + wound)} ${y}`} />
        ))}
      </g>
      <path d={`M${r2(c - wound * 0.55)} ${t + 2}V${b}`} stroke="#fff" strokeWidth="0.8" strokeLinecap="round" opacity="0.18" />
      <ellipse cx={c} cy={r2(t + 1.4)} rx={rad} ry={ry} fill="#52525b" />
      <ellipse cx={c} cy={t} rx={rad} ry={ry} fill={url(`${id}f`)} stroke="#a1a1aa" strokeWidth="0.25" />
      <ellipse cx={c} cy={t} rx={r2(rad * 0.72)} ry={r2(ry * 0.72)} fill="none" stroke="#a1a1aa" strokeWidth="0.3" opacity="0.6" />
      <ellipse cx={c} cy={t} rx={r2(rad * 0.3)} ry={r2(ry * 0.3)} fill="#3f3f46" />
      <ellipse cx={c} cy={r2(t + 0.25)} rx={r2(rad * 0.18)} ry={r2(ry * 0.16)} fill="#18181b" />
      <path
        d={`M${r2(c - rad * 0.8)} ${r2(t - ry * 0.3)}A${rad} ${ry} 0 0 1 ${r2(c - rad * 0.2)} ${r2(t - ry * 0.95)}`}
        fill="none"
        stroke="#fff"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.8"
      />
    </g>
  )
}

function WireSpool({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}f`} stops={['#fafafa', '#e4e4e7', '#a1a1aa']} />
        <H id={`${id}k`} stops={['#09090b', '#52525b', '#27272a', '#09090b']} />
        <H id={`${id}r`} stops={['#7f1d1d', '#f87171', '#dc2626', '#7f1d1d']} />
      </defs>
      <Shadow cx={24} y={41.2} rx={20} />
      <Spool id={id} c={31.5} t={7.6} b={27} rad={10} wound={7.6} wire={url(`${id}k`)} lines="#71717a" />
      <Spool id={id} c={16.5} t={13.2} b={35} rad={11.5} wound={8.8} wire={url(`${id}r`)} lines="#7f1d1d" />
      {/* the loose end of the red wire, its copper showing */}
      <path d="M24.6 31.2C31 31.4 34.4 38.6 41 37.5" fill="none" stroke="#b91c1c" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M25 30.5C30.6 30.8 34 37.6 40.6 36.7" fill="none" stroke="#fca5a5" strokeWidth="0.4" strokeLinecap="round" opacity="0.7" />
      <path d="M41 37.5L44.2 36.9" stroke="#d97706" strokeWidth="1" strokeLinecap="round" />
      <path d="M41.2 37.2L44 36.7" stroke="#fde68a" strokeWidth="0.3" strokeLinecap="round" />
    </>
  )
}

function Crimper({ id }: ArtProps) {
  const dies: [number, number][] = [
    [16.6, 2.1],
    [21.7, 1.8],
    [26.4, 1.45],
    [30.7, 1.15],
  ]
  // the toothed ratchet sector between the handles
  const at = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180
    return `${r2(24 + r * Math.cos(a))} ${r2(17.6 + r * Math.sin(a))}`
  }
  const teeth = Array.from({ length: 15 }, (_, i) => `L${at(55 + i * 5, i % 2 ? 7.3 : 6.4)}`).join('')
  return (
    <>
      <defs>
        <V id={`${id}m`} stops={['#f4f4f5', '#d4d4d8', '#a1a1aa', '#71717a']} />
        <R id={`${id}p`} stops={['#fafafa', '#a1a1aa']} />
        <V id={`${id}t`} stops={STEEL} />
        <V id={`${id}r`} stops={['#a1a1aa', '#52525b']} />
      </defs>
      <Shadow y={43.2} rx={16} />
      {/* handles with black grips and orange collars */}
      <g fill="none" strokeLinecap="round">
        <path d="M18.6 18.8L12 40.6M29.4 18.8L36 40.6" stroke="#a1a1aa" strokeWidth="2.8" />
        <path d="M18.2 19.4L15.6 28M29.8 19.4L32.4 28" stroke="#fff" strokeWidth="0.5" opacity="0.55" />
        <path d="M16.24 26.6L12 40.6M31.76 26.6L36 40.6" stroke="#27272a" strokeWidth="4.8" />
        <path d="M15.2 28.6L12 39.4M32.4 28.2L35.6 38.8" stroke="#71717a" strokeWidth="1" opacity="0.6" />
        <path d="M16.3 26.4L15.86 27.8M31.7 26.4L32.14 27.8" stroke="#f97316" strokeWidth="5" strokeLinecap="butt" />
      </g>
      <path d={`M24 17.6L${at(55, 6.4)}${teeth}Z`} fill={url(`${id}r`)} stroke="#3f3f46" strokeWidth="0.3" strokeLinejoin="round" />
      <circle cx="24" cy="19.8" r="1" fill={url(`${id}p`)} stroke="#52525b" strokeWidth="0.25" />
      <path d="M31.4 24.6L28.2 24.9" stroke="#3f3f46" strokeWidth="1.2" strokeLinecap="round" />
      {/* a terminal on a red wire, sitting in the jaws */}
      <path d="M3.4 10.4H9" stroke="#b91c1c" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M3.6 9.8H8.6" stroke="#fca5a5" strokeWidth="0.4" strokeLinecap="round" opacity="0.7" />
      <rect x="8" y="9.1" width="5.4" height="2.6" rx="0.3" fill={url(`${id}t`)} stroke="#71717a" strokeWidth="0.2" />
      <path d="M9.8 9.1V11.7M11.2 9.1V11.7" stroke="#71717a" strokeWidth="0.25" />
      {/* the wide head: two jaws with a row of crimping notches */}
      <path d="M12 5Q12 2.6 14.4 2.6H33.6Q36 2.6 36 5V10.1H12Z" fill={url(`${id}m`)} />
      <path d="M12 10.7H36V16.8Q36 19.4 33.4 19.4H14.6Q12 19.4 12 16.8Z" fill={url(`${id}m`)} />
      <rect x="12" y="10.1" width="24" height="0.6" fill="#3f3f46" />
      <path d="M14 3.4H34M12.7 4.6V9.6" stroke="#fff" strokeWidth="0.55" strokeLinecap="round" opacity="0.7" />
      {dies.map(([x, w]) => (
        <g key={x}>
          <ellipse cx={x} cy="10.4" rx={w} ry={r2(w * 0.78)} fill="#27272a" />
          <path
            d={`M${r2(x - w * 0.6)} ${r2(10.4 - w * 0.4)}A${w} ${r2(w * 0.78)} 0 0 1 ${r2(x + w * 0.5)} ${r2(10.4 - w * 0.55)}`}
            fill="none"
            stroke="#fff"
            strokeWidth="0.25"
            opacity="0.4"
          />
        </g>
      ))}
      {[
        [15.6, 15.8, 1.6],
        [32.4, 15.8, 1.6],
        [32.4, 6, 1.2],
      ].map(([x, y, r]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r={r} fill={url(`${id}p`)} stroke="#52525b" strokeWidth="0.3" />
          <circle cx={x} cy={y} r={r2(r * 0.4)} fill="#3f3f46" />
        </g>
      ))}
    </>
  )
}

/** A tape roll lying on its side, seen from the front and a little to the right. */
function Roll({
  cx,
  cy,
  rx,
  ry,
  dx,
  dy,
  core,
  face,
  side,
  wall,
  clip,
  rim,
}: {
  cx: number
  cy: number
  rx: number
  ry: number
  dx: number
  dy: number
  core: number
  face: string
  side: string
  wall?: string
  clip?: string
  /** a thin edge, so a black roll still shows on a dark table */
  rim?: string
}) {
  const ell = (x: number, y: number, a: number, b: number) =>
    `M${r2(x - a)} ${r2(y)}A${r2(a)} ${r2(b)} 0 1 0 ${r2(x + a)} ${r2(y)}A${r2(a)} ${r2(b)} 0 1 0 ${r2(x - a)} ${r2(y)}Z`
  const cr = core
  const hr = core * 0.84
  const k = ry / rx
  return (
    <g>
      <path d={ell(cx + dx, cy + dy, rx, ry)} fill={side} />
      <path d={`M${cx} ${r2(cy - ry)}L${r2(cx + dx)} ${r2(cy + dy - ry)}A${rx} ${ry} 0 0 1 ${r2(cx + dx)} ${r2(cy + dy + ry)}L${cx} ${r2(cy + ry)}Z`} fill={side} />
      <path d={ell(cx, cy, rx, ry) + ell(cx, cy, cr, cr * k)} fill={face} fillRule="evenodd" stroke={rim} strokeWidth="0.3" />
      {[0.62, 0.76, 0.9].map((f) => (
        <path key={f} d={ell(cx, cy, rx * f, ry * f)} fill="none" stroke="#fff" strokeWidth="0.25" opacity="0.07" />
      ))}
      {/* the cardboard core, and through its hole the inside of the far wall */}
      <path d={ell(cx, cy, cr, cr * k) + ell(cx, cy, hr, hr * k)} fill="#e7c79a" fillRule="evenodd" />
      {wall && clip && (
        <g clipPath={`url(#${clip})`}>
          <path d={ell(cx, cy, hr, hr * k) + ell(cx + dx, cy + dy, hr, hr * k)} fill={wall} fillRule="evenodd" />
        </g>
      )}
      <path
        d={`M${r2(cx - rx * 0.78)} ${r2(cy - ry * 0.3)}A${r2(rx * 0.83)} ${r2(ry * 0.83)} 0 0 1 ${r2(cx - rx * 0.28)} ${r2(cy - ry * 0.79)}`}
        fill="none"
        stroke="#fff"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.4"
      />
    </g>
  )
}

function ElectricalTape({ id }: ArtProps) {
  const cx = 15.6
  const cy = 23.4
  const k = 12 / 10.5
  const hr = 5.6 * 0.84
  return (
    <>
      <defs>
        <R id={`${id}f`} stops={['#71717a', '#27272a', '#09090b']} />
        <H id={`${id}s`} stops={['#3f3f46', '#27272a', '#09090b']} />
        <R id={`${id}b`} stops={['#93c5fd', '#2563eb', '#1e3a8a']} />
        <R id={`${id}y`} stops={['#fef08a', '#eab308', '#854d0e']} />
        <V id={`${id}t`} stops={['#52525b', '#18181b', '#09090b']} />
        <clipPath id={`${id}h`}>
          <ellipse cx={cx} cy={cy} rx={hr} ry={r2(hr * k)} />
        </clipPath>
      </defs>
      <Shadow cx={25} y={40.4} rx={20} />
      <Roll cx={33.4} cy={15} rx={7} ry={8} dx={2.8} dy={-1} core={3.6} face={url(`${id}b`)} side="#1e3a8a" />
      <Roll cx={37.2} cy={28.6} rx={6} ry={7} dx={2.4} dy={-0.8} core={3.1} face={url(`${id}y`)} side="#854d0e" />
      {/* the end of the black tape pulled out along the table, torn off by hand */}
      <path
        d="M16.4 34.9L20.4 33.6L41.2 36.3L42 35.8L42.4 36.6L43.2 36.1L43.5 36.9L44.2 36.5L44.2 37.1L40.2 38.5L39.6 38L39.1 38.6L38.5 38.1Z"
        fill={url(`${id}t`)}
      />
      <path d="M20.6 34.3L40.6 36.9" stroke="#fff" strokeWidth="0.35" strokeLinecap="round" opacity="0.3" />
      <Roll cx={cx} cy={cy} rx={10.5} ry={12} dx={4.2} dy={-1.4} core={5.6} face={url(`${id}f`)} side={url(`${id}s`)} wall="#b48a52" clip={`${id}h`} rim="#52525b" />
    </>
  )
}

export { Dupont, HeaderPins, Perfboard, Pcb, ScrewTerminal, WireSpool, Crimper, ElectricalTape }
