import { useEffect } from 'react'
import { playClick } from '@/lib/sound'
import { selectSelectedPart, useCircuit } from '@/store/circuit'

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

/** Board-wide keyboard shortcuts (Delete/Backspace are handled by React Flow). */
export function useShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return
      const state = useCircuit.getState()
      const mod = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()
      const part = selectSelectedPart(state)

      if (mod && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) state.redo()
        else state.undo()
      } else if (mod && key === 'y') {
        event.preventDefault()
        state.redo()
      } else if (mod && key === 'd' && part) {
        event.preventDefault()
        state.duplicatePart(part.id)
      } else if (!mod && key === 'r' && part) {
        state.rotatePart(part.id)
      } else if (!mod && event.key === ' ' && (part?.data.type === 'switch' || part?.data.type === 'slideSwitch')) {
        event.preventDefault()
        state.updatePart(part.id, { closed: !part.data.closed })
        playClick(!part.data.closed)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
