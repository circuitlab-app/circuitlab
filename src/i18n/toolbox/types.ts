import type { ToolCategory, ToolId } from '@/toolbox/catalog'
import type { QuizId } from '@/toolbox/quiz'

export type ToolPage = {
  name: string
  /** a few words under the name, e.g. "Measures volts and more" */
  short: string
  /** what it is for: 2 or 3 short sentences */
  use: string
  /** how to use it: 3 to 5 short steps, in order */
  steps: string[]
  /** the one safety rule to remember */
  safe: string
  /** one surprising, true fact */
  fact: string
}

/** One "Which tool?" question: a short, real moment at the workbench. */
export type QuizQuestion = {
  /** the situation, e.g. "Is this battery still full?" */
  ask: string
  /** why the right tool is right, shown after the child answers */
  why: string
}

export type ToolboxBook = {
  title: string
  /** one sentence under the title */
  intro: string
  /** "7 of 27 explored" */
  explored: (seen: number, total: number) => string
  /** the three rules shown above the drawers */
  rules: { title: string; items: [string, string, string] }
  categories: Record<ToolCategory, { name: string; blurb: string }>
  labels: {
    use: string
    steps: string
    safe: string
    fact: string
    grownUp: string
    hot: string
    seen: string
    back: string
    previous: string
    next: string
    close: string
    /** "3 of 27" */
    position: (index: number, total: number) => string
  }
  search: {
    /** the box's accessible name */
    label: string
    placeholder: string
    clear: string
    /** "5 tools found" */
    found: (count: number) => string
    /** "No tool called “saw x”." */
    none: (query: string) => string
    /** a nudge under the empty result */
    hint: string
  }
  /** "Try it on the board": add the matching part to the board */
  board: {
    title: string
    /** one sentence under the title */
    text: string
    /** the caption under the part's name on its button */
    add: string
  }
  quiz: {
    title: string
    /** one line on the card that opens the quiz */
    blurb: string
    start: string
    /** "Question 3 of 10" */
    progress: (index: number, total: number) => string
    /** the prompt above the tool pictures */
    pick: string
    right: string
    /** "Not this one. You need the multimeter." */
    wrong: (tool: string) => string
    next: string
    finish: string
    /** "7 of 10" */
    score: (score: number, total: number) => string
    /** "Your best: 9 of 10" */
    best: (score: number, total: number) => string
    /** what the child hears after a round, from a perfect score down */
    cheers: { perfect: string; great: string; good: string; start: string }
    /** heading over the tools to look at again */
    review: string
    again: string
    /** a link from the feedback to the tool's page */
    open: string
    questions: Record<QuizId, QuizQuestion>
  }
  kit: {
    title: string
    /** one line on the card that opens the checklist */
    blurb: string
    /** a sentence at the top of the checklist */
    intro: string
    /** "5 of 12 ticked" */
    progress: (ticked: number, total: number) => string
    /** shown when every tool is ticked */
    done: string
    /** what comes after the starter kit */
    later: string
    /** the tick box's accessible name, e.g. "I have the multimeter" */
    have: (tool: string) => string
    /** a link to the tool's page */
    open: string
    clear: string
  }
  tools: Record<ToolId, ToolPage>
}
