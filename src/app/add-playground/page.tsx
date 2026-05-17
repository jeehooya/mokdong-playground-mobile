'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PIPE_MODELS } from '@/lib/pipes'
import { SlotColors, slotColorsToArray } from '@/lib/colors'

interface Bubble { x: number; y: number; vx: number; vy: number }

export default function AddPlayground() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const bubblesRef = useRef<Bubble[]>([])
  const rafRef = useRef(0)
  const initializedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [bubblePositions, setBubblePositions] = useState<{ x: number; y: number }[]>([])

  // Data processing
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const cellRaw = sessionStorage.getItem('selectedCell')
    const colorsRaw = sessionStorage.getItem('slotColors')
    const imageRaw = sessionStorage.getItem('capturedImage')

    const cell = cellRaw
      ? JSON.parse(cellRaw)
      : { x: Math.round((Math.random() - 0.5) * 20), z: Math.round((Math.random() - 0.5) * 20) }
    const colors: SlotColors = colorsRaw ? JSON.parse(colorsRaw) : null
    const colorArr = colors ? slotColorsToArray(colors) : Array(6).fill('#cccccc')

    const modelFile = PIPE_MODELS[Math.floor(Math.random() * PIPE_MODELS.length)]

    const existing = (() => { try { return JSON.parse(localStorage.getItem('pipes') ?? '[]') } catch { return [] } })()
    const newEntry = { x: cell.x, z: cell.z, y: 0, scale: 0.25, modelFile, colors: colorArr, photos: imageRaw ? [imageRaw] : [] }
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
  }, [])

  // Redirect after 2.5s
  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => router.replace('/'), 2500)
    return () => clearTimeout(timer)
  }, [ready, router])

  // Bubble animation
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const W = container.clientWidth
    const H = container.clientHeight
    const SIZE = 36

    bubblesRef.current = Array.from({ length: 10 }, () => ({
      x: Math.random() * (W - SIZE),
      y: Math.random() * (H - SIZE),
      vx: (Math.random() * 2 + 0.8) * (Math.random() > 0.5 ? 1 : -1),
      vy: (Math.random() * 2 + 0.8) * (Math.random() > 0.5 ? 1 : -1),
    }))

    const tick = () => {
      const W2 = containerRef.current?.clientWidth ?? W
      const H2 = containerRef.current?.clientHeight ?? H

      bubblesRef.current = bubblesRef.current.map(b => {
        let { x, y, vx, vy } = b
        x += vx
        y += vy
        if (x <= 0) { x = 0; vx = Math.abs(vx) }
        if (x >= W2 - SIZE) { x = W2 - SIZE; vx = -Math.abs(vx) }
        if (y <= 0) { y = 0; vy = Math.abs(vy) }
        if (y >= H2 - SIZE) { y = H2 - SIZE; vy = -Math.abs(vy) }
        return { x, y, vx, vy }
      })

      setBubblePositions(bubblesRef.current.map(b => ({ x: b.x, y: b.y })))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: '100dvh',
        background: '#018CBF',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Bouncing bubbles */}
      {bubblePositions.map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#FBD600',
            opacity: 1,
            pointerEvents: 'none',
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            willChange: 'transform',
          }}
        />
      ))}

      {/* Center text */}
      <div style={{
        position: 'absolute', top: 311,
        width: '100%', textAlign: 'center',
      }}>
        <p style={{
          color: '#fff', fontSize: 20, fontWeight: 600,
          lineHeight: 1.55, letterSpacing: -0.02,
          fontFamily: 'Pretendard, sans-serif',
          whiteSpace: 'pre-line', margin: 0,
        }}>
          {'사진이\n등록되었습니다!'}
        </p>
      </div>

      {/* Illustration */}
      <div style={{
        position: 'absolute', right: 0, bottom: 0,
        width: '70%', maxWidth: 320,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/add-playground-illust.png?v=2"
          alt=""
          style={{ width: '100%', display: 'block' }}
          onError={() => {}}
        />
      </div>
    </div>
  )
}
