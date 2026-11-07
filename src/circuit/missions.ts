import { SENSOR_MODES, isBoard } from './catalog'
import type { SimResult } from './solver'
import type { PartNode, PartType } from './types'

export type MissionId =
  | 'light'
  | 'flashlight'
  | 'motor'
  | 'reverse'
  | 'led'
  | 'doorbell'
  | 'parallel'
  | 'dimmer'
  | 'meter'
  | 'blink'
  | 'transistor'
  | 'capacitor'
  | 'servo'
  | 'sensor'
  | 'screen'

export const MISSION_IDS: MissionId[] = [
  'light',
  'flashlight',
  'motor',
  'reverse',
  'led',
  'doorbell',
  'parallel',
  'dimmer',
  'meter',
  'blink',
  'transistor',
  'capacitor',
  'servo',
  'sensor',
  'screen',
]

/** Things that can only be judged over time (e.g. the motor spun both ways). */
export type MissionMemory = { motorForward: boolean; motorBackward: boolean }

export function evaluateMissions(
  nodes: PartNode[],
  result: SimResult,
  memory: MissionMemory,
): Set<MissionId> {
  const done = new Set<MissionId>()
  const of = (type: PartType) =>
    nodes
      .filter((n) => n.data.type === type && !n.data.burnt)
      .map((n) => ({ node: n, r: result.parts[n.id] }))
      .filter((x) => x.r !== undefined)

  const lamps = of('lamp')
  const litLamps = lamps.filter(({ r }) => r.level > 0.3 && !r.damaged)
  const litLeds = of('led').filter(({ r }) => r.status === 'on')
  const carries = (type: PartType, min: number) =>
    of(type).some(({ r }) => Math.abs(r.current) > min)

  if (litLamps.length > 0) done.add('light')
  if (litLamps.some(({ r }) => r.level > 0.5) && carries('switch', 0.05)) done.add('flashlight')
  if (of('motor').some(({ r }) => Math.abs(r.level) > 0.3)) done.add('motor')
  if (memory.motorForward && memory.motorBackward) done.add('reverse')
  if (litLeds.length > 0) done.add('led')
  if (of('buzzer').some(({ r }) => r.status === 'on') && carries('button', 0.01)) done.add('doorbell')
  if (lamps.filter(({ r }) => r.level >= 0.8 && !r.damaged).length >= 2) done.add('parallel')
  if (litLamps.length > 0 && carries('dimmer', 0.02)) done.add('dimmer')

  // measure a real voltage with the voltmeter
  if (of('voltmeter').some(({ r }) => Math.abs(r.level) > 1)) done.add('meter')

  // an LED lit by a blinking Arduino pin
  const boards = nodes
    .filter((n) => isBoard(n.data.type))
    .map((n) => ({ node: n, r: result.parts[n.id] }))
    .filter((x) => x.r !== undefined)
  const blinking = boards.some(({ node }) => Object.values(node.data.pins ?? {}).includes('blink'))
  if (blinking && litLeds.length > 0) done.add('blink')

  // a transistor switching a real load on
  if (of('transistor').some(({ r }) => r.status === 'on' && r.current > 0.02)) done.add('transistor')

  // a light kept on by a capacitor alone: no source is delivering, the capacitor is
  const capacitorPowered = of('capacitor').some(({ r }) => r.current < -1e-3)
  if (capacitorPowered && result.batteryCurrent < 1e-3 && (litLeds.length > 0 || litLamps.length > 0)) {
    done.add('capacitor')
  }

  // a powered servo turned to some angle by its signal
  if (of('servo').some(({ r }) => r.status === 'on' && r.level > 0.1)) done.add('servo')

  // a working sensor read by the Arduino, which then switches something on
  const following = boards.some(({ node, r }) =>
    Object.entries(node.data.pins ?? {}).some(([pin, mode]) => SENSOR_MODES.includes(mode) && (r.pins?.[pin] ?? 0) > 0.5),
  )
  const sensing = nodes.some((n) => n.data.type !== 'ldr' && result.parts[n.id]?.status === 'on' && n.data.sense !== undefined)
  if (following && sensing && (litLeds.length > 0 || litLamps.length > 0 || of('buzzer').some(({ r }) => r.status === 'on'))) {
    done.add('sensor')
  }

  // a powered screen showing a photo or video the child added
  const showsMedia = (['oled', 'tft', 'ledwall'] as PartType[]).some((type) =>
    of(type).some(({ node, r }) => r.status === 'on' && node.data.mode === 'picture' && !!node.data.media),
  )
  if (showsMedia) done.add('screen')

  return done
}
