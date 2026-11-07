import type { ToolId } from './catalog'

/*
 * "Which tool?": real moments at the workbench. Each question has one right
 * tool and two or three that look possible but are not the best pick. The
 * words (the situation and the reason) live in src/i18n/toolbox/.
 */

export const QUIZ = [
  { id: 'full', answer: 'multimeter', others: ['calipers', 'solderingIron'] },
  { id: 'forever', answer: 'solderingIron', others: ['crocClips', 'jumperWires'] },
  { id: 'tryIdea', answer: 'breadboard', others: ['pcb', 'hotGlue'] },
  { id: 'coat', answer: 'wireStripper', others: ['sideCutters', 'pliers'] },
  { id: 'legs', answer: 'sideCutters', others: ['wireStripper', 'file'] },
  { id: 'tiny', answer: 'tweezers', others: ['screwdrivers', 'crimper'] },
  { id: 'mystery', answer: 'partTester', others: ['loupe', 'usbMeter'] },
  { id: 'wave', answer: 'oscilloscope', others: ['logicProbe', 'tapeMeasure'] },
  { id: 'smoke', answer: 'fumeFan', others: ['safetyGlasses', 'gloves'] },
  { id: 'eyes', answer: 'safetyGlasses', others: ['gloves', 'fumeFan'] },
  { id: 'mistake', answer: 'desolderPump', others: ['hotGlue', 'electricalTape'] },
  { id: 'upload', answer: 'usbCable', others: ['wallAdapter', 'cableTies'] },
  { id: 'hot', answer: 'irThermometer', others: ['loupe', 'clampMeter'] },
  { id: 'thick', answer: 'calipers', others: ['tapeMeasure', 'multimeter'] },
  { id: 'joint', answer: 'loupe', others: ['irThermometer', 'oscilloscope'] },
  { id: 'mixedBag', answer: 'partsBox', others: ['magneticTray', 'crimper'] },
  { id: 'screws', answer: 'magneticTray', others: ['labelMaker', 'cableTies'] },
  { id: 'chip', answer: 'staticBags', others: ['electricalTape', 'cableTies'] },
  { id: 'spaghetti', answer: 'cableTies', others: ['heatShrink', 'wireSpool'] },
  { id: 'bare', answer: 'heatShrink', others: ['wireStripper', 'crocClips'] },
  { id: 'usbPower', answer: 'usbMeter', others: ['calipers', 'logicProbe'] },
  { id: 'pinHigh', answer: 'logicProbe', others: ['loupe', 'irThermometer'] },
  { id: 'fire', answer: 'extinguisher', others: ['firstAid', 'fumeFan'] },
  { id: 'dirtyTip', answer: 'tipCleaner', others: ['solderWick', 'alcoholBrush'] },
  { id: 'window', answer: 'hobbyKnife', others: ['sideCutters', 'wireStripper'] },
  { id: 'guard', answer: 'benchSupply', others: ['coinCells', 'wallAdapter'] },
] as const satisfies readonly { id: string; answer: ToolId; others: readonly ToolId[] }[]

export type QuizId = (typeof QUIZ)[number]['id']
export type QuizItem = (typeof QUIZ)[number]

/** Questions in one round. */
export const ROUND = 10

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export type RoundQuestion = { item: QuizItem; choices: ToolId[] }

/** A fresh round: ten questions picked at random, each with its tools in a random order. */
export function newRound(): RoundQuestion[] {
  return shuffle(QUIZ)
    .slice(0, ROUND)
    .map((item) => ({ item, choices: shuffle<ToolId>([item.answer, ...item.others]) }))
}
