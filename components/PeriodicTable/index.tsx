'use client'

import { PERIODIC_LAYOUT, CATEGORY_COLORS, type PeriodicElement } from './element-data'

interface PeriodicTableProps {
  readonly onSelectElement: (symbol: string) => void
  readonly selectedElement?: string
}

export function PeriodicTable({ onSelectElement, selectedElement }: PeriodicTableProps) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-0.5 min-w-[720px]"
        style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
      >
        {PERIODIC_LAYOUT.map((el) => (
          <button
            key={el.Z}
            onClick={() => onSelectElement(el.symbol)}
            className={`
              p-1 rounded text-center cursor-pointer transition-all
              border border-transparent hover:border-blue-400
              ${CATEGORY_COLORS[el.category] ?? 'bg-gray-800'}
              ${selectedElement === el.symbol ? 'ring-2 ring-blue-500 border-blue-500' : ''}
            `}
            style={{
              gridRow: el.row,
              gridColumn: el.col,
            }}
            title={`${el.name} (Z=${el.Z})`}
          >
            <div className="text-[10px] text-gray-500">{el.Z}</div>
            <div className="text-sm font-bold">{el.symbol}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
