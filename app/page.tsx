'use client'

import { useState } from 'react'
import { AbsorptionTab } from '@/components/tabs/AbsorptionTab'
import { EdgeLookupTab } from '@/components/tabs/EdgeLookupTab'
import { FluorescenceTab } from '@/components/tabs/FluorescenceTab'
import { PeriodicTableTab } from '@/components/tabs/PeriodicTableTab'

const TABS = ['Absorption', 'Edge Lookup', 'Fluorescence', 'Periodic Table'] as const
type Tab = typeof TABS[number]

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('Absorption')

  return (
    <div>
      <div className="flex gap-1 px-6 py-2 border-b border-[#FFD4C0] bg-white">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab
                ? 'bg-[#FF378F] text-white'
                : 'bg-[#FFE0D0] text-gray-700 hover:text-gray-900 hover:bg-[#FFD0C0]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="p-6">
        {activeTab === 'Absorption' && <AbsorptionTab />}
        {activeTab === 'Edge Lookup' && <EdgeLookupTab />}
        {activeTab === 'Fluorescence' && <FluorescenceTab />}
        {activeTab === 'Periodic Table' && <PeriodicTableTab />}
      </div>
    </div>
  )
}
