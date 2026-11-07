import {
  ArrowLeft,
  ArrowRight,
  ChartColumn,
  Clock,
  Gauge,
  Hash,
  Image,
  MoveLeft,
  Sparkles,
  Square,
  Timer,
  Type,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { DisplayMode, SignEffect } from '@/circuit/types'

/** An icon for each thing a screen can show. */
export const MODE_ICONS: Record<DisplayMode, LucideIcon> = {
  number: Hash,
  counter: Timer,
  clock: Clock,
  volts: Gauge,
  text: Type,
  scroll: MoveLeft,
  graph: ChartColumn,
  picture: Image,
  demo: Sparkles,
}

/** An icon for each way an LED sign's words move. */
export const EFFECT_ICONS: Record<SignEffect, LucideIcon> = {
  scrollLeft: ArrowLeft,
  scrollRight: ArrowRight,
  static: Square,
  blink: Zap,
  sparkle: Sparkles,
}
