import type { PinMode } from '@/circuit/types'

/**
 * A tiny mark under each pin's name for its program, on the board cards and in
 * the AI board's list of changes. The two blinks are mirrored half moons; the
 * opposite of the sensor is S with a bar over it, the way engineers write "not S".
 */
export const PIN_GLYPHS: Record<PinMode, string> = {
  off: '·',
  on: '●',
  blink: '◐',
  blink2: '◑',
  step1: '1',
  step2: '2',
  step3: '3',
  fade: '∿',
  follow: 'S',
  invert: 'S',
  alarm: '♪',
}
