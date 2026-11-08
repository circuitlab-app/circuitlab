import { useSyncExternalStore, type CSSProperties } from 'react'
import { useI18n, type Lang } from '@/i18n'
import { arToolbox } from '@/i18n/toolbox/ar'
import { enToolbox } from '@/i18n/toolbox/en'
import { faToolbox } from '@/i18n/toolbox/fa'
import type { ToolboxBook } from '@/i18n/toolbox/types'
import { TOOL_IDS, type ToolId } from './catalog'

/* What every screen of the Toolbox shares: its words, its layout switch and its look. */

const BOOKS: Record<Lang, ToolboxBook> = { en: enToolbox, fa: faToolbox, ar: arToolbox }

const WIDE = '(min-width: 768px)'

/** True on screens wide enough for the dialog and the drawer rail. */
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

export function useBook() {
  const { lang, dir } = useI18n()
  // Persian counts in its own digits; Arabic in this app uses 0–9
  const num = (n: number) => String(n)
  return { book: BOOKS[lang], dir, lang, num }
}

/** The pegboard behind every tool: the board's hole pattern, lit in the drawer's colour. */
export const stage = (color: string): CSSProperties => ({
  background: `radial-gradient(110% 85% at 50% 0%, color-mix(in oklch, ${color} 15%, transparent), transparent 72%) no-repeat, radial-gradient(circle, var(--stage-hole) 0 1px, transparent 1.5px) 5px 5px / 10px 10px, var(--stage-bg)`,
  boxShadow: 'inset 0 0 0 1px var(--stage-line), inset 0 2px 4px oklch(0 0 0 / 0.05)',
})

/** Ink for text in a drawer's colour that stays readable in light and dark. */
// mixed in oklab: oklch would swing orange through pink on its way to the navy text colour
export const ink = (color: string) => `color-mix(in oklab, ${color} 62%, var(--foreground))`

/*
 * Search: letters that look the same must match the same, so a child who
 * types ي or ی, ك or ک, أ or ا, with or without vowel marks, a shadda or a
 * half-space, still finds the tool.
 */
const SAME: Record<string, string> = { ي: 'ی', ى: 'ی', ك: 'ک', ة: 'ه', 'ـ': '' }

export function normalize(text: string) {
  return (
    text
      .toLowerCase()
      // split letters from their marks (أ → ا + hamza, é → e + accent), then drop the marks
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[يىكةـ]/g, (ch) => SAME[ch])
      // Persian and Arabic digits count as 0–9
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      // half-spaces, dashes and quotes are just gaps
      .replace(/\u200c|\u200d|[-–—'’“”«»()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/** The tools whose name or short line holds every word of the query, in drawer order. */
export function searchTools(book: ToolboxBook, query: string): ToolId[] {
  const words = normalize(query).split(' ').filter(Boolean)
  if (!words.length) return []
  return TOOL_IDS.filter((id) => {
    const page = book.tools[id]
    const spaced = normalize(`${page.name} ${page.short}`)
    const joined = spaced.replace(/ /g, '')
    return words.every((w) => spaced.includes(w) || joined.includes(w))
  })
}
