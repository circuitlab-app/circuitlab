import { Ellipsis } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { LiquidButton } from '@/components/animate-ui/buttons/liquid'
import { ThemeTogglerButton, ThemeTogglerButtonIcon } from '@/components/animate-ui/buttons/theme-toggler'
import { Globe } from '@/components/animate-ui/icons/globe'
import { Moon } from '@/components/animate-ui/icons/moon'
import { Pause } from '@/components/animate-ui/icons/pause'
import { Play } from '@/components/animate-ui/icons/play'
import { Sun } from '@/components/animate-ui/icons/sun'
import { Trash2 } from '@/components/animate-ui/icons/trash-2'
import { Undo2 } from '@/components/animate-ui/icons/undo-2'
import { Volume2 } from '@/components/animate-ui/icons/volume-2'
import { VolumeX } from '@/components/animate-ui/icons/volume-x'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { buildPreset, type PresetId } from '@/circuit/presets'
import { LANGUAGES, useI18n, type Lang } from '@/i18n'
import { unlockAudio } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { useCircuit } from '@/store/circuit'
import { useSettings } from '@/store/settings'
import { useSimulation } from '@/store/simulation'
import { ToolboxButton } from '@/toolbox/ToolboxButton'
import { ExamplesGallery } from './ExamplesGallery'
import { HelpDialog } from './HelpDialog'
import { LabSwitcher } from './LabSwitcher'

/** The app's mark: a closed loop with a battery on one side and a lit bulb on top. */
function ToolButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* the span lets the tooltip work while the button is disabled */}
        <span className={className}>
          <Button variant="ghost" size="icon-lg" aria-label={label} onClick={onClick} disabled={disabled}>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function LanguageItems() {
  const { lang } = useI18n()
  const setLang = useSettings((s) => s.setLang)
  return (
    <DropdownMenuRadioGroup value={lang} onValueChange={(value) => setLang(value as Lang)}>
      {LANGUAGES.map((l) => (
        <DropdownMenuRadioItem key={l.code} value={l.code} className="justify-between">
          <span dir={l.dir} lang={l.code}>
            {l.label}
          </span>
          <span lang={l.code} className="text-xs text-muted-foreground">
            {l.short}
          </span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )
}

export function LanguageMenu() {
  const { t, lang } = useI18n()
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="lg" className="gap-1.5 px-2 font-semibold" aria-label={t.toolbar.language}>
              <Globe size={18} animateOnHover />
              <span lang={current.code} className="min-w-5 text-xs">
                {current.short}
              </span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{t.toolbar.language}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t.toolbar.language}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <LanguageItems />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ThemeToggle() {
  const { t } = useI18n()
  const theme = useSettings((s) => s.theme)
  const setTheme = useSettings((s) => s.setTheme)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <ThemeTogglerButton
            theme={theme}
            resolvedTheme={theme}
            setTheme={(next) => setTheme(next === 'dark' ? 'dark' : 'light')}
            modes={['light', 'dark']}
            variant="ghost"
            size="default"
            aria-label={t.toolbar.theme}
          >
            <ThemeTogglerButtonIcon light={<Sun size={18} />} dark={<Moon size={18} />} />
          </ThemeTogglerButton>
        </span>
      </TooltipTrigger>
      <TooltipContent>{t.toolbar.theme}</TooltipContent>
    </Tooltip>
  )
}

type Pending = { kind: 'clear' } | { kind: 'preset'; id: PresetId } | null

function RunToggle() {
  const { t } = useI18n()
  const running = useSimulation((s) => s.running)
  const toggle = useSimulation((s) => s.toggleRunning)
  const label = running ? t.toolbar.running : t.toolbar.paused
  return (
    <LiquidButton
      onClick={toggle}
      aria-pressed={running}
      aria-label={label}
      className={cn(
        'h-9 gap-2 rounded-xl px-3 text-sm font-semibold',
        running
          ? '[--liquid-button-background-color:var(--color-emerald-500)] [--liquid-button-color:var(--color-emerald-600)] text-white hover:text-white'
          : '[--liquid-button-background-color:var(--muted)] [--liquid-button-color:var(--primary)]',
      )}
    >
      <span className="relative flex size-2.5">
        {running && <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/80" />}
        <span className={cn('relative inline-flex size-2.5 rounded-full', running ? 'bg-white' : 'bg-muted-foreground')} />
      </span>
      <span className="max-sm:hidden">{label}</span>
      {running ? <Pause size={16} animateOnHover /> : <Play size={16} animateOnHover />}
    </LiquidButton>
  )
}

/** Phones: the less-used buttons fold into one menu so the bar never scrolls sideways. */
function MoreMenu({ onClear, onHelp, canClear }: { onClear: () => void; onHelp: () => void; canClear: boolean }) {
  const { t } = useI18n()
  const theme = useSettings((s) => s.theme)
  const setTheme = useSettings((s) => s.setTheme)
  const sound = useSettings((s) => s.sound)
  const toggleSound = useSettings((s) => s.toggleSound)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" aria-label={t.toolbar.more} className="md:hidden">
          <Ellipsis className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuCheckboxItem
          checked={sound}
          onCheckedChange={() => {
            unlockAudio()
            toggleSound()
          }}
        >
          {t.toolbar.soundOn}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme === 'dark'}
          onCheckedChange={(dark) => setTheme(dark ? 'dark' : 'light')}
        >
          {t.toolbar.theme}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">{t.toolbar.language}</DropdownMenuLabel>
        <LanguageItems />
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onHelp}>{t.toolbar.help}</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" disabled={!canClear} onSelect={onClear}>
          {t.toolbar.clear}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TopBar() {
  const { t } = useI18n()
  const sound = useSettings((s) => s.sound)
  const toggleSound = useSettings((s) => s.toggleSound)
  const canUndo = useCircuit((s) => s.past.length > 0)
  const canRedo = useCircuit((s) => s.future.length > 0)
  const hasParts = useCircuit((s) => s.nodes.length > 0)
  const { undo, redo, load, clear } = useCircuit.getState()
  const [pending, setPending] = useState<Pending>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)

  const loadPreset = (id: PresetId) => {
    // screens in some examples show words in the chosen language
    load(buildPreset(id, { ...t.gallery.screens, citySign: t.display.samples.citySign }))
    setGalleryOpen(false)
  }

  const confirm = () => {
    if (pending?.kind === 'clear') clear()
    if (pending?.kind === 'preset') loadPreset(pending.id)
    setPending(null)
  }

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-0.5 border-b bg-background px-2 sm:gap-1 sm:px-3">
      {/* the logo and name open the menu of labs (circuit board, Pipeline Lab) */}
      <div className="flex min-w-0 items-center pe-1 sm:pe-2">
        <LabSwitcher current="board" />
      </div>

      <Separator orientation="vertical" className="mx-1 !h-6 max-sm:hidden" />

      <ExamplesGallery
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        // an empty board opens the example at once; a full one asks first, over the gallery
        onPick={(id) => (hasParts ? setPending({ kind: 'preset', id }) : loadPreset(id))}
      />

      {/* phones open the Toolbox from the bottom dock instead */}
      <ToolboxButton className="max-md:hidden" />

      <ToolButton label={t.toolbar.undo} onClick={undo} disabled={!canUndo}>
        <Undo2 size={18} animateOnHover />
      </ToolButton>
      <ToolButton label={t.toolbar.redo} onClick={redo} disabled={!canRedo}>
        <Undo2 size={18} animateOnHover className="-scale-x-100" />
      </ToolButton>
      <ToolButton
        label={t.toolbar.clear}
        onClick={() => setPending({ kind: 'clear' })}
        disabled={!hasParts}
        className="max-md:hidden"
      >
        <Trash2 size={18} animateOnHover />
      </ToolButton>

      <div className="ms-auto flex shrink-0 items-center gap-1 ps-1">
        <RunToggle />
        <div className="flex items-center gap-0.5 max-md:hidden">
          <ToolButton
            label={sound ? t.toolbar.soundOn : t.toolbar.soundOff}
            onClick={() => {
              unlockAudio()
              toggleSound()
            }}
          >
            {sound ? <Volume2 size={18} animateOnHover /> : <VolumeX size={18} animateOnHover />}
          </ToolButton>
          <LanguageMenu />
          <ThemeToggle />
          <HelpDialog />
        </div>
        <MoreMenu
          canClear={hasParts}
          onClear={() => setPending({ kind: 'clear' })}
          onHelp={() => setHelpOpen(true)}
        />
        <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} withTrigger={false} />
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === 'clear' ? t.confirm.clearTitle : t.confirm.loadTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === 'clear' ? t.confirm.clearBody : t.confirm.loadBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.confirm.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirm} variant={pending?.kind === 'clear' ? 'destructive' : 'default'}>
              {pending?.kind === 'clear' ? t.confirm.clear : t.confirm.load}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
