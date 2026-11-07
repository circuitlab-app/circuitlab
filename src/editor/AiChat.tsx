import { ArrowUp, Check, Copy, RotateCcw, Square, TriangleAlert } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { askBoard, ideaThing, localPartName, stopBoard } from '@/ai/ask'
import type { OllamaProblem } from '@/ai/ollama'
import { describeBoard, SOUNDERS, suggestionsFor, type Suggestion } from '@/ai/plan'
import { useAiChat, type ChatTurn } from '@/ai/store'
import type { PinMode } from '@/circuit/types'
import { useI18n, type Lang } from '@/i18n'
import { useAiBook, type AiBook } from '@/i18n/ai'
import type { SetupStep } from '@/i18n/ai/types'
import { cn } from '@/lib/utils'
import { useCircuit } from '@/store/circuit'
import { LlamaMark, ThinkingDots } from './AiCard'
import { PIN_GLYPHS } from './pinGlyphs'

/*
 * The AI board's chat in the details panel: whether Ollama is there (and how
 * to start it when it is not), what the child asked and what the board
 * answered, which pins each answer changed, a few ideas to try, and the box
 * to type in.
 */

const EMPTY: ChatTurn[] = []
/** The last "Ask" press already brought into view, so a re-render does not scroll again. */
let handledRequest = 0
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', ''])

function ideaText(idea: Suggestion, ai: AiBook, lang: Lang): string {
  switch (idea.kind) {
    case 'whenDark':
      return ai.ideas.whenDark(ideaThing(lang, idea.device))
    case 'whenSensed':
      return SOUNDERS.has(idea.device.type) ? ai.ideas.whenSensedBeep : ai.ideas.whenSensedLight(ideaThing(lang, idea.device))
    case 'blink':
      return ai.ideas.blink(ideaThing(lang, idea.device))
    case 'slowly':
      return ai.ideas.slowly(ideaThing(lang, idea.device))
    default:
      return ai.ideas[idea.kind]
  }
}

/** A small round lamp before the connection line, like the one on each card. */
function Lamp({ tone, pulse }: { tone: 'idle' | 'on' | 'warn'; pulse?: boolean }) {
  const color = tone === 'on' ? '#22c55e' : tone === 'warn' ? '#f59e0b' : 'oklch(0.72 0.01 60)'
  return (
    <span
      aria-hidden
      className={cn('status-led', tone !== 'idle' && 'status-led--lit', pulse && 'status-led--thinking')}
      style={{ ['--led' as string]: color }}
    />
  )
}

function CommandLine({ command, ai }: { command: string; ai: AiBook }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])
  return (
    <div dir="ltr" className="mt-1 flex items-center gap-1 rounded-md bg-zinc-950 py-1 ps-2.5 pe-1 text-zinc-100">
      <code className="min-w-0 flex-1 overflow-x-auto font-mono text-[11.5px] whitespace-nowrap">{command}</code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(command).then(() => setCopied(true))
        }}
        className="flex h-6 shrink-0 items-center gap-1 rounded-[4px] px-1.5 text-[11px] font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
      >
        {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        {copied ? ai.setup.copied : ai.setup.copy}
      </button>
    </div>
  )
}

function Steps({ steps, ai }: { steps: SetupStep[]; ai: AiBook }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2 text-[13px] leading-snug">
          <span className="mt-px grid size-[18px] shrink-0 place-items-center rounded-[4px] bg-foreground/[0.07] text-[11px] font-semibold tabular-nums">
            {(i + 1).toLocaleString(document.documentElement.lang || 'en')}
          </span>
          <div className="min-w-0 flex-1">
            <p>{step.text}</p>
            {step.command && <CommandLine command={step.command} ai={ai} />}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Where Ollama listens, for a computer that runs it somewhere else on the network. */
function AddressField({ ai }: { ai: AiBook }) {
  const host = useAiChat((s) => s.host)
  const [value, setValue] = useState(host)
  const commit = () => {
    if (value.trim() && value.trim() !== host) {
      useAiChat.getState().setHost(value)
      void useAiChat.getState().checkConnection()
    }
  }
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground">{ai.connection.address}</span>
      <input
        dir="ltr"
        value={value}
        spellCheck={false}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="h-8 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs shadow-[inset_0_1px_2px_oklch(0_0_0/0.06)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
      />
    </label>
  )
}

/** Simple steps for starting Ollama, letting this website in, or getting a model. */
function SetupHelp({ problem, ai }: { problem: OllamaProblem; ai: AiBook }) {
  const origin = window.location.origin
  const onWebsite = !LOCAL_HOSTS.has(window.location.hostname)
  if (problem === 'blocked') {
    return (
      <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.07] p-3">
        <p className="text-sm font-semibold">{ai.setup.blockedTitle}</p>
        <p className="text-[13px] leading-snug">{ai.setup.blockedText}</p>
        <CommandLine command={ai.setup.blockedCommand(origin)} ai={ai} />
      </div>
    )
  }
  if (problem === 'noModel') {
    return (
      <div className="space-y-2.5 rounded-lg border bg-card p-3">
        <p className="text-sm font-semibold">{ai.setup.noModelTitle}</p>
        <Steps steps={ai.setup.noModelSteps} ai={ai} />
      </div>
    )
  }
  if (problem !== 'offline') return null
  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <p className="text-sm font-semibold">{ai.setup.offlineTitle}</p>
      <Steps steps={ai.setup.offlineSteps} ai={ai} />
      {onWebsite && (
        <div className="space-y-1 border-t pt-2.5 text-[13px] leading-snug">
          <p>{ai.setup.websiteNote}</p>
          <CommandLine command={ai.setup.blockedCommand(origin)} ai={ai} />
        </div>
      )}
      <AddressField ai={ai} />
    </div>
  )
}

const gigabytes = (bytes: number) => (bytes > 0 ? `${(bytes / 1e9).toFixed(1)} GB` : '')

/** "Ollama is on" and the model picker, or what is wrong and a button to look again. */
function ConnectionLine({ ai }: { ai: AiBook }) {
  const connection = useAiChat((s) => s.connection)
  const model = useAiChat((s) => s.model)
  const check = () => void useAiChat.getState().checkConnection()

  if (connection.state === 'ready') {
    const chat = connection.models.filter((m) => m.chat)
    return (
      <div className="flex items-center gap-2 text-xs">
        <Lamp tone="on" />
        <span className="min-w-0 flex-1 truncate font-medium">{ai.connection.ready}</span>
        <Select value={model ?? undefined} onValueChange={(next) => useAiChat.getState().setModel(next)}>
          <SelectTrigger size="sm" className="h-7 max-w-[60%] min-w-0 bg-background text-xs" aria-label={ai.connection.model} dir="ltr">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {chat.map((m) => (
              <SelectItem key={m.name} value={m.name} dir="ltr">
                <span className="font-mono text-xs">{m.name}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">{gigabytes(m.size)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }
  if (connection.state === 'problem') {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs">
          <Lamp tone="warn" />
          <span className="min-w-0 flex-1 leading-snug font-medium">{ai.problems[connection.problem]}</span>
          <button
            type="button"
            onClick={check}
            className="flex h-7 shrink-0 items-center gap-1 rounded-md border bg-background px-2 font-medium transition hover:bg-muted"
          >
            <RotateCcw className="size-3.5 -scale-x-100" aria-hidden />
            {ai.connection.retry}
          </button>
        </div>
        <SetupHelp problem={connection.problem} ai={ai} />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Lamp tone="idle" pulse />
      <span>{ai.connection.checking}</span>
    </div>
  )
}

/** The little round face beside the board's words. */
function Avatar() {
  return (
    <span
      aria-hidden
      className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md text-[#efe7d3]"
      style={{ background: '#2a2d42', ['--llama-eyes' as string]: '#2a2d42' }}
    >
      <LlamaMark className="size-4" />
    </span>
  )
}

/** What an answer changed: one row per pin, with the same marks as the pin chips on the card. */
function ChangeList({ changes, ai }: { changes: Extract<ChatTurn, { role: 'ai' }>['changes']; ai: AiBook }) {
  const { t } = useI18n()
  if (changes.length === 0) return <p className="mt-1 text-xs text-muted-foreground">{ai.noChange}</p>
  return (
    <div className="mt-1.5 space-y-1" aria-label={ai.changed}>
      {changes.map((c) => (
        <div
          key={c.pin}
          className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs"
          aria-label={ai.changeLabel(c.pin, t.inspector.pinModes[c.from], t.inspector.pinModes[c.to])}
        >
          <span dir="ltr" className="flex shrink-0 items-center gap-1 font-mono text-[11px] font-semibold">
            <span className="rounded-[3px] bg-zinc-900 px-1 py-px text-[10px] text-white dark:bg-zinc-700">{c.pin}</span>
            <span className={cn('w-2.5 text-center text-muted-foreground', c.from === 'invert' && 'overline')}>{PIN_GLYPHS[c.from]}</span>
            <span aria-hidden className="text-muted-foreground">→</span>
            <span className={cn('w-2.5 text-center text-teal-700 dark:text-teal-300', c.to === 'invert' && 'overline')}>
              {PIN_GLYPHS[c.to]}
            </span>
          </span>
          <span className="shrink-0 font-semibold">{t.inspector.pinModes[c.to as PinMode]}</span>
          {c.part && <span className="min-w-0 truncate text-muted-foreground">{c.part}</span>}
        </div>
      ))}
    </div>
  )
}

function Turn({ turn, ai }: { turn: ChatTurn; ai: AiBook }) {
  if (turn.role === 'kid') {
    return (
      <div className="flex justify-end">
        <span className="sr-only">{ai.you}: </span>
        {/* each message follows its own words: Persian typed in the English app still reads right to left */}
        <p
          dir="auto"
          className="max-w-[86%] rounded-lg rounded-ee-[3px] bg-primary px-3 py-1.5 text-sm leading-snug break-words whitespace-pre-wrap text-primary-foreground"
        >
          {turn.text}
        </p>
      </div>
    )
  }
  if (turn.role === 'problem') {
    return (
      <p className="flex items-start gap-1.5 ps-8 text-xs leading-snug text-amber-800 dark:text-amber-300">
        <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
        {ai.problems[turn.problem]}
      </p>
    )
  }
  return (
    <div className="flex gap-2">
      <Avatar />
      <div className="min-w-0 flex-1">
        <span className="sr-only">{ai.helper}: </span>
        <p dir="auto" className="text-start text-sm leading-snug break-words">
          {turn.text}
        </p>
        <ChangeList changes={turn.changes} ai={ai} />
      </div>
    </div>
  )
}

/** The board working out its answer: hopping dots, the seconds so far, and Stop. */
function Thinking({ boardId, since, ai }: { boardId: string; since: number; ai: AiBook }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [])
  const seconds = Math.max(0, Math.floor((now - since) / 1000))
  return (
    <div className="flex items-center gap-2" role="status">
      <Avatar />
      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
        <ThinkingDots className="text-amber-500" />
        <span className="truncate">{ai.thinkingNow}</span>
        <span className="text-xs tabular-nums">{ai.seconds(seconds)}</span>
      </div>
      <button
        type="button"
        onClick={() => stopBoard(boardId)}
        className="flex h-7 shrink-0 items-center gap-1 rounded-md border bg-background px-2 text-xs font-medium transition hover:bg-muted"
      >
        <Square className="size-3 fill-current" aria-hidden />
        {ai.stop}
      </button>
    </div>
  )
}

/** The AI board's chat, shown in the details panel when an AI board is picked. */
export function AiChat({ boardId }: { boardId: string }) {
  const ai = useAiBook()
  const { lang } = useI18n()
  const turns = useAiChat((s) => s.chats[boardId] ?? EMPTY)
  const since = useAiChat((s) => s.pending[boardId])
  const connection = useAiChat((s) => s.connection.state)
  const thinking = since !== undefined
  const [text, setText] = useState('')
  const root = useRef<HTMLElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)

  // the ideas follow what is wired; the key changes only when they do, not on every drag
  const ideasKey = useCircuit((s) => {
    const info = describeBoard(boardId, s.nodes, s.edges, { local: (data) => localPartName(lang, data) })
    return info ? JSON.stringify(suggestionsFor(info)) : '[]'
  })
  const ideas = useMemo(() => JSON.parse(ideasKey) as Suggestion[], [ideasKey])
  const nothingWired = ideas[0]?.kind === 'howToConnect'

  // look for Ollama when the chat opens
  useEffect(() => {
    if (useAiChat.getState().connection.state === 'unknown') void useAiChat.getState().checkConnection()
  }, [])

  // keep the newest words in view
  useEffect(() => {
    const el = log.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [turns.length, thinking])

  // the card's "Ask" button: bring the chat into view, ready to type in (phones keep their keyboard down)
  const request = useAiChat((s) => s.openRequest)
  useEffect(() => {
    if (!request || request.id !== boardId || handledRequest === request.n) return
    handledRequest = request.n
    const timer = setTimeout(() => {
      root.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      if (window.matchMedia('(min-width: 64rem)').matches) input.current?.focus({ preventScroll: true })
    }, 220)
    return () => clearTimeout(timer)
  }, [request, boardId])

  const send = (words: string) => {
    if (!words.trim() || thinking) return
    void askBoard(boardId, words)
    setText('')
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(text)
    }
  }

  return (
    <section ref={root} aria-label={ai.title} className="scroll-mt-3 space-y-2.5">
      <div className="flex h-5 items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-muted-foreground">{ai.title}</h4>
        {turns.length > 0 && !thinking && (
          <button
            type="button"
            onClick={() => useAiChat.getState().clearChat(boardId)}
            className="text-xs font-medium text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
          >
            {ai.clear}
          </button>
        )}
      </div>

      <ConnectionLine ai={ai} />

      <div className="overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
        <div ref={log} className="max-h-80 space-y-3 overflow-y-auto overscroll-contain p-3" aria-live="polite">
          {turns.length === 0 && (
            <div className="flex gap-2">
              <Avatar />
              <p className="text-sm leading-snug">{nothingWired ? `${ai.hello} ${ai.noParts}` : ai.hello}</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {turns.map((turn) => (
              <motion.div
                key={turn.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
              >
                <Turn turn={turn} ai={ai} />
              </motion.div>
            ))}
          </AnimatePresence>
          {thinking && <Thinking boardId={boardId} since={since} ai={ai} />}
        </div>

        {!thinking && ideas.length > 0 && (
          <div className="border-t bg-muted/40 px-3 py-2">
            <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">{ai.tryThese}</p>
            <div className="flex flex-wrap gap-1.5">
              {ideas.map((idea) => {
                const words = ideaText(idea, ai, lang)
                return (
                  <button
                    key={words}
                    type="button"
                    disabled={connection === 'checking'}
                    onClick={() => send(words)}
                    className="rounded-md border bg-background px-2 py-1 text-start text-xs leading-snug transition hover:border-primary/40 hover:bg-primary/[0.06] disabled:opacity-50"
                  >
                    {words}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <form
          className="flex items-end gap-1.5 border-t bg-muted/40 p-2"
          onSubmit={(e) => {
            e.preventDefault()
            send(text)
          }}
        >
          <textarea
            ref={input}
            rows={1}
            dir="auto"
            value={text}
            maxLength={400}
            placeholder={ai.placeholder}
            aria-label={ai.placeholder}
            onChange={(e) => {
              setText(e.target.value)
              // grow with the words, up to four lines
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`
            }}
            onKeyDown={onKey}
            className="max-h-24 min-h-9 min-w-0 flex-1 resize-none rounded-md border border-input bg-background px-2.5 py-[7px] text-sm leading-snug shadow-[inset_0_1px_2px_oklch(0_0_0/0.06)] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          />
          {thinking ? (
            <button
              type="button"
              onClick={() => stopBoard(boardId)}
              aria-label={ai.stop}
              title={ai.stop}
              className="grid size-9 shrink-0 place-items-center rounded-md border bg-background transition hover:bg-muted"
            >
              <Square className="size-3.5 fill-current" aria-hidden />
            </button>
          ) : (
            <button
              type="submit"
              aria-label={ai.send}
              title={ai.send}
              disabled={!text.trim()}
              className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm transition hover:brightness-110 disabled:opacity-40"
            >
              <ArrowUp className="size-4" aria-hidden />
            </button>
          )}
        </form>
      </div>

      <p className="text-[11px] leading-snug text-muted-foreground">
        {ai.privacy} {ai.mayBeWrong}
      </p>
    </section>
  )
}
