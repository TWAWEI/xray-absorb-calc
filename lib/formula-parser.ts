import { VALID_SYMBOLS } from './element-symbols'

export class FormulaError extends Error {
  constructor(
    message: string,
    public readonly position: number,
  ) {
    super(message)
    this.name = 'FormulaError'
  }
}

export function parseFormula(formula: string): Readonly<Record<string, number>> {
  if (!formula || formula.trim().length === 0) {
    throw new FormulaError('Formula cannot be empty', 0)
  }

  // Split on middle dot for hydrates (e.g. CuSO4·5H2O)
  const parts = formula.split('\u00b7')
  const result: Record<string, number> = {}

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const coeffMatch = i > 0 ? part.match(/^(\d+)(.+)$/) : null
    const coeff = coeffMatch ? parseInt(coeffMatch[1], 10) : 1
    const expr = coeffMatch ? coeffMatch[2] : part

    const parsed = parseExpression(expr, 0)
    if (parsed.pos !== expr.length) {
      throw new FormulaError(
        `Unexpected character '${expr[parsed.pos]}'`,
        parsed.pos,
      )
    }

    for (const [sym, count] of Object.entries(parsed.composition)) {
      result[sym] = (result[sym] ?? 0) + count * coeff
    }
  }

  return result
}

interface ParseResult {
  readonly composition: Record<string, number>
  readonly pos: number
}

function parseExpression(formula: string, pos: number): ParseResult {
  const composition: Record<string, number> = {}

  while (pos < formula.length) {
    const ch = formula[pos]

    if (ch === '(') {
      pos++
      const inner = parseExpression(formula, pos)
      pos = inner.pos

      if (pos >= formula.length || formula[pos] !== ')') {
        throw new FormulaError('Unmatched opening parenthesis', pos)
      }
      pos++

      const count = parseCount(formula, pos)
      pos = count.pos

      for (const [sym, n] of Object.entries(inner.composition)) {
        composition[sym] = (composition[sym] ?? 0) + n * count.value
      }
    } else if (ch === ')') {
      break
    } else if (ch >= 'A' && ch <= 'Z') {
      const elem = parseElement(formula, pos)
      pos = elem.pos

      const count = parseCount(formula, pos)
      pos = count.pos

      composition[elem.symbol] = (composition[elem.symbol] ?? 0) + count.value
    } else {
      throw new FormulaError(`Unexpected character '${ch}'`, pos)
    }
  }

  return { composition, pos }
}

function parseElement(
  formula: string,
  pos: number,
): { readonly symbol: string; readonly pos: number } {
  if (pos >= formula.length || formula[pos] < 'A' || formula[pos] > 'Z') {
    throw new FormulaError('Expected element symbol', pos)
  }

  // Try two-letter symbol first
  if (
    pos + 1 < formula.length &&
    formula[pos + 1] >= 'a' &&
    formula[pos + 1] <= 'z'
  ) {
    const twoLetter = formula.slice(pos, pos + 2)
    if (VALID_SYMBOLS.has(twoLetter)) {
      return { symbol: twoLetter, pos: pos + 2 }
    }
  }

  // Fall back to one-letter symbol
  const oneLetter = formula[pos]
  if (VALID_SYMBOLS.has(oneLetter)) {
    return { symbol: oneLetter, pos: pos + 1 }
  }

  throw new FormulaError(
    `Unknown element '${formula.slice(pos, pos + 2)}'`,
    pos,
  )
}

function parseCount(
  formula: string,
  pos: number,
): { readonly value: number; readonly pos: number } {
  let numStr = ''
  let current = pos
  let hasDot = false

  while (current < formula.length) {
    const ch = formula[current]
    if (ch >= '0' && ch <= '9') {
      numStr += ch
      current++
    } else if (ch === '.' && !hasDot) {
      hasDot = true
      numStr += ch
      current++
    } else {
      break
    }
  }

  return {
    value: numStr.length > 0 ? parseFloat(numStr) : 1,
    pos: current,
  }
}
