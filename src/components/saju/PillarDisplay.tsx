import { SajuResult } from '@/lib/saju/types';
import { ELEMENT_NAMES } from '@/lib/saju/constants';

/**
 * 사주팔자 + 12운성을 ASCII 테이블 문자열 배열로 생성한다.
 */
export function generatePillarLines(saju: SajuResult): string[] {
  const { yearPillar: y, monthPillar: m, dayPillar: d, hourPillar: h } = saju;

  const hStem = h ? `${h.stem.korean}(${h.stem.hanja})` : '  --  ';
  const hBranch = h ? `${h.branch.korean}(${h.branch.hanja})` : '  --  ';
  const hEl = h
    ? `${ELEMENT_NAMES[h.stem.element].korean}${ELEMENT_NAMES[h.branch.element].korean}`
    : ' -- ';

  // 12운성 찾기
  const stageMap: Record<string, string> = {};
  for (const s of saju.twelveStages) {
    stageMap[s.position] = s.stage;
  }
  const hStage = stageMap['시지'] || '--';
  const dStage = stageMap['일지'] || '--';
  const mStage = stageMap['월지'] || '--';
  const yStage = stageMap['연지'] || '--';

  const lines = [
    '  ┌────────┬────────┬────────┬────────┐',
    '  │ 시 주  │ 일 주  │ 월 주  │ 연 주  │',
    '  ├────────┼────────┼────────┼────────┤',
    `  │${fmt(hStem)}│${fmt(`${d.stem.korean}(${d.stem.hanja})`)}│${fmt(`${m.stem.korean}(${m.stem.hanja})`)}│${fmt(`${y.stem.korean}(${y.stem.hanja})`)}│ 천간`,
    `  │${fmt(hBranch)}│${fmt(`${d.branch.korean}(${d.branch.hanja})`)}│${fmt(`${m.branch.korean}(${m.branch.hanja})`)}│${fmt(`${y.branch.korean}(${y.branch.hanja})`)}│ 지지`,
    '  ├────────┼────────┼────────┼────────┤',
    `  │${fmt(hEl)}│${fmt(`${ELEMENT_NAMES[d.stem.element].korean}${ELEMENT_NAMES[d.branch.element].korean}`)}│${fmt(`${ELEMENT_NAMES[m.stem.element].korean}${ELEMENT_NAMES[m.branch.element].korean}`)}│${fmt(`${ELEMENT_NAMES[y.stem.element].korean}${ELEMENT_NAMES[y.branch.element].korean}`)}│ 오행`,
    `  │${fmt(hStage)}│${fmt(dStage)}│${fmt(mStage)}│${fmt(yStage)}│ 12운성`,
    '  └────────┴────────┴────────┴────────┘',
  ];

  // 부가 정보 섹션
  lines.push('');

  // 신살
  if (saju.sinsals.length > 0) {
    lines.push('  ── 신살(神殺) ──');
    for (const s of saju.sinsals) {
      lines.push(`    ${s.name} — ${s.description}`);
    }
  } else {
    lines.push('  ── 신살(神殺) ──');
    lines.push('    특별한 신살이 없습니다.');
  }

  lines.push('');

  // 공망
  const gm = saju.gongmang;
  lines.push(`  ── 공망(空亡) ──`);
  lines.push(`    공망 지지: ${gm.branches.join(', ')}`);
  if (gm.affectedPillars.length > 0) {
    lines.push(`    영향 기둥: ${gm.affectedPillars.join(', ')} — 해당 기둥의 기운이 약화될 수 있음`);
  } else {
    lines.push('    사주 내 공망에 해당하는 기둥 없음');
  }

  lines.push('');

  // 일간 요약
  const dmEl = ELEMENT_NAMES[saju.dayMaster.element];
  const yinyang = saju.dayMaster.yinYang === 'yang' ? '양(陽)' : '음(陰)';
  lines.push(`  ── 일간(日干) ──`);
  lines.push(`    ${saju.dayMaster.korean}${dmEl.hanja} · ${dmEl.korean} · ${yinyang} · ${saju.dayPillar.branch.animal}띠`);

  return lines;
}

function fmt(s: string, w: number = 8): string {
  const len = getDisplayWidth(s);
  const pad = Math.max(0, w - len);
  return s + ' '.repeat(pad);
}

function getDisplayWidth(str: string): number {
  let width = 0;
  for (const char of str) {
    const code = char.charCodeAt(0);
    if (
      (code >= 0xAC00 && code <= 0xD7AF) ||
      (code >= 0x4E00 && code <= 0x9FFF) ||
      (code >= 0x3400 && code <= 0x4DBF) ||
      (code >= 0xFF00 && code <= 0xFFEF)
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}
