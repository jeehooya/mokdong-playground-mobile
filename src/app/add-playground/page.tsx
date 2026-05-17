'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PIPE_MODELS, PIPE_NAMES } from '@/lib/pipes'
import { SlotColors, slotColorsToArray } from '@/lib/colors'

export default function AddPlayground() {
  const router = useRouter()
  const [pipeName, setPipeName] = useState('')
  const [ready, setReady] = useState(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const cellRaw = sessionStorage.getItem('selectedCell')
    const colorsRaw = sessionStorage.getItem('slotColors')
    const imageRaw = sessionStorage.getItem('capturedImage')

    const cell = cellRaw ? JSON.parse(cellRaw) : { x: Math.round((Math.random() - 0.5) * 20), z: Math.round((Math.random() - 0.5) * 20) }
    const colors: SlotColors = colorsRaw ? JSON.parse(colorsRaw) : null
    const colorArr = colors ? slotColorsToArray(colors) : Array(6).fill('#cccccc')

    const modelFile = PIPE_MODELS[Math.floor(Math.random() * PIPE_MODELS.length)]
    const name = PIPE_NAMES[modelFile] ?? modelFile
    setPipeName(name)

    const existing = (() => { try { return JSON.parse(localStorage.getItem('pipes') ?? '[]') } catch { return [] } })()
    const newEntry = {
      x: cell.x, z: cell.z, y: 0, scale: 0.25,
      modelFile, colors: colorArr,
      photos: imageRaw ? [imageRaw] : [],
    }
    const updated = [...existing.filter((p: { x: number; z: number }) => !(p.x === cell.x && p.z === cell.z)), newEntry]
    localStorage.setItem('pipes', JSON.stringify(updated))

    const disc: Record<string, boolean> = (() => { try { return JSON.parse(localStorage.getItem('discovered') ?? '{}') } catch { return {} } })()
    disc[modelFile] = true
    localStorage.setItem('discovered', JSON.stringify(disc))

    sessionStorage.setItem('newPipe', JSON.stringify({ ...newEntry }))
    sessionStorage.removeItem('selectedCell')
    sessionStorage.removeItem('slotColors')
    sessionStorage.removeItem('capturedImage')

    setReady(true)
  }, [router])

  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => router.replace('/'), 2500)
    return () => clearTimeout(timer)
  }, [ready, router])

  return (
    <div style={{
      minHeight: '100dvh', background: '#018CBE',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background illustration */}
      <Image
        src="/icons/add-playground-illust.png"
        alt=""
        fill
        style={{ objectFit: 'cover', pointerEvents: 'none' }}
        priority
      />

      <div style={{ height: 80, position: 'relative', zIndex: 1 }} />

      <h1 style={{
        fontFamily: 'Pretendard, sans-serif',
        fontSize: 24, fontWeight: 800, color: '#fff',
        textAlign: 'center', zIndex: 1, position: 'relative',
      }}>놀이터 짓기</h1>

      <div style={{ flexGrow: 1 }} />

      <div style={{ textAlign: 'center', zIndex: 1, position: 'relative', padding: '0 32px' }}>
        <p style={{
          fontFamily: 'Pretendard, sans-serif',
          fontSize: 16, color: '#fff', marginBottom: 12, lineHeight: 1.6,
        }}>
          사진이 등록되었습니다!
        </p>
        {pipeName && (
          <p style={{
            fontFamily: 'Pretendard, sans-serif',
            fontSize: 20, fontWeight: 700, color: '#FFE000',
          }}>
            &ldquo;{pipeName}&rdquo;
          </p>
        )}
        <p style={{ fontFamily: 'Pretendard, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
          지도로 이동합니다…
        </p>
      </div>

      <div style={{ flexGrow: 2 }} />
    </div>
  )
}
