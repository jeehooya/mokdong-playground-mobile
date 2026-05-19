'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Splash() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.push('/'), 2000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#008CBF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Image src="/icons/Logo.svg" alt="모여!오동" width={211} height={66} />
    </div>
  )
}
