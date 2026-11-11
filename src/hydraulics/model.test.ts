import { describe, expect, it } from 'vitest'
import {
  ATM,
  brakes,
  cylinder,
  depthPressure,
  FIXTURE_LPM,
  float,
  frictionFactor,
  fromLpm,
  hammer,
  homeWater,
  jack,
  jet,
  lpm,
  pipeK,
  pipeLoss,
  regimeOf,
  siphon,
  solveNet,
  torricelli,
  towerDay,
  USE_SHAPE,
  venturi,
  type Outlet,
} from './model'

describe('the hydraulics lab: laws', () => {
  it('pressure grows with depth: about one more atmosphere every 10 m of water', () => {
    const p = depthPressure(998, 10.35)
    expect(p.gauge / ATM).toBeCloseTo(1, 2)
    expect(p.absolute / ATM).toBeCloseTo(2, 2)
  })

  it("Pascal's jack multiplies force by the ratio of the areas", () => {
    const j = jack(200, 0.02, 0.2)
    expect(j.gain).toBeCloseTo(100, 6)
    expect(j.force).toBeCloseTo(20_000, 3)
  })

  it('Archimedes: ice floats nine tenths under, steel sinks in water and floats on mercury', () => {
    expect(float(917, 998).submerged).toBeCloseTo(0.92, 2)
    expect(float(917, 998).floats).toBe(true)
    expect(float(7850, 998).floats).toBe(false)
    expect(float(7850, 13_546).floats).toBe(true)
  })

  it('a narrower pipe is faster and its pressure lower', () => {
    const v = venturi(fromLpm(30), 0.04, 0.02)
    expect(v.v2 / v.v1).toBeCloseTo(4, 6)
    expect(v.drop).toBeCloseTo((998 / 2) * (v.v2 ** 2 - v.v1 ** 2), 6)
    expect(v.drop).toBeGreaterThan(0)
  })

  it('Torricelli: a jet goes farthest from a hole at half the height', () => {
    expect(torricelli(5)).toBeCloseTo(9.9, 1)
    expect(jet(2, 1).range).toBeCloseTo(2, 6)
    expect(jet(2, 1).range).toBeGreaterThan(jet(2, 0.5).range)
    expect(jet(2, 0.5).range).toBeCloseTo(jet(2, 1.5).range, 6)
  })

  it('friction: laminar is 64/Re, and halving the diameter costs about 2⁵ times the head', () => {
    expect(frictionFactor(1000)).toBeCloseTo(0.064, 6)
    expect(regimeOf(1000)).toBe('laminar')
    expect(regimeOf(50_000)).toBe('turbulent')
    expect(frictionFactor(1e5)).toBeCloseTo(0.018, 2)
    const wide = pipeLoss(fromLpm(20), 0.02, 30)
    const narrow = pipeLoss(fromLpm(20), 0.01, 30)
    expect(narrow.head / wide.head).toBeGreaterThan(25)
    expect(narrow.head / wide.head).toBeLessThan(32)
  })

  it('a siphon stops near 10 m, and a fast-closed valve hammers', () => {
    expect(siphon(2, 1).works).toBe(true)
    expect(siphon(2, 1).speed).toBeCloseTo(4.43, 2)
    expect(siphon(11, 1).works).toBe(false)
    expect(siphon(2, 1).limit).toBeCloseTo(10.1, 1)
    const fast = hammer(2, 30, 0.01)
    expect(fast.surge / 1e5).toBeCloseTo(23.95, 1)
    expect(hammer(2, 30, 1).surge).toBeCloseTo(fast.surge * 0.05, 3)
  })
})

describe('the hydraulics lab: the pipe network', () => {
  it('one pipe between two tanks carries √(Δh / k)', () => {
    const { flow } = solveNet({ a: 10, b: 2 }, [{ from: 'a', to: 'b', k: 2e6 }])
    expect(flow[0]).toBeCloseTo(Math.sqrt(8 / 2e6), 9)
  })

  it('what flows into a junction flows out, and each pipe obeys h = k·Q²', () => {
    const links = [
      { from: 'tank', to: 'j', k: 1e6 },
      { from: 'j', to: 'out1', k: 4e6 },
      { from: 'j', to: 'out2', k: 9e6 },
    ]
    const { head, flow } = solveNet({ tank: 20, out1: 0, out2: 3 }, links)
    expect(flow[0]).toBeCloseTo(flow[1] + flow[2], 9)
    links.forEach((l, i) => expect(head[l.from] - head[l.to]).toBeCloseTo(l.k * flow[i] ** 2, 5))
  })

  it('a pump works where its curve meets the pipe, and never lets water back', () => {
    const { flow } = solveNet({ low: 0, high: 10 }, [{ from: 'low', to: 'high', k: 2e7, lift: 40 }])
    expect(flow[0]).toBeCloseTo(Math.sqrt(30 / 2e7), 9)
    expect(solveNet({ low: 0, high: 50 }, [{ from: 'low', to: 'high', k: 2e7, lift: 40 }]).flow[0]).toBe(0)
  })

  it('a building: upper floors get less, and one more open tap weakens the others', () => {
    const base = { source: 'city' as const, cityBar: 3, pipeMm: 16 }
    const still = homeWater({ ...base, open: [] })
    expect(still.bar[0]).toBeCloseTo(2.9, 1)
    expect(still.bar[0] - still.bar[3]).toBeCloseTo(0.88, 2)
    const alone = homeWater({ ...base, open: ['3:shower'] })
    const busy = homeWater({ ...base, open: ['3:shower', '0:tap', '1:washer', 'hose'] })
    expect(alone.outlets['3:shower']!.lpm).toBeGreaterThan(busy.outlets['3:shower']!.lpm * 1.3)
    expect(busy.total).toBeCloseTo(busy.riser[0], 4)
    // a wider main pipe keeps the shower strong
    const wide = homeWater({ ...base, pipeMm: 32, open: ['3:shower', '0:tap', '1:washer', 'hose'] })
    expect(wide.outlets['3:shower']!.lpm).toBeGreaterThan(busy.outlets['3:shower']!.lpm * 1.5)
  })

  it('a roof tank gives the top floor a weak shower; a pump fixes it', () => {
    const open: Outlet[] = ['3:shower', '0:shower']
    const roof = homeWater({ source: 'roof', cityBar: 3, pipeMm: 25, open })
    expect(roof.outlets['3:shower']!.comfort).toBe('weak')
    expect(roof.outlets['0:shower']!.lpm).toBeGreaterThan(roof.outlets['3:shower']!.lpm * 1.4)
    const pump = homeWater({ source: 'pump', cityBar: 3, pipeMm: 25, open })
    expect(pump.outlets['3:shower']!.comfort).toBe('good')
    expect(pump.outlets['3:shower']!.lpm).toBeGreaterThan(FIXTURE_LPM.shower)
  })

  it('pipeK matches Darcy–Weisbach', () => {
    const q = fromLpm(20)
    const v = q / ((Math.PI * 0.02 ** 2) / 4)
    expect(pipeK(0.02, 10, 0.025) * q * q).toBeCloseTo((0.025 * (10 / 0.02) * v * v) / (2 * 9.81), 6)
    expect(lpm(q)).toBeCloseTo(20, 9)
  })
})

describe('the hydraulics lab: machines and the town', () => {
  it('a cylinder needs p = F / A and moves at Q / A', () => {
    const c = cylinder({ boreMm: 100, loadKg: 2000, pumpLpm: 12, reliefBar: 160 })
    expect(c.neededBar).toBeCloseTo(24.98, 1)
    expect(c.lifts).toBe(true)
    expect(c.speed).toBeCloseTo(0.0255, 3)
    const stalled = cylinder({ boreMm: 40, loadKg: 4000, pumpLpm: 12, reliefBar: 160 })
    expect(stalled.lifts).toBe(false)
    expect(stalled.speed).toBe(0)
    expect(stalled.heatKw).toBeCloseTo(3.2, 1)
  })

  it('brakes turn a foot into tonnes', () => {
    const b = brakes({ pedalN: 200, ratio: 4, masterMm: 20, caliperMm: 50, booster: true })
    expect(b.bar).toBeCloseTo(101.9, 0)
    expect(b.gain).toBeCloseTo(4 * 4 * 6.25, 6)
  })

  it('a water tower: the day balances, a small pump runs it dry, a higher tower gives more pressure', () => {
    expect(USE_SHAPE.reduce((a, b) => a + b, 0)).toBeCloseTo(24, 9)
    const town = { people: 5000, pumpM3h: 60, volumeM3: 500, heightM: 35, mode: 'auto' as const }
    const ok = towerDay(town)
    expect(ok.shortage).toBe(0)
    expect(ok.spill).toBe(0)
    expect(ok.day.reduce((s, h) => s + h.pump, 0)).toBeGreaterThan(900)
    expect(towerDay({ ...town, pumpM3h: 25 }).shortage).toBeGreaterThan(100)
    expect(towerDay({ ...town, mode: 'always', pumpM3h: 80 }).spill).toBeGreaterThan(100)
    expect(towerDay({ ...town, heightM: 50 }).day[3].bar.hill).toBeGreaterThan(ok.day[3].bar.hill + 1.3)
    // the house on the hill has less pressure than the one in the valley, by its height
    expect(ok.day[3].bar.valley - ok.day[3].bar.hill).toBeCloseTo(2.55, 1)
  })
})
