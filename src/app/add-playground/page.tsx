'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PIPE_MODELS, PIPE_NAMES } from '@/lib/pipes'
import { SlotColors, slotColorsToArray } from '@/lib/colors'

interface Bubble { x: number; y: number; vx: number; vy: number; r: number; opacity: number }

export default function AddPlayground() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pipeName, setPipeName] = useState('')
  const [ready, setReady] = useState(false)
  const initializedRef = useRef(false)   // prevent React strict-mode double-run

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // Read session data
    const cellRaw = sessionStorage.getItem('selectedCell')
    const colorsRaw = sessionStorage.getItem('slotColors')
    const imageRaw = sessionStorage.getItem('capturedImage')

    const cell = cellRaw ? JSON.parse(cellRaw) : { x: Math.round((Math.random() - 0.5) * 20), z: Math.round((Math.random() - 0.5) * 20) }
    const colors: SlotColors = colorsRaw ? JSON.parse(colorsRaw) : null
    const colorArr = colors ? slotColorsToArray(colors) : Array(6).fill('#cccccc')

    // Pick random pipe model
    const modelFile = PIPE_MODELS[Math.floor(Math.random() * PIPE_MODELS.length)]
    const name = PIPE_NAMES[modelFile] ?? modelFile
    setPipeName(name)

    // Save to localStorage
    const existing = (() => { try { return JSON.parse(localStorage.getItem('pipes') ?? '[]') } catch { return [] } })()
    const newEntry = {
      x: cell.x, z: cell.z, y: 0, scale: 0.25,
      modelFile, colors: colorArr,
      photos: imageRaw ? [imageRaw] : [],
    }
    const updated = [...existing.filter((p: { x: number; z: number }) => !(p.x === cell.x && p.z === cell.z)), newEntry]
    localStorage.setItem('pipes', JSON.stringify(updated))

    // Mark as discovered
    const disc: Record<string, boolean> = (() => { try { return JSON.parse(localStorage.getItem('discovered') ?? '{}') } catch { return {} } })()
    disc[modelFile] = true
    localStorage.setItem('discovered', JSON.stringify(disc))

    // Notify map page
    sessionStorage.setItem('newPipe', JSON.stringify({ ...newEntry }))
    sessionStorage.removeItem('selectedCell')
    sessionStorage.removeItem('slotColors')
    sessionStorage.removeItem('capturedImage')

    setReady(true)

    // Redirect after 2.5s
    const timer = setTimeout(() => router.replace('/'), 2500)
    return () => clearTimeout(timer)
  }, [router])

  // Bubble animation
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const bubbles: Bubble[] = Array.from({ length: 10 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 20,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -(1 + Math.random() * 2),
      r: 8 + Math.random() * 14,
      opacity: 0.6 + Math.random() * 0.4,
    }))

    let raf = 0
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      bubbles.forEach(b => {
        b.x += b.vx; b.y += b.vy
        if (b.y < -b.r) { b.y = canvas.height + b.r; b.x = Math.random() * canvas.width }
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 224, 0, ${b.opacity})`
        ctx.fill()
      })
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{
      minHeight: '100dvh', background: '#018CBE',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Bubble canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

      <div style={{ height: 80 }} />

      <h1 style={{
        fontFamily: 'Pretendard, sans-serif',
        fontSize: 24, fontWeight: 800, color: '#fff',
        textAlign: 'center', zIndex: 1,
      }}>놀이터 짓기</h1>

      <div style={{ flexGrow: 1 }} />

      <div style={{ textAlign: 'center', zIndex: 1, padding: '0 32px' }}>
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
