/** Letters that look different but mean the same to someone typing a search. */
const SAME: Record<string, string> = { ي: 'ی', ى: 'ی', ك: 'ک', ة: 'ه', 'ـ': '' }

/**
 * Text as a search sees it, so children find things however they type them:
 * no capitals or accents, Arabic and Persian letter shapes made one (ي/ی,
 * ك/ک, ة/ه, أ/إ/آ → ا), short-vowel marks and half-spaces dropped, Persian and
 * Arabic digits read as 0–9. Fold both the query and the text it searches.
 */
export function foldSearch(text: string) {
  return (
    text
      .toLowerCase()
      // split letters from their marks (أ → ا + hamza, é → e + accent) and odd letter
      // forms into plain ones, then drop the marks
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .replace(/[يىكةـ]/g, (ch) => SAME[ch])
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      // Persian half-spaces join the word: «چراغ‌ها» matches «چراغها»
      .replace(/[‌‍]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  )
}
