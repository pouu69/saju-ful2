import { Pillar, Sinsal, Gongmang } from './types';

/**
 * 신살(神殺) 계산
 *
 * 일지(일주 지지) 기준으로 사주 내 다른 지지에서 신살을 찾는다.
 */

// 도화살 (桃花殺) - 인연/이성 관련
// 일지 기준: 인오술→묘, 사유축→오, 신자진→유, 해묘미→자
const DOHWA: Record<string, string> = {
  '인': '묘', '오': '묘', '술': '묘',
  '사': '오', '유': '오', '축': '오',
  '신': '유', '자': '유', '진': '유',
  '해': '자', '묘': '자', '미': '자',
};

// 역마살 (驛馬殺) - 이동/변화 관련
// 일지 기준: 인오술→신, 사유축→해, 신자진→인, 해묘미→사
const YEOKMA: Record<string, string> = {
  '인': '신', '오': '신', '술': '신',
  '사': '해', '유': '해', '축': '해',
  '신': '인', '자': '인', '진': '인',
  '해': '사', '묘': '사', '미': '사',
};

// 화개살 (華蓋殺) - 예술/종교/고독 관련
// 일지 기준: 인오술→술, 사유축→축, 신자진→진, 해묘미→미
const HWAGAE: Record<string, string> = {
  '인': '술', '오': '술', '술': '술',
  '사': '축', '유': '축', '축': '축',
  '신': '진', '자': '진', '진': '진',
  '해': '미', '묘': '미', '미': '미',
};

// 귀문관살 (鬼門關殺) - 영적/초자연 감수성
// 일지 기준
const GWIMUN: Record<string, string> = {
  '자': '유', '축': '오', '인': '미', '묘': '신',
  '진': '사', '사': '진', '오': '축', '미': '인',
  '신': '묘', '유': '자', '술': '해', '해': '술',
};

// 백호살 (白虎殺) - 사고/수술/강인함
// 일지 기준
const BAEKHO: Record<string, string> = {
  '자': '오', '축': '미', '인': '신', '묘': '유',
  '진': '술', '사': '해', '오': '자', '미': '축',
  '신': '인', '유': '묘', '술': '진', '해': '사',
};

// 장성살 (將星殺) - 리더십/권위
// 일지 기준: 인오술→오, 사유축→유, 신자진→자, 해묘미→묘
const JANGSEONG: Record<string, string> = {
  '인': '오', '오': '오', '술': '오',
  '사': '유', '유': '유', '축': '유',
  '신': '자', '자': '자', '진': '자',
  '해': '묘', '묘': '묘', '미': '묘',
};

interface SinsalDef {
  name: string;
  table: Record<string, string>;
  description: string;
}

const SINSAL_DEFS: SinsalDef[] = [
  { name: '도화살', table: DOHWA, description: '이성에게 매력이 있으며, 인연이 풍부한 기운' },
  { name: '역마살', table: YEOKMA, description: '이동과 변화가 많으며, 활동적인 기운' },
  { name: '화개살', table: HWAGAE, description: '예술적 감각과 영적 감수성이 뛰어난 기운' },
  { name: '귀문관살', table: GWIMUN, description: '직감이 예리하고 신비로운 세계에 민감한 기운' },
  { name: '백호살', table: BAEKHO, description: '강인한 생명력과 결단력, 수술/사고에 주의' },
  { name: '장성살', table: JANGSEONG, description: '리더십과 권위를 타고난 기운' },
];

/**
 * 사주에서 신살을 찾는다.
 * 일지 기준으로 사주 내 다른 지지에 해당 신살이 있는지 확인.
 */
export function calculateSinsals(
  yearPillar: Pillar,
  monthPillar: Pillar,
  dayPillar: Pillar,
  hourPillar: Pillar | null,
): Sinsal[] {
  const dayBranch = dayPillar.branch.korean;
  const allBranches = [
    yearPillar.branch.korean,
    monthPillar.branch.korean,
    dayPillar.branch.korean,
  ];
  if (hourPillar) allBranches.push(hourPillar.branch.korean);

  const results: Sinsal[] = [];

  for (const def of SINSAL_DEFS) {
    const target = def.table[dayBranch];
    if (!target) continue;

    const matched = allBranches.filter(b => b === target);
    if (matched.length > 0) {
      results.push({
        name: def.name,
        description: def.description,
        branches: matched,
      });
    }
  }

  return results;
}

/**
 * 공망(空亡) 계산
 *
 * 일주의 간지로 해당 순(旬)을 찾고, 순 안에 포함되지 않는 2개의 지지가 공망.
 * 60갑자에서 10개씩 묶어 6순(旬):
 *   갑자순(甲子旬)~갑술순(甲戌旬), 각 순에서 빠지는 지지 2개.
 */
const GONGMANG_TABLE: { stemStart: number; branchStart: number; empty: [string, string] }[] = [
  { stemStart: 0, branchStart: 0, empty: ['술', '해'] },  // 갑자순
  { stemStart: 0, branchStart: 2, empty: ['신', '유'] },  // 갑인순
  { stemStart: 0, branchStart: 4, empty: ['오', '미'] },  // 갑진순
  { stemStart: 0, branchStart: 6, empty: ['진', '사'] },  // 갑오순
  { stemStart: 0, branchStart: 8, empty: ['인', '묘'] },  // 갑신순
  { stemStart: 0, branchStart: 10, empty: ['자', '축'] }, // 갑술순
];

export function calculateGongmang(
  dayPillar: Pillar,
  yearPillar: Pillar,
  monthPillar: Pillar,
  hourPillar: Pillar | null,
): Gongmang {
  const stemIdx = dayPillar.stem.index;
  const branchIdx = dayPillar.branch.index;

  // 일주가 속한 순(旬) 찾기: 천간 index를 빼서 순의 시작 지지를 구함
  const startBranch = ((branchIdx - stemIdx) % 12 + 12) % 12;

  // 어떤 순에 속하는지 찾기
  const xun = GONGMANG_TABLE.find(g => g.branchStart === startBranch);
  const emptyBranches = xun ? xun.empty : ['술', '해'];

  // 공망이 걸린 기둥 찾기
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
