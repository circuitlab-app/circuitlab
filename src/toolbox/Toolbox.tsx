import { Check, ChevronLeft, ChevronRight, Glasses, Lightbulb, Plus, Search, Unplug, Users, X, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { usePlacePart } from '@/editor/DragGhost'
import { PartArt } from '@/editor/PartArt'
import { useI18n } from '@/i18n'
import { playClick, playSuccess } from '@/lib/sound'
import { cn } from '@/lib/utils'
import {
  BOARD_PARTS,
  CATEGORY_COLOR,
  CATEGORY_TOOL,
  STARTER_KIT,
  TOOL_CATEGORIES,
  TOOL_IDS,
  TOOLS,
  toolsIn,
  type ToolCategory,
  type ToolId,
} from './catalog'
import { KitScene, MustSign, QuizScene, WarnSign } from './Marks'
import { ROUND } from './quiz'
import { Quiz } from './QuizScreen'
import { StarterKit } from './StarterKit'
import { useToolbox } from './store'
import { ToolArt, ToolboxMark } from './ToolArt'
import { ink, normalize, searchTools, stage, useBook, useWide } from './ui'

/*
 * The Toolbox: an illustrated guide to the real tools of an electronics
 * workshop. The drawers list every tool; picking one opens its page with what
 * it is for, how to use it, the one safety rule to remember and a fun fact.
 * A "Which tool?" quiz and a starter-kit checklist sit on top of the drawers.
 * A dialog on wide screens, a bottom sheet on phones.
 */

const RULE_SIGNS: LucideIcon[] = [Users, Unplug, Glasses]

const SEARCH_ID = 'toolbox-search'

// where the drawers were scrolled to, so "All tools" brings the child back to the same spot
let drawerScroll = 0

/* ───────────────────────── header ───────────────────────── */

function Explored() {
  const { book } = useBook()
  const seen = useToolbox((s) => s.seen.length)
  const total = TOOL_IDS.length
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-foreground/10 sm:w-14" aria-hidden>
        <span
          className="block h-full rounded-full bg-emerald-500 transition-[width] duration-500"
          style={{ width: `${(seen / total) * 100}%` }}
        />
      </span>
      <span className="tabular-nums max-sm:hidden">{book.explored(seen, total)}</span>
      <span className="tabular-nums sm:hidden" aria-hidden>
        {book.labels.position(seen, total)}
      </span>
      <span className="sr-only sm:hidden">{book.explored(seen, total)}</span>
    </div>
  )
}

function CloseButton() {
  const { book } = useBook()
  return (
    <DialogClose asChild>
      <Button variant="ghost" size="icon-lg" aria-label={book.labels.close} className="shrink-0">
        <X className="size-5" />
      </Button>
    </DialogClose>
  )
}

function Header() {
  const { book } = useBook()
  const tool = useToolbox((s) => s.tool)
  const view = useToolbox((s) => s.view)
  const pick = useToolbox((s) => s.pick)
  const go = useToolbox((s) => s.go)
  const index = tool ? TOOL_IDS.indexOf(tool) : -1
  // a tool's page goes back to where it was opened from: the drawers, the quiz or the kit
  const backTo = tool ? { drawers: book.labels.back, quiz: book.quiz.title, kit: book.kit.title }[view] : book.labels.back
  const home = !tool && view === 'drawers'
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2 sm:px-3">
      {home ? (
        <>
          <ToolboxMark size={34} className="ms-1" />
          <DialogTitle className="min-w-0 truncate text-base font-semibold">{book.title}</DialogTitle>
          <div className="ms-auto" />
          <Explored />
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            size="lg"
            className="min-w-0 gap-1 px-2 font-semibold"
            onClick={() => (tool ? pick(null) : go('drawers'))}
          >
            <ChevronLeft className="size-5 rtl:-scale-x-100" />
            <span className="truncate">{backTo}</span>
          </Button>
          <DialogTitle className="sr-only">{book.title}</DialogTitle>
          <DialogDescription className="sr-only">{book.intro}</DialogDescription>
          {tool && (
            <span className="ms-auto shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
              {book.labels.position(index + 1, TOOL_IDS.length)}
            </span>
          )}
          {!tool && <div className="ms-auto" />}
        </>
      )}
      <CloseButton />
    </header>
  )
}

/* ───────────────────────── the drawers ───────────────────────── */

function Badge({ className, label, children }: { className?: string; label: string; children: ReactNode }) {
  return (
    <span title={label} className={cn('grid place-items-center', className)}>
      {children}
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** The part of a name that matches the search, marked like a highlighter pen. */
function Marked({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase()
  const at = q ? text.toLowerCase().indexOf(q) : -1
  if (at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-[2px] bg-yellow-300/70 text-inherit dark:bg-yellow-400/35">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  )
}

function ToolCard({ id, query = '' }: { id: ToolId; query?: string }) {
  const { book } = useBook()
  const pick = useToolbox((s) => s.pick)
  const seen = useToolbox((s) => s.seen.includes(id))
  const info = TOOLS[id]
  const color = CATEGORY_COLOR[info.category]
  const page = book.tools[id]
  return (
    <button
      type="button"
      data-tool={id}
      onClick={() => pick(id)}
      style={{ '--tool-accent': color } as CSSProperties}
      className={cn(
        'group relative flex min-w-0 flex-col gap-2 rounded-[10px] border bg-card p-1.5 pb-2.5 text-start shadow-[var(--shadow-card)]',
        'transition-[translate,box-shadow,border-color] duration-200 ease-out',
        'hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,var(--tool-accent)_45%,var(--border))] hover:shadow-[var(--shadow-float)]',
        'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-0',
      )}
    >
      <span className="relative grid h-20 place-items-center overflow-hidden rounded-md sm:h-24" style={stage(color)}>
        <ToolArt
          tool={id}
          size={62}
          className="transition-transform duration-200 ease-out group-hover:scale-[1.07] sm:size-[80px]"
        />
        {seen && (
          <span className="absolute start-1.5 top-1.5">
            <Badge className="size-5 rounded-full bg-emerald-500 text-white shadow-sm [&_svg]:size-3" label={book.labels.seen}>
              <Check strokeWidth={3} />
            </Badge>
          </span>
        )}
        {(info.hot || info.grownUp) && (
          <span className="absolute end-1.5 top-1.5 flex items-center gap-1">
            {info.hot && (
              <Badge label={book.labels.hot}>
                <WarnSign kind="hot" size={21} />
              </Badge>
            )}
            {info.grownUp && (
              <Badge label={book.labels.grownUp}>
                <MustSign icon={Users} size={17} />
              </Badge>
            )}
          </span>
        )}
      </span>
      <span className="min-w-0 space-y-0.5 px-1">
        <span className="line-clamp-2 block text-[13px] leading-tight font-semibold">
          <Marked text={page.name} query={query} />
        </span>
        <span className="line-clamp-2 block text-[11.5px] leading-snug text-muted-foreground max-sm:hidden">{page.short}</span>
      </span>
    </button>
  )
}

function Rules() {
  const { book } = useBook()
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
      {/* hazard tape, like the edge of a real workbench */}
      <div aria-hidden className="h-1.5 bg-[repeating-linear-gradient(135deg,#facc15_0_7px,#27272a_7px_14px)]" />
      <div className="space-y-3 p-3 sm:p-3.5">
        <h3 className="text-xs font-semibold text-muted-foreground">{book.rules.title}</h3>
        <ul className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
          {book.rules.items.map((rule, i) => (
            <li key={rule} className="flex items-start gap-2.5 text-[13px] leading-snug">
              <MustSign icon={RULE_SIGNS[i]} size={28} className="mt-px" />
              <span className="min-w-0 pt-1 text-pretty">{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Activity({
  color,
  art,
  title,
  text,
  meta,
  onClick,
}: {
  color: string
  art: ReactNode
  title: string
  text: string
  meta?: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ '--tool-accent': color } as CSSProperties}
      className={cn(
        'group flex min-w-0 flex-col gap-2 rounded-[10px] border bg-card p-1.5 pb-2.5 text-start shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:gap-3 sm:pb-1.5',
        'transition-[translate,box-shadow,border-color] duration-200 ease-out',
        'hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,var(--tool-accent)_45%,var(--border))] hover:shadow-[var(--shadow-float)]',
        'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-0',
      )}
    >
      <span className="grid h-20 shrink-0 place-items-center overflow-hidden rounded-md sm:h-24 sm:w-32 lg:w-36" style={stage(color)}>
        <span className="transition-transform duration-200 ease-out group-hover:scale-[1.05]">{art}</span>
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2 px-1">
        <span className="min-w-0 flex-1 space-y-0.5">
          <span className="block text-[14px] leading-tight font-semibold sm:text-[15px]">{title}</span>
          <span className="block text-[12px] leading-snug text-pretty text-muted-foreground sm:text-[13px]">{text}</span>
          {meta && (
            <span className="block pt-0.5 text-[12px] font-semibold tabular-nums" style={{ color: ink(color) }}>
              {meta}
            </span>
          )}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground max-sm:hidden rtl:-scale-x-100" />
      </span>
    </button>
  )
}

function Activities() {
  const { book, dir } = useBook()
  const wide = useWide()
  const go = useToolbox((s) => s.go)
  const best = useToolbox((s) => s.best)
  const ticked = useToolbox((s) => STARTER_KIT.filter((id) => s.kit.includes(id)).length)
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <Activity
        color="#f59e0b"
        art={<QuizScene tools={['multimeter', 'solderingIron', 'sideCutters']} mark={dir === 'rtl' ? '؟' : '?'} size={wide ? 44 : 34} />}
        title={book.quiz.title}
        text={book.quiz.blurb}
        meta={best !== null ? book.quiz.best(best, ROUND) : undefined}
        onClick={() => go('quiz')}
      />
      <Activity
        color="#22c55e"
        art={<KitScene size={wide ? 76 : 64} />}
        title={book.kit.title}
        text={book.kit.blurb}
        meta={book.kit.progress(ticked, STARTER_KIT.length)}
        onClick={() => go('kit')}
      />
    </div>
  )
}

function DrawerHeading({ category, count }: { category: ToolCategory; count: number }) {
  const { book, num } = useBook()
  return (
    <div className="flex items-center gap-2.5">
      <ToolArt tool={CATEGORY_TOOL[category]} size={38} className="-my-1" />
      <div className="min-w-0 flex-1">
        <h3 className="flex items-baseline gap-2 text-sm font-semibold">
          <span className="min-w-0" style={{ color: ink(CATEGORY_COLOR[category]) }}>
            {book.categories[category].name}
          </span>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">{num(count)}</span>
        </h3>
        <p className="text-xs leading-relaxed text-pretty text-muted-foreground">{book.categories[category].blurb}</p>
      </div>
    </div>
  )
}

function SearchBar({ onJump }: { onJump?: () => void }) {
  const { book } = useBook()
  const wide = useWide()
  const query = useToolbox((s) => s.query)
  const setQuery = useToolbox((s) => s.setQuery)
  const input = useRef<HTMLInputElement>(null)
  return (
    <div data-search className="sticky top-0 z-10 border-b bg-background/95 px-3 py-2.5 backdrop-blur-sm sm:px-5 sm:py-3">
      <div role="search" className="group relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute start-3 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground"
        />
        <input
          ref={input}
          id={SEARCH_ID}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onJump?.()
          }}
          placeholder={book.search.placeholder}
          aria-label={book.search.label}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          className={cn(
            'h-11 w-full rounded-md border border-foreground/20 bg-card ps-10 pe-12 text-base shadow-[inset_0_1px_2px_oklch(0_0_0/0.07)] outline-none sm:text-[15px]',
            'transition-[border-color,box-shadow] placeholder:text-muted-foreground hover:border-foreground/35',
            'focus:border-ring focus:ring-3 focus:ring-ring/30 [&::-webkit-search-cancel-button]:appearance-none',
          )}
        />
        {query ? (
          <button
            type="button"
            aria-label={book.search.clear}
            onClick={() => {
              setQuery('')
              input.current?.focus()
            }}
            className="absolute end-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X className="size-4" />
          </button>
        ) : (
          wide && (
            <kbd
              aria-hidden
              className="pointer-events-none absolute end-2.5 top-1/2 grid h-6 min-w-6 -translate-y-1/2 place-items-center rounded-[4px] border border-b-2 bg-muted px-1.5 font-mono text-xs text-muted-foreground"
            >
              /
            </kbd>
          )
        )}
      </div>
    </div>
  )
}

function Results({ query }: { query: string }) {
  const { book } = useBook()
  const found = searchTools(book, query)
  const drawers = TOOL_CATEGORIES.filter((c) => found.some((id) => TOOLS[id].category === c))
  return (
    <div className="space-y-6 p-3 pb-6 sm:p-5 sm:pb-8">
      <DialogDescription className="sr-only">{book.intro}</DialogDescription>
      <p className="text-sm font-medium text-muted-foreground tabular-nums" aria-live="polite">
        {found.length ? book.search.found(found.length) : ''}
      </p>
      {found.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
          <span className="grid size-28 place-items-center rounded-lg" style={stage(CATEGORY_COLOR.measure)}>
            <ToolArt tool="loupe" size={88} />
          </span>
          <p className="text-[15px] font-semibold text-pretty" aria-live="polite">
            {book.search.none(query.trim())}
          </p>
          <p className="max-w-sm text-sm text-pretty text-muted-foreground">{book.search.hint}</p>
        </div>
      )}
      {drawers.map((category) => {
        const ids = found.filter((id) => TOOLS[id].category === category)
        return (
          <section key={category} className="space-y-3">
            <DrawerHeading category={category} count={ids.length} />
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4">
              {ids.map((id) => (
                <ToolCard key={id} id={id} query={query} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/** The rail of a tool chest: one drawer per kind of tool, the open one pulled out a little. */
function Chest({ active, onJump }: { active: ToolCategory; onJump: (category: ToolCategory) => void }) {
  const { book, num } = useBook()
  return (
    <nav className="flex w-60 shrink-0 flex-col gap-1.5 overflow-y-auto border-e bg-muted/40 p-2.5 lg:w-64">
      {TOOL_CATEGORIES.map((category) => {
        const color = CATEGORY_COLOR[category]
        const on = category === active
        return (
          <button
            key={category}
            type="button"
            onClick={() => onJump(category)}
            aria-current={on ? 'true' : undefined}
            className={cn(
              'group relative flex min-w-0 items-center gap-2 rounded-md border bg-card py-1 ps-1 pe-2.5 text-start text-[13.5px] font-medium',
              'shadow-[inset_0_1px_0_oklch(1_0_0/0.6),0_1px_1px_oklch(0_0_0/0.06)] transition-[translate,box-shadow,border-color] duration-200 ease-out dark:shadow-[inset_0_1px_0_oklch(1_0_0/0.05)]',
              'hover:border-foreground/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
              on && 'border-[color-mix(in_oklch,var(--accent-c)_45%,var(--border))] shadow-[var(--shadow-float)] ltr:translate-x-1.5 rtl:-translate-x-1.5',
            )}
            style={{ '--accent-c': color } as CSSProperties}
          >
            <ToolArt tool={CATEGORY_TOOL[category]} size={30} />
            <span className="min-w-0 flex-1 truncate" style={on ? { color: ink(color) } : undefined}>
              {book.categories[category].name}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{num(toolsIn(category).length)}</span>
            {/* the drawer's pull */}
            <span
              aria-hidden
              className="h-1.5 w-4 shrink-0 rounded-full shadow-[inset_0_1px_0_oklch(1_0_0/0.55),0_1px_1px_oklch(0_0_0/0.15)]"
              style={{ background: on ? color : 'linear-gradient(#f4f4f5, #a1a1aa)' }}
            />
          </button>
        )
      })}
    </nav>
  )
}

/** Every tool, drawer by drawer, under the search box. On wide screens a tool chest on the side jumps between drawers. */
function Drawers() {
  const { book } = useBook()
  const returnTo = useToolbox((s) => s.returnTo)
  const query = useToolbox((s) => s.query)
  const setQuery = useToolbox((s) => s.setQuery)
  const wide = useWide()
  const reduce = useReducedMotion()
  const pane = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<ToolCategory>('measure')
  const searching = query.trim().length > 0

  // back from a tool page: the same scroll spot, with the tool's card focused
  useLayoutEffect(() => {
    const el = pane.current
    if (!el) return
    el.scrollTop = drawerScroll
    if (returnTo) el.querySelector<HTMLElement>(`[data-tool="${returnTo}"]`)?.focus({ preventScroll: true })
  }, [returnTo])

  const barHeight = () => pane.current?.querySelector<HTMLElement>('[data-search]')?.offsetHeight ?? 0

  const onScroll = () => {
    const el = pane.current
    if (!el) return
    drawerScroll = el.scrollTop
    if (!wide || searching) return
    const sections = [...el.querySelectorAll<HTMLElement>('[data-drawer]')]
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
    const line = el.scrollTop + barHeight() + 32
    const current = atEnd ? sections.at(-1) : sections.filter((s) => s.offsetTop <= line).at(-1) ?? sections[0]
    const next = current?.dataset.drawer as ToolCategory | undefined
    if (next && next !== active) setActive(next)
  }

  const jump = (category: ToolCategory) => {
    setActive(category)
    const scroll = () => {
      const el = pane.current
      const section = el?.querySelector<HTMLElement>(`[data-drawer="${category}"]`)
      if (!el || !section) return
      el.scrollTo({ top: section.offsetTop - barHeight() - 16, behavior: reduce ? 'auto' : 'smooth' })
    }
    if (searching) {
      // leave the search first, then go to the drawer once it is drawn again
      setQuery('')
      requestAnimationFrame(scroll)
    } else scroll()
  }

  return (
    <div className="flex min-h-0 flex-1">
      {wide && <Chest active={active} onJump={jump} />}
      <div ref={pane} onScroll={onScroll} data-pane className="relative min-w-0 flex-1 overflow-y-auto overscroll-contain">
        <SearchBar onJump={() => pane.current?.scrollTo({ top: 0 })} />
        {searching ? (
          <Results query={query} />
        ) : (
          <div className="space-y-6 p-3 pb-6 sm:p-5 sm:pb-8">
            <DialogDescription className="text-sm leading-relaxed text-pretty">{book.intro}</DialogDescription>
            <Rules />
            <Activities />
            {TOOL_CATEGORIES.map((category) => (
              <section key={category} data-drawer={category} className="space-y-3">
                <DrawerHeading category={category} count={toolsIn(category).length} />
                <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4">
                  {toolsIn(category).map((id) => (
                    <ToolCard key={id} id={id} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ───────────────────────── a tool's page ───────────────────────── */

function Heading({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-semibold text-muted-foreground">{children}</h3>
}

function Callout({ tone, title, children }: { tone: 'safe' | 'fact'; title: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'space-y-1.5 rounded-xl border p-3.5',
        tone === 'safe' && 'border-amber-500/45 bg-amber-400/[0.09] dark:bg-amber-400/[0.07]',
        tone === 'fact' && 'border-violet-500/25 bg-violet-500/[0.07] dark:bg-violet-500/10',
      )}
    >
      <p
        className={cn(
          'flex items-center gap-2 text-xs font-bold',
          tone === 'safe' ? 'text-amber-800 dark:text-amber-200' : 'text-violet-700 dark:text-violet-300',
        )}
      >
        {tone === 'safe' ? <WarnSign size={22} /> : <Lightbulb className="size-[18px]" strokeWidth={2.25} />}
        {title}
      </p>
      <p
        className={cn(
          'text-[14.5px] leading-relaxed text-pretty',
          tone === 'safe' && 'font-medium text-amber-950 dark:text-amber-50',
        )}
      >
        {children}
      </p>
    </div>
  )
}

/** Tools with a matching part on the board: put that part on the board and go and try it. */
function TryOnBoard({ tool }: { tool: ToolId }) {
  const { book } = useBook()
  const { t } = useI18n()
  const { placeCenter } = usePlacePart()
  const setOpen = useToolbox((s) => s.setOpen)
  const parts = BOARD_PARTS[tool]
  if (!parts) return null
  return (
    <section
      className="space-y-3 rounded-xl border p-3.5"
      // the board's own dotted grid
      style={{ background: 'radial-gradient(circle, color-mix(in oklch, var(--border) 70%, transparent) 0 1px, transparent 1.3px) 7px 7px / 14px 14px, var(--card)' }}
    >
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold">{book.board.title}</h3>
        <p className="text-[13.5px] leading-snug text-pretty text-muted-foreground">{book.board.text}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {parts.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              placeCenter(type)
              setOpen(false)
            }}
            className={cn(
              'group flex min-w-0 items-center gap-3 rounded-lg border bg-card p-1.5 pe-3 text-start shadow-[var(--shadow-card)]',
              'transition-[translate,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[var(--shadow-float)]',
              'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-0',
            )}
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-md bg-muted/70">
              <PartArt partType={type} size={42} />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[14px] font-semibold">{t.parts[type].name}</span>
              <span className="block truncate text-xs text-muted-foreground">{book.board.add}</span>
            </span>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-110">
              <Plus className="size-4" strokeWidth={2.75} />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function Neighbour({ tool, side }: { tool: ToolId; side: 'previous' | 'next' }) {
  const { book } = useBook()
  const pick = useToolbox((s) => s.pick)
  const next = side === 'next'
  return (
    <button
      type="button"
      onClick={() => pick(tool)}
      className={cn(
        'flex min-w-0 items-center gap-2 rounded-lg border bg-card px-2 py-1.5 shadow-[var(--shadow-card)] transition-colors',
        'hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px',
        next ? 'flex-row-reverse text-end' : 'text-start',
      )}
    >
      {next ? (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:-scale-x-100" />
      ) : (
        <ChevronLeft className="size-4 shrink-0 text-muted-foreground rtl:-scale-x-100" />
      )}
      <ToolArt tool={tool} size={32} />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[11px] text-muted-foreground">{next ? book.labels.next : book.labels.previous}</span>
        <span className="block truncate text-[13px] font-semibold">{book.tools[tool].name}</span>
      </span>
    </button>
  )
}

function ToolPage({ tool }: { tool: ToolId }) {
  const { book, dir, num } = useBook()
  const step = useToolbox((s) => s.step)
  const wide = useWide()
  const reduce = useReducedMotion()
  const scroller = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const info = TOOLS[tool]
  const page = book.tools[tool]
  const color = CATEGORY_COLOR[info.category]
  const index = TOOL_IDS.indexOf(tool)
  const total = TOOL_IDS.length
  const previous = TOOL_IDS[(index - 1 + total) % total]
  const next = TOOL_IDS[(index + 1) % total]

  // a new page starts at the top, and screen readers hear its name
  useLayoutEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
    heading.current?.focus({ preventScroll: true })
  }, [tool])

  const shift = reduce ? 0 : step * (dir === 'rtl' ? -14 : 14)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <motion.article
          key={tool}
          initial={reduce ? false : { opacity: 0, x: shift }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:gap-7 md:p-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]"
        >
          <div className="min-w-0 space-y-4 md:sticky md:top-6 md:self-start">
            <div className="relative grid h-44 place-items-center overflow-hidden rounded-lg md:h-60" style={stage(color)}>
              <ToolArt tool={tool} size={wide ? 184 : 144} />
            </div>
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: ink(color) }}>
                <span aria-hidden className="size-2 rounded-[2px]" style={{ background: color }} />
                {book.categories[info.category].name}
              </p>
              <h2 ref={heading} tabIndex={-1} className="text-xl leading-tight font-semibold tracking-tight outline-none">
                {page.name}
              </h2>
              <p className="text-sm text-pretty text-muted-foreground">{page.short}</p>
            </div>
            {(info.grownUp || info.hot) && (
              <ul className="space-y-1.5 text-[13px] font-semibold">
                {info.grownUp && (
                  <li className="flex items-center gap-2">
                    <MustSign icon={Users} size={22} />
                    {book.labels.grownUp}
                  </li>
                )}
                {info.hot && (
                  <li className="flex items-center gap-2">
                    <WarnSign kind="hot" size={24} className="-mx-px" />
                    {book.labels.hot}
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="min-w-0 space-y-6">
            <section className="space-y-2">
              <Heading>{book.labels.use}</Heading>
              <p className="text-[15px] leading-relaxed text-pretty">{page.use}</p>
            </section>

            <section className="space-y-3">
              <Heading>{book.labels.steps}</Heading>
              <ol>
                {page.steps.map((text, i) => (
                  <li key={i} className="relative flex gap-3 pb-3.5 last:pb-0">
                    {i < page.steps.length - 1 && (
                      <span aria-hidden className="absolute start-[13px] top-7 bottom-0.5 w-px bg-border" />
                    )}
                    <span
                      className="grid size-[27px] shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums"
                      style={{
                        background: `color-mix(in oklab, ${color} 16%, var(--card))`,
                        color: ink(color),
                        boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${color} 35%, transparent)`,
                      }}
                    >
                      {num(i + 1)}
                    </span>
                    <span className="min-w-0 pt-[3px] text-[14.5px] leading-snug text-pretty">{text}</span>
                  </li>
                ))}
              </ol>
            </section>

            <Callout tone="safe" title={book.labels.safe}>
              {page.safe}
            </Callout>
            <Callout tone="fact" title={book.labels.fact}>
              {page.fact}
            </Callout>
            <TryOnBoard tool={tool} />
          </div>
        </motion.article>
      </div>

      <nav className="pb-safe grid shrink-0 grid-cols-2 gap-2 border-t bg-background px-2.5 pt-2">
        <Neighbour tool={previous} side="previous" />
        <Neighbour tool={next} side="next" />
      </nav>
    </div>
  )
}

/* ───────────────────────── the box itself ───────────────────────── */

function Body() {
  const tool = useToolbox((s) => s.tool)
  const view = useToolbox((s) => s.view)
  if (tool) return <ToolPage tool={tool} />
  if (view === 'drawers') return <Drawers />
  return (
    <div data-pane className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {view === 'quiz' ? <Quiz /> : <StarterKit />}
    </div>
  )
}

/** Arrow keys turn pages, "/" finds a tool, 1–3 answer the quiz; keys never reach the board's shortcuts behind the box. */
function useKeys() {
  const { dir } = useI18n()
  return (e: KeyboardEvent) => {
    // Tab and Escape belong to the dialog itself (focus trap, closing)
    if (e.key === 'Tab' || e.key === 'Escape') return
    e.stopPropagation()
    const { tool, view, pick } = useToolbox.getState()
    const target = e.target as HTMLElement
    const typing = target instanceof HTMLInputElement && target.type !== 'checkbox'
    if (e.key === '/' && !typing && !tool && view === 'drawers' && !e.altKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      document.getElementById(SEARCH_ID)?.focus()
      return
    }
    // in the quiz, 1, 2 and 3 pick the tools in the order they are shown
    const { round, at, picks, answer } = useToolbox.getState()
    const question = view === 'quiz' && !tool && round && at < round.length && picks.length <= at ? round[at] : null
    // Persian and Arabic keyboards type ۱ and ١ for 1
    const n = Number(normalize(e.key))
    if (question && !typing && n >= 1 && n <= question.choices.length && !e.altKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      const choice = question.choices[n - 1]
      answer(choice)
      if (choice === question.item.answer) playSuccess()
      else playClick(false)
      return
    }
    if (!tool || typing || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.metaKey || e.ctrlKey) return
    const forward = (e.key === 'ArrowRight') === (dir === 'ltr')
    const total = TOOL_IDS.length
    const index = TOOL_IDS.indexOf(tool)
    e.preventDefault()
    pick(TOOL_IDS[(index + (forward ? 1 : -1) + total) % total])
  }
}

/**
 * Opening the Toolbox focuses the panel itself, not its close button: a
 * focus ring would otherwise flash on the button on every open, and Tab
 * still walks in from the top.
 */
function focusPanel(event: Event) {
  event.preventDefault()
  ;(event.currentTarget as HTMLElement | null)?.focus({ preventScroll: true })
}

/** Escape steps back one level at a time: a tool's page, then the quiz or kit, then the search, then the box. */
function onEscape(e: globalThis.KeyboardEvent) {
  const { tool, view, query, pick, go, setQuery } = useToolbox.getState()
  if (tool) pick(null)
  else if (view !== 'drawers') go('drawers')
  else if (query) setQuery('')
  else return
  e.preventDefault()
}

export default function Toolbox() {
  const open = useToolbox((s) => s.open)
  const setOpen = useToolbox((s) => s.setOpen)
  const wide = useWide()
  const onKeyDown = useKeys()

  if (wide) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          onOpenAutoFocus={focusPanel}
          onKeyDown={onKeyDown}
          onEscapeKeyDown={onEscape}
          className="flex h-[min(48rem,calc(100dvh-3rem))] flex-col gap-0 overflow-hidden p-0 outline-none sm:max-w-[min(64rem,calc(100%-3rem))]"
        >
          <Header />
          <Body />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        onOpenAutoFocus={focusPanel}
        onKeyDown={onKeyDown}
        onEscapeKeyDown={onEscape}
        className="gap-0 overflow-hidden rounded-t-xl p-0 outline-none data-[side=bottom]:h-[92dvh]"
      >
        <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/25" />
        <Header />
        <Body />
      </SheetContent>
    </Sheet>
  )
}
