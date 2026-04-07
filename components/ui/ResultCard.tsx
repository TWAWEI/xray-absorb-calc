interface ResultCardProps {
  readonly label: string
  readonly value: string
  readonly unit: string
}

export function ResultCard({ label, value, unit }: ResultCardProps) {
  return (
    <div className="bg-[#F0EDEB] border border-[#DFC1BF] rounded-lg p-4">
      <p className="text-xs text-[#5A6B63] tracking-wider">{label}</p>
      <p className="text-2xl font-bold font-mono mt-1 text-gray-900">
        {value}
        <span className="text-sm text-gray-500 ml-1">{unit}</span>
      </p>
    </div>
  )
}
