export const PIPE_MODELS = [
  'Cylinder.001.glb', 'Cylinder.002.glb', 'Cylinder.006.glb', 'Cylinder.007.glb',
  'Cylinder.008.glb', 'Cylinder.009.glb', 'Cylinder.011.glb', 'Cylinder.012.glb',
  'Cylinder.016.glb', 'Cylinder.021.glb', 'Cylinder.022.glb', 'Cylinder.023.glb',
  'Cylinder.025.glb', 'Cylinder.046.glb',
  'Cylinder 005 .glb', 'Cylinder 013 .glb', 'Cylinder 014 .glb', 'Cylinder 015 .glb',
]

export const PIPE_NAMES: Record<string, string> = {
  'Cylinder.001.glb': '용왕 꼬리',
  'Cylinder.002.glb': '터널 기억자 입구',
  'Cylinder.006.glb': '구불구불 안양천',
  'Cylinder.007.glb': '터널 일자 입구',
  'Cylinder.008.glb': '작은 월촌리',
  'Cylinder.009.glb': '꽃봉오리',
  'Cylinder.011.glb': '소나무 동산',
  'Cylinder.012.glb': '지나가는 터널',
  'Cylinder.016.glb': '여름의 파리공원',
  'Cylinder.021.glb': '할미꽃 터널입구',
  'Cylinder.022.glb': '큰 월촌리',
  'Cylinder.023.glb': '수업 중 딴짓',
  'Cylinder.025.glb': '그럼에도 꽃피우는',
  'Cylinder.046.glb': '지나가는 알록달록 터널',
  'Cylinder 014 .glb': '손꼽히는 기둥',
  'Cylinder 015 .glb': '과거의 목장',
  'Cylinder 005 .glb': '튼튼한 받침대',
  'Cylinder 013 .glb': '꼬부랑 지팡이',  
}

export const PIPE_DESCRIPTIONS: Record<string, string> = {
  'Cylinder.001.glb': '산 아래 한강의 물줄기가 마치 용왕의 꼬리같다!',
  'Cylinder.002.glb': '목동 골목의 아치형 터널을 지나며',
  'Cylinder.006.glb': '안양천 따라 구불구불 이어지는 길목을 걸어보자',
  'Cylinder.007.glb': '곧게 뻗은 터널 너머 빛이 보여',
  'Cylinder.008.glb': '작은 마을 월촌리의 아늑한 골목',
  'Cylinder.009.glb': '꽃피울 날이 머지 않은 모든 아이들을 위하여!',
  'Cylinder.011.glb': '용왕산 소나무 아래 모이는 동네 사람들',
  'Cylinder.012.glb': '지나가다 발견한 작은 터널의 비밀',
  'Cylinder.016.glb': '파리공원의 분수대에서 시원하게 터져나오는 물줄기',
  'Cylinder.021.glb': '봄마다 피어나는 할미꽃처럼',
  'Cylinder.022.glb': '용왕산의 차오르는 달을 가장 먼저 마중하는 동네',
  'Cylinder.023.glb': '수업 중 창밖을 바라보던 그 시절',
  'Cylinder.025.glb': '그럼에도 불구하고 꽃은 피어난다',
  'Cylinder.046.glb': '알록달록 빛나는 목동의 골목골목',
}

// GLB → { no: 미발견 SVG, yes: 발견 SVG } 매핑
export const PIPE_SVG_NAMES: Record<string, { no: string; yes: string }> = {
  'Cylinder.001.glb':  { no: '용왕 꼬리.svg',           yes: '용왕 꼬리02.svg' },
  'Cylinder.002.glb':  { no: '터널 기억자 입구01.svg',   yes: '터널 기억자 입구02.svg' },
  'Cylinder.006.glb':  { no: '구불구불 안양천.svg',       yes: '구불구불 안양천02.svg' },
  'Cylinder.007.glb':  { no: '터널 일자 입구.svg',        yes: '터널 일자 입구02.svg' },
  'Cylinder.008.glb':  { no: '작은 월촌리.svg',           yes: '작은 월촌리02.svg' },
  'Cylinder.009.glb':  { no: '꽃봉오리.svg',              yes: '꽃봉오리02.svg' },
  'Cylinder.011.glb':  { no: '소나무동산01.svg',           yes: '소나무동산02.svg' },
  'Cylinder.012.glb':  { no: '지나가는 터널.svg',          yes: '지나가는 터널02.svg' },
  'Cylinder.016.glb':  { no: '여름의 파리공원.svg',        yes: '여름의 파리공원02.svg' },
  'Cylinder.021.glb':  { no: '할미꽃 터널입구.svg',        yes: '할미꽃 터널입구02.svg' },
  'Cylinder.022.glb':  { no: '큰 월촌리.svg',              yes: '큰 월촌리02.svg' },
  'Cylinder.023.glb':  { no: '수업 중 딴짓.svg',           yes: '수업 중 딴짓02.svg' },
  'Cylinder.025.glb':  { no: '그럼에도 꽃피우는.svg',      yes: '그럼에도 꽃피우는02.svg' },
  'Cylinder.046.glb':  { no: '지나가는 터널.svg',          yes: '지나가는 터널02.svg' },
  'Cylinder 005 .glb': { no: '튼튼한 받침대001.svg',       yes: '튼튼한 받침대002.svg' },
  'Cylinder 013 .glb': { no: '꼬부랑 지팡이.svg',          yes: '꼬부랑 지팡이02.svg' },
  'Cylinder 014 .glb': { no: '손꼽히는 기둥.svg',          yes: '손꼽히는 기둥02.svg' },
  'Cylinder 015 .glb': { no: '과거의 목장.svg',            yes: '과거의 목장02.svg' },
}

export const MAP_THEMES = {
  default: { file: 'map_default.glb',  fieldName: 'Map_Field',        bg: '#9EA385', filter: 'none' },
  blue:    { file: 'map_blue.glb',     fieldName: 'Map_Field_Blue',   bg: '#4299b2', filter: 'brightness(0.9) contrast(0.8) saturate(1.4)' },
  yellow:  { file: 'map_Yellow.glb',   fieldName: 'Map_Field_Yellow', bg: '#F5C800', filter: 'saturate(0.9) contrast(0.8) brightness(1.1)' },
} as const
export type ThemeKey = keyof typeof MAP_THEMES
