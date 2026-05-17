'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Camera() {
  const router = useRouter()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const albumInputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      // Resize to max 1024px and compress to JPEG 0.75 to fit sessionStorage limit
      const MAX = 1024
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
      try {
        sessionStorage.setItem('capturedImage', dataUrl)
        router.push('/extract')
      } catch {
        // If still too large, try lower quality
        const smaller = canvas.toDataURL('image/jpeg', 0.5)
        sessionStorage.setItem('capturedImage', smaller)
        router.push('/extract')
      }
    }
    img.src = objectUrl
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ height: 48 }} />

      {/* Header */}
      <div style={{
        width: '100%', padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24,
      }}>
        <h1 style={{ fontFamily: 'Pretendard, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>
          색상 추출
        </h1>
        <button onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>×</button>
      </div>

      {/* Viewfinder */}
      <div style={{
        width: 'calc(100% - 48px)', aspectRatio: '1',
        border: '3px solid #FFE000', borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.3)', fontSize: 14,
        fontFamily: 'Pretendard, sans-serif', flexGrow: 1,
        margin: '0 24px', maxHeight: 340,
      }}>
        사진을 선택하세요
      </div>

      {/* Bottom controls */}
      <div style={{
        width: '100%', padding: '32px 40px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Album */}
        <button
          onClick={() => albumInputRef.current?.click()}
          style={{
            width: 52, height: 52, borderRadius: 12, border: '2px solid rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 24, color: '#fff',
          }}
        >🖼</button>

        {/* Shutter */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          style={{
            width: 72, height: 72, borderRadius: '50%', border: '4px solid #fff',
            background: '#FFE000', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}
        >📷</button>

        <div style={{ width: 52 }} />
      </div>

      {/* Hidden inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <input ref={albumInputRef} type="file" accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}
