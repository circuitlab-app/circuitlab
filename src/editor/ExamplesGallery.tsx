import { LayoutGrid, Search, SearchX, X } from 'lucide-react'
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { BookOpen } from '@/components/animate-ui/icons/book-open'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import {
  PRESET_CATEGORIES,
  PRESET_INFO,
  PRESET_ORDER,
  type PresetCategory,
  type PresetId,
  type PresetLevel,
} from '@/circuit/presets'
import type { LedColor, PartType } from '@/circuit/types'
import { DICTIONARIES, useI18n, type Dictionary } from '@/i18n'
import { foldSearch } from '@/lib/fold'
import { cn } from '@/lib/utils'
import { PartArt } from './PartArt'

/*
 * The examples gallery: every ready-made project on shelves, each a card
 * with a little picture of its main parts, its name, one line about it and
 * how hard it is. A search box and an Easy / Medium / Hard filter narrow the
 * shelves down. A dialog on wide screens, a bottom sheet on phones.
 */

type Shelf = 'all' | PresetCategory
type LevelChoice = 'any' | PresetLevel

/** Each shelf's colour and the part drawn on its tab: the accents the parts themselves use. */
const SHELVES: Record<PresetCategory, { accent: string; art: PartType }> = {
  first: { accent: '#f59e0b', art: 'lamp' },
  electronics: { accent: '#65a30d', art: 'transistor' },
  science: { accent: '#059669', art: 'oscilloscope' },
  logic: { accent: '#ea580c', art: 'andGate' },
  boards: { accent: '#0e9aa7', art: 'arduino' },
  smart: { accent: '#9333ea', art: 'pir' },
  sound: { accent: '#0284c7', art: 'speaker' },
  motion: { accent: '#4f46e5', art: 'servo' },
  home: { accent: '#a16207', art: 'rgbLed' },
  games: { accent: '#c026d3', art: 'button' },
  ai: { accent: '#6d5bd0', art: 'aiBoard' },
  screens: { accent: '#db2777', art: 'segment' },
  iot: { accent: '#2563eb', art: 'wifi' },
  car: { accent: '#dc2626', art: 'ecu' },
  factory: { accent: '#0d9488', art: 'plc' },
  oil: { accent: '#ea580c', art: 'rtu' },
}

/** The LED drawing is red; these filters turn it into the other colours. */
const LED_TINTS: Partial<Record<LedColor, string>> = {
  yellow: 'hue-rotate(62deg) saturate(1.5) brightness(1.3)',
  green: 'hue-rotate(115deg) saturate(0.9)',
  blue: 'hue-rotate(215deg) saturate(1.1)',
  white: 'saturate(0) brightness(1.5)',
}

const LEVEL_BARS: Record<PresetLevel, string> = { 1: 'bg-emerald-500', 2: 'bg-amber-500', 3: 'bg-rose-500' }
const LEVELS: readonly PresetLevel[] = [1, 2, 3]

const accentStyle = (category: PresetCategory) => ({ '--shelf': SHELVES[category].accent }) as CSSProperties

const WIDE_QUERY = '(min-width: 768px)'

function useWideScreen() {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(WIDE_QUERY)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true,
  )
}

/* ---- search ---- */

/** Everything a child might type to find an example: its name, its words, its shelf and its parts, in their language and in English. */
function searchText(id: PresetId, t: Dictionary) {
  const en = DICTIONARIES.en
  const { category, art } = PRESET_INFO[id]
  const parts = art.map((item) => (item.startsWith('led:') ? 'led' : item) as PartType)
  return foldSearch(
    [
      t.presets[id].name,
      t.presets[id].description,
      t.gallery.categories[category].name,
      ...parts.map((p) => t.parts[p].name),
      en.presets[id].name,
      en.presets[id].description,
      ...parts.map((p) => en.parts[p].name),
    ].join(' '),
  )
}

/** The examples that match every word typed and the level picked, in gallery order. */
function useMatches(query: string, level: LevelChoice): readonly PresetId[] {
  const { t } = useI18n()
  const index = useMemo(() => new Map(PRESET_ORDER.map((id) => [id, searchText(id, t)])), [t])
  return useMemo(() => {
    const words = foldSearch(query).split(/\s+/).filter(Boolean)
    return PRESET_ORDER.filter(
      (id) =>
        (level === 'any' || PRESET_INFO[id].level === level) && words.every((word) => index.get(id)!.includes(word)),
    )
  }, [index, query, level])
}

/* ---- cards ---- */

/** Three little bars, like a signal meter: one for easy, three for hard. */
function LevelBars({ level, className }: { level: PresetLevel; className?: string }) {
  return (
    <span aria-hidden className={cn('flex h-2.5 shrink-0 items-end gap-[2px]', className)}>
      {LEVELS.map((bar) => (
        <span
          key={bar}
          className={cn('w-[3px] rounded-[1px]', bar <= level ? LEVEL_BARS[level] : 'bg-foreground/15')}
          style={{ height: 3 + bar * 2.5 }}
        />
      ))}
    </span>
  )
}

function LevelMark({ level }: { level: PresetLevel }) {
  const { t } = useI18n()
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] leading-none font-medium text-muted-foreground">
      <LevelBars level={level} />
      {t.gallery.levels[level]}
    </span>
  )
}

/**
 * The example's picture: its main parts side by side on a strip of
 * breadboard, joined by short wires (red leaves the first part, the dark one
 * comes back from the last). Pictures read left to right in every language.
 */
function Thumb({ id }: { id: PresetId }) {
  const { art } = PRESET_INFO[id]
  const count = art.length
  const size = count === 2 ? 50 : count === 3 ? 44 : 38
  const center = (i: number) => ((i + 0.5) / count) * 100
  const gaps = count - 1
  const wire = (i: number) =>
    gaps === 1 || i === 0 ? 'stroke-red-500' : i === gaps - 1 ? 'stroke-zinc-700 dark:stroke-zinc-400' : 'stroke-yellow-400'
  return (
    <div className="example-thumb" dir="ltr" aria-hidden>
      <div className="absolute inset-x-2 inset-y-0">
        <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          {Array.from({ length: gaps }, (_, i) => (
            <path
              key={i}
              d={`M${center(i)} 60 C${center(i) + 6} 84 ${center(i + 1) - 6} 84 ${center(i + 1)} 60`}
              className={cn('fill-none', wire(i))}
              strokeWidth={2.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {/* two parts: the black wire runs back under the red one */}
          {gaps === 1 && (
            <path
              d={`M${center(0)} 66 C${center(0) + 8} 96 ${center(1) - 8} 96 ${center(1)} 66`}
              className="fill-none stroke-zinc-700 dark:stroke-zinc-400"
              strokeWidth={2.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        <div className="relative grid h-full items-center" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
          {art.map((item, i) => (
            <span key={i} className="grid place-items-center" style={{ '--art': `${size}px` } as CSSProperties}>
              <PartArt
                partType={item.startsWith('led:') ? 'led' : (item as PartType)}
                size={size}
                style={{ filter: LED_TINTS[item.slice(4) as LedColor] }}
                className="size-(--art) transition-transform duration-300 ease-out group-hover:-translate-y-1 max-sm:size-[calc(var(--art)*0.86)]"
              />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ExampleCard({ id, onPick }: { id: PresetId; onPick: (id: PresetId) => void }) {
  const { t } = useI18n()
  const { category, level } = PRESET_INFO[id]
  return (
    <button type="button" className="example-card group" style={accentStyle(category)} onClick={() => onPick(id)}>
      <Thumb id={id} />
      <span className="flex min-w-0 flex-1 flex-col gap-1 px-3 pt-2.5 pb-3 max-sm:px-2.5 max-sm:pt-2 max-sm:pb-2.5">
        <span className="text-[13.5px] leading-snug font-semibold text-foreground max-sm:text-[13px]">{t.presets[id].name}</span>
        <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{t.presets[id].description}</span>
        <span className="mt-auto pt-1.5">
          <LevelMark level={level} />
        </span>
      </span>
    </button>
  )
}

function ShelfSection({
  shelf,
  ids,
  onPick,
}: {
  shelf: PresetCategory
  ids: readonly PresetId[]
  onPick: (id: PresetId) => void
}) {
  const { t } = useI18n()
  return (
    <section aria-labelledby={`shelf-${shelf}`} className="space-y-3">
      <header className="flex items-start gap-2.5">
        <span aria-hidden className="mt-1 h-3.5 w-1 shrink-0 rounded-[1px]" style={{ background: SHELVES[shelf].accent }} />
        <div className="min-w-0">
          <h3 id={`shelf-${shelf}`} className="text-sm font-semibold">
            {t.gallery.categories[shelf].name}
            <span className="ms-2 text-xs font-normal text-muted-foreground tabular-nums">{ids.length}</span>
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.gallery.categories[shelf].blurb}</p>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
        {ids.map((id) => (
          <ExampleCard key={id} id={id} onPick={onPick} />
        ))}
      </div>
    </section>
  )
}

/* ---- the shelves, the search box and the level filter ---- */

/** A shelf's tab: the part drawn on it, its name and how many examples it holds. */
function ShelfIcon({ shelf }: { shelf: Shelf }) {
  return shelf === 'all' ? (
    <LayoutGrid className="size-4 text-muted-foreground" />
  ) : (
    <PartArt partType={SHELVES[shelf].art} size={24} />
  )
}

function ShelfTabs({
  shelf,
  onShelf,
  counts,
  total,
  compact,
}: {
  shelf: Shelf
  onShelf: (shelf: Shelf) => void
  counts: Record<PresetCategory, number>
  total: number
  compact: boolean
}) {
  const { t } = useI18n()
  const shelves: Shelf[] = ['all', ...PRESET_CATEGORIES]
  const strip = useRef<HTMLElement>(null)
  // on phones the picked chip scrolls into view, so it is never hidden past the edge
  useEffect(() => {
    if (!compact) return
    strip.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [shelf, compact])
  return (
    <nav
      ref={strip}
      aria-label={t.gallery.shelves}
      className={
        compact
          ? '-mx-4 flex snap-x scroll-px-4 gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          : 'flex flex-col gap-0.5'
      }
    >
      {shelves.map((s) => {
        const name = s === 'all' ? t.gallery.all : compact ? t.gallery.categories[s].short : t.gallery.categories[s].name
        const count = s === 'all' ? total : counts[s]
        return (
          <button
            key={s}
            type="button"
            aria-pressed={shelf === s}
            onClick={() => onShelf(s)}
            style={s === 'all' ? undefined : accentStyle(s)}
            className={cn(
              'shelf-tab',
              compact ? 'shelf-tab--chip shrink-0 snap-start pe-2.5' : 'shelf-tab--rail',
              count === 0 && 'opacity-45',
            )}
          >
            <span aria-hidden className="shelf-tab__icon">
              <ShelfIcon shelf={s} />
            </span>
            <span className={cn(compact ? 'whitespace-nowrap' : 'min-w-0 flex-1 truncate')}>{name}</span>
            <span className={cn('text-xs text-muted-foreground tabular-nums', compact && 'text-[11px]')}>{count}</span>
          </button>
        )
      })}
    </nav>
  )
}

/** A bordered, filled search field that stands out from the panel behind it. Escape clears it. */
function GallerySearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useI18n()
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="group relative min-w-0 flex-1">
      <Search
        aria-hidden
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
      />
      <input
        ref={input}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // the first Escape clears the words; the next one closes the gallery
          if (e.key === 'Escape' && value) {
            e.stopPropagation()
            onChange('')
          }
        }}
        placeholder={t.gallery.search}
        aria-label={t.gallery.searchLabel}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        className={cn(
          'h-10 w-full rounded-md border border-foreground/20 bg-muted ps-9 pe-10 text-sm text-foreground outline-none',
          'shadow-[inset_0_1px_2px_oklch(0_0_0/0.06)] transition-[background-color,border-color,box-shadow]',
          'placeholder:text-muted-foreground hover:border-foreground/30',
          'focus-visible:border-primary focus-visible:bg-card focus-visible:shadow-none focus-visible:ring-4 focus-visible:ring-primary/15',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {value && (
        <button
          type="button"
          aria-label={t.gallery.clearSearch}
          onClick={() => {
            onChange('')
            input.current?.focus()
          }}
          className="absolute end-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

/** All levels, Easy, Medium, Hard: a segmented control with the same bars the cards wear. */
function LevelFilter({ level, onLevel, compact }: { level: LevelChoice; onLevel: (level: LevelChoice) => void; compact: boolean }) {
  const { t } = useI18n()
  const choices: LevelChoice[] = ['any', ...LEVELS]
  return (
    <div
      role="radiogroup"
      aria-label={t.gallery.levelFilter}
      // on phones "All levels" gets a little more room than the three short words
      className={cn(
        'grid shrink-0 gap-0.5 rounded-md border bg-muted p-0.5',
        compact ? 'h-9 w-full grid-cols-[1.4fr_1fr_1fr_1fr]' : 'h-10 grid-cols-4',
      )}
    >
      {choices.map((choice) => (
        <button
          key={choice}
          type="button"
          role="radio"
          aria-checked={level === choice}
          onClick={() => onLevel(choice)}
          className={cn(
            'flex min-w-0 items-center justify-center gap-1.5 rounded-[5px] px-2 text-xs font-medium whitespace-nowrap transition',
            'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            level === choice
              ? 'bg-card text-foreground shadow-sm ring-1 ring-foreground/10'
              : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
          )}
        >
          {choice !== 'any' && <LevelBars level={choice} />}
          <span className="truncate">{choice === 'any' ? t.gallery.anyLevel : t.gallery.levels[choice]}</span>
        </button>
      ))}
    </div>
  )
}

function NoMatches({ onReset }: { onReset: () => void }) {
  const { t } = useI18n()
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <span aria-hidden className="mb-3 grid size-11 place-items-center rounded-md bg-muted text-muted-foreground">
        <SearchX className="size-5" />
      </span>
      <p className="text-sm font-semibold">{t.gallery.noResults}</p>
      <p className="mt-1 max-w-64 text-xs leading-relaxed text-muted-foreground">{t.gallery.noResultsHint}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onReset}>
        {t.gallery.showAll}
      </Button>
    </div>
  )
}

/** What the gallery is showing: kept above both of its looks, so it survives a switch between them. */
type View = { shelf: Shelf; query: string; level: LevelChoice }
const FRESH_VIEW: View = { shelf: 'all', query: '', level: 'any' }

function GalleryBody({
  compact,
  onPick,
  view,
  onView,
  Title,
  Description,
}: {
  compact: boolean
  onPick: (id: PresetId) => void
  view: View
  onView: (change: (view: View) => View) => void
  Title: ComponentType<{ className?: string; children: ReactNode }>
  Description: ComponentType<{ className?: string; children: ReactNode }>
}) {
  const { t } = useI18n()
  const { shelf, query, level } = view
  const setShelf = (next: Shelf) => onView((v) => ({ ...v, shelf: next }))
  const setLevel = (next: LevelChoice) => onView((v) => ({ ...v, level: next }))
  // typing stays quick while the cards catch up
  const matches = useMatches(useDeferredValue(query), level)
  const filtering = query.trim() !== '' || level !== 'any'

  const list = useRef<HTMLDivElement>(null)
  // a new shelf, new words or a new level start the list at its top (scrollTo may return a promise, so nothing is returned)
  useEffect(() => {
    list.current?.scrollTo({ top: 0 })
  }, [shelf, query, level])

  const counts = useMemo(() => {
    const out = Object.fromEntries(PRESET_CATEGORIES.map((c) => [c, 0])) as Record<PresetCategory, number>
    for (const id of matches) out[PRESET_INFO[id].category]++
    return out
  }, [matches])
  const shown = (shelf === 'all' ? PRESET_CATEGORIES : [shelf]).filter((s) => counts[s] > 0)

  // a new search looks through every shelf
  const search = (value: string) =>
    onView((v) => ({ ...v, query: value, shelf: !v.query.trim() && value.trim() ? 'all' : v.shelf }))
  const reset = () => onView(() => FRESH_VIEW)

  const heading = (
    <div className="flex min-w-0 items-center gap-3">
      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <BookOpen size={18} />
      </span>
      <div className="min-w-0">
        <Title className="text-base leading-tight font-semibold">{t.gallery.title}</Title>
        <Description className="mt-0.5 text-xs leading-snug text-pretty">{t.gallery.description(PRESET_ORDER.length)}</Description>
      </div>
    </div>
  )

  const sections = (
    <div ref={list} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {shown.length === 0 ? (
        <NoMatches onReset={reset} />
      ) : (
        <div className={compact ? 'px-4 pt-3 pb-6' : 'p-5'}>
          {filtering && (
            <p role="status" className="mb-3 text-xs font-medium text-muted-foreground tabular-nums">
              {t.gallery.found(shown.reduce((sum, s) => sum + counts[s], 0))}
            </p>
          )}
          <div className="space-y-7">
            {shown.map((s) => (
              <ShelfSection key={s} shelf={s} ids={matches.filter((id) => PRESET_INFO[id].category === s)} onPick={onPick} />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const tabs = <ShelfTabs shelf={shelf} onShelf={setShelf} counts={counts} total={matches.length} compact={compact} />

  if (compact) {
    return (
      <>
        <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/25" />
        <div className="space-y-3 border-b px-4 pt-2 pb-3">
          <div className="pe-8">{heading}</div>
          <GallerySearch value={query} onChange={search} />
          <LevelFilter level={level} onLevel={setLevel} compact />
          {tabs}
        </div>
        <div className="pb-safe flex min-h-0 flex-1 flex-col">{sections}</div>
      </>
    )
  }

  return (
    <>
      <div className="border-b px-5 py-3.5 pe-14">{heading}</div>
      <div className="flex items-center gap-3 border-b bg-sidebar px-5 py-3">
        <div className="flex max-w-md min-w-0 flex-1">
          <GallerySearch value={query} onChange={search} />
        </div>
        <LevelFilter level={level} onLevel={setLevel} compact={false} />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-56 shrink-0 overflow-y-auto border-e bg-sidebar p-2.5">{tabs}</div>
        {sections}
      </div>
    </>
  )
}

/**
 * Opening the gallery focuses the panel itself, not its first tab: no focus
 * ring flashes up on a mouse click, and Tab still walks in from the top.
 */
function focusPanel(event: Event) {
  event.preventDefault()
  ;(event.currentTarget as HTMLElement | null)?.focus({ preventScroll: true })
}

/**
 * The "Examples" button and the gallery it opens. Picking an example calls
 * `onPick`; the top bar decides whether to ask before replacing the board.
 *
 * One dialog root holds both looks: only its panel changes between the
 * centred dialog and the bottom sheet, so turning a tablet or resizing the
 * window across 768 px keeps the gallery open.
 */
export function ExamplesGallery({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (id: PresetId) => void
}) {
  const { t } = useI18n()
  const wide = useWideScreen()
  const [view, setView] = useState<View>(FRESH_VIEW)
  const body = { onPick, view, onView: setView }

  return (
    <>
      <Button
        variant="ghost"
        size="lg"
        className="gap-2 px-2.5 font-medium"
        aria-label={t.toolbar.examples}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          // every visit starts fresh: all shelves, no words, every level
          setView(FRESH_VIEW)
          onOpenChange(true)
        }}
      >
        <BookOpen size={18} animateOnHover />
        <span className="max-sm:hidden">{t.toolbar.examples}</span>
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        {wide ? (
          <DialogContent
            key="dialog"
            className="flex h-[min(46rem,calc(100dvh-3rem))] w-[min(62rem,calc(100vw-3rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
            onOpenAutoFocus={focusPanel}
          >
            <GalleryBody compact={false} {...body} Title={DialogTitle} Description={DialogDescription} />
          </DialogContent>
        ) : (
          <SheetContent
            key="sheet"
            side="bottom"
            className="gap-0 rounded-t-xl p-0 outline-none data-[side=bottom]:h-[90dvh]"
            onOpenAutoFocus={focusPanel}
          >
            <GalleryBody compact {...body} Title={SheetTitle} Description={SheetDescription} />
          </SheetContent>
        )}
      </Dialog>
    </>
  )
}
