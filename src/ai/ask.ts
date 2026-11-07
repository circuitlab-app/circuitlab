import { BOARDS, isBoard } from '@/circuit/catalog'
import type { PartData, PinMode } from '@/circuit/types'
import { DICTIONARIES, type Lang } from '@/i18n'
import { aiBookFor } from '@/i18n/ai'
import type { AiNoun } from '@/i18n/ai/types'
import { playClick } from '@/lib/sound'
import { useCircuit } from '@/store/circuit'
import { useSettings } from '@/store/settings'
import { useSimulation } from '@/store/simulation'
import { chat, OllamaError, pickModel } from './ollama'
import {
  applyPins,
  buildMessages,
  describeBoard,
  parseReply,
  replyFormat,
  type BoardInfo,
  type Device,
  type HistoryTurn,
  type PinChange,
} from './plan'
import { useAiChat, type ChatTurn } from './store'

/*
 * One question to an AI board, from the child's words to changed pins:
 * describe the board as it is right now, ask the model, check its answer,
 * and set only the pin programs that are allowed.
 */

const controllers = new Map<string, AbortController>()
const turnId = () => crypto.randomUUID().slice(0, 8)

const langOf = (lang: string | undefined): Lang => (lang === 'fa' || lang === 'ar' ? lang : 'en')

/** A part's name in the app's language, with its colour: "ال‌ای‌دی قرمز". */
export function localPartName(lang: Lang, data: PartData): string {
  const t = DICTIONARIES[lang]
  const name = t.parts[data.type]?.name ?? data.type
  if ((data.type === 'led' || data.type === 'lamp') && data.color) {
    const color = t.colors[data.color as keyof typeof t.colors] ?? data.color
    return lang === 'en' ? `${color.toLowerCase()} ${name}` : `${name} ${color}`
  }
  return name
}

/** The everyday noun for a part in the ideas under the chat ("the red light", "the fan"). */
export function ideaThing(lang: Lang, device: Device): string {
  const book = aiBookFor(lang)
  const noun: AiNoun =
    device.type === 'lamp'
      ? 'lamp'
      : device.type === 'fan'
        ? 'fan'
        : device.type === 'pump'
          ? 'pump'
          : device.type === 'vibration'
            ? 'vibration'
            : device.type === 'solenoid'
              ? 'solenoid'
              : device.type === 'electromagnet'
                ? 'magnet'
                : device.type === 'motor'
                  ? 'motor'
                  : 'light'
  return book.thing(book.nouns[noun], device.color as Parameters<typeof book.thing>[1])
}

/** The board as the model will see it, from the circuit and the simulation right now. */
export function currentBoardInfo(boardId: string, lang: Lang): BoardInfo | null {
  const { nodes, edges } = useCircuit.getState()
  return describeBoard(boardId, nodes, edges, {
    inputVolts: useSimulation.getState().result.inputs[boardId],
    local: (data) => localPartName(lang, data),
  })
}

function historyFor(turns: ChatTurn[]): HistoryTurn[] {
  return turns.flatMap((turn): HistoryTurn[] =>
    turn.role === 'kid' ? [{ role: 'kid', text: turn.text }] : turn.role === 'ai' ? [{ role: 'ai', text: turn.text, pins: turn.pins }] : [],
  )
}

/** Sends the child's words to the model and applies its answer to the board's pins. */
export async function askBoard(boardId: string, words: string): Promise<void> {
  const text = words.trim()
  const ai = useAiChat.getState()
  if (!text || ai.pending[boardId] !== undefined) return
  const node = useCircuit.getState().nodes.find((n) => n.id === boardId)
  if (!node || !isBoard(node.data.type)) return

  const lang = langOf(useSettings.getState().lang)
  const info = currentBoardInfo(boardId, lang)
  if (!info) return
  const history = historyFor(ai.chats[boardId] ?? [])
  ai.addTurn(boardId, { id: turnId(), role: 'kid', text, at: Date.now() })
  ai.setPending(boardId, true)

  const controller = new AbortController()
  controllers.set(boardId, controller)
  const started = performance.now()
  try {
    let model = useAiChat.getState().model
    const known = useAiChat.getState().connection
    // look again when Ollama has not answered yet, or the saved model is gone
    if (!model || known.state !== 'ready' || !known.models.some((m) => m.name === model)) {
      const connection = await useAiChat.getState().checkConnection()
      if (connection.state !== 'ready') throw new OllamaError(connection.state === 'problem' ? connection.problem : 'offline')
      model = pickModel(connection.models, useAiChat.getState().model)
      if (!model) throw new OllamaError('noModel')
    }
    if (controller.signal.aborted) throw new OllamaError('stopped')

    const answer = await chat({
      host: useAiChat.getState().host,
      model,
      messages: buildMessages(info, history, text, lang),
      format: replyFormat(info),
      signal: controller.signal,
    })
    const reply = parseReply(answer, info)
    if (!reply) throw new OllamaError('badReply', answer.slice(0, 200))

    // the child may have changed some pins while the model was thinking: start from the board as it is now
    const latest = useCircuit.getState().nodes.find((n) => n.id === boardId)
    let changes: (PinChange & { part?: string })[] = []
    if (latest && isBoard(latest.data.type)) {
      const applied = applyPins((latest.data.pins ?? {}) as Record<string, PinMode>, reply.pins, BOARDS[latest.data.type].pins)
      changes = applied.changes.map((c) => ({ ...c, part: info.pins.find((p) => p.pin === c.pin)?.devices[0]?.local }))
      if (changes.length > 0) {
        useCircuit.getState().updatePart(boardId, { pins: applied.pins })
        playClick(true)
      }
    }
    useAiChat.getState().addTurn(boardId, {
      id: turnId(),
      role: 'ai',
      text: reply.say || aiBookFor(lang).noChange,
      at: Date.now(),
      changes,
      pins: reply.pins,
      seconds: Math.max(1, Math.round((performance.now() - started) / 1000)),
    })
  } catch (error) {
    const problem = controller.signal.aborted ? 'stopped' : error instanceof OllamaError ? error.problem : 'failed'
    if (problem !== 'stopped') console.warn('[AI board]', error)
    useAiChat.getState().addTurn(boardId, { id: turnId(), role: 'problem', problem, at: Date.now() })
    // the panel shows the setup help for these
    if (problem === 'offline' || problem === 'blocked' || problem === 'noModel') {
      useAiChat.setState({ connection: { state: 'problem', problem, models: [] } })
    }
  } finally {
    controllers.delete(boardId)
    useAiChat.getState().setPending(boardId, false)
  }
}

/** The Stop button: forget the question, change nothing. */
export function stopBoard(boardId: string) {
  controllers.get(boardId)?.abort()
}
