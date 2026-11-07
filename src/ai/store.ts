import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { PinMode } from '@/circuit/types'
import { DEFAULT_HOST, listModels, normalizeHost, OllamaError, pickModel, warmUp, type ModelInfo, type OllamaProblem } from './ollama'
import type { PinChange } from './plan'

/** One line of an AI board's chat. */
export type ChatTurn =
  | { id: string; role: 'kid'; text: string; at: number }
  | {
      id: string
      role: 'ai'
      text: string
      at: number
      /** the pins this answer changed, with the part each one drives (in the app's language) */
      changes: (PinChange & { part?: string })[]
      /** every pin the answer asked for, changed or not: the model sees these again next time */
      pins: Record<string, PinMode>
      /** how long the model took, in seconds */
      seconds: number
    }
  | { id: string; role: 'problem'; problem: OllamaProblem; at: number }

export type Connection =
  | { state: 'unknown' }
  | { state: 'checking' }
  | { state: 'ready'; models: ModelInfo[] }
  | { state: 'problem'; problem: OllamaProblem; models: ModelInfo[] }

/** Chats are kept short: the model only reads the last few lines anyway. */
const TURNS_PER_BOARD = 40
/** Boards whose chat is remembered; the oldest are forgotten first. */
const BOARDS_KEPT = 24

type AiState = {
  /** where Ollama listens */
  host: string
  /** the model picked in the panel, or the one chosen for the child */
  model: string | null
  chats: Record<string, ChatTurn[]>
  /** boards waiting for an answer right now (not saved) */
  pending: Record<string, number>
  connection: Connection
  /** bumped by a card's "Ask" button so the panels open the chat (not saved) */
  openRequest: { id: string; n: number } | null
  setHost: (host: string) => void
  setModel: (model: string) => void
  addTurn: (boardId: string, turn: ChatTurn) => void
  clearChat: (boardId: string) => void
  setPending: (boardId: string, on: boolean) => void
  requestOpen: (boardId: string) => void
  checkConnection: () => Promise<Connection>
}

const warmed = new Set<string>()
let checking: Promise<Connection> | null = null

export const useAiChat = create<AiState>()(
  persist(
    (set, get) => ({
      host: DEFAULT_HOST,
      model: null,
      chats: {},
      pending: {},
      connection: { state: 'unknown' },
      openRequest: null,

      setHost: (host) => set({ host: normalizeHost(host), connection: { state: 'unknown' } }),
      setModel: (model) => {
        set({ model })
        void warmUp(get().host, model)
      },

      addTurn: (boardId, turn) =>
        set((s) => {
          const chats = { ...s.chats, [boardId]: [...(s.chats[boardId] ?? []), turn].slice(-TURNS_PER_BOARD) }
          // forget the boards whose chat is oldest
          const ids = Object.keys(chats)
          if (ids.length > BOARDS_KEPT) {
            const last = (id: string) => chats[id].at(-1)?.at ?? 0
            for (const id of ids.sort((a, b) => last(a) - last(b)).slice(0, ids.length - BOARDS_KEPT)) delete chats[id]
          }
          return { chats }
        }),

      clearChat: (boardId) =>
        set((s) => {
          const { [boardId]: _gone, ...chats } = s.chats
          return { chats }
        }),

      setPending: (boardId, on) =>
        set((s) => {
          const { [boardId]: _was, ...rest } = s.pending
          return { pending: on ? { ...rest, [boardId]: Date.now() } : rest }
        }),

      requestOpen: (boardId) => set((s) => ({ openRequest: { id: boardId, n: (s.openRequest?.n ?? 0) + 1 } })),

      checkConnection: () => {
        // a second panel asking at the same moment shares the first check
        if (checking) return checking
        set({ connection: { state: 'checking' } })
        checking = (async (): Promise<Connection> => {
          let connection: Connection
          try {
            const models = await listModels(get().host)
            const model = pickModel(models, get().model)
            if (!model) {
              connection = { state: 'problem', problem: 'noModel', models }
            } else {
              connection = { state: 'ready', models }
              if (model !== get().model) set({ model })
              // load the model now, so the first answer comes sooner
              const key = `${get().host} ${model}`
              if (!warmed.has(key)) {
                warmed.add(key)
                void warmUp(get().host, model)
              }
            }
          } catch (error) {
            connection = { state: 'problem', problem: error instanceof OllamaError ? error.problem : 'failed', models: [] }
          }
          set({ connection })
          return connection
        })().finally(() => {
          checking = null
        })
        return checking
      },
    }),
    {
      name: 'circuit-lab:ai',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ host: s.host, model: s.model, chats: s.chats }),
    },
  ),
)

/** True while this board waits for the model. */
export const useThinking = (boardId: string) => useAiChat((s) => s.pending[boardId] !== undefined)

/** True while any board waits for the model (the 3D canvas keeps drawing then). */
export const anyThinking = () => Object.keys(useAiChat.getState().pending).length > 0
