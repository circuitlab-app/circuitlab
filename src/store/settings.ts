import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WireColor } from '@/circuit/types'
import type { Lang } from '@/i18n'

export type Theme = 'light' | 'dark'

type SettingsState = {
  lang: Lang
  theme: Theme
  sound: boolean
  /** colour for the next wire; `auto` picks red/black from the terminal polarity */
  wireColor: WireColor | 'auto'
  /** ids of completed missions */
  completed: string[]
  setLang: (lang: Lang) => void
  setTheme: (theme: Theme) => void
  toggleSound: () => void
  setWireColor: (color: WireColor | 'auto') => void
  completeMission: (id: string) => void
  resetMissions: () => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: 'en',
      theme: 'light',
      sound: true,
      wireColor: 'auto',
      completed: [],
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      setWireColor: (wireColor) => set({ wireColor }),
      completeMission: (id) =>
        set((s) => (s.completed.includes(id) ? s : { completed: [...s.completed, id] })),
      resetMissions: () => set({ completed: [] }),
    }),
    { name: 'circuit-lab:settings', version: 1 },
  ),
)
