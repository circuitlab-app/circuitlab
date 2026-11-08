import { analyze, decide, expressionsIn, fill, hasStatusCheck, SECRETS, type ExprContext, type Status } from './expr'
import { jobOrder } from './parse'
import {
  CALL_SECONDS,
  callLog,
  COMPLETE_SECONDS,
  completeLog,
  osOf,
  SETUP_SECONDS,
  setupLog,
  stepLog,
  stepSeconds,
  type LogLine,
  type Os,
} from './runner'
import { githubContext, matchTrigger, type EventChoice, type NotTriggered } from './trigger'
import type { Job, MatrixLane, Value, Workflow } from './types'

/*
 * Plays a workflow run out on a pretend clock.
 *
 * `simulate` works out the whole run at once, every job, copy and step with
 * the second it starts and ends, from the event, the steps made to fail and
 * the approvals given so far. The page then only asks "what is happening at
 * second t?" (`jobStateAt`, `stepStateAt` …), so the clock can play, pause
 * and be dragged back and forth like a scope's trace.
 *
 * Jobs start when every job in their `needs` has finished and their `if`
 * allows it; jobs with no `needs` start together. Steps in a job run one after
 * another on the job's own fresh machine. A failed step skips the steps after
 * it (unless they say `always()` or `failure()`), a failed job skips the jobs
 * that need it, and a failed matrix copy cancels its sisters (fail-fast).
 */

export type Scenario = {
  event: EventChoice
  /** steps made to fail: `job/2` in every copy, `job[1]/2` in one matrix copy */
  failures: string[]
  /** step outputs, by `job.step.output` */
  knobs: Record<string, string>
  /** environments that wait for a person to approve the job */
  reviews: string[]
}

export type Actions = {
  /** approvals of protected environments, with the simulated second they were given */
  decisions: Record<string, { approve: boolean; at: number }>
  /** the simulated second the run was cancelled, or null */
  cancelledAt: number | null
}

export type Conclusion = 'success' | 'failure' | 'cancelled' | 'skipped'

export type Condition = { text: string; value: boolean; error?: string }

export type StepRun = {
  /** `setup`, `complete`, `call` or the step's index */
  key: string
  kind: 'setup' | 'step' | 'complete' | 'call'
  /** the step's place in the YAML (-1 for the steps GitHub adds) */
  index: number
  name: string
  start: number
  end: number
  /** how long the step would have taken; log lines are timed against it */
  span: number
  conclusion: Conclusion
  /** failed, but `continue-on-error` let the job go on */
  forgiven: boolean
  injected: boolean
  reason?: 'if' | 'cancelled'
  condition?: Condition
  log: LogLine[]
}

export type LaneRun = {
  index: number
  label: string
  /** the job's name for this copy, with `${{ matrix.x }}` filled in */
  name: string
  values: Record<string, Value>
  runner: string
  os: Os
  /** when the copy asked for a machine */
  queued: number
  /** when a machine picked it up */
  start: number
  end: number
  conclusion: 'success' | 'failure' | 'cancelled'
  /** cancelled because a sister copy failed */
  failFast: boolean
  steps: StepRun[]
  stepContext: Record<string, Value>
}

export type JobRun = {
  id: string
  name: string
  /** when every job in `needs` had finished (Infinity: never) */
  ready: number
  condition?: Condition
  review?: { env: string; until: number; decision?: { approve: boolean; at: number } }
  start: number
  end: number
  /** null while it waits forever (for a review, or for a job that does) */
  conclusion: Conclusion | null
  reason?: 'if' | 'needs' | 'rejected' | 'cancelled'
  lanes: LaneRun[]
  outputs: Record<string, string>
}

export type RunConclusion = 'success' | 'failure' | 'cancelled'

export type RunEvent =
  | { t: number; kind: 'trigger' }
  | { t: number; kind: 'cancel' }
  | { t: number; kind: 'job-skip'; job: string; reason: 'if' | 'needs' | 'cancelled' }
  | { t: number; kind: 'job-wait' | 'job-approve' | 'job-reject'; job: string; env: string }
  | { t: number; kind: 'job-start'; job: string; runner: string; copies: number }
  | { t: number; kind: 'step-fail'; job: string; step: string; lane: string; forgiven: boolean }
  | { t: number; kind: 'fail-fast'; job: string }
  | { t: number; kind: 'job-end'; job: string; conclusion: Conclusion }
  | { t: number; kind: 'run-end'; conclusion: RunConclusion }

export type Timeline = {
  triggered: boolean
  notTriggered?: NotTriggered
  /** jobs, each after the jobs it needs */
  order: string[]
  jobs: Record<string, JobRun>
  /** when the last job finished (Infinity while one waits for a review) */
  end: number
  conclusion: RunConclusion | null
  events: RunEvent[]
}

/* ───────────────────────── helpers ───────────────────────── */

const round = (n: number) => Math.round(n * 10) / 10
const NEVER = Number.POSITIVE_INFINITY

/** A stable number in [0, 1) for a name, so each copy and step gets its own, repeatable pace. */
function hash01(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967296
}

const TEMPLATE = /\$\{\{([\s\S]*?)\}\}/g

/** A job's name for its card: `Test on ${{ matrix.os }}` reads "Test on ‹os›". */
export function jobTitle(job: Pick<Job, 'name'>): string {
  return job.name.replace(TEMPLATE, (_m, inner: string) => `‹${inner.trim().split('.').pop() ?? '…'}›`)
}

const fillMap = (map: Record<string, string>, ctx: ExprContext) =>
  Object.fromEntries(Object.entries(map).map(([k, v]) => [k, fill(v, ctx)]))

function ancestorsOf(id: string, byId: Map<string, Job>, seen = new Set<string>()): Set<string> {
  for (const need of byId.get(id)?.needs ?? []) {
    if (seen.has(need)) continue
    seen.add(need)
    ancestorsOf(need, byId, seen)
  }
  return seen
}

/* ───────────────────────── step outputs the reader can set ───────────────────────── */

/** A step output that something in the workflow reads, e.g. `steps.version.outputs.new`. */
export type Knob = {
  key: string
  job: string
  step: string
  output: string
  /** values the workflow writes or compares it with; empty means "type anything" */
  options: string[]
  value: string
}

const WRITES_OUTPUT = /([A-Za-z_][\w-]*)=([^\s"'>]*)["']?\s*>>\s*["']?\$\{?GITHUB_OUTPUT\}?/g

function sampleValue(name: string) {
  const n = name.toLowerCase()
  if (n.includes('version')) return '1.4.0'
  if (n.includes('tag')) return 'v1.4.0'
  if (n.includes('url')) return 'https://example.com'
  if (n.includes('sha')) return '3f9c2e1'
  return 'value'
}

/** Every text in a job that can hold `${{ }}`, with whether it is an `if:` (an expression without the braces). */
function textsOf(job: Job): [string, boolean][] {
  const texts: [string | undefined, boolean][] = [
    [job.if, true],
    [job.name, false],
    [job.runsOn, false],
    [job.environment?.url, false],
    ...Object.values(job.outputs).map((v): [string, boolean] => [v, false]),
    ...Object.values(job.env).map((v): [string, boolean] => [v, false]),
  ]
  for (const step of job.steps) {
    texts.push([step.if, true], [step.name, false], [step.run, false])
    for (const v of [...Object.values(step.with), ...Object.values(step.env)]) texts.push([v, false])
  }
  return texts.filter((t): t is [string, boolean] => !!t[0])
}

export function findKnobs(workflow: Workflow): Knob[] {
  const knobs = new Map<string, { job: string; step: string; output: string; options: Set<string> }>()
  const knob = (job: string, step: string, output: string) => {
    const key = `${job}.${step}.${output}`
    let k = knobs.get(key)
    if (!k) {
      k = { job, step, output, options: new Set() }
      knobs.set(key, k)
    }
    return k
  }
  const byId = new Map(workflow.jobs.map((j) => [j.id, j]))

  // outputs a script writes: `echo "new=true" >> "$GITHUB_OUTPUT"`
  for (const job of workflow.jobs) {
    for (const step of job.steps) {
      if (!step.id || !step.run) continue
      for (const m of step.run.matchAll(WRITES_OUTPUT)) {
        const k = knob(job.id, step.id, m[1])
        if (m[2] && !m[2].includes('$')) k.options.add(m[2])
      }
    }
  }

  // a job output that passes a step output on: `new: ${{ steps.version.outputs.new }}`
  const jobOutputSource = (jobId: string, output: string) => {
    const template = byId.get(jobId)?.outputs[output]
    if (!template) return null
    for (const expr of expressionsIn(template)) {
      const path = analyze(expr).paths.find((p) => p[0] === 'steps' && p[2] === 'outputs' && p.length === 4)
      if (path) return { job: jobId, step: path[1], output: path[3] }
    }
    return null
  }

  for (const job of workflow.jobs) {
    const target = (path: string[]) => {
      if (path.length !== 4 || path[2] !== 'outputs') return null
      if (path[0] === 'steps' && job.steps.some((s) => s.id === path[1])) {
        return { job: job.id, step: path[1], output: path[3] }
      }
      if (path[0] === 'needs') return jobOutputSource(path[1], path[3])
      return null
    }
    for (const [text, isCondition] of textsOf(job)) {
      for (const expr of isCondition ? [text] : expressionsIn(text)) {
        const { paths, comparisons } = analyze(expr)
        for (const path of paths) {
          const t = target(path)
          if (t) knob(t.job, t.step, t.output)
        }
        for (const { path, value } of comparisons) {
          const t = target(path)
          if (t) knob(t.job, t.step, t.output).options.add(value)
        }
      }
    }
  }

  return [...knobs].map(([key, k]) => {
    const options = new Set(k.options)
    // a yes/no output can always be either
    if (options.has('true')) options.add('false')
    if (options.has('false')) options.add('true')
    const list = [...options]
    const value = options.has('true') ? 'true' : (list[0] ?? sampleValue(k.output))
    return { key, job: k.job, step: k.step, output: k.output, options: list, value }
  })
}

/** Environments whose name sounds like production wait for approval at first, as most teams set them up. */
export function defaultReviews(workflow: Workflow): string[] {
  const names = workflow.jobs.map((j) => j.environment?.name).filter((n): n is string => !!n)
  return [...new Set(names.filter((n) => /prod/i.test(n)))]
}

/* ───────────────────────── one copy of a job ───────────────────────── */

type LaneInput = {
  job: Job
  def: MatrixLane
  index: number
  total: number
  queued: number
  cancel: number
  data: Record<string, Value>
  failures: Set<string>
  knobs: Record<string, string>
}

function runLane({ job, def, index, total, queued, cancel, data, failures, knobs }: LaneInput): LaneRun {
  const strategy = {
    'fail-fast': job.matrix?.failFast ?? true,
    'job-index': index,
    'job-total': total,
    'max-parallel': job.matrix?.maxParallel ?? total,
  }
  const laneData: Record<string, Value> = { ...data, matrix: def.values, strategy }
  const plain: ExprContext = { data: laneData, status: { success: true, failure: false, cancelled: false } }
  const runner = fill(job.runsOn, plain) || (job.uses ? '' : 'ubuntu-latest')
  const os = osOf(runner)
  const wobble = (key: string) => 0.85 + 0.3 * hash01(`${job.id}|${index}|${key}`)
  const pickupKey = `${job.id}|${index}|pickup`
  const pickup = job.uses ? 0.5 : os === 'self-hosted' ? 0.5 + hash01(pickupKey) : 2 + 3 * hash01(pickupKey)
  const start = round(queued + pickup)
  const name = fill(job.name, plain)
  const lane: LaneRun = {
    index,
    label: def.label,
    name,
    values: def.values,
    runner,
    os,
    queued,
    start,
    end: start,
    conclusion: 'success',
    failFast: false,
    steps: [],
    stepContext: {},
  }
  if (cancel <= start) {
    const at = Math.max(queued, cancel)
    return { ...lane, start: at, end: at, conclusion: 'cancelled' }
  }

  const runnerCtx = {
    os: os === 'windows' ? 'Windows' : os === 'macos' ? 'macOS' : 'Linux',
    arch: os === 'macos' ? 'ARM64' : 'X64',
    name: os === 'self-hosted' ? 'build-box-1' : 'GitHub Actions 12',
    environment: os === 'self-hosted' ? 'self-hosted' : 'github-hosted',
    temp: '/home/runner/work/_temp',
  }
  const jobEnv = (laneData.env ?? {}) as Record<string, Value>
  const stepContext: Record<string, Value> = {}
  let cursor = start
  let failed = false
  let cancelled = false

  // "Set up job": the fresh machine starts
  const setupSpan = round(SETUP_SECONDS * wobble('setup'))
  const setup: StepRun = {
    key: 'setup',
    kind: 'setup',
    index: -1,
    name: 'Set up job',
    start: cursor,
    end: round(cursor + setupSpan),
    span: setupSpan,
    conclusion: 'success',
    forgiven: false,
    injected: false,
    log: setupLog(job, runner, os, name),
  }
  if (cancel < setup.end) {
    setup.end = cancel
    setup.conclusion = 'cancelled'
    cancelled = true
  }
  lane.steps.push(setup)
  cursor = setup.end

  const units = job.uses
    ? [{ kind: 'call' as const, step: null }]
    : job.steps.map((step) => ({ kind: 'step' as const, step }))

  for (const unit of units) {
    const status: Status = {
      success: !failed && !cancelled && cancel > cursor,
      failure: failed,
      cancelled: cancelled || cancel <= cursor,
    }
    if (status.cancelled) cancelled = true
    const step = unit.step
    const ctx: ExprContext = {
      data: {
        ...laneData,
        steps: stepContext,
        runner: runnerCtx,
        env: step ? { ...jobEnv, ...step.env } : jobEnv,
        job: { status: failed ? 'failure' : cancelled ? 'cancelled' : 'success' },
      },
      status,
    }
    const index = step?.index ?? 0
    const decision = decide(step?.if, ctx)
    const condition = step?.if !== undefined ? { text: step.if, ...decision } : undefined
    const stepName = step ? fill(step.name, ctx) : `Call ${job.uses}`
    const key = step ? String(step.index) : 'call'

    if (!decision.value) {
      lane.steps.push({
        key,
        kind: unit.kind,
        index,
        name: stepName,
        start: cursor,
        end: cursor,
        span: 0,
        conclusion: 'skipped',
        forgiven: false,
        injected: false,
        reason: status.cancelled ? 'cancelled' : 'if',
        condition,
        log: [],
      })
      if (step?.id) stepContext[step.id] = { outputs: {}, outcome: 'skipped', conclusion: 'skipped' }
      continue
    }

    const span = round((step ? stepSeconds(step, os) : CALL_SECONDS) * wobble(key))
    const end = round(cursor + span)
    const injected = failures.has(`${job.id}/${index}`) || failures.has(`${job.id}[${lane.index}]/${index}`)
    const log = step ? stepLog(step, os, injected, (text) => fill(text, ctx)) : callLog(job.uses ?? '')

    if (cancel < end) {
      const cut = (cancel - cursor) / span
      lane.steps.push({
        key,
        kind: unit.kind,
        index,
        name: stepName,
        start: cursor,
        end: cancel,
        span,
        conclusion: 'cancelled',
        forgiven: false,
        injected,
        condition,
        log: [
          ...log.filter((line) => line.at <= cut && line.kind !== 'error'),
          { at: cut, text: '##[error]The operation was canceled.', kind: 'error' },
        ],
      })
      if (step?.id) stepContext[step.id] = { outputs: {}, outcome: 'cancelled', conclusion: 'cancelled' }
      cancelled = true
      cursor = cancel
      continue
    }

    const forgiven = injected && !!step?.continueOnError
    if (injected && !forgiven) failed = true
    if (step?.id) {
      const prefix = `${job.id}.${step.id}.`
      const outputs = injected
        ? {}
        : Object.fromEntries(
            Object.entries(knobs)
              .filter(([k]) => k.startsWith(prefix))
              .map(([k, v]) => [k.slice(prefix.length), v]),
          )
      stepContext[step.id] = {
        outputs,
        outcome: injected ? 'failure' : 'success',
        conclusion: injected && !forgiven ? 'failure' : 'success',
      }
    }
    lane.steps.push({
      key,
      kind: unit.kind,
      index,
      name: stepName,
      start: cursor,
      end,
      span,
      conclusion: injected ? 'failure' : 'success',
      forgiven,
      injected,
      condition,
      log,
    })
    cursor = end
  }

  // "Complete job" runs whatever happened before it
  const done = round(cursor + COMPLETE_SECONDS)
  lane.steps.push({
    key: 'complete',
    kind: 'complete',
    index: -1,
    name: 'Complete job',
    start: cursor,
    end: done,
    span: COMPLETE_SECONDS,
    conclusion: 'success',
    forgiven: false,
    injected: false,
    log: completeLog(),
  })
  lane.end = done
  lane.conclusion = failed ? 'failure' : cancelled ? 'cancelled' : 'success'
  lane.stepContext = stepContext
  return lane
}

/** Every copy of a job: started as runners free up (max-parallel), and cancelled when a sister fails (fail-fast). */
function runLanes(base: Omit<LaneInput, 'def' | 'index' | 'total' | 'queued'>, start: number): LaneRun[] {
  const { job } = base
  const defs = job.matrix?.lanes ?? [{ values: {}, label: '' }]
  const total = defs.length
  const plan = (index: number, queued: number, cancel: number) =>
    runLane({ ...base, def: defs[index], index, total, queued, cancel })

  const slots: number[] = Array(Math.max(1, Math.min(job.matrix?.maxParallel ?? total, total))).fill(start)
  let lanes = defs.map((_, index) => {
    const slot = slots.indexOf(Math.min(...slots))
    const lane = plan(index, slots[slot], base.cancel)
    slots[slot] = lane.end
    return lane
  })

  if (job.matrix?.failFast && lanes.length > 1) {
    const failedEnds = lanes.filter((l) => l.conclusion === 'failure').map((l) => l.end)
    if (failedEnds.length) {
      const at = Math.min(...failedEnds)
      const first = lanes.find((l) => l.conclusion === 'failure' && l.end === at)
      lanes = lanes.map((lane, index) => {
        if (lane === first || lane.end <= at) return lane
        return { ...plan(index, Math.min(lane.queued, at), Math.min(base.cancel, at)), failFast: true }
      })
    }
  }
  return lanes
}

/* ───────────────────────── the whole run ───────────────────────── */

export function simulate(workflow: Workflow, scenario: Scenario, actions: Actions): Timeline {
  const order = jobOrder(workflow.jobs) ?? workflow.jobs.map((j) => j.id)
  const match = matchTrigger(workflow, scenario.event)
  if (!match.ok) {
    return { triggered: false, notTriggered: match.reason, order, jobs: {}, end: 0, conclusion: null, events: [] }
  }

  const cancel = actions.cancelledAt ?? NEVER
  const failures = new Set(scenario.failures)
  const reviews = new Set(scenario.reviews)
  const byId = new Map(workflow.jobs.map((j) => [j.id, j]))
  const runs: Record<string, JobRun> = {}
  const events: RunEvent[] = [{ t: 0, kind: 'trigger' }]
  const github = githubContext(workflow, scenario.event)
  const base: Record<string, Value> = { github, inputs: { ...scenario.event.inputs }, vars: {}, secrets: SECRETS }
  const workflowEnv = fillMap(workflow.env, {
    data: base,
    status: { success: true, failure: false, cancelled: false },
  })

  for (const id of order) {
    const job = byId.get(id)!
    const name = jobTitle(job)
    const needs = job.needs.map((n) => runs[n])
    const ready = needs.reduce((latest, n) => Math.max(latest, n.end), 0)
    const blank = { id, name, lanes: [] as LaneRun[], outputs: {} as Record<string, string> }

    if (!Number.isFinite(ready)) {
      runs[id] = { ...blank, ready: NEVER, start: NEVER, end: NEVER, conclusion: null }
      continue
    }

    const ancestors = [...ancestorsOf(id, byId)].map((a) => runs[a])
    const status: Status = {
      success:
        cancel > ready &&
        needs.every((n) => n.conclusion === 'success') &&
        !ancestors.some((a) => a.conclusion === 'failure' || a.conclusion === 'cancelled'),
      failure: ancestors.some((a) => a.conclusion === 'failure'),
      cancelled: cancel <= ready,
    }
    const needsCtx = Object.fromEntries(needs.map((n) => [n.id, { result: n.conclusion ?? '', outputs: n.outputs }]))
    const data: Record<string, Value> = { ...base, needs: needsCtx, env: workflowEnv }
    data.env = { ...workflowEnv, ...fillMap(job.env, { data, status }) }

    const decision = decide(job.if, { data, status })
    const condition = job.if !== undefined ? { text: job.if, ...decision } : undefined
    if (!decision.value) {
      const reason = status.cancelled
        ? 'cancelled'
        : !status.success && (job.if === undefined || !hasStatusCheck(job.if))
          ? 'needs'
          : 'if'
      runs[id] = {
        ...blank,
        ready,
        condition,
        start: ready,
        end: ready,
        conclusion: reason === 'cancelled' ? 'cancelled' : 'skipped',
        reason,
      }
      events.push({ t: ready, kind: 'job-skip', job: id, reason })
      continue
    }

    // a protected environment: the job waits until someone approves it
    let start = ready
    let review: JobRun['review']
    if (job.environment) {
      const env = fill(job.environment.name, { data, status })
      if (reviews.has(env)) {
        const given = actions.decisions[id]
        const at = given ? Math.max(given.at, ready) : NEVER
        events.push({ t: ready, kind: 'job-wait', job: id, env })
        if (!given || cancel < at) {
          const until = Math.max(cancel, ready)
          const stuck = !Number.isFinite(until)
          runs[id] = {
            ...blank,
            ready,
            condition,
            review: { env, until },
            start: until,
            end: until,
            conclusion: stuck ? null : 'cancelled',
            reason: stuck ? undefined : 'cancelled',
          }
          if (!stuck) events.push({ t: until, kind: 'job-end', job: id, conclusion: 'cancelled' })
          continue
        }
        review = { env, until: at, decision: { approve: given.approve, at } }
        events.push({ t: at, kind: given.approve ? 'job-approve' : 'job-reject', job: id, env })
        if (!given.approve) {
          runs[id] = { ...blank, ready, condition, review, start: at, end: at, conclusion: 'failure', reason: 'rejected' }
          events.push({ t: at, kind: 'job-end', job: id, conclusion: 'failure' })
          continue
        }
        start = at
      }
    }

    const lanes = runLanes({ job, cancel, data, failures, knobs: scenario.knobs }, start)
    const end = lanes.reduce((latest, l) => Math.max(latest, l.end), start)
    const conclusion: Conclusion = lanes.some((l) => l.conclusion === 'failure')
      ? 'failure'
      : lanes.some((l) => l.conclusion === 'cancelled')
        ? 'cancelled'
        : 'success'

    // job outputs come from the first copy that finished well
    const source = lanes.find((l) => l.conclusion === 'success') ?? lanes[0]
    const outputs = fillMap(job.outputs, {
      data: { ...data, matrix: source.values, steps: source.stepContext },
      status: { success: conclusion === 'success', failure: conclusion === 'failure', cancelled: conclusion === 'cancelled' },
    })

    runs[id] = { ...blank, ready, condition, review, start, end, conclusion, lanes, outputs }

    if (lanes.some((l) => l.steps.length)) {
      const firstStart = Math.min(...lanes.map((l) => l.start))
      events.push({ t: firstStart, kind: 'job-start', job: id, runner: lanes[0].runner, copies: lanes.length })
    }
    for (const lane of lanes) {
      for (const step of lane.steps) {
        if (step.conclusion === 'failure') {
          events.push({ t: step.end, kind: 'step-fail', job: id, step: step.name, lane: lane.label, forgiven: step.forgiven })
        }
      }
    }
    const stopped = lanes.filter((l) => l.failFast)
    if (stopped.length) events.push({ t: Math.min(...stopped.map((l) => l.end)), kind: 'fail-fast', job: id })
    events.push({ t: end, kind: 'job-end', job: id, conclusion })
  }

  const all = Object.values(runs)
  const end = all.reduce((latest, r) => Math.max(latest, r.end), 0)
  let conclusion: RunConclusion | null = null
  if (Number.isFinite(end)) {
    conclusion = all.some((r) => r.conclusion === 'failure') ? 'failure' : Number.isFinite(cancel) ? 'cancelled' : 'success'
    events.push({ t: end, kind: 'run-end', conclusion })
  }
  if (Number.isFinite(cancel)) events.push({ t: cancel, kind: 'cancel' })
  events.sort((a, b) => a.t - b.t)
  return { triggered: true, order, jobs: runs, end, conclusion, events }
}

/* ───────────────────────── what is happening at second t ───────────────────────── */

export type JobState = 'pending' | 'waiting' | 'queued' | 'running' | Conclusion
export type LaneState = 'queued' | 'running' | LaneRun['conclusion']
export type StepState = 'pending' | 'running' | Conclusion

export const isDone = (state: string) =>
  state === 'success' || state === 'failure' || state === 'cancelled' || state === 'skipped'

export function jobStateAt(run: JobRun | undefined, t: number): JobState {
  if (!run || !Number.isFinite(run.ready) || t < run.ready) return 'pending'
  if (run.review && t < run.review.until) return 'waiting'
  if (!run.lanes.length) return run.conclusion && t >= run.end ? run.conclusion : 'pending'
  if (t >= run.end) return run.conclusion ?? 'running'
  if (run.lanes.every((l) => t < l.start)) return 'queued'
  return 'running'
}

export function laneStateAt(lane: LaneRun, t: number): LaneState {
  if (t < lane.start) return 'queued'
  if (t < lane.end) return 'running'
  return lane.conclusion
}

export function stepStateAt(step: StepRun, t: number): StepState {
  if (t < step.start) return 'pending'
  if (step.conclusion === 'skipped') return 'skipped'
  if (t < step.end) return 'running'
  return step.conclusion
}

export function stepProgress(step: StepRun, t: number): number {
  if (step.end <= step.start) return t >= step.end ? 1 : 0
  return Math.min(1, Math.max(0, (t - step.start) / (step.end - step.start)))
}

/** The log lines printed by second t. */
export function logAt(step: StepRun, t: number): LogLine[] {
  if (t < step.start) return []
  if (t >= step.end) return step.log
  return step.log.filter((line) => step.start + line.at * step.span <= t)
}

export type RunState = 'not-triggered' | 'running' | 'waiting' | RunConclusion

export function runStateAt(timeline: Timeline, t: number): RunState {
  if (!timeline.triggered) return 'not-triggered'
  if (timeline.conclusion && t >= timeline.end) return timeline.conclusion
  const states = timeline.order.map((id) => jobStateAt(timeline.jobs[id], t))
  if (states.some((s) => s === 'waiting') && !states.some((s) => s === 'running' || s === 'queued')) return 'waiting'
  return 'running'
}
