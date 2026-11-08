import { useSyncExternalStore } from 'react'
import { useI18n, type Lang } from '@/i18n'
import { arPipeline } from '@/i18n/pipeline/ar'
import { enPipeline } from '@/i18n/pipeline/en'
import { faPipeline } from '@/i18n/pipeline/fa'
import type { PipelineBook } from '@/i18n/pipeline/types'

/* What every part of the Pipeline Lab shares: its words, its clock and its colours. */

const BOOKS: Record<Lang, PipelineBook> = { en: enPipeline, fa: faPipeline, ar: arPipeline }

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

export function usePipelineBook() {
  const { lang, dir } = useI18n()
  const book = BOOKS[lang]
  // Persian counts in its own digits; Arabic in this app uses 0–9
  const digits = (text: string) => (lang === 'fa' ? text.replace(/\d/g, (d) => FA_DIGITS[Number(d)]) : text)
  /** Seconds as a clock, m:ss. */
  const clock = (seconds: number) => {
    const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
    return digits(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`)
  }
  const eventName = (event: string) => book.events[event] ?? event
  return { book, lang, dir, digits, clock, eventName }
}

const WIDE = '(min-width: 1024px)'

/** True on screens wide enough for the side panel next to the board. */
export function useWide() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(WIDE)
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    },
    () => window.matchMedia(WIDE).matches,
    () => true,
  )
}

/** The colour of each state, shared by cards, wires, the bulb and the timeline (tokens in index.css). */
export const STATE_COLOR: Record<string, string> = {
  ready: 'var(--pipe-idle)',
  pending: 'var(--pipe-idle)',
  queued: 'var(--pipe-idle)',
  waiting: 'var(--pipe-wait)',
  running: 'var(--pipe-run)',
  success: 'var(--pipe-ok)',
  failure: 'var(--pipe-bad)',
  cancelled: 'var(--pipe-off)',
  skipped: 'var(--pipe-off)',
  'not-triggered': 'var(--pipe-bad)',
}
