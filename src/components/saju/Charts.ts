import { SajuResult, FiveElement } from '@/lib/saju/types';
import { ELEMENT_NAMES } from '@/lib/saju/constants';

/**
 * 오행 균형 바 차트 (오행의 방)
 */
export function generateElementChart(saju: SajuResult): string[] {
  const fe = saju.fiveElements;
  const elements: FiveElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];
  const max = Math.max(...elements.map(e => fe[e] as number), 1);

  const lines: string[] = [
    '',
    '  ╔═══════════════════════════════════════╗',
    '  ║          오 행 균 형 도              ║',
    '  ╚═══════════════════════════════════════╝',
    '',
  ];

  for (const el of elements) {
    const score = fe[el] as number;
    const barLen = Math.round((score / max) * 20);
    const bar = '█'.repeat(barLen) + '░'.repeat(20 - barLen);
    const name = ELEMENT_NAMES[el];
    const marker = el === fe.dominant ? ' ◀ 강' : el === fe.deficient ? ' ◀ 약' : '';
    lines.push(`  ${name.korean}(${name.hanja}) │${bar}│ ${score.toFixed(1)}${marker}`);
  }

  lines.push('');
  return lines;
}

/**
 * 십성 분포 다이어그램 (십성의 방)
 */
export function generateTenGodsChart(saju: SajuResult): string[] {
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

  const lines: string[] = [
    '',
    '  ╔═══════════════════════════════════════╗',
    '  ║          십 성 분 포 도              ║',
    '  ╚═══════════════════════════════════════╝',
    '',
  ];

  for (const group of groups) {
    const total = group.gods.reduce((sum, g) => sum + (counts[g] || 0), 0);
    const dots = '●'.repeat(total) + '○'.repeat(Math.max(0, 4 - total));
    const detail = group.gods.map(g => {
      const c = counts[g] || 0;
      return c > 0 ? g : '';
    }).filter(Boolean).join(', ');

    lines.push(`  ${padKr(group.label, 12)} ${dots}  ${detail || '-'}`);
  }

  lines.push('');

  // 위치별 배치도
  lines.push('  ── 기둥별 십성 배치 ──');
  lines.push('');

  const positions = ['연간', '월간', '시간'];
  const branchPositions = ['연지', '월지', '일지', '시지'];

  const stemLine = positions.map(p => {
    const g = gods.find(x => x.position === p);
    return g ? padKr(g.name, 6) : padKr('--', 6);
  });
  lines.push(`  천간:  ${stemLine.join('  ')}`);

  const branchLine = branchPositions.map(p => {
    const g = gods.find(x => x.position === p);
    return g ? padKr(g.name, 6) : padKr('--', 6);
  });
  lines.push(`  지지:  ${branchLine.join('  ')}`);

  lines.push('');
  return lines;
}

/**
 * 대운 타임라인 (운세의 방)
 */
export function generateLuckTimeline(saju: SajuResult): string[] {
  const cycles = saju.luckCycles;
  const currentAge = new Date().getFullYear() - saju.birthInfo.year;
  const yl = saju.yearlyLuck;

  const lines: string[] = [
    '',
    '  ╔═══════════════════════════════════════╗',
    '  ║          대 운 흐 름 도              ║',
    '  ╚═══════════════════════════════════════╝',
    '',
  ];

  // 타임라인 형태
  for (const c of cycles) {
    const isCurrent = currentAge >= c.startAge && currentAge <= c.endAge;
    const elName = ELEMENT_NAMES[c.pillar.stem.element];
    const pointer = isCurrent ? '▶' : ' ';
    const bracket = isCurrent ? ['【', '】'] : ['  ', '  '];
    const age = `${c.startAge}-${c.endAge}세`;

    lines.push(
      `  ${pointer} ${bracket[0]}${padKr(age, 8)} ${c.pillar.ganjiKorean}(${c.pillar.ganjiHanja}) · ${elName.korean}${bracket[1]}`
    );

    if (isCurrent) {
      const progress = Math.min(100, Math.round(((currentAge - c.startAge) / 10) * 100));
      const filled = Math.round(progress / 5);
      const bar = '▓'.repeat(filled) + '░'.repeat(20 - filled);
      lines.push(`         ${bar} ${progress}% 진행`);
    }
  }

  lines.push('');

  // 세운
  lines.push(`  ── 올해 세운 (${yl.year}년) ──`);
  const ylEl = ELEMENT_NAMES[yl.pillar.stem.element];
  lines.push(`  ${yl.pillar.ganjiKorean}(${yl.pillar.ganjiHanja}) · ${ylEl.korean}(${ylEl.hanja})의 해`);
  lines.push('');

  return lines;
}

/**
 * 종합 풀이 요약 카드 (종합 풀이 방)
 */
export function generateSynthesisCard(saju: SajuResult): string[] {
  const dm = saju.dayMaster;
  const dmEl = ELEMENT_NAMES[dm.element];
  const fe = saju.fiveElements;
  const domEl = ELEMENT_NAMES[fe.dominant];
  const defEl = ELEMENT_NAMES[fe.deficient];

  // 가장 많은 십성
  const godCounts: Record<string, number> = {};
  for (const g of saju.tenGods) {
    godCounts[g.name] = (godCounts[g.name] || 0) + 1;
  }
  const topGod = Object.entries(godCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  // 현재 대운
  const currentAge = new Date().getFullYear() - saju.birthInfo.year;
  const currentCycle = saju.luckCycles.find(c => currentAge >= c.startAge && currentAge <= c.endAge);

  const lines: string[] = [
    '',
    '  ┌─────────────────────────────────────────┐',
    `  │  ${saju.birthInfo.name}의 사주 요약 카드              │`,
    '  ├─────────────────────────────────────────┤',
    `  │  일간: ${dm.korean}${dmEl.hanja}(${dm.yinYang === 'yang' ? '양' : '음'})  ${saju.dayPillar.branch.animal}띠            │`,
    `  │  강한 오행: ${domEl.korean}(${domEl.hanja})    약한 오행: ${defEl.korean}(${defEl.hanja})  │`,
    `  │  주요 십성: ${topGod}                            │`,
  ];

  if (currentCycle) {
    lines.push(`  │  현재 대운: ${currentCycle.pillar.ganjiKorean} (${currentCycle.startAge}-${currentCycle.endAge}세)        │`);
  }

  // 신살
  if (saju.sinsals.length > 0) {
    const sinsalNames = saju.sinsals.map(s => s.name).join(', ');
    lines.push(`  │  신살: ${sinsalNames}${' '.repeat(Math.max(0, 30 - sinsalNames.length))}│`);
  }

  lines.push('  └─────────────────────────────────────────┘');
  lines.push('');

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
