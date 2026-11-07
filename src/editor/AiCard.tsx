import { useAiChat, useThinking } from '@/ai/store'
import { useAiBook } from '@/i18n/ai'
import { cn } from '@/lib/utils'
import { useCircuit } from '@/store/circuit'

/**
 * A llama's face, seen from the front: two tall ears, a woolly top, a long
 * face and a soft nose. Drawn in `currentColor`; the eyes and nose take
 * `--llama-eyes` so they show on any background.
 */
export function LlamaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={cn('shrink-0', className)}>
      <g fill="currentColor">
        <ellipse cx="5.5" cy="3.3" rx="1.05" ry="2.5" transform="rotate(-14 5.5 3.3)" />
        <ellipse cx="10.5" cy="3.3" rx="1.05" ry="2.5" transform="rotate(14 10.5 3.3)" />
        <path d="M4.5 7.2Q4.5 5 8 5Q11.5 5 11.5 7.2V10.6Q11.5 14.8 8 14.8Q4.5 14.8 4.5 10.6Z" />
        <circle cx="6.8" cy="5.1" r="1.15" />
        <circle cx="8" cy="4.6" r="1.2" />
        <circle cx="9.2" cy="5.1" r="1.15" />
      </g>
      <g fill="var(--llama-eyes, #1c1f2e)">
        <circle cx="6.5" cy="8.4" r="0.72" />
        <circle cx="9.5" cy="8.4" r="0.72" />
        <path d="M6.9 11.6Q8 12.6 9.1 11.6" fill="none" stroke="var(--llama-eyes, #1c1f2e)" strokeWidth="0.75" strokeLinecap="round" />
      </g>
    </svg>
  )
}

/** Three dots that take turns hopping: the model is working on an answer. */
export function ThinkingDots({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('ai-dots inline-flex items-center gap-[3px]', className)}>
      <span className="size-1 rounded-full bg-current" />
      <span className="size-1 rounded-full bg-current" />
      <span className="size-1 rounded-full bg-current" />
    </span>
  )
}

/** The AI board card's "Ask" button: picks the board and opens its chat in the details panel. */
export function AiAskButton({ id }: { id: string }) {
  const ai = useAiBook()
  const thinking = useThinking(id)
  return (
    <button
      type="button"
      aria-label={ai.askLabel}
      title={ai.askLabel}
      className={cn(
        'ai-ask nodrag flex h-7 shrink-0 items-center gap-1 rounded-[6px] ps-1.5 pe-2 text-[11px] leading-none font-semibold text-white transition active:scale-[0.97]',
        thinking && 'ai-ask--thinking',
      )}
      onClick={(e) => {
        e.stopPropagation()
        useCircuit.getState().select(id)
        useAiChat.getState().requestOpen(id)
      }}
    >
      {thinking ? <ThinkingDots className="w-3.5 justify-center" /> : <LlamaMark className="size-3.5" />}
      <span>{ai.ask}</span>
    </button>
  )
}
