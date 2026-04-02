'use client'

import { useState } from 'react'

const TABS = ['Absorption', 'Edge Lookup', 'Fluorescence', 'Periodic Table'] as const
type Tab = typeof TABS[number]

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('Absorption')

  return (
    <div>
      <div className="flex gap-1 px-6 py-2 border-b border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="p-6">
        <p className="text-gray-500">Tab: {activeTab} (coming soon)</p>
      </div>
    </div>
  )
}
