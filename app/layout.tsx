import type { Metadata } from 'next'
import './globals.css'
import { APP_VERSION } from '@/lib/version'

export const metadata: Metadata = {
  title: 'X-Ray Absorption Calculator',
  description: 'Calculate X-ray absorption properties for synchrotron experiments',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#FFF8F5] text-gray-900 min-h-screen">
        <nav className="border-b border-[#FF378F] px-6 py-3 flex items-center justify-between bg-[#FF378F]">
          <h1 className="text-lg font-bold text-white">X-Ray Absorption Calculator</h1>
          <div className="text-sm text-white/80">
            <a href="https://github.com/TWAWEI/xray-absorb-calc" className="hover:text-white">GitHub</a>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t border-[#FFD4C0] px-6 py-6 mt-12 text-sm text-[#7A5A50] bg-[#FFF5F0]">
          <div className="max-w-4xl">
            <h2 className="text-[#FF378F] font-semibold mb-2">References</h2>
            <ul className="space-y-1 list-disc list-outside ml-5">
              <li>
                W.T. Elam, B.D. Ravel, and J.R. Sieber,{' '}
                <em>A new atomic database for X-ray spectroscopic calculations</em>,{' '}
                Radiation Physics and Chemistry <strong>63</strong> (2002) 121–128.{' '}
                <a href="https://doi.org/10.1016/S0969-806X(01)00227-4" className="text-[#FF378F] hover:text-[#FF4977]" target="_blank" rel="noopener noreferrer">
                  doi:10.1016/S0969-806X(01)00227-4
                </a>
              </li>
              <li>
                M. Newville,{' '}
                <em>xraydb: X-ray Reference Data in SQLite</em>,{' '}
                <a href="https://xraydb.xrayabsorption.org/" className="text-[#FF378F] hover:text-[#FF4977]" target="_blank" rel="noopener noreferrer">
                  xraydb.xrayabsorption.org
                </a>
              </li>
              <li>
                Inspired by the{' '}
                <a href="https://11bm.xray.aps.anl.gov/absorb/" className="text-[#FF378F] hover:text-[#FF4977]" target="_blank" rel="noopener noreferrer">
                  11-BM Absorb Calculator
                </a>
                , Advanced Photon Source, Argonne National Laboratory.
              </li>
            </ul>
          </div>
          <p className="mt-4 text-xs text-gray-400">v{APP_VERSION}</p>
        </footer>
      </body>
    </html>
  )
}
