import type { Edge, Node } from '@xyflow/react'
import type { Job, Workflow } from './types'

/*
 * Where the parts sit on the board: the trigger (the battery) on the left,
 * then one column per "wave" of jobs (a job sits one column to the right of
 * the last job it needs), then the run result (the bulb). Wires follow `needs:`.
 */

export const JOB_WIDTH = 272
const TRIGGER = { width: 232, height: 214 }
const RESULT = { width: 176, height: 196 }
const GAP_X = 96
const GAP_Y = 36

// fixed row heights in the card (see .pipe-node in index.css)
const ROW = { pad: 8, head: 24, gap: 6, meta: 22, lanes: 24, step: 22, stepsPad: 8, foot: 20 }

export function jobHeight(job: Job): number {
  const steps = (job.uses ? 1 : job.steps.length) + 2
  const meta = job.if !== undefined || job.environment || job.matrix ? ROW.meta + ROW.gap : 0
  const lanes = job.matrix && job.matrix.lanes.length > 1 ? ROW.lanes + ROW.gap : 0
  return ROW.pad * 2 + ROW.head + ROW.gap + meta + lanes + steps * ROW.step + ROW.stepsPad + ROW.gap + ROW.foot
}

export type TriggerNodeType = Node<Record<string, never>, 'trigger'>
export type JobNodeType = Node<{ jobId: string }, 'job'>
export type ResultNodeType = Node<Record<string, never>, 'result'>
export type PipeNodeType = TriggerNodeType | JobNodeType | ResultNodeType

/** A wire between two parts: `from` is a job id or "trigger", `to` a job id or "result". */
export type PipeEdgeType = Edge<{ from: string; to: string }, 'pipe'>

export const jobNodeId = (id: string) => `job:${id}`

export function layout(workflow: Workflow): { nodes: PipeNodeType[]; edges: PipeEdgeType[] } {
  const byId = new Map(workflow.jobs.map((j) => [j.id, j]))
  const order = new Map(workflow.jobs.map((j, i) => [j.id, i]))
  const depth = new Map<string, number>()
  const depthOf = (id: string): number => {
    const known = depth.get(id)
    if (known !== undefined) return known
    const d = 1 + Math.max(0, ...(byId.get(id)?.needs ?? []).map(depthOf))
    depth.set(id, d)
    return d
  }
  workflow.jobs.forEach((j) => depthOf(j.id))
  const deepest = Math.max(1, ...depth.values())

  const columnX = (d: number) => TRIGGER.width + GAP_X + (d - 1) * (JOB_WIDTH + GAP_X)
  const centerY = new Map<string, number>()
  const nodes: PipeNodeType[] = [
    { id: 'trigger', type: 'trigger', position: { x: 0, y: -TRIGGER.height / 2 }, data: {} },
  ]

  for (let d = 1; d <= deepest; d++) {
    const column = workflow.jobs.filter((j) => depth.get(j.id) === d)
    // sit each job near the jobs it needs, so wires cross as little as possible
    const pull = (job: Job) =>
      job.needs.length ? job.needs.reduce((sum, n) => sum + (centerY.get(n) ?? 0), 0) / job.needs.length : 0
    if (d > 1) column.sort((a, b) => pull(a) - pull(b) || order.get(a.id)! - order.get(b.id)!)
    const heights = column.map(jobHeight)
    const total = heights.reduce((sum, h) => sum + h, 0) + GAP_Y * (column.length - 1)
    let y = -total / 2
    column.forEach((job, i) => {
      nodes.push({ id: jobNodeId(job.id), type: 'job', position: { x: columnX(d), y }, data: { jobId: job.id } })
      centerY.set(job.id, y + heights[i] / 2)
      y += heights[i] + GAP_Y
    })
  }

  nodes.push({ id: 'result', type: 'result', position: { x: columnX(deepest + 1), y: -RESULT.height / 2 }, data: {} })

  const edges: PipeEdgeType[] = []
  const wire = (from: string, to: string, source: string, target: string) =>
    edges.push({ id: `${from}->${to}`, type: 'pipe', source, target, data: { from, to }, selectable: false })

  const needed = new Set(workflow.jobs.flatMap((j) => j.needs))
  for (const job of workflow.jobs) {
    if (!job.needs.length) wire('trigger', job.id, 'trigger', jobNodeId(job.id))
    for (const need of job.needs) wire(need, job.id, jobNodeId(need), jobNodeId(job.id))
    // the last jobs feed the bulb
    if (!needed.has(job.id)) wire(job.id, 'result', jobNodeId(job.id), 'result')
  }
  return { nodes, edges }
}
