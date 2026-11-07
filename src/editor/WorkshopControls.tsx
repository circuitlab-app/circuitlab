import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { RGB_CHANNELS, gateInputs, type GateType } from '@/circuit/catalog'
import { cn } from '@/lib/utils'

/*
 * Small controls for the cards of the workshop parts: the power supply,
 * relay, RGB LED, speaker, logic chips, regulator and oscilloscope. Each one
 * fits the card's single 28 px control row.
 */

/** A row of choices, like the battery's: the speaker's notes, the 555's speeds. */
export function ChoiceTrack<T extends number>({
  options,
  value,
  labels,
  label,
  onChange,
}: {
  options: readonly T[]
  value: T
  labels: readonly string[]
  label: string
  onChange: (value: T) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="nodrag node-track grid gap-0.5 p-0.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option, i) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'min-w-0 truncate rounded-[4px] px-0.5 text-[11px] font-semibold transition',
            value === option
              ? 'bg-[var(--part-accent)] text-white shadow-sm'
              : 'text-muted-foreground hover:bg-card hover:text-foreground',
          )}
        >
          {labels[i]}
        </button>
      ))}
    </div>
  )
}

/** A tiny lamp with a letter: one input or output of a logic chip. */
export function Bit({ name, on, output }: { name: string; on: boolean; output?: boolean }) {
  return (
    <span
      className={cn(
        'flex items-center gap-1 rounded-[4px] px-1.5 py-1 text-[11px] leading-none font-bold transition-colors',
        output ? 'bg-card shadow-[inset_0_0_0_1px_var(--stage-line)]' : '',
        on ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      {name}
      <span
        aria-hidden
        className="size-2 rounded-full transition-[background-color,box-shadow] duration-150"
        style={{
          background: on ? '#22c55e' : 'color-mix(in oklch, var(--foreground) 16%, transparent)',
          boxShadow: on ? '0 0 6px 1px #22c55e99' : 'none',
        }}
      />
      <span className="w-2 text-center tabular-nums">{on ? 1 : 0}</span>
    </span>
  )
}

/** A gate's inputs and output, lit when they are 1: A ● B ● → Y ●. */
export function GateLamps({ type, channels, label }: { type: GateType; channels?: Record<string, number>; label: string }) {
  return (
    <div role="status" aria-label={label} className="node-track flex items-center justify-center gap-0.5 px-1" dir="ltr">
      {gateInputs(type).map((input) => (
        <Bit key={input} name={input} on={(channels?.[input] ?? 0) > 0.5} />
      ))}
      <svg aria-hidden viewBox="0 0 16 8" className="mx-0.5 h-2 w-4 shrink-0 text-muted-foreground">
        <path d="M1 4h12M10 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <Bit name="Y" on={(channels?.Y ?? 0) > 0.5} output />
    </div>
  )
}

/** How brightly each of the RGB LED's three lights shines. */
export function RgbBars({ channels, label }: { channels?: Record<string, number>; label: string }) {
  return (
    <div role="status" aria-label={label} className="node-track grid grid-cols-3 items-center gap-2 px-2.5" dir="ltr">
      {(Object.keys(RGB_CHANNELS) as (keyof typeof RGB_CHANNELS)[]).map((ch) => {
        const fraction = Math.min(1, (channels?.[ch] ?? 0) / 1.3)
        return (
          <span key={ch} className="flex min-w-0 items-center gap-1">
            <span className="text-[10px] font-bold text-muted-foreground">{ch}</span>
            <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-foreground/10">
              <motion.span
                className="block h-full rounded-full"
                style={{ background: RGB_CHANNELS[ch] }}
                animate={{ width: `${Math.round(fraction * 100)}%` }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              />
            </span>
          </span>
        )
      })}
    </div>
  )
}

/** The relay's switch drawn open or closed, the word for it, and the volts on its coil. */
export function RelayRow({ closed, coil, text }: { closed: boolean; coil: number; text: string }) {
  const volts = Math.abs(coil)
  return (
    <div role="status" aria-label={text} className="node-track flex items-center gap-2 px-2.5" dir="ltr">
      <svg aria-hidden viewBox="0 0 22 12" className="h-3 w-[22px] shrink-0">
        <circle cx="3" cy="8" r="2" fill="currentColor" className="text-muted-foreground" />
        <circle cx="19" cy="8" r="2" fill="currentColor" className="text-muted-foreground" />
        <motion.line
          x1="3"
          y1="8"
          x2="19"
          y2="8"
          stroke={closed ? '#16a34a' : 'currentColor'}
          strokeWidth="2"
          strokeLinecap="round"
          className="text-muted-foreground"
          style={{ transformOrigin: '3px 8px' }}
          animate={{ rotate: closed ? 0 : -24 }}
          transition={{ type: 'spring', stiffness: 700, damping: 26 }}
        />
      </svg>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[11px] font-semibold transition-colors',
          closed ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
        )}
      >
        {text}
      </span>
      <span className="w-9 shrink-0 text-end text-[11px] font-semibold text-muted-foreground tabular-nums">
        {volts.toFixed(1)} V
      </span>
    </div>
  )
}

/** A small green LCD with a reading, like the meters'. */
export function LcdRow({ label, children, after }: { label: string; children: ReactNode; after?: ReactNode }) {
  return (
    <div className="flex h-7 items-stretch gap-1" dir="ltr">
      <div
        role="status"
        aria-label={label}
        className="lcd flex min-w-0 flex-1 items-center justify-end gap-1 overflow-hidden rounded-[6px] px-2.5 font-mono text-[13px] leading-none font-semibold whitespace-nowrap tabular-nums"
      >
        {children}
      </div>
      {after}
    </div>
  )
}
