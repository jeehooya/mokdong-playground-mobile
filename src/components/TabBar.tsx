'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const V = '?v=3'

const TABS = [
  { href: '/info',          no: '/icons/navigator/동네 정보_no.svg'  + V, yes: '/icons/navigator/동네정보_yes.svg'   + V, alt: '동네 정보',   label: '동네 정보',   activeColor: '#EEA300' },
  { href: '/',              no: '/icons/navigator/놀이터 지도_no.svg' + V, yes: '/icons/navigator/놀이터지도_yes.svg'  + V, alt: '놀이터 지도', label: '놀이터 지도', activeColor: '#0095D9' },
  { href: '/my-playground', no: '/icons/navigator/나의 놀이터_no.svg' + V, yes: '/icons/navigator/나의 놀이터_yes.svg' + V, alt: '나의 놀이터', label: '나의 놀이터', activeColor: '#E64528' },
]

const INACTIVE_COLOR = 'rgba(111,103,76,0.4)'

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

function labelStyle(active: boolean, color: string): React.CSSProperties {
  return {
    fontFamily: 'Pretendard, sans-serif',
    fontSize: 9,
    fontWeight: active ? 600 : 500,
    color: active ? color : INACTIVE_COLOR,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    letterSpacing: -0.009,
    lineHeight: 1,
    marginTop: 0,
  }
}

const HIDDEN_PATHS = ['/camera', '/extract', '/add-playground']

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
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', justifyContent: 'center',
      paddingLeft: 20, paddingRight: 20,
      paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      background: 'transparent',
      pointerEvents: 'none',
    }}>
      <nav style={{
        width: '100%',
        maxWidth: 353,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        background: '#F0EAD6',
        borderRadius: 861,
        paddingTop: 4,
        paddingBottom: 12,
        paddingLeft: 16,
        paddingRight: 16,
        boxShadow: '0px 4px 7.5px rgba(0,0,0,0.1)',
        pointerEvents: 'all',
      }}>
        {TABS.map(({ href, no, yes, alt, label, activeColor }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={tabStyle}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active ? yes : no} alt={alt}
                width={50} height={50}
                style={{ objectFit: 'contain', flexShrink: 0 }} />
              <span style={labelStyle(active, activeColor)}>{label}</span>
            </Link>
          )
        })}

        {/* 연결하기 */}
        <button onClick={handleReset} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 0, width: 50,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={'/icons/navigator/연결하기_no.svg' + V} alt="연결하기"
            width={50} height={50} style={{ objectFit: 'contain', flexShrink: 0 }} />
          <span style={labelStyle(false, INACTIVE_COLOR)}>연결하기</span>
        </button>
      </nav>
    </div>
  )
}
