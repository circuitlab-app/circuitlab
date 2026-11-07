import { describe, expect, it } from 'vitest'
import { createPartData } from '@/circuit/catalog'
import type { PartData, PartType } from '@/circuit/types'
import { isChatModel, normalizeHost, pickModel, stripThinking, type ModelInfo } from './ollama'
import {
  applyPins,
  boardFacts,
  buildMessages,
  describeBoard,
  parseReply,
  replyFormat,
  suggestionsFor,
  type PlanPart,
  type PlanWire,
} from './plan'

const part = (id: string, type: PartType, data: Partial<PartData> = {}): PlanPart => ({
  id,
  data: { ...createPartData(type), ...data },
})

/** [from, to] as "id:terminal" */
const wires = (...list: [string, string][]): PlanWire[] =>
  list.map(([from, to]) => {
    const [source, sourceHandle] = from.split(':')
    const [target, targetHandle] = to.split(':')
    return { source, sourceHandle, target, targetHandle }
  })

const allOff = { P1: 'off', P2: 'off', P3: 'off', P4: 'off', P5: 'off', P6: 'off' } as const

/** An AI board with a red LED on P1, a motor behind a transistor on P2, and a light sensor on IN. */
function smartRoom() {
  const parts = [
    part('ai', 'aiBoard', { pins: { ...allOff, P1: 'blink' } }),
    part('r1', 'resistor', { resistance: 220 }),
    part('led', 'led', { color: 'red' }),
    part('rb', 'resistor', { resistance: 470 }),
    part('q', 'transistor'),
    part('motor', 'motor'),
    part('ldr', 'ldr', { light: 0.2 }),
    part('div', 'resistor', { resistance: 1000 }),
  ]
  const links = wires(
    ['ai:P1', 'r1:a'],
    ['r1:b', 'led:a'],
    ['led:b', 'ai:GND'],
    ['ai:P2', 'rb:a'],
    ['rb:b', 'q:B'],
    ['ai:5V', 'motor:a'],
    ['motor:b', 'q:C'],
    ['q:E', 'ai:GND'],
    ['ai:5V', 'ldr:a'],
    ['ldr:b', 'ai:IN'],
    ['ai:IN', 'div:a'],
    ['div:b', 'ai:GND'],
  )
  return { parts, links }
}

describe('describing the AI board for the model', () => {
  it('follows each pin through resistors and a transistor to the part it drives', () => {
    const { parts, links } = smartRoom()
    const info = describeBoard('ai', parts, links)!
    expect(info.board).toBe('aiBoard')
    expect(info.pins.map((p) => p.pin)).toEqual(['P1', 'P2', 'P3', 'P4', 'P5', 'P6'])
    const [p1, p2, p3] = info.pins
    expect(p1.mode).toBe('blink')
    expect(p1.devices).toHaveLength(1)
    expect(p1.devices[0]).toMatchObject({ id: 'led', type: 'led', name: 'red LED', via: ['220Ω resistor'] })
    expect(p2.devices[0]).toMatchObject({ id: 'motor', name: 'motor', via: ['470Ω resistor', 'transistor'] })
    expect(p3.devices).toEqual([])
    // every pin of the AI board can fade and read the sensor
    expect(p3.modes).toEqual(expect.arrayContaining(['fade', 'follow', 'invert', 'alarm', 'step3']))
  })

  it('tells which way the light sensor pulls the input, and what it reads now', () => {
    const { parts, links } = smartRoom()
    const info = describeBoard('ai', parts, links, { inputVolts: 1 })!
    expect(info.input).toMatchObject({ pin: 'IN', high: 'it is bright', low: 'it is dark', reading: 'light 20%' })
    expect(info.input?.share).toBeCloseTo(0.2)
    expect(info.input?.sensor?.type).toBe('ldr')

    // the same sensor between IN and − reads high in the dark instead
    const flipped = describeBoard(
      'ai',
      [part('ai', 'aiBoard'), part('ldr', 'ldr'), part('up', 'resistor')],
      wires(['ai:5V', 'up:a'], ['up:b', 'ai:IN'], ['ai:IN', 'ldr:a'], ['ldr:b', 'ai:GND']),
    )!
    expect(flipped.input).toMatchObject({ high: 'it is dark', low: 'it is bright' })
  })

  it('reads a sensor module in its own words', () => {
    const info = describeBoard(
      'ai',
      [part('ai', 'aiBoard'), part('temp', 'tempSensor', { sense: 0.5 })],
      wires(['ai:5V', 'temp:VCC'], ['temp:GND', 'ai:GND'], ['temp:OUT', 'ai:IN']),
      { inputVolts: 4 },
    )!
    expect(info.input?.sensor?.type).toBe('tempSensor')
    expect(info.input?.high).toBe('it is hot')
    expect(info.input?.reading).toMatch(/°C$/)
    expect(boardFacts(info)).toContain('right now it is hot')
  })

  it('notices an LED put in the wrong way round, and names the legs of a traffic light', () => {
    const info = describeBoard(
      'ai',
      [part('ai', 'aiBoard'), part('led', 'led', { color: 'green' }), part('tl', 'trafficLight')],
      wires(['ai:P1', 'led:b'], ['led:a', 'ai:GND'], ['ai:P2', 'tl:R'], ['tl:GND', 'ai:GND']),
    )!
    expect(info.pins[0].devices[0].backwards).toBe(true)
    expect(info.pins[1].devices[0].name).toBe('traffic light (its red light)')
    expect(boardFacts(info)).toContain('wrong way round')
  })

  it('writes the board as facts, one line per pin plus the input', () => {
    const { parts, links } = smartRoom()
    const facts = boardFacts(describeBoard('ai', parts, links, { inputVolts: 1 })!)
    expect(facts).toContain('- P1 → red LED through a 220Ω resistor. Set to: blink.')
    expect(facts).toContain('- P2 → motor through a 470Ω resistor and transistor. Set to: off.')
    expect(facts).toContain('- P3 → nothing is connected (leave this pin alone). Set to: off.')
    expect(facts).toContain('so right now it is dark')
  })

  it('returns nothing for a part that is not a board', () => {
    expect(describeBoard('led', [part('led', 'led')], [])).toBeNull()
  })
})

describe('asking the model', () => {
  it('builds the rules, the board, the chat so far and the request, in the app language', () => {
    const { parts, links } = smartRoom()
    const info = describeBoard('ai', parts, links)!
    const messages = buildMessages(
      info,
      [
        { role: 'kid', text: 'blink the red light' },
        { role: 'ai', text: 'Done!', pins: { P1: 'blink' } },
      ],
      'now the motor',
      'fa',
    )
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('Persian (Farsi)')
    expect(messages[0].content).toContain('P2 → motor')
    expect(messages[0].content).toMatch(/wall sockets/)
    expect(messages[2]).toEqual({ role: 'assistant', content: JSON.stringify({ pins: [{ pin: 'P1', mode: 'blink' }], say: 'Done!' }) })
    expect(messages.at(-1)).toEqual({ role: 'user', content: 'now the motor' })
  })

  it('only lets each pin take its own programs in the answer, in any order', () => {
    const { parts, links } = smartRoom()
    const format = replyFormat(describeBoard('ai', parts, links)!)
    expect(format.required).toEqual(['pins', 'say'])
    // a list, so the model can change P3 and then P2
    expect(format.properties.pins.type).toBe('array')
    expect(JSON.stringify(format.properties.pins.items)).toContain('"enum":["P1","P2","P3","P4","P5","P6"]')
    expect(JSON.stringify(format.properties.pins.items)).toContain('"invert"')

    // boards whose pins differ (the Uno fades on three pins only) get one choice per kind of pin
    const uno = replyFormat(describeBoard('uno', [part('uno', 'arduino')], [])!)
    const kinds = (uno.properties.pins.items as { anyOf?: { properties: { pin: { enum: string[] }; mode: { enum: string[] } } }[] }).anyOf!
    expect(kinds).toHaveLength(2)
    const fading = kinds.find((k) => k.properties.mode.enum.includes('fade'))!
    expect(fading.properties.pin.enum).toEqual(['D11', 'D10', 'D9'])
  })
})

describe('checking the answer', () => {
  const info = () => {
    const { parts, links } = smartRoom()
    return describeBoard('ai', parts, links)!
  }

  it('keeps what to say and the allowed pin programs, and drops the rest', () => {
    const reply = parseReply(
      '<think>the red light is P1</think>{"pins": [{"pin": "P1", "mode": "Blink"}, {"pin": "pin 2", "mode": "fade"}, {"pin": "P9", "mode": "on"}, {"pin": "P3", "mode": "dance"}], "say": "The red light blinks!"}',
      info(),
    )
    expect(reply).toEqual({
      say: 'The red light blinks!',
      pins: { P1: 'blink', P2: 'fade' },
      ignored: ['P9: on', 'P3: dance'],
    })
  })

  it('accepts an answer with no pin changes, but not one with nothing at all', () => {
    expect(parseReply('{"pins": [], "say": "P1 drives a red LED."}', info())?.pins).toEqual({})
    // an object keyed by pin is understood too
    expect(parseReply('{"pins": {"P2": "on"}, "say": "The motor runs."}', info())?.pins).toEqual({ P2: 'on' })
    expect(parseReply('{"pins": {}, "say": ""}', info())).toBeNull()
    expect(parseReply('I am not sure', info())).toBeNull()
    expect(parseReply('{"pins": [1, 2], "say": 5}', info())).toBeNull()
    expect(parseReply('{"pins": "P1", "say": ""}', info())).toBeNull()
  })

  it('applies only the pins that really change', () => {
    const { pins, changes } = applyPins({ ...allOff, P1: 'blink' }, { P1: 'blink', P2: 'fade', P4: 'on' }, ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'])
    expect(changes).toEqual([
      { pin: 'P2', from: 'off', to: 'fade' },
      { pin: 'P4', from: 'off', to: 'on' },
    ])
    expect(pins).toMatchObject({ P1: 'blink', P2: 'fade', P4: 'on', P6: 'off' })
  })
})

describe('ideas for what to ask', () => {
  it('suggests the dark-room idea for a light sensor and a light, and always the question about the board', () => {
    const { parts, links } = smartRoom()
    const ideas = suggestionsFor(describeBoard('ai', parts, links)!)
    expect(ideas[0]).toMatchObject({ kind: 'whenDark', device: { type: 'led' } })
    expect(ideas.at(-1)).toEqual({ kind: 'whatIsConnected' })
    expect(ideas.length).toBeLessThanOrEqual(4)
  })

  it('leaves out ideas that are already running', () => {
    const { parts, links } = smartRoom()
    parts[0] = part('ai', 'aiBoard', { pins: { ...allOff, P1: 'invert', P2: 'fade' } })
    const kinds = suggestionsFor(describeBoard('ai', parts, links)!).map((s) => s.kind)
    expect(kinds).not.toContain('whenDark')
    expect(kinds).not.toContain('slowly')
    expect(kinds).toContain('blink')
  })

  it('suggests a traffic light for red, yellow and green lights', () => {
    const parts = [part('ai', 'aiBoard'), ...(['red', 'yellow', 'green'] as const).map((color) => part(color, 'led', { color }))]
    const links = wires(['ai:P1', 'red:a'], ['ai:P2', 'yellow:a'], ['ai:P3', 'green:a'], ['red:b', 'ai:GND'], ['yellow:b', 'ai:GND'], ['green:b', 'ai:GND'])
    expect(suggestionsFor(describeBoard('ai', parts, links)!).map((s) => s.kind)).toContain('trafficLight')
  })

  it('explains how to connect something when nothing is wired', () => {
    expect(suggestionsFor(describeBoard('ai', [part('ai', 'aiBoard')], [])!)).toEqual([
      { kind: 'howToConnect' },
      { kind: 'whatIsConnected' },
    ])
  })
})

describe('the Ollama client', () => {
  it('tells chat models from embedding models', () => {
    expect(isChatModel({ name: 'qwen3.5:9b', capabilities: ['completion', 'vision', 'tools', 'thinking'] })).toBe(true)
    expect(isChatModel({ name: 'embeddinggemma:latest', capabilities: ['embedding'] })).toBe(false)
    // older Ollama versions do not list capabilities
    expect(isChatModel({ name: 'nomic-embed-text:latest' })).toBe(false)
    expect(isChatModel({ name: 'all-minilm:l6-v2' })).toBe(false)
    expect(isChatModel({ name: 'mxbai-embed-large' })).toBe(false)
    expect(isChatModel({ name: 'llama3.2:3b' })).toBe(true)
  })

  it('keeps the chosen model, otherwise picks a small chat model that is big enough to follow the rules', () => {
    const models: ModelInfo[] = [
      { name: 'big:70b', size: 40e9, chat: true },
      { name: 'tiny:0.5b', size: 0.4e9, chat: true },
      { name: 'small:4b', size: 3.3e9, chat: true },
      { name: 'embed', size: 0.6e9, chat: false },
    ]
    expect(pickModel(models)).toBe('small:4b')
    expect(pickModel(models, 'big:70b')).toBe('big:70b')
    expect(pickModel(models, 'embed')).toBe('small:4b')
    expect(pickModel([{ name: 'tiny', size: 1e8, chat: true }])).toBe('tiny')
    expect(pickModel([{ name: 'embed', size: 1e8, chat: false }])).toBeNull()
  })

  it('cleans up the address and the thinking', () => {
    expect(normalizeHost('localhost:11434/')).toBe('http://localhost:11434')
    expect(normalizeHost(' http://192.168.1.5:11434/api ')).toBe('http://192.168.1.5:11434')
    expect(normalizeHost('')).toBe('http://localhost:11434')
    expect(stripThinking('<think>hmm</think>\n{"a":1}')).toBe('{"a":1}')
  })
})
