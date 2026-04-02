# X-Ray Absorption Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure-frontend X-ray absorption calculator for synchrotron beamline users, deployed on Vercel.

**Architecture:** Next.js 14 App Router with static export. All X-ray data (Elam database) pre-exported from xraydb as JSON. Calculations run entirely in the browser via TypeScript. Single-page app with tab navigation.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Recharts, Vitest, Vercel

**Spec:** `docs/superpowers/specs/2026-04-02-xray-absorb-calculator-design.md`

---

## File Map

```
xray-absorb-calc/
├── app/
│   ├── layout.tsx              # Root layout: dark theme, top nav bar
│   ├── page.tsx                # Tab container: manages active tab state
│   └── globals.css             # Tailwind imports + dark theme variables
├── components/
│   ├── tabs/
│   │   ├── AbsorptionTab.tsx   # Input form + results + chart
│   │   ├── EdgeLookupTab.tsx   # Element selector + edge table
│   │   ├── FluorescenceTab.tsx # Element selector + emission lines table
│   │   └── PeriodicTableTab.tsx# Full periodic table with popup
│   ├── ui/
│   │   ├── ResultCard.tsx      # Single result value display
│   │   └── EnergyChart.tsx     # μ vs Energy log-log chart (Recharts)
│   └── PeriodicTable/
│       ├── index.tsx           # Periodic table grid + click handler
│       └── element-data.ts     # Layout positions for 118 elements
├── lib/
│   ├── formula-parser.ts       # Recursive descent chemical formula parser
│   ├── element-symbols.ts      # Valid element symbol set (H–Cf)
│   ├── calculator.ts           # μ/ρ lookup, interpolation, compound μ, absorption calc
│   ├── data-loader.ts          # Lazy-load JSON data files via fetch
│   ├── types.ts                # Shared TypeScript types
│   └── constants.ts            # Physical constants (hc, etc.)
├── data/                       # Static JSON (committed, served as assets)
│   ├── elements.json
│   ├── edges.json
│   ├── fluorescence.json
│   └── mu-data.json
├── scripts/
│   ├── export-xraydb.py        # Python: xraydb SQLite → JSON
│   └── requirements.txt        # xraydb dependency
├── __tests__/
│   ├── formula-parser.test.ts
│   ├── calculator.test.ts
│   └── data-loader.test.ts
├── next.config.js              # output: 'export', static assets config
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `vitest.config.ts`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `lib/types.ts`, `lib/constants.ts`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/hsutingwei/xray-absorb-calc
npx create-next-app@14 . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --use-npm --no-eslint
```

If prompted about existing files, allow overwrite (only `.gitignore` and `docs/` exist).

- [ ] **Step 2: Install dependencies**

```bash
npm install recharts
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Configure next.config.js for static export**

Set `output: 'export'` in `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
}
module.exports = nextConfig
```

Note: `fetch('/data/...')` assumes the app is served from the root path. If deploying to a subdirectory (e.g., GitHub Pages), a `basePath` must be added.

- [ ] **Step 4: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 5: Create lib/types.ts**

```ts
export interface ElementData {
  readonly Z: number
  readonly symbol: string
  readonly name: string
  readonly atomic_mass: number
}

export interface AbsorptionEdge {
  readonly edge: string
  readonly energy_eV: number
  readonly fluorescence_yield?: number
}

export interface FluorescenceLine {
  readonly line: string
  readonly energy_eV: number
  readonly intensity: number
}

export interface MuDataPoint {
  readonly energy_eV: number
  readonly mu_over_rho: number
}

export interface ElementMuData {
  readonly symbol: string
  readonly edges: readonly number[]
  readonly data: readonly MuDataPoint[]
}

export interface FormulaComposition {
  readonly [symbol: string]: number
}

export interface CalculationInput {
  readonly formula: string
  readonly energy_keV: number
  readonly density_g_cm3: number
  readonly thickness_mm?: number
}

export interface CalculationResult {
  readonly mu_over_rho: number
  readonly mu: number
  readonly optimal_thickness_mm: number
  readonly transmission?: number
  readonly weight_fractions: Readonly<Record<string, number>>
}
```

- [ ] **Step 6: Create lib/constants.ts**

```ts
// Planck's constant × speed of light for energy-wavelength conversion
// E(keV) = HC_KEV_ANGSTROM / λ(Å)
export const HC_KEV_ANGSTROM = 12.3984 as const

export const ENERGY_MIN_KEV = 0.1 as const
export const ENERGY_MAX_KEV = 1000 as const
```

- [ ] **Step 7: Create minimal app/layout.tsx with dark theme**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'X-Ray Absorption Calculator',
  description: 'Calculate X-ray absorption properties for synchrotron experiments',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">X-Ray Absorb Calculator</h1>
          <div className="text-sm text-gray-400">
            <a href="https://github.com" className="hover:text-gray-200">GitHub</a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 8: Create placeholder app/page.tsx with tabs**

```tsx
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
```

- [ ] **Step 9: Verify dev server runs**

```bash
npm run dev
```

Open http://localhost:3000 — should see dark page with nav bar and 4 tab buttons.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with dark theme and tab navigation"
```

---

## Task 2: Data Export Script

**Files:**
- Create: `scripts/export-xraydb.py`, `scripts/requirements.txt`
- Create: `data/elements.json`, `data/edges.json`, `data/fluorescence.json`, `data/mu-data.json`

- [ ] **Step 1: Create scripts/requirements.txt**

```
xraydb>=4.5
```

- [ ] **Step 2: Install Python dependencies**

```bash
cd /Users/hsutingwei/xray-absorb-calc
pip install -r scripts/requirements.txt
```

- [ ] **Step 3: Create scripts/export-xraydb.py**

```python
#!/usr/bin/env python3
"""Export xraydb data to JSON files for the frontend."""

import json
import xraydb

def export_elements():
    """Export element basic data: Z, symbol, name, atomic_mass."""
    elements = []
    for z in range(1, 99):  # H(1) to Cf(98)
        sym = xraydb.atomic_symbol(z)
        name = xraydb.atomic_name(z)
        mass = xraydb.atomic_mass(z)
        elements.append({
            "Z": z,
            "symbol": sym,
            "name": name,
            "atomic_mass": round(mass, 6),
        })
    return elements

def export_edges():
    """Export absorption edge energies per element."""
    edges = {}
    for z in range(1, 99):
        sym = xraydb.atomic_symbol(z)
        element_edges = []
        for edge_name in xraydb.xray_edges(z):
            edge = xraydb.xray_edge(z, edge_name)
            if edge is not None and edge.energy > 0:
                element_edges.append({
                    "edge": edge_name,
                    "energy_eV": round(edge.energy, 2),
                    "fluorescence_yield": round(edge.fyield, 6),
                })
        if element_edges:
            edges[sym] = element_edges
    return edges

def export_fluorescence():
    """Export fluorescence line energies and intensities per element."""
    fluor = {}
    for z in range(1, 99):
        sym = xraydb.atomic_symbol(z)
        element_lines = []
        for edge_name in ('K', 'L1', 'L2', 'L3', 'M1', 'M2', 'M3', 'M4', 'M5'):
            try:
                lines = xraydb.xray_lines(z, edge_name)
            except (ValueError, KeyError):
                continue
            if lines is None:
                continue
            for line_name, line_data in lines.items():
                if line_data.intensity > 0.001:
                    element_lines.append({
                        "line": line_name,
                        "energy_eV": round(line_data.energy, 2),
                        "intensity": round(line_data.intensity, 6),
                        "initial_level": line_data.initial_level,
                        "final_level": line_data.final_level,
                    })
        if element_lines:
            element_lines.sort(key=lambda x: x["energy_eV"])
            fluor[sym] = element_lines
    return fluor

def export_mu_data():
    """Export mass attenuation coefficient tables per element.

    Uses mu_elam() which returns μ/ρ in cm²/g at given energies.
    We sample on a log-spaced grid plus extra points near edges.
    """
    import numpy as np

    mu_data = {}
    # Base energy grid: 100 eV to 1 MeV, ~300 log-spaced points
    base_energies = np.logspace(2, 6, 300)  # 100 eV to 1,000,000 eV

    for z in range(1, 99):
        sym = xraydb.atomic_symbol(z)

        # Collect edge energies for this element
        edge_energies = []
        for edge_name in xraydb.xray_edges(z):
            edge = xraydb.xray_edge(z, edge_name)
            if edge is not None and edge.energy > 0:
                edge_energies.append(edge.energy)

        # Add points just below and above each edge (±1 eV)
        extra_energies = []
        for e in edge_energies:
            if e > 101:
                extra_energies.append(e - 1.0)
            if e < 999999:
                extra_energies.append(e + 1.0)

        # Merge and sort all energies
        all_energies = np.unique(np.concatenate([base_energies, extra_energies]))
        all_energies = all_energies[(all_energies >= 100) & (all_energies <= 1e6)]
        all_energies.sort()

        # Compute μ/ρ at each energy
        data_points = []
        for energy in all_energies:
            try:
                mu = xraydb.mu_elam(z, energy)
                if mu > 0:
                    data_points.append({
                        "energy_eV": round(float(energy), 2),
                        "mu_over_rho": round(float(mu), 6),
                    })
            except Exception:
                continue

        mu_data[sym] = {
            "symbol": sym,
            "edges": sorted([round(e, 2) for e in edge_energies]),
            "data": data_points,
        }
    return mu_data

def main():
    import os
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)

    print("Exporting elements...")
    elements = export_elements()
    with open(os.path.join(data_dir, 'elements.json'), 'w') as f:
        json.dump(elements, f, separators=(',', ':'))
    print(f"  {len(elements)} elements")

    print("Exporting edges...")
    edges = export_edges()
    with open(os.path.join(data_dir, 'edges.json'), 'w') as f:
        json.dump(edges, f, separators=(',', ':'))
    print(f"  {len(edges)} elements with edges")

    print("Exporting fluorescence lines...")
    fluor = export_fluorescence()
    with open(os.path.join(data_dir, 'fluorescence.json'), 'w') as f:
        json.dump(fluor, f, separators=(',', ':'))
    print(f"  {len(fluor)} elements with lines")

    print("Exporting mu data...")
    mu_data = export_mu_data()
    with open(os.path.join(data_dir, 'mu-data.json'), 'w') as f:
        json.dump(mu_data, f, separators=(',', ':'))
    print(f"  {len(mu_data)} elements with mu data")

    # Print file sizes
    for fname in ['elements.json', 'edges.json', 'fluorescence.json', 'mu-data.json']:
        fpath = os.path.join(data_dir, fname)
        size = os.path.getsize(fpath)
        print(f"  {fname}: {size / 1024:.1f} KB")

    print("Done!")

if __name__ == '__main__':
    main()
```

- [ ] **Step 4: Run the export script**

```bash
python scripts/export-xraydb.py
```

Expected: Creates 4 JSON files in `data/`. Print output shows element counts and file sizes.

- [ ] **Step 5: Copy data to public directory for static serving**

```bash
mkdir -p public/data
cp data/*.json public/data/
```

- [ ] **Step 6: Verify JSON files are valid**

```bash
python -c "import json; [json.load(open(f'data/{f}')) for f in ['elements.json','edges.json','fluorescence.json','mu-data.json']]; print('All valid')"
```

- [ ] **Step 7: Commit**

```bash
git add scripts/ data/ public/data/
git commit -m "feat: add xraydb data export script and generate JSON data files"
```

---

## Task 3: Chemical Formula Parser (TDD)

**Files:**
- Create: `lib/formula-parser.ts`, `__tests__/formula-parser.test.ts`

- [ ] **Step 1: Write failing tests for formula parser**

```ts
// __tests__/formula-parser.test.ts
import { describe, it, expect } from 'vitest'
import { parseFormula } from '@/lib/formula-parser'

describe('parseFormula', () => {
  it('parses single element', () => {
    expect(parseFormula('Fe')).toEqual({ Fe: 1 })
  })

  it('parses element with count', () => {
    expect(parseFormula('O2')).toEqual({ O: 2 })
  })

  it('parses simple compound', () => {
    expect(parseFormula('NaCl')).toEqual({ Na: 1, Cl: 1 })
  })

  it('parses compound with counts', () => {
    expect(parseFormula('Fe2O3')).toEqual({ Fe: 2, O: 3 })
  })

  it('parses parenthesized group', () => {
    expect(parseFormula('Ca(OH)2')).toEqual({ Ca: 1, O: 2, H: 2 })
  })

  it('parses nested parentheses', () => {
    expect(parseFormula('Ca3(PO4)2')).toEqual({ Ca: 3, P: 2, O: 8 })
  })

  it('parses complex formula', () => {
    expect(parseFormula('(NH4)2SO4')).toEqual({ N: 2, H: 8, S: 1, O: 4 })
  })

  it('parses hydrate with middle dot', () => {
    expect(parseFormula('CuSO4·5H2O')).toEqual({ Cu: 1, S: 1, O: 9, H: 10 })
  })

  it('parses LaB6', () => {
    expect(parseFormula('LaB6')).toEqual({ La: 1, B: 6 })
  })

  it('parses CaCO3', () => {
    expect(parseFormula('CaCO3')).toEqual({ Ca: 1, C: 1, O: 3 })
  })

  it('throws on empty string', () => {
    expect(() => parseFormula('')).toThrow()
  })

  it('throws on invalid element symbol', () => {
    expect(() => parseFormula('Xx2O3')).toThrow(/unknown element/i)
  })

  it('throws on unmatched parenthesis', () => {
    expect(() => parseFormula('Ca(OH')).toThrow()
  })

  it('throws on trailing characters', () => {
    expect(() => parseFormula('Fe2O3)')).toThrow()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/formula-parser.test.ts
```

Expected: All tests FAIL (module not found).

- [ ] **Step 3: Implement formula parser**

```ts
// lib/formula-parser.ts
import { VALID_SYMBOLS } from './element-symbols'

export function parseFormula(formula: string): Readonly<Record<string, number>> {
  if (!formula || formula.trim().length === 0) {
    throw new FormulaError('Formula cannot be empty', 0)
  }

  // Split on middle dot (·) for hydrates
  const parts = formula.split('·')
  const result: Record<string, number> = {}

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    // Check for leading coefficient (e.g., "5H2O")
    const coeffMatch = i > 0 ? part.match(/^(\d+)(.+)$/) : null
    const coeff = coeffMatch ? parseInt(coeffMatch[1], 10) : 1
    const expr = coeffMatch ? coeffMatch[2] : part

    const parsed = parseExpression(expr, 0)
    if (parsed.pos !== expr.length) {
      throw new FormulaError(`Unexpected character '${expr[parsed.pos]}'`, parsed.pos)
    }

    for (const [sym, count] of Object.entries(parsed.composition)) {
      result[sym] = (result[sym] ?? 0) + count * coeff
    }
  }

  return result
}

interface ParseResult {
  readonly composition: Record<string, number>
  readonly pos: number
}

function parseExpression(formula: string, pos: number): ParseResult {
  const composition: Record<string, number> = {}

  while (pos < formula.length) {
    const ch = formula[pos]

    if (ch === '(') {
      pos++ // skip '('
      const inner = parseExpression(formula, pos)
      pos = inner.pos
      if (pos >= formula.length || formula[pos] !== ')') {
        throw new FormulaError('Unmatched opening parenthesis', pos)
      }
      pos++ // skip ')'
      const count = parseCount(formula, pos)
      pos = count.pos
      for (const [sym, n] of Object.entries(inner.composition)) {
        composition[sym] = (composition[sym] ?? 0) + n * count.value
      }
    } else if (ch === ')') {
      break // return to parent
    } else if (ch >= 'A' && ch <= 'Z') {
      const elem = parseElement(formula, pos)
      pos = elem.pos
      const count = parseCount(formula, pos)
      pos = count.pos
      composition[elem.symbol] = (composition[elem.symbol] ?? 0) + count.value
    } else {
      throw new FormulaError(`Unexpected character '${ch}'`, pos)
    }
  }

  return { composition, pos }
}

function parseElement(formula: string, pos: number): { symbol: string; pos: number } {
  if (pos >= formula.length || formula[pos] < 'A' || formula[pos] > 'Z') {
    throw new FormulaError('Expected element symbol', pos)
  }

  // Try two-letter symbol first
  if (pos + 1 < formula.length && formula[pos + 1] >= 'a' && formula[pos + 1] <= 'z') {
    const twoLetter = formula.slice(pos, pos + 2)
    if (VALID_SYMBOLS.has(twoLetter)) {
      return { symbol: twoLetter, pos: pos + 2 }
    }
  }

  // Single letter
  const oneLetter = formula[pos]
  if (VALID_SYMBOLS.has(oneLetter)) {
    return { symbol: oneLetter, pos: pos + 1 }
  }

  throw new FormulaError(`Unknown element '${formula.slice(pos, pos + 2)}'`, pos)
}

function parseCount(formula: string, pos: number): { value: number; pos: number } {
  let numStr = ''
  while (pos < formula.length && formula[pos] >= '0' && formula[pos] <= '9') {
    numStr += formula[pos]
    pos++
  }
  return { value: numStr.length > 0 ? parseInt(numStr, 10) : 1, pos }
}

export class FormulaError extends Error {
  constructor(message: string, public readonly position: number) {
    super(message)
    this.name = 'FormulaError'
  }
}
```

- [ ] **Step 4: Create lib/element-symbols.ts**

```ts
// lib/element-symbols.ts
export const VALID_SYMBOLS: ReadonlySet<string> = new Set([
  'H','He','Li','Be','B','C','N','O','F','Ne',
  'Na','Mg','Al','Si','P','S','Cl','Ar',
  'K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn',
  'Ga','Ge','As','Se','Br','Kr',
  'Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd',
  'In','Sn','Sb','Te','I','Xe',
  'Cs','Ba','La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy',
  'Ho','Er','Tm','Yb','Lu',
  'Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg',
  'Tl','Pb','Bi','Po','At','Rn',
  'Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf',
])
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run __tests__/formula-parser.test.ts
```

Expected: All 14 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/formula-parser.ts lib/element-symbols.ts __tests__/formula-parser.test.ts
git commit -m "feat: add chemical formula parser with hydrate support"
```

---

## Task 4: Data Loader

**Files:**
- Create: `lib/data-loader.ts`, `__tests__/data-loader.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// __tests__/data-loader.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadElements, loadEdges, loadMuData, loadFluorescence } from '@/lib/data-loader'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
})

describe('loadElements', () => {
  it('fetches and returns elements', async () => {
    const mockData = [{ Z: 1, symbol: 'H', name: 'Hydrogen', atomic_mass: 1.008 }]
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })

    const result = await loadElements()
    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith('/data/elements.json')
  })

  it('caches after first load', async () => {
    const mockData = [{ Z: 1, symbol: 'H', name: 'Hydrogen', atomic_mass: 1.008 }]
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })

    await loadElements()
    await loadElements()
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

describe('loadMuData', () => {
  it('fetches mu data', async () => {
    const mockData = { H: { symbol: 'H', edges: [], data: [] } }
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })

    const result = await loadMuData()
    expect(result).toEqual(mockData)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/data-loader.test.ts
```

- [ ] **Step 3: Implement data loader**

```ts
// lib/data-loader.ts
import type { ElementData, AbsorptionEdge, FluorescenceLine, ElementMuData } from './types'

let elementsCache: readonly ElementData[] | null = null
let edgesCache: Readonly<Record<string, readonly AbsorptionEdge[]>> | null = null
let fluorescenceCache: Readonly<Record<string, readonly FluorescenceLine[]>> | null = null
let muDataCache: Readonly<Record<string, ElementMuData>> | null = null

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`)
  }
  return response.json()
}

export async function loadElements(): Promise<readonly ElementData[]> {
  if (elementsCache === null) {
    elementsCache = await fetchJson<ElementData[]>('/data/elements.json')
  }
  return elementsCache
}

export async function loadEdges(): Promise<Readonly<Record<string, readonly AbsorptionEdge[]>>> {
  if (edgesCache === null) {
    edgesCache = await fetchJson('/data/edges.json')
  }
  return edgesCache
}

export async function loadFluorescence(): Promise<Readonly<Record<string, readonly FluorescenceLine[]>>> {
  if (fluorescenceCache === null) {
    fluorescenceCache = await fetchJson('/data/fluorescence.json')
  }
  return fluorescenceCache
}

export async function loadMuData(): Promise<Readonly<Record<string, ElementMuData>>> {
  if (muDataCache === null) {
    muDataCache = await fetchJson('/data/mu-data.json')
  }
  return muDataCache
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run __tests__/data-loader.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/data-loader.ts __tests__/data-loader.test.ts
git commit -m "feat: add lazy-loading data loader with caching"
```

---

## Task 5: Absorption Calculator Core (TDD)

**Files:**
- Create: `lib/calculator.ts`, `__tests__/calculator.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// __tests__/calculator.test.ts
import { describe, it, expect } from 'vitest'
import {
  calcWeightFractions,
  interpolateMu,
  calcCompoundMu,
  calcAbsorption,
} from '@/lib/calculator'
import type { ElementMuData } from '@/lib/types'

describe('calcWeightFractions', () => {
  it('calculates weight fractions for CaCO3', () => {
    // Ca=40.078, C=12.011, O=15.999
    // Total = 40.078 + 12.011 + 3*15.999 = 100.086
    const composition = { Ca: 1, C: 1, O: 3 }
    const masses: Record<string, number> = { Ca: 40.078, C: 12.011, O: 15.999 }
    const fractions = calcWeightFractions(composition, masses)

    expect(fractions.Ca).toBeCloseTo(0.4004, 3)
    expect(fractions.C).toBeCloseTo(0.12, 2)
    expect(fractions.O).toBeCloseTo(0.4796, 3)
    expect(fractions.Ca + fractions.C + fractions.O).toBeCloseTo(1.0, 10)
  })
})

describe('interpolateMu', () => {
  // Simple test data: power law μ/ρ ~ E^(-3) in log-log space
  const testData = [
    { energy_eV: 1000, mu_over_rho: 1000 },
    { energy_eV: 2000, mu_over_rho: 125 },
    { energy_eV: 4000, mu_over_rho: 15.625 },
    { energy_eV: 8000, mu_over_rho: 1.953125 },
  ]

  it('interpolates between tabulated points', () => {
    const result = interpolateMu(testData, [], 3000)
    // Log-log interpolation between (2000, 125) and (4000, 15.625)
    // ln(μ) = ln(125) + (ln(3000)-ln(2000))/(ln(4000)-ln(2000)) * (ln(15.625)-ln(125))
    expect(result).toBeGreaterThan(15)
    expect(result).toBeLessThan(125)
  })

  it('returns exact value at tabulated point', () => {
    const result = interpolateMu(testData, [], 2000)
    expect(result).toBeCloseTo(125, 3)
  })

  it('throws for energy outside range', () => {
    expect(() => interpolateMu(testData, [], 500)).toThrow(/outside.*range/i)
    expect(() => interpolateMu(testData, [], 10000)).toThrow(/outside.*range/i)
  })

  it('does not interpolate across absorption edge', () => {
    // Edge at 3000 eV — points at 2000 and 4000 straddle it
    // Should use the two points on the same side of the edge
    const dataWithEdge = [
      { energy_eV: 1000, mu_over_rho: 1000 },
      { energy_eV: 2000, mu_over_rho: 125 },
      { energy_eV: 2999, mu_over_rho: 20 },
      { energy_eV: 3001, mu_over_rho: 200 },
      { energy_eV: 4000, mu_over_rho: 100 },
      { energy_eV: 8000, mu_over_rho: 10 },
    ]
    // Query at 3500 eV — should interpolate between 3001 and 4000, not across edge
    const result = interpolateMu(dataWithEdge, [3000], 3500)
    expect(result).toBeGreaterThan(100)
    expect(result).toBeLessThan(200)
  })
})

describe('calcCompoundMu', () => {
  it('calculates compound μ/ρ as weighted sum', () => {
    const fractions = { A: 0.6, B: 0.4 }
    const muData: Record<string, ElementMuData> = {
      A: {
        symbol: 'A',
        edges: [],
        data: [
          { energy_eV: 1000, mu_over_rho: 100 },
          { energy_eV: 2000, mu_over_rho: 50 },
        ],
      },
      B: {
        symbol: 'B',
        edges: [],
        data: [
          { energy_eV: 1000, mu_over_rho: 200 },
          { energy_eV: 2000, mu_over_rho: 80 },
        ],
      },
    }
    // At 1000 eV: 0.6*100 + 0.4*200 = 140
    const result = calcCompoundMu(fractions, muData, 1000)
    expect(result).toBeCloseTo(140, 3)
  })
})

describe('calcAbsorption', () => {
  it('calculates transmission correctly', () => {
    // If μ = 5 cm⁻¹ and t = 2 mm = 0.2 cm
    // T = exp(-5 * 0.2) = exp(-1) ≈ 0.3679
    const result = calcAbsorption(5.0, 2.0)
    expect(result.transmission).toBeCloseTo(0.3679, 3)
  })

  it('calculates optimal thickness', () => {
    // μt = 1 → t = 1/μ = 1/5 cm = 2 mm
    const result = calcAbsorption(5.0)
    expect(result.optimal_thickness_mm).toBeCloseTo(2.0, 3)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/calculator.test.ts
```

- [ ] **Step 3: Implement calculator**

```ts
// lib/calculator.ts
import type { MuDataPoint, ElementMuData } from './types'

export function calcWeightFractions(
  composition: Readonly<Record<string, number>>,
  atomicMasses: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  let totalMass = 0
  for (const [symbol, count] of Object.entries(composition)) {
    totalMass += count * atomicMasses[symbol]
  }

  const fractions: Record<string, number> = {}
  for (const [symbol, count] of Object.entries(composition)) {
    fractions[symbol] = (count * atomicMasses[symbol]) / totalMass
  }
  return fractions
}

export function interpolateMu(
  data: readonly MuDataPoint[],
  edgeEnergies: readonly number[],
  energy_eV: number,
): number {
  if (data.length === 0) {
    throw new Error('No mu data available')
  }

  const minE = data[0].energy_eV
  const maxE = data[data.length - 1].energy_eV

  if (energy_eV < minE || energy_eV > maxE) {
    throw new Error(
      `Energy ${energy_eV} eV is outside tabulated range [${minE}, ${maxE}] eV`
    )
  }

  // Find bracketing points that don't straddle an absorption edge
  let low = 0
  let high = data.length - 1

  // Binary search for the interval containing energy_eV
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2)
    if (data[mid].energy_eV <= energy_eV) {
      low = mid
    } else {
      high = mid
    }
  }

  // Check if we're straddling an edge
  const lowE = data[low].energy_eV
  const highE = data[high].energy_eV
  const crossesEdge = edgeEnergies.some((e) => e > lowE && e < highE)

  if (crossesEdge) {
    // Find a bracketing pair that does not straddle any edge
    let found = false
    for (let i = 0; i < data.length - 1; i++) {
      if (data[i].energy_eV <= energy_eV && data[i + 1].energy_eV >= energy_eV) {
        const e1 = data[i].energy_eV
        const e2 = data[i + 1].energy_eV
        if (!edgeEnergies.some((e) => e > e1 && e < e2)) {
          low = i
          high = i + 1
          found = true
          break
        }
      }
    }
    if (!found) {
      throw new Error(
        `Cannot interpolate at ${energy_eV} eV: no valid bracket found (straddles absorption edge)`
      )
    }
  }

  // Exact match
  if (data[low].energy_eV === energy_eV) return data[low].mu_over_rho
  if (data[high].energy_eV === energy_eV) return data[high].mu_over_rho

  // Log-log interpolation
  const logE = Math.log(energy_eV)
  const logE1 = Math.log(data[low].energy_eV)
  const logE2 = Math.log(data[high].energy_eV)
  const logMu1 = Math.log(data[low].mu_over_rho)
  const logMu2 = Math.log(data[high].mu_over_rho)

  const t = (logE - logE1) / (logE2 - logE1)
  const logMu = logMu1 + t * (logMu2 - logMu1)

  return Math.exp(logMu)
}

export function calcCompoundMu(
  weightFractions: Readonly<Record<string, number>>,
  muData: Readonly<Record<string, ElementMuData>>,
  energy_eV: number,
): number {
  let mu_over_rho = 0
  for (const [symbol, weight] of Object.entries(weightFractions)) {
    const elMu = muData[symbol]
    if (!elMu) throw new Error(`No data for element ${symbol}`)
    mu_over_rho += weight * interpolateMu(elMu.data, elMu.edges, energy_eV)
  }
  return mu_over_rho
}

export function calcAbsorption(
  mu_cm: number,
  thickness_mm?: number,
): { optimal_thickness_mm: number; transmission?: number } {
  const optimal_thickness_mm = (1 / mu_cm) * 10 // cm to mm

  if (thickness_mm !== undefined) {
    const thickness_cm = thickness_mm / 10
    const transmission = Math.exp(-mu_cm * thickness_cm)
    return { optimal_thickness_mm, transmission }
  }

  return { optimal_thickness_mm }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run __tests__/calculator.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/calculator.ts __tests__/calculator.test.ts
git commit -m "feat: add absorption calculator with log-log interpolation and edge handling"
```

---

## Task 6: Periodic Table Component

**Files:**
- Create: `components/PeriodicTable/index.tsx`, `components/PeriodicTable/element-data.ts`

- [ ] **Step 1: Create element layout data**

```ts
// components/PeriodicTable/element-data.ts

export interface PeriodicElement {
  readonly Z: number
  readonly symbol: string
  readonly name: string
  readonly row: number
  readonly col: number
  readonly category: string
}

// Standard periodic table layout: row (1-9), col (1-18)
// Rows 8-9 are lanthanides and actinides
export const PERIODIC_LAYOUT: readonly PeriodicElement[] = [
  // Row 1
  { Z: 1, symbol: 'H', name: 'Hydrogen', row: 1, col: 1, category: 'nonmetal' },
  { Z: 2, symbol: 'He', name: 'Helium', row: 1, col: 18, category: 'noble-gas' },
  // Row 2
  { Z: 3, symbol: 'Li', name: 'Lithium', row: 2, col: 1, category: 'alkali-metal' },
  { Z: 4, symbol: 'Be', name: 'Beryllium', row: 2, col: 2, category: 'alkaline-earth' },
  { Z: 5, symbol: 'B', name: 'Boron', row: 2, col: 13, category: 'metalloid' },
  { Z: 6, symbol: 'C', name: 'Carbon', row: 2, col: 14, category: 'nonmetal' },
  { Z: 7, symbol: 'N', name: 'Nitrogen', row: 2, col: 15, category: 'nonmetal' },
  { Z: 8, symbol: 'O', name: 'Oxygen', row: 2, col: 16, category: 'nonmetal' },
  { Z: 9, symbol: 'F', name: 'Fluorine', row: 2, col: 17, category: 'halogen' },
  { Z: 10, symbol: 'Ne', name: 'Neon', row: 2, col: 18, category: 'noble-gas' },
  // ... (remaining 88 elements follow the same pattern)
  // Full data will be included in implementation
]

export const CATEGORY_COLORS: Readonly<Record<string, string>> = {
  'alkali-metal': 'bg-red-900/60',
  'alkaline-earth': 'bg-orange-900/60',
  'transition-metal': 'bg-yellow-900/40',
  'post-transition': 'bg-green-900/40',
  'metalloid': 'bg-teal-900/40',
  'nonmetal': 'bg-blue-900/40',
  'halogen': 'bg-cyan-900/40',
  'noble-gas': 'bg-purple-900/40',
  'lanthanide': 'bg-pink-900/40',
  'actinide': 'bg-rose-900/40',
}
```

Note: The full `PERIODIC_LAYOUT` array with all 98 elements (H to Cf, matching xraydb range) will be populated during implementation. The pattern above shows the structure.

- [ ] **Step 2: Create PeriodicTable component**

```tsx
// components/PeriodicTable/index.tsx
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
```

- [ ] **Step 3: Verify it renders in dev server**

Temporarily import in `app/page.tsx` to check visual appearance. Ensure the grid layout is correct.

- [ ] **Step 4: Commit**

```bash
git add components/PeriodicTable/
git commit -m "feat: add interactive periodic table component"
```

---

## Task 7: UI Components (ResultCard, EnergyChart)

**Files:**
- Create: `components/ui/ResultCard.tsx`, `components/ui/EnergyChart.tsx`

- [ ] **Step 1: Create ResultCard**

```tsx
// components/ui/ResultCard.tsx
interface ResultCardProps {
  readonly label: string
  readonly value: string
  readonly unit: string
}

export function ResultCard({ label, value, unit }: ResultCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold font-mono mt-1">
        {value}
        <span className="text-sm text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create EnergyChart**

```tsx
// components/ui/EnergyChart.tsx
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
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
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
            formatter={(value: number) => [value.toFixed(4), 'μ/ρ']}
            labelFormatter={(label: number) => `${label.toFixed(1)} eV`}
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
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/
git commit -m "feat: add ResultCard and EnergyChart UI components"
```

---

## Task 8: Absorption Tab (Main Feature)

**Files:**
- Create: `components/tabs/AbsorptionTab.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create AbsorptionTab**

```tsx
// components/tabs/AbsorptionTab.tsx
'use client'

import { useState, useCallback } from 'react'
import { parseFormula, FormulaError } from '@/lib/formula-parser'
import { calcWeightFractions, calcCompoundMu, calcAbsorption } from '@/lib/calculator'
import { loadElements, loadMuData } from '@/lib/data-loader'
import { HC_KEV_ANGSTROM, ENERGY_MIN_KEV, ENERGY_MAX_KEV } from '@/lib/constants'
import { ResultCard } from '@/components/ui/ResultCard'
import { EnergyChart } from '@/components/ui/EnergyChart'
import type { CalculationResult, ElementMuData } from '@/lib/types'

type EnergyUnit = 'keV' | 'Å'

interface FormState {
  readonly formula: string
  readonly energyValue: string
  readonly energyUnit: EnergyUnit
  readonly density: string
  readonly thickness: string
}

const INITIAL_FORM: FormState = {
  formula: 'CaCO3',
  energyValue: '30',
  energyUnit: 'keV',
  density: '2.71',
  thickness: '0.8',
}

export function AbsorptionTab() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [chartData, setChartData] = useState<{ energy_eV: number; mu_over_rho: number }[]>([])
  const [chartEdges, setChartEdges] = useState<{ energy_eV: number; label: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const updateField = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const calculate = useCallback(async () => {
    setError(null)
    setLoading(true)

    try {
      // Parse formula
      const composition = parseFormula(form.formula)

      // Convert energy to keV
      let energy_keV: number
      if (form.energyUnit === 'Å') {
        const wavelength = parseFloat(form.energyValue)
        if (isNaN(wavelength) || wavelength <= 0) throw new Error('Wavelength must be positive')
        energy_keV = HC_KEV_ANGSTROM / wavelength
      } else {
        energy_keV = parseFloat(form.energyValue)
      }

      if (isNaN(energy_keV) || energy_keV < ENERGY_MIN_KEV || energy_keV > ENERGY_MAX_KEV) {
        throw new Error(`Energy must be between ${ENERGY_MIN_KEV} and ${ENERGY_MAX_KEV} keV`)
      }

      const density = parseFloat(form.density)
      if (isNaN(density) || density <= 0) throw new Error('Density must be positive')

      const thickness = form.thickness ? parseFloat(form.thickness) : undefined
      if (thickness !== undefined && (isNaN(thickness) || thickness < 0)) {
        throw new Error('Thickness must be non-negative')
      }

      // Load data
      const [elements, muData] = await Promise.all([loadElements(), loadMuData()])

      // Build atomic mass lookup
      const masses: Record<string, number> = {}
      for (const el of elements) {
        masses[el.symbol] = el.atomic_mass
      }

      // Calculate weight fractions
      const fractions = calcWeightFractions(composition, masses)

      // Calculate compound μ/ρ
      const energy_eV = energy_keV * 1000
      const mu_over_rho = calcCompoundMu(fractions, muData, energy_eV)

      // Calculate μ and absorption
      const mu = mu_over_rho * density
      const absorption = calcAbsorption(mu, thickness)

      setResult({
        mu_over_rho,
        mu,
        ...absorption,
        weight_fractions: fractions,
      })

      // Generate chart data: compound μ/ρ vs energy
      generateChartData(composition, fractions, muData, energy_eV)
    } catch (e) {
      setError(e instanceof FormulaError ? `Formula error at position ${e.position}: ${e.message}` : (e as Error).message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [form])

  const generateChartData = (
    composition: Readonly<Record<string, number>>,
    fractions: Readonly<Record<string, number>>,
    muData: Readonly<Record<string, ElementMuData>>,
    currentEnergy_eV: number,
  ) => {
    // Use first element's energy grid as reference
    const symbols = Object.keys(fractions)
    const refData = muData[symbols[0]]
    if (!refData) return

    const points: { energy_eV: number; mu_over_rho: number }[] = []
    const allEdges: { energy_eV: number; label: string }[] = []

    // Collect edges for all elements
    for (const symbol of symbols) {
      const elMu = muData[symbol]
      if (!elMu) continue
      for (const edgeE of elMu.edges) {
        allEdges.push({ energy_eV: edgeE, label: `${symbol}` })
      }
    }

    // Sample compound μ/ρ at each energy in the reference data.
    // Note: this uses element 0's energy grid, which may not have points
    // near other elements' edges. Chart values near those edges are approximate.
    // The point-calculation (single energy) is exact; only the chart is affected.
    for (const point of refData.data) {
      try {
        let compoundMu = 0
        for (const [symbol, weight] of Object.entries(fractions)) {
          const elMu = muData[symbol]
          if (!elMu) continue
          compoundMu += weight * interpolateMu(elMu.data, elMu.edges, point.energy_eV)
        }
        points.push({ energy_eV: point.energy_eV, mu_over_rho: compoundMu })
      } catch {
        // Skip points that fail interpolation
      }
    }

    setChartData(points)
    setChartEdges(allEdges)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Input panel */}
      <div className="lg:w-80 shrink-0">
        <div className="bg-gray-900 rounded-lg p-4 space-y-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Inputs</p>

          <div>
            <label className="text-sm text-gray-400">Chemical Formula</label>
            <input
              type="text"
              value={form.formula}
              onChange={(e) => updateField('formula', e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-gray-800 rounded border border-gray-700 text-white font-mono focus:border-blue-500 focus:outline-none"
              placeholder="e.g. CaCO3"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Energy</label>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                value={form.energyValue}
                onChange={(e) => updateField('energyValue', e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 rounded border border-gray-700 text-white font-mono focus:border-blue-500 focus:outline-none"
                step="0.1"
              />
              <select
                value={form.energyUnit}
                onChange={(e) => updateField('energyUnit', e.target.value)}
                className="px-3 py-2 bg-gray-800 rounded border border-gray-700 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="keV">keV</option>
                <option value="Å">Å</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400">Density (g/cm³)</label>
            <input
              type="number"
              value={form.density}
              onChange={(e) => updateField('density', e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-gray-800 rounded border border-gray-700 text-white font-mono focus:border-blue-500 focus:outline-none"
              step="0.01"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Thickness (mm) — optional</label>
            <input
              type="number"
              value={form.thickness}
              onChange={(e) => updateField('thickness', e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-gray-800 rounded border border-gray-700 text-white font-mono focus:border-blue-500 focus:outline-none"
              step="0.1"
            />
          </div>

          <button
            onClick={calculate}
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded text-white font-medium transition-colors"
          >
            {loading ? 'Calculating...' : 'Calculate'}
          </button>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>
      </div>

      {/* Results panel */}
      <div className="flex-1 space-y-4">
        {result && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <ResultCard
                label="μ/ρ"
                value={result.mu_over_rho.toFixed(4)}
                unit="cm²/g"
              />
              <ResultCard
                label="μ"
                value={result.mu.toFixed(4)}
                unit="cm⁻¹"
              />
              <ResultCard
                label="Optimal Thickness (μt=1)"
                value={result.optimal_thickness_mm.toFixed(3)}
                unit="mm"
              />
              {result.transmission !== undefined && (
                <ResultCard
                  label="Transmission"
                  value={(result.transmission * 100).toFixed(2)}
                  unit="%"
                />
              )}
            </div>

            {chartData.length > 0 && (
              <EnergyChart
                data={chartData}
                edges={chartEdges}
                currentEnergy_eV={
                form.energyUnit === 'keV'
                  ? parseFloat(form.energyValue) * 1000
                  : (HC_KEV_ANGSTROM / parseFloat(form.energyValue)) * 1000
              }
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire AbsorptionTab into page.tsx**

Update `app/page.tsx` to import and render `AbsorptionTab` when the Absorption tab is active:

```tsx
import { AbsorptionTab } from '@/components/tabs/AbsorptionTab'

// In the tab content area:
{activeTab === 'Absorption' && <AbsorptionTab />}
```

- [ ] **Step 3: Test in browser**

```bash
npm run dev
```

Open http://localhost:3000. Enter `CaCO3`, 30 keV, density 2.71, thickness 0.8 mm. Click Calculate. Verify results appear and chart renders.

- [ ] **Step 4: Commit**

```bash
git add components/tabs/AbsorptionTab.tsx app/page.tsx
git commit -m "feat: add absorption calculator tab with full calculation pipeline"
```

---

## Task 9: Edge Lookup Tab

**Files:**
- Create: `components/tabs/EdgeLookupTab.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create EdgeLookupTab**

```tsx
// components/tabs/EdgeLookupTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { PeriodicTable } from '@/components/PeriodicTable'
import { loadEdges } from '@/lib/data-loader'
import type { AbsorptionEdge } from '@/lib/types'

export function EdgeLookupTab() {
  const [selectedElement, setSelectedElement] = useState<string | undefined>()
  const [edges, setEdges] = useState<readonly AbsorptionEdge[]>([])
  const [allEdges, setAllEdges] = useState<Readonly<Record<string, readonly AbsorptionEdge[]>>>({})
  const [loading, setLoading] = useState(false)

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
      <PeriodicTable
        onSelectElement={setSelectedElement}
        selectedElement={selectedElement}
      />

      {selectedElement && edges.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-3">
            {selectedElement} — Absorption Edges
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2">Edge</th>
                <th className="text-right py-2">Energy (eV)</th>
                <th className="text-right py-2">Energy (keV)</th>
                <th className="text-right py-2">Fluorescence Yield</th>
              </tr>
            </thead>
            <tbody>
              {edges.map((edge) => (
                <tr key={edge.edge} className="border-b border-gray-800/50">
                  <td className="py-2 font-mono">{edge.edge}</td>
                  <td className="text-right font-mono">{edge.energy_eV.toFixed(2)}</td>
                  <td className="text-right font-mono">{(edge.energy_eV / 1000).toFixed(4)}</td>
                  <td className="text-right font-mono">
                    {edge.fluorescence_yield?.toFixed(4) ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire into page.tsx**

```tsx
import { EdgeLookupTab } from '@/components/tabs/EdgeLookupTab'

{activeTab === 'Edge Lookup' && <EdgeLookupTab />}
```

- [ ] **Step 3: Test in browser**

Click "Edge Lookup" tab. Click Fe on periodic table. Verify K, L edges appear with correct energies.

- [ ] **Step 4: Commit**

```bash
git add components/tabs/EdgeLookupTab.tsx app/page.tsx
git commit -m "feat: add edge lookup tab with periodic table selector"
```

---

## Task 10: Fluorescence Tab

**Files:**
- Create: `components/tabs/FluorescenceTab.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create FluorescenceTab**

```tsx
// components/tabs/FluorescenceTab.tsx
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
      <PeriodicTable
        onSelectElement={setSelectedElement}
        selectedElement={selectedElement}
      />

      {selectedElement && lines.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-3">
            {selectedElement} — Fluorescence Lines
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2">Line</th>
                <th className="text-right py-2">Energy (eV)</th>
                <th className="text-right py-2">Energy (keV)</th>
                <th className="text-right py-2">Relative Intensity</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.line} className="border-b border-gray-800/50">
                  <td className="py-2 font-mono">{line.line}</td>
                  <td className="text-right font-mono">{line.energy_eV.toFixed(2)}</td>
                  <td className="text-right font-mono">{(line.energy_eV / 1000).toFixed(4)}</td>
                  <td className="text-right font-mono">{line.intensity.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire into page.tsx**

```tsx
import { FluorescenceTab } from '@/components/tabs/FluorescenceTab'

{activeTab === 'Fluorescence' && <FluorescenceTab />}
```

- [ ] **Step 3: Test in browser**

Click "Fluorescence" tab. Click Cu. Verify Kα1, Kα2, Kβ1 lines appear.

- [ ] **Step 4: Commit**

```bash
git add components/tabs/FluorescenceTab.tsx app/page.tsx
git commit -m "feat: add fluorescence lines tab"
```

---

## Task 11: Periodic Table Tab (Standalone)

**Files:**
- Create: `components/tabs/PeriodicTableTab.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create PeriodicTableTab with element popup**

```tsx
// components/tabs/PeriodicTableTab.tsx
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
      <PeriodicTable
        onSelectElement={setSelectedElement}
        selectedElement={selectedElement}
      />

      {elementInfo && (
        <div className="bg-gray-900 rounded-lg p-6 max-w-md">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-4xl font-bold">{elementInfo.symbol}</span>
            <span className="text-gray-400">{elementInfo.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Atomic Number</span>
              <p className="font-mono">{elementInfo.Z}</p>
            </div>
            <div>
              <span className="text-gray-500">Atomic Mass</span>
              <p className="font-mono">{elementInfo.atomic_mass.toFixed(4)} u</p>
            </div>
          </div>
          {elementEdges.length > 0 && (
            <div className="mt-4">
              <span className="text-gray-500 text-sm">Key Edges</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {elementEdges.slice(0, 5).map((edge) => (
                  <span key={edge.edge} className="px-2 py-1 bg-gray-800 rounded text-xs font-mono">
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
```

- [ ] **Step 2: Wire into page.tsx**

```tsx
import { PeriodicTableTab } from '@/components/tabs/PeriodicTableTab'

{activeTab === 'Periodic Table' && <PeriodicTableTab />}
```

- [ ] **Step 3: Test in browser and commit**

```bash
git add components/tabs/PeriodicTableTab.tsx app/page.tsx
git commit -m "feat: add periodic table tab with element info popup"
```

---

## Task 12: Build Verification & Static Export

**Files:**
- Modify: `next.config.js` (if needed), `package.json`

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: `next build` completes with `output: 'export'`, produces `out/` directory.

- [ ] **Step 2: Verify static files exist**

```bash
ls out/
ls out/data/
```

Expected: `index.html` exists and JSON data files in `out/data/` exist with non-zero size:

```bash
test -s out/data/elements.json && test -s out/data/mu-data.json && echo "OK" || echo "FAIL: data files missing"
```

- [ ] **Step 3: Test static export locally**

```bash
npx serve out
```

Open the served URL. Test all 4 tabs work correctly.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass with 80%+ coverage on `lib/`.

- [ ] **Step 5: Commit any build fixes**

```bash
git add -A
git commit -m "fix: resolve build issues for static export"
```

---

## Task 13: Final Validation

- [ ] **Step 1: Cross-check calculation against xraydb**

Run Python to get reference values:

```bash
python -c "
import xraydb
# CaCO3 at 30 keV
mu = xraydb.material_mu('CaCO3', 30000, density=2.71)
print(f'mu (linear): {mu:.4f} cm^-1')
print(f'Optimal thickness: {10/mu:.4f} mm')
print(f'Transmission at 0.8mm: {__import__(\"math\").exp(-mu*0.08)*100:.2f}%')
"
```

Compare these values with the web app output.

- [ ] **Step 2: Test edge cases**

Test in browser:
- Single element: `Fe` at 7.1 keV (near K-edge)
- Heavy element: `PbO2` at 15 keV
- Hydrate: `CuSO4·5H2O` at 8 keV
- Invalid formula: `Xx2O3` (should show error)
- Energy out of range: 0.01 keV (should show error)

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: validation complete — ready for deployment"
```

---

## Task Summary

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1 | Project scaffolding | None |
| 2 | Data export script | None |
| 3 | Formula parser (TDD) | Task 1 |
| 4 | Data loader | Task 1 |
| 5 | Calculator core (TDD) | Task 1 |
| 6 | Periodic table component | Task 1 |
| 7 | UI components | Task 1 |
| 8 | Absorption tab | Tasks 3, 4, 5, 7 |
| 9 | Edge lookup tab | Tasks 4, 6 |
| 10 | Fluorescence tab | Tasks 4, 6 |
| 11 | Periodic table tab | Tasks 4, 6 |
| 12 | Build verification | Tasks 8-11 |
| 13 | Final validation | Task 12 |

**Parallel opportunities:** Tasks 2-7 can be parallelized (3/4/5 are independent lib modules; 6/7 are independent UI components; 2 is a standalone Python script).
