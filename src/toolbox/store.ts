import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TOOL_IDS, type ToolId } from './catalog'
import type { RoundQuestion } from './quiz'

/** What the Toolbox shows under a tool's page: the drawers, the quiz or the starter kit. */
export type ToolboxView = 'drawers' | 'quiz' | 'kit'

type ToolboxState = {
  open: boolean
  /** true once the box has been opened, so its code is loaded and it can animate closed */
  loaded: boolean
  view: ToolboxView
  /** the tool on show, on top of the view, or null for the view itself */
  tool: ToolId | null
  /** tools the child has opened at least once */
  seen: ToolId[]
  /** the last page turn: 1 forwards, -1 backwards, 0 a jump */
  step: number
  /** the tool whose page was just left, to put the focus back on its card */
  returnTo: ToolId | null
  /** what is typed in the search box */
  query: string
  /** starter-kit tools the child has ticked */
  kit: ToolId[]
  /** the quiz round being played, or null before it starts */
  round: RoundQuestion[] | null
  /** the tool picked for each question answered so far */
  picks: ToolId[]
  /** the question on show; equal to the round's length once it is over */
  at: number
  /** the best score of any finished round */
  best: number | null
  setOpen: (open: boolean) => void
  pick: (tool: ToolId | null) => void
  go: (view: ToolboxView) => void
  setQuery: (query: string) => void
  toggleKit: (tool: ToolId) => void
  clearKit: () => void
  startRound: (round: RoundQuestion[]) => void
  answer: (tool: ToolId) => void
  nextQuestion: () => void
}

const known = new Set<string>(TOOL_IDS)
const knownTools = (value: unknown) =>
  Array.isArray(value) ? (value.filter((id) => known.has(id)) as ToolId[]) : []

/** One Toolbox for the whole app: the top bar and the phone dock both open it. */
export const useToolbox = create<ToolboxState>()(
  persist(
    (set) => ({
      open: false,
      loaded: false,
      view: 'drawers',
      tool: null,
      seen: [],
      step: 0,
      returnTo: null,
      query: '',
      kit: [],
      round: null,
      picks: [],
      at: 0,
      best: null,
      setOpen: (open) => set(open ? { open, loaded: true } : { open }),
      pick: (tool) =>
        set((s) => {
          const total = TOOL_IDS.length
          const from = s.tool ? TOOL_IDS.indexOf(s.tool) : -1
          const to = tool ? TOOL_IDS.indexOf(tool) : -1
          const turn = (to - from + total) % total
          return {
            tool,
            step: from < 0 || to < 0 ? 0 : turn === 1 ? 1 : turn === total - 1 ? -1 : 0,
            returnTo: tool ? s.returnTo : s.tool,
            seen: tool && !s.seen.includes(tool) ? [...s.seen, tool] : s.seen,
          }
        }),
      go: (view) => set((s) => ({ view, tool: null, step: 0, returnTo: view === 'drawers' ? s.returnTo : null })),
      setQuery: (query) => set({ query }),
      toggleKit: (tool) =>
        set((s) => ({ kit: s.kit.includes(tool) ? s.kit.filter((id) => id !== tool) : [...s.kit, tool] })),
      clearKit: () => set({ kit: [] }),
      startRound: (round) => set({ round, picks: [], at: 0 }),
      answer: (tool) =>
        set((s) => {
          if (!s.round || s.picks.length > s.at) return {}
          const picks = [...s.picks, tool]
          if (picks.length < s.round.length) return { picks }
          // the last answer: keep the best score
          const score = s.round.filter((q, i) => picks[i] === q.item.answer).length
          return { picks, best: Math.max(score, s.best ?? 0) }
        }),
      nextQuestion: () => set((s) => (s.round && s.picks.length > s.at ? { at: s.at + 1 } : {})),
    }),
    {
      name: 'circuit-lab:toolbox',
      version: 1,
      // only what the child did is kept; the box always opens closed
      partialize: (s) => ({ seen: s.seen, kit: s.kit, best: s.best }),
      merge: (saved, current) => {
        const kept = (saved ?? {}) as { seen?: unknown; kit?: unknown; best?: unknown }
        return {
          ...current,
          seen: knownTools(kept.seen),
          kit: knownTools(kept.kit),
          best: typeof kept.best === 'number' && Number.isFinite(kept.best) ? kept.best : null,
        }
      },
    },
  ),
)

/** Starts loading the Toolbox before it is opened, e.g. when the pointer reaches its button. */
export const preloadToolbox = () => void import('./Toolbox')
