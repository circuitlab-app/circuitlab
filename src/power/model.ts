/*
 * The Power Lab's physics and models, in SI units: carrying power over
 * lines (why the voltage is raised), AC and three-phase, the transformer and
 * the generator, a day of balancing a grid, and the circuits of a house.
 * Simplified on purpose: they show how things behave, not exact figures.
 */

export const SQRT3 = Math.sqrt(3)

/* ───────────────────────── transmission ───────────────────────── */

/** Common line voltages, kV: distribution (20) up to extra-high voltage (765). */
export const LINE_KV = [20, 63, 132, 230, 400, 765]
/** One phase conductor's resistance, Ω per km (a typical aluminium-steel line). */
export const OHM_PER_KM = 0.05

/** The current in each phase of a three-phase line carrying `mw` at `kv` (line to line). */
export const lineAmps = (mw: number, kv: number, pf = 0.9) => (mw * 1e6) / (SQRT3 * kv * 1e3 * pf)

/** Carrying `mw` over `km` of line at `kv`: current, I²R loss and voltage drop. */
export function transmission(mw: number, kv: number, km: number, pf = 0.9) {
  const amps = lineAmps(mw, kv, pf)
  const ohms = OHM_PER_KM * km
  const lossMw = (3 * amps ** 2 * ohms) / 1e6
  const dropKv = (SQRT3 * amps * ohms) / 1e3
  return {
    amps,
    lossMw,
    lossShare: lossMw / mw,
    dropShare: dropKv / kv,
    /** a real line is not run with a third of its power lost or a fifth of its voltage gone */
    workable: lossMw / mw < 0.3 && dropKv / kv < 0.2,
  }
}

/* ───────────────────────── AC, three-phase, machines ───────────────────────── */

export const peakOf = (rms: number) => rms * Math.SQRT2

/** A generator's frequency from its speed (rpm) and number of poles. */
export const generatorHz = (rpm: number, poles: number) => (rpm * poles) / 120

/** Real (W), reactive (var) and apparent (VA) power, and the power factor, for a phase angle φ. */
export function acPower(volts: number, amps: number, phiDegrees: number) {
  const phi = (phiDegrees * Math.PI) / 180
  const s = volts * amps
  return { p: s * Math.cos(phi), q: s * Math.sin(phi), s, pf: Math.cos(phi) }
}

/** Line-to-line voltage of a three-phase supply from its phase voltage (230 V → 400 V). */
export const lineVoltage = (phaseVolts: number) => phaseVolts * SQRT3

/** An ideal transformer: the voltage follows the turns, the current the other way, the power stays. */
export function transformer(v1: number, i1: number, n1: number, n2: number) {
  return { v2: (v1 * n2) / n1, i2: (i1 * n1) / n2 }
}

/* ───────────────────────── a day on the grid ───────────────────────── */

export type PlantId = 'nuclear' | 'coal' | 'gas' | 'hydro' | 'wind' | 'solar' | 'battery'
export const PLANT_IDS: PlantId[] = ['nuclear', 'coal', 'gas', 'hydro', 'wind', 'solar', 'battery']

/** CO₂ per kWh (life-cycle, rounded) and the colour of each kind of plant. */
export const PLANTS: Record<PlantId, { co2: number; color: string }> = {
  nuclear: { co2: 12, color: '#a855f7' },
  coal: { co2: 950, color: '#57534e' },
  gas: { co2: 450, color: '#f97316' },
  hydro: { co2: 24, color: '#0ea5e9' },
  wind: { co2: 11, color: '#10b981' },
  solar: { co2: 40, color: '#eab308' },
  battery: { co2: 0, color: '#ec4899' },
}

/** A city's demand over a day, MW: low at night, a morning rise and an evening peak. */
export const DEMAND = [620, 590, 570, 560, 570, 610, 690, 780, 840, 860, 870, 880, 890, 880, 870, 860, 880, 930, 990, 1010, 980, 900, 800, 700]

/** How much of its capacity a solar farm gives at each hour (0–1). */
export const solarShape = (hour: number, sunny: boolean) =>
  Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI)) * (sunny ? 0.85 : 0.3)

/** Wind is stronger at night here, with gusts; calm days give little. */
export const windShape = (hour: number, windy: boolean) =>
  (windy ? 0.55 : 0.12) * (1 + 0.35 * Math.cos(((hour - 3) / 24) * 2 * Math.PI) + 0.12 * Math.sin(hour * 1.7))

export type Mix = Record<PlantId, number>

export type Hour = {
  hour: number
  demand: number
  out: Mix
  /** surplus stored in the battery */
  charge: number
  curtailed: number
  /** demand that could not be met: those homes are cut off */
  shortage: number
  frequency: number
  /** g of CO₂ per kWh delivered */
  co2: number
  /** battery energy stored at the end of the hour, MWh */
  stored: number
}

/** Hours of storage behind each MW of battery. */
export const BATTERY_HOURS = 4

/**
 * Runs one day hour by hour. Nuclear, sun and wind come first (they cost
 * least to run); a surplus charges the battery or is curtailed; what is
 * still missing comes from hydro, the battery, then coal and gas. Any gap
 * left pulls the frequency below 50 Hz, and below 49 Hz homes are cut off.
 */
export function dispatchDay(cap: Mix, weather: { sunny: boolean; windy: boolean }, demandScale = 1): Hour[] {
  let stored = (cap.battery * BATTERY_HOURS) / 2
  return DEMAND.map((base, hour) => {
    const demand = base * demandScale
    const out: Mix = { nuclear: 0, coal: 0, gas: 0, hydro: 0, wind: 0, solar: 0, battery: 0 }
    out.nuclear = cap.nuclear * 0.92
    out.solar = cap.solar * solarShape(hour, weather.sunny)
    out.wind = cap.wind * windShape(hour, weather.windy)
    let gap = demand - out.nuclear - out.solar - out.wind
    let charge = 0
    let curtailed = 0
    if (gap < 0) {
      charge = Math.min(-gap, cap.battery, cap.battery * BATTERY_HOURS - stored)
      stored += charge * 0.9
      curtailed = -gap - charge
      // what cannot be stored is switched off: sun and wind first, then nuclear turns down
      let cut = curtailed
      for (const id of ['solar', 'wind', 'nuclear'] as const) {
        const take = Math.min(out[id], cut)
        out[id] -= take
        cut -= take
      }
      gap = 0
    }
    for (const id of ['hydro', 'battery', 'coal', 'gas'] as const) {
      if (gap <= 0) break
      const can = id === 'battery' ? Math.min(cap.battery, stored) : cap[id]
      const take = Math.min(can, gap)
      out[id] = take
      if (id === 'battery') stored -= take
      gap -= take
    }
    const shortage = Math.max(0, gap)
    const served = demand - shortage
    const co2 = served > 0 ? PLANT_IDS.reduce((sum, id) => sum + out[id] * PLANTS[id].co2, 0) / served : 0
    return { hour, demand, out, charge, curtailed, shortage, frequency: 50 - 25 * (shortage / demand), co2, stored }
  })
}

/** Below this frequency, the grid starts cutting off areas to save itself. */
export const SHEDDING_HZ = 49

/* ───────────────────────── a house ───────────────────────── */

export type CircuitId = 'lights' | 'sockets' | 'kitchen' | 'cooling' | 'heater' | 'ev'
export type ApplianceId = 'lights' | 'tv' | 'fridge' | 'kettle' | 'microwave' | 'washer' | 'iron' | 'ac' | 'heater' | 'ev'

export const MAINS_VOLTS = 230
export const MAIN_AMPS = 40

/** Each circuit's breaker (A) and wire (mm²). */
export const CIRCUITS: Record<CircuitId, { amps: number; mm2: number }> = {
  lights: { amps: 10, mm2: 1.5 },
  sockets: { amps: 16, mm2: 2.5 },
  kitchen: { amps: 20, mm2: 2.5 },
  cooling: { amps: 16, mm2: 2.5 },
  heater: { amps: 16, mm2: 2.5 },
  ev: { amps: 32, mm2: 6 },
}

export const APPLIANCES: Record<ApplianceId, { watts: number; circuit: CircuitId; hours: number }> = {
  lights: { watts: 100, circuit: 'lights', hours: 5 },
  tv: { watts: 120, circuit: 'sockets', hours: 4 },
  fridge: { watts: 150, circuit: 'kitchen', hours: 10 },
  kettle: { watts: 2000, circuit: 'kitchen', hours: 0.25 },
  microwave: { watts: 1200, circuit: 'kitchen', hours: 0.3 },
  washer: { watts: 2200, circuit: 'sockets', hours: 1 },
  iron: { watts: 2400, circuit: 'sockets', hours: 0.3 },
  ac: { watts: 2500, circuit: 'cooling', hours: 8 },
  heater: { watts: 3000, circuit: 'heater', hours: 2 },
  ev: { watts: 7000, circuit: 'ev', hours: 3 },
}

export const APPLIANCE_IDS = Object.keys(APPLIANCES) as ApplianceId[]
export const CIRCUIT_IDS = Object.keys(CIRCUITS) as CircuitId[]

/** What the panel does with these appliances on: each breaker, the main switch, and the day's energy. */
export function house(on: ApplianceId[]) {
  const circuits = Object.fromEntries(
    CIRCUIT_IDS.map((id) => {
      const amps = on.filter((a) => APPLIANCES[a].circuit === id).reduce((sum, a) => sum + APPLIANCES[a].watts / MAINS_VOLTS, 0)
      return [id, { amps, tripped: amps > CIRCUITS[id].amps }]
    }),
  ) as Record<CircuitId, { amps: number; tripped: boolean }>
  const total = CIRCUIT_IDS.reduce((sum, id) => sum + (circuits[id].tripped ? 0 : circuits[id].amps), 0)
  const mainTripped = total > MAIN_AMPS
  const kwhDay = on.reduce((sum, a) => sum + (APPLIANCES[a].watts * APPLIANCES[a].hours) / 1000, 0)
  return { circuits, total, mainTripped, kwhDay }
}

/** What a current through the body does, mA (AC, 50 Hz). */
export const SHOCK_MA = [1, 5, 10, 30, 50, 100] as const

/**
 * Touching an appliance whose metal case has become live: with an earth wire
 * the fault trips the breaker at once; without it the current goes through
 * the person, and an RCD cuts it off at 30 mA.
 */
export function touch(o: { earth: boolean; rcd: boolean; wet: boolean }) {
  const bodyOhms = 1000
  const floorOhms = o.wet ? 200 : 3000
  const bodyMa = (MAINS_VOLTS / (bodyOhms + floorOhms)) * 1000
  if (o.earth) return { bodyMa: 0, outcome: 'earth' as const }
  if (o.rcd) return { bodyMa, outcome: 'rcd' as const }
  return { bodyMa, outcome: bodyMa >= 50 ? ('danger' as const) : ('pain' as const) }
}
