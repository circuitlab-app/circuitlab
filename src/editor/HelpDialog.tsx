import { CircleQuestionMark } from '@/components/animate-ui/icons/circle-question-mark'
import { BrandLogo } from '@/components/BrandLogo'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n'

const MAKER = 'SBC'

/** The maker's line ("A product of SBC") with the maker's name linked to its website. */
function MadeBy({ line }: { line: string }) {
  const at = line.indexOf(MAKER)
  const link = (
    <a
      href="https://sbc.om"
      target="_blank"
      rel="noopener noreferrer"
      dir="ltr"
      className="font-semibold text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
    >
      {MAKER}
    </a>
  )
  if (at < 0) return <>{line} {link}</>
  return (
    <>
      {line.slice(0, at)}
      {link}
      {line.slice(at + MAKER.length)}
    </>
  )
}

/**
 * "How to play". It brings its own button in the top bar; on phones the
 * "More" menu opens it instead through `open` / `onOpenChange`.
 */
export function HelpDialog({
  open,
  onOpenChange,
  withTrigger = true,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  withTrigger?: boolean
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {withTrigger && (
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon-lg" aria-label={t.toolbar.help}>
                <CircleQuestionMark size={18} animateOnHover />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>{t.toolbar.help}</TooltipContent>
        </Tooltip>
      )}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{t.help.title}</DialogTitle>
          <DialogDescription className="text-pretty">{t.help.intro}</DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {t.help.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary tabular-nums">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <div className="rounded-xl bg-muted/60 p-3 max-md:hidden">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{t.help.shortcuts}</p>
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1.5 text-sm">
            {t.help.keys.map(([key, label]) => (
              <div key={key} className="contents">
                <dt dir="ltr" className="text-end">
                  <Kbd>{key}</Kbd>
                </dt>
                <dd>{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <footer className="flex items-center gap-3 border-t pt-4">
          <BrandLogo className="size-10" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-semibold">{t.app.title}</p>
            {/* the maker on one side, the version on the other */}
            <div className="mt-0.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <p className="min-w-0">
                <MadeBy line={t.app.madeBy} />
                <span aria-hidden className="mx-1.5">·</span>
                <a href="https://circuitlab.app" dir="ltr" className="underline-offset-2 hover:text-foreground hover:underline">
                  circuitlab.app
                </a>
              </p>
              <span
                dir="ltr"
                className="shrink-0 rounded-full border bg-muted/60 px-2 py-0.5 text-[11px] font-medium tabular-nums"
              >
                v{__APP_VERSION__}
              </span>
            </div>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
