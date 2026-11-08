import type { Value } from './types'

/*
 * GitHub Actions expressions: what goes inside `${{ }}` and in `if:`.
 *
 * Literals ('text', 42, true, null), contexts (github.ref, needs.build.result,
 * steps.version.outputs.new, matrix.node …), the operators ! == != < <= > >= && ||,
 * and the built-in functions (contains, startsWith, format, fromJSON …) and
 * status checks (success, failure, always, cancelled). Comparisons follow
 * GitHub's rules: text is compared ignoring case, mixed types as numbers.
 */

export class ExprError extends Error {}

/** `secrets.ANYTHING` is always masked, as it is in real logs. */
export const SECRETS: { [key: string]: Value } = new Proxy(
  {},
  { get: (_target, key) => (typeof key === 'string' ? '***' : undefined) },
)

/** What the status functions answer for the job or step being decided. */
export type Status = { success: boolean; failure: boolean; cancelled: boolean }

export type ExprContext = { data: Record<string, Value>; status: Status }

type Token =
  | { k: 'num'; v: number }
  | { k: 'str'; v: string }
  | { k: 'id'; v: string }
  | { k: 'op'; v: string }

type Node =
  | { t: 'lit'; v: Value }
  | { t: 'ref'; name: string }
  | { t: 'get'; obj: Node; key: Node | '*' }
  | { t: 'call'; name: string; args: Node[] }
  | { t: 'not'; x: Node }
  | { t: 'bin'; op: string; a: Node; b: Node }

const TWO = ['==', '!=', '<=', '>=', '&&', '||']

function tokenize(src: string): Token[] {
  const out: Token[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (c === "'") {
      let text = ''
      i++
      for (;;) {
        if (i >= src.length) throw new ExprError('a text in quotes is never closed')
        if (src[i] === "'") {
          // '' inside quotes is one quote
          if (src[i + 1] === "'") {
            text += "'"
            i += 2
            continue
          }
          i++
          break
        }
        text += src[i++]
      }
      out.push({ k: 'str', v: text })
      continue
    }
    const two = src.slice(i, i + 2)
    if (TWO.includes(two)) {
      out.push({ k: 'op', v: two })
      i += 2
      continue
    }
    if (/[0-9]/.test(c) || (c === '-' && /[0-9]/.test(src[i + 1] ?? ''))) {
      const m = /^-?(0x[0-9a-f]+|\d+(\.\d+)?(e[+-]?\d+)?)/i.exec(src.slice(i))!
      out.push({ k: 'num', v: Number(m[0]) })
      i += m[0].length
      continue
    }
    if ('()[].,!<>*'.includes(c)) {
      out.push({ k: 'op', v: c })
      i++
      continue
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_-]*/.exec(src.slice(i))!
      out.push({ k: 'id', v: m[0] })
      i += m[0].length
      continue
    }
    throw new ExprError(`unexpected "${c}"`)
  }
  return out
}

function parse(src: string): Node {
  const tokens = tokenize(src)
  let at = 0
  const peek = () => tokens[at]
  const isOp = (v: string) => peek()?.k === 'op' && peek()!.v === v
  const expect = (v: string) => {
    if (!isOp(v)) throw new ExprError(`expected "${v}"`)
    at++
  }

  const binary = (ops: string[], next: () => Node) => (): Node => {
    let a = next()
    while (peek()?.k === 'op' && ops.includes(peek()!.v as string)) {
      const op = tokens[at++].v as string
      a = { t: 'bin', op, a, b: next() }
    }
    return a
  }

  const primary = (): Node => {
    const tok = tokens[at++]
    if (!tok) throw new ExprError('the expression ends too early')
    if (tok.k === 'num' || tok.k === 'str') return { t: 'lit', v: tok.v }
    if (tok.k === 'op' && tok.v === '(') {
      const inner = or()
      expect(')')
      return inner
    }
    if (tok.k === 'id') {
      if (isOp('(')) {
        at++
        const args: Node[] = []
        if (!isOp(')')) {
          args.push(or())
          while (isOp(',')) {
            at++
            args.push(or())
          }
        }
        expect(')')
        return { t: 'call', name: tok.v.toLowerCase(), args }
      }
      const word = tok.v.toLowerCase()
      if (word === 'true') return { t: 'lit', v: true }
      if (word === 'false') return { t: 'lit', v: false }
      if (word === 'null') return { t: 'lit', v: null }
      if (word === 'nan') return { t: 'lit', v: Number.NaN }
      if (word === 'infinity') return { t: 'lit', v: Number.POSITIVE_INFINITY }
      return { t: 'ref', name: tok.v }
    }
    throw new ExprError(`unexpected "${String(tok.v)}"`)
  }

  const postfix = (): Node => {
    let node = primary()
    for (;;) {
      if (isOp('.')) {
        at++
        const tok = tokens[at++]
        if (tok?.k === 'id') node = { t: 'get', obj: node, key: { t: 'lit', v: tok.v } }
        else if (tok?.k === 'op' && tok.v === '*') node = { t: 'get', obj: node, key: '*' }
        else throw new ExprError('a name is missing after "."')
      } else if (isOp('[')) {
        at++
        if (isOp('*')) {
          at++
          node = { t: 'get', obj: node, key: '*' }
        } else node = { t: 'get', obj: node, key: or() }
        expect(']')
      } else return node
    }
  }

  const unary = (): Node => {
    if (isOp('!')) {
      at++
      return { t: 'not', x: unary() }
    }
    return postfix()
  }

  const compare = binary(['<', '<=', '>', '>='], unary)
  const equality = binary(['==', '!='], compare)
  const and = binary(['&&'], equality)
  const or = binary(['||'], and)

  const tree = or()
  if (at < tokens.length) throw new ExprError(`unexpected "${String(tokens[at].v)}"`)
  return tree
}

// the same expressions are decided again every time the scenario changes
const cache = new Map<string, Node | ExprError>()
function compile(src: string): Node {
  let hit = cache.get(src)
  if (!hit) {
    try {
      hit = parse(src)
    } catch (e) {
      hit = e instanceof ExprError ? e : new ExprError(String(e))
    }
    if (cache.size > 2000) cache.clear()
    cache.set(src, hit)
  }
  if (hit instanceof ExprError) throw hit
  return hit
}

/* ───────────────────────── values ───────────────────────── */

const isObject = (v: Value): v is { [key: string]: Value } =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export function truthy(v: Value): boolean {
  if (v === null || v === false || v === '' || v === 0) return false
  if (typeof v === 'number' && Number.isNaN(v)) return false
  return true
}

/** How a value reads when it is put into text with `${{ }}`. */
export function toText(v: Value): string {
  if (v === null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return JSON.stringify(v)
}

function toNumber(v: Value): number {
  if (v === null) return 0
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'number') return v
  if (typeof v === 'string') return v.trim() === '' ? 0 : Number(v.trim())
  return Number.NaN
}

export function looseEquals(a: Value, b: Value): boolean {
  if (typeof a === 'string' && typeof b === 'string') return a.toLowerCase() === b.toLowerCase()
  const aObj = typeof a === 'object' && a !== null
  const bObj = typeof b === 'object' && b !== null
  if (aObj || bObj) return a === b
  if (typeof a === typeof b) return a === b
  return toNumber(a) === toNumber(b)
}

function less(a: Value, b: Value): boolean {
  if (typeof a === 'string' && typeof b === 'string') return a.toLowerCase() < b.toLowerCase()
  return toNumber(a) < toNumber(b)
}

function member(obj: Value, key: Value): Value {
  if (Array.isArray(obj)) {
    if (typeof key === 'number') return obj[key] ?? null
    // after a `.*` filter: take the property from every item
    return obj.map((item) => member(item, key)).filter((v) => v !== null)
  }
  if (!isObject(obj)) return null
  const name = toText(key)
  if (name in obj) return obj[name] ?? null
  // context properties ignore case
  const lower = name.toLowerCase()
  const found = Object.keys(obj).find((k) => k.toLowerCase() === lower)
  return found ? (obj[found] ?? null) : null
}

/** A short, stable stand-in for `hashFiles(...)`: the files are not really there. */
function fakeHash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return (h >>> 0).toString(16).padStart(8, '0').repeat(8)
}

function callFunction(name: string, args: Value[], ctx: ExprContext): Value {
  const [a = null, b = null] = args
  switch (name) {
    case 'success':
      return ctx.status.success
    case 'failure':
      return ctx.status.failure
    case 'cancelled':
      return ctx.status.cancelled
    case 'always':
      return true
    case 'contains':
      if (Array.isArray(a)) return a.some((item) => looseEquals(item, b))
      return toText(a).toLowerCase().includes(toText(b).toLowerCase())
    case 'startswith':
      return toText(a).toLowerCase().startsWith(toText(b).toLowerCase())
    case 'endswith':
      return toText(a).toLowerCase().endsWith(toText(b).toLowerCase())
    case 'format':
      // {0}, {1} … are the arguments; {{ and }} are a literal brace
      return toText(a)
        .split(/(\{\{|\}\}|\{\d+\})/)
        .map((part) =>
          part === '{{'
            ? '{'
            : part === '}}'
              ? '}'
              : /^\{\d+\}$/.test(part)
                ? toText(args[Number(part.slice(1, -1)) + 1] ?? null)
                : part,
        )
        .join('')
    case 'join':
      return Array.isArray(a) ? a.map(toText).join(args.length > 1 ? toText(b) : ',') : toText(a)
    case 'tojson':
      return JSON.stringify(a, null, 2)
    case 'fromjson':
      try {
        return JSON.parse(toText(a)) as Value
      } catch {
        throw new ExprError('fromJSON: not valid JSON')
      }
    case 'hashfiles':
      return fakeHash(args.map(toText).join('|'))
    default:
      throw new ExprError(`there is no function called ${name}()`)
  }
}

function run(node: Node, ctx: ExprContext): Value {
  switch (node.t) {
    case 'lit':
      return node.v
    case 'ref':
      return member(ctx.data as Value, node.name)
    case 'get': {
      const obj = run(node.obj, ctx)
      if (node.key === '*') return Array.isArray(obj) ? obj : isObject(obj) ? Object.values(obj) : []
      return member(obj, run(node.key, ctx))
    }
    case 'call':
      return callFunction(
        node.name,
        node.args.map((arg) => run(arg, ctx)),
        ctx,
      )
    case 'not':
      return !truthy(run(node.x, ctx))
    case 'bin': {
      const a = run(node.a, ctx)
      if (node.op === '&&') return truthy(a) ? run(node.b, ctx) : a
      if (node.op === '||') return truthy(a) ? a : run(node.b, ctx)
      const b = run(node.b, ctx)
      if (node.op === '==') return looseEquals(a, b)
      if (node.op === '!=') return !looseEquals(a, b)
      if (node.op === '<') return less(a, b)
      if (node.op === '>') return less(b, a)
      if (node.op === '<=') return !less(b, a)
      return !less(a, b)
    }
  }
}

/** Removes the `${{ }}` around a whole expression, as `if:` allows. */
export function unwrap(text: string): string {
  const m = /^\s*\$\{\{([\s\S]*)\}\}\s*$/.exec(text)
  return (m ? m[1] : text).trim()
}

export function evaluate(expr: string, ctx: ExprContext): Value {
  return run(compile(unwrap(expr)), ctx)
}

const STATUS_FUNCTIONS = new Set(['success', 'failure', 'always', 'cancelled'])

function usesStatus(node: Node): boolean {
  switch (node.t) {
    case 'call':
      return STATUS_FUNCTIONS.has(node.name) || node.args.some(usesStatus)
    case 'get':
      return usesStatus(node.obj) || (node.key !== '*' && usesStatus(node.key))
    case 'not':
      return usesStatus(node.x)
    case 'bin':
      return usesStatus(node.a) || usesStatus(node.b)
    default:
      return false
  }
}

export type Decision = { value: boolean; error?: string }

/**
 * Decides an `if:`. With no status function in it, GitHub reads it as
 * `success() && (…)`, so a job or step after a failure is skipped unless its
 * condition says `always()` or `failure()`.
 */
export function decide(condition: string | undefined, ctx: ExprContext): Decision {
  if (condition === undefined || condition.trim() === '') return { value: ctx.status.success }
  try {
    const tree = compile(unwrap(condition))
    if (!usesStatus(tree) && !ctx.status.success) return { value: false }
    return { value: truthy(run(tree, ctx)) }
  } catch (e) {
    return { value: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** True when the condition names success(), failure(), always() or cancelled(). */
export function hasStatusCheck(condition: string): boolean {
  try {
    return usesStatus(compile(unwrap(condition)))
  } catch {
    return false
  }
}

const TEMPLATE = /\$\{\{([\s\S]*?)\}\}/g

/** Fills every `${{ … }}` in a text; a part that cannot be worked out is left as written. */
export function fill(text: string, ctx: ExprContext): string {
  if (!text.includes('${{')) return text
  return text.replace(TEMPLATE, (whole, inner: string) => {
    try {
      return toText(evaluate(inner, ctx))
    } catch {
      return whole
    }
  })
}

/** The expressions inside a text's `${{ … }}`. */
export function expressionsIn(text: string): string[] {
  return [...text.matchAll(TEMPLATE)].map((m) => m[1].trim())
}

/* ───────────────────────── reading what an expression looks at ───────────────────────── */

function pathOf(node: Node): string[] | null {
  if (node.t === 'ref') return [node.name]
  if (node.t === 'get' && node.key !== '*' && node.key.t === 'lit') {
    const base = pathOf(node.obj)
    return base ? [...base, toText(node.key.v)] : null
  }
  return null
}

export type Analysis = {
  /** every context path read, e.g. ['needs', 'check', 'outputs', 'new'] */
  paths: string[][]
  /** paths compared with a literal, e.g. `steps.version.outputs.new == 'true'` */
  comparisons: { path: string[]; value: string }[]
}

/** What an expression reads and compares; used to offer the right choices for step outputs. */
export function analyze(expr: string): Analysis {
  const result: Analysis = { paths: [], comparisons: [] }
  let tree: Node
  try {
    tree = compile(unwrap(expr))
  } catch {
    return result
  }
  const walk = (node: Node) => {
    const path = pathOf(node)
    if (path) {
      result.paths.push(path)
      return
    }
    if (node.t === 'bin') {
      if (node.op === '==' || node.op === '!=') {
        const pa = pathOf(node.a)
        const pb = pathOf(node.b)
        if (pa && node.b.t === 'lit') result.comparisons.push({ path: pa, value: toText(node.b.v) })
        if (pb && node.a.t === 'lit') result.comparisons.push({ path: pb, value: toText(node.a.v) })
      }
      walk(node.a)
      walk(node.b)
    } else if (node.t === 'not') walk(node.x)
    else if (node.t === 'call') node.args.forEach(walk)
    else if (node.t === 'get') {
      walk(node.obj)
      if (node.key !== '*') walk(node.key)
    }
  }
  walk(tree)
  return result
}
