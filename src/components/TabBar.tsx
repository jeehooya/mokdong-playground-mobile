'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const V = '?v=3'  // bump to bust icon cache after update

const TABS = [
  { href: '/info',          no: `/icons/navigator/동네 정보_no.svg${V}`,   yes: `/icons/navigator/동네정보_yes.svg${V}`,   alt: '동네 정보',   label: '동네 정보' },
  { href: '/',              no: `/icons/navigator/놀이터 지도_no.svg${V}`,  yes: `/icons/navigator/놀이터지도_yes.svg${V}`, alt: '놀이터 지도', label: '놀이터 지도' },
  { href: '/my-playground', no: `/icons/navigator/나의 놀이터_no.svg${V}`,  yes: `/icons/navigator/나의 놀이터_yes.svg${V}`, alt: '나의 놀이터', label: '나의 놀이터' },
]

const HIDDEN_PATHS = ['/camera', '/extract', '/add-playground']

const tabStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0,
  width: 50,
  textDecoration: 'none',
  flexShrink: 0,
}

const labelStyle = (active: boolean): React.CSSProperties => ({
  fontFamily: 'Pretendard, sans-serif',
  fontSize: 9,
  fontWeight: active ? 600 : 500,
  color: active ? '#0095D9' : 'rgba(111,103,76,0.4)',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  letterSpacing: -0.009,
  lineHeight: 1,
  marginTop: 0,
})

export default function TabBar() {
  const pathname = usePathname()
  const router = useRouter()
  if (HIDDEN_PATHS.includes(pathname)) return null

  function handleReset() {
    localStorage.removeItem('pipes')
    localStorage.removeItem('discovered')
    sessionStorage.clear()
    router.push('/info')
    setTimeout(() => router.replace('/'), 50)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 393,
      padding: '0 20px',
      paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        background: '#F0EAD6',
        borderRadius: 861,
        paddingTop: 12,
        paddingBottom: 16,
        paddingLeft: 32,
        paddingRight: 32,
        boxShadow: '0px 4px 7.5px rgba(0,0,0,0.1)',
        pointerEvents: 'all',
      }}>
        {TABS.map(({ href, no, yes, alt, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={tabStyle}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active ? yes : no} alt={alt}
                width={50} height={50}
                style={{ objectFit: 'contain', flexShrink: 0 }} />
              <span style={labelStyle(active)}>{label}</span>
            </Link>
          )
        })}

        {/* 연결하기 — 임시: 클릭 시 모든 오브젝트 초기화 */}
        <button onClick={handleReset} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 0, width: 50,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/icons/navigator/연결하기_no.svg${V}`} alt="연결하기"
            width={50} height={50} style={{ objectFit: 'contain', flexShrink: 0 }} />
          <span style={labelStyle(false)}>연결하기</span>
        </button>
      </nav>
    </div>
  )
}
