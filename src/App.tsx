import { ReactFlowProvider } from '@xyflow/react'
import { lazy, Suspense, useEffect, useSyncExternalStore } from 'react'
import { DirectionProvider } from '@/components/ui/direction'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DragGhost } from '@/editor/DragGhost'
import { InspectorPanel } from '@/editor/Inspector'
import { MobileDock } from '@/editor/MobileDock'
import { PartsSidebar } from '@/editor/PartsSidebar'
import { StatusBar } from '@/editor/StatusBar'
import { PIPELINES_HASH, POWER_HASH, TELECOM_HASH } from '@/editor/LabSwitcher'
import { TopBar } from '@/editor/TopBar'
import { Workspace } from '@/editor/Workspace'
import { useShortcuts } from '@/hooks/useShortcuts'
import { useSimulationEngine } from '@/hooks/useSimulationEngine'
import { useDocumentLanguage, useI18n } from '@/i18n'
import { unlockAudio } from '@/lib/sound'
import { useSettings } from '@/store/settings'

// the other labs are only fetched when they are opened
const PipelineLab = lazy(() => import('@/pipeline/PipelineLab'))
const TelecomLab = lazy(() => import('@/telecom/TelecomLab'))
const PowerLab = lazy(() => import('@/power/PowerLab'))

type Page = 'board' | 'power' | 'telecom' | 'pipelines'

/** The page in the address: `#/power`, `#/telecom` and `#/pipelines` are the labs, anything else the circuit board. */
function usePage(): Page {
  const hash = useSyncExternalStore(
    (onChange) => {
      window.addEventListener('hashchange', onChange)
      return () => window.removeEventListener('hashchange', onChange)
    },
    () => window.location.hash,
    () => '',
  )
  return hash.startsWith(PIPELINES_HASH) ? 'pipelines' : hash.startsWith(TELECOM_HASH) ? 'telecom' : hash.startsWith(POWER_HASH) ? 'power' : 'board'
}

/** The circuit board, with the solver and the keyboard shortcuts that only make sense on it. */
function CircuitBoard() {
  useSimulationEngine()
  useShortcuts()
  return (
    <ReactFlowProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <PartsSidebar />
          <main className="relative min-w-0 flex-1">
            <Workspace />
          </main>
          <InspectorPanel />
        </div>
        <StatusBar />
        <MobileDock />
      </div>
      <DragGhost />
    </ReactFlowProvider>
  )
}

export default function App() {
  const { t, dir } = useI18n()
  const theme = useSettings((s) => s.theme)
  const page = usePage()
  useDocumentLanguage(page === 'pipelines' ? t.toolbar.pipelines : page === 'telecom' ? t.toolbar.telecom : page === 'power' ? t.toolbar.power : undefined)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  // browsers only allow audio after a user gesture
  useEffect(() => {
    window.addEventListener('pointerdown', unlockAudio, { once: true })
    return () => window.removeEventListener('pointerdown', unlockAudio)
  }, [])

  return (
    <DirectionProvider dir={dir}>
      <TooltipProvider delayDuration={250}>
        {page === 'board' ? (
          <CircuitBoard />
        ) : (
          <Suspense fallback={<div className="h-dvh bg-background" />}>
            {page === 'pipelines' ? <PipelineLab /> : page === 'power' ? <PowerLab /> : <TelecomLab />}
          </Suspense>
        )}
        <Toaster position="bottom-center" richColors dir={dir} theme={theme} />
      </TooltipProvider>
    </DirectionProvider>
  )
}
