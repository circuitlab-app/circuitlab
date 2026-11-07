export type PartLesson = {
  /** 2–4 short sentences: what the part is, what it does in a circuit, how to use it safely */
  about: string[]
  /** one everyday comparison, starting like "It is like …" */
  like: string
  /** one surprising fun fact or real-world use */
  fact: string
}

export type LearnBook = {
  basics: {
    title: string
    intro: string
    voltage: { name: string; unit: string; text: string }
    current: { name: string; unit: string; text: string }
    resistance: { name: string; unit: string; text: string }
    power: { name: string; unit: string; text: string }
    law: {
      title: string
      /** one short sentence: the big idea */
      idea: string
      /** the rule written three ways; `math` is always shown left to right */
      formulas: { math: string; say: string }[]
      /** short rules of thumb, one per line */
      rules: string[]
      exampleTitle: string
      /** a worked example, one step per line; `math` is always shown left to right */
      steps: { say: string; math: string }[]
    }
    units: string[]
  }
  labels: { like: string; fact: string; nowTitle: string }
  /** how to read the coloured stripes on a resistor */
  colorCode: {
    title: string
    intro: string
    /** what stripes 1, 2, 3 and 4 tell you */
    bands: [string, string, string, string]
    /** names of the colours for the numbers 0 … 9 */
    colors: string[]
    gold: string
    /** what the gold stripe means */
    tolerance: string
    /** "no zeros", "add 1 zero", "add 2 zeros" */
    zeros: (count: number) => string
    /** the worked answer, e.g. "2 and 2, then add 1 zero: 220 Ω" */
    result: (first: number, second: number, zeros: number, value: string) => string
    chartTitle: string
    tip: string
  }
  /** the part's live numbers as a sentence */
  now: (volts: string, amps: string, ohms: string | null, watts: string) => string
  /** keyed by part type id */
  parts: Record<string, PartLesson>
}
