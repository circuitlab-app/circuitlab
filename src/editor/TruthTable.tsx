import { PARTS, gateInputs, gateOutput, type GateType } from '@/circuit/catalog'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

/**
 * Every way a gate's inputs can be set and what Y does for each, with the row
 * that is happening right now lit up.
 */
export function TruthTable({ type, channels }: { type: GateType; channels?: Record<string, number> }) {
  const { t } = useI18n()
  const inputs = gateInputs(type)
  const rows = inputs.length === 1 ? [[false], [true]] : [[false, false], [false, true], [true, false], [true, true]]
  const bit = (on: boolean) => (on ? 1 : 0)
  return (
    <div
      className="space-y-2.5 rounded-xl border bg-card p-3"
      style={{ ['--part-accent' as string]: PARTS[type].accent }}
    >
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">{t.workshop.truthTable}</p>
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{t.workshop.gateRules[type]}</p>
      </div>
      <table dir="ltr" className="w-full border-separate border-spacing-y-1 text-center font-mono text-sm tabular-nums">
        <thead>
          <tr className="text-xs text-muted-foreground">
            {inputs.map((input) => (
              <th key={input} className="py-0.5 font-semibold">
                {input}
              </th>
            ))}
            <th className="w-8" aria-hidden />
            <th className="py-0.5 font-semibold">Y</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const y = gateOutput(type, row[0], row[1] ?? false)
            // the row that matches what the chip sees and does right now
            const now =
              channels !== undefined &&
              row.every((on, i) => (channels[inputs[i]] ?? 0) > 0.5 === on) &&
              (channels.Y ?? 0) > 0.5 === y
            return (
              <tr key={row.join('')} className={cn('transition-colors', now && 'text-foreground')}>
                {row.map((on, i) => (
                  <td
                    key={i}
                    className={cn(
                      'py-1 first:rounded-s-md',
                      now ? 'bg-[var(--part-accent)]/12 font-bold' : 'bg-muted/50 text-muted-foreground',
                    )}
                  >
                    {bit(on)}
                  </td>
                ))}
                <td className={cn('py-1', now ? 'bg-[var(--part-accent)]/12' : 'bg-muted/50')} aria-hidden>
                  <span className="text-muted-foreground">→</span>
                </td>
                <td className={cn('rounded-e-md py-1', now ? 'bg-[var(--part-accent)]/12' : 'bg-muted/50')}>
                  <span
                    className={cn(
                      'inline-grid size-6 place-items-center rounded-md font-bold',
                      y ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
                    )}
                  >
                    {bit(y)}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs leading-relaxed text-muted-foreground">{t.workshop.truthHint}</p>
    </div>
  )
}
