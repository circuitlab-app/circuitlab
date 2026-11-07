import { RotateCcw, RotateCw, Square } from 'lucide-react'
import type { ReactNode } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { METER_DIALS, PARTS } from '@/circuit/catalog'
import type { MeterDial, PartData, PartType } from '@/circuit/types'
import { useI18n } from '@/i18n'
import { playClick } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { useCircuit, type SelectedPart } from '@/store/circuit'

/*
 * The details panel for the newer parts: the multimeter's dial, the IR LED's
 * view, and two small tables that show how the memory latch and the motor
 * driver decide. Their tips are in labRules.
 */

/** The multimeter's dial and the IR LED's view. */
export function LabSettings({ node }: { node: SelectedPart }) {
  const { t } = useI18n()
  const updatePart = useCircuit((s) => s.updatePart)
  const { id, data } = node
  if (data.type === 'multimeter') {
    const dial = data.dial ?? 'volts'
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{t.lab.dial}</p>
        <ToggleGroup
          type="single"
          variant="outline"
          className="w-full"
          value={dial}
          onValueChange={(v) => {
            if (!v) return
            updatePart(id, { dial: v as MeterDial })
            playClick()
          }}
        >
          {METER_DIALS.map((option) => (
            <ToggleGroupItem key={option} value={option} className="min-w-0 flex-1 px-1 text-xs font-semibold">
              <span className="truncate">{t.lab.dials[option]}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs leading-relaxed text-muted-foreground">{t.lab.dialHints[dial]}</p>
      </div>
    )
  }
  if (data.type === 'irLed') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{t.lab.lookWith}</p>
        <ToggleGroup
          type="single"
          variant="outline"
          className="w-full"
          value={data.camera ? 'camera' : 'eyes'}
          onValueChange={(v) => {
            if (!v) return
            updatePart(id, { camera: v === 'camera' })
            playClick(v === 'camera')
          }}
        >
          <ToggleGroupItem value="eyes" className="flex-1 text-xs font-semibold">
            {t.lab.eyes}
          </ToggleGroupItem>
          <ToggleGroupItem value="camera" className="flex-1 text-xs font-semibold">
            {t.lab.camera}
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-xs leading-relaxed text-muted-foreground">{t.lab.viewHint}</p>
      </div>
    )
  }
  return null
}

type Row = { inputs: [boolean, boolean]; cell: ReactNode }

/** A small table of rules like the gates' truth table, with the row happening now lit up. */
function RuleTable({
  type,
  title,
  hint,
  heads,
  rows,
  now,
}: {
  type: PartType
  title: string
  hint: string
  heads: [string, string, string]
  rows: Row[]
  now?: [boolean, boolean]
}) {
  return (
    <div className="space-y-2.5 rounded-xl border bg-card p-3" style={{ ['--part-accent' as string]: PARTS[type].accent }}>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{hint}</p>
      </div>
      <table dir="ltr" className="w-full border-separate border-spacing-y-1 text-center font-mono text-sm tabular-nums">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="py-0.5 font-semibold">{heads[0]}</th>
            <th className="py-0.5 font-semibold">{heads[1]}</th>
            <th className="w-8" aria-hidden />
            <th className="py-0.5 font-sans font-semibold">{heads[2]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const lit = now !== undefined && row.inputs[0] === now[0] && row.inputs[1] === now[1]
            const cell = (extra = '') =>
              cn('py-1', extra, lit ? 'bg-[var(--part-accent)]/12 font-bold text-foreground' : 'bg-muted/50 text-muted-foreground')
            return (
              <tr key={row.inputs.join('')}>
                <td className={cell('rounded-s-md')}>{row.inputs[0] ? 1 : 0}</td>
                <td className={cell()}>{row.inputs[1] ? 1 : 0}</td>
                <td className={cell()} aria-hidden>
                  →
                </td>
                <td className={cell('rounded-e-md font-sans')}>{row.cell}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** The latch's memory table and the motor driver's direction table. */
export function LabExtras({ data, channels }: { data: PartData; channels?: Record<string, number> }) {
  const { t } = useI18n()
  const bit = (k: string) => (channels?.[k] ?? 0) > 0.5
  const pill = (text: string, on: boolean) => (
    <span
      className={cn(
        'inline-grid min-w-6 place-items-center rounded-md px-1.5 py-0.5 text-xs font-bold',
        on ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
      )}
    >
      {text}
    </span>
  )
  if (data.type === 'latch') {
    const rows: Row[] = [
      { inputs: [false, false], cell: pill(t.lab.latchTable.keeps, false) },
      { inputs: [true, false], cell: pill('1', true) },
      { inputs: [false, true], cell: pill('0', false) },
      { inputs: [true, true], cell: pill('0', false) },
    ]
    return (
      <RuleTable
        type="latch"
        title={t.lab.latchTable.title}
        hint={t.lab.latchTable.hint}
        heads={['S', 'R', 'Q']}
        rows={rows}
        now={channels ? [bit('S'), bit('R')] : undefined}
      />
    )
  }
  if (data.type === 'hBridge') {
    const motion = (Icon: typeof Square, text: string, on: boolean) => (
      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', !on && 'text-muted-foreground')}>
        <Icon className="size-3.5" aria-hidden />
        {text}
      </span>
    )
    const rows: Row[] = [
      { inputs: [false, false], cell: motion(Square, t.lab.stop, false) },
      { inputs: [true, false], cell: motion(RotateCw, t.lab.forward, true) },
      { inputs: [false, true], cell: motion(RotateCcw, t.lab.back, true) },
      { inputs: [true, true], cell: motion(Square, t.lab.stop, false) },
    ]
    return (
      <RuleTable
        type="hBridge"
        title={t.lab.bridgeTable.title}
        hint={t.lab.bridgeTable.hint}
        heads={['IN1', 'IN2', t.lab.bridgeTable.motor]}
        rows={rows}
        now={channels ? [bit('IN1'), bit('IN2')] : undefined}
      />
    )
  }
  return null
}
