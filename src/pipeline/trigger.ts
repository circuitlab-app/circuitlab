import type { Trigger, Value, Workflow } from './types'

/*
 * Which event starts the run, and whether the workflow's `on:` filters let it
 * through: a push to `feature/login` does nothing when the workflow only
 * listens to `branches: [main]`, just as a battery that is not connected
 * lights nothing.
 */

export type EventChoice = {
  event: string
  /** the branch pushed to, the pull request's own branch, or the branch a manual or scheduled run uses */
  branch: string
  /** a pushed tag, or the tag of a release; a push with a tag is a tag push */
  tag: string | null
  /** pull requests: the branch they want to merge into */
  base: string
  /** values for `workflow_dispatch` inputs */
  inputs: Record<string, string>
}

export type NotTriggered =
  | { code: 'noSuchEvent'; event: string }
  | { code: 'branch'; name: string; patterns: string[]; ignore: boolean }
  | { code: 'tag'; name: string; patterns: string[]; ignore: boolean }
  | { code: 'onlyTags' }
  | { code: 'onlyBranches' }
  | { code: 'types'; types: string[] }

/** Events about pull requests: their branch filters name the branch the change merges into. */
export const PULL_EVENTS = ['pull_request', 'pull_request_target']

/** A filter pattern (`main`, `release/**`, `v*`) as a regular expression, the way GitHub reads it. */
export function globToRegex(pattern: string): RegExp {
  let re = ''
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]
    if (c === '*') {
      if (pattern[i + 1] === '*') {
        re += '.*'
        i++
      } else re += '[^/]*'
    } else if ((c === '?' || c === '+') && re) {
      // GitHub: zero-or-one / one-or-more of the character before
      re += c
    } else if (c === '[') {
      const end = pattern.indexOf(']', i)
      if (end > i) {
        re += pattern.slice(i, end + 1)
        i = end
      } else re += '\\['
    } else re += c.replace(/[.^$|(){}\\?+\]]/g, '\\$&')
  }
  try {
    return new RegExp(`^${re}$`)
  } catch {
    return new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
  }
}

/** Patterns are read in order; a `!pattern` takes back what an earlier one matched. */
export function matchesPatterns(patterns: string[], name: string): boolean {
  let hit = false
  for (const p of patterns) {
    if (p.startsWith('!')) {
      if (globToRegex(p.slice(1)).test(name)) hit = false
    } else if (globToRegex(p).test(name)) hit = true
  }
  return hit
}

function refFilter(kind: 'branch' | 'tag', name: string, only?: string[], ignore?: string[]): NotTriggered | null {
  if (only) return matchesPatterns(only, name) ? null : { code: kind, name, patterns: only, ignore: false }
  if (ignore && matchesPatterns(ignore, name)) return { code: kind, name, patterns: ignore, ignore: true }
  return null
}

export function findTrigger(workflow: Workflow, event: string): Trigger | undefined {
  return workflow.triggers.find((t) => t.event === event)
}

/** Does this event start the workflow? If not, why not. */
export function matchTrigger(
  workflow: Workflow,
  choice: EventChoice,
): { ok: true } | { ok: false; reason: NotTriggered } {
  const trigger = findTrigger(workflow, choice.event)
  if (!trigger) return { ok: false, reason: { code: 'noSuchEvent', event: choice.event } }
  const f = trigger.filter
  const branchFilters = !!(f.branches || f.branchesIgnore)
  const tagFilters = !!(f.tags || f.tagsIgnore)
  let reason: NotTriggered | null = null

  if (choice.event === 'push') {
    if (choice.tag) {
      // with only branch filters, tag pushes are not listened to (and the other way round)
      reason = tagFilters
        ? refFilter('tag', choice.tag, f.tags, f.tagsIgnore)
        : branchFilters
          ? { code: 'onlyBranches' }
          : null
    } else {
      reason = branchFilters
        ? refFilter('branch', choice.branch, f.branches, f.branchesIgnore)
        : tagFilters
          ? { code: 'onlyTags' }
          : null
    }
  } else if (PULL_EVENTS.includes(choice.event)) {
    // a pull request's branch filter is about the branch it merges into
    reason = refFilter('branch', choice.base, f.branches, f.branchesIgnore)
    // the simulated pull request has just been opened
    if (!reason && f.types && !f.types.some((t) => t === 'opened' || t === 'synchronize')) {
      reason = { code: 'types', types: f.types }
    }
  } else if (choice.event === 'release') {
    if (f.types && !f.types.some((t) => t === 'published' || t === 'created' || t === 'released')) {
      reason = { code: 'types', types: f.types }
    }
  }
  return reason ? { ok: false, reason } : { ok: true }
}

/** A real-looking name that a filter pattern matches: `v*` → v1.4.0, `release/**` → release/1.4. */
export function sampleFor(pattern: string, kind: 'branch' | 'tag'): string {
  if (!/[*?+[]/.test(pattern)) return pattern
  if (kind === 'tag' && pattern.startsWith('v*')) return 'v1.4.0'
  return pattern
    .replace(/\*\*/g, '1.4')
    .replace(/\*/g, kind === 'tag' ? '1' : 'next')
    .replace(/[?+[\]]/g, '')
}

const firstPositive = (patterns?: string[]) => patterns?.find((p) => !p.startsWith('!'))

/** A sensible starting choice for one event: branches and tags its filters accept, inputs at their defaults. */
export function eventFor(workflow: Workflow, event: string): EventChoice {
  const trigger = findTrigger(workflow, event)
  const f = trigger?.filter ?? {}
  const branch = firstPositive(f.branches)
  const tag = firstPositive(f.tags)
  const inputs = Object.fromEntries(
    (trigger?.inputs ?? []).map((input) => [
      input.name,
      input.default ?? input.options?.[0] ?? (input.type === 'boolean' ? 'false' : ''),
    ]),
  )
  if (event === 'push') {
    const tagOnly = !!tag && !branch
    return {
      event,
      branch: branch ? sampleFor(branch, 'branch') : 'main',
      tag: tagOnly ? sampleFor(tag, 'tag') : null,
      base: 'main',
      inputs,
    }
  }
  if (PULL_EVENTS.includes(event)) {
    return { event, branch: 'feature/login', tag: null, base: branch ? sampleFor(branch, 'branch') : 'main', inputs }
  }
  if (event === 'release') return { event, branch: 'main', tag: 'v1.4.0', base: 'main', inputs }
  return { event, branch: 'main', tag: null, base: 'main', inputs }
}

/** The event the page starts with: a push to the main branch when the workflow listens to pushes. */
export function defaultEvent(workflow: Workflow): EventChoice {
  const order = ['push', 'pull_request', 'workflow_dispatch', 'release', 'schedule']
  const events = workflow.triggers.map((t) => t.event)
  return eventFor(workflow, order.find((e) => events.includes(e)) ?? events[0] ?? 'push')
}

/** The `github` context of the simulated run. */
export function githubContext(workflow: Workflow, choice: EventChoice): Record<string, Value> {
  const pull = PULL_EVENTS.includes(choice.event)
  const tag = choice.event === 'push' || choice.event === 'release' ? choice.tag : null
  const ref = pull ? 'refs/pull/42/merge' : tag ? `refs/tags/${tag}` : `refs/heads/${choice.branch}`
  const inputs: Record<string, Value> = { ...choice.inputs }
  return {
    event_name: choice.event,
    ref,
    ref_name: pull ? '42/merge' : (tag ?? choice.branch),
    ref_type: tag ? 'tag' : 'branch',
    head_ref: pull ? choice.branch : '',
    base_ref: pull ? choice.base : '',
    sha: '3f9c2e1a7b4d8c6e5f0a1b2c3d4e5f6a7b8c9d0e',
    repository: 'you/your-project',
    repository_owner: 'you',
    actor: 'you',
    triggering_actor: 'you',
    workflow: workflow.name,
    run_id: '11873400512',
    run_number: 128,
    run_attempt: '1',
    server_url: 'https://github.com',
    api_url: 'https://api.github.com',
    token: '***',
    workspace: '/home/runner/work/your-project/your-project',
    event: {
      action: pull ? 'opened' : choice.event === 'release' ? 'published' : null,
      inputs,
      ref,
      repository: { default_branch: 'main', full_name: 'you/your-project' },
      head_commit: choice.event === 'push' ? { message: 'Update the app', id: '3f9c2e1' } : null,
      pull_request: pull
        ? {
            number: 42,
            title: 'Add a sign-in page',
            draft: false,
            merged: false,
            head: { ref: choice.branch },
            base: { ref: choice.base },
          }
        : null,
      release: choice.event === 'release' ? { tag_name: choice.tag ?? 'v1.4.0', prerelease: false } : null,
    },
  }
}
