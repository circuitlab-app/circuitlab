import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

/*
 * Screens animate only when someone can see them: the part has power, the
 * simulation runs, the tab is visible and the card is on screen. Everything
 * else costs nothing.
 */

function useTabVisible() {
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden')
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return visible
}

/** True while `wanted`, the element is on screen and the tab is visible. */
export function useLive(ref: RefObject<Element | null>, wanted: boolean): boolean {
  const [onScreen, setOnScreen] = useState(false)
  const tabVisible = useTabVisible()
  useEffect(() => {
    const element = ref.current
    if (!element) return
    // watch for the element's whole life: an observer that only ran while `wanted`
    // could miss the element scrolling into view and keep a stale "off screen"
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return wanted && onScreen && tabVisible
}

/**
 * Calls `frame` about `fps` times a second while `live`. Slow rates (a clock)
 * use a timer instead of waking up on every screen refresh.
 */
export function useFrameLoop(live: boolean, fps: number, frame: (now: number) => void) {
  const latest = useRef(frame)
  useLayoutEffect(() => {
    latest.current = frame
  })

  useEffect(() => {
    if (!live || fps <= 0) return
    const interval = 1000 / fps
    if (fps <= 5) {
      latest.current(performance.now())
      const timer = window.setInterval(() => latest.current(performance.now()), interval)
      return () => window.clearInterval(timer)
    }
    let raf = 0
    let last = -Infinity
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      // a couple of ms early is fine: refresh ticks never land exactly on time
      if (now - last < interval - 3) return
      last = now
      latest.current(now)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [live, fps])
}

/** A device-pixel scale for crisp canvases, a little higher so zooming in stays sharp. */
export const canvasScale = () => Math.min(4, Math.max(2, Math.ceil((window.devicePixelRatio || 1) * 1.5)))
