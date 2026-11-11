import { useI18n, type Lang } from '@/i18n'
import { arHydraulics } from '@/i18n/hydraulics/ar'
import { enHydraulics } from '@/i18n/hydraulics/en'
import { faHydraulics } from '@/i18n/hydraulics/fa'
import type { HydraulicsBook } from '@/i18n/hydraulics/types'

const BOOKS: Record<Lang, HydraulicsBook> = { en: enHydraulics, fa: faHydraulics, ar: arHydraulics }

/** Water, and the colours the lab draws with. */
export const WATER = '#0ea5e9'
/** A blue that reads on water in both themes. */
export const DEEP = 'var(--tel-accent)'
export const RED = '#ef4444'
export const AMBER = '#e59a0b'
export const GREEN = '#10a37a'

/** The Hydraulics Lab's words and numbers in the reader's language (digits are always 0–9). */
export function useHydraulicsBook() {
  const { lang, dir } = useI18n()
  const num = (value: number, fraction = 0) => value.toLocaleString('en-US', { maximumFractionDigits: fraction, useGrouping: false })
  return { book: BOOKS[lang], lang, dir, num }
}

/** A pressure in Pa as text: 0.35 bar, 2.4 bar, 120 bar. */
export const bars = (pa: number) => {
  const bar = pa / 1e5
  return `${bar >= 100 ? bar.toFixed(0) : bar >= 10 ? bar.toFixed(1) : bar.toFixed(2)} bar`
}
