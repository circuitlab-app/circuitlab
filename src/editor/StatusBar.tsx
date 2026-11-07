import { SlidingNumber } from '@animate-ui/react/primitives/texts/sliding-number'
import { AnimatePresence, motion } from 'motion/react'
import { Kbd } from '@/components/ui/kbd'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import { useCircuit } from '@/store/circuit'
import { useSimulation } from '@/store/simulation'

type BoardState = 'paused' | 'empty' | 'noBattery' | 'short' | 'complete' | 'open'

const TONE: Record<BoardState, string> = {
  paused: 'bg-muted text-muted-foreground',
  empty: 'bg-muted text-muted-foreground',
  noBattery: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  short: 'bg-red-500/15 text-red-700 dark:text-red-400',
  complete: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  open: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
}

/** One short sentence about the whole board, shared by the desktop bar and the phone pill. */
function useBoardStatus() {
  const { t } = useI18n()
  const running = useSimulation((s) => s.running)
  const result = useSimulation((s) => s.result)
  const parts = useCircuit((s) => s.nodes.length)

  const state: BoardState = !running
    ? 'paused'
    : parts === 0
      ? 'empty'
      : !result.hasBattery
        ? 'noBattery'
        : result.shortCircuit
          ? 'short'
          : result.batteryCurrent > 1e-3
            ? 'complete'
            : 'open'

  const label = {
    paused: t.statusBar.paused,
    empty: t.statusBar.empty,
    noBattery: t.statusBar.noBattery,
    short: t.statusBar.short,
    complete: t.statusBar.complete,
    open: t.statusBar.open,
  }[state]

  return { state, label, milliamps: Math.round(result.batteryCurrent * 1000) }
}

function StatusPill({ className }: { className?: string }) {
  const { state, label } = useBoardStatus()
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={state}
        initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        role="status"
        className={cn(
          'flex min-w-0 items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold whitespace-nowrap',
          TONE[state],
          className,
        )}
      >
        <span
          className={cn(
            'size-1.5 shrink-0 rounded-full bg-current',
            (state === 'complete' || state === 'short') && 'animate-pulse',
          )}
        />
        <span className="truncate">{label}</span>
      </motion.span>
    </AnimatePresence>
  )
}

/** Desktop footer: board state, battery current, counts and the main shortcuts. */
export function StatusBar() {
  const { t } = useI18n()
  const { milliamps } = useBoardStatus()
  const parts = useCircuit((s) => s.nodes.length)
  const wires = useCircuit((s) => s.edges.length)

  return (
    <footer className="relative z-20 flex h-9 shrink-0 items-center gap-4 border-t bg-background px-3 text-xs max-lg:hidden">
      <StatusPill className="py-0.5" />

      <span className="flex items-center gap-1.5 text-muted-foreground">
        {t.statusBar.batteryCurrent}
        <span dir="ltr" className="flex items-baseline gap-0.5 font-mono font-semibold text-foreground tabular-nums">
          <SlidingNumber number={milliamps} />
          <span className="text-muted-foreground">{t.units.milliamp}</span>
        </span>
      </span>

      <span className="ms-auto text-muted-foreground tabular-nums">{t.statusBar.count(parts, wires)}</span>
      <span className="flex items-center gap-1 text-muted-foreground" dir="ltr">
        <Kbd>R</Kbd>
        <Kbd>Del</Kbd>
        <Kbd>⌘Z</Kbd>
      </span>
    </footer>
  )
}

/** On phones and tablets the board state floats over the bottom of the board instead. */
export function BoardStatusPill() {
  const { t } = useI18n()
  const { state, milliamps } = useBoardStatus()
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[6] flex justify-center px-16 text-xs lg:hidden">
      <div className="float-panel flex max-w-full min-w-0 items-center gap-2 rounded-lg p-1">
        <StatusPill />
        {state === 'complete' && (
          <span dir="ltr" className="flex shrink-0 items-baseline gap-0.5 pe-2 font-mono font-semibold tabular-nums">
            <SlidingNumber number={milliamps} />
            <span className="text-muted-foreground">{t.units.milliamp}</span>
          </span>
        )}
      </div>
    </div>
  )
}
