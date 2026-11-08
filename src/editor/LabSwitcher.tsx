import { ChevronDown, Workflow } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

/*
 * The site's logo and name are a menu of its labs: the circuit board and the
 * Pipeline Lab (GitHub Actions simulated like a circuit). Each lab is a page
 * in the address bar, so the menu only changes the address.
 */

export type Lab = 'board' | 'pipelines'

export const PIPELINES_HASH = '#/pipelines'

const ADDRESS: Record<Lab, string> = { board: '#/', pipelines: PIPELINES_HASH }
const LABS: Lab[] = ['board', 'pipelines']

/** Starts loading the Pipeline Lab before it is picked, e.g. when the pointer reaches the menu. */
const preloadPipelines = () => void import('@/pipeline/PipelineLab')

function PipelinesMark({ className }: { className?: string }) {
  return (
    <span className={cn('grid place-items-center rounded-lg bg-primary text-primary-foreground', className)} aria-hidden>
      <Workflow className="size-[58%]" />
    </span>
  )
}

export function LabSwitcher({ current }: { current: Lab }) {
  const { t } = useI18n()
  const name: Record<Lab, string> = { board: t.app.title, pipelines: t.toolbar.pipelines }
  const hint: Record<Lab, string> = { board: t.app.subtitle, pipelines: t.toolbar.pipelinesHint }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${name[current]} · ${t.toolbar.labs}`}
          onPointerEnter={current === 'board' ? preloadPipelines : undefined}
          onFocus={current === 'board' ? preloadPipelines : undefined}
          className="group flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl py-1 ps-1 pe-1.5 transition outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted"
        >
          <span className="relative shrink-0">
            <BrandLogo className="size-9" />
            {current === 'pipelines' ? (
              <PipelinesMark className="absolute -end-1 -bottom-1 size-[18px] rounded-md ring-2 ring-background" />
            ) : null}
          </span>
          <span className="min-w-0 text-start leading-tight max-sm:hidden">
            <span className="block truncate text-[15px] font-semibold tracking-tight">{name[current]}</span>
            <span className="block truncate text-[11px] text-muted-foreground max-lg:hidden">{hint[current]}</span>
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 max-w-[calc(100vw-1rem)]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{t.toolbar.labs}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(lab) => {
            window.location.hash = ADDRESS[lab as Lab]
          }}
        >
          {LABS.map((lab) => (
            <DropdownMenuRadioItem key={lab} value={lab} className="items-start gap-2.5 py-2">
              {lab === 'board' ? <BrandLogo className="size-8" /> : <PipelinesMark className="size-8" />}
              <span className="min-w-0">
                <span className="block font-medium">{name[lab]}</span>
                <span className="block text-xs leading-snug text-muted-foreground">{hint[lab]}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
