import type { Metadata, Viewport } from 'next'
import './globals.css'
import TabBar from '@/components/TabBar'

export const metadata: Metadata = {
  title: '목동 놀이터',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" style={{ height: '100%', overflow: 'hidden' }}>
      <body style={{ height: '100%', overflow: 'hidden', background: 'transparent' }}>
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          overflow: 'hidden',
          background: 'transparent',
          width: '100%',
          height: '100%',
        }}>
          <main style={{ width: '100%', height: '100%' }}>
            {children}
          </main>
          <TabBar />
        </div>
      </body>
    </html>
  )
}
