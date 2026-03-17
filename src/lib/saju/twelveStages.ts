import { HeavenlyStem, Pillar, TwelveStage, TwelveStageEntry } from './types';

/**
 * 12운성 테이블
 * 일간(천간)별로 각 지지에서의 12운성 단계.
 * 인덱스: 지지 index (자=0, 축=1, ... 해=11)
 */
const TWELVE_STAGE_NAMES: TwelveStage[] = [
  '장생', '목욕', '관대', '건록', '제왕',
  '쇠', '병', '사', '묘', '절', '태', '양',
];

// 각 천간의 장생 위치 (지지 index)
// 양간: 갑(해11), 병(인2), 무(인2), 경(사5), 임(신8)
// 음간: 을(오6), 정(유9), 기(유9), 신(자0), 계(묘3)
const STAGE_START: Record<string, number> = {
  '갑': 11, // 해
  '을': 6,  // 오
  '병': 2,  // 인
  '정': 9,  // 유
  '무': 2,  // 인
  '기': 9,  // 유
  '경': 5,  // 사
  '신': 0,  // 자
  '임': 8,  // 신
  '계': 3,  // 묘
};

/**
 * 일간 기준으로 특정 지지의 12운성을 구한다.
 */
function getStage(dayMaster: HeavenlyStem, branchIndex: number): TwelveStage {
  const start = STAGE_START[dayMaster.korean];
  if (start === undefined) return '장생';

  const isYang = dayMaster.yinYang === 'yang';

  // 양간: 장생→순행, 음간: 장생→역행
  let offset: number;
  if (isYang) {
    offset = ((branchIndex - start) % 12 + 12) % 12;
  } else {
    offset = ((start - branchIndex) % 12 + 12) % 12;
  }

  return TWELVE_STAGE_NAMES[offset];
}

/**
 * 사주 기둥들의 12운성을 계산한다.
 */
export function calculateTwelveStages(
  dayMaster: HeavenlyStem,
  yearPillar: Pillar,
  monthPillar: Pillar,
  dayPillar: Pillar,
  hourPillar: Pillar | null,
): TwelveStageEntry[] {
  const entries: TwelveStageEntry[] = [
    { position: '연지', stage: getStage(dayMaster, yearPillar.branch.index) },
    { position: '월지', stage: getStage(dayMaster, monthPillar.branch.index) },
    { position: '일지', stage: getStage(dayMaster, dayPillar.branch.index) },
  ];

  if (hourPillar) {
    entries.push({ position: '시지', stage: getStage(dayMaster, hourPillar.branch.index) });
  }

  return entries;
}
