import { motion } from 'motion/react'
import { LEMON_COUNTS } from '@/circuit/catalog'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { useCircuit } from '@/store/circuit'

/*
 * Card controls for the two-way switch, the lemon battery and the joystick.
 * Each one fits the card's single 28 px control row, like WorkshopControls.
 */

/**
 * The two-way switch's knob in its slot: A on the left, B on the right, the
 * way the letters are printed on the switch. A tap slides it to the other side.
 */
export function SlideSwitchRow({ toB, label, onToggle }: { toB: boolean; label: string; onToggle: () => void }) {
  const side = (letter: 'A' | 'B', on: boolean) => (
    <span
      className={cn(
        'w-3 shrink-0 text-center text-[11px] leading-none font-bold transition-colors',
        on ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
      )}
    >
      {letter}
    </span>
  )
  return (
    <button
      type="button"
      role="switch"
      aria-checked={toB}
      aria-label={label}
      onClick={onToggle}
      className="nodrag node-track flex w-full items-center gap-2 px-2.5"
      dir="ltr"
    >
      {side('A', !toB)}
      {/* the slot in the metal shell */}
      <span className="relative h-3.5 flex-1 rounded-[3px] bg-foreground/15 shadow-[inset_0_1px_2px_oklch(0_0_0/0.35)]">
        <motion.span
          aria-hidden
          className="absolute top-1/2 flex h-5 w-[44%] -translate-y-1/2 items-center justify-center gap-[3px] rounded-[3px] bg-gradient-to-b from-zinc-500 to-zinc-900 shadow-[0_1px_2px_oklch(0_0_0/0.35),inset_0_1px_0_oklch(1_0_0/0.18)]"
          initial={false}
          animate={{ left: toB ? '56%' : '0%' }}
          transition={{ type: 'spring', stiffness: 600, damping: 34 }}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2.5 w-px rounded-full bg-zinc-300/50" />
          ))}
        </motion.span>
      </span>
      {side('B', toB)}
    </button>
  )
}

/** A tiny lemon, for counting the lemons in a row. */
function LemonGlyph({ x }: { x: number }) {
  return (
    <path
      transform={`translate(${x} 4)`}
      d="M0 0c.9-1.9 2.4-3 4-3s3.1 1.1 4 3c-.9 1.9-2.4 3-4 3S.9 1.9 0 0z"
      fill="#facc15"
      stroke="#a16207"
      strokeWidth="0.7"
      strokeLinejoin="round"
    />
  )
}

/** How many lemons sit in a row: each choice shows that many little lemons. */
export function LemonTrack({
  value,
  label,
  optionLabel,
  onChange,
}: {
  value: number
  label: string
  optionLabel: (n: number) => string
  onChange: (n: number) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="nodrag node-track grid grid-cols-4 gap-0.5 p-0.5" dir="ltr">
      {LEMON_COUNTS.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={optionLabel(n)}
          title={optionLabel(n)}
          onClick={() => onChange(n)}
          className={cn(
            'grid min-w-0 place-items-center rounded-[4px] transition',
            value === n ? 'bg-yellow-200 shadow-sm dark:bg-yellow-300/30' : 'opacity-60 hover:bg-card hover:opacity-100',
          )}
        >
          <svg aria-hidden viewBox={`-0.5 0 ${9 + (n - 1) * 5} 8`} className="h-2" style={{ width: `${(9 + (n - 1) * 5) * 1}px` }}>
            {Array.from({ length: n }, (_, i) => (
              <LemonGlyph key={i} x={i * 5} />
            ))}
          </svg>
        </button>
      ))}
    </div>
  )
}

/** One small slider of the joystick: X or Y. */
function StickSlider({ axis, value, label, onChange }: { axis: 'X' | 'Y'; value: number; label: string; onChange: (v: number) => void }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5">
      <span className="text-[11px] leading-none font-bold text-muted-foreground">{axis}</span>
      <Slider
        className="min-w-0 flex-1"
        min={0}
        max={100}
        step={1}
        aria-label={`${axis}: ${label}`}
        value={[Math.round(value * 100)]}
        onValueChange={([v]) => onChange(v / 100)}
        onValueCommit={() => useCircuit.getState().checkpoint()}
      />
    </span>
  )
}

/** The joystick's stick, set with two little sliders: X left and right, Y down and up. */
export function StickRow({
  x,
  y,
  labels,
  onChange,
}: {
  x: number
  y: number
  labels: { x: string; y: string }
  onChange: (next: { stickX?: number; stickY?: number }) => void
}) {
  return (
    <div className="nodrag nopan node-track flex items-center gap-3 px-2.5" dir="ltr">
      <StickSlider axis="X" value={x} label={labels.x} onChange={(stickX) => onChange({ stickX })} />
      <StickSlider axis="Y" value={y} label={labels.y} onChange={(stickY) => onChange({ stickY })} />
    </div>
  )
}
