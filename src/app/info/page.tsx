import Image from 'next/image'

const BLOCKS = [
  {
    title: '목5동은\n어떤 곳일까?',
    body: '목5동은 과거 안양천을 따라 논과 밭이 펼쳐져 있던 한적한 뚝방 동네였습니다. 1980년대, 최초의 대규모 계획 주택 단지로 개발되면서 급격한 변화를 맞이해 지금의 동네가 되었습니다.',
  },
  {
    title: '숨겨진 놀이터',
    body: '거대한 아파트 장벽과 빽빽한 학원가 속에는 우리가 미처 보지 못한 또 다른 목5동이 있습니다. 단지 구석구석 숨어있는 크고 작은 놀이터들입니다. 치열한 학원 스케줄 틈새, 가방을 던져둔 채 잠깐의 자유를 만끽하는 아이들의 웃음소리가 머무는 곳이며, 굳건한 아파트 숲을 사람 사는 동네로 숨 쉬게 하는 \'활기의 보물창고\'입니다.',
  },
  {
    title: '모여! 오동은...',
    body: '목5동은 오랫동안 \'학군지\'라는 단 하나의 이미지로 소비되어 왔습니다. 하지만 이 동네를 실제로 살아온 사람들은 압니다. 아파트 병풍 사이 어딘가, 학원 스케줄 틈새 어딘가에 늘 아이들이 모여 있었다는 것을.\n\n이 브랜드는 그 틈새를 다시 발견하는 일에서 출발합니다. 학업 열망과 골목 활기가 공존하는 이 동네를 \'놀기 좋은 곳\'으로 재명명하고, 주민 스스로가 자신의 공간에 애착과 자부심을 갖도록 돕는 것입니다.',
  },
]

const YELLOW = '#FBD600'

const divider = {
  width: '100%',
  height: 1,
  background: YELLOW,
  opacity: 0.5,
  marginBottom: 10,
} as const

export default function MockdongInfo() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      overflowY: 'auto', overflowX: 'hidden',
      background: '#008CBF',
      fontFamily: 'Pretendard, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        paddingTop: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        paddingBottom: 56,
      }}>
        <Image
          src="/icons/Logo.svg"
          alt="모여! 오동"
          width={211}
          height={66}
          style={{ objectFit: 'contain' }}
        />
        <p style={{
          color: YELLOW,
          fontSize: 18,
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.5,
          letterSpacing: -0.018,
          whiteSpace: 'pre-line',
          margin: 0,
        }}>
          {'깊은 열망은 잔잔하게,\n아이들의 활기는 선명하게!'}
        </p>
      </div>

      {/* Content blocks */}
      <div style={{
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 120,
        display: 'flex',
        flexDirection: 'column',
        gap: 56,
      }}>
        {BLOCKS.map((block, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {/* Left header */}
            <div style={{ flex: '0 0 26%', minWidth: 0 }}>
              <div style={divider} />
              <p style={{
                color: YELLOW,
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.5,
                letterSpacing: -0.014,
                whiteSpace: 'pre-line',
                margin: 0,
              }}>
                {block.title}
              </p>
            </div>
            {/* Right body */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={divider} />
              <p style={{
                color: YELLOW,
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.65,
                letterSpacing: -0.014,
                whiteSpace: 'pre-line',
                margin: 0,
              }}>
                {block.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
