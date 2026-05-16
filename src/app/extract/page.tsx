'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { extractSlotColors, SlotColors } from '@/lib/colors'

export default function ExtractColor() {
  const router = useRouter()
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [colors, setColors] = useState<SlotColors | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const src = sessionStorage.getItem('capturedImage')
    if (!src) { router.replace('/camera'); return }
    setImageSrc(src)

    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current!
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setColors(extractSlotColors(data))
    }
    img.src = src
  }, [router])

  const confirm = () => {
    if (!colors) return
    sessionStorage.setItem('slotColors', JSON.stringify(colors))
    router.push('/add-playground')
  }

  const LABELS = [
    { key: 'milk' as const,        label: 'Milk' },
    { key: 'skyblue' as const,     label: 'Skyblue' },
    { key: 'brown' as const,       label: 'Brown' },
    { key: 'insideGreen' as const, label: 'Inside Green' },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: '#F0EAD6', display: 'flex', flexDirection: 'column' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ height: 48 }} />

      {/* Header */}
      <div style={{
        padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24,
      }}>
        <h1 style={{ fontFamily: 'Pretendard, sans-serif', fontSize: 18, fontWeight: 700, color: '#3A2E1A' }}>
          놀이터 색상 추출
        </h1>
        <button onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#3A2E1A', fontSize: 24, cursor: 'pointer' }}>×</button>
      </div>

      {/* Photo */}
      {imageSrc && (
        <div style={{ padding: '0 24px', marginBottom: 24 }}>
          <img
            src={imageSrc}
            alt="선택한 사진"
            style={{
              width: '100%', borderRadius: 16,
              border: '3px solid #FFE000',
              objectFit: 'cover', maxHeight: 260,
            }}
          />
        </div>
      )}

      {/* Colors */}
      {colors && (
        <div style={{ padding: '0 24px', marginBottom: 32 }}>
          <p style={{ fontFamily: 'Pretendard, sans-serif', fontSize: 13, color: '#6B5A3A', marginBottom: 12 }}>
            추출된 색상
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            {LABELS.map(({ key, label }) => (
              <div key={key} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{
                  width: '100%', aspectRatio: '1', borderRadius: 12,
                  background: colors[key],
                  border: '2px solid rgba(0,0,0,0.08)',
                  boxShadow: `0 4px 12px ${colors[key]}66`,
                  marginBottom: 6,
                }} />
                <span style={{ fontSize: 10, color: '#6B5A3A', fontFamily: 'Pretendard, sans-serif' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm */}
      <div style={{ padding: '0 24px', marginTop: 'auto', paddingBottom: 40 }}>
        <button
          onClick={confirm}
          disabled={!colors}
          style={{
            width: '100%', height: 56, borderRadius: 28, border: 'none',
            background: colors ? '#FFE000' : '#ccc',
            fontFamily: 'Pretendard, sans-serif', fontSize: 16, fontWeight: 700, color: '#3A2E1A',
            cursor: colors ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          ✓ 색상 확정하기
        </button>
      </div>
    </div>
  )
}
