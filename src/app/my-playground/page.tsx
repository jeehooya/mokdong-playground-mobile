'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { PIPE_MODELS, PIPE_NAMES, PIPE_DESCRIPTIONS, getPipeSvgIdx } from '@/lib/pipes'

interface PipeData { modelFile: string; discovered: boolean }

export default function MyPlayground() {
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
    <div style={{ minHeight: '100dvh', background: '#6F674C', paddingBottom: 100 }}>
      <div style={{ height: 48 }} />

      {/* Header */}
      <div style={{ padding: '20px 20px 16px' }}>
        <h1 style={{
          fontFamily: 'Pretendard, sans-serif',
          fontSize: 22, fontWeight: 800, color: '#fff',
        }}>수집한 놀이터</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontFamily: 'Pretendard, sans-serif' }}>
          {pipes.filter(p => p.discovered).length} / {PIPE_MODELS.length} 발견
        </p>
      </div>

      {/* Grid */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {pipes.map(({ modelFile, discovered }) => {
          const svgIdx = getPipeSvgIdx(modelFile)
          const name = PIPE_NAMES[modelFile] ?? modelFile
          const desc = PIPE_DESCRIPTIONS[modelFile] ?? ''
          const svgFile = discovered
            ? `/pipe-svg/${svgIdx}_발견.svg`
            : `/pipe-svg/${svgIdx}_미발견.svg`

          return (
            <div
              key={modelFile}
              style={{
                background: discovered ? '#F0EAD6' : '#3A3428',
                borderRadius: 16, padding: 14, overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <Image
                  src={svgFile}
                  alt={name}
                  width={80} height={80}
                  style={{ objectFit: 'contain' }}
                  onError={() => {}}
                />
              </div>
              <p style={{
                fontFamily: 'Pretendard, sans-serif',
                fontSize: 13, fontWeight: 700,
                color: discovered ? '#3A2E1A' : '#888',
                marginBottom: 4, lineHeight: 1.3,
              }}>
                {discovered ? name : '??'}
              </p>
              <p style={{
                fontFamily: 'Pretendard, sans-serif',
                fontSize: 11, color: discovered ? '#6B5A3A' : '#555',
                lineHeight: 1.4,
              }}>
                {discovered ? desc : '미발견 놀이터'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
