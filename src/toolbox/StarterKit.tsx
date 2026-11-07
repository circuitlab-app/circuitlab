import { ChevronRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CATEGORY_COLOR, STARTER_KIT, TOOLS, type ToolId } from './catalog'
import { KitScene, WarnSign } from './Marks'
import { useToolbox } from './store'
import { ToolArt } from './ToolArt'
import { stage, useBook } from './ui'

/*
 * The starter kit: the first tools a new maker needs, as a checklist on a
 * clipboard. Ticks are kept in the browser, so the list remembers.
 */

/** How full the kit is, drawn as a battery that fills cell by cell. */
function Gauge({ ticked, total }: { ticked: number; total: number }) {
  return (
    <span aria-hidden className="flex items-center">
      <span className="flex h-5 flex-1 gap-[3px] rounded-[5px] border-2 border-foreground/30 p-[2px]">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              'flex-1 rounded-[2px] transition-colors duration-300',
              i < ticked ? 'bg-emerald-500' : 'bg-foreground/[0.07]',
            )}
            style={{ transitionDelay: `${i * 20}ms` }}
          />
        ))}
      </span>
      <span className="h-2 w-1 rounded-e-[2px] bg-foreground/30" />
    </span>
  )
}

/** A pen-drawn tick box. */
function Box({ on }: { on: boolean }) {
  const reduce = useReducedMotion()
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-[4px] border-2 transition-colors',
        'peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50',
        on ? 'border-emerald-600 bg-emerald-500/10 dark:border-emerald-400' : 'border-foreground/35 bg-background',
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5 overflow-visible">
        <motion.path
          d="M4.5 12.8l4.6 4.9L19.8 5.6"
          fill="none"
          stroke="currentColor"
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-600 dark:text-emerald-400"
          initial={false}
          animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.28, ease: 'easeOut' }}
        />
      </svg>
    </span>
  )
}

function Row({ tool }: { tool: ToolId }) {
  const { book } = useBook()
  const on = useToolbox((s) => s.kit.includes(tool))
  const toggle = useToolbox((s) => s.toggleKit)
  const pick = useToolbox((s) => s.pick)
  const page = book.tools[tool]
  return (
    <li data-tool={tool} className={cn('flex items-center gap-1 transition-colors', on && 'bg-emerald-500/[0.05]')}>
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-2 ps-3 sm:ps-4">
        <input type="checkbox" className="peer sr-only" checked={on} onChange={() => toggle(tool)} aria-label={book.kit.have(page.name)} />
        <Box on={on} />
        <span className="grid size-12 shrink-0 place-items-center rounded-md" style={stage(CATEGORY_COLOR[TOOLS[tool].category])}>
          <ToolArt tool={tool} size={42} />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[14.5px] font-semibold">{page.name}</span>
          <span className="block text-[12.5px] text-pretty text-muted-foreground">{page.short}</span>
        </span>
      </label>
      <Button
        variant="ghost"
        size="icon-lg"
        className="me-1 shrink-0 text-muted-foreground"
        aria-label={`${book.kit.open}: ${page.name}`}
        title={book.kit.open}
        onClick={() => pick(tool)}
      >
        <ChevronRight className="size-5 rtl:-scale-x-100" />
      </Button>
    </li>
  )
}

export function StarterKit() {
  const { book } = useBook()
  const kit = useToolbox((s) => s.kit)
  const clearKit = useToolbox((s) => s.clearKit)
  const sheet = useRef<HTMLDivElement>(null)
  const ticked = STARTER_KIT.filter((id) => kit.includes(id)).length
  const total = STARTER_KIT.length
  const done = ticked === total

  // back from a tool's page: the same row again, with its button focused
  useLayoutEffect(() => {
    const returnTo = useToolbox.getState().returnTo
    const button = returnTo && sheet.current?.querySelector<HTMLElement>(`[data-tool="${returnTo}"] button`)
    if (!button) return
    button.focus({ preventScroll: true })
    button.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 pb-8 sm:p-6 sm:pb-10">
      <header className="flex items-center gap-3 sm:gap-4">
        <KitScene size={76} />
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">{book.kit.title}</h2>
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{book.kit.intro}</p>
        </div>
      </header>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground tabular-nums" aria-live="polite">
          {book.kit.progress(ticked, total)}
        </p>
        <Gauge ticked={ticked} total={total} />
      </div>

      {/* the sheet on the clipboard: ruled lines and a red margin, like a school notebook */}
      <div ref={sheet} className="relative overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
        <span aria-hidden className="absolute inset-y-0 start-[2.6rem] w-px bg-rose-400/50 sm:start-[2.85rem]" />
        <ul className="relative divide-y divide-dashed">
          {STARTER_KIT.map((tool) => (
            <Row key={tool} tool={tool} />
          ))}
        </ul>
      </div>

      {done && (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/[0.08] p-3.5 text-[15px] font-semibold text-pretty text-emerald-900 dark:text-emerald-100">
          {book.kit.done}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex min-w-0 flex-1 items-center gap-2 text-sm text-pretty text-muted-foreground">
          <WarnSign kind="hot" size={22} />
          {book.kit.later}
        </p>
        {ticked > 0 && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clearKit}>
            {book.kit.clear}
          </Button>
        )}
      </div>
    </div>
  )
}
