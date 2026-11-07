import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from '@xyflow/react'
import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { PARTS, createPartData, isRotatable, nextRotation } from '@/circuit/catalog'
import type {
  CircuitSnapshot,
  PartData,
  PartNode,
  PartType,
  WireColor,
  WireEdge,
} from '@/circuit/types'
import { useSettings } from './settings'

const HISTORY_LIMIT = 80

export const NODE_WIDTH = 176
export const NODE_HEIGHT = 178

export const uid = (prefix: string) =>
  `${prefix}-${crypto.randomUUID().replaceAll('-', '').slice(0, 8)}`

/** Strips transient UI state so snapshots and saved boards stay clean. */
function cleanNode(node: PartNode): PartNode {
  const { selected: _selected, dragging: _dragging, ...rest } = node
  return { ...rest, data: { ...node.data, pressed: false } }
}

function cleanEdge(edge: WireEdge): WireEdge {
  const { selected: _selected, ...rest } = edge
  return rest
}

function snapshotOf(state: { nodes: PartNode[]; edges: WireEdge[] }): CircuitSnapshot {
  return { nodes: state.nodes.map(cleanNode), edges: state.edges.map(cleanEdge) }
}

function sameTerminals(edge: WireEdge, c: Connection) {
  const forward =
    edge.source === c.source &&
    edge.sourceHandle === c.sourceHandle &&
    edge.target === c.target &&
    edge.targetHandle === c.targetHandle
  const backward =
    edge.source === c.target &&
    edge.sourceHandle === c.targetHandle &&
    edge.target === c.source &&
    edge.targetHandle === c.sourceHandle
  return forward || backward
}

function wireColorFor(nodes: PartNode[], c: Connection): WireColor {
  const preferred = useSettings.getState().wireColor
  if (preferred !== 'auto') return preferred
  const polarityOf = (nodeId: string, handle: string | null) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node || !handle) return undefined
    return PARTS[node.data.type].terminals[handle]?.polarity
  }
  const polarities = [polarityOf(c.source, c.sourceHandle), polarityOf(c.target, c.targetHandle)]
  if (polarities.includes('+')) return 'red'
  if (polarities.includes('-')) return 'black'
  return 'blue'
}

type UpdateOptions = { history?: boolean }

type CircuitState = CircuitSnapshot & {
  /** bumped when a whole board is loaded, so the view can fit it */
  fitRequest: number
  past: CircuitSnapshot[]
  future: CircuitSnapshot[]
  onNodesChange: (changes: NodeChange<PartNode>[]) => void
  onEdgesChange: (changes: EdgeChange<WireEdge>[]) => void
  onConnect: (connection: Connection) => void
  /** remember the current board so the next change can be undone */
  checkpoint: () => void
  addPart: (type: PartType, position: XYPosition) => string
  updatePart: (id: string, patch: Partial<PartData>, options?: UpdateOptions) => void
  rotatePart: (id: string) => void
  duplicatePart: (id: string) => void
  removePart: (id: string) => void
  setWireColor: (id: string, color: WireColor) => void
  removeWire: (id: string) => void
  select: (id: string | null) => void
  load: (snapshot: CircuitSnapshot) => void
  clear: () => void
  undo: () => void
  redo: () => void
}

/** Writing to localStorage on every drag frame is wasteful: batch the writes. */
function debouncedLocalStorage(delay = 400): StateStorage {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  return {
    getItem: (name) => localStorage.getItem(name),
    setItem: (name, value) => {
      clearTimeout(timers.get(name))
      timers.set(
        name,
        setTimeout(() => localStorage.setItem(name, value), delay),
      )
    },
    removeItem: (name) => localStorage.removeItem(name),
  }
}

export const useCircuit = create<CircuitState>()(
  persist(
    (set, get) => {
      const checkpoint = () =>
        set((s) => ({
          past: [...s.past, snapshotOf(s)].slice(-HISTORY_LIMIT),
          future: [],
        }))

      return {
        nodes: [],
        edges: [],
        fitRequest: 0,
        past: [],
        future: [],

        // Deletions are checkpointed once in the board's `onBeforeDelete`,
        // because React Flow reports node and edge removals separately.
        onNodesChange: (changes) => {
          set((s) => {
            const nodes = applyNodeChanges(changes, s.nodes)
            const removed = changes.filter((c) => c.type === 'remove').map((c) => c.id)
            const edges = removed.length
              ? s.edges.filter((e) => !removed.includes(e.source) && !removed.includes(e.target))
              : s.edges
            return { nodes, edges }
          })
        },

        onEdgesChange: (changes) => {
          set((s) => ({ edges: applyEdgeChanges(changes, s.edges) }))
        },

        onConnect: (connection) => {
          const { nodes, edges } = get()
          if (connection.source === connection.target) return
          if (edges.some((e) => sameTerminals(e, connection))) return
          checkpoint()
          const edge: WireEdge = {
            id: uid('wire'),
            type: 'wire',
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
            data: { color: wireColorFor(nodes, connection) },
          }
          set({ edges: [...edges, edge] })
        },

        checkpoint,

        addPart: (type, position) => {
          checkpoint()
          const id = uid(type)
          const node: PartNode = {
            id,
            type: 'part',
            position,
            data: createPartData(type),
            selected: true,
          }
          set((s) => ({
            nodes: [...s.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)), node],
            edges: s.edges.map((e) => (e.selected ? { ...e, selected: false } : e)),
          }))
          return id
        },

        updatePart: (id, patch, options = {}) => {
          if (options.history !== false) checkpoint()
          set((s) => ({
            nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
          }))
        },

        rotatePart: (id) => {
          const node = get().nodes.find((n) => n.id === id)
          // the Arduino's pins only make sense the right way up
          if (node && isRotatable(node.data.type)) {
            get().updatePart(id, { rotation: nextRotation(node.data.rotation) })
          }
        },

        duplicatePart: (id) => {
          const node = get().nodes.find((n) => n.id === id)
          if (!node) return
          checkpoint()
          const copy: PartNode = {
            ...cleanNode(node),
            id: uid(node.data.type),
            position: { x: node.position.x + 36, y: node.position.y + 36 },
            data: { ...node.data, burnt: false, pressed: false },
            selected: true,
          }
          set((s) => ({
            nodes: [...s.nodes.map((n) => ({ ...n, selected: false })), copy],
          }))
        },

        removePart: (id) => {
          checkpoint()
          set((s) => ({
            nodes: s.nodes.filter((n) => n.id !== id),
            edges: s.edges.filter((e) => e.source !== id && e.target !== id),
          }))
        },

        setWireColor: (id, color) => {
          checkpoint()
          set((s) => ({
            edges: s.edges.map((e) => (e.id === id ? { ...e, data: { color } } : e)),
          }))
        },

        removeWire: (id) => {
          checkpoint()
          set((s) => ({ edges: s.edges.filter((e) => e.id !== id) }))
        },

        select: (id) =>
          set((s) => ({
            nodes: s.nodes.map((n) => ({ ...n, selected: n.id === id })),
            edges: s.edges.map((e) => ({ ...e, selected: e.id === id })),
          })),

        load: (snapshot) => {
          checkpoint()
          set((s) => ({
            nodes: snapshot.nodes.map(cleanNode),
            edges: snapshot.edges.map(cleanEdge),
            fitRequest: s.fitRequest + 1,
          }))
        },

        clear: () => {
          checkpoint()
          set({ nodes: [], edges: [] })
        },

        undo: () => {
          const { past, future } = get()
          const previous = past.at(-1)
          if (!previous) return
          set((s) => ({
            ...previous,
            past: past.slice(0, -1),
            future: [snapshotOf(s), ...future].slice(0, HISTORY_LIMIT),
          }))
        },

        redo: () => {
          const { past, future } = get()
          const next = future[0]
          if (!next) return
          set((s) => ({
            ...next,
            past: [...past, snapshotOf(s)].slice(-HISTORY_LIMIT),
            future: future.slice(1),
          }))
        },
      }
    },
    {
      name: 'circuit-lab:circuit',
      version: 1,
      storage: createJSONStorage(() => debouncedLocalStorage()),
      partialize: (s) => snapshotOf(s),
    },
  ),
)

export const selectSelectedPart = (s: CircuitState) => s.nodes.find((n) => n.selected)
export const selectSelectedWire = (s: CircuitState) => s.edges.find((e) => e.selected)

export type SelectedPart = Pick<PartNode, 'id' | 'data'>

/**
 * The picked part's id and data. Panels use this instead of the whole node:
 * a node object changes on every frame while it is dragged, its data does not,
 * so the panels no longer re-render during a drag.
 */
export function useSelectedPart(): SelectedPart | undefined {
  const id = useCircuit((s) => s.nodes.find((n) => n.selected)?.id)
  const data = useCircuit((s) => (id === undefined ? undefined : s.nodes.find((n) => n.id === id)?.data))
  return useMemo(() => (id && data ? { id, data } : undefined), [id, data])
}
