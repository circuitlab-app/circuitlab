import { lazy, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import { preloadToolbox, useToolbox } from './store'
import { ToolboxIcon } from './ToolboxIcon'

// the guide's words and drawings are only fetched the first time it is opened
const Toolbox = lazy(() => import('./Toolbox'))

/** Mounts the Toolbox once it has been opened from anywhere (top bar or phone dock). */
function ToolboxHost() {
  const loaded = useToolbox((s) => s.loaded)
  return loaded ? (
    <Suspense fallback={null}>
      <Toolbox />
    </Suspense>
  ) : null
}

/** The top-bar button that opens the Toolbox, plus the Toolbox itself. */
export function ToolboxButton({ className }: { className?: string }) {
  const { t } = useI18n()
  const setOpen = useToolbox((s) => s.setOpen)
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="lg"
            className={cn('gap-2 px-2.5 font-medium', className)}
            aria-label={t.toolbar.toolbox}
            onPointerEnter={preloadToolbox}
            onFocus={preloadToolbox}
            onClick={() => setOpen(true)}
          >
            <ToolboxIcon size={18} animateOnHover />
            <span className="max-lg:hidden">{t.toolbar.toolbox}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="lg:hidden">{t.toolbar.toolbox}</TooltipContent>
      </Tooltip>
      <ToolboxHost />
    </>
  )
}
