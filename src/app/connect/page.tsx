'use client'

import { useRouter } from 'next/navigation'

export default function Connect() {
  const router = useRouter()

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      overflow: 'hidden',
      background: '#008CBF',
    }}>
      {/* 일러스트 */}
      <div style={{
        position: 'absolute', top: 126, left: '50%',
        transform: 'translateX(calc(-40% - 20px))',
        width: 196,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/Error_Illust.png" alt="" style={{ width: '100%', display: 'block' }} />
      </div>

      {/* 텍스트 */}
      <div style={{
        position: 'absolute', top: 463,
        width: '100%', textAlign: 'center',
      }}>
        <p style={{
          color: '#fff', fontSize: 20, fontWeight: 500,
          fontFamily: 'Pretendard, sans-serif',
          lineHeight: 1.5, letterSpacing: '-0.02px',
          whiteSpace: 'pre-line', margin: 0,
        }}>
          {'아직 이 놀이터는 공사 중!\n곧 완성된 모습으로 만나요'}
        </p>
      </div>

      {/* 내 지도로 가기 버튼 */}
      <div style={{
        position: 'absolute', top: 614,
        left: '50%', transform: 'translateX(-50%)',
      }}>
        <button
          onClick={() => { localStorage.removeItem('pipes'); router.push('/') }}
          style={{
            background: '#FFD900', borderRadius: 999,
            paddingLeft: 20, paddingRight: 20,
            paddingTop: 8, paddingBottom: 8,
            fontSize: 18, fontWeight: 500, color: '#000',
            fontFamily: 'Pretendard, sans-serif',
            whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
          }}
        >
          내 지도로 가기
        </button>
      </div>
    </div>
  )
}
