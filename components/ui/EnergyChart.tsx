'use client'

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

export function EnergyChart({ data, edges, currentEnergy_eV }: EnergyChartProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <p className="text-xs text-gray-500 tracking-wider mb-2">
        μ/ρ vs Energy
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data as ChartDataPoint[]}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="energy_eV"
            scale="log"
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
            stroke="#666"
            label={{ value: 'Energy (eV)', position: 'insideBottom', offset: -5, fill: '#666' }}
          />
          <YAxis
            scale="log"
            domain={['auto', 'auto']}
            stroke="#666"
            tickFormatter={(v: number) => v.toExponential(0)}
            label={{ value: 'μ/ρ (cm²/g)', angle: -90, position: 'insideLeft', fill: '#666' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
            formatter={(value) => [Number(value).toFixed(4), 'μ/ρ']}
            labelFormatter={(label) => `${Number(label).toFixed(1)} eV`}
          />
          <Line
            type="monotone"
            dataKey="mu_over_rho"
            stroke="#4a6cf7"
            dot={false}
            strokeWidth={2}
          />
          {edges.map((edge) => (
            <ReferenceLine
              key={edge.label}
              x={edge.energy_eV}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: edge.label, fill: '#ef4444', fontSize: 10 }}
            />
          ))}
          {currentEnergy_eV && (
            <ReferenceLine
              x={currentEnergy_eV}
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
