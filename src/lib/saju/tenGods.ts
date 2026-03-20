import { HeavenlyStem, Pillar, TenGodEntry, TenGodName } from './types';
import { TEN_GODS_MAP, BRANCH_HIDDEN_STEMS, HEAVENLY_STEMS, STEM_KOREAN_TO_INDEX } from './constants';

/**
 * 일간(dayMaster)과 대상 천간의 십성 관계를 구한다.
 * 같은 음양이면 [0] (편), 다른 음양이면 [1] (정)
 */
function getTenGodRelation(dayMaster: HeavenlyStem, target: HeavenlyStem): TenGodName {
  const pair = TEN_GODS_MAP[dayMaster.element][target.element];
  const sameYinYang = dayMaster.yinYang === target.yinYang;
  return sameYinYang ? pair[0] : pair[1];
}

/**
 * 모든 기둥의 천간 + 지지 본기에 대해 십성을 계산한다.
 * 일간(dayPillar.stem)은 자기 자신이므로 제외.
 * 천간 weight=1.0, 지지 본기 weight=본기 가중치(보통 0.6~1.0).
 */
export function calculateTenGods(
  dayMaster: HeavenlyStem,
  yearPillar: Pillar,
  monthPillar: Pillar,
  dayPillar: Pillar,
  hourPillar: Pillar | null,
): TenGodEntry[] {
  const entries: TenGodEntry[] = [];

  // 천간 (weight=1.0): 연간, 월간, 시간
  const stemPillars: { pillar: Pillar; position: string }[] = [
    { pillar: yearPillar, position: '연간' },
    { pillar: monthPillar, position: '월간' },
  ];
  if (hourPillar) {
    stemPillars.push({ pillar: hourPillar, position: '시간' });
  }

  for (const { pillar, position } of stemPillars) {
    entries.push({
      name: getTenGodRelation(dayMaster, pillar.stem),
      position,
      stem: pillar.stem,
      weight: 1.0,
    });
  }

  // 지지 본기 (첫 번째 지장간만 사용 — 표준 방식)
  const branchPillars: { pillar: Pillar; position: string }[] = [
    { pillar: yearPillar, position: '연지' },
    { pillar: monthPillar, position: '월지' },
    { pillar: dayPillar, position: '일지' },
  ];
  if (hourPillar) {
    branchPillars.push({ pillar: hourPillar, position: '시지' });
  }

  for (const { pillar, position } of branchPillars) {
    const hiddenStems = BRANCH_HIDDEN_STEMS[pillar.branch.korean];
    if (!hiddenStems || hiddenStems.length === 0) continue;

    const mainHidden = hiddenStems[0];
    const stemIndex = STEM_KOREAN_TO_INDEX[mainHidden.stem];
    if (stemIndex === undefined) continue;

    const stem = HEAVENLY_STEMS[stemIndex];
    entries.push({
      name: getTenGodRelation(dayMaster, stem),
      position,
      stem,
      weight: mainHidden.weight,
    });
  }

  return entries;
}
