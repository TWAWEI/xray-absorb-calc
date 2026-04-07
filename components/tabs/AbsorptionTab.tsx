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
import { buildPerElementChartData } from '@/lib/chart-data'
import type { CalculationResult } from '@/lib/types'

type EnergyUnit = 'keV' | 'Angstrom'
type SizeMode = 'radius' | 'diameter'
type DensityMode = 'packing' | 'density'

interface FormState {
  readonly formula: string
  readonly energyValue: string
  readonly energyUnit: EnergyUnit
  readonly density: string
  readonly thickness: string
  readonly sizeMode: SizeMode
  readonly sizeValue: string
  readonly densityMode: DensityMode
  readonly densityModeValue: string
}

const INITIAL_FORM: FormState = {
  formula: 'CaCO3',
  energyValue: '30',
  energyUnit: 'keV',
  density: '2.71',
  thickness: '0.8',
  sizeMode: 'radius',
  sizeValue: '0.4',
  densityMode: 'packing',
  densityModeValue: '0.6',
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
  const [chartData, setChartData] = useState<readonly Record<string, number>[]>([])
  const [chartElements, setChartElements] = useState<readonly string[]>([])
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
    setChartElements([])
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

      // 10. Cylindrical geometry
      const densityModeValue = parseFloat(form.densityModeValue)
      let packed_density: number
      if (form.densityMode === 'packing') {
        if (isNaN(densityModeValue) || densityModeValue < 0 || densityModeValue > 1) {
          throw new Error('Packing fraction must be between 0 and 1')
        }
        packed_density = density * densityModeValue
      } else {
        if (isNaN(densityModeValue) || densityModeValue <= 0) {
          throw new Error('Sample density must be positive')
        }
        packed_density = densityModeValue
      }
      const mu_packed = mu_over_rho * packed_density

      const sizeValue = parseFloat(form.sizeValue)
      const capillaryRadius = form.sizeMode === 'diameter' ? sizeValue / 2 : sizeValue
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

      // 12. Generate per-element chart data for muR and transmission curves
      const symbols = Object.keys(composition)
      const perElementData = buildPerElementChartData(
        fractions,
        muData,
        packed_density,
        capillaryRadius,
      )
      setChartData(perElementData)
      setChartElements(symbols)
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

  const currentEnergy_keV =
    form.energyUnit === 'keV'
      ? parseFloat(form.energyValue)
      : HC_KEV_ANGSTROM / parseFloat(form.energyValue)

  return (
    <div className="space-y-6">
      {/* Input form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
        <div>
          <label className="block text-sm text-[#5A6B63] mb-1">
            Chemical Formula
          </label>
          <input
            type="text"
            value={form.formula}
            onChange={(e) => handleChange('formula', e.target.value)}
            className="w-full w-full bg-white border border-[#A5BFAF] rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-[#4EBC97]"
            placeholder="e.g. CaCO3, Fe2O3"
          />
        </div>

        <div>
          <label className="block text-sm text-[#5A6B63] mb-1">Energy</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.energyValue}
              onChange={(e) => handleChange('energyValue', e.target.value)}
              className="flex-1 w-full bg-white border border-[#A5BFAF] rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-[#4EBC97]"
              placeholder="30"
            />
            <button
              onClick={() =>
                handleChange(
                  'energyUnit',
                  form.energyUnit === 'keV' ? 'Angstrom' : 'keV',
                )
              }
              className="px-3 py-2 bg-[#F0EDEB] border border-[#A5BFAF] rounded-lg text-sm text-gray-700 hover:bg-[#DFC1BF] transition-colors"
            >
              {form.energyUnit}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#5A6B63] mb-1">
            Estimated Density (g/cm³)
          </label>
          <input
            type="text"
            value={form.density}
            onChange={(e) => handleChange('density', e.target.value)}
            className="w-full w-full bg-white border border-[#A5BFAF] rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-[#4EBC97]"
            placeholder="2.71"
          />
        </div>

        <div>
          <label className="block text-sm text-[#5A6B63] mb-1">
            Sample Size Mode
          </label>
          <div className="flex gap-2">
            <select
              value={form.sizeMode}
              onChange={(e) => handleChange('sizeMode', e.target.value)}
              className="bg-white border border-[#A5BFAF] rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#4EBC97]"
            >
              <option value="radius">Radius (mm)</option>
              <option value="diameter">Diameter (mm)</option>
            </select>
            <input
              type="text"
              value={form.sizeValue}
              onChange={(e) => handleChange('sizeValue', e.target.value)}
              className="flex-1 w-full bg-white border border-[#A5BFAF] rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-[#4EBC97]"
              placeholder="0.4"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#5A6B63] mb-1">
            Sample Density or Packing Fraction
          </label>
          <div className="flex gap-2">
            <select
              value={form.densityMode}
              onChange={(e) => handleChange('densityMode', e.target.value)}
              className="bg-white border border-[#A5BFAF] rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#4EBC97]"
            >
              <option value="packing">Packing Fraction (0-1)</option>
              <option value="density">Sample Density (g/cm³)</option>
            </select>
            <input
              type="text"
              value={form.densityModeValue}
              onChange={(e) => handleChange('densityModeValue', e.target.value)}
              className="flex-1 w-full bg-white border border-[#A5BFAF] rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-[#4EBC97]"
              placeholder={form.densityMode === 'packing' ? '0.6' : '1.63'}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#5A6B63] mb-1">
            Thickness (mm)
          </label>
          <input
            type="text"
            value={form.thickness}
            onChange={(e) => handleChange('thickness', e.target.value)}
            className="w-full w-full bg-white border border-[#A5BFAF] rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-[#4EBC97]"
            placeholder="0.8"
          />
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="w-full py-2 bg-[#4EBC97] text-white rounded-lg hover:bg-[#6BBD9F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>

        {error && (
          <div className="bg-[#FCC0C7]/20 border border-[#e55] rounded-lg p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Results + Chart */}
      <div className="space-y-4">
        {result && (
          <>
            <p className="text-xs text-[#4EBC97] tracking-wider font-semibold">
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
                <div className="border-t border-[#DFC1BF] my-2" />
                <p className="text-xs text-[#4EBC97] tracking-wider font-semibold">
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

            <div className="bg-[#F0EDEB] border border-[#DFC1BF] rounded-lg p-4">
              <p className="text-xs text-[#4EBC97] tracking-wider font-semibold mb-2">
                Weight Fractions
              </p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(result.weight_fractions).map(
                  ([symbol, frac]) => (
                    <span key={symbol} className="text-sm font-mono">
                      <span className="text-[#5A6B63]">{symbol}:</span>{' '}
                      <span className="text-gray-900">
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
            elements={chartElements}
            currentEnergy_keV={
              isNaN(currentEnergy_keV) ? undefined : currentEnergy_keV
            }
          />
        )}
      </div>
    </div>
  )
}
