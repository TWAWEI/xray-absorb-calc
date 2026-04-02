import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

async function importLoader() {
  return await import('@/lib/data-loader')
}

describe('loadElements', () => {
  it('fetches and returns elements', async () => {
    const mockData = [{ Z: 1, symbol: 'H', name: 'Hydrogen', atomic_mass: 1.008 }]
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })

    const { loadElements } = await importLoader()
    const result = await loadElements()
    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith('/data/elements.json')
  })

  it('caches after first load', async () => {
    const mockData = [{ Z: 1, symbol: 'H', name: 'Hydrogen', atomic_mass: 1.008 }]
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })

    const { loadElements } = await importLoader()
    await loadElements()
    await loadElements()
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

describe('loadEdges', () => {
  it('fetches and returns edges', async () => {
    const mockData = { Fe: [{ edge: 'K', energy_eV: 7112 }] }
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })

    const { loadEdges } = await importLoader()
    const result = await loadEdges()
    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith('/data/edges.json')
  })
})

describe('loadMuData', () => {
  it('fetches mu data', async () => {
    const mockData = { H: { symbol: 'H', edges: [], data: [] } }
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })

    const { loadMuData } = await importLoader()
    const result = await loadMuData()
    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith('/data/mu-data.json')
  })
})

describe('loadFluorescence', () => {
  it('fetches fluorescence data', async () => {
    const mockData = { Fe: [{ line: 'Ka1', energy_eV: 6403.84, intensity: 1.0 }] }
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })

    const { loadFluorescence } = await importLoader()
    const result = await loadFluorescence()
    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith('/data/fluorescence.json')
  })
})

describe('fetchJson error handling', () => {
  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

    const { loadEdges } = await importLoader()
    await expect(loadEdges()).rejects.toThrow('Failed to load /data/edges.json: 404')
  })
})
