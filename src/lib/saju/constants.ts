import { HeavenlyStem, EarthlyBranch, FiveElement, TenGodName } from './types';

// 10 천간
export const HEAVENLY_STEMS: HeavenlyStem[] = [
  { index: 0, korean: '갑', hanja: '甲', element: 'wood',  yinYang: 'yang' },
  { index: 1, korean: '을', hanja: '乙', element: 'wood',  yinYang: 'yin'  },
  { index: 2, korean: '병', hanja: '丙', element: 'fire',  yinYang: 'yang' },
  { index: 3, korean: '정', hanja: '丁', element: 'fire',  yinYang: 'yin'  },
  { index: 4, korean: '무', hanja: '戊', element: 'earth', yinYang: 'yang' },
  { index: 5, korean: '기', hanja: '己', element: 'earth', yinYang: 'yin'  },
  { index: 6, korean: '경', hanja: '庚', element: 'metal', yinYang: 'yang' },
  { index: 7, korean: '신', hanja: '辛', element: 'metal', yinYang: 'yin'  },
  { index: 8, korean: '임', hanja: '壬', element: 'water', yinYang: 'yang' },
  { index: 9, korean: '계', hanja: '癸', element: 'water', yinYang: 'yin'  },
];

// 12 지지
export const EARTHLY_BRANCHES: EarthlyBranch[] = [
  { index: 0,  korean: '자', hanja: '子', element: 'water', yinYang: 'yang', animal: '쥐'     },
  { index: 1,  korean: '축', hanja: '丑', element: 'earth', yinYang: 'yin',  animal: '소'     },
  { index: 2,  korean: '인', hanja: '寅', element: 'wood',  yinYang: 'yang', animal: '호랑이' },
  { index: 3,  korean: '묘', hanja: '卯', element: 'wood',  yinYang: 'yin',  animal: '토끼'   },
  { index: 4,  korean: '진', hanja: '辰', element: 'earth', yinYang: 'yang', animal: '용'     },
  { index: 5,  korean: '사', hanja: '巳', element: 'fire',  yinYang: 'yin',  animal: '뱀'     },
  { index: 6,  korean: '오', hanja: '午', element: 'fire',  yinYang: 'yang', animal: '말'     },
  { index: 7,  korean: '미', hanja: '未', element: 'earth', yinYang: 'yin',  animal: '양'     },
  { index: 8,  korean: '신', hanja: '申', element: 'metal', yinYang: 'yang', animal: '원숭이' },
  { index: 9,  korean: '유', hanja: '酉', element: 'metal', yinYang: 'yin',  animal: '닭'     },
  { index: 10, korean: '술', hanja: '戌', element: 'earth', yinYang: 'yang', animal: '개'     },
  { index: 11, korean: '해', hanja: '亥', element: 'water', yinYang: 'yin',  animal: '돼지'   },
];

// 지장간 (Hidden Stems in Earthly Branches)
// 각 지지 안에 숨어있는 천간들 [본기, 중기?, 여기?]
// 가중치: 본기 = 주 오행, 중기/여기 = 보조 오행
export const BRANCH_HIDDEN_STEMS: Record<string, { stem: string; weight: number }[]> = {
  '자': [{ stem: '계', weight: 1.0 }],
  '축': [{ stem: '기', weight: 0.6 }, { stem: '계', weight: 0.2 }, { stem: '신', weight: 0.2 }],
  '인': [{ stem: '갑', weight: 0.6 }, { stem: '병', weight: 0.2 }, { stem: '무', weight: 0.2 }],
  '묘': [{ stem: '을', weight: 1.0 }],
  '진': [{ stem: '무', weight: 0.6 }, { stem: '을', weight: 0.2 }, { stem: '계', weight: 0.2 }],
  '사': [{ stem: '병', weight: 0.6 }, { stem: '무', weight: 0.2 }, { stem: '경', weight: 0.2 }],
  '오': [{ stem: '정', weight: 0.6 }, { stem: '기', weight: 0.4 }],
  '미': [{ stem: '기', weight: 0.6 }, { stem: '정', weight: 0.2 }, { stem: '을', weight: 0.2 }],
  '신': [{ stem: '경', weight: 0.6 }, { stem: '임', weight: 0.2 }, { stem: '무', weight: 0.2 }],
  '유': [{ stem: '신', weight: 1.0 }],
  '술': [{ stem: '무', weight: 0.6 }, { stem: '신', weight: 0.2 }, { stem: '정', weight: 0.2 }],
  '해': [{ stem: '임', weight: 0.6 }, { stem: '갑', weight: 0.4 }],
};

// 십성 매핑 테이블
// 일간의 오행 → 대상 오행 → 음양 동/이 → 십성
// [동음양, 이음양]
export const TEN_GODS_MAP: Record<FiveElement, Record<FiveElement, [TenGodName, TenGodName]>> = {
  // 일간 오행이 wood일 때
  wood: {
    wood:  ['비견', '겁재'],   // 같은 오행 = 비겁
    fire:  ['식신', '상관'],   // 내가 생 = 식상
    earth: ['편재', '정재'],   // 내가 극 = 재성
    metal: ['편관', '정관'],   // 나를 극 = 관성
    water: ['편인', '정인'],   // 나를 생 = 인성
  },
  fire: {
    fire:  ['비견', '겁재'],
    earth: ['식신', '상관'],
    metal: ['편재', '정재'],
    water: ['편관', '정관'],
    wood:  ['편인', '정인'],
  },
  earth: {
    earth: ['비견', '겁재'],
    metal: ['식신', '상관'],
    water: ['편재', '정재'],
    wood:  ['편관', '정관'],
    fire:  ['편인', '정인'],
  },
  metal: {
    metal: ['비견', '겁재'],
    water: ['식신', '상관'],
    wood:  ['편재', '정재'],
    fire:  ['편관', '정관'],
    earth: ['편인', '정인'],
  },
  water: {
    water: ['비견', '겁재'],
    wood:  ['식신', '상관'],
    fire:  ['편재', '정재'],
    earth: ['편관', '정관'],
    metal: ['편인', '정인'],
  },
};

// 오행별 색상 (hex) — Charts.ts, cardExport.ts 등에서 공유
export const ELEMENT_HEX: Record<FiveElement, string> = {
  wood:  '#44cc44',
  fire:  '#ff5544',
  earth: '#ccaa44',
  metal: '#dddddd',
  water: '#4488ff',
};

// 오행 한글/한자/영문
export const ELEMENT_NAMES: Record<FiveElement, { korean: string; hanja: string }> = {
  wood:  { korean: '목', hanja: '木' },
  fire:  { korean: '화', hanja: '火' },
  earth: { korean: '토', hanja: '土' },
  metal: { korean: '금', hanja: '金' },
  water: { korean: '수', hanja: '水' },
};

// 천간 한글 → index 매핑 (manseryeok 결과 파싱용)
export const STEM_KOREAN_TO_INDEX: Record<string, number> = {};
HEAVENLY_STEMS.forEach(s => { STEM_KOREAN_TO_INDEX[s.korean] = s.index; });

// 지지 한글 → index 매핑
export const BRANCH_KOREAN_TO_INDEX: Record<string, number> = {};
EARTHLY_BRANCHES.forEach(b => { BRANCH_KOREAN_TO_INDEX[b.korean] = b.index; });

// 24절기 (대운 계산에 필요한 절기 목록 - 절기만, 중기 제외)
// 절기: 입춘(1), 경칩(2), 청명(3), 입하(4), 망종(5), 소서(6),
//       입추(7), 백로(8), 한로(9), 입동(10), 대설(11), 소한(12)
export const JEOLGI_NAMES = [
  '소한', '입춘', '경칩', '청명', '입하', '망종',
  '소서', '입추', '백로', '한로', '입동', '대설',
] as const;
