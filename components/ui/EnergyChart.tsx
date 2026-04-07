'use client'

import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'

interface ChartDataPoint {
  readonly energy_eV: number
  readonly mu_over_rho: number
}

interface EdgeMarker {
  readonly energy_eV: number
  readonly label: string
}

interface EnergyChartProps {
  readonly data: readonly ChartDataPoint[]
  readonly edges: readonly EdgeMarker[]
  readonly currentEnergy_eV?: number
}

function formatEnergy(logVal: number): string {
  const v = Math.pow(10, logVal)
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
  return `${v.toFixed(0)}`
}

function formatMu(logVal: number): string {
  const v = Math.pow(10, logVal)
  return v.toExponential(0)
}

export function EnergyChart({ data, edges, currentEnergy_eV }: EnergyChartProps) {
  const logData = useMemo(() =>
    data
      .filter((d) => d.energy_eV > 0 && d.mu_over_rho > 0)
      .map((d) => ({
        logE: Math.log10(d.energy_eV),
        logMu: Math.log10(d.mu_over_rho),
        energy_eV: d.energy_eV,
        mu_over_rho: d.mu_over_rho,
      })),
    [data],
  )

  const logEdges = useMemo(() =>
    edges
      .filter((e) => e.energy_eV > 0)
      .map((e) => ({
        logE: Math.log10(e.energy_eV),
        label: e.label,
      })),
    [edges],
  )

  const logCurrentE = currentEnergy_eV && currentEnergy_eV > 0
    ? Math.log10(currentEnergy_eV)
    : undefined

  if (logData.length === 0) return null

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <p className="text-xs text-gray-500 tracking-wider mb-2">
        μ/ρ vs Energy
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={logData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="logE"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatEnergy}
            stroke="#666"
            label={{ value: 'Energy (eV)', position: 'insideBottom', offset: -5, fill: '#666' }}
          />
          <YAxis
            dataKey="logMu"
            type="number"
            domain={['dataMin', 'dataMax']}
            stroke="#666"
            tickFormatter={formatMu}
            label={{ value: 'μ/ρ (cm²/g)', angle: -90, position: 'insideLeft', fill: '#666' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
            formatter={(_value, _name, props) => {
              const mu = (props.payload as Record<string, number>)?.mu_over_rho
              return [mu !== undefined ? mu.toFixed(4) : '', 'μ/ρ (cm²/g)']
            }}
            labelFormatter={(_label, payload) => {
              const entry = payload?.[0] as { payload?: Record<string, number> } | undefined
              const e = entry?.payload?.energy_eV
              return e !== undefined ? `${e.toFixed(1)} eV` : ''
            }}
          />
          <Line
            type="monotone"
            dataKey="logMu"
            stroke="#4a6cf7"
            dot={false}
            strokeWidth={2}
          />
          {logEdges.map((edge) => (
            <ReferenceLine
              key={edge.label}
              x={edge.logE}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: edge.label, fill: '#ef4444', fontSize: 10 }}
            />
          ))}
          {logCurrentE !== undefined && (
            <ReferenceLine
              x={logCurrentE}
              stroke="#22c55e"
              strokeWidth={2}
              label={{ value: 'Current', fill: '#22c55e', fontSize: 10 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
