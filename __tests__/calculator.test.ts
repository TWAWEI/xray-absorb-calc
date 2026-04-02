import { describe, it, expect } from 'vitest'
import {
  calcWeightFractions,
  interpolateMu,
  calcCompoundMu,
  calcAbsorption,
} from '@/lib/calculator'
import type { ElementMuData } from '@/lib/types'

describe('calcWeightFractions', () => {
  it('calculates weight fractions for CaCO3', () => {
    const composition = { Ca: 1, C: 1, O: 3 }
    const masses: Record<string, number> = { Ca: 40.078, C: 12.011, O: 15.999 }
    const fractions = calcWeightFractions(composition, masses)

    expect(fractions.Ca).toBeCloseTo(0.4004, 3)
    expect(fractions.C).toBeCloseTo(0.12, 2)
    expect(fractions.O).toBeCloseTo(0.4796, 3)
    expect(fractions.Ca + fractions.C + fractions.O).toBeCloseTo(1.0, 10)
  })
})

describe('interpolateMu', () => {
  const testData = [
    { energy_eV: 1000, mu_over_rho: 1000 },
    { energy_eV: 2000, mu_over_rho: 125 },
    { energy_eV: 4000, mu_over_rho: 15.625 },
    { energy_eV: 8000, mu_over_rho: 1.953125 },
  ]

  it('interpolates between tabulated points', () => {
    const result = interpolateMu(testData, [], 3000)
    expect(result).toBeGreaterThan(15)
    expect(result).toBeLessThan(125)
  })

  it('returns exact value at tabulated point', () => {
    const result = interpolateMu(testData, [], 2000)
    expect(result).toBeCloseTo(125, 3)
  })

  it('throws for energy outside range', () => {
    expect(() => interpolateMu(testData, [], 500)).toThrow(/outside.*range/i)
    expect(() => interpolateMu(testData, [], 10000)).toThrow(/outside.*range/i)
  })

  it('does not interpolate across absorption edge', () => {
    const dataWithEdge = [
      { energy_eV: 1000, mu_over_rho: 1000 },
      { energy_eV: 2000, mu_over_rho: 125 },
      { energy_eV: 2999, mu_over_rho: 20 },
      { energy_eV: 3001, mu_over_rho: 200 },
      { energy_eV: 4000, mu_over_rho: 100 },
      { energy_eV: 8000, mu_over_rho: 10 },
    ]
    const result = interpolateMu(dataWithEdge, [3000], 3500)
    expect(result).toBeGreaterThan(100)
    expect(result).toBeLessThan(200)
  })
})

describe('calcCompoundMu', () => {
  it('calculates compound mu/rho as weighted sum', () => {
    const fractions = { A: 0.6, B: 0.4 }
    const muData: Record<string, ElementMuData> = {
      A: {
        symbol: 'A',
        edges: [],
        data: [
          { energy_eV: 1000, mu_over_rho: 100 },
          { energy_eV: 2000, mu_over_rho: 50 },
        ],
      },
      B: {
        symbol: 'B',
        edges: [],
        data: [
          { energy_eV: 1000, mu_over_rho: 200 },
          { energy_eV: 2000, mu_over_rho: 80 },
        ],
      },
    }
    const result = calcCompoundMu(fractions, muData, 1000)
    expect(result).toBeCloseTo(140, 3)
  })
})

describe('calcAbsorption', () => {
  it('calculates transmission correctly', () => {
    const result = calcAbsorption(5.0, 2.0)
    expect(result.transmission).toBeCloseTo(0.3679, 3)
  })

  it('calculates optimal thickness', () => {
    const result = calcAbsorption(5.0)
    expect(result.optimal_thickness_mm).toBeCloseTo(2.0, 3)
  })
})
