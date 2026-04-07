'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'

const ELEMENT_COLORS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#ea580c', // orange
  '#0891b2', // cyan
  '#9333ea', // purple
  '#db2777', // pink
  '#854d0e', // amber
] as const

const TOTAL_COLOR = '#7c3aed'

type XAxisScale = 'log' | 'linear'

interface AbsorptionChartProps {
  readonly data: readonly Record<string, number>[]
  readonly elements: readonly string[]
  readonly currentEnergy_keV?: number
}

function formatEnergyKeV(logVal: number): string {
  const v = Math.pow(10, logVal)
  if (v >= 100) return `${v.toFixed(0)}`
  if (v >= 10) return `${v.toFixed(0)}`
  if (v >= 1) return `${v.toFixed(1)}`
  return `${v.toFixed(2)}`
}

function formatLinearKeV(val: number): string {
  if (val >= 100) return `${val.toFixed(0)}`
  if (val >= 10) return `${val.toFixed(0)}`
  if (val >= 1) return `${val.toFixed(1)}`
  return `${val.toFixed(2)}`
}

function getElementColor(index: number): string {
  return ELEMENT_COLORS[index % ELEMENT_COLORS.length]
}

export function EnergyChart({ data, elements, currentEnergy_keV }: AbsorptionChartProps) {
  const [xScale, setXScale] = useState<XAxisScale>('log')
  const [visibleSeries, setVisibleSeries] = useState<ReadonlySet<string>>(
    () => new Set([...elements, 'Total']),
  )

  const handleToggle = useCallback((key: string) => {
    setVisibleSeries((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  // Transform data for log x-axis
  const chartData = useMemo(() => {
    if (xScale === 'linear') return data
    return data
      .filter((d) => d.energy_keV > 0)
      .map((d) => {
        const transformed: Record<string, number> = { ...d }
        transformed['logE'] = Math.log10(d.energy_keV)
        return transformed
      })
  }, [data, xScale])

  const xDataKey = xScale === 'log' ? 'logE' : 'energy_keV'
  const xTickFormatter = xScale === 'log' ? formatEnergyKeV : formatLinearKeV
  const currentEnergyX = currentEnergy_keV && currentEnergy_keV > 0
    ? (xScale === 'log' ? Math.log10(currentEnergy_keV) : currentEnergy_keV)
    : undefined

  if (data.length === 0) return null

  const seriesKeys = [...elements, 'Total'] as const

  return (
    <div className="bg-white rounded-lg border border-[#FFD4C0] p-4">
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Left chart: muR vs Energy */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 mb-2">
            muR vs Energy (keV)
          </p>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis
                dataKey={xDataKey}
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={xTickFormatter}
                stroke="#374151"
                tick={{ fill: '#374151', fontSize: 11 }}
                height={40}
              />
              <YAxis
                type="number"
                domain={['auto', 'auto']}
                stroke="#374151"
                tick={{ fill: '#374151', fontSize: 11 }}
                label={{ value: 'muR', angle: -90, position: 'insideLeft', fill: '#374151', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '6px' }}
                labelFormatter={(_label, payload) => {
                  const entry = payload?.[0] as { payload?: Record<string, number> } | undefined
                  const e = entry?.payload?.energy_keV
                  return e !== undefined ? `${e.toFixed(3)} keV` : ''
                }}
                formatter={(_value, name) => {
                  const v = Number(_value)
                  return [isNaN(v) ? '' : v.toFixed(4), String(name).replace('muR_', '')]
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value: string) => value.replace('muR_', '')}
              />
              {elements.map((el, i) =>
                visibleSeries.has(el) ? (
                  <Line
                    key={`muR_${el}`}
                    type="monotone"
                    dataKey={`muR_${el}`}
                    stroke={getElementColor(i)}
                    dot={false}
                    strokeWidth={1.5}
                    name={`muR_${el}`}
                    isAnimationActive={false}
                  />
                ) : null,
              )}
              {visibleSeries.has('Total') && (
                <Line
                  type="monotone"
                  dataKey="muR_Total"
                  stroke={TOTAL_COLOR}
                  dot={false}
                  strokeWidth={2.5}
                  name="muR_Total"
                  isAnimationActive={false}
                />
              )}
              {currentEnergyX !== undefined && (
                <ReferenceLine
                  x={currentEnergyX}
                  stroke="#000000"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  label={{ value: 'Current', fill: '#000', fontSize: 10 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Right chart: Transmission vs Energy */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Transmission vs Energy (keV)
          </p>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis
                dataKey={xDataKey}
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={xTickFormatter}
                stroke="#374151"
                tick={{ fill: '#374151', fontSize: 11 }}
                height={40}
              />
              <YAxis
                type="number"
                domain={[0, 1]}
                stroke="#374151"
                tick={{ fill: '#374151', fontSize: 11 }}
                label={{ value: 'Transmission', angle: -90, position: 'insideLeft', fill: '#374151', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '6px' }}
                labelFormatter={(_label, payload) => {
                  const entry = payload?.[0] as { payload?: Record<string, number> } | undefined
                  const e = entry?.payload?.energy_keV
                  return e !== undefined ? `${e.toFixed(3)} keV` : ''
                }}
                formatter={(_value, name) => {
                  const v = Number(_value)
                  return [isNaN(v) ? '' : (v * 100).toFixed(2) + '%', String(name).replace('trans_', '')]
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value: string) => value.replace('trans_', '')}
              />
              {elements.map((el, i) =>
                visibleSeries.has(el) ? (
                  <Line
                    key={`trans_${el}`}
                    type="monotone"
                    dataKey={`trans_${el}`}
                    stroke={getElementColor(i)}
                    dot={false}
                    strokeWidth={1.5}
                    name={`trans_${el}`}
                    isAnimationActive={false}
                  />
                ) : null,
              )}
              {visibleSeries.has('Total') && (
                <Line
                  type="monotone"
                  dataKey="trans_Total"
                  stroke={TOTAL_COLOR}
                  dot={false}
                  strokeWidth={2.5}
                  name="trans_Total"
                  isAnimationActive={false}
                />
              )}
              {currentEnergyX !== undefined && (
                <ReferenceLine
                  x={currentEnergyX}
                  stroke="#000000"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  label={{ value: 'Current', fill: '#000', fontSize: 10 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Plot Options panel */}
        <div className="xl:w-48 shrink-0">
          <p className="text-sm font-medium text-gray-700 mb-3">Plot Options</p>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">X-axis Scale</label>
            <select
              value={xScale}
              onChange={(e) => setXScale(e.target.value as XAxisScale)}
              className="w-full bg-white border border-[#FFB899] rounded px-2 py-1 text-sm text-gray-700 focus:outline-none focus:border-[#FF378F]"
            >
              <option value="log">Log</option>
              <option value="linear">Linear</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Visible Series</label>
            <div className="space-y-1">
              {seriesKeys.map((key, i) => {
                const color = key === 'Total' ? TOTAL_COLOR : getElementColor(i)
                return (
                  <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleSeries.has(key)}
                      onChange={() => handleToggle(key)}
                      className="rounded border-gray-300"
                    />
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span>{key}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
