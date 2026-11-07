import {
  Clapperboard,
  Clock,
  Film,
  Image,
  Megaphone,
  Minus,
  Newspaper,
  PartyPopper,
  Plus,
  Rainbow,
  Tv,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  DEMOS,
  DISPLAY_LIMITS,
  DISPLAY_MODES,
  DISPLAY_TINTS,
  LCD_SIZES,
  SEGMENT_DIGITS,
  SIGN_EFFECTS,
  TINT_SWATCHES,
  displayGeometry,
  displayGrid,
  lcdSize,
  segmentDigits,
  type DisplayType,
} from '@/circuit/display'
import type { CircuitSnapshot, DemoId, DisplayMode, DisplayTint, PartData } from '@/circuit/types'
import { signEffect } from '@/displays/text'
import { useI18n } from '@/i18n'
import { MAX_MEDIA_BYTES, mediaKind, pruneMedia, saveMedia } from '@/lib/media'
import { playClick } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { useCircuit, type SelectedPart } from '@/store/circuit'
import { useSimulation } from '@/store/simulation'
import { EFFECT_ICONS, MODE_ICONS } from './displayIcons'

const DEMO_ICONS: Record<DemoId, LucideIcon> = {
  reel: Clapperboard,
  cityAd: Megaphone,
  fireworks: PartyPopper,
  rainbow: Rainbow,
  news: Newspaper,
  clock: Clock,
  bars: Tv,
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

const tileClass = (on: boolean) =>
  cn(
    'flex min-w-0 items-center gap-2 rounded-md border px-2.5 py-2 text-start text-xs font-medium transition hover:bg-muted',
    '[&_svg]:size-4 [&_svg]:shrink-0',
    on ? 'border-primary bg-primary/10 text-foreground' : 'text-muted-foreground hover:text-foreground',
  )

/** A grid of choices, each with an icon and a word: what a screen shows, how words move, which show plays. */
function OptionGrid<T extends string>({
  value,
  options,
  icons,
  labels,
  onChange,
}: {
  /** null when none of them is picked */
  value: T | null
  options: readonly T[]
  icons: Record<T, LucideIcon>
  labels: Record<T, string>
  onChange: (value: T) => void
}) {
  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-1.5">
      {options.map((option) => {
        const Icon: LucideIcon = icons[option]
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={option === value}
            className={tileClass(option === value)}
            onClick={() => {
              if (option === value) return
              onChange(option)
              playClick()
            }}
          >
            <Icon aria-hidden />
            <span className="truncate">{labels[option]}</span>
          </button>
        )
      })}
    </div>
  )
}

function TintPicker({ value, options, onChange }: { value: DisplayTint; options: readonly DisplayTint[]; onChange: (t: DisplayTint) => void }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((tint) => (
        <button
          key={tint}
          type="button"
          aria-pressed={tint === value}
          onClick={() => onChange(tint)}
          className={cn(
            'flex items-center gap-1.5 rounded-md border py-1 ps-1 pe-2.5 text-xs font-medium transition hover:bg-muted',
            tint === value && 'border-primary bg-primary/10',
          )}
        >
          <span className="size-4 rounded-full border border-black/10 shadow-inner" style={{ background: TINT_SWATCHES[tint] }} />
          {t.display.tints[tint]}
        </button>
      ))}
    </div>
  )
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card p-1" dir="ltr">
      <Button variant="ghost" size="icon-sm" aria-label={`${label} −`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus />
      </Button>
      <div className="min-w-0 flex-1 text-center leading-tight">
        <div className="text-sm font-semibold tabular-nums">{value}</div>
        <div className="truncate text-[10px] text-muted-foreground">{label}</div>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label={`${label} +`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus />
      </Button>
    </div>
  )
}

function Percent({ label, value, min = 0, onChange }: { label: string; value: number; min?: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums" dir="ltr">
          {Math.round(value * 100)}%
        </span>
      </div>
      <div dir="ltr">
        <Slider
          min={Math.round(min * 100)}
          max={100}
          step={1}
          aria-label={label}
          value={[Math.round(value * 100)]}
          onValueChange={([v]) => onChange(v / 100)}
          onValueCommit={() => useCircuit.getState().checkpoint()}
        />
      </div>
    </div>
  )
}

const inputClass = cn(
  'w-full rounded-md border border-border bg-muted px-3 text-sm text-foreground outline-none',
  'shadow-[inset_0_1px_2px_oklch(0_0_0/0.05)] transition-[background-color,border-color,box-shadow]',
  'placeholder:text-muted-foreground hover:border-foreground/20',
  'focus-visible:border-primary focus-visible:bg-card focus-visible:shadow-none focus-visible:ring-4 focus-visible:ring-primary/15',
)

/** A text box that changes the screen as you type and undoes in one step. */
export function TextBox({
  value,
  label,
  multiline = false,
  maxLength,
  onChange,
  ltr = false,
}: {
  value: string
  label: string
  multiline?: boolean
  maxLength?: number
  onChange: (v: string) => void
  ltr?: boolean
}) {
  const props = {
    value,
    maxLength,
    'aria-label': label,
    dir: ltr ? 'ltr' : 'auto',
    spellCheck: false,
    onFocus: () => useCircuit.getState().checkpoint(),
  } as const
  return multiline ? (
    <textarea {...props} rows={3} className={cn(inputClass, 'resize-y py-2 leading-relaxed')} onChange={(e) => onChange(e.target.value)} />
  ) : (
    <input {...props} type="text" className={cn(inputClass, 'h-9')} onChange={(e) => onChange(e.target.value)} />
  )
}

/** Every photo or video any board state still points at, so tidying up keeps what undo may bring back. */
function mediaInUse(): Set<string> {
  const { nodes, past, future } = useCircuit.getState()
  const ids = new Set<string>()
  const add = (snapshot: Pick<CircuitSnapshot, 'nodes'>) => {
    for (const node of snapshot.nodes) if (node.data.media) ids.add(node.data.media.id)
  }
  add({ nodes })
  past.forEach(add)
  future.forEach(add)
  return ids
}

/** Pick a photo or video from the device; it is kept in the browser, not uploaded anywhere. */
function MediaPicker({ id, data }: { id: string; data: PartData }) {
  const { t } = useI18n()
  const updatePart = useCircuit((s) => s.updatePart)
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const media = data.media

  const pick = async (file: File | undefined) => {
    if (!file) return
    if (!mediaKind(file)) return void toast.error(t.display.badFile)
    if (file.size > MAX_MEDIA_BYTES) return void toast.error(t.display.tooBig)
    setBusy(true)
    try {
      const saved = await saveMedia(file)
      updatePart(id, { media: saved, mode: 'picture', playing: true })
      playClick(true)
      void pruneMedia(mediaInUse())
    } catch {
      toast.error(t.display.badFile)
    } finally {
      setBusy(false)
    }
  }

  const Kind = media?.kind === 'video' ? Film : Image
  return (
    <div className="space-y-2">
      <input
        ref={input}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {media ? (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-1.5 ps-2.5">
          <Kind className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm font-medium" dir="auto" title={media.name}>
            {media.name}
          </span>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
            {t.display.replace}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.display.remove}
            title={t.display.remove}
            onClick={() => updatePart(id, { media: undefined })}
          >
            <X />
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="w-full gap-2" disabled={busy} onClick={() => input.current?.click()}>
          <Upload aria-hidden />
          {t.display.upload}
        </Button>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">{t.display.mediaHint}</p>
    </div>
  )
}

/** The voltage on S right now, for the screens that show it. */
function SignalReading({ id }: { id: string }) {
  const { t } = useI18n()
  const result = useSimulation((s) => s.result.parts[id])
  const volts = result?.status === 'on' ? result.level : 0
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm">
      <span className="text-muted-foreground">{t.display.signal}</span>
      <span dir="ltr" className="font-mono font-semibold tabular-nums">
        {volts.toFixed(2)} {t.units.volt}
      </span>
    </div>
  )
}

function SizeSteppers({ id, data }: { id: string; data: PartData }) {
  const { t } = useI18n()
  const updatePart = useCircuit((s) => s.updatePart)
  const type = data.type === 'ledwall' ? 'ledwall' : 'matrix'
  const { cols, rows } = displayGrid(data)
  const limits = DISPLAY_LIMITS[type]
  const leds = displayGeometry(data).leds
  return (
    <Field label={t.display.size}>
      <div className="grid grid-cols-2 gap-2">
        <Stepper label={t.display.across} value={cols} min={1} max={limits.cols} onChange={(v) => updatePart(id, { cols: v })} />
        <Stepper label={t.display.down} value={rows} min={1} max={limits.rows} onChange={(v) => updatePart(id, { rows: v })} />
      </div>
      {leds && (
        <p className="text-xs text-muted-foreground tabular-nums" dir="auto">
          {t.display.leds(leds.w, leds.h)}
        </p>
      )}
    </Field>
  )
}

/** Everything a screen can do, in the details panel. */
export function DisplaySettings({ node }: { node: SelectedPart }) {
  const { t } = useI18n()
  const updatePart = useCircuit((s) => s.updatePart)
  const { id, data } = node
  const type = data.type as DisplayType
  const modes = DISPLAY_MODES[type]
  const mode: DisplayMode = data.mode ?? modes[0]
  const setText = (text: string) => updatePart(id, { text }, { history: false })

  const modePicker = (
    <Field label={t.display.show}>
      <OptionGrid
        value={mode}
        options={modes}
        icons={MODE_ICONS}
        labels={t.display.modes}
        onChange={(next) => updatePart(id, { mode: next })}
      />
    </Field>
  )
  const tints = DISPLAY_TINTS[type]
  const tintPicker = tints.length > 0 && (
    <Field label={type === 'lcd' ? t.display.backlight : t.inspector.color}>
      <TintPicker value={(data.tint as DisplayTint) ?? tints[0]} options={tints} onChange={(tint) => updatePart(id, { tint })} />
    </Field>
  )
  const demoPicker = (
    <OptionGrid
      value={mode === 'demo' ? (data.demo ?? (type === 'tft' ? 'rainbow' : 'reel')) : null}
      options={DEMOS}
      icons={DEMO_ICONS}
      labels={t.display.demos}
      onChange={(demo) => updatePart(id, { demo, mode: 'demo' })}
    />
  )

  switch (type) {
    case 'segment':
      return (
        <div className="space-y-4">
          {modePicker}
          {mode === 'number' && (
            <Field label={t.display.number}>
              <TextBox value={data.text ?? ''} label={t.display.number} maxLength={16} ltr onChange={setText} />
            </Field>
          )}
          {mode === 'volts' && <SignalReading id={id} />}
          <Field label={t.display.digits}>
            <ToggleGroup
              type="single"
              variant="outline"
              className="w-full"
              dir="ltr"
              value={String(segmentDigits(data))}
              onValueChange={(v) => v && updatePart(id, { digits: Number(v) })}
            >
              {SEGMENT_DIGITS.map((d) => (
                <ToggleGroupItem key={d} value={String(d)} className="flex-1 font-semibold tabular-nums">
                  {d}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          {tintPicker}
        </div>
      )
    case 'lcd': {
      const { cols, rows } = lcdSize(data)
      const lines = (data.text ?? t.display.samples.lcd).split('\n')
      return (
        <div className="space-y-4">
          {modePicker}
          <Field label={t.display.size}>
            <ToggleGroup
              type="single"
              variant="outline"
              className="w-full"
              dir="ltr"
              value={`${cols}x${rows}`}
              onValueChange={(v) => {
                if (!v) return
                const [c, r] = v.split('x').map(Number)
                updatePart(id, { cols: c, rows: r })
              }}
            >
              {LCD_SIZES.map(([c, r]) => (
                <ToggleGroupItem key={c} value={`${c}x${r}`} className="flex-1 font-semibold tabular-nums">
                  {c} × {r}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <Field label={t.display.text}>
            <div className="space-y-1.5">
              {Array.from({ length: rows }, (_, i) => (
                <TextBox
                  key={i}
                  value={lines[i] ?? ''}
                  label={t.display.line(i + 1)}
                  maxLength={cols}
                  onChange={(value) => {
                    const next = Array.from({ length: Math.max(rows, lines.length) }, (_, k) => (k === i ? value : (lines[k] ?? '')))
                    setText(next.join('\n').replace(/\n+$/, ''))
                  }}
                />
              ))}
            </div>
          </Field>
          {tintPicker}
        </div>
      )
    }
    case 'oled':
      return (
        <div className="space-y-4">
          {modePicker}
          {mode === 'text' && (
            <Field label={t.display.text}>
              <TextBox value={data.text ?? t.display.samples.oled} label={t.display.text} multiline maxLength={80} onChange={setText} />
            </Field>
          )}
          {mode === 'graph' && <SignalReading id={id} />}
          {mode === 'picture' && (
            <Field label={t.display.picture}>
              <MediaPicker id={id} data={data} />
            </Field>
          )}
          {tintPicker}
        </div>
      )
    case 'tft':
      return (
        <div className="space-y-4">
          {modePicker}
          {mode === 'demo' && demoPicker}
          {mode === 'picture' && (
            <Field label={t.display.picture}>
              <MediaPicker id={id} data={data} />
            </Field>
          )}
          {mode === 'text' && (
            <Field label={t.display.text}>
              <TextBox value={data.text ?? t.display.samples.tft} label={t.display.text} multiline maxLength={120} onChange={setText} />
            </Field>
          )}
        </div>
      )
    case 'matrix': {
      const text = data.text ?? t.display.samples.matrix
      return (
        <div className="space-y-4">
          <Field label={t.display.text}>
            <TextBox value={text} label={t.display.text} multiline maxLength={240} onChange={setText} />
          </Field>
          <SizeSteppers id={id} data={data} />
          {tintPicker}
          <Field label={t.display.effect}>
            <OptionGrid
              value={signEffect(data, text)}
              options={SIGN_EFFECTS}
              icons={EFFECT_ICONS}
              labels={t.display.effects}
              onChange={(effect) => updatePart(id, { effect })}
            />
          </Field>
          <Percent label={t.inspector.speed} value={data.speed ?? 0.5} onChange={(speed) => updatePart(id, { speed }, { history: false })} />
          <Percent
            label={t.inspector.brightness}
            value={data.brightness ?? 1}
            min={0.1}
            onChange={(brightness) => updatePart(id, { brightness }, { history: false })}
          />
        </div>
      )
    }
    case 'ledwall':
      return (
        <div className="space-y-4">
          <Field label={t.display.show}>
            <div className="space-y-1.5">
              {demoPicker}
              <button
                type="button"
                role="radio"
                aria-checked={mode === 'picture'}
                className={cn(tileClass(mode === 'picture'), 'w-full')}
                onClick={() => updatePart(id, { mode: 'picture' })}
              >
                <Image aria-hidden />
                <span className="truncate">{t.display.picture}</span>
              </button>
            </div>
          </Field>
          <MediaPicker id={id} data={data} />
          <SizeSteppers id={id} data={data} />
          <Percent
            label={t.inspector.brightness}
            value={data.brightness ?? 0.9}
            min={0.1}
            onChange={(brightness) => updatePart(id, { brightness }, { history: false })}
          />
          <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm font-semibold">
            {t.display.play}
            <Switch
              checked={data.playing !== false}
              onCheckedChange={(playing) => {
                updatePart(id, { playing })
                playClick(playing)
              }}
            />
          </label>
        </div>
      )
  }
}
