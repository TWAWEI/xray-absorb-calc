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
        <footer className="border-t border-gray-800 px-6 py-6 mt-12 text-sm text-gray-500">
          <div className="max-w-4xl">
            <h2 className="text-gray-400 font-semibold mb-2">References</h2>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                W.T. Elam, B.D. Ravel, and J.R. Sieber,{' '}
                <em>A new atomic database for X-ray spectroscopic calculations</em>,{' '}
                Radiation Physics and Chemistry <strong>63</strong> (2002) 121–128.{' '}
                <a href="https://doi.org/10.1016/S0969-806X(01)00227-4" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">
                  doi:10.1016/S0969-806X(01)00227-4
                </a>
              </li>
              <li>
                M. Newville,{' '}
                <em>xraydb: X-ray Reference Data in SQLite</em>,{' '}
                <a href="https://xraydb.xrayabsorption.org/" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">
                  xraydb.xrayabsorption.org
                </a>
              </li>
              <li>
                Inspired by the{' '}
                <a href="https://11bm.xray.aps.anl.gov/absorb/" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">
                  11-BM Absorb Calculator
                </a>
                , Advanced Photon Source, Argonne National Laboratory.
              </li>
            </ul>
          </div>
        </footer>
      </body>
    </html>
  )
}
