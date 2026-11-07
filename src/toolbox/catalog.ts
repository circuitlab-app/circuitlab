import type { PartType } from '@/circuit/types'

/*
 * The real workshop tools the Toolbox teaches, grouped like the drawers of
 * a maker's tool chest. Words for every language live in src/i18n/toolbox/;
 * the drawings live in ToolArt.tsx and src/toolbox/art/.
 */

export type ToolCategory = 'measure' | 'build' | 'cut' | 'power' | 'fix' | 'safe' | 'code' | 'tidy'

/** Drawer by drawer, in the order a child meets them; page turns follow this order. */
export const TOOL_IDS = [
  // measure
  'multimeter',
  'continuityTester',
  'clampMeter',
  'usbMeter',
  'irThermometer',
  'logicProbe',
  'oscilloscope',
  'logicAnalyzer',
  'partTester',
  'tapeMeasure',
  'calipers',
  'loupe',
  // build
  'breadboard',
  'jumperWires',
  'dupont',
  'crocClips',
  'headerPins',
  'perfboard',
  'pcb',
  'screwTerminal',
  'wireSpool',
  'crimper',
  'solderingIron',
  'solder',
  'helpingHands',
  'hotGlue',
  'heatShrink',
  'electricalTape',
  // cut and hold
  'wireStripper',
  'sideCutters',
  'pliers',
  'tweezers',
  'screwdrivers',
  'cuttingMat',
  'hobbyKnife',
  'miniSaw',
  'file',
  'handDrill',
  'pcbVise',
  // power
  'batteryHolder',
  'coinCells',
  'charger',
  'usbPower',
  'wallAdapter',
  'benchSupply',
  // fix
  'tipCleaner',
  'flux',
  'desolderPump',
  'solderWick',
  'alcoholBrush',
  'hotAir',
  // stay safe
  'safetyGlasses',
  'gloves',
  'fumeFan',
  'heatMat',
  'antiStatic',
  'esdMat',
  'firstAid',
  'extinguisher',
  // program and connect
  'usbCable',
  'laptop',
  'usbSerial',
  'programmer',
  'sdCard',
  // keep it tidy
  'partsBox',
  'labelMaker',
  'magneticTray',
  'staticBags',
  'cableTies',
] as const

export type ToolId = (typeof TOOL_IDS)[number]

export type ToolInfo = {
  category: ToolCategory
  /** only with a grown-up next to you */
  grownUp?: boolean
  /** the tool itself, or what it is used with, gets very hot */
  hot?: boolean
}

export const TOOLS: Record<ToolId, ToolInfo> = {
  multimeter: { category: 'measure' },
  continuityTester: { category: 'measure' },
  clampMeter: { category: 'measure', grownUp: true },
  usbMeter: { category: 'measure' },
  irThermometer: { category: 'measure' },
  logicProbe: { category: 'measure' },
  oscilloscope: { category: 'measure', grownUp: true },
  logicAnalyzer: { category: 'measure' },
  partTester: { category: 'measure' },
  tapeMeasure: { category: 'measure' },
  calipers: { category: 'measure' },
  loupe: { category: 'measure' },

  breadboard: { category: 'build' },
  jumperWires: { category: 'build' },
  dupont: { category: 'build' },
  crocClips: { category: 'build' },
  headerPins: { category: 'build', grownUp: true, hot: true },
  perfboard: { category: 'build', grownUp: true, hot: true },
  pcb: { category: 'build', grownUp: true, hot: true },
  screwTerminal: { category: 'build' },
  wireSpool: { category: 'build' },
  crimper: { category: 'build' },
  solderingIron: { category: 'build', grownUp: true, hot: true },
  solder: { category: 'build', grownUp: true, hot: true },
  helpingHands: { category: 'build' },
  hotGlue: { category: 'build', grownUp: true, hot: true },
  heatShrink: { category: 'build', grownUp: true, hot: true },
  electricalTape: { category: 'build' },

  wireStripper: { category: 'cut' },
  sideCutters: { category: 'cut' },
  pliers: { category: 'cut' },
  tweezers: { category: 'cut' },
  screwdrivers: { category: 'cut' },
  cuttingMat: { category: 'cut' },
  hobbyKnife: { category: 'cut', grownUp: true },
  miniSaw: { category: 'cut', grownUp: true },
  file: { category: 'cut' },
  handDrill: { category: 'cut', grownUp: true },
  pcbVise: { category: 'cut' },

  batteryHolder: { category: 'power' },
  coinCells: { category: 'power' },
  charger: { category: 'power', grownUp: true },
  usbPower: { category: 'power' },
  wallAdapter: { category: 'power', grownUp: true },
  benchSupply: { category: 'power', grownUp: true },

  tipCleaner: { category: 'fix', grownUp: true, hot: true },
  flux: { category: 'fix', grownUp: true, hot: true },
  desolderPump: { category: 'fix', grownUp: true, hot: true },
  solderWick: { category: 'fix', grownUp: true, hot: true },
  alcoholBrush: { category: 'fix', grownUp: true },
  hotAir: { category: 'fix', grownUp: true, hot: true },

  safetyGlasses: { category: 'safe' },
  gloves: { category: 'safe' },
  fumeFan: { category: 'safe' },
  heatMat: { category: 'safe' },
  antiStatic: { category: 'safe' },
  esdMat: { category: 'safe' },
  firstAid: { category: 'safe' },
  extinguisher: { category: 'safe', grownUp: true },

  usbCable: { category: 'code' },
  laptop: { category: 'code' },
  usbSerial: { category: 'code' },
  programmer: { category: 'code' },
  sdCard: { category: 'code' },

  partsBox: { category: 'tidy' },
  labelMaker: { category: 'tidy' },
  magneticTray: { category: 'tidy' },
  staticBags: { category: 'tidy' },
  cableTies: { category: 'tidy' },
}

export const TOOL_CATEGORIES: ToolCategory[] = ['measure', 'build', 'cut', 'power', 'fix', 'safe', 'code', 'tidy']

/** One colour per drawer, used for its label, its cards' glow and the detail page. */
export const CATEGORY_COLOR: Record<ToolCategory, string> = {
  measure: '#0ea5e9',
  build: '#f97316',
  cut: '#8b5cf6',
  power: '#eab308',
  fix: '#14b8a6',
  safe: '#22c55e',
  code: '#ec4899',
  tidy: '#84cc16',
}

/** The tool drawn on each drawer's label. */
export const CATEGORY_TOOL: Record<ToolCategory, ToolId> = {
  measure: 'multimeter',
  build: 'breadboard',
  cut: 'sideCutters',
  power: 'batteryHolder',
  fix: 'desolderPump',
  safe: 'safetyGlasses',
  code: 'usbCable',
  tidy: 'partsBox',
}

export const toolsIn = (category: ToolCategory) => TOOL_IDS.filter((id) => TOOLS[id].category === category)

/** The first tools a new maker needs, in the order to get them. */
export const STARTER_KIT: ToolId[] = [
  'safetyGlasses',
  'breadboard',
  'jumperWires',
  'batteryHolder',
  'crocClips',
  'multimeter',
  'wireStripper',
  'sideCutters',
  'pliers',
  'screwdrivers',
  'usbCable',
  'partsBox',
]

/** Tools that have a part on the board to try them out with. */
export const BOARD_PARTS: Partial<Record<ToolId, PartType[]>> = {
  multimeter: ['multimeter', 'voltmeter', 'ammeter'],
  clampMeter: ['ammeter'],
  logicProbe: ['logicProbe'],
  oscilloscope: ['oscilloscope'],
  batteryHolder: ['battery'],
  coinCells: ['coinCell'],
  usbPower: ['powerBank'],
  benchSupply: ['powerSupply'],
}
