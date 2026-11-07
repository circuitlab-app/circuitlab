import { describe, expect, it } from 'vitest'
import { foldSearch } from './fold'

describe('foldSearch: children find things however they type them', () => {
  it('treats Arabic and Persian letter shapes as one', () => {
    expect(foldSearch('كليد')).toBe(foldSearch('کلید'))
    expect(foldSearch('باتري')).toBe(foldSearch('باتری'))
    // ة reads as ه, and the hamza seat in ئ is folded too
    expect(foldSearch('دائرة')).toBe(foldSearch('دائره'))
    expect(foldSearch('أحمر')).toBe(foldSearch('احمر'))
  })

  it('drops short-vowel marks and tatweel', () => {
    expect(foldSearch('مِصْبَاح')).toBe('مصباح')
    expect(foldSearch('مصـــباح')).toBe('مصباح')
  })

  it('joins Persian half-spaces', () => {
    expect(foldSearch('چراغ‌ها')).toBe('چراغها')
  })

  it('reads Persian and Arabic digits as 0–9', () => {
    expect(foldSearch('۵۵۵')).toBe('555')
    expect(foldSearch('٥٥٥')).toBe('555')
  })

  it('ignores capitals and extra spaces', () => {
    expect(foldSearch('  Red   LED ')).toBe('red led')
  })
})
