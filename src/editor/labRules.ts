import { ELECTRICAL, LED_COLORS, RADIOS, isRadio } from '@/circuit/catalog'
import type { PartResult, PartStatus } from '@/circuit/solver'
import type { LedColor, PartData, PartType } from '@/circuit/types'
import type { Dictionary } from '@/i18n'

/*
 * Rules for the newer parts' cards and details panel that are not components:
 * which parts have their own card row, the glow they throw on the board and
 * the tip for what is happening. The rows and panels are in LabControls and
 * LabInspector.
 */

/** The parts whose card row lives in LabControls. */
const LAB_CONTROLS = new Set<PartType>([
  'zener',
  'mosfet',
  'optocoupler',
  'irLed',
  'solenoid',
  'pump',
  'bell',
  'fan',
  'barGraph',
  'trafficLight',
  'latch',
  'counter',
  'comparator',
  'hBridge',
  'multimeter',
  'logicProbe',
  'gsm',
  'wifi',
  'bluetooth',
  'lora',
  'gps',
  'canBus',
  'rs485',
  'beacon',
  'heater',
])

export const hasLabControl = (type: PartType) => LAB_CONTROLS.has(type)

/** The glow a newer part throws onto the board around it, or null. */
export function labGlow(data: PartData, result?: PartResult): string | null {
  switch (data.type) {
    case 'laser':
      return '#ff3030'
    case 'irLed':
      // only a camera sees it
      return data.camera ? '#c084fc' : null
    case 'beacon':
      return LED_COLORS[(data.color as LedColor) ?? 'orange'] ?? LED_COLORS.orange
    case 'heater':
      // the warm orange of a glowing coil
      return '#ff6a1a'
    case 'trafficLight': {
      const c = result?.channels
      if (!c) return null
      const top = Math.max(c.R ?? 0, c.Y ?? 0, c.G ?? 0)
      if (top <= 0) return null
      return top === c.R ? '#ff4d4d' : top === c.Y ? '#ffd21f' : '#22e06b'
    }
    default:
      return null
  }
}

type Tip = { text: string; tone: 'warn' | 'info' | 'danger' }

/** The chips' supply: a tip when they have no power, too little, or it is the wrong way round. */
function chipSupplyTip(status: PartStatus, result: PartResult, min: number, t: Dictionary): Tip | null {
  const w = t.workshop.tips
  if (status === 'reverse') return { text: w.chipReverse, tone: 'warn' }
  if (status === 'weak') return { text: w.chipWeak, tone: 'info' }
  if (result.voltage < min) return { text: w.chipPower, tone: 'info' }
  return null
}

/**
 * The tip for one of the newer parts, null when all is well, or undefined
 * when the part is not one of them.
 */
export function labTip(data: PartData, result: PartResult, status: PartStatus, t: Dictionary): Tip | null | undefined {
  const lab = t.lab.tips
  const info = (text: string): Tip => ({ text, tone: 'info' })
  const warn = (text: string): Tip => ({ text, tone: 'warn' })
  if (isRadio(data.type)) {
    const r = t.radio.tips
    if (status === 'reverse') return warn(t.workshop.tips.chipReverse)
    if (status !== 'on') return info(r.power)
    const c = result.channels ?? {}
    if ((c.link ?? 0) < 0.5) return info(r.joining[data.type])
    if (RADIOS[data.type].onEvent) {
      if (c.progress !== undefined) return info(r.sending)
      if ((c.sent ?? 0) > 0) return info(r.sent)
    }
    return info(r.ready[data.type])
  }
  switch (data.type) {
    case 'zener':
      if (status === 'over') return warn(lab.zenerHot)
      if (status === 'reverse') return warn(lab.zenerForward)
      if (status === 'idle') return info(Math.abs(result.voltage) > 0.3 ? lab.zenerLow : lab.zenerHint)
      return null
    case 'pnp':
      return status === 'idle' ? info(lab.pnpBase) : null
    case 'mosfet':
      if (status === 'over') return warn(lab.mosfetHot)
      if (status === 'weak') return info(lab.mosfetHalf)
      return status === 'idle' ? info(lab.mosfetGate) : null
    case 'optocoupler':
      if (status === 'reverse') return warn(t.tips.ledReverse)
      if (status === 'over') return warn(t.tips.ledOver)
      return status === 'idle' ? info(lab.optoHint) : null
    case 'laser':
      if (status === 'reverse') return warn(t.tips.ledReverse)
      if (status === 'over') return warn(t.tips.ledOver)
      if (status === 'weak') return info(lab.laserWeak)
      return status === 'on' ? warn(lab.laserSafety) : null
    case 'irLed':
      if (status === 'reverse') return warn(t.tips.ledReverse)
      if (status === 'over') return warn(t.tips.ledOver)
      if (status === 'on' || status === 'weak') return info(data.camera ? lab.irCamera : lab.irEyes)
      return null
    case 'solenoid':
      if (status === 'over') return warn(lab.solenoidHot)
      return status === 'weak' ? info(lab.solenoidWeak) : null
    case 'pump':
      if (status === 'over') return warn(t.tips.motorOver)
      return status === 'weak' ? info(lab.pumpWeak) : null
    case 'bell':
      if (status === 'over') return warn(lab.bellHot)
      return status === 'weak' ? info(lab.bellWeak) : null
    case 'fan':
      if (status === 'reverse') return warn(lab.fanReverse)
      if (status === 'over') return warn(t.tips.motorOver)
      return status === 'weak' ? info(lab.fanWeak) : null
    case 'barGraph':
      if (status === 'reverse') return warn(t.workshop.tips.chipReverse)
      if (status !== 'on') return info(lab.modulePower)
      return (result.channels?.IN ?? 0) < 0.05 ? info(lab.barHint) : null
    case 'trafficLight':
      if (status === 'over') return warn(t.tips.ledOver)
      return status === 'idle' || status === 'reverse' ? info(lab.trafficHint) : null
    case 'latch':
      return chipSupplyTip(status, result, ELECTRICAL.logic.minVoltage, t) ?? (status === 'idle' ? info(lab.latchHint) : null)
    case 'counter':
      return chipSupplyTip(status, result, ELECTRICAL.logic.minVoltage, t) ?? (result.level === 0 ? info(lab.counterHint) : null)
    case 'comparator':
      return chipSupplyTip(status, result, ELECTRICAL.logic.minVoltage, t) ?? (status === 'idle' ? info(lab.comparatorHint) : null)
    case 'hBridge':
      if (status === 'over') return warn(lab.bridgeHot)
      return chipSupplyTip(status, result, ELECTRICAL.hBridge.minVoltage, t) ?? (status === 'idle' ? info(lab.bridgeHint) : null)
    case 'multimeter': {
      const dial = data.dial ?? 'volts'
      if (dial === 'volts') return status === 'reverse' ? info(lab.meterReverse) : status === 'idle' ? info(lab.meterVolts) : null
      if (dial === 'amps') {
        if (status === 'over') return { text: lab.meterAmpsShort, tone: 'danger' }
        return status === 'reverse' ? info(lab.meterReverse) : status === 'idle' ? info(lab.meterAmps) : null
      }
      if (result.channels?.outside === 1) return warn(lab.meterOutside)
      if (status === 'idle') return info(lab.meterOhms)
      return dial === 'beep' && result.channels?.beep === 1 ? info(lab.meterBeep) : null
    }
    case 'heater':
      if (status === 'over') return warn(lab.heaterHot)
      return status === 'idle' || status === 'weak' ? info(lab.heaterHint) : null
    case 'beacon':
      if (status === 'reverse') return warn(t.tips.ledReverse)
      if (status === 'over') return warn(lab.beaconHot)
      return status === 'idle' ? info(lab.beaconHint) : null
    case 'logicProbe':
      if (status === 'reverse') return warn(t.workshop.tips.chipReverse)
      if (status !== 'on') return info(lab.probePower)
      return result.level === 0.5 ? info(lab.probeLoose) : null
    default:
      return undefined
  }
}

/** Parts in this file that have nothing to set in the details panel. */
export const LAB_WITHOUT_SETTINGS: readonly PartType[] = [
  'zener',
  'pnp',
  'mosfet',
  'optocoupler',
  'laser',
  'solenoid',
  'pump',
  'bell',
  'barGraph',
  'trafficLight',
  'fan',
  'nandGate',
  'norGate',
  'latch',
  'counter',
  'comparator',
  'hBridge',
  'logicProbe',
  // only the SMS module has something to set: its message and phone number
  'wifi',
  'bluetooth',
  'lora',
  'gps',
  'canBus',
  'rs485',
  'heater',
]
