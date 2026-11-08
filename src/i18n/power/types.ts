import type { ApplianceId, CircuitId, PlantId } from '@/power/model'

export type PowerMode = 'grid' | 'basics' | 'plants' | 'home'
export type StageId = 'plant' | 'stepUp' | 'line' | 'substation' | 'distribution' | 'pole' | 'house'
export type BasicCardId = 'ac' | 'generator' | 'ohm' | 'pf' | 'threePhase' | 'transformer'

/** Every word of the Power Lab, in one language. Units (kV, MW, Hz) stay as written. */
export type PowerBook = {
  title: string
  modes: Record<PowerMode, string>
  why: string
  model: string
  grid: {
    intro: string
    stages: Record<StageId, { name: string; text: string }>
    power: string
    voltage: string
    length: string
    current: string
    loss: string
    drop: string
    delivered: string
    workable: string
    unworkable: string
    chartTitle: string
    lesson: string
  }
  basics: {
    cards: Record<BasicCardId, { title: string; law: string; text: string; why: string }>
    labels: {
      frequency: string
      rms: string
      peak: string
      period: string
      speed: string
      poles: string
      voltage: string
      current: string
      resistance: string
      power: string
      angle: string
      resistive: string
      inductive: string
      capacitive: string
      real: string
      reactive: string
      apparent: string
      pf: string
      phase: string
      line: string
      primary: string
      secondary: string
      turns: string
    }
  }
  plants: {
    intro: string
    names: Record<PlantId, string>
    capacity: string
    hour: string
    demand: string
    frequency: string
    co2: string
    renewable: string
    sunny: string
    cloudy: string
    windy: string
    calm: string
    status: { ok: string; shedding: string; low: string; curtail: string }
    presets: { gas: string; clean: string; fossil: string }
    lesson: string
  }
  home: {
    intro: string
    appliances: Record<ApplianceId, string>
    circuits: Record<CircuitId, string>
    main: string
    panel: string
    tripped: string
    ok: string
    total: string
    kwhDay: string
    kwhMonth: string
    mainTripped: string
    safety: {
      title: string
      text: string
      earth: string
      rcd: string
      wet: string
      touch: string
      outcomes: { earth: string; rcd: string; pain: string; danger: string }
      levels: [string, string, string, string, string, string]
    }
  }
}
