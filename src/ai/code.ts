import { useAiChat, type ChatTurn } from './store'

const NO_TURNS: ChatTurn[] = []

/** The latest words of the child that changed some pins: the first line of the AI board's code. */
export function useLastRequest(boardId: string): string | null {
  return useAiChat((s) => {
    const turns = s.chats[boardId] ?? NO_TURNS
    for (let i = turns.length - 1; i > 0; i--) {
      const turn = turns[i]
      const before = turns[i - 1]
      if (turn.role === 'ai' && turn.changes.length > 0 && before.role === 'kid') return before.text
    }
    return null
  })
}

/** "// Made from your words:\n// "blink the red light"\n\n", or nothing before the first change. */
export function aiCodeHeader(label: string, request: string | null): string {
  if (!request) return ''
  const words = request.replace(/\s+/g, ' ').trim()
  return `// ${label}\n// "${words.length > 70 ? `${words.slice(0, 69)}…` : words}"\n\n`
}
