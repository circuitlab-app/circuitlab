import { ArrowLeft, CircleCheck, CircleX, ClipboardPaste, Pencil, Server, ShieldCheck, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { StatusIcon } from './nodes'
import { jobStateAt, jobTitle, laneStateAt, logAt, stepStateAt, type StepRun } from './simulate'
import { useLab } from './store'
import { eventFor, findTrigger, PULL_EVENTS, sampleFor, type EventChoice } from './trigger'
import type { ParseProblem, Workflow } from './types'
import { STATE_COLOR, usePipelineBook } from './ui'

const INPUT =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 font-mono text-[13px] outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

function Section({ title, help, children }: { title: string; help?: string; children?: ReactNode }) {
  return (
    <section className="space-y-2 border-b py-3.5 last:border-b-0">
      <div>
        <h3 className="text-[13px] font-semibold">{title}</h3>
        {help ? <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{help}</p> : null}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid grid-cols-[6.5rem_1fr] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

const useWorkflow = () => useLab((s) => (s.parsed.ok ? s.parsed.workflow : null))

/* ───────────────────────── set up the run ───────────────────────── */

function suggestions(workflow: Workflow, event: string, kind: 'branch' | 'tag'): string[] {
  const f = findTrigger(workflow, event)?.filter ?? {}
  const patterns = (kind === 'branch' ? f.branches : f.tags) ?? []
  const own = patterns.filter((p) => !p.startsWith('!')).map((p) => sampleFor(p, kind))
  const common =
    kind === 'branch' ? ['main', 'develop', 'feature/login', 'release/1.4'] : ['v1.4.0', 'v2.0.0-beta.1', 'nightly']
  return [...new Set([...own, ...common])]
}

function RefInput({
  label,
  list,
  value,
  onChange,
}: {
  label: string
  list: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <input className={INPUT} dir="ltr" list={list} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  )
}

function EventSection({ workflow }: { workflow: Workflow }) {
  const { book, eventName } = usePipelineBook()
  const choice = useLab((s) => s.scenario.event)
  const setEvent = useLab((s) => s.setEvent)
  const triggered = useLab((s) => s.timeline?.triggered ?? false)
  const reason = useLab((s) => s.timeline?.notTriggered)
  const trigger = findTrigger(workflow, choice.event)
  const pull = PULL_EVENTS.includes(choice.event)
  const tagPush = choice.event === 'push' && choice.tag !== null
  const branchList = `pipe-branches-${choice.event}`
  const tagList = `pipe-tags-${choice.event}`
  const change = (patch: Partial<EventChoice>) => setEvent({ ...choice, ...patch })

  return (
    <Section title={book.scenario.event}>
      <Select value={choice.event} onValueChange={(event) => setEvent(eventFor(workflow, event))}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {workflow.triggers.map((t) => (
            <SelectItem key={t.event} value={t.event}>
              <span>{eventName(t.event)}</span>
              <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">
                {t.event}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <datalist id={branchList}>
        {suggestions(workflow, choice.event, 'branch').map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      <datalist id={tagList}>
        {suggestions(workflow, choice.event, 'tag').map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>

      <div className="space-y-2">
        {choice.event === 'push' ? (
          <>
            <Field label={book.scenario.pushTo}>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={tagPush ? 'tag' : 'branch'}
                onValueChange={(kind) => {
                  if (kind === 'tag') change({ tag: suggestions(workflow, 'push', 'tag')[0] })
                  if (kind === 'branch') change({ tag: null })
                }}
              >
                <ToggleGroupItem value="branch" className="px-2.5 text-xs">
                  {book.scenario.branchPush}
                </ToggleGroupItem>
                <ToggleGroupItem value="tag" className="px-2.5 text-xs">
                  {book.scenario.tagPush}
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
            {tagPush ? (
              <RefInput label={book.scenario.tag} list={tagList} value={choice.tag ?? ''} onChange={(tag) => change({ tag })} />
            ) : (
              <RefInput label={book.scenario.branch} list={branchList} value={choice.branch} onChange={(branch) => change({ branch })} />
            )}
          </>
        ) : pull ? (
          <>
            <RefInput label={book.scenario.from} list={branchList} value={choice.branch} onChange={(branch) => change({ branch })} />
            <RefInput label={book.scenario.into} list={branchList} value={choice.base} onChange={(base) => change({ base })} />
          </>
        ) : choice.event === 'release' ? (
          <RefInput label={book.scenario.tag} list={tagList} value={choice.tag ?? ''} onChange={(tag) => change({ tag })} />
        ) : choice.event === 'schedule' ? (
          <Field label={book.scenario.crons}>
            <span className="flex flex-wrap gap-1 font-mono text-[12px]" dir="ltr">
              {(trigger?.crons ?? []).map((c) => (
                <span key={c} className="rounded bg-muted px-1.5 py-0.5">
                  {c}
                </span>
              ))}
            </span>
          </Field>
        ) : (
          <RefInput label={book.scenario.branch} list={branchList} value={choice.branch} onChange={(branch) => change({ branch })} />
        )}

        {trigger?.inputs?.length ? (
          <div className="space-y-2 rounded-lg bg-muted/50 p-2">
            <p className="text-xs font-medium">{book.scenario.inputs}</p>
            {trigger.inputs.map((input) => {
              const value = choice.inputs[input.name] ?? ''
              const set = (v: string) => change({ inputs: { ...choice.inputs, [input.name]: v } })
              return (
                <Field key={input.name} label={input.name}>
                  {input.type === 'boolean' ? (
                    <Switch checked={value === 'true'} onCheckedChange={(on) => set(on ? 'true' : 'false')} />
                  ) : input.options?.length ? (
                    <Select value={value} onValueChange={set}>
                      <SelectTrigger size="sm" className="w-full font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {input.options.map((o) => (
                          <SelectItem key={o} value={o} className="font-mono">
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <input className={INPUT} dir="ltr" value={value} onChange={(e) => set(e.target.value)} />
                  )}
                </Field>
              )
            })}
          </div>
        ) : null}
      </div>

      <p
        className="flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-xs leading-snug"
        style={{ background: `color-mix(in oklch, ${triggered ? 'var(--pipe-ok)' : 'var(--pipe-bad)'} 12%, transparent)` }}
      >
        {triggered ? (
          <CircleCheck className="mt-px size-3.5 shrink-0 text-[var(--pipe-ok)]" aria-hidden />
        ) : (
          <CircleX className="mt-px size-3.5 shrink-0 text-[var(--pipe-bad)]" aria-hidden />
        )}
        <span>{triggered ? book.scenario.starts : reason ? book.why(reason) : ''}</span>
      </p>
      {trigger?.filter.paths || trigger?.filter.pathsIgnore ? (
        <p className="text-[11px] text-muted-foreground">{book.scenario.paths}</p>
      ) : null}
    </Section>
  )
}

function KnobsSection() {
  const { book } = usePipelineBook()
  const knobs = useLab((s) => s.knobs)
  const values = useLab((s) => s.scenario.knobs)
  const setKnob = useLab((s) => s.setKnob)
  return (
    <Section title={book.scenario.outputs} help={knobs.length ? book.scenario.outputsHelp : book.scenario.noOutputs}>
      {knobs.map((k) => (
        <div key={k.key} className="grid grid-cols-[1fr_8.5rem] items-center gap-2">
          <code className="min-w-0 truncate text-[11.5px]" dir="ltr" title={`steps.${k.step}.outputs.${k.output}`}>
            <span className="text-muted-foreground">
              {k.job} › {k.step} ›{' '}
            </span>
            {k.output}
          </code>
          {k.options.length ? (
            <Select value={values[k.key] ?? k.value} onValueChange={(v) => setKnob(k.key, v)}>
              <SelectTrigger size="sm" className="w-full font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {k.options.map((o) => (
                  <SelectItem key={o} value={o} className="font-mono">
                    {o === '' ? '""' : o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <input
              className={INPUT}
              dir="ltr"
              value={values[k.key] ?? ''}
              onChange={(e) => setKnob(k.key, e.target.value)}
            />
          )}
        </div>
      ))}
    </Section>
  )
}

function ReviewsSection({ workflow }: { workflow: Workflow }) {
  const { book } = usePipelineBook()
  const reviews = useLab((s) => s.scenario.reviews)
  const toggleReview = useLab((s) => s.toggleReview)
  const envs = [...new Set(workflow.jobs.map((j) => j.environment?.name).filter((n): n is string => !!n))]
  return (
    <Section title={book.scenario.reviews} help={envs.length ? book.scenario.reviewsHelp : book.scenario.noEnvironments}>
      {envs.map((env) => (
        <label key={env} className="flex items-center justify-between gap-2 text-[13px]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-[var(--pipe-wait)]" aria-hidden />
            <code dir="ltr">{env}</code>
          </span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {book.card.protected}
            <Switch checked={reviews.includes(env)} onCheckedChange={() => toggleReview(env)} />
          </span>
        </label>
      ))}
    </Section>
  )
}

function FailuresSection({ workflow }: { workflow: Workflow }) {
  const { book } = usePipelineBook()
  const failures = useLab((s) => s.scenario.failures)
  const toggleFailure = useLab((s) => s.toggleFailure)
  const clearFailures = useLab((s) => s.clearFailures)
  const describe = (key: string) => {
    const m = /^(.+?)(?:\[(\d+)\])?\/(\d+)$/.exec(key)
    if (!m) return { job: key, step: '' }
    const job = workflow.jobs.find((j) => j.id === m[1])
    const lane = m[2] !== undefined ? job?.matrix?.lanes[Number(m[2])]?.label : undefined
    const step = job?.uses ? `Call ${job.uses}` : (job?.steps[Number(m[3])]?.name ?? m[3])
    return { job: `${job ? jobTitle(job) : m[1]}${lane ? ` (${lane})` : ''}`, step }
  }
  return (
    <Section title={book.scenario.failures} help={book.scenario.failuresHelp}>
      {failures.length ? (
        <>
          <ul className="space-y-1">
            {failures.map((key) => {
              const d = describe(key)
              return (
                <li
                  key={key}
                  className="flex items-center gap-2 rounded-lg bg-[color-mix(in_oklch,var(--pipe-bad)_10%,transparent)] px-2 py-1 text-xs"
                >
                  <span className="min-w-0 flex-1 truncate" dir="auto">
                    <b>{d.job}</b> · {d.step}
                  </span>
                  <button
                    type="button"
                    className="grid size-5 place-items-center rounded hover:bg-background"
                    aria-label={book.card.fixStep}
                    title={book.card.fixStep}
                    onClick={() => toggleFailure(key)}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
          <Button variant="outline" size="sm" onClick={clearFailures}>
            {book.scenario.clear}
          </Button>
        </>
      ) : null}
    </Section>
  )
}

export function ScenarioPanel() {
  const workflow = useWorkflow()
  if (!workflow) return null
  return (
    <div className="px-3">
      <EventSection workflow={workflow} />
      <FailuresSection workflow={workflow} />
      <KnobsSection />
      <ReviewsSection workflow={workflow} />
    </div>
  )
}

/* ───────────────────────── logs ───────────────────────── */

function History() {
  const { book, clock } = usePipelineBook()
  const timeline = useLab((s) => s.timeline)
  const count = useLab((s) => (s.started && s.timeline ? s.timeline.events.filter((e) => e.t <= s.t).length : 0))
  const name = (id: string) => timeline?.jobs[id]?.name ?? id
  const events = timeline?.events.slice(0, count) ?? []
  return (
    <div className="space-y-3 px-3 py-3">
      <p className="text-xs text-muted-foreground">{book.logs.pick}</p>
      {events.length ? (
        <div>
          <h3 className="mb-1.5 text-[13px] font-semibold">{book.logs.history}</h3>
          <ol className="space-y-1">
            {events.map((e, i) => (
              <li key={i} className="grid grid-cols-[2.6rem_1fr] gap-2 text-xs leading-snug">
                <span className="font-mono text-muted-foreground tabular-nums">{clock(e.t)}</span>
                <span>{book.history(e, name)}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}

const LOG_COLOR: Record<string, string> = {
  head: 'text-foreground font-semibold',
  muted: 'text-muted-foreground',
  out: 'text-foreground/85',
  ok: 'text-[var(--pipe-ok)]',
  error: 'text-[var(--pipe-bad)] font-medium',
}

function StepLog({ step, open, onToggle, follow }: { step: StepRun; open: boolean; onToggle: () => void; follow: boolean }) {
  const { book, clock } = usePipelineBook()
  const state = useLab((s) => (s.started ? stepStateAt(step, s.t) : 'pending'))
  const count = useLab((s) => (s.started ? logAt(step, s.t).length : 0))
  const elapsed = useLab((s) => (s.started && s.t >= step.start && s.t < step.end ? Math.floor(s.t - step.start) : 0))
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open && follow) end.current?.scrollIntoView({ block: 'nearest' })
  }, [open, follow, count])
  const done = state === 'success' || state === 'failure' || state === 'cancelled'

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-start text-[12.5px] hover:bg-muted/60"
      >
        <StatusIcon state={state} />
        <span className="min-w-0 flex-1 truncate" dir="auto">
          {step.name}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {state === 'running' ? clock(elapsed) : done ? clock(step.end - step.start) : ''}
        </span>
      </button>
      {open ? (
        <div className="bg-[var(--pipe-log-bg)] px-3 py-2 font-mono text-[11.5px] leading-[1.55]" dir="ltr">
          {state === 'pending' ? (
            <p className="text-muted-foreground">{book.logs.notYet}</p>
          ) : state === 'skipped' ? (
            <p className="text-muted-foreground" dir="auto">
              {step.reason === 'if' ? book.logs.skippedIf : book.logs.skippedAfter}
              {step.condition ? (
                <code className="mt-1 block" dir="ltr">
                  if: {step.condition.text}
                </code>
              ) : null}
            </p>
          ) : count === 0 ? (
            <p className="text-muted-foreground">{book.logs.nothing}</p>
          ) : (
            step.log.slice(0, count).map((line, i) => (
              <div key={i} className="grid grid-cols-[2rem_1fr] gap-2">
                <span className="text-end text-muted-foreground/60 select-none">{i + 1}</span>
                <span className={cn('break-words whitespace-pre-wrap', LOG_COLOR[line.kind])}>{line.text || ' '}</span>
              </div>
            ))
          )}
          {step.forgiven && done ? (
            <p className="mt-1 text-[var(--pipe-wait)]" dir="auto">
              {book.logs.forgiven}
            </p>
          ) : null}
          <div ref={end} />
        </div>
      ) : null}
    </div>
  )
}

function JobLog({ id }: { id: string }) {
  const { book, clock } = usePipelineBook()
  const job = useLab((s) => (s.parsed.ok ? s.parsed.workflow.jobs.find((j) => j.id === id) : undefined))
  const run = useLab((s) => s.timeline?.jobs[id])
  const state = useLab((s) => (s.started ? jobStateAt(s.timeline?.jobs[id], s.t) : 'ready'))
  const decided = useLab((s) => s.started && !!s.timeline?.jobs[id] && s.t >= s.timeline.jobs[id].ready)
  const wantedLane = useLab((s) => s.lanes[id] ?? 0)
  const picked = useLab((s) => s.step)
  const select = useLab((s) => s.select)
  const selectLane = useLab((s) => s.selectLane)
  const laneCount = job?.matrix?.lanes.length ?? 1
  const laneIndex = Math.min(wantedLane, Math.max(0, laneCount - 1))
  const lane = run?.lanes[laneIndex]
  const running = useLab((s) =>
    s.started && lane ? (lane.steps.find((st) => stepStateAt(st, s.t) === 'running')?.key ?? '') : '',
  )
  const laneState = useLab((s) => (s.started && lane ? laneStateAt(lane, s.t) : 'ready'))
  const [manual, setManual] = useState<Record<string, boolean>>({})
  useEffect(() => setManual({}), [id, laneIndex])

  if (!job) return null
  const failedKey = lane?.steps.find((st) => st.conclusion === 'failure' && laneState !== 'running')?.key
  const isOpen = (key: string) => manual[key] ?? (key === picked || key === running || (!running && key === failedKey))
  const finished = state === 'success' || state === 'failure'
  const outputs = run && finished ? Object.entries(run.outputs) : []

  return (
    <div className="pb-3">
      <div className="sticky top-0 z-10 flex items-center gap-1.5 border-b bg-background px-2 py-2">
        <Button variant="ghost" size="icon-sm" onClick={() => select(null)} aria-label={book.logs.history}>
          <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
        </Button>
        <StatusIcon state={state} />
        <h3 className="min-w-0 flex-1 truncate text-[13.5px] font-semibold" dir="auto">
          {lane?.name || jobTitle(job)}
        </h3>
        <span className="text-xs" style={{ color: STATE_COLOR[state] }}>
          {book.job[state]}
        </span>
      </div>

      <dl className="grid grid-cols-[6.5rem_1fr] gap-x-2 gap-y-1.5 px-3 py-2.5 text-xs">
        <dt className="text-muted-foreground">{book.logs.runner}</dt>
        <dd className="flex min-w-0 items-center gap-1 font-mono" dir="ltr">
          <Server className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{lane?.runner || job.runsOn || job.uses}</span>
        </dd>
        {job.needs.length ? (
          <>
            <dt className="text-muted-foreground">{book.logs.needs}</dt>
            <dd className="flex flex-wrap gap-1" dir="ltr">
              {job.needs.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="rounded bg-muted px-1.5 font-mono hover:bg-accent"
                  onClick={() => select(n)}
                >
                  {n}
                </button>
              ))}
            </dd>
          </>
        ) : null}
        {job.if !== undefined ? (
          <>
            <dt className="text-muted-foreground">{book.logs.condition}</dt>
            <dd className="min-w-0">
              <code className="block break-words" dir="ltr">
                {job.if}
              </code>
              {decided && run?.condition ? (
                <span
                  className="mt-0.5 inline-flex items-center gap-1 font-medium"
                  style={{ color: run.condition.value ? 'var(--pipe-ok)' : 'var(--pipe-bad)' }}
                >
                  → {run.condition.value ? book.logs.yes : book.logs.no}
                  {run.condition.error ? (
                    <span className="font-normal text-muted-foreground"> ({run.condition.error})</span>
                  ) : null}
                </span>
              ) : null}
            </dd>
          </>
        ) : null}
        {job.environment ? (
          <>
            <dt className="text-muted-foreground">{book.logs.environment}</dt>
            <dd className="font-mono" dir="ltr">
              {job.environment.name}
            </dd>
          </>
        ) : null}
        {outputs.length ? (
          <>
            <dt className="text-muted-foreground">{book.logs.outputs}</dt>
            <dd className="flex flex-wrap gap-1 font-mono" dir="ltr">
              {outputs.map(([k, v]) => (
                <span key={k} className="rounded bg-[color-mix(in_oklch,var(--pipe-ok)_14%,transparent)] px-1.5">
                  {k}={v || '""'}
                </span>
              ))}
            </dd>
          </>
        ) : null}
        {laneCount > 1 ? (
          <>
            <dt className="text-muted-foreground">{book.logs.copy}</dt>
            <dd className="flex flex-wrap gap-1" dir="ltr">
              {job.matrix!.lanes.map((l, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectLane(id, i)}
                  className={cn('pipe-lane', i === laneIndex && 'pipe-lane--active')}
                  aria-pressed={i === laneIndex}
                >
                  {l.label}
                </button>
              ))}
            </dd>
          </>
        ) : null}
      </dl>

      {lane?.steps.length ? (
        <div className="mx-3 overflow-hidden rounded-lg border">
          {lane.steps.map((step) => (
            <StepLog
              key={step.key}
              step={step}
              follow={step.key === running}
              open={isOpen(step.key)}
              onToggle={() => setManual((m) => ({ ...m, [step.key]: !isOpen(step.key) }))}
            />
          ))}
        </div>
      ) : (
        <p className="px-3 text-xs text-muted-foreground">
          {state === 'skipped'
            ? run?.reason === 'needs'
              ? book.card.skippedNeeds
              : book.card.skippedIf
            : state === 'cancelled'
              ? book.card.cancelled
              : run?.reason === 'rejected'
                ? book.card.rejected
                : book.logs.notYet}
        </p>
      )}
      {run && finished && run.lanes.length && Number.isFinite(run.end) ? (
        <p className="px-3 pt-2 text-end font-mono text-[11px] text-muted-foreground">
          {clock(run.end - Math.min(...run.lanes.map((l) => l.start)))}
        </p>
      ) : null}
    </div>
  )
}

export function LogsPanel() {
  const selected = useLab((s) => s.selected)
  return selected ? <JobLog id={selected} /> : <History />
}

/* ───────────────────────── the YAML ───────────────────────── */

/** A light colouring of one YAML line: keys, `${{ }}` expressions, quoted text and comments. */
function YamlLine({ text }: { text: string }) {
  let code = text
  let comment = ''
  const hash = text.search(/(^|\s)#/)
  if (hash >= 0 && !/["'][^"']*$/.test(text.slice(0, hash + 1))) {
    code = text.slice(0, hash)
    comment = text.slice(hash)
  }
  const key = /^(\s*(?:-\s+)?)([^\s:#'"][^:#]*?|"[^"]*"|'[^']*')(:)(?=\s|$)/.exec(code)
  const head = key ? key[1] : ''
  const rest = key ? code.slice(key[0].length) : code
  const parts = rest.split(/(\$\{\{[\s\S]*?\}\}|"[^"]*"|'[^']*')/)
  return (
    <>
      {head}
      {key ? (
        <>
          <span className="text-[var(--yaml-key)]">{key[2]}</span>
          <span className="text-muted-foreground">:</span>
        </>
      ) : null}
      {parts.map((part, i) =>
        part.startsWith('${{') ? (
          <span key={i} className="rounded-sm bg-[color-mix(in_oklch,var(--pipe-run)_18%,transparent)] text-[var(--yaml-expr)]">
            {part}
          </span>
        ) : part.startsWith('"') || part.startsWith("'") ? (
          <span key={i} className="text-[var(--yaml-string)]">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
      {comment ? <span className="text-muted-foreground italic">{comment}</span> : null}
    </>
  )
}

function YamlEditor({ initial, onDone }: { initial: string; onDone: () => void }) {
  const { book } = usePipelineBook()
  const applySource = useLab((s) => s.applySource)
  const [draft, setDraft] = useState(initial)
  const [problem, setProblem] = useState<ParseProblem | null>(null)
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-3">
      <textarea
        dir="ltr"
        spellCheck={false}
        autoFocus
        value={draft}
        placeholder={book.yaml.placeholder}
        aria-label={book.yaml.placeholder}
        onChange={(e) => {
          setDraft(e.target.value)
          setProblem(null)
        }}
        className="min-h-48 flex-1 resize-none rounded-lg border border-input bg-[var(--pipe-log-bg)] p-2.5 font-mono text-[12px] leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {problem ? (
        <p role="alert" className="rounded-lg bg-[color-mix(in_oklch,var(--pipe-bad)_12%,transparent)] px-2 py-1.5 text-xs">
          <b>{book.yaml.error}.</b> {book.problem(problem)}
        </p>
      ) : null}
      <p className="text-[11px] text-muted-foreground">{book.yaml.local}</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          {book.yaml.cancel}
        </Button>
        <Button
          size="sm"
          disabled={!draft.trim()}
          onClick={() => {
            const wrong = applySource(draft)
            if (wrong) setProblem(wrong)
            else onDone()
          }}
        >
          {book.yaml.apply}
        </Button>
      </div>
    </div>
  )
}

export function YamlPanel() {
  const { book } = usePipelineBook()
  const source = useLab((s) => s.source)
  const workflow = useWorkflow()
  const selected = useLab((s) => s.selected)
  const select = useLab((s) => s.select)
  // the lines of every step running or failed right now, as one string so this re-renders only when they change
  const marks = useLab((s): string => {
    if (!s.started || !s.timeline || !s.parsed.ok) return ''
    const out: string[] = []
    for (const job of s.parsed.workflow.jobs) {
      const lane = s.timeline.jobs[job.id]?.lanes[s.lanes[job.id] ?? 0]
      for (const step of lane?.steps ?? []) {
        const lines = job.steps[step.index]?.lines
        if (step.kind !== 'step' || !lines) continue
        const state = stepStateAt(step, s.t)
        if (state === 'running' || state === 'failure') out.push(`${lines.from}-${lines.to}:${state}`)
      }
    }
    return out.join(';')
  })
  const [editing, setEditing] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  const lineMarks = useMemo(() => {
    const map = new Map<number, string>()
    for (const mark of marks ? marks.split(';') : []) {
      const [range, state] = mark.split(':')
      const [from, to] = range.split('-').map(Number)
      for (let l = from; l <= to; l++) map.set(l, state)
    }
    return map
  }, [marks])

  const chosen = workflow?.jobs.find((j) => j.id === selected)?.lines
  const chosenFrom = chosen?.from
  useEffect(() => {
    if (chosenFrom === undefined) return
    scroller.current?.querySelector(`[data-line="${chosenFrom}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [chosenFrom])

  if (editing !== null) return <YamlEditor initial={editing} onDone={() => setEditing(null)} />

  const lines = source.split('\n')
  const jobAt = (line: number) => workflow?.jobs.find((j) => j.lines && line >= j.lines.from && line <= j.lines.to)?.id

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Button variant="outline" size="sm" onClick={() => setEditing(source)}>
          <Pencil className="size-3.5" aria-hidden />
          {book.yaml.edit}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setEditing('')}>
          <ClipboardPaste className="size-3.5" aria-hidden />
          {book.yaml.paste}
        </Button>
      </div>
      <div
        ref={scroller}
        className="min-h-0 flex-1 overflow-auto bg-[var(--pipe-log-bg)] py-2 font-mono text-[11.5px] leading-[1.6]"
        dir="ltr"
      >
        {lines.map((text, i) => {
          const n = i + 1
          const mark = lineMarks.get(n)
          const inJob = !!chosen && n >= chosen.from && n <= chosen.to
          const job = jobAt(n)
          return (
            <div
              key={i}
              data-line={n}
              onClick={job ? () => select(job) : undefined}
              className={cn(
                'grid grid-cols-[2.5rem_1fr] gap-2 border-s-2 border-transparent pe-3',
                job && 'cursor-pointer hover:bg-muted/50',
                inJob && 'bg-[color-mix(in_oklch,var(--primary)_7%,transparent)]',
                mark === 'running' && 'border-[var(--pipe-run)] bg-[color-mix(in_oklch,var(--pipe-run)_16%,transparent)]',
                mark === 'failure' && 'border-[var(--pipe-bad)] bg-[color-mix(in_oklch,var(--pipe-bad)_14%,transparent)]',
              )}
            >
              <span className="text-end text-muted-foreground/60 select-none">{n}</span>
              <span className="break-words whitespace-pre-wrap">
                <YamlLine text={text} />
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ───────────────────────── how it works ───────────────────────── */

export function GuidePanel() {
  const { book } = usePipelineBook()
  return (
    <div className="space-y-4 px-3 py-3">
      <p className="text-[13px] leading-relaxed">{book.guide.intro}</p>
      <ul className="space-y-2">
        {book.guide.pairs.map((pair) => (
          <li key={pair.workflow} className="rounded-xl border p-2.5">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]">
              <span className="font-semibold">{pair.circuit}</span>
              <span className="text-muted-foreground" aria-hidden>
                ↔
              </span>
              <code className="rounded bg-muted px-1.5 py-0.5 text-[12px]" dir="ltr">
                {pair.workflow}
              </code>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{pair.text}</p>
          </li>
        ))}
      </ul>
      <div>
        <h3 className="mb-1.5 text-[13px] font-semibold">{book.guide.tryTitle}</h3>
        <ol className="list-decimal space-y-1 ps-5 text-xs leading-relaxed">
          {book.guide.tries.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}
