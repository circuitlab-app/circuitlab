import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  getBezierPath,
  Handle,
  Position,
  ReactFlow,
  useReactFlow,
  type EdgeProps,
  type NodeProps,
} from '@xyflow/react'
import { ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Info, Pause, Phone, Plus, RotateCcw, Trash } from 'lucide-react'
import { createContext, memo, useContext, useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useSettings } from '@/store/settings'
import { callSteps, CONVERTS, LENGTH, PART_KINDS, traceCall, type ChainNode, type PartKind, type Step, type Trace } from './parts'
import { radioOf, TECHS, type Tech } from './radio'
import { useTelecom, type Panel, type PartNodeType, type SignalEdgeType, type TelNode, type ZoneNodeType } from './store'
import { FORM_COLOR, PART_ICON, partDetail, useTelecomBook } from './ui'

/*
 * The call journey: the parts of a phone call as a circuit. Press Call and
 * the signal travels from the microphone to the speaker, part by part; each
 * wire shows what the signal is at that point. Parts can be added, removed,
 * rewired, switched off or moved further apart, and the call stops at the
 * first part that cannot do its job.
 */

type Run = { trace: Trace; steps: Step[]; step: number; index: Map<string, number> }

const RunContext = createContext<Run | null>(null)
const useRun = () => useContext(RunContext)!

const partsOf = (nodes: TelNode[]): ChainNode[] =>
  nodes.filter((n): n is PartNodeType => n.type === 'part').map((n) => ({ id: n.id, data: n.data }))

/** Is hop `i` lit at this step, and is it the one being explained? */
function hopState(run: Run, i: number | undefined): 'idle' | 'lit' | 'current' | 'bad' {
  if (i === undefined) return 'idle'
  const step = run.steps[run.step]
  if (!step) return 'idle'
  if (step.phase === 'fail' && run.trace.hops[i]?.bad) return 'bad'
  if (step.hop === i) return 'current'
  return i >= step.from && i <= step.to ? 'lit' : 'idle'
}

/* ───────────────────────── a part ───────────────────────── */

const PartCard = memo(function PartCard({ id, data, selected }: NodeProps<PartNodeType>) {
  const { book, num } = useTelecomBook()
  const tech = useTelecom((s) => s.tech)
  const run = useRun()
  const i = run.index.get(id)
  const state = hopState(run, i)
  const hop = i === undefined ? undefined : run.trace.hops[i]
  const Icon = PART_ICON[data.kind]
  const detail = partDetail(data, tech, num, book.walls)
  const flip = !!data.flip
  const [inForm, outForm] = hop ? [hop.from, hop.to] : (CONVERTS[data.kind][0] ?? [null, null])

  return (
    <div
      className={cn(
        'tel-part',
        `tel-part--${state}`,
        data.off && 'tel-part--off',
        selected && 'tel-part--selected',
      )}
      style={{ width: 168, height: 96 }}
    >
      {inForm !== null ? (
        <Handle
          type="target"
          position={flip ? Position.Right : Position.Left}
          className="tel-handle"
          style={{ '--form': FORM_COLOR[inForm] } as CSSProperties}
        />
      ) : null}
      <div className="flex items-center gap-2">
        <span className="tel-part__icon">
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12.5px] font-semibold leading-tight">{book.parts[data.kind].name}</span>
          <span className="block truncate text-[10.5px] text-muted-foreground">{book.parts[data.kind].does}</span>
        </span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-1">
        <span className="truncate font-mono text-[10px] text-muted-foreground" dir="ltr">
          {detail}
        </span>
        {hop?.bars !== undefined ? <Bars bars={hop.bars} /> : null}
      </div>
      {outForm !== null ? (
        <Handle
          type="source"
          position={flip ? Position.Left : Position.Right}
          className="tel-handle"
          style={{ '--form': FORM_COLOR[outForm] } as CSSProperties}
        />
      ) : null}
    </div>
  )
})

export function Bars({ bars, className }: { bars: number; className?: string }) {
  return (
    <span className={cn('flex items-end gap-px', className)} aria-label={`${bars}/4`}>
      {[1, 2, 3, 4].map((b) => (
        <span
          key={b}
          className="w-1 rounded-sm"
          style={{ height: 3 + b * 2.5, background: b <= bars ? 'currentColor' : 'color-mix(in oklch, currentColor 22%, transparent)' }}
        />
      ))}
    </span>
  )
}

const ZoneBox = memo(function ZoneBox({ data }: NodeProps<ZoneNodeType>) {
  const { book } = useTelecomBook()
  return (
    <div className="tel-zone" style={{ width: data.w, height: data.h }}>
      <span className="tel-zone__label">{book.zones[data.zone]}</span>
    </div>
  )
})

/* ───────────────────────── a wire ───────────────────────── */

const SignalWire = memo(function SignalWire({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected }: EdgeProps<SignalEdgeType>) {
  const { book } = useTelecomBook()
  const run = useRun()
  const from = run.index.get(source)
  const to = run.index.get(target)
  const onCall = from !== undefined && to !== undefined && to === from + 1
  const form = onCall ? run.trace.hops[from].to : null
  const step = run.steps[run.step]
  const lit = onCall && !!step && step.phase !== 'fail' && from >= step.from && to <= step.to
  const bad = onCall && step?.phase === 'fail' && run.trace.hops[to]?.bad
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, curvature: 0.35 })
  const color = bad ? 'var(--pipe-bad)' : form ? FORM_COLOR[form] : 'var(--pipe-wire)'

  return (
    <>
      <BaseEdge id={id} path={path} interactionWidth={18} style={{ stroke: 'var(--wire-outline)', strokeWidth: 8, strokeLinecap: 'round' }} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={onCall ? undefined : '6 7'}
        className={cn('pipe-wire', selected && 'wire-core--selected')}
        style={{ opacity: onCall ? 1 : 0.7 }}
      />
      {lit
        ? ['wire-flow wire-glow', 'wire-flow'].map((className) => (
            <path
              key={className}
              d={path}
              fill="none"
              className={className}
              strokeLinecap="round"
              style={{ strokeDasharray: '1 17', animationDuration: form === 'light' ? '0.25s' : '0.5s' }}
            />
          ))
        : null}
      {form ? (
        <EdgeLabelRenderer>
          <span
            className="tel-wire__label nodrag nopan pointer-events-none absolute"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, '--form': color } as CSSProperties}
          >
            {book.forms[form].name}
          </span>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
})

const nodeTypes = { part: PartCard, zone: ZoneBox }
const edgeTypes = { signal: SignalWire }

/* ───────────────────────── words for a step ───────────────────────── */

function useStepWords() {
  const { book } = useTelecomBook()
  const tech = useTelecom((s) => s.tech)
  const nodes = useTelecom((s) => s.nodes)
  const name = (kind: PartKind) => book.parts[kind].name
  return (run: Run, step: Step | undefined): { title: string; text: string } | null => {
    if (!step) return null
    const radio = radioOf(tech)
    if (step.phase === 'fail') {
      return { title: book.call.phases.fail, text: run.trace.problem ? book.call.problem(run.trace.problem, name) : '' }
    }
    if (step.phase === 'talk' && step.hop !== undefined) {
      const hop = run.trace.hops[step.hop]
      const node = nodes.find((n) => n.id === hop.id)
      const data = node?.type === 'part' ? node.data : undefined
      return {
        title: book.parts[hop.kind].name,
        text: book.call.hop({ hop, tech, radio, km: data?.km ?? LENGTH[hop.kind]?.km, walls: data?.walls }),
      }
    }
    if (step.phase === 'talk') return null
    return { title: book.call.phases[step.phase], text: book.call.say[step.phase](tech, radio) }
  }
}

function Narration({ run }: { run: Run }) {
  const { dir } = useTelecomBook()
  const words = useStepWords()
  const step = run.steps[run.step]
  const said = words(run, step)
  if (!said) return null
  const bad = step?.phase === 'fail'
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
      <div dir={dir} aria-live="polite" className={cn('float-panel max-w-[min(42rem,100%)] rounded-xl px-3.5 py-2.5', bad && 'border-[var(--pipe-bad)]')}>
        <p className={cn('text-[12px] font-semibold', bad ? 'text-[var(--pipe-bad)]' : 'text-[var(--tel-accent)]')}>{said.title}</p>
        <p className="text-[13px] leading-snug">{said.text}</p>
      </div>
    </div>
  )
}

/* ───────────────────────── toolbar ───────────────────────── */

function Toolbar({ run }: { run: Run }) {
  const { book } = useTelecomBook()
  const tech = useTelecom((s) => s.tech)
  const playing = useTelecom((s) => s.playing)
  const { setTech, play, pause, goTo, resetBoard } = useTelecom.getState()
  const last = run.steps.length - 1
  const over = run.step >= last && !playing
  return (
    <div className="float-panel absolute start-3 top-3 z-10 flex flex-wrap items-center gap-1.5 rounded-xl p-1.5" dir="ltr">
      <Select value={tech} onValueChange={(t) => setTech(t as Tech)}>
        <SelectTrigger className="h-8 w-[11.5rem]" aria-label={book.call.tech}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {TECHS.map((t) => (
            <SelectItem key={t} value={t}>
              {book.techs[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        className={cn('h-8 gap-1.5 px-3 font-semibold', playing && 'bg-[var(--pipe-run)] text-black hover:bg-[var(--pipe-run)]')}
        onClick={() => (playing ? pause() : over ? (goTo(0), play()) : play())}
      >
        {playing ? <Pause className="size-4" aria-hidden /> : <Phone className="size-4" aria-hidden />}
        {playing ? book.call.pause : over && run.step >= 0 ? book.call.again : book.call.call}
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={book.call.prev} disabled={run.step <= 0} onClick={() => goTo(run.step - 1)}>
        <ChevronLeft className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={book.call.next} disabled={run.step >= last} onClick={() => goTo(run.step + 1)}>
        <ChevronRight className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={book.call.reset} title={book.call.reset} onClick={resetBoard}>
        <RotateCcw className="size-4" />
      </Button>
    </div>
  )
}

/* ───────────────────────── side panel ───────────────────────── */

function CallPanel({ run }: { run: Run }) {
  const { book } = useTelecomBook()
  const goTo = useTelecom((s) => s.goTo)
  const words = useStepWords()
  const name = (kind: PartKind) => book.parts[kind].name
  const current = useRef<HTMLLIElement>(null)
  // (newer browsers return a promise from scrollIntoView: an effect must not return it)
  useEffect(() => {
    current.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [run.step])
  return (
    <div className="space-y-3 p-3">
      <div
        className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-[12.5px] leading-snug"
        style={{ background: `color-mix(in oklch, ${run.trace.ok ? 'var(--pipe-ok)' : 'var(--pipe-bad)'} 12%, transparent)` }}
      >
        {run.trace.ok ? (
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-[var(--pipe-ok)]" aria-hidden />
        ) : (
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-[var(--pipe-bad)]" aria-hidden />
        )}
        <span>
          {run.trace.ok ? book.call.ok : <b>{book.call.failed}. </b>}
          {!run.trace.ok && run.trace.problem ? book.call.problem(run.trace.problem, name) : null}
        </span>
      </div>
      {run.trace.notes.length ? (
        <ul className="space-y-1">
          {run.trace.notes.map((note, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs leading-snug text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-[var(--pipe-wait)]" aria-hidden />
              {book.call.note(note)}
            </li>
          ))}
        </ul>
      ) : null}
      <ol className="space-y-1">
        {run.steps.map((step, i) => {
          const said = words(run, step)
          if (!said) return null
          const active = i === run.step
          return (
            <li key={i} ref={active ? current : undefined}>
              <button
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  'w-full rounded-lg border px-2.5 py-1.5 text-start transition',
                  active ? 'border-[var(--tel-accent)] bg-[color-mix(in_oklch,var(--tel-accent)_10%,transparent)]' : 'border-transparent hover:bg-muted',
                  i > run.step && run.step >= 0 && 'opacity-60',
                  step.phase === 'fail' && 'text-[var(--pipe-bad)]',
                )}
              >
                <span className="block text-[12px] font-semibold">
                  <span className="me-1.5 text-muted-foreground tabular-nums">{i + 1}.</span>
                  {said.title}
                </span>
                {active ? <span className="mt-0.5 block text-xs leading-snug text-foreground">{said.text}</span> : null}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function PartPanel() {
  const { book, num } = useTelecomBook()
  const selected = useTelecom((s) => s.selected)
  const node = useTelecom((s) => s.nodes.find((n): n is PartNodeType => n.id === s.selected && n.type === 'part'))
  const tech = useTelecom((s) => s.tech)
  const { updatePart, removePart } = useTelecom.getState()
  if (!selected || !node) return <p className="p-3 text-xs text-muted-foreground">{book.call.pick}</p>
  const { data } = node
  const Icon = PART_ICON[data.kind]
  const length = LENGTH[data.kind]
  const text = book.parts[data.kind]
  return (
    <div className="space-y-4 p-3">
      <div className="flex items-start gap-2.5">
        <span className="tel-part__icon size-9">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold">{text.name}</h3>
          <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
            {partDetail(data, tech, num, book.walls)}
          </p>
        </div>
      </div>
      <p className="text-[13px] leading-relaxed">{text.inside}</p>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">{book.call.takesGives}</p>
        <div className="flex flex-wrap gap-1.5" dir="ltr">
          {CONVERTS[data.kind].map(([a, b], i) => (
            <span key={i} className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px]">
              {a ? <span style={{ color: FORM_COLOR[a] }}>● {book.forms[a].name}</span> : <span>🎤</span>}
              <span className="text-muted-foreground">→</span>
              {b ? <span style={{ color: FORM_COLOR[b] }}>● {book.forms[b].name}</span> : <span>👂</span>}
            </span>
          ))}
        </div>
      </div>
      {length ? (
        <label className="block space-y-1.5">
          <span className="flex justify-between text-xs">
            <span className="text-muted-foreground">{book.call.length}</span>
            <span className="font-mono tabular-nums" dir="ltr">
              {num(data.km ?? length.km, 1)} km
            </span>
          </span>
          <Slider
            min={data.kind === 'air' ? 0.05 : 0.5}
            max={length.max}
            step={data.kind === 'air' ? 0.05 : 0.5}
            value={[data.km ?? length.km]}
            onValueChange={([km]) => updatePart(node.id, { km })}
            dir="ltr"
          />
        </label>
      ) : null}
      {data.kind === 'air' ? (
        <label className="block space-y-1.5">
          <span className="flex justify-between text-xs">
            <span className="text-muted-foreground">{book.map.walls}</span>
            <span className="tabular-nums">{book.walls(data.walls ?? 0)}</span>
          </span>
          <Slider min={0} max={6} step={1} value={[data.walls ?? 0]} onValueChange={([walls]) => updatePart(node.id, { walls })} dir="ltr" />
        </label>
      ) : null}
      <label className="flex items-center justify-between text-[13px]">
        {book.call.working}
        <Switch checked={!data.off} onCheckedChange={(on) => updatePart(node.id, { off: !on })} />
      </label>
      <Button variant="outline" size="sm" className="w-full text-destructive" onClick={() => removePart(node.id)}>
        <Trash className="size-3.5" aria-hidden />
        {book.call.remove}
      </Button>
    </div>
  )
}

function Tray() {
  const { book } = useTelecomBook()
  const addPart = useTelecom((s) => s.addPart)
  const { screenToFlowPosition } = useReactFlow()
  const add = (kind: (typeof PART_KINDS)[number]) => {
    const board = document.querySelector('[data-tel-board]')?.getBoundingClientRect()
    const at = board ? screenToFlowPosition({ x: board.left + board.width / 2 - 84, y: board.top + board.height / 2 - 48 }) : { x: 0, y: 0 }
    addPart(kind, { x: at.x + (Math.random() - 0.5) * 60, y: at.y + (Math.random() - 0.5) * 40 })
  }
  return (
    <div className="space-y-2 p-3">
      <p className="text-xs leading-snug text-muted-foreground">{book.call.trayHint}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {PART_KINDS.map((kind) => {
          const Icon = PART_ICON[kind]
          return (
            <button
              key={kind}
              type="button"
              onClick={() => add(kind)}
              className="flex items-center gap-2 rounded-lg border p-2 text-start transition hover:border-[var(--tel-accent)] hover:bg-muted"
            >
              <span className="tel-part__icon">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-medium">{book.parts[kind].name}</span>
                <span className="block truncate text-[10.5px] text-muted-foreground">{book.parts[kind].does}</span>
              </span>
              <Plus className="ms-auto size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">{book.call.connectHint}</p>
    </div>
  )
}

/** While the call plays, the camera follows the part being explained; between parts it shows the whole circuit. */
function FollowCall({ run }: { run: Run }) {
  const { setCenter, fitView, getNode, getZoom } = useReactFlow()
  const step = run.steps[run.step]
  const id = step?.hop !== undefined ? run.trace.hops[step.hop]?.id : undefined
  useEffect(() => {
    if (!step) return
    const node = id ? getNode(id) : undefined
    if (node) {
      void setCenter(node.position.x + 84, node.position.y + 48, { zoom: Math.max(getZoom(), 0.85), duration: 600 })
    } else {
      void fitView({ padding: 0.1, maxZoom: 1, duration: 600 })
    }
  }, [step, id, setCenter, fitView, getNode, getZoom])
  return null
}

/* ───────────────────────── the section ───────────────────────── */

export function CallBoard() {
  const { book } = useTelecomBook()
  const nodes = useTelecom((s) => s.nodes)
  const edges = useTelecom((s) => s.edges)
  const tech = useTelecom((s) => s.tech)
  const step = useTelecom((s) => s.step)
  const playing = useTelecom((s) => s.playing)
  const panel = useTelecom((s) => s.panel)
  const theme = useSettings((s) => s.theme)
  const { onNodesChange, onEdgesChange, connect, select, setPanel, goTo, pause } = useTelecom.getState()

  const trace = useMemo(() => traceCall(partsOf(nodes), edges, tech), [nodes, edges, tech])
  const steps = useMemo(() => callSteps(trace), [trace])
  const run: Run = useMemo(
    () => ({ trace, steps, step: Math.min(step, steps.length - 1), index: new Map(trace.hops.map((h, i) => [h.id, i])) }),
    [trace, steps, step],
  )

  // the call moves on one step every couple of seconds while it plays
  useEffect(() => {
    if (!playing) return
    if (run.step >= steps.length - 1) {
      pause()
      return
    }
    const timer = window.setTimeout(() => goTo(run.step + 1), run.step < 0 ? 300 : 2600)
    return () => window.clearTimeout(timer)
  }, [playing, run.step, steps.length, goTo, pause])

  return (
    <RunContext.Provider value={run}>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="board relative min-h-0 flex-1 max-lg:min-h-[55%]" data-tel-board dir="ltr">
          <ReactFlow<TelNode, SignalEdgeType>
            key={tech}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={connect}
            isValidConnection={(c) => c.source !== c.target}
            onNodeClick={(_, node) => {
              if (node.type === 'part') select(node.id)
            }}
            onPaneClick={() => select(null)}
            deleteKeyCode={['Backspace', 'Delete']}
            connectionRadius={30}
            minZoom={0.2}
            maxZoom={1.8}
            fitView
            fitViewOptions={{ padding: 0.1, maxZoom: 1 }}
            colorMode={theme}
            defaultEdgeOptions={{ type: 'signal' }}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1.6} className="board__grid" />
            <Controls showInteractive={false} position="bottom-left" className="float-panel !m-3 overflow-hidden rounded-lg" />
            <FollowCall run={run} />
          </ReactFlow>
          <Toolbar run={run} />
          <Narration run={run} />
        </div>
        <aside className="flex min-h-0 flex-col border-t bg-background max-lg:h-[45%] lg:w-[380px] lg:shrink-0 lg:border-s lg:border-t-0">
          <Tabs value={panel} onValueChange={(v) => setPanel(v as Panel)} className="flex min-h-0 flex-1 flex-col gap-0">
            <TabsList className="mx-2 mt-2 mb-1 w-auto self-stretch">
              {(['call', 'part', 'tray'] as Panel[]).map((p) => (
                <TabsTrigger key={p} value={p} className="text-[12.5px]">
                  {book.call.panels[p]}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="call" className="min-h-0 overflow-y-auto">
              <CallPanel run={run} />
            </TabsContent>
            <TabsContent value="part" className="min-h-0 overflow-y-auto">
              <PartPanel />
            </TabsContent>
            <TabsContent value="tray" className="min-h-0 overflow-y-auto">
              <Tray />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </RunContext.Provider>
  )
}
