import { useI18n, type Lang } from '@/i18n'
import { arPower } from '@/i18n/power/ar'
import { enPower } from '@/i18n/power/en'
import { faPower } from '@/i18n/power/fa'
import type { PowerBook } from '@/i18n/power/types'

const BOOKS: Record<Lang, PowerBook> = { en: enPower, fa: faPower, ar: arPower }
/** The Power Lab's words and numbers in the reader's language. */
export function usePowerBook() {
  const { lang, dir } = useI18n()
  const digits = (text: string) => text
  const num = (value: number, fraction = 0) =>
    digits(value.toLocaleString('en-US', { maximumFractionDigits: fraction, useGrouping: false }))
  return { book: BOOKS[lang], lang, dir, digits, num }
}
