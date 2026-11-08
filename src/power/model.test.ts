import { describe, expect, it } from 'vitest'
import {
  acPower,
  dispatchDay,
  generatorHz,
  house,
  lineVoltage,
  peakOf,
  SHEDDING_HZ,
  touch,
  transformer,
  transmission,
  type Mix,
} from './model'

const MIX: Mix = { nuclear: 300, coal: 100, gas: 450, hydro: 150, wind: 150, solar: 200, battery: 100 }

describe('the power lab', () => {
  it('raising the voltage cuts line losses by its square', () => {
    const low = transmission(500, 132, 200)
    const high = transmission(500, 400, 200)
    expect(high.lossMw / low.lossMw).toBeCloseTo((132 / 400) ** 2, 5)
    expect(high.lossShare).toBeLessThan(0.05)
    expect(high.workable).toBe(true)
    expect(transmission(500, 20, 200).workable).toBe(false)
  })

  it('AC, three-phase, transformers and generators', () => {
    expect(peakOf(230)).toBeCloseTo(325.3, 1)
    expect(lineVoltage(230)).toBeCloseTo(398.4, 1)
    expect(generatorHz(3000, 2)).toBe(50)
    expect(generatorHz(1500, 4)).toBe(50)
    const t = transformer(20000, 10, 1000, 20)
    expect(t.v2).toBe(400)
    expect(t.i2).toBe(500)
    expect(20000 * 10).toBe(t.v2 * t.i2)
    const pf = acPower(230, 10, 37)
    expect(pf.pf).toBeCloseTo(0.8, 2)
    expect(pf.p ** 2 + pf.q ** 2).toBeCloseTo(pf.s ** 2)
  })

  it('a balanced day keeps 50 Hz; too little generation cuts homes off', () => {
    const day = dispatchDay(MIX, { sunny: true, windy: true })
    expect(day).toHaveLength(24)
    expect(day.every((h) => h.shortage === 0 && h.frequency === 50)).toBe(true)
    for (const h of day) {
      const supplied = Object.values(h.out).reduce((a, b) => a + b, 0)
      expect(supplied).toBeCloseTo(h.demand + h.charge, 5)
    }
    const short = dispatchDay({ ...MIX, gas: 0, coal: 0 }, { sunny: false, windy: false })
    expect(short.some((h) => h.frequency < SHEDDING_HZ)).toBe(true)
  })

  it('sun at noon is stored or curtailed when there is more than the city needs', () => {
    const day = dispatchDay({ ...MIX, solar: 1500 }, { sunny: true, windy: false })
    const noon = day[12]
    expect(noon.charge + noon.curtailed).toBeGreaterThan(0)
    expect(noon.out.gas).toBe(0)
  })

  it("a house's breakers trip on overload, the main switch on the total", () => {
    expect(house(['kettle', 'microwave', 'fridge']).circuits.kitchen.tripped).toBe(false)
    expect(house(['washer', 'iron']).circuits.sockets.tripped).toBe(true)
    expect(house(['ev', 'ac', 'heater']).mainTripped).toBe(true)
    expect(house(['lights', 'tv']).kwhDay).toBeCloseTo(0.98, 2)
  })

  it('earth and RCD make a live case safe', () => {
    expect(touch({ earth: true, rcd: false, wet: true }).outcome).toBe('earth')
    expect(touch({ earth: false, rcd: true, wet: true }).outcome).toBe('rcd')
    expect(touch({ earth: false, rcd: false, wet: true }).outcome).toBe('danger')
    expect(touch({ earth: false, rcd: false, wet: true }).bodyMa).toBeGreaterThan(150)
  })
})
