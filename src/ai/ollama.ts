/*
 * A small client for Ollama (https://ollama.com), the free app that runs a
 * language model on your own computer. Plain fetch, no library: we only need
 * the list of installed models and one chat call that answers in JSON.
 *
 * Every failure becomes one of a few problems the AI board can explain to a
 * child in simple words (see `OllamaProblem`).
 */

export const DEFAULT_HOST = 'http://localhost:11434'

/** The model we suggest installing: small, quick, and good with English, Persian and Arabic. */
export const SUGGESTED_MODEL = 'gemma3:4b'

/** Long enough for a big model to load the first time on a slow computer. */
const CHAT_TIMEOUT_MS = 120_000
const LIST_TIMEOUT_MS = 6_000

export type OllamaProblem =
  /** nothing answers at the address: Ollama is not running (or the address is wrong) */
  | 'offline'
  /** Ollama answers, but the browser may not read it: this website is not in OLLAMA_ORIGINS */
  | 'blocked'
  /** the chosen model is not installed, or no chat model is installed at all */
  | 'noModel'
  /** the model answered something we could not use */
  | 'badReply'
  /** no answer in time */
  | 'timeout'
  /** the child pressed Stop */
  | 'stopped'
  /** Ollama itself reported an error (out of memory, a broken model file …) */
  | 'failed'

export class OllamaError extends Error {
  readonly problem: OllamaProblem
  constructor(problem: OllamaProblem, message?: string) {
    super(message ?? problem)
    this.name = 'OllamaError'
    this.problem = problem
  }
}

export type ModelInfo = {
  name: string
  /** bytes on disk */
  size: number
  /** "8B", "4.3B" … when Ollama knows it */
  parameters?: string
  /** false for models that only turn text into numbers (embeddings) */
  chat: boolean
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

/** "localhost:11434/" → "http://localhost:11434" */
export function normalizeHost(host: string): string {
  let h = host.trim() || DEFAULT_HOST
  if (!/^https?:\/\//i.test(h)) h = `http://${h}`
  return h.replace(/\/+$/, '').replace(/\/api$/, '')
}

type TagEntry = {
  name?: string
  model?: string
  size?: number
  capabilities?: string[]
  details?: { family?: string; families?: string[] | null; parameter_size?: string }
}

/** Names of models that only make embeddings, for Ollama versions that do not list capabilities. */
const EMBEDDING_NAME = /embed|(^|[/:-])(bge|e5|gte|minilm|all-minilm)([:-]|$)|arctic-embed|paraphrase/i

/** True when a model can chat. Newer Ollama says so itself; older versions are judged by name and family. */
export function isChatModel(entry: TagEntry): boolean {
  if (Array.isArray(entry.capabilities)) return entry.capabilities.includes('completion')
  const name = entry.name ?? entry.model ?? ''
  const families = [entry.details?.family, ...(entry.details?.families ?? [])].filter(Boolean) as string[]
  if (families.some((f) => /bert/i.test(f))) return false
  return !EMBEDDING_NAME.test(name)
}

/**
 * The model to use: the one picked before if it is still installed, otherwise
 * a small chat model (big enough to follow the rules, at least 1.5 GB),
 * otherwise the biggest chat model there is.
 */
export function pickModel(models: ModelInfo[], wanted?: string | null): string | null {
  const chat = models.filter((m) => m.chat)
  if (wanted && chat.some((m) => m.name === wanted)) return wanted
  if (chat.length === 0) return null
  const bySize = [...chat].sort((a, b) => a.size - b.size)
  return (bySize.find((m) => m.size >= 1.5e9) ?? bySize[bySize.length - 1]).name
}

/** Thinking models sometimes write their thoughts between <think> tags before the answer. */
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^[\s\S]*<\/think>/i, '').trim()
}

/** One signal that fires when the caller stops, or when time runs out. */
function deadline(signal: AbortSignal | undefined, ms: number) {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, ms)
  const stop = () => controller.abort()
  if (signal?.aborted) controller.abort()
  else signal?.addEventListener('abort', stop, { once: true })
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    done: () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', stop)
    },
  }
}

/**
 * The browser says only "failed to fetch" both when nothing is listening and
 * when Ollama refuses this website. A `no-cors` request can tell them apart:
 * it succeeds (with an unreadable answer) whenever the server is there at all.
 */
async function answersAtAll(host: string): Promise<boolean> {
  const { signal, done } = deadline(undefined, 2500)
  try {
    await fetch(`${host}/api/version`, { mode: 'no-cors', signal })
    return true
  } catch {
    return false
  } finally {
    done()
  }
}

async function call(host: string, path: string, init: RequestInit, ms: number, signal?: AbortSignal): Promise<Response> {
  const limit = deadline(signal, ms)
  try {
    return await fetch(`${host}${path}`, { ...init, signal: limit.signal })
  } catch (error) {
    if (signal?.aborted) throw new OllamaError('stopped')
    if (limit.timedOut()) throw new OllamaError('timeout')
    throw new OllamaError((await answersAtAll(host)) ? 'blocked' : 'offline', String(error))
  } finally {
    limit.done()
  }
}

async function errorText(response: Response) {
  try {
    const body = (await response.json()) as { error?: string }
    return body.error ?? response.statusText
  } catch {
    return response.statusText
  }
}

/** The models installed in Ollama, chat models first. */
export async function listModels(hostSetting: string, signal?: AbortSignal): Promise<ModelInfo[]> {
  const host = normalizeHost(hostSetting)
  const response = await call(host, '/api/tags', { method: 'GET' }, LIST_TIMEOUT_MS, signal)
  // a site that is not allowed sometimes gets a readable 403 instead of a blocked request
  if (response.status === 403) throw new OllamaError('blocked')
  if (!response.ok) throw new OllamaError('failed', await errorText(response))
  let body: { models?: TagEntry[] }
  try {
    body = await response.json()
  } catch {
    // something else is listening on that address
    throw new OllamaError('offline', 'not Ollama')
  }
  return (body.models ?? [])
    .map((m) => ({
      name: m.name ?? m.model ?? '',
      size: m.size ?? 0,
      parameters: m.details?.parameter_size || undefined,
      chat: isChatModel(m),
    }))
    .filter((m) => m.name)
    .sort((a, b) => Number(b.chat) - Number(a.chat) || a.name.localeCompare(b.name))
}

/** Loads the model into memory ahead of the first question, so the first answer comes sooner. */
export async function warmUp(hostSetting: string, model: string): Promise<void> {
  const host = normalizeHost(hostSetting)
  try {
    await call(
      host,
      '/api/chat',
      { method: 'POST', body: JSON.stringify({ model, messages: [], keep_alive: '15m' }) },
      CHAT_TIMEOUT_MS,
    )
  } catch {
    // only a head start: the real question reports any problem
  }
}

export type ChatOptions = {
  host: string
  model: string
  messages: ChatMessage[]
  /** a JSON schema the answer must follow (Ollama's structured outputs) */
  format?: object
  signal?: AbortSignal
  timeoutMs?: number
}

/** One question, one complete answer (no streaming). Returns the answer's text. */
export async function chat({ host: hostSetting, model, messages, format, signal, timeoutMs = CHAT_TIMEOUT_MS }: ChatOptions) {
  const host = normalizeHost(hostSetting)
  const send = (thinkSwitch: boolean) =>
    call(
      host,
      '/api/chat',
      {
        method: 'POST',
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          // thinking models answer much faster without thinking first, and the answer stays plain JSON
          ...(thinkSwitch ? { think: false } : {}),
          ...(format ? { format } : {}),
          options: { temperature: 0.2 },
          keep_alive: '15m',
        }),
      },
      timeoutMs,
      signal,
    )

  let response = await send(true)
  if (response.status === 400) {
    // a few older models refuse the `think` switch: ask once more without it
    const text = await errorText(response)
    if (/think/i.test(text)) response = await send(false)
    else throw new OllamaError('failed', text)
  }
  if (response.status === 404) throw new OllamaError('noModel', await errorText(response))
  if (response.status === 403) throw new OllamaError('blocked')
  if (!response.ok) throw new OllamaError('failed', await errorText(response))

  let body: { message?: { content?: string } }
  try {
    body = await response.json()
  } catch {
    throw new OllamaError('badReply', 'not JSON')
  }
  const content = stripThinking(body.message?.content ?? '')
  if (!content) throw new OllamaError('badReply', 'empty answer')
  return content
}
