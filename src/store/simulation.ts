import { create } from 'zustand'
import { EMPTY_RESULT, type SimResult } from '@/circuit/solver'

type SimulationState = {
  running: boolean
  result: SimResult
  toggleRunning: () => void
}

export const useSimulation = create<SimulationState>()((set) => ({
  running: true,
  result: EMPTY_RESULT,
  toggleRunning: () => set((s) => ({ running: !s.running })),
}))
