# X-Ray Absorption Calculator — Design Spec

## Overview

A public-facing web application for synchrotron beamline users to calculate X-ray absorption properties of materials. Inspired by the [11-BM Absorb Calculator](https://11bm.xray.aps.anl.gov/absorb/), built as a pure frontend application with zero backend cost.

## Target Users

Synchrotron radiation beamline users preparing powder diffraction or spectroscopy experiments. They need to determine optimal sample thickness, estimate transmission, and look up element-specific X-ray properties.

## Architecture

**Approach:** Pure frontend — all X-ray data bundled as static JSON, all calculations performed in the browser.

**Why:** X-ray absorption calculations are fundamentally lookup + arithmetic (weighted averages, logarithmic interpolation, exponential decay). No backend is needed. This gives us free deployment, instant response, zero maintenance, and offline capability.

**Tech Stack:**
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Recharts (charts)
- Vercel (deployment)

## Features

### 1. Absorption Calculator (Primary)

**Inputs:**
- Chemical formula (e.g., `CaCO3`, `Ca(OH)2`, `(NH4)2SO4`, `CuSO4·5H2O`)
- X-ray energy (keV) or wavelength (Å) — with bidirectional conversion
- Sample density (g/cm³)
- Sample thickness (mm) — optional

**Outputs:**
- Mass attenuation coefficient μ/ρ (cm²/g)
- Linear absorption coefficient μ (cm⁻¹)
- Optimal sample thickness for μt ≈ 1 (mm)
- Transmission percentage at given thickness
- μ vs Energy chart (log-log scale, marking current energy and nearby edges)

**Calculation method:**
1. Parse chemical formula → element composition map (e.g., `{Ca: 1, C: 1, O: 3}`)
2. Calculate weight fractions for each element
3. Look up μ/ρ for each element at the given energy (log-log interpolation from tabulated data)
4. Weighted sum: μ/ρ_compound = Σ(w_i × μ/ρ_i)
5. μ = (μ/ρ) × density
6. Transmission = exp(-μ × t)
7. Optimal thickness = 1/μ

### 2. Absorption Edge Lookup

**Inputs:** Element selection (periodic table click or text input)

**Outputs:** Table of absorption edges (K, L1, L2, L3, M1–M5) with energies in eV/keV.

### 3. Fluorescence Lines

**Inputs:** Element selection + edge (K, L, M)

**Outputs:** Table of emission lines (Kα1, Kα2, Kβ1, Lα1, etc.) with energies and relative intensities.

### 4. Interactive Periodic Table

A clickable periodic table that serves as the element selector for Edge Lookup and Fluorescence tabs. Color-coded by element category. Clicking an element shows a summary popup with key X-ray properties.

## UI Design

**Layout:** Single-page application with top tab navigation.

**Tabs:** Absorption | Edge Lookup | Fluorescence | Periodic Table

**Absorption tab layout:**
- Left panel: Input form (chemical formula, energy, density, thickness)
- Right panel: Results cards (μ/ρ, μ, optimal thickness, transmission) + μ vs Energy chart below

**Responsive:** Mobile-friendly — stacks to single column on small screens.

**Theme:** Dark theme (common for scientific tools), clean typography, monospace for numerical values.

## Data

**Source:** Elam, Ravel, and Sieber database, exported from the `xraydb` Python package's SQLite database.

**Export process:**
1. Python script (`scripts/export-xraydb.py`) reads xraydb SQLite
2. Exports four JSON files:
   - `elements.json` — atomic number, symbol, name, atomic mass
   - `edges.json` — absorption edge energies per element
   - `fluorescence.json` — emission line energies and intensities per element
   - `mu-data.json` — mass attenuation coefficient tables (energy, μ/ρ pairs) per element

**Estimated size:** ~200-300KB raw, ~50KB gzipped.

**Data integrity:** JSON files are generated once from xraydb and committed to the repo. The export script can be re-run if xraydb updates.

## Chemical Formula Parser

Recursive descent parser supporting:
- Simple formulas: `NaCl`, `Fe2O3`, `LaB6`
- Parenthesized groups: `Ca(OH)2`, `(NH4)2SO4`
- Nested groups: `Ca3(PO4)2`
- Hydrates: `CuSO4·5H2O` or `CuSO4.5H2O` (middle dot or period as separator)
- Decimal coefficients for solid solutions (stretch goal)

**Error handling:** Clear error messages for malformed formulas — highlight the position of the parse error.

## Project Structure

```
xray-absorb-calc/
├── app/
│   ├── layout.tsx              # Top nav + global layout
│   ├── page.tsx                # Main page (tab container)
│   └── globals.css
├── components/
│   ├── tabs/
│   │   ├── AbsorptionTab.tsx   # Absorption calculator
│   │   ├── EdgeLookupTab.tsx   # Edge lookup
│   │   ├── FluorescenceTab.tsx # Fluorescence lines
│   │   └── PeriodicTableTab.tsx
│   ├── ui/
│   │   ├── ResultCard.tsx      # Numerical result display card
│   │   └── EnergyChart.tsx     # μ vs Energy chart (Recharts)
│   └── PeriodicTable.tsx       # Interactive periodic table component
├── lib/
│   ├── calculator.ts           # Core absorption calculation logic
│   ├── formula-parser.ts       # Chemical formula parser
│   ├── types.ts                # TypeScript types
│   └── constants.ts            # Physical constants
├── data/
│   ├── elements.json
│   ├── edges.json
│   ├── fluorescence.json
│   └── mu-data.json
└── scripts/
    └── export-xraydb.py        # Export xraydb → JSON
```

## Deployment

- **Platform:** Vercel (free tier)
- **Build:** `next build` produces static export
- **Domain:** Custom domain optional (Vercel provides `.vercel.app` subdomain)
- **CI:** GitHub push triggers auto-deploy via Vercel integration

## Testing Strategy

- **Unit tests:** Formula parser, calculator functions (known values from xraydb)
- **Integration tests:** Tab components render correctly with mock data
- **Validation:** Cross-check calculated values against 11-BM Absorb and xraydb Python output for a set of reference compounds

## Out of Scope

- User accounts or saved calculations
- Server-side computation
- PDF report export (can be added later)
- Multi-sample comparison (can be added later)
- Internationalization
