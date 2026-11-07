import { Panel, useReactFlow } from '@xyflow/react'
import { AnimatePresence, motion } from 'motion/react'
import { LiquidButton } from '@/components/animate-ui/buttons/liquid'
import { Maximize } from '@/components/animate-ui/icons/maximize'
import { TriangleAlert } from '@/components/animate-ui/icons/triangle-alert'
import { ZoomIn } from '@/components/animate-ui/icons/zoom-in'
import { ZoomOut } from '@/components/animate-ui/icons/zoom-out'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { WIRE_COLORS } from '@/circuit/catalog'
import { buildPreset } from '@/circuit/presets'
import type { WireColor } from '@/circuit/types'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import { useCircuit } from '@/store/circuit'
import { useDrag } from '@/store/drag'
import { useSettings } from '@/store/settings'
import { useSimulation } from '@/store/simulation'
import { PartArt } from './PartArt'

function ControlButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn(
            'grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95',
            className,
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

/** Zoom buttons. Phones pinch to zoom, so they only keep "see everything". */
export function CanvasControls() {
  const { t } = useI18n()
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  return (
    <Panel position="bottom-left" className="!m-3">
      <div className="float-panel flex items-center gap-0.5 rounded-xl p-1">
        <ControlButton label={t.controls.zoomIn} onClick={() => zoomIn({ duration: 250 })} className="max-sm:hidden">
          <ZoomIn size={18} animateOnHover />
        </ControlButton>
        <ControlButton label={t.controls.zoomOut} onClick={() => zoomOut({ duration: 250 })} className="max-sm:hidden">
          <ZoomOut size={18} animateOnHover />
        </ControlButton>
        <ControlButton label={t.controls.fit} onClick={() => fitView({ duration: 400, padding: 0.2, maxZoom: 1.1 })}>
          <Maximize size={18} animateOnHover />
        </ControlButton>
      </div>
    </Panel>
  )
}

/** Picks the colour of the next wire. */
export function WirePalette() {
  const { t } = useI18n()
  const wireColor = useSettings((s) => s.wireColor)
  const setWireColor = useSettings((s) => s.setWireColor)
  const options: (WireColor | 'auto')[] = ['auto', ...(Object.keys(WIRE_COLORS) as WireColor[])]
  return (
    <Panel position="top-left" className="!m-3">
      <div
        role="radiogroup"
        aria-label={t.wirePalette}
        className="float-panel flex items-center gap-1 rounded-lg py-1 ps-1 pe-1 sm:ps-3"
      >
        <span className="pe-1 text-xs font-medium text-muted-foreground max-sm:hidden">{t.wirePalette}</span>
        {options.map((c) => (
          <Tooltip key={c}>
            <TooltipTrigger asChild>
              <button
                type="button"
                role="radio"
                aria-label={t.colors[c]}
                aria-checked={wireColor === c}
                onClick={() => setWireColor(c)}
                className="grid size-7 place-items-center rounded-full transition hover:bg-muted"
              >
                <span
                  className={cn(
                    'size-[18px] rounded-full shadow-[inset_0_0_0_1px_oklch(0.55_0_0/0.4)] transition',
                    wireColor === c && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
                  )}
                  style={{
                    background:
                      c === 'auto'
                        ? `conic-gradient(${WIRE_COLORS.red} 0 50%, ${WIRE_COLORS.black} 50% 100%)`
                        : WIRE_COLORS[c],
                  }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t.colors[c]}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </Panel>
  )
}

/** A little drawing of the first circuit: battery, switch and lamp joined in a loop. */
function FirstCircuit() {
  return (
    <div aria-hidden className="relative flex items-end justify-center gap-5 px-2 pt-1">
      <svg
        className="absolute inset-x-6 top-1/2 h-10 w-[calc(100%-3rem)] -translate-y-1/2 overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 100 20"
      >
        <path d="M8 10 H92" stroke="#ef4444" strokeWidth="1.6" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" fill="none" />
      </svg>
      {(['battery', 'switch', 'lamp'] as const).map((type, i) => (
        <motion.span
          key={type}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 + i * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
          className="relative grid size-16 place-items-center rounded-lg border bg-card shadow-[var(--shadow-card)]"
        >
          <PartArt partType={type} size={44} />
        </motion.span>
      ))}
    </div>
  )
}

/** Friendly first screen when the board is empty. */
export function EmptyState() {
  const { t } = useI18n()
  const isEmpty = useCircuit((s) => s.nodes.length === 0)
  const load = useCircuit((s) => s.load)
  return (
    <AnimatePresence>
      {isEmpty && (
        <motion.div
          key="empty"
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="pointer-events-none absolute inset-0 z-[5] grid place-items-center p-5"
        >
          <div className="pointer-events-auto flex w-full max-w-sm flex-col items-center gap-5 rounded-xl border bg-card px-6 pt-7 pb-6 text-center shadow-[var(--shadow-float)]">
            <FirstCircuit />
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight text-balance">{t.empty.title}</h2>
              <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{t.empty.body}</p>
            </div>
            <LiquidButton
              className="h-11 w-full rounded-xl px-6 text-sm font-semibold text-primary-foreground hover:text-primary-foreground [--liquid-button-background-color:var(--primary)] [--liquid-button-color:color-mix(in_oklch,var(--primary),black_18%)]"
              onClick={() => load(buildPreset('flashlight'))}
            >
              {t.empty.cta}
            </LiquidButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Dashed outline that invites the drop while a part is dragged. */
export function DropZone() {
  const { t } = useI18n()
  const dragging = useDrag((s) => s.type !== null)
  const over = useDrag((s) => s.overBoard)
  return (
    <AnimatePresence>
      {dragging && (
        <motion.div
          key="dropzone"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'pointer-events-none absolute inset-2 z-[5] grid place-items-center rounded-lg border-2 border-dashed transition-colors',
            over ? 'border-primary bg-primary/5' : 'border-muted-foreground/30',
          )}
        >
          <span
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-semibold transition',
              over ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            {t.drag.drop}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Red vignette and banner while a battery is short-circuited. */
export function ShortCircuitAlert() {
  const { t } = useI18n()
  const short = useSimulation((s) => s.result.shortCircuit)
  return (
    <AnimatePresence>
      {short && (
        <motion.div
          key="short"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-[5]"
        >
          <div className="short-vignette absolute inset-0" />
          <motion.div
            initial={{ y: -40 }}
            animate={{ y: 0 }}
            exit={{ y: -40 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            className="absolute inset-x-3 top-16 mx-auto flex w-fit max-w-md items-start gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm leading-snug font-medium text-white shadow-lg shadow-red-600/30 sm:top-3"
          >
            <TriangleAlert size={18} animate loop className="mt-px shrink-0" />
            <span>{t.tips.short}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
