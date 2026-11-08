import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  Bug,
  CalendarClock,
  CircleCheck,
  CircleDashed,
  CircleMinus,
  CircleSlash,
  CircleX,
  Clock,
  GitCommitHorizontal,
  GitPullRequest,
  Hand,
  LoaderCircle,
  Lock,
  Play,
  RotateCcw,
  Rocket,
  Server,
  ShieldCheck,
  Tag,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { memo, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { JobNodeType } from './layout'
import {
  jobStateAt,
  jobTitle,
  laneStateAt,
  runStateAt,
  stepProgress,
  stepStateAt,
  type LaneRun,
  type StepRun,
} from './simulate'
import { useLab } from './store'
import { PULL_EVENTS, type EventChoice } from './trigger'
import type { Job, Trigger } from './types'
import { STATE_COLOR, usePipelineBook } from './ui'

/* ───────────────────────── small shared pieces ───────────────────────── */

const ICONS: Record<string, LucideIcon> = {
  success: CircleCheck,
  failure: CircleX,
  running: LoaderCircle,
  waiting: Hand,
  queued: Clock,
  pending: CircleDashed,
  ready: CircleDashed,
  cancelled: CircleSlash,
  skipped: CircleMinus,
}

export function StatusIcon({ state, className }: { state: string; className?: string }) {
  const Icon = ICONS[state] ?? CircleDashed
  return (
    <Icon
      aria-hidden
      className={cn('size-3.5 shrink-0', state === 'running' && 'animate-spin motion-reduce:animate-none', className)}
      style={{ color: STATE_COLOR[state] ?? 'var(--pipe-idle)' }}
    />
  )
}

/** The tiny lamp of a card, like the one on a power supply. */
export function Lamp({ state }: { state: string }) {
  const lit = state !== 'ready' && state !== 'pending'
  return (
    <span
      aria-hidden
      className={cn(
        'status-led',
        lit && 'status-led--lit',
        (state === 'running' || state === 'waiting' || state === 'queued') && 'status-led--blink',
      )}
      style={{ '--led': STATE_COLOR[state] ?? 'var(--pipe-idle)' } as CSSProperties}
    />
  )
}

export function eventIcon(choice: Pick<EventChoice, 'event' | 'tag'>): LucideIcon {
  if (choice.event === 'push') return choice.tag ? Tag : GitCommitHorizontal
  if (PULL_EVENTS.includes(choice.event)) return GitPullRequest
  if (choice.event === 'workflow_dispatch') return Hand
  if (choice.event === 'schedule') return CalendarClock
  if (choice.event === 'release') return Rocket
  return Zap
}

/** What the event is about: the branch, the tag or the pull request's two branches. */
export function eventRef(choice: EventChoice, crons?: string[]): string {
  if (choice.event === 'push') return choice.tag ?? choice.branch
  if (PULL_EVENTS.includes(choice.event)) return `${choice.branch} → ${choice.base}`
  if (choice.event === 'release') return choice.tag ?? ''
  if (choice.event === 'schedule') return crons?.[0] ?? choice.branch
  return choice.branch
}

/* ───────────────────────── the trigger: a battery ───────────────────────── */

// one empty list, so a selector never hands back a new array (which would re-render forever)
const NO_TRIGGERS: Trigger[] = []

function Battery({ state }: { state: 'ready' | 'fired' | 'off' }) {
  const charge = state === 'fired' ? 'var(--pipe-run)' : state === 'off' ? 'var(--pipe-bad)' : 'var(--pipe-idle)'
  return (
    <svg viewBox="0 0 72 34" className="h-9 w-[76px] shrink-0" aria-hidden>
      <rect x="1.5" y="1.5" width="62" height="31" rx="6" fill="var(--stage-bg)" stroke="var(--terminal-ring)" strokeWidth="2" />
      <rect x="64" y="11" width="6" height="12" rx="2" fill="var(--terminal-ring)" />
      <rect x="5" y="5" width="55" height="24" rx="3.5" style={{ fill: charge, opacity: state === 'ready' ? 0.35 : 0.9 }} />
      <text x="12" y="22" fontSize="14" fontWeight="700" fill="white" opacity="0.9">
        +
      </text>
      <text x="48" y="22" fontSize="14" fontWeight="700" fill="white" opacity="0.9">
        −
      </text>
    </svg>
  )
}

export const TriggerNode = memo(function TriggerNode() {
  const { book, eventName, dir } = usePipelineBook()
  const triggers = useLab((s) => (s.parsed.ok ? s.parsed.workflow.triggers : NO_TRIGGERS))
  const choice = useLab((s) => s.scenario.event)
  const started = useLab((s) => s.started)
  const triggered = useLab((s) => s.timeline?.triggered ?? false)
  const reason = useLab((s) => s.timeline?.notTriggered)
  const runState = useLab((s) => (s.started && s.timeline ? runStateAt(s.timeline, s.t) : 'ready'))
  const togglePlay = useLab((s) => s.togglePlay)
  const setTab = useLab((s) => s.setTab)
  const state = !started ? 'ready' : triggered ? 'fired' : 'off'
  const Icon = eventIcon(choice)
  const crons = triggers.find((t) => t.event === 'schedule')?.crons
  const over = runState === 'success' || runState === 'failure' || runState === 'cancelled'

  return (
    <div
      className={cn('pipe-node pipe-trigger', state === 'fired' && !over && 'pipe-node--running', state === 'off' && 'pipe-node--failure')}
      style={{ width: 232 }}
    >
      <div className="pipe-node__head">
        <Lamp state={state === 'fired' ? (over ? 'success' : 'running') : state === 'off' ? 'failure' : 'ready'} />
        <span className="pipe-node__title">{book.trigger.title}</span>
        <span className="pipe-node__state">
          {state === 'fired' ? book.trigger.fired : state === 'off' ? book.trigger.off : ''}
        </span>
      </div>

      <button
        type="button"
        className="nodrag flex items-center gap-2.5 rounded-lg p-1 text-start transition hover:bg-muted"
        onClick={() => setTab('scenario')}
      >
        <Battery state={state} />
        <span className="min-w-0">
          <span className="flex items-center gap-1 text-[13px] font-semibold">
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{eventName(choice.event)}</span>
          </span>
          <span className="block truncate font-mono text-[11px] text-muted-foreground" dir="ltr">
            {eventRef(choice, crons)}
          </span>
        </span>
      </button>

      <div className="flex min-h-[22px] flex-wrap items-center gap-1 text-[10.5px]">
        <span className="text-muted-foreground">{book.trigger.listens}</span>
        {triggers.map((t) => (
          <span key={t.event} className={cn('pipe-on', t.event === choice.event && 'pipe-on--active')} dir="ltr">
            {t.event}
          </span>
        ))}
      </div>

      {state === 'off' && reason ? (
        <p className="line-clamp-3 text-[11px] leading-snug text-[var(--pipe-bad)]" dir={dir}>
          {book.why(reason)}
        </p>
      ) : null}

      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          'nodrag mt-auto flex h-8 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold shadow-sm transition active:translate-y-px',
          state === 'fired' && !over ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground',
        )}
      >
        {over || state === 'off' ? <RotateCcw className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
        {!started ? book.trigger.fire : over || state === 'off' ? book.controls.again : book.trigger.fired}
      </button>

      <Handle type="source" position={Position.Right} className="pipe-handle" isConnectable={false} />
    </div>
  )
})

/* ───────────────────────── a job: a part on the board ───────────────────────── */

type Row = { key: string; name: string; kind: StepRun['kind']; index: number; run?: StepRun }

/** The rows of a job card before it runs: GitHub's own first and last step around the YAML's steps. */
function plannedRows(job: Job): Row[] {
  const middle: Row[] = job.uses
    ? [{ key: 'call', name: `Call ${job.uses}`, kind: 'call', index: 0 }]
    : job.steps.map((s) => ({ key: String(s.index), name: jobTitle({ name: s.name }), kind: 'step' as const, index: s.index }))
  return [
    { key: 'setup', name: 'Set up job', kind: 'setup', index: -1 },
    ...middle,
    { key: 'complete', name: 'Complete job', kind: 'complete', index: -1 },
  ]
}

function Elapsed({ from }: { from: number }) {
  const { clock } = usePipelineBook()
  const seconds = useLab((s) => Math.floor(s.t - from))
  return <>{clock(seconds)}</>
}

function StepBar({ run }: { run: StepRun }) {
  const progress = useLab((s) => stepProgress(run, s.t))
  return <span className="pipe-step__bar" style={{ width: `${progress * 100}%` }} aria-hidden />
}

function StepRow({ jobId, row, failKey }: { jobId: string; row: Row; failKey: string | null }) {
  const { book, clock } = usePipelineBook()
  const state = useLab((s) => (row.run && s.started ? stepStateAt(row.run, s.t) : 'pending'))
  const injected = useLab((s) => failKey !== null && s.scenario.failures.includes(failKey))
  const open = useLab((s) => s.selected === jobId && s.step === row.key)
  const toggleFailure = useLab((s) => s.toggleFailure)
  const select = useLab((s) => s.select)
  const added = row.kind === 'setup' || row.kind === 'complete'
  const done = state === 'success' || state === 'failure' || state === 'cancelled'

  return (
    <div className={cn('pipe-step', open && 'pipe-step--open', added && 'pipe-step--added')} data-state={state}>
      <button
        type="button"
        className="pipe-step__main nodrag"
        title={added ? book.card.added : row.name}
        onClick={() => select(jobId, row.key)}
      >
        <StatusIcon state={state} className="size-3" />
        <span className="truncate" dir="auto">
          {row.name}
        </span>
        <span className="pipe-step__time">
          {row.run && state === 'running' ? <Elapsed from={row.run.start} /> : row.run && done ? clock(row.run.end - row.run.start) : null}
        </span>
      </button>
      {failKey ? (
        <button
          type="button"
          className="pipe-step__bug nodrag"
          data-on={injected}
          aria-pressed={injected}
          aria-label={injected ? book.card.fixStep : book.card.breakStep}
          title={injected ? book.card.fixStep : book.card.breakStep}
          onClick={() => toggleFailure(failKey)}
        >
          <Bug className="size-3" aria-hidden />
        </button>
      ) : (
        <span aria-hidden />
      )}
      {row.run && state === 'running' ? <StepBar run={row.run} /> : null}
    </div>
  )
}

function LaneChip({
  jobId,
  lane,
  label,
  index,
  active,
}: {
  jobId: string
  lane?: LaneRun
  label: string
  index: number
  active: boolean
}) {
  const state = useLab((s) => (lane && s.started ? laneStateAt(lane, s.t) : 'ready'))
  const selectLane = useLab((s) => s.selectLane)
  return (
    <button
      type="button"
      onClick={() => selectLane(jobId, index)}
      className={cn('pipe-lane nodrag', active && 'pipe-lane--active')}
      title={label}
      aria-pressed={active}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: STATE_COLOR[state] }} aria-hidden />
      <span className="truncate" dir="ltr">
        {label}
      </span>
    </button>
  )
}

function Approval({ jobId, env }: { jobId: string; env: string }) {
  const { book, dir } = usePipelineBook()
  const approve = useLab((s) => s.approve)
  return (
    <div className="pipe-approval nodrag" role="group" aria-label={book.card.waitingFor(env)} dir={dir}>
      <p className="flex items-start gap-1.5 text-[11.5px] leading-snug font-medium">
        <Hand className="mt-px size-3.5 shrink-0 text-[var(--pipe-wait)]" aria-hidden />
        <span>{book.card.waitingFor(env)}</span>
      </p>
      <div className="flex gap-1.5">
        <button type="button" className="pipe-approval__yes" onClick={() => approve(jobId, true)}>
          {book.card.approve}
        </button>
        <button type="button" className="pipe-approval__no" onClick={() => approve(jobId, false)}>
          {book.card.reject}
        </button>
      </div>
    </div>
  )
}

export const JobNode = memo(function JobNode({ data }: NodeProps<JobNodeType>) {
  const { book, clock, dir } = usePipelineBook()
  const id = data.jobId
  const job = useLab((s) => (s.parsed.ok ? s.parsed.workflow.jobs.find((j) => j.id === id) : undefined))
  const run = useLab((s) => s.timeline?.jobs[id])
  const started = useLab((s) => s.started)
  const state = useLab((s) => (s.started ? jobStateAt(s.timeline?.jobs[id], s.t) : 'ready'))
  const decided = useLab((s) => s.started && !!s.timeline?.jobs[id] && s.t >= s.timeline.jobs[id].ready)
  const selected = useLab((s) => s.selected === id)
  const wantedLane = useLab((s) => s.lanes[id] ?? 0)
  const isProtected = useLab((s) => !!job?.environment && s.scenario.reviews.includes(job.environment.name))
  if (!job) return null

  const lanes = job.matrix?.lanes ?? []
  const multi = lanes.length > 1
  const laneIndex = Math.min(wantedLane, Math.max(0, lanes.length - 1))
  const lane = run?.lanes[laneIndex]
  const rows: Row[] = lane?.steps.length
    ? lane.steps.map((step) => ({ key: step.key, name: step.name, kind: step.kind, index: step.index, run: step }))
    : plannedRows(job)
  const failKey = (row: Row) =>
    row.kind === 'setup' || row.kind === 'complete' ? null : multi ? `${id}[${laneIndex}]/${row.index}` : `${id}/${row.index}`

  let banner: string | null = null
  if (started && run) {
    if (state === 'skipped') banner = run.reason === 'needs' ? book.card.skippedNeeds : book.card.skippedIf
    else if (state === 'cancelled' && !run.lanes.length) banner = book.card.cancelled
    else if (state === 'failure' && run.reason === 'rejected') banner = book.card.rejected
    else if (lane?.failFast && lane.conclusion === 'cancelled' && (state === 'failure' || state === 'cancelled')) {
      banner = book.card.failFast
    }
  }

  const firstStart = run?.lanes.length ? Math.min(...run.lanes.map((l) => l.start)) : null
  const condition = run?.condition
  const runner = lane?.runner || job.runsOn || job.uses || 'ubuntu-latest'
  const finished = state === 'success' || state === 'failure' || state === 'cancelled'

  return (
    <div className={cn('pipe-node', `pipe-node--${state}`, selected && 'pipe-node--selected')} style={{ width: 272 }}>
      <Handle type="target" position={Position.Left} className="pipe-handle" isConnectable={false} />

      <div className="pipe-node__head">
        <Lamp state={state} />
        <span className="pipe-node__title" title={job.name} dir="auto">
          {jobTitle(job)}
        </span>
        <span className="pipe-node__state">{book.job[state]}</span>
      </div>

      {job.if !== undefined || job.environment || job.matrix ? (
        <div className="pipe-node__meta">
          {job.if !== undefined ? (
            <span
              className="pipe-chip min-w-0 font-mono"
              data-tone={decided && condition ? (condition.value ? 'ok' : 'off') : undefined}
              title={`if: ${job.if}`}
              dir="ltr"
            >
              <b className="shrink-0">if</b>
              <span className="truncate">{job.if}</span>
            </span>
          ) : null}
          {job.environment ? (
            <span className="pipe-chip min-w-0" title={job.environment.name} data-tone={isProtected ? 'wait' : undefined}>
              <ShieldCheck className="size-3 shrink-0" aria-hidden />
              <span className="truncate" dir="ltr">
                {job.environment.name}
              </span>
              {isProtected ? <Lock className="size-2.5 shrink-0" aria-label={book.card.protected} /> : null}
            </span>
          ) : null}
          {job.matrix ? (
            <span className="pipe-chip shrink-0 font-mono" title={book.card.copies(Math.max(1, lanes.length))}>
              ×{Math.max(1, lanes.length)}
            </span>
          ) : null}
        </div>
      ) : null}

      {multi ? (
        <div className="pipe-lanes">
          {lanes.map((l, i) => (
            <LaneChip key={i} jobId={id} lane={run?.lanes[i]} label={l.label} index={i} active={i === laneIndex} />
          ))}
        </div>
      ) : null}

      <div className={cn('pipe-steps', state === 'skipped' && 'opacity-60')}>
        {rows.map((row) => (
          <StepRow key={row.key} jobId={id} row={row} failKey={failKey(row)} />
        ))}
        {state === 'waiting' && run?.review ? <Approval jobId={id} env={run.review.env} /> : null}
      </div>

      <div className="pipe-node__foot">
        <span className="flex min-w-0 items-center gap-1" title={runner}>
          <Server className="size-3 shrink-0" aria-hidden />
          <span className="truncate" dir="ltr">
            {runner}
          </span>
        </span>
        <span className="shrink-0 tabular-nums">
          {firstStart !== null && started && state === 'running' ? (
            <Elapsed from={firstStart} />
          ) : firstStart !== null && run && started && finished && Number.isFinite(run.end) ? (
            clock(run.end - firstStart)
          ) : null}
        </span>
      </div>

      {banner ? (
        <div className="pipe-node__banner" dir={dir}>
          {banner}
        </div>
      ) : null}

      <Handle type="source" position={Position.Right} className="pipe-handle" isConnectable={false} />
    </div>
  )
})

/* ───────────────────────── the run result: a bulb ───────────────────────── */

export const ResultNode = memo(function ResultNode() {
  const { book, clock } = usePipelineBook()
  const state = useLab((s) => (s.started && s.timeline ? runStateAt(s.timeline, s.t) : 'ready'))
  const end = useLab((s) => s.timeline?.end ?? 0)
  const seconds = useLab((s) => (s.started ? Math.floor(s.t) : 0))
  const lit = state === 'success' || state === 'failure' || state === 'running' || state === 'waiting'
  const over = state === 'success' || state === 'failure' || state === 'cancelled'
  const color = STATE_COLOR[state] ?? 'var(--pipe-idle)'

  return (
    <div className={cn('pipe-node pipe-result', `pipe-node--${state}`)} style={{ width: 176 }}>
      <Handle type="target" position={Position.Left} className="pipe-handle" isConnectable={false} />
      <div className="pipe-node__head">
        <Lamp state={state === 'not-triggered' ? 'failure' : state} />
        <span className="pipe-node__title">{book.result.title}</span>
      </div>
      <div className="relative grid place-items-center py-1">
        {lit ? (
          <span
            aria-hidden
            className={cn('pipe-bulb__glow', !over && 'pipe-bulb__glow--flicker')}
            style={{ background: `radial-gradient(circle, color-mix(in oklch, ${color} 55%, transparent), transparent 70%)` }}
          />
        ) : null}
        <svg viewBox="0 0 64 84" className="relative h-[86px] w-[66px]" aria-hidden>
          <path
            d="M32 4a24 24 0 0 0-14.5 43.1c3.4 2.7 5.5 6.6 5.5 10.9V62h18v-4c0-4.3 2.1-8.2 5.5-10.9A24 24 0 0 0 32 4Z"
            fill={lit || over ? color : 'var(--stage-bg)'}
            fillOpacity={state === 'success' || state === 'failure' ? 0.95 : lit ? 0.55 : over ? 0.5 : 1}
            stroke="var(--terminal-ring)"
            strokeWidth="2"
          />
          <path
            d="M26 46c0-8 2-14 6-14s6 6 6 14"
            fill="none"
            stroke={lit ? 'white' : 'var(--terminal-ring)'}
            strokeOpacity={lit ? 0.9 : 0.6}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect x="22" y="63" width="20" height="5" rx="2" fill="var(--terminal-ring)" />
          <rect x="24" y="70" width="16" height="5" rx="2" fill="var(--terminal-ring)" />
          <path d="M27 77h10a5 5 0 0 1-10 0Z" fill="var(--terminal-ring)" />
        </svg>
      </div>
      <p className="text-center text-[13px] font-semibold" style={{ color: state === 'ready' ? undefined : color }}>
        {book.run[state]}
      </p>
      <p className="text-center text-[11px] text-muted-foreground tabular-nums">
        {over ? clock(end) : state === 'running' || state === 'waiting' ? clock(seconds) : book.result.hint}
      </p>
    </div>
  )
})
