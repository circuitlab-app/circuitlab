import type { LucideIcon } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { R, Shadow, V } from './art/kit'
import { url } from './art/palette'
import type { ToolId } from './catalog'
import { ToolArt } from './ToolArt'

/*
 * The signs of a real workshop wall: the blue "you must" disc and the yellow
 * warning triangle, drawn the way the stickers look, plus the little scenes
 * on the quiz and starter-kit cards.
 */

/** A blue "you must" sign (like ISO 7010 M-signs): a white symbol on a blue disc with a sticker edge. */
export function MustSign({ icon: Icon, size = 28, className }: { icon: LucideIcon; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-full text-white', className)}
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 35% 30%, #3b82f6, #1d4ed8 70%)',
        boxShadow: '0 0 0 1.5px #fff, 0 1px 2.5px 1.5px oklch(0 0 0 / 0.18)',
      }}
    >
      <Icon strokeWidth={2.5} style={{ width: size * 0.56, height: size * 0.56 }} />
    </span>
  )
}

const FLAME =
  'M12 8.2c1.2 1.7 3.4 3 3.4 5.9a3.4 3.4 0 0 1-6.8 0c0-1.4.7-2.4 1.5-3.1.1 1.1.6 1.8 1.3 2-.4-1.8-.1-3.3.6-4.8Z'

/** A yellow warning triangle with a black edge: "!" or a flame for heat. */
export function WarnSign({ kind = 'danger', size = 26, className }: { kind?: 'danger' | 'hot'; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className={cn('shrink-0 drop-shadow-[0_1px_1px_oklch(0_0_0/0.2)]', className)}>
      <path d="M12 2.2L23 21.3H1Z" fill="#fff" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M12 3.4L21.7 20.4H2.3Z" fill="#facc15" stroke="#18181b" strokeWidth="1.7" strokeLinejoin="round" />
      {kind === 'hot' ? (
        <path d={FLAME} fill="#18181b" />
      ) : (
        <>
          <path d="M12 9V14.2" stroke="#18181b" strokeWidth="2.3" strokeLinecap="round" />
          <circle cx="12" cy="17.2" r="1.25" fill="#18181b" />
        </>
      )}
    </svg>
  )
}

/** Three tools fanned out like cards, and a tag with a question mark. */
export function QuizScene({ tools, mark, size = 52 }: { tools: [ToolId, ToolId, ToolId]; mark: string; size?: number }) {
  const fan = [
    { tool: tools[0], rotate: -14, x: -0.7, y: 0.08 },
    { tool: tools[2], rotate: 13, x: 0.7, y: 0.08 },
    { tool: tools[1], rotate: 0, x: 0, y: -0.04 },
  ]
  return (
    <span aria-hidden className="relative block" style={{ width: size * 2.45, height: size * 1.25 }}>
      {fan.map((f) => (
        <span
          key={f.tool}
          className="absolute top-1/2 left-1/2"
          style={{ transform: `translate(calc(-50% + ${f.x * size}px), calc(-50% + ${f.y * size}px)) rotate(${f.rotate}deg)` }}
        >
          <ToolArt tool={f.tool} size={size} />
        </span>
      ))}
      {/* a shop tag on a string */}
      <span
        className="absolute end-0 top-0 grid h-6 min-w-6 origin-top place-items-center rounded-[3px] border border-amber-700/40 bg-amber-200 px-1 text-sm leading-none font-bold text-amber-950 shadow-sm"
        style={{ transform: 'rotate(8deg)' }}
      >
        <span className="absolute -top-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-background ring-1 ring-amber-700/40" />
        {mark}
      </span>
    </span>
  )
}

/** A clipboard with a ticked list: the starter kit's mark. */
export function KitScene({ size = 64 }: { size?: number }) {
  const id = useId().replace(/:/g, '')
  const rows = [16.2, 22.6, 29, 35.4]
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className="shrink-0 text-foreground">
      <defs>
        <V id={`${id}b`} stops={['#d6a46a', '#b07a3e', '#8a5a2b']} />
        <V id={`${id}p`} stops={['#ffffff', '#f4f4f5']} />
        <V id={`${id}c`} stops={['#f4f4f5', '#a1a1aa', '#71717a']} />
        <R id={`${id}k`} stops={['#4ade80', '#16a34a']} />
      </defs>
      <Shadow y={44.6} rx={15} />
      <rect x="9" y="5.4" width="30" height="38.4" rx="2.2" fill={url(`${id}b`)} />
      <rect x="10" y="6" width="28" height="0.8" rx="0.4" fill="#fff" opacity="0.3" />
      <rect x="11.6" y="9.8" width="24.8" height="31.6" rx="0.6" fill={url(`${id}p`)} />
      {rows.map((y, i) => (
        <g key={y}>
          <rect x="14.4" y={y - 1.9} width="3.8" height="3.8" rx="0.6" fill="#fff" stroke="#a1a1aa" strokeWidth="0.5" />
          {i < 2 && (
            <path d={`M15 ${y}l1.2 1.3 2.6-3.2`} fill="none" stroke={url(`${id}k`)} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          )}
          <rect x="20.4" y={y - 0.55} width={i % 2 ? 9.6 : 12.6} height="1.1" rx="0.55" fill="#71717a" opacity={i < 2 ? 0.45 : 0.75} />
        </g>
      ))}
      {/* the spring clip */}
      <path d="M17.4 8.6C17.4 6.4 19 5.2 21 5.2H27C29 5.2 30.6 6.4 30.6 8.6V11.4H17.4Z" fill={url(`${id}c`)} stroke="#52525b" strokeWidth="0.35" />
      <rect x="21.2" y="3.2" width="5.6" height="3.6" rx="1.8" fill="none" stroke="#71717a" strokeWidth="1.1" />
      <path d="M18.6 8.4H29.4" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

/** A round inked stamp, like a teacher's mark on a worksheet. */
export function Stamp({ color, children, className }: { color: string; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn('grid place-items-center rounded-full border-[3px] p-1 text-center', className)}
      style={{ borderColor: color, color, boxShadow: `inset 0 0 0 2px var(--card), inset 0 0 0 3.5px ${color}` }}
    >
      {children}
    </span>
  )
}
