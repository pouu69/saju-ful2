import { SajuResult } from '@/lib/saju/types';
import { ELEMENT_NAMES } from '@/lib/saju/constants';

/**
 * 사주팔자를 ASCII 테이블 문자열 배열로 생성한다.
 */
export function generatePillarLines(saju: SajuResult): string[] {
  const { yearPillar: y, monthPillar: m, dayPillar: d, hourPillar: h } = saju;

  const hStem = h ? `${h.stem.korean}(${h.stem.hanja})` : '  --  ';
  const hBranch = h ? `${h.branch.korean}(${h.branch.hanja})` : '  --  ';
  const hEl = h
    ? `${ELEMENT_NAMES[h.stem.element].korean}${ELEMENT_NAMES[h.branch.element].korean}`
    : ' -- ';

  const fmt = (s: string, w: number = 8): string => {
    const len = getDisplayWidth(s);
    const pad = Math.max(0, w - len);
    return s + ' '.repeat(pad);
  };

  return [
    '  ┌────────┬────────┬────────┬────────┐',
    '  │ 시 주  │ 일 주  │ 월 주  │ 연 주  │',
    '  ├────────┼────────┼────────┼────────┤',
    `  │${fmt(hStem)}│${fmt(`${d.stem.korean}(${d.stem.hanja})`)}│${fmt(`${m.stem.korean}(${m.stem.hanja})`)}│${fmt(`${y.stem.korean}(${y.stem.hanja})`)}│ 천간`,
    `  │${fmt(hBranch)}│${fmt(`${d.branch.korean}(${d.branch.hanja})`)}│${fmt(`${m.branch.korean}(${m.branch.hanja})`)}│${fmt(`${y.branch.korean}(${y.branch.hanja})`)}│ 지지`,
    '  ├────────┼────────┼────────┼────────┤',
    `  │${fmt(hEl)}│${fmt(`${ELEMENT_NAMES[d.stem.element].korean}${ELEMENT_NAMES[d.branch.element].korean}`)}│${fmt(`${ELEMENT_NAMES[m.stem.element].korean}${ELEMENT_NAMES[m.branch.element].korean}`)}│${fmt(`${ELEMENT_NAMES[y.stem.element].korean}${ELEMENT_NAMES[y.branch.element].korean}`)}│ 오행`,
    '  └────────┴────────┴────────┴────────┘',
  ];
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
