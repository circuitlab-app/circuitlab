import {
  Antenna,
  AudioLines,
  AudioWaveform,
  Binary,
  Building,
  Cable,
  Mic,
  Network,
  Radio,
  RadioTower,
  ScanLine,
  Speaker,
  Spline,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useI18n, type Lang } from '@/i18n'
import { arTelecom } from '@/i18n/telecom/ar'
import { enTelecom } from '@/i18n/telecom/en'
import { faTelecom } from '@/i18n/telecom/fa'
import type { TelecomBook } from '@/i18n/telecom/types'
import { LENGTH, type Form, type PartData, type PartKind } from './parts'
import { radioOf, type Gen, type Tech } from './radio'

/* What every section of the Telecom Lab shares: its words, numbers, colours and icons. */

const BOOKS: Record<Lang, TelecomBook> = { en: enTelecom, fa: faTelecom, ar: arTelecom }

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

export function useTelecomBook() {
  const { lang, dir } = useI18n()
  const book = BOOKS[lang]
  const digits = (text: string) => (lang === 'fa' ? text.replace(/\d/g, (d) => FA_DIGITS[Number(d)]) : text)
  /** A number with up to `fraction` decimals, in the reader's digits. */
  const num = (value: number, fraction = 0) =>
    digits(value.toLocaleString('en-US', { maximumFractionDigits: fraction, useGrouping: false }))
  /** A duration: 0.4 s, 12 s, 3 min. */
  const time = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '∞'
    if (seconds < 1) return digits(`${seconds.toFixed(2)} s`)
    if (seconds < 90) return digits(`${Math.round(seconds)} s`)
    if (seconds < 5400) return digits(`${Math.round(seconds / 60)} min`)
    return digits(`${(seconds / 3600).toFixed(1)} h`)
  }
  /** A speed: 40 kbit/s, 21 Mbit/s, 1.8 Gbit/s. */
  const speed = (mbps: number) => {
    if (mbps <= 0) return '—'
    if (mbps < 1) return digits(`${Math.round(mbps * 1000)} kbit/s`)
    if (mbps < 1000) return digits(`${mbps < 10 ? mbps.toFixed(1) : Math.round(mbps)} Mbit/s`)
    return digits(`${(mbps / 1000).toFixed(mbps < 10000 ? 1 : 0)} Gbit/s`)
  }
  return { book, lang, dir, digits, num, time, speed }
}

/** One colour per signal form, used on wires, terminals and labels. */
export const FORM_COLOR: Record<Form, string> = {
  analog: 'var(--tel-analog)',
  digital: 'var(--tel-digital)',
  rf: 'var(--tel-rf)',
  radio: 'var(--tel-radio)',
  light: 'var(--tel-light)',
}

/** One colour per generation, on the map and in the guide (plain hex: the map's canvas needs real colours). */
export const GEN_COLOR: Record<Gen | '1g' | '6g' | 'none', string> = {
  none: '#8a8f98',
  '1g': '#78716c',
  '2g': '#e59a0b',
  '3g': '#10a37a',
  '4g': '#3b7ff0',
  '5g': '#a24ef0',
  '6g': '#e0479e',
}

export const PART_ICON: Record<PartKind, LucideIcon> = {
  mic: Mic,
  adc: Binary,
  codec: AudioLines,
  modulator: Radio,
  amplifier: Zap,
  antenna: Antenna,
  air: Wind,
  tower: RadioTower,
  fiber: Cable,
  core: Network,
  demodulator: ScanLine,
  dac: AudioWaveform,
  speaker: Speaker,
  copper: Spline,
  exchange: Building,
}

/** The technical line under a part's name for this technology: its standard, frequency or length. */
export function partDetail(data: PartData, tech: Tech, num: (n: number, f?: number) => string, walls: (n: number) => string): string {
  const radio = radioOf(tech)
  const km = data.km ?? LENGTH[data.kind]?.km ?? 0
  switch (data.kind) {
    case 'adc':
    case 'dac':
      return `8 kHz · ${tech === 'landline' ? 8 : 13} bit`
    case 'codec':
      return `${radio.codec} · ${num(radio.kbps, 1)} kbit/s`
    case 'modulator':
    case 'demodulator':
      return radio.modulation
    case 'amplifier':
      return data.flip ? 'LNA' : `PA · ${num(radio.phoneDbm)} dBm`
    case 'antenna':
      return `${num(radio.mhz)} MHz`
    case 'air':
      return `${num(km, 1)} km${data.walls ? ` · ${walls(data.walls)}` : ''}`
    case 'tower':
      return tech === 'landline' || tech === 'walkie' ? '' : `${radio.tower} · ${num(radio.mhz)} MHz`
    case 'core':
      return tech === 'landline' || tech === 'walkie' ? '' : radio.core
    case 'fiber':
    case 'copper':
      return `${num(km, 1)} km`
    case 'exchange':
      return 'PCM · 64 kbit/s'
    default:
      return ''
  }
}
