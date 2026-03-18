'use client';

import { ReactNode } from 'react';
import TypingEffect from './TypingEffect';

export interface LineData {
  id: string;
  text: string;
  type: 'text' | 'system' | 'ascii' | 'error' | 'prompt' | 'input' | 'streaming';
  color?: string;
  typing?: boolean;
}

interface TerminalLineProps {
  line: LineData;
  onTypingComplete?: () => void;
  userName?: string;
}

const TYPE_STYLES: Record<string, string> = {
  text: 'text-[#00dd38]',
  system: 'text-[#00cccc] terminal-glow-strong',
  ascii: 'text-[#00ee44]',
  error: 'text-[#ff4444] terminal-glow-strong',
  prompt: 'text-[#cccc00]',
  input: 'text-[#e0e0e0] opacity-70',
  streaming: 'text-[#00dd38]',
};

// ── 하이라이트 패턴 정의 ──

// "따옴표" 키워드 → 금색 강조
// 오행 한자 패턴: 목(木), 화(火) 등 → 오행 색상
// 오행 단독: 목, 화, 토, 금, 수 (단어 경계) → 오행 색상
// 십성: 비견, 겁재, 식신 등 → 보라색
// 음양: 양(陽), 음(陰) → 빨강/파랑
// 구분선: ━━━, ═══ → 시안
// 섹션 마커: ── 텍스트 ── → 시안

const ELEMENT_COLOR: Record<string, string> = {
  '목': 'text-[#44cc44]', '木': 'text-[#44cc44]',
  '화': 'text-[#ff5544]', '火': 'text-[#ff5544]',
  '토': 'text-[#ccaa44]', '土': 'text-[#ccaa44]',
  '금': 'text-[#dddddd]', '金': 'text-[#dddddd]',
  '수': 'text-[#4488ff]', '水': 'text-[#4488ff]',
};

const TEN_GODS = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];
// 12운성: 한 글자(쇠,병,사,묘,절,태,양)는 일반 텍스트와 오탐이 심해 2글자 이상만 하이라이트
const TWELVE_STAGES = ['장생', '목욕', '관대', '건록', '제왕'];

// 한자 → 오행 매핑 (모듈 레벨 상수)
const HANJA_TO_ELEMENT: Record<string, string> = {
  '甲': '목', '乙': '목', '丙': '화', '丁': '화', '戊': '토',
  '己': '토', '庚': '금', '辛': '금', '壬': '수', '癸': '수',
  '子': '수', '丑': '토', '寅': '목', '卯': '목', '辰': '토', '巳': '화',
  '午': '화', '未': '토', '申': '금', '酉': '금', '戌': '토', '亥': '수',
};

// 메인 정규식 패턴 (matchAll용 - g flag 경합 없음)
const HIGHLIGHT_PATTERN = new RegExp(
  [
    // 1. "따옴표" (스마트 따옴표 + 일반 따옴표)
    '[\u201c"][^\u201d"]+[\u201d"]',
    // 2. 오행 + 한자 괄호: 목(木)
    '(?:목\\(木\\)|화\\(火\\)|토\\(土\\)|금\\(金\\)|수\\(水\\))',
    // 3. 음양 + 한자: 양(陽), 음(陰)
    '(?:양\\(陽\\)|음\\(陰\\))',
    // 4. 십성 단어
    `(?:${TEN_GODS.join('|')})`,
    // 5. 12운성 (단어 경계 근사)
    `(?:${TWELVE_STAGES.join('|')})`,
    // 6. 구분선 / 섹션 마커
    '(?:━+[^━]*━+|═{3,}|──[^─]+──)',
    // 7. 한자 단독 (천간/지지): 甲乙丙丁戊己庚辛壬癸 子丑寅卯辰巳午未申酉戌亥
    '[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]',
  ].join('|'),
  'g'
);

function getHighlightClass(match: string): string | null {
  // 따옴표 키워드
  if ((match.startsWith('\u201c') || match.startsWith('"')) && match.length > 2) {
    return 'text-[#ffcc00] terminal-glow-strong';
  }

  // 오행 + 한자
  if (match.includes('(木)') || match.includes('(火)') || match.includes('(土)') ||
      match.includes('(金)') || match.includes('(水)')) {
    const el = match[0];
    return ELEMENT_COLOR[el] || null;
  }

  // 음양
  if (match === '양(陽)') return 'text-[#ff6644]';
  if (match === '음(陰)') return 'text-[#4488ff]';

  // 십성
  if (TEN_GODS.includes(match)) return 'text-[#cc88ff]';

  // 12운성
  if (TWELVE_STAGES.includes(match)) return 'text-[#88ccff]';

  // 구분선 / 섹션
  if (match.includes('━') || match.includes('═') || match.includes('──')) {
    return 'text-[#00aaaa]';
  }

  // 한자 (천간/지지)
  if (match.length === 1) {
    const el = HANJA_TO_ELEMENT[match];
    if (el) return ELEMENT_COLOR[el] || null;
  }

  return null;
}

function highlightText(text: string, userName?: string): ReactNode {
  // 이름 하이라이트: 이름이 포함되어 있으면 먼저 분리 후 각 파트에 키워드 하이라이트 적용
  if (userName && text.includes(userName)) {
    const nameParts: ReactNode[] = [];
    const nameSegments = text.split(userName);
    let nk = 0;
    for (let i = 0; i < nameSegments.length; i++) {
      if (nameSegments[i]) {
        nameParts.push(<span key={`seg-${nk++}`}>{highlightText(nameSegments[i])}</span>);
      }
      if (i < nameSegments.length - 1) {
        nameParts.push(
          <span key={`name-${nk++}`} className="text-[#ffaa00] font-bold terminal-glow-strong">{userName}</span>
        );
      }
    }
    return <>{nameParts}</>;
  }

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  const matches = text.matchAll(HIGHLIGHT_PATTERN);

  for (const match of matches) {
    // 이전 텍스트
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const cls = getHighlightClass(match[0]);
    if (cls) {
      parts.push(<span key={key++} className={cls}>{match[0]}</span>);
    } else {
      parts.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (parts.length === 0) return text;
  if (parts.length === 1 && typeof parts[0] === 'string') return text;
  return <>{parts}</>;
}

export default function TerminalLine({ line, onTypingComplete, userName }: TerminalLineProps) {
  const styleClass = line.color || TYPE_STYLES[line.type] || 'text-[#00dd38]';

  if (!line.text && !line.typing) {
    return <div className="h-3" />;
  }

  if (line.typing) {
    return (
      <div className={`whitespace-pre-wrap line-enter ${styleClass}`}>
        <TypingEffect text={line.text} speed={20} onComplete={onTypingComplete} />
      </div>
    );
  }

  const skipHighlight = line.type === 'ascii' || line.type === 'input' || line.type === 'error';

  return (
    <div className={`whitespace-pre-wrap line-enter ${styleClass}`}>
      {skipHighlight ? line.text : highlightText(line.text, userName)}
    </div>
  );
}
