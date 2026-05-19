'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { extractSlotColors, snapToPaletteUnique, PALETTE_NAMES } from '@/lib/colors'

export default function ExtractColor() {
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [colors, setColors] = useState<string[] | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const src = sessionStorage.getItem('capturedImage')
    if (!src) { router.replace('/'); return }
    setImageUrl(src)

    const img = new window.Image()
    img.onload = () => {
      const canvas = canvasRef.current!
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const raw = extractSlotColors(data)
      const slotHexes = [raw.milk, raw.skyblue, raw.brown, raw.insideGreen]
      setColors(snapToPaletteUnique(slotHexes))
    }
    img.src = src
  }, [router])

  const handleConfirm = () => {
    if (!colors) return
    sessionStorage.setItem('slotColors', JSON.stringify(colors))
    router.push('/add-playground')
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      overflow: 'hidden',
      background: '#F0EAD6',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* 헤더 */}
      <div style={{
        height: 104, flexShrink: 0,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        paddingBottom: 16, paddingLeft: 20, paddingRight: 20,
      }}>
        <div style={{ width: 28 }} />
        <span style={{
          fontSize: 18, fontWeight: 700, color: '#000',
          fontFamily: 'Pretendard, sans-serif',
        }}>색깔 칠하기</span>
        <button
          onClick={() => router.push('/')}
          style={{
            width: 28, height: 28,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/close_black.svg" alt="닫기" width={20} height={20}
            style={{ objectFit: 'contain' }} />
        </button>
      </div>

      {/* 사진 영역 */}
      <div style={{
        flex: 1, minHeight: 0,
        paddingLeft: 20, paddingRight: 20,
      }}>
        <div style={{
          width: '100%', height: '100%',
          borderRadius: 9,
          overflow: 'hidden',
          border: '2px solid #000',
          boxShadow: '0px 4px 18px 3px rgba(0,0,0,0.11)',
          background: imageUrl ? 'transparent' : '#ccc',
        }}>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="선택한 사진"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9, display: 'block' }}
            />
          )}
        </div>
      </div>

      {/* 추출 색상 */}
      <div style={{
        flexShrink: 0,
        paddingTop: 16, paddingBottom: 16,
        display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
      }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: colors ? colors[i] : '#ddd',
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 12, fontWeight: 500, color: '#000',
              fontFamily: 'Pretendard, sans-serif',
            }}>{colors ? (PALETTE_NAMES[colors[i]] ?? 'COLOR') : '...'}</span>
          </div>
        ))}
      </div>

      {/* 확인 버튼 */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', paddingBottom: 40 }}>
        <button
          onClick={handleConfirm}
          style={{ background: 'none', border: 'none', cursor: colors ? 'pointer' : 'not-allowed', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: colors ? 1 : 0.4 }}
        >
          <Image src="/icons/Btn_Extract_Check.svg" alt="확인" width={80} height={80} style={{ objectFit: 'contain' }} />
        </button>
      </div>
    </div>
  )
}
