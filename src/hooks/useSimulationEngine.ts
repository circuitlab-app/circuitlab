import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { MISSION_IDS, evaluateMissions, type MissionMemory } from '@/circuit/missions'
import { isTimeDependent } from '@/circuit/catalog'
import { DEFAULT_STEP, EMPTY_RESULT, solveCircuit, type PartResult, type SimResult } from '@/circuit/solver'
import type { PartNode, PartType, WireEdge } from '@/circuit/types'
import {
  playClack,
  playClick,
  playPop,
  playSuccess,
  setBellLevel,
  setBuzzerLevel,
  setContinuityBeep,
  setMotorLevel,
  setSiren,
  setSizzle,
  type SirenSound,
  setSpeakerTone,
  setSoundEnabled,
  stopContinuousSounds,
} from '@/lib/sound'
import { currentDictionary, type Dictionary } from '@/i18n'
import { useCircuit } from '@/store/circuit'
import { useSettings } from '@/store/settings'
import { useSimulation } from '@/store/simulation'

/**
 * Only the electrical facts of the board matter to the solver: moving a part
 * around must not trigger a new solve. This key changes exactly when the
 * netlist or a part's electrical state changes.
 */
function electricalKey(nodes: PartNode[], edges: WireEdge[]) {
  const parts = nodes.map(({ id, data: d }) =>
    [
      id,
      d.type,
      d.voltage,
      d.closed,
      d.pressed,
      d.resistance,
      d.level,
      d.burnt,
      d.color,
      d.capacitance,
      d.rating,
      d.light,
      d.sense,
      // a screen's size and brightness set how much current it takes
      d.cols,
      d.rows,
      d.digits,
      d.brightness,
      // bench power supply limit, speaker note, 555 speed
      d.limit,
      d.pitch,
      // a buzzer's beep or siren: not electrical, but the sounds follow each step
      d.sound,
      d.rate,
      // lemons in a row, where the joystick is pushed
      d.cells,
      d.stickX,
      d.stickY,
      // the multimeter's dial changes what it does to the circuit
      d.dial,
      d.pins ? Object.values(d.pins).join('') : '',
    ].join(','),
  )
  const wires = edges.map((e) => [e.id, e.source, e.sourceHandle, e.target, e.targetHandle].join(','))
  return `${parts.join(';')}|${wires.join(';')}`
}

const close = (a: number, b: number, tolerance: number) => Math.abs(a - b) <= tolerance

const sameNumbers = (a: Record<string, number> = {}, b: Record<string, number> = {}, tolerance: number) =>
  Object.keys(a).length === Object.keys(b).length &&
  Object.entries(a).every(([k, value]) => b[k] !== undefined && close(value, b[k], tolerance))

function samePart(a: PartResult, b: PartResult) {
  return (
    sameNumbers(a.pins, b.pins, 1e-3) &&
    sameNumbers(a.pinCurrents, b.pinCurrents, 1e-5) &&
    sameNumbers(a.channels, b.channels, 1e-4) &&
    a.status === b.status &&
    a.damaged === b.damaged &&
    close(a.voltage, b.voltage, 1e-4) &&
    close(a.current, b.current, 1e-6) &&
    close(a.power, b.power, 1e-6) &&
    close(a.level, b.level, 1e-4)
  )
}

/**
 * Keeps the old object for every part and wire whose numbers did not change,
 * so React only re-renders the cards and wires that really changed (and
 * nothing at all when the whole result is the same).
 */
function reuseUnchanged(prev: SimResult, next: SimResult): SimResult {
  let changed =
    prev.shortCircuit !== next.shortCircuit ||
    prev.hasBattery !== next.hasBattery ||
    !close(prev.batteryCurrent, next.batteryCurrent, 1e-6) ||
    Object.keys(prev.parts).length !== Object.keys(next.parts).length ||
    Object.keys(prev.wires).length !== Object.keys(next.wires).length

  const parts: SimResult['parts'] = {}
  for (const [id, r] of Object.entries(next.parts)) {
    const old = prev.parts[id]
    if (old && samePart(old, r)) parts[id] = old
    else {
      parts[id] = r
      changed = true
    }
  }
  const wires: SimResult['wires'] = {}
  for (const [id, amps] of Object.entries(next.wires)) {
    const old = prev.wires[id]
    if (old !== undefined && close(old, amps, 1e-6)) wires[id] = old
    else {
      wires[id] = amps
      changed = true
    }
  }
  return changed ? { ...next, parts, wires } : prev
}

/** How often the board is re-solved while something changes over time. */
const TICK_MS = 50

function burntMessage(type: PartType, t: Dictionary) {
  if (type === 'led') return t.toasts.ledBurnt
  if (type === 'lamp') return t.toasts.lampBurnt
  if (type === 'fuse') return t.toasts.fuseBlown
  return t.toasts.partBurnt
}

export function useSimulationEngine() {
  const key = useCircuit((s) => electricalKey(s.nodes, s.edges))
  const running = useSimulation((s) => s.running)
  const sound = useSettings((s) => s.sound)
  const wasShort = useRef(false)
  const memory = useRef<MissionMemory>({ motorForward: false, motorBackward: false })
  /** simulated seconds: drives the Arduino programs */
  const clock = useRef(0)
  /** each capacitor's voltage, carried from one step to the next */
  const charge = useRef<Record<string, number>>({})
  /** what each Arduino read on A0 in the last step */
  const readings = useRef<Record<string, number>>({})
  /** relays, logic chips and power supplies: the state they were left in */
  const switches = useRef<Record<string, number>>({})

  useEffect(() => setSoundEnabled(sound), [sound])
  useEffect(() => stopContinuousSounds, [])

  useEffect(() => {
    if (!running) {
      useSimulation.setState({ result: EMPTY_RESULT })
      stopContinuousSounds()
      wasShort.current = false
      charge.current = {}
      readings.current = {}
      switches.current = {}
      return
    }

    const step = (dt: number) => {
      const { nodes, edges, updatePart } = useCircuit.getState()
      const t = currentDictionary()

      const fresh = solveCircuit(
        nodes.map((n) => ({ id: n.id, data: n.data })),
        edges,
        { time: clock.current, dt, capacitors: charge.current, inputs: readings.current, states: switches.current },
      )
      charge.current = fresh.capacitors
      readings.current = fresh.inputs
      switches.current = fresh.states
      const previous = useSimulation.getState().result
      const result = reuseUnchanged(previous, fresh)
      if (result !== previous) useSimulation.setState({ result })

      // a relay clicks when its switch moves
      for (const node of nodes) {
        if (node.data.type !== 'relay') continue
        const before = previous.parts[node.id]?.level ?? 0
        const now = result.parts[node.id]?.level ?? 0
        if (before !== now) playClick(now === 1)
      }
      // a solenoid's rod clacks out and back
      for (const node of nodes) {
        if (node.data.type !== 'solenoid') continue
        const before = (previous.parts[node.id]?.level ?? 0) > 0
        const now = (result.parts[node.id]?.level ?? 0) > 0
        if (before !== now) playClack(now)
      }

      // parts that received too much power burn out (this re-runs the solver).
      // A blown fuse cuts the power first, so it protects everything else.
      const damaged = nodes.filter((n) => result.parts[n.id]?.damaged && !n.data.burnt)
      const fuses = damaged.filter((n) => n.data.type === 'fuse')
      for (const node of fuses.length > 0 ? fuses : damaged) {
        updatePart(node.id, { burnt: true }, { history: false })
        playPop()
        toast.error(burntMessage(node.data.type, t), { id: `burnt-${node.id}` })
      }

      if (result.shortCircuit && !wasShort.current) {
        toast.warning(t.toasts.short, { id: 'short-circuit' })
      }
      wasShort.current = result.shortCircuit
      setSizzle(result.shortCircuit)

      // continuous sounds
      let buzz = 0
      let siren = 0
      let loudestSiren = 0
      let sirenSound: SirenSound = 'wail'
      let hum = 0
      let tone = 0
      let pitch = 0
      let loudest = 0
      let ring = 0
      let beeping = false
      for (const node of nodes) {
        const r = result.parts[node.id]
        if (!r) continue
        if (node.data.type === 'buzzer') {
          const sound = node.data.sound ?? 'beep'
          if (sound === 'beep') buzz += r.level
          else {
            siren += r.level
            // the loudest siren picks the sound
            if (r.level > loudestSiren) {
              loudestSiren = r.level
              sirenSound = sound
            }
          }
        }
        if (node.data.type === 'motor') hum = Math.max(hum, Math.abs(r.level))
        // a coin motor only buzzes softly
        if (node.data.type === 'vibration') hum = Math.max(hum, Math.abs(r.level) * 0.5)
        // a fan whirs and a pump hums quietly
        if (node.data.type === 'fan' || node.data.type === 'pump') hum = Math.max(hum, Math.abs(r.level) * 0.4)
        if (node.data.type === 'bell') ring += r.level
        if (node.data.type === 'multimeter' && r.channels?.beep === 1) beeping = true
        if (node.data.type === 'speaker' && !node.data.burnt) {
          tone += r.level
          // the loudest speaker picks the note
          if (r.level > loudest) {
            loudest = r.level
            pitch = node.data.pitch ?? 523
          }
        }
      }
      setBuzzerLevel(buzz)
      setSiren(siren, sirenSound)
      setMotorLevel(hum)
      setSpeakerTone(tone, pitch)
      setBellLevel(ring)
      setContinuityBeep(beeping)

      // missions
      for (const node of nodes) {
        if (node.data.type !== 'motor') continue
        const level = result.parts[node.id]?.level ?? 0
        if (level > 0.3) memory.current.motorForward = true
        if (level < -0.3) memory.current.motorBackward = true
      }
      const { completed, completeMission } = useSettings.getState()
      const done = evaluateMissions(nodes, result, memory.current)
      for (const id of MISSION_IDS) {
        if (!done.has(id) || completed.includes(id)) continue
        completeMission(id)
        playSuccess()
        toast.success(t.toasts.mission, { description: t.missions.items[id], id: `mission-${id}` })
      }
    }

    step(DEFAULT_STEP)

    // only boards with blinking pins or capacitors need a clock
    if (!useCircuit.getState().nodes.some((n) => isTimeDependent(n.data))) return
    let last = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      // a hidden tab does no work; time simply waits for it
      if (document.visibilityState === 'hidden') {
        last = now
        return
      }
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      clock.current += dt
      step(dt)
    }, TICK_MS)
    return () => window.clearInterval(timer)
  }, [key, running])
}
