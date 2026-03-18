import { SajuResult, FiveElement } from '@/lib/saju/types';
import { ELEMENT_NAMES } from '@/lib/saju/constants';
import { countTenGods, getCurrentLuckInfo } from '@/lib/saju/helpers';
import { padKr } from '@/lib/utils/string';

/** 색상 포함 라인 */
export interface ChartLine {
  text: string;
  color?: string;
}

/** 오행별 색상 */
const ELEMENT_COLORS: Record<FiveElement, string> = {
  wood:  'text-[#44cc44]',
  fire:  'text-[#ff5544]',
  earth: 'text-[#ccaa44]',
  metal: 'text-[#dddddd]',
  water: 'text-[#4488ff]',
};

const HEADER = 'text-[#00aaaa]';
const LABEL = 'text-[#888888]';

/** 두 블록을 좌우 병합 */
function mergeBlocks(left: ChartLine[], right: ChartLine[], leftWidth: number, gap: number = 3): ChartLine[] {
  const maxRows = Math.max(left.length, right.length);
  const spacer = ' '.repeat(gap);
  const lines: ChartLine[] = [];
  for (let i = 0; i < maxRows; i++) {
    const l = left[i];
    const r = right[i];
    const lText = l ? padKr(l.text, leftWidth) : ' '.repeat(leftWidth);
    const rText = r ? r.text : '';
    lines.push({ text: `  ${lText}${spacer}${rText}`, color: l?.color || r?.color });
  }
  return lines;
}

/** 블록을 세로로 쌓기 */
function stackBlocks(...blocks: ChartLine[][]): ChartLine[] {
  const lines: ChartLine[] = [];
  for (const block of blocks) {
    for (const line of block) {
      lines.push({ text: `  ${line.text}`, color: line.color });
    }
    lines.push({ text: '' });
  }
  return lines;
}

// ────────────────────────────────────────────
// 오행의 방
// ────────────────────────────────────────────

export function generateElementChart(saju: SajuResult, compact: boolean = false): ChartLine[] {
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

  // 바 차트 블록
  const barBlock: ChartLine[] = [];
  barBlock.push({ text: '── 오행 분포 ──', color: HEADER });
  for (const el of elements) {
    const score = fe[el] as number;
    const barLen = Math.round((score / max) * 15);
    const bar = '█'.repeat(barLen) + '░'.repeat(15 - barLen);
    const name = ELEMENT_NAMES[el];
    const marker = el === fe.dominant ? ' ◀강' : el === fe.deficient ? ' ◁약' : '    ';
    barBlock.push({
      text: `${padKr(`${name.korean}(${name.hanja})`, 7)} ${bar} ${padKr(`${score}`, 4)}${marker}`,
      color: ELEMENT_COLORS[el],
    });
  }

  // 요약 블록
  const domEl = ELEMENT_NAMES[fe.dominant];
  const defEl = ELEMENT_NAMES[fe.deficient];
  const summaryBlock: ChartLine[] = [];
  summaryBlock.push({ text: '── 균형 요약 ──', color: HEADER });
  summaryBlock.push({ text: `강한 오행: ${domEl.korean}(${domEl.hanja})`, color: ELEMENT_COLORS[fe.dominant] });
  summaryBlock.push({ text: `약한 오행: ${defEl.korean}(${defEl.hanja})`, color: ELEMENT_COLORS[fe.deficient] });
  summaryBlock.push({ text: '' });
  summaryBlock.push({ text: '── 상생 관계 ──', color: HEADER });
  summaryBlock.push({ text: '목→화→토→금→수→목', color: LABEL });
  summaryBlock.push({ text: `${domEl.korean}이 생하는 것을 활용하고`, color: LABEL });
  summaryBlock.push({ text: `${defEl.korean}을 보완하시오.`, color: LABEL });

  if (compact) {
    lines.push(...stackBlocks(barBlock, summaryBlock));
  } else {
    lines.push(...mergeBlocks(barBlock, summaryBlock, 34));
    lines.push({ text: '' });
  }

  return lines;
}

// ────────────────────────────────────────────
// 십성의 방
// ────────────────────────────────────────────

export function generateTenGodsChart(saju: SajuResult, compact: boolean = false): ChartLine[] {
  const gods = saju.tenGods;

  const counts: Record<string, number> = {};
  for (const g of gods) {
    counts[g.name] = (counts[g.name] || 0) + 1;
  }

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

  // 그룹 분포 블록
  const groupBlock: ChartLine[] = [];
  groupBlock.push({ text: '── 십성 그룹 ──', color: HEADER });
  for (const group of groups) {
    const total = group.gods.reduce((sum, g) => sum + (counts[g] || 0), 0);
    const dots = '●'.repeat(total) + '○'.repeat(Math.max(0, 4 - total));
    const detail = group.gods.map(g => (counts[g] || 0) > 0 ? g : '').filter(Boolean).join(', ');
    groupBlock.push({ text: `${padKr(group.label, 12)} ${dots}  ${detail || '-'}` });
  }

  // 기둥별 배치 블록
  const positions = ['연간', '월간', '시간'];
  const branchPositions = ['연지', '월지', '일지', '시지'];

  const pillarBlock: ChartLine[] = [];
  pillarBlock.push({ text: '── 기둥별 배치 ──', color: HEADER });
  const stemLine = positions.map(p => {
    const g = gods.find(x => x.position === p);
    return g ? padKr(g.name, 6) : padKr('--', 6);
  });
  pillarBlock.push({ text: `천간: ${stemLine.join(' ')}` });

  const branchLine = branchPositions.map(p => {
    const g = gods.find(x => x.position === p);
    return g ? padKr(g.name, 6) : padKr('--', 6);
  });
  pillarBlock.push({ text: `지지: ${branchLine.join(' ')}` });

  if (compact) {
    lines.push(...stackBlocks(groupBlock, pillarBlock));
  } else {
    lines.push(...mergeBlocks(groupBlock, pillarBlock, 34));
    lines.push({ text: '' });
  }

  return lines;
}

// ────────────────────────────────────────────
// 운세의 방 (세로 유지)
// ────────────────────────────────────────────

export function generateLuckTimeline(saju: SajuResult): ChartLine[] {
  const cycles = saju.luckCycles;
  const { currentAge } = getCurrentLuckInfo(saju);
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
  lines.push({ text: `  ── 올해 세운 (${yl.year}년) ──`, color: HEADER });
  const ylEl = ELEMENT_NAMES[yl.pillar.stem.element];
  lines.push({
    text: `  ${yl.pillar.ganjiKorean}(${yl.pillar.ganjiHanja}) · ${ylEl.korean}(${ylEl.hanja})의 해`,
    color: ELEMENT_COLORS[yl.pillar.stem.element],
  });
  lines.push({ text: '' });

  return lines;
}

// ────────────────────────────────────────────
// 종합 풀이
// ────────────────────────────────────────────

export function generateSynthesisCard(saju: SajuResult, compact: boolean = false): ChartLine[] {
  const dm = saju.dayMaster;
  const dmEl = ELEMENT_NAMES[dm.element];
  const fe = saju.fiveElements;
  const domEl = ELEMENT_NAMES[fe.dominant];
  const defEl = ELEMENT_NAMES[fe.deficient];

  const sorted = countTenGods(saju.tenGods);
  const topGod = sorted[0]?.[0] || '-';

  const { currentCycle } = getCurrentLuckInfo(saju);

  const lines: ChartLine[] = [
    { text: '' },
    { text: '  ╔═══════════════════════════════════════╗', color: 'text-yellow-300' },
    { text: `  ║   ${saju.birthInfo.name}의 사주 요약`, color: 'text-yellow-300' },
    { text: '  ╚═══════════════════════════════════════╝', color: 'text-yellow-300' },
    { text: '' },
  ];

  // 기본 정보 블록
  const infoBlock: ChartLine[] = [];
  infoBlock.push({ text: '── 기본 정보 ──', color: HEADER });
  infoBlock.push({ text: `일간     ${dm.korean}${dmEl.hanja}(${dm.yinYang === 'yang' ? '양' : '음'}) · ${saju.dayPillar.branch.animal}띠`, color: ELEMENT_COLORS[dm.element] });
  infoBlock.push({ text: `강한오행 ${domEl.korean}(${domEl.hanja})`, color: ELEMENT_COLORS[fe.dominant] });
  infoBlock.push({ text: `약한오행 ${defEl.korean}(${defEl.hanja})`, color: ELEMENT_COLORS[fe.deficient] });
  infoBlock.push({ text: `주요십성 ${topGod}` });
  if (currentCycle) {
    const clEl = ELEMENT_NAMES[currentCycle.pillar.stem.element];
    infoBlock.push({
      text: `현재대운 ${currentCycle.pillar.ganjiKorean}(${currentCycle.startAge}-${currentCycle.endAge}세) · ${clEl.korean}`,
      color: ELEMENT_COLORS[currentCycle.pillar.stem.element],
    });
  }

  // 신살 블록
  const sinsalBlock: ChartLine[] = [];
  sinsalBlock.push({ text: '── 신살(神殺) ──', color: HEADER });
  if (saju.sinsals.length > 0) {
    for (const s of saju.sinsals) {
      sinsalBlock.push({ text: `${s.name} — ${s.description}`, color: 'text-[#cc88ff]' });
    }
  } else {
    sinsalBlock.push({ text: '특별한 신살 없음', color: LABEL });
  }

  if (compact) {
    lines.push(...stackBlocks(infoBlock, sinsalBlock));
  } else {
    lines.push(...mergeBlocks(infoBlock, sinsalBlock, 34));
    lines.push({ text: '' });
  }

  return lines;
}
