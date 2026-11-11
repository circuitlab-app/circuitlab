import { Building2, Cog, Droplets, ShowerHead } from 'lucide-react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Separator } from '@/components/ui/separator'
import { LabSwitcher } from '@/editor/LabSwitcher'
import { LanguageMenu, ThemeToggle } from '@/editor/TopBar'
import type { HydraulicsMode } from '@/i18n/hydraulics/types'
import { cn } from '@/lib/utils'
import { Basics } from './Basics'
import { City } from './City'
import { Home } from './Home'
import { Machines } from './Machines'
import { useHydraulicsBook } from './ui'

/*
 * The Hydraulics Lab: water and oil under pressure. Four sections: the
 * plumbing of a building (solved as a pipe network), the laws of fluids,
 * oil-hydraulic machines, and a town with its water tower.
 */

const MODES: HydraulicsMode[] = ['home', 'basics', 'machines', 'city']
const ICONS = { home: ShowerHead, basics: Droplets, machines: Cog, city: Building2 }

const useHydraulics = create<{ mode: HydraulicsMode; setMode: (mode: HydraulicsMode) => void }>()(
  persist((set) => ({ mode: 'home', setMode: (mode) => set({ mode }) }), {
    name: 'circuit-lab:hydraulics',
    version: 1,
    merge: (saved, current) => {
      const mode = (saved as { mode?: HydraulicsMode } | undefined)?.mode
      return { ...current, mode: mode && MODES.includes(mode) ? mode : current.mode }
    },
  }),
)

export default function HydraulicsLab() {
  const { book } = useHydraulicsBook()
  const mode = useHydraulics((s) => s.mode)
  const setMode = useHydraulics((s) => s.setMode)
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-1 border-b bg-background px-2 sm:gap-2 sm:px-3">
        <h1 className="sr-only">{book.title}</h1>
        <LabSwitcher current="hydraulics" />
        <Separator orientation="vertical" className="mx-0.5 !h-6 max-sm:hidden" />
        <nav className="flex min-w-0 gap-0.5 overflow-x-auto" aria-label={book.title}>
          {MODES.map((id) => {
            const Icon = ICONS[id]
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                aria-current={id === mode ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition',
                  id === mode ? 'bg-[color-mix(in_oklch,var(--tel-accent)_14%,transparent)] text-[var(--tel-accent)]' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className={cn(id !== mode && 'max-md:hidden')}>{book.modes[id]}</span>
              </button>
            )
          })}
        </nav>
        <div className="ms-auto flex shrink-0 items-center gap-0.5 max-lg:hidden">
          <LanguageMenu />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">{mode === 'home' ? <Home /> : mode === 'basics' ? <Basics /> : mode === 'machines' ? <Machines /> : <City />}</main>
    </div>
  )
}
