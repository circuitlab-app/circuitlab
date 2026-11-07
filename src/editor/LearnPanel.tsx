import { Gauge, Lightbulb, Sparkles, Waves, Zap } from 'lucide-react'
import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { PartResult } from '@/circuit/solver'
import type { PartType } from '@/circuit/types'
import { useI18n, type Lang } from '@/i18n'
import type { LearnBook } from '@/i18n/learn/types'
import { cn } from '@/lib/utils'
import { useSettings } from '@/store/settings'

/*
 * The lessons are long (three languages, every part), so they are not part of
 * the app's first download: only the current language's book is fetched, the
 * first time the app is idle, so it is ready before anyone opens a part.
 */
const LOADERS: Record<Lang, () => Promise<LearnBook>> = {
  en: () => import('@/i18n/learn/en').then((m) => m.enLearn),
  fa: () => import('@/i18n/learn/fa').then((m) => m.faLearn),
  ar: () => import('@/i18n/learn/ar').then((m) => m.arLearn),
}
const books: Partial<Record<Lang, LearnBook>> = {}
const loading = new Set<Lang>()
const listeners = new Set<() => void>()

function loadBook(lang: Lang) {
  if (books[lang] || loading.has(lang)) return
  loading.add(lang)
  LOADERS[lang]().then(
    (book) => {
      books[lang] = book
      listeners.forEach((notify) => notify())
    },
    // a failed download (offline) is tried again next time
    () => loading.delete(lang),
  )
}

const subscribe = (notify: () => void) => {
  listeners.add(notify)
  return () => listeners.delete(notify)
}

/** The lessons in the current language, or undefined for the moment they take to load. */
function useBook(): LearnBook | undefined {
  const { lang } = useI18n()
  const book = useSyncExternalStore(subscribe, () => books[lang])
  useEffect(() => loadBook(lang), [lang])
  return book
}

if (typeof window !== 'undefined') {
  const preload = () => loadBook(useSettings.getState().lang)
  // older Safari has no requestIdleCallback
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(preload)
  else setTimeout(preload, 1500)
}

const fmtVolts = (v: number) => `${Math.abs(v).toFixed(2)} V`
const fmtAmps = (a: number) => (Math.abs(a) < 1 ? `${Math.round(Math.abs(a) * 1000)} mA` : `${Math.abs(a).toFixed(2)} A`)
const fmtOhms = (r: number) => (r >= 1000 ? `${(r / 1000).toFixed(1)} kΩ` : `${Math.round(r)} Ω`)
const fmtWatts = (w: number) => `${Math.abs(w).toFixed(2)} W`

/** The part's own numbers, when something is really flowing through it. */
function liveNumbers(result?: PartResult) {
  if (!result) return null
  const volts = Math.abs(result.voltage)
  const amps = Math.abs(result.current)
  if (amps < 5e-4 && volts < 0.05) return null
  // ohms only mean something for a part that resists, not for a source pushing the current
  const ohms = amps > 5e-4 && volts > 0.01 ? volts / amps : null
  return { volts, amps, ohms, watts: Math.abs(result.power) }
}

function Callout({
  icon,
  title,
  tone,
  children,
}: {
  icon: ReactNode
  title: string
  tone: 'amber' | 'violet' | 'sky'
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex gap-2.5 rounded-xl border p-3 text-sm leading-relaxed',
        tone === 'amber' && 'border-amber-500/25 bg-amber-500/8',
        tone === 'violet' && 'border-violet-500/25 bg-violet-500/8',
        tone === 'sky' && 'border-sky-500/25 bg-sky-500/8',
      )}
    >
      <span
        className={cn(
          'mt-0.5 shrink-0 [&_svg]:size-4',
          tone === 'amber' && 'text-amber-600 dark:text-amber-400',
          tone === 'violet' && 'text-violet-600 dark:text-violet-400',
          tone === 'sky' && 'text-sky-600 dark:text-sky-400',
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-pretty">{children}</p>
      </div>
    </div>
  )
}

/** What this part is and how it works, in words a child can follow. */
export function PartLesson({ type, result }: { type: PartType; result?: PartResult }) {
  const { t } = useI18n()
  const book = useBook()
  const lesson = book?.parts[type]
  const live = liveNumbers(result)
  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-xl bg-muted/60 p-3 text-sm leading-relaxed">
        {(lesson?.about ?? [t.parts[type].description]).map((sentence, i) => (
          <p key={i} className="text-pretty">
            {sentence}
          </p>
        ))}
      </div>
      {book && lesson && (
        <Callout icon={<Lightbulb />} title={book.labels.like} tone="amber">
          {lesson.like}
        </Callout>
      )}
      {book && lesson && (
        <Callout icon={<Sparkles />} title={book.labels.fact} tone="violet">
          {lesson.fact}
        </Callout>
      )}
      {book && live && (
        <Callout icon={<Zap />} title={book.labels.nowTitle} tone="sky">
          {book.now(fmtVolts(live.volts), fmtAmps(live.amps), live.ohms === null ? null : fmtOhms(live.ohms), fmtWatts(live.watts))}
        </Callout>
      )}
    </div>
  )
}

/** Colours for the numbers 0 … 9, the same ones the resistor model and drawing use. */
const DIGIT_COLORS = ['#1c1917', '#7c3f12', '#dc2626', '#f97316', '#facc15', '#16a34a', '#2563eb', '#7c3aed', '#9ca3af', '#fafafa']
const GOLD = '#d4a017'

/** 220 Ω → first 2, second 2, 1 zero. */
function splitOhms(ohms: number) {
  const zeros = Math.max(0, Math.floor(Math.log10(ohms)) - 1)
  const significant = Math.round(ohms / 10 ** zeros)
  return { first: Math.floor(significant / 10) % 10, second: significant % 10, zeros }
}

/** How to read a resistor's value from its coloured stripes, shown on this resistor's own value. */
export function ResistorColorCode({ ohms }: { ohms: number }) {
  const c = useBook()?.colorCode
  if (!c) return null
  const { first, second, zeros } = splitOhms(ohms)
  const stripes = [DIGIT_COLORS[first], DIGIT_COLORS[second], DIGIT_COLORS[zeros], GOLD]
  const answers = [
    `${c.colors[first]} → ${first}`,
    `${c.colors[second]} → ${second}`,
    `${c.colors[zeros]} → ${c.zeros(zeros)}`,
    c.gold,
  ]
  const value = ohms >= 1000 ? `${ohms / 1000} kΩ (${ohms} Ω)` : `${ohms} Ω`
  return (
    <div className="space-y-3 rounded-xl border bg-card p-3">
      <p className="text-sm font-semibold">{c.title}</p>
      <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{c.intro}</p>

      {/* this resistor, big, with the number each stripe stands for */}
      <svg viewBox="0 0 240 78" className="w-full" style={{ direction: 'ltr' }} role="img" aria-label={value}>
        <defs>
          <linearGradient id="cc-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6e7c6" />
            <stop offset="1" stopColor="#cfae7c" />
          </linearGradient>
          <clipPath id="cc-clip">
            <rect x="52" y="14" width="136" height="38" rx="19" />
          </clipPath>
        </defs>
        <path d="M6 33h228" stroke="#a1a1aa" strokeWidth="3" strokeLinecap="round" />
        <rect x="52" y="14" width="136" height="38" rx="19" fill="url(#cc-body)" />
        <g clipPath="url(#cc-clip)">
          {[74, 98, 122].map((x, i) => (
            <rect key={x} x={x} y="14" width="13" height="38" fill={stripes[i]} stroke="#00000022" />
          ))}
          <rect x="160" y="14" width="10" height="38" fill={GOLD} />
        </g>
        <rect x="58" y="19" width="124" height="5" rx="2.5" fill="#fff" opacity="0.4" />
        {[`${first}`, `${second}`, `+${'0'.repeat(zeros) || '·'}`, '±5%'].map((label, i) => (
          <text
            key={i}
            x={[80.5, 104.5, 128.5, 165][i]}
            y="70"
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="currentColor"
            className="text-muted-foreground"
          >
            {label}
          </text>
        ))}
      </svg>

      <ol className="space-y-1.5">
        {c.bands.map((label, i) => (
          <li key={label} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden
              className="size-5 shrink-0 rounded-md shadow-[inset_0_0_0_1px_oklch(0_0_0/0.15)]"
              style={{ background: stripes[i] }}
            />
            <span className="min-w-0 flex-1 text-muted-foreground">{label}</span>
            <span className="shrink-0 font-semibold">{answers[i]}</span>
          </li>
        ))}
      </ol>

      <p className="rounded-lg bg-primary/8 px-3 py-2 text-sm font-semibold">{c.result(first, second, zeros, value)}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{c.tolerance}</p>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground">{c.chartTitle}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {c.colors.map((name, digit) => (
            <div key={name} className="flex items-center gap-2 rounded-lg border px-2 py-1 text-xs">
              <span
                aria-hidden
                className="size-4 shrink-0 rounded shadow-[inset_0_0_0_1px_oklch(0_0_0/0.15)]"
                style={{ background: DIGIT_COLORS[digit] }}
              />
              <span className="w-3 font-semibold tabular-nums">{digit}</span>
              <span className="min-w-0 truncate">{name}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{c.tip}</p>
    </div>
  )
}

/** One idea: volts, amps, ohms or watts. */
function Idea({
  symbol,
  name,
  unit,
  color,
  children,
}: {
  symbol: ReactNode
  name: string
  unit: string
  color: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-3 rounded-xl border bg-card p-3">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold text-white shadow-sm [&_svg]:size-4"
        style={{ background: color }}
      >
        {symbol}
      </span>
      <div className="min-w-0 space-y-0.5 text-sm leading-relaxed">
        <p className="font-semibold">
          {name} <span className="font-normal text-muted-foreground">({unit})</span>
        </p>
        <p className="text-pretty text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}

const PUSH = '#f59e0b'
const FLOW = '#0ea5e9'
const PATH = '#a16207'
const WORK = '#ef4444'

/** One cell of the V = A × Ω line, with the part's live value under it. */
function Term({ letter, color, value }: { letter: string; color: string; value?: string }) {
  return (
    <span className="flex min-w-0 flex-col items-center gap-1">
      <span
        className="grid size-10 place-items-center rounded-xl text-lg font-bold text-white shadow-sm"
        style={{ background: color }}
      >
        {letter}
      </span>
      <span className="font-mono text-[11px] font-semibold text-muted-foreground tabular-nums">{value ?? '—'}</span>
    </span>
  )
}

/** Volts, amps, ohms, watts and how they fit together, filled with this part's own numbers. */
export function BasicsLesson({ result }: { result?: PartResult }) {
  const book = useBook()
  const live = liveNumbers(result)
  if (!book) return null
  const b = book.basics
  return (
    <Accordion type="single" collapsible className="rounded-xl border bg-card/50 px-3">
      <AccordionItem value="basics" className="border-0">
        <AccordionTrigger className="py-3 text-sm font-semibold">{b.title}</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-3">
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{b.intro}</p>
          <Idea symbol="V" name={b.voltage.name} unit={b.voltage.unit} color={PUSH}>
            {b.voltage.text}
          </Idea>
          <Idea symbol={<Waves />} name={b.current.name} unit={b.current.unit} color={FLOW}>
            {b.current.text}
          </Idea>
          <Idea symbol="Ω" name={b.resistance.name} unit={b.resistance.unit} color={PATH}>
            {b.resistance.text}
          </Idea>
          <Idea symbol={<Gauge />} name={b.power.name} unit={b.power.unit} color={WORK}>
            {b.power.text}
          </Idea>

          {/* the law, drawn as a little equation with this part's numbers under it */}
          <div className="space-y-4 rounded-xl border border-primary/25 bg-primary/5 p-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">{b.law.title}</p>
              <p className="text-sm leading-relaxed text-pretty">{b.law.idea}</p>
            </div>

            <div dir="ltr" className="flex items-start justify-center gap-2 text-lg font-bold">
              <Term letter="V" color={PUSH} value={live ? fmtVolts(live.volts) : undefined} />
              <span className="pt-2">=</span>
              <Term letter="A" color={FLOW} value={live ? fmtAmps(live.amps) : undefined} />
              <span className="pt-2">×</span>
              <Term letter="Ω" color={PATH} value={live?.ohms != null ? fmtOhms(live.ohms) : undefined} />
            </div>

            {/* the same rule written three ways; the maths always reads left to right */}
            <div className="space-y-1.5">
              {b.law.formulas.map((f) => (
                <div
                  key={f.math}
                  className="flex items-center justify-between gap-3 rounded-lg bg-card px-3 py-2 shadow-[var(--shadow-card)]"
                >
                  <bdi dir="ltr" className="shrink-0 font-mono text-sm font-bold tabular-nums">
                    {f.math}
                  </bdi>
                  <span className="min-w-0 text-xs text-muted-foreground">{f.say}</span>
                </div>
              ))}
            </div>

            <ul className="space-y-1.5">
              {b.law.rules.map((rule) => (
                <li key={rule} className="flex gap-2 text-sm leading-relaxed">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">{b.law.exampleTitle}</p>
              <ol className="space-y-1.5">
                {b.law.steps.map((step, i) => (
                  <li key={step.math} className="flex items-center gap-2.5 rounded-lg border bg-card px-2.5 py-2">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-bold text-primary tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm">{step.say}</p>
                      <p className="font-mono text-xs font-semibold text-muted-foreground tabular-nums">
                        <bdi dir="ltr">{step.math}</bdi>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <ul className="space-y-1 rounded-xl bg-muted/60 p-3 text-sm">
            {b.units.map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
