import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  getBezierPath,
  ReactFlow,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'
import { CircleCheck, CircleX, Hand, Info, Unplug, Zap } from 'lucide-react'
import { memo, useEffect, useMemo, useRef } from 'react'
import { useSettings } from '@/store/settings'
import { layout, type PipeEdgeType, type PipeNodeType } from './layout'
import { JobNode, ResultNode, TriggerNode } from './nodes'
import { isDone, jobStateAt, runStateAt, stepStateAt, type Timeline } from './simulate'
import { useLab } from './store'
import { STATE_COLOR, usePipelineBook } from './ui'

/* ───────────────────────── wires ───────────────────────── */

/**
 * idle: nothing has reached it yet · live: current flows to a job that is
 * waiting or running · done: the job after it has finished · cut: the job
 * before it failed, so the one after is skipped · open: the job before it
 * passed but the next job's `if:` was false · off: the event never fired.
 */
type WireState = 'idle' | 'live' | 'done' | 'cut' | 'open' | 'off'

function wireState(timeline: Timeline | null, started: boolean, t: number, from: string, to: string): WireState {
  if (!timeline || !started) return 'idle'
  if (!timeline.triggered) return from === 'trigger' ? 'off' : 'idle'
  const source = from === 'trigger' ? 'success' : jobStateAt(timeline.jobs[from], t)
  if (!isDone(source)) return 'idle'
  if (to === 'result') {
    // a job skipped by its own if: is an open switch; one skipped after a failure is part of the break
    if (source === 'skipped') return timeline.jobs[from]?.reason === 'if' ? 'open' : 'cut'
    if (source !== 'success') return 'cut'
    return isDone(runStateAt(timeline, t)) ? 'done' : 'live'
  }
  const target = jobStateAt(timeline.jobs[to], t)
  if (target === 'skipped' || (target === 'cancelled' && !timeline.jobs[to]?.lanes.length)) {
    return source === 'success' && timeline.jobs[to]?.reason === 'if' ? 'open' : 'cut'
  }
  return isDone(target) ? 'done' : 'live'
}

const WIRE_COLOR: Record<WireState, string> = {
  idle: 'var(--pipe-wire)',
  live: 'var(--pipe-run)',
  done: 'var(--pipe-ok)',
  cut: 'var(--pipe-bad)',
  open: 'var(--pipe-off)',
  off: 'var(--pipe-off)',
}

const PipeEdge = memo(function PipeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<PipeEdgeType>) {
  const from = data?.from ?? ''
  const to = data?.to ?? ''
  const state = useLab((s) => wireState(s.timeline, s.started, s.t, from, to))
  // a job's outputs ride along the wires it feeds while the next job runs
  const outputs = useLab((s) => {
    if (from === 'trigger' || to === 'result' || wireState(s.timeline, s.started, s.t, from, to) !== 'live') return ''
    const run = s.timeline?.jobs[from]
    return run
      ? Object.entries(run.outputs)
          .map(([k, v]) => `${k}=${v}`)
          .join('  ')
      : ''
  })
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.35,
  })
  const color = WIRE_COLOR[state]
  const dashed = state === 'cut' || state === 'open' || state === 'off'

  return (
    <>
      <BaseEdge id={id} path={path} style={{ stroke: 'var(--wire-outline)', strokeWidth: 9, strokeLinecap: 'round' }} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={dashed ? (state === 'cut' ? '10 8' : '3 9') : undefined}
        className="pipe-wire"
      />
      {!dashed ? (
        <path
          d={path}
          fill="none"
          stroke="white"
          strokeOpacity={0.28}
          strokeWidth={1.5}
          strokeLinecap="round"
          transform="translate(0,-1.2)"
        />
      ) : null}
      {state === 'live'
        ? ['wire-flow wire-glow', 'wire-flow'].map((className) => (
            <path
              key={className}
              d={path}
              fill="none"
              className={className}
              strokeLinecap="round"
              style={{ strokeDasharray: '1 17', animationDuration: '0.45s' }}
            />
          ))
        : null}
      {state === 'cut' || state === 'open' || outputs ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none absolute"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {state === 'cut' ? (
              <span className="pipe-wire__badge" style={{ color }}>
                <Unplug className="size-3.5" aria-hidden />
              </span>
            ) : state === 'open' ? (
              <span className="pipe-wire__badge font-mono text-[10px] font-semibold" style={{ color }}>
                if ✗
              </span>
            ) : (
              <span className="pipe-wire__signal" dir="ltr">
                {outputs}
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
})

/* ───────────────────────── what is happening now, in one sentence ───────────────────────── */

const TONE_ICON = { success: CircleCheck, failure: CircleX, cancelled: CircleX, waiting: Hand, ready: Info, running: Zap }
type Tone = keyof typeof TONE_ICON

function Narration() {
  const { book, clock, eventName, dir } = usePipelineBook()
  // one string ("tone|sentence"), so the line only re-renders when the sentence changes
  const line = useLab((s): string => {
    const tl = s.timeline
    if (!tl) return ''
    const name = (id: string) => tl.jobs[id]?.name ?? id
    if (!s.started) return `ready|${book.narrate.ready(eventName(s.scenario.event.event))}`
    if (!tl.triggered) return `failure|${book.narrate.off}`
    const t = s.t
    if (tl.conclusion && t >= tl.end) return `${tl.conclusion}|${book.narrate.done[tl.conclusion](clock(tl.end))}`
    const states = tl.order.map((id) => [id, jobStateAt(tl.jobs[id], t)] as const)
    const running = states.filter(([, st]) => st === 'running').map(([id]) => id)
    if (running.length > 1) return `running|${book.narrate.together(book.list(running.map(name)))}`
    if (running.length === 1) {
      const run = tl.jobs[running[0]]
      const lane = run.lanes.find((l) => t >= l.start && t < l.end) ?? run.lanes[0]
      const step = lane?.steps.find((st) => stepStateAt(st, t) === 'running')
      return `running|${book.narrate.running(lane?.name || run.name, step?.name ?? '…')}`
    }
    const waiting = states.find(([, st]) => st === 'waiting')
    if (waiting) return `waiting|${book.narrate.waiting(name(waiting[0]), tl.jobs[waiting[0]].review?.env ?? '')}`
    const queued = states.find(([, st]) => st === 'queued')
    if (queued) return `running|${book.narrate.queued(name(queued[0]))}`
    return ''
  })
  if (!line) return null
  const split = line.indexOf('|')
  const tone = line.slice(0, split) as Tone
  const Icon = TONE_ICON[tone] ?? Zap
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
      <p
        aria-live="polite"
        // the board itself is left-to-right; a Persian or Arabic sentence that starts with an English job name is not
        dir={dir}
        className="float-panel flex max-w-[min(40rem,100%)] items-start gap-2 rounded-xl px-3 py-2 text-[13px] leading-snug"
      >
        <Icon className="mt-0.5 size-4 shrink-0" style={{ color: STATE_COLOR[tone] }} aria-hidden />
        <span>{line.slice(split + 1)}</span>
      </p>
    </div>
  )
}

/* ───────────────────────── the board ───────────────────────── */

/** Frames the whole pipeline once React Flow has measured every card (cards differ in height). */
function FitWhenMeasured() {
  const { fitView } = useReactFlow()
  const ready = useNodesInitialized()
  const done = useRef(false)
  useEffect(() => {
    if (!ready || done.current) return
    done.current = true
    void fitView({ padding: 0.08, maxZoom: 1, duration: 0 })
  }, [ready, fitView])
  return null
}

const nodeTypes = { trigger: TriggerNode, job: JobNode, result: ResultNode }
const edgeTypes = { pipe: PipeEdge }

export function Board() {
  const workflow = useLab((s) => (s.parsed.ok ? s.parsed.workflow : null))
  const source = useLab((s) => s.source)
  const select = useLab((s) => s.select)
  const theme = useSettings((s) => s.theme)
  const graph = useMemo(() => (workflow ? layout(workflow) : null), [workflow])
  const [nodes, setNodes, onNodesChange] = useNodesState<PipeNodeType>(graph?.nodes ?? [])
  // a new workflow brings new cards (the first render already has them)
  const shown = useRef(graph)
  useEffect(() => {
    if (shown.current === graph) return
    shown.current = graph
    setNodes(graph?.nodes ?? [])
  }, [graph, setNodes])

  if (!graph) return null
  return (
    <div className="board pipe-board absolute inset-0" dir="ltr">
      <ReactFlow<PipeNodeType, PipeEdgeType>
        // a new workflow gets a fresh board, framed to fit
        key={source}
        nodes={nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={(_, node) => {
          if (node.type === 'job') select(node.data.jobId)
        }}
        nodesConnectable={false}
        elementsSelectable={false}
        edgesFocusable={false}
        minZoom={0.2}
        maxZoom={1.6}
        fitView
        fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
        colorMode={theme}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.6} className="board__grid" />
        <Controls showInteractive={false} position="bottom-left" className="float-panel !m-3 overflow-hidden rounded-lg" />
        <FitWhenMeasured />
      </ReactFlow>
      <Narration />
    </div>
  )
}
