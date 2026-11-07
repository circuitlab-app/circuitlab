import { Clip, H, R, Readout, Shadow, V } from './kit'
import { LCD, r2, STEEL, STEEL_ROUND, url, type ArtProps, type Stop } from './palette'

/* ───────────────────────── Measure: the newer tools ───────────────────────── */

const rad = (deg: number) => (deg * Math.PI) / 180

/** A point on a circle; 0° points right and angles turn clockwise, like the screen. */
function pt(cx: number, cy: number, r: number, deg: number): [number, number] {
  return [r2(cx + r * Math.cos(rad(deg))), r2(cy + r * Math.sin(rad(deg)))]
}

const at = (cx: number, cy: number, r: number, deg: number) => pt(cx, cy, r, deg).join(' ')

const BLACK_BOOT: Stop[] = ['#52525b', '#18181b', '#09090b']

/** A pointed test probe lying along +x, its needle at the origin. */
function TestProbe({ id }: { id: string }) {
  return (
    <>
      <path d="M0 0L4.8 -0.5V0.5Z" fill={url(`${id}n`)} />
      <rect x="4.5" y="-2" width="1.4" height="4" rx="0.55" fill={url(`${id}p`)} />
      <rect x="5.7" y="-1.35" width="10" height="2.7" rx="1.2" fill={url(`${id}p`)} />
      <rect x="15.4" y="-0.95" width="2.2" height="1.9" rx="0.6" fill={url(`${id}p`)} />
      <path d="M6.6 -0.75H14.8" stroke="#fff" strokeWidth="0.4" strokeLinecap="round" opacity="0.35" />
      <path d="M11.5 -1.35v2.7M12.6 -1.35v2.7M13.7 -1.35v2.7" stroke="#000" strokeWidth="0.3" opacity="0.25" />
    </>
  )
}

function ContinuityTester({ id }: ArtProps) {
  const holes: [number, number][] = [[24, 14.5]]
  for (let i = 0; i < 6; i++) holes.push(pt(24, 14.5, 2.15, i * 60 - 90))
  for (let i = 0; i < 12; i++) holes.push(pt(24, 14.5, 4, i * 30 - 75))
  return (
    <>
      <defs>
        <V id={`${id}h`} stops={['#fde047', '#f59e0b', '#b45309']} />
        <R id={`${id}g`} stops={['#71717a', '#3f3f46', '#18181b']} />
        <R id={`${id}l`} stops={['#f0fdf4', '#4ade80', '#15803d']} />
        <V id={`${id}n`} stops={STEEL_ROUND} />
        <V id={`${id}p`} stops={['#fca5a5', '#dc2626', '#7f1d1d']} />
      </defs>
      <Shadow y={44} rx={20} />
      {/* the beep */}
      <g fill="none" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" opacity="0.8">
        <path d="M35.33 9.22A12.5 12.5 0 0 1 35.33 19.78" />
        <path d="M38.05 7.95A15.5 15.5 0 0 1 38.05 21.05" />
        <path d="M12.67 9.22A12.5 12.5 0 0 0 12.67 19.78" />
        <path d="M9.95 7.95A15.5 15.5 0 0 0 9.95 21.05" />
      </g>
      {/* a red pointed probe and a black clip */}
      <path d="M21 30.6C21 33.6 21.85 36.14 19.5 37" fill="none" stroke="#b91c1c" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M27 30.6C27 36 30.6 39.6 33.5 39.1" fill="none" stroke="#18181b" strokeWidth="1.3" strokeLinecap="round" />
      <g transform="translate(3 43) rotate(-20)">
        <TestProbe id={id} />
      </g>
      <g transform="translate(45.5 37) rotate(-10) scale(-0.5 0.5)">
        <Clip id={`${id}c`} boot={BLACK_BOOT} open={10} />
      </g>
      <rect x="20" y="28.4" width="2" height="3" rx="0.6" fill="#991b1b" />
      <rect x="26" y="28.4" width="2" height="3" rx="0.6" fill="#27272a" />
      {/* the box */}
      <rect x="15" y="5.8" width="18" height="24.4" rx="3.4" fill="#92400e" />
      <rect x="15" y="5" width="18" height="24.4" rx="3.4" fill={url(`${id}h`)} />
      <rect x="17" y="5.9" width="14" height="1" rx="0.5" fill="#fff" opacity="0.45" />
      <path d="M16.2 8V26.4" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" opacity="0.3" />
      {/* the buzzer grille */}
      <circle cx="24" cy="14.5" r="6" fill="#27272a" />
      <circle cx="24" cy="14.5" r="5.3" fill={url(`${id}g`)} />
      {holes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 0.6 : 0.45} fill="#09090b" />
      ))}
      {/* the light: green means joined */}
      <circle cx="24" cy="24.3" r="3.7" fill="#4ade80" opacity="0.35" />
      <circle cx="24" cy="24.3" r="2.1" fill="#27272a" />
      <circle cx="24" cy="24.3" r="1.5" fill={url(`${id}l`)} />
      <circle cx="23.5" cy="23.8" r="0.45" fill="#fff" opacity="0.85" />
    </>
  )
}

function ClampMeter({ id }: ArtProps) {
  const cx = 24
  const cy = 11.6
  const R1 = 9.6
  const R0 = 5.7
  const jaw = (a1: number, a2: number) =>
    `M${at(cx, cy, R1, a1)}A${R1} ${R1} 0 0 1 ${at(cx, cy, R1, a2)}L${at(cx, cy, R0, a2)}A${R0} ${R0} 0 0 0 ${at(cx, cy, R0, a1)}Z`
  const ticks = [-120, -80, -40, 0, 40, 80, 120]
  return (
    <>
      <defs>
        <V id={`${id}j`} stops={['#71717a', '#3f3f46', '#18181b']} />
        <V id={`${id}h`} stops={['#f87171', '#dc2626', '#991b1b']} />
        <V id={`${id}f`} stops={['#3f3f46', '#18181b']} />
        <V id={`${id}s`} stops={LCD} />
        <R id={`${id}k`} stops={['#71717a', '#27272a', '#09090b']} />
        <V id={`${id}y`} stops={['#fde047', '#eab308']} />
      </defs>
      <Shadow y={45.2} rx={14} />
      {/* the wire being measured runs through the jaws */}
      <path d="M1.5 9.6C12 10.4 34 12.4 46.5 13.4" fill="none" stroke="#1d4ed8" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M1.8 9.1C12 9.9 34 11.9 46.2 12.9" fill="none" stroke="#93c5fd" strokeWidth="0.5" strokeLinecap="round" opacity="0.8" />
      {/* the jaws, nearly closed around it */}
      <path d={jaw(101, 262)} fill={url(`${id}j`)} stroke="#71717a" strokeWidth="0.3" />
      <path d={jaw(278, 439)} fill={url(`${id}j`)} stroke="#71717a" strokeWidth="0.3" />
      <path d={jaw(254, 262)} fill={url(`${id}y`)} />
      <path d={jaw(278, 286)} fill={url(`${id}y`)} />
      <path
        d={`M${at(cx, cy, R1 - 0.75, 190)}A${R1 - 0.75} ${R1 - 0.75} 0 0 1 ${at(cx, cy, R1 - 0.75, 245)}`}
        fill="none"
        stroke="#fff"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* the trigger that opens the jaws */}
      <path d="M15.4 21.4C12.6 21.7 11.5 23.6 11.7 26C11.9 28 13.1 28.9 15.4 28.9Z" fill="#27272a" />
      <path d="M14.6 22.3C13.2 22.7 12.6 23.8 12.6 25.2" fill="none" stroke="#fff" strokeWidth="0.45" strokeLinecap="round" opacity="0.3" />
      {/* the body */}
      <path d="M20 17.6H28L30.6 21H17.4Z" fill="#27272a" />
      <rect x="31.3" y="23.4" width="2.4" height="3.8" rx="0.8" fill={url(`${id}y`)} />
      <rect x="15" y="19.4" width="18" height="24.8" rx="3.6" fill={url(`${id}h`)} />
      <rect x="17" y="20.2" width="14" height="0.9" rx="0.45" fill="#fff" opacity="0.4" />
      <rect x="17" y="21.6" width="14" height="21" rx="2.2" fill={url(`${id}f`)} />
      <rect x="18.3" y="22.9" width="11.4" height="6.8" rx="0.9" fill={url(`${id}s`)} />
      <Readout x={19.1} y={24.2} value="2.35" w={2.2} h={4.2} t={0.55} gap={0.65} on="#1f2a16" />
      <path d="M27.4 28.4l.85-2.6.85 2.6M27.75 27.5h1" fill="none" stroke="#1f2a16" strokeWidth="0.45" strokeLinejoin="round" />
      <rect x="18.3" y="22.9" width="11.4" height="1.3" rx="0.65" fill="#fff" opacity="0.3" />
      {/* the dial */}
      <circle cx="24" cy="35.6" r="4" fill="#27272a" stroke="#52525b" strokeWidth="0.4" />
      {ticks.map((a) => (
        <rect
          key={a}
          x="23.65"
          y="30.2"
          width="0.7"
          height="0.9"
          rx="0.25"
          fill={a === -40 ? '#facc15' : '#e4e4e7'}
          opacity={a === -40 ? 1 : 0.55}
          transform={`rotate(${a} 24 35.6)`}
        />
      ))}
      <circle cx="24" cy="35.6" r="3.1" fill={url(`${id}k`)} />
      <rect x="23.1" y="31.8" width="1.8" height="7.6" rx="0.9" fill="#52525b" transform="rotate(-40 24 35.6)" />
      <circle cx="22.5" cy="33.8" r="0.5" fill="#fff" />
      {[19.4, 28.6].map((x, i) => (
        <circle key={x} cx={x} cy="40.6" r="0.95" fill="#0a0a0a" stroke={i ? '#dc2626' : '#52525b'} strokeWidth="0.45" />
      ))}
    </>
  )
}

function UsbMeter({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}m`} stops={STEEL} />
        <V id={`${id}b`} stops={['#64748b', '#334155', '#1e293b']} />
      </defs>
      <Shadow y={37} rx={21} />
      {/* the plug that goes into the charger */}
      <rect x="2.6" y="20.4" width="10" height="7.2" rx="0.5" fill={url(`${id}m`)} stroke="#71717a" strokeWidth="0.25" />
      <rect x="4.6" y="21.5" width="1.8" height="1.6" rx="0.2" fill="#3f3f46" />
      <rect x="8.2" y="21.5" width="1.8" height="1.6" rx="0.2" fill="#3f3f46" />
      <path d="M3.4 20.9H11.8" stroke="#fff" strokeWidth="0.4" strokeLinecap="round" opacity="0.7" />
      {/* the socket where the phone's cable goes in */}
      <rect x="37.2" y="18.6" width="8.4" height="10.8" rx="0.7" fill={url(`${id}m`)} stroke="#71717a" strokeWidth="0.25" />
      <rect x="38.3" y="19.6" width="6.2" height="8.8" rx="0.3" fill="#0a0a0a" />
      <rect x="38.9" y="19.9" width="2.2" height="8.2" rx="0.3" fill="#2563eb" />
      {[21, 22.9, 24.8, 26.7].map((y) => (
        <rect key={y} x="41.1" y={y} width="0.6" height="1" rx="0.15" fill="#fbbf24" />
      ))}
      {/* the body with its little colour screen */}
      <rect x="11.6" y="16.8" width="26.2" height="16.8" rx="2.6" fill="#0f172a" />
      <rect x="11.6" y="15.6" width="26.2" height="16.8" rx="2.6" fill={url(`${id}b`)} />
      <rect x="13.4" y="16.2" width="22.6" height="0.8" rx="0.4" fill="#fff" opacity="0.25" />
      <rect x="13.6" y="17.6" width="18.2" height="13" rx="1" fill="#0a0a0a" />
      <rect x="14.4" y="18.4" width="16.6" height="11.4" rx="0.4" fill="#020617" />
      <Readout x={15.4} y={19.4} value="5.10" w={2.3} h={4} t={0.55} gap={0.7} on="#facc15" />
      <path d="M24.5 19.6l.85 3.8.85-3.8" fill="none" stroke="#facc15" strokeWidth="0.5" strokeLinejoin="round" />
      <Readout x={15.4} y={24.8} value="0.42" w={2.3} h={4} t={0.55} gap={0.7} on="#22d3ee" />
      <path d="M24.5 28.8l.85-3.8.85 3.8M24.9 27.4h.9" fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeLinejoin="round" />
      {[2, 3, 4].map((h, i) => (
        <rect key={h} x={27.7 + i * 1.15} y={r2(28.8 - h)} width="0.8" height={h} rx="0.2" fill="#4ade80" />
      ))}
      <path d="M14.4 18.4h7L16.8 29.8h-2.4z" fill="#fff" opacity="0.05" />
      <circle cx="34.7" cy="24" r="1.35" fill="#1e293b" stroke="#94a3b8" strokeWidth="0.35" />
      <circle cx="34.4" cy="23.7" r="0.4" fill="#fff" opacity="0.35" />
    </>
  )
}

function IrThermometer({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}b`} stops={['#60a5fa', '#2563eb', '#1e3a8a']} />
        <H id={`${id}g`} stops={['#52525b', '#27272a', '#09090b']} />
        <V id={`${id}n`} stops={['#52525b', '#18181b']} />
        <V id={`${id}t`} stops={['#fde047', '#d97706']} />
        <V id={`${id}s`} stops={LCD} />
        <R id={`${id}l`} stops={['#94a3b8', '#1e293b', '#020617']} />
        <radialGradient id={`${id}d`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f87171" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow cx={27} y={43.4} rx={18} />
      {/* the red laser shows where it measures */}
      <path d="M13.4 19.4L4.8 34.6" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round" opacity="0.18" />
      <path d="M13.4 19.4L4.8 34.6" stroke="#ef4444" strokeWidth="0.4" strokeLinecap="round" opacity="0.85" />
      <circle cx="4.6" cy="35" r="2.8" fill={url(`${id}d`)} />
      <circle cx="4.6" cy="35" r="0.9" fill="#ef4444" />
      <circle cx="4.4" cy="34.8" r="0.35" fill="#fff" opacity="0.8" />
      {/* the grip and the trigger */}
      <path d="M29.6 20.8H38L42.2 39.4C42.5 40.9 41.6 42 40.1 42H35.4C34.2 42 33.4 41.3 33.2 40.2Z" fill={url(`${id}g`)} />
      <path d="M33.6 26.6l4.6-.4M34.4 30l4.6-.4M35.2 33.4l4.6-.4M36 36.8l4.6-.4" stroke="#fff" strokeWidth="0.3" opacity="0.2" strokeLinecap="round" />
      <path d="M24.6 21.2H29.4L29.8 27.6C29.9 28.6 29.1 29.1 28.3 28.6C26.4 27.4 25.1 24.7 24.6 21.2Z" fill={url(`${id}t`)} />
      {/* the body, nose first */}
      <path d="M17 9.6H38.6C41.6 9.6 43.6 11.8 43.6 14.8V16.6C43.6 19.6 41.8 21.6 38.8 21.6H17Z" fill={url(`${id}b`)} />
      <path d="M18 10.9H38.4C40.4 10.9 41.8 11.9 42.3 13.4" fill="none" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.45" />
      <path d="M17.6 9.2L12.4 11.6V19.6L17.6 22Z" fill={url(`${id}n`)} />
      <ellipse cx="12.6" cy="15.6" rx="1.15" ry="3.4" fill={url(`${id}l`)} />
      <ellipse cx="12.3" cy="14.4" rx="0.35" ry="1.1" fill="#fff" opacity="0.6" />
      <circle cx="13.6" cy="19.6" r="0.5" fill="#ef4444" />
      {/* the screen */}
      <rect x="26.6" y="11.6" width="14.6" height="7.6" rx="1" fill="#0f172a" />
      <rect x="27.4" y="12.4" width="13" height="6" rx="0.5" fill={url(`${id}s`)} />
      <Readout x={28.4} y={13.4} value="36.6" w={2.3} h={4} t={0.55} gap={0.7} on="#1f2a16" />
      <circle cx="38.2" cy="14" r="0.55" fill="none" stroke="#1f2a16" strokeWidth="0.35" />
      <rect x="27.4" y="12.4" width="13" height="1.1" rx="0.5" fill="#fff" opacity="0.3" />
      <rect x="20" y="14.2" width="4.4" height="2.4" rx="0.8" fill="#1e3a8a" />
      <rect x="20.5" y="14.6" width="3.4" height="0.7" rx="0.35" fill="#93c5fd" opacity="0.6" />
    </>
  )
}

function LogicProbe({ id }: ArtProps) {
  // the three lights: HIGH (on), LOW and PULSE
  const leds = [
    { x: 12.6, on: '#ef4444', off: '#ef4444', lit: true },
    { x: 16, on: '#22c55e', off: '#166534', lit: false },
    { x: 19.4, on: '#facc15', off: '#854d0e', lit: false },
  ]
  return (
    <>
      <defs>
        <V id={`${id}n`} stops={STEEL_ROUND} />
        <V id={`${id}b`} stops={['#94a3b8', '#475569', '#1e293b']} />
        <V id={`${id}c`} stops={['#52525b', '#18181b']} />
      </defs>
      <Shadow y={43.2} rx={20} />
      {/* thin power leads: red to +, black to − */}
      <path d="M28.4 20C31.4 17.6 32.5 11 35.4 10" fill="none" stroke="#dc2626" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M28.8 20.4C32 18.4 31 28.6 36.1 30.4" fill="none" stroke="#18181b" strokeWidth="0.9" strokeLinecap="round" />
      <g transform="translate(45 6.5) rotate(-20) scale(-0.42 0.42)">
        <Clip id={`${id}r`} boot={['#fca5a5', '#ef4444', '#991b1b']} open={9} />
      </g>
      <g transform="translate(46 33) rotate(15) scale(-0.42 0.42)">
        <Clip id={`${id}k`} boot={BLACK_BOOT} open={9} />
      </g>
      {/* the pen-shaped probe, tip down */}
      <g transform="translate(4.5 42) rotate(-42)">
        <path d="M0 0L5 -0.5V0.5Z" fill={url(`${id}n`)} />
        <path d="M4.8 -0.7L8.5 -2.4V2.4L4.8 0.7Z" fill={url(`${id}c`)} />
        <rect x="8.3" y="-2.6" width="22.4" height="5.2" rx="1.5" fill={url(`${id}b`)} />
        <rect x="9.4" y="-2" width="20" height="0.8" rx="0.4" fill="#fff" opacity="0.35" />
        {leds.map((l) => (
          <g key={l.x}>
            {l.lit && <circle cx={l.x} cy="0.3" r="2.2" fill={l.on} opacity="0.4" />}
            <circle cx={l.x} cy="0.3" r="1.2" fill="#0f172a" />
            <circle cx={l.x} cy="0.3" r="0.85" fill={l.lit ? l.on : l.off} />
            <circle cx={l.x - 0.3} cy="0" r="0.3" fill="#fff" opacity={l.lit ? 0.9 : 0.4} />
          </g>
        ))}
        {/* the switch for the kind of chip */}
        <rect x="22.6" y="-1" width="4.2" height="2" rx="0.5" fill="#0f172a" />
        <rect x="22.9" y="-0.7" width="1.8" height="1.4" rx="0.3" fill="#e4e4e7" />
        <rect x="30.4" y="-1.9" width="2.4" height="3.8" rx="0.9" fill={url(`${id}c`)} />
      </g>
    </>
  )
}

function LogicAnalyzer({ id }: ArtProps) {
  const colors = ['#27272a', '#92400e', '#dc2626', '#f97316', '#facc15', '#16a34a', '#2563eb', '#9333ea']
  return (
    <>
      <defs>
        <V id={`${id}m`} stops={['#fafafa', '#d4d4d8', '#a1a1aa', '#71717a']} />
        <V id={`${id}p`} stops={STEEL} />
        <V id={`${id}u`} stops={['#52525b', '#18181b']} />
      </defs>
      <Shadow y={42.4} rx={21} />
      {/* the USB lead to the computer */}
      <path d="M14.2 14.2C9.2 14.2 7.4 12.4 7.4 9" fill="none" stroke="#27272a" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="4.9" y="3.8" width="5" height="5.6" rx="0.9" fill={url(`${id}u`)} />
      <rect x="5.3" y="0.8" width="4.2" height="3.4" rx="0.3" fill={url(`${id}p`)} stroke="#71717a" strokeWidth="0.2" />
      <rect x="6" y="1.5" width="0.9" height="0.8" fill="#3f3f46" />
      <rect x="7.9" y="1.5" width="0.9" height="0.8" fill="#3f3f46" />
      {/* eight wires, one for each signal, ending in test hooks */}
      {colors.map((c, i) => {
        const bx = r2(16.8 + i * 2.2)
        const ex = r2(5 + i * 5.43)
        return (
          <g key={c}>
            <path d={`M${bx} 23.6C${bx} 29 ${ex} 28.4 ${ex} 33.4`} fill="none" stroke={c} strokeWidth="1.05" strokeLinecap="round" />
            <path d={`M${r2(ex)} 38.6v1.6c0 1-1.3 1-1.3 0`} fill="none" stroke="#a1a1aa" strokeWidth="0.45" strokeLinecap="round" />
            <rect x={r2(ex - 1.15)} y="33" width="2.3" height="6" rx="1" fill={c} stroke="#fff" strokeOpacity="0.18" strokeWidth="0.25" />
            <rect x={r2(ex - 0.75)} y="33.6" width="0.55" height="4.6" rx="0.27" fill="#fff" opacity="0.35" />
            <rect x={r2(ex - 1.15)} y="33" width="2.3" height="1.3" rx="0.6" fill="#000" opacity="0.25" />
          </g>
        )
      })}
      {/* the aluminium box */}
      <rect x="14" y="9.6" width="22" height="14" rx="1.6" fill="#52525b" />
      <rect x="14" y="8.6" width="22" height="14" rx="1.6" fill={url(`${id}m`)} />
      {[11, 12.6, 14.2, 15.8, 17.4, 19, 20.6].map((y) => (
        <path key={y} d={`M15.2 ${y}H34.8`} stroke="#fff" strokeWidth="0.25" opacity="0.35" />
      ))}
      <rect x="15.4" y="9.2" width="19.2" height="0.7" rx="0.35" fill="#fff" opacity="0.8" />
      {/* a square wave, the kind of signal it shows */}
      <path d="M17.4 18.6h2.2v-4h2.6v4h2.2v-4h2.6v4h2.2" fill="none" stroke="#3f3f46" strokeWidth="0.6" strokeLinejoin="round" />
      <circle cx="33" cy="11.6" r="1.4" fill="#4ade80" opacity="0.35" />
      <circle cx="33" cy="11.6" r="0.7" fill="#4ade80" />
      <rect x="15.6" y="21.4" width="18.8" height="2.8" rx="0.5" fill="#18181b" />
      {colors.map((c, i) => (
        <rect key={c} x={r2(16.3 + i * 2.2)} y="22.2" width="1" height="1.2" rx="0.2" fill="#52525b" />
      ))}
    </>
  )
}

function TapeMeasure({ id }: ArtProps) {
  return (
    <>
      <defs>
        <V id={`${id}r`} stops={['#fafafa', '#d4d4d8', '#9ca3af']} />
        <V id={`${id}c`} stops={['#fde047', '#facc15', '#ca8a04']} />
        <R id={`${id}k`} stops={['#52525b', '#27272a', '#09090b']} />
        <R id={`${id}d`} stops={['#fef08a', '#eab308', '#a16207']} />
        <R id={`${id}s`} stops={['#fafafa', '#a1a1aa', '#52525b']} />
        <V id={`${id}t`} stops={['#fefce8', '#fde047', '#eab308']} />
        <V id={`${id}m`} stops={STEEL_ROUND} />
      </defs>
      <Shadow y={41.4} rx={21} />
      {/* the steel ruler */}
      <rect x="2.5" y="34" width="43" height="4.6" rx="0.6" fill={url(`${id}r`)} stroke="#a1a1aa" strokeWidth="0.25" />
      <rect x="3.4" y="37.2" width="41.2" height="0.5" rx="0.25" fill="#fff" opacity="0.7" />
      {Array.from({ length: 33 }, (_, i) => (
        <path key={i} d={`M${r2(4 + i * 1.2)} 34v${i % 5 === 0 ? 1.9 : 1}`} stroke="#52525b" strokeWidth="0.22" />
      ))}
      <circle cx="43.6" cy="36.6" r="0.75" fill="#3f3f46" />
      {/* the tape, pulled out, with its hook */}
      <rect x="4.4" y="24.6" width="17" height="3.2" fill={url(`${id}t`)} />
      {Array.from({ length: 20 }, (_, i) => (
        <path key={i} d={`M${r2(5.6 + i * 0.8)} 24.6v${i % 5 === 0 ? 1.5 : 0.75}`} stroke="#18181b" strokeWidth="0.2" />
      ))}
      {[7.6, 11.6, 15.6].map((x) => (
        <rect key={x} x={x - 0.5} y="26.2" width="1" height="0.9" rx="0.15" fill={x === 11.6 ? '#dc2626' : '#18181b'} opacity="0.8" />
      ))}
      <path d="M4.8 23.8H3.2V29.2H4.8Z" fill={url(`${id}m`)} />
      <circle cx="5.6" cy="25.6" r="0.3" fill="#71717a" />
      <circle cx="5.6" cy="26.9" r="0.3" fill="#71717a" />
      {/* the case: belt clip, lock and the round middle */}
      <rect x="43.2" y="11.4" width="2.2" height="15" rx="0.8" fill={url(`${id}m`)} />
      <rect x="24" y="4.6" width="6.4" height="3" rx="1" fill="#27272a" />
      <path d="M25.2 5.2v1.8M26.4 5.2v1.8M27.6 5.2v1.8M28.8 5.2v1.8" stroke="#71717a" strokeWidth="0.3" />
      <path
        d="M21 28V12C21 9.2 23.2 7 26 7H38.5C41.6 7 44 9.4 44 12.5V25.4C44 28 42 30 39.4 30H23C21.9 30 21 29.1 21 28Z"
        fill={url(`${id}c`)}
      />
      <path d="M23 8.6C24 8 25 7.9 26 7.9H38" fill="none" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />
      <circle cx="32.8" cy="18.6" r="7.2" fill={url(`${id}d`)} stroke={url(`${id}k`)} strokeWidth="1.2" />
      <circle cx="32.8" cy="18.6" r="5.6" fill="none" stroke="#a16207" strokeWidth="0.3" opacity="0.6" />
      <circle cx="32.8" cy="18.6" r="2.2" fill={url(`${id}s`)} stroke="#3f3f46" strokeWidth="0.3" />
      <path d="M31.6 18.6H34" stroke="#3f3f46" strokeWidth="0.45" strokeLinecap="round" />
      <path d="M27.4 14.2A6.6 6.6 0 0 1 30.6 12.2" fill="none" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.3" />
      <rect x="20.2" y="24" width="2" height="4.4" rx="0.5" fill="#18181b" />
    </>
  )
}

function Loupe({ id }: ArtProps) {
  const cx = 19
  const cy = 18.5
  const lens = 12.2
  // a resistor: the same one is drawn small on the table and big in the glass
  const body =
    'M15.4 17.3h1.6c.5 0 .8.3 1.2.3h1.6c.4 0 .7-.3 1.2-.3h1.6a1.2 1.2 0 0 1 0 2.4h-1.6c-.5 0-.8-.3-1.2-.3h-1.6c-.4 0-.7.3-1.2.3h-1.6a1.2 1.2 0 0 1 0-2.4z'
  const bands: [number, string][] = [
    [15.5, '#78350f'],
    [17.1, '#18181b'],
    [20.4, '#dc2626'],
    [22.2, '#d4a017'],
  ]
  return (
    <>
      <defs>
        <R id={`${id}g`} cx={0.4} cy={0.35} r={0.8} stops={['#f8fafc', '#e0f2fe', '#bae6fd']} />
        <V id={`${id}rb`} stops={['#f6e7c6', '#e2c592', '#b8925a']} />
        <V id={`${id}rim`} stops={['#71717a', '#27272a', '#09090b']} />
        <V id={`${id}f`} stops={STEEL_ROUND} />
        <V id={`${id}w`} stops={['#b45309', '#78350f', '#451a03']} />
        <clipPath id={`${id}clip`}>
          <circle cx={cx} cy={cy} r={lens} />
        </clipPath>
        <clipPath id={`${id}body`}>
          <path d={body} />
        </clipPath>
      </defs>
      <Shadow cx={26} y={44} rx={18} />
      {/* the resistor's thin legs, outside the glass */}
      <path d="M2.4 18.5H8M30 18.5H36.6" stroke="#a1a1aa" strokeWidth="0.55" strokeLinecap="round" />
      {/* the handle */}
      <g transform={`translate(${r2(cx + lens * 0.707)} ${r2(cy + lens * 0.707)}) rotate(45)`}>
        <rect x="-0.4" y="-1.5" width="1.6" height="3" fill="#27272a" />
        <rect x="0.9" y="-2.1" width="3" height="4.2" rx="0.5" fill={url(`${id}f`)} />
        <path d="M2 -2.1v4.2M2.9 -2.1v4.2" stroke="#52525b" strokeWidth="0.25" />
        <rect x="3.6" y="-2.7" width="17.6" height="5.4" rx="2.7" fill={url(`${id}w`)} />
        <path d="M5 -1.6H19.4" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.3" />
        <path d="M8 -2.7v5.4M11 -2.7v5.4M14 -2.7v5.4" stroke="#000" strokeWidth="0.3" opacity="0.2" />
        <circle cx="19" cy="0" r="0.75" fill="#1c0a00" />
      </g>
      {/* the glass, and the resistor seen big through it */}
      <circle cx={cx} cy={cy} r={lens} fill={url(`${id}g`)} />
      <g clipPath={url(`${id}clip`)}>
        <g transform={`translate(${cx} ${cy}) scale(2.2) translate(${-cx} ${-cy})`}>
          <path d="M5 18.5H14.6M23.4 18.5H33" stroke="#a1a1aa" strokeWidth="0.5" strokeLinecap="round" />
          <path d="M5 18.35H14.6M23.4 18.35H33" stroke="#fff" strokeWidth="0.15" opacity="0.7" />
          <path d={body} fill={url(`${id}rb`)} />
          <g clipPath={url(`${id}body`)}>
            {bands.map(([x, c]) => (
              <rect key={x} x={x} y="17" width="0.6" height="3" fill={c} />
            ))}
          </g>
          <path d="M14.8 17.9c.3-.2.6-.3 1-.3h1.2M21.4 17.6h1.2" fill="none" stroke="#fff" strokeWidth="0.25" strokeLinecap="round" opacity="0.6" />
        </g>
        <circle cx={cx} cy={cy} r={lens} fill="#38bdf8" opacity="0.08" />
      </g>
      {/* the rim and a shine on the glass */}
      <circle cx={cx} cy={cy} r={lens} fill="none" stroke={url(`${id}rim`)} strokeWidth="2.4" />
      <circle cx={cx} cy={cy} r={lens - 1.1} fill="none" stroke="#fff" strokeWidth="0.35" opacity="0.5" />
      <path
        d={`M${at(cx, cy, 9.4, 196)}A9.4 9.4 0 0 1 ${at(cx, cy, 9.4, 246)}`}
        fill="none"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.85"
      />
    </>
  )
}

export { ContinuityTester, ClampMeter, UsbMeter, IrThermometer, LogicProbe, LogicAnalyzer, TapeMeasure, Loupe }
