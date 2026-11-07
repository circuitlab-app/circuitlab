import { SlidingNumber } from '@animate-ui/react/primitives/texts/sliding-number'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { Copy } from '@/components/animate-ui/icons/copy'
import { Flame } from '@/components/animate-ui/icons/flame'
import { RotateCcw } from '@/components/animate-ui/icons/rotate-ccw'
import { Trash2 } from '@/components/animate-ui/icons/trash-2'
import { TriangleAlert } from '@/components/animate-ui/icons/triangle-alert'
import { Unplug } from '@/components/animate-ui/icons/unplug'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  BATTERY_VOLTAGES,
  BEACON_COLORS,
  BOARDS,
  CAPACITOR_VALUES,
  FUSE_RATINGS,
  LEMON_COUNTS,
  dynamoVoltage,
  lemonCount,
  LAMP_COLORS,
  LED_COLORS,
  LED_FORWARD_VOLTAGE,
  PARTS,
  POT_VALUES,
  RESISTOR_VALUES,
  SCOPE_SPANS,
  SENSORS,
  SENSOR_MODES,
  WIRE_COLORS,
  formatAmps,
  formatFarads,
  formatOhms,
  isGate,
  isRadio,
  isRotatable,
  isSensorModule,
  pinModesFor,
  SPEAKER_NOTES,
  BUZZER_SOUNDS,
  SUPPLY_LIMITS,
  supplySettings,
  TIMER_RATES,
  type BoardType,
  type SensedPart,
} from '@/circuit/catalog'
import { isDisplay } from '@/circuit/display'
import { MISSION_IDS } from '@/circuit/missions'
import type { PartResult, PartStatus } from '@/circuit/solver'
import type { LampColor, LedColor, PartData, PinMode, WireColor, WireEdge } from '@/circuit/types'
import { useI18n, type Dictionary } from '@/i18n'
import { playClick } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { selectSelectedWire, useCircuit, useSelectedPart, type SelectedPart } from '@/store/circuit'
import { useSettings } from '@/store/settings'
import { useSimulation } from '@/store/simulation'
import { BasicsLesson, PartLesson, ResistorColorCode } from './LearnPanel'
import { Missions } from './Missions'
import { DisplaySettings } from './DisplaySettings'
import { PartArt } from './PartArt'
import { STATUS_STYLE, partStatus } from './PartNode'
import { TruthTable } from './TruthTable'
import { LabExtras, LabSettings } from './LabInspector'
import { LAB_WITHOUT_SETTINGS, labTip } from './labRules'
import { RadioReceiver, SmsSettings } from './RadioPanels'
import { boardCode } from '@/circuit/code'
import { useAiChat } from '@/ai/store'
import { useAiBook } from '@/i18n/ai'
import { AiChat } from './AiChat'
import { aiCodeHeader, useLastRequest } from '@/ai/code'

type Tip = { text: string; tone: 'warn' | 'info' | 'danger' }

function tipFor(data: PartData, result: PartResult | undefined, status: PartStatus, t: Dictionary, running: boolean): Tip | null {
  if (status === 'burnt') return { text: data.type === 'fuse' ? t.tips.fuseBlown : t.tips.burnt, tone: 'danger' }
  if (!running || !result) return null
  if (isSensorModule(data.type)) return status === 'on' ? null : { text: t.tips.sensorPower, tone: 'info' }
  if (isDisplay(data.type)) {
    if (status === 'reverse') return { text: t.tips.displayReverse, tone: 'warn' }
    if (status === 'weak') return { text: t.tips.displayWeak, tone: 'info' }
    if (status !== 'on') return { text: t.tips.displayPower, tone: 'info' }
    const reads = (data.type === 'segment' && data.mode === 'volts') || (data.type === 'oled' && data.mode === 'graph')
    return reads && result.level < 0.02 ? { text: t.tips.displaySignal, tone: 'info' } : null
  }
  // the Zener, MOSFET, chips, multimeter … have their tips in LabInspector
  const lab = labTip(data, result, status, t)
  if (lab !== undefined) return lab
  const w = t.workshop.tips
  if (isGate(data.type) || data.type === 'timer555') {
    // a chip needs its supply before anything else
    if (status === 'reverse') return { text: w.chipReverse, tone: 'warn' }
    if (status === 'weak') return { text: data.type === 'timer555' ? w.timerWeak : w.chipWeak, tone: 'info' }
    return result.voltage < 0.5 ? { text: w.chipPower, tone: 'info' } : null
  }
  const k = t.inputs.tips
  switch (data.type) {
    case 'powerSupply':
      if (status === 'over') return { text: w.supplyLimit, tone: 'warn' }
      return status === 'idle' ? { text: t.tips.batteryIdle, tone: 'info' } : null
    case 'lemon':
      if (status !== 'idle') return { text: k.lemonTiny, tone: 'info' }
      return { text: lemonCount(data) < 3 ? k.lemonMore : t.tips.batteryIdle, tone: 'info' }
    case 'coinCell':
      if (status === 'idle') return { text: t.tips.batteryIdle, tone: 'info' }
      // a big load pulls its volts right down
      return result.voltage < 2 ? { text: k.coinSag, tone: 'info' } : null
    case 'dynamo':
      if ((data.level ?? 0) < 0.02) return { text: k.crank, tone: 'info' }
      return status === 'idle' ? { text: t.tips.batteryIdle, tone: 'info' } : null
    case 'powerBank':
      if (status === 'over') return { text: k.bankLimit, tone: 'warn' }
      return status === 'idle' ? { text: t.tips.batteryIdle, tone: 'info' } : null
    case 'slideSwitch':
      return status === 'idle' ? { text: k.slideHint, tone: 'info' } : null
    case 'microSwitch':
      return status === 'idle' ? { text: k.microHint, tone: 'info' } : null
    case 'joystick':
      return status === 'on' ? null : { text: k.joystickPower, tone: 'info' }
    case 'potentiometer':
      if (status === 'over') return { text: w.potHot, tone: 'warn' }
      return Math.abs(result.voltage) < 0.05 ? { text: w.potHint, tone: 'info' } : null
    case 'relay':
      if (status === 'weak') return { text: w.relayWeak, tone: 'info' }
      return status === 'idle' ? { text: w.relayHint, tone: 'info' } : null
    case 'rgbLed':
      if (status === 'reverse') return { text: t.tips.ledReverse, tone: 'warn' }
      if (status === 'over') return { text: t.tips.ledOver, tone: 'warn' }
      return status === 'idle' ? { text: w.rgbHint, tone: 'info' } : null
    case 'speaker':
      return status === 'over' ? { text: w.speakerOver, tone: 'warn' } : null
    case 'vibration':
      if (status === 'weak') return { text: t.tips.motorWeak, tone: 'info' }
      return status === 'over' ? { text: t.tips.motorOver, tone: 'warn' } : null
    case 'electromagnet':
      return status === 'over' ? { text: w.magnetHot, tone: 'warn' } : null
    case 'regulator':
      if (status === 'reverse') return { text: w.chipReverse, tone: 'warn' }
      if (status === 'over') return { text: w.regulatorHot, tone: 'warn' }
      if (status === 'weak') return { text: w.regulatorLow, tone: 'info' }
      return status === 'idle' ? { text: w.regulatorHint, tone: 'info' } : null
    case 'oscilloscope':
      return status === 'idle' ? { text: w.scopeHint, tone: 'info' } : null
    case 'fuse':
      return status === 'over' ? { text: t.tips.fuseNear, tone: 'warn' } : null
    case 'capacitor':
      return status === 'reverse' ? { text: t.tips.capacitorReverse, tone: 'warn' } : null
    case 'diode':
      return result.voltage < -0.5 ? { text: t.tips.diodeReverse, tone: 'info' } : null
    case 'transistor':
      return status === 'idle' ? { text: t.tips.transistorBase, tone: 'info' } : null
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
      if (status === 'over') return { text: t.tips.arduinoPin, tone: 'warn' }
      return Object.values(data.pins ?? {}).some((mode) => SENSOR_MODES.includes(mode))
        ? { text: t.tips.followHint, tone: 'info' }
        : null
    case 'aiBoard':
      // the chat right below explains the rest
      return status === 'over' ? { text: t.tips.arduinoPin, tone: 'warn' } : null
    case 'solar':
      return (data.light ?? 0.8) < 0.15 ? { text: t.tips.solarDark, tone: 'info' } : null
    case 'voltmeter':
    case 'ammeter':
      return status === 'reverse' ? { text: t.tips.meterReverse, tone: 'warn' } : null
    case 'servo':
      return status === 'on' ? null : { text: t.tips.servoPower, tone: 'info' }
    case 'battery':
      if (status === 'short') return { text: t.tips.short, tone: 'danger' }
      if (status === 'idle') return { text: t.tips.batteryIdle, tone: 'info' }
      return null
    case 'lamp':
      if (status === 'weak') return { text: t.tips.lampWeak, tone: 'info' }
      if (status === 'over') return { text: t.tips.lampOver, tone: 'warn' }
      return null
    case 'led': {
      if (status === 'reverse') return { text: t.tips.ledReverse, tone: 'warn' }
      if (status === 'over') return { text: t.tips.ledOver, tone: 'warn' }
      const vf = LED_FORWARD_VOLTAGE[(data.color as LedColor) ?? 'red']
      if (status === 'idle' && result.voltage > 0.3 && result.voltage < vf) return { text: t.tips.ledOff, tone: 'info' }
      return null
    }
    case 'motor':
      if (status === 'weak') return { text: t.tips.motorWeak, tone: 'info' }
      if (status === 'over') return { text: t.tips.motorOver, tone: 'warn' }
      if (result.level < 0) return { text: t.tips.motorReverse, tone: 'info' }
      return null
    case 'resistor':
    case 'dimmer':
      return status === 'over' ? { text: t.tips.resistorHot, tone: 'warn' } : null
    default:
      return null
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground">{title}</h4>
      {children}
    </section>
  )
}

function Reading({ label, value, unit, decimals }: { label: string; value: number; unit: string; decimals: number }) {
  return (
    <div className="rounded-xl border bg-card px-2.5 py-2 shadow-[var(--shadow-card)]">
      <div className="truncate text-[11px] text-muted-foreground">{label}</div>
      <div dir="ltr" className="flex items-baseline justify-end gap-1 font-mono text-[15px] font-semibold tabular-nums">
        <SlidingNumber number={Number(value.toFixed(decimals))} decimalPlaces={decimals} />
        <span className="text-xs font-semibold text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}

function CurrentReading({ label, amps }: { label: string; amps: number }) {
  const { t } = useI18n()
  const a = Math.abs(amps)
  return a < 1 ? (
    <Reading label={label} value={Math.round(a * 1000)} unit={t.units.milliamp} decimals={0} />
  ) : (
    <Reading label={label} value={a} unit={t.units.amp} decimals={2} />
  )
}

function Swatches<T extends string>({
  value,
  colors,
  labels,
  onChange,
}: {
  value: T
  colors: Record<T, string>
  labels: Record<string, string>
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(colors) as T[]).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-pressed={c === value}
          className={cn(
            'flex items-center gap-1.5 rounded-full border py-1 ps-1 pe-2.5 text-xs font-medium transition hover:bg-muted',
            c === value && 'border-primary bg-primary/10',
          )}
        >
          <span className="size-4 rounded-full border border-black/10 shadow-inner" style={{ background: colors[c] }} />
          {labels[c]}
        </button>
      ))}
    </div>
  )
}

function PartSettings({ node }: { node: SelectedPart }) {
  const { t } = useI18n()
  const updatePart = useCircuit((s) => s.updatePart)
  const { id, data } = node
  // screens have many settings of their own
  if (isDisplay(data.type)) return <DisplaySettings node={node} />
  if (data.type === 'multimeter' || data.type === 'irLed') return <LabSettings node={node} />
  if (data.type === 'gsm') return <SmsSettings node={node} />

  switch (data.type) {
    case 'battery':
      return (
        <ToggleGroup
          type="single"
          variant="outline"
          className="w-full"
          dir="ltr"
          value={String(data.voltage ?? 3)}
          onValueChange={(v) => v && updatePart(id, { voltage: Number(v) })}
        >
          {BATTERY_VOLTAGES.map((v) => (
            <ToggleGroupItem key={v} value={String(v)} className="flex-1 font-bold">
              {v}V
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )
    case 'lamp':
      return (
        <Swatches
          value={(data.color as LampColor) ?? 'warm'}
          colors={LAMP_COLORS}
          labels={t.colors}
          onChange={(color) => updatePart(id, { color })}
        />
      )
    case 'led':
      return (
        <Swatches
          value={(data.color as LedColor) ?? 'red'}
          colors={LED_COLORS}
          labels={t.colors}
          onChange={(color) => updatePart(id, { color })}
        />
      )
    case 'beacon':
      return (
        <Swatches
          value={(data.color as (typeof BEACON_COLORS)[number]) ?? 'orange'}
          colors={Object.fromEntries(BEACON_COLORS.map((c) => [c, LED_COLORS[c]])) as Record<(typeof BEACON_COLORS)[number], string>}
          labels={t.colors}
          onChange={(color) => updatePart(id, { color })}
        />
      )
    case 'resistor':
      return (
        <Select value={String(data.resistance ?? 100)} onValueChange={(v) => updatePart(id, { resistance: Number(v) })}>
          <SelectTrigger className="w-full" dir="ltr">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESISTOR_VALUES.map((v) => (
              <SelectItem key={v} value={String(v)}>
                {formatOhms(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case 'dimmer':
      return (
        <div className="space-y-2 rounded-xl border p-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t.inspector.knob}</span>
            <span className="font-bold tabular-nums" dir="ltr">
              {Math.round((data.level ?? 0.7) * 100)}%
            </span>
          </div>
          <div dir="ltr">
            <Slider
              min={0}
              max={100}
              step={1}
              value={[Math.round((data.level ?? 0.7) * 100)]}
              onValueChange={([v]) => updatePart(id, { level: v / 100 }, { history: false })}
              onValueCommit={() => useCircuit.getState().checkpoint()}
            />
          </div>
        </div>
      )
    case 'switch':
      return (
        <label className="flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm font-semibold">
          {t.inspector.switchState}: {data.closed ? t.inspector.on : t.inspector.off}
          <Switch
            checked={!!data.closed}
            onCheckedChange={(closed) => {
              updatePart(id, { closed })
              playClick(closed)
            }}
          />
        </label>
      )
    case 'capacitor':
      // seven sizes: a list keeps them tidy
      return (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">{t.inspector.capacitance}</p>
          <Select
            value={String(data.capacitance ?? 2200)}
            onValueChange={(v) => updatePart(id, { capacitance: Number(v) })}
          >
            <SelectTrigger className="w-full" dir="ltr" aria-label={t.inspector.capacitance}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CAPACITOR_VALUES.map((v) => (
                <SelectItem key={v} value={String(v)}>
                  {formatFarads(v)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    case 'lemon':
      return (
        <ChoiceRow
          label={t.inputs.lemons}
          value={lemonCount(data) as (typeof LEMON_COUNTS)[number]}
          options={LEMON_COUNTS}
          format={(n) => String(n)}
          onChange={(cells) => updatePart(id, { cells })}
        />
      )
    case 'dynamo':
      return (
        <SliderBox
          label={t.inputs.crank}
          value={data.level ?? 0}
          text={`${dynamoVoltage(data.level ?? 0).toFixed(1)} V`}
          onChange={(level) => updatePart(id, { level }, { history: false })}
        />
      )
    case 'slideSwitch':
      return (
        <ChoiceRow
          label={t.inputs.slideTo}
          value={data.closed ? 1 : 0}
          options={[0, 1] as const}
          format={(side) => (side ? 'B' : 'A')}
          onChange={(side) => {
            updatePart(id, { closed: side === 1 })
            playClick(true)
          }}
        />
      )
    case 'joystick':
      return (
        <div className="space-y-3">
          <SliderBox
            label={`X · ${t.inputs.stickX}`}
            value={data.stickX ?? 0.5}
            text={`${Math.round((data.stickX ?? 0.5) * 100)}%`}
            onChange={(stickX) => updatePart(id, { stickX }, { history: false })}
          />
          <SliderBox
            label={`Y · ${t.inputs.stickY}`}
            value={data.stickY ?? 0.5}
            text={`${Math.round((data.stickY ?? 0.5) * 100)}%`}
            onChange={(stickY) => updatePart(id, { stickY }, { history: false })}
          />
        </div>
      )
    case 'fuse':
      return (
        <ChoiceRow
          label={t.inspector.rating}
          value={data.rating ?? 0.5}
          options={FUSE_RATINGS}
          format={formatAmps}
          onChange={(rating) => updatePart(id, { rating })}
        />
      )
    case 'solar':
    case 'ldr':
      return (
        <SliderBox
          label={t.inspector.light}
          value={data.light ?? 0.6}
          text={`${Math.round((data.light ?? 0.6) * 100)}%`}
          onChange={(light) => updatePart(id, { light }, { history: false })}
        />
      )
    case 'arduino':
    case 'nano':
    case 'mega':
    case 'esp32':
    case 'esp8266':
    case 'pico':
    case 'microbit':
    case 'raspberrypi':
    case 'aiBoard':
    case 'ecu':
    case 'plc':
    case 'rtu':
      return <BoardProgram node={node} />
    case 'powerSupply': {
      const { voltage, limit } = supplySettings(data)
      return (
        <div className="space-y-3">
          <SliderBox
            label={t.workshop.voltage}
            value={voltage / 12}
            steps={120}
            text={`${voltage.toFixed(1)} V`}
            onChange={(v) => updatePart(id, { voltage: Math.round(v * 120) / 10 }, { history: false })}
          />
          <ChoiceRow
            label={t.workshop.limit}
            value={limit as (typeof SUPPLY_LIMITS)[number]}
            options={SUPPLY_LIMITS}
            format={formatAmps}
            onChange={(next) => updatePart(id, { limit: next })}
          />
          <p className="text-xs leading-relaxed text-muted-foreground">{t.workshop.limitHint}</p>
        </div>
      )
    }
    case 'potentiometer':
      return (
        <div className="space-y-3">
          <SliderBox
            label={t.inspector.knob}
            value={data.level ?? 0.5}
            text={`${Math.round((data.level ?? 0.5) * 100)}%`}
            onChange={(level) => updatePart(id, { level }, { history: false })}
          />
          <ChoiceRow
            label={t.workshop.knobSize}
            value={(data.resistance ?? 1000) as (typeof POT_VALUES)[number]}
            options={POT_VALUES}
            format={formatOhms}
            onChange={(resistance) => updatePart(id, { resistance })}
          />
        </div>
      )
    case 'buzzer': {
      // the four sounds by their place in BUZZER_SOUNDS: beep, siren, fast siren, two-tone
      const sound = Math.max(0, BUZZER_SOUNDS.indexOf(data.sound ?? 'beep'))
      return (
        <div className="space-y-1.5">
          <ChoiceRow
            label={t.workshop.sound}
            value={sound}
            options={[0, 1, 2, 3]}
            format={(i) => t.workshop.sounds[i]}
            onChange={(i) => updatePart(id, { sound: BUZZER_SOUNDS[i] })}
          />
          <p className="text-xs text-muted-foreground">{t.workshop.soundHints[sound]}</p>
        </div>
      )
    }
    case 'speaker':
      return (
        <ChoiceRow
          label={t.workshop.note}
          value={(data.pitch ?? 523) as (typeof SPEAKER_NOTES)[number]}
          options={SPEAKER_NOTES}
          format={(pitch) => t.workshop.notes[SPEAKER_NOTES.indexOf(pitch)]}
          onChange={(pitch) => updatePart(id, { pitch })}
        />
      )
    case 'timer555': {
      const rate = (data.rate ?? 1) as (typeof TIMER_RATES)[number]
      return (
        <div className="space-y-1.5">
          <ChoiceRow
            label={t.workshop.speed}
            value={rate}
            options={TIMER_RATES}
            format={(r) => t.workshop.speeds[TIMER_RATES.indexOf(r)]}
            onChange={(next) => updatePart(id, { rate: next })}
          />
          <p className="text-xs text-muted-foreground">{t.workshop.perSecond(rate)}</p>
        </div>
      )
    }
    case 'oscilloscope':
      return (
        <ChoiceRow
          label={t.workshop.span}
          value={(data.span ?? 5) as (typeof SCOPE_SPANS)[number]}
          options={SCOPE_SPANS}
          format={t.workshop.seconds}
          onChange={(span) => updatePart(id, { span })}
        />
      )
    default: {
      const sensor = SENSORS[data.type]
      if (!sensor) return null
      const type = data.type as SensedPart
      const sense = data.sense ?? 0
      if (sensor.control === 'slider') {
        return (
          <SliderBox
            label={t.sense[type]}
            value={sense}
            text={sensor.format?.(sense) ?? `${Math.round(sense * 100)}%`}
            onChange={(v) => updatePart(id, { sense: v }, { history: false })}
          />
        )
      }
      return (
        <label className="flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm font-semibold">
          {t.sense[type]}
          <Switch
            checked={sense > 0.5}
            onCheckedChange={(on) => {
              updatePart(id, { sense: on ? 1 : 0 })
              playClick(on)
            }}
          />
        </label>
      )
    }
  }
}

/** A labelled row of choices: capacitor sizes, fuse sizes … */
function ChoiceRow<T extends number>({
  label,
  value,
  options,
  format,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  format: (v: T) => string
  onChange: (v: T) => void
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <ToggleGroup
        type="single"
        variant="outline"
        className="w-full"
        dir="ltr"
        value={String(value)}
        onValueChange={(v) => v && onChange(Number(v) as T)}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option} value={String(option)} className="flex-1 font-semibold tabular-nums">
            {format(option)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

function SliderBox({
  label,
  value,
  text,
  steps = 100,
  onChange,
}: {
  label: string
  value: number
  text: string
  /** how many stops the slider has between 0 and 1 */
  steps?: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2 rounded-xl border p-3">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums" dir="ltr">
          {text}
        </span>
      </div>
      <div dir="ltr">
        <Slider
          min={0}
          max={steps}
          step={1}
          aria-label={label}
          value={[Math.round(value * steps)]}
          onValueChange={([v]) => onChange(v / steps)}
          onValueCommit={() => useCircuit.getState().checkpoint()}
        />
      </div>
    </div>
  )
}

function BoardProgram({ node }: { node: SelectedPart }) {
  const { t } = useI18n()
  const ai = useAiBook()
  const lastRequest = useLastRequest(node.id)
  const updatePart = useCircuit((s) => s.updatePart)
  const a0 = useSimulation((s) => s.result.inputs[node.id])
  const levels = useSimulation((s) => s.result.parts[node.id]?.pins)
  const type = node.data.type as BoardType
  const spec = BOARDS[type]
  const pins = node.data.pins ?? {}
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">{t.inspector.programHint}</p>
        {spec.pins.map((pin) => {
          const mode = pins[pin] ?? 'off'
          return (
            <div key={pin} className="flex items-center gap-2.5 rounded-xl border bg-card py-1 ps-3 pe-1">
              {/* the pin's output right now */}
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full bg-teal-500 shadow-[0_0_6px_var(--color-teal-400)] transition-opacity duration-150"
                style={{ opacity: mode === 'off' ? 0.15 : 0.2 + (levels?.[pin] ?? 0) * 0.8 }}
              />
              <span className="min-w-8 text-sm font-semibold tabular-nums" dir="ltr">
                {spec.label(pin)}
              </span>
              <Select
                value={mode}
                onValueChange={(next) => {
                  updatePart(node.id, { pins: { ...pins, [pin]: next as PinMode } })
                  playClick(next !== 'off')
                }}
              >
                <SelectTrigger className="ms-auto h-8 w-44 min-w-0" aria-label={spec.label(pin)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pinModesFor(type, pin).map((option) => (
                    <SelectItem key={option} value={option}>
                      {t.inspector.pinModes[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        })}
      </div>
      {a0 !== undefined && spec.input && (
        <div className="flex items-center justify-between rounded-xl border bg-card px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {t.inspector.a0} ({spec.input})
          </span>
          <span dir="ltr" className="font-mono font-semibold tabular-nums">
            {a0.toFixed(2)} {t.units.volt}
          </span>
        </div>
      )}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground">{type === 'aiBoard' ? ai.codeTitle : t.inspector.code}</p>
        <pre
          dir="ltr"
          className="max-w-full overflow-x-auto rounded-xl bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-100 shadow-inner"
        >
          {/* the AI board's code starts with the words that made it */}
          <code>{(type === 'aiBoard' ? aiCodeHeader(ai.codeFrom, lastRequest) : '') + boardCode(type, pins)}</code>
        </pre>
      </div>
    </div>
  )
}

function PartInspector({ node }: { node: SelectedPart }) {
  const { t } = useI18n()
  const running = useSimulation((s) => s.running)
  const result = useSimulation((s) => s.result.parts[node.id])
  const { rotatePart, duplicatePart, removePart, updatePart } = useCircuit.getState()
  const { data } = node
  const status = partStatus(data, result)
  const tip = tipFor(data, result, status, t, running)
  const accent = PARTS[data.type].accent
  const showLevel = ['lamp', 'led', 'motor', 'buzzer'].includes(data.type)
  const hasSettings = ![
    'button',
    'microSwitch',
    'coinCell',
    'powerBank',
    'motor',
    'diode',
    'transistor',
    'voltmeter',
    'ammeter',
    'servo',
    'relay',
    'rgbLed',
    'vibration',
    'electromagnet',
    'regulator',
    'notGate',
    'andGate',
    'orGate',
    'xorGate',
    ...LAB_WITHOUT_SETTINGS,
  ].includes(data.type)

  return (
    <div className="space-y-5 p-4">
      <header className="flex items-center gap-3">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-lg border"
          style={{ background: `color-mix(in oklch, ${accent} 9%, var(--card))` }}
        >
          <PartArt partType={data.type} size={44} />
        </span>
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-base font-semibold">{t.parts[data.type].name}</h3>
          <Badge className={cn('border-0', STATUS_STYLE[status])}>
            {status === 'on'
              ? isRadio(data.type) && (result?.channels?.link ?? 0) < 0.5
                ? t.radio.joining[data.type]
                : t.parts[data.type].working
              : t.status[status]}
          </Badge>
        </div>
      </header>

      <AnimatePresence mode="popLayout">
        {tip && (
          <motion.div
            key={tip.text}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className={cn(
              'flex gap-2.5 rounded-xl border p-3 text-sm leading-relaxed',
              tip.tone === 'danger' && 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
              tip.tone === 'warn' && 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200',
              tip.tone === 'info' && 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200',
            )}
          >
            {tip.tone === 'danger' ? (
              <Flame size={18} className="mt-0.5 shrink-0" animate loop />
            ) : (
              <TriangleAlert size={18} className="mt-0.5 shrink-0" animateOnHover />
            )}
            <span>{tip.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {data.burnt && (
        <Button
          className="w-full"
          onClick={() => {
            updatePart(node.id, { burnt: false })
            playClick()
          }}
        >
          {t.inspector.repair}
        </Button>
      )}

      {/* the AI board is something you talk to first */}
      {data.type === 'aiBoard' && <AiChat boardId={node.id} />}

      <Section title={t.inspector.readings}>
        <div className="grid grid-cols-3 gap-2">
          <Reading label={t.inspector.voltage} value={Math.abs(result?.voltage ?? 0)} unit={t.units.volt} decimals={2} />
          <CurrentReading label={t.inspector.current} amps={result?.current ?? 0} />
          <Reading label={t.inspector.power} value={Math.abs(result?.power ?? 0)} unit={t.units.watt} decimals={2} />
        </div>
        {/* a relay's tiny coil current switches a much bigger one */}
        {data.type === 'relay' && (
          <CurrentReading label={t.workshop.contactCurrent} amps={result?.channels?.contact ?? 0} />
        )}
        {/* the joystick's two outputs */}
        {data.type === 'joystick' && (
          <div className="grid grid-cols-2 gap-2">
            <Reading label="X" value={Math.max(0, result?.channels?.X ?? 0)} unit={t.units.volt} decimals={2} />
            <Reading label="Y" value={Math.max(0, result?.channels?.Y ?? 0)} unit={t.units.volt} decimals={2} />
          </div>
        )}
        {/* what has arrived at the other end: the phone, the cloud, the control room … */}
        {isRadio(data.type) && <RadioReceiver data={data} result={result} />}
        {showLevel && (
          <div className="flex items-center gap-2 rounded-xl border p-2.5">
            <span className="text-xs text-muted-foreground">
              {data.type === 'motor' ? t.inspector.speed : t.inspector.brightness}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" dir="ltr">
              <motion.div
                className="h-full rounded-full"
                style={{ background: accent }}
                animate={{ width: `${Math.min(100, Math.abs(result?.level ?? 0) * (data.type === 'motor' ? 50 : 77))}%` }}
                transition={{ type: 'spring', stiffness: 160, damping: 22 }}
              />
            </div>
          </div>
        )}
      </Section>

      {hasSettings && !data.burnt && (
        <Section title={t.inspector.settings}>
          <PartSettings node={node} />
        </Section>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          className="h-auto flex-col gap-1 py-2 text-xs"
          disabled={!isRotatable(data.type)}
          onClick={() => rotatePart(node.id)}
        >
          <RotateCcw size={16} animateOnHover className="-scale-x-100" />
          {t.inspector.rotate}
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1 py-2 text-xs" onClick={() => duplicatePart(node.id)}>
          <Copy size={16} animateOnHover />
          {t.inspector.duplicate}
        </Button>
        <Button variant="destructive" className="h-auto flex-col gap-1 py-2 text-xs" onClick={() => removePart(node.id)}>
          <Trash2 size={16} animateOnHover />
          {t.inspector.delete}
        </Button>
      </div>

      <Section title={t.inspector.whatItDoes}>
        <PartLesson type={data.type} result={running ? result : undefined} />
        {data.type === 'resistor' && <ResistorColorCode ohms={data.resistance ?? 100} />}
        {isGate(data.type) && <TruthTable type={data.type} channels={running ? result?.channels : undefined} />}
        <LabExtras data={data} channels={running ? result?.channels : undefined} />
      </Section>
      <BasicsLesson result={running ? result : undefined} />
    </div>
  )
}

function WireInspector({ edge }: { edge: WireEdge }) {
  const { t } = useI18n()
  const current = useSimulation((s) => s.result.wires[edge.id] ?? 0)
  const { setWireColor, removeWire } = useCircuit.getState()
  return (
    <div className="space-y-5 p-4">
      <header className="flex items-center gap-3">
        <span
          className="grid size-12 place-items-center rounded-lg text-white shadow-inner"
          style={{ background: WIRE_COLORS[edge.data?.color ?? 'blue'] }}
        >
          <Unplug size={24} animateOnHover />
        </span>
        <h3 className="text-base font-semibold">{t.inspector.wire}</h3>
      </header>
      <Section title={t.inspector.readings}>
        <CurrentReading label={t.inspector.wireCurrent} amps={current} />
      </Section>
      <Section title={t.inspector.wireColor}>
        <Swatches
          value={edge.data?.color ?? 'blue'}
          colors={WIRE_COLORS}
          labels={t.colors}
          onChange={(color: WireColor) => setWireColor(edge.id, color)}
        />
      </Section>
      <Button variant="destructive" className="w-full gap-2" onClick={() => removeWire(edge.id)}>
        <Trash2 size={16} animateOnHover />
        {t.inspector.deleteWire}
      </Button>
    </div>
  )
}

function EmptyInspector() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center">
      <span className="grid size-14 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Unplug size={28} animate loop />
      </span>
      <h3 className="font-semibold">{t.inspector.empty}</h3>
      <p className="max-w-60 text-sm text-balance text-muted-foreground">{t.inspector.emptyHint}</p>
      <div className="mt-2 w-full space-y-2.5 rounded-xl border bg-card p-3 text-start text-sm">
        <div className="flex items-center gap-2.5">
          <span className="terminal-legend terminal-legend--plus">+</span>
          <span>{t.inspector.plusEnd}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="terminal-legend terminal-legend--minus">−</span>
          <span>{t.inspector.minusEnd}</span>
        </div>
      </div>
    </div>
  )
}

/** Details of whatever is picked on the board: used by the side panel and the phone sheet. */
export function InspectorBody() {
  const part = useSelectedPart()
  const wire = useCircuit(selectSelectedWire)
  const selectedId = part?.id ?? wire?.id ?? null
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={selectedId ?? 'empty'}
        initial={{ opacity: 0, x: 12, filter: 'blur(4px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, x: -12, filter: 'blur(4px)' }}
        transition={{ duration: 0.18 }}
      >
        {part ? <PartInspector node={part} /> : wire ? <WireInspector edge={wire} /> : <EmptyInspector />}
      </motion.div>
    </AnimatePresence>
  )
}

export function InspectorPanel() {
  const { t } = useI18n()
  const part = useSelectedPart()
  const wire = useCircuit(selectSelectedWire)
  const completed = useSettings((s) => s.completed.length)
  const [tab, setTab] = useState('inspector')
  const selectedId = part?.id ?? wire?.id ?? null

  // selecting something on the board brings the inspector to the front
  const [lastSelected, setLastSelected] = useState(selectedId)
  if (selectedId !== lastSelected) {
    setLastSelected(selectedId)
    if (selectedId) setTab('inspector')
  }
  // so does an AI board's "Ask" button, even when the board was already picked
  const askRequest = useAiChat((s) => s.openRequest?.n ?? 0)
  const [lastAsk, setLastAsk] = useState(askRequest)
  if (askRequest !== lastAsk) {
    setLastAsk(askRequest)
    setTab('inspector')
  }

  return (
    <aside className="relative z-10 flex w-80 shrink-0 flex-col border-s bg-sidebar max-lg:hidden xl:w-[22rem]">
      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="px-3 pt-3">
          <TabsList className="w-full">
            <TabsTrigger value="inspector">{t.inspector.tab}</TabsTrigger>
            <TabsTrigger value="missions" className="gap-1.5">
              {t.inspector.missionsTab}
              <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary tabular-nums">
                {completed}/{MISSION_IDS.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="inspector" className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <InspectorBody />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="missions" className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <Missions />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
