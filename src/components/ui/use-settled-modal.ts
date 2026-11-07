import { useCallback } from 'react'

/**
 * Marks a dialog `data-settled` once its opening animation is over, so CSS
 * can take away the 3D transform and the blur filter it ends on (see
 * index.css). Those look the same as none at all, but they keep the dialog a
 * 3D layer, and its text shimmers and jumps while it scrolls.
 *
 * The animation is over when nothing runs on the element any more, it is
 * fully shown and its tilt is back upright; after 1.5 s it counts as over
 * anyway. It is a ref callback, so it starts each time the dialog appears.
 */
export function useSettledModal<T extends HTMLElement>() {
  return useCallback((el: T | null) => {
    if (!el) return
    const start = performance.now()
    let frame = 0
    const check = () => {
      const elapsed = performance.now() - start
      const running = el.getAnimations().some((a) => a.playState === 'running')
      const shown = Number(getComputedStyle(el).opacity) > 0.99
      // motion writes each frame of the tilt into the style; upright is rotateX(0deg)
      const upright = !/rotate[XY]\((?!0deg)/.test(el.style.transform)
      if ((elapsed > 100 && !running && shown && upright) || elapsed > 1500) el.setAttribute('data-settled', '')
      else frame = requestAnimationFrame(check)
    }
    frame = requestAnimationFrame(check)
    return () => cancelAnimationFrame(frame)
  }, [])
}
