import { SajuResult, FiveElement } from '@/lib/saju/types';
import { ELEMENT_NAMES } from '@/lib/saju/constants';

/** 색상 포함 라인 */
export interface ChartLine {
  text: string;
  color?: string;
}

/** 오행별 색상 */
const ELEMENT_COLORS: Record<FiveElement, string> = {
  wood:  'text-[#44cc44]', // 초록
  fire:  'text-[#ff5544]', // 빨강
  earth: 'text-[#ccaa44]', // 노랑
  metal: 'text-[#dddddd]', // 흰색
  water: 'text-[#4488ff]', // 파랑
};

/**
 * 오행 균형 바 차트 (오행의 방) — 각 행에 오행 색상 적용
 */
export function generateElementChart(saju: SajuResult): ChartLine[] {
  const fe = saju.fiveElements;
  const elements: FiveElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];
  const max = Math.max(...elements.map(e => fe[e] as number), 1);

  const lines: ChartLine[] = [
    { text: '' },
    { text: '  ╔═══════════════════════════════════════╗', color: 'text-yellow-300' },
    { text: '  ║          오 행 균 형 도              ║', color: 'text-yellow-300' },
    { text: '  ╚═══════════════════════════════════════╝', color: 'text-yellow-300' },
    { text: '' },
  ];

  for (const el of elements) {
    const score = fe[el] as number;
    const barLen = Math.round((score / max) * 20);
    const bar = '█'.repeat(barLen) + '░'.repeat(20 - barLen);
    const name = ELEMENT_NAMES[el];
    const marker = el === fe.dominant ? ' ◀ 강' : el === fe.deficient ? ' ◀ 약' : '';
    lines.push({
      text: `  ${name.korean}(${name.hanja}) │${bar}│ ${score.toFixed(1)}${marker}`,
      color: ELEMENT_COLORS[el],
    });
  }

  lines.push({ text: '' });
  return lines;
}

/**
 * 십성 분포 다이어그램 (십성의 방)
 */
export function generateTenGodsChart(saju: SajuResult): ChartLine[] {
  const gods = saju.tenGods;

  // 십성 카운트
  const counts: Record<string, number> = {};
  for (const g of gods) {
    counts[g.name] = (counts[g.name] || 0) + 1;
  }

  // 십성 그룹
  const groups = [
    { label: '비겁(자아)', gods: ['비견', '겁재'] },
    { label: '식상(표현)', gods: ['식신', '상관'] },
    { label: '재성(재물)', gods: ['편재', '정재'] },
    { label: '관성(명예)', gods: ['편관', '정관'] },
    { label: '인성(학문)', gods: ['편인', '정인'] },
  ];

  const lines: ChartLine[] = [
    { text: '' },
    { text: '  ╔═══════════════════════════════════════╗', color: 'text-yellow-300' },
    { text: '  ║          십 성 분 포 도              ║', color: 'text-yellow-300' },
    { text: '  ╚═══════════════════════════════════════╝', color: 'text-yellow-300' },
    { text: '' },
  ];

  for (const group of groups) {
    const total = group.gods.reduce((sum, g) => sum + (counts[g] || 0), 0);
    const dots = '●'.repeat(total) + '○'.repeat(Math.max(0, 4 - total));
    const detail = group.gods.map(g => {
      const c = counts[g] || 0;
      return c > 0 ? g : '';
    }).filter(Boolean).join(', ');

    lines.push({ text: `  ${padKr(group.label, 12)} ${dots}  ${detail || '-'}` });
  }

  lines.push({ text: '' });
  lines.push({ text: '  ── 기둥별 십성 배치 ──', color: 'text-[#00aaaa]' });
  lines.push({ text: '' });

  const positions = ['연간', '월간', '시간'];
  const branchPositions = ['연지', '월지', '일지', '시지'];

  const stemLine = positions.map(p => {
    const g = gods.find(x => x.position === p);
    return g ? padKr(g.name, 6) : padKr('--', 6);
  });
  lines.push({ text: `  천간:  ${stemLine.join('  ')}` });

  const branchLine = branchPositions.map(p => {
    const g = gods.find(x => x.position === p);
    return g ? padKr(g.name, 6) : padKr('--', 6);
  });
  lines.push({ text: `  지지:  ${branchLine.join('  ')}` });

  lines.push({ text: '' });
  return lines;
}

/**
 * 대운 타임라인 (운세의 방)
 */
export function generateLuckTimeline(saju: SajuResult): ChartLine[] {
  const cycles = saju.luckCycles;
  const currentAge = new Date().getFullYear() - saju.birthInfo.year;
  const yl = saju.yearlyLuck;

  const lines: ChartLine[] = [
    { text: '' },
    { text: '  ╔═══════════════════════════════════════╗', color: 'text-yellow-300' },
    { text: '  ║          대 운 흐 름 도              ║', color: 'text-yellow-300' },
    { text: '  ╚═══════════════════════════════════════╝', color: 'text-yellow-300' },
    { text: '' },
  ];

  for (const c of cycles) {
    const isCurrent = currentAge >= c.startAge && currentAge <= c.endAge;
    const elName = ELEMENT_NAMES[c.pillar.stem.element];
    const elColor = ELEMENT_COLORS[c.pillar.stem.element];
    const pointer = isCurrent ? '▶' : ' ';
    const bracket = isCurrent ? ['【', '】'] : ['  ', '  '];
    const age = `${c.startAge}-${c.endAge}세`;

    lines.push({
      text: `  ${pointer} ${bracket[0]}${padKr(age, 8)} ${c.pillar.ganjiKorean}(${c.pillar.ganjiHanja}) · ${elName.korean}${bracket[1]}`,
      color: isCurrent ? 'text-[#ffffff]' : elColor,
    });

    if (isCurrent) {
      const progress = Math.min(100, Math.round(((currentAge - c.startAge) / 10) * 100));
      const filled = Math.round(progress / 5);
      const bar = '▓'.repeat(filled) + '░'.repeat(20 - filled);
      lines.push({ text: `         ${bar} ${progress}% 진행`, color: 'text-[#00ff41]' });
    }
  }

  lines.push({ text: '' });
  lines.push({ text: `  ── 올해 세운 (${yl.year}년) ──`, color: 'text-[#00aaaa]' });
  const ylEl = ELEMENT_NAMES[yl.pillar.stem.element];
  lines.push({
    text: `  ${yl.pillar.ganjiKorean}(${yl.pillar.ganjiHanja}) · ${ylEl.korean}(${ylEl.hanja})의 해`,
    color: ELEMENT_COLORS[yl.pillar.stem.element],
  });
  lines.push({ text: '' });

  return lines;
}

/**
 * 종합 풀이 요약 카드 (종합 풀이 방)
 */
export function generateSynthesisCard(saju: SajuResult): ChartLine[] {
  const dm = saju.dayMaster;
  const dmEl = ELEMENT_NAMES[dm.element];
  const fe = saju.fiveElements;
  const domEl = ELEMENT_NAMES[fe.dominant];
  const defEl = ELEMENT_NAMES[fe.deficient];

  const godCounts: Record<string, number> = {};
  for (const g of saju.tenGods) {
    godCounts[g.name] = (godCounts[g.name] || 0) + 1;
  }
  const topGod = Object.entries(godCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  const currentAge = new Date().getFullYear() - saju.birthInfo.year;
  const currentCycle = saju.luckCycles.find(c => currentAge >= c.startAge && currentAge <= c.endAge);

  const lines: ChartLine[] = [
    { text: '' },
    { text: '  ╔═══════════════════════════════════════╗', color: 'text-yellow-300' },
    { text: `  ║   ${saju.birthInfo.name}의 사주 요약`, color: 'text-yellow-300' },
    { text: '  ╚═══════════════════════════════════════╝', color: 'text-yellow-300' },
    { text: '' },
    { text: `  일간      ${dm.korean}${dmEl.hanja}(${dm.yinYang === 'yang' ? '양' : '음'}) · ${saju.dayPillar.branch.animal}띠`, color: ELEMENT_COLORS[dm.element] },
    { text: `  강한 오행  ${domEl.korean}(${domEl.hanja})`, color: ELEMENT_COLORS[fe.dominant] },
    { text: `  약한 오행  ${defEl.korean}(${defEl.hanja})`, color: ELEMENT_COLORS[fe.deficient] },
    { text: `  주요 십성  ${topGod}` },
  ];

  if (currentCycle) {
    const clEl = ELEMENT_NAMES[currentCycle.pillar.stem.element];
    lines.push({
      text: `  현재 대운  ${currentCycle.pillar.ganjiKorean}(${currentCycle.startAge}-${currentCycle.endAge}세) · ${clEl.korean}`,
      color: ELEMENT_COLORS[currentCycle.pillar.stem.element],
    });
  }

  if (saju.sinsals.length > 0) {
    lines.push({ text: '' });
    lines.push({ text: '  ── 신살 ──', color: 'text-[#00aaaa]' });
    // 3개씩 줄 나눔
    const names = saju.sinsals.map(s => s.name);
    for (let i = 0; i < names.length; i += 3) {
      lines.push({ text: `  ${names.slice(i, i + 3).join('  ·  ')}` });
    }
  }

  lines.push({ text: '' });
  return lines;
}

/** 한글 포함 문자열 패딩 */
function padKr(str: string, width: number): string {
  let len = 0;
  for (const char of str) {
    const code = char.charCodeAt(0);
    if (
      (code >= 0xAC00 && code <= 0xD7AF) ||
      (code >= 0x4E00 && code <= 0x9FFF) ||
      (code >= 0x3400 && code <= 0x4DBF) ||
      (code >= 0xFF00 && code <= 0xFFEF)
    ) {
      len += 2;
    } else {
      len += 1;
    }
  }
  return str + ' '.repeat(Math.max(0, width - len));
}
