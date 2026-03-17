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
 * 모든 기둥의 천간에 대해 십성을 계산한다.
 * 일간(dayPillar.stem)은 자기 자신이므로 '일간'으로 표시.
 */
export function calculateTenGods(
  dayMaster: HeavenlyStem,
  yearPillar: Pillar,
  monthPillar: Pillar,
  dayPillar: Pillar,
  hourPillar: Pillar | null,
): TenGodEntry[] {
  const entries: TenGodEntry[] = [];

  // 연간
  entries.push({
    name: getTenGodRelation(dayMaster, yearPillar.stem),
    position: '연간',
    stem: yearPillar.stem,
  });

  // 월간
  entries.push({
    name: getTenGodRelation(dayMaster, monthPillar.stem),
    position: '월간',
    stem: monthPillar.stem,
  });

  // 시간
  if (hourPillar) {
    entries.push({
      name: getTenGodRelation(dayMaster, hourPillar.stem),
      position: '시간',
      stem: hourPillar.stem,
    });
  }

  // 지지의 지장간(본기)에 대해서도 십성 계산
  const branchPillars: { pillar: Pillar; posPrefix: string }[] = [
    { pillar: yearPillar, posPrefix: '연지' },
    { pillar: monthPillar, posPrefix: '월지' },
    { pillar: dayPillar, posPrefix: '일지' },
  ];
  if (hourPillar) {
    branchPillars.push({ pillar: hourPillar, posPrefix: '시지' });
  }

  for (const { pillar, posPrefix } of branchPillars) {
    const hiddenStems = BRANCH_HIDDEN_STEMS[pillar.branch.korean];
    if (hiddenStems && hiddenStems.length > 0) {
      // 본기(첫 번째)만 주요 십성으로 사용
      const mainStemIndex = STEM_KOREAN_TO_INDEX[hiddenStems[0].stem];
      if (mainStemIndex !== undefined) {
        const mainStem = HEAVENLY_STEMS[mainStemIndex];
        entries.push({
          name: getTenGodRelation(dayMaster, mainStem),
          position: posPrefix,
          stem: mainStem,
        });
      }
    }
  }

  return entries;
}
