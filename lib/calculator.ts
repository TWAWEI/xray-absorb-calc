import type { MuDataPoint, ElementMuData } from './types'

export function calcWeightFractions(
  composition: Readonly<Record<string, number>>,
  atomicMasses: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  let totalMass = 0
  for (const [symbol, count] of Object.entries(composition)) {
    totalMass += count * atomicMasses[symbol]
  }

  const fractions: Record<string, number> = {}
  for (const [symbol, count] of Object.entries(composition)) {
    fractions[symbol] = (count * atomicMasses[symbol]) / totalMass
  }
  return fractions
}

export function interpolateMu(
  data: readonly MuDataPoint[],
  edgeEnergies: readonly number[],
  energy_eV: number,
): number {
  if (data.length === 0) {
    throw new Error('No mu data available')
  }

  const minE = data[0].energy_eV
  const maxE = data[data.length - 1].energy_eV

  if (energy_eV < minE || energy_eV > maxE) {
    throw new Error(
      `Energy ${energy_eV} eV is outside tabulated range [${minE}, ${maxE}] eV`,
    )
  }

  // Binary search for bracketing interval
  let low = 0
  let high = data.length - 1

  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2)
    if (data[mid].energy_eV <= energy_eV) {
      low = mid
    } else {
      high = mid
    }
  }

  // Check if bracketing pair straddles an absorption edge
  const lowE = data[low].energy_eV
  const highE = data[high].energy_eV
  const crossesEdge = edgeEnergies.some((e) => e > lowE && e < highE)

  if (crossesEdge) {
    // Find a bracketing pair that does not straddle any edge
    let found = false
    for (let i = 0; i < data.length - 1; i++) {
      if (data[i].energy_eV <= energy_eV && data[i + 1].energy_eV >= energy_eV) {
        const e1 = data[i].energy_eV
        const e2 = data[i + 1].energy_eV
        if (!edgeEnergies.some((e) => e > e1 && e < e2)) {
          low = i
          high = i + 1
          found = true
          break
        }
      }
    }
    if (!found) {
      throw new Error(
        `Cannot interpolate at ${energy_eV} eV: no valid bracket found (straddles absorption edge)`,
      )
    }
  }

  // Exact match
  if (data[low].energy_eV === energy_eV) return data[low].mu_over_rho
  if (data[high].energy_eV === energy_eV) return data[high].mu_over_rho

  // Log-log interpolation
  const logE = Math.log(energy_eV)
  const logE1 = Math.log(data[low].energy_eV)
  const logE2 = Math.log(data[high].energy_eV)
  const logMu1 = Math.log(data[low].mu_over_rho)
  const logMu2 = Math.log(data[high].mu_over_rho)

  const t = (logE - logE1) / (logE2 - logE1)
  const logMu = logMu1 + t * (logMu2 - logMu1)

  return Math.exp(logMu)
}

export function calcCompoundMu(
  weightFractions: Readonly<Record<string, number>>,
  muData: Readonly<Record<string, ElementMuData>>,
  energy_eV: number,
): number {
  let compoundMu = 0
  for (const [symbol, weight] of Object.entries(weightFractions)) {
    const elMu = muData[symbol]
    if (!elMu) {
      throw new Error(`No data for element ${symbol}`)
    }
    compoundMu += weight * interpolateMu(elMu.data, elMu.edges, energy_eV)
  }
  return compoundMu
}

export function calcAbsorption(
  mu_cm: number,
  thickness_mm?: number,
): { readonly optimal_thickness_mm: number; readonly transmission?: number } {
  const optimal_thickness_mm = (1 / mu_cm) * 10 // cm to mm

  if (thickness_mm !== undefined) {
    const thickness_cm = thickness_mm / 10
    const transmission = Math.exp(-mu_cm * thickness_cm)
    return { optimal_thickness_mm, transmission }
  }

  return { optimal_thickness_mm }
}
