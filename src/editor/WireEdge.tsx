import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type ConnectionLineComponentProps,
  type EdgeProps,
} from '@xyflow/react'
import { AnimatePresence, motion } from 'motion/react'
import { memo } from 'react'
import { ELECTRICAL, WIRE_COLORS } from '@/circuit/catalog'
import type { WireColor, WireEdge as WireEdgeType } from '@/circuit/types'
import { Trash2 } from '@/components/animate-ui/icons/trash-2'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import { useCircuit } from '@/store/circuit'
import { useSettings } from '@/store/settings'
import { useSimulation } from '@/store/simulation'

const DASH = 18

/** Pixels per second of the "electricity" dots for a given current. */
function flowSpeed(amps: number) {
  return 30 + 260 * Math.min(1, Math.abs(amps) / 0.6) ** 0.6
}

function WireToolbar({ id, x, y, color }: { id: string; x: number; y: number; color: WireColor }) {
  const { t } = useI18n()
  const setWireColor = useCircuit((s) => s.setWireColor)
  const removeWire = useCircuit((s) => s.removeWire)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 6 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="nodrag nopan pointer-events-auto absolute flex items-center gap-1 rounded-full border bg-popover p-1 shadow-lg"
      style={{ transform: `translate(-50%, -130%) translate(${x}px, ${y}px)` }}
    >
      {(Object.keys(WIRE_COLORS) as WireColor[]).map((c) => (
        <button
          key={c}
          type="button"
          title={t.colors[c]}
          aria-label={t.colors[c]}
          onClick={() => setWireColor(id, c)}
          className={cn(
            'size-5 rounded-full border-2 border-white shadow-sm ring-offset-1 ring-offset-popover transition hover:scale-110 dark:border-zinc-700',
            c === color && 'ring-2 ring-primary',
          )}
          style={{ background: WIRE_COLORS[c] }}
        />
      ))}
      <span className="mx-0.5 h-4 w-px bg-border" />
      <button
        type="button"
        title={t.inspector.deleteWire}
        aria-label={t.inspector.deleteWire}
        onClick={() => removeWire(id)}
        className="grid size-6 place-items-center rounded-full text-destructive hover:bg-destructive/10"
      >
        <Trash2 size={14} animateOnHover />
      </button>
    </motion.div>
  )
}

function WireEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<WireEdgeType>) {
  const current = useSimulation((s) => s.result.wires[id] ?? 0)
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.4,
  })
  const color = data?.color ?? 'blue'
  const flowing = Math.abs(current) > 1e-3
  const overloaded = Math.abs(current) > ELECTRICAL.shortCircuitCurrent

  return (
    <>
      {/* insulation outline */}
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={22}
        style={{ stroke: 'var(--wire-outline)', strokeWidth: 9, strokeLinecap: 'round' }}
      />
      <path
        d={path}
        fill="none"
        stroke={WIRE_COLORS[color]}
        strokeWidth={6}
        strokeLinecap="round"
        className={cn('wire-core', selected && 'wire-core--selected')}
      />
      {/* a highlight stripe makes the wire read as a round cable */}
      <path d={path} fill="none" stroke="white" strokeOpacity={0.28} strokeWidth={1.5} strokeLinecap="round" transform="translate(0,-1.2)" />
      {overloaded && <path d={path} fill="none" className="wire-hot" strokeLinecap="round" />}
      {flowing &&
        // a wide, faint copy under the dots gives them a glow without a costly SVG filter
        ['wire-flow wire-glow', 'wire-flow'].map((className) => (
          <path
            key={className}
            d={path}
            fill="none"
            className={className}
            strokeLinecap="round"
            style={{
              strokeDasharray: `1 ${DASH - 1}`,
              animationDuration: `${DASH / flowSpeed(current)}s`,
              animationDirection: current > 0 ? 'normal' : 'reverse',
            }}
          />
        ))}
      <EdgeLabelRenderer>
        <AnimatePresence>
          {selected && <WireToolbar key="toolbar" id={id} x={labelX} y={labelY} color={color} />}
        </AnimatePresence>
      </EdgeLabelRenderer>
    </>
  )
}

export const WireEdge = memo(WireEdgeComponent)

/** Preview of the wire while it is being dragged from a terminal. */
export function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}: ConnectionLineComponentProps) {
  const wireColor = useSettings((s) => s.wireColor)
  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
    sourcePosition: fromPosition,
    targetPosition: toPosition,
    curvature: 0.4,
  })
  const stroke = wireColor === 'auto' ? 'var(--primary)' : WIRE_COLORS[wireColor]
  return (
    <g>
      <path d={path} fill="none" stroke="var(--wire-outline)" strokeWidth={9} strokeLinecap="round" opacity={0.6} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={6} strokeLinecap="round" strokeDasharray="10 8" className="wire-drawing" />
      <circle cx={toX} cy={toY} r={7} fill={stroke} stroke="white" strokeWidth={2.5} />
    </g>
  )
}
