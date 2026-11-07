import { BellRing, Camera, Droplets, Eye, Fan, MoveRight, RotateCcw, RotateCw, Square, Volume2 } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { COUNTER_OUTPUTS, METER_DIALS } from '@/circuit/catalog'
import { meterReading } from '@/circuit/devices'
import type { PartResult } from '@/circuit/solver'
import type { MeterDial, PartData } from '@/circuit/types'
import { useI18n } from '@/i18n'
import { playClick } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { useCircuit } from '@/store/circuit'
import { Bit, LcdRow, RelayRow } from './WorkshopControls'
import { RadioRow } from './RadioPanels'

/*
 * Card controls for the newer parts: the Zener, MOSFET, optocoupler, IR LED,
 * solenoid, pump, bell, fan, bar graph, traffic light, the chips, the
 * multimeter and the logic probe. Each one fits the card's single 28 px row.
 */

/** Current as people read it: mA below one amp, A above. */
const amps = (a: number) => (Math.abs(a) < 1 ? `${Math.round(Math.abs(a) * 1000)} mA` : `${Math.abs(a).toFixed(2)} A`)

/** A tiny round lamp with a word or letter beside it: one light on a module. */
function Lamp({ name, on, color = '#22c55e' }: { name: string; on: boolean; color?: string }) {
  return (
    <span
      className={cn(
        'flex min-w-0 items-center justify-center gap-1 text-[10.5px] leading-none font-bold transition-colors',
        on ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full transition-[background-color,box-shadow] duration-150"
        style={{
          background: on ? color : 'color-mix(in oklch, var(--foreground) 16%, transparent)',
          boxShadow: on ? `0 0 6px 1px ${color}99` : 'none',
        }}
      />
      <span className="truncate">{name}</span>
    </span>
  )
}

const Arrow = () => (
  <svg aria-hidden viewBox="0 0 16 8" className="mx-0.5 h-2 w-4 shrink-0 text-muted-foreground">
    <path d="M1 4h12M10 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** A bar plus a number, with a small icon: how hard a pump, bell, fan or solenoid is working. */
function LevelRow({ fraction, text, label, icon }: { fraction: number; text: string; label: string; icon: ReactNode }) {
  const percent = Math.round(Math.min(1, Math.max(0, fraction)) * 100)
  return (
    <div
      className="node-track flex items-center gap-2 px-2.5"
      dir="ltr"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label}
    >
      {icon}
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
        <motion.div
          className="h-full rounded-full bg-[var(--part-accent)]"
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 160, damping: 22 }}
        />
      </div>
      <span className="min-w-8 shrink-0 text-end text-[11px] font-semibold text-muted-foreground tabular-nums">{text}</span>
    </div>
  )
}

const icon = (Icon: typeof Fan) => <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />

/** The MOSFET: the volts on its gate, how far open it is, and the current it lets through. */
function GateRow({ result, label }: { result?: PartResult; label: string }) {
  const gate = Math.max(0, result?.channels?.gate ?? 0)
  const drive = Math.round((result?.level ?? 0) * 100)
  return (
    <div
      className="node-track flex items-center gap-1.5 px-2.5"
      dir="ltr"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={drive}
      aria-label={`${label}: ${gate.toFixed(1)} V`}
    >
      <span className="shrink-0 text-[10px] font-bold text-muted-foreground">G</span>
      <span className="w-8 shrink-0 text-[11px] font-semibold tabular-nums">{gate.toFixed(1)}V</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
        <motion.div
          className="h-full rounded-full bg-[var(--part-accent)]"
          animate={{ width: `${drive}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        />
      </div>
      <span className="min-w-9 shrink-0 text-end text-[11px] font-semibold text-muted-foreground tabular-nums">
        {amps(result?.current ?? 0)}
      </span>
    </div>
  )
}

/** Eyes or a phone camera: how the IR LED is looked at. */
function ViewToggle({ id, camera }: { id: string; camera: boolean }) {
  const { t } = useI18n()
  const updatePart = useCircuit((s) => s.updatePart)
  const options = [
    { on: false, text: t.lab.eyes, Icon: Eye },
    { on: true, text: t.lab.camera, Icon: Camera },
  ]
  return (
    <div role="radiogroup" aria-label={t.lab.lookWith} className="nodrag node-track grid grid-cols-2 gap-0.5 p-0.5">
      {options.map(({ on, text, Icon }) => (
        <button
          key={text}
          type="button"
          role="radio"
          aria-checked={camera === on}
          onClick={() => {
            if (camera === on) return
            updatePart(id, { camera: on })
            playClick(on)
          }}
          className={cn(
            'flex min-w-0 items-center justify-center gap-1 rounded-[4px] px-1 text-[11px] font-semibold transition',
            camera === on
              ? 'bg-[var(--part-accent)] text-white shadow-sm'
              : 'text-muted-foreground hover:bg-card hover:text-foreground',
          )}
        >
          <Icon className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{text}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * What a phone's screen adds around the picture: the corner marks of the
 * viewfinder and a red recording dot. Drawn over the IR LED's window.
 */
export function CameraViewfinder() {
  const corner = 'absolute size-3 border-white/75'
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[6px] bg-[radial-gradient(120%_90%_at_50%_50%,transparent_55%,oklch(0.25_0.08_300/0.35))]">
      <span className={cn(corner, 'start-2 top-2 rounded-ss-[2px] border-s-2 border-t-2')} />
      <span className={cn(corner, 'end-2 top-2 rounded-se-[2px] border-e-2 border-t-2')} />
      <span className={cn(corner, 'start-2 bottom-2 rounded-es-[2px] border-s-2 border-b-2')} />
      <span className={cn(corner, 'end-2 bottom-2 rounded-ee-[2px] border-e-2 border-b-2')} />
      <span className="absolute end-[18px] top-[9px] size-1.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_4px_#ef4444]" />
      <span className="absolute start-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 rtl:translate-x-1/2" />
    </div>
  )
}

/** The traffic light's three lamps. */
function TrafficRow({ channels, label }: { channels?: Record<string, number>; label: string }) {
  const lamps = [
    ['R', '#ef4444'],
    ['Y', '#facc15'],
    ['G', '#22c55e'],
  ] as const
  return (
    <div role="status" aria-label={label} className="node-track grid grid-cols-3 items-center px-2" dir="ltr">
      {lamps.map(([ch, color]) => (
        <Lamp key={ch} name={ch} on={(channels?.[ch] ?? 0) > 0.05} color={color} />
      ))}
    </div>
  )
}

/** The latch: S and R going in, Q coming out. */
function LatchRow({ channels, label }: { channels?: Record<string, number>; label: string }) {
  const on = (k: string) => (channels?.[k] ?? 0) > 0.5
  return (
    <div role="status" aria-label={label} className="node-track flex items-center justify-center gap-0.5 px-1" dir="ltr">
      <Bit name="S" on={on('S')} />
      <Bit name="R" on={on('R')} />
      <Arrow />
      <Bit name="Q" on={on('Q')} output />
    </div>
  )
}

/** The counter: its clock input and which of the five outputs is lit. */
function CounterRow({ result, label }: { result?: PartResult; label: string }) {
  const powered = result?.status === 'on'
  const count = Math.round(result?.level ?? 0)
  return (
    <div role="status" aria-label={`${label}: ${powered ? count : '–'}`} className="node-track flex items-center gap-1 px-2" dir="ltr">
      <Lamp name="CLK" on={(result?.channels?.CLK ?? 0) > 0.5} color="#facc15" />
      <span aria-hidden className="mx-0.5 h-3.5 w-px shrink-0 bg-foreground/15" />
      <div className="grid flex-1 grid-cols-5 gap-0.5">
        {Array.from({ length: COUNTER_OUTPUTS }, (_, i) => {
          const lit = powered && i === count
          return (
            <span
              key={i}
              className={cn(
                'grid h-5 place-items-center rounded-[4px] text-[10.5px] font-bold tabular-nums transition-colors duration-100',
                lit ? 'bg-red-500 text-white shadow-[0_0_8px_#ef444499]' : 'text-muted-foreground',
              )}
            >
              {i}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** The comparator: the volts on IN+ and IN−, which is bigger, and OUT. */
function CompareRow({ channels, label }: { channels?: Record<string, number>; label: string }) {
  const plus = channels?.P ?? 0
  const minus = channels?.N ?? 0
  const out = (channels?.OUT ?? 0) > 0.5
  return (
    <div role="status" aria-label={label} className="node-track flex items-center justify-center gap-1 px-1.5 text-[11px] font-semibold tabular-nums" dir="ltr">
      <span>{plus.toFixed(2)}</span>
      <span className={cn('w-2.5 text-center font-bold', out ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
        {out ? '>' : '≤'}
      </span>
      <span>{minus.toFixed(2)}</span>
      <Arrow />
      <Bit name="OUT" on={out} output />
    </div>
  )
}

/** The motor driver: its two inputs and which way the motor turns. */
function BridgeRow({ result, label }: { result?: PartResult; label: string }) {
  const { t } = useI18n()
  const direction = Math.round(result?.level ?? 0)
  const Icon = direction > 0 ? RotateCw : direction < 0 ? RotateCcw : Square
  const word = direction > 0 ? t.lab.forward : direction < 0 ? t.lab.back : t.lab.stop
  return (
    <div role="status" aria-label={`${label}: ${word}`} className="node-track flex items-center gap-1.5 ps-2 pe-0.5" dir="ltr">
      <Lamp name="IN1" on={(result?.channels?.IN1 ?? 0) > 0.5} />
      <Lamp name="IN2" on={(result?.channels?.IN2 ?? 0) > 0.5} />
      <span
        className={cn(
          'flex min-w-0 flex-1 items-center justify-center gap-1 rounded-[4px] px-1 py-1 text-[11px] leading-none font-semibold transition-colors',
          direction !== 0 ? 'bg-card text-foreground shadow-[inset_0_0_0_1px_var(--stage-line)]' : 'text-muted-foreground',
        )}
      >
        <Icon className={cn('size-3 shrink-0', direction === 0 && 'size-2.5')} aria-hidden />
        <span className="truncate">{word}</span>
      </span>
    </div>
  )
}

/** The continuity mark printed on real meters: a dot and sound waves. */
function BeepGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 12" className={className}>
      <circle cx="3.5" cy="6" r="1.6" fill="currentColor" />
      <path d="M7 3.2a4 4 0 0 1 0 5.6M9.6 1.4a6.6 6.6 0 0 1 0 9.2M12.2 0a9 9 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

const DIAL_GLYPH: Record<MeterDial, ReactNode> = {
  volts: 'V',
  amps: 'A',
  ohms: 'Ω',
  beep: <BeepGlyph className="h-2.5 w-3.5" />,
}

/** The multimeter: its reading on a small LCD and the dial, turned with a tap. */
function MeterControl({ id, data, result }: { id: string; data: PartData; result?: PartResult }) {
  const { t } = useI18n()
  const updatePart = useCircuit((s) => s.updatePart)
  const dial = data.dial ?? 'volts'
  const { text, unit } = meterReading(dial, result)
  const beep = result?.channels?.beep === 1
  return (
    <div className="flex h-7 items-stretch gap-1" dir="ltr">
      <div
        role="status"
        aria-label={`${t.lab.reading}: ${text} ${unit}`}
        className="lcd flex min-w-0 flex-1 items-center justify-end gap-1 overflow-hidden rounded-[6px] px-2 font-mono text-[13px] leading-none font-semibold whitespace-nowrap tabular-nums"
      >
        {beep && <Volume2 className="size-3 shrink-0 animate-pulse" aria-hidden />}
        <span>{text}</span>
        <span className="text-[10px] opacity-75">{unit}</span>
      </div>
      <div role="radiogroup" aria-label={t.lab.dial} className="nodrag node-track grid w-[78px] shrink-0 grid-cols-4 gap-0.5 p-0.5">
        {METER_DIALS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={dial === option}
            aria-label={t.lab.dials[option]}
            title={t.lab.dials[option]}
            onClick={() => {
              if (dial === option) return
              updatePart(id, { dial: option })
              playClick()
            }}
            className={cn(
              'grid min-w-0 place-items-center rounded-[4px] text-[11.5px] font-bold transition',
              dial === option
                ? 'bg-zinc-800 text-yellow-300 shadow-sm dark:bg-zinc-950'
                : 'text-muted-foreground hover:bg-card hover:text-foreground',
            )}
          >
            {DIAL_GLYPH[option]}
          </button>
        ))}
      </div>
    </div>
  )
}

/** The logic probe's three lamps: HIGH, LOW and PULSE. */
function ProbeRow({ channels, label }: { channels?: Record<string, number>; label: string }) {
  const { t } = useI18n()
  return (
    <div role="status" aria-label={label} className="node-track grid grid-cols-3 items-center gap-1 px-1.5">
      <Lamp name={t.lab.high} on={(channels?.high ?? 0) > 0.5} color="#ef4444" />
      <Lamp name={t.lab.low} on={(channels?.low ?? 0) > 0.5} color="#22c55e" />
      <Lamp name={t.lab.pulse} on={(channels?.pulse ?? 0) > 0.5} color="#f59e0b" />
    </div>
  )
}

/** The control row of one of the newer parts. */
export function LabControl({ id, data, result }: { id: string; data: PartData; result?: PartResult }) {
  const { t } = useI18n()
  const label = t.parts[data.type].description
  const level = Math.abs(result?.level ?? 0)
  const percent = (fraction: number) => `${Math.round(Math.min(1, fraction) * 100)}%`
  switch (data.type) {
    case 'zener': {
      const volts = result?.voltage ?? 0
      return (
        <LcdRow label={`${t.lab.held}: ${volts.toFixed(2)} V`}>
          <span className="text-[11px] opacity-70">{amps(result?.current ?? 0)}</span>
          <span className="ms-auto">{volts.toFixed(2)}</span>
          <span className="text-[10px] opacity-75">{t.units.volt}</span>
        </LcdRow>
      )
    }
    case 'mosfet':
      return <GateRow result={result} label={t.lab.gate} />
    case 'optocoupler': {
      const closed = result?.status === 'on' || result?.status === 'over'
      return <RelayRow closed={closed} coil={result?.voltage ?? 0} text={closed ? t.workshop.closed : t.workshop.open} />
    }
    case 'irLed':
      return <ViewToggle id={id} camera={!!data.camera} />
    case 'solenoid':
      return <LevelRow fraction={level} text={percent(level)} label={t.lab.push} icon={icon(MoveRight)} />
    case 'pump':
      return <LevelRow fraction={level / 1.6} text={percent(level / 1.6)} label={t.lab.flow} icon={icon(Droplets)} />
    case 'bell':
      return <LevelRow fraction={level / 1.5} text={percent(level / 1.5)} label={t.workshop.loudness} icon={icon(BellRing)} />
    case 'fan':
      return <LevelRow fraction={level / 1.6} text={percent(level / 1.6)} label={t.inspector.speed} icon={icon(Fan)} />
    case 'barGraph': {
      const bars = Math.round(result?.level ?? 0)
      const vin = Math.max(0, result?.channels?.IN ?? 0)
      return (
        <LcdRow label={`${t.lab.inVolts}: ${vin.toFixed(2)} V, ${t.lab.bars(bars)}`}>
          <span className="text-[11px] opacity-70">{bars}/10</span>
          <span className="ms-auto">{vin.toFixed(2)}</span>
          <span className="text-[10px] opacity-75">{t.units.volt}</span>
        </LcdRow>
      )
    }
    case 'trafficLight':
      return <TrafficRow channels={result?.channels} label={t.inspector.brightness} />
    case 'latch':
      return <LatchRow channels={result?.channels} label={label} />
    case 'counter':
      return <CounterRow result={result} label={t.lab.count} />
    case 'comparator':
      return <CompareRow channels={result?.channels} label={label} />
    case 'hBridge':
      return <BridgeRow result={result} label={label} />
    case 'multimeter':
      return <MeterControl id={id} data={data} result={result} />
    case 'logicProbe':
      return <ProbeRow channels={result?.channels} label={label} />
    case 'gsm':
    case 'wifi':
    case 'bluetooth':
    case 'lora':
    case 'gps':
    case 'canBus':
    case 'rs485':
      return <RadioRow data={data} result={result} />
    default:
      return null
  }
}
