import { Particles, ParticlesEffect } from '@animate-ui/react/primitives/effects/particles'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Check } from '@/components/animate-ui/icons/check'
import { PartyPopper } from '@/components/animate-ui/icons/party-popper'
import { RotateCcw } from '@/components/animate-ui/icons/rotate-ccw'
import { Trophy } from '@/components/animate-ui/icons/trophy'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MISSION_IDS, type MissionId } from '@/circuit/missions'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import { useSettings } from '@/store/settings'

function MissionRow({ id, index, done }: { id: MissionId; index: number; done: boolean }) {
  const { t } = useI18n()
  const previous = useRef(done)
  const [burst, setBurst] = useState(false)

  // celebrate only when the mission is completed now, not when the list mounts
  useEffect(() => {
    if (done && !previous.current) {
      setBurst(true)
      const timer = setTimeout(() => setBurst(false), 1400)
      previous.current = done
      return () => clearTimeout(timer)
    }
    previous.current = done
  }, [done])

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 26 }}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-2.5 transition-colors',
        done ? 'border-emerald-500/30 bg-emerald-500/8' : 'bg-card',
      )}
    >
      <Particles animate={burst}>
        <span
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors',
            done ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground',
          )}
        >
          {done ? <Check size={15} animate={burst} /> : index + 1}
        </span>
        <ParticlesEffect count={10} radius={26} duration={0.9} className="size-1.5 rounded-full bg-amber-400" />
      </Particles>
      <span className={cn('flex-1 text-sm leading-snug', done && 'text-muted-foreground')}>
        {t.missions.items[id]}
      </span>
      {done && <Trophy size={16} className="text-amber-500" animate={burst} />}
    </motion.li>
  )
}

export function Missions() {
  const { t } = useI18n()
  const completed = useSettings((s) => s.completed)
  const reset = useSettings((s) => s.resetMissions)
  const done = MISSION_IDS.filter((id) => completed.includes(id)).length
  const total = MISSION_IDS.length
  const allDone = done === total

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="font-bold">{t.missions.title}</h3>
          <span className="text-xs text-muted-foreground">{t.missions.progress(done, total)}</span>
        </div>
        <Progress value={(done / total) * 100} />
      </div>

      {allDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 p-4 text-sm font-semibold text-white shadow-lg"
        >
          <PartyPopper size={28} animate loop />
          {t.missions.allDone}
        </motion.div>
      )}

      <ul className="space-y-2">
        {MISSION_IDS.map((id, index) => (
          <MissionRow key={id} id={id} index={index} done={completed.includes(id)} />
        ))}
      </ul>

      {done > 0 && (
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-muted-foreground">
          <RotateCcw size={14} animateOnHover />
          {t.missions.reset}
        </Button>
      )}
    </div>
  )
}
