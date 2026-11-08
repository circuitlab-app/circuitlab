import { ReactFlowProvider } from '@xyflow/react'
import { AudioWaveform, BookOpen, Map as MapIcon, PhoneCall } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { LabSwitcher } from '@/editor/LabSwitcher'
import { LanguageMenu, ThemeToggle } from '@/editor/TopBar'
import { cn } from '@/lib/utils'
import { CallBoard } from './CallBoard'
import { CellMap } from './CellMap'
import { Guide } from './Guide'
import { Scope } from './Scope'
import { useTelecom, type Mode } from './store'
import { useTelecomBook } from './ui'

/*
 * The Telecom Lab: how a phone call gets from your mouth to someone else's
 * ear, through landlines, 2G to 5G, towers and fibre. Four sections: the call
 * as a circuit you can rebuild, modulation on a scope, towers and coverage on
 * a city map, and a guide to the generations and the telephone.
 */

const MODES: { id: Mode; icon: typeof BookOpen }[] = [
  { id: 'call', icon: PhoneCall },
  { id: 'scope', icon: AudioWaveform },
  { id: 'map', icon: MapIcon },
  { id: 'guide', icon: BookOpen },
]

export default function TelecomLab() {
  const { book } = useTelecomBook()
  const mode = useTelecom((s) => s.mode)
  const setMode = useTelecom((s) => s.setMode)
  return (
    <ReactFlowProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <header className="relative z-20 flex h-14 shrink-0 items-center gap-1 border-b bg-background px-2 sm:gap-2 sm:px-3">
          <h1 className="sr-only">{book.title}</h1>
          <LabSwitcher current="telecom" />
          <Separator orientation="vertical" className="mx-0.5 !h-6 max-sm:hidden" />
          <nav className="flex min-w-0 gap-0.5 overflow-x-auto" aria-label={book.title}>
            {MODES.map(({ id, icon: Icon }) => (
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
            ))}
          </nav>
          <div className="ms-auto flex shrink-0 items-center gap-0.5 max-lg:hidden">
            <LanguageMenu />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col">
          {mode === 'call' ? <CallBoard /> : mode === 'scope' ? <Scope /> : mode === 'map' ? <CellMap /> : <Guide />}
        </main>
      </div>
    </ReactFlowProvider>
  )
}
