import { isMap, isSeq, LineCounter, parseDocument, type Node as YamlNode } from 'yaml'
import { toText } from './expr'
import type {
  DispatchInput,
  Job,
  Lines,
  Matrix,
  MatrixLane,
  ParseResult,
  RefFilter,
  Step,
  Trigger,
  Value,
  Workflow,
} from './types'

/*
 * Reads workflow YAML (what lives in .github/workflows/*.yml) into a
 * `Workflow`, keeping the line range of the `on:` block, every job and every
 * step so the page can point at the YAML that is running.
 */

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

const text = (v: unknown): string | undefined =>
  v === undefined || v === null ? undefined : typeof v === 'object' ? JSON.stringify(v) : String(v)

const list = (v: unknown): string[] | undefined =>
  v === undefined || v === null ? undefined : Array.isArray(v) ? v.map((x) => String(x)) : [String(v)]

const textMap = (v: unknown): Record<string, string> =>
  isObj(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, text(x) ?? ''])) : {}

const flag = (v: unknown) => v === true || v === 'true'

const number = (v: unknown) =>
  typeof v === 'number' ? v : typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : undefined

const toValue = (v: unknown): Value => {
  if (v === undefined || v === null) return null
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v
  if (Array.isArray(v)) return v.map(toValue)
  if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toValue(x)]))
  return String(v)
}

/* ───────────────────────── on: ───────────────────────── */

function filterOf(v: unknown): RefFilter {
  if (!isObj(v)) return {}
  const filter: RefFilter = {
    branches: list(v.branches),
    branchesIgnore: list(v['branches-ignore']),
    tags: list(v.tags),
    tagsIgnore: list(v['tags-ignore']),
    paths: list(v.paths),
    pathsIgnore: list(v['paths-ignore']),
    types: list(v.types),
  }
  return Object.fromEntries(Object.entries(filter).filter(([, x]) => x !== undefined)) as RefFilter
}

const INPUT_TYPES = ['string', 'boolean', 'choice', 'number', 'environment'] as const

function inputsOf(v: unknown): DispatchInput[] {
  if (!isObj(v)) return []
  return Object.entries(v).map(([name, spec]) => {
    const s = isObj(spec) ? spec : {}
    return {
      name,
      type: INPUT_TYPES.find((t) => t === s.type) ?? 'string',
      description: text(s.description),
      options: list(s.options),
      default: text(s.default),
      required: flag(s.required),
    }
  })
}

function triggersOf(on: unknown): Trigger[] {
  if (typeof on === 'string') return [{ event: on, filter: {} }]
  if (Array.isArray(on)) {
    return on.filter((e): e is string => typeof e === 'string').map((event) => ({ event, filter: {} }))
  }
  if (!isObj(on)) return []
  return Object.entries(on).map(([event, spec]): Trigger => {
    const trigger: Trigger = { event, filter: filterOf(spec) }
    if (event === 'schedule' && Array.isArray(spec)) {
      trigger.crons = spec.map((s) => (isObj(s) ? text(s.cron) : undefined)).filter((c): c is string => !!c)
    }
    if (event === 'workflow_dispatch') trigger.inputs = isObj(spec) ? inputsOf(spec.inputs) : []
    return trigger
  })
}

/* ───────────────────────── jobs ───────────────────────── */

function runsOnOf(v: unknown): string {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.map(String).join(', ')
  if (isObj(v)) return list(v.labels)?.join(', ') ?? text(v.group) ?? ''
  return ''
}

function permissionsOf(v: unknown): string | undefined {
  if (typeof v === 'string') return v
  if (isObj(v)) {
    return Object.entries(v)
      .map(([k, x]) => `${k}: ${String(x)}`)
      .join(', ')
  }
  return undefined
}

const same = (a: Value, b: Value) => JSON.stringify(a) === JSON.stringify(b)

/** Expands `strategy.matrix` into its copies, with include/exclude as GitHub applies them. */
function matrixOf(strategy: unknown): Matrix | undefined {
  if (!isObj(strategy) || strategy.matrix === undefined) return undefined
  const failFast = strategy['fail-fast'] !== false && strategy['fail-fast'] !== 'false'
  const maxParallel = number(strategy['max-parallel'])
  const m = strategy.matrix
  if (!isObj(m)) {
    // `matrix: ${{ fromJSON(needs.plan.outputs.matrix) }}` is only known at run time
    return { lanes: [{ values: {}, label: '' }], failFast, maxParallel, dynamic: text(m) ?? '' }
  }
  const keys = Object.keys(m).filter((k) => k !== 'include' && k !== 'exclude')
  let combos: Record<string, Value>[] = keys.length ? [{}] : []
  for (const key of keys) {
    const raw = m[key]
    const values = Array.isArray(raw) ? raw.map(toValue) : [toValue(raw)]
    combos = combos.flatMap((combo) => values.map((value) => ({ ...combo, [key]: value })))
  }
  const exclude = Array.isArray(m.exclude) ? m.exclude.filter(isObj) : []
  combos = combos.filter(
    (combo) => !exclude.some((ex) => Object.entries(ex).every(([k, v]) => same(combo[k] ?? null, toValue(v)))),
  )
  const include = Array.isArray(m.include) ? m.include.filter(isObj) : []
  for (const inc of include) {
    const values = Object.fromEntries(Object.entries(inc).map(([k, v]) => [k, toValue(v)]))
    // an include joins every copy whose original values it does not change …
    const fits = combos.filter((combo) => keys.every((k) => !(k in values) || same(combo[k] ?? null, values[k])))
    const extra = Object.fromEntries(Object.entries(values).filter(([k]) => !keys.includes(k)))
    if (keys.length && fits.length) fits.forEach((combo) => Object.assign(combo, extra))
    // … or becomes a copy of its own
    else combos.push({ ...values })
  }
  if (!combos.length) combos = [{}]
  const lanes: MatrixLane[] = combos.map((values) => ({
    values,
    label: Object.values(values).map(toText).join(', '),
  }))
  return { lanes, failFast, maxParallel }
}

/** The first line of a script that does something (not blank, not a comment). */
export function firstLine(script: string) {
  return script.split('\n').find((line) => line.trim() && !line.trim().startsWith('#'))?.trim() ?? script.trim()
}

function stepOf(raw: unknown, index: number, lines?: Lines): Step {
  const s = isObj(raw) ? raw : {}
  const uses = text(s.uses)
  const run = text(s.run)
  const name = text(s.name) ?? (run ? `Run ${firstLine(run)}` : uses ? `Run ${uses}` : `Step ${index + 1}`)
  return {
    index,
    id: text(s.id),
    name,
    uses,
    run,
    with: textMap(s.with),
    env: textMap(s.env),
    if: s.if === undefined ? undefined : text(s.if),
    continueOnError: flag(s['continue-on-error']),
    lines,
  }
}

function environmentOf(v: unknown): Job['environment'] {
  if (typeof v === 'string') return { name: v }
  if (isObj(v) && v.name !== undefined) return { name: String(v.name), url: text(v.url) }
  return undefined
}

/* ───────────────────────── line ranges ───────────────────────── */

type Ranged = { range?: [number, number, number] | null } | null | undefined

function linesOf(counter: LineCounter, from: Ranged, to?: Ranged): Lines | undefined {
  const start = from?.range?.[0]
  const end = (to ?? from)?.range?.[1]
  if (start === undefined || end === undefined) return undefined
  const first = counter.linePos(start).line
  // a block value ends just after its last line break
  return { from: first, to: Math.max(first, counter.linePos(Math.max(start, end - 1)).line) }
}

const pairsOf = (node: unknown) => (isMap(node) ? node.items : [])

const keyOf = (key: unknown) => (key as { value?: unknown } | null)?.value

/* ───────────────────────── the workflow ───────────────────────── */

/** Jobs in an order where every job comes after all the jobs it needs (or null when they loop). */
export function jobOrder(jobs: Pick<Job, 'id' | 'needs'>[]): string[] | null {
  const left = new Map(jobs.map((j) => [j.id, new Set(j.needs)]))
  const order: string[] = []
  while (left.size) {
    const ready = [...left].filter(([, needs]) => [...needs].every((n) => !left.has(n))).map(([id]) => id)
    if (!ready.length) return null
    for (const id of ready) {
      order.push(id)
      left.delete(id)
    }
  }
  return order
}

export function parseWorkflow(source: string): ParseResult {
  const counter = new LineCounter()
  const doc = parseDocument(source, { lineCounter: counter, prettyErrors: true })
  if (doc.errors.length) {
    const error = doc.errors[0]
    return {
      ok: false,
      problem: { code: 'yaml', message: error.message.split('\n')[0], line: error.linePos?.[0]?.line },
    }
  }
  const root = doc.toJS({ maxAliasCount: 100 }) as unknown
  if (!isObj(root)) return { ok: false, problem: { code: 'notMap' } }

  // YAML 1.1 readers turn a bare `on` into true; accept both
  const triggers = triggersOf(root.on ?? root.true)
  if (!triggers.length) return { ok: false, problem: { code: 'noOn' } }
  if (!isObj(root.jobs) || !Object.keys(root.jobs).length) return { ok: false, problem: { code: 'noJobs' } }

  const rootPairs = pairsOf(doc.contents)
  const onPair = rootPairs.find((p) => keyOf(p.key) === 'on' || keyOf(p.key) === true)
  const jobPairs = pairsOf(rootPairs.find((p) => keyOf(p.key) === 'jobs')?.value)

  const jobs: Job[] = Object.entries(root.jobs).map(([id, raw]) => {
    const j = isObj(raw) ? raw : {}
    const pair = jobPairs.find((p) => String(keyOf(p.key)) === id)
    const stepsNode = pairsOf(pair?.value).find((p) => keyOf(p.key) === 'steps')?.value
    const stepNodes = isSeq(stepsNode) ? (stepsNode.items as YamlNode[]) : []
    const steps = (Array.isArray(j.steps) ? j.steps : []).map((s, i) =>
      stepOf(s, i, linesOf(counter, stepNodes[i] as Ranged)),
    )
    return {
      id,
      name: text(j.name) ?? id,
      needs: list(j.needs) ?? [],
      if: j.if === undefined ? undefined : text(j.if),
      runsOn: runsOnOf(j['runs-on']),
      matrix: matrixOf(j.strategy),
      environment: environmentOf(j.environment),
      outputs: textMap(j.outputs),
      steps,
      env: textMap(j.env),
      permissions: permissionsOf(j.permissions),
      uses: text(j.uses),
      continueOnError: flag(j['continue-on-error']),
      timeoutMinutes: number(j['timeout-minutes']),
      lines: linesOf(counter, pair?.key as Ranged, pair?.value as Ranged),
    }
  })

  for (const job of jobs) {
    const need = job.needs.find((n) => !jobs.some((j) => j.id === n))
    if (need) return { ok: false, problem: { code: 'unknownNeed', job: job.id, need } }
  }
  if (!jobOrder(jobs)) {
    return { ok: false, problem: { code: 'cycle', jobs: jobs.filter((j) => j.needs.length).map((j) => j.id) } }
  }

  const workflow: Workflow = {
    name: text(root.name) ?? 'Workflow',
    triggers,
    jobs,
    env: textMap(root.env),
    concurrency: isObj(root.concurrency) ? text(root.concurrency.group) : text(root.concurrency),
    onLines: linesOf(counter, onPair?.key as Ranged, onPair?.value as Ranged),
  }
  return { ok: true, workflow }
}
