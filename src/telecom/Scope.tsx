import { Shuffle } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { BITS, constellation, isAnalog, SCHEMES, transmit, waves } from './modulation'
import { useTelecom } from './store'
import { useTelecomBook } from './ui'

/*
 * The modulation scope: type a message, pick a modulation and a noise level,
 * and see the bits ride on the carrier, land on the constellation and come
 * out again, sometimes wrong. It shows why phones fall back to simpler
 * modulations far from the tower.
 */

const W = 640

/** One trace of the scope. */
function Trace({ data, color, marks = [], height = 70, label, bits }: { data: number[]; color: string; marks?: number[]; height?: number; label: string; bits?: string[] }) {
  const max = Math.max(1e-6, ...data.map(Math.abs))
  const points = data.map((v, i) => `${((i / Math.max(1, data.length - 1)) * W).toFixed(1)},${(height / 2 - (v / max) * (height / 2 - 6)).toFixed(1)}`).join(' ')
  const step = W / Math.max(1, data.length - 1)
  return (
    <figure className="space-y-1">
      <figcaption className="text-[11.5px] font-medium text-muted-foreground">{label}</figcaption>
      <svg viewBox={`0 0 ${W} ${height}`} className="tel-scope w-full" style={{ height }} role="img" aria-label={label} preserveAspectRatio="none">
        <line x1={0} x2={W} y1={height / 2} y2={height / 2} className="tel-scope__axis" />
        {marks.map((m, i) => (
          <line key={i} x1={m * step} x2={m * step} y1={0} y2={height} className="tel-scope__mark" />
        ))}
        {bits
          ? marks.map((m, i) => (
              <text key={i} x={m * step + 4} y={11} className="tel-scope__bits">
                {bits[i]}
              </text>
            ))
          : null}
        <polyline points={points} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
      </svg>
    </figure>
  )
}

function Constellation({ scheme, tx }: { scheme: (typeof SCHEMES)[number]; tx: ReturnType<typeof transmit> }) {
  const { book } = useTelecomBook()
  const ideal = constellation(scheme)
  const size = 240
  const span = scheme === 'ask' ? 1.9 : 1.55
  const at = (v: number) => size / 2 + (v / span) * (size / 2 - 8)
  const fsk = scheme === 'fsk'
  return (
    <figure className="space-y-1">
      <figcaption className="text-[11.5px] font-medium text-muted-foreground">{book.scope.constellation}</figcaption>
      <svg viewBox={`0 0 ${size} ${size}`} className="tel-scope aspect-square w-full max-w-[260px]" role="img" aria-label={book.scope.constellation}>
        <line x1={0} x2={size} y1={size / 2} y2={size / 2} className="tel-scope__axis" />
        <line x1={size / 2} x2={size / 2} y1={0} y2={size} className="tel-scope__axis" />
        <text x={size - 6} y={size / 2 - 5} textAnchor="end" className="tel-scope__bits">
          {fsk ? 'f₁' : 'I'}
        </text>
        <text x={size / 2 + 5} y={12} className="tel-scope__bits">
          {fsk ? 'f₂' : 'Q'}
        </text>
        {tx.symbols.map((s, i) => (
          <circle key={i} cx={at(s.got.i)} cy={at(-s.got.q)} r={2.6} className={s.ok ? 'tel-dot' : 'tel-dot tel-dot--bad'} />
        ))}
        {ideal.map((p, i) => (
          <circle key={i} cx={at(p.i)} cy={at(-p.q)} r={ideal.length > 64 ? 1.6 : 3.4} className="tel-point" />
        ))}
      </svg>
    </figure>
  )
}

export function Scope() {
  const { book, num, dir } = useTelecomBook()
  const scheme = useTelecom((s) => s.scheme)
  const text = useTelecom((s) => s.text)
  const snr = useTelecom((s) => s.snr)
  const seed = useTelecom((s) => s.seed)
  const { setScheme, setText, setSnr, newNoise } = useTelecom.getState()
  const analog = isAnalog(scheme)
  const tx = useMemo(() => transmit(text || ' ', scheme, snr, seed), [text, scheme, snr, seed])
  const shown = analog ? 12 : Math.min(12, Math.max(4, tx.symbols.length))
  const w = useMemo(() => waves(tx, scheme, snr, shown, 48, 3, seed + 6), [tx, scheme, snr, shown, seed])
  const bitLabels = tx.symbols.slice(0, shown).map((s) => s.bits.join(''))

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <aside className="space-y-4 border-b p-4 lg:w-[340px] lg:shrink-0 lg:overflow-y-auto lg:border-e lg:border-b-0">
        <div>
          <h2 className="mb-2 text-[13px] font-semibold">{book.scope.scheme}</h2>
          <div className="grid grid-cols-2 gap-1.5">
            {SCHEMES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScheme(s)}
                aria-pressed={s === scheme}
                className={cn(
                  'rounded-lg border px-2 py-1.5 text-start transition hover:bg-muted',
                  s === scheme && 'border-[var(--tel-accent)] bg-[color-mix(in_oklch,var(--tel-accent)_10%,transparent)]',
                )}
              >
                <span className="block font-mono text-[12.5px] font-semibold" dir="ltr">
                  {book.scope.schemes[s].name}
                </span>
                <span className="block text-[10.5px] leading-tight text-muted-foreground">{book.scope.schemes[s].used}</span>
              </button>
            ))}
          </div>
        </div>
        {!analog ? (
          <label className="block space-y-1.5">
            <span className="text-[13px] font-semibold">{book.scope.text}</span>
            <input
              value={text}
              dir="auto"
              maxLength={60}
              onChange={(e) => setText(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </label>
        ) : null}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold">{book.scope.snr}</span>
            <span className="font-mono text-xs tabular-nums" dir="ltr">
              {num(snr)} dB
            </span>
          </div>
          <Slider min={0} max={40} step={1} value={[snr]} onValueChange={([v]) => setSnr(v)} dir="ltr" />
          <p className="text-[11px] leading-snug text-muted-foreground">{book.scope.snrHint}</p>
          <Button variant="outline" size="sm" onClick={newNoise}>
            <Shuffle className="size-3.5" aria-hidden />
            {book.scope.noise}
          </Button>
        </div>
      </aside>

      <section className="min-w-0 flex-1 space-y-3 p-4 lg:overflow-y-auto">
        <div className="space-y-2" dir="ltr">
          <Trace data={w.message} color="var(--tel-digital)" marks={w.marks} label={book.scope.message} bits={analog ? undefined : bitLabels} />
          <Trace data={w.carrier} color="var(--tel-rf)" marks={w.marks} label={book.scope.carrier} height={54} />
          <Trace data={w.signal} color="var(--tel-radio)" marks={w.marks} label={book.scope.signal} height={90} />
        </div>
        {analog ? (
          <p className="rounded-xl border p-3 text-[13px] leading-relaxed" dir={dir}>
            {book.scope.analog}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <div dir="ltr">
              <Constellation scheme={scheme} tx={tx} />
            </div>
            <div className="min-w-0 space-y-2.5 text-[13px]">
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-md bg-muted px-2 py-1">{book.scope.bitsPerSymbol(BITS[scheme])}</span>
                <span
                  className="rounded-md px-2 py-1"
                  style={{ background: `color-mix(in oklch, ${tx.errors ? 'var(--pipe-bad)' : 'var(--pipe-ok)'} 14%, transparent)` }}
                >
                  {book.scope.errors(tx.errors, tx.bits.length)}
                </span>
                <span className="rounded-md bg-muted px-2 py-1">{book.scope.speed(BITS[scheme] * 13.5)}</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{book.scope.sent}</p>
                <p className="rounded-lg border px-2.5 py-1.5" dir="auto">
                  {text}
                </p>
                <p className="text-xs text-muted-foreground">{book.scope.received}</p>
                <p
                  className={cn('rounded-lg border px-2.5 py-1.5 break-words', tx.errors ? 'border-[var(--pipe-bad)]' : 'border-[var(--pipe-ok)]')}
                  dir="auto"
                >
                  {tx.text}
                </p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{book.scope.tip}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
