import { describe, expect, it } from 'vitest'
import { BITS, constellation, SCHEMES, textToBits, bitsToText, transmit, waves } from './modulation'
import { callSteps, presetFor, traceCall, type ChainEdge, type ChainNode } from './parts'
import { barsOf, GENERATIONS, pathLoss, serviceAt, TECHS, wallsBetween, type Tower } from './radio'

const chain = (tech: Parameters<typeof presetFor>[0]) => {
  const p = presetFor(tech)
  return { nodes: p.parts.map(({ id, data }) => ({ id, data })) as ChainNode[], edges: p.edges as ChainEdge[] }
}

describe('a call along the chain', () => {
  it.each(TECHS)('the ready-made %s chain gets the voice from microphone to speaker', (tech) => {
    const { nodes, edges } = chain(tech)
    const trace = traceCall(nodes, edges, tech)
    expect(trace.problem).toBeUndefined()
    expect(trace.ok).toBe(true)
    expect(trace.hops[0].kind).toBe('mic')
    expect(trace.hops.at(-1)?.kind).toBe('speaker')
    expect(trace.notes.filter((n) => n.code !== 'weak')).toEqual([])
  })

  it('names the route: through exchanges, towers, or radio to radio', () => {
    expect(traceCall(...Object.values(chain('landline')) as [ChainNode[], ChainEdge[]], 'landline').route).toBe('landline')
    expect(traceCall(...Object.values(chain('4g')) as [ChainNode[], ChainEdge[]], '4g').route).toBe('mobile')
    expect(traceCall(...Object.values(chain('walkie')) as [ChainNode[], ChainEdge[]], 'walkie').route).toBe('direct')
  })

  it('an antenna fed bits (no modulator) stops the call at the antenna', () => {
    const { nodes, edges } = chain('4g')
    const without = nodes.filter((n) => n.data.kind !== 'modulator' || n.id !== 'modulator-1')
    const rewired = edges
      .filter((e) => e.target !== 'modulator-1')
      .map((e) => (e.source === 'modulator-1' ? { ...e, source: 'codec-1' } : e))
    const trace = traceCall(without, rewired, '4g')
    expect(trace.ok).toBe(false)
    expect(trace.problem).toEqual({ code: 'wrongInput', kind: 'amplifier', got: 'digital', wants: ['rf'] })
    expect(trace.hops.at(-1)?.bad).toBe(true)
  })

  it('too far from the tower: no signal', () => {
    const { nodes, edges } = chain('5g')
    const far = nodes.map((n) => (n.id === 'air-1' ? { ...n, data: { ...n.data, km: 30 } } : n))
    const trace = traceCall(far, edges, '5g')
    expect(trace.problem?.code).toBe('noSignal')
  })

  it('2G reaches much further than 5G from the same distance', () => {
    const at = (tech: '2g' | '5g', km: number) => {
      const { nodes, edges } = chain(tech)
      return traceCall(nodes.map((n) => (n.id === 'air-1' ? { ...n, data: { ...n.data, km } } : n)), edges, tech).ok
    }
    expect(at('2g', 3)).toBe(true)
    expect(at('5g', 3)).toBe(false)
  })

  it('a cut fibre or a switched-off tower stops the call there', () => {
    const { nodes, edges } = chain('3g')
    const cut = nodes.map((n) => (n.id === 'fiber-1' ? { ...n, data: { ...n.data, off: true } } : n))
    expect(traceCall(cut, edges, '3g').problem).toEqual({ code: 'off', kind: 'fiber' })
  })

  it('two towers joined without the core network cannot find each other', () => {
    const { nodes, edges } = chain('4g')
    const noCore = nodes.filter((n) => n.id !== 'core-1' && n.id !== 'fiber-2')
    const rewired = edges
      .filter((e) => !['core-1', 'fiber-2'].includes(e.target) && !['core-1', 'fiber-2'].includes(e.source))
      .concat({ source: 'fiber-1', target: 'tower-2' })
    expect(traceCall(noCore, rewired, '4g').problem).toEqual({ code: 'noCore' })
  })

  it('a landline loop longer than the copper allows is too weak', () => {
    const { nodes, edges } = chain('landline')
    const long = nodes.map((n) => (n.id === 'copper-1' ? { ...n, data: { ...n.data, km: 11 } } : n))
    expect(traceCall(long, edges, 'landline').problem).toEqual({ code: 'longLine', km: 11 })
  })

  it('a dead end and a missing microphone are named', () => {
    const { nodes, edges } = chain('2g')
    expect(traceCall(nodes, edges.slice(0, 3), '2g').problem).toMatchObject({ code: 'deadEnd', kind: 'modulator', form: 'rf' })
    expect(traceCall(nodes.filter((n) => n.data.kind !== 'mic'), edges, '2g').problem).toEqual({ code: 'noMic' })
  })

  it('a mobile call sets up, pages the other phone, then talks hop by hop', () => {
    const { nodes, edges } = chain('4g')
    const steps = callSteps(traceCall(nodes, edges, '4g'))
    expect(steps.slice(0, 2).map((s) => s.phase)).toEqual(['setup', 'page'])
    expect(steps.filter((s) => s.phase === 'talk').length).toBe(nodes.length)
    const landline = chain('landline')
    expect(callSteps(traceCall(landline.nodes, landline.edges, 'landline')).slice(0, 3).map((s) => s.phase)).toEqual(['offhook', 'dial', 'ring'])
  })
})

describe('the radio model', () => {
  it('loses more with distance, frequency and walls', () => {
    expect(pathLoss(900, 2)).toBeLessThan(pathLoss(900, 4))
    expect(pathLoss(900, 2)).toBeLessThan(pathLoss(3500, 2))
    expect(barsOf(35)).toBe(4)
    expect(barsOf(-1)).toBe(0)
    expect(wallsBetween(0, 0, 10, 0, [{ x: 4, y: -1, w: 2, h: 2 }])).toBe(2)
    expect(wallsBetween(0, 0, 5, 0, [{ x: 4, y: -1, w: 2, h: 2 }])).toBe(1)
  })

  const tower = (over: Partial<Tower>): Tower => ({ id: 't', x: 0, y: 0, gens: ['2g', '3g', '4g', '5g'], band5g: 'mid', aggregation: true, on: true, ...over })

  it('a phone uses the newest network it hears well, and shows its letter', () => {
    expect(serviceAt(0.3, 0, [tower({})], []).icon).toBe('5G')
    expect(serviceAt(0.3, 0, [tower({ band5g: 'high' })], []).icon).toBe('5G+')
    expect(serviceAt(0.3, 0, [tower({ gens: ['2g', '3g', '4g'] })], []).icon).toBe('4G+')
    expect(serviceAt(0.3, 0, [tower({ gens: ['2g', '3g', '4g'] })], [], 'lte').icon).toBe('LTE+')
    expect(serviceAt(0.3, 0, [tower({ gens: ['2g', '3g'] })], []).icon).toBe('H+')
    expect(serviceAt(0.3, 0, [tower({ gens: ['2g'] })], []).icon).toBe('E')
    expect(serviceAt(60, 0, [tower({})], []).icon).toBe('none')
  })

  it('far away, a phone falls back to an older generation that reaches further', () => {
    const far = serviceAt(4, 0, [tower({})], [])
    expect(far.gen).toBe('2g')
    expect(['G', 'E']).toContain(far.icon)
  })

  it('mmWave 5G barely gets through a building', () => {
    const building = [{ x: 0.15, y: -0.1, w: 0.1, h: 0.2 }]
    expect(serviceAt(0.3, 0, [tower({ gens: ['5g'], band5g: 'high' })], []).icon).toBe('5G+')
    expect(serviceAt(0.3, 0, [tower({ gens: ['5g'], band5g: 'high' })], building).icon).toBe('none')
  })

  it('lists every generation from 1G to 6G', () => {
    expect(GENERATIONS.map((g) => g.id)).toEqual(['1g', '2g', '3g', '4g', '5g', '6g'])
  })
})

describe('modulation', () => {
  it('keeps text, including Persian, through bits', () => {
    expect(bitsToText(textToBits('سلام Hi'))).toBe('سلام Hi')
  })

  it.each(SCHEMES.filter((s) => BITS[s] > 0))('%s has 2^bits points of average power 1, neighbours one bit apart', (scheme) => {
    const points = constellation(scheme)
    expect(points.length).toBe(2 ** BITS[scheme])
    const power = points.reduce((sum, p) => sum + p.i ** 2 + p.q ** 2, 0) / points.length
    expect(power).toBeCloseTo(1, 5)
  })

  it.each(SCHEMES.filter((s) => BITS[s] > 0))('%s gets a clean signal through without errors', (scheme) => {
    const tx = transmit('Circuit Lab · آزمایشگاه', scheme, 40)
    expect(tx.errors).toBe(0)
    expect(tx.text).toBe('Circuit Lab · آزمایشگاه')
  })

  it('in the same noise, 256-QAM makes far more errors than QPSK', () => {
    const text = 'The quick brown fox jumps over the lazy dog'
    const qpsk = transmit(text, 'qpsk', 12, 3)
    const qam = transmit(text, '256qam', 12, 3)
    expect(qpsk.errors).toBe(0)
    expect(qam.errors).toBeGreaterThan(20)
  })

  it('draws the waves for the scope', () => {
    const tx = transmit('Hi', 'qpsk', 20)
    const w = waves(tx, 'qpsk', 20, 4, 32)
    expect(w.signal.length).toBe(4 * 32)
    expect(w.marks).toEqual([0, 32, 64, 96])
    expect(waves(tx, 'fm', 20, 4, 32).signal.length).toBe(128)
  })
})
