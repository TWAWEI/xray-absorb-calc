interface ResultCardProps {
  readonly label: string
  readonly value: string
  readonly unit: string
}

export function ResultCard({ label, value, unit }: ResultCardProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500 tracking-wider">{label}</p>
      <p className="text-2xl font-bold font-mono mt-1 text-gray-900">
        {value}
        <span className="text-sm text-gray-500 ml-1">{unit}</span>
      </p>
    </div>
  )
}
