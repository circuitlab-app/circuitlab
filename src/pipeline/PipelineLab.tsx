import { ReactFlowProvider } from '@xyflow/react'
import { BookOpen, FileCode, Pause, Play, RotateCcw, ScrollText, SlidersHorizontal, Square } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LabSwitcher } from '@/editor/LabSwitcher'
import { LanguageMenu, ThemeToggle } from '@/editor/TopBar'
import { cn } from '@/lib/utils'
import { Board } from './Board'
import { EXAMPLES, type ExampleId } from './examples'
import { GuidePanel, LogsPanel, ScenarioPanel, YamlPanel } from './panels'
import { runStateAt } from './simulate'
import { SPEEDS, useLab, type Tab } from './store'
import { TimelineStrip } from './Timeline'
import { usePipelineBook } from './ui'

/*
 * The Pipeline Lab: a GitHub Actions workflow drawn as a circuit. The event
 * is the battery, jobs are parts, `needs:` are the wires and the run result
 * is a bulb. Press Run and the current flows through the pipeline the way
 * GitHub would run it, step by step, on a pretend clock.
 */

/** Moves the clock while the run plays, about 30 times a second. */
function useTicker() {
  const playing = useLab((s) => s.playing)
  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    let frame = 0
    const loop = (now: number) => {
      const dt = (now - last) / 1000
      if (dt >= 1 / 30) {
        last = now
        useLab.getState().tick(dt)
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [playing])
}

function WorkflowPicker() {
  const { book } = usePipelineBook()
  const exampleId = useLab((s) => s.exampleId)
  const custom = useLab((s) => s.custom)
  const loadExample = useLab((s) => s.loadExample)
  const applySource = useLab((s) => s.applySource)
  const setTab = useLab((s) => s.setTab)
  return (
    <Select
      value={exampleId}
      onValueChange={(id) => {
        if (id === 'custom') {
          if (custom) applySource(custom)
          setTab('yaml')
        } else loadExample(id as ExampleId)
      }}
    >
      <SelectTrigger
        className="h-9 w-[min(17rem,40vw)] justify-start gap-2 text-start font-medium max-sm:w-[9.5rem] [&>svg:last-child]:ms-auto"
        aria-label={book.workflow}
      >
        <FileCode className="size-4 text-muted-foreground" aria-hidden />
        {/* only the name in the box; the item's second line (its description) is for the list */}
        <SelectValue className="min-w-0">
          <span className="block min-w-0 truncate">
            {exampleId === 'custom' ? book.yours : book.examples[exampleId].name}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" className="w-[min(22rem,90vw)]">
        {EXAMPLES.map((e) => (
          <SelectItem key={e.id} value={e.id} textValue={book.examples[e.id].name}>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-medium">{book.examples[e.id].name}</span>
              <span className="truncate text-xs text-muted-foreground">{book.examples[e.id].description}</span>
            </span>
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value="custom">{book.yours}</SelectItem>
      </SelectContent>
    </Select>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-lg" aria-label={label} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function RunControls() {
  const { book, clock } = usePipelineBook()
  const started = useLab((s) => s.started)
  const playing = useLab((s) => s.playing)
  const runState = useLab((s) => (s.started && s.timeline ? runStateAt(s.timeline, s.t) : 'ready'))
  const cancelled = useLab((s) => s.actions.cancelledAt !== null)
  const seconds = useLab((s) => (s.started ? Math.floor(s.t) : 0))
  const togglePlay = useLab((s) => s.togglePlay)
  const reset = useLab((s) => s.reset)
  const cancel = useLab((s) => s.cancel)
  const speed = useLab((s) => s.speed)
  const setSpeed = useLab((s) => s.setSpeed)
  const over =
    runState === 'success' || runState === 'failure' || runState === 'cancelled' || runState === 'not-triggered'
  const label = !started
    ? book.controls.run
    : over
      ? book.controls.again
      : playing
        ? book.controls.pause
        : book.controls.resume

  return (
    <div className="flex items-center gap-1">
      <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium tabular-nums max-sm:hidden" title={book.controls.clock}>
        {clock(seconds)}
      </span>
      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        value={String(speed)}
        onValueChange={(v) => {
          if (v) setSpeed(Number(v))
        }}
        aria-label={book.controls.speed}
        className="max-md:hidden"
        dir="ltr"
      >
        {SPEEDS.map((s) => (
          <ToggleGroupItem key={s} value={String(s)} className="px-2 font-mono text-xs">
            {s === 0.5 ? '½' : s}×
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {started && !over && !cancelled ? (
        <IconButton label={book.controls.cancel} onClick={cancel}>
          <Square className="size-4" />
        </IconButton>
      ) : null}
      {started ? (
        <IconButton label={book.controls.restart} onClick={reset}>
          <RotateCcw className="size-4" />
        </IconButton>
      ) : null}
      <Button
        onClick={togglePlay}
        aria-pressed={playing}
        aria-label={label}
        className={cn(
          'h-9 gap-1.5 rounded-xl px-3 font-semibold',
          playing && 'bg-[var(--pipe-run)] text-black hover:bg-[var(--pipe-run)]',
        )}
      >
        {playing ? (
          <Pause className="size-4" aria-hidden />
        ) : over ? (
          <RotateCcw className="size-4" aria-hidden />
        ) : (
          <Play className="size-4" aria-hidden />
        )}
        <span className="max-sm:hidden">{label}</span>
      </Button>
    </div>
  )
}

function LabHeader() {
  const { book } = usePipelineBook()
  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-1 border-b bg-background px-2 sm:gap-2 sm:px-3">
      <h1 className="sr-only">{book.title}</h1>
      {/* the logo and name open the menu of labs, the way back to the circuit board */}
      <LabSwitcher current="pipelines" />
      <Separator orientation="vertical" className="mx-0.5 !h-6 max-sm:hidden" />
      <WorkflowPicker />
      <div className="ms-auto flex shrink-0 items-center gap-0.5">
        <RunControls />
        <div className="flex items-center gap-0.5 max-lg:hidden">
          <LanguageMenu />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

const TABS: { id: Tab; icon: typeof BookOpen }[] = [
  { id: 'scenario', icon: SlidersHorizontal },
  { id: 'logs', icon: ScrollText },
  { id: 'yaml', icon: FileCode },
  { id: 'guide', icon: BookOpen },
]

function SidePanel() {
  const { book } = usePipelineBook()
  const tab = useLab((s) => s.tab)
  const setTab = useLab((s) => s.setTab)
  return (
    <aside className="flex min-h-0 flex-col border-t bg-background max-lg:h-[42%] lg:w-[400px] lg:shrink-0 lg:border-t-0 lg:border-s xl:w-[440px]">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex min-h-0 flex-1 flex-col gap-0">
        <TabsList className="mx-2 mt-2 mb-1 w-auto self-stretch">
          {TABS.map(({ id, icon: Icon }) => (
            <TabsTrigger key={id} value={id} className="gap-1 text-[12.5px]">
              <Icon className="size-3.5 max-[380px]:hidden" aria-hidden />
              {book.tabs[id]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="scenario" className="min-h-0 overflow-y-auto">
          <ScenarioPanel />
        </TabsContent>
        <TabsContent value="logs" className="min-h-0 overflow-y-auto">
          <LogsPanel />
        </TabsContent>
        <TabsContent value="yaml" className="flex min-h-0 flex-col">
          <YamlPanel />
        </TabsContent>
        <TabsContent value="guide" className="min-h-0 overflow-y-auto">
          <GuidePanel />
        </TabsContent>
      </Tabs>
    </aside>
  )
}

export default function PipelineLab() {
  useTicker()
  return (
    <ReactFlowProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <LabHeader />
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="relative min-h-0 flex-1">
              <Board />
            </div>
            <TimelineStrip />
          </main>
          <SidePanel />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
