'use client';

import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
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
  text: 'text-[#C8A030]',
  system: 'text-[#48B8A8] terminal-glow-strong',
  ascii: 'text-[#B89828]',
  error: 'text-[#ff4444] terminal-glow-strong',
  prompt: 'text-[#cccc00]',
  input: 'text-[#e0e0e0] opacity-70',
  streaming: 'text-[#C8A030]',
};

// ── 용어 툴팁 사전 ──

const TERM_TOOLTIPS: Record<string, string> = {
  // 오행
  '목(木)': '나무의 기운. 성장, 시작, 인자함. 봄, 동쪽.',
  '화(火)': '불의 기운. 열정, 표현, 예의. 여름, 남쪽.',
  '토(土)': '흙의 기운. 안정, 신뢰, 중재. 환절기, 중앙.',
  '금(金)': '쇠의 기운. 결단, 정의, 완벽. 가을, 서쪽.',
  '수(水)': '물의 기운. 지혜, 유연, 적응. 겨울, 북쪽.',
  // 십성
  '비견': '나와 같은 오행. 독립심, 자존심, 경쟁심. 형제·동료의 관계.',
  '겁재': '나와 음양만 다른 기운. 추진력, 승부욕, 모험. 강한 도전정신.',
  '식신': '내가 생(生)하는 순한 기운. 풍요, 표현력, 여유로운 재능.',
  '상관': '내가 생(生)하는 날카로운 기운. 창의력, 반골, 혁신.',
  '편재': '내가 극(剋)하는 유동적 재물. 사교력, 투자, 사업 수완.',
  '정재': '내가 극(剋)하는 안정적 재물. 근면, 저축, 꾸준한 수입.',
  '편관': '나를 극(剋)하는 강한 통제. 리더십, 결단력, 도전.',
  '정관': '나를 극(剋)하는 바른 통제. 체계, 책임감, 사회적 지위.',
  '편인': '나를 생(生)하는 비범한 학문. 독특한 사고, 기술력, 전문성.',
  '정인': '나를 생(生)하는 정통 학문. 학습 능력, 자격증, 배움의 힘.',
  // 12운성
  '장생': '새 생명의 탄생. 시작의 에너지, 낙관적.',
  '목욕': '세상에 첫 발. 변화가 많고, 감정 기복.',
  '관대': '성인식. 자신감, 사회진출, 의욕 충만.',
  '건록': '왕성한 활동기. 실력 발휘, 독립.',
  '제왕': '정점. 최고의 역량이나 고집도 강함.',
  // 음양
  '양(陽)': '밝고 능동적인 기운. 외향, 활동, 확장.',
  '음(陰)': '어둡고 수동적인 기운. 내향, 수용, 집중.',
  // 천간
  '甲': '갑목(甲木). 양(陽)의 나무. 큰 나무, 기둥, 리더십.',
  '乙': '을목(乙木). 음(陰)의 나무. 풀, 덩굴, 유연함.',
  '丙': '병화(丙火). 양(陽)의 불. 태양, 밝음, 열정.',
  '丁': '정화(丁火). 음(陰)의 불. 촛불, 따뜻함, 섬세.',
  '戊': '무토(戊土). 양(陽)의 흙. 산, 대지, 묵직함.',
  '己': '기토(己土). 음(陰)의 흙. 논밭, 정원, 포용력.',
  '庚': '경금(庚金). 양(陽)의 쇠. 바위, 칼, 강직함.',
  '辛': '신금(辛金). 음(陰)의 쇠. 보석, 바늘, 예리함.',
  '壬': '임수(壬水). 양(陽)의 물. 바다, 큰 강, 지혜.',
  '癸': '계수(癸水). 음(陰)의 물. 이슬, 비, 감수성.',
  // 지지
  '子': '자(子). 쥐띠. 수(水). 밤 11시~1시.',
  '丑': '축(丑). 소띠. 토(土). 새벽 1시~3시.',
  '寅': '인(寅). 호랑이띠. 목(木). 새벽 3시~5시.',
  '卯': '묘(卯). 토끼띠. 목(木). 오전 5시~7시.',
  '辰': '진(辰). 용띠. 토(土). 오전 7시~9시.',
  '巳': '사(巳). 뱀띠. 화(火). 오전 9시~11시.',
  '午': '오(午). 말띠. 화(火). 오전 11시~1시.',
  '未': '미(未). 양띠. 토(土). 오후 1시~3시.',
  '申': '신(申). 원숭이띠. 금(金). 오후 3시~5시.',
  '酉': '유(酉). 닭띠. 금(金). 오후 5시~7시.',
  '戌': '술(戌). 개띠. 토(土). 오후 7시~9시.',
  '亥': '해(亥). 돼지띠. 수(水). 오후 9시~11시.',
};

function getTooltipText(match: string): string | null {
  // 직접 매칭
  if (TERM_TOOLTIPS[match]) return TERM_TOOLTIPS[match];

  // 따옴표로 감싸진 키워드 → 안쪽 내용으로 검색
  if ((match.startsWith('\u201c') || match.startsWith('"')) && match.length > 2) {
    const inner = match.slice(1, -1);
    if (TERM_TOOLTIPS[inner]) return TERM_TOOLTIPS[inner];
  }

  return null;
}

// ── 하이라이트 패턴 정의 ──

const ELEMENT_COLOR: Record<string, string> = {
  '목': 'text-[#44cc44]', '木': 'text-[#44cc44]',
  '화': 'text-[#ff5544]', '火': 'text-[#ff5544]',
  '토': 'text-[#ccaa44]', '土': 'text-[#ccaa44]',
  '금': 'text-[#dddddd]', '金': 'text-[#dddddd]',
  '수': 'text-[#4488ff]', '水': 'text-[#4488ff]',
};

const TEN_GODS = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];
const TWELVE_STAGES = ['장생', '목욕', '관대', '건록', '제왕'];

const HANJA_TO_ELEMENT: Record<string, string> = {
  '甲': '목', '乙': '목', '丙': '화', '丁': '화', '戊': '토',
  '己': '토', '庚': '금', '辛': '금', '壬': '수', '癸': '수',
  '子': '수', '丑': '토', '寅': '목', '卯': '목', '辰': '토', '巳': '화',
  '午': '화', '未': '토', '申': '금', '酉': '금', '戌': '토', '亥': '수',
};

const HIGHLIGHT_PATTERN = new RegExp(
  [
    '[\u201c"][^\u201d"]+[\u201d"]',
    '(?:목\\(木\\)|화\\(火\\)|토\\(土\\)|금\\(金\\)|수\\(水\\))',
    '(?:양\\(陽\\)|음\\(陰\\))',
    `(?:${TEN_GODS.join('|')})`,
    `(?:${TWELVE_STAGES.join('|')})`,
    '(?:━+[^━]*━+|═{3,}|──[^─]+──)',
    '[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]',
  ].join('|'),
  'g'
);

function getHighlightClass(match: string): string | null {
  if ((match.startsWith('\u201c') || match.startsWith('"')) && match.length > 2) {
    return 'text-[#FFE080] terminal-glow-strong';
  }
  if (match.includes('(木)') || match.includes('(火)') || match.includes('(土)') ||
      match.includes('(金)') || match.includes('(水)')) {
    const el = match[0];
    return ELEMENT_COLOR[el] || null;
  }
  if (match === '양(陽)') return 'text-[#ff6644]';
  if (match === '음(陰)') return 'text-[#4488ff]';
  if (TEN_GODS.includes(match)) return 'text-[#cc88ff]';
  if (TWELVE_STAGES.includes(match)) return 'text-[#88ccff]';
  if (match.includes('━') || match.includes('═') || match.includes('──')) {
    return 'text-[#48B8A8]';
  }
  if (match.length === 1) {
    const el = HANJA_TO_ELEMENT[match];
    if (el) return ELEMENT_COLOR[el] || null;
  }
  return null;
}

// ── 키워드 툴팁 컴포넌트 ──

function KeywordSpan({ className, tooltip, children }: {
  className: string;
  tooltip: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setAbove(rect.bottom + 80 > window.innerHeight);
    }
    setOpen(prev => !prev);
  };

  return (
    <span ref={ref} className="keyword-tooltip-anchor relative inline">
      <span
        className={`${className} cursor-pointer underline decoration-dotted underline-offset-3 decoration-[#8A6618]`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        {children}
      </span>
      {open && (
        <span
          className={`keyword-tooltip ${above ? 'keyword-tooltip-above' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {tooltip}
        </span>
      )}
    </span>
  );
}

// ── 하이라이트 처리 ──

function highlightText(text: string, userName?: string): ReactNode {
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
          <span key={`name-${nk++}`} className="text-[#FF9030] font-bold terminal-glow-strong">{userName}</span>
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
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const cls = getHighlightClass(match[0]);
    const tooltip = getTooltipText(match[0]);

    if (cls) {
      if (tooltip) {
        parts.push(
          <KeywordSpan key={key++} className={cls} tooltip={tooltip}>
            {match[0]}
          </KeywordSpan>
        );
      } else {
        parts.push(<span key={key++} className={cls}>{match[0]}</span>);
      }
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
  const styleClass = line.color || TYPE_STYLES[line.type] || 'text-[#C8A030]';

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

  const skipHighlight = line.type === 'input' || line.type === 'error';

  return (
    <div className={`whitespace-pre-wrap line-enter ${styleClass}`}>
      {skipHighlight ? line.text : highlightText(line.text, userName)}
    </div>
  );
}
