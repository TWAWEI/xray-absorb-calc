'use client'

import { useState, useCallback } from 'react'
import { parseFormula, FormulaError } from '@/lib/formula-parser'
import {
  calcWeightFractions,
  calcCompoundMu,
  calcAbsorption,
  calcCylindricalAbsorption,
} from '@/lib/calculator'
import { loadElements, loadMuData } from '@/lib/data-loader'
import {
  HC_KEV_ANGSTROM,
  ENERGY_MIN_KEV,
  ENERGY_MAX_KEV,
} from '@/lib/constants'
import { ResultCard } from '@/components/ui/ResultCard'
import { EnergyChart } from '@/components/ui/EnergyChart'
import type { CalculationResult } from '@/lib/types'

type EnergyUnit = 'keV' | 'Angstrom'

interface FormState {
  readonly formula: string
  readonly energyValue: string
  readonly energyUnit: EnergyUnit
  readonly density: string
  readonly thickness: string
  readonly packingFraction: string
  readonly capillaryRadius: string
}

interface ChartDataPoint {
  readonly energy_eV: number
  readonly mu_over_rho: number
}

interface ChartEdge {
  readonly energy_eV: number
  readonly label: string
}

const INITIAL_FORM: FormState = {
  formula: 'CaCO3',
  energyValue: '30',
  energyUnit: 'keV',
  density: '2.71',
  thickness: '0.8',
  packingFraction: '60',
  capillaryRadius: '0.4',
}

function updateForm(
  prev: FormState,
  field: keyof FormState,
  value: string,
): FormState {
  return { ...prev, [field]: value }
}

export function AbsorptionTab() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [chartData, setChartData] = useState<readonly ChartDataPoint[]>([])
  const [chartEdges, setChartEdges] = useState<readonly ChartEdge[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((prev) => updateForm(prev, field, value))
    },
    [],
  )

  const handleCalculate = useCallback(async () => {
    setError(null)
    setResult(null)
    setChartData([])
    setChartEdges([])
    setLoading(true)

    try {
      // 1. Parse formula
      const composition = parseFormula(form.formula)

      // 2. Convert energy to keV
      const rawValue = parseFloat(form.energyValue)
      if (isNaN(rawValue) || rawValue <= 0) {
        throw new Error('Energy must be a positive number')
      }
      const energy_keV =
        form.energyUnit === 'keV'
          ? rawValue
          : HC_KEV_ANGSTROM / rawValue

      // 3. Validate inputs
      if (energy_keV < ENERGY_MIN_KEV || energy_keV > ENERGY_MAX_KEV) {
        throw new Error(
          `Energy must be between ${ENERGY_MIN_KEV} and ${ENERGY_MAX_KEV} keV`,
        )
      }

      const density = parseFloat(form.density)
      if (isNaN(density) || density <= 0) {
        throw new Error('Density must be a positive number')
      }

      const thickness = parseFloat(form.thickness)
      if (isNaN(thickness) || thickness < 0) {
        throw new Error('Thickness must be a non-negative number')
      }

      const energy_eV = energy_keV * 1000

      // 4. Load data
      const [elements, muData] = await Promise.all([
        loadElements(),
        loadMuData(),
      ])

      // 5. Build atomic mass lookup
      const masses: Record<string, number> = {}
      for (const el of elements) {
        masses[el.symbol] = el.atomic_mass
      }

      // Validate all elements exist
      for (const symbol of Object.keys(composition)) {
        if (masses[symbol] === undefined) {
          throw new Error(`Unknown element: ${symbol}`)
        }
        if (!muData[symbol]) {
          throw new Error(`No absorption data for element: ${symbol}`)
        }
      }

      // 6. Calculate weight fractions
      const fractions = calcWeightFractions(composition, masses)

      // 7. Calculate compound mu/rho at the given energy
      const mu_over_rho = calcCompoundMu(fractions, muData, energy_eV)

      // 8. mu = mu/rho * density
      const mu = mu_over_rho * density

      // 9. Calculate absorption (flat slab)
      const absorption = calcAbsorption(mu, thickness)

      // 10. Cylindrical geometry (packed density)
      const packingFractionVal = parseFloat(form.packingFraction)
      if (isNaN(packingFractionVal) || packingFractionVal < 0 || packingFractionVal > 100) {
        throw new Error('Packing fraction must be between 0 and 100')
      }
      const packed_density = density * (packingFractionVal / 100)
      const mu_packed = mu_over_rho * packed_density

      const capillaryRadius = parseFloat(form.capillaryRadius)
      let cylindricalResult: { readonly muR: number; readonly transmission: number } | undefined
      if (!isNaN(capillaryRadius) && capillaryRadius > 0) {
        cylindricalResult = calcCylindricalAbsorption(mu_packed, capillaryRadius)
      }

      // 11. Set result
      const calcResult: CalculationResult = {
        mu_over_rho,
        mu,
        optimal_thickness_mm: absorption.optimal_thickness_mm,
        transmission: absorption.transmission,
        weight_fractions: fractions,
        packed_density,
        muR: cylindricalResult?.muR,
        cylindrical_transmission: cylindricalResult?.transmission,
      }
      setResult(calcResult)

      // 12. Generate chart data using first element's energy grid
      const symbols = Object.keys(composition)
      const firstSymbol = symbols[0]
      const referenceData = muData[firstSymbol]

      const points: ChartDataPoint[] = []
      for (const point of referenceData.data) {
        try {
          const compMu = calcCompoundMu(fractions, muData, point.energy_eV)
          points.push({
            energy_eV: point.energy_eV,
            mu_over_rho: compMu,
          })
        } catch {
          // Skip energy points that fail interpolation
        }
      }
      setChartData(points)

      // Collect all edges from all elements
      const edges: ChartEdge[] = []
      for (const symbol of symbols) {
        const elMu = muData[symbol]
        if (elMu) {
          for (const edgeEnergy of elMu.edges) {
            edges.push({
              energy_eV: edgeEnergy,
              label: `${symbol} ${edgeEnergy.toFixed(0)} eV`,
            })
          }
        }
      }
      setChartEdges(edges)
    } catch (err) {
      if (err instanceof FormulaError) {
        setError(`Formula error at position ${err.position}: ${err.message}`)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }, [form])

  const currentEnergy_eV =
    form.energyUnit === 'keV'
      ? parseFloat(form.energyValue) * 1000
      : (HC_KEV_ANGSTROM / parseFloat(form.energyValue)) * 1000

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left panel: Input form */}
      <div className="lg:w-80 shrink-0 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Chemical Formula
          </label>
          <input
            type="text"
            value={form.formula}
            onChange={(e) => handleChange('formula', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            placeholder="e.g. CaCO3, Fe2O3"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Energy</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.energyValue}
              onChange={(e) => handleChange('energyValue', e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="30"
            />
            <button
              onClick={() =>
                handleChange(
                  'energyUnit',
                  form.energyUnit === 'keV' ? 'Angstrom' : 'keV',
                )
              }
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              {form.energyUnit}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Estimated Density (g/cm³)
          </label>
          <input
            type="text"
            value={form.density}
            onChange={(e) => handleChange('density', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            placeholder="2.71"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Packing Fraction (%)
          </label>
          <input
            type="text"
            value={form.packingFraction}
            onChange={(e) => handleChange('packingFraction', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            placeholder="60"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Capillary Radius (mm)
          </label>
          <input
            type="text"
            value={form.capillaryRadius}
            onChange={(e) => handleChange('capillaryRadius', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            placeholder="0.4"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Thickness (mm)
          </label>
          <input
            type="text"
            value={form.thickness}
            onChange={(e) => handleChange('thickness', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            placeholder="0.8"
          />
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Right panel: Results + Chart */}
      <div className="flex-1 space-y-4">
        {result && (
          <>
            <p className="text-xs text-gray-500 tracking-wider">
              Material Properties
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <ResultCard
                label="μ/ρ"
                value={result.mu_over_rho.toFixed(4)}
                unit="cm²/g"
              />
              <ResultCard
                label="μ"
                value={result.mu.toFixed(4)}
                unit="cm⁻¹"
              />
              <ResultCard
                label="Optimal Thickness"
                value={result.optimal_thickness_mm.toFixed(4)}
                unit="mm"
              />
              {result.transmission !== undefined && (
                <ResultCard
                  label="Flat Transmission"
                  value={(result.transmission * 100).toFixed(2)}
                  unit="%"
                />
              )}
            </div>

            {result.packed_density !== undefined && result.muR !== undefined && result.cylindrical_transmission !== undefined && (
              <>
                <div className="border-t border-gray-700 my-2" />
                <p className="text-xs text-gray-500 tracking-wider">
                  Capillary Geometry
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <ResultCard
                    label="Packed Density"
                    value={result.packed_density.toFixed(3)}
                    unit="g/cm³"
                  />
                  <ResultCard
                    label="μ (packed)"
                    value={(result.mu_over_rho * result.packed_density).toFixed(4)}
                    unit="cm⁻¹"

                  />
                  <ResultCard
                    label="μR"
                    value={result.muR.toFixed(4)}
                    unit=""
                  />
                  <ResultCard
                    label="Cylindrical Transmission"
                    value={(result.cylindrical_transmission * 100).toFixed(4)}
                    unit="%"
                  />
                </div>
              </>
            )}

            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-xs text-gray-500 tracking-wider mb-2">
                Weight Fractions
              </p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(result.weight_fractions).map(
                  ([symbol, frac]) => (
                    <span key={symbol} className="text-sm font-mono">
                      <span className="text-gray-400">{symbol}:</span>{' '}
                      <span className="text-white">
                        {(frac * 100).toFixed(2)}%
                      </span>
                    </span>
                  ),
                )}
              </div>
            </div>
          </>
        )}

        {chartData.length > 0 && (
          <EnergyChart
            data={chartData}
            edges={chartEdges}
            currentEnergy_eV={
              isNaN(currentEnergy_eV) ? undefined : currentEnergy_eV
            }
          />
        )}
      </div>
    </div>
  )
}
