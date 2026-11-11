import type { Comfort, FixtureId, FluidId, HouseId, PumpMode, Regime, SourceId } from '@/hydraulics/model'

export type HydraulicsMode = 'home' | 'basics' | 'machines' | 'city'
export type HydroCardId = 'pressure' | 'pascal' | 'buoyancy' | 'continuity' | 'bernoulli' | 'torricelli' | 'reynolds' | 'friction' | 'siphon' | 'hammer' | 'analogy'
export type BodyId = 'wood' | 'ice' | 'person' | 'egg' | 'brick' | 'steel' | 'ship'

/** Every word of the Hydraulics Lab, in one language. Units (bar, L/min, m) stay as written. */
export type HydraulicsBook = {
  title: string
  modes: Record<HydraulicsMode, string>
  /** the label before each card's everyday example */
  why: string
  model: string
  fluids: Record<FluidId, string>
  home: {
    intro: string
    hint: string
    source: string
    sources: Record<SourceId, { name: string; text: string }>
    cityPressure: string
    pipe: string
    /** "Floor" before a number; the ground floor has its own word */
    floor: string
    ground: string
    fixtures: Record<FixtureId | 'hose', string>
    pressure: string
    total: string
    perHour: string
    open: string
    comfort: Record<Comfort, string>
    presets: { quiet: string; morning: string; garden: string; all: string }
    lessons: [string, string, string]
  }
  basics: {
    cards: Record<HydroCardId, { title: string; law: string; text: string; why: string }>
    bodies: Record<BodyId, string>
    regimes: Record<Regime, string>
    labels: {
      depth: string
      gauge: string
      absolute: string
      onPalm: string
      push: string
      small: string
      large: string
      lifts: string
      gain: string
      travel: string
      flow: string
      narrow: string
      speedWide: string
      speedNarrow: string
      drop: string
      level: string
      hole: string
      speed: string
      range: string
      best: string
      submerged: string
      floats: string
      sinks: string
      feels: string
      reynolds: string
      regime: string
      friction: string
      diameter: string
      length: string
      loss: string
      left: string
      crest: string
      fall: string
      crestPressure: string
      limit: string
      runs: string
      broken: string
      closing: string
      surge: string
      critical: string
      peak: string
      close: string
      pressure: string
      valve: string
      water: string
      electric: string
    }
  }
  machines: {
    intro: string
    lift: {
      title: string
      text: string
      up: string
      hold: string
      down: string
      load: string
      bore: string
      pump: string
      relief: string
      needed: string
      speed: string
      max: string
      power: string
      heat: string
      status: { rising: string; holding: string; lowering: string; stalled: string; top: string; bottom: string }
      parts: { tank: string; pump: string; relief: string; valve: string; cylinder: string }
      lesson: string
    }
    brakes: {
      title: string
      text: string
      pedal: string
      ratio: string
      master: string
      caliper: string
      booster: string
      line: string
      clamp: string
      gain: string
      parts: { pedal: string; master: string; caliper: string }
      lesson: string
    }
  }
  city: {
    intro: string
    people: string
    pumpRate: string
    volume: string
    height: string
    pump: string
    pumpModes: Record<PumpMode, string>
    hour: string
    level: string
    demand: string
    pumping: string
    used: string
    kwh: string
    tower: string
    houses: Record<HouseId, string>
    noWater: string
    status: { ok: string; empty: string; spill: string; low: string }
    lesson: string
  }
}
