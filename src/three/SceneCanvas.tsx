import { View } from '@react-three/drei'
import { Canvas, useFrame, type RootState } from '@react-three/fiber'
import { useStoreApi } from '@xyflow/react'
import { useEffect, useRef } from 'react'
import { isTimeDependent } from '@/circuit/catalog'
import type { SimResult } from '@/circuit/solver'
import type { PartNode } from '@/circuit/types'
import { useCircuit } from '@/store/circuit'
import { useSimulation } from '@/store/simulation'
import { anyThinking, useAiChat } from '@/ai/store'

/** Views render at this priority; the clear pass runs just before them. */
export const VIEW_PRIORITY = 2

/** After any change, draw at full speed for this long so eased transitions stay smooth. */
const SETTLE_MS = 1200
/** Speed for parts that move on their own (spinning motor, battery sparkles, smoke). */
const AMBIENT_FPS = 30

/**
 * drei's <View> draws every view into its own scissor rectangle but never
 * clears the rest of the canvas. Without this pass a part that is dragged
 * across the board would leave a trail of old frames behind.
 */
function ClearPass() {
  useFrame(({ gl }) => {
    gl.setScissorTest(false)
    gl.setClearColor(0x000000, 0)
    gl.clear(true, true, true)
  }, VIEW_PRIORITY - 1)
  return null
}

/** True while some part keeps moving by itself, so the canvas must keep drawing. */
function hasAmbientMotion(nodes: PartNode[], result: SimResult) {
  return nodes.some(({ id, data }) => {
    if (data.burnt) return true // smoke
    // blinking pins and charging capacitors change many times a second
    if (isTimeDependent(data)) return true
    const r = result.parts[id]
    if (!r) return false
    switch (data.type) {
      case 'gasSensor':
        return r.status === 'on' && (data.sense ?? 0) > 0.3 // smoke puffs
      case 'battery':
        return r.status === 'on' || r.status === 'short' // sparkles, smoke
      case 'motor':
        return Math.abs(r.level) > 0.02 || r.status === 'over'
      case 'buzzer':
      case 'speaker':
        return r.level > 0 // sound rings, a pumping cone
      case 'vibration':
        return Math.abs(r.level) > 0.02 || r.status === 'over' // shaking, smoke
      case 'electromagnet':
        return Math.abs(r.level) > 0.05 // dots running along the field lines
      case 'resistor':
      case 'dimmer':
      case 'regulator':
        return r.status === 'over' // smoke
      case 'flameSensor':
        return (data.sense ?? 0) > 0.02 // a flickering flame
      case 'rainSensor':
        return (data.sense ?? 0) > 0.03 // falling drops
      case 'knockSensor':
        return (data.sense ?? 0) > 0.5 // the mallet tapping
      case 'dynamo':
        return (data.level ?? 0) > 0.01 // the crank turning
      case 'powerBank':
        return r.status === 'over' // its lights blink at the limit
      case 'fan':
        return r.level > 0.02 || r.status === 'over' // spinning blades and air, smoke
      case 'pump':
        return r.level > 0 // flowing water
      case 'bell':
        return r.level > 0 || r.status === 'over' // the hammer ringing, smoke
      case 'solenoid':
      case 'mosfet':
      case 'hBridge':
        return r.status === 'over' // smoke
      default:
        return false
    }
  })
}

/**
 * Draws the canvas only when something changed, instead of on every screen
 * refresh: an idle board costs nothing, a board with a spinning motor draws at
 * AMBIENT_FPS, and for a moment after any change (new results, a moved part,
 * panning, zooming, resizing) it draws at full speed.
 */
function useFrameScheduler(root: React.RefObject<RootState | null>) {
  const flowStore = useStoreApi()

  useEffect(() => {
    let raf = 0
    let busyUntil = 0
    let lastDraw = 0
    let ambient = false

    const draw = (now: number) => {
      const state = root.current
      if (!state) return
      // after a pause, restart the clock so eased animations do not jump
      if (now - lastDraw > 100) state.clock.getDelta()
      state.invalidate()
      lastDraw = now
    }

    const loop = (now: number) => {
      raf = 0
      if (now < busyUntil) draw(now)
      else if (ambient && now - lastDraw >= 1000 / AMBIENT_FPS - 2) draw(now)
      if (now < busyUntil || ambient) raf = requestAnimationFrame(loop)
    }

    const wake = () => {
      busyUntil = performance.now() + SETTLE_MS
      if (!raf) raf = requestAnimationFrame(loop)
    }

    const updateAmbient = () => {
      // a paused board is frozen: nothing needs drawing until something changes
      const { running, result } = useSimulation.getState()
      // an AI board's ring of lights runs while its model thinks, even on a paused board
      ambient = (running && hasAmbientMotion(useCircuit.getState().nodes, result)) || anyThinking()
      if (ambient && !raf) raf = requestAnimationFrame(loop)
    }

    const unsubscribers = [
      useSimulation.subscribe((s, prev) => {
        updateAmbient()
        // ticking boards are already drawn at the ambient rate; a full-speed
        // window on every tick would never end
        if (s.running !== prev.running || (s.result !== prev.result && !ambient)) wake()
      }),
      useCircuit.subscribe((s, prev) => {
        if (s.nodes === prev.nodes && s.edges === prev.edges) return
        updateAmbient()
        wake()
      }),
      // panning and zooming move every view
      flowStore.subscribe((s, prev) => {
        if (s.transform !== prev.transform) wake()
      }),
      // an AI board starts or stops thinking; the wake lets its ring fade out smoothly
      useAiChat.subscribe((s, prev) => {
        if (s.pending === prev.pending) return
        updateAmbient()
        wake()
      }),
    ]
    window.addEventListener('resize', wake)
    updateAmbient()
    wake()

    return () => {
      cancelAnimationFrame(raf)
      unsubscribers.forEach((off) => off())
      window.removeEventListener('resize', wake)
    }
  }, [root, flowStore])
}

/**
 * One shared WebGL canvas for the whole board. Every part node registers a
 * <View> that tracks its DOM box, so 40 parts still cost a single WebGL
 * context. The canvas sits above the nodes but ignores the pointer, so all
 * clicks and drags still reach React Flow.
 *
 * It covers the whole window (not just the board) because drei's off-screen
 * check compares view positions with the canvas size as if the canvas started
 * at 0,0. The side panels and bars are stacked above it, so 3D never shows
 * outside the board.
 */
export default function SceneCanvas() {
  const root = useRef<RootState | null>(null)
  useFrameScheduler(root)
  return (
    <Canvas
      frameloop="demand"
      onCreated={(state) => {
        root.current = state
      }}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 4 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      aria-hidden
    >
      <ClearPass />
      <View.Port />
    </Canvas>
  )
}
