interface ResultCardProps {
  readonly label: string
  readonly value: string
  readonly unit: string
}

export function ResultCard({ label, value, unit }: ResultCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <p className="text-xs text-gray-500 tracking-wider">{label}</p>
      <p className="text-2xl font-bold font-mono mt-1">
        {value}
        <span className="text-sm text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  )
}
