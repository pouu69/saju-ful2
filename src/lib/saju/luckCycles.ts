import { calculateSaju } from '@fullstackfamily/manseryeok';
import { Gender, Pillar, LuckCycle, YearlyLuck } from './types';
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from './constants';
import { parseGanji } from './calculator';

/**
 * 절기 근사 날짜 (월, 일)
 * 절기는 매년 ±1일 차이이므로 근사치 사용.
 * 대운 시작 나이 계산에는 이 정도 정밀도면 충분.
 */
const JEOLGI_APPROX: { name: string; month: number; day: number }[] = [
  { name: '소한', month: 1, day: 6 },
  { name: '입춘', month: 2, day: 4 },
  { name: '경칩', month: 3, day: 6 },
  { name: '청명', month: 4, day: 5 },
  { name: '입하', month: 5, day: 6 },
  { name: '망종', month: 6, day: 6 },
  { name: '소서', month: 7, day: 7 },
  { name: '입추', month: 8, day: 7 },
  { name: '백로', month: 9, day: 8 },
  { name: '한로', month: 10, day: 8 },
  { name: '입동', month: 11, day: 7 },
  { name: '대설', month: 12, day: 7 },
];

/**
 * 대운 계산.
 *
 * 순행/역행 결정:
 * - 남자 양년생 또는 여자 음년생 → 순행
 * - 남자 음년생 또는 여자 양년생 → 역행
 *
 * 대운 시작 나이:
 * - 생일에서 다음/이전 절기까지의 일수 ÷ 3
 *
 * 대운 간지:
 * - 월주에서 순행이면 다음 간지, 역행이면 이전 간지
 */
export function calculateLuckCycles(
  gender: Gender,
  yearPillar: Pillar,
  monthPillar: Pillar,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
): LuckCycle[] {
  // 순행/역행 결정
  const isYangYear = yearPillar.stem.yinYang === 'yang';
  const isMale = gender === 'male';
  const isForward = (isMale && isYangYear) || (!isMale && !isYangYear);

  // 생일 기준 다음/이전 절기까지의 일수 계산
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  let daysDiff = 30; // 기본값

  if (isForward) {
    // 순행: 생일 이후 가장 가까운 절기
    const nextJeolgi = JEOLGI_APPROX.find(j => {
      const jDate = new Date(birthYear, j.month - 1, j.day);
      return jDate > birthDate;
    });
    if (nextJeolgi) {
      const jDate = new Date(birthYear, nextJeolgi.month - 1, nextJeolgi.day);
      daysDiff = Math.ceil((jDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      // 대설(12/7) 이후 생: 다음 해 소한으로 계산
      const nextYearJeolgi = JEOLGI_APPROX[0]; // 소한
      const jDate = new Date(birthYear + 1, nextYearJeolgi.month - 1, nextYearJeolgi.day);
      daysDiff = Math.ceil((jDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  } else {
    // 역행: 생일 이전 가장 가까운 절기
    const prevJeolgis = JEOLGI_APPROX.filter(j => {
      const jDate = new Date(birthYear, j.month - 1, j.day);
      return jDate < birthDate;
    });
    if (prevJeolgis.length > 0) {
      const lastJeolgi = prevJeolgis[prevJeolgis.length - 1];
      const jDate = new Date(birthYear, lastJeolgi.month - 1, lastJeolgi.day);
      daysDiff = Math.ceil((birthDate.getTime() - jDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      // 소한(1/6) 이전 생: 전년 대설로 계산
      const prevYearJeolgi = JEOLGI_APPROX[JEOLGI_APPROX.length - 1]; // 대설
      const jDate = new Date(birthYear - 1, prevYearJeolgi.month - 1, prevYearJeolgi.day);
      daysDiff = Math.ceil((birthDate.getTime() - jDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  // 대운 시작 나이 = 일수 ÷ 3 (반올림)
  const startAge = Math.max(1, Math.round(daysDiff / 3));

  // 월주에서 순행/역행으로 대운 간지 생성 (8개)
  const monthStemIdx = monthPillar.stem.index;
  const monthBranchIdx = monthPillar.branch.index;

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
  const sajuRaw = calculateSaju(year, 6, 15);
  const pillar = parseGanji(sajuRaw.yearPillar, sajuRaw.yearPillarHanja);
  return { year, pillar };
}
