import { useId, type CSSProperties, type ReactNode } from 'react'
import type { PartType } from '@/circuit/types'
import { cn } from '@/lib/utils'

/*
 * Small drawings of each part, made to match the 3D models on the board:
 * the same copper-ended battery, wooden knife switch, colour-banded resistor
 * and so on. Light comes from the top left; every part sits on a soft shadow.
 */

type ArtProps = { id: string }

function Shadow({ y = 42, rx = 14 }: { y?: number; rx?: number }) {
  return <ellipse cx="24" cy={y} rx={rx} ry="2.2" fill="currentColor" opacity="0.12" />
}

function Battery({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="1" stopColor="#18181b" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="0.55" stopColor="#d97706" />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
      </defs>
      <Shadow y={36} rx={18} />
      <rect x="41" y="20.5" width="3.5" height="7" rx="1.4" fill="#a1a1aa" />
      <rect x="5" y="15.5" width="37" height="17" rx="4.5" fill={`url(#${id}b)`} />
      <path d="M29 15.5h8.5a4.5 4.5 0 0 1 4.5 4.5v8a4.5 4.5 0 0 1-4.5 4.5H29z" fill={`url(#${id}c)`} />
      <path d="M35.5 21.5v5M33 24h5" stroke="#451a03" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="8" y="17.5" width="31" height="2.2" rx="1.1" fill="#fff" opacity="0.22" />
    </>
  )
}

function Switch({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ecc28f" />
          <stop offset="1" stopColor="#b9814a" />
        </linearGradient>
      </defs>
      <Shadow y={41} rx={19} />
      <rect x="5" y="30" width="38" height="9" rx="2.5" fill={`url(#${id}w)`} />
      <rect x="6.5" y="30.8" width="35" height="1.6" rx="0.8" fill="#fff" opacity="0.35" />
      <circle cx="8.5" cy="35" r="1.5" fill="#eab308" />
      <circle cx="39.5" cy="35" r="1.5" fill="#eab308" />
      <rect x="11" y="23" width="5" height="8" rx="1" fill="#c2410c" />
      <rect x="32" y="23" width="5" height="8" rx="1" fill="#c2410c" />
      <rect x="11" y="23" width="5" height="1.6" rx="0.8" fill="#fdba74" opacity="0.7" />
      <rect x="32" y="23" width="5" height="1.6" rx="0.8" fill="#fdba74" opacity="0.7" />
      <path d="M13.5 25.5 33 12.5" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
      <path d="M13.8 24.6 32.4 12.2" stroke="#fed7aa" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
      <rect x="31" y="7.5" width="6" height="7.5" rx="3" transform="rotate(-34 34 11.25)" fill="#ef4444" />
      <circle cx="13.5" cy="25.5" r="1.6" fill="#7c2d12" />
    </>
  )
}

function Button({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4b5563" />
          <stop offset="1" stopColor="#111827" />
        </linearGradient>
      </defs>
      <Shadow y={42} rx={16} />
      <rect x="12" y="36" width="2.2" height="5" fill="#a1a1aa" />
      <rect x="33.8" y="36" width="2.2" height="5" fill="#a1a1aa" />
      <rect x="8" y="21" width="32" height="17" rx="4" fill={`url(#${id}d)`} />
      <ellipse cx="24" cy="22.5" rx="12" ry="4.2" fill="#6b7280" />
      <path d="M15.5 14.5v6a8.5 3.3 0 0 0 17 0v-6z" fill="#db2777" />
      <ellipse cx="24" cy="14.5" rx="8.5" ry="3.3" fill="#f472b6" />
      <ellipse cx="21.5" cy="13.8" rx="3.6" ry="1.1" fill="#fff" opacity="0.45" />
    </>
  )
}

function Dimmer({ id }: ArtProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}t`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#5eead4" />
          <stop offset="1" stopColor="#0f766e" />
        </radialGradient>
        <radialGradient id={`${id}k`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="1" stopColor="#09090b" />
        </radialGradient>
      </defs>
      <Shadow y={43} rx={12} />
      <rect x="16" y="32" width="2.2" height="10" fill="#a1a1aa" />
      <rect x="22.9" y="32" width="2.2" height="10" fill="#a1a1aa" />
      <rect x="29.8" y="32" width="2.2" height="10" fill="#a1a1aa" />
      <circle cx="24" cy="21" r="14" fill={`url(#${id}t)`} />
      {[-120, -60, 0, 60, 120].map((a) => (
        <rect key={a} x="23.4" y="8.2" width="1.2" height="2.6" rx="0.6" fill="#ccfbf1" transform={`rotate(${a} 24 21)`} />
      ))}
      <circle cx="24" cy="21" r="8.5" fill={`url(#${id}k)`} />
      <path d="M24 21l4.6-4.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </>
  )
}

function Resistor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e7c6" />
          <stop offset="1" stopColor="#cfae7c" />
        </linearGradient>
        <clipPath id={`${id}clip`}>
          <rect x="11" y="17" width="26" height="14" rx="7" />
        </clipPath>
      </defs>
      <Shadow y={36} rx={15} />
      <path d="M2.5 24h43" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="11" y="17" width="26" height="14" rx="7" fill={`url(#${id}r)`} />
      <g clipPath={`url(#${id}clip)`}>
        <rect x="16" y="17" width="2.8" height="14" fill="#7c3f12" />
        <rect x="21" y="17" width="2.8" height="14" fill="#1c1917" />
        <rect x="26" y="17" width="2.8" height="14" fill="#7c3f12" />
        <rect x="31.2" y="17" width="2.2" height="14" fill="#d4a017" />
      </g>
      <rect x="13.5" y="19" width="21" height="2" rx="1" fill="#fff" opacity="0.4" />
    </>
  )
}

function Lamp({ id }: ArtProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}g`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#fffdf3" />
          <stop offset="0.7" stopColor="#fef3c7" />
          <stop offset="1" stopColor="#fcd34d" />
        </radialGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6b7280" />
          <stop offset="0.4" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#71717a" />
        </linearGradient>
      </defs>
      <Shadow y={44} rx={9} />
      <path
        d="M14 17a10 10 0 1 1 16.4 7.7c-1.4 1.2-2.1 2.2-2.2 4.3h-8.4c-.1-2.1-.8-3.1-2.2-4.3A10 10 0 0 1 14 17z"
        fill={`url(#${id}g)`}
        stroke="#e7c873"
        strokeWidth="0.8"
      />
      <path d="M21 25v-6M27 25v-6" stroke="#9ca3af" strokeWidth="1" />
      <path d="M21 19l1.2-2.6 1.2 2.6 1.2-2.6 1.2 2.6 1.2-2.6L27 19" fill="none" stroke="#b45309" strokeWidth="1.1" strokeLinejoin="round" />
      <ellipse cx="19.5" cy="12.5" rx="2.2" ry="3.2" fill="#fff" opacity="0.7" />
      <rect x="18.5" y="29" width="11" height="10" rx="1.5" fill={`url(#${id}s)`} />
      <path d="M18.5 32h11M18.5 35.5h11" stroke="#52525b" strokeWidth="0.9" opacity="0.6" />
      <path d="M21 39h6l-1.2 2.6h-3.6z" fill="#3f3f46" />
    </>
  )
}

function Led({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fca5a5" />
          <stop offset="0.45" stopColor="#ef4444" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <Shadow y={44} rx={10} />
      <path d="M21 30v14M27 30v10" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="15" y="27" width="18" height="4" rx="1.4" fill="#dc2626" />
      <path d="M17 28V16.5a7 7 0 0 1 14 0V28z" fill={`url(#${id}l)`} />
      <rect x="19.3" y="13" width="2.2" height="11" rx="1.1" fill="#fff" opacity="0.55" />
      <path d="M22.5 24.5h3l-.6-3.5h-1.8z" fill="#7f1d1d" opacity="0.5" />
    </>
  )
}

function Motor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9ca3af" />
          <stop offset="0.5" stopColor="#4b5563" />
          <stop offset="1" stopColor="#1f2937" />
        </linearGradient>
      </defs>
      <Shadow y={38} rx={17} />
      <rect x="39" y="19" width="4" height="2.6" rx="0.8" fill="#d4d4d8" />
      <rect x="39" y="26.4" width="4" height="2.6" rx="0.8" fill="#d4d4d8" />
      <rect x="16" y="15" width="24" height="18" rx="3.5" fill={`url(#${id}m)`} />
      <rect x="27" y="15" width="4" height="18" fill="#0ea5e9" opacity="0.9" />
      <ellipse cx="16" cy="24" rx="3.2" ry="9" fill="#d1d5db" />
      <rect x="8" y="23" width="8" height="2" rx="1" fill="#e5e7eb" />
      <g transform="translate(8 24)">
        <ellipse cy="-6.2" rx="2.7" ry="5.6" fill="#f97316" />
        <ellipse cy="-6.2" rx="2.7" ry="5.6" fill="#0ea5e9" transform="rotate(120)" />
        <ellipse cy="-6.2" rx="2.7" ry="5.6" fill="#22c55e" transform="rotate(240)" />
        <circle r="1.9" fill="#f4f4f5" stroke="#71717a" strokeWidth="0.6" />
      </g>
    </>
  )
}

function Buzzer({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}z`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
      </defs>
      <Shadow y={38} rx={15} />
      <path d="M10 21v9a13 5 0 0 0 26 0v-9z" fill={`url(#${id}z)`} />
      <rect x="18" y="31.5" width="10" height="2.6" rx="1.1" fill="#8b5cf6" />
      <ellipse cx="23" cy="21" rx="13" ry="5" fill="#52525b" />
      <ellipse cx="23" cy="21" rx="3.4" ry="1.4" fill="#09090b" />
      <path d="M31.5 19.2h2.6M32.8 17.9v2.6" stroke="#e4e4e7" strokeWidth="0.9" strokeLinecap="round" />
      <path
        d="M39 13.5a8 8 0 0 1 0 11M42.5 10.5a12.5 12.5 0 0 1 0 17"
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.75"
      />
    </>
  )
}

function Capacitor({ id }: ArtProps) {
  const can = 'M14 9.5v20a10 3.2 0 0 0 20 0v-20z'
  return (
    <>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="0.4" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="1" stopColor="#a1a1aa" />
        </linearGradient>
        <clipPath id={`${id}clip`}>
          <path d={can} />
        </clipPath>
      </defs>
      <Shadow y={44} rx={10} />
      <path d="M20.5 32v12M27.5 32v10" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" />
      <path d={can} fill={`url(#${id}c)`} />
      <g clipPath={`url(#${id}clip)`}>
        <rect x="26.5" y="6" width="4.6" height="30" fill="#bfdbfe" opacity="0.9" />
        {[16, 21.5, 27].map((y) => (
          <rect key={y} x="27.6" y={y} width="2.4" height="1.1" rx="0.55" fill="#1e3a8a" />
        ))}
      </g>
      <path d="M14 13.2a10 3.2 0 0 0 20 0" fill="none" stroke="#1e3a8a" strokeWidth="0.9" opacity="0.55" />
      <rect x="16.3" y="12.5" width="2.2" height="17" rx="1.1" fill="#fff" opacity="0.35" />
      <ellipse cx="24" cy="9.5" rx="10" ry="3.2" fill="#3b82f6" />
      <ellipse cx="24" cy="9.5" rx="8.4" ry="2.6" fill={`url(#${id}t)`} />
      <path d="M22.4 8.2v2.6M22.4 9.5l3-1.3M22.4 9.5l3 1.3" stroke="#71717a" strokeWidth="0.7" strokeLinecap="round" />
    </>
  )
}

function Diode({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="0.5" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#71717a" />
        </linearGradient>
        <clipPath id={`${id}clip`}>
          <rect x="13" y="18" width="22" height="12" rx="3.5" />
        </clipPath>
      </defs>
      <Shadow y={35} rx={14} />
      <path d="M2.5 24h43" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="13" y="18" width="22" height="12" rx="3.5" fill={`url(#${id}d)`} />
      <g clipPath={`url(#${id}clip)`}>
        <rect x="28" y="18" width="3.6" height="12" fill={`url(#${id}s)`} />
      </g>
      <rect x="15.5" y="19.8" width="17" height="1.8" rx="0.9" fill="#fff" opacity="0.28" />
    </>
  )
}

function Transistor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#0c0c0e" />
        </linearGradient>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b8b94" />
          <stop offset="1" stopColor="#3f3f46" />
        </linearGradient>
      </defs>
      <Shadow y={44} rx={11} />
      <rect x="17.6" y="31" width="2" height="12" rx="0.6" fill="#a1a1aa" />
      <rect x="23" y="31" width="2" height="12" rx="0.6" fill="#a1a1aa" />
      <rect x="28.4" y="31" width="2" height="12" rx="0.6" fill="#a1a1aa" />
      <path d="M14 13a10 4.5 0 0 1 20 0z" fill={`url(#${id}t)`} />
      <path d="M14 13h20v17.5a1.5 1.5 0 0 1-1.5 1.5h-17a1.5 1.5 0 0 1-1.5-1.5z" fill={`url(#${id}f)`} />
      <rect x="14" y="13" width="20" height="0.9" fill="#fff" opacity="0.14" />
      <ellipse cx="20" cy="10.6" rx="3.6" ry="0.9" fill="#fff" opacity="0.25" />
      <rect x="18" y="18.5" width="12" height="1.1" rx="0.55" fill="#d4d4d8" opacity="0.75" />
      <rect x="19.5" y="21.6" width="9" height="1.1" rx="0.55" fill="#d4d4d8" opacity="0.5" />
    </>
  )
}

function Fuse({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0.75" />
          <stop offset="0.18" stopColor="#e0f2fe" stopOpacity="0.5" />
          <stop offset="0.55" stopColor="#f0f9ff" stopOpacity="0.3" />
          <stop offset="0.85" stopColor="#bae6fd" stopOpacity="0.5" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="0.5" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#71717a" />
        </linearGradient>
      </defs>
      <Shadow y={35} rx={18} />
      <rect x="11" y="18.5" width="26" height="11" rx="1.5" fill={`url(#${id}g)`} />
      <path d="M12 23.6Q24 25.6 36 23.6" fill="none" stroke="#c2410c" strokeWidth="0.9" />
      <rect x="12" y="19.7" width="24" height="1.6" rx="0.8" fill="#fff" opacity="0.8" />
      <rect x="12" y="27.3" width="24" height="0.8" rx="0.4" fill="#fff" opacity="0.45" />
      <rect x="5" y="17.5" width="8.5" height="13" rx="2" fill={`url(#${id}m)`} />
      <rect x="34.5" y="17.5" width="8.5" height="13" rx="2" fill={`url(#${id}m)`} />
      <path d="M12.6 18v12M35.4 18v12" stroke="#71717a" strokeWidth="0.8" opacity="0.6" />
      <rect x="6.2" y="18.6" width="5.6" height="1.6" rx="0.8" fill="#fff" opacity="0.6" />
      <rect x="36.2" y="18.6" width="5.6" height="1.6" rx="0.8" fill="#fff" opacity="0.6" />
    </>
  )
}

function Ldr({ id }: ArtProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}c`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#fffbeb" />
          <stop offset="0.7" stopColor="#f5e6c8" />
          <stop offset="1" stopColor="#dcc39a" />
        </radialGradient>
        <radialGradient id={`${id}r`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#f8fafc" stopOpacity="0.9" />
          <stop offset="1" stopColor="#94a3b8" stopOpacity="0.6" />
        </radialGradient>
      </defs>
      <Shadow y={44} rx={10} />
      <path d="M20.5 30v13M27.5 30v13" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="24" cy="20" r="12.5" fill={`url(#${id}r)`} />
      <circle cx="24" cy="20" r="10.6" fill={`url(#${id}c)`} />
      <path
        d="M15.8 14.5H30a1.375 1.375 0 0 1 0 2.75H18a1.375 1.375 0 0 0 0 2.75h12a1.375 1.375 0 0 1 0 2.75H18a1.375 1.375 0 0 0 0 2.75h14.2"
        fill="none"
        stroke="#e2531d"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.1 16a11.6 11.6 0 0 1 6-6.5" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
      <g transform="translate(40.5 7)" stroke="#f59e0b" strokeWidth="1.1" strokeLinecap="round">
        <circle r="2" fill="#fbbf24" stroke="none" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d="M0-3.4v-1.5" transform={`rotate(${a})`} />
        ))}
      </g>
    </>
  )
}

function Solar({ id }: ArtProps) {
  const cells = 'M11.7 10.5h24.6l3.9 21.7H7.8z'
  return (
    <>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f4f5" />
          <stop offset="0.7" stopColor="#a1a1aa" />
          <stop offset="1" stopColor="#8b8b94" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#3355c8" />
          <stop offset="0.5" stopColor="#1e3a8a" />
          <stop offset="1" stopColor="#172554" />
        </linearGradient>
        <clipPath id={`${id}clip`}>
          <path d={cells} />
        </clipPath>
      </defs>
      <Shadow y={39} rx={19} />
      <path d="M5.5 34h37l-.4 2H5.9z" fill="#71717a" />
      <path d="M10 9h28l4.5 25h-37z" fill={`url(#${id}f)`} />
      <path d={cells} fill={`url(#${id}c)`} />
      <path
        d="M17.85 10.5 15.9 32.2M24 10.5v21.7M30.15 10.5 32.1 32.2M10.5 17.2h27M9.2 24.5h29.6"
        stroke="#cbd5e1"
        strokeWidth="0.75"
        opacity="0.9"
      />
      <g clipPath={`url(#${id}clip)`}>
        <path d="M11.7 10.5h9.5L8.4 28z" fill="#fff" opacity="0.14" />
      </g>
      <path d="M10.6 9.7h26.8" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
    </>
  )
}

type MeterProps = ArtProps & { angle: number; accent: [string, string]; glyph: string }

/** Analog panel meter shared by the voltmeter and ammeter. */
function Meter({ id, angle, accent, glyph }: MeterProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="1" stopColor="#18181b" />
        </linearGradient>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e4e4e7" />
        </linearGradient>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent[0]} />
          <stop offset="1" stopColor={accent[1]} />
        </linearGradient>
        <radialGradient id={`${id}r`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fca5a5" />
          <stop offset="1" stopColor="#b91c1c" />
        </radialGradient>
        <radialGradient id={`${id}k`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="1" stopColor="#09090b" />
        </radialGradient>
      </defs>
      <Shadow y={40} rx={18} />
      <rect x="6" y="8.5" width="36" height="29" rx="4.5" fill={`url(#${id}b)`} />
      <rect x="9" y="9.4" width="30" height="1.4" rx="0.7" fill="#fff" opacity="0.2" />
      <rect x="9" y="11.5" width="30" height="16" rx="2.5" fill={`url(#${id}d)`} />
      <path d="M15.96 18.85A10.5 10.5 0 0 1 32.04 18.85" fill="none" stroke="#3f3f46" strokeWidth="0.7" />
      <path d="M29.25 16.51A10.5 10.5 0 0 1 32.04 18.85" fill="none" stroke={accent[1]} strokeWidth="1.6" />
      {[-50, -37.5, -25, -12.5, 0, 12.5, 25, 37.5, 50].map((a, i) => (
        <rect
          key={a}
          x="23.7"
          y={i % 2 ? 13.6 : 12.9}
          width="0.6"
          height={i % 2 ? 1.5 : 2.2}
          fill="#3f3f46"
          transform={`rotate(${a} 24 25.6)`}
        />
      ))}
      <path d="M24 25.6V14.4" stroke="#dc2626" strokeWidth="1.1" strokeLinecap="round" transform={`rotate(${angle} 24 25.6)`} />
      <circle cx="24" cy="25.6" r="1.7" fill="#27272a" />
      <circle cx="12" cy="32.5" r="3.1" fill="#a1a1aa" />
      <circle cx="12" cy="32.5" r="2.3" fill={`url(#${id}k)`} />
      <circle cx="36" cy="32.5" r="3.1" fill="#a1a1aa" />
      <circle cx="36" cy="32.5" r="2.3" fill={`url(#${id}r)`} />
      <circle cx="11.2" cy="31.7" r="0.7" fill="#fff" opacity="0.45" />
      <circle cx="35.2" cy="31.7" r="0.7" fill="#fff" opacity="0.55" />
      <rect x="20.5" y="29" width="7" height="7" rx="1.8" fill={`url(#${id}a)`} />
      <path d={glyph} fill="none" stroke="#fff" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

function Voltmeter({ id }: ArtProps) {
  return <Meter id={id} angle={22} accent={['#60a5fa', '#1d4ed8']} glyph="M22.2 30.9l1.8 3.4 1.8-3.4" />
}

function Ammeter({ id }: ArtProps) {
  return <Meter id={id} angle={-30} accent={['#fdba74', '#ea580c']} glyph="M22.1 34.2 24 30.7l1.9 3.5M22.8 33h2.4" />
}

function Arduino({ id }: ArtProps) {
  // raised black header strip (top face + darker front edge) with its row of pin holes
  const header = (x: number, y: number, n: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={n * 1.3} height="3.3" rx="0.4" fill="#0a0a0a" />
      <rect x={x} y={y} width={n * 1.3} height="2.5" rx="0.4" fill="#2a2a2e" />
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x + 0.28 + i * 1.3} y={y + 0.88} width="0.75" height="0.75" fill="#71717a" />
      ))}
    </g>
  )
  return (
    <>
      <defs>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#26b6bb" />
          <stop offset="1" stopColor="#00777c" />
        </linearGradient>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#141417" />
        </linearGradient>
        <linearGradient id={`${id}u`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="0.6" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#8b8b94" />
        </linearGradient>
      </defs>
      <Shadow y={39.5} rx={19} />
      <rect x="5" y="12.6" width="38" height="24" rx="2.4" fill="#035e62" />
      <rect x="5" y="11" width="38" height="24" rx="2.4" fill={`url(#${id}p)`} />
      <rect x="7" y="11.5" width="34" height="0.8" rx="0.4" fill="#fff" opacity="0.25" />
      <circle cx="13.8" cy="13.4" r="1.15" fill="#e4e4e7" />
      <circle cx="13.8" cy="13.4" r="0.55" fill="#023c3f" />
      <circle cx="40.6" cy="32.6" r="1.15" fill="#e4e4e7" />
      <circle cx="40.6" cy="32.6" r="0.55" fill="#023c3f" />
      {header(16.5, 12, 10)}
      {header(30.2, 12, 8)}
      {header(18, 31, 8)}
      {header(29.6, 31, 6)}
      <rect x="2.5" y="15" width="10" height="7.5" rx="0.8" fill="#71717a" />
      <rect x="2.5" y="15" width="10" height="6.5" rx="0.8" fill={`url(#${id}u)`} />
      <path d="M4.5 17.5h6M4.5 19h6" stroke="#a1a1aa" strokeWidth="0.5" />
      <rect x="2" y="26.2" width="1.6" height="3.6" rx="0.4" fill="#27272a" />
      <rect x="3" y="25" width="8.5" height="6.6" rx="0.8" fill="#000" />
      <rect x="3" y="25" width="8.5" height="5.7" rx="0.8" fill={`url(#${id}h)`} />
      <ellipse cx="16.5" cy="25.6" rx="2.4" ry="1.2" fill={`url(#${id}u)`} />
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i} fill="#d4d4d8">
          <rect x={22.4 + i * 1.95} y="21" width="0.9" height="1.4" />
          <rect x={22.4 + i * 1.95} y="26.4" width="0.9" height="1.4" />
        </g>
      ))}
      <rect x="21.5" y="22" width="18" height="4.9" rx="0.5" fill="#000" />
      <rect x="21.5" y="22" width="18" height="4.1" rx="0.5" fill={`url(#${id}h)`} />
      <path d="M21.5 23.2a0.85 0.85 0 0 1 0 1.7z" fill="#0a0a0a" />
      <rect x="22.3" y="22.4" width="16.4" height="0.7" rx="0.35" fill="#fff" opacity="0.15" />
      <path
        d="M23.5 18C24.5 16.4 26.5 16.4 26.5 18S24.5 19.6 23.5 18 20.5 16.4 20.5 18 22.5 19.6 23.5 18z"
        fill="none"
        stroke="#fff"
        strokeWidth="0.75"
        opacity="0.9"
      />
      <circle cx="37" cy="18.2" r="1.9" fill="#4ade80" opacity="0.35" />
      <circle cx="37" cy="18.2" r="0.85" fill="#22c55e" />
      <circle cx="36.75" cy="17.95" r="0.3" fill="#fff" opacity="0.8" />
    </>
  )
}

/* ---- shared bits for the little sensor modules ---- */

type PcbProps = {
  id: string
  x: number
  y: number
  w: number
  h: number
  light: string
  dark: string
  edge: string
  holes?: [number, number][]
}

/** A module board lying flat, seen from slightly above: lit top face, darker front edge, mounting holes. */
function Pcb({ id, x, y, w, h, light, dark, edge, holes = [] }: PcbProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}pcb`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      <rect x={x} y={y + 1.6} width={w} height={h} rx="2" fill={edge} />
      <rect x={x} y={y} width={w} height={h} rx="2" fill={`url(#${id}pcb)`} />
      <rect x={x + 2} y={y + 0.5} width={w - 4} height="0.8" rx="0.4" fill="#fff" opacity="0.25" />
      {holes.map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="1.15" fill="#e4e4e7" />
          <circle cx={cx} cy={cy} r="0.55" fill={edge} />
        </g>
      ))}
    </>
  )
}

/** Header pins poking down out of a module's front edge (draw before the board). */
function Legs({ xs, y, len }: { xs: number[]; y: number; len: number }) {
  return (
    <>
      {xs.map((x) => (
        <rect key={x} x={x - 0.6} y={y} width="1.2" height={len} rx="0.5" fill="#a1a1aa" />
      ))}
    </>
  )
}

/** The black plastic strip of a pin header, sitting on the board. */
function Strip({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <>
      <rect x={x} y={y} width={w} height="3.2" rx="0.4" fill="#0a0a0a" />
      <rect x={x} y={y} width={w} height="2.4" rx="0.4" fill="#2a2a2e" />
    </>
  )
}

function Servo({ id }: ArtProps) {
  const horn = 'M9.8 10.4 18.5 9.2l8.7 1.2a1.2 1.2 0 0 1 0 2.4L18.5 14l-8.7-1.2a1.2 1.2 0 0 1 0-2.4z'
  const wire = 'M33 30.8c4 0 7.4.8 10.4 4'
  return (
    <>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="0.5" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e40af" />
        </linearGradient>
        <linearGradient id={`${id}e`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#93c5fd" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <Shadow y={40} rx={16} />
      <g fill="none" strokeWidth="1.15" strokeLinecap="round">
        <path d={wire} stroke="#f59e0b" />
        <path d={wire} stroke="#dc2626" transform="translate(-.45 1.1)" />
        <path d={wire} stroke="#78350f" transform="translate(-.9 2.2)" />
      </g>
      <rect x="12" y="14.8" width="22" height="3.4" rx="1.2" fill="#93c5fd" />
      <rect x="12" y="16.6" width="22" height="20.4" rx="1.6" fill={`url(#${id}s)`} />
      <rect x="12" y="20.2" width="22" height="0.6" fill="#1e3a8a" opacity="0.45" />
      <rect x="12" y="33.4" width="22" height="0.6" fill="#1e3a8a" opacity="0.45" />
      <rect x="14" y="18" width="1.8" height="15" rx="0.9" fill="#fff" opacity="0.3" />
      <rect x="17.5" y="28" width="11" height="3.6" rx="0.6" fill="#dbeafe" opacity="0.85" />
      <path d="M19 29.3h8M19 30.5h5" stroke="#1e40af" strokeWidth="0.5" opacity="0.7" />
      <rect x="6.5" y="23.2" width="35" height="3.4" rx="1.2" fill={`url(#${id}e)`} />
      <circle cx="8.9" cy="24.9" r="0.9" fill="#1e3a8a" />
      <circle cx="39.1" cy="24.9" r="0.9" fill="#1e3a8a" />
      <path d="M23.9 15.4v.6a2.6.9 0 0 0 5.2 0v-.6z" fill="#2563eb" />
      <ellipse cx="26.5" cy="15.4" rx="2.6" ry="0.9" fill="#60a5fa" />
      <path d="M13.9 13.4v2.2a4.6 1.6 0 0 0 9.2 0v-2.2z" fill="#2563eb" />
      <ellipse cx="18.5" cy="13.4" rx="4.6" ry="1.6" fill="#60a5fa" />
      <g transform="rotate(-12 18.5 11.6)">
        <g fill="#a1a1aa" transform="translate(0 1)">
          <path d={horn} />
          <circle cx="18.5" cy="11.6" r="2.6" />
        </g>
        <g fill="#fafafa">
          <path d={horn} />
          <circle cx="18.5" cy="11.6" r="2.6" />
        </g>
        {[11.3, 13.6, 23.4, 25.7].map((x) => (
          <circle key={x} cx={x} cy="11.6" r="0.45" fill="#a1a1aa" />
        ))}
        <circle cx="18.5" cy="11.6" r="1" fill="#a1a1aa" />
      </g>
    </>
  )
}

function Thermistor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}b`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fdba74" />
          <stop offset="0.55" stopColor="#f97316" />
          <stop offset="1" stopColor="#c2410c" />
        </radialGradient>
      </defs>
      <Shadow y={44} rx={9} />
      <path
        d="M22.4 27v5l-1.6 2.2V43M25.6 27v5l1.6 2.2V43"
        fill="none"
        stroke="#a1a1aa"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M21.1 22.5h2.6l-.85 7h-.9zM24.3 22.5h2.6l-.85 7h-.9z" fill="#ea580c" />
      <ellipse cx="24" cy="17.8" rx="7" ry="7.3" fill={`url(#${id}b)`} />
      <ellipse cx="21.4" cy="14.2" rx="1.8" ry="2.6" fill="#fff" opacity="0.5" transform="rotate(30 21.4 14.2)" />
      <g fill="none" stroke="#f97316" strokeWidth="1.1" strokeLinecap="round" opacity="0.75">
        <path d="M36.5 15c-1.4-1.4 1.4-2.6 0-4s1.4-2.6 0-4" />
        <path d="M40 13c-1.4-1.4 1.4-2.6 0-4s1.4-2.6 0-4" />
      </g>
    </>
  )
}

function Tilt({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a1a1aa" />
          <stop offset="0.3" stopColor="#fafafa" />
          <stop offset="0.65" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#71717a" />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#18181b" />
          <stop offset="1" stopColor="#3f3f46" />
        </linearGradient>
        <radialGradient id={`${id}b`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#52525b" />
        </radialGradient>
      </defs>
      <Shadow y={43} rx={10} />
      <g transform="rotate(-14 24 42)">
        <path d="M21.5 30v12M26.5 30v12" stroke="#a1a1aa" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M17 11v17.5a7 2 0 0 0 14 0V11z" fill={`url(#${id}c)`} />
        <path d="M17 27.2a7 2 0 0 0 14 0v1.3a7 2 0 0 1-14 0z" fill="#27272a" />
        <ellipse cx="24" cy="11" rx="7" ry="2" fill="#e4e4e7" />
        <rect x="19.6" y="15" width="8.8" height="10.5" rx="2.2" fill={`url(#${id}w)`} />
        <circle cx="25.6" cy="22.6" r="2.7" fill={`url(#${id}b)`} />
        <rect x="18.2" y="13" width="1.2" height="13" rx="0.6" fill="#fff" opacity="0.5" />
      </g>
    </>
  )
}

function Reed({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0.75" />
          <stop offset="0.18" stopColor="#e0f2fe" stopOpacity="0.5" />
          <stop offset="0.55" stopColor="#f0f9ff" stopOpacity="0.3" />
          <stop offset="0.85" stopColor="#bae6fd" stopOpacity="0.5" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`${id}n`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f87171" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <Shadow y={38} rx={17} />
      <path d="M2.5 17.5H11M37 17.5h8.5" stroke="#a1a1aa" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="9" y="13.2" width="30" height="8.6" rx="4.3" fill={`url(#${id}g)`} />
      <path d="M10.5 17.5 26.5 16.5M37.5 17.5 21.5 18.6" stroke="#71717a" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="12" y="14.4" width="24" height="1.4" rx="0.7" fill="#fff" opacity="0.8" />
      <path d="M11.5 27H24v7.5H11.5a1.5 1.5 0 0 1-1.5-1.5v-4.5a1.5 1.5 0 0 1 1.5-1.5z" fill={`url(#${id}n)`} />
      <path d="M24 27h12.5a1.5 1.5 0 0 1 1.5 1.5V33a1.5 1.5 0 0 1-1.5 1.5H24z" fill={`url(#${id}s)`} />
      <rect x="11.5" y="27.8" width="25" height="1.2" rx="0.6" fill="#fff" opacity="0.35" />
      <g fill="none" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.6 32.6V29l2.8 3.6V29" />
        <path d="M33 29.4c-.4-.5-2.6-.8-2.6.6 0 1.5 2.6.7 2.6 2.2 0 1.3-2.2 1.2-2.6.6" />
      </g>
    </>
  )
}

function TempSensor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#0c0c0e" />
        </linearGradient>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b8b94" />
          <stop offset="1" stopColor="#3f3f46" />
        </linearGradient>
      </defs>
      <Shadow y={42} rx={18} />
      <Legs xs={[22, 26, 30]} y={31} len={9.5} />
      <Pcb id={id} x={7} y={17} w={34} h={17} light="#a78bfa" dark="#6d28d9" edge="#4c1d95" holes={[[9.8, 31.2], [38.2, 31.2]]} />
      <Strip x={20} y={29.8} w={12} />
      <g fill="none" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.9">
        <path d="M21 27.4h2M22 26.4v2M25 27.4h2" />
        <path d="M30.8 26.5c-.2-.3-1.6-.4-1.6.3 0 .9 1.6.4 1.6 1.3 0 .7-1.3.7-1.6.3" />
      </g>
      <rect x="24.5" y="20.2" width="3.6" height="1.8" rx="0.3" fill="#18181b" />
      <rect x="24.5" y="20.2" width="0.8" height="1.8" fill="#d4d4d8" />
      <rect x="27.3" y="20.2" width="0.8" height="1.8" fill="#d4d4d8" />
      <rect x="34.9" y="19" width="2.2" height="6" rx="1.1" fill="#fff" />
      <circle cx="36" cy="25.4" r="1.6" fill="#fff" />
      <rect x="35.55" y="21" width="0.9" height="4.4" rx="0.45" fill="#ef4444" />
      <circle cx="36" cy="25.4" r="1" fill="#ef4444" />
      <path d="M13.4 20v5M15.5 20v5M17.6 20v5" stroke="#a1a1aa" strokeWidth="0.9" />
      {[13.4, 15.5, 17.6].map((x) => (
        <ellipse key={x} cx={x} cy="25.2" rx="0.9" ry="0.45" fill="#e4e4e7" />
      ))}
      <path d="M11.5 9a4 2.2 0 0 1 8 0z" fill={`url(#${id}t)`} />
      <path d="M11.5 9h8v10.2a.8.8 0 0 1-.8.8h-6.4a.8.8 0 0 1-.8-.8z" fill={`url(#${id}f)`} />
      <rect x="11.5" y="9" width="8" height="0.7" fill="#fff" opacity="0.14" />
      <rect x="13" y="12.6" width="5" height="0.8" rx="0.4" fill="#d4d4d8" opacity="0.7" />
      <rect x="13.6" y="14.6" width="3.8" height="0.8" rx="0.4" fill="#d4d4d8" opacity="0.45" />
    </>
  )
}

function Ultrasonic({ id }: ArtProps) {
  const eye = (cx: number) => (
    <g key={cx}>
      <circle cx={cx} cy="22.9" r="7.4" fill="#52525b" />
      <circle cx={cx} cy="21.5" r="7.4" fill={`url(#${id}r)`} />
      <circle cx={cx} cy="21.5" r="5.6" fill="#3f3f46" />
      <circle cx={cx} cy="21.5" r="5.6" fill={`url(#${id}m)`} />
      <circle cx={cx} cy="21.5" r="5.6" fill={`url(#${id}v)`} />
      <circle cx={cx} cy="21.5" r="1.3" fill="#27272a" />
    </g>
  )
  return (
    <>
      <defs>
        <radialGradient id={`${id}r`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="0.6" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#71717a" />
        </radialGradient>
        <radialGradient id={`${id}v`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
        <pattern id={`${id}m`} width="1.4" height="1.4" patternUnits="userSpaceOnUse">
          <path d="M0 .7h1.4M.7 0v1.4" stroke="#a1a1aa" strokeWidth="0.35" />
        </pattern>
        <linearGradient id={`${id}x`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="0.6" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#8b8b94" />
        </linearGradient>
      </defs>
      <Shadow y={42} rx={19} />
      <Legs xs={[20.4, 22.8, 25.2, 27.6]} y={30} len={10} />
      <Pcb id={id} x={3.5} y={12.5} w={41} h={19} light="#60a5fa" dark="#1d4ed8" edge="#1e3a8a" />
      <Strip x={19.2} y={28} w={9.6} />
      {eye(13)}
      {eye(35)}
      <rect x="21.2" y="15" width="5.6" height="2.8" rx="1.4" fill={`url(#${id}x)`} />
      <rect x="22.2" y="15.5" width="3.6" height="0.7" rx="0.35" fill="#fff" opacity="0.7" />
      <ellipse cx="10.4" cy="17.4" rx="2.2" ry="1" fill="#fff" opacity="0.35" transform="rotate(-35 10.4 17.4)" />
      <ellipse cx="32.4" cy="17.4" rx="2.2" ry="1" fill="#fff" opacity="0.35" transform="rotate(-35 32.4 17.4)" />
    </>
  )
}

function Pir({ id }: ArtProps) {
  const dome = 'M10 28.5a14 14 0 0 1 28 0z'
  return (
    <>
      <defs>
        <radialGradient id={`${id}d`} cx="0.35" cy="0.25" r="0.85">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#cbd5e1" />
        </radialGradient>
        <clipPath id={`${id}clip`}>
          <path d={dome} />
        </clipPath>
      </defs>
      <Shadow y={42} rx={18} />
      <Legs xs={[20, 24, 28]} y={32} len={8.5} />
      <Pcb id={id} x={5} y={23} w={38} h={11} light="#4ade80" dark="#15803d" edge="#14532d" holes={[[8, 26], [40, 26]]} />
      <Strip x={18.5} y={30.8} w={11} />
      <rect x="9" y="27" width="30" height="3.2" rx="1" fill="#e2e8f0" />
      <rect x="9" y="29.4" width="30" height="0.8" rx="0.4" fill="#94a3b8" opacity="0.6" />
      <path d={dome} fill={`url(#${id}d)`} />
      <g clipPath={`url(#${id}clip)`} fill="none" stroke="#94a3b8" strokeWidth="0.55" opacity="0.75">
        <path d="M11.02 23.26a12.98 2.2 0 0 0 25.96 0M14.1 18.6a9.9 1.7 0 0 0 19.8 0M18.76 15.52a5.24.9 0 0 0 10.48 0" />
        <path d="M34 28.5A10 14 0 0 0 24 14.5M29 28.5A5 14 0 0 0 24 14.5M24 28.5V14.5M19 28.5A5 14 0 0 1 24 14.5M14 28.5A10 14 0 0 1 24 14.5" />
      </g>
      <ellipse cx="18.5" cy="19.5" rx="2.6" ry="4" fill="#fff" opacity="0.7" transform="rotate(35 18.5 19.5)" />
    </>
  )
}

function SoundSensor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a1a1aa" />
          <stop offset="0.3" stopColor="#fafafa" />
          <stop offset="0.65" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#71717a" />
        </linearGradient>
        <pattern id={`${id}m`} width="1.2" height="1.2" patternUnits="userSpaceOnUse">
          <circle cx="0.6" cy="0.6" r="0.28" fill="#52525b" />
        </pattern>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <Shadow y={42} rx={18} />
      <Legs xs={[19.5, 22.5, 25.5, 28.5]} y={31} len={9.5} />
      <Pcb id={id} x={6} y={20} w={36} h={14} light="#64748b" dark="#334155" edge="#1e293b" holes={[[9, 31], [39.2, 31.2]]} />
      <Strip x={18} y={30} w={12} />
      <path d="M8.5 12v12a6.5 2.2 0 0 0 13 0V12z" fill={`url(#${id}c)`} />
      <ellipse cx="15" cy="12" rx="6.5" ry="2.2" fill="#e4e4e7" />
      <ellipse cx="15" cy="12" rx="5.2" ry="1.7" fill="#18181b" />
      <ellipse cx="15" cy="12" rx="5.2" ry="1.7" fill={`url(#${id}m)`} />
      <rect x="10" y="14" width="1.3" height="10" rx="0.65" fill="#fff" opacity="0.55" />
      <rect x="26" y="20.5" width="9" height="5.5" rx="0.6" fill={`url(#${id}p)`} />
      <rect x="26" y="17.5" width="9" height="3.4" rx="0.6" fill="#93c5fd" />
      <ellipse cx="32.6" cy="19.2" rx="1.5" ry="0.8" fill="#fbbf24" />
      <path d="M31.5 19.2h2.2" stroke="#92400e" strokeWidth="0.5" strokeLinecap="round" />
      <circle cx="37.8" cy="22.8" r="1.5" fill="#f87171" opacity="0.4" />
      <circle cx="37.8" cy="22.8" r="0.7" fill="#ef4444" />
      <circle cx="37.8" cy="26.6" r="1.5" fill="#4ade80" opacity="0.4" />
      <circle cx="37.8" cy="26.6" r="0.7" fill="#22c55e" />
      <path
        d="M4.2 8.5a6 6 0 0 1 0 7M2 6.5a9 9 0 0 1 0 11"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.75"
      />
    </>
  )
}

function GasSensor({ id }: ArtProps) {
  const mesh = 'M16.5 10.5v13.7a7.5 2.1 0 0 0 15 0V10.5z'
  return (
    <>
      <defs>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fb923c" />
          <stop offset="0.35" stopColor="#ea580c" />
          <stop offset="1" stopColor="#7c2d12" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a1a1aa" />
          <stop offset="0.3" stopColor="#f4f4f5" />
          <stop offset="0.65" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#71717a" />
        </linearGradient>
        <pattern id={`${id}m`} width="1.3" height="1.3" patternUnits="userSpaceOnUse">
          <path d="M0 0l1.3 1.3M1.3 0 0 1.3" stroke="#52525b" strokeWidth="0.3" />
        </pattern>
      </defs>
      <Shadow y={43} rx={18} />
      <Legs xs={[19.5, 22.5, 25.5, 28.5]} y={33} len={8.5} />
      <Pcb id={id} x={6} y={22} w={36} h={13} light="#60a5fa" dark="#1d4ed8" edge="#1e3a8a" holes={[[9, 25], [39, 25]]} />
      <Strip x={18} y={31.4} w={12} />
      <circle cx="36.5" cy="31.6" r="1.5" fill="#f87171" opacity="0.4" />
      <circle cx="36.5" cy="31.6" r="0.7" fill="#ef4444" />
      <circle cx="39.6" cy="31.6" r="1.5" fill="#4ade80" opacity="0.4" />
      <circle cx="39.6" cy="31.6" r="0.7" fill="#22c55e" />
      <path d="M14.5 24.2v3a9.5 2.6 0 0 0 19 0v-3z" fill={`url(#${id}r)`} />
      <ellipse cx="24" cy="24.2" rx="9.5" ry="2.6" fill="#fdba74" />
      <path d={mesh} fill={`url(#${id}c)`} />
      <path d={mesh} fill={`url(#${id}m)`} />
      <ellipse cx="24" cy="10.5" rx="7.5" ry="2.1" fill="#e4e4e7" />
      <ellipse cx="24" cy="10.5" rx="7.5" ry="2.1" fill={`url(#${id}m)`} />
      <rect x="18.4" y="12.5" width="1.6" height="11" rx="0.8" fill="#fff" opacity="0.5" />
      <g fill="#a1a1aa" opacity="0.55">
        <circle cx="36.5" cy="10.5" r="2" />
        <circle cx="39.6" cy="8.6" r="2.6" />
        <circle cx="42.4" cy="10.8" r="1.8" />
      </g>
    </>
  )
}

function SoilSensor({ id }: ArtProps) {
  const fork = 'M14 6.5h20a2 2 0 0 1 2 2V16l-1.5 1.5V38l-3 3.5-3-3.5V17.5h-9V38l-3 3.5-3-3.5V17.5L12 16V8.5a2 2 0 0 1 2-2z'
  const drop = (x: number, y: number, s = 1) => (
    <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0-2.8c1.1 1.4 2 2.5 2 3.5a2 2 0 0 1-4 0c0-1 .9-2.1 2-3.5z" fill="#38bdf8" />
      <ellipse cx="-0.7" cy="0.4" rx="0.5" ry="0.8" fill="#fff" opacity="0.7" />
    </g>
  )
  return (
    <>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22c55e" />
          <stop offset="1" stopColor="#14532d" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#eab308" />
          <stop offset="1" stopColor="#a16207" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a16207" />
          <stop offset="1" stopColor="#57300c" />
        </linearGradient>
      </defs>
      <Shadow y={43.4} rx={18} />
      <rect x="21" y="2.8" width="1.2" height="5" rx="0.5" fill="#a1a1aa" />
      <rect x="25.8" y="2.8" width="1.2" height="5" rx="0.5" fill="#a1a1aa" />
      <path d={fork} fill="#0f3d22" transform="translate(.8 1)" />
      <path d={fork} fill={`url(#${id}f)`} />
      <rect x="14" y="7" width="20" height="0.8" rx="0.4" fill="#fff" opacity="0.25" />
      <rect x="15" y="15.5" width="3" height="22" rx="1.5" fill={`url(#${id}g)`} />
      <rect x="30" y="15.5" width="3" height="22" rx="1.5" fill={`url(#${id}g)`} />
      <path d="M16.5 15.8V11.5h5.1V9M31.5 15.8V11.5h-5.1V9" fill="none" stroke="#eab308" strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx="21.6" cy="8.9" r="1.2" fill="#fde68a" />
      <circle cx="26.4" cy="8.9" r="1.2" fill="#fde68a" />
      <path
        d="M5 36c3-1.4 6-1.6 9-.8s6 1.2 9 .2 6-1.4 9-.4 7 .8 11 .2v4.6c0 1.8-8 2.8-19 2.8S5 41.6 5 39.8z"
        fill={`url(#${id}s)`}
      />
      <path d="M5 36c3-1.4 6-1.6 9-.8s6 1.2 9 .2 6-1.4 9-.4 7 .8 11 .2" fill="none" stroke="#c08457" strokeWidth="0.8" opacity="0.8" />
      <g fill="#d6a46c" opacity="0.7">
        <circle cx="10" cy="38.6" r="0.7" />
        <circle cx="22.5" cy="39.8" r="0.6" />
        <circle cx="37" cy="38.4" r="0.8" />
        <circle cx="28" cy="38" r="0.5" />
      </g>
      {drop(8.5, 27)}
      {drop(39.5, 23)}
      {drop(41, 30.5, 0.7)}
    </>
  )
}

function TouchSensor({ id }: ArtProps) {
  return (
    <>
      <Shadow y={42} rx={16} />
      <Legs xs={[21, 24, 27]} y={31} len={9.5} />
      <Pcb id={id} x={9} y={11} w={30} h={22} light="#f87171" dark="#b91c1c" edge="#7f1d1d" holes={[[11.8, 13.8], [36.2, 13.8]]} />
      <Strip x={19} y={29.6} w={10} />
      <circle cx="24" cy="20.5" r="7.2" fill="#fecaca" opacity="0.3" />
      <circle cx="24" cy="20.5" r="7.2" fill="none" stroke="#fff" strokeWidth="0.9" opacity="0.9" />
      <g fill="none" stroke="#fff" strokeWidth="0.75" strokeLinecap="round" opacity="0.9">
        <path d="M22.6 23.8v-1.3a1.4 1.4 0 0 1 2.8 0v2.3" />
        <path d="M20.8 24.8v-2.3a3.2 3.2 0 0 1 6.4 0v1.2" />
        <path d="M19 23.6v-1.1a5 5 0 0 1 10 0v2.6" />
      </g>
      <g fill="#a1a1aa">
        {[12.3, 13.4, 14.5].map((x) => (
          <g key={x}>
            <rect x={x} y="27.9" width="0.5" height="0.7" />
            <rect x={x} y="30.6" width="0.5" height="0.7" />
          </g>
        ))}
      </g>
      <rect x="11.8" y="28.5" width="3.4" height="2.2" rx="0.3" fill="#18181b" />
      <circle cx="35.5" cy="29.4" r="2" fill="#fde047" opacity="0.45" />
      <rect x="34.4" y="28.7" width="2.2" height="1.4" rx="0.3" fill="#fef9c3" />
    </>
  )
}

/* ---- shared bits for the microcontroller boards ---- */

/** Plated through-holes in a straight line: gold ring, dark centre. */
function Holes({ x, y, n, step, vertical = false }: { x: number; y: number; n: number; step: number; vertical?: boolean }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const cx = vertical ? x : x + i * step
        const cy = vertical ? y + i * step : y
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="0.72" fill="#eab308" />
            <circle cx={cx} cy={cy} r="0.32" fill="#1c1917" />
          </g>
        )
      })}
    </>
  )
}

/** A black pin header seen from above: `cols` × `rows` pins at 1.2 pitch, darker front edge. */
function Header({ x, y, cols, rows = 1, pin = '#71717a' }: { x: number; y: number; cols: number; rows?: number; pin?: string }) {
  const w = cols * 1.2
  const h = rows * 1.2 + 0.6
  return (
    <>
      <rect x={x} y={y} width={w} height={h + 0.8} rx="0.4" fill="#0a0a0a" />
      <rect x={x} y={y} width={w} height={h} rx="0.4" fill="#2a2a2e" />
      {Array.from({ length: cols * rows }, (_, i) => (
        <rect key={i} x={x + 0.25 + (i % cols) * 1.2} y={y + 0.55 + Math.floor(i / cols) * 1.2} width="0.7" height="0.7" fill={pin} />
      ))}
    </>
  )
}

/** A connector block seen from above: top face over a darker front edge. */
function Box({ x, y, w, h, top, front }: { x: number; y: number; w: number; h: number; top: string; front: string }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx="0.7" fill={front} />
      <rect x={x} y={y} width={w} height={h - 1} rx="0.7" fill={top} />
    </>
  )
}

/** A black IC package seen from above. */
function Chip({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx="0.4" fill="#000" />
      <rect x={x} y={y} width={w} height={h - 0.7} rx="0.4" fill="#2a2a2e" />
      <rect x={x + 0.5} y={y + 0.4} width={w - 1} height="0.5" rx="0.25" fill="#fff" opacity="0.15" />
    </>
  )
}

/** Shiny metal gradient shared by connectors and shields; id suffix `u`. */
function Silver({ id }: ArtProps) {
  return (
    <linearGradient id={`${id}u`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fafafa" />
      <stop offset="0.6" stopColor="#d4d4d8" />
      <stop offset="1" stopColor="#8b8b94" />
    </linearGradient>
  )
}

/** A tiny glowing SMD LED. */
function Glow({ cx, cy, color, halo }: { cx: number; cy: number; color: string; halo: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r="1.5" fill={halo} opacity="0.4" />
      <circle cx={cx} cy={cy} r="0.7" fill={color} />
    </>
  )
}

function Nano({ id }: ArtProps) {
  return (
    <>
      <defs>
        <Silver id={id} />
      </defs>
      <Shadow y={36} rx={18} />
      <Pcb id={id} x={7} y={16} w={34} h={15} light="#3b82f6" dark="#1d4ed8" edge="#172554" />
      <Holes x={9.6} y={17.8} n={15} step={2.05} />
      <Holes x={9.6} y={29.2} n={15} step={2.05} />
      <Holes x={36.4} y={21.5} n={3} step={2} vertical />
      <Holes x={38.4} y={21.5} n={3} step={2} vertical />
      <Box x={3.5} y={20.3} w={7.5} h={6.6} top={`url(#${id}u)`} front="#71717a" />
      <path d="M5 22.4h4.5M5 23.9h4.5" stroke="#a1a1aa" strokeWidth="0.45" />
      <g transform="rotate(45 25.5 23.5)">
        <rect x="22.4" y="20.4" width="6.2" height="6.2" fill="#a1a1aa" />
        <rect x="23" y="21" width="5" height="5" rx="0.3" fill="#27272a" />
        <rect x="23.4" y="21.4" width="4.2" height="0.5" rx="0.25" fill="#fff" opacity="0.15" />
        <circle cx="23.9" cy="22.5" r="0.4" fill="#52525b" />
      </g>
      <rect x="14.6" y="22" width="3.2" height="3.6" rx="0.4" fill="#71717a" />
      <rect x="14.6" y="22" width="3.2" height="3" rx="0.4" fill="#d4d4d8" />
      <circle cx="16.2" cy="23.5" r="1.05" fill="#fafafa" />
      <Glow cx={32.6} cy={21.4} color="#f59e0b" halo="#fcd34d" />
      <Glow cx={32.6} cy={25.6} color="#22c55e" halo="#4ade80" />
    </>
  )
}

function Mega({ id }: ArtProps) {
  return (
    <>
      <defs>
        <Silver id={id} />
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#141417" />
        </linearGradient>
      </defs>
      <Shadow y={39.5} rx={20} />
      <Pcb id={id} x={4.5} y={12.5} w={40.5} h={22.5} light="#2ea8d6" dark="#0a5b87" edge="#063b58" holes={[[12.6, 33], [37.6, 33]]} />
      <Header x={14} y={13.2} cols={7} />
      <Header x={23.2} y={13.2} cols={8} />
      <Header x={33.4} y={13.2} cols={5} />
      <Header x={15} y={31.2} cols={8} />
      <Header x={25.4} y={31.2} cols={8} />
      <rect x="40.4" y="15.4" width="3.2" height="18" rx="0.4" fill="#0a0a0a" />
      <rect x="40.4" y="15.4" width="3.2" height="17.2" rx="0.4" fill="#2a2a2e" />
      {Array.from({ length: 28 }, (_, i) => (
        <rect key={i} x={i % 2 ? 42.3 : 41} y={15.9 + Math.floor(i / 2) * 1.2} width="0.7" height="0.7" fill="#71717a" />
      ))}
      <Box x={1.8} y={15} w={9.5} h={7.5} top={`url(#${id}u)`} front="#71717a" />
      <path d="M3.8 17.5h5.5M3.8 19h5.5" stroke="#a1a1aa" strokeWidth="0.5" />
      <rect x="1.6" y="26.2" width="1.4" height="3.6" rx="0.4" fill="#27272a" />
      <Box x={2.4} y={25} w={8} h={6.6} top={`url(#${id}h)`} front="#000" />
      <Chip x={13.2} y={17.2} w={3} h={3.2} />
      <ellipse cx="15" cy="26.2" rx="2" ry="1" fill={`url(#${id}u)`} />
      <rect x="20.2" y="18.7" width="9.6" height="9.6" rx="0.3" fill="#a1a1aa" />
      <rect x="21" y="19.5" width="8" height="8.4" rx="0.4" fill="#000" />
      <rect x="21" y="19.5" width="8" height="7.8" rx="0.4" fill={`url(#${id}h)`} />
      <rect x="21.6" y="20" width="6.8" height="0.6" rx="0.3" fill="#fff" opacity="0.15" />
      <circle cx="22.2" cy="21.6" r="0.45" fill="#52525b" />
      <path
        d="M34.5 23.5C35.3 22.2 36.9 22.2 36.9 23.5S35.3 24.8 34.5 23.5 32.1 22.2 32.1 23.5 33.7 24.8 34.5 23.5z"
        fill="none"
        stroke="#fff"
        strokeWidth="0.7"
        opacity="0.9"
      />
      <Glow cx={37.4} cy={28.4} color="#22c55e" halo="#4ade80" />
    </>
  )
}

function Esp32({ id }: ArtProps) {
  return (
    <>
      <defs>
        <Silver id={id} />
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="0.55" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#9ca3af" />
        </linearGradient>
      </defs>
      <Shadow y={43.6} rx={13} />
      <Pcb id={id} x={13} y={7} w={22} h={33} light="#52525b" dark="#1c1c20" edge="#09090b" />
      <Holes x={14.9} y={9.4} n={15} step={2.05} vertical />
      <Holes x={33.1} y={9.4} n={15} step={2.05} vertical />
      <rect x="16.6" y="3.8" width="14.8" height="21" rx="0.6" fill="#000" />
      <rect x="16.6" y="3" width="14.8" height="21" rx="0.6" fill="#232327" />
      <rect x="17.4" y="3.3" width="13.2" height="0.5" rx="0.25" fill="#fff" opacity="0.2" />
      <path
        d="M18 8.6V4.8h2v3.8h2V4.8h2v3.8h2V4.8h2v3.8h2V4.8"
        fill="none"
        stroke="#eab308"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      <rect x="17.4" y="10" width="13.2" height="13.3" rx="0.5" fill={`url(#${id}c)`} />
      <rect x="18.3" y="10.9" width="11.4" height="11.5" rx="0.4" fill="none" stroke="#fff" strokeWidth="0.4" opacity="0.6" />
      <g fill="#71717a" opacity="0.6">
        <rect x="19.8" y="14.2" width="8" height="0.7" rx="0.35" />
        <rect x="19.8" y="16.2" width="5.6" height="0.7" rx="0.35" />
        <rect x="19.8" y="18.2" width="6.8" height="0.7" rx="0.35" />
      </g>
      <Chip x={21.6} y={27.4} w={4.8} h={4.8} />
      <Chip x={17.2} y={26.6} w={2.6} h={3.6} />
      <Glow cx={30.2} cy={28.2} color="#ef4444" halo="#f87171" />
      {[18.2, 29.8].map((x) => (
        <g key={x}>
          <rect x={x - 1.4} y="34.4" width="2.8" height="3.2" rx="0.4" fill="#71717a" />
          <rect x={x - 1.4} y="34.4" width="2.8" height="2.7" rx="0.4" fill="#d4d4d8" />
          <circle cx={x} cy="35.7" r="0.9" fill="#18181b" />
        </g>
      ))}
      <Box x={20.5} y={38} w={7} h={4.4} top={`url(#${id}u)`} front="#71717a" />
    </>
  )
}

function Esp8266({ id }: ArtProps) {
  return (
    <>
      <defs>
        <Silver id={id} />
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="0.55" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#9ca3af" />
        </linearGradient>
      </defs>
      <Shadow y={39} rx={19} />
      <Pcb id={id} x={6} y={14} w={37} h={20} light="#52525b" dark="#1c1c20" edge="#09090b" />
      <Holes x={8.6} y={15.8} n={15} step={2.3} />
      <Holes x={8.6} y={32.2} n={15} step={2.3} />
      <rect x="25.5" y="18.3" width="16.5" height="12.8" rx="0.6" fill="#0b1d4a" />
      <rect x="25.5" y="17.6" width="16.5" height="12.8" rx="0.6" fill="#1e40af" />
      <path
        d="M37.6 19h3.2v1.7h-3.2v1.7h3.2v1.7h-3.2v1.7h3.2v1.7h-3.2v1.7h3.2"
        fill="none"
        stroke="#eab308"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <rect x="26.3" y="18.4" width="10.3" height="11.2" rx="0.5" fill={`url(#${id}c)`} />
      <rect x="27.1" y="19.2" width="8.7" height="9.6" rx="0.4" fill="none" stroke="#fff" strokeWidth="0.4" opacity="0.6" />
      <g fill="#71717a" opacity="0.6">
        <rect x="28.4" y="21.6" width="6" height="0.7" rx="0.35" />
        <rect x="28.4" y="23.6" width="4.4" height="0.7" rx="0.35" />
        <rect x="28.4" y="25.6" width="5.2" height="0.7" rx="0.35" />
      </g>
      <g fill="#a1a1aa">
        {Array.from({ length: 6 }, (_, i) => (
          <g key={i}>
            <rect x={16.1 + i * 1} y="20.6" width="0.5" height="0.8" />
            <rect x={16.1 + i * 1} y="25.8" width="0.5" height="0.8" />
          </g>
        ))}
      </g>
      <Chip x={15.5} y={21.2} w={6} h={4.8} />
      {[19.4, 28.6].map((y) => (
        <g key={y}>
          <rect x="10.4" y={y - 1.4} width="2.8" height="3.2" rx="0.4" fill="#71717a" />
          <rect x="10.4" y={y - 1.4} width="2.8" height="2.7" rx="0.4" fill="#d4d4d8" />
          <circle cx="11.8" cy={y - 0.1} r="0.9" fill="#18181b" />
        </g>
      ))}
      <Box x={2.5} y={20.8} w={7} h={6.4} top={`url(#${id}u)`} front="#71717a" />
    </>
  )
}

function Pico({ id }: ArtProps) {
  const pads = Array.from({ length: 20 }, (_, i) => 5.5 + i * 2)
  return (
    <>
      <defs>
        <Silver id={id} />
      </defs>
      <Shadow y={38} rx={21} />
      <Pcb id={id} x={3.5} y={15.5} w={41} h={17.5} light="#22c55e" dark="#15803d" edge="#14532d" holes={[[6.2, 19], [6.2, 29.4], [38.8, 19.3], [38.8, 29.2]]} />
      {pads.map((x) => (
        <g key={x}>
          <rect x={x - 0.8} y="15.5" width="1.6" height="1.8" rx="0.3" fill="#eab308" />
          <path d={`M${x - 0.45} 15.5a.45.45 0 0 0 .9 0z`} fill="#14532d" />
          <rect x={x - 0.8} y="31.2" width="1.6" height="1.8" rx="0.3" fill="#eab308" />
          <path d={`M${x - 0.45} 33a.45.45 0 0 1 .9 0z`} fill="#14532d" />
        </g>
      ))}
      <Box x={1.5} y={21} w={6.5} h={6.4} top={`url(#${id}u)`} front="#71717a" />
      <rect x="9.6" y="18.6" width="3.6" height="4.2" rx="0.5" fill="#a1a1aa" />
      <rect x="9.6" y="18.6" width="3.6" height="3.6" rx="0.5" fill="#e4e4e7" />
      <circle cx="11.4" cy="20.6" r="1.25" fill="#a1a1aa" />
      <circle cx="11.4" cy="20.4" r="1.2" fill="#fff" />
      <Glow cx={10.4} cy={27.4} color="#22c55e" halo="#86efac" />
      <g fill="#a1a1aa">
        {[21.8, 23, 24.2, 25.4].map((y) => (
          <g key={y}>
            <rect x="15.2" y={y} width="0.6" height="0.5" />
            <rect x="19" y={y} width="0.6" height="0.5" />
          </g>
        ))}
      </g>
      <Chip x={15.8} y={21.2} w={3.2} h={5} />
      <Chip x={23.7} y={20.9} w={6.6} h={6.8} />
      <circle cx="24.6" cy="22" r="0.4" fill="#52525b" />
      <rect x="32.4" y="20.6" width="2.6" height="1.8" rx="0.4" fill={`url(#${id}u)`} />
      <Holes x={41.8} y={21.8} n={3} step={2.2} vertical />
    </>
  )
}

function Microbit({ id }: ArtProps) {
  const heart = ['01010', '11111', '11111', '01110', '00100']
  const rings = [10, 17.5, 24, 30.5, 38]
  return (
    <>
      <defs>
        <radialGradient id={`${id}g`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#ca8a04" />
        </radialGradient>
        <radialGradient id={`${id}k`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="1" stopColor="#09090b" />
        </radialGradient>
      </defs>
      <Shadow y={41} rx={19} />
      <Pcb id={id} x={5} y={7} w={38} h={30} light="#454c58" dark="#16191e" edge="#050608" />
      <rect x="21.5" y="8.4" width="5" height="2.4" rx="1.2" fill="none" stroke="#eab308" strokeWidth="0.55" />
      <circle cx="22.9" cy="9.6" r="0.45" fill="#eab308" />
      <circle cx="25.1" cy="9.6" r="0.45" fill="#eab308" />
      {heart.flatMap((row, r) =>
        row.split('').map((on, c) => {
          const cx = 24 + (c - 2) * 3.3
          const cy = 18.5 + (r - 2) * 3.1
          return on === '1' ? (
            <g key={`${r}-${c}`}>
              <circle cx={cx} cy={cy} r="1.5" fill="#f87171" opacity="0.4" />
              <rect x={cx - 0.5} y={cy - 0.8} width="1" height="1.6" rx="0.2" fill="#ef4444" />
            </g>
          ) : (
            <rect key={`${r}-${c}`} x={cx - 0.5} y={cy - 0.8} width="1" height="1.6" rx="0.2" fill="#71717a" opacity="0.7" />
          )
        }),
      )}
      {[10.5, 37.5].map((x) => (
        <g key={x}>
          <rect x={x - 2.6} y="15.9" width="5.2" height="5.8" rx="0.8" fill="#71717a" />
          <rect x={x - 2.6} y="15.9" width="5.2" height="5.2" rx="0.8" fill="#d4d4d8" />
          <circle cx={x} cy="18.5" r="1.9" fill={`url(#${id}k)`} />
        </g>
      ))}
      <g fill="none" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
        <path d="M9.4 13.5l1.1-2.6 1.1 2.6M9.85 12.6h1.3" />
        <path d="M36.9 13.5v-2.6h.9a.65.65 0 0 1 0 1.3h-.9 1a.65.65 0 0 1 0 1.3z" />
      </g>
      <g fill="#eab308">
        {Array.from({ length: 40 }, (_, i) => (
          <rect key={i} x={6.6 + i * 0.88} y="33.6" width="0.5" height="3" />
        ))}
      </g>
      {rings.map((x) => (
        <g key={x}>
          <circle cx={x} cy="32.4" r="2.5" fill={`url(#${id}g)`} />
          <circle cx={x} cy="32.4" r="1.25" fill="#09090b" />
        </g>
      ))}
    </>
  )
}

function RaspberryPi({ id }: ArtProps) {
  const berry: [number, number][] = [
    [8.1, 22.6],
    [9.9, 22.6],
    [7.3, 24],
    [9, 24],
    [10.7, 24],
    [8.1, 25.4],
    [9.9, 25.4],
    [9, 26.7],
  ]
  return (
    <>
      <defs>
        <Silver id={id} />
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="0.55" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#9ca3af" />
        </linearGradient>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#141417" />
        </linearGradient>
      </defs>
      <Shadow y={41} rx={20} />
      <Pcb
        id={id}
        x={3}
        y={11}
        w={37}
        h={25}
        light="#34c26b"
        dark="#157a3a"
        edge="#0e4d26"
        holes={[[5.4, 13.4], [29.6, 13.4], [5.4, 33.6], [29.6, 33.6]]}
      />
      <Header x={7.2} y={12} cols={17} rows={2} pin="#eab308" />
      <g fill="#14532d">
        <ellipse cx="8.2" cy="21.2" rx="1.3" ry="0.6" transform="rotate(25 8.2 21.2)" />
        <ellipse cx="9.8" cy="21.2" rx="1.3" ry="0.6" transform="rotate(-25 9.8 21.2)" />
      </g>
      {berry.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.85" fill="#e11d48" />
      ))}
      <circle cx="8.6" cy="22.4" r="0.3" fill="#fff" opacity="0.6" />
      <rect x="13" y="19" width="9" height="9" rx="0.6" fill="#0e4d26" />
      <rect x="13.5" y="19.4" width="8" height="8" rx="0.5" fill={`url(#${id}c)`} />
      <rect x="14.3" y="20.2" width="6.4" height="6.4" rx="0.4" fill="none" stroke="#fff" strokeWidth="0.4" opacity="0.6" />
      <Chip x={23.3} y={19.6} w={5} h={7.4} />
      <Box x={31.5} y={12} w={13} h={7.6} top={`url(#${id}u)`} front="#71717a" />
      <rect x="42.6" y="13.2" width="1.6" height="4.6" rx="0.3" fill="#27272a" />
      <circle cx="41" cy="13.6" r="0.5" fill="#22c55e" />
      <circle cx="41" cy="17.4" r="0.5" fill="#f59e0b" />
      <Box x={32} y={20.4} w={13.4} h={6.8} top={`url(#${id}u)`} front="#71717a" />
      <rect x="43.4" y="21.4" width="1.4" height="4.4" rx="0.3" fill="#2563eb" />
      <Box x={32} y={28} w={13.4} h={6.8} top={`url(#${id}u)`} front="#71717a" />
      <rect x="43.4" y="29" width="1.4" height="4.4" rx="0.3" fill="#27272a" />
      <Box x={6.6} y={33.4} w={4} h={4.4} top={`url(#${id}u)`} front="#71717a" />
      <Box x={13.4} y={33.6} w={3.4} h={4} top={`url(#${id}u)`} front="#71717a" />
      <Box x={18.4} y={33.6} w={3.4} h={4} top={`url(#${id}u)`} front="#71717a" />
      <Box x={24.2} y={33.2} w={3.4} h={4.6} top={`url(#${id}h)`} front="#000" />
    </>
  )
}

/** The AI board: the big "AI" chip in its ring of thinking lights, a llama, and the pin headers. */
function AiBoard({ id }: ArtProps) {
  const ring = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    return [round(22 + Math.cos(a) * 8.6), round(23.5 + Math.sin(a) * 8.6)] as const
  })
  return (
    <>
      <Shadow y={40} rx={20} />
      <Pcb id={id} x={3.5} y={11} w={41} h={25} light="#33384f" dark="#171a28" edge="#090b12" holes={[[6.4, 13.9], [6.4, 33.1]]} />
      {/* headers: 5V, GND and IN on the left, P1 … P6 on the right */}
      <rect x="40.2" y="13.2" width="2.9" height="20.6" rx="0.4" fill="#0a0a0a" />
      <rect x="40.2" y="13.2" width="2.9" height="19.8" rx="0.4" fill="#2a2a2e" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x="41.1" y={14.4 + i * 3.2} width="1.1" height="1.1" fill="#0a0a0a" />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx="37.6" cy={15 + i * 3.2} r="0.75" fill={i % 2 === 0 ? '#f59e0b' : '#7c5a1f'} />
      ))}
      <rect x="4.6" y="18.8" width="2.6" height="10.4" rx="0.4" fill="#2a2a2e" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="5.35" y={19.9 + i * 3.1} width="1.1" height="1.1" fill="#0a0a0a" />
      ))}
      {/* the ring of tiny lights: one runs around while it thinks */}
      {ring.map(([cx, cy], i) => (
        <g key={i}>
          {i === 1 && <circle cx={cx} cy={cy} r="1.7" fill="#c4b5fd" opacity="0.45" />}
          <circle cx={cx} cy={cy} r="0.62" fill={i === 1 ? '#ede9fe' : i === 0 ? '#a78bfa' : '#5b5675'} />
        </g>
      ))}
      {/* the chip and its legs */}
      <g fill="#a1a1aa">
        {[0, 1, 2, 3].map((k) => (
          <g key={k}>
            <rect x={18.1 + k * 2.3} y="17.5" width="0.8" height="1.2" />
            <rect x={18.1 + k * 2.3} y="28.4" width="0.8" height="1.2" />
            <rect x="15.9" y={19.7 + k * 2.3} width="1.2" height="0.8" />
            <rect x="26.9" y={19.7 + k * 2.3} width="1.2" height="0.8" />
          </g>
        ))}
      </g>
      <Chip x={16.8} y={18.4} w={10.4} h={10.6} />
      <text
        x="22"
        y="25.3"
        textAnchor="middle"
        fontSize="5.4"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill="#ddd6fe"
      >
        AI
      </text>
      {/* a little llama printed on the board */}
      <g transform="translate(29.6 26.2) scale(0.74)" fill="#e9dfc8">
        <path d="M0 5.6Q0 4 1.7 4H5.8Q6.6 4 6.6 3V1.1Q6.6.3 7.4.4L8.6.7Q9.3.9 8.6 1.5H7.7V4.7Q7.7 6.5 6.1 6.6H1.1Q0 6.6 0 5.6Z" />
        <path d="M6.8.6 6.6-.9 7.4.4ZM7.6.5 7.8-1 8.3.6Z" />
        <g stroke="#e9dfc8" strokeWidth="0.75" strokeLinecap="round">
          <path d="M1.1 6.4V8.8M2.3 6.4V8.8M5.2 6.4V8.8M6.4 6.4V8.8" />
        </g>
      </g>
    </>
  )
}

/** A car's engine computer with its lid off: the big plug, the brain chip and the drivers that fire the injectors. */
function Ecu({ id }: ArtProps) {
  const legs = [0, 1, 2, 3, 4, 5, 6]
  const pins = [8.2, 9.8, 11.4, 13, 14.6, 16.2, 17.8, 22.4, 24, 25.6, 27.2, 28.8, 30.4, 32, 33.6]
  const barcode: [number, number][] = [
    [7.2, 0.3],
    [7.8, 0.5],
    [8.6, 0.3],
    [9.2, 0.6],
    [10.1, 0.3],
    [10.7, 0.4],
    [11.4, 0.3],
    [12, 0.5],
    [12.8, 0.3],
  ]
  return (
    <>
      <defs>
        <Silver id={id} />
        <linearGradient id={`${id}k`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a4a52" />
          <stop offset="0.4" stopColor="#232327" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#27272a" />
          <stop offset="0.3" stopColor="#6b6b74" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
      </defs>
      <Shadow y={41} rx={20} />
      <Pcb id={id} x={4} y={13} w={40} h={24} light="#3f7d4c" dark="#173d24" edge="#0a2213" />
      {/* the big plug for the car's wiring: two rows of pins, and a lever that locks it in */}
      <rect x="5" y="4" width="38" height="13.4" rx="1.6" fill="#000" />
      <rect x="5" y="4" width="38" height="12.6" rx="1.6" fill={`url(#${id}k)`} />
      <rect x="7.2" y="7.2" width="27.8" height="7.2" rx="0.8" fill="#050505" />
      <rect x="20.2" y="7.2" width="1" height="7.2" fill="#2a2a2e" />
      {[8.6, 11.6].map((y) =>
        pins.map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="0.9" height="1.5" rx="0.2" fill="#d4d4d8" />),
      )}
      <rect x="6.6" y="4.4" width="31" height="1.8" rx="0.9" fill="#52525b" />
      <rect x="7.4" y="4.6" width="29.4" height="0.5" rx="0.25" fill="#fff" opacity="0.3" />
      <circle cx="7.6" cy="5.3" r="1" fill={`url(#${id}u)`} />
      <rect x="36.4" y="4.2" width="5.4" height="11.4" rx="1.2" fill="#3f3f46" />
      <rect x="36.9" y="4.6" width="4.4" height="0.6" rx="0.3" fill="#fff" opacity="0.3" />
      <path d="M37.4 7.6h3.4M37.4 9.2h3.4M37.4 10.8h3.4M37.4 12.4h3.4" stroke="#18181b" strokeWidth="0.6" />
      {/* the CAN chip that talks to the rest of the car, its crystal, and a red-striped test sticker */}
      <g fill="#a1a1aa">
        {[7.25, 8.55, 9.85, 11.15].map((x) => (
          <g key={x}>
            <rect x={x} y="18.8" width="0.6" height="1.2" />
            <rect x={x} y="23.2" width="0.6" height="1.2" />
          </g>
        ))}
      </g>
      <Chip x={6.8} y={19.8} w={5.4} h={3.6} />
      <rect x="7" y="26.2" width="5" height="2.8" rx="1.4" fill="#71717a" />
      <rect x="7" y="26.2" width="5" height="2.3" rx="1.15" fill={`url(#${id}u)`} />
      <rect x="6.4" y="30.6" width="7.2" height="4.8" rx="0.4" fill="#f4f4f5" />
      <path d="M6.4 32V31a.4.4 0 0 1 .4-.4h6.4a.4.4 0 0 1 .4.4v1z" fill="#dc2626" />
      <g fill="#3f3f46">
        {barcode.map(([x, w]) => (
          <rect key={x} x={x} y="32.7" width={w} height="1.9" />
        ))}
      </g>
      {/* the brain: a big square chip with legs on all four sides */}
      <g fill="#a1a1aa">
        {legs.map((i) => (
          <g key={i}>
            <rect x={17.1 + i * 1.2} y="19.2" width="0.6" height="1.4" />
            <rect x={17.1 + i * 1.2} y="29.4" width="0.6" height="1.4" />
            <rect x="15.2" y={21.1 + i * 1.2} width="1.4" height="0.6" />
            <rect x="25.4" y={21.1 + i * 1.2} width="1.4" height="0.6" />
          </g>
        ))}
      </g>
      <Chip x={16.5} y={20.5} w={9} h={9} />
      <circle cx="17.8" cy="21.9" r="0.45" fill="#52525b" />
      <rect x="18.8" y="24.2" width="4.6" height="0.6" rx="0.3" fill="#d4d4d8" opacity="0.4" />
      <rect x="18.8" y="25.8" width="3.2" height="0.6" rx="0.3" fill="#d4d4d8" opacity="0.3" />
      {/* six little lights that blink while the engine runs */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = round(16.3 + i * 2.1)
        const lit = i !== 2 && i !== 5
        return (
          <g key={i}>
            {lit && <circle cx={x} cy="34.5" r="1.2" fill="#fcd34d" opacity="0.5" />}
            <rect x={x - 0.45} y="33.9" width="0.9" height="1.2" rx="0.2" fill={lit ? '#f59e0b' : '#78350f'} />
          </g>
        )
      })}
      {/* two aluminium capacitors, and the three power drivers with their metal tabs */}
      {[31.2, 37.4].map((cx) => (
        <g key={cx}>
          <path d={`M${cx - 2.5} 19.6v4.6a2.5 1.1 0 0 0 5 0v-4.6z`} fill={`url(#${id}c)`} />
          <rect x={cx + 0.7} y="20.4" width="0.9" height="4.6" fill="#a1a1aa" opacity="0.55" />
          <ellipse cx={cx} cy="19.6" rx="2.5" ry="1.1" fill={`url(#${id}u)`} />
          <path d={`M${cx - 1.2} 19.6h2.4M${cx} 19v1.2`} stroke="#8b8b94" strokeWidth="0.35" />
        </g>
      ))}
      {[30.4, 35.6, 40.8].map((cx) => (
        <g key={cx}>
          <rect x={cx - 1.5} y="26.4" width="0.8" height="1.8" fill="#d4d4d8" />
          <rect x={cx + 0.7} y="26.4" width="0.8" height="1.8" fill="#d4d4d8" />
          <rect x={cx - 2.3} y="30.4" width="4.6" height="3.8" rx="0.4" fill={`url(#${id}u)`} />
          <rect x={cx - 2.1} y="27.8" width="4.2" height="4.8" rx="0.4" fill="#000" />
          <rect x={cx - 2.1} y="27.8" width="4.2" height="4.2" rx="0.4" fill="#2a2a2e" />
          <rect x={cx - 1.6} y="28.2" width="3.2" height="0.5" rx="0.25" fill="#fff" opacity="0.15" />
        </g>
      ))}
    </>
  )
}

/** A factory controller clipped onto its rail: screw terminals for the wires, a little screen and its lights. */
function Plc({ id }: ArtProps) {
  const screws = Array.from({ length: 8 }, (_, i) => 9.4 + i * 4.2)
  const outputs = [true, false, true, true, false, true]
  const keys: [number, number][] = [
    [30.4, 17.8],
    [30.4, 22.6],
    [28, 20.2],
    [32.8, 20.2],
    [37.4, 18],
    [37.4, 22.4],
  ]
  // a row of green screw terminals; wires go in from the top (or bottom) edge
  const terminals = (y: number, top: boolean) => (
    <g>
      <rect x="7" y={y} width="34" height="5.4" rx="0.8" fill="#14532d" />
      <rect x="7" y={y} width="34" height="4.6" rx="0.8" fill={`url(#${id}g)`} />
      {screws.slice(1).map((x) => (
        <rect key={x} x={x - 2.3} y={y} width="0.4" height="4.6" fill="#14532d" opacity="0.7" />
      ))}
      {screws.map((x) => {
        const cy = top ? y + 2.9 : y + 1.7
        return (
          <g key={x}>
            <rect x={x - 1} y={top ? y + 0.4 : y + 3.2} width="2" height="1" rx="0.3" fill="#052e16" />
            <circle cx={x} cy={cy} r="1.25" fill={`url(#${id}u)`} />
            <path d={`M${x - 0.8} ${cy + 0.4}l1.6-0.8`} stroke="#52525b" strokeWidth="0.4" strokeLinecap="round" />
          </g>
        )
      })}
    </g>
  )
  return (
    <>
      <defs>
        <Silver id={id} />
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="0.55" stopColor="#e4e4e7" />
          <stop offset="1" stopColor="#a1a1aa" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4ade80" />
          <stop offset="0.4" stopColor="#22c55e" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#18181b" />
        </linearGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a7f3e0" />
          <stop offset="1" stopColor="#4fb8a8" />
        </linearGradient>
      </defs>
      <Shadow y={42.5} rx={21} />
      {/* the metal rail it clips onto */}
      <rect x="1" y="19.6" width="46" height="8.4" rx="0.4" fill={`url(#${id}u)`} />
      <rect x="1" y="21" width="46" height="5.6" fill="#a1a1aa" />
      <rect x="1" y="21" width="46" height="0.6" fill="#71717a" />
      {[2.6, 45.4].map((x) => (
        <rect key={x} x={x - 0.7} y="22.4" width="1.4" height="2.8" rx="0.7" fill="#52525b" />
      ))}
      {/* the light grey case with its terminals top and bottom */}
      <rect x="4" y="6" width="40" height="34" rx="3" fill="#71717a" transform="translate(0 1.2)" />
      <rect x="4" y="6" width="40" height="34" rx="3" fill={`url(#${id}h)`} />
      <rect x="6.5" y="6.5" width="35" height="0.9" rx="0.45" fill="#fff" />
      {terminals(7.8, true)}
      {terminals(33.2, false)}
      {/* the dark front: the screen, the keys, the lights and a teal stripe */}
      <rect x="7" y="14.4" width="34" height="17.6" rx="1.6" fill={`url(#${id}f)`} />
      <path d="M7 29.8h34v0.6a1.6 1.6 0 0 1-1.6 1.6H8.6A1.6 1.6 0 0 1 7 30.4z" fill="#0d9488" />
      <rect x="7.6" y="15" width="32.8" height="0.6" rx="0.3" fill="#fff" opacity="0.15" />
      <rect x="9" y="16.4" width="15.6" height="8.6" rx="0.8" fill="#0a0a0a" />
      <rect x="9.8" y="17.2" width="14" height="7" rx="0.4" fill={`url(#${id}l)`} />
      <g fill="#134e4a" opacity="0.85">
        <rect x="11" y="18.4" width="6.6" height="1.1" rx="0.2" />
        <rect x="11" y="20.6" width="3.6" height="1.1" rx="0.2" />
        <rect x="15.6" y="20.6" width="5.4" height="1.1" rx="0.2" />
        <rect x="11" y="22.5" width="9" height="0.6" rx="0.2" opacity="0.5" />
      </g>
      <rect x="10.2" y="17.6" width="13.2" height="0.5" rx="0.25" fill="#fff" opacity="0.45" />
      {keys.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x - 1} y={y - 1} width="2" height="2" rx="0.5" fill="#09090b" />
          <rect x={x - 1} y={y - 1} width="2" height="1.6" rx="0.5" fill="#52525b" />
        </g>
      ))}
      {/* six output lights, then RUN (on) and ERR */}
      {outputs.map((on, i) =>
        on ? (
          <Glow key={i} cx={10.4 + i * 2.6} cy={27.2} color="#22c55e" halo="#4ade80" />
        ) : (
          <circle key={i} cx={10.4 + i * 2.6} cy="27.2" r="0.7" fill="#14532d" />
        ),
      )}
      <Glow cx={30.6} cy={27.2} color="#22c55e" halo="#4ade80" />
      <circle cx="35.6" cy="27.2" r="0.75" fill="#dc2626" />
      <rect x="31.8" y="26.9" width="2" height="0.6" rx="0.3" fill="#a1a1aa" opacity="0.6" />
      <rect x="36.8" y="26.9" width="2" height="0.6" rx="0.3" fill="#a1a1aa" opacity="0.6" />
    </>
  )
}

/** An oil-well radio box: a tough board in an orange tray, a battery for when the power fails, and a stubby antenna. */
function Rtu({ id }: ArtProps) {
  const leds: [string, string][] = [
    ['#22c55e', '#4ade80'],
    ['#22c55e', '#4ade80'],
    ['#f59e0b', '#fcd34d'],
    ['#f59e0b', '#fcd34d'],
    ['#3b82f6', '#93c5fd'],
    ['#ef4444', '#f87171'],
  ]
  return (
    <>
      <defs>
        <Silver id={id} />
        <linearGradient id={`${id}o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdba74" />
          <stop offset="0.3" stopColor="#f97316" />
          <stop offset="1" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#93c5fd" />
          <stop offset="0.35" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a16207" />
          <stop offset="0.4" stopColor="#fde68a" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#27272a" />
          <stop offset="0.35" stopColor="#52525b" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4ade80" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <Shadow y={42.5} rx={21} />
      {/* the safety-orange tray */}
      <rect x="2.5" y="13.4" width="43" height="26.6" rx="3.2" fill="#9a3412" transform="translate(0 1.6)" />
      <rect x="2.5" y="13.4" width="43" height="26.6" rx="3.2" fill={`url(#${id}o)`} />
      <rect x="5" y="13.9" width="38" height="0.8" rx="0.4" fill="#fff" opacity="0.45" />
      <rect x="4.6" y="15.4" width="38.8" height="22.6" rx="1.8" fill="#7c2d12" />
      <Pcb id={id} x={5.4} y={16} w={37.2} h={20.2} light="#3a4556" dark="#111827" edge="#030712" holes={[[7.8, 18.4], [7.8, 33.8]]} />
      {/* green screw terminals for the well's sensors and pump */}
      <rect x="10.2" y="17.2" width="14.4" height="5.6" rx="0.6" fill="#14532d" />
      <rect x="10.2" y="17.2" width="14.4" height="4.8" rx="0.6" fill={`url(#${id}t)`} />
      {[12, 15.6, 19.2, 22.8].map((x) => (
        <g key={x}>
          <circle cx={x} cy="19.3" r="1.3" fill={`url(#${id}u)`} />
          <path d={`M${x - 0.8} 19.7l1.6-0.8`} stroke="#52525b" strokeWidth="0.4" strokeLinecap="round" />
          <rect x={x - 1} y="21.3" width="2" height="1" rx="0.3" fill="#052e16" />
        </g>
      ))}
      {leds.map(([color, halo], i) => (
        <Glow key={i} cx={10.8 + i * 2.4} cy={25.3} color={color} halo={halo} />
      ))}
      {/* the radio in its silver can, its gold connector and the stubby antenna standing up */}
      <Box x={26.4} y={17.4} w={10.4} h={9} top={`url(#${id}u)`} front="#71717a" />
      <rect x="27.2" y="18" width="8.8" height="0.5" rx="0.25" fill="#fff" opacity="0.8" />
      <g fill="#a1a1aa">
        <circle cx="27.6" cy="19.6" r="0.35" />
        <circle cx="35.6" cy="19.6" r="0.35" />
        <circle cx="27.6" cy="24.2" r="0.35" />
        <circle cx="35.6" cy="24.2" r="0.35" />
        <rect x="29" y="20.9" width="5.2" height="0.6" rx="0.3" />
        <rect x="29" y="22.3" width="3.6" height="0.6" rx="0.3" />
      </g>
      <rect x="37.6" y="18.6" width="4.2" height="4" rx="0.4" fill="#92400e" />
      <rect x="37.6" y="18.6" width="4.2" height="3.4" rx="0.4" fill={`url(#${id}g)`} />
      <rect x="38.1" y="14.4" width="3.2" height="5.4" rx="0.3" fill={`url(#${id}g)`} />
      <path d="M38.1 16.4h3.2M38.1 18h3.2" stroke="#92400e" strokeWidth="0.35" opacity="0.7" />
      <rect x="37.9" y="2.6" width="3.6" height="10.4" rx="1.8" fill={`url(#${id}a)`} />
      <rect x="38.6" y="4" width="0.6" height="7.4" rx="0.3" fill="#fff" opacity="0.25" />
      <rect x="37.7" y="11.6" width="4" height="3.4" rx="0.6" fill="#18181b" />
      <path d="M38.2 12.5h3M38.2 13.5h3M38.2 14.5h3" stroke="#3f3f46" strokeWidth="0.4" />
      {/* the 18650 battery that keeps it talking when the power is out */}
      <rect x="10" y="27.4" width="22.4" height="8.2" rx="1" fill="#000" />
      <rect x="10" y="27.4" width="22.4" height="7.4" rx="1" fill="#27272a" />
      <rect x="11" y="28.2" width="20.4" height="5.8" rx="0.6" fill="#0a0a0a" />
      <path d="M11.5 29v4.2M12.2 29v4.2" stroke="#d4d4d8" strokeWidth="0.4" />
      <rect x="12.6" y="28.4" width="17.4" height="5.4" rx="2.4" fill={`url(#${id}b)`} />
      <rect x="29.6" y="29.8" width="1.4" height="2.6" rx="0.5" fill={`url(#${id}u)`} />
      <rect x="27.4" y="28.4" width="0.6" height="5.4" fill="#dbeafe" opacity="0.7" />
      <rect x="14" y="29.1" width="12.8" height="0.8" rx="0.4" fill="#fff" opacity="0.45" />
      <path d="M15.4 31.4h5.4M15.4 32.6h3.2" stroke="#bfdbfe" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
      {/* the little computer that reads the well */}
      <g fill="#a1a1aa">
        {[35.2, 36.4, 37.6, 38.8].map((x) => (
          <g key={x}>
            <rect x={x} y="27.8" width="0.6" height="1.2" />
            <rect x={x} y="33.4" width="0.6" height="1.2" />
          </g>
        ))}
      </g>
      <Chip x={34.4} y={28.6} w={5.4} h={5.2} />
      <circle cx="35.4" cy="29.8" r="0.4" fill="#52525b" />
    </>
  )
}

/* ---- screens ---- */

const round = (n: number) => +n.toFixed(2)

/** The seven bars (a–g) of one digit, `t` thick, in a `w` × `h` box at x, y. */
function segmentBars(x: number, y: number, w: number, h: number, t: number) {
  const gap = 0.32
  const half = t / 2
  const left = x + half
  const right = x + w - half
  const top = y + half
  const middle = y + h / 2
  const bottom = y + h - half
  const across = (x1: number, x2: number, cy: number) =>
    [
      [x1, cy],
      [x1 + half, cy - half],
      [x2 - half, cy - half],
      [x2, cy],
      [x2 - half, cy + half],
      [x1 + half, cy + half],
    ]
      .map((p) => p.map(round).join(','))
      .join(' ')
  const down = (cx: number, y1: number, y2: number) =>
    [
      [cx, y1],
      [cx + half, y1 + half],
      [cx + half, y2 - half],
      [cx, y2],
      [cx - half, y2 - half],
      [cx - half, y1 + half],
    ]
      .map((p) => p.map(round).join(','))
      .join(' ')
  return {
    a: across(left + gap, right - gap, top),
    b: down(right, top + gap, middle - gap),
    c: down(right, middle + gap, bottom - gap),
    d: across(left + gap, right - gap, bottom),
    e: down(left, middle + gap, bottom - gap),
    f: down(left, top + gap, middle - gap),
    g: across(left + gap, right - gap, middle),
  }
}

function SegmentDisplay({ id }: ArtProps) {
  // "12:34": which bars of each digit are lit
  const digits: [number, string][] = [
    [8.2, 'bc'],
    [15.2, 'abdeg'],
    [25.6, 'abcdg'],
    [32.6, 'bcfg'],
  ]
  const top = 16.9
  const height = 10.2
  // italic like a real display: the bottom stays put, the top leans right
  const lean = `translate(${round(Math.tan((8 * Math.PI) / 180) * (top + height))} 0) skewX(-8)`
  return (
    <>
      <defs>
        <linearGradient id={`${id}sg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#141417" />
        </linearGradient>
      </defs>
      <Shadow y={39} rx={18} />
      <Legs xs={[10, 15, 20, 28, 33, 38]} y={30} len={7} />
      <rect x="4" y="14.1" width="40" height="19" rx="2" fill="#000" />
      <rect x="4" y="12.5" width="40" height="19" rx="2" fill={`url(#${id}sg)`} />
      <rect x="6" y="13.1" width="36" height="0.8" rx="0.4" fill="#fff" opacity="0.18" />
      <rect x="6.2" y="15" width="35.6" height="14.6" rx="1" fill="#0a0a0b" stroke="#000" strokeWidth="0.4" />
      <g transform={lean}>
        {digits.map(([x, lit]) => (
          <g key={x}>
            {Object.entries(segmentBars(x, top, 5.6, height, 1.25)).map(([bar, points]) =>
              lit.includes(bar) ? (
                <g key={bar}>
                  <polygon points={points} fill="none" stroke="#ff6b5e" strokeWidth="1.3" strokeLinejoin="round" opacity="0.3" />
                  <polygon points={points} fill="#ff3b30" />
                </g>
              ) : (
                <polygon key={bar} points={points} fill="#3a0f0c" />
              ),
            )}
          </g>
        ))}
        {[top + 3.3, top + height - 3.3].map((cy) => (
          <g key={cy}>
            <circle cx="23.2" cy={cy} r="1.2" fill="#ff6b5e" opacity="0.3" />
            <circle cx="23.2" cy={cy} r="0.7" fill="#ff3b30" />
          </g>
        ))}
      </g>
    </>
  )
}

function LcdDisplay({ id }: ArtProps) {
  // two lines of 16 letters: the dark cells are letters, the faint ones are empty
  const lines = ['0011111011111000', '0111110111011100']
  return (
    <>
      <defs>
        <linearGradient id={`${id}lg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d4ef7d" />
          <stop offset="0.5" stopColor="#a8d63a" />
          <stop offset="1" stopColor="#7fae22" />
        </linearGradient>
      </defs>
      <Shadow y={40} rx={20} />
      <Pcb
        id={id}
        x={3}
        y={10}
        w={42}
        h={26}
        light="#24a85c"
        dark="#0f6b37"
        edge="#064e2b"
        holes={[
          [5.4, 12.4],
          [42.6, 12.4],
          [5.4, 33.6],
          [42.6, 33.6],
        ]}
      />
      <Header x={9} y={10.7} cols={16} />
      <rect x="6.5" y="15.3" width="35" height="17.4" rx="1" fill="#000" />
      <rect x="6.5" y="14.5" width="35" height="17.4" rx="1" fill="#1c1c1f" />
      <rect x="8.4" y="16.6" width="31.2" height="13.2" rx="0.6" fill={`url(#${id}lg)`} />
      {lines.flatMap((line, r) =>
        line.split('').map((on, c) => (
          <rect
            key={`${r}-${c}`}
            x={round(9.4 + c * 1.85)}
            y={round(18.8 + r * 5.1)}
            width="1.45"
            height="3.6"
            rx="0.15"
            fill={on === '1' ? '#1f3b0b' : '#000'}
            opacity={on === '1' ? 0.85 : 0.09}
          />
        )),
      )}
      <path d="M8.4 16.6h13l-7 13.2H8.4z" fill="#fff" opacity="0.12" />
    </>
  )
}

function OledDisplay({ id }: ArtProps) {
  const bars = [3, 5, 4, 6.5, 5, 7.5, 6, 4.5, 7, 5.5, 3.5]
  return (
    <>
      <defs>
        <linearGradient id={`${id}og`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a2a30" />
          <stop offset="1" stopColor="#040405" />
        </linearGradient>
        <linearGradient id={`${id}op`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#eab308" />
          <stop offset="1" stopColor="#a16207" />
        </linearGradient>
      </defs>
      <Shadow y={41} rx={16} />
      <Pcb
        id={id}
        x={9}
        y={9}
        w={30}
        h={29}
        light="#3b82f6"
        dark="#1d4ed8"
        edge="#172554"
        holes={[
          [11.3, 11.3],
          [36.7, 11.3],
          [11.3, 35.7],
          [36.7, 35.7],
        ]}
      />
      <Strip x={17.8} y={8} w={12.4} />
      {[19.4, 22.5, 25.5, 28.6].map((x) => (
        <rect key={x} x={x - 0.45} y="3.6" width="0.9" height="5.4" rx="0.3" fill={`url(#${id}op)`} />
      ))}
      {/* the thin flex cable folds out from under the glass */}
      <rect x="20" y="31.4" width="8" height="2.8" rx="0.4" fill="#c9a66b" />
      <rect x="11" y="14.4" width="26" height="17.6" rx="0.9" fill={`url(#${id}og)`} />
      <rect x="13" y="16.2" width="9" height="1.1" rx="0.2" fill="#fde047" />
      <rect x="13" y="18.2" width="6" height="1.1" rx="0.2" fill="#fde047" />
      <rect x="30.6" y="16.2" width="4.2" height="2.2" rx="0.3" fill="none" stroke="#fde047" strokeWidth="0.5" />
      <rect x="31.2" y="16.8" width="2.4" height="1" fill="#fde047" />
      {bars.map((h, i) => (
        <rect key={i} x={round(13.2 + i * 2.05)} y={30.4 - h} width="1.35" height={h} fill="#7dd3fc" />
      ))}
      <rect x="13" y="30.6" width="22" height="0.4" fill="#7dd3fc" opacity="0.6" />
      <path d="M11 14.4h9l-6 17.6h-3z" fill="#fff" opacity="0.07" />
    </>
  )
}

function TftDisplay({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}ts`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="0.6" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#fde68a" />
        </linearGradient>
        <clipPath id={`${id}tc`}>
          <rect x="11.2" y="12.4" width="26.6" height="20.2" rx="0.4" />
        </clipPath>
      </defs>
      <Shadow y={40} rx={20} />
      <Pcb
        id={id}
        x={4}
        y={9}
        w={40}
        h={28}
        light="#ef4444"
        dark="#b91c1c"
        edge="#7f1d1d"
        holes={[
          [6.3, 11.3],
          [41.8, 11.3],
          [6.3, 34.7],
          [41.8, 34.7],
        ]}
      />
      {/* the pin header down the left side */}
      <rect x="5" y="14" width="2.8" height="18.6" rx="0.4" fill="#0a0a0a" />
      <rect x="5" y="14" width="2.8" height="18" rx="0.4" fill="#2a2a2e" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x="5.95" y={14.9 + i * 2} width="0.9" height="0.9" fill="#d4d4d8" />
      ))}
      <rect x="9.6" y="11.6" width="29.8" height="23.4" rx="1" fill="#000" />
      <rect x="9.6" y="10.8" width="29.8" height="23.4" rx="1" fill="#141416" />
      <g clipPath={`url(#${id}tc)`}>
        <rect x="11.2" y="12.4" width="26.6" height="20.2" fill={`url(#${id}ts)`} />
        <circle cx="32" cy="17.6" r="5" fill="#fef9c3" opacity="0.45" />
        <circle cx="32" cy="17.6" r="2.9" fill="#fde047" />
        <ellipse cx="17.5" cy="16.8" rx="3.2" ry="1.3" fill="#fff" opacity="0.9" />
        <ellipse cx="19.5" cy="16" rx="2" ry="1.2" fill="#fff" opacity="0.9" />
        <path d="M11 28.5c4-5 8-6.5 13-3.5s8 1 14-2V33H11z" fill="#4ade80" />
        <path d="M11 31c5-3.5 10-3 15-.5s8 1.5 12-.5V33H11z" fill="#15803d" />
        <path d="M11.2 12.4h10L13 32.6h-1.8z" fill="#fff" opacity="0.12" />
      </g>
    </>
  )
}

function MatrixSign({ id }: ArtProps) {
  // an arrow and "18K", the way a shop sign spells it out in dots
  const rows = [
    '..#....#.###.#.#',
    '.##...##.#.#.#.#',
    '#####..#.###.##.',
    '#####..#.#.#.##.',
    '.##....#.#.#.#.#',
    '..#....#.###.#.#',
  ]
  return (
    <>
      <defs>
        <linearGradient id={`${id}mf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4d4d8" />
          <stop offset="0.45" stopColor="#8b8b94" />
          <stop offset="1" stopColor="#3f3f46" />
        </linearGradient>
      </defs>
      <Shadow y={38} rx={21} />
      {[9, 36.4].map((x) => (
        <g key={x}>
          <rect x={x} y="11.6" width="2.6" height="4" rx="0.6" fill="#71717a" />
          <circle cx={x + 1.3} cy="12.9" r="0.55" fill="#27272a" />
        </g>
      ))}
      <rect x="2" y="15.6" width="44" height="17" rx="1.6" fill="#18181b" />
      <rect x="2" y="14.2" width="44" height="17" rx="1.6" fill={`url(#${id}mf)`} />
      <rect x="4" y="14.6" width="40" height="0.6" rx="0.3" fill="#fff" opacity="0.45" />
      <rect x="3.5" y="15.7" width="41" height="14" rx="0.6" fill="#0c0a09" />
      {rows.flatMap((row, r) =>
        row.split('').map((dot, c) => {
          const cx = round(4.78 + c * 2.5625)
          const cy = round(16.87 + r * 2.333)
          return dot === '#' ? (
            <g key={`${r}-${c}`}>
              <circle cx={cx} cy={cy} r="1.15" fill="#ffcf5c" opacity="0.22" />
              <circle cx={cx} cy={cy} r="0.9" fill="#ffb81f" />
            </g>
          ) : (
            <circle key={`${r}-${c}`} cx={cx} cy={cy} r="0.7" fill="#2b2210" />
          )
        }),
      )}
    </>
  )
}

function LedWall({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}wf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#111113" />
        </linearGradient>
        <linearGradient id={`${id}wp`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d28d9" />
          <stop offset="0.5" stopColor="#db2777" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id={`${id}ws`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e4e4e7" />
          <stop offset="0.55" stopColor="#a1a1aa" />
          <stop offset="1" stopColor="#52525b" />
        </linearGradient>
        <radialGradient id={`${id}wl`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff7d6" />
          <stop offset="0.4" stopColor="#fde68a" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}wc`}>
          <rect x="5.6" y="7.4" width="36.8" height="20.6" rx="0.4" />
        </clipPath>
      </defs>
      <Shadow y={42} rx={19} />
      {[13, 32.4].map((x) => (
        <g key={x}>
          <rect x={x} y="28" width="2.6" height="13" fill={`url(#${id}ws)`} />
          <rect x={x - 1.2} y="40.4" width="5" height="1.3" rx="0.5" fill="#52525b" />
        </g>
      ))}
      <rect x="4" y="7.4" width="40" height="23.8" rx="1.3" fill="#09090b" />
      <rect x="4" y="5.8" width="40" height="23.8" rx="1.3" fill={`url(#${id}wf)`} />
      <rect x="6" y="6.3" width="36" height="0.6" rx="0.3" fill="#fff" opacity="0.2" />
      <g clipPath={`url(#${id}wc)`}>
        <rect x="5.6" y="7.4" width="36.8" height="20.6" fill={`url(#${id}wp)`} />
        <circle cx="30" cy="14.5" r="9" fill={`url(#${id}wl)`} />
        <circle cx="30" cy="14.5" r="3.6" fill="#fffbeb" />
        <path
          d="M5.6 28V22.5H8.6V20H11.2V23.5H13.4V17.5H16.6V24H19V21H21.8V25H24.2V18.5H27.6V22H29.8V24.5H32.8V20.5H35.4V23H38.6V19.5H42.4V28z"
          fill="#2e1065"
          opacity="0.75"
        />
        {/* the joins between the wall's panels */}
        <path d="M17.87 7.4V28M30.13 7.4V28M5.6 17.7h36.8" stroke="#000" strokeWidth="0.35" opacity="0.3" />
        <path d="M5.6 7.4h14L8 28H5.6z" fill="#fff" opacity="0.1" />
      </g>
    </>
  )
}

/* ---- workshop parts: power supply, knob, relay, RGB LED, sound, magnets, chips, oscilloscope ---- */

function PowerSupply({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="1" stopColor="#1c1c20" />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4e4e7" />
          <stop offset="1" stopColor="#a1a1aa" />
        </linearGradient>
      </defs>
      <Shadow y={41} rx={19} />
      <path d="M15 12.5V10a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5" fill="none" stroke="#3f3f46" strokeWidth="1.8" />
      <rect x="4" y="12" width="40" height="27" rx="3" fill={`url(#${id}c)`} />
      <rect x="6.5" y="13" width="35" height="1" rx="0.5" fill="#fff" opacity="0.2" />
      <rect x="6" y="15" width="36" height="21.5" rx="1.8" fill={`url(#${id}f)`} />
      {/* the readout: volts in red, amps in green */}
      <rect x="8.5" y="17.5" width="18.5" height="10" rx="1.2" fill="#0d1110" />
      <rect x="10" y="19" width="12" height="3" rx="0.6" fill="#f87171" />
      <rect x="10" y="23.5" width="9" height="2.6" rx="0.6" fill="#4ade80" />
      {[13, 16.2, 19.4].map((x) => (
        <rect key={x} x={x} y="18.5" width="0.6" height="8.2" fill="#0d1110" />
      ))}
      <circle cx="23.6" cy="20.5" r="0.75" fill="#f87171" />
      <circle cx="21" cy="24.8" r="0.75" fill="#4ade80" />
      {/* the voltage and current knobs */}
      {[31.5, 38].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="22" r={i === 0 ? 3.8 : 3.1} fill="#18181b" />
          <circle cx={x} cy="22" r={i === 0 ? 2.8 : 2.2} fill="#3f3f46" />
          <path d={`M${x} 22l${i === 0 ? 1.6 : -1.3} -1.8`} stroke="#fafafa" strokeWidth="0.9" strokeLinecap="round" />
        </g>
      ))}
      <rect x="9" y="30" width="5.5" height="3.6" rx="0.8" fill="#16a34a" />
      <rect x="9.6" y="30.5" width="4.3" height="1.2" rx="0.6" fill="#86efac" opacity="0.7" />
      {/* the red and black posts */}
      <circle cx="31.5" cy="31.6" r="2.7" fill="#dc2626" />
      <circle cx="30.8" cy="30.9" r="0.9" fill="#fecaca" opacity="0.8" />
      <circle cx="38" cy="31.6" r="2.7" fill="#18181b" />
      <circle cx="37.3" cy="30.9" r="0.9" fill="#71717a" />
    </>
  )
}

function Potentiometer({ id }: ArtProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}b`} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#3730a3" />
        </radialGradient>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="0.55" stopColor="#c2410c" />
          <stop offset="1" stopColor="#fb923c" />
        </linearGradient>
        <radialGradient id={`${id}h`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="1" stopColor="#71717a" />
        </radialGradient>
      </defs>
      <Shadow y={44} rx={12} />
      {[18, 24, 30].map((x, i) => (
        <rect key={x} x={x - 1} y="30" width="2" height="13" rx="0.6" fill={i === 1 ? '#d4a017' : '#a1a1aa'} />
      ))}
      <circle cx="24" cy="21" r="13.5" fill={`url(#${id}b)`} />
      <circle cx="24" cy="21" r="13.5" fill="none" stroke="#1e1b4b" strokeWidth="0.8" opacity="0.5" />
      {/* the resistance track from B round to A, and the wiper resting on it */}
      <path d="M16.93 28.07A10 10 0 1 1 31.07 28.07" fill="none" stroke="#18181b" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M16.93 28.07A10 10 0 1 1 31.07 28.07" fill="none" stroke={`url(#${id}t)`} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M24 21 29 12.34" stroke="#f4f4f5" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="29" cy="12.34" r="1.7" fill="#fde68a" stroke="#a16207" strokeWidth="0.5" />
      <circle cx="24" cy="21" r="3.4" fill={`url(#${id}h)`} />
      <circle cx="24" cy="21" r="1.2" fill="#52525b" />
    </>
  )
}

function Relay({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <Shadow y={43} rx={16} />
      {[11, 14.5, 23, 27, 31].map((x) => (
        <rect key={x} x={x} y="36" width="1.4" height="6" rx="0.5" fill="#a1a1aa" />
      ))}
      <path d="M8 15 14 9h26l-6 6z" fill="#93c5fd" />
      <path d="M34 15 40 9v22l-6 6z" fill="#1e3a8a" />
      <rect x="8" y="15" width="26" height="22" fill={`url(#${id}r)`} />
      <path d="M9.5 15.6h23" stroke="#fff" strokeWidth="0.8" opacity="0.35" />
      <rect x="11" y="18.5" width="20" height="7.5" rx="0.8" fill="#eff6ff" opacity="0.92" />
      <path d="M13 21h11M13 23.6h7" stroke="#1e40af" strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
      {/* the coil and the switch it pulls, printed on the side */}
      <path d="M12 32.5c.8-2.4 2-2.4 2.8 0s2 2.4 2.8 0 2-2.4 2.8 0" fill="none" stroke="#dbeafe" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M23.5 32.5h2.5l4-2.6M30.5 32.5h1" fill="none" stroke="#dbeafe" strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="26" cy="32.5" r="0.7" fill="#dbeafe" />
    </>
  )
}

function RgbLed({ id }: ArtProps) {
  const glow = (key: string, color: string) => (
    <radialGradient id={`${id}${key}`}>
      <stop offset="0" stopColor={color} stopOpacity="0.95" />
      <stop offset="1" stopColor={color} stopOpacity="0" />
    </radialGradient>
  )
  return (
    <>
      <defs>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#cbd5e1" />
        </linearGradient>
        {glow('r', '#ef4444')}
        {glow('g', '#22c55e')}
        {glow('b', '#3b82f6')}
      </defs>
      <Shadow y={45} rx={11} />
      <path d="M18.5 30v12M22.5 30v15M26.5 30v12M30.5 30v11" stroke="#a1a1aa" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="14.5" y="27" width="20" height="4" rx="1.4" fill="#e2e8f0" />
      <path d="M16.5 28V16.5a8 8 0 0 1 16 0V28z" fill={`url(#${id}l)`} />
      <circle cx="21" cy="22" r="5" fill={`url(#${id}r)`} />
      <circle cx="24.5" cy="17" r="5" fill={`url(#${id}g)`} />
      <circle cx="28" cy="22" r="5" fill={`url(#${id}b)`} />
      <rect x="18.6" y="12.5" width="2" height="11" rx="1" fill="#fff" opacity="0.7" />
      <path d="M16.5 28V16.5a8 8 0 0 1 16 0V28z" fill="none" stroke="#94a3b8" strokeWidth="0.6" opacity="0.6" />
    </>
  )
}

function Speaker({ id }: ArtProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}f`} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#a1a1aa" />
          <stop offset="1" stopColor="#3f3f46" />
        </radialGradient>
        <radialGradient id={`${id}c`} cx="0.5" cy="0.5" r="0.55">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="1" stopColor="#141417" />
        </radialGradient>
        <radialGradient id={`${id}d`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#a1a1aa" />
          <stop offset="1" stopColor="#27272a" />
        </radialGradient>
      </defs>
      <Shadow y={43} rx={15} />
      <path
        d="M40.5 17a10 10 0 0 1 0 14M43.8 13.5a15 15 0 0 1 0 21"
        fill="none"
        stroke="#0891b2"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.75"
      />
      <circle cx="22" cy="24" r="16" fill={`url(#${id}f)`} />
      {[45, 135, 225, 315].map((a) => (
        <circle
          key={a}
          cx={22 + Math.cos((a * Math.PI) / 180) * 13.6}
          cy={24 + Math.sin((a * Math.PI) / 180) * 13.6}
          r="1.1"
          fill="#18181b"
        />
      ))}
      <circle cx="22" cy="24" r="12.6" fill="#27272a" />
      <circle cx="22" cy="24" r="11.2" fill={`url(#${id}c)`} />
      <circle cx="22" cy="24" r="8" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.12" />
      <circle cx="22" cy="24" r="4.4" fill={`url(#${id}d)`} />
      <ellipse cx="20.6" cy="22.4" rx="1.6" ry="1" fill="#fff" opacity="0.35" />
      <path d="M12.5 15.5a13 13 0 0 1 6-3.6" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    </>
  )
}

function Vibration({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="0.6" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#a1a1aa" />
        </linearGradient>
      </defs>
      <Shadow y={36} rx={14} />
      <path d="M31 28c3.5 1.2 6.5 4 9 8.5" fill="none" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M29.5 29.2c3.2 1.4 5.6 4.2 7.4 8.6" fill="none" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="22" cy="27" rx="12" ry="5.4" fill="#71717a" />
      <rect x="10" y="23.4" width="24" height="3.6" fill="#a1a1aa" />
      <ellipse cx="22" cy="23.4" rx="12" ry="5.4" fill={`url(#${id}t)`} />
      <ellipse cx="22" cy="23.4" rx="7.6" ry="3.3" fill="none" stroke="#a1a1aa" strokeWidth="0.7" />
      <ellipse cx="22" cy="23.4" rx="1.6" ry="0.8" fill="#a1a1aa" />
      {/* it shakes */}
      <g fill="none" stroke="#be185d" strokeWidth="1.6" strokeLinecap="round">
        <path d="M6.5 18.5c-2.2 2.6-2.2 6.4 0 9" />
        <path d="M37.5 18.5c2.2 2.6 2.2 6.4 0 9" />
        <path d="M3.4 16.5c-3 3.8-3 9.2 0 13" opacity="0.45" />
        <path d="M40.6 16.5c3 3.8 3 9.2 0 13" opacity="0.45" />
      </g>
    </>
  )
}

function Electromagnet({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}i`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#52525b" />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="0.5" stopColor="#c2410c" />
          <stop offset="1" stopColor="#7c2d12" />
        </linearGradient>
        <clipPath id={`${id}clip`}>
          <rect x="11" y="17.5" width="21" height="13" rx="2.4" />
        </clipPath>
      </defs>
      <Shadow y={39} rx={19} />
      {/* the magnetic field around it */}
      <g fill="none" stroke="#b45309" strokeWidth="0.9" strokeDasharray="1.6 1.6" opacity="0.5">
        <path d="M8 18c3-7 26-7 30 0" />
        <path d="M8 30c3 7 26 7 30 0" />
      </g>
      <path d="M14 30.5v6M29 30.5v5" stroke="#c2410c" strokeWidth="1.1" strokeLinecap="round" />
      <rect x="6" y="20" width="33" height="8" rx="1.4" fill={`url(#${id}i)`} />
      <rect x="3" y="17" width="4.8" height="14" rx="1" fill="#71717a" />
      <rect x="3.6" y="17.6" width="1.4" height="12.8" rx="0.7" fill="#d4d4d8" opacity="0.6" />
      <rect x="11" y="17.5" width="21" height="13" rx="2.4" fill={`url(#${id}w)`} />
      <g clipPath={`url(#${id}clip)`} stroke="#7c2d12" strokeWidth="0.7" opacity="0.55">
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M${12 + i * 2} 17.5l-1.2 13`} />
        ))}
      </g>
      <rect x="12" y="18.6" width="19" height="1.6" rx="0.8" fill="#fde68a" opacity="0.55" />
      {/* the north end, and a paperclip it has picked up */}
      <rect x="37.5" y="20" width="3" height="8" rx="1" fill="#ef4444" />
      <path
        d="M42.6 15.5v15.2a1.9 1.9 0 0 0 3.8 0V17.4a1.3 1.3 0 0 0-2.6 0v11.4"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1"
        strokeLinecap="round"
        transform="rotate(-8 44 24)"
      />
    </>
  )
}

function Regulator({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f4f5" />
          <stop offset="0.6" stopColor="#c4c4cc" />
          <stop offset="1" stopColor="#8b8b94" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#0c0c0e" />
        </linearGradient>
      </defs>
      <Shadow y={45} rx={11} />
      {[19, 24, 29].map((x) => (
        <path key={x} d={`M${x} 31v4.5l${x === 24 ? 0 : x < 24 ? -1.2 : 1.2} 2.5V44`} fill="none" stroke="#a1a1aa" strokeWidth="1.9" strokeLinejoin="round" />
      ))}
      <rect x="14" y="4.5" width="20" height="13" rx="1.2" fill={`url(#${id}t)`} />
      <circle cx="24" cy="10" r="2.7" fill="#52525b" />
      <circle cx="24" cy="10" r="1.8" fill="#27272a" />
      <rect x="14" y="15" width="20" height="17" rx="1.2" fill={`url(#${id}b)`} />
      <rect x="14" y="15" width="20" height="0.9" fill="#fff" opacity="0.15" />
      <rect x="17" y="19.5" width="14" height="1.4" rx="0.7" fill="#d4d4d8" opacity="0.85" />
      <rect x="18.5" y="23" width="11" height="1.2" rx="0.6" fill="#d4d4d8" opacity="0.5" />
      <circle cx="17.4" cy="28.4" r="0.9" fill="#52525b" />
    </>
  )
}

/** The gate symbols kids meet in every electronics book. `bubble` is where the NOT circle sits, if it has one. */
const GATE_SHAPES = {
  notGate: { body: 'M13 13 32 24 13 35z', inputs: [24], bubble: 34.5, back: 13, tip: 37 },
  andGate: { body: 'M13 12h10a12 12 0 0 1 0 24H13z', inputs: [18, 30], bubble: false, back: 14, tip: 35 },
  orGate: {
    body: 'M11 12h9c7.5 0 12.5 4.5 16 12-3.5 7.5-8.5 12-16 12h-9c3-3.6 4.6-7.6 4.6-12S14 15.6 11 12z',
    inputs: [18, 30],
    bubble: false,
    back: 15,
    tip: 36,
  },
  xorGate: {
    body: 'M13 12h9c7.5 0 12.5 4.5 16 12-3.5 7.5-8.5 12-16 12h-9c3-3.6 4.6-7.6 4.6-12S16 15.6 13 12z',
    inputs: [18, 30],
    bubble: false,
    back: 17,
    tip: 38,
  },
  // NAND and NOR: the AND and OR bodies moved left to make room for the bubble
  nandGate: { body: 'M11 12h10a12 12 0 0 1 0 24H11z', inputs: [18, 30], bubble: 35.5, back: 12, tip: 38 },
  norGate: {
    body: 'M9 12h9c7.5 0 12.5 4.5 16 12-3.5 7.5-8.5 12-16 12H9c3-3.6 4.6-7.6 4.6-12S12 15.6 9 12z',
    inputs: [18, 30],
    bubble: 36.5,
    back: 13,
    tip: 39,
  },
} as const

const GATE_COLORS = {
  notGate: ['#fdba74', '#ea580c', '#9a3412'],
  andGate: ['#86efac', '#16a34a', '#14532d'],
  orGate: ['#93c5fd', '#2563eb', '#1e3a8a'],
  xorGate: ['#d8b4fe', '#9333ea', '#581c87'],
  nandGate: ['#5eead4', '#0d9488', '#134e4a'],
  norGate: ['#a5b4fc', '#4f46e5', '#312e81'],
} as const

function Gate({ id, kind }: ArtProps & { kind: keyof typeof GATE_SHAPES }) {
  const shape = GATE_SHAPES[kind]
  const [light, mid, dark] = GATE_COLORS[kind]
  return (
    <>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.5" stopColor={mid} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      <Shadow y={42} rx={17} />
      <g stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round">
        {shape.inputs.map((y) => (
          <path key={y} d={`M4.5 ${y}H${shape.back}`} />
        ))}
        <path d={`M${shape.tip} 24H44`} />
      </g>
      {shape.inputs.map((y) => (
        <circle key={y} cx="4.5" cy={y} r="1.8" fill="#71717a" />
      ))}
      <circle cx="44" cy="24" r="1.8" fill="#71717a" />
      {kind === 'xorGate' && (
        <path d="M9 12c3 3.6 4.6 7.6 4.6 12S12 32.4 9 36" fill="none" stroke={dark} strokeWidth="1.8" strokeLinecap="round" />
      )}
      <path d={shape.body} fill={`url(#${id}g)`} stroke={dark} strokeWidth="1" strokeLinejoin="round" />
      <path d={shape.body} fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.25" transform="translate(0.6 0.8) scale(0.97)" />
      {shape.bubble && <circle cx={shape.bubble} cy="24" r="2.5" fill="#fff" stroke={dark} strokeWidth="1.2" />}
    </>
  )
}

const NotGate = ({ id }: ArtProps) => <Gate id={id} kind="notGate" />
const AndGate = ({ id }: ArtProps) => <Gate id={id} kind="andGate" />
const OrGate = ({ id }: ArtProps) => <Gate id={id} kind="orGate" />
const XorGate = ({ id }: ArtProps) => <Gate id={id} kind="xorGate" />
const NandGate = ({ id }: ArtProps) => <Gate id={id} kind="nandGate" />
const NorGate = ({ id }: ArtProps) => <Gate id={id} kind="norGate" />

function Timer555({ id }: ArtProps) {
  return (
    <>
      <Shadow y={41} rx={19} />
      <Pcb id={id} x={5} y={12} w={38} h={24} light="#2dd4bf" dark="#0f766e" edge="#134e4a" holes={[[8, 15], [40, 15], [8, 33], [40, 33]]} />
      {/* the 8-pin chip */}
      {[15, 18.6, 22.2, 25.8].map((x) => (
        <g key={x}>
          <rect x={x - 0.8} y="16" width="1.6" height="2.4" rx="0.4" fill="#d4d4d8" />
          <rect x={x - 0.8} y="29.4" width="1.6" height="2.4" rx="0.4" fill="#d4d4d8" />
        </g>
      ))}
      <Chip x={12.5} y={18} w={16} h={11.6} />
      <circle cx="12.5" cy="23.8" r="1.6" fill="#0f766e" />
      <circle cx="15.4" cy="27" r="0.7" fill="#52525b" />
      <rect x="16.5" y="21.6" width="9" height="1.2" rx="0.6" fill="#d4d4d8" opacity="0.6" />
      {/* the blinking LED and its timing capacitor */}
      <circle cx="35.5" cy="19.5" r="4.6" fill="#fca5a5" opacity="0.45" />
      <circle cx="35.5" cy="19.5" r="2.6" fill="#ef4444" />
      <circle cx="34.7" cy="18.7" r="0.8" fill="#fff" opacity="0.7" />
      <rect x="32.8" y="25.6" width="5.4" height="6.6" rx="1.2" fill="#2563eb" />
      <ellipse cx="35.5" cy="25.8" rx="2.7" ry="1" fill="#93c5fd" />
      <rect x="36.3" y="26.6" width="1" height="5" rx="0.5" fill="#bfdbfe" opacity="0.8" />
    </>
  )
}

function Oscilloscope({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4b5563" />
          <stop offset="1" stopColor="#1c2128" />
        </linearGradient>
        <radialGradient id={`${id}s`} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor="#0f3a20" />
          <stop offset="1" stopColor="#03110a" />
        </radialGradient>
      </defs>
      <Shadow y={41} rx={19} />
      <rect x="3" y="10" width="42" height="28" rx="3" fill={`url(#${id}c)`} />
      <rect x="5.5" y="11" width="37" height="1" rx="0.5" fill="#fff" opacity="0.2" />
      <rect x="5.5" y="13" width="26.5" height="22" rx="1.8" fill="#15191e" />
      <rect x="7" y="14.5" width="23.5" height="19" rx="1.2" fill={`url(#${id}s)`} />
      <g stroke="#7dffaa" strokeWidth="0.4" opacity="0.2">
        {[12.9, 18.75, 24.6].map((x) => (
          <path key={x} d={`M${x} 14.5v19`} />
        ))}
        {[19.25, 24, 28.75].map((y) => (
          <path key={y} d={`M7 ${y}h23.5`} />
        ))}
      </g>
      <path d="M8 24c2-6.5 3.6-6.5 5.4 0s3.6 6.5 5.4 0 3.6-6.5 5.4 0 3.6 6.5 5.2 2" fill="none" stroke="#4ade80" strokeWidth="2.6" opacity="0.3" strokeLinecap="round" />
      <path d="M8 24c2-6.5 3.6-6.5 5.4 0s3.6 6.5 5.4 0 3.6-6.5 5.4 0 3.6 6.5 5.2 2" fill="none" stroke="#bbf7d0" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="37.8" cy="17.8" r="2.9" fill="#18181b" />
      <circle cx="37.8" cy="17.8" r="2" fill="#52525b" />
      <path d="M37.8 17.8l1.1-1.4" stroke="#fafafa" strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="37.8" cy="24.6" r="2.2" fill="#18181b" />
      <circle cx="37.8" cy="24.6" r="1.4" fill="#52525b" />
      <circle cx="37.8" cy="31.2" r="2" fill="#d4a017" />
      <circle cx="37.8" cy="31.2" r="0.9" fill="#0c0c0e" />
    </>
  )
}

/* ---- more sensor modules ---- */

/** The blue trimmer and the little comparator chip most sensor modules carry. */
function Trimmer({ x, y }: { x: number; y: number }) {
  return (
    <>
      <rect x={x} y={y + 1.2} width="5.6" height="4.4" rx="0.6" fill="#1d4ed8" />
      <rect x={x} y={y} width="5.6" height="2.2" rx="0.6" fill="#93c5fd" />
      <circle cx={x + 4.1} cy={y + 1.1} r="0.85" fill="#fbbf24" />
      <path d={`M${x + 3.5} ${y + 1.1}h1.2`} stroke="#92400e" strokeWidth="0.4" strokeLinecap="round" />
    </>
  )
}

/** A tiny pair of status lights: red for power, green for the signal. */
function ModuleLeds({ x, y, gap = 3 }: { x: number; y: number; gap?: number }) {
  return (
    <>
      <circle cx={x} cy={y} r="1.4" fill="#f87171" opacity="0.4" />
      <circle cx={x} cy={y} r="0.65" fill="#ef4444" />
      <circle cx={x + gap} cy={y} r="1.4" fill="#4ade80" opacity="0.4" />
      <circle cx={x + gap} cy={y} r="0.65" fill="#22c55e" />
    </>
  )
}

function FlameSensor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}f`} cx="0.5" cy="0.78" r="0.75">
          <stop offset="0" stopColor="#fefce8" />
          <stop offset="0.35" stopColor="#fde047" />
          <stop offset="0.7" stopColor="#f97316" />
          <stop offset="1" stopColor="#dc2626" />
        </radialGradient>
        <linearGradient id={`${id}e`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="0.45" stopColor="#18181b" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
      </defs>
      <Shadow y={42} rx={19} />
      <Legs xs={[29, 32, 35]} y={33} len={8} />
      <Pcb id={id} x={17} y={20} w={27} h={14} light="#60a5fa" dark="#1d4ed8" edge="#1e3a8a" holes={[[41.2, 22.8]]} />
      <Strip x={27.5} y={30.4} w={9} />
      <Trimmer x={26} y={21.6} />
      <rect x="33.6" y="23.4" width="4.4" height="3" rx="0.3" fill="#18181b" />
      <ModuleLeds x={39.4} y={27.4} gap={2.8} />
      {/* the dark eye, its legs bent so it looks at the fire */}
      <path d="M20.6 23.4h-2.6M20.6 25.6h-2.6" stroke="#a1a1aa" strokeWidth="0.9" strokeLinecap="round" />
      <rect x="10.5" y="21" width="8.5" height="7" rx="3.5" fill={`url(#${id}e)`} />
      <rect x="17.4" y="20.4" width="1.8" height="8.2" rx="0.6" fill="#27272a" />
      <rect x="12" y="22" width="4.6" height="1" rx="0.5" fill="#fff" opacity="0.35" />
      {/* a candle flame in front of it */}
      <rect x="4.2" y="26" width="3.6" height="9" rx="0.8" fill="#fef3c7" />
      <rect x="4.2" y="26" width="1" height="9" rx="0.5" fill="#fff" opacity="0.7" />
      <path d="M6 26v-1.6" stroke="#3f3f46" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M6 25c-2.6-.8-3.4-3.8-1.9-6.6.8-1.6 1.5-3 1.6-5 1.6 1.6 3.6 4 3.4 7.2-.1 2.4-1.2 4-3.1 4.4z" fill={`url(#${id}f)`} />
      <path d="M6.1 24.2c-1-.5-1.2-1.9-.6-3.1.3.9.8 1.2 1.4 1.3.2.8 0 1.5-.8 1.8z" fill="#fff7ed" opacity="0.85" />
    </>
  )
}

function RainSensor({ id }: ArtProps) {
  const drop = (x: number, y: number, s = 1) => (
    <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0-2.6c1 1.3 1.8 2.3 1.8 3.2a1.8 1.8 0 0 1-3.6 0c0-.9.8-1.9 1.8-3.2z" fill="#38bdf8" />
      <ellipse cx="-0.6" cy="0.3" rx="0.45" ry="0.7" fill="#fff" opacity="0.75" />
    </g>
  )
  return (
    <>
      <Shadow y={40} rx={18} />
      <path d="M36.5 22.5h7M36.5 26h7" stroke="#a1a1aa" strokeWidth="1.2" strokeLinecap="round" />
      <Pcb id={id} x={5} y={12} w={32} h={24} light="#3b82f6" dark="#1e3a8a" edge="#172554" holes={[[7.6, 14.6], [7.6, 33.4]]} />
      {/* the two combs of the plate, their teeth in between each other */}
      <g fill="none" stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round">
        <path d="M11 15v18M33.5 15v18" />
        <path d="M11 16.5h19.5M11 23.2h19.5M11 29.9h19.5" />
        <path d="M33.5 19.8H14M33.5 26.5H14M33.5 32.6H14" />
      </g>
      <rect x="10" y="13.4" width="24" height="0.8" rx="0.4" fill="#fff" opacity="0.3" />
      {drop(17, 22, 0.9)}
      {drop(27, 29.4, 1.1)}
      {drop(22.5, 17.3, 0.7)}
      {/* a drop still falling */}
      <g opacity="0.85">{drop(30, 6.5, 1)}</g>
      <path d="M30 2.2v1.4M26.2 4.5v1" stroke="#7dd3fc" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
    </>
  )
}

function WaterSensor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#bae6fd" stopOpacity="0.55" />
          <stop offset="0.25" stopColor="#f0f9ff" stopOpacity="0.25" />
          <stop offset="0.8" stopColor="#e0f2fe" stopOpacity="0.2" />
          <stop offset="1" stopColor="#7dd3fc" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.75" />
          <stop offset="1" stopColor="#0369a1" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="1" stopColor="#991b1b" />
        </linearGradient>
      </defs>
      <Shadow y={44} rx={13} />
      {/* the red strip with its long copper fingers, header pins on top */}
      <path d="M21.5 2.5v4M24 2.5v4M26.5 2.5v4" stroke="#a1a1aa" strokeWidth="1" strokeLinecap="round" />
      <rect x="18.5" y="5.5" width="11" height="3" rx="0.4" fill="#18181b" />
      <rect x="18" y="8" width="12" height="30" rx="1.2" fill={`url(#${id}r)`} />
      <g stroke="#fbbf24" strokeWidth="0.9" strokeLinecap="round" opacity="0.9">
        <path d="M20.2 17v18M22.6 15v20M25 17v18M27.4 15v20" />
      </g>
      <circle cx="21" cy="11.2" r="1.2" fill="#fca5a5" opacity="0.5" />
      <circle cx="21" cy="11.2" r="0.55" fill="#fecaca" />
      {/* the glass, filled half way */}
      <path d="M11 26.5h26l-1.6 14a2 2 0 0 1-2 1.8H14.6a2 2 0 0 1-2-1.8z" fill={`url(#${id}w)`} />
      <path d="M11 26.5c2.2-1 4.4-1 6.5 0s4.4 1 6.5 0 4.4-1 6.5 0 4.4 1 6.5 0" fill="none" stroke="#e0f2fe" strokeWidth="0.8" opacity="0.9" />
      <path d="M10 18h28l-2.6 22.3a2 2 0 0 1-2 1.7H14.6a2 2 0 0 1-2-1.7z" fill={`url(#${id}g)`} stroke="#bae6fd" strokeWidth="0.7" />
      <rect x="12.2" y="20" width="1.2" height="18" rx="0.6" fill="#fff" opacity="0.6" />
    </>
  )
}

function HumiditySensor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
      </defs>
      <Shadow y={43} rx={16} />
      <Legs xs={[21, 24, 27]} y={35.5} len={6.5} />
      <Pcb id={id} x={11} y={30} w={26} h={7} light="#3f3f46" dark="#18181b" edge="#09090b" holes={[[13.6, 33.4]]} />
      <circle cx="33.6" cy="33.4" r="1.3" fill="#f87171" opacity="0.4" />
      <circle cx="33.6" cy="33.4" r="0.6" fill="#ef4444" />
      {/* the blue box with its little windows that let the air in */}
      <rect x="15" y="7" width="18" height="24" rx="1.6" fill={`url(#${id}h)`} />
      <rect x="16" y="7.8" width="16" height="0.9" rx="0.45" fill="#fff" opacity="0.35" />
      <g fill="#0c4a6e">
        {[11, 15, 19, 23].map((y) =>
          [17.5, 21.6, 25.7].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="3" height="2.4" rx="0.4" />),
        )}
      </g>
      <rect x="17.5" y="27" width="11.2" height="1.6" rx="0.4" fill="#e0f2fe" opacity="0.8" />
      {/* a drop of the water in the air */}
      <path d="M40 9c1.6 2 2.8 3.6 2.8 5a2.8 2.8 0 0 1-5.6 0c0-1.4 1.2-3 2.8-5z" fill="#7dd3fc" />
      <ellipse cx="39" cy="14" rx="0.6" ry="1" fill="#fff" opacity="0.8" />
      <circle cx="9" cy="14" r="1.1" fill="#7dd3fc" opacity="0.7" />
      <circle cx="7.5" cy="19.5" r="0.7" fill="#7dd3fc" opacity="0.55" />
    </>
  )
}

function HallSensor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}n`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f87171" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <Shadow y={42} rx={19} />
      <Legs xs={[21, 24, 27]} y={33} len={8} />
      <Pcb id={id} x={11} y={22} w={26} h={12} light="#818cf8" dark="#4338ca" edge="#312e81" holes={[[34.4, 24.6]]} />
      <Strip x={19.5} y={30.4} w={9} />
      <ModuleLeds x={28.5} y={25.4} gap={2.8} />
      <rect x="21" y="23.6" width="4" height="1.8" rx="0.3" fill="#18181b" />
      {/* the tiny black sensor on the edge, and the magnet coming close */}
      <path d="M13.4 24.4v-3.6M15 24.4v-3.6M16.6 24.4v-3.6" stroke="#a1a1aa" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M12.6 15.4h4.8v5.4h-4.8z" fill="#18181b" />
      <rect x="12.6" y="15.4" width="4.8" height="0.8" fill="#52525b" />
      <g fill="none" stroke="#a5b4fc" strokeWidth="0.8" strokeLinecap="round" opacity="0.85">
        <path d="M19.5 14.5c2.4-3 6-3 8.4 0" />
        <path d="M18.5 12.2c3-4.2 8.4-4.2 11.4 0" />
      </g>
      <path d="M21 13.8h6.5v6H21a1.4 1.4 0 0 1-1.4-1.4v-3.2a1.4 1.4 0 0 1 1.4-1.4z" fill={`url(#${id}n)`} transform="translate(9 0)" />
      <path d="M36.5 13.8H42a1.4 1.4 0 0 1 1.4 1.4v3.2a1.4 1.4 0 0 1-1.4 1.4h-5.5z" fill={`url(#${id}s)`} />
      <rect x="30.4" y="14.5" width="12.4" height="1" rx="0.5" fill="#fff" opacity="0.35" />
      <g fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 18.6v-3.2l2.4 3.2v-3.2" />
        <path d="M41.2 15.7c-.3-.4-2.1-.6-2.1.5 0 1.2 2.1.6 2.1 1.8 0 1-1.8 1-2.1.5" />
      </g>
    </>
  )
}

function IrSensor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8fafc" />
          <stop offset="0.5" stopColor="#c7d2fe" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id={`${id}k`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="0.5" stopColor="#18181b" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
      </defs>
      <Shadow y={42} rx={19} />
      <Legs xs={[33, 36, 39]} y={32} len={8.5} />
      <Pcb id={id} x={17} y={18} w={27} h={15} light="#34d399" dark="#047857" edge="#064e3b" holes={[[41.2, 20.6]]} />
      <Strip x={31.5} y={29.4} w={9} />
      <Trimmer x={25} y={19.4} />
      <rect x="32.2" y="21.2" width="4.4" height="3" rx="0.3" fill="#18181b" />
      <ModuleLeds x={38.4} y={25.4} gap={2.8} />
      {/* two eyes: one shines the light, one catches it when it bounces back */}
      <path d="M20 21.6h-3M20 27.6h-3" stroke="#a1a1aa" strokeWidth="0.9" strokeLinecap="round" />
      <rect x="8" y="18.6" width="9.5" height="6" rx="3" fill={`url(#${id}c)`} />
      <rect x="16.4" y="18.1" width="1.6" height="7" rx="0.5" fill="#a5b4fc" />
      <rect x="9.4" y="19.5" width="5.5" height="0.9" rx="0.45" fill="#fff" opacity="0.8" />
      <rect x="8" y="24.8" width="9.5" height="6" rx="3" fill={`url(#${id}k)`} />
      <rect x="16.4" y="24.3" width="1.6" height="7" rx="0.5" fill="#27272a" />
      <rect x="9.4" y="25.7" width="5.5" height="0.9" rx="0.45" fill="#fff" opacity="0.3" />
      <g fill="none" stroke="#f472b6" strokeWidth="0.9" strokeLinecap="round" opacity="0.7">
        <path d="M5.4 18.6a5 5 0 0 0 0 6" />
        <path d="M3 17a8 8 0 0 0 0 9.2" />
      </g>
    </>
  )
}

function LineSensor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
      <Shadow y={44} rx={20} />
      {/* white paper with a black line across it */}
      <path d="M8 31h36l-4 11H4z" fill={`url(#${id}p)`} stroke="#cbd5e1" strokeWidth="0.6" />
      <path d="M20.5 31h7.5l-2 11h-7.5z" fill="#18181b" />
      {/* the module above it, its eyes looking down */}
      <Legs xs={[30, 33, 36]} y={2.5} len={6} />
      <Pcb id={id} x={14} y={8} w={26} h={12} light="#475569" dark="#1e293b" edge="#0f172a" holes={[[37.4, 10.6]]} />
      <Trimmer x={28} y={9.6} />
      <ModuleLeds x={17.4} y={11.4} gap={2.8} />
      <rect x="20" y="17.4" width="8.5" height="7" rx="0.8" fill="#18181b" />
      <circle cx="22.2" cy="24.2" r="1.7" fill="#3b82f6" />
      <circle cx="26.3" cy="24.2" r="1.7" fill="#0a0a0a" stroke="#3f3f46" strokeWidth="0.4" />
      <circle cx="21.7" cy="23.7" r="0.5" fill="#bfdbfe" />
      <path d="M22.2 26.6l1.6 4.2M26.3 26.6l-1.4 4.2" stroke="#f472b6" strokeWidth="0.7" strokeDasharray="1 1" opacity="0.7" />
    </>
  )
}

function ForceSensor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}p`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="1" stopColor="#18181b" />
        </radialGradient>
        <radialGradient id={`${id}t`} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fde2cf" />
          <stop offset="1" stopColor="#e9a37a" />
        </radialGradient>
      </defs>
      <Shadow y={41} rx={19} />
      {/* the thin tail and its two legs */}
      <path d="M28 28.5h12.5" stroke="#d6d3d1" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M28 28.5h12.5" stroke="#a8a29e" strokeWidth="0.6" strokeDasharray="0.1 1.4" />
      <path d="M41.5 27.2h3.5M41.5 29.8h3.5" stroke="#a1a1aa" strokeWidth="1.1" strokeLinecap="round" />
      {/* the round pad with its silver fingers */}
      <circle cx="18" cy="28.5" r="11" fill="#e7e5e4" />
      <circle cx="18" cy="28.5" r="9" fill={`url(#${id}p)`} />
      <g fill="none" stroke="#d4d4d8" strokeWidth="0.55" opacity="0.8">
        <path d="M11 28.5h14M12 25h12M12 32h12M14 21.8h8M14 35.2h8" />
      </g>
      {/* a thumb pressing on it */}
      <circle cx="18" cy="28.5" r="10.2" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.7" />
      <path d="M13 19.5c0-5.5 1.6-12 5-12s5 6.5 5 12a5 3 0 0 1-10 0z" fill={`url(#${id}t)`} />
      <ellipse cx="18" cy="19" rx="3" ry="1.6" fill="#fbcfb4" opacity="0.8" />
      <path d="M15.6 9.8c.4-1 1.4-1.6 2.4-1.6" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
    </>
  )
}

function PulseSensor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}g`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#4ade80" />
          <stop offset="1" stopColor="#15803d" />
        </radialGradient>
      </defs>
      <Shadow y={44} rx={15} />
      {/* its three wires down to a plug */}
      <g fill="none" strokeWidth="1.2" strokeLinecap="round">
        <path d="M22.6 29c0 4-1.2 7-3.4 9.5" stroke="#7c3aed" />
        <path d="M24 29c0 4 0 7 0 9.5" stroke="#dc2626" />
        <path d="M25.4 29c0 4 1.2 7 3.4 9.5" stroke="#18181b" />
      </g>
      <rect x="17.5" y="38" width="13" height="4.4" rx="0.8" fill="#18181b" />
      {/* the round board with a heart on it and its green light in the middle */}
      <circle cx="24" cy="17.5" r="12.2" fill="#14532d" transform="translate(0 1)" />
      <circle cx="24" cy="17.5" r="12.2" fill={`url(#${id}g)`} />
      <path
        d="M24 26.4c-5.4-3.6-8.6-6.8-8.6-10.2a4.2 4.2 0 0 1 8.6-1.8 4.2 4.2 0 0 1 8.6 1.8c0 3.4-3.2 6.6-8.6 10.2z"
        fill="none"
        stroke="#f0fdf4"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="17.8" r="3" fill="#bbf7d0" opacity="0.45" />
      <rect x="22.6" y="16.4" width="2.8" height="2.8" rx="0.5" fill="#86efac" />
      <path d="M8 11.5h3l1.2-2.6 1.6 5 1.2-2.4h2" fill="none" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" transform="translate(-6 -2)" />
    </>
  )
}

function KnockSensor({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f4f5" />
          <stop offset="0.5" stopColor="#a1a1aa" />
          <stop offset="1" stopColor="#52525b" />
        </linearGradient>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <Shadow y={42} rx={19} />
      <Legs xs={[21, 24, 27]} y={33} len={8} />
      <Pcb id={id} x={6} y={21} w={34} h={13} light="#60a5fa" dark="#1d4ed8" edge="#1e3a8a" holes={[[8.6, 23.6], [37.4, 23.6]]} />
      <Strip x={19.5} y={30.4} w={9} />
      {/* the little can with a spring inside that jiggles when knocked */}
      <rect x="10" y="22.6" width="11" height="5" rx="2.5" fill={`url(#${id}c)`} />
      <rect x="20" y="23.4" width="2" height="3.4" rx="0.6" fill="#22c55e" />
      <Trimmer x={24} y={22.6} />
      <ModuleLeds x={32.6} y={27.4} gap={2.8} />
      {/* a wooden mallet tapping on it */}
      <path d="M31 4.5 19.5 16" stroke={`url(#${id}m)`} strokeWidth="2" strokeLinecap="round" />
      <rect x="12" y="13.5" width="10" height="5.6" rx="2" fill="#92400e" transform="rotate(-45 17 16.3)" />
      <rect x="13" y="14" width="8" height="1.2" rx="0.6" fill="#fcd34d" opacity="0.5" transform="rotate(-45 17 16.3)" />
      <g fill="none" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" opacity="0.8">
        <path d="M7 15.5l-2-1.6M8.6 12.5 7.8 10M5.6 19H3" />
      </g>
    </>
  )
}

/* ---- more switches ---- */

/** A tiny A or B printed on a part. */
function Letter({ char, x, y }: { char: 'A' | 'B'; x: number; y: number }) {
  return (
    <path
      d={char === 'A' ? `M${x - 1.3} ${y + 1.6}l1.3-3.4 1.3 3.4M${x - 0.8} ${y + 0.5}h1.6` : `M${x - 1} ${y + 1.6}v-3.2h1.2a.8.8 0 0 1 0 1.6H${x - 1}h1.4a.8.8 0 0 1 0 1.6z`}
      fill="none"
      stroke="#3f3f46"
      strokeWidth="0.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

function SlideSwitch({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f4f5" />
          <stop offset="0.45" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#8b8b94" />
        </linearGradient>
        <linearGradient id={`${id}k`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      <Shadow y={42} rx={17} />
      {[15, 24, 33].map((x) => (
        <rect key={x} x={x - 0.9} y="30" width="1.8" height="10.5" rx="0.6" fill="#a1a1aa" />
      ))}
      <rect x="8" y="16" width="32" height="15" rx="1.6" fill={`url(#${id}s)`} />
      <rect x="9" y="16.8" width="30" height="0.9" rx="0.45" fill="#fff" opacity="0.8" />
      {/* the slot, and the knob pushed over to A */}
      <rect x="13" y="18.6" width="22" height="5.4" rx="0.8" fill="#3f3f46" />
      <rect x="13.6" y="10.6" width="8.4" height="12" rx="1.4" fill={`url(#${id}k)`} />
      <rect x="14.6" y="11.4" width="1" height="10" rx="0.5" fill="#fff" opacity="0.25" />
      {[13.6, 15.6, 17.6].map((y) => (
        <rect key={y} x="15" y={y} width="5.6" height="0.7" rx="0.35" fill="#71717a" />
      ))}
      <Letter char="A" x={11} y={27} />
      <Letter char="B" x={37} y={27} />
      <path d="M15 27.4h3.4" stroke="#16a34a" strokeWidth="1" strokeLinecap="round" />
    </>
  )
}

function MicroSwitch({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f4f5" />
          <stop offset="1" stopColor="#a1a1aa" />
        </linearGradient>
      </defs>
      <Shadow y={42} rx={18} />
      {[12, 24, 36].map((x) => (
        <rect key={x} x={x - 1.6} y="33" width="3.2" height="7.5" rx="0.6" fill="#d4d4d8" />
      ))}
      {[12, 24, 36].map((x) => (
        <circle key={x} cx={x} cy="38.6" r="0.75" fill="#71717a" />
      ))}
      <rect x="6" y="20" width="36" height="14" rx="1.6" fill={`url(#${id}b)`} />
      <rect x="7" y="20.8" width="34" height="0.9" rx="0.45" fill="#fff" opacity="0.2" />
      <circle cx="11" cy="27" r="1.6" fill="#18181b" stroke="#52525b" strokeWidth="0.5" />
      <circle cx="37" cy="27" r="1.6" fill="#18181b" stroke="#52525b" strokeWidth="0.5" />
      {/* the red plunger and the metal lever with its little wheel */}
      <rect x="25" y="16.5" width="4.4" height="4" rx="0.8" fill="#dc2626" />
      <path d="M9 19.6 37.5 12.6" stroke={`url(#${id}l)`} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="9" cy="19.6" r="1.3" fill="#a1a1aa" />
      <circle cx="39.5" cy="11.8" r="3" fill="#e4e4e7" stroke="#71717a" strokeWidth="0.7" />
      <circle cx="39.5" cy="11.8" r="0.9" fill="#71717a" />
    </>
  )
}

function Joystick({ id }: ArtProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}c`} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="1" stopColor="#09090b" />
        </radialGradient>
      </defs>
      <Shadow y={43} rx={18} />
      <Legs xs={[16, 20, 24, 28, 32]} y={36} len={6} />
      <Pcb id={id} x={7} y={24} w={34} h={13} light="#3f3f46" dark="#18181b" edge="#09090b" holes={[[9.8, 26.6], [38.2, 26.6]]} />
      <Strip x={14} y={33.4} w={20} />
      {/* the gimbal, the stick and its round thumb cap */}
      <ellipse cx="24" cy="27" rx="11" ry="4.4" fill="#27272a" />
      <path d="M14.6 27a9.4 3.6 0 0 1 18.8 0" fill="none" stroke="#52525b" strokeWidth="1.4" />
      <rect x="22.6" y="15" width="2.8" height="12" rx="1.2" fill="#71717a" />
      <ellipse cx="24" cy="15" rx="9" ry="3.6" fill="#18181b" />
      <path d="M15 15v-3.2a9 3.6 0 0 0 18 0V15a9 3.6 0 0 1-18 0z" fill={`url(#${id}c)`} />
      <ellipse cx="24" cy="11.8" rx="9" ry="3.6" fill="#3f3f46" />
      <ellipse cx="24" cy="11.8" rx="6.4" ry="2.4" fill="#27272a" />
      <path d="M18 11c1.4-1.2 3.6-1.8 6-1.8" stroke="#a1a1aa" strokeWidth="0.7" strokeLinecap="round" opacity="0.6" />
    </>
  )
}

/* ---- small power sources ---- */

function Lemon({ id }: ArtProps) {
  const lemon = 'M3.5 0c2-4.2 7-7 12.5-7S26.5-4.2 28.5 0c-2 4.2-7 7-12.5 7S5.5 4.2 3.5 0z'
  return (
    <>
      <defs>
        <radialGradient id={`${id}l`} cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fef9c3" />
          <stop offset="0.45" stopColor="#facc15" />
          <stop offset="1" stopColor="#ca8a04" />
        </radialGradient>
      </defs>
      <Shadow y={40} rx={20} />
      {/* the lemon behind, and the wire that joins the two */}
      <g transform="translate(14 18)">
        <path d={lemon} fill={`url(#${id}l)`} opacity="0.92" />
      </g>
      <path d="M33 13.5c3.5-4 7-3.6 8-1.2" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
      <g transform="translate(2 29)">
        <path d={lemon} fill={`url(#${id}l)`} />
        <path d="M2.2 0 0 0" stroke="#65a30d" strokeWidth="1.6" strokeLinecap="round" />
        <ellipse cx="11" cy="-3.6" rx="4" ry="1.2" fill="#fff" opacity="0.45" />
      </g>
      {/* a copper coin in one, a zinc nail in the other */}
      <rect x="8" y="16.5" width="6" height="9" rx="3" fill="#c2410c" />
      <rect x="9" y="17.4" width="1.4" height="7" rx="0.7" fill="#fdba74" opacity="0.8" />
      <path d="M22 18v10" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20.4 18h3.2" stroke="#d4d4d8" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M22 18c0-4 4-6.5 8-5" fill="none" stroke="#18181b" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 16.5c0-5-3-8-7-8.5" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
    </>
  )
}

function CoinCell({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="0.5" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#8b8b94" />
        </linearGradient>
        <linearGradient id={`${id}e`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#71717a" />
          <stop offset="0.4" stopColor="#e4e4e7" />
          <stop offset="1" stopColor="#71717a" />
        </linearGradient>
      </defs>
      <Shadow y={40} rx={18} />
      {/* the black holder and its pins */}
      <path d="M14 33.5v4.5M34 33.5v4.5" stroke="#a1a1aa" strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="24" cy="30" rx="18.5" ry="8" fill="#18181b" />
      <ellipse cx="24" cy="28.4" rx="18.5" ry="8" fill="#27272a" />
      {/* the shiny cell, + side up */}
      <path d="M8 24v3a16 6.4 0 0 0 32 0v-3z" fill={`url(#${id}e)`} />
      <ellipse cx="24" cy="24" rx="16" ry="6.4" fill={`url(#${id}s)`} />
      <ellipse cx="24" cy="24" rx="13.6" ry="5.2" fill="none" stroke="#a1a1aa" strokeWidth="0.5" opacity="0.7" />
      <path d="M17.6 23.4h3.2M19.2 21.9v3" stroke="#52525b" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M23 24.8h7.4M24 22.6h5" stroke="#71717a" strokeWidth="0.7" strokeLinecap="round" opacity="0.8" />
      <ellipse cx="17" cy="21.2" rx="4.6" ry="1.2" fill="#fff" opacity="0.7" />
      {/* the springy clip over the top */}
      <path d="M33 16.5c3.5.6 6 2.4 6.6 5" fill="none" stroke="#d4d4d8" strokeWidth="2" strokeLinecap="round" />
      <path d="M26.5 19.4 33 16.5" stroke="#d4d4d8" strokeWidth="2" strokeLinecap="round" />
    </>
  )
}

function Dynamo({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdba74" />
          <stop offset="0.5" stopColor="#ea580c" />
          <stop offset="1" stopColor="#9a3412" />
        </linearGradient>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a1a1aa" />
          <stop offset="0.5" stopColor="#52525b" />
          <stop offset="1" stopColor="#27272a" />
        </linearGradient>
      </defs>
      <Shadow y={41} rx={19} />
      <path d="M42 30.5h3.5M42 34h3.5" stroke="#a1a1aa" strokeWidth="1.1" strokeLinecap="round" />
      {/* the motor that makes the power, and the gearbox in front */}
      <rect x="24" y="23" width="18" height="15" rx="3" fill={`url(#${id}m)`} />
      <path d="M28 23v15M32 23v15M36 23v15" stroke="#18181b" strokeWidth="0.5" opacity="0.35" />
      <rect x="6" y="19" width="20" height="21" rx="3" fill={`url(#${id}b)`} />
      <rect x="7.5" y="20" width="17" height="1" rx="0.5" fill="#fff" opacity="0.35" />
      <circle cx="16" cy="29.5" r="5.6" fill="#7c2d12" opacity="0.35" />
      <circle cx="16" cy="29.5" r="2" fill="#d4d4d8" />
      {/* the crank arm and its handle */}
      <path d="M16 29.5 25.5 13.5" stroke="#d4d4d8" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 29.5 25.5 13.5" stroke="#fff" strokeWidth="0.7" strokeLinecap="round" opacity="0.5" />
      <rect x="22.5" y="4.5" width="6" height="9.5" rx="3" fill="#dc2626" />
      <rect x="23.5" y="5.4" width="1.3" height="7.6" rx="0.65" fill="#fecaca" opacity="0.6" />
      <path d="M33 9.5a9 9 0 0 1 3.4 7" fill="none" stroke="#f97316" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <path d="M36.4 16.5l-1.6-1.4M36.4 16.5l1.3-1.7" stroke="#f97316" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </>
  )
}

function PowerBank({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#475569" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <Shadow y={39} rx={19} />
      {/* the cable out of its USB port */}
      <path d="M41 24c4 0 4.5 5 2 8.5" fill="none" stroke="#e4e4e7" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="38.6" y="21.5" width="4" height="5" rx="0.6" fill="#a1a1aa" />
      <rect x="5" y="14" width="35" height="21" rx="4" fill="#0f172a" transform="translate(0 1.4)" />
      <rect x="5" y="14" width="35" height="21" rx="4" fill={`url(#${id}b)`} />
      <rect x="8" y="15" width="29" height="1" rx="0.5" fill="#fff" opacity="0.25" />
      {/* four blue lights: it is full */}
      {[12, 16, 20, 24].map((x) => (
        <g key={x}>
          <circle cx={x} cy="29.5" r="1.8" fill="#38bdf8" opacity="0.35" />
          <circle cx={x} cy="29.5" r="0.85" fill="#7dd3fc" />
        </g>
      ))}
      <path d="M11 21.5h3.4l-1.6 3.4h3.6l-5 5.4 1.6-4H9.6z" fill="#7dd3fc" opacity="0.9" transform="translate(18 -4) scale(0.9)" />
      <rect x="31.5" y="27.4" width="4.4" height="2.6" rx="1.3" fill="#1e293b" stroke="#64748b" strokeWidth="0.5" />
    </>
  )
}

/* ---- the lab parts: diodes and switches, lights and movers, logic modules, meters ---- */

function Zener({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fed7aa" />
          <stop offset="0.3" stopColor="#fb923c" />
          <stop offset="0.75" stopColor="#c2410c" />
          <stop offset="1" stopColor="#7c2d12" />
        </linearGradient>
        <clipPath id={`${id}clip`}>
          <rect x="13" y="18.5" width="22" height="11" rx="5.5" />
        </clipPath>
      </defs>
      <Shadow y={35} rx={14} />
      <path d="M2.5 24h43" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="13" y="18.5" width="22" height="11" rx="5.5" fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}clip)`}>
        {/* seen through the glass: the two metal slugs and the tiny chip held between them */}
        <rect x="12" y="21.4" width="10.8" height="5.2" rx="0.8" fill="#7c2d12" opacity="0.5" />
        <rect x="25.2" y="21.4" width="10.8" height="5.2" rx="0.8" fill="#7c2d12" opacity="0.5" />
        <rect x="22.8" y="22.5" width="2.4" height="3" fill="#1c1917" opacity="0.75" />
        {/* the black band marks the striped end */}
        <rect x="15.2" y="18.5" width="3.6" height="11" fill="#18181b" />
        {/* glass bends light back up along its lower edge */}
        <rect x="13" y="26.8" width="22" height="1" fill="#fdba74" opacity="0.55" />
      </g>
      <rect x="15.6" y="19.8" width="17.2" height="1.7" rx="0.85" fill="#fff" opacity="0.6" />
    </>
  )
}

function Pnp({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#0c0c0e" />
        </linearGradient>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b8b94" />
          <stop offset="1" stopColor="#3f3f46" />
        </linearGradient>
      </defs>
      <Shadow y={44} rx={11} />
      <rect x="17.6" y="31" width="2" height="12" rx="0.6" fill="#a1a1aa" />
      <rect x="23" y="31" width="2" height="12" rx="0.6" fill="#a1a1aa" />
      <rect x="28.4" y="31" width="2" height="12" rx="0.6" fill="#a1a1aa" />
      <path d="M14 13a10 4.5 0 0 1 20 0z" fill={`url(#${id}t)`} />
      <path d="M14 13h20v17.5a1.5 1.5 0 0 1-1.5 1.5h-17a1.5 1.5 0 0 1-1.5-1.5z" fill={`url(#${id}f)`} />
      <rect x="14" y="13" width="20" height="0.9" fill="#fff" opacity="0.14" />
      <ellipse cx="20" cy="10.6" rx="3.6" ry="0.9" fill="#fff" opacity="0.25" />
      <rect x="18" y="16.6" width="12" height="1.1" rx="0.55" fill="#d4d4d8" opacity="0.6" />
      {/* printed in amber: the PNP symbol, its arrow pointing in */}
      <g fill="none" stroke="#fbbf24" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="24" cy="24.4" r="4.7" strokeWidth="0.6" />
        <path d="M19.3 24.4h2.6M21.9 22v4.8M21.9 23.2l3.4-2.2V19.7M21.9 25.6l3.4 2.2v1.3" strokeWidth="0.75" />
      </g>
      <path d="M22.66 26.09 24.41 26.33 23.59 27.59z" fill="#fbbf24" />
    </>
  )
}

function Mosfet({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f4f5" />
          <stop offset="0.55" stopColor="#c4c4cc" />
          <stop offset="1" stopColor="#8b8b94" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#0c0c0e" />
        </linearGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#71717a" />
        </linearGradient>
        <mask id={`${id}m`}>
          <rect width="48" height="48" fill="#fff" />
          <circle cx="26.5" cy="9.2" r="2.3" fill="#000" />
        </mask>
      </defs>
      <Shadow y={45} rx={12} />
      {/* three straight legs, wide at the shoulder */}
      {[18.5, 23, 27.5].map((x) => (
        <g key={x}>
          <rect x={x - 1.25} y="30" width="2.5" height="4.2" fill={`url(#${id}l)`} />
          <rect x={x - 0.65} y="33" width="1.3" height="11" rx="0.5" fill={`url(#${id}l)`} />
        </g>
      ))}
      {/* the metal tab behind the body, with its screw hole and side notches */}
      <g mask={`url(#${id}m)`}>
        <path d="M16.5 4.4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v8.6h-0.7v1.8h0.7V16h-20v-1.2h0.7V13h-0.7z" fill="#71717a" transform="translate(0.7 0)" />
        <path d="M16.5 4.4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v8.6h-0.7v1.8h0.7V16h-20v-1.2h0.7V13h-0.7z" fill={`url(#${id}t)`} />
        <path d="M24.2 9.2a2.3 2.3 0 0 1 4.6 0" fill="none" stroke="#3f3f46" strokeWidth="0.9" opacity="0.7" />
      </g>
      <rect x="17.5" y="3.9" width="18" height="0.8" rx="0.4" fill="#fff" opacity="0.7" />
      {/* the body: top, side and front */}
      <path d="M14 17.4 16.5 14.6h17L31 17.4z" fill="#52525b" />
      <path d="M31 17.4 33.5 14.6v13.8L31 31.2z" fill="#09090b" />
      <rect x="14" y="17.4" width="17" height="13.8" rx="0.6" fill={`url(#${id}b)`} />
      <rect x="14.6" y="17.6" width="15.8" height="0.7" rx="0.35" fill="#fff" opacity="0.18" />
      <rect x="16.6" y="20.6" width="11.8" height="1.3" rx="0.65" fill="#d4d4d8" opacity="0.85" />
      <rect x="16.6" y="23.6" width="8" height="1.1" rx="0.55" fill="#d4d4d8" opacity="0.5" />
      <circle cx="27.4" cy="24.1" r="1.1" fill="none" stroke="#a5b4fc" strokeWidth="0.6" opacity="0.8" />
      <circle cx="16.9" cy="28.2" r="0.85" fill="#000" opacity="0.6" />
      <circle cx="17.1" cy="28" r="0.85" fill="#3f3f46" />
    </>
  )
}

function Optocoupler({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#141417" />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c0a09" />
          <stop offset="1" stopColor="#292524" />
        </linearGradient>
        <linearGradient id={`${id}beam`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f87171" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f87171" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e4e4e7" />
          <stop offset="1" stopColor="#71717a" />
        </linearGradient>
      </defs>
      <Shadow y={42} rx={17} />
      {/* the back legs peek over the top; the front ones bend down to the table */}
      {[17.5, 30.5].map((x) => (
        <g key={x}>
          <rect x={x - 1.5} y="8.6" width="3" height="4.4" rx="0.4" fill="#a1a1aa" />
          <rect x={x - 1.5} y="29" width="3" height="4.4" fill={`url(#${id}l)`} />
          <rect x={x - 0.7} y="32.6" width="1.4" height="8.4" rx="0.5" fill={`url(#${id}l)`} />
        </g>
      ))}
      <rect x="9" y="11" width="30" height="20.6" rx="1.4" fill="#000" />
      <rect x="9" y="11" width="30" height="17.8" rx="1.4" fill={`url(#${id}b)`} />
      <rect x="10.2" y="11.5" width="27.6" height="0.8" rx="0.4" fill="#fff" opacity="0.18" />
      <circle cx="11.6" cy="14" r="1" fill="#52525b" />
      {/* a peek inside: the LED shines across the gap onto the light switch */}
      <rect x="12.4" y="15.4" width="23.2" height="10.4" rx="1.2" fill={`url(#${id}w)`} stroke="#52525b" strokeWidth="0.45" />
      <rect x="13.4" y="22" width="6.6" height="2.6" rx="0.3" fill="#71717a" />
      <rect x="28" y="22" width="6.6" height="2.6" rx="0.3" fill="#71717a" />
      <path d="M18.4 20.6 30 18v5z" fill={`url(#${id}beam)`} />
      <circle cx="17.2" cy="20.4" r="3.8" fill="#ef4444" opacity="0.35" />
      <circle cx="17.2" cy="20.4" r="1.9" fill="#f87171" />
      <circle cx="16.7" cy="19.9" r="0.6" fill="#fff" opacity="0.9" />
      <rect x="29.6" y="18.3" width="3.8" height="3.8" rx="0.4" fill="#3f3f46" stroke="#a1a1aa" strokeWidth="0.4" />
      <rect x="30.1" y="18.8" width="2.8" height="0.8" fill="#fca5a5" opacity="0.7" />
      <rect x="12.9" y="15.9" width="22.2" height="1" rx="0.5" fill="#fff" opacity="0.22" />
    </>
  )
}

function Laser({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}br`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fef3c7" />
          <stop offset="0.3" stopColor="#e8c063" />
          <stop offset="0.7" stopColor="#a87b2c" />
          <stop offset="1" stopColor="#6b4a14" />
        </linearGradient>
        <linearGradient id={`${id}card`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fbf8f1" />
          <stop offset="1" stopColor="#ddd6c6" />
        </linearGradient>
        <radialGradient id={`${id}dot`}>
          <stop offset="0" stopColor="#ff2a1f" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ff2a1f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow y={41} rx={20} />
      <Legs xs={[8.5, 11.5, 14.5]} y={33} len={7.5} />
      <Pcb id={id} x={3.5} y={20} w={20} h={13} light="#3f3f46" dark="#141417" edge="#000" />
      <Strip x={6.9} y={29.4} w={9.2} />
      {/* the brass laser head lying on the board, its focus thread at the front */}
      <rect x="6" y="19.6" width="15" height="7.6" rx="1" fill={`url(#${id}br)`} />
      <rect x="20" y="19" width="4.4" height="8.8" rx="0.8" fill={`url(#${id}br)`} />
      <path d="M20.9 19v8.8M21.8 19v8.8M22.7 19v8.8M23.6 19v8.8" stroke="#6b4a14" strokeWidth="0.35" opacity="0.7" />
      <rect x="7" y="20.6" width="12.6" height="1.1" rx="0.55" fill="#fff" opacity="0.6" />
      <ellipse cx="24.4" cy="23.4" rx="0.9" ry="3" fill="#2a0b0e" />
      <circle cx="24.5" cy="23.4" r="0.95" fill="#ff3b30" />
      {/* the paper target on its wooden foot, turned a little toward you */}
      <path d="M37.6 34.6h8l-.6 2.6h-6.8z" fill="#8f5f33" />
      <rect x="37.6" y="33.4" width="8" height="1.6" rx="0.4" fill="#c08a52" />
      <path d="M38.8 12.2 45.2 13.8v19.8l-6.4.4z" fill={`url(#${id}card)`} stroke="#cfc6b3" strokeWidth="0.3" />
      <ellipse cx="42" cy="23.4" rx="2.5" ry="5.4" fill="none" stroke="#9ca3af" strokeWidth="0.4" />
      <ellipse cx="42" cy="23.4" rx="1.75" ry="3.8" fill="#1f2937" />
      <ellipse cx="42" cy="23.4" rx="1" ry="2.2" fill="none" stroke="#f8fafc" strokeWidth="0.3" />
      <ellipse cx="42" cy="23.4" rx="0.55" ry="1.1" fill="#dc2626" />
      {/* the thin red beam and the bright dot it makes */}
      <path d="M25.3 23.4H41.6" stroke="#ff2a1f" strokeWidth="2.2" opacity="0.2" strokeLinecap="round" />
      <path d="M25.3 23.4H41.6" stroke="#ff3b30" strokeWidth="0.75" strokeLinecap="round" />
      <path d="M25.3 23.4H41.6" stroke="#ffd9d4" strokeWidth="0.25" strokeLinecap="round" />
      <circle cx="42" cy="23.4" r="4.2" fill={`url(#${id}dot)`} />
      <circle cx="42" cy="23.4" r="1.2" fill="#ffd9d4" />
    </>
  )
}

function IrLed({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f8f9ff" />
          <stop offset="0.45" stopColor="#c7cdf8" />
          <stop offset="1" stopColor="#7c86e0" />
        </linearGradient>
        <radialGradient id={`${id}g`}>
          <stop offset="0" stopColor="#c084fc" stopOpacity="0.6" />
          <stop offset="0.6" stopColor="#d7b8ff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#d7b8ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow y={44} rx={10} />
      {/* what a phone camera sees: a soft violet glow */}
      <circle cx="21" cy="17" r="13.5" fill={`url(#${id}g)`} />
      <path d="M18 30v14M24 30v10" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 28.4a1.4 1.4 0 0 1 1.4-1.4H29v4H13.4a1.4 1.4 0 0 1-1.4-1.4z" fill="#a5b0f0" />
      <path d="M14 28V16.5a7 7 0 0 1 14 0V28z" fill={`url(#${id}l)`} />
      {/* through the clear lens: the cup holding the chip, the thin post and the wire between */}
      <path d="M15.6 28v-4.2h4l1.4 1.4V28z" fill="#71717a" opacity="0.6" />
      <rect x="23.4" y="22.6" width="1.6" height="5.4" fill="#71717a" opacity="0.6" />
      <path d="M17.8 23.2c1.4-2.6 4.6-2.8 6.4-.6" fill="none" stroke="#52525b" strokeWidth="0.35" opacity="0.7" />
      <circle cx="17.8" cy="23.4" r="2.2" fill="#c084fc" opacity="0.55" />
      <rect x="17" y="22.6" width="1.6" height="1.2" fill="#2c2a35" />
      <rect x="16.3" y="13" width="2.2" height="11" rx="1.1" fill="#fff" opacity="0.7" />
      {/* light you can't see */}
      <g fill="none" stroke="#9333ea" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="1.6 1.5">
        <path d="M33.5 10.5a9 9 0 0 1 0 11" />
        <path d="M37.5 7a14 14 0 0 1 0 18" opacity="0.6" />
      </g>
    </>
  )
}

function Solenoid({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="0.5" stopColor="#c4c4cc" />
          <stop offset="1" stopColor="#71717a" />
        </linearGradient>
        <linearGradient id={`${id}k`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a1a1aa" />
          <stop offset="1" stopColor="#52525b" />
        </linearGradient>
        <linearGradient id={`${id}y`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.45" stopColor="#e6b422" />
          <stop offset="1" stopColor="#a16207" />
        </linearGradient>
      </defs>
      <Shadow y={40} rx={19} />
      {/* its two wires */}
      <path d="M7.5 28.4C4.2 28.4 3 31.5 3.6 36" fill="none" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7.5 30.6C5.6 30.8 5.3 33.5 6 37" fill="none" stroke="#18181b" strokeWidth="1.2" strokeLinecap="round" />
      {/* the steel frame seen from its open side, the coil sitting inside it */}
      <rect x="7" y="13.5" width="23" height="23" rx="0.8" fill={`url(#${id}k)`} />
      <rect x="9.6" y="16" width="17.8" height="18" fill="#27272a" />
      <rect x="10.4" y="16.2" width="1.4" height="17.6" fill="#18181b" />
      <rect x="25.2" y="16.2" width="1.4" height="17.6" fill="#18181b" />
      <rect x="11.8" y="17.4" width="13.4" height="15.2" fill={`url(#${id}y)`} />
      <path d="M11.8 21.5h13.4" stroke="#a16207" strokeWidth="0.4" opacity="0.6" />
      <rect x="11.8" y="17.4" width="0.9" height="15.2" fill="#c2410c" opacity="0.8" />
      <rect x="24.3" y="17.4" width="0.9" height="15.2" fill="#c2410c" opacity="0.8" />
      <rect x="12.8" y="18.2" width="11.4" height="1.4" rx="0.7" fill="#fff" opacity="0.5" />
      <rect x="14.6" y="24.2" width="7.8" height="4.4" rx="0.3" fill="#f8fafc" />
      <path d="M15.6 25.6h5.2M15.6 27.2h3.4" stroke="#52525b" strokeWidth="0.5" strokeLinecap="round" />
      {/* the frame's bars in front */}
      <rect x="7" y="13.5" width="23" height="2.6" rx="0.6" fill={`url(#${id}s)`} />
      <rect x="7" y="33.9" width="23" height="2.6" rx="0.6" fill={`url(#${id}s)`} />
      <rect x="7" y="13.5" width="2.6" height="23" rx="0.6" fill={`url(#${id}s)`} />
      <rect x="27.4" y="13.5" width="2.6" height="23" rx="0.6" fill={`url(#${id}s)`} />
      <circle cx="12.5" cy="35.2" r="0.6" fill="#3f3f46" />
      <circle cx="24.5" cy="35.2" r="0.6" fill="#3f3f46" />
      {/* the rod pushed out, its spring and the round cap on the end */}
      <rect x="29" y="22.6" width="11" height="4.2" rx="0.6" fill={`url(#${id}s)`} />
      <g fill="none" strokeLinecap="round">
        {[31.2, 33, 34.8, 36.6, 38.4].map((x) => (
          <path key={x} d={`M${x} 29.2 ${x + 1.4} 20.2`} stroke="#52525b" strokeWidth="1.1" />
        ))}
        {[31.2, 33, 34.8, 36.6, 38.4].map((x) => (
          <path key={x} d={`M${x} 29.2 ${x + 1.4} 20.2`} stroke="#e4e4e7" strokeWidth="0.5" />
        ))}
      </g>
      <rect x="40" y="20.4" width="3.2" height="8.6" rx="1.2" fill={`url(#${id}s)`} />
      <rect x="40.5" y="21" width="0.8" height="7.4" rx="0.4" fill="#fff" opacity="0.6" />
    </>
  )
}

function Pump({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="0.45" stopColor="#27272a" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bae6fd" />
          <stop offset="0.5" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
      </defs>
      <Shadow y={40} rx={19} />
      {/* its wires */}
      <path d="M6.5 29C3.6 29 2.8 32 3.2 36.5" fill="none" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6.5 31.4C5 31.6 4.7 34 5.4 37.5" fill="none" stroke="#18181b" strokeWidth="1.2" strokeLinecap="round" />
      {/* the clear tube full of water, from the spout up and over */}
      <path d="M31.5 19C31.5 10 41.5 8 41.5 17.5V20" fill="none" stroke="#cbd5e1" strokeWidth="3.6" strokeLinecap="round" opacity="0.55" />
      <path d="M31.5 19C31.5 10 41.5 8 41.5 17.5V20" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M30.4 17C31 11.5 35 9.6 37.8 10.2" fill="none" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.8" />
      {/* the motor end and the pump head with its spout */}
      <rect x="6" y="24" width="24" height="13" rx="3" fill={`url(#${id}b)`} />
      <path d="M9.4 25v11M11 25v11M12.6 25v11" stroke="#000" strokeWidth="0.5" opacity="0.5" />
      <rect x="8" y="25" width="20" height="1" rx="0.5" fill="#fff" opacity="0.25" />
      <rect x="29.6" y="18" width="3.8" height="6" fill={`url(#${id}b)`} />
      <rect x="29.2" y="17.2" width="4.6" height="1.4" rx="0.5" fill="#3f3f46" />
      <rect x="27" y="22.5" width="10" height="16" rx="2.4" fill={`url(#${id}b)`} />
      <rect x="28.2" y="23.3" width="7.6" height="0.9" rx="0.45" fill="#fff" opacity="0.3" />
      {[30, 32, 34].map((x) => (
        <rect key={x} x={x - 0.4} y="31" width="0.8" height="5" rx="0.4" fill="#000" />
      ))}
      {/* a drop falling from the tube */}
      <path d="M41.5 23.4c1.8 2.6 2.6 3.9 2.6 5a2.6 2.6 0 0 1-5.2 0c0-1.1.8-2.4 2.6-5z" fill={`url(#${id}d)`} />
      <ellipse cx="40.6" cy="28.2" rx="0.6" ry="0.9" fill="#fff" opacity="0.8" />
    </>
  )
}

function Bell({ id }: ArtProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}g`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.35" stopColor="#e8c46a" />
          <stop offset="0.8" stopColor="#b8902f" />
          <stop offset="1" stopColor="#7a5a1c" />
        </radialGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#c47c45" />
          <stop offset="0.5" stopColor="#8f5130" />
          <stop offset="1" stopColor="#6b3a20" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="0.5" stopColor="#c42a2f" />
          <stop offset="1" stopColor="#7f1d1d" />
        </linearGradient>
        <radialGradient id={`${id}h`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#e4e4e7" />
          <stop offset="1" stopColor="#52525b" />
        </radialGradient>
      </defs>
      <Shadow y={43} rx={16} />
      {/* the varnished wooden board */}
      <rect x="9.5" y="27" width="29" height="14" rx="1.6" fill="#5a2f18" transform="translate(0 1.2)" />
      <rect x="9.5" y="27" width="29" height="14" rx="1.6" fill={`url(#${id}w)`} />
      <path d="M11 33.5c5-1.2 9 .8 14-.4s8-.6 12 .2M11 37.4c6-1 10 .6 15-.2s7-.4 11 .4" fill="none" stroke="#5a2f18" strokeWidth="0.4" opacity="0.5" />
      <rect x="11.5" y="27.5" width="25" height="0.8" rx="0.4" fill="#fff" opacity="0.25" />
      {/* brass terminals with their knurled nuts */}
      {[12.8, 35.2].map((x) => (
        <g key={x}>
          <circle cx={x} cy="38.2" r="1.6" fill="#8a6a2a" />
          <circle cx={x} cy="38" r="1.4" fill="#c9a24f" />
          <path d={`M${x - 0.8} 38h1.6`} stroke="#5c4a1e" strokeWidth="0.4" strokeLinecap="round" />
        </g>
      ))}
      {/* the two red coils of the magnet, the iron bar above them and the hammer's arm */}
      {[15, 21.4].map((x) => (
        <g key={x}>
          <rect x={x} y="31" width="5.4" height="7" rx="0.6" fill={`url(#${id}c)`} />
          <path d={`M${x} 33h5.4M${x} 34.8h5.4M${x} 36.6h5.4`} stroke="#7f1d1d" strokeWidth="0.35" opacity="0.6" />
          <rect x={x - 0.3} y="30.2" width="6" height="1.3" rx="0.4" fill="#26211d" />
        </g>
      ))}
      <rect x="14" y="28.4" width="16.4" height="1.6" rx="0.5" fill="#8d939b" />
      <rect x="14.4" y="28.6" width="15.6" height="0.5" rx="0.25" fill="#fff" opacity="0.4" />
      <path d="M29.8 29.2 32.3 25.7" stroke="#8d939b" strokeWidth="1.1" strokeLinecap="round" />
      {/* the dome it rings */}
      <circle cx="24" cy="15" r="11.5" fill={`url(#${id}g)`} />
      <circle cx="24" cy="15" r="11.5" fill="none" stroke="#7a5a1c" strokeWidth="0.5" opacity="0.6" />
      <circle cx="24" cy="15" r="7.6" fill="none" stroke="#9a7426" strokeWidth="0.6" opacity="0.55" />
      <circle cx="24" cy="15" r="2.6" fill="#9a7426" opacity="0.5" />
      <circle cx="24" cy="15" r="1.7" fill={`url(#${id}h)`} />
      <path d="M15.5 10.5a10 10 0 0 1 5.6-5" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <circle cx="32.8" cy="25" r="2.1" fill={`url(#${id}h)`} />
      {/* ring ring */}
      <g fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" opacity="0.8">
        <path d="M8.4 9.5a11 11 0 0 0 0 11" />
        <path d="M39.6 9.5a11 11 0 0 1 0 11" />
        <path d="M5 7a15 15 0 0 0 0 16" opacity="0.5" />
        <path d="M43 7a15 15 0 0 1 0 16" opacity="0.5" />
      </g>
    </>
  )
}

function BarGraph({ id }: ArtProps) {
  const bars = Array.from({ length: 10 }, (_, i) => {
    const [on, off] = i < 6 ? ['#4ade80', '#14532d'] : i < 8 ? ['#facc15', '#713f12'] : ['#f87171', '#7f1d1d']
    return { x: 7 + i * 3.5, on, off, lit: i < 6 }
  })
  return (
    <>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#141417" />
        </linearGradient>
      </defs>
      <Shadow y={41} rx={19} />
      <Legs xs={bars.map((b) => round(b.x + 1.2))} y={31} len={8} />
      <rect x="4.5" y="14" width="39" height="19.6" rx="1.4" fill="#000" />
      <rect x="4.5" y="14" width="39" height="17.4" rx="1.4" fill={`url(#${id}b)`} />
      <rect x="6" y="14.5" width="36" height="0.8" rx="0.4" fill="#fff" opacity="0.2" />
      {bars.map((b) =>
        b.lit ? (
          <g key={b.x}>
            <rect x={b.x - 0.7} y="16.3" width="3.8" height="13" rx="0.8" fill={b.on} opacity="0.3" />
            <rect x={b.x} y="17" width="2.4" height="11.6" rx="0.3" fill={b.on} />
            <rect x={b.x + 0.4} y="17.5" width="0.7" height="10.6" rx="0.35" fill="#fff" opacity="0.55" />
          </g>
        ) : (
          <rect key={b.x} x={b.x} y="17" width="2.4" height="11.6" rx="0.3" fill={b.off} />
        ),
      )}
      <path d="M5.4 31.4h1.6" stroke="#71717a" strokeWidth="0.8" />
    </>
  )
}

function TrafficLight({ id }: ArtProps) {
  const lamps = [
    { y: 9.6, on: '#ef4444', off: '#ef4444', glow: '#fca5a5', lit: true },
    { y: 18.6, on: '#facc15', off: '#a16207', glow: '#fde68a', lit: false },
    { y: 27.6, on: '#22c55e', off: '#15803d', glow: '#86efac', lit: false },
  ]
  return (
    <>
      <defs>
        <radialGradient id={`${id}glow`}>
          <stop offset="0" stopColor="#f87171" stopOpacity="0.75" />
          <stop offset="1" stopColor="#f87171" stopOpacity="0" />
        </radialGradient>
        {lamps.map((l, i) => (
          <radialGradient key={i} id={`${id}l${i}`} cx="0.38" cy="0.32" r="0.75">
            <stop offset="0" stopColor={l.lit ? '#fff' : l.glow} stopOpacity={l.lit ? 1 : 0.7} />
            <stop offset="0.45" stopColor={l.lit ? l.on : l.off} />
            <stop offset="1" stopColor={l.lit ? l.on : l.off} />
          </radialGradient>
        ))}
      </defs>
      <Shadow y={44} rx={12} />
      <Legs xs={[19.5, 22.5, 25.5, 28.5]} y={38} len={6} />
      <Pcb id={id} x={15} y={3.5} w={18} h={35} light="#3f3f46" dark="#18181b" edge="#000" />
      <Strip x={18.5} y={33.6} w={11.4} />
      {lamps.map((l, i) => (
        <g key={l.y}>
          {l.lit && <circle cx="24" cy={l.y} r="7.5" fill={`url(#${id}glow)`} />}
          <circle cx="24" cy={l.y} r="4.4" fill="none" stroke="#e4e4e7" strokeWidth="0.4" opacity="0.6" />
          <circle cx="24" cy={l.y} r="3.7" fill={l.lit ? l.on : l.off} opacity="0.65" />
          <circle cx="24" cy={l.y} r="3.1" fill={`url(#${id}l${i})`} />
          <ellipse cx="22.8" cy={l.y - 1.2} rx="1.1" ry="0.7" fill="#fff" opacity={l.lit ? 0.9 : 0.45} />
        </g>
      ))}
    </>
  )
}

/** The fine ribs moulded into a beacon's lens: closer together toward its edges, as round things look. */
const BEACON_RIBS = Array.from({ length: 11 }, (_, i) => {
  const a = ((i - 5) * 14 * Math.PI) / 180
  const x = 24 + 9.2 * Math.sin(a)
  return { x: round(x), top: round(16 - 5 * Math.cos(a)), bottom: round(29 + 2 * Math.cos(a)) }
})

function Beacon({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fed7aa" />
          <stop offset="0.3" stopColor="#fb923c" />
          <stop offset="0.75" stopColor="#ea580c" />
          <stop offset="1" stopColor="#9a3412" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="0.45" stopColor="#27272a" />
          <stop offset="1" stopColor="#0c0c0e" />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#18181b" />
        </linearGradient>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fffbeb" />
          <stop offset="0.6" stopColor="#e5e7eb" />
          <stop offset="1" stopColor="#9ca3af" />
        </linearGradient>
        <linearGradient id={`${id}ray`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}glow`}>
          <stop offset="0" stopColor="#fb923c" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}lamp`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.45" stopColor="#fef3c7" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow y={42.5} rx={17} />
      {/* its red and black leads, out from under the flange */}
      <path d="M16 36.5C12 37 7.5 37.4 4.5 38.6" fill="none" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M32 36.5C36 37 40.5 37.4 43.5 38.6" fill="none" stroke="#18181b" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4.5 38.6l-1.4.6M43.5 38.6l1.4.6" stroke="#a1a1aa" strokeWidth="0.9" strokeLinecap="round" />
      {/* the flange with its screws, and the base */}
      <ellipse cx="24" cy="38.9" rx="14.6" ry="3.3" fill="#0c0c0e" />
      <ellipse cx="24" cy="38" rx="14.6" ry="3.1" fill={`url(#${id}f)`} />
      {[12.6, 35.4].map((x) => (
        <g key={x}>
          <circle cx={x} cy="38.5" r="0.95" fill="#d4d4d8" />
          <path d={`M${x - 0.6} 38.5h1.2`} stroke="#52525b" strokeWidth="0.35" />
        </g>
      ))}
      <path d="M14.2 30v7a9.8 2.4 0 0 0 19.6 0v-7z" fill={`url(#${id}b)`} />
      <path d="M14.2 34.6a9.8 2.4 0 0 0 19.6 0" fill="none" stroke="#000" strokeWidth="0.4" opacity="0.5" />
      <rect x="15.4" y="30.6" width="1.4" height="6.4" rx="0.7" fill="#fff" opacity="0.18" />
      <ellipse cx="24" cy="29.8" rx="10.2" ry="2.2" fill="#0c0c0e" />
      {/* the beam swinging out to the left, and the glow all round */}
      <circle cx="24" cy="18.5" r="15" fill={`url(#${id}glow)`} />
      <path d="M18 17.2 4.5 12.6v12.8l13.5-4.3z" fill={`url(#${id}ray)`} opacity="0.6" />
      {/* the amber lens */}
      <path d="M14.6 29.4 15.2 16.5C15.2 10.6 19 6.6 24 6.6s8.8 4 8.8 9.9l.6 12.9a9.4 2.1 0 0 1-18.8 0z" fill={`url(#${id}d)`} opacity="0.92" />
      {/* inside: the post, the lamp and the mirror turning round it */}
      <rect x="23.2" y="21" width="1.6" height="7.6" fill="#7c2d12" opacity="0.55" />
      <path d="M25.6 13.6c4.2 1.4 4.2 9.4 0 10.8 1.6-2 1.6-8.8 0-10.8z" fill={`url(#${id}m)`} />
      <path d="M25.6 13.6c4.2 1.4 4.2 9.4 0 10.8" fill="none" stroke="#6b7280" strokeWidth="0.35" />
      <circle cx="23.4" cy="19" r="4.6" fill={`url(#${id}lamp)`} />
      <rect x="22.4" y="16.6" width="2" height="4.8" rx="1" fill="#fff" />
      {/* where the beam leaves the lens */}
      <ellipse cx="16.9" cy="19" rx="2.4" ry="5" fill={`url(#${id}lamp)`} />
      {BEACON_RIBS.map((r) => (
        <path key={r.x} d={`M${r.x} ${r.top}V${r.bottom}`} stroke="#9a3412" strokeWidth="0.45" opacity="0.32" />
      ))}
      <path d="M15.2 16.5C15.2 10.6 19 6.6 24 6.6s8.8 4 8.8 9.9" fill="none" stroke="#fff7ed" strokeWidth="0.5" opacity="0.6" />
      <path d="M17.6 26.5V15.6c0-2.8 1.2-5 3-6.4" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
    </>
  )
}

const FAN_BLADE = 'M5.63 -1.4A5.8 5.8 0 0 1 5.21 2.54Q8.25 6 8.99 11.5A14.6 14.6 0 0 0 14.28 3.04Q10.39 -0.36 5.63 -1.4Z'

function Fan({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="0.5" stopColor="#27272a" />
          <stop offset="1" stopColor="#18181b" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#71717a" />
          <stop offset="1" stopColor="#27272a" />
        </linearGradient>
        <radialGradient id={`${id}h`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#5eead4" />
          <stop offset="1" stopColor="#0f766e" />
        </radialGradient>
      </defs>
      <Shadow y={44} rx={17} />
      {/* its wires out of one corner */}
      <path d="M39.5 38.5c2 1 3.5 2.5 4.5 5" fill="none" stroke="#dc2626" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M38 39.5c1.6 1 2.6 2.4 3.4 4.6" fill="none" stroke="#18181b" strokeWidth="1.1" strokeLinecap="round" />
      <rect x="6" y="5" width="36" height="36" rx="3.2" fill="#09090b" transform="translate(0 1.4)" />
      <rect x="6" y="5" width="36" height="36" rx="3.2" fill={`url(#${id}f)`} />
      <rect x="9" y="5.6" width="30" height="0.8" rx="0.4" fill="#fff" opacity="0.25" />
      {[[9.7, 8.7], [38.3, 8.7], [9.7, 37.3], [38.3, 37.3]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="1.7" fill="#71717a" opacity="0.5" />
          <circle cx={x} cy={y} r="1.4" fill="#0a0a0a" />
        </g>
      ))}
      <circle cx="24" cy="23" r="16" fill="#0a0a0a" />
      <circle cx="24" cy="23" r="16" fill="none" stroke="#71717a" strokeWidth="0.5" opacity="0.5" />
      <g transform="translate(24 23)">
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={FAN_BLADE} fill={`url(#${id}b)`} stroke="#a1a1aa" strokeWidth="0.3" strokeOpacity="0.5" transform={`rotate(${round(i * (360 / 7))})`} />
        ))}
        <circle r="6" fill="#18181b" />
        <circle r="4.6" fill={`url(#${id}h)`} />
        <circle r="1.1" fill="#134e4a" />
        <ellipse cx="-1.6" cy="-1.8" rx="1.4" ry="0.8" fill="#fff" opacity="0.4" />
      </g>
    </>
  )
}

/** DIP pins along the top and bottom edges of a chip seen from above. */
function ChipPins({ x, y, h, n, pitch }: { x: number; y: number; h: number; n: number; pitch: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <rect x={x + i * pitch - 0.55} y={y - 1.4} width="1.1" height="1.8" rx="0.3" fill="#d4d4d8" />
          <rect x={x + i * pitch - 0.55} y={y + h - 0.6} width="1.1" height="1.8" rx="0.3" fill="#d4d4d8" />
        </g>
      ))}
    </>
  )
}

/** A chip module's pins: the power header out of its left edge (+ marked red, − black), outputs out of its right. */
function ModulePins({ left, right }: { left: number[]; right: number[] }) {
  return (
    <>
      {left.map((y) => (
        <rect key={`l${y}`} x="2.2" y={y - 0.55} width="3.4" height="1.1" rx="0.4" fill="#a1a1aa" />
      ))}
      {right.map((y) => (
        <rect key={`r${y}`} x="42.4" y={y - 0.55} width="3.4" height="1.1" rx="0.4" fill="#a1a1aa" />
      ))}
    </>
  )
}

/** The + and − marks beside the top and bottom header pins. */
function PowerMarks({ x, top, bottom }: { x: number; top: number; bottom: number }) {
  return (
    <>
      <rect x={x} y={top - 0.6} width="1.2" height="1.2" rx="0.3" fill="#ef4444" />
      <rect x={x} y={bottom - 0.6} width="1.2" height="1.2" rx="0.3" fill="#0a0a0a" />
    </>
  )
}

function Latch({ id }: ArtProps) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}glow`}>
          <stop offset="0" stopColor="#4ade80" stopOpacity="0.85" />
          <stop offset="1" stopColor="#4ade80" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow y={41} rx={19} />
      <ModulePins left={[15.6, 20.2, 25.8, 30.4]} right={[23]} />
      <Pcb id={id} x={5} y={11} w={38} h={24} light="#db2777" dark="#831843" edge="#500724" holes={[[40.4, 13.6], [40.4, 32.4]]} />
      <PowerMarks x={6.4} top={15.6} bottom={30.4} />
      {/* the latch chip, its symbol printed on top: S and R go in, Q comes out */}
      <ChipPins x={14.8} y={16.4} h={11.2} n={7} pitch={2.4} />
      <Chip x={12.8} y={16.4} w={18.4} h={11.2} />
      <path d="M12.8 20.7a1.3 1.3 0 0 1 0 2.6z" fill="#500724" />
      <g fill="none" stroke="#e4e4e7" strokeWidth="0.45" strokeLinecap="round" opacity="0.85">
        <rect x="19" y="18.6" width="5.6" height="6.4" rx="0.3" />
        <path d="M16.6 20.3H19M16.6 23.3H19M24.6 21.8H27" />
      </g>
      {/* S and R lights are off, yet Q remembers and stays lit */}
      <rect x="8.6" y="19.6" width="2.2" height="1.4" rx="0.3" fill="#bbf7d0" />
      <rect x="8.6" y="25" width="2.2" height="1.4" rx="0.3" fill="#fed7aa" />
      <circle cx="36.4" cy="23" r="6.4" fill={`url(#${id}glow)`} />
      <circle cx="36.4" cy="23" r="2.9" fill="#15803d" />
      <circle cx="36.4" cy="23" r="2.4" fill="#4ade80" />
      <circle cx="35.6" cy="22.2" r="0.8" fill="#fff" opacity="0.9" />
      <Glow cx={36.4} cy={14.4} color="#ef4444" halo="#f87171" />
    </>
  )
}

function Counter({ id }: ArtProps) {
  const ys = [13.8, 18.4, 23, 27.6, 32.2]
  return (
    <>
      <defs>
        <radialGradient id={`${id}glow`}>
          <stop offset="0" stopColor="#f87171" stopOpacity="0.85" />
          <stop offset="1" stopColor="#f87171" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow y={41} rx={19} />
      <ModulePins left={[15.6, 20.2, 25.8, 30.4]} right={ys} />
      <Pcb id={id} x={5} y={11} w={38} h={24} light="#0891b2" dark="#155e75" edge="#083344" />
      <PowerMarks x={6.4} top={15.6} bottom={30.4} />
      {/* the 16-pin counting chip */}
      <ChipPins x={12.6} y={17} h={11.2} n={8} pitch={2.4} />
      <Chip x={10.6} y={17} w={20.2} h={11.2} />
      <path d="M10.6 21.3a1.3 1.3 0 0 1 0 2.6z" fill="#083344" />
      <circle cx="12.7" cy="25.8" r="0.6" fill="#52525b" />
      <rect x="15" y="20.8" width="12" height="1.1" rx="0.55" fill="#d4d4d8" opacity="0.6" />
      <rect x="17" y="23.6" width="8" height="1" rx="0.5" fill="#d4d4d8" opacity="0.4" />
      <rect x="8.6" y="12.8" width="2.2" height="1.4" rx="0.3" fill="#fef08a" />
      {/* five lights, one for each count: the count is on the second */}
      {ys.map((y, i) =>
        i === 1 ? (
          <g key={y}>
            <circle cx="37" cy={y} r="4.8" fill={`url(#${id}glow)`} />
            <circle cx="37" cy={y} r="1.9" fill="#b91c1c" />
            <circle cx="37" cy={y} r="1.5" fill="#ef4444" />
            <circle cx="36.5" cy={y - 0.5} r="0.55" fill="#fff" opacity="0.9" />
          </g>
        ) : (
          <g key={y}>
            <circle cx="37" cy={y} r="1.9" fill="#7f1d1d" />
            <circle cx="37" cy={y} r="1.5" fill="#fca5a5" opacity="0.55" />
            <circle cx="36.5" cy={y - 0.5} r="0.45" fill="#fff" opacity="0.5" />
          </g>
        ),
      )}
    </>
  )
}

function Comparator({ id }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}u`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <radialGradient id={`${id}s`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fef3c7" />
          <stop offset="1" stopColor="#a87b2c" />
        </radialGradient>
        <radialGradient id={`${id}glow`}>
          <stop offset="0" stopColor="#4ade80" stopOpacity="0.85" />
          <stop offset="1" stopColor="#4ade80" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow y={41} rx={19} />
      <ModulePins left={[15.6, 20.2, 25.8, 30.4]} right={[23]} />
      <Pcb id={id} x={5} y={11} w={38} h={24} light="#ca8a04" dark="#713f12" edge="#3f2306" holes={[[40.4, 13.6], [40.4, 32.4]]} />
      <PowerMarks x={6.4} top={15.6} bottom={30.4} />
      {/* the comparator chip, its triangle printed on top */}
      <ChipPins x={12.2} y={18.2} h={10} n={4} pitch={2.6} />
      <Chip x={10.2} y={18.2} w={11.8} h={10} />
      <path d="M10.2 21.9a1.3 1.3 0 0 1 0 2.6z" fill="#3f2306" />
      <g fill="none" stroke="#e4e4e7" strokeWidth="0.45" strokeLinejoin="round" opacity="0.85">
        <path d="M13.8 20.3v6.2l5-3.1z" />
        <path d="M14.5 21.9h1.2M15.1 21.3v1.2M14.5 25h1.2" strokeLinecap="round" />
      </g>
      {/* the blue many-turn trimmer that sets where it flips */}
      <path d="M25 15.2 27 13.2h8.6l-2 2z" fill="#93c5fd" />
      <path d="M33.6 15.2 35.6 13.2v7.4l-2 2z" fill="#1e3a8a" />
      <rect x="25" y="15.2" width="8.6" height="7.4" rx="0.3" fill={`url(#${id}u)`} />
      <rect x="25.6" y="15.7" width="7.4" height="0.6" rx="0.3" fill="#fff" opacity="0.4" />
      <rect x="26" y="20.2" width="3.4" height="0.8" rx="0.3" fill="#bfdbfe" opacity="0.8" />
      <ellipse cx="32.6" cy="14.2" rx="1.5" ry="0.9" fill={`url(#${id}s)`} />
      <path d="M31.7 14.6l1.8-0.8" stroke="#5c4214" strokeWidth="0.4" strokeLinecap="round" />
      {/* two tiny resistors, and the OUT light on */}
      {[26.4, 29.8].map((x) => (
        <g key={x}>
          <rect x={x} y="26.4" width="2.4" height="1.3" rx="0.2" fill="#d4d4d8" />
          <rect x={x + 0.5} y="26.4" width="1.4" height="1.3" fill="#141416" />
        </g>
      ))}
      <circle cx="37.6" cy="23" r="4.6" fill={`url(#${id}glow)`} />
      <rect x="36.4" y="22.2" width="2.4" height="1.6" rx="0.3" fill="#22c55e" />
      <rect x="36.8" y="22.4" width="1" height="0.6" rx="0.2" fill="#fff" opacity="0.8" />
      <Glow cx={37.6} cy={29.6} color="#ef4444" halo="#f87171" />
    </>
  )
}

function HBridge({ id }: ArtProps) {
  const terminal = (x: number, y: number, n: number, vertical: boolean) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={vertical ? 5.6 : n * 4} height={vertical ? n * 4 : 5.6} rx="0.6" fill="#1e3a8a" transform="translate(0 0.9)" />
      <rect x={x} y={y} width={vertical ? 5.6 : n * 4} height={vertical ? n * 4 : 5.6} rx="0.6" fill="#2563eb" />
      {Array.from({ length: n }, (_, i) => {
        const cx = vertical ? x + 2.8 : x + 2 + i * 4
        const cy = vertical ? y + 2 + i * 4 : y + 2.8
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="1.45" fill={`url(#${id}u)`} />
            <path d={`M${cx - 0.9} ${cy + 0.5}l1.8-1`} stroke="#52525b" strokeWidth="0.45" strokeLinecap="round" />
          </g>
        )
      })}
    </g>
  )
  return (
    <>
      <defs>
        <linearGradient id={`${id}u`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="0.6" stopColor="#d4d4d8" />
          <stop offset="1" stopColor="#8b8b94" />
        </linearGradient>
        <linearGradient id={`${id}k`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
      </defs>
      <Shadow y={43} rx={20} />
      <Pcb id={id} x={4} y={13} w={40} h={27} light="#ef4444" dark="#b91c1c" edge="#7f1d1d" holes={[[6.6, 37.4], [41.4, 37.4]]} />
      {/* motor terminals left and right, power along the bottom */}
      {terminal(5, 16, 2, true)}
      {terminal(37.4, 16, 2, true)}
      {terminal(9.6, 32.4, 3, false)}
      <Header x={26} y={34} cols={8} rows={1} pin="#a1a1aa" />
      <rect x="27.2" y="33.5" width="2.4" height="2.4" rx="0.3" fill="#18181b" />
      <rect x="31.8" y="33.5" width="2.4" height="2.4" rx="0.3" fill="#18181b" />
      {/* the big black heatsink standing up, with the driver chip bolted to its front */}
      <rect x="14" y="4" width="20" height="18" rx="0.6" fill="#000" />
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <rect x={14.4 + i * 2.45} y="4" width="1.7" height="17.5" fill={`url(#${id}k)`} />
          <rect x={14.4 + i * 2.45} y="4" width="1.7" height="0.8" fill="#71717a" />
        </g>
      ))}
      <rect x="14" y="18.6" width="20" height="4" fill="#18181b" />
      <rect x="16.6" y="17.2" width="14.8" height="5.4" rx="0.5" fill="#27272a" />
      <rect x="17.2" y="17.7" width="13.6" height="0.6" rx="0.3" fill="#fff" opacity="0.2" />
      <circle cx="24" cy="19.6" r="1.2" fill={`url(#${id}u)`} />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={17.3 + i * 1.8} y="22.6" width="0.7" height="2.6" fill="#d4d4d8" />
      ))}
      {/* the big capacitor and the little regulator */}
      <circle cx="12" cy="27.4" r="2.9" fill="#18181b" />
      <circle cx="12" cy="27.4" r="2.3" fill="#3f3f46" />
      <path d="M10.6 27.4h2.8M12 26v2.8" stroke="#a1a1aa" strokeWidth="0.4" />
      <rect x="33.4" y="26.2" width="4.6" height="4" rx="0.4" fill="#27272a" />
      <rect x="33.8" y="25.4" width="3.8" height="1.4" rx="0.3" fill="#a1a1aa" />
      <Glow cx={38.8} cy={14.8} color="#ef4444" halo="#f87171" />
    </>
  )
}

function Multimeter({ id }: ArtProps) {
  const top = 9.4
  const h = 5.4
  // "12.9" with the ghosts of the unlit bars, like a real LCD
  const digits: [number, string][] = [
    [17.4, 'bc'],
    [21.3, 'abdeg'],
    [26.3, 'abcdfg'],
  ]
  return (
    <>
      <defs>
        <linearGradient id={`${id}y`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="0.5" stopColor="#f2b10a" />
          <stop offset="1" stopColor="#c98a04" />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3f48" />
          <stop offset="1" stopColor="#1d2026" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d3bd" />
          <stop offset="1" stopColor="#a3af96" />
        </linearGradient>
        <radialGradient id={`${id}k`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#71717a" />
          <stop offset="0.6" stopColor="#1f2125" />
          <stop offset="1" stopColor="#09090b" />
        </radialGradient>
      </defs>
      <Shadow y={44.5} rx={17} />
      {/* the yellow rubber boot */}
      <rect x="9" y="3" width="30" height="40" rx="4.6" fill="#a16207" transform="translate(0 1.2)" />
      <rect x="9" y="3" width="30" height="40" rx="4.6" fill={`url(#${id}y)`} />
      <rect x="11.5" y="3.7" width="25" height="1.2" rx="0.6" fill="#fff" opacity="0.55" />
      {/* the dark face */}
      <rect x="12" y="6" width="24" height="34" rx="2.4" fill={`url(#${id}f)`} />
      {/* the screen */}
      <rect x="14" y="8" width="20" height="8.8" rx="1.1" fill={`url(#${id}s)`} stroke="#0a0a0a" strokeWidth="0.6" />
      {digits.map(([x, lit]) => (
        <g key={x}>
          {Object.entries(segmentBars(x, top, 3.5, h, 0.8)).map(([bar, points]) => (
            <polygon key={bar} points={points} fill="#1a201b" opacity={lit.includes(bar) ? 1 : 0.08} />
          ))}
        </g>
      ))}
      <circle cx="25.4" cy={top + h - 0.35} r="0.45" fill="#1a201b" />
      <rect x="14.6" y="8.6" width="18.8" height="1.1" rx="0.55" fill="#fff" opacity="0.4" />
      {/* the big dial and the settings around it */}
      {[-60, -20, 20, 60, 100, 140, 180, 220].map((a) => (
        <rect
          key={a}
          x="23.55"
          y="19.6"
          width="0.9"
          height="1.4"
          rx="0.3"
          fill={a === -60 ? '#fcd34d' : '#eef0f3'}
          opacity={a === -60 ? 1 : 0.6}
          transform={`rotate(${a} 24 27)`}
        />
      ))}
      <circle cx="24" cy="27" r="5.7" fill="#0a0a0a" />
      <circle cx="24" cy="27" r="5.2" fill={`url(#${id}k)`} />
      <rect x="22.6" y="22" width="2.8" height="10" rx="1.4" fill="#2a2d33" transform="rotate(-60 24 27)" />
      <rect x="23.1" y="22.5" width="0.8" height="9" rx="0.4" fill="#fff" opacity="0.2" transform="rotate(-60 24 27)" />
      <circle cx="20.1" cy="24.7" r="0.75" fill="#f8fafc" />
      {/* the leads plugged in: red into V, black into COM, out over the boot's edge */}
      <path d="M18.6 37.6C15 40.6 9 38 5 42.6" fill="none" stroke="#c81e1e" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M29.4 37.6C33 40.6 39 38 43 42.6" fill="none" stroke="#1f2024" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17.6 37.9C14.6 40 9.6 38 6.6 41.2" fill="none" stroke="#fca5a5" strokeWidth="0.4" strokeLinecap="round" opacity="0.6" />
      <path d="M30.4 37.9C33.4 40 38.4 38 41.4 41.2" fill="none" stroke="#a1a1aa" strokeWidth="0.4" strokeLinecap="round" opacity="0.5" />
      {[
        { x: 18.6, plug: '#d32020', ring: '#b91c1c' },
        { x: 29.4, plug: '#2a2b30', ring: '#52525b' },
      ].map(({ x, plug, ring }) => (
        <g key={x}>
          <circle cx={x} cy="35.4" r="2.2" fill={ring} />
          <circle cx={x} cy="35.4" r="1.6" fill={plug} />
          <circle cx={x - 0.5} cy="34.9" r="0.55" fill="#fff" opacity="0.4" />
        </g>
      ))}
    </>
  )
}

function LogicProbe({ id }: ArtProps) {
  // HIGH (lit), LOW and PULSE
  const leds = [
    { x: 20.6, on: '#ef4444', off: '#ef4444', lit: true },
    { x: 24.5, on: '#22c55e', off: '#166534', lit: false },
    { x: 28.4, on: '#f59e0b', off: '#92400e', lit: false },
  ]
  return (
    <>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset="0.45" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#3b0764" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#52525b" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id={`${id}n`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="1" stopColor="#71717a" />
        </linearGradient>
        <radialGradient id={`${id}glow`}>
          <stop offset="0" stopColor="#f87171" stopOpacity="0.85" />
          <stop offset="1" stopColor="#f87171" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow y={42} rx={18} />
      {/* its power leads: red to +, black to − */}
      <path d="M8.6 35.2C6.4 36.8 4.2 36.4 2.8 34.4" fill="none" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9.2 36.2C7.6 38.4 5.2 39.4 2.8 39.2" fill="none" stroke="#27272a" strokeWidth="1.2" strokeLinecap="round" />
      <g transform="rotate(-38 24 24)">
        {/* the needle tip and its cone */}
        <path d="M40 23.6 46 24 40 24.4z" fill={`url(#${id}n)`} />
        <path d="M34.5 20.6 40.4 23.3v1.4L34.5 27.4z" fill={`url(#${id}c)`} />
        {/* the pen body */}
        <rect x="6" y="20" width="29" height="8" rx="3" fill={`url(#${id}b)`} />
        <rect x="8" y="20.8" width="25" height="1.2" rx="0.6" fill="#fff" opacity="0.45" />
        <rect x="4.4" y="21.2" width="3" height="5.6" rx="1" fill={`url(#${id}c)`} />
        <path d="M10 20.2v7.6M11.3 20.2v7.6M12.6 20.2v7.6" stroke="#2e1065" strokeWidth="0.45" opacity="0.5" />
        {leds.map((l) => (
          <g key={l.x}>
            {l.lit && <circle cx={l.x} cy="24" r="3.8" fill={`url(#${id}glow)`} />}
            <circle cx={l.x} cy="24" r="1.6" fill="#1e1b4b" />
            <circle cx={l.x} cy="24" r="1.15" fill={l.lit ? l.on : l.off} />
            <circle cx={l.x - 0.35} cy="23.65" r="0.4" fill="#fff" opacity={l.lit ? 0.9 : 0.45} />
          </g>
        ))}
      </g>
    </>
  )
}

/* ---- radio, network and industrial modules ---- */

/** A text-message module: the SIM card holder, the radio in its silver can and a springy coil antenna. */
function Gsm({ id }: ArtProps) {
  // the coil antenna one turn at a time: the back halves dark, the front halves bright copper
  const turns = Array.from({ length: 9 }, (_, i) => round(5.4 + i * 1.6))
  const front = turns.map((y) => `M10.4 ${y}A2 0.9 0 0 0 14.4 ${round(y + 0.8)}`).join('')
  const back = turns.map((y) => `M14.4 ${round(y + 0.8)}A2 0.9 0 0 0 10.4 ${round(y + 1.6)}`).join('')
  return (
    <>
      <defs>
        <Silver id={id} />
        <linearGradient id={`${id}k`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9a3412" />
          <stop offset="0.35" stopColor="#fdba74" />
          <stop offset="0.7" stopColor="#c2410c" />
          <stop offset="1" stopColor="#7c2d12" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#eab308" />
          <stop offset="1" stopColor="#a16207" />
        </linearGradient>
      </defs>
      <Shadow y={42.5} rx={17} />
      <Legs xs={[12.4, 15.4, 18.4]} y={34} len={8} />
      <Pcb id={id} x={8} y={18} w={32} h={17.6} light="#a3243b" dark="#5c1020" edge="#3a0812" />
      <Strip x={10.9} y={32} w={9} />
      {/* the radio in its silver can */}
      <Box x={16} y={20} w={11} h={10.4} top={`url(#${id}u)`} front="#71717a" />
      <rect x="16.8" y="20.5" width="9.4" height="0.5" rx="0.25" fill="#fff" opacity="0.8" />
      <g fill="#a1a1aa">
        <circle cx="17.6" cy="22.2" r="0.45" />
        <rect x="18.8" y="23.6" width="6" height="0.6" rx="0.3" />
        <rect x="18.8" y="25.2" width="4.4" height="0.6" rx="0.3" />
        <rect x="18.8" y="26.8" width="5.2" height="0.6" rx="0.3" />
      </g>
      {/* the SIM card holder, the card's gold chip showing through */}
      <rect x="28.8" y="19.6" width="9.6" height="12.6" rx="0.8" fill="#71717a" />
      <rect x="28.8" y="19.6" width="9.6" height="11.8" rx="0.8" fill={`url(#${id}u)`} />
      <rect x="30.2" y="21.6" width="6.8" height="5.4" rx="0.9" fill="#3f3f46" />
      <rect x="30.6" y="22" width="6" height="4.6" rx="0.7" fill={`url(#${id}s)`} />
      <path d="M33.6 22v4.6M30.6 23.5h2.2M30.6 25.1h2.2M34.6 23.5h2M34.6 25.1h2" stroke="#a16207" strokeWidth="0.35" />
      <path d="M30.2 28.6h6.8M30.2 29.9h6.8" stroke="#a1a1aa" strokeWidth="0.5" strokeLinecap="round" />
      {/* the network light, blinking as it finds the phone towers */}
      <rect x="21.6" y="32.4" width="2.2" height="1.2" rx="0.2" fill="#d4d4d8" />
      <rect x="22.1" y="32.4" width="1.2" height="1.2" fill="#b08850" />
      <Glow cx={26.8} cy={33.2} color="#ef4444" halo="#f87171" />
      {/* the copper coil antenna standing on its pad */}
      <ellipse cx="12.4" cy="20.6" rx="2.4" ry="1" fill="#eab308" />
      <path d={back} fill="none" stroke="#7c2d12" strokeWidth="0.7" strokeLinecap="round" />
      <path d={front} fill="none" stroke={`url(#${id}k)`} strokeWidth="0.85" strokeLinecap="round" />
      <path d="M10.4 19.8 12.4 20.6" stroke="#c2410c" strokeWidth="0.85" strokeLinecap="round" />
    </>
  )
}

/** A tiny Wi-Fi module: its gold zig-zag antenna sends and catches the radio waves. */
function Wifi({ id }: ArtProps) {
  return (
    <>
      <defs>
        <Silver id={id} />
      </defs>
      <Shadow y={38.5} rx={19} />
      <Pcb id={id} x={5} y={18} w={36} h={15} light="#3f3f46" dark="#141417" edge="#000" />
      {/* the 2 × 4 pin header at one end */}
      <rect x="6.4" y="19.4" width="5.8" height="12.6" rx="0.5" fill="#0a0a0a" />
      <rect x="6.4" y="19.4" width="5.8" height="11.8" rx="0.5" fill="#2a2a2e" />
      {[7.95, 10.65].map((x) =>
        [21.2, 23.9, 26.6, 29.3].map((y) => (
          <g key={`${x}-${y}`}>
            <rect x={x - 0.6} y={y - 0.6} width="1.2" height="1.2" rx="0.15" fill="#eab308" />
            <rect x={x - 0.6} y={y - 0.6} width="1.2" height="0.4" rx="0.15" fill="#fde68a" />
          </g>
        )),
      )}
      {/* the radio chip, its memory chip, the crystal and the blue light */}
      <Chip x={14.6} y={20.6} w={7} h={7} />
      <circle cx="15.6" cy="21.6" r="0.4" fill="#52525b" />
      <rect x="16" y="23.6" width="4.2" height="0.6" rx="0.3" fill="#d4d4d8" opacity="0.4" />
      <g fill="#a1a1aa">
        {[24.3, 25.5, 26.7, 27.9].map((x) => (
          <g key={x}>
            <rect x={x - 0.25} y="21.3" width="0.5" height="1" />
            <rect x={x - 0.25} y="26.3" width="0.5" height="1" />
          </g>
        ))}
      </g>
      <Chip x={23.6} y={22.1} w={5} h={4.4} />
      <rect x="15.2" y="29" width="3.6" height="2.4" rx="0.5" fill="#71717a" />
      <rect x="15.2" y="29" width="3.6" height="1.9" rx="0.5" fill={`url(#${id}u)`} />
      <Glow cx={22.6} cy={30.2} color="#3b82f6" halo="#60a5fa" />
      {/* the zig-zag antenna, and the waves it sends */}
      <path
        d="M31.2 19.8h7.6v2h-7.6v2h7.6v2h-7.6v2h7.6v2h-7.6v2h7.6"
        fill="none"
        stroke="#eab308"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      <g fill="none" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round">
        <path d="M32.88 14.88A3 3 0 0 1 37.12 14.88" opacity="0.95" />
        <path d="M31.18 13.18A5.4 5.4 0 0 1 38.82 13.18" opacity="0.7" />
        <path d="M29.48 11.48A7.8 7.8 0 0 1 40.52 11.48" opacity="0.45" />
      </g>
      <circle cx="35" cy="16.6" r="0.8" fill="#38bdf8" />
    </>
  )
}

/** A Bluetooth module: a little green radio board with its own antenna, riding on a blue carrier. */
function Bluetooth({ id }: ArtProps) {
  const pins = [18, 20.6, 23.2, 25.8, 28.4, 31]
  const pads = Array.from({ length: 9 }, (_, i) => round(15.6 + i * 1.8))
  return (
    <>
      <defs>
        <Silver id={id} />
      </defs>
      <Shadow y={39.5} rx={20} />
      {/* six pins out of the end */}
      {pins.map((y) => (
        <rect key={y} x="1.4" y={y - 0.55} width="5" height="1.1" rx="0.4" fill="#a1a1aa" />
      ))}
      <Pcb id={id} x={5} y={15.8} w={38} h={18} light="#38bdf8" dark="#0284c7" edge="#075985" />
      <rect x="5.4" y="16.6" width="3" height="16.4" rx="0.4" fill="#0a0a0a" />
      <rect x="5.4" y="16.6" width="3" height="15.6" rx="0.4" fill="#2a2a2e" />
      {pins.map((y) => (
        <rect key={y} x="6.3" y={y - 0.6} width="1.2" height="1.2" fill="#71717a" />
      ))}
      {/* the red status light and the tiny button */}
      <Glow cx={11.2} cy={19.8} color="#ef4444" halo="#f87171" />
      <rect x="9.8" y="25" width="2.8" height="3.2" rx="0.4" fill="#71717a" />
      <rect x="9.8" y="25" width="2.8" height="2.7" rx="0.4" fill="#d4d4d8" />
      <circle cx="11.2" cy="26.3" r="0.9" fill="#18181b" />
      {/* the green radio board on top: chip, memory and its own zig-zag antenna */}
      <Pcb id={`${id}m`} x={14} y={17.4} w={27.6} h={12.4} light="#22a04b" dark="#14532d" edge="#052e16" />
      {pads.map((x) => (
        <g key={x}>
          <rect x={x - 0.5} y="17.4" width="1" height="1.4" rx="0.2" fill="#eab308" />
          <rect x={x - 0.5} y="28.4" width="1" height="1.4" rx="0.2" fill="#eab308" />
        </g>
      ))}
      <Chip x={16.4} y={20} w={7} h={7} />
      <circle cx="17.4" cy="21" r="0.4" fill="#52525b" />
      <rect x="17.8" y="23" width="4.2" height="0.6" rx="0.3" fill="#d4d4d8" opacity="0.4" />
      <Chip x={25} y={21.2} w={3.6} h={4.8} />
      <rect x="31.8" y="18.6" width="9" height="9.8" rx="0.4" fill="#4ade80" opacity="0.15" />
      <path d="M33 19.6v8h1.8v-8h1.8v8h1.8v-8h1.8v8" fill="none" stroke="#eab308" strokeWidth="0.7" strokeLinejoin="round" />
    </>
  )
}

/** A LoRa radio that reaches kilometres: a violet board, its radio can and a tall rubber antenna. */
function Lora({ id }: ArtProps) {
  return (
    <>
      <defs>
        <Silver id={id} />
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a16207" />
          <stop offset="0.4" stopColor="#fde68a" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#27272a" />
          <stop offset="0.35" stopColor="#52525b" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
      </defs>
      <Shadow y={43} rx={19} />
      <Legs xs={[10.5, 13.5, 16.5, 19.5, 22.5, 25.5]} y={33} len={8.5} />
      <Pcb id={id} x={5} y={22} w={36} h={13} light="#8b5cf6" dark="#5b21b6" edge="#3b0764" holes={[[7.6, 24.6]]} />
      <Strip x={9} y={31.4} w={18} />
      {/* the radio in its silver can */}
      <Box x={10.4} y={23.2} w={15.4} h={7.2} top={`url(#${id}u)`} front="#71717a" />
      <rect x="11.2" y="23.7" width="13.8" height="0.5" rx="0.25" fill="#fff" opacity="0.8" />
      <g fill="#a1a1aa">
        <circle cx="11.8" cy="25.4" r="0.4" />
        <rect x="13.4" y="25.6" width="7" height="0.6" rx="0.3" />
        <rect x="13.4" y="27.2" width="5" height="0.6" rx="0.3" />
      </g>
      <Glow cx={28.4} cy={25.4} color="#ef4444" halo="#f87171" />
      <rect x="27.2" y="28.4" width="2.4" height="1.3" rx="0.2" fill="#d4d4d8" />
      <rect x="27.7" y="28.4" width="1.4" height="1.3" fill="#b08850" />
      {/* the gold connector, and the tall rubber antenna screwed onto it */}
      <rect x="31" y="25.6" width="5.6" height="5" rx="0.5" fill="#92400e" />
      <rect x="31" y="25.6" width="5.6" height="4.2" rx="0.5" fill={`url(#${id}g)`} />
      <rect x="32.2" y="21.2" width="3.2" height="5.2" rx="0.3" fill={`url(#${id}g)`} />
      <path d="M32.2 23h3.2M32.2 24.6h3.2" stroke="#92400e" strokeWidth="0.35" opacity="0.7" />
      <path d="M32.2 17 32.8 3.4a1 1 0 0 1 2 0L35.4 17z" fill={`url(#${id}a)`} />
      <rect x="33.3" y="4.2" width="0.5" height="11.6" rx="0.25" fill="#fff" opacity="0.25" />
      <rect x="31.8" y="16.2" width="4" height="5.6" rx="1.2" fill="#18181b" />
      <rect x="32.4" y="16.6" width="2.8" height="0.5" rx="0.25" fill="#fff" opacity="0.2" />
      <circle cx="33.8" cy="19" r="1" fill="#3f3f46" />
    </>
  )
}

/** A GPS module: the square ceramic antenna listens for satellites; a coin cell keeps its clock running. */
function Gps({ id }: ArtProps) {
  return (
    <>
      <defs>
        <Silver id={id} />
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7eedc" />
          <stop offset="0.55" stopColor="#e6d3ab" />
          <stop offset="1" stopColor="#c9ac7a" />
        </linearGradient>
        <radialGradient id={`${id}d`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#8b8b94" />
        </radialGradient>
      </defs>
      <Shadow y={42} rx={20} />
      <Legs xs={[27.5, 30.5, 33.5, 36.5]} y={35} len={6} />
      <Pcb id={id} x={4} y={13} w={40} h={24} light="#3b82f6" dark="#1e40af" edge="#172554" holes={[[41.4, 15.6], [41.4, 34.4]]} />
      <Strip x={26} y={33.4} w={12} />
      {/* the ceramic patch antenna, its feed pin a shiny dot */}
      <rect x="7.6" y="17.6" width="16.4" height="16.4" rx="1" fill="#0b1d4a" opacity="0.4" />
      <rect x="6.4" y="15" width="16" height="18.2" rx="1" fill="#a3875a" />
      <rect x="6.4" y="15" width="16" height="16" rx="1" fill={`url(#${id}c)`} />
      <rect x="7.2" y="15.5" width="14.4" height="0.6" rx="0.3" fill="#fff" opacity="0.7" />
      <rect x="8.8" y="17.4" width="11.2" height="11.2" rx="0.4" fill="#ded0b4" stroke="#c9ac7a" strokeWidth="0.4" />
      <circle cx="16.4" cy="21.6" r="1.5" fill="#71717a" />
      <circle cx="16.4" cy="21.4" r="1.3" fill={`url(#${id}d)`} />
      {/* the receiver in its silver can, the backup coin cell and the green time-pulse light */}
      <Box x={26} y={15.6} w={12.6} h={10.4} top={`url(#${id}u)`} front="#71717a" />
      <rect x="26.8" y="16.1" width="11" height="0.5" rx="0.25" fill="#fff" opacity="0.8" />
      <g fill="#a1a1aa">
        <circle cx="27.6" cy="17.8" r="0.45" />
        <rect x="28.8" y="19.4" width="7.4" height="0.6" rx="0.3" />
        <rect x="28.8" y="21" width="5.2" height="0.6" rx="0.3" />
        <rect x="28.8" y="22.6" width="6.2" height="0.6" rx="0.3" />
      </g>
      <Glow cx={28.6} cy={29.4} color="#22c55e" halo="#4ade80" />
      <Chip x={31.6} y={28.2} w={3.2} h={2.6} />
      <circle cx="40.4" cy="29.4" r="2.7" fill="#71717a" />
      <circle cx="40.4" cy="29" r="2.6" fill={`url(#${id}d)`} />
      <path d="M39 28.6h1.4M39.7 27.9v1.4" stroke="#52525b" strokeWidth="0.4" strokeLinecap="round" />
    </>
  )
}

/** A CAN-bus module, the network inside cars: the controller chip, its crystal and a terminal for CAN-H and CAN-L. */
function CanBus({ id }: ArtProps) {
  const pins = Array.from({ length: 7 }, (_, i) => round(17.6 + i * 2.3))
  const legs = Array.from({ length: 9 }, (_, i) => round(11.8 + i * 1.25))
  return (
    <>
      <defs>
        <Silver id={id} />
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4ade80" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <Shadow y={40.5} rx={20} />
      {pins.map((y) => (
        <rect key={y} x="1.6" y={y - 0.55} width="4.6" height="1.1" rx="0.4" fill="#a1a1aa" />
      ))}
      <Pcb id={id} x={4} y={14} w={40} h={22} light="#3b82f6" dark="#1d4ed8" edge="#1e3a8a" holes={[[41.4, 33.4]]} />
      <rect x="4.6" y="15.8" width="3" height="17.2" rx="0.4" fill="#0a0a0a" />
      <rect x="4.6" y="15.8" width="3" height="16.4" rx="0.4" fill="#2a2a2e" />
      {pins.map((y) => (
        <rect key={y} x="5.5" y={y - 0.6} width="1.2" height="1.2" fill="#71717a" />
      ))}
      {/* the CAN controller chip and its crystal */}
      <g fill="#a1a1aa">
        {legs.map((x) => (
          <g key={x}>
            <rect x={x - 0.3} y="17.3" width="0.6" height="1.2" />
            <rect x={x - 0.3} y="22.9" width="0.6" height="1.2" />
          </g>
        ))}
      </g>
      <Chip x={11} y={18.4} w={11.6} h={4.6} />
      <circle cx="12" cy="19.6" r="0.4" fill="#52525b" />
      <rect x="13.4" y="20.2" width="6.4" height="0.6" rx="0.3" fill="#d4d4d8" opacity="0.4" />
      <rect x="11.6" y="27" width="8.8" height="4.4" rx="2.2" fill="#71717a" />
      <rect x="11.6" y="27" width="8.8" height="3.8" rx="1.9" fill={`url(#${id}u)`} />
      <rect x="13" y="27.5" width="6" height="0.6" rx="0.3" fill="#fff" opacity="0.9" />
      {[27.3, 29.5].map((y) => (
        <g key={y}>
          <rect x="21.6" y={y} width="2.2" height="1.2" rx="0.2" fill="#d4d4d8" />
          <rect x="22.1" y={y} width="1.2" height="1.2" fill="#b08850" />
        </g>
      ))}
      {/* an amber tantalum capacitor and the transceiver that drives the two bus wires */}
      <rect x="25.2" y="19.4" width="4.2" height="1.8" rx="0.2" fill="#a1a1aa" />
      <rect x="25.6" y="19" width="3.4" height="2.4" rx="0.3" fill="#ca8a04" />
      <rect x="25.6" y="19" width="0.8" height="2.4" fill="#713f12" />
      <rect x="26.6" y="19.3" width="2.2" height="0.5" rx="0.25" fill="#fde68a" opacity="0.7" />
      <g fill="#a1a1aa">
        {[26.1, 27.4, 28.6, 29.9].map((x) => (
          <g key={x}>
            <rect x={x - 0.3} y="25.2" width="0.6" height="1.2" />
            <rect x={x - 0.3} y="30.1" width="0.6" height="1.2" />
          </g>
        ))}
      </g>
      <Chip x={25.4} y={26.2} w={5.2} h={4} />
      {[21.4, 23.8].map((y) => (
        <g key={y}>
          <rect x="31.6" y={y} width="2.4" height="1.3" rx="0.2" fill="#d4d4d8" />
          <rect x="32.1" y={y} width="1.4" height="1.3" fill="#141416" />
        </g>
      ))}
      <Glow cx={32.8} cy={18.4} color="#ef4444" halo="#f87171" />
      {/* the green terminal for the CAN-H and CAN-L wires, and the jumper that ends the bus */}
      <rect x="36.8" y="16.4" width="5.8" height="9" rx="0.6" fill="#14532d" />
      <rect x="36.8" y="16.4" width="5.8" height="8.2" rx="0.6" fill={`url(#${id}t)`} />
      {[18.5, 22.5].map((y) => (
        <g key={y}>
          <circle cx="39.2" cy={y} r="1.4" fill={`url(#${id}u)`} />
          <path d={`M38.3 ${y + 0.5}l1.8-1`} stroke="#52525b" strokeWidth="0.45" strokeLinecap="round" />
          <rect x="41.4" y={y - 1} width="0.9" height="2" rx="0.3" fill="#052e16" />
        </g>
      ))}
      <rect x="36.6" y="27.4" width="4.6" height="3.4" rx="0.4" fill="#000" />
      <rect x="36.6" y="27.4" width="4.6" height="2.8" rx="0.4" fill="#27272a" />
      <rect x="37" y="27.7" width="3.8" height="0.5" rx="0.25" fill="#fff" opacity="0.2" />
    </>
  )
}

/** An RS-485 module: one little chip turns signals into the A and B wires that factory machines talk over. */
function Rs485({ id }: ArtProps) {
  return (
    <>
      <defs>
        <Silver id={id} />
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <Shadow y={42} rx={19} />
      <Legs xs={[10.5, 13.5, 16.5, 19.5]} y={31} len={9} />
      <Pcb id={id} x={5} y={19} w={38} h={14} light="#6366f1" dark="#3730a3" edge="#1e1b4b" holes={[[7.6, 21.6]]} />
      <Strip x={9} y={29.4} w={12} />
      {/* two tiny resistors and the one chip */}
      {[21.2, 23.8].map((y) => (
        <g key={y}>
          <rect x="11" y={y} width="2.6" height="1.3" rx="0.2" fill="#d4d4d8" />
          <rect x="11.6" y={y} width="1.4" height="1.3" fill="#141416" />
        </g>
      ))}
      <g fill="#a1a1aa">
        {[18.6, 19.87, 21.13, 22.4].map((x) => (
          <g key={x}>
            <rect x={x - 0.3} y="20.6" width="0.6" height="1.2" />
            <rect x={x - 0.3} y="25.8" width="0.6" height="1.2" />
          </g>
        ))}
      </g>
      <Chip x={17.4} y={21.6} w={6.2} h={4.4} />
      <circle cx="18.4" cy="22.7" r="0.4" fill="#52525b" />
      <rect x="25.6" y="21.4" width="2.2" height="1.2" rx="0.2" fill="#d4d4d8" />
      <rect x="26.1" y="21.4" width="1.2" height="1.2" fill="#b08850" />
      <Glow cx={28.4} cy={29.4} color="#ef4444" halo="#f87171" />
      {/* the blue terminal for the A and B wires */}
      <g fill="none" stroke="#e0e7ff" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M33 23.6l1-2.6 1 2.6M33.4 22.8h1.2" />
        <path d="M33.2 27.6v-2.6h1a.65.65 0 0 1 0 1.3h-1 1.1a.65.65 0 0 1 0 1.3z" />
      </g>
      <rect x="36.4" y="20.2" width="5.8" height="9" rx="0.6" fill="#1e3a8a" />
      <rect x="36.4" y="20.2" width="5.8" height="8.2" rx="0.6" fill={`url(#${id}t)`} />
      {[22.3, 26.3].map((y) => (
        <g key={y}>
          <circle cx="38.8" cy={y} r="1.4" fill={`url(#${id}u)`} />
          <path d={`M37.9 ${y + 0.5}l1.8-1`} stroke="#52525b" strokeWidth="0.45" strokeLinecap="round" />
          <rect x="41" y={y - 1} width="0.9" height="2" rx="0.3" fill="#172554" />
        </g>
      ))}
    </>
  )
}

/** A pressure gauge for pipes: the needle shows how hard the oil or water pushes, and the board reads it. */
function PressureSensor({ id }: ArtProps) {
  const ticks = Array.from({ length: 21 }, (_, i) => round(-135 + i * 13.5))
  return (
    <>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fafafa" />
          <stop offset="0.45" stopColor="#c4c4cc" />
          <stop offset="1" stopColor="#6b6b74" />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#71717a" />
          <stop offset="1" stopColor="#e4e4e7" />
        </linearGradient>
        <radialGradient id={`${id}d`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e4e4e7" />
        </radialGradient>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a16207" />
          <stop offset="0.3" stopColor="#fde68a" />
          <stop offset="0.65" stopColor="#ca8a04" />
          <stop offset="1" stopColor="#713f12" />
        </linearGradient>
        <linearGradient id={`${id}n`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#71717a" />
          <stop offset="0.4" stopColor="#f4f4f5" />
          <stop offset="1" stopColor="#52525b" />
        </linearGradient>
      </defs>
      <Shadow y={43.5} rx={15} />
      <Legs xs={[21, 24, 27]} y={37} len={5.5} />
      <Pcb id={id} x={10} y={31} w={28} h={7.4} light="#60a5fa" dark="#1d4ed8" edge="#1e3a8a" holes={[[12.6, 33.6]]} />
      <Strip x={19.5} y={34.8} w={9} />
      <Glow cx={15.6} cy={35.4} color="#ef4444" halo="#f87171" />
      <Chip x={30.4} y={32.6} w={4.6} h={3} />
      {/* the brass fitting that screws into the pipe */}
      <ellipse cx="24" cy="33.6" rx="3" ry="0.9" fill="#172554" />
      <rect x="21.6" y="30.6" width="4.8" height="3" fill={`url(#${id}h)`} />
      <path d="M21.6 31.4h4.8M21.6 32.4h4.8M21.6 33.3h4.8" stroke="#713f12" strokeWidth="0.35" opacity="0.6" />
      <rect x="22.2" y="24.6" width="3.6" height="3" fill={`url(#${id}n)`} />
      <path d="M19.6 27.2h8.8l0.8 1.8-0.8 1.8h-8.8l-0.8-1.8z" fill={`url(#${id}h)`} />
      <path d="M21.8 27.2v3.6M26.2 27.2v3.6" stroke="#713f12" strokeWidth="0.4" opacity="0.6" />
      {/* the round steel case and its white dial */}
      <circle cx="24" cy="13.8" r="11.2" fill="#52525b" transform="translate(0 1)" />
      <circle cx="24" cy="13.8" r="11.2" fill={`url(#${id}s)`} />
      <path d="M16.03 7.11A10.4 10.4 0 0 1 21.84 3.63" fill="none" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
      <circle cx="24" cy="13.8" r="9.6" fill={`url(#${id}r)`} />
      <circle cx="24" cy="13.8" r="9" fill={`url(#${id}d)`} />
      {ticks.map((a, i) => (
        <rect
          key={a}
          x={i % 2 ? 23.8 : 23.7}
          y="5.3"
          width={i % 2 ? 0.4 : 0.6}
          height={i % 2 ? 1 : 1.7}
          fill="#18181b"
          transform={`rotate(${a} 24 13.8)`}
        />
      ))}
      <path d="M29.9 15.72A6.2 6.2 0 0 1 28.38 18.18" fill="none" stroke="#dc2626" strokeWidth="1.1" />
      <rect x="22" y="18.6" width="4" height="0.7" rx="0.35" fill="#71717a" opacity="0.6" />
      {/* the red needle, a third of the way round */}
      <path d="M24 6 24.6 13.8 24 16.4 23.4 13.8z" fill="#dc2626" transform="rotate(-45 24 13.8)" />
      <circle cx="24" cy="13.8" r="1.4" fill="#27272a" />
      <circle cx="23.6" cy="13.4" r="0.45" fill="#fff" opacity="0.5" />
    </>
  )
}

const ART: Record<PartType, (p: ArtProps) => ReactNode> = {
  battery: Battery,
  switch: Switch,
  button: Button,
  dimmer: Dimmer,
  resistor: Resistor,
  lamp: Lamp,
  led: Led,
  motor: Motor,
  buzzer: Buzzer,
  solar: Solar,
  arduino: Arduino,
  capacitor: Capacitor,
  diode: Diode,
  transistor: Transistor,
  fuse: Fuse,
  ldr: Ldr,
  voltmeter: Voltmeter,
  ammeter: Ammeter,
  servo: Servo,
  thermistor: Thermistor,
  tilt: Tilt,
  reed: Reed,
  tempSensor: TempSensor,
  ultrasonic: Ultrasonic,
  pir: Pir,
  soundSensor: SoundSensor,
  gasSensor: GasSensor,
  soilSensor: SoilSensor,
  touchSensor: TouchSensor,
  flameSensor: FlameSensor,
  rainSensor: RainSensor,
  waterSensor: WaterSensor,
  humiditySensor: HumiditySensor,
  hallSensor: HallSensor,
  irSensor: IrSensor,
  lineSensor: LineSensor,
  forceSensor: ForceSensor,
  pulseSensor: PulseSensor,
  knockSensor: KnockSensor,
  slideSwitch: SlideSwitch,
  microSwitch: MicroSwitch,
  joystick: Joystick,
  lemon: Lemon,
  coinCell: CoinCell,
  dynamo: Dynamo,
  powerBank: PowerBank,
  nano: Nano,
  mega: Mega,
  esp32: Esp32,
  esp8266: Esp8266,
  pico: Pico,
  microbit: Microbit,
  raspberrypi: RaspberryPi,
  aiBoard: AiBoard,
  segment: SegmentDisplay,
  lcd: LcdDisplay,
  oled: OledDisplay,
  tft: TftDisplay,
  matrix: MatrixSign,
  ledwall: LedWall,
  powerSupply: PowerSupply,
  potentiometer: Potentiometer,
  relay: Relay,
  rgbLed: RgbLed,
  speaker: Speaker,
  vibration: Vibration,
  electromagnet: Electromagnet,
  regulator: Regulator,
  notGate: NotGate,
  andGate: AndGate,
  orGate: OrGate,
  xorGate: XorGate,
  timer555: Timer555,
  oscilloscope: Oscilloscope,
  zener: Zener,
  pnp: Pnp,
  mosfet: Mosfet,
  optocoupler: Optocoupler,
  laser: Laser,
  irLed: IrLed,
  solenoid: Solenoid,
  pump: Pump,
  bell: Bell,
  barGraph: BarGraph,
  trafficLight: TrafficLight,
  beacon: Beacon,
  fan: Fan,
  nandGate: NandGate,
  norGate: NorGate,
  latch: Latch,
  counter: Counter,
  comparator: Comparator,
  hBridge: HBridge,
  multimeter: Multimeter,
  logicProbe: LogicProbe,
  ecu: Ecu,
  plc: Plc,
  rtu: Rtu,
  gsm: Gsm,
  wifi: Wifi,
  bluetooth: Bluetooth,
  lora: Lora,
  gps: Gps,
  canBus: CanBus,
  rs485: Rs485,
  pressureSensor: PressureSensor,
}

/** A drawing of a part. `size` is the width and height in pixels. */
export function PartArt({
  partType,
  size = 40,
  className,
  style,
}: {
  partType: PartType
  size?: number
  className?: string
  style?: CSSProperties
}) {
  const id = useId().replace(/:/g, '')
  const Art = ART[partType]
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={cn('shrink-0 text-foreground', className)} style={style}>
      <Art id={id} />
    </svg>
  )
}
