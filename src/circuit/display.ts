import type { DemoId, DisplayMode, DisplayTint, PartData, PartType, SignEffect } from './types'

/*
 * Screens: the 7-segment display, character LCD, OLED, colour TFT, the LED
 * dot-matrix sign and the LED video wall. Their options, how big their card
 * is, and how much current they draw.
 */

export type DisplayType = 'segment' | 'lcd' | 'oled' | 'tft' | 'matrix' | 'ledwall'

export const DISPLAY_TYPES: readonly DisplayType[] = ['segment', 'lcd', 'oled', 'tft', 'matrix', 'ledwall']

export const isDisplay = (type: PartType): type is DisplayType => (DISPLAY_TYPES as readonly string[]).includes(type)

/** Screens with an S input that reads a voltage. */
export const hasSignalInput = (type: PartType) => type === 'segment' || type === 'oled'

/** What each screen can show, in the order its card cycles through them. */
export const DISPLAY_MODES: Record<DisplayType, readonly DisplayMode[]> = {
  segment: ['number', 'counter', 'clock', 'volts'],
  lcd: ['text', 'scroll', 'clock'],
  oled: ['text', 'clock', 'graph', 'picture'],
  tft: ['picture', 'demo', 'text'],
  matrix: ['text'],
  ledwall: ['demo', 'picture'],
}

/** Colours each screen comes in (colour screens have none to pick). */
export const DISPLAY_TINTS: Record<DisplayType, readonly DisplayTint[]> = {
  segment: ['red', 'green', 'blue', 'yellow', 'white'],
  lcd: ['green', 'blue'],
  oled: ['white', 'blue', 'yellowBlue'],
  tft: [],
  matrix: ['red', 'yellow', 'green', 'blue', 'white', 'rainbow'],
  ledwall: [],
}

/** The light each tint gives. `rainbow` and `yellowBlue` are drawn from several of these. */
export const TINT_COLORS: Record<DisplayTint, string> = {
  red: '#ff3b30',
  green: '#2ee66b',
  blue: '#3d8bff',
  // amber: the classic gold-shop sign
  yellow: '#ffb81f',
  white: '#f4f7ff',
  rainbow: '#ff5ec4',
  yellowBlue: '#ffd23f',
}

/** Swatch backgrounds for the colour pickers. */
export const TINT_SWATCHES: Record<DisplayTint, string> = {
  ...TINT_COLORS,
  rainbow: 'conic-gradient(from 200deg, #ff3b30, #ffb81f, #2ee66b, #3d8bff, #b04dff, #ff3b30)',
  yellowBlue: 'linear-gradient(180deg, #ffd23f 0 34%, #4fb3ff 34% 100%)',
}

export const SEGMENT_DIGITS = [1, 2, 4, 8] as const
export const LCD_SIZES = [
  [16, 2],
  [20, 4],
] as const
export const SIGN_EFFECTS: readonly SignEffect[] = ['scrollLeft', 'scrollRight', 'static', 'blink', 'sparkle']
export const DEMOS: readonly DemoId[] = ['reel', 'cityAd', 'fireworks', 'rainbow', 'news', 'clock', 'bars']

/** Modules across × down for the LED sign, panels across × down for the LED wall. */
export const DISPLAY_LIMITS = {
  matrix: { cols: 12, rows: 4 },
  ledwall: { cols: 12, rows: 8 },
} as const

/** LEDs in one sign module (a P10 module) and in one wall panel. */
export const MODULE_LEDS = {
  matrix: { w: 32, h: 16 },
  ledwall: { w: 64, h: 32 },
} as const

export const DISPLAY_DEFAULTS: Record<DisplayType, Omit<PartData, 'type' | 'rotation'>> = {
  segment: { mode: 'number', digits: 4, tint: 'red', text: '1234' },
  lcd: { mode: 'text', cols: 16, rows: 2, tint: 'green' },
  oled: { mode: 'text', tint: 'yellowBlue' },
  tft: { mode: 'demo', demo: 'rainbow' },
  matrix: { cols: 4, rows: 1, tint: 'yellow', effect: 'scrollLeft', speed: 0.5, brightness: 1 },
  ledwall: { mode: 'demo', demo: 'reel', cols: 2, rows: 1, brightness: 0.9, playing: true },
}

const clampInt = (value: number | undefined, min: number, max: number, fallback: number) =>
  Math.min(max, Math.max(min, Math.round(value ?? fallback)))

/** Modules (sign) or panels (wall) across and down, kept inside the limits. */
export function displayGrid(data: PartData) {
  const type = data.type === 'ledwall' ? 'ledwall' : 'matrix'
  const limits = DISPLAY_LIMITS[type]
  const fallback = DISPLAY_DEFAULTS[type]
  return {
    cols: clampInt(data.cols, 1, limits.cols, fallback.cols ?? 1),
    rows: clampInt(data.rows, 1, limits.rows, fallback.rows ?? 1),
  }
}

export const segmentDigits = (data: PartData) =>
  (SEGMENT_DIGITS as readonly number[]).includes(data.digits ?? 4) ? (data.digits ?? 4) : 4

export const lcdSize = (data: PartData) => (data.cols === 20 || data.rows === 4 ? { cols: 20, rows: 4 } : { cols: 16, rows: 2 })

/* ---- card size ---- */

const STANDARD_WIDTH = 176
/** padding and border around the card's window, left + right */
const CARD_CHROME = 18
/** everything in a card except its window: title row, control row, padding, gaps */
const CARD_EXTRA_HEIGHT = 78
const STANDARD_FACE = 100
/** space between the window's edge and the module drawn inside it */
const FACE_MARGIN = 6
/** the black housing around an LED sign or wall */
const LED_FRAME = 5
/** the widest LED area: a 12-panel wall shrinks its LEDs to stay about this wide */
const MAX_LED_WIDTH = 860

export type DisplayGeometry = {
  /** card width in px */
  width: number
  /** card height in px */
  height: number
  /** height of the window that shows the screen */
  faceHeight: number
  /** LED signs and walls: LEDs across and down, and the size of one LED in px */
  leds?: { w: number; h: number; pitch: number }
}

function card(faceWidth: number, faceHeight: number, leds?: DisplayGeometry['leds']): DisplayGeometry {
  const width = Math.max(STANDARD_WIDTH, Math.ceil(faceWidth + CARD_CHROME))
  const face = Math.ceil(faceHeight)
  return { width, height: face + CARD_EXTRA_HEIGHT, faceHeight: face, leds }
}

/** How big a screen's card is: it grows with the screen. */
export function displayGeometry(data: PartData): DisplayGeometry {
  switch (data.type) {
    case 'segment': {
      const digits = segmentDigits(data)
      // 26 px per digit with its dot, 4 px between digits, a colon on 4-digit clocks
      return card(28 + digits * 26 + (digits - 1) * 4 + (digits === 4 ? 8 : 0), STANDARD_FACE)
    }
    case 'lcd':
      return lcdSize(data).cols === 20 ? card(212, STANDARD_FACE) : card(198, STANDARD_FACE)
    case 'tft':
      // a 320×240 screen shown at half size, in a bezel on its board with the pins down one side
      return card(200, 154)
    case 'matrix':
    case 'ledwall': {
      const { cols, rows } = displayGrid(data)
      const module = MODULE_LEDS[data.type]
      const w = cols * module.w
      const h = rows * module.h
      const maxHeight = data.type === 'matrix' ? 200 : 520
      const pitch = Math.round(Math.min(3, MAX_LED_WIDTH / w, maxHeight / h) * 100) / 100
      const pad = 2 * (FACE_MARGIN + LED_FRAME)
      return card(w * pitch + pad, h * pitch + pad, { w, h, pitch })
    }
    default:
      return card(STANDARD_WIDTH - CARD_CHROME, STANDARD_FACE)
  }
}

/* ---- power ---- */

/**
 * Current a screen takes from 5 V. Bigger and brighter screens take more,
 * but even the biggest wall stays well below the 2 A short-circuit limit of
 * one battery.
 */
export function displayCurrent(data: PartData): number {
  switch (data.type) {
    case 'segment':
      return 0.008 + 0.012 * segmentDigits(data)
    case 'lcd':
      return lcdSize(data).cols === 20 ? 0.035 : 0.025
    case 'oled':
      return 0.02
    case 'tft':
      return 0.08
    case 'matrix':
    case 'ledwall': {
      const { cols, rows } = displayGrid(data)
      const brightness = Math.min(1, Math.max(0.1, data.brightness ?? 1))
      return data.type === 'matrix'
        ? Math.min(0.45, 0.03 + 0.015 * cols * rows * brightness)
        : Math.min(0.6, 0.05 + 0.02 * cols * rows * brightness)
    }
    default:
      return 0
  }
}
