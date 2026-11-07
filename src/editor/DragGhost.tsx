import { useReactFlow } from '@xyflow/react'
import { AnimatePresence, motion, useMotionValue } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { PARTS, partHeight, partWidth } from '@/circuit/catalog'
import type { PartType } from '@/circuit/types'
import { useI18n } from '@/i18n'
import { playPlace } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { useCircuit } from '@/store/circuit'
import { useDrag } from '@/store/drag'
import { PartArt } from './PartArt'

const BOARD_SELECTOR = '[data-board]'
const TAP_DISTANCE = 6

function boardRect() {
  return document.querySelector(BOARD_SELECTOR)?.getBoundingClientRect() ?? null
}

/** Adds parts either under the pointer or in the middle of the visible board. */
export function usePlacePart() {
  const { screenToFlowPosition } = useReactFlow()
  const addPart = useCircuit((s) => s.addPart)

  const placeAt = useCallback(
    (type: PartType, clientX: number, clientY: number) => {
      const p = screenToFlowPosition({ x: clientX, y: clientY })
      // centred under the pointer; screens have bigger cards than the other parts
      addPart(type, { x: p.x - partWidth(type) / 2, y: p.y - partHeight(type) / 2 })
      playPlace()
    },
    [addPart, screenToFlowPosition],
  )

  const placeCenter = useCallback(
    (type: PartType) => {
      const rect = boardRect()
      if (!rect) return
      const jitter = () => (Math.random() - 0.5) * 120
      placeAt(type, rect.left + rect.width / 2 + jitter(), rect.top + rect.height / 2 + jitter())
    },
    [placeAt],
  )

  return { placeAt, placeCenter }
}

/** Follows the pointer while a part is dragged out of the parts box. */
export function DragGhost() {
  const { t } = useI18n()
  const type = useDrag((s) => s.type)
  const overBoard = useDrag((s) => s.overBoard)
  const [visible, setVisible] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const { placeAt, placeCenter } = usePlacePart()

  useEffect(() => {
    if (!type) return
    const { origin, setOverBoard, end } = useDrag.getState()
    x.set(origin.x)
    y.set(origin.y)
    let moved = false

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      if (!moved && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > TAP_DISTANCE) {
        moved = true
        setVisible(true)
      }
      const rect = boardRect()
      setOverBoard(
        !!rect &&
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom,
      )
    }
    const finish = () => {
      setVisible(false)
      end()
    }
    const onUp = (e: PointerEvent) => {
      if (useDrag.getState().overBoard) placeAt(type, e.clientX, e.clientY)
      else if (!moved) placeCenter(type)
      finish()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish()

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', finish)
    window.addEventListener('keydown', onKey)
    document.documentElement.classList.add('is-dragging-part')
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', finish)
      window.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('is-dragging-part')
    }
  }, [type, x, y, placeAt, placeCenter])

  return createPortal(
    <AnimatePresence>
      {type && visible && (
        <motion.div
          key="ghost"
          className="pointer-events-none fixed top-0 left-0 z-[100]"
          style={{ x, y }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: 0 }}
            animate={{ opacity: 1, scale: overBoard ? 1.08 : 1, rotate: overBoard ? 0 : -6 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ type: 'spring', stiffness: 520, damping: 28 }}
            className={cn(
              '-translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-lg border bg-card/95 py-2 ps-2 pe-4 shadow-2xl backdrop-blur',
              overBoard && 'border-primary ring-4 ring-primary/20',
            )}
          >
            <span
              className="grid size-11 place-items-center rounded-xl"
              style={{ background: `color-mix(in oklch, ${PARTS[type].accent} 10%, var(--card))` }}
            >
              <PartArt partType={type} size={36} />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-bold">{t.parts[type].name}</span>
              <span className={cn('text-[11px] text-muted-foreground', overBoard && 'text-primary')}>
                {overBoard ? t.drag.drop : t.sidebar.hint}
              </span>
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
