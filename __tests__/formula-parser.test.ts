import { describe, it, expect } from 'vitest'
import { parseFormula } from '@/lib/formula-parser'

describe('parseFormula', () => {
  it('parses single element', () => {
    expect(parseFormula('Fe')).toEqual({ Fe: 1 })
  })

  it('parses element with count', () => {
    expect(parseFormula('O2')).toEqual({ O: 2 })
  })

  it('parses simple compound', () => {
    expect(parseFormula('NaCl')).toEqual({ Na: 1, Cl: 1 })
  })

  it('parses compound with counts', () => {
    expect(parseFormula('Fe2O3')).toEqual({ Fe: 2, O: 3 })
  })

  it('parses parenthesized group', () => {
    expect(parseFormula('Ca(OH)2')).toEqual({ Ca: 1, O: 2, H: 2 })
  })

  it('parses nested parentheses', () => {
    expect(parseFormula('Ca3(PO4)2')).toEqual({ Ca: 3, P: 2, O: 8 })
  })

  it('parses complex formula', () => {
    expect(parseFormula('(NH4)2SO4')).toEqual({ N: 2, H: 8, S: 1, O: 4 })
  })

  it('parses hydrate with middle dot', () => {
    expect(parseFormula('CuSO4\u00b75H2O')).toEqual({ Cu: 1, S: 1, O: 9, H: 10 })
  })

  it('parses LaB6', () => {
    expect(parseFormula('LaB6')).toEqual({ La: 1, B: 6 })
  })

  it('parses CaCO3', () => {
    expect(parseFormula('CaCO3')).toEqual({ Ca: 1, C: 1, O: 3 })
  })

  it('throws on empty string', () => {
    expect(() => parseFormula('')).toThrow()
  })

  it('throws on invalid element symbol', () => {
    expect(() => parseFormula('Xx2O3')).toThrow(/unknown element/i)
  })

  it('throws on unmatched parenthesis', () => {
    expect(() => parseFormula('Ca(OH')).toThrow()
  })

  it('throws on trailing characters', () => {
    expect(() => parseFormula('Fe2O3)')).toThrow()
  })

  it('parses decimal coefficient (YBCO)', () => {
    expect(parseFormula('YBa2Cu3O6.5')).toEqual({ Y: 1, Ba: 2, Cu: 3, O: 6.5 })
  })

  it('parses solid solution with decimal', () => {
    expect(parseFormula('Ca0.5Sr0.5TiO3')).toEqual({ Ca: 0.5, Sr: 0.5, Ti: 1, O: 3 })
  })
})
