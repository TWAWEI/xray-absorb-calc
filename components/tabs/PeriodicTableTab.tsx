'use client'

import { useState, useEffect } from 'react'
import { PeriodicTable } from '@/components/PeriodicTable'
import { loadElements, loadEdges } from '@/lib/data-loader'
import type { ElementData, AbsorptionEdge } from '@/lib/types'

export function PeriodicTableTab() {
  const [selectedElement, setSelectedElement] = useState<string | undefined>()
  const [elementInfo, setElementInfo] = useState<ElementData | null>(null)
  const [elementEdges, setElementEdges] = useState<readonly AbsorptionEdge[]>([])
  const [elements, setElements] = useState<readonly ElementData[]>([])
  const [edges, setEdges] = useState<Readonly<Record<string, readonly AbsorptionEdge[]>>>({})

  useEffect(() => {
    Promise.all([loadElements(), loadEdges()]).then(([el, ed]) => {
      setElements(el)
      setEdges(ed)
    })
  }, [])

  useEffect(() => {
    if (selectedElement) {
      const info = elements.find((e) => e.symbol === selectedElement) ?? null
      setElementInfo(info)
      setElementEdges(edges[selectedElement] ?? [])
    } else {
      setElementInfo(null)
      setElementEdges([])
    }
  }, [selectedElement, elements, edges])

  return (
    <div className="space-y-6">
      <PeriodicTable onSelectElement={setSelectedElement} selectedElement={selectedElement} />
      {elementInfo && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-4xl font-bold text-gray-900">{elementInfo.symbol}</span>
            <span className="text-gray-500">{elementInfo.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Atomic Number</span>
              <p className="font-mono text-gray-900">{elementInfo.Z}</p>
            </div>
            <div>
              <span className="text-gray-500">Atomic Mass</span>
              <p className="font-mono text-gray-900">{elementInfo.atomic_mass.toFixed(4)} u</p>
            </div>
          </div>
          {elementEdges.length > 0 && (
            <div className="mt-4">
              <span className="text-gray-500 text-sm">Key Edges</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {elementEdges.slice(0, 5).map((edge) => (
                  <span key={edge.edge} className="px-2 py-1 bg-gray-200 rounded text-xs font-mono text-gray-800">
                    {edge.edge}: {(edge.energy_eV / 1000).toFixed(3)} keV
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
