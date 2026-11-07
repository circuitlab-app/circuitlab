import { useEffect } from 'react'
import { useSettings } from '@/store/settings'
import { ar } from './ar'
import { en, type Dictionary } from './en'
import { fa } from './fa'

export type { Dictionary }

export type Lang = 'en' | 'ar' | 'fa'
export type Direction = 'ltr' | 'rtl'

export const DEFAULT_LANG: Lang = 'en'

/** Languages offered in the language menu, labelled in their own script. */
export const LANGUAGES: { code: Lang; label: string; short: string; dir: Direction }[] = [
  { code: 'en', label: 'English', short: 'EN', dir: 'ltr' },
  { code: 'ar', label: 'العربية', short: 'ع', dir: 'rtl' },
  { code: 'fa', label: 'فارسی', short: 'فا', dir: 'rtl' },
]

export const DICTIONARIES: Record<Lang, Dictionary> = { en, ar, fa }

export const directionOf = (lang: Lang): Direction =>
  LANGUAGES.find((l) => l.code === lang)?.dir ?? 'ltr'

/** Older saved settings may hold a language we no longer ship. */
const known = (lang: string | undefined): Lang =>
  lang === 'en' || lang === 'ar' || lang === 'fa' ? lang : DEFAULT_LANG

/** Text for the current language, outside React (e.g. inside effects). */
export function currentDictionary(): Dictionary {
  return DICTIONARIES[known(useSettings.getState().lang)]
}

export function useI18n() {
  const lang = known(useSettings((s) => s.lang))
  return { t: DICTIONARIES[lang], lang, dir: directionOf(lang) } as const
}

/** Keeps <html lang dir> and the tab title in sync with the chosen language. */
export function useDocumentLanguage() {
  const { t, lang, dir } = useI18n()
  useEffect(() => {
    const root = document.documentElement
    root.lang = lang
    root.dir = dir
    document.title = `${t.app.title} · ${t.app.subtitle}`
  }, [t, lang, dir])
}
