import { applyEdgeChanges, applyNodeChanges, type Connection, type Edge, type EdgeChange, type Node, type NodeChange } from '@xyflow/react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SCHEMES, type Scheme } from './modulation'
import { LENGTH, presetFor, type PartData, type PartKind, type ZoneKey } from './parts'
import { TECHS, type Building, type Tech, type Tower } from './radio'

/*
 * The Telecom Lab's state: which section is open, the call board (its parts,
 * wires and the step of the call on show), the modulation scope's settings,
 * and the city map (towers, the phone, its walk).
 */

export type Mode = 'call' | 'waves' | 'scope' | 'map' | 'guide'
export type Panel = 'call' | 'part' | 'tray'

export type PartNodeType = Node<PartData, 'part'>
export type ZoneNodeType = Node<{ zone: ZoneKey; w: number; h: number }, 'zone'>
export type TelNode = PartNodeType | ZoneNodeType
export type SignalEdgeType = Edge<Record<string, never>, 'signal'>

/* ───────────────────────── the city ───────────────────────── */

/** The map is 10 km × 6.4 km. */
export const CITY = { w: 10, h: 6.4 }

export const TOWERS: Tower[] = [
  { id: 'T1', x: 1.6, y: 1.5, gens: ['2g', '3g', '4g'], band5g: 'mid', aggregation: false, on: true },
  { id: 'T2', x: 4.6, y: 2.5, gens: ['2g', '3g', '4g', '5g'], band5g: 'mid', aggregation: true, on: true },
  { id: 'T3', x: 5.95, y: 3.45, gens: ['5g'], band5g: 'high', aggregation: false, on: true },
  { id: 'T4', x: 8.4, y: 1.6, gens: ['2g', '4g'], band5g: 'mid', aggregation: true, on: true },
  { id: 'T5', x: 7.6, y: 5.0, gens: ['3g', '4g', '5g'], band5g: 'low', aggregation: false, on: true },
  { id: 'T6', x: 1.3, y: 5.3, gens: ['2g'], band5g: 'mid', aggregation: false, on: true },
]

export const BUILDINGS: Building[] = [
  { x: 4.0, y: 2.9, w: 0.5, h: 0.4 },
  { x: 4.8, y: 3.05, w: 0.6, h: 0.35 },
  { x: 5.5, y: 2.3, w: 0.45, h: 0.5 },
  { x: 6.15, y: 3.0, w: 0.45, h: 0.6 },
  { x: 5.0, y: 3.8, w: 0.7, h: 0.4 },
  { x: 4.2, y: 3.6, w: 0.4, h: 0.5 },
  { x: 6.3, y: 4.0, w: 0.35, h: 0.4 },
  { x: 2.4, y: 2.2, w: 0.4, h: 0.3 },
  { x: 7.8, y: 2.6, w: 0.5, h: 0.4 },
]

/** The walk across town: suburbs, downtown past the mmWave small cell, then out to the countryside. */
export const ROUTE: [number, number][] = [
  [0.5, 3.0],
  [2.6, 2.4],
  [4.6, 3.0],
  [5.85, 3.42],
  [7.6, 2.4],
  [9.3, 4.6],
  [6.5, 5.9],
  [2.8, 5.9],
  [0.6, 4.4],
]

const routeLengths = ROUTE.slice(1).map(([x, y], i) => Math.hypot(x - ROUTE[i][0], y - ROUTE[i][1]))
const routeTotal = routeLengths.reduce((a, b) => a + b, 0)

/** The point `at` (0–1) of the way along the walk. */
export function alongRoute(at: number): { x: number; y: number } {
  let left = Math.min(Math.max(at, 0), 1) * routeTotal
  for (let i = 0; i < routeLengths.length; i++) {
    if (left <= routeLengths[i]) {
      const f = left / routeLengths[i]
      return { x: ROUTE[i][0] + f * (ROUTE[i + 1][0] - ROUTE[i][0]), y: ROUTE[i][1] + f * (ROUTE[i + 1][1] - ROUTE[i][1]) }
    }
    left -= routeLengths[i]
  }
  const [x, y] = ROUTE[ROUTE.length - 1]
  return { x, y }
}

/* ───────────────────────── the board ───────────────────────── */

function boardFor(tech: Tech): { nodes: TelNode[]; edges: SignalEdgeType[] } {
  const preset = presetFor(tech)
  const zones: ZoneNodeType[] = preset.zones.map((z, i) => ({
    id: `zone-${i}`,
    type: 'zone',
    position: { x: z.x, y: z.y },
    data: { zone: z.key, w: z.w, h: z.h },
    draggable: false,
    selectable: false,
    focusable: false,
    zIndex: -1,
  }))
  const parts: PartNodeType[] = preset.parts.map((p) => ({ id: p.id, type: 'part', position: { x: p.x, y: p.y }, data: p.data }))
  const edges: SignalEdgeType[] = preset.edges.map((e) => ({ id: `${e.source}->${e.target}`, type: 'signal', ...e }))
  return { nodes: [...zones, ...parts], edges }
}

const STOPPED = { step: -1, playing: false }

type TelecomState = {
  mode: Mode
  tech: Tech
  nodes: TelNode[]
  edges: SignalEdgeType[]
  selected: string | null
  panel: Panel
  /** the step of the call on show (-1: not started) */
  step: number
  playing: boolean

  scheme: Scheme
  text: string
  snr: number
  seed: number

  towers: Tower[]
  phone: { x: number; y: number }
  lteLabel: '4g' | 'lte'
  tower: string | null
  walking: boolean
  walkAt: number

  setMode: (mode: Mode) => void
  setTech: (tech: Tech) => void
  resetBoard: () => void
  onNodesChange: (changes: NodeChange<TelNode>[]) => void
  onEdgesChange: (changes: EdgeChange<SignalEdgeType>[]) => void
  connect: (c: Connection) => void
  addPart: (kind: PartKind, at: { x: number; y: number }) => void
  updatePart: (id: string, patch: Partial<PartData>) => void
  removePart: (id: string) => void
  select: (id: string | null) => void
  setPanel: (panel: Panel) => void
  play: () => void
  pause: () => void
  goTo: (step: number) => void
  stop: () => void

  setScheme: (scheme: Scheme) => void
  setText: (text: string) => void
  setSnr: (snr: number) => void
  newNoise: () => void

  setPhone: (p: { x: number; y: number }) => void
  setLteLabel: (label: '4g' | 'lte') => void
  selectTower: (id: string | null) => void
  updateTower: (id: string, patch: Partial<Tower>) => void
  addTower: (at: { x: number; y: number }) => void
  removeTower: (id: string) => void
  resetTowers: () => void
  setWalking: (walking: boolean) => void
  setWalkAt: (at: number) => void
}

export const useTelecom = create<TelecomState>()(
  persist(
    (set, get) => ({
      mode: 'call',
      tech: '4g',
      ...boardFor('4g'),
      selected: null,
      panel: 'call',
      ...STOPPED,

      scheme: 'qpsk',
      text: 'سلام! Hello',
      snr: 18,
      seed: 1,

      towers: TOWERS,
      phone: { x: 3.2, y: 2.2 },
      lteLabel: '4g',
      tower: null,
      walking: false,
      walkAt: 0,

      setMode: (mode) => set({ mode }),
      setTech: (tech) => set({ tech, ...boardFor(tech), selected: null, panel: 'call', ...STOPPED }),
      resetBoard: () => set((s) => ({ ...boardFor(s.tech), selected: null, ...STOPPED })),

      // dragging a part keeps the call where it is; anything else changes the circuit and stops it
      onNodesChange: (changes) =>
        set((s) => {
          const moved = changes.every((c) => c.type === 'position' || c.type === 'dimensions' || c.type === 'select')
          const removed = changes.some((c) => c.type === 'remove' && c.id === s.selected)
          return {
            nodes: applyNodeChanges(changes, s.nodes),
            ...(moved ? {} : STOPPED),
            ...(removed ? { selected: null, panel: 'call' as Panel } : {}),
          }
        }),
      onEdgesChange: (changes) =>
        set((s) => ({
          edges: applyEdgeChanges(changes, s.edges),
          ...(changes.some((c) => c.type === 'remove') ? STOPPED : {}),
        })),
      // one wire out of each part and one wire into it: a new wire replaces the old ones
      connect: ({ source, target }) =>
        set((s) => {
          if (!source || !target || source === target) return {}
          const edges = s.edges.filter((e) => e.source !== source && e.target !== target)
          return { edges: [...edges, { id: `${source}->${target}`, type: 'signal', source, target }], ...STOPPED }
        }),
      addPart: (kind, at) =>
        set((s) => {
          const taken = new Set(s.nodes.map((n) => n.id))
          let n = 1
          while (taken.has(`${kind}-${n}`)) n++
          const id = `${kind}-${n}`
          const data: PartData = { kind, ...(LENGTH[kind] ? { km: LENGTH[kind]!.km } : {}) }
          return {
            nodes: [...s.nodes, { id, type: 'part', position: at, data }],
            selected: id,
            panel: 'part',
            ...STOPPED,
          }
        }),
      updatePart: (id, patch) =>
        set((s) => ({
          nodes: s.nodes.map((n) => (n.id === id && n.type === 'part' ? { ...n, data: { ...n.data, ...patch } } : n)),
          ...STOPPED,
        })),
      removePart: (id) =>
        set((s) => ({
          nodes: s.nodes.filter((n) => n.id !== id),
          edges: s.edges.filter((e) => e.source !== id && e.target !== id),
          selected: null,
          panel: 'call',
          ...STOPPED,
        })),
      select: (id) => set({ selected: id, panel: id ? 'part' : get().panel === 'part' ? 'call' : get().panel }),
      setPanel: (panel) => set({ panel }),
      play: () => set((s) => ({ playing: true, step: s.step < 0 ? 0 : s.step, panel: 'call' })),
      pause: () => set({ playing: false }),
      goTo: (step) => set({ step: Math.max(-1, step), panel: 'call' }),
      stop: () => set(STOPPED),

      setScheme: (scheme) => set({ scheme }),
      setText: (text) => set({ text: text.slice(0, 60) }),
      setSnr: (snr) => set({ snr }),
      newNoise: () => set((s) => ({ seed: s.seed + 1 })),

      setPhone: (phone) => set({ phone }),
      setLteLabel: (lteLabel) => set({ lteLabel }),
      selectTower: (tower) => set({ tower }),
      updateTower: (id, patch) => set((s) => ({ towers: s.towers.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      addTower: (at) =>
        set((s) => {
          let n = s.towers.length + 1
          while (s.towers.some((t) => t.id === `T${n}`)) n++
          const tower: Tower = { id: `T${n}`, ...at, gens: ['4g', '5g'], band5g: 'mid', aggregation: false, on: true }
          return { towers: [...s.towers, tower], tower: tower.id }
        }),
      removeTower: (id) => set((s) => ({ towers: s.towers.filter((t) => t.id !== id), tower: null })),
      resetTowers: () => set({ towers: TOWERS, tower: null }),
      setWalking: (walking) => set((s) => ({ walking, walkAt: walking && s.walkAt >= 1 ? 0 : s.walkAt })),
      setWalkAt: (walkAt) => set({ walkAt, phone: alongRoute(walkAt) }),
    }),
    {
      name: 'circuit-lab:telecom',
      version: 1,
      partialize: (s) => ({ mode: s.mode, tech: s.tech, scheme: s.scheme, text: s.text, snr: s.snr, lteLabel: s.lteLabel }),
      merge: (saved, current) => {
        const kept = (saved ?? {}) as Partial<TelecomState>
        const tech = TECHS.includes(kept.tech as Tech) ? (kept.tech as Tech) : current.tech
        return {
          ...current,
          mode: (['call', 'waves', 'scope', 'map', 'guide'] as Mode[]).includes(kept.mode as Mode) ? (kept.mode as Mode) : current.mode,
          tech,
          ...boardFor(tech),
          scheme: SCHEMES.includes(kept.scheme as Scheme) ? (kept.scheme as Scheme) : current.scheme,
          text: typeof kept.text === 'string' ? kept.text.slice(0, 60) : current.text,
          snr: typeof kept.snr === 'number' && Number.isFinite(kept.snr) ? Math.min(40, Math.max(0, kept.snr)) : current.snr,
          lteLabel: kept.lteLabel === 'lte' ? 'lte' : '4g',
        }
      },
    },
  ),
)
