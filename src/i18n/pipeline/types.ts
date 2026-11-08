import type { ExampleId } from '@/pipeline/examples'
import type { JobState, RunConclusion, RunEvent, RunState } from '@/pipeline/simulate'
import type { Tab } from '@/pipeline/store'
import type { NotTriggered } from '@/pipeline/trigger'
import type { ParseProblem } from '@/pipeline/types'

/** Every word of the Pipeline Lab page, in one language. Workflow names, steps and logs stay as written. */
export type PipelineBook = {
  title: string
  subtitle: string
  back: string
  workflow: string
  /** "a, b and c" in this language */
  list: (items: string[]) => string
  examples: Record<ExampleId, { name: string; description: string }>
  yours: string
  controls: {
    run: string
    pause: string
    resume: string
    again: string
    restart: string
    cancel: string
    speed: string
    clock: string
  }
  run: Record<RunState | 'ready', string>
  job: Record<JobState | 'ready', string>
  /** names of the events in `on:`; others are shown as written */
  events: Record<string, string>
  trigger: { title: string; fire: string; fired: string; off: string; listens: string }
  why: (reason: NotTriggered) => string
  card: {
    copies: (n: number) => string
    waitingFor: (env: string) => string
    approve: string
    reject: string
    skippedIf: string
    skippedNeeds: string
    cancelled: string
    rejected: string
    failFast: string
    breakStep: string
    fixStep: string
    protected: string
    added: string
    waitsFor: (jobs: string) => string
  }
  result: { title: string; hint: string }
  tabs: Record<Tab, string>
  scenario: {
    event: string
    pushTo: string
    branchPush: string
    tagPush: string
    branch: string
    tag: string
    from: string
    into: string
    inputs: string
    crons: string
    starts: string
    paths: string
    outputs: string
    outputsHelp: string
    reviews: string
    reviewsHelp: string
    failures: string
    failuresHelp: string
    clear: string
    noEnvironments: string
    noOutputs: string
  }
  logs: {
    pick: string
    history: string
    runner: string
    needs: string
    condition: string
    yes: string
    no: string
    outputs: string
    environment: string
    copy: string
    notYet: string
    skippedIf: string
    skippedAfter: string
    forgiven: string
    nothing: string
  }
  yaml: {
    edit: string
    apply: string
    cancel: string
    paste: string
    placeholder: string
    local: string
    error: string
  }
  problem: (p: ParseProblem) => string
  narrate: {
    ready: (event: string) => string
    off: string
    running: (job: string, step: string) => string
    together: (jobs: string) => string
    queued: (job: string) => string
    waiting: (job: string, env: string) => string
    done: Record<RunConclusion, (time: string) => string>
  }
  /** one line of "what happened"; `name` gives a job's name from its id */
  history: (event: RunEvent, name: (job: string) => string) => string
  timeline: { title: string; hint: string }
  guide: {
    intro: string
    pairs: { circuit: string; workflow: string; text: string }[]
    tryTitle: string
    tries: string[]
  }
}
