import type {
  ElementData,
  AbsorptionEdge,
  FluorescenceLine,
  ElementMuData,
} from './types'

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
  return elementsCache!
}

export async function loadEdges(): Promise<Readonly<Record<string, readonly AbsorptionEdge[]>>> {
  if (edgesCache === null) {
    edgesCache = await fetchJson('/data/edges.json')
  }
  return edgesCache!
}

export async function loadFluorescence(): Promise<Readonly<Record<string, readonly FluorescenceLine[]>>> {
  if (fluorescenceCache === null) {
    fluorescenceCache = await fetchJson('/data/fluorescence.json')
  }
  return fluorescenceCache!
}

export async function loadMuData(): Promise<Readonly<Record<string, ElementMuData>>> {
  if (muDataCache === null) {
    muDataCache = await fetchJson('/data/mu-data.json')
  }
  return muDataCache!
}
