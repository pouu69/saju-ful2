import { calculateSaju, getSolarTermsByYear } from '@fullstackfamily/manseryeok';
import { Gender, Pillar, LuckCycle, YearlyLuck } from './types';
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from './constants';
import { parseGanji } from './calculator';

/**
 * 대운 계산.
 *
 * 순행/역행 결정:
 * - 남자 양년생(연주 천간 양) 또는 여자 음년생(연주 천간 음) → 순행
 * - 남자 음년생 또는 여자 양년생 → 역행
 *
 * 대운 시작 나이:
 * - 생일에서 다음/이전 절기까지의 일수 / 3 = 대운 시작 나이
 *
 * 대운 간지:
 * - 월주에서 순행이면 다음 간지, 역행이면 이전 간지 (60갑자 순환)
 */
export function calculateLuckCycles(
  gender: Gender,
  yearPillar: Pillar,
  monthPillar: Pillar,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  solarTerms: { name: string; month: number; day: number; hour: number; minute: number }[],
): LuckCycle[] {
  // 순행/역행 결정
  const isYangYear = yearPillar.stem.yinYang === 'yang';
  const isMale = gender === 'male';
  const isForward = (isMale && isYangYear) || (!isMale && !isYangYear);

  // 절기(절만, 중기 제외) 찾기 - 월주를 결정하는 절기들
  const jeolgiNames = new Set([
    '소한', '입춘', '경칩', '청명', '입하', '망종',
    '소서', '입추', '백로', '한로', '입동', '대설',
  ]);
  const jeolgis = solarTerms.filter(t => jeolgiNames.has(t.name));

  // 생일 기준 다음/이전 절기까지의 일수 계산
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  let daysDiff = 30; // 기본값 (절기를 못 찾을 경우)

  if (isForward) {
    // 순행: 생일 이후 가장 가까운 절기
    const nextJeolgi = jeolgis.find(j => {
      const jDate = new Date(birthYear, j.month - 1, j.day);
      return jDate > birthDate;
    });
    if (nextJeolgi) {
      const jDate = new Date(birthYear, nextJeolgi.month - 1, nextJeolgi.day);
      daysDiff = Math.ceil((jDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  } else {
    // 역행: 생일 이전 가장 가까운 절기
    const prevJeolgis = jeolgis.filter(j => {
      const jDate = new Date(birthYear, j.month - 1, j.day);
      return jDate < birthDate;
    });
    if (prevJeolgis.length > 0) {
      const lastJeolgi = prevJeolgis[prevJeolgis.length - 1];
      const jDate = new Date(birthYear, lastJeolgi.month - 1, lastJeolgi.day);
      daysDiff = Math.ceil((birthDate.getTime() - jDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  // 대운 시작 나이 = 일수 / 3 (반올림)
  const startAge = Math.round(daysDiff / 3);

  // 월주의 60갑자 인덱스 찾기
  const monthStemIdx = monthPillar.stem.index;
  const monthBranchIdx = monthPillar.branch.index;

  // 대운 간지 생성 (8개 대운)
  const cycles: LuckCycle[] = [];
  for (let i = 1; i <= 8; i++) {
    const direction = isForward ? i : -i;
    const stemIdx = ((monthStemIdx + direction) % 10 + 10) % 10;
    const branchIdx = ((monthBranchIdx + direction) % 12 + 12) % 12;

    const stem = HEAVENLY_STEMS[stemIdx];
    const branch = EARTHLY_BRANCHES[branchIdx];
    const pillar: Pillar = {
      stem,
      branch,
      ganjiKorean: stem.korean + branch.korean,
      ganjiHanja: stem.hanja + branch.hanja,
    };

    const cycleStartAge = startAge + (i - 1) * 10;
    cycles.push({
      startAge: cycleStartAge,
      endAge: cycleStartAge + 9,
      pillar,
    });
  }

  return cycles;
}

/**
 * 세운 계산 (특정 년도의 간지)
 */
export function calculateYearlyLuck(year: number): YearlyLuck {
  const sajuRaw = calculateSaju(year, 6, 15); // 해당 년도 중간 날짜로 연주 추출
  const pillar = parseGanji(sajuRaw.yearPillar, sajuRaw.yearPillarHanja);
  return { year, pillar };
}
