import { SajuResult, FiveElement, TenGodEntry } from '@/lib/saju/types';
import { ELEMENT_NAMES, BRANCH_HIDDEN_STEMS, STEM_KOREAN_TO_INDEX, HEAVENLY_STEMS } from '@/lib/saju/constants';
import { getCurrentLuckInfo, countTenGods } from '@/lib/saju/helpers';
import { padKr } from '@/lib/utils/string';

/** 색상 포함 라인 */
export interface PillarLine {
  text: string;
  color?: string;
}

/** 오행별 색상 */
const EL_COLOR: Record<FiveElement, string> = {
  wood:  'text-[#44cc44]',
  fire:  'text-[#ff5544]',
  earth: 'text-[#ccaa44]',
  metal: 'text-[#dddddd]',
  water: 'text-[#4488ff]',
};

/** 오행별 기호 */
const EL_SYMBOL: Record<FiveElement, string> = {
  wood:  '🌿',
  fire:  '🔥',
  earth: '⛰️',
  metal: '⚔️',
  water: '💧',
};

const DIM = 'text-[#6B5528]';
const HEADER = 'text-[#48B8A8]';
const LABEL = 'text-[#8A7848]';
const ACCENT = 'text-[#FFD060]';
const SINSAL_COLOR = 'text-[#cc88ff]';
const YANG_COLOR = 'text-[#ff6655]';
const YIN_COLOR = 'text-[#5599ff]';

function fmt(s: string, w: number = 10): string {
  return padKr(s, w);
}

/** 두 블록을 좌우 병합 */
function mergeBlocks(leftBlock: PillarLine[], rightBlock: PillarLine[], leftWidth: number, gap: number = 3): PillarLine[] {
  const maxRows = Math.max(leftBlock.length, rightBlock.length);
  const spacer = ' '.repeat(gap);
  const lines: PillarLine[] = [];

  for (let i = 0; i < maxRows; i++) {
    const l = leftBlock[i];
    const r = rightBlock[i];
    const lText = l ? padKr(l.text, leftWidth) : ' '.repeat(leftWidth);
    const rText = r ? r.text : '';
    lines.push({ text: `  ${lText}${spacer}${rText}`, color: l?.color || r?.color || LABEL });
  }

  return lines;
}

/** 세 블록을 좌우 병합 (3열) */
function merge3Blocks(a: PillarLine[], b: PillarLine[], c: PillarLine[], colWidth: number, gap: number = 2): PillarLine[] {
  const maxRows = Math.max(a.length, b.length, c.length);
  const spacer = ' '.repeat(gap);
  const lines: PillarLine[] = [];

  for (let i = 0; i < maxRows; i++) {
    const la = a[i];
    const lb = b[i];
    const lc = c[i];
    const aText = la ? padKr(la.text, colWidth) : ' '.repeat(colWidth);
    const bText = lb ? padKr(lb.text, colWidth) : ' '.repeat(colWidth);
    const cText = lc ? lc.text : '';
    // 색상 우선순위: 왼→중→우
    const color = la?.color || lb?.color || lc?.color || LABEL;
    lines.push({ text: `  ${aText}${spacer}${bText}${spacer}${cText}`, color });
  }

  return lines;
}

/** 블록들을 세로로 쌓기 (모바일 1열) */
function stackBlocks(...blocks: PillarLine[][]): PillarLine[] {
  const lines: PillarLine[] = [];
  for (const block of blocks) {
    for (const line of block) {
      lines.push({ text: `  ${line.text}`, color: line.color });
    }
    lines.push({ text: '' });
  }
  return lines;
}

/** 지장간 문자열 생성 */
function getHiddenStems(branchKorean: string): string {
  const hidden = BRANCH_HIDDEN_STEMS[branchKorean];
  if (!hidden) return '--';
  return hidden.map(h => h.stem).join('·');
}

/** 십성 찾기 */
function findTenGod(tenGods: TenGodEntry[], position: string): string {
  const god = tenGods.find(g => g.position === position);
  return god ? god.name : '--';
}

/** 음양 기호 */
function yinYangSymbol(yy: 'yang' | 'yin'): string {
  return yy === 'yang' ? '陽' : '陰';
}

/**
 * 사주팔자 만세력 결과를 색상 포함 라인 배열로 생성한다.
 * @param compact true이면 하단 정보를 1열(세로)로 배치 (모바일)
 */
export function generatePillarLines(saju: SajuResult, compact: boolean = false): PillarLine[] {
  const { yearPillar: y, monthPillar: m, dayPillar: d, hourPillar: h } = saju;
  const lines: PillarLine[] = [];

  // 일간 정보
  const dmEl = ELEMENT_NAMES[saju.dayMaster.element];
  const yinyang = saju.dayMaster.yinYang === 'yang' ? '양(陽)' : '음(陰)';
  const { currentAge } = getCurrentLuckInfo(saju);

  // ── 상단 프레임 ──
  lines.push({ text: '' });
  lines.push({ text: '  ┌─────────────────────────────────────────────────┐', color: HEADER });
  lines.push({ text: `  │  ${padKr(`${saju.birthInfo.name}의 만세력`, 47)}│`, color: HEADER });
  lines.push({ text: '  └─────────────────────────────────────────────────┘', color: HEADER });

  // ── 생년월일 정보 ──
  const bi = saju.birthInfo;
  const hourStr = bi.hour !== null ? `${bi.hour}시 ${bi.minute}분` : '시간 모름';
  const genderStr = bi.gender === 'male' ? '남(乾)' : '여(坤)';
  lines.push({ text: `  ${bi.year}년 ${bi.month}월 ${bi.day}일 ${hourStr} · ${genderStr} · 만 ${currentAge}세`, color: LABEL });
  lines.push({ text: '' });

  // ── 일간 요약 ──
  const dmSymbol = EL_SYMBOL[saju.dayMaster.element];
  lines.push({ text: `  ${dmSymbol} 일간 ${saju.dayMaster.korean}(${saju.dayMaster.hanja}) · ${dmEl.korean}(${dmEl.hanja}) · ${yinyang} · ${y.branch.animal}띠`, color: ACCENT });
  lines.push({ text: '' });

  // ── 사주 테이블 (확장) ──
  lines.push({ text: '          시주        일주        월주        연주', color: LABEL });
  lines.push({ text: '  ╔══════════╦══════════╦══════════╦══════════╗', color: DIM });

  // Row 1: 십성 (Ten Gods)
  const tenGodRow = [
    h ? findTenGod(saju.tenGods, '시간') : '--',
    '일간(나)',
    findTenGod(saju.tenGods, '월간'),
    findTenGod(saju.tenGods, '연간'),
  ];
  lines.push({ text: '  ║' + tenGodRow.map(s => fmt(s, 10)).join('║') + '║  십성', color: 'text-[#cc88ff]' });
  lines.push({ text: '  ╠══════════╬══════════╬══════════╬══════════╣', color: DIM });

  // Row 2: 천간 (Heavenly Stems) with element + yin/yang
  const stems = [
    h ? `${h.stem.korean}(${h.stem.hanja})` : '  --  ',
    `${d.stem.korean}(${d.stem.hanja})`,
    `${m.stem.korean}(${m.stem.hanja})`,
    `${y.stem.korean}(${y.stem.hanja})`,
  ];
  const stemElements: (FiveElement | null)[] = [
    h ? h.stem.element : null, d.stem.element, m.stem.element, y.stem.element,
  ];

  lines.push({ text: '  ║' + stems.map((s, i) => {
    const el = stemElements[i];
    const elTag = el ? ` ${ELEMENT_NAMES[el].hanja}` : '   ';
    return fmt(s + elTag, 10);
  }).join('║') + '║  천간', color: DIM });

  // Row 2.5: 음양 표시
  const stemYinYang = [
    h ? yinYangSymbol(h.stem.yinYang) : '--',
    yinYangSymbol(d.stem.yinYang),
    yinYangSymbol(m.stem.yinYang),
    yinYangSymbol(y.stem.yinYang),
  ];
  lines.push({ text: '  ║' + stemYinYang.map(s => fmt(s, 10)).join('║') + '║', color: LABEL });

  lines.push({ text: '  ╠══════════╬══════════╬══════════╬══════════╣', color: DIM });

  // Row 3: 지지 (Earthly Branches) with element + animal
  const branches = [
    h ? `${h.branch.korean}(${h.branch.hanja})` : '  --  ',
    `${d.branch.korean}(${d.branch.hanja})`,
    `${m.branch.korean}(${m.branch.hanja})`,
    `${y.branch.korean}(${y.branch.hanja})`,
  ];
  const branchElements: (FiveElement | null)[] = [
    h ? h.branch.element : null, d.branch.element, m.branch.element, y.branch.element,
  ];

  lines.push({ text: '  ║' + branches.map((s, i) => {
    const el = branchElements[i];
    const elTag = el ? ` ${ELEMENT_NAMES[el].hanja}` : '   ';
    return fmt(s + elTag, 10);
  }).join('║') + '║  지지', color: DIM });

  // Row 3.5: 띠 동물
  const animals = [
    h ? h.branch.animal : '--',
    d.branch.animal,
    m.branch.animal,
    y.branch.animal,
  ];
  lines.push({ text: '  ║' + animals.map(s => fmt(s, 10)).join('║') + '║', color: LABEL });

  lines.push({ text: '  ╠══════════╬══════════╬══════════╬══════════╣', color: DIM });

  // Row 4: 지장간 (Hidden Stems)
  const hiddenStems = [
    h ? getHiddenStems(h.branch.korean) : '--',
    getHiddenStems(d.branch.korean),
    getHiddenStems(m.branch.korean),
    getHiddenStems(y.branch.korean),
  ];
  lines.push({ text: '  ║' + hiddenStems.map(s => fmt(s, 10)).join('║') + '║  지장간', color: 'text-[#88aa66]' });

  lines.push({ text: '  ╠══════════╬══════════╬══════════╬══════════╣', color: DIM });

  // Row 5: 지지 십성
  const branchTenGods = [
    h ? findTenGod(saju.tenGods, '시지') : '--',
    findTenGod(saju.tenGods, '일지'),
    findTenGod(saju.tenGods, '월지'),
    findTenGod(saju.tenGods, '연지'),
  ];
  lines.push({ text: '  ║' + branchTenGods.map(s => fmt(s, 10)).join('║') + '║  지지십성', color: 'text-[#cc88ff]' });

  lines.push({ text: '  ╠══════════╬══════════╬══════════╬══════════╣', color: DIM });

  // Row 6: 12운성
  const stageMap: Record<string, string> = {};
  for (const s of saju.twelveStages) {
    stageMap[s.position] = s.stage;
  }
  const stages = [
    stageMap['시지'] || '--', stageMap['일지'] || '--',
    stageMap['월지'] || '--', stageMap['연지'] || '--',
  ];

  lines.push({ text: '  ║' + stages.map(s => fmt(s, 10)).join('║') + '║  12운성', color: 'text-[#66bbaa]' });
  lines.push({ text: '  ╚══════════╩══════════╩══════════╩══════════╝', color: DIM });

  lines.push({ text: '' });

  // ── 하단 정보 블록 생성 ──
  const fe = saju.fiveElements;
  const elements: FiveElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];
  const totalScore = elements.reduce((sum, e) => sum + (fe[e] as number), 0);
  const max = Math.max(...elements.map(e => fe[e] as number), 1);
  const domEl = ELEMENT_NAMES[fe.dominant];
  const defEl = ELEMENT_NAMES[fe.deficient];

  // ── 오행 분포 (컴팩트) ──
  const elBlock: PillarLine[] = [];
  elBlock.push({ text: '── 오행 분포 ──', color: HEADER });
  for (const el of elements) {
    const score = fe[el] as number;
    const barLen = Math.round((score / max) * 8);
    const bar = '█'.repeat(barLen) + '░'.repeat(8 - barLen);
    const elName = ELEMENT_NAMES[el];
    const pct = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
    const tag = el === fe.dominant ? '◀' : el === fe.deficient ? '◁' : ' ';
    elBlock.push({
      text: `${padKr(`${elName.korean}(${elName.hanja})`, 7)} ${bar} ${padKr(`${pct}%`, 4)}${tag}`,
      color: EL_COLOR[el],
    });
  }
  elBlock.push({ text: '' });
  elBlock.push({ text: `강 ${domEl.korean} ${EL_SYMBOL[fe.dominant]} ━━ 약 ${defEl.korean} ${EL_SYMBOL[fe.deficient]}`, color: LABEL });

  // ── 십성 분포 ──
  const tenGodsGroupBlock: PillarLine[] = [];
  tenGodsGroupBlock.push({ text: '── 십성 분포 ──', color: HEADER });
  const tenGodGroups = [
    { label: '비겁(자아)', gods: ['비견', '겁재'] },
    { label: '식상(표현)', gods: ['식신', '상관'] },
    { label: '재성(재물)', gods: ['편재', '정재'] },
    { label: '관성(명예)', gods: ['편관', '정관'] },
    { label: '인성(학문)', gods: ['편인', '정인'] },
  ];
  const godCounts: Record<string, number> = {};
  for (const g of saju.tenGods) {
    godCounts[g.name] = (godCounts[g.name] || 0) + 1;
  }
  for (const group of tenGodGroups) {
    const total = group.gods.reduce((sum, g) => sum + (godCounts[g] || 0), 0);
    const dots = '●'.repeat(total) + '○'.repeat(Math.max(0, 4 - total));
    const detail = group.gods.filter(g => (godCounts[g] || 0) > 0).join(', ');
    tenGodsGroupBlock.push({ text: `${padKr(group.label, 10)} ${dots} ${detail || '-'}`, color: SINSAL_COLOR });
  }

  // ── 신살 ──
  const sinsalBlock: PillarLine[] = [];
  sinsalBlock.push({ text: '── 신살(神殺) ──', color: HEADER });
  if (saju.sinsals.length > 0) {
    for (const s of saju.sinsals) {
      sinsalBlock.push({ text: `◈ ${s.name}`, color: SINSAL_COLOR });
      sinsalBlock.push({ text: `  ${s.description}`, color: LABEL });
    }
  } else {
    sinsalBlock.push({ text: '특별한 신살 없음', color: LABEL });
  }

  // ── 일간 상세 ──
  const ilganBlock: PillarLine[] = [];
  ilganBlock.push({ text: '── 일간(日干) ──', color: HEADER });
  ilganBlock.push({ text: `${saju.dayMaster.korean}(${saju.dayMaster.hanja}) ${dmEl.korean}(${dmEl.hanja}) ${yinyang}`, color: ACCENT });
  ilganBlock.push({ text: `${y.branch.animal}띠 · ${d.ganjiKorean}(${d.ganjiHanja})일주`, color: ACCENT });
  const dmScore = fe[saju.dayMaster.element] as number;
  const dmPct = totalScore > 0 ? Math.round((dmScore / totalScore) * 100) : 0;
  const strength = dmPct >= 30 ? '신강(身強)' : dmPct >= 15 ? '중화(中和)' : '신약(身弱)';
  ilganBlock.push({ text: `비중 ${dmPct}% → ${strength}`, color: dmPct >= 30 ? YANG_COLOR : dmPct >= 15 ? 'text-[#44cc44]' : YIN_COLOR });

  // ── 현재 운 ──
  const { currentCycle } = getCurrentLuckInfo(saju);
  const luckBlock: PillarLine[] = [];
  luckBlock.push({ text: '── 현재 운 ──', color: HEADER });
  if (currentCycle) {
    const clEl = ELEMENT_NAMES[currentCycle.pillar.stem.element];
    luckBlock.push({
      text: `대운 ${currentCycle.pillar.ganjiKorean} · ${clEl.korean}`,
      color: EL_COLOR[currentCycle.pillar.stem.element],
    });
    luckBlock.push({ text: `${currentCycle.startAge}~${currentCycle.endAge}세`, color: LABEL });
  }
  const yl = saju.yearlyLuck;
  const ylEl = ELEMENT_NAMES[yl.pillar.stem.element];
  luckBlock.push({
    text: `세운 ${yl.year}년 ${yl.pillar.ganjiKorean} · ${ylEl.korean}`,
    color: EL_COLOR[yl.pillar.stem.element],
  });

  // ── 공망 ──
  const gongmangBlock: PillarLine[] = [];
  gongmangBlock.push({ text: '── 공망(空亡) ──', color: HEADER });
  const gm = saju.gongmang;
  gongmangBlock.push({ text: `공망: ${gm.branches.join(', ')}`, color: LABEL });
  if (gm.affectedPillars.length > 0) {
    gongmangBlock.push({ text: `영향: ${gm.affectedPillars.join(', ')}`, color: YANG_COLOR });
  } else {
    gongmangBlock.push({ text: '해당 없음 (해소)', color: 'text-[#44cc44]' });
  }

  // ── 레이아웃: 모바일(1열) / 데스크톱(3열) ──
  if (compact) {
    lines.push(...stackBlocks(elBlock, tenGodsGroupBlock, sinsalBlock, ilganBlock, luckBlock, gongmangBlock));
  } else {
    // Row 1: 오행 분포 | 십성 분포 | 신살
    lines.push(...merge3Blocks(elBlock, tenGodsGroupBlock, sinsalBlock, 28));
    lines.push({ text: '' });
    // Row 2: 일간 상세 | 현재 운 | 공망
    lines.push(...merge3Blocks(ilganBlock, luckBlock, gongmangBlock, 28));
    lines.push({ text: '' });
  }

  return lines;
}