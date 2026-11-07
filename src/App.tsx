import { ReactFlowProvider } from '@xyflow/react'
import { useEffect } from 'react'
import { DirectionProvider } from '@/components/ui/direction'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DragGhost } from '@/editor/DragGhost'
import { InspectorPanel } from '@/editor/Inspector'
import { MobileDock } from '@/editor/MobileDock'
import { PartsSidebar } from '@/editor/PartsSidebar'
import { StatusBar } from '@/editor/StatusBar'
import { TopBar } from '@/editor/TopBar'
import { Workspace } from '@/editor/Workspace'
import { useShortcuts } from '@/hooks/useShortcuts'
import { useSimulationEngine } from '@/hooks/useSimulationEngine'
import { useDocumentLanguage, useI18n } from '@/i18n'
import { unlockAudio } from '@/lib/sound'
import { useSettings } from '@/store/settings'

export default function App() {
  const { dir } = useI18n()
  const theme = useSettings((s) => s.theme)
  useDocumentLanguage()
  useSimulationEngine()
  useShortcuts()

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
        <Toaster position="bottom-center" richColors dir={dir} theme={theme} />
      </TooltipProvider>
    </DirectionProvider>
  )
}
