import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PARTS, PART_ORDER, type PartCategory } from '@/circuit/catalog'
import type { PartType } from '@/circuit/types'
import { useI18n } from '@/i18n'
import { en } from '@/i18n/en'
import { foldSearch } from '@/lib/fold'
import { cn } from '@/lib/utils'
import { useDrag } from '@/store/drag'
import { usePlacePart } from './DragGhost'
import { PartArt } from './PartArt'

const CATEGORIES: PartCategory[] = [
  'power',
  'board',
  'control',
  'component',
  'logic',
  'output',
  'display',
  'sensor',
  'meter',
]

const tileClass = cn(
  'group relative flex w-full flex-col items-center gap-1 rounded-xl border border-transparent bg-muted/60 px-1.5 pt-2.5 pb-2 text-center select-none',
  'transition-[background-color,border-color,box-shadow] duration-200',
  'hover:border-border hover:bg-card hover:shadow-[var(--shadow-card)]',
  'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
)

/** A part in the desktop tray: drag it onto the board, or press it to drop it in the middle. */
function DragTile({ type }: { type: PartType }) {
  const { t, dir } = useI18n()
  const startDrag = useDrag((s) => s.start)
  const dragging = useDrag((s) => s.type === type)
  const { placeCenter } = usePlacePart()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(tileClass, 'cursor-grab touch-none active:cursor-grabbing', dragging && 'opacity-40')}
          onPointerDown={(e) => {
            if (e.button !== 0) return
            e.preventDefault()
            startDrag(type, e.clientX, e.clientY)
          }}
          // keyboard activation (Enter / Space) has no pointer, so it lands in the middle of the board
          onClick={(e) => e.detail === 0 && placeCenter(type)}
        >
          <PartArt
            partType={type}
            size={46}
            className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105"
          />
          {/* long names wrap onto a second line instead of being cut short */}
          <span className="line-clamp-2 w-full text-[12.5px] leading-tight font-semibold text-balance">{t.parts[type].name}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side={dir === 'rtl' ? 'left' : 'right'} className="max-w-56 leading-snug">
        {t.parts[type].description}
      </TooltipContent>
    </Tooltip>
  )
}

/** A part in the phone tray: tap it to add it to the board. */
function TapTile({ type, onPicked }: { type: PartType; onPicked: () => void }) {
  const { t } = useI18n()
  const { placeCenter } = usePlacePart()
  return (
    <button
      type="button"
      className={cn(tileClass, 'min-h-24 active:scale-[0.97]')}
      onClick={() => {
        placeCenter(type)
        onPicked()
      }}
    >
      <PartArt partType={type} size={48} />
      <span className="line-clamp-2 w-full text-[13px] leading-tight font-semibold text-balance">{t.parts[type].name}</span>
    </button>
  )
}

function usePartGroups(query: string) {
  const { t } = useI18n()
  return useMemo(() => {
    // letter shapes and digits are folded, and the English name always matches too,
    // so "LED", «كليد» or «کلید» find the same parts in any language
    const q = foldSearch(query)
    const matches = PART_ORDER.filter((type) => {
      if (!q) return true
      const text = foldSearch(`${t.parts[type].name} ${t.parts[type].description} ${en.parts[type].name} ${type}`)
      return text.includes(q)
    })
    return CATEGORIES.map((category) => ({
      category,
      items: matches.filter((type) => PARTS[type].category === category),
    })).filter((g) => g.items.length > 0)
  }, [query, t])
}

/** A clear, filled search field. On desktop "/" jumps into it and Escape clears it. */
function PartSearch({ value, onChange, shortcut }: { value: string; onChange: (v: string) => void; shortcut: boolean }) {
  const { t } = useI18n()
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!shortcut) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const typing = el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shortcut])

  return (
    <div className="group relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-foreground/55 transition-colors group-focus-within:text-foreground"
      />
      <input
        ref={input}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onChange('')
            e.currentTarget.blur()
          }
        }}
        placeholder={t.sidebar.search}
        aria-label={t.sidebar.search}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          // a white field with a clear edge, so it never melts into the panel behind it
          'h-10 w-full rounded-md border border-foreground/20 bg-card ps-9 pe-10 text-sm text-foreground outline-none',
          'shadow-[0_1px_2px_oklch(0_0_0/0.07)] transition-[border-color,box-shadow]',
          'placeholder:text-muted-foreground hover:border-foreground/35',
          'focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/25',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {value ? (
        <button
          type="button"
          aria-label={t.confirm.clear}
          onClick={() => {
            onChange('')
            input.current?.focus()
          }}
          className="absolute end-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        shortcut && (
          <kbd
            aria-hidden
            className="pointer-events-none absolute end-2.5 top-1/2 grid h-5 min-w-5 -translate-y-1/2 place-items-center rounded-md border bg-card px-1 font-sans text-[11px] text-muted-foreground shadow-[0_1px_0_var(--border)] group-focus-within:hidden"
          >
            /
          </kbd>
        )
      )}
    </div>
  )
}

/** Every part, grouped like the drawers of a parts tray. */
export function PartTray({ mode, onPicked }: { mode: 'drag' | 'tap'; onPicked?: () => void }) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const groups = usePartGroups(query)

  return (
    <div className="space-y-4">
      {/* stays in view while the list scrolls under it; the room above keeps its focus ring
          from being cut off, and a soft fade below lets the tiles slide out of sight */}
      <div
        className={cn(
          'sticky top-0 z-10 -mx-4 px-4 pt-1.5 pb-1 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-3 after:bg-gradient-to-b after:to-transparent',
          // the same colour as the panel it sits in: the desktop sidebar or the phone's sheet
          mode === 'drag' ? 'bg-sidebar after:from-sidebar' : 'bg-popover after:from-popover',
        )}
      >
        <PartSearch value={query} onChange={setQuery} shortcut={mode === 'drag'} />
      </div>
      {groups.map(({ category, items }) => (
        <section key={category} className="space-y-2">
          <h3 className="px-0.5 text-xs font-semibold text-muted-foreground">{t.categories[category]}</h3>
          <div className={cn('grid gap-2', mode === 'drag' ? 'grid-cols-2' : 'grid-cols-3')}>
            {items.map((type) =>
              mode === 'drag' ? (
                <DragTile key={type} type={type} />
              ) : (
                <TapTile key={type} type={type} onPicked={() => onPicked?.()} />
              ),
            )}
          </div>
        </section>
      ))}
      {groups.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{t.sidebar.noResults}</p>}
    </div>
  )
}

export function PartsSidebar() {
  const { t } = useI18n()
  return (
    <aside className="relative z-10 flex w-64 shrink-0 flex-col border-e bg-sidebar max-md:hidden">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-sm font-semibold">{t.sidebar.title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{t.sidebar.hint}</p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-4 pb-5">
          <PartTray mode="drag" />
        </div>
      </ScrollArea>
    </aside>
  )
}
