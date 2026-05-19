'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Splash() {
  const router = useRouter()
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setOpacity(0), 1500)
    const navTimer = setTimeout(() => router.push('/'), 2000)
    return () => { clearTimeout(fadeTimer); clearTimeout(navTimer) }
  }, [router])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#008CBF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity,
      transition: 'opacity 0.5s ease',
    }}>
      <Image src="/icons/Logo.svg" alt="모여!오동" width={211} height={66} />
    </div>
  )
}
