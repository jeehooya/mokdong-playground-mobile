import type { Metadata, Viewport } from 'next'
import './globals.css'
import TabBar from '@/components/TabBar'

export const metadata: Metadata = { title: '목동 놀이터' }

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div style={{
          width: '100%',
          minWidth: 393,
          minHeight: '100dvh',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <main style={{ minHeight: '100dvh' }}>
            {children}
          </main>
          <TabBar />
        </div>
      </body>
    </html>
  )
}
