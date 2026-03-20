import { Pillar, Sinsal, Gongmang, HeavenlyStem } from './types';

// ============================================================
// 1. 일지(日支) 기준 신살
// ============================================================

// 도화살 (桃花殺) - 이성 매력, 인연
const DOHWA: Record<string, string> = {
  '인': '묘', '오': '묘', '술': '묘',
  '사': '오', '유': '오', '축': '오',
  '신': '유', '자': '유', '진': '유',
  '해': '자', '묘': '자', '미': '자',
};

// 역마살 (驛馬殺) - 이동, 변화, 활동
const YEOKMA: Record<string, string> = {
  '인': '신', '오': '신', '술': '신',
  '사': '해', '유': '해', '축': '해',
  '신': '인', '자': '인', '진': '인',
  '해': '사', '묘': '사', '미': '사',
};

// 화개살 (華蓋殺) - 예술, 종교, 고독, 학문
const HWAGAE: Record<string, string> = {
  '인': '술', '오': '술', '술': '술',
  '사': '축', '유': '축', '축': '축',
  '신': '진', '자': '진', '진': '진',
  '해': '미', '묘': '미', '미': '미',
};

// 장성살 (將星殺) - 리더십, 권위, 통솔
const JANGSEONG: Record<string, string> = {
  '인': '오', '오': '오', '술': '오',
  '사': '유', '유': '유', '축': '유',
  '신': '자', '자': '자', '진': '자',
  '해': '묘', '묘': '묘', '미': '묘',
};

// 겁살 (劫殺) - 재물 손실 주의, 과감함
const GEOBSAL: Record<string, string> = {
  '인': '해', '오': '해', '술': '해',
  '사': '인', '유': '인', '축': '인',
  '신': '사', '자': '사', '진': '사',
  '해': '신', '묘': '신', '미': '신',
};

// 재살 (災殺) - 재난 주의, 극복 의지
const JAESAL: Record<string, string> = {
  '인': '자', '오': '자', '술': '자',
  '사': '묘', '유': '묘', '축': '묘',
  '신': '오', '자': '오', '진': '오',
  '해': '유', '묘': '유', '미': '유',
};

// 천살 (天殺) - 하늘의 재앙, 불가항력
const CHUNSAL: Record<string, string> = {
  '인': '축', '오': '축', '술': '축',
  '사': '진', '유': '진', '축': '진',
  '신': '미', '자': '미', '진': '미',
  '해': '술', '묘': '술', '미': '술',
};

// 지살 (地殺) - 땅의 재앙, 주거/부동산 주의
const JISAL: Record<string, string> = {
  '인': '인', '오': '인', '술': '인',
  '사': '사', '유': '사', '축': '사',
  '신': '신', '자': '신', '진': '신',
  '해': '해', '묘': '해', '미': '해',
};

// 년살 (年殺) / 반안살 - 정체, 답답함
const NYEONSAL: Record<string, string> = {
  '인': '유', '오': '유', '술': '유',
  '사': '오', '유': '오', '축': '오',
  '신': '묘', '자': '묘', '진': '묘',
  '해': '자', '묘': '자', '미': '자',
};

// 월살 (月殺) / 고초살 - 고생, 인내
const WOLSAL: Record<string, string> = {
  '인': '사', '오': '사', '술': '사',
  '사': '신', '유': '신', '축': '신',
  '신': '해', '자': '해', '진': '해',
  '해': '인', '묘': '인', '미': '인',
};

// ============================================================
// 2. 일간(日干) 기준 귀인 (貴人)
// ============================================================

// 천을귀인 (天乙貴人) - 가장 좋은 귀인, 위기에 도움
const CHUNEUL_GUIIN: Record<string, string[]> = {
  '갑': ['축', '미'], '을': ['자', '신'], '병': ['해', '유'],
  '정': ['해', '유'], '무': ['축', '미'], '기': ['자', '신'],
  '경': ['축', '미'], '신': ['인', '오'], '임': ['묘', '사'],
  '계': ['묘', '사'],
};

// 문창귀인 (文昌貴人) - 학문, 시험, 문서
const MUNCHANG_GUIIN: Record<string, string> = {
  '갑': '사', '을': '오', '병': '신', '정': '유', '무': '신',
  '기': '유', '경': '해', '신': '자', '임': '인', '계': '묘',
};

// 학당귀인 (學堂貴人) - 학업, 지식
const HAKDANG_GUIIN: Record<string, string> = {
  '갑': '해', '을': '자', '병': '인', '정': '묘', '무': '인',
  '기': '묘', '경': '사', '신': '오', '임': '신', '계': '유',
};

// 천덕귀인 (天德貴人) - 하늘의 덕, 재난 면함
// 월지 기준
const CHUNDUK_GUIIN: Record<string, string> = {
  '인': '정', '묘': '신', '진': '임', '사': '신',
  '오': '갑', '미': '계', '신': '임', '유': '병',
  '술': '갑', '해': '을', '자': '경', '축': '기',
};

// 월덕귀인 (月德貴人) - 달의 덕, 자비, 봉사
// 월지 기준
const WOLDUK_GUIIN: Record<string, string> = {
  '인': '병', '묘': '갑', '진': '임', '사': '경',
  '오': '병', '미': '갑', '신': '임', '유': '경',
  '술': '병', '해': '갑', '자': '임', '축': '경',
};

// 금여록 (金輿祿) - 배우자복, 귀한 인연
const GEUMYEO: Record<string, string> = {
  '갑': '진', '을': '사', '병': '미', '정': '신', '무': '미',
  '기': '신', '경': '술', '신': '해', '임': '축', '계': '인',
};

// ============================================================
// 3. 지지 간 관계 (충/형/원진)
// ============================================================

// 육충 (六沖) - 정면 충돌
const CHUNG_PAIRS: [string, string][] = [
  ['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해'],
];

// 형 (刑) - 형벌, 갈등
const HYUNG_GROUPS: { branches: string[]; name: string }[] = [
  { branches: ['인', '사', '신'], name: '무은지형(無恩之刑)' },
  { branches: ['축', '술', '미'], name: '무례지형(無禮之刑)' },
  { branches: ['자', '묘'], name: '무례지형(無禮之刑)' },
  { branches: ['진', '진'], name: '자형(自刑)' },
  { branches: ['오', '오'], name: '자형(自刑)' },
  { branches: ['유', '유'], name: '자형(自刑)' },
  { branches: ['해', '해'], name: '자형(自刑)' },
];

// 원진살 (怨嗔殺) - 원한, 미움
const WONJIN_PAIRS: [string, string][] = [
  ['자', '미'], ['축', '오'], ['인', '유'], ['묘', '신'], ['진', '해'], ['사', '술'],
];

// 귀문관살 (鬼門關殺) - 영적 감수성
const GWIMUN: Record<string, string> = {
  '자': '유', '축': '오', '인': '미', '묘': '신',
  '진': '사', '사': '진', '오': '축', '미': '인',
  '신': '묘', '유': '자', '술': '해', '해': '술',
};

// 백호살 (白虎殺) - 사고, 수술, 강인함
const BAEKHO: Record<string, string> = {
  '자': '오', '축': '미', '인': '신', '묘': '유',
  '진': '술', '사': '해', '오': '자', '미': '축',
  '신': '인', '유': '묘', '술': '진', '해': '사',
};

// ============================================================
// 메인 계산 함수
// ============================================================

interface SinsalTableDef {
  name: string;
  table: Record<string, string>;
  description: string;
  basis: string; // 기준: '일지', '연지'
}

const TABLE_SINSALS: SinsalTableDef[] = [
  // 일지 기준
  { name: '도화살(桃花)', table: DOHWA, description: '이성 매력, 인연 풍부', basis: '일지' },
  { name: '역마살(驛馬)', table: YEOKMA, description: '이동, 변화, 해외 인연', basis: '일지' },
  { name: '화개살(華蓋)', table: HWAGAE, description: '예술, 종교, 학문적 고독', basis: '일지' },
  { name: '장성살(將星)', table: JANGSEONG, description: '리더십, 권위, 통솔력', basis: '일지' },
  { name: '겁살(劫殺)', table: GEOBSAL, description: '과감함, 재물 손실 주의', basis: '일지' },
  { name: '재살(災殺)', table: JAESAL, description: '재난 주의, 극복 의지', basis: '일지' },
  { name: '천살(天殺)', table: CHUNSAL, description: '불가항력적 시련', basis: '일지' },
  { name: '지살(地殺)', table: JISAL, description: '주거/부동산 관련 주의', basis: '일지' },
  { name: '년살(年殺)', table: NYEONSAL, description: '정체, 답답함, 인내 필요', basis: '일지' },
  { name: '월살(月殺)', table: WOLSAL, description: '고생, 인내, 성장통', basis: '일지' },
  { name: '귀문관살(鬼門關)', table: GWIMUN, description: '영적 감수성, 직감 예리', basis: '일지' },
  { name: '백호살(白虎)', table: BAEKHO, description: '강인한 생명력, 사고/수술 주의', basis: '일지' },
];

export function calculateSinsals(
  yearPillar: Pillar,
  monthPillar: Pillar,
  dayPillar: Pillar,
  hourPillar: Pillar | null,
): Sinsal[] {
  const dayBranch = dayPillar.branch.korean;
  const dayStem = dayPillar.stem;
  const monthBranch = monthPillar.branch.korean;

  const allBranches = [
    yearPillar.branch.korean,
    monthPillar.branch.korean,
    dayPillar.branch.korean,
  ];
  if (hourPillar) allBranches.push(hourPillar.branch.korean);

  const allStems = [
    yearPillar.stem.korean,
    monthPillar.stem.korean,
    dayPillar.stem.korean,
  ];
  if (hourPillar) allStems.push(hourPillar.stem.korean);

  const results: Sinsal[] = [];

  // ── 1. 테이블 기반 신살 (일지 기준) ──
  for (const def of TABLE_SINSALS) {
    const basisBranch = def.basis === '연지' ? yearPillar.branch.korean : dayBranch;
    const target = def.table[basisBranch];
    if (!target) continue;

    const matched = allBranches.filter(b => b === target);
    if (matched.length > 0) {
      results.push({ name: def.name, description: def.description, branches: matched });
    }
  }

  // ── 2. 일간 기준 귀인 ──

  // 천을귀인
  const chuneulTargets = CHUNEUL_GUIIN[dayStem.korean] || [];
  const chuneulMatched = allBranches.filter(b => chuneulTargets.includes(b));
  if (chuneulMatched.length > 0) {
    results.push({ name: '천을귀인(天乙)', description: '위기를 넘기는 귀한 도움, 귀인 복', branches: chuneulMatched });
  }

  // 문창귀인
  const munchangTarget = MUNCHANG_GUIIN[dayStem.korean];
  if (munchangTarget && allBranches.includes(munchangTarget)) {
    results.push({ name: '문창귀인(文昌)', description: '학문, 시험, 문서에 능함', branches: [munchangTarget] });
  }

  // 학당귀인
  const hakdangTarget = HAKDANG_GUIIN[dayStem.korean];
  if (hakdangTarget && allBranches.includes(hakdangTarget)) {
    results.push({ name: '학당귀인(學堂)', description: '학업 성취, 지식 탐구에 유리', branches: [hakdangTarget] });
  }

  // 금여록
  const geumyeoTarget = GEUMYEO[dayStem.korean];
  if (geumyeoTarget && allBranches.includes(geumyeoTarget)) {
    results.push({ name: '금여록(金輿)', description: '배우자복, 귀한 인연', branches: [geumyeoTarget] });
  }

  // 천덕귀인 (월지 기준 → 사주 내 천간에 있는지)
  const chundukTarget = CHUNDUK_GUIIN[monthBranch];
  if (chundukTarget && allStems.includes(chundukTarget)) {
    results.push({ name: '천덕귀인(天德)', description: '하늘의 덕으로 재난을 면함', branches: [] });
  }

  // 월덕귀인 (월지 기준 → 사주 내 천간에 있는지)
  const woldukTarget = WOLDUK_GUIIN[monthBranch];
  if (woldukTarget && allStems.includes(woldukTarget)) {
    results.push({ name: '월덕귀인(月德)', description: '달의 덕, 자비와 봉사의 기운', branches: [] });
  }

  // ── 3. 지지 간 관계 ──

  // 충 (六沖)
  for (const [a, b] of CHUNG_PAIRS) {
    if (allBranches.includes(a) && allBranches.includes(b)) {
      results.push({ name: `충(沖): ${a}-${b}`, description: `${a}와 ${b}가 정면 충돌, 변화와 갈등`, branches: [a, b] });
    }
  }

  // 형 (刑)
  for (const group of HYUNG_GROUPS) {
    const present = group.branches.filter(b => allBranches.includes(b));
    if (group.branches.length <= 2) {
      // 자형 또는 2개짜리: 사주 내에 2개 이상 있어야
      const count = allBranches.filter(b => b === group.branches[0]).length;
      if (count >= 2 || (group.branches.length === 2 && present.length === 2)) {
        results.push({ name: `형(刑): ${group.name}`, description: '갈등, 시련을 통한 성장', branches: present });
      }
    } else {
      // 3개짜리: 2개 이상 있으면 형 성립
      if (present.length >= 2) {
        results.push({ name: `형(刑): ${group.name}`, description: '갈등, 시련을 통한 성장', branches: present });
      }
    }
  }

  // 원진살
  for (const [a, b] of WONJIN_PAIRS) {
    if (allBranches.includes(a) && allBranches.includes(b)) {
      results.push({ name: `원진살(怨嗔): ${a}-${b}`, description: '감정적 갈등, 인간관계 마찰', branches: [a, b] });
    }
  }

  return results;
}

// ============================================================
// 공망 (空亡)
// ============================================================

const GONGMANG_TABLE: { branchStart: number; empty: [string, string] }[] = [
  { branchStart: 0, empty: ['술', '해'] },  // 갑자순
  { branchStart: 2, empty: ['신', '유'] },   // 갑인순
  { branchStart: 4, empty: ['오', '미'] },   // 갑진순
  { branchStart: 6, empty: ['진', '사'] },   // 갑오순
  { branchStart: 8, empty: ['인', '묘'] },   // 갑신순
  { branchStart: 10, empty: ['자', '축'] },  // 갑술순
];

export function calculateGongmang(
  dayPillar: Pillar,
  yearPillar: Pillar,
  monthPillar: Pillar,
  hourPillar: Pillar | null,
): Gongmang {
  const stemIdx = dayPillar.stem.index;
  const branchIdx = dayPillar.branch.index;

  const startBranch = ((branchIdx - stemIdx) % 12 + 12) % 12;
  const xun = GONGMANG_TABLE.find(g => g.branchStart === startBranch);
  const emptyBranches = xun ? xun.empty : ['술', '해'];

  const affected: string[] = [];
  const pillars = [
    { name: '연주', pillar: yearPillar },
    { name: '월주', pillar: monthPillar },
  ];
  if (hourPillar) pillars.push({ name: '시주', pillar: hourPillar });

  for (const { name, pillar } of pillars) {
    if (emptyBranches.includes(pillar.branch.korean)) {
      affected.push(name);
    }
  }

  return { branches: emptyBranches, affectedPillars: affected };
}
