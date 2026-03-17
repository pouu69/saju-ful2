import { SajuResult, TenGodEntry, LuckCycle } from './types';

/**
 * 십성 빈도 카운트 후 빈도 내림차순 정렬
 */
export function countTenGods(tenGods: TenGodEntry[]): [string, number][] {
  const counts: Record<string, number> = {};
  for (const g of tenGods) {
    counts[g.name] = (counts[g.name] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

/**
 * 현재 나이와 현재 대운 주기를 구한다.
 */
export function getCurrentLuckInfo(saju: SajuResult): { currentAge: number; currentCycle: LuckCycle | undefined } {
  const currentAge = new Date().getFullYear() - saju.birthInfo.year;
  const currentCycle = saju.luckCycles.find(c => currentAge >= c.startAge && currentAge <= c.endAge);
  return { currentAge, currentCycle };
}
