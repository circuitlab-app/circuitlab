import { ArrowRight, Check, RotateCcw, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import { playClick, playSuccess } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { CATEGORY_COLOR, TOOLS, type ToolId } from './catalog'
import { QuizScene, Stamp } from './Marks'
import { newRound, ROUND, type RoundQuestion } from './quiz'
import { useToolbox } from './store'
import { ToolArt } from './ToolArt'
import { stage, useBook } from './ui'

/*
 * "Which tool?": a real moment at the workbench and three tools to choose
 * from. Every answer says why, right or wrong, and a round is ten questions.
 */

/** The quiz's own colour: the amber of a workshop's hazard tape. */
const QUIZ_COLOR = '#f59e0b'

function QuizStart() {
  const { book, dir } = useBook()
  const best = useToolbox((s) => s.best)
  const startRound = useToolbox((s) => s.startRound)
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-8 text-center sm:py-12">
      <span className="grid h-40 w-full max-w-sm place-items-center rounded-lg sm:h-44" style={stage(QUIZ_COLOR)}>
        <QuizScene tools={['multimeter', 'solderingIron', 'sideCutters']} mark={dir === 'rtl' ? '؟' : '?'} size={78} />
      </span>
      {/* ten unlit lights: one for each question to come */}
      <span aria-hidden className="flex items-center gap-1.5">
        {Array.from({ length: ROUND }, (_, i) => (
          <span key={i} className="size-2.5 rounded-full bg-foreground/12 shadow-[inset_0_1px_1px_oklch(0_0_0/0.2)]" />
        ))}
      </span>
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight">{book.quiz.title}</h2>
        <p className="text-[15px] text-pretty text-muted-foreground">{book.quiz.blurb}</p>
        {best !== null && <p className="text-sm font-medium tabular-nums">{book.quiz.best(best, ROUND)}</p>}
      </div>
      <Button size="lg" className="h-11 min-w-40 gap-2 px-6 text-[15px]" onClick={() => startRound(newRound())}>
        {book.quiz.start}
        <ArrowRight className="size-4 rtl:-scale-x-100" />
      </Button>
    </div>
  )
}

/** A row of little indicator lights, one per question: green right, red wrong, amber now. */
function Lights({ round, picks, at }: { round: RoundQuestion[]; picks: ToolId[]; at: number }) {
  return (
    <span aria-hidden className="flex items-center gap-1.5">
      {round.map((q, i) => {
        const done = i < picks.length
        const right = done && picks[i] === q.item.answer
        return (
          <span
            key={q.item.id}
            className={cn(
              'size-2.5 rounded-full transition-colors duration-300',
              done && right && 'bg-emerald-500 shadow-[0_0_6px_1px_oklch(0.72_0.19_150/0.55)]',
              done && !right && 'bg-red-500 shadow-[0_0_6px_1px_oklch(0.64_0.22_25/0.5)]',
              !done && i === at && 'bg-amber-400 shadow-[0_0_6px_1px_oklch(0.8_0.16_80/0.6)]',
              !done && i !== at && 'bg-foreground/12 shadow-[inset_0_1px_1px_oklch(0_0_0/0.2)]',
            )}
          />
        )
      })}
    </span>
  )
}

function Choice({
  tool,
  index,
  state,
  onPick,
}: {
  tool: ToolId
  index: number
  state: 'idle' | 'right' | 'wrong' | 'dim'
  onPick: () => void
}) {
  const { book, num } = useBook()
  const reduce = useReducedMotion()
  const color = CATEGORY_COLOR[TOOLS[tool].category]
  const answered = state !== 'idle'
  return (
    <motion.button
      type="button"
      onClick={answered ? undefined : onPick}
      aria-disabled={answered || undefined}
      animate={
        reduce ? undefined : state === 'wrong' ? { x: [0, -7, 7, -4, 4, 0] } : state === 'right' ? { scale: [1, 1.04, 1] } : undefined
      }
      transition={{ duration: 0.42 }}
      style={{ '--tool-accent': color } as CSSProperties}
      className={cn(
        'group relative flex min-w-0 flex-col gap-2 rounded-[10px] border bg-card p-1.5 pb-2.5 text-start shadow-[var(--shadow-card)]',
        'transition-[translate,box-shadow,border-color,opacity] duration-200 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        !answered && 'hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,var(--tool-accent)_45%,var(--border))] hover:shadow-[var(--shadow-float)] active:translate-y-0',
        answered && 'cursor-default',
        state === 'right' && 'border-emerald-500 ring-2 ring-emerald-500/30',
        state === 'wrong' && 'border-red-500 ring-2 ring-red-500/25',
        state === 'dim' && 'opacity-45',
      )}
    >
      <span className="relative grid h-24 place-items-center overflow-hidden rounded-md sm:h-32" style={stage(color)}>
        <ToolArt tool={tool} size={72} className="transition-transform duration-200 ease-out group-hover:scale-[1.06] sm:size-[100px]" />
        <span
          aria-hidden
          className="absolute start-1.5 top-1.5 grid size-5 place-items-center rounded-[4px] border bg-card text-[11px] font-bold text-muted-foreground tabular-nums shadow-sm max-sm:hidden"
        >
          {num(index + 1)}
        </span>
        {(state === 'right' || state === 'wrong') && (
          <span
            className={cn(
              'absolute end-1.5 top-1.5 grid size-6 place-items-center rounded-full text-white shadow-sm [&_svg]:size-3.5',
              state === 'right' ? 'bg-emerald-500' : 'bg-red-500',
            )}
          >
            {state === 'right' ? <Check strokeWidth={3.2} /> : <X strokeWidth={3.2} />}
          </span>
        )}
      </span>
      <span className="line-clamp-2 px-1 text-[13px] leading-tight font-semibold sm:text-sm">{book.tools[tool].name}</span>
    </motion.button>
  )
}

function QuizQuestion({ round, at }: { round: RoundQuestion[]; at: number }) {
  const { book } = useBook()
  const picks = useToolbox((s) => s.picks)
  const answer = useToolbox((s) => s.answer)
  const nextQuestion = useToolbox((s) => s.nextQuestion)
  const pick = useToolbox((s) => s.pick)
  const heading = useRef<HTMLHeadingElement>(null)
  const next = useRef<HTMLButtonElement>(null)
  const { item, choices } = round[at]
  const picked = picks[at] as ToolId | undefined
  const right = picked === item.answer
  const last = at === round.length - 1

  // a new question is read out, and starts at the top
  useLayoutEffect(() => {
    heading.current?.closest('[data-pane]')?.scrollTo({ top: 0 })
    heading.current?.focus({ preventScroll: true })
  }, [at])

  // once answered, the way on is right under the thumb
  useEffect(() => {
    if (!picked) return
    next.current?.focus({ preventScroll: true })
    next.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [picked])

  const choose = (tool: ToolId) => {
    answer(tool)
    if (tool === item.answer) playSuccess()
    else playClick(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:space-y-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-xs font-semibold text-muted-foreground tabular-nums">{book.quiz.progress(at + 1, round.length)}</p>
        <Lights round={round} picks={picks} at={at} />
      </div>

      {/* the job, written on a workshop ticket */}
      <div className="relative overflow-hidden rounded-lg border bg-card px-4 py-4 shadow-[var(--shadow-card)] sm:px-5 sm:py-5">
        <span aria-hidden className="absolute inset-y-0 start-0 w-1.5 bg-[repeating-linear-gradient(135deg,#facc15_0_6px,#27272a_6px_12px)]" />
        <h2 ref={heading} tabIndex={-1} className="ps-2 text-lg leading-snug font-semibold text-pretty outline-none sm:text-xl">
          {book.quiz.questions[item.id].ask}
        </h2>
      </div>

      <p className="text-sm font-medium text-muted-foreground">{book.quiz.pick}</p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {choices.map((tool, i) => (
          <Choice
            key={tool}
            tool={tool}
            index={i}
            onPick={() => choose(tool)}
            state={!picked ? 'idle' : tool === item.answer ? 'right' : tool === picked ? 'wrong' : 'dim'}
          />
        ))}
      </div>

      <div role="status" aria-live="polite">
        {picked && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'space-y-3 rounded-lg border p-4',
              right ? 'border-emerald-500/40 bg-emerald-500/[0.07]' : 'border-red-500/35 bg-red-500/[0.06]',
            )}
          >
            <div className="flex gap-3">
              <ToolArt tool={item.answer} size={48} className="-my-1" />
              <div className="min-w-0 space-y-1">
                <p className={cn('text-[15px] font-semibold', right ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200')}>
                  {right ? book.quiz.right : book.quiz.wrong(book.tools[item.answer].name)}
                </p>
                <p className="text-[14.5px] leading-relaxed text-pretty">{book.quiz.questions[item.id].why}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => pick(item.answer)}>
                {book.quiz.open}
              </Button>
              <Button ref={next} className="gap-1.5 px-4" onClick={nextQuestion}>
                {last ? book.quiz.finish : book.quiz.next}
                <ArrowRight className="size-4 rtl:-scale-x-100" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function QuizResults({ round }: { round: RoundQuestion[] }) {
  const { book } = useBook()
  const picks = useToolbox((s) => s.picks)
  const best = useToolbox((s) => s.best)
  const startRound = useToolbox((s) => s.startRound)
  const go = useToolbox((s) => s.go)
  const pick = useToolbox((s) => s.pick)
  const reduce = useReducedMotion()
  const total = round.length
  const score = round.filter((q, i) => picks[i] === q.item.answer).length
  const missed = [...new Set(round.filter((q, i) => picks[i] !== q.item.answer).map((q) => q.item.answer))]
  const tier = score === total ? 'perfect' : score >= 7 ? 'great' : score >= 4 ? 'good' : 'start'
  const color = { perfect: '#16a34a', great: '#0284c7', good: '#d97706', start: '#7c3aed' }[tier]

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 py-8 sm:p-6 sm:py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <motion.span
          initial={reduce ? false : { scale: 1.6, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: -8 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        >
          <Stamp color={color} className="size-32 bg-card">
            <span className="text-2xl leading-tight font-black tabular-nums">{book.quiz.score(score, total)}</span>
          </Stamp>
        </motion.span>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-pretty">{book.quiz.cheers[tier]}</h2>
          {best !== null && <p className="text-sm text-muted-foreground tabular-nums">{book.quiz.best(best, total)}</p>}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="lg" className="h-11 gap-2 px-5" onClick={() => startRound(newRound())}>
            <RotateCcw className="size-4" />
            {book.quiz.again}
          </Button>
          <Button size="lg" variant="outline" className="h-11 px-5" onClick={() => go('drawers')}>
            {book.labels.back}
          </Button>
        </div>
      </div>

      {missed.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground">{book.quiz.review}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {missed.map((tool) => {
              const c = CATEGORY_COLOR[TOOLS[tool].category]
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => pick(tool)}
                  className="flex min-w-0 items-center gap-2 rounded-lg border bg-card p-1.5 pe-2.5 text-start shadow-[var(--shadow-card)] transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-md" style={stage(c)}>
                    <ToolArt tool={tool} size={38} />
                  </span>
                  <span className="line-clamp-2 min-w-0 text-[13px] leading-tight font-semibold">{book.tools[tool].name}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

/** The whole quiz: its start page, a question, or the score at the end of a round. */
export function Quiz() {
  const round = useToolbox((s) => s.round)
  const at = useToolbox((s) => s.at)
  if (!round) return <QuizStart />
  if (at >= round.length) return <QuizResults round={round} />
  return <QuizQuestion round={round} at={at} />
}
