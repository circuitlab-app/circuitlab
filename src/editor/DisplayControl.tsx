import { Pause, Play, SkipForward } from 'lucide-react'
import { DEMOS, DISPLAY_MODES, SIGN_EFFECTS, type DisplayType } from '@/circuit/display'
import type { PartData } from '@/circuit/types'
import { signEffect } from '@/displays/text'
import { useI18n } from '@/i18n'
import { playClick } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { useCircuit } from '@/store/circuit'
import { EFFECT_ICONS, MODE_ICONS } from './displayIcons'

const itemClass = (on: boolean) =>
  cn(
    'grid min-w-0 place-items-center rounded-[4px] transition [&_svg]:size-3.5',
    on ? 'bg-[var(--part-accent)] text-white shadow-sm' : 'text-muted-foreground hover:bg-card hover:text-foreground',
  )

/** What the screen shows, one tap away. */
function ModeTabs({ id, data, type }: { id: string; data: PartData; type: DisplayType }) {
  const { t } = useI18n()
  const updatePart = useCircuit((s) => s.updatePart)
  const modes = DISPLAY_MODES[type]
  const current = data.mode ?? modes[0]
  return (
    <div
      role="radiogroup"
      aria-label={t.display.show}
      className="nodrag node-track grid gap-0.5 p-0.5"
      style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0, 1fr))` }}
    >
      {modes.map((mode) => {
        const Icon = MODE_ICONS[mode]
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={current === mode}
            aria-label={t.display.modes[mode]}
            title={t.display.modes[mode]}
            className={itemClass(current === mode)}
            onClick={() => {
              if (current === mode) return
              updatePart(id, { mode })
              playClick()
            }}
          >
            <Icon aria-hidden />
          </button>
        )
      })}
    </div>
  )
}

/** The words on an LED sign (its first line) and how they move. */
function SignControl({ id, data }: { id: string; data: PartData }) {
  const { t } = useI18n()
  const updatePart = useCircuit((s) => s.updatePart)
  const text = data.text ?? t.display.samples.matrix
  const [first, ...rest] = text.split('\n')
  const effect = signEffect(data, text)
  const Icon = EFFECT_ICONS[effect]
  const next = SIGN_EFFECTS[(SIGN_EFFECTS.indexOf(effect) + 1) % SIGN_EFFECTS.length]
  return (
    <div className="nodrag nopan node-track flex items-center gap-0.5 p-0.5">
      <input
        type="text"
        dir="auto"
        value={first}
        maxLength={120}
        spellCheck={false}
        aria-label={t.display.text}
        className="nodrag nopan nowheel node-input"
        // one undo step for the whole edit
        onFocus={() => useCircuit.getState().checkpoint()}
        onChange={(e) => updatePart(id, { text: [e.target.value, ...rest].join('\n') }, { history: false })}
      />
      <button
        type="button"
        aria-label={`${t.display.effect}: ${t.display.effects[effect]}`}
        title={t.display.effects[effect]}
        className={cn(itemClass(true), 'size-6 shrink-0')}
        onClick={() => {
          updatePart(id, { effect: next })
          playClick()
        }}
      >
        <Icon aria-hidden />
      </button>
    </div>
  )
}

/** Play or pause the city TV, and jump to the next show. */
function WallControl({ id, data }: { id: string; data: PartData }) {
  const { t } = useI18n()
  const updatePart = useCircuit((s) => s.updatePart)
  const playing = data.playing !== false
  const picture = data.mode === 'picture'
  const label = picture ? (data.media?.name ?? t.display.modes.picture) : t.display.demos[data.demo ?? 'reel']
  // every show in turn, then the child's own photo or video when there is one
  const next = () => {
    if (picture) return updatePart(id, { mode: 'demo', demo: DEMOS[0] })
    const index = DEMOS.indexOf(data.demo ?? 'reel')
    if (index === DEMOS.length - 1 && data.media) return updatePart(id, { mode: 'picture' })
    updatePart(id, { mode: 'demo', demo: DEMOS[(index + 1) % DEMOS.length] })
  }
  const PlayIcon = playing ? Pause : Play
  return (
    <div className="nodrag node-track flex items-center gap-1 p-0.5">
      <button
        type="button"
        aria-label={playing ? t.display.pause : t.display.play}
        title={playing ? t.display.pause : t.display.play}
        className={cn(itemClass(true), 'size-6 shrink-0')}
        onClick={() => {
          updatePart(id, { playing: !playing })
          playClick(!playing)
        }}
      >
        <PlayIcon aria-hidden />
      </button>
      <span className="min-w-0 flex-1 truncate px-1 text-center text-[11px] font-semibold" dir="auto">
        {label}
      </span>
      <button
        type="button"
        aria-label={t.display.next}
        title={t.display.next}
        className={cn(itemClass(false), 'size-6 shrink-0')}
        onClick={() => {
          next()
          playClick()
        }}
      >
        <SkipForward aria-hidden className="rtl:-scale-x-100" />
      </button>
    </div>
  )
}

/** The one control row of a screen's card. */
export function DisplayControl({ id, data }: { id: string; data: PartData }) {
  switch (data.type) {
    case 'matrix':
      return <SignControl id={id} data={data} />
    case 'ledwall':
      return <WallControl id={id} data={data} />
    case 'segment':
    case 'lcd':
    case 'oled':
    case 'tft':
      return <ModeTabs id={id} data={data} type={data.type} />
    default:
      return null
  }
}
