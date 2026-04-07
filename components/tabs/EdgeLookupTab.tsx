'use client'

import { useState, useEffect } from 'react'
import { PeriodicTable } from '@/components/PeriodicTable'
import { loadEdges } from '@/lib/data-loader'
import type { AbsorptionEdge } from '@/lib/types'

export function EdgeLookupTab() {
  const [selectedElement, setSelectedElement] = useState<string | undefined>()
  const [edges, setEdges] = useState<readonly AbsorptionEdge[]>([])
  const [allEdges, setAllEdges] = useState<Readonly<Record<string, readonly AbsorptionEdge[]>>>({})

  useEffect(() => {
    loadEdges().then(setAllEdges)
  }, [])

  useEffect(() => {
    if (selectedElement && allEdges[selectedElement]) {
      setEdges(allEdges[selectedElement])
    } else {
      setEdges([])
    }
  }, [selectedElement, allEdges])

  return (
    <div className="space-y-6">
      <PeriodicTable onSelectElement={setSelectedElement} selectedElement={selectedElement} />
      {selectedElement && edges.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3">{selectedElement} — Absorption Edges</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-200">
                <th className="text-left py-2">Edge</th>
                <th className="text-right py-2">Energy (eV)</th>
                <th className="text-right py-2">Energy (keV)</th>
                <th className="text-right py-2">Fluorescence Yield</th>
              </tr>
            </thead>
            <tbody>
              {edges.map((edge) => (
                <tr key={edge.edge} className="border-b border-gray-100">
                  <td className="py-2 font-mono text-gray-900">{edge.edge}</td>
                  <td className="text-right font-mono text-gray-900">{edge.energy_eV.toFixed(2)}</td>
                  <td className="text-right font-mono text-gray-900">{(edge.energy_eV / 1000).toFixed(4)}</td>
                  <td className="text-right font-mono text-gray-900">{edge.fluorescence_yield?.toFixed(4) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
