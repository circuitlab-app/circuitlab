/*
 * A GitHub Actions workflow, as the Pipeline Lab understands it.
 *
 * `parse.ts` turns workflow YAML into a `Workflow`; `simulate.ts` plays it out
 * on a pretend clock. Nothing here runs real commands: steps only take time,
 * pass, fail or get skipped, the way they would on GitHub.
 */

export type Scalar = string | number | boolean | null

/** Any value an expression can see or make: what `${{ }}` works with. */
export type Value = Scalar | Value[] | { [key: string]: Value }

/** Lines of the YAML source, 1-based and inclusive. */
export type Lines = { from: number; to: number }

/** The filters under an event in `on:` (branches, tags, paths, types). */
export type RefFilter = {
  branches?: string[]
  branchesIgnore?: string[]
  tags?: string[]
  tagsIgnore?: string[]
  paths?: string[]
  pathsIgnore?: string[]
  types?: string[]
}

export type DispatchInput = {
  name: string
  type: 'string' | 'boolean' | 'choice' | 'number' | 'environment'
  description?: string
  options?: string[]
  default?: string
  required?: boolean
}

export type Trigger = {
  event: string
  filter: RefFilter
  /** `schedule:` only */
  crons?: string[]
  /** `workflow_dispatch:` only */
  inputs?: DispatchInput[]
}

export type Step = {
  index: number
  id?: string
  /** what GitHub shows: `name:`, else "Run <first line>", else the action */
  name: string
  uses?: string
  run?: string
  with: Record<string, string>
  env: Record<string, string>
  if?: string
  continueOnError: boolean
  lines?: Lines
}

/** One copy of a matrix job: its values and the label GitHub shows, e.g. "20, ubuntu-latest". */
export type MatrixLane = { values: Record<string, Value>; label: string }

export type Matrix = {
  lanes: MatrixLane[]
  failFast: boolean
  maxParallel?: number
  /** a matrix made at run time (`${{ fromJSON(...) }}`): simulated as a single copy */
  dynamic?: string
}

export type Job = {
  id: string
  /** `name:`, may hold `${{ matrix.x }}` */
  name: string
  needs: string[]
  if?: string
  runsOn: string
  matrix?: Matrix
  environment?: { name: string; url?: string }
  outputs: Record<string, string>
  steps: Step[]
  env: Record<string, string>
  permissions?: string
  /** a job that calls a reusable workflow (`uses:` instead of `steps:`) */
  uses?: string
  continueOnError: boolean
  timeoutMinutes?: number
  lines?: Lines
}

export type Workflow = {
  name: string
  triggers: Trigger[]
  jobs: Job[]
  env: Record<string, string>
  concurrency?: string
  /** lines of the `on:` block */
  onLines?: Lines
}

/** Why a workflow could not be read; the page words each code in the reader's language. */
export type ParseProblem =
  | { code: 'yaml'; message: string; line?: number }
  | { code: 'notMap' }
  | { code: 'noOn' }
  | { code: 'noJobs' }
  | { code: 'unknownNeed'; job: string; need: string }
  | { code: 'cycle'; jobs: string[] }

export type ParseResult = { ok: true; workflow: Workflow } | { ok: false; problem: ParseProblem }
