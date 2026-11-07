import { useI18n, type Lang } from '@/i18n'
import { useSettings } from '@/store/settings'
import { arAi } from './ar'
import { enAi } from './en'
import { faAi } from './fa'
import type { AiBook } from './types'

export type { AiBook }

const BOOKS: Record<Lang, AiBook> = { en: enAi, fa: faAi, ar: arAi }

/** The AI board's words in the current language. */
export function useAiBook(): AiBook {
  return BOOKS[useI18n().lang]
}

/** The same outside React. */
export function aiBookFor(lang: string | undefined): AiBook {
  return BOOKS[(lang as Lang) in BOOKS ? (lang as Lang) : 'en']
}

export const currentAiBook = () => aiBookFor(useSettings.getState().lang)
