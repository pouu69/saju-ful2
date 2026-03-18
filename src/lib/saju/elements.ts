import { Pillar, FiveElement, FiveElementBalance } from './types';
import { HEAVENLY_STEMS, BRANCH_HIDDEN_STEMS, STEM_KOREAN_TO_INDEX } from './constants';

/**
 * 사주 기둥들의 오행 균형을 계산한다.
 * 천간 직접 오행 + 지지 지장간 가중치 오행을 합산.
 */
export function calculateFiveElementBalance(pillars: Pillar[]): FiveElementBalance {
  const scores: Record<FiveElement, number> = {
    wood: 0, fire: 0, earth: 0, metal: 0, water: 0,
  };

  for (const pillar of pillars) {
    // 천간 오행 (가중치 1.0)
    scores[pillar.stem.element] += 1.0;

    // 지지 지장간 오행 (가중치별)
    const hiddenStems = BRANCH_HIDDEN_STEMS[pillar.branch.korean];
    if (hiddenStems) {
      for (const { stem, weight } of hiddenStems) {
        const stemIndex = STEM_KOREAN_TO_INDEX[stem];
        if (stemIndex !== undefined) {
          const element = HEAVENLY_STEMS[stemIndex].element;
          scores[element] += weight;
        }
      }
    }
  }

  // 부동소수점 오차 보정 (소수점 첫째 자리까지 반올림)
  for (const key of Object.keys(scores) as FiveElement[]) {
    scores[key] = Math.round(scores[key] * 10) / 10;
  }

  // 가장 강한/약한 오행 찾기
  const entries = Object.entries(scores) as [FiveElement, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const dominant = entries[0][0];
  const deficient = entries[entries.length - 1][0];

  return { ...scores, dominant, deficient };
}
