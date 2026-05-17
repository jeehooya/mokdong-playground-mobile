'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { PIPE_MODELS, PIPE_NAMES, PIPE_DESCRIPTIONS, PIPE_SVG_NAMES } from '@/lib/pipes'

interface PipeData { modelFile: string; discovered: boolean }

export default function MyPlayground() {
  const router = useRouter()
  const [pipes, setPipes] = useState<PipeData[]>([])

  useEffect(() => {
    const stored: Record<string, boolean> = {}
    try {
      const raw = JSON.parse(localStorage.getItem('pipes') ?? '[]')
      raw.forEach((p: { modelFile: string }) => { stored[p.modelFile] = true })
    } catch { /* ignore */ }
    setPipes(PIPE_MODELS.map(f => ({ modelFile: f, discovered: !!stored[f] })))
  }, [])

  return (
    <div style={{ minHeight: '100dvh', background: '#6F674C' }}>
      <style>{`
        .pipe-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 16px 20px 120px;
        }
        @media (min-width: 768px) {
          .pipe-grid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
      `}</style>

      {/* Status bar */}
      <div style={{ height: 48, paddingTop: 'env(safe-area-inset-top, 0px)' }} />

      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#6F674C',
        height: 56,
        display: 'flex', alignItems: 'center',
        paddingLeft: 20, paddingRight: 20,
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/Back.svg" alt="뒤로가기" width={28} height={28} />
          </button>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{
            fontFamily: 'Pretendard, sans-serif',
            fontSize: 18, fontWeight: 600, color: '#F0EAD6',
          }}>수집한 놀이터</span>
        </div>
        <div style={{ flex: 1 }} />
      </div>

      {/* Card grid */}
      <div className="pipe-grid">
        {pipes.map(({ modelFile, discovered }) => {
          const svgEntry = PIPE_SVG_NAMES[modelFile]
          if (!svgEntry) return null
          const name = PIPE_NAMES[modelFile] ?? modelFile
          const desc = PIPE_DESCRIPTIONS[modelFile] ?? ''
          const svgFile = discovered ? `/pipe-svg/${svgEntry.yes}` : `/pipe-svg/${svgEntry.no}`

          if (discovered) {
            return (
              <div key={modelFile} style={{
                height: 216, borderRadius: 20,
                background: '#F0EAD6',
                boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'space-between',
                paddingTop: 20, paddingBottom: 20,
                paddingLeft: 16, paddingRight: 16,
              }}>
                <Image src={svgFile} alt={name} width={96} height={96}
                  style={{ objectFit: 'contain' }} onError={() => {}} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    fontFamily: 'Pretendard, sans-serif',
                    fontSize: 16, fontWeight: 700, color: '#000',
                    letterSpacing: -0.016, lineHeight: 1.5,
                    margin: '0 0 4px',
                  }}>{name}</p>
                  <p style={{
                    fontFamily: 'Pretendard, sans-serif',
                    fontSize: 10, fontWeight: 500,
                    color: 'rgba(0,0,0,0.4)',
                    lineHeight: 1.4, letterSpacing: -0.01,
                    margin: 0,
                  }}>{desc}</p>
                </div>
              </div>
            )
          }

          return (
            <div key={modelFile} style={{
              height: 216, borderRadius: 20,
              background: 'rgba(58,58,58,0.6)',
              boxShadow: '0px 1px 6px rgba(0,0,0,0.1)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-end',
              paddingBottom: 24, gap: 12,
            }}>
              <Image src={svgFile} alt="미발견" width={90} height={90}
                style={{ objectFit: 'contain' }} onError={() => {}} />
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'Pretendard, sans-serif',
                  fontSize: 16, fontWeight: 700, color: '#F0EAD6',
                  margin: '0 0 2px',
                }}>??</p>
                <p style={{
                  fontFamily: 'Pretendard, sans-serif',
                  fontSize: 12, fontWeight: 500,
                  color: 'rgba(240,234,214,0.6)',
                  lineHeight: 1.6, margin: 0,
                }}>미발견 놀이터</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
