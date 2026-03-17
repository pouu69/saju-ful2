import { calculateSaju, getSolarTermsByYear } from '@fullstackfamily/manseryeok';
import { HEAVENLY_STEMS, EARTHLY_BRANCHES, STEM_KOREAN_TO_INDEX, BRANCH_KOREAN_TO_INDEX } from './constants';
import { Pillar, HeavenlyStem, EarthlyBranch, BirthInfo, SajuResult } from './types';
import { calculateFiveElementBalance } from './elements';
import { calculateTenGods } from './tenGods';
import { calculateLuckCycles, calculateYearlyLuck } from './luckCycles';

/**
 * manseryeok 결과의 간지 문자열(예: "경오")을 파싱하여 Pillar 객체로 변환
 */
export function parseGanji(ganjiKorean: string, ganjiHanja: string): Pillar {
  const stemKorean = ganjiKorean[0];
  const branchKorean = ganjiKorean[1];

  const stemIndex = STEM_KOREAN_TO_INDEX[stemKorean];
  const branchIndex = BRANCH_KOREAN_TO_INDEX[branchKorean];

  if (stemIndex === undefined || branchIndex === undefined) {
    throw new Error(`Invalid ganji: ${ganjiKorean}`);
  }

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
    ganjiKorean,
    ganjiHanja,
  };
}

/**
 * 사주팔자 전체 계산
 */
export function calculateFullSaju(birthInfo: BirthInfo): SajuResult {
  const { year, month, day, hour, minute, gender } = birthInfo;

  // 1. manseryeok으로 사주팔자 계산
  const hasHour = hour !== null;
  const sajuRaw = hasHour
    ? calculateSaju(year, month, day, hour, minute)
    : calculateSaju(year, month, day);

  // 2. 간지 문자열 → Pillar 객체 변환
  const yearPillar = parseGanji(sajuRaw.yearPillar, sajuRaw.yearPillarHanja);
  const monthPillar = parseGanji(sajuRaw.monthPillar, sajuRaw.monthPillarHanja);
  const dayPillar = parseGanji(sajuRaw.dayPillar, sajuRaw.dayPillarHanja);
  const hourPillar = (hasHour && sajuRaw.hourPillar && sajuRaw.hourPillarHanja)
    ? parseGanji(sajuRaw.hourPillar, sajuRaw.hourPillarHanja)
    : null;

  // 3. 일간 (Day Master)
  const dayMaster = dayPillar.stem;

  // 4. 오행 균형 분석
  const pillars = [yearPillar, monthPillar, dayPillar];
  if (hourPillar) pillars.push(hourPillar);
  const fiveElements = calculateFiveElementBalance(pillars);

  // 5. 십성 계산
  const tenGods = calculateTenGods(dayMaster, yearPillar, monthPillar, dayPillar, hourPillar);

  // 6. 대운 계산
  const solarTerms = getSolarTermsByYear(year);
  const luckCycles = calculateLuckCycles(
    gender, yearPillar, monthPillar, year, month, day, solarTerms
  );

  // 7. 세운 (올해)
  const yearlyLuck = calculateYearlyLuck(new Date().getFullYear());

  return {
    birthInfo,
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster,
    fiveElements,
    tenGods,
    luckCycles,
    yearlyLuck,
  };
}
