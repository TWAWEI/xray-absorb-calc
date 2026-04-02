export interface ElementData {
  readonly Z: number
  readonly symbol: string
  readonly name: string
  readonly atomic_mass: number
}

export interface AbsorptionEdge {
  readonly edge: string
  readonly energy_eV: number
  readonly fluorescence_yield?: number
}

export interface FluorescenceLine {
  readonly line: string
  readonly energy_eV: number
  readonly intensity: number
}

export interface MuDataPoint {
  readonly energy_eV: number
  readonly mu_over_rho: number
}

export interface ElementMuData {
  readonly symbol: string
  readonly edges: readonly number[]
  readonly data: readonly MuDataPoint[]
}

export interface FormulaComposition {
  readonly [symbol: string]: number
}

export interface CalculationInput {
  readonly formula: string
  readonly energy_keV: number
  readonly density_g_cm3: number
  readonly thickness_mm?: number
}

export interface CalculationResult {
  readonly mu_over_rho: number
  readonly mu: number
  readonly optimal_thickness_mm: number
  readonly transmission?: number
  readonly weight_fractions: Readonly<Record<string, number>>
}
