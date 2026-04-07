import type { ElementMuData } from './types'
import { interpolateMu } from './calculator'

export interface PerElementChartPoint {
  readonly energy_keV: number
  readonly [key: string]: number
}

/**
 * Generate per-element muR and transmission chart data over the energy grid.
 *
 * For element i at energy E:
 *   muR_i = w_i * mu_over_rho_i(E) * packed_density * radius_cm
 *   Total muR = sum of all muR_i
 *   trans_i = exp(-2 * muR_i)
 *   trans_total = exp(-2 * muR_total)
 */
export function buildPerElementChartData(
  weightFractions: Readonly<Record<string, number>>,
  muData: Readonly<Record<string, ElementMuData>>,
  packedDensity: number,
  radiusMm: number,
): readonly PerElementChartPoint[] {
  const symbols = Object.keys(weightFractions)
  if (symbols.length === 0) return []

  const radiusCm = radiusMm / 10

  // Use the first element's energy grid as reference
  const firstSymbol = symbols[0]
  const referenceGrid = muData[firstSymbol].data

  const points: PerElementChartPoint[] = []

  for (const gridPoint of referenceGrid) {
    const energy_eV = gridPoint.energy_eV
    const energy_keV = energy_eV / 1000

    try {
      const record: Record<string, number> = { energy_keV }
      let totalMuR = 0

      for (const symbol of symbols) {
        const elMu = muData[symbol]
        if (!elMu) continue

        const muOverRho = interpolateMu(elMu.data, elMu.edges, energy_eV)
        const elementMuR = weightFractions[symbol] * muOverRho * packedDensity * radiusCm

        record[`muR_${symbol}`] = elementMuR
        record[`trans_${symbol}`] = Math.exp(-2 * elementMuR)
        totalMuR += elementMuR
      }

      record['muR_Total'] = totalMuR
      record['trans_Total'] = Math.exp(-2 * totalMuR)

      points.push(record as PerElementChartPoint)
    } catch {
      // Skip energy points that fail interpolation
    }
  }

  return points
}
