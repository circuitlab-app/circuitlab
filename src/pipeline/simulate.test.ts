import { describe, expect, it } from 'vitest'
import deployYml from '../../.github/workflows/deploy.yml?raw'
import { EXAMPLES, exampleById } from './examples'
import { decide, evaluate, fill, type ExprContext } from './expr'
import { parseWorkflow } from './parse'
import { defaultReviews, findKnobs, jobStateAt, runStateAt, simulate, type Actions, type Scenario } from './simulate'
import { defaultEvent, eventFor, matchesPatterns } from './trigger'
import type { Workflow } from './types'

const ok = { success: true, failure: false, cancelled: false }
const ctx = (data: ExprContext['data'] = {}, status = ok): ExprContext => ({ data, status })

function load(source: string): Workflow {
  const parsed = parseWorkflow(source)
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.problem))
  return parsed.workflow
}

const noActions: Actions = { decisions: {}, cancelledAt: null }

function scenario(workflow: Workflow, extra: Partial<Scenario> = {}): Scenario {
  const knobs = Object.fromEntries(findKnobs(workflow).map((k) => [k.key, k.value]))
  return { event: defaultEvent(workflow), failures: [], knobs, reviews: [], ...extra }
}

describe('expressions', () => {
  it('compares text without caring about case, and mixed types as numbers', () => {
    expect(evaluate("'Main' == 'main'", ctx())).toBe(true)
    expect(evaluate("'1' == 1", ctx())).toBe(true)
    expect(evaluate('null == 0', ctx())).toBe(true)
    expect(evaluate("'abc' != 'ABC'", ctx())).toBe(false)
  })

  it('reads contexts, functions and && / || values', () => {
    const c = ctx({ github: { ref: 'refs/heads/main', event_name: 'push' }, matrix: { node: 22 } })
    expect(evaluate("github.ref == 'refs/heads/main' && github.event_name == 'push'", c)).toBe(true)
    expect(evaluate("startsWith(github.ref, 'refs/tags/')", c)).toBe(false)
    expect(evaluate("contains(fromJSON('[20, 22]'), matrix.node)", c)).toBe(true)
    expect(evaluate("matrix.node >= 22 && 'new' || 'old'", c)).toBe('new')
    expect(evaluate("format('{0}-{1}', 'v', 3)", c)).toBe('v-3')
    expect(fill('Node ${{ matrix.node }} on ${{ github.event_name }}', c)).toBe('Node 22 on push')
  })

  it('reads an if without a status check as success() && (…)', () => {
    const failed = { success: false, failure: true, cancelled: false }
    expect(decide('true', ctx({}, failed)).value).toBe(false)
    expect(decide('always()', ctx({}, failed)).value).toBe(true)
    expect(decide('${{ failure() }}', ctx({}, failed)).value).toBe(true)
    expect(decide(undefined, ctx()).value).toBe(true)
    expect(decide('this is ((not valid', ctx()).error).toBeTruthy()
  })
})

describe('triggers', () => {
  it('matches branch patterns the way GitHub does', () => {
    expect(matchesPatterns(['main'], 'main')).toBe(true)
    expect(matchesPatterns(['release/*'], 'release/1.4')).toBe(true)
    expect(matchesPatterns(['release/*'], 'release/1/4')).toBe(false)
    expect(matchesPatterns(['release/**'], 'release/1/4')).toBe(true)
    expect(matchesPatterns(['feature/**', '!feature/wip'], 'feature/wip')).toBe(false)
  })
})

describe("this project's own workflow (.github/workflows/deploy.yml)", () => {
  const workflow = load(deployYml)

  it('reads its jobs, needs, triggers and lines', () => {
    expect(workflow.jobs.map((j) => j.id)).toEqual(['check', 'release', 'publish'])
    expect(workflow.jobs.find((j) => j.id === 'publish')?.needs).toEqual(['check'])
    expect(workflow.triggers.map((t) => t.event)).toEqual(['push', 'workflow_dispatch'])
    const check = workflow.jobs[0]
    expect(check.steps.length).toBe(9)
    expect(check.steps[4].name).toBe('Test the circuit solver and every example')
    expect(check.lines!.from).toBeLessThan(check.steps[0].lines!.from)
  })

  it('offers the "new version?" output as a yes/no switch', () => {
    const knob = findKnobs(workflow).find((k) => k.output === 'new')
    expect(knob).toMatchObject({ job: 'check', step: 'version', value: 'true' })
    expect(knob?.options.sort()).toEqual(['false', 'true'])
  })

  it('a push to main with a new version checks, then releases and publishes side by side', () => {
    const run = simulate(workflow, scenario(workflow), noActions)
    expect(run.conclusion).toBe('success')
    const { check, release, publish } = run.jobs
    expect(release.start).toBe(check.end)
    expect(publish.start).toBe(check.end)
    expect(release.lanes[0].steps.every((s) => s.conclusion === 'success')).toBe(true)
    expect(runStateAt(run, run.end)).toBe('success')
    expect(jobStateAt(check, 0)).toBe('queued')
  })

  it('an old version is only checked: release and publish are skipped by their if', () => {
    const s = scenario(workflow)
    const run = simulate(workflow, { ...s, knobs: { ...s.knobs, 'check.version.new': 'false' } }, noActions)
    expect(run.jobs.release).toMatchObject({ conclusion: 'skipped', reason: 'if' })
    expect(run.jobs.publish).toMatchObject({ conclusion: 'skipped', reason: 'if' })
    const prepare = run.jobs.check.lanes[0].steps.find((s) => s.name === 'Prepare the site')
    expect(prepare?.conclusion).toBe('skipped')
    expect(run.conclusion).toBe('success')
  })

  it('"Run workflow" by hand republishes even an old version', () => {
    const s = scenario(workflow, { event: eventFor(workflow, 'workflow_dispatch') })
    const run = simulate(workflow, { ...s, knobs: { ...s.knobs, 'check.version.new': 'false' } }, noActions)
    expect(run.jobs.release.conclusion).toBe('skipped')
    expect(run.jobs.publish.conclusion).toBe('success')
  })

  it('a push to another branch does not start it', () => {
    const s = scenario(workflow)
    const run = simulate(workflow, { ...s, event: { ...s.event, branch: 'feature/login' } }, noActions)
    expect(run.triggered).toBe(false)
    expect(run.notTriggered).toMatchObject({ code: 'branch', name: 'feature/login', patterns: ['main'] })
  })

  it('a failing test skips the rest of the job and every job that needs it', () => {
    const run = simulate(workflow, scenario(workflow, { failures: ['check/4'] }), noActions)
    const steps = run.jobs.check.lanes[0].steps
    expect(steps.find((s) => s.index === 4)?.conclusion).toBe('failure')
    expect(steps.filter((s) => s.index > 4).every((s) => s.conclusion === 'skipped')).toBe(true)
    expect(steps.at(-1)?.name).toBe('Complete job')
    expect(run.jobs.release).toMatchObject({ conclusion: 'skipped', reason: 'needs' })
    expect(run.conclusion).toBe('failure')
    expect(run.events.some((e) => e.kind === 'step-fail')).toBe(true)
  })

  it('a protected environment waits for a person, then runs from the moment it is approved', () => {
    const s = scenario(workflow, { reviews: ['github-pages'] })
    const waiting = simulate(workflow, s, noActions)
    expect(waiting.end).toBe(Number.POSITIVE_INFINITY)
    expect(jobStateAt(waiting.jobs.publish, waiting.jobs.check.end + 30)).toBe('waiting')
    expect(runStateAt(waiting, waiting.jobs.release.end + 1)).toBe('waiting')

    const at = waiting.jobs.check.end + 40
    const approved = simulate(workflow, s, { decisions: { publish: { approve: true, at } }, cancelledAt: null })
    expect(approved.jobs.publish.start).toBe(at)
    expect(approved.conclusion).toBe('success')

    const rejected = simulate(workflow, s, { decisions: { publish: { approve: false, at } }, cancelledAt: null })
    expect(rejected.jobs.publish).toMatchObject({ conclusion: 'failure', reason: 'rejected' })
  })

  it('cancelling stops the running step and the jobs not started yet', () => {
    const run = simulate(workflow, scenario(workflow), { decisions: {}, cancelledAt: 20 })
    expect(run.jobs.check.conclusion).toBe('cancelled')
    expect(run.jobs.release.conclusion).toBe('cancelled')
    expect(run.conclusion).toBe('cancelled')
    expect(run.jobs.check.lanes[0].steps.some((s) => s.conclusion === 'cancelled' && s.end === 20)).toBe(true)
  })
})

describe('matrix jobs', () => {
  const workflow = load(`
name: CI
on: [push]
jobs:
  test:
    runs-on: \${{ matrix.os }}
    strategy:
      matrix:
        node: [20, 22, 24]
        os: [ubuntu-latest]
        include:
          - node: 24
            experimental: true
          - node: 25
            os: windows-latest
    steps:
      - run: npm test
      - run: sleep 60
  done:
    needs: test
    if: always()
    runs-on: ubuntu-latest
    steps:
      - run: echo "\${{ needs.test.result }}"
`)

  it('expands include rows into the copies and adds new ones', () => {
    const lanes = workflow.jobs[0].matrix!.lanes
    expect(lanes.map((l) => l.label)).toEqual([
      '20, ubuntu-latest',
      '22, ubuntu-latest',
      '24, ubuntu-latest, true',
      '25, windows-latest',
    ])
  })

  it('runs every copy side by side on its own machine', () => {
    const run = simulate(workflow, scenario(workflow), noActions)
    const lanes = run.jobs.test.lanes
    expect(lanes.length).toBe(4)
    expect(lanes[3].os).toBe('windows')
    expect(Math.max(...lanes.map((l) => l.start))).toBeLessThan(Math.min(...lanes.map((l) => l.end)))
  })

  it('one failed copy cancels its sisters (fail-fast), and always() still runs after it', () => {
    const run = simulate(workflow, scenario(workflow, { failures: ['test[1]/0'] }), noActions)
    const lanes = run.jobs.test.lanes
    expect(lanes[1].conclusion).toBe('failure')
    expect(lanes.filter((l) => l.index !== 1).every((l) => l.conclusion === 'cancelled' && l.failFast)).toBe(true)
    expect(run.jobs.test.conclusion).toBe('failure')
    expect(run.jobs.done.conclusion).toBe('success')
    expect(run.jobs.done.lanes[0].steps[1].log.some((l) => l.text === 'failure')).toBe(true)
  })
})

describe('the examples on the page', () => {
  it.each(EXAMPLES.map((e) => [e.id, e] as const))('%s reads and runs to the end', (_id, example) => {
    const workflow = load(example.source)
    const s = scenario(workflow, {
      event: example.prefer ? eventFor(workflow, example.prefer) : defaultEvent(workflow),
      reviews: defaultReviews(workflow),
    })
    const run = simulate(workflow, s, noActions)
    expect(run.triggered).toBe(true)
    expect(run.conclusion).toBe('success')
  })

  it('a version tag sends the image to production, which waits for approval', () => {
    const workflow = load(exampleById('docker')!.source)
    const s = scenario(workflow, { event: { ...defaultEvent(workflow), tag: 'v1.4.0' }, reviews: defaultReviews(workflow) })
    const run = simulate(workflow, s, noActions)
    expect(run.jobs.production.review?.env).toBe('production')
    expect(run.conclusion).toBeNull()
    // the image job's output reaches production's command through needs
    const approved = simulate(workflow, s, { decisions: { production: { approve: true, at: 500 } }, cancelledAt: null })
    expect(approved.jobs.production.lanes[0].steps[1].log[0].text).toContain('image.tag=1.4.0')
  })
})

describe('reading problems', () => {
  it('names the problem instead of throwing', () => {
    expect(parseWorkflow('jobs: [').ok).toBe(false)
    expect(parseWorkflow('name: x\njobs:\n  a:\n    runs-on: ubuntu-latest').ok).toBe(false)
    const unknown = parseWorkflow('on: push\njobs:\n  a:\n    needs: b\n    steps: []')
    expect(unknown).toMatchObject({ ok: false, problem: { code: 'unknownNeed', job: 'a', need: 'b' } })
    const loop = parseWorkflow('on: push\njobs:\n  a:\n    needs: b\n  b:\n    needs: a')
    expect(loop).toMatchObject({ ok: false, problem: { code: 'cycle' } })
  })
})
