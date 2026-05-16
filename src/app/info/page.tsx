export default function MockdongInfo() {
  const sections = [
    {
      title: '목5동은 어떤 곳일까?',
      body: '목동 5동은 서울 양천구에 위치한 주거 지역으로, 안양천을 따라 형성된 아름다운 자연환경과 조화를 이루고 있어요. 용왕산이 품은 동네에는 오래된 골목과 새로운 이야기들이 공존합니다.',
    },
    {
      title: '숨겨진 놀이터',
      body: '목5동 곳곳에는 아이들과 어른들이 함께 즐길 수 있는 숨겨진 공간들이 있습니다. 파리공원의 분수대, 할미꽃이 피는 오솔길, 안양천변의 산책로… 모두 우리의 소중한 놀이터입니다.',
    },
    {
      title: '모여! 오동은...',
      body: '모여! 오동은 목5동 주민들이 함께 동네를 탐험하고 기억을 나누는 프로젝트입니다. 사진 한 장으로 동네의 색깔을 추출하고, 나만의 놀이터 구조물을 지도 위에 쌓아가세요.',
    },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: '#008CBF', paddingBottom: 100 }}>
      {/* Status bar area */}
      <div style={{ height: 48 }} />

      {/* Header */}
      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'Pretendard, sans-serif',
          fontSize: 28, fontWeight: 800, color: '#fff',
          letterSpacing: '-0.5px', marginBottom: 6,
        }}>모여! 오동</h1>
        <p style={{
          fontFamily: 'Pretendard, sans-serif',
          fontSize: 15, color: '#FFE000', fontWeight: 600,
        }}>목5동 주민 참여 지도 프로젝트</p>
      </div>

      {/* Sections */}
      <div style={{ padding: '32px 24px 0', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {sections.map((s, i) => (
          <div key={i}>
            <h2 style={{
              fontFamily: 'Pretendard, sans-serif',
              fontSize: 18, fontWeight: 700, color: '#FFE000',
              marginBottom: 10,
            }}>{s.title}</h2>
            <p style={{
              fontFamily: 'Pretendard, sans-serif',
              fontSize: 14, color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.7,
            }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
