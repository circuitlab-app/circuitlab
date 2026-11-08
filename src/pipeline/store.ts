import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { exampleById, EXAMPLES, type ExampleId } from './examples'
import { parseWorkflow } from './parse'
import {
  defaultReviews,
  findKnobs,
  simulate,
  type Actions,
  type Knob,
  type Scenario,
  type Timeline,
} from './simulate'
import { defaultEvent, eventFor, type EventChoice } from './trigger'
import type { ParseProblem, ParseResult } from './types'

/*
 * The Pipeline Lab's state: which workflow is on the board, how the run is
 * set up (event, failing steps, step outputs, protected environments), the
 * approvals given, and the clock.
 */

export type Tab = 'scenario' | 'logs' | 'yaml' | 'guide'

/** Simulated seconds per real second at 1×: a two-minute pipeline plays in half a minute. */
export const SIM_RATE = 4
export const SPEEDS = [0.5, 1, 2, 4] as const

type Prepared = { parsed: ParseResult; knobs: Knob[]; scenario: Scenario }

const NO_ACTIONS: Actions = { decisions: {}, cancelledAt: null }

const EMPTY_SCENARIO: Scenario = {
  event: { event: 'push', branch: 'main', tag: null, base: 'main', inputs: {} },
  failures: [],
  knobs: {},
  reviews: [],
}

function prepare(source: string, prefer?: string): Prepared {
  const parsed = parseWorkflow(source)
  if (!parsed.ok) return { parsed, knobs: [], scenario: EMPTY_SCENARIO }
  const workflow = parsed.workflow
  const knobs = findKnobs(workflow)
  const event =
    prefer && workflow.triggers.some((t) => t.event === prefer) ? eventFor(workflow, prefer) : defaultEvent(workflow)
  return {
    parsed,
    knobs,
    scenario: {
      event,
      failures: [],
      knobs: Object.fromEntries(knobs.map((k) => [k.key, k.value])),
      reviews: defaultReviews(workflow),
    },
  }
}

const timelineOf = (parsed: ParseResult, scenario: Scenario, actions: Actions): Timeline | null =>
  parsed.ok ? simulate(parsed.workflow, scenario, actions) : null

/** A run that has not started: the clock at zero, no approvals, nothing picked. */
const FRESH_RUN = {
  actions: NO_ACTIONS,
  t: 0,
  started: false,
  playing: false,
  selected: null,
  lanes: {},
  step: null,
}

type LabState = {
  exampleId: ExampleId | 'custom'
  /** the reader's own workflow, kept between visits */
  custom: string
  source: string
  parsed: ParseResult
  knobs: Knob[]
  scenario: Scenario
  actions: Actions
  timeline: Timeline | null
  /** the simulated clock, in seconds since the event */
  t: number
  started: boolean
  playing: boolean
  speed: number
  /** the job whose details and log are open */
  selected: string | null
  /** the matrix copy on show, for each matrix job */
  lanes: Record<string, number>
  /** the step open in the log */
  step: string | null
  tab: Tab

  loadExample: (id: ExampleId) => void
  /** Puts the reader's own YAML on the board; returns what is wrong with it, or null. */
  applySource: (source: string) => ParseProblem | null
  setEvent: (event: EventChoice) => void
  setKnob: (key: string, value: string) => void
  toggleFailure: (key: string) => void
  clearFailures: () => void
  toggleReview: (env: string) => void
  approve: (job: string, approve: boolean) => void
  togglePlay: () => void
  restart: () => void
  reset: () => void
  cancel: () => void
  seek: (t: number) => void
  tick: (realSeconds: number) => void
  setSpeed: (speed: number) => void
  select: (job: string | null, step?: string | null) => void
  selectLane: (job: string, lane: number) => void
  setTab: (tab: Tab) => void
}

function load(source: string, exampleId: ExampleId | 'custom', prefer?: string) {
  const prepared = prepare(source, prefer)
  return {
    exampleId,
    source,
    ...prepared,
    ...FRESH_RUN,
    timeline: timelineOf(prepared.parsed, prepared.scenario, NO_ACTIONS),
  }
}

const first = EXAMPLES[0]

export const useLab = create<LabState>()(
  persist(
    (set, get) => {
      /** Changes how the run is set up; the clock keeps going so the reader sees the effect at once. */
      const rescenario = (scenario: Scenario) =>
        set((s) => ({ scenario, timeline: timelineOf(s.parsed, scenario, s.actions) }))

      return {
        ...load(first.source, first.id, first.prefer),
        custom: '',
        speed: 1,
        tab: 'scenario',

        loadExample: (id) => {
          const example = exampleById(id) ?? first
          set(load(example.source, example.id, example.prefer))
        },

        applySource: (source) => {
          const parsed = parseWorkflow(source)
          if (!parsed.ok) return parsed.problem
          set({ ...load(source, 'custom'), custom: source })
          return null
        },

        setEvent: (event) =>
          set((s) => {
            const scenario = { ...s.scenario, event }
            return {
              scenario,
              ...FRESH_RUN,
              selected: s.selected,
              timeline: timelineOf(s.parsed, scenario, NO_ACTIONS),
            }
          }),

        setKnob: (key, value) => {
          const { scenario } = get()
          rescenario({ ...scenario, knobs: { ...scenario.knobs, [key]: value } })
        },

        toggleFailure: (key) => {
          const { scenario } = get()
          const failures = scenario.failures.includes(key)
            ? scenario.failures.filter((f) => f !== key)
            : [...scenario.failures, key]
          rescenario({ ...scenario, failures })
        },

        clearFailures: () => rescenario({ ...get().scenario, failures: [] }),

        toggleReview: (env) => {
          const { scenario } = get()
          const reviews = scenario.reviews.includes(env)
            ? scenario.reviews.filter((r) => r !== env)
            : [...scenario.reviews, env]
          rescenario({ ...scenario, reviews })
        },

        approve: (job, approve) =>
          set((s) => {
            const actions = { ...s.actions, decisions: { ...s.actions.decisions, [job]: { approve, at: s.t } } }
            return { actions, playing: true, timeline: timelineOf(s.parsed, s.scenario, actions) }
          }),

        togglePlay: () => {
          const s = get()
          const over = !!s.timeline && Number.isFinite(s.timeline.end) && s.t >= s.timeline.end
          if (!s.started || over) s.restart()
          else set({ playing: !s.playing })
        },

        restart: () =>
          set((s) => ({
            actions: NO_ACTIONS,
            t: 0,
            started: true,
            // an event the workflow ignores has nothing to play
            playing: !!s.timeline?.triggered,
            timeline: timelineOf(s.parsed, s.scenario, NO_ACTIONS),
          })),

        reset: () =>
          set((s) => ({
            ...FRESH_RUN,
            selected: s.selected,
            lanes: s.lanes,
            timeline: timelineOf(s.parsed, s.scenario, NO_ACTIONS),
          })),

        cancel: () =>
          set((s) => {
            if (!s.started || !s.timeline || s.t >= s.timeline.end || s.actions.cancelledAt !== null) return {}
            const actions = { ...s.actions, cancelledAt: s.t }
            return { actions, playing: true, timeline: timelineOf(s.parsed, s.scenario, actions) }
          }),

        seek: (t) => set({ t: Math.max(0, t), started: true, playing: false }),

        tick: (realSeconds) =>
          set((s) => {
            if (!s.playing || !s.timeline) return {}
            const next = s.t + Math.min(realSeconds, 0.25) * s.speed * SIM_RATE
            const end = s.timeline.end
            if (Number.isFinite(end) && next >= end) return { t: end, playing: false }
            return { t: next }
          }),

        setSpeed: (speed) => set({ speed }),

        select: (job, step = null) => set((s) => ({ selected: job, step, tab: job ? 'logs' : s.tab })),

        selectLane: (job, lane) => set((s) => ({ lanes: { ...s.lanes, [job]: lane } })),

        setTab: (tab) => set({ tab }),
      }
    },
    {
      name: 'circuit-lab:pipelines',
      version: 1,
      // the workflow on the board, the reader's own YAML and the speed; every visit starts a fresh run
      partialize: (s) => ({ exampleId: s.exampleId, custom: s.custom, speed: s.speed }),
      merge: (saved, current) => {
        const kept = (saved ?? {}) as { exampleId?: unknown; custom?: unknown; speed?: unknown }
        const custom = typeof kept.custom === 'string' ? kept.custom : ''
        const speed = SPEEDS.some((s) => s === kept.speed) ? (kept.speed as number) : current.speed
        if (kept.exampleId === 'custom' && custom && parseWorkflow(custom).ok) {
          return { ...current, ...load(custom, 'custom'), custom, speed }
        }
        const example = typeof kept.exampleId === 'string' ? exampleById(kept.exampleId) : undefined
        if (example && example.id !== current.exampleId) {
          return { ...current, ...load(example.source, example.id, example.prefer), custom, speed }
        }
        return { ...current, custom, speed }
      },
    },
  ),
)

/** The clock the board shows: before the event fires, nothing has happened yet. */
export const shownTime = (s: Pick<LabState, 'started' | 't'>) => (s.started ? s.t : -1)
