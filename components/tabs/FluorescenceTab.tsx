'use client'

import { useState, useEffect } from 'react'
import { PeriodicTable } from '@/components/PeriodicTable'
import { loadFluorescence } from '@/lib/data-loader'
import type { FluorescenceLine } from '@/lib/types'

export function FluorescenceTab() {
  const [selectedElement, setSelectedElement] = useState<string | undefined>()
  const [lines, setLines] = useState<readonly FluorescenceLine[]>([])
  const [allLines, setAllLines] = useState<Readonly<Record<string, readonly FluorescenceLine[]>>>({})

  useEffect(() => {
    loadFluorescence().then(setAllLines)
  }, [])

  useEffect(() => {
    if (selectedElement && allLines[selectedElement]) {
      setLines(allLines[selectedElement])
    } else {
      setLines([])
    }
  }, [selectedElement, allLines])

  return (
    <div className="space-y-6">
      <PeriodicTable onSelectElement={setSelectedElement} selectedElement={selectedElement} />
      {selectedElement && lines.length > 0 && (
        <div className="bg-[#FFF5F0] border border-[#FFD4C0] rounded-lg p-4">
          <h3 className="text-lg font-bold text-[#FF378F] mb-3">{selectedElement} — Fluorescence Lines</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#FF378F] border-b border-[#FFB899]">
                <th className="text-left py-2">Line</th>
                <th className="text-right py-2">Energy (eV)</th>
                <th className="text-right py-2">Energy (keV)</th>
                <th className="text-right py-2">Relative Intensity</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.line} className="border-b border-[#FFE8E0]">
                  <td className="py-2 font-mono text-gray-900">{line.line}</td>
                  <td className="text-right font-mono text-gray-900">{line.energy_eV.toFixed(2)}</td>
                  <td className="text-right font-mono text-gray-900">{(line.energy_eV / 1000).toFixed(4)}</td>
                  <td className="text-right font-mono text-gray-900">{line.intensity.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
