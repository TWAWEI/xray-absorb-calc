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
