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

/** Where Circuit Lab's code lives. */
const GITHUB_URL = 'https://github.com/circuitlab-app/circuitlab'

/** GitHub's mark (from GitHub's Octicons), in the text colour around it. */
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className}>
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
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
        {/* the app's name on one side, its version on the other */}
        <footer className="flex items-center gap-3 border-t pt-4">
          <BrandLogo className="size-10" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-semibold">{t.app.title}</p>
            <p className="mt-0.5 flex items-center text-xs text-muted-foreground">
              <a href="https://circuitlab.app" dir="ltr" className="underline-offset-2 hover:text-foreground hover:underline">
                circuitlab.app
              </a>
              <span aria-hidden className="mx-1.5">·</span>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="inline-flex items-center gap-1 underline-offset-2 hover:text-foreground hover:underline"
              >
                <GitHubMark className="size-3.5" />
                GitHub
              </a>
            </p>
          </div>
          <span
            dir="ltr"
            className="shrink-0 rounded-full border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums"
          >
            v{__APP_VERSION__}
          </span>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
