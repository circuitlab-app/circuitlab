import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { Magnet, Minus, Plus, RotateCcw, RotateCw, Sun, Vibrate, Wrench } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { lazy, memo, Suspense, useEffect, type ReactNode } from 'react'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  BATTERY_VOLTAGES,
  BOARDS,
  FUSE_RATINGS,
  LAMP_COLORS,
  LED_COLORS,
  PARTS,
  RESISTOR_VALUES,
  SCOPE_SPANS,
  SENSORS,
  SPEAKER_NOTES,
  TIMER_RATES,
  BUZZER_SOUNDS,
  dynamoVoltage,
  isRadio,
  formatAmps,
  formatOhms,
  lemonCount,
  partWidth,
  pinModesFor,
  rgbMix,
  terminalPlacement,
  type BoardType,
  type SensedPart,
  type TerminalDef,
} from '@/circuit/catalog'
import { displayGeometry, isDisplay } from '@/circuit/display'
import type { PartResult, PartStatus } from '@/circuit/solver'
import type { LampColor, LedColor, PartData, PartNode as PartNodeType, PinMode, Rotation, Side } from '@/circuit/types'
import { useI18n } from '@/i18n'
import { playClick } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { useCircuit } from '@/store/circuit'
import { useSimulation } from '@/store/simulation'
import { DisplayControl } from './DisplayControl'
import { ChoiceTrack, GateLamps, LcdRow, RelayRow, RgbBars } from './WorkshopControls'
import { LemonTrack, SlideSwitchRow, StickRow } from './InputControls'
import { CameraViewfinder, LabControl } from './LabControls'
import { hasLabControl, labGlow } from './labRules'
import { ScopeFace } from '@/displays/ScopeFace'
import { useAiChat } from '@/ai/store'
import { aiBookFor } from '@/i18n/ai'
import { AiAskButton } from './AiCard'
import { PIN_GLYPHS } from './pinGlyphs'

// three.js is the biggest library in the app: load it after the first paint
const PartView = lazy(() => import('@/three/PartView'))
// screens draw their own front (LEDs, LCD dots, video) instead of a 3D model
const DisplayFace = lazy(() => import('@/displays/DisplayFace'))

const POSITION: Record<Side, Position> = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
}

export const STATUS_STYLE: Record<PartStatus, string> = {
  idle: 'bg-foreground/[0.06] text-muted-foreground',
  weak: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  on: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  over: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  reverse: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  burnt: 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-300',
  short: 'bg-red-500/15 text-red-700 dark:text-red-400',
}

export function partStatus(data: PartData, result?: PartResult): PartStatus {
  if (data.burnt) return 'burnt'
  return result?.status ?? 'idle'
}

/** Colour of the light a part gives off onto the board around it. */
function glowColor(data: PartData, result?: PartResult) {
  if (data.type === 'lamp') return LAMP_COLORS[(data.color as LampColor) ?? 'warm']
  if (data.type === 'led') return LED_COLORS[(data.color as LedColor) ?? 'red']
  // the RGB LED glows in whatever colour its three lights mix to
  if (data.type === 'rgbLed') return rgbMix(result?.channels)
  return labGlow(data, result)
}

/** How strongly an output part is working, as a share of its "full" level. */
function outputPercent(type: PartData['type'], level: number) {
  return Math.round(Math.min(1, Math.abs(level) / (type === 'motor' ? 2 : 1.3)) * 100)
}

/** Current as people read it: mA below one amp, A above. */
function formatCurrent(amps: number) {
  const a = Math.abs(amps)
  return a < 1 ? `${Math.round(a * 1000)} mA` : `${a.toFixed(2)} A`
}

function Terminal({ id, def, rotation }: { id: string; def: TerminalDef; rotation: Rotation }) {
  const { side, percent } = terminalPlacement(def, rotation)
  const style = side === 'left' || side === 'right' ? { top: `${percent}%` } : { left: `${percent}%` }
  const text = def.label ?? (def.polarity === '+' ? '+' : def.polarity === '-' ? '−' : null)
  // legs told apart by colour (the RGB LED's R, G and B) wear that colour
  const tint = def.tint
    ? {
        background: `radial-gradient(circle at 35% 30%, color-mix(in oklch, ${def.tint} 45%, white) 0%, ${def.tint} 48%, color-mix(in oklch, ${def.tint} 55%, black) 100%)`,
      }
    : null
  return (
    <Handle
      id={id}
      type="source"
      position={POSITION[side]}
      style={tint ? { ...style, ...tint } : style}
      className={cn(
        'terminal',
        def.polarity === '+' && 'terminal--plus',
        def.polarity === '-' && 'terminal--minus',
        def.pin && 'terminal--pin',
        def.label && !def.pin && 'terminal--lettered',
        // three letters (COM, OUT) need a wider, pill-shaped terminal
        !def.pin && (text?.length ?? 0) >= 3 && 'terminal--long',
      )}
    >
      {text && <span className={def.pin ? 'terminal__pin-label' : 'terminal__label'}>{text}</span>}
    </Handle>
  )
}

/** Colour of the little indicator lamp for each state. */
const LED_COLOR: Record<PartStatus, string> = {
  idle: 'oklch(0.78 0.01 60)',
  weak: '#f59e0b',
  on: '#22c55e',
  over: '#f97316',
  reverse: '#0ea5e9',
  burnt: '#52525b',
  short: '#ef4444',
}

const STATUS_TEXT: Record<PartStatus, string> = {
  idle: 'text-muted-foreground',
  weak: 'text-amber-700 dark:text-amber-400',
  on: 'text-emerald-700 dark:text-emerald-400',
  over: 'text-orange-700 dark:text-orange-400',
  reverse: 'text-sky-700 dark:text-sky-400',
  burnt: 'text-zinc-600 dark:text-zinc-300',
  short: 'text-red-700 dark:text-red-400',
}

/**
 * A card's title row: the part's name, its state word and an indicator lamp.
 * The name always wins: when the word doesn't fit beside it, the word wraps
 * onto a hidden second line and only the lamp shows the state.
 */
function CardTitle({
  name,
  status,
  label,
  thinking = false,
}: {
  name: string
  status: PartStatus
  label: string
  /** an AI board waiting for its model: the word and the lamp say so */
  thinking?: boolean
}) {
  const lit = thinking || (status !== 'idle' && status !== 'burnt')
  return (
    <div className="part-node__head">
      <div className="part-node__label">
        <span className="part-node__name">{name}</span>
        <span className="part-node__status">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={thinking ? 'thinking' : status}
              initial={{ opacity: 0, y: -5, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 5, filter: 'blur(2px)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className={cn(
                'block text-[10.5px] leading-none font-medium whitespace-nowrap',
                thinking ? 'text-amber-700 dark:text-amber-300' : STATUS_TEXT[status],
              )}
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
      <span
        aria-hidden
        title={label}
        className={cn(
          'status-led',
          lit && 'status-led--lit',
          thinking && 'status-led--thinking',
          !thinking && (status === 'short' || status === 'over') && 'status-led--blink',
        )}
        style={{ ['--led' as string]: thinking ? '#f2aa00' : LED_COLOR[status] }}
      />
    </div>
  )
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-6 shrink-0 place-items-center rounded-[4px] text-muted-foreground transition hover:bg-card hover:text-foreground hover:shadow-sm disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  )
}

/** A bar plus a number: how much an output or a part is doing right now. */
function MeterRow({
  fraction,
  text,
  color,
  label,
  icon,
}: {
  fraction: number
  text: string
  color: string
  label: string
  icon?: ReactNode
}) {
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
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 160, damping: 22 }}
        />
      </div>
      <span className="min-w-8 shrink-0 text-end text-[11px] font-semibold text-muted-foreground tabular-nums">{text}</span>
    </div>
  )
}

/** A slider row: the dimmer, sunlight, heat, distance, noise … */
function SliderRow({
  value,
  label,
  text,
  icon,
  steps = 100,
  onChange,
}: {
  value: number
  label: string
  text: string
  icon?: ReactNode
  /** how many stops the slider has between 0 and 1 */
  steps?: number
  onChange: (value: number) => void
}) {
  return (
    <div className="nodrag nopan node-track flex items-center gap-2 ps-2.5 pe-2" dir="ltr">
      {icon}
      <Slider
        className="flex-1"
        min={0}
        max={steps}
        step={1}
        aria-label={label}
        value={[Math.round(value * steps)]}
        onValueChange={([v]) => onChange(v / steps)}
        onValueCommit={() => useCircuit.getState().checkpoint()}
      />
      <span className="min-w-9 shrink-0 text-end text-[11px] font-semibold tabular-nums">{text}</span>
    </div>
  )
}

/** A button that works only while it is held down: push button, motion, touch. */
function HoldButton({
  held,
  label,
  className,
  onHold,
}: {
  held: boolean
  label: string
  className: string
  onHold: (down: boolean) => void
}) {
  const release = () => held && onHold(false)
  return (
    <button
      type="button"
      aria-pressed={held}
      className={cn(
        'nodrag flex h-7 w-full touch-none items-center justify-center rounded-[6px] text-[11px] font-semibold text-white transition select-none',
        held ? 'scale-[0.97] shadow-inner brightness-90' : 'shadow-sm hover:brightness-95',
        className,
      )}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        onHold(true)
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      {label}
    </button>
  )
}

/** One board pin in the card's program row: tap it to change what the pin does. */
function PinChip({
  label,
  mode,
  level,
  onNext,
}: {
  label: string
  mode: PinMode
  level: number
  onNext: () => void
}) {
  const { t } = useI18n()
  const active = mode !== 'off'
  return (
    <button
      type="button"
      title={`${label}: ${t.inspector.pinModes[mode]}`}
      aria-label={`${label}: ${t.inspector.pinModes[mode]}`}
      onClick={onNext}
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-[4px] text-[10px] leading-none font-semibold tabular-nums transition',
        active ? 'text-teal-950 dark:text-teal-50' : 'text-muted-foreground hover:bg-card hover:text-foreground',
      )}
    >
      {/* lights up with the pin's output right now */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-[4px] bg-teal-400/80 transition-opacity duration-150 dark:bg-teal-500/70"
        style={{ opacity: active ? 0.25 + level * 0.75 : 0 }}
      />
      <span className="relative max-w-full truncate px-0.5">{label}</span>
      <span className={cn('relative mt-0.5 text-[8px] font-medium opacity-80', mode === 'invert' && 'overline')}>
        {PIN_GLYPHS[mode]}
      </span>
    </button>
  )
}

/** A board's six output pins: tap one to change its program. */
function BoardPins({
  id,
  type,
  pins,
  levels,
  className,
}: {
  id: string
  type: BoardType
  pins: Record<string, PinMode>
  levels?: Record<string, number>
  className?: string
}) {
  const { t } = useI18n()
  const updatePart = useCircuit((s) => s.updatePart)
  const spec = BOARDS[type]
  const next = (pin: string) => {
    const modes = pinModesFor(type, pin)
    const current = pins[pin] ?? 'off'
    const mode = modes[(modes.indexOf(current) + 1) % modes.length]
    updatePart(id, { pins: { ...pins, [pin]: mode } })
    playClick(mode !== 'off')
  }
  return (
    <div
      role="group"
      aria-label={t.inspector.program}
      className={cn('nodrag node-track grid grid-cols-6 gap-0.5 p-0.5', className)}
      dir="ltr"
    >
      {spec.pins.map((pin) => (
        <PinChip
          key={pin}
          // the chips are narrow: "GP15" shows as "15" here, the header pin keeps the full name
          label={spec.label(pin).replace(/^(GPIO|GP)/, '')}
          mode={pins[pin] ?? 'off'}
          level={levels?.[pin] ?? 0}
          onNext={() => next(pin)}
        />
      ))}
    </div>
  )
}

/** The one control row under the 3D window: the quickest way for kids to play. */
function NodeControl({ id, data, result }: { id: string; data: PartData; result?: PartResult }) {
  const { t } = useI18n()
  const updatePart = useCircuit((s) => s.updatePart)
  const accent = PARTS[data.type].accent

  if (data.burnt) {
    return (
      <button
        type="button"
        className="nodrag flex h-7 w-full items-center justify-center gap-1.5 rounded-[6px] bg-foreground text-[11px] font-semibold text-background transition hover:opacity-85 active:scale-[0.98]"
        onClick={() => {
          updatePart(id, { burnt: false })
          playClick()
        }}
      >
        <Wrench className="size-3.5" aria-hidden />
        {t.node.replace}
      </button>
    )
  }

  if (isDisplay(data.type)) return <DisplayControl id={id} data={data} />

  const sensor = SENSORS[data.type]
  if (sensor) {
    const type = data.type as SensedPart
    const sense = data.sense ?? 0
    if (sensor.control === 'slider') {
      return (
        <SliderRow
          value={sense}
          label={t.sense[type]}
          text={sensor.format?.(sense) ?? `${Math.round(sense * 100)}%`}
          onChange={(v) => updatePart(id, { sense: v }, { history: false })}
        />
      )
    }
    if (sensor.control === 'hold') {
      return (
        <HoldButton
          held={sense > 0.5}
          label={t.sense[type]}
          className="bg-primary shadow-primary/30"
          onHold={(down) => {
            updatePart(id, { sense: down ? 1 : 0 }, { history: false })
            playClick(down)
          }}
        />
      )
    }
    return (
      <label className="nodrag node-track flex cursor-pointer items-center justify-between gap-2 ps-2.5 pe-1.5">
        <span
          className={cn(
            'min-w-0 truncate text-[11px] font-semibold transition-colors',
            sense > 0.5 ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
          )}
        >
          {t.sense[type]}
        </span>
        <Switch
          checked={sense > 0.5}
          aria-label={t.sense[type]}
          onCheckedChange={(on) => {
            updatePart(id, { sense: on ? 1 : 0 })
            playClick(on)
          }}
        />
      </label>
    )
  }

  // the Zener, MOSFET, chips, multimeter … have their rows in LabControls
  if (hasLabControl(data.type)) return <LabControl id={id} data={data} result={result} />

  switch (data.type) {
    case 'battery':
      return (
        <div
          role="radiogroup"
          aria-label={t.inspector.batteryVoltage}
          className="nodrag node-track grid gap-0.5 p-0.5"
          style={{ gridTemplateColumns: `repeat(${BATTERY_VOLTAGES.length}, minmax(0, 1fr))` }}
          dir="ltr"
        >
          {BATTERY_VOLTAGES.map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={data.voltage === v}
              aria-label={`${v} ${t.units.volt}`}
              onClick={() => updatePart(id, { voltage: v })}
              className={cn(
                'min-w-0 rounded-[4px] text-[11px] font-semibold tracking-tight tabular-nums transition',
                data.voltage === v
                  ? 'bg-amber-400 text-amber-950 shadow-sm'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground',
              )}
            >
              {v}
              {/* six sizes share the row, so the unit is small */}
              <span className="text-[8.5px] font-bold opacity-70">V</span>
            </button>
          ))}
        </div>
      )
    case 'lemon':
      return (
        <LemonTrack
          value={lemonCount(data)}
          label={t.inputs.lemons}
          optionLabel={t.inputs.lemonCount}
          onChange={(cells) => {
            updatePart(id, { cells })
            playClick()
          }}
        />
      )
    case 'coinCell': {
      // a load pulls the little cell's volts down: the bar shows how far
      const volts = Math.max(0, result?.voltage ?? 0)
      return (
        <MeterRow fraction={volts / 3} text={`${volts.toFixed(1)} V`} color="#a1a1aa" label={t.inputs.volts} />
      )
    }
    case 'dynamo': {
      const speed = data.level ?? 0
      return (
        <SliderRow
          value={speed}
          label={t.inputs.crank}
          text={`${dynamoVoltage(speed).toFixed(1)} V`}
          icon={
            <RotateCw
              aria-hidden
              className="size-3.5 shrink-0 text-orange-600 motion-safe:animate-spin dark:text-orange-400"
              // the little crank turns as fast as the big one, and stops with it
              style={{ animationDuration: `${1.6 / Math.max(0.05, speed)}s`, animationPlayState: speed > 0.01 ? 'running' : 'paused' }}
            />
          }
          onChange={(v) => updatePart(id, { level: v }, { history: false })}
        />
      )
    }
    case 'powerBank':
      return (
        <MeterRow
          fraction={Math.abs(result?.current ?? 0) / 2}
          text={formatCurrent(result?.current ?? 0)}
          color={accent}
          label={t.inspector.current}
        />
      )
    case 'slideSwitch':
      return (
        <SlideSwitchRow
          toB={!!data.closed}
          label={`${t.inputs.slideTo} ${data.closed ? 'B' : 'A'}`}
          onToggle={() => {
            updatePart(id, { closed: !data.closed })
            playClick(true)
          }}
        />
      )
    case 'microSwitch':
      return (
        <HoldButton
          held={!!data.pressed}
          label={t.inputs.lever}
          className="bg-rose-600 shadow-rose-600/30"
          onHold={(down) => {
            if (!down && !useCircuit.getState().nodes.find((n) => n.id === id)?.data.pressed) return
            updatePart(id, { pressed: down }, { history: false })
            playClick(down)
          }}
        />
      )
    case 'joystick':
      return (
        <StickRow
          x={data.stickX ?? 0.5}
          y={data.stickY ?? 0.5}
          labels={{ x: t.inputs.stickX, y: t.inputs.stickY }}
          onChange={(next) => updatePart(id, next, { history: false })}
        />
      )
    case 'fuse':
      return (
        <div
          role="radiogroup"
          aria-label={t.inspector.rating}
          className="nodrag node-track grid grid-cols-3 gap-0.5 p-0.5"
          dir="ltr"
        >
          {FUSE_RATINGS.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={(data.rating ?? 0.5) === a}
              onClick={() => updatePart(id, { rating: a })}
              className={cn(
                'rounded-[4px] text-[11px] font-semibold tabular-nums transition',
                (data.rating ?? 0.5) === a
                  ? 'bg-slate-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground',
              )}
            >
              {formatAmps(a)}
            </button>
          ))}
        </div>
      )
    case 'solar':
    case 'ldr': {
      const light = data.light ?? (data.type === 'solar' ? 0.8 : 0.6)
      return (
        <SliderRow
          value={light}
          label={t.inspector.light}
          text={`${Math.round(light * 100)}%`}
          icon={<Sun className="size-3.5 shrink-0 text-amber-500" aria-hidden />}
          onChange={(v) => updatePart(id, { light: v }, { history: false })}
        />
      )
    }
    case 'arduino':
    case 'nano':
    case 'mega':
    case 'esp32':
    case 'esp8266':
    case 'pico':
    case 'microbit':
    case 'raspberrypi':
    case 'ecu':
    case 'plc':
    case 'rtu':
      return <BoardPins id={id} type={data.type} pins={data.pins ?? {}} levels={result?.pins} />
    case 'aiBoard':
      // the pins as on every board, and a button to talk to it
      return (
        <div className="flex gap-1">
          <BoardPins id={id} type="aiBoard" pins={data.pins ?? {}} levels={result?.pins} className="min-w-0 flex-1" />
          <AiAskButton id={id} />
        </div>
      )
    case 'capacitor': {
      const volts = result?.level ?? 0
      return (
        <MeterRow
          fraction={Math.abs(volts) / 9}
          text={`${Math.abs(volts).toFixed(1)} V`}
          color={accent}
          label={t.inspector.charge}
        />
      )
    }
    case 'diode':
    case 'transistor':
    case 'pnp':
      return (
        <MeterRow
          fraction={Math.abs(result?.current ?? 0) / 0.3}
          text={formatCurrent(result?.current ?? 0)}
          color={accent}
          label={t.inspector.current}
        />
      )
    case 'voltmeter':
    case 'ammeter': {
      const volts = data.type === 'voltmeter'
      const value = result?.level ?? 0
      return (
        <div
          role="status"
          aria-label={volts ? t.inspector.voltage : t.inspector.current}
          className="lcd flex h-7 items-center justify-end gap-1 rounded-[6px] px-2.5"
          dir="ltr"
        >
          <span className="font-mono text-[15px] leading-none font-semibold tabular-nums">
            {volts ? value.toFixed(2) : Math.abs(value) < 1 ? Math.round(value * 1000) : value.toFixed(2)}
          </span>
          <span className="text-[10px] font-semibold opacity-75">
            {volts ? t.units.volt : Math.abs(value) < 1 ? t.units.milliamp : t.units.amp}
          </span>
        </div>
      )
    }
    case 'servo':
      return (
        <MeterRow
          fraction={result?.level ?? 0}
          text={`${Math.round((result?.level ?? 0) * 180)}°`}
          color={accent}
          label={t.inspector.angle}
        />
      )
    case 'switch':
      return (
        <label className="nodrag node-track flex cursor-pointer items-center justify-between ps-2.5 pe-1.5">
          <span
            className={cn(
              'text-[11px] font-semibold transition-colors',
              data.closed ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
            )}
          >
            {data.closed ? t.node.on : t.node.off}
          </span>
          <Switch
            checked={!!data.closed}
            aria-label={t.parts.switch.name}
            onCheckedChange={(closed) => {
              updatePart(id, { closed })
              playClick(closed)
            }}
          />
        </label>
      )
    case 'button':
      return (
        <HoldButton
          held={!!data.pressed}
          label={t.node.press}
          className="bg-pink-500 shadow-pink-500/30"
          onHold={(down) => {
            if (!down && !useCircuit.getState().nodes.find((n) => n.id === id)?.data.pressed) return
            updatePart(id, { pressed: down }, { history: false })
            playClick(down)
          }}
        />
      )
    case 'dimmer': {
      const level = data.level ?? 0.7
      return (
        <SliderRow
          value={level}
          label={t.inspector.knob}
          text={`${Math.round(level * 100)}%`}
          onChange={(v) => updatePart(id, { level: v }, { history: false })}
        />
      )
    }
    case 'resistor': {
      const values = RESISTOR_VALUES as readonly number[]
      const index = Math.max(0, values.indexOf(data.resistance ?? 100))
      const step = (delta: number) => {
        const next = values[Math.min(values.length - 1, Math.max(0, index + delta))]
        if (next !== data.resistance) updatePart(id, { resistance: next })
      }
      return (
        <div className="nodrag node-track flex items-center p-0.5" dir="ltr">
          <StepButton label={`${t.inspector.resistance} −`} onClick={() => step(-1)} disabled={index === 0}>
            <Minus className="size-3.5" />
          </StepButton>
          <span className="flex-1 text-center text-[11px] font-semibold tabular-nums">
            {formatOhms(data.resistance ?? 100)}
          </span>
          <StepButton
            label={`${t.inspector.resistance} +`}
            onClick={() => step(1)}
            disabled={index === values.length - 1}
          >
            <Plus className="size-3.5" />
          </StepButton>
        </div>
      )
    }
    case 'powerSupply': {
      const volts = data.voltage ?? 5
      return (
        <SliderRow
          value={volts / 12}
          steps={120}
          label={t.workshop.voltage}
          text={`${volts.toFixed(1)} V`}
          onChange={(v) => updatePart(id, { voltage: Math.round(v * 120) / 10 }, { history: false })}
        />
      )
    }
    case 'potentiometer': {
      const level = data.level ?? 0.5
      // once it has volts across it, the card shows what the wiper gives
      const powered = Math.abs(result?.voltage ?? 0) > 0.05
      return (
        <SliderRow
          value={level}
          label={t.inspector.knob}
          text={powered ? `${Math.abs(result?.level ?? 0).toFixed(1)} V` : `${Math.round(level * 100)}%`}
          onChange={(v) => updatePart(id, { level: v }, { history: false })}
        />
      )
    }
    case 'relay': {
      const closed = (result?.level ?? 0) > 0.5
      return (
        <RelayRow
          closed={closed}
          coil={result?.voltage ?? 0}
          text={closed ? t.workshop.closed : t.workshop.open}
        />
      )
    }
    case 'rgbLed':
      return <RgbBars channels={result?.channels} label={t.inspector.brightness} />
    case 'buzzer':
      // the four sounds by their place in BUZZER_SOUNDS: beep, siren, fast siren, two-tone
      return (
        <ChoiceTrack
          options={[0, 1, 2, 3]}
          value={Math.max(0, BUZZER_SOUNDS.indexOf(data.sound ?? 'beep'))}
          labels={t.workshop.sounds}
          label={t.workshop.sound}
          onChange={(i) => {
            updatePart(id, { sound: BUZZER_SOUNDS[i] })
            playClick()
          }}
        />
      )
    case 'speaker':
      return (
        <ChoiceTrack
          options={SPEAKER_NOTES}
          value={(data.pitch ?? 523) as (typeof SPEAKER_NOTES)[number]}
          labels={t.workshop.notes}
          label={t.workshop.note}
          onChange={(pitch) => {
            updatePart(id, { pitch })
            playClick()
          }}
        />
      )
    case 'vibration':
    case 'electromagnet': {
      const magnet = data.type === 'electromagnet'
      const level = Math.abs(result?.level ?? 0)
      const Icon = magnet ? Magnet : Vibrate
      return (
        <MeterRow
          fraction={magnet ? level : level / 1.8}
          text={`${Math.round(Math.min(1, magnet ? level : level / 1.8) * 100)}%`}
          color={accent}
          label={magnet ? t.workshop.strength : t.workshop.shake}
          icon={<Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
        />
      )
    }
    case 'regulator': {
      const vin = Math.max(0, result?.channels?.in ?? 0)
      const vout = Math.max(0, result?.voltage ?? 0)
      return (
        <LcdRow label={`${t.workshop.regulatorIn} ${vin.toFixed(1)} V, ${t.workshop.regulatorOut} ${vout.toFixed(2)} V`}>
          <span className="text-[11px] opacity-70">{vin.toFixed(1)}V</span>
          <span aria-hidden className="text-[11px] opacity-50">→</span>
          <span>{vout.toFixed(2)}</span>
          <span className="text-[10px] opacity-75">{t.units.volt}</span>
        </LcdRow>
      )
    }
    case 'notGate':
    case 'andGate':
    case 'orGate':
    case 'xorGate':
    case 'nandGate':
    case 'norGate':
      return <GateLamps type={data.type} channels={result?.channels} label={t.parts[data.type].description} />
    case 'timer555':
      return (
        <ChoiceTrack
          options={TIMER_RATES}
          value={(data.rate ?? 1) as (typeof TIMER_RATES)[number]}
          labels={t.workshop.speeds}
          label={t.workshop.speed}
          onChange={(rate) => {
            updatePart(id, { rate })
            playClick()
          }}
        />
      )
    case 'oscilloscope': {
      const volts = result?.voltage ?? 0
      const span = data.span ?? 5
      const next = SCOPE_SPANS[(SCOPE_SPANS.indexOf(span as (typeof SCOPE_SPANS)[number]) + 1) % SCOPE_SPANS.length]
      return (
        <LcdRow
          label={t.workshop.scopeReading}
          after={
            <button
              type="button"
              aria-label={`${t.workshop.span}: ${t.workshop.seconds(span)}`}
              title={t.workshop.span}
              onClick={() => updatePart(id, { span: next })}
              className="nodrag node-track grid w-10 shrink-0 place-items-center text-[11px] font-semibold text-muted-foreground tabular-nums transition hover:text-foreground"
            >
              {span}s
            </button>
          }
        >
          <span>{volts.toFixed(2)}</span>
          <span className="text-[10px] opacity-75">{t.units.volt}</span>
        </LcdRow>
      )
    }
    default: {
      const level = result?.level ?? 0
      const percent = outputPercent(data.type, level)
      const Direction = level < 0 ? RotateCcw : RotateCw
      return (
        <div
          className="node-track flex items-center gap-2 px-2.5"
          dir="ltr"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={data.type === 'motor' ? t.inspector.speed : t.inspector.brightness}
        >
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: accent }}
              animate={{ width: `${percent}%` }}
              transition={{ type: 'spring', stiffness: 160, damping: 22 }}
            />
          </div>
          {data.type === 'motor' && percent > 0 && (
            <Direction className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <span className="w-8 shrink-0 text-end text-[11px] font-semibold text-muted-foreground tabular-nums">
            {percent}%
          </span>
        </div>
      )
    }
  }
}

function PartNodeComponent({ id, data, selected }: NodeProps<PartNodeType>) {
  const { t, lang } = useI18n()
  const result = useSimulation((s) => s.result.parts[id])
  const updateNodeInternals = useUpdateNodeInternals()
  const status = partStatus(data, result)
  const def = PARTS[data.type]
  const glow = glowColor(data, result)
  const glowLevel = data.burnt ? 0 : Math.min(1.3, result?.level ?? 0)
  const active = status === 'on' || status === 'weak' || status === 'over'

  // screens grow with their size, and their card with them
  const screen = isDisplay(data.type) ? displayGeometry(data) : null
  const width = screen?.width ?? partWidth(data.type)

  // handles move when the part is rotated or a screen changes size
  useEffect(
    () => updateNodeInternals(id),
    [id, data.rotation, width, screen?.height, updateNodeInternals],
  )

  // switches and buttons show their lever position, not whether current flows
  const mechanical =
    data.type === 'switch'
      ? !!data.closed
      : data.type === 'button' || data.type === 'microSwitch'
        ? !!data.pressed
        : null
  const chipStatus: PartStatus = mechanical === null ? status : mechanical ? 'on' : 'idle'
  // a message module that is still joining its network says so
  const joining = isRadio(data.type) && chipStatus === 'on' && (result?.channels?.link ?? 0) < 0.5
  // the two-way switch is always joined to one side: it says which one, and lights up while current flows
  const statusLabel =
    data.type === 'slideSwitch'
      ? data.closed
        ? t.inputs.toB
        : t.inputs.toA
      : joining && isRadio(data.type)
        ? t.radio.joining[data.type]
        : chipStatus === 'on'
          ? t.parts[data.type].working
          : t.status[chipStatus]
  // an AI board waiting for its model says so on its title row
  const thinking = useAiChat((s) => data.type === 'aiBoard' && s.pending[id] !== undefined)

  return (
    // The wrapper has no background so the light glow (z-index −1) lands on the
    // board *behind* the card instead of tinting the card itself.
    <div className="relative" style={{ width }}>
      {glow && (
        <div
          aria-hidden
          className="part-node__light"
          style={{
            background: `radial-gradient(circle, ${glow} 0%, transparent 65%)`,
            opacity: glowLevel * 0.55,
            transform: `translate(-50%, -50%) scale(${0.6 + glowLevel * 0.5})`,
          }}
        />
      )}
      <div
        className={cn(
          'part-node',
          // header pins stand on the card edge, so the inside keeps clear of them
          Object.values(def.terminals).some((d) => d.pin) && 'part-node--pins',
          selected && 'part-node--selected',
          active && 'part-node--active',
          status === 'short' && 'part-node--danger',
          thinking && 'part-node--thinking',
        )}
        style={{ ['--part-accent' as string]: def.accent }}
      >
        <CardTitle
          name={t.parts[data.type].name}
          status={chipStatus}
          label={thinking ? aiBookFor(lang).thinking : statusLabel}
          thinking={thinking}
        />
        {/* the 3D model (or a screen's front) is drawn only inside this framed window */}
        <div className="part-node__stage" style={screen ? { height: screen.faceHeight } : undefined}>
          <Suspense fallback={null}>
            {screen ? (
              <DisplayFace data={data} result={result} />
            ) : data.type === 'oscilloscope' ? (
              <ScopeFace id={id} data={data} />
            ) : (
              <PartView data={data} result={result} thinking={thinking} />
            )}
          </Suspense>
          {data.type === 'irLed' && data.camera && <CameraViewfinder />}
        </div>
        <div className="part-node__control">
          <NodeControl id={id} data={data} result={result} />
        </div>
      </div>
      {Object.entries(def.terminals).map(([terminal, terminalDef]) => (
        <Terminal key={terminal} id={terminal} def={terminalDef} rotation={data.rotation} />
      ))}
    </div>
  )
}

export const PartNode = memo(PartNodeComponent)
