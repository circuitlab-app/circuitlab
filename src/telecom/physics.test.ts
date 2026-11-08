import { describe, expect, it } from 'vitest'
import {
  aliasOf,
  arrayFactor,
  C,
  capacity,
  dbmToWatts,
  doppler,
  EPS0,
  fspl,
  MU0,
  photonEv,
  refract,
  si,
  squareHarmonics,
  wavelength,
} from './physics'

describe('the physics of waves', () => {
  it('c = f·λ, and c = 1/√(μ0·ε0)', () => {
    expect(wavelength(3.5e9)).toBeCloseTo(0.0857, 3)
    expect(wavelength(1e6)).toBeCloseTo(299.8, 0)
    expect(1 / Math.sqrt(MU0 * EPS0)).toBeCloseTo(C, -2)
  })

  it('radio photons are far too weak to ionise', () => {
    expect(photonEv(3.5e9)).toBeCloseTo(1.45e-5, 6)
    expect(photonEv(C / 550e-9)).toBeCloseTo(2.25, 1)
  })

  it('free-space loss grows 6 dB for every doubling of distance or frequency', () => {
    expect(fspl(1800, 2) - fspl(1800, 1)).toBeCloseTo(6.02, 2)
    expect(fspl(3600, 1) - fspl(1800, 1)).toBeCloseTo(6.02, 2)
    expect(dbmToWatts(30)).toBeCloseTo(1)
    expect(dbmToWatts(-100)).toBeCloseTo(1e-13, 20)
  })

  it("Snell's law, and total internal reflection past the critical angle", () => {
    expect(refract(1, 1.5, 30).refracted).toBeCloseTo(19.47, 1)
    const glass = refract(1.5, 1, 30)
    expect(glass.critical).toBeCloseTo(41.81, 1)
    expect(refract(1.5, 1, 50).refracted).toBeNull()
    expect(refract(1, 1.5, 50).critical).toBeNull()
  })

  it('the Doppler shift of a phone in a car at 120 km/h on 3.5 GHz is a few hundred hertz', () => {
    expect(doppler(3.5e9, 120 / 3.6).shift).toBeCloseTo(389, -1)
    const sound = doppler(440, 34, 343)
    expect(sound.ahead).toBeGreaterThan(440)
    expect(sound.behind).toBeLessThan(440)
  })

  it('Shannon: 20 MHz at 20 dB is about 133 Mbit/s', () => {
    expect(capacity(20e6, 20) / 1e6).toBeCloseTo(133.2, 0)
    expect(capacity(40e6, 20)).toBeCloseTo(2 * capacity(20e6, 20))
  })

  it('a sine sampled too slowly comes out at a lower, false frequency', () => {
    expect(aliasOf(3, 10)).toBe(3)
    expect(aliasOf(7, 10)).toBe(3)
    expect(aliasOf(12, 10)).toBe(2)
    expect(aliasOf(3400, 8000)).toBe(3400)
  })

  it('a square wave is odd harmonics with falling amplitudes', () => {
    expect(squareHarmonics(3).map((h) => h.k)).toEqual([1, 3, 5])
    expect(squareHarmonics(2)[1].amp).toBeCloseTo(4 / (3 * Math.PI))
  })

  it('an antenna array sends most where it is aimed', () => {
    expect(arrayFactor(8, 0.5, 30, 30)).toBeCloseTo(1)
    expect(arrayFactor(8, 0.5, 30, -30)).toBeLessThan(0.3)
    expect(arrayFactor(1, 0.5, 0, 70)).toBeCloseTo(1)
  })

  it('writes numbers with SI prefixes', () => {
    expect(si(3.5e9, 'Hz')).toBe('3.5 GHz')
    expect(si(0.0857, 'm')).toBe('8.57 cm')
    expect(si(0.0011, 'm')).toBe('1.1 mm')
    expect(si(299.8, 'm', 3)).toBe('300 m')
  })
})
