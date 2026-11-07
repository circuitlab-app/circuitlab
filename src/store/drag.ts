import { create } from 'zustand'
import type { PartType } from '@/circuit/types'

/** Pointer-based drag from the parts box (works with mouse, pen and touch). */
type DragState = {
  type: PartType | null
  origin: { x: number; y: number }
  overBoard: boolean
  start: (type: PartType, x: number, y: number) => void
  setOverBoard: (over: boolean) => void
  end: () => void
}

export const useDrag = create<DragState>()((set) => ({
  type: null,
  origin: { x: 0, y: 0 },
  overBoard: false,
  start: (type, x, y) => set({ type, origin: { x, y }, overBoard: false }),
  setOverBoard: (overBoard) => set((s) => (s.overBoard === overBoard ? s : { overBoard })),
  end: () => set({ type: null, overBoard: false }),
}))
