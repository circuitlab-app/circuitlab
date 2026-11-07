import type { OllamaProblem } from '@/ai/ollama'
import type { LampColor, LedColor } from '@/circuit/types'

/** A setup step: what to do, and the command to type for it (if any). */
export type SetupStep = { text: string; command?: string }

/** Everyday names for the parts the AI board's ideas talk about. */
export type AiNoun = 'light' | 'lamp' | 'motor' | 'fan' | 'pump' | 'vibration' | 'solenoid' | 'magnet'

/** Words for the AI board: its card, its chat and the help for starting Ollama. */
export type AiBook = {
  /** the card's button that opens the chat (one short word) */
  ask: string
  /** the same button for screen readers */
  askLabel: string
  /** the card's state word while the AI works out an answer (short: it shares the title row) */
  thinking: string
  /** heading of the chat in the details panel */
  title: string
  /** clears the chat */
  clear: string
  /** the board's first words when the chat is empty */
  hello: string
  placeholder: string
  send: string
  stop: string
  /** shown with a seconds counter while the model works */
  thinkingNow: string
  seconds: (n: number) => string
  /** who said it, for screen readers */
  you: string
  helper: string
  /** above the list of pins the answer changed */
  changed: string
  /** the answer changed no pins */
  noChange: string
  /** a pin change, for screen readers: "P1: off to blink" */
  changeLabel: (pin: string, from: string, to: string) => string
  /** above the ideas for what to ask */
  tryThese: string
  connection: {
    checking: string
    ready: string
    /** the model picker's label */
    model: string
    retry: string
    /** Ollama's address, for a computer that runs it somewhere else */
    address: string
  }
  setup: {
    offlineTitle: string
    offlineSteps: SetupStep[]
    blockedTitle: string
    blockedText: string
    /** the command that lets this website in, for `origin` */
    blockedCommand: (origin: string) => string
    noModelTitle: string
    noModelSteps: SetupStep[]
    /** a note for Circuit Lab opened from a website instead of this computer */
    websiteNote: string
    copy: string
    copied: string
  }
  problems: Record<OllamaProblem, string>
  /** a tip when nothing is wired to the board's pins yet */
  noParts: string
  privacy: string
  mayBeWrong: string
  /** heading of the code view on the AI board */
  codeTitle: string
  /** the code's first comment line: the child's words that made it */
  codeFrom: string
  /** the ideas under the chat; `thing` is a part's name, like "the red light" */
  ideas: {
    whenDark: (thing: string) => string
    whenSensedBeep: string
    whenSensedLight: (thing: string) => string
    trafficLight: string
    blink: (thing: string) => string
    takeTurns: string
    slowly: (thing: string) => string
    allOff: string
    whatIsConnected: string
    howToConnect: string
  }
  nouns: Record<AiNoun, string>
  /** "the red light": a noun with its colour, ready to drop into an idea */
  thing: (noun: string, color?: LampColor | LedColor) => string
}
