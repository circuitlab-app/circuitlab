import { Phone, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { playTones } from '@/lib/sound'
import { downloadSeconds, GENERATIONS, type GenerationId } from './radio'
import { GEN_COLOR, useTelecomBook } from './ui'

/*
 * The guide: how a landline phone works (with a DTMF keypad you can hear),
 * the generations from 1G to 6G and how each one shares the air, what the
 * letters on a phone mean, how fast each generation is, and the words of
 * the trade.
 */

const ROWS = [697, 770, 852, 941]
const COLS = [1209, 1336, 1477, 1633]
const KEYS = ['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '*', '0', '#', 'D']

/** Telephone tones (the ITU's 425 Hz, used in Iran and most of Europe). */
const TONES = {
  dial: () => playTones([425], 2),
  busy: () => [0, 1, 2].forEach((i) => playTones([425], 0.5, i)),
  ringback: () => [0, 2.5].forEach((t) => playTones([425], 1, t)),
}

function Keypad() {
  const { book, digits } = useTelecomBook()
  const [last, setLast] = useState<{ key: string; low: number; high: number } | null>(null)
  const press = (index: number) => {
    const low = ROWS[Math.floor(index / 4)]
    const high = COLS[index % 4]
    playTones([low, high], 0.25)
    setLast({ key: KEYS[index], low, high })
  }
  return (
    <div className="space-y-2">
      <h3 className="text-[13px] font-semibold">{book.guide.phone.keypad}</h3>
      <p className="text-xs leading-snug text-muted-foreground">{book.guide.phone.keypadHint}</p>
      <div className="inline-grid grid-cols-[auto_repeat(4,2.75rem)] gap-1.5 font-mono" dir="ltr">
        <span />
        {COLS.map((f) => (
          <span key={f} className="text-center text-[10px] text-muted-foreground">
            {f}
          </span>
        ))}
        {ROWS.map((row, r) => (
          <div key={row} className="contents">
            <span className="self-center pe-1 text-end text-[10px] text-muted-foreground">{row}</span>
            {KEYS.slice(r * 4, r * 4 + 4).map((key, c) => (
              <button
                key={key}
                type="button"
                onClick={() => press(r * 4 + c)}
                className={cn(
                  'h-11 rounded-lg border bg-card text-lg font-semibold shadow-sm transition active:translate-y-px active:bg-muted',
                  last?.key === key && 'border-[var(--tel-accent)]',
                )}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className="h-5 font-mono text-sm" dir="ltr" aria-live="polite">
        {last ? digits(`${last.key} = ${last.low} Hz + ${last.high} Hz`) : ''}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(TONES) as (keyof typeof TONES)[]).map((tone) => (
          <button key={tone} type="button" onClick={TONES[tone]} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition hover:bg-muted">
            <Volume2 className="size-3.5" aria-hidden />
            {book.guide.phone.tones[tone]}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── how users share the air ───────────────────────── */

const USERS = ['#e59a0b', '#10a37a', '#3b7ff0', '#e0479e']
const COLS_T = 12
const ROWS_F = 8

/** Which user (0–3) holds frequency row `f` at time column `t`, or all at once for CDMA. */
function owner(method: string, f: number, t: number): number | 'all' {
  if (method === 'FDMA') return Math.floor(f / 2)
  if (method === 'TDMA') return t % 4
  if (method === 'CDMA') return 'all'
  // OFDMA: blocks of 2 subcarriers × 2 symbols handed out by the scheduler
  return (Math.floor(f / 2) * 3 + Math.floor(t / 2) * 5 + ((f >> 2) & t)) % 4
}

function AccessGrid({ method }: { method: 'FDMA' | 'TDMA' | 'CDMA' | 'OFDMA' }) {
  const [now, setNow] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setNow((n) => (n + 1) % COLS_T), 450)
    return () => window.clearInterval(timer)
  }, [])
  const cell = 18
  return (
    <svg viewBox={`0 0 ${COLS_T * cell + 22} ${ROWS_F * cell + 18}`} className="w-full max-w-[300px]" role="img" aria-label={method}>
      <text x={2} y={10} className="tel-scope__bits">
        f
      </text>
      <text x={COLS_T * cell + 12} y={ROWS_F * cell + 16} className="tel-scope__bits">
        t
      </text>
      {Array.from({ length: COLS_T }, (_, t) =>
        Array.from({ length: ROWS_F }, (_, f) => {
          const who = owner(method, f, t)
          const x = 14 + t * cell
          const y = 4 + f * cell
          if (who === 'all') {
            return USERS.map((color, u) => (
              <rect key={`${t}-${f}-${u}`} x={x + 1 + u * 4} y={y + 1} width={4} height={cell - 2} fill={color} opacity={t === now ? 0.95 : 0.45} />
            ))
          }
          return <rect key={`${t}-${f}`} x={x + 1} y={y + 1} width={cell - 2} height={cell - 2} rx={2} fill={USERS[who]} opacity={t === now ? 0.95 : 0.4} />
        }),
      )}
      <rect x={14 + now * cell} y={2} width={cell} height={ROWS_F * cell + 4} fill="none" stroke="currentColor" strokeWidth={1.5} rx={3} />
    </svg>
  )
}

/* ───────────────────────── the guide ───────────────────────── */

const SPEEDS: { icon: string; mbps: number; gen: keyof typeof GEN_COLOR }[] = [
  { icon: 'G', mbps: 0.04, gen: '2g' },
  { icon: 'E', mbps: 0.2, gen: '2g' },
  { icon: '3G', mbps: 0.38, gen: '3g' },
  { icon: 'H+', mbps: 21, gen: '3g' },
  { icon: '4G', mbps: 50, gen: '4g' },
  { icon: '4G+', mbps: 180, gen: '4g' },
  { icon: '5G', mbps: 450, gen: '5g' },
  { icon: '5G+', mbps: 1800, gen: '5g' },
]

export function Guide() {
  const { book, num, time, speed } = useTelecomBook()
  const [gen, setGen] = useState<GenerationId>('4g')
  const g = GENERATIONS.find((x) => x.id === gen)!
  const text = book.guide.gens[gen]
  const sections = book.guide.sections
  const logMax = Math.log10(2000 / 0.02)
  const barOf = (mbps: number) => `${(Math.log10(mbps / 0.02) / logMax) * 100}%`

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <nav className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b bg-background/95 px-3 py-2 backdrop-blur">
        {(Object.keys(sections) as (keyof typeof sections)[]).map((id) => (
          <a key={id} href={`#tel-${id}`} className="shrink-0 rounded-md px-2.5 py-1 text-[12.5px] font-medium hover:bg-muted" onClick={(e) => {
            e.preventDefault()
            document.getElementById(`tel-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}>
            {sections[id]}
          </a>
        ))}
      </nav>
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-6">
        <section id="tel-phone" className="scroll-mt-14 space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Phone className="size-5 text-[var(--tel-accent)]" aria-hidden />
            {sections.phone}
          </h2>
          <p className="text-[13.5px] leading-relaxed">{book.guide.phone.intro}</p>
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <ol className="grid gap-2 sm:grid-cols-2">
              {book.guide.phone.steps.map((step, i) => (
                <li key={i} className="rounded-xl border p-3">
                  <p className="text-[13px] font-semibold">
                    <span className="me-1.5 text-[var(--tel-accent)] tabular-nums">{num(i + 1)}.</span>
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
            <Keypad />
          </div>
        </section>

        <section id="tel-gens" className="scroll-mt-14 space-y-4">
          <h2 className="text-lg font-semibold">{sections.gens}</h2>
          <div className="flex gap-1 overflow-x-auto pb-1" dir="ltr" role="tablist">
            {GENERATIONS.map((x) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={x.id === gen}
                onClick={() => setGen(x.id)}
                className={cn('min-w-20 flex-1 rounded-xl border px-3 py-2 text-center transition', x.id === gen ? 'text-white' : 'hover:bg-muted')}
                style={x.id === gen ? { background: GEN_COLOR[x.id], borderColor: GEN_COLOR[x.id] } : { borderColor: `${GEN_COLOR[x.id]}66` }}
              >
                <span className="block text-base font-bold uppercase">{x.id}</span>
                <span className="block text-[11px] opacity-80">{num(x.year)}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-5 rounded-2xl border p-4 md:grid-cols-[1fr_300px]">
            <div className="space-y-3">
              <h3 className="text-base font-semibold" style={{ color: GEN_COLOR[gen] }}>
                {text.name}
              </h3>
              <p className="text-[13.5px] font-medium">{text.what}</p>
              <p className="text-[13px] leading-relaxed">{text.how}</p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{text.news}</p>
              <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="text-muted-foreground">{book.guide.labels.year}</dt>
                <dd>{num(g.year)}</dd>
                <dt className="text-muted-foreground">{book.guide.labels.standards}</dt>
                <dd>
                  <bdi>{g.standards}</bdi>
                </dd>
                <dt className="text-muted-foreground">{book.guide.labels.access}</dt>
                <dd>
                  <bdi>{g.access}</bdi>
                </dd>
                <dt className="text-muted-foreground">{book.guide.labels.modulation}</dt>
                <dd>
                  <bdi>{g.modulation}</bdi>
                </dd>
                <dt className="text-muted-foreground">{book.guide.labels.typical}</dt>
                <dd>
                  <bdi>{g.id === '6g' ? book.guide.labels.future : g.typical ? speed(g.typical) : '—'}</bdi>
                </dd>
                <dt className="text-muted-foreground">{book.guide.labels.peak}</dt>
                <dd>
                  <bdi>{g.id === '6g' ? '1 Tbit/s?' : g.peak ? speed(g.peak) : '—'}</bdi>
                </dd>
                <dt className="text-muted-foreground">{book.guide.labels.latency}</dt>
                <dd>
                  <bdi>{g.latency ? `${num(g.latency)} ms` : '—'}</bdi>
                </dd>
                <dt className="text-muted-foreground">{book.guide.labels.icons}</dt>
                <dd className="flex flex-wrap gap-1" dir="ltr">
                  {g.icons.length ? g.icons.map((icon) => (
                    <span key={icon} className="rounded border px-1.5 font-mono text-[11px] font-bold" style={{ color: GEN_COLOR[gen] }}>
                      {icon}
                    </span>
                  )) : '—'}
                </dd>
              </dl>
            </div>
            {g.access !== '?' ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold">{book.guide.accessTitle}</p>
                <AccessGrid method={g.access} />
                <p className="text-xs leading-snug text-muted-foreground">
                  <b dir="ltr">{g.access}</b>: {book.guide.access[g.access]}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section id="tel-icons" className="scroll-mt-14 space-y-3">
          <h2 className="text-lg font-semibold">{sections.icons}</h2>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {book.guide.icons.map((row) => (
              <div key={row.icon} className="flex items-start gap-3 rounded-lg border p-2.5">
                <span className="min-w-16 shrink-0 rounded-md bg-foreground px-1.5 py-0.5 text-center font-mono text-xs font-bold text-background" dir="ltr">
                  {row.icon}
                </span>
                <span className="text-xs leading-snug">{row.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="tel-speeds" className="scroll-mt-14 space-y-3">
          <h2 className="text-lg font-semibold">{sections.speeds}</h2>
          <p className="text-xs text-muted-foreground">{book.guide.speedsHint}</p>
          <div className="space-y-1.5">
            {SPEEDS.map((s) => (
              <div key={s.icon} className="grid grid-cols-[3rem_1fr_9rem] items-center gap-2 text-xs max-sm:grid-cols-[3rem_1fr]">
                <span className="font-mono font-bold" style={{ color: GEN_COLOR[s.gen] }} dir="ltr">
                  {s.icon}
                </span>
                <span className="relative h-5 overflow-hidden rounded bg-muted" dir="ltr">
                  <span className="absolute inset-y-0 left-0 rounded" style={{ width: barOf(s.mbps), background: GEN_COLOR[s.gen] }} />
                  <span className="absolute inset-y-0 left-1.5 flex items-center font-mono text-[11px] font-semibold text-white mix-blend-difference">{speed(s.mbps)}</span>
                </span>
                <span className="text-muted-foreground max-sm:col-start-2">{book.guide.song(time(downloadSeconds(5, s.mbps)))}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="tel-terms" className="scroll-mt-14 space-y-3">
          <h2 className="text-lg font-semibold">{sections.terms}</h2>
          <dl className="grid gap-2 sm:grid-cols-2">
            {book.guide.terms.map((t) => (
              <div key={t.term} className="rounded-lg border p-2.5">
                <dt className="text-[13px] font-semibold">{t.term}</dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t.text}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[11px] text-muted-foreground italic">{book.guide.model}</p>
        </section>
      </div>
    </div>
  )
}
