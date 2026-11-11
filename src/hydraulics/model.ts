/*
 * The Hydraulics Lab's physics and models, in SI units: the laws of still and
 * moving fluids, a small pipe-network solver (the water version of the circuit
 * solver), the plumbing of a building, an oil-hydraulic lift and brakes, and
 * a day in the life of a town's water tower.
 * Simplified on purpose: they show how things behave, not exact figures.
 */

export const G = 9.81
/** The air's pressure at sea level, Pa. */
export const ATM = 101_325
export const BAR = 100_000
/** Water boils at this absolute pressure at 20 °C, Pa: a siphon cannot pull lower. */
export const VAPOUR = 2_340

export const FLUID_IDS = ['water', 'sea', 'brine', 'oil', 'honey', 'mercury'] as const
export type FluidId = (typeof FLUID_IDS)[number]
/** Density (kg/m³) and viscosity (Pa·s) near room temperature. */
export const FLUIDS: Record<FluidId, { rho: number; mu: number; color: string }> = {
  water: { rho: 998, mu: 0.001, color: '#0ea5e9' },
  sea: { rho: 1025, mu: 0.00108, color: '#0284c7' },
  brine: { rho: 1240, mu: 0.002, color: '#0891b2' },
  oil: { rho: 870, mu: 0.04, color: '#d4a017' },
  honey: { rho: 1420, mu: 6, color: '#d97706' },
  mercury: { rho: 13_546, mu: 0.00153, color: '#94a3b8' },
}
const WATER = FLUIDS.water.rho

/** The area of a round pipe or piston of diameter `d` (m). */
export const area = (d: number) => (Math.PI * d * d) / 4
/** m³/s → L/min, and back. */
export const lpm = (q: number) => q * 60_000
export const fromLpm = (l: number) => l / 60_000
/** A height of water (m) as a pressure in bar. */
export const headToBar = (m: number, rho = WATER) => (rho * G * m) / BAR

/* ───────────────────────── still fluids ───────────────────────── */

/** Pressure `depth` metres under a free surface: what the fluid adds, and the total with the air above. */
export function depthPressure(rho: number, depth: number) {
  const gauge = rho * G * depth
  return { gauge, absolute: gauge + ATM }
}

/** Pascal's law in a jack: a push on the small piston becomes the same pressure under the large one. */
export function jack(force: number, small: number, large: number) {
  const pressure = force / area(small)
  const gain = (large / small) ** 2
  return { pressure, force: pressure * area(large), gain }
}

/** Archimedes: how much of a body sits under the surface, and whether it floats. */
export function float(body: number, fluid: number) {
  return { floats: body < fluid, submerged: Math.min(1, body / fluid), apparent: Math.max(0, 1 - fluid / body) }
}

/* ───────────────────────── moving fluids ───────────────────────── */

/** Continuity and Bernoulli in a pipe that narrows from `d1` to `d2`: speeds, and the pressure that drops in the throat. */
export function venturi(q: number, d1: number, d2: number, rho = WATER) {
  const v1 = q / area(d1)
  const v2 = q / area(d2)
  return { v1, v2, drop: (rho / 2) * (v2 * v2 - v1 * v1) }
}

/** Torricelli: the speed of a jet leaving a hole `head` metres under the surface. */
export const torricelli = (head: number) => Math.sqrt(2 * G * Math.max(0, head))

/** A jet from a hole at height `hole` in a tank filled to `level` (both above the ground): speed, and where it lands. */
export function jet(level: number, hole: number) {
  const speed = torricelli(level - hole)
  return { speed, range: speed * Math.sqrt((2 * hole) / G) }
}

export const reynolds = (rho: number, v: number, d: number, mu: number) => (rho * v * d) / mu

export type Regime = 'laminar' | 'transitional' | 'turbulent'
export const regimeOf = (re: number): Regime => (re < 2300 ? 'laminar' : re < 4000 ? 'transitional' : 'turbulent')

/** The Darcy friction factor: 64/Re when laminar, Swamee–Jain when turbulent, blended in between. */
export function frictionFactor(re: number, roughness = 0) {
  if (re <= 0) return 0
  const rough = (r: number) => 0.25 / Math.log10(roughness / 3.7 + 5.74 / r ** 0.9) ** 2
  if (re < 2300) return 64 / re
  if (re >= 4000) return rough(re)
  const mix = (re - 2300) / 1700
  return (64 / 2300) * (1 - mix) + rough(4000) * mix
}

/** Darcy–Weisbach: what `length` metres of pipe of diameter `d` cost a flow `q`. `rough` is the wall's roughness in metres. */
export function pipeLoss(q: number, d: number, length: number, fluid: { rho: number; mu: number } = FLUIDS.water, rough = 1.5e-6) {
  const v = q / area(d)
  const re = reynolds(fluid.rho, v, d, fluid.mu)
  const f = frictionFactor(re, rough / d)
  const head = (f * (length / d) * v * v) / (2 * G)
  return { v, re, f, head, drop: fluid.rho * G * head }
}

/** A siphon lifting water `crest` metres over a wall and letting it out `fall` metres below the surface. */
export function siphon(crest: number, fall: number, rho = WATER) {
  const speed = torricelli(fall)
  const crestPressure = ATM - rho * G * crest - (rho / 2) * speed * speed
  const works = fall > 0 && crestPressure > VAPOUR
  return { works, speed: works ? speed : 0, crestPressure: Math.max(VAPOUR, crestPressure), limit: (ATM - VAPOUR) / (rho * G) }
}

/** The speed of a pressure wave in water inside a household pipe, m/s. */
export const WAVE_SPEED = 1200

/** Water hammer (Joukowsky): the pressure jump when a flow of speed `v` is stopped in `closeTime` seconds. */
export function hammer(v: number, length: number, closeTime: number, rho = WATER, c = WAVE_SPEED) {
  const critical = (2 * length) / c
  return { critical, surge: rho * c * v * Math.min(1, critical / Math.max(closeTime, 1e-6)) }
}

/* ───────────────────────── the pipe-network solver ─────────────────────────
 * Nodes hold a head (metres of water: pressure plus height). A link loses
 * head with the square of its flow, h = k·Q·|Q|; a pump link adds `lift` first
 * and only lets water through one way. Like the circuit solver, it finds the
 * heads at which what flows into every junction also flows out. */

export type Link = { from: string; to: string; k: number; lift?: number }

/** The k of a pipe (s²/m⁵) of diameter `d` and `length`, for a fixed friction factor. */
export const pipeK = (d: number, length: number, f = 0.025) => (8 * f * length) / (Math.PI ** 2 * G * d ** 5)

/** Solves a network: `fixed` are the heads of tanks and open outlets. Returns every head and the flow of each link (m³/s, from → to). */
export function solveNet(fixed: Record<string, number>, links: Link[]) {
  const free = [...new Set(links.flatMap((l) => [l.from, l.to]))].filter((n) => !(n in fixed))
  const at = new Map(free.map((n, i) => [n, i]))
  const n = free.length
  const head: Record<string, number> = { ...fixed }
  for (const name of free) head[name] = 0
  let flow = links.map(() => 1e-4)
  const shut = links.map(() => false)

  for (let round = 0; round < 300; round++) {
    // each link as a conductance around its present flow (the linear-theory method)
    const g = links.map((l, i) => (shut[i] ? 0 : 1 / (l.k * Math.max(Math.abs(flow[i]), 1e-9))))
    const m = Array.from({ length: n }, () => Array.from({ length: n + 1 }, () => 0))
    for (let i = 0; i < n; i++) m[i][i] = 1e-12
    links.forEach((l, i) => {
      const a = at.get(l.from)
      const b = at.get(l.to)
      const lift = l.lift ?? 0
      if (a !== undefined) {
        m[a][a] += g[i]
        if (b !== undefined) m[a][b] -= g[i]
        else m[a][n] += g[i] * fixed[l.to]
        m[a][n] -= g[i] * lift
      }
      if (b !== undefined) {
        m[b][b] += g[i]
        if (a !== undefined) m[b][a] -= g[i]
        else m[b][n] += g[i] * fixed[l.from]
        m[b][n] += g[i] * lift
      }
    })
    // Gaussian elimination with pivoting
    for (let col = 0; col < n; col++) {
      let pivot = col
      for (let row = col + 1; row < n; row++) if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row
      ;[m[col], m[pivot]] = [m[pivot], m[col]]
      for (let row = col + 1; row < n; row++) {
        const factor = m[row][col] / m[col][col]
        if (factor) for (let k = col; k <= n; k++) m[row][k] -= factor * m[col][k]
      }
    }
    for (let row = n - 1; row >= 0; row--) {
      let sum = m[row][n]
      for (let k = row + 1; k < n; k++) sum -= m[row][k] * head[free[k]]
      head[free[row]] = sum / m[row][row]
    }
    let change = 0
    flow = links.map((l, i) => {
      const drive = head[l.from] + (l.lift ?? 0) - head[l.to]
      if (l.lift !== undefined) {
        // a pump's check valve
        const closed = drive < 0
        if (closed !== shut[i]) change = 1
        shut[i] = closed
        if (closed) return 1e-4
      }
      const next = (flow[i] + g[i] * drive) / 2
      change = Math.max(change, Math.abs(next - flow[i]))
      return next
    })
    if (change < 1e-11) break
  }
  return { head, flow: flow.map((q, i) => (shut[i] || Math.abs(q) < 1e-8 ? 0 : q)) }
}

/* ───────────────────────── the water of a building ───────────────────────── */

export const FLOORS = 4
export const FLOOR_M = 3
/** Taps sit about a metre above their floor. */
const tapHeight = (floor: number) => floor * FLOOR_M + 1

export const FIXTURE_IDS = ['shower', 'tap', 'washer'] as const
export type FixtureId = (typeof FIXTURE_IDS)[number]
/** What each outlet gives, L/min, with a comfortable 2 bar behind it. */
export const FIXTURE_LPM: Record<FixtureId | 'hose', number> = { shower: 12, tap: 9, washer: 10, hose: 18 }
const NOMINAL_HEAD = (2 * BAR) / (WATER * G)

export const SOURCE_IDS = ['city', 'roof', 'pump'] as const
export type SourceId = (typeof SOURCE_IDS)[number]
/** Inner diameters of the building's main pipe, mm. */
export const PIPE_MM = [16, 20, 25, 32]
/** The roof tank's water surface, metres above the ground. */
export const ROOF_TANK_M = FLOORS * FLOOR_M + 2.5
/** The booster pump: head with no flow, and its curve (head falls with Q²). */
const PUMP = { lift: 42, k: 2e7 }

export type Outlet = `${number}:${FixtureId}` | 'hose'
export type Comfort = 'good' | 'weak' | 'trickle' | 'dry'

const kindOf = (outlet: Outlet) => (outlet === 'hose' ? 'hose' : (outlet.split(':')[1] as FixtureId))
const floorOf = (outlet: Outlet) => (outlet === 'hose' ? 0 : Number(outlet.split(':')[0]))

const comfortOf = (flow: number, nominal: number): Comfort => {
  const share = flow / nominal
  return share >= 0.75 ? 'good' : share >= 0.4 ? 'weak' : share > 0.03 ? 'trickle' : 'dry'
}

/** The building with these outlets open: pressure on every floor and what each outlet gives. */
export function homeWater({ source, cityBar, pipeMm, open }: { source: SourceId; cityBar: number; pipeMm: number; open: Outlet[] }) {
  const d = pipeMm / 1000
  const fixed: Record<string, number> = {}
  const links: Link[] = []
  if (source === 'city') {
    fixed.src = (cityBar * BAR) / (WATER * G)
    links.push({ from: 'src', to: 'f0', k: pipeK(d, 20) })
  } else if (source === 'roof') {
    fixed.src = ROOF_TANK_M
    links.push({ from: 'src', to: `f${FLOORS - 1}`, k: pipeK(d, 4) })
  } else {
    fixed.src = 0.5
    links.push({ from: 'src', to: 'f0', k: PUMP.k + pipeK(d, 5), lift: PUMP.lift })
  }
  for (let f = 0; f < FLOORS - 1; f++) links.push({ from: `f${f}`, to: `f${f + 1}`, k: pipeK(d, FLOOR_M) })
  const first = links.length
  for (const outlet of open) {
    const floor = floorOf(outlet)
    fixed[`air${floor}`] = tapHeight(floor)
    links.push({ from: `f${floor}`, to: `air${floor}`, k: NOMINAL_HEAD / fromLpm(FIXTURE_LPM[kindOf(outlet)]) ** 2 })
  }
  const { head, flow } = solveNet(fixed, links)
  const outlets: Partial<Record<Outlet, { lpm: number; comfort: Comfort }>> = {}
  open.forEach((outlet, i) => {
    const give = Math.max(0, lpm(flow[first + i]))
    outlets[outlet] = { lpm: give, comfort: comfortOf(give, FIXTURE_LPM[kindOf(outlet)]) }
  })
  return {
    /** gauge pressure at tap height on each floor, bar */
    bar: Array.from({ length: FLOORS }, (_, f) => Math.max(0, headToBar(head[`f${f}`] - tapHeight(f)))),
    /** flow in each stretch of the main pipe, L/min: [supply, f0→f1, f1→f2, f2→f3] (negative: downwards) */
    riser: links.slice(0, first).map((_, i) => lpm(flow[i])),
    outlets,
    total: open.reduce((sum, o) => sum + (outlets[o]?.lpm ?? 0), 0),
  }
}

/* ───────────────────────── oil hydraulics ───────────────────────── */

/** A pump pushing oil under a piston that carries a load: the pressure it takes, and how fast it goes. */
export function cylinder({ boreMm, loadKg, pumpLpm, reliefBar }: { boreMm: number; loadKg: number; pumpLpm: number; reliefBar: number }) {
  const cap = area(boreMm / 1000)
  const q = fromLpm(pumpLpm)
  const neededBar = (loadKg * G) / cap / BAR
  const lifts = neededBar < reliefBar
  return {
    neededBar,
    lifts,
    /** the heaviest load the relief valve allows, kg */
    maxKg: (reliefBar * BAR * cap) / G,
    /** piston speed, m/s */
    speed: lifts ? q / cap : 0,
    /** power going into the load, kW */
    powerKw: lifts ? (neededBar * BAR * q) / 1000 : 0,
    /** power turned to heat over the relief valve when the load is too heavy, kW */
    heatKw: lifts ? 0 : (reliefBar * BAR * q) / 1000,
  }
}

/** A car's brakes: foot → pedal lever → (booster) → master cylinder → the same pressure in every caliper. */
export function brakes({ pedalN, ratio, masterMm, caliperMm, booster }: { pedalN: number; ratio: number; masterMm: number; caliperMm: number; booster: boolean }) {
  const push = pedalN * ratio * (booster ? 4 : 1)
  const pressure = push / area(masterMm / 1000)
  const clamp = pressure * area(caliperMm / 1000)
  return { bar: pressure / BAR, clamp, gain: clamp / pedalN }
}

/* ───────────────────────── a town's water tower ───────────────────────── */

/** How a town's water use moves through a day, as a share of its average (a morning and an evening peak). */
const SHAPE = [0.35, 0.28, 0.25, 0.25, 0.3, 0.55, 1.15, 1.7, 1.55, 1.25, 1.1, 1.05, 1.15, 1.1, 1, 0.95, 1, 1.2, 1.55, 1.75, 1.6, 1.25, 0.85, 0.55]
export const USE_SHAPE = SHAPE.map((s) => (s * SHAPE.length) / SHAPE.reduce((a, b) => a + b, 0))
/** Each person uses about this much a day, m³. */
export const PERSON_M3 = 0.2
/** The water in the tower's bowl is this deep when full, m. */
export const BOWL_M = 6
export const HOUSE_IDS = ['valley', 'mid', 'hill'] as const
export type HouseId = (typeof HOUSE_IDS)[number]
/** How high each house stands above the foot of the tower, m. */
export const HOUSE_M: Record<HouseId, number> = { valley: 0, mid: 12, hill: 26 }
export const PUMP_MODES = ['always', 'night', 'auto'] as const
export type PumpMode = (typeof PUMP_MODES)[number]

export type TowerHour = {
  hour: number
  demand: number
  pump: number
  /** how full the tower is at the end of the hour, 0…1 */
  level: number
  shortage: number
  spill: number
  bar: Record<HouseId, number>
}

/** A day of a town fed by a water tower: the pump fills it, people empty it, and its height is the pressure in every tap. */
export function towerDay({ people, pumpM3h, volumeM3, heightM, mode }: { people: number; pumpM3h: number; volumeM3: number; heightM: number; mode: PumpMode }) {
  const average = (people * PERSON_M3) / 24
  const steps = 6
  const peak = Math.max(...USE_SHAPE)
  let stored = volumeM3 * 0.5
  let running = mode !== 'auto'
  let day: TowerHour[] = []
  // a few days, so that the day shown starts where the day before ended
  for (let pass = 0; pass < 4; pass++) {
    day = USE_SHAPE.map((share, hour) => {
      const demand = average * share
      let pump = 0
      let shortage = 0
      let spill = 0
      for (let s = 0; s < steps; s++) {
        if (mode === 'always') running = true
        else if (mode === 'night') running = hour >= 22 || hour < 6
        else if (stored < volumeM3 * 0.35) running = true
        else if (stored > volumeM3 * 0.95) running = false
        const into = running ? pumpM3h / steps : 0
        pump += into
        stored += into - demand / steps
        if (stored > volumeM3) {
          spill += stored - volumeM3
          stored = volumeM3
        }
        if (stored < 0) {
          shortage -= stored
          stored = 0
        }
      }
      const level = stored / volumeM3
      // the pipes in the streets lose more when everyone draws at once
      const loss = 9 * (share / peak) ** 2
      const bar = Object.fromEntries(
        HOUSE_IDS.map((id) => [id, shortage > 0 ? 0 : Math.max(0, headToBar(heightM + BOWL_M * level - HOUSE_M[id] - loss))]),
      ) as Record<HouseId, number>
      return { hour, demand, pump, level, shortage, spill, bar }
    })
  }
  const pumped = day.reduce((sum, h) => sum + h.pump, 0)
  return {
    day,
    average,
    /** electricity to lift a day's water into the tower (pump 70% efficient), kWh */
    kwh: (WATER * G * pumped * (heightM + BOWL_M)) / 0.7 / 3.6e6,
    shortage: day.reduce((sum, h) => sum + h.shortage, 0),
    spill: day.reduce((sum, h) => sum + h.spill, 0),
  }
}
